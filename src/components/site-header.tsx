import { Link } from '@tanstack/react-router'
import { useCart } from '@/lib/cart'
import { User, ShoppingBag, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { lastOrderTab } from '@/lib/return-to'

const NAV_LINKS = [
  { to: '/about', label: '카페소개' },
  { to: '/order', label: '마을 픽업 주문' },
  { to: '/parents', label: '학부모 주문' },
  { to: '/support', label: '문의사항' },
] as const

/** Also in the phone menu, where the header icons are easy to miss. */
const MOBILE_EXTRA_LINKS = [
  { to: '/guide', label: '이용방법' },
  { to: '/orders', label: '내 주문 · 로그인' },
] as const

export function SiteHeader() {
  const { totalQty } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  // The bag opens the order tab the customer was using.
  const [cartTab, setCartTab] = useState<'/order' | '/parents'>('/order')
  useEffect(() => setCartTab(lastOrderTab()), [totalQty])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll while the mobile menu is open, and close it if the
  // viewport is resized past the mobile breakpoint.
  useEffect(() => {
    if (!mobileOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('resize', onResize)
    }
  }, [mobileOpen])

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-eden-paper backdrop-blur transition-all duration-300 ${
        scrolled ? 'border-transparent shadow-soft' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-[78px] max-w-6xl items-center justify-between px-6 md:px-8">
        <Link to="/" className="flex items-baseline gap-2 font-logo text-xl font-bold text-eden-ink" onClick={() => setMobileOpen(false)}>
          이든카페
          <span className="font-sans text-[10px] font-normal tracking-[0.16em] text-eden-sage-dim">EDEN CAFE</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium text-eden-ink md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-full px-4 py-2 hover:bg-eden-paper-dim" activeProps={{ className: 'bg-eden-paper-dim' }}>{l.label}</Link>
          ))}
        </nav>
        {/* Icons carry a word underneath: not everyone reads a person icon as 내 주문. */}
        <div className="flex items-center gap-3 md:gap-4">
          <Link to="/orders" className="flex flex-col items-center gap-0.5 text-eden-ink hover:text-eden-sand">
            <User size={20} strokeWidth={1.6} />
            <span className="text-[11px] font-medium leading-none">내 주문</span>
          </Link>
          <Link to={cartTab} className="relative flex flex-col items-center gap-0.5 text-eden-ink hover:text-eden-sand">
            <ShoppingBag size={20} strokeWidth={1.6} />
            <span className="text-[11px] font-medium leading-none">담은 빵</span>
            {totalQty > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-eden-sand px-1 text-[10px] font-bold text-eden-ink-2">
                {totalQty > 99 ? '99+' : totalQty}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="text-eden-ink hover:text-eden-sand md:hidden"
          >
            <span className="flex flex-col items-center gap-0.5">
              {mobileOpen ? <X size={20} strokeWidth={1.6} /> : <Menu size={20} strokeWidth={1.6} />}
              <span className="text-[11px] font-medium leading-none">{mobileOpen ? '닫기' : '메뉴'}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      <div
        className={`overflow-hidden border-t border-eden-line bg-eden-paper transition-[max-height,opacity] duration-300 ease-out md:hidden ${
          mobileOpen ? 'max-h-[28rem] opacity-100' : 'invisible max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col px-6 py-2">
          {[...NAV_LINKS, ...MOBILE_EXTRA_LINKS].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="border-b border-eden-line py-4 text-base text-eden-ink last:border-b-0 hover:text-eden-sand"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
