import { useEffect, useState } from 'react'
import { useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'

/** Whether the signed-in account is listed in Supabase `staff_users`. null while checking. */
export function useStaff() {
  const { user, loading } = useCustomerAuth()
  const [isStaff, setIsStaff] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) {
      setIsStaff(false)
      return
    }
    let active = true
    setIsStaff(null)
    void supabase
      .from('staff_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setIsStaff(Boolean(data))
      })
    return () => {
      active = false
    }
  }, [user?.id, loading])

  return { user, loading: loading || (user !== null && isStaff === null), isStaff: Boolean(isStaff) }
}

/** Email for each customer id, from `customer_profiles` (staff can read all). */
export async function fetchEmails(): Promise<Map<string, string>> {
  const { data } = await supabase.from('customer_profiles').select('user_id,email')
  return new Map((data ?? []).map((p) => [p.user_id as string, p.email as string]))
}

export const inputClass = 'rounded-[10px] border border-eden-line bg-eden-paper px-3 py-2 text-sm'
export const buttonClass =
  'rounded-full bg-eden-ink px-4 py-2 text-sm font-semibold text-eden-paper transition-colors hover:bg-eden-ink-2 disabled:opacity-50'
