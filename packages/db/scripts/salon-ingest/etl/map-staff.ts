/**
 * staff.csv → StaffInput[]. full_name is split on the first space into
 * first/last; role maps through the contract; permissions/shiftPattern are the
 * shapes Bask expects. Pure.
 */
import { remapId, staffRole, bool, parseDate, type StaffInput } from './contract';

export function mapStaff(rows: Record<string, string>[]): StaffInput[] {
  return rows.map((r) => {
    const parts = (r.full_name || '').trim().split(/\s+/);
    const firstName = parts[0] || 'Staff';
    const lastName = parts.slice(1).join(' ') || r.staff_id;
    return {
      id: remapId('staff', r.staff_id),
      salonId: remapId('salon', r.salon_id),
      firstName,
      lastName,
      role: staffRole(r.role),
      permissions: {},
      shiftPattern: { shift: r.primary_shift },
      isActive: bool(r.active),
      hiredAt: parseDate(r.hire_date),
    };
  });
}