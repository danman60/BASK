/**
 * Customer health — the monitor Nick reacted to in the 2026-08-19 meeting
 * ("the customer health dashboard, the staff health — that's really
 * interesting"), and the Sims-style dwindle Daniel described in the same
 * conversation.
 *
 * ARCHITECTURE IS BORROWED, NOT INVENTED. This is the CommandCentered
 * relationship-health engine (`app/src/lib/allies/health.ts`) re-pointed at
 * salon customers. Its hard-won lesson is carried over verbatim, because it is
 * the trap this file exists to avoid:
 *
 *   Health is NOT derived from sparse activity data — that collapses every
 *   quiet customer to zero and the board becomes a wall of red that nobody
 *   trusts. Instead health is BASELINE-ANCHORED:
 *
 *     overall = baseline        (what this relationship is worth at rest —
 *                                a member starts higher than a walk-in)
 *             + visitBoost      (recent visits, decaying over ~45d)
 *             + signalNudges    (retail bought +, booking coming +,
 *                                payment failed −, membership frozen −)
 *             − staleness       (time since we last saw them — and if we have
 *                                NEVER seen them, time since they signed up)
 *             clamped 0-100
 *
 * Every deduction also emits a RISK FLAG, because a band with no reason is not
 * a reason — the surface has to be able to say "been 63 days, usually buys
 * Hempz" rather than colouring someone amber and shrugging.
 *
 * THE WEIGHTS BELOW ARE A PROPOSAL, NOT AN INDUSTRY STANDARD. They are
 * Daniel's to approve and Nick's or Elaine's to correct — they coach salons
 * daily and we do not. Every constant is named and commented so they can be
 * argued with directly. Run `pnpm health:distribution` to see where real demo
 * customers land before changing one.
 */

const DAY_MS = 1000 * 60 * 60 * 24;

/** Where a relationship sits at rest, before any activity is counted. */
export const BASELINE = {
  /** An active member has already committed money every month. */
  member: 65,
  /** Bought a block of sessions up front — committed, but finite. */
  packageHolder: 55,
  /** Comes in and pays each time. */
  payAsYouGo: 50,
  /** Joined but has not been in yet — neutral, not failing. */
  neverVisited: 50,
} as const;

export type BaselineKind = keyof typeof BASELINE;

/** What a single visit is worth, before decay. Retail attached means more. */
export const VISIT_POINTS = {
  /** A visit that also bought product — the behaviour UVALUX is paid on. */
  withRetail: 8,
  /** A session and nothing else. */
  sessionOnly: 5,
} as const;

/** Tuning constants. Each one is a judgement call, not a measurement. */
export const TUNING = {
  /** A visit's lift decays linearly to nothing across this many days. */
  visitDecayDays: 45,
  /** Ceiling on the short-term lift, so a binge week cannot mask a lapse. */
  visitBoostCap: 30,
  /** Staleness reaches its maximum at this many days since the last visit. */
  stalenessFullDays: 90,
  /** Ceiling on the staleness drain. */
  stalenessCap: 25,
  /** Nick, 2026-08-19: "about half an ounce per tan". An ESTIMATE. */
  ouncesPerTan: 0.5,
} as const;

/** Band cut-offs. Everything above `healthy` is healthy, and so on down. */
export const BANDS = { healthy: 65, slipping: 40 } as const;

export type CustomerHealthBand = 'healthy' | 'slipping' | 'lapsed';

export function bandFor(score: number): CustomerHealthBand {
  if (score >= BANDS.healthy) return 'healthy';
  if (score >= BANDS.slipping) return 'slipping';
  return 'lapsed';
}

export interface CustomerHealthInput {
  baselineKind: BaselineKind;
  /** Manual nudge set by the salon, the way CommandCentered's fader works. */
  manualAdjustment?: number;
  /** Visits, most recent first is fine — order is not relied on. */
  visits: { at: Date; retailAttached: boolean }[];
  /** Last time they bought product, if ever. */
  lastRetailAt?: Date | null;
  /** Next booked appointment in the future, if any. */
  nextBookingAt?: Date | null;
  /**
   * When this person became a customer — `Customer.joinedAt`. This is the
   * staleness anchor for someone with no visit in `visits`: without it a
   * never-visited customer accrued ZERO staleness and sat at exactly their
   * baseline, so an active member who has never walked in scored 65 against a
   * 65 cut-off and rendered GREEN, above every customer who actually came in
   * and paid staleness for it. Omitted/null means we cannot date the
   * relationship at all, and the one thing we do know — that they have never
   * been in — is charged at the full staleness cap rather than at nothing.
   */
  customerSince?: Date | null;
  /** Membership payment state, when they have a membership. */
  membership?: {
    status: 'active' | 'frozen' | 'cancelled';
    paymentFailed: boolean;
  } | null;
  /** Estimated remaining product, from `estimateBottle`. */
  bottle?: BottleEstimate | null;
  now?: Date;
}

export interface CustomerHealth {
  score: number;
  band: CustomerHealthBand;
  baseline: number;
  visitBoost: number;
  signalNudge: number;
  staleness: number;
  /** Machine-readable reasons. The surface turns these into sentences. */
  riskFlags: string[];
  lastVisitAt: Date | null;
  daysSinceLastVisit: number | null;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
const daysBetween = (a: Date, b: Date) => (a.getTime() - b.getTime()) / DAY_MS;

/**
 * Pure compute. Given resolved signals, produce the score and its breakdown.
 * No database, no clock of its own — pass `now` and it is fully deterministic,
 * which is what lets the demo clock move without the board lying.
 */
export function computeCustomerHealth(input: CustomerHealthInput): CustomerHealth {
  const now = input.now ?? new Date();
  const riskFlags: string[] = [];
  const baseline = BASELINE[input.baselineKind];

  const lastVisitAt =
    input.visits.length > 0
      ? new Date(Math.max(...input.visits.map((v) => v.at.getTime())))
      : null;

  // ── visit boost: recent visits lift, decaying to nothing by ~45 days ──
  let visitBoost = 0;
  for (const visit of input.visits) {
    const daysSince = Math.max(0, daysBetween(now, visit.at));
    if (daysSince >= TUNING.visitDecayDays) continue;
    const decay = 1 - daysSince / TUNING.visitDecayDays;
    visitBoost += (visit.retailAttached ? VISIT_POINTS.withRetail : VISIT_POINTS.sessionOnly) * decay;
  }
  visitBoost = Math.min(TUNING.visitBoostCap, visitBoost);

  // ── signal nudges from things that actually happened ──
  let signalNudge = 0;

  if (input.lastRetailAt) {
    const days = daysBetween(now, input.lastRetailAt);
    if (days >= 0 && days <= 30) signalNudge += 6; // bought recently — warm
  }

  if (input.nextBookingAt) {
    const daysOut = daysBetween(input.nextBookingAt, now);
    if (daysOut >= 0 && daysOut <= 14) signalNudge += 8; // already coming back
  }

  if (input.membership) {
    if (input.membership.paymentFailed) {
      signalNudge -= 12;
      riskFlags.push('payment_failed');
    }
    if (input.membership.status === 'frozen') {
      signalNudge -= 10;
      riskFlags.push('membership_frozen');
    }
    if (input.membership.status === 'cancelled') {
      signalNudge -= 15;
      riskFlags.push('membership_cancelled');
    }
  }

  // An empty bottle with no repurchase is the reorder conversation nobody had.
  if (input.bottle?.likelyEmpty) {
    signalNudge -= 4;
    riskFlags.push('bottle_likely_empty');
  }

  // ── staleness: how long since we last saw this person ──
  // The clock we measure from is their last visit. Where there ISN'T one, the
  // clock is how long they have been signed up without ever coming in — silence
  // from someone who has never been in is not neutral, it is the longest
  // silence there is. Charging nothing here put never-visited customers at
  // exactly their baseline, i.e. ABOVE every customer with a real visit history.
  const stalenessFrom = (days: number) =>
    Math.min(TUNING.stalenessCap, (Math.max(0, days) / TUNING.stalenessFullDays) * TUNING.stalenessCap);

  let staleness = 0;
  let daysSinceLastVisit: number | null = null;
  if (lastVisitAt) {
    daysSinceLastVisit = Math.max(0, Math.round(daysBetween(now, lastVisitAt)));
    staleness = stalenessFrom(daysSinceLastVisit);
    if (daysSinceLastVisit >= 30) riskFlags.push('quiet_30d');
    if (daysSinceLastVisit >= 60) riskFlags.push('quiet_60d');
    if (daysSinceLastVisit >= 90) riskFlags.push('quiet_90d');
  } else {
    riskFlags.push('never_visited');
    // No `customerSince` means the caller could not date the relationship. Fall
    // back to the full cap: we still know for certain they have never been in.
    staleness = input.customerSince
      ? stalenessFrom(Math.round(daysBetween(now, input.customerSince)))
      : TUNING.stalenessCap;
  }

  const raw = baseline + (input.manualAdjustment ?? 0) + visitBoost + signalNudge - staleness;
  const score = clamp(raw);

  return {
    score,
    band: bandFor(score),
    baseline,
    visitBoost: Math.round(visitBoost),
    signalNudge: Math.round(signalNudge),
    staleness: Math.round(staleness),
    riskFlags: Array.from(new Set(riskFlags)),
    lastVisitAt,
    daysSinceLastVisit,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottle depletion
// ─────────────────────────────────────────────────────────────────────────────

export interface BottleEstimate {
  /** Ounces we think are left. Never below zero. */
  remainingOz: number;
  /** Portion of the bottle left, 0–1. */
  fractionLeft: number;
  /** Under a quarter left — worth mentioning at the desk. */
  runningLow: boolean;
  /** Our estimate says it is gone. */
  likelyEmpty: boolean;
  /** Tans counted since the purchase that this estimate is based on. */
  tansSincePurchase: number;
}

/**
 * Nick's idea, and the numbers are his: the salon does not track how full a
 * customer's bottle is, but it does track tans taken and when they last bought,
 * and usage runs about half an ounce a tan. So depletion is computable, and the
 * reorder conversation can happen before the customer thinks of it.
 *
 * This is an ESTIMATE built on an average, and every surface that shows it MUST
 * say so. It is a prompt for a human conversation, never a fact about a bottle
 * nobody has looked at.
 */
export function estimateBottle(params: {
  bottleSizeOz: number;
  tansSincePurchase: number;
  ouncesPerTan?: number;
}): BottleEstimate {
  const perTan = params.ouncesPerTan ?? TUNING.ouncesPerTan;
  const used = Math.max(0, params.tansSincePurchase) * perTan;
  const remainingOz = Math.max(0, params.bottleSizeOz - used);
  const fractionLeft = params.bottleSizeOz > 0 ? remainingOz / params.bottleSizeOz : 0;
  return {
    remainingOz: Math.round(remainingOz * 10) / 10,
    fractionLeft: Math.round(fractionLeft * 100) / 100,
    runningLow: fractionLeft > 0 && fractionLeft <= 0.25,
    likelyEmpty: remainingOz <= 0,
    tansSincePurchase: Math.max(0, params.tansSincePurchase),
  };
}

/**
 * Turn flags into the sentence a staff member reads. Grade-7 register, same as
 * the guidance dictionary. Ordered by what matters most at the desk.
 */
export function healthReason(health: CustomerHealth, opts?: { usualProduct?: string }): string {
  const days = health.daysSinceLastVisit;
  if (health.riskFlags.includes('payment_failed')) {
    return 'Their last membership payment did not go through.';
  }
  if (health.riskFlags.includes('membership_frozen')) return 'Their membership is on hold.';
  if (health.riskFlags.includes('membership_cancelled')) return 'They cancelled their membership.';
  if (health.riskFlags.includes('never_visited')) return 'Signed up but has not been in yet.';
  if (days !== null && days >= 30) {
    const usual = opts?.usualProduct ? ` They usually buy ${opts.usualProduct}.` : '';
    return `It has been ${days} days since their last visit.${usual}`;
  }
  if (health.riskFlags.includes('bottle_likely_empty')) {
    return 'By our estimate they have run out of product.';
  }
  return 'Coming in regularly.';
}
