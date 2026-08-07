'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@bask/db';

import { getDemoSalon } from '@/server/salon';

/**
 * Peers actions — the two writes that leave the salon.
 *
 * "Ask UVALUX for coaching" is the demo's trust loop: it writes a real
 * `CoachingRequest` that the rep sees in Compass with the footer line
 * "their request, not just our signal" (DESIGN_SPEC §3.4). It is the salon
 * reaching out, not UVALUX detecting — that distinction is the whole point of
 * building it this way round.
 */

/** Ask UVALUX for coaching on a gap. Lands on the rep's account timeline. */
export async function requestCoachingAction(formData: FormData) {
  const topic = String(formData.get('topic') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  if (!topic) return;

  const salon = await getDemoSalon();
  const account = await db.account.findUnique({
    where: { salonId: salon.salonId },
    select: { id: true, assignedRepId: true },
  });
  if (!account) return;

  const existing = await db.coachingRequest.findFirst({
    where: { salonId: salon.salonId, topic, state: 'open' },
  });
  if (existing) return;

  const request = await db.coachingRequest.create({
    data: {
      salonId: salon.salonId,
      accountId: account.id,
      topic,
      message: message.length > 0 ? message : null,
      state: 'open',
      assignedRepId: account.assignedRepId,
    },
  });

  await db.activityEvent.create({
    data: {
      salonId: salon.salonId,
      actorType: 'staff',
      actorLabel: 'Dana Whitfield',
      action: 'coaching_requested',
      targetType: 'coaching_request',
      targetId: request.id,
      metadata: { topic } as never,
    },
  });

  revalidatePath('/insights/peers');
  revalidatePath('/insights/activity');
  revalidatePath('/compass');
}

/**
 * A staff challenge is a lightweight goal the team sees on the Floor. There is
 * no `StaffChallenge` table in the M0 schema and adding one would mean a
 * migration on a database five lanes are sharing this week, so it is recorded
 * as an `ActivityEvent` with its target and window in the metadata — which is
 * where the Floor would read it from anyway. Logged as a deviation in the plan.
 */
export async function createStaffChallengeAction(formData: FormData) {
  const metric = String(formData.get('metric') ?? '').trim();
  const label = String(formData.get('label') ?? '').trim();
  const target = Number(formData.get('target') ?? 0);
  if (!metric || target <= 0) return;

  const salon = await getDemoSalon();
  await db.activityEvent.create({
    data: {
      salonId: salon.salonId,
      actorType: 'staff',
      actorLabel: 'Dana Whitfield',
      action: 'staff_challenge_created',
      targetType: 'staff_challenge',
      metadata: { metric, label, target, windowDays: 28 } as never,
    },
  });

  revalidatePath('/insights/peers');
  revalidatePath('/insights/activity');
}
