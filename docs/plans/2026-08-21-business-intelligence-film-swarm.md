# Business Intelligence Product + Film Swarm Plan

Purpose line: This exists so that the product and film clearly show “Customer Health + Analytics as a business-intelligence and sales-driving layer over salon data and UVALUX knowledge,” not a collection of salon-management screens.

Project: `/home/danman60/projects/uvalux-platform`

Read first:

- `/home/danman60/projects/uvalux-platform/CURRENT_WORK.md`
- `/home/danman60/projects/uvalux-platform/promo/VO-SCRIPT-V2.md`
- `/home/danman60/projects/uvalux-platform/promo/src/timeline.ts`
- `/home/danman60/projects/uvalux-platform/promo/src/shots/S9Wall.tsx`
- `/home/danman60/projects/uvalux-platform/apps/web/src/app/(bask)/layout.tsx`
- `/home/danman60/projects/uvalux-platform/apps/web/src/app/(bask)/customers/CustomersSurface.tsx`
- `/home/danman60/projects/uvalux-platform/apps/web/src/app/(bask)/insights/peers/page.tsx`

Do not:

- Rebuild salon-management, POS, booking, or floor features.
- Invent tenure, payback, pricing, customer, or sales fields.
- Render captions.
- Claim a surface is complete without a composited production screenshot.
- Test against a production write endpoint.
- Revert or cherry-pick commits.

## Parallel task A — visible product navigation and surfaces

Owner: local code worker.

Make Customer Health and Analytics first-class visible product surfaces. Inspect the existing nav and route structure first. Preserve existing route compatibility if possible; do not create a parallel navigation system. The user-facing labels must make the distinction clear, not hide both under generic Customers/Insights labels.

Acceptance:

- Live nav visibly contains Customer Health and Analytics.
- Customer Health opens the health band totals, grid, and slipping/lapsed action list.
- Analytics opens the anonymous peer scoreboard, dollar gaps, and action targets.
- Existing consent boundary remains intact.
- Typecheck and production build pass.
- Production screenshots capture the real composited pages.

## Parallel task B — product thesis, story, and VO handoff

Owner: local content/video worker.

Rewrite the Shotcraft story plan and VO script around this chain:

`existing salon data + UVALUX knowledge/training + consent → business intelligence → interpretation → dollar opportunity → action → sales outcome`

The story must connect Customer Health, Analytics/Peers, UVALUX knowledge/coaching, campaigns, staff challenges, draft orders, Compass, consent, and equipment/payback evidence where the current product actually supports it. It must state that this is a business-intelligence and sales-driving layer, not salon-management software.

Acceptance:

- Customer Health and Analytics each receive a readable full-screen beat.
- Signal → interpretation → dollar opportunity → action is explicit.
- Existing UVALUX actions read as consequences of intelligence, not unrelated features.
- No invented data fields or unsupported business claims.
- Deliver revised script/shot plan only; no audio generation until approved ElevenLabs output exists.

## Parallel task C — Shotcraft capture and visual verification

Owner: local Shotcraft worker.

After task A’s live UI is available, capture production Customer Health and Analytics pages with the navigation visible. Capture readable full-screen textures and cutouts for the film. Inspect composited output at the actual film scale. DM screenshots at each visual iteration boundary.

Acceptance:

- Production target passed explicitly to capture tooling.
- Customer Health and Analytics nav + page content captured.
- No captions.
- No stale or wrong-route assets in the texture set.
- Layout metadata updated from live DOM geometry.
- Screenshots DM’d with route and commit context.

## Dependent task D — final integration and render

Depends on A, B, and C.

Integrate the approved story, captured assets, and visible nav into the Remotion timeline. Render `BaskPromoVO` only. Verify the output file itself with `ffprobe`, inspect representative frames, and DM the final video. Do not render `BaskPromo` or any caption composition.

Acceptance:

- Final film presents the whole product as a business-intelligence and sales-driving layer.
- Customer Health and Analytics are unmistakable.
- VO-only output has no captions.
- Production UI and local film assets agree.
- Final output path, byte size, duration, and commit are recorded in `CURRENT_WORK.md`.

## Handoff protocol

Each worker updates the task result in its own output and records changed files, verification commands, blockers, and commit hash. Final worker reviews all three outputs before rendering. Commit forward only; push `master` after verification.
