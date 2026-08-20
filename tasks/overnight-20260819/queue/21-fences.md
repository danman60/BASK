# TASK — the fences, written down

Write ONE file: `/home/danman60/projects/uvalux-platform/docs/pitch/FENCES.md`

## What this is

The client named several hard limits in the meeting, unprompted, and **offered to put one of them in
the contract himself**. This document writes all of them down before he has to ask — which is the
point. Answering someone's stated fear before they raise it is worth more than answering it well
afterwards.

**This is a plain-language statement of intent, NOT a legal document.** It must say so.

## The fences — all four, in his own framing

**1. Never market to the salons' customers.**
His words: *"Put it in the f***ing contract that says, hey, I'm not going to start marketing to your
consumer — that's not my business. My business is: they know you, they like you, they trust you."*
Write it as: the product never contacts a salon's customers directly, never builds a marketing list
from them, and never uses them to sell anything of ours. The salon owns that relationship entirely.
Clean the profanity out; keep the meaning.

**2. Never compete with the incumbent front end.**
He hosts Sunlync's data and told them to build better software while he handles the hosting. A rival
salon-management front end would put him offside with his own partners. Write it as: we do not build
point of sale, booking, or a room board that competes with Sunlync, and we integrate rather than
replace.

**3. Nothing moves without consent, and consent is per-salon.**
He was explicit that the rights to use hosted data for analytics are **not yet obtained** — *"there's
insights in there that we're not tapping into, nor do we have rights yet."* Write it as: no salon's
data reaches UVALUX's analytics until that salon has agreed, the agreement is visible and revocable,
and revoking it removes them from every comparison going forward.

**4. No benchmark small enough to identify anyone.**
Not something he said, but the consequence of what he wants. Write it as: comparisons are suppressed
below a cohort of 12 salons, because a benchmark computed from a handful of salons tells you who
they are.

## Structure

For each fence: a short heading stating the commitment as a promise, then two or three plain
sentences saying what it means in practice, then one sentence on **how it is enforced in the
software** rather than only promised. For fence 3 and 4 the enforcement is real — the consent filter
is the single path every read takes, and the cohort minimum is a constant in the code. For fences 1
and 2, be honest: enforcement is contractual and architectural intent, not a runtime check.

**Do not overstate enforcement.** Saying something is technically prevented when it is a promise is
the failure mode this document exists to avoid.

End with a short closing paragraph offering to put any or all of these into the agreement itself.

Open the file with these two exact lines:

```
> DRAFT — generated overnight. Plain-language intent, not legal drafting. A lawyer should write the contract language.
```

## Voice

Grade-7 plain English. Short sentences. First person plural. No legalese, no "hereinafter", no
defined terms in capitals. It should read like a person explaining what they will and will not do.

## RULES

- Write exactly ONE file: `/home/danman60/projects/uvalux-platform/docs/pitch/FENCES.md`
- Do NOT create or modify any other file.
- Acceptance: the file exists, is non-empty, contains the exact DRAFT line above, contains exactly
  four `## ` fence headings, contains the strings `Sunlync`, `consent` and `12 salons`, and does NOT
  contain the strings `hereinafter`, `warrants and represents`, or `shall indemnify`.
- Markdown only.
- DO NOT fix bugs or refactor outside this file. If you find one, note it and leave it.
