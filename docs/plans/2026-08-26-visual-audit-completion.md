# Visual audit completion + Community social feed

## Purpose

This exists so that Daniel can open any screen at any width and see nothing broken, and so that
Community "looks more like an Instagram feed" instead of full-viewport rows, with owners able to
upload pictures and videos.

## Inheritance

Picked up from the abandoned Codex session (tmux13, killed by usage limit 2026-08-26 00:35).

What it left that is worth keeping:
- `docs/2026-08-25-visual-qa-audit.md` — 18 findings, retrieved from the Gmail draft and now
  committed so it stops living behind a rotating draft id.
- Evidence: 96 Bask route-width cases (454 vertical tiles) + 40 Compass cases, capture complete.

What it left that is worthless, and why:
- 4 broker artifacts, 0 usable. `shell.visual.css` was `.rejected` after 47 turns / 17 errors.
  `CohortTable.visual.tsx` added zero `data-label`s and stripped `className="num"`.
  `SlippingList.visual.tsx` added labels but deleted `b-dtable-who`, `b-dtable-why` and
  `btn btn-quiet`. `health.visual.css` nests `@media (min-width:701px)` inside
  `@media (max-width:700px)` — unreachable — and targets two orphaned components.
  All four are the documented gate-gaming failure: delete classes until the vocab lint passes.
  **Decision: the `.visual.*` files are deleted, not merged. Fixes authored directly.**

## Triage — all 18 findings verified OPEN against live source

None had been fixed. Evidence per item recorded in the session report.

## Order of work

1. **Page-shell foundation** (audit 3, 4, 5, 6, 16, 18) — one gutter that survives every width.
   - Acceptance: no route places content against the viewport edge at 320/360/390/768/900/1024/1280/1440.
2. **Remove the duplicate headers** (1, 2, 12, 17) — `cu-topbar`, `st-topbar` ×2.
   - Acceptance: exactly one Bask wordmark per screen; no second sticky bar climbing the nav.
3. **Community → social feed** (user scope) — narrow centered column, per-post card, photo/video
   upload, Stageable's feed pattern reskinned to Bask tokens.
   - Acceptance: reading column caps well under full viewport; media renders; upload accepts
     image + video and states its limits.
4. **Marketing responsive** (7, 8, 9, 10, 11).
5. **Insights subnav scroll** (13).
6. **Opportunity CTA labels** (14, 15) — note the audit is slightly wrong here: the two controls
   are `sms` and `email` sharing one label, so the fix is copy, not deletion.
7. **Full screenshot pass**, every route × 8 widths, every image opened and looked at.

## Guardrails

- Never run `demo:reset` against shared Supabase.
- Never kill the 3417/3418 dev servers.
- Screenshot and LOOK before claiming any fix. `mobile-clip-check.mjs` is a tripwire, never a verdict.
- Public repo: no client name, creds, or exact financials.

## Deviations

- Logged here as they happen.
