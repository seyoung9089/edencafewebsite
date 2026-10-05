import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'

export type CartItem = { name: string; price: number; qty: number }

type CartContextValue = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQty: (name: string, qty: number) => void
  removeItem: (name: string) => void
  clear: () => void
  totalQty: number
  totalPrice: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'edenCartV2'

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useCustomerAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [readyFor, setReadyFor] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    let active = true
    setReadyFor(null)
    if (!user) {
      setItems(loadCart())
      setReadyFor('guest')
      return
    }
    void supabase.from('cart_items').select('name,price,qty').eq('user_id', user.id).then(({ data, error }) => {
      if (!active) return
      if (error) { setItems(loadCart()); setReadyFor('guest'); return }
      const guest = loadCart()
      const merged = new Map<string, CartItem>()
      for (const row of data ?? []) merged.set(row.name, { name: row.name, price: row.price, qty: row.qty })
      for (const row of guest) {
        const old = merged.get(row.name)
        merged.set(row.name, { ...row, qty: Math.min(20, row.qty + (old?.qty ?? 0)) })
      }
      window.localStorage.removeItem(STORAGE_KEY)
      setItems([...merged.values()])
      setReadyFor(user.id)
    })
    return () => { active = false }
  }, [user?.id, loading])

  useEffect(() => {
    if (!readyFor) return
    if (readyFor !== 'guest') {
      const timer = window.setTimeout(() => {
        void supabase.rpc('set_cart', { p_items: items.map(({ name, qty }) => ({ name, qty })) })
      }, 250)
      return () => window.clearTimeout(timer)
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* ignore storage failures */
    }
  }, [items, readyFor])

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.name === item.name)
      if (existing) {
        return prev.map((it) => (it.name === item.name ? { ...it, qty: it.qty + item.qty } : it))
      }
      return [...prev, item]
    })
  }
  const updateQty = (name: string, qty: number) => {
    setItems((prev) => prev.map((it) => (it.name === name ? { ...it, qty: Math.max(1, Math.min(20, qty)) } : it)))
  }
  const removeItem = (name: string) => {
    setItems((prev) => prev.filter((it) => it.name !== name))
  }
  const clear = () => setItems([])

  const totalQty = items.reduce((s, it) => s + it.qty, 0)
  const totalPrice = items.reduce((s, it) => s + it.price * it.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, totalQty, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
