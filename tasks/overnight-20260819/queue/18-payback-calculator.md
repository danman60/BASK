# TASK — the equipment payback calculator

Write ONE file: `/home/danman60/projects/uvalux-platform/docs/pitch/PAYBACK-CALCULATOR.html`

## What this is and why it matters

This is the client's **own sales pitch, handed back to him with evidence attached.** His words in
the meeting:

> "Buy a cocoon. If you're on membership, you can drive your membership from 89 to a hundred
> dollars, 120. And how many members do you think you have to upgrade in order to pay for that
> cocoon — that's been our pitch."

And the counter-thesis from his best data coach, which he agreed was stronger:

> "By adding more modalities you've been able to change that two and a half months to three and a
> half." … "That's worth more than another customer."

Today that arithmetic is done by a human in a room with a spreadsheet. This page does it live.

**This is the one page in the pack that is a selling instrument rather than a demo.** It should be
usable by a UVALUX rep sitting across from a salon owner.

## Behaviour

A single self-contained page. **JavaScript IS allowed here** — it is the only interactive artifact
in the set — but it must be inline, vanilla, and dependency-free. No CDN, no framework, no fetch.

Four number inputs, each with a label and a sensible default:

| input | id | default |
|---|---|---|
| Machine price | `price` | `28000` |
| Current membership price per month | `current` | `89` |
| Upgraded membership price per month | `upgraded` | `120` |
| Members you could upgrade | `members` | `40` |

Two more inputs for the tenure half:

| input | id | default |
|---|---|---|
| Average member tenure today, in months | `tenureNow` | `2.5` |
| Tenure after adding this modality, in months | `tenureAfter` | `3.5` |

### The maths, exactly

```
monthlyUplift   = (upgraded - current) * members
paybackMonths   = monthlyUplift > 0 ? price / monthlyUplift : Infinity
tenureGain      = tenureAfter - tenureNow
retainedValue   = tenureGain * upgraded * members
firstYearReturn = (monthlyUplift * 12) + retainedValue - price
```

Round money to whole dollars with `Math.round`. Show `paybackMonths` to one decimal.
When `paybackMonths` is not finite, display `—` and no payback sentence.

### The output

Four result figures, updating live on every `input` event: **monthly uplift**, **payback**,
**value of the extra month of tenure**, **first-year return**.

Then one sentence, assembled from the numbers, in a highlighted box:

`Upgrading 40 members from $89 to $120 pays for a $28,000 machine in 22.6 months — and if it moves
average tenure from 2.5 to 3.5 months, that extra month is worth another $4,800 a year.`

That sentence must be generated from the current input values, not hard-coded. Use
`toLocaleString()` for money.

### Honesty line — required

Under the results, in small muted text, this exact line:

`These are your numbers, not ours. Tenure figures come from what UVALUX's own coaching has measured; the rest is arithmetic.`

## Look

Match `mockups/tokens.css` by eye — warm ivory `#faf7f2` background, ink `#2a2028`, terracotta
accent `#c4643c`, Fraunces for headings, Inter for body via the Google Fonts link the mockups use.
Single centred column, `max-width: 46rem`. Inputs in a two-column grid that collapses to one column
under 640px. Results as four tiles. Generous spacing, no borders where a background will do.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/docs/pitch/PAYBACK-CALCULATOR.html`
- Do NOT create or modify any other file.
- Acceptance: the file exists, is non-empty, starts with `<!doctype html`, contains six `<input`
  elements, contains the exact honesty line above, contains the string `paybackMonths`, contains no
  `src="http` or `import ` from a CDN, and opens and works with no network beyond the fonts link.
- Inline vanilla JavaScript only. No frameworks, no CDN scripts, no fetch, no images.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
