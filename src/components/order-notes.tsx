import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'

type Audience = 'village' | 'parents' | 'gift'

/**
 * Everything worth knowing before ordering, folded into one "주문 전 확인 사항"
 * so the order page itself only shows what the next choice needs. The full
 * rules live on /guide, linked at the bottom.
 */
export function OrderNotes({
  audience,
  bulkMessage,
  studentDepositNote,
  giftMaxQty,
  className = '',
}: {
  audience: Audience
  bulkMessage: string
  studentDepositNote: string
  giftMaxQty: number
  className?: string
}) {
  const notes: React.ReactNode[] =
    audience === 'parents'
      ? [
          '금요일 픽업은 그 주 수요일 밤 11시 59분까지 주문할 수 있습니다.',
          '학생이 하교할 때 이름으로 빵을 찾아가므로, 주문할 때 학생 이름을 꼭 적어 주시기 바랍니다.',
          `결제는 계좌이체나 현장결제 중에 고를 수 있습니다. 계좌이체는 ${studentDepositNote}`,
          '입금이 확인되기 전(현장결제는 준비가 시작되기 전)까지 내 주문에서 직접 취소할 수 있습니다.',
        ]
      : audience === 'gift'
        ? [
            '픽업 2일 전 밤 11시 59분까지 예약할 수 있습니다.',
            <>
              답례품은 빵 주문과 따로 담깁니다. 빵은{' '}
              <Link to="/order" className="font-semibold underline underline-offset-4">
                마을 픽업 주문
              </Link>
              에서 주문하시면 됩니다.
            </>,
            `한 번에 답례품마다 ${giftMaxQty}개까지 예약할 수 있습니다. 포장 문구 같은 요청은 요청사항 칸에 적으시면 됩니다.`,
            '결제는 계좌이체입니다. 입금이 확인되기 전까지 내 주문에서 직접 취소할 수 있습니다.',
          ]
        : [
            '픽업 2일 전 밤 11시 59분까지 주문할 수 있습니다.',
            '금요일은 메뉴가 다릅니다. 날짜를 고르면 그날 메뉴가 나옵니다.',
            bulkMessage,
            '음료는 매장에서만 주문할 수 있습니다.',
            '결제는 계좌이체입니다. 입금이 확인되기 전까지 내 주문에서 직접 취소할 수 있습니다.',
            <>
              학생이 금요일에 찾아갈 빵은{' '}
              <Link to="/parents" className="font-semibold underline underline-offset-4">
                학부모 주문
              </Link>
              에서 주문하시면 됩니다.
            </>,
          ]
  return (
    <details className={`group rounded-card border border-eden-line bg-white ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        주문 전 확인 사항
        <ChevronDown size={18} className="shrink-0 text-eden-mute transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-eden-line px-4 pb-4 pt-3">
        <ul className="space-y-2 text-sm leading-relaxed">
          {notes.map((note, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-eden-mute" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
        <Link to="/guide" className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">
          자세한 이용방법 보기 →
        </Link>
      </div>
    </details>
  )
}
