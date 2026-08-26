/**
 * ETL orchestrator — UVALUX practice dataset → Bask (bask schema).
 *
 * SUPERVISOR-OWNED. The local mappers are pure CSV→shape functions; the write
 * into the shared CC&SS database is deliberately kept here, behind two gates:
 *
 *   - DRY RUN by default: every insert runs inside ONE interactive transaction
 *     that is rolled back. This validates FK integrity, enum values and required
 *     fields against the real schema and persists NOTHING.
 *   - INGEST_CONFIRM=yes commits. The target is a NEW Org + six NEW Salons
 *     (deterministic new UUIDs). It never touches the demo tenant or any other
 *     product's rows. Announced at startup.
 *
 *   DATA_DIR=<canonical dir> tsx run.ts              # dry run
 *   DATA_DIR=<canonical dir> INGEST_CONFIRM=yes tsx run.ts   # commit
 *
 * Note: a `demo:reset` truncates bask and would remove this load. Grade right
 * after loading; do not run a reset in between.
 */
import * as path from 'node:path';

import { db } from '@bask/db';

import {
  readCsv,
  remapId,
} from './contract';
import { mapOrg, mapSalons } from './map-salons';
import { mapStaff } from './map-staff';
import { mapProducts } from './map-products';
import { mapInventory } from './map-inventory';
import { mapCustomers } from './map-customers';
import { mapMemberships } from './map-memberships';
import { mapVisits } from './map-visits';
import { mapSales, mapSaleLines } from './map-transactions';

const DATA_DIR = process.env.DATA_DIR;
if (!DATA_DIR) {
  console.error('DATA_DIR required (the canonical/ directory) — no default.');
  process.exit(1);
}
const CONFIRM = process.env.INGEST_CONFIRM === 'yes';
// Dataset end date; drives customer recency status. Overridable because the
// SalonTouch file ends in 2020, not 2026, and a wrong as-of makes every
// customer read inactive.
const AS_OF = new Date(process.env.INGEST_AS_OF || '2026-06-30');
const BATCH = 5000;

const csv = (name: string) => readCsv(path.join(DATA_DIR, `${name}.csv`));

async function chunkedCreate<T>(label: string, rows: T[], create: (batch: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += BATCH) {
    await create(rows.slice(i, i + BATCH) as T[]);
  }
  console.log(`  ${label}: ${rows.length}`);
}

async function main() {
  /* The org key MUST come from the same place `mapOrg`/`mapSalons` read it.
     This line hardcoded 'uvalux-practice' while map-salons.ts honoured
     INGEST_ORG_SLUG, so overriding the slug produced two different org ids in
     one run: the banner announced the practice org while the rows were built
     for another, and — much worse — the INGEST_WIPE branch below deletes
     `where: { id: orgId }`, so wiping before loading a SECOND dataset would
     have deleted the PRACTICE org and left the incoming one's org row alone.
     One source of truth, and the banner now names the dataset it is loading. */
  const orgKey = process.env.INGEST_ORG_SLUG || 'uvalux-practice';
  const orgId = remapId('org', orgKey);
  console.log(`\n=== ETL: ${orgKey} → bask ===`);
  console.log(`mode: ${CONFIRM ? 'COMMIT' : 'DRY RUN (rollback)'} | target Org ${orgId} (${orgKey}) | source ${DATA_DIR}`);

  // ---- read + map (pure) ----
  const org = mapOrg();
  const salons = mapSalons(csv('salons'));
  const staff = mapStaff(csv('staff'));
  const products = mapProducts(csv('products'));
  const inventory = mapInventory(csv('inventory_snapshots'));
  const visitsRaw = csv('visits');
  const customers = mapCustomers(csv('customers'), visitsRaw, AS_OF);
  const memberships = mapMemberships(csv('memberships'), csv('membership_payments'));
  const visits = mapVisits(visitsRaw);
  const txRaw = csv('transactions');
  const sales = mapSales(txRaw);
  const saleLines = mapSaleLines(csv('transaction_items'), txRaw);

  console.log('\nmapped rows:');
  console.log(`  salons ${salons.length} · staff ${staff.length} · products ${products.length} · inventory ${inventory.length}`);
  console.log(`  customers ${customers.length} · memberships ${memberships.length} · visits ${visits.length}`);
  console.log(`  sales ${sales.length} · saleLines ${saleLines.length}`);

  const load = async (tx: typeof db) => {
    await tx.org.create({ data: org as never });
    await chunkedCreate('salons', salons, (b) => tx.salon.createMany({ data: b as never[], skipDuplicates: true }));
    await chunkedCreate('staff', staff, (b) => tx.staff.createMany({ data: b as never[], skipDuplicates: true }));
    await chunkedCreate('products', products, (b) => tx.product.createMany({ data: b as never[], skipDuplicates: true }));
    await chunkedCreate('customers', customers, (b) => tx.customer.createMany({ data: b as never[], skipDuplicates: true }));
    await chunkedCreate('inventory', inventory, (b) => tx.inventoryLevel.createMany({ data: b as never[], skipDuplicates: true }));
    await chunkedCreate('memberships', memberships, (b) => tx.membership.createMany({ data: b as never[], skipDuplicates: true }));
    await chunkedCreate('visits', visits, (b) => tx.visit.createMany({ data: b as never[], skipDuplicates: true }));
    await chunkedCreate('sales', sales, (b) => tx.sale.createMany({ data: b as never[], skipDuplicates: true }));
    await chunkedCreate('saleLines', saleLines, (b) => tx.saleLine.createMany({ data: b as never[], skipDuplicates: true }));
  };

  // INGEST_WIPE=yes clears THIS org's tenant first (deterministic ids +
  // skipDuplicates would otherwise skip corrected rows on a re-load).
  if (CONFIRM && process.env.INGEST_WIPE === 'yes') {
    const salonIds = salons.map((s) => s.id);
    console.log(`\nwiping tenant (${salonIds.length} salons) before reload…`);
    await db.saleLine.deleteMany({ where: { salonId: { in: salonIds } } });
    await db.sale.deleteMany({ where: { salonId: { in: salonIds } } });
    await db.visit.deleteMany({ where: { salonId: { in: salonIds } } });
    await db.membership.deleteMany({ where: { salonId: { in: salonIds } } });
    await db.inventoryLevel.deleteMany({ where: { salonId: { in: salonIds } } });
    await db.customer.deleteMany({ where: { salonId: { in: salonIds } } });
    await db.staff.deleteMany({ where: { salonId: { in: salonIds } } });
    await db.salon.deleteMany({ where: { id: { in: salonIds } } });
    await db.org.deleteMany({ where: { id: orgId } });
    console.log('  wiped.');
  }

  const ROLLBACK = Symbol('rollback');
  try {
    await db.$transaction(
      async (tx) => {
        console.log(`\n${CONFIRM ? 'inserting' : 'validating (will roll back)'}:`);
        await load(tx as unknown as typeof db);
        if (!CONFIRM) throw ROLLBACK;
      },
      { timeout: 600_000, maxWait: 30_000 },
    );
    console.log(`\nCOMMITTED. Org ${orgId} + ${salons.length} salons loaded into bask.`);
  } catch (e) {
    if (e === ROLLBACK) {
      console.log('\nDRY RUN OK — every row validated against the schema, nothing persisted.');
      console.log('Re-run with INGEST_CONFIRM=yes to commit.');
    } else {
      console.error('\nVALIDATION FAILED:', e instanceof Error ? e.message : e);
      process.exitCode = 1;
    }
  } finally {
    await db.$disconnect();
  }
}

main();
