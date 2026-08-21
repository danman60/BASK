# TASK — the embedding ingest script

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/db/scripts/knowledge/embed.ts`

## What this is

Reads the extracted expo corpus, chunks each document, embeds each chunk, and writes both to the
database. It is run by hand, once per corpus, not on a schedule.

## ⚠️ WRITE THE SCRIPT. DO NOT RUN IT.

It writes to a **shared production database** and spends money on an embedding API. Writing the file
is this task; running it is not.

- Do **not** execute the script, `tsx`, `node`, `prisma`, `psql`, or anything that opens a database
  connection or makes an HTTP request.
- A human runs it after review.

## Inputs it reads

- Corpus: `/home/danman60/projects/uvalux-platform/packages/db/fixtures/knowledge/uvalux26-expo.jsonl`
  — one JSON object per line, already produced. Each line has: `corpus`, `source`, `room`,
  `audience`, `title`, `speaker`, `titleConfidence`, `scheduledTime`, `startSec`, `endSec`, `words`,
  `text`.
- Chunker: `chunkText` from `@bask/core`'s knowledge module. Import it as
  `import { chunkText } from '../../../core/src/knowledge/chunk';`
- DB client: `import { db } from '../../src/index';` — the shared client. **Never read
  `process.env.DATABASE_URL` directly.**

## Behaviour

1. Read the JSONL file with `readFileSync`, split on newlines, drop empty lines, `JSON.parse` each.
2. **Print a plan and require confirmation before writing anything.** The script must print the
   corpus name, the document count, the total word count, and the target table names, then check for
   `process.env.EMBED_CONFIRM === 'yes'`. If that is not set, print
   `Dry run. Set EMBED_CONFIRM=yes to write.` and exit 0 **without touching the database or calling
   the embedding API**. This is not optional — it is the guard that stops an accidental run from
   costing money and mutating a shared database.
3. With confirmation: for each document, insert a `bask.knowledge_doc` row, then `chunkText` its
   `text`, then embed the chunks and insert `bask.knowledge_chunk` rows carrying `doc_id`,
   `ordinal`, `text`, `tokens` and `embedding`.
4. Embed in **batches of at most 64 chunks per API call**, and log progress per document as
   `<n>/<total> <title> — <chunks> chunks`.
5. On an API error for a batch: log it, skip that batch, continue, and count it. At the end print how
   many chunks failed. **Never silently swallow a failure** and never retry more than twice.
6. Print a final summary: documents written, chunks written, chunks failed.

## The embedding call

OpenAI embeddings, model `text-embedding-3-small`, 1536 dimensions — that is what the column is
sized for. Read the key from `process.env.OPENAI_API_KEY`; if it is missing, exit with a clear
message before doing anything else. Use `fetch` against
`https://api.openai.com/v1/embeddings` with a JSON body of `{ model, input }` where `input` is the
array of chunk strings. Do not add an SDK dependency.

## Style

Match `packages/db/scripts/health-distribution.ts`: a doc comment at the top explaining what it does
and what it touches, plain `console.log` output, no argument parser, top-level `main()` called at
the bottom.

Open the doc comment by stating plainly that this script **writes to a shared database** and is
gated behind `EMBED_CONFIRM`.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/db/scripts/knowledge/embed.ts`
- Do NOT create or modify any other file. Do NOT edit `package.json`.
- **Do NOT execute anything.** No `tsx`, no `node`, no database client, no HTTP request.
- Acceptance: `npx tsc --noEmit` inside `/home/danman60/projects/uvalux-platform/packages/db`
  reports zero errors naming this file; the file contains `EMBED_CONFIRM`,
  `text-embedding-3-small`, `chunkText` and `uvalux26-expo.jsonl`; and it does NOT contain
  `process.env.DATABASE_URL`.
- No `any`.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
