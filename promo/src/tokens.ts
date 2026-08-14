// Brand tokens, lifted verbatim from mockups/tokens.css (DESIGN_SPEC §2.1).
// Nothing here is invented for the video — skill rule 2: the film's visual
// language grows from the product's own design system.
import { Easing } from 'remotion';

export const T = {
  paper: 'oklch(98.2% 0.004 84)',
  paper2: 'oklch(96.2% 0.004 84)',
  card: '#ffffff',
  ink: 'oklch(21% 0.012 320)',
  inkSoft: 'oklch(42% 0.014 320)',
  inkFaint: 'oklch(55% 0.014 320)',
  line: 'oklch(90% 0.006 84)',
  primary: 'oklch(58% 0.14 42)',
  primaryDeep: 'oklch(52% 0.14 40)',
  primaryWash: 'oklch(96% 0.02 50)',
  gold: 'oklch(72% 0.084 85)',
  success: 'oklch(60% 0.12 155)',
  warn: 'oklch(70% 0.13 70)',
  gradSunset: 'linear-gradient(45deg,#feda75 0%,#fa7e1e 25%,#d62976 50%,#962fbf 75%,#4f5bd5 100%)',
  ringSunset:
    'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#d62976,#fa7e1e,#feda75)',
  shadowCard: '0 1px 2px oklch(21% 0.012 320 / 0.04), 0 8px 24px oklch(21% 0.012 320 / 0.05)',
  shadowPop: '0 2px 4px oklch(21% 0.012 320 / 0.06), 0 16px 40px oklch(21% 0.012 320 / 0.10)',
  radius: 16,
  radiusLg: 22,
  // Compass (fixed dark sub-theme)
  cPaper: 'oklch(19.5% 0.012 50)',
  cPaper2: 'oklch(22.5% 0.013 50)',
  cCard: 'oklch(24.5% 0.014 50)',
  cInk: 'oklch(94% 0.008 84)',
  cInkFaint: 'oklch(64% 0.014 60)',
  cLine: 'oklch(31% 0.014 55)',
  cAmber: 'oklch(79% 0.125 78)',
} as const;

export const DISPLAY = 'Fraunces, Georgia, serif';
export const BODY = 'Inter, system-ui, sans-serif';

// Motion tokens (DESIGN_SPEC §1 of the promo spec). `easeOut` is literally the
// product's own --ease-out; `camera` is PageCam's long damped default.
export const E = {
  easeOut: Easing.bezier(0.16, 1, 0.3, 1),
  camera: Easing.bezier(0.33, 0, 0.15, 1),
  push: Easing.bezier(0.35, 0, 0.2, 1),
  // y1 > 1: only where something physically lands (aesthetic-rules R2 / Q8)
  land: Easing.bezier(0.2, 1.25, 0.3, 1),
  reseat: Easing.bezier(0.4, 0, 0.3, 1.05),
  letterpress: Easing.bezier(0.2, 0.75, 0.3, 1),
  heavyOut: Easing.bezier(0.12, 0.9, 0.2, 1),
} as const;

// Caption sizes: Q11 floor is 56px for narration, 32px for support text.
export const CAP = { lead: 62, sub: 34 } as const;
