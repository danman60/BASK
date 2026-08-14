// Sound (pipeline phase 6). Every cue is pinned RELATIVE to SHOTS — never a
// bare frame number — so a shot changing length carries the whole table with it
// (sound-design 4.5). Vocabulary is the film one (whoosh / impact / riser /
// sparkle / transition, S1); the only "UI" sample used is `switch-click-quick`,
// a real switch, from the ✅ tier of the sound-design 3.3 audition table.
//
// Volumes are set against measured peaks (all sources here sit between -0.0 and
// -5.7 dBFS, so the 0.2–0.6 band behaves as documented). Long samples get an
// explicit durationInFrames; the two impacts are left to ring out on purpose.
import { Audio, interpolate, Sequence, staticFile } from 'remotion';

import type { Shots } from './timeline';

type Cue = { from: number; src: string; volume: number; durationInFrames?: number; note: string };

// S5's diagonal wave front fires at HOLD + (row+col)*6 inside the shot
const FLOOR_WAVE = [8, 13, 18, 23, 28, 33];
// S6's five rows land at CUES[i] + DUR
const ORDER_LANDINGS = [26, 34, 42, 50, 58].map((c) => c + 18);
// S9's three evidence tiles embed at PUSH + 14 + i*9 + 12 — PUSH is S9Compass's
// own 30f act-break offset, and leaving it out of this table fired every click a
// full second before its tile landed.
const S9_PUSH = 30;
const TILE_EMBEDS = [0, 1, 2].map((i) => S9_PUSH + 14 + i * 9 + 12);

export const buildSfx = (S: Shots): Cue[] => [
  // ── S1 Daybreak ────────────────────────────────────────────────────────────
  { from: S.open.from, src: 'transition-soft.mp3', volume: 0.3, note: 'film opens on the letter' },
  { from: S.open.from + 22, src: 'swoosh-slow.mp3', volume: 0.2, durationInFrames: 84, note: 'the crane pull-back' },

  // ── S2 the insight card ────────────────────────────────────────────────────
  { from: S.hero.from + 44, src: 'air-woosh-quick.mp3', volume: 0.2, note: 'spotlight locks on the card' },
  { from: S.hero.from + 49, src: 'whoosh-big.mp3', volume: 0.38, note: 'card lifts off its slot (sample peaks +21f, so it is pinned early)' },
  { from: S.hero.from + 77, src: 'sparkle.mp3', volume: 0.28, durationInFrames: 72, note: 'perimeter beam, lap 1' },
  { from: S.hero.from + 146, src: 'transition-snap.mp3', volume: 0.34, note: 'card reseats' },

  // ── S3 title card ──────────────────────────────────────────────────────────
  { from: S.titleA.from + 2, src: 'swoosh-quick.mp3', volume: 0.28, note: 'title card in (same sample for both cards)' },

  // ── S4 Studio ──────────────────────────────────────────────────────────────
  { from: S.studio.from + 16, src: 'paper-page-turn.mp3', volume: 0.44, note: 'the card turns over' },
  { from: S.studio.from + 42, src: 'transition-snap.mp3', volume: 0.24, note: 'flip settles on the campaign' },
  { from: S.studio.from + 39, src: 'transition-soft.mp3', volume: 0.24, note: 'the Studio page arrives behind it (sample peaks +13f)' },

  // ── S5 the Floor: six wave fronts, two alternating samples, level ladder ────
  ...FLOOR_WAVE.map((d, i) => ({
    from: S.floor.from + d,
    src: i % 2 === 0 ? 'sweep-short.mp3' : 'wind-swoosh-short.mp3',
    volume: 0.3 - i * 0.028,
    note: `room board wave front ${i + 1}`,
  })),
  { from: S.floor.from + 43, src: 'transition-snap.mp3', volume: 0.22, note: 'last card overshoots and settles' },

  // ── S6 the shelf and the order ─────────────────────────────────────────────
  { from: S.order.from - 13, src: 'transition-soft.mp3', volume: 0.26, note: 'into inventory (sample peaks +13f)' },
  ...ORDER_LANDINGS.map((d, i) => ({
    from: S.order.from + d,
    src: i % 2 === 0 ? 'pop.mp3' : 'pop-electric.mp3',
    volume: 0.4 - i * 0.037,
    note: `shelf row ${i + 1} lands on the stack`,
  })),
  { from: S.order.from + 74, src: 'click-camera.mp3', volume: 0.55, note: 'counter locks on 5 (lands f+76)' },

  // ── S7 title card ──────────────────────────────────────────────────────────
  { from: S.titleB.from + 2, src: 'swoosh-quick.mp3', volume: 0.28, note: 'title card in' },

  // ── S8 consent ─────────────────────────────────────────────────────────────
  { from: S.consent.from - 13, src: 'transition-soft.mp3', volume: 0.22, note: 'into the consent screen (peak-compensated)' },
  { from: S.consent.from + 6, src: 'swoosh-slow.mp3', volume: 0.14, durationInFrames: 62, note: 'low bed under the slow push — the shot was silent without it' },

  // ── act break: Compass shoves Bask out of frame ────────────────────────────
  { from: S.compass.from - 36, src: 'whoosh-big.mp3', volume: 0.42, note: 'the push (sample peaks +21f, lands mid-push)' },
  { from: S.compass.from - 16, src: 'impact-deep-whoosh.mp3', volume: 0.3, note: 'Compass lands (sample peaks +16f)' },

  // ── S9 Compass evidence tiles ──────────────────────────────────────────────
  ...TILE_EMBEDS.map((d, i) => ({
    from: S.compass.from - 30 + d,
    src: 'switch-click-quick.mp3',
    volume: 0.3 - i * 0.04,
    durationInFrames: 14,
    note: `evidence tile ${i + 1} embeds`,
  })),

  // ── S10 outro: the fixed riser → impact → sparkle sentence ─────────────────
  { from: S.outro.from + 34, src: 'riser-cine.mp3', volume: 0.36, durationInFrames: 46, note: 'the group photo assembles; crests into the stamp' },
  { from: S.outro.from + 57, src: 'impact-deep-whoosh.mp3', volume: 0.55, note: 'wordmark stamps at +73 — sample peaks +16f, so pinned at +57. Loudest cue in the film' },
  { from: S.outro.from + 80, src: 'sparkle.mp3', volume: 0.3, durationInFrames: 84, note: 'the sunset rule draws' },
];

/**
 * The client's voiceover (ElevenLabs, "Tessa"), split at its own natural pauses
 * into one clip per script line and pinned to the shot that line belongs to.
 * Frames are relative, so the VO cut's longer shots carry the clips unchanged.
 * Clip lengths come from the split, rounded up a frame or two so nothing truncates.
 */
export const buildVo = (S: Shots): Cue[] => [
  { from: S.open.from + 12, src: 'vo/vo1.mp3', volume: 1, durationInFrames: 92, note: 'This is what a salon owner wakes up to.' },
  { from: S.hero.from + 11, src: 'vo/vo2.mp3', volume: 1, durationInFrames: 150, note: 'Overnight, Bask read yesterday…' },
  { from: S.studio.from + 10, src: 'vo/vo3.mp3', volume: 1, durationInFrames: 228, note: 'Studio turned that into a campaign…' },
  { from: S.floor.from + 12, src: 'vo/vo4.mp3', volume: 1, durationInFrames: 132, note: 'The floor runs live…' },
  { from: S.order.from + 8, src: 'vo/vo5.mp3', volume: 1, durationInFrames: 182, note: 'It counts the shelf…' },
  { from: S.consent.from + 8, src: 'vo/vo6.mp3', volume: 1, durationInFrames: 180, note: 'The salon decides what crosses… (finishes over Compass)' },
  { from: S.compass.from + 90, src: 'vo/vo7.mp3', volume: 1, durationInFrames: 124, note: 'And every UVALUX rep calls…' },
  { from: S.outro.from + 6, src: 'vo/vo8.mp3', volume: 1, durationInFrames: 174, note: 'Bask. The salon runs better…' },
];

/**
 * The client's track, "Open Road". Window starts at 0:43 — the quietest bar in
 * the piece, which then climbs for the next 50s, so the bed's own arc matches
 * the film's. Ducked to 0.13 under the voice.
 */
export const BGM = { src: 'bgm-open-road.mp3', startSec: 43, bed: 0.26, bedUnderVo: 0.13 };

export const Soundtrack: React.FC<{
  bgm: boolean;
  vo?: boolean;
  shots: Shots;
  total: number;
}> = ({ bgm, vo = false, shots, total }) => {
  const bed = vo ? BGM.bedUnderVo : BGM.bed;
  const sfx = buildSfx(shots);
  const voice = vo ? buildVo(shots) : [];
  return (
    <>
      {bgm ? (
        <Audio
          src={staticFile(`audio/${BGM.src}`)}
          startFrom={BGM.startSec * 30}
          volume={(f) =>
            interpolate(f, [0, 30, total - 70, total], [0, bed, bed, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      ) : null}
      {sfx.map((c, i) => (
        <Sequence key={`sfx${i}`} from={c.from} durationInFrames={c.durationInFrames ?? 90}>
          <Audio src={staticFile(`audio/${c.src}`)} volume={c.volume} />
        </Sequence>
      ))}
      {voice.map((c, i) => (
        <Sequence key={`vo${i}`} from={c.from} durationInFrames={c.durationInFrames}>
          <Audio src={staticFile(`audio/${c.src}`)} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
};
