import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export const Route = createFileRoute('/customer-management')({ component: CustomerManagementPage })
type Order = { id: string; user_id: string; items: { name: string; qty: number }[]; total: number; status: string; pickup_date: string; created_at: string }
type Inquiry = { id: string; user_id: string; title: string; content: string; category: string; status: string; reply: string | null; created_at: string }
type Profile = { user_id: string; email: string }
type CatalogItem = { name: string; price: number; sold_out: boolean }

function CustomerManagementPage() {
  const { user, loading } = useCustomerAuth()
  const [staff, setStaff] = useState<boolean | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [error, setError] = useState('')
  const refresh = async () => {
    const [o, i, p, c] = await Promise.all([
      supabase.from('orders').select('id,user_id,items,total,status,pickup_date,created_at').order('created_at', { ascending: false }),
      supabase.from('inquiries').select('id,user_id,title,content,category,status,reply,created_at').order('created_at', { ascending: false }),
      supabase.from('customer_profiles').select('user_id,email'),
      supabase.from('menu_catalog').select('name,price,sold_out').order('name'),
    ])
    setOrders((o.data ?? []) as Order[]); setInquiries((i.data ?? []) as Inquiry[]); setProfiles((p.data ?? []) as Profile[]); setCatalog((c.data ?? []) as CatalogItem[])
    setError(o.error?.message ?? i.error?.message ?? p.error?.message ?? c.error?.message ?? '')
  }
  useEffect(() => {
    if (!user) { setStaff(false); return }
    let active = true
    void supabase.from('staff_users').select('user_id').eq('user_id', user.id).maybeSingle().then(({ data, error }) => {
      if (!active) return
      setStaff(Boolean(data)); setError(error?.message ?? '')
      if (data) void refresh()
    })
    return () => { active = false }
  }, [user?.id])
  const updateOrder = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) toast.error(error.message); else { toast.success('주문 상태를 저장했습니다.'); void refresh() }
  }
  const updateInquiry = async (id: string, reply: string) => {
    const { error } = await supabase.from('inquiries').update({ reply, status: 'done' }).eq('id', id)
    if (error) toast.error(error.message); else { toast.success('답변을 저장했습니다.'); void refresh() }
  }
  const email = (id: string) => profiles.find(p => p.user_id === id)?.email ?? id.slice(0, 8)
  const saveCatalog = async (item: CatalogItem) => {
    const { error } = await supabase.from('menu_catalog').upsert(item)
    if (error) toast.error(error.message); else { toast.success('주문 메뉴를 저장했습니다.'); void refresh() }
  }
  return <div className="min-h-screen bg-eden-paper text-eden-ink"><SiteHeader /><main className="mx-auto max-w-6xl px-6 pb-24 pt-14"><h1 className="mb-6 font-serif text-3xl font-semibold">고객 · 주문 관리</h1>
    {loading || staff === null ? <p>권한 확인 중…</p> : !user ? <Link to="/login" className="underline">관리자 계정으로 로그인해주세요.</Link> : !staff ? <p>이 계정에는 고객 관리 권한이 없습니다.</p> : <>
      {error && <p role="alert" className="mb-5 text-destructive">{error}</p>}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">{[['고객', profiles.length],['주문', orders.length],['문의', inquiries.length]].map(([label,value]) => <div key={label} className="border border-eden-line bg-eden-paper-dim p-5"><p className="text-sm text-eden-sage-dim">{label}</p><strong className="font-serif text-2xl">{value}</strong></div>)}</div>
      <h2 className="mb-4 font-serif text-2xl">픽업 주문 · 입금 확인</h2><div className="mb-12 space-y-3">{orders.length === 0 ? <p>주문이 없습니다.</p> : orders.map(o => <article key={o.id} className="border border-eden-line bg-eden-paper-dim p-5"><div className="flex flex-wrap justify-between gap-2"><strong>{email(o.user_id)}</strong><span>{o.pickup_date} 픽업</span></div><p className="mt-2 text-sm">{o.items.map(i => `${i.name} × ${i.qty}`).join(', ')}</p><p className="mt-2 font-semibold">{o.total.toLocaleString('ko-KR')}원</p><label className="mt-3 block text-sm" htmlFor={`order-${o.id}`}>입금·픽업 상태</label><select id={`order-${o.id}`} value={o.status} onChange={e => void updateOrder(o.id, e.target.value)} className="mt-1 border border-eden-line bg-eden-paper p-2"><option value="wait">입금대기</option><option value="done">입금확인완료</option><option value="picked">픽업완료</option></select></article>)}</div>
      <h2 className="mb-4 font-serif text-2xl">고객 문의</h2><div className="space-y-3">{inquiries.length === 0 ? <p>문의가 없습니다.</p> : inquiries.map(q => <InquiryCard key={q.id} inquiry={q} email={email(q.user_id)} onSave={updateInquiry} />)}</div>
      <h2 className="mb-3 mt-12 font-serif text-2xl">주문 메뉴 가격 · 품절</h2><p className="mb-4 text-sm text-eden-sage-dim">고객에게 표시되는 주문 가격과 품절 상태입니다. 메뉴 설명과 사진은 기존 관리자 메뉴 관리에서 수정하세요.</p>
      <div className="space-y-2">{catalog.map(c => <CatalogCard key={c.name} item={c} onSave={saveCatalog} />)}</div>
      <form className="mt-5 flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); const price = Number(newPrice); if (newName.trim() && Number.isInteger(price) && price > 0) { void saveCatalog({ name: newName.trim(), price, sold_out: false }); setNewName(''); setNewPrice('') } }}><input aria-label="새 메뉴 이름" placeholder="새 메뉴 이름" value={newName} onChange={e => setNewName(e.target.value)} className="border border-eden-line p-2" /><input aria-label="가격" placeholder="가격(원)" inputMode="numeric" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-32 border border-eden-line p-2" /><button className="bg-eden-ink px-4 py-2 text-eden-paper">주문 메뉴 추가</button></form>
    </>}
  </main><SiteFooter /></div>
}

function CatalogCard({ item, onSave }: { item: CatalogItem; onSave: (item: CatalogItem) => Promise<void> }) {
  const [price, setPrice] = useState(String(item.price))
  const [soldOut, setSoldOut] = useState(item.sold_out)
  return <div className="flex flex-wrap items-center gap-3 border border-eden-line bg-eden-paper-dim p-3"><strong className="min-w-40 flex-1">{item.name}</strong><input aria-label={`${item.name} 가격`} value={price} onChange={e => setPrice(e.target.value)} inputMode="numeric" className="w-28 border border-eden-line bg-eden-paper p-2" /><label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={soldOut} onChange={e => setSoldOut(e.target.checked)} />품절</label><button onClick={() => { const next = Number(price); if (Number.isInteger(next) && next > 0) void onSave({ ...item, price: next, sold_out: soldOut }); else toast.error('올바른 가격을 입력해주세요.') }} className="bg-eden-ink px-4 py-2 text-sm text-eden-paper">저장</button></div>
}

function InquiryCard({ inquiry, email, onSave }: { inquiry: Inquiry; email: string; onSave: (id: string, reply: string) => Promise<void> }) {
  const [reply, setReply] = useState(inquiry.reply ?? '')
  return <article className="border border-eden-line bg-eden-paper-dim p-5"><p className="mb-1 text-xs text-eden-sage-dim">{email} · {inquiry.category}</p><strong>{inquiry.title}</strong><p className="mt-3 whitespace-pre-wrap text-sm">{inquiry.content}</p><label htmlFor={`reply-${inquiry.id}`} className="mt-4 block text-sm">답변</label><textarea id={`reply-${inquiry.id}`} value={reply} onChange={e => setReply(e.target.value)} className="mt-1 min-h-24 w-full border border-eden-line bg-eden-paper p-3" /><button disabled={!reply.trim()} onClick={() => void onSave(inquiry.id, reply.trim())} className="mt-2 bg-eden-ink px-5 py-2 text-sm text-eden-paper disabled:opacity-50">답변 저장</button></article>
}
