# TASK — the technical packet for Wilfred

Write ONE file: `/home/danman60/projects/uvalux-platform/docs/pitch/TECHNICAL-PACKET.md`

## Who reads this

**Wilfred** — the client's technical lead, ran data centres before this, runs their hosting. The
client offered an intro to him twice, which makes him the due-diligence gate. He is not a buyer to
be impressed; he is an engineer looking for the thing you got wrong.

The standard he judges against, in the client's own words:

> "The entire business's value is based on their data and what their customers are. It's custody…
> if we screwed that up, the salon shuts down."

## THE RULE FOR THIS FILE

**Every technical claim in this document must come from the fact list below, verbatim.**

Do not add a capability, a guarantee, a certification, an encryption claim, a compliance standard,
an uptime figure, or a backup policy that is not in that list. **If something a reader would expect
is not in the list, it goes in the "Open" section as an open question — not into the body as a
claim.** An invented assurance in a document written for an ex-data-centre engineer is the single
worst failure this task can produce. Being visibly honest about what is not yet decided is what
earns this reader; a confident overclaim loses him permanently.

## The facts — use these and only these

**Application**
- Next.js 16, App Router, TypeScript. Deployed on Vercel.
- tRPC for the API layer. Prisma 7.9 as the ORM, using the `@prisma/adapter-pg` driver adapter.
- Monorepo: `apps/web`, plus `packages/core` (domain logic), `packages/db`, `packages/ui`,
  `packages/tokens`.

**Data**
- PostgreSQL, hosted on Supabase.
- **Every object lives in a dedicated `bask` schema.** The database is shared with other unrelated
  applications, and schema isolation is the boundary. Migrations are checked by a script
  (`db:check`) that fails the deploy if any DDL would land outside `bask`.
- 35 tables. Row Level Security is enabled on 29 of them.
- `pgvector` 0.8.0 is available and is what the knowledge base will use for retrieval.

**The consent layer**
- `packages/core/consent` is a single filter that **every** read of salon data destined for UVALUX
  passes through. There is no second path and no bypass, including for demonstrations.
- Consent is expressed in tiers, and changing the tier visibly changes what UVALUX can see.
- Benchmarks are suppressed below a cohort of 12 salons, so a comparison cannot identify the salons
  inside it.

**Insights**
- Detectors and sweeps are **pure functions**: no clock reads, no randomness, no I/O. The same input
  produces the same output, which is what makes a result reproducible and auditable.
- All evidence conforms to one versioned schema. Every figure shown to a user carries the evidence
  that produced it.

**Logging**
- Structured application logging to a `bask.app_log` table, behind a token-gated endpoint.

**Current status, stated plainly**
- This is a demonstration build. **There is no authentication yet** — it is a deliberate deferral
  for the demo, and it is listed as a prerequisite before any real salon data is loaded.
- No production salon data has ever been loaded into it. Everything shown is generated fixture data.

## Structure

1. **What this is** — two sentences. A demo build, and what it would take to make it real.
2. **Architecture** — from the facts above. Short. He can read a stack list.
3. **How salon data is isolated** — schema boundary, RLS, the migration guard.
4. **The consent layer** — why it is the licence to operate rather than a feature.
5. **Why results are reproducible** — purity, versioned evidence.
6. **Open — what is not decided yet.** The honest list. Include at minimum: data residency and
   hosting region for real data; encryption-at-rest and key management specifics; backup and
   retention policy; authentication and role model; whether analytics would ever run against hosted
   operational data or only against exports; and the fact that rights to use hosted data for
   analytics are not yet obtained.
7. **What I would want from you** — three questions for Wilfred: where their data must physically
   live, what their current backup and retention commitments to salons are, and whether they would
   prefer analytics to run against a copy or against a read replica.

Note in section 6 that the client already chose their hosting provider partly for **data residency**
— Canadian data in Canada, Irish data in Ireland — so residency is a hard requirement to design to,
not a preference. That is a fact from the meeting and may be stated.

Open the file with this exact line:

`> DRAFT — generated overnight from a supplied fact list. Every claim needs verifying before this reaches Wilfred.`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/docs/pitch/TECHNICAL-PACKET.md`
- Do NOT create or modify any other file.
- Acceptance: the file exists, is non-empty, contains the exact DRAFT line above, contains a
  `## Open` section, contains the strings `bask`, `Row Level Security`, `residency` and
  `no authentication`, and does NOT contain any of: `SOC 2`, `ISO 27001`, `HIPAA`, `PIPEDA
  compliant`, `99.9`, `bank-grade`, `military-grade`, `end-to-end encrypted`.
- Markdown only. No invented capabilities.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
