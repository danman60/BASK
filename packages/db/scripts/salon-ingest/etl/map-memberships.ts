/**
 * memberships.csv (+ payments) → MembershipInput[]. failedPaymentCount counts
 * failed payments not later recovered; paymentState reflects the most recent
 * payment; billingDayOfMonth comes from the start date. Pure.
 */
import { remapId, num, parseDate, membershipStatus, type MembershipInput } from './contract';

export function mapMemberships(
  memRows: Record<string, string>[],
  payRows: Record<string, string>[],
): MembershipInput[] {
  const byMem = new Map<string, Record<string, string>[]>();
  for (const p of payRows) {
    const arr = byMem.get(p.membership_id) ?? [];
    arr.push(p);
    byMem.set(p.membership_id, arr);
  }
  return memRows.map((m) => {
    const pays = (byMem.get(m.membership_id) ?? []).slice().sort((a, b) => (a.due_date < b.due_date ? -1 : 1));
    const failed = pays.filter((p) => (p.status || '').toLowerCase() === 'failed' && !p.recovered_date);
    const last = pays[pays.length - 1];
    let paymentState = 'current';
    if (last) {
      const s = (last.status || '').toLowerCase();
      if (s === 'failed') paymentState = last.recovered_date ? 'recovered' : 'failed';
      else if (s === 'past_due') paymentState = 'past_due';
    }
    const start = parseDate(m.start_date);
    return {
      id: remapId('membership', m.membership_id),
      salonId: remapId('salon', m.salon_id),
      customerId: remapId('customer', m.customer_id),
      status: membershipStatus(m.status),
      paymentState,
      tier: (m.plan_name || 'standard').toLowerCase(),
      monthlyPrice: num(m.monthly_price),
      billingDayOfMonth: start ? start.getUTCDate() : 1,
      startedAt: start ?? new Date('2025-01-01'),
      nextBillingAt: null,
      lastPaymentAt: last ? parseDate(last.due_date) : null,
      failedPaymentCount: failed.length,
      cancelledAt: parseDate(m.cancel_date),
      cancelReason: m.cancel_reason || null,
    };
  });
}
