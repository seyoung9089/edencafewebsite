import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, ChevronDown, Pencil } from 'lucide-react'
import { PaymentInfo } from '@/components/payment-info'

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

export const MY_ORDERS_VARIANTS = [
  { id: 'cards', label: 'A. 쇼핑몰 주문목록형', note: '상태별로 걸러 보고, 주문일마다 카드로 정리해요' },
  { id: 'progress', label: 'B. 배달앱 진행 상황형', note: '진행 중인 주문을 단계 표시와 함께 크게, 지난 주문은 아래에 간단히' },
  { id: 'member', label: 'C. 카페앱 멤버 카드형', note: '이름이 들어간 멤버 카드와 상태별 개수, 진행 중 / 지난 주문 탭' },
  { id: 'minimal', label: 'D. 간편결제 앱 미니멀형', note: '큰 인사말과 한 줄 요약, 누르면 자세히 펼쳐져요' },
  { id: 'table', label: 'E. 표 정리형', note: '주문일 · 메뉴 · 금액 · 픽업일 · 상태를 표로 한눈에' },
] as const
export type MyOrdersVariant = (typeof MY_ORDERS_VARIANTS)[number]['id']

// ── shared bits ──────────────────────────────────────────────────────────

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
const STATUS = {
  wait: { label: '입금 대기', short: '입금 대기', tone: 'bg-eden-sand text-eden-ink-2' },
  done: { label: '입금 확인 · 준비 중', short: '준비 중', tone: 'bg-eden-sage text-eden-ink-2' },
  picked: { label: '픽업 완료', short: '픽업 완료', tone: 'bg-eden-line text-eden-sage-dim' },
} as const
const STEPS = ['주문 완료', '입금 확인', '준비 중', '픽업']
const stepIndex = (s: CustomerOrder['status']) => (s === 'wait' ? 0 : s === 'done' ? 2 : 3)
const isActive = (o: CustomerOrder) => o.status !== 'picked'

export function pickupLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${WEEKDAY_KO[d.getUTCDay()]})`
}
const orderedOn = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', weekday: 'short' })
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const itemsText = (o: CustomerOrder) => o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')
const itemsShort = (o: CustomerOrder) =>
  o.items.length > 1 ? `${o.items[0].name} 외 ${o.items.length - 1}개` : `${o.items[0]?.name ?? ''} × ${o.items[0]?.qty ?? 0}`

function StatusBadge({ status, short = false }: { status: CustomerOrder['status']; short?: boolean }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[status].tone}`}>{short ? STATUS[status].short : STATUS[status].label}</span>
}

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

function Steps({ status }: { status: CustomerOrder['status'] }) {
  const current = stepIndex(status)
  return (
    <ol className="flex items-start">
      {STEPS.map((step, i) => (
        <li key={step} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 ? <span className={`absolute right-1/2 top-3 h-0.5 w-full ${i <= current ? 'bg-eden-sand' : 'bg-eden-line'}`} aria-hidden /> : null}
          <span
            className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${i <= current ? 'bg-eden-sand text-eden-ink-2' : 'border border-eden-line bg-eden-paper text-eden-sage-dim'}`}
          >
            {i < current || status === 'picked' ? <Check size={14} strokeWidth={3} /> : i + 1}
          </span>
          <span className={`mt-1.5 text-[11px] ${i === current ? 'font-semibold' : 'text-eden-sage-dim'}`}>{step}</span>
        </li>
      ))}
    </ol>
  )
}

// ── A. shopping-mall order list ──────────────────────────────────────────

function CardsVariant({ name, email, orders, onSaveName, onSignOut }: MyOrdersProps) {
  const [filter, setFilter] = useState<'all' | CustomerOrder['status']>('all')
  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
  const byDay = new Map<string, CustomerOrder[]>()
  for (const o of shown) byDay.set(orderedOn(o.created_at), [...(byDay.get(orderedOn(o.created_at)) ?? []), o])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-eden-line pb-4">
        <div>
          <NameLine name={name} onSave={onSaveName} className="text-lg font-semibold" />
          <div className="text-xs text-eden-sage-dim">{email}</div>
        </div>
        <QuickLinks onSignOut={onSignOut} />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(['all', 'wait', 'done', 'picked'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-sm ${filter === f ? 'border-eden-ink bg-eden-ink text-eden-paper' : 'border-eden-line'}`}
          >
            {f === 'all' ? '전체' : STATUS[f].short} {(f === 'all' ? orders : orders.filter((o) => o.status === f)).length}
          </button>
        ))}
      </div>
      {orders.length === 0 ? <Empty /> : null}
      {[...byDay].map(([day, list]) => (
        <section key={day} className="mb-8">
          <h3 className="mb-3 font-serif text-base font-semibold">{day} 주문</h3>
          <div className="space-y-3">
            {list.map((o) => (
              <article key={o.id} className="rounded-card bg-eden-paper-dim p-5 shadow-soft">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <strong className={o.status === 'wait' ? 'text-eden-sand' : ''}>{STATUS[o.status].label}</strong>
                  <span className="text-sm text-eden-sage-dim">{pickupLabel(o.pickup_date)} 픽업</span>
                </div>
                {o.items.map((i) => (
                  <div key={i.name} className="flex justify-between text-sm">
                    <span>
                      {i.name} × {i.qty}
                    </span>
                    <span>{won(i.price * i.qty)}</span>
                  </div>
                ))}
                <div className="mt-3 flex justify-between border-t border-eden-line pt-3 font-semibold">
                  <span>합계</span>
                  <span>{won(o.total)}</span>
                </div>
                {o.status === 'wait' ? <PaymentInfo total={o.total} className="mt-3" /> : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// ── B. delivery-app progress ─────────────────────────────────────────────

function ProgressVariant({ name, email, orders, onSaveName, onSignOut }: MyOrdersProps) {
  const active = orders.filter(isActive)
  const past = orders.filter((o) => !isActive(o))
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-serif text-xl font-semibold">
            <NameLine name={name} onSave={onSaveName} />
          </div>
          <div className="text-xs text-eden-sage-dim">{email}</div>
        </div>
        <QuickLinks onSignOut={onSignOut} />
      </div>
      {orders.length === 0 ? <Empty /> : null}
      {active.length ? <h3 className="mb-3 font-serif text-lg font-semibold">진행 중인 주문</h3> : null}
      <div className="mb-10 space-y-4">
        {active.map((o) => (
          <article key={o.id} className="rounded-card border border-eden-sand/50 bg-eden-paper-dim p-5 shadow-soft">
            <div className="mb-1 text-xs text-eden-sage-dim">{pickupLabel(o.pickup_date)} 픽업</div>
            <div className="mb-4 font-serif text-lg font-semibold">{o.status === 'wait' ? '입금을 기다리고 있어요' : '메뉴를 준비하고 있어요'}</div>
            <Steps status={o.status} />
            <p className="mt-4 text-sm">{itemsText(o)}</p>
            <p className="font-semibold">{won(o.total)}</p>
            {o.status === 'wait' ? <PaymentInfo total={o.total} className="mt-3" /> : null}
          </article>
        ))}
      </div>
      {past.length ? (
        <>
          <h3 className="mb-2 font-serif text-lg font-semibold">지난 주문</h3>
          <ul className="divide-y divide-eden-line border-y border-eden-line">
            {past.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="mr-2 text-eden-sage-dim">{pickupLabel(o.pickup_date)}</span>
                  {itemsShort(o)}
                </span>
                <span className="shrink-0">{won(o.total)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}

// ── C. cafe-app member card ──────────────────────────────────────────────

function MemberVariant({ name, email, orders, onSaveName, onSignOut }: MyOrdersProps) {
  const [tab, setTab] = useState<'active' | 'past'>('active')
  const count = (s: CustomerOrder['status']) => orders.filter((o) => o.status === s).length
  const list = orders.filter((o) => (tab === 'active' ? isActive(o) : !isActive(o)))
  return (
    <div>
      <div className="mb-6 rounded-card bg-eden-ink-2 p-6 text-eden-paper shadow-lift">
        <div className="mb-1 text-xs tracking-[0.2em] text-eden-sage">EDEN MEMBER</div>
        <div className="font-serif text-2xl font-semibold">
          <NameLine name={name} onSave={onSaveName} />
        </div>
        <div className="mb-5 text-xs text-eden-sage">{email}</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {(['wait', 'done', 'picked'] as const).map((s) => (
            <div key={s} className="rounded-[10px] bg-eden-paper/10 py-3">
              <div className="font-serif text-2xl font-bold text-eden-sand">{count(s)}</div>
              <div className="text-xs text-eden-sage">{STATUS[s].short}</div>
            </div>
          ))}
        </div>
        <QuickLinks onSignOut={onSignOut} className="mt-5 text-eden-sage" />
      </div>
      <div className="mb-4 flex border-b border-eden-line">
        {(['active', 'past'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm ${tab === t ? 'border-b-2 border-eden-ink font-semibold' : 'text-eden-sage-dim'}`}
          >
            {t === 'active' ? '진행 중' : '지난 주문'}
          </button>
        ))}
      </div>
      {list.length === 0 ? <p className="py-10 text-center text-sm text-eden-sage-dim">{tab === 'active' ? '진행 중인 주문이 없어요.' : '지난 주문이 없어요.'}</p> : null}
      <div className="space-y-3">
        {list.map((o) => (
          <article key={o.id} className="rounded-card bg-eden-paper-dim p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-serif text-sm font-semibold tracking-wider">#{o.id.slice(0, 6).toUpperCase()}</span>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-sm text-eden-sand">{pickupLabel(o.pickup_date)} 픽업</div>
            <div className="mt-2 border-t border-dashed border-eden-sage-dim/40 pt-2 text-sm">{itemsText(o)}</div>
            <div className="mt-1 text-right font-semibold">{won(o.total)}</div>
            {o.status === 'wait' ? <PaymentInfo total={o.total} className="mt-3" /> : null}
          </article>
        ))}
      </div>
    </div>
  )
}

// ── D. payment-app minimal ───────────────────────────────────────────────

function MinimalVariant({ name, email, orders, onSaveName, onSignOut }: MyOrdersProps) {
  const [open, setOpen] = useState<string | null>(orders.find((o) => o.status === 'wait')?.id ?? null)
  const waiting = orders.filter((o) => o.status === 'wait')
  return (
    <div>
      <div className="mb-2 font-serif text-2xl font-semibold leading-snug">
        <NameLine name={name} onSave={onSaveName} suffix="님," />
        <br />
        {waiting.length ? `입금을 기다리는 주문이 ${waiting.length}건 있어요` : '오늘도 좋은 하루 보내세요'}
      </div>
      <div className="mb-8 flex flex-wrap items-center gap-4 text-xs text-eden-sage-dim">
        {email}
        <QuickLinks onSignOut={onSignOut} className="text-xs" />
      </div>
      {orders.length === 0 ? <Empty /> : null}
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id} className="rounded-card bg-eden-paper-dim">
            <button type="button" onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${o.status === 'wait' ? 'bg-eden-sand' : o.status === 'done' ? 'bg-eden-sage' : 'bg-eden-sage-dim/40'}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{itemsShort(o)}</span>
                <span className="text-xs text-eden-sage-dim">
                  {pickupLabel(o.pickup_date)} 픽업 · {STATUS[o.status].short}
                </span>
              </span>
              <strong className="shrink-0">{won(o.total)}</strong>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${open === o.id ? 'rotate-180' : ''}`} />
            </button>
            {open === o.id ? (
              <div className="border-t border-eden-line px-5 py-4 text-sm">
                {o.items.map((i) => (
                  <div key={i.name} className="flex justify-between">
                    <span>
                      {i.name} × {i.qty}
                    </span>
                    <span>{won(i.price * i.qty)}</span>
                  </div>
                ))}
                <div className="mt-2 text-xs text-eden-sage-dim">
                  주문번호 {o.id.slice(0, 8)} · {orderedOn(o.created_at)} 주문
                </div>
                {o.status === 'wait' ? <PaymentInfo total={o.total} className="mt-3" /> : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── E. table ─────────────────────────────────────────────────────────────

function TableVariant({ name, email, orders, onSaveName, onSignOut }: MyOrdersProps) {
  const waiting = orders.filter((o) => o.status === 'wait')
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-eden-paper-dim px-5 py-4 text-sm">
        <span>
          <NameLine name={name} onSave={onSaveName} className="font-semibold" /> <span className="text-eden-sage-dim">{email}</span>
        </span>
        <span>
          전체 <strong>{orders.length}</strong>건 · 입금 대기 <strong className="text-eden-sand">{waiting.length}</strong>건
        </span>
        <QuickLinks onSignOut={onSignOut} />
      </div>
      {orders.length === 0 ? <Empty /> : null}
      {orders.length ? (
        <div className="overflow-x-auto rounded-[10px] border border-eden-line">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-eden-paper-dim text-left text-xs text-eden-sage-dim">
              <tr>
                <th className="px-4 py-3 font-normal">주문일</th>
                <th className="px-4 py-3 font-normal">메뉴</th>
                <th className="px-4 py-3 text-right font-normal">금액</th>
                <th className="px-4 py-3 font-normal">픽업일</th>
                <th className="px-4 py-3 font-normal">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-eden-line">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 text-eden-sage-dim">{orderedOn(o.created_at)}</td>
                  <td className="px-4 py-3">{itemsText(o)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{won(o.total)}</td>
                  <td className="px-4 py-3">{pickupLabel(o.pickup_date)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} short />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {waiting.length ? (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold">입금 안내</h3>
          <PaymentInfo total={waiting.reduce((sum, o) => sum + o.total, 0)} />
          {waiting.length > 1 ? <p className="mt-1 text-xs text-eden-sage-dim">입금 대기 {waiting.length}건의 합계예요. 주문별로 나눠 보내셔도 돼요.</p> : null}
        </div>
      ) : null}
    </div>
  )
}

export function MyOrdersBody({ variant, ...props }: MyOrdersProps & { variant: MyOrdersVariant }) {
  switch (variant) {
    case 'progress':
      return <ProgressVariant {...props} />
    case 'member':
      return <MemberVariant {...props} />
    case 'minimal':
      return <MinimalVariant {...props} />
    case 'table':
      return <TableVariant {...props} />
    default:
      return <CardsVariant {...props} />
  }
}
