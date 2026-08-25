/**
 * Types and logic for the wins feed: what other salons achieved by running a recommendation this product made.
 *
 * WHY THIS EXISTS: a salon owner will not act because software told them to. They act because salons like theirs
 * already did it and it worked. But an owner will only tolerate being IN such a feed if they are not being shown
 * to their local competition — so filtering out nearby salons is the rule that makes the whole feature possible,
 * not an optional setting.
 */

import { NetworkOutcomeRecord, NetworkOutcomeSummary, MIN_SALONS_FOR_CONFIDENCE } from './outcomes';

/**
 * A salon win represents a successful action taken by another salon that resulted in measurable improvement.
 * The win shows what worked for similar salons and can inspire action.
 */
export interface SalonWin {
  /** Unique identifier for this win record */
  readonly id: string;
  /** Opaque salon identifier, not to be displayed directly */
  readonly salonId: string;
  /** Town label for the winning salon (e.g. 'Burlington ON') */
  readonly townLabel: string;
  /** Key identifying the action that was taken */
  readonly actionKey: string;
  /** Plain words describing what the salon did */
  readonly actionLabel: string;
  /** Condition that triggered this win (e.g. 'product per visit increased') */
  readonly signalType: string;
  /** What metric moved to produce this result */
  readonly metricLabel: string;
  /** Formatted delta showing improvement (e.g. '+1.4 points') */
  readonly deltaLabel: string;
  /** True if the action resulted in improvement */
  readonly improved: boolean;
  /** Number of days between action and result being observed */
  readonly daysToResult: number;
  /** Day index when the win occurred (not a Date, to keep this module pure) */
  readonly occurredAtDay: number;
}

/**
 * Viewer context provides information about the current salon to determine if wins are relevant.
 */
export interface ViewerContext {
  /** Opaque salon identifier of the viewer */
  readonly salonId: string;
  /** Town label of the viewer's salon */
  readonly townLabel: string;
  /** Latitude coordinate of the viewer's salon */
  readonly latitude: number;
  /** Longitude coordinate of the viewer's salon */
  readonly longitude: number;
}

/**
 * Options for filtering and ranking wins in the feed.
 */
export interface WinFeedOptions {
  /** If true, exclude wins from salons in the same town */
  readonly excludeSameTown: boolean;
  /** Exclude wins from salons within this distance (km) */
  readonly excludeWithinKm: number;
  /** Maximum number of wins to return */
  readonly maxItems: number;
}

/**
 * Default options for the win feed - a starting position the salon owner is allowed to widen,
 * never narrow past zero.
 */
export const DEFAULT_WIN_FEED_OPTIONS: WinFeedOptions = {
  excludeSameTown: true,
  excludeWithinKm: 25,
  maxItems: 30,
};

/**
 * Calculates the great-circle distance between two points using the haversine formula.
 * Earth radius is 6371 km.
 *
 * @param aLat Latitude of point A
 * @param aLon Longitude of point A
 * @param bLat Latitude of point B
 * @param bLon Longitude of point B
 * @returns Distance in kilometers (always a finite number)
 */
export function distanceKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  // Convert degrees to radians
  const lat1Rad = aLat * Math.PI / 180;
  const lon1Rad = aLon * Math.PI / 180;
  const lat2Rad = bLat * Math.PI / 180;
  const lon2Rad = bLon * Math.PI / 180;

  // Haversine formula
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = 6371 * c;

  // Always return a finite number; identical points return 0
  return isFinite(distance) ? distance : 0;
}

/**
 * Determines if a win should be shown to the viewer based on non-compete filtering rules.
 *
 * The answer is false (DO NOT SHOW) when:
 * - The win belongs to the viewer's own salon
 * - excludeSameTown is true and the town labels match ignoring case and surrounding spaces
 * - The distance is at or below excludeWithinKm
 *
 * When in doubt, the answer is false: showing a competitor by mistake is the failure that loses trust,
 * showing one salon fewer costs nothing.
 *
 * @param viewer Context about the current salon
 * @param win The win to evaluate
 * @param winLat Latitude of the winning salon
 * @param winLon Longitude of the winning salon
 * @param options Feed filtering options
 * @returns true if the win should be shown, false otherwise
 */
export function isNonCompeting(
  viewer: ViewerContext,
  win: SalonWin,
  winLat: number,
  winLon: number,
  options: WinFeedOptions,
): boolean {
  // Don't show wins from the viewer's own salon
  if (win.salonId === viewer.salonId) return false;

  // If excludeSameTown is true, check town labels
  if (options.excludeSameTown) {
    const viewerTown = viewer.townLabel.trim().toLowerCase();
    const winTown = win.townLabel.trim().toLowerCase();
    if (viewerTown === winTown) return false;
  }

  // Check distance - don't show wins within excludeWithinKm
  const distance = distanceKm(viewer.latitude, viewer.longitude, winLat, winLon);
  if (distance <= options.excludeWithinKm) return false;

  // If we pass all checks, the win is non-competitive and should be shown
  return true;
}

/**
 * Ranks wins by relevance to the viewer, keeping only those that resulted in improvement.
 *
 * The most useful wins come first: more recent before older (compare occurredAtDay against currentDay),
 * and where two wins are equally recent, the one that took fewer days to show a result comes first.
 *
 * @param wins Array of potential wins to rank
 * @param currentDay Current day index (not a Date)
 * @param maxItems Maximum number of wins to return
 * @returns Ranked array of wins (at most maxItems items)
 */
export function rankWins(
  wins: readonly SalonWin[],
  currentDay: number,
  maxItems: number,
): SalonWin[] {
  // Filter out wins that didn't result in improvement
  const improvedWins = wins.filter(win => win.improved);
  
  // Sort by recency first (most recent first), then by days to result (fewer days first)
  const sortedWins = improvedWins.sort((a, b) => {
    // Most recent wins come first
    const dayDiffA = currentDay - a.occurredAtDay;
    const dayDiffB = currentDay - b.occurredAtDay;
    
    if (dayDiffA !== dayDiffB) {
      // dayDiff is AGE, so the SMALLER age is the more recent win.
      return dayDiffA - dayDiffB;
    }
    
    // If same recency, wins with fewer days to result come first
    return a.daysToResult - b.daysToResult;
  });
  
  // Return at most maxItems
  return sortedWins.slice(0, maxItems);
}