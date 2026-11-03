---
name: verify
description: Drive the real new-mbti web app (Next.js 16 + local Supabase) in a headless browser as a signed-in user and capture proof. Use to verify any change to login/OAuth, the MBTI questionnaire, the result page, or the home screen, or whenever you need to show that a user-facing behavior actually works.
---

# Verify new-mbti

The user surface is a web UI. You drive it with Playwright through one helper, `control-mbti.mjs`, against a **local Supabase** (Docker) and a dedicated `next dev` on port **3100**. Real Google/Apple sign-in can't be automated, so the harness seeds two confirmed email users and signs them in through `@supabase/ssr`, which produces the same session cookies the app reads after an OAuth login. The OAuth *start* (the redirect to Supabase's authorize URL) is still driven through the real buttons.

All commands run from the repo root:

```bash
node .claude/skills/verify/bin/control-mbti.mjs <command>
```

Below, `cm` means that command.

## Launch

Requires a running Docker daemon (Docker Desktop or OrbStack). No `.env.local` is needed: `up` injects the local Supabase URL and keys into the dev server's environment, overriding any `.env.local` values.

```bash
node .claude/skills/verify/bin/control-mbti.mjs up
```

`up` does the following:
1. Refuses to run if `.verify/run.json` exists (a run is already active) or port 3100 is taken.
2. Starts local Supabase if `supabase status` fails, and records that this run started it. The first start pulls images and can take several minutes. Starting applies `supabase/migrations/`. If Supabase was already running without `mbti_results`, it runs `supabase migration up --local`.
3. Starts `next dev -p 3100` in its own process group, logging to `.verify/next.log`.
4. Ready means `GET /login` returns 200 containing `MBTI 테스트`. That is a rendered page, not just an open port.
5. Seeds `verify-user@example.test` and `verify-other@example.test` with fresh random passwords, kept only in `.verify/run.json`.

Prints `✓ up: http://localhost:3100 …` when usable.

## Doctor

Run this first whenever anything looks off. It is read-only:

```bash
node .claude/skills/verify/bin/control-mbti.mjs doctor
```

It checks:
- the run file exists
- the `next dev` process is alive
- port 3100 is owned by **our** process group
- `/login` renders
- the app's Supabase URL matches `supabase status`
- `mbti_results` exists
- the test user can sign in

Exit code 1 with `✗` lines means don't drive this instance. Fix the problem, or run `down` and then `up`.

## Drive

Each feature in [features/README.md](features/README.md) has a journey script in `journeys/`. Run one with:

```bash
node .claude/skills/verify/bin/control-mbti.mjs run .claude/skills/verify/journeys/questionnaire.mjs
```

The run flags are:
- `--anon` runs with no session (for login and redirect behavior).
- `--as other` runs as the second seeded user.

A journey module's default export receives:
- `page`: a Playwright page with `baseURL` = the app.
- `step(label, fn)`: records ✓/✗ in the transcript, and screenshots on failure.
- `shot(label)`: saves a full-page PNG plus an ARIA snapshot.
- `db.results(alias?)`, `db.insert(alias?, {ei,sn,tf,jp})`, `db.clear(alias?)`: service-key REST helpers. `alias` is `undefined` (the main user) or `"other"`.
- `appUrl`, `email`, `evidence`.

To check something no journey covers, write a new journey file in the same shape. Don't poke the app by hand. Use stable handles, as the existing journeys do:
- **Roles and accessible names:** `getByRole("button", { name: "결과 보기" })`, `getByRole("group")` (one per question fieldset), `getByRole("heading", { level: 1 })` (the MBTI type on result screens), `getByRole("banner")` (the signed-in header).
- **Visible Korean labels:** `매우 그렇다`, `로그아웃`, `Google로 계속하기`, `Apple로 계속하기`, `테스트 시작하기`, `다시 테스트하기`.
- **Route paths:** `/login`, `/auth/callback`, `/`, `/test`, `/results/<uuid>`.

To see stored rows yourself, use the read-only second view:

```bash
node .claude/skills/verify/bin/control-mbti.mjs results
```

Pass `other` to see the second user's rows.

## Evidence

Every `run` writes to `.verify-evidence/<timestamp>-<journey>/`. Git ignores this directory and `down` never deletes it. A run contains:
- `transcript.txt`: the journey, the identity used, and every step with ✓/✗.
- `NN-<label>.png` and `NN-<label>.aria.txt` for each `shot`, plus a `FAILED-…` pair at the failing step.

Proof standards:
- Drive the real user path: buttons, links, form submits. `db.insert`/`db.clear` are only for fixture setup that the feature under test doesn't own. Never use them to fake the behavior being verified.
- Capture the action and the resulting state, not just the final screen. Example: the submit, then the result page, then the stored row.
- Verify side effects in the database (`db.results()` or `cm results`) alongside what's visible. A result page without a matching row isn't proof.
- The only mock-like seam is the seeded email/password session, which stands in for the Google/Apple consent screens. Report OAuth as verified only up to "redirects to Supabase authorize with the right provider and callback". The provider round trip needs real credentials and stays unverified.
- Report the feature ID and entry point with each artifact. A skipped entry point isn't verified through another one.

## Cleanup

```bash
node .claude/skills/verify/bin/control-mbti.mjs down
```

`down` kills only the `next dev` process group it started, using the pid in the run file. It never kills by process name.
- It first deletes every `verify-*@example.test` auth user, which covers the two seeded users and any sign-ups a journey created, and cascades to their results. `supabase stop` keeps the data volume, so without this the journey users would pile up. `up` recreates the seeded users.
- If this run started Supabase, it then runs `supabase stop`. If Supabase was already running, for example your own local dev, it leaves Supabase running.

It then removes `.verify/` and keeps `.verify-evidence/`. Run `down` after every failed attempt too.

## Isolation

- **One verification run per checkout.** The run file, port 3100, and the local Supabase ports (54321–54329, from `supabase/config.toml`) are fixed. A second `up` refuses to start.
- The local Supabase is shared with your own `npx supabase start` work. The harness touches only the two `@example.test` users and their rows.
- Your own `npm run dev` on port 3000 can run alongside. Both servers use this checkout's `.next/`.

## Helpers

- `bin/control-mbti.mjs`: launch, doctor, login (writes a Playwright storageState to `.verify/`), run, results, down.
- `journeys/*.mjs`: one script per feature, listed in the feature map.
