// Pickup schedule (Korea time, UTC+9, no DST).
//
// Pickups happen only on Tuesday and Thursday. Every moment belongs to
// exactly one ordering window, with no gaps and no overlaps:
//
//   Wed 19:00 -> Mon 19:00  : orders go to the next TUESDAY pickup
//   Mon 19:00 -> Wed 19:00  : orders go to that week's THURSDAY pickup
//
// The same function runs on the server (to assign the pickup day when an
// order is created) and is exposed to the client through an action, so the
// customer never chooses a weekday — the time decides it.

export type PickupSlot = {
  dow: 'tue' | 'thu'
  label: '화요일' | '목요일'
  /** Pickup date as YYYY-MM-DD (Korea calendar date) */
  iso: string
  /** e.g. "9월 29일" */
  dateLabel: string
  /** UTC epoch ms when ordering for this slot closes */
  closesAtMs: number
  /** e.g. "9월 28일(월) 오후 7시" */
  closesLabel: string
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const CUTOFF_HOUR = 19
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

export function getCurrentPickupSlot(nowMs: number): PickupSlot {
  // Shift into Korea time, then read the fields with the UTC getters.
  const kst = new Date(nowMs + KST_OFFSET_MS)
  const day = kst.getUTCDay() // 0=Sun ... 6=Sat
  const beforeCutoff = kst.getUTCHours() < CUTOFF_HOUR
  const todayStart = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate())

  const isThursdayWindow =
    (day === 1 && !beforeCutoff) || // Mon 19:00 onward
    day === 2 || // all of Tuesday
    (day === 3 && beforeCutoff) // Wed until 19:00

  const dow: 'tue' | 'thu' = isThursdayWindow ? 'thu' : 'tue'
  const targetDay = isThursdayWindow ? 4 : 2
  const pickupStart = todayStart + ((targetDay - day + 7) % 7) * DAY_MS
  // Thursday orders close Wednesday 19:00; Tuesday orders close Monday 19:00.
  const closeDayStart = pickupStart - DAY_MS
  const closesAtMs = closeDayStart + CUTOFF_HOUR * 60 * 60 * 1000 - KST_OFFSET_MS

  const pickup = new Date(pickupStart)
  const close = new Date(closeDayStart)

  return {
    dow,
    label: dow === 'tue' ? '화요일' : '목요일',
    iso: pickup.toISOString().slice(0, 10),
    dateLabel: `${pickup.getUTCMonth() + 1}월 ${pickup.getUTCDate()}일`,
    closesAtMs,
    closesLabel: `${close.getUTCMonth() + 1}월 ${close.getUTCDate()}일(${WEEKDAY_KO[close.getUTCDay()]}) 오후 7시`,
  }
}
