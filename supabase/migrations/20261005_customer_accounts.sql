-- Run once in the Supabase SQL Editor. Public keys are safe only with RLS enabled.
create table if not exists public.menu_catalog (
  name text primary key,
  price integer not null check (price > 0),
  sold_out boolean not null default false
);
insert into public.menu_catalog (name, price) values
('단호박 크림빵',4500),('통밀 캄파뉴',6000),('이든 소금빵',4000),('제철 과일 스콘',4800),
('이든 시그니처 라떼',4800),('오늘의 드립커피',4300),('이든 아메리카노',3500),
('아인슈페너',5000),('카페모카',5000),('카모마일 티',4000)
on conflict (name) do nothing;

create table if not exists public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null references public.menu_catalog(name),
  price integer not null check (price > 0),
  qty integer not null check (qty between 1 and 20),
  primary key (user_id, name)
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null,
  total integer not null check (total > 0),
  status text not null default 'wait' check (status in ('wait','done','picked')),
  pickup_date date not null,
  created_at timestamptz not null default now()
);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('픽업문의','결제문의','시스템문의','이용문의','기타문의')),
  title text not null check (char_length(title) between 1 and 100),
  content text not null check (char_length(content) between 1 and 3000),
  status text not null default 'wait' check (status in ('wait','done')),
  reply text,
  created_at timestamptz not null default now()
);
create index if not exists inquiries_user_created_idx on public.inquiries(user_id, created_at desc);

alter table public.menu_catalog enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.inquiries enable row level security;
create policy "catalog read" on public.menu_catalog for select to anon, authenticated using (true);
create policy "own cart read" on public.cart_items for select to authenticated using (user_id = (select auth.uid()));
create policy "own orders read" on public.orders for select to authenticated using (user_id = (select auth.uid()));
create policy "own inquiries read" on public.inquiries for select to authenticated using (user_id = (select auth.uid()));
create policy "own inquiries insert" on public.inquiries for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'wait' and reply is null);

-- Server functions set the price from the catalog; the browser cannot set order totals.
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
    select price into v_price from public.menu_catalog where name = v_name and not sold_out;
    if v_price is null then raise exception 'Unavailable menu item: %', v_name; end if;
    insert into public.cart_items(user_id,name,price,qty) values(v_user,v_name,v_price,v_qty)
      on conflict(user_id,name) do update set qty = excluded.qty, price = excluded.price;
  end loop;
end $$;

create or replace function public.place_order(p_items jsonb, p_pickup_date date) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_item jsonb; v_name text; v_qty integer; v_price integer;
  v_total integer := 0; v_items jsonb := '[]'::jsonb; v_id uuid;
  v_kst timestamp := now() at time zone 'Asia/Seoul'; v_day integer; v_target integer; v_expected date;
begin
  if v_user is null then raise exception 'Login required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Invalid order'; end if;
  v_day := extract(dow from v_kst)::integer;
  v_target := case when (v_day = 1 and extract(hour from v_kst) >= 19)
                   or v_day = 2 or (v_day = 3 and extract(hour from v_kst) < 19)
                   then 4 else 2 end;
  v_expected := v_kst::date + ((v_target - v_day + 7) % 7);
  if p_pickup_date is distinct from v_expected then raise exception 'Pickup schedule changed. Please refresh the cart.'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_name := v_item->>'name';
    if v_item->>'qty' !~ '^[0-9]+$' then raise exception 'Invalid quantity'; end if;
    v_qty := (v_item->>'qty')::integer;
    if v_qty not between 1 and 20 then raise exception 'Invalid quantity'; end if;
    select price into v_price from public.menu_catalog where name = v_name and not sold_out;
    if v_price is null then raise exception 'Unavailable menu item: %', v_name; end if;
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

-- Staff access is granted only by a project owner in the SQL Editor.
create table if not exists public.staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null
);
insert into public.customer_profiles(user_id,email)
  select id, coalesce(email,'') from auth.users on conflict(user_id) do update set email=excluded.email;
create or replace function public.sync_customer_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.customer_profiles(user_id,email) values(new.id, coalesce(new.email,''))
    on conflict(user_id) do update set email=excluded.email;
  return new;
end $$;
drop trigger if exists on_auth_user_profile on auth.users;
create trigger on_auth_user_profile after insert or update of email on auth.users
  for each row execute function public.sync_customer_profile();

alter table public.staff_users enable row level security;
alter table public.customer_profiles enable row level security;
create policy "staff self read" on public.staff_users for select to authenticated using(user_id=(select auth.uid()));
create policy "profile self or staff read" on public.customer_profiles for select to authenticated
  using(user_id=(select auth.uid()) or exists(select 1 from public.staff_users where user_id=(select auth.uid())));
create policy "staff orders read" on public.orders for select to authenticated
  using(exists(select 1 from public.staff_users where user_id=(select auth.uid())));
create policy "staff orders update" on public.orders for update to authenticated
  using(exists(select 1 from public.staff_users where user_id=(select auth.uid())))
  with check(exists(select 1 from public.staff_users where user_id=(select auth.uid())));
create policy "staff inquiries read" on public.inquiries for select to authenticated
  using(exists(select 1 from public.staff_users where user_id=(select auth.uid())));
create policy "staff inquiries update" on public.inquiries for update to authenticated
  using(exists(select 1 from public.staff_users where user_id=(select auth.uid())))
  with check(exists(select 1 from public.staff_users where user_id=(select auth.uid())));
create policy "staff catalog insert" on public.menu_catalog for insert to authenticated
  with check(exists(select 1 from public.staff_users where user_id=(select auth.uid())));
create policy "staff catalog update" on public.menu_catalog for update to authenticated
  using(exists(select 1 from public.staff_users where user_id=(select auth.uid())))
  with check(exists(select 1 from public.staff_users where user_id=(select auth.uid())));
create policy "staff catalog delete" on public.menu_catalog for delete to authenticated
  using(exists(select 1 from public.staff_users where user_id=(select auth.uid())));
revoke update on public.orders from anon, authenticated;
revoke update on public.inquiries from anon, authenticated;
grant update(status) on public.orders to authenticated;
grant update(status,reply) on public.inquiries to authenticated;
