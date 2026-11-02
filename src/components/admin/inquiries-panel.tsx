import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { buttonClass, fetchCustomerLabels } from './use-staff'

type Inquiry = {
  id: string
  user_id: string
  title: string
  content: string
  category: string
  status: 'wait' | 'done'
  reply: string | null
  created_at: string
}

export function InquiriesPanel() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null)
  const [customers, setCustomers] = useState<Map<string, string>>(new Map())

  const refresh = async () => {
    const [{ data, error }, map] = await Promise.all([
      supabase.from('inquiries').select('id,user_id,title,content,category,status,reply,created_at').order('created_at', { ascending: false }),
      fetchCustomerLabels(),
    ])
    if (error) toast.error(error.message)
    // Unanswered first, newest first within each.
    setInquiries(((data ?? []) as Inquiry[]).sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done')))
    setCustomers(map)
  }
  useEffect(() => {
    void refresh()
  }, [])

  const saveReply = async (id: string, reply: string) => {
    const { error } = await supabase.from('inquiries').update({ reply, status: 'done' }).eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('답변을 저장했어요.')
      void refresh()
    }
  }

  if (!inquiries) return <p className="text-sm text-eden-sage-dim">불러오는 중…</p>
  if (inquiries.length === 0) return <p className="py-6 text-center text-sm text-eden-sage-dim">문의가 없어요.</p>
  return (
    <div className="space-y-3">
      {inquiries.map((q) => (
        <InquiryCard key={q.id} inquiry={q} email={customers.get(q.user_id) ?? q.user_id.slice(0, 8)} onSave={saveReply} />
      ))}
    </div>
  )
}

function InquiryCard({ inquiry, email, onSave }: { inquiry: Inquiry; email: string; onSave: (id: string, reply: string) => Promise<void> }) {
  const [reply, setReply] = useState(inquiry.reply ?? '')
  return (
    <article className="rounded-[10px] border border-eden-line bg-eden-paper p-5">
      <p className="mb-1 text-xs text-eden-sage-dim">
        {email} · {inquiry.category} · {new Date(inquiry.created_at).toLocaleDateString('ko-KR')} ·{' '}
        <span className={inquiry.status === 'done' ? '' : 'font-semibold text-eden-sand'}>{inquiry.status === 'done' ? '답변완료' : '답변대기'}</span>
      </p>
      <strong>{inquiry.title}</strong>
      <p className="mt-3 whitespace-pre-wrap text-sm">{inquiry.content}</p>
      <label htmlFor={`reply-${inquiry.id}`} className="mt-4 block text-sm">
        답변
      </label>
      <textarea
        id={`reply-${inquiry.id}`}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        className="mt-1 min-h-24 w-full rounded-[10px] border border-eden-line bg-eden-paper-dim p-3 text-sm"
      />
      <button disabled={!reply.trim()} onClick={() => void onSave(inquiry.id, reply.trim())} className={`mt-2 ${buttonClass}`}>
        답변 저장
      </button>
    </article>
  )
}
