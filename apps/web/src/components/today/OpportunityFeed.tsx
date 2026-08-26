'use client';

/**
 * The Opportunity feed, made interactive for the demo.
 *
 * The section itself is presentational (@bask/ui); this thin client wrapper
 * turns an action press into a visible result so the pitch can show the
 * one-click loop end to end — nothing sends, but the owner sees what the
 * product prepared.
 *
 * PRESSING AN ACTION OPENS THE THING, NOT A NOTICE. A toast reading
 * "Prepared: Approve & text 17 customers" is the app telling you it did
 * something; the message itself is the app showing you. Only the social kind
 * used to get that treatment while six other kinds fell through to the toast,
 * which meant six of the eight buttons on the product's primary screen led
 * nowhere. Every kind that has a prepared artifact now opens it.
 *
 * The two kinds without one are handled honestly rather than dressed up:
 *
 *   `uvalux_order`      — routes to `/inventory/order`, the real draft-order
 *                         review screen. The action's own note says "adds to
 *                         existing UVALUX draft order", so the draft IS the
 *                         artifact; inventing a second read-only rendering of
 *                         it here would be a mock of a screen we already have.
 *                         Precedent: `lib/today-data.ts` already routes
 *                         `draft_order` into `/inventory`.
 *   `coaching_request`  — keeps the toast. `CoachAnswer` exists, but it needs a
 *                         real answer and real citations from the expo corpus,
 *                         and this action carries only a topic. Writing coaching
 *                         prose here to fill the component would be fabricating
 *                         advice and attributing it to the library.
 *
 * The sheet keeps the promise the whole pitch rests on: the card's own confirm
 * closes the sheet and shows the acknowledgement, and nothing sends.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  networkProofFor,
  type Opportunity,
  type OpportunityAction,
  type OpportunityOutcome,
} from '@bask/core';
import {
  EmailPreviewCard,
  FrontDeskScriptCard,
  HandleItPlanCard,
  NetworkOutcomeCard,
  OpportunityFeedSection,
  SmsPreviewCard,
  SocialPostCard,
  StaffChallengeCard,
  StaffTaskCard,
} from '@bask/ui';

/** What the sheet is currently showing. */
type Sheet = { opportunity: Opportunity; action: OpportunityAction };

/** Sheet heading per kind — names the artifact, never the mechanism. */
const SHEET_TITLE: Record<OpportunityAction['kind'], string> = {
  sms: 'The text Bask wrote',
  email: 'The email Bask wrote',
  social: 'Bask wrote this for you',
  staff_task: 'The task for your team',
  front_desk_script: 'What to say at the front desk',
  staff_challenge: 'The challenge, ready to start',
  uvalux_order: 'Your draft order',
  coaching_request: 'Coaching request',
};

export function OpportunityFeed({
  opportunities,
  outcomes,
  salonName,
}: {
  opportunities: Opportunity[];
  outcomes: OpportunityOutcome[];
  salonName?: string;
}) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);

  const close = () => setSheet(null);

  /** Close the sheet and acknowledge, in that order, with an accurate line. */
  const done = (message: string) => {
    setSheet(null);
    setConfirmed(message);
  };

  const press = (id: string, label: string) => {
    const opportunity = opportunities.find((o) => o.id === id);
    const action = opportunity?.actions.find((a) => a.label === label);
    if (!opportunity || !action) return;

    if (action.kind === 'uvalux_order') {
      router.push('/inventory/order');
      return;
    }
    if (action.kind === 'coaching_request') {
      setConfirmed(`Coaching requested: “${action.topic}”. Nothing sends until you say so.`);
      return;
    }
    setSheet({ opportunity, action });
  };

  return (
    <div className="b-oppfeed-wrap" data-testid="opportunity-feed-wrap">
      <OpportunityFeedSection
        opportunities={opportunities}
        outcomes={outcomes}
        onAction={press}
      />

      {sheet && (
        <div
          className="b-postsheet"
          role="dialog"
          aria-modal="true"
          aria-label={SHEET_TITLE[sheet.action.kind]}
          data-testid="action-sheet"
        >
          <div className="b-postsheet-scrim" onClick={close} />
          <div className="b-postsheet-body">
            <div className="b-postsheet-head">
              <p className="b-postsheet-title">{SHEET_TITLE[sheet.action.kind]}</p>
              <button
                type="button"
                className="b-toast-x"
                onClick={close}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Only the content scrolls — the head above stays reachable. */}
            <div className="b-postsheet-scroll">
              <ActionArtifact sheet={sheet} salonName={salonName} onDone={done} />

              <NetworkProof opportunityId={sheet.opportunity.id} />

              {sheet.opportunity.handleIt && (
                <>
                  <p className="b-postsheet-title">Or hand the whole thing over</p>
                  <HandleItPlanCard
                    plan={sheet.opportunity.handleIt}
                    onApprove={() =>
                      done('Bask will handle it. Nothing sends until you say so.')
                    }
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmed && (
        <div className="b-toast" role="status" data-testid="opportunity-confirm">
          <span className="b-toast-msg">{confirmed}</span>
          <button type="button" className="b-toast-x" onClick={() => setConfirmed(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The prepared artifact for one action.
 *
 * The union is exhausted, so a new action kind is a compile error here rather
 * than a button that silently does nothing — which is exactly how six kinds
 * ended up on the toast path in the first place.
 */
function ActionArtifact({
  sheet,
  salonName,
  onDone,
}: {
  sheet: Sheet;
  salonName?: string;
  onDone: (message: string) => void;
}) {
  const { action } = sheet;
  const prepared = (label: string) => `Prepared: “${label}”. Nothing sends until you say so.`;

  switch (action.kind) {
    case 'sms':
      return <SmsPreviewCard action={action} onApprove={() => onDone(prepared(action.label))} />;
    case 'email':
      return (
        <EmailPreviewCard
          action={action}
          onPress={(button) => {
            // Preview and Edit are ghosts by design (see EmailPreviewCard);
            // only Send is a decision, so only Send closes the sheet.
            if (button === 'send') onDone(prepared(action.label));
          }}
        />
      );
    case 'social':
      return (
        <SocialPostCard
          action={action}
          salonName={salonName}
          onCreate={() => onDone(prepared(action.label))}
        />
      );
    case 'staff_task':
      return (
        <StaffTaskCard
          action={action}
          onAssign={() => onDone('On today’s list for the team. Nobody has been messaged.')}
        />
      );
    case 'front_desk_script':
      return (
        <FrontDeskScriptCard
          action={action}
          onOutcome={(outcome) =>
            onDone(
              outcome === 'accepted'
                ? 'Noted — they said yes. Bask will learn from that.'
                : outcome === 'declined'
                  ? 'Noted — not today. Bask will learn from that.'
                  : 'Noted — you talked about it. Bask will learn from that.',
            )
          }
        />
      );
    case 'staff_challenge':
      return (
        <StaffChallengeCard
          action={action}
          onStart={() => onDone(`Started: “${action.name}”. Your team sees it at their next shift.`)}
        />
      );
    // These two never reach the sheet — `press` handles them before it opens.
    case 'uvalux_order':
    case 'coaching_request':
      return null;
  }
}

/**
 * "Salons like yours tried this", or nothing at all.
 *
 * `networkProofFor` returns null below `MIN_SALONS_FOR_CONFIDENCE`, so a claim
 * built on two or three salons never renders. That floor is the point: the card
 * only earns its place by being evidence. Read the header of
 * `@bask/core` `network/opportunity-proof.ts` for where the rows come from.
 */
function NetworkProof({ opportunityId }: { opportunityId: string }) {
  const proof = networkProofFor(opportunityId);
  if (!proof) return null;

  const { summary, actionLabel } = proof;
  return (
    <NetworkOutcomeCard
      signalLabel="Salons like yours tried this"
      actionLabel={actionLabel}
      salonsTried={summary.salonsTried}
      salonsImproved={summary.salonsImproved}
      successRateLabel={`${summary.salonsImproved} of ${summary.salonsTried}`}
      medianDeltaLabel={`+${summary.medianDeltaPoints.toFixed(1)} points`}
      medianDaysLabel={`about ${Math.round(summary.medianDaysToResult)} days to show`}
      confident={summary.confident}
    />
  );
}
