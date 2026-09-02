// The product's real typefaces (DESIGN_SPEC §2.2): Fraunces display + Inter UI.
// Latin subsets pulled from Google Fonts, the same source next/font self-hosts
// from in apps/web — so the film's type is the product's type, not a lookalike.
import { continueRender, delayRender, staticFile } from 'remotion';

const load = (family: string, file: string, style: 'normal' | 'italic') => {
  // Generous timeout: during a parallel video render every worker tab loads
  // these at once, and the default 28s window was tight enough to fail the run.
  // Raised again 2026-08-28 — the Quietest Register cut holds thirteen H3 clips
  // and several full-page textures, and worker tabs were starved past 120s while
  // decoding them, killing the render at frame 2844. A long ceiling costs nothing
  // when the font loads fast; it only stops a slow tab from failing the run.
  const handle = delayRender(`font ${family} ${style}`, { timeoutInMilliseconds: 600000 });
  const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, {
    weight: '100 900',
    style,
  });
  face
    .load()
    .then((f) => {
      document.fonts.add(f);
      continueRender(handle);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('font load failed', family, style, err);
      continueRender(handle);
    });
};

load('Fraunces', 'fraunces.woff2', 'normal');
load('Fraunces', 'fraunces-italic.woff2', 'italic');
load('Inter', 'inter.woff2', 'normal');
