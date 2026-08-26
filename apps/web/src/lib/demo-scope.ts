/**
 * Client-side demo scope: the ROLE the Presenter Panel drives, carried in the URL
 * so a scenario bookmark is a plain link (IMPLEMENTATION_SPEC §0.1 — "bookmarks =
 * named demo-clock positions + UI deep link").
 *
 * URL-as-state is deliberate: it survives reload, it is shareable, and a fumbled
 * live demo recovers by pasting a link. No auth, no session — explicit non-goal
 * until M3.
 *
 * THEME IS NOT IN HERE, and that is the point. This module used to carry a
 * `?theme=` param and an `applyTheme()` that stamped `data-theme` on the document
 * root — while `<ThemeProvider>` in the root layout was stamping the same
 * attribute from its own state. Two writers, one attribute: the provider's effect
 * would overwrite the panel's write on any re-render, and inside /compass (where
 * `<ForcedTheme>` pins the Compass palette for Act 2's dark flip) the panel's
 * default `sunset` actively fought the pin. The provider is now the single owner;
 * the panel expresses a preference to it via `useTheme().setPreference`.
 *
 * Roles come from `@bask/api/roles`; nothing is redefined here.
 */

import { DEFAULT_DEMO_ROLE, type DemoRole, parseDemoRole } from '@bask/api/roles';

export const ROLE_PARAM = 'role';

/**
 * Reads the role straight off `window.location` — used by the tRPC link, which
 * runs outside React and must see the value current at request time.
 */
export function readRoleFromLocation(): DemoRole {
  if (typeof window === 'undefined') return DEFAULT_DEMO_ROLE;
  return parseDemoRole(new URLSearchParams(window.location.search).get(ROLE_PARAM));
}

/**
 * Reads the salon slug straight off `window.location`, for the same reason the
 * role is read this way: the tRPC link runs outside React.
 *
 * This did not exist, and the link forwarded only the role — so a `?salon=`
 * switch moved the SERVER-rendered chrome (the topbar name, the page shell)
 * while every tRPC query kept falling back to `HERO_SALON_ID`. The header said
 * one salon and the numbers were another's, which is the worst possible version
 * of the bug: nothing errors and the screen looks right.
 */
export function readSalonFromLocation(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('salon') ?? '';
}

/** Builds `path?role=…`, preserving any other params already present. */
export function buildScopedHref(
  path: string,
  scope: { role?: DemoRole },
  existing?: URLSearchParams,
): string {
  const params = new URLSearchParams(existing ? existing.toString() : undefined);
  if (scope.role) params.set(ROLE_PARAM, scope.role);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export type { DemoRole };
