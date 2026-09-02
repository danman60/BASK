// Plate — the v5 camera primitive.
//
// v4 flew PageCam over whole-page textures (1920px-wide pages, 5,188px tall),
// which is why body copy landed at 8-14px on screen. v5 frames ELEMENTS: each
// cutout was captured at deviceScaleFactor 3, so a 740px card is a 2,220px
// texture and can fill two thirds of a 1080p frame at native sharpness.
//
// Plate is the same idea as PageCam one level down — keyframed (cx, cy, zoom)
// over a single element in its own CSS coordinate space, plus the shadow and
// paper the element needs to look like an object rather than a screenshot.
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import { T } from '../../tokens';
import layout from '../../layout-v5.json';

export type PlateKey = { frame: number; cx: number; cy: number; zoom: number; rot?: number };

type Cutouts = Record<string, { x: number; y: number; w: number; h: number }>;
const CUTS = layout.cutouts as Cutouts;

/** CSS size of a cutout — the capture ran at dsf 3, so the png is 3x this. */
export const sizeOf = (name: string) => {
  const c = CUTS[name];
  if (!c) throw new Error(`layout-v5.json has no cutout "${name}"`);
  return { w: c.w, h: c.h };
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Interpolate a keyframe track at `frame`, easing between neighbours. */
export const camAt = (keys: PlateKey[], frame: number, ease: (t: number) => number) => {
  if (frame <= keys[0].frame) return keys[0];
  const last = keys[keys.length - 1];
  if (frame >= last.frame) return last;
  let i = 0;
  while (i < keys.length - 2 && frame > keys[i + 1].frame) i += 1;
  const a = keys[i];
  const b = keys[i + 1];
  const t = ease((frame - a.frame) / Math.max(1, b.frame - a.frame));
  return {
    frame,
    cx: lerp(a.cx, b.cx, t),
    cy: lerp(a.cy, b.cy, t),
    zoom: lerp(a.zoom, b.zoom, t),
    rot: lerp(a.rot ?? 0, b.rot ?? 0, t),
  };
};

export const Plate: React.FC<{
  /** cutout name in public/textures/v5 (also the layout-v5.json key) */
  name: string;
  keys: PlateKey[];
  ease?: (t: number) => number;
  dark?: boolean;
  /** page-space children, positioned in the element's own CSS px */
  children?: React.ReactNode;
  /** drop the card shadow when the cutout already carries its own surface */
  flat?: boolean;
  frame?: number;
}> = ({ name, keys, ease = (t) => t * t * (3 - 2 * t), dark = false, children, flat = false, frame }) => {
  const local = useCurrentFrame();
  const f = frame ?? local;
  const { w, h } = sizeOf(name);
  const cam = camAt(keys, f, ease);

  return (
    <AbsoluteFill style={{ backgroundColor: dark ? T.cPaper : T.paper, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          transform: `translate(${960 - cam.cx * cam.zoom}px, ${540 - cam.cy * cam.zoom}px) scale(${cam.zoom}) rotate(${cam.rot ?? 0}deg)`,
          transformOrigin: '0 0',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }}>
          <Img
            src={staticFile(`textures/v5/${name}.png`)}
            style={{
              width: w,
              height: h,
              display: 'block',
              borderRadius: flat ? 0 : 14,
              boxShadow: flat
                ? 'none'
                : dark
                  ? '0 2px 6px oklch(0% 0 0 / 0.5), 0 26px 60px oklch(0% 0 0 / 0.42)'
                  : T.shadowPop,
            }}
          />
          {children}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Deepening vignette — the pressure half of slow-push-in. */
export const Vignette: React.FC<{ opacity: number; dark?: boolean }> = ({ opacity, dark = false }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 50%, transparent 38%, ${dark ? 'oklch(8% 0.01 50)' : 'oklch(30% 0.02 60)'} 100%)`,
      opacity,
      pointerEvents: 'none',
    }}
  />
);

/**
 * A figure pulled out of the page and set beside it — the film's only piece of
 * invented type. Every number it prints is read off the cutout underneath it.
 */
export const Figure: React.FC<{
  value: string;
  label: string;
  x: number;
  y: number;
  from: number;
  color?: string;
  size?: number;
}> = ({ value, label, x, y, from, color = T.primary, size = 92 }) => {
  const f = useCurrentFrame() - from;
  const t = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (f < 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: t,
        transform: `translateY(${(1 - t) * 14}px)`,
        textAlign: 'left',
      }}
    >
      <div
        style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: size,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: size * 0.26,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: T.inkFaint,
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
};
