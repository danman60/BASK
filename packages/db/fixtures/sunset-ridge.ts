/**
 * Sunset Ridge Tanning & Wellness — the hero salon (PRODUCT_SPEC §20).
 *
 * Everything here is derived from the seed. No `Math.random`, no `Date.now`,
 * no `new Date()` without an argument. Two runs of `demo:reset` produce
 * byte-identical rows, which is what makes the pitch rehearsable.
 *
 * The story arcs are *generated*, not asserted: retail attachment slips because
 * two staffers stop upselling, Tuesday afternoons are soft because fewer visits
 * land there, and the Hempz bronzer is eight days out because it genuinely sold
 * that fast. The insight engine then rediscovers all of it from the rows.
 */

import {
  addDays,
  diffDays,
  dayOfWeek,
  eachDay,
  zonedToUtc,
  type DateOnly,
} from '@bask/core';

import {
  ARCS,
  CURRENCY,
  DAY_ZERO,
  HERO_SALON,
  HISTORY_DAYS,
  HOUR_TRAFFIC,
  MEMBERSHIP_TIERS,
  OPEN_HOURS,
  SLOTS_PER_ROOM_HOUR,
  TARGETS,
  WEEKDAY_TRAFFIC,
  isOpen,
} from './constants';
import { ATTACHMENT_CANDIDATES, CATALOGUE, catalogueBySku } from './catalogue';
import { id, seq } from './ids';
import { FIRST_NAMES, LAST_NAMES, STAFF, staffOnShift, type StaffSeed } from './people';
import { Rng, money } from './rng';
import type {
  CustomerRow,
  MembershipRow,
  PackageRow,
  RoomRow,
  SaleLineRow,
  SaleRow,
  ServiceRow,
  SessionRow,
  StaffRow,
  VisitRow,
} from './types';

const TZ = HERO_SALON.timezone;
export const HERO_SALON_ID = id('salon', HERO_SALON.slug);
export const HERO_ORG_ID = id('org', HERO_SALON.slug);

// ---------------------------------------------------------------------------
// Rooms — real UVALUX equipment; keys and types lifted from DESIGN mockup 02.
// ---------------------------------------------------------------------------

export const ROOM_TYPES = [
  { key: 'uv_level1', label: 'UV · Level 1', category: 'uv', defaultMinutes: 15, cleaningMinutes: 5, sortOrder: 1 },
  { key: 'uv_level2', label: 'UV · Level 2', category: 'uv', defaultMinutes: 12, cleaningMinutes: 5, sortOrder: 2 },
  { key: 'uv_level3', label: 'UV · Level 3', category: 'uv', defaultMinutes: 12, cleaningMinutes: 5, sortOrder: 3 },
  { key: 'uv_stand_up', label: 'UV · Stand-up', category: 'uv', defaultMinutes: 10, cleaningMinutes: 5, sortOrder: 4 },
  { key: 'spray', label: 'Spray', category: 'spray', defaultMinutes: 20, cleaningMinutes: 8, sortOrder: 5 },
  { key: 'red_light', label: 'Red light', category: 'wellness', defaultMinutes: 20, cleaningMinutes: 5, sortOrder: 6 },
  { key: 'hydromassage', label: 'Hydromassage', category: 'wellness', defaultMinutes: 25, cleaningMinutes: 8, sortOrder: 7 },
] as const;

/**
 * The hero salon's eight rooms — REAL UVALUX equipment.
 *
 * Names, manufacturers, descriptions and images come from
 * `packages/db/fixtures/uvalux-catalogue.json` (the uvalux.com equipment catalogue, pulled
 * 2026-08-08), verbatim. The eight `key`s and their `type` mapping are unchanged from DESIGN
 * mockup 02 — the Floor board, the room-type lookup and the maintenance chip on `wave` all key
 * off them.
 *
 * Images are repo-local (`/equipment/<key>.jpg`); nothing is fetched from uvalux.com at runtime.
 */
export const ROOMS = [
  {
    key: 'bed-1',
    name: 'Ergoline Sunrise 7200',
    type: 'uv_level3',
    manufacturer: 'Ergoline',
    description: 'Stand Up Performer Stand up and stand out with the Ergoline Sunrise 7200! At first glance the vertical design inspires with its unique LED lightshow. The bright interior invites your customers to a new tanning experience. The 3D sound system with Bluetooth ® connect transforms th',
    sourceUrl: 'https://uvalux.com/shop/equipment/uv-sun/ergoline/ergoline-sunrise-7200/',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/SNR7200.jpg',
  },
  {
    key: 'bed-2',
    name: 'KBL 6800 Alpha Pearl',
    type: 'uv_level2',
    manufacturer: 'KBL',
    description: 'Take Your Tan to the Next Level Pure power can be so beautiful! Tanning with power, relaxing with style. The KBL 6800 Alpha Pearl is the high-tech eye-catcher with high-performance tubes, powerful design and a lot of wellness features. This unique bed helps you to achieve the per',
    sourceUrl: 'https://uvalux.com/shop/equipment/uv-sun/kbl/kbl-6800-alpha-pearl/',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/KBL6800.jpg',
  },
  {
    key: 'bed-3',
    name: 'Ergoline SunDash 32/0',
    type: 'uv_level1',
    manufacturer: 'Ergoline',
    description: 'Entry-Level Super Power The Ergoline SunDash 32 combines the best of both worlds: the proven performance and durability of the iconic SunDash with the leading UV technology and design expertise of Ergoline. The Ergoline SunDash has everything an entry level unit needs and more. 3',
    sourceUrl: 'https://uvalux.com/shop/equipment/uv-sun/ergoline/ergoline-sundash-32-0/',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/SND17802.jpg',
  },
  {
    key: 'bed-4',
    name: 'KBL Space 2000',
    type: 'uv_stand_up',
    manufacturer: 'KBL',
    description: 'Elegant, Comfortable & Fascinating Providing optimum power in a smaller space, the KBL Space 2000 will be a highlight of your salon. Its client-pleasing performance and stand-up design will re-energize your space and revitalize your business. The Space 2000 features high-quality ',
    sourceUrl: 'https://uvalux.com/shop/equipment/uv-sun/kbl/kbl-space-2000/',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/KBL2000.jpg',
  },
  {
    key: 'booth',
    name: 'Mystic Tan Unity',
    type: 'spray',
    manufacturer: 'Mystic Tan',
    description: 'Fully Automated Sunless System Achieving the perfect tan has never been easier with the Mystic Tan Unity™ spray booth. Unity™ offers the most technologically advanced, personalized spray tanning experience. With the customizable solution mix and MagneTan® Spray System, clients of',
    sourceUrl: 'https://uvalux.com/shop/equipment/spray-tan/booth/mystic-tan-unity/',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/UnityOilBlue.jpg',
  },
  {
    key: 'studio-a',
    name: 'Ergoline Beauty Angel RVT 30',
    type: 'red_light',
    manufacturer: 'Ergoline',
    description: 'Lighting the Way to Beautiful Skin The Ergoline Beauty Angel® RVT 30 emits light energy (non-UV) within the near infrared and visible wavelengths. It does not emit UV light and is not a tanning device. The light energy emitted is a gentle form of stimulation and is ideal for anyb',
    sourceUrl: 'https://uvalux.com/shop/equipment/wellness/red-light/ergoline-beauty-angel-rvt-30/',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/ERG04301.jpg',
  },
  {
    key: 'studio-b',
    name: 'Redwave Plus',
    type: 'red_light',
    manufacturer: 'Revive',
    description: 'Transformative Wellness, Rejuvenation to Recovery. The Redwave Plus is the first of its kind to offer infrared and red-light LED technology for the entire body. Easy to use and accessible, this cutting-edge technology comes together with form and function to create an in-demand s',
    sourceUrl: 'https://uvalux.com/shop/equipment/wellness/red-light/redwave-plus/',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/Redwave-Plus.jpg',
  },
  {
    key: 'wave',
    name: 'Wellsystem Wave Hydro Massage Therapy',
    type: 'hydromassage',
    manufacturer: 'Wellness JK',
    description: 'Relaxation for Body & Soul Back problems and stress are widespread health issues that more and more people suffer from. The dry-water massage of Wellsystem hydrojets relieves tension and helps to retain fitness in a relaxed manner. The unique dry water massage experience uses hea',
    sourceUrl: 'https://uvalux.com/shop/equipment/wellness/massage/wellsystem-wave-hydro-massage-therapy/',
    sourceImageUrl: 'https://uvalux.com/wp-content/uploads/products/WellsystemWave.jpg',
  },
] as const;

/** `Ergoline Sunrise 7200` + manufacturer `Ergoline` -> `Sunrise 7200`. Never invents a model. */
export function equipmentModel(name: string, manufacturer: string): string {
  return name.startsWith(`${manufacturer} `) ? name.slice(manufacturer.length + 1) : name;
}

/** Repo-local equipment photo for a room key. */
export function equipmentImage(roomKey: string): string {
  return `/equipment/${roomKey}.jpg`;
}

export const SERVICES = [
  { key: 'uv-l1', name: 'Level 1 UV', category: 'uv', roomTypeKey: 'uv_level1', minutes: 15, price: 16, weight: 0.9 },
  { key: 'uv-l2', name: 'Level 2 UV', category: 'uv', roomTypeKey: 'uv_level2', minutes: 12, price: 22, weight: 1.4 },
  { key: 'uv-l3', name: 'Level 3 UV', category: 'uv', roomTypeKey: 'uv_level3', minutes: 12, price: 29, weight: 1.5 },
  { key: 'uv-stand', name: 'Stand-up UV', category: 'uv', roomTypeKey: 'uv_stand_up', minutes: 10, price: 24, weight: 1.0 },
  { key: 'spray-full', name: 'Spray tan', category: 'spray', roomTypeKey: 'spray', minutes: 20, price: 45, weight: 0.55 },
  { key: 'red-light', name: 'Red light', category: 'wellness', roomTypeKey: 'red_light', minutes: 20, price: 35, weight: 0.85 },
  { key: 'hydro', name: 'Hydromassage', category: 'wellness', roomTypeKey: 'hydromassage', minutes: 25, price: 30, weight: 0.5 },
] as const;

export type ServiceKey = (typeof SERVICES)[number]['key'];

// ---------------------------------------------------------------------------
// Story-arc curves
// ---------------------------------------------------------------------------

/**
 * Probability that a visit on `date`, rung up by `staffKey`, includes a product.
 *
 * Flat baseline → 14-day ramp → 14-day floor. The floor is the window the
 * detector measures, so the card's "21% to 15%" is the arithmetic truth of the
 * rows, not a number written into a template.
 */
export function attachmentRate(date: DateOnly, staffKey: string): number {
  const { baselineRate, rampDays, flatDays, laggardStaffKeys, laggardFloorRate, othersFloorRate } =
    ARCS.attachment;
  const isLaggard = (laggardStaffKeys as readonly string[]).includes(staffKey);
  const start = isLaggard ? baselineRate + 0.01 : baselineRate;
  const floor = isLaggard ? laggardFloorRate : othersFloorRate;

  const daysBefore = diffDays(date, DAY_ZERO);
  if (daysBefore >= rampDays + flatDays) return start;
  if (daysBefore <= flatDays) return floor;
  const progress = (rampDays + flatDays - daysBefore) / rampDays;
  return start + (floor - start) * progress;
}

/**
 * Extra spray bookings on `date` (ARCS.sprayTrend).
 *
 * Modelled as *additional visits* rather than a bump to the spray service's
 * draw weight. Two reasons, one practical and one true:
 *
 *  - Practical: the weighted draw runs against fixed room capacity, so raising
 *    spray's weight mostly just re-shuffles which services get clipped at peak
 *    hours. Measured against the rows, a 60% weight lift moved the 14-day spray
 *    count by zero. Extra visits move it by exactly what they are.
 *  - True: a service trending up means more people booking it, not the same
 *    people redistributing across the menu.
 */
export function extraSprayVisits(date: DateOnly): number {
  const { peakExtraPerDay, rampDays } = ARCS.sprayTrend;
  const daysBefore = diffDays(date, DAY_ZERO);
  if (daysBefore > rampDays) return 0;
  const progress = Math.min(1, Math.max(0, (rampDays - daysBefore) / rampDays));
  return Math.round(peakExtraPerDay * progress);
}

/** Hour weights for a day, with the Tuesday-afternoon damping applied. */
export function hourWeights(date: DateOnly): Array<[number, number]> {
  const weekday = dayOfWeek(date);
  const [open, close] = OPEN_HOURS[weekday]!;
  const out: Array<[number, number]> = [];
  for (let hour = open; hour < close; hour += 1) {
    let weight = HOUR_TRAFFIC[hour] ?? 1;
    const soft = ARCS.softWindow;
    if (weekday === soft.weekday && hour >= soft.startHour && hour < soft.endHour) {
      weight *= soft.trafficMultiplier;
    }
    out.push([hour, weight]);
  }
  return out;
}

/** Visits to generate for a calendar day. */
export function visitsForDay(date: DateOnly, rng: Rng): number {
  const weekday = dayOfWeek(date);
  const base = TARGETS.visitsPerDay * (WEEKDAY_TRAFFIC[weekday] ?? 1);
  // A little week-to-week wobble so trend detectors have something to chew on.
  return Math.max(1, Math.round(rng.normal(base, base * 0.08)));
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export interface CustomerSeed {
  row: CustomerRow;
  index: number;
  /** Members visit more often, so they get a heavier draw weight. */
  visitWeight: number;
  membershipTier: string | null;
}

export function buildStaff(rng: Rng): { rows: StaffRow[]; byKey: Map<string, StaffRow> } {
  const rows: StaffRow[] = [];
  const byKey = new Map<string, StaffRow>();
  for (const seed of STAFF) {
    const hiredAt = zonedToUtc(addDays(DAY_ZERO, -seed.hiredMonthsAgo * 30), 9, 0, TZ);
    const row: StaffRow = {
      id: id('staff', seed.key),
      salonId: HERO_SALON_ID,
      firstName: seed.firstName,
      lastName: seed.lastName,
      email: `${seed.key}@sunsetridgetanning.ca`,
      phone: `(250) 555-0${seq(rng.int(100, 999), 3)}`,
      role: seed.role,
      permissions: {},
      shiftPattern: { days: seed.days, start: seed.shift[0], end: seed.shift[1] },
      isActive: true,
      hiredAt,
      createdAt: hiredAt,
      updatedAt: hiredAt,
    };
    rows.push(row);
    byKey.set(seed.key, row);
  }
  return { rows, byKey };
}

export function buildCustomers(rng: Rng): CustomerSeed[] {
  const out: CustomerSeed[] = [];
  const nameRng = rng.child('customer-names');

  for (let i = 0; i < TARGETS.customers; i += 1) {
    const firstName = nameRng.pick(FIRST_NAMES);
    const lastName = nameRng.pick(LAST_NAMES);
    // Joined anywhere from three years ago to last week.
    const joinedDaysAgo = Math.round(nameRng.range(3, 1100));
    const joinedAt = zonedToUtc(addDays(DAY_ZERO, -joinedDaysAgo), 11, 0, TZ);

    // Members are the first ~120; the visit generator leans on them heavily.
    const isMember = i < TARGETS.members;
    const tier = isMember
      ? nameRng.weighted(MEMBERSHIP_TIERS.map((t) => [t.key, t.share] as const))
      : null;

    const status: CustomerRow['status'] = isMember
      ? 'active'
      : nameRng.weighted([
          ['active', 0.6],
          ['lapsed', 0.28],
          ['inactive', 0.12],
        ] as const);

    const emailOptIn = nameRng.bool(isMember ? 0.86 : 0.62);
    const smsOptIn = nameRng.bool(isMember ? 0.78 : 0.48);
    const createdAt = joinedAt;

    const row: CustomerRow = {
      id: id('customer', seq(i)),
      salonId: HERO_SALON_ID,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}${i}@example.com`,
      phone: `(250) 555-${seq(1000 + i, 4)}`,
      birthDate: zonedToUtc(
        addDays(DAY_ZERO, -Math.round(nameRng.range(18 * 365, 62 * 365))),
        12,
        0,
        TZ,
      ),
      skinType: `Type ${nameRng.int(1, 5)}`,
      status,
      emailOptIn,
      smsOptIn,
      photoConsent: nameRng.bool(0.3),
      marketingConsentAt: emailOptIn || smsOptIn ? joinedAt : null,
      waiverSignedAt: joinedAt,
      notes: null,
      joinedAt,
      lastVisitAt: null, // backfilled once visits exist
      createdAt,
      updatedAt: createdAt,
    };

    const visitWeight = isMember
      ? nameRng.range(2.2, 4.2)
      : status === 'active'
        ? nameRng.range(0.5, 1.4)
        : status === 'lapsed'
          ? nameRng.range(0.06, 0.2)
          : 0.02;

    out.push({ row, index: i, visitWeight, membershipTier: tier });
  }
  return out;
}

/**
 * Memberships, including the seven failed payments (four recoverable).
 *
 * "Recoverable" is not a flag — it is a shape the detector reads off the data:
 * a recent visit, a single failed attempt, and a prior recovery. The rows are
 * built so that shape is true.
 */
export function buildMemberships(customers: CustomerSeed[], rng: Rng): MembershipRow[] {
  const memberRng = rng.child('memberships');
  const members = customers.filter((c) => c.membershipTier !== null);
  const rows: MembershipRow[] = [];

  // Pick who fails. Recoverable members are taken from the front of the list
  // (heaviest visitors), so their "visited recently" evidence is genuine.
  const recoverableIds = new Set<number>();
  const unrecoverableIds = new Set<number>();
  const byTier = (tier: string) => members.filter((m) => m.membershipTier === tier);

  for (const [i, tier] of ARCS.failedPayments.recoverableTiers.entries()) {
    const pool = byTier(tier).filter((m) => !recoverableIds.has(m.index));
    const chosen = pool[i % pool.length]!;
    recoverableIds.add(chosen.index);
  }
  for (const [i, tier] of ARCS.failedPayments.unrecoverableTiers.entries()) {
    const pool = byTier(tier)
      .filter((m) => !recoverableIds.has(m.index) && !unrecoverableIds.has(m.index))
      .reverse(); // back of the list = lightest visitors
    const chosen = pool[i % pool.length]!;
    unrecoverableIds.add(chosen.index);
  }

  // The cancellation cluster, ~45 days back.
  const clusterPool = members
    .filter((m) => !recoverableIds.has(m.index) && !unrecoverableIds.has(m.index))
    .slice(-30);
  const cancelled = new Set(
    memberRng.sample(clusterPool, ARCS.cancellationCluster.count).map((m) => m.index),
  );

  for (const member of members) {
    const tier = MEMBERSHIP_TIERS.find((t) => t.key === member.membershipTier)!;
    const startedDaysAgo = Math.round(memberRng.range(35, 900));
    const startedAt = zonedToUtc(addDays(DAY_ZERO, -startedDaysAgo), 10, 0, TZ);
    const billingDay = memberRng.int(1, 28);

    const isRecoverable = recoverableIds.has(member.index);
    const isUnrecoverable = unrecoverableIds.has(member.index);
    const isCancelled = cancelled.has(member.index);

    let status: MembershipRow['status'] = 'active';
    let paymentState: MembershipRow['paymentState'] = 'current';
    let failedPaymentCount = 0;
    let cancelledAt: Date | null = null;
    let cancelReason: string | null = null;
    let lastPaymentAt: Date | null = zonedToUtc(addDays(DAY_ZERO, -memberRng.int(1, 30)), 3, 0, TZ);

    if (isCancelled) {
      status = 'cancelled';
      const daysAgo =
        ARCS.cancellationCluster.daysAgo - memberRng.int(0, ARCS.cancellationCluster.windowDays);
      cancelledAt = zonedToUtc(addDays(DAY_ZERO, -daysAgo), 14, 0, TZ);
      cancelReason = memberRng.pick([
        'Moving out of town',
        'Too expensive right now',
        'Not using it enough',
        'Switching to packages',
      ]);
      lastPaymentAt = zonedToUtc(addDays(DAY_ZERO, -daysAgo - 12), 3, 0, TZ);
    } else if (isRecoverable) {
      paymentState = 'failed';
      failedPaymentCount = 1;
      // Failed within the last week — this is "this week's" failure list.
      lastPaymentAt = zonedToUtc(addDays(DAY_ZERO, -memberRng.int(2, 6)), 3, 0, TZ);
    } else if (isUnrecoverable) {
      paymentState = 'failed';
      failedPaymentCount = memberRng.int(3, 4);
      lastPaymentAt = zonedToUtc(addDays(DAY_ZERO, -memberRng.int(3, 7)), 3, 0, TZ);
    }

    rows.push({
      id: id('membership', seq(member.index)),
      salonId: HERO_SALON_ID,
      customerId: member.row.id,
      tier: tier.key,
      status,
      paymentState,
      monthlyPrice: tier.monthlyPrice,
      billingDayOfMonth: billingDay,
      startedAt,
      nextBillingAt: status === 'cancelled' ? null : zonedToUtc(addDays(DAY_ZERO, 30 - billingDay % 30), 3, 0, TZ),
      lastPaymentAt,
      failedPaymentCount,
      frozenAt: null,
      cancelledAt,
      cancelReason,
      createdAt: startedAt,
      updatedAt: cancelledAt ?? startedAt,
    });
  }

  return rows;
}

export function buildPackages(
  customers: CustomerSeed[],
  services: ServiceRow[],
  rng: Rng,
): PackageRow[] {
  const pkgRng = rng.child('packages');
  const rows: PackageRow[] = [];
  const nonMembers = customers.filter((c) => c.membershipTier === null && c.row.status === 'active');
  const holders = pkgRng.sample(nonMembers, Math.min(96, nonMembers.length));

  for (const holder of holders) {
    const service = pkgRng.pick(services);
    const creditsTotal = pkgRng.pick([5, 10, 10, 20]);
    const used = pkgRng.int(0, creditsTotal);
    const purchasedAt = zonedToUtc(addDays(DAY_ZERO, -pkgRng.int(5, 180)), 12, 0, TZ);
    const remaining = creditsTotal - used;
    rows.push({
      id: id('package', seq(holder.index)),
      salonId: HERO_SALON_ID,
      customerId: holder.row.id,
      serviceId: service.id,
      name: `${creditsTotal}-session ${service.name}`,
      creditsTotal,
      creditsRemaining: remaining,
      status: remaining === 0 ? 'used' : 'active',
      pricePaid: money(Number(service.price) * creditsTotal * 0.85),
      purchasedAt,
      expiresAt: zonedToUtc(addDays(DAY_ZERO, pkgRng.int(-10, 260)), 23, 0, TZ),
      createdAt: purchasedAt,
      updatedAt: purchasedAt,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Daily activity — shared by history generation and `demo:advance`.
// ---------------------------------------------------------------------------

export interface ActivityContext {
  salonId: string;
  rooms: RoomRow[];
  services: ServiceRow[];
  staffByKey: Map<string, StaffRow>;
  customers: CustomerSeed[];
  /** Customer ids that hold an active membership — drives tender type. */
  memberCustomerIds: Set<string>;
  /** Customer ids with package credits left. */
  packageCustomerIds: Set<string>;
}

export interface DayActivity {
  visits: VisitRow[];
  sessions: SessionRow[];
  sales: SaleRow[];
  saleLines: SaleLineRow[];
  /** Product units sold, keyed by sku — used to size opening inventory. */
  unitsBySku: Map<string, number>;
}

const TAX_RATE = 0.12; // BC: 5% GST + 7% PST

/**
 * One salon day. Deterministic in `date` — the same day regenerates identically
 * whether it is produced during a reset or by advancing the clock onto it.
 */
export function generateDayActivity(
  date: DateOnly,
  ctx: ActivityContext,
  seed: string,
): DayActivity {
  const weekday = dayOfWeek(date);
  const rng = new Rng(`${seed}::day::${date}`);
  const out: DayActivity = {
    visits: [],
    sessions: [],
    sales: [],
    saleLines: [],
    unitsBySku: new Map(),
  };

  const target = visitsForDay(date, rng);
  const weights = hourWeights(date);
  if (weights.length === 0) return out;

  const serviceWeights = SERVICES.map((s) => [s, s.weight] as const);
  const customerWeights = ctx.customers.map((c) => [c, c.visitWeight] as const);

  // Room-hour occupancy, so utilisation stays inside what the building can do.
  const roomHourLoad = new Map<string, number>();
  const capacityPerRoomHour = Math.round(SLOTS_PER_ROOM_HOUR);

  // The regular day, plus the spray bookings the upward trend is adding.
  const plan: Array<{ key: string; forcedServiceKey: ServiceKey | null }> = [];
  for (let n = 0; n < target; n += 1) plan.push({ key: `${date}:${n}`, forcedServiceKey: null });
  for (let n = 0; n < extraSprayVisits(date); n += 1) {
    plan.push({ key: `${date}:spray:${n}`, forcedServiceKey: 'spray-full' });
  }

  for (const item of plan) {
    const hour = rng.weighted(weights);
    if (!isOpen(weekday, hour)) continue;

    const service = item.forcedServiceKey
      ? SERVICES.find((s) => s.key === item.forcedServiceKey)!
      : rng.weighted(serviceWeights);
    const candidates = ctx.rooms.filter((r) => r.roomTypeKey === service.roomTypeKey);
    if (candidates.length === 0) continue;

    // Least-loaded matching room. A full room-hour means the visit doesn't
    // happen — that is what capacity actually means.
    const room = candidates.reduce((best, r) => {
      const bestLoad = roomHourLoad.get(`${best.id}:${hour}`) ?? 0;
      const load = roomHourLoad.get(`${r.id}:${hour}`) ?? 0;
      return load < bestLoad ? r : best;
    }, candidates[0]!);
    const loadKey = `${room.id}:${hour}`;
    const load = roomHourLoad.get(loadKey) ?? 0;
    if (load >= capacityPerRoomHour) continue;
    roomHourLoad.set(loadKey, load + 1);

    const onShift = staffOnShift(weekday, hour);
    const staffSeed: StaffSeed | null = onShift.length > 0 ? rng.pick(onShift) : null;
    const staffRow = staffSeed ? ctx.staffByKey.get(staffSeed.key) ?? null : null;

    const customer = rng.weighted(customerWeights);
    const minute = rng.int(0, 59);
    const checkedInAt = zonedToUtc(date, hour, minute, TZ);
    const serviceRow = ctx.services.find((s) => s.name === service.name)!;

    const visitKey = item.key;
    const visitId = id('visit', visitKey);
    const sessionId = id('session', visitKey);
    const saleId = id('sale', visitKey);

    const startedAt = new Date(checkedInAt.getTime() + rng.int(2, 9) * 60_000);
    const endsAt = new Date(startedAt.getTime() + service.minutes * 60_000);
    const cleaningEndsAt = new Date(endsAt.getTime() + room.cleaningMinutes * 60_000);

    out.visits.push({
      id: visitId,
      salonId: ctx.salonId,
      customerId: customer.row.id,
      staffId: staffRow?.id ?? null,
      source: rng.weighted([
        ['walk_in', 0.55],
        ['appointment', 0.28],
        ['online_booking', 0.17],
      ] as const),
      checkedInAt,
      checkedOutAt: cleaningEndsAt,
      notes: null,
      createdAt: checkedInAt,
    });

    out.sessions.push({
      id: sessionId,
      salonId: ctx.salonId,
      roomId: room.id,
      customerId: customer.row.id,
      serviceId: serviceRow.id,
      visitId,
      startedByStaffId: staffRow?.id ?? null,
      startedBy: 'staff',
      state: 'completed',
      requestedMinutes: service.minutes,
      equipmentMinutes: service.minutes,
      delayMinutes: 0,
      startedAt,
      endsAt,
      endedAt: endsAt,
      cleaningEndsAt,
      notes: null,
      createdAt: checkedInAt,
      updatedAt: cleaningEndsAt,
    });

    // --- the sale -----------------------------------------------------------
    const isMember = ctx.memberCustomerIds.has(customer.row.id);
    const hasPackage = ctx.packageCustomerIds.has(customer.row.id);
    const serviceTender: SaleLineRow['tenderType'] = isMember
      ? 'membership_included'
      : hasPackage
        ? 'package_credit'
        : rng.weighted([
            ['card', 0.72],
            ['cash', 0.16],
            ['eft', 0.08],
            ['gift_card', 0.04],
          ] as const);

    const servicePrice =
      serviceTender === 'membership_included' || serviceTender === 'package_credit'
        ? 0
        : Number(serviceRow.price);

    const lines: SaleLineRow[] = [
      {
        id: id('sale-line', `${visitKey}:service`),
        salonId: ctx.salonId,
        saleId,
        customerId: customer.row.id,
        productId: null,
        serviceId: serviceRow.id,
        giftCardId: null,
        staffId: staffRow?.id ?? null,
        quantity: 1,
        unitPrice: money(servicePrice),
        discount: 0,
        lineTotal: money(servicePrice),
        tenderType: serviceTender,
        soldAt: cleaningEndsAt,
        createdAt: cleaningEndsAt,
      },
    ];

    // --- retail attachment (the arc) ---------------------------------------
    const rate = attachmentRate(date, staffSeed?.key ?? 'unassigned');
    if (rng.bool(rate)) {
      const product = rng.weighted(
        ATTACHMENT_CANDIDATES.map((p) => [p, p.velocity] as const),
      );
      const quantity = rng.bool(0.12) ? 2 : 1;
      const lineTotal = money(product.retailPrice * quantity);
      lines.push({
        id: id('sale-line', `${visitKey}:product`),
        salonId: ctx.salonId,
        saleId,
        customerId: customer.row.id,
        productId: id('product', product.sku),
        serviceId: null,
        giftCardId: null,
        staffId: staffRow?.id ?? null,
        quantity,
        unitPrice: money(product.retailPrice),
        discount: 0,
        lineTotal,
        tenderType: rng.weighted([
          ['card', 0.8],
          ['cash', 0.15],
          ['gift_card', 0.05],
        ] as const),
        soldAt: cleaningEndsAt,
        createdAt: cleaningEndsAt,
      });
      out.unitsBySku.set(product.sku, (out.unitsBySku.get(product.sku) ?? 0) + quantity);
    }

    const subtotal = money(lines.reduce((sum, l) => sum + l.lineTotal, 0));
    const tax = money(subtotal * TAX_RATE);
    out.sales.push({
      id: saleId,
      salonId: ctx.salonId,
      visitId,
      customerId: customer.row.id,
      staffId: staffRow?.id ?? null,
      state: 'completed',
      subtotal,
      discount: 0,
      tax,
      total: money(subtotal + tax),
      soldAt: cleaningEndsAt,
      voidedAt: null,
      createdAt: cleaningEndsAt,
    });
    out.saleLines.push(...lines);
  }

  return out;
}

/** Every day of seeded history, oldest first. Day zero itself is included. */
export function historyDays(): DateOnly[] {
  return eachDay(addDays(DAY_ZERO, -HISTORY_DAYS), DAY_ZERO);
}

/** Spray solution consumed per spray session, for `used_in_session` events. */
export const SPRAY_SOLUTION_SKUS = ['BSK-10018', 'BSK-10019', 'BSK-10020'] as const;

export { CATALOGUE, catalogueBySku, CURRENCY, DAY_ZERO, HERO_SALON, TZ };
