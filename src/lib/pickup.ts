import { useEffect, useRef, useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { PickupSlot } from '@/convex/pickupSchedule'

export type { PickupSlot }

/**
 * The pickup slot that a new order would fall into right now, based on the
 * SERVER's clock (so a wrong phone clock can't show the wrong day).
 * Refreshes every minute and when the tab regains focus.
 * Returns null until the first response arrives.
 */
export function useCurrentPickupSlot(): PickupSlot | null {
  const fetchSlot = useAction(api.schedule.currentSlot)
  const fetchRef = useRef(fetchSlot)
  fetchRef.current = fetchSlot
  const [slot, setSlot] = useState<PickupSlot | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      fetchRef
        .current({})
        .then((s) => {
          if (!cancelled) setSlot(s)
        })
        .catch(() => {})
    }
    load()
    const timer = window.setInterval(load, 60_000)
    window.addEventListener('focus', load)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', load)
    }
  }, [])

  return slot
}

export function otherPickupLabel(slot: PickupSlot): string {
  return slot.dow === 'tue' ? '목요일' : '화요일'
}
