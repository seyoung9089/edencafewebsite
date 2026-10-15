import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useContentValue, useSiteContent } from '@/lib/site-content'

/** Bank transfer details (editable in admin → 글귀 · 이미지 → 입금 계좌). */
export function usePayment() {
  const content = useSiteContent()
  const cv = (key: string) => useContentValue(content, key)
  const account = cv('payment.account')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account.replace(/[^0-9]/g, ''))
      toast.success('계좌번호를 복사했어요.')
    } catch {
      toast.error('복사하지 못했어요. 직접 입력해주세요.')
    }
  }
  return { bank: cv('payment.bank'), account, holder: cv('payment.holder'), note: cv('payment.note'), copy }
}

export function PaymentInfo({ total, className = '' }: { total: number; className?: string }) {
  const { bank, account, holder, note, copy } = usePayment()

  return (
    <div className={`rounded-[10px] bg-eden-sage-dim px-4 py-3 text-sm leading-relaxed text-eden-paper ${className}`}>
      <div className="flex flex-wrap items-center gap-x-2">
        <span>
          {bank} <strong>{account}</strong>
        </span>
        <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 text-xs text-eden-sand underline">
          <Copy size={12} />
          복사
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
