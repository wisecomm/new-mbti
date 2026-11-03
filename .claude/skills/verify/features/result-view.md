# Result page

`/results/<id>` shows the signed-in user's saved result: the four-letter type as the page heading under `당신의 MBTI는`, plus one bar for each axis (E/I, S/N, T/F, J/P). Results belong to their owner. Another user's result id, or an id that isn't a UUID, shows the 404 page.

## Sub-features

- `result-own`: your result shows its stored type and four axis rows.
- `result-foreign`: another user's id shows the 404 screen and never shows their type.
- `result-malformed`: `/results/not-a-uuid` shows the 404 screen.

## How to get to it (user POV)

- Finish the questionnaire, which redirects here.
- Open a `/results/<id>` link directly while signed in.

## Driving it with control-mbti

Preconditions:

- `cm doctor` exits 0.

- **Own, foreign and malformed ids.** Run `cm run .claude/skills/verify/journeys/result-view.mjs`.
  - Fixtures insert `ISFJ` scores for the main user and `ENTP` scores for `other`.
  - The own id shows the `h1` `ISFJ`, `당신의 MBTI는` and four list items.
  - The other user's id shows the `h1` `404`, the text `This page could not be found.` and a `robots=noindex` meta tag, and their type appears nowhere.
  - `not-a-uuid` shows the same 404 screen.
- **Proof.** Use the run's `own-result` and `other-user-404` pairs, plus the transcript.

## Gotchas

- The HTTP status is **200**, not 404. The result loads inside `<Suspense>`, so `notFound()` runs after streaming has started, and Next.js can only swap in the 404 UI and add `noindex`. Don't assert `response.status()`. Moving the lookup out of Suspense would bring the 404 back, but then a top-level session read is a Cache Components build error.
- The fixtures bypass the questionnaire on purpose. This feature verifies display and ownership, and the questionnaire journey proves the write path.
- The type comes from the database's generated column. If the heading disagrees with `cm results`, that's a real bug, not a flaky test.
