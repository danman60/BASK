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
  | 'signoff';

export type ShotsV6 = Record<ShotV6, { from: number; duration: number }>;

const ORDER: ShotV6[] = [
  'open', 'read', 'chart', 'method', 'action', 'community', 'measured', 'opens', 'signoff',
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
const cut = seq([
  ['open', 210], // the plain line, held — not scrolled
  ['read', 240], // the morning letter, framed as a figure
  ['chart', 360], // THE CHART BEAT — the figure v5 never had, inside 20s
  ['method', 330], // where the advice came from: the citation, opened
  ['action', 300], // one button, the campaign already written
  ['community', 180], // other owners, slower move
  ['measured', 240], // what it was worth, beside the coaching that said it
  ['opens', 180], // every figure goes back to the visits behind it
  ['signoff', 150], // wordmark + the UVALUX lockup
]);

export const SHOTS_V6 = cut.shots;
export const TOTAL_V6 = cut.total; // 2190f = 73.0s
