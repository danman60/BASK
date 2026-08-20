# TASK — the shot plan for the re-cut film

Write ONE file: `/home/danman60/projects/uvalux-platform/promo/SHOT-PLAN-V2.md`

**This is a PLANNING DOCUMENT, not code.** Nothing renders from it. Its job is to say exactly what
must be photographed and what each shot does, so the capture script and the shot components can be
written against one agreed list instead of six separate guesses.

## Read first

- `/home/danman60/projects/uvalux-platform/docs/meetings/2026-08-19-nick-debrief.md` — what the
  client ruled in and out.
- `/home/danman60/projects/uvalux-platform/promo/DESIGN_SPEC.md` — the film's existing language.
- `/home/danman60/projects/uvalux-platform/promo/src/timeline.ts` — the current shot order and the
  fact that `floor`, `checkin` and `pos` were cut after the meeting.

## The story the film now tells

The old cut sold salon management software. The client ruled that out: he does not want to be in
that business, and he hosts a competing back end so a rival front end would put him offside with his
own partners. His framing, which every shot now has to serve:

> "It's not tracking minutes and putting butts in beds. It's what to do with that data."

## The nine beats

Same nine as the VO script. One entry per beat, in this order:

1. The quiet Tuesday — numbers with no meaning
2. The scoreboard — rank against 287 Canadian salons
3. The gap — the one category in the bottom quartile
4. Customer health — the whole book on one grid
5. The bottle — who is nearly empty
6. Tenure — 2.5 months, and what moves it
7. The coach — the answer, with the room and the minute it came from
8. Consent — none of it moves without the salon saying yes
9. Sign-off

## What to write for each beat

```
## Beat N — <name>
- **Shot name:** <lowercase single word, to become a key in timeline.ts>
- **Surface:** <the app route this photographs, e.g. /insights/peers>
- **Textures needed:** <filenames capture.mjs must produce, e.g. peers-full.png>
- **Camera:** <one of: crane-rise-reveal · spotlight-hero-card · slow-push · lateral-drift ·
  bento-light-up · page-descent — and one sentence on what it does>
- **On screen at the end of the beat:** <the single image a viewer should remember>
- **Duration:** <frames at 30fps>
- **Risk:** <what could make this shot not work — be specific and honest>
```

## Rules for the plan

- **Every texture you name must come from a real page.** If a beat needs something the product does
  not currently show, say so in **Risk** rather than inventing a filename that will never exist.
  The two surfaces that do not render their new content yet are `/customers` and `/insights/peers` —
  flag any beat that depends on them.
- **Do not invent coordinates.** Cutout positions come from `layout.json`, which capture writes.
  Naming a texture is right; naming an x/y is wrong.
- Total duration across the nine beats should land **between 1,050 and 1,350 frames** (35–45
  seconds). State the total and say which beat you would cut first if it runs long.
- Reuse existing camera language from `DESIGN_SPEC.md` rather than inventing new move names.
- The consent beat is beat 8 and it is short — it is the licence to operate, not a lecture.

## Two things to carry into the plan

- **The citation beat is the one that must land.** The coach's answer showing which room and which
  minute it came from is what makes it UVALUX's knowledge base rather than a generic chatbot. Give
  that beat a camera move that lets a viewer actually read the citation.
- **Never imply an official UVALUX partnership.** The old sign-off lockup was flagged for exactly
  that. Say so explicitly in beat 9's entry.

Open the file with this exact line:

`> PLAN — generated overnight. Durations and risks need a human pass before anything is rendered.`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/promo/SHOT-PLAN-V2.md`
- Do NOT create or modify any other file. In particular do NOT touch `promo/src/`, `timeline.ts`,
  `Soundtrack.tsx`, `capture.mjs`, or any audio or video asset.
- Acceptance: the file exists, is non-empty, contains exactly nine `## Beat` headings, contains the
  literal string `PLAN — generated overnight`, contains a `Textures needed:` line for every beat,
  contains a total-duration figure, and does not contain the string `built for UVALUX`.
- Markdown only.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
