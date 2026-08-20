# TASK — the knowledge retrieval module

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/knowledge/retrieve.ts`

## What this is

The read side of the knowledge base: turn a question into an embedding, ask Postgres for the
nearest chunks, and hand back passages **with their provenance attached**.

This module has one job beyond fetching text: **it must make it impossible to attribute a quote to a
person we are not sure said it.** Session boundaries for part of the corpus were derived from a
printed agenda's clock and they drift — one slice labelled "The Power of Numbers, Mike Blore" was
actually a different speaker entirely. So the citation this module builds is the safety mechanism,
not decoration.

## No database client in this file

This module is pure and testable: it takes an **injected query function**. The caller supplies the
database access. That keeps `@bask/core` free of a Prisma dependency and keeps this unit testable.

## The file

Doc comment:

```ts
/**
 * Retrieval over the expo knowledge base.
 *
 * Thresholds here are LOW on purpose. Short passages score around 0.44
 * similarity even when they are exactly the right answer, so raising the
 * threshold is how this breaks, not how it improves. Check the direction of any
 * comparison you change — inverting it once gave the strictest tenants the
 * fuzziest results in the product this was ported from.
 */
```

Types:

```ts
/** One row as the SQL function returns it. */
export interface KnowledgeMatch {
  chunkId: string;
  docId: string;
  text: string;
  title: string;
  speaker: string | null;
  titleConfidence: 'anchored' | 'interpolated';
  startSec: number;
  similarity: number;
}

/** A match, plus the sentence a UI may safely print under it. */
export interface Citation {
  chunkId: string;
  text: string;
  /** Safe to show. Never names a speaker we are not sure of. */
  label: string;
  /** Whether the session attribution was anchored on spoken content. */
  confidence: 'confirmed' | 'approximate';
  similarity: number;
}

export type QueryFn = (args: {
  embedding: readonly number[];
  matchCount: number;
  matchThreshold: number;
  corpus: string | null;
}) => Promise<readonly KnowledgeMatch[]>;
```

Constants:

```ts
/** Deliberately low. See the file comment before changing it. */
export const DEFAULT_THRESHOLD = 0.3;
export const DEFAULT_MATCH_COUNT = 6;
```

Helpers:

```ts
/** Seconds -> "3h37m", the form the transcripts are indexed by. */
export function formatOffset(seconds: number): string
```

`formatOffset` floors to whole minutes: hours is `Math.floor(seconds / 3600)`, minutes is
`Math.floor((seconds % 3600) / 60)` padded to two digits, producing e.g. `3h07m`. Negative input
clamps to `0h00m`.

```ts
/**
 * Build the citation line. THIS IS THE SAFETY MECHANISM — read the rules below.
 */
export function toCitation(match: KnowledgeMatch): Citation
```

`toCitation` rules, exactly:

- When `titleConfidence` is `'anchored'`: `confidence` is `'confirmed'`, and `label` is
  `` `${title}${speaker ? ' — ' + speaker : ''} · from ${formatOffset(startSec)}` ``.
- When `titleConfidence` is `'interpolated'`: `confidence` is `'approximate'`, and the label
  **must not contain the speaker's name at all**, even if one is present on the row. It is
  `` `2026 Expo · from ${formatOffset(startSec)}` ``.

That second rule is the whole point of the module. Do not "improve" it by including the name with a
hedge.

Main function:

```ts
export async function retrieve(
  embedding: readonly number[],
  query: QueryFn,
  opts?: { matchCount?: number; matchThreshold?: number; corpus?: string | null },
): Promise<Citation[]>
```

Behaviour: call `query` with the embedding, `opts.matchCount ?? DEFAULT_MATCH_COUNT`,
`opts.matchThreshold ?? DEFAULT_THRESHOLD` and `opts.corpus ?? null`; map every row through
`toCitation`; return them in the order received. Return `[]` when the query returns nothing.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/knowledge/retrieve.ts`
- Do NOT create or modify any other file. Do NOT edit `index.ts`. Do NOT import Prisma, `@bask/db`,
  `pg`, or any HTTP client — the query function is injected.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/core`
  reports zero errors naming this file; the file exports `KnowledgeMatch`, `Citation`, `QueryFn`,
  `DEFAULT_THRESHOLD`, `DEFAULT_MATCH_COUNT`, `formatOffset`, `toCitation` and `retrieve`; and it
  contains the string `'interpolated'`.
- No `any`. No I/O. No `new Date()`. No `Math.random()`.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
