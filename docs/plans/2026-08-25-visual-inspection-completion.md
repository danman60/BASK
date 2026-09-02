# Bask + Compass visual inspection completion plan

## Purpose

This exists so that a stakeholder can open any screen at any width and see nothing broken.

## Authority

- Inspection contract: `docs/INSPECTION-BRIEF.md`
- Production surface: `https://bask-psi.vercel.app`
- Fix implementation: local-model broker only
- Verification: rendered production pixels, not page-level overflow metrics

## Scope

- Bask: `/`, `/customers`, `/insights`, `/insights/peers`, `/insights/activity`, `/monitor`,
  `/marketing`, `/inventory`, `/inventory/order`, `/community`, `/settings/data-sharing`, `/book`
- Compass: `/compass`, `/compass/accounts`, `/compass/coaching`, `/compass/knowledge`,
  `/compass/network`, each with `?role=uvalux_rep`
- Widths: 320, 360, 390, 768, 900, 1024, 1280, 1440

## Execution

1. Capture all 136 route-width cases with QA Agent. Open and visually inspect every image.
   - Acceptance: evidence matrix has one viewed screenshot for every route-width case.
   - Acceptance: every route completion and every defect is reported to Telegram as it occurs.
2. For each confirmed defect, locate the existing owning surface and run `graphify affected` on
   modified symbols before specifying a fix.
   - Acceptance: no duplicate surface; blast radius and direct callers recorded.
3. Submit each implementation artifact through `python3 -m broker.submit` from
   `~/projects/sysadmin`, with exact artifact, contract, exemplar, and compile gate.
   - Acceptance: no implementation source authored by cloud agent; broker artifact exists.
4. Inspect every landed artifact, integrate only when all batch members pass, and run QA Agent
   against the affected route-width cases locally before production verification.
   - Acceptance: compiler/build gates pass; no HIGH/CRITICAL graph impact ignored.
5. Commit and push verified fixes to `master`; verify the deployed production URL.
   - Acceptance: after-screenshots are opened and compared against before-screenshots.
   - Acceptance: every defect is fixed or explicitly listed with reason left.
6. Repeat all 136 production route-width cases.
   - Acceptance: final matrix complete, screenshots viewed, zero unaccounted visual defects.

## Guardrails

- Never run `demo:reset` against shared Supabase.
- Never kill the existing 3417/3418 dev servers.
- Preserve unrelated worktree changes; stage exact files only.
- A table may scroll only inside a deliberately clipped container with a visible affordance.
- A compiler pass proves compilation only. Rendered after-screenshot is the visual verdict.

## Deviations

- None.
