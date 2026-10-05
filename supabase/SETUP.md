# Supabase 연결

프로젝트: `qdkvclpapsasedrvhkvx`

1. Supabase Dashboard → SQL Editor에서 `migrations/20261005_customer_accounts.sql` 전체를 한 번 실행합니다.
2. Authentication → URL Configuration의 Site URL에 실제 Cloudflare 사이트 주소를 넣고, Redirect URLs에 아래 두 주소를 추가합니다.
   - `https://edencafewebsite.seyoung8219.workers.dev/orders`
   - `https://edencafewebsite.seyoung8219.workers.dev/reset-password`
   - 로컬 시험용: `http://localhost:3000/orders`, `http://localhost:3000/reset-password`
3. 이메일 로그인으로 관리자용 계정을 먼저 가입하고, 확인 메일의 링크를 눌러 인증합니다.
4. SQL Editor에서 아래 SQL의 이메일만 해당 관리자 계정으로 바꿔 실행합니다.

```sql
insert into public.staff_users(user_id)
select id from auth.users where email = '관리자@example.com'
on conflict do nothing;
```

이후 `/customer-management`에서 이메일 고객 주문의 입금 상태, 문의 답변, 주문 메뉴 가격과 품절을 관리할 수 있습니다. 기존 `/admin`은 Google 로그인으로 메뉴 설명·사진과 사이트 콘텐츠를 관리합니다. 새 메뉴는 양쪽 관리 화면에 등록해야 고객 메뉴에 표시되고 주문됩니다.

**중요:** 주문 금액은 SQL 함수가 `menu_catalog` 가격으로 계산합니다. `service_role` 키나 DB 비밀번호를 브라우저 코드에 넣지 마세요.
