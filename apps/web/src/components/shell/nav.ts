import { SHELL_UI, type NavKey } from '@bask/ui';

/**
 * The app's information architecture — six destinations, PRODUCT_SPEC/§7 order.
 *
 * Routing lives here; the LABELS live in the guidance dictionary, so a copy pass
 * never has to open a routing file. Lanes 2–4 fill these routes; lane 1 owns this
 * list, so a new destination is a one-line change reviewed in one place.
 */
export interface NavDestination {
  key: NavKey;
  href: string;
  label: string;
  /** Tab-bar label — same word, no article (six across 390px). */
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
