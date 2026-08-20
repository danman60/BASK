# Plan — UVALUX knowledge base + signal sweep library

**Date:** 2026-08-19 · **Driver:** the Nick meeting (`docs/meetings/2026-08-19-nick-debrief.md`,
`-analysis.md`, `-mining-pass3.md`) and Daniel's three-phase proposal shape.

**Purpose line, verbatim:** *This exists so that the MVP offers "analytics and marketing powered by
data and knowledge-based training based on UVALUX knowledge", and so that we have "techniques ready
to sweep" the salon data the moment it arrives.*

Two workstreams. They are independent and can land in either order.

---

## Workstream A — Knowledge base from the expo corpus

### What exists (anti-duplication gate, run 2026-08-19)

- **No knowledge-base, embedding, chunking or retrieval code exists in this repo.** Grep for
  `embedding|pgvector|knowledge.base|retriev` across `packages/` and `apps/` returns zero hits.
  `packages/core/src/ai/` holds generation only (`brief`, `call-brief`, `client`, `daybreak`,
  `guardrails`, `model`). This is genuinely net-new here.
- **The pattern is proven next door in StudioSage** and must be adapted, not reinvented:
  pgvector 1536-dim + a `match_knowledge` RPC + `src/lib/chunk.ts` (1200-char target, 150 overlap,
  paragraph→sentence boundaries). ~30 paying studios run on it.
- **pgvector 0.8.0 is already installed** on the shared CC&SS Postgres, in `public`. No extension
  migration needed; `bask` tables reference `public.vector`.

### The source corpus (verified on disk 2026-08-19)

`~/projects/CommandCentered/client-galleries/uvalux26-expo/` — UVALUX 2026 Expo, both rooms,
transcribed with faster-whisper `distil-large-v3`, agendas from client photos as ground truth.

| Room | Audience | Length | Segments | Words |
|---|---|---|---|---|
| A | Employees — product training | 4.2 h | 3,863 | 49,198 |
| B | Owners/managers — professional training | 5.4 h | 5,541 | 53,094 |

**102,292 words total.** Room B contains **Mike Blore twice** ("The Evidence Behind Your Business",
"The Power of Numbers") and Room A contains **"Guess That Lotion with Sarah"** — i.e. two of the
three SMEs Nick named as the moat. Room B also names the metric definitions the analytics layer
should compute (RPS, distinct customers, distinct-customer annual revenue, sessions per unique
customer, EFT levels) and refers to a worksheet Elaine hands out.

Not part of this corpus: `~/expo-audio/calgary-2026-08/` (80,621 words) is Daniel's own dance expo.
Different industry — must never be blended into the UVALUX knowledge base.

### Steps

1. **Extract + normalize** — `packages/db/scripts/knowledge/extract-expo.ts`. Reads the two
   transcript JSONs plus their agendas, slices the day into agenda sessions (reusing the gallery's
   own anchoring: keyword for Room A, clock-proportional for Room B), and emits one normalized
   document per session with metadata: room, audience, session title, speaker, start/end seconds,
   source file. Output: `packages/db/fixtures/knowledge/uvalux26-expo.jsonl`.
   - *Acceptance:* every non-skip agenda row produces a document; total words within 2% of 102,292;
     Mike Blore's two sessions present and non-empty.
2. **Schema** — `bask.knowledge_doc` (source, corpus, title, speaker, audience, metadata jsonb) and
   `bask.knowledge_chunk` (doc ref, ordinal, text, `public.vector(1536)`, token count). Migration
   via the `migrate diff` workaround; `db:check` must pass with zero `public` footprint.
   - *Acceptance:* `pnpm db:check` clean.
3. **Chunk + embed** — port StudioSage's chunker into `packages/core/src/knowledge/chunk.ts`
   **verbatim in behaviour**, with one deliberate change: `MAX_CHUNKS` (40) is a per-document cap
   sized for a forwarded email and would silently truncate a 5-hour transcript. It becomes a
   parameter, defaulted to unlimited for corpus ingest.
   - *Acceptance:* chunk count ≈ words/180; no document truncated silently; a capped run logs it.
4. **Retrieval** — `bask.match_knowledge` RPC mirroring StudioSage's, plus
   `packages/core/src/knowledge/retrieve.ts`.
   - **Carry StudioSage's hardest-won gotcha:** similarity thresholds are intentionally LOW
     (0.30 web / 0.20 SMS) because short KB entries only score ~0.44. "Raise the threshold" is how
     that bot breaks. Start at 0.30 and tune down, never up. Check the sign on any threshold change
     — inverting it once gave the strictest tenants the fuzziest retrieval.
5. **Surface** — coaching answers cite session + speaker + timestamp, so an answer is traceable to
   "Mike Blore said this, at this minute, at the 2026 expo." Provenance is the product here: it is
   what makes it *UVALUX's* knowledge base rather than a generic tanning chatbot.

### Design constraint from the meeting

Nick's line was **"people buy from people — I want to be the expert in it."** The knowledge base is
the engine; Elaine and Nick stay the face. So the surface is *staff- and coach-facing* (arms the
human), not a customer-facing bot. `docs/meetings/2026-08-19-nick-debrief.md` §4.

### Future ingest points (design for these now, build later)

- Historical expos — Daniel has more, same pipeline, `corpus` column separates years.
- **Another ingest point is coming** (Daniel, 2026-08-19). Keep the ingest interface source-agnostic:
  anything that can produce `{title, speaker, text, metadata}` documents.

---

## Workstream B — Signal sweep library

**The ask:** have the sweeps written *before* the data lands, so the first pass over a real salon
export produces findings on day one rather than starting a discovery project.

### What exists

`packages/core/src/insights/detectors.ts` already has **six** detectors: `anomaly_band`,
`failed_payments`, `low_stock`, `overstock`, `retail_attachment_slip`, `soft_capacity`. They share
one `Evidence` zod schema and a `linkedActionType` + `ref`. **New signals extend this engine and
reuse that schema** — the CLAUDE.md rule against a second Evidence shape stands.

None of the six compute the metrics Nick and Mike Blore actually named. That is the gap.

### The rule that governs every new signal

Nick's own words: *"It's not tracking minutes and putting butts in beds. It's what to do with that
data."* A sweep that reports a number is not a signal. **Every signal must carry an action a salon
owner can take on Monday, and the evidence behind it.** That is already the engine's contract.

### Catalogue

Written to `docs/SIGNAL_SWEEPS.md` — grounded in three sources: the metrics Nick listed, the metric
definitions Mike Blore gave on stage in Room B, and what the pass-3 mining found. Each entry
specifies: the question, the input columns, the computation, the threshold, the action, and whether
it works on purchase data alone or needs a salon export.

### Two build requirements that fall out of it

1. **Baseline-first.** Phase 1's whole deliverable is a measured lift. A lift claim needs a frozen
   pre-period, captured at onboarding before anything changes. Nothing in any current plan does
   this. It must exist before the first pilot salon is touched.
2. **Tiering by data source.** Sweeps must declare which tier they need:
   - **Tier 0 — UVALUX purchase data only** (~300 Canadian salons, available today, no consent
     needed, he already owns it). This is where the pilot actually runs.
   - **Tier 1 — salon monthly export** (the upload surface, which does not exist yet).
   - **Tier 2 — live hosted operational data** (~10 Canadian salons on Sunlync; rights unresolved).
   Getting this backwards is the single biggest scoping risk — see mining-pass3 §6.

---

## Order of work

1. Workstream A step 1 (extract + normalize) — no schema, no migration, immediately verifiable.
2. Workstream B catalogue — pure writing, unblocks the "what do we sweep" question now.
3. Workstream A steps 2–4 — schema, embed, retrieve.
4. Baseline capture (B requirement 1) before any pilot.

## Open, needs Daniel

- The three cash figures for the proposal phases.
- Whether the coaching surface is staff-facing only in phase 1 (recommended, per Nick's "people buy
  from people") or also owner-facing self-serve.
