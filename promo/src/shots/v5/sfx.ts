// v5 SFX pin table for the app cut. One row per audible action, every `from`
// written as an expression off SHOTS_V5 — never a bare frame number, so a
// timing change moves the sound with the picture.
//
// The picture is a person scrolling an application, so the palette is restrained:
// soft transitions at section changes, a light tick where the eye is directed,
// and exactly one impact — the wordmark. No per-card sounds; the film would
// machine-gun.
import { SHOTS_V5 as S } from '../../timelineV5';

export type Sfx = { from: number; src: string; volume: number; durationInFrames?: number };

const a = (f: string) => `audio/${f}`;

export const SFX: Sfx[] = [
  /* Opening: the title settling over the app. */
  { from: S.open.from + 6, src: a('transition-soft.mp3'), volume: 0.3, durationInFrames: 40 },
  { from: S.open.from + 22, src: a('sparkle.mp3'), volume: 0.2, durationInFrames: 30 },

  /* The data opportunity — a scroll, then the brief and the ranked list. */
  { from: S.brief.from, src: a('air-woosh-quick.mp3'), volume: 0.22, durationInFrames: 26 },
  { from: S.brief.from + 12, src: a('click-camera.mp3'), volume: 0.2, durationInFrames: 18 },
  { from: S.feed.from, src: a('swoosh-quick.mp3'), volume: 0.26, durationInFrames: 30 },
  { from: S.feed.from + 34, src: a('pop.mp3'), volume: 0.24, durationInFrames: 20 },

  /* Coaching: the method line, then the one-click action. */
  { from: S.method.from, src: a('transition-soft.mp3'), volume: 0.26, durationInFrames: 34 },
  { from: S.action.from + 10, src: a('switch-click-quick.mp3'), volume: 0.34, durationInFrames: 20 },
  { from: S.studio.from, src: a('transition-soft.mp3'), volume: 0.26, durationInFrames: 34 },
  { from: S.campaigns.from, src: a('pop-electric.mp3'), volume: 0.22, durationInFrames: 20 },

  /* Community: a longer, softer move — people, not machinery. */
  { from: S.community.from, src: a('paper-move-quick.mp3'), volume: 0.24, durationInFrames: 30 },

  /* Measured growth. */
  { from: S.outcome.from, src: a('air-woosh-quick.mp3'), volume: 0.22, durationInFrames: 26 },
  { from: S.outcome.from + 30, src: a('pop-electric.mp3'), volume: 0.24, durationInFrames: 20 },
  { from: S.wins.from, src: a('swoosh-quick.mp3'), volume: 0.2, durationInFrames: 24 },

  /* The till the whole thing is read off. */
  { from: S.evidence.from, src: a('sweep-short.mp3'), volume: 0.26, durationInFrames: 34 },
  { from: S.evidence.from + 38, src: a('pop.mp3'), volume: 0.22, durationInFrames: 20 },

  /* The flip into the UVALUX side, and the network. */
  { from: S.flip.from, src: a('sweep-short.mp3'), volume: 0.42, durationInFrames: 40 },
  { from: S.network.from, src: a('swoosh-slow.mp3'), volume: 0.24, durationInFrames: 46 },
  { from: S.calls.from, src: a('transition-soft.mp3'), volume: 0.26, durationInFrames: 34 },
  { from: S.knowledge.from, src: a('paper-move-quick.mp3'), volume: 0.22, durationInFrames: 30 },

  /* Sign-off: NOTHING loud. The riser and the deep-whoosh impact that used to sit
     here are removed on the owner's note (2026-08-30) — the impact ran at volume
     0.55 against a film whose next loudest cue is 0.34, so it read as a trailer
     sting bolted onto a quiet product film. The end now lands on the wordmark and
     the last line of the read. One soft sparkle is all the punctuation it gets.
     Do not put an impact back here. */
  { from: S.outro.from + 28, src: a('sparkle.mp3'), volume: 0.2, durationInFrames: 20 },
];
