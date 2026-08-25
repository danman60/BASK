/**
 * Curation vocabulary — the shared contract for `/compass/knowledge`.
 *
 * Spec: `docs/superpowers/specs/2026-08-22-compass-knowledge-curation-design.md`.
 *
 * This file is the API surface every curation component builds against. It is
 * TYPES AND PURE HELPERS ONLY — no data access, no React, no side effects — so it
 * can be injected as a contract into a build without dragging the app in with it.
 *
 * Two invariants the whole surface rests on, stated here because this is the file
 * everything imports:
 *
 *  1. A claim without a verbatim quote is not a claim. `quote` is non-optional and
 *     the loader refuses empty ones. Nothing downstream may render a claim's text
 *     without its quote available.
 *  2. Attribution confidence is never laundered. `titleConfidence: 'interpolated'`
 *     means the speaker was inferred from an agenda, not heard on the recording,
 *     and any UI showing the speaker MUST show that too.
 */

// Import only functions we need for implementation
import {
  formatTimecode,
  type Claim,
  type ClaimCategory,
  type ClaimMoment,
  type PaletteItem,
} from './types';

// ----------------------------------------------------------------------- palette

/**
 * Build a palette of items for a set of claims.
 *
 * One item per claim, plus one per distinct category, moment, speaker and session.
 */
export function buildPaletteIndex(claims: readonly Claim[]): PaletteItem[] {
  const items: PaletteItem[] = [];
  
  // Add items for each claim
  for (const claim of claims) {
    const firstProvenance = claim.provenance[0];
    items.push({
      id: claim.id,
      kind: 'claim',
      label: claim.claim,
      hint: firstProvenance ? firstProvenance.knowledgeRef : null,
      focusNodeId: claim.id,
    });
  }
  
  // Add items for distinct categories
  const categories = new Set<ClaimCategory>();
  for (const claim of claims) {
    categories.add(claim.category);
  }
  for (const category of categories) {
    items.push({
      id: `category:${category}`,
      kind: 'topic',
      label: category,
      hint: null,
      focusNodeId: `category:${category}`,
    });
  }
  
  // Add items for distinct moments
  const moments = new Set<ClaimMoment>();
  for (const claim of claims) {
    moments.add(claim.moment);
  }
  for (const moment of moments) {
    items.push({
      id: `moment:${moment}`,
      kind: 'moment',
      label: moment,
      hint: null,
      focusNodeId: `moment:${moment}`,
    });
  }
  
  // Add items for distinct speakers
  const speakers = new Set<string>();
  for (const claim of claims) {
    for (const prov of claim.provenance) {
      if (prov.speaker) {
        speakers.add(prov.speaker);
      }
    }
  }
  for (const speaker of speakers) {
    items.push({
      id: `speaker:${speaker}`,
      kind: 'speaker',
      label: speaker,
      hint: null,
      focusNodeId: `speaker:${speaker}`,
    });
  }
  
  // Add items for distinct sessions
  const sessions = new Set<string | null>();
  for (const claim of claims) {
    for (const prov of claim.provenance) {
      sessions.add(prov.sessionTitle);
    }
  }
  for (const session of sessions) {
    if (session !== null) {
      items.push({
        id: `session:${session}`,
        kind: 'session',
        label: session,
        hint: null,
        focusNodeId: `session:${session}`,
      });
    }
  }
  
  return items;
}

/**
 * Filter and rank palette items based on a query string.
 *
 * Matching is subsequence based and case insensitive.
 * Rank higher when matched characters are contiguous and when the match starts at a word boundary.
 * An empty query returns every item unchanged.
 */
export function filterPalette(items: readonly PaletteItem[], query: string): PaletteItem[] {
  if (!query) {
    return [...items];
  }
  
  const lowerQuery = query.toLowerCase();
  const rankedItems: { item: PaletteItem; score: number }[] = [];
  
  for (const item of items) {
    // Try to find subsequence match
    const match = findSubsequenceMatch(item.label.toLowerCase(), lowerQuery);
    if (match !== null) {
      let score = match.contiguous * 1000 + match.wordBoundary * 100;
      
      // Bonus for exact matches
      if (item.label.toLowerCase() === lowerQuery) {
        score += 10000;
      }
      
      rankedItems.push({ item, score });
    }
  }
  
  // Sort by score descending
  return rankedItems
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

/**
 * Find a subsequence match in text and return scoring information.
 */
function findSubsequenceMatch(text: string, query: string): { contiguous: number; wordBoundary: number } | null {
  if (query.length === 0) return null;
  
  let textIndex = 0;
  let queryIndex = 0;
  let contiguousCount = 0;
  let wordBoundaryCount = 0;
  let lastMatchWasContiguous = false;
  
  while (textIndex < text.length && queryIndex < query.length) {
    if (text[textIndex] === query[queryIndex]) {
      // Check if this is a word boundary (preceded by space or start of string)
      const isWordBoundary = textIndex === 0 || text[textIndex - 1] === ' ';
      
      if (isWordBoundary && lastMatchWasContiguous) {
        // This match continues from previous contiguous match
        contiguousCount++;
        lastMatchWasContiguous = true;
      } else if (isWordBoundary) {
        // This is a word boundary, but not contiguous with previous match
        wordBoundaryCount++;
        lastMatchWasContiguous = false;
      } else if (lastMatchWasContiguous) {
        // Continue the contiguous count
        contiguousCount++;
        lastMatchWasContiguous = true;
      } else {
        // This is a new non-contiguous match
        lastMatchWasContiguous = true;
      }
      
      queryIndex++;
    } else {
      lastMatchWasContiguous = false;
    }
    textIndex++;
  }
  
  // If we matched all of the query, return the score components
  if (queryIndex === query.length) {
    return { contiguous: contiguousCount, wordBoundary: wordBoundaryCount };
  }
  
  return null;
}