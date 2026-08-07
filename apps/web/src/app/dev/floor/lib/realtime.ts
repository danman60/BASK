import 'server-only';

/**
 * Server → client push for room state, over Supabase Realtime.
 *
 * Broadcast, not `postgres_changes`. Two reasons:
 *  - `postgres_changes` requires adding `bask.room` / `bask.session` to the
 *    `supabase_realtime` publication, which is a migration against a database
 *    shared with 574 other tables belonging to live apps. Not worth it for a
 *    harness, and not this lane's schema to change.
 *  - The board wants a *derived* room state (state + countdown + who's in it),
 *    not a raw row diff. Broadcasting the projection means the client renders
 *    exactly what the server decided and never re-derives a transition.
 *
 * Fire-and-forget over HTTP: no websocket is held open server-side, so a dropped
 * broadcast costs one frame of latency and nothing else — the client's poll and
 * the absolute `endsAt` timestamps make it self-correcting. Realtime is the fast
 * path here, never the source of truth.
 */

export const FLOOR_CHANNEL_PREFIX = 'bask-floor';
export const FLOOR_EVENT = 'floor_state';

export function floorChannelName(salonId: string): string {
  return `${FLOOR_CHANNEL_PREFIX}:${salonId}`;
}

export interface RealtimeConfig {
  url: string;
  anonKey: string;
}

/** Public config handed to the browser so it can subscribe to the channel. */
export function getPublicRealtimeConfig(): RealtimeConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

let warnedMissingKey = false;

/**
 * Push a payload to every client subscribed to this salon's floor channel.
 * Never throws — a harness must not fail a mutation because a push failed.
 */
export async function broadcastFloor(salonId: string, payload: unknown): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn(
        '[floor] Realtime disabled: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. ' +
          'The board falls back to polling.',
      );
    }
    return;
  }

  try {
    const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: floorChannelName(salonId),
            event: FLOOR_EVENT,
            payload,
          },
        ],
      }),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn('[floor] realtime broadcast failed', res.status, await res.text());
    }
  } catch (err) {
    console.warn('[floor] realtime broadcast threw', err);
  }
}
