/**
 * `pnpm --filter @bask/db consent:backfill` — give every salon an EXPLICIT
 * consent profile, so what UVALUX may see is stated rather than inferred.
 *
 * WHY THIS EXISTS
 * On 2026-08-26 a live count found 22 salons and 12 `bask.consent_profile`
 * rows. The 10 without one were every `salontouch-real` salon (4) and every
 * `uvalux-practice` salon (6) — i.e. the REAL field data. Five read sites
 * turned that missing row into `'benchmarks'` via `?? 'benchmarks'`, so real
 * customer data was being treated as opted in to network benchmarking on the
 * strength of a row that does not exist. Nobody chose that. That is the bug.
 *
 * The read side is now fail-closed (`resolveConsentTier` /
 * `DEFAULT_CONSENT_TIER` in `packages/core/src/consent/index.ts`). This script
 * is the other half: an absent row and a deliberate `private` row read the same
 * today, but only one of them survives someone re-adding a default later, and
 * only one of them can be shown to a salon as an answer.
 *
 * THE TIER IT WRITES: `private`, the CLOSED end of the scale.
 * A salon that has never been asked has never said yes. `private` means the
 * salon contributes nothing to cohorts and Compass sees name + region +
 * equipment only — the facts UVALUX already has from selling to them. Anything
 * more permissive would be this script inventing consent, which is the exact
 * failure it was written to end. Salons move UP from here by choosing to, on
 * their own "What UVALUX sees" screen.
 *
 * SAFETY — this is a SHARED Supabase database (`bask` schema, alongside 574
 * tables belonging to other products):
 *   - INSERTs into `bask.consent_profile` only. No DDL, no migration, no
 *     schema change, no deletes, no updates.
 *   - IDEMPOTENT: `createMany` + `skipDuplicates` against a `@unique` salon_id.
 *     A salon that already has a profile is left ALONE — including the one
 *     salon already set to `private` and the eleven set to `benchmarks` or
 *     `coaching`. Existing answers are answers; this script only fills silence.
 *   - `--dry-run` prints the plan and writes nothing. Run that first.
 *
 * NOT COVERED, and it needs a human: `ConsentProfile.tier` still carries
 * `@default(benchmarks)` at the column level (schema.prisma:1009). That default
 * only fires on an INSERT that omits the tier — this script always names it, so
 * it cannot bite here — but flipping it to `private` would need a migration,
 * which is out of scope for this lane. Flagged, not done.
 */

import { CONSENT_TIERS, DEFAULT_CONSENT_TIER } from '@bask/core';

import { db } from '../src/index';

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * The tier a salon with no recorded answer gets. Read from `@bask/core` rather
 * than written here, so the row this script inserts and the value the readers
 * fall back to cannot drift apart.
 */
const BACKFILL_TIER = DEFAULT_CONSENT_TIER;

async function main() {
  if (!CONSENT_TIERS.includes(BACKFILL_TIER)) {
    throw new Error(`"${BACKFILL_TIER}" is not a consent tier — refusing to write.`);
  }

  const salons = await db.salon.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      org: { select: { slug: true, name: true } },
      consentProfile: { select: { tier: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const missing = salons.filter((salon) => salon.consentProfile === null);

  console.log(`salons:            ${salons.length}`);
  console.log(`with a profile:    ${salons.length - missing.length}`);
  console.log(`missing a profile: ${missing.length}`);

  const existingByTier = new Map<string, number>();
  for (const salon of salons) {
    if (!salon.consentProfile) continue;
    const tier = salon.consentProfile.tier;
    existingByTier.set(tier, (existingByTier.get(tier) ?? 0) + 1);
  }
  for (const tier of CONSENT_TIERS) {
    console.log(`  already ${tier.padEnd(11)} ${existingByTier.get(tier) ?? 0}`);
  }

  if (missing.length === 0) {
    console.log('\nNothing to do — every salon already has an explicit answer.');
    return;
  }

  console.log(`\nWould write tier="${BACKFILL_TIER}" for:`);
  for (const salon of missing) {
    console.log(`  ${salon.slug.padEnd(18)} ${salon.name}  [${salon.org?.slug ?? 'no org'}]`);
  }

  if (DRY_RUN) {
    console.log('\n--dry-run: nothing written.');
    return;
  }

  // `skipDuplicates` against the `@unique` salon_id is what makes a re-run a
  // no-op rather than a crash — and what makes a concurrent run harmless.
  const result = await db.consentProfile.createMany({
    data: missing.map((salon) => ({ salonId: salon.id, tier: BACKFILL_TIER })),
    skipDuplicates: true,
  });

  const after = await db.consentProfile.count();
  const total = await db.salon.count();
  console.log(`\ninserted:          ${result.count}`);
  console.log(`consent profiles:  ${after} / ${total} salons`);

  if (after !== total) {
    throw new Error(
      `Backfill incomplete: ${total - after} salon(s) still have no consent profile.`,
    );
  }
  console.log('Every salon now has an explicit consent answer.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
