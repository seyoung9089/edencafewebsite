import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { MyOrdersBody, type CustomerOrder } from '@/components/my-orders'
import { customerName, useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'
import { pageMeta } from '@/lib/seo'
import { useCart } from '@/lib/cart'
import { lastOrderTab, rememberReturnTo, takeReturnTo } from '@/lib/return-to'

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
  head: () => pageMeta('/orders'),
})

function OrdersPage() {
  const { user, loading } = useCustomerAuth()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const { totalQty } = useCart()
  const navigate = useNavigate()
  const [orderTab, setOrderTab] = useState<'/order' | '/parents'>('/order')
  useEffect(() => setOrderTab(lastOrderTab()), [])
  // Google login and the sign-up email land here: go on to the order page the
  // customer was on before logging in.
  useEffect(() => {
    if (loading || !user) return
    const back = takeReturnTo()
    if (back && back !== '/orders') void navigate({ to: back, replace: true })
  }, [loading, user?.id])
  useEffect(() => {
    if (!user) { setOrders([]); setBusy(false); return }
    let active = true
    void supabase.from('orders').select('id,items,total,status,pickup_date,created_at,student_name,payment_method,payment_status').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (active) { setOrders((data ?? []) as CustomerOrder[]); setError(error?.message ?? ''); setBusy(false) }
    })
    return () => { active = false }
  }, [user?.id])

  const cancelOrder = async (id: string): Promise<boolean> => {
    const { error } = await supabase.rpc('cancel_order', { p_order_id: id })
    if (error) { toast.error(error.message); return false }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)))
    toast.success('주문을 취소했어요.')
    return true
  }

  const saveName = async (name: string) => {
    const { error } = await supabase.auth.updateUser({ data: { name } })
    if (error) toast.error(error.message)
    else toast.success('이름을 저장했어요.')
  }

  return <div className="min-h-screen bg-eden-paper text-eden-ink"><SiteHeader /><main className="mx-auto max-w-4xl px-6 pb-24 pt-[clamp(48px,7vw,96px)]">
    <p className="eyebrow mb-3">MY ORDERS</p>
        <h1 className="mb-8 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">내 주문</h1>
    {user && totalQty > 0 ? <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-card border-2 border-eden-accent bg-eden-paper-dim px-5 py-4">
      <p className="text-base font-semibold">담아 둔 빵 {totalQty}개가 아직 주문 전이에요.</p>
      <Link to={orderTab} className="inline-flex h-12 items-center rounded-[3px] bg-eden-accent px-6 text-base font-semibold text-white hover:bg-eden-accent-d">주문 마저 하기</Link>
    </div> : null}
    {loading ? <p>로그인 상태 확인 중…</p> : !user ? <div><p className="mb-4">로그인 후 주문 내역을 확인할 수 있어요.</p><Link to="/login" onClick={() => rememberReturnTo('/orders')} className="inline-block bg-eden-accent px-7 py-3 text-white rounded-[3px] transition-colors hover:bg-eden-accent-d">로그인하기</Link></div>
      : busy ? <p>불러오는 중…</p> : error ? <p role="alert">주문 내역을 불러오지 못했습니다: {error}</p>
      : <MyOrdersBody name={customerName(user)} email={user.email ?? ''} orders={orders} onSaveName={saveName} onCancel={cancelOrder} onSignOut={() => void supabase.auth.signOut()} />}
  </main><SiteFooter /></div>
}
