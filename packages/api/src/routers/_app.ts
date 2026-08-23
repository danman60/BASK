/**
 * Root router. Namespace per surface domain, matching `API_SURFACE_DOMAINS`.
 * (`_app.ts` naming follows CompPortal's `src/server/routers/_app.ts`.)
 */

import { router } from '../trpc';
import { compassRouter, dataSharingRouter } from './compass';
import { customersRouter } from './customers';
import { demoRouter } from './demo';
import { knowledgeRouter } from './knowledge';
import { marketingRouter } from './marketing';
import {
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
  /**
   * Internal UVALUX knowledge curation. Sits beside `compass` rather than under
   * it because it is guarded by role alone — it holds no salon data, so the
   * consent filter has nothing to filter. See the header of `knowledge.ts`.
   */
  knowledge: knowledgeRouter,
  settings: settingsRouter,
  /**
   * Bask-side "What UVALUX sees" (PRODUCT_SPEC §15). Its own namespace rather
   * than `settings.dataSharing` so the consent screen and the Compass router it
   * describes stay in one file — they are one feature.
   */
  dataSharing: dataSharingRouter,
  demo: demoRouter,
});

export type AppRouter = typeof appRouter;
