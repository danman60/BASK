/**
 * Writes knowledge documents and their embedded chunks to the database.
 *
 * Reads `packages/db/fixtures/knowledge/uvalux26-expo.jsonl`, chunks each
 * document, embeds the chunks, and writes to `bask.knowledge_doc` and
 * `bask.knowledge_chunk`.
 *
 * ⚠️ This WRITES TO A SHARED DATABASE and spends money on an embedding API. It is
 * gated behind `EMBED_CONFIRM=yes`; without it the script prints its plan and
 * exits having touched nothing.
 *
 * Raw SQL rather than Prisma models, deliberately: these two tables are created
 * by a hand-written migration and are NOT in `schema.prisma`, so no client is
 * generated for them. For a one-off ingest that is the right trade — adding them
 * to the schema would mean a regenerate and a second source of truth for tables
 * only this script writes.
 */
import { readFileSync } from 'fs';

import { chunkText, estimateTokens } from '../../../core/src/knowledge/chunk';
import { db } from '../../src/index';

/** One line of the corpus JSONL, as `extract-expo.ts` emits it. */
interface CorpusDoc {
  corpus: string;
  source: string;
  title: string;
  speaker: string | null;
  audience: string;
  titleConfidence: string;
  startSec: number;
  endSec: number;
  words: number;
  text: string;
}

interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

const CORPUS_PATH =
  '/home/danman60/projects/uvalux-platform/packages/db/fixtures/knowledge/uvalux26-expo.jsonl';
const BATCH = 64;

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is required. Nothing was written.');
    return;
  }

  const lines = readFileSync(CORPUS_PATH, 'utf-8')
    .split('\n')
    .filter((line) => line.trim() !== '');
  const documents: CorpusDoc[] = lines.map((line) => JSON.parse(line) as CorpusDoc);
  const totalWords = documents.reduce((n, d) => n + (d.words || 0), 0);

  console.log(`corpus:    ${documents[0]?.corpus ?? '(empty)'}`);
  console.log(`documents: ${documents.length}`);
  console.log(`words:     ${totalWords.toLocaleString()}`);
  console.log('tables:    bask.knowledge_doc, bask.knowledge_chunk');

  if (process.env.EMBED_CONFIRM !== 'yes') {
    console.log('\nDry run. Set EMBED_CONFIRM=yes to write.');
    return;
  }

  let docsWritten = 0;
  let chunksWritten = 0;
  let chunksFailed = 0;

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    try {
      const inserted = await db.$queryRaw<Array<{ id: string }>>`
        INSERT INTO bask.knowledge_doc
          (corpus, source, title, speaker, audience, title_confidence, start_sec, end_sec, words)
        VALUES
          (${doc.corpus}, ${doc.source}, ${doc.title}, ${doc.speaker}, ${doc.audience},
           ${doc.titleConfidence}, ${doc.startSec}, ${doc.endSec}, ${doc.words})
        RETURNING id`;
      const docId = inserted[0].id;
      docsWritten++;

      // chunkText returns { chunks, capped }. A capped run must be loud: silently
      // keeping the first N chunks of a 15,000-word session looks identical to a
      // complete ingest, and would quietly hollow out the knowledge base.
      const { chunks, capped } = chunkText(doc.text);
      if (capped) console.warn(`  ! ${doc.title} was CAPPED — not every chunk ingested`);

      for (let j = 0; j < chunks.length; j += BATCH) {
        const batch = chunks.slice(j, j + BATCH);
        try {
          const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({ model: 'text-embedding-3-small', input: batch }),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }

          const result = (await response.json()) as EmbeddingResponse;

          for (let k = 0; k < result.data.length; k++) {
            // pgvector takes its value as a literal '[0.1,0.2,...]' over the wire.
            const vector = `[${result.data[k].embedding.join(',')}]`;
            await db.$executeRaw`
              INSERT INTO bask.knowledge_chunk (doc_id, ordinal, text, tokens, embedding)
              VALUES (${docId}::uuid, ${j + k}, ${batch[k]}, ${estimateTokens(batch[k])},
                      ${vector}::public.vector)`;
            chunksWritten++;
          }
        } catch (batchError) {
          console.error(`  batch failed in "${doc.title}":`, batchError);
          chunksFailed += batch.length;
        }
      }

      console.log(`${i + 1}/${documents.length} ${doc.title} — ${chunks.length} chunks`);
    } catch (error) {
      console.error(`document failed "${doc.title}":`, error);
    }
  }

  console.log('\nSummary');
  console.log(`  documents written: ${docsWritten}`);
  console.log(`  chunks written:    ${chunksWritten}`);
  console.log(`  chunks failed:     ${chunksFailed}`);
}

main().catch(console.error);
