import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useSiteContent, useContentValue, ALL_NEWS_KEYS } from '@/lib/site-content'
import { pageMeta } from '@/lib/seo'
import { ChevronLeft } from 'lucide-react'

export const Route = createFileRoute('/news_/$id')({
  component: NewsDetailPage,
  head: () => pageMeta('/news'),
  beforeLoad: ({ params }) => {
    if (!(ALL_NEWS_KEYS as readonly string[]).includes(params.id)) throw notFound()
  },
})

function NewsDetailPage() {
  const { id } = Route.useParams()
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)
  const body = cv(`news.${id}.body`).trim()

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <article className="px-6 pb-24 pt-14 md:px-8">
        <div className="max-w-3xl">
          <Link to="/news" className="mb-8 inline-flex items-center gap-1 text-sm text-eden-sage-dim hover:text-eden-sand">
            <ChevronLeft size={16} />
            새소식 목록
          </Link>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-eden-sand/15 px-3 py-1 text-xs font-semibold text-eden-ink">{cv(`news.${id}.tag`)}</span>
            <span className="text-sm text-eden-sage-dim">{cv(`news.${id}.date`)}</span>
          </div>
          <h1 className="mb-8 border-b border-eden-line pb-8 font-serif text-3xl font-semibold">{cv(`news.${id}.title`)}</h1>
          {body ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{body}</p>
          ) : (
            <p className="text-[15px] text-eden-sage-dim">자세한 내용은 준비 중이에요.</p>
          )}
        </div>
      </article>
      <SiteFooter />
    </div>
  )
}
