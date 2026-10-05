import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    googleSubject: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("google_subject", ["googleSubject"]),

  menuItems: defineTable({
    category: v.union(v.literal("bakery"), v.literal("drink")),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    soldOut: v.optional(v.boolean()),
    sortOrder: v.number(),
    // Photo stored in Convex file storage (no 1MB document limit)
    imageId: v.optional(v.id("_storage")),
  }).index("by_category", ["category", "sortOrder"]),

  orders: defineTable({
    userId: v.id("users"),
    customerName: v.string(),
    items: v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        qty: v.number(),
      })
    ),
    total: v.number(),
    status: v.union(v.literal("wait"), v.literal("done"), v.literal("picked")),
    pickupDow: v.union(v.literal("tue"), v.literal("thu")),
    pickupDateLabel: v.string(),
    pickupIso: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_pickupDow", ["pickupDow"])
    .index("by_status", ["status"]),

  // Generic editable text/image content keyed by a dotted path, e.g.
  // "hero.l1" or "hero.photo".
  siteContent: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  inquiries: defineTable({
    category: v.string(),
    title: v.string(),
    content: v.string(),
    authorUserId: v.id("users"),
    authorName: v.string(),
    status: v.union(v.literal("wait"), v.literal("done")),
    reply: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["authorUserId"])
    .index("by_status", ["status"]),
})
