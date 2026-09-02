# curation: palette.ts (pure, retry)

## What to build

A small pure module, no React and no IO. Import Claim and PaletteItem from the sibling module ./types with a relative import. Export exactly two functions. First, buildPaletteIndex taking a readonly array of Claim and returning PaletteItem values: one per claim where label is the claim text, hint is the knowledgeRef of the first provenance entry or null when there is none, kind is the string claim and focusNodeId is the claim id; plus one item per distinct category where kind is topic and focusNodeId is the string topic then a colon then the category; plus one per distinct moment other than none where kind is moment; plus one per distinct non-null speaker where kind is speaker. Second, filterPalette taking the items and a query string and returning a filtered ranked array. Matching is case-insensitive subsequence matching over the label so that typing mem matches memberships. Score each match so that contiguous runs of matched characters rank higher and a match starting at the beginning of a word ranks higher, then sort best first. When the query is empty return the items unchanged. Keep it under 120 lines. Follow the exemplar file for comment style and structure.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/packages/core/src/knowledge/curation/palette.ts`

## The API surface you may use

Everything below is REAL and already exists. Import from `./types`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.

functions:
  formatTimecode(seconds: number): string
  claimConfidence(claim: Pick<Claim, 'distinctEvents' | 'provenance'>): number
  reviewProgress(claims: readonly Pick<Claim, 'reviewState'>[])

consts: CLAIM_CATEGORIES, CLAIM_MOMENTS, CLAIM_SHAPES, REVIEW_STATES, REVIEW_STATE_LABEL, ALERT_KINDS, ALERT_LABEL, GRAPH_NODE_KINDS, GRAPH_EDGE_KINDS, CLAIM_ACTIONS
types: ClaimCategory, ClaimMoment, ClaimShape, ReviewState, AlertKind, AlertSeverity, GraphNodeKind, GraphEdgeKind, PaletteItemKind, ClaimAction
interfaces: ClaimProvenance, Claim, CurationAlert, GraphNode, GraphEdge, CurationGraph, ClaimFilters, ClaimPage, PaletteItem, ClaimEvent

REVIEW_STATE_LABEL has EXACTLY these 4 keys: unreviewed, verified, rejected, needs_edit

ALERT_LABEL has EXACTLY these 7 keys: thin_topic, single_source, unanchored_attribution, contradiction, stale, orphan, provenance_drift
```
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
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
```

## Rules

- Write the target file. Do not create other files.
- Do not modify anything outside the target path.
- Import every symbol you use. Do not reference a symbol you have not imported.
- Use ONLY class names and style keys that appear in the surface or the exemplar.
- Do not leave TODOs, stubs, or placeholder values.
- Do not fix unrelated bugs you notice. Build only what is described above.

## Acceptance gate — you are DONE only when all of these are true

1. `/home/danman60/projects/uvalux-platform/packages/core/src/knowledge/curation/palette.ts` exists and is complete.
2. It imports what it uses from `./types`.
3. `npx tsc --noEmit -p packages/core/tsconfig.json && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/packages/core/src/knowledge/curation/alerts.ts /home/danman60/projects/uvalux-platform/packages/core/src/knowledge/curation/palette.ts --contract /home/danman60/projects/uvalux-platform/packages/core/src/knowledge/curation/types.ts` passes with exit code 0.
4. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
