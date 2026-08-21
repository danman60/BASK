// v3 timeline — the salon-intelligence cut (2026-08-21).
//
// The thesis changed (docs/meetings/2026-08-21-salon-intelligence-brainstorm.md):
// the film is no longer a tour of screens, it is one argument —
//   data → intelligence → dollar opportunity → one-click action → measured outcome
// then the UVALUX network behind it. The opportunity feed opens the body, the
// Front Desk Monitor and the proof beat are new, and the proven UVALUX finale
// (map → network → wall → compass → outro) is kept verbatim.
//
// Picture-only review cut: no Soundtrack, no captions. VO comes from Daniel's
// ElevenLabs record of promo/VO-SCRIPT-V3.md; SFX are re-pinned after.
import { FPS } from './timeline';

export { FPS };

export type ShotV3 =
  | 'brand'
  | 'daybreak'
  | 'oppfeed'
  | 'health'
  | 'peers'
  | 'monitor'
  | 'proof'
  | 'map'
  | 'network'
  | 'wall'
  | 'compass'
  | 'outro';

export type ShotsV3 = Record<ShotV3, { from: number; duration: number }>;

const seq = (spec: [ShotV3, number][]) => {
  let at = 0;
  const out = {} as ShotsV3;
  for (const [name, duration] of spec) {
    out[name] = { from: at, duration };
    at += duration;
  }
  return { shots: out, total: at };
};

const cut = seq([
  ['brand', 120], // what Bask is
  ['daybreak', 150], // the quiet morning — the friction
  ['oppfeed', 300], // N ways to grow → drift the ranked cards → one-click money shot
  ['health', 190], // customer health — who is slipping
  ['peers', 190], // analytics — where you stand, and the gap in dollars
  ['monitor', 210], // the Front Desk Monitor
  ['proof', 120], // what the last actions made — recurring revenue
  ['map', 300], // the UVALUX network lands, west to east
  ['network', 300], // the network page, card by card
  ['wall', 240], // every network surface on one wall
  ['compass', 150], // what a rep does with it
  ['outro', 220], // sign-off + wordmark (S10Outro reads SHOTS.outro.duration = 220)
]);

export const SHOTS_V3 = cut.shots;
export const TOTAL_V3 = cut.total; // 2490f ≈ 83.0s
