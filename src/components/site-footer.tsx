import { Link } from '@tanstack/react-router'
import { EdenMark } from '@/components/site-header'
import { isPlaceholder, useContentValue, useSiteContent } from '@/lib/site-content'

export function SiteFooter() {
  const content = useSiteContent()
  // Same values as 카페소개 → 오시는 길 (admin → 글귀 · 이미지); sample text stays hidden.
  const phone = useContentValue(content, 'location.phone').replace(/^담당 연락처\s*·\s*/, '')
  const addr = useContentValue(content, 'location.addr')
  const pickupTime = useContentValue(content, 'pickup.time')

  const cell = 'min-w-0'
  const label = 'mb-1 block text-[0.95rem] font-medium text-eden-mute'
  const value = 'text-[1.05rem] [overflow-wrap:anywhere]'

  return (
    <footer className="pad bg-eden-paper-dim pb-10 pt-16 text-eden-ink">
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 pb-12 md:grid-cols-4">
        <div className={cell}>
          <b className={label}>전화</b>
          <span className={value}>{isPlaceholder(phone) ? '준비 중입니다' : phone}</span>
        </div>
        <div className={cell}>
          <b className={label}>주소</b>
          <span className={value}>{isPlaceholder(addr) ? '별무리마을 이든카페' : addr}</span>
        </div>
        <div className={cell}>
          <b className={label}>픽업</b>
          <span className={value}>월~금{pickupTime ? ` · ${pickupTime}` : ''}</span>
        </div>
        <div className={cell}>
          <b className={label}>문의</b>
          <Link to="/support" hash="inquiry" className={`${value} underline underline-offset-4 hover:text-eden-accent`}>문의 남기기</Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 text-[0.95rem] text-eden-mute">
        <span className="flex items-center gap-3">
          <EdenMark className="h-auto w-6 text-eden-ink" />
          ⓒ 2026 이든 협동조합 · Since 2021
        </span>
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <Link to="/gifts" className="hover:text-eden-ink">답례품 예약</Link>
          <Link to="/guide" className="hover:text-eden-ink">이용방법</Link>
          <Link to="/orders" className="hover:text-eden-ink">내 주문</Link>
          <Link to="/privacy" className="hover:text-eden-ink">개인정보처리방침</Link>
        </span>
      </div>
    </footer>
  )
}
