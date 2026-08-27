# bask → NETCUP migration — findings, 2026-08-26

**Status: banked at a verified step 2.** Steps 1 and 2 complete. Steps 3–5 NOT started.
Nothing dropped from CC&SS. NETCUP holds a full verified copy. The app is untouched and still
points at CC&SS.

Executed by `uvalux-platform-6`, coordinated with `sysadmin-11`. Plan:
`docs/plans/2026-08-26-bask-migration-to-netcup.md`.

## What landed

| | |
|---|---|
| NETCUP project | `bask`, kong port **8104** (8100–8103 were taken), containers `sb-bask-*` |
| Parity | **44 tables compared, 0 mismatched.** 493,216 source vs 493,215 target |
| Drift | `session` 9863 → 9862 — source still writing; closes at quiesce |
| Isolation | `verify-isolation.sh` **50 passed, 0 failed**, incl. the cross-tenant DNS round-robin guard |
| Acceptance baseline | `docs/migration/bask-source-manifest-2026-08-26.tsv` — exact counts, no sampling |

---

## FINDING 1 — RLS posture differs, and it fails SILENTLY. Cutover blocker.

**This is the one that matters. Read it before repointing anything.**

`bask` has row-level security on **33 of its 44 tables**, with 33 `salon_isolation` policies:

```
USING (id = bask.current_salon_id())
```

`bask.current_salon_id()` reads the `app.salon_id` session GUC, which the app sets per transaction
at `packages/db/src/scope.ts:38` (`set_config('app.salon_id', ..., true)`).

| role | superuser | BYPASSRLS | reads from an RLS table |
|---|---|---|---|
| `supabase_admin` | yes | yes | **everything** |
| `service_role` | no | yes | everything |
| `bask_owner` | no | **no** | **0 rows** |
| `postgres` (on NETCUP) | no | **no** | **0 rows** |

**CC&SS connects as `postgres.<project-ref>`, and on hosted Supabase that role bypasses RLS.**
NETCUP has no equivalent for the app.

### Why this is dangerous rather than merely wrong

Point the app at NETCUP as `bask_owner` and it gets an **empty database** — no error, no exception,
no log line. Every screen renders blank and everything looks healthy. The data is present and
correct; it is simply invisible to that role.

### Why row-count parity is structurally blind to it

`verify-migration.sh` runs as `supabase_admin`, which **bypasses RLS**. So parity reads 253,774
visits and reports a perfect match on data the application role cannot see at all. **A green parity
run is not evidence the app will work.** This is the same class as the grants gap below, one layer
deeper.

### Decision taken (sysadmin-11, on the record)

Grant `BYPASSRLS` to `bask_owner` at cutover, to replicate exactly what CC&SS does today. It
introduces **no new exposure relative to current behaviour** — but it does mean the 33
`salon_isolation` policies are decorative on that path, *exactly as they already are on CC&SS*.

**The correct end state is different:** `scope.ts` provably wrapping every query path, so RLS is
load-bearing instead of ornamental. That is a real audit and it belongs **before bask carries a
paying customer**, not before a demo.

**Not done tonight.** It goes in the same deliberate block as the `POSTGRES_PASSWORD` rotation.

---

## FINDING 2 — the IO-burn framing was wrong. Cumulative, not a rate.

The migration was justified by **4,170,890,183 sequential rows read** on CC&SS. Measured deltas:

| | before | after | delta |
|---|---|---|---|
| **NETCUP** | 4,207,494 | 4,211,981 | **+4,373 rows / +35 scans** |
| **CC&SS** | 4,173,242,330 (21:39:30) | 4,173,927,872 (21:48:20) | **+685,542 rows / +2,877 scans** |

**A single dry-run sweep costs ~4,400 sequential rows.** The 4.17 billion is **cumulative since the
last stats reset — it is not a rate.** There was never a steady-state flow to relocate.

The CC&SS delta is the *migration itself*: `pg_dump` reads all 493k source rows, then
`verify-migration.sh` counts all 44 tables on the source again. Two full passes ≈ the observed
+685,542. One-time, will not repeat.

**What is genuinely true:** Supabase's Disk IO Budget is **credit-based**, so it is depleted by
exactly the episodic bursts — 621k-row ETL dry-runs, full-dataset analyses, `health:distribution`
sweeps — and those now land on NETCUP. That is a real win **stated at its real size**. It does not
undo what is already counted, and anyone re-reading `pg_stat_user_tables` tomorrow will see that.

Note: the baseline itself includes ~2.35M rows of **our own measurement cost** — building the
44-table exact-count manifest is 44 sequential scans. Attributed rather than called ambient drift.

---

## FINDING 3 — the ETL drops line items. On the DEMO critical path, not just the migration path.

`bask.sale_line` is **0 rows for org `salontouch-real`** — on CC&SS *and* therefore on the NETCUP
copy — while the canonical extract holds:

| `~/salon-pull/canonical/` | rows |
|---|---|
| `transaction_items.csv` | **59,787** (47,614 service, 12,173 with a real `product_id`) |
| `products.csv` | **673** |

So the data exists and the loader is losing it. Cause **not yet diagnosed** — suspect
`packages/db/scripts/salon-ingest/etl/map-transactions.ts`. A prior session already fixed one bug of
this exact shape there (`item_type === 'product'`, not `'retail'`).

**Why it is urgent:** four of the six planned demo surfaces — attachment, lotion cadence,
dead-SKU shelf, traffic-vs-selling decomposition — read `sale_line`/`product`. They have **no data
on the copy the demo actually renders from.** This is tomorrow's first task.

Related, same org: 0 `product`, 0 `inventory_level`, 0 `room`, 0 `service` rows, and
`membership.payment_state` is `current` on all rows — so `retail_attachment_slip`,
`low_stock`, `overstock`, `soft_capacity`, `anomaly_band` and `failed_payments` **all structurally
cannot fire**. Verified by running the real sweep: **0 drafts across all four salons.**

---

## FINDING 4 — three tooling bugs found by using the scripts, all now fixed by sysadmin-11

Recorded because the *pattern* matters more than the individual fixes.

1. **`migrate-from-hosted.sh` / `verify-migration.sh` were `public`-schema-only** (`schemaname='public'`
   + table-name-prefix selection). `bask` is a schema, not a prefix. Fixed with a `schema:<name>`
   selector (commit `4252a85`).
2. **The in-script verify block was half-patched.** Source-side count used the schema variable;
   the target-side count still read `FROM public."$t"`. Result: `DIFF <every table> target=MISSING`
   and **`MIGRATION INCOMPLETE — Do NOT cut over`** printed over a migration that had landed
   *perfectly*. A **false negative** — arguably worse here than the false positive originally
   feared, because the natural response is to re-run or roll back correct data. Caught only by
   querying the target directly instead of believing the summary line.
3. **The post-restore GRANT only ever granted on `public`**, so a schema-scoped tenant received no
   grants and every role read `none` — including `USAGE ON SCHEMA` itself, without which
   table-level grants are unreachable. Fixed in `1b1d2f6`.

**Why grants are needed after a restore at all** (the part that is easy to miss): restored objects
are owned by `supabase_admin`, so `<project>_owner` can see nothing until it is granted. **A dump
carries data, not the project's permissions.** Scripted in `b45f03c` — `migrate-from-hosted.sh` now
grants schema `USAGE` to `<project>_owner` and `<project>_authenticator`, and table/sequence
privileges to the owner only, skipping absent roles with a printed note so prefix-mode tenants are
untouched.

**`<project>_authenticator` holding `USAGE` and NO table grants is CORRECT, not an omission.** It is
a login role that `SET ROLE`s into `anon`/`authenticated` and must not hold table privileges of its
own. Do not "fix" it.

**The lesson, three times in one night:** believe the artefact, not the summary line. Every one of
these was found by checking the thing itself — query the target, read `ufw status` not the unit
state, read as the *app* role not the admin role.

---

## FINDING 5 — Postgres on NETCUP binds loopback only

`ss -tlnp` → `127.0.0.1:6543` (pooler) and `127.0.0.1:5432` (postgres). Only Kong is on the tailnet
IP (`100.89.183.64:8104`). SpyBalloon therefore **cannot** point Prisma at NETCUP Postgres directly.

Tonight's workaround: `ssh -N -L 15432:127.0.0.1:5432 netcup` — local, reversible, changes nothing
on the box. **The tunnel has been killed; re-create it if you need it.**

If local dev is to point at NETCUP routinely, binding the pooler to the tailnet interface is real
DEVOPS work and belongs in a scheduled task, not a measurement.

Same lesson as the Vercel finding one layer down: **check which INTERFACE a service binds, not just
whether the host is reachable.**

---

## Security item — POSTGRES_PASSWORD exposed

While inspecting the pooler config I masked variables *named* password/secret/key. The password was
embedded in a URL value (`ecto://supabase_admin:<pw>@db.internal:5432/_supavisor`), so the mask
missed it and it printed in clear into the session transcript.

Confirmed by sysadmin-11 to be `POSTGRES_PASSWORD` — the **Postgres superuser password for the whole
NETCUP instance**. Containment: all 35 passwords in `.env` are distinct (reused by no project role),
Postgres and the pooler bind loopback only, SSH is tailnet-and-key-only. Unusable to anyone not
already on the box. Copies are local: 1 transcript `.md` + 3 session `.jsonl` on SpyBalloon, plus
sysadmin-11's transcript via the relay.

**Rotation is sysadmin-11's, deliberate, with Daniel.** It does *not* require regenerating `.env` —
that warning is about `gen-secrets.sh` rewriting everything and orphaning issued JWTs. Rotating one
value is `ALTER ROLE` + one line + recreate consumers.

**Rule adopted by both sessions: redact on value SHAPE (`://user:pass@`), never on variable NAME.**
A name-based mask cannot see a secret inside a URL. This has now bitten twice.

---

## What is NOT done

- **Step 3** — ETL fix + load. Blocked on diagnosing Finding 3. **Tomorrow's first task.**
- **Step 4** — wholesale re-dump CC&SS → NETCUP after step 3.
- **Step 5** — letting NETCUP author derived rows. **Deliberately deferred until after the demo:**
  `/insights` and Today read `bask.insight`, and PITCH.md Beat 1 is insight → Studio. Authoring on
  NETCUP while Vercel reads CC&SS would freeze the demo's derived data.
- **Vercel repointing + Realtime** — blocked on a public entry point. NETCUP gateways are
  tailnet-only; Vercel functions run on public AWS. Repointing today hard-fails every request.
- **`BYPASSRLS` grant** and **`POSTGRES_PASSWORD` rotation** — sysadmin-11's deliberate block.

## Standing rules while this is half-migrated

1. **No non-dry-run sweep against NETCUP.**
2. **No authoring on NETCUP until the demo is done.**
3. **Nothing dropped from CC&SS** until the app runs against NETCUP and parity passes.
4. **Never regenerate `/opt/netcup/stack/.env`.**
