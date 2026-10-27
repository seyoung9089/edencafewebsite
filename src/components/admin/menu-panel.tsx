import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fetchMenu, fetchMenuGroups, type MenuGroup, type MenuItem } from '@/lib/menu'
import type { PickupDay } from '@/lib/pickup'
import { removeSiteImage, uploadSiteImage } from '@/lib/storage'
import { getErrorMessage } from '@/lib/errors'
import { buttonClass, inputClass } from './use-staff'

const CATEGORY_LABEL = { bakery: '베이커리', drink: '음료' } as const
const DAY_LABEL: Record<PickupDay, string> = { weekday: '평일(월~목)', friday: '금요일' }

export function MenuPanel() {
  const [items, setItems] = useState<MenuItem[] | null>(null)
  const [groups, setGroups] = useState<MenuGroup[]>([])

  const refresh = async () => {
    try {
      const [menu, kinds] = await Promise.all([fetchMenu(), fetchMenuGroups()])
      setGroups(kinds)
      setItems(menu)
    } catch (e) {
      toast.error(getErrorMessage(e, '메뉴를 불러오지 못했어요.'))
      setItems([])
    }
  }
  useEffect(() => {
    void refresh()
  }, [])

  if (!items) return <p className="text-sm text-eden-sage-dim">불러오는 중…</p>

  const featuredCount = items.filter((i) => i.is_featured).length

  return (
    <div>
      <p className="mb-6 text-sm text-eden-sage-dim">
        베이커리만 온라인 픽업 주문을 받습니다. 음료는 메뉴에 표시되지만 장바구니에 담을 수 없어요. 베이커리 수량을 비워두면 제한 없이 주문받고, 숫자를 넣으면 주문될 때마다 줄어들어 0개가 되면 자동으로 품절이 돼요.
        손님용 메뉴 페이지 맨 위 "인기 메뉴"에는 여기서 직접 고른 메뉴 최대 2개 + 손님이 실제로 가장 많이 산 베이커리 1개, 총 3개가 떠요.
      </p>
      <p className="mb-6 text-sm text-eden-sage-dim">
        베이커리는 <strong>판매 요일</strong>에 체크한 날의 주문 페이지에만 나와요(평일 = 월~목 픽업, 금요일 = 금 픽업). 아무 요일도 체크하지 않으면 주문 페이지에서 빠져요.
        가격이 0원이면 "가격 준비 중"으로 보이고 주문은 안 돼요. 수량 숫자는 날짜 구분 없이 전체 남은 수량이라, 미리 주문받는 빵은 비워두는 걸 권해요.
      </p>
      <GroupsEditor groups={groups} onChanged={refresh} />
      {(['bakery', 'drink'] as const).map((category) => (
        <section key={category} className="mb-10">
          <h3 className="mb-3 border-b border-eden-line pb-2 font-serif text-lg font-semibold">{CATEGORY_LABEL[category]}</h3>
          <div className="space-y-3">
            {items
              .filter((i) => i.category === category)
              .map((item) => (
                <MenuRow
                  key={item.name}
                  item={item}
                  groups={groups}
                  otherFeaturedCount={featuredCount - (item.is_featured ? 1 : 0)}
                  onChanged={refresh}
                />
              ))}
          </div>
        </section>
      ))}
      <NewMenuForm nextSortOrder={Math.max(0, ...items.map((i) => i.sort_order)) + 1} onAdded={refresh} />
    </div>
  )
}

function MenuRow({
  item,
  groups,
  otherFeaturedCount,
  onChanged,
}: {
  item: MenuItem
  groups: MenuGroup[]
  otherFeaturedCount: number
  onChanged: () => Promise<void>
}) {
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState(item.category)
  const [description, setDescription] = useState(item.description)
  const [price, setPrice] = useState(String(item.price))
  const [stock, setStock] = useState(item.stock === null ? '' : String(item.stock))
  const [soldOut, setSoldOut] = useState(item.sold_out)
  const [sortOrder, setSortOrder] = useState(String(item.sort_order))
  const [featured, setFeatured] = useState(item.is_featured)
  const [saleDays, setSaleDays] = useState<PickupDay[]>(item.sale_days)
  const [groupName, setGroupName] = useState(item.group_name ?? '')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleFeatured = (checked: boolean) => {
    if (checked && otherFeaturedCount >= 2) {
      toast.error('인기 메뉴는 최대 2개까지 고를 수 있어요. 다른 메뉴의 선택을 먼저 해제해주세요.')
      return
    }
    setFeatured(checked)
  }

  const save = async () => {
    const nextPrice = Number(price)
    const nextStock = stock.trim() === '' ? null : Number(stock)
    const nextSort = Number(sortOrder)
    if (!name.trim()) return void toast.error('메뉴 이름을 입력해주세요.')
    if (!Number.isInteger(nextPrice) || nextPrice < 0) return void toast.error('가격은 0 이상의 숫자로 입력해주세요. 0원은 "가격 준비 중"이에요.')
    if (nextStock !== null && (!Number.isInteger(nextStock) || nextStock < 0)) return void toast.error('수량은 0 이상의 숫자로 입력하거나 비워두세요.')
    if (!Number.isInteger(nextSort)) return void toast.error('순서는 숫자로 입력해주세요.')
    if (featured && otherFeaturedCount >= 2) return void toast.error('인기 메뉴는 최대 2개까지 고를 수 있어요. 다른 메뉴의 선택을 먼저 해제해주세요.')
    setBusy(true)
    const { error } = await supabase
      .from('menu_catalog')
      .update({
        name: name.trim(),
        category,
        description: description.trim(),
        price: nextPrice,
        stock: nextStock,
        sold_out: soldOut,
        sort_order: nextSort,
        is_featured: featured,
        sale_days: saleDays,
        group_name: groupName || null,
      })
      .eq('name', item.name)
    setBusy(false)
    if (error) return void toast.error(error.message)
    toast.success(`${name.trim()} 저장했어요.`)
    await onChanged()
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
    <div className="grid gap-4 rounded-[10px] border border-eden-line bg-eden-paper p-4 md:grid-cols-[120px_1fr]">
      <div>
        <div className="mb-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[10px] bg-eden-paper-dim text-xs text-eden-sage-dim">
          {item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : '사진 없음'}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void setPhoto(e.target.files?.[0] ?? null)} />
        <div className="flex gap-2 text-xs">
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="underline">
            {item.image_url ? '사진 변경' : '사진 올리기'}
          </button>
          {item.image_url ? (
            <button type="button" disabled={busy} onClick={() => void setPhoto(null)} className="text-eden-sage-dim underline">
              삭제
            </button>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input aria-label="메뉴 이름" value={name} onChange={(e) => setName(e.target.value)} className={`min-w-40 flex-1 ${inputClass}`} />
          <select aria-label="분류" value={category} onChange={(e) => setCategory(e.target.value as MenuItem['category'])} className={inputClass}>
            <option value="bakery">베이커리</option>
            <option value="drink">음료</option>
          </select>
        </div>
        <input aria-label="설명" placeholder="설명" value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full ${inputClass}`} />
        {category === 'bakery' ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold">판매 요일</span>
            {(['weekday', 'friday'] as const).map((day) => (
              <label key={day} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={saleDays.includes(day)}
                  onChange={(e) => setSaleDays((prev) => (e.target.checked ? [...prev, day] : prev.filter((d) => d !== day)))}
                />
                {DAY_LABEL[day]}
              </label>
            ))}
            <label className="flex items-center gap-1">
              종류
              <select aria-label="종류" value={groupName} onChange={(e) => setGroupName(e.target.value)} className={inputClass}>
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
            <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={`w-24 ${inputClass}`} />원
          </label>
          <label className="flex items-center gap-1">
            수량
            <input inputMode="numeric" placeholder="제한 없음" value={stock} onChange={(e) => setStock(e.target.value)} className={`w-24 ${inputClass}`} />
          </label>
          <label className="flex items-center gap-1">
            순서
            <input inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={`w-16 ${inputClass}`} />
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={soldOut} onChange={(e) => setSoldOut(e.target.checked)} />
            품절
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={featured} onChange={(e) => toggleFeatured(e.target.checked)} />
            인기 메뉴 추천
          </label>
          {item.stock === 0 ? <span className="text-xs text-destructive">수량 소진</span> : null}
          <div className="ml-auto flex gap-2">
            <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-full px-3 py-2 text-sm text-eden-sage-dim hover:text-destructive">
              삭제
            </button>
            <button type="button" disabled={busy} onClick={() => void save()} className={buttonClass}>
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewMenuForm({ nextSortOrder, onAdded }: { nextSortOrder: number; onAdded: () => Promise<void> }) {
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
      .insert({ name: name.trim(), category, price: nextPrice, sold_out: false, sort_order: nextSortOrder })
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
      className="flex flex-wrap items-center gap-2 rounded-[10px] border border-dashed border-eden-line p-4"
    >
      <strong className="mr-2 text-sm">새 메뉴</strong>
      <input aria-label="새 메뉴 이름" placeholder="메뉴 이름" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      <select aria-label="분류" value={category} onChange={(e) => setCategory(e.target.value as MenuItem['category'])} className={inputClass}>
        <option value="bakery">베이커리</option>
        <option value="drink">음료</option>
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
      <h3 className="mb-1 border-b border-eden-line pb-2 font-serif text-lg font-semibold">빵 종류 · 수량 제한</h3>
      <p className="mb-3 mt-2 text-sm text-eden-sage-dim">
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
  const [sortOrder, setSortOrder] = useState(String(group.sort_order))
  const [maxQty, setMaxQty] = useState(group.max_qty === null ? '' : String(group.max_qty))
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const nextSort = Number(sortOrder)
    const nextMax = maxQty.trim() === '' ? null : Number(maxQty)
    if (!Number.isInteger(nextSort)) return void toast.error('순서는 숫자로 입력해주세요.')
    if (nextMax !== null && (!Number.isInteger(nextMax) || nextMax < 1)) return void toast.error('최대 수량은 1 이상의 숫자로 입력하거나 비워두세요.')
    setBusy(true)
    const { error } = await supabase.from('menu_groups').update({ sort_order: nextSort, max_qty: nextMax }).eq('name', group.name)
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
    <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-eden-line bg-eden-paper px-4 py-2 text-sm">
      <strong className="min-w-24">{group.name}</strong>
      <label className="flex items-center gap-1">
        순서
        <input inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={`w-16 ${inputClass}`} />
      </label>
      <label className="flex items-center gap-1">
        한 주문 최대
        <input inputMode="numeric" placeholder="제한 없음" value={maxQty} onChange={(e) => setMaxQty(e.target.value)} className={`w-24 ${inputClass}`} />
        개
      </label>
      <div className="ml-auto flex gap-2">
        <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-full px-3 py-2 text-sm text-eden-sage-dim hover:text-destructive">
          삭제
        </button>
        <button type="button" disabled={busy} onClick={() => void save()} className={buttonClass}>
          저장
        </button>
      </div>
    </div>
  )
}
