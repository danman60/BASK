import { NextResponse, type NextRequest } from 'next/server';

import { allowed, featuresForPath, featuresForProcedure, readFlags } from '@bask/core/flags';

/**
 * The one developmental-feature gate (packages/core/src/flags.ts). A page or tRPC call whose
 * proposal feature is off answers 404, so an unapproved surface does not exist in production.
 * With BASK_ENV unset (the demo) every feature is on and this passes everything through.
 */
export function proxy(request: NextRequest) {
  const flags = readFlags(process.env);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/trpc/')) {
    // Batched calls arrive as `/api/trpc/a.b,c.d`; one off procedure fails the batch.
    const procedures = decodeURIComponent(pathname.slice('/api/trpc/'.length)).split(',');
    const blocked = procedures.some((p) => !allowed(flags, featuresForProcedure(p)));
    return blocked
      ? NextResponse.json({ error: { message: 'Feature not enabled' } }, { status: 404 })
      : NextResponse.next();
  }

  if (allowed(flags, featuresForPath(pathname))) return NextResponse.next();
  // A path no route serves, so Next renders its own 404 page with a 404 status.
  return NextResponse.rewrite(new URL('/__feature-off', request.url));
}

export const config = {
  // tRPC paths contain dots (`marketing.generate`), so they get their own entry; the second
  // entry skips Next internals, other API routes and static files.
  matcher: ['/api/trpc/:path*', '/((?!_next/|api/|.*\\..*).*)'],
};
