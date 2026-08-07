/**
 * Rules engine v1 — threshold + trend-break detectors (M0 step 5).
 *
 * Every detector is a pure function of `SalonFacts`: no clock reads, no I/O, no
 * randomness. That is what makes `demo:reset && demo:advance` reproduce the
 * PRODUCT_SPEC §20 story arcs identically every time, and what makes each arc
 * unit-testable in isolation.
 *
 * Each detector owns one beat of the pitch:
 *   attachment slip  → the Studio campaign loop
 *   failed payments  → the recovery loop
 *   soft capacity    → the Tuesday promo, and the demo-clock payoff
 *   low stock        → the UVALUX draft order
 *   overstock        → the counterweight that proves it isn't just "buy more"
 *   anomaly band     → the "we noticed before you did" beat
 */

import {
  buildComparison,
  buildMetric,
  buildWindow,
  formatCurrency,
  round,
  type Evidence,
  type EvidenceSeries,
  EVIDENCE_VERSION,
} from '../evidence';
import { addDays, weekdayName } from '../clock';
import { daypartForHour, type CapacitySlotFacts, type ProductStockFacts } from './facts';
import type { Detector, InsightSeverity } from './types';

// ---------------------------------------------------------------------------
// Thresholds. Tuned so the seeded arcs fire and ordinary noise does not.
// ---------------------------------------------------------------------------

export const THRESHOLDS = {
  /** Percentage points of attachment drop before it is a finding. */
  attachmentDropPoints: 3,
  /** A staffer must be this far below the salon rate to be named. */
  staffGapPoints: 6,
  /** Minimum visits behind a staff claim before we'll assert it. */
  minVisitsForClaim: 20,
  /**
   * Minimum visits behind a *slot* claim. Higher than the staff floor because
   * weekday × daypart buckets are small, and a 17-visit bucket will happily
   * produce a 6% attachment rate out of pure noise.
   */
  minSlotVisitsForClaim: 50,
  /** Utilisation at or under this, sustained, is a candidate soft window. */
  softUtilisation: 45,
  /**
   * A slot must also be this far below the *same hour on other days* to count.
   *
   * Absolute utilisation alone finds 9 a.m., which is quiet everywhere and is
   * therefore not news. A Tuesday afternoon running well under every other
   * afternoon is a finding the owner can act on.
   */
  softRelativeToHourNorm: 0.78,
  /** Consecutive occurrences of the weekday before "chronically" is fair. */
  minSoftOccurrences: 3,
  /** Days of cover at or under this is a stockout risk. */
  lowStockDays: 14,
  /** Days of cover at or over this, with real stock on hand, is overstock. */
  overstockDays: 120,
  /** Category movement beyond this is worth surfacing on its own. */
  anomalyPercent: 20,
  /** Money below this never reaches the owner. */
  minImpact: 40,
} as const;

// ---------------------------------------------------------------------------
// 1. Retail attachment slip — 21% → 15% over three weeks, on two staffers.
// ---------------------------------------------------------------------------

export const attachmentSlipDetector: Detector = {
  type: 'retail_attachment_slip',
  run(facts, ctx) {
    const a = facts.attachment;
    const dropPoints = round(a.baselineRate - a.currentRate, 2);
    if (dropPoints < THRESHOLDS.attachmentDropPoints) return [];

    const currentWindow = buildWindow(
      `last ${a.currentDays} days`,
      addDays(ctx.today, -a.currentDays),
      addDays(ctx.today, -1),
      a.currentDays,
    );
    const baselineWindow = buildWindow(
      `the ${a.baselineDays} days before that`,
      addDays(ctx.today, -(a.currentDays + a.baselineDays)),
      addDays(ctx.today, -(a.currentDays + 1)),
      a.baselineDays,
    );

    // Money: the visits that would have attached at the old rate, but didn't,
    // times what an attached visit is worth. Stated per month because that is
    // how an owner thinks about it.
    const lostAttachesPerDay = (dropPoints / 100) * a.visitsPerDay;
    const monthlyImpact = round(lostAttachesPerDay * a.averageAttachedSpend * 30, 0);

    const laggards = a.byStaff
      .filter(
        (s) =>
          s.currentVisits >= THRESHOLDS.minVisitsForClaim &&
          a.currentRate - s.currentRate >= THRESHOLDS.staffGapPoints,
      )
      .sort((x, y) => x.currentRate - y.currentRate);

    // Sorted by how far the slot *moved*, not by how low it is. "Where did this
    // change?" is the owner's question; a slot that was always quiet is not an
    // answer to it.
    const softSlots = a.bySlot
      .filter(
        (s) =>
          s.visits >= THRESHOLDS.minSlotVisitsForClaim &&
          s.baselineRate - s.currentRate >= THRESHOLDS.attachmentDropPoints,
      )
      .sort((x, y) => y.baselineRate - y.currentRate - (x.baselineRate - x.currentRate))
      .slice(0, 2);

    const factors: Evidence['contributingFactors'] = [];
    for (const staff of laggards.slice(0, 2)) {
      factors.push({
        key: `staff:${staff.staffId}`,
        label: staff.name,
        detail: `${staff.name}'s shifts attached ${round(staff.currentRate, 0)}% of visits, down from ${round(staff.baselineRate, 0)}%.`,
        share: round(
          Math.min(1, (staff.baselineRate - staff.currentRate) / Math.max(dropPoints, 0.01) / Math.max(laggards.length, 1)),
          2,
        ),
        direction: 'down',
      });
    }
    for (const slot of softSlots) {
      factors.push({
        key: `slot:${slot.weekday}:${slot.daypart}`,
        label: `${weekdayNameFor(slot.weekday)} ${slot.daypart}`,
        detail: `${weekdayNameFor(slot.weekday)} ${slot.daypart} shifts attached ${round(slot.currentRate, 0)}% of visits.`,
        share: null,
        direction: 'down',
      });
    }

    const series: EvidenceSeries | null =
      a.daily.length >= 2
        ? {
            label: 'Attachment rate',
            unit: 'percent',
            points: a.daily.map((p) => ({ at: p.at, value: round(p.value, 2) })),
          }
        : null;

    const where = describeWhere(laggards.map((s) => s.name), softSlots);
    const sentence =
      `Lotion sales per visit fell from **${round(a.baselineRate, 0)}% to ${round(a.currentRate, 0)}%** ` +
      `over ${describeSpan(a.currentDays)}${where}. Traffic is unchanged.`;

    const evidence: Evidence = {
      version: EVIDENCE_VERSION,
      metric: buildMetric(
        'retail_attachment_rate',
        'Visits that included a product',
        'percent',
        round(a.currentRate, 1),
      ),
      window: currentWindow,
      comparison: buildComparison({
        baseline: buildMetric(
          'retail_attachment_rate',
          'Visits that included a product',
          'percent',
          round(a.baselineRate, 1),
        ),
        baselineWindow,
        current: buildMetric(
          'retail_attachment_rate',
          'Visits that included a product',
          'percent',
          round(a.currentRate, 1),
        ),
        currentWindow,
        goodDirection: 'up',
      }),
      impact: {
        amount: monthlyImpact,
        currency: ctx.currency,
        cadence: 'per_month',
        basis:
          `${round(lostAttachesPerDay, 1)} fewer product sales a day at ` +
          `${formatCurrency(a.averageAttachedSpend, ctx.currency)} each, over 30 days.`,
        confidence: laggards.length > 0 ? 'high' : 'medium',
        chipLabel: `≈ ${formatCurrency(monthlyImpact, ctx.currency)}/mo if it holds`,
        tone: 'cost',
      },
      contributingFactors: factors,
      series,
      sentence,
    };

    return [
      {
        dedupeKey: `${ctx.salonId}:retail_attachment_slip`,
        type: 'retail_attachment_slip',
        severity: severityForMoney(monthlyImpact, { high: 500, medium: 200 }),
        title: 'Retail attachment is slipping',
        summary: `Product attachment fell ${dropPoints} points over ${describeSpan(a.currentDays)}.`,
        evidence,
        impactEstimate: monthlyImpact,
        impactCurrency: ctx.currency,
        // "Fix this" opens Studio pre-filled (PRODUCT_SPEC §21 Act 1). The
        // quiet button is what explains; the primary has to *do* something, or
        // the card offers the same action twice.
        linkedActionType: 'create_campaign',
        linkedActionRef: {
          metric: 'retail_attachment_rate',
          segmentKey: 'big_spenders',
          staffIds: laggards.map((s) => s.staffId),
          focus: 'retail_attachment',
        },
        primaryActionLabel: 'Fix this',
        forDate: ctx.today,
      },
    ];
  },
};

// ---------------------------------------------------------------------------
// 2. Failed payments — 7 failed, 4 recoverable.
// ---------------------------------------------------------------------------

/** Recoverable = they still come in, and they've bounced back before. */
export function isRecoverable(m: {
  daysSinceLastVisit: number | null;
  hasRecoveredBefore: boolean;
  failedAttempts: number;
}): boolean {
  const recentlySeen = m.daysSinceLastVisit !== null && m.daysSinceLastVisit <= 21;
  return recentlySeen && m.hasRecoveredBefore && m.failedAttempts <= 2;
}

export const failedPaymentsDetector: Detector = {
  type: 'failed_payments',
  run(facts, ctx) {
    const all = facts.failedPayments.memberships;
    if (all.length === 0) return [];

    const recoverable = all.filter(isRecoverable);
    const atRisk = round(
      all.reduce((sum, m) => sum + m.monthlyPrice, 0),
      2,
    );
    const recoverableValue = round(
      recoverable.reduce((sum, m) => sum + m.monthlyPrice, 0),
      2,
    );
    if (recoverableValue < ctx.minImpact) return [];

    const window = buildWindow('this week', addDays(ctx.today, -7), ctx.today, 7);

    const sentence =
      `${recoverable.length === 4 ? 'Four' : String(recoverable.length)} look recoverable — ` +
      `they visited recently and have recovered before. That's ` +
      `**${formatCurrency(recoverableValue, ctx.currency)} of monthly revenue** worth keeping.`;

    const evidence: Evidence = {
      version: EVIDENCE_VERSION,
      metric: buildMetric('failed_memberships', 'Memberships that failed payment', 'count', all.length),
      window,
      comparison: null,
      impact: {
        amount: recoverableValue,
        currency: ctx.currency,
        cadence: 'per_month',
        basis: `${recoverable.length} of ${all.length} failed memberships, at their current monthly price.`,
        confidence: 'high',
        chipLabel: `${formatCurrency(recoverableValue, ctx.currency)}/mo recoverable`,
        tone: 'cost',
      },
      contributingFactors: [
        {
          key: 'recoverable',
          label: 'Likely to recover',
          detail: `${recoverable.length} visited in the last three weeks and have recovered from a failed payment before.`,
          share: round(recoverableValue / Math.max(atRisk, 0.01), 2),
          direction: null,
        },
        {
          key: 'unlikely',
          label: 'Quietly gone',
          detail: `${all.length - recoverable.length} haven't been in recently — worth a different conversation.`,
          share: round(1 - recoverableValue / Math.max(atRisk, 0.01), 2),
          direction: null,
        },
      ],
      series: null,
      sentence,
    };

    return [
      {
        dedupeKey: `${ctx.salonId}:failed_payments`,
        type: 'failed_payments',
        severity: severityForMoney(recoverableValue, { high: 250, medium: 100 }),
        title: `${all.length} memberships failed payment this week`,
        summary: `${recoverable.length} of ${all.length} look recoverable.`,
        evidence,
        impactEstimate: recoverableValue,
        impactCurrency: ctx.currency,
        linkedActionType: 'recover_payment',
        linkedActionRef: {
          membershipIds: recoverable.map((m) => m.membershipId),
          customerIds: recoverable.map((m) => m.customerId),
        },
        primaryActionLabel: 'Send recovery messages',
        forDate: ctx.today,
      },
    ];
  },
};

// ---------------------------------------------------------------------------
// 3. Soft capacity — Tuesday 1–5 pm.
// ---------------------------------------------------------------------------

export const softCapacityDetector: Detector = {
  type: 'soft_capacity',
  run(facts, ctx) {
    // What this hour normally does, across every weekday it is open. Comparing
    // a slot to its own hour is what separates "Tuesday afternoon is soft" from
    // "mornings are quiet", and only the first is worth an owner's attention.
    const hourNorm = new Map<number, number>();
    for (const hour of new Set(facts.capacity.slots.map((s) => s.hour))) {
      const peers = facts.capacity.slots.filter((s) => s.hour === hour);
      const runTotal = peers.reduce((sum, s) => sum + s.sessionsRun, 0);
      const possibleTotal = peers.reduce((sum, s) => sum + s.sessionsPossible, 0);
      hourNorm.set(hour, possibleTotal === 0 ? 0 : (runTotal / possibleTotal) * 100);
    }

    const soft = facts.capacity.slots.filter((s) => {
      if (s.sessionsPossible < THRESHOLDS.minSoftOccurrences) return false;
      if (s.utilisation > THRESHOLDS.softUtilisation) return false;
      const norm = hourNorm.get(s.hour) ?? 0;
      if (norm <= 0) return false;
      return s.utilisation / norm <= THRESHOLDS.softRelativeToHourNorm;
    });
    if (soft.length === 0) return [];

    const best = pickSoftestRun(soft);
    if (!best) return [];

    const emptySessions = best.slots.reduce(
      (sum, s) => sum + (s.sessionsPossible - s.sessionsRun),
      0,
    );
    const occurrences = Math.max(
      1,
      Math.round(best.slots[0]!.sessionsPossible / Math.max(facts.capacity.roomCount, 1)),
    );
    const emptyPerWeek = emptySessions / Math.max(occurrences, 1);
    const averageValue = mean(best.slots.map((s) => s.averageSessionValue));

    // Realistically a promo fills a slice of a soft window, not all of it.
    const fillRate = 0.25;
    const weeklyImpact = round(emptyPerWeek * fillRate * averageValue, 0);
    if (weeklyImpact < ctx.minImpact) return [];

    const unbooked = round(100 - mean(best.slots.map((s) => s.utilisation)), 0);
    const label = `${weekdayNameFor(best.weekday)} ${formatHourRange(best.startHour, best.endHour)}`;
    const nextOccurrence = nextWeekday(ctx.today, best.weekday);

    const sentence =
      `${formatHourRange(best.startHour, best.endHour)} is **${unbooked}% unbooked** — ` +
      `historically your cheapest hours to fill. ` +
      `A small offer to lapsed regulars usually books ${Math.max(4, Math.round(emptyPerWeek * 0.2))}–${Math.max(6, Math.round(emptyPerWeek * 0.4))} visits.`;

    const evidence: Evidence = {
      version: EVIDENCE_VERSION,
      metric: buildMetric(
        'slot_utilisation',
        `${label} room use`,
        'percent',
        round(100 - unbooked, 1),
      ),
      window: buildWindow(
        `last ${facts.windowDays} days`,
        addDays(ctx.today, -facts.windowDays),
        addDays(ctx.today, -1),
        facts.windowDays,
      ),
      comparison: null,
      impact: {
        amount: weeklyImpact,
        currency: ctx.currency,
        cadence: 'per_week',
        basis:
          `${round(emptyPerWeek, 0)} empty room-hours each ${weekdayNameFor(best.weekday)}, ` +
          `filling one in four at ${formatCurrency(averageValue, ctx.currency)} a visit.`,
        confidence: 'medium',
        chipLabel: 'Opportunity',
        tone: 'opportunity',
      },
      contributingFactors: best.slots.map((s) => ({
        key: `hour:${s.hour}`,
        label: formatHour(s.hour),
        detail: `${round(s.utilisation, 0)}% of rooms in use at ${formatHour(s.hour)}.`,
        share: null,
        direction: 'down' as const,
      })),
      series: null,
      sentence,
    };

    return [
      {
        dedupeKey: `${ctx.salonId}:soft_capacity:${best.weekday}:${best.startHour}`,
        type: 'soft_capacity',
        severity: 'info',
        title: `${weekdayNameFor(best.weekday)} ${daypartForHour(best.startHour)} is wide open next week`,
        summary: `${formatHourRange(best.startHour, best.endHour)} runs ${unbooked}% unbooked.`,
        evidence,
        impactEstimate: weeklyImpact,
        impactCurrency: ctx.currency,
        linkedActionType: 'create_campaign',
        linkedActionRef: {
          segmentKey: 'lapsed_30d',
          weekday: best.weekday,
          startHour: best.startHour,
          endHour: best.endHour,
          targetDate: nextOccurrence,
        },
        primaryActionLabel: `Create a ${weekdayNameFor(best.weekday)} promo`,
        forDate: ctx.today,
      },
    ];
  },
};

// ---------------------------------------------------------------------------
// 4. Low stock — Cabana Bronzer, 8 days out.
// ---------------------------------------------------------------------------

export const lowStockDetector: Detector = {
  type: 'low_stock',
  run(facts, ctx) {
    const low = facts.stock
      .filter(
        (p) =>
          p.daysRemaining !== null &&
          p.daysRemaining <= THRESHOLDS.lowStockDays &&
          p.dailyVelocity > 0,
      )
      .sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0));

    return low.slice(0, 3).flatMap((p) => {
      const days = p.daysRemaining!;
      // Cost of running dry: what it would have sold in the gap before a
      // reorder lands. Ten days is the assumed UVALUX turnaround.
      const gapDays = Math.max(0, 10 - days);
      const impact = round(gapDays * p.dailyVelocity * p.retailPrice, 0);
      if (impact < ctx.minImpact) return [];

      const suggestedUnits = Math.max(
        p.reorderPoint,
        Math.ceil(p.dailyVelocity * 45 - p.onHand),
      );

      const sentence =
        `**${p.onHand} left** and selling ${round(p.dailyVelocity, 1)} a day — ` +
        `about **${Math.round(days)} days** before you're out. Your last order took around ten days to land.`;

      const evidence: Evidence = {
        version: EVIDENCE_VERSION,
        metric: buildMetric('days_of_cover', 'Days of stock left', 'days', round(days, 1)),
        window: buildWindow(
          `last ${facts.windowDays} days`,
          addDays(ctx.today, -facts.windowDays),
          addDays(ctx.today, -1),
          facts.windowDays,
        ),
        comparison: null,
        impact: {
          amount: impact,
          currency: ctx.currency,
          cadence: 'one_time',
          basis: `${gapDays} days out of stock at ${round(p.dailyVelocity, 1)} units a day, ${formatCurrency(p.retailPrice, ctx.currency)} each.`,
          confidence: 'high',
          chipLabel: `≈ ${formatCurrency(impact, ctx.currency)} of missed sales`,
          tone: 'cost',
        },
        contributingFactors: [
          {
            key: 'velocity',
            label: 'Selling faster than it lands',
            detail: `${p.unitsSoldInWindow} sold in the last ${facts.windowDays} days.`,
            share: null,
            direction: 'up',
          },
        ],
        series: null,
        sentence,
      };

      return [
        {
          dedupeKey: `${ctx.salonId}:low_stock:${p.productId}`,
          type: 'low_stock' as const,
          severity: days <= 7 ? ('high' as InsightSeverity) : ('medium' as InsightSeverity),
          title: `${p.name} runs out in about ${Math.round(days)} days`,
          summary: `${p.onHand} on hand, ${round(p.dailyVelocity, 1)} sold a day.`,
          evidence,
          impactEstimate: impact,
          impactCurrency: ctx.currency,
          linkedActionType: 'draft_order' as const,
          linkedActionRef: {
            productId: p.productId,
            sku: p.sku,
            suggestedUnits,
            reason: `${Math.round(days)} days of stock left at current sell-through`,
          },
          primaryActionLabel: 'Add to UVALUX order',
          forDate: ctx.today,
        },
      ];
    });
  },
};

// ---------------------------------------------------------------------------
// 5. Overstock — Fiji Blend.
// ---------------------------------------------------------------------------

export const overstockDetector: Detector = {
  type: 'overstock',
  run(facts, ctx) {
    const over = facts.stock
      .filter((p) => p.onHand >= 6 && isOverstocked(p))
      .sort((a, b) => tiedCapital(b) - tiedCapital(a));

    return over.slice(0, 2).flatMap((p) => {
      const capital = round(tiedCapital(p), 0);
      if (capital < ctx.minImpact) return [];
      const days = p.daysRemaining;

      const coverText =
        days === null
          ? "nothing has sold in the window we can see"
          : `that's about **${Math.round(days)} days** of cover`;
      const sentence =
        `**${p.onHand} sitting on the shelf** and ${coverText}. ` +
        `${formatCurrency(capital, ctx.currency)} of your money is parked here.`;

      const evidence: Evidence = {
        version: EVIDENCE_VERSION,
        metric: buildMetric('on_hand_units', 'Units on the shelf', 'count', p.onHand),
        window: buildWindow(
          `last ${facts.windowDays} days`,
          addDays(ctx.today, -facts.windowDays),
          addDays(ctx.today, -1),
          facts.windowDays,
        ),
        comparison: null,
        impact: {
          amount: capital,
          currency: ctx.currency,
          cadence: 'one_time',
          basis: `${p.onHand} units at ${formatCurrency(p.wholesaleCost ?? p.retailPrice * 0.5, ctx.currency)} cost each.`,
          confidence: 'high',
          chipLabel: `${formatCurrency(capital, ctx.currency)} tied up`,
          tone: 'cost',
        },
        contributingFactors: [
          {
            key: 'movement',
            label: 'Barely moving',
            detail:
              p.daysSinceLastSale === null
                ? 'No sales recorded in this window.'
                : `Last sold ${p.daysSinceLastSale} days ago.`,
            share: null,
            direction: 'down',
          },
        ],
        series: null,
        sentence,
      };

      return [
        {
          dedupeKey: `${ctx.salonId}:overstock:${p.productId}`,
          type: 'overstock' as const,
          severity: 'low' as InsightSeverity,
          title: `${p.name} isn't moving`,
          summary: `${p.onHand} on hand with almost no sell-through.`,
          evidence,
          impactEstimate: capital,
          impactCurrency: ctx.currency,
          linkedActionType: 'review_product' as const,
          linkedActionRef: { productId: p.productId, sku: p.sku, suggestion: 'bundle_or_promote' },
          primaryActionLabel: 'Move this stock',
          forDate: ctx.today,
        },
      ];
    });
  },
};

function isOverstocked(p: ProductStockFacts): boolean {
  if (p.daysRemaining === null) return p.unitsSoldInWindow === 0;
  return p.daysRemaining >= THRESHOLDS.overstockDays;
}

function tiedCapital(p: ProductStockFacts): number {
  return p.onHand * (p.wholesaleCost ?? p.retailPrice * 0.5);
}

// ---------------------------------------------------------------------------
// 6. Anomaly band — spray tans +22%.
// ---------------------------------------------------------------------------

export const anomalyBandDetector: Detector = {
  type: 'anomaly_band',
  run(facts, ctx) {
    const moves = facts.categoryTrends
      .filter((t) => t.baselineCount >= 10)
      .map((t) => ({
        ...t,
        changePercent: round(((t.currentCount - t.baselineCount) / t.baselineCount) * 100, 1),
        revenueDelta: round(t.currentRevenue - t.baselineRevenue, 2),
      }))
      .filter((t) => Math.abs(t.changePercent) >= THRESHOLDS.anomalyPercent)
      .sort((a, b) => Math.abs(b.revenueDelta) - Math.abs(a.revenueDelta));

    const top = moves[0];
    if (!top) return [];
    if (Math.abs(top.revenueDelta) < ctx.minImpact) return [];

    const rising = top.changePercent > 0;
    const half = Math.round(facts.windowDays / 2);
    const currentWindow = buildWindow(
      `last ${half} days`,
      addDays(ctx.today, -half),
      addDays(ctx.today, -1),
      half,
    );
    const baselineWindow = buildWindow(
      `the ${half} days before`,
      addDays(ctx.today, -half * 2),
      addDays(ctx.today, -(half + 1)),
      half,
    );

    const sentence =
      `${top.label} are **${rising ? 'up' : 'down'} ${Math.abs(top.changePercent)}%** ` +
      `versus the ${half} days before — **${top.currentCount} bookings** against ${top.baselineCount}. ` +
      `${rising ? 'Worth making sure you have the stock and the hours for it.' : 'Worth a look before it settles in.'}`;

    const evidence: Evidence = {
      version: EVIDENCE_VERSION,
      metric: buildMetric(`${top.key}_bookings`, `${top.label} bookings`, 'count', top.currentCount),
      window: currentWindow,
      comparison: buildComparison({
        baseline: buildMetric(`${top.key}_bookings`, `${top.label} bookings`, 'count', top.baselineCount),
        baselineWindow,
        current: buildMetric(`${top.key}_bookings`, `${top.label} bookings`, 'count', top.currentCount),
        currentWindow,
        goodDirection: 'up',
      }),
      impact: {
        amount: Math.abs(top.revenueDelta),
        currency: ctx.currency,
        cadence: 'per_month',
        basis: `Revenue difference between the two ${half}-day windows, scaled to a month.`,
        confidence: 'medium',
        chipLabel: rising
          ? `+${formatCurrency(Math.abs(top.revenueDelta), ctx.currency)} and climbing`
          : `${formatCurrency(-Math.abs(top.revenueDelta), ctx.currency)} and falling`,
        tone: rising ? 'opportunity' : 'cost',
      },
      contributingFactors: [],
      series: null,
      sentence,
    };

    return [
      {
        dedupeKey: `${ctx.salonId}:anomaly_band:${top.key}`,
        type: 'anomaly_band',
        severity: rising ? 'info' : 'medium',
        title: `${top.label} are ${rising ? 'up' : 'down'} ${Math.abs(top.changePercent)}%`,
        summary: `${top.currentCount} in the last ${half} days, against ${top.baselineCount} before.`,
        evidence,
        impactEstimate: Math.abs(top.revenueDelta),
        impactCurrency: ctx.currency,
        linkedActionType: 'open_report',
        linkedActionRef: { category: top.key, direction: rising ? 'up' : 'down' },
        primaryActionLabel: "See what's driving it",
        forDate: ctx.today,
      },
    ];
  },
};

export const ALL_DETECTORS: Detector[] = [
  attachmentSlipDetector,
  failedPaymentsDetector,
  softCapacityDetector,
  lowStockDetector,
  overstockDetector,
  anomalyBandDetector,
];

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function severityForMoney(
  amount: number,
  bands: { high: number; medium: number },
): InsightSeverity {
  if (amount >= bands.high) return 'high';
  if (amount >= bands.medium) return 'medium';
  return 'low';
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function weekdayNameFor(weekday: number): string {
  return weekdayName(addDays('2026-01-04', weekday)); // 2026-01-04 is a Sunday
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

function formatHourRange(start: number, end: number): string {
  return `${formatHour(start)}–${formatHour(end)}`;
}

function describeSpan(days: number): string {
  if (days % 7 === 0) {
    const weeks = days / 7;
    return weeks === 1 ? 'the last week' : `${numberWord(weeks)} weeks`;
  }
  return `${days} days`;
}

function numberWord(n: number): string {
  return ['zero', 'one', 'two', 'three', 'four', 'five', 'six'][n] ?? String(n);
}

function describeWhere(staffNames: string[], slots: CapacitySlotLike[]): string {
  if (slots.length > 0) {
    const parts = slots.map((s) => `${weekdayNameFor(s.weekday)} ${s.daypart}`);
    return ` — mostly on ${joinAnd(parts)} shifts`;
  }
  if (staffNames.length > 0) return ` — concentrated on ${joinAnd(staffNames)}'s shifts`;
  return '';
}

interface CapacitySlotLike {
  weekday: number;
  daypart: string;
}

function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function nextWeekday(from: string, weekday: number): string {
  for (let i = 1; i <= 7; i += 1) {
    const candidate = addDays(from, i);
    if (new Date(`${candidate}T00:00:00Z`).getUTCDay() === weekday) return candidate;
  }
  return addDays(from, 7);
}

interface SoftRun {
  weekday: number;
  startHour: number;
  endHour: number;
  slots: CapacitySlotFacts[];
}

/**
 * Find the longest contiguous run of soft hours on a single weekday. A single
 * quiet hour is noise; four in a row is a window an owner can actually fill.
 */
function pickSoftestRun(soft: CapacitySlotFacts[]): SoftRun | null {
  const byWeekday = new Map<number, CapacitySlotFacts[]>();
  for (const slot of soft) {
    const list = byWeekday.get(slot.weekday) ?? [];
    list.push(slot);
    byWeekday.set(slot.weekday, list);
  }

  let best: SoftRun | null = null;
  for (const [weekday, slots] of [...byWeekday.entries()].sort((a, b) => a[0] - b[0])) {
    const sorted = [...slots].sort((a, b) => a.hour - b.hour);
    let run: CapacitySlotFacts[] = [];
    const flush = () => {
      if (run.length < 2) return;
      const candidate: SoftRun = {
        weekday,
        startHour: run[0]!.hour,
        endHour: run[run.length - 1]!.hour + 1,
        slots: [...run],
      };
      if (
        !best ||
        candidate.slots.length > best.slots.length ||
        (candidate.slots.length === best.slots.length &&
          mean(candidate.slots.map((s) => s.utilisation)) < mean(best.slots.map((s) => s.utilisation)))
      ) {
        best = candidate;
      }
    };
    for (const slot of sorted) {
      if (run.length === 0 || slot.hour === run[run.length - 1]!.hour + 1) {
        run.push(slot);
      } else {
        flush();
        run = [slot];
      }
    }
    flush();
  }
  return best;
}
