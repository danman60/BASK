'use client';

/**
 * The call brief, as a right-side sheet at ~60% (DESIGN_SPEC §3.4).
 *
 * "Never navigates away from the list" is the whole design decision here: a rep
 * opens a brief, reads it, and closes it back onto the ranked list they were
 * working through. Making this a page would lose their place every time.
 *
 * The sheet renders whatever `compass.callBrief` returns and states which path
 * produced it. That provenance line is not debug output — PRODUCT_SPEC §16
 * requires every AI capability to explain itself, and "written from your data
 * without the model" is the honest explanation when the key is unfunded.
 */

import type { CallBriefResult } from '@bask/core';
import { useEffect, useRef } from 'react';

import { StatRow } from './primitives';

export interface CallBriefSheetProps {
  salonName: string;
  region: string;
  result: CallBriefResult | null;
  isPending: boolean;
  error: string | null;
  onClose: () => void;
}

export function CallBriefSheet({
  salonName,
  region,
  result,
  isPending,
  error,
  onClose,
}: CallBriefSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const brief = result?.brief;

  return (
    <>
      <button className="cp-scrim" aria-label="Close call brief" onClick={onClose} />
      <aside className="cp-sheet" role="dialog" aria-modal="true" aria-label={`Call brief — ${salonName}`}>
        <header className="cp-sheet-head">
          <div>
            <h2>{salonName}</h2>
            <div className="cp-loc">{region}</div>
          </div>
          <button ref={closeRef} className="cp-btn cp-btn--ghost" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Close
          </button>
        </header>

        <div className="cp-sheet-body">
          {isPending && (
            <p className="cp-note">Pulling their signals together…</p>
          )}

          {error && (
            <section className="cp-sheet-section">
              <h3>No brief for this one</h3>
              <p>{error}</p>
            </section>
          )}

          {brief && (
            <>
              <section className="cp-sheet-section">
                <h3>{brief.status}</h3>
                <p style={{ color: 'var(--c-ink)', fontSize: 'var(--text-md)', fontWeight: 600 }}>
                  {brief.headline}
                </p>
                <p style={{ marginTop: 'var(--space-3)' }}>{brief.situation}</p>
              </section>

              <section className="cp-sheet-section">
                <h3>Open with</h3>
                <p>{brief.opener}</p>
              </section>

              <section className="cp-sheet-section">
                <h3>Talking points</h3>
                <ul>
                  {brief.talkingPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </section>

              {brief.avoid.length > 0 && (
                <section className="cp-sheet-section">
                  <h3>Don’t</h3>
                  <ul>
                    {brief.avoid.map((item, index) => (
                      <li className="cp-avoid" key={index}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {brief.facts.length > 0 && (
                <section className="cp-sheet-section">
                  <h3>The numbers behind it</h3>
                  <div>
                    {brief.facts.map((fact, index) => (
                      <StatRow key={index} label={fact.label} value={fact.value} />
                    ))}
                  </div>
                </section>
              )}

              <p className="cp-provenance">
                {brief.source === 'ai'
                  ? `Written just now by ${brief.model ?? 'the model'} from this account’s shared signals.`
                  : 'Written from this account’s shared signals without the model — every figure is theirs, the wording is ours.'}
                {brief.playbookTitle ? ` Playbook: ${brief.playbookTitle}.` : ''}
                {result?.failureReason ? ` (${result.failureReason})` : ''}
              </p>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
