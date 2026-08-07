/**
 * Dataset constants — PRODUCT_SPEC §20 turned into numbers.
 *
 * These are the dials the story arcs are tuned against. Changing one changes
 * what the demo says, so each carries the beat it serves.
 */

import type { DateOnly } from '@bask/core';

/**
 * Day zero. A Thursday, matching the Daybreak mockup's `Thursday, August 6`
 * eyebrow and leaving next Tuesday (the 11th) five days out — the demo-clock
 * payoff in PRODUCT_SPEC §21 Act 1 beat 4.
 */
export const DAY_ZERO: DateOnly = '2026-08-06';

/** History depth. 90 days of visits/sales/campaign history per §20. */
export const HISTORY_DAYS = 90;

/** Default fixture seed. Also the value stored in `demo_state.seed`. */
export const DEFAULT_SEED = 'sunset-ridge-v1';

export const HERO_SALON = {
  slug: 'sunset-ridge',
  name: 'Sunset Ridge Tanning & Wellness',
  city: 'Kelowna',
  region: 'BC',
  country: 'CA',
  postalCode: 'V1Y 6H2',
  phone: '(250) 555-0142',
  email: 'hello@sunsetridgetanning.ca',
  timezone: 'America/Vancouver',
  ownerFirstName: 'Dana',
  ownerLastName: 'Whitfield',
} as const;

export const CURRENCY = 'CAD';

/**
 * Opening hours by weekday (0 = Sunday), salon-local, `[open, close)`.
 *
 * Sunday is deliberately short. Modelling it as "open 9–9 but empty" would make
 * Sunday afternoon the softest window in the dataset and steal the Tuesday
 * beat; a salon that simply opens later has the same real-world truth without
 * the false finding.
 */
export const OPEN_HOURS: ReadonlyArray<readonly [number, number]> = [
  [11, 17], // Sunday
  [9, 21], // Monday
  [9, 21], // Tuesday
  [9, 21], // Wednesday
  [9, 21], // Thursday
  [9, 21], // Friday
  [9, 19], // Saturday
];

export function isOpen(weekday: number, hour: number): boolean {
  const [open, close] = OPEN_HOURS[weekday]!;
  return hour >= open && hour < close;
}

/**
 * Bookable slots per room per hour. Blended across the room mix: a 12-minute UV
 * bed plus 5 minutes of cleaning turns over ~3.5×/hour, a 25-minute
 * hydromassage ~2×. This is what `sessionsPossible` is computed against.
 */
export const SLOTS_PER_ROOM_HOUR = 2.5;

/** Membership tiers. The four recoverable failures sum to exactly $284/mo —
 *  one gold + one silver + two bronze — which is the number the mockup quotes. */
export const MEMBERSHIP_TIERS = [
  { key: 'bronze', label: 'Bronze', monthlyPrice: 45, share: 0.42 },
  { key: 'silver', label: 'Silver', monthlyPrice: 79, share: 0.38 },
  { key: 'gold', label: 'Gold', monthlyPrice: 115, share: 0.2 },
] as const;

// ---------------------------------------------------------------------------
// Story arcs (PRODUCT_SPEC §20)
// ---------------------------------------------------------------------------

export const ARCS = {
  /**
   * Retail attachment 21% → 15% over three weeks, concentrated on two staff.
   *
   * Shape matters as much as the endpoints. A pure linear ramp would make the
   * trailing 14-day average ~18%, not 15%, and the card would quote a number
   * the owner could not find anywhere. So the rate ramps down over 14 days and
   * then *holds* at the floor for the 14 days the detector measures — which is
   * also how a real habit change behaves.
   */
  attachment: {
    /**
     * Slightly above 21% because sampling pulls the realised rate down a few
     * tenths; the measured baseline lands on 21%, which is what the card quotes.
     */
    baselineRate: 0.225,
    /** Days the decline ramps over, ending `flatDays` ago. */
    rampDays: 14,
    /** Days the rate has been sitting at the floor. The measurement window. */
    flatDays: 14,
    /** The two staffers the decline sits on. */
    laggardStaffKeys: ['tamsin', 'reece'] as const,
    /** Where the laggards land. */
    laggardFloorRate: 0.05,
    /**
     * Where everyone else lands. The laggards cover ~17% of visits, so the
     * blended floor is 0.16·0.05 + 0.84·0.166 ≈ 15% — the number in the mockup.
     */
    othersFloorRate: 0.166,
  },

  /** Tuesday 1–5 pm chronically soft. */
  softWindow: {
    weekday: 2, // Tuesday
    startHour: 13,
    endHour: 17,
    /**
     * Traffic multiplier inside the window. Visits are normalised across the
     * day, so damping these hours pushes the traffic elsewhere rather than
     * deleting it — which is what actually happens when regulars avoid a slot.
     */
    trafficMultiplier: 0.6,
  },

  /** 7 failed payments, 4 recoverable. */
  failedPayments: {
    total: 7,
    recoverable: 4,
    /** Tiers for the four recoverable, in order: 115 + 79 + 45 + 45 = $284/mo. */
    recoverableTiers: ['gold', 'silver', 'bronze', 'bronze'] as const,
    unrecoverableTiers: ['silver', 'bronze', 'gold'] as const,
  },

  /** Cabana Bronzer ~8 days from stockout. */
  lowStock: { sku: 'BSK-10007', targetDaysRemaining: 7.5 },

  /** Fiji Blend overstocked. */
  overstock: { sku: 'BSK-10021', onHand: 34 },

  /**
   * Spray tans trending +22%.
   *
   * Expressed as extra bookings per day at the top of the ramp, which averages
   * out to `peakExtraPerDay × 0.46` across the ramp. About 130 spray visits land
   * in a 14-day window from ordinary demand, so ~55 extra reads as the +22%
   * PRODUCT_SPEC §20 asks for.
   */
  sprayTrend: { peakExtraPerDay: 10.6, rampDays: 14 },

  /** One cancellation cluster, ~45 days back. */
  cancellationCluster: { daysAgo: 45, count: 5, windowDays: 6 },

  /**
   * The demo-clock payoff: a campaign staged for next Tuesday. Advancing the
   * clock past it settles the campaign into real bookings — "Yesterday was your
   * best Tuesday in 6 weeks."
   */
  tuesdayCampaign: {
    /** Days after DAY_ZERO the campaign sends. 2026-08-11 is a Tuesday. */
    sendOffsetDays: 5,
    segmentKey: 'lapsed_30d',
    bookings: 9,
    /** Revenue the 9 bookings produce, before retail attachment. */
    revenue: 310,
  },
} as const;

/** Target dataset sizes (PRODUCT_SPEC §20: ~420 customers, ~120 members). */
export const TARGETS = {
  customers: 420,
  members: 120,
  staff: 12,
  skus: 40,
  compassAccounts: 12,
  /**
   * Average visits per open day, before weekday/hour weighting.
   *
   * Set so a busy evening hour runs ~70% of bookable slots and a normal
   * afternoon ~45–50%. Anything much lower and the whole week reads as "soft
   * capacity", which would drown the one soft window that is actually a finding.
   */
  visitsPerDay: 105,
} as const;

/** Relative traffic by weekday (0 = Sunday). Saturday is the peak. */
export const WEEKDAY_TRAFFIC: readonly number[] = [0.62, 0.95, 0.9, 1.0, 1.05, 1.15, 0.9];

/** Relative traffic by hour of day. Evenings carry the load. */
export const HOUR_TRAFFIC: Readonly<Record<number, number>> = {
  9: 0.5,
  10: 0.7,
  11: 0.85,
  12: 1.0,
  13: 1.0,
  14: 0.95,
  15: 0.95,
  16: 1.05,
  17: 1.2,
  18: 1.35,
  19: 1.25,
  20: 0.9,
};
