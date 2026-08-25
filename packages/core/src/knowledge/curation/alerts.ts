import { ALERT_KINDS, ALERT_LABEL, AlertSeverity, Claim, ClaimCategory, CurationAlert, ReviewState, claimConfidence } from "./types";

/**
 * Generate curation alerts for a set of claims.
 *
 * This function is pure - it has no side effects and only uses the input data
 * to determine which alerts should be generated. It does not perform any IO
 * operations or interact with React components.
 */
export function generateCurationAlerts(claims: readonly Claim[]): CurationAlert[] {
  const alerts: CurationAlert[] = [];

  // Group claims by category for thin_topic alert
  const claimsByCategory: Record<ClaimCategory, Claim[]> = {
    marketing: [],
    membership: [],
    retail: [],
    operations: [],
    customer: [],
    coaching: [],
  };

  for (const claim of claims) {
    claimsByCategory[claim.category].push(claim);
  }

  // thin_topic alert - fires per category when that category has fewer than five claims
  // whose reviewState is verified
  for (const [category, categoryClaims] of Object.entries(claimsByCategory)) {
    const verifiedClaims = categoryClaims.filter(
      (c) => c.reviewState === 'verified'
    );
    if (verifiedClaims.length < 5) {
      alerts.push({
        id: `thin_topic_${category}`,
        kind: 'thin_topic',
        severity: 'attention',
        nodeId: `topic:${category}`,
        message: `Topic ${category} has fewer than five verified claims`,
        claimIds: verifiedClaims.map((c) => c.id),
      });
    }
  }

  // single_source alert - fires per claim when distinctEvents equals one and specificity is concrete
  for (const claim of claims) {
    if (
      claim.distinctEvents === 1 &&
      claim.specificity === 'concrete'
    ) {
      alerts.push({
        id: `single_source_${claim.id}`,
        kind: 'single_source',
        severity: 'attention',
        nodeId: claim.id,
        message: `Claim was said once, by one person`,
        claimIds: [claim.id],
      });
    }
  }

  // unanchored_attribution alert - fires when any provenance entry has titleConfidence interpolated
  for (const claim of claims) {
    const hasInterpolated = claim.provenance.some(
      (p) => p.titleConfidence === 'interpolated'
    );
    if (hasInterpolated) {
      alerts.push({
        id: `unanchored_attribution_${claim.id}`,
        kind: 'unanchored_attribution',
        severity: 'attention',
        nodeId: claim.id,
        message: `Speaker was inferred, not heard`,
        claimIds: [claim.id],
      });
    }
  }

  // orphan alert - fires when every provenance entry has a null sessionTitle
  for (const claim of claims) {
    const allNullSession = claim.provenance.every(
      (p) => p.sessionTitle === null
    );
    if (allNullSession) {
      alerts.push({
        id: `orphan_${claim.id}`,
        kind: 'orphan',
        severity: 'attention',
        nodeId: claim.id,
        message: `No session found for this claim`,
        claimIds: [claim.id],
      });
    }
  }

  // provenance_drift alert - fires when any provenance entry has quoteVerified false, severity blocking
  for (const claim of claims) {
    const hasDrift = claim.provenance.some(
      (p) => !p.quoteVerified
    );
    if (hasDrift) {
      alerts.push({
        id: `provenance_drift_${claim.id}`,
        kind: 'provenance_drift',
        severity: 'blocking',
        nodeId: claim.id,
        message: `Quote no longer matches the transcript`,
        claimIds: [claim.id],
      });
    }
  }

  // stale alert - fires when reviewState is verified and reviewedAt is more than twelve months old
  for (const claim of claims) {
    if (
      claim.reviewState === 'verified' &&
      claim.reviewedAt !== null
    ) {
      const reviewedDate = new Date(claim.reviewedAt);
      const now = new Date();
      const diffMonths = (now.getFullYear() - reviewedDate.getFullYear()) * 12 +
        (now.getMonth() - reviewedDate.getMonth());
      
      if (diffMonths > 12) {
        alerts.push({
          id: `stale_${claim.id}`,
          kind: 'stale',
          severity: 'info',
          nodeId: claim.id,
          message: `Verified a long time ago`,
          claimIds: [claim.id],
        });
      }
    }
  }

  // contradiction alert - return nothing, as detecting opposing sentiment needs a model
  // and this module is pure
  // No implementation needed for contradiction

  return alerts;
}