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

// Durations are PINNED TO THE READ, not scaled from a picture guess.
//
// RE-TIMED AGAIN 2026-09-02 to Daniel's second record, `audio/vo/uvaint-v7.mp3`
// (128.679s). The v6 read was 80.67s and contained NO UVALUX copy, so v6 carried
// a deliberate 13.0s hole at 75.19s where the altitude block played under music.
// The new read speaks that block. **The hole is gone. Do not reintroduce it.**
//
// These are not v6's numbers times a constant. Every boundary below is the
// MIDPOINT of a measured silence in the read (`silencedetect=n=-38dB:d=0.45`),
// so the picture cuts in the breath instead of under a word. That is also why
// the salon-side shots move by different factors and the UVALUX side roughly
// doubles: those four shots were previously sized to a music hole and now have
// three spoken paragraphs to carry.
//
// Beat map with the per-shot cut times: docs/pitch/2026-09-02-v7-beatmap.md.
// Spoken copy, as recorded: docs/pitch/2026-09-02-v7-vo-elevenlabs.txt.
const cut = seq([
  ['open', 198], // "Bask is an app ... to make it less quiet."      cut @ 6.59s
  ['read', 336], // "It reads last night's numbers ..."              cut @ 17.79s
  ['chart', 452], // THE CHART BEAT — "Lotion per visit slipped ..." cut @ 32.85s
  ['method', 619], // "Then the part nobody else does ..."           cut @ 53.51s
  // ^ the longest beat in the film at 20.6s, and the reason FigurePlate grew a
  //   `travel` move: a plate that finishes pushing at 90f would sit frozen for
  //   17.6s here. It now pans down the citation page instead.
  ['action', 457], // "One button ... nothing leaves without you."   cut @ 68.74s
  ['community', 199], // "And you're not doing it alone ..."         cut @ 75.35s
  ['measured', 281], // "Then it comes back ... what it was worth."  cut @ 84.74s
  ['opens', 189], // "Everything on this screen can be opened ..."   cut @ 91.02s
  // THE UVALUX SIDE. Dropped entirely when v6 was first cut — nine salon-side
  // beats and nothing above them — which threw away the half of the story the
  // people in the room on Thursday actually own. Restored by REUSING v5's four
  // shots rather than rebuilding them: A12bKnowledge in particular carries the
  // page-space mask that keeps the signed-in rep's name off screen, and
  // re-authoring it is how that mask gets lost.
  //
  // These four roughly DOUBLE against v6 because v6 sized them to 13s of music.
  // They now carry three spoken paragraphs.
  ['flip', 93], // "Same nervous system, opposite end."              cut @ 94.12s
  ['network', 252], // "Every salon running this is a signal ..."    cut @ 102.53s
  ['calls', 264], // "Your rep stops calling to ask ..."             cut @ 111.35s
  ['knowledge', 325], // "And the coaching underneath all of it ..." cut @ 122.16s
  ['signoff', 235], // "That's Bask." — holds 1.5s in silence after the last word
]);

export const SHOTS_V6 = cut.shots;
export const TOTAL_V6 = cut.total; // 3900f = 130.0s against a 128.679s read
