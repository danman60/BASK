# TASK — the proposal, as a self-contained HTML artifact

Write ONE file: `/home/danman60/projects/uvalux-platform/docs/pitch/PROPOSAL-NICK.html`

## What this is

A phone-readable, print-ready rendering of the proposal, so it can be sent as a link, opened on a
phone, and printed to PDF without anything else installed.

**The source of truth is `/home/danman60/projects/uvalux-platform/docs/pitch/PROPOSAL-NICK.md`.**
Read that file. Render its content faithfully. **Do not rewrite, summarise, reorder or improve the
words** — this is a client document and the wording is deliberate.

## Two things you must handle correctly

1. **`[[ ]]` markers stay visible.** The markdown contains placeholders like `[[$A]]` and `[[3–5]]`.
   Render each one as `<mark class="todo">[[$A]]</mark>` so it is impossible to send by accident
   without noticing. Do not fill them in. Do not remove them. Do not guess a number.
2. **Drop the margin notes.** Blockquote lines in the markdown that begin with `*Margin note:` are
   guidance for the author, not for the client. **Omit them from the HTML entirely.** Everything
   else in the document is included.

## Structure

A single self-contained HTML file. One `<style>` block in the head, no external CSS, no
JavaScript, no images.

- Fonts: the same Google Fonts link the mockups use —
  `<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`
- `<title>Proposal — salon data, insights and coaching · UVALUX</title>`
- Body: `font-family: Inter, system-ui, sans-serif; color: #2a2028; background: #faf7f2;`
- A centred column: `max-width: 44rem; margin: 0 auto; padding: 3rem 1.5rem;`
- `h1`, `h2`, `h3` in `Fraunces, Georgia, serif`. `h1` at `2.4rem`, `h2` at `1.5rem` with
  `margin-top: 3rem` and a `1px solid #e6ded4` top border, `h3` at `1.15rem`.
- Body text `1.02rem`, `line-height: 1.6`.
- Tables: full width, `border-collapse: collapse`, cells `padding: .6rem .8rem` with a
  `1px solid #e6ded4` top border, header row small and uppercase in `#8a7f78`.
- Blockquotes (the ones that remain): left border `3px solid #c4643c`, `padding-left: 1rem`,
  italic, colour `#5c5158`.
- `mark.todo`: `background: #ffe9c7; color: #8a5a00; padding: 2px 6px; border-radius: 4px; font-weight: 600;`
- Horizontal rules render as `border-top: 1px solid #e6ded4`.

## Print

Add a `@media print` block: white background, `12pt` body, no page padding beyond `1.5cm`, and
`h2 { page-break-after: avoid; }`. Keep `mark.todo` visible in print with
`-webkit-print-color-adjust: exact;`.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/docs/pitch/PROPOSAL-NICK.html`
- Do NOT create or modify any other file. In particular do NOT edit `PROPOSAL-NICK.md`.
- Acceptance: the file exists, is non-empty, starts with `<!doctype html`, contains no `<script`
  tag, contains at least four `<h2` headings, contains the string `mark class="todo"`, and does
  NOT contain the string `Margin note`.
- Static HTML and CSS only. No JavaScript. No images. No CDN except the Google Fonts link.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
