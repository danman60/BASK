# TASK — the automated version of his own monthly report

Write ONE file: `/home/danman60/projects/uvalux-platform/docs/pitch/SAMPLE-SALON-REPORT.html`

## What this is and why it matters

The client already produces a version of this **by hand**: he takes what a salon buys from UVALUX
and spins it back to them as a ranking against last year and against industry averages. His words:
*"we've taken their sales, their purchases, and spun it back to them being like, okay, so this is
where you rank compared to last year and the year before."*

This is that report, generated. It is the most credible artifact in the pack because it is **his own
work product, done automatically, from data he already owns** — no salon has to opt in, no rights
question, no integration.

**Frame it as one salon's monthly report**, the thing a rep would email or hand over.

## The data — use exactly these numbers

One salon, one month. Do not invent additional figures.

- Salon: **Sunset Ridge Tanning**, Burlington, Ontario
- Period: **July 2026**
- Cohort: **287 Canadian salons** of similar size
- Overall rank: **14th of 287**
- Unique customers: **1,412** · Sessions: **4,503** · Sessions per customer: **3.19**
- Revenue per session: **$14.80** (cohort median $13.20)
- Annual revenue per customer: **$108** (cohort median $131)
- Average member tenure: **2.6 months** (cohort median 3.1)

Category table, units per 100 customers:

| Category | You | Cohort median | Last year | Position |
|---|---|---|---|---|
| Bronzers | 35 | 22 | 31 | Top quartile |
| Accelerators | 24 | 21 | 24 | Above median |
| Moisturizers | 6 | 19 | 8 | Bottom quartile |
| Tan extenders | 11 | 14 | 9 | Below median |
| Facial products | 9 | 10 | 11 | Below median |
| Protection / after-sun | 17 | 16 | 15 | Above median |

## Structure

1. **Header** — salon name, period, and the rank as the headline: `14th of 287`.
2. **Four metric tiles** — revenue per session, sessions per customer, annual revenue per customer,
   average member tenure. Each shows the value, the cohort median beneath it, and a position pill.
3. **The category table** — all six rows, with a `Last year` column so movement is visible. Position
   pills use exactly these four words: `Top quartile` · `Above median` · `Below median` ·
   `Bottom quartile`.
4. **Three things to do this month** — the whole point. Each is a heading, one sentence of evidence,
   and nothing else. Use exactly these:
   - `Moisturizers are your biggest gap` — `You sell 6 per 100 customers where similar salons sell 19. Closing half that gap is worth about $410 a month.`
   - `Your members leave sooner than the group` — `2.6 months against 3.1 for salons your size. Salons running three or more modalities hold members longest.`
   - `Bronzers are your strength` — `35 per 100 customers puts you in the top quartile nationally. Worth saying out loud to your staff.`
5. **Footer** — this exact line:
   `Built from what Sunset Ridge buys from UVALUX. Cohorts smaller than 12 salons are never shown.`

## Look

Match `mockups/tokens.css` by eye — ivory `#faf7f2`, ink `#2a2028`, terracotta `#c4643c`, green
`#3f8f5f` for above-median, amber `#b8791f` for below, red `#b4462f` for bottom quartile, gold-ish
`#a98032` for top quartile. Fraunces headings, Inter body, via the Google Fonts link the mockups
use. Centred column, `max-width: 48rem`. Position pills are rounded, small, uppercase-ish, coloured
background at low opacity.

Include a `@media print` block so it prints clean on one or two pages.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/docs/pitch/SAMPLE-SALON-REPORT.html`
- Do NOT create or modify any other file.
- Acceptance: the file exists, is non-empty, starts with `<!doctype html`, contains no `<script`
  tag, contains all six category names, contains the exact footer line above, contains
  `@media print`, and contains the string `14th of 287`.
- Static HTML and CSS only. No JavaScript. No images. No CDN except the Google Fonts link.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
