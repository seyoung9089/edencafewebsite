import { createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useContentValue, useSiteContent } from '@/lib/site-content'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
  head: () => ({ meta: [{ title: '개인정보처리방침 | 이든카페' }] }),
})

function PrivacyPage() {
  const content = useSiteContent()
  const operator = useContentValue(content, 'privacy.operator')
  const email = useContentValue(content, 'privacy.email')
  const orderYears = useContentValue(content, 'privacy.orderYears')
  const inquiryYears = useContentValue(content, 'privacy.inquiryYears')

  return <div className="min-h-screen bg-eden-paper text-eden-ink">
    <SiteHeader />
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-[clamp(48px,7vw,96px)]">
      <p className="eyebrow mb-3">이든카페</p>
      <h1 className="mb-6 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">개인정보처리방침</h1>
      <p className="mb-10 leading-7">{operator}은 이든카페 웹사이트에서 필요한 개인정보를 아래와 같이 처리합니다.</p>
      <div className="space-y-9 text-sm leading-7">
        <section><h2 className="mb-2 font-serif text-xl font-light">1. 처리 목적과 항목</h2>
          <p>회원가입과 로그인에는 이메일 주소, 이름, 인증 정보가 사용됩니다. Google로 로그인하면 고객이 동의한 기본 프로필 정보와 이메일 주소가 인증 서비스에 전달됩니다. 비밀번호는 사이트가 평문으로 보관하지 않습니다.</p>
          <p className="mt-2">픽업 주문에는 주문 메뉴·수량·금액·픽업 날짜·처리 상태와 계정 정보가, 문의에는 문의 유형·제목·내용·답변·처리 상태와 계정 정보가 사용됩니다. 이 정보는 주문 접수·픽업·입금 확인, 문의 답변과 고객의 내역 조회를 위해 처리합니다.</p>
        </section>
        <section><h2 className="mb-2 font-serif text-xl font-light">2. 보관 기간</h2>
          <p>회원 정보는 회원 탈퇴 또는 삭제 요청 시까지 사용합니다. 주문·결제 및 재화 공급에 관한 기록은 {orderYears}년, 고객 문의·분쟁 처리 기록은 {inquiryYears}년 보관합니다. 법령에서 더 긴 보존 기간을 정한 경우에는 그 기간을 따릅니다. 보관 기간이 끝난 정보는 복구할 수 없도록 파기합니다.</p>
        </section>
        <section><h2 className="mb-2 font-serif text-xl font-light">3. 외부 서비스 이용</h2>
          <p>계정 인증과 데이터 저장에 Supabase를 사용합니다. Google 로그인 선택 시에는 Google의 인증 절차를 이용하며, 동의 화면에 표시된 정보만 로그인에 사용합니다. 카카오 로그인은 현재 제공하지 않습니다.</p>
        </section>
        <section><h2 className="mb-2 font-serif text-xl font-light">4. 이용자의 권리</h2>
          <p>본인의 개인정보 열람·정정·삭제·처리 정지를 요청할 수 있습니다. 아래 이메일로 요청하시면 본인 확인 후 처리합니다. 법령상 보존해야 하는 기록은 해당 기간 동안 별도로 보관할 수 있습니다.</p>
        </section>
        <section><h2 className="mb-2 font-serif text-xl font-light">5. 문의</h2>
          <p>개인정보 처리와 관련한 문의: <a href={`mailto:${email}`} className="underline underline-offset-4">{email}</a></p>
          <p>운영 주체: {operator}</p>
        </section>
      </div>
      <p className="mt-12 border-t border-eden-line pt-5 text-xs text-eden-mute">시행일: 2026년 10월 19일</p>
    </main>
    <SiteFooter />
  </div>
}
