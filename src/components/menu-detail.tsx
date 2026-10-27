import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { isSoldOut, isUnpriced, type MenuItem } from '@/lib/menu'
import { maxQtyFor } from '@/lib/cart'
import { Coffee, Croissant, Flame, Minus, Plus, X } from 'lucide-react'

const CATEGORY_ICON = { bakery: Croissant, drink: Coffee } as const
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

type Props = {
  item: MenuItem | null
  popular?: boolean
  qty: number
  onAdd: (item: MenuItem) => void
  onQty: (name: string, qty: number) => void
  onClose: () => void
}

/**
 * Big-type detail view for one menu item, opened from a card on /order.
 * Same 담기 / 수량 controls as the card, sized for older eyes and fingers.
 */
export function MenuDetailDialog({ item, popular, qty, onAdd, onQty, onClose }: Props) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] max-w-[min(440px,calc(100%-2rem))] gap-0 overflow-y-auto rounded-card border-none bg-eden-paper p-0 text-eden-ink"
      >
        {item ? <Body item={item} popular={popular} qty={qty} onAdd={onAdd} onQty={onQty} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function Body({ item, popular, qty, onAdd, onQty }: Omit<Props, 'item' | 'onClose'> & { item: MenuItem }) {
  const Icon = CATEGORY_ICON[item.category]
  const soldOut = item.category === 'bakery' && isSoldOut(item)
  const unpriced = isUnpriced(item)
  const max = maxQtyFor(item)
  return (
    <>
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-eden-paper-dim">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className={`h-full w-full object-cover ${soldOut ? 'grayscale opacity-50' : ''}`} />
        ) : (
          <Icon size={56} strokeWidth={1.25} className="text-eden-sage-dim" />
        )}
        <DialogClose
          aria-label="닫기"
          className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-eden-paper/95 text-eden-ink shadow-soft"
        >
          <X size={26} strokeWidth={2.25} />
        </DialogClose>
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-full bg-eden-ink-2/90 px-3 py-1 text-sm font-semibold text-eden-paper">품절</span>
        ) : popular ? (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-eden-sand px-3 py-1 text-sm font-semibold text-eden-ink-2">
            <Flame size={14} strokeWidth={2} /> 인기
          </span>
        ) : null}
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <DialogTitle className="font-serif text-2xl font-semibold leading-snug">{item.name}</DialogTitle>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3">
            <span className={unpriced ? 'text-lg text-eden-sage-dim' : 'text-xl font-semibold'}>{unpriced ? '가격 준비 중' : won(item.price)}</span>
            {item.category === 'bakery' && !soldOut && item.stock !== null ? (
              <span className="text-base text-eden-sage-dim">{item.stock}개 남음</span>
            ) : null}
          </div>
        </div>

        <DialogDescription asChild>
          <div className="whitespace-pre-line text-[17px] leading-relaxed text-eden-ink">
            {item.description || <span className="text-eden-sage-dim">아직 메뉴 설명이 없어요.</span>}
          </div>
        </DialogDescription>

        {item.category === 'drink' ? (
          <p className="rounded-[10px] bg-eden-paper-dim px-4 py-3 text-base text-eden-sage-dim">
            음료는 온라인 주문이 안 돼요. 매장에서 바로 주문해주세요.
          </p>
        ) : soldOut ? (
          <p className="rounded-[10px] bg-eden-paper-dim px-4 py-3 text-base text-eden-sage-dim">오늘은 다 팔렸어요.</p>
        ) : unpriced ? (
          <p className="rounded-[10px] bg-eden-paper-dim px-4 py-3 text-base text-eden-sage-dim">가격이 정해지면 주문할 수 있어요.</p>
        ) : qty > 0 ? (
          <div className="flex h-14 items-center justify-between rounded-full bg-eden-ink px-2 text-eden-paper">
            <button
              type="button"
              onClick={() => onQty(item.name, qty - 1)}
              aria-label={`${item.name} 하나 빼기`}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-eden-ink-2"
            >
              <Minus size={22} />
            </button>
            <span className="text-lg font-semibold" aria-live="polite">
              {qty}개 담음
            </span>
            <button
              type="button"
              onClick={() => onQty(item.name, qty + 1)}
              disabled={qty >= max}
              aria-label={`${item.name} 하나 더`}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-eden-ink-2 disabled:opacity-30"
            >
              <Plus size={22} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(item)}
            className="h-14 w-full rounded-full bg-eden-ink text-lg font-semibold text-eden-paper hover:bg-eden-ink-2"
          >
            담기
          </button>
        )}

        <DialogClose className="h-12 w-full rounded-full border border-eden-line text-base font-semibold text-eden-ink hover:bg-eden-paper-dim">
          닫기
        </DialogClose>
      </div>
    </>
  )
}
