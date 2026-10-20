# 2026-10-20 — Proposal feature gates

Purpose line (owner, 2026-10-20 10:46 ET, dictated): "a session focusing on Basque and building it out
developmental feature flag gates according to its proposal". Read as: build Bask out per the BASK x UVALUX
proposal (dancoded.ca/p/bask-uvalux-cmxb8vlay3), every not-yet-approved feature behind a developmental
flag — off in production by default, on in dev/demo.

## Facts this rests on
- Proposal catalog = `ITEMS` in `~/projects/ddd/public/p/bask-uvalux-cmxb8vlay3/index.html` (ids 1.1-1.12,
  2.1-2.10, 3.0-3.4, L.1-L.3, N.1-N.10).
- Nothing is approved: UVALUX never agreed to Phase 1 (vault memory, Daniel 2026-10-06 15:50 ET).
- The live demo is the Vercel project `bask` (last deploy 2026-10-03). It must behave the same after this.

## Design
- `packages/core/src/flags.ts` (existed, unused) becomes the one catalog: each proposal item -> flag key,
  phase, routes, tRPC router prefixes. `APPROVED` list is empty until a phase is signed.
- Mode: `BASK_ENV` = production | demo | dev. Unset = demo, so the live demo deploy is unchanged.
  production: a feature is on only if APPROVED or `BASK_FLAG_<KEY>=1`. demo/dev: on unless `BASK_FLAG_<KEY>=0`.
- One gate: `apps/web/src/proxy.ts` (Next 16 middleware) 404s pages and tRPC calls of off features.
  Nav hides off destinations. Presenter panel lists every flag and its state.

## Steps (acceptance check each)
1. Catalog + resolver + unit test. Check: `vitest` passes; production with no env = every gated feature off.
2. Proxy gate + nav filter. Check: `BASK_ENV=production next dev` -> gated routes 404, nav hides them;
   unset -> everything renders as before.
3. Presenter panel flag list. Check: screenshot.
4. Build not-built proposal items behind their flags, one at a time, each with its own check.

## Deviations
(log here)
