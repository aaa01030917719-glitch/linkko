# Linkko Email Signup Setup

운영 기준으로 이메일 회원가입과 인증 메일 흐름을 점검할 때 보는 문서입니다.

## 1. 현재 코드 기준

관련 파일:

- `components/auth/SignupForm.tsx`
- `components/auth/LoginForm.tsx`
- `app/auth/confirm/route.ts`
- `lib/supabase/auth-redirect.ts`

현재 동작:

- 회원가입은 `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`를 사용합니다.
- 인증 메일 재발송은 `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo } })`를 사용합니다.
- 인증 링크는 `/auth/confirm`으로 돌아오고, 서버에서 `verifyOtp` 또는 `exchangeCodeForSession`으로 세션을 복원합니다.

## 2. Site URL / Redirect URLs

Supabase Dashboard 경로:

- `Authentication -> URL Configuration`

입력값:

### Site URL

```text
https://linkko.vercel.app
```

### Redirect URLs

```text
https://linkko.vercel.app
https://linkko.vercel.app/**
http://localhost:3000
http://localhost:3000/**
```

주의:

- 운영에서는 `https://linkko.vercel.app`가 대표 URL이어야 합니다.
- Redirect URLs에 운영/로컬 주소가 빠지면 인증 링크가 차단될 수 있습니다.

## 3. emailRedirectTo 기준

코드에서는 `getEmailConfirmationRedirectUrl("/dashboard")`를 사용합니다.

운영에서 실제로 만들어지는 값:

```text
https://linkko.vercel.app/auth/confirm?next=%2Fdashboard
```

위 값은 URL 인코딩된 형태이며, 의미상 아래와 같습니다.

```text
https://linkko.vercel.app/auth/confirm?next=/dashboard
```

즉, 회원가입과 재발송 모두 인증 완료 뒤 `/dashboard`로 돌아가도록 맞춰져 있습니다.

## 4. Confirm signup 이메일 템플릿

Supabase Dashboard 경로:

- `Authentication -> Emails -> Confirm signup`

운영 기준 권장 템플릿 링크:

```html
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">
  이메일 인증하기
</a>
```

이 구성이 필요한 이유:

- `{{ .RedirectTo }}`에는 코드에서 전달한 `/auth/confirm?next=/dashboard` 경로가 들어갑니다.
- `token_hash`와 `type`을 함께 넘기면 `app/auth/confirm/route.ts`에서 `verifyOtp(...)`를 호출할 수 있습니다.
- 서버에서 세션을 만든 뒤 `/dashboard`로 자연스럽게 이동할 수 있습니다.

확인 포인트:

- 템플릿이 여전히 `{{ .ConfirmationURL }}`만 쓰고 있으면 기본 Supabase 링크로 이동합니다.
- 현재 Linkko는 서버 라우트에서 세션을 복원하는 구조라서, 위의 커스텀 링크가 더 안정적입니다.
- 메일 서비스의 click tracking이 링크를 바꾸면 인증 실패가 날 수 있으므로 가능하면 비활성화합니다.

## 5. 인증 완료 라우트

파일:

- `app/auth/confirm/route.ts`

현재 처리 순서:

1. `token_hash`와 `type`이 있으면 `supabase.auth.verifyOtp(...)`
2. 위가 없고 `code`가 있으면 `supabase.auth.exchangeCodeForSession(...)`
3. 성공하면 `/dashboard`
4. 실패하면 `/login?error=email_confirmation_failed`

이렇게 두 가지를 함께 처리하므로, 커스텀 템플릿과 기존 링크 모두 어느 정도 호환됩니다.

## 6. 회원가입 / 재발송 점검 방법

브라우저 콘솔에서 아래 로그를 확인할 수 있도록 되어 있습니다.

- `[auth] signUp`
- `[auth] resendSignupConfirmation`

로그에 포함되는 값:

- `email`
- `emailRedirectTo`
- `hasSession`
- `hasUser`
- `userId`
- `error.message`
- `error.status`
- `error.code`

의미:

- `error: null`이면 Supabase API 호출 자체는 성공입니다.
- `hasSession: true`면 즉시 세션이 발급된 경우입니다.
- 회원가입 후 `hasSession: false`이고 `error: null`이면 인증 메일 대기 상태로 보는 것이 맞습니다.

## 7. 메일이 오지 않을 때 가장 먼저 볼 것

### 코드에서 확인할 것

- 회원가입 후 `[auth] signUp` 로그의 `error`
- 재발송 후 `[auth] resendSignupConfirmation` 로그의 `error`
- 화면에 노출된 원문 에러 메시지

### 사용자에게 안내할 것

- 받은편지함 확인
- 스팸함 확인
- 프로모션함 확인
- 1분 정도 기다린 뒤 재발송

## 8. Supabase SMTP 저장 상태 체크리스트

Supabase Dashboard 경로:

- `Authentication -> Emails`
- UI 버전에 따라 `Authentication -> SMTP Settings`

입력해야 하는 값:

- SMTP host
- SMTP port
- SMTP user
- SMTP password
- Sender email
- Sender name

저장 상태 점검 체크리스트:

- SMTP 값을 입력한 뒤 Supabase Dashboard에서 저장을 눌렀는지 확인
- 저장 후 페이지를 새로 열었을 때 값이 유지되는지 확인
- Email provider와 Email confirmation이 모두 활성화되어 있는지 확인
- Site URL / Redirect URLs가 저장되어 있는지 확인
- Confirm signup 템플릿이 커스텀 링크를 유지하는지 확인

### Resend를 쓰는 경우

- `Sender Email Address`가 Resend에서 검증된 도메인 주소인지 확인
- 예: `no-reply@yourdomain.com`
- Resend에서 도메인 검증이 끝나지 않은 주소면 발송이 실패할 수 있습니다
- Resend API Key가 올바른지 확인
- Supabase SMTP 설정의 비밀번호/API Key 칸에 최신 Resend API Key가 들어갔는지 확인
- Resend 대시보드의 발송 로그에서 회원가입/재발송 시도가 찍히는지 확인
- 로그가 전혀 없다면 Supabase SMTP 설정이 저장되지 않았거나, 인증 메일이 실제로 발송 단계까지 가지 못한 것입니다

### 발송 로그가 있을 때 해석

- `Delivered`: 메일 서버까지는 정상 전달
- `Bounced`: 발신 주소/도메인/수신 서버 정책 문제 가능성
- `Rejected` 또는 `Failed`: API Key, Sender, 도메인 설정을 우선 확인

## 9. 기본 Supabase 메일 발송 제한

Custom SMTP가 없으면 Supabase 기본 메일 서버를 쓰게 됩니다.

운영에서는 이 방식이 부족할 수 있습니다.

- 프로젝트 팀 멤버 주소로만 발송 가능
- 허용되지 않은 주소는 `Email address not authorized` 에러 발생
- 발송량 제한이 매우 낮음
- 운영용 전달 품질을 보장하지 않음

따라서 실제 서비스라면 Custom SMTP를 꼭 연결하는 편이 맞습니다.

## 10. 보안

- `service_role` 키는 프론트엔드에 넣으면 안 됩니다
- 브라우저에는 `anon` 또는 publishable key만 사용합니다
- SMTP 비밀번호 / API Key는 코드에 저장하지 말고 Supabase Dashboard에만 입력합니다

## 11. WebView 앱 기준

`C:\linkko-app`은 웹앱을 WebView로 보여주는 셸입니다.

- 회원가입/인증 메일 흐름은 이 웹 프로젝트 수정사항을 그대로 따릅니다
- 인증 메일 링크는 외부 브라우저에서 열릴 수 있습니다
- 인증 완료 후 앱으로 자동 복귀하는 딥링크는 현재 범위 밖입니다
- 사용자는 인증 완료 뒤 앱으로 돌아와 다시 로그인하면 됩니다
