import 'server-only';

import {
  MIN_COHORT_SIZE,
  contributesToCohorts,
  filterCohort,
  formatCurrency,
  receivesBenchmarks,
  resolveConsentTier,
  round,
  type ConsentTier,
  type SalonFacts,
} from '@bask/core';
import { db } from '@bask/db';

import type { DemoSalonContext } from './salon';

/**
 * Peers — benchmarking as a product (PRODUCT_SPEC §13).
 *
 * Two rules govern this file and neither is negotiable:
 *
 *  1. A salon only appears in a cohort if its consent tier says so. Membership
 *     is decided by `contributesToCohorts` from `@bask/core/consent` — never by
 *     a local `tier !== 'private'` check that could drift from the filter.
 *  2. Every aggregate leaves through `filterCohort`, which suppresses anything
 *     computed from fewer than MIN_COHORT_SIZE (8) contributors. A cohort of
 *     three is a cohort in which everyone can identify everyone else. The
 *     suppressed case is rendered, not hidden — the guarantee is the feature.
 *
 * Framing rule (PRODUCT_SPEC §13, §11): a gap is an opportunity with a dollar
 * figure on it, never a report card. One "you're winning" benchmark is always
 * shown, and no salon is ever named.
 */

/**
 * How a peer contributes its numbers.
 *
 * The portfolio salons in this dataset are dealer ACCOUNTS, not Bask tenants —
 * PRODUCT_SPEC §20 seeds one fully operating salon plus eleven accounts with a
 * health score, an order book and a region. They have no session rows, so their
 * benchmark contribution is derived from the account attributes that ARE seeded,
 * through the documented monotone maps below: a healthier account sells more
 * retail per session, runs fuller rooms and converts more members.
 *
 * This is a fixture-shaped derivation and it is labelled as such on screen. The
 * subject salon's own side of every comparison is real — computed from its
 * actual visits, sales and sessions — so the gap is honest in the direction that
 * matters, and the arithmetic that turns a gap into dollars runs on real traffic.
 */
const PEER_MAPS = {
  /* Rescaled 2026-08-27 with the fixture's attachment arc. This was
     `8 + health * 0.22`, which put a healthy peer cohort at ~25% — fine when the
     subject salon was seeded at 21%, absurd once it was anchored to the real
     SalonTouch rates (house ~5.3%, best staffer 8.48%). Left alone it showed the
     salon at 5.7% against peers at 25%: a 4x gap, priced, on a benchmark no real
     salon reaches. A distributor would have read that as "your data is made up",
     and he would have been right.
     Now health 50 → 7.0%, health 78 → 8.4%, health 100 → 9.5% — a cohort topping
     out at the measured ceiling, so the gap is reachable and the coaching is
     honest. */
  attachment: (health: number) => 4.5 + health * 0.05,
  utilisation: (health: number) => 26 + health * 0.42,
  membershipRate: (health: number) => 12 + health * 0.3,
  averageBasket: (health: number) => 24 + health * 0.42,
} as const;

export type PeerMetricKey = keyof typeof PEER_MAPS;

export interface CohortDefinition {
  key: string;
  label: string;
  /** Plain-language description of who is in it. */
  description: string;
}

export const COHORTS: CohortDefinition[] = [
  {
    key: 'size',
    label: 'Similar size',
    description:
      'Salons ordering between 40% and twice what you order from UVALUX in a year — the closest thing to "about your size" that everyone shares.',
  },
  {
    key: 'mix',
    label: 'Tanning + wellness',
    description: 'Trading salons running both tanning and wellness services, like yours.',
  },
  {
    key: 'region',
    label: 'Western Canada',
    description: 'Participating salons in BC and Alberta.',
  },
];

interface PeerRow {
  salonId: string;
  tier: ConsentTier;
  region: string | null;
  status: string;
  healthScore: number;
  annualWholesaleValue: number;
}

export interface PeerGap {
  key: PeerMetricKey;
  label: string;
  /** Key into the `@bask/ui` guidance dictionary for the explain popover. */
  metricKey: 'retailAttachment' | 'capacityUse' | 'membershipRevenue';
  unit: 'percent' | 'currency';
  yourValue: number;
  cohortMedian: number;
  cohortTopQuartile: number;
  /** Where you sit in the cohort, 0–100. */
  percentile: number;
  winning: boolean;
  /** Money one point of this metric is worth per month, at your own traffic. */
  dollarsPerPoint: number;
  /** How `dollarsPerPoint` was derived — the owner is allowed to check it. */
  workings: string;
  /** The headline opportunity: closing half the gap. */
  halfGapMonthly: number;
  sentence: string;
  /** How the same number reads on the "where you are already ahead" card. */
  strengthSentence: string;
  /** Slider bounds — never below where you already are. */
  sliderMin: number;
  sliderMax: number;
}

export interface CohortView {
  definition: CohortDefinition;
  contributorCount: number;
  suppressed: boolean;
  minimum: number;
  gaps: PeerGap[];
  winning: PeerGap | null;
}

export interface PeersView {
  eligible: boolean;
  tier: ConsentTier;
  cohorts: CohortView[];
  /** Every participating salon, for the "who is in this" line. */
  participatingTotal: number;
}

/** Median of a non-empty list. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base]! + rest * (sorted[base + 1]! - sorted[base]!)
    : sorted[base]!;
}

function percentileOf(values: number[], value: number): number {
  if (values.length === 0) return 0;
  const below = values.filter((v) => v < value).length;
  return round((below / values.length) * 100, 0);
}

function cohortMembers(cohortKey: string, peers: PeerRow[], subject: PeerRow): PeerRow[] {
  switch (cohortKey) {
    case 'size': {
      const low = subject.annualWholesaleValue * 0.4;
      const high = subject.annualWholesaleValue * 2;
      return peers.filter((p) => p.annualWholesaleValue >= low && p.annualWholesaleValue <= high);
    }
    case 'mix':
      // Every trading salon in this dataset runs both tanning and wellness;
      // a paused salon is not a peer for a "how am I doing" comparison.
      return peers.filter((p) => p.status !== 'paused');
    case 'region':
      return peers.filter((p) => p.region === 'BC' || p.region === 'AB');
    default:
      return peers;
  }
}

export async function loadPeers(
  salon: DemoSalonContext,
  facts: SalonFacts,
): Promise<PeersView> {
  if (!receivesBenchmarks(salon.consentTier)) {
    return { eligible: false, tier: salon.consentTier, cohorts: [], participatingTotal: 0 };
  }

  const [accounts, customerCount] = await Promise.all([
    db.account.findMany({
      include: {
        salon: {
          select: {
            id: true,
            region: true,
            status: true,
            consentProfile: { select: { tier: true } },
          },
        },
      },
    }),
    db.customer.count({ where: { salonId: salon.salonId, status: 'active' } }),
  ]);

  const all: PeerRow[] = accounts.map((a) => ({
    salonId: a.salonId,
    tier: resolveConsentTier(a.salon.consentProfile),
    region: a.salon.region,
    status: a.salon.status,
    healthScore: a.healthScore ?? 50,
    annualWholesaleValue: Number(a.annualWholesaleValue ?? 0),
  }));

  const subject = all.find((r) => r.salonId === salon.salonId);
  if (!subject) {
    return { eligible: false, tier: salon.consentTier, cohorts: [], participatingTotal: 0 };
  }

  // Rule 1: consent decides membership, and the filter decides consent.
  const participating = all.filter((r) => contributesToCohorts(r.tier));
  const peers = participating.filter((r) => r.salonId !== salon.salonId);

  const yourValues = subjectValues(facts, customerCount);
  const coefficients = dollarCoefficients(facts, customerCount);

  const cohorts = COHORTS.map((definition) => {
    const members = cohortMembers(definition.key, peers, subject);

    // Rule 2: the aggregate leaves through filterCohort, always.
    const gated = filterCohort({
      value: members,
      contributorCount: members.length,
    });

    if (gated.suppressed) {
      return {
        definition,
        contributorCount: gated.contributorCount,
        suppressed: true,
        minimum: gated.minimum,
        gaps: [],
        winning: null,
      } satisfies CohortView;
    }

    const built = (Object.keys(PEER_MAPS) as PeerMetricKey[])
      .filter((key) => key !== 'averageBasket')
      .map((key) => buildGap(key, gated.value, yourValues, coefficients));

    const gaps = built.filter((g) => !g.winning).sort((a, b) => b.halfGapMonthly - a.halfGapMonthly);
    const wins = built.filter((g) => g.winning).sort((a, b) => b.percentile - a.percentile);

    return {
      definition,
      contributorCount: gated.contributorCount,
      suppressed: false,
      minimum: MIN_COHORT_SIZE,
      gaps,
      // PRODUCT_SPEC §13: one "you're winning" benchmark is always shown. When
      // the salon leads on nothing, the strongest percentile still gets the
      // frame — Peers is a coach, not a report card.
      winning: wins[0] ?? built.sort((a, b) => b.percentile - a.percentile)[0] ?? null,
    } satisfies CohortView;
  });

  return {
    eligible: true,
    tier: salon.consentTier,
    cohorts,
    participatingTotal: participating.length,
  };
}

/** The subject salon's own numbers — real, from its own rows. */
function subjectValues(facts: SalonFacts, customerCount: number): Record<PeerMetricKey, number> {
  const totalPossible = facts.capacity.slots.reduce((s, x) => s + x.sessionsPossible, 0);
  const totalRun = facts.capacity.slots.reduce((s, x) => s + x.sessionsRun, 0);

  return {
    attachment: round(facts.attachment.currentRate, 1),
    utilisation: totalPossible === 0 ? 0 : round((totalRun / totalPossible) * 100, 1),
    // Members as a share of the salon's own customer base.
    membershipRate:
      customerCount === 0 ? 0 : round((facts.pulse.activeMembers / customerCount) * 100, 1),
    averageBasket: round(facts.attachment.averageAttachedSpend, 2),
  };
}

interface DollarCoefficients {
  attachment: { perPoint: number; workings: string };
  utilisation: { perPoint: number; workings: string };
  membershipRate: { perPoint: number; workings: string };
}

/**
 * What one point of each metric is worth per month, at THIS salon's traffic.
 *
 * These coefficients are the whole gap slider: the browser multiplies the
 * points the owner drags by the number computed here, so the live figure under
 * their finger is the same arithmetic the card states.
 */
function dollarCoefficients(facts: SalonFacts, customerCount: number): DollarCoefficients {
  const a = facts.attachment;
  const attachmentPerPoint = round((a.visitsPerDay * 30 * a.averageAttachedSpend) / 100, 2);

  const totalPossible = facts.capacity.slots.reduce((s, x) => s + x.sessionsPossible, 0);
  const averageSessionValue =
    facts.capacity.slots.find((s) => s.averageSessionValue > 0)?.averageSessionValue ?? 0;
  // The capacity rollup spans 28 days; scale it to a 30-day month.
  const possiblePerMonth = (totalPossible / 28) * 30;
  const utilisationPerPoint = round((possiblePerMonth * averageSessionValue) / 100, 2);

  const memberMonthly =
    facts.pulse.activeMembers === 0
      ? 0
      : facts.pulse.membershipRevenueMonthly / facts.pulse.activeMembers;
  const membershipPerPoint = round((customerCount / 100) * memberMonthly, 2);

  return {
    attachment: {
      perPoint: attachmentPerPoint,
      workings: `${Math.round(a.visitsPerDay)} visits a day × 30 days = ${Math.round(
        a.visitsPerDay * 30,
      )} visits a month. One point of attachment is 1 in 100 of those, and an attached visit is worth ${formatCurrency(
        a.averageAttachedSpend,
      )} — so a point is ${formatCurrency(attachmentPerPoint)} a month.`,
    },
    utilisation: {
      perPoint: utilisationPerPoint,
      workings: `${Math.round(possiblePerMonth)} bookable sessions a month across your rooms. One point of that is ${Math.round(
        possiblePerMonth / 100,
      )} sessions at ${formatCurrency(averageSessionValue)} each — ${formatCurrency(
        utilisationPerPoint,
      )} a month.`,
    },
    membershipRate: {
      perPoint: membershipPerPoint,
      workings: `${customerCount} customers on the books. One more member per hundred of them, at ${formatCurrency(
        memberMonthly,
      )} a month each, is ${formatCurrency(membershipPerPoint)} a month.`,
    },
  };
}

const GAP_META: Record<
  Exclude<PeerMetricKey, 'averageBasket'>,
  { label: string; metricKey: PeerGap['metricKey']; sliderMax: number }
> = {
  attachment: { label: 'Retail sold with sessions', metricKey: 'retailAttachment', sliderMax: 15 },
  utilisation: { label: 'How full your rooms are', metricKey: 'capacityUse', sliderMax: 90 },
  membershipRate: {
    label: 'Members as a share of your traffic',
    metricKey: 'membershipRevenue',
    sliderMax: 60,
  },
};

function buildGap(
  key: Exclude<PeerMetricKey, 'averageBasket'>,
  members: PeerRow[],
  yourValues: Record<PeerMetricKey, number>,
  coefficients: DollarCoefficients,
): PeerGap {
  const peerValues = members.map((m) => round(PEER_MAPS[key](m.healthScore), 1));
  const cohortMedian = round(median(peerValues), 1);
  const topQuartile = round(quantile(peerValues, 0.75), 1);
  const yourValue = yourValues[key];
  const meta = GAP_META[key];
  const coefficient = coefficients[key];

  const gapPoints = round(cohortMedian - yourValue, 1);
  // Under a point is not a gap, it is noise — and dressing noise up as an
  // opportunity is how a benchmarking screen loses an owner's trust.
  const winning = gapPoints < 1;
  const halfGapMonthly = winning ? 0 : round((gapPoints / 2) * coefficient.perPoint, 0);
  const percentile = percentileOf(peerValues, yourValue);

  return {
    key,
    label: meta.label,
    metricKey: meta.metricKey,
    unit: 'percent',
    yourValue,
    cohortMedian,
    cohortTopQuartile: topQuartile,
    percentile,
    winning,
    dollarsPerPoint: coefficient.perPoint,
    workings: coefficient.workings,
    halfGapMonthly,
    sentence: winning
      ? `Yours is ${yourValue}%. Businesses like yours sit at ${cohortMedian}% — you are ahead of ${percentile}% of them.`
      : `Yours is ${yourValue}%. Businesses like yours sit at ${cohortMedian}%. Closing half that gap is worth about ${formatCurrency(
          halfGapMonthly,
        )} a month at your traffic.`,
    strengthSentence:
      gapPoints <= 0
        ? `Yours is ${yourValue}% against ${cohortMedian}% for businesses like yours — ahead of ${percentile}% of them. Whatever you are doing here is working.`
        : `Yours is ${yourValue}% and the middle of the group is ${cohortMedian}%. That is level, and level is the best you sit anywhere in this group.`,
    sliderMin: round(Math.max(0, yourValue), 1),
    sliderMax: Math.max(meta.sliderMax, Math.ceil(topQuartile + 5)),
  };
}
