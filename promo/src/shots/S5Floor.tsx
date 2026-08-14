// S5 — the room board. Card: wall-reveal-moves B `grid-wave-flip`
// (ui-entrance/wall-reveal-moves.md), reference implementation
// demos/ui-entrance/wall-reveal-moves/GridWaveFlip.tsx.
//
// Kept: one shared perspective on the wall container (one vanishing point for
// the whole board, not one per card), each card double-sided with
// backfaceVisibility hidden and the face pre-rotated 180°, delay = (row+col)*6f
// diagonal wave front, 14f flip on bezier(0.35,0,0.25,1), overshoot to 190° and
// an 8f settle for the LAST card only, sin(angle) shadow lift, and the 90°
// highlight line that rides the格位 rather than the card. Adapted: the wall is
// the real 4×2 Floor board, so the "grey back" is unprinted card stock in the
// product's own paper-2 with its hairline; the flipped face is the real room
// screenshot. Room 2 is the running bed — its countdown ticks with the crossfade
// the product itself uses (DESIGN_SPEC §2.4: seconds digit only).
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { PageCam, CamKey } from '../lib/PageCam';
import { BODY, E, T } from '../tokens';

const PAGE = layout.pages['floor-full'];
const C = PAGE.cutouts;
const ROOMS = [C.room1, C.room2, C.room3, C.room4, C.room5, C.room6, C.room7, C.room8];
const COLS = 4;

const HOLD = 8;   // an empty board held in frame reads as a bug, not a beat
const STAGGER = 5;
const FLIP = 14;
const flipEase = Easing.bezier(0.35, 0, 0.25, 1);
const LAST = ROOMS.length - 1;

const angleAt = (frame: number, i: number): number => {
  const row = Math.floor(i / COLS);
  const col = i % COLS;
  const delay = HOLD + (row + col) * STAGGER;
  if (i !== LAST) {
    return interpolate(frame, [delay, delay + FLIP], [0, 180], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: flipEase,
    });
  }
  const main = interpolate(frame, [delay, delay + FLIP], [0, 190], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: flipEase,
  });
  const settle = interpolate(frame, [delay + FLIP, delay + FLIP + 8], [0, -10], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });
  return main + settle;
};

// board framing: the whole 4×2 grid, then a slow settle push (no shake, Q3)
const GRID = C['floor-grid'];
const CAM_KEYS: CamKey[] = [
  // 1.28 keeps the board full-width and pushes the page's "Find a customer"
  // rail (x >= 1519) outside the frame — at 1.18 it was sliced mid-word
  { frame: 0, cx: GRID.x + GRID.w / 2 - 8, cy: GRID.y + GRID.h / 2, zoom: 1.28 },
  { frame: 96, cx: GRID.x + GRID.w / 2 - 8, cy: GRID.y + GRID.h / 2, zoom: 1.28 },
  // cx 455 puts the right edge of frame in the gap between rooms 3 and 4 rather
  // than through a card, and the left edge on the page margin
  { frame: 130, cx: 455, cy: C.room2.y + C.room2.h / 2 + 6, zoom: 1.42 },
  { frame: 150, cx: 455, cy: C.room2.y + C.room2.h / 2 + 10, zoom: 1.44 },
];

/** The running bed's countdown, re-rendered live over the texture so it ticks.
 *  Only the seconds crossfade — the product's own rule for this element. */
const Countdown: React.FC<{ frame: number }> = ({ frame }) => {
  // 08:12 at shot start, one tick per second of screen time
  const elapsed = Math.floor(Math.max(0, frame - 60) / 30);
  const total = 8 * 60 + 12 - elapsed;
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  const tickPhase = Math.max(0, frame - 60) % 30;
  const secOpacity = interpolate(tickPhase, [0, 3, 6], [0.35, 1, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        // 88px stops exactly short of the baked-in "left" label at x=112 —
        // at 100px this box ate its first letter and the bed read "08:12 eft"
        position: 'absolute', left: 22, top: 72, width: 88, height: 36,
        background: T.card, display: 'flex', alignItems: 'center',
        fontFamily: BODY, fontSize: 31, fontWeight: 600, color: T.ink,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.005em', lineHeight: 1,
      }}
    >
      <span>{mm}:</span>
      <span style={{ opacity: secOpacity }}>{ss}</span>
    </div>
  );
};

export const S5Floor: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      <PageCam src="textures/floor-full.png" pageH={PAGE.pageH} keys={CAM_KEYS} ease={E.camera}>
        {/* paper patches: the board's own empty slots, so the baked-in cards
            never show through underneath a card that is mid-flip */}
        {ROOMS.map((r, i) => (
          <div
            key={`patch${i}`}
            style={{
              position: 'absolute', left: r.x - 2, top: r.y - 2, width: r.w + 4, height: r.h + 4,
              background: T.paper, borderRadius: T.radiusLg + 2,
            }}
          />
        ))}

        {/* one perspective for the whole wall */}
        <div style={{ position: 'absolute', inset: 0, perspective: 1200, perspectiveOrigin: `${GRID.x + GRID.w / 2}px ${GRID.y + GRID.h / 2}px` }}>
          {ROOMS.map((r, i) => {
            const angle = angleAt(frame, i);
            const lift = Math.sin(Math.min(Math.max(angle, 0), 180) * (Math.PI / 180));
            const glow = Math.max(0, 1 - Math.abs(angle - 90) / 45);
            const glowTop = interpolate(angle, [45, 135], [8, 92], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            const isRing = i === 1;
            return (
              <div key={i} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h }}>
                <div
                  style={{
                    position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
                    transform: `rotateX(${angle}deg)`,
                    boxShadow: `0 ${3 + lift * 18}px ${10 + lift * 34}px rgba(46,32,26,${0.05 + lift * 0.12})`,
                    borderRadius: T.radiusLg,
                  }}
                >
                  {/* unprinted card stock, facing out until the wave arrives */}
                  <div
                    style={{
                      position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden', background: T.paper2,
                      border: `1px solid ${T.line}`, borderRadius: T.radiusLg, boxSizing: 'border-box',
                    }}
                  />
                  {/* the real room card */}
                  <div
                    style={{
                      position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(180deg)',
                      borderRadius: T.radiusLg, overflow: 'hidden',
                    }}
                  >
                    <Img
                      src={staticFile(`textures/room${i + 1}.png`)}
                      style={{ width: '100%', height: '100%', display: 'block' }}
                    />
                    {isRing ? <Countdown frame={frame} /> : null}
                  </div>
                </div>
                {glow > 0.01 ? (
                  <div
                    style={{
                      position: 'absolute', left: '4%', width: '92%', top: `${glowTop}%`,
                      height: 3, borderRadius: 2,
                      background:
                        'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%)',
                      boxShadow: '0 0 12px rgba(255,255,255,0.75)',
                      opacity: glow, pointerEvents: 'none',
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </PageCam>
    </AbsoluteFill>
  );
};
