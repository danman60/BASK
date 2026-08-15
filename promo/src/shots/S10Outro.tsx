// S10 — the group photo. Card: outro-group-photo-launch (outro/outro-group-photo-launch.md),
// reference implementation template/src/aifl/live/SceneOutroLive.tsx.
//
// Kept: one representative element per surface the film showed (Q8's checklist),
// cue-ordered render so later arrivals stack on top, FLY_EASE
// bezier(0.34,1.4,0.44,1) — a real overshoot, the reference's own correction —
// rot×2→settled and scale ×1.12→1, lagging ghost trail at 8% of the path,
// landing glow, airborne→seated shadow collapse, the配角 step-back when the
// wordmark takes the stage, crane rotateX 4°→0 with a continuing slow push,
// deterministic dust (index-derived, никогда Math.random), one opening light
// sweep, stage light behind the wordmark, rule with extension lines, and a
// sign-off hold well past the 30f floor.
//
// Bask skin: the rule is the sunset gradient — one of the film's two permitted
// uses of it (DESIGN_SPEC §2.1 keeps it sacred and scarce); the wordmark is the
// product's own italic Fraunces; the dust is gold, not amber-orange.
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import layout from '../layout.json';
import { PageCam, CamKey } from '../lib/PageCam';
import { BODY, DISPLAY, T } from '../tokens';
import { SHOTS } from '../timeline';

const FLY_EASE = Easing.bezier(0.34, 1.4, 0.44, 1);
const CRANE_EASE = Easing.bezier(0.3, 0, 0.2, 1);
const LETTERS = 'Bask'.split('');
const PAGE = layout.pages['today-full'];

type FlyEl = {
  key: string; file: string; w: number; h: number;
  cx: number; cy: number; scale: number; rot: number;
  dx: number; dy: number; radius: number; cue: number;
};

// one element per surface shown: the brief, the finding, the campaign post,
// the running bed, the shelf line, the text message, the rep's evidence
const ELS: FlyEl[] = [
  // The centre band (y 360–780, x 420–1500) belongs to the wordmark, the rule
  // and the tagline; every element is placed clear of it.
  { key: 'letter', file: 'letter.png', w: 740, h: 211, cx: 356, cy: 210, scale: 0.62, rot: -3, dx: -560, dy: -120, radius: 12, cue: 8 },
  { key: 'insight', file: 'insight4.png', w: 740, h: 163, cx: 1566, cy: 208, scale: 0.6, rot: 3, dx: 560, dy: -140, radius: 14, cue: 14 },
  { key: 'ig', file: 'ig-card.png', w: 401, h: 532, cx: 214, cy: 690, scale: 0.6, rot: 2.5, dx: -480, dy: 260, radius: 14, cue: 20 },
  { key: 'room', file: 'room2.png', w: 353, h: 143, cx: 1724, cy: 424, scale: 0.9, rot: -2.5, dx: 520, dy: -60, radius: 16, cue: 26 },
  { key: 'shelf', file: 'reorder-line.png', w: 1130, h: 128, cx: 660, cy: 966, scale: 0.5, rot: -1.5, dx: -180, dy: 320, radius: 12, cue: 32 },
  { key: 'sms', file: 'sms-card.png', w: 350, h: 380, cx: 1330, cy: 918, scale: 0.5, rot: 2, dx: 300, dy: 320, radius: 12, cue: 38 },
  { key: 'ctile', file: 'ctile1.png', w: 275, h: 65, cx: 1690, cy: 800, scale: 1.0, rot: -3, dx: 460, dy: 60, radius: 10, cue: 44 },
];

const DUST = Array.from({ length: 20 }, (_, i) => ({
  x: (i * 439 + 137) % 1920,
  y0: (i * 613 + 271) % 1080,
  rise: 0.3 + (i % 5) * 0.11,
  swayAmp: 9 + (i % 4) * 5,
  swayFreq: 0.022 + (i % 3) * 0.008,
  phase: (i * 0.83) % (Math.PI * 2),
  size: 2 + (i % 3) * 0.5,
  opacity: 0.15 + ((i * 7) % 5) * 0.05,
}));

export const S10Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const duration = SHOTS.outro.duration;

  // The backdrop is the Daybreak page. It used to open at 6px of blur, which is
  // legible — so the cut out of the dark Compass act flashed a readable dashboard
  // for a beat before the group photo assembled over it. It now starts already
  // dissolved (20px) and fades UP out of the paper, so the first thing the eye
  // gets is light and texture, never a screen.
  const blur = interpolate(frame, [0, 24], [20, 22], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.4, 1),
  });
  const plateIn = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
  });
  const rule = interpolate(frame, [84, 96], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  const tag = interpolate(frame, [96, 108], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sub = interpolate(frame, [106, 118], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // the UVALUX mark arrives last, after the film has finished making its case
  const mark = interpolate(frame, [118, 132], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [duration - 10, duration], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const recede = interpolate(frame, [64, 74], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const craneT = interpolate(frame, [0, 46], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: CRANE_EASE,
  });
  const pushT = interpolate(frame, [46, duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const camScale = 1.06 - 0.06 * craneT + 0.03 * pushT;
  const camTilt = 4 * (1 - craneT);

  const sweepX = interpolate(frame, [2, 16], [-700, 2020], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.6, 1),
  });
  const sweepOpacity = interpolate(frame, [2, 6, 12, 16], [0, 0.12, 0.12, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const stageLight = interpolate(frame, [64, 74, 84], [0, 0.5, 0.28], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const vignette = interpolate(frame, [64, 78], [0, 0.1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ruleExt = interpolate(frame, [84, 92], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  const ruleExtFade = interpolate(frame, [92, 100], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const wordSpacing = interpolate(frame, [78, 84], [-0.024, -0.014], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
  });

  const CAM: CamKey[] = [{ frame: 0, cx: 960, cy: 700, zoom: 0.78 }];

  return (
    <AbsoluteFill style={{ opacity: fadeOut, backgroundColor: T.paper }}>
      <AbsoluteFill
        style={{
          transform: `perspective(1400px) rotateX(${camTilt}deg) scale(${camScale})`,
          transformOrigin: '50% 45%',
        }}
      >
        <AbsoluteFill style={{ opacity: plateIn }}>
          <PageCam src="textures/today-full.png" pageH={PAGE.pageH} keys={CAM} blur={blur} saturate={0.92} />
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(1250px 820px at 50% 48%, oklch(98.6% 0.005 84 / 0.86), oklch(98.2% 0.004 84 / 0.6) 60%, oklch(98.2% 0.004 84 / 0.4))',
            pointerEvents: 'none',
          }}
        />

        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          {ELS.map((el) => {
            if (frame < el.cue) return null;
            const t = interpolate(frame, [el.cue, el.cue + 12], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: FLY_EASE,
            });
            const opacity = interpolate(frame, [el.cue, el.cue + 3], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            const linT = interpolate(frame, [el.cue, el.cue + 12], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            const x = el.dx * (1 - t);
            const y = el.dy * (1 - t);
            const rot = el.rot * (2 - t);
            const scale = el.scale * (1.12 - 0.12 * t);
            const air = Math.max(0, 1 - t);
            const shadow =
              air > 0.01
                ? `0 ${10 + 26 * air}px ${24 + 46 * air}px rgba(46,32,26,${0.14 + 0.1 * air}), 0 2px 6px rgba(46,32,26,.07)`
                : '0 10px 24px rgba(46,32,26,.14), 0 2px 6px rgba(46,32,26,.07)';
            const settledOpacity = opacity * (1 - 0.12 * recede);
            const saturate = 1 - 0.08 * recede;
            const showGhost = linT > 0.05 && linT < 0.95;
            const glow = interpolate(frame, [el.cue + 12, el.cue + 18], [0.3, 0], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            const showGlow = frame >= el.cue + 12 && frame < el.cue + 18;
            const glowR = el.w * el.scale * 0.5;

            return (
              <div key={el.key}>
                {showGhost ? (
                  <div
                    style={{
                      position: 'absolute', left: el.cx - el.w / 2, top: el.cy - el.h / 2,
                      width: el.w, height: el.h,
                      transform: `translate(${x + el.dx * 0.08}px, ${y + el.dy * 0.08}px) rotate(${rot}deg) scale(${scale})`,
                      transformOrigin: 'center center', borderRadius: el.radius, overflow: 'hidden',
                      opacity: 0.2 * Math.max(0, 1 - linT), filter: 'blur(8px)',
                    }}
                  >
                    <Img
                      src={staticFile(`textures/${el.file}`)}
                      style={{ position: 'absolute', inset: 0, width: el.w, height: el.h, display: 'block' }}
                    />
                  </div>
                ) : null}
                <div
                  style={{
                    position: 'absolute', left: el.cx - el.w / 2, top: el.cy - el.h / 2,
                    width: el.w, height: el.h,
                    transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
                    transformOrigin: 'center center', borderRadius: el.radius, overflow: 'hidden',
                    boxShadow: shadow, opacity: settledOpacity, filter: `saturate(${saturate})`,
                  }}
                >
                  <Img
                    src={staticFile(`textures/${el.file}`)}
                    style={{ position: 'absolute', inset: 0, width: el.w, height: el.h, display: 'block' }}
                  />
                </div>
                {showGlow ? (
                  <div
                    style={{
                      position: 'absolute', left: el.cx - glowR, top: el.cy - glowR,
                      width: glowR * 2, height: glowR * 2, borderRadius: '50%',
                      background: 'radial-gradient(circle, oklch(72% 0.084 85 / 0.9), oklch(72% 0.084 85 / 0) 70%)',
                      opacity: glow, mixBlendMode: 'multiply',
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </AbsoluteFill>
      </AbsoluteFill>

      {/* gold dust */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {DUST.map((d, i) => {
          const dy = (((d.y0 - frame * d.rise) % 1080) + 1080) % 1080;
          const dx = d.x + Math.sin(frame * d.swayFreq + d.phase) * d.swayAmp;
          return (
            <div
              key={i}
              style={{
                position: 'absolute', left: dx, top: dy, width: d.size, height: d.size,
                borderRadius: '50%', background: T.gold, opacity: d.opacity,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {sweepOpacity > 0 ? (
        <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'overlay' }}>
          <div
            style={{
              position: 'absolute', top: 0, bottom: 0, left: sweepX - 300, width: 600,
              background: 'linear-gradient(90deg, rgba(255,244,228,0), rgba(255,244,228,1) 50%, rgba(255,244,228,0))',
              opacity: sweepOpacity,
            }}
          />
        </AbsoluteFill>
      ) : null}

      {stageLight > 0 ? (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background:
              'radial-gradient(720px 380px at 960px 470px, rgba(255,247,233,0.95), rgba(255,247,233,0.35) 55%, rgba(255,247,233,0) 75%)',
            opacity: stageLight,
          }}
        />
      ) : null}

      {vignette > 0 ? (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background: 'radial-gradient(1400px 900px at 50% 50%, rgba(58,42,32,0) 55%, rgba(58,42,32,0.7) 100%)',
            opacity: vignette,
          }}
        />
      ) : null}

      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 170, fontWeight: 600,
              color: T.ink, letterSpacing: `${wordSpacing}em`, display: 'flex', justifyContent: 'center', lineHeight: 1.05,
            }}
          >
            {LETTERS.map((ch, i) => {
              const delay = Math.round(64 + i * 2.4);
              const t = interpolate(frame, [delay, delay + 9], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.75, 0.3, 1),
              });
              return (
                <span
                  key={i}
                  style={{
                    opacity: t,
                    transform: `translateY(${(1 - t) * 28}px) scale(${1.35 - 0.35 * t})`,
                    filter: `blur(${(1 - t) * 8}px)`,
                    display: 'inline-block', whiteSpace: 'pre',
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>

          <div style={{ position: 'relative', height: 7, width: 420, margin: '34px auto 0' }}>
            <div
              style={{
                position: 'absolute', inset: 0, borderRadius: 4,
                background: T.gradSunset, transform: `scaleX(${rule})`,
              }}
            />
            {ruleExt > 0 && ruleExtFade > 0 ? (
              <>
                <div style={{ position: 'absolute', top: 3, height: 1, right: '100%', width: 190 * ruleExt, background: T.primary, opacity: ruleExtFade }} />
                <div style={{ position: 'absolute', top: 3, height: 1, left: '100%', width: 190 * ruleExt, background: T.primary, opacity: ruleExtFade }} />
              </>
            ) : null}
          </div>

          <div
            style={{
              // 58px: the closing line is the one the rule says should never be
              // small, and 38 measured under the 56px narration floor
              fontFamily: BODY, fontSize: 58, fontWeight: 500, color: T.inkSoft,
              marginTop: 40, opacity: tag, letterSpacing: '0.002em', maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.24,
            }}
          >
            The salon runs better. UVALUX sees the market it serves.
          </div>
          <div
            style={{
              // 34px and a deeper gold: at 26px in --gold on ivory the lockup
              // was under both the size floor and any usable contrast
              fontFamily: BODY, fontSize: 34, fontWeight: 600, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'oklch(56% 0.09 78)', marginTop: 24, opacity: sub,
            }}
          >
            Bask · Compass
          </div>

          {/* UVALUX's own mark (uvalux.com, black-on-transparent original, shown
              at 4x source so the swoosh and the leaf stay clean). It arrives
              after the lockup and sits under a hairline — a sign-off, not a
              claim about whose product this is. */}
          <div
            style={{
              marginTop: 30, opacity: mark,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
              transform: `translateY(${(1 - mark) * 8}px)`,
            }}
          >
            <div style={{ width: 320, height: 1, background: T.line }} />
            <div
              style={{
                fontFamily: BODY, fontSize: 34, fontWeight: 500, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: T.inkSoft,
              }}
            >
              Built for
            </div>
            <Img
              src={staticFile('brand/uvalux-logo-4x.png')}
              style={{ width: 264, height: 80, display: 'block', opacity: 0.92 }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
