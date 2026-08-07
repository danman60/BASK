'use client';

/**
 * Studio hub — the Idea Shelf, the campaigns list, and the calendar.
 *
 * The Idea Shelf is the "from scratch" entry that isn't really from scratch:
 * every suggestion is derived from this week's numbers and carries the number
 * that produced it, so the owner is choosing between findings rather than
 * staring at an empty form (PRODUCT_SPEC §16).
 */

import { TeachingEmptyState } from '@bask/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { trpc } from '@/lib/trpc';

import { STUDIO_COPY as C } from './copy';
import { BoldFacts, StateChip, formatDay, formatMoney } from './pieces';

type Tab = 'ideas' | 'campaigns' | 'calendar';

export function StudioHub() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'ideas');

  return (
    <>
      <header className="st-topbar">
        <a className="st-wordmark" href="/">
          Bask
        </a>
        <span className="st-crumb">
          <b>Marketing</b>
        </span>
      </header>

      <main className="st-shell">
        <div className="st-hub-head">
          <h1>{C.hub.title}</h1>
          <p>{C.hub.body}</p>
        </div>

        <nav className="st-tabs">
          {(['ideas', 'campaigns', 'calendar'] as const).map((key) => (
            <button
              type="button"
              key={key}
              className={`st-tab ${tab === key ? 'is-selected' : ''}`}
              onClick={() => setTab(key)}
            >
              {C.hub.tabs[key]}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginLeft: 'auto', marginBottom: 'var(--space-3)' }}
            onClick={() => router.push('/marketing?new=1')}
          >
            {C.hub.startCampaign}
          </button>
        </nav>

        {tab === 'ideas' && <IdeaShelf />}
        {tab === 'campaigns' && <CampaignList />}
        {tab === 'calendar' && <CampaignCalendar />}
      </main>
    </>
  );
}

function IdeaShelf() {
  const router = useRouter();
  const shelf = trpc.marketing.ideaShelf.useQuery();

  if (shelf.isPending) return <p className="st-busy">{C.hub.loadingIdeas}</p>;
  if (!shelf.data || shelf.data.ideas.length === 0) {
    // Not a dictionary key: `EMPTY_STATES.campaigns` is about having no
    // campaigns, which is a different thing from having nothing worth one.
    return (
      <div className="g-empty">
        <div className="g-empty-art" aria-hidden>
          ✦
        </div>
        <h3>{C.hub.noIdeas.title}</h3>
        <p>{C.hub.noIdeas.body}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => router.push('/marketing?new=1')}
        >
          {C.hub.noIdeas.action}
        </button>
      </div>
    );
  }

  return (
    <div className="st-shelf">
      {shelf.data.ideas.map((idea) => (
        <article key={idea.id} className={`card st-idea ${idea.source === 'insight' ? 'from-insight' : ''}`}>
          <h3>{idea.title}</h3>
          <p>
            <BoldFacts text={idea.why} />
          </p>
          <div className="st-idea-foot">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                router.push(
                  idea.insightId
                    ? `/marketing?insight=${idea.insightId}`
                    : `/marketing?new=1&audience=${idea.audienceKey}`,
                )
              }
            >
              {C.hub.buildThis}
            </button>
            <span className="st-idea-src">
              {idea.source === 'insight' ? C.hub.fromInsight : C.hub.fromCustomers}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

function CampaignList() {
  const router = useRouter();
  const list = trpc.marketing.campaigns.useQuery({});

  if (list.isPending) return <p className="st-busy">{C.hub.loadingCampaigns}</p>;
  if (!list.data || list.data.campaigns.length === 0) {
    return (
      <TeachingEmptyState state="campaigns" onAction={() => router.push('/marketing?new=1')} />
    );
  }

  return (
    <div className="st-camps">
      {list.data.campaigns.map((c) => (
        <button
          type="button"
          key={c.id}
          className="st-camp"
          onClick={() => router.push(`/marketing?campaign=${c.id}`)}
        >
          <span>
            <span className="st-camp-name">{c.name}</span>
            <span className="st-camp-goal">{c.goal ?? '—'}</span>
          </span>
          <span className="st-camp-meta num">
            <b>{c.recipients}</b> {C.list.people}
            <br />
            {c.channels.join(' · ') || '—'}
          </span>
          <span className="st-camp-meta num">
            {/* A measured campaign leads with what it produced. Anything else
                leads with when it goes. */}
            {c.results ? (
              <>
                <b>{c.results.bookings ?? 0}</b> {C.list.bookings}
                <br />
                {formatMoney(c.results.revenue ?? 0)}
              </>
            ) : (
              <>
                {c.state === 'draft' ? C.list.notScheduled : formatDay(c.scheduledFor)}
                <br />
                {c.state === 'scheduled' ? C.list.waitingToSend : '\u00a0'}
              </>
            )}
          </span>
          <StateChip state={c.state} />
        </button>
      ))}
    </div>
  );
}

function CampaignCalendar() {
  const router = useRouter();
  const [monthOffset, setMonthOffset] = useState(0);
  const base = trpc.marketing.calendar.useQuery({});
  const month = shiftMonth(base.data?.today ?? null, monthOffset);
  const cal = trpc.marketing.calendar.useQuery(month ? { month } : {}, { enabled: Boolean(month) });

  const data = cal.data ?? base.data;
  if (!data) return <p className="st-busy">{C.hub.loadingCalendar}</p>;

  const cells: Array<{ day: number | null; date: string }> = [];
  for (let i = 0; i < data.firstWeekday; i += 1) cells.push({ day: null, date: '' });
  for (let d = 1; d <= data.daysInMonth; d += 1) {
    cells.push({ day: d, date: `${data.month}-${String(d).padStart(2, '0')}` });
  }

  return (
    <>
      <div className="st-actions" style={{ marginTop: 0, marginBottom: 'var(--space-5)' }}>
        <button type="button" className="btn btn-quiet" onClick={() => setMonthOffset((m) => m - 1)}>
          {C.list.previous}
        </button>
        <strong style={{ font: '600 var(--text-md)/1 var(--font-body)' }}>
          {monthLabel(data.month)}
        </strong>
        <button type="button" className="btn btn-quiet" onClick={() => setMonthOffset((m) => m + 1)}>
          {C.list.next}
        </button>
      </div>
      <div className="st-cal">
        <div className="st-cal-head">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="st-cal-grid">
          {cells.map((cell, i) => (
            <div
              key={i}
              className={`st-cal-day ${cell.date === data.today ? 'is-today' : ''}`}
            >
              {cell.day && <span className="st-cal-num num">{cell.day}</span>}
              {(data.days[cell.date] ?? []).map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`st-cal-pill is-${c.state}`}
                  onClick={() => router.push(`/marketing?campaign=${c.id}`)}
                >
                  {c.name}
                  {c.results ? ` · ${c.results.bookings ?? 0} booked` : ` · ${c.recipients}`}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function shiftMonth(today: string | null, offset: number): string | null {
  if (!today) return null;
  const [year, month] = today.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year!, m! - 1, 1)),
  );
}
