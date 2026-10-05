import { v, ConvexError } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'
import { getCurrentPickupSlot } from './pickupSchedule'

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: 'UNAUTHENTICATED' as const }
    const items = await ctx.db
      .query('orders')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
    return { ok: true as const, items }
  },
})

// The customer no longer picks a weekday. The server looks at the current
// time and assigns Tuesday or Thursday pickup by itself. Prices also come
// from the menu table, never from the browser, so an outdated cart or a
// tampered request can't change what an order costs.
//
// Compatibility: the previously published frontend still sends
// items[].price and pickupDow / pickupDateLabel / pickupIso. Those are
// accepted so that version keeps working until the new frontend is live,
// but they are deliberately ignored — the server's own values always win.
export const create = mutation({
  args: {
    items: v.array(
      v.object({
        name: v.string(),
        qty: v.number(),
        price: v.optional(v.number()), // legacy, ignored
      }),
    ),
    expectedPickupIso: v.optional(v.string()),
    pickupDow: v.optional(v.union(v.literal('tue'), v.literal('thu'))), // legacy, ignored
    pickupDateLabel: v.optional(v.string()), // legacy, ignored
    pickupIso: v.optional(v.string()), // legacy, ignored
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError('로그인이 필요합니다.')
    const user = await ctx.db.get(userId)
    if (!args.items.length) throw new ConvexError('장바구니가 비어있습니다.')

    const slot = getCurrentPickupSlot(Date.now())
    if (args.expectedPickupIso !== undefined && slot.iso !== args.expectedPickupIso) {
      throw new ConvexError(
        `주문 가능 시간이 바뀌었어요. 지금 주문은 ${slot.dateLabel} ${slot.label} 픽업으로 접수됩니다. 화면을 새로고침한 뒤 다시 확인해주세요.`,
      )
    }

    const menu = await ctx.db.query('menuItems').collect()
    const byName = new Map(menu.map((m) => [m.name, m]))
    const priced: { name: string; price: number; qty: number }[] = []
    for (const it of args.items) {
      if (!Number.isInteger(it.qty) || it.qty < 1 || it.qty > 20) {
        throw new ConvexError('수량은 1~20개까지 선택할 수 있어요.')
      }
      const m = byName.get(it.name)
      if (!m) throw new ConvexError(`"${it.name}" 메뉴는 더 이상 판매하지 않아요. 장바구니에서 삭제해주세요.`)
      if (m.soldOut) throw new ConvexError(`"${it.name}"은(는) 품절이에요. 장바구니에서 삭제해주세요.`)
      priced.push({ name: m.name, price: m.price, qty: it.qty })
    }

    const total = priced.reduce((sum, it) => sum + it.price * it.qty, 0)
    const orderId = await ctx.db.insert('orders', {
      userId,
      customerName: user?.name ?? user?.email ?? '고객',
      items: priced,
      total,
      status: 'wait',
      pickupDow: slot.dow,
      pickupDateLabel: slot.dateLabel,
      pickupIso: slot.iso,
      createdAt: Date.now(),
    })
    return { orderId, pickupDateLabel: slot.dateLabel, pickupLabel: slot.label }
  },
})

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx)
  if (!userId) throw new ConvexError('로그인이 필요합니다.')
  const user = await ctx.db.get(userId)
  if (!user?.isAdmin) throw new ConvexError('관리자만 사용할 수 있습니다.')
  return userId
}

export const listAll = query({
  args: { pickupDow: v.optional(v.union(v.literal('tue'), v.literal('thu'))) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: 'UNAUTHENTICATED' as const }
    const user = await ctx.db.get(userId)
    if (!user?.isAdmin) return { ok: false as const, code: 'FORBIDDEN' as const }
    let items
    if (args.pickupDow) {
      items = await ctx.db
        .query('orders')
        .withIndex('by_pickupDow', (q) => q.eq('pickupDow', args.pickupDow!))
        .order('desc')
        .collect()
    } else {
      items = await ctx.db.query('orders').order('desc').collect()
    }
    return { ok: true as const, items }
  },
})

export const confirmPayment = mutation({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch(args.orderId, { status: 'done' })
  },
})

export const isCurrentUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return false
    const user = await ctx.db.get(userId)
    return Boolean(user?.isAdmin)
  },
})

// First signed-in user to call this becomes the admin while no admin exists.
// Afterwards existing admins add more people from the members tab below.
export const claimAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError('로그인이 필요합니다.')
    const existingAdmin = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('isAdmin'), true))
      .first()
    if (existingAdmin) {
      if (existingAdmin._id === userId) return { claimed: true }
      throw new ConvexError('이미 다른 계정이 관리자로 등록되어 있습니다. 등록된 관리자에게 "회원 관리"에서 추가해달라고 요청해주세요.')
    }
    await ctx.db.patch(userId, { isAdmin: true })
    return { claimed: true }
  },
})

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, code: 'UNAUTHENTICATED' as const }
    const me = await ctx.db.get(userId)
    if (!me?.isAdmin) return { ok: false as const, code: 'FORBIDDEN' as const }
    const users = await ctx.db.query('users').collect()
    return {
      ok: true as const,
      currentUserId: userId,
      items: users
        .map((u) => ({
          _id: u._id,
          name: u.name ?? null,
          email: u.email ?? null,
          image: u.image ?? null,
          isAdmin: Boolean(u.isAdmin),
        }))
        .sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin)),
    }
  },
})

export const setAdminStatus = mutation({
  args: { userId: v.id('users'), isAdmin: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    if (!args.isAdmin) {
      const target = await ctx.db.get(args.userId)
      if (target?.isAdmin) {
        const admins = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('isAdmin'), true))
          .collect()
        if (admins.length <= 1) {
          throw new ConvexError('마지막 남은 관리자 계정은 권한을 해제할 수 없습니다.')
        }
      }
    }
    await ctx.db.patch(args.userId, { isAdmin: args.isAdmin })
  },
})
