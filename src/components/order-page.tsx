import { Link, useNavigate } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { OrderNotes } from '@/components/order-notes'
import { OrderReceipt, type PaymentMethod } from '@/components/order-receipt'
import { PickupDatePicker } from '@/components/pickup-date-picker'
import { OrderCompleteBody, type PlacedOrder } from '@/components/order-complete'
import { GIFT_MAX_QTY, MAX_QTY, groupTotals, maxQtyFor, overGroupLimit, reconcileCart, useCart, useGiftCart } from '@/lib/cart'
import { usePickupDates } from '@/lib/pickup'
import { useCustomerAuth } from '@/lib/customer-auth'
import { isPlaceholder, useContentValue, useSiteContent } from '@/lib/site-content'
import { useMenu, isSoldOut, isUnpriced, fetchPopularity, type MenuGroup, type MenuItem } from '@/lib/menu'
import { getErrorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { rememberOrderTab } from '@/lib/return-to'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { MenuDetailDialog } from '@/components/menu-detail'
import { Minus, Plus, Croissant, Coffee, Flame, ChevronUp, ChevronRight, School, CalendarDays, Info, Gift } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Who a tab is for. 마을 픽업 주문: villagers order for Mon–Thu and pick up
 * themselves. 학부모 주문: parents order for Friday and the student picks up
 * after school (student name, 계좌이체/현장결제). 답례품 예약: gifts for an
 * event, picked up like 마을 픽업, with their own cart and a request note.
 */
export type OrderAudience = 'village' | 'parents' | 'gift'

const CATEGORY_ICON = { bakery: Croissant, drink: Coffee, gift: Gift } as const

/** Max staff-curated picks marked 인기 (see menu-panel.tsx). */
const FEATURED_COUNT = 2

/** Turns database errors from place_order into something a customer can act on. */
function orderErrorMessage(e: unknown, maxQty: number): string {
  const message = getErrorMessage(e, '주문에 실패했습니다.')
  if (message.includes('Unavailable menu item') || message.includes('Only available bakery items'))
    return `방금 품절되었거나 지금 주문할 수 없는 메뉴가 있어요: ${message.split(':').pop()?.trim()}. 주문 내역에서 빼고 다시 주문해주세요.`
  if (message.includes('Invalid quantity')) return `한 메뉴는 ${maxQty}개까지 주문할 수 있어요. 수량을 줄여주세요.`
  if (message.includes('Invalid order')) return '담은 메뉴가 없거나 너무 많아요. 확인 후 다시 주문해주세요.'
  if (message.includes('Login required')) return '로그인이 필요해요.'
  return message
}

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

function MenuCard({
  item,
  popular,
  qty,
  onAdd,
  onQty,
  onOpen,
}: {
  item: MenuItem
  popular?: boolean
  qty: number
  onAdd: (item: MenuItem) => void
  onQty: (name: string, qty: number) => void
  onOpen: (item: MenuItem) => void
}) {
  const Icon = CATEGORY_ICON[item.category]
  const soldOut = item.category !== 'drink' && isSoldOut(item)
  const unpriced = isUnpriced(item)
  const max = maxQtyFor(item)
  return (
    <div className={`flex flex-col border bg-white p-3 transition-transform duration-200 hover:-translate-y-[3px] ${qty > 0 ? 'border-eden-accent ring-1 ring-eden-accent' : 'border-eden-line'}`}>
      {/* Photo and name both open the detail view: one big tap target. */}
      <button type="button" onClick={() => onOpen(item)} aria-label={`${item.name} 자세히 보기`} className="group text-left">
        <div className="relative mb-3 flex aspect-[2/1] items-center justify-center overflow-hidden rounded-[2px] bg-eden-paper">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className={`h-full w-full object-cover ${soldOut ? 'grayscale opacity-50' : ''}`}
              loading="lazy"
            />
          ) : (
            <Icon size={28} strokeWidth={1.5} className={`text-eden-mute ${soldOut ? 'opacity-50' : ''}`} />
          )}
          {popular ? (
            <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-eden-accent px-2 py-0.5 text-xs font-semibold text-white">
              <Flame size={12} strokeWidth={2} /> 인기
            </span>
          ) : null}
          {soldOut ? (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-eden-ink-2/90 px-2 py-0.5 text-xs font-semibold text-eden-paper">
              품절
            </span>
          ) : null}
        </div>
        <span className="flex items-start gap-0.5 text-base font-medium leading-snug group-hover:underline group-hover:underline-offset-4">
          {item.name}
          <ChevronRight size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-eden-mute" aria-hidden />
        </span>
      </button>
      <div className="mb-3 mt-1 flex flex-wrap items-baseline justify-between gap-x-2">
        <span className={unpriced ? 'text-sm text-eden-mute' : 'font-semibold text-eden-ink'}>{unpriced ? '가격 준비 중' : won(item.price)}</span>
        {item.category !== 'drink' && item.stock !== null && item.stock > 0 ? (
          <span className="text-sm text-eden-mute">{item.stock}개 남음</span>
        ) : null}
      </div>
      <div className="mt-auto">
        {item.category === 'drink' ? (
          <span className="flex h-10 items-center justify-center text-sm text-eden-mute">매장에서만 주문</span>
        ) : soldOut || unpriced ? (
          // Plain text, no box: it must not look like a button.
          <span className="flex h-10 items-center justify-center text-sm text-eden-mute">
            {soldOut ? '품절' : '준비 중'}
          </span>
        ) : qty > 0 ? (
          <div className="flex h-10 items-center justify-between rounded-[3px] bg-eden-accent px-1 text-white">
            <button
              type="button"
              onClick={() => (qty <= 1 ? onQty(item.name, 0) : onQty(item.name, qty - 1))}
              aria-label={`${item.name} 하나 빼기`}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-eden-accent-d"
            >
              <Minus size={15} />
            </button>
            <span className="font-semibold" aria-live="polite">{qty}개</span>
            <button
              type="button"
              onClick={() => onQty(item.name, qty + 1)}
              disabled={qty >= max}
              aria-label={`${item.name} 하나 더`}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-eden-accent-d disabled:opacity-30"
            >
              <Plus size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(item)}
            className="h-10 w-full rounded-[3px] border border-eden-ink text-sm font-semibold text-eden-ink transition-colors hover:bg-eden-ink hover:text-eden-paper"
          >
            담기
          </button>
        )}
      </div>
    </div>
  )
}

const PICKUP_KEY = { village: 'edenPickupDate', parents: 'edenParentsPickupDate', gift: 'edenGiftPickupDate' } as const
const STUDENT_KEY = 'edenStudentName'

function readStored(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}
function store(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* ignore storage failures */
  }
}

/** The order page, shared by the 마을 픽업 주문, 학부모 주문 and 답례품 예약 tabs. */
export function OrderPage({ audience, initialDate }: { audience: OrderAudience; initialDate?: string }) {
  const { items: menuItems, groups, error: menuError } = useMenu()
  // 답례품 has its own cart, so gifts and bread never go into one order.
  const breadCart = useCart()
  const giftCart = useGiftCart()
  const gift = audience === 'gift'
  const { items, addItem, updateQty, removeItem, clear, replaceItems, totalQty, totalPrice } = gift ? giftCart : breadCart
  const calendar = usePickupDates()
  const { user, loading } = useCustomerAuth()
  const navigate = useNavigate()
  const content = useSiteContent()
  const pickupTime = useContentValue(content, 'pickup.time')
  const fridayNotice = useContentValue(content, 'order.fridayNotice')
  const studentDepositNote = useContentValue(content, 'order.studentDepositNote')
  const bulkContact = useContentValue(content, 'order.bulkContact')
  const bulkMessage = `${useContentValue(content, 'order.bulkNotice')} ${isPlaceholder(bulkContact) ? '문의사항에 남겨 주세요.' : bulkContact}`
  const [popularity, setPopularity] = useState<Map<string, number>>(new Map())
  const [submitting, setSubmitting] = useState(false)
  const [placed, setPlaced] = useState<Omit<PlacedOrder, 'pickupTime'> | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  // By name, so the open detail picks up fresh stock from the menu.
  const [detailName, setDetailName] = useState<string | null>(null)
  const [pickupIso, setPickupIso] = useState<string | null>(null)
  const [studentName, setStudentName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [requestNote, setRequestNote] = useState('')
  const menuRef = useRef<HTMLElement>(null)

  // 마을 픽업: every pickup day (월~금). 학부모: Fridays only.
  const parents = audience === 'parents'
  const dates = calendar ? calendar.dates.filter((d) => !parents || d.day === 'friday') : null
  // Only a day that's still open counts; at midnight a closed day drops out.
  // Only a day shown in this week's calendar can be the pickup day.
  const shownDays = calendar ? (parents ? calendar.fridays : calendar.days) : null
  const pickup = dates?.find((d) => d.iso === pickupIso && d.open && shownDays?.some((c) => c.iso === d.iso && c.open)) ?? null

  useEffect(() => {
    rememberOrderTab(parents ? '/parents' : '/order')
    // A date picked on the home page wins over the one remembered from last time.
    if (initialDate) store(PICKUP_KEY[audience], initialDate)
    setPickupIso(initialDate || readStored(PICKUP_KEY[audience]) || null)
    setStudentName(readStored(STUDENT_KEY))
  }, [])

  useEffect(() => {
    let alive = true
    fetchPopularity()
      .then((m) => alive && setPopularity(m))
      .catch(() => {
        /* the 인기 badge is a nice-to-have; fail quietly */
      })
    return () => {
      alive = false
    }
  }, [])

  // Sold out since it was added, not on the chosen day's menu, or more than
  // what's left: fix the cart here and say what changed, instead of letting
  // the order fail later.
  useEffect(() => {
    if (!menuItems || menuError) return
    const { next, removed, offDay, reduced, changed } = reconcileCart(items, menuItems, pickup?.day ?? null, gift ? 'gift' : 'bakery')
    if (!changed) return
    replaceItems(next)
    if (removed.length) toast.info(`품절되었거나 지금 주문할 수 없는 메뉴라 주문 내역에서 뺐어요: ${removed.join(', ')}`)
    if (offDay.length && pickup) toast.info(`${pickup.label} 메뉴에 없는 빵이라 주문 내역에서 뺐어요: ${offDay.join(', ')}`)
    for (const r of reduced) toast.info(`${r.name}은(는) 남은 수량이 ${r.qty}개라 수량을 맞췄어요.`)
  }, [menuItems, menuError, items, pickup?.day])

  const menuByName = new Map((menuItems ?? []).map((m) => [m.name, m]))
  const groupByName = new Map(groups.map((g) => [g.name, g]))
  const totals = groupTotals(items, menuByName)
  const qtyOf = (name: string) => items.find((it) => it.name === name)?.qty ?? 0

  /** The capped kind (소금빵·치아바타·베이글) this change would push past its limit, if any. */
  const capHit = (name: string, nextQty: number): MenuGroup | null => {
    const group = groupByName.get(menuByName.get(name)?.group_name ?? '')
    if (!group || group.max_qty === null) return null
    return (totals.get(group.name) ?? 0) - qtyOf(name) + nextQty > group.max_qty ? group : null
  }

  const add = (item: MenuItem) => {
    if (item.category !== (gift ? 'gift' : 'bakery') || isSoldOut(item) || isUnpriced(item)) return
    if (capHit(item.name, qtyOf(item.name) + 1)) return void toast.error(bulkMessage, { duration: 8000 })
    addItem({ name: item.name, price: item.price, qty: 1 })
  }
  const setQty = (name: string, qty: number) => {
    if (qty <= 0) return removeItem(name)
    if (qty > qtyOf(name) && capHit(name, qty)) return void toast.error(bulkMessage, { duration: 8000 })
    updateQty(name, Math.min(qty, maxQtyFor(menuByName.get(name))))
  }

  const choosePickup = (iso: string) => {
    setPickupIso(iso)
    store(PICKUP_KEY[audience], iso)
    window.setTimeout(() => menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const changeStudentName = (name: string) => {
    setStudentName(name)
    store(STUDENT_KEY, name)
  }

  // What still stops the order, in the order a customer would fix it.
  const blocker = !pickup
    ? '먼저 픽업 날짜를 골라 주세요.'
    : !menuItems || menuError
      ? '메뉴를 불러오는 중이에요.'
      : overGroupLimit(items, menuByName, groups)
        ? bulkMessage
        : parents && !studentName.trim()
          ? '학생 이름을 적어 주세요.'
          : parents && !paymentMethod
            ? '결제 방법을 골라 주세요.'
            : ''

  const checkout = async () => {
    if (!items.length || !pickup || blocker) return
    const method: PaymentMethod = parents && paymentMethod ? paymentMethod : 'transfer'
    const student = parents ? studentName.trim() : null
    setSubmitting(true)
    try {
      const { data, error } = await supabase.rpc('place_order', {
        p_items: items.map((it) => ({ name: it.name, qty: it.qty })),
        p_pickup_date: pickup.iso,
        p_student_name: student,
        p_payment_method: method,
        p_order_type: audience,
        p_request_note: gift ? requestNote.trim() || null : null,
      })
      if (error) throw error
      // The server priced the order; read the saved total back for the transfer amount.
      const id = String(data)
      const { data: saved } = await supabase.from('orders').select('total').eq('id', id).maybeSingle()
      setSheetOpen(false)
      setPlaced({
        id,
        total: saved?.total ?? totalPrice,
        pickupLabel: pickup.label,
        items: items.map((it) => ({ name: it.name, qty: it.qty })),
        studentName: student,
        paymentMethod: method,
        studentDepositNote,
      })
      clear()
      setRequestNote('')
    } catch (e) {
      toast.error(orderErrorMessage(e, gift ? GIFT_MAX_QTY : MAX_QTY))
    } finally {
      setSubmitting(false)
    }
  }

  // The chosen day's bakery menu, grouped by kind (휘낭시에, 소금빵, …).
  const dayBakery = pickup ? (menuItems ?? []).filter((i) => i.category === 'bakery' && i.sale_days.includes(pickup.day)) : []
  // 인기 badge: up to 2 staff picks plus the real bestseller of that day's menu.
  const featured = dayBakery.filter((i) => i.is_featured).slice(0, FEATURED_COUNT)
  const bestBakery = dayBakery
    .filter((i) => !i.is_featured && (popularity.get(i.name) ?? 0) > 0)
    .sort((a, b) => (popularity.get(b.name) ?? 0) - (popularity.get(a.name) ?? 0))[0]
  const popular = new Set([...featured, ...(bestBakery ? [bestBakery] : [])].map((i) => i.name))
  const gifts = (menuItems ?? []).filter((i) => i.category === 'gift')
  const sections: { group: MenuGroup | null; title: string; items: MenuItem[] }[] = (
    gift
      ? [{ group: null, title: '답례품', items: pickup ? gifts : [] }]
      : [
          ...groups.map((g) => ({ group: g, title: g.name, items: dayBakery.filter((i) => i.group_name === g.name) })),
          { group: null, title: '그 밖의 빵', items: dayBakery.filter((i) => !i.group_name || !groupByName.has(i.group_name)) },
        ]
  ).filter((sec) => sec.items.length > 0)
  const drinks = (menuItems ?? []).filter((i) => i.category === 'drink')

  const receipt = (
    <OrderReceipt
      items={items}
      menuByName={menuByName}
      totalPrice={totalPrice}
      pickup={pickup}
      parents={parents}
      gift={gift}
      requestNote={requestNote}
      onRequestNote={setRequestNote}
      pickupTime={pickupTime}
      loggedIn={loading ? null : Boolean(user)}
      submitting={submitting}
      blocker={blocker}
      studentName={studentName}
      onStudentName={changeStudentName}
      paymentMethod={paymentMethod}
      onPaymentMethod={setPaymentMethod}
      studentDepositNote={studentDepositNote}
      onQty={setQty}
      onRemove={removeItem}
      onCheckout={() => void checkout()}
    />
  )

  const notes = (
    <OrderNotes audience={audience} bulkMessage={bulkMessage} studentDepositNote={studentDepositNote} giftMaxQty={GIFT_MAX_QTY} />
  )

  const grid = 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4'

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      {/* Page top, then the pickup day on a dark band (the reference's 예약 layout). */}
      <section className="pad pb-8 pt-[clamp(36px,5vw,64px)]">
        <p className="eyebrow">{parents ? '금요일 픽업' : gift ? '답례품' : '월~금 픽업'}</p>
        <h1 className="mb-4 mt-3 text-[clamp(1.75rem,3vw,2.6rem)] leading-[1.3]">
          {parents || gift ? (
            <>
              {parents ? '금요일에 찾아갈 빵을' : '모임과 행사에 나눌 답례품을'}
              <br />
              <em className="font-normal italic">{gift ? '미리 예약하세요.' : '미리 주문하세요.'}</em>
            </>
          ) : (
            '마을 픽업 주문'
          )}
        </h1>
        <p className="text-[1.05rem] text-eden-mute">
          {parents
            ? '학부모님이 주문하고, 학생이 금요일 하교할 때 찾아가요.'
            : gift
              ? '픽업 날짜를 먼저 고르고 답례품을 담아 주세요.'
              : '픽업 날짜를 먼저 고르고 빵을 담아 주세요.'}{' '}
          <Link to="/guide" className="whitespace-nowrap font-semibold text-eden-ink underline underline-offset-4">
            처음이신가요?
          </Link>
        </p>
      </section>

      <section className="pad grid gap-10 bg-eden-ink py-[clamp(40px,5vw,64px)] text-eden-paper lg:grid-cols-2 lg:items-center lg:gap-[8%]">
        <div>
          <p className="eyebrow !text-eden-paper">1단계 · 날짜</p>
          <h2 className="mb-5 mt-4 text-[clamp(1.6rem,2.8vw,2.4rem)] leading-[1.3]">
            {parents ? '금요일을' : '픽업 날짜를'}
            <br />
            골라주세요.
          </h2>
          <p className="text-[1.05rem] text-eden-mute-2">
            {parents ? '금요일 픽업은 그 주 수요일 밤 11시 59분까지 주문해 주세요.' : '픽업 2일 전 밤 11시 59분까지 주문해 주세요.'}
          </p>
          {parents ? (
            <div className="mt-6 flex max-w-md gap-3 border-t border-eden-paper/30 pt-5">
              <School size={22} strokeWidth={1.7} className="mt-0.5 shrink-0" aria-hidden />
              <p className="text-[1rem] leading-relaxed">{fridayNotice}</p>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 bg-eden-paper p-[clamp(20px,3.2vw,44px)] text-eden-ink">
          <div className="flex items-center justify-between gap-4 border-b border-eden-line pb-4">
            <span className="flex items-center gap-2 text-[1rem] font-bold">
              <CalendarDays size={18} strokeWidth={1.7} aria-hidden /> 날짜
            </span>
            <span className={`text-right text-[1.05rem] ${pickup ? 'font-bold' : 'text-eden-mute'}`}>
              {pickup ? pickup.label : '아래에서 골라 주세요'}
            </span>
          </div>
          <div className="pt-5">
            <PickupDatePicker
              days={shownDays}
              markFriday={!parents && !gift}
              selected={pickup?.iso ?? null}
              onSelect={choosePickup}
            />
          </div>
          <div className="mt-4 space-y-1.5 text-[0.9rem] text-eden-mute">
            <p className="flex items-center gap-1.5">
              <Info size={14} strokeWidth={1.7} aria-hidden />
              {gift ? '날짜를 고르면 아래에 답례품이 나와요.' : '날짜를 고르면 아래에 그날 메뉴가 나와요.'}
            </p>
          </div>
        </div>
      </section>

      <main className="pad pb-16 pt-14">
        <div className="mb-10 lg:hidden">{notes}</div>
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-10">
          <div>
            <section ref={menuRef} className="scroll-mt-[90px]">
              <p className="eyebrow">{gift ? '2단계 · 답례품' : '2단계 · 빵'}</p>
              <h2 className="mb-4 mt-2 border-b border-eden-line pb-3 text-[1.5rem]">
                {gift ? '답례품 고르기' : '빵 고르기'}
                {pickup && !gift ? <span className="ml-2 font-sans text-base font-normal text-eden-mute">{pickup.label} 메뉴</span> : null}
              </h2>
              {menuError ? <p className="text-sm text-destructive">메뉴를 불러오지 못했어요. 새로고침해주세요.</p> : null}
              {!pickup ? (
                <p className="rounded-card border border-dashed border-eden-line px-5 py-10 text-center text-base text-eden-mute">
                  {gift ? '위에서 픽업 날짜를 고르면 답례품이 나와요.' : '위에서 픽업 날짜를 고르면 그날의 메뉴가 나와요.'}
                </p>
              ) : !menuItems && !menuError ? (
                <div className={grid}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="h-56 animate-pulse rounded-card bg-eden-paper-dim" />
                  ))}
                </div>
              ) : menuItems && sections.length === 0 ? (
                <p className="text-sm text-eden-mute">{gift ? '아직 준비된 답례품이 없어요. 곧 올라올 예정이에요.' : '이날 주문할 수 있는 메뉴가 아직 없어요.'}</p>
              ) : (
                <div className="space-y-8">
                  {sections.map((sec) => {
                    const total = sec.group ? (totals.get(sec.group.name) ?? 0) : 0
                    const cap = sec.group?.max_qty ?? null
                    return (
                      <div key={sec.title}>
                        <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
                          <h3 className="font-serif text-lg font-light">{sec.title}</h3>
                          {cap !== null ? (
                            <span className="text-sm text-eden-mute">
                              맛 합계 {cap}개까지{total > 0 ? ` · 지금 ${total}개` : ''}
                            </span>
                          ) : null}
                        </div>
                        {cap !== null && total >= cap ? (
                          <p className="mb-3 rounded-[2px] bg-eden-paper-dim px-4 py-3 text-sm font-semibold">{bulkMessage}</p>
                        ) : null}
                        <div className={grid}>
                          {sec.items.map((item) => (
                            <MenuCard
                              key={item.name}
                              item={item}
                              popular={popular.has(item.name)}
                              qty={qtyOf(item.name)}
                              onAdd={add}
                              onQty={setQty}
                              onOpen={(i) => setDetailName(i.name)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {!parents && !gift && drinks.length > 0 ? (
              <section className="mt-12">
                <p className="eyebrow">매장 전용</p>
                <h2 className="mb-1 mt-2 border-b border-eden-line pb-3 text-[1.5rem]">음료</h2>
                <p className="mb-3 mt-3 text-sm text-eden-mute">음료는 온라인 주문이 안 돼요. 매장에서 바로 주문해 주세요.</p>
                <ul className="grid gap-x-8 sm:grid-cols-2">
                  {drinks.map((item) => (
                    <li key={item.name}>
                      <button
                        type="button"
                        onClick={() => setDetailName(item.name)}
                        className="flex w-full items-baseline justify-between gap-3 border-b border-dashed border-eden-line py-2.5 text-left text-[15px] hover:text-eden-accent"
                      >
                        <span>{item.name}</span>
                        <span className="text-eden-mute">{isUnpriced(item) ? '가격 준비 중' : won(item.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="sticky top-[84px] hidden space-y-3 lg:block">
            {receipt}
            {notes}
          </aside>
        </div>
      </main>
      <SiteFooter />
      {/* Room for the fixed bottom bar on small screens */}
      <div className="h-20 lg:hidden" />

      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-eden-line bg-eden-paper/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(14,27,22,0.35)] backdrop-blur lg:hidden">
        <Link
          to="/guide"
          className="flex h-12 shrink-0 items-center rounded-[3px] border border-eden-line bg-white px-4 text-sm font-semibold text-eden-ink"
        >
          이용방법
        </Link>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-[3px] bg-eden-accent px-5 text-white"
        >
          <span className="truncate text-sm">
            {totalQty > 0 ? (
              <>
                {totalQty}개 담음 · <strong className="font-serif text-base">{won(totalPrice)}</strong>
              </>
            ) : (
              '담은 메뉴 없음'
            )}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
            주문 내역 <ChevronUp size={16} />
          </span>
        </button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-card bg-eden-paper p-4 pt-10">
          <SheetTitle className="sr-only">주문 내역</SheetTitle>
          <SheetDescription className="sr-only">담은 메뉴와 합계, 픽업 날짜를 확인하고 주문해요.</SheetDescription>
          {receipt}
          <div className="mt-3">{notes}</div>
        </SheetContent>
      </Sheet>

      <MenuDetailDialog
        item={detailName ? (menuByName.get(detailName) ?? null) : null}
        popular={detailName ? popular.has(detailName) : false}
        qty={detailName ? qtyOf(detailName) : 0}
        onAdd={add}
        onQty={setQty}
        onClose={() => setDetailName(null)}
      />

      <Dialog open={!!placed} onOpenChange={(open) => !open && setPlaced(null)}>
        <DialogContent className="max-w-[400px] rounded-card bg-eden-paper">
          <DialogTitle className="sr-only">주문 완료</DialogTitle>
          <DialogDescription className="sr-only">결제 안내와 픽업 정보</DialogDescription>
          {placed ? (
            <OrderCompleteBody
              order={{ ...placed, pickupTime }}
              onClose={() => setPlaced(null)}
              onOrders={() => navigate({ to: '/orders' })}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
