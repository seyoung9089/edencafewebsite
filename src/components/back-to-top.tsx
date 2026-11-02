import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { ArrowUp } from 'lucide-react'

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  // /order has a fixed order bar at the bottom on small screens; sit above it.
  const onOrder = useRouterState({ select: (state) => state.location.pathname === '/order' })

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
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="맨 위로 이동"
      className={`fixed right-6 z-50 ${onOrder ? 'bottom-24 lg:bottom-6' : 'bottom-6'} flex h-11 w-11 items-center justify-center rounded-full bg-eden-ink text-eden-paper shadow-[0_10px_24px_-8px_rgba(14,27,22,0.5)] transition-all duration-300 hover:bg-eden-ink-2 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <ArrowUp size={18} strokeWidth={1.8} />
    </button>
  )
}
