// v6 SFX pins. One row per audible action, every `from` written as an expression
// off SHOTS_V6 — never a bare frame number, so a timing change moves the sound
// with the picture.
//
// THE END HAS NO IMPACT. v5 fired `impact-deep-whoosh.mp3` at volume 0.55 into a
// film whose next loudest cue was 0.34, with a riser stacked under it, and the
// owner's note was that it had come back and had to go. The sign-off lands on
// the wordmark and the last line of the read. Do not add one.
//
// The palette is otherwise restrained on purpose: soft transitions where the
// picture cuts, a light tick where the eye is directed, nothing per-card or the
// film machine-guns.
import { SHOTS_V6 as S } from '../../timelineV6';

export type Sfx = { from: number; src: string; volume: number; durationInFrames?: number };

const a = (f: string) => `audio/${f}`;

export const SFX_V6: Sfx[] = [
  /* Opening: the title settling over the app. */
  { from: S.open.from + 6, src: a('transition-soft.mp3'), volume: 0.28, durationInFrames: 40 },
  { from: S.open.from + 22, src: a('sparkle.mp3'), volume: 0.18, durationInFrames: 30 },

  /* The morning letter arrives. */
  { from: S.read.from, src: a('air-woosh-quick.mp3'), volume: 0.22, durationInFrames: 26 },
  { from: S.read.from + 14, src: a('click-camera.mp3'), volume: 0.18, durationInFrames: 18 },

  /* The chart beat. A tick as the line starts drawing, a pop as it lands — the
     two moments the eye is actually being directed to. */
  { from: S.chart.from, src: a('swoosh-quick.mp3'), volume: 0.26, durationInFrames: 30 },
  { from: S.chart.from + 46, src: a('pop.mp3'), volume: 0.22, durationInFrames: 20 },
  { from: S.chart.from + 200, src: a('transition-soft.mp3'), volume: 0.24, durationInFrames: 34 },

  /* The citation opening. */
  { from: S.method.from, src: a('paper-move-quick.mp3'), volume: 0.24, durationInFrames: 30 },

  /* One button. The only firm click in the film — it is the one action the
     owner takes, so it earns a sound nothing else gets. */
  { from: S.action.from + 12, src: a('switch-click-quick.mp3'), volume: 0.34, durationInFrames: 20 },
  { from: S.action.from + 150, src: a('pop-electric.mp3'), volume: 0.2, durationInFrames: 20 },

  /* Community: longer, softer. People, not machinery. */
  { from: S.community.from, src: a('paper-move-quick.mp3'), volume: 0.2, durationInFrames: 30 },

  /* Measured growth. */
  { from: S.measured.from, src: a('air-woosh-quick.mp3'), volume: 0.22, durationInFrames: 26 },
  { from: S.measured.from + 30, src: a('pop-electric.mp3'), volume: 0.22, durationInFrames: 20 },

  /* Everything opens — the drill down to the rows. */
  { from: S.opens.from, src: a('sweep-short.mp3'), volume: 0.24, durationInFrames: 34 },

  /* Sign-off. One soft sparkle, and that is all. */
  { from: S.signoff.from + 28, src: a('sparkle.mp3'), volume: 0.2, durationInFrames: 20 },
];
