// v8 kit — the v7 shot language, generalised for the new captures.
//
// Plate      a cutout framed over the page it came from (push / settle / drift),
//            exactly FigurePlate's look (radius 14, shadowPop, 12f fade) but sized
//            by WIDTH so a wide strip and a tall card can both be legible.
// PageBack   that page, blurred and dimmed behind it (Acts6 `Backdrop`, for any
//            full-page texture, not just the v5app strips).
// Hi / Veil  overlays in PLATE-RELATIVE fractions, so they survive a recapture
//            that keeps the crop's framing (re-check stills after any recapture).
// BRoll      an H3 clip as a framed inset, never full-bleed: the clips are
//            864x480 and full-bleed 1080p shows the upscale.
// ChainStrip the quiet corner indicator of where we are in the chain.
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';

import { BODY, E, T } from '../../tokens';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const tex = (name: string) => staticFile(name.includes('/') ? name : `textures/v8/${name}.png`);

/* ------------------------------------------------------------------ PageBack */
export const PageBack: React.FC<{
  src: string;
  duration: number;
  /** output-px vertical offset of the page at the first / last frame (negative scrolls down) */
  yFrom?: number;
  yTo?: number;
  dim?: number;
  dark?: boolean;
}> = ({ src, duration, yFrom = -60, yTo = -160, dim = 0.74, dark = false }) => {
  const f = useCurrentFrame();
  const y = interpolate(f, [0, Math.max(1, duration - 1)], [yFrom, yTo], { ...clamp, easing: E.camera });
  return (
    <AbsoluteFill style={{ backgroundColor: dark ? T.cPaper : T.paper, overflow: 'hidden' }}>
      <AbsoluteFill style={{ filter: 'blur(10px)', transform: 'scale(1.03)' }}>
        <Img src={tex(src)} style={{ position: 'absolute', left: 0, top: 0, width: 1920, transform: `translateY(${y}px)` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: dark ? T.cPaper : T.paper, opacity: dim }} />
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------------- Plate */
export const Plate: React.FC<{
  src: string;
  width: number;
  /** centre of the plate in output px */
  x?: number;
  y?: number;
  move?: 'push' | 'settle' | 'drift' | 'none';
  delay?: number;
  moveFrames?: number;
  radius?: number;
  children?: React.ReactNode;
}> = ({ src, width, x = 960, y = 540, move = 'push', delay = 0, moveFrames = 90, radius = 14, children }) => {
  const f = useCurrentFrame() - delay;
  if (f < 0) return null;
  const o = interpolate(f, [0, 12], [0, 1], clamp);
  const t = interpolate(f, [0, moveFrames], [0, 1], clamp);
  let scale = 1;
  let dx = 0;
  if (move === 'push') scale = 1 + 0.05 * E.push(t);
  if (move === 'settle') scale = 1.04 - 0.04 * E.easeOut(t);
  if (move === 'drift') dx = 22 * E.camera(t);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        transform: `translate(-50%, -50%) translateX(${dx}px) scale(${scale})`,
        opacity: o,
      }}
    >
      <div style={{ position: 'relative', borderRadius: radius, boxShadow: T.shadowPop }}>
        <Img src={tex(src)} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: radius }} />
        {children}
      </div>
    </div>
  );
};

type Box = { x: number; y: number; w: number; h: number };
const pct = (b: Box) => ({ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` });

/** "This bit" — a soft ring, not a box drawn round it (that reads as a bug report). */
export const Hi: React.FC<Box & { from: number; to?: number; dark?: boolean; pad?: number }> = ({
  from,
  to,
  dark = false,
  pad = 8,
  ...b
}) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const tin = interpolate(f, [from, from + 14], [0, 1], { ...clamp, easing: E.easeOut });
  const tout = to === undefined ? 1 : interpolate(f, [to, to + 10], [1, 0], clamp);
  const ring = dark ? 'oklch(79% 0.125 78 / 0.7)' : 'oklch(58% 0.14 42 / 0.62)';
  return (
    <div
      style={{
        position: 'absolute',
        ...pct(b),
        margin: -pad,
        padding: pad,
        boxSizing: 'content-box',
        borderRadius: 12,
        boxShadow: `0 0 0 ${2.5 * tin}px ${ring}, 0 14px 44px oklch(21% 0.012 320 / ${0.12 * tin})`,
        background: dark ? `oklch(79% 0.125 78 / ${0.07 * tin})` : `oklch(58% 0.14 42 / ${0.06 * tin})`,
        opacity: tin * tout,
        transform: `scale(${1.02 - 0.02 * tin})`,
        pointerEvents: 'none',
      }}
    />
  );
};

/** A cover in the card's own colour that lifts at `until` — how a part of a plate is held back. */
export const Veil: React.FC<Box & { until: number; color?: string; wipe?: boolean; fade?: number }> = ({
  until,
  color = '#ffffff',
  wipe = false,
  fade = 8,
  ...b
}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [until, until + fade], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (t >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        ...pct(b),
        background: color,
        opacity: wipe ? 1 : 1 - t,
        clipPath: wipe ? `inset(0 0 0 ${t * 100}%)` : undefined,
      }}
    />
  );
};

/** Whole-plate wash that greys everything except what is lit (bands, chain dots). */
export const Dimmer: React.FC<Box & { lit: number; color?: string; amount?: number }> = ({
  lit,
  color = 'oklch(96.6% 0.004 84)',
  amount = 0.78,
  ...b
}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [lit, lit + 10], [0, 1], { ...clamp, easing: E.easeOut });
  return <div style={{ position: 'absolute', ...pct(b), background: color, opacity: amount * (1 - t), borderRadius: 10 }} />;
};

/* --------------------------------------------------------------------- BRoll */
export const BRoll: React.FC<{
  src: string;
  rate: number;
  duration: number;
  width?: number;
  x?: number;
  y?: number;
}> = ({ src, rate, duration, width = 1296, x = 960, y = 540 }) => {
  const f = useCurrentFrame();
  const h = (width * 480) / 864;
  const o = interpolate(f, [0, 10], [0, 1], clamp);
  const push = interpolate(f, [0, duration], [1, 1.045], { ...clamp, easing: E.camera });
  return (
    <div
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y - h / 2,
        width,
        height: h,
        borderRadius: 18,
        overflow: 'hidden',
        opacity: o,
        boxShadow: '0 4px 10px oklch(21% 0.012 320 / 0.10), 0 34px 90px oklch(21% 0.012 320 / 0.28)',
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        muted
        playbackRate={rate}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${push})` }}
      />
    </div>
  );
};

/* ---------------------------------------------------------------- ChainStrip */
export const ChainStrip: React.FC<{
  labels: readonly string[];
  link: number;
  dark?: boolean;
  /** pulse the lit dot on entry — the only chapter marker in the film */
  pulse?: boolean;
  /** fade in on the first shot of a side, out on its last; steady across cuts otherwise */
  enter?: boolean;
  exit?: boolean;
  duration: number;
}> = ({ labels, link, dark = false, pulse = false, enter = false, exit = false, duration }) => {
  const f = useCurrentFrame();
  const inT = enter ? interpolate(f, [0, 10], [0, 1], { ...clamp, easing: E.easeOut }) : 1;
  const outT = exit ? interpolate(f, [duration - 8, duration], [1, 0], clamp) : 1;
  const p = pulse ? interpolate(f, [4, 12, 26], [0, 1, 0], clamp) : 0;
  const labelIn = pulse ? interpolate(f, [6, 20], [0, 1], { ...clamp, easing: E.easeOut }) : 1;
  const accent = dark ? T.cAmber : T.primary;
  // Compact and stacked (dots over label), pinned in the right margin: the
  // travel plates end at x≈1550 and the calls page at x≈1400, so at ≤300px wide
  // it never sits on page content (pass-2 note: it covered method/opens/calls).
  return (
    <div
      style={{
        position: 'absolute',
        right: 34,
        top: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 7,
        padding: '10px 14px',
        borderRadius: 14,
        background: dark ? 'oklch(22.5% 0.013 50 / 0.88)' : 'oklch(99% 0.003 84 / 0.9)',
        boxShadow: dark ? '0 0 0 1px oklch(31% 0.014 55)' : `0 0 0 1px ${T.line}, ${T.shadowCard}`,
        opacity: inT * outT,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {labels.map((_, i) => {
          const lit = i === link;
          const past = i < link;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 6,
                  background: lit ? accent : past ? (dark ? T.cInkFaint : T.inkFaint) : 'transparent',
                  boxShadow: lit
                    ? `0 0 0 ${3 + 5 * p}px ${dark ? `oklch(79% 0.125 78 / ${0.18 + 0.2 * p})` : `oklch(58% 0.14 42 / ${0.16 + 0.2 * p})`}`
                    : `inset 0 0 0 1.5px ${dark ? T.cInkFaint : T.inkFaint}`,
                  opacity: lit || past ? 1 : 0.55,
                  transform: `scale(${lit ? 1 + 0.25 * p : 1})`,
                }}
              />
              {i < labels.length - 1 && <div style={{ width: 10, height: 1.5, background: dark ? T.cLine : T.line }} />}
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: BODY,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: dark ? T.cInk : T.ink,
          opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * 5}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        {labels[link]}
      </div>
    </div>
  );
};
