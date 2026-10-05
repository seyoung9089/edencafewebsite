import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { GoogleAuthButton } from '@/components/google-auth-button'
import { getErrorMessage } from '@/lib/errors'
import { pageMeta } from '@/lib/seo'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/support')({ component: SupportPage, head: () => pageMeta('/support') })

const CATEGORIES = ['픽업문의', '결제문의', '시스템문의', '이용문의', '기타문의']

function SupportPage() {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const create = useMutation(api.inquiries.create)
  const mine = useQuery(api.inquiries.listMine)

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요.')
      return
    }
    setSubmitting(true)
    try {
      await create({ category, title, content })
      setTitle('')
      setContent('')
      toast.success('문의가 접수되었습니다.')
    } catch (e) {
      toast.error(getErrorMessage(e, '문의 등록에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <section className="px-6 pb-24 pt-14 md:px-8">
        <h1 className="mb-3 font-serif text-3xl font-semibold">문의하기</h1>
        <p className="mb-8 text-[15px] text-eden-sage-dim">궁금한 점을 남겨주시면 빠르게 답변드릴게요.</p>

        <div className="mb-8 flex flex-wrap gap-2.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-5 py-2.5 text-sm ${
                category === c ? 'bg-eden-ink text-eden-paper' : 'border border-eden-line bg-eden-paper text-eden-sage-dim'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <AuthLoading><div className="h-40 max-w-3xl animate-pulse bg-eden-line" /></AuthLoading>
        <Unauthenticated>
          <div className="max-w-sm">
            <p className="mb-4 text-sm text-eden-sage-dim">로그인 후 문의를 남길 수 있어요.</p>
            <GoogleAuthButton className="w-full" />
          </div>
        </Unauthenticated>

        <Authenticated>
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.3fr_1fr]">
            <div className="border border-eden-line bg-eden-paper-dim p-8">
              <label className="mb-1.5 block text-xs text-eden-sage-dim">카테고리</label>
              <input readOnly value={category} className="mb-5 w-full border border-eden-line bg-eden-paper px-3.5 py-2.5 text-sm" />
              <label className="mb-1.5 block text-xs text-eden-sage-dim">제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력해주세요"
                className="mb-5 w-full border border-eden-line bg-eden-paper px-3.5 py-2.5 text-sm"
              />
              <label className="mb-1.5 block text-xs text-eden-sage-dim">내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="문의 내용을 자세히 작성해주세요."
                className="mb-5 min-h-[140px] w-full border border-eden-line bg-eden-paper px-3.5 py-2.5 text-sm"
              />
              <button onClick={() => void submit()} disabled={submitting} className="bg-eden-ink px-6 py-3 text-sm font-medium text-eden-paper disabled:opacity-50">
                {submitting ? '등록 중…' : '등록하기'}
              </button>
            </div>

            <div>
              {!mine || !mine.ok ? (
                <p className="text-sm text-eden-sage-dim">불러오는 중…</p>
              ) : mine.items.length === 0 ? (
                <p className="text-sm text-eden-sage-dim">아직 등록한 문의가 없습니다.</p>
              ) : (
                mine.items.map((q) => (
                  <div key={q._id} className="mb-3.5 border border-eden-line bg-eden-paper-dim p-5">
                    <div className="mb-2.5 text-sm font-semibold">{q.title}</div>
                    <div className="mb-3 flex gap-2">
                      <span className="rounded-sm bg-eden-sage-dim px-2.5 py-1 text-[10.5px] text-eden-paper">{q.category}</span>
                      <span className={`rounded-sm px-2.5 py-1 text-[10.5px] ${q.status === 'done' ? 'bg-eden-sage text-eden-ink-2' : 'bg-eden-sand text-eden-ink-2'}`}>
                        {q.status === 'done' ? '답변완료' : '답변대기'}
                      </span>
                    </div>
                    {q.reply ? (
                      <div className="border-t border-eden-line pt-3 text-xs leading-relaxed text-eden-sage-dim">
                        <span className="mr-1.5 font-semibold text-eden-sand">이든 답변</span>
                        {q.reply}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </Authenticated>
      </section>
      <SiteFooter />
    </div>
  )
}
