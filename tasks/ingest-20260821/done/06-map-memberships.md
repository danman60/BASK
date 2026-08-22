# TASK — map-memberships

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-memberships.ts`

Pure mapper: `memberships.csv` + `membership_payments.csv` → Bask
`MembershipInput[]`. Payment state and failed-payment count come from joining
the payments. Import from `./contract`.

## The file

Doc comment:

```ts
/**
 * memberships.csv (+ payments) → MembershipInput[]. failedPaymentCount counts
 * failed payments not later recovered; paymentState reflects the most recent
 * payment; billingDayOfMonth comes from the start date. Pure.
 */
```

Import from `./contract`: `remapId`, `num`, `parseDate`, `membershipStatus`, type `MembershipInput`.

Export `mapMemberships(memRows, payRows)`:

```ts
export function mapMemberships(
  memRows: Record<string, string>[],
  payRows: Record<string, string>[],
): MembershipInput[] {
  // index payments by membership
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
```

NOTE: `new Date('2025-01-01')` is a fixed literal fallback, not the clock — it is
allowed. Real membership columns: `membership_id, customer_id, salon_id, plan_name, monthly_price, start_date, status, cancel_date, cancel_reason`. Payment columns: `payment_id, membership_id, customer_id, salon_id, due_date, amount, status, initial_failure, recovered_date`.

## RULES

- Write exactly ONE file: the path above. No other file.
- NEVER write `import React`. Every contract symbol referenced must be imported from './contract'.
- No `any`, no DB, no file I/O, no `Date.now()`/`Math.random`. A fixed
  `new Date('2025-01-01')` literal is allowed as the start fallback.
- Acceptance: `tsc --noEmit` clean; `mapMemberships` exported.
- DO NOT fix bugs or refactor outside this file.
