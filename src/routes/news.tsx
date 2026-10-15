import { createFileRoute, Link } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useSiteContent, useContentValue, ALL_NEWS_KEYS } from '@/lib/site-content'
import { pageMeta } from '@/lib/seo'

export const Route = createFileRoute('/news')({ component: NewsPage, head: () => pageMeta('/news') })

function NewsPage() {
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <section className="px-6 pb-24 pt-14 md:px-8">
        <h1 className="mb-3 font-serif text-3xl font-semibold">새소식</h1>
        <p className="mb-14 text-base text-eden-sage-dim">이든의 모든 공지와 소식을 확인하세요.</p>

        <div className="max-w-3xl">
          {ALL_NEWS_KEYS.map((k) => (
            <Link
              key={k}
              to="/news/$id"
              params={{ id: k }}
              className="group flex items-center gap-6 border-t border-eden-line py-5 last:border-b"
            >
              <span className="rounded-full bg-eden-sand/15 px-3 py-1 text-xs font-semibold text-eden-ink">{cv(`news.${k}.tag`)}</span>
              <span className="flex-1 text-base group-hover:text-eden-sand-ink">{cv(`news.${k}.title`)}</span>
              <span className="text-sm text-eden-sage-dim">{cv(`news.${k}.date`)}</span>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
