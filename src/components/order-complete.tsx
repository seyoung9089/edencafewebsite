import { Check } from 'lucide-react'
import { CopyLabel, usePayment } from '@/components/payment-info'
import type { PaymentMethod } from '@/components/order-receipt'

export type PlacedOrder = {
  id: string
  total: number
  pickupLabel: string
  pickupTime: string
  items: { name: string; qty: number }[]
  /** Friday orders: who picks up */
  studentName: string | null
  paymentMethod: PaymentMethod
  /** Shown under the account for Friday transfers */
  studentDepositNote?: string
}

type BodyProps = { order: PlacedOrder; onClose: () => void; onOrders: () => void }

const itemsText = (order: PlacedOrder) => order.items.map((it) => `${it.name} × ${it.qty}`).join(', ')
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const pickupText = (order: PlacedOrder) => `${order.pickupLabel}${order.pickupTime ? ` · ${order.pickupTime}` : ''}`

function Buttons({ onClose, onOrders }: { onClose: () => void; onOrders: () => void }) {
  return (
    <div className="space-y-2">
      <button type="button" onClick={onOrders} className="w-full rounded-[3px] bg-eden-accent py-3 text-sm font-semibold text-white hover:bg-eden-accent-d">
        내 주문 보기
      </button>
      <button type="button" onClick={onClose} className="w-full py-2 text-sm text-eden-mute">
        닫기
      </button>
    </div>
  )
}

const StatusNote = () => (
  <p className="text-xs text-eden-mute">
    입금 확인, 픽업 준비 같은 주문 상태는 <strong className="text-eden-ink">내 주문</strong>에서 확인할 수 있어요.
  </p>
)

/** Order-complete dialog body: big check mark and the amount to send, everything else quiet. */
export function OrderCompleteBody({ order, onClose, onOrders }: BodyProps) {
  const pay = usePayment()
  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[3px] bg-eden-accent text-white">
        <Check size={34} strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="font-serif text-xl font-light">주문 완료!</h2>
        <p className="mt-1 text-sm text-eden-mute">
          {/* 학부모 주문 is picked up after school, not during shop hours. */}
          {order.studentName ? `${order.pickupLabel} 하교할 때 ${order.studentName} 학생이 찾아가요` : `${pickupText(order)} 픽업`}
        </p>
      </div>
      {order.paymentMethod === 'onsite' ? (
        <div className="rounded-card bg-eden-paper-dim px-5 py-5">
          <div className="text-xs text-eden-mute">현장에서 결제할 금액</div>
          <div className="mt-1 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">{won(order.total)}</div>
          <p className="mt-3 text-sm text-eden-mute">{order.studentName} 학생이 찾아갈 때 매장에서 결제해 주세요.</p>
        </div>
      ) : (
        <div className="rounded-card bg-eden-paper-dim px-5 py-5">
          <div className="text-xs text-eden-mute">입금할 금액</div>
          <div className="mt-1 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">{won(order.total)}</div>
          <button
            type="button"
            onClick={(e) => void pay.copy(e.currentTarget)}
            aria-label="계좌번호 복사"
            className="mt-4 flex w-full items-center justify-between gap-3 rounded-[2px] bg-eden-paper px-4 py-3 text-left text-sm shadow-soft transition-transform active:scale-[0.98]"
          >
            <span>
              <span className="block text-xs text-eden-mute">
                {pay.bank} · 예금주 {pay.holder}
              </span>
              <strong>{pay.account}</strong>
            </span>
            <CopyLabel copied={pay.copied} />
          </button>
          {order.studentName && order.studentDepositNote ? (
            <p className="mt-3 text-sm font-semibold">
              {order.studentDepositNote} ({order.studentName})
            </p>
          ) : null}
          <p className="mt-3 text-xs text-eden-mute">{pay.note}</p>
        </div>
      )}
      <p className="text-xs text-eden-mute">
        {itemsText(order)} · 주문번호 {order.id.slice(0, 8)}
      </p>
      <StatusNote />
      <Buttons onClose={onClose} onOrders={onOrders} />
    </div>
  )
}
