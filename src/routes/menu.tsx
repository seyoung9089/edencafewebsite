import { createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PickupNotice } from '@/components/pickup-notice'
import { useCart } from '@/lib/cart'
import { pageMeta } from '@/lib/seo'
import { useEffect, useState } from 'react'
import { useMenu, isSoldOut, fetchPopularity, type MenuItem } from '@/lib/menu'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Minus, Plus, Croissant, Coffee, Flame } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/menu')({ component: MenuPage, head: () => pageMeta('/menu') })

const CATEGORY_ICON = { bakery: Croissant, drink: Coffee } as const

/** Number of items shown in the "인기 메뉴" shelf at the top. */
const POPULAR_COUNT = 4

function MenuCard({ item, popular, onOrder }: { item: MenuItem; popular?: boolean; onOrder: (item: MenuItem) => void }) {
  const Icon = CATEGORY_ICON[item.category]
  const soldOut = item.category === 'bakery' && isSoldOut(item)
  return (
    <div className="rounded-card bg-eden-paper-dim shadow-soft p-6 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative mb-4">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className={`aspect-[4/3] w-full rounded-[10px] object-cover ${soldOut ? 'grayscale opacity-50' : ''}`}
            loading="lazy"
          />
        ) : (
          <Icon size={36} strokeWidth={1.5} className={`text-eden-sage-dim ${soldOut ? 'opacity-50' : ''}`} />
        )}
        {popular ? (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-eden-sand px-3 py-1 text-xs font-semibold text-eden-ink-2">
            <Flame size={12} strokeWidth={2} /> 인기
          </span>
        ) : null}
        {soldOut ? (
          <span className="absolute left-2 top-2 rounded-full bg-eden-ink-2/90 px-3 py-1 text-xs font-semibold text-eden-paper">
            품절
          </span>
        ) : null}
      </div>
      <h3 className="mb-1 font-serif text-base font-semibold">{item.name}</h3>
      <p className="mb-4 min-h-[36px] text-xs text-eden-sage-dim">{item.description}</p>
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <span className="font-serif text-base font-semibold text-eden-sand">{item.price.toLocaleString('ko-KR')}원</span>
        {item.stock !== null && item.stock > 0 ? (
          <span className="text-xs text-eden-sage-dim">남은 수량 {item.stock}개</span>
        ) : null}
      </div>
      {item.category === 'drink' ? (
        <span className="block w-full rounded-full border border-eden-line py-2 text-center text-xs text-eden-sage-dim">
          매장에서만 주문 가능
        </span>
      ) : soldOut ? (
        <span className="block w-full rounded-full border border-eden-line py-2 text-center text-xs text-eden-sage-dim">
          품절
        </span>
      ) : (
        <button
          onClick={() => onOrder(item)}
          className="w-full rounded-full bg-eden-ink py-2 text-xs font-semibold text-eden-paper hover:bg-eden-sand hover:text-eden-ink-2"
        >
          담기 +
        </button>
      )}
    </div>
  )
}

function MenuPage() {
  const { items } = useMenu()
  const { addItem } = useCart()
  const [active, setActive] = useState<MenuItem | null>(null)
  const [qty, setQty] = useState(1)
  const [popularity, setPopularity] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    let alive = true
    fetchPopularity()
      .then((m) => alive && setPopularity(m))
      .catch(() => {
        /* popularity shelf is a nice-to-have; fail quietly */
      })
    return () => {
      alive = false
    }
  }, [])

  const openModal = (item: MenuItem) => {
    if (item.category !== 'bakery') return
    setActive(item)
    setQty(1)
  }

  const confirmAdd = () => {
    if (!active || active.category !== 'bakery') return
    addItem({ name: active.name, price: active.price, qty })
    toast.success(`${active.name} ${qty}개를 장바구니에 담았습니다.`)
    setActive(null)
  }

  const bakery = items?.filter((i) => i.category === 'bakery') ?? []
  const drinks = items?.filter((i) => i.category === 'drink') ?? []
  const popular = (items ?? [])
    .filter((i) => (popularity.get(i.name) ?? 0) > 0)
    .sort((a, b) => (popularity.get(b.name) ?? 0) - (popularity.get(a.name) ?? 0))
    .slice(0, POPULAR_COUNT)

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <section className="px-6 pb-6 pt-14 md:px-8">
        <h1 className="mb-3 font-serif text-3xl font-semibold">전체 메뉴</h1>
        <p className="mb-6 text-[15px] text-eden-sage-dim">이든의 베이커리실과 바에서 만나는 모든 메뉴입니다.</p>
        <div className="max-w-xl">
          <PickupNotice />
        </div>
      </section>

      {popular.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 pt-10 md:px-8">
          <h2 className="mb-6 flex items-center gap-2 border-b border-eden-line pb-4 font-serif text-xl font-semibold">
            <Flame size={20} strokeWidth={2} className="text-eden-sand" /> 인기 메뉴
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((item) => (
              <MenuCard key={item.name} item={item} popular onOrder={openModal} />
            ))}
          </div>
        </section>
      ) : null}

      {[
        { label: '베이커리', list: bakery },
        { label: '음료', list: drinks },
      ].map((group) => (
        <section key={group.label} className="mx-auto max-w-6xl px-6 py-10 md:px-8">
          <h2 className="mb-6 border-b border-eden-line pb-4 font-serif text-xl font-semibold">{group.label}</h2>
          {items && group.list.length === 0 ? (
            <p className="text-sm text-eden-sage-dim">등록된 메뉴가 없습니다.</p>
          ) : null}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {group.list.map((item) => (
              <MenuCard key={item.name} item={item} onOrder={openModal} />
            ))}
          </div>
        </section>
      ))}

      <SiteFooter />

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-[360px] rounded-card bg-eden-paper">
          <DialogTitle className="font-serif text-lg">{active?.name}</DialogTitle>
          <p className="text-sm text-eden-sage-dim">{active ? `${active.price.toLocaleString('ko-KR')}원 / 1개` : ''}</p>
          <div className="my-4 flex items-center gap-6">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-eden-line hover:bg-eden-paper-dim"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-6 text-center text-base font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(active?.stock ?? 20, 20, q + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-eden-line hover:bg-eden-paper-dim"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="mb-5 font-serif text-base font-semibold">
            합계 <span className="text-eden-sand">{active ? (active.price * qty).toLocaleString('ko-KR') : 0}원</span>
          </div>
          <button onClick={confirmAdd} className="w-full bg-eden-ink py-3 text-sm font-semibold text-eden-paper rounded-full transition-colors hover:bg-eden-ink-2">
            장바구니에 담기
          </button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
