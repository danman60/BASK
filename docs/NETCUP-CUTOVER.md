# Bask Netcup Cutover Runbook

## Why

Bask currently shares a hosted Supabase database with 574 tables belonging to other products. The consequences are documented and real: a local `pnpm demo:reset` yanks state out from under the live demo site, two agents resetting at once produced foreign-key violations and interleaved state, and every migration has to be defended by a checker that fails the deploy if any DDL escapes the `bask` schema. Moving to its own tenant on NETCUP removes all of that. It also lets the knowledge-base migration and the embedding run be applied and verified against a real database instead of waiting for sign-off on a shared production one.

## Before you start

- Ensure tailnet is up
- Run `backup.sh` to create a fresh backup
- Check available RAM — the box currently has ~10 GB free before Bask, and adding eight containers to a box already running three tenants requires careful monitoring

## Provision

1. `add-project-keys.sh bask` → creates the database and roles
2. `new-project.sh bask bask 8103` → sets up the project with Kong port 8103
3. Add `bask` to `apply-extensions.sh` in the DEVOPS repo, then rsync it: `rsync -az --exclude .env stack/ netcup:/opt/netcup/stack/`, then run `apply-extensions.sh`
4. `verify-isolation.sh` → verify that Bask's database is properly isolated

## Migrate

Run `migrate-bask-schema.sh CCSS_SOURCE_URL bask` and verify the per-table row-count verification output. A non-zero exit code means stop immediately.

## Point the app at it

Change these environment variables:
- `DATABASE_URL` on Vercel
- `DIRECT_DATABASE_URL` on Vercel
- `DATABASE_URL` in `packages/db/.env`

Remember: Prisma Migrate must use the **direct** connection, because the pooled port hangs Migrate silently and forever.

## Verify

1. `pnpm db:check`
2. `pnpm demo:reset`
3. `pnpm demo:verify`
4. Load the live site to verify functionality

## Rollback

The environment variables are the switch. Changing them back restores the previous database, because the migration is a copy and **nothing is deleted from the source**. This makes the cutover safe to attempt.

## After cutover

- Update `CLAUDE.md` — it currently says *"Never create a new Supabase project"* and *"Supabase project: supabase-CCandSS"*, both of which become wrong once this is complete

## Warnings

**Data residency.** NETCUP's VPS is in **Manassas, Virginia — US soil**. UVALUX requires Canadian data in Canada and Irish data in Ireland, which is why they chose their own provider. NETCUP is correct for development and testing and is **not** an answer to that requirement. Do not let it appear in a client document as one.

**Three live tenants share this box.** `dantv`, `studiosage` and `workshop` are other people's working systems. Nothing in this runbook may restart the core database or the pooler.