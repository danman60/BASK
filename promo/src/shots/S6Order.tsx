// S6 — the shelf counts itself and the UVALUX order writes itself.
// Card: list-stack-press (ui-entrance/list-stack-press.md), reference
// implementation template/src/aifl/live/ScenePapers.tsx.
//
// Kept: CUES 12f apart with a 22f flight on bezier(0.45,0.05,0.25,1.12),
// alternating ±2° entry tilt collapsing to flat, scale 1.06→1, the settled stack
// pressed 6px and springing back on each later arrival (the weight), shadow
// collapsing from airborne to seated, paper patches so the baked-in rows do not
// ghost through, one glaze sweep over the whole stack at the end (never per
// card, Q4), a DigitRoll counter keyed to the landed count, and the camera
// following the stack.
//
// Framing note: the camera never rises above y≈360 on this page. The three stat
// tiles at the top carry a DERIVED retail figure (Bask's markup on UVALUX
// wholesale) — out of frame on purpose, per the promo brief.
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { DigitRoll } from '../lib/DigitRoll';
import { PageCam, CamKey } from '../lib/PageCam';
import { BODY, E, T } from '../tokens';

const PAGE = layout.pages['inventory-full'];
const C = PAGE.cutouts;
const ROWS = [C.shelfrow1, C.shelfrow2, C.shelfrow3, C.shelfrow4, C.shelfrow5];
const FILES = ['shelfrow1.png', 'shelfrow2.png', 'shelfrow3.png', 'shelfrow4.png', 'shelfrow5.png'];

// Rows start arriving while the camera is still on the reorder card, so the
// board is already half-filled when the camera gets there — an empty table body
// held in frame for three seconds reads as a loading bug, not as an entrance.
const CUES = [26, 34, 42, 50, 58];
const DUR = 18;
const FLY_EASE = Easing.bezier(0.45, 0.05, 0.25, 1.12);
const TILTS = [2, -2, 2, -2, 2];

const CAM_KEYS: CamKey[] = [
  // Framed on the LEFT of the reorder card — the product, the count and the
  // reason. The stat tiles above (derived retail) and the price column to the
  // right are both outside the frame, per the promo brief.
  { frame: 0, cx: 745, cy: 690, zoom: 1.62 },
  { frame: 26, cx: 745, cy: 690, zoom: 1.62 },
  { frame: 64, cx: 960, cy: 1240, zoom: 1.24 }, // down to the shelf, rows already landing
  { frame: 108, cx: 960, cy: 1330, zoom: 1.18 },
  { frame: 145, cx: 960, cy: 1330, zoom: 1.18 },
];

export const S6Order: React.FC = () => {
  const frame = useCurrentFrame();
  const landedCount = CUES.filter((c) => frame >= c + DUR).length;

  const stackPress = (settledIndex: number) => {
    let press = 0;
    for (let j = settledIndex + 1; j < CUES.length; j++) {
      const cue = CUES[j];
      const p = interpolate(frame, [cue, cue + 4, cue + 8], [0, 6, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      });
      press = Math.max(press, p);
    }
    return press;
  };

  // Anticipation beat, but held until the camera has left the reorder card:
  // both page framings have copy in the corner where this used to sit, and the
  // two sets of words interleaved.
  const counterIn = interpolate(frame, [46, 56], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.easeOut,
  });
  const counterScale = interpolate(frame, [46, 56], [0.96, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.easeOut,
  });

  const glazeX = interpolate(frame, [88, 102], [-700, 2600], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.35, 1),
  });
  const glazeVis = interpolate(frame, [87, 92, 98, 101], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      <PageCam src="textures/inventory-full.png" pageH={PAGE.pageH} keys={CAM_KEYS} ease={E.camera}>
        {ROWS.map((r, i) => (
          <div
            key={`slot${i}`}
            style={{
              position: 'absolute', left: r.x - 6, top: r.y - 4, width: r.w + 12, height: r.h + 8,
              background: T.card,
              opacity: frame >= CUES[i] + DUR - 2 ? 0 : 1,
            }}
          />
        ))}

        {ROWS.map((r, i) => {
          const cue = CUES[i];
          const t = interpolate(frame, [cue, cue + DUR], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: FLY_EASE,
          });
          if (t <= 0) return null;
          const settled = t >= 0.999;
          const dy = 600 * (1 - t) + (settled ? stackPress(i) : 0);
          const rot = TILTS[i] * (1 - t);
          const scale = 1.06 - 0.06 * t;
          const shadow = settled
            ? '0 2px 8px rgba(46,32,26,.10)'
            : `0 32px 64px rgba(46,32,26,${0.2 * (1 - t) + 0.06})`;
          return (
            <div
              key={FILES[i]}
              style={{
                position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h,
                transform: `translateY(${dy}px) rotate(${rot}deg) scale(${scale})`,
                transformOrigin: 'center center',
                boxShadow: shadow, borderRadius: 12,
              }}
            >
              <Img
                src={staticFile(`textures/${FILES[i]}`)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
              />
              {/* the card's linked highlight: a secondary action that follows the
                  landing by 3f rather than sharing its frame — 7f grow, 5f fade */}
              {(() => {
                const hlStart = cue + DUR + 3;
                const grow = interpolate(frame, [hlStart, hlStart + 7], [0, 1], {
                  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
                });
                const fade = interpolate(frame, [hlStart + 7, hlStart + 12], [1, 0], {
                  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                });
                if (grow <= 0 || fade <= 0) return null;
                return (
                  <div
                    style={{
                      position: 'absolute', left: 18, top: r.h * 0.72,
                      width: `${grow * 40}%`, height: 22,
                      background: T.primaryWash, opacity: 0.75 * fade,
                      borderRight: `2px solid ${T.primary}`, pointerEvents: 'none',
                    }}
                  />
                );
              })()}
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute', top: PAGE.cutouts.shelfrow1.y - 120, height: 900,
            left: glazeX, width: 420, transform: 'rotate(14deg)',
            opacity: glazeVis * 0.45, mixBlendMode: 'overlay',
            background:
              'linear-gradient(90deg, transparent, rgba(255,238,220,0.9) 45%, rgba(255,238,220,0.9) 55%, transparent)',
            pointerEvents: 'none',
          }}
        />
      </PageCam>

      {/* screen-space counter */}
      <div
        style={{
          // top-LEFT: the top-right corner is where the page's own "Add all 1 to
          // the order" button sits (they collided), and the bottom belongs to the
          // caption. Both framings keep this corner on empty page margin.
          position: 'absolute', top: 84, right: 96, textAlign: 'right', pointerEvents: 'none',
          opacity: counterIn, transform: `scale(${counterScale})`, transformOrigin: '100% 0%',
          padding: '18px 24px 22px 34px',
          background:
            'radial-gradient(120% 120% at 100% 0%, oklch(98.2% 0.004 84 / 0.97) 45%, oklch(98.2% 0.004 84 / 0) 100%)',
        }}
      >
        <div
          style={{
            fontFamily: BODY, fontSize: 34, fontWeight: 600, letterSpacing: '0.12em',
            color: T.inkSoft, textTransform: 'uppercase',
          }}
        >
          Counted tonight
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <DigitRoll key={landedCount} value={String(landedCount)} fontSize={96} color={T.primary} />
        </div>
        <div
          style={{
            fontFamily: BODY, fontSize: 34, fontWeight: 500, letterSpacing: '0.08em',
            color: T.inkSoft, marginTop: 6, textTransform: 'uppercase',
          }}
        >
          of 40 products
        </div>
      </div>
    </AbsoluteFill>
  );
};
