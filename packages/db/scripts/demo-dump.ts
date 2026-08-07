/**
 * `pnpm demo:dump` — canonical dump of every `bask` row, for determinism proofs.
 *
 * `demo:checksum` proves the *generator* is deterministic. This proves the
 * property that actually matters: that two `demo:reset` runs leave the database
 * in byte-identical states. Run it either side of a reset and diff.
 *
 *   pnpm demo:reset --quiet && pnpm demo:dump > /tmp/a.json
 *   pnpm demo:reset --quiet && pnpm demo:dump > /tmp/b.json
 *   diff /tmp/a.json /tmp/b.json && echo IDENTICAL
 *
 * Flags:
 *   --summary   per-table row counts + hashes instead of the full dump
 */

import { createHash } from 'node:crypto';

import { createPrismaClient } from '../src/client';

const summaryOnly = process.argv.includes('--summary');

/** Every bask model, in a fixed order. */
const MODELS = [
  'roomType',
  'segment',
  'playbook',
  'uvaluxCatalogItem',
  'org',
  'salon',
  'staff',
  'product',
  'barcode',
  'room',
  'equipmentDevice',
  'service',
  'customer',
  'membership',
  'package',
  'visit',
  'session',
  'sale',
  'saleLine',
  'inventoryLevel',
  'stockEvent',
  'insight',
  'campaign',
  'giftCard',
  'consentProfile',
  'consentAuditEntry',
  'draftOrder',
  'draftOrderLine',
  'account',
  'signalSnapshot',
  'coachingRequest',
  'contactLog',
  'daybreakBrief',
  'demoState',
] as const;

/**
 * Columns excluded from the dump.
 *
 * `activity_event` is skipped wholesale and these columns are dropped because
 * they record *when the pipeline ran*, not what the dataset contains. Including
 * them would make every dump differ and the determinism check meaningless — the
 * fixtures set every other timestamp explicitly for exactly this reason.
 */
const VOLATILE_COLUMNS = new Set(['lastAdvancedAt', 'lastPipelineRunAt']);

/** Lookup tables key on `key`, not `id`. Ordering has to match the real PK. */
const KEYED_BY_KEY = new Set(['roomType', 'segment', 'playbook']);

function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      if (VOLATILE_COLUMNS.has(key)) continue;
      out[key] = canonical((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  // Prisma Decimals stringify stably; numbers do not always round-trip.
  if (typeof value === 'object' && value !== null) return String(value);
  return value;
}

async function main(): Promise<void> {
  const prisma = createPrismaClient({ direct: true });
  try {
    const dump: Record<string, unknown[]> = {};
    const summary: Array<{ model: string; rows: number; sha256: string }> = [];

    for (const model of MODELS) {
      const delegate = (
        prisma as unknown as Record<
          string,
          { findMany: (args: { orderBy: unknown }) => Promise<unknown[]> }
        >
      )[model];
      if (!delegate) continue;
      // Ordered by primary key so row order is a property of the data rather
      // than of whatever plan Postgres happened to pick.
      const orderBy = KEYED_BY_KEY.has(model) ? { key: 'asc' } : { id: 'asc' };
      const rows = (await delegate.findMany({ orderBy })).map(canonical);
      dump[model] = rows;
      summary.push({
        model,
        rows: rows.length,
        sha256: createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 16),
      });
    }

    if (summaryOnly) {
      const width = Math.max(...summary.map((s) => s.model.length));
      let total = 0;
      for (const s of summary) {
        total += s.rows;
        console.log(`  ${s.model.padEnd(width)}  ${String(s.rows).padStart(6)}  ${s.sha256}`);
      }
      console.log('');
      console.log(`  total rows: ${total}`);
      console.log(
        `  dump sha256: ${createHash('sha256').update(JSON.stringify(dump)).digest('hex')}`,
      );
    } else {
      console.log(JSON.stringify(dump, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

await main();
