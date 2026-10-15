-- Step 1 of 2. Safe to run any time: only adds a column the current site ignores.
-- stock = remaining quantity that can be ordered. NULL means no limit.
alter table public.menu_catalog
  add column if not exists stock integer check (stock is null or stock >= 0);
