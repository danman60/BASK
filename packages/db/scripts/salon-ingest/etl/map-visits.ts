/**
 * visits.csv → VisitInput[]. checkedOutAt is check_in + session_minutes; source
 * is walk-in vs appointment. staffId is optional (blank staff → null). Pure.
 */
import { remapId, num, bool, parseDate, visitSource, type VisitInput } from './contract';

export function mapVisits(rows: Record<string, string>[]): VisitInput[] {
  return rows.map((r) => {
    const checkIn = parseDate(r.check_in_at) ?? new Date('2025-01-01');
    const mins = num(r.session_minutes);
    const checkOut = new Date(checkIn.getTime() + mins * 60000);
    return {
      id: remapId('visit', r.visit_id),
      salonId: remapId('salon', r.salon_id),
      customerId: remapId('customer', r.customer_id),
      staffId: r.staff_id ? remapId('staff', r.staff_id) : null,
      source: visitSource(bool(r.walk_in)),
      checkedInAt: checkIn,
      checkedOutAt: mins > 0 ? checkOut : null,
    };
  });
}