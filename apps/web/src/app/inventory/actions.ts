'use server';

import { revalidatePath } from 'next/cache';
import { round } from '@bask/core';
import { db } from '@bask/db';

import { buildRecommendations, loadInventoryBoard } from '@/server/inventory';
import { loadSalonFacts } from '@/server/facts';
import { getDemoSalon } from '@/server/salon';

/**
 * Inventory + draft-order writes.
 *
 * Server actions rather than tRPC procedures: every one of these is a form
 * submit on a page Lane 4 owns, and `packages/api/routers/domains.ts` is a file
 * five other lanes are editing this week. Nothing here bypasses the shared
 * client — `db` is always the one from `@bask/db`.
 *
 * Every write also lands an `ActivityEvent`, because the activity log on
 * /insights is only honest if the app writes to it as it goes rather than
 * reconstructing history afterwards.
 */

async function logActivity(
  salonId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown>,
) {
  await db.activityEvent.create({
    data: {
      salonId,
      actorType: 'staff',
      actorLabel: 'Dana Whitfield',
      action,
      targetType,
      targetId,
      metadata: metadata as never,
    },
  });
}

/** One open draft per salon — the order is a running basket, not a new form. */
async function ensureDraftOrder(salonId: string): Promise<string> {
  const existing = await db.draftOrder.findFirst({
    where: { salonId, state: 'draft' },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) return existing.id;

  const account = await db.account.findUnique({ where: { salonId }, select: { id: true } });
  const created = await db.draftOrder.create({
    data: { salonId, accountId: account?.id ?? null, state: 'draft', total: 0 },
  });
  return created.id;
}

async function recalculateTotal(draftOrderId: string) {
  const lines = await db.draftOrderLine.findMany({ where: { draftOrderId } });
  const total = round(
    lines.reduce((sum, line) => sum + Number(line.unitPrice) * line.quantity, 0),
    2,
  );
  await db.draftOrder.update({ where: { id: draftOrderId }, data: { total } });
}

function revalidateLane4() {
  revalidatePath('/inventory');
  revalidatePath('/inventory/order');
  revalidatePath('/insights/activity');
}

/** Add one recommended line, carrying its "because" onto the row. */
export async function addLineAction(formData: FormData) {
  const productId = String(formData.get('productId') ?? '');
  const quantity = Number(formData.get('quantity') ?? 0);
  const unitPrice = Number(formData.get('unitPrice') ?? 0);
  const reason = String(formData.get('reason') ?? '');
  if (!productId || quantity <= 0) return;

  const salon = await getDemoSalon();
  const draftOrderId = await ensureDraftOrder(salon.salonId);
  const product = await db.product.findUnique({ where: { id: productId } });

  const existing = await db.draftOrderLine.findFirst({ where: { draftOrderId, productId } });
  if (existing) {
    await db.draftOrderLine.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity, reason },
    });
  } else {
    await db.draftOrderLine.create({
      data: {
        draftOrderId,
        productId,
        uvaluxCatalogItemId: product?.uvaluxCatalogItemId ?? null,
        description: product?.name ?? null,
        quantity,
        unitPrice,
        reason,
      },
    });
  }

  await recalculateTotal(draftOrderId);
  await logActivity(salon.salonId, 'draft_order_line_added', 'draft_order', draftOrderId, {
    product: product?.name ?? productId,
    quantity,
  });
  revalidateLane4();
}

/** Add every recommendation the engine currently makes, reasons and all. */
export async function addAllRecommendedAction() {
  const salon = await getDemoSalon();
  const facts = await loadSalonFacts(salon);
  const board = await loadInventoryBoard(facts);
  const recommendations = buildRecommendations(board.rows, board.risingCategories);
  if (recommendations.length === 0) return;

  const draftOrderId = await ensureDraftOrder(salon.salonId);
  const existing = await db.draftOrderLine.findMany({ where: { draftOrderId } });
  const seen = new Set(existing.map((line) => line.productId));

  const products = await db.product.findMany({
    where: { id: { in: recommendations.map((r) => r.productId) } },
    select: { id: true, uvaluxCatalogItemId: true, name: true },
  });
  const catalogueByProduct = new Map(products.map((p) => [p.id, p]));

  await db.draftOrderLine.createMany({
    data: recommendations
      .filter((r) => !seen.has(r.productId))
      .map((r) => ({
        draftOrderId,
        productId: r.productId,
        uvaluxCatalogItemId: catalogueByProduct.get(r.productId)?.uvaluxCatalogItemId ?? null,
        description: r.name,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        reason: r.reason,
      })),
  });

  await recalculateTotal(draftOrderId);
  await logActivity(salon.salonId, 'draft_order_line_added', 'draft_order', draftOrderId, {
    lines: recommendations.filter((r) => !seen.has(r.productId)).length,
  });
  revalidateLane4();
}

export async function updateLineAction(formData: FormData) {
  const lineId = String(formData.get('lineId') ?? '');
  const quantity = Number(formData.get('quantity') ?? 0);
  if (!lineId) return;

  const line = await db.draftOrderLine.findUnique({ where: { id: lineId } });
  if (!line) return;

  if (quantity <= 0) {
    await db.draftOrderLine.delete({ where: { id: lineId } });
  } else {
    await db.draftOrderLine.update({ where: { id: lineId }, data: { quantity } });
  }

  await recalculateTotal(line.draftOrderId);
  revalidateLane4();
}

/** Send to the UVALUX rep. Simulated delivery, real row — it lands in Compass. */
export async function submitOrderAction(formData: FormData) {
  const orderId = String(formData.get('orderId') ?? '');
  const note = String(formData.get('note') ?? '').trim();
  if (!orderId) return;

  const salon = await getDemoSalon();
  const order = await db.draftOrder.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });
  if (!order || order.lines.length === 0) return;

  const account = await db.account.findUnique({
    where: { salonId: salon.salonId },
    select: { id: true },
  });

  await db.draftOrder.update({
    where: { id: orderId },
    data: {
      state: 'submitted',
      submittedAt: new Date(),
      accountId: order.accountId ?? account?.id ?? null,
      note: note.length > 0 ? note : null,
    },
  });

  await logActivity(salon.salonId, 'draft_order_submitted', 'draft_order', orderId, {
    lines: order.lines.length,
    total: Number(order.total),
  });

  revalidateLane4();
  revalidatePath('/compass');
}

/**
 * Scan receiving. The wedge listener itself is Lane 2's (one global listener,
 * context-routed) — this is the receiving endpoint it will call, and the manual
 * entry box a salon uses when the scanner is at the front desk and the stock is
 * in the back.
 */
export async function receiveScanAction(formData: FormData) {
  const code = String(formData.get('code') ?? '').trim();
  const quantity = Number(formData.get('quantity') ?? 1);
  if (!code || quantity <= 0) return;

  const salon = await getDemoSalon();
  const barcode = await db.barcode.findFirst({
    where: { value: code },
    include: { product: true },
  });

  // Unknown barcode: IMPLEMENTATION_SPEC §6.2 wants a "new product?" sheet. The
  // sheet is M2 (it needs the camera flow); recording the miss keeps the trail.
  if (!barcode) {
    await logActivity(salon.salonId, 'scan_unknown_code', 'barcode', null, { code });
    revalidateLane4();
    return;
  }

  const level = await db.inventoryLevel.findUnique({
    where: { salonId_productId: { salonId: salon.salonId, productId: barcode.productId } },
  });
  const onHand = (level?.onHand ?? 0) + quantity;

  await db.inventoryLevel.upsert({
    where: { salonId_productId: { salonId: salon.salonId, productId: barcode.productId } },
    update: { onHand, lastCountedAt: new Date() },
    create: {
      salonId: salon.salonId,
      productId: barcode.productId,
      onHand,
      reorderPoint: 0,
      lastCountedAt: new Date(),
    },
  });

  await db.stockEvent.create({
    data: {
      salonId: salon.salonId,
      productId: barcode.productId,
      type: 'received',
      quantityDelta: quantity,
      quantityAfter: onHand,
      note: `Scanned ${code}`,
    },
  });

  await logActivity(salon.salonId, 'stock_received', 'product', barcode.productId, {
    product: barcode.product.name,
    quantity,
  });
  revalidateLane4();
}
