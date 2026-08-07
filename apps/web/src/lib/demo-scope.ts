/**
 * Client-side demo scope: the role and theme the Presenter Panel drives, both
 * carried in the URL so a scenario bookmark is a plain link (IMPLEMENTATION_SPEC
 * §0.1 — "bookmarks = named demo-clock positions + UI deep link").
 *
 * URL-as-state is deliberate: it survives reload, it is shareable, and a fumbled
 * live demo recovers by pasting a link. No auth, no session — explicit non-goal
 * until M3.
 *
 * Roles come from `@bask/api/roles` and themes from `@bask/tokens`; nothing is
 * redefined here.
 */

import { DEFAULT_DEMO_ROLE, type DemoRole, parseDemoRole } from '@bask/api/roles';
import { DEFAULT_THEME, THEMES, type ThemeName } from '@bask/tokens';

export const ROLE_PARAM = 'role';
export const THEME_PARAM = 'theme';

/**
 * Plain-language labels for the theme switch. The theme LIST is `@bask/tokens`'
 * `THEMES` — this only names them for the panel.
 */
export const THEME_LABELS: Record<ThemeName, string> = {
  sunset: 'Sunset (default)',
  dusk: 'Dusk',
  compass: 'Compass',
};

export function parseTheme(value: unknown): ThemeName {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
    ? (value as ThemeName)
    : DEFAULT_THEME;
}

/**
 * Reads the role straight off `window.location` — used by the tRPC link, which
 * runs outside React and must see the value current at request time.
 */
export function readRoleFromLocation(): DemoRole {
  if (typeof window === 'undefined') return DEFAULT_DEMO_ROLE;
  return parseDemoRole(new URLSearchParams(window.location.search).get(ROLE_PARAM));
}

/**
 * Stamps the theme on the document root.
 *
 * STUB — M0 step 8 owns the real ThemeProvider (`@bask/tokens`: CSS vars at root,
 * WCAG-computed foreground pairs, per-salon persistence, `/compass` routes pinned
 * to Compass). Until it lands this sets `data-theme` only, which is the hook that
 * ThemeProvider is expected to drive anyway, so the switch is observable today.
 */
export function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

/** Builds `path?role=…&theme=…`, preserving any other params already present. */
export function buildScopedHref(
  path: string,
  scope: { role?: DemoRole; theme?: ThemeName },
  existing?: URLSearchParams,
): string {
  const params = new URLSearchParams(existing ? existing.toString() : undefined);
  if (scope.role) params.set(ROLE_PARAM, scope.role);
  if (scope.theme) params.set(THEME_PARAM, scope.theme);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export type { DemoRole, ThemeName };
