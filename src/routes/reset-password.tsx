import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/reset-password')({ component: ResetPasswordPage })
function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setMessage(error ? error.message : '비밀번호가 변경되었습니다. 다시 로그인해주세요.')
    if (!error) { setPassword(''); await supabase.auth.signOut() }
    setBusy(false)
  }
  return <div className="min-h-screen bg-eden-paper text-eden-ink"><SiteHeader /><main className="mx-auto max-w-md px-6 py-16"><h1 className="mb-6 font-serif text-3xl">비밀번호 재설정</h1><form onSubmit={event => void submit(event)}><label htmlFor="new-password" className="mb-2 block">새 비밀번호</label><input id="new-password" type="password" minLength={6} required autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mb-5 w-full rounded-[10px] border border-eden-line bg-eden-paper p-3" /><button disabled={busy} className="bg-eden-ink px-7 py-3 text-eden-paper rounded-full transition-colors hover:bg-eden-ink-2">변경하기</button></form>{message && <p role="status" className="mt-5">{message}</p>}<Link to="/login" className="mt-6 inline-block underline">로그인으로 돌아가기</Link></main><SiteFooter /></div>
}
