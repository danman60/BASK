/**
 * Everything the Today surface renders, read straight from the database.
 *
 * The rule this file exists to keep (IMPLEMENTATION_SPEC §0.1): **the Today
 * surface reads a stored row; it never waits on a model.** The Daybreak brief was
 * written during `demo:advance` and lives in `bask.daybreak_brief`. Here we parse
 * it back through `daybreakBriefSchema`, join its cards to their live `Insight`
 * rows for state + Evidence, and add the two things the brief does not carry:
 * who is coming in next, and how a second location compares.
 *
 * Nothing here computes a metric. Every number on the page was produced by the
 * insight engine or the fixtures; this module only selects and formats.
 */

import { db } from '@bask/db';
import { safeParseBrief, safeParseEvidence, type BriefCard, type DaybreakBrief, type Evidence } from '@bask/core';

import type { SalonScope } from './salon-scope';

/** A queue card = brief card (presentation) + insight row (state + evidence). */
export interface AttentionCard {
  insightId: string;
  rank: number;
  insightType: string;
  rail: BriefCard['rail'];
  title: string;
  evidenceSentence: string;
  impactChip: BriefCard['impactChip'];
  sparkline: number[] | null;
  evidence: Evidence | null;
  primaryAction: { label: string; href: string } | null;
}

export interface NextUpBooking {
  id: string;
  time: string;
  who: string;
  what: string;
  /** Confirmed bookings get the green dot; walk-in holds do not. */
  confirmed: boolean;
}

export interface LocationComparison {
  leftName: string;
  rightName: string;
  /**
   * False when neither location has rung anything through Bask yet. The card
   * still renders — it teaches what will appear — but a table of zeros would read
   * as a broken metric rather than an empty one.
   */
  hasActivity: boolean;
  metrics: Array<{
    key: string;
    label: string;
    left: string;
    right: string;
    delta: string;
    sentiment: 'good' | 'bad' | 'neutral';
  }>;
}

export interface TodayData {
  brief: DaybreakBrief | null;
  cards: AttentionCard[];
  nextUp: NextUpBooking[];
  comparison: LocationComparison | null;
}

/**
 * Where a card's primary button goes. The insight's `linkedActionType` is the
 * routing key — the same value the detectors already write — so a new detector
 * lands with a working button and no change here.
 *
 * These point at routes other lanes own. Linking correctly now means the button
 * works the moment those lanes merge; building the destination here would be the
 * duplicate-feature mistake the plan's merge protocol exists to prevent.
 */
const ACTION_ROUTES: Record<string, string> = {
  create_campaign: '/marketing',
  recover_payment: '/customers',
  draft_order: '/inventory/order',
  review_product: '/inventory',
  open_heatmap: '/insights',
  open_report: '/insights',
};

export function actionHref(
  actionType: string | null,
  insightId: string,
  scopeQuery: string,
): string {
  const base = (actionType && ACTION_ROUTES[actionType]) ?? '/insights';
  const params = new URLSearchParams(scopeQuery);
  params.set('insight', insightId);
  return `${base}?${params.toString()}`;
}

export async function loadToday(
  salon: SalonScope,
  today: string,
  scopeQuery: string,
): Promise<TodayData> {
  const [briefRow, insights] = await Promise.all([
    // The brief for today, or the most recent one before it. A demo clock parked
    // between generations should still show the last letter, not a blank page.
    db.daybreakBrief.findFirst({
      where: { salonId: salon.id, forDate: { lte: new Date(`${today}T00:00:00.000Z`) } },
      orderBy: { forDate: 'desc' },
    }),
    db.insight.findMany({ where: { salonId: salon.id } }),
  ]);

  const brief = briefRow ? safeParseBrief(briefRow.brief) : null;
  const byId = new Map(insights.map((insight) => [insight.id, insight]));

  const cards: AttentionCard[] = (brief?.cards ?? [])
    .map((card) => {
      const insight = byId.get(card.insightId);
      // A dismissal has to survive a reload, and the brief is a frozen snapshot —
      // so state comes from the live row, never from the stored card.
      if (!insight || insight.state === 'dismissed') return null;
      return {
        insightId: card.insightId,
        rank: card.rank,
        insightType: card.insightType,
        rail: card.rail,
        title: card.title,
        evidenceSentence: card.evidenceSentence,
        impactChip: card.impactChip,
        sparkline: card.sparkline,
        evidence: safeParseEvidence(insight.evidence),
        primaryAction: primaryActionOf(card, insight.linkedActionType, scopeQuery),
      } satisfies AttentionCard;
    })
    .filter((card): card is AttentionCard => card !== null)
    .sort((a, b) => a.rank - b.rank);

  const [nextUp, comparison] = await Promise.all([
    loadNextUp(salon, today),
    loadComparison(salon, today),
  ]);

  return { brief, cards, nextUp, comparison };
}

function primaryActionOf(
  card: BriefCard,
  linkedActionType: string | null,
  scopeQuery: string,
): AttentionCard['primaryAction'] {
  const primary = card.actions.find((action) => action.kind === 'primary');
  if (!primary) return null;
  return {
    label: primary.label,
    href: actionHref(linkedActionType ?? primary.actionType, card.insightId, scopeQuery),
  };
}

/* ------------------------------------------------------------------ next up */

/** The salon-local hour the Daybreak pulse is measured to (`buildFacts` default). */
const PULSE_AS_OF_HOUR = 11;

/**
 * Who is still to come today. The fixtures write a whole day of visits, so
 * "the rest of today" is the visits whose local check-in time is at or after the
 * hour the morning pulse was cut at — the same boundary the pulse used, so the
 * two rail cards never double-count the same person.
 */
async function loadNextUp(salon: SalonScope, today: string): Promise<NextUpBooking[]> {
  // A generous UTC window around the local day; the exact local filter happens
  // below, because a timezone offset cannot be expressed in a Prisma `where`.
  const from = new Date(`${today}T00:00:00.000Z`);
  from.setUTCHours(from.getUTCHours() - 14);
  const to = new Date(`${today}T00:00:00.000Z`);
  to.setUTCHours(to.getUTCHours() + 38);

  const visits = await db.visit.findMany({
    where: { salonId: salon.id, checkedInAt: { gte: from, lte: to } },
    orderBy: { checkedInAt: 'asc' },
    select: {
      id: true,
      checkedInAt: true,
      source: true,
      customer: { select: { firstName: true, lastName: true } },
      sessions: { select: { service: { select: { name: true } } }, take: 1 },
    },
  });

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: salon.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const upcoming: NextUpBooking[] = [];
  for (const visit of visits) {
    const bits = Object.fromEntries(
      parts.formatToParts(visit.checkedInAt).map((part) => [part.type, part.value]),
    ) as Record<string, string>;
    if (`${bits.year}-${bits.month}-${bits.day}` !== today) continue;
    if (Number(bits.hour) < PULSE_AS_OF_HOUR) continue;

    upcoming.push({
      id: visit.id,
      time: `${bits.hour}:${bits.minute}`,
      who: `${visit.customer.firstName} ${visit.customer.lastName.charAt(0)}.`,
      what: visit.sessions[0]?.service?.name ?? '—',
      confirmed: visit.source !== 'walk_in',
    });
    if (upcoming.length === 4) break;
  }

  return upcoming;
}

/* --------------------------------------------------------------- comparison */

/**
 * Two locations, yesterday (IMPLEMENTATION_SPEC §7 — "Today gains ONE
 * location-comparison card for orgs with >1 salon"). Single-location orgs get
 * nothing; the card is not a placeholder.
 */
async function loadComparison(
  salon: SalonScope,
  today: string,
): Promise<LocationComparison | null> {
  if (salon.siblings.length < 2) return null;

  const [left, right] = salon.siblings;
  if (!left || !right) return null;

  const start = new Date(`${today}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(`${today}T00:00:00.000Z`);

  const read = async (id: string) => {
    const [sales, visits, members] = await Promise.all([
      db.sale.aggregate({
        where: { salonId: id, soldAt: { gte: start, lt: end } },
        _sum: { total: true },
      }),
      db.visit.count({ where: { salonId: id, checkedInAt: { gte: start, lt: end } } }),
      db.membership.count({ where: { salonId: id, status: 'active' } }),
    ]);
    return {
      revenue: Number(sales._sum.total ?? 0),
      visits,
      members,
    };
  };

  const [a, b] = await Promise.all([read(left.id), read(right.id)]);

  // The fixtures seed Aurora Collective as an org shape (two salons, one owner)
  // without operational rows — it exists for Compass's multi-location beat. Until
  // those rows are seeded, the honest render is the teaching state, not $0 vs $0.
  const hasActivity = a.revenue + a.visits + a.members + b.revenue + b.visits + b.members > 0;

  return {
    leftName: shortName(left.name),
    rightName: shortName(right.name),
    hasActivity,
    metrics: [
      metric('revenue', 'Revenue', money(a.revenue), money(b.revenue), a.revenue, b.revenue),
      metric('visits', 'Visits', String(a.visits), String(b.visits), a.visits, b.visits),
      metric('members', 'Active members', String(a.members), String(b.members), a.members, b.members),
    ],
  };
}

/** `Aurora Collective — Westside` reads as `Westside` once the org is the heading. */
function shortName(name: string): string {
  const dash = name.split(/\s+—\s+/);
  return dash.length > 1 ? dash[dash.length - 1]! : name;
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString('en-CA')}`;
}

function metric(
  key: string,
  label: string,
  left: string,
  right: string,
  leftValue: number,
  rightValue: number,
) {
  const diff = rightValue - leftValue;
  const percent = leftValue === 0 ? null : Math.round((diff / leftValue) * 100);
  return {
    key,
    label,
    left,
    right,
    delta: percent === null ? '—' : `${percent > 0 ? '+' : ''}${percent}%`,
    // Neither shop is "ours" here — it is one owner looking at both — so the
    // delta is informational unless it is a real gap.
    sentiment: (percent === null || Math.abs(percent) < 5
      ? 'neutral'
      : percent > 0
        ? 'good'
        : 'bad') as 'good' | 'bad' | 'neutral',
  };
}
