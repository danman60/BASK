'use client';

/**
 * `/customers` — the list, the profile, and the failed-payment recovery flow.
 *
 * The recovery flow deliberately has no "send all". Seven messages about money
 * approved with one click is exactly the mistake this screen exists to prevent,
 * so each draft is read and sent on its own row (PRODUCT_SPEC §16).
 */

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { trpc } from '@/lib/trpc';
import { HealthBandTiles, HealthGrid, SlippingList } from '@bask/ui';

import { formatDay, formatMoney } from '../marketing/pieces';
import { CUSTOMERS_COPY as C } from './copy';

export function CustomersSurface() {
  const params = useSearchParams();
  const [view, setView] = useState<'list' | 'recovery'>(
    params.get('view') === 'recovery' ? 'recovery' : 'list',
  );
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<string | null>(params.get('segment'));
  const [selected, setSelected] = useState<string | null>(params.get('customer'));

  const list = trpc.customers.list.useQuery({ search, segment, limit: 500 });

  useEffect(() => {
    // Keep a selection that is still in the filtered list; otherwise fall to the
    // first row so the profile pane is never empty next to a full list.
    if (!list.data) return;
    if (selected && list.data.customers.some((c) => c.id === selected)) return;
    setSelected(list.data.customers[0]?.id ?? null);
  }, [list.data, selected]);

  return (
    <>
      <header className="cu-topbar">
        <a className="cu-wordmark" href="/">
          Bask
        </a>
        <span className="cu-crumb">
          <b>{view === 'recovery' ? C.recovery.title : C.title}</b>
        </span>
        <div className="cu-right">
          <button
            type="button"
            className={view === 'recovery' ? 'btn btn-quiet' : 'btn btn-primary'}
            onClick={() => setView(view === 'recovery' ? 'list' : 'recovery')}
          >
            {view === 'recovery' ? C.recovery.back : C.recovery.open}
          </button>
        </div>
      </header>

      <main className="cu-shell">
        {view === 'recovery' ? (
          <RecoveryFlow />
        ) : (
          <>
            <div className="cu-head">
              <h1>{C.title}</h1>
              <p>{C.body}</p>
            </div>

            {list.data && (
              <>
                <HealthBandTiles
                  counts={(['healthy', 'slipping', 'lapsed'] as const).map((band) => ({
                    band,
                    count: list.data!.customers.filter((customer) => customer.health.band === band).length,
                  }))}
                />
                <HealthGrid
                  cells={list.data.customers.map((customer) => ({
                    id: customer.id,
                    band: customer.health.band,
                    title: `${customer.name} · ${customer.health.score}/100`,
                  }))}
                />
                <SlippingList
                  rows={list.data.customers
                    .filter((customer) => customer.health.band === 'slipping')
                    .slice(0, 20)
                    .map((customer) => ({
                      id: customer.id,
                      name: customer.name,
                      band: customer.health.band,
                      lastVisit: customer.health.daysSinceLastVisit === null
                        ? 'Never visited'
                        : `${customer.health.daysSinceLastVisit} days ago`,
                      usual: customer.health.usualEveryDays === null
                        ? 'No pattern yet'
                        : `Every ${customer.health.usualEveryDays} days`,
                      why: customer.health.reason,
                    }))}
                />
              </>
            )}

            <div className="cu-search">
              <input
                type="search"
                value={search}
                placeholder={C.searchPlaceholder}
                aria-label={C.searchPlaceholder}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="cu-count num">
                {list.data ? C.matched(list.data.matched, list.data.total) : ''}
              </span>
            </div>

            <div className="cu-chips">
              <button
                type="button"
                className={`cu-chip ${segment === null ? 'is-selected' : ''}`}
                onClick={() => setSegment(null)}
              >
                {C.allCustomers}
                <span className="cu-n">{list.data?.total ?? ''}</span>
              </button>
              {list.data?.chips.map((chip) => (
                <button
                  type="button"
                  key={chip.key}
                  className={`cu-chip ${segment === chip.key ? 'is-selected' : ''}`}
                  onClick={() => setSegment(segment === chip.key ? null : chip.key)}
                  title={chip.description}
                >
                  {chip.label}
                  <span className="cu-n">{chip.total}</span>
                </button>
              ))}
            </div>

            <div className="cu-split">
              <div className="cu-list">
                {list.isPending && <p className="cu-busy">{C.loading}</p>}
                {list.data?.customers.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    className={`cu-row ${selected === c.id ? 'is-selected' : ''}`}
                    onClick={() => setSelected(c.id)}
                  >
                    <span className="cu-avatar" aria-hidden>
                      {initials(c.firstName, c.lastName)}
                    </span>
                    <span>
                      <span className="cu-name">{c.name}</span>
                      <span className="cu-sub">
                        {c.membershipTier ? (
                          <span className="cu-tier">{c.membershipTier}</span>
                        ) : null}{' '}
                        {c.atRiskReason ?? `${c.visits90} visits in 90 days`}
                      </span>
                    </span>
                    <span className="cu-row-right num">
                      {c.daysSinceLastVisit === null
                        ? C.stats.never
                        : C.stats.daysAgo(c.daysSinceLastVisit)}
                      <br />
                      {c.membershipPaymentState === 'failed' ? (
                        <span className="cu-flag">Payment failed</span>
                      ) : (
                        formatMoney(c.spend90)
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <div className="cu-profile">
                {selected ? (
                  <CustomerProfile customerId={selected} />
                ) : (
                  <div className="card cu-placeholder">{C.pickSomeone}</div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function CustomerProfile({ customerId }: { customerId: string }) {
  const profile = trpc.customers.profile.useQuery({ customerId });
  const [tab, setTab] = useState<'visits' | 'products' | 'account' | 'notes'>('visits');
  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const saveNote = trpc.customers.saveNote.useMutation({ onSuccess: () => setNoteSaved(true) });

  useEffect(() => {
    setNote(profile.data?.customer.notes ?? '');
    setNoteSaved(false);
  }, [profile.data]);

  if (profile.isPending || !profile.data) return <div className="card cu-busy">{C.loading}</div>;
  const { customer, stats, membership, packages, timeline, products, segments, atRiskReason } =
    profile.data;

  return (
    <>
      <div className="card">
        <div className="cu-p-head">
          <span className="cu-p-avatar" aria-hidden>
            {initials(customer.firstName, customer.lastName)}
          </span>
          <span>
            <span className="cu-p-name">
              {customer.firstName} {customer.lastName}
            </span>
            <span className="cu-p-meta">
              {[customer.phone, customer.email].filter(Boolean).join(' · ')}
            </span>
          </span>
          {membership && (
            <span className="cu-tier" style={{ marginLeft: 'auto' }}>
              {membership.tier}
            </span>
          )}
        </div>

        {/* At-risk customers carry their reason. A label with no number is not
            something a front-desk person can act on. */}
        {atRiskReason && <p className="cu-risk">{atRiskReason}</p>}

        <div className="cu-stats">
          <div>
            <div className="cu-stat-n num">{formatMoney(stats.spendAllTime)}</div>
            <div className="cu-stat-k">{C.stats.spend}</div>
          </div>
          <div>
            <div className="cu-stat-n num">{stats.visitsAllTime}</div>
            <div className="cu-stat-k">{C.stats.visits}</div>
          </div>
          <div>
            <div className="cu-stat-n num">{stats.visits90}</div>
            <div className="cu-stat-k">{C.stats.visits90}</div>
          </div>
          <div>
            <div className="cu-stat-n num">
              {stats.daysSinceLastVisit === null
                ? C.stats.never
                : C.stats.daysAgo(stats.daysSinceLastVisit)}
            </div>
            <div className="cu-stat-k">{C.stats.last}</div>
          </div>
        </div>

        {segments.length > 0 && (
          <div className="cu-chips" style={{ marginBottom: 0 }}>
            {segments.map((s) => (
              <span className="cu-chip" key={s.key}>
                {s.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <nav className="cu-tabs">
          {(['visits', 'products', 'account', 'notes'] as const).map((key) => (
            <button
              type="button"
              key={key}
              className={`cu-tab ${tab === key ? 'is-selected' : ''}`}
              onClick={() => setTab(key)}
            >
              {C.tabs[key]}
            </button>
          ))}
        </nav>

        {tab === 'visits' && (
          <div className="cu-timeline">
            {timeline.length === 0 && <p className="cu-busy">{C.timeline.none}</p>}
            {timeline.map((v) => (
              <div className="cu-visit" key={v.id}>
                <span className="cu-visit-when">{formatDay(v.checkedInAt)}</span>
                <span className="cu-visit-what">
                  {v.sessions.length > 0 ? (
                    v.sessions.map((s, i) => (
                      <span key={i}>
                        <b>{s.service}</b>
                        {s.room ? ` · ${s.room}` : ''} · {s.minutes} min
                        {i < v.sessions.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  ) : (
                    <span>{v.notes ?? '—'}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'products' && (
          <div>
            {products.length === 0 && <p className="cu-busy">{C.products.none}</p>}
            {products.map((p) => (
              <div className="cu-prod" key={p.productId}>
                <span>
                  <span className="cu-prod-name">
                    {p.name} {p.isFavourite && <span className="cu-fav">★</span>}
                  </span>
                  <span className="cu-prod-sub">
                    {C.products.boughtTimes(p.timesBought, formatDay(p.lastBoughtAt))}
                    {p.medianGapDays !== null
                      ? ` · ${C.products.everyDays(p.medianGapDays)}`
                      : ` · ${C.products.noPattern}`}
                  </span>
                </span>
                <span className="num">{formatMoney(p.totalSpent)}</span>
                {/* Likely-due comes from THEIR median gap, not a category
                    average — see `buildProductHistory` in the router. */}
                <span className={`cu-due ${p.likelyDue ? 'is-due' : 'is-later'}`}>
                  {p.dueInDays === null
                    ? '—'
                    : p.dueInDays <= 0
                      ? C.products.overdue(Math.abs(p.dueInDays))
                      : p.likelyDue
                        ? C.products.dueNow
                        : C.products.dueIn(p.dueInDays)}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'account' && (
          <div>
            <h4 style={{ font: '600 var(--text-sm)/1 var(--font-body)', color: 'var(--ink-faint)' }}>
              {C.membership.heading}
            </h4>
            {membership ? (
              <div className="cu-flags" style={{ marginTop: 'var(--space-3)' }}>
                <div className="cu-flag-row">
                  <span
                    className={`cu-dot ${membership.paymentState === 'current' || membership.paymentState === 'recovered' ? 'is-yes' : 'is-no'}`}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{membership.tier}</span>
                  <span className="cu-v num">
                    {C.membership.monthly(formatMoney(membership.monthlyPrice))}
                  </span>
                </div>
                <div className="cu-flag-row">
                  <span
                    className={`cu-dot ${membership.paymentState === 'failed' ? 'is-no' : 'is-yes'}`}
                  />
                  <span>
                    {C.membership.paymentState[
                      membership.paymentState as keyof typeof C.membership.paymentState
                    ] ?? membership.paymentState}
                  </span>
                  <span className="cu-v num">{formatDay(membership.nextBillingAt)}</span>
                </div>
              </div>
            ) : (
              <p className="cu-busy" style={{ marginTop: 'var(--space-2)' }}>
                {C.membership.none}
              </p>
            )}

            <h4
              style={{
                font: '600 var(--text-sm)/1 var(--font-body)',
                color: 'var(--ink-faint)',
                marginTop: 'var(--space-6)',
              }}
            >
              {C.packages.heading}
            </h4>
            {packages.length === 0 ? (
              <p className="cu-busy" style={{ marginTop: 'var(--space-2)' }}>
                {C.packages.none}
              </p>
            ) : (
              <div className="cu-flags" style={{ marginTop: 'var(--space-3)' }}>
                {packages.map((p) => (
                  <div className="cu-flag-row" key={p.id}>
                    <span
                      className={`cu-dot ${p.status === 'active' ? 'is-yes' : 'is-no'}`}
                    />
                    <span>
                      {p.name} — {C.packages.remaining(p.creditsRemaining, p.creditsTotal)}
                    </span>
                    <span className="cu-v num">
                      {p.expiresAt ? C.packages.expires(formatDay(p.expiresAt)) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <h4
              style={{
                font: '600 var(--text-sm)/1 var(--font-body)',
                color: 'var(--ink-faint)',
                marginTop: 'var(--space-6)',
              }}
            >
              {C.consent.heading}
            </h4>
            <div className="cu-flags" style={{ marginTop: 'var(--space-3)' }}>
              <ConsentRow
                label={C.consent.waiver}
                on={Boolean(customer.waiverSignedAt)}
                value={
                  customer.waiverSignedAt ? formatDay(customer.waiverSignedAt) : C.consent.waiverNo
                }
              />
              <ConsentRow label={C.consent.sms} on={customer.consent.sms} />
              <ConsentRow label={C.consent.email} on={customer.consent.email} />
              <ConsentRow label={C.consent.photo} on={customer.consent.photo} />
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div>
            <p className="cu-busy" style={{ marginBottom: 'var(--space-3)' }}>
              {C.notes.hint}
            </p>
            <textarea
              className="cu-note"
              value={note}
              aria-label={C.notes.heading}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteSaved(false);
              }}
            />
            <div className="cu-rec-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={saveNote.isPending}
                onClick={() => saveNote.mutate({ customerId, notes: note })}
              >
                {saveNote.isPending ? C.notes.saving : C.notes.save}
              </button>
              {noteSaved && <span className="cu-rec-whisper">{C.notes.saved}</span>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ConsentRow({ label, on, value }: { label: string; on: boolean; value?: string }) {
  return (
    <div className="cu-flag-row">
      <span className={`cu-dot ${on ? 'is-yes' : 'is-no'}`} />
      <span>{label}</span>
      <span className="cu-v">{value ?? (on ? C.consent.yes : C.consent.no)}</span>
    </div>
  );
}

function RecoveryFlow() {
  const utils = trpc.useUtils();
  const recovery = trpc.customers.recovery.useQuery();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [generation, setGeneration] = useState<{ source: 'ai' | 'fallback' } | null>(null);

  const draft = trpc.customers.draftRecovery.useMutation({
    onSuccess: (result) => {
      setDrafts(Object.fromEntries(result.drafts.map((d) => [d.membershipId, d.body])));
      setGeneration({ source: result.generation.source });
    },
  });

  const send = trpc.customers.sendRecovery.useMutation({
    onSuccess: () => {
      void utils.customers.recovery.invalidate();
      void utils.customers.list.invalidate();
    },
  });

  if (recovery.isPending || !recovery.data) return <p className="cu-busy">{C.recovery.loading}</p>;
  const { counts, value, rows } = recovery.data;
  const recoverableIds = rows.filter((r) => r.recoverable).map((r) => r.membershipId);

  return (
    <>
      <div className="cu-head">
        <h1>{C.recovery.title}</h1>
        <p>{C.recovery.body}</p>
      </div>

      <div className="cu-rec-summary" style={{ marginTop: 'var(--space-6)' }}>
        <div>
          <div className="cu-rec-n num">{counts.failed}</div>
          <div className="cu-rec-k">{C.recovery.counts.failed}</div>
        </div>
        <div>
          <div className="cu-rec-n num">{counts.recoverable}</div>
          <div className="cu-rec-k">
            {C.recovery.counts.recoverable} · {C.recovery.value(formatMoney(value.recoverable))}
          </div>
        </div>
        <div>
          <div className="cu-rec-n num">{counts.recovered}</div>
          <div className="cu-rec-k">
            {C.recovery.counts.recovered} · {C.recovery.value(formatMoney(value.recovered))}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={draft.isPending || recoverableIds.length === 0}
            onClick={() => draft.mutate({ membershipIds: recoverableIds })}
          >
            {draft.isPending
              ? C.recovery.drafting
              : Object.keys(drafts).length > 0
                ? C.recovery.redraft
                : C.recovery.draftAll}
          </button>
          <p className="cu-rec-whisper" style={{ marginTop: 'var(--space-2)', maxWidth: '30ch' }}>
            {C.recovery.perMessage}
          </p>
        </div>
      </div>

      {counts.failed === 0 && <p className="cu-busy">{C.recovery.noneFailed}</p>}

      <div className="cu-rec-list">
        {rows.map((row) => {
          const body = drafts[row.membershipId];
          const isRecovered = row.paymentState === 'recovered';
          return (
            <div
              key={row.membershipId}
              className={`cu-rec ${isRecovered ? 'is-recovered' : row.recoverable ? 'is-recoverable' : ''}`}
            >
              <div className="cu-rec-head">
                <span className="cu-tier">{row.tier}</span>
                <span>
                  <span className="cu-rec-name">{row.customerName}</span>
                  <span className="cu-rec-reason">
                    {row.reason}
                    {!row.recoverable && !isRecovered ? ` ${C.recovery.notRecoverable}` : ''}
                  </span>
                </span>
                <span className="cu-rec-value">{formatMoney(row.monthlyPrice)}/mo</span>
                {isRecovered ? (
                  <span className="cu-recovered">✓ {C.recovery.sent}</span>
                ) : (
                  <span className="cu-rec-whisper">{C.recovery.channel[row.channel]}</span>
                )}
              </div>

              {body && !isRecovered && (
                <div className="cu-rec-draft">
                  <textarea
                    className="cu-rec-msg"
                    value={body}
                    aria-label={`Message to ${row.customerName}`}
                    rows={3}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [row.membershipId]: e.target.value }))
                    }
                  />
                  <div className="cu-rec-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={send.isPending}
                      onClick={() =>
                        send.mutate({
                          membershipId: row.membershipId,
                          channel: row.channel,
                          body,
                        })
                      }
                    >
                      {send.isPending ? C.recovery.sending : C.recovery.approve}
                    </button>
                    <span className="cu-rec-whisper">{C.recovery.channel[row.channel]}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {generation && (
        <p className="cu-rec-whisper" style={{ marginTop: 'var(--space-5)' }}>
          <span className={`st-prov ${generation.source === 'fallback' ? 'is-fallback' : ''}`}>
            <span className="st-dot" />
            {generation.source === 'ai'
              ? 'Drafted by Claude'
              : 'Drafted from your salon’s templates'}
          </span>
        </p>
      )}
    </>
  );
}

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}
