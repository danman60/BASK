/**
 * Measuring the opportunity feed from the salon's own rows.
 *
 * The counterpart to `today-data.ts`, and deliberately shaped like it: database
 * access lives here in `apps/web/src/lib`, reached through `{ db }` from
 * `@bask/db`, never through `process.env.DATABASE_URL`. What this file does NOT
 * do is decide anything — it counts rows and hands an `OpportunitySignals`
 * struct to `deriveOpportunities` in `@bask/core`, which owns every threshold,
 * every dollar formula and every word of copy.
 *
 * OFF BY DEFAULT. Nothing calls this unless `BASK_LIVE_OPPORTUNITIES === '1'`.
 * With the flag unset the Today page renders `DEMO_OPPORTUNITIES` exactly as it
 * did before this file existed, and none of these queries run.
 *
 * IT MUST NOT TAKE THE PAGE DOWN. `loadOpportunities` catches its own failures
 * and returns the fixtures. The first job of this product is winning a meeting;
 * a derived feed that throws on stage would be worse than a hardcoded one that
 * does not move.
 *
 * TIMEZONE. Weekday bucketing is done through `Intl.DateTimeFormat` in the
 * salon's own zone, the same way `loadNextUp` resolves a local day. A visit at
 * 03:56 UTC is a Wednesday night in Toronto, not a Thursday, and bucketing in
 * UTC would have named the wrong quiet day on the one screen a stakeholder
 * reads first.
 */

import { db } from '@bask/db';
import {
  DEMO_OPPORTUNITIES,
  deriveOpportunities,
  type LowStockSignal,
  type Opportunity,
  type OpportunitySignals,
  type StaffRetailSignal,
} from '@bask/core';

import { rerror } from '@/lib/log';

import type { SalonScope } from './salon-scope';

/** The recent window every rate is measured over. */
const WINDOW_DAYS = 14;
/** The window immediately before it that the recent one is compared against. */
const BASELINE_DAYS = 28;
/** Visits in the trailing month that make a non-member worth approaching. */
const VISITS_TO_QUALIFY = 4;
/** Days without a visit after which a customer counts as lapsed. */
const LAPSED_AFTER_DAYS = 30;
/** How far back a lapsed customer still counts as winnable rather than gone. */
const LAPSED_HORIZON_DAYS = 120;
/** Mean count of any given weekday in a month (365.25 ÷ 7 ÷ 12). */
const WEEKDAY_OCCURRENCES_PER_MONTH = 4.35;

/** Is the derived feed switched on? Read in exactly one place. */
export function liveOpportunitiesEnabled(): boolean {
  return process.env.BASK_LIVE_OPPORTUNITIES === '1';
}

const DAY_MS = 86_400_000;

/** Prisma `Decimal | null` → a plain number. */
function num(value: { toString(): string } | null | undefined): number {
  return value == null ? 0 : Number(value.toString());
}

/**
 * The feed for Today.
 *
 * Returns the fixtures untouched when the flag is off, and also when the
 * derivation produces nothing or throws — a salon with no rows yet should see
 * the demo set rather than an empty promise, and a query that fails on stage
 * should degrade to the thing that always renders.
 */
export async function loadOpportunities(
  salon: SalonScope,
  today: string,
): Promise<{ opportunities: Opportunity[]; source: 'derived' | 'fixtures' }> {
  if (!liveOpportunitiesEnabled()) {
    return { opportunities: DEMO_OPPORTUNITIES, source: 'fixtures' };
  }

  try {
    const signals = await measureSignals(salon, today);
    const derived = deriveOpportunities(signals);
    if (derived.length === 0) {
      return { opportunities: DEMO_OPPORTUNITIES, source: 'fixtures' };
    }
    return { opportunities: derived, source: 'derived' };
  } catch (error) {
    rerror('opportunities', 'live derivation failed; falling back to fixtures', {
      salon: salon.slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return { opportunities: DEMO_OPPORTUNITIES, source: 'fixtures' };
  }
}

/* ------------------------------------------------------------- measurement */

async function measureSignals(salon: SalonScope, today: string): Promise<OpportunitySignals> {
  // The virtual clock, not the wall clock — the demo moves under the app.
  const now = new Date(`${today}T00:00:00.000Z`);
  const back = (days: number) => new Date(now.getTime() - days * DAY_MS);

  const windowStart = back(WINDOW_DAYS);
  const baselineStart = back(WINDOW_DAYS + BASELINE_DAYS);

  const [
    windowVisits,
    baselineVisits,
    windowLines,
    baselineLines,
    activeMembers,
    customerBase,
    membershipPrice,
    windowSales,
    inventory,
  ] = await Promise.all([
    db.visit.count({
      where: { salonId: salon.id, checkedInAt: { gte: windowStart, lt: now } },
    }),
    db.visit.count({
      where: { salonId: salon.id, checkedInAt: { gte: baselineStart, lt: windowStart } },
    }),
    db.saleLine.findMany({
      where: {
        salonId: salon.id,
        productId: { not: null },
        soldAt: { gte: windowStart, lt: now },
      },
      select: { lineTotal: true, staffId: true },
    }),
    db.saleLine.findMany({
      where: {
        salonId: salon.id,
        productId: { not: null },
        soldAt: { gte: baselineStart, lt: windowStart },
      },
      select: { lineTotal: true },
    }),
    db.membership.count({ where: { salonId: salon.id, status: 'active' } }),
    db.customer.count({ where: { salonId: salon.id, status: 'active' } }),
    db.membership.aggregate({
      where: { salonId: salon.id, status: 'active' },
      _avg: { monthlyPrice: true },
    }),
    db.sale.aggregate({
      where: { salonId: salon.id, soldAt: { gte: baselineStart, lt: now } },
      _sum: { total: true },
      _count: true,
    }),
    db.inventoryLevel.findMany({
      where: { salonId: salon.id },
      select: {
        onHand: true,
        reorderPoint: true,
        parLevel: true,
        productId: true,
        product: { select: { sku: true, name: true } },
      },
    }),
  ]);

  // Averaged across BOTH windows: the mean product sale is a property of the
  // catalogue, not of the fortnight, and a 14-day mean swings on a single
  // expensive bottle. The two selects have different shapes (only the recent one
  // carries `staffId`), so they are summed rather than concatenated.
  const lineCount = windowLines.length + baselineLines.length;
  const lineTotal =
    windowLines.reduce((sum, line) => sum + num(line.lineTotal), 0) +
    baselineLines.reduce((sum, line) => sum + num(line.lineTotal), 0);
  const averageProductLine = lineCount > 0 ? lineTotal / lineCount : 0;

  const totalWindowVisits = windowVisits + baselineVisits;
  const totalRevenue = num(windowSales._sum.total);
  const revenuePerVisit = totalWindowVisits > 0 ? totalRevenue / totalWindowVisits : 0;

  const [staff, membership, lapsed, quietDay, lowStock] = await Promise.all([
    measureStaffRetail(salon, windowLines, windowStart, now),
    measureMembership(salon, back(30), now, num(membershipPrice._avg.monthlyPrice), activeMembers, customerBase),
    measureLapsed(salon, back(LAPSED_AFTER_DAYS), back(LAPSED_HORIZON_DAYS), totalRevenue, baselineStart, now),
    measureQuietDay(salon, baselineStart, now, revenuePerVisit),
    measureLowStock(salon, inventory, windowStart, now),
  ]);

  return {
    windowDays: WINDOW_DAYS,
    baselineDays: BASELINE_DAYS,
    retail: {
      windowVisits,
      windowProductLines: windowLines.length,
      baselineVisits,
      baselineProductLines: baselineLines.length,
      averageProductLine,
      staff,
    },
    membership,
    lapsed,
    quietDay,
    lowStock,
  };
}

/**
 * Per-person retail performance.
 *
 * `linesSold` is that person's own product lines; `visitsServed` is the visits
 * they were the attending staff on. Both are counted, so the leaderboard on the
 * card is the salon's own record and not a ranking invented here.
 */
async function measureStaffRetail(
  salon: SalonScope,
  windowLines: Array<{ staffId: string | null }>,
  from: Date,
  to: Date,
): Promise<StaffRetailSignal[]> {
  const linesByStaff = new Map<string, number>();
  for (const line of windowLines) {
    if (!line.staffId) continue;
    linesByStaff.set(line.staffId, (linesByStaff.get(line.staffId) ?? 0) + 1);
  }

  const served = await db.visit.groupBy({
    by: ['staffId'],
    where: { salonId: salon.id, checkedInAt: { gte: from, lt: to }, staffId: { not: null } },
    _count: { _all: true },
  });
  if (served.length === 0) return [];

  const ids = served.map((row) => row.staffId).filter((id): id is string => id !== null);
  const people = await db.staff.findMany({
    where: { id: { in: ids } },
    select: { id: true, firstName: true },
  });
  const nameById = new Map(people.map((person) => [person.id, person.firstName]));

  return served
    .flatMap((row) => {
      const id = row.staffId;
      const name = id ? nameById.get(id) : undefined;
      if (!id || !name) return [];
      return [
        {
          name,
          linesSold: linesByStaff.get(id) ?? 0,
          visitsServed: row._count._all,
        } satisfies StaffRetailSignal,
      ];
    })
    .sort((a, b) => b.visitsServed - a.visitsServed);
}

/** Regulars without an active membership, and how many of them may be texted. */
async function measureMembership(
  salon: SalonScope,
  from: Date,
  to: Date,
  averageMonthlyPrice: number,
  activeMembers: number,
  customerBase: number,
): Promise<OpportunitySignals['membership']> {
  const [frequent, members] = await Promise.all([
    db.visit.groupBy({
      by: ['customerId'],
      where: { salonId: salon.id, checkedInAt: { gte: from, lt: to } },
      _count: { _all: true },
    }),
    db.membership.findMany({
      where: { salonId: salon.id, status: 'active' },
      select: { customerId: true },
    }),
  ]);

  const memberIds = new Set(members.map((row) => row.customerId));
  const eligibleIds = frequent
    .filter((row) => row._count._all >= VISITS_TO_QUALIFY && !memberIds.has(row.customerId))
    .map((row) => row.customerId);

  if (eligibleIds.length === 0) {
    return {
      eligibleCount: 0,
      eligibleSmsConsented: 0,
      eligibleNames: [],
      averageMonthlyPrice,
      activeMembers,
      customerBase,
      visitsToQualify: VISITS_TO_QUALIFY,
    };
  }

  const eligible = await db.customer.findMany({
    where: { id: { in: eligibleIds }, status: 'active' },
    select: { firstName: true, lastName: true, smsOptIn: true },
    orderBy: { lastVisitAt: 'desc' },
  });

  return {
    eligibleCount: eligible.length,
    eligibleSmsConsented: eligible.filter((customer) => customer.smsOptIn).length,
    // First name, last initial — the same de-identification the queue uses.
    eligibleNames: eligible.map(
      (customer) => `${customer.firstName} ${customer.lastName.charAt(0)}.`,
    ),
    averageMonthlyPrice,
    activeMembers,
    customerBase,
    visitsToQualify: VISITS_TO_QUALIFY,
  };
}

/**
 * Lapsed customers who consented to be texted.
 *
 * Only SMS-consented customers are counted, because the card's only action is a
 * text and a recipient count that includes people who may not be messaged is a
 * number the salon cannot act on.
 */
async function measureLapsed(
  salon: SalonScope,
  lapsedBefore: Date,
  horizon: Date,
  revenueInWindow: number,
  windowFrom: Date,
  windowTo: Date,
): Promise<OpportunitySignals['lapsed']> {
  const [reachableCount, activeCustomers] = await Promise.all([
    db.customer.count({
      where: {
        salonId: salon.id,
        status: 'active',
        smsOptIn: true,
        lastVisitAt: { lt: lapsedBefore, gte: horizon },
      },
    }),
    db.visit.findMany({
      where: { salonId: salon.id, checkedInAt: { gte: windowFrom, lt: windowTo } },
      select: { customerId: true },
      distinct: ['customerId'],
    }),
  ]);

  const spanDays = (windowTo.getTime() - windowFrom.getTime()) / DAY_MS;
  const monthlyValuePerCustomer =
    activeCustomers.length > 0 && spanDays > 0
      ? (revenueInWindow / activeCustomers.length) * (30 / spanDays)
      : 0;

  return {
    reachableCount,
    sinceDays: LAPSED_AFTER_DAYS,
    monthlyValuePerCustomer,
  };
}

/** The weakest weekday, bucketed in the salon's own timezone. */
async function measureQuietDay(
  salon: SalonScope,
  from: Date,
  to: Date,
  revenuePerVisit: number,
): Promise<OpportunitySignals['quietDay']> {
  const visits = await db.visit.findMany({
    where: { salonId: salon.id, checkedInAt: { gte: from, lt: to } },
    select: { checkedInAt: true },
  });
  if (visits.length === 0 || revenuePerVisit <= 0) return null;

  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: salon.timezone,
    weekday: 'long',
  });
  const localDay = new Intl.DateTimeFormat('en-CA', {
    timeZone: salon.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Count visits per weekday AND how many distinct calendar days of that
  // weekday the window actually contained — a window that holds five Mondays
  // and four Tuesdays would otherwise make Tuesday look quiet.
  const visitsByWeekday = new Map<string, number>();
  const datesByWeekday = new Map<string, Set<string>>();

  for (const visit of visits) {
    const name = weekday.format(visit.checkedInAt);
    visitsByWeekday.set(name, (visitsByWeekday.get(name) ?? 0) + 1);
    const dates = datesByWeekday.get(name) ?? new Set<string>();
    dates.add(localDay.format(visit.checkedInAt));
    datesByWeekday.set(name, dates);
  }

  const perDay = [...visitsByWeekday.entries()]
    .map(([label, count]) => {
      const occurrences = datesByWeekday.get(label)?.size ?? 0;
      return { label, average: occurrences > 0 ? count / occurrences : 0 };
    })
    .filter((row) => row.average > 0);

  // Below a full week of data a "quietest day" is an artefact of the window.
  if (perDay.length < 7) return null;

  const sorted = [...perDay].sort((a, b) => a.average - b.average);
  const quietest = sorted[0]!;
  const middle = sorted[Math.floor(sorted.length / 2)]!;

  return {
    label: quietest.label,
    averageVisits: quietest.average,
    medianVisits: middle.average,
    revenuePerVisit,
    occurrencesPerMonth: WEEKDAY_OCCURRENCES_PER_MONTH,
  };
}

/** Products at or below their reorder point, with measured sell-through. */
async function measureLowStock(
  salon: SalonScope,
  inventory: Array<{
    onHand: number;
    reorderPoint: number;
    parLevel: number | null;
    productId: string;
    product: { sku: string; name: string };
  }>,
  from: Date,
  to: Date,
): Promise<LowStockSignal[]> {
  const low = inventory.filter((level) => level.onHand <= level.reorderPoint);
  if (low.length === 0) return [];

  const sold = await db.saleLine.groupBy({
    by: ['productId'],
    where: {
      salonId: salon.id,
      productId: { in: low.map((level) => level.productId) },
      soldAt: { gte: from, lt: to },
    },
    _sum: { quantity: true, lineTotal: true },
  });
  const soldById = new Map(sold.map((row) => [row.productId, row]));

  return low.map((level) => {
    const row = soldById.get(level.productId);
    return {
      sku: level.product.sku,
      name: level.product.name,
      onHand: level.onHand,
      reorderPoint: level.reorderPoint,
      parLevel: level.parLevel,
      unitsSoldInWindow: row?._sum.quantity ?? 0,
      revenueInWindow: num(row?._sum.lineTotal),
    } satisfies LowStockSignal;
  });
}
