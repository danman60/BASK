import { DEMO_MONITOR } from '@bask/core';

import { MonitorClient } from '@/components/monitor/MonitorClient';
import { resolveSalonScope, SALON_PARAM } from '@/lib/salon-scope';

/**
 * Front Desk Monitor — the listener surface.
 *
 * A device at the front desk hears each sales conversation; the system scores
 * the coachable moments and turns patterns into coaching. Demo depth: all data
 * is `DEMO_MONITOR` from @bask/core — no audio is processed anywhere. The
 * consent pledge renders on the surface itself (ConsentPledgeCard), on purpose.
 */

export const dynamic = 'force-dynamic';

export default async function MonitorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const salonParam = typeof params[SALON_PARAM] === 'string' ? params[SALON_PARAM] : undefined;
  await resolveSalonScope(salonParam);

  return (
    <main className="b-shell">
      <header className="b-oppfeed">
        <h1 className="b-oppfeed-head">Front Desk Monitor</h1>
        <p className="b-oppfeed-sub">
          What your team does well, heard in the open and turned into coaching.
        </p>
      </header>
      <MonitorClient data={DEMO_MONITOR} />
    </main>
  );
}
