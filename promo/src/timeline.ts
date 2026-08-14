// Frame-level timelines (DESIGN_SPEC §3). Every SFX pin and every shot start is
// expressed relative to these, never as a bare frame number — so a shot can
// change length without re-pinning the whole sound table (sound-design 4.4).
export const FPS = 30;

export type ShotName =
  | 'open' | 'hero' | 'titleA' | 'studio' | 'floor'
  | 'order' | 'titleB' | 'consent' | 'compass' | 'outro';

export type Shots = Record<ShotName, { from: number; duration: number }>;

const seq = (spec: [ShotName, number][]) => {
  let at = 0;
  const out = {} as Shots;
  for (const [name, duration] of spec) {
    out[name] = { from: at, duration };
    at += duration;
  }
  return { shots: out, total: at };
};

/** Caption cut — the film as designed, no voiceover. */
const captionCut = seq([
  ['open', 130], // S1  Daybreak letter — crane-rise-reveal
  ['hero', 170], // S2  the insight card — spotlight-hero-card
  ['titleA', 76], // S3  breathing card
  ['studio', 150], // S4  insight → campaign — card-flip-reveal
  ['floor', 150], // S5  the room board — grid-wave-flip
  ['order', 145], // S6  UVALUX draft order — list-stack-press
  ['titleB', 76], // S7  breathing card
  ['consent', 100], // S8  what UVALUX sees (last 30f = the act-break push)
  ['compass', 150], // S9  Compass call list — row-embed
  ['outro', 180], // S10 group photo + wordmark
]);

/**
 * Voiceover cut. The supplied read is 41.8s of near-continuous speech, and the
 * caption cut only has ~39s of room once the two title cards are silent — so the
 * shots carrying the longest lines are held longer. Nothing is re-animated: each
 * shot's keyframes are unchanged and every extra frame lands in its closing
 * still, which is the direction the rhythm rules push anyway. The title cards
 * shorten because there the voice is carrying the beat, not the card.
 */
const voCut = seq([
  ['open', 130],
  ['hero', 170],
  ['titleA', 45],
  ['studio', 240], // holds the three-sentence campaign line
  ['floor', 150],
  ['order', 190],
  ['titleB', 45],
  ['consent', 100],
  ['compass', 216], // the consent line finishes over Compass, then the rep line
  ['outro', 180],
]);

export const SHOTS = captionCut.shots;
export const TOTAL = captionCut.total; // 1327f ≈ 44.2s
export const SHOTS_VO = voCut.shots;
export const TOTAL_VO = voCut.total; // 1466f ≈ 48.9s
