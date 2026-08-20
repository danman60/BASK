# TASK — the Scoreboard page

Write ONE file: `/home/danman60/projects/uvalux-platform/mockups/06-scoreboard.html`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first.**
Copy its page shell exactly. Set `<title>Bask — Scoreboard</title>` and put `class="active"` on the
`06-scoreboard.html` nav link. Use its class vocabulary, its status words, and its demo-salon
numbers. Invent no other numbers.

## What this page is

The benchmarking screen. A salon owner sees where they rank against other Canadian salons, by
category, and what to do about the places they are behind. This is the client's own four-year-old
idea: *"You sell 35 tanning lotion while the industry average is 22 — are you above or below?
Scoreboard it."*

## Page header

- `<span class="eyebrow">Scoreboard · July 2026</span>`
- `<h1 class="page-h1">You rank <em>14th of 287</em> Canadian salons</h1>`
- `<p class="page-sub">Compared with salons of similar size across Canada. Updated monthly from what you buy and what you report.</p>`

## Section 1 — the four headline metrics

A row of four `card` tiles, CSS grid, `grid-template-columns: repeat(4, minmax(0,1fr))`, gap
`var(--space-5)`. Collapse to two columns under 900px.

Each tile contains, in this order: a small uppercase label (`eyebrow`), a big number
(`font: 600 var(--text-2xl)/1 var(--font-body)`, class `num`), and a one-line position chip using
the contract's benchmark-position words.

| label | value | chip | chip colour |
|---|---|---|---|
| REVENUE PER SESSION | `$14.80` | `Above median` | `--success` |
| SESSIONS PER CUSTOMER | `3.19` | `Top quartile` | `--gold` |
| ANNUAL REVENUE / CUSTOMER | `$108` | `Below median` | `--warn` |
| AVERAGE MEMBER TENURE | `2.6 mo` | `Below median` | `--warn` |

**Use the contract's `chip` class — do not hand-roll a pill.** `Top quartile` → `chip gold`,
`Above median` → `chip good`, `Below median` → `chip warn`, `Bottom quartile` → `chip risk`.

## Section 2 — category ranking table

Heading: `<h2>Where you sit, category by category</h2>` styled
`font: 600 var(--text-lg)/1.2 var(--font-body); margin: var(--space-10) 0 var(--space-4);`

A `card` containing a full-width `<table>`. Columns: **Category · You · Cohort median · Position**.
Numbers are units per 100 customers, right-aligned, class `num`. Table rows separated by
`border-top: 1px solid var(--line-soft)`. Header row uses `--ink-faint`, `var(--text-xs)`, uppercase.

| Category | You | Cohort median | Position |
|---|---|---|---|
| Bronzers | 35 | 22 | Top quartile |
| Accelerators | 24 | 21 | Above median |
| Moisturizers | 6 | 19 | Bottom quartile |
| Tan extenders | 11 | 14 | Below median |
| Facial products | 9 | 10 | Below median |
| Protection / after-sun | 17 | 16 | Above median |

The Position cell uses the same pill chip and the same four words and colours as Section 1.

## Section 3 — what to do about it

Heading: `<h2>What to do about it</h2>`, same style as Section 2's heading.

Three stacked blocks, each `<div class="card spined">` containing `<div class="rail risk"></div>`
(or `warn` / `good`) and then `<div class="body">`. Those classes are all defined in the contract —
do not redefine them.

Each block has an `<h3>` (`font: 600 var(--text-md)/1.3 var(--font-body)`), one sentence of
evidence in `--ink-soft` at `var(--text-sm)`, and a `btn btn-ghost` on the right.

1. **rail risk** — "Moisturizers are your biggest gap" / "You sell 6 per 100 customers; salons your size sell 19. Closing half that gap is about $410 a month." / button: `See the products`
2. **rail warn** — "Your members leave sooner than the group" / "2.6 months against a cohort median of 3.1. Salons running three or more modalities hold members longest." / button: `See what they added`
3. **rail good** — "Bronzers are your strength" / "35 per 100 customers puts you in the top quartile nationally. Worth saying out loud to your staff." / button: `Share with the team`

## Section 4 — footer note

A single line of `var(--text-xs)` in `--ink-faint`, centred, `margin-top: var(--space-10)`:
`Benchmarks cover 287 Canadian salons. Cohorts smaller than 12 salons are never shown.`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/mockups/06-scoreboard.html`
- Do NOT create or modify any other file. In particular do NOT touch `tokens.css`.
- Acceptance: the file exists, is non-empty, starts with `<!doctype html`, links `tokens.css`,
  contains all four section headings above, and contains no `<script` tag.
- Static HTML and CSS only. No JavaScript. No images. No CDN except the Google Fonts link.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
