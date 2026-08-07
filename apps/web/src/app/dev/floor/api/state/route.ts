import type { NextRequest } from 'next/server';

import { getFloorEngine } from '../../lib/engine';

/**
 * Polled fallback for the room board.
 *
 * Supabase Realtime is the fast path; this is the correctness path. A client
 * that missed a broadcast, slept in a background tab, or could not open a
 * websocket at all still converges within one poll interval, because the state
 * it gets back is read straight from the rows the engine wrote.
 *
 * Route handlers are uncached by default in Next 16; `force-dynamic` is stated
 * anyway so a future `cacheComponents` flip cannot silently freeze the board.
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const state = await getFloorEngine().getState();
  return Response.json(state, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
