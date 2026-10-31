import { createFileRoute, Link } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { HeroSection } from '@/components/hero-section'
import { Reveal } from '@/components/reveal'
import { useSiteContent, useContentValue, HOME_NEWS_KEYS } from '@/lib/site-content'
import { fetchMenu, isSoldOut } from '@/lib/menu'
import { pageMeta } from '@/lib/seo'
import { usePickupDates } from '@/lib/pickup'
import { Slider } from '@/components/slider'
import { ArrowRight } from 'lucide-react'

// Fetched server-side (during SSR / static prerender) so the structured
// data below is present in the raw HTML — not only after client JS runs.
// Most AI crawlers (and many that read via a browsing tool) fetch pages
// without executing JavaScript, so anything that only exists behind a
// client-side useQuery would be invisible to them.
type HomeMenuItem = { name: string; price: number; category: string; soldOut?: boolean; image?: string | null; description?: string }

export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => pageMeta('/'),
  loader: async () => {
    try {
      const items = await fetchMenu()
      return {
        menuItems: items.map((i) => ({
          name: i.name,
          price: i.price,
          category: i.category,
          soldOut: isSoldOut(i),
          image: i.image_url,
          description: i.description,
        })),
      }
    } catch {
      return { menuItems: [] as HomeMenuItem[] }
    }
  },
})

/** 문의 → 문의하기 page; 공지·소식 → that item's own page. */
function NewsLink({ tag, newsKey, className, children }: { tag: string; newsKey: string; className: string; children: React.ReactNode }) {
  if (tag.includes('문의')) return <Link to="/support" hash="inquiry" className={className}>{children}</Link>
  return <Link to="/news/$id" params={{ id: newsKey }} className={className}>{children}</Link>
}

function StructuredData({ menuItems }: { menuItems: HomeMenuItem[] }) {
  // Phone number and street address are still placeholders on this site
  // (010-XXXX-XXXX / 금산군 ○○○), so they're deliberately left out here —
  // publishing a fake phone/address as structured "fact" would be worse
  // than publishing nothing. Add them once the real values are set.
  const data = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: '이든카페',
    alternateName: 'Eden Cafe',
    description:
      '별무리고등학교에서 시작된 학생 협동조합 카페. 날짜를 골라 미리 주문하고, 그날 매장에서 픽업할 수 있습니다.',
    areaServed: '충청남도 금산군',
    foundingDate: '2021',
    hasMenu: {
      '@type': 'Menu',
      hasMenuSection: ['bakery', 'drink'].map((category) => ({
        '@type': 'MenuSection',
        name: category === 'bakery' ? '베이커리' : '음료',
        hasMenuItem: menuItems
          .filter((m) => m.category === category)
          .map((m) => ({
            '@type': 'MenuItem',
            name: m.name,
            offers: {
              '@type': 'Offer',
              price: m.price,
              priceCurrency: 'KRW',
              availability: m.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            },
          })),
      })),
    },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

function HomePage() {
  const { menuItems } = Route.useLoaderData()
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)
  const calendar = usePickupDates()
  const pickupTime = cv('pickup.time')

  // Only breads with a photo: a slide without one is just a big empty panel.
  // With no photos yet the section stays hidden.
  const showcase = menuItems.filter((m) => m.category === 'bakery' && !m.soldOut && m.price > 0 && m.image).slice(0, 6)
  const slides = showcase.map((m) => (
    <div
      className="relative flex aspect-[4/3] min-h-[240px] items-end bg-cover bg-center sm:aspect-[3/1]"
      style={{ backgroundImage: `url("${m.image}")` }}
    >
      <div className="flex w-full flex-col bg-[linear-gradient(0deg,rgba(27,20,16,.65),transparent)] px-6 py-5 text-white">
        <b className="font-serif text-[clamp(1.25rem,1.9vw,1.6rem)] font-normal">{m.name}</b>
        <span className="text-[0.95rem] opacity-90">{m.description || `${m.price.toLocaleString('ko-KR')}원`}</span>
      </div>
    </div>
  ))

  const pane = 'flex min-h-[260px] flex-col justify-between gap-8 px-[clamp(20px,5.5vw,96px)] py-[clamp(28px,4vw,56px)] transition-[filter] duration-300 hover:brightness-[.93]'
  const go = 'inline-flex h-12 flex-none items-center gap-2 rounded-[3px] px-5 text-base font-semibold'

  return (
    <div className="min-h-svh bg-eden-paper text-eden-ink">
      <StructuredData menuItems={menuItems} />
      <SiteHeader overlay />
      <HeroSection />

      {/* Two ways to order, side by side */}
      <section className="grid md:grid-cols-2">
        <Link to="/order" className={`${pane} bg-eden-accent text-white`}>
          <div>
            <h2 className="text-[clamp(1.9rem,3vw,2.8rem)] leading-[1.2]">마을 픽업 주문</h2>
            <p className="mt-4 text-[1.1rem] leading-relaxed">
              월요일부터 금요일까지 픽업
              <br />
              고른 날 매장에서 찾아갑니다
            </p>
          </div>
          <div className="flex items-end justify-between gap-4">
            <span className="text-[0.95rem] opacity-90">픽업 2일 전까지 주문</span>
            <span className={`${go} bg-eden-paper text-eden-ink`}>주문하기 <ArrowRight size={18} aria-hidden /></span>
          </div>
        </Link>
        <Link to="/parents" className={`${pane} bg-eden-pane text-eden-pane-ink`}>
          <div>
            <h2 className="text-[clamp(1.9rem,3vw,2.8rem)] leading-[1.2]">학부모 주문</h2>
            <p className="mt-4 text-[1.1rem] leading-relaxed">
              금요일 하교할 때 학생이 찾아갑니다
              <br />
              학생 이름으로 찾아갑니다
            </p>
          </div>
          <div className="flex items-end justify-between gap-4">
            <span className="text-[0.95rem] opacity-90">그 주 수요일까지 주문</span>
            <span className={`${go} bg-eden-pane-ink text-eden-paper`}>주문하기 <ArrowRight size={18} aria-hidden /></span>
          </div>
        </Link>
      </section>
      <Link
        to="/gifts"
        className="pad group flex flex-wrap items-center justify-between gap-4 bg-eden-paper-dim py-8 transition-colors hover:bg-[#E9E2D4]"
      >
        <span className="font-serif text-[clamp(1.25rem,1.9vw,1.6rem)]">모임과 행사에 나눌 답례품도 미리 예약받습니다</span>
        <span className="inline-flex items-center gap-1.5 text-[1rem] font-bold text-eden-accent group-hover:underline group-hover:underline-offset-4">
          답례품 예약 <ArrowRight size={17} />
        </span>
      </Link>

      {/* The breads */}
      {slides.length ? (
        <section className="pad bg-eden-paper-dim pb-20 pt-[70px]">
          <h2 className="mb-8 text-[clamp(1.9rem,3vw,2.8rem)]">{cv('menuHome.title')}</h2>
          <Slider slides={slides} label="이든카페 빵" />
          <p className="mt-5 text-[1rem] text-eden-ink">
            날짜마다 메뉴가 다릅니다. 주문 화면에서 날짜를 고르면 그날 메뉴가 나옵니다.
          </p>
        </section>
      ) : null}

      {/* Pickup basics on green, with the days open for orders */}
      <section className="pad bg-eden-accent py-[clamp(72px,9vw,140px)] text-white">
        <Reveal>
          <h2 className="mb-12 text-[clamp(1.9rem,3.4vw,3.2rem)] leading-[1.25]">
            주문 마감과
            <br />
            픽업 시간입니다.
          </h2>
        </Reveal>
        <Reveal className="mb-12 grid gap-x-10 gap-y-7 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-[1.05rem] opacity-90">주문 마감</span>
            <b className="text-[clamp(1.5rem,2.2vw,2rem)] font-semibold leading-tight">픽업 2일 전까지</b>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[1.05rem] opacity-90">픽업 요일</span>
            <b className="text-[clamp(1.5rem,2.2vw,2rem)] font-semibold leading-tight">월요일 ~ 금요일</b>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[1.05rem] opacity-90">픽업 시간</span>
            <b className="text-[clamp(1.5rem,2.2vw,2rem)] font-semibold leading-tight">{pickupTime || '매장 운영 시간'}</b>
          </div>
        </Reveal>
        {calendar?.days.length ? (
          <div className="mb-9">
            <p className="mb-3 text-[1.05rem] opacity-90">지금 주문할 수 있는 픽업 날짜</p>
            <div className="grid grid-cols-5 gap-2">
              {calendar.days.map((d) => (
                <Link
                  key={d.iso}
                  to="/order"
                  search={{ date: d.iso }}
                  className={`flex h-[88px] flex-col items-center justify-center gap-0.5 rounded-[2px] bg-white/[.12] px-1 hover:bg-white/[.22] ${d.open ? '' : 'pointer-events-none opacity-50'}`}
                >
                  {/* Same type as the date picker on the order page. */}
                  <span className="text-2xl font-medium leading-tight">{d.weekday}</span>
                  <span className="text-sm font-semibold">
                    {d.month}/{d.date}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        <p className="mb-6 text-[1.05rem]">
          주문을 마치면 입금할 계좌와 금액이 바로 나옵니다.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/order" className="btn ivory">
            주문하러 가기 <ArrowRight size={18} />
          </Link>
          <Link to="/guide" className="btn ghost">
            이용방법 자세히 보기
          </Link>
        </div>
      </section>

      {/* News */}
      <section id="news" className="pad py-[clamp(72px,9vw,140px)]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[clamp(1.9rem,3vw,2.8rem)]">새소식</h2>
          <Link to="/support" className="inline-flex items-center gap-1 text-[1.05rem] font-bold text-eden-accent hover:underline hover:underline-offset-4">
            전체 보기 <ArrowRight size={15} />
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {HOME_NEWS_KEYS.map((key, i) => (
            <Reveal key={key} delay={i * 80}>
              <NewsLink
                tag={cv(`news.${key}.tag`)}
                newsKey={key}
                className="group flex flex-wrap items-center gap-x-5 gap-y-1 bg-eden-paper-dim px-6 py-5 transition-colors hover:bg-[#E9E2D4]"
              >
                <span className="w-10 text-[1rem] font-bold text-eden-accent">{cv(`news.${key}.tag`)}</span>
                <span className="min-w-0 flex-1 text-[1.15rem] font-medium group-hover:text-eden-accent">{cv(`news.${key}.title`)}</span>
                <span className="basis-full pl-[3.75rem] text-[1rem] text-eden-mute sm:basis-auto sm:pl-0">{cv(`news.${key}.date`)}</span>
              </NewsLink>
            </Reveal>
          ))}
        </div>
      </section>

      {/* About teaser */}
      <section className="pad bg-eden-ink py-[clamp(72px,9vw,140px)] text-eden-paper">
        <Reveal>
          <h2 className="mb-10 text-[clamp(1.9rem,3.4vw,3.2rem)] leading-[1.25]">
            학생들의 작은 시작이
            <br />
            협동조합 카페가 되었습니다.
          </h2>
          <Link to="/about" className="btn ivory">
            카페소개 보기 <ArrowRight size={18} />
          </Link>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  )
}
