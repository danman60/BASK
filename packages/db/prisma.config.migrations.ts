import path from 'node:path';

import { defineConfig, env } from 'prisma/config';

try {
  process.loadEnvFile(path.join(import.meta.dirname, '.env'));
} catch {
  // no local .env — rely on the ambient environment
}

/**
 * MIGRATION-AUTHORING config. Used only to *generate* SQL (`prisma migrate diff`),
 * never to apply it.
 *
 * The difference from `prisma.config.ts` is deliberate and load-bearing: the URLs
 * here are stripped of the `?schema=bask` parameter. With that param present
 * Prisma treats `bask` as the connection's implicit default schema and emits
 * unqualified DDL (`CREATE TABLE "org"`), which on this SHARED CC&SS database
 * would create tables in whatever schema search_path resolves to — `public`,
 * alongside 570+ tables belonging to other live apps.
 *
 * Without the param Prisma fully qualifies every statement (`CREATE TABLE
 * "bask"."org"`), which is correct no matter what search_path is set to. That is
 * the only form allowed to be committed under `prisma/migrations/`.
 *
 * Any new migration MUST be generated through this config and MUST be checked
 * (`scripts/assert-bask-scoped.mjs`) before it is applied.
 */
const stripSchemaParam = (url: string): string =>
  url.replace(/([?&])schema=[^&]*&?/g, '$1').replace(/[?&]$/, '');

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    url: stripSchemaParam(env('DIRECT_DATABASE_URL')),
  },
});
