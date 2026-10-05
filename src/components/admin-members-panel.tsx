import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getErrorMessage } from '@/lib/errors'
import { toast } from 'sonner'

export function AdminMembersPanel() {
  const result = useQuery(api.orders.listUsers)
  const setAdminStatus = useMutation(api.orders.setAdminStatus)

  const toggle = async (userId: string, makeAdmin: boolean) => {
    try {
      await setAdminStatus({ userId: userId as any, isAdmin: makeAdmin })
      toast.success(makeAdmin ? '관리자로 지정되었습니다.' : '관리자 권한이 해제되었습니다.')
    } catch (e) {
      toast.error(getErrorMessage(e, '변경에 실패했습니다.'))
    }
  }

  return (
    <div>
      <h3 className="mb-2 font-serif text-lg font-semibold">회원 관리</h3>
      <p className="mb-5 text-xs text-eden-sage-dim">
        Google 계정으로 로그인한 적 있는 모든 회원입니다. 관리자로 지정하면 그 계정도 관리자 페이지에 들어올 수 있어요.
      </p>
      {!result || !result.ok ? (
        <p className="text-sm text-eden-sage-dim">불러오는 중…</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-eden-line text-left text-xs text-eden-sage-dim">
              <th className="pb-3 font-normal">회원</th>
              <th className="pb-3 font-normal">이메일</th>
              <th className="pb-3 font-normal">권한</th>
              <th className="pb-3 font-normal">관리</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((u) => (
              <tr key={u._id} className="border-b border-eden-line">
                <td className="flex items-center gap-2.5 py-3">
                  {u.image ? (
                    <img src={u.image} alt="" className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-eden-sage-dim" />
                  )}
                  {u.name ?? '이름 없음'}
                  {u._id === result.currentUserId ? <span className="text-[10px] text-eden-sage-dim">(나)</span> : null}
                </td>
                <td className="py-3 text-eden-sage-dim">{u.email ?? '-'}</td>
                <td className="py-3">
                  <span className={`rounded-full px-3.5 py-1 text-[11px] font-bold ${u.isAdmin ? 'bg-eden-sand text-eden-ink-2' : 'bg-eden-line text-eden-sage-dim'}`}>
                    {u.isAdmin ? '관리자' : '일반회원'}
                  </span>
                </td>
                <td className="py-3">
                  {u.isAdmin ? (
                    <button
                      onClick={() => void toggle(u._id, false)}
                      className="border border-eden-line px-3 py-1.5 text-xs text-eden-sage-dim hover:border-destructive hover:text-destructive"
                    >
                      권한 해제
                    </button>
                  ) : (
                    <button
                      onClick={() => void toggle(u._id, true)}
                      className="border border-eden-sand px-3 py-1.5 text-xs text-eden-sand hover:bg-eden-sand hover:text-eden-ink-2"
                    >
                      관리자로 지정
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
