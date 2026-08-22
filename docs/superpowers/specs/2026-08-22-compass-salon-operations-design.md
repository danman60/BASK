# Spec 2 — Salon data & what is running: extend, do not rebuild

**Purpose line, verbatim:** *This exists so that there is one [sub-page] for salon data and
insights and show what's currently running on what salons etc.*

Read `2026-08-22-compass-internal-overview-design.md` first.

---

## 1. This one is mostly built — that is the finding

`/compass/network` and `/compass/accounts` already exist and are live demo surfaces. The Network
page already carries salons, band distribution, `byRegion`, `adoption`, `signalCards` and `cohort`,
with a `NetworkMap` component. `/compass/accounts/[slug]` already gives a per-account view.

**So this spec is deliberately small.** Building a third salon-data page would be the documented
failure mode — a parallel copy of something that already works. The gap between what exists and
what the brief asks for is one thing:

> *"show what's currently running on what salons"*

That is a **live operational state** view. The existing pages answer *how is this salon doing*
(health bands, signals, trends). Neither answers *what is switched on and in flight right now* —
which campaigns are mid-send, which opportunities are open, which staff challenges are running,
which orders are pending.

Build order note: this is **last** of the three because these are pitch-path surfaces.
`pnpm demo:verify` walks them, and breaking them costs a meeting.

## 2. What gets added

### 2.1 A "Running now" band on `/compass/network`

Not a new page. A band on the page that already answers network-level questions, showing across
the network:

- campaigns in flight (count, and how many salons)
- open opportunities by category, and how many have been acted on today
- staff challenges running
- draft/pending UVALUX orders — this one already has a home in the ordering flow and links there

Each row is a rollup with its contributor count, obeying the cohort minimum. Clicking through goes
to the existing account view, not to a new drill-down surface.

### 2.2 A "Currently running" section on `/compass/accounts/[slug]`

Per salon, the live state: which features are on, what is mid-flight, when each last changed.
This is the honest per-salon answer, and it is **gated by that salon's consent tier** — a salon at
the name-only tier shows the existing "shares their name and nothing else" treatment, unchanged.

### 2.3 What is explicitly NOT added

- No new route. No `/compass/salons`. The two existing destinations cover it.
- No new "insights" concept — `Insight` already exists as a model and `signalCards` already
  renders network rollups. Extending those beats inventing a third vocabulary.
- No health-score exposure. The consent filter deliberately never puts `healthScore` in the
  payload; bands and factors only. **That stays.**

## 3. Data

Reads existing models: `Org`, `Salon`, `Account`, `Campaign`, `Insight`, `DraftOrder`,
`activity_event` for "last changed". No new tables.

Extends the existing `compass` tRPC router with `runningNow({ scope })` rather than creating a new
router — the data and the consent path are the same ones that router already owns.

## 4. Acceptance criteria

1. No new route added; both changes land on existing pages.
2. "Running now" band renders on Network with contributor counts and cohort suppression.
3. Per-salon section respects consent tier; a name-only salon shows no operational detail.
4. `healthScore` still absent from every payload — verified by reading the selector.
5. Existing Network and Accounts behaviour unchanged; **`pnpm demo:verify` passes the PITCH.md
   path**, which is the real gate for this spec.
6. `graphify affected` run on every modified symbol before finishing; HIGH/CRITICAL blast radius
   reported, not silently accepted.
7. Composited screenshot DM'd.

## 5. Out of scope

Rebuilding Network or Accounts. Real-time push — "currently running" refreshes on load and on an
explicit refresh, not over a socket. Auth (M3).
