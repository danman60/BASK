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

import { InsightCard, TeachingEmptyState, UndoToast, INSIGHT_UI, type DismissReasonKey } from '@bask/ui';

import type { AttentionCard } from '@/lib/today-data';

interface PendingUndo {
  insightId: string;
  title: string;
}

export function AttentionQueue({
  cards,
  onDismissAction,
  onRestoreAction,
  onSeenAction,
}: {
  cards: AttentionCard[];
  onDismissAction: (insightId: string, reason: DismissReasonKey) => Promise<{ ok: boolean }>;
  onRestoreAction: (insightId: string) => Promise<{ ok: boolean }>;
  onSeenAction: (insightId: string) => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [collapsing, setCollapsing] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<PendingUndo | null>(null);
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
            onExplain={() => void onSeenAction(card.insightId)}
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
