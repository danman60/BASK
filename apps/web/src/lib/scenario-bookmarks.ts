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
 * M0 ships the two the plan names. §0.1's full set (Tuesday campaign ready to
 * send · Campaign results in · Inventory low-stock moment · Compass call-list
 * morning · Consent-tier flip) needs the fixture story arcs (step 4) and the real
 * surfaces (M1) to point at.
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
    description: 'Day zero, owner signed in — the Daybreak beat.',
    path: '/',
    clockDays: 0,
    role: 'owner',
  },
  {
    id: 'floor-live',
    label: 'Floor live',
    description: 'Two days in, front desk — the room-board beat.',
    // TARGET FOR MERGE: `/dev/floor` (M0 step 7's room-board harness) does not
    // exist in this lane. Repoint when that route lands; nothing else changes.
    path: '/dev/api',
    clockDays: 2,
    role: 'front_desk',
  },
];

export function findBookmark(id: string): ScenarioBookmark | undefined {
  return SCENARIO_BOOKMARKS.find((bookmark) => bookmark.id === id);
}
