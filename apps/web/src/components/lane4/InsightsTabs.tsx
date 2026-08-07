'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Section tabs inside Insights.
 *
 * This is NOT app navigation — Lane 1 owns the topbar and the six destinations
 * in the IA. Insights is one destination with three views (PRODUCT_SPEC §13:
 * metric areas, Peers, and the activity log), and this switches between them.
 */
const SECTIONS = [
  { href: '/insights', label: 'What changed' },
  { href: '/insights/peers', label: 'Peers' },
  { href: '/insights/activity', label: 'Who did what' },
] as const;

export function InsightsTabs() {
  const pathname = usePathname();

  return (
    <nav className="l4-tabs" aria-label="Insights sections">
      {SECTIONS.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="l4-tab"
          data-active={pathname === section.href}
          aria-current={pathname === section.href ? 'page' : undefined}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
