# Linkko Email Signup Setup

## Code paths

- Email signup form: `components/auth/SignupForm.tsx`
- Email login form: `components/auth/LoginForm.tsx`
- OAuth callback route: `app/auth/callback/route.ts`
- Email confirmation route: `app/auth/confirm/route.ts`
- Redirect helpers: `lib/supabase/auth-redirect.ts`

## Supabase dashboard checklist

### 1. Email confirmations

Confirm that email/password auth is enabled and email confirmations are turned on.

- Dashboard path: `Auth Providers` page for hosted projects
- Expected behavior: new email signups should require email verification before login

### 2. URL Configuration

Check the following values in Supabase `URL Configuration`.

- Site URL
  - Production: `https://linkko.vercel.app`
- Redirect URLs
  - `http://localhost:3000/**`
  - `https://linkko.vercel.app`
  - `https://linkko.vercel.app/**`

If you use Vercel preview deployments, also add the preview wildcard recommended by Supabase:

- `https://*-<your-team-or-account>.vercel.app/**`

### 3. Email template

If you customized the signup confirmation email template and you are using `redirectTo` / `emailRedirectTo`, make sure the template uses `{{ .RedirectTo }}` where needed.

Recommended confirmation flow for this project:

- Redirect users to `https://linkko.vercel.app/auth/confirm?next=/dashboard`
- The server route verifies the token and redirects the signed-in user to `/dashboard`

### 4. SMTP

Supabase's built-in email sender is only for testing and has strict limits.

- Without custom SMTP, emails are only delivered to pre-authorized team addresses
- The built-in sender is limited to `2 emails per hour`
- Delivery is best-effort only

For production, configure Custom SMTP in Supabase Auth.

Prepare these values from your mail provider:

- SMTP host
- SMTP port
- SMTP username
- SMTP password
- Sender email / From address
- Sender name

Suggested providers:

- Resend
- AWS SES
- Postmark
- SendGrid
- Brevo

After enabling custom SMTP, also review:

- SPF
- DKIM
- DMARC

## User-facing behavior

### Signup

- After signup, the app tells the user that a confirmation email was sent
- The app reminds the user to check spam/promotions folders
- The user can tap `인증 메일 다시 보내기`

### Login before confirmation

- The app shows a friendly explanation if the email is not confirmed yet
- The app offers `인증 메일 다시 보내기`

### Confirmation link

- Clicking the email link should land on `/auth/confirm`
- The route verifies the token with `supabase.auth.verifyOtp`
- On success, the user is redirected to `/dashboard`
- On failure, the user is redirected to `/login?error=email_confirmation_failed`

## WebView app note

The Android app currently wraps the website in a WebView.

- The signup and login UI comes from the web app
- Email links may open in the user's mail app and browser
- Deep links back into the Android app are not configured yet
- Users can return to the app and log in normally after confirming their email

## Security notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser or mobile app
- Only public client keys such as `NEXT_PUBLIC_SUPABASE_ANON_KEY` belong in frontend code
