// Frame-level timelines (DESIGN_SPEC §3). Every SFX pin and every shot start is
// expressed relative to these, never as a bare frame number — so a shot can
// change length without re-pinning the whole sound table (sound-design 4.4).
export const FPS = 30;

export type ShotName =
  | 'brand' | 'open' | 'hero' | 'titleA' | 'studio'
  | 'floor' | 'order' | 'compass' | 'outro';

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

/**
 * Caption cut — no voiceover.
 *
 * ORDER (client-directed):
 * - The film opens by SAYING WHAT BASK IS, before any product moves.
 * - The consent beat is GONE. Consent is not the story here: UVALUX supplies the
 *   software, the salon runs on it, and the data reaching UVALUX is the point of
 *   the arrangement rather than a thing to be negotiated on screen.
 * - The campaign beat sits last, before the sign-off.
 */
const captionCut = seq([
  ['brand', 120], // S0  what this is, before anything moves
  ['open', 130], // S1  Daybreak letter — crane-rise-reveal
  ['hero', 170], // S2  the insight card — spotlight-hero-card
  ['floor', 150], // S3  the room board — grid-wave-flip
  ['order', 145], // S4  UVALUX draft order — list-stack-press
  ['compass', 150], // S5  Compass call list — row-embed (last 30f of `order` = act break)
  ['titleA', 104], // S6  breathing card
  ['studio', 150], // S7  insight → campaign — card-flip-reveal
  ['outro', 180], // S8  group photo + wordmark
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
  ['brand', 130], // carries the opening "what Bask is" line (3.8s)
  ['open', 240], // the crane runs under the whole friction line (7.4s)
  ['hero', 155],
  ['floor', 140],
  ['order', 195],
  ['compass', 400], // the UVALUX-data line (8.4s) lands on the act break, then the rep line
  ['titleA', 104],
  ['studio', 310], // the re-recorded campaign line came back 9.7s long
  ['outro', 180],
]);

export const SHOTS = captionCut.shots;
export const TOTAL = captionCut.total; // 1299f ≈ 43.3s
export const SHOTS_VO = voCut.shots;
export const TOTAL_VO = voCut.total; // 1854f ≈ 61.8s
