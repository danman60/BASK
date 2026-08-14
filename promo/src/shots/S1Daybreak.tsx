// S1 — Daybreak open. Card: crane-rise-reveal (opening/crane-rise-reveal.md),
// reference implementation demos/opening/crane-rise-reveal/CraneRiseReveal.tsx.
//
// Adaptation: the demo cranes UP from the bottom row of a fake dashboard. Bask's
// establishing fact is the letter at the TOP of Today, so the same one-camera
// move runs downward-and-back — hold tight on the morning brief, then a single
// Easing.out(quad) pull-back until the whole page stands in frame, with each
// attention card pulsing as the widening view first uncovers it. Motion grammar
// (one progress p driving focal point + scale, deceleration, per-row pulse
// triggers solved frame by frame,真静止 at the end) is kept intact.
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { T } from '../tokens';

const PAGE = layout.pages['today-full'];
const PAGE_H = PAGE.pageH;
const C = PAGE.cutouts;

const HOLD = 24; // read the brief before the camera moves (R3)
const MOVE_END = 106; // 82f pull-back
const ease = Easing.out(Easing.quad);

// start: the letter block fills the frame; end: the whole page stands in view
// focal sits below the letter's centre so the app nav bar stays out of the
// opening frame — the film opens on the sentence, not on chrome
const F0 = { x: C.letter.x + C.letter.w / 2, y: C.letter.y + C.letter.h / 2 + 78 };
const F1 = { x: 960, y: 674 };
const S0 = 2.55;
const S1 = 0.8;

export const camAt = (frame: number) => {
  const p = Math.min(1, Math.max(0, (frame - HOLD) / (MOVE_END - HOLD)));
  const e = ease(p);
  const s = S0 + (S1 - S0) * e;
  const fx = F0.x + (F1.x - F0.x) * e;
  const fy = F0.y + (F1.y - F0.y) * e;
  return { s, tx: 960 - fx * s, ty: 540 - fy * s, visBottom: fy + 540 / s };
};

/** The camera's framing at the end of S1 — S2 starts from exactly here, so the
 *  seam between the two shots is one continuous move, not a cut. */
export const S1_END = { cx: F1.x, cy: F1.y, zoom: S1 };

const ROWS = [C.insight1, C.insight2, C.insight3, C.insight4, C.insight5];

// A row pulses the frame its top edge first enters the widening view.
const triggers = ROWS.map((row) => {
  for (let f = HOLD; f <= MOVE_END; f++) {
    if (camAt(f).visBottom >= row.y - 2) return f;
  }
  return MOVE_END;
});

export const S1Daybreak: React.FC = () => {
  const frame = useCurrentFrame();
  const { s, tx, ty } = camAt(frame);

  // dawn: the page starts a touch under-lit and comes up to full paper by the
  // time it is all in frame. One light cue only — no sweeping beam (Q4).
  const dawn = interpolate(frame, [0, 46], [0.34, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: T.paper, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          width: 1920,
          height: PAGE_H,
          transformOrigin: '0 0',
          transform: `translate(${tx}px, ${ty}px) scale(${s})`,
        }}
      >
        <Img
          src={staticFile('textures/today-full.png')}
          style={{ position: 'absolute', width: 1920, height: PAGE_H }}
        />
        {/* the letter, re-laid at 4x so the opening close-up has real glyph
            edges rather than an upsampled 2x page (Q2 texture chain) */}
        <Img
          src={staticFile('textures/letter-4x.png')}
          style={{
            position: 'absolute',
            left: C.letter.x,
            top: C.letter.y,
            width: C.letter.w,
            height: C.letter.h,
            opacity: interpolate(frame, [0, 70], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        />
        {triggers.map((t, i) => {
          const op = interpolate(frame, [t, t + 4, t + 22], [0, 0.14, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          if (op <= 0.002) return null;
          const row = ROWS[i];
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: row.x,
                top: row.y,
                width: row.w,
                height: row.h,
                borderRadius: T.radiusLg,
                background: T.ink,
                opacity: op,
              }}
            />
          );
        })}
      </div>

      {/* dawn scrim: warm, even, no moving light source */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(120% 90% at 42% 26%, rgba(70,50,34,0.06), rgba(52,38,26,0.55) 100%)',
          opacity: dawn,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
