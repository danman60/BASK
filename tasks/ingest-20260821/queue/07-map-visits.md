# TASK — map-visits

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-visits.ts`

Pure mapper: `visits.csv` rows → Bask `VisitInput[]`. Import from `./contract`.

## The file

Doc comment:

```ts
/**
 * visits.csv → VisitInput[]. checkedOutAt is check_in + session_minutes; source
 * is walk-in vs appointment. staffId is optional (blank staff → null). Pure.
 */
```

Import from `./contract`: `remapId`, `num`, `bool`, `parseDate`, `visitSource`, type `VisitInput`.

Export:

```ts
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
```

NOTE: the `new Date(...)` calls here derive from parsed CSV values / a fixed
literal fallback — not the wall clock. That is allowed. Real columns:
`visit_id, customer_id, salon_id, booking_id, staff_id, equipment_id, check_in_at, session_minutes, wait_minutes, service_type, walk_in`.

## RULES

- Write exactly ONE file: the path above. No other file.
- NEVER write `import React`. Every contract symbol referenced must be imported from './contract'.
- No `any`, no DB, no file I/O, no `Date.now()`/`Math.random`.
- Acceptance: `tsc --noEmit` clean; `mapVisits` exported.
- DO NOT fix bugs or refactor outside this file.
