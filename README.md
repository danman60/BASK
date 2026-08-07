# uvalux-platform — Bask + Compass

One monorepo, one dataset, two products:

- **Bask** — the salon operating system (owner surfaces, The Floor front desk).
- **Compass** — UVALUX dealer intelligence, reading the same data through the consent filter.

Specs live in `docs/` (`PRODUCT_SPEC.md`, `IMPLEMENTATION_SPEC.md`, `DESIGN_SPEC.md`), execution
plans in `docs/plans/`. Read `docs/plans/2026-08-07-m0-foundation.md` before touching code.

## Layout

```
apps/web        Next.js 16 (App Router) — Bask owner surfaces, /floor PWA, /compass
apps/mobile     placeholder — Expo app scaffolded at M2
packages/core   domain types, insight rules engine, demo clock, consent filter (pure TS)
packages/api    tRPC routers + zod schemas (one API for web + mobile)
packages/db     Prisma schema + migrations + fixture generators (Postgres schema `bask`)
packages/tokens design tokens + themes (Sunset / Dusk / Compass)
packages/ui     shared web components + guidance primitives
```

`apps/bridge` (on-prem hardware service) is created at **M4**, not before.

## Commands

```bash
pnpm install
pnpm dev          # turbo run dev — apps/web on http://localhost:3417
pnpm build        # turbo run build
pnpm typecheck    # turbo run typecheck
pnpm lint         # eslint . (one shared flat config at the root)
pnpm format       # prettier --write .
```

Workspace packages are **just-in-time packages**: they export TypeScript source and have no build
step; `apps/web` compiles them via `transpilePackages`.

## Database

All objects live in the Postgres schema **`bask`** on the **shared CC&SS Supabase project**
(`netbsyvxrhrqxyzqflmd`) — the same project that hosts other apps. Nothing in this repo may create,
alter, or drop anything outside the `bask` schema, and no foreign key may reference a table outside
it. Connection strings come from `~/.env.keys`; copy `.env.example` to `.env` to work locally.

## Conventions

- TypeScript strict everywhere; shared ESLint (flat) + Prettier config at the root.
- All user-facing timestamps render in **America/New_York**.
