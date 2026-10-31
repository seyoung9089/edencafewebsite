import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'
import { authErrorMessage, takeReturnTo } from '@/lib/return-to'

export const Route = createFileRoute('/login')({ component: LoginPage, head: () => ({ meta: [{ title: '로그인 | 이든카페' }] }) })

const socialEnabled = {
  google: import.meta.env.VITE_GOOGLE_LOGIN_ENABLED !== 'false',
  kakao: import.meta.env.VITE_KAKAO_LOGIN_ENABLED === 'true',
}

function LoginPage() {
  const { user, loading } = useCustomerAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [socialBusy, setSocialBusy] = useState<'google' | 'kakao' | null>(null)

  // Back to the order page the customer came from (their cart is waiting), else 내 주문.
  const goBack = () => navigate({ to: takeReturnTo() ?? '/orders' })
  const switchMode = (next: typeof mode) => { setMode(next); setError(''); setMessage('') }

  const signInSocial = async (provider: 'google' | 'kakao') => {
    setError('')
    setSocialBusy(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/orders` },
    })
    if (error) { setError(authErrorMessage(error.message)); setSocialBusy(null) }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
        if (error) throw error
        setMessage('비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해주세요.')
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/orders`, data: { name: name.trim() } } })
        if (error) throw error
        if (data.session) goBack()
        else setMessage('확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해주세요.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        goBack()
      }
    } catch (cause) { setError(cause instanceof Error ? authErrorMessage(cause.message) : '다시 시도해주세요.') }
    finally { setBusy(false) }
  }

  const input = 'mb-5 h-14 w-full rounded-[2px] border border-eden-line bg-eden-paper px-4 text-base'
  return <div className="min-h-screen bg-eden-paper text-eden-ink"><SiteHeader /><main className="mx-auto max-w-md px-6 py-14">
    <p className="eyebrow mb-3">MY ACCOUNT</p>
        <h1 className="mb-3 font-serif text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-snug">{mode === 'signup' ? '회원가입' : mode === 'reset' ? '비밀번호 찾기' : '로그인'}</h1>
    <p className="mb-8 text-[15px] text-eden-mute">
      {mode === 'signup' ? '이메일과 비밀번호만 있으면 가입할 수 있어요.' : mode === 'reset' ? '가입한 이메일로 비밀번호를 다시 정하는 메일을 보내 드려요.' : '주문하려면 로그인이 필요해요. 처음이시면 아래에서 회원가입을 먼저 해 주세요.'}
    </p>
    {loading ? <p>로그인 상태를 확인하는 중…</p> : user ? <div className="rounded-card bg-eden-paper-dim shadow-soft p-6"><p className="mb-4">{user.email} 계정으로 로그인되어 있습니다.</p><Link to="/orders" className="underline">내 주문 보기 →</Link><button type="button" onClick={() => void supabase.auth.signOut()} className="ml-5 underline">로그아웃</button></div> : <>
      <form onSubmit={(event) => void submit(event)} className="rounded-card bg-eden-paper-dim shadow-soft p-6">
        {mode === 'signup' && <><label className="mb-2 block text-[15px] font-semibold" htmlFor="name">이름</label><input id="name" autoComplete="name" required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} placeholder="픽업할 때 말씀하실 이름" className={input} /></>}
        <label className="mb-2 block text-[15px] font-semibold" htmlFor="email">이메일</label><input id="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="예: eden@naver.com" className={input} />
        {mode !== 'reset' && <><label className="mb-2 block text-[15px] font-semibold" htmlFor="password">비밀번호{mode === 'signup' ? <span className="ml-1.5 text-sm font-normal text-eden-mute">6자 이상</span> : null}</label><input id="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} mb-6`} /></>}
        {message && <p role="status" className="mb-4 rounded-[2px] bg-eden-paper-dim px-4 py-3 text-[15px] font-semibold">{message}</p>}
        {error && <p role="alert" className="mb-4 text-[15px] font-semibold text-destructive">{error}</p>}
        <button disabled={busy} className="h-14 w-full rounded-[3px] bg-eden-accent text-base font-semibold text-white transition-colors hover:bg-eden-accent-d disabled:opacity-50">{busy ? '처리 중…' : mode === 'signup' ? '가입하기' : mode === 'reset' ? '재설정 메일 보내기' : '로그인'}</button>
        {mode === 'login' && <button type="button" onClick={() => switchMode('reset')} className="mt-4 block w-full text-center text-sm text-eden-mute underline">비밀번호를 잊으셨나요?</button>}
      </form>
      {mode === 'login'
        ? <button type="button" onClick={() => switchMode('signup')} className="mt-4 h-14 w-full rounded-[3px] border-2 border-eden-ink text-base font-semibold text-eden-ink hover:bg-eden-ink hover:text-eden-paper">처음이에요 · 회원가입</button>
        : <button type="button" onClick={() => switchMode('login')} className="mt-4 h-14 w-full rounded-[3px] border border-eden-line text-base font-semibold text-eden-ink hover:bg-eden-paper-dim">{mode === 'signup' ? '이미 가입했어요 · 로그인' : '로그인으로 돌아가기'}</button>}
      {mode !== 'reset' && (socialEnabled.google || socialEnabled.kakao) && <div className="mt-8 space-y-3"><p className="text-center text-sm text-eden-mute">또는 간편 로그인</p>
        {socialEnabled.google && <button type="button" disabled={Boolean(socialBusy)} onClick={() => void signInSocial('google')} className="h-14 w-full rounded-[3px] border border-eden-line bg-white text-base font-semibold text-eden-ink disabled:opacity-50">{socialBusy === 'google' ? '구글로 이동 중…' : 'Google로 계속하기'}</button>}
        {socialEnabled.kakao && <button type="button" disabled={Boolean(socialBusy)} onClick={() => void signInSocial('kakao')} className="h-14 w-full rounded-[3px] bg-[#FEE500] text-base font-semibold text-[#191919] disabled:opacity-50">{socialBusy === 'kakao' ? '카카오로 이동 중…' : '카카오로 계속하기'}</button>}
      </div>}
    </>}
  </main><SiteFooter /></div>
}
