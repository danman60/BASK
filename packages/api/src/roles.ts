/**
 * Demo roles — the Presenter Panel's role switch (M0 step 10).
 *
 * NO AUTH MACHINERY. The role is whatever the request says it is: a URL param or
 * an `x-bask-role` header. That is an explicit non-goal until M3
 * (IMPLEMENTATION_SPEC §1.2, plan step 10) — the demo is a single seeded tenant
 * with a role switcher, and pretending otherwise buys nothing a pitch can show.
 *
 * These are NOT a parallel role taxonomy: `DemoRole` is a compile-checked subset
 * of the schema's `bask.staff_role` enum (owner · manager · front_desk · staff ·
 * uvalux_rep · uvalux_leadership). The panel exposes the four the pitch script
 * names; M3 swaps the SOURCE of the role from the URL to a session without
 * renaming anything.
 */

import type { StaffRole } from '@bask/db';

/**
 * Request headers the Presenter Panel uses to carry demo scope. They live in this
 * client-safe module (not `context.ts`) because the browser tRPC link has to set
 * them, and importing the server context would drag Prisma into the client bundle.
 */
export const ROLE_HEADER = 'x-bask-role';
export const SALON_HEADER = 'x-bask-salon';

export const DEMO_ROLES = [
  'owner',
  'front_desk',
  'uvalux_rep',
  'uvalux_leadership',
] as const satisfies readonly StaffRole[];

export type DemoRole = (typeof DEMO_ROLES)[number];

export const DEFAULT_DEMO_ROLE: DemoRole = 'owner';

/** Plain-language labels — the Presenter Panel and any role badge read these. */
export const DEMO_ROLE_LABELS: Record<DemoRole, string> = {
  owner: 'Owner',
  front_desk: 'Front desk',
  uvalux_rep: 'UVALUX rep',
  uvalux_leadership: 'Leadership',
};

/** Roles that belong to a salon (Bask surfaces). */
export const SALON_ROLES = ['owner', 'front_desk'] as const satisfies readonly DemoRole[];

/** Roles that belong to UVALUX (Compass surfaces). */
export const UVALUX_ROLES = ['uvalux_rep', 'uvalux_leadership'] as const satisfies
  readonly DemoRole[];

export function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === 'string' && (DEMO_ROLES as readonly string[]).includes(value);
}

/** Never throws — an unknown or absent role falls back to the default. */
export function parseDemoRole(value: unknown): DemoRole {
  return isDemoRole(value) ? value : DEFAULT_DEMO_ROLE;
}
