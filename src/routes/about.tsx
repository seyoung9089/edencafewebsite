import { createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useSiteContent, useContentValue, useContentImage } from '@/lib/site-content'
import { pageMeta } from '@/lib/seo'

export const Route = createFileRoute('/about')({ component: AboutPage, head: () => pageMeta('/about') })

const valueKeys = ['eco', 'comm', 'price', 'rest']

const historyMeta = [
  { year: '2021', key: 'h1' },
  { year: '2022', key: 'h2' },
  { year: '2023', key: 'h3' },
  { year: '2024–2025', key: 'h4' },
  { year: '2026', key: 'h5' },
]

const sectionGap = 'pt-[clamp(72px,9vw,140px)]'
const h2 = 'font-serif text-[clamp(1.9rem,3vw,2.8rem)] font-light leading-tight'

function AboutPage() {
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)
  const locationPhoto = useContentImage('location.photo')
  const historyPhoto = useContentImage('history.photo')

  return (
    <div className="min-h-svh bg-eden-paper text-eden-ink">
      <SiteHeader />

      {/* Title, then what the name means and how the bread is made. */}
      <section className="pad grid gap-10 pt-[clamp(48px,7vw,96px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <h1 className="mb-5 font-serif text-[clamp(2.2rem,4.4vw,3.8rem)] font-light leading-[1.2]">카페소개</h1>
          <p className="max-w-[34ch] text-[1.15rem] leading-relaxed">
            별무리마을 협동조합 카페 이든이 걸어온 마음과 지키는 가치, 지나온 시간과 오시는 길까지 한 곳에 담았습니다.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {(['1', '2'] as const).map((n) => (
            <div key={n} className="bg-eden-paper-dim px-7 py-8">
              <h2 className="mb-3 font-serif text-[1.4rem] font-normal text-eden-accent">{cv(`phil.label${n}`)}</h2>
              <p className="max-w-[46ch] text-[1.1rem] leading-relaxed">{cv(`phil.text${n}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Four values as a list set in large type. */}
      <section className={`pad ${sectionGap}`}>
        <div className="mb-10 max-w-xl">
          <h2 className={`${h2} mb-3`}>{cv('values.title')}</h2>
          <p className="text-[1.1rem]">{cv('values.subtitle')}</p>
        </div>
        <dl className="grid gap-x-16 md:grid-cols-2">
          {valueKeys.map((k) => (
            <div key={k} className="grid gap-2 py-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
              <dt className="font-serif text-[clamp(1.6rem,2.4vw,2.1rem)] font-light leading-tight text-eden-accent">{cv(`value.${k}.title`)}</dt>
              <dd className="text-[1.05rem] leading-relaxed sm:pt-1.5">{cv(`value.${k}.desc`)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 bg-eden-accent px-7 py-8 font-serif text-[clamp(1.3rem,2vw,1.7rem)] font-light text-white">{cv('values.tagline')}</p>
      </section>

      {/* History: year and line, with the photo beside it once there is one. */}
      <section id="history" className={`pad ${sectionGap}`}>
        <div className="mb-10 max-w-xl">
          <h2 className={`${h2} mb-3`}>{cv('history.title')}</h2>
          <p className="text-[1.1rem]">{cv('history.subtitle')}</p>
        </div>
        <div className={historyPhoto ? 'grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16' : ''}>
          <ol className="flex flex-col gap-2">
            {historyMeta.map((h) => (
              <li key={h.year} className="grid gap-1 bg-eden-paper-dim px-7 py-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-baseline sm:gap-6">
                <span className="font-serif text-[1.5rem] font-light text-eden-accent">{h.year}</span>
                <span className="text-[1.05rem] leading-relaxed">{cv(`history.${h.key}`)}</span>
              </li>
            ))}
          </ol>
          {historyPhoto ? <img src={historyPhoto} alt="" className="aspect-[4/3] w-full object-cover" /> : null}
        </div>
      </section>

      {/* Where to find us. */}
      <section className={`pad pb-[clamp(72px,9vw,140px)] ${sectionGap}`}>
        <h2 className={`${h2} mb-10`}>오시는 길</h2>
        <div className={`grid ${locationPhoto ? 'md:grid-cols-[1.2fr_1fr]' : ''}`}>
          {locationPhoto ? <img src={locationPhoto} alt="" className="h-full min-h-[280px] w-full object-cover" /> : null}
          <div className="flex flex-col justify-center gap-6 bg-eden-ink px-[clamp(28px,4vw,56px)] py-[clamp(36px,5vw,64px)] text-eden-paper">
            <div>
              <div className="mb-1 text-[1rem] text-eden-mute-2">주소</div>
              <div className="text-[clamp(1.2rem,1.8vw,1.5rem)]">{cv('location.addr')}</div>
            </div>
            <p className="max-w-[36ch] font-serif text-[clamp(1.3rem,2vw,1.7rem)] font-light leading-relaxed">{cv('location.quote')}</p>
            <div className="text-[1.05rem] text-eden-mute-2">{cv('location.phone')}</div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
