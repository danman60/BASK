// "The Quietest Register" — the long-form data film.
//
// Sources of truth, both in docs/pitch/:
//   2026-08-28-film-vo-script.md   — the full 611-word read, if it is ever recorded
//   2026-08-28-film-shot-plan.md   — the H3 shot list
//
// CUT 2 (2026-08-28, after review). Cut 1 ran 4:56 and read as footage with no
// story, for one reason: the narrative lived entirely in an unrecorded
// voice-over. This cut carries the argument ON SCREEN — every segment states its
// one sentence — and drops to roughly half the runtime. Three acts:
//
//   1. the paradox   — the customers never left, the selling stopped
//   2. what the till knew — five findings, one per shot
//   3. Monday        — four lists, one sentence, one gap in the shelf
//
// Dropped from cut 1 and why: SHOT-001 (rendered a transaction, not an empty
// opening), SHOT-010 (rendered the counter, not the back office), SHOT-009 (its
// January/July cut lands at 8.0s and the draft clips are 5.167s, so the joke
// cannot exist yet), and every -hold segment (a held frame with nothing being
// said is exactly the dead air the review caught).
import { FPS } from './timeline';

export { FPS };

export type FilmSegment = {
  /** Stable id. `SHOT-0NN` matches the H3 film workspace shot ids exactly. */
  id: string;
  kind: 'h3' | 'ui' | 'brand' | 'card';
  seconds: number;
  /** `h3`: clip in public/h3. `ui`: component in shots/FilmUI.tsx. */
  asset?: string;
  /** The sentence this segment says. This IS the narration until a read exists. */
  caption?: string;
  /** The figure that sentence rests on. Every one traces to the report. */
  figure?: { value: string; label: string };
  note: string;
};

export const SEGMENTS: FilmSegment[] = [
  /* ---- act 1 · the paradox --------------------------------------------- */
  { id: 'CARD-OPEN', kind: 'card', seconds: 5.0,
    caption: 'Four salons. Four years.\n194,672 visits, every one of them recorded.',
    note: 'Title card. States the dataset before a single claim.' },

  { id: 'SHOT-002', kind: 'h3', seconds: 8.0, asset: 'SHOT-002.mp4',
    caption: 'The customers never left.',
    note: 'The queue, unbroken, nobody carrying anything.' },

  { id: 'UI-YEARS', kind: 'ui', seconds: 8.0, asset: 'UIYearBars',
    caption: 'Between 2017 and 2019 visits fell 13.5%.\nRetail fell 37.7%.',
    note: 'The same fact on the live evidence page.' },

  { id: 'SHOT-003', kind: 'h3', seconds: 6.0, asset: 'SHOT-003.mp4',
    caption: 'They kept the people.\nThey stopped selling to them.',
    figure: { value: '−37.7%', label: 'retail revenue, 2017 → 2019' },
    note: 'The shelf, full and dusty. The thesis of the whole film.' },

  /* ---- act 2 · what the till already knew ------------------------------- */
  { id: 'SHOT-004', kind: 'h3', seconds: 9.0, asset: 'SHOT-004.mp4',
    caption: 'Renewal day is the quietest register in the shop.',
    figure: { value: '7.7% vs 19.2%', label: 'retail attach — renewal day vs sign-up day' },
    note: 'A month is bought in silence.' },

  { id: 'SHOT-005', kind: 'h3', seconds: 9.0, asset: 'SHOT-005.mp4',
    caption: 'Seven in ten lotion customers start on a $9 sachet.',
    figure: { value: '$19.00 vs $4.53', label: 'per ounce — sachet vs the bottle behind her' },
    note: 'The moment arrives at the counter and is missed.' },

  { id: 'UI-SACHET', kind: 'ui', seconds: 8.0, asset: 'UISachetEvidence',
    caption: 'Nobody graduates without being asked.',
    note: 'The finding, opened to its own evidence.' },

  { id: 'SHOT-006', kind: 'h3', seconds: 8.0, asset: 'SHOT-006.mp4',
    caption: 'A first-timer decides in a week, not a month.',
    figure: { value: '61% → 27%', label: 'odds they ever return, after seven silent days' },
    note: 'The doorway holds empty.' },

  { id: 'SHOT-007', kind: 'h3', seconds: 8.0, asset: 'SHOT-007.mp4',
    caption: '313 pairs of their customers always arrive together.',
    figure: { value: '313 vs 5', label: 'observed pairs vs what chance produces' },
    note: 'Two people, one relationship, two separate rows in the till.' },

  { id: 'SHOT-008', kind: 'h3', seconds: 8.0, asset: 'SHOT-008.mp4',
    caption: 'The customer who comes back after months away\nis the warmest buyer in the building.',
    figure: { value: '28.7%', label: 'of comeback visits sell a membership that day' },
    note: 'She let herself in.' },

  { id: 'UI-ESCALATOR', kind: 'ui', seconds: 9.0, asset: 'UIEscalator',
    caption: 'All of the membership loss is on the first renewal.',
    note: 'The escalator: 28% at cycle one, 87% by cycle fifteen.' },

  { id: 'UI-KILLED', kind: 'ui', seconds: 7.0, asset: 'UIKilledClaims',
    caption: 'Thirteen findings survived being attacked.\nFour good-sounding ones did not — two of them ours.',
    note: 'The credibility beat. Short, because it is a claim about method.' },

  /* ---- act 3 · Monday ---------------------------------------------------- */
  { id: 'SHOT-011', kind: 'h3', seconds: 8.0, asset: 'SHOT-011.mp4',
    caption: 'The whole playbook is four lists.',
    note: 'Four sheets pinned in the dark.' },

  { id: 'UI-LISTS', kind: 'ui', seconds: 10.0, asset: 'UIFourLists',
    note: 'The lists themselves — the cards carry their own words.' },

  { id: 'SHOT-012', kind: 'h3', seconds: 9.0, asset: 'SHOT-012.mp4',
    caption: '“Two of those cost more than half the bottle.”',
    note: 'The sentence, and the bottle going on the counter.' },

  { id: 'SHOT-013', kind: 'h3', seconds: 6.0, asset: 'SHOT-013.mp4',
    caption: 'One gap in the row. That is the whole result.',
    note: 'The shelf again, one bottle lighter.' },

  { id: 'CARD-CLOSE', kind: 'card', seconds: 5.0,
    caption: 'Nothing here was estimated, benchmarked or imported.\nIf it isn’t in your registers, it isn’t in this film.',
    note: 'The provenance line, stated plainly.' },

  { id: 'BRAND', kind: 'brand', seconds: 4.0,
    note: 'Bask wordmark. Hold ≥1s after it lands.' },
];

const framesOf = (seconds: number) => Math.round(seconds * FPS);

export const FILM = (() => {
  let at = 0;
  const cues = SEGMENTS.map((segment) => {
    const from = at;
    const durationInFrames = framesOf(segment.seconds);
    at += durationInFrames;
    return { ...segment, from, durationInFrames };
  });
  return { cues, total: at };
})();

export const TOTAL_FILM = FILM.total;
