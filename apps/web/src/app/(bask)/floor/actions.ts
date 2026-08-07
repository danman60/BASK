'use server';



import { db } from '@bask/db';

import { getFloorEngine } from '@/server/floor/engine';
import { readFloorClock } from '@/server/floor/demo-clock';
import {
  readCustomerCard,
  readHandoff,
  WAIVER_VALID_DAYS,
  type CustomerCard,
  type HandoffSummary,
} from '@/server/floor/floor-data';

/**
 * Every Floor mutation. Server actions rather than tRPC for the same reason the
 * M0 harness gave: `packages/api` is another lane's, and these are thin enough to
 * become wrappers over the same calls when its `floor` router lands.
 *
 * Two rules hold across all of them:
 *  - Salon scope is resolved server-side from the engine, never taken from the
 *    client. A form that can name its own salon is a form that can write to
 *    someone else's.
 *  - Rows the Floor writes are stamped with `demoNow` (the demo's calendar day at
 *    the real time of day), so "today" means the same thing to the POS, the shift
 *    handoff and the insight engine after `demo:advance` has moved the clock.
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function salonId(): Promise<string> {
  const state = await getFloorEngine('hero').getState();
  return state.salonId;
}

// ---------------------------------------------------------------------------
// Check-in
// ---------------------------------------------------------------------------

export async function checkInAction(input: {
  customerId: string;
  serviceId: string;
  roomId: string;
  minutes: number;
  bookingId?: string | null;
}): Promise<ActionResult & { sessionId?: string; visitId?: string }> {
  const engine = getFloorEngine('hero');
  const state = await engine.getState();
  const clock = await readFloorClock();

  const customer = await db.customer.findFirst({
    where: { id: input.customerId, salonId: state.salonId },
    select: { id: true },
  });
  if (!customer) return { ok: false, error: 'unknown_customer' };

  const visit = await db.visit.create({
    data: {
      salonId: state.salonId,
      customerId: input.customerId,
      source: input.bookingId ? 'appointment' : 'walk_in',
      checkedInAt: clock.demoNow,
    },
    select: { id: true },
  });

  const started = await engine.startSession({
    roomId: input.roomId,
    minutes: input.minutes,
    customerId: input.customerId,
    serviceId: input.serviceId,
    visitId: visit.id,
  });

  if (!started.ok) {
    // The bed refused, so nothing happened — do not leave a Visit claiming it did.
    await db.visit.delete({ where: { id: visit.id } });
    console.warn('[floor] check-in refused', { room: input.roomId, reason: started.error });
    return { ok: false, error: started.error };
  }

  await db.customer.update({
    where: { id: input.customerId },
    data: { lastVisitAt: clock.demoNow },
  });

  if (input.bookingId) {
    await db.booking.updateMany({
      where: { id: input.bookingId, salonId: state.salonId },
      data: { state: 'arrived' },
    });
  }

  await db.activityEvent.create({
    data: {
      salonId: state.salonId,
      actorType: 'staff',
      actorLabel: 'Front desk',
      action: 'checked_in',
      targetType: 'session',
      targetId: started.sessionId,
      metadata: { roomId: input.roomId, minutes: input.minutes },
      occurredAt: clock.demoNow,
    },
  });


  return { ok: true, sessionId: started.sessionId, visitId: visit.id };
}

export async function cancelSessionAction(roomId: string): Promise<ActionResult> {
  const result = await getFloorEngine('hero').cancelSession(roomId);

  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function setMaintenanceAction(roomId: string, on: boolean): Promise<ActionResult> {
  const result = await getFloorEngine('hero').setMaintenance(roomId, on);

  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function loadCustomerCardAction(
  customerId: string,
): Promise<{ ok: true; card: CustomerCard } | { ok: false; error: string }> {
  const card = await readCustomerCard(await salonId(), customerId);
  return card ? { ok: true, card } : { ok: false, error: 'unknown_customer' };
}

// ---------------------------------------------------------------------------
// Waiver signature
// ---------------------------------------------------------------------------

/** A signature that is a few dots is not a signature; refuse it rather than store it. */
const MIN_SIGNATURE_STROKES = 1;
const MAX_SIGNATURE_BYTES = 400_000;

export async function recordWaiverAction(input: {
  customerId: string;
  signedName: string;
  imageData: string;
  width: number;
  height: number;
  strokes: number;
}): Promise<ActionResult> {
  const scope = await salonId();
  const clock = await readFloorClock();

  if (!input.imageData.startsWith('data:image/png;base64,')) {
    return { ok: false, error: 'bad_signature_format' };
  }
  if (input.imageData.length > MAX_SIGNATURE_BYTES) {
    return { ok: false, error: 'signature_too_large' };
  }
  if (input.strokes < MIN_SIGNATURE_STROKES || input.signedName.trim().length < 2) {
    return { ok: false, error: 'signature_incomplete' };
  }

  const customer = await db.customer.findFirst({
    where: { id: input.customerId, salonId: scope },
    select: { id: true },
  });
  if (!customer) return { ok: false, error: 'unknown_customer' };

  const signedAt = clock.demoNow;
  await db.$transaction(async (tx) => {
    await tx.waiverSignature.create({
      data: {
        salonId: scope,
        customerId: input.customerId,
        signedName: input.signedName.trim(),
        imageData: input.imageData,
        width: input.width,
        height: input.height,
        strokes: input.strokes,
        signedAt,
        expiresAt: new Date(signedAt.getTime() + WAIVER_VALID_DAYS * 86_400_000),
      },
    });
    // The flag the check-in panel reads stays in step with the artefact.
    await tx.customer.update({
      where: { id: input.customerId },
      data: { waiverSignedAt: signedAt },
    });
    await tx.activityEvent.create({
      data: {
        salonId: scope,
        actorType: 'staff',
        actorLabel: 'Front desk',
        action: 'waiver_signed',
        targetType: 'customer',
        targetId: input.customerId,
        metadata: {},
        occurredAt: signedAt,
      },
    });
  });


  return { ok: true };
}

export interface StoredWaiver {
  id: string;
  signedName: string;
  imageData: string;
  signedAt: string;
  expiresAt: string | null;
}

export async function readWaiverAction(
  customerId: string,
): Promise<{ ok: true; waivers: StoredWaiver[] } | { ok: false; error: string }> {
  const scope = await salonId();
  const rows = await db.waiverSignature.findMany({
    where: { salonId: scope, customerId },
    orderBy: { signedAt: 'desc' },
    take: 5,
    select: { id: true, signedName: true, imageData: true, signedAt: true, expiresAt: true },
  });
  return {
    ok: true,
    waivers: rows.map((r) => ({
      id: r.id,
      signedName: r.signedName,
      imageData: r.imageData,
      signedAt: r.signedAt.toISOString(),
      expiresAt: r.expiresAt?.toISOString() ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// POS
// ---------------------------------------------------------------------------

export type TenderChoice = 'card' | 'cash' | 'gift_card' | 'package_credit' | 'membership_included';

export interface CartLineInput {
  /** A catalogue product, or a gift card being sold at `giftCardAmount`. */
  productId?: string;
  serviceId?: string;
  giftCardAmount?: number;
  giftCardRecipient?: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleReceipt {
  saleId: string;
  total: number;
  subtotal: number;
  discount: number;
  tenderLabel: string;
  lines: { name: string; quantity: number; lineTotal: number }[];
  giftCardsIssued: { code: string; balance: number }[];
  changeDue: number;
}

export async function completeSaleAction(input: {
  customerId: string | null;
  visitId: string | null;
  lines: CartLineInput[];
  tender: TenderChoice;
  /** Percentage off the whole cart, 0–50 (guardrail below). */
  discountPct: number;
  giftCardCode?: string;
  cashTendered?: number;
}): Promise<{ ok: true; receipt: SaleReceipt } | { ok: false; error: string }> {
  const scope = await salonId();
  const clock = await readFloorClock();

  if (input.lines.length === 0) return { ok: false, error: 'empty_cart' };
  const discountPct = Math.min(Math.max(input.discountPct, 0), 50);

  const subtotal = input.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const discount = round2((subtotal * discountPct) / 100);
  const total = round2(subtotal - discount);

  // Gift-card tender is validated before anything is written: a receipt that
  // says "paid" against a card that could not cover it is worse than a refusal.
  let giftCard: { id: string; balance: number; code: string } | null = null;
  if (input.tender === 'gift_card') {
    const code = (input.giftCardCode ?? '').trim().toUpperCase();
    const found = await db.giftCard.findFirst({
      where: { salonId: scope, code, state: 'active' },
      select: { id: true, balance: true, code: true },
    });
    if (!found) return { ok: false, error: 'gift_card_not_found' };
    giftCard = { id: found.id, balance: Number(found.balance), code: found.code };
    if (giftCard.balance < total) return { ok: false, error: 'gift_card_insufficient' };
  }

  if (input.tender === 'package_credit') {
    if (!input.customerId) return { ok: false, error: 'package_needs_customer' };
    const pkg = await db.package.findFirst({
      where: { salonId: scope, customerId: input.customerId, status: 'active', creditsRemaining: { gt: 0 } },
      select: { id: true },
    });
    if (!pkg) return { ok: false, error: 'no_package_credits' };
  }

  const result = await db.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        salonId: scope,
        customerId: input.customerId,
        visitId: input.visitId,
        state: 'completed',
        subtotal,
        discount,
        tax: 0,
        total,
        soldAt: clock.demoNow,
      },
      select: { id: true },
    });

    const issued: { code: string; balance: number }[] = [];
    const receiptLines: { name: string; quantity: number; lineTotal: number }[] = [];

    for (const line of input.lines) {
      const lineTotal = round2(line.unitPrice * line.quantity * (1 - discountPct / 100));

      if (line.giftCardAmount) {
        // A gift card sold is a liability created, not a product moved: its own
        // row, its own balance, and a sale line that points at it.
        const code = giftCardCode(sale.id, issued.length);
        const created = await tx.giftCard.create({
          data: {
            salonId: scope,
            code,
            initialBalance: line.giftCardAmount,
            balance: line.giftCardAmount,
            state: 'active',
            purchaserId: input.customerId,
            recipientName: line.giftCardRecipient ?? null,
            issuedAt: clock.demoNow,
          },
          select: { id: true, code: true, balance: true },
        });
        await tx.saleLine.create({
          data: {
            salonId: scope,
            saleId: sale.id,
            customerId: input.customerId,
            giftCardId: created.id,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: round2(line.unitPrice * line.quantity - lineTotal),
            lineTotal,
            tenderType: input.tender,
            soldAt: clock.demoNow,
          },
        });
        issued.push({ code: created.code, balance: Number(created.balance) });
        receiptLines.push({ name: `Gift card · ${created.code}`, quantity: line.quantity, lineTotal });
        continue;
      }

      const saleLine = await tx.saleLine.create({
        data: {
          salonId: scope,
          saleId: sale.id,
          customerId: input.customerId,
          productId: line.productId ?? null,
          serviceId: line.serviceId ?? null,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discount: round2(line.unitPrice * line.quantity - lineTotal),
          lineTotal,
          tenderType: input.tender,
          soldAt: clock.demoNow,
        },
        select: { id: true },
      });

      if (line.productId) {
        const level = await tx.inventoryLevel.findUnique({
          where: { salonId_productId: { salonId: scope, productId: line.productId } },
          select: { onHand: true },
        });
        const after = (level?.onHand ?? 0) - line.quantity;
        await tx.inventoryLevel.upsert({
          where: { salonId_productId: { salonId: scope, productId: line.productId } },
          update: { onHand: after },
          create: { salonId: scope, productId: line.productId, onHand: after },
        });
        await tx.stockEvent.create({
          data: {
            salonId: scope,
            productId: line.productId,
            type: 'sold',
            quantityDelta: -line.quantity,
            quantityAfter: after,
            saleLineId: saleLine.id,
            occurredAt: clock.demoNow,
          },
        });
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          select: { name: true },
        });
        receiptLines.push({
          name: product?.name ?? 'Product',
          quantity: line.quantity,
          lineTotal,
        });
      } else if (line.serviceId) {
        const service = await tx.service.findUnique({
          where: { id: line.serviceId },
          select: { name: true },
        });
        receiptLines.push({
          name: service?.name ?? 'Session',
          quantity: line.quantity,
          lineTotal,
        });
      }
    }

    if (giftCard) {
      await tx.giftCard.update({
        where: { id: giftCard.id },
        data: {
          balance: round2(giftCard.balance - total),
          state: round2(giftCard.balance - total) <= 0 ? 'redeemed' : 'active',
        },
      });
    }

    if (input.tender === 'package_credit' && input.customerId) {
      const pkg = await tx.package.findFirst({
        where: {
          salonId: scope,
          customerId: input.customerId,
          status: 'active',
          creditsRemaining: { gt: 0 },
        },
        orderBy: { purchasedAt: 'asc' },
        select: { id: true, creditsRemaining: true },
      });
      if (pkg) {
        const remaining = pkg.creditsRemaining - 1;
        await tx.package.update({
          where: { id: pkg.id },
          data: { creditsRemaining: remaining, status: remaining === 0 ? 'used' : 'active' },
        });
      }
    }

    if (discountPct > 0) {
      await tx.activityEvent.create({
        data: {
          salonId: scope,
          actorType: 'staff',
          actorLabel: 'Front desk',
          action: 'discount_applied',
          targetType: 'sale',
          targetId: sale.id,
          metadata: { discountPct, discount },
          occurredAt: clock.demoNow,
        },
      });
    }

    return { saleId: sale.id, issued, receiptLines };
  });


  return {
    ok: true,
    receipt: {
      saleId: result.saleId,
      total,
      subtotal,
      discount,
      tenderLabel: TENDER_LABELS[input.tender],
      lines: result.receiptLines,
      giftCardsIssued: result.issued,
      changeDue:
        input.tender === 'cash' && input.cashTendered
          ? round2(Math.max(0, input.cashTendered - total))
          : 0,
    },
  };
}

const TENDER_LABELS: Record<TenderChoice, string> = {
  card: 'Card',
  cash: 'Cash',
  gift_card: 'Gift card',
  package_credit: 'Package credit',
  membership_included: 'Included with membership',
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function giftCardCode(saleId: string, index: number): string {
  const tail = saleId.replace(/-/g, '').slice(-6).toUpperCase();
  return `GC-${tail}${index > 0 ? `-${index + 1}` : ''}`;
}

// ---------------------------------------------------------------------------
// Barcodes
// ---------------------------------------------------------------------------

/**
 * The unknown-barcode flow (IMPLEMENTATION_SPEC §6.2). The catalogue builds
 * itself through use, so this has to be fast and forgiving: a name, a price, and
 * the code that was already scanned.
 */
export async function quickCreateProductAction(input: {
  barcode: string;
  symbology: 'upc_a' | 'ean_13' | 'code_128' | 'custom';
  name: string;
  price: number;
  category: string;
  brand?: string;
  size?: string;
  onHand: number;
}): Promise<{ ok: true; productId: string; sku: string } | { ok: false; error: string }> {
  const scope = await salonId();
  const clock = await readFloorClock();

  if (input.name.trim().length < 2) return { ok: false, error: 'name_required' };
  if (!Number.isFinite(input.price) || input.price < 0) return { ok: false, error: 'bad_price' };

  const existing = await db.barcode.findFirst({
    where: { value: input.barcode, OR: [{ salonId: scope }, { salonId: null }] },
    select: { productId: true, product: { select: { sku: true } } },
  });
  if (existing) {
    return { ok: true, productId: existing.productId, sku: existing.product.sku };
  }

  // Internal SKUs are `BSK-#####` and salon-scoped for custom products (§6.1).
  const last = await db.product.findFirst({
    where: { sku: { startsWith: 'BSK-' } },
    orderBy: { sku: 'desc' },
    select: { sku: true },
  });
  const nextNumber = last ? Number(last.sku.slice(4)) + 1 : 10_001;
  const sku = `BSK-${String(nextNumber).padStart(5, '0')}`;

  const product = await db.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        salonId: scope,
        sku,
        name: input.name.trim(),
        brand: input.brand?.trim() || null,
        category: input.category,
        size: input.size?.trim() || null,
        retailPrice: input.price,
      },
      select: { id: true, sku: true },
    });
    await tx.barcode.create({
      data: {
        salonId: scope,
        productId: created.id,
        value: input.barcode,
        symbology: input.symbology,
        source: 'scanned',
        isPrimary: true,
      },
    });
    await tx.inventoryLevel.create({
      data: { salonId: scope, productId: created.id, onHand: input.onHand, reorderPoint: 0 },
    });
    if (input.onHand > 0) {
      await tx.stockEvent.create({
        data: {
          salonId: scope,
          productId: created.id,
          type: 'received',
          quantityDelta: input.onHand,
          quantityAfter: input.onHand,
          note: 'Added at the desk from a scan.',
          occurredAt: clock.demoNow,
        },
      });
    }
    return created;
  });


  return { ok: true, productId: product.id, sku: product.sku };
}

/** Receiving mode: a scan of a known product bumps stock by one. */
export async function receiveScanAction(
  productId: string,
): Promise<{ ok: true; onHand: number } | { ok: false; error: string }> {
  const scope = await salonId();
  const clock = await readFloorClock();
  const level = await db.inventoryLevel.findUnique({
    where: { salonId_productId: { salonId: scope, productId } },
    select: { onHand: true },
  });
  const after = (level?.onHand ?? 0) + 1;
  await db.$transaction(async (tx) => {
    await tx.inventoryLevel.upsert({
      where: { salonId_productId: { salonId: scope, productId } },
      update: { onHand: after },
      create: { salonId: scope, productId, onHand: after },
    });
    await tx.stockEvent.create({
      data: {
        salonId: scope,
        productId,
        type: 'received',
        quantityDelta: 1,
        quantityAfter: after,
        note: 'Scanned in at the desk.',
        occurredAt: clock.demoNow,
      },
    });
  });

  return { ok: true, onHand: after };
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

export async function rebookAction(input: {
  bookingId: string;
  startsAt: string;
  roomId?: string | null;
}): Promise<ActionResult> {
  const scope = await salonId();
  const booking = await db.booking.findFirst({
    where: { id: input.bookingId, salonId: scope },
    select: { id: true, minutes: true },
  });
  if (!booking) return { ok: false, error: 'unknown_booking' };

  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: 'bad_time' };

  await db.booking.update({
    where: { id: booking.id },
    data: {
      startsAt,
      endsAt: new Date(startsAt.getTime() + booking.minutes * 60_000),
      ...(input.roomId ? { roomId: input.roomId } : {}),
    },
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Shift handoff
// ---------------------------------------------------------------------------

/**
 * Recomputed on open rather than handed down with the page: a handoff read five
 * minutes after the last sale of the night is the one case where stale numbers
 * are the whole problem.
 */
export async function readHandoffAction(): Promise<HandoffSummary> {
  const clock = await readFloorClock();
  return readHandoff(await salonId(), clock);
}

export async function postHandoffAction(input: {
  note: string;
  summary: unknown;
}): Promise<ActionResult> {
  const scope = await salonId();
  const clock = await readFloorClock();
  const forDate = new Date(`${clock.today}T00:00:00Z`);

  const existing = await db.shiftHandoff.findFirst({
    where: { salonId: scope, forDate },
    select: { id: true },
  });

  const data = {
    salonId: scope,
    forDate,
    summary: input.summary as never,
    note: input.note.trim() || null,
    postedAt: clock.demoNow,
  };

  if (existing) await db.shiftHandoff.update({ where: { id: existing.id }, data });
  else await db.shiftHandoff.create({ data });

  await db.activityEvent.create({
    data: {
      salonId: scope,
      actorType: 'staff',
      actorLabel: 'Front desk',
      action: 'shift_handoff_posted',
      targetType: 'shift_handoff',
      metadata: {},
      occurredAt: clock.demoNow,
    },
  });


  return { ok: true };
}
