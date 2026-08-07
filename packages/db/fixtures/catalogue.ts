/**
 * The retail catalogue — ~40 SKUs with realistic UPC-A barcodes.
 *
 * These stand in for the real UVALUX catalogue, which does not exist in
 * machine-readable form yet (IMPLEMENTATION_SPEC §6.1: no official SKUs). Brand
 * names are plausible-but-invented so nothing here can be mistaken for a real
 * product listing.
 *
 * Two SKUs carry story arcs and must keep their codes:
 *   BSK-10007 Cabana Bronzer — eight days from stockout
 *   BSK-10021 Fiji Blend     — overstocked
 */

/** UPC-A check digit: odd positions ×3, even ×1, then complete to a multiple of 10. */
export function upcCheckDigit(eleven: string): number {
  let sum = 0;
  for (let i = 0; i < 11; i += 1) {
    const digit = Number(eleven[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

/** Full 12-digit UPC-A from an 11-digit body. */
export function upcA(eleven: string): string {
  if (!/^\d{11}$/.test(eleven)) throw new Error(`UPC body must be 11 digits: ${eleven}`);
  return `${eleven}${upcCheckDigit(eleven)}`;
}

export interface CatalogueEntry {
  sku: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  retailPrice: number;
  wholesaleCost: number;
  /** 11-digit UPC body; the check digit is computed. */
  upcBody: string;
  /** Baseline units sold per day at the hero salon. Drives the stock arcs. */
  velocity: number;
}

const BRAND_PREFIX = '0847'; // fictional manufacturer prefix

function body(index: number): string {
  return `${BRAND_PREFIX}${String(index).padStart(7, '0')}`;
}

/**
 * Velocity is the dial that makes low-stock and overstock true rather than
 * asserted: the detectors compute days-of-cover from actual sale rows, so a
 * product only reads as "8 days out" if it genuinely sold that fast.
 */
export const CATALOGUE: CatalogueEntry[] = [
  // --- Bronzers ------------------------------------------------------------
  { sku: 'BSK-10001', name: 'Golden Hour Bronzer', brand: 'Solstice Sun', category: 'bronzer', size: '250 ml', retailPrice: 68, wholesaleCost: 29, upcBody: body(10001), velocity: 0.9 },
  { sku: 'BSK-10002', name: 'Midnight Cocoa Bronzer', brand: 'Solstice Sun', category: 'bronzer', size: '250 ml', retailPrice: 74, wholesaleCost: 32, upcBody: body(10002), velocity: 0.7 },
  { sku: 'BSK-10003', name: 'Copper Reef Tingle', brand: 'Reef & Ray', category: 'bronzer', size: '200 ml', retailPrice: 82, wholesaleCost: 36, upcBody: body(10003), velocity: 0.45 },
  { sku: 'BSK-10004', name: 'Sunstone Shimmer', brand: 'Solstice Sun', category: 'bronzer', size: '250 ml', retailPrice: 64, wholesaleCost: 27, upcBody: body(10004), velocity: 0.6 },
  { sku: 'BSK-10005', name: 'Terra Deep Bronzer', brand: 'Reef & Ray', category: 'bronzer', size: '300 ml', retailPrice: 88, wholesaleCost: 38, upcBody: body(10005), velocity: 0.35 },
  { sku: 'BSK-10006', name: 'Amber Dusk Bronzer', brand: 'Nightfall Co.', category: 'bronzer', size: '250 ml', retailPrice: 71, wholesaleCost: 30, upcBody: body(10006), velocity: 0.5 },
  // The stockout arc. Highest velocity in the catalogue by design.
  { sku: 'BSK-10007', name: 'Cabana Bronzer', brand: 'Cabana Club', category: 'bronzer', size: '250 ml', retailPrice: 76, wholesaleCost: 33, upcBody: body(10007), velocity: 2.4 },
  { sku: 'BSK-10008', name: 'Cabana Bronzer Mini', brand: 'Cabana Club', category: 'bronzer', size: '90 ml', retailPrice: 34, wholesaleCost: 14, upcBody: body(10008), velocity: 0.8 },

  // --- Accelerators --------------------------------------------------------
  { sku: 'BSK-10009', name: 'First Light Accelerator', brand: 'Solstice Sun', category: 'accelerator', size: '250 ml', retailPrice: 48, wholesaleCost: 20, upcBody: body(10009), velocity: 1.1 },
  { sku: 'BSK-10010', name: 'Clear Sky Accelerator', brand: 'Reef & Ray', category: 'accelerator', size: '250 ml', retailPrice: 52, wholesaleCost: 22, upcBody: body(10010), velocity: 0.85 },
  { sku: 'BSK-10011', name: 'Daybreak Primer', brand: 'Cabana Club', category: 'accelerator', size: '200 ml', retailPrice: 44, wholesaleCost: 18, upcBody: body(10011), velocity: 0.7 },
  { sku: 'BSK-10012', name: 'Sunrise Base Coat', brand: 'Nightfall Co.', category: 'accelerator', size: '300 ml', retailPrice: 56, wholesaleCost: 24, upcBody: body(10012), velocity: 0.4 },

  // --- Moisturisers & aftercare -------------------------------------------
  { sku: 'BSK-10013', name: 'Afterglow Body Butter', brand: 'Solstice Sun', category: 'aftercare', size: '400 ml', retailPrice: 42, wholesaleCost: 17, upcBody: body(10013), velocity: 1.3 },
  { sku: 'BSK-10014', name: 'Cool Down Aloe Gel', brand: 'Reef & Ray', category: 'aftercare', size: '350 ml', retailPrice: 32, wholesaleCost: 12, upcBody: body(10014), velocity: 1.0 },
  { sku: 'BSK-10015', name: 'Tan Extender Lotion', brand: 'Cabana Club', category: 'aftercare', size: '300 ml', retailPrice: 46, wholesaleCost: 19, upcBody: body(10015), velocity: 0.95 },
  { sku: 'BSK-10016', name: 'Overnight Repair Balm', brand: 'Nightfall Co.', category: 'aftercare', size: '150 ml', retailPrice: 54, wholesaleCost: 23, upcBody: body(10016), velocity: 0.5 },
  { sku: 'BSK-10017', name: 'Daily Hydration Milk', brand: 'Solstice Sun', category: 'aftercare', size: '500 ml', retailPrice: 38, wholesaleCost: 15, upcBody: body(10017), velocity: 0.8 },

  // --- Spray tan solutions -------------------------------------------------
  { sku: 'BSK-10018', name: 'Coastline Light Solution', brand: 'Reef & Ray', category: 'spray_solution', size: '1 L', retailPrice: 96, wholesaleCost: 44, upcBody: body(10018), velocity: 0.35 },
  { sku: 'BSK-10019', name: 'Coastline Medium Solution', brand: 'Reef & Ray', category: 'spray_solution', size: '1 L', retailPrice: 96, wholesaleCost: 44, upcBody: body(10019), velocity: 0.5 },
  { sku: 'BSK-10020', name: 'Coastline Dark Solution', brand: 'Reef & Ray', category: 'spray_solution', size: '1 L', retailPrice: 104, wholesaleCost: 48, upcBody: body(10020), velocity: 0.42 },
  // The overstock arc. Ordered on a hunch, never moved.
  { sku: 'BSK-10021', name: 'Fiji Blend Solution', brand: 'Cabana Club', category: 'spray_solution', size: '1 L', retailPrice: 112, wholesaleCost: 52, upcBody: body(10021), velocity: 0.02 },
  { sku: 'BSK-10022', name: 'Barrier Cream', brand: 'Reef & Ray', category: 'accessory', size: '200 ml', retailPrice: 24, wholesaleCost: 9, upcBody: body(10022), velocity: 0.6 },
  { sku: 'BSK-10023', name: 'pH Balancing Prep Spray', brand: 'Cabana Club', category: 'accessory', size: '250 ml', retailPrice: 34, wholesaleCost: 14, upcBody: body(10023), velocity: 0.3 },

  // --- Face ----------------------------------------------------------------
  { sku: 'BSK-10024', name: 'Facial Tanning Serum', brand: 'Nightfall Co.', category: 'face', size: '75 ml', retailPrice: 62, wholesaleCost: 26, upcBody: body(10024), velocity: 0.55 },
  { sku: 'BSK-10025', name: 'Lip Shield SPF 30', brand: 'Solstice Sun', category: 'face', size: '8 g', retailPrice: 14, wholesaleCost: 4, upcBody: body(10025), velocity: 1.4 },
  { sku: 'BSK-10026', name: 'Brightening Eye Cream', brand: 'Nightfall Co.', category: 'face', size: '30 ml', retailPrice: 58, wholesaleCost: 25, upcBody: body(10026), velocity: 0.3 },
  { sku: 'BSK-10027', name: 'Gentle Face Cleanser', brand: 'Solstice Sun', category: 'face', size: '200 ml', retailPrice: 36, wholesaleCost: 15, upcBody: body(10027), velocity: 0.45 },

  // --- Red light / wellness ------------------------------------------------
  { sku: 'BSK-10028', name: 'Collagen Boost Cream', brand: 'Nightfall Co.', category: 'wellness', size: '200 ml', retailPrice: 78, wholesaleCost: 34, upcBody: body(10028), velocity: 0.4 },
  { sku: 'BSK-10029', name: 'Recovery Muscle Rub', brand: 'Reef & Ray', category: 'wellness', size: '150 ml', retailPrice: 44, wholesaleCost: 18, upcBody: body(10029), velocity: 0.35 },
  { sku: 'BSK-10030', name: 'Hydration Electrolyte Sachets', brand: 'Cabana Club', category: 'wellness', size: '20 pack', retailPrice: 28, wholesaleCost: 11, upcBody: body(10030), velocity: 0.6 },

  // --- Accessories ---------------------------------------------------------
  { sku: 'BSK-10031', name: 'Wink-Ease Eyewear', brand: 'Solstice Sun', category: 'accessory', size: '10 pair', retailPrice: 12, wholesaleCost: 3, upcBody: body(10031), velocity: 1.8 },
  { sku: 'BSK-10032', name: 'Reusable Goggles', brand: 'Solstice Sun', category: 'accessory', size: '1 pair', retailPrice: 18, wholesaleCost: 6, upcBody: body(10032), velocity: 0.5 },
  { sku: 'BSK-10033', name: 'Sticky Feet Pads', brand: 'Reef & Ray', category: 'accessory', size: '30 pair', retailPrice: 16, wholesaleCost: 5, upcBody: body(10033), velocity: 0.7 },
  { sku: 'BSK-10034', name: 'Hair Cap 20-pack', brand: 'Reef & Ray', category: 'accessory', size: '20 pack', retailPrice: 14, wholesaleCost: 4, upcBody: body(10034), velocity: 0.65 },
  { sku: 'BSK-10035', name: 'Exfoliating Mitt', brand: 'Cabana Club', category: 'accessory', size: '1 unit', retailPrice: 15, wholesaleCost: 5, upcBody: body(10035), velocity: 0.75 },
  { sku: 'BSK-10036', name: 'Bask Tote Bag', brand: 'Cabana Club', category: 'accessory', size: '1 unit', retailPrice: 22, wholesaleCost: 8, upcBody: body(10036), velocity: 0.2 },

  // --- Starter kits --------------------------------------------------------
  { sku: 'BSK-10037', name: 'First Timer Starter Kit', brand: 'Solstice Sun', category: 'kit', size: '3 piece', retailPrice: 89, wholesaleCost: 38, upcBody: body(10037), velocity: 0.4 },
  { sku: 'BSK-10038', name: 'Spray Tan Care Kit', brand: 'Reef & Ray', category: 'kit', size: '3 piece', retailPrice: 79, wholesaleCost: 34, upcBody: body(10038), velocity: 0.3 },
  { sku: 'BSK-10039', name: 'Glow Maintenance Kit', brand: 'Cabana Club', category: 'kit', size: '4 piece', retailPrice: 119, wholesaleCost: 52, upcBody: body(10039), velocity: 0.25 },
  { sku: 'BSK-10040', name: 'Travel Size Trio', brand: 'Nightfall Co.', category: 'kit', size: '3 × 90 ml', retailPrice: 54, wholesaleCost: 22, upcBody: body(10040), velocity: 0.35 },
];

export function catalogueBySku(sku: string): CatalogueEntry {
  const entry = CATALOGUE.find((c) => c.sku === sku);
  if (!entry) throw new Error(`Unknown SKU in fixtures: ${sku}`);
  return entry;
}

/**
 * Products a front-desk staffer would actually upsell at checkout.
 *
 * `spray_solution` is deliberately excluded: the 1 L booth bottles are consumed
 * in-session, not sold over the counter. That exclusion is what makes the Fiji
 * Blend overstock arc read correctly — it has neither retail sales nor booth
 * consumption, which is exactly what dead stock looks like.
 */
export const ATTACHMENT_CANDIDATES = CATALOGUE.filter((c) =>
  ['bronzer', 'accelerator', 'aftercare', 'face', 'accessory', 'wellness', 'kit'].includes(
    c.category,
  ),
);
