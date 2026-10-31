import { Link } from '@tanstack/react-router'
import { Leaf } from 'lucide-react'

// Wired as router-level `defaultNotFoundComponent` (see ../router.tsx) so it
// catches both unmatched URLs and `throw notFound()` from loaders/beforeLoad.
//
// Do NOT call `Route.useLoaderData()` here — the loader may not have completed
// when the not-found boundary renders. Safe hooks: `useParams`, `useSearch`,
// `useRouteContext`. To forward partial data, throw `notFound({ data: ... })`
// and read it from the `data` prop (typed as `unknown` — validate before use).
export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-eden-paper px-6 text-center text-eden-ink">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-eden-accent">
        <Leaf size={32} strokeWidth={1.6} className="text-eden-paper" />
      </div>
      <div>
        <div className="mb-2 eyebrow">404</div>
        <h1 className="mb-3 font-serif text-2xl font-light md:text-3xl">페이지를 찾을 수 없습니다</h1>
        <p className="max-w-[38ch] text-[15px] text-eden-mute">
          주소가 바뀌었거나 존재하지 않는 페이지입니다. 이든카페 메인으로 돌아가 다시 둘러보시기 바랍니다.
        </p>
      </div>
      <Link
        to="/"
        className="mt-2 inline-block rounded-[3px] bg-eden-accent px-9 py-3 text-sm font-semibold text-white hover:bg-eden-accent-d"
      >
        메인으로 돌아가기
      </Link>
    </div>
  )
}
