/**
 * @bask/tokens — design tokens + theme definitions.
 *
 * M0 step 8 makes `src/tokens.css` a copy of `mockups/tokens.css` (the source of
 * truth) and adds the ThemeProvider. No TS token generation until M2.
 */

export const THEMES = ['sunset', 'dusk', 'compass'] as const;
export type ThemeName = (typeof THEMES)[number];

/** Default salon theme. `/compass` routes are pinned to `compass` regardless of choice. */
export const DEFAULT_THEME: ThemeName = 'sunset';
