import { claimConfidence } from "@bask/core";
/**
 * Compass component vocabulary (DESIGN_SPEC §4): `EvidenceTile`, `SuggestBlock`,
 * `StatusChip`, `StatRow`, plus the consent badge PRODUCT_SPEC §14 asks for on
 * every account.
 *
 * These live in `apps/web` rather than `@bask/ui` on purpose: the M1 merge
 * protocol gives Lane 1 ownership of `packages/ui`, and other lanes request
 * additions instead of editing it. They are written to the §4 names and prop
 * shapes so promoting them upward later is a file move, not a rewrite.
 *
 * All of them are presentational. They receive values that have already been
 * derived and consent-filtered by `@bask/core` — no component here decides what
 * a number means or whether a rep may see it.
 */

import type { Claim } from '@bask/core';

/* -------------------------------------------------------------- ConfidenceBadge */

const CONFIDENCE_CLASS: Record<number, string> = {
  0: 'cp-badge--critical',
  1: 'cp-badge--warning',
  2: 'cp-badge--success',
};

const CONFIDENCE_LABEL: Record<number, string> = {
  0: 'Could not be matched to transcript',
  1: 'Speaker inferred from agenda',
  2: 'Matched to transcript',
};

/**
 * A small badge showing how confident we are that a Claim was matched to its
 * transcript. When confidence is 0, say it could not be matched to the transcript.
 * When the title confidence is interpolated, say the speaker was inferred from the agenda.
 * Otherwise show the confidence as a percentage.
 */
export function ConfidenceBadge({ claim }: { claim: Claim }) {
  const confidence = claimConfidence(claim);
  
  if (confidence === 0) {
    return <span className={`cp-badge ${CONFIDENCE_CLASS[0]}`}>{CONFIDENCE_LABEL[0]}</span>;
  }
  
  if (confidence === 1) {
    return <span className={`cp-badge ${CONFIDENCE_CLASS[1]}`}>{CONFIDENCE_LABEL[1]}</span>;
  }
  
  return (
    <span className={`cp-badge ${CONFIDENCE_CLASS[2]}`}>
      {Math.round(confidence * 100)}% matched
    </span>
  );
}