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
      <article className="px-6 pb-24 pt-[clamp(48px,7vw,96px)] md:px-8">
        <div className="max-w-3xl">
          <Link to="/support" className="mb-8 inline-flex items-center gap-1 text-sm text-eden-mute hover:text-eden-accent">
            <ChevronLeft size={16} />
            새소식 목록으로
          </Link>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-eden-paper-dim px-3 py-1 text-xs font-semibold text-eden-ink">{cv(`news.${id}.tag`)}</span>
            <span className="text-sm text-eden-mute">{cv(`news.${id}.date`)}</span>
          </div>
          <h1 className="mb-8 border-b border-eden-line pb-8 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">{cv(`news.${id}.title`)}</h1>
          {body ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{body}</p>
          ) : (
            <p className="text-[15px] text-eden-mute">자세한 내용은 준비 중입니다.</p>
          )}
        </div>
      </article>
      <SiteFooter />
    </div>
  )
}
