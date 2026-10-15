-- 4/4: 관리자 관리. 20261016_move_to_supabase.sql을 4개로 나눈 것과 같은 내용이에요.
-- 1번 파일을 먼저 실행해야 해요.
-- ── Admins (staff) manage each other from the admin page ─────────────────
drop policy if exists "staff read all staff" on public.staff_users;
create policy "staff read all staff" on public.staff_users for select to authenticated
  using (public.is_staff());

create or replace function public.add_staff(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_staff() then raise exception '관리자만 사용할 수 있어요.'; end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then raise exception '이 이메일로 가입한 계정이 없어요. 먼저 이 이메일로 회원가입해주세요.'; end if;
  insert into public.staff_users(user_id) values (v_id) on conflict do nothing;
end $$;

create or replace function public.remove_staff(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception '관리자만 사용할 수 있어요.'; end if;
  if (select count(*) from public.staff_users) <= 1 then raise exception '마지막 남은 관리자는 해제할 수 없어요.'; end if;
  delete from public.staff_users where user_id = p_user_id;
end $$;
revoke all on function public.add_staff(text) from public, anon;
revoke all on function public.remove_staff(uuid) from public, anon;
grant execute on function public.add_staff(text) to authenticated;
grant execute on function public.remove_staff(uuid) to authenticated;

-- The two Convex admins become admins here too, if they already have an
-- account (email sign-up) on the site. Otherwise sign up, then re-run this.
insert into public.staff_users(user_id)
select id from auth.users where lower(email) in ('1125@bmrschool.org', '200604@bmrschool.org')
on conflict do nothing;
