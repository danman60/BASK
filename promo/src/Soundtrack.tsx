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

import { MAP_LANDINGS_REL } from './shots/S8Map';
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
// S8Map exports its own landing frames, so this table cannot drift from the
// picture. They are shot-relative and the shot is placed 30f before S.map.from
// to carry the act-break push, hence the -30; +10 is the sample's own peak lag.
const MAP_LANDINGS = MAP_LANDINGS_REL.map((f) => f - 30 + 10);
const TILE_EMBEDS = [0, 1, 2].map((i) => S9_PUSH + 14 + i * 9 + 12);

export const buildSfx = (S: Shots): Cue[] => [
  // ── S0 the opening statement ───────────────────────────────────────────────
  { from: S.brand.from, src: 'transition-soft.mp3', volume: 0.26, note: 'film opens' },
  { from: S.brand.from + 30, src: 'sparkle.mp3', volume: 0.22, durationInFrames: 60, note: 'the sunset rule draws under the wordmark' },

  // ── S1 Daybreak ────────────────────────────────────────────────────────────
  { from: S.open.from - 13, src: 'transition-soft.mp3', volume: 0.3, note: 'hand-off to the morning brief (peaks +13f)' },
  { from: S.open.from + 22, src: 'swoosh-slow.mp3', volume: 0.2, durationInFrames: 84, note: 'the crane pull-back' },

  // ── S2 the insight card ────────────────────────────────────────────────────
  { from: S.hero.from + 44, src: 'air-woosh-quick.mp3', volume: 0.2, note: 'spotlight locks on the card' },
  { from: S.hero.from + 49, src: 'whoosh-big.mp3', volume: 0.38, note: 'card lifts off its slot (sample peaks +21f, so it is pinned early)' },
  { from: S.hero.from + 77, src: 'sparkle.mp3', volume: 0.28, durationInFrames: 72, note: 'perimeter beam, lap 1' },
  { from: S.hero.from + 146, src: 'transition-snap.mp3', volume: 0.34, note: 'card reseats' },

  // ── the one remaining title card ───────────────────────────────────────────
  { from: S.titleA.from + 2, src: 'swoosh-quick.mp3', volume: 0.28, note: 'title card in' },

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

  // ── the front desk: typing is the one action that must have its own foley ──
  { from: S.checkin.from + 26, src: 'keyboard.mp3', volume: 0.32, durationInFrames: 26, note: 'typing the name (long sample, cut to the action)' },
  { from: S.checkin.from + 84, src: 'click-camera.mp3', volume: 0.5, note: 'picking the customer' },
  { from: S.checkin.from + 92, src: 'transition-soft.mp3', volume: 0.22, note: 'their card arrives' },

  // ── the till: two punches, the second lighter ──────────────────────────────
  { from: S.pos.from + 40, src: 'whoosh-fast.mp3', volume: 0.34, note: 'crash-zoom onto the first product' },
  { from: S.pos.from + 52, src: 'click-camera.mp3', volume: 0.45, note: 'scanned — into the cart' },
  { from: S.pos.from + 92, src: 'whoosh-fast.mp3', volume: 0.26, note: 'second punch, softer' },
  { from: S.pos.from + 104, src: 'click-camera.mp3', volume: 0.38, note: 'scanned again' },
  { from: S.pos.from + 128, src: 'transition-soft.mp3', volume: 0.24, note: 'out to the till' },

  // ── S6 the shelf and the order ─────────────────────────────────────────────
  { from: S.order.from - 13, src: 'transition-soft.mp3', volume: 0.26, note: 'into inventory (sample peaks +13f)' },
  ...ORDER_LANDINGS.map((d, i) => ({
    from: S.order.from + d,
    src: i % 2 === 0 ? 'pop.mp3' : 'pop-electric.mp3',
    volume: 0.4 - i * 0.037,
    note: `shelf row ${i + 1} lands on the stack`,
  })),
  { from: S.order.from + 74, src: 'click-camera.mp3', volume: 0.55, note: 'counter locks on 5 (lands f+76)' },

  // ── act break: Compass shoves Bask out of frame ────────────────────────────
  // The push moved onto the MAP with the shot that owns it (S8Map, PUSH = 30);
  // the map's Sequence starts 30f before S.map.from, so the seam is still at
  // S.map.from and these two keep their relationship to it.
  { from: S.map.from - 36, src: 'whoosh-big.mp3', volume: 0.42, note: 'the push (sample peaks +21f, lands mid-push)' },
  { from: S.map.from - 16, src: 'impact-deep-whoosh.mp3', volume: 0.3, note: 'Compass lands (sample peaks +16f)' },

  // ── S8 the map: one soft tick per studio as it lands, west to east ─────────
  ...MAP_LANDINGS.map((d, i) => ({
    from: S.map.from + d,
    src: i % 2 === 0 ? 'sweep-short.mp3' : 'wind-swoosh-short.mp3',
    volume: 0.22 - i * 0.011,
    note: `studio ${i + 1} lands on the map`,
  })),
  { from: S.map.from + 222, src: 'sparkle.mp3', volume: 0.24, durationInFrames: 76, note: 'the last studio is down — the network is complete' },
  { from: S.network.from - 13, src: 'transition-soft.mp3', volume: 0.26, note: 'map hands over to the page (sample peaks +13f)' },

  // ── S9 Compass evidence tiles ──────────────────────────────────────────────
  ...TILE_EMBEDS.map((d, i) => ({
    from: S.compass.from + d - 30,
    src: 'switch-click-quick.mp3',
    volume: 0.3 - i * 0.04,
    durationInFrames: 14,
    note: `evidence tile ${i + 1} embeds`,
  })),

  // ── the analytics wall: one soft tick per cell as it lights, laddered ──────
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
    from: S.wall.from + 20 + i * 12,
    src: i % 2 === 0 ? 'sweep-short.mp3' : 'wind-swoosh-short.mp3',
    volume: 0.24 - i * 0.016,
    note: `wall cell ${i + 1} lights`,
  })),
  { from: S.wall.from + 118, src: 'sparkle.mp3', volume: 0.26, durationInFrames: 70, note: 'the wall completes' },

  // ── S10 outro: the fixed riser → impact → sparkle sentence ─────────────────
  { from: S.outro.from + 34, src: 'riser-cine.mp3', volume: 0.36, durationInFrames: 46, note: 'the group photo assembles; crests into the stamp' },
  { from: S.outro.from + 57, src: 'impact-deep-whoosh.mp3', volume: 0.3, note: 'wordmark stamps at +73 — sample peaks +16f, so pinned at +57. Was 0.55 and read as a giant whoosh over the sign-off; the riser already carries the crest' },
  { from: S.outro.from + 80, src: 'sparkle.mp3', volume: 0.3, durationInFrames: 84, note: 'the sunset rule draws' },
];

/**
 * The client's voiceover (ElevenLabs, "Tessa"), split at its own natural pauses
 * into one clip per script line and pinned to the shot that line belongs to.
 * Frames are relative, so the VO cut's longer shots carry the clips unchanged.
 * Clip lengths come from the split, rounded up a frame or two so nothing truncates.
 */
export const buildVo = (S: Shots): Cue[] => [
  // A, B and C are the NEW lines (see VO-SCRIPT.md §1). Until the takes land,
  // voA/voB/voC are silent files of the estimated length, so the picture is cut
  // to the right shape and the real takes drop straight in.
  { from: S.brand.from + 12, src: 'vo/voA.mp3', volume: 1, durationInFrames: 116, note: 'A — what Bask is (3.8s)' },
  { from: S.open.from + 14, src: 'vo/voB.mp3', volume: 1, durationInFrames: 228, note: 'B — less friction for the customer, less work for the owner' },
  { from: S.hero.from + 11, src: 'vo/vo2.mp3', volume: 1, durationInFrames: 150, note: 'Overnight, Bask read yesterday…' },
  { from: S.floor.from + 12, src: 'vo/vo4.mp3', volume: 1, durationInFrames: 132, note: 'The floor runs live…' },
  { from: S.checkin.from + 20, src: 'vo/voD.mp3', volume: 1, durationInFrames: 258, note: 'D — the front desk (8.45s)' },
  { from: S.pos.from + 20, src: 'vo/voE.mp3', volume: 1, durationInFrames: 276, note: 'E — the till (9.04s)' },
  { from: S.order.from + 8, src: 'vo/vo5.mp3', volume: 1, durationInFrames: 182, note: 'It counts the shelf…' },
  { from: S.studio.from + 308, src: 'vo/voC.mp3', volume: 1, durationInFrames: 256, note: 'C — and most of all, UVALUX gets the data (8.4s, lands ON the act break into Compass)' },
  { from: S.compass.from + 20, src: 'vo/vo7.mp3', volume: 1, durationInFrames: 124, note: 'And every UVALUX rep calls…' },
  { from: S.studio.from + 10, src: 'vo/vo3.mp3', volume: 1, durationInFrames: 296, note: 'Studio turns a quiet Tuesday into a campaign… (re-recorded, self-contained)' },
  { from: S.network.from + 6, src: 'vo/voG.mp3', volume: 1, durationInFrames: 281, note: 'G — every salon on one page, and what to do about it (9.35s take, 2026-08-14)' },
  { from: S.wall.from + 8, src: 'vo/voF.mp3', volume: 1, durationInFrames: 261, note: 'F — every signal points at something a rep can do on Monday (8.67s take, 2026-08-14)' },
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
