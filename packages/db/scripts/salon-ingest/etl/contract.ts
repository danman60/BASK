/**
 * ETL contract — UVALUX practice dataset (canonical CSVs) → Bask insert shapes.
 *
 * Supervisor-written, task zero. Every mapper imports from here and nothing
 * else; no mapper redefines an enum map, an id remap, or a parse helper.
 *
 * Mappers are PURE: `(rows) => Input[]`. They touch no database and no disk —
 * the orchestrator (run.ts, supervisor) reads the CSVs, calls the mappers, and
 * does the gated insert into @bask/db. IDs are remapped deterministically so a
 * foreign key computed in one mapper matches the row another mapper produced,
 * with no shared runtime state.
 */
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';

/* ---- deterministic id remap (source id → stable UUIDv5-style) ------------- */

// Fixed namespace → reproducible ids across runs. Overridable per dataset so a
// second source (the real SalonTouch file) cannot collide with the practice
// load's ids in the shared bask schema. Default is unchanged, so the practice
// dataset still reproduces exactly.
const NS = process.env.INGEST_NS || 'uvalux-practice-2026';

/** Deterministic UUID for a source key. Same (prefix, srcId) → same uuid, always. */
export function remapId(prefix: string, srcId: string): string {
  const h = createHash('sha1').update(`${NS}:${prefix}:${srcId}`).digest('hex');
  // format 32 hex chars as a v5 uuid (version nibble 5, variant nibble 8-b)
  return (
    `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-` +
    `${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`
  );
}

/* ---- CSV + scalar parsing ------------------------------------------------- */

/** Minimal quote-aware CSV → array of row objects. Used by the orchestrator. */
export function readCsv(absPath: string): Record<string, string>[] {
  const text = fs.readFileSync(absPath, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  if (!lines.length) return [];
  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const header = split(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = split(l);
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
  });
}

/** '' → null; otherwise a Date. */
export function parseDate(v: string | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** '' → 0; otherwise a number. */
export function num(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/** 'True'/'true'/'1'/'yes' → true; everything else → false. */
export function bool(v: string | undefined): boolean {
  return /^(true|1|yes|y)$/i.test((v ?? '').trim());
}

/* ---- enum maps (source string → Bask enum value) -------------------------- */

export const STAFF_ROLE: Record<string, string> = {
  owner: 'owner',
  manager: 'manager',
  front_desk: 'front_desk',
  staff: 'staff',
};
export function staffRole(src: string): string {
  return STAFF_ROLE[(src || '').toLowerCase()] ?? 'staff';
}

export const SALON_STATUS = 'active'; // all practice salons are operating

export function bookingState(status: string, noShow: boolean): string {
  if (noShow) return 'no_show';
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 'completed';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'arrived') return 'arrived';
  return 'booked';
}

/** Visit source: a walk-in flag wins; otherwise it came through a booking. */
export function visitSource(walkIn: boolean): string {
  return walkIn ? 'walk_in' : 'appointment';
}

export function membershipStatus(src: string): string {
  const s = (src || '').toLowerCase();
  if (s === 'frozen') return 'frozen';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  return 'active';
}

export const TENDER: Record<string, string> = {
  cash: 'cash',
  card: 'card',
  credit: 'card',
  debit: 'card',
  eft: 'eft',
  gift_card: 'gift_card',
  giftcard: 'gift_card',
};
export function tenderType(src: string): string {
  return TENDER[(src || '').toLowerCase()] ?? 'card';
}

/* ---- Bask insert shapes (the subset of columns the load writes) ----------- */

export interface OrgInput { id: string; name: string; slug: string; }

export interface SalonInput {
  id: string; orgId: string; name: string; slug: string;
  status: string; country: string; timezone: string; theme: string;
}

export interface StaffInput {
  id: string; salonId: string; firstName: string; lastName: string;
  role: string; permissions: Record<string, unknown>; shiftPattern: Record<string, unknown>;
  isActive: boolean; hiredAt: Date | null;
}

export interface CustomerInput {
  id: string; salonId: string; firstName: string; lastName: string;
  status: string; emailOptIn: boolean; smsOptIn: boolean; photoConsent: boolean;
  joinedAt: Date; lastVisitAt: Date | null;
}

export interface ProductInput {
  id: string; sku: string; name: string; brand: string | null; category: string | null;
  retailPrice: number; wholesaleCost: number | null; isActive: boolean;
}

export interface InventoryLevelInput {
  id: string; salonId: string; productId: string; onHand: number; reorderPoint: number;
}

export interface MembershipInput {
  id: string; salonId: string; customerId: string; status: string; paymentState: string;
  tier: string; monthlyPrice: number; billingDayOfMonth: number; startedAt: Date;
  nextBillingAt: Date | null; lastPaymentAt: Date | null; failedPaymentCount: number;
  cancelledAt: Date | null; cancelReason: string | null;
}

export interface VisitInput {
  id: string; salonId: string; customerId: string; staffId: string | null;
  source: string; checkedInAt: Date; checkedOutAt: Date | null;
}

export interface SaleInput {
  id: string; salonId: string; visitId: string | null; customerId: string | null;
  staffId: string | null; state: string; subtotal: number; discount: number;
  tax: number; total: number; soldAt: Date;
}

export interface SaleLineInput {
  id: string; salonId: string; saleId: string; customerId: string | null;
  productId: string | null; quantity: number; unitPrice: number; discount: number;
  lineTotal: number; tenderType: string; soldAt: Date;
}

/* ---- grading (evaluation/expected_signals.csv) ---------------------------- */

export interface ExpectedSignal {
  signalId: string; salonSrcId: string; signal: string; expectedDetection: string;
  likelyAction: string; difficulty: string;
}

/** A signal the built intelligence actually produced, normalized for matching. */
export interface DetectedSignal {
  salonSrcId: string; kind: string; detail: string;
}

export interface GradeRow {
  signalId: string; salonSrcId: string; signal: string;
  found: boolean; matchedKind: string | null; note: string;
}
