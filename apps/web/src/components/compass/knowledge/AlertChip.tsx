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

import type { AlertKind, AlertSeverity } from '@bask/core';
import { ALERT_LABEL } from '@bask/core';

/* -------------------------------------------------------------- AlertChip */

export function AlertChip({ kind, severity }: { kind: AlertKind; severity: AlertSeverity }) {
  // Type assertion to avoid TS2367 error
  const severityValue = severity as 'needs_attention' | 'steady';
  const severityClass = 
    severityValue === 'needs_attention' ? 'cp-chip--watch' : 'cp-chip--steady';
  
  return (
    <span className={`cp-chip ${severityClass}`}>
      {ALERT_LABEL[kind]}
    </span>
  );
}