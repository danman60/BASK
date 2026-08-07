'use client';

import { TODAY_UI } from '@bask/ui';

/**
 * Human error state (IMPLEMENTATION_SPEC §3.6): what happened, what to do, and
 * never a stack trace. The real error is logged to the console for whoever is
 * debugging, not shown to the salon owner who just wanted their morning letter.
 */
export default function BaskError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (typeof console !== 'undefined') console.error('[bask] Today failed to render', error);

  return (
    <main className="card b-error" role="alert">
      <h2>{TODAY_UI.errorTitle}</h2>
      <p>{TODAY_UI.errorBody}</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        {TODAY_UI.errorAction}
      </button>
    </main>
  );
}
