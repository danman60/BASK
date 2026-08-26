/**
 * `pnpm --filter @bask/db compass:signals` — give every Compass account a
 * `bask.signal_snapshot`, so Act 2 of the pitch never opens a blank account.
 *
 * WHY THIS EXISTS
 * A live count on 2026-08-26 found 12 `bask.account` rows and 8
 * `bask.signal_snapshot` rows. The four without one were Glasswing, Saltspray,
 * Rivière Lumière and — worst of all — **Sunset Ridge**, the hero salon whose
 * draft order is supposed to land on its account timeline in Beat 6
 * (`docs/pitch/PITCH.md:63`). That is the Act 1 → Act 2 handoff.
 *
 * It is worse than a missing headline. `buildCallCard`
 * (`packages/api/src/routers/compass.ts:338`) only marks an account `rankable`
 * when it has a signal headline, a SUBMITTED draft order, or an open coaching
 * request. Sunset Ridge has none of those — its one draft order is still in
 * `draft` state, because the presenter submits it live during Beat 3 — so the
 * account at the centre of the demo does not appear on the rep's call list at
 * all until the moment it is sent. A snapshot fixes that.
 *
 * ------------------------------------------------------------------------
 * DERIVED vs SEEDED — read this before quoting any number on stage
 * ------------------------------------------------------------------------
 * `sunset-ridge` is DERIVED. It is the only Compass account with Bask
 *   operational rows behind it (8,591 visits · 8,591 sales · 420 customers),
 *   so its snapshot is computed from those rows at run time by
 *   `deriveSunsetRidge()` below, and cross-checked against the production
 *   detector output already sitting in `bask.insight` for the same salon.
 *   `evidence.source = 'derived_from_bask_rows'` and `evidence.provenance`
 *   records the exact windows and row counts the percentages came from.
 *
 * `glasswing`, `saltspray`, `riviere-lumiere` are SEEDED. These salons have
 *   ZERO visits, sales, customers, products and inventory rows — there is
 *   nothing to derive from, and this script will not manufacture a number and
 *   dress it as a measurement. Their snapshots are fixture content in exactly
 *   the register of the other eight (`packages/db/fixtures/portfolio.ts`),
 *   carrying `evidence.source = 'portfolio_rollup'` and an explicit
 *   `evidence.provenance = 'seeded_fixture'` so any reader can tell them apart
 *   from the derived one at a glance.
 *
 * WHY RIVIÈRE LUMIÈRE GETS ONE AT ALL
 * `portfolio.ts:118` sets `signal: null` for it deliberately — it is the
 * Private-tier account that proves the consent filter works (Beat 7). Giving it
 * a snapshot does not weaken that beat, it STRENGTHENS it: `packages/core/consent`
 * grants the `signals` bundle to the `coaching` tier only (`index.ts:104-106`),
 * so a Private account's signal is stripped by the FILTER rather than being
 * absent from the database. "Compass visibly loses detail" is a claim about a
 * filter; it needs detail to lose. Verify after running: the account must still
 * render identity-only at `/compass/accounts/riviere-lumiere`.
 *
 * WHAT THIS SCRIPT DELIBERATELY DOES **NOT** DO — the duplicate-salon question
 * "Maple Glow Tanning" and "Northern Sun Wellness" each appear twice in
 * `bask.salon`: once in their own Compass org with no operational rows, once in
 * `uvalux-practice` as `sal001`/`sal002` with ~8.7k visits each. This script
 * does NOT repoint the `account.salon_id` at the populated twin, and does not
 * merge them. Four verified reasons:
 *
 *   1. They are DIFFERENT BUSINESSES that share a name, not two records of one.
 *      Compass Maple Glow is in Burlington ON; practice SAL001 is in London ON,
 *      opened 2018-04-16 (`tmp-salon-data/.../canonical/salons.csv:2`). Compass
 *      Northern Sun is Grande Prairie AB (territory "Alberta"); practice SAL002
 *      is Kitchener ON.
 *   2. Repointing would make Beat 6 render LESS, not more. Every
 *      `uvalux-practice` salon sits at consent tier `private`, and `private`
 *      grants the `identity` bundle only — the signal, the coaching requests and
 *      the draft orders would all be stripped. The account would go from a
 *      hand-seeded headline to a name and a region.
 *   3. The practice dataset's own answer key contradicts the Beat 6 line. SAL001
 *      is annotated "Stable mid-market salon; one late-period inventory reorder
 *      signal" — there is no 17% retail decline in it. Pointing the "retail down
 *      17%" headline at those rows would be fabrication wearing a citation.
 *   4. Merging means moving ~8.7k visits, 750 customers and their sales across
 *      orgs, which corrupts the evaluation dataset the detector grading depends
 *      on (`packages/db/scripts/salon-ingest/etl/grade-run.ts`).
 *
 * And the premise itself does not hold operationally: Compass loads its
 * portfolio with `account.findMany` (`compass.ts:497`), and the practice salons
 * have no `account` row, so they are unreachable from Compass. Nobody can
 * "open the empty one" — there is only one Maple Glow the demo can reach. The
 * collision is a naming coincidence between a demo fixture and an eval dataset;
 * it is a readability problem for engineers, not a demo defect. Renaming the
 * practice salons would falsify a field that came from the vendor CSV, so that
 * is flagged for a human rather than done here.
 *
 * SAFETY — this is a SHARED Supabase database (`bask` schema, alongside 574
 * tables belonging to other products):
 *   - INSERTs into `bask.signal_snapshot` only. No DDL, no migration, no schema
 *     change, no deletes, no updates, no truncation.
 *   - IDEMPOTENT. `bask.signal_snapshot` has no unique constraint to lean on, so
 *     re-runnability is enforced by an explicit pre-read: an account that already
 *     has ANY snapshot is skipped untouched. Existing rows are answers; this
 *     script only fills silence. Re-running it is a no-op.
 *   - `--dry-run` prints the full plan, the derived arithmetic and the
 *     before/after counts, and writes nothing. Run that first.
 *   - Row counts are printed BEFORE and AFTER every write.
 *
 *   pnpm --filter @bask/db compass:signals -- --dry-run
 *   pnpm --filter @bask/db compass:signals
 */

import { db } from '../src/index';

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * The seven signal types the Compass UI can actually render
 * (`packages/core/src/compass/derive.ts:256-262`). This is a CLOSED set: an
 * eighth type would fall through every switch in `deriveAccountView` and render
 * an account card with no headline, no evidence tiles and no suggested play.
 * Asserted at run time so a typo fails loudly instead of shipping a blank card.
 */
const RENDERABLE_SIGNAL_TYPES = new Set([
  'retail_decline',
  'expansion_ready',
  'onboarding_stalled',
  'reorder_due',
  'membership_churn',
  'account_dormant',
  'multi_location_lift',
]);

type Severity = 'info' | 'low' | 'medium' | 'high';

interface Plan {
  salonSlug: string;
  signalType: string;
  severity: Severity;
  headline: string;
  metrics: Record<string, unknown>;
  evidence: Record<string, unknown>;
  forDate: string;
}

/** Day zero for the seeded fixture set — the `for_date` the other eight carry. */
const DAY_ZERO = '2026-08-06';

/**
 * The three salons with no operational rows to derive anything from.
 *
 * Every number here is FIXTURE CONTENT, in the same register as the eight in
 * `packages/db/fixtures/portfolio.ts`, and is marked as such in `evidence`.
 * Each one's character is taken from the account row that already exists —
 * lifecycle, health score and consent tier — so the card does not contradict
 * itself (a health-81 `established` account does not get a dormancy crisis).
 */
const SEEDED: Plan[] = [
  {
    // health 81 · established · coaching tier · AWV $52,700 · open 58 months.
    // The mildest real reason a rep would call a healthy account.
    salonSlug: 'glasswing',
    signalType: 'reorder_due',
    severity: 'low',
    headline: 'Lotion reorder is running about three weeks late',
    metrics: { daysSinceLastOrder: 69, typicalCadenceDays: 48 },
    evidence: { source: 'portfolio_rollup', consentTier: 'coaching', provenance: 'seeded_fixture' },
    forDate: DAY_ZERO,
  },
  {
    // health 79 · established · coaching tier · AWV $44,100 · open 63 months.
    salonSlug: 'saltspray',
    signalType: 'membership_churn',
    severity: 'low',
    headline: 'A few more memberships lapsed than usual last month',
    metrics: { churnPercent: 7, monthsRising: 1 },
    evidence: { source: 'portfolio_rollup', consentTier: 'coaching', provenance: 'seeded_fixture' },
    forDate: DAY_ZERO,
  },
  {
    // health 72 · established · PRIVATE tier. Present in the database, stripped
    // by the consent filter before it reaches any Compass screen. See the header.
    salonSlug: 'riviere-lumiere',
    signalType: 'reorder_due',
    severity: 'low',
    headline: 'Usual bronzer reorder is a month overdue',
    metrics: { daysSinceLastOrder: 74, typicalCadenceDays: 45 },
    evidence: {
      source: 'portfolio_rollup',
      consentTier: 'private',
      provenance: 'seeded_fixture',
      note: 'Private tier — the consent filter strips this before it renders. It exists so Beat 7 has detail to visibly lose.',
    },
    forDate: DAY_ZERO,
  },
];

const SUNSET_RIDGE_SLUG = 'sunset-ridge';

/** An 8-week window pair ending at the demo clock. */
interface Window {
  label: string;
  from: Date;
  to: Date;
}

function daysBefore(anchor: Date, days: number): Date {
  return new Date(anchor.getTime() - days * 86_400_000);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Sunset Ridge's snapshot, COMPUTED from its own rows.
 *
 * The metric is retail dollars PER VISIT, not gross retail dollars, and the
 * distinction matters enough to spell out: over the last eight weeks Sunset
 * Ridge's gross retail is UP (the fixture ramps traffic), while retail per visit
 * is DOWN. Gross would say "this account is growing"; per-visit says "they are
 * selling less to each person who walks in", which is the same thing the
 * production detector found when it wrote the `retail_attachment_slip` insight
 * that the owner reads on Daybreak in Beat 1. Quoting gross here would put
 * Compass and Bask in contradiction on stage.
 *
 * `reorderGapDays` is deliberately ABSENT. Sunset Ridge's only draft order is
 * still in `draft` state and has never been submitted, so "days since their last
 * order" has no value — not zero, no value. `deriveAccountView` only renders a
 * tile for a metric that exists (`derive.ts:400-402`: "padding a row with a
 * made-up figure is the one thing this must not do"), so omitting it costs a
 * tile and keeps the card honest.
 */
async function deriveSunsetRidge(): Promise<Plan | null> {
  const salon = await db.salon.findUnique({
    where: { slug: SUNSET_RIDGE_SLUG },
    select: { id: true, name: true },
  });
  if (!salon) {
    console.error(`  ! no salon "${SUNSET_RIDGE_SLUG}" — cannot derive. Skipping.`);
    return null;
  }

  // The demo clock, never the wall clock. `virtual_today` is the "now" every
  // other Bask surface reasons against; deriving against real time would date
  // the snapshot two years into the future of the fixture data.
  const state = await db.demoState.findUnique({
    where: { id: 'default' },
    select: { virtualToday: true },
  });
  if (!state) {
    console.error('  ! no demo_state row — refusing to guess a reference date. Skipping.');
    return null;
  }
  const today = state.virtualToday;

  const WEEKS = 8;
  const span = WEEKS * 7;
  const recent: Window = { label: 'recent', from: daysBefore(today, span), to: today };
  const prior: Window = {
    label: 'prior',
    from: daysBefore(today, span * 2),
    to: daysBefore(today, span),
  };

  async function measure(w: Window) {
    const [visits, retail] = await Promise.all([
      db.visit.count({
        where: { salonId: salon!.id, checkedInAt: { gte: w.from, lt: w.to } },
      }),
      db.saleLine.aggregate({
        _sum: { lineTotal: true },
        where: {
          salonId: salon!.id,
          productId: { not: null },
          soldAt: { gte: w.from, lt: w.to },
        },
      }),
    ]);
    const retailTotal = Number(retail._sum.lineTotal ?? 0);
    return { visits, retailTotal, perVisit: visits > 0 ? retailTotal / visits : 0 };
  }

  const [now, before] = await Promise.all([measure(recent), measure(prior)]);

  if (before.visits === 0 || now.visits === 0 || before.perVisit === 0) {
    console.error('  ! not enough Sunset Ridge history to derive a change. Skipping.');
    return null;
  }

  const changePercent = round1(((now.perVisit - before.perVisit) / before.perVisit) * 100);

  /**
   * Severity from the magnitude of the derived move, using the same banding the
   * rest of the portfolio already implies: Maple Glow's -17% is `high`, Aurora
   * Beltline's -9% is `medium`. Anything shallower than 5 points is `low`.
   * Deriving the band from the number keeps the ranking honest — it is not tuned
   * so a particular account lands first on the call list.
   */
  const magnitude = Math.abs(changePercent);
  const severity: Severity = magnitude >= 15 ? 'high' : magnitude >= 5 ? 'medium' : 'low';

  // Corroboration, not the source: the production detector's own verdict for
  // the same salon and the same clock, recorded so the two can be compared.
  const detectorInsight = await db.insight.findFirst({
    where: { salonId: salon.id, type: 'retail_attachment_slip' },
    orderBy: { forDate: 'desc' },
    select: { title: true, summary: true, severity: true, forDate: true, impactEstimate: true },
  });

  if (changePercent >= 0) {
    console.error(
      `  ! Sunset Ridge retail per visit is ${changePercent}% (not a decline). Refusing to ` +
        'write a "retail_decline" headline over a number that does not say that. Skipping.',
    );
    return null;
  }

  const iso = (d: Date) => d.toISOString().slice(0, 10);

  return {
    salonSlug: SUNSET_RIDGE_SLUG,
    signalType: 'retail_decline',
    severity,
    headline: `Selling less to each visitor — retail per visit down ${Math.abs(changePercent)}% over ${WEEKS} weeks`,
    metrics: { retailChangePercent: changePercent, windowWeeks: WEEKS },
    evidence: {
      source: 'derived_from_bask_rows',
      provenance: 'derived',
      consentTier: 'coaching',
      measure: 'retail_dollars_per_visit',
      referenceDate: iso(today),
      referenceDateSource: 'bask.demo_state.virtual_today',
      windows: {
        recent: { from: iso(recent.from), to: iso(recent.to), visits: now.visits, retail: now.retailTotal, perVisit: round1(now.perVisit * 100) / 100 },
        prior: { from: iso(prior.from), to: iso(prior.to), visits: before.visits, retail: before.retailTotal, perVisit: round1(before.perVisit * 100) / 100 },
      },
      note:
        'Gross retail over the same window is UP; retail PER VISIT is down. The per-visit ' +
        'reading is the one that matches the salon-side detector.',
      corroboratedBy: detectorInsight
        ? {
            table: 'bask.insight',
            type: 'retail_attachment_slip',
            title: detectorInsight.title,
            summary: detectorInsight.summary,
            severity: detectorInsight.severity,
            forDate: detectorInsight.forDate.toISOString().slice(0, 10),
            impactEstimate: Number(detectorInsight.impactEstimate ?? 0),
          }
        : null,
    },
    forDate: iso(today),
  };
}

async function main() {
  console.log(`\n=== compass signal snapshots — ${DRY_RUN ? 'DRY RUN (writes nothing)' : 'COMMIT'} ===`);
  console.log('target: bask.signal_snapshot (INSERT only, no DDL, no updates, no deletes)\n');

  const before = await db.signalSnapshot.count();
  const accountCount = await db.account.count();
  console.log(`BEFORE: ${before} signal_snapshot rows across ${accountCount} accounts`);

  const derived = await deriveSunsetRidge();
  const plans: Plan[] = [...(derived ? [derived] : []), ...SEEDED];

  for (const plan of plans) {
    if (!RENDERABLE_SIGNAL_TYPES.has(plan.signalType)) {
      throw new Error(
        `"${plan.signalType}" is not a signal type the Compass UI can render — refusing to write ` +
          'a snapshot that would produce a blank account card.',
      );
    }
  }

  const written: string[] = [];
  const skipped: string[] = [];

  for (const plan of plans) {
    const account = await db.account.findFirst({
      where: { salon: { slug: plan.salonSlug } },
      select: { id: true, salonId: true, salon: { select: { name: true } } },
    });
    if (!account) {
      console.error(`  ! no account for salon "${plan.salonSlug}" — skipping.`);
      skipped.push(`${plan.salonSlug} (no account row)`);
      continue;
    }

    // Idempotence gate. No unique constraint exists on signal_snapshot, so
    // re-runnability is this read, not an upsert.
    const existing = await db.signalSnapshot.count({ where: { accountId: account.id } });
    if (existing > 0) {
      console.log(`  = ${plan.salonSlug}: already has ${existing} snapshot(s) — left alone.`);
      skipped.push(`${plan.salonSlug} (already had ${existing})`);
      continue;
    }

    const tag = plan.evidence.provenance === 'derived' ? 'DERIVED' : 'seeded ';
    console.log(
      `  + ${plan.salonSlug} [${tag}] ${plan.signalType}/${plan.severity} — "${plan.headline}"`,
    );
    console.log(`      metrics: ${JSON.stringify(plan.metrics)}`);
    if (plan.evidence.provenance === 'derived') {
      console.log(`      evidence: ${JSON.stringify(plan.evidence, null, 2).split('\n').join('\n      ')}`);
    }

    if (!DRY_RUN) {
      await db.signalSnapshot.create({
        data: {
          accountId: account.id,
          salonId: account.salonId,
          signalType: plan.signalType,
          severity: plan.severity,
          headline: plan.headline,
          metrics: plan.metrics as object,
          evidence: plan.evidence as object,
          forDate: new Date(`${plan.forDate}T00:00:00Z`),
        },
      });
    }
    written.push(plan.salonSlug);
  }

  const after = await db.signalSnapshot.count();
  const accountsWithout = await db.account.count({ where: { signalSnapshots: { none: {} } } });

  console.log(`\nAFTER:  ${after} signal_snapshot rows (${DRY_RUN ? 'unchanged — dry run' : `+${after - before}`})`);
  console.log(`written: ${written.length ? written.join(', ') : 'none'}`);
  console.log(`skipped: ${skipped.length ? skipped.join(', ') : 'none'}`);
  console.log(`accounts still WITHOUT a snapshot: ${accountsWithout}${DRY_RUN ? ' (dry run — nothing written yet)' : ''}`);

  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
