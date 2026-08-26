/**
 * `tsx scripts/health-distribution.ts` — the tuning instrument for the customer
 * health monitor. READ-ONLY: it opens the demo salon's customers, scores every
 * one of them with `computeCustomerHealth`, and prints where they land.
 *
 * This exists because the weights in `packages/core/src/health/customer-health.ts`
 * are a PROPOSAL. Nobody should approve a band cut-off in the abstract — you
 * approve it by looking at which real customers fall into which band and asking
 * whether a salon owner would agree. Run this before changing a constant, and
 * again after.
 *
 * Writes nothing. Safe to run against the shared demo database at any time.
 */

import {
  BANDS,
  BASELINE,
  TUNING,
  computeCustomerHealth,
  healthReason,
  resolveClock,
  type BaselineKind,
  type CustomerHealth,
} from '@bask/core';
import { db } from '../src/index';

const BAND_ORDER = ['healthy', 'slipping', 'lapsed'] as const;
/** Visits older than this cannot affect the score (decay is 45d) — but we pull
 *  a wider window so staleness and "usually buys" have something to work with. */
const VISIT_WINDOW_DAYS = 180;

async function main() {
  // Pick the salon that actually HAS customers. The eleven Compass portfolio
  // salons are rollup-only and carry zero — ordering by createdAt lands on one
  // of them and reports "no customers", which is the same no-salon-fallback
  // trap that made every Bask surface point at Ironwood during the M1 merge.
  const salons = await db.salon.findMany({
    select: { id: true, name: true, slug: true, _count: { select: { customers: true } } },
  });

  // `--salon <slug>` because "the salon with the most customers" is no longer
  // the salon anyone is looking at: the ETL-ingested tenants are the biggest and
  // their visit history stops in 2020, which makes every customer read as
  // never-visited regardless of what the scorer does.
  const wantSlug = process.argv[process.argv.indexOf('--salon') + 1];
  const salon = process.argv.includes('--salon')
    ? salons.find((s) => s.slug === wantSlug || s.name === wantSlug)
    : salons.sort((a, b) => b._count.customers - a._count.customers)[0];
  if (!salon) {
    throw new Error(`No salon matching "${wantSlug}". Slugs: ${salons.map((s) => s.slug).join(', ')}`);
  }
  if (salon._count.customers === 0) {
    throw new Error('No salon with customers — run `pnpm demo:reset` first.');
  }

  const demoState = await db.demoState.findFirst({ select: { virtualToday: true } });
  const clock = resolveClock(demoState ?? { virtualToday: null });
  const now = clock.now();

  const since = new Date(now.getTime() - VISIT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const customers = await db.customer.findMany({
    where: { salonId: salon.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      lastVisitAt: true,
      joinedAt: true,
      memberships: {
        where: { status: { not: 'cancelled' } },
        select: { status: true, paymentState: true, failedPaymentCount: true },
        take: 1,
      },
      visits: {
        where: { checkedInAt: { gte: since } },
        select: { checkedInAt: true, sales: { select: { total: true } } },
      },
      sales: {
        where: { state: 'completed' },
        orderBy: { soldAt: 'desc' },
        take: 1,
        select: { soldAt: true },
      },
    },
  });

    const scored: { name: string; health: CustomerHealth; hasVisited: boolean }[] = [];

  for (const c of customers) {
    const membership = c.memberships[0] ?? null;

    // Baseline: what is this relationship worth at rest?
    let baselineKind: BaselineKind = 'payAsYouGo';
    if (membership && membership.status === 'active') baselineKind = 'member';
    if (!c.lastVisitAt) baselineKind = 'neverVisited';

    const health = computeCustomerHealth({
      baselineKind,
      visits: c.visits.map((v) => ({
        at: v.checkedInAt,
        retailAttached: v.sales.some((s) => Number(s.total) > 0),
      })),
      lastRetailAt: c.sales[0]?.soldAt ?? null,
      // Staleness anchor for anyone with no visit in the window.
      customerSince: c.joinedAt,
      membership: membership
        ? {
            status: membership.status === 'frozen' ? 'frozen' : 'active',
            paymentFailed: membership.failedPaymentCount > 0 || membership.paymentState !== 'current',
          }
        : null,
      now,
    });

    scored.push({
      name: `${c.firstName} ${c.lastName}`,
      health,
      hasVisited: c.visits.length > 0,
    });
  }

  // ── distribution ──────────────────────────────────────────────────────────
  console.log(`\nSalon: ${salon.name} (${salon.slug})`);
  console.log(`Clock: ${now.toISOString()}${demoState?.virtualToday ? ' (virtual)' : ' (real)'}`);
  console.log(`Customers scored: ${scored.length}`);
  console.log(
    `Bands: healthy >= ${BANDS.healthy} · slipping >= ${BANDS.slipping} · lapsed below that`,
  );
  console.log(
    `Baselines: member ${BASELINE.member} · package ${BASELINE.packageHolder} · ` +
      `pay-as-you-go ${BASELINE.payAsYouGo} · never visited ${BASELINE.neverVisited}`,
  );
  console.log(
    `Decay ${TUNING.visitDecayDays}d (cap +${TUNING.visitBoostCap}) · ` +
      `staleness full at ${TUNING.stalenessFullDays}d (cap -${TUNING.stalenessCap})\n`,
  );

  console.log(`${'BAND'.padEnd(9)} ${'ALL'.padStart(5)} ${'SHARE'.padStart(7)} ${'zero-visit'.padStart(11)} ${'has-visited'.padStart(12)}`);
  for (const band of BAND_ORDER) {
    const rows = scored.filter((s) => s.health.band === band);
    const share = ((rows.length / scored.length) * 100).toFixed(1);
    const zero = rows.filter((s) => !s.hasVisited).length;
    console.log(
      `${band.toUpperCase().padEnd(9)} ${String(rows.length).padStart(5)} ${(share + '%').padStart(7)} ` +
        `${String(zero).padStart(11)} ${String(rows.length - zero).padStart(12)}`,
    );
  }

  // The number the bug was hiding behind: a never-visited customer must never
  // out-score someone who actually came in.
  const visited = scored.filter((s) => s.hasVisited);
  const zeroVisit = scored.filter((s) => !s.hasVisited);
  const maxOf = (rows: typeof scored) =>
    rows.length === 0 ? 'n/a' : String(Math.max(...rows.map((s) => s.health.score)));
  console.log(
    `\nHas-visited: ${visited.length} (max score ${maxOf(visited)}) · ` +
      `zero-visit: ${zeroVisit.length} (max score ${maxOf(zeroVisit)}) · ` +
      `zero-visit in healthy band: ${zeroVisit.filter((s) => s.health.band === 'healthy').length}`,
  );

  const scores = scored.map((s) => s.health.score).sort((a, b) => a - b);
  const at = (p: number) => scores[Math.min(scores.length - 1, Math.floor((scores.length - 1) * p))];
  console.log(
    `\nScore spread: min ${scores[0]} · p25 ${at(0.25)} · median ${at(0.5)} · p75 ${at(0.75)} · max ${scores[scores.length - 1]}`,
  );

  // ── flags ─────────────────────────────────────────────────────────────────
  const flagCounts = new Map<string, number>();
  for (const s of scored) {
    for (const f of s.health.riskFlags) flagCounts.set(f, (flagCounts.get(f) ?? 0) + 1);
  }
  console.log('\nRisk flags:');
  for (const [flag, count] of [...flagCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${flag.padEnd(22)} ${count}`);
  }

  // ── the sentences a staff member would actually read ──────────────────────
  console.log('\nLowest 12 — the slipping list, as it would read at the desk:');
  for (const s of [...scored].sort((a, b) => a.health.score - b.health.score).slice(0, 12)) {
    const h = s.health;
    console.log(
      `  ${String(h.score).padStart(3)} ${h.band.padEnd(9)} ${s.name.padEnd(22)} ${healthReason(h)}`,
    );
  }

  console.log('\nHighest 5 — the regulars:');
  for (const s of [...scored].sort((a, b) => b.health.score - a.health.score).slice(0, 5)) {
    console.log(
      `  ${String(s.health.score).padStart(3)} ${s.health.band.padEnd(9)} ${s.name.padEnd(22)} ${healthReason(s.health)}`,
    );
  }
  console.log();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
