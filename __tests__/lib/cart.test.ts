import { describe, it, expect } from "vitest"
import { maxQtyFor, reconcileCart } from "@/lib/cart"
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
