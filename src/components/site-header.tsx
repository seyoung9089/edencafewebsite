import { Link } from '@tanstack/react-router'
import { useCart } from '@/lib/cart'
import { User, ShoppingBag, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { to: '/about', label: '카페소개' },
  { to: '/order', label: '마을 픽업 주문' },
  { to: '/parents', label: '학부모 주문' },
  // 답례품 is a side service: same shape as the others, quieter colour.
  { to: '/gifts', label: '답례품 예약', quiet: true },
  { to: '/support', label: '문의사항' },
] as const satisfies readonly { to: string; label: string; quiet?: boolean }[]

const isQuiet = (l: (typeof NAV_LINKS)[number]) => 'quiet' in l && l.quiet

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
        scrolled ? 'border-transparent shadow-soft' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-[78px] max-w-6xl items-center justify-between px-6 md:px-8">
        <Link to="/" className="flex shrink-0 items-baseline gap-2 font-logo text-xl font-bold text-eden-ink" onClick={() => setMobileOpen(false)}>
          이든카페
          <span className="font-sans text-[10px] font-normal tracking-[0.16em] text-eden-sage-dim md:hidden lg:inline">EDEN CAFE</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium text-eden-ink md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={`whitespace-nowrap rounded-full px-2.5 py-2 hover:bg-eden-paper-dim lg:px-4 ${isQuiet(l) ? 'text-eden-sage-dim' : ''}`} activeProps={{ className: 'bg-eden-paper-dim' }}>{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/orders" aria-label="내 주문" className="text-eden-ink hover:text-eden-sand">
            <User size={19} strokeWidth={1.6} />
          </Link>
          <Link to="/order" aria-label="주문 내역 보기" className="relative text-eden-ink hover:text-eden-sand">
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
              className={`border-b border-eden-line py-3.5 text-[15px] last:border-b-0 hover:text-eden-sand ${isQuiet(l) ? 'text-eden-sage-dim' : 'text-eden-ink'}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
