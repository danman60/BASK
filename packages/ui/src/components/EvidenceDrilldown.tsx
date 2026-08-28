/**
 * EvidenceDrilldown — what "Show me why" opens, INLINE (DESIGN_SPEC §3.1).
 *
 * Never a modal. It expands under the card's evidence sentence and pushes the
 * rest of the queue down, so the owner keeps the context of where the finding sat
 * in the ranking while reading it.
 *
 * Every field it draws comes off the ONE `Evidence` schema in `@bask/core`:
 * the series becomes the chart, `comparison` becomes the before/after pair, and
 * `contributingFactors` becomes the "what's behind it" list. It reads; it never
 * computes. If a number isn't in Evidence, it doesn't appear here.
 */

import type { ReactNode } from 'react';

import type { Evidence } from '@bask/core';

import { INSIGHT_UI } from '../guidance/guidance';
import { sparklinePoints } from './Sparkline';

export interface EvidenceDrilldownProps {
  evidence: Evidence;
  /** Ties the expanded region back to the card's toggle button for screen readers. */
  id?: string;
  labelledBy?: string;
  /**
   * Rendered last, below the contributing factors: the records layer.
   *
   * The rule at the top of this file — it reads Evidence, it never computes —
   * still holds for everything this component draws itself. The slot is how the
   * chain continues past what Evidence can say, into the rows themselves,
   * without this component learning how to fetch anything.
   */
  children?: ReactNode;
}

const CHART_W = 560;
const CHART_H = 130;

export function EvidenceDrilldown({ evidence, id, labelledBy, children }: EvidenceDrilldownProps) {
  const { series, comparison, contributingFactors, impact, metric, window } = evidence;
  const values = series?.points.map((p) => p.value) ?? [];

  return (
    <div
      className="b-drill"
      id={id}
      role="region"
      aria-labelledby={labelledBy}
      data-testid="evidence-drilldown"
    >
      <div className="b-drill-chart">
        <p className="b-drill-h">{INSIGHT_UI.drilldownHeading}</p>

        {values.length >= 2 && series ? (
          <>
            <SeriesChart values={values} label={series.label} />
            <div className="b-drill-axis">
              <span>{series.points[0]?.at}</span>
              <span>{series.points[series.points.length - 1]?.at}</span>
            </div>
          </>
        ) : (
          <p className="b-drill-note">{INSIGHT_UI.noSeries}</p>
        )}

        {comparison ? (
          <div className="b-drill-compare" data-sentiment={comparison.sentiment}>
            <div>
              <span className="b-drill-k">{comparison.baselineWindow.label}</span>
              <span className="b-drill-v num">{comparison.baseline.formatted}</span>
            </div>
            <span className="b-drill-arrow" aria-hidden>
              →
            </span>
            <div>
              <span className="b-drill-k">{comparison.currentWindow.label}</span>
              <span className="b-drill-v num">{comparison.current.formatted}</span>
            </div>
          </div>
        ) : (
          <div className="b-drill-compare" data-sentiment="neutral">
            <div>
              <span className="b-drill-k">{metric.label}</span>
              <span className="b-drill-v num">{metric.formatted}</span>
            </div>
          </div>
        )}

        <p className="b-drill-note">{INSIGHT_UI.windowLabel(window.label)}</p>
      </div>

      <div className="b-drill-side">
        {contributingFactors.length > 0 && (
          <>
            <p className="b-drill-h">{INSIGHT_UI.factorsHeading}</p>
            <ul className="b-drill-factors">
              {contributingFactors.map((factor) => (
                <li key={factor.key} data-direction={factor.direction ?? 'flat'}>
                  <span className="b-drill-factor-label">{factor.label}</span>
                  <span className="b-drill-factor-detail">{factor.detail}</span>
                  {factor.share !== null && (
                    <span className="b-drill-share num">
                      {INSIGHT_UI.shareLabel(Math.round(factor.share * 100))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="b-drill-h">{INSIGHT_UI.basisHeading}</p>
        <p className="b-drill-basis">{impact.basis}</p>
      </div>

      {/* Full width, under both columns: the records are the conclusion of the
          drill-down, not a third column of it. */}
      {children}
    </div>
  );
}

/** The sparkline's shape, drawn big, with a soft fill so it reads as an area. */
function SeriesChart({ values, label }: { values: number[]; label: string }) {
  const line = sparklinePoints(values, CHART_W, CHART_H, 8);
  const area = `0,${CHART_H} ${line} ${CHART_W},${CHART_H}`;

  return (
    <svg
      className="b-drill-svg"
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <polygon points={area} fill="var(--warn-wash)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--warn)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
