# MBTI questionnaire

A user (a guest or a signed-in user) answers 20 statements on a five-step scale, from `전혀 아니다` to `매우 그렇다`, and chooses `결과 보기`. The app scores the answers, saves one result, and opens that result's page. A double submit still saves exactly one result.

## Sub-features

- `quiz-render`: `/test` shows the heading `MBTI 테스트`, 20 question groups and the `결과 보기` button.
- `quiz-required`: submitting with unanswered questions stays on `/test` and saves nothing.
- `quiz-score`: answering `매우 그렇다` everywhere yields `ESTJ` with every axis at +20.
- `quiz-idempotent`: two submits of the same form create one row and land on one `/results/<uuid>`.

## How to get to it (user POV)

- Choose `테스트 시작하기` or `다시 테스트하기` on the home screen.
- Choose the `테스트` tab or open `/test` directly.

## Driving it with control-mbti

Preconditions:

- `cm doctor` exits 0.

- **Whole flow.** Run `cm run .claude/skills/verify/journeys/questionnaire.mjs`.
  - The page shows 20 `group`s.
  - An empty submit keeps the URL at `/test`, and the row count is unchanged.
  - All 20 `매우 그렇다` labels end up checked.
  - A double `requestSubmit()` ends at `/results/<uuid>` with an `h1` of `ESTJ`.
  - `db.results()` has exactly one new row whose `id` matches the URL, with `type: ESTJ`, `method: questionnaire`, `method_version: v1` and `ei = sn = tf = jp = 20`.
- **Second view.** Run `cm results`. The newest row is the one the journey reported.
- **Proof.** Use the run's `test-page`, `answered` and `result` pairs, plus the transcript line `exactly one new row … type ESTJ`.

## Gotchas

- The radios are visually hidden. Click the label text, `매우 그렇다`, inside each `group`, not the `input`.
- The submit button disables itself while pending, and React queues a second `requestSubmit()` and drops it once the first redirects. The dev log shows one `submitQuestionnaire` call. The journey therefore proves "the UI yields one result". It does **not** reach the server-side `(user_id, submission_id)` guard, so report that guard as unverified by this map.
- Each visit to `/test` mints a new submission id. Going back and resubmitting after a reload is a new result by design, not a duplicate.
- `ESTJ` with +20 depends on the v1 question bank having three first-pole and two second-pole statements per axis. If questions change, update the expected scores. Don't loosen the assertion.
