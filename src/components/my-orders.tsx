import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, Pencil } from 'lucide-react'
import { InfoRows } from '@/components/info-rows'
import { PaymentInfo } from '@/components/payment-info'
import { kstTodayIso, pickupLabel } from '@/lib/pickup'
import { useContentValue, useSiteContent } from '@/lib/site-content'

export type CustomerOrder = {
  id: string
  items: { name: string; price: number; qty: number }[]
  total: number
  status: 'wait' | 'done' | 'picked' | 'cancelled'
  pickup_date: string
  created_at: string
  /** Friday orders: who picks up */
  student_name: string | null
  payment_method: 'transfer' | 'onsite'
  payment_status: 'pending' | 'confirmed' | 'onsite'
  /** 답례품 예약 orders: 'gift' (missing before 20261031_gift_orders.sql) */
  order_type?: 'village' | 'parents' | 'gift'
  request_note?: string | null
}

export type MyOrdersProps = {
  name: string
  email: string
  orders: CustomerOrder[]
  onSaveName: (name: string) => Promise<void>
  onSignOut: () => void
  /** Cancels an order that is still 입금 대기; resolves false if it failed. */
  onCancel: (id: string) => Promise<boolean>
}

// ── shared bits ──────────────────────────────────────────────────────────

const STATUS = {
  wait: { label: '입금 대기', short: '입금 대기', tone: 'bg-eden-accent text-white' },
  done: { label: '입금 확인 · 준비 중', short: '준비 중', tone: 'bg-eden-mute-2 text-eden-ink-2' },
  picked: { label: '픽업 완료', short: '픽업 완료', tone: 'bg-eden-line text-eden-mute' },
  cancelled: { label: '취소한 주문', short: '취소', tone: 'bg-eden-line text-eden-mute' },
} as const

export { pickupLabel }

/** Three dots and a line, so where the order is reads at a glance. */
function StatusSteps({ order }: { order: CustomerOrder }) {
  if (order.status === 'cancelled') return null
  const steps = [order.payment_method === 'onsite' ? '주문 접수' : '입금 대기', '준비 중', '픽업 완료']
  const current = order.status === 'wait' ? 0 : order.status === 'done' ? 1 : 2
  return (
    <ol className="mb-4 grid grid-cols-3" aria-label={`주문 상태: ${steps[current]}`}>
      {steps.map((step, i) => (
        <li key={step} className="relative flex flex-col items-center gap-1.5 text-center">
          {i > 0 ? (
            <span aria-hidden className={`absolute right-1/2 top-[7px] h-0.5 w-full ${i <= current ? 'bg-eden-ink' : 'bg-eden-line'}`} />
          ) : null}
          <span
            aria-hidden
            className={`relative h-4 w-4 rounded-full border-2 ${
              i === current ? 'border-eden-accent bg-eden-accent' : i < current ? 'border-eden-ink bg-eden-ink' : 'border-eden-line bg-white'
            }`}
          />
          <span className={`text-sm ${i === current ? 'font-semibold text-eden-ink' : 'text-eden-mute'}`}>{step}</span>
        </li>
      ))}
    </ol>
  )
}

/** What the customer does next, in one line. */
function nextStep(order: CustomerOrder): string | null {
  if (order.status === 'wait' && order.payment_method === 'transfer') return '아래 계좌로 입금해 주시기 바랍니다. 입금이 확인되면 준비를 시작합니다.'
  if (order.status === 'wait') return '학생이 찾아갈 때 매장에서 결제하시면 됩니다.'
  if (order.status === 'done' && order.student_name) return '학생이 매장에서 이름을 말하고 찾아가면 됩니다.'
  if (order.status === 'done') return '이든카페에 오셔서 이름을 말씀하시면 됩니다.'
  return null
}

/** "10월 27일(화)", the same way pickup days read. */
const orderedOn = (iso: string) => pickupLabel(kstTodayIso(new Date(iso).getTime()))
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
          placeholder="이름"
          maxLength={30}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-40 rounded-[2px] border border-eden-line bg-eden-paper px-3 py-1.5 text-sm text-eden-ink"
        />
        <button disabled={busy} className="rounded-[3px] bg-eden-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          저장
        </button>
        {name ? (
          <button type="button" onClick={() => setEditing(false)} className="text-xs underline">
            취소
          </button>
        ) : (
          <span className="text-xs opacity-70">픽업할 때 확인할 이름입니다.</span>
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
      <Link to="/support" hash="inquiry" className="underline">내 문의</Link>
      <Link to="/order" className="underline">주문하러 가기</Link>
      <button type="button" onClick={onSignOut} className="underline opacity-70">로그아웃</button>
    </div>
  )
}

const Empty = () => (
  <div className="rounded-card bg-eden-paper-dim py-12 text-center text-sm text-eden-mute">
    아직 주문 내역이 없습니다.{' '}
    <Link to="/order" className="font-semibold text-eden-ink underline">메뉴 보러 가기</Link>
  </div>
)

// ── 내 주문 ───────────────────────────────────────────────────────────────
// Pickup is daily, so the top of the page is what matters today: orders to
// pick up today (ordered yesterday) and the order placed today for tomorrow.

function CancelButton({ order, onCancel }: { order: CustomerOrder; onCancel: (id: string) => Promise<boolean> }) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm('이 주문을 취소하시겠습니까? 취소한 주문은 되돌릴 수 없습니다.')) return
        setBusy(true)
        await onCancel(order.id)
        setBusy(false)
      }}
      className="text-[15px] text-eden-mute underline underline-offset-4 hover:text-eden-ink disabled:opacity-50"
    >
      {busy ? '취소하는 중…' : '주문 취소'}
    </button>
  )
}

const kindLabel = (order: CustomerOrder) =>
  order.order_type === 'gift' ? '답례품 예약' : order.order_type === 'parents' || order.student_name ? '학부모 주문' : '마을 픽업 주문'

/** "소금빵 외 2가지 · 총 5개": the whole basket in one line, details folded below. */
function itemsSummary(order: CustomerOrder): string {
  const first = order.items[0]
  if (!first) return '담은 메뉴 없음'
  const count = order.items.reduce((n, i) => n + i.qty, 0)
  const rest = order.items.length - 1
  return `${first.name}${rest > 0 ? ` 외 ${rest}가지` : ''} · 총 ${count}개`
}

function StatusChip({ order }: { order: CustomerOrder }) {
  const label = order.payment_method === 'onsite' && order.status === 'wait' ? '주문 접수' : STATUS[order.status].short
  return <span className={`shrink-0 rounded-[3px] px-2.5 py-1 text-sm font-semibold ${STATUS[order.status].tone}`}>{label}</span>
}

/** Everything that isn't needed at a glance: each item, payment, student, request, order date. */
function OrderDetails({ order }: { order: CustomerOrder }) {
  return (
    <details className="group border-t border-eden-line">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-[15px] font-semibold">
        주문 상세 보기
        <ChevronDown size={18} className="text-eden-mute transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-5 pb-5">
        <ul className="mb-3 space-y-1.5 text-[15px]">
          {order.items.map((i) => (
            <li key={i.name} className="flex justify-between gap-3">
              <span>
                {i.name} × {i.qty}
              </span>
              <span>{won(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <InfoRows
          className="border-t border-eden-line"
          rows={[
            { label: '결제', value: order.payment_method === 'onsite' ? '현장결제' : '계좌이체' },
            ...(order.student_name ? [{ label: '학생', value: order.student_name }] : []),
            ...(order.request_note ? [{ label: '요청사항', value: order.request_note }] : []),
            { label: '주문일', value: orderedOn(order.created_at) },
          ]}
        />
      </div>
    </details>
  )
}

/**
 * One order, read top to bottom in the order a customer asks: when do I pick
 * it up → where is it now → what do I do next → what did I order. Item lines
 * and the rest fold under 주문 상세 보기.
 */
function OrderCard({ order, onCancel }: { order: CustomerOrder; onCancel: (id: string) => Promise<boolean> }) {
  const pickupTime = useContentValue(useSiteContent(), 'pickup.time')
  const next = nextStep(order)
  const when = order.student_name ? `하교할 때 ${order.student_name} 학생이 찾아갑니다` : pickupTime
  return (
    <article className={`border border-eden-line bg-white ${order.status === 'cancelled' ? 'opacity-60' : ''}`}>
      <header className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
        <div>
          <p className="text-[15px] text-eden-mute">{kindLabel(order)}</p>
          <h4 className="mt-0.5 text-[1.35rem] font-bold leading-snug">{pickupLabel(order.pickup_date)} 픽업</h4>
          {when ? <p className="text-[15px] text-eden-mute">{when}</p> : null}
        </div>
        <StatusChip order={order} />
      </header>
      <div className="px-5">
        <StatusSteps order={order} />
      </div>
      {next ? <p className="mx-5 mb-4 bg-eden-paper px-4 py-3 text-base font-semibold leading-relaxed">{next}</p> : null}
      {order.status === 'wait' && order.payment_method === 'transfer' ? <PaymentInfo total={order.total} className="mx-5 mb-4" /> : null}
      <div className="flex items-baseline justify-between gap-3 border-t border-eden-line px-5 py-4">
        <span className="text-base">{itemsSummary(order)}</span>
        <strong className="shrink-0 text-lg">{won(order.total)}</strong>
      </div>
      <OrderDetails order={order} />
      {order.status === 'wait' ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-eden-line px-5 py-3.5">
          <span className="text-sm text-eden-mute">
            {order.payment_method === 'transfer' ? '입금 확인 전까지 취소할 수 있습니다' : '준비 시작 전까지 취소할 수 있습니다'}
          </span>
          <CancelButton order={order} onCancel={onCancel} />
        </div>
      ) : null}
    </article>
  )
}

/** A past order as one line (날짜 · 메뉴 · 금액 · 상태); tap to see the rest. */
function PastOrderRow({ order }: { order: CustomerOrder }) {
  return (
    <details className={`group border-b border-eden-line ${order.status === 'cancelled' ? 'opacity-60' : ''}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <div className="text-base font-semibold">{pickupLabel(order.pickup_date)} 픽업</div>
          <div className="text-[15px] text-eden-mute">
            {itemsSummary(order)} · {won(order.total)}
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <StatusChip order={order} />
          <ChevronDown size={18} className="text-eden-mute transition-transform group-open:rotate-180" aria-hidden />
        </span>
      </summary>
      <div className="pb-4">
        <ul className="mb-2 space-y-1.5 text-[15px]">
          {order.items.map((i) => (
            <li key={i.name} className="flex justify-between gap-3">
              <span>
                {i.name} × {i.qty}
              </span>
              <span>{won(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <InfoRows
          className="border-t border-eden-line"
          rows={[
            { label: '종류', value: kindLabel(order) },
            { label: '결제', value: order.payment_method === 'onsite' ? '현장결제' : '계좌이체' },
            { label: '주문일', value: orderedOn(order.created_at) },
          ]}
        />
      </div>
    </details>
  )
}

function TodaySection({ title, subtitle, orders, empty, onCancel }: { title: string; subtitle: string; orders: CustomerOrder[]; empty: React.ReactNode; onCancel: (id: string) => Promise<boolean> }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
        <h3 className="font-serif text-lg font-light">{title}</h3>
        <span className="text-sm text-eden-mute">{subtitle}</span>
      </div>
      {orders.length ? (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} onCancel={onCancel} />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-eden-line px-5 py-6 text-center text-sm text-eden-mute">{empty}</div>
      )}
    </section>
  )
}

export function MyOrdersBody({ name, email, orders, onSaveName, onSignOut, onCancel }: MyOrdersProps) {
  const [filter, setFilter] = useState<'all' | CustomerOrder['status']>('all')
  const todayIso = kstTodayIso(Date.now())
  const pickupToday = orders.filter((o) => o.pickup_date === todayIso)
  // Soonest pickup first.
  const upcoming = orders.filter((o) => o.pickup_date > todayIso).sort((a, b) => a.pickup_date.localeCompare(b.pickup_date))
  const others = orders.filter((o) => o.pickup_date < todayIso)
  const shown = filter === 'all' ? others : others.filter((o) => o.status === filter)

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-eden-line pb-4">
        <div>
          <NameLine name={name} onSave={onSaveName} className="text-lg font-semibold" />
          <div className="text-xs text-eden-mute">{email}</div>
        </div>
        <QuickLinks onSignOut={onSignOut} />
      </div>

      <div className="mb-12 grid gap-8 md:grid-cols-2">
        <TodaySection
          title="오늘 픽업"
          subtitle={`${pickupLabel(todayIso)} · 오늘 챙겨야 할 주문`}
          orders={pickupToday}
          onCancel={onCancel}
          empty="오늘 픽업할 주문이 없습니다."
        />
        <TodaySection
          title="다가오는 픽업"
          subtitle="미리 주문해 둔 메뉴"
          orders={upcoming}
          onCancel={onCancel}
          empty={
            <>
              미리 주문한 메뉴가 없습니다. 픽업 2일 전까지 주문할 수 있습니다.{' '}
              <Link to="/order" className="font-semibold text-eden-ink underline">메뉴 보기</Link>
            </>
          }
        />
      </div>

      <h3 className="mb-4 font-serif text-lg font-light">지난 주문</h3>
      {others.length === 0 ? (
        orders.length === 0 ? <Empty /> : <p className="text-sm text-eden-mute">지난 주문이 없습니다.</p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {(['all', 'wait', 'done', 'picked', 'cancelled'] as const)
              // A filter with nothing in it is just noise.
              .filter((f) => f === 'all' || others.some((o) => o.status === f))
              .map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-[3px] border px-4 py-1.5 text-sm ${filter === f ? 'border-eden-accent bg-eden-accent text-white' : 'border-eden-line'}`}
              >
                {f === 'all' ? '전체' : STATUS[f].short} {(f === 'all' ? others : others.filter((o) => o.status === f)).length}
              </button>
            ))}
          </div>
          <div className="border-t border-eden-line">
            {shown.map((o) => (
              <PastOrderRow key={o.id} order={o} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
