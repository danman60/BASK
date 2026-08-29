/**
 * The one caller of claim retrieval — "what does the coaching say about this?"
 *
 * Embeds a short piece of product context (a campaign goal, an insight title and
 * its evidence sentence), searches `bask.match_claims`, and returns citations the
 * UI can print. `packages/core/src/knowledge/retrieve-claims.ts` owns the shape
 * and the de-identification; this file owns the database round trip and the
 * failure policy.
 *
 * FAILURE POLICY, and it is the important part of this file: **retrieval is an
 * enhancement, never a dependency.** No key, no embedded corpus, a database
 * error, a timeout — every one of them returns `[]` and logs. A campaign must
 * still generate and an insight must still render when the RAG says nothing. The
 * demo does not get to fail because a vector search did.
 *
 * The `console.info` line is deliberate and matches the one campaign generation
 * prints: "did the RAG actually run, and on what?" has to be answerable from a
 * terminal, not inferred from whether citations happened to appear.
 */

import { embedText, retrieveClaims, type ClaimCitation, type ClaimMatch } from '@bask/core';
import type { PrismaClient } from '@bask/db';

/** Row shape `bask.match_claims` returns, snake_case as Postgres emits it. */
interface MatchClaimRow {
  claim_id: string;
  claim: string;
  quote: string;
  category: string;
  moment: string;
  specificity: string;
  lens: string;
  review_state: string;
  t_start: number;
  times_said: number;
  similarity: number;
}

export interface CoachingOptions {
  /** How many citations survive to the UI. Three is a sidebar; ten is a wall. */
  limit?: number;
  /** Restrict to one mining pass, e.g. `salon-marketing`. Null searches all. */
  corpus?: string | null;
  /** Restrict to one lens: `advice`, `marketing`, `recall`. Null searches all. */
  lens?: string | null;
  /** Claim categories to float to the top. A preference — never excludes. */
  prefer?: readonly string[];
  env?: NodeJS.ProcessEnv;
}

/**
 * Insight type → the claim categories worth preferring for it.
 *
 * Kept here rather than in the database because it is a product judgement about
 * two vocabularies, not a fact about either. An insight type that is missing
 * simply gets no preference and ranks on similarity alone, which is the correct
 * behaviour for `anomaly_band` — an unexplained movement has no domain yet.
 */
export const INSIGHT_CLAIM_CATEGORIES: Record<string, readonly string[]> = {
  retail_attachment_slip: ['retail'],
  overstock: ['retail'],
  low_stock: ['retail'],
  soft_capacity: ['marketing', 'membership'],
  failed_payments: ['membership', 'operations'],
};

export const DEFAULT_COACHING_LIMIT = 3;

/**
 * Retrieve the coaching behind a piece of product context.
 *
 * Returns `[]` rather than throwing. Ever.
 */
export async function coachingFor(
  db: PrismaClient,
  text: string,
  opts: CoachingOptions = {},
): Promise<ClaimCitation[]> {
  const query = text.trim();
  if (query.length === 0) return [];

  const limit = opts.limit ?? DEFAULT_COACHING_LIMIT;
  const started = Date.now();

  try {
    const embedding = await embedText(query, opts.env);

    const citations = await retrieveClaims(
      embedding,
      async ({ embedding: vector, matchCount, matchThreshold, corpus, lens }) => {
        // pgvector takes its value as the literal '[0.1,0.2,…]' over the wire —
        // the same form the ingest script writes.
        const literal = `[${vector.join(',')}]`;
        const rows = await db.$queryRaw<MatchClaimRow[]>`
          SELECT * FROM bask.match_claims(
            ${literal}::public.vector,
            ${matchCount}::int,
            ${matchThreshold}::double precision,
            ${corpus}::text,
            ${lens}::text)`;

        return rows.map(
          (row): ClaimMatch => ({
            claimId: row.claim_id,
            claim: row.claim,
            quote: row.quote,
            category: row.category,
            moment: row.moment,
            specificity: row.specificity,
            lens: row.lens,
            reviewState: row.review_state,
            tStart: Number(row.t_start),
            timesSaid: Number(row.times_said),
            similarity: Number(row.similarity),
          }),
        );
      },
      { corpus: opts.corpus ?? null, lens: opts.lens ?? null, prefer: opts.prefer ?? [], limit },
    );

    console.info(
      `[coaching] retrieved ${citations.length} claim(s) in ${Date.now() - started}ms · ` +
        `top=${citations[0]?.similarity.toFixed(3) ?? 'none'} · q="${query.slice(0, 60)}"`,
    );

    return citations;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Warn, never throw. The caller has a product to render.
    console.warn(`[coaching] retrieval unavailable, continuing without citations: ${message}`);
    return [];
  }
}

/**
 * The prompt fragment handed to campaign generation.
 *
 * Claims go in as PRINCIPLES TO FOLLOW, never as facts to repeat. The model is
 * already told it may not invent a statistic or a testimonial; coaching text must
 * not become a loophole in that rule, so the instruction says apply the approach
 * and forbids quoting the coaching at the customer.
 */
export function coachingPromptBlock(citations: readonly ClaimCitation[]): string {
  if (citations.length === 0) return '';

  const lines = citations.map((citation, index) => `${index + 1}. ${citation.claim}`).join('\n');

  return [
    '',
    'Coaching from the UVALUX training programme, relevant to this campaign:',
    lines,
    '',
    'Apply the approach in these lines where it fits the offer you were given. Do not quote them,',
    'do not mention training or coaching to the customer, and do not treat them as facts about this',
    'salon. If a line does not fit, ignore it.',
  ].join('\n');
}
