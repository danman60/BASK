'use client';

import { useEffect } from 'react';

/**
 * Browser-side failure capture (bootstrap skill Step 15c).
 *
 * Wires window.onerror, unhandled promise rejections and console.error into the
 * same feed as the server logs, so a crash on the demo laptop can be read from
 * anywhere instead of living in a devtools panel nobody had open.
 */
export function ClientErrorCapture() {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_APP_URL;
    const token = process.env.NEXT_PUBLIC_LOG_TOKEN;
    if (!url || !token) return;

    const send = (tag: string, msg: string, data?: unknown) => {
      void fetch(`${url}/api/_logs?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ level: 'error', tag, msg, data }),
        keepalive: true,
      }).catch(() => {});
    };

    const onError = (event: ErrorEvent) => {
      send('client-error', event.message, {
        source: event.filename,
        line: event.lineno,
        stack: event.error?.stack?.slice(0, 2000),
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      send('client-rejection', String(event.reason), {
        stack: (event.reason as Error)?.stack?.slice(0, 2000),
      });
    };

    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      originalError(...args);
      send('console-error', args.map((a) => String(a)).join(' ').slice(0, 2000));
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      console.error = originalError;
    };
  }, []);

  return null;
}
