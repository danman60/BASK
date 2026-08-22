# TASK — map-staff

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-staff.ts`

Pure mapper: `staff.csv` rows → Bask `StaffInput[]`. Import from `./contract`.

## The file

Doc comment:

```ts
/**
 * staff.csv → StaffInput[]. full_name is split on the first space into
 * first/last; role maps through the contract; permissions/shiftPattern are the
 * shapes Bask expects. Pure.
 */
```

Import from `./contract`: `remapId`, `staffRole`, `bool`, `parseDate`, type `StaffInput`.

Export:

```ts
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
```

Real CSV columns: `staff_id, salon_id, full_name, role, primary_shift, hire_date, active`.

## RULES

- Write exactly ONE file: the path above. No other file.
- NEVER write `import React`. Every contract symbol referenced must be imported from './contract'.
- No `any`, no DB, no file I/O, no `Date.now()`/`Math.random`.
- Acceptance: `tsc --noEmit` clean; `mapStaff` exported.
- DO NOT fix bugs or refactor outside this file.
