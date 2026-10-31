import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'
import { pageMeta } from '@/lib/seo'
import { rememberReturnTo } from '@/lib/return-to'
import { useSiteContent, useContentValue, ALL_NEWS_KEYS } from '@/lib/site-content'
import { toast } from 'sonner'

export const Route = createFileRoute('/support')({ component: SupportPage, head: () => pageMeta('/support') })
const categories = ['픽업문의','결제문의','시스템문의','이용문의','기타문의']
type Inquiry = { id: string; category: string; title: string; content: string; status: string; reply: string | null; created_at: string }

function SupportPage() {
  const { user, loading } = useCustomerAuth()
  const [category, setCategory] = useState(categories[0])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const siteContent = useSiteContent()
  const cv = (key: string) => useContentValue(siteContent, key)
  const load = async (id: string) => {
    const { data, error } = await supabase.from('inquiries').select('id,category,title,content,status,reply,created_at').eq('user_id', id).order('created_at', { ascending: false })
    setInquiries((data ?? []) as Inquiry[]); setError(error?.message ?? '')
  }
  useEffect(() => { if (user) void load(user.id); else setInquiries([]) }, [user?.id])
  const submit = async () => {
    if (!user || !title.trim() || !content.trim()) { toast.error('제목과 내용을 입력해주세요.'); return }
    setBusy(true)
    const { error } = await supabase.from('inquiries').insert({ user_id: user.id, category, title: title.trim(), content: content.trim() })
    setBusy(false)
    if (error) { toast.error(error.message); return }
    setTitle(''); setContent(''); toast.success('문의가 접수되었습니다.'); void load(user.id)
  }
  return <div className="min-h-screen bg-eden-paper text-eden-ink"><SiteHeader /><main className="mx-auto max-w-5xl px-6 pb-24 pt-[clamp(48px,7vw,96px)]">
    <p className="eyebrow mb-3">NEWS & QUESTIONS</p>
        <h1 className="mb-3 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">문의사항</h1>
    <p className="mb-10 text-[15px] text-eden-mute">이든의 새소식을 먼저 확인하시고, 궁금한 점은 아래에 남겨주세요.</p>

    <section className="mb-16">
      <h2 className="mb-4 font-serif text-xl font-light">새소식</h2>
      <div className="max-w-3xl">
        {ALL_NEWS_KEYS.map((k) => (
          <Link key={k} to="/news/$id" params={{ id: k }} className="group flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-eden-line py-4 last:border-b">
            <span className="rounded-full bg-eden-paper-dim px-3 py-1 text-xs font-semibold text-eden-ink">{cv(`news.${k}.tag`)}</span>
            <span className="min-w-0 flex-1 text-[15px] group-hover:text-eden-accent">{cv(`news.${k}.title`)}</span>
            <span className="text-sm text-eden-mute">{cv(`news.${k}.date`)}</span>
          </Link>
        ))}
      </div>
    </section>

    <section id="inquiry" className="scroll-mt-24">
    <h2 className="mb-2 font-serif text-xl font-light">문의하기</h2><p className="mb-6 text-[15px] text-eden-mute">궁금한 점을 남겨주시면 빠르게 답변드릴게요. 주문하는 방법은 <Link to="/guide" className="font-semibold text-eden-ink underline underline-offset-4">픽업 이용방법</Link>에도 정리해두었어요.</p>
    {loading ? <p>로그인 상태 확인 중…</p> : !user ? <div><p className="mb-4">로그인 후 문의를 남길 수 있어요.</p><Link to="/login" onClick={() => rememberReturnTo('/support')} className="inline-block bg-eden-accent px-7 py-3 text-white rounded-[3px] transition-colors hover:bg-eden-accent-d">로그인하기</Link></div> : <div className="grid gap-7 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-card bg-eden-paper-dim shadow-soft p-7"><label htmlFor="category" className="mb-2 block text-sm">문의 종류</label><select id="category" value={category} onChange={e => setCategory(e.target.value)} className="mb-5 w-full rounded-[2px] border border-eden-line bg-eden-paper p-3">{categories.map(c => <option key={c}>{c}</option>)}</select>
        <label htmlFor="title" className="mb-2 block text-sm">제목</label><input id="title" maxLength={100} value={title} onChange={e => setTitle(e.target.value)} className="mb-5 w-full rounded-[2px] border border-eden-line bg-eden-paper p-3" />
        <label htmlFor="content" className="mb-2 block text-sm">내용</label><textarea id="content" maxLength={3000} value={content} onChange={e => setContent(e.target.value)} className="mb-5 min-h-36 w-full rounded-[2px] border border-eden-line bg-eden-paper p-3" />
        <button onClick={() => void submit()} disabled={busy} className="bg-eden-accent px-7 py-3 text-white disabled:opacity-50 rounded-[3px] transition-colors hover:bg-eden-accent-d">{busy ? '등록 중…' : '등록하기'}</button></div>
      <div><h3 className="mb-4 font-serif text-lg">내 문의</h3>{error ? <p role="alert">{error}</p> : inquiries.length === 0 ? <p className="text-sm text-eden-mute">아직 등록한 문의가 없습니다.</p> : inquiries.map(q => <article key={q.id} className="mb-4 rounded-card bg-eden-paper-dim shadow-soft p-5"><strong>{q.title}</strong><p className="mt-2 text-xs text-eden-mute">{q.category} · {new Date(q.created_at).toLocaleDateString('ko-KR')} · {q.status === 'done' ? '답변완료' : '답변대기'}</p><p className="mt-3 whitespace-pre-wrap text-sm">{q.content}</p>{q.reply && <p className="mt-3 border-t border-eden-line pt-3 text-sm"><strong>이든 답변</strong><br />{q.reply}</p>}</article>)}</div>
    </div>}
    </section>
  </main><SiteFooter /></div>
}
