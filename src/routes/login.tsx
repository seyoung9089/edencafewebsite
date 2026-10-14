import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/login')({ component: LoginPage, head: () => ({ meta: [{ title: '이메일 로그인 | 이든카페' }] }) })

function LoginPage() {
  const { user, loading } = useCustomerAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
        if (error) throw error
        setMessage('비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해주세요.')
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/orders` } })
        if (error) throw error
        if (data.session) navigate({ to: '/orders' })
        else setMessage('확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해주세요.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate({ to: '/orders' })
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : '다시 시도해주세요.') }
    finally { setBusy(false) }
  }

  return <div className="min-h-screen bg-eden-paper text-eden-ink"><SiteHeader /><main className="mx-auto max-w-md px-6 py-16">
    <h1 className="mb-3 font-serif text-3xl font-semibold">{mode === 'signup' ? '회원가입' : mode === 'reset' ? '비밀번호 찾기' : '이메일 로그인'}</h1>
    <p className="mb-8 text-sm text-eden-sage-dim">내 주문과 문의를 한 계정에서 확인할 수 있어요.</p>
    {loading ? <p>로그인 상태를 확인하는 중…</p> : user ? <div className="rounded-card bg-eden-paper-dim shadow-soft p-6"><p className="mb-4">{user.email} 계정으로 로그인되어 있습니다.</p><Link to="/orders" className="underline">내 주문 보기 →</Link><button type="button" onClick={() => void supabase.auth.signOut()} className="ml-5 underline">로그아웃</button></div> :
      <form onSubmit={(event) => void submit(event)} className="rounded-card bg-eden-paper-dim shadow-soft p-6">
        <label className="mb-2 block text-sm" htmlFor="email">이메일</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mb-5 w-full rounded-[10px] border border-eden-line bg-eden-paper px-4 py-3" />
        {mode !== 'reset' && <><label className="mb-2 block text-sm" htmlFor="password">비밀번호</label><input id="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="mb-6 w-full rounded-[10px] border border-eden-line bg-eden-paper px-4 py-3" /></>}
        {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}{message && <p role="status" className="mb-4 text-sm text-eden-sage-dim">{message}</p>}
        <button disabled={busy} className="w-full bg-eden-ink py-3 text-sm font-semibold text-eden-paper disabled:opacity-50 rounded-full transition-colors hover:bg-eden-ink-2">{busy ? '처리 중…' : mode === 'signup' ? '가입하기' : mode === 'reset' ? '재설정 메일 보내기' : '로그인'}</button>
        <div className="mt-5 flex justify-between gap-3 text-xs underline"><button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); setMessage('') }}>{mode === 'signup' ? '로그인' : '회원가입'}</button><button type="button" onClick={() => { setMode(mode === 'reset' ? 'login' : 'reset'); setError(''); setMessage('') }}>{mode === 'reset' ? '로그인으로 돌아가기' : '비밀번호 찾기'}</button></div>
      </form>}
  </main><SiteFooter /></div>
}
