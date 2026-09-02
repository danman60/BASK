# promo v6: ChartPlate — a figure that draws itself on

## What to build

Create a Remotion presentational component for the promo film: a framed CHART that animates on, used to put moving figures on screen early in the cut instead of scrolling a page. Export an interface ChartPlateProps with EXACTLY: series: number[]; label: string; fromLabel: string; toLabel: string; fromValue: string; toValue: string; accent?: boolean. Export a function component ChartPlate. Behaviour, all driven by useCurrentFrame from remotion and interpolate from remotion, never by CSS animation or setInterval: (1) the plate itself fades and scales from 0.96 to 1 over frames 0 to 14; (2) an inline SVG polyline of the series draws on left to right between frames 8 and 46 by animating strokeDashoffset from the path length to zero — compute the polyline points by normalising the series into a 640 by 220 viewBox; (3) the fromValue and toValue labels fade in at frames 30 and 40 respectively; (4) nothing moves after frame 60, the plate simply holds. Use the tokens from the contract for every colour, easing and font — T for colours, E for easing curves, BODY and DISPLAY for font families. The accent prop, when true, selects the amber accent colour from the tokens instead of the ink colour for the line. Add a header comment saying this component exists because the v5 cut scrolled past its numbers and the film needs figures that move. Do NOT invent hex colours, do NOT import anything outside remotion, react and the contract module, do NOT use Easing directly, and do NOT read staticFile or any image.

## Target file — write EXACTLY this path, and nothing else

`promo/src/shots/v6/ChartPlate.tsx`

## The API surface you may use

Everything below is REAL and already exists. Import from `../../tokens`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

consts: T, DISPLAY, BODY, E, CAP

T has EXACTLY these 26 keys: paper, paper2, card, ink, inkSoft, inkFaint, line, primary, primaryDeep, primaryWash, gold, success, warn, gradSunset, ringSunset, shadowCard, shadowPop, radius, radiusLg, cPaper, cPaper2, cCard, cInk, cInkFaint, cLine, cAmber

E has EXACTLY these 7 keys: easeOut, camera, push, land, reseat, letterpress, heavyOut
```
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
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

```

## Rules

- Write the target file. Do not create other files.
- Do not modify anything outside the target path.
- Import every symbol you use. Do not reference a symbol you have not imported.
- Use ONLY class names and style keys that appear in the surface or the exemplar.
- Do not leave TODOs, stubs, or placeholder values.
- Do not fix unrelated bugs you notice. Build only what is described above.

## Acceptance gate — you are DONE only when all of these are true

1. `promo/src/shots/v6/ChartPlate.tsx` exists and is complete.
2. It imports what it uses from `../../tokens`.
3. `npx tsc --noEmit && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/promo/src/shots/v5/Plate.tsx promo/src/shots/v6/ChartPlate.tsx --contract /home/danman60/projects/uvalux-platform/promo/src/tokens.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
