/**
 * Trend projection (proposal item N.9): a forward view built on the salon's own track record,
 * so an owner sees a slide a month or two before it shows in sales.
 *
 * Proven forecasting, never an AI guess: an ordinary least-squares line through recent weekly
 * revenue, extended forward with an 80% prediction interval. The verdict only calls a slide or a
 * climb when the WHOLE interval at the horizon sits below or above the recent average, so noise
 * reads as "steady" instead of as a warning.
 *
 * shortcut: straight line, no seasonality term; add a seasonal model once a salon has 2+ years.
 */

export interface WeekRevenue {
  /** Monday of the week, `YYYY-MM-DD`. */
  readonly weekStart: string;
  readonly revenue: number;
}

export interface ProjectedWeek {
  readonly weekStart: string;
  readonly mid: number;
  readonly low: number;
  readonly high: number;
}

export type ProjectionVerdict = 'slide' | 'climb' | 'steady' | 'too_little_data';

export interface Projection {
  readonly history: readonly WeekRevenue[];
  readonly projected: readonly ProjectedWeek[];
  /** Average of the last four weeks — the "now" the projection is compared with. */
  readonly recentAverage: number;
  /** Fitted change per week, in dollars. */
  readonly slopePerWeek: number;
  /** Projected mid at the horizon vs recentAverage, as a fraction (-0.12 = 12% lower). */
  readonly changeAtHorizon: number;
  readonly verdict: ProjectionVerdict;
}

export const MIN_WEEKS_TO_PROJECT = 8;
/** Two-sided 80% normal quantile. */
const Z80 = 1.2816;

const addDays = (iso: string, days: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export function projectWeekly(history: readonly WeekRevenue[], horizonWeeks = 8): Projection {
  const n = history.length;
  const last4 = history.slice(-4);
  const recentAverage = last4.length ? last4.reduce((a, w) => a + w.revenue, 0) / last4.length : 0;

  if (n < MIN_WEEKS_TO_PROJECT) {
    return { history, projected: [], recentAverage, slopePerWeek: 0, changeAtHorizon: 0, verdict: 'too_little_data' };
  }

  const xbar = (n - 1) / 2;
  const ybar = history.reduce((a, w) => a + w.revenue, 0) / n;
  let sxx = 0;
  let sxy = 0;
  history.forEach((w, x) => {
    sxx += (x - xbar) ** 2;
    sxy += (x - xbar) * (w.revenue - ybar);
  });
  const slope = sxy / sxx;
  const intercept = ybar - slope * xbar;
  const sse = history.reduce((a, w, x) => a + (w.revenue - (intercept + slope * x)) ** 2, 0);
  const s = Math.sqrt(sse / (n - 2));

  const lastWeek = history[n - 1]!.weekStart;
  const projected = Array.from({ length: horizonWeeks }, (_, i) => {
    const x = n + i;
    const mid = intercept + slope * x;
    const half = Z80 * s * Math.sqrt(1 + 1 / n + (x - xbar) ** 2 / sxx);
    return {
      weekStart: addDays(lastWeek, 7 * (i + 1)),
      mid: Math.max(0, mid),
      low: Math.max(0, mid - half),
      high: Math.max(0, mid + half),
    };
  });

  const end = projected[projected.length - 1]!;
  const verdict: ProjectionVerdict =
    end.high < recentAverage ? 'slide' : end.low > recentAverage ? 'climb' : 'steady';

  return {
    history,
    projected,
    recentAverage,
    slopePerWeek: slope,
    changeAtHorizon: recentAverage > 0 ? end.mid / recentAverage - 1 : 0,
    verdict,
  };
}
