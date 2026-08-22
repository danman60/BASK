# TASK — map-products

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-products.ts`

Pure mapper: `products.csv` rows → Bask `ProductInput[]`. Import from `./contract`.

## The file

Doc comment:

```ts
/**
 * products.csv → ProductInput[]. Products are global (no salonId) in Bask;
 * per-salon stock is InventoryLevel. Pure.
 */
```

Import from `./contract`: `remapId`, `num`, `bool`, type `ProductInput`.

Export:

```ts
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
```

Real CSV columns: `product_id, sku, brand, category, product_name, unit_cost, retail_price, supplier, active`.

## RULES

- Write exactly ONE file: the path above. No other file.
- NEVER write `import React`. Every contract symbol referenced must be imported from './contract'.
- No `any`, no DB, no file I/O, no `Date.now()`/`Math.random`.
- Acceptance: `tsc --noEmit` clean; `mapProducts` exported.
- DO NOT fix bugs or refactor outside this file.
