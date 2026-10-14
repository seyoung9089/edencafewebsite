import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'
import { pageMeta } from '@/lib/seo'

export const Route = createFileRoute('/orders')({ component: OrdersPage, head: () => pageMeta('/orders') })
type Order = { id: string; items: { name: string; price: number; qty: number }[]; total: number; status: string; pickup_date: string; created_at: string }
const labels: Record<string,string> = { wait: '입금대기', done: '입금확인완료', picked: '픽업완료' }

function OrdersPage() {
  const { user, loading } = useCustomerAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!user) { setOrders([]); setBusy(false); return }
    let active = true
    void supabase.from('orders').select('id,items,total,status,pickup_date,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (active) { setOrders((data ?? []) as Order[]); setError(error?.message ?? ''); setBusy(false) }
    })
    return () => { active = false }
  }, [user?.id])
  return <div className="min-h-screen bg-eden-paper text-eden-ink"><SiteHeader /><main className="mx-auto max-w-4xl px-6 pb-24 pt-14">
    <h1 className="mb-3 font-serif text-3xl font-semibold">내 주문</h1><p className="mb-10 text-[15px] text-eden-sage-dim">주문 내역과 입금 상태를 확인하세요.</p>
    {loading ? <p>로그인 상태 확인 중…</p> : !user ? <div><p className="mb-4">로그인 후 주문 내역을 확인할 수 있어요.</p><Link to="/login" className="inline-block bg-eden-ink px-7 py-3 text-eden-paper rounded-full transition-colors hover:bg-eden-ink-2">이메일 로그인</Link></div> : <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card bg-eden-sage-dim px-5 py-4 text-sm text-eden-paper"><span>{user.email}</span><button onClick={() => void supabase.auth.signOut()} className="text-eden-sand underline">로그아웃</button></div>
      <div className="mb-7 flex gap-5 text-sm underline"><Link to="/support">내 문의 보기</Link><Link to="/cart">장바구니</Link></div>
      {busy ? <p>불러오는 중…</p> : error ? <p role="alert">주문 내역을 불러오지 못했습니다: {error}</p> : orders.length === 0 ? <p className="border-t border-eden-line py-10 text-center text-eden-sage-dim">아직 주문 내역이 없습니다.</p> : orders.map(order => <article key={order.id} className="border-t border-eden-line py-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3"><strong>주문 #{order.id.slice(0, 8)}</strong><span className="rounded-full bg-eden-sand px-3 py-1 text-xs font-bold">{labels[order.status] ?? order.status}</span></div>
        <p className="mb-2 text-sm text-eden-sage-dim">픽업 {order.pickup_date} · 주문 {new Date(order.created_at).toLocaleString('ko-KR')}</p>
        {order.items.map((item, index) => <p key={index} className="text-sm">{item.name} × {item.qty} · {(item.price * item.qty).toLocaleString('ko-KR')}원</p>)}
        <p className="mt-3 font-semibold">합계 {order.total.toLocaleString('ko-KR')}원</p>
        {order.status === 'wait' && <div className="mt-3 rounded-[10px] bg-eden-sage-dim px-4 py-3 text-xs leading-relaxed text-eden-paper">새마을금고 000-0000-0000-00<br />예금주: 이든협동조합<br />입금금액: {order.total.toLocaleString('ko-KR')}원 (주문 후 30분 이내)</div>}
      </article>)}
    </>}
  </main><SiteFooter /></div>
}
