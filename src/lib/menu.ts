import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PickupDay } from '@/lib/pickup'

/** One row of the Supabase `menu_catalog` table: shown on the menu and ordered. */
export type MenuItem = {
  name: string
  price: number
  sold_out: boolean
  /** Remaining quantity; null means no limit. */
  stock: number | null
  category: 'bakery' | 'drink' | 'gift'
  description: string
  sort_order: number
  image_url: string | null
  /** Manually pinned into the "인기 메뉴" shelf by staff (max 2; see menu-panel.tsx). */
  is_featured: boolean
  /** Pickup days that sell this bakery item; empty = not on the order page. */
  sale_days: PickupDay[]
  /** Kind this item is a flavour of (see menu_groups), e.g. '소금빵'. */
  group_name: string | null
}

/** One row of `menu_groups`: a kind of bread with its flavours. */
export type MenuGroup = {
  name: string
  sort_order: number
  /** Most of this kind (all flavours together) one order may hold; null = no limit. */
  max_qty: number | null
}

export function toMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    name: String(row.name),
    price: Number(row.price),
    sold_out: Boolean(row.sold_out),
    stock: typeof row.stock === 'number' ? row.stock : null,
    category: row.category === 'drink' || row.category === 'gift' ? row.category : 'bakery',
    description: typeof row.description === 'string' ? row.description : '',
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : 0,
    image_url: typeof row.image_url === 'string' && row.image_url ? row.image_url : null,
    is_featured: Boolean(row.is_featured),
    sale_days: Array.isArray(row.sale_days)
      ? row.sale_days.filter((d): d is PickupDay => d === 'weekday' || d === 'friday')
      : ['weekday', 'friday'],
    group_name: typeof row.group_name === 'string' && row.group_name ? row.group_name : null,
  }
}

/** Not priced yet (price 0): shown, but can't be ordered. */
export function isUnpriced(item: Pick<MenuItem, 'price'>): boolean {
  return item.price <= 0
}

export async function fetchMenuGroups(): Promise<MenuGroup[]> {
  const { data, error } = await supabase.from('menu_groups').select('name,sort_order,max_qty').order('sort_order')
  if (error) throw error
  return (data ?? []).map((g) => ({
    name: String(g.name),
    sort_order: Number(g.sort_order) || 0,
    max_qty: typeof g.max_qty === 'number' ? g.max_qty : null,
  }))
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

/** The menu and its kinds, or undefined while loading. */
export function useMenu(): { items: MenuItem[] | undefined; groups: MenuGroup[]; error: string } {
  const [items, setItems] = useState<MenuItem[] | undefined>(undefined)
  const [groups, setGroups] = useState<MenuGroup[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([fetchMenu(), fetchMenuGroups()])
      .then(([rows, kinds]) => {
        if (!active) return
        setGroups(kinds)
        setItems(rows)
      })
      .catch((e: unknown) => {
        if (!active) return
        setItems([])
        setError(e instanceof Error ? e.message : '메뉴를 불러오지 못했어요.')
      })
    return () => {
      active = false
    }
  }, [])
  return { items, groups, error }
}
