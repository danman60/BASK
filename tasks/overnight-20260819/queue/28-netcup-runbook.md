# TASK — the Netcup cutover runbook for Bask

Write ONE file: `/home/danman60/projects/uvalux-platform/docs/NETCUP-CUTOVER.md`

**This is a runbook. It documents commands; it does not run them.** Do not execute `ssh`, `docker`,
`psql`, or any provisioning script while writing it.

## Why Bask is moving

Bask currently shares a hosted Supabase database with **574 tables belonging to other products**.
The consequences are documented and real: a local `pnpm demo:reset` yanks state out from under the
live demo site, two agents resetting at once produced foreign-key violations and interleaved state,
and every migration has to be defended by a checker that fails the deploy if any DDL escapes the
`bask` schema.

Moving to its own tenant on NETCUP removes all of that. It also lets the knowledge-base migration
and the embedding run be applied and verified against a real database instead of waiting for
sign-off on a shared production one.

## Facts to use — do not invent others

- Host: **NETCUP**, `ssh netcup`, root, tailnet only (`100.89.183.64`). Public SSH is firewalled off.
- Stack root on the box: `/opt/netcup/stack`. Config is owned by the **SYSADMIN** session and lives
  in the `~/projects/DEVOPS` git repo. **Never hand-edit config on the host** — edit the repo, then
  `rsync -az --exclude .env stack/ netcup:/opt/netcup/stack/`, then `docker compose up -d`. The one
  exception is `/opt/netcup/stack/.env` (mode 600, secrets, edited in place).
- Core: `netcup-db` (`supabase/postgres:17.6.1.165`) + `netcup-pooler` (Supavisor 2.9.7).
- Existing tenants: `dantv`, `studiosage`, `workshop`, plus `staging` and `rehearsal_workshop`.
  **Kong ports 8100, 8101 and 8102 are taken; Bask takes 8103.**
- `pgvector` is available at **0.8.2**, and is installed into `public` on each tenant database.
- Box: 8 shared vCore, 16 GB RAM, ~480 GB NVMe, ~10 GB RAM free before Bask.
- Backups: R2 bucket `netcup-backups`, 7 daily + 4 weekly, restore rehearsal Sundays 05:15.

## The scripts that already exist — reference them, do not reinvent them

`add-project-keys.sh` · `setup-project-roles.sh` · `new-project.sh` · `apply-extensions.sh` ·
`parity-check.sh` · `verify-isolation.sh` · `post-migration-grants.sh` · `cutover.sh` ·
`backup.sh` · `restore-rehearsal.sh`

Two notes that must appear in the runbook:

- `gen-secrets.sh` generates the **whole** `.env` and refuses to clobber an existing one. It is
  **not** the way to add a project. `add-project-keys.sh bask` is, and it is idempotent — it refuses
  to re-mint, because re-minting invalidates every token already issued.
- `apply-extensions.sh` has a **hardcoded database list** (`workshop studiosage dantv staging`).
  `bask` must be added to it, in the DEVOPS repo and then rsynced — not edited on the host.

## Structure

1. **Why** — three sentences, from the section above.
2. **Before you start** — what must be true: tailnet up, a fresh `backup.sh` run, and the free RAM
   figure checked, since Bask adds eight containers to a box already running three tenants.
3. **Provision**, as an ordered command list with one line of purpose each:
   `add-project-keys.sh bask` → create the database and roles → `new-project.sh bask bask 8103` →
   add `bask` to `apply-extensions.sh` in the repo, rsync, run it → `verify-isolation.sh`.
4. **Migrate** — `migrate-bask-schema.sh CCSS_SOURCE_URL bask`, and what its per-table row-count
   verification must print before you continue. State plainly that a non-zero exit means stop.
5. **Point the app at it** — which environment variables change (`DATABASE_URL`,
   `DIRECT_DATABASE_URL`) on Vercel and in `packages/db/.env`, and the reminder that Prisma Migrate
   must use the **direct** connection, because the pooled port hangs Migrate silently and forever.
6. **Verify** — `pnpm db:check`, `pnpm demo:reset`, `pnpm demo:verify`, and a load of the live site.
7. **Rollback** — the environment variables are the switch. Changing them back restores the previous
   database, because the migration is a copy and **nothing is deleted from the source**. Say this
   explicitly; it is what makes the cutover safe to attempt.
8. **After cutover** — a short list: update `CLAUDE.md`, which currently says *"Never create a new
   Supabase project"* and *"Supabase project: supabase-CCandSS"*; both become wrong the moment this
   lands, and a stale rule will have the next session undo the work.

## Two warnings that must be in the document

- **Data residency.** NETCUP's VPS is in **Manassas, Virginia — US soil**. UVALUX requires Canadian
  data in Canada and Irish data in Ireland, which is why they chose their own provider. NETCUP is
  correct for development and testing and is **not** an answer to that requirement. Do not let it
  appear in a client document as one.
- **Three live tenants share this box.** `dantv`, `studiosage` and `workshop` are other people's
  working systems. Nothing in this runbook may restart the core database or the pooler.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/docs/NETCUP-CUTOVER.md`
- Do NOT create or modify any other file. **Do NOT execute any command.**
- Acceptance: the file exists, is non-empty, contains a `## Rollback` section, contains the strings
  `8103`, `Manassas`, `DIRECT_DATABASE_URL`, `apply-extensions.sh` and `add-project-keys.sh`, and
  contains a warning that three live tenants share the box.
- Markdown only.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
