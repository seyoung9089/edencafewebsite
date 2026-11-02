import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useContentValue, useSiteContent } from '@/lib/site-content'

/** Copies text, falling back to a hidden textarea where the Clipboard API is unavailable. */
async function copyText(text: string, near: HTMLElement | null): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    // Older browsers / non-secure pages. Put the textarea next to the button so
    // an open dialog's focus trap doesn't block the selection.
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    ;(near ?? document.body).appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    if (!ok) throw new Error('copy failed')
  }
}

/** Bank transfer details (editable in admin → 글귀 · 이미지 → 입금 계좌). */
export function usePayment() {
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)
  const account = cv('payment.account')
  // Shown on the button itself: a toast can end up hidden behind an open dialog.
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])
  const copy = async (near?: HTMLElement | null) => {
    try {
      await copyText(account.replace(/[^0-9]/g, ''), near ?? null)
      setCopied(true)
    } catch {
      toast.error('복사하지 못했어요. 계좌번호를 직접 입력해주세요.')
    }
  }
  return { bank: cv('payment.bank'), account, holder: cv('payment.holder'), note: cv('payment.note'), copy, copied }
}

/** Small "복사" pill that turns into "복사됨" for a moment after copying. */
export function CopyLabel({ copied, className = '' }: { copied: boolean; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${copied ? 'bg-eden-sand text-eden-ink-2' : 'bg-eden-sand/15 text-eden-sand'} ${className}`}>
      {copied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
      {copied ? '복사됨' : '복사'}
    </span>
  )
}

export function PaymentInfo({ total, className = '' }: { total: number; className?: string }) {
  const { bank, account, holder, note, copy, copied } = usePayment()

  return (
    <div className={`rounded-[10px] bg-eden-sage-dim px-4 py-3 text-sm leading-relaxed text-eden-paper ${className}`}>
      <div className="flex flex-wrap items-center gap-x-2">
        <span>
          {bank} <strong>{account}</strong>
        </span>
        <button type="button" onClick={(e) => void copy(e.currentTarget)} aria-label="계좌번호 복사">
          <CopyLabel copied={copied} />
        </button>
      </div>
      <div>예금주 {holder}</div>
      <div>
        입금금액 <strong>{total.toLocaleString('ko-KR')}원</strong>
      </div>
      <div className="mt-1 text-xs opacity-80">{note}</div>
    </div>
  )
}
