/**
 * Surface-domain router stubs (M0 step 3).
 *
 * One router per surface in the plan: today · floor · customers · marketing ·
 * inventory · insights · compass · settings. They are stubs on purpose — M0 is the
 * spine, and the real procedures land with their surfaces in M1/M2
 * (IMPLEMENTATION_SPEC §7). What is NOT a stub is the guard on each: every router
 * is already mounted behind the right procedure, so no M1 procedure can be added
 * to an unguarded namespace by accident.
 *
 * Each exposes `surface()`, which returns the domain's identity plus the caller's
 * resolved scope. That is enough for /dev/api to prove the RBAC middleware works
 * (switch role → Compass surfaces start returning FORBIDDEN) without any fixtures.
 */

import { readSalonScope } from '@bask/db';

import {
  compassProcedure,
  ownerProcedure,
  publicProcedure,
  router,
  salonProcedure,
  staffProcedure,
} from '../trpc';
import type { ApiSurfaceDomain } from '../surfaces';

interface SurfaceMeta {
  domain: ApiSurfaceDomain;
  /** Which milestone fills this in. */
  buildsIn: 'M1' | 'M2';
  /** Plain-language description — reused by the /dev/api harness listing. */
  summary: string;
}

/** Salon-scoped surface: echoes the scope the guards resolved. */
function salonSurface(meta: SurfaceMeta) {
  return {
    ...meta,
    scoped: 'salon' as const,
    implemented: false,
  };
}

function networkSurface(meta: SurfaceMeta) {
  return { ...meta, scoped: 'uvalux-network' as const, implemented: false };
}

export const todayRouter = router({
  surface: staffProcedure.query(({ ctx }) => ({
    ...salonSurface({
      domain: 'today',
      buildsIn: 'M1',
      summary: 'Daybreak brief, pulse tiles and the ranked insight cards.',
    }),
    salonId: ctx.salonId,
    role: ctx.role,
  })),
});

export const floorRouter = router({
  surface: staffProcedure.query(({ ctx }) => ({
    ...salonSurface({
      domain: 'floor',
      buildsIn: 'M1',
      summary: 'Front-desk room board, check-in, POS and schedule.',
    }),
    salonId: ctx.salonId,
    role: ctx.role,
  })),
});

// `customersRouter` and `marketingRouter` have left this file: M1 Lane 3 filled
// them in, and they now live in `./customers.ts` and `./marketing.ts` with the
// rest of their procedures. Both kept their `surface()` query, so `/dev/api`
// still lists every domain.

export const inventoryRouter = router({
  surface: staffProcedure.query(({ ctx }) => ({
    ...salonSurface({
      domain: 'inventory',
      buildsIn: 'M1',
      summary: 'Stock levels, receiving by barcode, sell-through and reorder points.',
    }),
    salonId: ctx.salonId,
    role: ctx.role,
  })),
});

export const insightsRouter = router({
  surface: salonProcedure.query(({ ctx }) => ({
    ...salonSurface({
      domain: 'insights',
      buildsIn: 'M1',
      summary: 'Insight feed with Evidence, state transitions and linked actions.',
    }),
    salonId: ctx.salonId,
    role: ctx.role,
  })),
});

export const compassRouter = router({
  // NOT salon-scoped, and NOT shippable beyond this stub until the consent filter
  // exists (packages/core/consent.ts, M0 step 11 — IMPLEMENTATION_SPEC §2).
  surface: compassProcedure.query(({ ctx }) => ({
    ...networkSurface({
      domain: 'compass',
      buildsIn: 'M1',
      summary: 'Dealer network, accounts, signals and the rep call list.',
    }),
    role: ctx.role,
    consentFilterReady: false,
  })),
});

export const settingsRouter = router({
  /**
   * Public so any role can read who the server thinks they are — this is what the
   * Presenter Panel's role badge and /dev/api render.
   */
  whoami: publicProcedure.query(({ ctx }) => ({
    role: ctx.role,
    salonId: ctx.salonId,
    salonSlug: ctx.salonSlug,
  })),

  /**
   * Proves RLS scoping end to end: opens a scoped transaction and reads the
   * `app.salon_id` GUC back out of Postgres. `gucSalonId` matching `ctx.salonId`
   * means `bask.current_salon_id()` — and therefore every `salon_isolation`
   * policy — resolves correctly on this connection. /dev/api renders it.
   */
  scopeProbe: salonProcedure.query(async ({ ctx }) =>
    ctx.runScoped(async (tx) => ({
      contextSalonId: ctx.salonId,
      gucSalonId: await readSalonScope(tx),
    })),
  ),

  surface: ownerProcedure.query(({ ctx }) => ({
    ...salonSurface({
      domain: 'settings',
      buildsIn: 'M1',
      summary: 'Salon profile, staff, theme choice, consent tier and equipment.',
    }),
    salonId: ctx.salonId,
    role: ctx.role,
  })),
});
