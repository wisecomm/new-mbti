# Tab shell, 기록 and MY

Every app screen sits above a fixed bottom tab bar (`nav` named `탭`) with `홈`, `테스트`, `기록` and `MY`. The active tab is blue. `기록` at `/results` lists the user's results newest first, each linking to `/results/<id>`, or shows an empty state linking to `/test`. `MY` at `/me` tells a guest `게스트로 이용 중이에요` with `로그인` and `회원가입` links, and shows a signed-in user's email with `로그아웃`.

## Sub-features

- `tabs-bar`: the four tabs navigate to `/`, `/test`, `/results` and `/me`. `/results/<id>` keeps `기록` active.
- `tabs-results-list`: `/results` lists results newest first, and the empty state links to `/test`.
- `tabs-me`: guest and signed-in variants of `/me`.

## How to get to it (user POV)

- Choose a tab in the bottom bar from any app screen.
- Choose `내 결과` on the home grid to reach `/results`.

## Driving it with control-mbti

Preconditions:

- `cm doctor` exits 0.

- **Results list, signed in.** Run `cm run .claude/skills/verify/journeys/home.mjs`. After the fixtures, the `기록` tab shows two list items with `ENFJ` first and `INTP` second.
- **Results list, guest.** Run `cm run .claude/skills/verify/journeys/guest-flow.mjs --anon`. After a guest finishes the questionnaire, `기록` shows one item with `ESTJ`, and choosing it returns to the result page.
- **MY.** `auth-gate.mjs --anon` covers the guest variant and `sign-out.mjs` the signed-in one.
- **Proof.** Use the `results-list`, `guest-results-list`, `guest-me` and `signed-in` pairs, plus the transcripts.

## Gotchas

- Guests have no seeded email, so the `db.*` helpers and `cm results` can't read a guest's rows. The guest journey asserts through the `기록` list in the UI instead, and the stored row is not independently confirmed.
- The tab links are named by their labels, so scope lookups to the `탭` navigation to avoid matching other links such as `테스트 시작하기`.
