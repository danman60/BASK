// S8 — the network, top to bottom. Compass's Network page is the densest screen
// in either product: the headline count, the health bands, three rollup findings,
// the provincial spread, adoption, and then every account by name. The camera
// descends it in one move and each card takes an amber outline as it arrives.
//
// The lighting grammar is bento-light-up (ui-entrance/wall-reveal-moves.md, A),
// reference demos/ui-entrance/wall-reveal-moves/BentoLightUp.tsx: an amber SVG
// stroke draws the cell's perimeter in 8f (pathLength=100, dashoffset), the
// content lifts and brightens on a 6f delay so the two read as a relay rather
// than a flash, and the stroke then anneals to a quiet 0.4 edge. Applied here to
// the page's REAL card boxes instead of a synthetic 3×2 grid — the card's own
// note says the wall may be any content that is already in place.
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { PageCam, CamKey } from '../lib/PageCam';
import { E, T } from '../tokens';

// The act break used to sit here. It has moved forward onto S8Map — the map is
// now the first UVALUX screen, so it owns the push (bottom-push-stack-wipe is a
// single-seam move: exactly ONE shot may push, which is why this is 0 and not
// another 30). By the time this shot starts the act is already open, so the
// network page simply cuts in.
const PUSH = 0;

const PAGE = layout.pages['compass-network'];
const C = PAGE.cutouts;

// the page's own cards, in reading order down the page
const CELLS = [
  C['compass-network-c1'], C['compass-network-c2'], C['compass-network-c3'],
  C['compass-network-c4'],
  C['compass-network-c5'], C['compass-network-c6'], C['compass-network-c7'],
  C['compass-network-c8'],
].filter(Boolean);

const FIRST = PUSH + 34;
const GAP = 11;

const CAM_KEYS: CamKey[] = [
  { frame: PUSH, cx: 706, cy: 190, zoom: 1.28 }, // "12 salons across the network."
  { frame: PUSH + 40, cx: 706, cy: 240, zoom: 1.24 },
  { frame: PUSH + 120, cx: 706, cy: 600, zoom: 1.02 }, // the bands and the rollups
  { frame: PUSH + 210, cx: 706, cy: 1080, zoom: 0.92 }, // spread and adoption
  { frame: PUSH + 300, cx: 706, cy: 1560, zoom: 0.8 }, // every account, by name
];

export const S8Network: React.FC = () => {
  const frame = useCurrentFrame();
  // PUSH is 0 here now (the act break moved to S8Map), and interpolate throws on
  // a [0, 0] input range — so short-circuit it the way S9Compass already does.
  const inP = PUSH === 0 ? 1 : interpolate(frame, [0, PUSH], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.heavyOut,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: T.cPaper, transform: `translateY(${(1 - inP) * 1080}px)` }}>
      <PageCam src="textures/compass-network.png" pageH={PAGE.pageH} keys={CAM_KEYS} ease={E.camera} surround={T.cPaper}>
        {CELLS.map((r, i) => {
          const start = FIRST + i * GAP;
          const draw = interpolate(frame, [start, start + 8], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
          });
          const strokeFade = interpolate(frame, [start + 12, start + 26], [1, 0.4], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
          });
          if (draw <= 0) return null;
          // per-cell glow variance from a sine hash — deterministic, never random
          const jitter = Math.abs((Math.sin(i * 127.3) * 43758.5453) % 1);
          return (
            <svg
              key={i}
              width={r.w + 4}
              height={r.h + 4}
              viewBox={`0 0 ${r.w + 4} ${r.h + 4}`}
              style={{ position: 'absolute', left: r.x - 2, top: r.y - 2, overflow: 'visible', pointerEvents: 'none' }}
            >
              <rect
                x={2} y={2} width={r.w} height={r.h} rx={14} fill="none"
                stroke={T.cAmber} strokeWidth={3}
                pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - draw)}
                opacity={strokeFade}
                style={{ filter: `drop-shadow(0 0 ${5 + jitter * 4}px ${T.cAmber})` }}
              />
            </svg>
          );
        })}
      </PageCam>
      {inP < 1 ? (
        <div
          style={{
            position: 'absolute', top: -40, left: 0, right: 0, height: 40,
            background: 'linear-gradient(to top, rgba(0,0,0,0.30), rgba(0,0,0,0))',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
