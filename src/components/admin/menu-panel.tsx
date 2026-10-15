import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fetchMenu, type MenuItem } from '@/lib/menu'
import { removeSiteImage, uploadSiteImage } from '@/lib/storage'
import { getErrorMessage } from '@/lib/errors'
import { buttonClass, inputClass } from './use-staff'

const CATEGORY_LABEL = { bakery: '베이커리', drink: '음료' } as const

export function MenuPanel() {
  const [items, setItems] = useState<MenuItem[] | null>(null)

  const refresh = async () => {
    try {
      setItems(await fetchMenu())
    } catch (e) {
      toast.error(getErrorMessage(e, '메뉴를 불러오지 못했어요.'))
      setItems([])
    }
  }
  useEffect(() => {
    void refresh()
  }, [])

  if (!items) return <p className="text-sm text-eden-sage-dim">불러오는 중…</p>

  return (
    <div>
      <p className="mb-6 text-sm text-eden-sage-dim">
        여기서 바꾼 내용이 메뉴 화면과 주문에 바로 반영돼요. 수량을 비워두면 제한 없이 주문받고, 숫자를 넣으면 주문될 때마다 줄어들어 0개가 되면 자동으로 품절이 돼요.
      </p>
      {(['bakery', 'drink'] as const).map((category) => (
        <section key={category} className="mb-10">
          <h3 className="mb-3 border-b border-eden-line pb-2 font-serif text-lg font-semibold">{CATEGORY_LABEL[category]}</h3>
          <div className="space-y-3">
            {items
              .filter((i) => i.category === category)
              .map((item) => (
                <MenuRow key={item.name} item={item} onChanged={refresh} />
              ))}
          </div>
        </section>
      ))}
      <NewMenuForm nextSortOrder={Math.max(0, ...items.map((i) => i.sort_order)) + 1} onAdded={refresh} />
    </div>
  )
}

function MenuRow({ item, onChanged }: { item: MenuItem; onChanged: () => Promise<void> }) {
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState(item.category)
  const [description, setDescription] = useState(item.description)
  const [price, setPrice] = useState(String(item.price))
  const [stock, setStock] = useState(item.stock === null ? '' : String(item.stock))
  const [soldOut, setSoldOut] = useState(item.sold_out)
  const [sortOrder, setSortOrder] = useState(String(item.sort_order))
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const save = async () => {
    const nextPrice = Number(price)
    const nextStock = stock.trim() === '' ? null : Number(stock)
    const nextSort = Number(sortOrder)
    if (!name.trim()) return void toast.error('메뉴 이름을 입력해주세요.')
    if (!Number.isInteger(nextPrice) || nextPrice <= 0) return void toast.error('가격은 1원 이상의 숫자로 입력해주세요.')
    if (nextStock !== null && (!Number.isInteger(nextStock) || nextStock < 0)) return void toast.error('수량은 0 이상의 숫자로 입력하거나 비워두세요.')
    if (!Number.isInteger(nextSort)) return void toast.error('순서는 숫자로 입력해주세요.')
    setBusy(true)
    const { error } = await supabase
      .from('menu_catalog')
      .update({ name: name.trim(), category, description: description.trim(), price: nextPrice, stock: nextStock, sold_out: soldOut, sort_order: nextSort })
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
    if (!Number.isInteger(nextPrice) || nextPrice <= 0) return void toast.error('가격은 1원 이상의 숫자로 입력해주세요.')
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
