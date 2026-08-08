import 'server-only';

import { formatCurrency, round, type SalonFacts } from '@bask/core';
import { db } from '@bask/db';

import {
  buildRecommendations,
  risingCategoriesFrom,
  toStockRow,
  type Recommendation,
  type RisingCategory,
  type StockFlag,
  type StockRow,
} from './inventory-rules';

/**
 * Inventory + UVALUX commerce read model (PRODUCT_SPEC §12).
 *
 * The rules live in `inventory-rules.ts` (pure, unit-tested); this file is the
 * database half. Nothing on the screen is a stored label: every number is
 * derived from the same `SalonFacts.stock` rollup the low-stock and overstock
 * detectors reason over, so the shelf list and the insight card can never
 * disagree.
 */

export {
  CASE_SIZE,
  REORDER_CYCLE_DAYS,
  buildRecommendations,
  flagFor,
  risingCategoriesFrom,
  type Recommendation,
  type ReorderReasonKind,
  type RisingCategory,
  type StockFlag,
  type StockRow,
} from './inventory-rules';

export const CATEGORY_LABELS: Record<string, string> = {
  bronzer: 'Bronzers',
  accelerator: 'Accelerators',
  aftercare: 'Aftercare',
  face: 'Face',
  spray_solution: 'Spray solution',
  wellness: 'Wellness',
  kit: 'Kits',
  accessory: 'Accessories',
};

export interface InventoryBoard {
  rows: StockRow[];
  counts: Record<StockFlag, number>;
  recommendations: Recommendation[];
  /** Category trends the seasonal-lift reason is drawn from. */
  risingCategories: RisingCategory[];
  shelfValueTotal: number;
}

export async function loadInventoryBoard(facts: SalonFacts): Promise<InventoryBoard> {
  const products = await db.product.findMany({
    where: { id: { in: facts.stock.map((s) => s.productId) } },
    select: { id: true, brand: true, size: true, imageUrl: true, description: true },
  });
  const meta = new Map(products.map((p) => [p.id, p]));

  const rows = facts.stock
    .map((stock) =>
      toStockRow(stock, {
        brand: meta.get(stock.productId)?.brand ?? null,
        size: meta.get(stock.productId)?.size ?? null,
        image: meta.get(stock.productId)?.imageUrl ?? null,
        description: meta.get(stock.productId)?.description ?? null,
      }),
    )
    .sort(
      (a, b) =>
        (a.daysRemaining ?? Number.MAX_SAFE_INTEGER) -
        (b.daysRemaining ?? Number.MAX_SAFE_INTEGER),
    );

  const counts: Record<StockFlag, number> = {
    critical: 0,
    reorder: 0,
    watch: 0,
    healthy: 0,
    overstock: 0,
  };
  for (const row of rows) counts[row.flag] += 1;

  const risingCategories = risingCategoriesFrom(facts.categoryTrends);

  return {
    rows,
    counts,
    recommendations: buildRecommendations(rows, risingCategories),
    risingCategories,
    shelfValueTotal: round(
      rows.reduce((sum, r) => sum + r.shelfValue, 0),
      2,
    ),
  };
}

// ---------------------------------------------------------------------------
// Draft order
// ---------------------------------------------------------------------------

export interface DraftOrderLineView {
  id: string;
  productId: string | null;
  sku: string;
  name: string;
  brand: string | null;
  size: string | null;
  category: string | null;
  /** Repo-local product photo, `/catalogue/<sku>.jpg`. */
  image: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  retailPrice: number;
  reason: string | null;
}

export interface DraftOrderView {
  id: string;
  state: string;
  total: number;
  submittedAt: Date | null;
  note: string | null;
  lines: DraftOrderLineView[];
  /** Retail value of the order if every unit sells. */
  retailValue: number;
  formattedTotal: string;
}

/** The accumulating draft. One open draft per salon — it is a running basket. */
export async function getOpenDraftOrder(salonId: string): Promise<DraftOrderView | null> {
  const order = await db.draftOrder.findFirst({
    where: { salonId, state: 'draft' },
    orderBy: { createdAt: 'desc' },
    include: { lines: { include: { product: true }, orderBy: { createdAt: 'asc' } } },
  });
  return order ? toView(order) : null;
}

export async function getDraftOrderById(id: string): Promise<DraftOrderView | null> {
  const order = await db.draftOrder.findUnique({
    where: { id },
    include: { lines: { include: { product: true }, orderBy: { createdAt: 'asc' } } },
  });
  return order ? toView(order) : null;
}

/** The most recent order that has already gone to the rep. */
export async function getLastSubmittedOrder(salonId: string): Promise<DraftOrderView | null> {
  const order = await db.draftOrder.findFirst({
    where: { salonId, state: { not: 'draft' } },
    orderBy: { submittedAt: 'desc' },
    include: { lines: { include: { product: true }, orderBy: { createdAt: 'asc' } } },
  });
  return order ? toView(order) : null;
}

type DraftOrderWithLines = Awaited<
  ReturnType<
    typeof db.draftOrder.findFirstOrThrow<{
      include: { lines: { include: { product: true } } };
    }>
  >
>;

function toView(order: DraftOrderWithLines): DraftOrderView {
  const lines: DraftOrderLineView[] = order.lines.map((line) => {
    const unitPrice = Number(line.unitPrice);
    return {
      id: line.id,
      productId: line.productId,
      sku: line.product?.sku ?? '—',
      name: line.product?.name ?? line.description ?? 'Catalogue item',
      brand: line.product?.brand ?? null,
      size: line.product?.size ?? null,
      category: line.product?.category ?? null,
      image: line.product?.imageUrl ?? null,
      quantity: line.quantity,
      unitPrice,
      lineTotal: round(unitPrice * line.quantity, 2),
      retailPrice: line.product ? Number(line.product.retailPrice) : 0,
      reason: line.reason,
    };
  });

  const total = round(
    lines.reduce((sum, l) => sum + l.lineTotal, 0),
    2,
  );

  return {
    id: order.id,
    state: order.state,
    total,
    submittedAt: order.submittedAt,
    note: order.note,
    lines,
    retailValue: round(
      lines.reduce((sum, l) => sum + l.retailPrice * l.quantity, 0),
      2,
    ),
    formattedTotal: formatCurrency(total),
  };
}
