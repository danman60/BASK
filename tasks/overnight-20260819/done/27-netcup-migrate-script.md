# TASK — the bask schema migration script

Write ONE file: `/home/danman60/projects/uvalux-platform/docs/netcup/migrate-bask-schema.sh`

## ⚠️ WRITE THE SCRIPT. DO NOT RUN IT.

It reads a **shared production database** and writes to a server hosting three live tenants.
Writing the file is this task; running it is not. Do not execute `ssh`, `docker`, `psql`,
`pg_dump`, or anything that opens a connection.

## Why a new script, when `migrate-from-hosted.sh` already exists

Read `/home/danman60/projects/DEVOPS/stack/scripts/migrate-from-hosted.sh` first — **read only** —
and copy its structure, its verification philosophy and its comment style.

You write into **this** repo, not into DEVOPS. That repo belongs to another owner; a human copies
the reviewed script across.

But it **does not fit this case**, and that is the reason this task exists. It selects tables by
name prefix inside the `public` schema (`tablename LIKE 'sa\_%'`), because the projects it moved
were prefixed tables sharing one schema. Bask is not: **every Bask object already lives in its own
`bask` schema**, so the unit of migration is a whole schema, which is simpler and safer than a
prefix match.

Do not modify `migrate-from-hosted.sh`. Write a sibling.

## Usage

```
migrate-bask-schema.sh <source_url_env_var> <target_db> [--refresh]
  e.g. migrate-bask-schema.sh CCSS_SOURCE_URL bask
```

`--refresh` drops and replaces the `bask` schema in the TARGET only, for a re-sync before cutover.
Without it, the script refuses to run if the target already has a populated `bask` schema.

## Rules the script must enforce

1. **Read-only against the source.** It runs `pg_dump` and nothing else against the hosted database.
   Nothing in this script may modify the source. Say so in the header comment, as the sibling does.
2. **`--schema=bask` only.** Never dump `public`. The source database holds 574 tables belonging to
   other products and they must never be touched, read into the dump, or restored.
3. **Verification is per-table row counts, not an exit code.** A restore can exit 0 while silently
   skipping rows it lacked privileges for. After restoring, for every table in `bask`, compare the
   source count and the target count and print them side by side. Exit non-zero if any pair
   disagrees. This is the whole point of the script.
4. **Never `DROP` anything in the source.** The only `DROP` permitted is `DROP SCHEMA bask CASCADE`
   against the **target**, and only under `--refresh`.

## Shape

- `set -uo pipefail`, same as the sibling.
- Resolve the source URL by indirect expansion from the named env var, after sourcing
  `/opt/netcup/stack/.env`. Fail with a clear message if it is empty.
- Dump: `pg_dump "$SRC" --schema=bask --no-owner --no-privileges --format=custom` to a timestamped
  file under `/opt/netcup/stack/dumps/`, creating that directory if needed.
- Restore into the target with `pg_restore` through `docker exec -i netcup-db`, as the sibling does
  for its target.
- After restore, run `scripts/post-migration-grants.sh` if present — note in a comment that roles
  and grants do not survive `--no-owner`.
- Print a final summary: schema, table count, total rows, dump file path, and PASS or FAIL.

## Extensions

The knowledge base needs `pgvector`. Print a reminder at the end that `apply-extensions.sh` must
include the new database, and that the extension lives in `public` on the target while the tables
live in `bask` — so a `vector` column is declared `public.vector(1536)`.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/docs/netcup/migrate-bask-schema.sh`
- Do NOT create or modify any other file. Do NOT edit `migrate-from-hosted.sh`.
- **Do NOT execute anything** — no ssh, docker, psql, pg_dump, pg_restore.
- Acceptance: the file exists, is non-empty, starts with `#!/bin/bash`, passes `bash -n`, contains
  `--schema=bask`, contains `set -uo pipefail`, contains a per-table row-count comparison, and does
  NOT contain any `DROP` that targets the source or the string `public.` in a dump filter.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
