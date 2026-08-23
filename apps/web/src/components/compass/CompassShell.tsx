'use client';

/**
 * The Compass shell (DESIGN_SPEC §3.4: 216px sidenav + main).
 *
 * Two things this shell owns and nothing else touches:
 *   - `<ForcedTheme theme="compass">`. The salon's own Sunset/Dusk preference is
 *     untouched underneath; crossing back out of /compass restores it.
 *   - The demo role. There is no auth until M3, so the role rides in the URL —
 *     and a Compass surface with an owner's role would just throw FORBIDDEN. The
 *     guard below puts a rep in the URL rather than showing an error nobody in a
 *     pitch wants to explain.
 *
 * Split out of the route layout because it reads `useSearchParams()`, which opts
 * everything under it into client-side rendering unless a Suspense boundary sits
 * ABOVE it — and a boundary cannot be in the same client component that suspends.
 * The server layout supplies it (same pattern the root layout uses for the
 * Presenter Panel).
 *
 * Signals has no nav entry: in M1 its three cards are folded into Network
 * (PRODUCT_SPEC §6 keeps five destinations; M1 ships four surfaces).
 */

import { UVALUX_ROLES, type DemoRole } from '@bask/api/roles';
import { ForcedTheme } from '@bask/ui';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { ROLE_PARAM } from '@/lib/demo-scope';

const NAV = [
  { href: '/compass/network', label: 'Network' },
  { href: '/compass', label: 'Call List' },
  { href: '/compass/accounts', label: 'Accounts' },
  { href: '/compass/coaching', label: 'Coaching' },
  { href: '/compass/knowledge', label: 'Knowledge' },
] as const;

const DEFAULT_COMPASS_ROLE: DemoRole = 'uvalux_rep';

function isUvaluxRole(value: string | null): boolean {
  return value !== null && (UVALUX_ROLES as readonly string[]).includes(value);
}

export function CompassShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = searchParams.get(ROLE_PARAM);
  const ready = isUvaluxRole(role);

  // Compass belongs to UVALUX. Landing here as an owner is a demo-navigation
  // accident, not a permission question — put a rep in the URL and carry on.
  useEffect(() => {
    if (ready) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set(ROLE_PARAM, DEFAULT_COMPASS_ROLE);
    router.replace(`${pathname}?${params.toString()}`);
  }, [ready, pathname, router, searchParams]);

  const href = (path: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(ROLE_PARAM, role && isUvaluxRole(role) ? role : DEFAULT_COMPASS_ROLE);
    return `${path}?${params.toString()}`;
  };

  const isLeadership = role === 'uvalux_leadership';

  return (
    <>
      <ForcedTheme theme="compass" />
      <div className="cp-layout">
        <aside className="cp-sidenav">
          <Link className="cp-wordmark" href={href('/compass')}>
            Compass<small>UVALUX</small>
          </Link>
          <nav className="cp-nav" aria-label="Compass">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={href(item.href)}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="cp-rep">
            <div className="a" aria-hidden="true">
              {isLeadership ? 'NO' : 'FH'}
            </div>
            <div>
              <div className="n">{isLeadership ? 'Nick O.' : 'Fintan H.'}</div>
              {/* M1 shows the whole book to either role — territory scoping is a
                  real filter, not a label, and it lands with auth in M3. */}
              <div className="r">{isLeadership ? 'Leadership' : 'All territories'}</div>
            </div>
          </div>
        </aside>
        <main className="cp-main">{ready ? children : null}</main>
      </div>
    </>
  );
}

/** `/compass` is the Call List, so it only matches exactly. */
function isActive(pathname: string, href: string): boolean {
  if (href === '/compass') return pathname === '/compass';
  return pathname === href || pathname.startsWith(`${href}/`);
}
