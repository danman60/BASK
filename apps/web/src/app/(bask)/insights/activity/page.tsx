import { formatLongDate } from '@bask/core';
import { TeachingEmptyState } from '@bask/ui';

import '@/components/lane4/lane4.css';
import { InsightsTabs } from '@/components/lane4/InsightsTabs';
import { Chip, SectionHead } from '@/components/lane4/primitives';
import { loadActivity } from '@/server/insights-data';
import { getDemoSalon } from '@/server/salon';

export const dynamic = 'force-dynamic';

/**
 * "Who did what" — the activity log (five-and-five pick, PRODUCT_SPEC §13).
 *
 * Discounts, voids, dismissed insights, sharing changes and orders, in one
 * place, with a name and a time against each. It reads `ActivityEvent` rows
 * written as the app goes; nothing here is reconstructed after the fact.
 */

const ACTOR_TONE = {
  staff: 'neutral',
  system: 'neutral',
  ai: 'accent',
  uvalux_rep: 'good',
} as const;

export default async function ActivityPage() {
  const salon = await getDemoSalon();
  const rows = await loadActivity(salon);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: salon.timezone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <main className="l4">
      <header className="l4-head">
        <div>
          <p className="eyebrow">Who did what · {formatLongDate(salon.today)}</p>
          <h1 className="l4-title">
            The last <em>{rows.length} things</em> that happened here.
          </h1>
          <p className="l4-sub">
            Discounts, voids, insights set aside, sharing changes, orders sent. Written as it
            happens, so &quot;who changed that?&quot; has an answer without anyone having to
            remember.
          </p>
        </div>
        <InsightsTabs />
      </header>

      <section className="l4-section">
        <SectionHead title="Activity log" />
        <div className="l4-card">
          {rows.length === 0 ? (
            <TeachingEmptyState state="activityLog" />
          ) : (
            rows.map((row) => (
              <div key={row.id} className="l4-log-row">
                <span className="l4-log-when">{formatter.format(row.occurredAt)}</span>
                <span className="l4-log-who">
                  {row.actorLabel}{' '}
                  <Chip tone={ACTOR_TONE[row.actorType as keyof typeof ACTOR_TONE] ?? 'neutral'}>
                    {row.actorType.replace('_', ' ')}
                  </Chip>
                </span>
                <span>
                  {row.action}
                  {row.detail && <span className="l4-stock-meta"> · {row.detail}</span>}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
