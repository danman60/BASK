'use client';

/**
 * Dev harness — M0 step 3 acceptance.
 *
 * Proves the spine end to end: browser → tRPC → context (role + salon scope) →
 * Prisma → `bask.demo_state` on the shared CC&SS project → back. Everything on
 * this page is a live round-trip; nothing is mocked.
 *
 * Not a product surface. M1 builds the real ones (IMPLEMENTATION_SPEC §7).
 */

import { DEMO_ROLE_LABELS } from '@bask/api/roles';
import { API_SURFACE_DOMAINS } from '@bask/api/surfaces';

import { trpc } from '@/lib/trpc';

export default function DevApiPage() {
  const state = trpc.demo.state.useQuery();
  const whoami = trpc.settings.whoami.useQuery();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dev harness · API</h1>
        <p className="mt-1 text-sm opacity-70">
          Live tRPC round-trip against the <code>bask</code> schema. Press{' '}
          <kbd className="rounded border px-1 text-xs">⌘⇧D</kbd> for the Presenter Panel.
        </p>
      </header>

      <Block title="demo.state" query={state}>
        {state.data && (
          <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-1 text-sm">
            <Row label="virtual_today" value={String(state.data.clock.virtualToday)} />
            <Row label="seed" value={state.data.clock.seed} />
            <Row label="last advanced" value={String(state.data.clock.lastAdvancedAt ?? '—')} />
            <Row label="salons seeded" value={String(state.data.dataset.salonCount)} />
            <Row label="role (server)" value={DEMO_ROLE_LABELS[state.data.scope.role]} />
            <Row label="salon in scope" value={state.data.scope.salonSlug ?? 'none'} />
          </dl>
        )}
      </Block>

      <Block title="settings.whoami" query={whoami}>
        {whoami.data && (
          <pre className="overflow-x-auto rounded-lg bg-black/5 p-3 text-xs">
            {JSON.stringify(whoami.data, null, 2)}
          </pre>
        )}
      </Block>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest opacity-50">
          Surface routers
        </h2>
        <p className="mt-1 text-xs opacity-60">
          Every domain is mounted behind its RBAC guard. Switch role in the Presenter Panel
          and the guarded ones start refusing.
        </p>
        <ul className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
          {API_SURFACE_DOMAINS.map((domain) => (
            <li key={domain} className="rounded border px-2 py-1 opacity-70">
              {domain}
            </li>
          ))}
        </ul>
      </section>

      <SurfaceProbe />
    </main>
  );
}

/** Calls two guarded routers so the role switch has something visible to change. */
function SurfaceProbe() {
  const today = trpc.today.surface.useQuery(undefined, { retry: false });
  const compass = trpc.compass.surface.useQuery(undefined, { retry: false });

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <ProbeCard label="today.surface (owner / front desk)" query={today} />
      <ProbeCard label="compass.surface (rep / leadership)" query={compass} />
    </section>
  );
}

interface QueryLike {
  isLoading: boolean;
  error: { message: string } | null;
  data?: unknown;
}

function ProbeCard({ label, query }: { label: string; query: QueryLike }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="font-mono text-xs opacity-70">{label}</p>
      <p
        className={`mt-1 text-sm ${query.error ? 'text-red-600' : query.data ? 'text-green-700' : 'opacity-50'}`}
      >
        {query.isLoading ? 'loading…' : (query.error?.message ?? 'allowed')}
      </p>
    </div>
  );
}

function Block({
  title,
  query,
  children,
}: {
  title: string;
  query: QueryLike;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-2 font-mono text-sm opacity-70">{title}</h2>
      {query.isLoading && <p className="text-sm opacity-50">loading…</p>}
      {query.error && <p className="text-sm text-red-600">{query.error.message}</p>}
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-mono text-xs opacity-50">{label}</dt>
      <dd className="font-mono text-xs">{value}</dd>
    </>
  );
}
