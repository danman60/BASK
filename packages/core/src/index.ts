/**
 * @bask/core — domain types, insight rules engine, demo clock, consent filter,
 * metric baselines. Pure TS, zero UI deps: identical on server, web, and mobile.
 *
 * M0 step 1 seeds only the package identity; the clock (step 4), Evidence schema +
 * rules engine (step 5), session state machine + EquipmentDriver (step 7) and the
 * consent filter (step 11) land in later steps.
 */

export const PRODUCT_NAME = 'Bask';
export const DEALER_PRODUCT_NAME = 'Compass';
export const SPINE_VERSION = '0.0.0-m0';

/** Everything user-facing renders in this zone (see docs/plans constraint). */
export const DISPLAY_TIMEZONE = 'America/New_York';
