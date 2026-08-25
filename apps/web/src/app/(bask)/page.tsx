import Link from 'next/link';

import {
  ComparisonCard,
  Guided,
  TeachingEmptyState,
  TODAY_UI,
} from '@bask/ui';

import { DEMO_OPPORTUNITIES, DEMO_OUTCOMES } from '@bask/core';

import { WinsFeed } from '@/components/today/WinsFeed';

import { AttentionQueue } from '@/components/today/AttentionQueue';
import { DaybreakLetter } from '@/components/today/DaybreakLetter';
import { OpportunityFeed } from '@/components/today/OpportunityFeed';
import { resolveSalonScope, readVirtualToday, SALON_PARAM } from '@/lib/salon-scope';
import { loadToday } from '@/lib/today-data';

import { dismissInsight, markInsightSeen, restoreInsight } from './actions';

/**
 * Today — the surface the pitch opens on (DESIGN_SPEC §3.1, mockup 01).
 *
 * Grid is `minmax(0,1fr) 320px`, max-width 1180, one scroll. Reading order is the
 * design's argument: the letter, then the ranked cards, then the rail. At 390px
 * the same content re-lays out to mockup 05 — letter, pulse chips, stacked cards —
 * without a second component tree, because the arrangement changes and the
 * information does not.
 *
 * Everything is read from the database on the server. There is no client fetch on
 * this page and no model call anywhere in the request.
 */

// The demo clock moves under the app; a cached Today is a Today that lies on stage.
export const dynamic = 'force-dynamic';

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const salonParam = typeof params[SALON_PARAM] === 'string' ? params[SALON_PARAM] : undefined;

  const salon = await resolveSalonScope(salonParam);
  if (!salon) {
    return (
      <main className="b-shell">
        <TeachingEmptyState state="daybreak" />
      </main>
    );
  }

  const today = await readVirtualToday();
  const scopeQuery = buildScopeQuery(params);
  const { brief, cards, comparison } = await loadToday(salon, today, scopeQuery);


  return (
    <main className="b-shell">
      <section>
        {brief ? (
          <DaybreakLetter greeting={brief.greeting} />
        ) : (
          <TeachingEmptyState state="daybreak" />
        )}

        {/* The Opportunity feed leads Today — money-first, ranked, one-click.
            This is the product's primary interface (brainstorm §23/§29): the
            owner reads dollars and actions, not analytics. The insight queue
            below it stays as the finer-grained "what changed" detail. */}
        <OpportunityFeed opportunities={DEMO_OPPORTUNITIES} outcomes={DEMO_OUTCOMES} />

        {/* The social layer sits directly under the money, and above the
            analytics. Thesis: owners are moved by a salon like theirs having
            already done the thing, in that owner's own words — so the proof
            follows the recommendation instead of being buried on another page. */}
        <WinsFeed />

        <h2 className="b-q-label">
          <span className="b-full">{TODAY_UI.queueHeading}</span>
          <span className="b-short">{TODAY_UI.queueHeadingShort}</span>
        </h2>

        <div className="b-queue">
          <AttentionQueue
            cards={cards}
            onDismissAction={dismissInsight}
            onRestoreAction={restoreInsight}
            onSeenAction={markInsightSeen}
          />
        </div>
      </section>

      <aside className="b-rail">
        {/* The rail deliberately carries NO operational cards. "Today so far"
            (revenue/bookings/in-the-salon-now/rooms-in-use) and "Next up" were
            floor-ops readouts — the same framing the product dropped when Floor
            and Inventory left the nav. Bask is a sales-intelligence layer, not a
            front-desk console; the rail is for comparison and story, and the
            money-first opportunity feed owns the main column. */
        }
        {comparison &&
          (comparison.hasActivity ? (
            <ComparisonCard
              heading={
                <Guided tip="locationCompare" affordance="quiet">
                  {TODAY_UI.comparisonHeading}
                </Guided>
              }
              leftName={comparison.leftName}
              rightName={comparison.rightName}
              metrics={comparison.metrics}
            />
          ) : (
            <section className="card b-rail-card" data-testid="comparison-empty">
              <h4>{TODAY_UI.comparisonHeading}</h4>
              <TeachingEmptyState state="locationCompare" icon="⇄" />
            </section>
          ))}

        <div className="b-story">
          <div className="b-story-tile" aria-hidden />
          <p>
            <strong>{TODAY_UI.storyLead}</strong> {TODAY_UI.storyBody}{' '}
            <Link href={withQuery('/insights', scopeQuery)}>{TODAY_UI.storyAction} →</Link>
          </p>
        </div>
      </aside>
    </main>
  );
}

/** Carries the Presenter Panel's scope (role/theme/salon) onto every outgoing link. */
function buildScopeQuery(params: Record<string, string | string[] | undefined>): string {
  const query = new URLSearchParams();
  for (const key of ['role', 'theme', SALON_PARAM]) {
    const value = params[key];
    if (typeof value === 'string') query.set(key, value);
  }
  return query.toString();
}

function withQuery(path: string, query: string): string {
  return query ? `${path}?${query}` : path;
}
