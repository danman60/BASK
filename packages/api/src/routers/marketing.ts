/**
 * Studio — the marketing surface (PRODUCT_SPEC §16, DESIGN_SPEC §3.3).
 *
 * Owner-only throughout: campaigns spend goodwill and money. Two rules this
 * router exists to enforce, not merely to document:
 *
 *  1. **Nothing auto-sends.** `schedule` is the only procedure that moves a
 *     campaign out of `draft`, it requires an explicit call, and even then the
 *     campaign only becomes `sent`/`measured` when the demo clock passes its
 *     send date and the pipeline settles it. There is no send path here.
 *  2. **The audience number is the consent number.** Every count this router
 *     returns is the segment narrowed by who agreed to the campaign's channels.
 *     The whisper on screen quotes it verbatim, so it may never be the raw
 *     segment size.
 */

import {
  toDateOnly,
  addDays,
  dateOnlyToUtcMidnight,
  formatHourRange,
  weekdayName,
  weekdayNameForIndex,
  type DateOnly,
} from '@bask/core';
import type { PrismaClient } from '@bask/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  CAMPAIGN_TONES,
  badgeText,
  campaignContentSchema,
  campaignOfferSchema,
  checkOffer,
  generateCampaignContent,
  safeParseCampaignContent,
  suggestOffer,
  type CampaignContent,
  type CampaignGenerationInput,
  type CampaignTone,
} from '../ai/campaign';
import { ensureDemoState } from '../demo/clock';
import {
  COMPOSITE_LAPSED_MIDWEEK,
  SEGMENTS_IN_ORDER,
  audienceCriteria,
  audienceDescription,
  audienceLabel,
  computeReach,
  consentsTo,
  isSegmentKey,
  loadSegmentCustomers,
  matchesAudience,
  reachForChannels,
  type AudienceKey,
  type Channel,
  type SegmentCustomer,
} from '../segments';
import { ownerProcedure, router } from '../trpc';

const CHANNELS = ['instagram', 'facebook', 'sms', 'email'] as const;

const audienceKeySchema = z.string().refine(
  (value): value is AudienceKey => value === COMPOSITE_LAPSED_MIDWEEK || isSegmentKey(value),
  { message: 'Unknown audience' },
);

const toneSchema = z.enum(CAMPAIGN_TONES);
const channelSchema = z.enum(CHANNELS);

/** Salon guardrail settings. Hard-coded until the settings surface lands (M1 Lane 1). */
const SALON_GUARDRAILS = { maxDiscountPercent: 25, maxDiscountAmount: 50 } as const;

export const marketingRouter = router({
  /** Carried over from the M0 stub so `/dev/api` keeps listing this domain. */
  surface: ownerProcedure.query(({ ctx }) => ({
    domain: 'marketing' as const,
    buildsIn: 'M1' as const,
    summary: 'Segments, campaign drafts, approval and measured results.',
    scoped: 'salon' as const,
    implemented: true,
    salonId: ctx.salonId,
    role: ctx.role,
  })),

  /**
   * Every smart segment with a live count. The counts are computed from real
   * rows against the demo clock's today — advancing the clock moves them.
   */
  segments: ownerProcedure.query(async ({ ctx }) => {
    const today = await virtualToday(ctx.db);
    const { customers, ctx: segCtx } = await loadSegmentCustomers(ctx.db, ctx.salonId, today);

    const segments = SEGMENTS_IN_ORDER.map((s) => computeReach(s.key, customers, segCtx));
    // The composite the Tuesday beat targets. Listed last: it is a narrowing of
    // two segments above it, not a seventh peer.
    segments.push(computeReach(COMPOSITE_LAPSED_MIDWEEK, customers, segCtx));

    return {
      today,
      totalCustomers: customers.length,
      segments: segments.map(({ memberIds, ...rest }) => ({ ...rest, size: memberIds.length })),
    };
  }),

  /**
   * The Idea Shelf — 4–6 suggestions derived from what the data actually says
   * this week. Never a static list: each entry carries the number that
   * produced it, so "why is this here?" is answerable on the card.
   */
  ideaShelf: ownerProcedure.query(async ({ ctx }) => {
    const today = await virtualToday(ctx.db);
    const [{ customers, ctx: segCtx }, insights] = await Promise.all([
      loadSegmentCustomers(ctx.db, ctx.salonId, today),
      ctx.db.insight.findMany({
        where: {
          salonId: ctx.salonId,
          state: { in: ['new', 'seen'] },
          linkedActionType: 'create_campaign',
        },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        take: 3,
      }),
    ]);

    const ideas: StudioIdea[] = [];

    // 1. Insights that already asked for a campaign. Highest-value first —
    //    these carry an evidence sentence and a linked action ref.
    for (const insight of insights) {
      const ref = (insight.linkedActionRef ?? {}) as LinkedCampaignRef;
      const evidence = insight.evidence as { sentence?: string } | null;
      ideas.push({
        id: `insight:${insight.id}`,
        source: 'insight',
        insightId: insight.id,
        title: insight.title,
        why: evidence?.sentence ?? insight.summary ?? '',
        goal: goalFromRef(ref, insight.title),
        audienceKey: resolveAudienceKey(ref.segmentKey),
        validity: validityFromRef(ref, today),
      });
    }

    // 2. Segment-shaped opportunities. Only surfaced when the number is big
    //    enough to be worth an owner's afternoon.
    const expiring = computeReach('expiring_packages', customers, segCtx);
    if (expiring.total >= 5) {
      ideas.push({
        id: 'segment:expiring_packages',
        source: 'segment',
        insightId: null,
        title: 'Remind people their sessions are running out',
        why: `**${expiring.total} people** have two or fewer sessions left, or a package expiring inside a month.`,
        goal: 'Get expiring packages used before they lapse',
        audienceKey: 'expiring_packages',
        validity: 'the next two weeks',
      });
    }

    const newcomers = computeReach('new_this_month', customers, segCtx);
    if (newcomers.total >= 5) {
      ideas.push({
        id: 'segment:new_this_month',
        source: 'segment',
        insightId: null,
        title: 'Welcome the people who joined this month',
        why: `**${newcomers.total} people** joined in the last 30 days. A second visit is the one that makes a regular.`,
        goal: 'Turn first visits into second visits',
        audienceKey: 'new_this_month',
        validity: 'the next two weeks',
      });
    }

    const best = computeReach('big_spenders', customers, segCtx);
    if (best.total >= 5) {
      ideas.push({
        id: 'segment:big_spenders',
        source: 'segment',
        insightId: null,
        title: 'Give your best customers first look',
        why: `Your top **${best.total} customers** by spend over the last 90 days. They open everything you send.`,
        goal: 'Reward the people who spend the most',
        audienceKey: 'big_spenders',
        validity: 'this week',
      });
    }

    const lapsed = computeReach('lapsed_30d', customers, segCtx);
    if (lapsed.total >= 10) {
      ideas.push({
        id: 'segment:lapsed_30d',
        source: 'segment',
        insightId: null,
        title: 'Win back the people who went quiet',
        why: `**${lapsed.total} people** have not been in for 30 days. **${lapsed.reachable.sms}** of them agreed to texts.`,
        goal: 'Bring lapsed customers back in',
        audienceKey: 'lapsed_30d',
        validity: 'the next two weeks',
      });
    }

    return { today, ideas: ideas.slice(0, 6) };
  }),

  /**
   * Everything Studio needs to open pre-filled: the insight behind the visit
   * (when there is one), the audience with its live count, and a suggested
   * offer that is inside the cap by construction.
   */
  studioContext: ownerProcedure
    .input(
      z.object({
        insightId: z.string().uuid().optional(),
        audienceKey: audienceKeySchema.optional(),
        channels: z.array(channelSchema).min(1).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const today = await virtualToday(ctx.db);
      const salon = await loadSalon(ctx.db, ctx.salonId);
      const { customers, ctx: segCtx } = await loadSegmentCustomers(ctx.db, ctx.salonId, today);

      const insight = input.insightId
        ? await ctx.db.insight.findFirst({
            where: { id: input.insightId, salonId: ctx.salonId },
          })
        : null;

      if (input.insightId && !insight) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: "That insight isn't here any more. Start a campaign from scratch instead.",
        });
      }

      const ref = (insight?.linkedActionRef ?? {}) as LinkedCampaignRef;
      const evidence = (insight?.evidence ?? null) as {
        sentence?: string;
        impact?: { chipLabel?: string; basis?: string };
        contributingFactors?: Array<{ label: string; detail: string }>;
      } | null;

      const audienceKey: AudienceKey =
        input.audienceKey ?? resolveAudienceKey(ref.segmentKey) ?? 'lapsed_30d';
      const channels = input.channels ?? defaultChannels(insight?.type ?? null);
      const validity = insight ? validityFromRef(ref, today) : 'this week';
      const sendAt = defaultSendAt(ref.targetDate ?? addDays(today, 3));

      const reach = computeReach(audienceKey, customers, segCtx);
      const members = customers.filter((c) => matchesAudience(audienceKey, c, segCtx));
      const reached = reachForChannels(members, channels as Channel[]);

      return {
        today,
        salon: { name: salon.name, handle: handleFor(salon.slug) },
        // The context banner: provenance, evidence, and the "why this offer"
        // the owner can open without leaving the flow.
        fixing: insight
          ? {
              insightId: insight.id,
              title: insight.title,
              summary: insight.summary,
              evidenceSentence: evidence?.sentence ?? '',
              impactChip: evidence?.impact?.chipLabel ?? null,
              whyThisOffer: whyThisOffer(insight.type, evidence, reached.count, validity),
            }
          : null,
        goal: insight ? goalFromRef(ref, insight.title) : 'Fill a quiet stretch',
        audience: {
          key: audienceKey,
          label: audienceLabel(audienceKey),
          description: audienceDescription(audienceKey),
          criteria: audienceCriteria(audienceKey),
          total: reach.total,
          reachable: reach.reachable,
          /** People this campaign, on these channels, actually reaches. */
          count: reached.count,
        },
        channels,
        offer: suggestOffer({
          goal: insight?.title ?? 'Fill a quiet stretch',
          audienceLabel: audienceLabel(audienceKey),
          fixing: insight?.title ?? null,
          validity,
          maxDiscountPercent: SALON_GUARDRAILS.maxDiscountPercent,
        }),
        schedule: {
          sendAt,
          sendLabel: formatSendLabel(sendAt),
          validity,
        },
        guardrails: SALON_GUARDRAILS,
      };
    }),

  /** Live guardrail check on an owner-edited offer. Returns the one-tap fix. */
  checkOffer: ownerProcedure
    .input(z.object({ offer: campaignOfferSchema }))
    .query(({ input }) => checkOffer(input.offer, SALON_GUARDRAILS)),

  /**
   * Generate the content set and persist it as a DRAFT campaign.
   *
   * Persisting on generate (rather than on schedule) is deliberate: the owner
   * can walk away mid-edit and the work is still there, and every generation is
   * a real row we can point at when someone asks whether the AI ran.
   */
  generate: ownerProcedure
    .input(
      z.object({
        campaignId: z.string().uuid().nullable().default(null),
        insightId: z.string().uuid().nullable().default(null),
        name: z.string().min(1).max(120).optional(),
        goal: z.string().min(1).max(140),
        audienceKey: audienceKeySchema,
        channels: z.array(channelSchema).min(1),
        offer: campaignOfferSchema,
        tone: toneSchema,
        sendAt: z.string().datetime().optional(),
        /** Bumped by the client on each regenerate. */
        variant: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const verdict = checkOffer(input.offer, SALON_GUARDRAILS);
      if (!verdict.ok) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: verdict.message ?? 'Offer blocked.' });
      }

      const built = await buildGenerationInput(ctx.db, ctx.salonId, input);
      const { content, calledApi } = await generateCampaignContent(built.input, {
        guardrails: SALON_GUARDRAILS,
      });

      const campaign = await persistDraft(ctx.db, ctx.salonId, input, built, content);

      return {
        campaignId: campaign.id,
        content,
        audience: built.audience,
        schedule: built.schedule,
        /** Which path ran. The pitch has to be able to answer this honestly. */
        generation: {
          source: content.provenance.source,
          model: content.provenance.model,
          calledApi,
          fallbackReason: content.provenance.fallbackReason,
        },
      };
    }),

  /**
   * Regenerate one channel. Replaces only that piece — everything the owner has
   * already edited elsewhere survives (DESIGN_SPEC §3.3: "Regenerate replaces
   * only its card").
   */
  regeneratePiece: ownerProcedure
    .input(
      z.object({
        campaignId: z.string().uuid(),
        piece: z.enum(['graphic', 'instagram', 'facebook', 'sms', 'email']),
        variant: z.number().int().min(0).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await loadCampaign(ctx.db, ctx.salonId, input.campaignId);
      const current = safeParseCampaignContent(campaign.content);
      if (!current) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'This campaign has no generated content yet. Generate it first.',
        });
      }

      const built = await buildGenerationInput(ctx.db, ctx.salonId, {
        insightId: campaign.sourceInsightId,
        goal: current.goal,
        audienceKey: resolveAudienceKey(campaign.segmentKey) ?? 'lapsed_30d',
        channels: campaign.channels as Channel[],
        offer: current.offer,
        tone: current.tone,
        sendAt: campaign.scheduledFor?.toISOString(),
        variant: input.variant,
      });

      const { content: fresh, calledApi } = await generateCampaignContent(built.input, {
        guardrails: SALON_GUARDRAILS,
      });

      // The Instagram card shows the graphic AND the caption under one
      // Regenerate button, so regenerating "instagram" has to replace both —
      // otherwise the button visibly does nothing to the headline.
      const withGraphic = input.piece === 'graphic' || input.piece === 'instagram';
      const merged: CampaignContent = {
        ...current,
        graphic: withGraphic ? fresh.graphic : current.graphic,
        instagram: input.piece === 'instagram' ? fresh.instagram : current.instagram,
        facebook: input.piece === 'facebook' ? fresh.facebook : current.facebook,
        sms: input.piece === 'sms' ? fresh.sms : current.sms,
        email: input.piece === 'email' ? fresh.email : current.email,
        provenance: fresh.provenance,
      };

      await ctx.db.campaign.update({
        where: { id: campaign.id },
        data: { content: merged as object },
      });

      return {
        content: merged,
        generation: {
          source: fresh.provenance.source,
          model: fresh.provenance.model,
          calledApi,
          fallbackReason: fresh.provenance.fallbackReason,
        },
      };
    }),

  /**
   * Switch tone — regenerates every piece, which is the point of a tone pill.
   * Editing is discarded by design here; the owner asked for a different voice.
   */
  changeTone: ownerProcedure
    .input(z.object({ campaignId: z.string().uuid(), tone: toneSchema }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await loadCampaign(ctx.db, ctx.salonId, input.campaignId);
      const current = safeParseCampaignContent(campaign.content);
      if (!current) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'This campaign has no generated content yet. Generate it first.',
        });
      }

      const built = await buildGenerationInput(ctx.db, ctx.salonId, {
        insightId: campaign.sourceInsightId,
        goal: current.goal,
        audienceKey: resolveAudienceKey(campaign.segmentKey) ?? 'lapsed_30d',
        channels: campaign.channels as Channel[],
        offer: current.offer,
        tone: input.tone,
        sendAt: campaign.scheduledFor?.toISOString(),
        variant: 0,
      });

      const { content, calledApi } = await generateCampaignContent(built.input, {
        guardrails: SALON_GUARDRAILS,
      });

      await ctx.db.campaign.update({
        where: { id: campaign.id },
        data: { content: content as object },
      });

      return {
        content,
        generation: {
          source: content.provenance.source,
          model: content.provenance.model,
          calledApi,
          fallbackReason: content.provenance.fallbackReason,
        },
      };
    }),

  /** Inline edits. Every text region in Studio is editable; this stores them. */
  updateContent: ownerProcedure
    .input(z.object({ campaignId: z.string().uuid(), content: campaignContentSchema }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await loadCampaign(ctx.db, ctx.salonId, input.campaignId);
      if (campaign.state !== 'draft') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'This campaign is already scheduled. Cancel it first to change the words.',
        });
      }

      // The owner can type anything, so the guardrails run on the way in — not
      // only on what the model wrote.
      const offerVerdict = checkOffer(input.content.offer, SALON_GUARDRAILS);
      if (!offerVerdict.ok) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: offerVerdict.message ?? 'That offer is over your cap.',
        });
      }

      const content: CampaignContent = {
        ...input.content,
        graphic: { ...input.content.graphic, badge: badgeText(input.content.offer) },
      };

      await ctx.db.campaign.update({
        where: { id: campaign.id },
        data: { content: content as object },
      });
      return { content };
    }),

  /**
   * draft → scheduled. The ONLY state transition a human triggers, and the
   * furthest a human can move a campaign: `sent` and `measured` belong to the
   * pipeline, when the demo clock passes the send date.
   */
  schedule: ownerProcedure
    .input(z.object({ campaignId: z.string().uuid(), sendAt: z.string().datetime().optional() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await loadCampaign(ctx.db, ctx.salonId, input.campaignId);
      if (campaign.state !== 'draft') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'This campaign is already scheduled.',
        });
      }

      const sendAt = input.sendAt ? new Date(input.sendAt) : (campaign.scheduledFor ?? new Date());
      const snapshot = (campaign.segmentSnapshot ?? {}) as { count?: number };

      const updated = await ctx.db.campaign.update({
        where: { id: campaign.id },
        data: { state: 'scheduled', scheduledFor: sendAt },
      });

      await ctx.db.activityEvent.create({
        data: {
          salonId: ctx.salonId,
          actorType: 'staff',
          actorLabel: 'Owner',
          action: 'campaign_scheduled',
          targetType: 'campaign',
          targetId: campaign.id,
          metadata: {
            name: campaign.name,
            recipients: snapshot.count ?? 0,
            channels: campaign.channels,
            sendAt: sendAt.toISOString(),
          },
        },
      });

      if (campaign.sourceInsightId) {
        await ctx.db.insight.update({
          where: { id: campaign.sourceInsightId },
          data: { state: 'actioned', actionedAt: new Date() },
        });
      }

      return {
        campaignId: updated.id,
        state: updated.state,
        scheduledFor: updated.scheduledFor,
        recipients: snapshot.count ?? 0,
      };
    }),

  /** Back to draft. Nothing has been sent, so there is nothing to undo but the state. */
  cancel: ownerProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await loadCampaign(ctx.db, ctx.salonId, input.campaignId);
      if (campaign.state !== 'scheduled') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Only a scheduled campaign can be pulled back.',
        });
      }
      await ctx.db.campaign.update({
        where: { id: campaign.id },
        data: { state: 'draft' },
      });
      return { campaignId: campaign.id, state: 'draft' as const };
    }),

  /** The campaigns list: every lifecycle state, newest first. */
  campaigns: ownerProcedure
    .input(z.object({ state: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const today = await virtualToday(ctx.db);
      const rows = await ctx.db.campaign.findMany({
        where: {
          salonId: ctx.salonId,
          ...(input?.state && input.state !== 'all' ? { state: input.state as never } : {}),
        },
        orderBy: [{ scheduledFor: 'desc' }, { createdAt: 'desc' }],
        take: 60,
      });

      return {
        today,
        campaigns: rows.map((c) => ({
          id: c.id,
          name: c.name,
          goal: c.goal,
          state: c.state,
          channels: c.channels,
          segmentKey: c.segmentKey,
          scheduledFor: c.scheduledFor,
          sentAt: c.sentAt,
          measuredAt: c.measuredAt,
          recipients: (c.segmentSnapshot as { count?: number } | null)?.count ?? 0,
          results: c.results as CampaignResults | null,
          hasContent: safeParseCampaignContent(c.content) !== null,
        })),
      };
    }),

  campaign: ownerProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const campaign = await loadCampaign(ctx.db, ctx.salonId, input.campaignId);
      const salon = await loadSalon(ctx.db, ctx.salonId);
      const insight = campaign.sourceInsightId
        ? await ctx.db.insight.findUnique({ where: { id: campaign.sourceInsightId } })
        : null;
      const evidence = (insight?.evidence ?? null) as { sentence?: string } | null;

      return {
        id: campaign.id,
        name: campaign.name,
        goal: campaign.goal,
        state: campaign.state,
        channels: campaign.channels,
        segmentKey: campaign.segmentKey,
        scheduledFor: campaign.scheduledFor,
        sentAt: campaign.sentAt,
        measuredAt: campaign.measuredAt,
        recipients: (campaign.segmentSnapshot as { count?: number } | null)?.count ?? 0,
        results: campaign.results as CampaignResults | null,
        content: safeParseCampaignContent(campaign.content),
        salon: { name: salon.name, handle: handleFor(salon.slug) },
        fixing: insight
          ? {
              insightId: insight.id,
              title: insight.title,
              evidenceSentence: evidence?.sentence ?? '',
            }
          : null,
      };
    }),

  /**
   * Calendar view — campaigns bucketed by the day they send, plus the demo
   * clock's today so "next Tuesday" is visibly next Tuesday.
   */
  calendar: ownerProcedure
    .input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const today = await virtualToday(ctx.db);
      const month = input?.month ?? today.slice(0, 7);
      const start = `${month}-01` as DateOnly;
      const startDate = dateOnlyToUtcMidnight(start);
      const endDate = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 1),
      );

      const rows = await ctx.db.campaign.findMany({
        where: { salonId: ctx.salonId, scheduledFor: { gte: startDate, lt: endDate } },
        orderBy: { scheduledFor: 'asc' },
      });

      const days = new Map<string, CalendarEntry[]>();
      for (const c of rows) {
        if (!c.scheduledFor) continue;
        const key = toDateOnly(c.scheduledFor, 'UTC');
        const list = days.get(key) ?? [];
        list.push({
          id: c.id,
          name: c.name,
          state: c.state,
          channels: c.channels,
          recipients: (c.segmentSnapshot as { count?: number } | null)?.count ?? 0,
          results: c.results as CampaignResults | null,
        });
        days.set(key, list);
      }

      return {
        today,
        month,
        firstWeekday: startDate.getUTCDay(),
        daysInMonth: new Date(
          Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0),
        ).getUTCDate(),
        days: Object.fromEntries(days),
      };
    }),
});

// ---------------------------------------------------------------------------
// Shapes shared with the client
// ---------------------------------------------------------------------------

export interface CampaignResults {
  recipients?: number;
  bookings?: number;
  revenue?: number;
}

export interface CalendarEntry {
  id: string;
  name: string;
  state: string;
  channels: string[];
  recipients: number;
  results: CampaignResults | null;
}

export interface StudioIdea {
  id: string;
  source: 'insight' | 'segment';
  insightId: string | null;
  title: string;
  /** Evidence sentence, `**bold**` around the facts. */
  why: string;
  goal: string;
  audienceKey: AudienceKey;
  validity: string;
}

interface LinkedCampaignRef {
  segmentKey?: string;
  weekday?: number;
  startHour?: number;
  endHour?: number;
  targetDate?: string;
  primaryActionLabel?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function virtualToday(db: PrismaClient): Promise<DateOnly> {
  const state = await ensureDemoState(db);
  return toDateOnly(state.virtualToday, 'UTC');
}

async function loadSalon(db: PrismaClient, salonId: string) {
  const salon = await db.salon.findUnique({
    where: { id: salonId },
    select: { id: true, name: true, slug: true },
  });
  if (!salon) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'That salon is not in the demo dataset.' });
  }
  return salon;
}

async function loadCampaign(db: PrismaClient, salonId: string, campaignId: string) {
  const campaign = await db.campaign.findFirst({ where: { id: campaignId, salonId } });
  if (!campaign) {
    throw new TRPCError({ code: 'NOT_FOUND', message: "That campaign isn't here any more." });
  }
  return campaign;
}

/** An `@handle` from the salon slug: `sunset-ridge` → `sunsetridge`. */
export function handleFor(slug: string): string {
  return slug.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function resolveAudienceKey(key: string | null | undefined): AudienceKey {
  if (!key) return 'lapsed_30d';
  if (key === COMPOSITE_LAPSED_MIDWEEK) return COMPOSITE_LAPSED_MIDWEEK;
  return isSegmentKey(key) ? key : 'lapsed_30d';
}

/**
 * Which channels an insight's campaign should open with.
 *
 * A soft capacity window needs to reach people who can act today, and a text
 * gets read in minutes — so it leads with SMS. A retail or stock problem is a
 * shop-window problem and leads with the social channels.
 */
function defaultChannels(insightType: string | null): Channel[] {
  if (insightType === 'soft_capacity') return ['sms', 'instagram', 'email'];
  if (insightType === 'overstock' || insightType === 'retail_attachment_slip') {
    return ['instagram', 'facebook', 'email'];
  }
  return ['instagram', 'sms', 'email'];
}

function goalFromRef(ref: LinkedCampaignRef, fallback: string): string {
  if (ref.weekday !== undefined && ref.startHour !== undefined && ref.endHour !== undefined) {
    return `Fill ${weekdayNameForIndex(ref.weekday)} ${formatHourRange(ref.startHour, ref.endHour)}`;
  }
  return fallback;
}

function validityFromRef(ref: LinkedCampaignRef, today: DateOnly): string {
  if (ref.weekday !== undefined && ref.startHour !== undefined && ref.endHour !== undefined) {
    const target = (ref.targetDate as DateOnly | undefined) ?? addDays(today, 7);
    const day = weekdayName(target);
    return `${dayQualifier(today, target)} ${day} ${formatHourRange(ref.startHour, ref.endHour)}`;
  }
  return 'this week';
}

/** "this Tuesday" vs "next Tuesday" — the difference matters in an SMS. */
function dayQualifier(today: DateOnly, target: DateOnly): string {
  const days = Math.round(
    (Date.parse(`${target}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );
  return days <= 7 ? 'this' : 'next';
}

/**
 * Two days before the offer window, at 6pm — the evening people read their
 * phone, with a day of runway to book. Mockup 03 shows "Sun 6:00 pm" for a
 * Tuesday offer.
 */
function defaultSendAt(targetDate: string): string {
  const send = dateOnlyToUtcMidnight(addDays(targetDate as DateOnly, -2));
  send.setUTCHours(18, 0, 0, 0);
  return send.toISOString();
}

function formatSendLabel(iso: string): string {
  const date = new Date(iso);
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()];
  const hour = date.getUTCHours();
  const suffix = hour >= 12 ? 'pm' : 'am';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day} ${h}:${minutes} ${suffix}`;
}

/** The "Why this offer" note — assembled from the insight's own evidence. */
function whyThisOffer(
  insightType: string,
  evidence: { impact?: { basis?: string }; contributingFactors?: Array<{ detail: string }> } | null,
  reachCount: number,
  validity: string,
): string[] {
  const lines: string[] = [];
  if (evidence?.impact?.basis) lines.push(evidence.impact.basis);
  const factor = evidence?.contributingFactors?.[0]?.detail;
  if (factor) lines.push(factor);
  lines.push(
    `${reachCount} people match this audience and agreed to be contacted. The offer runs ${validity} only, so it fills the quiet window instead of discounting the busy one.`,
  );
  if (insightType === 'soft_capacity') {
    lines.push('A one-day, one-window offer costs nothing on the hours that were already booked.');
  }
  return lines;
}

interface GenerateArgs {
  campaignId?: string | null;
  insightId?: string | null;
  name?: string;
  goal: string;
  audienceKey: AudienceKey;
  channels: Channel[] | readonly string[];
  offer: CampaignContent['offer'];
  tone: CampaignTone;
  sendAt?: string;
  variant?: number;
}

interface BuiltGeneration {
  input: CampaignGenerationInput;
  audience: {
    key: AudienceKey;
    label: string;
    description: string;
    criteria: string[];
    total: number;
    count: number;
    /** Per-channel consent counts — the SMS card quotes its own number. */
    reachable: { sms: number; email: number };
    memberIds: string[];
  };
  schedule: { sendAt: string; sendLabel: string };
  insight: { id: string; title: string; evidenceSentence: string } | null;
}

/** Assembles everything the generator is allowed to know, from real rows. */
async function buildGenerationInput(
  db: PrismaClient,
  salonId: string,
  args: GenerateArgs,
): Promise<BuiltGeneration> {
  const today = await virtualToday(db);
  const salon = await loadSalon(db, salonId);
  const { customers, ctx: segCtx } = await loadSegmentCustomers(db, salonId, today);

  const insight = args.insightId
    ? await db.insight.findFirst({ where: { id: args.insightId, salonId } })
    : null;
  const evidence = (insight?.evidence ?? null) as { sentence?: string } | null;

  const members: SegmentCustomer[] = customers.filter((c) =>
    matchesAudience(args.audienceKey, c, segCtx),
  );
  const channels = [...args.channels] as Channel[];
  const reached = reachForChannels(members, channels);

  const sendAt = args.sendAt ?? defaultSendAt(addDays(today, 3));

  return {
    input: {
      salonName: salon.name,
      handle: handleFor(salon.slug),
      goal: args.goal,
      tone: args.tone,
      offer: args.offer,
      audience: {
        label: audienceLabel(args.audienceKey),
        description: audienceDescription(args.audienceKey),
        count: reached.count,
      },
      channels,
      fixing: insight
        ? { title: insight.title, evidenceSentence: evidence?.sentence ?? '' }
        : null,
      sendLabel: formatSendLabel(sendAt),
      variant: args.variant ?? 0,
    },
    audience: {
      key: args.audienceKey,
      label: audienceLabel(args.audienceKey),
      description: audienceDescription(args.audienceKey),
      criteria: audienceCriteria(args.audienceKey),
      total: members.length,
      count: reached.count,
      reachable: {
        sms: members.filter((m) => consentsTo(m, 'sms')).length,
        email: members.filter((m) => consentsTo(m, 'email')).length,
      },
      memberIds: reached.ids,
    },
    schedule: { sendAt, sendLabel: formatSendLabel(sendAt) },
    insight: insight
      ? { id: insight.id, title: insight.title, evidenceSentence: evidence?.sentence ?? '' }
      : null,
  };
}

/**
 * Creates or updates the draft row.
 *
 * `segmentSnapshot.count` is the reachable count, and the pipeline reads it to
 * decide how many bookings the campaign produces — so the number on screen and
 * the number that settles are the same number.
 */
async function persistDraft(
  db: PrismaClient,
  salonId: string,
  args: GenerateArgs & { campaignId?: string | null },
  built: BuiltGeneration,
  content: CampaignContent,
) {
  const name = args.name ?? defaultCampaignName(built.insight?.title ?? args.goal);

  const data = {
    name,
    goal: args.goal,
    segmentKey: args.audienceKey === COMPOSITE_LAPSED_MIDWEEK ? 'lapsed_30d' : args.audienceKey,
    segmentSnapshot: {
      key: args.audienceKey,
      count: built.audience.count,
      total: built.audience.total,
    },
    channels: [...args.channels],
    content: content as object,
    scheduledFor: new Date(built.schedule.sendAt),
    sourceInsightId: args.insightId ?? null,
  };

  if (args.campaignId) {
    return db.campaign.update({ where: { id: args.campaignId }, data });
  }

  return db.campaign.create({ data: { ...data, salonId, state: 'draft' } });
}

function defaultCampaignName(source: string): string {
  // Names show up in the campaigns list and the calendar, where "Fill Tuesday
  // 2 pm–5 pm" reads better than the insight's headline.
  return source.length <= 60 ? source : `${source.slice(0, 57)}…`;
}
