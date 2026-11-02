import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { buttonClass, fetchCustomerLabels, inputClass } from './use-staff'

type StaffRow = { id: string; email: string; isSuper: boolean }

export function StaffPanel({ currentUserId, isSuper }: { currentUserId: string; isSuper: boolean }) {
  const [staff, setStaff] = useState<StaffRow[] | null>(null)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    const [{ data, error }, labels] = await Promise.all([supabase.from('staff_users').select('user_id,is_super'), fetchCustomerLabels()])
    if (error) toast.error(error.message)
    setStaff(
      (data ?? []).map((row) => ({
        id: row.user_id as string,
        email: labels.get(row.user_id as string) ?? '(이메일 없음)',
        isSuper: Boolean(row.is_super),
      })),
    )
  }
  useEffect(() => {
    void refresh()
  }, [])

  const add = async () => {
    if (!email.trim()) return
    setBusy(true)
    const { error } = await supabase.rpc('add_staff', { p_email: email.trim() })
    setBusy(false)
    if (error) return void toast.error(error.message)
    toast.success(`${email.trim()} 계정을 관리자로 추가했어요.`)
    setEmail('')
    void refresh()
  }

  const remove = async (id: string, label: string) => {
    if (!window.confirm(`${label} 계정의 관리자 권한을 해제할까요?`)) return
    const { error } = await supabase.rpc('remove_staff', { p_user_id: id })
    if (error) return void toast.error(error.message)
    toast.success('관리자 권한을 해제했어요.')
    void refresh()
  }

  const setSuper = async (id: string, label: string, next: boolean) => {
    if (!window.confirm(next ? `${label} 계정을 최고 관리자로 지정할까요?` : `${label} 계정의 최고 관리자 권한을 해제할까요?`)) return
    const { error } = await supabase.rpc('set_staff_super', { p_user_id: id, p_is_super: next })
    if (error) return void toast.error(error.message)
    toast.success(next ? '최고 관리자로 지정했어요.' : '최고 관리자 권한을 해제했어요.')
    void refresh()
  }

  if (!staff) return <p className="text-sm text-eden-sage-dim">불러오는 중…</p>
  return (
    <div>
      <p className="mb-5 text-sm text-eden-sage-dim">
        관리자는 이 관리자 페이지 전체(주문, 문의, 메뉴, 글귀, 관리자)를 쓸 수 있어요.{' '}
        <strong className="text-eden-ink">최고 관리자</strong>만 관리자를 추가·해제하고 다른 관리자를 최고 관리자로 지정할 수 있어요.
        추가할 사람은 먼저 사이트에서 이메일로 회원가입해야 해요.
      </p>
      <ul className="mb-6 divide-y divide-eden-line rounded-[10px] border border-eden-line bg-eden-paper">
        {staff.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="flex items-center gap-2">
              {s.email}
              {s.id === currentUserId ? <span className="text-xs text-eden-sage-dim">(나)</span> : null}
              {s.isSuper ? (
                <span className="rounded-full bg-eden-sand/20 px-2.5 py-0.5 text-xs font-semibold text-eden-sand">최고 관리자</span>
              ) : null}
            </span>
            {isSuper ? (
              <span className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void setSuper(s.id, s.email, !s.isSuper)}
                  className="text-xs text-eden-sage-dim underline hover:text-eden-sand"
                >
                  {s.isSuper ? '최고 관리자 해제' : '최고 관리자로 지정'}
                </button>
                <button type="button" onClick={() => void remove(s.id, s.email)} className="text-xs text-eden-sage-dim underline hover:text-destructive">
                  해제
                </button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {isSuper ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void add()
          }}
          className="flex flex-wrap gap-2"
        >
          <input type="email" aria-label="추가할 관리자 이메일" placeholder="추가할 관리자 이메일" value={email} onChange={(e) => setEmail(e.target.value)} className={`min-w-64 flex-1 ${inputClass}`} />
          <button disabled={busy} className={buttonClass}>
            관리자 추가
          </button>
        </form>
      ) : (
        <p className="text-sm text-eden-sage-dim">관리자 추가·해제는 최고 관리자만 할 수 있어요.</p>
      )}
    </div>
  )
}
