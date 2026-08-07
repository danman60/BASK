/**
 * `SalonFacts` — the rolled-up numbers the rules engine reasons over.
 *
 * Deliberately plain data with zero Prisma types: `packages/core` stays
 * isomorphic (server, web, mobile) and the engine stays unit-testable without a
 * database. `packages/db` owns the query that produces this shape; this file
 * owns what the shape *is*.
 *
 * Rollups are computed, never stored as truth (IMPLEMENTATION_SPEC §2 — the
 * same rule that governs sell-through and days-remaining).
 */

import type { DateOnly } from '../clock';

/** A value measured on a single day. */
export interface DailyPoint {
  at: DateOnly;
  value: number;
}

/** Retail attachment: what share of visits included a product sale. */
export interface AttachmentFacts {
  /** Daily attachment rate as a percent, oldest → newest. */
  daily: DailyPoint[];
  /** Recent window rate (percent). */
  currentRate: number;
  currentVisits: number;
  currentDays: number;
  /** Prior window rate (percent) — the baseline the slip is measured against. */
  baselineRate: number;
  baselineVisits: number;
  baselineDays: number;
  /** Average product revenue per attached visit, for impact maths. */
  averageAttachedSpend: number;
  /** Total visits per day in the current window, for the same maths. */
  visitsPerDay: number;
  /** Per-staff breakdown over the current window. */
  byStaff: StaffAttachmentFacts[];
  /** Weekday+daypart concentrations, e.g. `Tuesday evening`. */
  bySlot: SlotAttachmentFacts[];
}

export interface StaffAttachmentFacts {
  staffId: string;
  name: string;
  currentRate: number;
  baselineRate: number;
  currentVisits: number;
  baselineVisits: number;
}

export interface SlotAttachmentFacts {
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  daypart: 'morning' | 'afternoon' | 'evening';
  currentRate: number;
  baselineRate: number;
  visits: number;
}

/** Memberships whose payment did not go through. */
export interface FailedPaymentFacts {
  memberships: FailedMembershipFacts[];
}

export interface FailedMembershipFacts {
  membershipId: string;
  customerId: string;
  customerName: string;
  tier: string;
  monthlyPrice: number;
  failedAttempts: number;
  /** Days since the failure. */
  daysSinceFailure: number;
  /** Days since the customer last walked in; null when they never have. */
  daysSinceLastVisit: number | null;
  /** They have bounced and come back before — a strong recovery signal. */
  hasRecoveredBefore: boolean;
}

/** Room-hour utilisation, for finding chronically soft windows. */
export interface CapacityFacts {
  /** Bookable hours per day the salon is open. */
  openHours: { start: number; end: number };
  roomCount: number;
  slots: CapacitySlotFacts[];
}

export interface CapacitySlotFacts {
  weekday: number;
  /** Hour of day, salon-local, 24h. */
  hour: number;
  /** Sessions actually run in this slot over the window. */
  sessionsRun: number;
  /** Sessions that could have run (rooms × occurrences of this slot). */
  sessionsPossible: number;
  /** `sessionsRun / sessionsPossible`, as a percent. */
  utilisation: number;
  /** Average revenue a filled session in this slot brings in. */
  averageSessionValue: number;
}

/** Inventory position for one product at one salon. */
export interface ProductStockFacts {
  productId: string;
  sku: string;
  name: string;
  category: string | null;
  onHand: number;
  reorderPoint: number;
  parLevel: number | null;
  retailPrice: number;
  wholesaleCost: number | null;
  /** Units sold per day over the trailing window. */
  dailyVelocity: number;
  /** `onHand / dailyVelocity`; null when velocity is zero. */
  daysRemaining: number | null;
  /** Units sold in the trailing window. */
  unitsSoldInWindow: number;
  /** Days since the last unit moved; null when it never has. */
  daysSinceLastSale: number | null;
}

/** A service category's trend — the "spray tans +22%" beat. */
export interface CategoryTrendFacts {
  key: string;
  label: string;
  currentCount: number;
  baselineCount: number;
  currentRevenue: number;
  baselineRevenue: number;
}

/** Headline numbers for the "Today so far" pulse card (DESIGN_SPEC §3.1). */
export interface PulseFacts {
  /**
   * Revenue *so far today*. The owner reads Daybreak mid-morning, so this is a
   * partial number by design — the rail card is literally headed "Today so far".
   */
  revenueToday: number;
  /** Same weekday, trailing average of the same partial window. "on pace". */
  revenueTypicalForWeekday: number;
  /**
   * Yesterday's full-day revenue. The Daybreak headline is about yesterday
   * ("Yesterday finished 8% above your usual Thursday"), never about a day
   * that has barely started.
   */
  revenueYesterday: number;
  /** Trailing average for *yesterday's* weekday — what the headline compares to. */
  revenueTypicalForYesterdayWeekday: number;
  bookingsToday: number;
  inSalonNow: number;
  roomsInUse: number;
  roomsTotal: number;
  activeMembers: number;
  membershipRevenueMonthly: number;
}

/** Everything a sweep needs for one salon on one virtual day. */
export interface SalonFacts {
  salonId: string;
  salonName: string;
  today: DateOnly;
  currency: string;
  windowDays: number;
  attachment: AttachmentFacts;
  failedPayments: FailedPaymentFacts;
  capacity: CapacityFacts;
  stock: ProductStockFacts[];
  categoryTrends: CategoryTrendFacts[];
  pulse: PulseFacts;
}

export const DAYPART_LABELS: Record<SlotAttachmentFacts['daypart'], string> = {
  morning: 'morning',
  afternoon: 'afternoon',
  evening: 'evening',
};

export function daypartForHour(hour: number): SlotAttachmentFacts['daypart'] {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
