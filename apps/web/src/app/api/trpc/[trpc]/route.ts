/**
 * tRPC HTTP endpoint. Standard Next App Router integration — the fetch adapter,
 * mounted on a catch-all segment, same shape as CompPortal's
 * `src/app/api/trpc/[trpc]/route.ts`.
 *
 * `createContext` reads scope off the request itself (headers, then query params),
 * so this handler stays a pass-through and the resolution rules live in one place
 * in `@bask/api`.
 */

import { appRouter, createContext } from '@bask/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

// Prisma needs the Node runtime, and every procedure reads per-request scope.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ headers: req.headers, url: req.url }),
    onError({ error, path }) {
      // FORBIDDEN is the role switch working as designed — not a defect.
      if (error.code === 'FORBIDDEN' || error.code === 'PRECONDITION_FAILED') return;
      console.error(`[trpc] ${path ?? '<no-path>'}: ${error.message}`);
    },
  });
}

export { handler as GET, handler as POST };
