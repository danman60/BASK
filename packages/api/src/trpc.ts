/**
 * tRPC initialisation + RBAC middleware.
 *
 * Conventions lifted from CompPortal `src/server/trpc.ts` (read 2026-08-07 for the
 * anti-dup gate): superjson transformer, a zod-aware `errorFormatter` that flattens
 * validation errors onto `data.zodError`, and procedures composed as a chain of
 * `.use()` guards that each throw a `TRPCError` and re-`next()` with a narrowed ctx.
 *
 * Deliberately NOT lifted: their `protectedProcedure`/`adminProcedure` gate on
 * `ctx.userId` from Supabase auth. Bask has no auth until M3 — the guards here gate
 * on the demo role and on whether a salon is in scope.
 */

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

import type { Context } from './context';
import { type DemoRole, DEMO_ROLE_LABELS, SALON_ROLES, UVALUX_ROLES } from './roles';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;
export const createCallerFactory = t.createCallerFactory;

/** No guard. Demo-harness and health procedures only. */
export const publicProcedure = t.procedure;

/**
 * Throws unless the caller holds one of `allowed`. Message is plain-language
 * because a non-technical user can trip this with the role switch
 * (IMPLEMENTATION_SPEC §3).
 */
function assertRole(role: DemoRole, allowed: readonly DemoRole[]): void {
  if (!allowed.includes(role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `${DEMO_ROLE_LABELS[role]} can't open this. Switch to ${allowed
        .map((r) => DEMO_ROLE_LABELS[r])
        .join(' or ')}.`,
    });
  }
}

/**
 * Standalone role guard, for procedures that need no other narrowing.
 *
 * NOT used by the salon-scoped procedures below: a standalone `middleware()` is
 * typed against the ROOT context, so composing one after `salonProcedure` threw
 * away its `salonId: string` narrowing and every salon router got
 * `string | null` back. Those compose the check inline instead, which preserves
 * the incoming context type.
 */
export function requireRole(...allowed: readonly DemoRole[]) {
  return middleware(({ ctx, next }) => {
    assertRole(ctx.role, allowed);
    return next({ ctx });
  });
}

/**
 * Requires a salon in scope, and narrows `ctx.salonId` to non-null for the
 * procedure body. Anything reading a tenant table needs this.
 */
export const salonProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.salonId) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'No salon in scope. Run `pnpm demo:reset` to seed the demo dataset.',
    });
  }
  return next({ ctx: { ...ctx, salonId: ctx.salonId, salonSlug: ctx.salonSlug } });
});

/** Bask salon surfaces: owner + front desk. */
export const staffProcedure = salonProcedure.use(({ ctx, next }) => {
  assertRole(ctx.role, SALON_ROLES);
  return next({ ctx });
});

/** Owner-only salon surfaces (marketing sends, settings, money). */
export const ownerProcedure = salonProcedure.use(({ ctx, next }) => {
  assertRole(ctx.role, ['owner']);
  return next({ ctx });
});

/**
 * Compass surfaces. NOT salon-scoped — a rep reads a portfolio of accounts, always
 * through `packages/core/consent.ts` (M0 step 11); no Compass router may ship raw
 * salon data before that filter exists (IMPLEMENTATION_SPEC §2).
 */
export const compassProcedure = publicProcedure.use(requireRole(...UVALUX_ROLES));

/** Leadership-only Compass surfaces (network rollups). */
export const leadershipProcedure = publicProcedure.use(requireRole('uvalux_leadership'));
