import Link from 'next/link';

import {
  ComparisonCard,
  Guided,
  PulseCard,
  PulseChips,
  TeachingEmptyState,
  TODAY_UI,
  type MetricKey,
  type PulseRow,
} from '@bask/ui';

import { AttentionQueue } from '@/components/today/AttentionQueue';
import { DaybreakLetter } from '@/components/today/DaybreakLetter';
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

/** Which explainer belongs to which pulse row. Keyed by the row's stored label. */
const PULSE_METRICS: Record<string, MetricKey> = {
  Revenue: 'revenueToday',
  'Bookings today': 'bookingsToday',
  'In the salon now': 'inSalonNow',
  'Rooms in use': 'roomsInUse',
};

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
  const { brief, cards, nextUp, comparison } = await loadToday(salon, today, scopeQuery);

  const pulseRows: PulseRow[] = brief?.pulse.rows ?? [];

  return (
    <main className="b-shell">
      <section>
        {brief ? (
          <DaybreakLetter greeting={brief.greeting} />
        ) : (
          <TeachingEmptyState state="daybreak" />
        )}

        {/* mockup 05: the pulse sits between the letter and the queue on mobile. */}
        {pulseRows.length > 0 && (
          <div className="b-mobile-only b-pulse-strip">
            <PulseChips rows={pulseRows} label={TODAY_UI.pulseHeading} />
          </div>
        )}

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
        {/* No rows means no brief for this salon yet — the letter's empty state has
            already said so, and a heading over nothing repeats it badly. */}
        <div className="b-desktop-only" hidden={pulseRows.length === 0}>
          <PulseCard
            heading={TODAY_UI.pulseHeading}
            rows={pulseRows}
            explain={(row) =>
              PULSE_METRICS[row.label] ? (
                <Guided metric={PULSE_METRICS[row.label]!} affordance="quiet">
                  {row.label}
                </Guided>
              ) : (
                row.label
              )
            }
          />
        </div>

        <section className="card b-rail-card" data-testid="next-up">
          <h4>{TODAY_UI.nextUpHeading}</h4>
          {nextUp.length > 0 ? (
            nextUp.map((booking) => (
              <div className="b-book" key={booking.id}>
                <time>{booking.time}</time>
                <span className="b-book-who">{booking.who}</span>
                <span className="b-book-what">{booking.what}</span>
                {booking.confirmed && <span className="b-book-dot" aria-hidden />}
              </div>
            ))
          ) : (
            <TeachingEmptyState state="nextUp" icon="◷" />
          )}
        </section>

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
