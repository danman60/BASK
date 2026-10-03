// v8 SFX — v7's vocabulary only, quiet, every `from` an expression off the
// timeline so a new read moves the sound with the picture.
//
// THE END HAS NO IMPACT, NO RISER, NO WHOOSH (owner rule). The guard at the
// bottom throws if anything whoosh-like lands in the last 8 seconds.
import { CUE, SHOTS_V8 as S, TOTAL_V8 } from '../../timelineV8';

export type Sfx = { from: number; src: string; volume: number; durationInFrames?: number };
const a = (f: string) => `audio/${f}`;

const raw: Sfx[] = [
  { from: S.open.from + CUE.open.title + 6, src: a('transition-soft.mp3'), volume: 0.24, durationInFrames: 40 },
  { from: S.open.from + CUE.open.title + 30, src: a('sparkle.mp3'), volume: 0.15, durationInFrames: 30 },

  /* the spine: one light tick per link landing (glow-flyline: "每次落点一声轻打点") */
  ...CUE.chain.nodes.map((n) => ({ from: S.chain.from + n, src: a('pop.mp3'), volume: 0.12, durationInFrames: 18 })),

  { from: S.sync.from, src: a('swoosh-quick.mp3'), volume: 0.18, durationInFrames: 30 },
  { from: S.sync.from + 25, src: a('pop-electric.mp3'), volume: 0.12, durationInFrames: 20 },
  { from: S.sync.from + CUE.sync.card, src: a('paper-move-quick.mp3'), volume: 0.18, durationInFrames: 30 },

  { from: S.read.from, src: a('air-woosh-quick.mp3'), volume: 0.2, durationInFrames: 26 },
  { from: S.read.from + 14, src: a('click-camera.mp3'), volume: 0.16, durationInFrames: 18 },

  { from: S.chart.from, src: a('swoosh-quick.mp3'), volume: 0.22, durationInFrames: 30 },
  { from: S.chart.from + 46, src: a('pop.mp3'), volume: 0.2, durationInFrames: 20 },
  { from: S.chart.from + CUE.chart.cut + 4, src: a('transition-soft.mp3'), volume: 0.2, durationInFrames: 34 },

  { from: S.health.from, src: a('paper-move-quick.mp3'), volume: 0.18, durationInFrames: 30 },
  ...CUE.health.lit.map((n) => ({ from: S.health.from + n, src: a('pop.mp3'), volume: 0.1, durationInFrames: 18 })),
  { from: S.health.from + CUE.health.minutes, src: a('transition-soft.mp3'), volume: 0.18, durationInFrames: 34 },

  { from: S.recovery.from, src: a('air-woosh-quick.mp3'), volume: 0.18, durationInFrames: 26 },

  { from: S.listen.from, src: a('transition-soft.mp3'), volume: 0.2, durationInFrames: 34 },
  { from: S.listen.from + CUE.listen.conv, src: a('click-camera.mp3'), volume: 0.14, durationInFrames: 18 },
  ...CUE.listen.scores.map((n) => ({ from: S.listen.from + n, src: a('pop.mp3'), volume: 0.1, durationInFrames: 18 })),

  { from: S.team.from, src: a('paper-move-quick.mp3'), volume: 0.18, durationInFrames: 30 },
  { from: S.team.from + CUE.team.peers, src: a('sweep-short.mp3'), volume: 0.18, durationInFrames: 34 },

  { from: S.method.from, src: a('paper-move-quick.mp3'), volume: 0.22, durationInFrames: 30 },
  /* into the speakers, quietly — their voices carry it */
  { from: S.method.from + CUE.method.speakers, src: a('transition-soft.mp3'), volume: 0.16, durationInFrames: 30 },

  { from: S.bottle.from, src: a('air-woosh-quick.mp3'), volume: 0.18, durationInFrames: 26 },
  { from: S.bottle.from + CUE.bottle.card, src: a('transition-soft.mp3'), volume: 0.18, durationInFrames: 34 },
  { from: S.bottle.from + CUE.bottle.deal + 16, src: a('swoosh-quick.mp3'), volume: 0.15, durationInFrames: 24 },
  { from: S.bottle.from + CUE.bottle.deal + 22, src: a('swoosh-quick.mp3'), volume: 0.12, durationInFrames: 24 },

  { from: S.flag.from + CUE.flag.why, src: a('pop-electric.mp3'), volume: 0.16, durationInFrames: 20 },

  /* one button — the one firm click in the film, on the press */
  { from: S.action.from + CUE.action.press, src: a('switch-click-quick.mp3'), volume: 0.32, durationInFrames: 20 },
  { from: S.action.from + CUE.action.toast + 4, src: a('pop-electric.mp3'), volume: 0.16, durationInFrames: 20 },
  /* the narration hole: the email, the post, the phone */
  { from: S.action.from + CUE.action.messages, src: a('paper-move-quick.mp3'), volume: 0.16, durationInFrames: 30 },
  { from: S.action.from + CUE.action.messages + 74, src: a('paper-move-quick.mp3'), volume: 0.16, durationInFrames: 30 },
  { from: S.action.from + CUE.action.messages + 160, src: a('paper-move-quick.mp3'), volume: 0.14, durationInFrames: 30 },
  ...[1, 2].map((k) => ({ from: S.action.from + CUE.action.messages + 160 + k * 30, src: a('click-camera.mp3'), volume: 0.1, durationInFrames: 14 })),

  { from: S.actions.from, src: a('paper-move-quick.mp3'), volume: 0.18, durationInFrames: 30 },
  { from: S.actions.from + CUE.actions.message, src: a('click-camera.mp3'), volume: 0.14, durationInFrames: 18 },
  { from: S.actions.from + CUE.actions.walk, src: a('transition-soft.mp3'), volume: 0.18, durationInFrames: 34 },
  { from: S.actions.from + CUE.actions.eighty, src: a('pop.mp3'), volume: 0.12, durationInFrames: 18 },

  { from: S.measured.from, src: a('air-woosh-quick.mp3'), volume: 0.2, durationInFrames: 26 },
  /* odometer: one tick per digit lock (card's "哒×N"), quiet */
  ...[0, 1, 2, 3].map((i) => ({ from: S.measured.from + CUE.measured.odo + 4 + 16 + i * 7 + 22, src: a('pop.mp3'), volume: 0.09, durationInFrames: 14 })),
  { from: S.measured.from + CUE.measured.card, src: a('transition-soft.mp3'), volume: 0.18, durationInFrames: 34 },

  { from: S.opens.from, src: a('sweep-short.mp3'), volume: 0.22, durationInFrames: 34 },
  { from: S.community.from, src: a('paper-move-quick.mp3'), volume: 0.18, durationInFrames: 30 },

  /* the flip — the film's one sweep where the point of view turns (v7) */
  { from: S.flip.from + CUE.flip.flip, src: a('sweep-short.mp3'), volume: 0.3, durationInFrames: 40 },
  { from: S.flip.from + CUE.flip.rise, src: a('swoosh-slow.mp3'), volume: 0.16, durationInFrames: 46 },

  { from: S.network.from, src: a('swoosh-slow.mp3'), volume: 0.2, durationInFrames: 46 },
  { from: S.calls.from, src: a('transition-soft.mp3'), volume: 0.22, durationInFrames: 34 },
  { from: S.knowledge.from, src: a('paper-move-quick.mp3'), volume: 0.2, durationInFrames: 30 },
  { from: S.supply.from, src: a('air-woosh-quick.mp3'), volume: 0.16, durationInFrames: 26 },
  { from: S.supply.from + CUE.supply.lamps, src: a('paper-move-quick.mp3'), volume: 0.14, durationInFrames: 30 },
  { from: S.supply.from + CUE.supply.util, src: a('paper-move-quick.mp3'), volume: 0.14, durationInFrames: 30 },
  { from: S.ask.from, src: a('transition-soft.mp3'), volume: 0.18, durationInFrames: 34 },
  { from: S.ask.from + CUE.ask.customers, src: a('pop.mp3'), volume: 0.12, durationInFrames: 18 },

  /* sign-off: one faint sparkle tail, and that is all */
  { from: S.signoff.from + 28, src: a('sparkle.mp3'), volume: 0.15, durationInFrames: 20 },
];

const BANNED = /riser|impact|whoosh|woosh|sweep|swoosh|bass-hit|stomp/;
for (const s of raw) {
  if (s.from >= TOTAL_V8 - 240 && BANNED.test(s.src)) {
    throw new Error(`sfx8: ${s.src} at ${s.from} is inside the last 8 seconds — owner rule: no whoosh/riser/impact at the end`);
  }
}
export const SFX_V8 = raw;
