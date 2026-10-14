import { useCurrentPickupSlot, otherPickupLabel } from '@/lib/pickup'

/** Banner telling the customer which pickup day an order placed now will get. */
export function PickupNotice() {
  const slot = useCurrentPickupSlot()
  if (!slot) return null

  return (
    <div className="rounded-card bg-eden-sand/15 px-5 py-4">
      <div className="font-serif text-base font-semibold">
        지금 주문하시면{' '}
        <span className="text-eden-sand">
          {slot.dateLabel} {slot.label} 픽업
        </span>
        이에요
      </div>
      <div className="mt-1 text-xs text-eden-sage-dim">
        이 주문은 {slot.closesLabel}까지 받아요. 마감 이후에 주문하시면 {otherPickupLabel(slot)} 픽업으로 접수됩니다.
      </div>
    </div>
  )
}
