import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCart } from '@/lib/cart'
import { useCurrentPickupSlot, otherPickupLabel } from '@/lib/pickup'
import { getErrorMessage } from '@/lib/errors'
import { pageMeta } from '@/lib/seo'
import { useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { GoogleAuthButton } from '@/components/google-auth-button'
import { toast } from 'sonner'

export const Route = createFileRoute('/cart')({ component: CartPage, head: () => pageMeta('/cart') })

function CartPage() {
  const { items, updateQty, removeItem, clear, totalPrice } = useCart()
  const slot = useCurrentPickupSlot()
  const createOrder = useMutation(api.orders.create)
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const checkout = async () => {
    if (!items.length || !slot) return
    setSubmitting(true)
    try {
      const result = await createOrder({
        items: items.map((it) => ({ name: it.name, qty: it.qty })),
        expectedPickupIso: slot.iso,
      })
      clear()
      toast.success(
        `${result.pickupDateLabel} ${result.pickupLabel} 픽업으로 주문이 접수되었습니다. 무통장입금 계좌는 내 주문에서 확인해주세요.`,
      )
      navigate({ to: '/orders' })
    } catch (e) {
      toast.error(getErrorMessage(e, '주문에 실패했습니다.'))
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
                    <button onClick={() => updateQty(it.name, it.qty - 1)} className="flex h-7 w-7 items-center justify-center border border-eden-line">
                      <Minus size={12} />
                    </button>
                    <span className="min-w-5 text-center">{it.qty}</span>
                    <button onClick={() => updateQty(it.name, it.qty + 1)} className="flex h-7 w-7 items-center justify-center border border-eden-line">
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

            <div className="mt-6 border border-eden-line bg-eden-paper-dim p-6">
              <div className="mb-5 border-b border-eden-line pb-5">
                <div className="mb-3 text-xs text-eden-sage-dim">픽업 안내</div>
                {slot ? (
                  <div className="border border-eden-sand bg-eden-sand/10 px-4 py-3">
                    <div className="font-serif text-lg font-semibold text-eden-sand">
                      {slot.dateLabel} {slot.label} 픽업
                    </div>
                    <div className="mt-1 text-xs text-eden-sage-dim">
                      주문 마감 {slot.closesLabel} · 마감 이후에 주문하시면 {otherPickupLabel(slot)} 픽업으로 접수돼요.
                    </div>
                  </div>
                ) : (
                  <div className="h-[62px] animate-pulse bg-eden-line" />
                )}
                <p className="mt-2.5 text-[11px] leading-relaxed text-eden-sage-dim">
                  픽업은 화·목요일에만 가능하고, 주문하신 시간에 따라 픽업 요일이 자동으로 정해져요.
                </p>
              </div>
              <div className="mb-4 flex items-center justify-between text-base font-semibold">
                <span>합계</span>
                <span className="font-serif text-xl text-eden-sand">{totalPrice.toLocaleString('ko-KR')}원</span>
              </div>

              <Authenticated>
                <button
                  onClick={() => void checkout()}
                  disabled={submitting || !slot}
                  className="w-full bg-eden-ink py-3 text-sm font-medium text-eden-paper disabled:opacity-50"
                >
                  {submitting ? '주문 처리 중…' : '주문하기 (무통장입금)'}
                </button>
              </Authenticated>
              <Unauthenticated>
                <p className="mb-3 text-xs text-eden-sage-dim">로그인 후 주문할 수 있어요.</p>
                <GoogleAuthButton label="Google로 로그인하고 주문하기" className="w-full" />
              </Unauthenticated>
              <AuthLoading>
                <div className="h-11 w-full animate-pulse bg-eden-line" />
              </AuthLoading>
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  )
}
