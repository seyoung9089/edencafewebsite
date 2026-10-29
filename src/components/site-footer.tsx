import { Link } from '@tanstack/react-router'
import { Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import { EdenMark } from '@/components/site-header'
import { isPlaceholder, useContentValue, useSiteContent } from '@/lib/site-content'

export function SiteFooter() {
  const content = useSiteContent()
  // Same values as 카페소개 → 오시는 길 (admin → 글귀 · 이미지); sample text stays hidden.
  const phone = useContentValue(content, 'location.phone').replace(/^담당 연락처\s*·\s*/, '')
  const addr = useContentValue(content, 'location.addr')
  const pickupTime = useContentValue(content, 'pickup.time')

  const cell = 'min-w-0'
  const label = 'mb-1.5 flex items-center gap-1.5 text-[0.8rem] font-medium tracking-[0.14em] text-eden-mute'
  const value = 'text-[1.05rem] [overflow-wrap:anywhere]'

  return (
    <footer className="pad border-t border-eden-line bg-eden-paper pb-10 pt-16 text-eden-ink">
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-b border-eden-line pb-10 md:grid-cols-4">
        <div className={cell}>
          <b className={label}><Phone size={15} strokeWidth={1.7} /> 전화</b>
          <span className={value}>{isPlaceholder(phone) ? '준비 중이에요' : phone}</span>
        </div>
        <div className={cell}>
          <b className={label}><MapPin size={15} strokeWidth={1.7} /> 주소</b>
          <span className={value}>{isPlaceholder(addr) ? '별무리마을 이든카페' : addr}</span>
        </div>
        <div className={cell}>
          <b className={label}><Clock size={15} strokeWidth={1.7} /> 픽업</b>
          <span className={value}>월~금{pickupTime ? ` · ${pickupTime}` : ''}</span>
        </div>
        <div className={cell}>
          <b className={label}><MessageCircle size={15} strokeWidth={1.7} /> 문의</b>
          <Link to="/support" hash="inquiry" className={`${value} underline underline-offset-4 hover:text-eden-accent`}>문의 남기기</Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-[0.85rem] text-eden-mute">
        <span className="flex items-center gap-3">
          <EdenMark className="h-auto w-6 text-eden-ink" />
          ⓒ 2026 이든 협동조합 · Since 2021
        </span>
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <Link to="/guide" className="hover:text-eden-ink">이용방법</Link>
          <Link to="/orders" className="hover:text-eden-ink">내 주문</Link>
          <Link to="/privacy" className="hover:text-eden-ink">개인정보처리방침</Link>
          <Link to="/admin" className="hover:text-eden-ink">관리자 페이지</Link>
        </span>
      </div>
    </footer>
  )
}
