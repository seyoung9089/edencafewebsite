import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { OrderReceipt } from '@/components/order-receipt'
import { OrderCompleteBody, type PlacedOrder } from '@/components/order-complete'
import { MAX_QTY, maxQtyFor, reconcileCart, useCart } from '@/lib/cart'
import { useCurrentPickupSlot } from '@/lib/pickup'
import { useCustomerAuth } from '@/lib/customer-auth'
import { useContentValue, useSiteContent } from '@/lib/site-content'
import { useMenu, isSoldOut, fetchPopularity, type MenuItem } from '@/lib/menu'
import { getErrorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { pageMeta } from '@/lib/seo'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Minus, Plus, Croissant, Coffee, Flame, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/order')({ component: OrderPage, head: () => pageMeta('/order') })

const CATEGORY_ICON = { bakery: Croissant, drink: Coffee } as const

/** Max staff-curated picks marked 인기 (see menu-panel.tsx). */
const FEATURED_COUNT = 2

/** Turns database errors from place_order into something a customer can act on. */
function orderErrorMessage(e: unknown): string {
  const message = getErrorMessage(e, '주문에 실패했습니다.')
  if (message.includes('Pickup schedule changed')) return '픽업 날짜가 바뀌었어요. 새로고침한 뒤 다시 주문해주세요.'
  if (message.includes('Unavailable menu item') || message.includes('Only available bakery items'))
    return `방금 품절되었거나 지금 주문할 수 없는 메뉴가 있어요: ${message.split(':').pop()?.trim()}. 주문 내역에서 빼고 다시 주문해주세요.`
  if (message.includes('Invalid quantity')) return `한 메뉴는 ${MAX_QTY}개까지 주문할 수 있어요. 수량을 줄여주세요.`
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
}: {
  item: MenuItem
  popular?: boolean
  qty: number
  onAdd: (item: MenuItem) => void
  onQty: (name: string, qty: number) => void
}) {
  const Icon = CATEGORY_ICON[item.category]
  const soldOut = item.category === 'bakery' && isSoldOut(item)
  const max = maxQtyFor(item)
  return (
    <div className={`flex flex-col rounded-card bg-eden-paper-dim p-3 shadow-soft ${qty > 0 ? 'ring-2 ring-eden-sand' : ''}`}>
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
      <h3 className="font-serif text-[15px] font-semibold leading-snug">{item.name}</h3>
      <div className="mb-3 mt-1 flex flex-wrap items-baseline justify-between gap-x-2">
        <span className="font-semibold text-eden-ink">{won(item.price)}</span>
        {item.category === 'bakery' && item.stock !== null && item.stock > 0 ? (
          <span className="text-xs text-eden-sage-dim">{item.stock}개 남음</span>
        ) : null}
      </div>
      <div className="mt-auto">
        {item.category === 'drink' ? (
          <span className="flex h-10 items-center justify-center rounded-full border border-eden-line text-xs text-eden-sage-dim">
            매장에서만 주문
          </span>
        ) : soldOut ? (
          <span className="flex h-10 items-center justify-center rounded-full border border-eden-line text-xs text-eden-sage-dim">
            품절
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

function OrderPage() {
  const { items: menuItems, error: menuError } = useMenu()
  const { items, addItem, updateQty, removeItem, clear, replaceItems, totalQty, totalPrice } = useCart()
  const slot = useCurrentPickupSlot()
  const { user, loading } = useCustomerAuth()
  const navigate = useNavigate()
  const content = useSiteContent()
  const pickupTime = useContentValue(content, 'pickup.time')
  const [popularity, setPopularity] = useState<Map<string, number>>(new Map())
  const [submitting, setSubmitting] = useState(false)
  const [placed, setPlaced] = useState<Omit<PlacedOrder, 'pickupTime'> | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

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

  // Sold out since it was added, drinks, or more than what's left: fix the cart
  // here and say what changed, instead of letting the order fail later.
  useEffect(() => {
    if (!menuItems || menuError) return
    const { next, removed, reduced, changed } = reconcileCart(items, menuItems)
    if (!changed) return
    replaceItems(next)
    if (removed.length) toast.info(`품절되었거나 온라인으로 주문할 수 없는 메뉴라 주문 내역에서 뺐어요: ${removed.join(', ')}`)
    for (const r of reduced) toast.info(`${r.name}은(는) 남은 수량이 ${r.qty}개라 수량을 맞췄어요.`)
  }, [menuItems, menuError, items])

  const menuByName = new Map((menuItems ?? []).map((m) => [m.name, m]))
  const qtyOf = (name: string) => items.find((it) => it.name === name)?.qty ?? 0

  const add = (item: MenuItem) => {
    if (item.category !== 'bakery' || isSoldOut(item)) return
    addItem({ name: item.name, price: item.price, qty: 1 })
  }
  const setQty = (name: string, qty: number) => {
    if (qty <= 0) removeItem(name)
    else updateQty(name, Math.min(qty, maxQtyFor(menuByName.get(name))))
  }

  const checkout = async () => {
    if (!items.length || !slot || !menuItems || menuError) return
    const orderable = new Set(menuItems.filter((item) => item.category === 'bakery').map((item) => item.name))
    if (items.some((item) => !orderable.has(item.name))) {
      toast.error('베이커리 메뉴만 온라인으로 주문할 수 있어요.')
      return
    }
    setSubmitting(true)
    try {
      const { data, error } = await supabase.rpc('place_order', {
        p_items: items.map((it) => ({ name: it.name, qty: it.qty })),
        p_pickup_date: slot.iso,
      })
      if (error) throw error
      // The server priced the order; read the saved total back for the transfer amount.
      const id = String(data)
      const { data: saved } = await supabase.from('orders').select('total').eq('id', id).maybeSingle()
      setSheetOpen(false)
      setPlaced({
        id,
        total: saved?.total ?? totalPrice,
        pickupLabel: slot.dateLabel,
        items: items.map((it) => ({ name: it.name, qty: it.qty })),
      })
      clear()
    } catch (e) {
      toast.error(orderErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  // Popular items (up to 2 staff picks plus the real bestseller) go first with a badge.
  const featured = (menuItems ?? []).filter((i) => i.category === 'bakery' && i.is_featured).slice(0, FEATURED_COUNT)
  const bestBakery = (menuItems ?? [])
    .filter((i) => i.category === 'bakery' && !i.is_featured)
    .filter((i) => (popularity.get(i.name) ?? 0) > 0)
    .sort((a, b) => (popularity.get(b.name) ?? 0) - (popularity.get(a.name) ?? 0))[0]
  const popular = new Set([...featured, ...(bestBakery ? [bestBakery] : [])].map((i) => i.name))
  const bakery = (menuItems ?? [])
    .filter((i) => i.category === 'bakery')
    .sort((a, b) => Number(popular.has(b.name)) - Number(popular.has(a.name)))
  const drinks = (menuItems ?? []).filter((i) => i.category === 'drink')

  const receipt = (
    <OrderReceipt
      items={items}
      menuByName={menuByName}
      totalPrice={totalPrice}
      slot={slot}
      pickupTime={pickupTime}
      loggedIn={loading ? null : Boolean(user)}
      submitting={submitting}
      canSubmit={items.length > 0 && Boolean(slot) && Boolean(menuItems) && !menuError}
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
        <div className="mb-8">
          <h1 className="mb-2 font-serif text-3xl font-semibold">주문</h1>
          <p className="text-[15px] text-eden-sage-dim">
            빵을 담고 주문하면 다음 날 매장에서 찾아가실 수 있어요.{' '}
            <Link to="/guide" className="whitespace-nowrap font-semibold text-eden-ink underline underline-offset-4">
              처음이신가요?
            </Link>
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
          <div>
            <section>
              <h2 className="mb-4 border-b border-eden-line pb-3 font-serif text-xl font-semibold">베이커리</h2>
              {menuError ? <p className="text-sm text-destructive">메뉴를 불러오지 못했어요. 새로고침해주세요.</p> : null}
              {menuItems && bakery.length === 0 ? <p className="text-sm text-eden-sage-dim">등록된 메뉴가 없습니다.</p> : null}
              {!menuItems && !menuError ? (
                <div className={grid}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="h-56 animate-pulse rounded-card bg-eden-paper-dim" />
                  ))}
                </div>
              ) : (
                <div className={grid}>
                  {bakery.map((item) => (
                    <MenuCard key={item.name} item={item} popular={popular.has(item.name)} qty={qtyOf(item.name)} onAdd={add} onQty={setQty} />
                  ))}
                </div>
              )}
            </section>

            {drinks.length > 0 ? (
              <section className="mt-12">
                <h2 className="mb-1 border-b border-eden-line pb-3 font-serif text-xl font-semibold">음료</h2>
                <p className="mb-4 mt-3 text-sm text-eden-sage-dim">음료는 매장에서 바로 주문해주세요.</p>
                <div className={grid}>
                  {drinks.map((item) => (
                    <MenuCard key={item.name} item={item} qty={0} onAdd={add} onQty={setQty} />
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

      <Dialog open={!!placed} onOpenChange={(open) => !open && setPlaced(null)}>
        <DialogContent className="max-w-[400px] rounded-card bg-eden-paper">
          <DialogTitle className="sr-only">주문 완료</DialogTitle>
          <DialogDescription className="sr-only">무통장 입금 안내와 픽업 정보</DialogDescription>
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
