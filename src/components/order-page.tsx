import { Link, useNavigate } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { OrderReceipt, type PaymentMethod } from '@/components/order-receipt'
import { PickupDatePicker } from '@/components/pickup-date-picker'
import { OrderCompleteBody, type PlacedOrder } from '@/components/order-complete'
import { GIFT_MAX_QTY, MAX_QTY, groupTotals, maxQtyFor, overGroupLimit, reconcileCart, useCart, useGiftCart } from '@/lib/cart'
import { pickupLabel, usePickupDates } from '@/lib/pickup'
import { useCustomerAuth } from '@/lib/customer-auth'
import { useContentValue, useSiteContent } from '@/lib/site-content'
import { useMenu, isSoldOut, isUnpriced, fetchPopularity, type MenuGroup, type MenuItem } from '@/lib/menu'
import { getErrorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { MenuDetailDialog } from '@/components/menu-detail'
import { Minus, Plus, Croissant, Coffee, Flame, ChevronUp, ChevronRight, School, Gift, Clock } from 'lucide-react'
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
    <div className={`flex flex-col rounded-card bg-eden-paper-dim p-3 shadow-soft ${qty > 0 ? 'ring-2 ring-eden-sand' : ''}`}>
      {/* Photo and name both open the detail view: one big tap target. */}
      <button type="button" onClick={() => onOpen(item)} aria-label={`${item.name} 자세히 보기`} className="group text-left">
        <div className="relative mb-3 flex aspect-[2/1] items-center justify-center overflow-hidden rounded-[10px] bg-eden-paper">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className={`h-full w-full object-cover ${soldOut ? 'grayscale opacity-50' : ''}`}
              loading="lazy"
            />
          ) : (
            <Icon size={28} strokeWidth={1.5} className={`text-eden-sage-dim ${soldOut ? 'opacity-50' : ''}`} />
          )}
          {popular ? (
            <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-eden-sand px-2 py-0.5 text-[11px] font-semibold text-eden-ink-2">
              <Flame size={11} strokeWidth={2} /> 인기
            </span>
          ) : null}
          {soldOut ? (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-eden-ink-2/90 px-2 py-0.5 text-[11px] font-semibold text-eden-paper">
              품절
            </span>
          ) : null}
        </div>
        <span className="flex items-start gap-0.5 font-serif text-[15px] font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">
          {item.name}
          <ChevronRight size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-eden-sage-dim" aria-hidden />
        </span>
      </button>
      <div className="mb-3 mt-1 flex flex-wrap items-baseline justify-between gap-x-2">
        <span className={unpriced ? 'text-sm text-eden-sage-dim' : 'font-semibold text-eden-ink'}>{unpriced ? '가격 준비 중' : won(item.price)}</span>
        {item.category !== 'drink' && item.stock !== null && item.stock > 0 ? (
          <span className="text-xs text-eden-sage-dim">{item.stock}개 남음</span>
        ) : null}
      </div>
      <div className="mt-auto">
        {item.category === 'drink' ? (
          <span className="flex h-10 items-center justify-center rounded-full border border-eden-line text-xs text-eden-sage-dim">
            매장에서만 주문
          </span>
        ) : soldOut || unpriced ? (
          <span className="flex h-10 items-center justify-center rounded-full border border-eden-line text-xs text-eden-sage-dim">
            {soldOut ? '품절' : '준비 중'}
          </span>
        ) : qty > 0 ? (
          <div className="flex h-10 items-center justify-between rounded-full bg-eden-ink px-1 text-eden-paper">
            <button
              type="button"
              onClick={() => (qty <= 1 ? onQty(item.name, 0) : onQty(item.name, qty - 1))}
              aria-label={`${item.name} 하나 빼기`}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-eden-ink-2"
            >
              <Minus size={15} />
            </button>
            <span className="font-semibold" aria-live="polite">{qty}개</span>
            <button
              type="button"
              onClick={() => onQty(item.name, qty + 1)}
              disabled={qty >= max}
              aria-label={`${item.name} 하나 더`}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-eden-ink-2 disabled:opacity-30"
            >
              <Plus size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(item)}
            className="h-10 w-full rounded-full border border-eden-ink text-sm font-semibold text-eden-ink transition-colors hover:bg-eden-ink hover:text-eden-paper"
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
export function OrderPage({ audience }: { audience: OrderAudience }) {
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
  const bulkMessage = `${useContentValue(content, 'order.bulkNotice')} ${useContentValue(content, 'order.bulkContact')}`
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
    setPickupIso(readStored(PICKUP_KEY[audience]) || null)
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

  const grid = 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4'

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-8">
        <div className="mb-6">
          <h1 className="mb-2 font-serif text-3xl font-semibold">{parents ? '학부모 주문' : gift ? '답례품 예약' : '마을 픽업 주문'}</h1>
          <p className="text-[15px] text-eden-sage-dim">
            {parents
              ? '금요일에 학생이 하교하면서 찾아갈 빵을 주문해 주세요.'
              : gift
                ? '행사나 모임에 나눌 답례품을 미리 예약해 주세요. 픽업 날짜를 먼저 고르면 돼요.'
                : '픽업 날짜를 먼저 고르고 빵을 담아 주세요.'}{' '}
            <Link to="/guide" className="whitespace-nowrap font-semibold text-eden-ink underline underline-offset-4">
              처음이신가요?
            </Link>
          </p>
        </div>

        {parents ? (
          <div className="mb-8 flex gap-3 rounded-card border-2 border-eden-sand bg-eden-sand/15 px-5 py-4">
            <School size={24} strokeWidth={1.8} className="mt-0.5 shrink-0 text-eden-sand" aria-hidden />
            <p className="text-base font-semibold leading-relaxed text-eden-ink">{fridayNotice}</p>
          </div>
        ) : gift ? (
          <p className="mb-8 text-sm text-eden-sage-dim">
            답례품은 빵 주문과 따로 담겨요. 빵은{' '}
            <Link to="/order" className="font-semibold text-eden-ink underline underline-offset-4">
              마을 픽업 주문
            </Link>
            에서 주문해 주세요.
          </p>
        ) : (
          <p className="mb-8 text-sm text-eden-sage-dim">
            학생이 금요일에 찾아갈 빵은{' '}
            <Link to="/parents" className="font-semibold text-eden-ink underline underline-offset-4">
              학부모 주문
            </Link>
            에서 주문해 주세요.
          </p>
        )}

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
          <div>
            <section>
              <h2 className="mb-4 border-b border-eden-line pb-3 font-serif text-xl font-semibold">{parents ? '1. 금요일 고르기' : '1. 픽업 날짜 고르기'}</h2>
              {shownDays?.length && !parents ? (
                <p className="mb-1 text-sm text-eden-sage-dim">
                  {pickupLabel(shownDays[0].iso)} ~ {pickupLabel(shownDays[shownDays.length - 1].iso)} 픽업
                </p>
              ) : null}
              <p className="mb-3 text-[15px] font-semibold">
                {parents ? '금요일 픽업은 그 주 수요일 밤 11시 59분까지 주문해 주세요.' : '픽업 2일 전 밤 11시 59분까지 주문해 주세요.'}
              </p>
              <PickupDatePicker
                days={shownDays}
                markFriday={!parents && !gift}
                selected={pickup?.iso ?? null}
                onSelect={choosePickup}
              />
              {pickup ? (
                <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-eden-paper-dim px-4 py-3 text-[15px] leading-relaxed">
                  <Clock size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-eden-sage-dim" aria-hidden />
                  <span>
                    <strong>{pickup.label}</strong> 픽업은 <strong>{pickup.deadlineLabel} 밤 11시 59분</strong>까지 주문할 수 있어요.
                  </span>
                </p>
              ) : null}
              {parents || gift ? null : (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-eden-sage-dim">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-eden-sand" />
                  표시가 있는 금요일은 메뉴가 달라요.
                </p>
              )}
            </section>

            <section ref={menuRef} className="mt-12 scroll-mt-[100px]">
              <h2 className="mb-4 border-b border-eden-line pb-3 font-serif text-xl font-semibold">
                {gift ? '2. 답례품 고르기' : '2. 빵 고르기'}
                {pickup && !gift ? <span className="ml-2 font-sans text-base font-normal text-eden-sage-dim">{pickup.label} 메뉴</span> : null}
              </h2>
              {menuError ? <p className="text-sm text-destructive">메뉴를 불러오지 못했어요. 새로고침해주세요.</p> : null}
              {!pickup ? (
                <p className="rounded-card border border-dashed border-eden-line px-5 py-10 text-center text-base text-eden-sage-dim">
                  {gift ? '위에서 픽업 날짜를 고르면 답례품이 나와요.' : '위에서 픽업 날짜를 고르면 그날의 메뉴가 나와요.'}
                </p>
              ) : !menuItems && !menuError ? (
                <div className={grid}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="h-56 animate-pulse rounded-card bg-eden-paper-dim" />
                  ))}
                </div>
              ) : menuItems && sections.length === 0 ? (
                <p className="text-sm text-eden-sage-dim">{gift ? '아직 준비된 답례품이 없어요. 곧 올라올 예정이에요.' : '이날 주문할 수 있는 메뉴가 아직 없어요.'}</p>
              ) : (
                <div className="space-y-8">
                  {sections.map((sec) => {
                    const total = sec.group ? (totals.get(sec.group.name) ?? 0) : 0
                    const cap = sec.group?.max_qty ?? null
                    return (
                      <div key={sec.title}>
                        <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
                          <h3 className="font-serif text-lg font-semibold">{sec.title}</h3>
                          {cap !== null ? (
                            <span className="text-sm text-eden-sage-dim">
                              맛 합계 {cap}개까지{total > 0 ? ` · 지금 ${total}개` : ''}
                            </span>
                          ) : null}
                        </div>
                        {cap !== null && total >= cap ? (
                          <p className="mb-3 rounded-[10px] bg-eden-sand/15 px-4 py-3 text-sm font-semibold">{bulkMessage}</p>
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
                <h2 className="mb-1 border-b border-eden-line pb-3 font-serif text-xl font-semibold">음료</h2>
                <p className="mb-4 mt-3 text-sm text-eden-sage-dim">음료는 매장에서 바로 주문해주세요.</p>
                <div className={grid}>
                  {drinks.map((item) => (
                    <MenuCard key={item.name} item={item} qty={0} onAdd={add} onQty={setQty} onOpen={(i) => setDetailName(i.name)} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="sticky top-[94px] hidden lg:block">{receipt}</aside>
        </div>
      </main>
      <SiteFooter />
      {/* Room for the fixed bottom bar on small screens */}
      <div className="h-20 lg:hidden" />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-eden-line bg-eden-paper/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(14,27,22,0.35)] backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-12 w-full items-center justify-between rounded-full bg-eden-ink px-5 text-eden-paper"
        >
          <span className="text-sm">
            {totalQty > 0 ? (
              <>
                {totalQty}개 담음 · <strong className="font-serif text-base">{won(totalPrice)}</strong>
              </>
            ) : (
              '아직 담은 메뉴가 없어요'
            )}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold">
            주문 내역 <ChevronUp size={16} />
          </span>
        </button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-card bg-eden-paper p-4 pt-10">
          <SheetTitle className="sr-only">주문 내역</SheetTitle>
          <SheetDescription className="sr-only">담은 메뉴와 합계, 픽업 날짜를 확인하고 주문해요.</SheetDescription>
          {receipt}
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
