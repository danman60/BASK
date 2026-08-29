/**
 * Embeds `bask.knowledge_claim` so `bask.match_claims` has something to search.
 *
 * The sibling script `embed.ts` does the same job for raw transcript chunks. This
 * one indexes the DISTILLED claims instead — the retrieval target the product
 * actually cites, because a claim is one readable sentence with the verbatim
 * quote it came from, and a chunk is 400 words of spoken transcript. Decision and
 * evidence: `docs/plans/2026-08-29-rag-wiring.md` §0.
 *
 * ⚠️ WRITES TO A SHARED DATABASE and spends money on an embedding API. Gated
 * behind `EMBED_CONFIRM=yes`; without it this prints its plan and touches nothing.
 * At ~1,007 rows × ~70 tokens on text-embedding-3-small that is about $0.0015.
 *
 * IDEMPOTENT BY CONSTRUCTION: it only ever selects rows `WHERE embedding IS NULL`.
 * A run that dies halfway can simply be re-run, and a finished corpus re-runs to
 * "0 rows need embedding" rather than paying twice.
 *
 * Raw SQL for the write because `embedding` is `Unsupported("vector(1536)")` in
 * the Prisma schema — declared so the model does not drift from the database, but
 * not selectable through the generated client. pgvector takes its value as the
 * literal '[0.1,0.2,…]' over the wire.
 */
import { db } from '../../src/index';

interface ClaimRow {
  id: string;
  claim: string;
  quote: string;
}

interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

const BATCH = 64;
const MODEL = 'text-embedding-3-small';

/**
 * What actually gets embedded.
 *
 * The claim carries the meaning; the quote carries the vocabulary a salon owner
 * would use out loud. Embedding both means "we're quiet on Tuesdays" can find a
 * claim phrased as "fill your slow weekdays", which the directive alone would
 * miss.
 */
function embedText(row: ClaimRow): string {
  return `${row.claim}\n${row.quote}`;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const result = (await response.json()) as EmbeddingResponse;
  return result.data.map((item) => item.embedding);
}

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is required. Nothing was written.');
    return;
  }

  const pending = await db.$queryRaw<ClaimRow[]>`
    SELECT id, claim, quote
    FROM bask.knowledge_claim
    WHERE embedding IS NULL
    ORDER BY corpus, t_start`;

  const [totals] = await db.$queryRaw<Array<{ total: bigint; embedded: bigint }>>`
    SELECT count(*) AS total, count(embedding) AS embedded FROM bask.knowledge_claim`;

  console.log(`claims:    ${Number(totals.total)}`);
  console.log(`embedded:  ${Number(totals.embedded)}`);
  console.log(`to embed:  ${pending.length}`);
  console.log(`model:     ${MODEL}`);
  console.log('table:     bask.knowledge_claim (embedding column)');

  if (pending.length === 0) {
    console.log('\nNothing to do — every claim already carries an embedding.');
    return;
  }

  if (process.env.EMBED_CONFIRM !== 'yes') {
    console.log('\nDry run. Set EMBED_CONFIRM=yes to write.');
    return;
  }

  let written = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH);
    try {
      const vectors = await embedBatch(batch.map(embedText));

      for (let k = 0; k < vectors.length; k++) {
        const literal = `[${vectors[k].join(',')}]`;
        await db.$executeRaw`
          UPDATE bask.knowledge_claim
          SET embedding = ${literal}::public.vector
          WHERE id = ${batch[k].id}::uuid`;
        written++;
      }

      console.log(`${Math.min(i + BATCH, pending.length)}/${pending.length}`);
    } catch (error) {
      // A failed batch must be loud. A silently skipped 64 rows looks exactly
      // like a complete ingest and would quietly hollow out retrieval.
      console.error(`  batch at ${i} failed:`, error);
      failed += batch.length;
    }
  }

  const [after] = await db.$queryRaw<Array<{ remaining: bigint }>>`
    SELECT count(*) AS remaining FROM bask.knowledge_claim WHERE embedding IS NULL`;

  console.log('\nSummary');
  console.log(`  embedded this run: ${written}`);
  console.log(`  failed:            ${failed}`);
  console.log(`  still unembedded:  ${Number(after.remaining)}`);
  if (Number(after.remaining) > 0) {
    console.log('  Re-run to finish — this script only touches rows with a null embedding.');
  }
}

main().catch(console.error);
