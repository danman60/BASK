/**
 * Scenario bookmarks — one-click jumps to pre-staged demo states
 * (IMPLEMENTATION_SPEC §0.1). A bookmark is a named demo-clock position plus a UI
 * deep link, so a fumbled live demo recovers in one keystroke and any segment of
 * the pitch can be rehearsed in isolation.
 *
 * Applying one always resets to day-zero first, then advances — that is what makes
 * a bookmark a POSITION rather than a relative nudge, and it is why two clicks of
 * the same bookmark land in the same state.
 *
 * All seven of §0.1's set are wired now that M1's surfaces exist. Each one names
 * the PITCH.md beat it recovers, because that is what a presenter is reaching for
 * when they open this list mid-demo.
 */

import type { DemoRole } from '@bask/api/roles';

export interface ScenarioBookmark {
  id: string;
  label: string;
  /** What the presenter should see when it lands — shown as the panel's hint. */
  description: string;
  /** Route to deep-link to. */
  path: string;
  /** Days past day-zero this scenario sits at. 0 = fresh reset. */
  clockDays: number;
  /** Role the scenario is told from. */
  role: DemoRole;
}

export const SCENARIO_BOOKMARKS: readonly ScenarioBookmark[] = [
  {
    id: 'morning-brief',
    label: 'Morning brief fresh',
    description: 'Day zero, owner signed in — the cold-open beat.',
    path: '/',
    clockDays: 0,
    role: 'owner',
  },
  {
    id: 'tuesday-campaign',
    label: 'Tuesday campaign ready',
    description: 'Beat 1 — the soft-Tuesday insight, pre-filled in Studio.',
    path: '/marketing',
    clockDays: 0,
    role: 'owner',
  },
  {
    id: 'floor-live',
    label: 'Floor live',
    description: 'Beat 2 — the room board with the shift underway.',
    path: '/floor',
    clockDays: 2,
    role: 'front_desk',
  },
  {
    id: 'inventory-low',
    label: 'Low stock moment',
    description: 'Beat 3 — the bronzer running out, ready to order.',
    path: '/inventory',
    clockDays: 2,
    role: 'owner',
  },
  {
    id: 'campaign-results',
    label: 'Campaign results in',
    description: 'Beat 4 — a week on: the loop closes on Today.',
    path: '/',
    clockDays: 5,
    role: 'owner',
  },
  {
    id: 'compass-morning',
    label: 'Compass call-list morning',
    description: 'Beats 5-6 — the rep\'s ranked calls, with reasons.',
    path: '/compass',
    clockDays: 5,
    role: 'uvalux_rep',
  },
  {
    id: 'consent-flip',
    label: 'Consent tier flip',
    description: 'Beat 7 — the trust screen; flip a tier and Compass narrows.',
    path: '/settings/data-sharing',
    clockDays: 5,
    role: 'owner',
  },
];

export function findBookmark(id: string): ScenarioBookmark | undefined {
  return SCENARIO_BOOKMARKS.find((bookmark) => bookmark.id === id);
}
