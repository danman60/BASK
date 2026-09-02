# bask-fix-seasonal-pause-month

## What to build

The defect
The sweep decides whether "today" falls in one of the salon's historically quiet months. To do
that it pulls the month out of the context date, which is an ISO calendar date string in the
form `YYYY-MM-DD` — for example `2026-08-28`.

The code takes characters 4 through 6 of that string. On `2026-08-28` those characters are `-0`,
not `08`. The extracted value is never a valid month, so the comparison against the salon's
trough months can never succeed and the sweep can never report a finding.

The month occupies characters 5 through 7 of an ISO date string. Correct the extraction so the
example date `2026-08-28` yields the month `08`.

Rules
- Change only the month extraction. Do not restructure the function, rename anything, alter the
thresholds, or touch any other file.
- Keep the surrounding code, comment style and formatting exactly as they are.
- If a nearby comment describes the old, wrong offsets, update it to match the corrected ones.
- Do not add tests in this file.

Acceptance

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/seasonal-pause.ts`

## Rules

- Write the target file. Do not create other files.
- Do not modify anything outside the target path.
- Import every symbol you use. Do not reference a symbol you have not imported.
- Do not leave TODOs, stubs, or placeholder values.
- Do not fix unrelated bugs you notice. Build only what is described above.

## Acceptance gate — you are DONE only when all of these are true

1. `/home/danman60/projects/uvalux-platform/packages/core/src/insights/sweeps/seasonal-pause.ts` exists and is complete.
2. `pnpm --filter @bask/core typecheck` passes with exit code 0.
3. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
