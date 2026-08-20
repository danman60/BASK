# Plan — Live health build and Shotcraft video recreation

**Purpose line:** This exists so that the MVP offers "analytics and marketing powered by data and knowledge-based training based on UVALUX knowledge", and so that the new customer-health build is visible on the live product film.

## Scope

1. Extend the existing customer data loader with the already-defined `computeCustomerHealth` engine.
2. Render the prepared health components on `/customers`.
3. Export the prepared shared UI components through `@bask/ui`.
4. Typecheck/build, verify the real local surfaces, push `master`, and verify the stable production URL.
5. Recapture production assets with the existing `promo/` Shotcraft capture script and render the caption and VO masters.

## Acceptance checks

- `/customers` shows health-band counts, a customer grid, and a non-empty slipping list when the live demo data supports it.
- Health is computed by `packages/core/src/health/customer-health.ts`; no second scoring rule is introduced in UI.
- `pnpm --filter @bask/ui typecheck` and `pnpm --filter web typecheck` pass, followed by the production build.
- Production `https://bask-psi.vercel.app` serves the new health surface before capture.
- Shotcraft capture prints the explicit production target and completes into `promo/public/textures/`.
- Caption and VO renders complete into `promo/out/` and are checked as composited outputs.

## Known limits

- Scoreboard wiring remains separate from this customer-health surface.
- The existing flagged VO line remains unless Daniel supplies replacement audio.
- Knowledge migration/embed is not part of the visible health build unless a live route requires it.
