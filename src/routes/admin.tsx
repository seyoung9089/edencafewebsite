import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useStaff } from '@/components/admin/use-staff'
import { OrdersPanel } from '@/components/admin/orders-panel'
import { rememberReturnTo } from '@/lib/return-to'
import { InquiriesPanel } from '@/components/admin/inquiries-panel'
import { MenuPanel } from '@/components/admin/menu-panel'
import { ContentPanel } from '@/components/admin/content-panel'
import { StaffPanel } from '@/components/admin/staff-panel'
import { CustomersPanel } from '@/components/admin/customers-panel'
import { supabase } from '@/lib/supabase'
import { pageMeta } from '@/lib/seo'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  head: () => pageMeta('/admin', { noindex: true }),
})

type Tab = 'orders' | 'customers' | 'inquiries' | 'menu' | 'content' | 'staff'
const TABS: { id: Tab; label: string }[] = [
  { id: 'orders', label: '주문 · 입금' },
  { id: 'customers', label: '고객' },
  { id: 'inquiries', label: '문의' },
  { id: 'menu', label: '메뉴' },
  { id: 'content', label: '글귀 · 이미지' },
  { id: 'staff', label: '관리자' },
]
const TAB_STORAGE_KEY = 'edenAdminTab'

function readSavedTab(): Tab {
  try {
    const saved = window.sessionStorage.getItem(TAB_STORAGE_KEY)
    if (TABS.some((t) => t.id === saved)) return saved as Tab
  } catch {
    /* storage unavailable */
  }
  return 'orders'
}

function AdminDashboard({ userId, isSuper }: { userId: string; isSuper: boolean }) {
  const [tab, setTabState] = useState<Tab>(readSavedTab)
  const setTab = (t: Tab) => {
    setTabState(t)
    try {
      window.sessionStorage.setItem(TAB_STORAGE_KEY, t)
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <div>
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-eden-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-[0.95rem] ${tab === t.id ? 'border-eden-ink font-bold' : 'border-transparent font-medium text-eden-mute hover:text-eden-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="min-w-0 border border-eden-line bg-white p-5 md:p-8">
        {tab === 'orders' ? (
          <OrdersPanel />
        ) : tab === 'customers' ? (
          <CustomersPanel />
        ) : tab === 'inquiries' ? (
          <InquiriesPanel />
        ) : tab === 'menu' ? (
          <MenuPanel />
        ) : tab === 'content' ? (
          <ContentPanel />
        ) : (
          <StaffPanel currentUserId={userId} isSuper={isSuper} />
        )}
      </div>
    </div>
  )
}

function AdminPage() {
  const { user, loading, isStaff, isSuper } = useStaff()

  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <section className="px-6 pb-24 pt-[clamp(48px,7vw,96px)] md:px-8">
        <p className="eyebrow mb-3">관리자</p>
        <h1 className="mb-3 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">관리자 페이지</h1>
        <p className="mb-10 text-[15px] text-eden-mute">주문 · 고객 · 문의 · 메뉴 · 글귀 · 관리자를 한곳에서 관리해요.</p>

        {loading ? (
          <div className="h-24 w-full max-w-3xl animate-pulse rounded-card bg-eden-line" />
        ) : !user ? (
          <div className="max-w-sm">
            <p className="mb-4 text-sm text-eden-mute">관리자 계정으로 로그인해주세요.</p>
            <Link to="/login" onClick={() => rememberReturnTo('/admin')} className="inline-block rounded-[3px] bg-eden-accent px-7 py-3 text-sm font-semibold text-white hover:bg-eden-accent-d">
              로그인
            </Link>
          </div>
        ) : !isStaff ? (
          <div className="max-w-md rounded-card bg-eden-paper-dim p-6 shadow-soft">
            <p className="mb-2">{user.email} 계정에는 관리자 권한이 없어요.</p>
            <p className="mb-4 text-sm text-eden-mute">기존 관리자에게 관리자 페이지 → 관리자 탭에서 이 이메일을 추가해달라고 요청해주세요.</p>
            <button type="button" onClick={() => void supabase.auth.signOut()} className="text-sm underline">
              다른 계정으로 로그인
            </button>
          </div>
        ) : (
          <AdminDashboard userId={user.id} isSuper={isSuper} />
        )}
      </section>
      <SiteFooter />
    </div>
  )
}
