import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useSiteContent, useContentValue } from '@/lib/site-content'
import { pageMeta } from '@/lib/seo'
import { Leaf, MessageCircle, Tag, Sunrise, MapPin } from 'lucide-react'

export const Route = createFileRoute('/about')({ component: AboutPage, head: () => pageMeta('/about') })

const valueMeta = [
  { icon: Leaf, key: 'eco', tone: 'bg-eden-ink' },
  { icon: MessageCircle, key: 'comm', tone: 'bg-eden-sage-dim' },
  { icon: Tag, key: 'price', tone: 'bg-eden-ink' },
  { icon: Sunrise, key: 'rest', tone: 'bg-eden-sage-dim' },
]

function AboutPage() {
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)
  const locationPhoto = useQuery(api.siteContent.getImage, { key: 'location.photo' })

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <section className="px-6 pb-6 pt-14 md:px-8">
        <h1 className="mb-3 font-serif text-3xl font-semibold">카페소개</h1>
        <p className="text-[15px] text-eden-sage-dim">이든이 걸어온 마음과 지키는 가치, 오시는 길까지 한 곳에 담았습니다.</p>
      </section>

      <section className="mx-auto max-w-xl px-6 py-16 md:px-8">
        <div className="border-t border-eden-line py-9">
          <div className="mb-3 font-serif text-lg font-semibold text-eden-sand">{cv('phil.label1')}</div>
          <p className="max-w-[46ch] text-[17px] leading-relaxed">{cv('phil.text1')}</p>
        </div>
        <div className="border-t border-b border-eden-line py-9">
          <div className="mb-3 font-serif text-lg font-semibold text-eden-sand">{cv('phil.label2')}</div>
          <p className="max-w-[46ch] text-[17px] leading-relaxed">{cv('phil.text2')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-8">
        <div className="mb-14 max-w-xl">
          <h2 className="mb-3 font-serif text-3xl font-semibold">{cv('values.title')}</h2>
          <p className="text-[15px] text-eden-sage-dim">{cv('values.subtitle')}</p>
        </div>
        <div className="grid grid-cols-2 gap-7 md:grid-cols-4">
          {valueMeta.map((v) => (
            <div key={v.key} className="text-center">
              <div className={`mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full ${v.tone}`}>
                <v.icon size={44} strokeWidth={1.6} className="text-eden-paper" />
              </div>
              <h3 className="mb-2 font-serif text-lg font-semibold">{cv(`value.${v.key}.title`)}</h3>
              <p className="text-sm text-eden-sage-dim">{cv(`value.${v.key}.desc`)}</p>
            </div>
          ))}
        </div>
        <p className="mt-14 text-center font-serif text-xl font-medium">{cv('values.tagline')}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-8">
        <h2 className="mb-14 font-serif text-3xl font-semibold">오시는 길</h2>
        <div className="grid grid-cols-1 border border-eden-line md:grid-cols-[1.2fr_1fr]">
          <div className="flex min-h-[280px] items-center justify-center overflow-hidden bg-eden-sage-dim">
            {locationPhoto ? (
              <img src={locationPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <MapPin size={40} strokeWidth={1.6} className="text-eden-paper" />
            )}
          </div>
          <div className="flex flex-col justify-center bg-eden-paper-dim p-10">
            <div className="mb-2 text-xs text-eden-sand">주소</div>
            <div className="mb-6 text-[16px]">{cv('location.addr')}</div>
            <div className="mb-6 border-y border-eden-line py-6 font-serif text-xl leading-relaxed">
              {cv('location.quote')}
            </div>
            <div className="text-sm text-eden-sage-dim">{cv('location.phone')}</div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
