import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { kstTodayIso, pickupDayOf, usePickupDates } from '@/lib/pickup'
import { fetchCustomerLabels } from './use-staff'

type Order = {
  id: string
  user_id: string
  items: { name: string; qty: number; price: number }[]
  total: number
  status: 'wait' | 'done' | 'picked' | 'cancelled'
  pickup_date: string
  created_at: string
  student_name: string | null
  payment_method: 'transfer' | 'onsite'
  payment_status: 'pending' | 'confirmed' | 'onsite'
}

const PAYMENT_METHOD_LABEL = { transfer: '계좌이체', onsite: '현장결제' } as const
const PAYMENT_STATUS_LABEL = { pending: '입금 대기', confirmed: '입금 확인', onsite: '현장결제' } as const
const PAYMENT_BADGE_CLASS = {
  pending: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-300',
  confirmed: 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-300',
  onsite: 'bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-300',
} as const

/** 현장결제 orders aren't waiting on a transfer, so 'wait' reads as 접수. */
function statusLabel(o: Pick<Order, 'payment_method'>, status: Order['status']): string {
  return o.payment_method === 'onsite' && status === 'wait' ? '접수' : STATUS_LABEL[status]
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

const byStudent = (a: Order, b: Order) => (a.student_name ?? '').localeCompare(b.student_name ?? '', 'ko') || a.created_at.localeCompare(b.created_at)

export function OrdersPanel() {
  const calendar = usePickupDates()
  const earliest = calendar?.dates.find((d) => d.open)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [customers, setCustomers] = useState<Map<string, string>>(new Map())
  const [showPast, setShowPast] = useState(false)
  /** One pickup day only, or null for all */
  const [onlyDate, setOnlyDate] = useState<string | null>(null)
  /** Pickup days listed in order placed instead of by student name (Friday defaults to name order) */
  const [byOrderTime, setByOrderTime] = useState<Set<string>>(new Set())

  const refresh = async () => {
    const [{ data, error }, map] = await Promise.all([
      supabase.from('orders').select('id,user_id,items,total,status,pickup_date,created_at,student_name,payment_method,payment_status').order('created_at', { ascending: false }),
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

  const confirmPayment = async (o: Order) => {
    // The order status follows (입금대기 → 입금확인) in the database.
    const { error } = await supabase.from('orders').update({ payment_status: 'confirmed' }).eq('id', o.id)
    if (error) toast.error(error.message)
    else {
      toast.success(`${o.student_name ?? customers.get(o.user_id) ?? '주문'} 입금 확인했어요.`)
      void refresh()
    }
  }

  if (!orders) return <p className="text-sm text-eden-sage-dim">불러오는 중…</p>

  // Today's pickups and later are "upcoming"; older ones are hidden unless asked.
  const todayIso = kstTodayIso(Date.now())
  const groups = new Map<string, Order[]>()
  for (const o of orders) {
    if (!showPast && o.pickup_date < todayIso) continue
    groups.set(o.pickup_date, [...(groups.get(o.pickup_date) ?? []), o])
  }
  const allDates = [...groups.keys()].sort((a, b) => (showPast ? b.localeCompare(a) : a.localeCompare(b)))
  const dates = onlyDate && groups.has(onlyDate) ? [onlyDate] : allDates
  const toggleSort = (iso: string) =>
    setByOrderTime((prev) => {
      const next = new Set(prev)
      if (next.has(iso)) next.delete(iso)
      else next.add(iso)
      return next
    })
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm ${active ? 'border-eden-ink bg-eden-ink text-eden-paper' : 'border-eden-line bg-eden-paper'}`

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {earliest ? (
          <p className="rounded-full bg-eden-sand/15 px-4 py-2 text-sm">
            지금 받는 가장 빠른 픽업 <strong className="text-eden-sand">{earliest.label}</strong> · 마감 {earliest.deadlineLabel} 23:59
          </p>
        ) : (
          <span />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
          지난 픽업도 보기
        </label>
      </div>

      {allDates.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => setOnlyDate(null)} className={chip(!onlyDate || !groups.has(onlyDate))}>
            전체 날짜
          </button>
          {allDates.map((iso) => (
            <button key={iso} type="button" onClick={() => setOnlyDate(iso)} className={chip(onlyDate === iso)}>
              {dateLabel(iso)}
            </button>
          ))}
        </div>
      ) : null}

      {dates.length === 0 ? <p className="py-6 text-center text-sm text-eden-sage-dim">해당하는 주문이 없어요.</p> : null}
      {dates.map((iso) => {
        const friday = pickupDayOf(iso) === 'friday'
        const nameOrder = friday && !byOrderTime.has(iso)
        const list = [...(groups.get(iso) ?? [])].sort(nameOrder ? byStudent : (a, b) => a.created_at.localeCompare(b.created_at))
        const active = list.filter((o) => o.status !== 'cancelled')
        const prep = new Map<string, number>()
        for (const o of active) for (const it of o.items) prep.set(it.name, (prep.get(it.name) ?? 0) + it.qty)
        return (
          <section key={iso} className="mb-10 last:mb-0">
            <div className="mb-3 flex flex-wrap items-baseline gap-3 border-b-2 border-eden-ink pb-3">
              <h3 className="font-serif text-lg font-semibold">{dateLabel(iso)} 픽업</h3>
              {friday ? <span className="rounded-full bg-eden-sand px-2.5 py-0.5 text-xs font-semibold text-eden-ink-2">금요일 · 학생 픽업</span> : null}
              <span className="text-sm text-eden-sage-dim">
                주문 {active.length}건 · 입금대기 {active.filter((o) => o.payment_status === 'pending').length}건 ·{' '}
                {active.reduce((sum, o) => sum + o.total, 0).toLocaleString('ko-KR')}원
                {active.length < list.length ? ` · 취소 ${list.length - active.length}건` : ''}
              </span>
              {friday ? (
                <span className="ml-auto flex gap-1">
                  <button type="button" onClick={() => nameOrder || toggleSort(iso)} className={chip(nameOrder)}>
                    학생 이름순
                  </button>
                  <button type="button" onClick={() => nameOrder && toggleSort(iso)} className={chip(!nameOrder)}>
                    주문순
                  </button>
                </span>
              ) : null}
            </div>
            <p className="mb-4 rounded-[10px] bg-eden-paper px-4 py-3 text-sm">
              <strong className="mr-2">준비할 메뉴</strong>
              {[...prep].map(([name, qty]) => `${name} ${qty}개`).join(' · ')}
            </p>
            <div className="space-y-2">
              {list.map((o) => (
                <article key={o.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-eden-line bg-eden-paper p-4 ${o.status === 'cancelled' ? 'opacity-60' : ''}`}>
                  <div className="min-w-48 flex-1">
                    {o.student_name ? (
                      <p className="font-serif text-lg font-semibold">
                        {o.student_name} <span className="font-sans text-xs font-normal text-eden-sage-dim">학생 · 주문 {customers.get(o.user_id) ?? o.user_id.slice(0, 8)}</span>
                      </p>
                    ) : (
                      <p className="text-sm font-semibold">{customers.get(o.user_id) ?? o.user_id.slice(0, 8)}</p>
                    )}
                    <p className="text-sm">{o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</p>
                  </div>
                  <span className="font-semibold">{o.total.toLocaleString('ko-KR')}원</span>
                  <span className="text-xs text-eden-sage-dim">{PAYMENT_METHOD_LABEL[o.payment_method]}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_BADGE_CLASS[o.payment_status]}`}>{PAYMENT_STATUS_LABEL[o.payment_status]}</span>
                  {o.payment_status === 'pending' && o.status !== 'cancelled' ? (
                    <button
                      type="button"
                      onClick={() => void confirmPayment(o)}
                      className="rounded-full bg-eden-ink px-4 py-2 text-sm font-semibold text-eden-paper hover:bg-eden-ink-2"
                    >
                      입금 확인
                    </button>
                  ) : null}
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[o.status]}`}>{statusLabel(o, o.status)}</span>
                  <select
                    aria-label="입금·픽업 상태"
                    value={o.status}
                    disabled={o.status === 'cancelled'}
                    onChange={(e) => void updateStatus(o.id, e.target.value as Order['status'])}
                    className={`rounded-[10px] border p-2 text-sm font-medium focus:outline-none focus:ring-2 ${STATUS_SELECT_CLASS[o.status]}`}
                  >
                    {(Object.keys(STATUS_LABEL) as Order['status'][]).map((value) => (
                      <option key={value} value={value}>
                        {statusLabel(o, value)}
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
