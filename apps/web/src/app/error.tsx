'use client';

import { useEffect } from 'react';

/**
 * Runtime error boundary (bootstrap skill Step 12).
 *
 * Human copy per IMPLEMENTATION_SPEC §3: what happened, what to do, never a stack
 * trace. The digest is shown small because it is the one thing worth reading back
 * over the phone.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(`[app-error] ${error.message}`, error.digest);
  }, [error]);

  return (
    <main className="state-page">
      <p className="state-eyebrow">Something went wrong</p>
      <h1>That page didn&rsquo;t load.</h1>
      <p className="state-body">
        Nothing was lost — this was on our end, not yours. Try again, and if it keeps happening
        the code below tells us exactly where to look.
      </p>
      <button type="button" className="state-action" onClick={reset}>
        Try again
      </button>
      {error.digest && <p className="state-note">Reference: {error.digest}</p>}
    </main>
  );
}
