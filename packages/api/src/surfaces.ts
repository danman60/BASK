/**
 * The surface domains the API is partitioned by. Moved out of `index.ts` (where M0
 * step 1 seeded it) so routers can import the type without pulling the whole
 * server-only router tree into a client bundle.
 */

export const API_SURFACE_DOMAINS = [
  'today',
  'floor',
  'customers',
  'marketing',
  'inventory',
  'insights',
  'compass',
  'settings',
  'demo',
] as const;

export type ApiSurfaceDomain = (typeof API_SURFACE_DOMAINS)[number];
