'use server';

import { refresh } from 'next/cache';

import { getFloorEngine } from './lib/engine';

/**
 * Server actions for the step 7 harness.
 *
 * Deliberately NOT tRPC: `packages/api` belongs to lane A. When its `floor`
 * router lands, these become thin wrappers over the same engine calls and the
 * board does not change.
 *
 * Every action returns a machine-readable result and calls `refresh()` so the
 * server component re-renders in the same round trip (Next 16 — `refresh` is
 * Server-Action-only and re-fetches the RSC payload without invalidating a data
 * cache this page does not use).
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function startSessionAction(input: {
  roomId: string;
  minutes: number;
  delayMinutes?: number;
}): Promise<ActionResult> {
  const result = await getFloorEngine().startSession(input);
  refresh();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function cancelSessionAction(roomId: string): Promise<ActionResult> {
  const result = await getFloorEngine().cancelSession(roomId);
  refresh();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function setMaintenanceAction(roomId: string, on: boolean): Promise<ActionResult> {
  const result = await getFloorEngine().setMaintenance(roomId, on);
  refresh();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** Fire the manual-start the simulator would otherwise roll for at random. */
export async function triggerManualStartAction(): Promise<ActionResult> {
  const result = await getFloorEngine().triggerManualStart();
  refresh();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/**
 * Re-create the test salon + 8 rooms and re-hydrate the driver. This is the
 * recovery path after the fixtures lane's `demo:reset` wipes bask data mid-run:
 * one button, no server restart.
 */
export async function reseedAction(): Promise<ActionResult> {
  await getFloorEngine().resync();
  refresh();
  return { ok: true };
}

/** Clear this salon's sessions and park every room `ready`. */
export async function resetFloorAction(): Promise<ActionResult> {
  await getFloorEngine().resetFloor();
  refresh();
  return { ok: true };
}
