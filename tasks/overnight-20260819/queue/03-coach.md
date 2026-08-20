# TASK — the Coach page (knowledge base answer view)

Write ONE file: `/home/danman60/projects/uvalux-platform/mockups/08-coach.html`

**Read `/home/danman60/projects/uvalux-platform/tasks/overnight-20260819/CONTRACT.md` first.**
Copy its page shell exactly. Set `<title>Bask — Coach</title>` and put `class="active"` on the
`08-coach.html` nav link. Use its class vocabulary, its citation-confidence words
(`Confirmed` / `Approximate`) and its demo-salon numbers.

## What this page is

The coaching knowledge base, answering a salon owner's question **out of UVALUX's own expo
recordings** — and showing exactly where each part of the answer came from. The citations are the
product. An answer that can name the room, the session and the minute is UVALUX's knowledge; an
answer that can't is a generic chatbot.

Real source, do not change these facts: the 2026 UVALUX Expo was recorded in two rooms — Room A was
product training for staff, Room B was business training for owners and managers. 9.6 hours,
just over 100,000 words, transcribed.

## Page header

- `<span class="eyebrow">Coach · trained on your expo library</span>`
- `<h1 class="page-h1">Ask it what <em>your own experts</em> already said</h1>`
- `<p class="page-sub">9.6 hours from the 2026 Expo, both rooms, searchable. Every answer shows where it came from.</p>`

## Section 1 — the question box

A `card` with `padding: var(--space-6)`. Inside:
- a label in `eyebrow` reading `THE QUESTION`
- the question itself, large, `font: 500 var(--text-lg)/1.4 var(--font-display);`:
  `How long does the average member stay, and what makes them stay longer?`

This is a static mockup — render it as text. **No `<input>`, no form, no JavaScript.**

## Section 2 — the answer

`<div class="card spined">` with `<div class="rail brand"></div>` and a `<div class="body">` —
both from the contract, do not redefine them.

- `eyebrow` reading `THE ANSWER`
- Three paragraphs, `var(--text-md)`, `line-height: 1.55`, max-width `62ch`:

  1. `Across the salons your team coaches, the average member stays about two and a half months. Sunset Ridge is at 2.6 months, which is close to that average and below the cohort median of 3.1.`
  2. `The lever that moves it is not price. Salons that added more ways to use the membership — massage, red light, spray — held members closer to three and a half months. That extra month is worth more than winning a new customer, because the member is already walking through the door.`
  3. `Two things to check at Sunset Ridge: how many modalities are on the membership today, and whether the summer pause is being treated as a cancellation when it should be a hold.`

- Then a row of two chips: one `<span class="chip good">Confirmed</span>` and one
  `<span class="chip warn">Approximate</span>` (contract classes), with a `var(--text-xs)` `--ink-faint` note after them reading
  `Two sources. One is attributed exactly; one is placed by the session clock.`

## Section 3 — the sources

Heading: `<h2>Where this came from</h2>`, styled
`font: 600 var(--text-lg)/1.2 var(--font-body); margin: var(--space-10) 0 var(--space-4);`

Two `card` blocks stacked, each `padding: var(--space-5) var(--space-6)`.

**Source 1**
- title line, `font-weight: 600`: `The Evidence Behind Your Business`
- meta line in `--ink-faint`, `var(--text-xs)`: `Room B · Owners & managers · 2026 Expo · from 0h04m`
- a `Confirmed` chip
- quoted text in italic, `--ink-soft`: `"Your overall revenue per session, and your distinct customer annual average. If you look up, our distinct customer annual revenue was $108 at this store."`

**Source 2**
- title line: `Room B · afternoon session`
- meta line in `--ink-faint`, `var(--text-xs)`: `Room B · Owners & managers · 2026 Expo · from 3h37m`
- an `Approximate` chip
- quoted text in italic, `--ink-soft`: `"There's a way to track revenue per session. This is really, really simple."`
- **and this exact caution line** beneath it, `var(--text-xs)`, colour `--warn`:
  `Session attribution here is placed by the clock, so we cite the room and the timestamp rather than a speaker's name.`

That caution line is the point of the whole page. Do not drop it or soften it.

## Section 4 — the library

Heading: `<h2>What's in the library</h2>`, same style as Section 3's heading.

A `card` containing a small table. Columns: **Room · Who it was for · Length · Sessions**.

| Room | Who it was for | Length | Sessions |
|---|---|---|---|
| Room A | Staff — product training | 4.2 hours | 10 |
| Room B | Owners and managers | 5.4 hours | 12 |

Below the table, one line in `--ink-faint` at `var(--text-xs)`:
`Add last year's expo, and next January's, and the library answers more every year.`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/mockups/08-coach.html`
- Do NOT create or modify any other file. In particular do NOT touch `tokens.css`.
- Acceptance: the file exists, is non-empty, starts with `<!doctype html`, links `tokens.css`,
  contains all four section headings above, contains the exact caution line in Section 3, and
  contains no `<script` tag and no `<input` tag.
- Static HTML and CSS only. No JavaScript. No images. No CDN except the Google Fonts link.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
