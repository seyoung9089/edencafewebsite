-- 1/4: 메뉴 칸 추가 + 메뉴 설명 복사. 20261016_move_to_supabase.sql을 4개로 나눈 것과 같은 내용이에요.
-- Step 1 of 2 for the Supabase-only site. Safe to run now: it only adds
-- columns, tables and permissions; the current live site keeps working.
-- (Step 2, 20261015_daily_pickup.sql, runs on the day the new site goes live.)
--
-- Moves everything that used to live in Convex (managed by Macaly) into
-- Supabase: menu descriptions/categories/order/photos, site text, images,
-- and admin (staff) management. Re-running this file is harmless.

-- ── Helper: is the signed-in user staff? ─────────────────────────────────
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.staff_users where user_id = (select auth.uid()))
$$;
grant execute on function public.is_staff() to anon, authenticated;

-- ── Menu: one table for everything shown and ordered ─────────────────────
alter table public.menu_catalog
  add column if not exists stock integer check (stock is null or stock >= 0),
  add column if not exists category text not null default 'bakery' check (category in ('bakery','drink')),
  add column if not exists description text not null default '',
  add column if not exists sort_order integer not null default 0,
  add column if not exists image_url text;

-- Renaming or deleting a menu item updates/clears it in customers' carts.
alter table public.cart_items drop constraint if exists cart_items_name_fkey;
alter table public.cart_items add constraint cart_items_name_fkey
  foreign key (name) references public.menu_catalog(name) on update cascade on delete cascade;

-- Descriptions, categories and order copied from Convex. Price and sold-out
-- already live here, so existing rows keep theirs.
insert into public.menu_catalog (name, price, category, description, sort_order) values
  ('단호박 크림빵', 4500, 'bakery', '국내산 단호박과 유기농 밀가루로 만든 부드러운 크림빵', 1),
  ('통밀 캄파뉴', 6000, 'bakery', '통밀을 넉넉히 담아 은은한 풍미가 나는 담백한 빵', 2),
  ('이든 소금빵', 4000, 'bakery', '겉은 바삭, 속은 촉촉한 이든의 데일리 소금빵', 3),
  ('제철 과일 스콘', 4800, 'bakery', '그 계절 가장 좋은 과일을 넣어 굽는 스콘', 4),
  ('이든 시그니처 라떼', 4800, 'drink', '단호박과 에스프레소, 이든에서만 만나는 조합', 1),
  ('오늘의 드립커피', 4300, 'drink', '매일 아침 새로 내리는 핸드드립 한 잔', 2),
  ('이든 아메리카노', 3500, 'drink', '에스프레소 원두 본연의 맛을 살린 아메리카노', 3),
  ('아인슈페너', 5000, 'drink', '진한 에스프레소 위에 부드러운 크림을 올린 한 잔', 4),
  ('카페모카', 5000, 'drink', '달콤한 초콜릿과 에스프레소의 조화', 5),
  ('카모마일 티', 4000, 'drink', '유기농 카모마일 잎으로 우린 편안한 차 한 잔', 6)
on conflict (name) do update set
  category = excluded.category, description = excluded.description, sort_order = excluded.sort_order;
