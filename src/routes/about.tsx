import { createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useSiteContent, useContentValue, useContentImage } from '@/lib/site-content'
import { pageMeta } from '@/lib/seo'
import { Leaf, MessageCircle, Tag, Sunrise, MapPin } from 'lucide-react'

export const Route = createFileRoute('/about')({ component: AboutPage, head: () => pageMeta('/about') })

const valueMeta = [
  { icon: Leaf, key: 'eco', tone: 'bg-eden-accent' },
  { icon: MessageCircle, key: 'comm', tone: 'bg-eden-mute' },
  { icon: Tag, key: 'price', tone: 'bg-eden-accent' },
  { icon: Sunrise, key: 'rest', tone: 'bg-eden-mute' },
]

const historyMeta = [
  { year: '2021', key: 'h1' },
  { year: '2022', key: 'h2' },
  { year: '2023', key: 'h3' },
  { year: '2024–2025', key: 'h4' },
  { year: '2026', key: 'h5', latest: true },
]

function AboutPage() {
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)
  const locationPhoto = useContentImage('location.photo')
  const historyPhoto = useContentImage('history.photo')

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <section className="px-6 pb-6 pt-[clamp(48px,7vw,96px)] md:px-8">
        <p className="eyebrow mb-3">별무리마을 협동조합</p>
        <h1 className="mb-3 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">카페소개</h1>
        <p className="text-[15px] text-eden-mute">이든이 걸어온 마음과 지키는 가치, 지나온 시간과 오시는 길까지 한 곳에 담았습니다.</p>
      </section>

      <section className="mx-auto max-w-xl px-6 py-16 md:px-8">
        <div className="border-t border-eden-line py-9">
          <div className="mb-3 font-myeongjo text-lg font-bold text-eden-accent">{cv('phil.label1')}</div>
          <p className="max-w-[46ch] text-[17px] leading-relaxed">{cv('phil.text1')}</p>
        </div>
        <div className="border-t border-b border-eden-line py-9">
          <div className="mb-3 font-myeongjo text-lg font-bold text-eden-accent">{cv('phil.label2')}</div>
          <p className="max-w-[46ch] text-[17px] leading-relaxed">{cv('phil.text2')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-8">
        <div className="mb-14 max-w-xl">
          <h2 className="mb-3 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">{cv('values.title')}</h2>
          <p className="text-[15px] text-eden-mute">{cv('values.subtitle')}</p>
        </div>
        <div className="grid grid-cols-2 gap-7 md:grid-cols-4">
          {valueMeta.map((v) => (
            <div key={v.key} className="text-center">
              <div className={`mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full ${v.tone}`}>
                <v.icon size={44} strokeWidth={1.6} className="text-eden-paper" />
              </div>
              <h3 className="mb-2 font-serif text-lg font-light">{cv(`value.${v.key}.title`)}</h3>
              <p className="text-sm text-eden-mute">{cv(`value.${v.key}.desc`)}</p>
            </div>
          ))}
        </div>
        <p className="mt-14 text-center font-serif text-xl font-light">{cv('values.tagline')}</p>
      </section>

      <section id="history" className="mx-auto max-w-6xl px-6 pb-24 md:px-8">
        <div className="mb-14 max-w-xl">
          <h2 className="mb-3 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">{cv('history.title')}</h2>
          <p className="text-[15px] text-eden-mute">{cv('history.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-10 md:flex-row md:items-start">
          <div className="relative flex-1 border-l border-eden-mute/30 pl-9">
            {historyMeta.map((h) => (
              <div key={h.year} className="relative pb-12 last:pb-0">
                <span
                  className={`absolute -left-[41px] top-1 h-2.5 w-2.5 rounded-full border-2 ${
                    h.latest ? 'border-eden-accent bg-eden-accent' : 'border-eden-mute bg-eden-paper'
                  }`}
                />
                <div className="mb-2 font-serif text-xl font-light text-eden-accent">{h.year}</div>
                <p className="max-w-[48ch] text-[15px]">{cv(`history.${h.key}`)}</p>
              </div>
            ))}
          </div>
          <div className="h-[220px] w-full flex-shrink-0 overflow-hidden rounded-card bg-eden-mute shadow-soft md:w-[280px]">
            {historyPhoto ? (
              <img src={historyPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-eden-paper/60">사진 없음</div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-8">
        <h2 className="mb-14 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">오시는 길</h2>
        <div className="grid grid-cols-1 overflow-hidden rounded-card shadow-soft md:grid-cols-[1.2fr_1fr]">
          <div className="flex min-h-[280px] items-center justify-center overflow-hidden bg-eden-mute">
            {locationPhoto ? (
              <img src={locationPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <MapPin size={40} strokeWidth={1.6} className="text-eden-paper" />
            )}
          </div>
          <div className="flex flex-col justify-center bg-eden-paper-dim p-10">
            <div className="mb-2 text-xs text-eden-accent">주소</div>
            <div className="mb-6 text-[16px]">{cv('location.addr')}</div>
            <div className="mb-6 border-y border-eden-line py-6 font-serif text-xl leading-relaxed">
              {cv('location.quote')}
            </div>
            <div className="text-sm text-eden-mute">{cv('location.phone')}</div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
