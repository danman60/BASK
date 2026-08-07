'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { TOURS, TOUR_UI, type Tour as TourDef, type TourKey } from './guidance';

/**
 * First-run spotlight tour (IMPLEMENTATION_SPEC §3.2): 4–6 steps max, skippable,
 * replayable from a persistent "?" in the header.
 *
 * In-house rather than driver.js. The whole driver is the geometry below plus two
 * event listeners; pulling in a library to place one absolutely-positioned box —
 * and then fighting its styling to reach the token set — costs more than it saves.
 * The spec left the choice to the implementer ("lightweight in-house or driver.js
 * -class lib; Opus picks").
 *
 * Targets are passed as selectors by the CALLER, not stored in guidance.ts. Copy and
 * DOM structure change for different reasons and at different times; binding them in
 * one file means a refactor of the markup silently breaks the copy review.
 */

const SEEN_PREFIX = 'bask.tour.seen.';

/** Has this user already been walked through this tour? */
export function useTourSeen(id: string): [boolean, () => void] {
  const [seen, setSeen] = useState(true); // assume seen until storage says otherwise

  useEffect(() => {
    try {
      setSeen(window.localStorage.getItem(SEEN_PREFIX + id) === '1');
    } catch {
      setSeen(true);
    }
  }, [id]);

  const markSeen = useCallback(() => {
    setSeen(true);
    try {
      window.localStorage.setItem(SEEN_PREFIX + id, '1');
    } catch {
      // storage disabled — the tour simply offers itself again next visit
    }
  }, [id]);

  return [seen, markSeen];
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

export function Tour({
  tour,
  targets,
  open,
  onClose,
}: {
  tour: TourKey | TourDef;
  /** CSS selector per step, index-aligned with the step list */
  targets: string[];
  open: boolean;
  onClose: () => void;
}) {
  const def: TourDef = typeof tour === 'string' ? TOURS[tour] : tour;
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const total = def.steps.length;
  const step = def.steps[index];

  // Restart at step 1 every time it opens — a replay that resumes mid-tour is
  // confusing when the point is "show me around".
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Measure the current target, keep it on screen, and re-measure on scroll/resize.
  // useLayoutEffect so the spotlight is placed before the browser paints the scrim.
  useLayoutEffect(() => {
    if (!open) return;

    const measure = () => {
      const el = document.querySelector(targets[index]);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      });
    };

    document.querySelector(targets[index])?.scrollIntoView({
      block: 'center',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    measure();

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, index, targets]);

  const finish = useCallback(() => {
    onClose();
    setIndex(0);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' && index < total - 1) setIndex((i) => i + 1);
      if (e.key === 'ArrowLeft' && index > 0) setIndex((i) => i - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, index, total, finish]);

  if (!open || !step) return null;

  // Card goes under the target, or above it when there is no room below.
  const cardTop = rect
    ? rect.top + rect.height + 14 + 240 > window.innerHeight
      ? Math.max(12, rect.top - 14 - 190)
      : rect.top + rect.height + 14
    : window.innerHeight / 2 - 90;
  const cardLeft = rect
    ? Math.min(Math.max(12, rect.left), window.innerWidth - 380)
    : window.innerWidth / 2 - 184;

  const isLast = index === total - 1;

  return (
    <>
      {/* clicking the dimmed area leaves the tour, the standard escape hatch */}
      <div className="g-tour-scrim" onClick={finish} data-testid="tour-scrim" />
      {rect && (
        <div
          className="g-tour-hole"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          aria-hidden
        />
      )}
      <div
        className="g-tour-card"
        style={{ top: cardTop, left: cardLeft }}
        role="dialog"
        aria-label={def.label}
        data-testid="tour-card"
      >
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="g-tour-foot">
          <span className="g-tour-step">{TOUR_UI.progress(index + 1, total)}</span>
          <div className="g-tour-actions">
            {index > 0 && (
              <button type="button" className="btn btn-quiet" onClick={() => setIndex((i) => i - 1)}>
                {TOUR_UI.back}
              </button>
            )}
            {!isLast && (
              <button type="button" className="btn btn-ghost" onClick={finish}>
                {TOUR_UI.skip}
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
              data-testid="tour-next"
            >
              {isLast ? TOUR_UI.done : TOUR_UI.next}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
