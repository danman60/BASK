# uvalux-platform — project rules

**Bask** (salon operating system) + **Compass** (UVALUX dealer intelligence). Demo-first: this
product's first job is winning a stakeholder meeting. Read `docs/IMPLEMENTATION_SPEC.md` §0 before
deciding anything is "good enough for now".

## Read first
| File | What it is |
|---|---|
| `docs/PRODUCT_SPEC.md` | What/why — vision, personas, principles, scope tiers |
| `docs/IMPLEMENTATION_SPEC.md` | How — architecture, milestones, constraints |
| `docs/DESIGN_SPEC.md` | Screen anatomy, tokens, copy voice. `mockups/*.html` are the visual bar |
| `docs/pitch/PITCH.md` | The timed demo script every surface must serve |
| `CURRENT_WORK.md` | Live state, blockers, open tuning |

## Database — SHARED project, do not get this wrong
- **Supabase project: `supabase-CCandSS`** (shared with other apps). **All Bask objects live in the
  `bask` Postgres schema.** Never create a new Supabase project. Never touch `public` or another
  app's schema — 574 tables belonging to other products live in this database.
- **Prisma Migrate MUST use `DIRECT_DATABASE_URL` (:5432).** The `:6543` pgbouncer pooler hangs
  Migrate *silently and forever* — no error, no timeout. Runtime queries use `DATABASE_URL`.
- Migrations: `pnpm db:migration:new` → `pnpm db:check` (asserts bask-scoped DDL) → `pnpm db:deploy`.
  **Never `prisma migrate dev`.** `db:check` is the guard that stops a migration landing in `public`.
- Prisma 7 needs a driver adapter (`@prisma/adapter-pg`); `datasourceUrl` no longer exists.
- Import `{ db }` from `@bask/db` — never read `process.env.DATABASE_URL` in a route. Route-module
  clients must be lazy or `next build`'s page-data collection fails on the missing env.

## Demo harness
- `pnpm demo:reset` (~32s) reseeds 36,351 deterministic rows; `pnpm demo:advance --days N` moves the
  virtual clock and runs the pipeline (campaign settle → rollups → insight sweep → brief regen).
- **Concurrent `demo:reset` is NOT safe** — parallel agents doing it caused FK violations and
  interleaved state. One owner per reset.
- `pnpm demo:verify` walks the whole PITCH.md path in a browser. Unbuilt surfaces report SKIP,
  never PASS. **Run it before any meeting.**
- Presenter Panel: **⌘⇧D** — clock, role switch, all 7 pitch bookmarks, theme.

## Conventions
- Routes for the operator app go in `apps/web/src/app/(bask)/` — that group carries the shell and
  nav. `/compass`, `/book` and `/dev/*` stay outside it on purpose.
- `ThemeProvider` lives in the ROOT layout. Don't add another.
- **`packages/core/consent` is the one filter every Compass read goes through.** No query may route
  around it, not even "just for the demo".
- Insight evidence uses the single `Evidence` zod schema in `@bask/core`. Don't invent a second shape.
- All user-facing copy comes from the guidance dictionary (`packages/ui/src/guidance/guidance.ts`),
  grade-7 register. Two lanes appending to it once produced a merge that swallowed six closing
  braces — check the parse after any conflict there.
- **No auth machinery until M3** (explicit non-goal). Roles come from the URL / presenter panel.

## Logging
`rlog(tag, msg, data)` / `rerror(...)` from `@/lib/log`. Sink is `/api/_logs`, gated on `LOG_TOKEN`,
rows in `bask.app_log`. Pull from anywhere:
`curl "https://<deploy>/api/_logs?token=$LOG_TOKEN&since=0" | jq`

## Known state
- **The "Anthropic key is out of credits" story is STALE — do not repeat it.** Verified 2026-08-25:
  `packages/core/src/ai/client.ts:9` records the provider was switched to **OpenAI on 2026-08-07**;
  `isAiConfigured()` gates on `OPENAI_API_KEY`, that var IS set on Vercel, and a live `gpt-4.1` call
  returned HTTP 200. Models: `DEFAULT_AI_MODEL='gpt-4.1'`, `insight.classify`→`gpt-4.1-mini`,
  override with `AI_MODEL`. Every generated surface still labels which path ran — if one reads
  `fallback`, diagnose it fresh against the OpenAI path rather than inheriting the Anthropic story.
- Fixture volume: day-zero Daybreak reads "31% below your usual Monday" where PITCH.md wants
  "8% above"; impact figures run ~10× the mockups (~96 visits/day). Arithmetic is right, volume is
  a design decision.
