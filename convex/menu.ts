import { v, ConvexError } from 'convex/values'
import { mutation, query, internalMutation } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

const categoryValidator = v.union(v.literal('bakery'), v.literal('drink'))

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx)
  if (!userId) throw new ConvexError('로그인이 필요합니다.')
  const user = await ctx.db.get(userId)
  if (!user?.isAdmin) throw new ConvexError('관리자만 사용할 수 있습니다.')
  return userId
}

function validatePrice(price: number) {
  if (!Number.isInteger(price) || price < 0) throw new ConvexError('가격은 0 이상의 정수로 입력해주세요.')
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query('menuItems').collect()
    items.sort((a, b) =>
      a.category === b.category ? a.sortOrder - b.sortOrder : a.category.localeCompare(b.category),
    )
    return await Promise.all(
      items.map(async (item) => ({
        ...item,
        imageUrl: item.imageId ? await ctx.storage.getUrl(item.imageId) : null,
      })),
    )
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const create = mutation({
  args: {
    category: categoryValidator,
    name: v.string(),
    description: v.string(),
    price: v.number(),
    imageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const name = args.name.trim()
    if (!name) throw new ConvexError('메뉴 이름을 입력해주세요.')
    validatePrice(args.price)
    const all = await ctx.db.query('menuItems').collect()
    if (all.some((i) => i.name === name)) throw new ConvexError('같은 이름의 메뉴가 이미 있습니다.')
    const sortOrder =
      Math.max(0, ...all.filter((i) => i.category === args.category).map((i) => i.sortOrder)) + 1
    await ctx.db.insert('menuItems', {
      category: args.category,
      name,
      description: args.description.trim(),
      price: args.price,
      imageId: args.imageId,
      sortOrder,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('menuItems'),
    category: categoryValidator,
    name: v.string(),
    description: v.string(),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const item = await ctx.db.get(args.id)
    if (!item) throw new ConvexError('메뉴를 찾을 수 없습니다.')
    const name = args.name.trim()
    if (!name) throw new ConvexError('메뉴 이름을 입력해주세요.')
    validatePrice(args.price)
    const all = await ctx.db.query('menuItems').collect()
    if (all.some((i) => i._id !== args.id && i.name === name)) {
      throw new ConvexError('같은 이름의 메뉴가 이미 있습니다.')
    }
    let sortOrder = item.sortOrder
    if (item.category !== args.category) {
      sortOrder = Math.max(0, ...all.filter((i) => i.category === args.category).map((i) => i.sortOrder)) + 1
    }
    await ctx.db.patch(args.id, {
      category: args.category,
      name,
      description: args.description.trim(),
      price: args.price,
      sortOrder,
    })
  },
})

// Pass imageId to set/replace the photo, or null to remove it.
export const setImage = mutation({
  args: { id: v.id('menuItems'), imageId: v.union(v.id('_storage'), v.null()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const item = await ctx.db.get(args.id)
    if (!item) throw new ConvexError('메뉴를 찾을 수 없습니다.')
    if (item.imageId && item.imageId !== args.imageId) {
      await ctx.storage.delete(item.imageId)
    }
    await ctx.db.patch(args.id, { imageId: args.imageId ?? undefined })
  },
})

export const remove = mutation({
  args: { id: v.id('menuItems') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const item = await ctx.db.get(args.id)
    if (!item) return
    if (item.imageId) await ctx.storage.delete(item.imageId)
    await ctx.db.delete(args.id)
  },
})

export const toggleSoldOut = mutation({
  args: { id: v.id('menuItems') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const item = await ctx.db.get(args.id)
    if (!item) throw new ConvexError('메뉴를 찾을 수 없습니다.')
    await ctx.db.patch(args.id, { soldOut: !item.soldOut })
  },
})

export const seedIfEmpty = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('menuItems').first()
    if (existing) return
    const items = [
      { category: 'bakery' as const, name: '단호박 크림빵', description: '국내산 단호박과 유기농 밀가루로 만든 부드러운 크림빵', price: 4500, sortOrder: 1 },
      { category: 'bakery' as const, name: '통밀 캄파뉴', description: '통밀을 넉넉히 담아 은은한 풍미가 나는 담백한 빵', price: 6000, sortOrder: 2 },
      { category: 'bakery' as const, name: '이든 소금빵', description: '겉은 바삭, 속은 촉촉한 이든의 데일리 소금빵', price: 4000, sortOrder: 3 },
      { category: 'bakery' as const, name: '제철 과일 스콘', description: '그 계절 가장 좋은 과일을 넣어 굽는 스콘', price: 4800, sortOrder: 4 },
      { category: 'drink' as const, name: '이든 시그니처 라떼', description: '단호박과 에스프레소, 이든에서만 만나는 조합', price: 4800, sortOrder: 1 },
      { category: 'drink' as const, name: '오늘의 드립커피', description: '매일 아침 새로 내리는 핸드드립 한 잔', price: 4300, sortOrder: 2 },
      { category: 'drink' as const, name: '이든 아메리카노', description: '에스프레소 원두 본연의 맛을 살린 아메리카노', price: 3500, sortOrder: 3 },
      { category: 'drink' as const, name: '아인슈페너', description: '진한 에스프레소 위에 부드러운 크림을 올린 한 잔', price: 5000, sortOrder: 4 },
      { category: 'drink' as const, name: '카페모카', description: '달콤한 초콜릿과 에스프레소의 조화', price: 5000, sortOrder: 5 },
      { category: 'drink' as const, name: '카모마일 티', description: '유기농 카모마일 잎으로 우린 편안한 차 한 잔', price: 4000, sortOrder: 6 },
    ]
    for (const item of items) {
      await ctx.db.insert('menuItems', item)
    }
  },
})
