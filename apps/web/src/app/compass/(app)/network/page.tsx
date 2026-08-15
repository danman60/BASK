'use client';

/**
 * Network — "this is Nick's screen" (PRODUCT_SPEC §14).
 *
 * Health distribution where **every band expands to its factors**. That is
 * Principle 2 made literal: no naked scores anywhere on this page. A band is the
 * headline, the factors are the reasons, and the underlying health score is not
 * in the payload at all — the consent filter never let it out.
 *
 * The three Signals cards are folded in here rather than getting their own
 * destination (M1 scope). Each is a rollup across the network with its
 * contributor count shown; none is a window onto a single salon.
 */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { NetworkMap } from '@/components/compass/NetworkMap';
import { BAND_LABEL, BandDot, CompassEmpty, ConsentBadge } from '@/components/compass/primitives';
import { ROLE_PARAM } from '@/lib/demo-scope';
import { trpc } from '@/lib/trpc';

const BAND_ORDER = ['thriving', 'steady', 'needs_attention', 'unknown'] as const;

const BAND_BLURB: Record<string, string> = {
  thriving: 'Growing on more than one measure. These are expansion conversations.',
  steady: 'Nothing outside their normal range. Relationship calls, not rescues.',
  needs_attention: 'At least one measure has moved the wrong way for long enough to matter.',
  unknown: 'These salons share their name and nothing else. That is their choice, and it holds.',
};

export default function NetworkPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get(ROLE_PARAM) ?? 'uvalux_rep';
  const network = trpc.compass.network.useQuery();

  if (network.error) {
    return <CompassEmpty title="Network could not load" body={network.error.message} />;
  }
  if (!network.data) {
    return <p className="cp-note">Reading the network…</p>;
  }

  const { salons, distribution, byRegion, adoption, signalCards, cohort } = network.data;
  const maxRegion = Math.max(...byRegion.map((entry) => entry.count), 1);

  return (
    <>
      <div className="cp-head">
        <h1>
          <em>{adoption.total} salons</em> across the network.
        </h1>
        <p>
          {adoption.sharingSignals} share business signals, {adoption.benchmarksOnly} take part in
          benchmarks only, and {adoption.private} share nothing but their name. Every comparison below
          is drawn from {cohort.n} contributing salons.
        </p>
      </div>

      <section className="cp-section">
        <header>
          <h2>How the network is doing</h2>
          <p>Open a band to see what put those salons in it. There is no score behind the band.</p>
        </header>
        <div className="cp-grid cp-grid--2">
          {BAND_ORDER.map((band) => {
            const entry = distribution.find((item) => item.band === band);
            if (!entry) return null;
            const inBand = salons.filter((salon) =>
              band === 'unknown'
                ? salon.account.healthBand === undefined
                : salon.account.healthBand === band,
            );
            return (
              <details className="cp-band" key={band}>
                <summary>
                  <BandDot band={band} />
                  <span className="cp-band-count num">{entry.count}</span>
                  <span className="cp-band-label">{BAND_LABEL[band]}</span>
                  <span className="cp-band-more">Why ▾</span>
                </summary>
                <div className="cp-band-body">
                  <p className="cp-note">{BAND_BLURB[band]}</p>
                  {inBand.map((salon) => (
                    <div className="cp-band-salon" key={salon.envelope.accountId}>
                      <span className="n">
                        <Link
                          href={`/compass/accounts/${salon.envelope.salonSlug}?${ROLE_PARAM}=${role}`}
                          style={{ color: 'inherit' }}
                        >
                          {salon.account.salonName}
                        </Link>
                      </span>{' '}
                      <span className="cp-loc">{salon.account.region}</span>
                      {salon.factors.length > 0 ? (
                        <ul>
                          {salon.factors.map((factor, index) => (
                            <li key={index}>{factor}</li>
                          ))}
                        </ul>
                      ) : (
                        <ul>
                          <li>Shares name only — nothing to explain</li>
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section className="cp-section">
        <header>
          <h2>What the network is telling us</h2>
          <p>
            Rollups across every salon sharing signals — counts, never names. A trend under{' '}
            {'the minimum cohort'} is suppressed rather than shown thin.
          </p>
        </header>
        <div className="cp-grid cp-grid--3">
          {signalCards.map((card) => (
            <div className="cp-card" key={card.key}>
              <h3>{card.title}</h3>
              <p>{card.suppressed ? 'Not enough salons are sharing to say anything yet.' : card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header>
          <h2>Where they are</h2>
          <p>Twelve salons across four provinces.</p>
        </header>
        <div className="cp-card cp-map-card">
          <NetworkMap
            salons={salons.map((salon) => ({
              id: salon.envelope.accountId,
              name: salon.account.salonName ?? 'Account',
              region: salon.account.region ?? null,
              band: salon.account.healthBand ?? 'unknown',
            }))}
          />
          <ul className="cp-map-key">
            {BAND_ORDER.map((band) => (
              <li key={band}>
                <BandDot band={band} /> {BAND_LABEL[band]}
              </li>
            ))}
          </ul>
        </div>
        <div className="cp-card cp-regions">
          {byRegion.map((entry) => (
            <div className="cp-region" key={entry.region}>
              <span>{entry.region}</span>
              <span className="bar">
                <span style={{ width: `${(entry.count / maxRegion) * 100}%` }} />
              </span>
              <span className="n">{entry.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header>
          <h2>Adoption</h2>
          <p>How much of the book is running Bask, and how much of it shares anything back.</p>
        </header>
        <div className="cp-grid cp-grid--3">
          <div className="cp-card">
            <h3>{adoption.active} active</h3>
            <p>Open and trading. {adoption.onboarding} still onboarding, {adoption.dormant} paused.</p>
          </div>
          <div className="cp-card">
            <h3>{adoption.sharingSignals} sharing signals</h3>
            <p>
              These are the accounts a rep can prepare for. The rest are a phone call and a question.
            </p>
          </div>
          <div className="cp-card">
            <h3>{adoption.private} private</h3>
            <p>
              Sharing nothing beyond their name — and the network still works. That is the promise
              holding up in practice.
            </p>
          </div>
        </div>
      </section>

      <section className="cp-section">
        <header>
          <h2>Every account</h2>
        </header>
        <div className="cp-card" style={{ padding: 'var(--space-5) var(--space-4)' }}>
          <table className="cp-table">
            <thead>
              <tr>
                <th>Salon</th>
                <th>Where</th>
                <th>Band</th>
                <th>Sharing</th>
              </tr>
            </thead>
            <tbody>
              {salons.map((salon) => (
                <tr key={salon.envelope.accountId}>
                  <td>
                    <Link href={`/compass/accounts/${salon.envelope.salonSlug}?${ROLE_PARAM}=${role}`}>
                      {salon.account.salonName}
                    </Link>
                  </td>
                  <td className="num">{salon.account.region}</td>
                  <td>
                    <BandDot band={salon.account.healthBand ?? 'unknown'} />{' '}
                    {BAND_LABEL[salon.account.healthBand ?? 'unknown']}
                  </td>
                  <td>
                    <ConsentBadge tier={salon.consentTier} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
