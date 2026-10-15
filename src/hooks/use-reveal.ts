import { useEffect, useRef, useState } from 'react'

/** Where the element is relative to the viewport. */
export type RevealState = 'visible' | 'below' | 'above'

// One shared listener remembers which way the page last scrolled.
let lastScrollY = 0
let scrollingUp = false
let listening = false
function trackScrollDirection() {
  if (listening || typeof window === 'undefined') return
  listening = true
  lastScrollY = window.scrollY
  window.addEventListener('scroll', () => {
    const y = window.scrollY
    if (y !== lastScrollY) scrollingUp = y < lastScrollY
    lastScrollY = y
  }, { passive: true })
}

/**
 * Tracks whether the attached element is in view, every time it enters or
 * leaves. Content scrolled past (above the viewport) and content not yet
 * reached (below it) sit offset in their own direction, so the reveal
 * animation plays naturally whether the visitor scrolls down or back up.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [state, setState] = useState<RevealState>('below')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect users who've asked for reduced motion: show immediately.
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('visible')
      return
    }

    trackScrollDirection()
    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        cancelAnimationFrame(frame)
        if (!entry.isIntersecting) {
          setState(entry.boundingClientRect.top < 0 ? 'above' : 'below')
          return
        }
        // A fast scroll or jump can skip the "left the viewport" callback, so
        // first park the element on the side it's entering from (above when
        // scrolling up), then reveal it on the next frames.
        const from: RevealState = scrollingUp ? 'above' : 'below'
        setState((prev) => (prev === 'visible' ? prev : from))
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => setState('visible'))
        })
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [threshold])

  return { ref, state, visible: state === 'visible' }
}
