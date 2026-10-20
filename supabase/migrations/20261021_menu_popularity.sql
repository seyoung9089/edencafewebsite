-- Aggregate order history into a public, PII-free popularity ranking per
-- menu item name, so the /menu page can show "인기 메뉴" at the top without
-- exposing anyone's individual orders (orders itself stays staff/owner-only).

create or replace function public.menu_popularity()
returns table(name text, total_qty bigint)
language sql stable security definer set search_path = '' as $$
  select (item->>'name')::text as name, sum((item->>'qty')::int)::bigint as total_qty
  from public.orders, jsonb_array_elements(public.orders.items) as item
  group by (item->>'name')
$$;

revoke all on function public.menu_popularity() from public;
grant execute on function public.menu_popularity() to anon, authenticated;
