'use client';

/**
 * The attention queue — the interactive half of Today.
 *
 * Dismiss is "undo over confirm" (IMPLEMENTATION_SPEC §3.5) done properly:
 *   1. the card asks WHY (not-relevant / already-handled / snooze),
 *   2. it collapses over --dur-base while the server action runs,
 *   3. a toast offers Undo for a few seconds,
 *   4. the state is already in Postgres, so a reload keeps the decision.
 *
 * The optimistic set is local state rather than `useOptimistic` because the undo
 * path has to survive the router refresh that follows the dismissal — an
 * optimistic value tied to a transition would snap back mid-animation.
 */

import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

import {
  CoachingCitations,
  InsightCard,
  RecordsPanel,
  TeachingEmptyState,
  UndoToast,
  INSIGHT_UI,
  type DismissReasonKey,
} from '@bask/ui';
import type { ClaimCitation } from '@bask/core';

import type { AttentionCard } from '@/lib/today-data';

/** Shape returned by `insightRecords`; kept local so this file imports no server code. */
interface RecordsData {
  rows: {
    visitId: string;
    day: string;
    customerName: string;
    attached: boolean;
    productName: string | null;
    amountLabel: string | null;
  }[];
  totalVisits: number;
  attachedVisits: number;
  ratePercent: number;
  windowLabel: string;
  hiddenCount: number;
}

interface PendingUndo {
  insightId: string;
  title: string;
}

export function AttentionQueue({
  cards,
  onDismissAction,
  onRestoreAction,
  onSeenAction,
  onRecordsAction,
  onCoachingAction,
}: {
  cards: AttentionCard[];
  onDismissAction: (insightId: string, reason: DismissReasonKey) => Promise<{ ok: boolean }>;
  onRestoreAction: (insightId: string) => Promise<{ ok: boolean }>;
  onSeenAction: (insightId: string) => Promise<{ ok: boolean }>;
  /** Fetches the rows behind a card. Returns null when the metric has no exact list. */
  onRecordsAction: (insightId: string) => Promise<RecordsData | null>;
  /** Fetches the coaching behind a card. `[]` when nothing matched or retrieval is off. */
  onCoachingAction: (insightId: string) => Promise<ClaimCitation[]>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [collapsing, setCollapsing] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<PendingUndo | null>(null);
  /* Records are fetched the first time a card is expanded and then kept: an owner
     checking the maths tends to open, read, collapse and re-open, and paying for
     the round trip again each time would make the honest thing feel slow. */
  const [records, setRecords] = useState<Record<string, RecordsData | null>>({});
  /* Same keep-once policy as records, for the sharper reason: every miss costs an
     embedding call and ~1.5s. `undefined` means "never asked"; an empty array
     means "asked, nothing matched" and must not re-fetch. */
  const [coaching, setCoaching] = useState<Record<string, ClaimCitation[]>>({});
  const [error, setError] = useState<string | null>(null);

  const dismiss = useCallback(
    (card: AttentionCard, reason: DismissReasonKey) => {
      setError(null);
      setCollapsing((set) => new Set(set).add(card.insightId));

      // Let the 220ms collapse actually play before the node leaves the tree.
      window.setTimeout(() => {
        setHidden((set) => new Set(set).add(card.insightId));
        setCollapsing((set) => {
          const next = new Set(set);
          next.delete(card.insightId);
          return next;
        });
      }, 220);

      void onDismissAction(card.insightId, reason).then((result) => {
        if (result.ok) {
          setUndo({ insightId: card.insightId, title: card.title });
          startTransition(() => router.refresh());
        } else {
          // Nothing was lost — put the card back and say so in plain language.
          setHidden((set) => {
            const next = new Set(set);
            next.delete(card.insightId);
            return next;
          });
          setError(INSIGHT_UI.dismissFailed);
        }
      });
    },
    [onDismissAction, router],
  );

  const restore = useCallback(() => {
    if (!undo) return;
    const id = undo.insightId;
    setUndo(null);
    void onRestoreAction(id).then(() => {
      setHidden((set) => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
      startTransition(() => router.refresh());
    });
  }, [undo, onRestoreAction, router]);

  const visible = cards.filter((card) => !hidden.has(card.insightId));

  if (visible.length === 0 && !undo) {
    return <TeachingEmptyState state="insights" />;
  }

  return (
    <>
      {error && (
        <p className="b-queue-error" role="alert">
          {error}
        </p>
      )}

      {visible.map((card, index) => (
        <div
          key={card.insightId}
          className="b-queue-item"
          // Stagger 40ms apart, once, on load (DESIGN_SPEC §2.4).
          style={{ animationDelay: `${Math.min(index, 4) * 40}ms` }}
        >
          <InsightCard
            insightId={card.insightId}
            title={card.title}
            evidenceSentence={card.evidenceSentence}
            impactChip={card.impactChip}
            rail={card.rail}
            sparkline={card.sparkline}
            evidence={card.evidence}
            primaryAction={card.primaryAction}
            dismissing={collapsing.has(card.insightId)}
            onDismiss={(reason) => dismiss(card, reason)}
            onExplain={() => {
              void onSeenAction(card.insightId);
              /* Only ask the server once per card. `undefined` means "never
                 asked"; an explicit null means "asked, and this metric has no
                 exact row-level list" — which must not trigger a re-fetch. */
              if (records[card.insightId] === undefined) {
                void onRecordsAction(card.insightId).then((data) =>
                  setRecords((prev) => ({ ...prev, [card.insightId]: data })),
                );
              }
              if (coaching[card.insightId] === undefined) {
                void onCoachingAction(card.insightId).then((data) =>
                  setCoaching((prev) => ({ ...prev, [card.insightId]: data })),
                );
              }
            }}
            recordsSlot={
              records[card.insightId] ? (
                <RecordsPanel
                  {...records[card.insightId]!}
                  quotedPercent={card.evidence?.metric?.value ?? null}
                />
              ) : null
            }
            coachingSlot={
              coaching[card.insightId]?.length ? (
                <CoachingCitations citations={coaching[card.insightId]!} />
              ) : null
            }
          />
        </div>
      ))}

      {undo && (
        <UndoToast
          message={INSIGHT_UI.undoToast(undo.title)}
          onUndo={restore}
          onDismiss={() => setUndo(null)}
        />
      )}
    </>
  );
}
