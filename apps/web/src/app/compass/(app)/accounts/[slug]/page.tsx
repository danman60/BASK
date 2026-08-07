'use client';

/**
 * Account detail (PRODUCT_SPEC §14) — trends, equipment profile, coaching log,
 * and the **timeline** where Lane 4's draft orders and coaching requests arrive.
 *
 * The timeline's design rule: entries the SALON initiated are marked amber and
 * read in their voice ("Asked for coaching — …"); entries UVALUX made read as
 * records of our own calls. That distinction is the "their request, not just our
 * signal" register from DESIGN_SPEC §5, carried past the Call List into the
 * place a rep actually researches an account.
 *
 * At the private tier, the salon-initiated half of the timeline is structurally
 * absent — the filter dropped `draftOrders` and `coachingRequests`, so there is
 * nothing to hide and nothing to leak.
 */

import type { TrendDirection } from '@bask/core';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

import {
  BAND_LABEL,
  BandDot,
  CompassEmpty,
  ConsentBadge,
  StatRow,
  StatusChip,
  SuggestBlock,
  TrendArrow,
  Whisper,
} from '@/components/compass/primitives';
import { EvidenceTileRow } from '@/components/compass/primitives';
import { ROLE_PARAM } from '@/lib/demo-scope';
import { trpc } from '@/lib/trpc';

const STAMP = new Intl.DateTimeFormat('en-CA', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/New_York',
});

function stamp(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : STAMP.format(date);
}

export default function AccountDetailPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const role = searchParams.get(ROLE_PARAM) ?? 'uvalux_rep';
  const slug = params.slug;

  const detail = trpc.compass.account.useQuery({ slug }, { enabled: Boolean(slug) });

  if (detail.error) {
    return <CompassEmpty title="That account could not load" body={detail.error.message} />;
  }
  if (!detail.data) return <p className="cp-note">Reading the account…</p>;

  const { account, consentTier, envelope, timeline, factors, suggestion, status, daysSinceContact } =
    detail.data;
  const isPrivate = consentTier === 'private';

  return (
    <>
      <div className="cp-head">
        <h1>{account.salonName}</h1>
        <p>
          {account.region} · {envelope.accountNumber ?? 'No account number'} ·{' '}
          {envelope.repName ?? 'Unassigned'}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)', alignItems: 'center' }}>
          <ConsentBadge tier={consentTier} />
          {/* No status chip at Private: a chip is an assessment, and we have not
              assessed them. Showing "Steady" here would be Compass inventing a
              read it is not entitled to. */}
          {!isPrivate && <StatusChip status={status} />}
          <Link
            className="cp-btn cp-btn--sec"
            href={`/compass?${ROLE_PARAM}=${role}`}
            style={{ marginLeft: 'auto' }}
          >
            Back to the call list
          </Link>
        </div>
      </div>

      {isPrivate && (
        <div className="cp-empty" style={{ marginBottom: 'var(--space-8)' }}>
          <h3>This salon shares its name and nothing else</h3>
          <p>
            They chose Private in Bask. UVALUX sees that they exist, where they are, and what
            equipment it sold them — no trends, no bands, no signals. If you want to know how they
            are doing, call and ask.
          </p>
        </div>
      )}

      {!isPrivate && (
        <>
          <section className="cp-section">
            <header>
              <h2>What we can see</h2>
              <p>Derived and banded. Nothing here is a figure from their books.</p>
            </header>

            <EvidenceTileRow tiles={account.evidenceTiles ?? []} />

            {suggestion && (
              <SuggestBlock lead={suggestion.lead}>
                {suggestion.body}
                {account.signalHeadline ? ` ${account.signalHeadline}.` : ''}
              </SuggestBlock>
            )}

            <div className="cp-grid cp-grid--2" style={{ marginTop: 'var(--space-5)' }}>
              <div className="cp-card">
                <h3>Trends</h3>
                <StatRow label="Sales" value={trendValue(account.revenueTrendDirection)} />
                <StatRow label="Memberships" value={trendValue(account.membershipTrendDirection)} />
                <StatRow
                  label="Retail vs. peers"
                  value={BAND_WORD[account.retailAttachmentBand ?? 'unknown']}
                />
                <StatRow
                  label="Room utilisation"
                  value={BAND_WORD[account.utilizationBand ?? 'unknown']}
                />
                <StatRow
                  label="Cancellation risk"
                  value={CHURN_WORD[account.churnRiskBand ?? 'unknown']}
                />
                <StatRow
                  label="Since their last order"
                  value={
                    account.orderRecencyDays !== null && account.orderRecencyDays !== undefined
                      ? `${account.orderRecencyDays} days`
                      : 'Not shared'
                  }
                />
                <StatRow
                  label="Since you last spoke"
                  value={daysSinceContact !== null ? `${daysSinceContact} days` : '—'}
                />
              </div>

              <div className="cp-card">
                <h3>Health band</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <BandDot band={account.healthBand ?? 'unknown'} />
                  <strong>{BAND_LABEL[account.healthBand ?? 'unknown']}</strong>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {factors.map((factor, index) => (
                    <li key={index} className="cp-note">
                      · {factor}
                    </li>
                  ))}
                </ul>
                {(account.peerGaps ?? []).map((gap) => (
                  <Whisper key={gap.metric}>
                    {gap.label}: {BAND_WORD[gap.band]} — across {gap.cohortN} salons.
                  </Whisper>
                ))}
              </div>
            </div>
          </section>

          <section className="cp-section">
            <header>
              <h2>Equipment</h2>
              <p>What UVALUX sold them. This is ours to know at every sharing level.</p>
            </header>
            <div className="cp-card">
              <StatRow label="Rooms" value={account.roomCount ?? 'Not recorded'} />
              <StatRow
                label="Room types"
                value={
                  account.equipmentProfile?.roomTypes.length
                    ? account.equipmentProfile.roomTypes.join(', ')
                    : 'Not recorded'
                }
              />
              <StatRow label="Running Bask" value={ADOPTION_WORD[account.softwareAdoption ?? 'dormant']} />
              <StatRow label="Last active in Bask" value={account.lastActiveAt ?? '—'} />
            </div>
          </section>
        </>
      )}

      <section className="cp-section">
        <header>
          <h2>Timeline</h2>
          <p>
            Their orders and their coaching requests land here alongside every contact we have logged.
          </p>
        </header>
        <div className="cp-card">
          {timeline.length === 0 ? (
            <p className="cp-note">
              Nothing yet. Orders they send from Bask and coaching they ask for will appear here, along
              with every call you log.
            </p>
          ) : (
            <div className="cp-timeline">
              {timeline.map((entry) => (
                <div className="cp-tl-entry" key={entry.id}>
                  <span className={`cp-tl-mark${entry.theirs ? ' cp-tl-mark--theirs' : ''}`} />
                  <div className="cp-tl-body">
                    <div className="t">{entry.title}</div>
                    <div className="d">
                      {stamp(entry.at)}
                      {entry.theirs ? ' · their move' : ' · ours'}
                    </div>
                    {entry.body && <div className="b">{entry.body}</div>}
                    {entry.detail.length > 0 && (
                      <ul>
                        {entry.detail.map((line, index) => (
                          <li key={index}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/**
 * On a detail page a bare arrow next to "Memberships" reads as a rendering bug.
 * The arrow belongs in a dense roster; here the word carries it, and "Not shared"
 * is said out loud rather than implied by a dot.
 */
function trendValue(direction: TrendDirection | undefined) {
  if (!direction || direction === 'unknown') return 'Not shared';
  return (
    <>
      <TrendArrow direction={direction} /> {TREND_WORD[direction]}
    </>
  );
}

const TREND_WORD: Record<string, string> = {
  up: 'Up',
  down: 'Down',
  flat: 'Holding',
};

const BAND_WORD: Record<string, string> = {
  ahead: 'Ahead of peers',
  in_line: 'In line with peers',
  behind: 'Behind peers',
  unknown: 'Not shared',
};

const CHURN_WORD: Record<string, string> = {
  low: 'Low',
  moderate: 'Worth watching',
  elevated: 'Elevated',
  unknown: 'Not shared',
};

const ADOPTION_WORD: Record<string, string> = {
  active: 'Yes, actively',
  onboarding: 'Getting set up',
  dormant: 'Not lately',
};
