/**
 * Metric rollups — turn rows into `SalonFacts` for the insight engine.
 *
 * Deliberately built over *plain row arrays* rather than a Prisma query, for
 * two reasons: the same code then serves the Prisma adapter and the in-memory
 * arc tests, and nothing about "how we compute attachment" is buried inside a
 * SQL string where it cannot be unit-tested.
 *
 * Sell-through, days-remaining and utilisation are all computed here and never
 * stored as truth (IMPLEMENTATION_SPEC §2).
 */

import {
  addDays,
  dayOfWeek,
  diffDays,
  toDateOnly,
  type DateOnly,
  type SalonFacts,
  type SlotAttachmentFacts,
  type StaffAttachmentFacts,
  type CapacitySlotFacts,
  type ProductStockFacts,
  type CategoryTrendFacts,
  type FailedMembershipFacts,
  type DailyPoint,
  daypartForHour,
} from '@bask/core';

/** Measurement windows. See `ARCS.attachment` for why 14/28 and not 21/21. */
export const WINDOWS = {
  /** Current window — the flat floor of the attachment arc. */
  currentDays: 14,
  /** Baseline window, immediately before the current one. */
  baselineDays: 28,
  /** Window for capacity, stock velocity and category trends. */
  analysisDays: 28,
  /** Trailing window used for product velocity. */
  velocityDays: 30,
} as const;

// Minimal structural row types — narrower than Prisma's, so this module works
// on fixture rows and query results alike.
export interface FactVisit {
  id: string;
  customerId: string;
  staffId: string | null;
  checkedInAt: Date;
}
export interface FactSession {
  id: string;
  roomId: string;
  serviceId: string | null;
  visitId: string | null;
  startedAt: Date | null;
}
export interface FactSaleLine {
  id: string;
  saleId: string;
  customerId: string | null;
  productId: string | null;
  serviceId: string | null;
  staffId: string | null;
  quantity: number;
  lineTotal: number | { toString(): string };
  soldAt: Date;
}
export interface FactSale {
  id: string;
  visitId: string | null;
  total: number | { toString(): string };
  soldAt: Date;
}
export interface FactStaff {
  id: string;
  firstName: string;
  lastName: string;
}
export interface FactProduct {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  retailPrice: number | { toString(): string };
  wholesaleCost: number | { toString(): string } | null;
}
export interface FactInventory {
  productId: string;
  onHand: number;
  reorderPoint: number;
  parLevel: number | null;
}
export interface FactMembership {
  id: string;
  customerId: string;
  tier: string;
  status: string;
  paymentState: string;
  monthlyPrice: number | { toString(): string };
  failedPaymentCount: number;
  lastPaymentAt: Date | null;
}
export interface FactCustomer {
  id: string;
  firstName: string;
  lastName: string;
  lastVisitAt: Date | null;
}
export interface FactService {
  id: string;
  name: string;
  category: string;
}
export interface FactRoom {
  id: string;
  isActive: boolean;
}
export interface FactStockEvent {
  productId: string;
  type: string;
  quantityDelta: number;
  occurredAt: Date;
}

export interface FactsInput {
  salonId: string;
  salonName: string;
  today: DateOnly;
  currency: string;
  timezone: string;
  /** `[open, close)` per weekday, 0 = Sunday. */
  openHours: ReadonlyArray<readonly [number, number]>;
  slotsPerRoomHour: number;
  visits: FactVisit[];
  sessions: FactSession[];
  sales: FactSale[];
  saleLines: FactSaleLine[];
  staff: FactStaff[];
  customers: FactCustomer[];
  memberships: FactMembership[];
  products: FactProduct[];
  inventory: FactInventory[];
  services: FactService[];
  rooms: FactRoom[];
  /**
   * Consumption that never crosses the till — spray solution used in a booth,
   * write-offs. Without these, every back-bar item reads as dead stock.
   */
  stockEvents?: FactStockEvent[];
  /**
   * Hour of the salon-local morning that "Today so far" is measured up to.
   * Daybreak is a morning brief; a full day's revenue under a card headed
   * "Today so far" would be a lie the owner can catch.
   */
  pulseAsOfHour?: number;
}

function num(value: number | { toString(): string } | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value.toString());
}

/** Salon-local hour of an instant. */
function localHour(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    hour: '2-digit',
  }).formatToParts(instant);
  return Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
}

export function buildFacts(input: FactsInput): SalonFacts {
  const { today, timezone } = input;

  const currentStart = addDays(today, -WINDOWS.currentDays);
  const baselineStart = addDays(today, -(WINDOWS.currentDays + WINDOWS.baselineDays));
  const analysisStart = addDays(today, -WINDOWS.analysisDays);
  const velocityStart = addDays(today, -WINDOWS.velocityDays);

  const dayOf = (instant: Date): DateOnly => toDateOnly(instant, timezone);
  const inWindow = (instant: Date, startExclusive: DateOnly, endExclusive: DateOnly): boolean => {
    const d = dayOf(instant);
    return d >= startExclusive && d < endExclusive;
  };

  // --- attachment ----------------------------------------------------------
  // A visit "attached" when its sale carried at least one product line.
  const productLinesBySale = new Map<string, FactSaleLine[]>();
  for (const line of input.saleLines) {
    if (!line.productId) continue;
    const list = productLinesBySale.get(line.saleId) ?? [];
    list.push(line);
    productLinesBySale.set(line.saleId, list);
  }
  const saleByVisit = new Map<string, FactSale>();
  for (const sale of input.sales) {
    if (sale.visitId) saleByVisit.set(sale.visitId, sale);
  }

  interface VisitFact {
    date: DateOnly;
    hour: number;
    staffId: string | null;
    attached: boolean;
    productRevenue: number;
  }
  const visitFacts: VisitFact[] = input.visits.map((visit) => {
    const sale = saleByVisit.get(visit.id);
    const lines = sale ? (productLinesBySale.get(sale.id) ?? []) : [];
    return {
      date: dayOf(visit.checkedInAt),
      hour: localHour(visit.checkedInAt, timezone),
      staffId: visit.staffId,
      attached: lines.length > 0,
      productRevenue: lines.reduce((sum, l) => sum + num(l.lineTotal), 0),
    };
  });

  const currentVisits = visitFacts.filter((v) => v.date >= currentStart && v.date < today);
  const baselineVisits = visitFacts.filter((v) => v.date >= baselineStart && v.date < currentStart);

  const rate = (list: VisitFact[]): number =>
    list.length === 0 ? 0 : (list.filter((v) => v.attached).length / list.length) * 100;

  const attachedCurrent = currentVisits.filter((v) => v.attached);
  const averageAttachedSpend =
    attachedCurrent.length === 0
      ? 0
      : attachedCurrent.reduce((sum, v) => sum + v.productRevenue, 0) / attachedCurrent.length;

  // Daily series for the sparkline.
  const dailyMap = new Map<DateOnly, { total: number; attached: number }>();
  for (const v of visitFacts) {
    if (v.date < analysisStart || v.date >= today) continue;
    const entry = dailyMap.get(v.date) ?? { total: 0, attached: 0 };
    entry.total += 1;
    if (v.attached) entry.attached += 1;
    dailyMap.set(v.date, entry);
  }
  const daily: DailyPoint[] = [...dailyMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([at, e]) => ({ at, value: e.total === 0 ? 0 : (e.attached / e.total) * 100 }));

  const staffById = new Map(input.staff.map((s) => [s.id, s]));
  const byStaff: StaffAttachmentFacts[] = [...staffById.values()]
    .map((s) => {
      const cur = currentVisits.filter((v) => v.staffId === s.id);
      const base = baselineVisits.filter((v) => v.staffId === s.id);
      return {
        staffId: s.id,
        name: s.firstName,
        currentRate: rate(cur),
        baselineRate: rate(base),
        currentVisits: cur.length,
        baselineVisits: base.length,
      };
    })
    .filter((s) => s.currentVisits > 0 || s.baselineVisits > 0);

  const slotKey = (v: VisitFact) => `${dayOfWeek(v.date)}:${daypartForHour(v.hour)}`;
  const slotIds = new Set([...currentVisits, ...baselineVisits].map(slotKey));
  const bySlot: SlotAttachmentFacts[] = [...slotIds].map((key) => {
    const [weekdayRaw, daypart] = key.split(':') as [string, SlotAttachmentFacts['daypart']];
    const weekday = Number(weekdayRaw);
    const cur = currentVisits.filter((v) => slotKey(v) === key);
    const base = baselineVisits.filter((v) => slotKey(v) === key);
    return {
      weekday,
      daypart,
      currentRate: rate(cur),
      baselineRate: rate(base),
      visits: cur.length,
    };
  });

  // --- failed payments -----------------------------------------------------
  const customerById = new Map(input.customers.map((c) => [c.id, c]));
  const failed: FailedMembershipFacts[] = input.memberships
    .filter((m) => m.paymentState === 'failed' && m.status !== 'cancelled')
    .map((m) => {
      const customer = customerById.get(m.customerId);
      const daysSinceLastVisit = customer?.lastVisitAt
        ? diffDays(dayOf(customer.lastVisitAt), today)
        : null;
      return {
        membershipId: m.id,
        customerId: m.customerId,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
        tier: m.tier,
        monthlyPrice: num(m.monthlyPrice),
        failedAttempts: m.failedPaymentCount,
        daysSinceFailure: m.lastPaymentAt ? diffDays(dayOf(m.lastPaymentAt), today) : 0,
        daysSinceLastVisit,
        // A single failed attempt means the account was healthy until now —
        // which is what "has recovered before" means operationally.
        hasRecoveredBefore: m.failedPaymentCount <= 2,
      };
    });

  // --- capacity ------------------------------------------------------------
  const activeRooms = input.rooms.filter((r) => r.isActive).length || input.rooms.length;
  const sessionByVisit = new Map<string, FactSession>();
  for (const s of input.sessions) {
    if (s.visitId) sessionByVisit.set(s.visitId, s);
  }
  const serviceById = new Map(input.services.map((s) => [s.id, s]));
  const priceByService = new Map<string, { revenue: number; count: number }>();
  for (const line of input.saleLines) {
    if (!line.serviceId) continue;
    const e = priceByService.get(line.serviceId) ?? { revenue: 0, count: 0 };
    e.revenue += num(line.lineTotal);
    e.count += 1;
    priceByService.set(line.serviceId, e);
  }

  const slotCounts = new Map<string, number>();
  for (const v of visitFacts) {
    if (v.date < analysisStart || v.date >= today) continue;
    const key = `${dayOfWeek(v.date)}:${v.hour}`;
    slotCounts.set(key, (slotCounts.get(key) ?? 0) + 1);
  }

  // How many times each weekday-hour occurred inside the analysis window.
  const occurrences = new Map<string, number>();
  for (let i = 1; i <= WINDOWS.analysisDays; i += 1) {
    const date = addDays(today, -i);
    const weekday = dayOfWeek(date);
    const [open, close] = input.openHours[weekday]!;
    for (let hour = open; hour < close; hour += 1) {
      const key = `${weekday}:${hour}`;
      occurrences.set(key, (occurrences.get(key) ?? 0) + 1);
    }
  }

  // Mean revenue a filled session brings in — the value of an empty slot.
  const totalServiceRevenue = [...priceByService.values()].reduce((s, e) => s + e.revenue, 0);
  const totalServiceLines = [...priceByService.values()].reduce((s, e) => s + e.count, 0);
  // Membership and package visits ring $0, so a straight average understates
  // what a filled slot is worth. Use the paid-visit average instead.
  const paidLines = input.saleLines.filter((l) => l.serviceId && num(l.lineTotal) > 0);
  const averageSessionValue =
    paidLines.length > 0
      ? paidLines.reduce((s, l) => s + num(l.lineTotal), 0) / paidLines.length
      : totalServiceLines > 0
        ? totalServiceRevenue / totalServiceLines
        : 0;

  const slots: CapacitySlotFacts[] = [...occurrences.entries()].map(([key, occurrence]) => {
    const [weekdayRaw, hourRaw] = key.split(':');
    const sessionsRun = slotCounts.get(key) ?? 0;
    const sessionsPossible = Math.round(activeRooms * input.slotsPerRoomHour * occurrence);
    return {
      weekday: Number(weekdayRaw),
      hour: Number(hourRaw),
      sessionsRun,
      sessionsPossible,
      utilisation: sessionsPossible === 0 ? 0 : (sessionsRun / sessionsPossible) * 100,
      averageSessionValue,
    };
  });

  // --- stock ---------------------------------------------------------------
  const inventoryByProduct = new Map(input.inventory.map((i) => [i.productId, i]));
  const stock: ProductStockFacts[] = input.products
    .filter((p) => inventoryByProduct.has(p.id))
    .map((p) => {
      const inv = inventoryByProduct.get(p.id)!;
      const lines = input.saleLines.filter((l) => l.productId === p.id);
      const windowLines = lines.filter((l) => inWindow(l.soldAt, velocityStart, today));
      const unitsSold = windowLines.reduce((sum, l) => sum + l.quantity, 0);

      // Back-bar consumption counts as movement. A booth solution that is used
      // every week is not overstock just because it never rings through a till.
      const consumption = (input.stockEvents ?? [])
        .filter(
          (e) =>
            e.productId === p.id &&
            e.type === 'used_in_session' &&
            inWindow(e.occurredAt, velocityStart, today),
        )
        .reduce((sum, e) => sum + Math.abs(e.quantityDelta), 0);

      const unitsSoldInWindow = unitsSold + consumption;
      const dailyVelocity = unitsSoldInWindow / WINDOWS.velocityDays;
      const lastMovement = [
        ...lines.map((l) => l.soldAt),
        ...(input.stockEvents ?? [])
          .filter((e) => e.productId === p.id && e.type === 'used_in_session')
          .map((e) => e.occurredAt),
      ];
      const lastSale = lastMovement.reduce<Date | null>(
        (latest, at) => (latest === null || at > latest ? at : latest),
        null,
      );
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        onHand: inv.onHand,
        reorderPoint: inv.reorderPoint,
        parLevel: inv.parLevel,
        retailPrice: num(p.retailPrice),
        wholesaleCost: p.wholesaleCost === null ? null : num(p.wholesaleCost),
        dailyVelocity,
        daysRemaining: dailyVelocity > 0 ? inv.onHand / dailyVelocity : null,
        unitsSoldInWindow,
        daysSinceLastSale: lastSale ? diffDays(dayOf(lastSale), today) : null,
      };
    });

  // --- category trends -----------------------------------------------------
  const half = Math.round(WINDOWS.analysisDays / 2);
  const trendCurrentStart = addDays(today, -half);
  const trendBaselineStart = addDays(today, -half * 2);
  const categoryOf = (serviceId: string | null): string | null =>
    serviceId ? (serviceById.get(serviceId)?.category ?? null) : null;

  const trendMap = new Map<string, CategoryTrendFacts>();
  for (const line of input.saleLines) {
    const category = categoryOf(line.serviceId);
    if (!category) continue;
    const date = dayOf(line.soldAt);
    const entry =
      trendMap.get(category) ??
      ({
        key: category,
        label: CATEGORY_LABELS[category] ?? category,
        currentCount: 0,
        baselineCount: 0,
        currentRevenue: 0,
        baselineRevenue: 0,
      } satisfies CategoryTrendFacts);
    if (date >= trendCurrentStart && date < today) {
      entry.currentCount += 1;
      entry.currentRevenue += num(line.lineTotal);
    } else if (date >= trendBaselineStart && date < trendCurrentStart) {
      entry.baselineCount += 1;
      entry.baselineRevenue += num(line.lineTotal);
    }
    trendMap.set(category, entry);
  }

  // --- pulse ---------------------------------------------------------------
  // "Today so far" is measured up to the morning hour the owner reads the brief.
  const asOfHour = input.pulseAsOfHour ?? 11;
  const beforeCutoff = (instant: Date) => localHour(instant, timezone) < asOfHour;

  const todaySales = input.sales.filter((s) => dayOf(s.soldAt) === today && beforeCutoff(s.soldAt));
  const todayWeekday = dayOfWeek(today);

  // Compared against the same partial window on the same weekday, or "on pace"
  // would compare a morning to a full day and never light up.
  const sameWeekdayPartial = input.sales.filter((s) => {
    const d = dayOf(s.soldAt);
    return d < today && d >= analysisStart && dayOfWeek(d) === todayWeekday && beforeCutoff(s.soldAt);
  });
  const sameWeekdayPartialDays = new Set(sameWeekdayPartial.map((s) => dayOf(s.soldAt))).size;

  // The headline is about yesterday — a finished day.
  const yesterday = addDays(today, -1);
  const yesterdayWeekday = dayOfWeek(yesterday);
  const yesterdaySales = input.sales.filter((s) => dayOf(s.soldAt) === yesterday);
  const yesterdayPeers = input.sales.filter((s) => {
    const d = dayOf(s.soldAt);
    return d < yesterday && d >= analysisStart && dayOfWeek(d) === yesterdayWeekday;
  });
  const yesterdayPeerDays = new Set(yesterdayPeers.map((s) => dayOf(s.soldAt))).size;

  const activeMemberships = input.memberships.filter(
    (m) => m.status === 'active' && m.paymentState !== 'failed',
  );

  const facts: SalonFacts = {
    salonId: input.salonId,
    salonName: input.salonName,
    today,
    currency: input.currency,
    windowDays: WINDOWS.analysisDays,
    attachment: {
      daily,
      currentRate: rate(currentVisits),
      currentVisits: currentVisits.length,
      currentDays: WINDOWS.currentDays,
      baselineRate: rate(baselineVisits),
      baselineVisits: baselineVisits.length,
      baselineDays: WINDOWS.baselineDays,
      averageAttachedSpend,
      visitsPerDay: currentVisits.length / WINDOWS.currentDays,
      byStaff,
      bySlot,
    },
    failedPayments: { memberships: failed },
    capacity: {
      openHours: { start: input.openHours[1]![0], end: input.openHours[1]![1] },
      roomCount: activeRooms,
      slots,
    },
    stock,
    categoryTrends: [...trendMap.values()],
    pulse: {
      revenueToday: todaySales.reduce((sum, s) => sum + num(s.total), 0),
      revenueTypicalForWeekday:
        sameWeekdayPartialDays === 0
          ? 0
          : sameWeekdayPartial.reduce((sum, s) => sum + num(s.total), 0) / sameWeekdayPartialDays,
      revenueYesterday: yesterdaySales.reduce((sum, s) => sum + num(s.total), 0),
      revenueTypicalForYesterdayWeekday:
        yesterdayPeerDays === 0
          ? 0
          : yesterdayPeers.reduce((sum, s) => sum + num(s.total), 0) / yesterdayPeerDays,
      bookingsToday: input.visits.filter(
        (v) => dayOf(v.checkedInAt) === today && beforeCutoff(v.checkedInAt),
      ).length,
      inSalonNow: 0,
      roomsInUse: 0,
      roomsTotal: input.rooms.length,
      activeMembers: activeMemberships.length,
      membershipRevenueMonthly: activeMemberships.reduce((s, m) => s + num(m.monthlyPrice), 0),
    },
  };

  return facts;
}

const CATEGORY_LABELS: Record<string, string> = {
  uv: 'UV sessions',
  spray: 'Spray tans',
  wellness: 'Wellness sessions',
};
