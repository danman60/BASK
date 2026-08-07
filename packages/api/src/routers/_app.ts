/**
 * Root router. Namespace per surface domain, matching `API_SURFACE_DOMAINS`.
 * (`_app.ts` naming follows CompPortal's `src/server/routers/_app.ts`.)
 */

import { router } from '../trpc';
import { customersRouter } from './customers';
import { demoRouter } from './demo';
import { marketingRouter } from './marketing';
import {
  compassRouter,
  floorRouter,
  insightsRouter,
  inventoryRouter,
  settingsRouter,
  todayRouter,
} from './domains';

export const appRouter = router({
  today: todayRouter,
  floor: floorRouter,
  customers: customersRouter,
  marketing: marketingRouter,
  inventory: inventoryRouter,
  insights: insightsRouter,
  compass: compassRouter,
  settings: settingsRouter,
  demo: demoRouter,
});

export type AppRouter = typeof appRouter;
