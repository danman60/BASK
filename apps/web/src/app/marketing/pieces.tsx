'use client';

/**
 * Small shared pieces for Studio and Customers.
 *
 * `EditableText` is the one that matters: DESIGN_SPEC §3.3 says every text
 * region in Studio is inline-editable and that there are no modals. So editing
 * is click → the same box becomes a field → blur commits. Nothing opens, nothing
 * moves, and the layout does not reflow when you start typing.
 */

import { useEffect, useRef, useState } from 'react';

export interface EditableTextProps {
  value: string;
  onCommit: (next: string) => void;
  /** Multi-line fields get a textarea; single-line get an input. */
  multiline?: boolean;
  className?: string;
  as?: 'p' | 'h2' | 'h3' | 'div' | 'span';
  /** Rendered instead of raw text when not editing (e.g. bolded handle). */
  children?: React.ReactNode;
  ariaLabel: string;
  disabled?: boolean;
}

export function EditableText({
  value,
  onCommit,
  multiline = true,
  className = '',
  as: Tag = 'p',
  children,
  ariaLabel,
  disabled = false,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // A regenerate replaces the value underneath us. Without this the box would
  // keep showing the words the model just replaced.
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== value) onCommit(next);
    else setDraft(value);
  }

  if (editing) {
    const shared = {
      className: 'st-editing',
      value: draft,
      'aria-label': ariaLabel,
      onBlur: commit,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
        setDraft(e.target.value),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          setDraft(value);
          setEditing(false);
        }
        // Enter commits on single-line fields only — an email body needs its
        // line breaks.
        if (e.key === 'Enter' && !multiline) commit();
      },
    };
    return multiline ? (
      <textarea {...shared} ref={ref as React.Ref<HTMLTextAreaElement>} rows={Math.max(2, Math.ceil(draft.length / 46))} />
    ) : (
      <input {...shared} ref={ref as React.Ref<HTMLInputElement>} />
    );
  }

  return (
    <Tag
      className={`${className} ${disabled ? '' : 'st-editable'}`.trim()}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      aria-label={disabled ? undefined : `${ariaLabel} — click to edit`}
      onClick={disabled ? undefined : () => setEditing(true)}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setEditing(true);
              }
            }
      }
    >
      {children ?? value}
    </Tag>
  );
}

/**
 * Evidence sentences carry their facts in `**bold**` (DESIGN_SPEC §5). Rendering
 * them as markdown-lite keeps one string in the database instead of a sentence
 * plus a parallel list of which words are numbers.
 */
export function BoldFacts({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <b key={i}>{part.slice(2, -2)}</b>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

const STATE_LABELS: Record<string, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  sent: 'Sent',
  measured: 'Measured',
  cancelled: 'Cancelled',
};

export function StateChip({ state }: { state: string }) {
  return <span className={`st-state is-${state}`}>{STATE_LABELS[state] ?? state}</span>;
}

/**
 * Which path produced what is on screen. Shown because "is the AI real?" is a
 * question the pitch has to answer honestly, and because a silent fallback is
 * how a demo tells its first lie.
 */
export function ProvenanceNote({
  source,
  model,
}: {
  source: 'ai' | 'fallback';
  model: string | null;
}) {
  return (
    <span className={`st-prov ${source === 'fallback' ? 'is-fallback' : ''}`}>
      <span className="st-dot" />
      {source === 'ai' ? `Written by ${model ?? 'Claude'}` : 'Written from your salon’s templates'}
    </span>
  );
}

export function formatMoney(value: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

/** Dates render in the salon's own reckoning — the demo clock, never the wall clock. */
export function formatDay(value: Date | string | null): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDayTime(value: Date | string | null): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}
