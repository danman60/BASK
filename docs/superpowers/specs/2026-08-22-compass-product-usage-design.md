# Spec 3 — `/compass/usage`: how salons actually use Bask

**Purpose line, verbatim:** *This exists so that the UVALUX internal side should have deep deep
insight into how users are using the app.*

Read `2026-08-22-compass-internal-overview-design.md` first.

---

## 1. The job, and the line this surface must not cross

Two different questions hide inside "how are users using the app", and only one of them is
legitimate here:

- **Product question** — *"is the Opportunity feed being used? do people click the one-click
  actions or ignore them? where do they drop out?"* This is UVALUX improving its own product.
- **Surveillance question** — *"what is Salon #42's staff doing right now?"* This is not UVALUX's
  business and the consent tier does not permit it.

**The design rule that keeps these apart: this surface reads BEHAVIOUR, not CONTENT.** That a
campaign was sent is product telemetry. What the campaign said is salon data. The first is in
scope; the second is not, and no drill-down leads there.

Two hard requirements follow:

1. **Every read goes through `packages/core/consent`**, and the aggregate views obey a **minimum
   cohort size** — a metric computed from fewer than *k* salons renders as "not enough salons to
   show this", never as a number. `cohortSuppressed` already exists in the guidance dictionary for
   exactly this.
2. **Per-salon usage detail requires the salon's consent tier to allow it.** Where it does not, the
   salon appears in aggregates and nowhere else. This mirrors the Network page's existing honesty:
   *"These salons share their name and nothing else. That is their choice, and it holds."*

If those two hold, this is a legitimate product-analytics surface. If they are relaxed "just for
the demo", it becomes the thing that loses a stakeholder's trust in the room.

## 2. Data source

`bask.activity_event` already exists. This spec does **not** invent a parallel telemetry pipeline.

Work needed before the UI is real:
- **Audit what `activity_event` actually records today** — the event vocabulary, whether it is
  written on the paths that matter (opportunity actions, campaign sends, Monitor views, brief
  opens), and its retention. *This audit is task one and its findings may change §3.*
- Add events only where a genuine gap is found, using the existing table and shape. Every new
  event is named in a single vocabulary module so the list is greppable, not scattered string
  literals.
- `app_log` (`rlog`/`rerror` → `bask.app_log`) stays what it is: engineering diagnostics, not
  product analytics. Do not conflate them.

## 3. The four questions the page answers

Structured as four bands down the page, RELAXED density, each a rollup with its contributor count
visible.

**Adoption — who has switched on what.** Per feature (Opportunity feed, Monitor, Campaigns,
Memberships, Ordering): how many salons have used it at all, in the last 7 / 30 days. A feature
nobody uses is the most valuable fact on this page.

**Engagement — depth, not vanity.** Sessions per salon per week; actions per session; the ratio
that matters most: **opportunities surfaced vs. opportunities acted on**. That single ratio is the
product thesis — Bask claims to find money and make acting on it one click. If the ratio is low,
the thesis is failing and this page is the only place that says so.

**Funnels — where people stop.** For the money path: opportunity seen → opened → action previewed
→ action sent → outcome recorded. Rendered as a stepped bar with drop-off between steps. Same for
onboarding.

**Cohorts — who thrives.** Group salons by tenure and by size, and compare the above. Answers
"does Bask work better for big salons?" — the question a stakeholder will ask.

Each band supports a time window (7d / 30d / 90d) and shows **absolute counts alongside
percentages**. A percentage without its denominator is how dashboards mislead.

## 4. Screens

Route `apps/web/src/app/compass/(app)/usage/page.tsx`, plus a `Usage` entry in `CompassShell`'s
`NAV`.

- Reuses `StatRow`, `TrendArrow`, `EvidenceTileRow`, `ConsentBadge`, `CompassEmpty`, `Whisper`.
- Charts: **no charting library**. These are bars, steps and sparklines — inline SVG with token
  colours, following the dataviz discipline (one accent, categorical only where categories are
  real). Adding a chart library here would import a second design system through the back door.
- Every metric tile carries its contributor count and a one-line plain-English reading, per the
  house principle that a naked score is never shown.

## 5. API

New tRPC router `packages/api/src/routers/usage.ts`:

- `adoption({ window })`, `engagement({ window })`, `funnel({ name, window })`,
  `cohorts({ by, window })`
- All aggregate-only. **There is deliberately no `usage.bySalon` procedure** in this milestone —
  omitting it is cheaper than adding it and policing it, and it can be added later behind a
  consent check when there is a named reason to.

Queries are rollups over `activity_event`, computed server-side, cached per window. If a rollup
takes longer than ~1s, it becomes a scheduled rollup table rather than a live query — the same
pattern `demo:advance` already uses.

## 6. Error handling

- No telemetry yet for a feature → *"No activity recorded for this yet"*, not `0%`. The difference
  between "nobody used it" and "we are not measuring it" must never be blurred.
- Below cohort minimum → the suppression copy, with the count of contributing salons hidden too.
- Query failure → `CompassEmpty` with the real error.

## 7. Acceptance criteria

1. `activity_event` audit written up before any UI work; gaps listed explicitly.
2. `/compass/usage` renders in the shell with a nav entry.
3. Every metric shows its denominator and contributor count.
4. A metric below the cohort minimum renders as suppressed, verified with a seeded fixture.
5. No procedure returns per-salon behaviour in this milestone; `grep` proves it.
6. Every read passes through the consent filter — verified by reading the router, not by assertion.
7. Tokens only; no hex literals; no chart library added.
8. `pnpm demo:verify` still passes.
9. Composited screenshot DM'd.

## 8. Out of scope

Per-salon behavioural drill-down. Session replay. Anything resembling per-employee monitoring —
staff-level coaching lives in Bask's Monitor, is consented there, and does not belong in an
internal UVALUX analytics view.
