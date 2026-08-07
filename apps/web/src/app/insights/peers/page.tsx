import Link from 'next/link';
import { MIN_COHORT_SIZE, formatCurrency, formatLongDate } from '@bask/core';
import { db } from '@bask/db';
import { Guided, TeachingEmptyState, WhisperNote } from '@bask/ui';

import '@/components/lane4/lane4.css';
import { GapSlider } from '@/components/lane4/GapSlider';
import { InsightsTabs } from '@/components/lane4/InsightsTabs';
import { Chip, SectionHead } from '@/components/lane4/primitives';
import { loadSalonFacts } from '@/server/facts';
import { COHORTS, loadPeers, type PeerGap } from '@/server/peers';
import { getDemoSalon } from '@/server/salon';

import { createStaffChallengeAction, requestCoachingAction } from '../actions';

export const dynamic = 'force-dynamic';

/** Campaign deep-links per gap — Lane 3 owns the target. */
const CAMPAIGN_GOALS: Record<PeerGap['key'], string> = {
  attachment: 'retail_attachment',
  utilisation: 'fill_quiet_hours',
  membershipRate: 'membership_conversion',
  averageBasket: 'retail_attachment',
};

const COACHING_TOPICS: Record<PeerGap['key'], string> = {
  attachment: 'Retail attachment coaching',
  utilisation: 'Filling quiet hours',
  membershipRate: 'Converting regulars into members',
  averageBasket: 'Retail attachment coaching',
};

export default async function PeersPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>;
}) {
  const params = await searchParams;
  const salon = await getDemoSalon();
  const facts = await loadSalonFacts(salon);
  const [peers, openRequests] = await Promise.all([
    loadPeers(salon, facts),
    db.coachingRequest.findMany({
      where: { salonId: salon.salonId, state: { in: ['open', 'acknowledged', 'in_progress'] } },
      select: { topic: true },
    }),
  ]);

  const askedAbout = new Set(openRequests.map((r) => r.topic));

  if (!peers.eligible) {
    return (
      <main className="l4">
        <header className="l4-head">
          <div>
            <p className="eyebrow">Peers · {formatLongDate(salon.today)}</p>
            <h1 className="l4-title">
              Peers is <em>switched off</em> while sharing is private.
            </h1>
          </div>
          <InsightsTabs />
        </header>
        <div className="l4-card">
          <TeachingEmptyState state="peersPrivate" />
        </div>
      </main>
    );
  }

  const selectedKey = params.cohort ?? COHORTS[0]!.key;
  const selected = peers.cohorts.find((c) => c.definition.key === selectedKey) ?? peers.cohorts[0]!;

  return (
    <main className="l4">
      <header className="l4-head">
        <div>
          <p className="eyebrow">Peers · {formatLongDate(salon.today)}</p>
          <h1 className="l4-title">
            {selected.suppressed ? (
              <>
                That group is <em>too small</em> to show.
              </>
            ) : selected.gaps.length > 0 ? (
              <>
                <em>{formatCurrency(selected.gaps[0]!.halfGapMonthly)} a month</em> is sitting in
                the nearest gap.
              </>
            ) : (
              <>
                You are <em>ahead</em> of businesses like yours on every measure.
              </>
            )}
          </h1>
          <p className="l4-sub">
            Salons that agreed to share summary numbers are lined up against yours. Nobody is
            named, nothing about your customers goes anywhere, and a group of fewer than{' '}
            {MIN_COHORT_SIZE} salons is never shown at all.
          </p>
        </div>
        <InsightsTabs />
      </header>

      {/* ------------------------------------------------- cohort chips */}
      <div className="l4-actions" style={{ marginBottom: 8 }}>
        {peers.cohorts.map((cohort) => (
          <Link
            key={cohort.definition.key}
            href={`/insights/peers?cohort=${cohort.definition.key}`}
            className="l4-tab"
            data-active={cohort.definition.key === selected.definition.key}
            style={{
              border: '1px solid var(--line)',
              background:
                cohort.definition.key === selected.definition.key ? 'var(--card)' : 'var(--paper-2)',
            }}
          >
            {cohort.definition.label}
            <span
              className="num"
              style={{
                color: cohort.suppressed ? 'var(--ink-faint)' : 'var(--primary)',
                fontWeight: 700,
              }}
            >
              n={cohort.contributorCount}
            </span>
          </Link>
        ))}
        <Guided tip="cohortSize">
          <span className="l4-workings">what n means</span>
        </Guided>
      </div>
      <p className="l4-note">{selected.definition.description}</p>

      {selected.suppressed ? (
        <section className="l4-section">
          <div className="l4-suppressed">
            <p className="eyebrow" style={{ color: 'var(--ink-faint)' }}>
              Hidden on purpose
            </p>
            <h2 className="l4-section-title" style={{ marginTop: 8 }}>
              Only {selected.contributorCount} salons are in this group.
            </h2>
            <p className="l4-note" style={{ margin: '10px auto 0', maxWidth: '52ch' }}>
              Below {selected.minimum} salons, anyone in the group could work out whose numbers
              were whose — so nothing is shown, not even to us. Pick a wider group above and the
              comparison comes back.
            </p>
            <div className="l4-actions" style={{ justifyContent: 'center', marginTop: 18 }}>
              <Guided tip="cohortSuppressed">
                <span className="l4-workings">Why this rule exists</span>
              </Guided>
            </div>
          </div>
        </section>
      ) : (
        <>
          <WhisperNote note="peersAnonymous" count={selected.contributorCount} />

          {/* ------------------------------------------------ gap cards */}
          <section className="l4-section">
            <SectionHead
              title="Where there is room"
              note="A gap is an amount of money at your own traffic, not a grade. Drag the target to see what any given level is worth."
            />

            {selected.gaps.length === 0 ? (
              <div className="l4-card">
                <p className="l4-evidence">
                  Nothing in this group is ahead of you today. That is worth saying out loud — and
                  worth checking again once the next fortnight lands.
                </p>
              </div>
            ) : (
              <div className="l4-grid" style={{ gap: 'var(--space-6)' }}>
                {selected.gaps.map((gap) => (
                  <article key={gap.key} className="l4-card">
                    <div className="l4-gap-head">
                      <div>
                        <p className="l4-stat-label">
                          <Guided metric={gap.metricKey}>{gap.label}</Guided>
                        </p>
                        <p className="l4-evidence" style={{ marginTop: 6 }}>
                          {gap.sentence}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Chip tone="neutral">
                          <span className="num">{selected.contributorCount}</span>&nbsp;salons
                        </Chip>
                        <p className="l4-workings" style={{ marginTop: 6 }}>
                          top quarter reach <span className="num">{gap.cohortTopQuartile}%</span>
                        </p>
                      </div>
                    </div>

                    <div style={{ marginTop: 20 }}>
                      <GapSlider gap={gap} />
                    </div>

                    <div className="l4-actions" style={{ marginTop: 22 }}>
                      <form action={createStaffChallengeAction}>
                        <input type="hidden" name="metric" value={gap.key} />
                        <input type="hidden" name="label" value={gap.label} />
                        <input type="hidden" name="target" value={Math.round(gap.cohortMedian)} />
                        <button type="submit" className="btn btn-primary">
                          Set the team a {Math.round(gap.cohortMedian)}% target
                        </button>
                      </form>

                      <Link
                        className="btn btn-quiet"
                        href={`/marketing?goal=${CAMPAIGN_GOALS[gap.key]}&from=peers&gap=${gap.key}`}
                      >
                        Write a campaign for it
                      </Link>

                      {askedAbout.has(COACHING_TOPICS[gap.key]) ? (
                        <Chip tone="good" dot>
                          Your rep has been asked
                        </Chip>
                      ) : (
                        <form action={requestCoachingAction}>
                          <input type="hidden" name="topic" value={COACHING_TOPICS[gap.key]} />
                          <input
                            type="hidden"
                            name="message"
                            value={`We sit at ${gap.yourValue}% against ${gap.cohortMedian}% for salons like ours. Closing half of that is about ${formatCurrency(
                              gap.halfGapMonthly,
                            )} a month here.`}
                          />
                          <button type="submit" className="btn btn-quiet">
                            Ask UVALUX for a hand
                          </button>
                        </form>
                      )}
                    </div>
                    <WhisperNote note="coachingRequestVisible" />
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ------------------------------------------- you're winning */}
          {selected.winning && (
            <section className="l4-section">
              <SectionHead title="Where you are already ahead" />
              <div className="l4-card">
                <div className="l4-gap-head">
                  <div>
                    <p className="l4-stat-label">
                      <Guided metric={selected.winning.metricKey}>{selected.winning.label}</Guided>
                    </p>
                    <p className="l4-title num" style={{ fontSize: 'var(--text-2xl)' }}>
                      {selected.winning.yourValue}%
                    </p>
                    <p className="l4-evidence" style={{ marginTop: 6 }}>
                      {selected.winning.strengthSentence}
                    </p>
                  </div>
                  <Chip tone="good" dot>
                    Ahead of {selected.winning.percentile}% of them
                  </Chip>
                </div>
                <p className="l4-workings" style={{ marginTop: 12 }}>
                  Whatever you are doing here is worth keeping. It is also the thing to lean on
                  when you go after the gaps above — the team already knows it works.
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
