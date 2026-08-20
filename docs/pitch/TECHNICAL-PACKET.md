> DRAFT — generated overnight from a supplied fact list. Every claim needs verifying before this reaches Wilfred.

## What this is

This is a demonstration build of the UVALUX platform. It shows what the system would look like with real salon data, but no production data has ever been loaded into it. The demo is deliberately missing authentication, which is a prerequisite for loading real salon data.

## Architecture

The application is built on Next.js 16 with the App Router and TypeScript, deployed on Vercel. The API layer uses tRPC with Prisma 7.9 as the ORM, using the `@prisma/adapter-pg` driver adapter. The codebase is a monorepo with the following packages: `apps/web`, `packages/core` (domain logic), `packages/db`, `packages/ui`, and `packages/tokens`.

## How salon data is isolated

All salon data lives in a dedicated `bask` schema within a PostgreSQL database hosted on Supabase. The database is shared with other unrelated applications, and the schema boundary serves as the isolation mechanism. Row Level Security (RLS) is enabled on 29 of the 35 tables to ensure that access controls are enforced at the row level. Migrations are checked by a script (`db:check`) that fails the deploy if any DDL would land outside `bask`.

## The consent layer

The `packages/core/consent` package is a single filter that every read of salon data destined for UVALUX passes through. There is no second path and no bypass, including for demonstrations. Consent is expressed in tiers, and changing the tier visibly changes what UVALUX can see. Benchmarks are suppressed below a cohort of 12 salons, so a comparison cannot identify the salons inside it.

## Why results are reproducible

Detectors and sweeps are pure functions: no clock reads, no randomness, no I/O. The same input produces the same output, which is what makes a result reproducible and auditable. All evidence conforms to one versioned schema, and every figure shown to a user carries the evidence that produced it.

## Open

There are several technical decisions that have not yet been made:

- Data residency and hosting region for real data: The client has chosen their hosting provider partly for data residency — Canadian data in Canada, Irish data in Ireland — so residency is a hard requirement.
- Encryption-at-rest and key management specifics: These details are not yet decided.
- Backup and retention policy: The specific policies for backup and data retention have not been determined.
- Authentication and role model: The authentication system and role-based access control model have not yet been implemented.
- Analytics against hosted operational data: It is not yet decided whether analytics would ever run against hosted operational data or only against exports.
- Rights to use hosted data for analytics: The rights to use hosted data for analytics purposes are not yet obtained.

## What I would want from you

1. Where must their data physically live? (This relates to the hard requirement of data residency.)
2. What are their current backup and retention commitments to salons?
3. Would they prefer analytics to run against a copy or against a read replica?
