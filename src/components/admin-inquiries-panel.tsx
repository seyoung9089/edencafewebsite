import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getErrorMessage } from '@/lib/errors'
import { useState } from 'react'
import { toast } from 'sonner'

function InquiryRow({ inquiry }: { inquiry: any }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(inquiry.reply ?? '')
  const [saving, setSaving] = useState(false)
  const reply = useMutation(api.inquiries.reply)

  const submit = async () => {
    setSaving(true)
    try {
      await reply({ id: inquiry._id, reply: text })
      toast.success('답변이 등록되었습니다.')
      setOpen(false)
    } catch (e) {
      toast.error(getErrorMessage(e, '답변 등록에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-3.5 border border-eden-line bg-eden-paper p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="mr-2 rounded-sm bg-eden-sage-dim px-2.5 py-1 text-[10.5px] text-eden-paper">{inquiry.category}</span>
          <span className="text-sm font-semibold">{inquiry.title}</span>
          <div className="mt-1.5 text-[11.5px] text-eden-sage-dim">{inquiry.authorName}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`rounded-full px-3.5 py-1 text-[11px] font-bold ${inquiry.status === 'done' ? 'bg-eden-sage text-eden-ink-2' : 'bg-eden-sand text-eden-ink-2'}`}>
            {inquiry.status === 'done' ? '답변완료' : '답변대기'}
          </span>
          <button onClick={() => setOpen((o) => !o)} className="border border-eden-sand px-3 py-1.5 text-xs text-eden-sand">
            답변 보기/수정
          </button>
        </div>
      </div>
      {open ? (
        <div className="mt-4 border-t border-eden-line pt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="답변을 입력해주세요"
            className="mb-3 min-h-[80px] w-full border border-eden-line bg-eden-paper-dim px-3 py-2 text-sm"
          />
          <button onClick={() => void submit()} disabled={saving} className="bg-eden-ink px-5 py-2 text-xs font-medium text-eden-paper disabled:opacity-50">
            {saving ? '등록 중…' : '답변 등록'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function AdminInquiriesPanel() {
  const result = useQuery(api.inquiries.listAll)

  return (
    <div>
      <h3 className="mb-5 font-serif text-lg font-semibold">문의 관리</h3>
      {!result || !result.ok ? (
        <p className="text-sm text-eden-sage-dim">불러오는 중…</p>
      ) : result.items.length === 0 ? (
        <p className="text-sm text-eden-sage-dim">아직 등록된 문의가 없습니다.</p>
      ) : (
        result.items.map((q) => <InquiryRow key={q._id} inquiry={q} />)
      )}
    </div>
  )
}
