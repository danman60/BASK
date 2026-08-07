/**
 * @bask/api — tRPC routers + zod schemas. One API for web and mobile.
 *
 * M0 step 3: context (salon scope + role), RBAC middleware, and one router per
 * surface domain (today, floor, customers, marketing, inventory, insights,
 * compass, settings, demo).
 *
 * This entry point pulls in the Prisma client — SERVER ONLY. Clients import
 * `type { AppRouter }` (type-only, erased at compile time) plus the role helpers,
 * never the router values.
 */

export { API_SURFACE_DOMAINS, type ApiSurfaceDomain } from './surfaces';

export { appRouter, type AppRouter } from './routers/_app';

export { createContext, ROLE_HEADER, SALON_HEADER, type Context } from './context';

export {
  DEMO_ROLES,
  DEMO_ROLE_LABELS,
  DEFAULT_DEMO_ROLE,
  SALON_ROLES,
  UVALUX_ROLES,
  isDemoRole,
  parseDemoRole,
  type DemoRole,
} from './roles';

export {
  createCallerFactory,
  compassProcedure,
  leadershipProcedure,
  middleware,
  ownerProcedure,
  publicProcedure,
  requireRole,
  router,
  salonProcedure,
  staffProcedure,
} from './trpc';

export { DEMO_STATE_ID, createPrismaDemoClockStore, ensureDemoState, stubDayZero } from './demo/clock';
