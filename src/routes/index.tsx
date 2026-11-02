import { createFileRoute, Link } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { HeroSection } from '@/components/hero-section'
import { Reveal } from '@/components/reveal'
import { useSiteContent, useContentValue, HOME_NEWS_KEYS } from '@/lib/site-content'
import { fetchMenu, isSoldOut } from '@/lib/menu'
import { pageMeta } from '@/lib/seo'
import { LogIn, ShoppingBasket, Landmark, Store, ArrowRight } from 'lucide-react'

// Fetched server-side (during SSR / static prerender) so the structured
// data below is present in the raw HTML — not only after client JS runs.
// Most AI crawlers (and many that read via a browsing tool) fetch pages
// without executing JavaScript, so anything that only exists behind a
// client-side useQuery would be invisible to them.
export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => pageMeta('/'),
  loader: async () => {
    try {
      const items = await fetchMenu()
      return { menuItems: items.map((i) => ({ name: i.name, price: i.price, category: i.category, soldOut: isSoldOut(i) })) }
    } catch {
      return { menuItems: [] as { name: string; price: number; category: string; soldOut?: boolean }[] }
    }
  },
})

const steps = [
  { icon: LogIn, title: '로그인' },
  { icon: ShoppingBasket, title: '빵 담기' },
  { icon: Landmark, title: '주문하고 입금' },
  { icon: Store, title: '고른 날 픽업' },
]

/** 문의 → 문의하기 page; 공지·소식 → that item's own page. */
function NewsLink({ tag, newsKey, className, children }: { tag: string; newsKey: string; className: string; children: React.ReactNode }) {
  if (tag.includes('문의')) return <Link to="/support" hash="inquiry" className={className}>{children}</Link>
  return <Link to="/news/$id" params={{ id: newsKey }} className={className}>{children}</Link>
}

function StructuredData({ menuItems }: { menuItems: { name: string; price: number; category: string; soldOut?: boolean }[] }) {
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

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <StructuredData menuItems={menuItems} />
      <SiteHeader />
      <HeroSection />

      {/* How pickup ordering works, in one glance */}
      <section className="mx-auto max-w-6xl px-6 py-14 md:px-8">
        <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-2xl font-semibold">픽업 주문 이용 방법</h2>
          <Link to="/guide" className="inline-flex items-center gap-1 rounded-full border border-eden-line px-4 py-2 text-sm font-medium hover:border-eden-sand hover:text-eden-sand">
            자세히 보기 <ArrowRight size={14} />
          </Link>
        </Reveal>
        <ol className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 70} className="flex items-center gap-3 rounded-card bg-eden-paper-dim p-4 shadow-soft">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-eden-ink text-eden-paper">
                <s.icon size={18} strokeWidth={1.7} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-eden-sand">{i + 1}단계</div>
                <div className="text-[15px] font-semibold">{s.title}</div>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* News */}
      <section id="news" className="mx-auto max-w-6xl px-6 pb-16 md:px-8">
        <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-2xl font-semibold">새소식</h2>
          <Link to="/support" className="rounded-full border border-eden-line px-4 py-2 text-sm font-medium hover:border-eden-sand hover:text-eden-sand">전체 보기</Link>
        </Reveal>
        <div className="max-w-3xl">
          {HOME_NEWS_KEYS.map((key, i) => (
            <Reveal key={key} delay={i * 80} className="border-t border-eden-line last:border-b">
              <NewsLink tag={cv(`news.${key}.tag`)} newsKey={key} className="group flex flex-wrap items-center gap-x-4 gap-y-1 py-4">
                <span className="rounded-full bg-eden-sand/15 px-3 py-1 text-xs font-semibold text-eden-ink">{cv(`news.${key}.tag`)}</span>
                <span className="min-w-0 flex-1 text-[15px] group-hover:text-eden-sand">{cv(`news.${key}.title`)}</span>
                <span className="text-sm text-eden-sage-dim">{cv(`news.${key}.date`)}</span>
              </NewsLink>
            </Reveal>
          ))}
        </div>
      </section>

      {/* About teaser */}
      <section className="bg-eden-ink-2 px-6 py-14 text-center text-eden-paper md:px-8">
        <Reveal>
          <p className="mb-2 text-sm text-eden-sage">{cv('hero.eyebrow')}</p>
          <h2 className="mb-6 font-serif text-2xl font-semibold">이든이 어떤 곳인지 궁금하다면</h2>
          <Link to="/about" className="inline-block rounded-full border border-[rgba(237,236,227,0.45)] px-8 py-3 text-sm font-semibold hover:border-eden-sand hover:bg-eden-sand hover:text-eden-ink-2">
            카페소개 보기
          </Link>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  )
}
