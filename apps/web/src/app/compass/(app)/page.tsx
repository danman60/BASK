'use client';

/**
 * Call List — the hero (PRODUCT_SPEC §6: "Network is the leadership view; Call
 * List is the rep's morning"). Built to mockup 04.
 *
 * Everything on this page comes from `compass.callList`, which derives and
 * consent-filters server-side. This component does no filtering of its own and
 * has no access to anything the filter dropped — that is the point of doing the
 * work in `@bask/core` rather than here.
 */

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { CallCard, type CallCardData } from '@/components/compass/CallCard';
import { CallBriefSheet } from '@/components/compass/CallBriefSheet';
import { BandDot, CompassEmpty } from '@/components/compass/primitives';
import { ROLE_PARAM } from '@/lib/demo-scope';
import { trpc } from '@/lib/trpc';

const BAND_ORDER = ['thriving', 'steady', 'needs_attention', 'unknown'] as const;

const BAND_WORD: Record<string, string> = {
  thriving: 'thriving',
  steady: 'steady',
  needs_attention: 'need attention',
  unknown: 'sharing name only',
};

const WEEKDAY = new Intl.DateTimeFormat('en-CA', { weekday: 'long', timeZone: 'UTC' });

export default function CallListPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get(ROLE_PARAM);
  const utils = trpc.useUtils();

  const callList = trpc.compass.callList.useQuery({ includeSnoozed: false });
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const briefMutation = trpc.compass.callBrief.useMutation();
  const logContact = trpc.compass.logContact.useMutation();
  const snooze = trpc.compass.snooze.useMutation();
  const scheduleCoaching = trpc.compass.scheduleCoaching.useMutation();

  const cards = (callList.data?.cards ?? []) as unknown as CallCardData[];
  const portfolio = callList.data?.portfolio;

  const openCard = useMemo(
    () => cards.find((card) => card.envelope.salonSlug === openSlug) ?? null,
    [cards, openSlug],
  );

  const accountHref = (slug: string) =>
    `/compass/accounts/${slug}?${ROLE_PARAM}=${role ?? 'uvalux_rep'}`;

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  async function refresh() {
    await utils.compass.callList.invalidate();
  }

  const weekday = callList.data ? WEEKDAY.format(new Date(`${callList.data.forDate}T00:00:00Z`)) : '';
  const count = cards.length;

  return (
    <>
      <div className="cp-head">
        <h1>
          {weekday ? `${weekday}. ` : ''}
          <em>{countWord(count)}</em> worth making.
        </h1>
        <p>Ranked by what a conversation could change this week.</p>
      </div>

      {portfolio && (
        <div className="cp-pulse">
          {BAND_ORDER.map((band) => {
            const entry = portfolio.distribution.find((item) => item.band === band);
            if (!entry || entry.count === 0) return null;
            return (
              <span key={band}>
                <BandDot band={band} />
                <b>{entry.count}</b> {BAND_WORD[band]}
              </span>
            );
          })}
          <span className="cp-pulse-total">
            <b>{portfolio.total}</b> salons in your portfolio
          </span>
        </div>
      )}

      {callList.isPending && <p className="cp-note">Reading the portfolio…</p>}

      {callList.error && (
        <CompassEmpty
          title="Compass could not load"
          body={callList.error.message}
        />
      )}

      {callList.data && count === 0 && (
        <CompassEmpty
          title="No calls worth making today"
          body="When a salon's shared signals move outside their normal range, or they ask for coaching themselves, they appear here with the evidence attached."
        />
      )}

      {cards.map((card) => (
        <CallCard
          key={card.envelope.accountId}
          card={card}
          busy={logContact.isPending || snooze.isPending || scheduleCoaching.isPending}
          accountHref={accountHref(card.envelope.salonSlug)}
          onOpenBrief={() => {
            setOpenSlug(card.envelope.salonSlug);
            briefMutation.mutate({ slug: card.envelope.salonSlug });
          }}
          onLogContact={async (input) => {
            await logContact.mutateAsync({ slug: card.envelope.salonSlug, ...input });
            flash(`Logged — ${card.account.salonName ?? 'account'} is on the timeline.`);
            await refresh();
          }}
          onSnooze={async (days) => {
            await snooze.mutateAsync({ slug: card.envelope.salonSlug, days });
            flash(`Snoozed ${card.account.salonName ?? 'this account'} for ${days} days.`);
            await refresh();
          }}
          onScheduleCoaching={async (topic) => {
            await scheduleCoaching.mutateAsync({ slug: card.envelope.salonSlug, topic });
            flash('Coaching scheduled — it is on the Coaching board.');
            await refresh();
          }}
        />
      ))}

      {openCard && (
        <CallBriefSheet
          salonName={openCard.account.salonName ?? 'Account'}
          region={openCard.account.region ?? '—'}
          result={briefMutation.data ?? null}
          isPending={briefMutation.isPending}
          error={briefMutation.error?.message ?? null}
          onClose={() => {
            setOpenSlug(null);
            briefMutation.reset();
          }}
        />
      )}

      {toast && <div className="cp-toast">{toast}</div>}
    </>
  );
}

/**
 * "Three calls worth making" — the emphasis word is a count, so it has to read
 * as English at 0, 1 and 12 without a plural bug landing in a pitch headline.
 */
function countWord(count: number): string {
  const words = ['No calls', 'One call', 'Two calls', 'Three calls', 'Four calls', 'Five calls'];
  return words[count] ?? `${count} calls`;
}
