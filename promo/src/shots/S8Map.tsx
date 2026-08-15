// S8 — the network map. The hero shot of the UVALUX half: twelve salons on a
// real map of Canada, each one landing with its health band as its colour.
//
// This screen did not exist three hours ago. PRODUCT_SPEC §14/§191 and the pitch
// script both called for it and DESIGN_SPEC §6 had deferred it past M1, so the
// page shipped with a four-bar province chart instead. It is now built, live,
// and this shot is filmed off it like everything else in this film.
//
// Motion: the map plate arrives empty, then the pins drop in west to east on a
// spring — the card's own landing grammar (bezier with y1 > 1, an overshoot that
// settles) plus an amber halo pulse that anneals away, borrowed from
// bento-light-up's per-cell relay. Pin positions and colours are read straight
// off the live DOM at capture time, so a dot is exactly where the product puts
// it and exactly the colour the product gives it.
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { PageCam, CamKey } from '../lib/PageCam';
import { BODY, E, T } from '../tokens';

const PAGE = layout.pages['compass-network'];
const MAP = PAGE.cutouts['map-card'];
const PINS = (layout as unknown as { pins: { x: number; y: number; fill: string; hollow: boolean; name: string }[] }).pins;

// west to east, the way you would read it
const ORDER = [...PINS].map((p, i) => ({ ...p, i })).sort((a, b) => a.x - b.x);

const PUSH = 30; // the act break lands here
const FIRST = PUSH + 30;
const GAP = 7;
const LAST = FIRST + (ORDER.length - 1) * GAP + 16;

const CAM_KEYS: CamKey[] = [
  { frame: PUSH, cx: MAP.x + MAP.w / 2, cy: MAP.y + MAP.h / 2, zoom: 1.42 },
  { frame: PUSH + 20, cx: MAP.x + MAP.w / 2, cy: MAP.y + MAP.h / 2, zoom: 1.42 },
  { frame: LAST + 30, cx: MAP.x + MAP.w / 2, cy: MAP.y + MAP.h / 2 + 10, zoom: 1.2 },
  { frame: 300, cx: MAP.x + MAP.w / 2, cy: MAP.y + MAP.h / 2 + 20, zoom: 1.12 },
];

export const S8Map: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, PUSH], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.heavyOut,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: T.cPaper, transform: `translateY(${(1 - inP) * 1080}px)` }}>
      <PageCam
        src="textures/compass-network-nopins.png"
        pageH={PAGE.pageH}
        keys={CAM_KEYS}
        ease={E.camera}
      >
        {ORDER.map((p, n) => {
          const at = FIRST + n * GAP;
          const drop = interpolate(frame, [at, at + 16], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.land,
          });
          if (drop <= 0) return null;
          // halo blooms as it lands, then anneals to the product's own 0.18
          const bloom = interpolate(frame, [at + 8, at + 16, at + 34], [0, 1, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const colour = p.hollow ? 'oklch(64% 0.014 60)' : p.fill;
          return (
            <div
              key={p.i}
              style={{
                position: 'absolute', left: p.x - 30, top: p.y - 30, width: 60, height: 60,
                opacity: Math.min(1, drop * 1.4),
                transform: `translateY(${(1 - drop) * -14}px) scale(${0.6 + 0.4 * drop})`,
              }}
            >
              <div
                style={{
                  position: 'absolute', inset: 21, borderRadius: '50%',
                  background: p.hollow ? 'transparent' : colour,
                  border: p.hollow ? `1.6px solid ${colour}` : 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute', inset: 13, borderRadius: '50%',
                  background: colour, opacity: 0.18 + bloom * 0.5,
                  filter: `blur(${bloom * 3}px)`,
                }}
              />
            </div>
          );
        })}
      </PageCam>

      {/* the count, held against the map rather than floating over the page */}
      <div
        style={{
          position: 'absolute', left: 110, bottom: 96,
          opacity: interpolate(frame, [LAST, LAST + 14], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          }),
          fontFamily: BODY, fontSize: 30, fontWeight: 600, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: T.cInkFaint,
        }}
      >
        Twelve salons · four provinces · one network
      </div>

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
