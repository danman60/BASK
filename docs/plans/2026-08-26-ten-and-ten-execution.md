# Execution plan — TEN AND TEN, all 20 items

**Source list:** `docs/ten-and-ten-2026-08-26.md`
**Instruction:** "run all" — 2026-08-26 15:25 EDT
**Baseline:** HEAD `92c1d2d`, clean tree except two unrelated dirty files
(`INBOX.md`, `promo/src/shots/S0Brand.tsx`) which are PRESERVED, never staged.
**Purpose line:** *This exists so that the stakeholder demo this week survives Nick driving it himself.*
Every deliverable is checked against THAT, not against this plan.

## Fences (from CLAUDE.md + handoff)

- Dev servers on **3417** and **3418** belong to other windows. **Never kill them.** Screenshot against 3417.
- Shared Supabase, `bask` schema, 574 other tables. **Never `demo:reset`.** Never touch `public`.
- **No DDL in this batch.** All 20 items are code + row inserts into existing `bask` tables. If any
  item turns out to need a migration, it STOPS and gets reported, not improvised.
- Every `/compass` route needs `?role=uvalux_rep`.
- `apps/web/AGENTS.md`: this Next version has breaking changes — read `node_modules/next/dist/docs/`
  before writing app-router code.
- Gate is `npx tsc --noEmit` per package + a real screenshot. **The gate proves compilation, never
  correctness** — read the artifact, look at the image.

## Two decisions I am making on Daniel's behalf (stated, not buried)

1. **#11 — restore Floor and Inventory to nav rather than delete the routes.** The list offered both.
   They are Beats 2 and 3 of the pitch; deleting them deletes the demo. Reversible in one line.
2. **#5 — fix the structural bug, do NOT re-pick the band cut-offs.** A never-visited member accruing
   zero staleness is a bug. `BANDS.healthy = 65` vs a real-world max of 56 is a *business* calibration
   and stays Daniel's call. I fix the drain, then report the new distribution and stop.

Also forced by "run all": **#18's delete verdicts for `SmsPreviewCard`, `EmailPreviewCard` and
`NetworkOutcomeCard` are CANCELLED** — items #1 and #7 wire those same components. Deleting and wiring
the same file is incoherent; wiring wins. #18 reduces to: delete `CustomerHealthSection` +
`ScoreboardSection`, wire `CoachAnswer`, allowlist whatever #1 does not consume.

## Collision map → wave structure

Ten lanes, grouped so no two concurrent agents write the same file.

| lane | items | owns these files |
|---|---|---|
| A Today/opportunity | 1, 7, 8, 18 | `today/OpportunityFeed.tsx`, `packages/ui/index.ts`, orphan cards, `sources/experts.ts` wiring |
| B Presenter | 9, 13, 14 | `PresenterPanel.tsx`, `routers/demo.ts`, `lib/demo-scope.ts`, service worker |
| C Scope/consent | 6, 15 | `routers/compass.ts`, `server/salon.ts`, `lib/salon-scope.ts`, `api/context.ts` |
| D Routing/nav | 11, 12 | `shell/nav.ts`, `insights/page.tsx`, `lib/today-data.ts` |
| E Shell/CSS | 17, 19 | `compass.css`, `lane4.css`, `customers.css`, `studio.css`, new `PageContainer` |
| F Formatters | 16 | `insights/detectors.ts`, `routers/marketing.ts`, `SchedulePanel.tsx`, `ai/daybreak.ts` |
| G Health | 5 | `health/customer-health.ts` |
| H Data/DB | 2, 4, 10 | seed scripts, `bask.signal_snapshot` / `bask.insight` / `bask.waiver_signature` |
| I Hygiene | 20 | `packages/core/package.json`, root `package.json`, `core/src/index.ts` |
| J Slider | 3 | `insights/peers/page.tsx` |

**Wave 1** (independent, no shared files): D, E, F, G, I, J
**Wave 2** (after wave 1 lands + tsc green): A, B, C
**Wave 3** (needs C's consent rows to exist first): H

`server/salon.ts:58` is touched by both C(#6) and C(#15) — same lane on purpose.

## Per-item acceptance gate

| # | done means |
|---|---|
| 1 | Pressing an sms / email / staff_task / front_desk_script / staff_challenge action opens that action's card in the sheet. Screenshot of each. `uvalux_order` + `coaching_request` keep the toast (no card exists) — stated on screen, not faked. |
| 2 | `signal_snapshot` rows exist for all 12 Compass accounts incl. Sunset Ridge. Beat 6 opens the salon that HAS data, not its 0-row twin. Verified by query. |
| 3 | `<input type="range">` on the Peers page; dragging recomputes the $/month figure client-side from `coefficient.perPoint`. Screenshot mid-drag. |
| 4 | `bask.insight` holds rows for the 4 SalonTouch salons, written by the production `runInsightSweep`. Count by query, before and after. |
| 5 | No zero-visit customer scores in the healthy band. New distribution reported. Cut-offs UNCHANGED. |
| 6 | All five `?? 'benchmarks'` sites default to the closed tier. Every salon has a `consent_profile` row. Compass still renders (it must not go blank). |
| 7 | `NetworkOutcomeCard` renders on an opportunity with ≥5 salons of evidence; hidden below the confidence floor. Screenshot. |
| 8 | An opportunity card names its method source; the expert's real name appears nowhere in the DOM. Grep the rendered HTML to prove it. |
| 9 | Service worker + manifest registered; presenter fires a push; the notification appears. Screenshot of the notification itself, not the code. |
| 10 | ≥1 row in `bask.waiver_signature` on Sarah's record; the stored-waivers panel renders it. |
| 11 | Floor and Inventory reachable by click from the nav at every width. |
| 12 | From `/insights`, an insight action lands on the pre-filled Studio builder — not the hub. Screenshot of the filled state. |
| 13 | Same bookmark twice = same state, or the reset stops claiming it does. No silent clock rewind. |
| 14 | No "STUB" text, no greyed "Fire push (M2)" (#9 wires it for real). One system writes `data-theme`. |
| 15 | One resolver. `?salon=` deep link shows the SAME salon on Today and `/insights`. |
| 16 | One exported formatter. Insight card and campaign copy agree on "2pm". |
| 17 | `.cp-main` reads `var(--page-gutter)`. Compass matches Bask at 320/768/1180. |
| 18 | `orphan-check.sh` exits 0. Every survivor is either rendered or allowlisted WITH a reason. |
| 19 | One `PageContainer`; the three duplicate rules are gone; no visual diff at 3 widths. |
| 20 | `@anthropic-ai/sdk` gone, root `openai` dedup'd, the stale comment deleted. Build still green. |

## Final gate before reporting done

1. `npx tsc --noEmit` green in `packages/core`, `packages/api`, `packages/ui`, `apps/web`.
2. `bash scripts/qa/orphan-check.sh` exits 0.
3. `node scripts/qa/mobile-clip-check.mjs` — tripwire only, never the verdict.
4. **Walk the PITCH.md path in a browser and LOOK at every screenshot.** This is the gate that caught
   what metrics missed on 2026-08-25 and 2026-08-26 both.
5. Report per-item: done / partial / blocked. Never report a skipped item as done.

## Log of deviations

Appended as they happen — not silently absorbed.
