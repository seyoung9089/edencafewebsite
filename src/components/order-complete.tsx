import { Check, Copy } from 'lucide-react'
import { PaymentInfo, usePayment } from '@/components/payment-info'

export type PlacedOrder = {
  id: string
  total: number
  pickupLabel: string
  pickupTime: string
  items: { name: string; qty: number }[]
}

type BodyProps = { order: PlacedOrder; onClose: () => void; onOrders: () => void }

export const ORDER_COMPLETE_VARIANTS = [
  { id: 'current', label: '지금 버전', note: '정보를 카드 두 개로 나눈 기본형' },
  { id: 'check', label: 'A. 큰 체크 · 금액 강조', note: '간편결제 앱처럼 완료 표시와 입금액을 크게, 나머지는 간단히' },
  { id: 'steps', label: 'B. 진행 단계 표시', note: '배달 앱처럼 주문 → 입금 → 준비 → 픽업 단계를 보여줘요' },
  { id: 'receipt', label: 'C. 영수증 · 주문번호 강조', note: '카페 앱처럼 주문번호를 크게, 영수증 느낌의 점선 구분' },
  { id: 'list', label: 'D. 깔끔한 항목 목록', note: '쇼핑몰 주문 완료처럼 항목을 줄마다 정리' },
] as const
export type OrderCompleteVariant = (typeof ORDER_COMPLETE_VARIANTS)[number]['id']

const itemsText = (order: PlacedOrder) => order.items.map((it) => `${it.name} × ${it.qty}`).join(', ')
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const pickupText = (order: PlacedOrder) => `${order.pickupLabel}${order.pickupTime ? ` · ${order.pickupTime}` : ''}`

function Buttons({ onClose, onOrders, stacked = false }: { onClose: () => void; onOrders: () => void; stacked?: boolean }) {
  return (
    <div className={stacked ? 'space-y-2' : 'flex gap-2'}>
      {stacked ? null : (
        <button type="button" onClick={onClose} className="flex-1 rounded-full border border-eden-line py-3 text-sm">
          닫기
        </button>
      )}
      <button type="button" onClick={onOrders} className="w-full flex-1 rounded-full bg-eden-ink py-3 text-sm font-semibold text-eden-paper hover:bg-eden-ink-2">
        내 주문 보기
      </button>
      {stacked ? (
        <button type="button" onClick={onClose} className="w-full py-2 text-sm text-eden-sage-dim">
          닫기
        </button>
      ) : null}
    </div>
  )
}

const StatusNote = () => (
  <p className="text-xs text-eden-sage-dim">
    입금 확인, 픽업 준비 같은 주문 상태는 <strong className="text-eden-ink">내 주문</strong>에서 확인할 수 있어요.
  </p>
)

function CurrentBody({ order, onClose, onOrders }: BodyProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-semibold">주문이 완료됐어요</h2>
        <p className="mt-1 text-sm text-eden-sage-dim">아래 계좌로 무통장 입금해주시면 확인 후 준비할게요.</p>
      </div>
      <div className="rounded-[10px] bg-eden-sand/15 px-4 py-3 text-sm">
        <div className="text-xs text-eden-sage-dim">픽업</div>
        <div className="font-semibold text-eden-sand">{pickupText(order)}</div>
        <div className="mt-2">{itemsText(order)}</div>
        <div className="mt-1 text-xs text-eden-sage-dim">주문번호 {order.id.slice(0, 8)}</div>
      </div>
      <div>
        <div className="mb-1.5 text-xs text-eden-sage-dim">무통장 입금</div>
        <PaymentInfo total={order.total} />
      </div>
      <StatusNote />
      <Buttons onClose={onClose} onOrders={onOrders} />
    </div>
  )
}

/** A: big check mark and the amount to send, everything else quiet. */
function CheckBody({ order, onClose, onOrders }: BodyProps) {
  const pay = usePayment()
  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-eden-sand text-eden-ink-2">
        <Check size={34} strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="font-serif text-xl font-semibold">주문 완료!</h2>
        <p className="mt-1 text-sm text-eden-sage-dim">{pickupText(order)} 픽업</p>
      </div>
      <div className="rounded-card bg-eden-paper-dim px-5 py-5">
        <div className="text-xs text-eden-sage-dim">입금할 금액</div>
        <div className="mt-1 font-serif text-3xl font-bold">{won(order.total)}</div>
        <button
          type="button"
          onClick={() => void pay.copy()}
          className="mt-4 flex w-full items-center justify-between rounded-[10px] bg-eden-paper px-4 py-3 text-left text-sm shadow-soft"
        >
          <span>
            <span className="block text-xs text-eden-sage-dim">
              {pay.bank} · 예금주 {pay.holder}
            </span>
            <strong>{pay.account}</strong>
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-eden-sand">
            <Copy size={14} />
            복사
          </span>
        </button>
        <p className="mt-3 text-xs text-eden-sage-dim">{pay.note}</p>
      </div>
      <p className="text-xs text-eden-sage-dim">
        {itemsText(order)} · 주문번호 {order.id.slice(0, 8)}
      </p>
      <StatusNote />
      <Buttons onClose={onClose} onOrders={onOrders} stacked />
    </div>
  )
}

/** B: where the order is in its journey. */
function StepsBody({ order, onClose, onOrders }: BodyProps) {
  const pay = usePayment()
  const steps = ['주문 완료', '입금 확인', '준비 중', '픽업']
  return (
    <div className="space-y-5">
      <h2 className="font-serif text-xl font-semibold">주문이 접수됐어요</h2>
      <ol className="flex items-start">
        {steps.map((step, i) => (
          <li key={step} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 ? <span className="absolute right-1/2 top-3 h-0.5 w-full bg-eden-line" aria-hidden /> : null}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${i === 0 ? 'bg-eden-sand text-eden-ink-2' : 'border border-eden-line bg-eden-paper text-eden-sage-dim'}`}
            >
              {i === 0 ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`mt-1.5 text-[11px] ${i === 0 ? 'font-semibold' : 'text-eden-sage-dim'}`}>{step}</span>
          </li>
        ))}
      </ol>
      <div className="rounded-[10px] border border-eden-sand/60 bg-eden-sand/10 px-4 py-3 text-sm">
        <div className="font-semibold">다음 단계: 입금해주세요</div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2">
          {pay.bank} <strong>{pay.account}</strong>
          <button type="button" onClick={() => void pay.copy()} className="text-xs text-eden-sand underline">
            복사
          </button>
        </div>
        <div>
          예금주 {pay.holder} · <strong>{won(order.total)}</strong>
        </div>
        <div className="mt-1 text-xs text-eden-sage-dim">{pay.note}</div>
      </div>
      <div className="flex justify-between rounded-[10px] bg-eden-paper-dim px-4 py-3 text-sm">
        <span className="text-eden-sage-dim">픽업</span>
        <strong className="text-right">{pickupText(order)}</strong>
      </div>
      <StatusNote />
      <Buttons onClose={onClose} onOrders={onOrders} />
    </div>
  )
}

/** C: receipt with a large order number. */
function ReceiptBody({ order, onClose, onOrders }: BodyProps) {
  const pay = usePayment()
  const dashed = <div className="my-4 border-t border-dashed border-eden-sage-dim/50" />
  return (
    <div>
      <div className="rounded-card bg-eden-paper-dim px-5 py-6 text-center shadow-soft">
        <div className="text-xs tracking-[0.2em] text-eden-sage-dim">ORDER</div>
        <div className="mt-1 font-serif text-3xl font-bold tracking-wider">#{order.id.slice(0, 6).toUpperCase()}</div>
        <div className="mt-2 text-sm">주문이 완료됐어요</div>
        {dashed}
        <div className="text-xs text-eden-sage-dim">픽업</div>
        <div className="font-semibold text-eden-sand">{pickupText(order)}</div>
        {dashed}
        <div className="space-y-1 text-left text-sm">
          {order.items.map((it) => (
            <div key={it.name} className="flex justify-between">
              <span>{it.name}</span>
              <span>× {it.qty}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1 font-semibold">
            <span>합계</span>
            <span>{won(order.total)}</span>
          </div>
        </div>
        {dashed}
        <div className="text-left text-sm">
          <div className="text-xs text-eden-sage-dim">무통장 입금</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2">
            {pay.bank} <strong>{pay.account}</strong>
            <button type="button" onClick={() => void pay.copy()} className="text-xs text-eden-sand underline">
              복사
            </button>
          </div>
          <div>예금주 {pay.holder}</div>
          <div className="mt-1 text-xs text-eden-sage-dim">{pay.note}</div>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        <StatusNote />
        <Buttons onClose={onClose} onOrders={onOrders} />
      </div>
    </div>
  )
}

/** D: plain label / value rows. */
function ListBody({ order, onClose, onOrders }: BodyProps) {
  const pay = usePayment()
  const rows: [string, React.ReactNode][] = [
    ['주문번호', order.id.slice(0, 8)],
    ['주문 메뉴', itemsText(order)],
    ['픽업', pickupText(order)],
    ['입금 계좌', (
      <span key="account">
        {pay.bank} {pay.account}{' '}
        <button type="button" onClick={() => void pay.copy()} className="text-xs text-eden-sand underline">
          복사
        </button>
      </span>
    )],
    ['예금주', pay.holder],
    ['입금 금액', <strong key="total">{won(order.total)}</strong>],
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-eden-ink text-eden-paper">
          <Check size={18} strokeWidth={3} />
        </span>
        <h2 className="font-serif text-xl font-semibold">주문이 완료되었습니다</h2>
      </div>
      <dl className="divide-y divide-eden-line border-y border-eden-line text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[80px_1fr] gap-3 py-2.5">
            <dt className="text-eden-sage-dim">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-eden-sage-dim">{pay.note}</p>
      <StatusNote />
      <Buttons onClose={onClose} onOrders={onOrders} />
    </div>
  )
}

export function OrderCompleteBody({ variant, ...props }: BodyProps & { variant: OrderCompleteVariant }) {
  switch (variant) {
    case 'check':
      return <CheckBody {...props} />
    case 'steps':
      return <StepsBody {...props} />
    case 'receipt':
      return <ReceiptBody {...props} />
    case 'list':
      return <ListBody {...props} />
    default:
      return <CurrentBody {...props} />
  }
}
