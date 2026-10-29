import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useContentImage, useContentValue, useSiteContent } from '@/lib/site-content'
import { usePickupDates } from '@/lib/pickup'

/**
 * Home first screen, under the see-through header: a warm photo (or a
 * bread-coloured gradient until one is uploaded), the line, and the two ways
 * to order. The buttons stay on the first screen, even on phones.
 */
export function HeroSection() {
  const bgOnly = useContentImage('hero.bgPhoto')
  const photo = useContentImage('hero.photo')
  const bgPhoto = bgOnly ?? photo
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)
  const pickupTime = cv('pickup.time')
  const earliest = usePickupDates()?.dates.find((d) => d.open)

  return (
    <section className="relative flex min-h-[88svh] flex-col justify-center overflow-hidden text-white">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 74% 40%,#E9C79A 0,#B9824F 22%,transparent 46%),radial-gradient(circle at 60% 64%,#F4E3C4 0,#D9A86C 14%,transparent 30%),linear-gradient(135deg,#5A3B2A,#2A1C14 70%)',
        }}
      />
      {bgPhoto ? <img src={bgPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(27,20,16,.7),rgba(27,20,16,.25)_75%)]" />

      <div className="pad relative z-10 max-w-[1000px] pb-[70px] pt-[calc(4rem+40px)]">
        <p className="eyebrow !text-white">EDEN CAFE · 별무리마을</p>
        <h1 className="mb-7 mt-4 text-[clamp(2.1rem,4.4vw,3.6rem)] leading-[1.3]">
          미리 주문하고,
          <br />
          <em className="font-normal not-italic">고른 날</em> 찾아가세요.
        </h1>
        <p className="mb-8 max-w-[34ch] text-[1.05rem] leading-relaxed text-white/90">{cv('hero.eyebrow')}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/order" className="btn">
            마을 픽업 주문 <ArrowRight size={18} />
          </Link>
          <Link to="/parents" className="btn ivory">
            학부모 주문 (금요일) <ArrowRight size={18} />
          </Link>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem] text-white/90">
          <li>월~금 픽업</li>
          <li>픽업 2일 전 자정까지 주문</li>
          {earliest ? (
            <li>
              가장 빠른 픽업 <strong className="text-white">{earliest.label}</strong>
            </li>
          ) : null}
          {pickupTime ? <li>픽업 시간 {pickupTime}</li> : null}
        </ul>
      </div>
    </section>
  )
}
