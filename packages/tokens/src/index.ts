/**
 * @bask/tokens — design tokens + the color math the theme layer runs on.
 *
 * `src/tokens.css` is a VERBATIM copy of `mockups/tokens.css` (IMPLEMENTATION_SPEC
 * §4.1: CSS is the source of truth). Dusk and Compass are additive override blocks
 * in sibling files. There is deliberately NO source→CSS generation machinery — TS/RN
 * theme-object generation waits for M2, when Expo actually needs it.
 *
 * Stylesheet entry point: `import '@bask/tokens/index.css'`.
 */

export const THEMES = ['sunset', 'dusk', 'compass'] as const;
export type ThemeName = (typeof THEMES)[number];

/** Themes a salon can actually choose. Compass is force-pinned by route, never picked. */
export const SELECTABLE_THEMES = ['sunset', 'dusk'] as const satisfies readonly ThemeName[];
export type SelectableTheme = (typeof SELECTABLE_THEMES)[number];

/** Default salon theme. `/compass` routes are pinned to `compass` regardless of choice. */
export const DEFAULT_THEME: ThemeName = 'sunset';

/** Human labels for the theme picker — the only place these strings live. */
export const THEME_LABELS: Record<ThemeName, string> = {
  sunset: 'Sunset',
  dusk: 'Dusk',
  compass: 'Compass',
};

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

export {
  contrast,
  contrastRatio,
  composite,
  linearToSrgb,
  parseColor,
  readableForeground,
  relativeLuminance,
  shiftLightness,
  srgbToLinear,
  toHex,
  type Rgb,
} from './color';

/**
 * The contrast audit is deliberately NOT re-exported here. It reads the CSS files off
 * disk (`node:fs`), so re-exporting it drags Node built-ins into every browser bundle
 * that imports a token constant — Turbopack fails the build outright. It is a
 * build-time/CI tool and lives behind its own subpath:
 *     import { auditThemes } from '@bask/tokens/contrast';
 */
