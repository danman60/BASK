import { resolveSalonScope, SALON_PARAM } from '@/lib/salon-scope';

/**
 * Front Desk Monitor — scaffold.
 *
 * The full surface (`MonitorSurface` from @bask/ui, data from
 * `DEMO_MONITOR` in @bask/core) lands when the 2026-08-21 build queue
 * drains; this scaffold exists so the nav destination resolves from the
 * moment the label ships. Replaced by the supervisor at integration.
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
      <h1 className="b-oppfeed-head">Front Desk Monitor</h1>
      <p className="b-oppfeed-sub">The listener is warming up.</p>
    </main>
  );
}
