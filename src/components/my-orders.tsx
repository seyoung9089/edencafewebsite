import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import { PaymentInfo } from '@/components/payment-info'
import { getCurrentPickupSlot } from '@/lib/pickup'

export type CustomerOrder = {
  id: string
  items: { name: string; price: number; qty: number }[]
  total: number
  status: 'wait' | 'done' | 'picked'
  pickup_date: string
  created_at: string
}

export type MyOrdersProps = {
  name: string
  email: string
  orders: CustomerOrder[]
  onSaveName: (name: string) => Promise<void>
  onSignOut: () => void
}

// ── shared bits ──────────────────────────────────────────────────────────

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
const STATUS = {
  wait: { label: '입금 대기', short: '입금 대기', tone: 'bg-eden-sand text-eden-ink-2' },
  done: { label: '입금 확인 · 준비 중', short: '준비 중', tone: 'bg-eden-sage text-eden-ink-2' },
  picked: { label: '픽업 완료', short: '픽업 완료', tone: 'bg-eden-line text-eden-sage-dim' },
} as const

export function pickupLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${WEEKDAY_KO[d.getUTCDay()]})`
}
const orderedOn = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', weekday: 'short' })
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
/** Shows the customer's name with a small inline editor. */
function NameLine({ name, onSave, className = '', suffix = '님' }: { name: string; onSave: (name: string) => Promise<void>; className?: string; suffix?: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [busy, setBusy] = useState(false)

  if (editing || !name) {
    return (
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!value.trim()) return
          setBusy(true)
          await onSave(value.trim())
          setBusy(false)
          setEditing(false)
        }}
      >
        <input
          aria-label="이름"
          placeholder="이름을 입력해주세요"
          maxLength={30}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-40 rounded-[10px] border border-eden-line bg-eden-paper px-3 py-1.5 text-sm text-eden-ink"
        />
        <button disabled={busy} className="rounded-full bg-eden-ink px-3 py-1.5 text-xs font-semibold text-eden-paper disabled:opacity-50">
          저장
        </button>
        {name ? (
          <button type="button" onClick={() => setEditing(false)} className="text-xs underline">
            취소
          </button>
        ) : (
          <span className="text-xs opacity-70">픽업할 때 확인할 이름이에요.</span>
        )}
      </form>
    )
  }
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {name}
      {suffix}
      <button type="button" onClick={() => setEditing(true)} aria-label="이름 변경" className="opacity-50 hover:opacity-100">
        <Pencil size={14} />
      </button>
    </span>
  )
}

function QuickLinks({ onSignOut, className = '' }: { onSignOut: () => void; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-4 text-sm ${className}`}>
      <Link to="/support" className="underline">내 문의</Link>
      <Link to="/cart" className="underline">장바구니</Link>
      <button type="button" onClick={onSignOut} className="underline opacity-70">로그아웃</button>
    </div>
  )
}

const Empty = () => (
  <div className="rounded-card bg-eden-paper-dim py-12 text-center text-sm text-eden-sage-dim">
    아직 주문 내역이 없어요.{' '}
    <Link to="/menu" className="font-semibold text-eden-ink underline">메뉴 보러 가기</Link>
  </div>
)

// ── 내 주문 ───────────────────────────────────────────────────────────────
// Pickup is daily, so the top of the page is what matters today: orders to
// pick up today (ordered yesterday) and the order placed today for tomorrow.

function OrderCard({ order, highlight = false }: { order: CustomerOrder; highlight?: boolean }) {
  return (
    <article className={`rounded-card bg-eden-paper-dim p-5 shadow-soft ${highlight ? 'border border-eden-sand/60' : ''}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <strong className={order.status === 'wait' ? 'text-eden-sand' : ''}>{STATUS[order.status].label}</strong>
        <span className="text-sm text-eden-sage-dim">
          {orderedOn(order.created_at)} 주문 · {pickupLabel(order.pickup_date)} 픽업
        </span>
      </div>
      {order.items.map((i) => (
        <div key={i.name} className="flex justify-between text-sm">
          <span>
            {i.name} × {i.qty}
          </span>
          <span>{won(i.price * i.qty)}</span>
        </div>
      ))}
      <div className="mt-3 flex justify-between border-t border-eden-line pt-3 font-semibold">
        <span>합계</span>
        <span>{won(order.total)}</span>
      </div>
      {order.status === 'wait' ? <PaymentInfo total={order.total} className="mt-3" /> : null}
    </article>
  )
}

function TodaySection({ title, subtitle, orders, empty }: { title: string; subtitle: string; orders: CustomerOrder[]; empty: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
        <h3 className="font-serif text-lg font-semibold">{title}</h3>
        <span className="text-sm text-eden-sage-dim">{subtitle}</span>
      </div>
      {orders.length ? (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} highlight />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-eden-line px-5 py-6 text-center text-sm text-eden-sage-dim">{empty}</div>
      )}
    </section>
  )
}

export function MyOrdersBody({ name, email, orders, onSaveName, onSignOut }: MyOrdersProps) {
  const [filter, setFilter] = useState<'all' | CustomerOrder['status']>('all')
  const slot = getCurrentPickupSlot(Date.now())
  const pickupToday = orders.filter((o) => o.pickup_date === slot.todayIso)
  const pickupTomorrow = orders.filter((o) => o.pickup_date === slot.iso)
  const others = orders.filter((o) => o.pickup_date !== slot.todayIso && o.pickup_date !== slot.iso)
  const shown = filter === 'all' ? others : others.filter((o) => o.status === filter)
  const byDay = new Map<string, CustomerOrder[]>()
  for (const o of shown) byDay.set(orderedOn(o.created_at), [...(byDay.get(orderedOn(o.created_at)) ?? []), o])

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-eden-line pb-4">
        <div>
          <NameLine name={name} onSave={onSaveName} className="text-lg font-semibold" />
          <div className="text-xs text-eden-sage-dim">{email}</div>
        </div>
        <QuickLinks onSignOut={onSignOut} />
      </div>

      <div className="mb-12 grid gap-8 md:grid-cols-2">
        <TodaySection
          title="오늘 픽업"
          subtitle={`${slot.todayLabel} · 오늘 챙겨야 할 주문`}
          orders={pickupToday}
          empty="오늘 픽업할 주문이 없어요."
        />
        <TodaySection
          title="내일 픽업"
          subtitle={`${slot.dateLabel} · 오늘 주문한 메뉴`}
          orders={pickupTomorrow}
          empty={
            <>
              오늘 주문한 메뉴가 없어요. 자정까지 주문하면 내일 픽업할 수 있어요.{' '}
              <Link to="/menu" className="font-semibold text-eden-ink underline">메뉴 보기</Link>
            </>
          }
        />
      </div>

      <h3 className="mb-4 font-serif text-lg font-semibold">지난 주문</h3>
      {others.length === 0 ? (
        orders.length === 0 ? <Empty /> : <p className="text-sm text-eden-sage-dim">지난 주문이 없어요.</p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {(['all', 'wait', 'done', 'picked'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-1.5 text-sm ${filter === f ? 'border-eden-ink bg-eden-ink text-eden-paper' : 'border-eden-line'}`}
              >
                {f === 'all' ? '전체' : STATUS[f].short} {(f === 'all' ? others : others.filter((o) => o.status === f)).length}
              </button>
            ))}
          </div>
          {[...byDay].map(([day, list]) => (
            <section key={day} className="mb-8">
              <h4 className="mb-3 text-sm font-semibold text-eden-sage-dim">{day} 주문</h4>
              <div className="space-y-3">
                {list.map((o) => (
                  <OrderCard key={o.id} order={o} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
