/**
 * Curation alerts — pure helpers for detecting issues in claim data.
 *
 * This file is the API surface every curation component builds against. It is
 * TYPES AND PURE HELPERS ONLY — no data access, no React, no side effects — so it
 * can be injected as a contract into a build without dragging the app in with it.
 */

import {
  ALERT_KINDS,
  ALERT_LABEL,
  Claim,
  CurationAlert,
  ClaimCategory,
  ReviewState,
} from './types';

/**
 * Generate curation alerts for a set of claims.
 *
 * @param claims - The claims to analyze
 * @returns Array of alerts detected in the claims
 */
export function generateAlerts(claims: readonly Claim[]): CurationAlert[] {
  const alerts: CurationAlert[] = [];
  
  // Track categories and their claim counts for thin_topic alert
  const categoryCounts: Record<ClaimCategory, number> = {
    marketing: 0,
    membership: 0,
    retail: 0,
    operations: 0,
    customer: 0,
    coaching: 0,
  };
  
  // Count claims per category
  for (const claim of claims) {
    if (claim.reviewState === 'verified') categoryCounts[claim.category]++;
  }

  // Bug fix: thin_topic is a fact about a TOPIC, not about each claim in it.
  // Emitting it inside the per-claim loop produced one duplicate alert per
  // verified claim, so a thin topic shouted louder the more you verified it.
  for (const category of Object.keys(categoryCounts) as (keyof typeof categoryCounts)[]) {
    if (categoryCounts[category] < 5) {
      const nodeId = `topic:${category}`;
      alerts.push({
        id: `thin_topic-${nodeId}`,
        kind: 'thin_topic',
        severity: 'attention',
        nodeId,
        message: `Only ${categoryCounts[category]} verified claims cover ${category}. This topic needs more building.`,
        claimIds: claims.filter((c) => c.category === category).map((c) => c.id),
      });
    }
  }
  
  // Check each claim for alerts
  for (const claim of claims) {
    // single_source - fires per claim when distinctEvents equals one and specificity is concrete
    if (claim.distinctEvents === 1 && claim.specificity === 'concrete') {
      alerts.push({
        id: `single_source-${claim.id}`,
        kind: 'single_source',
        severity: 'attention',
        nodeId: claim.id,
        message: `This claim was said only once and is concrete`,
        claimIds: [claim.id],
      });
    }
    
    // unanchored_attribution - fires when any provenance entry has titleConfidence interpolated
    if (claim.provenance.some(p => p.titleConfidence === 'interpolated')) {
      alerts.push({
        id: `unanchored_attribution-${claim.id}`,
        kind: 'unanchored_attribution',
        severity: 'attention',
        nodeId: claim.id,
        message: `Speaker was inferred, not heard`,
        claimIds: [claim.id],
      });
    }
    
    // contradiction - return nothing (this is a model-based detection that's outside the scope of this pure module)
    // Note: Detecting opposing sentiment needs a model and this module is pure
    
    // stale - fires when reviewState is verified and reviewedAt is more than twelve months old
    if (claim.reviewState === 'verified' && claim.reviewedAt) {
      const reviewedDate = new Date(claim.reviewedAt);
      const now = new Date();
      const diffInMonths = (now.getFullYear() - reviewedDate.getFullYear()) * 12 + 
                          (now.getMonth() - reviewedDate.getMonth());
      
      if (diffInMonths > 12) {
        alerts.push({
          id: `stale-${claim.id}`,
          kind: 'stale',
          severity: 'info',
          nodeId: claim.id,
          message: `This claim was verified more than twelve months ago`,
          claimIds: [claim.id],
        });
      }
    }
    
    // orphan - fires when every provenance entry has a null sessionTitle
    if (claim.provenance.every(p => p.sessionTitle === null)) {
      alerts.push({
        id: `orphan-${claim.id}`,
        kind: 'orphan',
        severity: 'attention',
        nodeId: claim.id,
        message: `No session found for this claim`,
        claimIds: [claim.id],
      });
    }
    
    // provenance_drift - fires when any provenance entry has quoteVerified false, severity blocking
    if (claim.provenance.some(p => !p.quoteVerified)) {
      alerts.push({
        id: `provenance_drift-${claim.id}`,
        kind: 'provenance_drift',
        severity: 'blocking',
        nodeId: claim.id,
        message: `Quote no longer matches the transcript`,
        claimIds: [claim.id],
      });
    }
  }
  
  return alerts;
}