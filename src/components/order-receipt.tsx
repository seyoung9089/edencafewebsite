import { Link } from '@tanstack/react-router'
import { Minus, Plus, X } from 'lucide-react'
import { maxQtyFor, type CartItem } from '@/lib/cart'
import type { MenuItem } from '@/lib/menu'
import type { PickupDate } from '@/lib/pickup'
import { CopyLabel, usePayment } from '@/components/payment-info'
import { rememberReturnTo } from '@/lib/return-to'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

export type PaymentMethod = 'transfer' | 'onsite'

type ReceiptProps = {
  items: CartItem[]
  menuByName: Map<string, MenuItem>
  totalPrice: number
  /** The pickup day the customer picked, or null if not yet */
  pickup: PickupDate | null
  /** 학부모 주문 tab: student name and payment choice */
  parents: boolean
  pickupTime: string
  /** null while the login state is still loading */
  loggedIn: boolean | null
  submitting: boolean
  /** Why the order can't go in yet (shown above the button), or '' */
  blocker: string
  /** 학부모 주문 only: who picks up, and how they pay */
  studentName: string
  onStudentName: (name: string) => void
  paymentMethod: PaymentMethod | null
  onPaymentMethod: (method: PaymentMethod) => void
  studentDepositNote: string
  onQty: (name: string, qty: number) => void
  onRemove: (name: string) => void
  onCheckout: () => void
}

/** 학부모 주문: the student's name and 계좌이체/현장결제. */
function FridayFields({
  studentName,
  onStudentName,
  paymentMethod,
  onPaymentMethod,
  studentDepositNote,
}: Pick<ReceiptProps, 'studentName' | 'onStudentName' | 'paymentMethod' | 'onPaymentMethod' | 'studentDepositNote'>) {
  const pay = usePayment()
  return (
    <div className="mt-4 space-y-4 rounded-[10px] border border-eden-sand/60 bg-eden-paper px-4 py-4">
      <label className="block">
        <span className="text-sm font-semibold">
          학생 이름 <span className="text-eden-sand">(필수)</span>
        </span>
        <input
          value={studentName}
          onChange={(e) => onStudentName(e.target.value)}
          maxLength={30}
          placeholder="예: 김이든"
          autoComplete="off"
          className="mt-1.5 h-12 w-full rounded-[10px] border border-eden-line bg-eden-paper-dim px-3 text-base text-eden-ink placeholder:text-eden-sage-dim/70"
        />
        <span className="mt-1 block text-xs text-eden-sage-dim">금요일 하교할 때 이 이름으로 찾아가요.</span>
      </label>

      <fieldset>
        <legend className="text-sm font-semibold">결제 방법</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(
            [
              ['transfer', '계좌이체'],
              ['onsite', '현장결제'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={paymentMethod === value}
              onClick={() => onPaymentMethod(value)}
              className={`h-12 rounded-full border text-base font-semibold transition-colors ${
                paymentMethod === value ? 'border-eden-ink bg-eden-ink text-eden-paper' : 'border-eden-line bg-eden-paper-dim text-eden-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {paymentMethod === 'transfer' ? (
        <div className="rounded-[10px] bg-eden-sage-dim px-4 py-3 text-sm leading-relaxed text-eden-paper">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {pay.bank} <strong>{pay.account}</strong>
            </span>
            <button type="button" onClick={(e) => void pay.copy(e.currentTarget)} aria-label="계좌번호 복사">
              <CopyLabel copied={pay.copied} />
            </button>
          </div>
          <div>예금주 {pay.holder}</div>
          <div className="mt-1 font-semibold">{studentDepositNote}</div>
        </div>
      ) : paymentMethod === 'onsite' ? (
        <p className="rounded-[10px] bg-eden-paper-dim px-4 py-3 text-sm text-eden-sage-dim">학생이 찾아갈 때 매장에서 결제해요.</p>
      ) : null}
    </div>
  )
}

/** The always-visible order summary on /order: items, pickup day, total and the order button. */
export function OrderReceipt({
  items,
  menuByName,
  totalPrice,
  pickup,
  parents,
  pickupTime,
  loggedIn,
  submitting,
  blocker,
  studentName,
  onStudentName,
  paymentMethod,
  onPaymentMethod,
  studentDepositNote,
  onQty,
  onRemove,
  onCheckout,
}: ReceiptProps) {
  return (
    <div className="rounded-card bg-eden-paper-dim p-5 shadow-soft">
      <h2 className="font-serif text-lg font-semibold">주문 내역</h2>

      <div className="mt-3 rounded-[10px] bg-eden-sand/15 px-4 py-3">
        <div className="text-xs text-eden-sage-dim">픽업 날짜</div>
        {pickup ? (
          <>
            <div className="font-serif text-base font-semibold text-eden-ink">
              {pickup.label}
              {pickupTime && !parents ? <span className="ml-1.5 font-sans text-sm font-normal text-eden-sage-dim">{pickupTime}</span> : null}
            </div>
            {parents ? <p className="mt-1 text-xs leading-relaxed text-eden-sage-dim">학생이 금요일 하교할 때 찾아가요.</p> : null}
          </>
        ) : (
          <div className="font-semibold text-eden-sand">먼저 픽업 날짜를 골라 주세요</div>
        )}
      </div>

      <div className="mt-4 border-t border-dashed border-eden-sage-dim/40">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-eden-sage-dim">아직 담은 메뉴가 없어요.</p>
        ) : (
          items.map((it) => (
            <div key={it.name} className="border-b border-dashed border-eden-line py-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[15px] font-semibold leading-snug">{it.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(it.name)}
                  aria-label={`${it.name} 빼기`}
                  className="-mr-1 p-1 text-eden-sage-dim hover:text-destructive"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onQty(it.name, it.qty - 1)}
                    disabled={it.qty <= 1}
                    aria-label={`${it.name} 하나 빼기`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-eden-line bg-eden-paper disabled:opacity-30"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="min-w-6 text-center font-semibold">{it.qty}</span>
                  <button
                    type="button"
                    onClick={() => onQty(it.name, it.qty + 1)}
                    disabled={it.qty >= maxQtyFor(menuByName.get(it.name))}
                    aria-label={`${it.name} 하나 더`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-eden-line bg-eden-paper disabled:opacity-30"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <span className="font-serif font-semibold">{won(it.price * it.qty)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="font-semibold">합계</span>
        <span className="font-serif text-2xl font-bold text-eden-sand">{won(totalPrice)}</span>
      </div>

      {parents ? (
        <FridayFields
          studentName={studentName}
          onStudentName={onStudentName}
          paymentMethod={paymentMethod}
          onPaymentMethod={onPaymentMethod}
          studentDepositNote={studentDepositNote}
        />
      ) : null}

      <div className="mt-5">
        {loggedIn === null ? (
          <div className="h-14 w-full animate-pulse rounded-full bg-eden-line" />
        ) : loggedIn ? (
          <>
            {blocker && items.length > 0 ? <p className="mb-2 text-center text-sm font-semibold text-eden-sand">{blocker}</p> : null}
            <button
              type="button"
              onClick={onCheckout}
              disabled={Boolean(blocker) || items.length === 0 || submitting}
              className="h-14 w-full rounded-full bg-eden-ink text-base font-semibold text-eden-paper transition-colors hover:bg-eden-ink-2 disabled:opacity-40"
            >
              {submitting ? '주문하는 중…' : '주문하기'}
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              onClick={() => rememberReturnTo(parents ? '/parents' : '/order')}
              className="flex h-14 w-full items-center justify-center rounded-full bg-eden-ink text-base font-semibold text-eden-paper transition-colors hover:bg-eden-ink-2"
            >
              로그인하고 주문하기
            </Link>
            <p className="mt-2 text-center text-xs text-eden-sage-dim">처음이시면 회원가입부터 해요. 담은 빵은 그대로 남아 있어요.</p>
          </>
        )}
        {loggedIn && (!parents || paymentMethod === 'transfer') ? (
          <p className="mt-2 text-center text-xs text-eden-sage-dim">주문하면 입금할 계좌를 바로 알려드려요.</p>
        ) : null}
      </div>
    </div>
  )
}
