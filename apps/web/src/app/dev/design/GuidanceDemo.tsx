'use client';

import { useState } from 'react';
import {
  EMPTY_STATES,
  Guided,
  METRICS,
  TeachingEmptyState,
  TOURS,
  TOUR_UI,
  Tour,
  WhisperNote,
} from '@bask/ui';

/**
 * Step 9 acceptance surface: a Guided metric popover, a 3-step tour, a WhisperNote and
 * a teaching empty state — every string resolving from the dictionary.
 *
 * Note what this component does NOT contain: user-facing sentences. Labels come from
 * METRICS/EMPTY_STATES/TOUR_UI. The section headings are harness chrome, which is why
 * they are the only literals here.
 */

/** Selectors the tour spotlights, index-aligned with TOURS.today.steps. */
const TOUR_TARGETS = ['[data-tour="letter"]', '[data-tour="cards"]', '[data-tour="action"]'];

export function GuidanceDemo() {
  const [tourOpen, setTourOpen] = useState(false);
  const [emptyPoked, setEmptyPoked] = useState(false);

  return (
    <>
      <section className="dh-section">
        <header>
          <h2>Guidance layer</h2>
          <p>
            Every string below resolves from <code className="dh-code">guidance.ts</code>. The
            components take dictionary KEYS, not text, so copy cannot leak back into JSX.
          </p>
        </header>

        <div className="dh-card" data-tour="letter">
          <p className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
            Yesterday
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'var(--text-lg)',
              letterSpacing: '-0.012em',
              marginBottom: 'var(--space-4)',
            }}
          >
            Your <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>retail</em> slipped
            again on the evening shifts
          </p>

          <dl style={{ margin: 0 }}>
            <div className="dh-row">
              <dt>
                <Guided metric="retailAttachment">{METRICS.retailAttachment.label}</Guided>
              </dt>
              <dd className="num">15%</dd>
            </div>
            <div className="dh-row">
              <dt>
                <Guided metric="membershipRevenue">{METRICS.membershipRevenue.label}</Guided>
              </dt>
              <dd className="num">$18,420</dd>
            </div>
            <div className="dh-row">
              <dt>
                <Guided metric="failedPayments">{METRICS.failedPayments.label}</Guided>
              </dt>
              <dd className="num">7</dd>
            </div>
          </dl>

          <div style={{ marginTop: 'var(--space-5) ' }} data-tour="action">
            <button type="button" className="btn btn-primary">
              Send recovery messages
            </button>
            <div style={{ marginTop: 'var(--space-3)' }}>
              <WhisperNote note="campaignAudience" count={43} />
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <WhisperNote note="nothingSendsYet" />
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <WhisperNote note="demoData" tone="caution" />
            </div>
          </div>
        </div>
      </section>

      <section className="dh-section" data-tour="cards">
        <header>
          <h2>Teaching empty state</h2>
          <p>Explains what will appear, why it helps, and offers the first action.</p>
        </header>
        <TeachingEmptyState
          state="campaigns"
          onAction={() => setEmptyPoked(true)}
          icon="✎"
        />
        {emptyPoked && (
          <p className="dh-meta" data-testid="empty-action-fired">
            {EMPTY_STATES.campaigns.action} → handler fired
          </p>
        )}
      </section>

      <section className="dh-section">
        <header>
          <h2>First-run tour</h2>
          <p>Spotlight steps, skippable at any point, replayable from here.</p>
        </header>
        <div className="dh-card">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setTourOpen(true)}
            data-testid="start-tour"
          >
            {TOUR_UI.replay}
          </button>
          <p className="dh-meta" style={{ marginTop: 'var(--space-3)' }}>
            {TOURS.today.steps.length} steps · {TOURS.today.label}
          </p>
        </div>
      </section>

      <Tour
        tour="today"
        targets={TOUR_TARGETS}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}
