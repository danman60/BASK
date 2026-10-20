import { formatCurrency, formatLongDate, projectWeekly, MIN_WEEKS_TO_PROJECT, type WeekRevenue } from '@bask/core';
import { db } from '@bask/db';

import '@/components/lane4/lane4.css';
import { PageContainer } from '@/components/page/PageContainer';
import { InsightsTabs } from '@/components/lane4/InsightsTabs';
import { getDemoSalon } from '@/server/salon';

export const dynamic = 'force-dynamic';

/** Weeks of history the line is fitted to. Long enough to beat noise, short enough to track change. */
const FIT_WEEKS = 16;
const HORIZON_WEEKS = 8;

/**
 * Where it is heading (proposal item N.9, flag `trendProjection`). The salon's own weekly
 * revenue, a straight-line projection eight weeks out and the range it could land in. The maths
 * is in `@bask/core` projectWeekly; this page only loads complete weeks and draws them.
 */
export default async function TrendPage({
  searchParams,
}: {
  searchParams: Promise<{ salon?: string }>;
}) {
  const salon = await getDemoSalon((await searchParams).salon);

  // Complete weeks only: a week that started before the salon's first sale, or that has not
  // finished by the demo clock's today, would drag the line down for no real reason.
  const rows = await db.$queryRaw<{ week: string; revenue: number }[]>`
    with s as (
      select (sold_at at time zone ${salon.timezone}) as local_at, total
      from bask.sale
      where salon_id = ${salon.salonId}::uuid and state = 'completed' and voided_at is null
        and (sold_at at time zone ${salon.timezone})::date < ${salon.today}::date
    )
    select to_char(date_trunc('week', local_at), 'YYYY-MM-DD') as week, sum(total)::float8 as revenue
    from s
    group by 1
    order by 1`;
  const complete: WeekRevenue[] = rows
    .filter((r) => addDays(r.week, 7) <= salon.today)
    .map((r) => ({ weekStart: r.week, revenue: r.revenue }));
  const history = await dropPartialFirstWeek(complete, salon.salonId, salon.timezone);
  const p = projectWeekly(history.slice(-FIT_WEEKS), HORIZON_WEEKS);
  const pct = Math.round(Math.abs(p.changeAtHorizon) * 100);

  return (
    <PageContainer>
      <header className="l4-head">
        <div>
          <p className="eyebrow">Where it is heading · {formatLongDate(salon.today)}</p>
          <h1 className="l4-title">
            {p.verdict === 'too_little_data' ? (
              <>
                Not enough <em>weeks yet</em> to see a trend.
              </>
            ) : p.verdict === 'slide' ? (
              <>
                Sales are on track to be <em>{pct}% lower</em> in two months.
              </>
            ) : p.verdict === 'climb' ? (
              <>
                Sales are on track to be <em>{pct}% higher</em> in two months.
              </>
            ) : (
              <>
                Sales look <em>steady</em> for the next two months.
              </>
            )}
          </h1>
          <p className="l4-sub">
            {p.verdict === 'too_little_data'
              ? `This needs at least ${MIN_WEEKS_TO_PROJECT} full weeks of sales. It has ${history.length}.`
              : `Drawn from your last ${p.history.length} full weeks of sales. The shaded band is where a week is likely to land, eight times out of ten. We only call a slide or a climb when the whole band has moved past where you are now, so a normal up-and-down week never sets this off.`}
          </p>
        </div>
        <InsightsTabs />
      </header>

      {p.verdict !== 'too_little_data' && (
        <div className="l4-card">
          <TrendChart p={p} />
          <p className="l4-sub" style={{ marginTop: 12 }}>
            Last four weeks averaged {formatCurrency(p.recentAverage)} a week. The line is moving{' '}
            {formatCurrency(Math.abs(p.slopePerWeek))} a week {p.slopePerWeek < 0 ? 'down' : 'up'}.
            Eight weeks out it points to {formatCurrency(p.projected.at(-1)!.mid)}, somewhere between{' '}
            {formatCurrency(p.projected.at(-1)!.low)} and {formatCurrency(p.projected.at(-1)!.high)}.
          </p>
        </div>
      )}
    </PageContainer>
  );
}

const addDays = (iso: string, days: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/** The first week counts only if the salon was already selling on its Monday. */
async function dropPartialFirstWeek(weeks: WeekRevenue[], salonId: string, tz: string) {
  if (!weeks.length) return weeks;
  const [first] = await db.$queryRaw<{ day: string }[]>`
    select to_char(min(sold_at at time zone ${tz}), 'YYYY-MM-DD') as day
    from bask.sale where salon_id = ${salonId}::uuid and state = 'completed'`;
  return first && first.day > weeks[0]!.weekStart ? weeks.slice(1) : weeks;
}

function TrendChart({ p }: { p: ReturnType<typeof projectWeekly> }) {
  const W = 720;
  const H = 260;
  const pad = { l: 56, r: 12, t: 12, b: 28 };
  const n = p.history.length + p.projected.length;
  const max = Math.max(...p.history.map((w) => w.revenue), ...p.projected.map((w) => w.high)) * 1.05;
  const x = (i: number) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const h0 = p.history.length;
  const last = p.history[h0 - 1]!;

  const histPath = p.history.map((w, i) => `${i ? 'L' : 'M'}${x(i)},${y(w.revenue)}`).join(' ');
  const midPath =
    `M${x(h0 - 1)},${y(last.revenue)} ` + p.projected.map((w, i) => `L${x(h0 + i)},${y(w.mid)}`).join(' ');
  const band =
    p.projected.map((w, i) => `${i ? 'L' : 'M'}${x(h0 + i)},${y(w.high)}`).join(' ') +
    ' ' +
    [...p.projected].reverse().map((w, i) => `L${x(n - 1 - i)},${y(w.low)}`).join(' ') +
    ' Z';
  const ticks = [0, 0.5, 1].map((f) => max * f);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Weekly sales for ${p.history.length} weeks and a projection for ${p.projected.length} more`}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-soft, currentColor)">
            {formatCurrency(Math.round(t / 100) * 100)}
          </text>
        </g>
      ))}
      <line x1={x(h0 - 1)} x2={x(h0 - 1)} y1={pad.t} y2={H - pad.b} stroke="var(--line)" strokeDasharray="2 3" />
      <text x={x(h0 - 1) + 6} y={H - 10} fontSize="11" fill="var(--ink-soft, currentColor)">
        now
      </text>
      <path d={band} fill="var(--primary)" opacity="0.12" />
      <path d={histPath} fill="none" stroke="var(--ink, currentColor)" strokeWidth="2" />
      <path d={midPath} fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="6 4" />
    </svg>
  );
}
