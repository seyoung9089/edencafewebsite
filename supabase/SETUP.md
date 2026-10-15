# Supabase 연결

프로젝트: `qdkvclpapsasedrvhkvx`

사이트의 모든 데이터(메뉴, 주문, 문의, 글귀·이미지, 관리자)는 Supabase에 있어요.
SQL은 Supabase Dashboard → **SQL Editor**에 파일 내용을 붙여넣고 **Run**으로 실행해요.

## SQL 실행 순서

1. `migrations/20261005_customer_accounts.sql` — 처음 한 번 (이미 실행됨)
2. `migrations/20261016_move_to_supabase.sql` — 메뉴 설명·사진, 글귀, 이미지 저장소, 관리자 관리.
   지금 사이트에 영향이 없어서 **언제 실행해도 안전**해요. 여러 번 실행해도 괜찮아요.
3. `migrations/20261015_daily_pickup.sql` — 매일 픽업 + 수량 차감.
   **새 사이트를 실제로 반영하는 날 함께** 실행해요. 먼저 실행하면 기존 사이트의 화·목 주문이 막혀요.

## 로그인 주소 설정

Authentication → URL Configuration의 Site URL에 실제 사이트 주소를 넣고, Redirect URLs에 아래를 추가합니다.
- `https://edencafewebsite.seyoung8219.workers.dev/orders`
- `https://edencafewebsite.seyoung8219.workers.dev/reset-password`
- 로컬 시험용: `http://localhost:3000/orders`, `http://localhost:3000/reset-password`

## 관리자

관리자 페이지는 `/admin` 하나예요. 관리자는 `staff_users` 표에 있는 계정이에요.

- 2번 SQL을 실행하면 `1125@bmrschool.org`, `200604@bmrschool.org`가 **이미 회원가입되어 있는 경우** 자동으로 관리자가 돼요.
  아직 가입 전이면 사이트에서 이메일로 가입한 뒤 2번 SQL을 다시 실행하세요.
- 그다음부터는 `/admin` → **관리자** 탭에서 이메일로 추가·해제할 수 있어요 (추가할 사람이 먼저 가입해야 해요).
- 관리자가 한 명도 없을 때는 SQL Editor에서 직접 추가해요.

```sql
insert into public.staff_users(user_id)
select id from auth.users where email = '관리자@example.com'
on conflict do nothing;
```

**중요:** 주문 금액은 SQL 함수가 `menu_catalog` 가격으로 계산합니다. `service_role` 키나 DB 비밀번호를 브라우저 코드에 넣지 마세요.
