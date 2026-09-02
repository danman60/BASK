# TASK — Monitor fixtures

Write ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/monitor/fixtures.ts`

**Read `/home/danman60/projects/uvalux-platform/tasks/opportunity-20260821/CONTRACT.md` first.**
Then read `/home/danman60/projects/uvalux-platform/packages/core/src/monitor/types.ts` — your file
must satisfy those types exactly.

The Front Desk Monitor's demo day: the listener status, eight analyzed conversations, four
employees, three coaching patterns. Literal data, deterministic, no clock, no randomness, no I/O.

## The file

Start with a doc comment: demo dataset for Sunset Ridge Tanning, August 2026; no audio is
processed anywhere in this codebase; customers are pattern labels, never names.

Imports, exactly (relative):

```ts
import type { MonitorFixture } from './types';
```

Export exactly one constant:

```ts
export const DEMO_MONITOR: MonitorFixture = { status: {...}, interactions: [...], employees: [...], insights: [...] };
```

## status

deviceName `Front Desk Listener`, location `Front desk`, online `true`, interactionsToday `47`,
uptimeDays `12`, consentNote
`The team knows it's here. Conversations are scored for coaching — nobody is disciplined off a transcript.`

## interactions — eight entries, times between 10:05 AM and 6:40 PM, ids `int-01` … `int-08`

Staff are **Maya**, **Jordan**, **Priya** (Tess appears only in the employees table).
`customerLabel` is ALWAYS a pattern label: `Regular · visits 2×/week`,
`New · first visit`, `Member · 8 months`, `Lapsed · last visit 6 weeks ago`, and similar. NEVER a
person's name.

Each interaction: 3–5 excerpt lines alternating staff/customer, five scores 0–5, an outcome, an
outcomeDetail, and a coachingNote aimed at the lowest score. Write real, natural salon dialogue.
Spread the outcomes: 2 `sale`, 1 `membership`, 2 `no_sale`, 3 `missed_opportunity`.

Must include, among the eight:
- Maya converting a regular to a membership by doing the per-visit math out loud (high scores —
  this is the exemplar the insights reference).
- Jordan ringing up a session without mentioning any product while the customer talks about dry
  skin (`missed_opportunity`, product score 0 — the coachable moment of the whole surface).
- Priya greeting well but freezing on a membership question and saying she will "ask someone"
  (`no_sale`, membership score 1, a kind coachingNote — she is new).
- A lapsed customer returning and nobody acknowledging the gap (`missed_opportunity`).

## employees — four entries

- Maya, `Front desk`, 18 interactions, 9 membershipMentions, 4 conversions, 31 attachmentPct,
  trend `up`, no flag.
- Jordan, `Evenings`, 14 interactions, 2 membershipMentions, 0 conversions, 9 attachmentPct,
  trend `down`, flag `Product moments — pair with Maya this week`.
- Priya, `Part-time`, 9 interactions, 1 membershipMention, 0 conversions, 18 attachmentPct,
  trend `flat`, flag `New — membership answers, not effort`.
- Tess, `Manager`, 6 interactions, 3 membershipMentions, 1 conversion, 24 attachmentPct,
  trend `flat`, no flag.

## insights — three entries, ids `mi-01` … `mi-03`

1. Pattern: evenings rarely mention products after 6 PM even when customers bring up skin care.
   evidenceCount 11. Suggestion: a two-minute shift-start habit — one featured lotion, one
   sentence about it. knowledgeRef `Room A · 10:42`.
2. Pattern: when staff do the per-visit membership math out loud, customers say yes far more
   often (Maya's method). evidenceCount 9. Suggestion: make the math the standard answer to
   "how much is membership?". knowledgeRef `Room B · 2:17`.
3. Pattern: returning lapsed customers are greeted like strangers — nobody welcomes them back.
   evidenceCount 5. Suggestion: check-in flags the gap so the greeting can land; no
   knowledgeRef.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/packages/core/src/monitor/fixtures.ts`
- Do NOT create or modify any other file.
- No `Date.now()`, no `new Date()`, no `Math.random`, no I/O, no `any`.
- Acceptance: `tsc --noEmit` in `packages/core` reports zero errors naming this file;
  `DEMO_MONITOR` exported; Maya, Jordan, Priya and Tess all present; no customerLabel that looks
  like a real name.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
