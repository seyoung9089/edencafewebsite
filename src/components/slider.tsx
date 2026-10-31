import { useState, type ReactNode } from 'react'

/** One slide at a time, with big arrow buttons and dots underneath. */
export function Slider({ slides, label }: { slides: ReactNode[]; label: string }) {
  const [index, setIndex] = useState(0)
  const count = slides.length
  if (!count) return null
  const go = (i: number) => setIndex((i + count) % count)
  const nav =
    'absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl leading-none text-eden-ink shadow-[0_2px_10px_rgba(0,0,0,.15)]'

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((slide, i) => (
            <div key={i} className="min-w-0 flex-[0_0_100%]" aria-hidden={i !== index}>
              {slide}
            </div>
          ))}
        </div>
      </div>
      {count > 1 ? (
        <>
          <button type="button" className={`${nav} left-2.5`} aria-label="이전" onClick={() => go(index - 1)}>
            ‹
          </button>
          <button type="button" className={`${nav} right-2.5`} aria-label="다음" onClick={() => go(index + 1)}>
            ›
          </button>
          <div className="mt-4 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}번째`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={`h-2.5 rounded-full p-0 transition-all ${i === index ? 'w-6 bg-eden-accent' : 'w-2.5 bg-eden-line'}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
