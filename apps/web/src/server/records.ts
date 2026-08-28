import 'server-only';

import { db } from '@bask/db';

/**
 * The bottom of the drill-down: the actual rows behind a number.
 *
 * WHY THIS EXISTS. Today's chain stops one level short. A card says "$5,354 a
 * month", "Show me why" opens the evidence — a chart, two windows, the
 * contributing shifts — and there it ends. Everything on screen is still the
 * product's own arithmetic being shown back. The one question a stakeholder
 * actually asks, and the one an owner asks on week three, is "says who?".
 *
 * So this returns the visits themselves: every visit inside the insight's own
 * measurement window, whether a product went with it, which product, and what it
 * cost. The count and the rate are recomputed HERE, from the rows, and the UI
 * shows that recomputation next to the headline figure. If the two ever disagree
 * the screen says so rather than hiding it — a provenance view that can only
 * ever agree with itself is decoration.
 *
 * Owner directive (2026-08-26, recorded in the vault): click-through provenance
 * is mandatory, and it is a drill-down into the salon's OWN records — not a
 * methodology note. No p-values, no sample-size language, no method names. A
 * list of their visits, which is a thing every owner already understands.
 *
 * Deliberately narrow: only the attachment metric is implemented, because it is
 * the only one where a visit-level list reconciles exactly to the quoted rate.
 * Everything else returns null and the UI simply does not offer the link. A
 * provenance panel that shows *approximately* the right rows is worse than none,
 * because it teaches the owner the number cannot be checked.
 */

export interface RecordRow {
  visitId: string;
  /** ISO date of the visit, salon-local. */
  day: string;
  customerName: string;
  attached: boolean;
  productName: string | null;
  /** Formatted with currency, or null when nothing was sold. */
  amountLabel: string | null;
}

export interface RecordsView {
  /** Rows shown — capped; `totalVisits` is the honest denominator. */
  rows: RecordRow[];
  totalVisits: number;
  attachedVisits: number;
  /** Recomputed from the rows above, not copied from the insight. */
  ratePercent: number;
  windowLabel: string;
  /** How many rows exist beyond the ones returned. */
  hiddenCount: number;
}

const ROW_CAP = 40;

function fmtMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Visit-level records for the attachment metric, over `[start, end]` inclusive.
 *
 * The join is deliberately visit → sale → sale_line rather than sale_line →
 * visit: a visit with NO product is the interesting half of this list, and an
 * inner join would silently drop exactly the rows that explain the number.
 */
export async function attachmentRecords(
  salonId: string,
  start: string,
  end: string,
  windowLabel: string,
  currency = 'CAD',
): Promise<RecordsView> {
  const from = new Date(`${start}T00:00:00.000Z`);
  const to = new Date(`${end}T23:59:59.999Z`);

  const visits = await db.visit.findMany({
    where: { salonId, checkedInAt: { gte: from, lte: to } },
    orderBy: { checkedInAt: 'desc' },
    select: {
      id: true,
      checkedInAt: true,
      customer: { select: { firstName: true, lastName: true } },
      sales: {
        select: {
          lines: {
            where: { productId: { not: null } },
            select: { lineTotal: true, product: { select: { name: true, brand: true } } },
          },
        },
      },
    },
  });

  const mapped: RecordRow[] = visits.map((v) => {
    const productLines = v.sales.flatMap((s) => s.lines);
    const first = productLines[0];
    const total = productLines.reduce((sum, l) => sum + Number(l.lineTotal), 0);
    const name = first?.product
      ? [first.product.brand, first.product.name].filter(Boolean).join(' ')
      : null;
    return {
      visitId: v.id,
      day: v.checkedInAt.toISOString().slice(0, 10),
      customerName: `${v.customer?.firstName ?? ''} ${(v.customer?.lastName ?? '').slice(0, 1)}`.trim(),
      attached: productLines.length > 0,
      productName: productLines.length > 1 ? `${name} +${productLines.length - 1} more` : name,
      amountLabel: productLines.length > 0 ? fmtMoney(total, currency) : null,
    };
  });

  const attachedVisits = mapped.filter((r) => r.attached).length;
  const totalVisits = mapped.length;

  /* Attached visits first: the owner opened this to see what a sale looks like,
     and a list that opens on forty blanks answers a question nobody asked. The
     denominator stays honest in the header line either way. */
  const ordered = [...mapped].sort((a, b) => Number(b.attached) - Number(a.attached));

  return {
    rows: ordered.slice(0, ROW_CAP),
    totalVisits,
    attachedVisits,
    ratePercent: totalVisits === 0 ? 0 : Math.round((attachedVisits / totalVisits) * 1000) / 10,
    windowLabel,
    hiddenCount: Math.max(0, totalVisits - ROW_CAP),
  };
}
