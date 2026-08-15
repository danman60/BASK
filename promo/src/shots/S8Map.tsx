// S8 — the network map. The hero shot of the UVALUX half: twelve salons on a
// real map of Canada, each one landing with its health band as its colour, the
// chain of them drawn west to east so the network reads as a network.
//
// This screen did not exist three hours ago. PRODUCT_SPEC §14/§191 and the pitch
// script both called for it and DESIGN_SPEC §6 had deferred it past M1, so the
// page shipped with a four-bar province chart instead. It is now built, live,
// and this shot is filmed off it like everything else in this film.
//
// Motion: the map plate arrives empty, then the chain travels east — for each
// salon an amber line reaches out first, and the pin lands on the end of it
// (the card's own landing grammar, bezier with y1 > 1, plus a halo bloom that
// anneals away, borrowed from bento-light-up's per-cell relay). Names take turns
// in one fixed slot rather than sitting beside their pins — the BC and Ontario
// clusters overlap, so twelve simultaneous labels are unreadable — and the pin
// being named holds its ring bright, which is what ties the two together.
//
// Nothing here is authored data. Pin positions, colours and names are read off
// the live DOM at capture time (layout.json → pins[]), so a dot is exactly where
// the product puts it, exactly the colour the product gives it, and the name
// beside it is the account's real name and city.
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { PageCam, CamKey } from '../lib/PageCam';
import { BODY, E, T } from '../tokens';

type Pin = { x: number; y: number; fill: string; stroke?: string; hollow: boolean; name: string };

const PAGE = layout.pages['compass-network'];
const MAP = PAGE.cutouts['map-card'];
const PINS = (layout as unknown as { pins: Pin[] }).pins;

// The act break: this screen shoves the Bask side out of frame from the bottom
// (bottom-push-stack-wipe, single-seam use — 30f on the card's heavy ease-out
// with its 40px top-edge seam shadow). The UVALUX act opens on the map, so the
// push lives here; S8Network's PUSH is 0. Only ONE shot may own it.
const PUSH = 30;

// west to east, the way you would read it; x-ties broken by y so the order is
// stable across captures
const ORDER = [...PINS]
  .map((p, i) => ({ ...p, i }))
  .sort((a, b) => a.x - b.x || a.y - b.y);

// The account the Call List flags is the one whose band colour is amber. Read it
// out of the colours themselves rather than naming a salon: the highest b* in
// lab() is the yellow one. Its chip is the only one that holds to the end.
const bStar = (c: string) => {
  const m = /lab\(\s*[\d.-]+\s+[\d.-]+\s+([\d.-]+)/.exec(c);
  return m ? Number(m[1]) : -Infinity;
};
const FLAGGED = ORDER.filter((p) => !p.hollow).sort((a, b) => bStar(b.fill) - bStar(a.fill))[0]?.i;

const FIRST = PUSH + 30;
const GAP = 16; // one salon every 0.53s — a roll call you can read
const REACH = 12; // the line arrives this many frames before its pin lands
const LAST = FIRST + (ORDER.length - 1) * GAP + 16;

/** Landing frames, shot-relative. Soundtrack pins its ticks off this so the
 *  sound table cannot drift from the picture (sound-design 4.5). */
export const MAP_LANDINGS_REL = ORDER.map((_, n) => FIRST + n * GAP);

const CAM_KEYS: CamKey[] = [
  { frame: PUSH, cx: MAP.x + MAP.w / 2, cy: MAP.y + MAP.h / 2, zoom: 1.42 },
  { frame: PUSH + 20, cx: MAP.x + MAP.w / 2, cy: MAP.y + MAP.h / 2, zoom: 1.42 },
  { frame: LAST + 30, cx: MAP.x + MAP.w / 2, cy: MAP.y + MAP.h / 2 + 10, zoom: 1.2 },
  { frame: 300, cx: MAP.x + MAP.w / 2, cy: MAP.y + MAP.h / 2 + 20, zoom: 1.12 },
];

const SLOT_W = 460; // screen px; the roll-call slot, clear of the easternmost pin

export const S8Map: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, PUSH], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.heavyOut,
  });

  const landing = (n: number) => FIRST + n * GAP;

  return (
    <AbsoluteFill style={{ backgroundColor: T.cPaper, transform: `translateY(${(1 - inP) * 1080}px)` }}>
      <PageCam
        src="textures/compass-network-nopins.png"
        pageH={PAGE.pageH}
        keys={CAM_KEYS}
        ease={E.camera}
        surround={T.cPaper}
      >
        {/* the chain — one segment per hop, each drawn in the 12f before the pin
            at its far end lands, so the line reaches out and the salon arrives
            on the end of it. Settles to a quiet 0.22 once the pin is down. */}
        <svg
          width={1920}
          height={PAGE.pageH}
          viewBox={`0 0 1920 ${PAGE.pageH}`}
          style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
        >
          {ORDER.slice(1).map((p, k) => {
            const a = ORDER[k];
            const at = landing(k + 1);
            const len = Math.hypot(p.x - a.x, p.y - a.y);
            const draw = interpolate(frame, [at - REACH, at + 2], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
            });
            if (draw <= 0) return null;
            const settle = interpolate(frame, [at + 2, at + 22], [0.85, 0.22], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            return (
              <line
                key={p.i}
                x1={a.x}
                y1={a.y}
                x2={p.x}
                y2={p.y}
                stroke={T.cAmber}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - draw)}
                opacity={settle}
              />
            );
          })}
        </svg>

        {ORDER.map((p, n) => {
          const at = landing(n);
          const drop = interpolate(frame, [at, at + 16], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.land,
          });
          if (drop <= 0) return null;
          // halo blooms as it lands, then anneals to the product's own 0.18
          const bloom = interpolate(frame, [at + 8, at + 16, at + 34], [0, 1, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const colour = p.hollow ? 'oklch(64% 0.014 60)' : p.fill;
          // while this salon is the one being named, its ring holds bright
          const named = frame >= at && frame < at + GAP + 6 ? 1 : 0;
          return (
            <div
              key={p.i}
              style={{
                position: 'absolute', left: p.x - 30, top: p.y - 30, width: 60, height: 60,
                opacity: Math.min(1, drop * 1.4),
                transform: `translateY(${(1 - drop) * -14}px) scale(${0.6 + 0.4 * drop})`,
              }}
            >
              {/* the node ring — a studio on the network, not just a dot */}
              <div
                style={{
                  position: 'absolute', inset: 17 - named * 3, borderRadius: '50%',
                  border: `${1 + named * 0.4}px solid ${colour}`, opacity: 0.45 + named * 0.45,
                }}
              />
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

      {/* The roll call. Twelve labels beside twelve pins is unreadable — the BC
          and Ontario clusters sit on top of each other — so the names take turns
          in ONE fixed slot on the right, screen space, while the pin being named
          holds its ring bright. Every string is the account's real name and city
          straight out of the capture. */}
      {ORDER.map((p, n) => {
        const at = landing(n);
        const inC = interpolate(frame, [at + 2, at + 10], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.easeOut,
        });
        const outC = interpolate(frame, [at + GAP, at + GAP + 6], [1, 0], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const o = Math.min(inC, outC);
        if (o <= 0) return null;
        const [name, city] = p.name.split(/\s+—\s+(?=[^—]+$)/);
        const colour = p.hollow ? T.cInkFaint : p.fill;
        return (
          <div
            key={`chip-${p.i}`}
            style={{
              position: 'absolute', right: 90, top: 300, width: SLOT_W,
              opacity: o, transform: `translateY(${(1 - inC) * 10}px)`,
              fontFamily: BODY, textAlign: 'left',
              borderLeft: `3px solid ${colour}`, paddingLeft: 22,
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 600, color: T.cInk, lineHeight: 1.14 }}>
              {name}
            </div>
            <div style={{ fontSize: 32, color: T.cInkFaint, marginTop: 6 }}>{city}</div>
          </div>
        );
      })}

      {/* After the roll call the slot keeps ONE account: the amber one. It is
          the salon the Call List flags two shots later, so the film introduces
          it here by name instead of arriving at it cold. */}
      {(() => {
        const p = ORDER.find((q) => q.i === FLAGGED);
        if (!p) return null;
        const o = interpolate(frame, [LAST, LAST + 12], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        if (o <= 0) return null;
        const [name, city] = p.name.split(/\s+—\s+(?=[^—]+$)/);
        return (
          <div
            style={{
              position: 'absolute', right: 90, top: 300, width: SLOT_W,
              opacity: o, fontFamily: BODY,
              borderLeft: `3px solid ${p.fill}`, paddingLeft: 22,
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 600, color: T.cInk, lineHeight: 1.14 }}>
              {name}
            </div>
            <div style={{ fontSize: 32, color: T.cInkFaint, marginTop: 6 }}>{city}</div>
            <div
              style={{
                fontSize: 27, fontWeight: 600, marginTop: 16, color: p.fill,
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}
            >
              Needs attention
            </div>
          </div>
        );
      })()}

      {/* No summary strapline here: the page's own header already reads
          "Twelve salons across four provinces", and the caption says it again.
          A third copy over the signal cards was noise. */}

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
