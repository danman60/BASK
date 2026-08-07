'use client';

/**
 * The nav itself. Client-side for two reasons and no others: it needs the current
 * pathname to mark the active pill, and it has to carry the Presenter Panel's
 * `?role`/`?theme` through every link — a scenario bookmark that loses its role on
 * the first click is a bookmark that breaks a pitch (IMPLEMENTATION_SPEC §0.1).
 *
 * Two arrangements, one source of truth (`NAV`): pill row in the sticky topbar at
 * desktop, fixed bottom tab bar at ≤720px (mockup 05). Both are rendered; CSS
 * decides which is visible. Rendering the list twice is cheap; keeping two lists
 * in sync is not.
 *
 * They are separate ELEMENTS in separate places because the topbar carries
 * `backdrop-filter` for the glass effect, and a filtered element becomes the
 * containing block for its `position: fixed` descendants — a tab bar nested in
 * the header pins itself to the header, not to the viewport. The shell therefore
 * mounts the tabs as a sibling of the header, after the page content.
 */

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { SHELL_UI } from '@bask/ui';

import { activeNavKey, NAV } from './nav';

export function AppNav({ variant }: { variant: 'pills' | 'tabs' }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeNavKey(pathname);
  const query = searchParams.toString();

  const href = (path: string) => (query ? `${path}?${query}` : path);
  const tabs = variant === 'tabs';

  return (
    // Only one arrangement is ever `display: block` at a given width, and
    // `display: none` takes the other out of the accessibility tree — so the two
    // navs never present as duplicate landmarks.
    <nav className={tabs ? 'b-tabbar' : 'b-nav'} aria-label={SHELL_UI.navLandmark}>
      {NAV.map((item) => (
        <Link
          key={item.key}
          href={href(item.href)}
          className={tabs ? 'b-tab' : 'b-nav-pill'}
          data-active={item.key === active || undefined}
          aria-current={item.key === active ? 'page' : undefined}
        >
          {tabs && (
            <span className="b-tab-ic" aria-hidden>
              {item.icon}
            </span>
          )}
          {tabs ? item.short : item.label}
        </Link>
      ))}
    </nav>
  );
}
