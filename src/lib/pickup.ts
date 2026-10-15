import { useEffect, useState } from 'react'

// Daily pickup (Korea time, UTC+9, no DST): an order placed any time on a
// given day, up to midnight, is picked up the next day. The Supabase
// place_order function applies the same rule and rejects a stale date, so
// a wrong device clock can't book the wrong day.

export type PickupSlot = {
  /** Pickup date as YYYY-MM-DD (Korea calendar date) */
  iso: string
  /** e.g. "10월 15일(목)" */
  todayLabel: string
  /** e.g. "10월 16일(금)" */
  dateLabel: string
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function dayLabel(d: Date): string {
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${WEEKDAY_KO[d.getUTCDay()]})`
}

export function getCurrentPickupSlot(nowMs: number): PickupSlot {
  // Shift into Korea time, then read the fields with the UTC getters.
  const kst = new Date(nowMs + KST_OFFSET_MS)
  const todayStart = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate())
  const today = new Date(todayStart)
  const pickup = new Date(todayStart + DAY_MS)

  return {
    iso: pickup.toISOString().slice(0, 10),
    todayLabel: dayLabel(today),
    dateLabel: dayLabel(pickup),
  }
}

/**
 * The pickup slot that a new order would fall into right now.
 * Refreshes every minute and when the tab regains focus, so it rolls over
 * at midnight. Returns null until mounted (avoids an SSR/client mismatch).
 */
export function useCurrentPickupSlot(): PickupSlot | null {
  const [slot, setSlot] = useState<PickupSlot | null>(null)

  useEffect(() => {
    const load = () => setSlot(getCurrentPickupSlot(Date.now()))
    load()
    const timer = window.setInterval(load, 60_000)
    window.addEventListener('focus', load)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', load)
    }
  }, [])

  return slot
}
