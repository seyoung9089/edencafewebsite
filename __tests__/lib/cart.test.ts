import { describe, it, expect } from "vitest"
import { maxQtyFor, overGroupLimit, reconcileCart } from "@/lib/cart"
import type { MenuItem } from "@/lib/menu"

const bread = (over: Partial<MenuItem> = {}): MenuItem => ({
  name: "이든 소금빵",
  price: 4000,
  sold_out: false,
  stock: null,
  category: "bakery",
  description: "",
  sort_order: 0,
  image_url: null,
  is_featured: false,
  sale_days: ["weekday", "friday"],
  group_name: null,
  ...over,
})

describe("maxQtyFor", () => {
  it("caps at 20 when stock is unlimited", () => {
    expect(maxQtyFor(bread())).toBe(20)
  })
  it("caps at the remaining stock", () => {
    expect(maxQtyFor(bread({ stock: 3 }))).toBe(3)
  })
})

describe("reconcileCart", () => {
  it("leaves a matching cart alone", () => {
    const r = reconcileCart([{ name: "이든 소금빵", price: 4000, qty: 2 }], [bread()])
    expect(r.changed).toBe(false)
  })

  it("drops sold-out, missing and drink items", () => {
    const r = reconcileCart(
      [
        { name: "이든 소금빵", price: 4000, qty: 1 },
        { name: "통밀 캄파뉴", price: 6000, qty: 1 },
        { name: "없어진 빵", price: 3000, qty: 1 },
        { name: "카페모카", price: 5000, qty: 1 },
      ],
      [
        bread(),
        bread({ name: "통밀 캄파뉴", price: 6000, stock: 0 }),
        bread({ name: "카페모카", price: 5000, category: "drink" }),
      ],
    )
    expect(r.changed).toBe(true)
    expect(r.next.map((it) => it.name)).toEqual(["이든 소금빵"])
    expect(r.removed).toEqual(["통밀 캄파뉴", "없어진 빵", "카페모카"])
  })

  it("lowers quantity to what's left and updates the price", () => {
    const r = reconcileCart([{ name: "이든 소금빵", price: 3500, qty: 5 }], [bread({ stock: 2 })])
    expect(r.next).toEqual([{ name: "이든 소금빵", price: 4000, qty: 2 }])
    expect(r.reduced).toEqual([{ name: "이든 소금빵", qty: 2 }])
  })
})

describe("reconcileCart by pickup day", () => {
  const menu = [
    bread({ name: "기본 소금빵", sale_days: ["friday"], group_name: "소금빵" }),
    bread({ name: "에그타르트" }),
    bread({ name: "가격 미정 빵", price: 0 }),
  ]

  it("drops items not sold on the chosen day", () => {
    const r = reconcileCart(
      [
        { name: "기본 소금빵", price: 4000, qty: 1 },
        { name: "에그타르트", price: 4000, qty: 1 },
      ],
      menu,
      "weekday",
    )
    expect(r.next.map((it) => it.name)).toEqual(["에그타르트"])
    expect(r.offDay).toEqual(["기본 소금빵"])
  })

  it("keeps day-only items while no day is chosen, but drops unpriced ones", () => {
    const r = reconcileCart(
      [
        { name: "기본 소금빵", price: 4000, qty: 1 },
        { name: "가격 미정 빵", price: 0, qty: 1 },
      ],
      menu,
    )
    expect(r.next.map((it) => it.name)).toEqual(["기본 소금빵"])
    expect(r.removed).toEqual(["가격 미정 빵"])
  })
})

describe("overGroupLimit", () => {
  const menu = [
    bread({ name: "기본 소금빵", group_name: "소금빵" }),
    bread({ name: "햄치즈 소금빵", group_name: "소금빵" }),
    bread({ name: "기본 휘낭시에", group_name: "휘낭시에" }),
  ]
  const byName = new Map(menu.map((m) => [m.name, m]))
  const groups = [
    { name: "소금빵", sort_order: 1, max_qty: 9 },
    { name: "휘낭시에", sort_order: 2, max_qty: null },
  ]

  it("allows 9 flavours together", () => {
    const cart = [
      { name: "기본 소금빵", price: 4000, qty: 5 },
      { name: "햄치즈 소금빵", price: 4000, qty: 4 },
    ]
    expect(overGroupLimit(cart, byName, groups)).toBeNull()
  })

  it("blocks 10 across flavours (6 + 4)", () => {
    const cart = [
      { name: "기본 소금빵", price: 4000, qty: 6 },
      { name: "햄치즈 소금빵", price: 4000, qty: 4 },
    ]
    expect(overGroupLimit(cart, byName, groups)?.name).toBe("소금빵")
  })

  it("ignores kinds without a cap", () => {
    expect(overGroupLimit([{ name: "기본 휘낭시에", price: 4000, qty: 20 }], byName, groups)).toBeNull()
  })
})

describe("답례품 cart", () => {
  const gift = bread({ name: "답례 쿠키 세트", category: "gift", sale_days: [] })

  it("allows up to 50 of one gift", () => {
    expect(maxQtyFor(gift)).toBe(50)
    expect(maxQtyFor({ ...gift, stock: 30 })).toBe(30)
  })

  it("keeps gifts and drops bread in the gift cart, whatever the day", () => {
    const cart = [
      { name: "답례 쿠키 세트", price: 4000, qty: 40 },
      { name: "이든 소금빵", price: 4000, qty: 1 },
    ]
    const { next, removed } = reconcileCart(cart, [gift, bread()], "friday", "gift")
    expect(next).toEqual([{ name: "답례 쿠키 세트", price: 4000, qty: 40 }])
    expect(removed).toEqual(["이든 소금빵"])
  })

  it("drops gifts from the bread cart", () => {
    const { removed } = reconcileCart([{ name: "답례 쿠키 세트", price: 4000, qty: 1 }], [gift], null)
    expect(removed).toEqual(["답례 쿠키 세트"])
  })
})
