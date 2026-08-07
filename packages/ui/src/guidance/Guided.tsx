'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { GUIDED_UI, METRICS, TIPS, type MetricKey, type TipKey } from './guidance';

/**
 * <Guided> — the single guidance wrapper (IMPLEMENTATION_SPEC §3.1).
 *
 * Two variants, one component so there is one place to review the behaviour:
 *   tip     — hover/focus tooltip for icon-only controls and unfamiliar words
 *   metric  — click-to-open "explain this" popover: what it is, how it is worked
 *             out, why it matters
 *
 * Copy is addressed by KEY only. There is no `text` prop and that is deliberate:
 * the moment a caller can pass a string, user-facing copy escapes guidance.ts and
 * the tone-review pass stops being a single-file job.
 *
 * Built in-house rather than on shadcn/radix — see the deviation note in the M0 plan.
 * The accessibility contract is kept explicitly: the trigger is a real button, the
 * popover is labelled and wired with aria-describedby/aria-expanded, Escape closes,
 * and an outside click closes.
 */

/**
 * How loudly the affordance advertises itself.
 *   default — dotted underline + the `?` mark, always visible. For unfamiliar
 *             terms in prose, where the reader has to KNOW help exists.
 *   quiet   — dotted underline, `?` only on hover/focus. For labelled metrics in
 *             a dense card, where four permanent marks in a column becomes noise.
 *   none    — neither, until hover/focus. For wrapping a chip, chart or other
 *             element that already has its own shape (DESIGN_SPEC §2.4 restraint).
 * Every variant keeps the same keyboard and screen-reader contract — the trigger
 * is always a real button with a real label. Quiet is visual, not functional.
 */
export type GuidedAffordance = 'default' | 'quiet' | 'none';

type GuidedProps = {
  children: ReactNode;
  className?: string;
  affordance?: GuidedAffordance;
} & ({ metric: MetricKey; tip?: never } | { tip: TipKey; metric?: never });

export function Guided({
  children,
  className,
  metric,
  tip,
  affordance = 'default',
}: GuidedProps) {
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<'start' | 'end'>('start');
  const anchorRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const popId = useId();

  const isMetric = metric !== undefined;
  const entry = isMetric ? METRICS[metric] : TIPS[tip!];

  // Close on Escape and on any click outside. Both are registered only while open,
  // so a page full of Guided terms adds no idle listeners.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        anchorRef.current?.querySelector('button')?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  // Flip to right-aligned when the popover would overflow the viewport.
  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setAlign(rect.left + 380 > window.innerWidth ? 'end' : 'start');
  }, [open]);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  return (
    <span
      className={['g-anchor', className].filter(Boolean).join(' ')}
      data-affordance={affordance}
      ref={anchorRef}
      // Tips follow the pointer; metric popovers are click-only so the owner can
      // read three paragraphs without the thing evaporating.
      onMouseEnter={isMetric ? undefined : show}
      onMouseLeave={isMetric ? undefined : hide}
    >
      <button
        type="button"
        className="g-trigger"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        aria-label={isMetric ? GUIDED_UI.explainLabel(entry.label) : entry.label}
        onClick={() => setOpen((v) => !v)}
        onFocus={isMetric ? undefined : show}
        onBlur={isMetric ? undefined : hide}
      >
        {children}
        <span className="g-mark" aria-hidden>
          ?
        </span>
      </button>

      {open && (
        <div
          id={popId}
          ref={popRef}
          role={isMetric ? 'dialog' : 'tooltip'}
          aria-label={isMetric ? entry.label : undefined}
          aria-modal={false}
          data-align={align}
          className={isMetric ? 'g-pop' : 'g-pop g-tip'}
        >
          {isMetric ? (
            <>
              <button
                type="button"
                className="g-pop-close"
                onClick={() => setOpen(false)}
                aria-label={GUIDED_UI.close}
              >
                ×
              </button>
              <p className="g-pop-title">{entry.label}</p>
              <dl style={{ margin: 0 }}>
                <dt>{GUIDED_UI.whatHeading}</dt>
                <dd>{(entry as (typeof METRICS)[MetricKey]).what}</dd>
                <dt>{GUIDED_UI.howHeading}</dt>
                <dd>{(entry as (typeof METRICS)[MetricKey]).how}</dd>
                <dt>{GUIDED_UI.whyHeading}</dt>
                <dd>{(entry as (typeof METRICS)[MetricKey]).why}</dd>
              </dl>
            </>
          ) : (
            (entry as (typeof TIPS)[TipKey]).body
          )}
        </div>
      )}
    </span>
  );
}
