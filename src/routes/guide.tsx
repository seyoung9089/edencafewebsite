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
    { icon: LogIn, title: '로그인', desc: '이메일이나 Google 계정으로 로그인합니다. 처음이시면 회원가입을 먼저 하시면 됩니다.' },
    {
      icon: ShoppingBasket,
      title: '날짜 고르고 빵 담기',
      desc: '픽업 날짜를 고르면 그날 메뉴가 나옵니다. 원하는 빵의 [담기]를 누르고 수량을 정합니다. 학생이 찾아갈 빵은 학부모 주문 탭에서 주문합니다.',
    },
    { icon: Landmark, title: '주문하고 입금하기', desc: '[주문하기]를 누르면 입금할 계좌와 금액이 나옵니다. 입금이 확인되면 주문이 확정됩니다.' },
    {
      icon: Store,
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
      a: '픽업 2일 전 밤 11시 59분까지입니다. 예를 들어 금요일 픽업은 수요일 밤 11시 59분까지 주문하시면 됩니다. 오늘부터 2주 안의 날짜를 고를 수 있습니다.',
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
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-[clamp(48px,7vw,96px)] md:px-8">
        <p className="eyebrow mb-3">처음이신 분께</p>
        <h1 className="mb-3 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">픽업 주문 이용방법</h1>
        <p className="mb-8 text-[15px] text-eden-mute">미리 주문하고, 고른 날 매장에서 찾아가는 방식(픽업)입니다.</p>

        <div className="mb-10 flex flex-wrap gap-2 text-sm">
          <span className="rounded-[3px] bg-eden-paper-dim px-4 py-2">월~금 픽업</span>
          <span className="rounded-[3px] bg-eden-paper-dim px-4 py-2">픽업 2일 전 밤 11시 59분까지 주문</span>
          {pickupTime ? <span className="rounded-[3px] bg-eden-paper-dim px-4 py-2">픽업 시간 {pickupTime}</span> : null}
        </div>

        <ol className="grid gap-4 sm:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-card bg-eden-paper-dim p-5 shadow-soft">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[3px] bg-eden-accent text-white">
                <s.icon size={22} strokeWidth={1.7} />
              </div>
              <div>
                <div className="text-xs font-semibold text-eden-accent">{i + 1}단계</div>
                <h2 className="mb-1 font-serif text-lg font-light">{s.title}</h2>
                <p className="text-sm leading-relaxed text-eden-mute">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-16">
          <h2 className="mb-4 font-serif text-xl font-light">자주 묻는 질문</h2>
          <div className="border-t border-eden-line">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-eden-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold">
                  {f.q}
                  <ChevronDown size={18} className="flex-shrink-0 text-eden-mute transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-eden-mute">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-sm text-eden-mute">
            다른 궁금한 점은{' '}
            <Link to="/support" hash="inquiry" className="font-semibold text-eden-ink underline underline-offset-4">
              문의사항
            </Link>
            에 남겨 주시면 됩니다.
          </p>
        </section>

        <div className="mt-14 text-center">
          <Link
            to="/order"
            className="inline-flex h-14 items-center justify-center rounded-[3px] bg-eden-accent px-12 text-base font-semibold text-white transition-colors hover:bg-eden-accent-d"
          >
            지금 주문하기
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
