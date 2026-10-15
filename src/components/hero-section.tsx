import { Link } from '@tanstack/react-router'
import { useContentImage, useContentValue, useSiteContent } from '@/lib/site-content'
import { useRef } from 'react'


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

export function HeroSection() {
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)
  const heroImage = useContentImage('hero.photo')
  const bgPhoto = useContentImage('hero.bgPhoto')
  const sectionRef = useRef<HTMLElement | null>(null)
  const frameRef = useRef<number | null>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rect = el.getBoundingClientRect()
    // -1..1 range from section center
    const px = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const py = ((e.clientY - rect.top) / rect.height - 0.5) * 2

    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      el.style.setProperty('--px', px.toFixed(3))
      el.style.setProperty('--py', py.toFixed(3))
    })
  }

  function handleMouseLeave() {
    const el = sectionRef.current
    if (!el) return
    el.style.setProperty('--px', '0')
    el.style.setProperty('--py', '0')
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      // z-0 (not just "relative") is required here: without an explicit
      // z-index, this section doesn't establish its own stacking context,
      // so the -z-10 background layer below escapes it and paints behind
      // the page's own body background instead — i.e. invisible.
      // More vertical padding on mobile so the background photo reads as
      // a clear margin around the card instead of a thin, easy-to-miss sliver.
      className="relative z-0 overflow-hidden px-4 pb-20 pt-14 md:px-8 md:pb-24 md:pt-12"
    >
      <div className="parallax-layer absolute inset-0 -z-10" style={{ '--depth': 6 } as React.CSSProperties}>
        {bgPhoto ? (
          <img src={bgPhoto} alt="" className="h-full w-full object-cover" />
        ) : (
          <WaveBackground />
        )}
      </div>

      <div className="relative mx-auto grid max-w-4xl items-center gap-8 rounded-card bg-eden-paper px-6 py-10 shadow-[0_0_40px_0_rgba(14,27,22,0.18)] md:grid-cols-[1fr_240px] md:px-12 md:py-14">
        <div className="text-center md:text-left">
          <p className="mb-4 text-sm text-eden-sage-dim">{cv('hero.eyebrow')}</p>
          <h1 className="hero-line font-serif text-3xl font-bold leading-snug md:text-5xl md:leading-tight">{cv('hero.title')}</h1>
          <p className="hero-line mt-4 text-lg md:text-xl" style={{ animationDelay: '120ms' }}>
            {cv('hero.subtitle')}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Link to="/menu" className="rounded-full bg-eden-ink px-8 py-4 text-center text-lg font-semibold text-eden-paper shadow-soft hover:bg-eden-ink-2">
              메뉴 보고 주문하기
            </Link>
            <Link to="/about" className="rounded-full border border-eden-line px-8 py-4 text-center text-lg font-semibold hover:border-eden-ink">
              카페 소개
            </Link>
          </div>
        </div>
        <div className="mx-auto aspect-[3/3.7] w-40 overflow-hidden rounded-card shadow-[0_0_30px_0_rgba(14,27,22,0.3)] md:w-full">
          {heroImage ? <img src={heroImage} alt="" className="h-full w-full object-cover" /> : <CabinIllustration />}
        </div>
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
