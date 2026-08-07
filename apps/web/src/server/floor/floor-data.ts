import 'server-only';

import { addDays, toDateOnly, type DateOnly } from '@bask/core';

import { readFloorClock, type FloorClock } from './demo-clock';
import { prisma } from './prisma';

/**
 * Everything the Floor reads. One module so the whole surface's data contract is
 * reviewable in one place, and so the "Floor speed is sacred" rule has somewhere
 * to live: the expensive shapes (the customer index, the product grid) are read
 * ONCE per page load and filtered in the browser. A front-desk search that waits
 * on a round trip per keystroke is a search that feels broken, no matter how
 * fast the query is.
 */

// ---------------------------------------------------------------------------
// Domain rules, stated once
// ---------------------------------------------------------------------------

/** A signed waiver is good for a year; it goes amber a month out. */
export const WAIVER_VALID_DAYS = 365;
export const WAIVER_WARN_DAYS = 30;

/**
 * Minimum gap between UV sessions. Health Canada and the US FDA both put this at
 * 24 hours for indoor tanning equipment, and it is the one number on the
 * check-in panel that is a safety rule rather than a preference.
 */
export const UV_MIN_HOURS_BETWEEN = 24;

/** Categories that are never sold over the counter (booth consumables). */
const NON_RETAIL_CATEGORIES = new Set(['spray_solution']);

// ---------------------------------------------------------------------------
// Types the client components consume
// ---------------------------------------------------------------------------

export interface CustomerIndexEntry {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  phone: string | null;
  email: string | null;
  /** Lowercased haystack: name + phone digits + email. Built server-side once. */
  search: string;
  membershipTier: string | null;
  membershipStatus: string | null;
}

export interface ServiceOption {
  id: string;
  name: string;
  category: string;
  roomTypeKey: string | null;
  minutes: number;
  price: number;
}

export interface ProductOption {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  category: string | null;
  size: string | null;
  price: number;
  onHand: number;
  barcodes: string[];
}

export interface FloorCatalogue {
  customers: CustomerIndexEntry[];
  services: ServiceOption[];
  products: ProductOption[];
  /** barcode value → product id. Built server-side so a scan resolves instantly. */
  barcodeIndex: Record<string, string>;
}

export interface CustomerCard {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  membership: { tier: string; status: string; paymentState: string } | null;
  lastVisitLabel: string;
  visitsThisMonth: number;
  packageLabel: string | null;
  timing: { verdict: string; tone: 'ok' | 'wait'; detail: string };
  waiver: { tone: 'ok' | 'warn' | 'risk'; label: string; note: string | null };
  /** Repurchase whisper, derived from this customer's own sale lines. */
  upsell: { productId: string; productName: string; note: string } | null;
  suggestedServiceId: string | null;
  balances: { packageCredits: number; giftCardBalance: number; membershipIncluded: boolean };
}

export interface ScheduleBooking {
  id: string;
  startsAt: string;
  endsAt: string;
  minutes: number;
  state: string;
  source: string;
  who: string;
  customerId: string | null;
  serviceId: string | null;
  serviceName: string | null;
  roomId: string | null;
  roomName: string | null;
}

export interface HandoffSummary {
  forDate: DateOnly;
  salesTotal: number;
  saleCount: number;
  retailUnits: number;
  attachmentPct: number;
  checkIns: number;
  sessionsRun: number;
  incidents: { room: string; note: string }[];
  lowStock: { name: string; onHand: number; reorderPoint: number }[];
  tomorrow: { time: string; who: string; service: string }[];
  posted: { note: string | null; postedAt: string } | null;
}

// ---------------------------------------------------------------------------
// Catalogue (loaded once per Floor page load)
// ---------------------------------------------------------------------------

export async function readFloorCatalogue(salonId: string): Promise<FloorCatalogue> {
  const [customers, services, products, levels, barcodes] = await Promise.all([
    prisma.customer.findMany({
      where: { salonId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        memberships: {
          where: { status: 'active' },
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { tier: true, status: true },
        },
      },
    }),
    prisma.service.findMany({
      where: { salonId, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        category: true,
        roomTypeKey: true,
        durationMinutes: true,
        price: true,
      },
    }),
    prisma.product.findMany({
      where: { isActive: true, OR: [{ salonId }, { salonId: null }] },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        sku: true,
        name: true,
        brand: true,
        category: true,
        size: true,
        retailPrice: true,
      },
    }),
    prisma.inventoryLevel.findMany({
      where: { salonId },
      select: { productId: true, onHand: true },
    }),
    prisma.barcode.findMany({
      where: { OR: [{ salonId }, { salonId: null }] },
      select: { productId: true, value: true },
    }),
  ]);

  const onHandByProduct = new Map(levels.map((l) => [l.productId, l.onHand]));
  const codesByProduct = new Map<string, string[]>();
  const barcodeIndex: Record<string, string> = {};
  for (const code of barcodes) {
    barcodeIndex[code.value] = code.productId;
    const list = codesByProduct.get(code.productId);
    if (list) list.push(code.value);
    else codesByProduct.set(code.productId, [code.value]);
  }

  return {
    customers: customers.map((c) => {
      const membership = c.memberships[0] ?? null;
      const digits = (c.phone ?? '').replace(/\D/g, '');
      return {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        initials: initialsOf(c.firstName, c.lastName),
        phone: c.phone,
        email: c.email,
        search:
          `${c.firstName} ${c.lastName} ${digits} ${c.email ?? ''}`.toLowerCase(),
        membershipTier: membership?.tier ?? null,
        membershipStatus: membership?.status ?? null,
      };
    }),
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      roomTypeKey: s.roomTypeKey,
      minutes: s.durationMinutes,
      price: Number(s.price),
    })),
    products: products
      .filter((p) => !NON_RETAIL_CATEGORIES.has(p.category ?? ''))
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        size: p.size,
        price: Number(p.retailPrice),
        onHand: onHandByProduct.get(p.id) ?? 0,
        barcodes: codesByProduct.get(p.id) ?? [],
      })),
    barcodeIndex,
  };
}

// ---------------------------------------------------------------------------
// The check-in card
// ---------------------------------------------------------------------------

export async function readCustomerCard(
  salonId: string,
  customerId: string,
): Promise<CustomerCard | null> {
  const clock = await readFloorClock();
  const now = clock.demoNow;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, salonId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      waiverSignedAt: true,
      lastVisitAt: true,
      memberships: {
        where: { status: { in: ['active', 'frozen'] } },
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: { tier: true, status: true, paymentState: true },
      },
      packages: {
        where: { status: 'active', creditsRemaining: { gt: 0 } },
        orderBy: { purchasedAt: 'desc' },
        take: 1,
        select: {
          creditsTotal: true,
          creditsRemaining: true,
          name: true,
          serviceId: true,
        },
      },
    },
  });
  if (!customer) return null;

  const monthStart = new Date(now.getTime());
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [visitsThisMonth, lastUvSession, saleLines, giftCards] = await Promise.all([
    prisma.visit.count({ where: { salonId, customerId, checkedInAt: { gte: monthStart } } }),
    // UV only. The 24-hour gap is a rule about ultraviolet exposure; a spray
    // tan, a red-light session or a hydromassage yesterday says nothing about
    // whether somebody can tan today, and letting those set the verdict would
    // make the panel refuse sessions for no reason.
    prisma.session.findFirst({
      where: {
        salonId,
        customerId,
        state: { in: ['completed', 'in_session', 'cleaning'] },
        service: { category: 'uv' },
      },
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true, endedAt: true },
    }),
    prisma.saleLine.findMany({
      where: { salonId, customerId, productId: { not: null } },
      orderBy: { soldAt: 'asc' },
      select: { productId: true, soldAt: true, product: { select: { name: true } } },
    }),
    prisma.giftCard.findMany({
      where: { salonId, state: 'active', OR: [{ recipientId: customerId }, { purchaserId: customerId }] },
      select: { balance: true },
    }),
  ]);

  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    initials: initialsOf(customer.firstName, customer.lastName),
    membership: customer.memberships[0]
      ? {
          tier: customer.memberships[0].tier,
          status: customer.memberships[0].status,
          paymentState: customer.memberships[0].paymentState,
        }
      : null,
    lastVisitLabel: relativeDays(customer.lastVisitAt, now),
    visitsThisMonth,
    packageLabel: customer.packages[0]
      ? `${customer.packages[0].creditsRemaining} of ${customer.packages[0].creditsTotal} left`
      : null,
    timing: sessionTiming(lastUvSession?.endedAt ?? lastUvSession?.startedAt ?? null, now),
    waiver: waiverStanding(customer.waiverSignedAt, now),
    upsell: repurchaseWhisper(saleLines, customer.firstName, now),
    suggestedServiceId: customer.packages[0]?.serviceId ?? null,
    balances: {
      packageCredits: customer.packages[0]?.creditsRemaining ?? 0,
      giftCardBalance: giftCards.reduce((sum, g) => sum + Number(g.balance), 0),
      membershipIncluded: (customer.memberships[0]?.status ?? null) === 'active',
    },
  };
}

function initialsOf(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function relativeDays(at: Date | null, now: Date): string {
  if (!at) return 'First visit';
  const days = Math.floor((now.getTime() - at.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? 'About a month ago' : `About ${months} months ago`;
}

/**
 * The session-timing verdict.
 *
 * Stated as a plain-language answer to the question the staffer is actually
 * asking ("can I put them in a bed?"), with the hours as supporting detail —
 * DESIGN_SPEC §5: state the finding, not the feature.
 */
function sessionTiming(lastAt: Date | null, now: Date): CustomerCard['timing'] {
  if (!lastAt) {
    return { verdict: 'Okay to tan', tone: 'ok', detail: 'No previous session on file.' };
  }
  const hours = (now.getTime() - lastAt.getTime()) / 3_600_000;
  if (hours >= UV_MIN_HOURS_BETWEEN) {
    const days = Math.floor(hours / 24);
    return {
      verdict: 'Okay to tan',
      tone: 'ok',
      detail: days >= 1 ? `Last session was ${days === 1 ? 'a day' : `${days} days`} ago.` : 'Enough time has passed since their last session.',
    };
  }
  const wait = Math.max(1, Math.ceil(UV_MIN_HOURS_BETWEEN - hours));
  return {
    verdict: `Wait ${wait}h`,
    tone: 'wait',
    detail: 'Sessions have to be at least 24 hours apart. This is a safety rule, not a setting.',
  };
}

function waiverStanding(signedAt: Date | null, now: Date): CustomerCard['waiver'] {
  if (!signedAt) {
    return {
      tone: 'risk',
      label: 'Not signed',
      note: 'No waiver on file. They need to sign before their first session — it takes about 30 seconds.',
    };
  }
  const daysLeft = WAIVER_VALID_DAYS - Math.floor((now.getTime() - signedAt.getTime()) / 86_400_000);
  if (daysLeft <= 0) {
    return {
      tone: 'risk',
      label: 'Expired',
      note: 'Their waiver has run out. A fresh signature at the desk takes 30 seconds.',
    };
  }
  if (daysLeft <= WAIVER_WARN_DAYS) {
    return {
      tone: 'warn',
      label: `${daysLeft} days left`,
      note: `Their waiver runs out in ${daysLeft} days — a fresh signature now saves a scramble later.`,
    };
  }
  return { tone: 'ok', label: 'On file', note: null };
}

/**
 * The upsell whisper, earned rather than asserted.
 *
 * Only fires when the customer has bought the same product at least twice, and
 * only when they are at or past their own median gap between those purchases.
 * A prompt that fires on everybody is a prompt staff learn to ignore.
 */
function repurchaseWhisper(
  lines: { productId: string | null; soldAt: Date; product: { name: string } | null }[],
  firstName: string,
  now: Date,
): CustomerCard['upsell'] {
  const byProduct = new Map<string, { name: string; dates: Date[] }>();
  for (const line of lines) {
    if (!line.productId || !line.product) continue;
    const entry = byProduct.get(line.productId);
    if (entry) entry.dates.push(line.soldAt);
    else byProduct.set(line.productId, { name: line.product.name, dates: [line.soldAt] });
  }

  let best: { productId: string; productName: string; note: string; overdue: number } | null = null;
  for (const [productId, { name, dates }] of byProduct) {
    if (dates.length < 2) continue;
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i += 1) {
      gaps.push((dates[i]!.getTime() - dates[i - 1]!.getTime()) / 86_400_000);
    }
    gaps.sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)]!;
    if (median < 7) continue; // same-week repeats are not a repurchase rhythm
    const sinceLast = (now.getTime() - dates[dates.length - 1]!.getTime()) / 86_400_000;
    const overdue = sinceLast - median;
    if (overdue < 0) continue;
    if (best && overdue <= best.overdue) continue;
    best = {
      productId,
      productName: name,
      overdue,
      note:
        `${firstName} has bought ${name} ${dates.length} times, about every ` +
        `${Math.round(median)} days. It has been ${Math.round(sinceLast)}.`,
    };
  }
  if (!best) return null;
  return { productId: best.productId, productName: best.productName, note: best.note };
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

export async function readSchedule(
  salonId: string,
  fromDay: DateOnly,
  toDay: DateOnly,
  zone: string,
): Promise<ScheduleBooking[]> {
  const from = new Date(Date.parse(`${fromDay}T00:00:00Z`) - 24 * 3_600_000);
  const to = new Date(Date.parse(`${addDays(toDay, 1)}T00:00:00Z`) + 24 * 3_600_000);
  const rows = await prisma.booking.findMany({
    where: { salonId, startsAt: { gte: from, lt: to } },
    orderBy: { startsAt: 'asc' },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      minutes: true,
      state: true,
      source: true,
      guestName: true,
      customerId: true,
      serviceId: true,
      roomId: true,
      customer: { select: { firstName: true, lastName: true } },
      service: { select: { name: true } },
      room: { select: { name: true } },
    },
  });
  void zone;
  return rows.map((b) => ({
    id: b.id,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt.toISOString(),
    minutes: b.minutes,
    state: b.state,
    source: b.source,
    who: b.customer
      ? `${b.customer.firstName} ${b.customer.lastName.charAt(0)}.`
      : (b.guestName ?? 'Walk-in'),
    customerId: b.customerId,
    serviceId: b.serviceId,
    serviceName: b.service?.name ?? null,
    roomId: b.roomId,
    roomName: b.room?.name ?? null,
  }));
}

/**
 * Bookings for the demo window, created once and then owned by the app.
 *
 * NOT part of `packages/db/fixtures`, deliberately: adding rows there would move
 * the `demo:reset` checksum that the determinism test pins, and the schedule is
 * a Floor concern rather than a story-arc one. Idempotent on `(salonId, day)` —
 * it only fills a day that has no bookings at all, so a rebooking made in the
 * demo is never overwritten by a page refresh.
 */
export async function ensureBookings(salonId: string, clock: FloorClock): Promise<number> {
  const days: DateOnly[] = [];
  for (let i = -2; i <= 7; i += 1) days.push(addDays(clock.today, i));

  const existing = await prisma.booking.findMany({
    where: {
      salonId,
      startsAt: {
        gte: new Date(Date.parse(`${days[0]!}T00:00:00Z`) - 24 * 3_600_000),
        lt: new Date(Date.parse(`${addDays(days[days.length - 1]!, 1)}T00:00:00Z`) + 24 * 3_600_000),
      },
    },
    select: { startsAt: true },
  });
  const filled = new Set(existing.map((b) => toDateOnly(b.startsAt, clock.zone)));
  const missing = days.filter((d) => !filled.has(d));
  if (missing.length === 0) return 0;

  const [services, rooms, customers] = await Promise.all([
    prisma.service.findMany({
      where: { salonId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, durationMinutes: true, roomTypeKey: true },
    }),
    prisma.room.findMany({
      where: { salonId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, roomTypeKey: true },
    }),
    prisma.customer.findMany({
      where: { salonId, status: 'active' },
      orderBy: { lastName: 'asc' },
      take: 160,
      select: { id: true },
    }),
  ]);
  if (services.length === 0 || rooms.length === 0) return 0;

  // Deterministic from the day string, so two tabs opening at once cannot
  // disagree about what Tuesday looks like.
  const data: {
    salonId: string;
    customerId: string | null;
    serviceId: string;
    roomId: string | null;
    source: 'walk_in' | 'online_booking' | 'appointment';
    state: 'booked' | 'completed';
    startsAt: Date;
    endsAt: Date;
    minutes: number;
    guestName: string | null;
  }[] = [];

  for (const day of missing) {
    let seed = hash(`${salonId}:${day}`);
    const next = () => {
      seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
      return seed / 4_294_967_296;
    };
    const count = 14 + Math.floor(next() * 8);
    for (let i = 0; i < count; i += 1) {
      const service = services[Math.floor(next() * services.length)]!;
      const candidates = rooms.filter((r) => r.roomTypeKey === service.roomTypeKey);
      const room = candidates.length
        ? candidates[Math.floor(next() * candidates.length)]!
        : rooms[Math.floor(next() * rooms.length)]!;
      const hour = 9 + Math.floor(next() * 11);
      const minute = [0, 15, 30, 45][Math.floor(next() * 4)]!;
      const startsAt = new Date(
        Date.parse(`${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`) +
          7 * 3_600_000, // salon-local → UTC (Pacific daylight time)
      );
      const walkIn = next() < 0.35;
      data.push({
        salonId,
        customerId: walkIn || customers.length === 0
          ? null
          : customers[Math.floor(next() * customers.length)]!.id,
        serviceId: service.id,
        roomId: room.id,
        source: walkIn ? 'walk_in' : 'online_booking',
        state: day < clock.today ? 'completed' : 'booked',
        startsAt,
        endsAt: new Date(startsAt.getTime() + service.durationMinutes * 60_000),
        minutes: service.durationMinutes,
        guestName: walkIn ? 'Walk-in' : null,
      });
    }
  }

  await prisma.booking.createMany({ data });
  return data.length;
}

function hash(value: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Shift handoff
// ---------------------------------------------------------------------------

export async function readHandoff(salonId: string, clock: FloorClock): Promise<HandoffSummary> {
  const dayStart = new Date(Date.parse(`${clock.today}T00:00:00Z`) + 7 * 3_600_000);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const tomorrowStart = dayEnd;
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 86_400_000);

  const [sales, lines, checkIns, sessionsRun, faultRooms, lowStock, tomorrow, posted] =
    await Promise.all([
      prisma.sale.findMany({
        where: { salonId, state: 'completed', soldAt: { gte: dayStart, lt: dayEnd } },
        select: { total: true },
      }),
      prisma.saleLine.findMany({
        where: { salonId, soldAt: { gte: dayStart, lt: dayEnd }, productId: { not: null } },
        select: { quantity: true, saleId: true },
      }),
      prisma.visit.count({ where: { salonId, checkedInAt: { gte: dayStart, lt: dayEnd } } }),
      prisma.session.count({
        where: { salonId, startedAt: { gte: dayStart, lt: dayEnd } },
      }),
      prisma.room.findMany({
        where: { salonId, state: 'maintenance' },
        select: { name: true, maintenanceNote: true },
      }),
      prisma.inventoryLevel.findMany({
        where: { salonId },
        select: { onHand: true, reorderPoint: true, product: { select: { name: true } } },
      }),
      prisma.booking.findMany({
        where: {
          salonId,
          state: { in: ['booked', 'arrived'] },
          startsAt: { gte: tomorrowStart, lt: tomorrowEnd },
        },
        orderBy: { startsAt: 'asc' },
        take: 3,
        select: {
          startsAt: true,
          guestName: true,
          customer: { select: { firstName: true, lastName: true } },
          service: { select: { name: true } },
        },
      }),
      prisma.shiftHandoff.findFirst({
        where: { salonId, forDate: new Date(`${clock.today}T00:00:00Z`), postedAt: { not: null } },
        orderBy: { postedAt: 'desc' },
        select: { note: true, postedAt: true },
      }),
    ]);

  const salesTotal = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const retailUnits = lines.reduce((sum, l) => sum + l.quantity, 0);
  const salesWithRetail = new Set(lines.map((l) => l.saleId)).size;

  return {
    forDate: clock.today,
    salesTotal,
    saleCount: sales.length,
    retailUnits,
    attachmentPct: sales.length === 0 ? 0 : Math.round((salesWithRetail / sales.length) * 100),
    checkIns,
    sessionsRun,
    incidents: faultRooms.map((r) => ({
      room: r.name,
      note: r.maintenanceNote ?? 'Out of service.',
    })),
    lowStock: lowStock
      .filter((l) => l.reorderPoint > 0 && l.onHand <= l.reorderPoint)
      .slice(0, 5)
      .map((l) => ({ name: l.product.name, onHand: l.onHand, reorderPoint: l.reorderPoint })),
    tomorrow: tomorrow.map((b) => ({
      time: b.startsAt.toLocaleTimeString('en-CA', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: clock.zone,
      }),
      who: b.customer
        ? `${b.customer.firstName} ${b.customer.lastName.charAt(0)}.`
        : (b.guestName ?? 'Walk-in'),
      service: b.service?.name ?? 'Session',
    })),
    posted: posted?.postedAt
      ? { note: posted.note, postedAt: posted.postedAt.toISOString() }
      : null,
  };
}

export { readFloorClock };
export type { FloorClock };
