/**
 * tRPC request context — salon scope + role.
 *
 * Shape adapted from CompPortal's `src/server/trpc.ts` Context + its
 * `src/app/api/trpc/[trpc]/route.ts` context builder (tenant resolved per request,
 * role read from a profile, both nullable and both carried on ctx). Adapted, not
 * imported: CompPortal resolves tenant from a subdomain and role from Supabase
 * auth; Bask M0 resolves salon from a slug and role from the Presenter Panel,
 * because auth is an explicit non-goal until M3.
 *
 * Resolution order, most explicit first:
 *   role  — `x-bask-role` header → `?role=` query param → `owner`
 *   salon — `x-bask-salon` header → `?salon=` query param → the only/first salon
 *           in the database → null
 *
 * The fallback to "first salon" is what makes the demo work before anyone picks
 * one: M0–M2 run a single seeded tenant (Sunset Ridge). It is deliberately a
 * fallback, not a default — every procedure still reads `ctx.salonId`.
 */

import { db, type PrismaClient, type ScopedDb, withSalonScope } from '@bask/db';

import { type DemoRole, parseDemoRole, ROLE_HEADER, SALON_HEADER } from './roles';

export { ROLE_HEADER, SALON_HEADER };

export interface Context {
  /** Active demo role. Never null — an unrecognised value falls back to `owner`. */
  role: DemoRole;
  /** Salon in scope, or null when the database has no salons seeded yet. */
  salonId: string | null;
  salonSlug: string | null;
  /** Prisma client. See `runScoped` before using it on RLS-protected tables. */
  db: PrismaClient;
  /**
   * Runs a callback inside a transaction with the `app.salon_id` GUC set, so RLS
   * `salon_isolation` policies resolve. Throws when no salon is in scope.
   *
   * M0–M2 connect as the Supabase `postgres` role, which carries BYPASSRLS, so
   * `ctx.db` reads are currently unfiltered — the demo dataset is one tenant, so
   * nothing leaks. Routers that touch tenant tables should still go through
   * `runScoped` so the M3 switch to a restricted role is a config change rather
   * than an audit of every query (packages/db/README.md).
   */
  runScoped<T>(fn: (tx: ScopedDb) => Promise<T>): Promise<T>;
}

export interface CreateContextOptions {
  headers: Headers;
  /** Full request URL — query params are the Presenter Panel's transport. */
  url: string;
}

function readParam(options: CreateContextOptions, header: string, param: string): string | null {
  const fromHeader = options.headers.get(header);
  if (fromHeader) return fromHeader;
  try {
    return new URL(options.url).searchParams.get(param);
  } catch {
    return null;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve `?salon=` by slug OR id — but only ask Postgres about `id` when the
 * value could actually BE one.
 *
 * M1 lane 5 fix: the original `{ OR: [{ slug }, { id }] }` sent the raw string to
 * a `uuid` column, and Postgres does not shrug at that — it aborts the whole
 * query with `invalid input syntax for type uuid`. So every `?salon=<slug>` link
 * 500'd, including the ones the consent demo depends on. The OR was right; the
 * unguarded cast was not.
 */
function salonWhere(value: string) {
  return UUID.test(value) ? { OR: [{ slug: value }, { id: value }] } : { slug: value };
}

export async function createContext(options: CreateContextOptions): Promise<Context> {
  const role = parseDemoRole(readParam(options, ROLE_HEADER, 'role'));
  const requestedSalon = readParam(options, SALON_HEADER, 'salon');

  const salon = requestedSalon
    ? await db.salon.findFirst({
        where: salonWhere(requestedSalon),
        select: { id: true, slug: true },
      })
    : await db.salon.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true, slug: true },
      });

  const salonId = salon?.id ?? null;

  return {
    role,
    salonId,
    salonSlug: salon?.slug ?? null,
    db,
    runScoped: <T,>(fn: (tx: ScopedDb) => Promise<T>): Promise<T> => {
      if (!salonId) {
        throw new Error(
          'runScoped called with no salon in scope — guard the procedure with salonProcedure',
        );
      }
      return withSalonScope(db, salonId, fn);
    },
  };
}
