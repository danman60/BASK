/**
 * Scenario bookmarks — one-click jumps to pre-staged demo states
 * (IMPLEMENTATION_SPEC §0.1). A bookmark is a named demo-clock position plus a UI
 * deep link, so a fumbled live demo recovers in one keystroke and any segment of
 * the pitch can be rehearsed in isolation.
 *
 * WHAT APPLYING ONE ACTUALLY DOES — read this before trusting `clockDays`.
 *
 * It calls `demo.jumpTo`, which is FORWARD-ONLY: the clock advances by the
 * difference between today and `clockDays`, or does not move at all if the
 * bookmark sits at or behind today. It then deep-links to `path` in `role`.
 *
 * It does NOT rewind. The earlier design reset the clock to day zero and
 * re-advanced, on the belief that this made a bookmark a POSITION rather than a
 * relative nudge. It did not: `demo.reset` moves the date pointer and leaves
 * every row the pipeline wrote — visits, sales, settled campaigns, insights,
 * briefs — exactly where it was. Re-advancing therefore re-ran those days on top
 * of a world that had already lived them, so two clicks of one bookmark produced
 * two different states — the precise opposite of the guarantee.
 *
 * So the honest guarantee is narrower, and it is the one that matters mid-demo:
 * pressing the same bookmark twice is IDEMPOTENT (the second press moves the
 * clock zero days and is a pure navigation), and no bookmark can ever silently
 * un-live a day. Going BACKWARDS lands you on that beat's screen at the current
 * day, not at the past. The only true rewind is `pnpm demo:reset` in a terminal,
 * which rebuilds all 36,351 rows in ~32s.
 *
 * Practical consequence for rehearsal: run the beats in ascending `clockDays`
 * order — which is the order PITCH.md tells them in.
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
  /**
   * Days past fixture day-zero this scenario is written for. The jump advances
   * TO this day if the clock is behind it, and leaves the clock alone if it is
   * already at or past it — see the module note.
   */
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
    description: 'Beat 3 — the Hempz bronzer running out, ready to order.',
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
