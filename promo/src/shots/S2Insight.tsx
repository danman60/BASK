// S2 — the insight card. Card: spotlight-hero-card (opening/spotlight-hero-card.md),
// reference implementation template/src/aifl/live/SceneOpen.tsx (macro half).
//
// Kept from the reference: roving spotlight with intermediate stations → lock
// pulse + vignette deepen, 16f push to a LEFT-side oblique (rotY dominant, small
// rotX), rise 10f with spring overshoot → 54f hover with a 40f-period bob →
// 18f reseat with a 0.997 press, two perimeter laps (fast+bright, slow+weak),
// vacated-slot patch with a breathing accent edge, altitude-linked two-layer
// shadow, 4x hero texture crossfaded in for the close-up, and the page-space 3D
// annotation. Re-skinned to Bask: terracotta replaces amber, gold marker bar,
// Fraunces note, and the card is Today's Tuesday insight.
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { PageCam, CamKey } from '../lib/PageCam';
import { DISPLAY, E, T } from '../tokens';
import { S1_END } from './S1Daybreak';

const PAGE = layout.pages['today-full'];
const CARD = PAGE.cutouts.insight4; // "Tuesday afternoon is wide open next week"
const MCX = CARD.x + CARD.w / 2;
const MCY = CARD.y + CARD.h / 2;
const RADIUS = T.radiusLg;

// screen position of the card under the S1 hand-off framing (percent)
const cardScreenX = ((960 + (MCX - S1_END.cx) * S1_END.zoom) / 1920) * 100;
const cardScreenY = ((540 + (MCY - S1_END.cy) * S1_END.zoom) / 1080) * 100;

const CAM_KEYS: CamKey[] = [
  { frame: 0, cx: S1_END.cx, cy: S1_END.cy, zoom: S1_END.zoom, rotX: 0, rotY: 0, rotZ: 0, persp: 1200 },
  { frame: 50, cx: S1_END.cx, cy: S1_END.cy, zoom: S1_END.zoom, rotX: 0, rotY: 0, rotZ: 0, persp: 1200 },
  // focal midway between the page's left margin (where the 3D note lives) and
  // the card's right edge, so both are in frame at 1.55
  { frame: 66, cx: MCX - 151, cy: MCY + 10, zoom: 1.55, rotX: 6, rotY: 26, rotZ: 1.5, persp: 1200 },
  { frame: 170, cx: MCX - 151, cy: MCY + 10, zoom: 1.55, rotX: 6, rotY: 26, rotZ: 1.5, persp: 1200 },
];

const PATCH = T.paper2;
const BEAM_CORE = 'rgba(255,248,240,0.98)';

export const S2Insight: React.FC = () => {
  const frame = useCurrentFrame();

  // --- roving → locking spotlight (screen space) ---
  const spotEase = Easing.bezier(0.4, 0, 0.3, 1);
  const spotX = interpolate(
    frame,
    [0, 6, 18, 30, 42, 66],
    [26, 26, 68, 44, cardScreenX, 50],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: spotEase },
  );
  const spotY = interpolate(
    frame,
    [0, 6, 18, 30, 42, 66],
    [30, 30, 44, 60, cardScreenY, 50],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: spotEase },
  );
  const spotOn = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const poolBase = interpolate(frame, [30, 50, 66], [620, 420, 360], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.3, 1),
  });
  const poolPulse = interpolate(frame, [50, 54, 59], [0, 0.06, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const poolRx = poolBase * (1 + poolPulse);
  const poolRy = poolBase * 0.8 * (1 + poolPulse);
  const vignette = interpolate(frame, [30, 50, 66], [0.16, 0.36, 0.52], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const dofStrength = interpolate(frame, [50, 66, 78, 90], [0, 8, 8, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // --- the hero card: rise → hover → reseat (lock 50 → touchdown 148 ≈ 3.3s) ---
  const rise = interpolate(frame, [66, 76], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.land,
  });
  const reseat = interpolate(frame, [130, 148], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.reseat,
  });
  const lift = rise * (1 - reseat);
  const bob = Math.sin(((frame - 76) / 40) * Math.PI * 2) * 4 * lift;
  const z = 110 * lift + bob;
  const landed = frame >= 148;
  const press = interpolate(frame, [144, 147, 148], [1, 0.997, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const shadow = `0 ${8 * lift}px ${10 + 12 * lift}px rgba(46,32,26,${0.18 * lift}), 0 ${46 * lift}px ${90 * lift}px rgba(46,32,26,${0.22 * lift})`;

  const slotVis = Math.min(1, rise * 2) * (1 - reseat);
  const landPulse = interpolate(frame, [144, 148, 152], [0, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const slotEdge = Math.min(1, 0.4 * (1 - reseat)) + landPulse * 0.6;

  // --- two perimeter laps ---
  const beam1Prog = interpolate(frame, [78, 92], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.linear,
  });
  const beam1On = frame >= 77 && frame <= 93;
  const beam2Prog = interpolate(frame, [98, 118], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.4, 1),
  });
  const beam2On = frame >= 97 && frame <= 119;
  const beamTrail = interpolate(frame, [118, 130], [0.35, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const bw = CARD.w + 6;
  const bh = CARD.h + 6;

  const hiresIn = interpolate(frame, [50, 56], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: T.paper }}>
      <PageCam
        src="textures/today-full.png"
        pageH={PAGE.pageH}
        keys={CAM_KEYS}
        ease={E.push}
        dof={{ focusY: 230, strength: dofStrength }}
      >
        <div style={{ transformStyle: 'preserve-3d' }}>
          {/* vacated slot: paper patch + breathing terracotta edge */}
          {slotVis > 0.02 ? (
            <div
              style={{
                position: 'absolute', left: CARD.x - 2, top: CARD.y - 2,
                width: CARD.w + 4, height: CARD.h + 4, background: PATCH,
                borderRadius: RADIUS,
                boxShadow: `inset 0 0 26px oklch(58% 0.14 42 / ${0.1 * slotEdge})`,
                opacity: slotVis,
              }}
            >
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: RADIUS,
                  border: `1.5px solid ${T.primary}`, opacity: slotEdge,
                }}
              />
            </div>
          ) : null}

          {/* the levitating card */}
          <div
            style={{
              position: 'absolute', left: CARD.x, top: CARD.y,
              width: CARD.w, height: CARD.h,
              transform: `translateZ(${z}px) scale(${press})`,
              transformOrigin: 'center center',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              style={{
                position: 'absolute', inset: 0, borderRadius: RADIUS,
                overflow: 'hidden', boxShadow: landed ? T.shadowCard : shadow,
              }}
            >
              <Img
                src={staticFile('textures/insight4.png')}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
              />
              {/* 4x element capture over the 2x page texture — laid out at card
                  size, rasterized at PageCam's layout-scale zoom (Q2) */}
              <Img
                src={staticFile('textures/insight4-4x.png')}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  display: 'block', opacity: hiresIn,
                }}
              />
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.45), transparent 42%)',
                  opacity: lift, pointerEvents: 'none',
                }}
              />
            </div>
            <div
              style={{
                position: 'absolute', inset: 0, borderRadius: RADIUS,
                boxShadow: `inset 0 0 0 1px rgba(255,255,255,${0.7 * lift})`,
                pointerEvents: 'none',
              }}
            />

            {(beam1On || beam2On) && lift > 0.4 ? (
              <svg
                width={bw} height={bh} viewBox={`0 0 ${bw} ${bh}`}
                style={{
                  position: 'absolute', left: -3, top: -3, overflow: 'visible',
                  pointerEvents: 'none', opacity: beam1On ? 1 : 0.62,
                  filter: `drop-shadow(0 0 6px ${T.primary}) drop-shadow(0 0 18px rgba(255,236,222,0.5))`,
                }}
              >
                <rect
                  x={2} y={2} width={bw - 4} height={bh - 4} rx={RADIUS} fill="none"
                  stroke={T.primary} strokeWidth={beam1On ? 5 : 3.5} strokeLinecap="round"
                  pathLength={1} strokeDasharray="0.14 1"
                  strokeDashoffset={-(beam1On ? beam1Prog : beam2Prog)}
                />
                <rect
                  x={2} y={2} width={bw - 4} height={bh - 4} rx={RADIUS} fill="none"
                  stroke={BEAM_CORE} strokeWidth={beam1On ? 2.5 : 1.75} strokeLinecap="round"
                  pathLength={1} strokeDasharray="0.14 1"
                  strokeDashoffset={-(beam1On ? beam1Prog : beam2Prog)}
                />
              </svg>
            ) : null}

            {beamTrail > 0.01 ? (
              <div
                style={{
                  position: 'absolute', inset: -3, borderRadius: RADIUS + 3,
                  border: `1.5px solid ${T.primary}`, opacity: beamTrail,
                  pointerEvents: 'none',
                }}
              />
            ) : null}
          </div>
        </div>

        {/* page-space 3D annotation above the hovering card — same coordinate
            system, same camera, marker bar in brand gold (C3) */}
        {frame >= 78 && frame <= 150
          ? (() => {
              const noteIn = interpolate(frame, [78, 88], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E.letterpress,
              });
              const noteOut = interpolate(frame, [136, 146], [1, 0], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              });
              const noteVis = noteIn * noteOut;
              const noteZ = 92 + Math.sin(((frame - 78) / 44) * Math.PI * 2) * 3;
              const hl = interpolate(frame, [92, 104], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
              });
              return (
                <div style={{ transformStyle: 'preserve-3d', pointerEvents: 'none' }}>
                  <div
                    style={{
                      position: 'absolute', left: 116, top: 1010, width: 250, height: 60,
                      transform: 'translateZ(2px)',
                      background: 'radial-gradient(ellipse at 50% 50%, rgba(46,32,26,0.26), transparent 70%)',
                      filter: 'blur(12px)', opacity: 0.55 * noteVis,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute', left: 108, top: 902, width: 268,
                      transform: `translateZ(${noteZ}px) translateY(${(1 - noteIn) * 26}px)`,
                      opacity: noteVis, filter: `blur(${(1 - noteIn) * 4}px)`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: DISPLAY, fontSize: 38, fontWeight: 500, color: T.ink,
                        lineHeight: 1.16, letterSpacing: '-0.012em',
                      }}
                    >
                      Found overnight,
                    </div>
                    {/* marker bar drawn as a per-line background so it follows
                        both lines of the phrase instead of stopping halfway */}
                    <span
                      style={{
                        fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 38, fontWeight: 500,
                        color: T.ink, lineHeight: 1.5, letterSpacing: '-0.012em',
                        backgroundImage: 'linear-gradient(oklch(88% 0.075 85), oklch(88% 0.075 85))',
                        backgroundSize: `${hl * 100}% 74%`,
                        backgroundPosition: '0 82%',
                        backgroundRepeat: 'no-repeat',
                        boxDecorationBreak: 'clone',
                        WebkitBoxDecorationBreak: 'clone',
                        padding: '0 5px',
                        margin: '0 -5px',
                      }}
                    >
                      nobody ran a report.
                    </span>
                  </div>
                </div>
              );
            })()
          : null}
      </PageCam>

      {/* warm pool + outside dim */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(${poolRx}px ${poolRy}px at ${spotX}% ${spotY}%, rgba(255,242,224,0.20), rgba(255,242,224,0.06) 45%, rgba(64,48,36,${vignette * spotOn}) 100%)`,
          pointerEvents: 'none', opacity: spotOn,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(300px 220px at ${spotX - 6}% ${spotY + 10}%, rgba(255,246,232,0.16), transparent 70%)`,
          pointerEvents: 'none', opacity: spotOn * 0.7,
        }}
      />
    </AbsoluteFill>
  );
};
