/**
 * Retrieval over the expo knowledge base.
 *
 * Thresholds here are LOW on purpose. Short passages score around 0.44
 * similarity even when they are exactly the right answer, so raising the
 * threshold is how this breaks, not how it improves. Check the direction of any
 * comparison you change — inverting it once gave the strictest tenants the
 * fuzziest results in the product this was ported from.
 */

/** One row as the SQL function returns it. */
export interface KnowledgeMatch {
  chunkId: string;
  docId: string;
  text: string;
  title: string;
  speaker: string | null;
  titleConfidence: 'anchored' | 'interpolated';
  startSec: number;
  similarity: number;
}

/** A match, plus the sentence a UI may safely print under it. */
export interface Citation {
  chunkId: string;
  text: string;
  /** Safe to show. Never names a speaker we are not sure of. */
  label: string;
  /** Whether the session attribution was anchored on spoken content. */
  confidence: 'confirmed' | 'approximate';
  similarity: number;
}

export type QueryFn = (args: {
  embedding: readonly number[];
  matchCount: number;
  matchThreshold: number;
  corpus: string | null;
}) => Promise<readonly KnowledgeMatch[]>;

/** Deliberately low. See the file comment before changing it. */
export const DEFAULT_THRESHOLD = 0.3;
export const DEFAULT_MATCH_COUNT = 6;

/** Seconds -> "3h37m", the form the transcripts are indexed by. */
export function formatOffset(seconds: number): string {
  if (seconds < 0) {
    seconds = 0;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${hours}h${minutes.toString().padStart(2, '0')}m`;
}

/**
 * Build the citation line. THIS IS THE SAFETY MECHANISM — read the rules below.
 */
export function toCitation(match: KnowledgeMatch): Citation {
  let label: string;
  let confidence: 'confirmed' | 'approximate';
  
  if (match.titleConfidence === 'anchored') {
    confidence = 'confirmed';
    label = `${match.title}${match.speaker ? ' — ' + match.speaker : ''} · from ${formatOffset(match.startSec)}`;
  } else {
    // When titleConfidence is 'interpolated'
    confidence = 'approximate';
    label = `2026 Expo · from ${formatOffset(match.startSec)}`;
  }
  
  return {
    chunkId: match.chunkId,
    text: match.text,
    label,
    confidence,
    similarity: match.similarity
  };
}

export async function retrieve(
  embedding: readonly number[],
  query: QueryFn,
  opts?: { matchCount?: number; matchThreshold?: number; corpus?: string | null },
): Promise<Citation[]> {
  const results = await query({
    embedding,
    matchCount: opts?.matchCount ?? DEFAULT_MATCH_COUNT,
    matchThreshold: opts?.matchThreshold ?? DEFAULT_THRESHOLD,
    corpus: opts?.corpus ?? null
  });
  
  return results.map(toCitation);
}