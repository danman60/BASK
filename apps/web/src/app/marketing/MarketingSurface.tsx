'use client';

import { useSearchParams } from 'next/navigation';

import { StudioBuilder } from './StudioBuilder';
import { StudioHub } from './StudioHub';

export function MarketingSurface() {
  const params = useSearchParams();
  const insightId = params.get('insight');
  const campaignId = params.get('campaign');
  const isNew = params.get('new') === '1';

  if (insightId || campaignId || isNew) {
    // `key` forces a fresh builder when the owner deep-links from one insight to
    // another — otherwise the second campaign inherits the first one's edits.
    return (
      <StudioBuilder
        key={insightId ?? campaignId ?? 'new'}
        insightId={insightId}
        campaignId={campaignId}
      />
    );
  }

  return <StudioHub />;
}
