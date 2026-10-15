import { useEffect, useRef, useState } from 'react'

/** Whether the element has been revealed yet. */
export type RevealState = 'visible' | 'below'

/**
 * Reveals the attached element with a short fade the first time it scrolls
 * into view, then leaves it in place. Content never disappears again when
 * the visitor scrolls back, which is easier to follow for older visitors.
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

    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        // Wait a frame so the hidden starting style paints before the fade.
        frame = requestAnimationFrame(() => setState('visible'))
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
