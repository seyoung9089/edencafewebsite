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
import { ArrowRight, CalendarDays, Clock, Info, School, Store, Bell } from 'lucide-react'

// Warm stand-ins for menu photos that haven't been uploaded yet.
const SLIDE_TONES = [
  'linear-gradient(135deg,#C99A62,#7A4E2C)',
  'linear-gradient(135deg,#E2C296,#A8743F)',
  'linear-gradient(135deg,#B98B5E,#5A3B2A)',
  'linear-gradient(135deg,#D9B78A,#8C5F38)',
]

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
      '별무리고등학교에서 시작된 학생 협동조합 카페. 픽업 날짜를 골라 미리 주문하면 그날 매장에서 찾아갈 수 있습니다.',
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

  // Breads with a photo first, then the rest, six at most.
  const bakery = menuItems.filter((m) => m.category === 'bakery' && !m.soldOut && m.price > 0)
  const showcase = [...bakery.filter((m) => m.image), ...bakery.filter((m) => !m.image)].slice(0, 6)
  const slides = showcase.map((m, i) => (
    <div
      className="relative flex aspect-[4/3] min-h-[240px] items-end bg-cover bg-center sm:aspect-[21/9]"
      style={{ backgroundImage: m.image ? `url("${m.image}")` : SLIDE_TONES[i % SLIDE_TONES.length] }}
    >
      <div className="flex w-full flex-col bg-[linear-gradient(0deg,rgba(27,20,16,.65),transparent)] px-6 py-5 text-white">
        <b className="font-serif text-[clamp(1.25rem,1.9vw,1.6rem)] font-normal">{m.name}</b>
        <span className="text-[0.95rem] opacity-90">{m.description || `${m.price.toLocaleString('ko-KR')}원`}</span>
      </div>
    </div>
  ))

  const pane = 'flex min-h-[260px] flex-col justify-between gap-8 px-[clamp(20px,5.5vw,96px)] py-[clamp(28px,4vw,56px)] transition-[filter] duration-300 hover:brightness-[.93]'
  const go = 'grid h-12 w-12 flex-none place-items-center rounded-full border'

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <StructuredData menuItems={menuItems} />
      <SiteHeader overlay />
      <HeroSection />

      {/* Two ways to order, side by side */}
      <section className="grid md:grid-cols-2">
        <Link to="/order" className={`${pane} bg-eden-accent text-white`}>
          <div>
            <p className="eyebrow !text-white">VILLAGE PICKUP</p>
            <h2 className="mt-3 text-[clamp(1.7rem,2.6vw,2.4rem)] leading-[1.25]">마을 픽업 주문</h2>
            <div className="mt-4 flex flex-col gap-1.5 text-[1rem]">
              <span className="flex items-center gap-2"><CalendarDays size={17} strokeWidth={1.7} /> 월요일부터 금요일까지 픽업</span>
              <span className="flex items-center gap-2"><Store size={17} strokeWidth={1.7} /> 고른 날 매장에서 찾아가요</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4">
            <span className="text-[0.95rem] opacity-90">픽업 2일 전 자정까지 주문</span>
            <span className={`${go} border-white`} aria-hidden><ArrowRight size={20} /></span>
          </div>
        </Link>
        <Link to="/parents" className={`${pane} bg-eden-pane text-eden-pane-ink`}>
          <div>
            <p className="eyebrow !text-eden-pane-ink">PARENTS · FRIDAY</p>
            <h2 className="mt-3 text-[clamp(1.7rem,2.6vw,2.4rem)] leading-[1.25]">학부모 주문</h2>
            <div className="mt-4 flex flex-col gap-1.5 text-[1rem]">
              <span className="flex items-center gap-2"><School size={17} strokeWidth={1.7} /> 금요일 하교할 때 학생이 찾아가요</span>
              <span className="flex items-center gap-2"><Info size={17} strokeWidth={1.7} /> 주문할 때 학생 이름을 적어 주세요</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4">
            <span className="text-[0.95rem] opacity-90">그 주 수요일 자정까지 주문</span>
            <span className={`${go} border-eden-pane-ink`} aria-hidden><ArrowRight size={20} /></span>
          </div>
        </Link>
      </section>

      {/* The breads */}
      {slides.length ? (
        <section className="pad bg-eden-paper-dim pb-20 pt-[70px]">
          <p className="eyebrow">THE BREAD</p>
          <h2 className="mb-7 mt-3 text-[clamp(1.4rem,2.1vw,1.9rem)]">{cv('menuHome.title')}</h2>
          <Slider slides={slides} label="이든카페 빵" />
          <p className="mt-5 flex items-center gap-1.5 text-[0.9rem] text-eden-mute">
            <Info size={15} strokeWidth={1.7} /> 날짜마다 메뉴가 달라요. 주문 화면에서 날짜를 고르면 그날 메뉴가 나와요.
          </p>
        </section>
      ) : null}

      {/* Pickup basics on red, with the days open for orders */}
      <section className="pad bg-eden-accent py-[90px] text-white">
        <p className="eyebrow !text-white">PICKUP</p>
        <Reveal>
          <h2 className="mb-9 mt-4 text-[clamp(1.5rem,2.6vw,2.3rem)] leading-[1.35]">
            미리 주문하고
            <br />
            고른 날 찾아가세요.
          </h2>
        </Reveal>
        <Reveal className="mb-9 grid gap-5 md:grid-cols-3">
          <div className="flex flex-col gap-1.5 border-t border-white/50 pt-4">
            <CalendarDays size={28} strokeWidth={1.6} />
            <b className="font-serif text-[1.25rem] font-normal">픽업 2일 전 자정까지</b>
            <span className="text-[0.95rem] opacity-90">주문 마감</span>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-white/50 pt-4">
            <Store size={28} strokeWidth={1.6} />
            <b className="font-serif text-[1.25rem] font-normal">월요일 ~ 금요일</b>
            <span className="text-[0.95rem] opacity-90">2주 뒤 픽업까지 미리 주문할 수 있어요</span>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-white/50 pt-4">
            <Clock size={28} strokeWidth={1.6} />
            <b className="font-serif text-[1.25rem] font-normal">{pickupTime || '매장 운영 시간'}</b>
            <span className="text-[0.95rem] opacity-90">픽업 시간</span>
          </div>
        </Reveal>
        {calendar?.days.length ? (
          <div className="mb-9">
            <p className="mb-3 text-[0.95rem] opacity-90">지금 주문할 수 있는 픽업 날짜</p>
            <div className="grid grid-cols-5 gap-2">
              {calendar.days.map((d) => (
                <Link
                  key={d.iso}
                  to="/order"
                  className={`rounded-[2px] border border-white/45 px-1 py-3 text-center text-[0.85rem] hover:bg-white/10 ${d.open ? '' : 'pointer-events-none opacity-50'}`}
                >
                  {d.weekLabel}
                  <b className="block text-[1.1rem] font-medium leading-snug">
                    {d.month}/{d.date} ({d.weekday})
                  </b>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        <p className="mb-6 flex items-center gap-2 text-[1rem]">
          <Bell size={17} strokeWidth={1.7} /> 주문을 마치면 입금할 계좌와 금액이 바로 나와요.
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
      <section id="news" className="pad pb-[90px] pt-[70px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">NEWS</p>
            <h2 className="mt-3 text-[clamp(1.4rem,2.1vw,1.9rem)]">새소식</h2>
          </div>
          <Link to="/support" className="inline-flex items-center gap-1 text-[0.95rem] font-bold text-eden-accent hover:underline hover:underline-offset-4">
            전체 보기 <ArrowRight size={15} />
          </Link>
        </div>
        <div className="border-t-2 border-eden-ink">
          {HOME_NEWS_KEYS.map((key, i) => (
            <Reveal key={key} delay={i * 80} className="border-b border-eden-line">
              <NewsLink tag={cv(`news.${key}.tag`)} newsKey={key} className="group flex flex-wrap items-center gap-x-4 gap-y-1 py-5">
                <span className="rounded-full border border-eden-accent px-3 py-0.5 text-[0.8rem] font-bold text-eden-accent">{cv(`news.${key}.tag`)}</span>
                <span className="min-w-0 flex-1 text-[1.1rem] font-medium group-hover:text-eden-accent">{cv(`news.${key}.title`)}</span>
                <span className="text-[0.9rem] text-eden-mute">{cv(`news.${key}.date`)}</span>
              </NewsLink>
            </Reveal>
          ))}
        </div>
      </section>

      {/* About teaser */}
      <section className="pad bg-eden-ink py-[80px] text-eden-paper">
        <Reveal>
          <p className="eyebrow !text-eden-paper">ABOUT EDEN</p>
          <h2 className="mb-9 mt-4 text-[clamp(1.5rem,2.6vw,2.3rem)] leading-[1.35]">
            학생들의 작은 시작이
            <br />
            협동조합 카페가 되었어요.
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
