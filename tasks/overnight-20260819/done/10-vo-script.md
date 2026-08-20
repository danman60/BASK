# TASK — the new VO script, cut to the ask

Write ONE file: `/home/danman60/projects/uvalux-platform/promo/VO-SCRIPT-V2.md`

**This is a DRAFT for the supervisor to edit, not a shipping asset.** Say so at the top of the file.

## Why the script is being rewritten

The film currently sells salon management software. The client ruled that out to Daniel's face:
he does not want to be in the salon-management business, five competitors are already there, and he
hosts a competing back end so a rival front end would put him offside with his own partners.

His own framing of what he *does* want, which is the line the whole film now has to serve:

> "It's not tracking minutes and putting butts in beds. It's what to do with that data."

So the floor, the check-in, the till and the booking page are **out**. Read
`/home/danman60/projects/uvalux-platform/docs/meetings/2026-08-19-nick-debrief.md` and
`/home/danman60/projects/uvalux-platform/docs/pitch/PROPOSAL-NICK.md` before writing a word.

## The beats, in this order

Write one VO line per beat. Nothing else changes.

1. **The quiet Tuesday** — a salon owner has numbers and no idea what they mean.
2. **The scoreboard** — where this salon ranks against 287 Canadian salons, by category.
3. **The gap** — the one category where they are in the bottom quartile, and what it is worth.
4. **Customer health** — the whole book on one grid; who is slipping, who is gone.
5. **The bottle** — nobody weighs a bottle, but tans used plus half an ounce a tan says who is
   nearly empty. Reach out before they buy elsewhere.
6. **Tenure** — the average member stays about two and a half months; more modalities pushes it
   toward three and a half; that extra month is worth more than a new customer.
7. **The coach** — the answer comes out of UVALUX's own expo recordings, and it can say which room,
   which session, which minute.
8. **Consent** — none of it moves without the salon saying yes.
9. **Sign-off.**

## Rules for the writing

- **One or two sentences per beat. Nothing longer.** The previous cut ran 52.8 seconds against a
  35–45 second brief because the lines were too long; do not repeat that.
- Grade-7 plain English. Short words. No jargon, no "leverage", no "unlock", no "empower".
- Never claim a partnership that does not exist. **Do not write "built for UVALUX" or imply an
  official relationship** — that lockup was already flagged as overclaiming.
- Never promise a number the product cannot show. The tenure figures are the client's own, from the
  meeting; everything else must be something on screen.
- Do not name a price.

## File format

For each of the nine beats, a section containing:

```
### Beat N — <name>
**Line:** "<the words to be spoken>"
**Word count:** <n>
**Estimated read:** <n × 0.4>s at a measured pace
**On screen:** <what the picture is doing under this line>
```

End the file with a **Total estimated read** line summing the nine estimates, and a one-paragraph
note on which beats to cut first if the total runs past 45 seconds.

Open the file with this exact warning line:

`> DRAFT — generated overnight, not recorded. Every line needs a human pass before it goes to voice.`

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/promo/VO-SCRIPT-V2.md`
- Do NOT create or modify any other file. In particular do NOT touch `promo/src/`,
  `promo/VO-SCRIPT.md`, or any audio.
- Acceptance: the file exists, is non-empty, contains exactly nine `### Beat` headings, contains the
  literal string `DRAFT — generated overnight`, contains a `Total estimated read` line, and does not
  contain the string `built for UVALUX`.
- Markdown only.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
