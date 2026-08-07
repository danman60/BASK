/**
 * The Compass portfolio — 12 accounts across BC/AB/ON/QC (PRODUCT_SPEC §20).
 *
 * Sunset Ridge is account #1: the rep has to be able to watch its draft order
 * land on the account timeline during Act 2 of the pitch. The other eleven
 * exist to make the network map and the call list read as a real book of
 * business, and four of them carry named beats:
 *
 *   Maple Glow Tanning    — retail decline arc (the call-brief demo)
 *   Northern Sun Wellness — expansion-ready arc
 *   Rivière Lumière       — Private consent tier (proves the filter works)
 *   Harbourlight Studio   — new opening (onboarding state)
 *   Aurora Collective ×2  — one org, two salons (multi-location teaser)
 */

import { addDays, zonedToUtc, type DateOnly } from '@bask/core';

import { DAY_ZERO } from './constants';
import { id } from './ids';
import type { Rng } from './rng';
import type {
  AccountRow,
  CoachingRequestRow,
  ConsentAuditEntryRow,
  ConsentProfileRow,
  ContactLogRow,
  OrgRow,
  PlaybookRow,
  SalonRow,
  SignalSnapshotRow,
} from './types';

export interface PortfolioSeed {
  slug: string;
  name: string;
  orgSlug: string;
  orgName: string;
  city: string;
  region: string;
  timezone: string;
  status: SalonRow['status'];
  lifecycle: AccountRow['lifecycle'];
  healthScore: number;
  annualWholesaleValue: number;
  territory: string;
  repKey: string;
  consentTier: ConsentProfileRow['tier'];
  openedMonthsAgo: number;
  /** The signal that lands on the rep's call list. */
  signal: {
    type: string;
    severity: SignalSnapshotRow['severity'];
    headline: string;
    metrics: Record<string, unknown>;
  } | null;
}

/** Sunset Ridge is defined in `sunset-ridge.ts`; this is the other eleven. */
export const PORTFOLIO: PortfolioSeed[] = [
  {
    slug: 'maple-glow',
    name: 'Maple Glow Tanning',
    orgSlug: 'maple-glow',
    orgName: 'Maple Glow Tanning Ltd.',
    city: 'Burlington',
    region: 'ON',
    timezone: 'America/Toronto',
    status: 'active',
    lifecycle: 'at_risk',
    healthScore: 48,
    annualWholesaleValue: 41200,
    territory: 'Ontario',
    repKey: 'rep-halloran',
    consentTier: 'coaching',
    openedMonthsAgo: 84,
    signal: {
      type: 'retail_decline',
      severity: 'high',
      headline: 'Retail is down 17% over eight weeks',
      metrics: { retailChangePercent: -17, windowWeeks: 8, reorderGapDays: 62 },
    },
  },
  {
    slug: 'northern-sun',
    name: 'Northern Sun Wellness',
    orgSlug: 'northern-sun',
    orgName: 'Northern Sun Wellness Inc.',
    city: 'Grande Prairie',
    region: 'AB',
    timezone: 'America/Edmonton',
    status: 'active',
    lifecycle: 'expansion',
    healthScore: 88,
    annualWholesaleValue: 78400,
    territory: 'Alberta',
    repKey: 'rep-carrow',
    consentTier: 'coaching',
    openedMonthsAgo: 52,
    signal: {
      type: 'expansion_ready',
      severity: 'info',
      headline: 'Booked solid four weeks running — ready for a second room',
      metrics: { utilisationPercent: 91, waitlistCount: 34, memberGrowthPercent: 19 },
    },
  },
  {
    slug: 'riviere-lumiere',
    name: 'Rivière Lumière',
    orgSlug: 'riviere-lumiere',
    orgName: 'Rivière Lumière SENC',
    city: 'Trois-Rivières',
    region: 'QC',
    timezone: 'America/Toronto',
    status: 'active',
    lifecycle: 'established',
    healthScore: 72,
    annualWholesaleValue: 33500,
    territory: 'Québec',
    repKey: 'rep-delacroix',
    // Private tier: Compass sees an account exists and nothing else. This is the
    // trust beat — the consent filter has to visibly cost UVALUX something.
    consentTier: 'private',
    openedMonthsAgo: 61,
    signal: null,
  },
  {
    slug: 'harbourlight',
    name: 'Harbourlight Studio',
    orgSlug: 'harbourlight',
    orgName: 'Harbourlight Studio Co.',
    city: 'Nanaimo',
    region: 'BC',
    timezone: 'America/Vancouver',
    status: 'onboarding',
    lifecycle: 'new_opening',
    healthScore: 62,
    annualWholesaleValue: 12000,
    territory: 'BC Interior',
    repKey: 'rep-carrow',
    consentTier: 'benchmarks',
    openedMonthsAgo: 1,
    signal: {
      type: 'onboarding_stalled',
      severity: 'medium',
      headline: 'Opened three weeks ago, no retail order yet',
      metrics: { daysOpen: 21, ordersPlaced: 0, roomsInstalled: 4 },
    },
  },
  {
    slug: 'aurora-westside',
    name: 'Aurora Collective — Westside',
    orgSlug: 'aurora-collective',
    orgName: 'Aurora Collective',
    city: 'Calgary',
    region: 'AB',
    timezone: 'America/Edmonton',
    status: 'active',
    lifecycle: 'expansion',
    healthScore: 84,
    annualWholesaleValue: 96500,
    territory: 'Alberta',
    repKey: 'rep-carrow',
    consentTier: 'coaching',
    openedMonthsAgo: 39,
    signal: {
      type: 'multi_location_lift',
      severity: 'info',
      headline: 'Westside is outperforming Beltline on retail by 23%',
      metrics: { retailPerVisitDelta: 23, siblingSlug: 'aurora-beltline' },
    },
  },
  {
    slug: 'aurora-beltline',
    name: 'Aurora Collective — Beltline',
    orgSlug: 'aurora-collective',
    orgName: 'Aurora Collective',
    city: 'Calgary',
    region: 'AB',
    timezone: 'America/Edmonton',
    status: 'active',
    lifecycle: 'established',
    healthScore: 69,
    annualWholesaleValue: 71300,
    territory: 'Alberta',
    repKey: 'rep-carrow',
    consentTier: 'coaching',
    openedMonthsAgo: 27,
    signal: {
      type: 'retail_decline',
      severity: 'medium',
      headline: 'Retail per visit trails its sister location',
      metrics: { retailChangePercent: -9, siblingSlug: 'aurora-westside' },
    },
  },
  {
    slug: 'copperline',
    name: 'Copperline Tan Bar',
    orgSlug: 'copperline',
    orgName: 'Copperline Tan Bar',
    city: 'Kamloops',
    region: 'BC',
    timezone: 'America/Vancouver',
    status: 'active',
    lifecycle: 'established',
    healthScore: 76,
    annualWholesaleValue: 38900,
    territory: 'BC Interior',
    repKey: 'rep-carrow',
    consentTier: 'benchmarks',
    openedMonthsAgo: 46,
    signal: {
      type: 'reorder_due',
      severity: 'low',
      headline: 'Usual bronzer reorder is two weeks overdue',
      metrics: { daysSinceLastOrder: 58, typicalCadenceDays: 42 },
    },
  },
  {
    slug: 'glasswing',
    name: 'Glasswing Sun Studio',
    orgSlug: 'glasswing',
    orgName: 'Glasswing Sun Studio',
    city: 'Ottawa',
    region: 'ON',
    timezone: 'America/Toronto',
    status: 'active',
    lifecycle: 'established',
    healthScore: 81,
    annualWholesaleValue: 52700,
    territory: 'Ontario',
    repKey: 'rep-halloran',
    consentTier: 'coaching',
    openedMonthsAgo: 58,
    signal: null,
  },
  {
    slug: 'petit-soleil',
    name: 'Petit Soleil',
    orgSlug: 'petit-soleil',
    orgName: 'Petit Soleil Inc.',
    city: 'Sherbrooke',
    region: 'QC',
    timezone: 'America/Toronto',
    status: 'active',
    lifecycle: 'established',
    healthScore: 66,
    annualWholesaleValue: 27400,
    territory: 'Québec',
    repKey: 'rep-delacroix',
    consentTier: 'benchmarks',
    openedMonthsAgo: 71,
    signal: {
      type: 'membership_churn',
      severity: 'medium',
      headline: 'Membership cancellations up for a third month',
      metrics: { churnPercent: 11, monthsRising: 3 },
    },
  },
  {
    slug: 'saltspray',
    name: 'Saltspray Tan & Spa',
    orgSlug: 'saltspray',
    orgName: 'Saltspray Tan & Spa',
    city: 'Victoria',
    region: 'BC',
    timezone: 'America/Vancouver',
    status: 'active',
    lifecycle: 'established',
    healthScore: 79,
    annualWholesaleValue: 44100,
    territory: 'BC Coastal',
    repKey: 'rep-carrow',
    consentTier: 'coaching',
    openedMonthsAgo: 63,
    signal: null,
  },
  {
    slug: 'ironwood',
    name: 'Ironwood Tanning Co.',
    orgSlug: 'ironwood',
    orgName: 'Ironwood Tanning Co.',
    city: 'Thunder Bay',
    region: 'ON',
    timezone: 'America/Toronto',
    status: 'paused',
    lifecycle: 'churned',
    healthScore: 22,
    annualWholesaleValue: 4800,
    territory: 'Ontario',
    repKey: 'rep-halloran',
    consentTier: 'benchmarks',
    openedMonthsAgo: 92,
    signal: {
      type: 'account_dormant',
      severity: 'high',
      headline: 'No order in five months and no reply to the last two calls',
      metrics: { daysSinceLastOrder: 154, unansweredContacts: 2 },
    },
  },
];

/** Dealer-side coaching content, keyed to signal types. Global lookup table. */
export const PLAYBOOKS: Array<Omit<PlaybookRow, 'createdAt' | 'updatedAt'>> = [
  {
    key: 'retail-reset',
    title: 'Retail reset conversation',
    category: 'retail',
    targetSignalType: 'retail_decline',
    content: {
      opener:
        'Their retail is down and they may not have noticed. Lead with the number, not the pitch.',
      steps: [
        'Name the trend and the window: what it was, what it is now.',
        'Ask what changed on the floor — staffing, display, a product they ran out of.',
        'Offer the two-SKU starter reset rather than a full order.',
      ],
      avoid: ['Opening with a catalogue', 'Blaming their staff'],
    },
    isActive: true,
  },
  {
    key: 'expansion-conversation',
    title: 'Second-room conversation',
    category: 'growth',
    targetSignalType: 'expansion_ready',
    content: {
      opener: 'They are turning people away. That is a capacity problem, not a marketing one.',
      steps: [
        'Confirm the utilisation number with them.',
        'Walk the payback maths on one more bed.',
        'Offer the financing sheet and an install window.',
      ],
      avoid: ['Assuming they have the floor space'],
    },
    isActive: true,
  },
  {
    key: 'new-opening-checklist',
    title: 'First 90 days',
    category: 'onboarding',
    targetSignalType: 'onboarding_stalled',
    content: {
      opener: 'A new salon with no retail order usually means nobody showed them the display kit.',
      steps: ['Confirm the room build is finished.', 'Ship the starter display.', 'Book a training call.'],
      avoid: ['Pushing volume before they have traffic'],
    },
    isActive: true,
  },
  {
    key: 'reorder-nudge',
    title: 'Overdue reorder',
    category: 'retail',
    targetSignalType: 'reorder_due',
    content: {
      opener: 'Their cadence slipped. Usually it is a cash-flow month, not a competitor.',
      steps: ['Ask about the month rather than the order.', 'Offer a split shipment.'],
      avoid: ['Implying they forgot'],
    },
    isActive: true,
  },
  {
    key: 'membership-churn',
    title: 'Membership churn',
    category: 'retention',
    targetSignalType: 'membership_churn',
    content: {
      opener: 'Three months of rising cancellations is a pattern, not a bad month.',
      steps: ['Ask what members say when they cancel.', 'Share the tier structure that works elsewhere.'],
      avoid: ['Suggesting a discount as the first move'],
    },
    isActive: true,
  },
  {
    key: 'dormant-winback',
    title: 'Dormant account win-back',
    category: 'retention',
    targetSignalType: 'account_dormant',
    content: {
      opener: 'Two unanswered calls means the last approach did not work. Change the channel.',
      steps: ['Send one short note, not a call.', 'Ask a single question.', 'Give them an easy no.'],
      avoid: ['A third voicemail'],
    },
    isActive: true,
  },
];

export interface PortfolioBuild {
  orgs: OrgRow[];
  salons: SalonRow[];
  accounts: AccountRow[];
  consentProfiles: ConsentProfileRow[];
  consentAuditEntries: ConsentAuditEntryRow[];
  signalSnapshots: SignalSnapshotRow[];
  coachingRequests: CoachingRequestRow[];
  contactLogs: ContactLogRow[];
}

export function buildPortfolio(
  rng: Rng,
  repIdByKey: Map<string, string>,
  createdAt: Date,
): PortfolioBuild {
  const portfolioRng = rng.child('portfolio');
  const out: PortfolioBuild = {
    orgs: [],
    salons: [],
    accounts: [],
    consentProfiles: [],
    consentAuditEntries: [],
    signalSnapshots: [],
    coachingRequests: [],
    contactLogs: [],
  };

  const seenOrgs = new Set<string>();
  const forDate = zonedToUtc(DAY_ZERO, 6, 0, 'UTC');

  for (const [index, seed] of PORTFOLIO.entries()) {
    const orgId = id('org', seed.orgSlug);
    if (!seenOrgs.has(seed.orgSlug)) {
      seenOrgs.add(seed.orgSlug);
      out.orgs.push({
        id: orgId,
        name: seed.orgName,
        slug: seed.orgSlug,
        createdAt,
        updatedAt: createdAt,
      });
    }

    const salonId = id('salon', seed.slug);
    const openedAt = zonedToUtc(addDays(DAY_ZERO, -seed.openedMonthsAgo * 30), 9, 0, seed.timezone);

    out.salons.push({
      id: salonId,
      orgId,
      name: seed.name,
      slug: seed.slug,
      status: seed.status,
      addressLine1: `${portfolioRng.int(10, 4800)} ${portfolioRng.pick(['Main', 'Lakeshore', 'Bridge', 'Elm', 'Harbour', 'Station'])} St`,
      city: seed.city,
      region: seed.region,
      country: 'CA',
      postalCode: null,
      phone: null,
      email: null,
      timezone: seed.timezone,
      theme: 'sunset',
      openedAt,
      createdAt: openedAt,
      updatedAt: openedAt,
    });

    const repId = repIdByKey.get(seed.repKey) ?? null;
    const accountId = id('account', seed.slug);
    const lastContactDays = portfolioRng.int(3, 40);

    out.accounts.push({
      id: accountId,
      salonId,
      accountNumber: `UVX-${String(2100 + index).padStart(5, '0')}`,
      lifecycle: seed.lifecycle,
      healthScore: seed.healthScore,
      annualWholesaleValue: seed.annualWholesaleValue,
      territory: seed.territory,
      assignedRepId: repId,
      lastContactAt: zonedToUtc(addDays(DAY_ZERO, -lastContactDays), 14, 0, seed.timezone),
      nextTouchAt: zonedToUtc(addDays(DAY_ZERO, portfolioRng.int(1, 21)), 10, 0, seed.timezone),
      metadata: { region: seed.region },
      createdAt: openedAt,
      updatedAt: createdAt,
    });

    const consentProfileId = id('consent-profile', seed.slug);
    out.consentProfiles.push({
      id: consentProfileId,
      salonId,
      tier: seed.consentTier,
      updatedByStaffId: null,
      effectiveAt: openedAt,
      createdAt: openedAt,
      updatedAt: openedAt,
    });
    out.consentAuditEntries.push({
      id: id('consent-audit', `${seed.slug}:initial`),
      salonId,
      consentProfileId,
      fromTier: null,
      toTier: seed.consentTier,
      changedByStaffId: null,
      note: 'Set at onboarding',
      changedAt: openedAt,
    });

    // A Private-tier salon contributes no signals. Compass must show an account
    // it can name and nothing it can measure.
    if (seed.signal && seed.consentTier !== 'private') {
      out.signalSnapshots.push({
        id: id('signal', `${seed.slug}:${seed.signal.type}`),
        accountId,
        salonId,
        signalType: seed.signal.type,
        severity: seed.signal.severity,
        headline: seed.signal.headline,
        metrics: seed.signal.metrics,
        evidence: { source: 'portfolio_rollup', consentTier: seed.consentTier },
        forDate,
        createdAt,
      });
    }

    out.contactLogs.push({
      id: id('contact-log', `${seed.slug}:last`),
      accountId,
      salonId,
      repId,
      channel: portfolioRng.weighted([
        ['call', 0.55],
        ['email', 0.25],
        ['visit', 0.15],
        ['text', 0.05],
      ] as const),
      outcome: portfolioRng.pick([
        'Left a voicemail',
        'Spoke with the owner',
        'Order discussed, nothing placed',
        'Booked a follow-up',
      ]),
      notes: null,
      playbookKey: seed.signal
        ? (PLAYBOOKS.find((p) => p.targetSignalType === seed.signal!.type)?.key ?? null)
        : null,
      durationMinutes: portfolioRng.int(4, 26),
      contactedAt: zonedToUtc(addDays(DAY_ZERO, -lastContactDays), 14, 0, seed.timezone),
      createdAt,
    });
  }

  // Maple Glow asked for help themselves — the "their request, not just our
  // signal" line in DESIGN_SPEC §3.4 has to be backed by a real row.
  const mapleSalonId = id('salon', 'maple-glow');
  out.coachingRequests.push({
    id: id('coaching-request', 'maple-glow:retail'),
    salonId: mapleSalonId,
    accountId: id('account', 'maple-glow'),
    topic: 'Retail has stalled and I do not know why',
    message:
      'Our lotion sales have been sliding since the spring and I have tried moving the display twice. Could someone talk me through what other salons our size are doing?',
    state: 'open',
    requestedByStaffId: null,
    assignedRepId: repIdByKey.get('rep-halloran') ?? null,
    response: null,
    requestedAt: zonedToUtc(addDays(DAY_ZERO, -2), 16, 30, 'America/Toronto'),
    respondedAt: null,
    closedAt: null,
  });

  return out;
}

export const PORTFOLIO_DAY_ZERO: DateOnly = DAY_ZERO;
