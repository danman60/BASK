// v8 timeline — the full-feature cut, built on the guiding chain (2026-10-03).
//
// Salon side:  DATA → INSIGHT → COACHING → INSTANT ACTION → TRACKING → COMMUNITY
// UVALUX side: VISIBILITY → COACHING OPPORTUNITIES → ANALYTICS
//
// EVERY frame number in this film is derived from the read. Nothing below is a
// hard-coded cut. The import on the next line is the ONLY thing to change when
// the read changes: it points at a `vo-anchors.json`, written by
// `python3 scripts/v8-anchors.py public/audio/vo/<dir>` from that read's
// vo-timing.json plus a Whisper word pass over its beats.
//
//   v8-est    — DEV ONLY, estimated from voiceover.txt (no audio). Never ship.
//   v8-chain  — the chain-order uvaint read (25 beats). The final renders from this.
import VO from '../public/audio/vo/v8-chain/vo-anchors.json';
import H3 from './h3-v8.json';

export const FPS = 30;

type Word = [number, number, string];
type Beat = { id: string; text: string; startFrame: number; durationFrames: number; words: Word[] };
const V = VO as unknown as { dir: string; fps: number; totalFrames: number; beats: Beat[]; estimate?: boolean };

export const VO_SRC = `${V.dir}/vo.mp3`;
export const VO_IS_ESTIMATE = Boolean(V.estimate);
export const VO_BEATS = V.beats;

if (V.beats.length !== 25) throw new Error(`timelineV8: expected 25 beats, the read has ${V.beats.length}`);

const beat = (id: string) => {
  const b = V.beats.find((x) => x.id === id);
  if (!b) throw new Error(`timelineV8: no beat ${id}`);
  return b;
};
const end = (b: Beat) => b.startFrame + b.durationFrames;
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Index of the nth word in a beat matching q (prefix match; "=x" for exact). */
const wordIx = (id: string, q: string, nth = 1) => {
  const b = beat(id);
  const exact = q.startsWith('=');
  const qq = norm(exact ? q.slice(1) : q);
  let seen = 0;
  for (let i = 0; i < b.words.length; i++) {
    const w = norm(b.words[i][2]);
    if (exact ? w === qq : w.startsWith(qq)) {
      seen++;
      if (seen === nth) return i;
    }
  }
  throw new Error(`timelineV8: anchor "${q}"#${nth} not heard in ${id}: ${b.words.map((w) => w[2]).join(' ')}`);
};
/** Absolute frame a word starts. */
const at = (id: string, q: string, nth = 1) => Math.round(beat(id).words[wordIx(id, q, nth)][0]);
/** Absolute frame of the breath before a word: midpoint of the gap to the previous word. */
const before = (id: string, q: string, nth = 1) => {
  const b = beat(id);
  const i = wordIx(id, q, nth);
  if (i === 0) return b.startFrame;
  return Math.round((b.words[i - 1][1] + b.words[i][0]) / 2);
};

/* ------------------------------------------------------------ the shot list */
export const ORDER = [
  'open', 'chain', 'sync', 'read', 'chart', 'health', 'recovery', 'listen', 'team', 'method',
  'bottle', 'flag', 'action', 'actions', 'measured', 'opens', 'community', 'consent', 'flip',
  'network', 'calls', 'knowledge', 'supply', 'ask', 'signoff',
] as const;
export type ShotV8 = (typeof ORDER)[number];

/** Each shot owns one paragraph; it starts in the breath before its first word. */
const starts = V.beats.map((b, i) => (i === 0 ? 0 : Math.round((end(V.beats[i - 1]) + b.startFrame) / 2)));
const lastWord = end(V.beats[V.beats.length - 1]);
/** ~1.5s of silence after the last word, same as v7. */
export const TOTAL_V8 = lastWord + 45;

export const SHOTS_V8 = Object.fromEntries(
  ORDER.map((k, i) => [k, { from: starts[i], duration: (i + 1 < starts.length ? starts[i + 1] : TOTAL_V8) - starts[i], beat: V.beats[i].id }]),
) as Record<ShotV8, { from: number; duration: number; beat: string }>;

const S = SHOTS_V8;
const L = (shot: ShotV8, abs: number) => abs - S[shot].from; // absolute → shot-local

/* ------------------------------------------------------------- H3 b-roll */
type Clip = { src: string; seconds: number; frames30: number } | null;
const CLIPS = H3 as unknown as Record<string, Clip>;
/**
 * A b-roll slot of `planned` frames. Returns null when the clip is missing (the
 * slot then belongs to the next product plate, held from frame 0). A clip that
 * is shorter than its slot is slowed to at most 0.8x; if that still is not
 * enough the slot shortens and the plate comes in early. Never a black frame.
 */
const slot = (name: string, planned: number) => {
  const c = CLIPS[name];
  if (!c) return null;
  const rate = Math.max(0.8, Math.min(1, c.frames30 / planned));
  const frames = Math.min(planned, Math.floor(c.frames30 / rate) - 1);
  return { src: c.src, rate, frames };
};
export const FALLBACKS: string[] = [];
const bslot = (name: string, planned: number) => {
  const s = slot(name, planned);
  if (!s) FALLBACKS.push(name);
  return s;
};

/* ---------------------------------------------- per-shot cues (local frames) */
const b = (shot: ShotV8) => S[shot].beat;

const openRoll = bslot('open', L('open', before(b('open'), 'when')));
const listenRoll = bslot('listen', L('listen', before(b('listen'), '=every')));
const frontRoll = bslot(
  'frontdesk',
  L('actions', before(b('actions'), 'Eighty')) - L('actions', before(b('actions'), '=and')),
);
const repRoll = bslot('rep', L('calls', before(b('calls'), 'They')));
const ownerRoll = bslot('owner-review', L('measured', before(b('measured'), 'Not')));

export const CUE = {
  open: { roll: openRoll, title: openRoll ? openRoll.frames : 0 },
  chain: {
    // one node per link, lit on the word that names it
    nodes: [
      L('chain', at(b('chain'), 'numbers')),
      L('chain', at(b('chain'), 'insight')),
      L('chain', at(b('chain'), 'coaching')),
      L('chain', at(b('chain'), 'click')),
      L('chain', at(b('chain'), 'tracked')),
      L('chain', at(b('chain'), 'shared')),
    ],
  },
  sync: { card: L('sync', before(b('sync'), '=and')) },
  chart: { cut: L('chart', before(b('chart'), 'Traffic')) },
  health: {
    bands: L('health', before(b('health'), "who's")),
    lit: [
      L('health', at(b('health'), 'healthy')),
      L('health', at(b('health'), 'slipping')),
      L('health', at(b('health'), 'gone')),
    ],
    minutes: L('health', before(b('health'), '=and')),
  },
  recovery: { seven: L('recovery', at(b('recovery'), 'Seven')), recoverable: L('recovery', at(b('recovery'), 'recoverable')) },
  listen: {
    roll: listenRoll,
    pledge: L('listen', at(b('listen'), 'consent')),
    conv: L('listen', before(b('listen'), '=every')),
    scores: [
      L('listen', at(b('listen'), 'greeting')),
      L('listen', at(b('listen'), 'question')),
      L('listen', at(b('listen'), 'product')),
      L('listen', at(b('listen'), 'membership')),
      L('listen', at(b('listen'), 'clo')),
    ],
  },
  team: {
    improving: L('team', at(b('team'), 'improving')),
    hand: L('team', at(b('team'), 'needs')),
    peers: L('team', before(b('team'), '=and', 2)),
    rank: L('team', at(b('team'), 'rank')),
  },
  bottle: {
    card: L('bottle', before(b('bottle'), 'Maya')),
    deal: L('bottle', before(b('bottle'), 'Now')),
  },
  flag: { why: L('flag', at(b('flag'), 'hear')) },
  action: { cut: L('action', before(b('action'), '=you', 2)) },
  actions: {
    note: L('actions', at(b('actions'), 'note')),
    message: L('actions', before(b('actions'), '=a', 2)),
    roll: frontRoll,
    walk: L('actions', before(b('actions'), '=and')),
    card: L('actions', before(b('actions'), 'Eighty')),
    eighty: L('actions', at(b('actions'), 'Eighty')),
    lotion: L('actions', at(b('actions'), 'lotion')),
  },
  measured: {
    roll: ownerRoll,
    odo: L('measured', before(b('measured'), 'Not')),
    card: L('measured', before(b('measured'), 'next')),
  },
  consent: { preview: L('consent', before(b('consent'), '=you', 1)), back: L('consent', at(b('consent'), 'take')) },
  flip: { flip: L('flip', at(b('flip'), 'opposite')) - 4, rise: L('flip', at(b('flip'), 'sees')) },
  calls: { roll: repRoll },
  supply: { lamps: L('supply', before(b('supply'), 'Lamp')), util: L('supply', before(b('supply'), 'Busy')) },
  ask: { customers: L('ask', at(b('ask'), '=one')) },
};

/* --------------------------------------------------------------- the chain */
export const SALON_CHAIN = ['Data', 'Insight', 'Coaching', 'Instant action', 'Tracking', 'Community'] as const;
export const UVALUX_CHAIN = ['Visibility', 'Coaching opportunities', 'Analytics'] as const;

/** Which link of which chain each shot belongs to (the corner strip). */
export const CHAPTER: Partial<Record<ShotV8, { side: 'salon' | 'uvalux'; link: number }>> = {
  sync: { side: 'salon', link: 0 },
  read: { side: 'salon', link: 0 },
  chart: { side: 'salon', link: 1 },
  health: { side: 'salon', link: 1 },
  recovery: { side: 'salon', link: 1 },
  listen: { side: 'salon', link: 1 },
  team: { side: 'salon', link: 1 },
  method: { side: 'salon', link: 2 },
  bottle: { side: 'salon', link: 2 },
  flag: { side: 'salon', link: 2 },
  action: { side: 'salon', link: 3 },
  actions: { side: 'salon', link: 3 },
  measured: { side: 'salon', link: 4 },
  opens: { side: 'salon', link: 4 },
  community: { side: 'salon', link: 5 },
  network: { side: 'uvalux', link: 0 },
  calls: { side: 'uvalux', link: 1 },
  knowledge: { side: 'uvalux', link: 1 },
  supply: { side: 'uvalux', link: 2 },
};

/* --------------------------------------------------------------- the music */
// bgm-open-road.mp3 is 182.26s and this film is longer, so the bed is played in
// two passes spliced ONCE, on a chapter change (a new link in the chain, where a
// soft transition already covers the seam): the latest chapter start that pass
// A reaches before the track's outro (~172s). Pass A runs from the track's top;
// pass B is placed so the track's own ending lands under the sign-off. The jump
// back is rounded to whole bars (123.05 bpm, measured by onset autocorrelation)
// so the downbeat grid continues across the seam.
const TRACK_END = 181.6; // the track's natural tail is ~-42 dB from 180s
const A_LIMIT = 172; // pass A must splice before the outro starts fading
const BAR = (4 * 60) / 123.05;
const CHAPTER_STARTS: ShotV8[] = ['chart', 'method', 'action', 'measured', 'community', 'consent', 'flip', 'network', 'calls', 'supply'];
const fits = CHAPTER_STARTS.filter((k) => S[k].from / FPS <= A_LIMIT);
const splice = TOTAL_V8 / FPS <= TRACK_END ? TOTAL_V8 : S[fits[fits.length - 1] ?? 'chart'].from;
const aPos = splice / FPS; // where pass A is in the track at the splice
const needB = (TRACK_END * FPS - (TOTAL_V8 - splice)) / FPS; // latest start for pass B
const jump = splice >= TOTAL_V8 ? 0 : Math.max(0, Math.ceil((aPos - needB) / BAR) * BAR);
export const MUSIC = {
  splice,
  spliceShot: ORDER.find((k) => S[k].from === splice) ?? 'none',
  aFromSec: 0,
  bFromSec: aPos - jump, // B plays from track position (aPos - jump) on the splice frame
  jumpSec: jump,
  xfade: 18,
  spliced: jump > 0,
};

/** Speech regions (absolute), short gaps merged, for ducking the bed. */
export const SPEECH: [number, number][] = (() => {
  const r: [number, number][] = [];
  for (const bt of V.beats) {
    const s = bt.startFrame;
    const e = end(bt);
    if (r.length && s - r[r.length - 1][1] < 24) r[r.length - 1][1] = e;
    else r.push([s, e]);
  }
  return r;
})();
