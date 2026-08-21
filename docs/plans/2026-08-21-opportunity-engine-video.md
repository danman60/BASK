# 2026-08-21 — Opportunity Engine + Front Desk Monitor + video

**Purpose line, verbatim:** This exists so that *"the video should feature Bask a Salon
intelligence analyzing data finding gaps easing AI and machine learning then delivering the
insights quickly into easy action about one click operations for owners including monitoring
giving competitive advantage"* — and gets recorded ASAP.

Source brief: `docs/meetings/2026-08-21-salon-intelligence-brainstorm.md` (the Opportunity Engine
dump). Decisions made by Daniel 2026-08-21 08:47:
- Transform `/` Today into the Opportunity feed ("N ways to grow your business today").
- Front Desk Monitor is a new surface; steal patterns from the REFLECT app (listener device →
  transcribed interactions → scored moments → coaching insights).
- Supervisor builds the task queue; parallel local build runs it; endpoint is a deployed build +
  a Shotcraft video for review + an ElevenLabs-ready VO script.

## Demo-stub depth (explicit)
Deterministic fixtures, no real ML, no real SMS/email sending. Every surface shootable and
clickable. Qwen/LoRA/uplift material stays in the brainstorm doc — architecture, not this build.

## Phases
1. **Supervisor pre-work (before dispatch, committed atomically):** contract types
   (`packages/core/src/opportunities/types.ts`, `packages/core/src/monitor/types.ts`),
   supervisor-owned stylesheet (`packages/ui/src/components/opportunity.css`), queue CONTRACT,
   manifest, driver.
2. **Local queue** `tasks/opportunity-20260821/` — ~21 CREATE-only leaf tasks:
   15 presentational components, 2 sections, 2 fixture files, VO script v3, shot plan v3.
   Lanes: `big` = qwen3-coder:30b on FIRMAMENT 4090 (verified free, model verified present),
   `small` = gemma4:12b on SPYBALLOON 3060 (5 simplest files only).
3. **Supervisor integration (during/after drain):** `packages/ui/src/index.ts` exports (the 11
   pending + the new set), guidance-dictionary labels, nav destination for Monitor, Today page
   transform, `/monitor` route + server data, action stubs, typecheck, `demo:verify`.
4. **Ship + shoot:** commit → push master (auto-deploy, allowed flow) → verify live →
   update `promo/scripts/capture.mjs` (add `/`, `/customers`, `/insights/peers`, `/monitor`) →
   capture → Shotcraft re-cut per SHOT-PLAN-V3 → render VO-less review cut + DM →
   DM VO-SCRIPT-V3 for ElevenLabs (no key on this machine — Daniel records).

## Acceptance (from the 2026-08-20 handoff block + today's ask)
- Live nav visibly includes the intelligence surfaces; Today IS the opportunity feed.
- Film thesis: data → intelligence → dollar opportunity → one-click action → measured outcome.
- Customer Health + Analytics get full-screen beats; Monitor gets a beat.
- No captions; VO-only final once ElevenLabs audio arrives. Review cut goes out first.
- No invented metrics beyond the declared demo fixtures; consent framing preserved.

## Known constraints honoured
- One owner per `demo:reset`; no reset during the run.
- Supervisor edits during a live run are committed immediately (stray-guard reverts uncommitted).
- All local tasks are CREATE tasks — the modify-task gate hole (GOTCHAS 2026-08-21) is avoided
  by rule.
- `packages/ui/src/index.ts`, guidance dict, nav: supervisor-only (collision files).
