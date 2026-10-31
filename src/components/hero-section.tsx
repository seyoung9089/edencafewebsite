import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useContentImage } from '@/lib/site-content'

/**
 * Home first screen, under the see-through header: the cafe's own photo
 * when one is uploaded (with a dark scrim so the words stay readable),
 * otherwise a flat field of the brown ink. The line is set large, and the
 * two ways to order stay on the first screen, even on phones.
 */
export function HeroSection() {
  const bgOnly = useContentImage('hero.bgPhoto')
  const photo = useContentImage('hero.photo')
  const bgPhoto = bgOnly ?? photo

  return (
    <section className="relative flex min-h-[88svh] flex-col justify-center overflow-hidden bg-eden-ink text-white">
      {bgPhoto ? (
        <>
          <img src={bgPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(27,20,16,.72),rgba(27,20,16,.3)_75%)]" />
        </>
      ) : null}

      <div className="pad relative z-10 w-full pb-[70px] pt-[calc(4rem+40px)]">
        <h1 className="text-[clamp(2.3rem,5.6vw,5rem)] leading-[1.18] tracking-[-0.03em]">
          미리 주문하고,
          <br />
          고른 날 찾아가실 수 있습니다.
        </h1>
        <p className="mb-10 mt-6 max-w-[34ch] text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-white/90">
          별무리마을 협동조합 카페, 이든카페의 빵 픽업 주문입니다.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/order" className="btn">
            마을 픽업 주문 <ArrowRight size={18} />
          </Link>
          <Link to="/parents" className="btn ivory">
            학부모 주문 (금요일) <ArrowRight size={18} />
          </Link>
        </div>

        <Link to="/gifts" className="mt-4 inline-flex items-center gap-1.5 text-[1rem] text-white/90 underline underline-offset-[5px] hover:text-white">
          모임·행사 답례품도 예약받습니다 <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}
