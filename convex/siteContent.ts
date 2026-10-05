import { v, ConvexError } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx)
  if (!userId) throw new ConvexError('로그인이 필요합니다.')
  const user = await ctx.db.get(userId)
  if (!user?.isAdmin) throw new ConvexError('관리자만 사용할 수 있습니다.')
  return userId
}

// Returns the full key -> value map so the client can apply many overrides
// in one query instead of one round-trip per field.
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('siteContent').collect()
    const map: Record<string, string> = {}
    for (const row of rows) map[row.key] = row.value
    return map
  },
})

export const getImage = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('siteContent')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()
    return row?.value ?? null
  },
})

export const setMany = mutation({
  args: { entries: v.array(v.object({ key: v.string(), value: v.string() })) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    for (const { key, value } of args.entries) {
      const existing = await ctx.db
        .query('siteContent')
        .withIndex('by_key', (q) => q.eq('key', key))
        .unique()
      if (existing) {
        await ctx.db.patch(existing._id, { value })
      } else {
        await ctx.db.insert('siteContent', { key, value })
      }
    }
  },
})

export const setImage = mutation({
  args: { key: v.string(), value: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const existing = await ctx.db
      .query('siteContent')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()
    if (args.value === null) {
      if (existing) await ctx.db.delete(existing._id)
      return
    }
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value })
    } else {
      await ctx.db.insert('siteContent', { key: args.key, value: args.value })
    }
  },
})
