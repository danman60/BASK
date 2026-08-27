/**
 * Backfill bask.sale_line for an already-loaded ETL tenant.
 *
 * WHY THIS EXISTS (2026-08-27). The SalonTouch load left `bask.sale_line` at 0
 * rows for org `salontouch-real` while every other table landed: 4 salons,
 * 53,839 sales, 194,672 visits, 673 products — all present, all with matching
 * deterministic ids. The mappers and `run.ts` were both verified correct
 * against the canonical CSVs (59,787 lines out, 0 dangling FKs), so re-running
 * the full loader would re-validate 194k visits through the pooler to insert
 * one missing table. This inserts only the missing table.
 *
 * The likely loss mechanism is `run.ts`'s INGEST_WIPE block: those deleteMany
 * calls run OUTSIDE the transaction, on `db` rather than `tx`, so each one
 * commits on its own. `saleLine.deleteMany` is FIRST in that list. A wipe that
 * timed out through the pgbouncer pooler on a later, larger delete would leave
 * sale_line already committed-deleted while everything after it survived —
 * exactly the state observed. "Rolled back cleanly, all rows intact" did not
 * cover it, because there was no transaction to roll back.
 *
 * SAFE TO RE-RUN. Inserts only; never deletes. `skipDuplicates` plus
 * deterministic ids make it idempotent — a second run inserts 0.
 *
 *   DATA_DIR=~/salon-pull/canonical tsx backfill-sale-lines.ts               # dry run
 *   DATA_DIR=~/salon-pull/canonical INGEST_CONFIRM=yes tsx backfill-sale-lines.ts
 *
 * Env matches run.ts: INGEST_NS (default 'uvalux-practice-2026' — the
 * SalonTouch tenant was loaded on the DEFAULT, not the 'salontouch-2026' that
 * docs/DIRECTIVE.md claims), INGEST_ORG_SLUG.
 */
import * as path from 'node:path';

import { db } from '@bask/db';

import { readCsv, remapId } from './etl/contract';
import { mapSaleLines } from './etl/map-transactions';

const DATA_DIR = process.env.DATA_DIR;
if (!DATA_DIR) {
  console.error('DATA_DIR required (the canonical/ directory) — no default.');
  process.exit(1);
}
const CONFIRM = process.env.INGEST_CONFIRM === 'yes';
const ORG_KEY = process.env.INGEST_ORG_SLUG || 'uvalux-practice';
const BATCH = 5000;

const csv = (name: string) => readCsv(path.join(DATA_DIR, `${name}.csv`));

async function main() {
  const orgId = remapId('org', ORG_KEY);
  console.log(`\n=== backfill sale_line: ${ORG_KEY} ===`);
  console.log(`mode: ${CONFIRM ? 'COMMIT' : 'DRY RUN (no write)'} | org ${orgId} | source ${DATA_DIR}`);

  const org = await db.org.findUnique({ where: { id: orgId }, select: { slug: true } });
  if (!org) {
    console.error(`\nNo org ${orgId} (${ORG_KEY}) in bask. Wrong INGEST_NS/INGEST_ORG_SLUG — refusing.`);
    process.exitCode = 1;
    return;
  }

  const lines = mapSaleLines(csv('transaction_items'), csv('transactions'));
  console.log(`\nmapped sale lines: ${lines.length} (${lines.filter((l) => l.productId).length} retail)`);

  /* Every FK is checked against what is actually in the database before a
     single row is written. A createMany that trips an FK aborts its whole
     batch, and a half-written table is worse than an empty one. */
  const [salonIds, saleIds, customerIds, productIds] = await Promise.all([
    db.salon.findMany({ where: { orgId }, select: { id: true } }).then((r) => new Set(r.map((x) => x.id))),
    db.sale.findMany({ where: { salon: { orgId } }, select: { id: true } }).then((r) => new Set(r.map((x) => x.id))),
    db.customer.findMany({ where: { salon: { orgId } }, select: { id: true } }).then((r) => new Set(r.map((x) => x.id))),
    db.product.findMany({ select: { id: true } }).then((r) => new Set(r.map((x) => x.id))),
  ]);

  const bad = {
    salon: lines.filter((l) => !salonIds.has(l.salonId)).length,
    sale: lines.filter((l) => !saleIds.has(l.saleId)).length,
    customer: lines.filter((l) => l.customerId && !customerIds.has(l.customerId)).length,
    product: lines.filter((l) => l.productId && !productIds.has(l.productId)).length,
  };
  console.log(`fk check vs live db — dangling salon ${bad.salon} · sale ${bad.sale} · customer ${bad.customer} · product ${bad.product}`);

  /* A dangling customer/product is nullable and survives insert as NULL, but it
     is silent data loss on the exact columns the retail surfaces read, so it
     stops the run too. Fix the upstream load rather than import a hole. */
  const total = bad.salon + bad.sale + bad.customer + bad.product;
  if (total > 0) {
    console.error(`\n${total} rows reference something that is not in the database. Refusing to write.`);
    process.exitCode = 1;
    return;
  }

  const before = await db.saleLine.count({ where: { salon: { orgId } } });
  console.log(`sale_line rows for this org right now: ${before}`);

  if (!CONFIRM) {
    console.log('\nDRY RUN OK — every FK resolves. Re-run with INGEST_CONFIRM=yes to write.');
    return;
  }

  /* Deliberately NOT one interactive transaction: 12 batches of 5,000 through
     the pgbouncer pooler is what times out. Each batch commits alone, and
     skipDuplicates + deterministic ids make a resumed run pick up where it
     stopped rather than double-insert. */
  let written = 0;
  for (let i = 0; i < lines.length; i += BATCH) {
    const batch = lines.slice(i, i + BATCH);
    const res = await db.saleLine.createMany({ data: batch as never[], skipDuplicates: true });
    written += res.count;
    console.log(`  batch ${i / BATCH + 1}: +${res.count} (${written} total)`);
  }

  const after = await db.saleLine.count({ where: { salon: { orgId } } });
  console.log(`\nDONE. sale_line for ${ORG_KEY}: ${before} → ${after} (inserted ${written}).`);
}

main()
  .catch((e) => {
    console.error('\nFAILED:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
