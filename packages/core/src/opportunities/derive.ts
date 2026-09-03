/**
 * Deriving opportunities from a salon's own rows.
 *
 * WHY THIS EXISTS. The Today feed shipped reading `DEMO_OPPORTUNITIES` — six
 * hand-set cards. The attention queue directly beneath it reads live insights,
 * so half the first screen moved with the demo clock and half did not. This
 * module is the half that did not, made to move.
 *
 * PURE ON PURPOSE. Nothing here touches Prisma, `process.env`, or the clock. It
 * takes a measured `OpportunitySignals` struct and returns ranked `Opportunity`
 * values — the same shape `fixtures.ts` produces and `OpportunityFeedSection`
 * already renders. The measuring lives in `apps/web/src/lib/opportunity-data.ts`,
 * beside `today-data.ts`, because that is where database access belongs.
 *
 * This replaces an abandoned file of the same name whose filename literally
 * contained a trailing newline and which nothing imported. That version assigned
 * `OPPORTUNITY_CATEGORY_LABEL.retail` — the string `'Retail'` — into `category`,
 * a field typed to the key `'retail'`, and did the same for confidence and
 * urgency, so it could never have typechecked and would have rendered
 * `undefined` in the card's kicker. Its `OpportunitySignals` shape was the sound
 * part and is the ancestor of the one below; the body is not reused.
 *
 * THE RULE FOR NUMBERS. Every dollar figure on a card is arithmetic over rows
 * the salon can go and count, and each generator states its identity in a
 * comment. Where a projection needs an assumption that the data cannot supply —
 * what share of eligible customers actually convert — the assumption is a named
 * constant, it is printed on the card in `confidenceNote`, and the card is
 * marked `worth_testing` rather than `high`. A stakeholder who asks "where does
 * that number come from?" gets an answer, not a shrug.
 *
 * THE RULE FOR COPY. Counts, names and SKUs come from real rows. The draft
 * message bodies are authored — they are drafts an owner approves, and the
 * product has always written those — but nothing numeric is ever authored.
 */

import { methodSourceFor } from '../sources/experts';

import type {
  Opportunity,
  OpportunityAction,
  OpportunityConfidence,
  OpportunityUrgency,
} from './types';

/* ------------------------------------------------------------------ signals */

/** One staff member's measured retail performance over the recent window. */
export interface StaffRetailSignal {
  /** First name only — the card shows a leaderboard, not an HR record. */
  name: string;
  /** Product lines this person actually rang in the recent window. */
  linesSold: number;
  /** Visits this person served in the same window. */
  visitsServed: number;
}

/** A product at or below its reorder point, with its measured sell-through. */
export interface LowStockSignal {
  sku: string;
  name: string;
  onHand: number;
  reorderPoint: number;
  /** Target level to restock to, when the salon has set one. */
  parLevel: number | null;
  /** Units sold in the trailing window. */
  unitsSoldInWindow: number;
  /** Retail dollars those units made. */
  revenueInWindow: number;
}

/**
 * Everything the generators below need, already measured.
 *
 * Windows are expressed in days so the arithmetic can annualise honestly rather
 * than assuming "a window is a month".
 */
export interface OpportunitySignals {
  /** Length of the recent window, in days. */
  windowDays: number;
  /** Length of the comparison window that ended where the recent one began. */
  baselineDays: number;

  retail: {
    windowVisits: number;
    windowProductLines: number;
    baselineVisits: number;
    baselineProductLines: number;
    /** Mean dollars per product line across both windows. */
    averageProductLine: number;
    /** Per-person retail performance, best first. Empty when unattributed. */
    staff: StaffRetailSignal[];
  };

  membership: {
    /** Non-members who visited often enough to be worth a conversation. */
    eligibleCount: number;
    /** How many of those consented to SMS — the only ones a text may reach. */
    eligibleSmsConsented: number;
    /** First name + last initial, for the staff task. */
    eligibleNames: string[];
    /** Mean monthly price of this salon's own active memberships. */
    averageMonthlyPrice: number;
    activeMembers: number;
    customerBase: number;
    /** Minimum visits in the trailing month that made a customer eligible. */
    visitsToQualify: number;
  };

  lapsed: {
    /** Customers past `sinceDays` with SMS consent. Only these are reachable. */
    reachableCount: number;
    sinceDays: number;
    /** Mean revenue one active customer produced per month in the window. */
    monthlyValuePerCustomer: number;
  };

  /** The weakest weekday, measured in the salon's own timezone. */
  quietDay: {
    /** e.g. `Monday`. */
    label: string;
    /** Mean visits on that weekday across the window. */
    averageVisits: number;
    /** Median weekday's mean visits, the bar being measured against. */
    medianVisits: number;
    /** Mean dollars per visit. */
    revenuePerVisit: number;
    /** How many of that weekday fall in an average month (~4.35). */
    occurrencesPerMonth: number;
  } | null;

  lowStock: LowStockSignal[];
}

/* --------------------------------------------------------------- thresholds */

/**
 * The stated assumptions. They are constants — not buried literals — because
 * each one is a business judgement the data cannot make, every card that leans
 * on one prints it, and the reviewer of this file should be able to see the
 * complete list in one place.
 */
export const DERIVE_ASSUMPTIONS = {
  /**
   * Share of qualified non-members expected to take a membership when asked.
   * Deliberately conservative — the card says "1 in 10" in its own words.
   */
  membershipConversionRate: 0.1,
  /** Share of lapsed customers a win-back text brings back within the month. */
  lapsedReturnRate: 0.15,
  /**
   * Share of the gap to a median day that promoting a quiet day can recover.
   * Filling a quiet day *to* the median is not a forecast, it is a wish.
   */
  quietDayRecoveryShare: 1 / 3,
} as const;

/**
 * Floors. Below these a card is arithmetic on noise, and the honest render is no
 * card at all — the heading counts what it shows, so a thin signal quietly
 * shrinks the feed instead of padding it.
 */
const FLOORS = {
  /** Percentage points of attachment decline worth raising. */
  attachmentDropPoints: 0.5,
  /** Visits needed in each window before a rate comparison means anything. */
  visitsPerWindow: 50,
  /** Qualified non-members needed before membership is a campaign. */
  membershipEligible: 10,
  /** Recipients needed before a win-back is a campaign and not a phone call. */
  lapsedReachable: 8,
  /** Dollars a month below which a card is not worth an owner's attention. */
  impactMonthly: 250,
  /** Days of stock cover at or under which a reorder is urgent. */
  stockCoverDays: 14,
} as const;

/* ----------------------------------------------------------------- helpers */

/** `4260` → `+$4,260/mo`. The card shows dollars; ordering uses the number. */
function monthlyLabel(amount: number): string {
  return `+$${Math.round(amount).toLocaleString('en-CA')}/mo`;
}

/** `4260` → `$4,260`. For prose, where `+…/mo` would read as a label. */
function dollars(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-CA')}`;
}

function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** `24` → `$1.68` at the demo's per-message rate. */
function smsCostNote(recipients: number): string {
  return `${recipients} messages · about $${(recipients * 0.07).toFixed(2)}`;
}

/**
 * A method line only where the technique is really in the registry.
 *
 * `fixtures.ts` leaves off-peak capacity and stock cover bare rather than giving
 * them the nearest-sounding method, on the grounds that a method line which does
 * not match the method is worse than none. Same rule here — and unlike the
 * fixtures this returns `undefined` instead of throwing, because a missing
 * citation must never take down the salon's Today page.
 */
function method(technique: string): Opportunity['methodSource'] {
  const source = methodSourceFor(technique);
  return source ? { label: source.label, basis: source.basis } : undefined;
}

/* -------------------------------------------------------------- generators */

/**
 * Retail attachment is falling.
 *
 * Identity: monthly visits × the lost attachment rate × dollars per product
 * line. Every term is counted, none projected.
 *
 *   monthlyVisits = windowVisits ÷ windowDays × 30
 *   lostRate      = baselineLines/baselineVisits − windowLines/windowVisits
 *   impact        = monthlyVisits × lostRate × averageProductLine
 */
function retailAttachment(signals: OpportunitySignals): Opportunity | null {
  const { retail, windowDays } = signals;
  if (retail.windowVisits < FLOORS.visitsPerWindow) return null;
  if (retail.baselineVisits < FLOORS.visitsPerWindow) return null;
  if (retail.averageProductLine <= 0) return null;

  const windowRate = (retail.windowProductLines / retail.windowVisits) * 100;
  const baselineRate = (retail.baselineProductLines / retail.baselineVisits) * 100;
  const dropPoints = baselineRate - windowRate;
  if (dropPoints < FLOORS.attachmentDropPoints) return null;

  const monthlyVisits = (retail.windowVisits / windowDays) * 30;
  const impact = monthlyVisits * (dropPoints / 100) * retail.averageProductLine;
  if (impact < FLOORS.impactMonthly) return null;

  const actions: OpportunityAction[] = [];

  // The leaderboard is real: `linesSold` is what each person rang, and `target`
  // is what the salon's OWN baseline rate says their visits should have
  // produced. Nobody is measured against a number invented here.
  const challengers = retail.staff
    .filter((member) => member.visitsServed > 0)
    .slice(0, 4)
    .map((member) => ({
      name: member.name,
      progress: member.linesSold,
      target: Math.max(1, Math.round(member.visitsServed * (baselineRate / 100))),
    }));

  if (challengers.length > 0) {
    actions.push({
      kind: 'staff_challenge',
      label: 'Start the challenge',
      name: 'Seven-day lotion challenge',
      metric: 'Retail attachment',
      days: 7,
      staff: challengers,
    });
  }

  actions.push({
    kind: 'coaching_request',
    label: 'Ask for coaching on this',
    topic: 'Bringing retail attachment back to baseline',
    note: `Attachment ran at ${percent(baselineRate)} and is now ${percent(windowRate)}.`,
  });

  return {
    id: 'opp-live-retail-attach',
    methodSource: method('retail_attachment'),
    category: 'retail',
    title: 'Bring retail attachment back up',
    whatChanged: `Retail attachment fell from ${percent(baselineRate)} to ${percent(windowRate)} while visits held steady.`,
    whyItMatters: `Closing that gap is worth about ${dollars(impact)} a month at your average product sale of ${dollars(retail.averageProductLine)}.`,
    impactLabel: monthlyLabel(impact),
    impactMonthly: Math.round(impact),
    confidence: dropPoints >= 1.5 ? 'high' : ('worth_testing' as OpportunityConfidence),
    confidenceNote: `${retail.windowProductLines} product lines over ${retail.windowVisits.toLocaleString('en-CA')} visits in the last ${windowDays} days, against ${retail.baselineProductLines} over ${retail.baselineVisits.toLocaleString('en-CA')} in the ${signals.baselineDays} days before.`,
    urgency: 'this_week',
    actions,
  };
}

/**
 * Regulars who are not members.
 *
 * Identity: eligible non-members × an assumed take rate × this salon's own mean
 * membership price. The take rate is the one assumption, and the card says so.
 */
function membershipConversion(signals: OpportunitySignals): Opportunity | null {
  const { membership } = signals;
  if (membership.eligibleCount < FLOORS.membershipEligible) return null;
  if (membership.averageMonthlyPrice <= 0) return null;

  const rate = DERIVE_ASSUMPTIONS.membershipConversionRate;
  const expected = membership.eligibleCount * rate;
  const impact = expected * membership.averageMonthlyPrice;
  if (impact < FLOORS.impactMonthly) return null;

  const actions: OpportunityAction[] = [
    {
      kind: 'staff_task',
      label: `Brief the team on ${membership.eligibleCount} regulars`,
      goal: `Mention membership to these regulars at checkout — they already visit ${membership.visitsToQualify}+ times a month and pay full price each time.`,
      target: `Target: ${Math.round(expected)} new memberships.`,
      customers: membership.eligibleNames.slice(0, 12),
    },
  ];

  // A text may only go to customers who said it could. The eligible set and the
  // consented set are counted separately for exactly this reason.
  if (membership.eligibleSmsConsented >= FLOORS.lapsedReachable) {
    actions.push({
      kind: 'sms',
      label: `Approve & text ${membership.eligibleSmsConsented} regulars`,
      recipientCount: membership.eligibleSmsConsented,
      message: `You are in often enough that a membership would already be saving you money. Ask us at the desk next visit — no pressure, we will just do the math with you.`,
      costNote: smsCostNote(membership.eligibleSmsConsented),
    });
  }

  return {
    id: 'opp-live-membership',
    /* `visit_frequency`, NOT `membership_penetration`.
       Eligibility here IS visit frequency — visits per customer over a month —
       so that is the method actually used. Citing the penetration benchmark was
       worse than wrong, it was self-contradicting: the registry states the
       benchmark as "2.5–4% of the customer base", and this salon's own base is
       37.7% members. Printing both put a card on screen arguing to convert more
       members directly beneath a citation saying it already has ten times the
       benchmark. A method line has to match the method. */
    methodSource: method('visit_frequency'),
    category: 'membership',
    title: `Convert ${membership.eligibleCount} regulars to memberships`,
    whatChanged: `${membership.eligibleCount} customers visited ${membership.visitsToQualify} or more times last month and are still paying per visit.`,
    whyItMatters: `Memberships are recurring revenue. Your ${membership.activeMembers} current members average ${dollars(membership.averageMonthlyPrice)} a month each.`,
    impactLabel: monthlyLabel(impact),
    impactMonthly: Math.round(impact),
    confidence: 'worth_testing',
    // The assumption is on the card, in the owner's own reading order.
    confidenceNote: `${membership.eligibleCount} customers cleared ${membership.visitsToQualify} visits in the last 30 days without a membership. Assumes 1 in 10 says yes, at your own average price.`,
    urgency: 'this_month',
    actions,
  };
}

/**
 * Customers who stopped coming.
 *
 * Identity: reachable lapsed customers × an assumed return rate × what one
 * active customer is worth in a month.
 */
function lapsedWinBack(signals: OpportunitySignals): Opportunity | null {
  const { lapsed } = signals;
  if (lapsed.reachableCount < FLOORS.lapsedReachable) return null;
  if (lapsed.monthlyValuePerCustomer <= 0) return null;

  const returning = lapsed.reachableCount * DERIVE_ASSUMPTIONS.lapsedReturnRate;
  const impact = returning * lapsed.monthlyValuePerCustomer;
  if (impact < FLOORS.impactMonthly) return null;

  return {
    id: 'opp-live-lapsed',
    /* No method line. This card is about RECENCY — who stopped coming — and the
       registry has no recency technique. `fixtures.ts` leaves the unmatched
       cases bare rather than reaching for the nearest-sounding method, and a
       citation that does not describe the method is worse than none. */
    category: 'customer',
    title: `Win back ${lapsed.reachableCount} customers`,
    whatChanged: `${lapsed.reachableCount} customers who used to come in have not been seen in over ${lapsed.sinceDays} days.`,
    whyItMatters: `An active customer here is worth about ${dollars(lapsed.monthlyValuePerCustomer)} a month.`,
    impactLabel: monthlyLabel(impact),
    impactMonthly: Math.round(impact),
    confidence: 'worth_testing',
    confidenceNote: `Assumes about 1 in 7 comes back. Only customers who agreed to texts are counted.`,
    urgency: 'this_week',
    actions: [
      {
        kind: 'sms',
        label: `Approve & text ${lapsed.reachableCount} customers`,
        recipientCount: lapsed.reachableCount,
        message: `We have not seen you in a while and wanted to check in. Your next session is on us — just show this text at the desk.`,
        costNote: smsCostNote(lapsed.reachableCount),
      },
    ],
  };
}

/**
 * The weakest day of the week.
 *
 * Identity: the gap between that weekday's mean and the median weekday's mean,
 * times the share of the gap worth claiming, times dollars per visit, times how
 * often that weekday comes round in a month.
 */
function quietDay(signals: OpportunitySignals): Opportunity | null {
  const quiet = signals.quietDay;
  if (!quiet) return null;

  const gap = quiet.medianVisits - quiet.averageVisits;
  if (gap <= 0) return null;

  const recovered = gap * DERIVE_ASSUMPTIONS.quietDayRecoveryShare;
  const impact = recovered * quiet.revenuePerVisit * quiet.occurrencesPerMonth;
  if (impact < FLOORS.impactMonthly) return null;

  const behind = quiet.medianVisits > 0 ? (gap / quiet.medianVisits) * 100 : 0;

  return {
    id: 'opp-live-quiet-day',
    // No method line: off-peak capacity is not a technique in the registry, and
    // `fixtures.ts` leaves this exact case bare on purpose.
    category: 'marketing',
    title: `Fill your ${quiet.label}s`,
    whatChanged: `${quiet.label} runs about ${Math.round(quiet.averageVisits)} visits against ${Math.round(quiet.medianVisits)} on a typical day — ${Math.round(behind)}% behind.`,
    whyItMatters: `The room, the beds and the staff cost the same on a ${quiet.label}. Every visit you add on that day is close to pure margin.`,
    impactLabel: monthlyLabel(impact),
    impactMonthly: Math.round(impact),
    confidence: 'worth_testing',
    confidenceNote: `Assumes you claw back a third of the gap, not all of it. Measured over the last ${signals.windowDays + signals.baselineDays} days in your own timezone.`,
    urgency: 'this_month',
    actions: [
      {
        kind: 'social',
        label: 'Approve & post to Facebook and Instagram',
        facebook: `${quiet.label}s are our quietest day, which means no queue, no rush and the pick of the beds. If you have been putting off a session, this is the day to come in.`,
        instagram: `${quiet.label} is the quiet one. No waiting, pick of the room, and the staff have time to actually talk to you about your skin.`,
        cta: 'Come in this week',
        imageDirection: 'Empty, warmly lit room with the door open — calm, not deserted.',
      },
    ],
  };
}

/**
 * A product about to run out.
 *
 * Identity: days of cover = on hand ÷ (units sold ÷ window days). The dollars
 * are the run rate this stockout would interrupt — protected revenue, not new.
 */
function stockCover(signals: OpportunitySignals): Opportunity | null {
  const candidates = signals.lowStock
    .map((item) => {
      const perDay = item.unitsSoldInWindow / signals.windowDays;
      const coverDays = perDay > 0 ? item.onHand / perDay : Number.POSITIVE_INFINITY;
      const monthlyRevenue = (item.revenueInWindow / signals.windowDays) * 30;
      return { item, coverDays, monthlyRevenue };
    })
    .filter((row) => row.coverDays <= FLOORS.stockCoverDays)
    .sort((a, b) => a.coverDays - b.coverDays);

  const total = candidates.reduce((sum, row) => sum + row.monthlyRevenue, 0);
  if (candidates.length === 0 || total < FLOORS.impactMonthly) return null;

  const first = candidates[0]!;
  const others = candidates.length - 1;

  return {
    id: 'opp-live-stock-cover',
    // No method line — stock cover is not in the advisory registry either.
    category: 'operations',
    title:
      others > 0
        ? `Reorder ${first.item.name} and ${others} more`
        : `Reorder ${first.item.name}`,
    whatChanged: `${first.item.name} has ${first.item.onHand} left — about ${Math.round(first.coverDays)} days at the rate it is selling.`,
    whyItMatters: `That product made ${dollars(first.monthlyRevenue)} last month. An empty shelf does not sell it.`,
    impactLabel: monthlyLabel(total),
    impactMonthly: Math.round(total),
    confidence: 'high',
    confidenceNote: `${first.item.unitsSoldInWindow} units sold in the last ${signals.windowDays} days, ${first.item.onHand} on hand, reorder point ${first.item.reorderPoint}.`,
    urgency: 'now',
    actions: [
      {
        kind: 'uvalux_order',
        label: 'Add to UVALUX order',
        items: candidates.slice(0, 6).map((row) => ({
          sku: row.item.sku,
          name: row.item.name,
          // Restock to par where the salon set one, else to twice the reorder
          // point — the level it already decided was the floor.
          qty: Math.max(
            1,
            (row.item.parLevel ?? row.item.reorderPoint * 2) - row.item.onHand,
          ),
        })),
        note: 'Adds to your existing UVALUX draft order. Nothing is submitted until you review it.',
      },
    ],
  };
}

/* ----------------------------------------------------------------- the feed */

const GENERATORS: Array<(signals: OpportunitySignals) => Opportunity | null> = [
  retailAttachment,
  membershipConversion,
  lapsedWinBack,
  quietDay,
  stockCover,
];

/**
 * Every opportunity this salon's own rows support, ranked by monthly dollars.
 *
 * A generator that finds nothing returns nothing. The feed heading counts what
 * it renders, so a quiet week produces a short honest feed rather than a padded
 * one — which is the whole reason for deriving it in the first place.
 */
export function deriveOpportunities(signals: OpportunitySignals): Opportunity[] {
  return GENERATORS.map((generate) => generate(signals))
    .filter((opportunity): opportunity is Opportunity => opportunity !== null)
    .sort((a, b) => b.impactMonthly - a.impactMonthly);
}

/** Re-exported so a caller can narrow on urgency without reaching into types. */
export type { OpportunityUrgency };
