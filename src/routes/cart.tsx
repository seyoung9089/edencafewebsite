import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCart } from '@/lib/cart'
import { useCurrentPickupSlot } from '@/lib/pickup'
import { getErrorMessage } from '@/lib/errors'
import { pageMeta } from '@/lib/seo'
import { useEffect, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { OrderCompleteBody, type PlacedOrder } from '@/components/order-complete'
import { useContentValue, useSiteContent } from '@/lib/site-content'
import { useMenu } from '@/lib/menu'


/** Turns database errors from place_order into something a customer can act on. */
function orderErrorMessage(e: unknown): string {
  const message = getErrorMessage(e, '주문에 실패했습니다.')
  if (message.includes('Pickup schedule changed')) return '픽업 날짜가 바뀌었어요. 새로고침한 뒤 다시 주문해주세요.'
  if (message.includes('Unavailable menu item')) return `품절되었거나 없는 메뉴가 있어요: ${message.split(':').pop()?.trim()}`
  if (message.includes('Login required')) return '로그인이 필요해요.'
  return message
}

export const Route = createFileRoute('/cart')({ component: CartPage, head: () => pageMeta('/cart') })

function CartPage() {
  const { items, updateQty, removeItem, clear, totalPrice } = useCart()
  const slot = useCurrentPickupSlot()
  const { user, loading } = useCustomerAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [placed, setPlaced] = useState<Omit<PlacedOrder, 'pickupTime'> | null>(null)
  const content = useSiteContent()
  const pickupTime = useContentValue(content, 'pickup.time')
  const { items: menuItems, error: menuError } = useMenu()

  useEffect(() => {
    if (!menuItems || menuError) return
    const drinks = new Set(menuItems.filter((item) => item.category === 'drink').map((item) => item.name))
    for (const item of items) if (drinks.has(item.name)) removeItem(item.name)
  }, [menuItems, menuError, items])

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

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <section className="px-6 pb-24 pt-14 md:px-8">
        <h1 className="mb-3 font-serif text-3xl font-semibold">장바구니</h1>
        <p className="mb-10 text-[15px] text-eden-sage-dim">담은 메뉴를 확인하고 수량을 조정한 뒤 주문해주세요.</p>

        {!items.length ? (
          <div className="max-w-xl py-16 text-center text-eden-sage-dim">
            <p className="mb-4">장바구니가 비어있습니다.</p>
          </div>
        ) : (
          <div className="max-w-3xl">
            <div className="border-t border-eden-line">
              {items.map((it) => (
                <div key={it.name} className="flex flex-wrap items-center gap-4 border-b border-eden-line py-5">
                  <div className="flex-1">
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-xs text-eden-sage-dim">{it.price.toLocaleString('ko-KR')}원 / 1개</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(it.name, it.qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-eden-line hover:bg-eden-paper-dim">
                      <Minus size={12} />
                    </button>
                    <span className="min-w-5 text-center">{it.qty}</span>
                    <button onClick={() => updateQty(it.name, it.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-eden-line hover:bg-eden-paper-dim">
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="w-24 text-right font-serif font-semibold text-eden-sand">
                    {(it.price * it.qty).toLocaleString('ko-KR')}원
                  </div>
                  <button onClick={() => removeItem(it.name)} aria-label="삭제" className="text-eden-sage-dim hover:text-destructive">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-card bg-eden-paper-dim shadow-soft p-6">
              <div className="mb-5 border-b border-eden-line pb-5">
                <div className="mb-3 text-xs text-eden-sage-dim">픽업 안내</div>
                {slot ? (
                  <div className="rounded-[10px] bg-eden-sand/15 px-4 py-3">
                    <div className="font-serif text-lg font-semibold text-eden-sand">
                      {slot.dateLabel} 픽업
                    </div>
                    <div className="mt-1 text-xs text-eden-sage-dim">오늘 {slot.todayLabel} 주문</div>
                  </div>
                ) : (
                  <div className="h-[62px] animate-pulse bg-eden-line" />
                )}
                <p className="mt-2.5 text-[11px] leading-relaxed text-eden-sage-dim">
                  오늘 자정까지 주문하시면 다음 날 픽업이에요.
                </p>
              </div>
              <div className="mb-4 flex items-center justify-between text-base font-semibold">
                <span>합계</span>
                <span className="font-serif text-xl text-eden-sand">{totalPrice.toLocaleString('ko-KR')}원</span>
              </div>

              {user ? (
                <button
                  onClick={() => void checkout()}
                  disabled={submitting || !slot || !menuItems || Boolean(menuError)}
                  className="w-full bg-eden-ink py-3 text-sm font-semibold text-eden-paper disabled:opacity-50 rounded-full transition-colors hover:bg-eden-ink-2"
                >
                  {submitting ? '주문 처리 중…' : '주문하기 (무통장입금)'}
                </button>
              ) : !loading ? (
                <p className="mb-3 text-xs text-eden-sage-dim">로그인 후 주문할 수 있어요.</p>
              ) : null}
              {!user && !loading ? <Link to="/login" className="block w-full bg-eden-ink py-3 text-center text-sm font-semibold text-eden-paper rounded-full transition-colors hover:bg-eden-ink-2">이메일로 로그인하고 주문하기</Link> : null}
              {loading ? (
                <div className="h-11 w-full animate-pulse bg-eden-line" />
              ) : null}
            </div>
          </div>
        )}
      </section>
      <SiteFooter />

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
