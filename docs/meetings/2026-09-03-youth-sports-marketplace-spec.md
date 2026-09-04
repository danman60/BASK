# Youth sports sponsorship marketplace — first spec

**Whose idea:** Nick's, and he has carried it five to ten years. *"I've had this idea for about five
or ten years now."* Not a UVALUX product, not part of the Bask deal, and nothing was committed. This
is a spec of what he described, not a plan to build it.

**Source:** the 2026-09-03 dinner recording, transcript in this folder. Everything below traces to a
quote. Where the two of them disagreed, both positions are recorded rather than resolved, because
the disagreement is the most useful part.

---

## The problem, in his words

Elite youth sport is priced out of reach for talented kids whose families cannot fund it. Nick's own
example is his nephew, 16, top ten in Canada in his age group, and the cost of travel hockey plus
personal and specialised training.

> "in order for kids to really get a chance at professional sports... it's expensive, and they'll
> spend, cuz it's your kid. But some can, some... you might have some really, really talented kids
> who just don't love the means."

The gap he keeps returning to is not talent, it is resources. Daniel put the sharpest version of it:

> "how many kids who would have beat that kid didn't get to compete because of a lack of resources?"

## The product

A marketplace where a parent publishes a profile for their kid and independent sponsors fund them.

**The unit is a card, deliberately.** Nick: *"a hockey card, including with video."* Daniel built it
out in the room:

> "you click into a little hockey card... there's clips of them at the game, and then there's like a
> little interview with the kid... what makes you want to come to hockey."

with light fantasy-league texture, *"a little bit of that kind of numbers and stats."*

**Parents upload the media.** Both agreed on that without discussion.

## The monetisation question, unresolved on purpose

Four models were put on the table and none was chosen. They are not compatible with each other, and
picking one is the first real decision.

**1. Return-seeking, a share of lifetime earnings.** Nick's original: *"a percentage of their
lifetime earnings, right, was my idea."* He floated **5%**. Daniel's framing was that the athlete is
trading downside protection for upside: *"wouldn't they trade five percent of that risk, ten percent
of that risk, to get some resources?"*

**2. Student-loan shaped.** A softer version Nick raised himself: *"bet on my sports and I will pay
this loan back... I need new skates, I need to pay for training."*

**3. Altruistic, Kiva shaped, money recycles.** Nick already does this personally, roughly **$2,000
recycled yearly** on a microfinance platform, funding among others a woman in Guatemala. *"I get my
money back, no return on it, but then I just go back and give it back out."* Someone advised him
*"just make it a charity"* and he found that genuinely appealing: *"there's something cool about
that."* He also floated community-voted allocation of a bequeathed pot.

**4. Sponsorship advertising inside the platform.** Skates, sticks, equipment brands. Barely
explored.

**And a fifth that Daniel pushed and Nick was audibly unsure about: tokenisation.** $5/month buys
10,000 tokens to spend loosely, because *"you'll be very loose and free and feel the vibe, but it's
tokens."* Then an ICO, a tradeable token, and speculation on athletes. *"never underestimate the
gambler."* Daniel also raised turning an athlete into an NFT or a tokenised asset people buy and
trade *"based on that footage that I saw."*

Nick's response to that was a question, not agreement: *"Is it?"* and *"I'm not sure, right?"*

> **Flag, and it is the biggest one in this document.** Every model except 3 and 4 creates a
> financial instrument whose underlying asset is a child's future earnings. Tokenising it and
> opening it to speculators multiplies that. Before any of this is designed, someone who knows
> securities law and child-protection law needs to look at models 1, 2 and 5. Daniel's instinct
> elsewhere in the same conversation, refusing to sell dance recital footage of minors to an AI
> marketplace, is the correct instinct pointed at the same class of risk.

## What actually makes it work, per the conversation

**Trust comes from where the money goes, not from the pitch.** Daniel: *"aren't you much more
truthful with where you spend than with what you say?"* The implication is that sponsor behaviour is
itself a signal, closer to a prediction market than to charity.

**Retired coaches were floated as a source of credible judgement**, a way for sponsors to back kids
they cannot personally assess.

**Discovery is the real problem the platform solves.** Nick: *"you might know kids in your local
area. You don't know kids outside of that."*

## Precedents named in the room

Kiva-style microfinance (Nick is an active user), Patreon (the recurring-support pattern), and
college sports boosters, which Nick raised himself as the existing analogue: *"I'm a booster, right,
that exists, and certainly in the football world."*

## Market note

The one sizing comment made was Daniel's, comparing it to what he knows: youth sports spending is
*"a lot more than the money spent in dance."* No numbers were put on it. **Treat market size as
entirely unresearched.**

---

## If this ever moves, the order of work

1. **Get the legal read on models 1, 2 and 5 before any design.** Minors, lifetime-earnings
   contracts, and anything token-shaped. This is a gate, not a task.
2. **Nick picks one model.** Charity and investment vehicle are different products with different
   users, and the card is the only piece common to both.
3. **Test discovery, not funding.** The thin version is a set of real profiles and whether strangers
   engage at all. That answers the actual unknown without touching money or minors' contracts.
4. Only then, sizing and build.

## Status

Idea only. No commitment, no scope, no money, no timeline. It sits with Nick, and it came up over
dinner rather than as an agenda item. **Do not confuse this with the Bask Phase 1 work**, which is a
separate, live, priced engagement with a letter agreement already drafted.
