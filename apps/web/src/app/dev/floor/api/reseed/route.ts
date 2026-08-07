import type { NextRequest } from 'next/server';

import { getFloorEngine } from '@/server/floor/engine';

/**
 * One-command re-seed for the harness salon:
 *
 *   curl -X POST http://localhost:3417/dev/floor/api/reseed
 *
 * The fixtures lane's `demo:reset` may truncate `bask` data while this harness
 * is running. Everything the harness needs is an upsert keyed on stable slugs,
 * so this call rebuilds the salon, its 8 rooms and their simulated devices, then
 * re-hydrates the driver — no server restart, no lost tab.
 *
 * `?reset=1` also clears this salon's sessions and parks every room `ready`.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const engine = getFloorEngine('harness');
  const hardReset = request.nextUrl.searchParams.get('reset') === '1';

  if (hardReset) {
    await engine.resetFloor();
  } else {
    await engine.resync();
  }

  const state = await engine.getState();
  return Response.json(
    {
      ok: true,
      hardReset,
      salonId: state.salonId,
      salonName: state.salonName,
      rooms: state.rooms.length,
      driver: state.driver,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
