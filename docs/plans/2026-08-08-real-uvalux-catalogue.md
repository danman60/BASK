# Plan — replace invented demo products with the real UVALUX catalogue

**Date:** 2026-08-08
**Purpose line:** *This exists so that the demo shows real UVALUX lotions/machines — real brands,
logos, descriptions — instead of invented demo products.*
**Source:** https://uvalux.com/shop/ — WooCommerce Store API (`/wp-json/wc/store/v1/products`),
pulled 2026-08-08. 1,817 products, 1,755 with real SKUs, prices in **CAD**.

## What is real vs. what is derived

| Field | Source | Notes |
|---|---|---|
| `name`, `brand`, `sku` (official), `size` | uvalux.com Store API | verbatim |
| `description` | product `short_description` / `description` | HTML stripped, trimmed |
| image | uvalux CDN `images[0]` | downloaded into the repo, not hotlinked |
| `wholesaleCost` | the single listed uvalux price (CAD) | it is the salon-facing wholesale price |
| `retailPrice` | **DERIVED — `wholesaleCost × RETAIL_MARKUP`** | `RETAIL_MARKUP = 1.5`, given by Daniel 2026-08-08. Single constant; documented in the fixture header so it is never mistaken for scraped UVALUX data. |
| `velocity` | ours | demo dial, unchanged in meaning |
| brand logo | brand archive pages if present; otherwise **none** — wordmark text only | the brand API returns `image: null`; no logo will be invented |

## Hard constraints (from the existing fixtures — breaking these breaks the demo)

1. Exactly **40** catalogue entries — `TARGETS.skus = 40`, asserted in `determinism.test.ts:107`.
2. Internal SKU space stays `BSK-10001…BSK-10040` — the mint routine, the wedge-scanner regex
   (`/^BSK-\d{5}$/`) and the POS swatch all assume it. The real UVALUX SKU goes in
   `UvaluxCatalogItem.officialSku`, which is exactly what that field is for (currently `null`).
3. `BSK-10007` stays the highest-velocity bronzer (8-days-to-stockout arc) and `BSK-10021` stays
   the dead spray solution (overstock arc), or `ARCS` + both arc tests break.
4. Category strings stay within the 8 known keys (`bronzer, accelerator, aftercare,
   spray_solution, face, wellness, accessory, kit`) — three lookup maps key off them.
5. One owner for `demo:reset` — concurrent resets on the shared CC&SS DB corrupt state.

## Steps

1. **Curate 40 real products** from the pull, bucketed into the 8 category keys, spread across the
   real brands (Hempz, Australian Gold, Devoted Creations, California Tan, Designer Skin, Swedish
   Beauty, JWOWW, Supre Tan, Pro Tan, Ed Hardy, Norvell, Mystic Tan, Fiesta Sun). Emit
   `packages/db/fixtures/uvalux-catalogue.json` with a provenance header.
   *Accept:* 40 entries, each with real sku + brand + price + description + image; arcs hold
   (10007 = a real high-velocity bronzer, 10021 = a real spray solution).
2. **Migration** (bask-scoped): add `description` and `image_url` to `product` and
   `uvalux_catalog_item`. `db:migration:new` → `db:check` → `db:deploy` on `DIRECT_DATABASE_URL`.
   *Accept:* `db:check` passes, zero `public` footprint.
3. **Rewrite `catalogue.ts`** off the JSON; keep `CatalogueEntry` + `ATTACHMENT_CANDIDATES`
   semantics, add `officialSku`, `description`, `imageUrl`, and the `RETAIL_MARKUP` constant.
4. **Seed writes the new fields** — `index.ts` sets `officialSku` (real), description, image.
5. **Real machines on the Floor** — `ROOMS` names become real UVALUX equipment (Ergoline, KBL,
   Sun Capsule, Mystic Tan, Beauty Angel, Wellsystem Wave). `EquipmentDevice.config` gains
   `{ manufacturer, model }` (JSON field, no migration). `RoomType` labels unchanged.
6. **Product images into the repo** — `apps/web/public/catalogue/<sku>.jpg`, referenced locally so
   nothing depends on uvalux.com being reachable mid-pitch.
7. **Surface them** — product image + brand on the POS panel and the inventory rows; description
   on the product detail. Match the mockup bar, screenshot every iteration → Telegram DM.
8. **Update dependents** — `determinism.test.ts` room names, `arcs.test.ts` product names,
   `inventory-rules.test.ts`, `mockups/02-floor.html`, `docs/pitch/PITCH.md`,
   `docs/PRODUCT_SPEC.md`, `packages/db/README.md`.
9. **Verify** — `pnpm demo:reset` → `pnpm demo:verify` → browser screenshots of Floor, Inventory,
   POS → DM. Then commit + push.

## Open

- ~~**RETAIL_MARKUP**~~ — **resolved 2026-08-08: 1.5×**, supplied by Daniel.
- Prices are **CAD**; the app does not currently label a currency. Flagged, not changed.
