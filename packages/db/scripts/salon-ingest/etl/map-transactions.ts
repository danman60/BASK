/**
 * transactions.csv → SaleInput[]; transaction_items.csv → SaleLineInput[].
 * A sale's tender comes from its transaction's payment_method (looked up by
 * transaction_id). Service lines have no productId; retail lines do. Pure.
 */

import { remapId, num, parseDate, tenderType, type SaleInput, type SaleLineInput } from './contract';

export function mapSales(rows: Record<string, string>[]): SaleInput[] {
  return rows.map((r) => {
    const service = num(r.service_revenue);
    const retail = num(r.retail_revenue);
    const discount = num(r.discount_amount);
    const total = num(r.total_revenue);
    return {
      id: remapId('sale', r.transaction_id),
      salonId: remapId('salon', r.salon_id),
      visitId: r.visit_id ? remapId('visit', r.visit_id) : null,
      customerId: r.customer_id ? remapId('customer', r.customer_id) : null,
      staffId: r.staff_id ? remapId('staff', r.staff_id) : null,
      state: 'completed',
      subtotal: service + retail,
      discount,
      tax: 0,
      total,
      soldAt: parseDate(r.transaction_at) ?? new Date('2025-01-01'),
    };
  });
}

export function mapSaleLines(
  itemRows: Record<string, string>[],
  txRows: Record<string, string>[],
): SaleLineInput[] {
  const tx = new Map<string, Record<string, string>>();
  for (const t of txRows) tx.set(t.transaction_id, t);
  return itemRows.map((r) => {
    const t = tx.get(r.transaction_id);
    const qty = num(r.quantity);
    const unit = num(r.unit_price);
    return {
      id: remapId('saleline', r.transaction_item_id),
      salonId: remapId('salon', r.salon_id),
      saleId: remapId('sale', r.transaction_id),
      customerId: t?.customer_id ? remapId('customer', t.customer_id) : null,
      productId: r.item_type === 'retail' && r.product_id ? remapId('product', r.product_id) : null,
      quantity: qty,
      unitPrice: unit,
      discount: 0,
      lineTotal: qty * unit,
      tenderType: tenderType(t?.payment_method ?? 'card'),
      soldAt: parseDate(t?.transaction_at) ?? new Date('2025-01-01'),
    };
  });
}