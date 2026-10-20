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
export function InsightsTabsNav({
  sections,
}: {
  sections: readonly { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="l4-tabs" aria-label="Insights sections">
      {sections.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="l4-tab"
          data-active={pathname === section.href}
          aria-current={pathname === section.href ? 'page' : undefined}
          // The row scrolls sideways on a phone; bring the open tab into view.
          ref={pathname === section.href ? (el) => el?.scrollIntoView({ block: 'nearest', inline: 'nearest' }) : undefined}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
