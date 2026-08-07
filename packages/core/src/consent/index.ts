/**
 * The consent filter — the single choke point every Compass surface reads through.
 *
 * IMPLEMENTATION_SPEC §2: "Compass routers read through packages/core/consent.ts,
 * which maps salon consent tier → derivable fields. One choke point, unit-tested
 * hard." PRODUCT_SPEC §15 makes the same promise to salons in plain language, and
 * §38 makes it the moat: the dealer-network product only works if salons trust it.
 *
 * The rules, stated once:
 *
 *   private     — the salon contributes nothing and receives nothing. It does not
 *                 appear in cohorts, and Compass sees name + region + software
 *                 adoption only (the facts UVALUX already has from selling to them).
 *   benchmarks  — the salon's numbers feed anonymised cohort aggregates and it gets
 *                 percentile comparisons back. Compass still sees NO per-salon
 *                 business figures — only that it participates.
 *   coaching    — Compass additionally sees DERIVED per-salon business signals:
 *                 banded trends, directions, peer gaps, order recency. Never raw
 *                 transactions, never customer records, never a name or contact.
 *
 * Two invariants hold at every tier and are tested as such:
 *   1. Customer-level data NEVER crosses into Compass. There is no tier that
 *      unlocks it; the field list simply has no place to put it.
 *   2. Nothing here returns a raw amount for a salon's revenue. Coaching-tier
 *      figures are bands and percentage deltas — enough to start a conversation,
 *      not enough to reconstruct the books.
 *
 * Cohort aggregates additionally require a minimum contributor count so a small
 * cohort cannot be reverse-engineered into one salon's numbers (PRODUCT_SPEC §13).
 */

export const CONSENT_TIERS = ['private', 'benchmarks', 'coaching'] as const;
export type ConsentTier = (typeof CONSENT_TIERS)[number];

/** Below this many contributing salons, a cohort aggregate is suppressed. */
export const MIN_COHORT_SIZE = 8;

/**
 * Every field Compass could ever want about one salon, grouped by what it reveals.
 * The filter's whole job is deciding which of these a tier permits.
 */
export const COMPASS_FIELDS = {
  /** Facts UVALUX already holds from being their supplier. */
  identity: ['salonName', 'region', 'roomCount', 'equipmentProfile', 'softwareAdoption'],
  /** Whether the salon takes part — not what its numbers are. */
  participation: ['consentTier', 'benchmarkParticipant', 'lastActiveAt'],
  /** Derived, banded business signals. Coaching tier only. */
  signals: [
    'healthBand',
    'revenueTrendDirection',
    'membershipTrendDirection',
    'retailAttachmentBand',
    'peerGaps',
    'utilizationBand',
    'orderRecencyDays',
    'churnRiskBand',
  ],
  /** Things the salon asked for. Coaching tier only — it is their own request. */
  requests: ['coachingRequests', 'draftOrders'],
} as const;

export type CompassFieldGroup = keyof typeof COMPASS_FIELDS;

const TIER_GROUPS: Record<ConsentTier, readonly CompassFieldGroup[]> = {
  private: ['identity'],
  benchmarks: ['identity', 'participation'],
  coaching: ['identity', 'participation', 'signals', 'requests'],
};

/** Field groups a tier permits, in a stable order. */
export function allowedGroups(tier: ConsentTier): readonly CompassFieldGroup[] {
  return TIER_GROUPS[tier];
}

/** Flat allow-list of field names for a tier. */
export function allowedFields(tier: ConsentTier): readonly string[] {
  return allowedGroups(tier).flatMap((group) => COMPASS_FIELDS[group]);
}

export function canSee(tier: ConsentTier, field: string): boolean {
  return allowedFields(tier).includes(field);
}

/** Does this salon's data feed anonymised cohort aggregates? */
export function contributesToCohorts(tier: ConsentTier): boolean {
  return tier !== 'private';
}

/** Does this salon receive peer benchmarks in its own app? */
export function receivesBenchmarks(tier: ConsentTier): boolean {
  return tier !== 'private';
}

/** May a UVALUX rep see per-salon business signals for this salon? */
export function repMaySeeSignals(tier: ConsentTier): boolean {
  return tier === 'coaching';
}

/**
 * Strip an account record to what `tier` permits.
 *
 * Unknown keys are dropped, not passed through: a filter that forwards fields it
 * has never heard of is not a filter. When a new signal is added upstream it must
 * be declared in COMPASS_FIELDS before Compass can render it — which is the
 * review step this design exists to force.
 */
export function filterAccount<T extends Record<string, unknown>>(
  tier: ConsentTier,
  account: T,
): Partial<T> {
  const allowed = new Set(allowedFields(tier));
  const out: Partial<T> = {};
  for (const key of Object.keys(account) as (keyof T & string)[]) {
    if (allowed.has(key)) out[key] = account[key];
  }
  return out;
}

export interface CohortAggregate<V> {
  value: V;
  contributorCount: number;
}

export type CohortResult<V> =
  | { suppressed: false; value: V; contributorCount: number }
  | { suppressed: true; reason: 'below-min-cohort'; contributorCount: number; minimum: number };

/**
 * Gate a cohort aggregate on contributor count. A cohort of three salons is a
 * cohort in which every member can identify the others.
 */
export function filterCohort<V>(aggregate: CohortAggregate<V>): CohortResult<V> {
  if (aggregate.contributorCount < MIN_COHORT_SIZE) {
    return {
      suppressed: true,
      reason: 'below-min-cohort',
      contributorCount: aggregate.contributorCount,
      minimum: MIN_COHORT_SIZE,
    };
  }
  return {
    suppressed: false,
    value: aggregate.value,
    contributorCount: aggregate.contributorCount,
  };
}

/**
 * What the salon is shown on its own "What UVALUX sees" screen (PRODUCT_SPEC §15).
 * Deliberately derived from the same tables the filter uses, so the screen cannot
 * drift from the behaviour it describes.
 */
export interface ConsentDisclosure {
  tier: ConsentTier;
  uvaluxSees: readonly string[];
  uvaluxNeverSees: readonly string[];
  youReceive: readonly string[];
}

const NEVER_SEEN = [
  'customerNames',
  'customerContacts',
  'individualTransactions',
  'staffPersonalRecords',
  'rawRevenueAmounts',
] as const;

export function describeConsent(tier: ConsentTier): ConsentDisclosure {
  return {
    tier,
    uvaluxSees: allowedFields(tier),
    uvaluxNeverSees: NEVER_SEEN,
    youReceive: receivesBenchmarks(tier)
      ? ['peerBenchmarks', 'opportunitySizing', tier === 'coaching' ? 'coachingSupport' : null].filter(
          (value): value is string => value !== null,
        )
      : [],
  };
}
