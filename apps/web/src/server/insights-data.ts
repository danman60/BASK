import 'server-only';

import {
  addDays,
  formatCurrency,
  round,
  safeParseEvidence,
  toDateOnly,
  zonedToUtc,
  type DateOnly,
  type Evidence,
  type SalonFacts,
} from '@bask/core';
import { db } from '@bask/db';

import type { DemoSalonContext } from './salon';

/**
 * Insights read model (PRODUCT_SPEC §13).
 *
 * "What changed" is the same engine as Daybreak over a longer horizon: it reads
 * the standing `insight` rows rather than re-running detectors, so a card the
 * owner dismissed on Today stays dismissed here. Everything else is rolled up
 * from `SalonFacts` (the M0 rollup) or queried straight off the event tables —
 * no metric on this screen is a stored summary.
 */

/** How far back "what changed" looks. Daybreak is one day; Insights is a fortnight. */
export const WHAT_CHANGED_DAYS = 14;

/** Revenue / membership comparison window. */
export const TREND_DAYS = 28;

export interface WhatChangedItem {
  id: string;
  type: string;
  severity: string;
  state: string;
  title: string;
  summary: string | null;
  forDate: DateOnly;
  evidence: Evidence | null;
  impactEstimate: number | null;
  impactCurrency: string;
  linkedActionType: string | null;
  linkedActionRef: Record<string, unknown> | null;
}

export interface MetricArea {
  key: string;
  label: string;
  value: string;
  /** The sentence the number supports — DESIGN_SPEC §2: charts are annotated. */
  sentence: string;
  changePercent: number | null;
  sentiment: 'good' | 'bad' | 'neutral';
  series?: Array<{ at: string; value: number }>;
}

export interface HeatCell {
  weekday: number;
  hour: number;
  utilisation: number;
  sessionsRun: number;
  sessionsPossible: number;
}

export interface HeatmapView {
  cells: HeatCell[];
  hours: number[];
  weekdays: number[];
  peak: HeatCell | null;
  softest: HeatCell | null;
  /** Money a soft slot leaves on the table each week, at the salon's own average. */
  softSlotWeeklyValue: number;
  averageUtilisation: number;
}

export interface StaffRow {
  staffId: string;
  name: string;
  attachmentRate: number;
  baselineRate: number;
  visits: number;
  /** Retail dollars per shift worked, over the current window. */
  salesPerShift: number;
  shifts: number;
  /** Coaching framing: what this person is good at, or where a hand would help. */
  note: string;
  strength: boolean;
}

export interface CampaignRow {
  id: string;
  name: string;
  state: string;
  scheduledFor: Date | null;
  recipients: number | null;
  bookings: number | null;
  revenue: number | null;
}

export interface ActivityRow {
  id: string;
  action: string;
  actorLabel: string;
  actorType: string;
  targetType: string | null;
  occurredAt: Date;
  detail: string;
}

export interface InsightsView {
  whatChanged: WhatChangedItem[];
  dismissedCount: number;
  areas: {
    revenue: MetricArea;
    memberships: MetricArea;
    retail: MetricArea;
    campaigns: MetricArea;
  };
  heatmap: HeatmapView;
  staff: StaffRow[];
  campaigns: CampaignRow[];
}

// ---------------------------------------------------------------------------

export async function loadWhatChanged(
  salon: DemoSalonContext,
): Promise<{ items: WhatChangedItem[]; dismissedCount: number }> {
  const since = new Date(`${addDays(salon.today, -WHAT_CHANGED_DAYS)}T00:00:00.000Z`);
  const rows = await db.insight.findMany({
    where: { salonId: salon.salonId, forDate: { gte: since } },
    orderBy: [{ forDate: 'desc' }, { impactEstimate: 'desc' }],
  });

  const items = rows
    .filter((row) => row.state !== 'dismissed')
    .map((row) => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      state: row.state,
      title: row.title,
      summary: row.summary,
      forDate: toDateOnly(row.forDate, 'UTC'),
      evidence: safeParseEvidence(row.evidence),
      impactEstimate: row.impactEstimate === null ? null : Number(row.impactEstimate),
      impactCurrency: row.impactCurrency,
      linkedActionType: row.linkedActionType,
      linkedActionRef: (row.linkedActionRef ?? null) as Record<string, unknown> | null,
    }));

  return { items, dismissedCount: rows.length - items.length };
}

/**
 * Daily revenue over two adjacent 28-day windows, from real `sale` rows.
 * Returned as a series so the sparkline and the sentence share one source.
 */
async function revenueArea(salon: DemoSalonContext): Promise<MetricArea> {
  const start = zonedToUtc(addDays(salon.today, -TREND_DAYS * 2), 0, 0, salon.timezone);
  const end = zonedToUtc(salon.today, 0, 0, salon.timezone);
  const sales = await db.sale.findMany({
    where: { salonId: salon.salonId, soldAt: { gte: start, lt: end } },
    select: { total: true, soldAt: true },
  });

  const currentStart = addDays(salon.today, -TREND_DAYS);
  const byDay = new Map<string, number>();
  let current = 0;
  let baseline = 0;
  for (const sale of sales) {
    const day = toDateOnly(sale.soldAt, salon.timezone);
    const amount = Number(sale.total);
    if (day >= currentStart) {
      current += amount;
      byDay.set(day, (byDay.get(day) ?? 0) + amount);
    } else {
      baseline += amount;
    }
  }

  const changePercent = baseline === 0 ? null : round(((current - baseline) / baseline) * 100, 1);
  const series = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([at, value]) => ({ at, value: round(value, 2) }));

  return {
    key: 'revenue',
    label: 'Money through the till',
    value: formatCurrency(current),
    sentence:
      changePercent === null
        ? `${formatCurrency(current)} over the last ${TREND_DAYS} days.`
        : `${formatCurrency(current)} over the last ${TREND_DAYS} days — ${
            changePercent >= 0 ? 'up' : 'down'
          } ${Math.abs(changePercent)}% on the ${TREND_DAYS} days before that.`,
    changePercent,
    sentiment: changePercent === null ? 'neutral' : changePercent >= 0 ? 'good' : 'bad',
    series,
  };
}

function membershipArea(facts: SalonFacts): MetricArea {
  const failed = facts.failedPayments.memberships;
  const atRisk = round(
    failed.reduce((sum, m) => sum + m.monthlyPrice, 0),
    2,
  );
  return {
    key: 'memberships',
    label: 'Money coming in monthly from memberships',
    value: formatCurrency(facts.pulse.membershipRevenueMonthly),
    sentence:
      failed.length === 0
        ? `${facts.pulse.activeMembers} active members, and every payment went through this month.`
        : `${facts.pulse.activeMembers} active members. ${failed.length} ${
            failed.length === 1 ? 'payment' : 'payments'
          } did not go through — ${formatCurrency(atRisk)} a month waiting on a card update.`,
    changePercent: null,
    sentiment: failed.length === 0 ? 'good' : 'bad',
  };
}

function retailArea(facts: SalonFacts): MetricArea {
  const a = facts.attachment;
  const change = a.baselineRate === 0 ? null : round(a.currentRate - a.baselineRate, 1);
  return {
    key: 'retail',
    label: 'Retail sold with sessions',
    value: `${round(a.currentRate, 1)}%`,
    sentence: `${round(a.currentRate, 1)}% of the last ${a.currentDays} days' visits included a product, against ${round(
      a.baselineRate,
      1,
    )}% over the ${a.baselineDays} days before. Each one that attaches is worth about ${formatCurrency(
      a.averageAttachedSpend,
    )}.`,
    changePercent: change,
    sentiment: change === null || Math.abs(change) < 1 ? 'neutral' : change > 0 ? 'good' : 'bad',
    series: a.daily.map((p) => ({ at: p.at, value: round(p.value, 2) })),
  };
}

function campaignArea(campaigns: CampaignRow[]): MetricArea {
  const measured = campaigns.filter((c) => c.state === 'measured');
  const revenue = round(
    measured.reduce((sum, c) => sum + (c.revenue ?? 0), 0),
    2,
  );
  const bookings = measured.reduce((sum, c) => sum + (c.bookings ?? 0), 0);
  return {
    key: 'campaigns',
    label: 'What campaigns brought back',
    value: formatCurrency(revenue),
    sentence:
      measured.length === 0
        ? 'No campaign has finished measuring yet.'
        : `${measured.length} finished ${
            measured.length === 1 ? 'campaign' : 'campaigns'
          } brought ${bookings} bookings worth ${formatCurrency(revenue)}.`,
    changePercent: null,
    sentiment: revenue > 0 ? 'good' : 'neutral',
  };
}

/** Hour × weekday utilisation, straight off the room/session rollup. */
export function buildHeatmap(facts: SalonFacts): HeatmapView {
  const cells: HeatCell[] = facts.capacity.slots.map((slot) => ({
    weekday: slot.weekday,
    hour: slot.hour,
    utilisation: round(slot.utilisation, 1),
    sessionsRun: slot.sessionsRun,
    sessionsPossible: slot.sessionsPossible,
  }));

  const hours = [...new Set(cells.map((c) => c.hour))].sort((a, b) => a - b);
  const weekdays = [...new Set(cells.map((c) => c.weekday))].sort((a, b) => a - b);

  const ranked = [...cells].sort((a, b) => b.utilisation - a.utilisation);
  const peak = ranked[0] ?? null;
  // The softest slot worth naming is one the salon actually staffs — a single
  // opening hour with two possible sessions is noise, not an opportunity.
  const softest =
    [...cells].filter((c) => c.sessionsPossible >= 20).sort((a, b) => a.utilisation - b.utilisation)[0] ??
    null;

  // The rollup window is 28 days, so each weekday×hour slot occurred 4 times.
  // Empty sessions ÷ 4 = the sessions that slot misses in a normal week.
  const OCCURRENCES_IN_WINDOW = 4;
  const averageSessionValue =
    facts.capacity.slots.find((s) => s.averageSessionValue > 0)?.averageSessionValue ?? 0;
  const softSlotWeeklyValue = softest
    ? round(
        ((softest.sessionsPossible - softest.sessionsRun) / OCCURRENCES_IN_WINDOW) *
          averageSessionValue,
        0,
      )
    : 0;

  const totalPossible = cells.reduce((sum, c) => sum + c.sessionsPossible, 0);
  const totalRun = cells.reduce((sum, c) => sum + c.sessionsRun, 0);

  return {
    cells,
    hours,
    weekdays,
    peak,
    softest,
    softSlotWeeklyValue,
    averageUtilisation: totalPossible === 0 ? 0 : round((totalRun / totalPossible) * 100, 1),
  };
}

/**
 * Staff view — coaching-framed, never a leaderboard.
 *
 * Sales per shift comes from real `sale_line` rows attributed to a staffer,
 * divided by the number of distinct days they actually rang anything through.
 * Everyone gets a sentence; nobody gets a rank.
 */
export async function loadStaffRows(
  salon: DemoSalonContext,
  facts: SalonFacts,
): Promise<StaffRow[]> {
  const windowStart = zonedToUtc(
    addDays(salon.today, -facts.attachment.currentDays),
    0,
    0,
    salon.timezone,
  );
  const lines = await db.saleLine.findMany({
    where: {
      salonId: salon.salonId,
      soldAt: { gte: windowStart },
      productId: { not: null },
      staffId: { not: null },
    },
    select: { staffId: true, lineTotal: true, soldAt: true },
  });

  const revenueByStaff = new Map<string, number>();
  const daysByStaff = new Map<string, Set<string>>();
  for (const line of lines) {
    const key = line.staffId!;
    revenueByStaff.set(key, (revenueByStaff.get(key) ?? 0) + Number(line.lineTotal));
    const days = daysByStaff.get(key) ?? new Set<string>();
    days.add(toDateOnly(line.soldAt, salon.timezone));
    daysByStaff.set(key, days);
  }

  const salonRate = facts.attachment.currentRate;

  return facts.attachment.byStaff
    .filter((s) => s.currentVisits > 0)
    .map((s) => {
      const shifts = daysByStaff.get(s.staffId)?.size ?? 0;
      const revenue = revenueByStaff.get(s.staffId) ?? 0;
      const gap = round(s.currentRate - salonRate, 1);
      const strength = gap >= 0;
      return {
        staffId: s.staffId,
        name: s.name,
        attachmentRate: round(s.currentRate, 1),
        baselineRate: round(s.baselineRate, 1),
        visits: s.currentVisits,
        shifts,
        salesPerShift: shifts === 0 ? 0 : round(revenue / shifts, 2),
        strength,
        note: strength
          ? `Selling with ${round(s.currentRate, 1)} out of every 100 sessions — ${Math.abs(
              gap,
            )} points above the salon. Worth asking what they say at the counter.`
          : `${round(s.currentRate, 1)} out of every 100 sessions, ${Math.abs(
              gap,
            )} points under the salon. A shift alongside someone stronger usually closes most of that.`,
      };
    })
    .sort((a, b) => b.visits - a.visits);
}

export async function loadCampaigns(salon: DemoSalonContext): Promise<CampaignRow[]> {
  const rows = await db.campaign.findMany({
    where: { salonId: salon.salonId },
    orderBy: { scheduledFor: 'desc' },
  });

  return rows.map((row) => {
    const results = (row.results ?? {}) as {
      recipients?: number;
      bookings?: number;
      revenue?: number;
    };
    return {
      id: row.id,
      name: row.name,
      state: row.state,
      scheduledFor: row.scheduledFor,
      recipients: results.recipients ?? null,
      bookings: results.bookings ?? null,
      revenue: results.revenue ?? null,
    };
  });
}

/** Plain-language rendering of an ActivityEvent. Copy stays out of the JSX. */
const ACTIVITY_LABELS: Record<string, string> = {
  pipeline_run: 'Bask read the day and refreshed the insight list',
  ai_generation_failed: 'The writing assistant was unavailable — the plain-numbers version was used',
  ai_generation_ok: 'The morning letter was written',
  insight_dismissed: 'An insight was set aside',
  insight_actioned: 'An insight was acted on',
  consent_tier_changed: 'What UVALUX can see was changed',
  draft_order_submitted: 'A stock order was sent to the UVALUX rep',
  draft_order_line_added: 'A product was added to the stock order',
  coaching_requested: 'Coaching was requested from UVALUX',
  staff_challenge_created: 'A staff challenge was set',
  discount_applied: 'A discount was given at the till',
  sale_voided: 'A sale was voided',
  demo_reset: 'The demo data was rebuilt from scratch',
  stock_received: 'Stock was counted in on the shelf',
  scan_unknown_code: 'A barcode was scanned that nothing on file matches',
};

export async function loadActivity(salon: DemoSalonContext, take = 60): Promise<ActivityRow[]> {
  const rows = await db.activityEvent.findMany({
    where: { salonId: salon.salonId },
    orderBy: { occurredAt: 'desc' },
    take,
    include: { actorStaff: { select: { firstName: true, lastName: true } } },
  });

  return rows.map((row) => {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const detailParts: string[] = [];
    if (typeof metadata.date === 'string') detailParts.push(`for ${metadata.date}`);
    if (typeof metadata.product === 'string') detailParts.push(String(metadata.product));
    if (typeof metadata.topic === 'string') detailParts.push(String(metadata.topic));
    if (typeof metadata.total === 'number') detailParts.push(formatCurrency(metadata.total));
    if (typeof metadata.lines === 'number') detailParts.push(`${metadata.lines} lines`);
    if (typeof metadata.tier === 'string') detailParts.push(`now ${metadata.tier}`);

    return {
      id: row.id,
      action: ACTIVITY_LABELS[row.action] ?? row.action.replace(/_/g, ' '),
      actorLabel:
        row.actorStaff !== null && row.actorStaff !== undefined
          ? `${row.actorStaff.firstName} ${row.actorStaff.lastName}`
          : (row.actorLabel ?? 'Bask'),
      actorType: row.actorType,
      targetType: row.targetType,
      occurredAt: row.occurredAt,
      detail: detailParts.join(' · '),
    };
  });
}

export async function loadInsightsView(
  salon: DemoSalonContext,
  facts: SalonFacts,
): Promise<InsightsView> {
  const [changed, revenue, campaigns, staff] = await Promise.all([
    loadWhatChanged(salon),
    revenueArea(salon),
    loadCampaigns(salon),
    loadStaffRows(salon, facts),
  ]);

  return {
    whatChanged: changed.items,
    dismissedCount: changed.dismissedCount,
    areas: {
      revenue,
      memberships: membershipArea(facts),
      retail: retailArea(facts),
      campaigns: campaignArea(campaigns),
    },
    heatmap: buildHeatmap(facts),
    staff,
    campaigns,
  };
}
