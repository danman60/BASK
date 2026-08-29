'use client';

/**
 * CoachingCitations — the retrieved coaching, made clickable.
 *
 * This is the visible end of the RAG. Above it sits a piece of advice or a piece
 * of campaign copy; here is the coaching that fed it, and one click opens the
 * words somebody actually said on stage. That click is the whole point: a
 * citation nobody can open is a claim, not a citation.
 *
 * Three rules it obeys, all of them borrowed rather than invented:
 *   - INLINE, never a modal. Same rule `EvidenceDrilldown` follows — disclosure
 *     pushes the page down, it does not cover it.
 *   - No individual is ever named. The label is the training programme and a
 *     timecode; `ClaimCitation` has no field for a person, so there is nothing
 *     here to leak.
 *   - "Not checked yet" is printed honestly. Most of the corpus is unreviewed and
 *     the badge says so rather than implying a human signed off.
 *
 * Presentational: it takes citations and renders them. Retrieval belongs to the
 * server, and an empty array renders nothing at all rather than an empty box.
 */

import { useState } from 'react';
import type { ClaimCitation } from '@bask/core';

import { COACHING_UI } from '../guidance/guidance';

export interface CoachingCitationsProps {
  citations: readonly ClaimCitation[];
  /** Overrides the heading where the surrounding copy already says "why". */
  heading?: string;
  /** Set on the wrapper so a drill-down can point `aria-controls` at it. */
  id?: string;
}

export function CoachingCitations({ citations, heading, id }: CoachingCitationsProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Nothing matched, or retrieval was unavailable. Both are normal, and neither
  // is worth an empty container on the page.
  if (citations.length === 0) return null;

  return (
    <section className="b-coaching" id={id} data-testid="coaching-citations">
      <p className="b-coaching-head">{heading ?? COACHING_UI.heading}</p>
      <p className="b-coaching-intro">{COACHING_UI.intro}</p>

      <ul className="b-coaching-list">
        {citations.map((citation) => {
          const open = openId === citation.claimId;
          const panelId = `coaching-${citation.claimId}`;

          return (
            <li key={citation.claimId} className="b-coaching-item" data-open={open || undefined}>
              <button
                type="button"
                className="b-coaching-claim"
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                data-testid="coaching-claim"
                onClick={() => setOpenId(open ? null : citation.claimId)}
              >
                <span className="b-coaching-marker" aria-hidden>
                  {open ? '▾' : '▸'}
                </span>
                <span className="b-coaching-text">{citation.claim}</span>
              </button>

              <p className="b-coaching-meta">
                <span className="b-coaching-source">{citation.label}</span>
                <span className="b-coaching-dot" aria-hidden>
                  ·
                </span>
                <span className="b-coaching-cat">{citation.category}</span>
                <span
                  className="b-coaching-state"
                  data-state={citation.confidence}
                  title={
                    citation.confidence === 'verified'
                      ? COACHING_UI.verified
                      : COACHING_UI.unreviewed
                  }
                >
                  {citation.confidence === 'verified'
                    ? COACHING_UI.verified
                    : COACHING_UI.unreviewed}
                </span>
              </p>

              {open && (
                <blockquote className="b-coaching-quote" id={panelId} data-testid="coaching-quote">
                  <p className="b-coaching-quote-label">{COACHING_UI.quoteLabel}</p>
                  <p className="b-coaching-quote-text">“{citation.quote}”</p>
                </blockquote>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
