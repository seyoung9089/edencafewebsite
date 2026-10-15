import { Check } from 'lucide-react'
import { CopyLabel, usePayment } from '@/components/payment-info'
import { CallButton } from '@/components/phone-link'

export type PlacedOrder = {
  id: string
  total: number
  pickupLabel: string
  pickupTime: string
  /** Name the bank transfer should be sent under ('' if unknown). */
  depositor: string
  items: { name: string; qty: number }[]
}

type BodyProps = { order: PlacedOrder; onClose: () => void; onOrders: () => void }

const itemsText = (order: PlacedOrder) => order.items.map((it) => `${it.name} × ${it.qty}`).join(', ')
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const pickupText = (order: PlacedOrder) => `${order.pickupLabel}${order.pickupTime ? ` · ${order.pickupTime}` : ''}`

function Buttons({ onClose, onOrders }: { onClose: () => void; onOrders: () => void }) {
  return (
    <div className="space-y-2">
      <button type="button" onClick={onOrders} className="w-full rounded-full bg-eden-ink py-3 text-sm font-semibold text-eden-paper hover:bg-eden-ink-2">
        내 주문 보기
      </button>
      <button type="button" onClick={onClose} className="w-full py-2 text-sm text-eden-sage-dim">
        닫기
      </button>
    </div>
  )
}

const StatusNote = () => (
  <p className="text-xs text-eden-sage-dim">
    입금 확인, 픽업 준비 같은 주문 상태는 <strong className="text-eden-ink">내 주문</strong>에서 확인할 수 있어요.
  </p>
)

/** Order-complete dialog body: big check mark and the amount to send, everything else quiet. */
export function OrderCompleteBody({ order, onClose, onOrders }: BodyProps) {
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
          onClick={(e) => void pay.copy(e.currentTarget)}
          aria-label="계좌번호 복사"
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-[10px] bg-eden-paper px-4 py-3 text-left text-sm shadow-soft transition-transform active:scale-[0.98]"
        >
          <span>
            <span className="block text-xs text-eden-sage-dim">
              {pay.bank} · 예금주 {pay.holder}
            </span>
            <strong>{pay.account}</strong>
          </span>
          <CopyLabel copied={pay.copied} />
        </button>
        <p className="mt-3 text-base">
          입금자명은 <strong>{order.depositor || '주문하신 분 이름'}</strong>(으)로 해주세요.
        </p>
        <p className="mt-1 text-sm text-eden-sage-dim">{pay.note}</p>
      </div>
      <p className="text-xs text-eden-sage-dim">
        {itemsText(order)} · 주문번호 {order.id.slice(0, 8)}
      </p>
      <StatusNote />
      <div className="rounded-[10px] border border-eden-line px-4 py-3 text-sm">
        <p className="mb-2">주문을 취소하거나 바꾸고 싶으시면 전화 주세요.</p>
        <CallButton className="w-full bg-eden-paper" />
      </div>
      <Buttons onClose={onClose} onOrders={onOrders} />
    </div>
  )
}
