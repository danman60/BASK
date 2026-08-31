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
 * Five bookmarks, not the seven §0.1 first specified: Floor and Low-stock went
 * with the surfaces they opened when Bask narrowed to salon intelligence. Each one names the PITCH.md beat it recovers, because that is what a
 * presenter is reaching for when they open this list mid-demo.
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
  /* The Floor and Low-stock bookmarks lived here and are GONE, 2026-08-27.
     Bask is salon intelligence — `8e32efc` — and these two opened
     surfaces that are no longer in the nav. Worse, they were the stated reason
     `nav.ts` put Floor and Inventory BACK ("scenario-bookmarks.ts still opens
     them, so they belong in the nav"), so leaving them here keeps a dead
     product decision alive by circular reference. The routes still render if
     something deep-links them; nothing in the pitch does any more. */
  {
    id: 'campaign-results',
    label: 'Campaign results in',
    description: 'Beat 2 — a week on: the loop closes on Today.',
    path: '/',
    /* SIX, not five. Measured 2026-08-27 by actually advancing the clock, which
       nobody had done. The Tuesday campaign SENDS on day 5 (Aug 11, the Tuesday
       — `ARCS.tuesdayCampaign.sendOffsetDays`), so on day 5 the brief is still
       about Monday and reads "21% below your usual Monday". The payoff lands the
       NEXT morning, when Daybreak reads "52% above your usual Tuesday".
       This bookmark is the pitch's payoff moment; parked on day 5 it delivered a
       negative headline and no result. */
    clockDays: 6,
    role: 'owner',
  },
  {
    id: 'compass-morning',
    label: 'Compass call-list morning',
    description: 'Beats 3-4 — the rep\'s ranked calls, with reasons.',
    path: '/compass',
    clockDays: 6,
    role: 'uvalux_rep',
  },
];

export function findBookmark(id: string): ScenarioBookmark | undefined {
  return SCENARIO_BOOKMARKS.find((bookmark) => bookmark.id === id);
}
