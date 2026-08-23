/**
 * `tsx scripts/knowledge/load-claims.ts [--commit]` — load mined advice claims
 * into bask.knowledge_claim.
 *
 * Spec: docs/superpowers/specs/2026-08-22-compass-knowledge-curation-design.md
 *
 * DRY-RUN BY DEFAULT. Pass `--commit` to write. This reads four lens corpora that
 * were mined from the same 17 transcripts by different prompts:
 *
 *   mined/            advice lens,   gemma4:12b   — "what should an owner do"
 *   mined-v2/         advice lens,   gemma4:31b   — same question, larger model
 *   mined-recall/     recall lens,   gemma4:31b   — war stories, mistakes, numbers
 *   mined-marketing/  marketing lens,gemma4:31b   — voice-of-customer language
 *
 * They are ONE table with a `lens` column rather than four tables, because they
 * share a provenance model and a review workflow. The curation queue filters to
 * the advice lenses by default; marketing quotes have a different consumer and
 * would otherwise make that queue noisier for no gain.
 *
 * IDEMPOTENT on (corpus, source_stream, t_start, quote). Re-running never
 * duplicates and never overwrites a human's review verdict — that is the whole
 * point of keeping review state on the row.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

import { db } from '../../src/index';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const DATA = join(REPO, 'data/salon-transcripts');

interface LensSource {
  dir: string;
  corpus: string;
  lens: string;
}

/** Each mined directory becomes its own corpus so they can be filtered apart. */
const SOURCES: LensSource[] = [
  { dir: 'mined', corpus: 'salon-advice', lens: 'advice' },
  { dir: 'mined-v2', corpus: 'salon-advice-v2', lens: 'advice' },
  { dir: 'mined-recall', corpus: 'salon-recall', lens: 'recall' },
  { dir: 'mined-marketing', corpus: 'salon-marketing', lens: 'marketing' },
];

interface MinedItem {
  claim: string;
  quote: string;
  category: string;
  moment?: string;
  shape?: string | null;
  specificity?: string;
  is_script?: boolean;
  source_stream: string;
  t_start: number;
  t_end: number;
}

interface ManifestStream {
  stream: string;
  source: string;
  audio_stream_index: number;
  event: string;
  label_prefix: string;
}

const CATEGORIES = new Set([
  'marketing',
  'membership',
  'retail',
  'operations',
  'customer',
  'coaching',
]);
const MOMENTS = new Set(['greeting', 'needs', 'product', 'membership', 'close', 'none']);

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function main(): Promise<number> {
  const commit = process.argv.includes('--commit');

  const manifestPath = join(DATA, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error(`No manifest at ${manifestPath}. Nothing was read.`);
    return 1;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    streams: ManifestStream[];
  };
  const byStream = new Map(manifest.streams.map((s) => [s.stream, s]));

  type Row = {
    corpus: string;
    claim: string;
    quote: string;
    category: string;
    moment: string;
    shape: string | null;
    specificity: string;
    isScript: boolean;
    sourceStream: string;
    sourceFile: string;
    audioStreamIx: number;
    tStart: number;
    tEnd: number;
    extractedBy: string;
    lens: string;
  };

  const rows: Row[] = [];
  const skipped = { noQuote: 0, unknownStream: 0, badCategory: 0, overlapDupe: 0 };
  const seen = new Set<string>();

  for (const src of SOURCES) {
    const dir = join(DATA, src.dir);
    if (!existsSync(dir)) {
      console.log(`  ${src.dir.padEnd(18)} MISSING — skipped`);
      continue;
    }
    let kept = 0;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.advice.json'))) {
      const doc = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
        model?: string;
        advice?: MinedItem[];
      };
      for (const item of doc.advice ?? []) {
        const quote = (item.quote ?? '').trim();
        // The verbatim gate, enforced a third time. The extractor rejected
        // unanchored items, the DB has a CHECK, and this is the middle layer.
        if (!quote) {
          skipped.noQuote += 1;
          continue;
        }
        const stream = byStream.get(item.source_stream);
        if (!stream) {
          skipped.unknownStream += 1;
          continue;
        }
        if (!CATEGORIES.has(item.category)) {
          skipped.badCategory += 1;
          continue;
        }
        // Adjacent mining windows overlap by 45s, so the same sentence can be
        // extracted twice. Collapse here or `times_said` lies later.
        const key = `${src.corpus}|${item.source_stream}|${item.t_start.toFixed(1)}|${norm(quote)}`;
        if (seen.has(key)) {
          skipped.overlapDupe += 1;
          continue;
        }
        seen.add(key);

        const moment = MOMENTS.has(item.moment ?? '') ? (item.moment as string) : 'none';
        rows.push({
          corpus: src.corpus,
          claim: (item.claim ?? '').trim(),
          quote,
          category: item.category,
          moment,
          shape: item.shape ?? null,
          specificity: item.specificity === 'concrete' ? 'concrete' : 'general',
          isScript: Boolean(item.is_script),
          sourceStream: item.source_stream,
          sourceFile: stream.source,
          audioStreamIx: stream.audio_stream_index ?? 0,
          tStart: item.t_start,
          tEnd: item.t_end,
          extractedBy: doc.model ?? 'unknown',
          lens: src.lens,
        });
        kept += 1;
      }
    }
    console.log(`  ${src.dir.padEnd(18)} ${String(kept).padStart(4)} claims → corpus '${src.corpus}'`);
  }

  console.log(
    `\n${rows.length} rows ready · skipped: ${skipped.noQuote} empty quote, ` +
      `${skipped.unknownStream} unknown stream, ${skipped.badCategory} bad category, ` +
      `${skipped.overlapDupe} overlap duplicates`,
  );

  if (!commit) {
    console.log('\nDRY RUN — nothing written. Re-run with --commit to load.');
    const sample = rows.slice(0, 3);
    for (const r of sample) {
      console.log(`  [${r.corpus}/${r.category}] ${r.claim.slice(0, 70)}`);
      console.log(`     "${r.quote.slice(0, 80)}" @ ${r.tStart.toFixed(0)}s`);
    }
    return 0;
  }

  let inserted = 0;
  let existing = 0;
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    // skipDuplicates makes this idempotent against the anchor unique index, and
    // means a re-run never clobbers a review verdict already recorded on a row.
    const res = await db.knowledgeClaim.createMany({ data: slice, skipDuplicates: true });
    inserted += res.count;
    existing += slice.length - res.count;
    process.stdout.write(`\r  loading… ${i + slice.length}/${rows.length}`);
  }
  console.log(
    `\n\nInserted ${inserted} new claims. ${existing} already present (idempotent skip).`,
  );

  const total = await db.knowledgeClaim.count();
  const byCorpus = await db.knowledgeClaim.groupBy({
    by: ['corpus'],
    _count: { _all: true },
  });
  console.log(`\nbask.knowledge_claim now holds ${total} rows:`);
  for (const c of byCorpus) console.log(`  ${c.corpus.padEnd(22)} ${c._count._all}`);
  return 0;
}

main()
  .then((code) => db.$disconnect().then(() => process.exit(code)))
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
