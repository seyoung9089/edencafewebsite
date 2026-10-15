import { createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { ORDER_COMPLETE_VARIANTS, OrderCompleteBody, type PlacedOrder } from '@/components/order-complete'
import { useContentValue, useSiteContent } from '@/lib/site-content'
import { getCurrentPickupSlot } from '@/lib/pickup'

// Temporary page for choosing the order-complete design. Remove once chosen.
export const Route = createFileRoute('/order-complete-preview')({
  component: OrderCompletePreview,
  head: () => ({ meta: [{ title: '주문 완료 창 시안 | 이든카페' }, { name: 'robots', content: 'noindex' }] }),
})

function OrderCompletePreview() {
  const content = useSiteContent()
  const sample: PlacedOrder = {
    id: '9f3c2a1b-4d5e-4f60-8a7b-1c2d3e4f5a6b',
    total: 12800,
    pickupLabel: getCurrentPickupSlot(Date.now()).dateLabel,
    pickupTime: useContentValue(content, 'pickup.time'),
    items: [
      { name: '이든 소금빵', qty: 2 },
      { name: '이든 시그니처 라떼', qty: 1 },
    ],
  }
  const noop = () => {}

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-10 md:px-8">
        <h1 className="mb-2 font-serif text-2xl font-semibold">주문 완료 창 시안</h1>
        <p className="mb-8 text-sm text-eden-sage-dim">마음에 드는 시안의 이름(A~D)을 알려주세요. 실제로는 화면 가운데 작은 창으로 떠요.</p>
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {ORDER_COMPLETE_VARIANTS.map((v) => (
            <section key={v.id}>
              <h2 className="font-serif text-lg font-semibold">{v.label}</h2>
              <p className="mb-3 text-xs text-eden-sage-dim">{v.note}</p>
              <div className="rounded-card bg-eden-ink-2/80 p-5">
                <div className="mx-auto max-w-[400px] rounded-card bg-eden-paper p-6 shadow-lift">
                  <OrderCompleteBody variant={v.id} order={sample} onClose={noop} onOrders={noop} />
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
