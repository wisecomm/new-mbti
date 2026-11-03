# Sign-in gate and OAuth start

Every screen except the login page requires a session. A signed-out user who opens any app URL lands on the login page, which remembers where they were going. The Google and Apple buttons send them to Supabase's OAuth authorize page with a callback back to the app. If the callback fails, they see a login error and are never sent to an untrusted address. They can also sign in with an email and password, or create an account on `/signup`. Signing out ends the session.

## Sub-features

- `auth-redirect`: a protected URL redirects to `/login?next=<original path and query>`.
- `auth-oauth-google`, `auth-oauth-apple`: each button redirects to `<supabase>/auth/v1/authorize?provider=<p>&redirect_to=<app>/auth/callback?next=<path>`.
- `auth-callback-error`: a bad or missing code lands on `/login?error=oauth` with the message `로그인에 실패했어요`, whatever `next` says.
- `auth-email-signin`: the email form on `/login` signs in and lands on `next` (default `/`). A wrong password shows `이메일 또는 비밀번호가 올바르지 않아요.` and keeps the typed email.
- `auth-email-signup`: `/signup` creates the user. With a session it lands on `next`. Without one it shows `<email>로 확인 메일을 보냈어요. …`. A duplicate email or a password under 6 characters shows an error and stays on `/signup`.
- `auth-signout`: `로그아웃` clears the session, and protected URLs redirect again.

## How to get to it (user POV)

- Open any app URL while signed out, for example `/`, `/test` or `/results/<id>`.
- Fill `이메일` and `비밀번호` on `/login` and choose `로그인`, or follow `회원가입` to `/signup` (the link carries `next`).
- Choose `Google로 계속하기` or `Apple로 계속하기` on `/login`.
- Return from the provider to `/auth/callback?code=…&next=…`.
- Choose `로그아웃` in the header of any signed-in screen.

## Driving it with control-mbti

Preconditions:

- `cm doctor` exits 0.

- **Redirect, OAuth start, callback error.** Run `cm run .claude/skills/verify/journeys/auth-gate.mjs --anon`.
  - Opening `/results/abc?x=1` ends at `/login?next=%2Fresults%2Fabc%3Fx%3D1` with the heading `MBTI 테스트`.
  - Each provider button produces an authorize request carrying the right `provider`, a `redirect_to` of `http://localhost:3100/auth/callback` and `next=/test`. The transcript records the full URL.
  - `/auth/callback?code=bogus&next=%2F%2Fevil.example` ends at `/login?error=oauth` showing `로그인에 실패했어요`.
- **Email sign-in and sign-up.** Run `cm run .claude/skills/verify/journeys/email-auth.mjs --anon`.
  - Signing up a fresh `verify-signup-<timestamp>@example.test` through `/signup?next=%2Ftest` ends at `/test` with the email in the `banner`.
  - After `로그아웃`, a wrong password on `/login` shows `이메일 또는 비밀번호가 올바르지 않아요.` and the email field keeps its value. The right password ends at `/` with the email in the `banner`.
  - Signing up the same email again shows `이미 가입된 이메일이에요.`. A 5-character password shows `비밀번호는 6자 이상이어야 해요.` and the URL stays `/signup`.
- **Sign-out.** Run `cm run .claude/skills/verify/journeys/sign-out.mjs`.
  - The header (`banner`) shows `verify-user@example.test`.
  - `로그아웃` ends at `/login`.
  - Reopening `/` redirects to `/login`.
- **Proof.** Use the evidence directory that each run prints: `login-page`, `callback-error`, `signed-up`, `wrong-password`, `already-registered`, `short-password`, `signed-in` and `signed-out` screenshot and ARIA pairs, plus the transcript.

## Gotchas

- Local Supabase has Google and Apple disabled, so the authorize page itself answers with an error. The journey asserts the request, not that page. Don't report the provider round trip as verified.
- `next=/` is dropped from the login URL on purpose. `/login?next=%2F` never appears.
- Sign-out runs as the shared main user. It invalidates only the cookie that journey sent, and later journeys sign in fresh.
- Local Supabase has email confirmations off, so sign-up returns a session at once. The check-email branch (no session, confirmation link to `/auth/callback`) is not exercised locally. Report it unverified.
- The email journey creates real users. `cm down` deletes every `verify-*@example.test` user when it leaves a shared Supabase running; when `up` started Supabase, `supabase stop` discards them.
