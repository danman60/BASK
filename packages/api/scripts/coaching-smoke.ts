/**
 * Smoke test for claim retrieval against whatever database DATABASE_URL points at.
 *
 * Read-only: embeds one question, calls `bask.match_claims`, prints what comes
 * back. This is the fastest honest answer to "is the RAG actually returning
 * anything, and is it returning the RIGHT thing" — `pnpm demo:verify` proves the
 * citation reaches the screen, this proves the retrieval underneath it is sane.
 *
 *   OPENAI_API_KEY=… npx tsx scripts/coaching-smoke.ts "quiet tuesday afternoons"
 */
import { db } from '@bask/db';

import { coachingFor } from '../src/ai/coaching';

const query = process.argv.slice(2).join(' ') || 'retail attachment is slipping at checkout';

async function main(): Promise<void> {
  const citations = await coachingFor(db, query, { limit: 5 });

  console.log(`\nquery: ${query}`);
  if (citations.length === 0) {
    console.log('no citations — check OPENAI_API_KEY and that the corpus is embedded.');
    return;
  }

  for (const citation of citations) {
    console.log(`\n  ${citation.similarity.toFixed(3)}  ${citation.claim}`);
    console.log(`         "${citation.quote.slice(0, 120)}…"`);
    console.log(`         ${citation.label} · ${citation.category} · ${citation.confidence}`);
  }
}

main()
  .catch(console.error)
  .finally(() => void db.$disconnect());
