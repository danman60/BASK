/**
 * `pnpm --filter @bask/db salontouch:sweep` — run the PRODUCTION detector sweep
 * over the real SalonTouch field data and persist what it finds.
 *
 * WHY THIS EXISTS
 * `packages/db/scripts/salon-ingest/etl/grade-run.ts:83` already ran the real
 * `buildFacts` + `runInsightSweep` against loaded salons — and then only
 * `console.log`-ed the result (`:85`, `:96-99`). Nothing was ever written to
 * `bask.insight`. Its salon list (`:27`) is also hardwired to the practice
 * dataset's `SAL001–SAL006`, so it never looked at SalonTouch at all. A live
 * count on 2026-08-26 found `bask.insight` holding 5 rows, every one of them
 * Sunset Ridge's; the four SalonTouch salons had 0.
 *
 * This runs the same production code path and PERSISTS, using the pipeline's
 * own writer rather than a second one.
 *
 * ------------------------------------------------------------------------
 * THE REFERENCE DATE — stated, not smuggled
 * ------------------------------------------------------------------------
 * SalonTouch visit history ends **2020-03-14** (Salons A/B/C) and **2019-07-14**
 * (Salon D). The demo clock is **2026-08-08**. Every detector window in
 * `buildFacts` is `today`-relative and half-open — `[today-14, today)`,
 * `[today-42, today-14)`, `[today-28, today)`, `[today-30, today)`
 * (`packages/db/src/facts.ts:176-179`) — and `buildSalonFacts` only loads the
 * 95 days before `today` (`packages/db/src/ports.ts:319`). Run against the demo
 * clock, every window lands in 2026, six years past the last row, and the whole
 * sweep sees an empty salon.
 *
 * DECISION: each salon is swept at **the day after its own last visit** —
 * A/B/C at 2020-03-15, D at 2019-07-15 — so all four windows sit inside that
 * salon's real data. Per-salon rather than one global date, because Salon D's
 * data stops eight months before the others' and a shared date would grade it
 * against eight months of silence it did not actually have.
 *
 * The dates are NOT mapped forward. Shifting 2020 timestamps into 2026 would
 * make every insight look current when it describes a salon's last weeks of
 * trading in early 2020, and nothing downstream would carry the correction.
 *
 * EVERY ROW THIS WRITES SAYS SO. `linkedActionRef.referenceDate`,
 * `.referenceDateRationale` and `.dataset` are stamped on each persisted
 * insight, and `insight.for_date` is the 2020/2019 reference date — not today.
 * An insight generated against a 2020 reference date reads as a 2020 insight
 * everywhere it is displayed.
 *
 * `--as-of-clock` re-runs against the demo clock instead, for comparison. It is
 * a MEASUREMENT aid — it exists so the date decision above is evidence rather
 * than assertion — and it refuses to write.
 *
 * ------------------------------------------------------------------------
 * WHAT CAN AND CANNOT FIRE — verified against the loaded rows, not assumed
 * ------------------------------------------------------------------------
 * `ALL_DETECTORS` is exactly six (`packages/core/src/insights/detectors.ts:704`).
 * Live counts for all four SalonTouch salons, 2026-08-26:
 *
 *   product 0 · inventory_level 0 · room 0 · service 0 · **sale_line 0**
 *   membership.payment_state ∈ {current} only (0 failed)
 *   sale 53,839 · visit 194,672 · customer 20,179 · membership 13,225 · staff 122
 *
 * The first two zeros were known and are by design. **`sale_line` = 0 was not,
 * and it is the finding that matters here**: the ETL loaded 53,839 sale HEADERS
 * with no line items behind any of them (verified two ways — org join and
 * explicit salon-id list — both 0, against 73,471 sale_line rows elsewhere in
 * the schema). Four of the six detectors read `saleLines`, so this is a bigger
 * constraint on detector yield than the date gap is.
 *
 * That is REPORTED, not patched. Manufacturing line items to make detectors
 * fire would be inventing the exact data the run is supposed to measure.
 *
 * ------------------------------------------------------------------------
 * SAFETY — shared Supabase database (`bask` schema, beside 574 other tables)
 * ------------------------------------------------------------------------
 *   - Writes `bask.insight` only, through the pipeline's own `upsertInsights`
 *     (`packages/db/src/ports.ts:367`). No DDL, no migration, no truncation.
 *   - HARD-SCOPED to org `salontouch-real`. The salon list is read from that
 *     org and nothing else is touched. This matters: `upsertInsights`
 *     auto-resolves any `state:'new'` insight for a salon whose `dedupeKey` is
 *     absent from the draft set it is handed, salon-wide — pointing it at
 *     Sunset Ridge with a partial draft list would dismiss the five insights
 *     the pitch depends on. It is never pointed there.
 *   - IDEMPOTENT by construction: `upsertInsights` keys on
 *     `linkedActionRef.dedupeKey`, updating in place and never resetting
 *     `state`, so re-running does not duplicate rows or resurrect dismissals.
 *   - `--dry-run` runs the full sweep and prints everything, writes nothing.
 *   - Row counts printed BEFORE and AFTER.
 *
 *   pnpm --filter @bask/db salontouch:sweep -- --dry-run
 *   pnpm --filter @bask/db salontouch:sweep
 *   pnpm --filter @bask/db salontouch:sweep -- --as-of-clock --dry-run
 */

import { runInsightSweep } from '@bask/core';

import { createPrismaClient } from '../src/client';
import { createPrismaPipelinePorts } from '../src/ports';
import { DEFAULT_SEED } from '../fixtures/constants';

const DRY_RUN = process.argv.includes('--dry-run');
const AS_OF_CLOCK = process.argv.includes('--as-of-clock');

const ORG_SLUG = 'salontouch-real';

/** The six detectors in `ALL_DETECTORS`, and the row a detector needs to exist. */
const DETECTORS = [
  { type: 'retail_attachment_slip', needs: 'sale_line rows carrying a product_id' },
  { type: 'failed_payments', needs: "membership rows with payment_state = 'failed'" },
  { type: 'soft_capacity', needs: 'active room rows' },
  { type: 'low_stock', needs: 'product AND inventory_level rows' },
  { type: 'overstock', needs: 'product AND inventory_level rows' },
  { type: 'anomaly_band', needs: 'sale_line rows carrying a service_id, plus service rows' },
] as const;

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysIso(date: Date, days: number): string {
  return iso(new Date(date.getTime() + days * 86_400_000));
}

async function main() {
  console.log(`\n=== SalonTouch detector sweep — ${DRY_RUN || AS_OF_CLOCK ? 'DRY RUN (writes nothing)' : 'COMMIT'} ===`);
  console.log(`org: ${ORG_SLUG} (hard-scoped)\n`);

  const prisma = createPrismaClient({ direct: true });

  try {
    const org = await prisma.org.findUnique({ where: { slug: ORG_SLUG }, select: { id: true } });
    if (!org) throw new Error(`No org "${ORG_SLUG}" — refusing to guess another.`);

    const salons = await prisma.salon.findMany({
      where: { orgId: org.id },
      select: { id: true, name: true, slug: true, timezone: true },
      orderBy: { name: 'asc' },
    });
    if (salons.length === 0) throw new Error(`Org "${ORG_SLUG}" has no salons.`);

    const salonIds = salons.map((s) => s.id);

    const before = await prisma.insight.count({ where: { salonId: { in: salonIds } } });
    const beforeAll = await prisma.insight.count();
    console.log(`BEFORE: ${before} insight rows for the ${salons.length} SalonTouch salons`);
    console.log(`BEFORE: ${beforeAll} insight rows in bask.insight overall\n`);

    // The demo clock, only ever used for the comparison pass.
    const state = await prisma.demoState.findUnique({
      where: { id: 'default' },
      select: { virtualToday: true, seed: true },
    });
    const clockToday = state ? iso(state.virtualToday) : null;

    const ports = createPrismaPipelinePorts(prisma, { seed: state?.seed ?? DEFAULT_SEED });

    // ---- the substrate every detector reads, counted per salon --------------
    console.log('--- loaded rows per salon (what the detectors have to work with) ---');
    const substrate = new Map<string, Record<string, number>>();
    for (const salon of salons) {
      const [visits, sales, saleLines, linesWithProduct, linesWithService, products, inventory, rooms, services, memberships, failedMemberships, staff, customers] =
        await Promise.all([
          prisma.visit.count({ where: { salonId: salon.id } }),
          prisma.sale.count({ where: { salonId: salon.id } }),
          prisma.saleLine.count({ where: { salonId: salon.id } }),
          prisma.saleLine.count({ where: { salonId: salon.id, productId: { not: null } } }),
          prisma.saleLine.count({ where: { salonId: salon.id, serviceId: { not: null } } }),
          prisma.product.count({ where: { salonId: salon.id } }),
          prisma.inventoryLevel.count({ where: { salonId: salon.id } }),
          prisma.room.count({ where: { salonId: salon.id } }),
          prisma.service.count({ where: { salonId: salon.id } }),
          prisma.membership.count({ where: { salonId: salon.id } }),
          prisma.membership.count({ where: { salonId: salon.id, paymentState: 'failed' } }),
          prisma.staff.count({ where: { salonId: salon.id } }),
          prisma.customer.count({ where: { salonId: salon.id } }),
        ]);
      const counts = { visits, sales, saleLines, linesWithProduct, linesWithService, products, inventory, rooms, services, memberships, failedMemberships, staff, customers };
      substrate.set(salon.id, counts);
      console.log(
        `  ${salon.name}: visits ${visits} · sales ${sales} · sale_lines ${saleLines} ` +
          `(product ${linesWithProduct}, service ${linesWithService}) · products ${products} · ` +
          `inventory ${inventory} · rooms ${rooms} · services ${services} · ` +
          `memberships ${memberships} (failed ${failedMemberships}) · staff ${staff} · customers ${customers}`,
      );
    }

    // ---- sweep ------------------------------------------------------------
    console.log('\n--- running the production sweep (buildFacts + runInsightSweep) ---');

    const yieldByType = new Map<string, number>();
    for (const d of DETECTORS) yieldByType.set(d.type, 0);
    let totalDrafts = 0;
    let created = 0;
    let updated = 0;

    for (const salon of salons) {
      const lastVisit = await prisma.visit.findFirst({
        where: { salonId: salon.id },
        orderBy: { checkedInAt: 'desc' },
        select: { checkedInAt: true },
      });

      let today: string;
      let rationale: string;

      if (AS_OF_CLOCK) {
        if (!clockToday) {
          console.error('  ! no demo_state row — cannot run the --as-of-clock comparison.');
          continue;
        }
        today = clockToday;
        rationale = 'demo clock (bask.demo_state.virtual_today) — COMPARISON PASS ONLY';
      } else if (!lastVisit) {
        console.error(`  ! ${salon.name} has no visits — no defensible reference date. Skipping.`);
        continue;
      } else {
        today = addDaysIso(lastVisit.checkedInAt, 1);
        rationale =
          `day after this salon's own last visit (${iso(lastVisit.checkedInAt)}), so every ` +
          'detector window sits inside its real data';
      }

      const facts = await ports.buildSalonFacts(
        {
          id: salon.id,
          name: salon.name,
          ownerFirstName: '',
          currency: 'CAD',
          timezone: salon.timezone,
          isHero: false,
        },
        today,
      );

      // `maxInsights: 50` + `allDrafts` so nothing is silently truncated — the
      // pipeline's default cap of 5 is a UI decision, not a measurement one.
      const sweep = runInsightSweep(facts, { maxInsights: 50 });
      const drafts = sweep.allDrafts;
      totalDrafts += drafts.length;

      const types = [...new Set(drafts.map((d) => d.type))];
      console.log(
        `\n  ${salon.name} @ ${today}  →  ${drafts.length} insight(s)` +
          (types.length ? ` [${types.join(', ')}]` : ''),
      );
      console.log(`    reference date: ${rationale}`);
      console.log(
        `    facts: attachment ${facts.attachment.currentRate.toFixed(2)}% over ` +
          `${facts.attachment.currentVisits} visits (baseline ${facts.attachment.baselineRate.toFixed(2)}% / ` +
          `${facts.attachment.baselineVisits}) · failed memberships ${facts.failedPayments.memberships.length} · ` +
          `capacity slots ${facts.capacity.slots.length} (rooms ${facts.capacity.roomCount}) · ` +
          `stock products ${facts.stock.length} · category trends ${facts.categoryTrends.length}`,
      );

      for (const draft of drafts) {
        yieldByType.set(draft.type, (yieldByType.get(draft.type) ?? 0) + 1);
        console.log(
          `      - ${draft.type}/${draft.severity} "${draft.title}" ` +
            `(${draft.impactCurrency} ${Math.round(draft.impactEstimate)})`,
        );
      }

      if (drafts.length === 0) continue;

      /**
       * Stamp the provenance onto each draft before persisting. `linkedActionRef`
       * is the only free-form column on `bask.insight` that survives the writer
       * (`ports.ts:392` merges it and adds `dedupeKey`), so it is where the
       * reference date has to live for a reader to ever see it.
       */
      const stamped = drafts.map((draft) => ({
        ...draft,
        linkedActionRef: {
          ...draft.linkedActionRef,
          dataset: 'salontouch-real',
          referenceDate: today,
          referenceDateRationale: rationale,
          referenceDateIsHistorical: !AS_OF_CLOCK,
          sweptAt: new Date().toISOString(),
        },
      }));

      if (!DRY_RUN && !AS_OF_CLOCK) {
        const result = await ports.upsertInsights(
          {
            id: salon.id,
            name: salon.name,
            ownerFirstName: '',
            currency: 'CAD',
            timezone: salon.timezone,
            isHero: false,
          },
          today,
          stamped,
        );
        created += result.created;
        updated += result.updated;
        console.log(
          `      persisted: ${result.created} created, ${result.updated} updated, ${result.resolved} resolved`,
        );
      }
    }

    // ---- per-detector scorecard -------------------------------------------
    console.log('\n--- per-detector yield across all four salons ---');
    for (const detector of DETECTORS) {
      const count = yieldByType.get(detector.type) ?? 0;
      if (count > 0) {
        console.log(`  ${detector.type}: ${count}`);
        continue;
      }
      // Say WHY it found nothing, from the counted substrate rather than a guess.
      const missing = salons.filter((s) => {
        const c = substrate.get(s.id)!;
        switch (detector.type) {
          case 'retail_attachment_slip':
            return c.linesWithProduct === 0;
          case 'failed_payments':
            return c.failedMemberships === 0;
          case 'soft_capacity':
            return c.rooms === 0;
          case 'low_stock':
          case 'overstock':
            return c.products === 0 || c.inventory === 0;
          case 'anomaly_band':
            return c.linesWithService === 0 || c.services === 0;
          default:
            return false;
        }
      });
      const reason =
        missing.length === salons.length
          ? `no ${detector.needs} exist for ANY of the ${salons.length} salons — structurally cannot fire`
          : missing.length > 0
            ? `${missing.length}/${salons.length} salons have no ${detector.needs}; the rest were below threshold`
            : `every salon has ${detector.needs}, so this is a genuine below-threshold result`;
      console.log(`  ${detector.type}: 0 — ${reason}`);
    }

    const after = await prisma.insight.count({ where: { salonId: { in: salonIds } } });
    const afterAll = await prisma.insight.count();

    console.log(`\ntotal drafts produced: ${totalDrafts}`);
    console.log(`AFTER:  ${after} insight rows for the SalonTouch salons (${DRY_RUN || AS_OF_CLOCK ? 'unchanged — dry run' : `+${after - before}`})`);
    console.log(`AFTER:  ${afterAll} insight rows in bask.insight overall (was ${beforeAll})`);
    if (!DRY_RUN && !AS_OF_CLOCK) console.log(`written: ${created} created, ${updated} updated`);
    if (AS_OF_CLOCK) console.log('\n(--as-of-clock is a comparison pass and never writes.)');
  } finally {
    await prisma.$disconnect();
  }
}

await main();
