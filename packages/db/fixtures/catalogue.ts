/**
 * The retail catalogue — 40 REAL UVALUX products.
 *
 * SOURCE OF RECORD: `packages/db/fixtures/uvalux-catalogue.json`, pulled from the uvalux.com
 * WooCommerce Store API (`https://uvalux.com/wp-json/wc/store/v1/products`) on 2026-08-08.
 * `name`, `brand`, `officialSku`, `size`, `description` and the image are that pull verbatim —
 * never hand-edit them, and never invent a product that is not in the JSON.
 *
 * PRICES ARE CAD. uvalux.com publishes exactly ONE price per product: the salon-facing
 * WHOLESALE price. There is no MSRP anywhere on the site. So `wholesaleCost` is that number
 * verbatim and `retailPrice` is DERIVED — see RETAIL_MARKUP below.
 *
 * `upcBody` is SYNTHETIC. uvalux.com does not publish manufacturer UPC/EAN codes, so the 11-digit
 * body is still generated from a fictional prefix. The barcode *shape* is real (valid UPC-A check
 * digit, scannable); the number itself belongs to no manufacturer.
 *
 * `velocity` is ours — the demo dial that makes the stock arcs true rather than asserted.
 *
 * Two SKUs carry story arcs and must keep their codes:
 *   BSK-10007 Hempz Botanical Sunshine Revitalizing Bronzer — eight days from stockout
 *   BSK-10021 Norvell Premium Solution Double Dark          — overstocked
 */

/**
 * RETAIL IS DERIVED, NOT SCRAPED.
 *
 * uvalux.com publishes only the wholesale price a salon pays (CAD). What the salon charges its own
 * customers appears nowhere on the site. 1.5 is the real salon-retail multiplier Daniel supplied
 * (confirmed 2026-08-08) — so the number is authoritative, but every `retailPrice` in the app,
 * the fixtures and the insight arithmetic is computed from this one constant rather than taken
 * from UVALUX. Changing it here changes retail everywhere; nothing else needs editing.
 */
export const RETAIL_MARKUP = 1.5;

/** Retail = wholesale × markup, rounded to whole dollars (salons do not price in cents). */
export function retailFromWholesale(wholesaleCost: number): number {
  return Math.round(wholesaleCost * RETAIL_MARKUP);
}

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
  /** Internal Bask SKU, `BSK-#####`. The scanner regex and the mint routine both assume this space. */
  sku: string;
  /** The real UVALUX order code, verbatim from the pull. Goes to `UvaluxCatalogItem.officialSku`. */
  officialSku: string;
  name: string;
  brand: string;
  category: string;
  /** Pack size as uvalux.com states it (imperial — "13.5oz", "1L", "25"). Null when not listed. */
  size: string | null;
  /** DERIVED: wholesaleCost × RETAIL_MARKUP. Not a UVALUX number. */
  retailPrice: number;
  /** The one price uvalux.com publishes, in CAD. Verbatim. */
  wholesaleCost: number;
  /** 11-digit UPC body; the check digit is computed. SYNTHETIC — see the file header. */
  upcBody: string;
  /** Baseline units sold per day at the hero salon. Drives the stock arcs. */
  velocity: number;
  /** Product copy from uvalux.com, HTML stripped and trimmed. */
  description: string;
  /** Repo-local image path — the pitch must not depend on uvalux.com being reachable. */
  imageUrl: string;
  /** Where the image was downloaded from, for provenance. Never fetched at runtime. */
  sourceImageUrl: string;
  /** The uvalux.com product page. Provenance only. */
  sourceUrl: string;
}

const BRAND_PREFIX = '0847'; // fictional manufacturer prefix — see the header note on upcBody

function body(sku: string): string {
  return `${BRAND_PREFIX}${sku.replace('BSK-', '').padStart(7, '0')}`;
}

type CatalogueSource = Omit<CatalogueEntry, 'retailPrice' | 'upcBody' | 'imageUrl'>;

/**
 * Velocity is the dial that makes low-stock and overstock true rather than
 * asserted: the detectors compute days-of-cover from actual sale rows, so a
 * product only reads as "8 days out" if it genuinely sold that fast.
 */
const SOURCE: CatalogueSource[] = [
  // --- Bronzers --------------------------------------------------------------
  {
    sku: 'BSK-10001',
    officialSku: 'AGLEGACY',
    name: 'Golden Legacy',
    brand: 'Australian Gold',
    category: 'bronzer',
    size: '6oz',
    wholesaleCost: 32.5,
    velocity: 0.9,
    description:
      'DHA Leg Bronzer Golden Legacy™’s Leg-endary DHA Bronzer Blend will instantly revamp your glow and gradually enhance your colour for a classic golden complexion. Experience radiant, moisturized skin with the Gilded Skincare Technology. The Shave Minimizers will treat your legs to a smooth tanning base and reduce…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/AGLEGACY.jpg',
    sourceUrl: 'https://uvalux.com/shop/australian-gold/premium-collection/golden-legacy-6oz/',
  },
  {
    sku: 'BSK-10002',
    officialSku: 'DS-GOLD',
    name: '14 Karat Gold Rush',
    brand: 'Designer Skin',
    category: 'bronzer',
    size: '13.5oz',
    wholesaleCost: 64.5,
    velocity: 0.7,
    description:
      'Think your bronze has gone all the way? Think again! Go beyond bronze and strike gold with Designer Skin’s scientifically designed Defiance™ Tanning Complex. This exclusive complex will help break through your tanning plateau to take colour to the next level of darkness, while Ultra-Refined Gold helps provide a…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/DS-GOLD.jpg',
    sourceUrl:
      'https://uvalux.com/shop/designer-skin/miracle-collection/ds-14-karat-gold-rush-13-5oz/',
  },
  {
    sku: 'BSK-10003',
    officialSku: 'DC-DCBARB',
    name: 'Bel-Air Bronzed',
    brand: 'Devoted Creations',
    category: 'bronzer',
    size: '12.25oz',
    wholesaleCost: 50,
    velocity: 0.45,
    description:
      'Step into your spotlight with Bel-Air Bronzed™ - your VIP pass to glossed, glowy, paparazzi-proof perfection! This DHA-free bronzing blend delivers rich, radiant color without any streaking or staining, making every session a filter-free, flawless moment. Infused with our signature Glow Glaze Skin Smoothie,…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/DC-DCBARB.jpg',
    sourceUrl: 'https://uvalux.com/shop/tanning/bel-air-bronzed-12-25oz/',
  },
  {
    sku: 'BSK-10004',
    officialSku: 'JWFIT',
    name: 'Fitspiration',
    brand: 'JWOWW',
    category: 'bronzer',
    size: '13.5oz',
    wholesaleCost: 57,
    velocity: 0.6,
    description:
      'Go ahead, don’t be afraid to show it off and be a true Fitspiration™ for all! This Ultimate Natural Bronzer provides intense immediate results that are free of any maintenance! The Fitness Complex ensures your skin is prepped and ready for each session while the Protein Power softens and smooths for an alluring…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/JWFIT.jpg',
    sourceUrl: 'https://uvalux.com/shop/jwoww/jenni-farley-collection/jw-fitspiration-13-5oz/',
  },
  {
    sku: 'BSK-10005',
    officialSku: 'EH-BALIB',
    name: 'Bali Beach',
    brand: 'Ed Hardy',
    category: 'bronzer',
    size: '11oz',
    wholesaleCost: 35.5,
    velocity: 0.35,
    description:
      'Coconut Infused Black Bronzer Bali Beach™ is your tropical 10-minute vacation to paradise! Lay back, relax and daydream of beach tides and good vibes! This fruit and nut enhanced, double dark stimulating bronzer will give you straight from the island colour after every session. If you have sunshine on the mind then…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/EH-BALIB.jpg',
    sourceUrl: 'https://uvalux.com/shop/tanning/bali-beach-11oz/',
  },
  {
    sku: 'BSK-10006',
    officialSku: 'SBPPBRONZER',
    name: 'Pollution Protection DHA Bronzer',
    brand: 'Swedish Beauty',
    category: 'bronzer',
    size: '8.5oz',
    wholesaleCost: 33,
    velocity: 0.5,
    description:
      'Every day we expose ourselves to dirt, dust and smog in the air, clogging pores and making skin appear dull and lifeless. Because of this, protecting skin from these urban pollutants is more important than ever! Fight back with this Pollution Protection™ Collection, featuring ingredients to help your skin stay…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/SBPPBRONZER.jpg',
    sourceUrl:
      'https://uvalux.com/shop/swedish-beauty/pollution-protection-collection/pollution-protection-dha-bronzer-8-5oz/',
  },
  // The stockout arc. Highest velocity in the catalogue by design.
  {
    sku: 'BSK-10007',
    officialSku: 'SP-HBSR',
    name: 'Botanical Sunshine Revitalizing Bronzer',
    brand: 'Hempz',
    category: 'bronzer',
    size: '9oz',
    wholesaleCost: 35,
    velocity: 2.4,
    description:
      'Formulated with Vegan DHA Botanical benefits with an incredible bronzed glow are achievable with Hempz® Botanical Sunshine Revitalizing Bronzing Blend. This unique formula has skin firming Caffeine and antioxidant-rich Green Tea, plus a Botanical Oil Blend of 100% Pure Natural Hemp Seed Oil, Jojoba Oil, and Coconut…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/SP-HBSR.jpg',
    sourceUrl: 'https://uvalux.com/shop/tanning/hempz-botanical-sunshine-revitalizing-bronzer-9oz/',
  },
  {
    sku: 'BSK-10008',
    officialSku: 'CT-CLNATURAL',
    name: 'Canopy Lane Step 2 Natural Bronzer',
    brand: 'California Tan',
    category: 'bronzer',
    size: '8.5oz',
    wholesaleCost: 36.5,
    velocity: 0.8,
    description:
      'Step 2 Natural Bronzer The canopy in the rainforest shields and protects the understory from external aggressors while retaining moisture. We took the same benefits from that environment and applied to it California Tan’s newest line, Canopy Lane™. New technologies take over to reset your skin and deliver rich…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/CT-CLNATURAL.jpg',
    sourceUrl:
      'https://uvalux.com/shop/california-tan/canopy-lane-collection/canopy-lane-step-2-natural-bronzer-8-5oz/',
  },

  // --- Accelerators / intensifiers -------------------------------------------
  {
    sku: 'BSK-10009',
    officialSku: 'SP-HBSD',
    name: 'Botanical Sunshine Dual Action Intensifier',
    brand: 'Hempz',
    category: 'accelerator',
    size: '9oz',
    wholesaleCost: 37.5,
    velocity: 1.1,
    description:
      'For UV Tanning & Red Light Therapy Maximize your Sunshine & Skin Care routine with Hempz® Botanical Sunshine Dual Action Intensifier. This unique formula has skin firming Caffeine and antioxidant-rich Green Tea, plus a Botanical Oil Blend of 100% Pure Natural Hemp Seed Oil, Jojoba Oil, and Coconut Oil to hydrate…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/SP-HBSD.jpg',
    sourceUrl:
      'https://uvalux.com/shop/tanning/hempz-botanical-sunshine-dual-action-intensifier-9oz/',
  },
  {
    sku: 'BSK-10010',
    officialSku: 'SBVINTENSE',
    name: 'Vital Intensifier',
    brand: 'Swedish Beauty',
    category: 'accelerator',
    size: '10oz',
    wholesaleCost: 39,
    velocity: 0.85,
    description:
      'Go with the flow with Vital™ Hydrating Intensifier! Dive into the Deep Sea Colour Complex to boost melanin and collagen synthesis, helping to build and maintain colour results. Invigorating Marine Algae helps even skin tone while protecting from environmental damage. Submerge your skin in the Tidal Wave Hydration…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/SBVINTENSE.jpg',
    sourceUrl: 'https://uvalux.com/shop/swedish-beauty/vital-collection/vital-intensifier-10oz/',
  },
  {
    sku: 'BSK-10011',
    officialSku: 'CT-CINTENSE',
    name: 'Coast Step 1 Intensifier',
    brand: 'California Tan',
    category: 'accelerator',
    size: '8oz',
    wholesaleCost: 45,
    velocity: 0.7,
    description:
      'There is more to California than beaches and big cities. Take a journey to the coastal mountains and forests to discover pure colour potential. Coast® utilizes nature’s own skincare ingredients to produce an undeniable, intense dark tan.',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/CT-CINTENSE.jpg',
    sourceUrl:
      'https://uvalux.com/shop/california-tan/coast-collection/ct-coast-intensifier-step-1-8oz/',
  },
  {
    sku: 'BSK-10012',
    officialSku: 'SP-SLAY',
    name: 'Slay All Day Hybrid Action Intensifier',
    brand: 'Supre Tan',
    category: 'accelerator',
    size: '10.1oz',
    wholesaleCost: 44,
    velocity: 0.4,
    description:
      'For UV Tanning & Redlight Therapy This formula will slay your skincare game with antioxidant rich Citrus Extracts, Rosewater and Eucalyptus that support hydrated and glowing tanning results. Our dynamic Red Light Therapy Complex features Copper Peptides, Rose Quartz Extract, Niacinamide and more that aid in…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/SP-SLAY.jpg',
    sourceUrl:
      'https://uvalux.com/shop/supre-tan/boss-lady-collection/slay-all-day-hybrid-action-intensifier-10-1oz/',
  },

  // --- Moisturisers & aftercare ----------------------------------------------
  {
    sku: 'BSK-10013',
    officialSku: 'AGHNVBPM',
    name: 'Hemp Nation Vanilla Bean & Pistachio Tan Extender',
    brand: 'Australian Gold',
    category: 'aftercare',
    size: '18oz',
    wholesaleCost: 24,
    velocity: 1.3,
    description:
      'Summer never has to end with Vanilla Bean & Pistachio! This fun-filled blend softens your skin with vitamins, mineral sand antioxidants with an energizing, sunshine scent. DermaDark® provides streak-free colour that continues to build with daily use while Skin Clarity gives a soft smooth finish to the skin. Let the…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/AGHNVBPM.jpg',
    sourceUrl:
      'https://uvalux.com/shop/australian-gold/hemp-nation-collection/hemp-nation-vanilla-bean-pistachio-tan-extender-18oz/',
  },
  {
    sku: 'BSK-10014',
    officialSku: 'DC-DCCLKAR',
    name: 'Cloud Kissed After Sun Refresher',
    brand: 'Devoted Creations',
    category: 'aftercare',
    size: '6.7oz',
    wholesaleCost: 15,
    velocity: 1,
    description:
      'After Sun Refreshing Spray Infused with Ceramides Float into weightless hydration with Devoted Creations Cloud Kissed™ After Sun Refresher! This dreamy, creamy cushion essence wraps your skin in velvety Vanilla, soothing Ceramides, and marshmallow extracts for an irresistibly soft, dewy glow. Like a kiss from the…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/DC-DCCLKAR.jpg',
    sourceUrl:
      'https://uvalux.com/shop/devoted-creations/face-bodycare-collection/cloud-kissed-after-sun-refresher-6-7oz/',
  },
  {
    sku: 'BSK-10015',
    officialSku: 'CT-CMOIST',
    name: 'Coast Step 3 Tan Extender',
    brand: 'California Tan',
    category: 'aftercare',
    size: '16oz',
    wholesaleCost: 34,
    velocity: 0.95,
    description:
      'There is more to California than beaches and big cities. Take a journey to the coastal mountains and forests to discover pure colour potential. Coast® utilizes nature’s own skincare ingredients to produce an undeniable, intense dark tan.',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/CT-CMOIST.jpg',
    sourceUrl:
      'https://uvalux.com/shop/california-tan/coast-collection/coast-step-3-tan-extender-16oz/',
  },
  {
    sku: 'BSK-10016',
    officialSku: 'DS-AWEM',
    name: 'Awestruck Tan Extender',
    brand: 'Designer Skin',
    category: 'aftercare',
    size: '16oz',
    wholesaleCost: 42.5,
    velocity: 0.5,
    description:
      'In a world of ordinary, be a wonder! Awaken your senses and experience the superior hydration in this Enhanced Tan Extender for prolonged, gorgeous colour. Encounter super strength with the Invisible Barrier Technology and Remarkable Moisture Blend to protect skin while leaving a perfected look. The time has come…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/DS-AWEM.jpg',
    sourceUrl: 'https://uvalux.com/shop/designer-skin/x-collection/awestruck-tan-extender-16oz/',
  },
  {
    sku: 'BSK-10017',
    officialSku: 'SP-HRMM',
    name: 'Rosemary & Mint Herbal Body Moisturizer',
    brand: 'Hempz',
    category: 'aftercare',
    size: '17oz',
    wholesaleCost: 27,
    velocity: 0.8,
    description:
      'Leave skin feeling reinvigorated and hydrated with Hempz NEW Rosemary & Mint moisturizing lotion. Enriched with 100% pure hemp seed oil and rosemary & mint extracts.',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/SP-HRMM.jpg',
    sourceUrl:
      'https://uvalux.com/shop/hempz/hempz-body-care-collection/hempz-rosemary-mint-herbal-body-moisturizer-17oz/',
  },

  // --- Spray tan solutions ---------------------------------------------------
  {
    sku: 'BSK-10018',
    officialSku: 'ST-ASLIGHT-16',
    name: 'Advanced Tan Solution - Light',
    brand: 'Sunna',
    category: 'spray_solution',
    size: '16oz',
    wholesaleCost: 43,
    velocity: 0.35,
    description:
      "Sunna's Signature 12 hour solution. Formulated to be super hydrating, blendable and forgiving! Scented with Vanilla Fruit Water. It looks great on every skin tone and type. Crafted with a blend of skin loving ingredients, ensuring a lighter and more effortless application. This solution is a dummy proof option for…",
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/ST-ASLIGHT-16.jpg',
    sourceUrl:
      'https://uvalux.com/shop/sunna/sunless-professional-sunnatan/advanced-tan-solution-light-16oz/',
  },
  {
    sku: 'BSK-10019',
    officialSku: 'ST-ASMED-16',
    name: 'Advanced Tan Solution - Medium',
    brand: 'Sunna',
    category: 'spray_solution',
    size: '16oz',
    wholesaleCost: 46,
    velocity: 0.5,
    description:
      "Sunna's Signature 12 hour solution. Formulated to be super hydrating, blendable and forgiving! Scented with Vanilla Fruit Water. It looks great on every skin tone and type. Crafted with a blend of skin loving ingredients, ensuring a lighter and more effortless application. This solution is a dummy proof option for…",
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/ST-ASMED-16.jpg',
    sourceUrl:
      'https://uvalux.com/shop/sunna/sunless-professional-sunnatan/advanced-tan-solution-medium-16oz/',
  },
  {
    sku: 'BSK-10020',
    officialSku: 'ST-AERDRK-16',
    name: 'Express Tan Solution - Dark',
    brand: 'Sunna',
    category: 'spray_solution',
    size: '16oz',
    wholesaleCost: 48,
    velocity: 0.42,
    description:
      "Perfect for all skin tones! Just like Sunna's signature solution but now you can shower in 3-4 hours after application. Sunna's express solution is carefully curated blend of skinloving ingredients, combined with a lightweight formula, effortlessly glides onto your skin, ensuring a seamless application. As the…",
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/ST-AERDRK-16.jpg',
    sourceUrl:
      'https://uvalux.com/shop/sunna/sunless-professional-sunnatan/express-tan-solution-dark-16oz/',
  },
  // The overstock arc. Ordered on a hunch, never moved.
  {
    sku: 'BSK-10021',
    officialSku: 'NV-99145S',
    name: 'Premium Solution Double Dark',
    brand: 'Norvell',
    category: 'spray_solution',
    size: '8oz',
    wholesaleCost: 45,
    velocity: 0.02,
    description:
      'Norvell’s Award Winning Handheld Spray Tan Solution! Double Dark is designed with warm brown undertones to give a natural tan. Double Dark contains an unique, proprietary mix of bronzers and utilizes micro-nutrient technology to deliver a spray tan filled with a potent blend of vitamins and antioxidants for a…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/NV-99145S-.jpg',
    sourceUrl:
      'https://uvalux.com/shop/norvell/sunless-professional-norvell/nv-premium-sunless-solution-dbl-drk-sample-8oz-hssdd008/',
  },

  // --- Accessories -----------------------------------------------------------
  {
    sku: 'BSK-10022',
    officialSku: 'CRC-BARRIER',
    name: 'CRC Barrier & Blending Cream',
    brand: 'California Tan',
    category: 'accessory',
    size: '1L',
    wholesaleCost: 25,
    velocity: 0.6,
    description:
      'Experience The Sexy Side of Sunless® like with the Color Rich Collection. Develop flawless colour with high-end ingredients for a gorgeous tan and flawless skin!',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/CRC-BARRIER.jpg',
    sourceUrl:
      'https://uvalux.com/shop/california-tan/california-tan-sunless/sunless-professional/crc-barrier-blending-cream-1l/',
  },
  {
    sku: 'BSK-10023',
    officialSku: 'ST-SM-L',
    name: 'Set Me Prep Spray',
    brand: 'Sunna',
    category: 'accessory',
    size: '32oz',
    wholesaleCost: 55,
    velocity: 0.3,
    description:
      'Prep Spray - Set Me! The Set Me spray is specially designed to prep your clients’ skin before tanning. It helps to balance the skin, remove oils, and create a pH-balancing environment for smooth tan application and development. The toner is also great at removing sweat, oils, and makeup, making it perfect for every…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/ST-SM-L.jpg',
    sourceUrl:
      'https://uvalux.com/shop/sunna/sunless-professional-sunnatan/set-me-prep-spray-32oz/',
  },

  // --- Face ------------------------------------------------------------------
  {
    sku: 'BSK-10024',
    officialSku: 'CT-TEKTONF',
    name: 'Tekton Face',
    brand: 'California Tan',
    category: 'face',
    size: '1oz',
    wholesaleCost: 36.5,
    velocity: 0.55,
    description:
      'Uncover the secret to building beautiful, bronze colour from the inside out. Developed with dynamic skin care and tanning technologies, the Tektōn® Collection will exceed your expectations.',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/CT-TEKTONF.jpg',
    sourceUrl: 'https://uvalux.com/shop/california-tan/tekton-collection/ct-tekton-face-1oz/',
  },
  {
    sku: 'BSK-10025',
    officialSku: 'SP-HLIPBP',
    name: 'Herbal Lip Balm',
    brand: 'Hempz',
    category: 'face',
    size: '0.44oz',
    wholesaleCost: 9.5,
    velocity: 1.4,
    description:
      'Enriched with 100% Pure Organic Hemp Seed Oil and blended with natural extracts to provide dramatic hydration and nourishment.',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/SP-HLIPBP.jpg',
    sourceUrl: 'https://uvalux.com/shop/hempz/hempz-body-care-collection/hempz-herbal-lip-balm/',
  },
  {
    sku: 'BSK-10026',
    officialSku: 'JWNWFACIAL',
    name: 'Naturally WOWW Facial Moisturizer',
    brand: 'JWOWW',
    category: 'face',
    size: '1.6oz',
    wholesaleCost: 37,
    velocity: 0.3,
    description:
      'Elevate your skincare routine with Naturally WOWW™ Facial Moisturizer—your go-to for an instant dewy glow and a fresh start to the day. This ultra-hydrating, fragrance-free formula delivers long-lasting radiance with a soft, velvety finish. Reveal youthful, plump skin that turns heads and keeps them guessing. It’s…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/JWNWFACIAL.jpg',
    sourceUrl:
      'https://uvalux.com/shop/jwoww/naturally-woww-collection/naturally-woww-facial-moisturizer-1-6oz/',
  },
  {
    sku: 'BSK-10027',
    officialSku: 'AGFACES',
    name: 'Crystal Faces',
    brand: 'Australian Gold',
    category: 'face',
    size: '4.5oz',
    wholesaleCost: 51,
    velocity: 0.45,
    description:
      'They can see it in your face with this top of the line facial tanning lotion! Featuring a unique formula that helps to stimulate collagen production while providing a smooth tanning canvas for even, dark colour. Unique DermaDark® Bronzers allow for a streak-free golden hue, with or without the use of UV. This…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/AGFACES.jpg',
    sourceUrl: 'https://uvalux.com/shop/australian-gold/premium-collection/ag-crystal-faces-4-5oz/',
  },

  // --- Red light / wellness --------------------------------------------------
  {
    sku: 'BSK-10028',
    officialSku: 'DC-COLLICC',
    name: 'Collagenetics Illuminate Cream Concentrate',
    brand: 'Devoted Creations',
    category: 'wellness',
    size: '3oz',
    wholesaleCost: 36,
    velocity: 0.4,
    description:
      'Light your way to younger looking skin. Illuminate, a revolutionary skincare line designed to harness the power of light for a more radiant and youthful complexion. Crafted to complement all light hues, Collagenetics Illuminate’s Cream Concentrate goes beyond traditional skincare. This prestigious formula is power…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/DC-COLLICC.jpg',
    sourceUrl:
      'https://uvalux.com/shop/devoted-creations/collagenetics-collection/collagenetics-illuminate-cream-concentrate-3oz/',
  },
  {
    sku: 'BSK-10029',
    officialSku: 'DC-COLRM',
    name: 'Collagenetics Restorative Moisturizer',
    brand: 'Devoted Creations',
    category: 'wellness',
    size: '18.25oz',
    wholesaleCost: 32.5,
    velocity: 0.35,
    description:
      'Tranquility Boosting Calming & Soothing Restorative Spa Replenishing Hydrator Collagenetics™ Spa is the renewing, repairing, and revitalizing treatment your skin deserves. This Restorative Moisturizer will work to maintain and promote the overall health of your skin. The innovative formula pairs perfectly as a…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/DC-COLRM.jpg',
    sourceUrl:
      'https://uvalux.com/shop/devoted-creations/collagenetics-collection/collagenetics-restorative-moisturizer-18-25oz/',
  },
  {
    sku: 'BSK-10030',
    officialSku: 'FS-RL2IN1',
    name: 'Beauty With Light 2-in-1 Colour Correcting Intensifier + Peptide Collagen Pro',
    brand: 'Fiesta Sun',
    category: 'wellness',
    size: '6oz',
    wholesaleCost: 33,
    velocity: 0.6,
    description:
      '2 in 1 Colour Correcting Intensifier + Peptide Collagen Pro Elevate your tan with this dynamic pH balanced powerhouse combining the benefits of advanced Light Therapy Skincare with cuttingedge tanning technology to deliver unparalleled results. Our formula is infused with CoQ10, Hyaluronate Acid, and a potent blend…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/FS-RL2IN1.jpg',
    sourceUrl:
      'https://uvalux.com/shop/fiesta-sun/beauty-with-light-collection/beauty-with-light-red-light-st-6oz/',
  },

  // --- Accessories -----------------------------------------------------------
  {
    sku: 'BSK-10031',
    officialSku: 'CT-PEEPERS',
    name: 'CT Peepers Eyewear',
    brand: 'California Tan',
    category: 'accessory',
    size: null,
    wholesaleCost: 3,
    velocity: 1.8,
    description:
      'Block the UV not your personality! Peepers are ergonomically designed to protect eyes from ultraviolet light without leaving tan lines.',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/CT-PEEPERS.jpg',
    sourceUrl: 'https://uvalux.com/shop/essentials/eyewear/ct-peepers-eyewear/',
  },
  {
    sku: 'BSK-10032',
    officialSku: 'SS-EYE',
    name: 'Protective Eyewear',
    brand: 'Sunna',
    category: 'accessory',
    size: null,
    wholesaleCost: 20,
    velocity: 0.5,
    description:
      'Additional Protective Eyewear to replace or to add to your existing light set up.',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/SS-EYE.jpg',
    sourceUrl: 'https://uvalux.com/shop/sunna/smile-collection-sunnatan/protective-eyewear/',
  },
  {
    sku: 'BSK-10033',
    officialSku: 'XFEET',
    name: 'Disposable Footwear Sticky',
    brand: 'Uvalux',
    category: 'accessory',
    size: '25',
    wholesaleCost: 55,
    velocity: 0.7,
    description:
      'Add this essential product to your disposable supplies and instantly upgrade your client’s spray tan experience. Pack includes 25 pairs to protect the soles of your client’s feet during tanning treatments. Helps avoid tanning solution from staining the soles of feet and they do not interfere with the spray tan…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/XFEET.jpg',
    sourceUrl: 'https://uvalux.com/shop/essentials/supplies/disposable-stickyflops-25/',
  },
  {
    sku: 'BSK-10034',
    officialSku: 'XCAP',
    name: 'Disposable Hair Cap',
    brand: 'Uvalux',
    category: 'accessory',
    size: '100',
    wholesaleCost: 15,
    velocity: 0.65,
    description:
      'Perfect for spray tanning, these disposable caps keep solution overspray from settling into hair.',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/XCAP.jpg',
    sourceUrl: 'https://uvalux.com/shop/essentials/supplies/hair-cap-100/',
  },
  {
    sku: 'BSK-10035',
    officialSku: 'XMITT',
    name: 'Deep Exfoliating Mitt',
    brand: 'Dermasuri',
    category: 'accessory',
    size: null,
    wholesaleCost: 15,
    velocity: 0.75,
    description:
      'A deep exfoliating mitt to help you achieve healthy, glowing skin that maintains its elasticity, suppleness, and smoothness. Made from a unique fabric texture, the Dermasuri revitalizes your skin by removing dead skin cells and debris off your body, revealing healthy, smooth skin underneath. Unlike other…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/XMITT_.jpg',
    sourceUrl:
      'https://uvalux.com/shop/exfoliating-mitt-collection/dermasuri-deep-exfoliating-mitt-body-scrub/',
  },
  {
    sku: 'BSK-10036',
    officialSku: 'CT-REDLIGHT',
    name: 'CT Red Light Eyewear',
    brand: 'California Tan',
    category: 'accessory',
    size: null,
    wholesaleCost: 7,
    velocity: 0.2,
    description:
      'With beauty light sessions on the rise, California Tan wants to provide users with eyewear to fit the new demand. This eyewear is designed to shield your eyes while in beauty light equipment with a convenient carrying case and customized fit. Comforts eyes from the bright glare of Red Light and other beauty light…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/CT-REDLIGHT.jpg',
    sourceUrl: 'https://uvalux.com/shop/essentials/eyewear/ct-red-light-eyewear/',
  },

  // --- Retail kits & gift sets -----------------------------------------------
  // Consumer-size sets, deliberately NOT the UVALUX bulk intro kits ($320–406 wholesale):
  // a bulk starter kit is what the salon buys from UVALUX, not what a customer buys at the till,
  // and a $600 tile between the $53 lotions read wrong on the POS.
  {
    sku: 'BSK-10037',
    officialSku: 'SP-HBS-GB',
    name: 'Botanical Sunshine Gift Bag',
    brand: 'Hempz',
    category: 'kit',
    size: null,
    wholesaleCost: 59.5,
    velocity: 0.4,
    description:
      'Includes: 1 - Hempz Limited Edition Tropical Sunshine & Mango Moisturizer (17oz) 1 - Hempz Botanical Sunshine Revitalizing Bronzing Blend (9oz) 1 - FREE Bag',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/SP-HBS-GB.jpg',
    sourceUrl: 'https://uvalux.com/shop/tanning/hempz-botanical-sunshine-gift-bag/',
  },
  {
    sku: 'BSK-10038',
    officialSku: 'ST-TRVMD',
    name: 'Jet Set Travel Collection - Medium/Dark',
    brand: 'Sunna',
    category: 'kit',
    size: null,
    wholesaleCost: 25,
    velocity: 0.3,
    description:
      'Includes: Face Tan Water Mini (2.11oz) Colour Me Dark Mousse Mini (1.69oz) Gradual Tan Mini (3oz) Mini Mitt for body or face application',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/ST-TRVLM-CA.png',
    sourceUrl: 'https://uvalux.com/shop/sunna/self-tan-collection-sunnatan/jet-set-travel-collection-medium-dark/',
  },
  {
    sku: 'BSK-10039',
    officialSku: 'KB-BUNDLE',
    name: 'Espresso Yourself Bundle',
    brand: 'Koffee Beauty',
    category: 'kit',
    size: null,
    wholesaleCost: 37,
    velocity: 0.25,
    description:
      'Never run out of scrubs again with this Koffee Beauty Espresso Yourself Bundle, an iconic trio that includes all your favourite fragrances for a full body treat. Get it for yourself or give the gift that keeps on giving with this all-star bundle. Featuring three best selling Coconut, Mint & Vanilla Coffee Scrubs…',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/KB-BUNDLE.jpg',
    sourceUrl: 'https://uvalux.com/shop/beauty/espresso-yourself-bundle/',
  },
  {
    sku: 'BSK-10040',
    officialSku: 'XPACKP',
    name: 'White 2 Bronze Watermelon Bag Deal',
    brand: 'Devoted Creations',
    category: 'kit',
    size: null,
    wholesaleCost: 49.5,
    velocity: 0.35,
    description:
      'Includes: 1 - White 2 Bronze Watermelon Gelee (8.5oz) 1 - Coco Creamsicle Moisturizer (18.25oz) 1 - FREE Drawstring Gift Bag',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/XPACKP_.jpg',
    sourceUrl: 'https://uvalux.com/shop/devoted-creations/soho-collection/white-to-bronze-watermelon-bag-deal/',
  },
];

export const CATALOGUE: CatalogueEntry[] = SOURCE.map((c) => ({
  ...c,
  upcBody: body(c.sku),
  retailPrice: retailFromWholesale(c.wholesaleCost),
  imageUrl: `/catalogue/${c.sku}.jpg`,
}));

export function catalogueBySku(sku: string): CatalogueEntry {
  const entry = CATALOGUE.find((c) => c.sku === sku);
  if (!entry) throw new Error(`Unknown SKU in fixtures: ${sku}`);
  return entry;
}

/**
 * Products a front-desk staffer would actually upsell at checkout.
 *
 * `spray_solution` is deliberately excluded: the booth bottles are consumed
 * in-session, not sold over the counter. That exclusion is what makes the
 * Norvell Double Dark overstock arc read correctly — it has neither retail
 * sales nor booth consumption, which is exactly what dead stock looks like.
 */
export const ATTACHMENT_CANDIDATES = CATALOGUE.filter((c) =>
  ['bronzer', 'accelerator', 'aftercare', 'face', 'accessory', 'wellness', 'kit'].includes(
    c.category,
  ),
);
