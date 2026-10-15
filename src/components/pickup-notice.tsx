import { useCurrentPickupSlot } from '@/lib/pickup'

/** Today's date and the pickup date an order placed now will get. */
export function PickupNotice() {
  const slot = useCurrentPickupSlot()
  if (!slot) return null

  return (
    <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-eden-sand/15 px-4 py-2 text-sm">
      <span>오늘 {slot.todayLabel}</span>
      <span aria-hidden className="text-eden-line">|</span>
      <span>
        픽업 <strong className="text-eden-sand">{slot.dateLabel}</strong>
      </span>
    </p>
  )
}
