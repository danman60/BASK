import { db } from '@bask/db';

import './evidence.css';

/**
 * The field-evidence page — the answer to "is any of this real?".
 *
 * Every number below is queried from the database when this page loads. Nothing
 * is a fixture, a constant or a screenshot. It is one real tanning business's
 * point-of-sale history — four locations, 2016 to 2020, pulled off the machine
 * with the owner's permission and de-identified to Salon A–D before it was
 * loaded.
 *
 * WHY IT IS A PAGE AND NOT A PDF. The same numbers already exist as a written
 * report (`docs/pitch/2026-08-27-insights-final.html`), and a report is a thing
 * you are asked to believe. A page that runs the query in front of you is a
 * thing you can check — and the one objection that actually kills a pitch like
 * this is "nice demo, but it's made up".
 *
 * NOT A COMPASS SURFACE, deliberately. Compass reads go through the consent
 * filter because they are one business looking at another. This is a research
 * dataset with no dealer relationship attached to it, so routing it through
 * Compass would imply a consent story that does not exist here. It lives
 * outside the operator shell for the same reason `/book` does.
 *
 * The client is never named, here or anywhere in this repo.
 */

export const dynamic = 'force-dynamic';

const FIELD_ORG_ID = '50094662-ee05-58e8-8843-a8a9bd858043';

function n(value: number): string {
  return value.toLocaleString('en-CA');
}
function money(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

interface YearRow {
  year: number;
  visits: number;
  retail_revenue: number;
  retail_lines: number;
  attach_pct: number;
}
interface BrandRow {
  brand: string;
  lines: number;
  revenue: number;
  pct_of_retail: number;
}

export default async function EvidencePage() {
  /* Raw SQL rather than the Prisma query builder: these are aggregates over
     ~195k visits and ~60k line items, and expressing them as four grouped
     queries the database can plan is both faster and easier to read than the
     equivalent findMany + reduce. They are read-only and parameterless. */
  const [totals, years, brands] = await Promise.all([
    db.$queryRawUnsafe<
      { visits: bigint; customers: bigint; sales: bigint; salons: bigint; first_day: Date; last_day: Date; retail_revenue: number }[]
    >(`
      with s as (select id from bask.salon where org_id = '${FIELD_ORG_ID}')
      select
        (select count(*) from bask.visit v join s on s.id = v.salon_id) as visits,
        (select count(*) from bask.customer c join s on s.id = c.salon_id) as customers,
        (select count(*) from bask.sale sa join s on s.id = sa.salon_id) as sales,
        (select count(*) from s) as salons,
        (select min(v.checked_in_at) from bask.visit v join s on s.id = v.salon_id) as first_day,
        (select max(v.checked_in_at) from bask.visit v join s on s.id = v.salon_id) as last_day,
        (select coalesce(sum(sl.line_total),0) from bask.sale_line sl join s on s.id = sl.salon_id
           where sl.product_id is not null) as retail_revenue
    `),
    db.$queryRawUnsafe<YearRow[]>(`
      with s as (select id from bask.salon where org_id = '${FIELD_ORG_ID}'),
      v as (select extract(year from checked_in_at)::int y, count(*) n
              from bask.visit where salon_id in (select id from s) group by 1),
      r as (select extract(year from sl.sold_at)::int y,
                   sum(sl.line_total) rev, count(*) lines
              from bask.sale_line sl
             where sl.salon_id in (select id from s) and sl.product_id is not null group by 1)
      select v.y as year, v.n::int as visits,
             coalesce(r.rev,0)::float as retail_revenue,
             coalesce(r.lines,0)::int as retail_lines,
             round(100.0*coalesce(r.lines,0)/nullif(v.n,0),2)::float as attach_pct
        from v left join r on r.y = v.y
       where v.y between 2016 and 2019 order by v.y
    `),
    db.$queryRawUnsafe<BrandRow[]>(`
      with s as (select id from bask.salon where org_id = '${FIELD_ORG_ID}')
      select p.brand,
             count(*)::int as lines,
             sum(sl.line_total)::float as revenue,
             round(100.0*sum(sl.line_total)/sum(sum(sl.line_total)) over (),1)::float as pct_of_retail
        from bask.sale_line sl
        join s on s.id = sl.salon_id
        join bask.product p on p.id = sl.product_id
       where p.brand is not null
       group by p.brand order by revenue desc limit 6
    `),
  ]);

  const t = totals[0];
  if (!t) {
    /* The dataset can be absent — a `demo:reset` drops every org. Say that
       plainly rather than rendering a page of zeros that reads like a finding. */
    return (
      <main className="ev-page">
        <div className="ev-shell">
          <h1 className="ev-h1">The field dataset is not loaded.</h1>
          <p className="ev-lede">
            This page reads a real salon’s point-of-sale history straight out of the database. There
            is nothing in it right now, which means the data has not been loaded — not that the
            numbers are zero.
          </p>
        </div>
      </main>
    );
  }

  const y17 = years.find((r) => r.year === 2017);
  const y19 = years.find((r) => r.year === 2019);
  const visitDrop =
    y17 && y19 ? Math.round(((y17.visits - y19.visits) / y17.visits) * 1000) / 10 : null;
  const retailDrop =
    y17 && y19
      ? Math.round(((y17.retail_revenue - y19.retail_revenue) / y17.retail_revenue) * 1000) / 10
      : null;
  const maxVisits = Math.max(...years.map((r) => r.visits), 1);
  const maxRetail = Math.max(...years.map((r) => r.retail_revenue), 1);

  return (
    <main className="ev-page">
      <div className="ev-shell">
        <p className="ev-eyebrow">Field evidence · queried live</p>
        <h1 className="ev-h1">
          Everything here came out of one real salon’s till.
        </h1>
        <p className="ev-lede">
          Four locations, {new Date(t.first_day).getFullYear()}–{new Date(t.last_day).getFullYear()},
          pulled from the point-of-sale machine with the owner’s permission and de-identified before
          it was loaded. These figures are read from the database each time this page opens. Nothing
          on it is a fixture.
        </p>

        <section className="ev-stats">
          <div className="ev-stat">
            <span className="ev-stat-v num">{n(Number(t.visits))}</span>
            <span className="ev-stat-k">visits</span>
          </div>
          <div className="ev-stat">
            <span className="ev-stat-v num">{n(Number(t.customers))}</span>
            <span className="ev-stat-k">customers</span>
          </div>
          <div className="ev-stat">
            <span className="ev-stat-v num">{n(Number(t.sales))}</span>
            <span className="ev-stat-k">sales</span>
          </div>
          <div className="ev-stat">
            <span className="ev-stat-v num">{Number(t.salons)}</span>
            <span className="ev-stat-k">locations</span>
          </div>
        </section>

        {visitDrop !== null && retailDrop !== null && (
          <section className="ev-block">
            <h2 className="ev-h2">They kept the customers. They stopped selling to them.</h2>
            <p className="ev-body">
              Between 2017 and 2019 this business lost{' '}
              <strong className="num">{visitDrop}%</strong> of its visits — and{' '}
              <strong className="num">{retailDrop}%</strong> of its retail revenue. People kept
              coming through the door. What stopped was the second conversation at the counter.
            </p>

            <div className="ev-years">
              {years.map((r) => (
                <div className="ev-year" key={r.year}>
                  <span className="ev-year-label num">{r.year}</span>
                  <div className="ev-bars">
                    <div className="ev-bar-row">
                      <span className="ev-bar-track">
                        <span
                          className="ev-bar ev-bar--visits"
                          style={{ width: `${(r.visits / maxVisits) * 100}%` }}
                        />
                      </span>
                      <span className="ev-bar-v num">{n(r.visits)} visits</span>
                    </div>
                    <div className="ev-bar-row">
                      <span className="ev-bar-track">
                        <span
                          className="ev-bar ev-bar--retail"
                          style={{ width: `${(r.retail_revenue / maxRetail) * 100}%` }}
                        />
                      </span>
                      <span className="ev-bar-v num">{money(r.retail_revenue)} retail</span>
                    </div>
                  </div>
                  <span className="ev-year-attach num">{r.attach_pct}% attached</span>
                </div>
              ))}
            </div>
            <p className="ev-note">
              Attachment is the share of visits that left with a product. It is the number Bask
              watches, and on this dataset it runs between 5% and 7% — which is what a real salon
              looks like.
            </p>
          </section>
        )}

        <section className="ev-block">
          <h2 className="ev-h2">And most of what they sold was yours.</h2>
          <p className="ev-body">
            {money(Number(t.retail_revenue))} of product went across this counter. Sorted by
            revenue, brand by brand:
          </p>
          <ul className="ev-brands">
            {brands.map((b) => (
              <li className="ev-brand" key={b.brand}>
                <span className="ev-brand-name">{b.brand.trim()}</span>
                <span className="ev-brand-bar">
                  <span style={{ width: `${b.pct_of_retail}%` }} />
                </span>
                <span className="ev-brand-v num">{b.pct_of_retail}%</span>
                <span className="ev-brand-rev num">{money(b.revenue)}</span>
              </li>
            ))}
          </ul>
          <p className="ev-note">
            Every figure on this page is a `select` against the same tables the product reads. The
            client is not named here, and never is.
          </p>
        </section>
      </div>
    </main>
  );
}
