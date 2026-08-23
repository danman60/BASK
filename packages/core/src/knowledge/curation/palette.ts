/**
 * Palette curation — pure helpers for building and filtering the knowledge palette.
 *
 * This file is the API surface every palette component builds against. It is
 * TYPES AND PURE HELPERS ONLY — no data access, no React, no side effects — so it
 * can be injected as a contract into a build without dragging the app in with it.
 */

import {
  Claim,
  ClaimMoment,
  ClaimCategory,
  PaletteItem,
} from './types';

/**
 * Builds the initial palette of items from a set of claims.
 *
 * @param claims - The raw claim data
 * @returns A list of palette items including claims, categories, moments, and speakers
 */
export function buildPaletteIndex(claims: readonly Claim[]): PaletteItem[] {
  const items: PaletteItem[] = [];

  // 1. Add items for every claim
  for (const claim of claims) {
    const hint = claim.provenance.length > 0 ? claim.provenance[0].knowledgeRef : null;
    items.push({
      id: claim.id,
      label: claim.quote,
      hint,
      kind: 'claim',
      focusNodeId: claim.id,
    });
  }

  // 2. Add items for distinct categories
  const categories = new Set(claims.map((c) => c.category));
  for (const category of categories) {
    items.push({
      id: `category-${category}`,
      label: category,
      hint: null,
      kind: 'topic',
      focusNodeId: `topic:${category}`,
    });
  }

  // 3. Add items for distinct moments (excluding 'none')
  const moments = new Set(
    claims.map((c) => c.moment).filter((m) => m !== 'none')
  );
  for (const moment of moments) {
    items.push({
      id: `moment-${moment}`,
      label: moment,
      hint: null,
      kind: 'moment',
      focusNodeId: moment,
    });
  }

  // 4. Add items for distinct non-null speakers
  const speakers = new Set(
    claims.map((c) => c.speaker).filter((s) => s !== null)
  );
  for (const speaker of speakers) {
    items.push({
      id: `speaker-${speaker}`,
      label: speaker,
      hint: null,
      kind: 'speaker',
      focusNodeId: speaker,
    });
  }

  return items;
}

/**
 * Filters and ranks the palette based on a search query.
 *
 * @param items - The built palette
 * @param query - The search string
 * @returns A filtered and sorted list of palette items
 */
export function filterPalette(items: PaletteItem[], query: string): PaletteItem[] {
  if (!query) {
    return items;
  }

  const lowerQuery = query.toLowerCase();

  const scored = items.map((item) => {
    const label = item.label.toLowerCase();
    const index = label.indexOf(lowerQuery);

    if (index === -1) {
      return { item, score: -1 };
    }

    // Score based on consecutive matches
    let score = 0;
    for (let i = 0; i < lowerQuery.length; i++) {
      if (label[index + i] === lowerQuery[i]) {
        score += 1;
      }
    }

    // Bonus for matches at the start of a word or the start of the string
    const before = label.substring(0, index);
    if (before === '' || (before.length > 0 && !/\w/.test(before[before.length - 1]))) {
      score += 10;
    }

    return { item, score };
  });

  return scored
    .filter((s) => s.score !== -1)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}
