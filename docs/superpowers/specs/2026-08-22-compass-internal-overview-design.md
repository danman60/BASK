# Compass Internal — three surfaces, one shell (overview)

**Purpose line, verbatim:** *This exists so that the internal UVALUX side of the app has a
beautiful laid out knowledge place — a giant 3D node graph plus a table plus type-to-complete — so
a human can interact with and curate the knowledge training base, with sub-pages for corpus
training information, for salon data and insights showing what's currently running on what salons,
and deep deep insight into how users are using the app.*

Every deliverable is checked against that line, not against this document.

---

## Why three specs and not one

The brief describes three products with different data sources, different users' jobs, and
different failure modes. One spec covering all three would be too large to execute and would hide
the fact that **one of the three mostly exists already**.

| # | Surface | Route | Data source | Status today | Spec |
|---|---|---|---|---|---|
| 1 | **Knowledge** — curate the training corpus | `/compass/knowledge` | `knowledge_doc`, `knowledge_chunk`, new `knowledge_claim` | **No UI.** Retrieval built (`core/knowledge/retrieve.ts`) but unwired | `…-compass-knowledge-curation-design.md` |
| 2 | **Salon operations** — what is running where | `/compass/network`, `/compass/accounts` | `Org`, `Salon`, `Campaign`, `activity_event` | **Largely exists.** Extend, do not rebuild | `…-compass-salon-operations-design.md` |
| 3 | **Product usage** — how salons actually use Bask | `/compass/usage` | `activity_event`, `app_log`, `session` | No UI; event table exists | `…-compass-product-usage-design.md` |

Build order: **1 → 3 → 2**. Knowledge first because 224 mined claims are sitting on disk unverified
and nothing can consume them until a human passes them. Usage second because it is net-new and
independent. Salon operations last because it is the riskiest to touch — those pages are live demo
surfaces that the pitch script walks through.

## What already exists (anti-duplication gate — checked, not assumed)

Running the gate found a knowledge subsystem that predates this work:

- Migration `20260820000000_knowledge_base` → `bask.knowledge_doc`, `bask.knowledge_chunk`.
- `knowledge_doc` columns: `corpus`, `source`, `title`, `speaker`, `audience`,
  `title_confidence`, `start_sec`, `end_sec`, `words`, `metadata`. **Multi-corpus by design.**
- `packages/core/src/knowledge/chunk.ts` + `retrieve.ts` — pgvector similarity search, returning
  `KnowledgeMatch` and a `Citation` with `confidence: 'confirmed' | 'approximate'`.
- `packages/db/scripts/knowledge/extract-expo.ts` + `embed.ts` — the ingest path.
- `packages/db/fixtures/knowledge/uvalux26-expo.jsonl` — **22 documents** from the 2026 Expo, with
  named speakers (Nik Van Haeren, Mike Blore, Sara McLellan, Sarah).
- `packages/ui/src/components/CoachAnswer.tsx` and `/compass/(app)/coaching`.

**Consequences we are designing around, not ignoring:**

1. The 224 mined advice claims are a **second corpus over the same and adjacent audio**, not a
   replacement. The 2026 Room B material overlaps the existing expo docs; the 2025 Room B, Summer
   2025 and Summer 2024 material is new.
2. **Speaker attribution already exists** for expo material, anchored from photographed agendas
   with a `title_confidence` honesty flag — a better answer than diarization for presentations.
   The curation UI must surface that flag, never launder an `interpolated` attribution into a
   confident one.
3. Retrieval is **built but unwired**. Surface 1 is the first consumer, so it is also the thing
   that proves the retrieval layer works.

`packages/db/scripts/salon-ingest/` is the POS-data ETL. It is **not** part of any of this.

## Shared conventions all three surfaces obey

- Routes live under `apps/web/src/app/compass/(app)/`, which already carries `CompassShell` and
  nav. Adding a destination means adding to `NAV` in `CompassShell.tsx`.
- Styling is `cp-*` classes in `apps/web/src/app/compass/compass.css`, values from `@bask/tokens`
  via `[data-theme='compass']`. **No hardcoded colours** — if a shade looks wrong the token is
  wrong, not the stylesheet.
- Compass is RELAXED density (DESIGN_SPEC §2.3).
- **`packages/core/consent` is the one filter every Compass read goes through.** No query routes
  around it. Surface 3 is the sharpest test of this: usage analytics is exactly where someone will
  be tempted to read per-salon behaviour that consent does not permit.
- Reuse `apps/web/src/components/compass/primitives.tsx` — `StatusChip`, `StatRow`, `BandDot`,
  `ConsentBadge`, `CompassEmpty`, `Whisper`, `EvidenceTileRow`, `SuggestBlock`, `TrendArrow`.
- All user-facing copy comes from the guidance dictionary, grade-7 register.
- No auth until M3. Roles come from the URL / presenter panel (`ROLE_PARAM`).

## The palette rule that constrains the "futuristic" ask

`packages/tokens/src/dusk.css` states it directly:

> *Dusk is Bask at night, **NOT Compass**. Compass amber (h≈78) never appears here; the palettes
> are how you know which product you are in.*

So the dark, luminous, Obsidian-like graph **cannot** be built by switching Compass to Dusk. That
would make Compass look like Bask and destroy the one signal that tells a user which product they
are in.

**Resolution used in Spec 1:** the graph is a dark *inset canvas* — a viewport within the light
Compass shell, the way a map or a telescope sits inside a page. Its canvas colour derives from
Compass's own amber-family palette at low lightness, not from Dusk's terracotta. The chrome around
it stays ordinary light Compass. New tokens are added to the `[data-theme='compass']` block, never
invented inline.

## Definition of done for the set

- Three specs written, self-reviewed, and committed.
- Every leaf component dispatched to the local fleet with an exemplar and a compile gate;
  synthesis, data access and consent wiring stay with the architect.
- `pnpm demo:verify` still passes the PITCH.md path — these surfaces are additive and must not
  disturb the demo.
