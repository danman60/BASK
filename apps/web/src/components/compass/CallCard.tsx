'use client';

/**
 * One ranked call card (DESIGN_SPEC §3.4, mockup 04).
 *
 * Anatomy, top to bottom: salon name + region whisper + status chip → 3-up
 * `EvidenceTile` row → `SuggestBlock` → actions → optional footer thread.
 *
 * Action order is FIXED across every card — amber primary, outline secondaries,
 * ghost Snooze — because a rep works down this list at speed and a button that
 * moves between cards is a mis-click waiting to happen (DESIGN_SPEC §3.1's rule,
 * applied to Compass).
 *
 * Log contact and Snooze both open INLINE in the card footer. Neither is a modal:
 * the rep is mid-list and losing the list to log a phone call is the interaction
 * this design is explicitly avoiding.
 */

import type { CallStatus, CompassAccountRecord, EvidenceTile, Suggestion } from '@bask/core';
import Link from 'next/link';
import { useState } from 'react';

import { EvidenceTileRow, StatusChip, SuggestBlock, Whisper } from './primitives';

export interface CallCardData {
  envelope: { accountId: string; salonSlug: string; repName: string | null };
  consentTier: string;
  account: Partial<CompassAccountRecord>;
  status: CallStatus;
  suggestion: Suggestion | null;
  theirRequest: { topic: string; requestedAt: string } | null;
  openDraftOrder: { id: string; lineCount: number; total: number } | null;
  daysSinceContact: number | null;
  snoozedUntil: string | null;
}

/** Mirrors the `channel` enum on `compass.logContact` — one list, not two. */
export type ContactChannel = 'call' | 'email' | 'text' | 'visit' | 'other';

export interface CallCardProps {
  card: CallCardData;
  accountHref: string;
  onOpenBrief: () => void;
  onLogContact: (input: {
    channel: ContactChannel;
    outcome: string;
    notes?: string;
  }) => Promise<void>;
  onSnooze: (days: number) => Promise<void>;
  onScheduleCoaching: (topic: string) => Promise<void>;
  busy: boolean;
}

const SNOOZE_OPTIONS = [
  { days: 3, label: '3 days' },
  { days: 7, label: 'A week' },
  { days: 14, label: 'Two weeks' },
  { days: 30, label: 'A month' },
] as const;

type Panel = 'none' | 'log' | 'snooze';

export function CallCard({
  card,
  accountHref,
  onOpenBrief,
  onLogContact,
  onSnooze,
  onScheduleCoaching,
  busy,
}: CallCardProps) {
  const [panel, setPanel] = useState<Panel>('none');
  const [channel, setChannel] = useState<ContactChannel>('call');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [snoozeDays, setSnoozeDays] = useState<number>(7);

  const account = card.account;
  const tiles = (account.evidenceTiles ?? []) as EvidenceTile[];
  const isOrder = card.status === 'order_in';

  async function submitLog() {
    if (!outcome.trim()) return;
    await onLogContact({ channel, outcome: outcome.trim(), notes: notes.trim() || undefined });
    setOutcome('');
    setNotes('');
    setPanel('none');
  }

  return (
    <article className="cp-call">
      <div className="cp-call-head">
        <h3>
          <Link href={accountHref}>{account.salonName ?? 'Account'}</Link>
        </h3>
        <span className="cp-loc">{account.region ?? '—'}</span>
        <StatusChip status={card.status} />
      </div>

      <EvidenceTileRow tiles={tiles} />

      {isOrder && card.openDraftOrder ? (
        <SuggestBlock lead="Draft order arrived">
          {card.openDraftOrder.lineCount} line
          {card.openDraftOrder.lineCount === 1 ? '' : 's'}, built from their own sell-through with a
          reason on each. Confirm it and it ships.
        </SuggestBlock>
      ) : card.suggestion ? (
        <SuggestBlock lead={card.suggestion.lead}>
          {card.suggestion.body}
          {account.signalHeadline ? ` ${account.signalHeadline}.` : ''}
        </SuggestBlock>
      ) : null}

      <div className="cp-actions">
        <button className="cp-btn cp-btn--pri" onClick={onOpenBrief} disabled={busy}>
          {isOrder ? 'Review draft order' : 'Open call brief'}
        </button>
        <button
          className="cp-btn cp-btn--sec"
          onClick={() => setPanel(panel === 'log' ? 'none' : 'log')}
          aria-expanded={panel === 'log'}
        >
          Log contact
        </button>
        {!isOrder && card.suggestion?.playbookKey && (
          <button
            className="cp-btn cp-btn--sec"
            disabled={busy}
            onClick={() =>
              onScheduleCoaching(
                card.theirRequest?.topic ?? account.signalHeadline ?? 'Coaching conversation',
              )
            }
          >
            Schedule coaching
          </button>
        )}
        <Link className="cp-btn cp-btn--sec" href={accountHref}>
          Account timeline
        </Link>
        <button
          className="cp-btn cp-btn--ghost"
          onClick={() => setPanel(panel === 'snooze' ? 'none' : 'snooze')}
          aria-expanded={panel === 'snooze'}
        >
          Snooze
        </button>
      </div>

      {panel === 'log' && (
        <div className="cp-inline">
          <div className="cp-inline-row">
            <div className="cp-field">
              <label htmlFor={`channel-${card.envelope.accountId}`}>How</label>
              <select
                id={`channel-${card.envelope.accountId}`}
                className="cp-select"
                value={channel}
                onChange={(event) => setChannel(event.target.value as ContactChannel)}
              >
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="text">Text</option>
                <option value="visit">Visit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="cp-field cp-input--grow">
              <label htmlFor={`outcome-${card.envelope.accountId}`}>What happened</label>
              <input
                id={`outcome-${card.envelope.accountId}`}
                className="cp-input"
                value={outcome}
                placeholder="Spoke with the owner"
                onChange={(event) => setOutcome(event.target.value)}
              />
            </div>
          </div>
          <div className="cp-field">
            <label htmlFor={`notes-${card.envelope.accountId}`}>Notes (optional)</label>
            <input
              id={`notes-${card.envelope.accountId}`}
              className="cp-input"
              value={notes}
              placeholder="Anything the next call should know"
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <div className="cp-inline-row">
            <button
              className="cp-btn cp-btn--pri"
              onClick={submitLog}
              disabled={busy || !outcome.trim()}
            >
              Save this contact
            </button>
            <button className="cp-btn cp-btn--ghost" onClick={() => setPanel('none')}>
              Cancel
            </button>
          </div>
          <Whisper>Goes on their account timeline. Nothing is sent to the salon.</Whisper>
        </div>
      )}

      {panel === 'snooze' && (
        <div className="cp-inline">
          <div className="cp-inline-row">
            <div className="cp-field">
              <label htmlFor={`snooze-${card.envelope.accountId}`}>Hide this for</label>
              <select
                id={`snooze-${card.envelope.accountId}`}
                className="cp-select"
                value={snoozeDays}
                onChange={(event) => setSnoozeDays(Number(event.target.value))}
              >
                {SNOOZE_OPTIONS.map((option) => (
                  <option key={option.days} value={option.days}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="cp-btn cp-btn--pri"
              disabled={busy}
              onClick={async () => {
                await onSnooze(snoozeDays);
                setPanel('none');
              }}
            >
              Snooze for {SNOOZE_OPTIONS.find((o) => o.days === snoozeDays)?.label.toLowerCase()}
            </button>
            <button className="cp-btn cp-btn--ghost" onClick={() => setPanel('none')}>
              Cancel
            </button>
          </div>
          <Whisper>It comes back on the list when the time is up. Nothing is dismissed for good.</Whisper>
        </div>
      )}

      {card.theirRequest && (
        <div className="cp-thread">
          Asked for coaching via Bask on {formatDay(card.theirRequest.requestedAt)} —{' '}
          <b>their request, not just our signal.</b>
        </div>
      )}

      {!card.theirRequest && card.daysSinceContact !== null && card.daysSinceContact > 21 && (
        <div className="cp-thread">
          Last contact was <b>{card.daysSinceContact} days ago</b>
          {card.envelope.repName ? ` — ${card.envelope.repName}` : ''}.
        </div>
      )}
    </article>
  );
}

const DAY = new Intl.DateTimeFormat('en-CA', {
  weekday: 'long',
  timeZone: 'America/New_York',
});

function formatDay(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? 'a recent day' : DAY.format(date);
}
