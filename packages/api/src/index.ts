/**
 * @bask/api — tRPC routers + zod schemas. One API for web and mobile.
 *
 * M0 step 3 fills this in: context (salon scope + role), RBAC middleware, and one
 * router per surface domain (today, floor, customers, marketing, inventory,
 * insights, compass, settings, demo).
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
