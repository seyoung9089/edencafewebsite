import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useContentImage, useContentValue, useSiteContent } from '@/lib/site-content'
import { usePickupDates } from '@/lib/pickup'

function WaveBackground() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1440" height="900" fill="#CBD4C6" />
      <path d="M0 380C280 340 420 460 720 430C1020 400 1180 320 1440 360V900H0V380Z" fill="#AEBCAC" />
      <path d="M0 520C300 480 460 600 760 570C1060 540 1220 460 1440 500V900H0V520Z" fill="#7E9986" />
      <path d="M0 660C320 630 500 740 780 710C1080 680 1240 620 1440 650V900H0V660Z" fill="#3F5A4A" />
      {[80, 140, 1240, 1320, 1380].map((x, i) => (
        <g key={i} transform={`translate(${x} ${790 - (i % 2) * 20})`} opacity={0.55}>
          <path d="M18 0L36 34H0L18 0Z" fill="#16241F" />
          <path d="M18 14L34 44H2L18 14Z" fill="#16241F" />
        </g>
      ))}
    </svg>
  )
}

/**
 * Home first screen: the way into ordering. Kept short so the 주문 바로가기
 * button and the pickup basics are visible without scrolling, even on phones.
 */
export function HeroSection() {
  const heroImage = useContentImage('hero.photo')
  const bgPhoto = useContentImage('hero.bgPhoto')
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)
  const pickupTime = cv('pickup.time')
  const earliest = usePickupDates()?.dates.find((d) => d.open)

  return (
    // z-0 (not just "relative") is required here: without an explicit
    // z-index, this section doesn't establish its own stacking context,
    // so the -z-10 background layer below escapes it and paints behind
    // the page's own body background instead — i.e. invisible.
    <section className="relative z-0 overflow-hidden px-4 py-8 md:px-8 md:py-14">
      <div className="absolute inset-0 -z-10">
        {bgPhoto ? <img src={bgPhoto} alt="" className="h-full w-full object-cover" /> : <WaveBackground />}
      </div>

      <div className="relative mx-auto max-w-3xl rounded-card bg-eden-paper px-5 py-7 text-center shadow-[0_0_40px_0_rgba(14,27,22,0.18)] md:px-12 md:py-10">
        <p className="mb-5 text-[11px] tracking-[0.1em] text-eden-sage-dim md:text-xs">{cv('hero.eyebrow')}</p>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8 md:text-left">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-card shadow-soft md:h-32 md:w-32">
            {heroImage ? <img src={heroImage} alt="" className="h-full w-full object-cover" /> : <CabinIllustration />}
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold text-eden-sand">{cv('menuHome.title')}</div>
            <h1 className="font-serif text-2xl font-bold leading-snug md:text-3xl">미리 주문하고, 고른 날 찾아가세요</h1>
            <p className="mt-2 text-sm text-eden-sage-dim">{cv('menuHome.subtitle')}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            to="/order"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-eden-ink text-base font-semibold text-eden-paper shadow-soft transition-colors hover:bg-eden-ink-2 sm:w-auto sm:px-10"
          >
            마을 픽업 주문 <ArrowRight size={18} />
          </Link>
          <Link
            to="/parents"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-eden-ink text-base font-semibold text-eden-ink transition-colors hover:bg-eden-ink hover:text-eden-paper sm:w-auto sm:px-10"
          >
            학부모 주문 (금요일) <ArrowRight size={18} />
          </Link>
        </div>

        <ul className="mt-5 flex flex-wrap justify-center gap-2 text-[13px]">
          <li className="rounded-full bg-eden-sand/15 px-3 py-1.5">월~금 픽업</li>
          <li className="rounded-full bg-eden-sand/15 px-3 py-1.5">픽업 2일 전 자정까지 주문</li>
          {earliest ? (
            <li className="rounded-full bg-eden-sand/15 px-3 py-1.5">
              가장 빠른 픽업 <strong>{earliest.label}</strong>
            </li>
          ) : null}
          {pickupTime ? <li className="rounded-full bg-eden-sand/15 px-3 py-1.5">픽업 시간 {pickupTime}</li> : null}
        </ul>
      </div>
    </section>
  )
}

function CabinIllustration() {
  return (
    <svg viewBox="0 0 300 370" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <rect width="300" height="370" fill="#3F5A4A" />
      <polygon points="60,180 100,120 140,180" fill="none" stroke="#EDECE3" strokeWidth="2" />
      <polygon points="160,190 195,140 230,190" fill="none" stroke="#EDECE3" strokeWidth="2" />
      <polygon points="100,260 150,180 200,260" fill="#C7A96E" stroke="#16241F" strokeWidth="2" />
      <rect x="130" y="215" width="16" height="18" fill="#16241F" />
      <rect x="118" y="200" width="14" height="14" fill="#EDECE3" />
      <ellipse cx="90" cy="300" rx="32" ry="8" fill="#16241F" opacity="0.5" />
      <ellipse cx="210" cy="300" rx="32" ry="8" fill="#16241F" opacity="0.5" />
    </svg>
  )
}
