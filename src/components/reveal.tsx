import type { ReactNode } from 'react'
import { useReveal } from '@/hooks/use-reveal'

interface RevealProps {
  children: ReactNode
  className?: string
  /** ms of extra delay, useful for staggering a list of cards */
  delay?: number
}

export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
