import type { ReactNode } from 'react'
import { useReveal } from '@/hooks/use-reveal'

interface RevealProps {
  children: ReactNode
  className?: string
  /** ms of extra delay, useful for staggering a list of cards */
  delay?: number
}

export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const { ref, state } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={`reveal ${state === 'visible' ? 'is-visible' : state === 'above' ? 'is-above' : ''} ${className}`}
      // Stagger only on the way in; leaving happens all at once.
      style={delay && state === 'visible' ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
