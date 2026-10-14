import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRef } from 'react'

const heroLines = [
  { text: 'Eden Cafe', featured: true },
  { text: 'Honest & Comfortable' },
  { text: 'Started in 2021' },
  { text: 'as a School Project' },
  { text: 'Baked Fresh Every Morning' },
  { text: 'Brewed with Honest Hearts' },
  { text: 'A Small Rest, Like Eden' },
  { text: 'Chungnam, Geumsan' },
]

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
  const heroImage = useQuery(api.siteContent.getImage, { key: 'hero.photo' })
  const bgPhoto = useQuery(api.siteContent.getImage, { key: 'hero.bgPhoto' })
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

      <div className="relative mx-auto max-w-3xl rounded-card bg-eden-paper px-6 pb-14 pt-10 shadow-[0_0_40px_0_rgba(14,27,22,0.18)] md:px-14 md:pt-12">
        <p className="mb-8 text-center text-xs tracking-[0.1em] text-eden-sage-dim">
          별무리고등학교에서 시작된 카페 협동조합 · Since 2021
        </p>

        <div className="relative mx-auto max-w-xl py-4 text-center">
          <div className="relative z-0">
            {heroLines.map((line, i) => (
              <p
                key={i}
                className={`hero-line ${
                  line.featured
                    ? 'font-serif text-2xl font-bold text-eden-sand md:text-4xl'
                    : 'font-serif text-2xl font-semibold text-eden-ink md:text-4xl'
                }`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {line.text}
              </p>
            ))}
          </div>
          <div className="absolute left-1/2 top-1/2 z-10 aspect-[3/3.7] w-[46%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-card shadow-[0_0_30px_0_rgba(14,27,22,0.3)]">
            {heroImage ? (
              <img src={heroImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <CabinIllustration />
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link to="/menu" className="rounded-full bg-eden-ink px-9 py-3 text-sm font-semibold text-eden-paper shadow-soft hover:-translate-y-0.5 hover:bg-eden-ink-2">
            메뉴 보기
          </Link>
          <span className="text-[11px] tracking-[0.2em] text-eden-sage-dim">SCROLL</span>
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
