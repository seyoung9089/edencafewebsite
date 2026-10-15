import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'
import { pageMeta } from '@/lib/seo'
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
  return <div className="min-h-screen bg-eden-paper text-eden-ink"><SiteHeader /><main className="mx-auto max-w-5xl px-6 pb-24 pt-14">
    <h1 className="mb-3 font-serif text-3xl font-semibold">문의하기</h1><p className="mb-8 text-base text-eden-sage-dim">궁금한 점을 남겨주시면 빠르게 답변드릴게요.</p>
    {loading ? <p>로그인 상태 확인 중…</p> : !user ? <div><p className="mb-4">로그인 후 문의를 남길 수 있어요.</p><Link to="/login" className="inline-block bg-eden-ink px-7 py-3 text-eden-paper rounded-full transition-colors hover:bg-eden-ink-2">이메일 로그인</Link></div> : <div className="grid gap-7 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-card bg-eden-paper-dim shadow-soft p-7"><label htmlFor="category" className="mb-2 block text-sm">문의 종류</label><select id="category" value={category} onChange={e => setCategory(e.target.value)} className="mb-5 w-full rounded-[10px] border border-eden-line bg-eden-paper p-3">{categories.map(c => <option key={c}>{c}</option>)}</select>
        <label htmlFor="title" className="mb-2 block text-sm">제목</label><input id="title" maxLength={100} value={title} onChange={e => setTitle(e.target.value)} className="mb-5 w-full rounded-[10px] border border-eden-line bg-eden-paper p-3" />
        <label htmlFor="content" className="mb-2 block text-sm">내용</label><textarea id="content" maxLength={3000} value={content} onChange={e => setContent(e.target.value)} className="mb-5 min-h-36 w-full rounded-[10px] border border-eden-line bg-eden-paper p-3" />
        <button onClick={() => void submit()} disabled={busy} className="bg-eden-ink px-7 py-3 text-eden-paper disabled:opacity-50 rounded-full transition-colors hover:bg-eden-ink-2">{busy ? '등록 중…' : '등록하기'}</button></div>
      <div><h2 className="mb-4 font-serif text-xl">내 문의</h2>{error ? <p role="alert">{error}</p> : inquiries.length === 0 ? <p className="text-sm text-eden-sage-dim">아직 등록한 문의가 없습니다.</p> : inquiries.map(q => <article key={q.id} className="mb-4 rounded-card bg-eden-paper-dim shadow-soft p-5"><strong>{q.title}</strong><p className="mt-2 text-xs text-eden-sage-dim">{q.category} · {new Date(q.created_at).toLocaleDateString('ko-KR')} · {q.status === 'done' ? '답변완료' : '답변대기'}</p><p className="mt-3 whitespace-pre-wrap text-sm">{q.content}</p>{q.reply && <p className="mt-3 border-t border-eden-line pt-3 text-sm"><strong>이든 답변</strong><br />{q.reply}</p>}</article>)}</div>
    </div>}
  </main><SiteFooter /></div>
}
