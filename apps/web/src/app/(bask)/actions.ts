'use server';

/**
 * Insight state transitions for the attention queue.
 *
 * Server actions rather than tRPC procedures on purpose: `packages/api` is shared
 * by every M1 lane, and the merge protocol asks lanes to keep to disjoint files.
 * These three writes touch one table with columns the M0 schema already has, so a
 * colocated action is the smaller change. (Deviation logged in the M1 plan.)
 *
 * Snooze reuses `dismiss_reason` rather than adding a column — no migration is in
 * this lane's scope, and "remind me next week" is a dismissal with a date on it.
 */

import { revalidatePath } from 'next/cache';

import { INSIGHT_CLAIM_CATEGORIES, coachingFor } from '@bask/api';
import type { ClaimCitation } from '@bask/core';
import { db } from '@bask/db';

import { attachmentRecords, type RecordsView } from '@/server/records';

export type DismissReason = 'not_relevant' | 'already_handled' | 'snooze';

const REASONS: readonly DismissReason[] = ['not_relevant', 'already_handled', 'snooze'];

export async function dismissInsight(
  insightId: string,
  reason: DismissReason,
): Promise<{ ok: boolean }> {
  if (!REASONS.includes(reason)) return { ok: false };

  try {
    const snoozeUntil = reason === 'snooze' ? await nextWeek() : null;
    await db.insight.update({
      where: { id: insightId },
      data: {
        state: 'dismissed',
        dismissReason: snoozeUntil ? `snooze:${snoozeUntil}` : reason,
        dismissedAt: new Date(),
      },
    });
    revalidatePath('/');
    return { ok: true };
  } catch {
    // The queue turns this into a plain-language line and puts the card back.
    return { ok: false };
  }
}

/** Undo. Back to `seen`, not `new` — the owner did read it. */
export async function restoreInsight(insightId: string): Promise<{ ok: boolean }> {
  try {
    await db.insight.update({
      where: { id: insightId },
      data: { state: 'seen', dismissReason: null, dismissedAt: null, seenAt: new Date() },
    });
    revalidatePath('/');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Opening "Show me why" is the first hard evidence the card was actually read. */
export async function markInsightSeen(insightId: string): Promise<{ ok: boolean }> {
  try {
    await db.insight.updateMany({
      where: { id: insightId, state: 'new' },
      data: { state: 'seen', seenAt: new Date() },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Seven days from the demo clock, not from wall time — the clock is the truth. */
async function nextWeek(): Promise<string> {
  const state = await db.demoState.findUnique({ where: { id: 'default' } });
  const base = state?.virtualToday ?? new Date();
  const target = new Date(base);
  target.setUTCDate(target.getUTCDate() + 7);
  return target.toISOString().slice(0, 10);
}

/**
 * The records behind a number — the bottom of the drill-down.
 *
 * Fetched on demand rather than shipped with the page: it is dozens of rows per
 * insight, almost nobody opens it, and the ones who do are worth a round trip.
 * That it costs a request is the point — the rows are read out of the database
 * when asked for, not baked into the card at build time.
 *
 * Returns null when the insight's metric has no exact visit-level reconciliation
 * (see `server/records.ts`), so the UI can simply not offer the link rather than
 * showing rows that only approximately explain the figure.
 */
export async function insightRecords(insightId: string): Promise<RecordsView | null> {
  try {
    const insight = await db.insight.findUnique({
      where: { id: insightId },
      select: { salonId: true, evidence: true, impactCurrency: true },
    });
    if (!insight) return null;

    const evidence = insight.evidence as {
      metric?: { key?: string };
      comparison?: { currentWindow?: { start?: string; end?: string; label?: string } };
      window?: { start?: string; end?: string; label?: string };
    } | null;

    if (evidence?.metric?.key !== 'retail_attachment_rate') return null;

    const win = evidence.comparison?.currentWindow ?? evidence.window;
    if (!win?.start || !win?.end) return null;

    return await attachmentRecords(
      insight.salonId,
      win.start,
      win.end,
      win.label ?? 'this window',
      insight.impactCurrency ?? 'CAD',
    );
  } catch {
    return null;
  }
}

/**
 * The coaching behind an insight — the other half of the drill-down.
 *
 * `insightRecords` answers "where does this number come from"; this answers
 * "and what do we know about fixing it". Both are fetched when the owner opens
 * "Show me why", on the same interaction, so neither costs anything on a page
 * load nobody drilled into.
 *
 * Retrieval runs over the title and the evidence sentence together: the title
 * alone ("Retail attachment is slipping") is too short to embed well, and the
 * evidence sentence carries the words an owner would actually recognise.
 *
 * Returns `[]` on every failure path. An insight that renders without citations
 * is a normal insight; an insight that fails to render is a broken product.
 */
export async function insightCoaching(insightId: string): Promise<ClaimCitation[]> {
  try {
    const insight = await db.insight.findUnique({
      where: { id: insightId },
      select: { title: true, type: true, evidence: true },
    });
    if (!insight) return [];

    const evidence = insight.evidence as { sentence?: string } | null;
    // `**bold**` markers are a rendering instruction, not words.
    const sentence = (evidence?.sentence ?? '').replace(/\*\*/g, '');

    return await coachingFor(db, `${insight.title}. ${sentence}`, {
      limit: 3,
      // Prefer coaching from the insight's own domain. See the table's comment:
      // similarity alone cannot separate a retail claim from an unrelated
      // operations one at the spacing this corpus produces.
      prefer: INSIGHT_CLAIM_CATEGORIES[insight.type] ?? [],
    });
  } catch {
    return [];
  }
}
