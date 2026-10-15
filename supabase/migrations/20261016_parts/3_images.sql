-- 3/4: 사진 저장소. 20261016_move_to_supabase.sql을 4개로 나눈 것과 같은 내용이에요.
-- 1번 파일을 먼저 실행해야 해요.
-- ── Photos (menu and site images) ────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('site-images', 'site-images', true)
on conflict (id) do nothing;
drop policy if exists "staff image read" on storage.objects;
create policy "staff image read" on storage.objects for select to authenticated
  using (bucket_id = 'site-images' and public.is_staff());
drop policy if exists "staff image upload" on storage.objects;
create policy "staff image upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-images' and public.is_staff());
drop policy if exists "staff image delete" on storage.objects;
create policy "staff image delete" on storage.objects for delete to authenticated
  using (bucket_id = 'site-images' and public.is_staff());
