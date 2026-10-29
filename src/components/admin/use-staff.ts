import { useEffect, useState } from 'react'
import { useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'

/** Whether the signed-in account is listed in Supabase `staff_users`, and whether it's a super admin. null while checking. */
export function useStaff() {
  const { user, loading } = useCustomerAuth()
  const [isStaff, setIsStaff] = useState<boolean | null>(null)
  const [isSuper, setIsSuper] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      setIsStaff(false)
      setIsSuper(false)
      return
    }
    let active = true
    setIsStaff(null)
    void supabase
      .from('staff_users')
      .select('user_id,is_super')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setIsStaff(Boolean(data))
        setIsSuper(Boolean(data?.is_super))
      })
    return () => {
      active = false
    }
  }, [user?.id, loading])

  return { user, loading: loading || (user !== null && isStaff === null), isStaff: Boolean(isStaff), isSuper }
}

export type Customer = { id: string; email: string; name: string }

/** Every customer profile (staff can read all). select('*') works before the name column exists. */
export async function fetchCustomers(): Promise<Customer[]> {
  const { data } = await supabase.from('customer_profiles').select('*')
  return (data ?? []).map((p) => ({ id: p.user_id as string, email: (p.email as string) ?? '', name: typeof p.name === 'string' ? p.name : '' }))
}

/** "이름 (email)" — or just the email — for each customer id. */
export async function fetchCustomerLabels(): Promise<Map<string, string>> {
  const customers = await fetchCustomers()
  return new Map(customers.map((c) => [c.id, c.name ? `${c.name} (${c.email})` : c.email]))
}

export const inputClass = 'rounded-[10px] border border-eden-line bg-eden-paper px-3 py-2 text-sm'
export const buttonClass =
  'rounded-[3px] bg-eden-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-eden-accent-d disabled:opacity-50'
