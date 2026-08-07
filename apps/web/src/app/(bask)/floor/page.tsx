import { addDays } from '@bask/core';

import { readFloorClock } from '@/server/floor/demo-clock';
import { getFloorEngine } from '@/server/floor/engine';
import {
  ensureBookings,
  readFloorCatalogue,
  readHandoff,
  readSchedule,
} from '@/server/floor/floor-data';
import { floorChannelName, getPublicRealtimeConfig } from '@/server/floor/realtime';

import { FloorApp } from './FloorApp';
import './floor.css';

/**
 * The Floor — the front desk (DESIGN_SPEC §3.2, mockup 02).
 *
 * Runs against the seeded Sunset Ridge salon, not the M0 harness sandbox. Fully
 * dynamic: a prerendered snapshot of a room board would be actively wrong, and a
 * cached one would be wrong more quietly.
 */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'The Floor — Bask',
};

export default async function FloorPage() {
  const engine = getFloorEngine('hero');
  const [state, clock] = await Promise.all([engine.getState(), readFloorClock()]);

  // Bookings are filled in for the demo window on first sight and then owned by
  // the app — see `ensureBookings` for why they are not fixture rows.
  await ensureBookings(state.salonId, clock);

  const [catalogue, bookings, handoff] = await Promise.all([
    readFloorCatalogue(state.salonId),
    readSchedule(state.salonId, addDays(clock.today, -7), addDays(clock.today, 14), clock.zone),
    readHandoff(state.salonId, clock),
  ]);

  const realtime = getPublicRealtimeConfig();

  return (
    <FloorApp
      initialState={state}
      catalogue={catalogue}
      bookings={bookings}
      handoff={handoff}
      today={clock.today}
      zone={clock.zone}
      channel={floorChannelName(state.salonId)}
      realtimeUrl={realtime?.url ?? null}
      realtimeKey={realtime?.anonKey ?? null}
    />
  );
}
