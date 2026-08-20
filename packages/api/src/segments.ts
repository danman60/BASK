/**
 * Smart segments — the fixed coded predicates (IMPLEMENTATION_SPEC §2:
 * "a KEY, never a stored query AST").
 *
 * `bask.segment` stores the key, label and plain-English description. The
 * *meaning* of each key lives here, in code, because a segment that can be
 * edited into an arbitrary query is a segment nobody can reason about — and the
 * consent whisper ("goes to 43 people who agreed to texts") has to be provably
 * true, not approximately true.
 *
 * Everything is computed against the demo clock's virtual today, never
 * `new Date()`: advancing the clock must move the segments with it.
 */

import {
  addDays,
  computeCustomerHealth,
  dateOnlyToUtcMidnight,
  healthReason,
  toDateOnly,
  type CustomerHealthBand,
  type DateOnly,
} from '@bask/core';
import type { PrismaClient } from '@bask/db';

export const SEGMENT_KEYS = [
  'new_this_month',
  'expiring_packages',
  'at_risk',
  'big_spenders',
  'lapsed_30d',
  'midweek_regulars',
] as const;

export type SegmentKey = (typeof SEGMENT_KEYS)[number];

export function isSegmentKey(value: string): value is SegmentKey {
  return (SEGMENT_KEYS as readonly string[]).includes(value);
}

/** One customer as every segment predicate needs to see them. */
export interface SegmentCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  emailOptIn: boolean;
  smsOptIn: boolean;
  joinedAt: Date;
  lastVisitAt: Date | null;
  /** Total spend over the trailing 90 days. */
  spend90: number;
  /** Visits over the trailing 90 days. */
  visits90: number;
  /** Visits over the trailing 90 days that fell on Tue/Wed/Thu. */
  midweekVisits90: number;
  /** Days since the last visit, against virtual today. Null = never visited. */
  daysSinceLastVisit: number | null;
  /** Smallest credits-remaining across active packages. Null = no package. */
  packageCreditsLeft: number | null;
  /** Days until the soonest active package expiry. Null = none / no expiry. */
  packageExpiresInDays: number | null;
  membershipTier: string | null;
  membershipPaymentState: string | null;
  health: {
    score: number;
    band: CustomerHealthBand;
    reason: string;
    daysSinceLastVisit: number | null;
    usualEveryDays: number | null;
  };
}

export interface SegmentDefinition {
  key: SegmentKey;
  label: string;
  /** Plain English, shown under the audience count in Studio. */
  description: string;
  /** Criteria chips — the same predicate, said out loud. */
  criteria: string[];
  sortOrder: number;
  matches: (c: SegmentCustomer, ctx: SegmentContext) => boolean;
}

export interface SegmentContext {
  today: DateOnly;
  /** Spend threshold for `big_spenders`, computed from the live distribution. */
  bigSpenderFloor: number;
}

export const SEGMENT_DEFINITIONS: Record<SegmentKey, SegmentDefinition> = {
  new_this_month: {
    key: 'new_this_month',
    label: 'New this month',
    description: 'Joined in the last 30 days.',
    criteria: ['Joined < 30 days ago'],
    sortOrder: 1,
    matches: (c, ctx) => daysBetween(c.joinedAt, ctx.today) <= 30,
  },
  expiring_packages: {
    key: 'expiring_packages',
    label: 'Packages running out',
    description: 'Two or fewer sessions left, or expiring within 30 days.',
    criteria: ['≤ 2 sessions left', 'or expires < 30 days'],
    sortOrder: 2,
    matches: (c) =>
      (c.packageCreditsLeft !== null && c.packageCreditsLeft <= 2) ||
      (c.packageExpiresInDays !== null && c.packageExpiresInDays <= 30),
  },
  at_risk: {
    key: 'at_risk',
    label: 'At risk',
    description: 'Used to come weekly, has not been in for three weeks.',
    criteria: ['Was a regular', '21+ days quiet'],
    sortOrder: 3,
    // "Used to come weekly" = at least eight visits in the trailing 90 days.
    // Anyone can go quiet for three weeks; a regular going quiet is the signal.
    matches: (c) =>
      c.visits90 >= 8 && c.daysSinceLastVisit !== null && c.daysSinceLastVisit >= 21,
  },
  big_spenders: {
    key: 'big_spenders',
    label: 'Best customers',
    description: 'Top 10% by spend over the last 90 days.',
    criteria: ['Top 10% by spend', 'Last 90 days'],
    sortOrder: 4,
    matches: (c, ctx) => c.spend90 > 0 && c.spend90 >= ctx.bigSpenderFloor,
  },
  lapsed_30d: {
    key: 'lapsed_30d',
    label: 'Lapsed 30 days',
    description: 'No visit in the last 30 days.',
    criteria: ['30+ days quiet'],
    sortOrder: 5,
    matches: (c) => c.daysSinceLastVisit === null || c.daysSinceLastVisit >= 30,
  },
  midweek_regulars: {
    key: 'midweek_regulars',
    label: 'Midweek regulars',
    description: 'Usually comes in Tuesday to Thursday.',
    criteria: ['Tue–Thu visitor', '3+ visits'],
    sortOrder: 6,
    matches: (c) => c.visits90 >= 3 && c.midweekVisits90 / c.visits90 >= 0.6,
  },
};

export const SEGMENTS_IN_ORDER: SegmentDefinition[] = Object.values(SEGMENT_DEFINITIONS).sort(
  (a, b) => a.sortOrder - b.sortOrder,
);

/**
 * The Studio "quiet Tuesday" audience: lapsed regulars who used to visit
 * midweek. It is the intersection of two seeded segments, and the mockup's
 * copy ("Lapsed regulars — used to visit midweek, quiet for 30+ days") names
 * exactly that. Composite because no single predicate says it.
 */
export const COMPOSITE_LAPSED_MIDWEEK = 'lapsed_midweek' as const;

export type AudienceKey = SegmentKey | typeof COMPOSITE_LAPSED_MIDWEEK;

export function audienceLabel(key: AudienceKey): string {
  return key === COMPOSITE_LAPSED_MIDWEEK
    ? 'Lapsed midweek regulars'
    : SEGMENT_DEFINITIONS[key].label;
}

export function audienceDescription(key: AudienceKey): string {
  return key === COMPOSITE_LAPSED_MIDWEEK
    ? 'Lapsed regulars — used to visit midweek, quiet for 30+ days.'
    : SEGMENT_DEFINITIONS[key].description;
}

export function audienceCriteria(key: AudienceKey): string[] {
  return key === COMPOSITE_LAPSED_MIDWEEK
    ? ['30+ days quiet', 'Midweek visitors']
    : SEGMENT_DEFINITIONS[key].criteria;
}

export function matchesAudience(
  key: AudienceKey,
  customer: SegmentCustomer,
  ctx: SegmentContext,
): boolean {
  if (key === COMPOSITE_LAPSED_MIDWEEK) {
    return (
      SEGMENT_DEFINITIONS.lapsed_30d.matches(customer, ctx) &&
      SEGMENT_DEFINITIONS.midweek_regulars.matches(customer, ctx)
    );
  }
  return SEGMENT_DEFINITIONS[key].matches(customer, ctx);
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * Loads every customer with the derived facts the predicates need.
 *
 * One pass over the salon's customers, packages, memberships and 90 days of
 * visits/sales. The dataset is ~420 customers, so computing in TypeScript is
 * both faster to read and easier to keep honest than six hand-written SQL
 * aggregates that could each drift from the predicate they implement.
 */
export async function loadSegmentCustomers(
  db: PrismaClient,
  salonId: string,
  today: DateOnly,
): Promise<{ customers: SegmentCustomer[]; ctx: SegmentContext }> {
  const windowStart = dateOnlyToUtcMidnight(addDays(today, -90));
  const todayEnd = dateOnlyToUtcMidnight(addDays(today, 1));

  const [customers, visits, saleLines, packages, memberships] = await Promise.all([
    db.customer.findMany({
      where: { salonId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        emailOptIn: true,
        smsOptIn: true,
        joinedAt: true,
        lastVisitAt: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    db.visit.findMany({
      where: { salonId, checkedInAt: { gte: windowStart, lt: todayEnd } },
      select: { customerId: true, checkedInAt: true },
    }),
    db.saleLine.findMany({
      where: { salonId, soldAt: { gte: windowStart, lt: todayEnd }, customerId: { not: null } },
      select: { customerId: true, lineTotal: true, soldAt: true },
    }),
    db.package.findMany({
      where: { salonId, status: 'active' },
      select: { customerId: true, creditsRemaining: true, expiresAt: true },
    }),
    db.membership.findMany({
      where: { salonId, status: { not: 'cancelled' } },
      select: { customerId: true, tier: true, paymentState: true, status: true },
    }),
  ]);

  const visitsBy = new Map<string, { total: number; midweek: number; rows: { at: Date; retailAttached: boolean }[] }>();
  for (const v of visits) {
    const bucket = visitsBy.get(v.customerId) ?? { total: 0, midweek: 0, rows: [] };
    bucket.total += 1;
    bucket.rows.push({ at: v.checkedInAt, retailAttached: false });
    // Tue(2) · Wed(3) · Thu(4) in the salon's own reckoning. The seeded data is
    // generated in salon-local time, so UTC day-of-week is the same bucket.
    const dow = v.checkedInAt.getUTCDay();
    if (dow >= 2 && dow <= 4) bucket.midweek += 1;
    visitsBy.set(v.customerId, bucket);
  }

  const spendBy = new Map<string, number>();
  const lastRetailBy = new Map<string, Date>();
  for (const line of saleLines) {
    if (!line.customerId) continue;
    spendBy.set(line.customerId, (spendBy.get(line.customerId) ?? 0) + Number(line.lineTotal));
    const previous = lastRetailBy.get(line.customerId);
    if (!previous || line.soldAt > previous) lastRetailBy.set(line.customerId, line.soldAt);
  }

  const packageBy = new Map<string, { credits: number; expiresInDays: number | null }>();
  for (const p of packages) {
    const expiresInDays = p.expiresAt ? daysUntil(p.expiresAt, today) : null;
    const existing = packageBy.get(p.customerId);
    if (!existing) {
      packageBy.set(p.customerId, { credits: p.creditsRemaining, expiresInDays });
      continue;
    }
    existing.credits = Math.min(existing.credits, p.creditsRemaining);
    if (expiresInDays !== null) {
      existing.expiresInDays =
        existing.expiresInDays === null
          ? expiresInDays
          : Math.min(existing.expiresInDays, expiresInDays);
    }
  }

  const membershipBy = new Map<string, { tier: string; paymentState: string; status: string }>();
  for (const m of memberships) {
    if (!membershipBy.has(m.customerId)) {
      membershipBy.set(m.customerId, { tier: m.tier, paymentState: m.paymentState, status: m.status });
    }
  }

  const rows: SegmentCustomer[] = customers.map((c) => {
    const v = visitsBy.get(c.id) ?? { total: 0, midweek: 0, rows: [] };
    const pkg = packageBy.get(c.id) ?? null;
    const mem = membershipBy.get(c.id) ?? null;
    const healthVisits = v.rows.length > 0
      ? v.rows
      : c.lastVisitAt
        ? [{ at: c.lastVisitAt, retailAttached: false }]
        : [];
    const health = computeCustomerHealth({
      baselineKind: mem ? 'member' : pkg ? 'packageHolder' : 'payAsYouGo',
      visits: healthVisits,
      lastRetailAt: lastRetailBy.get(c.id) ?? null,
      membership: mem
        ? {
            status: mem.status === 'frozen' ? 'frozen' : mem.status === 'cancelled' ? 'cancelled' : 'active',
            paymentFailed: mem.paymentState === 'failed',
          }
        : null,
      now: dateOnlyToUtcMidnight(today),
    });
    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      status: c.status,
      emailOptIn: c.emailOptIn,
      smsOptIn: c.smsOptIn,
      joinedAt: c.joinedAt,
      lastVisitAt: c.lastVisitAt,
      spend90: round2(spendBy.get(c.id) ?? 0),
      visits90: v.total,
      midweekVisits90: v.midweek,
      daysSinceLastVisit: c.lastVisitAt ? daysBetween(c.lastVisitAt, today) : null,
      packageCreditsLeft: pkg ? pkg.credits : null,
      packageExpiresInDays: pkg ? pkg.expiresInDays : null,
      membershipTier: mem?.tier ?? null,
      membershipPaymentState: mem?.paymentState ?? null,
      health: {
        score: health.score,
        band: health.band,
        reason: healthReason(health),
        daysSinceLastVisit: health.daysSinceLastVisit,
        usualEveryDays: v.total > 1 ? Math.max(1, Math.round(90 / v.total)) : null,
      },
    };
  });

  return { customers: rows, ctx: { today, bigSpenderFloor: bigSpenderFloor(rows) } };
}

/** 90th percentile of non-zero spend. Empty or all-zero → an unreachable floor. */
function bigSpenderFloor(rows: SegmentCustomer[]): number {
  const spends = rows
    .map((r) => r.spend90)
    .filter((s) => s > 0)
    .sort((a, b) => a - b);
  if (spends.length === 0) return Number.POSITIVE_INFINITY;
  const index = Math.floor(spends.length * 0.9);
  return spends[Math.min(index, spends.length - 1)]!;
}

// ---------------------------------------------------------------------------
// Reach — segment ∩ consent
// ---------------------------------------------------------------------------

export type Channel = 'sms' | 'email' | 'instagram' | 'facebook';

/** Channels that reach a person directly and therefore need their consent. */
export const DIRECT_CHANNELS: Channel[] = ['sms', 'email'];

export function consentsTo(customer: SegmentCustomer, channel: Channel): boolean {
  if (channel === 'sms') return customer.smsOptIn && Boolean(customer.phone);
  if (channel === 'email') return customer.emailOptIn && Boolean(customer.email);
  // Instagram and Facebook are broadcast — nobody's inbox is being entered, so
  // there is no per-person consent to check.
  return true;
}

export interface AudienceReach {
  key: AudienceKey;
  label: string;
  description: string;
  criteria: string[];
  /** Everyone the predicate matches. */
  total: number;
  /** Of those, how many may be contacted on each direct channel. */
  reachable: Record<'sms' | 'email', number>;
  memberIds: string[];
}

export function computeReach(
  key: AudienceKey,
  customers: SegmentCustomer[],
  ctx: SegmentContext,
): AudienceReach {
  const members = customers.filter((c) => matchesAudience(key, c, ctx));
  return {
    key,
    label: audienceLabel(key),
    description: audienceDescription(key),
    criteria: audienceCriteria(key),
    total: members.length,
    reachable: {
      sms: members.filter((c) => consentsTo(c, 'sms')).length,
      email: members.filter((c) => consentsTo(c, 'email')).length,
    },
    memberIds: members.map((c) => c.id),
  };
}

/**
 * How many people a campaign actually reaches: the audience narrowed to anyone
 * who agreed to at least one of its channels. This is the number the consent
 * whisper quotes, so it must never be the raw segment size.
 */
export function reachForChannels(
  members: SegmentCustomer[],
  channels: Channel[],
): { count: number; ids: string[] } {
  const direct = channels.filter((c): c is 'sms' | 'email' =>
    (DIRECT_CHANNELS as string[]).includes(c),
  );
  // A broadcast-only campaign reaches the whole audience — nothing is being
  // sent to an individual, so consent does not narrow it.
  if (direct.length === 0) return { count: members.length, ids: members.map((m) => m.id) };
  const reached = members.filter((m) => direct.some((channel) => consentsTo(m, channel)));
  return { count: reached.length, ids: reached.map((m) => m.id) };
}

// ---------------------------------------------------------------------------

function daysBetween(from: Date, today: DateOnly): number {
  const start = Date.parse(`${toDateOnly(from, 'UTC')}T00:00:00.000Z`);
  const end = Date.parse(`${today}T00:00:00.000Z`);
  return Math.round((end - start) / 86_400_000);
}

function daysUntil(target: Date, today: DateOnly): number {
  return -daysBetween(target, today);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
