/**
 * Knowledge curation — the internal UVALUX surface for verifying the training
 * corpus. Spec: `docs/superpowers/specs/2026-08-22-compass-knowledge-curation-design.md`.
 *
 * ON THE CONSENT FILTER, because its absence here is deliberate and would
 * otherwise look like an oversight:
 *
 * `packages/core/consent` exists to stop one salon's data reaching a UVALUX rep
 * who has not been granted it. Everything in `bask.knowledge_claim` is UVALUX's
 * OWN material — sentences recorded from a stage at UVALUX's own events. There is
 * no salon on the row, no `salon_id` column, and no tenant to protect. Routing
 * these reads through `filterAccount` would be theatre: a filter with nothing to
 * filter, which is worse than no filter because it looks like protection.
 *
 * What actually guards this surface:
 *   1. `compassProcedure` — UVALUX roles only, so no salon-side user reaches it.
 *   2. No procedure in this file reads any salon-scoped table. That is the real
 *      invariant, and it is checkable by reading the imports: `db.knowledgeClaim`
 *      and `db.knowledgeClaimEvent`, nothing else.
 *
 * If this router ever needs to join a salon table — for example to show which
 * salons a verified claim was taught to — that join goes through the consent
 * filter, and this comment stops being true.
 */
import { z } from 'zod';

import { db } from '@bask/db';
import {
  CLAIM_CATEGORIES,
  CLAIM_MOMENTS,
  REVIEW_STATES,
  buildCurationGraph,
  formatTimecode,
  type Claim,
  type ClaimProvenance,
} from '@bask/core';

import { compassProcedure, router } from '../trpc';

/** Row shape as Prisma returns it, before we fold it into the contract's Claim. */
interface ClaimRow {
  id: string;
  corpus: string;
  claim: string;
  quote: string;
  category: string;
  moment: string;
  shape: string | null;
  specificity: string;
  isScript: boolean;
  sourceStream: string;
  sourceFile: string;
  audioStreamIx: number;
  tStart: number;
  tEnd: number;
  docId: string | null;
  timesSaid: number;
  distinctEvents: number;
  extractedBy: string;
  lens: string;
  reviewState: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
}

/** `uvalux26_P1060686` → `Room B 2026 · P1060686`. Falls back to the raw stream. */
function streamLabel(stream: string): string {
  const m = /^(uvalux26|uva25|uvasummer25|uvasummer24)_(.+)$/.exec(stream);
  if (!m) return stream;
  const era: Record<string, string> = {
    uvalux26: 'Room B 2026',
    uva25: 'UVALUX 2025 Room B',
    uvasummer25: 'Summer 2025',
    uvasummer24: 'Summer 2024',
  };
  return `${era[m[1]] ?? m[1]} · ${m[2]}`;
}

/**
 * Fold a database row into the contract's `Claim`.
 *
 * `sessionTitle` and `speaker` are null until the corpus is joined to
 * `knowledge_doc`, which is a raw-SQL pgvector table with zero rows today. They
 * are NOT faked — a null here is what drives the `orphan` alert, and inventing a
 * session would launder a gap into a fact.
 */
function toClaim(r: ClaimRow): Claim {
  const provenance: ClaimProvenance[] = [
    {
      sourceFile: r.sourceFile,
      sourceStream: r.sourceStream,
      audioStreamIndex: r.audioStreamIx,
      tStart: r.tStart,
      tEnd: r.tEnd,
      knowledgeRef: `${streamLabel(r.sourceStream)} · ${formatTimecode(r.tStart)}`,
      event: streamLabel(r.sourceStream),
      sessionTitle: null,
      speaker: null,
      titleConfidence: 'interpolated',
      quoteVerified: true,
    },
  ];
  return {
    id: r.id,
    corpus: r.corpus,
    claim: r.claim,
    quote: r.quote,
    category: r.category as Claim['category'],
    moment: r.moment as Claim['moment'],
    shape: (r.shape ?? null) as Claim['shape'],
    specificity: r.specificity === 'concrete' ? 'concrete' : 'general',
    isScript: r.isScript,
    timesSaid: r.timesSaid,
    distinctEvents: r.distinctEvents,
    extractedBy: r.extractedBy,
    lens: r.lens === 'recall' || r.lens === 'marketing' ? r.lens : 'advice',
    reviewState: r.reviewState as Claim['reviewState'],
    reviewedBy: r.reviewedBy,
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
    reviewNote: r.reviewNote,
    provenance,
  };
}

const filtersSchema = z.object({
  corpus: z.string().optional(),
  reviewState: z.array(z.enum(REVIEW_STATES)).optional(),
  category: z.array(z.enum(CLAIM_CATEGORIES)).optional(),
  moment: z.array(z.enum(CLAIM_MOMENTS)).optional(),
  lens: z.array(z.string()).optional(),
  specificity: z.enum(['concrete', 'general']).optional(),
  isScript: z.boolean().optional(),
  q: z.string().optional(),
});

type Filters = z.infer<typeof filtersSchema>;

function where(f: Filters | undefined) {
  const w: Record<string, unknown> = {};
  if (!f) return w;
  if (f.corpus) w.corpus = f.corpus;
  if (f.reviewState?.length) w.reviewState = { in: f.reviewState };
  if (f.category?.length) w.category = { in: f.category };
  if (f.moment?.length) w.moment = { in: f.moment };
  if (f.lens?.length) w.lens = { in: f.lens };
  if (f.specificity) w.specificity = f.specificity;
  if (typeof f.isScript === 'boolean') w.isScript = f.isScript;
  if (f.q) {
    w.OR = [
      { claim: { contains: f.q, mode: 'insensitive' } },
      { quote: { contains: f.q, mode: 'insensitive' } },
    ];
  }
  return w;
}

export const knowledgeRouter = router({
  /** Counts for the header strip. Cheap enough to call on every mutation. */
  summary: compassProcedure
    .input(z.object({ filters: filtersSchema.optional() }).optional())
    .query(async ({ input }) => {
      const w = where(input?.filters);
      const [total, verified, rejected, byCorpus] = await Promise.all([
        db.knowledgeClaim.count({ where: w }),
        db.knowledgeClaim.count({ where: { ...w, reviewState: 'verified' } }),
        db.knowledgeClaim.count({ where: { ...w, reviewState: 'rejected' } }),
        db.knowledgeClaim.groupBy({ by: ['corpus'], _count: { _all: true } }),
      ]);
      return {
        total,
        verified,
        rejected,
        decided: verified + rejected,
        corpora: byCorpus.map((c) => ({ corpus: c.corpus, count: c._count._all })),
      };
    }),

  list: compassProcedure
    .input(
      z.object({
        filters: filtersSchema.optional(),
        take: z.number().int().min(1).max(200).default(50),
        skip: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const w = where(input.filters);
      const [rows, total] = await Promise.all([
        db.knowledgeClaim.findMany({
          where: w,
          orderBy: [{ reviewState: 'asc' }, { corpus: 'asc' }, { tStart: 'asc' }],
          take: input.take,
          skip: input.skip,
        }),
        db.knowledgeClaim.count({ where: w }),
      ]);
      return { rows: (rows as ClaimRow[]).map(toClaim), total };
    }),

  get: compassProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const row = await db.knowledgeClaim.findUnique({ where: { id: input.id } });
      if (!row) return null;
      const events = await db.knowledgeClaimEvent.findMany({
        where: { claimId: input.id },
        orderBy: { createdAt: 'desc' },
        take: 25,
      });
      return {
        claim: toClaim(row as ClaimRow),
        history: events.map((e) => ({
          id: e.id,
          action: e.action,
          actor: e.actor,
          note: e.note,
          createdAt: e.createdAt.toISOString(),
        })),
      };
    }),

  /**
   * Record a verdict. Writes the claim AND an audit row in one transaction —
   * a verdict without its audit entry is exactly the state that makes undo
   * impossible and the corpus untrustworthy, so they must not come apart.
   */
  review: compassProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        action: z.enum(REVIEW_STATES),
        note: z.string().max(2000).optional(),
        actor: z.string().default('uvalux'),
      }),
    )
    .mutation(async ({ input }) => {
      const before = await db.knowledgeClaim.findUnique({ where: { id: input.id } });
      if (!before) throw new Error(`No claim ${input.id}`);
      const decided = input.action === 'verified' || input.action === 'rejected';
      const [updated] = await db.$transaction([
        db.knowledgeClaim.update({
          where: { id: input.id },
          data: {
            reviewState: input.action,
            reviewedBy: decided ? input.actor : null,
            reviewedAt: decided ? new Date() : null,
            reviewNote: input.note ?? null,
          },
        }),
        db.knowledgeClaimEvent.create({
          data: {
            claimId: input.id,
            action: input.action,
            actor: input.actor,
            before: { reviewState: before.reviewState },
            after: { reviewState: input.action },
            note: input.note ?? null,
          },
        }),
      ]);
      return toClaim(updated as ClaimRow);
    }),

  bulkReview: compassProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()).min(1).max(500),
        action: z.enum(REVIEW_STATES),
        actor: z.string().default('uvalux'),
      }),
    )
    .mutation(async ({ input }) => {
      const decided = input.action === 'verified' || input.action === 'rejected';
      const [updated] = await db.$transaction([
        db.knowledgeClaim.updateMany({
          where: { id: { in: input.ids } },
          data: {
            reviewState: input.action,
            reviewedBy: decided ? input.actor : null,
            reviewedAt: decided ? new Date() : null,
          },
        }),
        db.knowledgeClaimEvent.createMany({
          data: input.ids.map((claimId) => ({
            claimId,
            action: input.action,
            actor: input.actor,
            after: { reviewState: input.action },
          })),
        }),
      ]);
      return { count: updated.count };
    }),

  /**
   * Undo the most recent decision. Reads the audit table rather than keeping
   * client state, so undo survives a refresh and a different browser.
   */
  undoLast: compassProcedure
    .input(z.object({ actor: z.string().default('uvalux') }))
    .mutation(async ({ input }) => {
      const last = await db.knowledgeClaimEvent.findFirst({
        where: { actor: input.actor, action: { not: 'unreviewed' } },
        orderBy: { createdAt: 'desc' },
      });
      if (!last) return null;
      const before = (last.before ?? {}) as { reviewState?: string };
      const restore = before.reviewState ?? 'unreviewed';
      await db.$transaction([
        db.knowledgeClaim.update({
          where: { id: last.claimId },
          data: {
            reviewState: restore,
            reviewedBy: null,
            reviewedAt: null,
          },
        }),
        db.knowledgeClaimEvent.create({
          data: {
            claimId: last.claimId,
            action: 'unreviewed',
            actor: input.actor,
            before: { reviewState: last.action },
            after: { reviewState: restore },
            note: 'undo',
          },
        }),
      ]);
      return { claimId: last.claimId, restoredTo: restore };
    }),

  /**
   * Graph + alerts + palette in one call.
   *
   * Capped, and the cap is REPORTED rather than silently applied: a graph that
   * quietly shows half the corpus reads as "this is everything", which is the
   * failure this whole surface exists to prevent.
   */
  graph: compassProcedure
    .input(
      z.object({
        filters: filtersSchema.optional(),
        maxNodes: z.number().int().min(100).max(20000).default(1500),
        limit: z.number().int().min(100).max(5000).default(2000),
      }),
    )
    .query(async ({ input }) => {
      const w = where(input.filters);
      const total = await db.knowledgeClaim.count({ where: w });
      const rows = await db.knowledgeClaim.findMany({
        where: w,
        orderBy: { tStart: 'asc' },
        take: input.limit,
      });
      const claims = (rows as ClaimRow[]).map(toClaim);
      return {
        graph: buildCurationGraph(claims, input.maxNodes),
        claimsInGraph: claims.length,
        claimsTotal: total,
        capped: claims.length < total,
      };
    }),
});
