import { createFileRoute, Link } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useContentValue, useSiteContent } from '@/lib/site-content'
import { pageMeta } from '@/lib/seo'
import { LogIn, ShoppingBasket, Landmark, Store, ChevronDown } from 'lucide-react'

export const Route = createFileRoute('/guide')({ component: GuidePage, head: () => pageMeta('/guide') })

function GuidePage() {
  const content = useSiteContent()
  const pickupTime = useContentValue(content, 'pickup.time')

  const steps = [
    { icon: LogIn, title: '로그인', desc: '구글 계정이나 이메일로 로그인해요. 처음이면 회원가입부터 하시면 돼요.' },
    { icon: ShoppingBasket, title: '빵 담기', desc: '주문 탭에서 원하는 빵의 [담기]를 누르고 수량을 정해요. 음료는 매장에서만 주문할 수 있어요.' },
    { icon: Landmark, title: '주문하고 입금하기', desc: '주문 내역을 확인하고 [주문하기]를 눌러요. 안내되는 계좌로 입금하면 끝이에요.' },
    {
      icon: Store,
      title: '매장에서 찾아가기',
      desc: `다음 날${pickupTime ? ` ${pickupTime} 사이에` : ''} 이든카페에 오셔서 이름을 말씀해주세요.`,
    },
  ]

  const faqs = [
    {
      q: '주문을 취소할 수 있나요?',
      a: '입금하기 전(입금대기)에는 내 주문에서 직접 취소할 수 있어요. 입금한 뒤의 취소와 환불은 [확인 필요]',
    },
    {
      q: '결제는 어떻게 하나요?',
      a: '무통장입금으로 받고 있어요. 주문을 마치면 입금할 계좌와 금액이 바로 나오고, 내 주문에서도 다시 볼 수 있어요.',
    },
    {
      q: '다음 날 못 가면 어떻게 하나요?',
      a: '[확인 필요]',
    },
  ]

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-14 md:px-8">
        <h1 className="mb-3 font-serif text-3xl font-semibold">픽업 주문 이용방법</h1>
        <p className="mb-8 text-[15px] text-eden-sage-dim">오늘 주문하면 다음 날 매장에서 찾아가요. 네 단계면 충분해요.</p>

        <div className="mb-10 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-eden-sand/15 px-4 py-2">매일 주문 가능</span>
          <span className="rounded-full bg-eden-sand/15 px-4 py-2">오늘 자정까지 주문하면 다음 날 픽업</span>
          {pickupTime ? <span className="rounded-full bg-eden-sand/15 px-4 py-2">픽업 시간 {pickupTime}</span> : null}
        </div>

        <ol className="grid gap-4 sm:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-card bg-eden-paper-dim p-5 shadow-soft">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-eden-ink text-eden-paper">
                <s.icon size={22} strokeWidth={1.7} />
              </div>
              <div>
                <div className="text-xs font-semibold text-eden-sand">{i + 1}단계</div>
                <h2 className="mb-1 font-serif text-lg font-semibold">{s.title}</h2>
                <p className="text-sm leading-relaxed text-eden-sage-dim">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-16">
          <h2 className="mb-4 font-serif text-xl font-semibold">자주 묻는 질문</h2>
          <div className="border-t border-eden-line">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-eden-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold">
                  {f.q}
                  <ChevronDown size={18} className="flex-shrink-0 text-eden-sage-dim transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-eden-sage-dim">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-sm text-eden-sage-dim">
            다른 궁금한 점은{' '}
            <Link to="/support" hash="inquiry" className="font-semibold text-eden-ink underline underline-offset-4">
              문의사항
            </Link>
            에 남겨주세요.
          </p>
        </section>

        <div className="mt-14 text-center">
          <Link
            to="/order"
            className="inline-flex h-14 items-center justify-center rounded-full bg-eden-ink px-12 text-base font-semibold text-eden-paper transition-colors hover:bg-eden-ink-2"
          >
            지금 주문하기
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
