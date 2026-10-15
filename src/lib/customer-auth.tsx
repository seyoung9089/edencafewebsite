import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthState = { user: User | null; loading: boolean }
const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) { setUser(data.user); setLoading(false) }
    }).catch(() => { if (mounted) setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) { setUser(session?.user ?? null); setLoading(false) }
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useCustomerAuth() { return useContext(AuthContext) }

/** The name the customer gave (sign-up or 내 주문), or '' if none yet. */
export function customerName(user: User | null): string {
  const name = user?.user_metadata?.name
  return typeof name === 'string' ? name.trim() : ''
}
