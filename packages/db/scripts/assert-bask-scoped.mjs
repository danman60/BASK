#!/usr/bin/env node
/**
 * Safety gate for the SHARED CC&SS Supabase project.
 *
 * Bask lives in one dedicated Postgres schema (`bask`) on a database that also
 * hosts 570+ `public` tables belonging to other live apps. A single unqualified
 * `CREATE TABLE "customer"` in a migration would land in `public` and collide
 * with someone else's product.
 *
 * This script fails the build if any committed migration contains DDL that is
 * not explicitly qualified to "bask", or that references another app's schema.
 *
 * Run: node scripts/assert-bask-scoped.mjs   (wired to `pnpm db:check`)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'prisma',
  'migrations',
);

/**
 * Other tenants of the shared CC&SS database. Naming any of these in a Bask
 * migration is always a bug — we never read or write another app's data.
 * `"org"."id"` style table-qualified column refs are legal, so we cannot detect
 * foreign schemas by shape; we match this explicit list instead.
 */
const FOREIGN_SCHEMAS = [
  'public',
  'commandcentered',
  'coverwise',
  'inkandoracle',
  'libretto',
  'poolparty',
  'studiosync',
  'auth',
  'storage',
  'realtime',
  'vault',
  'supabase_migrations',
];
const FOREIGN_REF = new RegExp(`"?(${FOREIGN_SCHEMAS.join('|')})"?\\s*\\.\\s*"?[a-z_]`, 'i');

/** Statements allowed to be unqualified — they name the schema themselves. */
const SCHEMA_LEVEL = /^\s*(CREATE|ALTER)\s+SCHEMA\s+/i;
/** Session-level settings that carry no object of their own. */
const SESSION_LEVEL = /^\s*(SET|COMMENT\s+ON\s+SCHEMA|GRANT|REVOKE)\b/i;
/** Any DDL that creates or changes a database object. */
const DDL = /^\s*(CREATE|ALTER)\b/i;

const collectSqlFiles = (dir) => {
  let out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(collectSqlFiles(full));
    else if (entry.endsWith('.sql')) out.push(full);
  }
  return out;
};

let files = [];
try {
  files = collectSqlFiles(MIGRATIONS_DIR);
} catch {
  console.error(`No migrations directory at ${MIGRATIONS_DIR}`);
  process.exit(1);
}

const violations = [];

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const loc = `${path.relative(MIGRATIONS_DIR, file)}:${i + 1}`;

    // Referencing another app's schema is always wrong.
    if (FOREIGN_REF.test(line)) {
      violations.push(`${loc}  references a foreign schema: ${line.trim()}`);
    }

    if (!DDL.test(line)) return;
    if (SCHEMA_LEVEL.test(line) || SESSION_LEVEL.test(line)) return;
    if (line.includes('"bask".')) return;

    violations.push(`${loc}  unqualified DDL (must target "bask"): ${line.trim()}`);
  });
}

if (violations.length > 0) {
  console.error(
    `\nMigration scope check FAILED — ${violations.length} statement(s) could ` +
      `write outside the "bask" schema on the shared CC&SS database:\n`,
  );
  for (const v of violations) console.error(`  ${v}`);
  console.error(
    '\nRegenerate with `pnpm db:migration:new` (prisma.config.migrations.ts), ' +
      'which emits fully-qualified DDL.\n',
  );
  process.exit(1);
}

console.log(
  `Migration scope check passed — ${files.length} file(s), all DDL scoped to "bask".`,
);
