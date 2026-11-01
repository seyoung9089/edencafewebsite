import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fetchMenu, fetchMenuGroups, type MenuGroup, type MenuItem } from '@/lib/menu'
import type { PickupDay } from '@/lib/pickup'
import { removeSiteImage, uploadSiteImage } from '@/lib/storage'
import { getErrorMessage } from '@/lib/errors'
import { buttonClass, inputClass } from './use-staff'

const CATEGORY_LABEL = { bakery: '베이커리', drink: '음료', gift: '답례품' } as const
const DAY_LABEL: Record<PickupDay, string> = { weekday: '평일(월~목)', friday: '금요일' }

/** What the staff typed into one menu row, before it is saved. */
type Draft = {
  name: string
  category: MenuItem['category']
  description: string
  price: string
  stock: string
  soldOut: boolean
  featured: boolean
  saleDays: PickupDay[]
  groupName: string
}

function toDraft(item: MenuItem): Draft {
  return {
    name: item.name,
    category: item.category,
    description: item.description,
    price: String(item.price),
    stock: item.stock === null ? '' : String(item.stock),
    soldOut: item.sold_out,
    featured: item.is_featured,
    saleDays: item.sale_days,
    groupName: item.group_name ?? '',
  }
}

function sameDraft(a: Draft, b: Draft) {
  const days = (d: PickupDay[]) => [...d].sort().join(',')
  return (
    a.name.trim() === b.name.trim() &&
    a.category === b.category &&
    a.description.trim() === b.description.trim() &&
    a.price.trim() === b.price.trim() &&
    a.stock.trim() === b.stock.trim() &&
    a.soldOut === b.soldOut &&
    a.featured === b.featured &&
    days(a.saleDays) === days(b.saleDays) &&
    a.groupName === b.groupName
  )
}

/** Checks one row; returns the update to send, or a Korean reason it can't be saved. */
function toUpdate(d: Draft): { ok: true; row: Record<string, unknown> } | { ok: false; reason: string } {
  const price = Number(d.price)
  const stock = d.stock.trim() === '' ? null : Number(d.stock)
  if (!d.name.trim()) return { ok: false, reason: '메뉴 이름이 비어 있어요.' }
  if (d.price.trim() === '' || !Number.isInteger(price) || price < 0) return { ok: false, reason: '가격은 0 이상의 숫자로 입력해주세요. 0원은 "가격 준비 중"이에요.' }
  if (stock !== null && (!Number.isInteger(stock) || stock < 0)) return { ok: false, reason: '수량은 0 이상의 숫자로 입력하거나 비워두세요.' }
  return {
    ok: true,
    row: {
      name: d.name.trim(),
      category: d.category,
      description: d.description.trim(),
      price,
      stock,
      sold_out: d.soldOut,
      is_featured: d.featured,
      sale_days: d.saleDays,
      group_name: d.groupName || null,
    },
  }
}

export function MenuPanel() {
  const [items, setItems] = useState<MenuItem[] | null>(null)
  const [groups, setGroups] = useState<MenuGroup[]>([])
  // Unsaved edits, keyed by the menu's current (saved) name. Rows without an entry are unchanged.
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [saving, setSaving] = useState(false)
  // Rows that failed the last 한 번에 저장, with the reason shown under the row.
  const [failures, setFailures] = useState<Record<string, string>>({})

  const refresh = async () => {
    try {
      const [menu, kinds] = await Promise.all([fetchMenu(), fetchMenuGroups()])
      setGroups(kinds)
      setItems(menu)
      // Drop edits for menus that no longer exist (e.g. deleted).
      const names = new Set(menu.map((m) => m.name))
      setDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => names.has(k))))
    } catch (e) {
      toast.error(getErrorMessage(e, '메뉴를 불러오지 못했어요.'))
      setItems([])
    }
  }
  useEffect(() => {
    void refresh()
  }, [])

  const changedNames = items ? items.filter((i) => drafts[i.name] && !sameDraft(drafts[i.name], toDraft(i))).map((i) => i.name) : []
  const changedCount = changedNames.length

  // Ask before closing/reloading the page with unsaved edits.
  useEffect(() => {
    if (changedCount === 0) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [changedCount])

  if (!items) return <p className="text-sm text-eden-mute">불러오는 중…</p>

  const draftOf = (item: MenuItem) => drafts[item.name] ?? toDraft(item)
  const featuredCount = items.filter((i) => draftOf(i).featured).length

  const updateDraft = (item: MenuItem, patch: Partial<Draft>) => {
    setDrafts((prev) => ({ ...prev, [item.name]: { ...(prev[item.name] ?? toDraft(item)), ...patch } }))
    setFailures((prev) => {
      if (!(item.name in prev)) return prev
      const next = { ...prev }
      delete next[item.name]
      return next
    })
  }

  const resetDraft = (name: string) => {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
    setFailures((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const resetAll = () => {
    setDrafts({})
    setFailures({})
  }

  const saveAll = async () => {
    if (changedCount === 0) return
    if (featuredCount > 2) {
      return void toast.error(`인기 메뉴 추천이 ${featuredCount}개 체크돼 있어요. 최대 2개까지만 고를 수 있으니 몇 개를 해제한 뒤 저장해주세요.`)
    }
    setSaving(true)
    const failed: Record<string, string> = {}
    const saved: string[] = []
    // One at a time, so two rows renamed into each other don't race.
    for (const oldName of changedNames) {
      const d = drafts[oldName]
      const check = toUpdate(d)
      if (!check.ok) {
        failed[oldName] = check.reason
        continue
      }
      const { error } = await supabase.from('menu_catalog').update(check.row).eq('name', oldName)
      if (error) {
        // 메뉴 이름이 menu_catalog의 기본키라서, 다른 메뉴가 이미 쓰는 이름으로 바꾸면 23505가 나요.
        failed[oldName] =
          error.code === '23505'
            ? `"${d.name.trim()}" 이름의 메뉴가 이미 있어요. 다른 이름으로 바꾸거나, 겹치는 메뉴를 먼저 삭제한 뒤 저장해주세요.`
            : getErrorMessage(error, '저장하지 못했어요.')
      } else {
        saved.push(oldName)
      }
    }
    setDrafts((prev) => {
      const next = { ...prev }
      for (const n of saved) delete next[n]
      return next
    })
    setFailures(failed)
    const failCount = Object.keys(failed).length
    if (failCount === 0) toast.success(`메뉴 ${saved.length}개를 저장했어요.`)
    else if (saved.length === 0) toast.error(`메뉴 ${failCount}개를 저장하지 못했어요. 빨간 글씨로 표시된 메뉴를 확인해주세요.`)
    else toast.error(`${saved.length}개는 저장했고, ${failCount}개는 저장하지 못했어요. 빨간 글씨로 표시된 메뉴를 확인해주세요.`)
    await refresh()
    setSaving(false)
  }

  return (
    <div>
      <p className="mb-6 text-sm text-eden-mute">
        베이커리만 온라인 픽업 주문을 받습니다. 음료는 메뉴에 표시되지만 장바구니에 담을 수 없어요. 베이커리 수량을 비워두면 제한 없이 주문받고, 숫자를 넣으면 주문될 때마다 줄어들어 0개가 되면 자동으로 품절이 돼요.
        손님용 메뉴 페이지 맨 위 "인기 메뉴"에는 여기서 직접 고른 메뉴 최대 2개 + 손님이 실제로 가장 많이 산 베이커리 1개, 총 3개가 떠요.
      </p>
      <p className="mb-6 text-sm text-eden-mute">
        베이커리는 <strong>판매 요일</strong>에 체크한 날의 주문 페이지에만 나와요(평일 = 월~목 픽업, 금요일 = 금 픽업). 아무 요일도 체크하지 않으면 주문 페이지에서 빠져요.
        가격이 0원이면 "가격 준비 중"으로 보이고 주문은 안 돼요. 수량 숫자는 날짜 구분 없이 전체 남은 수량이라, 미리 주문받는 빵은 비워두는 걸 권해요.
      </p>
      <p className="mb-6 text-sm text-eden-mute">
        메뉴 내용을 여러 개 고친 뒤 화면 아래 <strong>"변경한 메뉴 저장"</strong> 버튼을 한 번만 누르면 모두 저장돼요. 고친 메뉴에는 "수정됨" 표시가 붙어요. 사진 올리기와 메뉴 삭제는 누르는 즉시 반영돼요.
      </p>
      <GroupsEditor groups={groups} onChanged={refresh} />
      <p className="mb-6 text-sm text-eden-mute">
        <strong>답례품</strong>은 "답례품 예약" 탭에만 나오고, 빵과 따로 주문받아요. 픽업 날짜는 마을 픽업 주문과 같은 규칙(월~금, 2일 전 밤 11시 59분 마감)이고, 한 주문에 한 종류당 50개까지 담을 수 있어요.
      </p>
      {(['bakery', 'gift', 'drink'] as const).map((category) => (
        <section key={category} className="mb-10">
          <h3 className="mb-3 border-b border-eden-line pb-2 font-serif text-lg font-light">{CATEGORY_LABEL[category]}</h3>
          {kindSections(items.filter((i) => i.category === category), category === 'bakery' ? groups : []).map((sec) => (
            <div key={sec.title} className="mb-6">
              {sec.title ? (
                <h4 className="mb-2 text-sm font-semibold text-eden-mute">
                  {sec.title} <span className="font-normal">· {sec.items.length}개</span>
                </h4>
              ) : null}
              <div className="space-y-3">
                {sec.items.map((item) => (
                  <MenuRow
                    key={item.name}
                    item={item}
                    draft={draftOf(item)}
                    changed={changedNames.includes(item.name)}
                    failure={failures[item.name]}
                    groups={groups}
                    otherFeaturedCount={featuredCount - (draftOf(item).featured ? 1 : 0)}
                    disabled={saving}
                    onEdit={(patch) => updateDraft(item, patch)}
                    onReset={() => resetDraft(item.name)}
                    onChanged={refresh}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
      <NewMenuForm onAdded={refresh} />
      {changedCount > 0 ? (
        <div className="sticky bottom-0 z-40 -mx-5 mt-6 flex flex-wrap items-center gap-3 border-t-2 border-eden-accent bg-white px-5 py-3 pr-20 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:-mx-8 md:px-8 md:pr-20">
          <button type="button" disabled={saving} onClick={() => void saveAll()} className={`${buttonClass} px-6 py-3 text-base`}>
            {saving ? '저장하는 중…' : `변경한 메뉴 ${changedCount}개 저장`}
          </button>
          <button type="button" disabled={saving} onClick={resetAll} className="text-sm text-eden-mute underline">
            모두 되돌리기
          </button>
          <span className="text-sm text-eden-mute">저장하기 전에는 손님 화면에 반영되지 않아요.</span>
        </div>
      ) : null}
    </div>
  )
}

/** Bakery is split by kind (휘낭시에, 쿠키, …), then "종류 없음"; other categories stay one list. */
function kindSections(items: MenuItem[], groups: MenuGroup[]): { title: string; items: MenuItem[] }[] {
  if (groups.length === 0) return items.length ? [{ title: '', items }] : []
  const known = new Set(groups.map((g) => g.name))
  return [
    ...groups.map((g) => ({ title: g.name, items: items.filter((i) => i.group_name === g.name) })),
    { title: '종류 없음', items: items.filter((i) => !i.group_name || !known.has(i.group_name)) },
  ].filter((sec) => sec.items.length > 0)
}

function MenuRow({
  item,
  draft,
  changed,
  failure,
  groups,
  otherFeaturedCount,
  disabled,
  onEdit,
  onReset,
  onChanged,
}: {
  item: MenuItem
  draft: Draft
  changed: boolean
  failure?: string
  groups: MenuGroup[]
  otherFeaturedCount: number
  disabled: boolean
  onEdit: (patch: Partial<Draft>) => void
  onReset: () => void
  onChanged: () => Promise<void>
}) {
  const { name, category, description, price, stock, soldOut, featured, saleDays, groupName } = draft
  const [busyLocal, setBusy] = useState(false)
  const busy = busyLocal || disabled
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleFeatured = (checked: boolean) => {
    if (checked && otherFeaturedCount >= 2) {
      toast.error('인기 메뉴는 최대 2개까지 고를 수 있어요. 다른 메뉴의 선택을 먼저 해제해주세요.')
      return
    }
    onEdit({ featured: checked })
  }

  const setPhoto = async (file: File | null) => {
    setBusy(true)
    try {
      const url = file ? await uploadSiteImage(file, 'menu') : null
      const { error } = await supabase.from('menu_catalog').update({ image_url: url }).eq('name', item.name)
      if (error) throw error
      await removeSiteImage(item.image_url).catch(() => {})
      toast.success(file ? '사진을 올렸어요.' : '사진을 지웠어요.')
      await onChanged()
    } catch (e) {
      toast.error(getErrorMessage(e, '사진을 저장하지 못했어요.'))
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const remove = async () => {
    if (!window.confirm(`'${item.name}' 메뉴를 삭제할까요? 손님 장바구니에서도 빠져요.`)) return
    setBusy(true)
    const { error } = await supabase.from('menu_catalog').delete().eq('name', item.name)
    setBusy(false)
    if (error) return void toast.error(error.message)
    await removeSiteImage(item.image_url).catch(() => {})
    toast.success('메뉴를 삭제했어요.')
    await onChanged()
  }

  return (
    <div
      className={`grid gap-4 rounded-[2px] border bg-eden-paper p-4 md:grid-cols-[120px_1fr] ${
        failure ? 'border-destructive' : changed ? 'border-eden-accent ring-1 ring-eden-accent' : 'border-eden-line'
      }`}
    >
      <div>
        <div className="mb-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[2px] bg-eden-paper-dim text-xs text-eden-mute">
          {item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : '사진 없음'}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void setPhoto(e.target.files?.[0] ?? null)} />
        <div className="flex gap-2 text-xs">
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="underline">
            {item.image_url ? '사진 변경' : '사진 올리기'}
          </button>
          {item.image_url ? (
            <button type="button" disabled={busy} onClick={() => void setPhoto(null)} className="text-eden-mute underline">
              삭제
            </button>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        {changed || failure ? (
          <p className={`text-sm font-semibold ${failure ? 'text-destructive' : 'text-eden-accent'}`}>
            {failure ? `저장하지 못했어요: ${failure}` : '수정됨 · 아직 저장 전'}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <input aria-label="메뉴 이름" value={name} onChange={(e) => onEdit({ name: e.target.value })} className={`min-w-40 flex-1 ${inputClass}`} />
          <select aria-label="분류" value={category} onChange={(e) => onEdit({ category: e.target.value as MenuItem['category'] })} className={inputClass}>
            <option value="bakery">베이커리</option>
            <option value="drink">음료</option>
            <option value="gift">답례품</option>
          </select>
        </div>
        <input aria-label="설명" placeholder="설명" value={description} onChange={(e) => onEdit({ description: e.target.value })} className={`w-full ${inputClass}`} />
        {category === 'bakery' ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold">판매 요일</span>
            {(['weekday', 'friday'] as const).map((day) => (
              <label key={day} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={saleDays.includes(day)}
                  onChange={(e) => onEdit({ saleDays: e.target.checked ? [...saleDays, day] : saleDays.filter((d) => d !== day) })}
                />
                {DAY_LABEL[day]}
              </label>
            ))}
            <label className="flex items-center gap-1">
              종류
              <select aria-label="종류" value={groupName} onChange={(e) => onEdit({ groupName: e.target.value })} className={inputClass}>
                <option value="">없음</option>
                {groups.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            {saleDays.length === 0 ? <span className="text-xs text-destructive">주문 페이지에 안 보여요</span> : null}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-1">
            가격
            <input inputMode="numeric" value={price} onChange={(e) => onEdit({ price: e.target.value })} className={`w-24 ${inputClass}`} />원
          </label>
          <label className="flex items-center gap-1">
            수량
            <input inputMode="numeric" placeholder="제한 없음" value={stock} onChange={(e) => onEdit({ stock: e.target.value })} className={`w-24 ${inputClass}`} />
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={soldOut} onChange={(e) => onEdit({ soldOut: e.target.checked })} />
            품절
          </label>
          {category === 'bakery' ? (
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={featured} onChange={(e) => toggleFeatured(e.target.checked)} />
              인기 메뉴 추천
            </label>
          ) : null}
          {item.stock === 0 ? <span className="text-xs text-destructive">수량 소진</span> : null}
          <div className="ml-auto flex gap-2">
            <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-[3px] px-3 py-2 text-sm text-eden-mute hover:text-destructive">
              삭제
            </button>
            {changed ? (
              <button type="button" disabled={busy} onClick={onReset} className="rounded-[3px] px-3 py-2 text-sm text-eden-mute underline">
                되돌리기
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function NewMenuForm({ onAdded }: { onAdded: () => Promise<void> }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<MenuItem['category']>('bakery')
  const [price, setPrice] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    const nextPrice = Number(price)
    if (!name.trim()) return void toast.error('메뉴 이름을 입력해주세요.')
    if (!Number.isInteger(nextPrice) || nextPrice < 0) return void toast.error('가격은 0 이상의 숫자로 입력해주세요. 0원은 "가격 준비 중"이에요.')
    setBusy(true)
    const { error } = await supabase
      .from('menu_catalog')
      .insert({ name: name.trim(), category, price: nextPrice, sold_out: false })
    setBusy(false)
    if (error) return void toast.error(error.code === '23505' ? '같은 이름의 메뉴가 이미 있어요.' : error.message)
    toast.success('메뉴를 추가했어요. 설명과 사진은 목록에서 채워주세요.')
    setName('')
    setPrice('')
    await onAdded()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void add()
      }}
      className="flex flex-wrap items-center gap-2 rounded-[2px] border border-dashed border-eden-line p-4"
    >
      <strong className="mr-2 text-sm">새 메뉴</strong>
      <input aria-label="새 메뉴 이름" placeholder="메뉴 이름" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      <select aria-label="분류" value={category} onChange={(e) => setCategory(e.target.value as MenuItem['category'])} className={inputClass}>
        <option value="bakery">베이커리</option>
        <option value="drink">음료</option>
        <option value="gift">답례품</option>
      </select>
      <input aria-label="가격" placeholder="가격(원)" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={`w-28 ${inputClass}`} />
      <button disabled={busy} className={buttonClass}>
        추가
      </button>
    </form>
  )
}

/** Kinds of bread (휘낭시에, 소금빵, …): order on the page and the per-order cap. */
function GroupsEditor({ groups, onChanged }: { groups: MenuGroup[]; onChanged: () => Promise<void> }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!name.trim()) return void toast.error('종류 이름을 입력해주세요.')
    setBusy(true)
    const { error } = await supabase
      .from('menu_groups')
      .insert({ name: name.trim(), sort_order: Math.max(0, ...groups.map((g) => g.sort_order)) + 1 })
    setBusy(false)
    if (error) return void toast.error(error.code === '23505' ? '같은 이름의 종류가 이미 있어요.' : error.message)
    setName('')
    await onChanged()
  }

  return (
    <section className="mb-10">
      <h3 className="mb-1 border-b border-eden-line pb-2 font-serif text-lg font-light">빵 종류 · 수량 제한</h3>
      <p className="mb-3 mt-2 text-sm text-eden-mute">
        주문 페이지에서 같은 종류의 맛들을 한데 묶어 보여줘요. "한 주문 최대"를 넣으면 그 종류의 맛을 모두 합쳐 그 개수까지만 담을 수 있어요(예: 9 → 10개 이상은 별도 문의).
      </p>
      <div className="space-y-2">
        {groups.map((g) => (
          <GroupRow key={g.name} group={g} onChanged={onChanged} />
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void add()
        }}
        className="mt-3 flex flex-wrap items-center gap-2"
      >
        <input aria-label="새 종류 이름" placeholder="새 종류 이름" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        <button disabled={busy} className={buttonClass}>
          종류 추가
        </button>
      </form>
    </section>
  )
}

function GroupRow({ group, onChanged }: { group: MenuGroup; onChanged: () => Promise<void> }) {
  const [maxQty, setMaxQty] = useState(group.max_qty === null ? '' : String(group.max_qty))
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const nextMax = maxQty.trim() === '' ? null : Number(maxQty)
    if (nextMax !== null && (!Number.isInteger(nextMax) || nextMax < 1)) return void toast.error('최대 수량은 1 이상의 숫자로 입력하거나 비워두세요.')
    setBusy(true)
    const { error } = await supabase.from('menu_groups').update({ max_qty: nextMax }).eq('name', group.name)
    setBusy(false)
    if (error) return void toast.error(error.message)
    toast.success(`${group.name} 저장했어요.`)
    await onChanged()
  }

  const remove = async () => {
    if (!window.confirm(`'${group.name}' 종류를 지울까요? 메뉴는 그대로 남고 종류만 "없음"이 돼요.`)) return
    setBusy(true)
    const { error } = await supabase.from('menu_groups').delete().eq('name', group.name)
    setBusy(false)
    if (error) return void toast.error(error.message)
    await onChanged()
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[2px] border border-eden-line bg-eden-paper px-4 py-2 text-sm">
      <strong className="min-w-24">{group.name}</strong>
      <label className="flex items-center gap-1">
        한 주문 최대
        <input inputMode="numeric" placeholder="제한 없음" value={maxQty} onChange={(e) => setMaxQty(e.target.value)} className={`w-24 ${inputClass}`} />
        개
      </label>
      <div className="ml-auto flex gap-2">
        <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-[3px] px-3 py-2 text-sm text-eden-mute hover:text-destructive">
          삭제
        </button>
        <button type="button" disabled={busy} onClick={() => void save()} className={buttonClass}>
          저장
        </button>
      </div>
    </div>
  )
}
