// v6 timeline — the composed cut (2026-08-31).
//
// WHY THIS EXISTS, because the history matters more than the numbers below.
//
// v5 was built with video-shotcraft and framed element cutouts at 3x. Daniel's
// note on that pass — "elements too isolated, just show the app" — was correct,
// and the rebuild over-corrected: it threw the framing away entirely and ran a
// camera down stacked page strips (`shots/v5/AppScroll.tsx`). His verdict on
// the result: "all of the inner shots seem like they're just scrolling a site
// and not the great animated shot craft style from previous versions."
//
// v6 is the synthesis. Cutouts are FRAMED again — push-ins, drifts, settles,
// a chart that draws itself on — but they are framed IN CONTEXT, over the page
// they came from, so nothing floats on an empty background the way it did in
// the first v5. Both notes are satisfied at once; neither is traded for the
// other.
//
// Read: docs/pitch/2026-08-31-v6-vo-elevenlabs.txt (the spoken copy lives there
// and only there). Beat map: docs/pitch/2026-08-31-v6-vo-script.md.
import { FPS } from './timeline';

export { FPS };

export type ShotV6 =
  | 'open'
  | 'read'
  | 'chart'
  | 'method'
  | 'action'
  | 'community'
  | 'measured'
  | 'opens'
  | 'flip'
  | 'network'
  | 'calls'
  | 'knowledge'
  | 'signoff';

export type ShotsV6 = Record<ShotV6, { from: number; duration: number }>;

const ORDER: ShotV6[] = [
  'open', 'read', 'chart', 'method', 'action', 'community', 'measured', 'opens',
  'flip', 'network', 'calls', 'knowledge', 'signoff',
];

const seq = (spec: [ShotV6, number][]) => {
  let at = 0;
  const out = {} as ShotsV6;
  for (const [name, duration] of spec) {
    out[name] = { from: at, duration };
    at += duration;
  }
  // Same guard as v5, kept for the same reason: the `as ShotsV6` cast means a
  // shot declared in the union but never placed type-checks clean and then dies
  // mid-render with "Cannot read properties of undefined (reading 'from')",
  // pointing at the SFX table rather than at the actual mistake.
  const missing = ORDER.filter((k) => !out[k]);
  if (missing.length) throw new Error(`timelineV6: shots declared but never placed: ${missing.join(', ')}`);
  return { shots: out, total: at };
};

// Durations follow the VO beat map. The read is ~215 words at an unhurried
// pace; these are the picture lengths it sits over, not guesses.
// RE-TIMED TO THE RECORDED READ, 2026-08-31. Daniel's ElevenLabs take runs
// 80.67s against the 73.0s picture it was written for, so every shot is scaled
// by 1.104 rather than the audio being sped up: `atempo` at 9% is audible on a
// slow, low read, and it would have flattened the two deliberate pauses the
// script asks for. Uniform scaling keeps the internal rhythm that was already
// checked frame by frame, and the rounding drift is parked on the sign-off —
// the one shot with nothing after it to push out of sync.
const cut = seq([
  ['open', 232], // the plain line, held — not scrolled
  ['read', 265], // the morning letter, framed as a figure
  ['chart', 398], // THE CHART BEAT — the figure v5 never had, inside 20s
  ['method', 365], // where the advice came from: the citation, opened
  ['action', 332], // one button, the campaign already written
  ['community', 199], // other owners, slower move
  ['measured', 265], // what it was worth, beside the coaching that said it
  ['opens', 199], // every figure goes back to the visits behind it
  // THE UVALUX SIDE. Dropped entirely when v6 was first cut — nine salon-side
  // beats and nothing above them — which threw away the half of the story the
  // people in the room on Thursday actually own. Restored by REUSING v5's four
  // shots rather than rebuilding them: A12bKnowledge in particular carries the
  // page-space mask that keeps the signed-in rep's name off screen, and
  // re-authoring it is how that mask gets lost.
  ['flip', 45], // the turn: same nervous system, opposite end
  ['network', 150], // the market UVALUX serves, visible
  ['calls', 100], // the rep's ranked calls, with reasons
  ['knowledge', 95], // the training corpus UVALUX reviews
  ['signoff', 165], // wordmark + the UVALUX lockup
]);

export const SHOTS_V6 = cut.shots;
export const TOTAL_V6 = cut.total; // 2810f = 93.7s (2420f of read + 390f UVALUX side)
