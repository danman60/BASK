// S9 — Compass Call List. Two cards in one shot, in the order the seam demands:
//
// 1) The act break: bottom-push-stack-wipe (transition/bottom-push-stack-wipe.md),
//    reference demos/transition/bottom-push-stack-wipe/BottomPushStackWipe.tsx.
//    Used as a SINGLE seam rather than the film-wide chapter skeleton the card
//    describes (documented deviation): the Compass act pushes up from the bottom
//    edge over 30f on the card's heavy ease-out, with the 40px top-edge seam
//    shadow that makes it read as one screen physically shoving the other out.
//    Bask's warm ivory and Compass's charcoal are the two "chapter colours", and
//    they are the products' own, not invented promo backdrops.
//
// 2) The content: row-embed (ui-entrance/row-embed.md), reference implementation
//    template/src/aifl/live/SceneDetail.tsx. Kept: cue 12 + i*9 with a 12f
//    flight, perspective(900px) translateY(-120·air) rotateX(16°·air), scale
//    1.06→0.995 then a 4f press-bounce to 1, the 2px accent seam spreading from
//    the centre of the bottom edge on touchdown (5f grow, 8f fade), and a camera
//    that pans while the rows arrive. The base texture is the capture with the
//    tiles hidden, so nothing ghosts underneath. Accent is Compass amber.
import React from 'react';
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { PageCam, CamKey } from '../lib/PageCam';
import { E, T } from '../tokens';

const PAGE = layout.pages['compass-full'];
const C = PAGE.cutouts;
const TILES = [C.ctile1, C.ctile2, C.ctile3];
// The act break moved to S8Network (the first UVALUX screen). By the time the
// call list arrives we are already inside the Compass act, so this shot no
// longer pushes — it just plays.
const PUSH = 0;
const PAGE_SRC = staticFile('textures/compass-empty.png');

const CAM_KEYS: CamKey[] = [
  { frame: PUSH, cx: 706, cy: 330, zoom: 1.32 },
  { frame: PUSH + 22, cx: 706, cy: 330, zoom: 1.32 },
  { frame: PUSH + 96, cx: 706, cy: 420, zoom: 1.16 },
  { frame: PUSH + 150, cx: 706, cy: 420, zoom: 1.16 },
  { frame: PUSH + 216, cx: 706, cy: 436, zoom: 1.2 }, // slow drift, not a freeze
];

const FLY_EASE = Easing.bezier(0.3, 0, 0.25, 1);

export const S9Compass: React.FC = () => {
  const frame = useCurrentFrame();

  // PUSH is 0 here now (the act break moved to S8Network), so this resolves to
  // a plain, un-pushed screen — interpolate would throw on a [0,0] input range.
  const inP = PUSH === 0 ? 1 : interpolate(frame, [0, PUSH], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.heavyOut,
  });
  const y = (1 - inP) * 1080;

  return (
    <AbsoluteFill style={{ transform: `translateY(${y}px)`, backgroundColor: T.cPaper }}>
      <PageCam src="textures/compass-empty.png" pageH={PAGE.pageH} keys={CAM_KEYS} ease={E.camera} surround={T.cPaper}>
        {TILES.map((r, i) => {
          const cue = PUSH + 14 + i * 9;
          const land = cue + 12;

          let flyer: React.ReactNode = null;
          if (frame >= cue && frame < cue + 16) {
            const p = interpolate(frame, [cue, cue + 12], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: FLY_EASE,
            });
            const appear = interpolate(frame, [cue, cue + 3], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            const scale =
              frame < land
                ? 1.06 - 0.065 * p
                : interpolate(frame, [land, land + 4], [0.995, 1], {
                    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
                  });
            const air = 1 - p;
            flyer = (
              <div
                key={`fly${i}`}
                style={{
                  position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h,
                  borderRadius: 14,
                  backgroundImage: `url(${staticFile(`textures/ctile${i + 1}.png`)})`,
                  backgroundSize: '100% 100%',
                  opacity: appear,
                  transform: `perspective(900px) translateY(${-120 * air}px) rotateX(${16 * air}deg) scale(${scale})`,
                  boxShadow: `0 ${30 * air}px ${60 * air}px rgba(0,0,0,${0.4 * air}), 0 ${8 * air}px ${16 * air}px rgba(0,0,0,${0.25 * air})`,
                  zIndex: 3,
                }}
              />
            );
          }

          // seated tile (the base texture has the tiles hidden)
          const seated =
            frame >= cue + 16 ? (
              <div
                key={`seat${i}`}
                style={{
                  position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h,
                  backgroundImage: `url(${staticFile(`textures/ctile${i + 1}.png`)})`,
                  backgroundSize: '100% 100%', zIndex: 2,
                }}
              />
            ) : null;

          let seam: React.ReactNode = null;
          if (frame >= land && frame < land + 8) {
            const spread = interpolate(frame, [land, land + 5], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
            });
            const seamOpacity = interpolate(frame, [land, land + 2, land + 8], [1, 1, 0], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            const seamW = r.w * spread;
            seam = (
              <div
                key={`seam${i}`}
                style={{
                  position: 'absolute', left: r.x + (r.w - seamW) / 2, top: r.y + r.h - 2,
                  width: seamW, height: 2, background: T.cAmber,
                  boxShadow: '0 0 6px rgba(226,170,80,0.45)', opacity: seamOpacity, zIndex: 4,
                }}
              />
            );
          }

          return (
            <React.Fragment key={i}>
              {seated}
              {flyer}
              {seam}
            </React.Fragment>
          );
        })}
      </PageCam>

      {/* unused import guard */}
      <div style={{ display: 'none' }}>{PAGE_SRC}</div>
    </AbsoluteFill>
  );
};
