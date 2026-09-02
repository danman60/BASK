// v5 timeline — the app cut (2026-08-29).
//
// Rebuilt after two notes from Daniel: the first pass showed "elements too
// isolated, just show the app", and the story he wants told is
//   "data opportunity paired with niche specific coaching wrapped in community
//    support" —
// i.e. the app finds the opening in the salon's own numbers, the suggestion is
// tanning-specific coaching rather than generic marketing advice, and other
// owners are around it the whole time. It ends with the UVALUX side, shown at
// altitude only.
//
// Storyboard + VO: docs/pitch/2026-08-28-shotcraft-v5-spec.md,
//                  docs/pitch/2026-08-29-v5-vo-script.md
import { FPS } from './timeline';

export { FPS };

export type ShotV5 =
  | 'open'
  | 'brief'
  | 'feed'
  | 'method'
  | 'action'
  | 'studio'
  | 'campaigns'
  | 'community'
  | 'outcome'
  | 'wins'
  | 'evidence'
  | 'flip'
  | 'network'
  | 'calls'
  | 'knowledge'
  | 'outro';

export type ShotsV5 = Record<ShotV5, { from: number; duration: number }>;

const ORDER: ShotV5[] = [
  'open', 'brief', 'feed', 'method', 'action', 'studio', 'campaigns', 'community',
  'outcome', 'wins', 'evidence', 'flip', 'network', 'calls', 'knowledge', 'outro',
];

const seq = (spec: [ShotV5, number][]) => {
  let at = 0;
  const out = {} as ShotsV5;
  for (const [name, duration] of spec) {
    out[name] = { from: at, duration };
    at += duration;
  }
  // The `as ShotsV5` cast above means a shot declared in the union but never
  // given a row type-checks clean and then dies at render with
  // "Cannot read properties of undefined (reading 'from')" — from the SFX table,
  // nowhere near the actual mistake. Fail here instead, with the name.
  const missing = ORDER.filter((k) => !out[k]);
  if (missing.length) throw new Error(`timelineV5: shots declared but never placed: ${missing.join(', ')}`);
  return { shots: out, total: at };
};

const cut = seq([
  ['open', 140], // what it is, in one plain line, over the running app
  // the data opportunity
  ['brief', 110], // what changed overnight
  ['feed', 160], // six openings, ranked by what they are worth
  // the coaching
  ['method', 100], // where the suggestion came from
  ['action', 110], // one button, message already written
  ['studio', 110], // it drafts the campaign — words, list, timing
  ['campaigns', 90], // owner-fired, then measured
  // the community around it
  ['community', 160], // owners, in their own words
  // measured growth
  ['outcome', 130], // what the last actions brought back
  ['wins', 80], // the same loop, at salons like this one
  ['evidence', 140], // why it can be trusted: it reads the till
  // the UVALUX side, at altitude
  ['flip', 60],
  ['network', 160],
  ['calls', 90],
  ['knowledge', 90], // the training corpus UVALUX reviews
  ['outro', 120],
]);

export const SHOTS_V5 = cut.shots;
export const TOTAL_V5 = cut.total; // 1850f = 61.7s
