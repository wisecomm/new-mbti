# new-mbti verification map

This directory is the maintained source for verifying new-mbti's user-facing behavior. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Docker is running, and `cm up` has printed `✓ up: http://localhost:3100`. `cm` is `node .claude/skills/verify/bin/control-mbti.mjs`, run from the repo root.
- `cm doctor` exits 0.
- Two seeded users exist: `verify-user@example.test` (the default identity) and `verify-other@example.test` (`--as other`). Their result history isn't reset between journeys. Each journey sets up the fixtures it needs.
- Never drive an instance that `cm up` did not start.

## Driving conventions

- One journey script per feature, run with `cm run .claude/skills/verify/journeys/<file>.mjs [--anon | --as other]`.
- Prefer ARIA roles, accessible names and visible Korean labels over CSS selectors or DOM position.
- Use `db.insert` and `db.clear` only for fixtures the feature under test doesn't own.

## Proof and skip reporting

- Proof is the evidence directory that `cm run` prints: `transcript.txt` plus screenshot and ARIA pairs.
- Mutation proof includes the stored row, read back through `db.results()` or `cm results`.
- The Google and Apple consent screens are unreachable without real provider credentials. Report OAuth as verified only up to the authorize redirect.
- Report an unreachable path with the attempted command and the unmet precondition. Don't weaken a journey to make it pass.

## Feature entry contract

Each feature file starts with an H1 and one paragraph of user-visible behavior, followed by exactly four H2 sections:
1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with control-mbti`
4. `Gotchas`

## Features

- [Sign-in gate and OAuth start](./auth.md): redirect to login, Google and Apple buttons, the callback error path, sign-out.
- [MBTI questionnaire](./questionnaire.md): 20 questions, required answers, scoring, idempotent submit, the stored row.
- [Result page](./result-view.md): type and axes for your own result, the 404 screen for other users' and malformed ids.
- [Home](./home.md): empty state, latest result, retake link.
