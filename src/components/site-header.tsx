import { Link } from '@tanstack/react-router'
import { useCart } from '@/lib/cart'
import { User, ShoppingBag, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { lastOrderTab } from '@/lib/return-to'

const NAV_LINKS = [
  { to: '/about', label: '카페소개' },
  { to: '/order', label: '마을 픽업 주문' },
  { to: '/parents', label: '학부모 주문' },
  { to: '/gifts', label: '답례품 예약' },
  { to: '/support', label: '문의사항' },
] as const satisfies readonly { to: string; label: string }[]

/** Also in the phone menu, where the header icons are easy to miss. */
const MOBILE_EXTRA_LINKS = [
  { to: '/guide', label: '이용방법' },
  { to: '/orders', label: '내 주문 · 로그인' },
] as const

/** The little three-hill mark next to the wordmark. */
export function EdenMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 70" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 62 L30 22 L50 50 L66 30 L94 62" />
      <path d="M6 62 H94" />
    </svg>
  )
}

/**
 * Low fixed bar. `overlay` (home only): see-through with white text over the
 * hero photo, turning solid once the page scrolls.
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
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
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('resize', onResize)
    }
  }, [mobileOpen])

  const clear = overlay && !scrolled && !mobileOpen

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${
          clear ? 'border-transparent bg-transparent text-white' : 'border-[#E1DBD1] bg-eden-paper text-eden-ink'
        }`}
      >
        <div className="pad relative flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={`font-logo text-[1.25rem] font-bold tracking-[-0.06em] ${clear ? 'text-white' : 'text-eden-green'}`}
            >
              이든카페
            </Link>
            <span aria-hidden className="hidden h-4 w-px bg-current opacity-30 lg:block" />
            <Link to="/" aria-label="처음 화면" className="hidden w-6 lg:flex">
              <EdenMark className="h-auto w-full" />
            </Link>
          </div>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="whitespace-nowrap border-b-2 border-transparent px-3 py-1.5 text-[0.95rem] font-medium hover:opacity-70 xl:px-3.5"
                activeProps={{ className: '!border-current font-bold' }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Icons carry a word beside them: not everyone reads a person icon as 내 주문. */}
          <div className="flex items-center gap-1 md:gap-2">
            <Link to="/orders" className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-1.5 text-[0.9rem] font-medium hover:underline hover:underline-offset-[5px]">
              <User size={18} strokeWidth={1.7} />
              <span>내 주문</span>
            </Link>
            <Link to={cartTab} className="relative inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-1.5 text-[0.9rem] font-medium hover:underline hover:underline-offset-[5px]">
              <ShoppingBag size={18} strokeWidth={1.7} />
              <span>담은 빵</span>
              {totalQty > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-eden-accent px-1 text-[11px] font-bold text-white">
                  {totalQty > 99 ? '99+' : totalQty}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[0.9rem] font-medium lg:hidden"
            >
              {mobileOpen ? <X size={20} strokeWidth={1.7} /> : <Menu size={20} strokeWidth={1.7} />}
              <span className="hidden sm:inline">{mobileOpen ? '닫기' : '메뉴'}</span>
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        <div
          className={`overflow-hidden border-t border-eden-line bg-eden-paper text-eden-ink transition-[max-height,opacity] duration-300 ease-out lg:hidden ${
            mobileOpen ? 'max-h-[30rem] opacity-100' : 'invisible max-h-0 border-transparent opacity-0'
          }`}
        >
          <nav className="pad flex flex-col py-2">
            {[...NAV_LINKS, ...MOBILE_EXTRA_LINKS].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="border-b border-eden-line py-4 font-serif text-lg last:border-b-0 hover:text-eden-accent"
                activeProps={{ className: 'text-eden-accent' }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {/* The bar is fixed, so other pages keep their content below it. */}
      {overlay ? null : <div aria-hidden className="h-16" />}
    </>
  )
}
