import { createFileRoute, Link } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { MY_ORDERS_VARIANTS, MyOrdersBody, type CustomerOrder } from '@/components/my-orders'
import { getCurrentPickupSlot } from '@/lib/pickup'

// Temporary page for choosing the 내 주문 design. Remove once chosen.
export const Route = createFileRoute('/my-orders-preview')({
  component: MyOrdersPreview,
  head: () => ({ meta: [{ title: '내 주문 시안 | 이든카페' }, { name: 'robots', content: 'noindex' }] }),
})

const DAY = 86_400_000
const iso = (offsetDays: number) => new Date(Date.now() + 9 * 3_600_000 + offsetDays * DAY).toISOString().slice(0, 10)

function sampleOrders(): CustomerOrder[] {
  const tomorrow = getCurrentPickupSlot(Date.now()).iso
  return [
    { id: '9f3c2a1b-0000-4000-8000-000000000001', status: 'wait', pickup_date: tomorrow, created_at: new Date().toISOString(), total: 12800,
      items: [{ name: '이든 소금빵', price: 4000, qty: 2 }, { name: '이든 시그니처 라떼', price: 4800, qty: 1 }] },
    { id: '4b7d1e2c-0000-4000-8000-000000000002', status: 'done', pickup_date: iso(0), created_at: new Date(Date.now() - DAY).toISOString(), total: 6000,
      items: [{ name: '통밀 캄파뉴', price: 6000, qty: 1 }] },
    { id: 'c1a2b3d4-0000-4000-8000-000000000003', status: 'picked', pickup_date: iso(-5), created_at: new Date(Date.now() - 6 * DAY).toISOString(), total: 9300,
      items: [{ name: '이든 아메리카노', price: 3500, qty: 1 }, { name: '카페모카', price: 5000, qty: 1 }] },
  ]
}

function MyOrdersPreview() {
  const orders = sampleOrders()
  const noop = async () => {}
  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-10 md:px-8">
        <h1 className="mb-2 font-serif text-2xl font-semibold">내 주문 화면 시안</h1>
        <p className="mb-8 text-sm text-eden-sage-dim">
          예시 주문 3건(입금 대기 · 준비 중 · 픽업 완료)으로 보여드려요. 마음에 드는 시안(A~E)을 알려주세요. 로그인한 상태에서{' '}
          <Link to="/orders" search={{ v: 'progress' }} className="underline">/orders?v=progress</Link>처럼 열면 내 실제 주문으로도 볼 수 있어요.
        </p>
        <div className="grid gap-10 lg:grid-cols-2">
          {MY_ORDERS_VARIANTS.map((v) => (
            <section key={v.id} className={v.id === 'table' ? 'lg:col-span-2' : ''}>
              <h2 className="font-serif text-lg font-semibold">{v.label}</h2>
              <p className="mb-3 text-xs text-eden-sage-dim">{v.note} · <code>?v={v.id}</code></p>
              <div className="rounded-card border border-eden-line bg-eden-paper p-5 shadow-soft">
                <h3 className="mb-6 font-serif text-2xl font-semibold">내 주문</h3>
                <MyOrdersBody variant={v.id} name="장세영" email="1125@bmrschool.org" orders={orders} onSaveName={noop} onSignOut={() => {}} />
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
