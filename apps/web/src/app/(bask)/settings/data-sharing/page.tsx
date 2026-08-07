'use client';

/**
 * Settings → Data sharing — "What UVALUX sees" (PRODUCT_SPEC §15).
 *
 * The design bet, stated in the spec: **radical legibility instead of a ToS
 * paragraph.** So the screen shows two panes side by side — what you see, what
 * UVALUX sees — and both are rendered from `describeConsent()`, the same
 * function the Compass filter is built on. That is deliberate and load-bearing:
 * the screen cannot describe behaviour the filter does not have, because it is
 * reading the filter's own field list rather than a hand-written copy of it.
 *
 * Downgrading is one click with no interstitial and no "are you sure you want to
 * lose all these benefits" — §15 rules out dark patterns explicitly. Selecting a
 * tier previews it immediately; nothing is written until Save, and Save writes an
 * audit row in the same transaction as the tier.
 *
 * Cross-product beat: flip this to Private, open /compass, and Rivière Lumière's
 * treatment is what this salon now gets. That is the demo, and it works because
 * both screens read one filter.
 */

import { CONSENT_TIERS, labelForConsentField, type ConsentTier } from '@bask/core';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { trpc } from '@/lib/trpc';
import './data-sharing.css';

const TIER_NAME: Record<ConsentTier, string> = {
  private: 'Private',
  benchmarks: 'Benchmarks',
  coaching: 'Benchmarks + Coaching view',
};

/** Plain-language, grade-7. The technical framing never appears here. */
const TIER_PLAIN: Record<ConsentTier, string> = {
  private:
    'Nothing about your business leaves this salon. You will not see how you compare to anyone else either — comparisons only work if everyone puts something in.',
  benchmarks:
    'Your numbers go into anonymous group averages, and you get to see where you sit against salons like yours. UVALUX sees that you take part, not what your numbers are.',
  coaching:
    'Everything above, plus your UVALUX rep can see summaries of how your business is trending — going up, going down, holding — so they can actually help when you call.',
};

const STAMP = new Intl.DateTimeFormat('en-CA', {
  dateStyle: 'medium',
  timeZone: 'America/New_York',
});

export default function DataSharingPage() {
  const utils = trpc.useUtils();
  const current = trpc.dataSharing.current.useQuery();
  const setTier = trpc.dataSharing.setTier.useMutation();

  const [selected, setSelected] = useState<ConsentTier | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Preview follows the saved tier until the salon picks a different one.
  useEffect(() => {
    if (current.data && selected === null) setSelected(current.data.tier);
  }, [current.data, selected]);

  if (current.error) {
    return (
      <main className="ds-page">
        <div className="ds-shell">
          <h1>Data sharing could not load</h1>
          <p className="ds-whisper">{current.error.message}</p>
        </div>
      </main>
    );
  }
  if (!current.data || selected === null) {
    return (
      <main className="ds-page">
        <div className="ds-shell">
          <p className="ds-whisper">Loading your sharing settings…</p>
        </div>
      </main>
    );
  }

  const { tier: savedTier, tiers, audit, salonName, salonSlug } = current.data;
  const preview = tiers.find((entry) => entry.tier === selected)!;
  const disclosure = preview.disclosure;
  const dirty = selected !== savedTier;

  async function save() {
    if (!selected || !dirty) return;
    const result = await setTier.mutateAsync({ tier: selected });
    await utils.dataSharing.current.invalidate();
    setToast(
      result.tier === 'private'
        ? 'Saved. UVALUX now sees your name and nothing else.'
        : `Saved. You are now on ${TIER_NAME[result.tier]}.`,
    );
    window.setTimeout(() => setToast(null), 4000);
  }

  return (
    <main className="ds-page">
      <div className="ds-shell">
        <header className="ds-head">
          <div className="eyebrow">Settings · Data sharing</div>
          <h1>
            What UVALUX <em>sees</em>.
          </h1>
          <p>
            {salonName} decides this, and can change it any time. Below is not a summary of a policy —
            it is the actual list of things that do and do not leave this salon, read straight out of
            the filter that enforces it.
          </p>
        </header>

        <section>
          <div className="ds-tiers">
            {CONSENT_TIERS.map((tier) => (
              <button
                key={tier}
                className="ds-tier"
                aria-pressed={selected === tier}
                onClick={() => setSelected(tier)}
              >
                <span className="ds-tier-name">
                  {TIER_NAME[tier]}
                  {savedTier === tier && <span className="ds-tier-now">Your setting</span>}
                </span>
                <span className="ds-tier-plain">{TIER_PLAIN[tier]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="ds-previews">
          <div className="ds-preview">
            <h2>What you see</h2>
            <p className="ds-sub">In your own Bask, on {TIER_NAME[selected]}.</p>

            <div className="ds-group-label">You get back</div>
            <ul className="ds-list">
              {disclosure.youReceive.length === 0 ? (
                <li>
                  <span className="ds-mark ds-mark--no">×</span>
                  No peer comparisons. Nothing goes in, so nothing comes back.
                </li>
              ) : (
                disclosure.youReceive.map((field) => (
                  <li key={field}>
                    <span className="ds-mark ds-mark--yes">✓</span>
                    {labelForConsentField(field)}
                  </li>
                ))
              )}
            </ul>

            <div className="ds-group-label">Always yours alone</div>
            <ul className="ds-list">
              {disclosure.uvaluxNeverSees.map((field) => (
                <li key={field}>
                  <span className="ds-mark ds-mark--yes">✓</span>
                  {labelForConsentField(field)}
                </li>
              ))}
            </ul>
          </div>

          <div className="ds-preview ds-preview--them">
            <h2>What UVALUX sees</h2>
            <p className="ds-sub">On your rep’s screen, on {TIER_NAME[selected]}.</p>

            <div className="ds-group-label">They can see</div>
            <ul className="ds-list">
              {disclosure.uvaluxSees.map((field) => (
                <li key={field}>
                  <span className="ds-mark ds-mark--yes">✓</span>
                  {labelForConsentField(field)}
                </li>
              ))}
            </ul>

            <div className="ds-group-label">They never see</div>
            <ul className="ds-list">
              {disclosure.uvaluxNeverSees.map((field) => (
                <li key={field}>
                  <span className="ds-mark ds-mark--no">×</span>
                  {labelForConsentField(field)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ds-actions">
          <button className="btn btn-primary" onClick={save} disabled={!dirty || setTier.isPending}>
            {dirty ? `Switch to ${TIER_NAME[selected]}` : 'This is your setting'}
          </button>
          {dirty && (
            <button className="btn btn-ghost" onClick={() => setSelected(savedTier)}>
              Leave it as it is
            </button>
          )}
          {salonSlug && (
            <Link
              className="btn btn-quiet"
              href={`/compass/accounts/${salonSlug}?role=uvalux_rep`}
              style={{ marginLeft: 'auto', textDecoration: 'none' }}
            >
              See your account the way UVALUX does
            </Link>
          )}
        </section>

        <p className="ds-whisper">
          Changing this takes effect immediately — including turning it down. There is no notice
          period and nobody to ask. Every change is written to the record below, so you can always see
          who changed what and when.
        </p>

        <section className="ds-audit">
          <h2>Change history</h2>
          {audit.length === 0 ? (
            <p className="ds-whisper">Nothing has changed yet.</p>
          ) : (
            audit.map((entry) => (
              <div className="ds-audit-row" key={entry.id}>
                <span>
                  {entry.fromTier
                    ? `${TIER_NAME[entry.fromTier]} → ${TIER_NAME[entry.toTier]}`
                    : `Set to ${TIER_NAME[entry.toTier]}`}
                  {entry.note ? ` — ${entry.note}` : ''}
                </span>
                <span className="w">{STAMP.format(new Date(entry.changedAt))}</span>
              </div>
            ))
          )}
        </section>
      </div>

      {toast && <div className="ds-toast">{toast}</div>}
    </main>
  );
}
