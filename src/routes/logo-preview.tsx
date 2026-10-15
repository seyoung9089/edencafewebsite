import { createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { LOGO_MARKS } from '@/components/logo-marks'

// Temporary page for choosing a logo mark. Remove once chosen.
export const Route = createFileRoute('/logo-preview')({
  component: LogoPreview,
  head: () => ({ meta: [{ title: '로고 시안 | 이든카페' }, { name: 'robots', content: 'noindex' }] }),
})

function Wordmark({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`flex items-center gap-2 font-logo text-xl font-bold ${dark ? 'text-eden-paper' : 'text-eden-ink'}`}>
      {children}
      이든카페
      <span className={`self-end pb-0.5 font-sans text-[10px] font-normal tracking-[0.16em] ${dark ? 'text-eden-sage' : 'text-eden-sage-dim'}`}>EDEN CAFE</span>
    </span>
  )
}

function LogoPreview() {
  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 md:px-8">
        <h1 className="mb-2 font-serif text-2xl font-semibold">로고 시안</h1>
        <p className="mb-8 text-sm text-eden-sage-dim">
          마음에 드는 시안(A~D)을 알려주세요. 고르신 로고는 왼쪽 위 이름 옆, 맨 아래 푸터, 브라우저 탭 아이콘에 넣을게요.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {LOGO_MARKS.map(({ id, label, note, Mark }) => (
            <section key={id} className="overflow-hidden rounded-card shadow-soft">
              <div className="bg-eden-paper-dim p-6">
                <h2 className="font-serif text-lg font-semibold">{label}</h2>
                <p className="mb-6 text-xs text-eden-sage-dim">{note}</p>
                <div className="mb-6 flex items-end gap-6 text-eden-ink">
                  <Mark size={96} />
                  <Mark size={48} />
                  <Mark size={24} />
                  <Mark size={16} />
                </div>
                <div className="rounded-[10px] bg-eden-paper px-5 py-4">
                  <Wordmark>
                    <Mark size={28} />
                  </Wordmark>
                </div>
              </div>
              <div className="bg-eden-ink-2 px-6 py-5 text-eden-paper">
                <Wordmark dark>
                  <Mark size={28} />
                </Wordmark>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
