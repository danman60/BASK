'use client';

/**
 * Knowledge — curate the UVALUX training corpus.
 * Spec: `docs/superpowers/specs/2026-08-22-compass-knowledge-curation-design.md`.
 *
 * This file is COMPOSITION ONLY: data fetching, keyboard handling, and the split
 * between the work surface and the inspector. Every visual leaf on it
 * (`ClaimRow`, `ClaimFilterBar`, `ClaimInspector`, `CorpusSummary`,
 * `KnowledgeEmpty`) is its own component.
 *
 * WHY THE TABLE IS THE DEFAULT VIEW AND NOT THE GRAPH:
 * the graph answers "where should I spend my attention", the table answers "let
 * me clear forty of these". You cannot verify a thousand quotes by clicking
 * spheres, so the throughput surface opens first and the map is one keystroke
 * away. Reversing that would be prettier and useless.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Claim, ClaimFilters } from '@bask/core';

import { ClaimFilterBar } from '@/components/compass/knowledge/ClaimFilterBar';
import { GraphCanvas } from '@/components/compass/knowledge/GraphCanvas';
import { GraphLegend } from '@/components/compass/knowledge/GraphLegend';
import { ClaimInspector } from '@/components/compass/knowledge/ClaimInspector';
import { ClaimRow } from '@/components/compass/knowledge/ClaimRow';
import { CorpusSummary } from '@/components/compass/knowledge/CorpusSummary';
import { KnowledgeEmpty } from '@/components/compass/knowledge/KnowledgeEmpty';
import { trpc } from '@/lib/trpc';

const PAGE_SIZE = 50;

/**
 * The curation queue defaults to the ADVICE lenses.
 *
 * `salon-marketing` holds voice-of-customer quotes, which have a different
 * consumer (a copywriter, not a curator) and a different question ("is this
 * quotable" rather than "is this true"). Mixing them by default would make both
 * queues noisier, so marketing is one filter chip away rather than in the way.
 */
const DEFAULT_FILTERS: ClaimFilters = { lens: ['advice', 'recall'] } as ClaimFilters;

export default function KnowledgePage() {
  const [filters, setFilters] = useState<ClaimFilters>(DEFAULT_FILTERS);
  const [skip, setSkip] = useState(0);
  const [focusIx, setFocusIx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'graph'>('table');

  const list = trpc.knowledge.list.useQuery({ filters, take: PAGE_SIZE, skip });
  // Only fetched when the map is actually on screen — the graph query builds the
  // whole node set and there is no reason to pay for it while someone is
  // working the table.
  const graphQ = trpc.knowledge.graph.useQuery(
    { filters },
    { enabled: view === 'graph' },
  );
  const summary = trpc.knowledge.summary.useQuery({ filters });
  const utils = trpc.useUtils();

  const refresh = useCallback(() => {
    void utils.knowledge.list.invalidate();
    void utils.knowledge.summary.invalidate();
  }, [utils]);

  const review = trpc.knowledge.review.useMutation({ onSuccess: refresh });
  const undo = trpc.knowledge.undoLast.useMutation({ onSuccess: refresh });

  const rows = useMemo(() => list.data?.rows ?? [], [list.data]);
  const total = list.data?.total ?? 0;

  const selected: Claim | null = useMemo(() => {
    if (selectedId) return rows.find((r) => r.id === selectedId) ?? null;
    return rows[focusIx] ?? null;
  }, [rows, focusIx, selectedId]);

  const decide = useCallback(
    (claim: Claim | null, action: 'verified' | 'rejected') => {
      if (!claim) return;
      review.mutate({ id: claim.id, action });
      // Advance so a run of decisions does not need a second keystroke each time.
      setFocusIx((ix) => Math.min(ix + 1, Math.max(rows.length - 1, 0)));
      setSelectedId(null);
    },
    [review, rows.length],
  );

  // Keyboard-first: this is the screen where someone clears hundreds of rows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo.mutate({});
        return;
      }
      switch (e.key.toLowerCase()) {
        case 'j':
        case 'arrowdown':
          e.preventDefault();
          setSelectedId(null);
          setFocusIx((ix) => Math.min(ix + 1, Math.max(rows.length - 1, 0)));
          break;
        case 'k':
        case 'arrowup':
          e.preventDefault();
          setSelectedId(null);
          setFocusIx((ix) => Math.max(ix - 1, 0));
          break;
        case 'v':
          e.preventDefault();
          decide(selected, 'verified');
          break;
        case 'x':
          e.preventDefault();
          decide(selected, 'rejected');
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rows.length, selected, decide, undo]);

  if (list.error) {
    return (
      <KnowledgeEmpty
        title="Knowledge could not load"
        body="The claims query failed. The message below is what the database returned."
        error={list.error.message}
      />
    );
  }
  if (!list.data) return <p className="cp-note">Reading the corpus…</p>;

  return (
    <div className="cp-knowledge">
      <CorpusSummary
        corpusName={filters.corpus ?? 'All corpora'}
        total={summary.data?.total ?? total}
        decided={summary.data?.decided ?? 0}
        alertCount={graphQ.data?.alerts.length ?? 0}
        onJumpToNext={() => {
          const ix = rows.findIndex((r) => r.reviewState === 'unreviewed');
          if (ix >= 0) {
            setFocusIx(ix);
            setSelectedId(rows[ix].id);
          }
        }}
      />

      <ClaimFilterBar
        filters={filters}
        onChange={(next: ClaimFilters) => {
          setFilters(next);
          setSkip(0);
          setFocusIx(0);
          setSelectedId(null);
        }}
      />

      <div className="cp-knowledge-viewswitch" role="tablist" aria-label="View">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'table'}
          className={view === 'table' ? 'cp-chip cp-chip--on' : 'cp-chip'}
          onClick={() => setView('table')}
        >
          Table
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'graph'}
          className={view === 'graph' ? 'cp-chip cp-chip--on' : 'cp-chip'}
          onClick={() => setView('graph')}
        >
          Map
        </button>
      </div>

      <div className={view === 'graph' ? 'cp-knowledge-split cp-knowledge-split--map' : 'cp-knowledge-split'}>
        <div className="cp-knowledge-work">
          {view === 'graph' ? (
            graphQ.error ? (
              <KnowledgeEmpty
                title="Map could not load"
                body="The graph query failed."
                error={graphQ.error.message}
              />
            ) : graphQ.data ? (
              <>
                <GraphCanvas
                  graph={graphQ.data.graph}
                  onSelectNode={(id) => setSelectedId(id)}
                  focusNodeId={selectedId}
                  height={720}
                />
                <GraphLegend />
                {graphQ.data.capped ? (
                  <p className="cp-note">
                    Plotting {graphQ.data.claimsInGraph} of {graphQ.data.claimsTotal} claims.
                    Filter down to see the rest — this is a capped view, not the whole corpus.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="cp-note">Building the map…</p>
            )
          ) : rows.length === 0 ? (
            <KnowledgeEmpty
              title="No claims match these filters"
              body="Clear a filter, or load the corpus with scripts/knowledge/load-claims.ts --commit."
            />
          ) : (
            <table className="cp-table cp-knowledge-table">
              <thead>
                <tr>
                  <th scope="col"><span className="cp-sr-only">State</span></th>
                  <th scope="col">Claim</th>
                  <th scope="col">Topic</th>
                  <th scope="col">At</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((claim, ix) => (
                  <ClaimRow
                    key={claim.id}
                    claim={claim}
                    focused={selected?.id === claim.id}
                    onSelect={() => {
                      setSelectedId(claim.id);
                      setFocusIx(ix);
                    }}
                  />
                ))}
              </tbody>
            </table>
          )}

          {view === 'table' ? (
          <div className="cp-knowledge-pager">
            <button
              type="button"
              className="cp-btn"
              disabled={skip === 0}
              onClick={() => {
                setSkip((s) => Math.max(0, s - PAGE_SIZE));
                setFocusIx(0);
              }}
            >
              Previous
            </button>
            <span className="cp-note">
              {total === 0 ? '0' : skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
            </span>
            <button
              type="button"
              className="cp-btn"
              disabled={skip + PAGE_SIZE >= total}
              onClick={() => {
                setSkip((s) => s + PAGE_SIZE);
                setFocusIx(0);
              }}
            >
              Next
            </button>
          </div>

          ) : null}

          <p className="cp-note">
            J and K move · V verifies · X rejects · ⌘Z undoes the last decision
          </p>
        </div>

        <aside className="cp-knowledge-inspector">
          <ClaimInspector
            claim={selected}
            onVerify={() => decide(selected, 'verified')}
            onReject={() => decide(selected, 'rejected')}
          />
        </aside>
      </div>
    </div>
  );
}
