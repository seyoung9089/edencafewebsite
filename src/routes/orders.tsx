import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '@/convex/_generated/api'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { GoogleAuthButton } from '@/components/google-auth-button'
import { pageMeta } from '@/lib/seo'
import { useState } from 'react'

export const Route = createFileRoute('/orders')({ component: OrdersPage, head: () => pageMeta('/orders') })

const STATUS_LABEL: Record<string, string> = { wait: '입금대기', done: '입금확인완료', picked: '픽업완료' }
const STATUS_CLASS: Record<string, string> = {
  wait: 'bg-eden-sand text-eden-ink-2',
  done: 'bg-eden-sage text-eden-ink-2',
  picked: 'bg-eden-line text-eden-sage-dim',
}

function OrderRow({ order }: { order: any }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-eden-line py-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="w-20 text-sm">#{order._id.slice(-5)}</span>
        <span className="flex-1 text-sm">
          {order.items[0].name}
          {order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : order.items[0].qty > 1 ? ` x${order.items[0].qty}` : ''}
        </span>
        <span className="text-sm text-eden-sage-dim">{order.pickupDateLabel} ({order.pickupDow === 'tue' ? '화' : '목'})</span>
        <span className="text-sm font-semibold">{order.total.toLocaleString('ko-KR')}원</span>
        <span className={`rounded-full px-3.5 py-1 text-[11px] font-bold ${STATUS_CLASS[order.status]}`}>
          {STATUS_LABEL[order.status]}
        </span>
        {order.status === 'wait' ? (
          <button onClick={() => setOpen((o) => !o)} className="text-xs text-eden-sand underline">
            계좌보기
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="mt-3 bg-eden-sage-dim px-4 py-3 text-xs leading-relaxed text-eden-paper">
          새마을금고 000-0000-0000-00
          <br />
          예금주: 이든협동조합
          <br />
          입금금액: {order.total.toLocaleString('ko-KR')}원 (주문 후 30분 이내)
        </div>
      ) : null}
    </div>
  )
}

function OrdersPage() {
  const result = useQuery(api.orders.listMine)
  const { signOut } = useAuthActions()

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <section className="px-6 pb-24 pt-14 md:px-8">
        <h1 className="mb-3 font-serif text-3xl font-semibold">내 주문</h1>
        <p className="mb-10 text-[15px] text-eden-sage-dim">주문 내역과 입금 상태를 확인하세요.</p>

        <AuthLoading>
          <div className="h-24 w-full max-w-3xl animate-pulse bg-eden-line" />
        </AuthLoading>

        <Unauthenticated>
          <div className="max-w-sm">
            <p className="mb-4 text-sm text-eden-sage-dim">로그인 후 주문 내역을 확인할 수 있어요.</p>
            <GoogleAuthButton className="w-full" />
          </div>
        </Unauthenticated>

        <Authenticated>
          <div className="mb-6 flex items-center justify-between bg-eden-sage-dim px-5 py-4 text-sm text-eden-paper">
            <span>로그인됨</span>
            <button onClick={() => void signOut()} className="text-eden-sand underline">로그아웃</button>
          </div>
          <div className="max-w-3xl">
            {!result || !result.ok ? (
              <p className="text-sm text-eden-sage-dim">불러오는 중…</p>
            ) : result.items.length === 0 ? (
              <p className="border-t border-eden-line py-10 text-center text-sm text-eden-sage-dim">
                아직 주문 내역이 없습니다.
              </p>
            ) : (
              <div className="border-b border-eden-line">
                {result.items.map((order) => (
                  <OrderRow key={order._id} order={order} />
                ))}
              </div>
            )}
          </div>
        </Authenticated>
      </section>
      <SiteFooter />
    </div>
  )
}
