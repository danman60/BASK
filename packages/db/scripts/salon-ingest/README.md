# salon-ingest — real salon data → Bask schema

Turns a generated/exported salon dataset (unknown format) into rows under the
Bask Postgres schema so the built intelligence (health, sweeps, detectors,
peers) runs on real data instead of the demo fixtures.

## Drop your data here

Put the generated files in a directory (any of `.json`, `.ndjson`, `.csv`,
`.tsv`, `.sqlite`/`.db`, `.sql` dump). Then:

```
node packages/db/scripts/salon-ingest/profile.mjs <your-dir>
```

This is **read-only** — it touches no database. It writes `_profile.json` and
prints, per file/table: columns, inferred types, fill rates, and sample values.

## Then I write the mapping

From the profile I write `map.<source>.ts` — the field-by-field translation to
the Bask entities (`Customer`, `Visit`, `Session`, `Sale`/`SaleLine`,
`Membership`, `Product`, `InventoryLevel`, `StockEvent`, `Staff`, `Booking`,
`EquipmentDevice`). No field is guessed; every mapping is read off the profile.

## Load safety (shared CC&SS database — non-negotiable)

- The load creates a **NEW `Salon` (new `salonId`)** and puts everything under
  it. It NEVER writes into the demo tenant or any other product's schema.
- **Dry-run by default:** the loader validates every row against the schema +
  enums and prints a report (counts, rejects, unmapped columns) WITHOUT
  inserting. A real insert requires an explicit `INGEST_CONFIRM=yes` and names
  the target `salonId` at startup.
- Enums are validated before insert (see the schema's enum values); anything out
  of range is reported, never coerced silently.

## Status

- `profile.mjs` — **built**, tested on JSON + CSV.
- `map.*.ts`, `load.ts` — written once the first real profile lands.
