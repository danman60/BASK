import { getFloorEngine } from './lib/engine';
import { getPublicRealtimeConfig, floorChannelName } from './lib/realtime';
import { FloorBoard } from './floor-board';

/**
 * M0 step 7 dev harness — the room board, proving the session state machine and
 * `SimulatedDriver` end to end.
 *
 * Bare styling on purpose (M0 has no tokens yet — that's step 8). What is NOT
 * bare is the state vocabulary: the four states and the card anatomy follow
 * DESIGN_SPEC §3.2 exactly (equipment type over room name over state zone,
 * `mm:ss` countdown, customer first name), so step 8 restyles this rather than
 * redefining it.
 *
 * Fully dynamic: it reads live rows on every request, and a prerendered snapshot
 * of a room board would be actively wrong.
 */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Floor harness — Bask M0 step 7',
};

export default async function DevFloorPage() {
  const engine = getFloorEngine();
  // Idempotent: recreates the test salon if a fixtures reset wiped it.
  await engine.ensureStarted();
  const state = await engine.getState();
  const realtime = getPublicRealtimeConfig();

  return (
    <FloorBoard
      initialState={state}
      channel={floorChannelName(state.salonId)}
      realtimeUrl={realtime?.url ?? null}
      realtimeKey={realtime?.anonKey ?? null}
    />
  );
}
