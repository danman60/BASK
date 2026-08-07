/**
 * `pnpm demo:checksum` — generate the fixture bundle twice in one process and
 * prove the two runs are byte-identical.
 *
 * This is the fast determinism check. `demo:dump` proves the same property
 * against what actually landed in Postgres, which is the one that counts; this
 * one tells you within a second whether the generator itself drifted.
 *
 *   --json   machine-readable output for CI
 *   --seed   override the fixture seed
 */

import { checksumBundle, checksumByTable, generateFixtures, totalRows } from '../fixtures/index';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const seedIndex = args.indexOf('--seed');
const seed = seedIndex >= 0 ? args[seedIndex + 1] : undefined;

const first = generateFixtures({ seed });
const second = generateFixtures({ seed });

const checksumA = checksumBundle(first);
const checksumB = checksumBundle(second);
const identical = checksumA === checksumB;

if (asJson) {
  console.log(
    JSON.stringify(
      { identical, checksum: checksumA, rows: totalRows(first), tables: checksumByTable(first) },
      null,
      2,
    ),
  );
} else {
  const tables = checksumByTable(first);
  const width = Math.max(...Object.keys(tables).map((k) => k.length));
  for (const [table, info] of Object.entries(tables)) {
    console.log(`  ${table.padEnd(width)}  ${String(info.rows).padStart(6)}  ${info.sha256}`);
  }
  console.log('');
  console.log(`  total rows : ${totalRows(first)}`);
  console.log(`  run 1      : ${checksumA}`);
  console.log(`  run 2      : ${checksumB}`);
  console.log(
    `  ${identical ? 'IDENTICAL — generator is deterministic' : 'DRIFT — generator is NOT deterministic'}`,
  );
}

if (!identical) {
  // Show the first table that diverged so the cause is findable.
  const a = checksumByTable(first);
  const b = checksumByTable(second);
  for (const table of Object.keys(a)) {
    if (a[table]!.sha256 !== b[table]!.sha256) {
      console.error(`\nFirst divergent table: ${table}`);
      break;
    }
  }
  process.exit(1);
}
