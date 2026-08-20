// S9 — everything UVALUX gets, on one wall. Card: wall-reveal-moves A
// `bento-light-up` (ui-entrance/wall-reveal-moves.md), reference implementation
// demos/ui-entrance/wall-reveal-moves/BentoLightUp.tsx.
//
// Kept verbatim from the demo: 20f establish, cells activating on a 12f cascade,
// the amber perimeter drawn in 8f via pathLength=100 + dashoffset, the content
// relaying in 6f later on a back-out so stroke and content never fire together,
// the stroke annealing 1 → 0.4, a sine-hash glow variance per cell (deterministic,
// never Math.random), and the whole wall taking a 1 → 1.04 push once every cell
// is lit, then holding still.
//
// The cells are not a synthetic grid: they are real cutouts from the live product
// — customer health, the peer scoreboard, network rollups, the account table,
// the coaching board, a call card and an evidence tile. The point of the
// shot is quantity: one screen was never going to carry "this is what you get
// across the network".
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import { BODY, T } from '../tokens';

type Cell = { file: string; x: number; y: number; w: number; h: number; label: string };

// laid out on the 1920×1080 frame; every source is a real capture, scaled to fit
const CELLS: Cell[] = [
  { file: 'compass-network-c4.png', x: 104, y: 92, w: 558, h: 99, label: 'where they are' },
  { file: 'compass-network-c1.png', x: 700, y: 92, w: 560, h: 375, label: 'what the network is telling us' },
  { file: 'compass-network-c2.png', x: 1298, y: 92, w: 520, h: 348, label: 'rollup' },
  { file: 'compass-network-c8.png', x: 104, y: 214, w: 558, h: 457, label: 'every account' },
  { file: 'compass-coaching-c1.png', x: 1298, y: 470, w: 520, h: 178, label: 'coaching' },
  { file: 'peers-metrics.png', x: 700, y: 500, w: 560, h: 79, label: 'the scoreboard' },
  { file: 'customers-health-tiles.png', x: 1298, y: 470, w: 520, h: 66, label: 'customer health' },
  { file: 'customers-health-grid.png', x: 1298, y: 558, w: 520, h: 94, label: 'who is slipping' },
  { file: 'callcard1.png', x: 1298, y: 676, w: 520, h: 194, label: 'the call' },
  { file: 'ctile1.png', x: 700, y: 790, w: 550, h: 130, label: 'evidence' },
];

const FIRST = 20;
const GAP = 12;
const LIT_AT = FIRST + (CELLS.length - 1) * GAP + 14;

export const S9Wall: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();

  const push = interpolate(frame, [LIT_AT, LIT_AT + 25], [1, 1.04], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  // a long, slow settle after the wall is complete rather than a hard freeze
  const settle = interpolate(frame, [LIT_AT + 25, duration], [0, 0.03], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const titleLit = interpolate(frame, [FIRST, FIRST + 20], [0.2, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: T.cPaper, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', inset: 0,
          transform: `scale(${push + settle})`, transformOrigin: '960px 520px',
        }}
      >
        {CELLS.map((c, i) => {
          const start = FIRST + i * GAP;
          const draw = interpolate(frame, [start, start + 8], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
          });
          const strokeFade = interpolate(frame, [start + 12, start + 26], [1, 0.4], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
          });
          const lit = interpolate(frame, [start + 6, start + 14], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
          });
          const rise = interpolate(frame, [start + 6, start + 14], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 1.4, 0.5, 1),
          });
          const jitter = Math.abs((Math.sin(i * 127.3) * 43758.5453) % 1);
          const glow = lit * (1 - lit) * 4 * (14 + jitter * 6);

          return (
            <div key={c.file} style={{ position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h }}>
              <div
                style={{
                  opacity: 0.18 + 0.82 * lit,
                  transform: `translateY(${20 * (1 - rise)}px)`,
                  boxShadow: lit > 0.5 ? `0 0 ${glow}px oklch(79% 0.125 78 / ${0.35 * lit * (1 - lit) * 4})` : 'none',
                  borderRadius: 14, overflow: 'hidden',
                }}
              >
                <Img
                  src={staticFile(`textures/${c.file}`)}
                  style={{ width: c.w, height: c.h, display: 'block' }}
                />
              </div>
              {draw > 0 ? (
                <svg
                  width={c.w} height={c.h} viewBox={`0 0 ${c.w} ${c.h}`}
                  style={{ position: 'absolute', left: 0, top: 20 * (1 - rise), overflow: 'visible' }}
                >
                  <rect
                    x={2} y={2} width={c.w - 4} height={c.h - 4} rx={14} fill="none"
                    stroke={T.cAmber} strokeWidth={3}
                    pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - draw)}
                    opacity={strokeFade}
                    style={{ filter: `drop-shadow(0 0 ${6 + jitter * 4}px ${T.cAmber})` }}
                  />
                </svg>
              ) : null}
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute', left: 104, bottom: 62, opacity: titleLit,
            fontFamily: BODY, fontSize: 30, fontWeight: 600, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: T.cInkFaint,
          }}
        >
          Compass · 12 salons, one picture
        </div>
      </div>
    </AbsoluteFill>
  );
};
