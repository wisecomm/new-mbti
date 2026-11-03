# Home

The home screen at `/` shows the signed-in user's latest result with a `다시 테스트하기` link. A user with no results sees `아직 결과가 없어요` and a `테스트 시작하기` link to the questionnaire.

## Sub-features

- `home-empty`: no results shows `아직 결과가 없어요`, and `테스트 시작하기` opens `/test`.
- `home-latest`: with several results, the newest one's type is the heading, next to `다시 테스트하기`.

## How to get to it (user POV)

- Sign in, which returns you to `/` unless `next` says otherwise.
- Choose the `MBTI` logo in the header.

## Driving it with control-mbti

Preconditions:

- `cm doctor` exits 0.

- **Empty, then latest.** Run `cm run .claude/skills/verify/journeys/home.mjs`.
  - Fixtures clear the main user's results. `/` then shows `아직 결과가 없어요`, and `테스트 시작하기` lands on `/test`.
  - Fixtures insert an older `INTP` and a newer `ENFJ` result. `/` then shows the `h1` `ENFJ` and `다시 테스트하기`.
- **Proof.** Use the run's `home-empty` and `home-latest` pairs, plus the transcript.

## Gotchas

- `db.clear()` deletes the main user's history, so run this journey before others if you need their rows afterwards.
- The two fixtures are inserted 50 ms apart so `created_at` orders them. Inserting in one batch can tie.
