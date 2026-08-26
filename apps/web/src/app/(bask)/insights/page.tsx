import Link from 'next/link';
import { formatCurrency, formatLongDate } from '@bask/core';
import { Guided, TeachingEmptyState, WhisperNote } from '@bask/ui';

import '@/components/lane4/lane4.css';
import { PageContainer } from '@/components/page/PageContainer';
import { InsightsTabs } from '@/components/lane4/InsightsTabs';
import { Chip, EvidenceSentence, SectionHead, Sparkline, StatRow } from '@/components/lane4/primitives';
import { UtilizationHeatmap } from '@/components/lane4/UtilizationHeatmap';
import { actionHref } from '@/lib/today-data';
import { loadSalonFacts } from '@/server/facts';
import { loadInsightsView, WHAT_CHANGED_DAYS } from '@/server/insights-data';
import { getDemoSalon } from '@/server/salon';

export const dynamic = 'force-dynamic';

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ salon?: string }>;
}) {
  // Honour `?salon=` exactly as Today does — before this, a deep link showed
  // two different salons on the two screens.
  const salon = await getDemoSalon((await searchParams).salon);
  const facts = await loadSalonFacts(salon);
  const view = await loadInsightsView(salon, facts);

  const areas = [view.areas.revenue, view.areas.retail, view.areas.memberships, view.areas.campaigns];

  return (
    <PageContainer>
      <header className="l4-head">
        <div>
          <p className="eyebrow">Insights · {formatLongDate(salon.today)}</p>
          <h1 className="l4-title">
            {view.whatChanged.length > 0 ? (
              <>
                <em>{view.whatChanged.length} things</em> moved in the last fortnight.
              </>
            ) : (
              <>
                Nothing <em>unusual</em> in the last fortnight.
              </>
            )}
          </h1>
          <p className="l4-sub">
            The same reading Bask does every morning, over {WHAT_CHANGED_DAYS} days instead of
            one. Anything you set aside on Today stays set aside here.
          </p>
        </div>
        <InsightsTabs />
      </header>

      {/* ------------------------------------------------- what changed */}
      <section className="l4-section">
        <SectionHead
          title="What changed"
          note={
            view.dismissedCount > 0
              ? `${view.dismissedCount} more were set aside and are not shown.`
              : undefined
          }
        />
        {view.whatChanged.length === 0 ? (
          <div className="l4-card">
            <TeachingEmptyState state="insights" />
          </div>
        ) : (
          <div className="l4-grid l4-grid-2">
            {view.whatChanged.map((item) => (
              <article key={item.id} className="l4-card">
                <div className="l4-rail" data-severity={item.severity}>
                  <div className="l4-gap-head">
                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{item.title}</h3>
                    {item.evidence && (
                      <Chip tone={item.evidence.impact.tone === 'opportunity' ? 'good' : 'accent'}>
                        {item.evidence.impact.chipLabel}
                      </Chip>
                    )}
                  </div>
                  {item.evidence ? (
                    <EvidenceSentence text={item.evidence.sentence} />
                  ) : (
                    <p className="l4-evidence">{item.summary}</p>
                  )}

                  {item.evidence?.series && (
                    <Sparkline
                      points={item.evidence.series.points}
                      label={`${item.evidence.series.label} over time`}
                    />
                  )}

                  {item.evidence && item.evidence.contributingFactors.length > 0 && (
                    <ul style={{ margin: '12px 0 0', paddingLeft: 18 }}>
                      {item.evidence.contributingFactors.slice(0, 3).map((factor) => (
                        <li key={factor.key} className="l4-workings">
                          <span style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>
                            {factor.label}:
                          </span>{' '}
                          {factor.detail}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="l4-actions" style={{ marginTop: 16 }}>
                    <Link
                      className="btn btn-primary"
                      href={actionHref(item.linkedActionType, item.id, '')}
                    >
                      {String(
                        (item.linkedActionRef as Record<string, unknown>)?.primaryActionLabel ??
                          'Look into this',
                      )}
                    </Link>
                    <span className="l4-workings">
                      Found on {item.forDate}
                      {item.evidence ? ` · ${item.evidence.impact.basis}` : ''}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------- metric areas */}
      <section className="l4-section">
        <SectionHead
          title="The numbers behind it"
          note="Each chart is here to hold up one sentence. If the sentence is not worth saying, the chart is not worth drawing."
        />
        <div className="l4-grid l4-grid-2">
          {areas.map((area) => (
            <div key={area.key} className="l4-card">
              <div className="l4-gap-head">
                <div>
                  <p className="l4-stat-label">
                    {area.key === 'retail' ? (
                      <Guided metric="retailAttachment">{area.label}</Guided>
                    ) : area.key === 'memberships' ? (
                      <Guided metric="membershipRevenue">{area.label}</Guided>
                    ) : (
                      area.label
                    )}
                  </p>
                  <p className="l4-title num" style={{ fontSize: 'var(--text-2xl)' }}>
                    {area.value}
                  </p>
                </div>
                {area.changePercent !== null && (
                  <Chip tone={area.sentiment}>
                    {area.changePercent >= 0 ? '+' : ''}
                    {area.changePercent}
                    {area.key === 'retail' ? ' points' : '%'}
                  </Chip>
                )}
              </div>
              {area.series && area.series.length > 1 && (
                <Sparkline
                  points={area.series}
                  stroke={area.sentiment === 'bad' ? 'var(--primary)' : 'var(--gold)'}
                  label={`${area.label} over time`}
                />
              )}
              <p className="l4-evidence" style={{ marginTop: 10 }}>
                {area.sentence}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- heatmap */}
      <section className="l4-section" id="utilisation">
        <SectionHead
          title={<Guided metric="roomUtilisation">How full your rooms are</Guided>}
          note="Every session that actually ran, laid out by hour and weekday, against the sessions your open rooms could have taken."
        />
        <div className="l4-card">
          <UtilizationHeatmap heatmap={view.heatmap} />
        </div>
      </section>

      {/* ------------------------------------------------------- staff */}
      <section className="l4-section">
        <SectionHead
          title="Your team at the counter"
          note="Nobody is ranked here. These are the two weeks just gone, so a quiet fortnight is a quiet fortnight — not a verdict on a person."
        />
        <div className="l4-grid l4-grid-2">
          {view.staff.map((member) => (
            <div key={member.staffId} className="l4-card">
              <div className="l4-gap-head">
                <div>
                  <p style={{ fontWeight: 600, fontSize: 'var(--text-md)' }}>{member.name}</p>
                  <p className="l4-stock-meta">{member.visits} sessions served</p>
                </div>
                <Chip tone={member.strength ? 'good' : 'neutral'}>
                  <span className="num">{member.attachmentRate}%</span> attach
                </Chip>
              </div>
              <div style={{ marginTop: 12 }}>
                <StatRow
                  label={<Guided metric="salesPerShift">Product sales per shift</Guided>}
                  value={formatCurrency(member.salesPerShift)}
                />
                <StatRow label="Shifts with a sale" value={member.shifts} />
                <StatRow
                  label="Two weeks before"
                  value={`${member.baselineRate}%`}
                  hint="same measure"
                />
              </div>
              <p className="l4-workings" style={{ marginTop: 10 }}>
                {member.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- campaigns */}
      <section className="l4-section">
        <SectionHead
          title="Campaigns"
          note="What each one cost you in messages and what came back through the door."
        />
        <div className="l4-card">
          {view.campaigns.length === 0 ? (
            <TeachingEmptyState state="campaigns" />
          ) : (
            view.campaigns.map((campaign) => (
              <div key={campaign.id} className="l4-stat-row">
                <span>
                  <span style={{ fontWeight: 600 }}>{campaign.name}</span>{' '}
                  <Chip tone={campaign.state === 'measured' ? 'good' : 'neutral'}>
                    {campaign.state}
                  </Chip>
                  <span className="l4-stock-meta">
                    {campaign.recipients !== null
                      ? ` · went to ${campaign.recipients} people`
                      : ''}
                    {campaign.bookings !== null ? ` · ${campaign.bookings} bookings` : ''}
                  </span>
                </span>
                <span className="l4-stat-value num">
                  {campaign.revenue === null ? '—' : formatCurrency(campaign.revenue)}
                </span>
              </div>
            ))
          )}
        </div>
        <WhisperNote note="figuresFromYourTill" />
      </section>
    </PageContainer>
  );
}
