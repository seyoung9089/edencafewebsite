import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useCurrentPickupSlot } from '@/lib/pickup'
import { fetchCustomerLabels } from './use-staff'

type Order = {
  id: string
  user_id: string
  items: { name: string; qty: number; price: number }[]
  total: number
  status: 'wait' | 'done' | 'picked' | 'cancelled'
  pickup_date: string
  created_at: string
}

const STATUS_LABEL = { wait: '입금대기', done: '입금확인', picked: '픽업완료', cancelled: '취소' } as const
const STATUS_BADGE_CLASS = {
  wait: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-300',
  done: 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-300',
  picked: 'bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-300',
  cancelled: 'bg-stone-100 text-stone-500 ring-1 ring-inset ring-stone-300',
} as const
const STATUS_SELECT_CLASS = {
  wait: 'border-amber-300 bg-amber-50 text-amber-900 focus:ring-amber-400',
  done: 'border-emerald-300 bg-emerald-50 text-emerald-900 focus:ring-emerald-400',
  picked: 'border-sky-300 bg-sky-50 text-sky-900 focus:ring-sky-400',
  cancelled: 'border-stone-300 bg-stone-50 text-stone-500 focus:ring-stone-400',
} as const
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function dateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${WEEKDAY_KO[d.getUTCDay()]})`
}

export function OrdersPanel() {
  const slot = useCurrentPickupSlot()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [customers, setCustomers] = useState<Map<string, string>>(new Map())
  const [showPast, setShowPast] = useState(false)

  const refresh = async () => {
    const [{ data, error }, map] = await Promise.all([
      supabase.from('orders').select('id,user_id,items,total,status,pickup_date,created_at').order('created_at', { ascending: false }),
      fetchCustomerLabels(),
    ])
    if (error) toast.error(error.message)
    setOrders((data ?? []) as Order[])
    setCustomers(map)
  }
  useEffect(() => {
    void refresh()
  }, [])

  const updateStatus = async (id: string, status: Order['status']) => {
    // Cancelling returns the stock and can't be undone, so ask first.
    if (status === 'cancelled' && !window.confirm('이 주문을 취소할까요? 담긴 수량은 재고로 돌아가고, 취소는 되돌릴 수 없어요.')) return
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('주문 상태를 저장했어요.')
      void refresh()
    }
  }

  if (!orders) return <p className="text-sm text-eden-sage-dim">불러오는 중…</p>

  // Today's pickups and later are "upcoming"; older ones are hidden unless asked.
  const todayIso = slot ? new Date(new Date(`${slot.iso}T00:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10) : ''
  const groups = new Map<string, Order[]>()
  for (const o of orders) {
    if (!showPast && o.pickup_date < todayIso) continue
    groups.set(o.pickup_date, [...(groups.get(o.pickup_date) ?? []), o])
  }
  const dates = [...groups.keys()].sort((a, b) => (showPast ? b.localeCompare(a) : a.localeCompare(b)))

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {slot ? (
          <p className="rounded-full bg-eden-sand/15 px-4 py-2 text-sm">
            지금 주문하면 <strong className="text-eden-sand">{slot.dateLabel}</strong> 픽업
          </p>
        ) : (
          <span />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
          지난 픽업도 보기
        </label>
      </div>

      {dates.length === 0 ? <p className="py-6 text-center text-sm text-eden-sage-dim">해당하는 주문이 없어요.</p> : null}
      {dates.map((iso) => {
        const list = groups.get(iso) ?? []
        const active = list.filter((o) => o.status !== 'cancelled')
        const prep = new Map<string, number>()
        for (const o of active) for (const it of o.items) prep.set(it.name, (prep.get(it.name) ?? 0) + it.qty)
        return (
          <section key={iso} className="mb-10 last:mb-0">
            <div className="mb-3 flex flex-wrap items-baseline gap-3 border-b-2 border-eden-ink pb-3">
              <h3 className="font-serif text-lg font-semibold">{dateLabel(iso)} 픽업</h3>
              {slot?.iso === iso ? <span className="rounded-full bg-eden-sand px-2.5 py-0.5 text-xs font-semibold text-eden-ink-2">지금 접수 중</span> : null}
              <span className="text-sm text-eden-sage-dim">
                주문 {active.length}건 · 입금대기 {active.filter((o) => o.status === 'wait').length}건 ·{' '}
                {active.reduce((sum, o) => sum + o.total, 0).toLocaleString('ko-KR')}원
                {active.length < list.length ? ` · 취소 ${list.length - active.length}건` : ''}
              </span>
            </div>
            <p className="mb-4 rounded-[10px] bg-eden-paper px-4 py-3 text-sm">
              <strong className="mr-2">준비할 메뉴</strong>
              {[...prep].map(([name, qty]) => `${name} ${qty}개`).join(' · ')}
            </p>
            <div className="space-y-2">
              {list.map((o) => (
                <article key={o.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-eden-line bg-eden-paper p-4 ${o.status === 'cancelled' ? 'opacity-60' : ''}`}>
                  <div className="min-w-48 flex-1">
                    <p className="text-sm font-semibold">{customers.get(o.user_id) ?? o.user_id.slice(0, 8)}</p>
                    <p className="text-sm">{o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</p>
                  </div>
                  <span className="font-semibold">{o.total.toLocaleString('ko-KR')}원</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  <select
                    aria-label="입금·픽업 상태"
                    value={o.status}
                    disabled={o.status === 'cancelled'}
                    onChange={(e) => void updateStatus(o.id, e.target.value as Order['status'])}
                    className={`rounded-[10px] border p-2 text-sm font-medium focus:outline-none focus:ring-2 ${STATUS_SELECT_CLASS[o.status]}`}
                  >
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
