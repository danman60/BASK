# Shotcraft v5 — design spec + storyboard

**Composition:** `BaskPromoV5` · 1920×1080 · 30fps · **1316f = 43.9s**
**Mode:** video-shotcraft *autonomous free creation* (pipeline.md stages 0–7).
**Written:** 2026-08-28. Supersedes nothing — `BaskPromoV3VO` stays renderable.

## 0 — Why a redo and not a recut

`promo/out/promo-v4-vo.mp4` (`BaskPromoV3VO`) was measured, not judged.

Measured myself, both cuts through the same ffmpeg pipeline (frame-to-frame
luma difference at 480px wide), because the inherited figures — 73% motionless,
4 cuts — do not reproduce under any threshold I can define:

| | v4 | v5 (delivered) |
|---|---|---|
| runtime | 83.7s | **43.8s** (brief says 35–45) |
| motionless frames (<0.35 YAVG) | **46%** (1,157 of 2,510) | **24%** (320 of 1,315) |
| median frame-to-frame motion | 0.44 | **1.10** (2.5×) |
| hard cuts (>28 YAVG) | 6 → 0.07/s | 7 → **0.16/s** (2.2× the density) |
| shots | 12 | 14 |
| framing | whole pages at 1.5× → body copy 8–14px | **element cutouts at 3×**, 740px card ≈ 1500px on screen |
| the product it shows | the product as of 2026-08-21 | + `/evidence`, the records drill-down, `/ask` |

Daniel's verdict on the film this replaces: *"It's just overly long. There's no narrative.
I can't tell what's going on."* Length, motion, legibility and a readable act structure are
therefore the acceptance criteria, not extras.

**Excluded on instruction:** the consent-delta UI. It is not in this film.

## 1 — Visual direction (no styleframe: the design system is already binding)

Skipped the styleframe stage with cause — `promo/src/tokens.ts` already lifts the product's own
tokens verbatim from `mockups/tokens.css`, and the film composites real screenshots, so the palette
*is* the product. Motion tokens `E.*` in the same file are the tuned set from the shipped film.

- Preset: **professional-trust (B2B)** — ~21f main duration, `bezier(0,0,0.2,1)`, no overshoot,
  except where something physically lands (`E.land`, y₁ = 1.25).
- Type: Fraunces display / Inter body, caption floor 62px lead + 34px sub (`CAP`).
- Act 1–2 on ivory paper; Act 3 flips to the Compass dark sub-theme, as the product does.

## 2 — Feature → shot-card mapping

Each card is the主角 of exactly one shot. Cards read in full plus their reference implementation
before writing the shot.

| Feature shown | Card · style | Where |
|---|---|---|
| the real dataset | `tension-camera-moves` · **slow-push-in** | S1 |
| what the numbers say | (camera drift, no card — supporting) | S2, S3 |
| the morning brief | `spotlight-hero-card` | S4 |
| the ranked opportunity feed | `list-stack-press` | S5 |
| the priced insight | `odometer-digit-roll` | S7 |
| "Show me why" opening inline | `row-embed` | S8 |
| the records drill-down | `scroll-brake-moves` · **brake-reticle-lock** | S9 |
| `/ask` | `ai-stream-response` | S10 |
| role / theme flip | `theme-switch-moves` · **theme-sweep-toggle** | S11 |
| sign-off | `ui-strip-away-outro` | S14 |

## 3 — Storyboard (frame-level)

| # | shot | from | dur | on screen | camera | caption |
|---|---|---|---|---|---|---|
| 1 | ev-open | 0 | 118 | `ev-stats` — 194,672 visits · 20,179 customers · 53,839 sales · 4 locations | slow-push-in 1.00→1.14, vignette 0→0.5, **hard cut at peak** | "One real salon's till. Three years of it." |
| 2 | ev-kept | 118 | 112 | `ev-block-kept` | lateral drift down the block; −13.5% / −37.7% land | "They kept the customers. They stopped selling to them." |
| 3 | ev-brand | 230 | 84 | `ev-block-brand` | push to the brand line | "63.3% of what they did sell was yours." |
| 4 | daybreak | 314 | 104 | `daybreak-letter` | spotlight locks the card, rise → hover → reseat | "Every morning, in plain English." |
| 5 | feed | 418 | 100 | `opp1…opp6` | cards press up into the stack, counter rolls to 6 | "Six ways to grow, found overnight." |
| 6 | opp-close | 518 | 74 | `opp1` tight | push into "8.3% → 5.9%" | "It shows its working." |
| 7 | report | 592 | 88 | `l4-retail` | digit-roll $5,354/mo | "And it prices the gap." |
| 8 | why | 680 | 92 | `insight-retail` + `drill` | drilldown rows embed into the card | "Show me why opens in place." |
| 9 | records | 772 | 96 | `records-table` → `records-head` | rows blur past, brake-lock on the head line | "84 of 1,441 visits — counted from the rows below." |
| 10 | ask | 868 | 96 | `ask-typed` → `ask-answer` | question lands, answer streams | "Ask it anything it has facts for." |
| 11 | flip | 964 | 62 | `net-title` | theme sweep light → dark | "Same nervous system. Other end." |
| 12 | map | 1026 | 80 | `net-map`, `net-regions` | drift across the map | "Twelve salons, four provinces." |
| 13 | call | 1106 | 94 | `callcard1` | push to the suggested conversation | "Your rep calls knowing what's wrong." |
| 14 | outro | 1200 | 116 | UI strips away → wordmark | button migrates to centre, wordmark lands, **hold 40f** | "Bask · Compass — salon intelligence." |

Rest budget honoured: S4 reseat locks ≥15f, S5 ends on 15f of stillness, S14 holds 40f.

## 4 — Assets

`promo/scripts/capture-v5.mjs` → `promo/public/textures/v5/` + `promo/src/layout-v5.json`.
**45 element cutouts at deviceScaleFactor 3**, captured read-only from `bask-psi.vercel.app`
on 2026-08-28. The one non-idempotent action in the whole run is a single `/ask` question
("How much is the retail slip costing me?"), which is a bounded read that writes no rows.

Numbers on screen are the production demo's own and are internally consistent: `/ask` answers
**$5,354/mo**, which is the figure on the insight report card and in the stored insight. The Today
opportunity card says **$4,260/mo** for a different window — the two never share a frame.

## 5 — Sound

BGM: the project's existing bed, held low, wrapped in a `bgm` inputProp so the no-BGM master
renders from the same timeline. No voiceover — Daniel: *"No tts just script"* — so the captions
carry the read. SFX pinned as relative expressions off `SHOTS_V5[...]`, never bare frame numbers.


## 6 — What the frame reviews caught (three rounds, all fixed)

1. **`records-table` was the wrong content.** Playwright's element screenshot of a
   table inside a scroll container captures whatever is painted in the clipped
   region — it returned sibling insight cards, not visit rows. Fixed by
   unclipping `.b-records-scroll` before the shot.
2. That fix then broke S8: unclipping made `insight-open` 2,007px tall instead of
   956, and the shot derived the card height by subtraction, so every drilldown
   row landed ~1,000px low. Rebuilt from `insight-retail` + `drill`, no derived
   heights.
3. S1's headline figure overlapped the stats strip; S2/S3's pulled-out figures
   collided with the card headlines; S5's pile was cropped at the frame top;
   S7's card was cropped at the bottom; S9's reconciling line rendered at ~13px;
   S10 sat small and left-biased; S11's title arrived too late to read; S14 left
   ~30 frames of near-empty black before the wordmark and clipped two panels at
   the frame edge.

## 7 — Deliverables

- `promo/out/promo-v5.mp4` — 1920×1080, 1316f, 43.9s, with BGM.
- `promo/out/promo-v5-nobgm.mp4` — same timeline, SFX only, via
  `props-nobgm-v5.json` (verified different: audio RMS 1,755 vs 1,480).

The skill's stage-7 independent subagent review was **not** run: this session's
operating rules forbid dispatching agents unless asked. The frame-by-frame pass
above was done first-hand instead, across three renders.
