import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** One row of the Supabase `menu_catalog` table: shown on the menu and ordered. */
export type MenuItem = {
  name: string
  price: number
  sold_out: boolean
  /** Remaining quantity; null means no limit. */
  stock: number | null
  category: 'bakery' | 'drink'
  description: string
  sort_order: number
  image_url: string | null
  /** Manually pinned into the "인기 메뉴" shelf by staff (max 2; see menu-panel.tsx). */
  is_featured: boolean
}

export function toMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    name: String(row.name),
    price: Number(row.price),
    sold_out: Boolean(row.sold_out),
    stock: typeof row.stock === 'number' ? row.stock : null,
    category: row.category === 'drink' ? 'drink' : 'bakery',
    description: typeof row.description === 'string' ? row.description : '',
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : 0,
    image_url: typeof row.image_url === 'string' && row.image_url ? row.image_url : null,
    is_featured: Boolean(row.is_featured),
  }
}

export function sortMenu(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'ko'))
}

export async function fetchMenu(): Promise<MenuItem[]> {
  // select('*') keeps working whichever optional columns exist yet.
  const { data, error } = await supabase.from('menu_catalog').select('*')
  if (error) throw error
  return sortMenu((data ?? []).map(toMenuItem))
}

export function isSoldOut(item: MenuItem): boolean {
  return item.sold_out || item.stock === 0
}

/** Total quantity ever ordered, per menu item name. PII-free aggregate (see menu_popularity() RPC). */
export async function fetchPopularity(): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc('menu_popularity')
  if (error) throw error
  return new Map((data ?? []).map((r: { name: string; total_qty: number }) => [r.name, Number(r.total_qty)]))
}

/** The menu, or undefined while loading. */
export function useMenu(): { items: MenuItem[] | undefined; error: string } {
  const [items, setItems] = useState<MenuItem[] | undefined>(undefined)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    fetchMenu()
      .then((rows) => active && setItems(rows))
      .catch((e: unknown) => {
        if (!active) return
        setItems([])
        setError(e instanceof Error ? e.message : '메뉴를 불러오지 못했어요.')
      })
    return () => {
      active = false
    }
  }, [])
  return { items, error }
}
