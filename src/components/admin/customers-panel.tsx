import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fetchCustomers, inputClass, type Customer } from './use-staff'

type Row = Customer & { orders: number; spent: number; lastOrder: string | null }

export function CustomersPanel() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    void (async () => {
      const [customers, { data, error }] = await Promise.all([
        fetchCustomers(),
        supabase.from('orders').select('user_id,total,created_at'),
      ])
      if (error) toast.error(error.message)
      const stats = new Map<string, { orders: number; spent: number; lastOrder: string | null }>()
      for (const o of data ?? []) {
        const s = stats.get(o.user_id) ?? { orders: 0, spent: 0, lastOrder: null }
        s.orders += 1
        s.spent += o.total
        if (!s.lastOrder || o.created_at > s.lastOrder) s.lastOrder = o.created_at
        stats.set(o.user_id, s)
      }
      setRows(
        customers
          .map((c) => ({ ...c, ...(stats.get(c.id) ?? { orders: 0, spent: 0, lastOrder: null }) }))
          .sort((a, b) => (b.lastOrder ?? '').localeCompare(a.lastOrder ?? '') || a.email.localeCompare(b.email)),
      )
    })()
  }, [])

  if (!rows) return <p className="text-sm text-eden-sage-dim">불러오는 중…</p>
  const q = query.trim().toLowerCase()
  const shown = q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)) : rows

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-eden-sage-dim">
          가입한 고객 {rows.length}명 · 이름은 고객이 가입할 때나 내 주문에서 입력해요.
        </p>
        <input aria-label="고객 검색" placeholder="이름 · 이메일 검색" value={query} onChange={(e) => setQuery(e.target.value)} className={`w-56 ${inputClass}`} />
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-eden-line bg-eden-paper">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-eden-line text-left text-xs text-eden-sage-dim">
            <tr>
              <th className="px-4 py-3 font-normal">이름</th>
              <th className="px-4 py-3 font-normal">이메일</th>
              <th className="px-4 py-3 text-right font-normal">주문</th>
              <th className="px-4 py-3 text-right font-normal">총 주문 금액</th>
              <th className="px-4 py-3 text-right font-normal">최근 주문</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-eden-line">
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold">{r.name || <span className="font-normal text-eden-sage-dim">(이름 없음)</span>}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3 text-right">{r.orders}건</td>
                <td className="px-4 py-3 text-right">{r.spent.toLocaleString('ko-KR')}원</td>
                <td className="px-4 py-3 text-right text-eden-sage-dim">{r.lastOrder ? new Date(r.lastOrder).toLocaleDateString('ko-KR') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 ? <p className="py-6 text-center text-sm text-eden-sage-dim">해당하는 고객이 없어요.</p> : null}
      </div>
    </div>
  )
}
