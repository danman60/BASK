# TASK — map-inventory

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-inventory.ts`

Pure mapper: `inventory_snapshots.csv` rows → Bask `InventoryLevelInput[]`.
There are many dated snapshots per salon+product; Bask holds ONE current level
per salon+product, so keep the LATEST snapshot for each. Import from `./contract`.

## The file

Doc comment:

```ts
/**
 * inventory_snapshots.csv → InventoryLevelInput[]. Many snapshots per
 * salon+product; keep the latest by snapshot_date. Pure.
 */
```

Import from `./contract`: `remapId`, `num`, type `InventoryLevelInput`.

Export:

```ts
export function mapInventory(rows: Record<string, string>[]): InventoryLevelInput[] {
  const latest = new Map<string, Record<string, string>>();
  for (const r of rows) {
    const key = `${r.salon_id}|${r.product_id}`;
    const prev = latest.get(key);
    if (!prev || r.snapshot_date > prev.snapshot_date) latest.set(key, r);
  }
  return [...latest.values()].map((r) => ({
    id: remapId('inv', `${r.salon_id}|${r.product_id}`),
    salonId: remapId('salon', r.salon_id),
    productId: remapId('product', r.product_id),
    onHand: num(r.on_hand_units),
    reorderPoint: num(r.reorder_threshold),
  }));
}
```

String date comparison (`>`) is correct here because snapshot_date is ISO
`YYYY-MM-DD` — lexical order equals chronological order. Real CSV columns:
`snapshot_date, salon_id, product_id, on_hand_units, reorder_threshold, estimated_days_of_supply`.

## RULES

- Write exactly ONE file: the path above. No other file.
- NEVER write `import React`. Every contract symbol referenced must be imported from './contract'.
- No `any`, no DB, no file I/O, no `Date.now()`/`Math.random`.
- Acceptance: `tsc --noEmit` clean; `mapInventory` exported.
- DO NOT fix bugs or refactor outside this file.
