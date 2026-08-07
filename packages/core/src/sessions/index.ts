/**
 * `@bask/core/sessions` — room/session state machine + equipment driver layer
 * (M0 step 7; IMPLEMENTATION_SPEC §5.2, DESIGN_SPEC §3.2).
 *
 * Everything here is pure TypeScript with no DB, network, or React dependency.
 * The server binds it to Prisma and Supabase Realtime; the client imports only
 * the types and `deriveRoomView`/`formatCountdown` so both sides agree on what a
 * room card means without either side owning a transition.
 */

export * from './types';
export * from './driver';
export * from './machine';
export * from './simulated-driver';
