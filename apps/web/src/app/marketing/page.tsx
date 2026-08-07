import { Suspense } from 'react';

import { MarketingSurface } from './MarketingSurface';
import './studio.css';

export const metadata = {
  title: 'Studio · Bask',
};

/**
 * `/marketing` — Studio.
 *
 * Three entry points land on this one route, which is why the branch is here
 * and not in three separate pages:
 *   `?insight=<id>`  deep-link from an insight card (Lane 1 links here)
 *   `?campaign=<id>` reopen an existing draft
 *   `?new=1`         from scratch
 * Anything else is the hub: Idea Shelf, campaigns, calendar.
 */
export default function MarketingPage() {
  return (
    // useSearchParams needs a Suspense boundary or the whole route opts out of
    // prerendering (the same reason the Presenter Panel is wrapped in the root
    // layout).
    <Suspense fallback={null}>
      <MarketingSurface />
    </Suspense>
  );
}
