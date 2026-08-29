# Wire the coaching RAG so it can be clicked through — plan

**Purpose line, verbatim:** This exists so that Daniel can *"click through that in a real demo next
thurs"* — the retrieval half of *"the rag brain of the best coaches for that sector"*, finished.

Demo: **Thursday 2026-09-03**. Written 2026-08-29.

---

## 0. The design decision — RETRIEVE OVER THE 1,007 CLAIMS, not the transcript chunks

Both paths were live options. The decision and its evidence:

| | transcript chunks (`knowledge_chunk`) | distilled claims (`knowledge_claim`) |
|---|---|---|
| rows today | **0** (needs a 22-doc / 91,046-word ingest) | **1,007**, already loaded |
| retrieval unit | ~400-word slab of spoken transcript | one directive sentence + its verbatim quote |
| citation reads as | `2026 Expo · from 3h37m` + a wall of speech | *"Use grandfathered pricing for long-term loyal clients…"* + the quote it came from |
| metadata to bind on | corpus only | `category`, `moment`, `lens`, `specificity`, `is_script`, `times_said` |
| review queue | means nothing — chunks are not reviewed | **`review_state` finally gates something** |
| plumbing needed | none (`match_knowledge` exists) | one column + one function |

**Decided: claims.** Three reasons, in order of weight.

1. **The citation is the deliverable.** The requirement is that Daniel *clicks through it*. A claim
   is already a legible sentence with a verbatim quote under it; a chunk is 400 words of raw
   transcript that a viewer has to read to find the point. The thing we are showing off is the
   coaching, and the claim IS the coaching.
2. **It makes the review queue real.** `/compass/knowledge` shows a Verify/Reject queue over these
   same rows. Retrieving over claims means a rejected claim can be excluded from what reaches a
   salon — the queue stops being a display and becomes a gate. (We do **not** claim in the demo
   that review currently gates anything: 3 of 1,007 are decided. Filtering excludes `rejected`
   only; that is honest and true.)
3. **Same source material, no worse provenance.** Verified 2026-08-29 on prod: every claim corpus
   (`salon-advice`, `salon-advice-v2`, `salon-marketing`, `salon-recall`) traces to
   `J:\Uva25\Uvalux46RoomB_All_Presentations.mov` and siblings — UVALUX's own Room B recordings,
   the same body of material as `uvalux26-expo.jsonl`. Claims are that material distilled, with
   `t_start`/`t_end` back into the recording.

**Cost of the choice:** one migration (column + match function) and one embed script. ~1,007 rows ×
~70 tokens ≈ 70k tokens on `text-embedding-3-small` ≈ **$0.0014**.

**What we are NOT doing:** ingesting `uvalux26-expo.jsonl` into `knowledge_chunk`. `retrieve.ts`,
`chunk.ts`, `embed.ts` and `match_knowledge` all stay exactly as they are — untouched, still
correct, still the path if raw-passage retrieval is ever wanted. Nothing is deleted.

### Two rules this path inherits and must not break

- **Thresholds stay LOW.** `retrieve.ts`'s header is explicit: short passages score ~0.44 similarity
  when they are exactly right, so raising the threshold is how this breaks. Claims are *shorter*
  than chunks, so the effect is stronger, not weaker. `DEFAULT_THRESHOLD = 0.3` is reused verbatim
  and the comparison direction (`>=`) is copied from `match_knowledge`, not re-derived.
- **No individual is ever named, and no internal path ever renders.** Owner directive 2026-08-22
  (`packages/core/src/sources/experts.ts`). Claims carry no speaker column — safe by construction —
  but they DO carry `source_file` = `J:\Uva25\…`. That column must never leave the server. The
  citation label is built in one function, the same way `toCitation` is the single safety
  mechanism for chunks.

---

## 1. Migration — embedding column + `bask.match_claims`

`packages/db/prisma/migrations/20260829000000_knowledge_claim_embedding/migration.sql`

```
ALTER TABLE "bask"."knowledge_claim" ADD COLUMN IF NOT EXISTS "embedding" public.vector(1536);
CREATE OR REPLACE FUNCTION "bask"."match_claims"(
  query_embedding public.vector(1536), match_count int,
  match_threshold double precision, filter_corpus text, filter_lens text)
RETURNS TABLE(claim_id uuid, claim text, quote text, category text, moment text,
              specificity text, lens text, review_state text, t_start double precision,
              times_said int, similarity double precision) …
```

- `OPERATOR(public.<=>)` — the 2026-08-20 migration failed for exactly this reason (search_path does
  not include `public`). Copy that form, do not write a bare `<=>`.
- `WHERE embedding IS NOT NULL AND review_state <> 'rejected'` — the review gate.
- No ivfflat/hnsw index. 1,007 rows is a sequential scan in single-digit ms, and the existing
  migration's note says an index without tuning against real row counts is guessing.
- Apply with `pnpm db:check` then `pnpm db:deploy`, `DIRECT_DATABASE_URL` (:5432). **Never**
  `prisma migrate dev`.

**Acceptance:** `select count(*) from bask.knowledge_claim where embedding is null` = 1007;
`\df bask.match_claims` exists; `pnpm db:check` passes (bask-scoped DDL only).

`schema.prisma`: add `embedding Unsupported("public.vector(1536)")?` to `KnowledgeClaim` so the model
does not silently drift. If `prisma generate` rejects it, drop the field and leave a comment naming
the column — the client never selects it either way.

## 2. `packages/db/scripts/knowledge/embed-claims.ts`

Mirrors `embed.ts`: gated behind `EMBED_CONFIRM=yes`, needs `OPENAI_API_KEY`, raw SQL, batches of
64, `text-embedding-3-small`, dry-run prints the plan and writes nothing.

- Embeds `claim + '\n' + quote` — the directive carries the meaning, the quote carries the
  vocabulary an owner would actually type.
- **Idempotent:** `WHERE embedding IS NULL` only. Re-running after a partial failure resumes.
- Loud on partial: prints rows embedded / rows failed / rows still null at the end.

**Acceptance:** dry run prints 1,007 and writes nothing; the real run leaves
`count(*) where embedding is null` = 0.

## 3. `packages/core/src/knowledge/retrieve-claims.ts`

New file next to `retrieve.ts`, sharing its constants and its philosophy.

```ts
export interface ClaimMatch { claimId; claim; quote; category; moment; specificity;
                              lens; reviewState; tStart; timesSaid; similarity }
export interface ClaimCitation {
  claimId; claim; quote;          // the sentence, and the words it came from
  label;                          // "UVALUX training · 1h12m" — NEVER a person, NEVER a path
  category; moment;
  confidence: 'verified' | 'unreviewed';   // straight off review_state, no interpretation
  similarity;
}
export function toClaimCitation(m: ClaimMatch): ClaimCitation   // THE safety mechanism
export async function retrieveClaims(embedding, query, opts?): Promise<ClaimCitation[]>
```

Reuses `DEFAULT_THRESHOLD` / `DEFAULT_MATCH_COUNT` and `formatOffset` from `retrieve.ts` — one
threshold, one time formatter, no second source of truth. Both files exported from
`packages/core/src/index.ts` (`retrieve` is exported too — it has been dead code only because it was
never exported).

**Acceptance:** `toClaimCitation` output contains no `sourceFile`, `sourceStream` or `reviewedBy`
field at all — not "we don't render it", *not present in the type*.

## 4. `packages/api/src/knowledge/coaching.ts` — the one caller

`coachingFor(text, opts)`: embed the query with the same model, call `bask.match_claims` through
`db.$queryRaw`, map with `toClaimCitation`, return `ClaimCitation[]`.

- **Never throws into a caller.** No key, no matches, DB error → `[]` and a `rlog` line. A campaign
  must generate and an insight must render whether or not the RAG answered.
- Logs one line per retrieval: query hash, match count, top similarity — so "did the RAG actually
  run?" is answerable from a terminal, exactly as `campaign generated · path=…` is.

## 5. Wire it in — two surfaces

**a. Campaign generation** (`packages/api/src/ai/campaign.ts`, `routers/marketing.ts`)
- Retrieve on `goal + offer.headline + audience.label + fixing?.title` before the model call.
- Inject the top 3 into the prompt as coaching principles to follow — prose only. The existing rule
  holds: **the model writes prose, never numbers**, and coaching text never becomes a fact claim.
- Add `coaching: ClaimCitation[]` (default `[]`) to `campaignContentSchema`, persisted on the draft
  so the Review screen can show what the copy drew on. Default `[]` keeps every existing row valid —
  no version bump needed.

**b. Insight advice** (`InsightCard` drill-down, Today + Insights)
- Retrieve on `insight title + evidence sentence`, fetched when the drill-down opens — the same
  interaction that already fetches records. One call per open, nothing on page load.

**c. Opportunity cards** already print a METHOD line from `experts.ts`. Left alone. That line is the
de-identified *technique* attribution and is not the same thing as a retrieved citation.

## 6. Make it clickable — `packages/ui/src/components/CoachingCitations.tsx`

The actual requirement. Under the copy / under the evidence:

```
Coaching this drew on
  ▸ Use grandfathered pricing for long-term loyal clients when moving to a new membership model.
      UVALUX training · 1h12m · membership · unreviewed
```

Click a citation → it expands **inline**, showing the verbatim quote, the timecode, the category and
the review state. **Never a modal** — DESIGN_SPEC rule, the same one `EvidenceDrilldown` obeys.
Empty array → the block does not render at all. Copy goes in the guidance dictionary
(`packages/ui/src/guidance/guidance.ts`), grade-7 register.

## 7. Verify — production, then a gate that stops it rotting

- Run the embed against **prod**, confirm `embedding is null` = 0.
- Deployed URL: open an insight drill-down, expand a citation, screenshot → Telegram.
- Generate a campaign **only if Daniel says yes** — it persists a draft row in the demo database.
  That question is open and unanswered; the insight path is demonstrable without it.
- New `demo:verify` beat, `coaching`: the citation block renders on the insight drill-down AND
  expanding one reveals a quote. Reports **SKIP** if the corpus is unembedded, never PASS — a green
  run must not mean "we didn't look".

---

## Order of work

1. migration + `db:check` + `db:deploy`
2. `embed-claims.ts` → dry run → real run against prod
3. `retrieve-claims.ts` + core exports
4. `coaching.ts` retrieval helper
5. `CoachingCitations.tsx` + guidance copy
6. wire campaign generation, wire insight drill-down
7. `tsc` + `demo:verify` + prod screenshot

## Deviations

*(logged here as they happen, not silently absorbed)*

1. **`prisma.schema` DOES carry the column.** The plan hedged. `Unsupported("vector(1536)")?` was
   added to `KnowledgeClaim`, `prisma validate` and `prisma generate` both accept it, and the model
   no longer drifts from the database. The client still cannot select it; every read and write is
   raw SQL.

2. **A category PREFERENCE was added, unplanned.** Measured on the live corpus for "Retail
   attachment is slipping…": the top five hits scored 0.476 / 0.471 / 0.456 / 0.454 / 0.453, and the
   0.456 was *"Salon owners often experience high turnover of businesses in their area"* — visibly
   irrelevant, and scoring above two good ones. Similarity cannot separate them at that spacing, and
   raising the threshold would cut good hits first (the whole point of the low-threshold note). So
   `retrieveClaims` now takes `prefer: string[]` and floats matching `category` rows to the top.
   **It never excludes anything** — a hard filter on a 1,007-row corpus is how a class of insight
   ends up with zero citations. `INSIGHT_CLAIM_CATEGORIES` maps insight type → categories;
   `anomaly_band` is deliberately absent (an unexplained movement has no domain yet).

3. **A pre-existing campaign-generation bug was fixed, in scope by necessity.** Roughly one
   generation in three came back with a two-line `graphicHeadline`
   (`"20% Off Every Tan Session\nThis Tuesday & Wednesday"`, 50 chars), failing the 40-character cap
   and dropping the whole content set onto the deterministic path. Verified pre-existing by running
   the same generation with retrieval disabled (`NO_COACHING=1`) — it failed identically. It had to
   be fixed here because citations only attach on the AI path, so Studio's half of this feature was
   otherwise a coin flip. Fix is prompt-only: the JSON-schema description and one prompt line now
   both say single line, 34 characters. 4 of 4 subsequent runs took the AI path.

4. **Citations are attached ONLY on the AI path.** Not in the original plan. The deterministic
   fallback writes from templates and never saw a claim, so labelling that copy "what this drew on"
   would be false. `coaching` is `[]` there, and the block simply does not render.

5. **The dedupe key grew a second half.** Claim-prefix alone let two paraphrases of one spoken line
   through (the corpus was mined four times over the same recordings). Now keyed on the first 12
   words of the QUOTE as well — two claims anchored to the same words are one citation.

6. **Production verification is DATABASE-side only.** The migration, the 1,007 embeddings and every
   retrieval measured above ran against the production database. The application code is NOT
   deployed — nothing is committed, and deploying is Daniel's call. What was proven: prod schema,
   prod corpus, prod retrieval, and the full UI path rendered against prod data from a local build.

7. **Studio's citation block has not been photographed.** Rendering it requires running a real
   `marketing.generate`, which persists a draft campaign row in the demo database Daniel presents
   from — his open question (a), still unanswered. The path was proven instead by calling
   `generateCampaignContent` directly (`packages/api/scripts/campaign-coaching-smoke.ts`): AI path,
   `gpt-4.1`, 3 citations attached to `content.coaching`, no row written.
