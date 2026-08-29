/**
 * Retrieval over the DISTILLED CLAIMS — the coaching the product actually cites.
 *
 * The sibling file `retrieve.ts` retrieves raw transcript chunks and is unchanged.
 * This one hits `bask.match_claims` over `bask.knowledge_claim`: 1,007 one-sentence
 * directives mined from UVALUX's own Room B recordings, each carrying the verbatim
 * quote it came from, a category, a moment, and a review state. A claim is
 * something a salon owner can read; a chunk is 400 words of transcript they have to
 * mine. Decision and evidence: `docs/plans/2026-08-29-rag-wiring.md` §0.
 *
 * THRESHOLDS ARE LOW ON PURPOSE, AND MORE SO HERE. `retrieve.ts` records that a
 * 400-word passage scores ~0.44 similarity when it is exactly the right answer. A
 * one-sentence claim is shorter still, so it scores lower again for the same
 * relevance. Raising the threshold is how this breaks, not how it improves — and
 * check the direction of any comparison you touch.
 *
 * TWO THINGS THIS FILE GUARANTEES, because they are owner directives and not
 * preferences (2026-08-22, see `sources/experts.ts`):
 *   1. No individual is ever named. Claims carry no speaker column, so the shape
 *      below simply has nowhere to put one.
 *   2. No internal path ever reaches a browser. `knowledge_claim.source_file` is
 *      `J:\Uva25\…` — a drive letter on somebody's edit bay. It is absent from
 *      `ClaimMatch` and absent from `ClaimCitation`: not "not rendered", not
 *      present.
 */

import { DEFAULT_MATCH_COUNT, DEFAULT_THRESHOLD, formatOffset } from './retrieve';

/** One row as `bask.match_claims` returns it. */
export interface ClaimMatch {
  claimId: string;
  claim: string;
  quote: string;
  category: string;
  moment: string;
  specificity: string;
  lens: string;
  reviewState: string;
  /** Offset into the source recording, seconds. */
  tStart: number;
  timesSaid: number;
  similarity: number;
}

/** A match, plus the line a UI may safely print under it. */
export interface ClaimCitation {
  claimId: string;
  /** The directive itself — one sentence, already readable. */
  claim: string;
  /** The words it was distilled from. This is what makes it a citation. */
  quote: string;
  /** Safe to show. The training programme and a timecode, never a person. */
  label: string;
  category: string;
  moment: string;
  /**
   * Straight off `review_state`, with no interpretation. `verified` means a human
   * pressed Verify. Everything else is `unreviewed` and says so on the card —
   * 3 of 1,007 are decided, and the UI must not imply otherwise.
   */
  confidence: 'verified' | 'unreviewed';
  similarity: number;
}

export type ClaimQueryFn = (args: {
  embedding: readonly number[];
  matchCount: number;
  matchThreshold: number;
  corpus: string | null;
  lens: string | null;
}) => Promise<readonly ClaimMatch[]>;

/** App-facing name of the body of material. Never a room, never a speaker. */
export const CLAIM_SOURCE_LABEL = 'UVALUX training';

/**
 * Build the citation line. THIS IS THE SAFETY MECHANISM — every field that
 * reaches a browser is chosen here, and nothing else is copied across.
 */
export function toClaimCitation(match: ClaimMatch): ClaimCitation {
  return {
    claimId: match.claimId,
    claim: match.claim,
    quote: match.quote,
    label: `${CLAIM_SOURCE_LABEL} · from ${formatOffset(match.tStart)}`,
    category: match.category,
    moment: match.moment,
    confidence: match.reviewState === 'verified' ? 'verified' : 'unreviewed',
    similarity: match.similarity,
  };
}

/**
 * Drop near-duplicates.
 *
 * The corpus was mined four times over the same recordings under different lenses
 * (`salon-advice`, `salon-advice-v2`, `salon-marketing`, `salon-recall`), so the
 * same piece of coaching genuinely appears more than once in different words.
 * Three citations saying one thing reads as padding; one reads as an answer.
 *
 * TWO KEYS, and the second is the one that earns its keep. A live retrieval on
 * 2026-08-29 returned "Staff spend too much time on repetitive, awkward reselling
 * conversations…" and "Salon owners find it frustrating when staff spend too much
 * time reselling…" as separate hits — different paraphrases of the SAME sentence,
 * distilled by two different mining passes. The claims diverge in their first
 * words, so a claim-only key lets both through. The quote underneath them is
 * character-identical, which is the fact that actually settles it: two claims
 * anchored to the same spoken words are one citation.
 */
function normalise(text: string, words: number): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, words)
    .join(' ');
}

export function dedupeClaims(citations: readonly ClaimCitation[]): ClaimCitation[] {
  const seenClaims = new Set<string>();
  const seenQuotes = new Set<string>();
  const out: ClaimCitation[] = [];

  for (const citation of citations) {
    // First eight words of the directive — catches a re-mining of the same
    // sentence without collapsing two genuinely different tactics.
    const claimKey = normalise(citation.claim, 8);
    // First twelve words of the source quote — catches two paraphrases of one
    // spoken line, which the claim key cannot see.
    const quoteKey = normalise(citation.quote, 12);

    if (seenClaims.has(claimKey) || seenQuotes.has(quoteKey)) continue;
    seenClaims.add(claimKey);
    seenQuotes.add(quoteKey);
    out.push(citation);
  }

  return out;
}

/**
 * Float claims in the preferred categories to the top. A PREFERENCE, not a filter.
 *
 * Measured 2026-08-29 against the live corpus: for "Retail attachment is
 * slipping…" the top five hits scored 0.476, 0.471, 0.456, 0.454, 0.453 — and the
 * 0.456 was "Salon owners often experience high turnover of businesses in their
 * area", which has nothing to do with the insight. Similarity alone cannot tell
 * those apart at that spacing, and lifting the threshold would only cut the good
 * ones off with the bad. The claims already carry a hand-assigned `category`, so
 * an insight about retail can prefer retail coaching without pretending to have
 * scored anything better.
 *
 * Nothing is ever dropped here. A hard filter on a corpus this small is how a
 * surface ends up with zero citations for a whole class of insight; if fewer than
 * `limit` preferred claims exist, the rest fill the list in similarity order.
 */
function preferCategories(
  citations: readonly ClaimCitation[],
  prefer: readonly string[],
): ClaimCitation[] {
  if (prefer.length === 0) return [...citations];
  const wanted = new Set(prefer);
  // Stable partition: relative similarity order survives inside each group.
  return [
    ...citations.filter((citation) => wanted.has(citation.category)),
    ...citations.filter((citation) => !wanted.has(citation.category)),
  ];
}

export async function retrieveClaims(
  embedding: readonly number[],
  query: ClaimQueryFn,
  opts?: {
    matchCount?: number;
    matchThreshold?: number;
    corpus?: string | null;
    lens?: string | null;
    /** Categories to float to the top. Never excludes anything. */
    prefer?: readonly string[];
    /** How many survive de-duplication. Omit to keep them all. */
    limit?: number;
  },
): Promise<ClaimCitation[]> {
  const results = await query({
    embedding,
    // Over-fetch, because de-duplication removes rows after the database has
    // already applied LIMIT. Asking for exactly three and keeping one is the
    // documented way this returns too little.
    matchCount: opts?.matchCount ?? DEFAULT_MATCH_COUNT * 2,
    matchThreshold: opts?.matchThreshold ?? DEFAULT_THRESHOLD,
    corpus: opts?.corpus ?? null,
    lens: opts?.lens ?? null,
  });

  const deduped = dedupeClaims(results.map(toClaimCitation));
  const ranked = preferCategories(deduped, opts?.prefer ?? []);
  return opts?.limit ? ranked.slice(0, opts.limit) : ranked;
}
