import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { useCurrentPickupSlot } from '@/lib/pickup'
import { getErrorMessage } from '@/lib/errors'
import { useState } from 'react'
import { toast } from 'sonner'

const STATUS_LABEL: Record<string, string> = { wait: '입금대기', done: '입금확인완료', picked: '픽업완료' }
const STATUS_CLASS: Record<string, string> = {
  wait: 'bg-eden-sand text-eden-ink-2',
  done: 'bg-eden-sage text-eden-ink-2',
  picked: 'bg-eden-line text-eden-sage-dim',
}

type Filter = 'all' | 'tue' | 'thu'
type Order = Doc<'orders'>
type Group = { key: string; iso: string; dow: 'tue' | 'thu'; dateLabel: string; orders: Order[] }

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The pickup date of an order as YYYY-MM-DD.
 * Orders placed by the earlier version of the site stored a date that could be
 * one day off (a timezone bug), while their "9월 29일" label was always right.
 * So the date is rebuilt from the label, which keeps old and new orders for the
 * same pickup day together in one group.
 */
function pickupIsoOf(o: Order): string {
  const m = o.pickupDateLabel.match(/(\d+)월\s*(\d+)일/)
  if (!m) return o.pickupIso
  const month = Number(m[1])
  const day = Number(m[2])
  const created = new Date(o.createdAt + 9 * 60 * 60 * 1000)
  let year = created.getUTCFullYear()
  const createdDay = Date.UTC(year, created.getUTCMonth(), created.getUTCDate())
  if (Date.UTC(year, month - 1, day) < createdDay) year += 1 // pickup is after the order date
  return `${year}-${pad(month)}-${pad(day)}`
}

function formatKst(ms: number): string {
  return new Date(ms).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AdminOrdersPanel() {
  const [filter, setFilter] = useState<Filter>('all')
  const result = useQuery(api.orders.listAll, filter === 'all' ? {} : { pickupDow: filter })
  const confirmPayment = useMutation(api.orders.confirmPayment)
  const slot = useCurrentPickupSlot()

  const confirm = async (orderId: Id<'orders'>) => {
    try {
      await confirmPayment({ orderId })
    } catch (e) {
      toast.error(getErrorMessage(e, '입금 확인에 실패했습니다.'))
    }
  }

  // Group orders by pickup date so Tuesday and Thursday orders are never mixed.
  const groups: Group[] = []
  if (result && result.ok) {
    const map = new Map<string, Group>()
    for (const o of result.items) {
      const iso = pickupIsoOf(o)
      const key = `${iso}|${o.pickupDow}`
      let g = map.get(key)
      if (!g) {
        g = { key, iso, dow: o.pickupDow, dateLabel: o.pickupDateLabel, orders: [] }
        map.set(key, g)
      }
      g.orders.push(o)
    }
    const todayIso = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const all = Array.from(map.values())
    const upcoming = all.filter((g) => g.iso >= todayIso).sort((a, b) => (a.iso < b.iso ? -1 : 1))
    const past = all.filter((g) => g.iso < todayIso).sort((a, b) => (a.iso < b.iso ? 1 : -1))
    groups.push(...upcoming, ...past)
  }

  return (
    <div>
      <h3 className="mb-4 font-serif text-lg font-semibold">주문 · 입금확인</h3>

      {slot ? (
        <div className="mb-5 border border-eden-sand/60 bg-eden-sand/10 px-4 py-3 text-xs">
          <span className="font-semibold text-eden-sand">
            지금 접수 중: {slot.dateLabel} 픽업
          </span>
          <span className="ml-2 text-eden-sage-dim">오늘 {slot.todayLabel} 자정 마감</span>
        </div>
      ) : null}

      <div className="mb-6 flex gap-2">
        {(['all', 'tue', 'thu'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-xs ${
              filter === f ? 'border-eden-ink bg-eden-ink text-eden-paper' : 'border-eden-line text-eden-sage-dim'
            }`}
          >
            {f === 'all' ? '전체' : f === 'tue' ? '화요일 픽업' : '목요일 픽업'}
          </button>
        ))}
      </div>

      {!result || !result.ok ? (
        <p className="text-sm text-eden-sage-dim">불러오는 중…</p>
      ) : groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-eden-sage-dim">해당하는 주문이 없습니다.</p>
      ) : (
        groups.map((g) => {
          const total = g.orders.reduce((s, o) => s + o.total, 0)
          const waiting = g.orders.filter((o) => o.status === 'wait').length
          const prep = new Map<string, number>()
          for (const o of g.orders) for (const it of o.items) prep.set(it.name, (prep.get(it.name) ?? 0) + it.qty)
          const isOpenNow = slot?.iso === g.iso

          return (
            <div key={g.key} className="mb-9 last:mb-0">
              <div className="mb-3 flex flex-wrap items-center gap-3 border-b-2 border-eden-ink pb-3">
                <span
                  className={`px-3 py-1 text-xs font-bold ${
                    g.dow === 'tue' ? 'bg-eden-sage-dim text-eden-paper' : 'bg-eden-sand text-eden-ink-2'
                  }`}
                >
                  {g.dow === 'tue' ? '화요일 픽업' : '목요일 픽업'}
                </span>
                <span className="font-serif text-base font-semibold">{g.dateLabel}</span>
                {isOpenNow ? (
                  <span className="rounded-full border border-eden-sand px-2.5 py-0.5 text-[10.5px] text-eden-sand">접수 중</span>
                ) : null}
                <span className="ml-auto text-xs text-eden-sage-dim">
                  총 {g.orders.length}건 · 입금대기 {waiting}건 · 합계 {total.toLocaleString('ko-KR')}원
                </span>
              </div>

              <div className="mb-3 text-xs leading-relaxed text-eden-sage-dim">
                <span className="font-semibold text-eden-ink">준비 수량</span>{' '}
                {Array.from(prep.entries())
                  .map(([name, qty]) => `${name} ${qty}개`)
                  .join(' · ')}
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-eden-line text-left text-xs text-eden-sage-dim">
                    <th className="pb-2 font-normal">주문자</th>
                    <th className="pb-2 font-normal">주문 내용</th>
                    <th className="pb-2 font-normal">금액</th>
                    <th className="pb-2 font-normal">상태</th>
                    <th className="pb-2 font-normal">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {g.orders.map((order) => (
                    <tr key={order._id} className="border-b border-eden-line align-top">
                      <td className="py-3">
                        {order.customerName}
                        <div className="text-[11px] text-eden-sage-dim">{formatKst(order.createdAt)} 주문</div>
                      </td>
                      <td className="py-3 text-[13px]">
                        {order.items.map((it) => `${it.name} x${it.qty}`).join(', ')}
                      </td>
                      <td className="py-3">{order.total.toLocaleString('ko-KR')}원</td>
                      <td className="py-3">
                        <span className={`rounded-full px-3.5 py-1 text-[11px] font-bold ${STATUS_CLASS[order.status]}`}>
                          {STATUS_LABEL[order.status]}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          disabled={order.status !== 'wait'}
                          onClick={() => void confirm(order._id)}
                          className="border border-eden-sand px-3 py-1.5 text-xs text-eden-sand disabled:border-eden-line disabled:text-eden-sage-dim"
                        >
                          {order.status === 'wait' ? '입금 확인' : '확인됨'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })
      )}
    </div>
  )
}
