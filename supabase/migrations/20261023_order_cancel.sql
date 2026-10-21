-- Order cancellation, and carts that keep saving when a bread sells out.
-- Run after 20261019_bakery_only_orders.sql. Re-running this file is harmless.
--
-- 1) A fourth order status, 'cancelled'. Cancelling puts the reserved stock
--    back, whoever cancels: staff from /admin, or the customer from 내 주문
--    (only while the order is still 입금대기). A cancelled order stays
--    cancelled, so stock can't be returned twice.
-- 2) set_cart skips items that are no longer orderable instead of failing the
--    whole cart, so the rest of the cart still saves.

-- ── 1. Cancel ────────────────────────────────────────────────────────────
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('wait','done','picked','cancelled'));

create or replace function public.restock_cancelled_order() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_item jsonb;
begin
  if old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception '취소한 주문은 되돌릴 수 없어요.';
  end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    for v_item in select value from jsonb_array_elements(old.items) loop
      update public.menu_catalog set stock = stock + (v_item->>'qty')::integer
        where name = v_item->>'name' and stock is not null;
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists on_order_cancel on public.orders;
create trigger on_order_cancel before update of status on public.orders
  for each row execute function public.restock_cancelled_order();

create or replace function public.cancel_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_status text;
begin
  if (select auth.uid()) is null then raise exception 'Login required'; end if;
  select status into v_status from public.orders
    where id = p_order_id and user_id = (select auth.uid()) for update;
  if v_status is null then raise exception '주문을 찾을 수 없어요.'; end if;
  if v_status <> 'wait' then
    raise exception '입금이 확인된 주문은 직접 취소할 수 없어요. 카페에 문의해주세요.';
  end if;
  update public.orders set status = 'cancelled' where id = p_order_id;
end $$;
revoke all on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;

-- Cancelled orders don't count toward the 인기 메뉴 ranking.
create or replace function public.menu_popularity()
returns table(name text, total_qty bigint)
language sql stable security definer set search_path = '' as $$
  select (item->>'name')::text as name, sum((item->>'qty')::int)::bigint as total_qty
  from public.orders, jsonb_array_elements(public.orders.items) as item
  where public.orders.status <> 'cancelled'
  group by (item->>'name')
$$;
revoke all on function public.menu_popularity() from public;
grant execute on function public.menu_popularity() to anon, authenticated;

-- ── 2. Cart keeps saving ─────────────────────────────────────────────────
create or replace function public.set_cart(p_items jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_item jsonb; v_name text; v_qty integer; v_price integer;
begin
  if v_user is null then raise exception 'Login required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 50 then raise exception 'Invalid cart'; end if;
  delete from public.cart_items where user_id = v_user;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_name := v_item->>'name';
    if coalesce(v_item->>'qty', '') !~ '^[0-9]+$' then continue; end if;
    v_qty := least((v_item->>'qty')::integer, 20);
    if v_qty < 1 then continue; end if;
    v_price := null;
    select price into v_price from public.menu_catalog
      where name = v_name and category = 'bakery' and not sold_out and (stock is null or stock > 0);
    if v_price is null then continue; end if;
    insert into public.cart_items(user_id,name,price,qty) values(v_user,v_name,v_price,v_qty)
      on conflict(user_id,name) do update set qty = excluded.qty, price = excluded.price;
  end loop;
end $$;
revoke all on function public.set_cart(jsonb) from public, anon;
grant execute on function public.set_cart(jsonb) to authenticated;
