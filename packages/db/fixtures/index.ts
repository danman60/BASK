/**
 * Fixture generator — PRODUCT_SPEC §20, deterministic from a seed.
 *
 * `generateFixtures(seed)` returns the entire day-zero dataset as plain data.
 * Nothing here touches the database; `scripts/demo-reset.ts` owns insertion.
 * That split is what makes determinism testable: two bundles can be hashed and
 * diffed without a Postgres round-trip.
 *
 * Insertion order (enforced by the seeder, documented here because the FKs
 * make it load-bearing):
 *   room_type · segment · playbook · uvalux_catalog_item   ← lookups first
 *   org · salon · staff
 *   product · barcode                                       ← global catalogue
 *   room · equipment_device · service
 *   customer · membership · package
 *   visit · session · sale · sale_line
 *   inventory_level · stock_event
 *   campaign · gift_card · activity_event
 *   consent_profile · consent_audit_entry · draft_order · draft_order_line
 *   account · signal_snapshot · coaching_request · contact_log
 *   demo_state
 */

import { addDays, diffDays, zonedToUtc, type DateOnly } from '@bask/core';
import { createHash } from 'node:crypto';

import {
  ARCS,
  DAY_ZERO,
  DEFAULT_SEED,
  HERO_SALON,
  HISTORY_DAYS,
  MEMBERSHIP_TIERS,
} from './constants';
import { CATALOGUE, upcA } from './catalogue';
import { id, seq } from './ids';
import { PLAYBOOKS, buildPortfolio } from './portfolio';
import { UVALUX_STAFF } from './people';
import { Rng, money } from './rng';
import {
  HERO_ORG_ID,
  HERO_SALON_ID,
  ROOMS,
  ROOM_TYPES,
  SERVICES,
  SPRAY_SOLUTION_SKUS,
  buildCustomers,
  buildMemberships,
  buildPackages,
  buildStaff,
  generateDayActivity,
  historyDays,
  type ActivityContext,
} from './sunset-ridge';
import type {
  BarcodeRow,
  CampaignRow,
  FixtureBundle,
  InventoryLevelRow,
  ProductRow,
  RoomRow,
  SegmentRow,
  ServiceRow,
  StockEventRow,
} from './types';

const TZ = HERO_SALON.timezone;

/** Fixed coded predicates, not a stored query AST (IMPLEMENTATION_SPEC §2). */
const SEGMENTS: Array<Omit<SegmentRow, 'createdAt'>> = [
  { key: 'new_this_month', label: 'New this month', description: 'Joined in the last 30 days.', sortOrder: 1, isActive: true },
  { key: 'expiring_packages', label: 'Packages running out', description: 'Two or fewer sessions left, or expiring within 30 days.', sortOrder: 2, isActive: true },
  { key: 'at_risk', label: 'At risk', description: 'Used to come weekly, has not been in for three weeks.', sortOrder: 3, isActive: true },
  { key: 'big_spenders', label: 'Best customers', description: 'Top 10% by spend over the last 90 days.', sortOrder: 4, isActive: true },
  { key: 'lapsed_30d', label: 'Lapsed 30 days', description: 'No visit in the last 30 days.', sortOrder: 5, isActive: true },
  { key: 'midweek_regulars', label: 'Midweek regulars', description: 'Usually comes in Tuesday to Thursday.', sortOrder: 6, isActive: true },
];

export interface GenerateOptions {
  seed?: string;
  /** Override day zero. The dataset shifts wholesale; arcs stay intact. */
  dayZero?: DateOnly;
}

export function generateFixtures(options: GenerateOptions = {}): FixtureBundle {
  const seed = options.seed ?? DEFAULT_SEED;
  const dayZero = options.dayZero ?? DAY_ZERO;
  const rng = new Rng(seed);

  // A single fixed "created" instant. Using the real clock here is the classic
  // way a deterministic generator stops being deterministic.
  const createdAt = zonedToUtc(addDays(dayZero, -HISTORY_DAYS - 1), 8, 0, TZ);

  // --- lookup tables -------------------------------------------------------
  const roomTypes = ROOM_TYPES.map((t) => ({ ...t, isActive: true, createdAt }));
  const segments = SEGMENTS.map((s) => ({ ...s, createdAt }));
  const playbooks = PLAYBOOKS.map((p) => ({ ...p, createdAt, updatedAt: createdAt }));

  const uvaluxCatalogItems = CATALOGUE.map((c) => ({
    id: id('catalog-item', c.sku),
    officialSku: null, // no official SKUs exist yet (IMPLEMENTATION_SPEC §6.1)
    name: c.name,
    brand: c.brand,
    category: c.category,
    size: c.size,
    upc: upcA(c.upcBody),
    wholesalePrice: c.wholesaleCost,
    msrp: c.retailPrice,
    isActive: true,
    createdAt,
    updatedAt: createdAt,
  }));

  // --- global catalogue ----------------------------------------------------
  const products: ProductRow[] = CATALOGUE.map((c) => ({
    id: id('product', c.sku),
    salonId: null, // null = catalogue-wide (schema convention)
    sku: c.sku,
    name: c.name,
    brand: c.brand,
    category: c.category,
    size: c.size,
    retailPrice: c.retailPrice,
    wholesaleCost: c.wholesaleCost,
    uvaluxCatalogItemId: id('catalog-item', c.sku),
    isActive: true,
    createdAt,
    updatedAt: createdAt,
  }));

  // Manufacturer UPC plus a self-printed Code128 for a handful — the
  // many-codes-to-one-product case the scanner has to handle (§6.1).
  const barcodes: BarcodeRow[] = [];
  for (const [index, c] of CATALOGUE.entries()) {
    barcodes.push({
      id: id('barcode', `${c.sku}:upc`),
      salonId: null,
      productId: id('product', c.sku),
      value: upcA(c.upcBody),
      symbology: 'upc_a',
      source: 'catalog',
      isPrimary: true,
      createdAt,
    });
    if (index % 7 === 0) {
      barcodes.push({
        id: id('barcode', `${c.sku}:code128`),
        salonId: HERO_SALON_ID,
        productId: id('product', c.sku),
        value: `BSKLBL${c.sku.replace('BSK-', '')}`,
        symbology: 'code_128',
        source: 'printed_label',
        isPrimary: false,
        createdAt,
      });
    }
  }

  // --- tenancy -------------------------------------------------------------
  const heroOpenedAt = zonedToUtc(addDays(dayZero, -6 * 365), 9, 0, TZ);
  const orgs = [
    { id: HERO_ORG_ID, name: 'Sunset Ridge Holdings', slug: HERO_SALON.slug, createdAt, updatedAt: createdAt },
  ];
  const salons = [
    {
      id: HERO_SALON_ID,
      orgId: HERO_ORG_ID,
      name: HERO_SALON.name,
      slug: HERO_SALON.slug,
      status: 'active' as const,
      addressLine1: '1120 Bernard Ave',
      city: HERO_SALON.city,
      region: HERO_SALON.region,
      country: HERO_SALON.country,
      postalCode: HERO_SALON.postalCode,
      phone: HERO_SALON.phone,
      email: HERO_SALON.email,
      timezone: HERO_SALON.timezone,
      theme: 'sunset',
      openedAt: heroOpenedAt,
      createdAt: heroOpenedAt,
      updatedAt: createdAt,
    },
  ];

  const { rows: heroStaff, byKey: staffByKey } = buildStaff(rng);
  const uvaluxStaff = UVALUX_STAFF.map((s) => ({
    id: id('staff', s.key),
    salonId: null, // null = UVALUX-side (schema convention)
    firstName: s.firstName,
    lastName: s.lastName,
    email: `${s.key.replace(/^(rep|leadership)-/, '')}@uvalux.example`,
    phone: null,
    role: s.role,
    permissions: {},
    shiftPattern: {},
    isActive: true,
    hiredAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  }));
  const staff = [...heroStaff, ...uvaluxStaff];
  const repIdByKey = new Map(UVALUX_STAFF.map((s) => [s.key, id('staff', s.key)]));

  // --- hero rooms + services ----------------------------------------------
  const rooms: RoomRow[] = ROOMS.map((r, index) => {
    const type = ROOM_TYPES.find((t) => t.key === r.type)!;
    return {
      id: id('room', r.key),
      salonId: HERO_SALON_ID,
      roomTypeKey: r.type,
      name: r.name,
      // The Wave Room is down for service — the mockup's maintenance chip.
      state: r.key === 'wave' ? ('maintenance' as const) : ('ready' as const),
      maintenanceNote: r.key === 'wave' ? 'Pump seal on order, back Friday' : null,
      cleaningMinutes: type.cleaningMinutes,
      sortOrder: index + 1,
      isActive: true,
      createdAt: heroOpenedAt,
      updatedAt: createdAt,
    };
  });

  const equipmentDevices = rooms.map((room, index) => ({
    id: id('equipment', room.name),
    salonId: HERO_SALON_ID,
    roomId: room.id,
    driverType: 'simulated' as const,
    address: `sim://bus0/unit${index + 1}`,
    config: { model: 'simulated-v1' },
    status: 'idle',
    lastSeenAt: zonedToUtc(dayZero, 8, 45, TZ),
    createdAt: heroOpenedAt,
    updatedAt: createdAt,
  }));

  const services: ServiceRow[] = SERVICES.map((s) => ({
    id: id('service', s.key),
    salonId: HERO_SALON_ID,
    name: s.name,
    category: s.category,
    roomTypeKey: s.roomTypeKey,
    durationMinutes: s.minutes,
    price: s.price,
    isActive: true,
    createdAt: heroOpenedAt,
    updatedAt: createdAt,
  }));

  // --- customers, memberships, packages ------------------------------------
  const customerSeeds = buildCustomers(rng);
  const customers = customerSeeds.map((c) => c.row);
  const memberships = buildMemberships(customerSeeds, rng);
  const packages = buildPackages(customerSeeds, services, rng);

  const memberCustomerIds = new Set(
    memberships.filter((m) => m.status === 'active').map((m) => m.customerId),
  );
  const packageCustomerIds = new Set(
    packages.filter((p) => p.creditsRemaining > 0).map((p) => p.customerId),
  );

  // --- 90 days of activity -------------------------------------------------
  const activityCtx: ActivityContext = {
    salonId: HERO_SALON_ID,
    rooms,
    services,
    staffByKey,
    customers: customerSeeds,
    memberCustomerIds,
    packageCustomerIds,
  };

  const visits: FixtureBundle['visits'] = [];
  const sessions: FixtureBundle['sessions'] = [];
  const sales: FixtureBundle['sales'] = [];
  const saleLines: FixtureBundle['saleLines'] = [];
  const unitsBySku = new Map<string, number>();
  const unitsBySkuLast30 = new Map<string, number>();

  for (const date of historyDays()) {
    const day = generateDayActivity(date, activityCtx, seed);
    visits.push(...day.visits);
    sessions.push(...day.sessions);
    sales.push(...day.sales);
    saleLines.push(...day.saleLines);
    const withinLast30 = diffDays(date, dayZero) <= 30;
    for (const [sku, units] of day.unitsBySku) {
      unitsBySku.set(sku, (unitsBySku.get(sku) ?? 0) + units);
      if (withinLast30) {
        unitsBySkuLast30.set(sku, (unitsBySkuLast30.get(sku) ?? 0) + units);
      }
    }
  }

  // Backfill each customer's last visit from the rows we just produced.
  const lastVisitByCustomer = new Map<string, Date>();
  for (const visit of visits) {
    const current = lastVisitByCustomer.get(visit.customerId);
    if (!current || visit.checkedInAt > current) {
      lastVisitByCustomer.set(visit.customerId, visit.checkedInAt);
    }
  }
  for (const customer of customers) {
    customer.lastVisitAt = lastVisitByCustomer.get(customer.id) ?? null;
  }

  // --- inventory: the stock arcs ------------------------------------------
  const stockRng = rng.child('stock');
  const inventoryLevels: InventoryLevelRow[] = [];
  const stockEvents: StockEventRow[] = [];

  for (const c of CATALOGUE) {
    const sold30 = unitsBySkuLast30.get(c.sku) ?? 0;
    const velocity = sold30 / 30;

    let onHand: number;
    if (c.sku === ARCS.lowStock.sku) {
      // Sized from the velocity the sales actually produced, so the card's
      // "about 8 days" is arithmetic rather than assertion.
      onHand = Math.max(2, Math.round(velocity * ARCS.lowStock.targetDaysRemaining));
    } else if (c.sku === ARCS.overstock.sku) {
      onHand = ARCS.overstock.onHand;
    } else if (velocity > 0) {
      onHand = Math.max(4, Math.round(velocity * stockRng.range(26, 95)));
    } else {
      onHand = stockRng.int(3, 10);
    }

    const reorderPoint = Math.max(2, Math.ceil(velocity * 14));
    const parLevel = Math.max(reorderPoint + 2, Math.ceil(velocity * 45));
    const productId = id('product', c.sku);

    inventoryLevels.push({
      id: id('inventory', c.sku),
      salonId: HERO_SALON_ID,
      productId,
      onHand,
      reorderPoint,
      parLevel,
      lastCountedAt: zonedToUtc(addDays(dayZero, -14), 20, 0, TZ),
      createdAt,
      updatedAt: zonedToUtc(dayZero, 8, 0, TZ),
    });

    // Receipts on a roughly monthly cadence, plus the last physical count.
    for (const weeksAgo of [12, 8, 4]) {
      const received = Math.max(2, Math.round(velocity * 30));
      stockEvents.push({
        id: id('stock-event', `${c.sku}:received:${weeksAgo}`),
        salonId: HERO_SALON_ID,
        productId,
        type: 'received',
        quantityDelta: received,
        quantityAfter: null,
        unitCost: c.wholesaleCost,
        staffId: staffByKey.get('marguerite')?.id ?? null,
        sessionId: null,
        saleLineId: null,
        note: `UVALUX order, week ${weeksAgo}`,
        occurredAt: zonedToUtc(addDays(dayZero, -weeksAgo * 7), 10, 0, TZ),
      });
    }
    stockEvents.push({
      id: id('stock-event', `${c.sku}:counted`),
      salonId: HERO_SALON_ID,
      productId,
      type: 'counted',
      quantityDelta: 0,
      quantityAfter: onHand,
      unitCost: null,
      staffId: staffByKey.get('marguerite')?.id ?? null,
      sessionId: null,
      saleLineId: null,
      note: 'Monthly count',
      occurredAt: zonedToUtc(addDays(dayZero, -14), 20, 0, TZ),
    });
  }

  // Spray solution consumed in-session. Fiji Blend gets none — that is the
  // whole reason it reads as overstock.
  for (const [index, sku] of SPRAY_SOLUTION_SKUS.entries()) {
    for (let week = 1; week <= 12; week += 1) {
      stockEvents.push({
        id: id('stock-event', `${sku}:used:${week}`),
        salonId: HERO_SALON_ID,
        productId: id('product', sku),
        type: 'used_in_session',
        quantityDelta: -1,
        quantityAfter: null,
        unitCost: null,
        staffId: null,
        sessionId: null,
        saleLineId: null,
        note: 'Spray booth refill',
        occurredAt: zonedToUtc(addDays(dayZero, -week * 7 - index), 12, 0, TZ),
      });
    }
  }

  // --- campaigns -----------------------------------------------------------
  const campaigns = buildCampaigns(dayZero, staffByKey.get('dana')?.id ?? null, rng);

  // --- gift cards ----------------------------------------------------------
  const giftRng = rng.child('gift-cards');
  const giftCards = Array.from({ length: 18 }, (_, i) => {
    const purchaser = customerSeeds[giftRng.int(0, customerSeeds.length - 1)]!;
    const initial = giftRng.pick([25, 50, 75, 100, 150]);
    const spent = giftRng.bool(0.45) ? giftRng.int(0, initial) : 0;
    const issuedAt = zonedToUtc(addDays(dayZero, -giftRng.int(5, 250)), 15, 0, TZ);
    return {
      id: id('gift-card', seq(i)),
      salonId: HERO_SALON_ID,
      code: `SR-${seq(giftRng.int(100000, 999999), 6)}`,
      initialBalance: initial,
      balance: money(initial - spent),
      state: (initial - spent === 0 ? 'redeemed' : 'active') as 'redeemed' | 'active',
      purchaserId: purchaser.row.id,
      recipientId: null,
      recipientName: null,
      recipientEmail: null,
      issuedAt,
      expiresAt: zonedToUtc(addDays(dayZero, 400), 23, 0, TZ),
      createdAt: issuedAt,
      updatedAt: issuedAt,
    };
  });

  // --- consent + ordering (hero salon) ------------------------------------
  const heroConsentId = id('consent-profile', HERO_SALON.slug);
  const consentProfiles = [
    {
      id: heroConsentId,
      salonId: HERO_SALON_ID,
      tier: 'coaching' as const,
      updatedByStaffId: staffByKey.get('dana')?.id ?? null,
      effectiveAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    },
  ];
  const consentAuditEntries = [
    {
      id: id('consent-audit', `${HERO_SALON.slug}:initial`),
      salonId: HERO_SALON_ID,
      consentProfileId: heroConsentId,
      fromTier: null,
      toTier: 'benchmarks' as const,
      changedByStaffId: staffByKey.get('dana')?.id ?? null,
      note: 'Set at onboarding',
      changedAt: createdAt,
    },
    {
      id: id('consent-audit', `${HERO_SALON.slug}:upgrade`),
      salonId: HERO_SALON_ID,
      consentProfileId: heroConsentId,
      fromTier: 'benchmarks' as const,
      toTier: 'coaching' as const,
      changedByStaffId: staffByKey.get('dana')?.id ?? null,
      note: 'Opted in to coaching after the spring rep visit',
      changedAt: zonedToUtc(addDays(dayZero, -120), 11, 0, TZ),
    },
  ];

  // A draft order sitting ready — the Act 1 beat 3 payoff that then shows up on
  // the rep's account timeline in Act 2.
  const draftOrderId = id('draft-order', 'sunset-ridge:pending');
  const bronzer = CATALOGUE.find((c) => c.sku === ARCS.lowStock.sku)!;
  const draftOrders = [
    {
      id: draftOrderId,
      salonId: HERO_SALON_ID,
      accountId: id('account', HERO_SALON.slug),
      state: 'draft' as const,
      total: money(bronzer.wholesaleCost * 24),
      note: null,
      createdByStaffId: staffByKey.get('dana')?.id ?? null,
      submittedAt: null,
      acknowledgedAt: null,
      createdAt: zonedToUtc(dayZero, 8, 30, TZ),
      updatedAt: zonedToUtc(dayZero, 8, 30, TZ),
    },
  ];
  const draftOrderLines = [
    {
      id: id('draft-order-line', 'sunset-ridge:pending:cabana'),
      draftOrderId,
      productId: id('product', bronzer.sku),
      uvaluxCatalogItemId: id('catalog-item', bronzer.sku),
      description: bronzer.name,
      quantity: 24,
      unitPrice: bronzer.wholesaleCost,
      reason: 'About eight days of stock left at the current sell-through',
      createdAt: zonedToUtc(dayZero, 8, 30, TZ),
    },
  ];

  // --- Compass portfolio ---------------------------------------------------
  const portfolio = buildPortfolio(rng, repIdByKey, createdAt);

  const heroAccount = {
    id: id('account', HERO_SALON.slug),
    salonId: HERO_SALON_ID,
    accountNumber: 'UVX-02099',
    lifecycle: 'established' as const,
    healthScore: 83,
    annualWholesaleValue: 61800,
    territory: 'BC Interior',
    assignedRepId: repIdByKey.get('rep-carrow') ?? null,
    lastContactAt: zonedToUtc(addDays(dayZero, -18), 14, 0, TZ),
    nextTouchAt: zonedToUtc(addDays(dayZero, 9), 10, 0, TZ),
    metadata: { region: 'BC' },
    createdAt: heroOpenedAt,
    updatedAt: createdAt,
  };

  // --- activity log --------------------------------------------------------
  const activityEvents = [
    {
      id: id('activity', 'seed:reset'),
      salonId: HERO_SALON_ID,
      actorType: 'system' as const,
      actorStaffId: null,
      actorLabel: 'Demo harness',
      action: 'demo_reset',
      targetType: null,
      targetId: null,
      metadata: { seed, dayZero, historyDays: HISTORY_DAYS },
      occurredAt: zonedToUtc(dayZero, 6, 0, TZ),
    },
  ];

  return {
    roomTypes,
    segments,
    playbooks,
    uvaluxCatalogItems,
    orgs: [...orgs, ...portfolio.orgs],
    salons: [...salons, ...portfolio.salons],
    staff,
    products,
    barcodes,
    rooms,
    equipmentDevices,
    services,
    customers,
    memberships,
    packages,
    visits,
    sessions,
    sales,
    saleLines,
    inventoryLevels,
    stockEvents,
    campaigns,
    giftCards,
    activityEvents,
    consentProfiles: [...consentProfiles, ...portfolio.consentProfiles],
    consentAuditEntries: [...consentAuditEntries, ...portfolio.consentAuditEntries],
    draftOrders,
    draftOrderLines,
    accounts: [heroAccount, ...portfolio.accounts],
    signalSnapshots: portfolio.signalSnapshots,
    coachingRequests: portfolio.coachingRequests,
    contactLogs: portfolio.contactLogs,
    demoState: [
      {
        id: 'default',
        virtualToday: new Date(`${dayZero}T00:00:00.000Z`),
        seed,
        lastAdvancedAt: null,
        lastPipelineRunAt: null,
        notes: `Day zero for ${HERO_SALON.name}. ${HISTORY_DAYS} days of history.`,
        createdAt: zonedToUtc(dayZero, 6, 0, TZ),
        updatedAt: zonedToUtc(dayZero, 6, 0, TZ),
      },
    ],
  };
}

/**
 * Campaign history plus the staged Tuesday campaign.
 *
 * The staged one is `scheduled` rather than `draft` so `demo:advance --days 5`
 * settles it into real bookings — the demo-clock payoff in PRODUCT_SPEC §21
 * ("Yesterday was your best Tuesday in six weeks"). In the live pitch Daniel
 * creates this campaign himself in Studio; seeding it means the beat can be
 * rehearsed, and `demo:verify` can assert it, without the UI.
 */
function buildCampaigns(dayZero: DateOnly, createdByStaffId: string | null, rng: Rng): CampaignRow[] {
  const campaignRng = rng.child('campaigns');
  const rows: CampaignRow[] = [];

  const history = [
    { key: 'spring-lapsed', name: 'Come back for spring', segmentKey: 'lapsed_30d', daysAgo: 74, recipients: 118, bookings: 14, revenue: 486 },
    { key: 'package-expiry', name: 'Your sessions expire soon', segmentKey: 'expiring_packages', daysAgo: 52, recipients: 46, bookings: 21, revenue: 612 },
    { key: 'members-only-lotion', name: 'Members-only lotion week', segmentKey: 'big_spenders', daysAgo: 31, recipients: 63, bookings: 9, revenue: 741 },
    { key: 'midweek-boost', name: 'Midweek pick-me-up', segmentKey: 'midweek_regulars', daysAgo: 17, recipients: 87, bookings: 11, revenue: 358 },
  ];

  for (const h of history) {
    const sentAt = zonedToUtc(addDays(dayZero, -h.daysAgo), 10, 0, TZ);
    rows.push({
      id: id('campaign', h.key),
      salonId: HERO_SALON_ID,
      name: h.name,
      goal: 'Fill quiet hours',
      segmentKey: h.segmentKey,
      segmentSnapshot: { key: h.segmentKey, count: h.recipients },
      channels: campaignRng.bool(0.6) ? ['sms', 'email'] : ['email'],
      content: { subject: h.name, body: `${h.name} — booked through the app or at the desk.` },
      state: 'measured',
      scheduledFor: sentAt,
      sentAt,
      measuredAt: zonedToUtc(addDays(dayZero, -h.daysAgo + 7), 10, 0, TZ),
      results: { recipients: h.recipients, bookings: h.bookings, revenue: h.revenue },
      sourceInsightId: null,
      createdByStaffId,
      createdAt: zonedToUtc(addDays(dayZero, -h.daysAgo - 1), 16, 0, TZ),
      updatedAt: zonedToUtc(addDays(dayZero, -h.daysAgo + 7), 10, 0, TZ),
    });
  }

  const arc = ARCS.tuesdayCampaign;
  const sendDate = addDays(dayZero, arc.sendOffsetDays);
  rows.push({
    id: id('campaign', 'tuesday-afternoon'),
    salonId: HERO_SALON_ID,
    name: 'Quiet Tuesday afternoon',
    goal: 'Fill Tuesday 1–5 pm',
    segmentKey: arc.segmentKey,
    segmentSnapshot: { key: arc.segmentKey, count: 43 },
    channels: ['sms'],
    content: {
      sms: 'Tuesday afternoons are quiet at Sunset Ridge — come in between 1 and 5 and we will look after you. Reply STOP to opt out.',
      subject: 'A quieter Tuesday',
    },
    state: 'scheduled',
    scheduledFor: zonedToUtc(sendDate, 9, 0, TZ),
    sentAt: null,
    measuredAt: null,
    results: null,
    sourceInsightId: null,
    createdByStaffId,
    createdAt: zonedToUtc(dayZero, 8, 15, TZ),
    updatedAt: zonedToUtc(dayZero, 8, 15, TZ),
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Determinism proof
// ---------------------------------------------------------------------------

/** Table order used for checksums and diffs. Stable, not alphabetical-by-accident. */
export const BUNDLE_TABLE_ORDER: Array<keyof FixtureBundle> = [
  'roomTypes',
  'segments',
  'playbooks',
  'uvaluxCatalogItems',
  'orgs',
  'salons',
  'staff',
  'products',
  'barcodes',
  'rooms',
  'equipmentDevices',
  'services',
  'customers',
  'memberships',
  'packages',
  'visits',
  'sessions',
  'sales',
  'saleLines',
  'inventoryLevels',
  'stockEvents',
  'campaigns',
  'giftCards',
  'activityEvents',
  'consentProfiles',
  'consentAuditEntries',
  'draftOrders',
  'draftOrderLines',
  'accounts',
  'signalSnapshots',
  'coachingRequests',
  'contactLogs',
  'demoState',
];

/**
 * Canonical serialisation: keys sorted, dates as ISO strings. Two bundles that
 * are structurally equal must serialise to identical bytes or the determinism
 * check is measuring key order rather than data.
 */
export function canonicalise(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalise).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalise(v)}`).join(',')}}`;
}

export function checksumBundle(bundle: FixtureBundle): string {
  const hash = createHash('sha256');
  for (const table of BUNDLE_TABLE_ORDER) {
    hash.update(`\n#${table}\n`);
    hash.update(canonicalise(bundle[table]));
  }
  return hash.digest('hex');
}

/** Per-table checksums — tells you *which* table drifted, not just that one did. */
export function checksumByTable(bundle: FixtureBundle): Record<string, { rows: number; sha256: string }> {
  const out: Record<string, { rows: number; sha256: string }> = {};
  for (const table of BUNDLE_TABLE_ORDER) {
    const rows = bundle[table] as unknown[];
    out[table] = {
      rows: rows.length,
      sha256: createHash('sha256').update(canonicalise(rows)).digest('hex').slice(0, 16),
    };
  }
  return out;
}

export function totalRows(bundle: FixtureBundle): number {
  return BUNDLE_TABLE_ORDER.reduce((sum, table) => sum + (bundle[table] as unknown[]).length, 0);
}

export { DAY_ZERO, DEFAULT_SEED, HERO_SALON_ID, MEMBERSHIP_TIERS, generateDayActivity };
export type { FixtureBundle };
