import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { MyOrdersBody, type CustomerOrder } from '@/components/my-orders'
import { customerName, useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'
import { pageMeta } from '@/lib/seo'

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
  head: () => pageMeta('/orders'),
})

function OrdersPage() {
  const { user, loading } = useCustomerAuth()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!user) { setOrders([]); setBusy(false); return }
    let active = true
    void supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data, error }) => {
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

  return <div className="min-h-screen bg-eden-paper text-eden-ink"><SiteHeader /><main className="mx-auto max-w-4xl px-6 pb-24 pt-14">
    <h1 className="mb-8 font-serif text-3xl font-semibold">내 주문</h1>
    {loading ? <p>로그인 상태 확인 중…</p> : !user ? <div><p className="mb-4">로그인 후 주문 내역을 확인할 수 있어요.</p><Link to="/login" className="inline-block bg-eden-ink px-7 py-3 text-eden-paper rounded-full transition-colors hover:bg-eden-ink-2">이메일 로그인</Link></div>
      : busy ? <p>불러오는 중…</p> : error ? <p role="alert">주문 내역을 불러오지 못했습니다: {error}</p>
      : <MyOrdersBody name={customerName(user)} email={user.email ?? ''} orders={orders} onSaveName={saveName} onCancel={cancelOrder} onSignOut={() => void supabase.auth.signOut()} />}
  </main><SiteFooter /></div>
}
