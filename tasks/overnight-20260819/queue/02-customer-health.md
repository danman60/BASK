# TASK — the Customer Health page

Write ONE file: `/home/danman60/projects/uvalux-platform/mockups/07-customer-health.html`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first.**
Copy its page shell exactly. Set `<title>Bask — Customers</title>` and put `class="active"` on the
`07-customer-health.html` nav link. Use its class vocabulary, its status words (`Healthy` /
`Slipping` / `Lapsed`) and its demo-salon numbers. Invent no other numbers.

## What this page is

Every customer scored on one grid — who is loyal, who is drifting, who is gone — and a worklist of
the ones worth a call today. The client described wanting exactly this at the front desk:
*"it's been 85 days since Daniel last spent — this is what he generally likes."*

## Page header

- `<span class="eyebrow">Customers · Sunset Ridge Tanning</span>`
- `<h1 class="page-h1">1,412 customers. <em>329 are slipping.</em></h1>`
- `<p class="page-sub">Scored on how recently they came, how often they used to, and what they spend. Sorted so the ones worth a call today are at the top.</p>`

## Section 1 — the three band tiles

A row of three `card` tiles, `grid-template-columns: repeat(3, minmax(0,1fr))`, gap
`var(--space-5)`. Collapse to one column under 700px.

Each tile is `<div class="card spined">` with `<div class="rail good"></div>` (or `warn` / `risk`)
and a `<div class="body">` holding: the count as a big number (`var(--text-2xl)`, class `num`), the
band word beneath it, and a one-line explanation in `--ink-soft` at `var(--text-sm)`. Those classes
come from the contract — do not redefine them.

| spine | count | band | explanation |
|---|---|---|---|
| `--success` | 986 | Healthy | Coming as often as they always have. |
| `--warn` | 329 | Slipping | Quieter than their own normal. Still winnable. |
| `--risk` | 97 | Lapsed | Gone long enough that it takes a real reason to return. |

## Section 2 — the health grid

Heading: `<h2>The grid</h2>`, styled
`font: 600 var(--text-lg)/1.2 var(--font-body); margin: var(--space-10) 0 var(--space-4);`
Under it a one-line caption in `--ink-faint` at `var(--text-xs)`:
`Each square is one customer. Darker means longer since their last visit.`

Inside a `card`: a dense grid of small squares, `display: grid;
grid-template-columns: repeat(auto-fill, minmax(14px, 1fr)); gap: 4px;`. Each square is a `<span>`
with `aspect-ratio: 1; border-radius: 3px;`.

Produce **exactly 120 squares**, written out literally in the HTML — this is a static mockup, so
there is no loop. Distribute them to mirror the real split: **84 squares** with
`background: var(--success-wash)`, **28 squares** with `background: var(--warn-wash)`, and
**8 squares** with `background: var(--risk-wash)`. Scatter them so the warn and risk squares are
mixed through the grid rather than grouped at the end.

Below the grid, a legend row: three small pills using the contract's band words and colours.

## Section 3 — worth a call today

Heading: `<h2>Worth a call today</h2>`, same style as Section 2's heading.

A `card` containing a table. Columns: **Customer · Last visit · Usually · Band · Why**.

| Customer | Last visit | Usually | Band | Why |
|---|---|---|---|---|
| Marisa Contreras | 38 days ago | every 9 days | Slipping | Her bottle ran out around day 24. |
| Dee Whitfield | 31 days ago | every 7 days | Slipping | Was on the Thursday package, stopped renewing. |
| Aaron Boyle | 85 days ago | every 12 days | Lapsed | Spent $340 last year. No contact since April. |
| Priya Raman | 26 days ago | every 6 days | Slipping | Her usual bronzer has been out of stock twice. |
| Sam Oduya | 44 days ago | every 10 days | Slipping | Membership paused in June, never restarted. |

Band cells use the contract's `chip` class — `Healthy` → `chip good`, `Slipping` → `chip warn`,
`Lapsed` → `chip risk`. Do not hand-roll a pill.
The `Why` column is `--ink-soft` at `var(--text-sm)`.

Each row ends with a `btn btn-quiet` reading `Draft a note`.

## Section 4 — the bottle card

A single `card` at the bottom, with a `--primary-wash` background, `padding: var(--space-6)`.

- `<h3>` reading `We can tell when the bottle runs out`
- one paragraph in `--ink-soft`: `You don't weigh anyone's bottle. But you know how many tans they've taken and when they last bought — and it's about half an ounce a tan. That's enough to work out who is nearly empty, and to say something before they run out and buy elsewhere.`
- a line in `--primary-deep`, `font-weight: 600`: `41 customers are within two weeks of empty.`
- a `btn btn-primary` reading `See the list`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/mockups/07-customer-health.html`
- Do NOT create or modify any other file. In particular do NOT touch `tokens.css`.
- Acceptance: the file exists, is non-empty, starts with `<!doctype html`, links `tokens.css`,
  contains all four section headings above, contains at least 120 `<span` elements for the grid,
  and contains no `<script` tag.
- Static HTML and CSS only. No JavaScript. No images. No CDN except the Google Fonts link.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
