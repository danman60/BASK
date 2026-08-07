/**
 * Browser tRPC client. `AppRouter` is a type-only import, so the server router
 * tree (and Prisma with it) never reaches the client bundle.
 */

import type { AppRouter } from '@bask/api';
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>();
