'use client';

/**
 * Coaching (PRODUCT_SPEC §14) — targets, the playbook library, outcome tracking.
 *
 * Targets are sorted so accounts that ASKED come first, ahead of anything we
 * merely detected. That ordering is the product's position on the whole
 * dealer-intelligence question: a salon's own request outranks our signal, and
 * the screen should make that impossible to miss.
 */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { CompassEmpty, StatRow, StatusChip } from '@/components/compass/primitives';
import { ROLE_PARAM } from '@/lib/demo-scope';
import { trpc } from '@/lib/trpc';

const DAY = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'America/New_York' });

function day(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : DAY.format(date);
}

export default function CoachingPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get(ROLE_PARAM) ?? 'uvalux_rep';
  const coaching = trpc.compass.coaching.useQuery();

  if (coaching.error) {
    return <CompassEmpty title="Coaching could not load" body={coaching.error.message} />;
  }
  if (!coaching.data) return <p className="cp-note">Reading the coaching board…</p>;

  const { targets, playbooks, outcomes, recentContacts } = coaching.data;
  const asked = targets.filter((target) => target.theyAsked);

  return (
    <>
      <div className="cp-head">
        <h1>
          Coaching. <em>{asked.length === 1 ? 'One salon' : `${asked.length} salons`}</em> asked.
        </h1>
        <p>
          Salons who raised their hand come first. Everything below them is something we spotted, which
          is a weaker reason to call.
        </p>
      </div>

      <section className="cp-section">
        <header>
          <h2>Targets</h2>
        </header>
        {targets.length === 0 ? (
          <CompassEmpty
            title="Nothing to coach right now"
            body="Targets appear when a salon asks for help from their own Peers screen, or when a signal maps to a playbook."
          />
        ) : (
          <div className="cp-grid cp-grid--2">
            {targets.map((target) => (
              <div className="cp-card" key={target.slug}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <h3 style={{ margin: 0 }}>
                    <Link
                      href={`/compass/accounts/${target.slug}?${ROLE_PARAM}=${role}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {target.salonName}
                    </Link>
                  </h3>
                  <StatusChip status={target.status} />
                </div>
                <p className="cp-loc" style={{ marginTop: 2 }}>
                  {target.region}
                </p>
                {target.theyAsked ? (
                  <p style={{ marginTop: 'var(--space-3)' }}>
                    <strong>They asked:</strong> “{target.askedTopic}”
                  </p>
                ) : (
                  <p style={{ marginTop: 'var(--space-3)' }}>{target.headline}</p>
                )}
                {target.playbookKey && (
                  <p className="cp-note" style={{ marginTop: 'var(--space-3)' }}>
                    Playbook: {playbooks.find((p) => p.key === target.playbookKey)?.title ?? target.playbookKey}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="cp-section">
        <header>
          <h2>Playbook library</h2>
          <p>What to say, what to ask, and what not to lead with.</p>
        </header>
        <div className="cp-grid cp-grid--2">
          {playbooks.map((playbook) => (
            <div className="cp-card" key={playbook.key}>
              <h3>{playbook.title}</h3>
              <p>{playbook.content.opener}</p>
              {playbook.content.steps && playbook.content.steps.length > 0 && (
                <ol style={{ marginTop: 'var(--space-3)', paddingLeft: '1.1rem', color: 'var(--c-ink-soft)', fontSize: 'var(--text-sm)' }}>
                  {playbook.content.steps.map((step, index) => (
                    <li key={index} style={{ marginBottom: 4 }}>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
              {playbook.content.avoid && playbook.content.avoid.length > 0 && (
                <p className="cp-note" style={{ marginTop: 'var(--space-3)' }}>
                  Avoid: {playbook.content.avoid.join(' · ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header>
          <h2>Outcomes</h2>
          <p>How often each playbook actually gets used, and when it was last taken into a call.</p>
        </header>
        <div className="cp-card">
          {outcomes.map((outcome) => (
            <StatRow
              key={outcome.playbookKey}
              label={outcome.title}
              value={`${outcome.timesUsed} used · last ${day(outcome.lastUsedAt)}`}
            />
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header>
          <h2>Recent contacts</h2>
        </header>
        <div className="cp-card">
          {recentContacts.length === 0 ? (
            <p className="cp-note">Nothing logged yet. Log a contact from the call list and it lands here.</p>
          ) : (
            recentContacts.map((contact) => (
              <StatRow
                key={contact.id}
                label={`${contact.salonName} · ${contact.channel}`}
                value={`${contact.outcome ?? '—'} · ${day(contact.contactedAt)}`}
              />
            ))
          )}
        </div>
      </section>
    </>
  );
}
