-- 답례품 예약 (/gifts). Run after 20261027_village_and_parent_orders.sql.
-- Re-running this file is harmless.
--
-- Gifts work like the 마을 픽업 주문: pick a weekday, put gifts in, order,
-- pay by bank transfer and pick up at the cafe. They are their own menu
-- category ('gift') and their own order type ('gift'), so a gift order never
-- mixes with bread. A gift order can carry a short request (포장 문구 등).
--
-- Gift rules (change the numbers here and in src/lib/cart.tsx / pickup.ts):
--   deadline  GIFT_DEADLINE_DAYS = 2 days before pickup, 23:59
--   quantity  1–50 of each gift per order

-- ── 1. Gift menu items and gift orders ───────────────────────────────────
alter table public.menu_catalog drop constraint if exists menu_catalog_category_check;
alter table public.menu_catalog add constraint menu_catalog_category_check
  check (category in ('bakery','drink','gift'));

alter table public.orders drop constraint if exists orders_order_type_check;
alter table public.orders add constraint orders_order_type_check check (order_type in ('village','parents','gift'));
alter table public.orders add column if not exists request_note text;

-- ── 2. Rules, now with gifts ─────────────────────────────────────────────
create or replace function public.check_order_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_dow integer := extract(isodow from new.pickup_date)::integer;
  v_deadline integer := 2; -- days before pickup; same for gifts for now
  v_day text;
  v_bad text;
  v_group record;
begin
  if new.pickup_date is null or v_dow > 5 then
    raise exception '픽업은 월요일부터 금요일까지만 할 수 있어요.';
  end if;
  if new.pickup_date < v_today + v_deadline then
    raise exception '% 픽업 주문은 % 23:59에 마감됐어요. 다른 날짜를 골라 주세요.',
      public.ko_date_label(new.pickup_date), public.ko_date_label(new.pickup_date - v_deadline);
  end if;
  if new.pickup_date > v_today + 14 then
    raise exception '2주 뒤 픽업까지만 미리 주문할 수 있어요.';
  end if;
  v_day := case when v_dow = 5 then 'friday' else 'weekday' end;

  -- 답례품 예약: gifts only, picked up by whoever ordered, 계좌이체.
  if new.order_type = 'gift' then
    new.student_name := null;
    new.payment_method := 'transfer';
    new.payment_status := 'pending';
    new.request_note := nullif(btrim(coalesce(new.request_note, '')), '');
    if char_length(new.request_note) > 300 then raise exception '요청사항은 300자까지 적을 수 있어요.'; end if;

    select string_agg(item->>'name', ', ') into v_bad
    from jsonb_array_elements(new.items) as item
    where not exists (
      select 1 from public.menu_catalog m where m.name = item->>'name' and m.category = 'gift'
    );
    if v_bad is not null then raise exception '답례품이 아닌 메뉴가 있어요: %', v_bad; end if;
    return new;
  end if;
  new.request_note := null;

  -- 학부모 주문: Friday only, the student picks up, 계좌이체 or 현장결제.
  -- 마을 픽업 주문: any pickup day, picked up by whoever ordered, 계좌이체.
  if new.order_type = 'parents' then
    if v_day <> 'friday' then raise exception '학부모 주문은 금요일 픽업만 할 수 있어요.'; end if;
    new.student_name := nullif(btrim(coalesce(new.student_name, '')), '');
    if new.student_name is null then raise exception '학부모 주문은 학생 이름을 꼭 적어 주세요.'; end if;
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

-- ── 3. place_order takes gifts and a request note ───────────────────────
drop function if exists public.place_order(jsonb, date, text, text, text);
create or replace function public.place_order(
  p_items jsonb,
  p_pickup_date date,
  p_student_name text default null,
  p_payment_method text default 'transfer',
  p_order_type text default 'village',
  p_request_note text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_item jsonb; v_name text; v_qty integer; v_price integer;
  v_stock integer; v_total integer := 0; v_items jsonb := '[]'::jsonb; v_id uuid;
  v_category text; v_max integer;
begin
  if v_user is null then raise exception 'Login required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Invalid order'; end if;
  if coalesce(p_payment_method, '') not in ('transfer','onsite') then raise exception '결제 방법을 골라 주세요.'; end if;
  if coalesce(p_order_type, '') not in ('village','parents','gift') then raise exception 'Invalid order'; end if;
  v_category := case when p_order_type = 'gift' then 'gift' else 'bakery' end;
  v_max := case when p_order_type = 'gift' then 50 else 20 end;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_name := v_item->>'name';
    if coalesce(v_item->>'qty', '') !~ '^[0-9]+$' then raise exception 'Invalid quantity'; end if;
    v_qty := (v_item->>'qty')::integer;
    if v_qty not between 1 and v_max then raise exception 'Invalid quantity'; end if;
    v_price := null;
    select price, stock into v_price, v_stock from public.menu_catalog
      where name = v_name and category = v_category and not sold_out and price > 0 for update;
    if v_price is null then raise exception 'Unavailable menu item: %', v_name; end if;
    if v_stock is not null then
      if v_stock < v_qty then raise exception '재고가 부족해요: % (남은 수량 %개)', v_name, v_stock; end if;
      update public.menu_catalog set stock = stock - v_qty where name = v_name;
    end if;
    v_total := v_total + v_price * v_qty;
    v_items := v_items || jsonb_build_array(jsonb_build_object('name',v_name,'price',v_price,'qty',v_qty));
  end loop;
  -- check_order_rules validates the day, deadline, student name, caps and note.
  insert into public.orders(user_id,items,total,pickup_date,student_name,payment_method,order_type,request_note)
    values(v_user,v_items,v_total,p_pickup_date,p_student_name,p_payment_method,p_order_type,p_request_note) returning id into v_id;
  -- The saved cart only holds bread; a gift order leaves it alone.
  if p_order_type <> 'gift' then delete from public.cart_items where user_id = v_user; end if;
  return v_id;
end $$;
revoke all on function public.place_order(jsonb,date,text,text,text,text) from public, anon;
grant execute on function public.place_order(jsonb,date,text,text,text,text) to authenticated;

-- Let the API see the new place_order signature right away.
notify pgrst, 'reload schema';
