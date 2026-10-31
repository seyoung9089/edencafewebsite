import { createFileRoute, Link } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useContentValue, useSiteContent } from '@/lib/site-content'
import { pageMeta } from '@/lib/seo'
import { ChevronDown } from 'lucide-react'

export const Route = createFileRoute('/guide')({ component: GuidePage, head: () => pageMeta('/guide') })

function GuidePage() {
  const content = useSiteContent()
  const pickupTime = useContentValue(content, 'pickup.time')

  const steps = [
    { title: '로그인', desc: '이메일이나 Google 계정으로 로그인합니다. 처음이시면 회원가입을 먼저 하시면 됩니다.' },
    {
      title: '날짜 고르고 빵 담기',
      desc: '픽업 날짜를 고르면 그날 메뉴가 나옵니다. 원하는 빵의 [담기]를 누르고 수량을 정합니다. 학생이 찾아갈 빵은 학부모 주문 탭에서 주문합니다.',
    },
    { title: '주문하고 입금하기', desc: '[주문하기]를 누르면 입금할 계좌와 금액이 나옵니다. 입금이 확인되면 주문이 확정됩니다.' },
    {
      title: '매장에서 찾아가기',
      desc: `고른 날${pickupTime ? ` ${pickupTime} 사이에` : ''} 이든카페에서 이름을 말씀하시면 됩니다.`,
    },
  ]

  const faqs = [
    {
      q: '주문을 취소할 수 있나요?',
      a: '입금하기 전(입금 대기)에는 내 주문에서 직접 취소할 수 있습니다. 입금한 뒤에는 문의사항에 남겨 주시면 안내해 드리겠습니다.',
    },
    {
      q: '언제까지 주문해야 하나요?',
      a: '픽업 2일 전까지입니다. 예를 들어 금요일 픽업은 수요일까지 주문하시면 됩니다. 오늘부터 2주 안의 날짜를 고를 수 있습니다.',
    },
    {
      q: '학부모 주문은 뭐가 다른가요?',
      a: '학부모님이 주문하고, 학생이 금요일 하교할 때 찾아갑니다. 학생 이름으로 찾아가므로 이름을 꼭 적어 주시기 바랍니다. 결제는 계좌이체나 현장결제 중에 고를 수 있습니다.',
    },
    {
      q: '결제는 어떻게 하나요?',
      a: '계좌이체로 받고 있습니다. 주문을 마치면 입금할 계좌와 금액이 바로 나오고, 내 주문에서도 다시 볼 수 있습니다. 학부모 주문은 현장결제도 됩니다.',
    },
    {
      q: '소금빵이나 치아바타를 많이 주문하고 싶어요.',
      a: '소금빵·치아바타·베이글은 맛을 합쳐 10개 이상이면 사이트에서 주문할 수 없습니다. 문의사항에 남겨 주시면 따로 안내해 드리겠습니다.',
    },
    {
      q: '픽업 날 못 가면 어떻게 하나요?',
      a: '픽업 날 전에 문의사항에 남겨 주시면 안내해 드리겠습니다.',
    },
  ]

  return (
    <div className="min-h-svh bg-eden-paper text-eden-ink">
      <SiteHeader />
      <main className="pad pb-[clamp(72px,9vw,140px)] pt-[clamp(48px,7vw,96px)]">
        <h1 className="mb-4 font-serif text-[clamp(2.2rem,4.4vw,3.8rem)] font-light leading-[1.2]">픽업 주문 이용방법</h1>
        <p className="mb-8 max-w-[52ch] text-[1.15rem] leading-relaxed">미리 주문하고, 고른 날 매장에서 찾아가는 방식(픽업)입니다.</p>

        <div className="mb-14 flex flex-wrap gap-2 text-[1rem]">
          <span className="rounded-[3px] bg-eden-paper-dim px-4 py-2.5">월~금 픽업</span>
          <span className="rounded-[3px] bg-eden-paper-dim px-4 py-2.5">픽업 2일 전까지 주문</span>
          {pickupTime ? <span className="rounded-[3px] bg-eden-paper-dim px-4 py-2.5">픽업 시간 {pickupTime}</span> : null}
        </div>

        {/* The four steps, in order, as one band of green. */}
        <ol className="grid gap-px bg-eden-accent text-white sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 bg-eden-accent px-6 py-8 lg:px-7">
              <h2 className="font-serif text-[clamp(1.4rem,1.9vw,1.7rem)] font-light leading-snug">
                {i + 1}. {s.title}
              </h2>
              <p className="text-[1.05rem] leading-relaxed text-white/95">{s.desc}</p>
            </li>
          ))}
        </ol>

        <section className="mt-[clamp(72px,8vw,120px)] grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div>
            <h2 className="mb-4 font-serif text-[clamp(1.9rem,3vw,2.8rem)] font-light leading-tight">자주 묻는 질문</h2>
            <p className="max-w-[30ch] text-[1.05rem] leading-relaxed">
              다른 궁금한 점은{' '}
              <Link to="/support" hash="inquiry" className="font-semibold text-eden-ink underline underline-offset-4">
                문의사항
              </Link>
              에 남겨 주시면 됩니다.
            </p>
            <Link
              to="/order"
              className="mt-8 inline-flex h-14 items-center justify-center rounded-[3px] bg-eden-accent px-10 text-[1.05rem] font-semibold text-white transition-colors hover:bg-eden-accent-d"
            >
              지금 주문하기
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {faqs.map((f) => (
              <details key={f.q} className="group bg-eden-paper-dim px-6">
                <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[1.1rem] font-semibold">
                  {f.q}
                  <ChevronDown size={20} className="flex-shrink-0 text-eden-mute transition-transform group-open:rotate-180" />
                </summary>
                <p className="max-w-[60ch] pb-6 text-[1.05rem] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
