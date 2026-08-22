/**
 * products.csv → ProductInput[]. Products are global (no salonId) in Bask;
 * per-salon stock is InventoryLevel. Pure.
 */
import { remapId, num, bool, type ProductInput } from './contract';

export function mapProducts(rows: Record<string, string>[]): ProductInput[] {
  return rows.map((r) => ({
    id: remapId('product', r.product_id),
    sku: r.sku,
    name: r.product_name,
    brand: r.brand || null,
    category: r.category || null,
    retailPrice: num(r.retail_price),
    wholesaleCost: r.unit_cost ? num(r.unit_cost) : null,
    isActive: bool(r.active),
  }));
}