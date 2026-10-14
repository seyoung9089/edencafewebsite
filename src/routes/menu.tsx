import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PickupNotice } from '@/components/pickup-notice'
import { useCart } from '@/lib/cart'
import { pageMeta } from '@/lib/seo'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Minus, Plus, Croissant, Coffee } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/menu')({ component: MenuPage, head: () => pageMeta('/menu') })

type MenuItem = {
  _id: string
  category: 'bakery' | 'drink'
  name: string
  description: string
  price: number
  soldOut?: boolean
  imageUrl: string | null
}

function MenuPage() {
  const items = useQuery(api.menu.list)
  const { addItem } = useCart()
  const [active, setActive] = useState<MenuItem | null>(null)
  const [qty, setQty] = useState(1)
  const [catalog, setCatalog] = useState<Map<string, { price: number; sold_out: boolean }> | null>(null)
  useEffect(() => {
    void supabase.from('menu_catalog').select('name,price,sold_out').then(({ data }) => {
      if (data) setCatalog(new Map(data.map(row => [row.name, { price: row.price, sold_out: row.sold_out }])))
    })
  }, [])

  const openModal = (item: MenuItem) => {
    setActive(item)
    setQty(1)
  }

  const confirmAdd = () => {
    if (!active) return
    addItem({ name: active.name, price: active.price, qty })
    toast.success(`${active.name} ${qty}개를 장바구니에 담았습니다.`)
    setActive(null)
  }

  const displayItems = items?.map(i => {
    const current = catalog?.get(i.name)
    return { ...i, price: current?.price ?? i.price, soldOut: Boolean(i.soldOut || current?.sold_out), orderReady: !catalog || Boolean(current) }
  }) ?? []
  const bakery = displayItems.filter((i) => i.category === 'bakery')
  const drinks = displayItems.filter((i) => i.category === 'drink')

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

      {[
        { label: '베이커리', list: bakery, Icon: Croissant },
        { label: '음료', list: drinks, Icon: Coffee },
      ].map((group) => (
        <section key={group.label} className="mx-auto max-w-6xl px-6 py-10 md:px-8">
          <h2 className="mb-6 border-b border-eden-line pb-4 font-serif text-xl font-semibold">{group.label}</h2>
          {items && group.list.length === 0 ? (
            <p className="text-sm text-eden-sage-dim">등록된 메뉴가 없습니다.</p>
          ) : null}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {group.list.map((item) => (
              <div key={item._id} className="rounded-card bg-eden-paper-dim shadow-soft p-6 hover:-translate-y-1 hover:shadow-lift">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="mb-4 aspect-[4/3] w-full rounded-[10px] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <group.Icon size={36} strokeWidth={1.5} className="mb-4 text-eden-sage-dim" />
                )}
                <h3 className="mb-1 font-serif text-base font-semibold">{item.name}</h3>
                <p className="mb-4 min-h-[36px] text-xs text-eden-sage-dim">{item.description}</p>
                <div className="mb-4 font-serif text-base font-semibold text-eden-sand">
                  {item.price.toLocaleString('ko-KR')}원
                </div>
                {item.soldOut || !item.orderReady ? (
                  <span className="block w-full rounded-full border border-eden-line py-2 text-center text-xs text-eden-sage-dim">
                    {item.soldOut ? '품절' : '주문 준비 중'}
                  </span>
                ) : (
                  <button
                    onClick={() => openModal(item)}
                    className="w-full rounded-full bg-eden-ink py-2 text-xs font-semibold text-eden-paper hover:bg-eden-sand hover:text-eden-ink-2"
                  >
                    담기 +
                  </button>
                )}
              </div>
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
              onClick={() => setQty((q) => Math.min(20, q + 1))}
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
