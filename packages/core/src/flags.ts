/**
 * Feature flags for controlling surface visibility.
 *
 * Surfaces get built before they have enough data to look alive. A wins feed with
 * three salons in it reads as a dead product, so we need to switch a whole surface
 * off without deleting its route or its nav entry.
 */

import { relativeShortfall } from './insights/scaling';

/**
 * The keys for all available feature flags.
 *
 * winsFeed - Controls the visibility of the wins feed surface.
 * community - Controls the visibility of the community surface.
 * networkOutcomes - Controls the visibility of the network outcomes surface.
 */
export const FLAG_KEYS = ['winsFeed', 'community', 'networkOutcomes'] as const;

/**
 * Type representing a flag key, derived from FLAG_KEYS.
 */
export type FlagKey = typeof FLAG_KEYS[number];

/**
 * Interface defining the state of all feature flags.
 *
 * Each flag key maps to a boolean indicating whether that surface is enabled.
 */
export interface FlagState {
  readonly winsFeed: boolean;
  readonly community: boolean;
  readonly networkOutcomes: boolean;
}

/**
 * Default flag state with all flags set to false.
 *
 * OFF is the default on purpose: a surface has to be switched on deliberately
 * once it has enough real data behind it, never on by accident.
 */
export const DEFAULT_FLAGS: FlagState = {
  winsFeed: false,
  community: false,
  networkOutcomes: false,
};

/**
 * Reads feature flags from an environment-like object.
 *
 * For each flag key, looks for an entry named 'BASK_FLAG_' followed by the key
 * in UPPER SNAKE CASE. A value of '1', 'true', 'yes' or 'on' in any casing,
 * ignoring surrounding spaces, means true. Anything else, including missing,
 * means false. Never throws on odd input.
 *
 * @param source Environment-like object to read flags from
 * @returns The parsed flag state
 */
export function readFlags(
  source: Readonly<Record<string, string | undefined>>,
): FlagState {
  // Build the result object directly without using Partial
  const winsFeed = getFlagValue(source, 'winsFeed');
  const community = getFlagValue(source, 'community');
  const networkOutcomes = getFlagValue(source, 'networkOutcomes');

  return {
    winsFeed,
    community,
    networkOutcomes
  };
}

/**
 * Helper function to get the boolean value for a flag from environment variables.
 *
 * @param source Environment-like object to read flags from
 * @param key The flag key to look up
 * @returns true if the flag is enabled, false otherwise
 */
function getFlagValue(source: Readonly<Record<string, string | undefined>>, key: FlagKey): boolean {
  // Convert the key to UPPER_SNAKE_CASE format for environment variable lookup
  const envKey = `BASK_FLAG_${key.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}`;
  
  const value = source[envKey];
  
  if (value === undefined) {
    return false;
  } else {
    // Check if the value is one of the truthy values (case insensitive)
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === '1' || 
           normalizedValue === 'true' || 
           normalizedValue === 'yes' || 
           normalizedValue === 'on';
  }
}

/**
 * Checks if a specific flag is enabled.
 *
 * A small reader so calling code never indexes the record directly.
 *
 * @param flags The current flag state
 * @param key The flag key to check
 * @returns true if the flag is enabled, false otherwise
 */
export function isEnabled(flags: FlagState, key: FlagKey): boolean {
  return flags[key];
}