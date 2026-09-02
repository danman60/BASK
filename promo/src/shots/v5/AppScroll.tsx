// AppScroll — the app, scrolling, with its own chrome pinned.
//
// The first v5 pass framed single cards on paper. It read as a deck of
// screenshots, not as software somebody uses. This renders a surface the way the
// product actually behaves: contiguous page strips stacked back into one page,
// a camera that scrolls down it, and the sticky topbar pinned over the top —
// so the picture is "a person using Bask", not "a card, alone, on cream".
//
// Textures come from scripts/capture-v5-app.mjs: 1600px-wide strips at
// deviceScaleFactor 2, page-space `top` recorded per strip in layout-v5app.json.
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import { T } from '../../tokens';
import app from '../../layout-v5app.json';

type Strip = { name: string; top: number; h: number };
type PageDef = { pageH: number; w: number; strips: Strip[] };

const PAGES = app as unknown as Record<string, PageDef> & { topbar: { w: number; h: number } };

export const pageOf = (key: string): PageDef => {
  const p = PAGES[key] as PageDef;
  if (!p || !p.strips) throw new Error(`layout-v5app.json has no page "${key}"`);
  return p;
};

/**
 * @param page   key in layout-v5app.json ('today', 'community', …)
 * @param from   page-space y at the top of frame on the first frame
 * @param to     page-space y at the top of frame on the last frame
 * @param zoom   CSS px → output px. 1.2 keeps 1600px of app filling a 1920 frame.
 */
export const AppScroll: React.FC<{
  page: string;
  from: number;
  to: number;
  duration: number;
  zoom?: number;
  zoomTo?: number;
  dark?: boolean;
  ease?: (t: number) => number;
  bar?: boolean;
  children?: React.ReactNode;
}> = ({ page, from, to, duration, zoom = 1.2, zoomTo, dark = false, ease = (t) => t, bar = true, children }) => {
  const f = useCurrentFrame();
  const p = pageOf(page);
  const t = ease(Math.max(0, Math.min(1, f / Math.max(1, duration - 1))));
  const y = from + (to - from) * t;
  const z = zoom + ((zoomTo ?? zoom) - zoom) * t;
  const barH = PAGES.topbar.h;

  return (
    <AbsoluteFill style={{ backgroundColor: dark ? T.cPaper : T.paper, overflow: 'hidden' }}>
      {/* the page, scrolling */}
      <AbsoluteFill
        style={{
          transform: `translate(${(1920 - p.w * z) / 2}px, ${-y * z}px) scale(${z})`,
          transformOrigin: '0 0',
        }}
      >
        {p.strips.map((s) => (
          <Img
            key={s.name}
            src={staticFile(`textures/v5app/${s.name}.png`)}
            style={{ position: 'absolute', left: 0, top: s.top, width: p.w, height: s.h, display: 'block' }}
          />
        ))}
        {children}
      </AbsoluteFill>

      {/* the chrome, pinned — this is what makes it read as an application */}
      {bar && (
        <div
          style={{
            position: 'absolute',
            left: (1920 - PAGES.topbar.w * z) / 2,
            top: 0,
            width: PAGES.topbar.w * z,
            height: barH * z,
            overflow: 'hidden',
          }}
        >
          <Img src={staticFile('textures/v5app/topbar.png')} style={{ width: '100%', display: 'block' }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * A soft highlight over a page-space box — used to say "this bit" without
 * drawing a box around it, which reads as a bug report.
 */
export const Spot: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  from: number;
  dark?: boolean;
}> = ({ x, y, w, h, from, dark = false }) => {
  const f = useCurrentFrame() - from;
  const t = interpolate(f, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (f < 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 14,
        top: y - 14,
        width: w + 28,
        height: h + 28,
        borderRadius: 18,
        boxShadow: `0 0 0 2px ${dark ? 'oklch(79% 0.125 78 / 0.55)' : 'oklch(58% 0.14 42 / 0.5)'}, 0 18px 60px oklch(21% 0.012 320 / 0.14)`,
        background: dark ? 'oklch(79% 0.125 78 / 0.06)' : 'oklch(58% 0.14 42 / 0.05)',
        opacity: t,
      }}
    />
  );
};

/** Full-frame dim outside a page-space box, so the eye goes where the VO is. */
export const Focus: React.FC<{ opacity: number; dark?: boolean }> = ({ opacity, dark = false }) => (
  <AbsoluteFill
    style={{
      background: dark
        ? 'radial-gradient(ellipse at 50% 46%, transparent 30%, oklch(10% 0.01 50 / 0.72) 92%)'
        : 'radial-gradient(ellipse at 50% 46%, transparent 30%, oklch(28% 0.02 60 / 0.42) 92%)',
      opacity,
      pointerEvents: 'none',
    }}
  />
);
