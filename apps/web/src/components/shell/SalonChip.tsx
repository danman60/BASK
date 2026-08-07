'use client';

/**
 * The salon name + avatar in the topbar.
 *
 * Client-side because App Router layouts are not given `searchParams` — they
 * render above the page in the tree — and the demo's scope (`?salon=`) lives in
 * the URL. Rather than hoist the whole shell into every page, the layout hands
 * this component the roster it already had to read, and the component picks.
 *
 * The roster is the seeded salon list: a dozen rows of `{slug, name, owner}`, so
 * shipping it to the client is cheaper than a round trip and has nothing private
 * in it (names of demo fixtures). No auth exists here either way — scope is the
 * URL until M3.
 */

import { useSearchParams } from 'next/navigation';

import { SHELL_UI } from '@bask/ui';

import { initialsOf } from './nav';

export interface SalonIdentity {
  slug: string;
  id: string;
  name: string;
  ownerName: string;
}

export function SalonChip({
  roster,
  fallback,
}: {
  roster: readonly SalonIdentity[];
  fallback: SalonIdentity;
}) {
  const params = useSearchParams();
  const wanted = params.get('salon');
  const salon =
    (wanted ? roster.find((s) => s.slug === wanted || s.id === wanted) : undefined) ?? fallback;

  return (
    <div className="b-topbar-right">
      <span className="b-salon-chip">{salon.name}</span>
      <div className="b-avatar" title={SHELL_UI.avatarLabel(salon.ownerName)}>
        <span className="b-sr">{SHELL_UI.avatarLabel(salon.ownerName)}</span>
        <span aria-hidden>{initialsOf(salon.ownerName)}</span>
      </div>
    </div>
  );
}
