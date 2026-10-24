import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useCustomerAuth } from '@/lib/customer-auth'
import { supabase } from '@/lib/supabase'
import { isSoldOut, type MenuItem } from '@/lib/menu'
import { toast } from 'sonner'

export type CartItem = { name: string; price: number; qty: number }

/** Most of one item a single order can hold (place_order allows 1–20). */
export const MAX_QTY = 20

/** How many of this menu item can go in the cart right now. */
export function maxQtyFor(item: Pick<MenuItem, 'stock'> | undefined): number {
  return Math.min(MAX_QTY, item?.stock ?? MAX_QTY)
}

/**
 * Brings the cart in line with the current menu: drops items that sold out or
 * can't be ordered online, lowers quantities above what's left, and updates
 * prices. `changed` is false when the cart already matched.
 */
export function reconcileCart(items: CartItem[], menu: MenuItem[]) {
  const byName = new Map(menu.map((m) => [m.name, m]))
  const removed: string[] = []
  const reduced: { name: string; qty: number }[] = []
  let changed = false
  const next: CartItem[] = []
  for (const it of items) {
    const m = byName.get(it.name)
    if (!m || m.category !== 'bakery' || isSoldOut(m)) {
      removed.push(it.name)
      changed = true
      continue
    }
    const qty = Math.min(it.qty, maxQtyFor(m))
    if (qty < it.qty) reduced.push({ name: it.name, qty })
    if (qty !== it.qty || m.price !== it.price) changed = true
    next.push({ name: it.name, price: m.price, qty })
  }
  return { next, removed, reduced, changed }
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQty: (name: string, qty: number) => void
  removeItem: (name: string) => void
  clear: () => void
  /** Swaps in a whole new cart (see reconcileCart). */
  replaceItems: (items: CartItem[]) => void
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
        merged.set(row.name, { ...row, qty: Math.min(MAX_QTY, row.qty + (old?.qty ?? 0)) })
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
        void supabase.rpc('set_cart', { p_items: items.map(({ name, qty }) => ({ name, qty })) }).then(({ error }) => {
          if (error) toast.error('담은 메뉴를 저장하지 못했어요. 인터넷 연결을 확인해주세요.')
        })
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
        return prev.map((it) => (it.name === item.name ? { ...it, qty: Math.min(MAX_QTY, it.qty + item.qty) } : it))
      }
      return [...prev, { ...item, qty: Math.min(MAX_QTY, item.qty) }]
    })
  }
  const updateQty = (name: string, qty: number) => {
    setItems((prev) => prev.map((it) => (it.name === name ? { ...it, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : it)))
  }
  const removeItem = (name: string) => {
    setItems((prev) => prev.filter((it) => it.name !== name))
  }
  const clear = () => setItems([])
  const replaceItems = (next: CartItem[]) => setItems(next)

  const totalQty = items.reduce((s, it) => s + it.qty, 0)
  const totalPrice = items.reduce((s, it) => s + it.price * it.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, replaceItems, totalQty, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
