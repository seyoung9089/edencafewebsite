import { Link } from '@tanstack/react-router'

export function SiteFooter() {
  return (
    <footer className="bg-eden-ink-2 pb-6 pt-16 text-[rgba(237,236,227,0.65)]">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-[rgba(126,153,134,0.2)] pb-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <span className="flex items-baseline gap-2 font-logo text-xl font-bold text-eden-paper">
              이든카페
              <span className="font-sans text-[10px] font-normal tracking-[0.16em] text-eden-sage">EDEN CAFE</span>
            </span>
            <p className="mt-4 max-w-[32ch] text-sm text-[rgba(237,236,227,0.55)]">
              학생들의 작은 시작이 협동조합으로 자란 카페. 정직한 재료와 편안한 쉼을 나눕니다.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-medium text-eden-paper">사이트</h4>
            <Link to="/about" className="block py-1 text-sm hover:text-eden-sand">카페소개</Link>
            <Link to="/order" className="block py-1 text-sm hover:text-eden-sand">주문</Link>
            <Link to="/guide" className="block py-1 text-sm hover:text-eden-sand">픽업 이용방법</Link>
            <Link to="/support" className="block py-1 text-sm hover:text-eden-sand">문의사항</Link>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-medium text-eden-paper">고객</h4>
            <Link to="/orders" className="block py-1 text-sm hover:text-eden-sand">마이페이지</Link>
            <Link to="/orders" className="block py-1 text-sm hover:text-eden-sand">내 주문</Link>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-medium text-eden-paper">연락처</h4>
            <p className="py-1 text-sm">010-XXXX-XXXX</p>
            <p className="py-1 text-sm">충청남도 금산군 ○○○</p>
            <p className="py-1 text-sm">평일 09:00 – 18:00</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-6 text-xs text-[rgba(237,236,227,0.4)] md:flex-row md:items-center md:justify-between">
          <span>ⓒ 2026 이든 협동조합. All rights reserved.</span>
          <span>
            <Link to="/privacy" className="text-inherit hover:text-eden-sand">개인정보처리방침</Link> · {' '}
            <Link to="/admin" className="text-inherit hover:text-eden-sand">관리자 페이지</Link> · EDEN CAFE, Since 2021
          </span>
        </div>
      </div>
    </footer>
  )
}
