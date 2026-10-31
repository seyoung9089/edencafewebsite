import { Link } from '@tanstack/react-router'
import { Minus, Plus, X } from 'lucide-react'
import { maxQtyFor, type CartItem } from '@/lib/cart'
import type { MenuItem } from '@/lib/menu'
import type { PickupDate } from '@/lib/pickup'
import { CopyLabel, usePayment } from '@/components/payment-info'
import { rememberReturnTo } from '@/lib/return-to'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
/** "11/2(월)" for the order button. */
const shortDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`)
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${'일월화수목금토'[d.getUTCDay()]})`
}

export type PaymentMethod = 'transfer' | 'onsite'

type ReceiptProps = {
  items: CartItem[]
  menuByName: Map<string, MenuItem>
  totalPrice: number
  /** The pickup day the customer picked, or null if not yet */
  pickup: PickupDate | null
  /** 학부모 주문 tab: student name and payment choice */
  parents: boolean
  /** 답례품 예약 tab: an optional request note */
  gift: boolean
  requestNote: string
  onRequestNote: (note: string) => void
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
    <div className="mt-4 space-y-4 rounded-[2px] border border-eden-accent/60 bg-eden-paper px-4 py-4">
      <label className="block">
        <span className="text-sm font-semibold">
          학생 이름 <span className="text-eden-accent">(필수)</span>
        </span>
        <input
          value={studentName}
          onChange={(e) => onStudentName(e.target.value)}
          maxLength={30}
          placeholder="예: 김이든"
          autoComplete="off"
          className="mt-1.5 h-12 w-full rounded-[2px] border border-eden-line bg-eden-paper-dim px-3 text-base text-eden-ink placeholder:text-eden-mute/70"
        />
        <span className="mt-1 block text-sm text-eden-mute">금요일 하교할 때 이 이름으로 찾아갑니다.</span>
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
              className={`h-12 rounded-[3px] border text-base font-semibold transition-colors ${
                paymentMethod === value ? 'border-eden-accent bg-eden-accent text-white' : 'border-eden-line bg-white text-eden-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {paymentMethod === 'transfer' ? (
        <div className="rounded-[2px] bg-eden-mute px-4 py-3 text-sm leading-relaxed text-eden-paper">
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
        <p className="rounded-[2px] bg-eden-paper-dim px-4 py-3 text-sm text-eden-mute">학생이 찾아갈 때 매장에서 결제합니다.</p>
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
  gift,
  requestNote,
  onRequestNote,
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
    <div className="border border-eden-line bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="eyebrow">3단계 · 주문</p>
          <h2 className="mt-1.5 text-[1.35rem]">주문 내역</h2>
        </div>
        <Link to="/guide" className="rounded-[3px] border border-eden-line px-3 py-1.5 text-sm font-semibold text-eden-ink hover:bg-eden-paper">
          이용방법
        </Link>
      </div>

      <div className="mt-3 border-y border-eden-line py-3">
        <div className="text-sm text-eden-mute">픽업 날짜</div>
        {pickup ? (
          <>
            <div className="font-serif text-base font-light text-eden-ink">
              {pickup.label}
              {pickupTime && !parents ? <span className="ml-1.5 font-sans text-sm font-normal text-eden-mute">{pickupTime}</span> : null}
            </div>
          </>
        ) : (
          <div className="font-semibold text-eden-accent">먼저 찾아가실 날짜를 고르시면 됩니다</div>
        )}
      </div>

      <div className="mt-4 border-t border-dashed border-eden-mute/40">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-eden-mute">아직 담은 메뉴가 없습니다.</p>
        ) : (
          items.map((it) => (
            <div key={it.name} className="border-b border-dashed border-eden-line py-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[15px] font-semibold leading-snug">{it.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(it.name)}
                  aria-label={`${it.name} 빼기`}
                  className="-mr-1 p-1 text-eden-mute hover:text-destructive"
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
                <span className="font-serif font-light">{won(it.price * it.qty)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="font-semibold">합계</span>
        <span className="font-serif text-2xl font-light text-eden-accent">{won(totalPrice)}</span>
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

      {gift ? (
        <label className="mt-4 block">
          <span className="text-sm font-semibold">
            요청사항 <span className="font-normal text-eden-mute">(선택)</span>
          </span>
          <textarea
            value={requestNote}
            onChange={(e) => onRequestNote(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="예: 포장 문구, 행사 이름, 연락받을 번호"
            className="mt-1.5 w-full rounded-[2px] border border-eden-line bg-eden-paper px-3 py-2 text-base text-eden-ink placeholder:text-eden-mute/70"
          />
        </label>
      ) : null}

      <div className="mt-5">
        {loggedIn === null ? (
          <div className="h-14 w-full animate-pulse rounded-[3px] bg-eden-line" />
        ) : loggedIn ? (
          <>
            {blocker && items.length > 0 ? <p className="mb-2 text-center text-sm font-semibold text-eden-accent">{blocker}</p> : null}
            {!blocker && items.length > 0 && pickup ? (
              <ul className="mb-3 space-y-1 bg-eden-paper px-4 py-3 text-sm leading-relaxed">
                <li>
                  <span className="text-eden-mute">픽업</span> <strong>{pickup.label}</strong>
                  {pickupTime && !parents ? ` ${pickupTime}` : ''}
                </li>
                <li>
                  <span className="text-eden-mute">결제</span>{' '}
                  <strong>{parents && paymentMethod === 'onsite' ? '현장결제' : '계좌이체'}</strong>
                </li>
                <li className="text-eden-mute">
                  {parents && paymentMethod === 'onsite'
                    ? '준비가 시작되기 전까지 내 주문에서 취소할 수 있습니다.'
                    : '입금이 확인되기 전까지 내 주문에서 취소할 수 있습니다.'}
                </li>
              </ul>
            ) : null}
            <button
              type="button"
              onClick={onCheckout}
              disabled={Boolean(blocker) || items.length === 0 || submitting}
              className="h-14 w-full rounded-[3px] bg-eden-accent text-base font-semibold text-white transition-colors enabled:hover:bg-eden-accent-d disabled:border disabled:border-eden-line disabled:bg-eden-paper-dim disabled:text-eden-mute"
            >
              {submitting ? '주문하는 중…' : `${pickup ? `${shortDate(pickup.iso)} 픽업 ` : ''}${gift ? '예약하기' : '주문하기'}`}
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              onClick={() => rememberReturnTo(parents ? '/parents' : '/order')}
              className="flex h-14 w-full items-center justify-center rounded-[3px] bg-eden-accent text-base font-semibold text-white transition-colors hover:bg-eden-accent-d"
            >
              {gift ? '로그인하고 예약하기' : '로그인하고 주문하기'}
            </Link>
            <p className="mt-2 text-center text-sm text-eden-mute">처음이시면 회원가입부터 하시면 됩니다. 담은 {gift ? '답례품' : '빵'}은 그대로 남아 있습니다.</p>
          </>
        )}
        {loggedIn && (!parents || paymentMethod === 'transfer') ? (
          <p className="mt-2 text-center text-sm text-eden-mute">주문하면 입금할 계좌를 바로 알려 드립니다.</p>
        ) : null}
      </div>
    </div>
  )
}
