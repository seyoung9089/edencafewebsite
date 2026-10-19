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
4. `migrations/20261019_bakery_only_orders.sql` — 음료 온라인 주문 제한. 2·3번 실행 후 적용해요.

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

## 구글·카카오 로그인

구글과 카카오 OAuth 앱을 각각 만들기 전까지 로그인 화면의 버튼은 비활성화돼요. 비밀 키를 사이트 코드나 채팅에 넣지 말고 각 제공사 콘솔과 Supabase Dashboard에만 입력하세요.

1. **구글:** [Google Auth Platform](https://console.cloud.google.com/auth/clients)에서 웹 애플리케이션 OAuth 클라이언트를 만들어요. 승인된 JavaScript 출처에 운영 사이트 주소를 등록하고, 승인된 리디렉션 URI에 `https://qdkvclpapsasedrvhkvx.supabase.co/auth/v1/callback`을 등록해요. 생성된 Client ID와 Client Secret을 Supabase Dashboard → Authentication → Sign In / Providers → Google에 입력하고 활성화해요.
2. **카카오:** [Kakao Developers](https://developers.kakao.com/)에서 앱을 만들고 카카오 로그인을 활성화해요. REST API 키의 리디렉션 URI에 같은 Supabase callback 주소를 등록하고, Client Secret을 생성해요. OpenID Connect를 켜고 `openid` 동의를 설정해요. REST API 키와 Client Secret을 Supabase Dashboard → Authentication → Sign In / Providers → Kakao에 입력하고 활성화해요.
3. Supabase Dashboard → Authentication → URL Configuration에 운영·로컬 `/orders` 리디렉션 주소가 등록되어 있는지 확인해요.
4. 제공사 설정이 끝난 뒤 로컬 `.env.local` 또는 Cloudflare 빌드 환경 변수에 `VITE_GOOGLE_LOGIN_ENABLED=true`, `VITE_KAKAO_LOGIN_ENABLED=true`를 설정하고 다시 배포해요.

## 메뉴 사진과 구글 드라이브

구글 드라이브에는 원본 사진을 정리해 보관할 수 있어요. 사이트 관리자 화면에는 드라이브에서 사진을 내려받아 **사진 올리기**로 업로드하세요. 사이트 화면에 쓰이는 파일은 `site-images` Supabase Storage에 저장됩니다. 드라이브 공유 링크를 이미지 주소로 직접 사용하면 공유 권한과 링크 형식에 따라 사진이 표시되지 않을 수 있어요.
