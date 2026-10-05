import { createFileRoute } from '@tanstack/react-router'
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
        <p className="mb-14 text-[15px] text-eden-sage-dim">이든의 모든 공지와 소식을 확인하세요.</p>

        <div className="max-w-3xl">
          {ALL_NEWS_KEYS.map((k) => (
            <div key={k} className="flex items-baseline gap-6 border-t border-eden-line py-5 last:border-b">
              <span className="rounded-sm border border-eden-sand px-2.5 py-1 text-xs text-eden-sand">{cv(`news.${k}.tag`)}</span>
              <span className="flex-1 text-[15px]">{cv(`news.${k}.title`)}</span>
              <span className="text-sm text-eden-sage-dim">{cv(`news.${k}.date`)}</span>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
