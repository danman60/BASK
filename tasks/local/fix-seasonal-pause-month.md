# Task: correct the month extraction in the seasonal-pause sweep

## Target file (edit in place, it already exists)
`packages/core/src/insights/sweeps/seasonal-pause.ts`

## The defect
The sweep decides whether "today" falls in one of the salon's historically quiet months. To do
that it pulls the month out of the context date, which is an ISO calendar date string in the
form `YYYY-MM-DD` — for example `2026-08-28`.

The code takes characters 4 through 6 of that string. On `2026-08-28` those characters are `-0`,
not `08`. The extracted value is never a valid month, so the comparison against the salon's
trough months can never succeed and the sweep can never report a finding.

The month occupies characters 5 through 7 of an ISO date string. Correct the extraction so the
example date `2026-08-28` yields the month `08`.

## Rules
- Change only the month extraction. Do not restructure the function, rename anything, alter the
  thresholds, or touch any other file.
- Keep the surrounding code, comment style and formatting exactly as they are.
- If a nearby comment describes the old, wrong offsets, update it to match the corrected ones.
- Do not add tests in this file.

## Acceptance
`pnpm --filter @bask/core typecheck` exits 0, and the extracted month for an ISO date is the
two-digit calendar month.
