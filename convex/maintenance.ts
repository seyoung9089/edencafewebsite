import { v } from 'convex/values'
import { internalMutation } from './_generated/server'

// One-time cleanup: a leftover QA test account (e2e+...@e2e.macaly.dev) had
// claimed the single admin seat during development testing, silently
// blocking the real user's account from registering. This hands the seat
// to the real account and clears the test ones. Idempotent.
export const fixAdminOwnership = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    const results: string[] = []
    for (const u of users) {
      if (u.email === '1125@bmrschool.org' && !u.isAdmin) {
        await ctx.db.patch(u._id, { isAdmin: true })
        results.push(`granted admin: ${u.email}`)
      }
      if (u.email?.startsWith('e2e+') && u.isAdmin) {
        await ctx.db.patch(u._id, { isAdmin: false })
        results.push(`revoked test admin: ${u.email}`)
      }
    }
    return results
  },
})

// QA helpers: briefly give the automated test account admin rights so the
// admin screens can be exercised in a browser, then remove what the test
// created. Only accounts whose email starts with "e2e+" are ever touched,
// and only recent orders (default: last 30 minutes) are removed, so real
// customer orders can never be deleted by this.
export const grantTestAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    const out: string[] = []
    for (const u of await ctx.db.query('users').collect()) {
      if (u.email?.startsWith('e2e+') && !u.isAdmin) {
        await ctx.db.patch(u._id, { isAdmin: true })
        out.push(u.email)
      }
    }
    return out
  },
})

export const cleanupTestData = internalMutation({
  args: { sinceMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const since = args.sinceMs ?? Date.now() - 30 * 60 * 1000
    const testUserIds = new Set(
      (await ctx.db.query('users').collect()).filter((u) => u.email?.startsWith('e2e+')).map((u) => u._id),
    )
    let orders = 0
    for (const o of await ctx.db.query('orders').collect()) {
      if (testUserIds.has(o.userId) && o.createdAt >= since) {
        await ctx.db.delete(o._id)
        orders++
      }
    }
    let menu = 0
    for (const m of await ctx.db.query('menuItems').collect()) {
      if (m.name.startsWith('[테스트]')) {
        if (m.imageId) await ctx.storage.delete(m.imageId)
        await ctx.db.delete(m._id)
        menu++
      }
    }
    return { deletedTestOrders: orders, deletedTestMenuItems: menu }
  },
})
