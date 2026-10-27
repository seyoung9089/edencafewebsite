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

/** One square of the order calendar: the next five weekdays that take orders. */
export type CalendarDay = {
  iso: string
  /** Day of the month, e.g. 27 */
  date: number
  month: number
  /** '월' … '금' */
  weekday: string
  /** '이번 주', '다음 주' or '다다음 주' (weeks start on Monday) */
  weekLabel: string
  day: PickupDay
  /** Pickup day still taking orders */
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

/** One week of pickup: five weekdays. */
export const CALENDAR_DAYS = 5
const WEEK_LABELS = ['이번 주', '다음 주', '다다음 주']

/**
 * The first `count` weekdays that are still open for orders, weekends
 * skipped. It moves along one square each day: Mon–Fri today becomes
 * Tue–Mon tomorrow. With `only`, just those days (학부모 주문: the next two
 * Fridays; on Thursdays the second one is past the two-week window and greyed).
 */
export function listCalendarDays(nowMs: number, only: PickupDay | null = null, count = CALENDAR_DAYS): CalendarDay[] {
  const today = kstTodayStart(nowMs)
  // Monday of this week, for 이번 주/다음 주.
  const monday = today - ((new Date(today).getUTCDay() + 6) % 7) * DAY_MS
  const days: CalendarDay[] = []
  for (let i = DEADLINE_DAYS; days.length < count; i++) {
    const d = new Date(today + i * DAY_MS)
    const iso = d.toISOString().slice(0, 10)
    const day = pickupDayOf(iso)
    if (!day || (only && day !== only)) continue
    const week = Math.floor((d.getTime() - monday) / (7 * DAY_MS))
    days.push({
      iso,
      date: d.getUTCDate(),
      month: d.getUTCMonth() + 1,
      weekday: WEEKDAY_KO[d.getUTCDay()],
      weekLabel: WEEK_LABELS[week] ?? `${week}주 뒤`,
      day,
      open: i <= PICKUP_WINDOW_DAYS,
    })
  }
  return days
}

type PickupCalendar = {
  todayIso: string
  dates: PickupDate[]
  /** 마을 픽업 주문: the next five weekdays */
  days: CalendarDay[]
  /** 학부모 주문: the next two Fridays */
  fridays: CalendarDay[]
}

/**
 * Today's pickup calendar. Refreshes every minute and when the tab regains
 * focus, so a deadline closes at midnight without a reload. Returns null
 * until mounted (avoids an SSR/client mismatch).
 */
export function usePickupDates(): PickupCalendar | null {
  const [state, setState] = useState<PickupCalendar | null>(null)

  useEffect(() => {
    const load = () => {
      const now = Date.now()
      const todayIso = kstTodayIso(now)
      setState((prev) => (prev?.todayIso === todayIso ? prev : {
              todayIso,
              dates: listPickupDates(now),
              days: listCalendarDays(now),
              fridays: listCalendarDays(now, 'friday', 2),
            }))
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
