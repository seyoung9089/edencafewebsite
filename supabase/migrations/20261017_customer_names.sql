-- Customer names. Safe to run any time: adds a column the current site ignores.
-- The name lives in the Supabase account (user_metadata.name, set at sign-up or
-- in 내 주문) and is copied into customer_profiles, where admins read it.
alter table public.customer_profiles
  add column if not exists name text not null default '';

create or replace function public.sync_customer_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.customer_profiles(user_id, email, name)
    values (new.id, coalesce(new.email, ''), coalesce(trim(new.raw_user_meta_data->>'name'), ''))
    on conflict (user_id) do update set email = excluded.email, name = excluded.name;
  return new;
end $$;

drop trigger if exists on_auth_user_profile on auth.users;
create trigger on_auth_user_profile after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.sync_customer_profile();

-- Fill in names for accounts that already have one.
update public.customer_profiles p
set name = coalesce(trim(u.raw_user_meta_data->>'name'), '')
from auth.users u
where u.id = p.user_id;
