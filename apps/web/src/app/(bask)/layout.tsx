import type { ReactNode } from 'react';

import '@bask/ui/components.css';
import '@bask/ui/health.css';
import './bask.css';
import '@/components/shell/shell.css';

import { AppShell } from '@/components/shell/AppShell';
import type { SalonIdentity } from '@/components/shell/SalonChip';
import { resolveSalonScope } from '@/lib/salon-scope';
import { db } from '@bask/db';

/**
 * The Bask route group. A group (not a path segment) so `/` stays `/` while every
 * salon-facing surface still gets one shell — lanes 2–4 add `(bask)/floor`,
 * `(bask)/customers` and so on and inherit the nav for free.
 *
 * `/compass` and `/dev/*` sit OUTSIDE this group deliberately: Compass is a
 * different product with its own chrome and its own palette, and the dev harnesses
 * are not part of the app.
 *
 * The roster is read here and picked from on the client, because a layout is not
 * given `searchParams` and the demo's salon scope lives in the URL.
 */
export default async function BaskLayout({ children }: { children: ReactNode }) {
  const [salons, owners, fallbackScope] = await Promise.all([
    db.salon.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, slug: true, name: true },
    }),
    db.staff.findMany({
      where: { role: 'owner', salonId: { not: null } },
      select: { salonId: true, firstName: true, lastName: true },
    }),
    resolveSalonScope(),
  ]);

  const ownerBySalon = new Map(
    owners.map((o) => [o.salonId!, `${o.firstName} ${o.lastName}`] as const),
  );

  const roster: SalonIdentity[] = salons.map((salon) => ({
    id: salon.id,
    slug: salon.slug,
    name: salon.name,
    ownerName: ownerBySalon.get(salon.id) ?? salon.name,
  }));

  const fallback: SalonIdentity = roster.find((s) => s.id === fallbackScope?.id) ??
    roster[0] ?? { id: '', slug: '', name: 'Bask', ownerName: 'Bask' };

  return (
    <AppShell roster={roster} fallback={fallback}>
      {children}
    </AppShell>
  );
}
