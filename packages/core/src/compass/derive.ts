/**
 * Compass derivation — turning account rows into the DERIVED, banded facts a rep
 * is allowed to see (PRODUCT_SPEC §14, §7: "Everything Compass shows is a
 * derivation, never a passthrough").
 *
 * This module is the only place that decides what a signal *means* on screen. It
 * is deliberately pure and DB-free so the rules are unit-testable and so the
 * shape it produces can be handed straight to `filterAccount` — which is the
 * contract: **derive here, filter there, render what survives.** Nothing in the
 * Compass UI is allowed to reach around either step.
 *
 * Two properties this file exists to hold:
 *
 *  1. **No naked scores.** A health score never reaches a screen as a number.
 *     It becomes a band, and the band carries the factors that produced it
 *     (PRODUCT_SPEC Principle 2 / §14 "each expandable to factors").
 *  2. **No invented figures.** Every tile value traces to a metric the detector
 *     actually emitted or to a field on the account row. When a metric is
 *     missing the tile is dropped, never estimated — a rep who is handed a
 *     number that is not real stops trusting the whole list.
 */

import {
  MIN_COHORT_SIZE,
  filterAccount,
  filterCohort,
  repMaySeeSignals,
  type ConsentTier,
} from '../consent';

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const HEALTH_BANDS = ['thriving', 'steady', 'needs_attention'] as const;
export type HealthBand = (typeof HEALTH_BANDS)[number];

export const HEALTH_BAND_LABELS: Record<HealthBand, string> = {
  thriving: 'Thriving',
  steady: 'Steady',
  needs_attention: 'Needs attention',
};

/** Band thresholds. One place, so Network and Call List can never disagree. */
export const HEALTH_BAND_FLOOR: Record<HealthBand, number> = {
  thriving: 80,
  steady: 60,
  needs_attention: 0,
};

export type TrendDirection = 'up' | 'down' | 'flat' | 'unknown';

/** Where a salon sits against its cohort, as a band — never a raw percentile. */
export type CompassBand = 'ahead' | 'in_line' | 'behind' | 'unknown';

export type ChurnRiskBand = 'low' | 'moderate' | 'elevated' | 'unknown';

export interface PeerGap {
  /** Machine name of the thing compared. */
  metric: string;
  /** Plain-English label for the rep. */
  label: string;
  band: CompassBand;
  /** How many salons fed the comparison. Always shown on screen (PRODUCT_SPEC §13). */
  cohortN: number;
  /** Null when the cohort was suppressed for being too small to anonymise. */
  cohortValue: number | null;
  salonValue: number | null;
  suppressed: boolean;
}

/**
 * One tile in the 3-up evidence row (DESIGN_SPEC §3.4). `value` is already
 * formatted — the number is computed here, next to the rule that justifies it,
 * so the component stays a renderer.
 */
export interface EvidenceTile {
  value: string;
  caption: string;
  direction: TrendDirection;
}

export interface CoachingRequestSummary {
  id: string;
  topic: string;
  state: string;
  requestedAt: string;
  /** Their words, not ours. Shown verbatim on the account timeline. */
  message: string | null;
}

export interface DraftOrderSummary {
  id: string;
  state: string;
  total: number;
  lineCount: number;
  /** Every recommended line carries its "because" (PRODUCT_SPEC §12). */
  lines: Array<{ description: string; quantity: number; reason: string | null }>;
  submittedAt: string | null;
  createdAt: string;
}

/** What the equipment profile reduces to. UVALUX sold it — it is identity. */
export interface EquipmentProfileSummary {
  roomTypes: string[];
  deviceCount: number;
}

// ---------------------------------------------------------------------------
// The full, pre-filter account record
// ---------------------------------------------------------------------------

/**
 * Every field Compass could want, in the exact key names `COMPASS_FIELDS`
 * declares. Build this, then hand it to `filterAccount` — the filter drops what
 * the tier does not permit, and what survives is what renders.
 *
 * Keys NOT in `COMPASS_FIELDS` are dropped by the filter by design, so anything
 * the UI needs regardless of tier (ids, routing slugs) travels in
 * `CompassAccountView.envelope` instead — outside the filtered payload, and
 * carrying nothing about the salon's business.
 */
export interface CompassAccountRecord extends Record<string, unknown> {
  // identity — facts UVALUX holds because it is their supplier
  salonName: string;
  region: string;
  roomCount: number | null;
  equipmentProfile: EquipmentProfileSummary | null;
  softwareAdoption: 'active' | 'onboarding' | 'dormant';
  // participation
  consentTier: ConsentTier;
  benchmarkParticipant: boolean;
  lastActiveAt: string | null;
  // signals (coaching only)
  healthBand: HealthBand;
  revenueTrendDirection: TrendDirection;
  membershipTrendDirection: TrendDirection;
  retailAttachmentBand: CompassBand;
  utilizationBand: CompassBand;
  churnRiskBand: ChurnRiskBand;
  orderRecencyDays: number | null;
  peerGaps: PeerGap[];
  signalType: string | null;
  signalHeadline: string | null;
  evidenceTiles: EvidenceTile[];
  // requests (coaching only) — the salon's own asks
  coachingRequests: CoachingRequestSummary[];
  draftOrders: DraftOrderSummary[];
}

/** Non-business routing facts. Never derived from salon data, never filtered. */
export interface CompassEnvelope {
  accountId: string;
  salonId: string;
  salonSlug: string;
  accountNumber: string | null;
  territory: string | null;
  repName: string | null;
  /** ISO date the rep last logged a contact. A UVALUX record, not a salon one. */
  lastContactAt: string | null;
  snoozedUntil: string | null;
}

export interface CompassAccountView {
  envelope: CompassEnvelope;
  consentTier: ConsentTier;
  /** What survived `filterAccount`. Undefined keys are the filter working. */
  account: Partial<CompassAccountRecord>;
}

// ---------------------------------------------------------------------------
// Inputs (DB-shaped, but not Prisma-typed — packages/core stays dependency-free)
// ---------------------------------------------------------------------------

export interface AccountSignalInput {
  signalType: string;
  severity: string;
  headline: string;
  metrics: Record<string, unknown>;
}

export interface DeriveAccountInput {
  envelope: CompassEnvelope;
  consentTier: ConsentTier;
  salonName: string;
  city: string | null;
  region: string | null;
  salonStatus: string;
  healthScore: number | null;
  lifecycle: string;
  roomCount: number | null;
  equipmentProfile: EquipmentProfileSummary | null;
  lastActiveAt: string | null;
  /** Most recent signal snapshot for this account, if any. */
  signal: AccountSignalInput | null;
  coachingRequests: CoachingRequestSummary[];
  draftOrders: DraftOrderSummary[];
  /** Cohort facts, computed once for the whole portfolio — see `buildHealthCohort`. */
  cohort: HealthCohort;
}

// ---------------------------------------------------------------------------
// Bands
// ---------------------------------------------------------------------------

export function bandForHealth(score: number | null): HealthBand {
  if (score === null) return 'needs_attention';
  if (score >= HEALTH_BAND_FLOOR.thriving) return 'thriving';
  if (score >= HEALTH_BAND_FLOOR.steady) return 'steady';
  return 'needs_attention';
}

/**
 * The factors behind a band, in plain language. This is what "expandable to its
 * factors" means on the Network screen: the band is the headline, these are the
 * reasons, and the raw score never appears at all.
 */
export function healthBandFactors(input: {
  lifecycle: string;
  salonStatus: string;
  orderRecencyDays: number | null;
  signal: AccountSignalInput | null;
}): string[] {
  const factors: string[] = [];

  const lifecycleFactor = LIFECYCLE_FACTOR[input.lifecycle];
  if (lifecycleFactor) factors.push(lifecycleFactor);

  if (input.salonStatus === 'onboarding') factors.push('Still in their first weeks open');
  if (input.salonStatus === 'paused') factors.push('Account is paused');

  if (input.orderRecencyDays !== null) {
    if (input.orderRecencyDays > 120) factors.push('No order in more than four months');
    else if (input.orderRecencyDays > 56) factors.push('Ordering slower than their usual cadence');
    else factors.push('Ordering on their usual cadence');
  }

  if (input.signal) {
    const factor = SIGNAL_FACTOR[input.signal.signalType];
    if (factor) factors.push(factor);
  }

  return factors.length > 0 ? factors : ['Nothing outside their normal range'];
}

const LIFECYCLE_FACTOR: Record<string, string> = {
  prospect: 'Not a customer yet',
  new_opening: 'Opened recently',
  established: 'Steady, long-standing account',
  expansion: 'Growing — adding capacity',
  at_risk: 'Trending the wrong way on more than one measure',
  churned: 'Stopped buying',
};

const SIGNAL_FACTOR: Record<string, string> = {
  retail_decline: 'Product sales are sliding',
  expansion_ready: 'Running at capacity in peak hours',
  onboarding_stalled: 'Opened but has not placed a first order',
  reorder_due: 'A usual reorder is overdue',
  membership_churn: 'Memberships are cancelling faster than usual',
  account_dormant: 'No orders and no answer to the last calls',
  multi_location_lift: 'One of their locations is well ahead of the other',
};

function softwareAdoptionFor(status: string, lastActiveAt: string | null): CompassAccountRecord['softwareAdoption'] {
  if (status === 'onboarding') return 'onboarding';
  if (status === 'paused' || status === 'churned') return 'dormant';
  return lastActiveAt ? 'active' : 'dormant';
}

// ---------------------------------------------------------------------------
// Cohort (anonymised, n-gated)
// ---------------------------------------------------------------------------

export interface HealthCohort {
  /** Median health across contributing salons, or null when suppressed. */
  medianHealth: number | null;
  contributorCount: number;
  suppressed: boolean;
  label: string;
}

/**
 * Build the one cohort aggregate the Call List and Network use.
 *
 * Private-tier salons are excluded from the contributor list before the count is
 * taken — a salon that shares nothing must not silently prop up the n that makes
 * everyone else's comparison legal.
 */
export function buildHealthCohort(
  contributors: Array<{ consentTier: ConsentTier; healthScore: number | null }>,
  label = 'salons like them',
): HealthCohort {
  const scores = contributors
    .filter((c) => c.consentTier !== 'private')
    .map((c) => c.healthScore)
    .filter((score): score is number => score !== null)
    .sort((a, b) => a - b);

  const result = filterCohort({ value: median(scores), contributorCount: scores.length });
  if (result.suppressed) {
    return { medianHealth: null, contributorCount: result.contributorCount, suppressed: true, label };
  }
  return {
    medianHealth: result.value,
    contributorCount: result.contributorCount,
    suppressed: false,
    label,
  };
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function healthPeerGap(healthScore: number | null, cohort: HealthCohort): PeerGap {
  const base = {
    metric: 'account_health',
    label: 'Account health vs. peers',
    cohortN: cohort.contributorCount,
    salonValue: healthScore,
  };
  if (cohort.suppressed || cohort.medianHealth === null || healthScore === null) {
    return { ...base, band: 'unknown', cohortValue: null, suppressed: true };
  }
  const delta = healthScore - cohort.medianHealth;
  const band: CompassBand = delta >= 6 ? 'ahead' : delta <= -6 ? 'behind' : 'in_line';
  return { ...base, band, cohortValue: cohort.medianHealth, suppressed: false };
}

// ---------------------------------------------------------------------------
// Signal-driven derivation
// ---------------------------------------------------------------------------

function num(metrics: Record<string, unknown>, key: string): number | null {
  const value = metrics[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function signed(value: number): string {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}`;
}

/**
 * Trend directions implied by a signal. Anything the signal does not speak to
 * stays `unknown` — Compass says "we don't know" rather than "flat", because a
 * rep reading "flat" assumes it was measured.
 */
function trendsFor(signal: AccountSignalInput | null): {
  revenue: TrendDirection;
  membership: TrendDirection;
  retail: CompassBand;
  utilization: CompassBand;
  churn: ChurnRiskBand;
} {
  const base = {
    revenue: 'unknown' as TrendDirection,
    membership: 'unknown' as TrendDirection,
    retail: 'unknown' as CompassBand,
    utilization: 'unknown' as CompassBand,
    churn: 'unknown' as ChurnRiskBand,
  };
  if (!signal) return base;
  const m = signal.metrics;

  switch (signal.signalType) {
    case 'retail_decline':
      return { ...base, revenue: 'down', retail: 'behind', churn: 'moderate' };
    case 'expansion_ready': {
      const util = num(m, 'utilisationPercent');
      return {
        ...base,
        revenue: 'up',
        membership: num(m, 'memberGrowthPercent') !== null ? 'up' : 'unknown',
        utilization: util !== null && util >= 80 ? 'ahead' : 'in_line',
        churn: 'low',
      };
    }
    case 'multi_location_lift':
      return { ...base, revenue: 'up', retail: 'ahead' };
    case 'membership_churn':
      return { ...base, membership: 'down', churn: 'elevated' };
    case 'reorder_due':
      return { ...base, retail: 'behind', churn: 'moderate' };
    case 'onboarding_stalled':
      return { ...base, retail: 'behind', churn: 'moderate' };
    case 'account_dormant':
      return { ...base, revenue: 'down', membership: 'down', retail: 'behind', churn: 'elevated' };
    default:
      return base;
  }
}

/**
 * The 3-up evidence row. Candidates are built from metrics the detector actually
 * emitted; the first three that exist win, and a peer-gap tile backfills so the
 * row is never ragged. Fewer than three real numbers means fewer than three
 * tiles — padding a row with a made-up figure is the one thing this must not do.
 */
export function buildEvidenceTiles(input: {
  signal: AccountSignalInput | null;
  healthBand: HealthBand;
  healthGap: PeerGap;
  orderRecencyDays: number | null;
}): EvidenceTile[] {
  const tiles: EvidenceTile[] = [];
  const signal = input.signal;

  if (signal) {
    const m = signal.metrics;

    switch (signal.signalType) {
      case 'retail_decline': {
        const change = num(m, 'retailChangePercent');
        const weeks = num(m, 'windowWeeks');
        if (change !== null) {
          tiles.push({
            value: `${signed(change)}%`,
            caption: weeks !== null ? `Retail sales, ${weeks} weeks` : 'Retail sales, recent weeks',
            direction: change < 0 ? 'down' : 'up',
          });
        }
        const gap = num(m, 'reorderGapDays');
        if (gap !== null) {
          tiles.push({
            value: `${gap} days`,
            caption: 'Since their last order',
            direction: 'down',
          });
        }
        if (typeof m.siblingSlug === 'string') {
          tiles.push({
            value: 'Behind',
            caption: 'Retail per visit vs. their sister salon',
            direction: 'down',
          });
        }
        break;
      }
      case 'expansion_ready': {
        const util = num(m, 'utilisationPercent');
        if (util !== null) {
          tiles.push({
            value: `${util}%`,
            caption: 'Peak-hour capacity, 6 weeks',
            direction: 'up',
          });
        }
        const waitlist = num(m, 'waitlistCount');
        if (waitlist !== null) {
          tiles.push({ value: String(waitlist), caption: 'People on the waitlist', direction: 'up' });
        }
        const growth = num(m, 'memberGrowthPercent');
        if (growth !== null) {
          tiles.push({ value: `${signed(growth)}%`, caption: 'Member growth', direction: 'up' });
        }
        break;
      }
      case 'multi_location_lift': {
        const delta = num(m, 'retailPerVisitDelta');
        if (delta !== null) {
          tiles.push({
            value: `${signed(delta)}%`,
            caption: 'Retail per visit vs. their other location',
            direction: delta >= 0 ? 'up' : 'down',
          });
        }
        break;
      }
      case 'membership_churn': {
        const churn = num(m, 'churnPercent');
        if (churn !== null) {
          tiles.push({ value: `${churn}%`, caption: 'Memberships cancelling', direction: 'down' });
        }
        const months = num(m, 'monthsRising');
        if (months !== null) {
          tiles.push({ value: String(months), caption: 'Months rising in a row', direction: 'down' });
        }
        break;
      }
      case 'reorder_due': {
        const since = num(m, 'daysSinceLastOrder');
        const cadence = num(m, 'typicalCadenceDays');
        if (since !== null) {
          tiles.push({ value: `${since} days`, caption: 'Since their last order', direction: 'down' });
        }
        if (cadence !== null) {
          tiles.push({ value: `${cadence} days`, caption: 'Their usual cadence', direction: 'flat' });
        }
        if (since !== null && cadence !== null) {
          tiles.push({
            value: `${signed(since - cadence)} days`,
            caption: 'Overdue by',
            direction: 'down',
          });
        }
        break;
      }
      case 'onboarding_stalled': {
        const days = num(m, 'daysOpen');
        if (days !== null) {
          tiles.push({ value: `${days} days`, caption: 'Open so far', direction: 'flat' });
        }
        const orders = num(m, 'ordersPlaced');
        if (orders !== null) {
          tiles.push({ value: String(orders), caption: 'Retail orders placed', direction: 'down' });
        }
        const rooms = num(m, 'roomsInstalled');
        if (rooms !== null) {
          tiles.push({ value: String(rooms), caption: 'Rooms installed and ready', direction: 'up' });
        }
        break;
      }
      case 'account_dormant': {
        const since = num(m, 'daysSinceLastOrder');
        if (since !== null) {
          tiles.push({ value: `${since} days`, caption: 'Since their last order', direction: 'down' });
        }
        const unanswered = num(m, 'unansweredContacts');
        if (unanswered !== null) {
          tiles.push({
            value: String(unanswered),
            caption: 'Calls with no reply',
            direction: 'down',
          });
        }
        break;
      }
      default:
        break;
    }
  }

  // Backfill: the health band against the peer cohort. Real, derived, n-gated.
  if (tiles.length < 3 && !input.healthGap.suppressed) {
    tiles.push({
      value: HEALTH_BAND_LABELS[input.healthBand],
      caption: `Health band · ${input.healthGap.cohortN} salons in the cohort`,
      direction: BAND_DIRECTION[input.healthGap.band],
    });
  }

  if (tiles.length < 3 && input.orderRecencyDays !== null && !tiles.some((t) => t.caption.includes('their last order'))) {
    tiles.push({
      value: `${input.orderRecencyDays} days`,
      caption: 'Since their last order',
      direction: input.orderRecencyDays > 56 ? 'down' : 'flat',
    });
  }

  return tiles.slice(0, 3);
}

const BAND_DIRECTION: Record<CompassBand, TrendDirection> = {
  ahead: 'up',
  behind: 'down',
  in_line: 'flat',
  unknown: 'flat',
};

// ---------------------------------------------------------------------------
// Suggested conversation (DESIGN_SPEC §3.4 SuggestBlock)
// ---------------------------------------------------------------------------

export interface Suggestion {
  /** The bolded lead-in, always the same words so the eye finds it. */
  lead: string;
  /** One or two sentences. Third person, respectful (DESIGN_SPEC §5). */
  body: string;
  /** Playbook this conversation maps to, when one exists. */
  playbookKey: string | null;
}

const SUGGESTION_BY_SIGNAL: Record<string, { body: string; playbookKey: string }> = {
  retail_decline: {
    body: 'Retail merchandising and staff sales coaching. Lead with the number, not the catalogue — ask what changed on the floor.',
    playbookKey: 'retail-reset',
  },
  expansion_ready: {
    body: 'Expansion — they are turning people away at peak. Walk the payback maths on one more room before pitching equipment.',
    playbookKey: 'expansion-conversation',
  },
  onboarding_stalled: {
    body: 'First ninety days. A new salon with no retail order usually means nobody showed them the display kit.',
    playbookKey: 'new-opening-checklist',
  },
  reorder_due: {
    body: 'Overdue reorder. Ask about the month rather than the order — a slipped cadence is usually cash flow, not a competitor.',
    playbookKey: 'reorder-nudge',
  },
  membership_churn: {
    body: 'Membership retention. Three months of rising cancellations is a pattern, not a bad month — ask what members say when they cancel.',
    playbookKey: 'membership-churn',
  },
  account_dormant: {
    body: 'Win-back, in writing. Two unanswered calls means the last approach did not work — change the channel and give them an easy no.',
    playbookKey: 'dormant-winback',
  },
  multi_location_lift: {
    body: 'Cross-location coaching. One of their rooms already works — the conversation is about copying it, not fixing anything.',
    playbookKey: 'retail-reset',
  },
};

export function suggestionFor(
  signal: AccountSignalInput | null,
  extras: { hasOpenDraftOrder?: boolean; coachingRequest?: CoachingRequestSummary | null } = {},
): Suggestion | null {
  if (extras.hasOpenDraftOrder && !signal) {
    return {
      lead: 'Draft order arrived',
      body: 'Built from their own sell-through, with a reason on every line. Confirm it and it ships.',
      playbookKey: null,
    };
  }
  if (!signal) return null;
  const mapped = SUGGESTION_BY_SIGNAL[signal.signalType];
  if (!mapped) return null;
  return { lead: 'Suggested conversation:', body: mapped.body, playbookKey: mapped.playbookKey };
}

// ---------------------------------------------------------------------------
// Status chip + ranking
// ---------------------------------------------------------------------------

export type CallStatus = 'needs_attention' | 'ready_to_grow' | 'order_in' | 'steady';

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  needs_attention: 'Needs attention',
  ready_to_grow: 'Ready to grow',
  order_in: 'Order in',
  steady: 'Steady',
};

export function callStatusFor(input: {
  signal: AccountSignalInput | null;
  hasOpenDraftOrder: boolean;
  healthBand: HealthBand;
}): CallStatus {
  if (input.hasOpenDraftOrder) return 'order_in';
  const type = input.signal?.signalType;
  if (type === 'expansion_ready' || type === 'multi_location_lift') return 'ready_to_grow';
  if (input.signal) return 'needs_attention';
  return input.healthBand === 'needs_attention' ? 'needs_attention' : 'steady';
}

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 100,
  high: 80,
  medium: 55,
  low: 30,
  info: 45,
};

/**
 * "Ranked by what a conversation could change this week" — so the score is
 * severity first (how wrong is it), then how long since anyone spoke to them,
 * then account size as a tiebreak. Deliberately transparent arithmetic: a rep
 * who cannot explain the order stops believing the list.
 */
export function callPriorityScore(input: {
  signal: AccountSignalInput | null;
  hasOpenDraftOrder: boolean;
  hasOpenCoachingRequest: boolean;
  daysSinceContact: number | null;
  annualWholesaleValue: number | null;
  healthBand: HealthBand;
}): number {
  let score = 0;
  if (input.signal) score += SEVERITY_WEIGHT[input.signal.severity] ?? 40;
  // Their own request outranks our detection — PRODUCT_SPEC §14's whole point.
  if (input.hasOpenCoachingRequest) score += 30;
  if (input.hasOpenDraftOrder) score += 25;
  if (input.healthBand === 'needs_attention') score += 10;
  if (input.daysSinceContact !== null) score += Math.min(input.daysSinceContact, 60) / 4;
  if (input.annualWholesaleValue) score += Math.min(input.annualWholesaleValue / 10_000, 10);
  return Math.round(score * 10) / 10;
}

// ---------------------------------------------------------------------------
// The one entry point
// ---------------------------------------------------------------------------

/**
 * Derive, then filter. Callers get `CompassAccountView` and nothing else — there
 * is no exported path that returns the unfiltered record, which is what makes
 * "every Compass read goes through the consent filter" a property of the module
 * rather than a rule people have to remember.
 */
export function deriveAccountView(input: DeriveAccountInput): CompassAccountView {
  const tier = input.consentTier;
  const healthBand = bandForHealth(input.healthScore);
  const healthGap = healthPeerGap(input.healthScore, input.cohort);
  const orderRecencyDays = orderRecencyFrom(input.draftOrders, input.signal);
  const trends = trendsFor(input.signal);

  const record: CompassAccountRecord = {
    salonName: input.salonName,
    region: [input.city, input.region].filter(Boolean).join(', ') || (input.region ?? '—'),
    roomCount: input.roomCount,
    equipmentProfile: input.equipmentProfile,
    softwareAdoption: softwareAdoptionFor(input.salonStatus, input.lastActiveAt),

    consentTier: tier,
    benchmarkParticipant: tier !== 'private',
    lastActiveAt: input.lastActiveAt,

    healthBand,
    revenueTrendDirection: trends.revenue,
    membershipTrendDirection: trends.membership,
    retailAttachmentBand: trends.retail,
    utilizationBand: trends.utilization,
    churnRiskBand: trends.churn,
    orderRecencyDays,
    peerGaps: healthGap.suppressed ? [] : [healthGap],
    signalType: input.signal?.signalType ?? null,
    signalHeadline: input.signal?.headline ?? null,
    evidenceTiles: buildEvidenceTiles({
      signal: input.signal,
      healthBand,
      healthGap,
      orderRecencyDays,
    }),

    coachingRequests: input.coachingRequests,
    draftOrders: input.draftOrders,
  };

  return {
    envelope: input.envelope,
    consentTier: tier,
    // THE choke point. Nothing below this line reaches a screen unfiltered.
    account: filterAccount(tier, record),
  };
}

function orderRecencyFrom(
  draftOrders: DraftOrderSummary[],
  signal: AccountSignalInput | null,
): number | null {
  const fromSignal =
    signal &&
    (num(signal.metrics, 'daysSinceLastOrder') ?? num(signal.metrics, 'reorderGapDays'));
  if (typeof fromSignal === 'number') return fromSignal;
  const submitted = draftOrders
    .map((order) => order.submittedAt)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1);
  if (!submitted) return null;
  const days = Math.floor((Date.now() - new Date(submitted).getTime()) / 86_400_000);
  return days >= 0 ? days : null;
}

/**
 * Health distribution for the Network screen, as bands with their contributor
 * counts. Salons at any tier are counted — a count of accounts is a fact about
 * UVALUX's book of business, not about any salon's numbers — but the BAND of a
 * private-tier salon is not derivable, so it lands in `unknown`.
 */
export function healthDistribution(
  accounts: Array<{ consentTier: ConsentTier; healthScore: number | null }>,
): Array<{ band: HealthBand | 'unknown'; count: number }> {
  const counts = new Map<HealthBand | 'unknown', number>([
    ['thriving', 0],
    ['steady', 0],
    ['needs_attention', 0],
    ['unknown', 0],
  ]);
  for (const account of accounts) {
    const key: HealthBand | 'unknown' = repMaySeeSignals(account.consentTier)
      ? bandForHealth(account.healthScore)
      : 'unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([band, count]) => ({ band, count }));
}

export { MIN_COHORT_SIZE };
