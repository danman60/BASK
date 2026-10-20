import { allowed, featuresForPath, readFlags } from '@bask/core/flags';

import { InsightsTabsNav } from './InsightsTabsNav';

const SECTIONS = [
  { href: '/insights', label: 'What changed' },
  { href: '/insights/peers', label: 'Peers' },
  { href: '/insights/activity', label: 'Who did what' },
  { href: '/insights/trend', label: 'Where it is heading' },
] as const;

/** Server half: drops tabs whose proposal feature is off (packages/core/src/flags.ts). */
export function InsightsTabs() {
  const flags = readFlags(process.env);
  return (
    <InsightsTabsNav
      sections={SECTIONS.filter((s) => allowed(flags, featuresForPath(s.href)))}
    />
  );
}
