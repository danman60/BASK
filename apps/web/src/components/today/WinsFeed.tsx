'use client';

/**
 * The wins feed on Today — client wrapper around the presentational section.
 *
 * Lives here rather than in `@bask/ui` because it owns the interaction state
 * (which wins the viewer has liked) and formats the fence line. The card and
 * the section stay pure and props-only.
 *
 * The demo data is filtered through the SAME non-compete rule production will
 * use (`isNonCompeting`), rather than being hand-picked to look right. If the
 * filter is wrong, the demo shows it — which is the point of running the real
 * function against fixtures instead of curating a list.
 */

import { useState } from 'react';

import {
  DEFAULT_WIN_FEED_OPTIONS,
  DEMO_WINS,
  DEMO_WIN_ENGAGEMENT,
  DEMO_WIN_NOTES,
  DEMO_WIN_TODAY,
  isNonCompeting,
  rankWins,
  type ViewerContext,
} from '@bask/core';
import { WinsFeedSection, type WinsFeedItem } from '@bask/ui';

/** The demo salon's own position — Toronto, so nearby Ontario towns are excluded. */
const VIEWER: ViewerContext = {
  salonId: 'demo-viewer',
  townLabel: 'Toronto ON',
  latitude: 43.6532,
  longitude: -79.3832,
};

/** Rough coordinates for the demo towns, so the real filter has something to measure. */
const TOWN_COORDS: Record<string, readonly [number, number]> = {
  'Kingston ON': [44.2312, -76.486],
  'Barrie ON': [44.3894, -79.6903],
  'London ON': [42.9849, -81.2453],
  'Sudbury ON': [46.4917, -80.993],
};

function daysAgoLabel(occurredAtDay: number, today: number): string {
  const days = Math.max(0, today - occurredAtDay);
  if (days <= 1) return 'today';
  if (days < 14) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} weeks ago`;
}

export function WinsFeed() {
  const [liked, setLiked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      Object.entries(DEMO_WIN_ENGAGEMENT).map(([id, e]) => [id, e.liked]),
    ),
  );

  const eligible = DEMO_WINS.filter((win) => {
    const coords = TOWN_COORDS[win.townLabel];
    if (!coords) return false;
    return isNonCompeting(VIEWER, win, coords[0], coords[1], DEFAULT_WIN_FEED_OPTIONS);
  });

  const ranked = rankWins(eligible, DEMO_WIN_TODAY, DEFAULT_WIN_FEED_OPTIONS.maxItems);

  const items: WinsFeedItem[] = ranked.map((win) => {
    const engagement = DEMO_WIN_ENGAGEMENT[win.id];
    const isLiked = liked[win.id] ?? false;
    const baseLikes = Number(engagement?.likeLabel ?? '0');
    const wasLiked = engagement?.liked ?? false;
    // Show the count the viewer's own tap implies, without recomputing anything
    // the server owns — the card itself never does arithmetic.
    const shown = baseLikes + (isLiked ? 1 : 0) - (wasLiked ? 1 : 0);
    return {
      id: win.id,
      townLabel: win.townLabel,
      actionLabel: win.actionLabel,
      signalLabel: win.metricLabel,
      metricLabel: win.metricLabel,
      deltaLabel: win.deltaLabel,
      timeLabel: daysAgoLabel(win.occurredAtDay, DEMO_WIN_TODAY),
      daysLabel: `in ${win.daysToResult} days`,
      note: DEMO_WIN_NOTES[win.id] ?? null,
      likeLabel: String(shown),
      commentLabel: engagement?.commentLabel ?? '0',
      liked: isLiked,
      onLike: () => setLiked((prev) => ({ ...prev, [win.id]: !prev[win.id] })),
      onComment: () => undefined,
      onMessage: () => undefined,
      onTryThis: () => undefined,
      tryLabel: 'Try this here',
    };
  });

  return (
    <WinsFeedSection
      heading="What worked for salons like yours"
      blurb="Real actions other owners ran through Bask, and what happened after. Their words, their numbers."
      fenceLabel={`${items.length} salons · none within ${DEFAULT_WIN_FEED_OPTIONS.excludeWithinKm}km of you`}
      items={items}
      emptyLabel="No wins to show yet. As salons near you start acting on their numbers, this fills up."
    />
  );
}
