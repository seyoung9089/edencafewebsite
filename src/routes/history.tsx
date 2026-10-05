import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useSiteContent, useContentValue } from '@/lib/site-content'
import { pageMeta } from '@/lib/seo'

export const Route = createFileRoute('/history')({ component: HistoryPage, head: () => pageMeta('/history') })

const historyMeta = [
  { year: '2021', key: 'h1' },
  { year: '2022', key: 'h2' },
  { year: '2023', key: 'h3' },
  { year: '2024–2025', key: 'h4' },
  { year: '2026', key: 'h5', latest: true },
]

function HistoryPage() {
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)
  const historyPhoto = useQuery(api.siteContent.getImage, { key: 'history.photo' })

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <section className="px-6 pb-24 pt-14 md:px-8">
        <h1 className="mb-3 font-serif text-3xl font-semibold">이든의 히스토리</h1>
        <p className="mb-14 text-[15px] text-eden-sage-dim">작은 교실 프로젝트에서 시작해, 지금의 이든이 되기까지.</p>

        <div className="flex flex-col gap-12 md:flex-row md:items-start">
          <div className="relative max-w-2xl flex-1 border-l border-eden-sage-dim/30 pl-9">
            {historyMeta.map((h) => (
              <div key={h.year} className="relative pb-14 last:pb-0">
                <span
                  className={`absolute -left-[41px] top-1 h-2.5 w-2.5 rounded-full border-2 ${
                    h.latest ? 'border-eden-sand bg-eden-sand' : 'border-eden-sage-dim bg-eden-paper'
                  }`}
                />
                <div className="mb-2 font-serif text-2xl font-semibold text-eden-sand">{h.year}</div>
                <p className="max-w-[48ch] text-[16px] leading-relaxed">{cv(`history.${h.key}`)}</p>
              </div>
            ))}
          </div>
          <div className="h-[320px] w-full flex-shrink-0 overflow-hidden bg-eden-sage-dim md:w-[320px]">
            {historyPhoto ? (
              <img src={historyPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-eden-paper/60">사진 없음</div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
