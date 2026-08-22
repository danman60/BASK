# TASK — map-customers

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-customers.ts`

Pure mapper: `customers.csv` + `visits.csv` → Bask `CustomerInput[]`. The
dataset customers are anonymized (no names), so synthesize deterministic
placeholder names. Compute `lastVisitAt` + `status` from the visits. Import from
`./contract`.

## The file

Doc comment:

```ts
/**
 * customers.csv (+ visits for recency) → CustomerInput[]. Names are synthesized
 * deterministically from customer_id (the source is anonymized). status is
 * derived from days since last visit against `asOf`: <=45 active, <=120 lapsed,
 * else inactive. Pure.
 */
```

Import from `./contract`: `remapId`, `bool`, `parseDate`, type `CustomerInput`.

Above the function, a small deterministic name pool:

```ts
const FIRST = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor', 'Jamie', 'Avery', 'Quinn'];
const LAST = ['Lee', 'Patel', 'Nguyen', 'Brown', 'Silva', 'Cohen', 'Reyes', 'Khan', 'Walsh', 'Diaz'];
function nameFor(id: string): { firstName: string; lastName: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return { firstName: FIRST[h % FIRST.length], lastName: LAST[(h >> 8) % LAST.length] };
}
```

Export `mapCustomers(customerRows, visitRows, asOf)`:

```ts
export function mapCustomers(
  customerRows: Record<string, string>[],
  visitRows: Record<string, string>[],
  asOf: Date,
): CustomerInput[] {
  const lastVisit = new Map<string, string>();
  for (const v of visitRows) {
    const cur = lastVisit.get(v.customer_id);
    if (!cur || v.check_in_at > cur) lastVisit.set(v.customer_id, v.check_in_at);
  }
  return customerRows.map((r) => {
    const lv = lastVisit.get(r.customer_id) ?? null;
    const lvDate = parseDate(lv ?? undefined);
    let status = 'inactive';
    if (lvDate) {
      const days = (asOf.getTime() - lvDate.getTime()) / 86400000;
      status = days <= 45 ? 'active' : days <= 120 ? 'lapsed' : 'inactive';
    }
    const { firstName, lastName } = nameFor(r.customer_id);
    return {
      id: remapId('customer', r.customer_id),
      salonId: remapId('salon', r.salon_id),
      firstName,
      lastName,
      status,
      emailOptIn: bool(r.marketing_opt_in) && (r.preferred_channel || '').toLowerCase() === 'email',
      smsOptIn: bool(r.marketing_opt_in) && (r.preferred_channel || '').toLowerCase() === 'sms',
      photoConsent: false,
      joinedAt: parseDate(r.signup_date) ?? asOf,
      lastVisitAt: lvDate,
    };
  });
}
```

Real customer columns: `customer_id, salon_id, signup_date, acquisition_source, age_band, postal_region, marketing_opt_in, preferred_channel`. Visit column used: `customer_id, check_in_at` (ISO string, so `>` compares chronologically).

## RULES

- Write exactly ONE file: the path above. No other file.
- NEVER write `import React`. Every contract symbol referenced must be imported from './contract'.
- No `any`, no DB, no file I/O, no `Date.now()`/`Math.random` (the name hash is deterministic — keep it).
- Acceptance: `tsc --noEmit` clean; `mapCustomers` exported.
- DO NOT fix bugs or refactor outside this file.
