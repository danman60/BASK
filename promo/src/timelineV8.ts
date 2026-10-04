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
import VO from '../public/audio/vo/v8-h/vo-anchors.json';
import CORPUS from '../public/corpus/v8/clips.json';
import H3 from './h3-v8.json';

export const FPS = 30;

type Word = [number, number, string, number?]; // [start, end, word, quietest frame before it]
type Beat = { id: string; text: string; startFrame: number; durationFrames: number; words: Word[] };
const V = VO as unknown as { dir: string; fps: number; totalFrames: number; beats: Beat[]; estimate?: boolean };

export const VO_SRC = `${V.dir}/vo.mp3`;
export const VO_IS_ESTIMATE = Boolean(V.estimate);
export const VO_BEATS = V.beats;

/* ------------------------------------------------------------ the shot list */
// Pass 3 (2026-10-03): the consent paragraph and its shot are gone — Community
// goes straight to the flip. Pass 4: `bridge` ("Bask finds the line that fits
// your problem...") follows the speakers. One paragraph per shot, 25 of each.
export const ORDER = [
  'open', 'chain', 'sync', 'read', 'chart', 'health', 'recovery', 'listen', 'team', 'method',
  'bridge', 'bottle', 'flag', 'action', 'actions', 'measured', 'opens', 'community', 'flip',
  'network', 'calls', 'knowledge', 'supply', 'ask', 'signoff',
] as const;
export type ShotV8 = (typeof ORDER)[number];

if (V.beats.length !== ORDER.length) throw new Error(`timelineV8: expected ${ORDER.length} beats, the read has ${V.beats.length}`);

const beat = (id: string) => {
  const b = V.beats.find((x) => x.id === id);
  if (!b) throw new Error(`timelineV8: no beat ${id}`);
  return b;
};
const beatOf = (shot: ShotV8) => V.beats[ORDER.indexOf(shot)].id;
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
// ---- the same anchors in READ time (frames of vo.mp3), before any gaps
const atV = (id: string, q: string, nth = 1) => Math.round(beat(id).words[wordIx(id, q, nth)][0]);
const beforeV = (id: string, q: string, nth = 1) => {
  const b = beat(id);
  const i = wordIx(id, q, nth);
  if (i === 0) return b.startFrame;
  return Math.round(b.words[i][3] ?? (b.words[i - 1][1] + b.words[i][0]) / 2);
};
const startsV = V.beats.map((b, i) => (i === 0 ? 0 : Math.round((end(V.beats[i - 1]) + b.startFrame) / 2)));
// The recovery screen must be up BEFORE "Seven memberships failed to pay" —
// the minutes card before it also shows a 7, and a cut in the breath let the
// two sevens blur together (pass-4 gate). Lead it by half a second.
{
  const r = ORDER.indexOf('recovery');
  startsV[r] = Math.min(startsV[r], V.beats[r].startFrame - 15);
}

/* ------------------------------------------------- holes in the narration
 * Two places where the narrator stops and the picture talks:
 *  1. SPEAKERS — in the method paragraph, after "...somebody actually said on a
 *     stage", the training speakers themselves, their own audio up. Narration
 *     resumes "about this exact problem" on the citation page.
 *  2. MESSAGES — at the end of the action paragraph ("Nothing leaves without
 *     you."), the text, the email and the post the app wrote, shown in turn.
 * The read is never sped up or cut: it is split at these frames and the rest of
 * it plays later. Every film frame below is mapped through the holes. */
type CClip = { file: string; duration_s: number; text: string; event: string };
const corpus = (CORPUS as unknown as { clips: CClip[] }).clips;
const cclip = (f: string) => {
  const c = corpus.find((x) => x.file === f);
  if (!c) throw new Error(`timelineV8: corpus clip ${f} missing`);
  return { src: `corpus/v8/${f}`, frames: Math.floor(c.duration_s * FPS) - 1, text: c.text, event: c.event, year: c.event.includes('2026') ? 2026 : 2025 };
};
// A03 is excluded on purpose (it says "jerks").
export const MONTAGE = ['A08.mp4', 'A01.mp4', 'A02.mp4', 'A04.mp4', 'B04.mp4'].map(cclip);
const MONTAGE_LEAD = 8; // a breath of picture before the first speaker
const MONTAGE_LEN = MONTAGE_LEAD + MONTAGE.reduce((n, c) => n + c.frames, 0) + 6;
const MESSAGES_LEN = 246;

// Pass 5: the narrator finishes her sentence ("...on a stage about this exact
// problem.") before the speakers start — the hole sits at the end of the method
// paragraph, and the bridge line plays after them over the citation.
const gapSpeakers = startsV[ORDER.indexOf('bridge')];
const gapMessages = startsV[ORDER.indexOf('actions')];
// Pass 5: the listen b-roll (the front desk with its sign) holds 4.7s. The
// narration pauses after "And the front desk listens." for whatever the read
// does not already give it.
const LISTEN_ROLL = 140;
const listenEvery = beforeV(beatOf('listen'), '=every');
const gapListen = Math.max(0, LISTEN_ROLL - (listenEvery - startsV[ORDER.indexOf('listen')]));
export const GAPS = [
  { name: 'listen', at: listenEvery, len: gapListen },
  { name: 'speakers', at: gapSpeakers, len: MONTAGE_LEN },
  { name: 'messages', at: gapMessages, len: MESSAGES_LEN },
].sort((x, y) => x.at - y.at);
/** read frame → film frame (a frame AT a hole plays after it) */
const map = (v: number) => v + GAPS.filter((g) => g.at <= v).reduce((n, g) => n + g.len, 0);
/** film frame where a hole begins */
const holeAt = (name: string) => {
  const g = GAPS.find((x) => x.name === name)!;
  return map(g.at) - g.len;
};
/** The read, in playable pieces: [readFrom, readTo) placed at film frame `at`. */
export const VO_SEGMENTS = (() => {
  const cuts = [0, ...GAPS.map((g) => g.at), V.totalFrames + 2];
  return cuts.slice(0, -1).map((c, i) => ({ from: c, to: cuts[i + 1], at: map(c) }));
})();

const at = (id: string, q: string, nth = 1) => map(atV(id, q, nth));
const before = (id: string, q: string, nth = 1) => map(beforeV(id, q, nth));

/** Each shot owns one paragraph; it starts in the breath before its first word. */
const starts = startsV.map(map);
const lastWord = map(end(V.beats[V.beats.length - 1]));
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
  open: { roll: openRoll, title: openRoll ? openRoll.frames : 0, logo: L('open', at(b('open'), 'Built')) - (openRoll ? openRoll.frames : 0) },
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
    // the growth payoff: "So the same customers come back more often, and spend more..."
    payoff: L('chain', before(b('chain'), '=so')),
    visits: L('chain', at(b('chain'), 'often')),
    spend: L('chain', at(b('chain'), 'spend')),
  },
  sync: { card: L('sync', before(b('sync'), '=and', 2)) },
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
    pledge: L('listen', at(b('listen'), 'listens')),
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
  action: {
    // Today's text sheet → the press → the real toast → (hole) email, post, phone
    press: L('action', at(b('action'), 'send')),
    toast: L('action', before(b('action'), 'Nothing')),
    messages: L('action', holeAt('messages')),
  },
  method: {
    speakers: L('method', holeAt('speakers')),
    lead: MONTAGE_LEAD,
    resume: L('method', holeAt('speakers')) + MONTAGE_LEN,
  },
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
  bridge: { side: 'salon', link: 2 },
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
const CHAPTER_STARTS: ShotV8[] = ['chart', 'method', 'action', 'measured', 'community', 'flip', 'network', 'calls', 'supply'];
const B_MIN = 15; // pass B must not start in the track's quiet intro
const inRange = (k: ShotV8) => S[k].from / FPS <= A_LIMIT && S[k].from / FPS >= TOTAL_V8 / FPS - (TRACK_END - B_MIN);
const fitsCh = CHAPTER_STARTS.filter(inRange);
const fitsAny = ORDER.filter(inRange);
const pick = fitsCh[fitsCh.length - 1] ?? fitsAny[fitsAny.length - 1];
if (TOTAL_V8 / FPS > TRACK_END && !pick) throw new Error('timelineV8: film too long for one splice of the bed');
const splice = TOTAL_V8 / FPS <= TRACK_END ? TOTAL_V8 : S[pick].from;
const aPos = splice / FPS; // where pass A is in the track at the splice
const needB = (TRACK_END * FPS - (TOTAL_V8 - splice)) / FPS; // latest start for pass B
const jump = splice >= TOTAL_V8 ? 0 : Math.max(0, Math.ceil((aPos - needB) / BAR) * BAR);
if (aPos - jump < 0) throw new Error('timelineV8: bed pass B would start before the track');
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
    const s = map(bt.startFrame);
    const e = map(end(bt));
    if (r.length && s - r[r.length - 1][1] < 24) r[r.length - 1][1] = e;
    else r.push([s, e]);
  }
  return r;
})();
