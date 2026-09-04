# Nick meeting, 2026-09-03 — deal items, build items, separate product idea

**Source:** `2026-09-03-nick-dinner-transcript.txt` in this folder, 1,951 lines / 16,985 words,
downloaded from FIRMAMENT `Downloads/Sep 3 at 2-38 PM.txt`. Read end to end, not sampled.

**Attribution warning, read before quoting anyone.** Speaker labels DRIFT mid-block. Speaker 3 is
mostly Daniel, Speaker 1 is mostly Nick, but a single tag often carries both sides of an exchange
and the long Trish Stratus story is Nick's while being split across tags 1, 2 and 4. Every quote
below was attributed from CONTENT, not from the tag. Treat attribution as high confidence on
substance, medium on exact speaker.

This was a dinner with at least five voices, so most of the file is social. The business content
is concentrated and is extracted below in full.

---

## 1. DEAL ITEMS

**The number is on the table and it is Daniel's.**
> "Mvp. I took a look at it. 25,000... Analyzing the data for salons hosting infrastructure web app.
> And then some days. Some full days training the Corpus."

Nick's reaction, verbatim, and it is not a no:
> "It's a little more than what I had in my head, but let's not say it's not right now."

and later
> "I'm not gonna pick at pennies... I respected too much, right? And I like you too much."

**The single most important term, stated by Daniel and unchallenged:**
> "you can't give me 25,000 cash and own the engine."

So the $25k buys the salon MVP, NOT ownership of the underlying engine. This is the line to hold in
any agreement. Related, from Daniel:
> "Let's not muck with equity, but there's an ownership conversation."
> "what I see going in the long term is there's like a CTO, CEO kind of relationship on a later piece."

**Phasing, and both men converged on it.** Three phases, each de-risking the next:
1. Now to roughly year end, prove it on real salons.
2. Up to **Expo**, go wide and get many users.
3. **Market expansion**, US and other verticals.
Daniel: *"we can de-risk it with each phase."* Nick: *"De-risk each step of the way."*
Daniel: *"that's our two quarters to work in."*

**Territory split, and it defines who carries what.**
- **Canada is Nick's risk and his proof of concept.** *"the Canadian Market would be an investment
  for you... to me, that's a proof of concept"* and *"I'm willing to take the risk in Canada."*
- **The US is the prize.** *"what we sell on the U.S side... It was 10 times the market."*
  Nick again: *"really, the fruits on the U.S side."*
- Nick concedes measuring his own upside will be hard: *"how it affects my business would be tough
  to imagine... tough to put a dollar on."*

**Timing pressure is real and named.** Daniel: *"if we do it fast, if no one else is doing Salon
specific Corpus and data analysis."* Nick confirms two US competitors already chasing it, but on a
different axis, which is the wedge (see Build, Competitive position).

**Target for the pilot:** Nick expects *"a couple of really good owners"* proving the concept by
Expo, and Daniel pushes earlier, *"you should have some owners immediately."* Named candidate
owners already in Nick's pocket: **Scott in Sarnia** and **Jess in Utah**, both described as
exceptional sellers. Also **Steve** (retired) and **Leanne**, who now runs the association, as the
route to the industry knowledge base.

**Relationship terms Nick stated as non-negotiable, in his own words:**
> "If I can't have a beer with my partner, then they're not my partner."
> "I just wasn't gonna deal with assholes."
Daniel's mirror of it: he wants the work to be worth *"five, six, seven, eight times"* the fee so
that Nick refers him onward.

**Open and unresolved at the end of the meeting.**
- Scope is explicitly not locked. Both said hone it, neither did. Daniel: *"we can hone the scope."*
- Nick warned against scope creep in both directions: *"I don't want to get so stuck in scope...
  oh, this could be another 10 grand, f*** off."*
- How the multi-vertical engine is shared is named as the hard question and left open.
  *"What other industries do we put this engine into? And how do we share that?"*
- **Next action was Daniel's to take:** *"do you want me to extend you a thing? Is there more
  stakeholders?"* answered *"present solid."* So a written proposal is owed, and the stakeholder
  list was never actually answered.

---

## 2. TECHNICAL ITEMS, the build

**Core architecture, stated repeatedly as the differentiator: do NOT replace their software.**
> "we're agnostic, incredibly sticky... people don't want to retrain what they're doing. I'm not
> gonna change your POS because it costs to retrain my front user, let alone put all my data into
> it, but if we can just sync. I can just pull it and do it."

Ingest mechanism, two options discussed, both low friction:
- *"a simple little click to click to sync"*
- *"a thing that runs in the background on the computer that is automatically uploading"*
Explicit constraint from Nick: *"you don't need to take over salon management to do that."*

**What the MVP must contain**, from Daniel's own quote of the number: analysis of salon data,
hosting infrastructure, a web app, plus several full days training the corpus with the trainers.

**Source systems and their state.**
- **SalonTouch** is the incumbent, and it is old. *"the salon touch that I opened up on here was
  pretty ancient"*, some salons untouched for eight years, running a 1998-era stack with known
  security holes. Access today apparently needs only an address: *"you don't even need their
  consent... just type in their address, connect to their live streams."*
  **Flag: that access path needs a legal and consent review before it goes anywhere near a build.**
- **Suddenlink** is named as Nick's biggest partner and is *"doing something"* in this space. Nick
  offered to find out what and bring Daniel in. Unknown, treat as a risk.
- **Existing dataset in hand:** Nick physically holds a salon computer with roughly 8 years of data
  (the Liberty Village acquisition). Daniel wants it: *"it's nice to get in with some real data."*
  Nick: *"the data, literally, who has what and what medicine so on and so forth."*

**Features named, in rough priority order.**
1. **Customer reactivation from historical data.** The immediate demo. Pull who had unused minutes
   and email them. *"there's a link to people with the product or the minutes that they had, and
   their emails"* and *"hey, come into the salon, how many minutes you had, we'll honor it."*
2. **Lamp hours and relamping.** Lamps rated ~600 hours. Today Nick logs relamps by hand,
   *"we're logging like pets."* Wants automatic visibility of actual usage, then
   *"these are your lamp reports, and this is your budget of what you need when you need it."*
3. **Equipment utilization calculator.** *"Do you have enough utilization to justify this new
   equipment... you're eligible."* Nick already has something built for this. Directly drives a
   manufacturer sale.
4. **One-click LLM generation of promotions**, in the owner's own voice. *"just go like action,
   action, action, post that thing, write that thing, and we had some edits to it, so it's in their
   voice."*
5. **Sales-conversation capture and training.** The strongest thread in the meeting. Nick listened
   to two of his best owners sell live over the phone and wants it bottled. *"if I could bottle that
   and train people how to do it."* Daniel: *"that's going to be our business, the bottling of great
   sales pitches."* Method discussed: capture front-desk conversations, label which ones resulted in
   a sale, train on the winners first. *"just get the killers down. That's 80% of the lift."*
6. **Expert chatbot and customer chatbot** off the same corpus.
7. **Risk mitigation / compliance flagging.** Nick raised it unprompted: catching staff *"saying
   something wrong or non-factual, and that's a danger to the industry."*

**Data monetization, four routes counted in the room.**
Back to the manufacturer (who buys what, by demographic), increased sales and restocking on Nick's
side, charging the salon directly, and a generalized anonymised dataset sold onward. The stated
unlock: *"you've incentivised them to share it"* by giving them a tool that grows their business.
Daniel's own experience is the cautionary half: he was approached to sell dance recital footage to
an AI marketplace and refused on child-safety grounds. **That instinct should shape the consent and
marketplace design, not be forgotten.**

**Competitive position.** Two US groups are chasing salon data but *"on the platform side, they want
people to switch software."* The wedge is being agnostic and sync-only. That is the whole moat and
it is fragile if a competitor copies it, hence the speed pressure.

---

## 3. THE SEPARATE PRODUCT IDEA

### Youth sports sponsorship marketplace, and it is NICK's, not Daniel's

Completely unrelated to uvalux or salons. Nick has carried it **five to ten years**:
*"I've had this idea for about five or ten years now."*

**The problem.** Elite youth sport is priced out of reach. Nick's example is his own nephew, 16,
top ten in Canada in his age group, and the cost of travel hockey plus personal and specialised
training. *"You might have some really talented kids who just don't love the means."*

**The product.** A marketplace where parents post a profile per kid, structured like a hockey card
with video, and independent sponsors fund them.
- Daniel's build of it, in the room: *"you click into a little hockey card, there's clips of them at
  the game, and then a little interview with the kid,"* with fantasy-league style stats.
- Parents upload the media.

**Two competing monetisation models, deliberately unresolved.**
- **Return-seeking:** sponsor takes a percentage of lifetime earnings. Nick floated **5%**.
  *"I'll give you five percent of my lifetime."* Also framed as a student-loan alternative:
  *"bet on my sports and I will pay this loan back."*
- **Altruistic:** a Kiva-style non-profit where money recycles. Nick already does this personally,
  ~$2,000 recycled yearly on a microfinance platform. Someone advised him *"just make it a charity."*
  Nick's instinct is that both could coexist.
- Daniel pushed a third: **tokenised**, $5/month for 10,000 tokens to spend loosely, then an ICO and
  a speculative market on athletes. *"never underestimate the gambler."* Nick was audibly unsure.
  **Note: this is the angle most likely to create legal and ethical exposure around minors.**
- Fourth, quieter: **sponsorship advertising** inside the platform, skates and sticks.

**Why Daniel found it interesting:** *"how many kids who would have beaten that kid didn't get to
compete because of a lack of resources."* And the honest comparison he made out loud, that youth
sport spending dwarfs dance.

**Status: an idea only.** No commitment, no scope, no money discussed. It sits with Nick.

### The other "separate" idea is not separate, it is phase 3

The multi-vertical engine, *"data opportunity, corpus, LLM, action"* applied to any fragmented
industry of independent owners, is the same engine as the deal, not a distinct product. Verticals
named: independent breweries (Nick's favourite, *"how many hazy IPAs are they selling"*, and brewers
plan four months out), car dealerships, franchised food, wellness, churches, gyms, dentists,
chiropractors, HVAC. Selection rule they agreed on: fragmented, independent owners, real
commonality, **no connection between operators**, and too small for the big players to bother with.
Daniel's framing: *"I'm gonna focus on wellness, churches, something that could really benefit but
might not see it."* Nick's test: *"is that a worthy TAM for me?"*

---

## What is owed, and by whom

| Who | What | Evidence |
|---|---|---|
| **Daniel** | Send the written proposal. Scope honed, phases, what $25k buys, and explicitly what it does NOT buy (the engine). | *"do you want me to extend you a thing?"* answered *"present solid."* |
| **Daniel** | Confirm whether there are more stakeholders on Nick's side. He asked, it was never answered. | *"Is there more stakeholders?"* |
| **Nick** | Hand over the historical salon dataset, the Liberty Village computer. | *"that's exactly a couple years old, but"* |
| **Nick** | Find out what Suddenlink is doing at Expo and bring Daniel in. | *"I'll try to get a sense of what they're doing, invite you to it."* |
| **Nick** | Line up the pilot owners. Scott (Sarnia) and Jess (Utah) named. | *"He'd be one of the ones I bring into this."* |
| **Both** | Resolve how the engine is shared across future verticals. Named as the hard question, left open. | *"how do we share that?"* |

## Two things to check before building

1. **The consent path into SalonTouch.** *"you don't even need their consent, just type in their
   address"* is a legal question, not a technical convenience. Get it answered before it is designed in.
2. **Whose data is it.** The whole model rests on owners willingly turning over customer data in
   exchange for a tool. That bargain needs to be explicit in the product, and Daniel's own refusal
   to sell dance footage is the right instinct to design from.
