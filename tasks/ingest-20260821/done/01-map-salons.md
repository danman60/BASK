# TASK — map-salons

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/db/scripts/salon-ingest/etl/map-salons.ts`

Pure mappers: the practice dataset's `salons.csv` rows → Bask `OrgInput` +
`SalonInput[]`. No DB, no file I/O, no clock, no randomness. Import types and
helpers from the contract at `./contract` (same directory).

## The file

Doc comment:

```ts
/**
 * salons.csv → one Org + six SalonInput. IDs are remapped deterministically so
 * every other mapper's salonId foreign key matches. Pure — the orchestrator
 * reads the CSV and inserts; this only shapes rows.
 */
```

Import from `./contract`:
`remapId`, `SALON_STATUS`, type `OrgInput`, type `SalonInput`.

Export TWO functions:

```ts
export function mapOrg(): OrgInput {
  return { id: remapId('org', 'uvalux-practice'), name: 'UVALUX Practice', slug: 'uvalux-practice' };
}

export function mapSalons(rows: Record<string, string>[]): SalonInput[] {
  return rows.map((r) => ({
    id: remapId('salon', r.salon_id),
    orgId: remapId('org', 'uvalux-practice'),
    name: r.salon_name,
    slug: r.salon_id.toLowerCase(),
    status: SALON_STATUS,
    country: 'CA',
    timezone: 'America/Toronto',
    theme: 'sunset',
  }));
}
```

Write exactly that — the column names (`salon_id`, `salon_name`) are from the
real CSV header.

## RULES

- Write exactly ONE file: the path above. No other file.
- The project uses the automatic JSX runtime. NEVER write `import React` in any form.
- Every contract symbol you reference must appear in your import list from './contract'.
- No `any`, no DB, no `readFileSync`/`fetch`, no `Date.now()`/`Math.random`.
- Acceptance: `tsc --noEmit` clean; both `mapOrg` and `mapSalons` exported.
- DO NOT fix bugs or refactor outside this file.
