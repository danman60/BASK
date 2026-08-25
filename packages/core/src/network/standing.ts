/**
 * Calculates a salon's standing against peers in a network.
 *
 * A plain leaderboard is hostile. An owner told they are 47th of 60, or that
 * they trail the shop down the road, either argues with it or stops opening
 * the product. Two rules make a standing usable instead: the peers must be
 * salons the owner does not compete with, and the answer must be a BAND and
 * a GAP rather than a position in a list. This module only ever produces a
 * band and a gap — it must not expose an ordinal rank, because the surface
 * cannot show what it never receives.
 */

import { MIN_SALONS_FOR_CONFIDENCE, NetworkOutcomeSummary } from './outcomes';

/**
 * The four bands that describe a salon's standing relative to peers.
 *
 * These mirror the existing PositionBand vocabulary in the UI package so the
 * two cannot drift apart.
 */
export type StandingBand = 'top' | 'above' | 'below' | 'bottom';

/**
 * A metric used to evaluate peer performance.
 */
export interface PeerMetric {
  /** Unique identifier for the metric. */
  readonly key: string;
  /** Human-readable label for the metric. */
  readonly label: string;
  /** The salon's value for this metric. */
  readonly you: number;
  /** Values for this metric from non-competing peers. */
  readonly peerValues: readonly number[];
  /** Whether a higher value is better for this metric. */
  readonly higherIsBetter: boolean;
}

/**
 * The standing of a salon for a single metric.
 */
export interface MetricStanding {
  /** Unique identifier for the metric. */
  readonly key: string;
  /** Human-readable label for the metric. */
  readonly label: string;
  /** The salon's value for this metric. */
  readonly you: number;
  /** The median value among peers for this metric. */
  readonly median: number;
  /** The gap to the median, positive when ahead in the direction that counts as good. */
  readonly gapToMedian: number;
  /** The band describing the salon's standing relative to peers. */
  readonly band: StandingBand;
  /** The number of peer salons considered for this metric. */
  readonly peerCount: number;
}

/**
 * Calculates the median of a set of numbers.
 *
 * Returns a true median, averaging the two middle values on an even count.
 * An empty array returns 0. Never NaN or Infinity.
 *
 * @param values The numbers to calculate the median of
 * @returns The median value, or 0 if the array is empty
 */
export function medianOf(values: readonly number[]): number {
  // Handle empty array case
  if (values.length === 0) return 0;

  // Create a copy and sort it
  const sorted = [...values].sort((a, b) => a - b);
  const length = sorted.length;
  
  // If odd count, return the middle element
  if (length % 2 === 1) {
    return sorted[Math.floor(length / 2)];
  }
  
  // If even count, return average of two middle elements
  const mid1 = sorted[length / 2 - 1];
  const mid2 = sorted[length / 2];
  return (mid1 + mid2) / 2;
}

/**
 * Determines the band for a salon's standing relative to peers.
 *
 * Work out the share of peers the salon beats, in whichever direction counts
 * as good. Top quarter is 'top', above the median is 'above', below the median
 * is 'below', bottom quarter is 'bottom'. Fewer than four peers always returns
 * 'above' — with three peers a quartile is meaningless and calling somebody
 * 'bottom' on that basis is both wrong and discouraging. An empty peer list also
 * returns 'above'.
 *
 * @param you The salon's value for the metric
 * @param peerValues Values for this metric from non-competing peers
 * @param higherIsBetter Whether a higher value is better for this metric
 * @returns The band describing the salon's standing
 */
export function bandFor(
  you: number,
  peerValues: readonly number[],
  higherIsBetter: boolean,
): StandingBand {
  // Handle empty peer list case
  if (peerValues.length === 0) return 'above';
  
  // If fewer than four peers, always return 'above'
  if (peerValues.length < 4) return 'above';
  
  // Count how many peers the salon beats
  let beatCount = 0;
  for (const peerValue of peerValues) {
    if (higherIsBetter) {
      if (you > peerValue) beatCount++;
    } else {
      if (you < peerValue) beatCount++;
    }
  }
  
  // Calculate the share of peers beaten
  const share = beatCount / peerValues.length;
  
  // Return band based on the share
  if (share >= 0.75) return 'top';
  if (share >= 0.5) return 'above';
  if (share >= 0.25) return 'below';
  return 'bottom';
}

/**
 * Calculates the standing for a single metric.
 *
 * Assembles all the information needed to describe how a salon performs
 * relative to peers on one metric.
 *
 * @param metric The metric to calculate standing for
 * @returns The standing information for this metric
 */
export function standingFor(metric: PeerMetric): MetricStanding {
  const median = medianOf(metric.peerValues);
  
  // Calculate gap to median
  let gapToMedian: number;
  if (metric.higherIsBetter) {
    gapToMedian = metric.you - median;
  } else {
    gapToMedian = median - metric.you;
  }
  
  const band = bandFor(metric.you, metric.peerValues, metric.higherIsBetter);
  
  return {
    key: metric.key,
    label: metric.label,
    you: metric.you,
    median,
    gapToMedian,
    band,
    peerCount: metric.peerValues.length,
  };
}

/**
 * Finds the best performing metric for a salon.
 *
 * Returns the metric the salon does best on, preferring a better band first
 * and a larger gap second. Returns null for an empty list. This exists so every
 * owner has something they are winning at — a screen with nothing but shortfalls
 * on it does not get opened twice.
 *
 * @param standings The standing information for each metric
 * @returns The best performing metric, or null if the list is empty
 */
export function bestMetric(standings: readonly MetricStanding[]): MetricStanding | null {
  // Handle empty list case
  if (standings.length === 0) return null;
  
  // Define band ranking (better bands come first)
  const bandRanking: Record<StandingBand, number> = {
    'top': 4,
    'above': 3,
    'below': 2,
    'bottom': 1,
  };
  
  // Find the best metric
  let best: MetricStanding | null = null;
  for (const standing of standings) {
    if (best === null) {
      best = standing;
      continue;
    }
    
    // Compare bands first
    if (bandRanking[standing.band] > bandRanking[best.band]) {
      best = standing;
      continue;
    }
    
    // If bands are equal, compare gaps
    if (bandRanking[standing.band] === bandRanking[best.band] && 
        standing.gapToMedian > best.gapToMedian) {
      best = standing;
    }
  }
  
  return best;
}