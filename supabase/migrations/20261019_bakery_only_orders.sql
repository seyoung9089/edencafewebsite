-- Drinks stay visible on the menu but cannot be saved to carts or ordered online.
-- Run after 20261016_move_to_supabase.sql and 20261015_daily_pickup.sql.
create or replace function public.set_cart(p_items jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_item jsonb; v_name text; v_qty integer; v_price integer;
begin
  if v_user is null then raise exception 'Login required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 50 then raise exception 'Invalid cart'; end if;
  delete from public.cart_items where user_id = v_user;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_name := v_item->>'name';
    if v_item->>'qty' !~ '^[0-9]+$' then raise exception 'Invalid quantity'; end if;
    v_qty := (v_item->>'qty')::integer;
    if v_qty not between 1 and 20 then raise exception 'Invalid quantity'; end if;
    select price into v_price from public.menu_catalog
      where name = v_name and category = 'bakery' and not sold_out and (stock is null or stock > 0);
    if v_price is null then raise exception 'Only available bakery items can be ordered online: %', v_name; end if;
    insert into public.cart_items(user_id,name,price,qty) values(v_user,v_name,v_price,v_qty)
      on conflict(user_id,name) do update set qty = excluded.qty, price = excluded.price;
  end loop;
end $$;

create or replace function public.place_order(p_items jsonb, p_pickup_date date) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_item jsonb; v_name text; v_qty integer; v_price integer;
  v_stock integer; v_total integer := 0; v_items jsonb := '[]'::jsonb; v_id uuid;
  v_expected date := (now() at time zone 'Asia/Seoul')::date + 1;
begin
  if v_user is null then raise exception 'Login required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Invalid order'; end if;
  if p_pickup_date is distinct from v_expected then raise exception 'Pickup schedule changed. Please refresh the cart.'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_name := v_item->>'name';
    if v_item->>'qty' !~ '^[0-9]+$' then raise exception 'Invalid quantity'; end if;
    v_qty := (v_item->>'qty')::integer;
    if v_qty not between 1 and 20 then raise exception 'Invalid quantity'; end if;
    select price, stock into v_price, v_stock from public.menu_catalog
      where name = v_name and category = 'bakery' and not sold_out for update;
    if v_price is null then raise exception 'Only available bakery items can be ordered online: %', v_name; end if;
    if v_stock is not null then
      if v_stock < v_qty then raise exception '재고가 부족해요: % (남은 수량 %개)', v_name, v_stock; end if;
      update public.menu_catalog set stock = stock - v_qty where name = v_name;
    end if;
    v_total := v_total + v_price * v_qty;
    v_items := v_items || jsonb_build_array(jsonb_build_object('name',v_name,'price',v_price,'qty',v_qty));
  end loop;
  insert into public.orders(user_id,items,total,pickup_date) values(v_user,v_items,v_total,p_pickup_date) returning id into v_id;
  delete from public.cart_items where user_id = v_user;
  return v_id;
end $$;
revoke all on function public.set_cart(jsonb) from public, anon;
revoke all on function public.place_order(jsonb,date) from public, anon;
grant execute on function public.set_cart(jsonb) to authenticated;
grant execute on function public.place_order(jsonb,date) to authenticated;

