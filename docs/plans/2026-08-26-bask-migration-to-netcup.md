# Migrate `bask` off shared Supabase → its own NETCUP project

**Owner approved 2026-08-26 21:27 ET.** Daniel: *"I'm happy for it to migrate now. It's still in
demo phase."* Written by `sysadmin-11`; **`uvalux-platform-6` executes.**

## Why this is happening

Supabase emailed twice today about project `netbsyvxrhrqxyzqflmd` (CC&SS):
**"running out of Disk IO Budget"** (2026-08-26 18:30 ET) and a critical security advisory.

That project is shared by **StudioSync, StudioSage, ChoreoSync, FounderVision, DDD and Amplify**.
When its IO budget depletes, response times climb, CPU rises on IO wait, and the instance can go
unresponsive — a six-app outage.

`bask` is the **#1 consumer** on it. Measured from `pg_stat_user_tables`:

| project | seq rows read | tables | size |
|---|---|---|---|
| **bask** | **4,170,890,183** | 44 | 161 MB |
| DanTV | 1,535,621,654 | 36 | 767 MB |
| WolfPack | 135,390,145 | 29 | 441 MB |

**It is not a missing index.** `sale_line_salon_id_sold_at_idx (salon_id, sold_at)` already exists
and matches the hot query shape exactly, as do the equivalents on `sale` and `session`. The load is
**this session's own seeding** — `pg_stat_statements` shows 472 INSERT calls into `bask.sale_line`
creating **621,840 rows**, and the window was observed seeding *"20,179 customers, 13,225
memberships"* at 21:27 ET. Demo seeding on a database six production apps share.

So the fix is separation, not tuning.

## Why bask is a clean lift (all verified 2026-08-26)

| check | result |
|---|---|
| cross-schema FKs in or out of `bask` | **0** |
| RLS policies referencing `auth.*` | **0** of 33 |
| tables / views / functions | 44 / 0 / 2 |
| total size | **241 MB** |

No FK entanglement and no dependency on Supabase Auth's JWT claims in the policies themselves.

**NETCUP capacity, checked live:** load **0.36**, **464 G free of 503 G**, ~8 G RAM available,
35 containers, existing project stacks `classact · dantv · studiosage · template · workshop`.

This is exactly what the box exists for. Scope lock (`sysadmin/CLAUDE.md`): NETCUP is for
**Supabase tenant isolation and always-on workers**, explicitly NOT app hosting — the app stays on
Vercel. Do not migrate anything but the database.

## The one thing to resolve BEFORE cutover

**No bask RLS policy references `auth.*` — but that does not prove the app doesn't use Supabase
Auth.** Check how uvalux authenticates users. If it uses Supabase Auth on CC&SS, moving the data
without moving or re-mapping `auth.users` breaks login, and the `bask` schema's clean bill of
health will not have warned you. Resolve this first; everything else here is mechanical.

## How to do it (NETCUP conventions — do not improvise)

Full detail in `sysadmin/CLAUDE.md` § NETCUP. The parts that bite:

- **F4 — declarative only.** Never hand-edit config on the host. Edit `~/projects/DEVOPS/stack/`,
  then `rsync -az --exclude .env stack/ netcup:/opt/netcup/stack/`, then `docker compose up -d`.
  The single exception is `/opt/netcup/stack/.env` (mode 600) — **regenerating it orphans every
  role and JWT already issued.**
- **F2 — Postgres is addressed as `db.internal`**, never `localhost` or a container name. This is
  what makes a second box a DNS change instead of a migration. Do not "simplify" it.
- **F1 — apps connect through the pooler**, not straight to Postgres.
- ⚠️ **Compose service names collide across project stacks** on the shared `netcup-core` network
  and Docker DNS round-robins them **between tenants**. Always address containers as
  `sb-<project>-<svc>`. This has already cost real time once.
- ⚠️ **`systemctl is-active ufw` reported active while the firewall was disabled.** Read
  `ufw status`, not the unit state.
- Start from the `template` project stack; `workshop` is the precedent for non-paying data.

## Verify — run these, do not assume

```bash
ssh netcup
bash /opt/netcup/stack/scripts/verify-isolation.sh            # cross-tenant CONNECT refused
bash /opt/netcup/stack/scripts/parity-check.sh bask <port>    # client surface parity
bash /opt/netcup/stack/scripts/verify-migration.sh <SOURCE_URL> bask_ bask
bash /opt/netcup/stack/scripts/restore-rehearsal.sh bask      # prove the backup restores
```

Row-count parity against the source for all 44 tables is the acceptance test. `bask` is 241 MB —
there is no excuse for sampling.

## Accepted risks (demo phase — owner's call, stated so nobody re-litigates it)

- **No HA.** One box, one Postgres, one disk, no failover. netcup COW snapshots share the same
  storage and are **not backups**.
- **PITR gap.** Backups are `pg_dump` **logical only**; archived WAL cannot be replayed onto a
  logical dump, so point-in-time recovery does not exist yet. Acceptable for demo data. **This must
  be closed before bask carries a paying customer** — flag it loudly at that point.

## Do not

- Do not migrate the app. Vercel keeps it.
- Do not drop anything from CC&SS until parity passes and the app runs against NETCUP. Cut over
  reads first, keep the source intact, drop later as a separate deliberate step.
- Do not regenerate `/opt/netcup/stack/.env`.
