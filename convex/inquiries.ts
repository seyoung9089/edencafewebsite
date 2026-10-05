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

export const create = mutation({
  args: { category: v.string(), title: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError('로그인이 필요합니다.')
    const user = await ctx.db.get(userId)
    if (!args.title.trim() || !args.content.trim()) throw new ConvexError('제목과 내용을 입력해주세요.')
    await ctx.db.insert('inquiries', {
      category: args.category,
      title: args.title,
      content: args.content,
      authorUserId: userId,
      authorName: user?.name ?? user?.email ?? '고객',
      status: 'wait',
      createdAt: Date.now(),
    })
  },
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const }
    const items = await ctx.db
      .query('inquiries')
      .withIndex('by_user', (q) => q.eq('authorUserId', userId))
      .order('desc')
      .collect()
    return { ok: true as const, items }
  },
})

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: 'UNAUTHENTICATED' as const }
    const user = await ctx.db.get(userId)
    if (!user?.isAdmin) return { ok: false as const, code: 'FORBIDDEN' as const }
    const items = await ctx.db.query('inquiries').order('desc').collect()
    return { ok: true as const, items }
  },
})

export const reply = mutation({
  args: { id: v.id('inquiries'), reply: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    if (!args.reply.trim()) throw new ConvexError('답변 내용을 입력해주세요.')
    await ctx.db.patch(args.id, { reply: args.reply, status: 'done' })
  },
})
