# Promo v6 + campaign images — plan

**Purpose line, verbatim:** This exists so that *"drafts the campaign should feature IMAGES as
well… the big crazy sound effect at the end is back and we need it gone… the Uvalux logo is missing
at the end… all of the inner shots seem like they're just scrolling a site and not the great
animated shot craft style… more images more charts better visuals off the beginning and make use of
all of the shot craft detail."*

Written 2026-08-31 00:0x, for the Thursday 2026-09-03 meeting. VO script already delivered:
`docs/pitch/2026-08-31-v6-vo-elevenlabs.txt`.

---

## A. The four film defects — each verified in code, not inferred

| # | Defect | Where it actually lives | Fix |
|---|---|---|---|
| A1 | The big impact at the end | `promo/src/shots/v5/sfx.ts:52` — `impact-deep-whoosh.mp3` at **volume 0.55**, the loudest cue in the film (next loudest 0.34), with `riser-cine.mp3` stacked under it at `:51` | Delete both rows. Sign-off lands on the wordmark and the last VO line. |
| A2 | No UVALUX logo | `public/brand/uvalux-logo.png` + `uvalux-logo-4x.png` exist and are referenced by **nothing** in the v5 film (grepped `MainV5.tsx`, `shots/v5/*`) | Logo lockup in the outro, fading in under the wordmark. |
| A3 | Shots read as scrolling a website | `shots/v5/AppScroll.tsx` stacks page strips and runs a camera down them. That WAS the v5 answer to "just show the app" — it has now overshot into looking like a screen recording | Compose the inner shots: push-in, parallax, held figures, beat-synced cuts. |
| A4 | Not enough images/charts, weak open | **48 element cutouts already exist** at `promo/public/textures/v5/` (`opp1-6`, `l4-heatmap`, `l4-retail`, `records-table`, `net-map`, `win1-2`, `drill`, `ev-stats`…) and the cut uses almost none of them | New chart beat inside the first 20s; figures framed throughout. |

**A3/A4 are the real work.** A1 and A2 are minutes.

## B. Campaign drafts must feature an image

Today `content.graphic` is `{ headline, badge }` — two strings, rendered as a text card at
`apps/web/src/app/(bask)/marketing/StudioBuilder.tsx:805-806`. There is no image anywhere in a
generated draft, which is why the Studio beat looks thin next to the copy.

**Approach — composed, not generated.** A rendered square built from the salon's own brand tokens,
the offer badge and the headline, over a chosen background image. NOT a diffusion model: a salon
sending an AI-hallucinated tanning photo to its customers is a liability, and it would be slower and
non-deterministic in a live demo. Precedent is every scheduler product (Later, Planoly, Buffer):
templated brand graphics, not generated art.

Pieces:
1. A `CampaignGraphic` presentational component — square, brand tokens, headline + badge, one
   background slot. Deterministic; identical props → identical pixels.
2. A small library of backgrounds shipped with the app, chosen by campaign `goal`/`audienceKey`.
3. `campaignContentSchema.graphic` gains `backgroundKey` (defaulted, so every existing row parses).
4. Studio Review renders it beside the copy; the Instagram/Facebook pieces show it inline.

---

## C. What goes to the local fleet tonight, and what does not

Routing is by SHAPE (`~/projects/CLAUDE.md` architect/editor split), not by wishing:

**Dispatched (leaf-shaped, one file, compile gate, exemplar to copy):**
- `CampaignGraphic` component — presentational leaf, pure props. Exemplar: existing Studio pieces.
- `V6Chart` / figure-plate motion components for the film — presentational Remotion leaves against
  `Plate.tsx` as the exemplar, with the interpolation ranges dictated in the spec.

**Mine, not dispatched:**
- The **timeline** (`timelineV6.ts`) and the shot map — this is the composition decision, and a shot
  declared but never placed dies mid-render (the guard at `timelineV5.ts:54` exists because of that).
- SFX table edits — one deletion, and it is the thing he complained about; not worth a round trip.
- The outro logo lockup — visually load-bearing, and it is the last frame of the film.
- Wiring `backgroundKey` through the zod schema and the generation path — schema + data access.
- **The render itself.** It runs after the code lands and gets reviewed, not blind overnight; a
  60-second Remotion render of unreviewed shots produces a file nobody wants to watch.

**Explicitly NOT overnight:** any re-render that would overwrite the delivered v5 masters.
`promo/out/promo-v5*.mp4` stay exactly as they are — v6 renders to new filenames.

## D. Order

1. A1 + A2 (SFX out, logo in) — minutes, and they are the two he named first.
2. Broker builds the leaf components overnight.
3. I compose `timelineV6.ts` + reframe the inner shots against the new plates.
4. Campaign graphic wired through schema → generation → Review.
5. Render v6, screenshot the sign-off frame, DM.

## E. Deviations

*(logged here as they happen)*
