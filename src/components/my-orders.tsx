import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import { CopyLabel, usePayment } from '@/components/payment-info'
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

/** 현장결제 orders aren't waiting on a transfer, so 'wait' reads differently. */
function statusLabel(order: CustomerOrder): string {
  if (order.payment_method === 'onsite' && order.status === 'wait') return '주문 접수 · 현장결제'
  return STATUS[order.status].label
}
/** Three dots and a line, so where the order is reads at a glance. */
function StatusSteps({ order }: { order: CustomerOrder }) {
  if (order.status === 'cancelled') return null
  const steps = [order.payment_method === 'onsite' ? '주문 접수' : '입금 대기', '준비 중', '픽업 완료']
  const current = order.status === 'wait' ? 0 : order.status === 'done' ? 1 : 2
  return (
    <ol className="grid grid-cols-3" aria-label={`주문 상태: ${steps[current]}`}>
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
          placeholder="이름을 입력해주세요"
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
      <Link to="/support" hash="inquiry" className="underline">내 문의</Link>
      <Link to="/order" className="underline">주문하러 가기</Link>
      <button type="button" onClick={onSignOut} className="underline opacity-70">로그아웃</button>
    </div>
  )
}

const Empty = () => (
  <div className="rounded-card bg-eden-paper-dim py-12 text-center text-sm text-eden-mute">
    아직 주문 내역이 없어요.{' '}
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
        if (!window.confirm('이 주문을 취소할까요? 취소한 주문은 되돌릴 수 없어요.')) return
        setBusy(true)
        await onCancel(order.id)
        setBusy(false)
      }}
      className="mt-3 w-full rounded-[3px] border border-eden-line py-2.5 text-sm text-eden-mute hover:bg-eden-paper disabled:opacity-50"
    >
      {busy ? '취소하는 중…' : '주문 취소'}
    </button>
  )
}

/** The sketch's bottom box: where to send the money, with a copy button. */
function AccountBox({ total }: { total: number }) {
  const { bank, account, holder, note, copy, copied } = usePayment()
  return (
    <div className="mt-6 rounded-[3px] border-2 border-eden-ink/70 bg-eden-paper px-5 py-4">
      <h4 className="mb-2 text-base font-semibold">계좌정보</h4>
      <div className="flex flex-wrap items-center gap-x-2 text-[17px]">
        <span>
          {bank} <strong>{account}</strong>
        </span>
        <button type="button" onClick={(e) => void copy(e.currentTarget)} aria-label="계좌번호 복사">
          <CopyLabel copied={copied} />
        </button>
      </div>
      <div className="text-[15px]">예금주 {holder}</div>
      <div className="text-[15px]">
        입금금액 <strong>{won(total)}</strong>
      </div>
      {note ? <div className="mt-1 text-sm text-eden-mute">{note}</div> : null}
    </div>
  )
}

/**
 * One order as a single sheet, top to bottom: pickup date (big) → status and
 * progress dots → every item → total → bank account box. Nothing is folded away.
 */
function OrderCard({ order, onCancel, highlight = false }: { order: CustomerOrder; onCancel: (id: string) => Promise<boolean>; highlight?: boolean }) {
  const pickupTime = useContentValue(useSiteContent(), 'pickup.time')
  const cancelled = order.status === 'cancelled'
  const when = order.student_name ? `${order.student_name} 학생이 하교할 때` : pickupTime
  return (
    <article className={`rounded-card bg-eden-paper-dim p-5 shadow-soft sm:p-6 ${highlight && !cancelled ? 'border border-eden-accent/60' : ''} ${cancelled ? 'opacity-60' : ''}`}>
      {/* ① 픽업 날짜 */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="font-serif text-2xl font-normal sm:text-[28px]">{pickupLabel(order.pickup_date)} 픽업</h4>
        <span className="text-sm text-eden-mute">{orderedOn(order.created_at)} 주문</span>
      </div>
      {when || order.order_type === 'gift' ? (
        <p className="mt-1 text-[15px] text-eden-mute">
          {order.order_type === 'gift' ? <span className="mr-2 rounded-full bg-eden-mute px-2 py-0.5 text-xs font-semibold text-eden-paper">답례품</span> : null}
          {when}
        </p>
      ) : null}

      {/* ② 상태 + 진행 점 */}
      <p className={`mb-3 mt-5 text-lg font-semibold ${order.status === 'wait' ? 'text-eden-accent' : ''}`}>{statusLabel(order)}</p>
      <StatusSteps order={order} />

      {/* ③ 품목 */}
      <h5 className="mb-2 mt-6 text-sm font-semibold text-eden-mute">품목</h5>
      <ul className="space-y-1.5">
        {order.items.map((i) => (
          <li key={i.name} className="flex justify-between gap-4 text-base">
            <span>
              {i.name} × {i.qty}
            </span>
            <span className="shrink-0 tabular-nums">{won(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      {order.request_note ? <p className="mt-2 text-sm text-eden-mute">요청사항: {order.request_note}</p> : null}

      {/* ④ 합계 */}
      <div className="mt-4 flex justify-between border-t border-eden-ink/40 pt-3 text-lg font-semibold">
        <span>합계</span>
        <span className="tabular-nums">{won(order.total)}</span>
      </div>

      {/* ⑤ 계좌정보 (입금 대기일 때) */}
      {order.status === 'wait' && order.payment_method === 'transfer' ? <AccountBox total={order.total} /> : null}
      {order.status === 'wait' && order.payment_method === 'onsite' ? (
        <div className="mt-6 rounded-[3px] border-2 border-eden-ink/70 bg-eden-paper px-5 py-4 text-[15px]">
          <h4 className="mb-1 text-base font-semibold">현장결제</h4>
          찾아가실 때 매장에서 결제해 주세요.
        </div>
      ) : null}

      {order.status === 'wait' ? (
        <>
          <CancelButton order={order} onCancel={onCancel} />
          <p className="mt-1.5 text-center text-xs text-eden-mute">
            {order.payment_method === 'transfer' ? '입금이 확인되기 전까지만 취소할 수 있어요.' : '준비가 시작되기 전까지만 취소할 수 있어요.'}
          </p>
        </>
      ) : null}
    </article>
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
            <OrderCard key={o.id} order={o} onCancel={onCancel} highlight />
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
  const byDay = new Map<string, CustomerOrder[]>()
  for (const o of shown) byDay.set(orderedOn(o.created_at), [...(byDay.get(orderedOn(o.created_at)) ?? []), o])

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
          empty="오늘 픽업할 주문이 없어요."
        />
        <TodaySection
          title="다가오는 픽업"
          subtitle="미리 주문해 둔 메뉴"
          orders={upcoming}
          onCancel={onCancel}
          empty={
            <>
              미리 주문한 메뉴가 없어요. 픽업 2일 전까지 주문할 수 있어요.{' '}
              <Link to="/order" className="font-semibold text-eden-ink underline">메뉴 보기</Link>
            </>
          }
        />
      </div>

      <h3 className="mb-4 font-serif text-lg font-light">지난 주문</h3>
      {others.length === 0 ? (
        orders.length === 0 ? <Empty /> : <p className="text-sm text-eden-mute">지난 주문이 없어요.</p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {(['all', 'wait', 'done', 'picked', 'cancelled'] as const).map((f) => (
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
          {[...byDay].map(([day, list]) => (
            <section key={day} className="mb-8">
              <h4 className="mb-3 text-sm font-semibold text-eden-mute">{day} 주문</h4>
              <div className="space-y-3">
                {list.map((o) => (
                  <OrderCard key={o.id} order={o} onCancel={onCancel} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
