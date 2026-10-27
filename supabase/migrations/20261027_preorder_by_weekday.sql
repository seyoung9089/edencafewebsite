-- Pre-orders by pickup day. Run after 20261023_order_cancel.sql.
-- Re-running this file is harmless (the menu is only seeded the first time).
--
-- 1) Menu by day: each bakery item says which pickup days sell it
--    (sale_days: 'weekday' = 월~목, 'friday' = 금). Flavours of one kind
--    (소금빵 기본/햄치즈/…) share a group_name; a group can cap how many an
--    order may hold in total (menu_groups.max_qty).
-- 2) Pickup is Mon–Fri, chosen by the customer, up to 14 days ahead. An order
--    closes at 23:59 (Korea time) two days before pickup: Friday pickup →
--    Wednesday 23:59.
-- 3) Friday orders are placed by parents and picked up by the student after
--    school: student name is required, and payment is 계좌이체 or 현장결제.
-- 4) All of the above is checked again in the database (check_order_rules
--    trigger), so an order that breaks a rule is never saved, whatever the
--    browser sends.
--
-- Price 0 means "not priced yet": the item shows on the menu but can't be
-- ordered until staff set a price in /admin → 메뉴.

-- ── 1. Menu ──────────────────────────────────────────────────────────────
create table if not exists public.menu_groups (
  name text primary key,
  sort_order integer not null default 0,
  -- Most of this group (all flavours together) one order may hold; null = no limit.
  max_qty integer check (max_qty is null or max_qty >= 1)
);
alter table public.menu_groups enable row level security;
drop policy if exists "groups read" on public.menu_groups;
create policy "groups read" on public.menu_groups for select to anon, authenticated using (true);
drop policy if exists "staff groups write" on public.menu_groups;
create policy "staff groups write" on public.menu_groups for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

alter table public.menu_catalog
  add column if not exists sale_days text[] not null default '{weekday,friday}',
  add column if not exists group_name text references public.menu_groups(name) on update cascade on delete set null;
alter table public.menu_catalog drop constraint if exists menu_catalog_sale_days_check;
alter table public.menu_catalog add constraint menu_catalog_sale_days_check
  check (sale_days <@ array['weekday','friday']);
-- 0 = price not decided yet (not orderable).
alter table public.menu_catalog drop constraint if exists menu_catalog_price_check;
alter table public.menu_catalog add constraint menu_catalog_price_check check (price >= 0);

-- First run only: the new pre-order menu. The old bakery items stay (with
-- their photos) but leave the order page; tick a day in /admin to bring one back.
do $$
begin
  if exists (select 1 from public.menu_groups) then return; end if;

  insert into public.menu_groups (name, sort_order, max_qty) values
    ('휘낭시에', 1, null),
    ('쿠키', 2, null),
    ('에그타르트', 3, null),
    ('베이글', 4, 9),
    ('소금빵', 5, 9),
    ('치아바타', 6, 9);

  update public.menu_catalog set sale_days = '{}' where category = 'bakery';

  insert into public.menu_catalog (name, price, category, sort_order, group_name, sale_days) values
    ('기본 휘낭시에', 0, 'bakery', 1, '휘낭시에', '{weekday,friday}'),
    ('초코 휘낭시에', 0, 'bakery', 2, '휘낭시에', '{weekday,friday}'),
    ('무화과크림치즈 휘낭시에', 0, 'bakery', 3, '휘낭시에', '{weekday,friday}'),
    ('브라우니 쿠키', 0, 'bakery', 4, '쿠키', '{weekday,friday}'),
    ('아메리칸 초코쿠키', 0, 'bakery', 5, '쿠키', '{weekday,friday}'),
    ('오레오 스모어쿠키', 0, 'bakery', 6, '쿠키', '{weekday,friday}'),
    ('커피크림치즈 쿠키', 0, 'bakery', 7, '쿠키', '{weekday,friday}'),
    ('에그타르트', 0, 'bakery', 8, '에그타르트', '{weekday,friday}'),
    ('블루베리 크림치즈 베이글', 0, 'bakery', 9, '베이글', '{weekday}'),
    ('갈릭 퐁당 베이글', 0, 'bakery', 10, '베이글', '{weekday}'),
    ('대파 베이컨 크림치즈 베이글', 0, 'bakery', 11, '베이글', '{weekday}'),
    ('기본 소금빵', 0, 'bakery', 12, '소금빵', '{friday}'),
    ('햄치즈 소금빵', 0, 'bakery', 13, '소금빵', '{friday}'),
    ('우유크림 소금빵', 0, 'bakery', 14, '소금빵', '{friday}'),
    ('플레인 치아바타', 0, 'bakery', 15, '치아바타', '{friday}'),
    ('크랜베리치즈 치아바타', 0, 'bakery', 16, '치아바타', '{friday}'),
    ('바질토마토 치아바타', 0, 'bakery', 17, '치아바타', '{friday}'),
    ('고구마치즈 치아바타', 0, 'bakery', 18, '치아바타', '{friday}'),
    ('올리브치즈 치아바타', 0, 'bakery', 19, '치아바타', '{friday}')
  on conflict (name) do nothing;
end $$;

-- ── 2. Orders: student name and payment ──────────────────────────────────
alter table public.orders
  add column if not exists student_name text,
  add column if not exists payment_method text not null default 'transfer',
  add column if not exists payment_status text not null default 'pending';
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('transfer','onsite'));
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('pending','confirmed','onsite') and (payment_status = 'onsite') = (payment_method = 'onsite'));

-- Orders from before this file: 입금확인/픽업완료 means the transfer arrived.
update public.orders set payment_status = 'confirmed'
  where payment_method = 'transfer' and payment_status = 'pending' and status in ('done','picked');

-- "10월 29일(수)" in Korean, for error messages.
create or replace function public.ko_date_label(d date) returns text
language sql immutable set search_path = '' as $$
  select to_char(d, 'FMMM"월" FMDD"일"') || '(' || (array['일','월','화','수','목','금','토'])[extract(dow from d)::int + 1] || ')'
$$;

-- ── 3. Rules, checked on every new order ─────────────────────────────────
create or replace function public.check_order_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_dow integer := extract(isodow from new.pickup_date)::integer;
  v_day text;
  v_bad text;
  v_group record;
begin
  if new.pickup_date is null or v_dow > 5 then
    raise exception '픽업은 월요일부터 금요일까지만 할 수 있어요.';
  end if;
  if new.pickup_date < v_today + 2 then
    raise exception '% 픽업 주문은 % 23:59에 마감됐어요. 다른 날짜를 골라 주세요.',
      public.ko_date_label(new.pickup_date), public.ko_date_label(new.pickup_date - 2);
  end if;
  if new.pickup_date > v_today + 14 then
    raise exception '2주 뒤 픽업까지만 미리 주문할 수 있어요.';
  end if;
  v_day := case when v_dow = 5 then 'friday' else 'weekday' end;

  -- Friday: parents order, the student picks up. Other days: bank transfer.
  if v_day = 'friday' then
    new.student_name := nullif(btrim(coalesce(new.student_name, '')), '');
    if new.student_name is null then raise exception '금요일 주문은 학생 이름을 꼭 적어 주세요.'; end if;
    if char_length(new.student_name) > 30 then raise exception '학생 이름이 너무 길어요.'; end if;
  else
    new.student_name := null;
    new.payment_method := 'transfer';
  end if;
  new.payment_status := case when new.payment_method = 'onsite' then 'onsite' else 'pending' end;

  -- Every item must be on that day's menu.
  select string_agg(item->>'name', ', ') into v_bad
  from jsonb_array_elements(new.items) as item
  where not exists (
    select 1 from public.menu_catalog m
    where m.name = item->>'name' and m.category = 'bakery' and v_day = any(m.sale_days)
  );
  if v_bad is not null then
    raise exception '% 픽업 메뉴가 아니에요: %', public.ko_date_label(new.pickup_date), v_bad;
  end if;

  -- Per-kind caps (소금빵·치아바타·베이글: all flavours together).
  for v_group in
    select g.name, g.max_qty, sum((item->>'qty')::integer) as total
    from jsonb_array_elements(new.items) as item
    join public.menu_catalog m on m.name = item->>'name'
    join public.menu_groups g on g.name = m.group_name
    where g.max_qty is not null
    group by g.name, g.max_qty
    having sum((item->>'qty')::integer) > g.max_qty
  loop
    raise exception '%은(는) 한 주문에 %개까지 담을 수 있어요. %개 이상 대량 주문은 사이트가 아닌 별도 문의로 받고 있습니다.',
      v_group.name, v_group.max_qty, v_group.max_qty + 1;
  end loop;

  return new;
end $$;

drop trigger if exists check_order_rules on public.orders;
create trigger check_order_rules before insert on public.orders
  for each row execute function public.check_order_rules();

-- Staff flip either 입금 확인 or the order status; the other one follows.
create or replace function public.sync_order_payment() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.payment_method <> 'transfer' then return new; end if;
  if new.payment_status is distinct from old.payment_status then
    if new.payment_status = 'confirmed' and new.status = 'wait' then new.status := 'done'; end if;
    if new.payment_status = 'pending' and new.status = 'done' then new.status := 'wait'; end if;
  elsif new.status is distinct from old.status then
    if new.status in ('done','picked') then new.payment_status := 'confirmed'; end if;
    if new.status = 'wait' then new.payment_status := 'pending'; end if;
  end if;
  return new;
end $$;

drop trigger if exists sync_order_payment on public.orders;
create trigger sync_order_payment before update on public.orders
  for each row execute function public.sync_order_payment();

-- ── 4. place_order with the pickup day the customer chose ────────────────
drop function if exists public.place_order(jsonb, date);
create or replace function public.place_order(
  p_items jsonb,
  p_pickup_date date,
  p_student_name text default null,
  p_payment_method text default 'transfer'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_item jsonb; v_name text; v_qty integer; v_price integer;
  v_stock integer; v_total integer := 0; v_items jsonb := '[]'::jsonb; v_id uuid;
begin
  if v_user is null then raise exception 'Login required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Invalid order'; end if;
  if coalesce(p_payment_method, '') not in ('transfer','onsite') then raise exception '결제 방법을 골라 주세요.'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_name := v_item->>'name';
    if coalesce(v_item->>'qty', '') !~ '^[0-9]+$' then raise exception 'Invalid quantity'; end if;
    v_qty := (v_item->>'qty')::integer;
    if v_qty not between 1 and 20 then raise exception 'Invalid quantity'; end if;
    v_price := null;
    select price, stock into v_price, v_stock from public.menu_catalog
      where name = v_name and category = 'bakery' and not sold_out and price > 0 for update;
    if v_price is null then raise exception 'Only available bakery items can be ordered online: %', v_name; end if;
    if v_stock is not null then
      if v_stock < v_qty then raise exception '재고가 부족해요: % (남은 수량 %개)', v_name, v_stock; end if;
      update public.menu_catalog set stock = stock - v_qty where name = v_name;
    end if;
    v_total := v_total + v_price * v_qty;
    v_items := v_items || jsonb_build_array(jsonb_build_object('name',v_name,'price',v_price,'qty',v_qty));
  end loop;
  -- check_order_rules validates the day, deadline, student name and caps.
  insert into public.orders(user_id,items,total,pickup_date,student_name,payment_method)
    values(v_user,v_items,v_total,p_pickup_date,p_student_name,p_payment_method) returning id into v_id;
  delete from public.cart_items where user_id = v_user;
  return v_id;
end $$;
revoke all on function public.place_order(jsonb,date,text,text) from public, anon;
grant execute on function public.place_order(jsonb,date,text,text) to authenticated;

-- Carts skip items without a price yet (cart_items requires price > 0).
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
      where name = v_name and category = 'bakery' and not sold_out and price > 0 and (stock is null or stock > 0);
    if v_price is null then continue; end if;
    insert into public.cart_items(user_id,name,price,qty) values(v_user,v_name,v_price,v_qty)
      on conflict(user_id,name) do update set qty = excluded.qty, price = excluded.price;
  end loop;
end $$;
revoke all on function public.set_cart(jsonb) from public, anon;
grant execute on function public.set_cart(jsonb) to authenticated;

-- Let the API see the new place_order signature right away.
notify pgrst, 'reload schema';
