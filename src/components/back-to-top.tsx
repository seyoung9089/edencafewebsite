import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowUp, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { lastOrderTab } from '@/lib/return-to'

/**
 * Bottom-right dock: a card for bread still in the cart (away from the order
 * pages), and the 맨 위로 button once the page has scrolled.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  // The order pages have a fixed order bar at the bottom on small screens.
  const onOrder = pathname === '/order' || pathname === '/parents' || pathname === '/gifts'
  const { totalQty, totalPrice } = useCart()
  const [cartTab, setCartTab] = useState<'/order' | '/parents'>('/order')
  useEffect(() => setCartTab(lastOrderTab()), [totalQty])
  const showCart = totalQty > 0 && !onOrder && pathname !== '/admin'

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToTop() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(260px,calc(100vw-32px))] flex-col items-end gap-2">
      {/* On a phone the order bar already fills the bottom; a second floating button there covers the page. */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="맨 위로 이동"
        className={`flex h-11 w-11 items-center justify-center rounded-[3px] bg-eden-accent text-white shadow-lift transition-all duration-300 hover:bg-eden-accent-d ${onOrder ? 'max-lg:hidden' : ''} ${
          visible ? 'pointer-events-auto translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp size={18} strokeWidth={1.8} />
      </button>
      {showCart ? (
        <Link
          to={cartTab}
          className="pointer-events-auto flex w-full items-center gap-3 rounded-[6px] border border-eden-line bg-white px-3 py-2.5 text-left shadow-lift transition-transform duration-200 hover:-translate-y-[3px]"
        >
          <span className="grid h-11 w-11 flex-none place-items-center rounded-[4px] bg-eden-accent text-white">
            <ShoppingBag size={20} strokeWidth={1.7} />
          </span>
          <span className="min-w-0">
            <b className="block text-[0.85rem] tracking-[0.05em] text-eden-accent">담은 빵 {totalQty}개</b>
            <span className="block truncate text-[0.95rem]">{totalPrice.toLocaleString('ko-KR')}원 · 주문 이어 하기</span>
          </span>
        </Link>
      ) : null}
    </div>
  )
}
