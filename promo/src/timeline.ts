// Frame-level timelines (DESIGN_SPEC §3). Every SFX pin and every shot start is
// expressed relative to these, never as a bare frame number — so a shot can
// change length without re-pinning the whole sound table (sound-design 4.4).
export const FPS = 30;

export type ShotName =
  | 'brand' | 'open' | 'hero' | 'floor' | 'checkin' | 'pos'
  | 'order' | 'titleA' | 'studio' | 'map' | 'network' | 'wall' | 'compass' | 'outro';

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
 * - The salon's OPERATIONAL layer is the body of the film: the morning brief,
 *   the finding, the room board, the front desk, the till, the shelf.
 * - Then the marketing beat.
 * - Then, LAST, what UVALUX gets out of all of it — the data. "Most of all"
 *   lands where the film ends rather than in the middle.
 */
const captionCut = seq([
  ['brand', 120], // what this is, before anything moves
  ['open', 130], // Daybreak letter — crane-rise-reveal
  ['hero', 170], // the insight card — spotlight-hero-card
  ['floor', 150], // the room board — grid-wave-flip
  ['checkin', 170], // the front desk — type-and-filter
  ['pos', 200], // the till — crash-zoom-punch
  ['order', 145], // UVALUX draft order — list-stack-press
  ['titleA', 104], // breathing card
  ['studio', 150], // insight → campaign — card-flip-reveal
  // the UVALUX finale — four screens, not one. The act break pushes up into the
  // MAP, which is the screen the spec calls Nick's; the page itself follows it.
  ['map', 300], // twelve studios land west to east, chained, each one named
  ['network', 300], // the whole network page, card by card
  ['wall', 240], // every Compass surface on one wall — bento-light-up
  ['compass', 150], // and what a rep does with it — the call list
  ['outro', 220], // group photo + wordmark, longer sign-off
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
  ['brand', 130], // "what Bask is" (3.8s)
  ['open', 240], // the friction line (7.4s)
  ['hero', 155], // the insight (4.8s)
  ['floor', 140], // the room board (4.25s)
  ['checkin', 290], // the front desk — line D came back 8.45s
  ['pos', 310], // the till — line E came back 9.04s
  ['order', 195], // the shelf and the order (5.9s)
  ['titleA', 104],
  ['studio', 310], // the campaign line (9.7s)
  // the UVALUX finale — the voice carries it across four screens
  ['map', 300], // voC lands on the act break and runs over the map
  ['network', 300], // then the page itself, card by card
  ['wall', 260], // the analytics wall — new line F
  ['compass', 160], // the rep line (trimmed: the tail drift ran on past it)
  ['outro', 250], // longer sign-off hold
]);

export const SHOTS = captionCut.shots;
export const TOTAL = captionCut.total; // 2249f ≈ 75.0s
export const SHOTS_VO = voCut.shots;
export const TOTAL_VO = voCut.total; // 3034f ≈ 101.1s
