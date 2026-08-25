/**
 * Network-wide action outcome types and aggregation.
 *
 * The product already shows a salon its OWN outcome for an action it ran. It cannot
 * yet answer the question an owner actually asks: 'did this work for anyone else
 * like me'. Aggregating what happened across many salons turns the recommendation
 * engine into something that learns from its own results — and it fills gaps the
 * recorded coaching material does not cover.
 *
 * This module defines the types for individual outcomes and provides a function to
 * aggregate those outcomes across the network, enabling insights about how actions
 * perform in similar contexts.
 */

import type {
  OpportunityAction,
  ActionKind,
} from '../opportunities/types';

/**
 * A record of one salon's result from running one recommended action.
 *
 * This represents the outcome data for a single salon that executed an action,
 * capturing both whether it was effective and how quickly results were seen.
 */
export interface NetworkOutcomeRecord {
  /** The opaque identifier for the salon that ran the action. */
  readonly salonId: string;
  /** The key identifying which recommended action was run. */
  readonly actionKey: string;
  /** The business condition that triggered this action recommendation. */
  readonly signalType: string;
  /** Whether the tracked metric moved the right way (true = improved). */
  readonly improved: boolean;
  /** How far the metric moved in percentage points, negative if it went the wrong way. */
  readonly deltaPoints: number;
  /** Number of days between when the action was recommended and when results were seen. */
  readonly daysToResult: number;
}

/**
 * A summary of outcomes for a group of salons that ran the same action.
 *
 * This aggregates the results from multiple salons to provide network-level insights
 * about how effective an action is, including success rate and typical performance.
 */
export interface NetworkOutcomeSummary {
  /** The key identifying which recommended action was run. */
  readonly actionKey: string;
  /** The business condition that triggered this action recommendation. */
  readonly signalType: string;
  /** Total number of salons that tried this action. */
  readonly salonsTried: number;
  /** Number of salons where the tracked metric moved the right way. */
  readonly salonsImproved: number;
  /** The proportion of salons that improved (between 0 and 1). */
  readonly successRate: number;
  /** Median change in percentage points across all salons that tried this action. */
  readonly medianDeltaPoints: number;
  /** Median number of days between recommendation and seeing results. */
  readonly medianDaysToResult: number;
  /** Whether the sample size is large enough to be considered reliable evidence. */
  readonly confident: boolean;
}

/**
 * Minimum number of salons required for a summary to be considered reliable.
 *
 * Below this threshold, a success rate is anecdote rather than evidence, and
 * the surface must say so rather than quoting a percentage off two salons.
 */
export const MIN_SALONS_FOR_CONFIDENCE = 5;

/**
 * Aggregates network outcome records into summaries by action and signal type.
 *
 * Groups records by actionKey and signalType, then computes statistics for each group.
 * The success rate is calculated as salonsImproved divided by salonsTried.
 * Confident is true only when salonsTried is at least MIN_SALONS_FOR_CONFIDENCE.
 * Uses a true median (not a mean) to avoid being skewed by outliers.
 * Sorts results so confident groups come first, then by success rate descending,
 * then by salonsTried descending.
 *
 * @param records The collection of outcome records to aggregate
 * @returns An array of summaries, sorted by usefulness
 */
export function summariseNetworkOutcomes(
  records: readonly NetworkOutcomeRecord[],
): NetworkOutcomeSummary[] {
  // Handle empty input
  if (records.length === 0) {
    return [];
  }

  // Group records by actionKey and signalType
  const groups = new Map<string, NetworkOutcomeRecord[]>();
  
  for (const record of records) {
    const key = `${record.actionKey}|${record.signalType}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  }

  // Calculate summary for each group
  const summaries: NetworkOutcomeSummary[] = [];
  
  for (const groupRecords of groups.values()) {
    // Read the pair off the first record rather than splitting the map key. A
    // key built by joining on '|' cannot be taken apart again if either value
    // contains a '|' — an actionKey of 'a|b' silently came back as 'a'.
    const { actionKey, signalType } = groupRecords[0];
    
    const salonsTried = groupRecords.length;
    const salonsImproved = groupRecords.filter(r => r.improved).length;
    const successRate = salonsTried > 0 ? salonsImproved / salonsTried : 0;
    
    // Calculate medians
    const deltaPoints = [...groupRecords]
      .map(r => r.deltaPoints)
      .sort((a, b) => a - b);
    const daysToResult = [...groupRecords]
      .map(r => r.daysToResult)
      .sort((a, b) => a - b);
    
    let medianDeltaPoints: number;
    let medianDaysToResult: number;
    
    if (deltaPoints.length === 0) {
      medianDeltaPoints = 0;
    } else if (deltaPoints.length % 2 === 1) {
      // Odd count: take the middle element
      medianDeltaPoints = deltaPoints[Math.floor(deltaPoints.length / 2)];
    } else {
      // Even count: average of two middle elements
      const mid1 = deltaPoints[deltaPoints.length / 2 - 1];
      const mid2 = deltaPoints[deltaPoints.length / 2];
      medianDeltaPoints = (mid1 + mid2) / 2;
    }
    
    if (daysToResult.length === 0) {
      medianDaysToResult = 0;
    } else if (daysToResult.length % 2 === 1) {
      // Odd count: take the middle element
      medianDaysToResult = daysToResult[Math.floor(daysToResult.length / 2)];
    } else {
      // Even count: average of two middle elements
      const mid1 = daysToResult[daysToResult.length / 2 - 1];
      const mid2 = daysToResult[daysToResult.length / 2];
      medianDaysToResult = (mid1 + mid2) / 2;
    }
    
    const confident = salonsTried >= MIN_SALONS_FOR_CONFIDENCE;
    
    summaries.push({
      actionKey,
      signalType,
      salonsTried,
      salonsImproved,
      successRate,
      medianDeltaPoints,
      medianDaysToResult,
      confident
    });
  }

  // Sort summaries: confident groups first, then by success rate descending, then by salonsTried descending
  summaries.sort((a, b) => {
    if (a.confident !== b.confident) {
      return b.confident ? 1 : -1;
    }
    if (a.successRate !== b.successRate) {
      return b.successRate - a.successRate;
    }
    return b.salonsTried - a.salonsTried;
  });

  return summaries;
}