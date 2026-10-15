import { createFileRoute, Link } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { HeroSection } from '@/components/hero-section'
import { Reveal } from '@/components/reveal'
import { useSiteContent, useContentValue, useContentImage } from '@/lib/site-content'
import { fetchMenu, isSoldOut, useMenu } from '@/lib/menu'
import { CallButton } from '@/components/phone-link'
import { pageMeta } from '@/lib/seo'
import { Leaf, MessageCircle, Tag, Sunrise, MapPin, Croissant, Coffee } from 'lucide-react'

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

const valueMeta = [
  { icon: Leaf, key: 'eco', tone: 'bg-eden-ink' },
  { icon: MessageCircle, key: 'comm', tone: 'bg-eden-sage-dim' },
  { icon: Tag, key: 'price', tone: 'bg-eden-ink' },
  { icon: Sunrise, key: 'rest', tone: 'bg-eden-sage-dim' },
]

const historyMeta = [
  { year: '2021', key: 'h1' },
  { year: '2022', key: 'h2' },
  { year: '2023', key: 'h3' },
  { year: '2024–2025', key: 'h4' },
  { year: '2026', key: 'h5', latest: true },
]

const newsItems = [
  { key: 'n1' },
  { key: 'n2' },
  { key: 'n3' },
]

/** 문의 → 문의하기 page; 공지·소식 → that item's own page. */
function NewsLink({ tag, newsKey, className, children }: { tag: string; newsKey: string; className: string; children: React.ReactNode }) {
  if (tag.includes('문의')) return <Link to="/support" className={className}>{children}</Link>
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
      '별무리고등학교에서 시작된 학생 협동조합 카페. 오늘 주문하면 다음 날 픽업할 수 있습니다.',
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
  const locationPhoto = useContentImage('location.photo')
  const historyPhoto = useContentImage('history.photo')

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <StructuredData menuItems={menuItems} />
      <SiteHeader />
      <HeroSection />

      {/* Philosophy */}
      <section id="about" className="mx-auto max-w-xl px-6 py-24 md:px-8">
        <Reveal className="border-t border-eden-line py-9">
          <div className="mb-3 font-myeongjo text-lg font-bold text-eden-sand-ink">{cv('phil.label1')}</div>
          <p className="max-w-[46ch] text-lg leading-relaxed">{cv('phil.text1')}</p>
        </Reveal>
        <Reveal delay={100} className="border-t border-b border-eden-line py-9">
          <div className="mb-3 font-myeongjo text-lg font-bold text-eden-sand-ink">{cv('phil.label2')}</div>
          <p className="max-w-[46ch] text-lg leading-relaxed">{cv('phil.text2')}</p>
        </Reveal>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-8">
        <Reveal className="mb-14 max-w-xl">
          <h2 className="mb-3 font-serif text-3xl font-semibold">{cv('values.title')}</h2>
          <p className="text-base text-eden-sage-dim">{cv('values.subtitle')}</p>
        </Reveal>
        <div className="grid grid-cols-2 gap-7 md:grid-cols-4">
          {valueMeta.map((v, i) => (
            <Reveal key={v.key} delay={i * 90} className="text-center">
              <div className={`mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full ${v.tone}`}>
                <v.icon size={44} strokeWidth={1.6} className="text-eden-paper" />
              </div>
              <h3 className="mb-2 font-serif text-lg font-semibold">{cv(`value.${v.key}.title`)}</h3>
              <p className="text-sm text-eden-sage-dim">{cv(`value.${v.key}.desc`)}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200} className="mt-14 text-center font-serif text-xl font-medium">
          {cv('values.tagline')}
        </Reveal>
      </section>

      {/* Menu preview */}
      <section className="bg-eden-ink-2 px-6 py-24 text-eden-paper md:px-8">
        <Reveal className="mx-auto max-w-6xl text-center">
          <h2 className="mb-3 font-serif text-3xl font-semibold">{cv('menuHome.title')}</h2>
          <p className="mb-10 text-base text-eden-sage">{cv('menuHome.subtitle')}</p>
          <MenuPreview />
          <Link
            to="/menu"
            className="mt-10 inline-block rounded-full bg-eden-paper px-9 py-4 text-lg font-semibold text-eden-ink hover:bg-eden-sand"
          >
            메뉴 보고 주문하기
          </Link>
        </Reveal>
      </section>

      {/* History */}
      <section id="history" className="mx-auto max-w-6xl px-6 py-24 md:px-8">
        <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="mb-3 font-serif text-3xl font-semibold">{cv('history.title')}</h2>
            <p className="text-base text-eden-sage-dim">{cv('history.subtitle')}</p>
          </div>
          <Link to="/history" className="rounded-full border border-eden-line px-4 py-2 text-sm font-medium hover:border-eden-sand hover:text-eden-sand-ink">전체 히스토리 보기</Link>
        </Reveal>
        <div className="flex flex-col gap-10 md:flex-row md:items-start">
          <div className="relative flex-1 border-l border-eden-sage-dim/30 pl-9">
            {historyMeta.map((h, i) => (
              <Reveal key={h.year} delay={i * 80} className="relative pb-12 last:pb-0">
                <span
                  className={`absolute -left-[41px] top-1 h-2.5 w-2.5 rounded-full border-2 ${
                    h.latest ? 'border-eden-sand bg-eden-sand' : 'border-eden-sage-dim bg-eden-paper'
                  }`}
                />
                <div className="mb-2 font-serif text-xl font-semibold text-eden-sand-ink">{h.year}</div>
                <p className="max-w-[48ch] text-base">{cv(`history.${h.key}`)}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={150} className="h-[220px] w-full flex-shrink-0 overflow-hidden rounded-card bg-eden-sage-dim shadow-soft md:w-[280px]">
            {historyPhoto ? (
              <img src={historyPhoto} alt="" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-eden-paper/60">사진 없음</div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Location */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-8">
        <Reveal className="mb-14">
          <h2 className="font-serif text-3xl font-semibold">오시는 길</h2>
        </Reveal>
        <Reveal delay={100} className="grid grid-cols-1 overflow-hidden rounded-card shadow-soft md:grid-cols-[1.2fr_1fr]">
          <div className="flex min-h-[280px] items-center justify-center overflow-hidden bg-eden-sage-dim">
            {locationPhoto ? (
              <img src={locationPhoto} alt="" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
            ) : (
              <MapPin size={40} strokeWidth={1.6} className="text-eden-paper" />
            )}
          </div>
          <div className="flex flex-col justify-center bg-eden-paper-dim p-10">
            <div className="mb-2 text-xs text-eden-sand-ink">주소</div>
            <div className="mb-6 text-base">{cv('location.addr')}</div>
            <div className="mb-6 border-y border-eden-line py-6 font-serif text-xl leading-relaxed">
              {cv('location.quote')}
            </div>
            <div id="contact" className="flex flex-wrap items-center gap-3">
              <CallButton className="bg-eden-paper" />
              <span className="text-sm text-eden-sage-dim">{cv('contact.hours')}</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* News */}
      <section id="news" className="mx-auto max-w-6xl px-6 pb-24 md:px-8">
        <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-serif text-3xl font-semibold">새소식</h2>
          <Link to="/news" className="rounded-full border border-eden-line px-4 py-2 text-sm font-medium hover:border-eden-sand hover:text-eden-sand-ink">전체 새소식 보기</Link>
        </Reveal>
        <div className="max-w-3xl">
          {newsItems.map((n, i) => (
            <Reveal key={n.key} delay={i * 80} className="border-t border-eden-line last:border-b">
              <NewsLink tag={cv(`news.${n.key}.tag`)} newsKey={n.key} className="group flex items-center gap-6 py-5">
                <span className="rounded-full bg-eden-sand/15 px-3 py-1 text-xs font-semibold text-eden-ink">{cv(`news.${n.key}.tag`)}</span>
                <span className="flex-1 text-base group-hover:text-eden-sand-ink">{cv(`news.${n.key}.title`)}</span>
                <span className="text-sm text-eden-sage-dim">{cv(`news.${n.key}.date`)}</span>
              </NewsLink>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-eden-ink-2 px-6 py-20 text-center text-eden-paper md:px-8">
        <Reveal>
          <h2 className="mb-8 font-serif text-3xl font-semibold">{cv('cta.title')}</h2>
          <Link to="/menu" className="inline-block rounded-full bg-eden-paper px-9 py-3 text-sm font-semibold text-eden-ink hover:-translate-y-0.5 hover:bg-eden-sand">
            메뉴 보기
          </Link>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  )
}

/** A few real menu items (in stock first) so visitors see what they can order. */
function MenuPreview() {
  const { items } = useMenu()
  if (!items?.length) return null
  const picks = [...items.filter((i) => !isSoldOut(i)), ...items.filter(isSoldOut)].slice(0, 4)
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 text-left md:grid-cols-4">
      {picks.map((item) => {
        const Icon = item.category === 'drink' ? Coffee : Croissant
        return (
          <Link key={item.name} to="/menu" className="overflow-hidden rounded-card bg-eden-paper text-eden-ink hover:-translate-y-1">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-eden-paper-dim">
                <Icon size={40} strokeWidth={1.5} className="text-eden-sage-dim" />
              </div>
            )}
            <div className="p-4">
              <div className="font-semibold">{item.name}</div>
              <div className="text-eden-sand-ink">{isSoldOut(item) ? '품절' : `${item.price.toLocaleString('ko-KR')}원`}</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
