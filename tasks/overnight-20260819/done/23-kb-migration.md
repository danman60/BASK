# TASK — the knowledge base migration SQL

Write ONE file:
`/home/danman60/projects/uvalux-platform/packages/db/prisma/migrations/20260820000000_knowledge_base/migration.sql`

You will need to create that directory. Creating it and the one file inside it is permitted;
nothing else is.

## ⚠️ WRITE THE FILE. DO NOT RUN IT.

This SQL targets a **shared production database** that hosts several unrelated applications. Writing
the migration file is this task. **Applying it is not, and must not happen.**

- Do **not** run `prisma migrate`, `prisma db push`, `psql`, `supabase`, or any command that
  connects to a database.
- Do **not** run anything that reads `DATABASE_URL` or `DIRECT_DATABASE_URL`.
- If you think the file needs testing, stop — a human applies this after review.

## The one rule that governs the SQL itself

**Every object must be created inside the `bask` schema, explicitly qualified.** A single unqualified
`CREATE TABLE` lands in `public`, alongside 574 tables belonging to other products. There is a
migration checker that fails the deploy if any DDL escapes `bask`, and this file must pass it.

Write `"bask"."thing"` — schema-qualified and quoted — for every table and every index target.

## What to create

Follow the style of the existing migrations exactly: a `-- CreateTable` comment before each table,
a `-- CreateIndex` comment before each index, uppercase SQL keywords, double-quoted identifiers,
`TIMESTAMPTZ(6)` for timestamps, `TEXT` for strings, `JSONB` for structured columns.

### Table 1 — `bask.knowledge_doc`

One row per source document (for us, one conference session).

| column | type | notes |
|---|---|---|
| `id` | `UUID` | primary key, default `gen_random_uuid()` |
| `corpus` | `TEXT` | NOT NULL. e.g. `uvalux26-expo` |
| `source` | `TEXT` | NOT NULL. the file it came from |
| `title` | `TEXT` | NOT NULL |
| `speaker` | `TEXT` | nullable — often unknown |
| `audience` | `TEXT` | NOT NULL. `employees` or `owners` |
| `title_confidence` | `TEXT` | NOT NULL, default `'interpolated'` |
| `start_sec` | `DOUBLE PRECISION` | NOT NULL, default 0 |
| `end_sec` | `DOUBLE PRECISION` | NOT NULL, default 0 |
| `words` | `INTEGER` | NOT NULL, default 0 |
| `metadata` | `JSONB` | nullable |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL, default `CURRENT_TIMESTAMP` |

Add a comment above `title_confidence` explaining, in one line, that it records whether the session
attribution was anchored on spoken content or merely derived from the printed agenda's clock — and
that an `interpolated` row must never have a quote attributed to its named speaker.

Indexes: on `corpus`, and a composite on `(corpus, audience)`.

### Table 2 — `bask.knowledge_chunk`

| column | type | notes |
|---|---|---|
| `id` | `UUID` | primary key, default `gen_random_uuid()` |
| `doc_id` | `UUID` | NOT NULL, FK to `bask.knowledge_doc(id)` `ON DELETE CASCADE` |
| `ordinal` | `INTEGER` | NOT NULL — position within the document |
| `text` | `TEXT` | NOT NULL |
| `tokens` | `INTEGER` | NOT NULL, default 0 |
| `embedding` | `public.vector(1536)` | nullable until embedded |
| `created_at` | `TIMESTAMPTZ(6)` | NOT NULL, default `CURRENT_TIMESTAMP` |

**The vector type is `public.vector`** — the `pgvector` extension (version 0.8.0) is installed in
`public` on this database, and the type must be referenced from there even though the table lives in
`bask`. Do not attempt to `CREATE EXTENSION`; it already exists and re-creating it is a change to a
shared database.

Indexes: a unique composite on `(doc_id, ordinal)`, and an index on `doc_id`.

**Do not create an ivfflat or hnsw index in this migration.** Those need tuning against real row
counts and a populated table, and adding one here would be guessing. Put a comment saying so.

### The retrieval function — `bask.match_knowledge`

A SQL function used for similarity search:

```
bask.match_knowledge(
  query_embedding public.vector(1536),
  match_count int,
  match_threshold double precision,
  filter_corpus text
)
```

Returns a table of `chunk_id uuid`, `doc_id uuid`, `text text`, `title text`, `speaker text`,
`title_confidence text`, `start_sec double precision`, `similarity double precision`.

It joins chunk to doc, filters to rows where `embedding IS NOT NULL`, filters by `filter_corpus`
when that argument is not null, computes similarity as `1 - (chunk.embedding <=> query_embedding)`,
keeps rows at or above `match_threshold`, orders by similarity descending, and limits to
`match_count`.

Declare it `LANGUAGE sql STABLE`.

Add a comment above the function noting that thresholds for this kind of retrieval are
**intentionally low** — short passages score around 0.44 similarity even when they are the right
answer, so raising the threshold is how retrieval breaks rather than how it improves.

## RULES

- Write exactly ONE file, creating its directory:
  `/home/danman60/projects/uvalux-platform/packages/db/prisma/migrations/20260820000000_knowledge_base/migration.sql`
- Do NOT create or modify any other file. Do NOT edit `schema.prisma`.
- **Do NOT execute any SQL, migration command, or database client.**
- Acceptance: the file exists, is non-empty, contains `CREATE TABLE "bask"."knowledge_doc"`,
  `CREATE TABLE "bask"."knowledge_chunk"`, `public.vector(1536)`, and
  `bask.match_knowledge`; and contains **no** occurrence of `CREATE EXTENSION`, no `DROP `, and no
  unqualified `CREATE TABLE "knowledge` (i.e. every table is schema-qualified).
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
