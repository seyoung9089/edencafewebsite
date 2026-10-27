import { useEffect, useState } from 'react'

// Pre-order pickup (Korea time, UTC+9, no DST). Pickup is Monday to Friday,
// chosen by the customer, up to PICKUP_WINDOW_DAYS ahead. Orders for a day
// close at 23:59 two days before it (Friday pickup → Wednesday 23:59).
// Monday–Thursday and Friday have different menus (menu_catalog.sale_days).
// The Supabase check_order_rules trigger applies the same rules, so a wrong
// device clock can't sneak an order past the deadline.

/** Which menu a pickup day uses. */
export type PickupDay = 'weekday' | 'friday'

export type PickupDate = {
  /** Pickup date as YYYY-MM-DD (Korea calendar date) */
  iso: string
  /** e.g. "10월 31일(금)" */
  label: string
  day: PickupDay
  /** Last day to order, e.g. "10월 29일(수)" (closes at 23:59) */
  deadlineLabel: string
  /** Still taking orders for this day */
  open: boolean
}

export const DEADLINE_DAYS = 2
export const PICKUP_WINDOW_DAYS = 14

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function dayLabel(d: Date): string {
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${WEEKDAY_KO[d.getUTCDay()]})`
}

/** "10월 31일(금)" for a YYYY-MM-DD date. */
export function pickupLabel(iso: string): string {
  return dayLabel(new Date(`${iso}T00:00:00Z`))
}

/** Friday uses the Friday menu; other weekdays the 월~목 menu; weekends have no pickup. */
export function pickupDayOf(iso: string): PickupDay | null {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay()
  if (dow === 0 || dow === 6) return null
  return dow === 5 ? 'friday' : 'weekday'
}

/** Midnight (as a UTC timestamp) of today's Korea calendar date. */
function kstTodayStart(nowMs: number): number {
  const kst = new Date(nowMs + KST_OFFSET_MS)
  return Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate())
}

/** Today as YYYY-MM-DD (Korea calendar date). */
export function kstTodayIso(nowMs: number): string {
  return new Date(kstTodayStart(nowMs)).toISOString().slice(0, 10)
}

/**
 * Pickup days from tomorrow through PICKUP_WINDOW_DAYS ahead, weekends left
 * out. Days whose deadline has passed are kept (open: false) so the customer
 * sees why they can't pick them.
 */
export function listPickupDates(nowMs: number): PickupDate[] {
  const today = kstTodayStart(nowMs)
  const dates: PickupDate[] = []
  for (let i = 1; i <= PICKUP_WINDOW_DAYS; i++) {
    const d = new Date(today + i * DAY_MS)
    const iso = d.toISOString().slice(0, 10)
    const day = pickupDayOf(iso)
    if (!day) continue
    dates.push({
      iso,
      label: dayLabel(d),
      day,
      deadlineLabel: dayLabel(new Date(d.getTime() - DEADLINE_DAYS * DAY_MS)),
      open: i >= DEADLINE_DAYS,
    })
  }
  return dates
}

/**
 * Today's pickup calendar. Refreshes every minute and when the tab regains
 * focus, so a deadline closes at midnight without a reload. Returns null
 * until mounted (avoids an SSR/client mismatch).
 */
export function usePickupDates(): { todayIso: string; dates: PickupDate[] } | null {
  const [state, setState] = useState<{ todayIso: string; dates: PickupDate[] } | null>(null)

  useEffect(() => {
    const load = () => {
      const now = Date.now()
      const todayIso = kstTodayIso(now)
      setState((prev) => (prev?.todayIso === todayIso ? prev : { todayIso, dates: listPickupDates(now) }))
    }
    load()
    const timer = window.setInterval(load, 60_000)
    window.addEventListener('focus', load)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', load)
    }
  }, [])

  return state
}
