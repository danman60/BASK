# TASK — the knowledge chunker

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/knowledge/chunk.ts`

This is a **port of a proven algorithm**, not a new design. Reproduce the behaviour exactly as
specified below. It has been running in production in another product for months; the boundaries
and the overlap are the reason retrieval works, so do not "improve" them.

The file has **no imports**. It is pure TypeScript with no dependencies.

## What it does

Splits a long piece of text into overlapping chunks of roughly 1,200 characters, breaking on
paragraph boundaries where it can and sentence boundaries where a paragraph is too long. The
overlap exists so a sentence that straddles a boundary is still retrievable from both sides.

## The file, in full detail

Start with this exact doc comment at the top of the file:

```ts
/**
 * Text chunking for knowledge ingestion.
 *
 * Ported from the StudioSage implementation, which has been in production
 * against ~30 paying tenants. The 1200/150 numbers and the paragraph-then-
 * sentence boundary order are load-bearing: retrieval quality was tuned around
 * them. Do not adjust them without re-tuning the similarity threshold too.
 */
```

Then export these three constants, with these exact names and values:

```ts
export const CHUNK_TARGET = 1200
export const CHUNK_OVERLAP = 150
export const DEFAULT_MAX_CHUNKS = Infinity
```

`DEFAULT_MAX_CHUNKS` is `Infinity` **on purpose and this is the one deliberate difference from the
original**, which capped at 40. That cap was sized for a forwarded email. Our corpus documents are
whole conference sessions of 5,000–15,000 words, and a cap of 40 would silently discard most of
every long session. Callers that want a cap pass one.

Then export this exact type:

```ts
export type ChunkResult = { chunks: string[]; capped: boolean }
```

Then export one function with this exact signature:

```ts
export function chunkText(text: string, maxChunks: number = DEFAULT_MAX_CHUNKS): ChunkResult
```

### Its algorithm, step by step

1. Normalize: replace all `\r\n` with `\n`, then trim. If the result is empty, return
   `{ chunks: [], capped: false }`.
2. Split into paragraphs on `/\n\s*\n/`, trim each, drop empties.
3. Build a list of "units":
   - a paragraph at or under `CHUNK_TARGET` characters becomes one unit as-is;
   - a longer paragraph is split on sentence boundaries using the regex
     `/[^.!?\n]+[.!?]*\s*/g` (if that match returns nothing, treat the whole paragraph as one
     sentence), and those sentences are greedily packed into units of at most `CHUNK_TARGET`
     characters.
4. Greedily pack units into chunks: append a unit to the current chunk joined by `\n\n`; but if
   adding it would take the current chunk past `CHUNK_TARGET` and the chunk is non-empty, push the
   current chunk and start the next one with the **last `CHUNK_OVERLAP` characters of the chunk you
   just pushed**, followed by `\n`, followed by the unit.
5. Push whatever is left, trim every chunk, drop empties.
6. If the number of chunks exceeds `maxChunks`, return the first `maxChunks` of them with
   `capped: true`. Otherwise return them all with `capped: false`.

### A second exported helper

Also export this function, which callers use to size an embedding batch:

```ts
export function estimateTokens(text: string): number
```

It returns `Math.ceil(text.length / 4)`. Add a one-line comment saying this is a deliberate rough
approximation used only for batching, never for billing.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/knowledge/chunk.ts`
- Do NOT create or modify any other file. Do NOT edit `packages/core/src/index.ts` — wiring the
  export up is somebody else's task.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/core`
  reports zero errors that name this file, and the file exports `CHUNK_TARGET`, `CHUNK_OVERLAP`,
  `DEFAULT_MAX_CHUNKS`, `ChunkResult`, `chunkText` and `estimateTokens`.
- No imports. No dependencies. No `any`.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
