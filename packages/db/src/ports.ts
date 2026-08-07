/**
 * Prisma implementation of `PipelinePorts`.
 *
 * `packages/core` owns the pipeline's *shape* and stays Prisma-free so it runs
 * unchanged on web and mobile. This file is where that shape meets Postgres.
 */

import {
  addDays,
  toDateOnly,
  zonedToUtc,
  type AiGenerationLog,
  type CampaignOutcome,
  type DateOnly,
  type DaybreakBrief,
  type InsightDraft,
  type InsightUpsertResult,
  type PipelinePorts,
  type PipelineSalon,
  type SalonFacts,
} from '@bask/core';

import { HERO_SALON, OPEN_HOURS, SLOTS_PER_ROOM_HOUR } from '../fixtures/constants';
import { id } from '../fixtures/ids';
import { Rng, money } from '../fixtures/rng';
import {
  HERO_SALON_ID,
  SERVICES,
  generateDayActivity,
  type ActivityContext,
  type CustomerSeed,
} from '../fixtures/sunset-ridge';
import { buildFacts } from './facts';
import type { PrismaClient } from './client';

const DEMO_STATE_ID = 'default';

export interface PortsOptions {
  /** Fixture seed. Must match `demo_state.seed` or forward days won't line up. */
  seed: string;
}

export function createPrismaPipelinePorts(
  prisma: PrismaClient,
  options: PortsOptions,
): PipelinePorts {
  const seed = options.seed;

  /** Rebuilt per day: forward-day generation needs the same context a reset had. */
  async function activityContext(): Promise<ActivityContext> {
    const [rooms, services, staff, customers, memberships, packages] = await Promise.all([
      prisma.room.findMany({ where: { salonId: HERO_SALON_ID }, orderBy: { sortOrder: 'asc' } }),
      prisma.service.findMany({ where: { salonId: HERO_SALON_ID }, orderBy: { name: 'asc' } }),
      prisma.staff.findMany({ where: { salonId: HERO_SALON_ID } }),
      prisma.customer.findMany({ where: { salonId: HERO_SALON_ID }, orderBy: { id: 'asc' } }),
      prisma.membership.findMany({ where: { salonId: HERO_SALON_ID } }),
      prisma.package.findMany({ where: { salonId: HERO_SALON_ID } }),
    ]);

    // Customer ids are UUIDv5 over `customer:NNNN`, so the seeded index is
    // recoverable — which is what keeps forward days drawing customers with the
    // same weights the history used.
    const indexById = new Map<string, number>();
    for (let i = 0; i < 2000; i += 1) {
      indexById.set(id('customer', String(i).padStart(4, '0')), i);
    }

    const seeds: CustomerSeed[] = customers.map((c) => {
      const index = indexById.get(c.id) ?? 0;
      const membership = memberships.find((m) => m.customerId === c.id);
      const weight = membership
        ? membership.status === 'active'
          ? 3.2
          : 0.4
        : c.status === 'active'
          ? 0.95
          : c.status === 'lapsed'
            ? 0.13
            : 0.02;
      return {
        row: c as unknown as CustomerSeed['row'],
        index,
        visitWeight: weight,
        membershipTier: membership?.tier ?? null,
      };
    });

    return {
      salonId: HERO_SALON_ID,
      rooms: rooms as unknown as ActivityContext['rooms'],
      services: services as unknown as ActivityContext['services'],
      staffByKey: new Map(
        staff.map((s) => [s.firstName.toLowerCase(), s as unknown as never]),
      ) as ActivityContext['staffByKey'],
      customers: seeds,
      memberCustomerIds: new Set(
        memberships.filter((m) => m.status === 'active').map((m) => m.customerId),
      ),
      packageCustomerIds: new Set(
        packages.filter((p) => p.creditsRemaining > 0).map((p) => p.customerId),
      ),
    };
  }

  return {
    async loadVirtualToday() {
      const state = await prisma.demoState.findUnique({ where: { id: DEMO_STATE_ID } });
      if (!state) return null;
      return state.virtualToday.toISOString().slice(0, 10);
    },

    async setVirtualToday(date, meta) {
      await prisma.demoState.update({
        where: { id: DEMO_STATE_ID },
        data: {
          virtualToday: new Date(`${date}T00:00:00.000Z`),
          lastAdvancedAt: meta.lastPipelineRunAt,
          lastPipelineRunAt: meta.lastPipelineRunAt,
        },
      });
    },

    async listSalons(): Promise<PipelineSalon[]> {
      // M0 runs the owner-facing pipeline for the hero salon only. The Compass
      // portfolio carries signal snapshots, not morning briefs.
      const salon = await prisma.salon.findUnique({ where: { id: HERO_SALON_ID } });
      if (!salon) return [];
      return [
        {
          id: salon.id,
          name: salon.name,
          ownerFirstName: HERO_SALON.ownerFirstName,
          currency: 'CAD',
          timezone: salon.timezone,
          isHero: true,
        },
      ];
    },

    async materialiseDay(date) {
      // Idempotent: a rerun of the same day must not double-book it.
      const existing = await prisma.visit.count({
        where: {
          salonId: HERO_SALON_ID,
          checkedInAt: {
            gte: zonedToUtc(date, 0, 0, HERO_SALON.timezone),
            lt: zonedToUtc(addDays(date, 1), 0, 0, HERO_SALON.timezone),
          },
        },
      });
      if (existing > 0) return { visits: 0, sales: 0 };

      const ctx = await activityContext();
      const day = generateDayActivity(date, ctx, seed);
      if (day.visits.length === 0) return { visits: 0, sales: 0 };

      await prisma.$transaction([
        prisma.visit.createMany({ data: day.visits, skipDuplicates: true }),
        prisma.session.createMany({ data: day.sessions, skipDuplicates: true }),
        prisma.sale.createMany({ data: day.sales, skipDuplicates: true }),
        prisma.saleLine.createMany({ data: day.saleLines, skipDuplicates: true }),
      ]);

      // Selling stock is what makes days-of-cover move as the clock advances.
      for (const [sku, units] of day.unitsBySku) {
        await prisma.inventoryLevel.updateMany({
          where: { salonId: HERO_SALON_ID, productId: id('product', sku) },
          data: { onHand: { decrement: units } },
        });
      }

      return { visits: day.visits.length, sales: day.sales.length };
    },

    async simulateCampaignOutcomes(date): Promise<CampaignOutcome[]> {
      const due = await prisma.campaign.findMany({
        where: {
          salonId: HERO_SALON_ID,
          state: 'scheduled',
          scheduledFor: { lte: zonedToUtc(addDays(date, 1), 0, 0, HERO_SALON.timezone) },
        },
      });
      if (due.length === 0) return [];

      const ctx = await activityContext();
      const outcomes: CampaignOutcome[] = [];

      for (const campaign of due) {
        const sendDate = toDateOnly(campaign.scheduledFor!, HERO_SALON.timezone);
        const rng = new Rng(`${seed}::campaign::${campaign.id}`);
        const snapshot = (campaign.segmentSnapshot ?? {}) as { count?: number };
        const recipients = snapshot.count ?? 40;

        // A campaign that "worked" means real visits on the floor, not a
        // results blob. No static fakery (IMPLEMENTATION_SPEC §0.1).
        const bookings = Math.max(4, Math.round(recipients * rng.range(0.16, 0.24)));
        const targetHours = [13, 14, 15, 16];
        const visits: unknown[] = [];
        const sessions: unknown[] = [];
        const sales: unknown[] = [];
        const saleLines: unknown[] = [];
        let revenue = 0;

        const sprayService = ctx.services.find((s) => s.name === 'Spray tan');
        const uvService = ctx.services.find((s) => s.name === 'Level 3 UV') ?? sprayService;

        for (let i = 0; i < bookings; i += 1) {
          const customer = rng.pick(ctx.customers);
          const service = rng.bool(0.75) ? uvService! : sprayService!;
          const spec = SERVICES.find((s) => s.name === service.name)!;
          const room = ctx.rooms.find((r) => r.roomTypeKey === spec.roomTypeKey);
          if (!room) continue;

          const hour = rng.pick(targetHours);
          const checkedInAt = zonedToUtc(sendDate, hour, rng.int(0, 59), HERO_SALON.timezone);
          const key = `${campaign.id}:${i}`;
          const visitId = id('visit', key);
          const saleId = id('sale', key);
          const price = Number(service.price);
          const endsAt = new Date(checkedInAt.getTime() + spec.minutes * 60_000);

          visits.push({
            id: visitId,
            salonId: HERO_SALON_ID,
            customerId: customer.row.id,
            staffId: null,
            source: 'online_booking',
            checkedInAt,
            checkedOutAt: endsAt,
            notes: `Booked from campaign: ${campaign.name}`,
            createdAt: checkedInAt,
          });
          sessions.push({
            id: id('session', key),
            salonId: HERO_SALON_ID,
            roomId: room.id,
            customerId: customer.row.id,
            serviceId: service.id,
            visitId,
            startedByStaffId: null,
            startedBy: 'staff',
            state: 'completed',
            requestedMinutes: spec.minutes,
            equipmentMinutes: spec.minutes,
            delayMinutes: 0,
            startedAt: checkedInAt,
            endsAt,
            endedAt: endsAt,
            cleaningEndsAt: endsAt,
            notes: null,
            createdAt: checkedInAt,
            updatedAt: endsAt,
          });
          const tax = money(price * 0.12);
          sales.push({
            id: saleId,
            salonId: HERO_SALON_ID,
            visitId,
            customerId: customer.row.id,
            staffId: null,
            state: 'completed',
            subtotal: money(price),
            discount: 0,
            tax,
            total: money(price + tax),
            soldAt: endsAt,
            voidedAt: null,
            createdAt: endsAt,
          });
          saleLines.push({
            id: id('sale-line', `${key}:service`),
            salonId: HERO_SALON_ID,
            saleId,
            customerId: customer.row.id,
            productId: null,
            serviceId: service.id,
            giftCardId: null,
            staffId: null,
            quantity: 1,
            unitPrice: money(price),
            discount: 0,
            lineTotal: money(price),
            tenderType: 'card',
            soldAt: endsAt,
            createdAt: endsAt,
          });
          revenue += price;
        }

        await prisma.$transaction([
          prisma.visit.createMany({ data: visits as never, skipDuplicates: true }),
          prisma.session.createMany({ data: sessions as never, skipDuplicates: true }),
          prisma.sale.createMany({ data: sales as never, skipDuplicates: true }),
          prisma.saleLine.createMany({ data: saleLines as never, skipDuplicates: true }),
          prisma.campaign.update({
            where: { id: campaign.id },
            data: {
              state: 'measured',
              sentAt: campaign.scheduledFor,
              measuredAt: zonedToUtc(date, 8, 0, HERO_SALON.timezone),
              results: { recipients, bookings: visits.length, revenue: money(revenue) },
            },
          }),
        ]);

        outcomes.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          bookings: visits.length,
          revenue: money(revenue),
          recipients,
        });
      }

      return outcomes;
    },

    async buildSalonFacts(salon, today): Promise<SalonFacts> {
      const since = zonedToUtc(addDays(today, -95), 0, 0, salon.timezone);
      const [visits, sessions, sales, saleLines, staff, customers, memberships, products, inventory, services, rooms, stockEvents] =
        await Promise.all([
          prisma.visit.findMany({ where: { salonId: salon.id, checkedInAt: { gte: since } } }),
          prisma.session.findMany({ where: { salonId: salon.id, createdAt: { gte: since } } }),
          prisma.sale.findMany({ where: { salonId: salon.id, soldAt: { gte: since } } }),
          prisma.saleLine.findMany({ where: { salonId: salon.id, soldAt: { gte: since } } }),
          prisma.staff.findMany({ where: { salonId: salon.id } }),
          prisma.customer.findMany({ where: { salonId: salon.id } }),
          prisma.membership.findMany({ where: { salonId: salon.id } }),
          prisma.product.findMany(),
          prisma.inventoryLevel.findMany({ where: { salonId: salon.id } }),
          prisma.service.findMany({ where: { salonId: salon.id } }),
          prisma.room.findMany({ where: { salonId: salon.id } }),
          prisma.stockEvent.findMany({ where: { salonId: salon.id, occurredAt: { gte: since } } }),
        ]);

      return buildFacts({
        salonId: salon.id,
        salonName: salon.name,
        today,
        currency: salon.currency,
        timezone: salon.timezone,
        openHours: OPEN_HOURS,
        slotsPerRoomHour: SLOTS_PER_ROOM_HOUR,
        visits,
        sessions,
        sales,
        saleLines,
        staff,
        customers,
        memberships,
        products,
        inventory,
        services,
        rooms,
        stockEvents,
      });
    },

    /**
     * Persist the sweep while preserving state on standing insights.
     *
     * A dismissal has to stick: re-running the sweep tomorrow must not
     * resurrect a card the owner already dealt with. `dedupeKey` (detector type
     * + subject, never the date) is what makes "the same finding" identifiable
     * across days.
     */
    async upsertInsights(salon, today, drafts): Promise<InsightUpsertResult> {
      const forDate = new Date(`${today}T00:00:00.000Z`);
      const existing = await prisma.insight.findMany({ where: { salonId: salon.id } });
      const byKey = new Map(
        existing.map((row) => [(row.linkedActionRef as { dedupeKey?: string })?.dedupeKey ?? row.id, row]),
      );

      let created = 0;
      let updated = 0;
      const persisted: Array<{ draft: InsightDraft; id: string }> = [];

      for (const draft of drafts) {
        const prior = byKey.get(draft.dedupeKey);
        const payload = {
          salonId: salon.id,
          type: draft.type,
          severity: draft.severity,
          title: draft.title,
          summary: draft.summary,
          impactEstimate: draft.impactEstimate,
          impactCurrency: draft.impactCurrency,
          evidence: draft.evidence as unknown as object,
          linkedActionType: draft.linkedActionType,
          linkedActionRef: {
            ...draft.linkedActionRef,
            dedupeKey: draft.dedupeKey,
            primaryActionLabel: draft.primaryActionLabel,
          } as unknown as object,
          forDate,
        };

        if (prior) {
          // Never reset a dismissal or an action back to `new`.
          await prisma.insight.update({ where: { id: prior.id }, data: payload });
          updated += 1;
          persisted.push({ draft, id: prior.id });
        } else {
          const row = await prisma.insight.create({ data: { ...payload, state: 'new' } });
          created += 1;
          persisted.push({ draft, id: row.id });
        }
      }

      // Findings the sweep no longer produces are resolved, not deleted — the
      // owner-facing activity log should be able to say a problem went away.
      const liveKeys = new Set(drafts.map((d) => d.dedupeKey));
      const stale = existing.filter((row) => {
        const key = (row.linkedActionRef as { dedupeKey?: string })?.dedupeKey;
        return key !== undefined && !liveKeys.has(key) && row.state === 'new';
      });
      if (stale.length > 0) {
        await prisma.insight.updateMany({
          where: { id: { in: stale.map((s) => s.id) } },
          data: { state: 'dismissed', dismissReason: 'resolved', dismissedAt: new Date() },
        });
      }

      return {
        created,
        updated,
        resolved: stale.length,
        insights: persisted.map(({ draft, id: rowId }) => ({
          id: rowId,
          dedupeKey: draft.dedupeKey,
          type: draft.type,
          severity: draft.severity,
          title: draft.title,
          summary: draft.summary,
          impactEstimate: draft.impactEstimate,
          impactCurrency: draft.impactCurrency,
          linkedActionType: draft.linkedActionType,
          primaryActionLabel: draft.primaryActionLabel,
          evidence: draft.evidence,
        })),
      };
    },

    async loadCachedBrief(salonId, forDate: DateOnly, promptHash) {
      const row = await prisma.daybreakBrief.findUnique({
        where: { salonId_forDate: { salonId, forDate: new Date(`${forDate}T00:00:00.000Z`) } },
      });
      // A hash mismatch means the underlying facts changed — regenerate rather
      // than serve a brief that describes a different day.
      if (!row || row.promptHash !== promptHash) return null;
      return row.brief;
    },

    async saveBrief(brief: DaybreakBrief) {
      const forDate = new Date(`${brief.forDate}T00:00:00.000Z`);
      const data = {
        salonId: brief.salonId,
        forDate,
        promptHash: brief.promptHash,
        source: brief.source,
        model: brief.model,
        brief: brief as unknown as object,
        generatedAt: new Date(brief.generatedAt),
      };
      await prisma.daybreakBrief.upsert({
        where: { salonId_forDate: { salonId: brief.salonId, forDate } },
        create: data,
        update: data,
      });
    },

    async logAiGeneration(log: AiGenerationLog) {
      // Prompt-context hash + output hash, no prompt text — the usefulness
      // metrics in PRODUCT_SPEC §22 need the linkage, not the content.
      await prisma.activityEvent.create({
        data: {
          salonId: HERO_SALON_ID,
          actorType: 'system',
          actorLabel: 'AI',
          action: log.ok ? 'ai_generation' : 'ai_generation_failed',
          targetType: 'daybreak_brief',
          metadata: { ...log } as unknown as object,
          occurredAt: new Date(),
        },
      });
    },

    async recordActivity(salonId, action, metadata) {
      await prisma.activityEvent.create({
        data: {
          salonId,
          actorType: 'system',
          actorLabel: 'Demo harness',
          action,
          metadata: metadata as unknown as object,
          occurredAt: new Date(),
        },
      });
    },
  };
}
