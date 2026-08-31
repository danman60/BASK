# What we need from the data
### For Wilfred · Thursday 2026-09-03

## The ask, in one sentence

**A periodic export of transaction-grain salon activity — visits, sales lines, memberships,
products and stock — with stable internal IDs and at least 13 months of history.** No customer
names, no contact details, no payment instruments.

That is the whole request. Everything below explains what each field buys.

---

## The principle

The product finds opportunities by comparing a salon **to its own recent past** and **to comparable
salons**. Both comparisons need *events with timestamps*, not summary reports.

A monthly revenue total tells us a salon is down. It cannot tell us that the drop is Thursday
afternoons, that traffic is unchanged, that it is lotion rather than sessions, and that it is worth
about $4,260 a month — which is the difference between a dashboard and something an owner acts on
before lunch.

**Grain beats breadth.** We would rather have four entities at transaction level than twenty
pre-aggregated reports.

---

## What each opportunity needs

Every row here is something the product computes today. The middle column is the minimum data that
makes it possible.

| The product says | It needs | Without it |
|---|---|---|
| "Lotion per visit fell from 9% to 6%, mostly Thursday afternoon" | Visits with a **timestamp**; sale lines linked to the visit; product vs service on the line | We can show revenue moved, not what moved it or when |
| "17 regulars match the profile that converts to membership" | Visit frequency per customer over 90 days; membership status and start date | No conversion targeting at all |
| "This bronzer sells out in about 8 days" | Sale lines with quantity + date; current stock on hand | No reorder timing — only "you sold some" |
| "Tuesday afternoons run under half full" | Session start times and room/bed identity; capacity per room | No capacity view; utilisation is unknowable |
| "A member has gone quiet — but this is your trough, not churn" | **12+ months of visit history** per salon | Every July looks like mass churn, and the owner learns to ignore us |
| "Members here stay 4.2 months; comparable salons hold 6.1" | Membership start and end dates, with a reason where you have one | No tenure, and the strongest equipment argument disappears |
| "These members already use more than their tier" | Sessions per member per month + tier entitlement | No honest upsell — only guessing |
| "This customer bought a bottle 9 weeks ago and is nearly out" | Sale line with product and date + typical usage rate | No replenishment prompt |
| "You sell 40% fewer units per 100 customers in this category" | Product category on the product record; customer counts per salon | No peer comparison, which is the whole Compass side |

Sources: `packages/core/src/insights/sweeps/`, `packages/core/src/insights/detectors.ts`,
windows defined at `packages/db/src/facts.ts:31` (14-day current, 28-day baseline, 30-day velocity).

---

## The entities, concretely

The importer already maps these nine. Field names do not matter — we map yours to ours.

| Entity | Fields that carry weight |
|---|---|
| **Customer** | stable id · created/first-seen date · home salon. *No name, no email, no phone.* |
| **Visit** | id · customer id · **timestamp** (not date) · salon · staff id if you have it |
| **Session** | visit id · room/bed id · service or equipment type · start time · duration |
| **Sale / SaleLine** | sale id · visit id · customer id · product or service id · quantity · line total · timestamp |
| **Product** | id · sku · name · **category** · retail price |
| **Membership** | customer id · tier · start date · end date · status · price · monthly entitlement |
| **InventoryLevel / StockEvent** | product id · salon · quantity on hand · received/adjusted events with dates |
| **Staff** | id only, and a display initial at most — we attribute shifts, never rank people by name |
| **Booking** | id · customer · service · scheduled time · status (no-shows are signal) |

**Timestamps, not dates.** "Thursday afternoon" is one of the most actionable findings the product
produces, and a date-only export erases it.

---

## History, cadence, identity

- **History: 13 months minimum, 24 preferred.** A seasonal-pause judgement builds a twelve-month
  profile from *the salon's own* history — never an industry constant
  (`packages/core/src/insights/sweeps/seasonal-pause.ts`). With less than a year we cannot tell a
  trough from a decline, and that is the single most damaging false alarm this product could raise.
- **Cadence: daily is ideal, weekly workable.** Daybreak reads overnight movement; a weekly file
  makes "what changed overnight" into "what changed last week".
- **Identity: your internal IDs, whatever they are.** They are hashed to stable UUIDs on ingest and
  the same source ID always produces the same row (`etl/contract.ts:remapId`), so re-exports
  reconcile rather than duplicate. We never need to resolve a person.
- **Multi-salon: one salon identifier per row.** The peer comparison is the entire Compass side, and
  it needs to know which rows belong to which location.

---

## What we do NOT want

Names · email addresses · phone numbers · card or payment instruments · addresses · anything about
an individual customer that a person could be identified from. The salon's own screens show the
salon its own customers; **UVALUX sees business signals, never a customer list.** That boundary is
enforced in code — one filter every network-level read passes through
(`packages/core/src/consent/`), not a policy document.

---

## How to start without committing to anything

There is a **read-only profiler**. Point it at an export in any format — CSV, JSON, NDJSON, SQL
dump, SQLite — and it writes a report of every table: columns, inferred types, **fill rates**, and
sample values. It touches no database.

```
node packages/db/scripts/salon-ingest/profile.mjs <directory>
```

From that report we write the field-by-field mapping. **No field is ever guessed** — the mapping is
read off the profile (`packages/db/scripts/salon-ingest/README.md`). One anonymised export from one
salon is enough to tell us, in a day, exactly which opportunities are computable from your data and
which are not.

---

## Questions for Wilfred

1. **What is the system of record** — SalonTouch throughout, or does it vary by location?
2. **Can you export at transaction grain**, or does the platform only surface aggregates?
3. **How far back does history go**, and is it uniform across salons?
4. **How do you get data out today** — API, scheduled export, direct database, manual pull?
5. **What is already anonymised** at the source, and what would you need stripped before it leaves?
6. **Who owns the salon's data contractually** — the salon, or UVALUX? It changes who has to agree.
7. **Is there a pilot group** we could profile first, without touching anything live?
8. **What does your team already compute** that we would be duplicating? We would rather consume
   your number than invent a second one that disagrees with it.

---

## What we can show you on the day

The product is running on a real ingested dataset, not a mock. `/evidence` reports live counts, and
any percentage on screen opens to the visit-level rows behind it — including a mismatch warning if
the recomputed figure ever disagrees with the quoted one. That check exists because a provenance
panel that can only confirm itself is decoration.
