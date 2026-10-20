-- Lets staff manually pin up to 2 items into the "인기 메뉴" shelf on /menu,
-- shown alongside the one actual best-selling bakery item (from
-- menu_popularity()). The 2-item cap is enforced client-side in the admin
-- menu panel, not here -- this is a small internal tool, not a public API.

alter table public.menu_catalog add column if not exists is_featured boolean not null default false;
