/**
 * Compass — the UVALUX-facing router (PRODUCT_SPEC §6, §14).
 *
 * THE RULE, and it has no exceptions: nothing about a salon leaves this file
 * except through `deriveAccountView`, which derives banded facts and then hands
 * them to `filterAccount` from `@bask/core/consent`. There is no "just for the
 * demo" path, no raw-row escape hatch, and no procedure that reads a salon table
 * and returns it. If a field is not declared in `COMPASS_FIELDS`, Compass cannot
 * render it — that is the review step the design exists to force
 * (IMPLEMENTATION_SPEC §2).
 *
 * Also here: `dataSharingRouter`, the Bask-side "What UVALUX sees" screen. It
 * lives next to Compass on purpose — the screen and the thing it describes are
 * one feature, and splitting them is how they drift apart.
 */

import {
  buildHealthCohort,
  callPriorityScore,
  callStatusFor,
  canBrief,
  deriveAccountView,
  describeConsent,
  generateCallBrief,
  healthBandFactors,
  healthDistribution,
  suggestionFor,
  type AccountSignalInput,
  type CallStatus,
  type CoachingRequestSummary,
  type CompassAccountView,
  type ConsentTier,
  type DraftOrderSummary,
  type HealthCohort,
} from '@bask/core';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  compassProcedure,
  ownerProcedure,
  publicProcedure,
  router,
  salonProcedure,
} from '../trpc';

const consentTierSchema = z.enum(['private', 'benchmarks', 'coaching']);

// ---------------------------------------------------------------------------
// Loading + derivation (one path, used by every Compass procedure)
// ---------------------------------------------------------------------------

/**
 * Prisma `select` for the account graph. Deliberately narrow: the risk with a
 * consent filter is not that it fails, it is that somebody widens the query
 * upstream and the filter silently starts dropping more than anyone realises.
 * Selecting exactly what derivation needs makes that visible in review.
 */
const ACCOUNT_SELECT = {
  id: true,
  salonId: true,
  accountNumber: true,
  lifecycle: true,
  healthScore: true,
  annualWholesaleValue: true,
  territory: true,
  lastContactAt: true,
  nextTouchAt: true,
  metadata: true,
  assignedRep: { select: { firstName: true, lastName: true } },
  salon: {
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      region: true,
      status: true,
      openedAt: true,
      consentProfile: { select: { tier: true, effectiveAt: true } },
      _count: { select: { rooms: true } },
      rooms: { select: { roomType: { select: { label: true } } } },
    },
  },
  signalSnapshots: {
    orderBy: { forDate: 'desc' },
    take: 1,
    select: { signalType: true, severity: true, headline: true, metrics: true, forDate: true },
  },
  coachingRequests: {
    orderBy: { requestedAt: 'desc' },
    select: { id: true, topic: true, message: true, state: true, requestedAt: true },
  },
  draftOrders: {
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      state: true,
      total: true,
      submittedAt: true,
      createdAt: true,
      lines: { select: { description: true, quantity: true, reason: true } },
    },
  },
} as const;

type AccountRow = {
  id: string;
  salonId: string;
  accountNumber: string | null;
  lifecycle: string;
  healthScore: number | null;
  annualWholesaleValue: unknown;
  territory: string | null;
  lastContactAt: Date | null;
  nextTouchAt: Date | null;
  metadata: unknown;
  assignedRep: { firstName: string; lastName: string } | null;
  salon: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    region: string | null;
    status: string;
    openedAt: Date | null;
    consentProfile: { tier: ConsentTier; effectiveAt: Date } | null;
    _count: { rooms: number };
    rooms: Array<{ roomType: { label: string } | null }>;
  };
  signalSnapshots: Array<{
    signalType: string;
    severity: string;
    headline: string;
    metrics: unknown;
    forDate: Date;
  }>;
  coachingRequests: Array<{
    id: string;
    topic: string;
    message: string | null;
    state: string;
    requestedAt: Date;
  }>;
  draftOrders: Array<{
    id: string;
    state: string;
    total: unknown;
    submittedAt: Date | null;
    createdAt: Date;
    lines: Array<{ description: string | null; quantity: number; reason: string | null }>;
  }>;
};

/** Snoozes live on `account.metadata` — no schema change for a demo affordance. */
interface CompassMetadata {
  compass?: { snoozedUntil?: string | null };
  [key: string]: unknown;
}

function readSnooze(metadata: unknown): string | null {
  const meta = (metadata ?? {}) as CompassMetadata;
  return meta.compass?.snoozedUntil ?? null;
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toNumber' in value) {
    return (value as { toNumber(): number }).toNumber();
  }
  return Number(value ?? 0);
}

function daysBetween(from: Date | null, to: Date): number | null {
  if (!from) return null;
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}

function coachingSummaries(rows: AccountRow['coachingRequests']): CoachingRequestSummary[] {
  return rows.map((row) => ({
    id: row.id,
    topic: row.topic,
    state: row.state,
    requestedAt: row.requestedAt.toISOString(),
    message: row.message,
  }));
}

function draftOrderSummaries(rows: AccountRow['draftOrders']): DraftOrderSummary[] {
  return rows.map((row) => ({
    id: row.id,
    state: row.state,
    total: toNumber(row.total),
    lineCount: row.lines.length,
    lines: row.lines.map((line) => ({
      description: line.description ?? 'Catalogue item',
      quantity: line.quantity,
      reason: line.reason,
    })),
    submittedAt: toIso(row.submittedAt),
    createdAt: row.createdAt.toISOString(),
  }));
}

function signalOf(row: AccountRow): AccountSignalInput | null {
  const snapshot = row.signalSnapshots[0];
  if (!snapshot) return null;
  return {
    signalType: snapshot.signalType,
    severity: snapshot.severity,
    headline: snapshot.headline,
    metrics: (snapshot.metrics ?? {}) as Record<string, unknown>,
  };
}

function viewOf(row: AccountRow, cohort: HealthCohort): CompassAccountView {
  const tier = row.salon.consentProfile?.tier ?? 'benchmarks';
  const roomTypes = [
    ...new Set(
      row.salon.rooms
        .map((room) => room.roomType?.label)
        .filter((label): label is string => Boolean(label)),
    ),
  ];

  return deriveAccountView({
    envelope: {
      accountId: row.id,
      salonId: row.salonId,
      salonSlug: row.salon.slug,
      accountNumber: row.accountNumber,
      territory: row.territory,
      repName: row.assignedRep ? `${row.assignedRep.firstName} ${row.assignedRep.lastName}` : null,
      lastContactAt: toIso(row.lastContactAt),
      snoozedUntil: readSnooze(row.metadata),
    },
    consentTier: tier,
    salonName: row.salon.name,
    city: row.salon.city,
    region: row.salon.region,
    salonStatus: row.salon.status,
    healthScore: row.healthScore,
    lifecycle: row.lifecycle,
    roomCount: row.salon._count.rooms > 0 ? row.salon._count.rooms : null,
    equipmentProfile:
      row.salon._count.rooms > 0 ? { roomTypes, deviceCount: row.salon._count.rooms } : null,
    lastActiveAt: toIso(row.lastContactAt)?.slice(0, 10) ?? null,
    signal: signalOf(row),
    coachingRequests: coachingSummaries(row.coachingRequests),
    draftOrders: draftOrderSummaries(row.draftOrders),
    cohort,
  });
}

/** The virtual demo clock, so Compass ages things against the demo date. */
async function demoNow(db: { demoState: { findUnique(args: unknown): Promise<unknown> } }): Promise<Date> {
  const state = (await db.demoState.findUnique({ where: { id: 'default' } })) as
    | { virtualToday: Date }
    | null;
  return state?.virtualToday ?? new Date();
}

interface LoadedPortfolio {
  rows: AccountRow[];
  cohort: HealthCohort;
  now: Date;
}

async function loadPortfolio(db: never, repName?: string | null): Promise<LoadedPortfolio> {
  const client = db as unknown as {
    account: { findMany(args: unknown): Promise<AccountRow[]> };
    demoState: { findUnique(args: unknown): Promise<unknown> };
  };
  const [rows, now] = await Promise.all([
    client.account.findMany({ select: ACCOUNT_SELECT, orderBy: { accountNumber: 'asc' } }),
    demoNow(client),
  ]);
  const scoped = repName
    ? rows.filter((row) =>
        row.assignedRep ? `${row.assignedRep.firstName} ${row.assignedRep.lastName}` === repName : false,
      )
    : rows;

  // The cohort is built from the WHOLE book of business, not the rep's slice —
  // a smaller denominator is exactly how a cohort becomes re-identifiable.
  const cohort = buildHealthCohort(
    rows.map((row) => ({
      consentTier: row.salon.consentProfile?.tier ?? 'benchmarks',
      healthScore: row.healthScore,
    })),
  );
  return { rows: scoped, cohort, now };
}

// ---------------------------------------------------------------------------
// Call List assembly
// ---------------------------------------------------------------------------

function buildCallCard(row: AccountRow, cohort: HealthCohort, now: Date) {
  const view = viewOf(row, cohort);
  const account = view.account;
  const signal = signalOf(row);

  /**
   * Read the SALON'S OWN activity off the filtered view, never off `row`.
   *
   * This is subtle and it bit once already: a private-tier account's raw rows
   * still contain its coaching requests, so deciding list membership from `row`
   * put Rivière Lumière-style accounts on the call list with an empty card. The
   * card leaked no fields — but its PRESENCE is itself a derived claim ("this
   * salon needs a call"), which is exactly what the private tier forbids.
   * `filterAccount` already dropped these keys; the fix is to believe it.
   */
  const openDraftOrders = (account.draftOrders ?? []).filter(
    (order) => order.state === 'submitted' || order.state === 'acknowledged',
  );
  const openCoaching = (account.coachingRequests ?? []).filter(
    (request) => request.state === 'open',
  );
  const daysSinceContact = daysBetween(row.lastContactAt, now);

  /**
   * What makes an account a CALL rather than just an account.
   *
   * Three real reasons, and a health band is not one of them: every coaching-tier
   * salon has a band, so admitting bands would put the whole book on the list and
   * the ranking would stop meaning anything. "Steady, nothing detected" belongs in
   * Accounts. A private-tier account can never qualify on business grounds at all —
   * there is nothing derivable to qualify on — but it still appears in Accounts by
   * name, which is the trust beat working rather than an omission.
   */
  const rankable =
    account.signalHeadline !== undefined && account.signalHeadline !== null
      ? true
      : openDraftOrders.length > 0 || openCoaching.length > 0;

  const status: CallStatus = callStatusFor({
    signal: account.signalType ? signal : null,
    hasOpenDraftOrder: openDraftOrders.length > 0,
    healthBand: account.healthBand ?? 'steady',
  });

  return {
    ...view,
    status,
    statusLabel: status,
    suggestion: suggestionFor(account.signalType ? signal : null, {
      hasOpenDraftOrder: openDraftOrders.length > 0,
      coachingRequest: openCoaching[0] ?? null,
    }),
    /** The footer thread — "their request, not just our signal". */
    theirRequest: openCoaching[0]
      ? { topic: openCoaching[0].topic, requestedAt: openCoaching[0].requestedAt }
      : null,
    openDraftOrder: openDraftOrders[0] ?? null,
    daysSinceContact,
    score: callPriorityScore({
      signal: account.signalType ? signal : null,
      hasOpenDraftOrder: openDraftOrders.length > 0,
      hasOpenCoachingRequest: openCoaching.length > 0,
      daysSinceContact,
      annualWholesaleValue: toNumber(row.annualWholesaleValue),
      healthBand: account.healthBand ?? 'steady',
    }),
    rankable,
    snoozedUntil: readSnooze(row.metadata),
  };
}

export type CallCard = ReturnType<typeof buildCallCard>;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const compassRouter = router({
  /** Kept from the M0 stub so /dev/api's RBAC probe keeps working. */
  surface: compassProcedure.query(({ ctx }) => ({
    domain: 'compass' as const,
    buildsIn: 'M1' as const,
    summary: 'Dealer network, accounts, signals and the rep call list.',
    scoped: 'uvalux-network' as const,
    implemented: true,
    role: ctx.role,
    consentFilterReady: true,
  })),

  /**
   * The rep's morning (PRODUCT_SPEC §14). Ranked by what a conversation could
   * change this week; snoozed accounts drop out until their snooze expires.
   */
  callList: compassProcedure
    .input(z.object({ includeSnoozed: z.boolean().default(false) }).default({ includeSnoozed: false }))
    .query(async ({ ctx, input }) => {
      const { rows, cohort, now } = await loadPortfolio(ctx.db as never);
      const cards = rows
        .map((row) => buildCallCard(row, cohort, now))
        .filter((card) => card.rankable)
        .filter((card) => {
          if (input.includeSnoozed) return true;
          if (!card.snoozedUntil) return true;
          return new Date(card.snoozedUntil).getTime() <= now.getTime();
        })
        .sort((a, b) => b.score - a.score);

      const all = rows.map((row) => ({
        consentTier: row.salon.consentProfile?.tier ?? ('benchmarks' as ConsentTier),
        healthScore: row.healthScore,
      }));

      return {
        forDate: now.toISOString().slice(0, 10),
        cards,
        portfolio: {
          total: rows.length,
          distribution: healthDistribution(all),
          cohortN: cohort.contributorCount,
          cohortSuppressed: cohort.suppressed,
        },
      };
    }),

  /** Network — leadership's screen. Bands with factors, never naked scores. */
  network: compassProcedure.query(async ({ ctx }) => {
    const { rows, cohort, now } = await loadPortfolio(ctx.db as never);

    const salons = rows.map((row) => {
      const view = viewOf(row, cohort);
      return {
        envelope: view.envelope,
        consentTier: view.consentTier,
        account: view.account,
        /**
         * The band's factors. Derived from the same fields the filter permits —
         * at a tier that hides signals there is nothing to explain, so the list
         * comes back empty rather than leaking a reason.
         */
        factors:
          view.account.healthBand === undefined
            ? []
            : healthBandFactors({
                lifecycle: row.lifecycle,
                salonStatus: row.salon.status,
                orderRecencyDays: view.account.orderRecencyDays ?? null,
                signal: signalOf(row),
              }),
      };
    });

    const all = rows.map((row) => ({
      consentTier: row.salon.consentProfile?.tier ?? ('benchmarks' as ConsentTier),
      healthScore: row.healthScore,
    }));

    // Adoption is a fact about UVALUX's own book — how many salons run Bask —
    // not about any salon's business, so it needs no tier gate.
    const adoption = {
      total: rows.length,
      active: rows.filter((row) => row.salon.status === 'active').length,
      onboarding: rows.filter((row) => row.salon.status === 'onboarding').length,
      dormant: rows.filter((row) => row.salon.status === 'paused' || row.salon.status === 'churned')
        .length,
      sharingSignals: rows.filter((row) => row.salon.consentProfile?.tier === 'coaching').length,
      benchmarksOnly: rows.filter((row) => row.salon.consentProfile?.tier === 'benchmarks').length,
      private: rows.filter((row) => row.salon.consentProfile?.tier === 'private').length,
    };

    const byRegion = [...new Set(rows.map((row) => row.salon.region ?? '—'))].sort().map((region) => ({
      region,
      count: rows.filter((row) => (row.salon.region ?? '—') === region).length,
    }));

    /**
     * The three signal cards folded into Network (M1 has no standalone Signals
     * screen). Each is a rollup ACROSS the network, n-gated — never a window
     * onto one salon.
     */
    const signalCards = buildNetworkSignals(rows, cohort);

    return {
      forDate: now.toISOString().slice(0, 10),
      salons,
      distribution: healthDistribution(all),
      byRegion,
      adoption,
      signalCards,
      cohort: { n: cohort.contributorCount, suppressed: cohort.suppressed },
    };
  }),

  /** Accounts roster. Every account appears — including the private-tier one. */
  accounts: compassProcedure.query(async ({ ctx }) => {
    const { rows, cohort, now } = await loadPortfolio(ctx.db as never);
    return {
      forDate: now.toISOString().slice(0, 10),
      accounts: rows.map((row) => {
        const view = viewOf(row, cohort);
        // Filtered view, not raw rows — see the note in `buildCallCard`.
        const openDraftOrders = (view.account.draftOrders ?? []).filter(
          (order) => order.state === 'submitted' || order.state === 'acknowledged',
        );
        return {
          ...view,
          daysSinceContact: daysBetween(row.lastContactAt, now),
          openDraftOrderCount: openDraftOrders.length,
          openCoachingCount: (view.account.coachingRequests ?? []).filter(
            (request) => request.state === 'open',
          ).length,
        };
      }),
    };
  }),

  /**
   * Account detail + the timeline Lane 4's draft orders and coaching requests
   * arrive on. Timeline entries are assembled from rows that already passed the
   * filter, so a private-tier account's timeline shows only UVALUX's own
   * records — contacts the rep made — and nothing the salon did.
   */
  account: compassProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const client = ctx.db as unknown as {
        account: { findFirst(args: unknown): Promise<AccountRow | null> };
        contactLog: { findMany(args: unknown): Promise<ContactLogRow[]> };
      };
      const { cohort, now } = await loadPortfolio(ctx.db as never);

      const row = await client.account.findFirst({
        where: { salon: { slug: input.slug } },
        select: ACCOUNT_SELECT,
      });
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'No account for that salon.' });

      const contactLogs = await client.contactLog.findMany({
        where: { accountId: row.id },
        orderBy: { contactedAt: 'desc' },
        take: 25,
        select: {
          id: true,
          channel: true,
          outcome: true,
          notes: true,
          playbookKey: true,
          durationMinutes: true,
          contactedAt: true,
          rep: { select: { firstName: true, lastName: true } },
        },
      });

      const view = viewOf(row, cohort);
      const card = buildCallCard(row, cohort, now);

      return {
        ...view,
        status: card.status,
        suggestion: card.suggestion,
        daysSinceContact: card.daysSinceContact,
        factors:
          view.account.healthBand === undefined
            ? []
            : healthBandFactors({
                lifecycle: row.lifecycle,
                salonStatus: row.salon.status,
                orderRecencyDays: view.account.orderRecencyDays ?? null,
                signal: signalOf(row),
              }),
        timeline: buildTimeline(view, contactLogs),
        coachingLog: contactLogs
          .filter((log) => log.playbookKey !== null)
          .map((log) => ({
            id: log.id,
            playbookKey: log.playbookKey,
            outcome: log.outcome,
            contactedAt: log.contactedAt.toISOString(),
          })),
      };
    }),

  /**
   * The AI call brief (PRODUCT_SPEC §16). Opens in a side sheet, never a page.
   * Returns which path produced it so the demo can say so out loud.
   */
  callBrief: compassProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const client = ctx.db as unknown as {
        account: { findFirst(args: unknown): Promise<AccountRow | null> };
        playbook: { findUnique(args: unknown): Promise<PlaybookRow | null> };
      };
      const { cohort, now } = await loadPortfolio(ctx.db as never);
      const row = await client.account.findFirst({
        where: { salon: { slug: input.slug } },
        select: ACCOUNT_SELECT,
      });
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'No account for that salon.' });

      const card = buildCallCard(row, cohort, now);
      if (!canBrief(card)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'This salon shares nothing beyond its name. There is no brief to write — call them and ask.',
        });
      }

      const playbookKey = card.suggestion?.playbookKey ?? null;
      const playbookRow = playbookKey
        ? await client.playbook.findUnique({ where: { key: playbookKey } })
        : null;
      const content = (playbookRow?.content ?? {}) as {
        opener?: string;
        steps?: string[];
        avoid?: string[];
      };

      const result = await generateCallBrief({
        view: card,
        status: card.status,
        suggestion: card.suggestion,
        playbook: playbookRow
          ? {
              title: playbookRow.title,
              opener: content.opener ?? '',
              steps: content.steps ?? [],
              avoid: content.avoid ?? [],
            }
          : null,
        daysSinceContact: card.daysSinceContact,
        repName: card.envelope.repName,
      });

      // Logged, not just returned: "which AI path ran" is a demo question that
      // must be answerable after the fact, not only while the sheet is open.
      console.info(
        `[compass] call brief for ${input.slug}: path=${result.path} calledApi=${result.calledApi}` +
          (result.failureReason ? ` reason="${result.failureReason}"` : ''),
      );

      return result;
    }),

  /** Log contact — the inline form in the card footer. Writes a real row. */
  logContact: compassProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        channel: z.enum(['call', 'email', 'text', 'visit', 'other']).default('call'),
        outcome: z.string().min(1).max(200),
        notes: z.string().max(2000).optional(),
        durationMinutes: z.number().int().min(0).max(480).optional(),
        playbookKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const client = ctx.db as unknown as {
        account: { findFirst(args: unknown): Promise<{ id: string; salonId: string } | null> };
        contactLog: { create(args: unknown): Promise<{ id: string }> };
        staff: { findFirst(args: unknown): Promise<{ id: string } | null> };
      };
      const account = await client.account.findFirst({
        where: { salon: { slug: input.slug } },
        select: { id: true, salonId: true },
      });
      if (!account) throw new TRPCError({ code: 'NOT_FOUND', message: 'No account for that salon.' });

      const rep = await client.staff.findFirst({ where: { role: 'uvalux_rep' }, select: { id: true } });
      const now = await demoNow(ctx.db as never);

      const log = await client.contactLog.create({
        data: {
          accountId: account.id,
          salonId: account.salonId,
          repId: rep?.id ?? null,
          channel: input.channel,
          outcome: input.outcome,
          notes: input.notes ?? null,
          playbookKey: input.playbookKey ?? null,
          durationMinutes: input.durationMinutes ?? null,
          contactedAt: now,
        },
        select: { id: true },
      });

      await (ctx.db as unknown as { account: { update(args: unknown): Promise<unknown> } }).account.update(
        { where: { id: account.id }, data: { lastContactAt: now } },
      );

      return { id: log.id, contactedAt: now.toISOString() };
    }),

  /**
   * Snooze. Asks for a duration and remembers it — stored on the account's
   * metadata rather than in a new table, because a snooze is a rep's UI
   * preference, not a fact about the salon.
   */
  snooze: compassProcedure
    .input(z.object({ slug: z.string().min(1), days: z.number().int().min(1).max(90) }))
    .mutation(async ({ ctx, input }) => {
      const client = ctx.db as unknown as {
        account: {
          findFirst(args: unknown): Promise<{ id: string; metadata: unknown } | null>;
          update(args: unknown): Promise<unknown>;
        };
      };
      const account = await client.account.findFirst({
        where: { salon: { slug: input.slug } },
        select: { id: true, metadata: true },
      });
      if (!account) throw new TRPCError({ code: 'NOT_FOUND', message: 'No account for that salon.' });

      const now = await demoNow(ctx.db as never);
      const until = new Date(now.getTime() + input.days * 86_400_000);
      const metadata = (account.metadata ?? {}) as CompassMetadata;

      await client.account.update({
        where: { id: account.id },
        data: {
          metadata: { ...metadata, compass: { ...metadata.compass, snoozedUntil: until.toISOString() } },
          nextTouchAt: until,
        },
      });
      return { snoozedUntil: until.toISOString(), days: input.days };
    }),

  unsnooze: compassProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const client = ctx.db as unknown as {
        account: {
          findFirst(args: unknown): Promise<{ id: string; metadata: unknown } | null>;
          update(args: unknown): Promise<unknown>;
        };
      };
      const account = await client.account.findFirst({
        where: { salon: { slug: input.slug } },
        select: { id: true, metadata: true },
      });
      if (!account) throw new TRPCError({ code: 'NOT_FOUND', message: 'No account for that salon.' });
      const metadata = (account.metadata ?? {}) as CompassMetadata;
      await client.account.update({
        where: { id: account.id },
        data: { metadata: { ...metadata, compass: { ...metadata.compass, snoozedUntil: null } } },
      });
      return { snoozedUntil: null };
    }),

  /**
   * Schedule coaching from the rep side. Creates the same `CoachingRequest`
   * object a salon creates from its own Peers screen, so the Coaching surface
   * has one queue rather than two — who raised it is a field, not a table.
   */
  scheduleCoaching: compassProcedure
    .input(z.object({ slug: z.string().min(1), topic: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const client = ctx.db as unknown as {
        account: { findFirst(args: unknown): Promise<{ id: string; salonId: string } | null> };
        coachingRequest: { create(args: unknown): Promise<{ id: string }> };
        staff: { findFirst(args: unknown): Promise<{ id: string } | null> };
      };
      const account = await client.account.findFirst({
        where: { salon: { slug: input.slug } },
        select: { id: true, salonId: true },
      });
      if (!account) throw new TRPCError({ code: 'NOT_FOUND', message: 'No account for that salon.' });

      const rep = await client.staff.findFirst({ where: { role: 'uvalux_rep' }, select: { id: true } });
      const now = await demoNow(ctx.db as never);
      const created = await client.coachingRequest.create({
        data: {
          salonId: account.salonId,
          accountId: account.id,
          topic: input.topic,
          message: null,
          state: 'acknowledged',
          assignedRepId: rep?.id ?? null,
          requestedAt: now,
          respondedAt: now,
        },
        select: { id: true },
      });
      return { id: created.id };
    }),

  /** Coaching — targets, the playbook library, and measured outcomes. */
  coaching: compassProcedure.query(async ({ ctx }) => {
    const client = ctx.db as unknown as {
      playbook: { findMany(args: unknown): Promise<PlaybookRow[]> };
      contactLog: { findMany(args: unknown): Promise<ContactLogRow[]> };
    };
    const { rows, cohort, now } = await loadPortfolio(ctx.db as never);

    const [playbooks, logs] = await Promise.all([
      client.playbook.findMany({ where: { isActive: true }, orderBy: { key: 'asc' } }),
      client.contactLog.findMany({
        where: { playbookKey: { not: null } },
        orderBy: { contactedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          channel: true,
          outcome: true,
          notes: true,
          playbookKey: true,
          durationMinutes: true,
          contactedAt: true,
          rep: { select: { firstName: true, lastName: true } },
          account: { select: { salon: { select: { name: true, slug: true } } } },
        },
      }),
    ]);

    /**
     * Targets: accounts with an open ask or a coaching-shaped signal. Built from
     * the filtered view, so a salon that shares nothing can never become a
     * coaching target without asking first.
     */
    const targets = rows
      .map((row) => {
        const card = buildCallCard(row, cohort, now);
        // Filtered view, not raw rows — see the note in `buildCallCard`.
        const openCoaching = (card.account.coachingRequests ?? []).filter(
          (request) => request.state === 'open',
        );
        return {
          slug: card.envelope.salonSlug,
          salonName: card.account.salonName ?? 'Account',
          region: card.account.region ?? '—',
          status: card.status,
          playbookKey: card.suggestion?.playbookKey ?? null,
          headline: card.account.signalHeadline ?? null,
          theyAsked: openCoaching.length > 0,
          askedTopic: openCoaching[0]?.topic ?? null,
          score: card.score,
        };
      })
      .filter((target) => target.playbookKey !== null || target.theyAsked)
      .sort((a, b) => Number(b.theyAsked) - Number(a.theyAsked) || b.score - a.score);

    const outcomes = playbooks.map((playbook) => {
      const used = logs.filter((log) => log.playbookKey === playbook.key);
      return {
        playbookKey: playbook.key,
        title: playbook.title,
        timesUsed: used.length,
        lastUsedAt: used[0]?.contactedAt.toISOString() ?? null,
      };
    });

    return {
      targets,
      playbooks: playbooks.map((playbook) => ({
        key: playbook.key,
        title: playbook.title,
        category: playbook.category,
        targetSignalType: playbook.targetSignalType,
        content: playbook.content as { opener?: string; steps?: string[]; avoid?: string[] },
      })),
      outcomes,
      recentContacts: logs.slice(0, 12).map((log) => ({
        id: log.id,
        salonName: log.account?.salon.name ?? '—',
        slug: log.account?.salon.slug ?? null,
        channel: log.channel,
        outcome: log.outcome,
        playbookKey: log.playbookKey,
        contactedAt: log.contactedAt.toISOString(),
        repName: log.rep ? `${log.rep.firstName} ${log.rep.lastName}` : null,
      })),
    };
  }),
});

// ---------------------------------------------------------------------------
// Network signal cards (folded in — no standalone Signals screen in M1)
// ---------------------------------------------------------------------------

interface PlaybookRow {
  key: string;
  title: string;
  category: string | null;
  targetSignalType: string | null;
  content: unknown;
  isActive: boolean;
}

interface ContactLogRow {
  id: string;
  channel: string;
  outcome: string | null;
  notes: string | null;
  playbookKey: string | null;
  durationMinutes: number | null;
  contactedAt: Date;
  rep: { firstName: string; lastName: string } | null;
  account?: { salon: { name: string; slug: string } } | null;
}

/**
 * Three network-level rollups. Each counts salons, never names them, and each
 * is gated on the same minimum cohort as any other aggregate — a "signal" that
 * only two salons produced is two salons' private business wearing a hat.
 */
function buildNetworkSignals(rows: AccountRow[], cohort: HealthCohort) {
  const contributing = rows.filter((row) => row.salon.consentProfile?.tier === 'coaching');

  const count = (predicate: (row: AccountRow) => boolean) =>
    contributing.filter(predicate).length;

  const retailDecline = count((row) => row.signalSnapshots[0]?.signalType === 'retail_decline');
  const expansionReady = count((row) => row.signalSnapshots[0]?.signalType === 'expansion_ready');
  // Cadence is a fact about ORDERS, so it counts every account with a reorder or
  // dormancy signal, not only the coaching-tier ones.
  const orderingSlipped = rows.filter((row) => {
    const type = row.signalSnapshots[0]?.signalType;
    return type === 'reorder_due' || type === 'account_dormant';
  }).length;

  const salons = (n: number) => `${n} salon${n === 1 ? '' : 's'}`;

  return [
    {
      key: 'retail_softness',
      title: 'Retail is the network’s soft spot',
      body:
        retailDecline === 0
          ? `No salon sharing signals is showing a retail slide right now. That is worth protecting.`
          : `${salons(retailDecline)} of the ${contributing.length} sharing signals ${retailDecline === 1 ? 'is' : 'are'} showing a retail slide. The retail-reset playbook is the highest-leverage conversation this month.`,
      count: retailDecline,
      tone: 'warn' as const,
      suppressed: cohort.suppressed,
    },
    {
      key: 'expansion_demand',
      title: 'Capacity pressure is showing up as growth demand',
      body:
        expansionReady === 0
          ? 'Nobody is running hot enough at peak to justify a second-room conversation yet.'
          : `${salons(expansionReady)} ${expansionReady === 1 ? 'is' : 'are'} running at peak capacity long enough to justify a second-room conversation. That is equipment demand UVALUX can plan for.`,
      count: expansionReady,
      tone: 'good' as const,
      suppressed: cohort.suppressed,
    },
    {
      key: 'ordering_cadence',
      title: 'Ordering cadence is slipping at the edges',
      body:
        orderingSlipped === 0
          ? 'Every account is ordering on its usual cadence.'
          : `${orderingSlipped} account${orderingSlipped === 1 ? ' has' : 's have'} gone past their usual reorder window. Caught early these are a phone call; caught late they are a churn.`,
      count: orderingSlipped,
      tone: 'warn' as const,
      suppressed: cohort.suppressed,
    },
  ];
}

// ---------------------------------------------------------------------------
// Account timeline
// ---------------------------------------------------------------------------

export interface TimelineEntry {
  id: string;
  kind: 'draft_order' | 'coaching_request' | 'contact';
  at: string;
  title: string;
  body: string | null;
  /** Detail lines — draft-order lines carry their "because" (PRODUCT_SPEC §12). */
  detail: string[];
  /** True when the salon initiated it. The "their request" register. */
  theirs: boolean;
}

/**
 * The timeline Lane 4's draft orders and coaching requests arrive on.
 *
 * Salon-initiated entries are read off the FILTERED view — at a tier that hides
 * `draftOrders`/`coachingRequests` they simply are not there. Contact logs are
 * UVALUX's own records of its own calls, so they show at every tier.
 */
export function buildTimeline(view: CompassAccountView, contacts: ContactLogRow[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const order of view.account.draftOrders ?? []) {
    entries.push({
      id: `order-${order.id}`,
      kind: 'draft_order',
      at: order.submittedAt ?? order.createdAt,
      title:
        order.state === 'draft'
          ? 'Building an order in Bask'
          : `Order ${order.state} — ${order.lineCount} line${order.lineCount === 1 ? '' : 's'}`,
      body: `${formatMoney(order.total)} across ${order.lineCount} line${order.lineCount === 1 ? '' : 's'}.`,
      detail: order.lines.map((line) =>
        line.reason
          ? `${line.quantity} × ${line.description} — ${line.reason}`
          : `${line.quantity} × ${line.description}`,
      ),
      theirs: true,
    });
  }

  for (const request of view.account.coachingRequests ?? []) {
    entries.push({
      id: `coaching-${request.id}`,
      kind: 'coaching_request',
      at: request.requestedAt,
      title: `Asked for coaching — ${request.topic}`,
      body: request.message,
      detail: [`Status: ${request.state}`],
      theirs: request.state === 'open',
    });
  }

  for (const contact of contacts) {
    entries.push({
      id: `contact-${contact.id}`,
      kind: 'contact',
      at: contact.contactedAt.toISOString(),
      title: `${capitalise(contact.channel)}${contact.rep ? ` — ${contact.rep.firstName} ${contact.rep.lastName}` : ''}`,
      body: contact.outcome,
      detail: [
        contact.notes,
        contact.durationMinutes ? `${contact.durationMinutes} minutes` : null,
        contact.playbookKey ? `Playbook: ${contact.playbookKey}` : null,
      ].filter((line): line is string => Boolean(line)),
      theirs: false,
    });
  }

  return entries.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(
    value,
  );
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------------------------------------------------------------------------
// Bask side — "What UVALUX sees" (PRODUCT_SPEC §15)
// ---------------------------------------------------------------------------

/**
 * The consent screen's data, built from `describeConsent()` so the screen cannot
 * describe behaviour the filter does not have. Both previews come from the same
 * call — "what you see" and "what UVALUX sees" are two readings of one object,
 * not two hand-written lists that can drift apart.
 */
export const dataSharingRouter = router({
  current: salonProcedure.query(async ({ ctx }) => {
    const client = ctx.db as unknown as {
      consentProfile: { findUnique(args: unknown): Promise<{ tier: ConsentTier; effectiveAt: Date } | null> };
      consentAuditEntry: { findMany(args: unknown): Promise<AuditRow[]> };
      salon: { findUnique(args: unknown): Promise<{ name: string; slug: string } | null> };
    };

    const [profile, audit, salon] = await Promise.all([
      client.consentProfile.findUnique({
        where: { salonId: ctx.salonId },
        select: { tier: true, effectiveAt: true },
      }),
      client.consentAuditEntry.findMany({
        where: { salonId: ctx.salonId },
        orderBy: { changedAt: 'desc' },
        take: 10,
        select: { id: true, fromTier: true, toTier: true, note: true, changedAt: true },
      }),
      client.salon.findUnique({ where: { id: ctx.salonId }, select: { name: true, slug: true } }),
    ]);

    const tier: ConsentTier = profile?.tier ?? 'benchmarks';

    return {
      salonName: salon?.name ?? 'Your salon',
      salonSlug: salon?.slug ?? null,
      tier,
      effectiveAt: profile?.effectiveAt.toISOString() ?? null,
      /** One disclosure per tier, so the screen can preview a switch before it happens. */
      tiers: (['private', 'benchmarks', 'coaching'] as const).map((value) => ({
        tier: value,
        disclosure: describeConsent(value),
      })),
      audit: audit.map((entry) => ({
        id: entry.id,
        fromTier: entry.fromTier,
        toTier: entry.toTier,
        note: entry.note,
        changedAt: entry.changedAt.toISOString(),
      })),
    };
  }),

  /**
   * One click to change tier, including downgrading — no dark patterns, no
   * "are you sure you want to lose all these benefits" (PRODUCT_SPEC §15). Every
   * change writes an audit row; the tier and the audit move together or not at
   * all, which is why this is a transaction.
   */
  setTier: ownerProcedure
    .input(z.object({ tier: consentTierSchema, note: z.string().max(300).optional() }))
    .mutation(async ({ ctx, input }) => {
      const client = ctx.db as unknown as {
        consentProfile: {
          findUnique(args: unknown): Promise<{ id: string; tier: ConsentTier } | null>;
          upsert(args: unknown): Promise<{ id: string; tier: ConsentTier }>;
        };
        consentAuditEntry: { create(args: unknown): Promise<unknown> };
        $transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
      };

      const before = await client.consentProfile.findUnique({
        where: { salonId: ctx.salonId },
        select: { id: true, tier: true },
      });

      const now = new Date();
      const result = await client.$transaction(async (tx) => {
        const txc = tx as typeof client;
        const profile = await txc.consentProfile.upsert({
          where: { salonId: ctx.salonId },
          create: { salonId: ctx.salonId, tier: input.tier, effectiveAt: now },
          update: { tier: input.tier, effectiveAt: now },
          select: { id: true, tier: true },
        });
        await txc.consentAuditEntry.create({
          data: {
            salonId: ctx.salonId,
            consentProfileId: profile.id,
            fromTier: before?.tier ?? null,
            toTier: input.tier,
            note: input.note ?? 'Changed from Settings → Data sharing',
            changedAt: now,
          },
        });
        return profile;
      });

      return {
        tier: result.tier,
        previousTier: before?.tier ?? null,
        changedAt: now.toISOString(),
        disclosure: describeConsent(result.tier),
      };
    }),

  /**
   * Public so the Compass demo can read a tier without a salon in scope — it
   * returns a tier name and nothing else, which is a fact the salon publishes
   * to UVALUX by definition.
   */
  tierFor: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const client = ctx.db as unknown as {
        salon: {
          findUnique(args: unknown): Promise<{ consentProfile: { tier: ConsentTier } | null } | null>;
        };
      };
      const salon = await client.salon.findUnique({
        where: { slug: input.slug },
        select: { consentProfile: { select: { tier: true } } },
      });
      return { tier: salon?.consentProfile?.tier ?? null };
    }),
});

interface AuditRow {
  id: string;
  fromTier: ConsentTier | null;
  toTier: ConsentTier;
  note: string | null;
  changedAt: Date;
}
