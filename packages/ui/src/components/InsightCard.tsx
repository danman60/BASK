'use client';

/**
 * InsightCard — the attention-queue card (DESIGN_SPEC §3.1, §4).
 *
 * Anatomy, top to bottom: 4px severity rail fused to the left edge · title ·
 * evidence sentence with **bold facts** · impact chip · optional sparkline.
 * Right column of actions in a FIXED order — Fix this / Show me why / Dismiss —
 * because buttons that move between cards make the queue unscannable.
 *
 * Three mechanics live here and nowhere else:
 *   Fix this     — a link the caller supplies. Deep-links with the insight id so
 *                  the destination can show provenance (DESIGN_SPEC §3.3).
 *   Show me why  — expands `EvidenceDrilldown` INLINE, pushing the queue down.
 *                  Never a modal. That is a design rule, not a preference.
 *   Dismiss      — asks why first (not-relevant / already-handled / snooze), then
 *                  collapses over `--dur-base` and hands the caller the reason so
 *                  it can persist and offer an Undo toast.
 *
 * The card is presentational about DATA and stateful about DISCLOSURE: it owns
 * "is the drill-down open", the caller owns "is this insight dismissed".
 */

import { useState, type ReactNode } from 'react';
import type { Evidence } from '@bask/core';

import { Guided } from '../guidance/Guided';
import { INSIGHT_UI, type DismissReasonKey } from '../guidance/guidance';
import { EvidenceDrilldown } from './EvidenceDrilldown';
import { ImpactChip } from './ImpactChip';
import { Sparkline } from './Sparkline';

export interface InsightCardProps {
  insightId: string;
  title: string;
  /** Evidence sentence with `**bold**` around the facts (DESIGN_SPEC §5). */
  evidenceSentence: string;
  impactChip: { label: string; tone: 'cost' | 'opportunity' };
  /** Amber for attention, green for opportunity. */
  rail: 'warn' | 'good' | 'neutral';
  sparkline?: readonly number[] | null;
  /** Full Evidence — powers the inline drill-down. */
  evidence?: Evidence | null;
  /** Primary action. `href` deep-links with insight context; omit for none. */
  primaryAction?: { label: string; href: string } | null;
  /** True while the dismissal is in flight — collapses the card optimistically. */
  dismissing?: boolean;
  onDismiss?: (reason: DismissReasonKey) => void;
  /** Fired the first time the drill-down is opened, so the caller can mark it seen. */
  onExplain?: () => void;
  /**
   * The records layer, rendered at the BOTTOM of the evidence drill-down.
   *
   * Passed in rather than fetched here because this component is presentational
   * and the rows are a database round trip. The card owns the disclosure; the
   * caller owns the data. Omit it and the drill-down simply ends at the evidence,
   * which is the correct behaviour for any metric whose figure cannot be
   * reconciled to a visit-level list.
   */
  recordsSlot?: ReactNode;
  /**
   * The coaching layer, rendered in the drill-down beneath the records.
   *
   * Same contract as `recordsSlot` and for the same reason: retrieval is a
   * network round trip and an embedding call, so the caller owns the data and
   * this component owns only the disclosure. Omit it and the drill-down simply
   * ends where it did before.
   */
  coachingSlot?: ReactNode;
  /** Compact two-button layout used at mobile widths is handled in CSS, not here. */
  children?: ReactNode;
}

/** Renders `**bold**` runs from the evidence sentence. Nothing else is parsed. */
export function renderBoldFacts(sentence: string): ReactNode[] {
  return sentence.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function InsightCard({
  insightId,
  title,
  evidenceSentence,
  impactChip,
  rail,
  sparkline,
  evidence,
  recordsSlot,
  coachingSlot,
  primaryAction,
  dismissing = false,
  onDismiss,
  onExplain,
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [askingWhy, setAskingWhy] = useState(false);

  const drillId = `drill-${insightId}`;
  const titleId = `title-${insightId}`;
  const canExplain = Boolean(evidence);

  const toggleExplain = () => {
    if (!expanded) onExplain?.();
    setExpanded((open) => !open);
  };

  return (
    <article
      className="card b-insight"
      data-rail={rail}
      data-dismissing={dismissing || undefined}
      data-testid="insight-card"
      data-insight-id={insightId}
    >
      <div className="b-insight-rail" aria-hidden />

      <div className="b-insight-body">
        <div className="b-insight-main">
          <h3 id={titleId}>{title}</h3>
          <p className="b-insight-evidence">{renderBoldFacts(evidenceSentence)}</p>

          {/* The chip and the chart carry their own shape — the explain affordance
              only appears when the pointer is on them (DESIGN_SPEC §2.4). */}
          <Guided metric="impactEstimate" className="b-insight-impact" affordance="none">
            <ImpactChip label={impactChip.label} tone={impactChip.tone} />
          </Guided>

          {sparkline && sparkline.length >= 2 && (
            <Guided tip="sparkline" className="b-insight-spark" affordance="none">
              <Sparkline values={sparkline} label={title} />
            </Guided>
          )}
        </div>

        <div className="b-insight-actions">
          {primaryAction && (
            <a className="btn btn-primary" href={primaryAction.href}>
              {primaryAction.label}
            </a>
          )}
          {canExplain && (
            <button
              type="button"
              className="btn btn-quiet"
              aria-expanded={expanded}
              aria-controls={expanded ? drillId : undefined}
              onClick={toggleExplain}
            >
              <span className="b-full">
                {expanded ? INSIGHT_UI.hideWhy : INSIGHT_UI.showWhy}
              </span>
              <span className="b-short">{INSIGHT_UI.showWhyShort}</span>
            </button>
          )}
          {onDismiss && !askingWhy && (
            <button type="button" className="btn btn-ghost" onClick={() => setAskingWhy(true)}>
              {INSIGHT_UI.dismiss}
            </button>
          )}
        </div>
      </div>

      {/* Dismiss asks a question rather than confirming one. The reasons are the
          product's feedback loop — "already handled" and "not relevant" mean very
          different things to the ranking. */}
      {askingWhy && (
        <div className="b-insight-dismiss" data-testid="dismiss-prompt">
          <p>{INSIGHT_UI.dismissPrompt}</p>
          <div className="b-insight-dismiss-row">
            {INSIGHT_UI.dismissReasons.map((reason) => (
              <button
                key={reason.key}
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setAskingWhy(false);
                  onDismiss?.(reason.key);
                }}
              >
                {reason.label}
              </button>
            ))}
            <button type="button" className="btn btn-ghost" onClick={() => setAskingWhy(false)}>
              {INSIGHT_UI.dismissCancel}
            </button>
          </div>
        </div>
      )}

      {expanded && evidence && (
        <EvidenceDrilldown evidence={evidence} id={drillId} labelledBy={titleId}>
          {recordsSlot}
          {/* Records first, then coaching: the owner reads "here is the proof"
              before "here is what to do about it". Reversing them puts advice in
              front of evidence, which is the order this product refuses. */}
          {coachingSlot}
        </EvidenceDrilldown>
      )}
    </article>
  );
}
