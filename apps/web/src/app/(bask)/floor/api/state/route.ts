import type { NextRequest } from 'next/server';

import { getFloorEngine } from '@/server/floor/engine';

/**
 * Polled fallback for the room board — the same contract the M0 harness route
 * serves, against the seeded salon.
 *
 * Supabase Realtime is the fast path; this is the correctness path. A client that
 * missed a broadcast, slept in a background tab, or could not open a websocket at
 * all still converges within one poll interval, because the state it gets back is
 * read straight from the rows the engine wrote. That is also what makes "reload
 * mid-countdown" boring: there is no client-side timer holding the truth.
 *
 * Route handlers are uncached by default in Next 16; `force-dynamic` is stated
 * anyway so a future `cacheComponents` flip cannot silently freeze the board.
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const state = await getFloorEngine('hero').getState();
  return Response.json(state, { headers: { 'Cache-Control': 'no-store' } });
}
