# CONTRACT — shared shell, tokens and copy for the pitch demo surfaces

**Supervisor-written. Task zero. NOT dispatched to a model.**
Every task file references this. No task file redefines anything in it.

Its whole job is to stop four independently-written pages from disagreeing about the nav, the
wordmark, the class names or the status wording — which is the one thing a per-file builder cannot
see for itself.

---

## Where these files go

All three pages live in `mockups/`, beside the existing five. That is deliberate: they inherit
`tokens.css` from the same directory with `<link rel="stylesheet" href="tokens.css">` and no path
juggling, and the existing mockups are the visual acceptance bar (`docs/DESIGN_SPEC.md`).

## The page shell — copy this EXACTLY into every page

Every page is a complete standalone HTML document with this head and this top bar. Only `<title>`
and which nav link carries `class="active"` change.

```html
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bask — PAGE TITLE HERE</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="tokens.css">
<style>
/* page-specific CSS goes here — see the task file */
.topbar {
  position: sticky; top: 0; z-index: 5;
  display: flex; align-items: center; gap: var(--space-6);
  padding: 14px var(--space-10);
  border-bottom: 1px solid var(--line-soft);
  background: oklch(98.2% 0.004 84 / 0.85); backdrop-filter: blur(12px);
}
.wordmark { font: italic 600 22px/1 var(--font-display); letter-spacing: -0.01em; }
.nav { display: flex; gap: 4px; margin-left: var(--space-8); }
.nav a {
  font: 500 var(--text-sm)/1 var(--font-body); color: var(--ink-faint);
  text-decoration: none; padding: 8px 14px; border-radius: 999px;
}
.nav a.active { color: var(--ink); background: var(--paper-2); font-weight: 600; }
.top-right { margin-left: auto; display: flex; align-items: center; gap: var(--space-4); }
.salon-chip { font: 500 var(--text-sm)/1 var(--font-body); color: var(--ink-soft); }
.avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--primary-wash); color: var(--primary-deep);
  display: grid; place-items: center; font: 700 12px/1 var(--font-body);
}
.shell { max-width: 1180px; margin: 0 auto; padding: var(--space-10); }
.eyebrow { font: 600 var(--text-xs)/1 var(--font-body); color: var(--ink-faint); letter-spacing: 0.08em; text-transform: uppercase; }
.page-h1 { font: 500 var(--text-2xl)/1.18 var(--font-display); letter-spacing: -0.015em; margin: var(--space-3) 0 var(--space-2); }
.page-h1 em { font-style: italic; color: var(--primary-deep); }
.page-sub { font-size: var(--text-md); color: var(--ink-soft); max-width: 58ch; margin-bottom: var(--space-8); }

/* Spined card. `card` and `eyebrow` come from tokens.css — these do not. */
.spined { display: grid; grid-template-columns: 4px minmax(0,1fr); overflow: hidden; }
.rail { border-radius: 4px 0 0 4px; }
.rail.good { background: var(--success); }
.rail.warn { background: var(--warn); }
.rail.risk { background: var(--risk); }
.rail.brand { background: var(--primary); }
.spined .body { padding: var(--space-5) var(--space-6); }

/* Status pill. ONE definition, used by every page, every chip. */
.chip { display: inline-block; border-radius: 999px; padding: 5px 10px; font: 600 var(--text-xs)/1 var(--font-body); }
.chip.good { color: var(--success); background: var(--success-wash); }
.chip.warn { color: var(--warn); background: var(--warn-wash); }
.chip.risk { color: var(--risk); background: var(--risk-wash); }
.chip.gold { color: var(--ink); background: oklch(72% 0.084 85 / 0.22); }

/* Tables. Same shape on every page that has one. */
table { width: 100%; border-collapse: collapse; }
th { font: 600 var(--text-xs)/1 var(--font-body); color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; text-align: left; padding: 0 var(--space-4) var(--space-3); }
td { padding: var(--space-4); border-top: 1px solid var(--line-soft); font-size: var(--text-sm); }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
h2 { font: 600 var(--text-lg)/1.2 var(--font-body); margin: var(--space-10) 0 var(--space-4); }
</style>
</head>
<body>
<header class="topbar">
  <span class="wordmark">Bask</span>
  <nav class="nav">
    <a href="01-today-daybreak.html">Today</a>
    <a href="06-scoreboard.html">Scoreboard</a>
    <a href="07-customer-health.html">Customers</a>
    <a href="03-studio.html">Studio</a>
    <a href="08-coach.html">Coach</a>
  </nav>
  <div class="top-right">
    <span class="salon-chip">Sunset Ridge Tanning</span>
    <div class="avatar">SR</div>
  </div>
</header>
<main class="shell">
  <!-- page content -->
</main>
</body></html>
```

## Class vocabulary — reuse these, do not invent alternatives

These already exist in `tokens.css` and in the five existing mockups. Use them by these exact names.

| class | what it is |
|---|---|
| `card` | white surface, radius, `--shadow-card`. The base container for everything. |
| `spined` + `rail good\|warn\|risk\|brand` | card with a 4px coloured spine down its left edge |
| `chip good\|warn\|risk\|gold` | the status pill. **Never hand-roll another pill — use this.** |
| `btn btn-primary` | terracotta filled button |
| `btn btn-ghost` | outlined button |
| `btn btn-quiet` | text-only button |
| `eyebrow` | small uppercase label above a heading |
| `num` | tabular-figures number |
| `.rail.warn` / `.rail.good` | the 4px coloured spine on a card |

Colour tokens for state, in every page: `--success` / `--success-wash` (good),
`--warn` / `--warn-wash` (attention), `--risk` / `--risk-wash` (bad),
`--primary` / `--primary-wash` (brand emphasis), `--gold` (rank / distinction).

## Status wording — ONE set of words, used identically everywhere

The reference run had four components independently reinvent the same status chip. These are the
words. Do not paraphrase them, do not re-order them, do not add a fifth.

**Customer health bands:** `Healthy` · `Slipping` · `Lapsed`
- Healthy → `--success` on `--success-wash`
- Slipping → `--warn` on `--warn-wash`
- Lapsed → `--risk` on `--risk-wash`

**Benchmark position:** `Top quartile` · `Above median` · `Below median` · `Bottom quartile`
- Top quartile → `--gold`
- Above median → `--success`
- Below median → `--warn`
- Bottom quartile → `--risk`

**Knowledge citation confidence:** `Confirmed` · `Approximate`
- Confirmed → `--success-wash` chip, used when the speaker is certain
- Approximate → `--warn-wash` chip, used when the session attribution is clock-derived

## The demo salon — identical numbers across all pages

Every page describes the same salon on the same day. Divergent numbers across pages is the failure
mode this section exists to prevent.

- Salon: **Sunset Ridge Tanning**, Burlington, Ontario
- Period: **July 2026**
- Cohort: **287 Canadian salons**
- Unique customers: **1,412**
- Sessions: **4,503**
- Sessions per unique customer: **3.19**
- Revenue per session (RPS): **$14.80**
- Distinct customer annual revenue: **$108**
- Average member tenure: **2.6 months**
- Customer health split: **986 Healthy · 329 Slipping · 97 Lapsed**

## Voice

Grade-7 plain English. Short sentences. Never a metric without the thing to do about it — this is
the product's whole premise ("it's not tracking minutes and putting butts in beds, it's what to do
with that data"). Never invent a UVALUX product name that is not in this contract.

## Hard rules for every page

- Static HTML only. **No JavaScript, no external images, no CDN beyond the Google Fonts link above.**
- Must render standalone by opening the file directly in a browser.
- Must not modify `tokens.css` or any existing mockup.
- Every number on the page comes from the demo-salon block above.
