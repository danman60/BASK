import { SHELL_UI, type NavKey } from '@bask/ui';

/**
 * The app's information architecture — six destinations.
 *
 * FLOOR AND INVENTORY ARE NOT PART OF THIS PRODUCT. `8e32efc` took them out when
 * Bask narrowed to a sales-intelligence engine, and this file put them back with
 * the reasoning "PITCH.md Beats 2 and 3 and scenario-bookmarks still open them,
 * so they belong in the nav." That is circular: the script and the bookmarks were
 * stale artifacts of the wider product, and restoring the surfaces to satisfy
 * them reversed a product decision to avoid editing a document. Owner, 2026-08-27:
 * "THERE IS NO FLOOR ANYMORE."
 *
 * The routes still exist and still render — they are off-nav, not deleted, so
 * this stays reversible. If they come back, they come back as a product decision
 * and PITCH.md changes with them, in that order.
 *
 * Routing lives here; the LABELS live in the guidance dictionary, so a copy pass
 * never has to open a routing file. Lane 1 owns this list, so a new destination
 * is a one-line change reviewed in one place.
 */
export interface NavDestination {
  key: NavKey;
  href: string;
  label: string;
  /** Tab-bar label — same word, no article (four across a 320px row). */
  short: string;
  /** Bottom-tab glyph at mobile widths (mockup 05). */
  icon: string;
}

const dest = (key: NavKey, href: string, icon: string): NavDestination => ({
  key,
  href,
  label: SHELL_UI.nav[key],
  short: SHELL_UI.navShort[key],
  icon,
});

export const NAV: readonly NavDestination[] = [
  dest('today', '/', '☀'),
  dest('customers', '/customers', '☺'),
  dest('marketing', '/marketing', '✉'),
  dest('insights', '/insights', '◈'),
  dest('monitor', '/monitor', '◎'),
  dest('community', '/community', '◇'),
];

/** Longest-prefix match, so `/customers/123` still lights up Customers. */
export function activeNavKey(pathname: string): NavKey {
  if (pathname === '/') return 'today';
  const match = NAV.filter((item) => item.href !== '/').find((item) =>
    pathname.startsWith(item.href),
  );
  return match?.key ?? 'today';
}

/** Initials for the avatar chip — `Dana Whitfield` → `DW`. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
