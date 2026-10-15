// Logo mark options shown next to the "이든카페" wordmark.
// Lines use currentColor so a mark follows the text colour (dark in the
// header, light in the footer); accents use the Eden sand colour.

const SAND = 'hsl(var(--eden-sand))'
const SAGE_DIM = 'hsl(var(--eden-sage-dim))'

type MarkProps = { size?: number; className?: string }

/** A: the cabin under the hills from the home page illustration. */
function CabinMark({ size = 28, className }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path d="M2 23 9.5 12l5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 27v-8.5L20 12l7 6.5V27z" fill={SAND} />
      <rect x="18" y="21" width="4" height="6" rx="1" fill="currentColor" />
      <path d="M2 27h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** B: a cup with a sprout growing out of it. */
function SproutCupMark({ size = 28, className }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path d="M6 15h17v5a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M23 17h1.5a3 3 0 0 1 0 6H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14.5 15V9" stroke={SAND} strokeWidth="2" strokeLinecap="round" />
      <path d="M14.5 10c0-3.6 2.7-6 6.5-6 0 3.8-2.7 6-6.5 6z" fill={SAND} />
      <path d="M14.5 11.5c0-3-2.3-5-5.5-5 0 3.1 2.2 5 5.5 5z" fill={SAND} />
    </svg>
  )
}

/** C: a round badge with a single leaf. */
function LeafBadgeMark({ size = 28, className }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <circle cx="16" cy="16" r="15" fill={SAGE_DIM} />
      <path d="M8.5 23.5C8.5 14.5 14.5 8.5 24 8.5c0 9.5-6 15-15.5 15z" fill={SAND} />
      <path d="M9 23 19 13" stroke={SAGE_DIM} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** D: a garden-gate arch with an E inside. */
function GardenGateMark({ size = 28, className }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path d="M5 29V15a11 11 0 0 1 22 0v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13.5h8M12 13.5v11M12 19h6M12 24.5h8" stroke={SAND} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export const LOGO_MARKS = [
  { id: 'cabin', label: 'A. 언덕 위 오두막', note: '홈 화면 그림 속 오두막과 언덕을 단순하게', Mark: CabinMark },
  { id: 'sprout-cup', label: 'B. 새싹 잔', note: '커피잔에서 새싹이 자라는 모양 · 에덴(정원) + 카페', Mark: SproutCupMark },
  { id: 'leaf-badge', label: 'C. 잎사귀 배지', note: '초록 원 안의 잎사귀 하나 · 작게 써도 또렷해요', Mark: LeafBadgeMark },
  { id: 'garden-gate', label: 'D. 정원 아치 E', note: '정원 입구 아치 안에 EDEN의 E', Mark: GardenGateMark },
] as const
