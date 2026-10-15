import { Phone } from 'lucide-react'
import { useContentValue, useSiteContent } from '@/lib/site-content'

/** The cafe phone number (admin → 글귀 · 이미지 → 연락처). */
export function useCafePhone(): { label: string; href: string | null } {
  const label = useContentValue(useSiteContent(), 'contact.phone')
  const digits = label.replace(/[^0-9]/g, '')
  // Placeholders like 010-XXXX-XXXX have too few digits to dial.
  return { label, href: digits.length >= 9 ? `tel:${digits}` : null }
}

/** A large "전화하기" button; falls back to plain text until a real number is set. */
export function CallButton({ className = '', children = '전화하기' }: { className?: string; children?: React.ReactNode }) {
  const { label, href } = useCafePhone()
  const inner = (
    <>
      <Phone size={18} />
      <span>
        {children} <span className="font-normal opacity-80">{label}</span>
      </span>
    </>
  )
  const base = `inline-flex items-center justify-center gap-2 rounded-full border border-eden-line px-5 py-3 text-base font-semibold ${className}`
  return href ? (
    <a href={href} className={`${base} hover:border-eden-ink`}>
      {inner}
    </a>
  ) : (
    <span className={base}>{inner}</span>
  )
}
