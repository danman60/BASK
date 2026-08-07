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

import { db } from '@bask/db';

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
