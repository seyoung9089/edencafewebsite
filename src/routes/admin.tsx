import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { GoogleAuthButton } from '@/components/google-auth-button'
import { AdminContentPanel } from '@/components/admin-content-panel'
import { AdminInquiriesPanel } from '@/components/admin-inquiries-panel'
import { AdminMembersPanel } from '@/components/admin-members-panel'
import { AdminMenuPanel } from '@/components/admin-menu-panel'
import { AdminOrdersPanel } from '@/components/admin-orders-panel'
import { getErrorMessage } from '@/lib/errors'
import { pageMeta } from '@/lib/seo'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  head: () => pageMeta('/admin', { noindex: true }),
})

function AdminClaimGate() {
  const adminNow = useQuery(api.orders.isCurrentUserAdmin)
  const claimAdmin = useMutation(api.orders.claimAdmin)
  const [claiming, setClaiming] = useState(false)

  // The login token refreshes in the background about every 90 seconds, and
  // for a moment the admin check comes back empty. Without this, the whole
  // dashboard was torn down and rebuilt, throwing the admin back to the first
  // tab and wiping anything they were typing. Keep the last known answer.
  const lastKnown = useRef<boolean | undefined>(undefined)
  if (adminNow !== undefined) lastKnown.current = adminNow
  const isAdmin = adminNow ?? lastKnown.current

  if (isAdmin === undefined) return <p className="text-sm text-eden-sage-dim">확인하는 중…</p>
  if (isAdmin) return <AdminDashboard />

  const claim = async () => {
    setClaiming(true)
    try {
      await claimAdmin({})
      toast.success('관리자로 등록되었습니다.')
    } catch (e) {
      toast.error(getErrorMessage(e, '등록에 실패했습니다.'))
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="max-w-md border border-eden-line bg-eden-paper-dim p-8">
      <h2 className="mb-3 font-serif text-lg font-semibold">관리자 등록</h2>
      <p className="mb-6 text-sm text-eden-sage-dim">
        아직 등록된 관리자가 없습니다. 지금 로그인한 이 Google 계정을 이든카페의 관리자로 등록하시겠어요? (등록 후에는
        관리자 페이지의 "회원 관리"에서 다른 계정도 관리자로 추가하거나 해제할 수 있어요.)
      </p>
      <button onClick={() => void claim()} disabled={claiming} className="w-full bg-eden-ink py-3 text-sm font-medium text-eden-paper disabled:opacity-50">
        {claiming ? '등록하는 중…' : '이 계정을 관리자로 등록하기'}
      </button>
    </div>
  )
}

type Tab = 'menu' | 'orders' | 'inquiries' | 'content' | 'members'
const TABS: { id: Tab; label: string }[] = [
  { id: 'orders', label: '이전 주문' },
  { id: 'menu', label: '메뉴 관리' },
  { id: 'inquiries', label: '이전 문의' },
  { id: 'content', label: '콘텐츠 관리' },
  { id: 'members', label: '회원 관리' },
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

function AdminDashboard() {
  // Also remembered for the browser session as a second safety net.
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
    <div className="grid grid-cols-1 border border-eden-line md:grid-cols-[210px_1fr]">
      <div className="bg-eden-ink-2 p-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`block w-full px-4 py-3 text-left text-sm ${tab === t.id ? 'bg-eden-sand/15 text-eden-sand' : 'text-[rgba(237,236,227,0.68)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-eden-paper-dim p-8">
        {tab === 'orders' ? (
          <AdminOrdersPanel />
        ) : tab === 'menu' ? (
          <AdminMenuPanel />
        ) : tab === 'inquiries' ? (
          <AdminInquiriesPanel />
        ) : tab === 'content' ? (
          <AdminContentPanel />
        ) : (
          <AdminMembersPanel />
        )}
      </div>
    </div>
  )
}

function AdminPage() {
  return (
    <div className="min-h-screen bg-eden-paper text-eden-ink">
      <SiteHeader />
      <section className="px-6 pb-24 pt-14 md:px-8">
        <h1 className="mb-3 font-serif text-3xl font-semibold">관리자 페이지</h1>
        <p className="mb-10 text-[15px] text-eden-sage-dim">메뉴 · 주문 · 콘텐츠 · 회원을 관리자가 직접 관리합니다.</p>
        <Link to="/customer-management" className="mb-8 inline-block bg-eden-ink px-5 py-3 text-sm text-eden-paper">이메일 고객 주문 · 입금 · 문의 관리 →</Link>

        <AuthLoading>
          <div className="h-24 w-full max-w-3xl animate-pulse bg-eden-line" />
        </AuthLoading>
        <Unauthenticated>
          <div className="max-w-sm">
            <p className="mb-4 text-sm text-eden-sage-dim">관리자 계정으로 로그인해주세요.</p>
            <GoogleAuthButton className="w-full" />
          </div>
        </Unauthenticated>
        <Authenticated>
          <AdminClaimGate />
        </Authenticated>
      </section>
      <SiteFooter />
    </div>
  )
}
