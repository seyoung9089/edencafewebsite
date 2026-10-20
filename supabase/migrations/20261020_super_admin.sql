-- Super admin: one tier above regular admins.
-- Only a super admin can appoint or remove other admins (add_staff/remove_staff),
-- and only a super admin can promote/demote another admin's super status.
-- Regular admins keep full access to orders/customers/inquiries/menu/content,
-- just not the admin-management actions.

alter table public.staff_users add column if not exists is_super boolean not null default false;

create or replace function public.is_super_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.staff_users where user_id = (select auth.uid()) and is_super)
$$;
revoke all on function public.is_super_staff() from public, anon;
grant execute on function public.is_super_staff() to authenticated;

-- add_staff / remove_staff now require super admin, not just any admin.
create or replace function public.add_staff(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_super_staff() then raise exception '최고 관리자만 관리자를 추가할 수 있어요.'; end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then raise exception '이 이메일로 가입한 계정이 없어요. 먼저 이 이메일로 회원가입해주세요.'; end if;
  insert into public.staff_users(user_id) values (v_id) on conflict do nothing;
end $$;

create or replace function public.remove_staff(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_super_staff() then raise exception '최고 관리자만 관리자를 해제할 수 있어요.'; end if;
  if (select is_super from public.staff_users where user_id = p_user_id) then
    raise exception '최고 관리자는 이 화면에서 해제할 수 없어요.';
  end if;
  if (select count(*) from public.staff_users) <= 1 then raise exception '마지막 남은 관리자는 해제할 수 없어요.'; end if;
  delete from public.staff_users where user_id = p_user_id;
end $$;

-- Promote/demote another admin's super status. A super admin can't demote
-- themselves if they're the last remaining super admin (would lock everyone out).
create or replace function public.set_staff_super(p_user_id uuid, p_is_super boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_super_staff() then raise exception '최고 관리자만 바꿀 수 있어요.'; end if;
  if not p_is_super and p_user_id = (select auth.uid()) and (select count(*) from public.staff_users where is_super) <= 1 then
    raise exception '마지막 남은 최고 관리자는 스스로 해제할 수 없어요.';
  end if;
  update public.staff_users set is_super = p_is_super where user_id = p_user_id;
end $$;

revoke all on function public.add_staff(text) from public, anon;
revoke all on function public.remove_staff(uuid) from public, anon;
revoke all on function public.set_staff_super(uuid, boolean) from public, anon;
grant execute on function public.add_staff(text) to authenticated;
grant execute on function public.remove_staff(uuid) to authenticated;
grant execute on function public.set_staff_super(uuid, boolean) to authenticated;

-- One-time: if nobody is marked super yet, make every current admin super so
-- nobody gets locked out. Re-run safely any time — it only fires when the
-- super-admin seat is completely empty.
update public.staff_users set is_super = true
where is_super = false
  and not exists (select 1 from public.staff_users where is_super);
