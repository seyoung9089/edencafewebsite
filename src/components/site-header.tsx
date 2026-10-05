import { Link } from '@tanstack/react-router'
import { useCart } from '@/lib/cart'
import { User, ShoppingBag, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { to: '/about', label: '카페소개' },
  { to: '/menu', label: '메뉴' },
  { to: '/history', label: '히스토리' },
  { to: '/news', label: '새소식' },
  { to: '/support', label: '문의' },
]

export function SiteHeader() {
  const { totalQty } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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
        scrolled ? 'border-eden-line shadow-[0_2px_16px_-4px_rgba(14,27,22,0.18)]' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-[78px] max-w-6xl items-center justify-between px-6 md:px-8">
        <Link to="/" className="flex items-baseline gap-2 font-serif text-xl font-semibold text-eden-ink" onClick={() => setMobileOpen(false)}>
          이든카페
          <span className="font-sans text-[10px] font-normal tracking-[0.16em] text-eden-sage-dim">EDEN CAFE</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-eden-ink md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-eden-sand">{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/orders" aria-label="내 주문" className="text-eden-ink hover:text-eden-sand">
            <User size={19} strokeWidth={1.6} />
          </Link>
          <Link to="/cart" aria-label="장바구니" className="relative text-eden-ink hover:text-eden-sand">
            <ShoppingBag size={19} strokeWidth={1.6} />
            {totalQty > 0 ? (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-eden-sand px-1 text-[10px] font-bold text-eden-ink-2">
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
            {mobileOpen ? <X size={22} strokeWidth={1.6} /> : <Menu size={22} strokeWidth={1.6} />}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      <div
        className={`overflow-hidden border-t border-eden-line bg-eden-paper transition-[max-height,opacity] duration-300 ease-out md:hidden ${
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col px-6 py-2">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="border-b border-eden-line py-3.5 text-[15px] text-eden-ink last:border-b-0 hover:text-eden-sand"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
