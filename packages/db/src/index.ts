export { db, createPrismaClient, loadDbEnv } from './client';
export type { ClientOptions, PrismaClient } from './client';
export { withSalonScope, readSalonScope } from './scope';
export type { ScopedDb } from './scope';
export { WINDOWS, buildFacts, type FactsInput } from './facts';
export { createPrismaPipelinePorts } from './ports';

/** Schema enums (StaffRole, InsightState, …) — the client-safe generated file. */
export * from '../generated/prisma/enums';
