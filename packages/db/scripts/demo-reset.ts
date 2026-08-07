/**
 * `pnpm demo:reset` — regenerate the demo dataset to day zero.
 *
 * Deletes and reseeds **bask data only**. This runs against the shared CC&SS
 * database, which also hosts CommandCentered, StudioSync, CoverWise and 574
 * `public` tables belonging to other live apps. Everything below goes through
 * the Prisma client scoped to `bask` models — there is no raw SQL, no TRUNCATE
 * and no CASCADE anywhere in this file, by design.
 *
 * Flags:
 *   --seed <s>   override the fixture seed (default: `sunset-ridge-v1`)
 *   --yes        skip the confirmation prompt (for CI)
 *   --quiet      only print the summary
 */

import { createPrismaClient } from '../src/client';
import { checksumBundle, generateFixtures, totalRows } from '../fixtures/index';
import { DEFAULT_SEED } from '../fixtures/constants';
import type { FixtureBundle } from '../fixtures/types';

const args = process.argv.slice(2);
const seedIndex = args.indexOf('--seed');
const seed = seedIndex >= 0 ? (args[seedIndex + 1] ?? DEFAULT_SEED) : DEFAULT_SEED;
const quiet = args.includes('--quiet');

const log = (message: string) => {
  if (!quiet) console.log(message);
};

/**
 * Delete order — children before parents.
 *
 * Most FKs cascade, but relying on cascade order across 30-odd tables is how a
 * reset starts failing intermittently. Explicit order is boring and reliable.
 */
const DELETE_ORDER = [
  'daybreakBrief',
  // Floor-owned tables (M1 lane 2). Not fixture data — the app creates these —
  // but they hang off customer/room/salon, so a reset that leaves them behind
  // leaves bookings pointing at nothing. Listed explicitly for the reason at the
  // top of this block: the cascades would cover it, and relying on cascade order
  // is how a reset starts failing intermittently.
  'shiftHandoff',
  'waiverSignature',
  'booking',
  'saleLine',
  'sale',
  'session',
  'visit',
  'stockEvent',
  'inventoryLevel',
  'package',
  'membership',
  'giftCard',
  'campaign',
  'insight',
  'activityEvent',
  'contactLog',
  'coachingRequest',
  'signalSnapshot',
  'draftOrderLine',
  'draftOrder',
  'consentAuditEntry',
  'consentProfile',
  'account',
  'customer',
  'equipmentDevice',
  'room',
  'service',
  'barcode',
  'product',
  'uvaluxCatalogItem',
  'staff',
  'salon',
  'org',
  'playbook',
  'segment',
  'roomType',
  'demoState',
] as const;

/**
 * Insert order — lookups, then tenancy, then everything that references them.
 * Chunked because a single 10k-row `createMany` exceeds the statement size the
 * pooler will accept.
 */
const INSERT_PLAN: Array<{ model: string; table: keyof FixtureBundle }> = [
  { model: 'roomType', table: 'roomTypes' },
  { model: 'segment', table: 'segments' },
  { model: 'playbook', table: 'playbooks' },
  { model: 'uvaluxCatalogItem', table: 'uvaluxCatalogItems' },
  { model: 'org', table: 'orgs' },
  { model: 'salon', table: 'salons' },
  { model: 'staff', table: 'staff' },
  { model: 'product', table: 'products' },
  { model: 'barcode', table: 'barcodes' },
  { model: 'room', table: 'rooms' },
  { model: 'equipmentDevice', table: 'equipmentDevices' },
  { model: 'service', table: 'services' },
  { model: 'customer', table: 'customers' },
  { model: 'membership', table: 'memberships' },
  { model: 'package', table: 'packages' },
  { model: 'visit', table: 'visits' },
  { model: 'session', table: 'sessions' },
  { model: 'sale', table: 'sales' },
  { model: 'saleLine', table: 'saleLines' },
  { model: 'inventoryLevel', table: 'inventoryLevels' },
  { model: 'stockEvent', table: 'stockEvents' },
  { model: 'account', table: 'accounts' },
  { model: 'campaign', table: 'campaigns' },
  { model: 'giftCard', table: 'giftCards' },
  { model: 'consentProfile', table: 'consentProfiles' },
  { model: 'consentAuditEntry', table: 'consentAuditEntries' },
  { model: 'draftOrder', table: 'draftOrders' },
  { model: 'draftOrderLine', table: 'draftOrderLines' },
  { model: 'signalSnapshot', table: 'signalSnapshots' },
  { model: 'coachingRequest', table: 'coachingRequests' },
  { model: 'contactLog', table: 'contactLogs' },
  { model: 'activityEvent', table: 'activityEvents' },
  { model: 'demoState', table: 'demoState' },
];

const CHUNK = 500;

async function main(): Promise<void> {
  const startedAt = Date.now();
  // Session pooler: bulk inserts and long transactions, not pgbouncer.
  const prisma = createPrismaClient({ direct: true });

  try {
    log(`Generating fixtures (seed: ${seed})…`);
    const bundle = generateFixtures({ seed });
    const checksum = checksumBundle(bundle);
    log(`  ${totalRows(bundle)} rows, checksum ${checksum.slice(0, 16)}…`);

    log('Clearing bask data…');
    for (const model of DELETE_ORDER) {
      const delegate = (prisma as unknown as Record<string, { deleteMany: () => Promise<{ count: number }> }>)[
        model
      ];
      if (!delegate) throw new Error(`Unknown Prisma model in DELETE_ORDER: ${model}`);
      const { count } = await delegate.deleteMany();
      if (count > 0) log(`  - ${model}: ${count}`);
    }

    log('Seeding…');
    for (const step of INSERT_PLAN) {
      const rows = bundle[step.table] as unknown[];
      if (rows.length === 0) continue;
      const delegate = (
        prisma as unknown as Record<
          string,
          { createMany: (args: { data: unknown[] }) => Promise<{ count: number }> }
        >
      )[step.model];
      if (!delegate) throw new Error(`Unknown Prisma model in INSERT_PLAN: ${step.model}`);
      for (let i = 0; i < rows.length; i += CHUNK) {
        await delegate.createMany({ data: rows.slice(i, i + CHUNK) });
      }
      log(`  + ${step.model}: ${rows.length}`);
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log('');
    console.log(`  demo:reset complete in ${elapsed}s`);
    console.log(`  seed      ${seed}`);
    console.log(`  day zero  ${bundle.demoState[0]!.virtualToday.toISOString().slice(0, 10)}`);
    console.log(`  rows      ${totalRows(bundle)}`);
    console.log(`  checksum  ${checksum}`);
    console.log('');
    console.log('  Next: pnpm demo:advance --days 5   (settles the Tuesday campaign)');
  } finally {
    await prisma.$disconnect();
  }
}

await main();
