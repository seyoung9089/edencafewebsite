import { Link } from '@tanstack/react-router'
import { Minus, Plus, X } from 'lucide-react'
import { maxQtyFor, type CartItem } from '@/lib/cart'
import type { MenuItem } from '@/lib/menu'
import type { PickupSlot } from '@/lib/pickup'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

type ReceiptProps = {
  items: CartItem[]
  menuByName: Map<string, MenuItem>
  totalPrice: number
  slot: PickupSlot | null
  pickupTime: string
  /** null while the login state is still loading */
  loggedIn: boolean | null
  submitting: boolean
  canSubmit: boolean
  onQty: (name: string, qty: number) => void
  onRemove: (name: string) => void
  onCheckout: () => void
}

/** The always-visible order summary on /order: items, pickup day, total and the order button. */
export function OrderReceipt({
  items,
  menuByName,
  totalPrice,
  slot,
  pickupTime,
  loggedIn,
  submitting,
  canSubmit,
  onQty,
  onRemove,
  onCheckout,
}: ReceiptProps) {
  return (
    <div className="rounded-card bg-eden-paper-dim p-5 shadow-soft">
      <h2 className="font-serif text-lg font-semibold">주문 내역</h2>

      <div className="mt-3 rounded-[10px] bg-eden-sand/15 px-4 py-3">
        <div className="text-xs text-eden-sage-dim">픽업 날짜</div>
        {slot ? (
          <div className="font-serif text-base font-semibold text-eden-ink">
            {slot.dateLabel}
            {pickupTime ? <span className="ml-1.5 font-sans text-sm font-normal text-eden-sage-dim">{pickupTime}</span> : null}
          </div>
        ) : (
          <div className="mt-1 h-5 w-32 animate-pulse rounded bg-eden-line" />
        )}
        <p className="mt-1 text-[11px] leading-relaxed text-eden-sage-dim">오늘 자정까지 주문하면 다음 날 찾아가실 수 있어요.</p>
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

      <div className="mt-5">
        {loggedIn === null ? (
          <div className="h-14 w-full animate-pulse rounded-full bg-eden-line" />
        ) : loggedIn ? (
          <button
            type="button"
            onClick={onCheckout}
            disabled={!canSubmit || submitting}
            className="h-14 w-full rounded-full bg-eden-ink text-base font-semibold text-eden-paper transition-colors hover:bg-eden-ink-2 disabled:opacity-40"
          >
            {submitting ? '주문하는 중…' : '주문하기'}
          </button>
        ) : (
          <>
            <Link
              to="/login"
              className="flex h-14 w-full items-center justify-center rounded-full bg-eden-ink text-base font-semibold text-eden-paper transition-colors hover:bg-eden-ink-2"
            >
              로그인하고 주문하기
            </Link>
            <p className="mt-2 text-center text-xs text-eden-sage-dim">담은 메뉴는 로그인해도 그대로 남아 있어요.</p>
          </>
        )}
        {loggedIn ? <p className="mt-2 text-center text-xs text-eden-sage-dim">주문하면 입금할 계좌를 바로 알려드려요.</p> : null}
      </div>
    </div>
  )
}
