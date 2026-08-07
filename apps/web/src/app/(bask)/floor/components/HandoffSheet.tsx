'use client';

import { useState } from 'react';
import { formatLongDate } from '@bask/core';

import type { HandoffSummary } from '@/server/floor/floor-data';

import { FLOOR, money } from '../copy';

/**
 * Shift Handoff (DESIGN_SPEC §4 `HandoffCard`).
 *
 * The card is annotatable *before* it posts, which is the whole design: the
 * numbers are computed and the sentence that makes them mean something is
 * typed by the person who was actually there. "Bed 3 buzzes when it starts" is
 * not in any table.
 */

export function HandoffSheet({
  summary,
  busy,
  onClose,
  onPost,
}: {
  summary: HandoffSummary;
  busy: boolean;
  onClose: () => void;
  onPost: (note: string) => void;
}) {
  const [note, setNote] = useState(summary.posted?.note ?? '');

  return (
    <div className="sheet-scrim" role="dialog" aria-label={FLOOR.handoff.title} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h2>{FLOOR.handoff.title}</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)' }}>
              {FLOOR.handoff.sub(formatLongDate(summary.forDate))}
            </p>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
          <div className="stat-row">
            <span className="k">{FLOOR.handoff.sales}</span>
            <span className="v num">{money(summary.salesTotal)}</span>
          </div>
          <div className="stat-row">
            <span className="k">{FLOOR.handoff.saleCount}</span>
            <span className="v num">{summary.saleCount}</span>
          </div>
          <div className="stat-row">
            <span className="k">{FLOOR.handoff.retail}</span>
            <span className="v num">{summary.retailUnits}</span>
          </div>
          <div className="stat-row">
            <span className="k">{FLOOR.handoff.attachment}</span>
            <span className="v num">{summary.attachmentPct}%</span>
          </div>
          <div className="stat-row">
            <span className="k">{FLOOR.handoff.checkIns}</span>
            <span className="v num">{summary.checkIns}</span>
          </div>
          <div className="stat-row">
            <span className="k">{FLOOR.handoff.sessions}</span>
            <span className="v num">{summary.sessionsRun}</span>
          </div>
        </div>

        <div className="sect">{FLOOR.handoff.incidents}</div>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          {summary.incidents.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
              {FLOOR.handoff.noIncidents}
            </p>
          ) : (
            summary.incidents.map((i) => (
              <div className="stat-row" key={i.room}>
                <span className="k">{i.room}</span>
                <span className="v" style={{ fontWeight: 400 }}>
                  {i.note}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="sect">{FLOOR.handoff.lowStock}</div>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          {summary.lowStock.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
              {FLOOR.handoff.noLowStock}
            </p>
          ) : (
            summary.lowStock.map((s) => (
              <div className="stat-row" key={s.name}>
                <span className="k">{s.name}</span>
                <span className="v num">{s.onHand} left</span>
              </div>
            ))
          )}
        </div>

        <div className="sect">{FLOOR.handoff.tomorrow}</div>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          {summary.tomorrow.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>
              {FLOOR.handoff.noTomorrow}
            </p>
          ) : (
            summary.tomorrow.map((t, i) => (
              <div className="stat-row" key={i}>
                <span className="k num">{t.time}</span>
                <span className="v" style={{ fontWeight: 400 }}>
                  {t.who} · {t.service}
                </span>
              </div>
            ))
          )}
        </div>

        <label className="floor-field">
          <span className="k">{FLOOR.handoff.noteLabel}</span>
          <textarea
            rows={3}
            value={note}
            placeholder={FLOOR.handoff.notePlaceholder}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        {summary.posted && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: 10 }}>
            {FLOOR.handoff.posted(new Date(summary.posted.postedAt).toLocaleString('en-CA'))}
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary start"
          disabled={busy}
          onClick={() => onPost(note)}
        >
          {FLOOR.handoff.post}
        </button>
      </div>
    </div>
  );
}
