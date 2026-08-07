/**
 * Salon scoping for RLS.
 *
 * Every `salon_isolation` policy written in migration `20260807000001_bask_rls`
 * reads `bask.current_salon_id()`, which returns the `app.salon_id` session GUC.
 * The GUC is NULL unless something sets it, and a NULL scope matches no rows — so
 * an unscoped connection sees nothing rather than everything.
 *
 * `SET LOCAL` is transaction-scoped, which is the only safe form on a pgbouncer
 * transaction pooler: the setting dies with the transaction instead of leaking to
 * whichever request reuses the backend next.
 *
 * M0–M2 caveat: the demo connects as the Supabase `postgres` role, which carries
 * BYPASSRLS, so policies do not actually gate these queries yet. Calling this
 * helper is still correct — it is what makes the switch to a restricted role in M3
 * a config change rather than an audit of every query.
 */

import type { PrismaClient } from '../generated/prisma/client';

/** The subset of the client available inside a scoped transaction. */
export type ScopedDb = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

/**
 * Runs `fn` inside a transaction whose `app.salon_id` GUC is pinned to `salonId`,
 * so RLS-protected reads and writes resolve to exactly that salon.
 */
export async function withSalonScope<T>(
  client: PrismaClient,
  salonId: string,
  fn: (tx: ScopedDb) => Promise<T>,
): Promise<T> {
  return client.$transaction(async (tx) => {
    // set_config(..., is_local => true) is SET LOCAL with a bindable parameter.
    await tx.$executeRaw`select set_config('app.salon_id', ${salonId}, true)`;
    return fn(tx);
  });
}

/** Reads the GUC back — used by tests and the /dev/api harness to prove scoping. */
export async function readSalonScope(tx: ScopedDb): Promise<string | null> {
  const rows = await tx.$queryRaw<{ salon_id: string | null }[]>`
    select nullif(current_setting('app.salon_id', true), '') as salon_id
  `;
  return rows[0]?.salon_id ?? null;
}
