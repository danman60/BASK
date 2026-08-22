# Spec 1 — `/compass/knowledge`: curate the training corpus

**Purpose line, verbatim:** *This exists so that a human can interact with and curate the knowledge
training base in a beautiful futuristic but aesthetic experience — a giant 3D node graph that
represents verification and lets the user see in an instant what trees are built out and what could
use more building, with alerts, plus a table and type-to-complete.*

Read `2026-08-22-compass-internal-overview-design.md` first — it holds the anti-duplication
findings and the shared conventions.

> **One open interpretation.** Daniel wrote *"represent vigilation"*. This spec reads that as
> **verification state** — whether a human has reviewed and confirmed an item. If it meant
> vigilance in the monitoring sense, §3 (Alerts) becomes the primary organising idea rather than
> the secondary one, and the graph's colour channel changes meaning. Everything else survives.

---

## 1. The job this surface does

Today 224 machine-extracted claims sit in `data/salon-transcripts/advice-corpus.json` and **nothing
can use them**, because nobody has confirmed a machine got them right. This surface is the gate
between "a model said this" and "UVALUX will teach this."

Its user is one internal person doing a long, repetitive judgement task. The design consequence is
that **throughput matters more than beauty on the table view, and comprehension matters more than
throughput on the graph view.** They serve different halves of the same job:

- **Graph** answers *"where should I spend my attention?"* — a coverage map, seen in seconds.
- **Table** answers *"let me clear 40 of these"* — a queue, worked with the keyboard.
- **Command palette** answers *"take me to the thing I'm thinking of"* — type-to-complete.

A design that makes the graph the primary work surface would be pretty and useless; you cannot
verify 224 quotes by clicking floating spheres. The graph is the *map*, the table is the *work*.

## 2. The graph is a coverage map, not decoration

This is the load-bearing idea and the reason the 3D view earns its place. Every visual channel
encodes a real fact:

| Channel | Encodes | Read as |
|---|---|---|
| **Node colour** | verification state | verified / rejected / needs-edit / unreviewed |
| **Node size** | corroboration — how many separate recordings said it | big = many independent sources |
| **Node brightness** | confidence — `title_confidence` + whether a quote passed the verbatim gate | dim = shaky provenance |
| **Cluster density** | topic coverage | sparse region = thin knowledge, "could use more building" |
| **Edge** | shared topic, shared session, or semantic similarity above threshold | the "trees" |
| **Halo/pulse** | has an open alert | needs a human |

"What trees are built out and what could use more building" then becomes literally visible: a
dense, bright, warm cluster is a well-covered topic backed by verified multi-source claims; a
sparse dim cluster is a topic UVALUX has almost nothing on.

**Node types** (the graph is heterogeneous, which is what makes it worth exploring):

- `corpus` — root per corpus (`uvalux26-expo`, `salon-advice-2024-2026`)
- `session` — a `knowledge_doc` (a talk, with speaker + room + time)
- `claim` — one mined advice item, quote-anchored
- `topic` — the six `OPPORTUNITY_CATEGORIES`
- `moment` — the five `MOMENT_KEYS`
- `speaker` — a named person, where attribution exists

Edges: `claim→session` (came from), `claim→topic`, `claim→moment`, `session→speaker`,
`claim↔claim` (semantic near-duplicate above threshold). The `claim↔claim` edges are what produce
visible clusters, and they come from the embeddings that already exist in `knowledge_chunk`.

**Not negotiable:** the graph must degrade. With 224 claims it is delightful; at 5,000 it must not
melt the browser. Level-of-detail rule: above ~1,500 visible nodes, `claim` nodes collapse into
their `topic` node and expand on focus.

## 3. Alerts — what the system asks a human to look at

Alerts are derived, never stored as prose. Each is a rule over the corpus:

| Alert | Rule | Why it matters |
|---|---|---|
| **Thin topic** | a `topic` has < 5 verified claims | a gap in what UVALUX can teach |
| **Single-source claim** | `distinct_events == 1` and marked concrete | one person said it once; do not teach it as doctrine |
| **Unanchored attribution** | `title_confidence = 'interpolated'` | speaker may be wrong — never launder this |
| **Contradiction** | two verified claims, same topic, high similarity, opposing sentiment | two experts disagree; a human must choose |
| **Stale** | verified > 12 months ago against a corpus that has since grown | re-check |
| **Orphan** | a claim whose `session` could not be resolved | provenance is incomplete |

Alerts appear three ways: a count per node in the graph (the halo), a filter chip on the table, and
a digest panel on first load. **An alert is never auto-resolved by the system** — a human clears it
or converts it into a task.

## 4. Data model — new tables

Two new tables in the `bask` schema. `knowledge_doc` and `knowledge_chunk` are **not modified**.

```sql
CREATE TABLE "bask"."knowledge_claim" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "corpus"          TEXT NOT NULL,
  "claim"           TEXT NOT NULL,          -- the lesson, one sentence
  "quote"           TEXT NOT NULL,          -- VERBATIM, gate-checked
  "category"        TEXT NOT NULL,          -- OPPORTUNITY_CATEGORIES
  "moment"          TEXT NOT NULL DEFAULT 'none',  -- MOMENT_KEYS + 'none'
  "shape"           TEXT,                   -- recall lens: war_story|mistake|benchmark|…
  "specificity"     TEXT NOT NULL,          -- concrete | general
  "is_script"       BOOLEAN NOT NULL DEFAULT false,
  "source_stream"   TEXT NOT NULL,          -- e.g. uvalux26_P1060686
  "source_file"     TEXT NOT NULL,          -- the original J:\… path
  "audio_stream_ix" INTEGER NOT NULL DEFAULT 0,
  "t_start"         DOUBLE PRECISION NOT NULL,
  "t_end"           DOUBLE PRECISION NOT NULL,
  "doc_id"          UUID REFERENCES "bask"."knowledge_doc"("id"),  -- nullable: orphan alert
  "times_said"      INTEGER NOT NULL DEFAULT 1,
  "distinct_events" INTEGER NOT NULL DEFAULT 1,
  "extracted_by"    TEXT NOT NULL,          -- model id
  "lens"            TEXT NOT NULL DEFAULT 'advice',
  "review_state"    TEXT NOT NULL DEFAULT 'unreviewed',  -- unreviewed|verified|rejected|needs_edit
  "reviewed_by"     TEXT,
  "reviewed_at"     TIMESTAMPTZ(6),
  "review_note"     TEXT,
  "metadata"        JSONB,
  "created_at"      TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "bask"."knowledge_claim_event" (   -- append-only audit
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "claim_id"   UUID NOT NULL REFERENCES "bask"."knowledge_claim"("id") ON DELETE CASCADE,
  "action"     TEXT NOT NULL,   -- verified|rejected|edited|merged|split|tagged|unreviewed
  "actor"      TEXT NOT NULL,
  "before"     JSONB,
  "after"      JSONB,
  "note"       TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Why an append-only audit table rather than columns on the claim:** curation is a judgement
record. "Who decided this was wrong, when, and what did it say before" is the whole value of a
curated base, and it is exactly what a mutable row destroys. It also makes an undo trivial.

Migrations follow the house rule: `pnpm db:migration:new` → `pnpm db:check` (asserts bask-scoped
DDL) → `pnpm db:deploy`, using `DIRECT_DATABASE_URL`. **Never `prisma migrate dev`.**

## 5. Screens

### 5.1 Layout

Standard Compass shell. Page is a two-pane split, remembered per user:

```
┌──────────────────────────────────────────────┬───────────────────┐
│  VIEW SWITCH: [ Graph ] [ Table ]  filters   │  INSPECTOR        │
│                                              │                   │
│  ┌────────────────────────────────────────┐  │  claim            │
│  │                                        │  │  ─────────────    │
│  │        dark inset canvas               │  │  " verbatim "     │
│  │        (graph) or cp-table             │  │  ▸ play 12:34     │
│  │                                        │  │  session/speaker  │
│  │                                        │  │  confidence flag  │
│  └────────────────────────────────────────┘  │  [✓] [✗] [edit]   │
│  247 claims · 63 verified · 12 alerts        │                   │
└──────────────────────────────────────────────┴───────────────────┘
```

The inspector is always present — verification is a read-the-quote-then-judge loop, and a modal
would add a click to every single decision.

### 5.2 Graph view

- `react-force-graph-3d` (three.js under it). Chosen because it is the standard for this and ships
  force layout, LOD, picking and camera controls; hand-rolling three.js here is weeks of work for
  a worse result. **This adds `three` and `react-force-graph-3d` to `apps/web`.**
- Dark inset canvas per the palette rule in the overview: a deep, low-lightness **Compass-amber**
  ground, never Dusk's terracotta. New tokens `--cp-graph-void`, `--cp-graph-edge`,
  `--cp-graph-glow` added to the `[data-theme='compass']` block.
- Interactions: orbit / zoom / pan; click focuses a node and fills the inspector; double-click
  isolates a subtree; `F` frames selection; `Esc` clears.
- Motion is slow and damped. Idle drift is ~2°/sec, not a spinning logo. **Respect
  `prefers-reduced-motion`** — no idle drift, no fly-to animation, instant camera cuts.
- Loads under 2s for 5,000 nodes. Beyond that, LOD collapse (§2) applies.

### 5.3 Table view

The throughput surface. `cp-table`, RELAXED density, virtualised.

Columns: state · claim · category · moment · sources · confidence · session · timecode.
Sort and multi-filter on every column. **Bulk select with shift-range.**

Keyboard-first, because this is the screen where someone clears 200 items:

| Key | Action |
|---|---|
| `J` / `K` or arrows | next / previous row |
| `V` | verify |
| `X` | reject |
| `E` | edit claim text |
| `Space` | play the source audio at the quote |
| `⌘K` | command palette |
| `⌘Z` | undo last decision (reads the audit table) |

### 5.4 Type-to-complete (`⌘K`)

One palette, fuzzy, over a single flat index: claims, sessions, speakers, topics, moments, and
commands. Typing `mem` offers the Memberships topic, membership-moment claims, and the command
"filter: unreviewed memberships". Selecting navigates *and* frames that node in the graph, so the
palette drives both views. Client-side fuzzy match; 224–5,000 items does not need a search service.

### 5.5 Provenance panel — the trust anchor

For the selected claim, always visible:

- the **verbatim quote**, and the claim beneath it, visually subordinate;
- `source_file` · audio stream index · `t_start–t_end`;
- an inline audio player seeked to `t_start` — **the reviewer must be able to hear it**, because
  reading a machine transcription is not verification;
- session, speaker, and the `title_confidence` badge, worded plainly when interpolated:
  *"Speaker inferred from the agenda, not from the recording."*

This panel is why the whole surface can be trusted. It is not optional and it is not collapsible.

## 6. Ingest — getting the 224 in

A script, not a UI: `packages/db/scripts/knowledge/load-claims.ts`, reading
`data/salon-transcripts/advice-corpus.json` and `manifest.json`.

- Idempotent, keyed on `(corpus, source_stream, t_start, quote)`.
- Resolves `doc_id` by matching `source_stream` + time range against `knowledge_doc`; leaves null
  and lets the orphan alert fire rather than guessing.
- Refuses to insert a claim whose quote is empty — the verbatim gate holds at the DB boundary too.
- Dry-run by default; `--commit` to write.

## 7. API

New tRPC router `packages/api/src/routers/knowledge.ts`:

- `graph({ corpus?, filters? })` → nodes + edges, already shaped for the renderer
- `list({ filters, cursor })` → paginated table rows
- `get({ id })` → claim + provenance + audit history
- `review({ id, action, note? })` → writes claim + audit event
- `bulkReview({ ids, action })`
- `alerts({ corpus? })` → derived, computed server-side
- `search({ q })` → palette index

Every read goes through `packages/core/consent`. **No exceptions, not even for the demo.**

## 8. Error handling and honesty

- Query fails → `CompassEmpty` with the real message. Never a blank canvas.
- Audio unavailable (source on FIRMAMENT, not the web host) → the player shows *"Audio not
  reachable from here"* and still shows file + timecode. It must not look like silence.
- A claim whose quote no longer matches its transcript (transcript re-run) → flagged
  `provenance_drift`, shown, never silently repaired.
- Empty corpus → an empty state that says how to load claims, not a spinner forever.

## 9. Acceptance criteria

1. `/compass/knowledge` renders inside `CompassShell` with a working nav entry.
2. 224 claims load via the ingest script; count on screen equals `SELECT count(*)`.
3. Graph renders all claim nodes, colour-codes verification, sizes by corroboration; a thin topic
   is visually distinguishable from a built-out one **in a screenshot, without a legend**.
4. Table verifies a claim by keyboard alone; state persists; audit row written.
5. `⌘Z` undoes the last decision from the audit table.
6. `⌘K` finds a claim by partial text in under 100ms.
7. Provenance panel plays audio at the right timecode, or explains why it cannot.
8. `prefers-reduced-motion` disables idle drift and camera animation.
9. Every colour comes from a token; `grep` for hex literals in new CSS returns nothing.
10. `pnpm demo:verify` still passes.
11. Screenshot of the composited page, in context, DM'd for the visual coherence gate.

## 10. Testing

QA agent (`~/projects/qa-agent/qa_agent.py`) against a checklist, real browser, real data. No unit
tests, no jsdom, per house rules. The graph gets a screenshot diff at fixed camera and seed —
force layouts are non-deterministic, so the seed is pinned or the test asserts on node counts and
colours rather than pixel positions.

## 11. Out of scope

Editing the underlying transcripts. Re-running extraction from the UI. Auth (M3). Writing back to
`knowledge_chunk` embeddings — a verified claim does not re-embed until a separate job runs.
