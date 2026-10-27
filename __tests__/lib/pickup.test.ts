import { describe, it, expect } from "vitest"
import { listCalendarDays, listPickupDates, pickupDayOf } from "@/lib/pickup"

// 2026-10-27 is a Tuesday. Times are given in Korea time (+09:00).
const at = (kst: string) => new Date(kst).getTime()

describe("pickupDayOf", () => {
  it("splits Mon–Thu, Friday and the weekend", () => {
    expect(pickupDayOf("2026-10-26")).toBe("weekday")
    expect(pickupDayOf("2026-10-29")).toBe("weekday")
    expect(pickupDayOf("2026-10-30")).toBe("friday")
    expect(pickupDayOf("2026-10-31")).toBeNull()
    expect(pickupDayOf("2026-11-01")).toBeNull()
  })
})

describe("listPickupDates", () => {
  it("closes two days before pickup at 23:59 Korea time", () => {
    const tueNight = listPickupDates(at("2026-10-27T23:59:00+09:00"))
    expect(tueNight.find((d) => d.iso === "2026-10-28")?.open).toBe(false)
    expect(tueNight.find((d) => d.iso === "2026-10-29")?.open).toBe(true)

    // Friday pickup closes Wednesday 23:59.
    const wedNight = listPickupDates(at("2026-10-28T23:59:00+09:00"))
    const fri = wedNight.find((d) => d.iso === "2026-10-30")
    expect(fri).toMatchObject({ day: "friday", open: true, deadlineLabel: "10월 28일(수)" })
    const thuMorning = listPickupDates(at("2026-10-29T00:00:00+09:00"))
    expect(thuMorning.find((d) => d.iso === "2026-10-30")?.open).toBe(false)
  })

  it("uses the Korea date even when UTC is still the day before", () => {
    // 2026-10-28 00:30 KST = 2026-10-27 15:30 UTC
    const dates = listPickupDates(at("2026-10-28T00:30:00+09:00"))
    expect(dates[0].iso).toBe("2026-10-29")
    expect(dates.find((d) => d.iso === "2026-10-30")?.open).toBe(true)
  })

  it("skips weekends and stays within two weeks", () => {
    const dates = listPickupDates(at("2026-10-27T12:00:00+09:00"))
    expect(dates.every((d) => pickupDayOf(d.iso) !== null)).toBe(true)
    expect(dates[dates.length - 1].iso <= "2026-11-10").toBe(true)
    expect(dates.length).toBe(10)
  })
})

describe("listCalendarDays", () => {
  it("shows the next five open weekdays, weekends skipped", () => {
    // Tue 10/27: the first open day is Thu 10/29.
    const days = listCalendarDays(at("2026-10-27T09:00:00+09:00"))
    expect(days.map((d) => `${d.weekday}${d.date}`)).toEqual(["목29", "금30", "월2", "화3", "수4"])
    expect(days.map((d) => d.weekLabel)).toEqual(["이번 주", "이번 주", "다음 주", "다음 주", "다음 주"])
    expect(days.every((d) => d.open)).toBe(true)
    expect(days[1].day).toBe("friday")
  })

  it("moves along one square the next day", () => {
    const days = listCalendarDays(at("2026-10-28T00:00:00+09:00"))
    expect(days.map((d) => d.weekday)).toEqual(["금", "월", "화", "수", "목"])
  })

  it("starts on Monday from Thursday night through the weekend", () => {
    for (const t of ["2026-10-29T12:00:00+09:00", "2026-10-31T12:00:00+09:00", "2026-11-01T23:00:00+09:00"]) {
      expect(listCalendarDays(at(t))[0].iso).toBe(t.startsWith("2026-11-01") ? "2026-11-03" : "2026-11-02")
    }
  })

  it("lists the next two Fridays for 학부모 주문", () => {
    // Tue 10/27: Fri 10/30 and Fri 11/6, both open.
    const tue = listCalendarDays(at("2026-10-27T09:00:00+09:00"), "friday", 2)
    expect(tue.map((d) => [d.iso, d.weekLabel, d.open])).toEqual([
      ["2026-10-30", "이번 주", true],
      ["2026-11-06", "다음 주", true],
    ])
    // Thu 10/29: this Friday has closed; 11/13 is past the two-week window.
    const thu = listCalendarDays(at("2026-10-29T09:00:00+09:00"), "friday", 2)
    expect(thu.map((d) => [d.iso, d.open])).toEqual([
      ["2026-11-06", true],
      ["2026-11-13", false],
    ])
  })
})
