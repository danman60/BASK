'use client';

/**
 * App shell providers: react-query + the tRPC client.
 *
 * The link reads the demo role off `window.location` on every request rather than
 * from React state — the role lives in the URL, and a link built from a stale
 * render would send the wrong scope after a Presenter Panel switch. Role changes
 * call `queryClient.invalidateQueries()` so everything refetches under the new one.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { useState } from 'react';
import superjson from 'superjson';

import { ROLE_HEADER, SALON_HEADER } from '@bask/api/roles';

import { trpc } from '@/lib/trpc';
import { readRoleFromLocation, readSalonFromLocation } from '@/lib/demo-scope';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // The demo clock moves under the app; stale data on stage is the failure
        // mode this guards against.
        staleTime: 0,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({ enabled: () => process.env.NODE_ENV === 'development' }),
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
          headers: () => {
            // Both scope keys travel together. Sending only the role let the
            // salon silently fall back to the hero tenant on every query.
            const salon = readSalonFromLocation();
            return {
              [ROLE_HEADER]: readRoleFromLocation(),
              ...(salon ? { [SALON_HEADER]: salon } : {}),
            };
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
