-- 2/4: 글귀 표 만들기 + 글귀 복사. 20261016_move_to_supabase.sql을 4개로 나눈 것과 같은 내용이에요.
-- 1번 파일을 먼저 실행해야 해요.
-- ── Site text and image links (was Convex siteContent) ───────────────────
create table if not exists public.site_content (
  key text primary key,
  value text not null
);
alter table public.site_content enable row level security;
drop policy if exists "content read" on public.site_content;
create policy "content read" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "staff content write" on public.site_content;
create policy "staff content write" on public.site_content for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

insert into public.site_content (key, value) values
  ('cta.title', '이든에서 오늘의 첫 잔을 시작하세요'),
  ('footer.blurb', '학생들의 작은 시작이 협동조합으로 자란 카페. 정직한 재료와 편안한 쉼을 나눕니다.'),
  ('hero.eyebrow', '별무리고등학교에서 시작된 카페 협동조합 · Since 2021'),
  ('hero.l1', 'Eden Cafe'),
  ('hero.l2', 'Honest & Comfortable'),
  ('hero.l3', 'Started in 2021'),
  ('hero.l4', 'as a School Project'),
  ('hero.l5', 'Baked Fresh Every Morning'),
  ('hero.l6', 'Brewed with Honest Hearts'),
  ('hero.l7', 'A Small Rest, Like Eden'),
  ('hero.l8', 'Chungnam, Geumsan'),
  ('history.h1', '별무리고등학교 카페 창업 프로젝트로 시작'),
  ('history.h2', '금산군 신활력사업 선정, 예산 지원을 받아 기반을 다짐'),
  ('history.h3', '졸업생과 교사가 함께하는 카페 협동조합으로 구성'),
  ('history.h4', '별드림관으로 이전·확장하며 학생들의 카페 이용이 늘어남'),
  ('history.h5', '베이커리실을 새롭게 이전'),
  ('history.subtitle', '작은 교실 프로젝트에서 시작해, 지금의 이든이 되기까지.'),
  ('history.title', '이든의 시간'),
  ('location.addr', '충청남도 금산군 ○○○ 이든카페 (별드림관 1층)'),
  ('location.phone', '담당 연락처 · 010-XXXX-XXXX'),
  ('location.quote', '"궁금하신 점이 있으면 편하게 문의해주세요!"'),
  ('menuHome.subtitle', '베이커리실에서 직접 굽는 빵과, 이든만의 방식으로 내리는 음료입니다.'),
  ('menuHome.title', '오늘의 메뉴'),
  ('news.n1.date', '2026.09.10'),
  ('news.n1.tag', '공지'),
  ('news.n1.title', '추석 연휴 픽업 운영 안내'),
  ('news.n2.date', '2026.09.02'),
  ('news.n2.tag', '소식'),
  ('news.n2.title', '가을 신메뉴 출시 안내'),
  ('news.n3.date', '2026.08.20'),
  ('news.n3.tag', '소식'),
  ('news.n3.title', '베이커리실 이전 완료 안내'),
  ('news.n4.date', '2026.06.15'),
  ('news.n4.tag', '소식'),
  ('news.n4.title', '여름 시즌 메뉴 안내'),
  ('news.n5.date', '2026.05.02'),
  ('news.n5.tag', '공지'),
  ('news.n5.title', '정기 휴무일 변경 안내'),
  ('news.n6.date', '2026.03.20'),
  ('news.n6.tag', '소식'),
  ('news.n6.title', '이든 협동조합 정기총회 안내'),
  ('phil.label1', '이든이라는 이름'),
  ('phil.label2', '우리가 만드는 방식'),
  ('phil.text1', '에덴, 순수했던 처음의 자리. 별무리고등학교 학생들의 작은 창업 프로젝트에서 시작해, 지금은 졸업생과 교사가 함께 꾸려가는 협동조합 카페가 되었습니다.'),
  ('phil.text2', '빠르게 팔기보다 오래 남을 한 잔을 생각합니다. 이익보다 재료와 진심을 먼저 두고, 매일 아침 우리 손으로 직접 굽고 내립니다.'),
  ('value.comm.desc', '고객과의 지속적인 소통으로 함께 자라는 카페입니다.'),
  ('value.comm.title', '소통'),
  ('value.eco.desc', '건강하고 친환경적인 식재료와 물품을 사용합니다.'),
  ('value.eco.title', '친환경'),
  ('value.price.desc', '이익보다 가치를 우선한, 정직한 가격의 음료를 제공합니다.'),
  ('value.price.title', '가성비'),
  ('value.rest.desc', '에덴의 안식을 닮은, 순수하게 편안한 자리를 지향합니다.'),
  ('value.rest.title', '편안함'),
  ('values.subtitle', '거창한 약속 대신, 매일 지킬 수 있는 작은 기준을 세웠습니다.'),
  ('values.tagline', '건강한 재료 + 정직한 마음 = 이든의 커피'),
  ('values.title', '이든이 지키는 네 가지')
on conflict (key) do nothing;
