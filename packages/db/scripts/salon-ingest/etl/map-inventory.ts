/**
 * inventory_snapshots.csv → InventoryLevelInput[]. Many snapshots per
 * salon+product; keep the latest by snapshot_date. Pure.
 */
import { remapId, num, type InventoryLevelInput } from './contract';

export function mapInventory(rows: Record<string, string>[]): InventoryLevelInput[] {
  const latest = new Map<string, Record<string, string>>();
  for (const r of rows) {
    const key = `${r.salon_id}|${r.product_id}`;
    const prev = latest.get(key);
    if (!prev || r.snapshot_date > prev.snapshot_date) latest.set(key, r);
  }
  return Array.from(latest.values()).map((r) => ({
    id: remapId('inv', `${r.salon_id}|${r.product_id}`),
    salonId: remapId('salon', r.salon_id),
    productId: remapId('product', r.product_id),
    onHand: num(r.on_hand_units),
    reorderPoint: num(r.reorder_threshold),
  }));
}