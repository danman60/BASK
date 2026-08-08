# Bask — The Operating System for Modern Tanning & Wellness Businesses
## Product Specification and UX Vision (Fable → Opus handoff)

**Version:** 1.0 — 2026-08-07
**Author:** Fable (product discovery pass over `UVALUX_Master_Fable_Product_Discovery_Brief.md`)
**Consumer:** Opus (implementation planning), Daniel (founder), Nick (UVALUX President — ultimate decision-maker)

---

# Part I — Product Framing

## 1. Vision in one paragraph

Bask is the operating system for tanning and wellness businesses, and Compass is the intelligence layer it gives UVALUX over the dealer network that runs on it. A salon owner opens Bask and is told — in plain language, with evidence — what changed, why it matters, and what to do about it, then does it in three clicks. A UVALUX rep opens Compass and is told which salon to call today and exactly why. The same data, consent-gated, powers both. Nobody else in the category can build this, because nobody else *is* UVALUX: the incumbents sell software to strangers; Bask ships inside an existing trust relationship, a product catalogue, a training organization, and a sales force.

## 2. Naming architecture (proposal — not locked)

| Thing | Name | Rationale |
|---|---|---|
| Salon-facing platform | **Bask** | Warm, short, verb, what the end customer literally does. Standalone brand → survives wellness expansion and non-UVALUX markets. "Bask, powered by UVALUX." |
| Daily narrative brief | **Daybreak** | The hero feature gets a name. "Check your Daybreak" is a habit you can say out loud. |
| UVALUX intelligence product | **Compass** | Tells a rep where to go and why. Not "admin panel," not "dashboard" — a navigation instrument for the network. "UVALUX Compass." |
| Live operations surface | **The Floor** | Front desk + room board + schedule in one operational view. |
| Marketing creation surface | **Studio** | Content creation that already knows the business. |
| Benchmarking | **Peers** | "Businesses like yours." Deliberately friendly; never "rankings." |

Alternatives considered: Daybreak-as-product-name (too narrow once the brief is one feature of many), Solara/Glow (category-generic, weak trademarks), UVALUX OS (kills wellness expansion and future non-UVALUX distribution; keep UVALUX as endorsement brand, not product brand). Nick may prefer heavier UVALUX branding — the architecture supports co-branding ("UVALUX Bask") without redesign.

## 3. Category and value proposition

**Category:** Vertical operating system for tanning/wellness — not "salon POS," not "booking software." The POS is in it; the product is the intelligence around it.

**For the salon owner:** *Your business, already understood.* Bask watches revenue, memberships, retail, capacity, and inventory continuously, tells you what needs attention each morning, and turns every insight into a one-click action — a campaign, a message, an order, a staff challenge.

**For UVALUX:** *See the network you already serve.* Compass converts consented operational signals into rep call lists, coaching targets, expansion candidates, and product demand forecasts — making UVALUX measurably better at its existing business while creating a recurring software line.

**For the end customer:** frictionless visits — booking, check-in, membership, and offers that feel personal, not spammy. (Deliberately quiet; the customer should feel the salon got better, not that software arrived.)

## 4. Strategic moat (in order of defensibility)

1. **Distribution** — UVALUX touches every new salon opening and thousands of existing accounts. Zero-CAC channel incumbents cannot copy.
2. **Network intelligence** — Peers benchmarking and Compass signals improve with every participating salon. Classic data network effect, unavailable to any single-salon software vendor and unavailable to UVALUX without the software.
3. **Commerce loop** — inventory forecast → one-click UVALUX draft order. Ties software retention to supply retention in both directions.
4. **Coaching infrastructure** — UVALUX already trains salons; Compass tells it *where* training pays. Software + human success org is the retention story.
5. **Insight→action UX** — copyable in principle, but only valuable on top of 1–3.

A competitor can redesign a dashboard. It cannot reproduce the supplier relationship, the catalogue, the training staff, or the network.

---

# Part II — Personas (refined)

Frequency, device, and anxiety are the design-relevant additions; the brief's needs lists hold.

| Persona | Frequency / device | Job to be done | Core anxiety | Bask must never |
|---|---|---|---|---|
| **A. Owner-operator (primary)** | Daily, 5–15 min, phone in the morning + desktop at the salon | "Tell me what needs my attention, then make acting on it trivial." | "Am I missing something that's quietly costing me money?" | Present a wall of charts and make her do the analysis. |
| **B. Multi-location owner** | Daily, desktop + phone | "Which location needs intervention?" | Flying blind between site visits. | Force per-location logins or manual comparison. |
| **C. Front-desk staff** | Continuous during shift, desktop/tablet at counter | "Serve the person in front of me without thinking about software." | Line at the counter while software loads. | Require more than seconds per routine task; bury eligibility rules. |
| **D. Salon manager** | Several×/day, desktop | "Run a clean shift, hit targets." | Being blamed for what she couldn't see. | Hide staff/inventory state behind reports. |
| **E. UVALUX rep** | Daily, phone-first (in the truck, between calls) | "Who do I call today and what do I say?" | Walking into an account blind; sounding like a supply-order robot. | Show raw salon data without a reason-to-call attached. |
| **F. UVALUX leadership (Nick)** | Weekly, desktop | "What is happening across the market we serve?" | Betting the channel on a black box. | Look like surveillance; violate the consent story. |
| **G. UVALUX trainer/CS** | Weekly, desktop | "Put help where it will matter, prove it worked." | Training the wrong salons on the wrong things. | Present coaching targets without evidence. |
| **H. End customer** | Occasional, phone | "Make visiting effortless." | Awkward membership/payment surprises. | Nag. |

First build designs hard for **A, C, E, F**. B, D, G are represented; H appears as one teaser screen.

---

# Part III — Product Principles

These are the tie-breakers Opus uses when the spec is ambiguous. Ordered; earlier wins.

1. **Lead with the change, not the chart.** Every surface opens with what's different and why it matters. Charts are evidence, attached below the sentence.
2. **Every claim carries its evidence.** No naked scores, no mystery health numbers. "Cancellations are 28% above your 90-day average" — always the comparison, always the window. If a score exists, it expands into its factors.
3. **Every insight offers an action.** An insight card without a button is a bug. Minimum action set: *Fix this* (generate campaign/message/order), *Show me why* (drill-down), *Dismiss* (with memory — dismissed insights don't return unchanged).
4. **Three clicks from noticing to done.** Notice (Daybreak) → decide (pre-filled action) → confirm. Editing is always available, never required.
5. **The Floor is sacred.** Front-desk interactions are speed-first: instant search, keyboard-friendly, no modal mazes, nothing slower than the customer standing there. Owner-facing intelligence never leaks latency or clutter into the Floor.
6. **The salon owns its data; UVALUX earns its view.** Consent is explicit, legible, and demo-worthy. "What UVALUX sees" is a screen, not a paragraph in a ToS. Compass shows derived business signals, never customer PII.
7. **Simulate the integration, never the interaction.** Publishing, payments, and timers may be mocked; creating, editing, state transitions, and resulting data changes must be real. Nothing in the demo is a static picture.
8. **Warm, operationally serious.** Sunlit, premium, calm. Not fintech-sterile, not AI-purple, not gimmick-cute. The product should look at home on the counter of a nice salon.
9. **Small salon sees small software.** Progressive disclosure. A single-location owner never smells the enterprise underneath.
10. **Explainable commerce.** UVALUX product recommendations exist because the data supports them, and they say so. The moment reordering feels like disguised advertising, the trust story — and the moat — dies.

---

# Part IV — Information Architecture

## 5. Bask (salon app) — six destinations

```
Today          — Daybreak brief, action queue, live pulse
The Floor      — room board · schedule · check-in · POS  (one operational surface, tabbed)
Customers      — profiles · memberships · segments
Marketing      — Studio · campaigns · calendar
Inventory      — stock · forecasts · UVALUX ordering
Insights       — analytics · Peers benchmarks · staff performance · reports
(Settings)     — business, staff/permissions, services & equipment, data sharing, billing
```

Deliberate merges vs. the brief's 13-domain list: Schedule/Equipment/POS/Front-Desk collapse into **The Floor** (they are one physical job); Memberships live inside **Customers** (a membership is an attribute of a person, with a dedicated health view under Insights); Reports fold into **Insights**; Staff admin is Settings, staff *performance* is Insights. Nav stays ≤6 + settings forever; wellness expansion adds service types, not nav items.

## 6. Compass (UVALUX app) — five destinations

```
Network        — map + health distribution of all participating salons
Call List      — today's prioritized outreach, each with a reason and a suggested conversation
Accounts       — salon roster; account detail = trends, signals, order history, coaching log
Signals        — product/category demand, regional trends, expansion candidates
Coaching       — targets, playbooks, measured outcomes
```

**Call List is the hero.** Network is the leadership view; Call List is the rep's morning. Account detail is shared by both. Compass is a *portfolio intelligence product* — visually distinct from Bask (same design system, inverted/denser theme) so a demo cut from salon → Compass lands as "different product, same nervous system."

## 7. Conceptual data model (UX-level, not schema)

Salon → Rooms/Equipment (typed: UV levels, spray, red light, hydromassage, …) → Sessions. Customers → Memberships/Packages → Visits → Purchases. Products → Inventory ↔ UVALUX catalogue. Insights are first-class objects (type, evidence, state: new/seen/actioned/dismissed, linked action, outcome). Campaigns are first-class (draft → scheduled → sent → measured). Consent profile per salon governs what Compass derives. **Everything Compass shows is a derivation, never a passthrough.**

---

# Part V — The Experiences

## 8. Today / Daybreak (the hero)

Owner opens Bask. Top of screen, written in warm plain language, generated from actual (demo) data by a real rules engine:

> **Good morning, Dana. Yesterday finished 8% above your four-week Thursday average.**
> Membership revenue is steady. Two things need attention and one looks like an opportunity.

Below the greeting, the **Attention Queue** — never more than 5 cards, ranked by $ impact:

1. 🟠 **Retail attachment slipped** — 21% → 15% over three weeks. Evidence sparkline. → *Fix this* / *Show me why*
2. 🟠 **7 failed membership payments** — $284/mo MRR at risk; 4 look recoverable. → *Send recovery messages*
3. 🟢 **Tuesday 1–5 pm is 60% open next week** — historically your cheapest hours to fill. → *Create a Tuesday promotion*

Then the **Pulse strip** (live, glanceable): today's bookings, members in-house now, day revenue vs. typical, rooms in use. Then a compact "Yesterday" mini-dashboard for owners who want numbers. The brief and the dashboard coexist by hierarchy: narrative first, evidence second, dense numbers on demand (Insights).

Card mechanics: *Show me why* opens a drill-down (the metric, cohort comparison, contributing factors — e.g., attachment drop concentrated on two staff members' shifts). *Fix this* deep-links into Studio/Customers/Inventory with everything pre-filled. *Dismiss* asks "not relevant / already handled / snooze" and learns. Actioned cards show outcomes later ("Your Tuesday campaign: 9 bookings, ~$310").

**Weekly Story** (end of week, same surface): "What changed in your business this week" — 5 beats, shareable. Cheap to build on the same engine, high demo value.

## 9. The Floor

Three tabs, one surface, optimized desktop/tablet.

**Room Board** — the visual centerpiece. Every room a card on a floor-plan-ish grid: room name, equipment type + icon, state (**ready / in session with live countdown / cleaning / maintenance**), current customer first-name, session time remaining. States are driven by a real simulated-equipment state machine: assign customer → countdown runs → auto-transitions to cleaning → staff taps ready. Utilization accrues into Insights from these events. A small "T-Max integration — supported at launch" affordance sits in Settings, not on the Floor; hardware is anticipated, not faked.

**Check-in flow** (the front-desk spine, must be fast):
Search ("Sar…" → instant) → customer card slides in: photo, membership badge (**Gold Unlimited — active** / package: 3 of 10 remaining / ⚠ payment failed), eligibility (session timing rules surfaced as a friendly gate, configurable per jurisdiction — *structured control, not hardcoded law*), last visit, flags ("waiver expires next month"). → Tap service → tap ready room → session starts on the board. A quiet, dismissible one-line upsell hint when the data supports it ("Sarah bought Botanical Sunshine Revitalizing Bronzer twice — restocked this week"). Walk-in new customer: 4-field quick-create + waiver marked "signed on tablet" (simulated, viewable PDF).

**POS** — deliberately lean: product grid (with images), cart, membership/package redemption as tender types, discounts, simulated card/cash tender, receipt state. Every sale writes into the same data that Daybreak and Insights read — *sell three lotions in the demo and retail attachment visibly moves.* That closed loop **is** the demo magic.

**Schedule** — day/week calendar, bookings by service/room, drag to rebook, walk-in vs. booked distinction, capacity heat-shading (ties to the "Tuesday is open" insight). Online-booking teaser: a customer-facing mock booking page exists as one polished screen (H persona teaser), not a built flow.

## 10. Customers & Memberships

Customer list with instant search and **smart segments** as chips (New this month · Expiring packages · At-risk · Big spenders · Haven't visited 30 days). Segments are the bridge to Studio (any segment → audience).

Profile: visit timeline, membership/package status with payment state, spend, favorite services/products, notes, waiver, consent flags. At-risk customers carry the reason ("visited weekly for 6 months, silent for 3 — pattern break").

**Membership Health** (under Insights, linked everywhere): active/joins/cancels trend, failed payments with recovery workflow (pick the 4 recoverable → pre-written message → simulated send → recovered state a demo-day later), conversion insight from the brief ("customers who visit twice in first 14 days convert at 3× — 12 current customers fit; invite them").

## 11. Marketing / Studio

Not a blank prompt box — a **prompted creation flow that already knows the salon.**

Entry points: (a) *Fix this* from an insight (arrives pre-filled: goal=fill Tuesday, audience=lapsed+flexible, offer suggested), (b) "Create content" from scratch, (c) **Idea shelf** — 4–6 standing suggestions generated from data ("Spray tans up 22% — celebrate it" · "Overstocked: Premium Solution Double Dark — retail spotlight" · "You added red light — explain it").

Flow: Goal → Audience (smart segments, size shown) → Offer (AI-suggested, editable, guardrailed — no medical claims, discounts capped by settings) → **Generate** → output set: Instagram post + caption, Facebook post, SMS version, email version, simple branded graphic (template + salon logo/colors + stock/salon photo). Editing inline; tone control (Fun/Premium/Straight-talk); regenerate per piece. → Preview (phone-frame mock, genuinely pretty) → Schedule/Send (simulated) → Campaign object: draft → scheduled → sent → **measured** (demo clock advances → "23 opens, 9 bookings, ~$310 attributed" flows back to Daybreak).

Real AI generation in first build (this is cheap and high-impact); publishing simulated. Campaign calendar view included; ads/Hootsuite/Mailchimp depth explicitly not.

## 12. Inventory & UVALUX Commerce

Stock list with **days-remaining forecast** (computed from real demo sell-through, not a static label): "Hempz Botanical Sunshine Revitalizing Bronzer — 6 units — ~8 days left at current pace." Reorder threshold flags. Overstock flags ("Premium Solution Double Dark — 34 units, slowing — *Create retail spotlight*" → Studio).

**The bridge:** *Add to UVALUX order* → a **Draft Order** accumulates (recommended items + reasons: "below threshold" / "seasonal: 40% Nov lift last year") → review screen styled like a real UVALUX order (catalogue images, SKUs, wholesale-ish pricing) → *Send to UVALUX rep* (simulated) → appears in Compass on the account timeline. Explainability rule: every recommended line shows its because. This screen is the "UVALUX gets better at its core business" beat of the demo.

## 13. Insights & Peers

Insights opens with **"What changed"** (same engine as Daybreak, longer horizon), then metric areas: Revenue · Memberships · Utilization (heatmap by hour×weekday, fed by room-board events) · Retail · Staff (sales per shift, attachment per staffer — coaching-framed, not leaderboard-shaming) · Campaigns.

**Peers** (benchmarking as a product):
- Cohort chips: *Similar size (6–10 rooms) · Western Canada · Tanning+wellness* — cohort n always shown, minimum n=8, never identifiable.
- Presentation: percentile bands drawn as opportunity, not shame. "Your retail attachment: 15%. Businesses like yours: 23% median. Closing half the gap ≈ **$640/mo** at your traffic."
- Every gap → actions: *Create staff challenge* (a lightweight goal object staff see on the Floor) / *Generate campaign* / *Ask UVALUX for coaching* (creates a coaching request that appears in Compass — a demo-visible bridge between the two products).
- One "you're winning" benchmark always shown ("Top quartile in member retention"). Peers must feel like a coach, not a report card.

## 14. Compass (UVALUX Intelligence)

**Network** — map of participating salons (demo: 12 accounts across BC/AB/ON/QC), health distribution (thriving/steady/needs-attention — each expandable to factors, per Principle 2), network trends (membership growth, category mix, red-light demand curve), adoption stats. This is Nick's screen.

**Call List** — the rep's morning. Ranked cards:

> **Maple Glow Tanning — Kelowna** 🟠
> Retail sales down 17% over 8 weeks; attachment 11% vs. 22% peer median; traffic stable.
> Last order: 6 weeks ago (usually 3). Hasn't ordered lotion category in 2 cycles.
> **Suggested conversation:** retail merchandising + staff sales coaching. Talking points prepared.
> [Call brief] [Log contact] [Schedule coaching] [Snooze]

> **Northern Sun Wellness — Red Deer** 🟢
> UV utilization strong; peak-hour capacity >85% for 6 weeks; red-light demand in peer cohort +30% YoY.
> **Suggested conversation:** expansion / red-light equipment. ROI sketch attached.

*Call brief* generates a one-page pre-call summary (AI, real generation over demo data). *Log contact* writes to the account timeline. The coaching request fired from a salon's Peers screen lands here — show that loop in the demo.

**Accounts** — roster with health, trend arrows, software adoption, order recency. Account detail: revenue/membership/retail trends (**banded/derived, respecting consent tier**), equipment profile, order history, coaching log, signals. A visible consent badge on every account: "Sharing: Benchmarks + Coaching view" — trust made legible in the UVALUX-facing UI too.

**Signals** — product demand by region ("Bronzer category +14% QoQ in AB"), category correlations ("salons adding red light: +9% revenue in 6 months — n=14"), stocking forecasts, churn-risk roll-up. Framed as forecasting for UVALUX's core wholesale business.

**Coaching** — targets (from signals + salon requests), playbook library (retail attachment, membership conversion, reactivation), outcome tracking ("Maple Glow attachment 11% → 16% in 8 weeks post-coaching"). Persona G's home; first build shows the loop shallowly but completely.

## 15. Trust, consent, and "What UVALUX sees"

A first-class Settings screen in Bask — and a demo beat, because for Nick the *credibility of the consent story is a selling feature to salons*:

- Three sharing tiers, plain-language, per-salon: **Private** (nothing leaves; no Peers) · **Benchmarks** (anonymized aggregates in; percentile comparisons out) · **Benchmarks + Coaching view** (UVALUX rep sees derived business signals & trends — never customer names, contacts, or individual transactions).
- The screen literally shows two side-by-side previews: "What you see" vs. "What UVALUX sees" for the current tier. Radical legibility instead of a ToS paragraph.
- Access is role-based and audited; small cohorts suppressed (n<8); no dark patterns — downgrading is one click and Compass reflects it.

## 16. AI capability specification

Per the brief's required format. All run against demo data with **real generation/rules** — none are canned strings.

| Capability | Trigger | Context in | Output | User control | Explanation | Resulting action |
|---|---|---|---|---|---|---|
| **Daybreak brief** | Daily on open (demo clock) | Yesterday vs. rolling baselines, insight queue, calendar | Narrative greeting + ranked attention cards | Dismiss/snooze per card; brief length setting | Every claim cites metric, window, baseline | Deep-links: Fix this / Show why |
| **Insight detection** | Continuous rules engine (thresholds + trend breaks vs. own baseline & peer cohort) | Sales, memberships, visits, inventory, utilization, campaigns | Typed insight objects w/ $ impact estimate | Dismiss w/ reason; sensitivity setting | Factor breakdown on drill-down | Each type maps to an action template |
| **Campaign generator** | *Fix this* or Studio entry | Goal, segment, offer guardrails, brand tone, salon assets, seasonal context | Multi-channel content set + graphic | Full inline edit, tone, regenerate per piece; nothing sends without confirm | "Why this offer/audience" note on suggestions | Campaign lifecycle + measured outcome |
| **Churn saves** | Pattern break (frequency drop, expiring package, failed payment) | Visit history, membership state, past response | At-risk list w/ reasons + drafted outreach | Edit/skip per customer | The pattern break itself, stated plainly | Simulated send → tracked response |
| **Payment recovery** | Failed EFT events | Payment history, customer value | Recoverable-ranked list + message drafts | Approve per message | "4 of 7 have prior recovery / active usage" | Recovered MRR shown in Daybreak |
| **Reorder forecast** | Days-remaining < threshold | Sell-through pace, seasonality, catalogue | Draft-order lines w/ qty suggestion | Edit qty/remove; order never sends itself | Per-line "because" | UVALUX draft order → Compass timeline |
| **Rep call brief** (Compass) | Rep taps Call brief | Account trends, signals, order history, coaching log, peer gaps | One-page pre-call summary + talking points | Editable notes; log outcome | Signals listed with data | Logged contact / scheduled coaching |
| **Anomaly flag** | Metric outside expected band | Baselines, day-of-week seasonality | "Something unusual" card, severity-ranked | Dismiss/investigate | Expected vs. actual band shown | Drill-down |
| **Shift Handoff** | End of configured shift window | Day's sales, incidents, low stock, tomorrow's first bookings | One-card shift summary posted to the Floor | Manager can annotate/edit before it posts | Figures link to their sources | Next shift opens to it; owner copy in Daybreak |

Explicitly **not** first build: AI receptionist, review responding, forecasting models beyond simple baselines, free-chat assistant shell (a small "Ask Bask" natural-language query box may ride along in Insights if cheap — it is garnish, never the shell).

---

# Part VI — Design Direction

## 17. Mood and system

- **Feel:** sunlit premium calm. Warm off-white surfaces, deep warm-ink text, one confident **amber/terracotta** accent for actions and highlights; soft shadows, generous radius, real whitespace. Success = warm green; attention = amber; risk = clay red. Absolutely no purple-gradient AI kitsch, no dense gray admin chrome.
- **Typography:** editorial pairing — a humanist sans for UI (e.g., general-purpose grotesque with warmth) + a display serif reserved for Daybreak narrative headlines, so the brief reads like a morning letter, not a log line. Numbers in a tabular variant.
- **Density modes:** relaxed (Today, Insights, Studio, Compass Network) vs. compact (Floor, POS, Customers list, Call List). Same tokens, two spacing scales.
- **Compass theme:** same system, inverted — deep warm charcoal surfaces, same amber accent. Instant visual "we switched products" in the demo.
- **Motion:** functional only — cards settle in on Daybreak (staggered, ~200ms), countdowns tick, state changes ease. One tasteful celebratory moment (membership milestone confetti-lite) and nothing else gimmicky.
- **Charts:** minimal, warm-toned, annotated with the sentence they support. Sparklines everywhere numbers trend. No chart without a caption stating what it means.
- **Copy voice:** competent friend. Short sentences. Never scolds ("opportunity," not "failure"). Bask says "you"; Compass says the salon's name.

## 18. Responsive priorities by persona

| Surface | Desktop | Tablet | Phone |
|---|---|---|---|
| Today/Daybreak | ✅ | ✅ | **✅ first-class** (owner's morning is on the phone) |
| The Floor / POS | **✅ primary** | ✅ | ❌ (view-only pulse at most) |
| Studio | ✅ primary | ✅ | approve/edit ok |
| Insights/Peers | ✅ primary | ✅ | key cards readable |
| Compass Call List / Account | ✅ | ✅ | **✅ first-class** (rep in the truck) |
| Compass Network | ✅ primary | ✅ | readable |

First build: responsive web app; Daybreak and Call List demo beautifully on a phone in Nick's hand. No native apps.

---

# Part VII — First Build

## 19. Scope tiers

**Real and interactive (the product is these loops):**
- Full navigation, both apps, role switcher (Owner / Front desk / UVALUX rep / UVALUX leadership) for demo.
- Daybreak + insight engine (real rules over demo data; cards, drill-downs, dismiss/action states, outcome follow-ups).
- The Floor: room board state machine, check-in flow, quick-create customer, POS-lite writing real data, schedule with drag-rebook.
- Customers: list, search, segments, profiles, membership/package states, failed-payment recovery flow.
- Studio: full creation flow with **real AI generation**, editing, preview, lifecycle states, campaign calendar, measured outcomes.
- Inventory: stock, real days-remaining computation, thresholds, overstock→Studio bridge, UVALUX draft order flow.
- Insights: what-changed, core metric areas, utilization heatmap, staff view, **Peers** with cohort chips and gap→$→action.
- Compass: Network overview, Call List with reasons + AI call briefs, Accounts + detail, Signals (seeded), coaching request loop (salon→Compass), contact logging.
- Consent: "What UVALUX sees" screen with tier switching that visibly changes Compass.
- **Demo clock:** a discreet demo-mode control to advance a day/week — campaigns get results, forecasts move, Daybreak regenerates. This is the mechanism that makes before/after demoable and is a hard requirement.

**Simulated but genuinely interactive:** equipment timers (state machine, no hardware), SMS/social/email publishing (state transitions + plausible generated results), payment tender & EFT events (seeded failures, simulated recovery), benchmark cohort data (seeded, statistically sensible), waiver signing (pre-signed viewable).

**Represented for the future (one polished screen or affordance each, clearly marked):** customer-facing booking page mock, customer portal/wallet-ID teaser, multi-location switcher (grayed second location "Coming with pilot"), T-Max/timer integration settings entry, payments settings, migration/import entry point ("We move your data for you — concierge migration"), training/playbook library depth.

**Explicitly out:** real processors/EFT, real message delivery, hardware, native apps, payroll/bookkeeping, ad buying, loyalty engine, franchise governance, multi-jurisdiction compliance automation, real auth/multi-tenant hardening (single demo tenant + role switcher is fine).

## 20. Demo dataset (the demo is only as good as this)

**Hero salon: "Sunset Ridge Tanning & Wellness" (Kelowna, BC)** — 8 rooms: 3 UV levels ×4 beds worth of variety (Level 1×2, Level 2, Level 3, stand-up), spray booth, red light ×2, hydromassage. ~420 customers, ~120 active members across 3 tiers + packages, 90 days of visits/sales/campaign history, 12 staff-shift patterns, ~40 retail SKUs mapped to plausible UVALUX catalogue items (Australian Gold etc.).

**Seeded story arcs (must produce the demo beats naturally):** retail attachment 21%→15% over 3 weeks (concentrated in two staffers) · Tuesday 1–5 pm chronically soft · 7 failed payments, 4 recoverable · Hempz Botanical Sunshine Revitalizing Bronzer 8 days from stockout · Norvell Premium Solution Double Dark overstocked · spray tans trending +22% · membership joins healthy, one cancellation cluster · a "best Tuesday ever" waiting to happen after the campaign (demo clock payoff).

**Compass portfolio: 12 salons** across BC/AB/ON/QC with varied health — including **Maple Glow Tanning** (retail decline arc) and **Northern Sun Wellness** (expansion-ready arc) exactly as the brief sketches, plus a Private-tier salon (shows consent working), a new opening (onboarding state), and a thriving multi-location teaser account.

Dataset ships as seeded, regenerable fixtures — the demo must be resettable to day-zero in one command.

## 21. Demo script for Nick

> **Superseded:** the authoritative, bookmark-mapped script lives in `docs/pitch/PITCH.md` and versions with the build. The narrative below is the original sketch it grew from — kept for context, do not maintain two scripts.

### Original sketch (~12 minutes, two acts + close)

**Cold open — phone in hand (1 min).** No slides. Hand Nick a phone showing Daybreak. "This is what a salon owner sees every morning." Let him read it. The greeting mentions yesterday's win, the retail slip, the open Tuesday. *Beat: the software already did the analysis.*

**Act 1 — the owner (6 min), on the big screen.**
1. *Insight → action:* open the Tuesday card → Show me why (heatmap) → Fix this → Studio pre-filled → generate → edit one line of the SMS live (proves it's real) → preview on phone frame → schedule.
2. *The Floor:* room board alive, countdowns running. Check in "Sarah" — membership badge, package count, one-tap room assignment. Ring up a lotion on POS. *Beat: this is a real operational system, not a deck.*
3. *Supply:* Inventory → Hempz Botanical Sunshine Revitalizing Bronzer, 8 days left → Add to UVALUX order → draft order with reasons → send to rep. *Beat: software that reorders UVALUX product.*
4. *Demo clock:* advance to next Tuesday. Daybreak now reads "Yesterday was your best Tuesday in 6 weeks — the campaign brought 9 bookings (~$310)." *Beat: the loop closes; marketing is measured, not hoped.*

**Act 2 — UVALUX (4 min).** Switch role. Theme flips dark.
5. Network map — 12 salons, health distribution. "This is the network you already serve, visible for the first time."
6. Call List — Maple Glow card. Open the call brief. "Your rep doesn't call asking if they need supplies. They call knowing retail is down 17% and exactly what to suggest." Show Northern Sun — expansion signal. Show Sunset Ridge's draft order arriving on the account timeline.
7. *Trust beat:* open a Bask salon's "What UVALUX sees" screen, flip the tier, show Compass change. "This only works if salons trust it — so trust is a feature, not a footnote."

**Close (1 min).** "Today you tell new salons to go compare software vendors. This is what it looks like when the software is yours: recurring revenue, a smarter sales force, deeper retention on the wholesale side — and every salon runs better. Three companies win at once." Ask the discovery questions (§25) conversationally.

## 22. Success criteria for the first build

Discovery-stage (from the brief, made testable): Nick articulates the two-sided value back unprompted within the meeting · a salon operator completes check-in + campaign creation with zero facilitation · marketing output rated "would edit and use" not "would discard" · at least 3 of the brief's discovery questions answered in the room because the demo provoked them · Nick proposes next step (pilot salons / commercial structure) without being asked. Pilot-stage metrics as in brief §41 — carried into roadmap, not first build.

---

# Part VIII — Business Model, Roadmap, Risks

## 23. Business model recommendation (hypotheses, for the Nick conversation)

- **Salon subscription:** two tiers, priced **above** category ($100–200 US incumbents) on the strength of AI+marketing+Peers — working hypothesis **CAD $199/mo Core**, **CAD $299/mo Intelligence** (adds Peers, advanced AI, multi-location). Anchor: "replaces software + a marketing subscription + a fraction of an agency."
- **UVALUX relationship:** Compass licensed to UVALUX (per-seat or flat network fee) **or** bundled into a reseller/rev-share structure where UVALUX sells Bask (co-branded), keeps a margin, and bundles 6–12 months free with new-salon equipment packages. Recommend opening with rev-share reseller — it aligns incentives and uses the channel hardest.
- **Later layers (roadmap, not promises):** payments residuals, SMS/email allowances, premium benchmarking, commerce lift on the wholesale side (measured, not margined).
- **Alignment rule:** no incentive in the model may reward exploiting the operator (e.g., no per-message markup pressure inside AI recommendations).

## 24. Roadmap

- **Phase 1 (this spec):** demoable integrated product — the five loops, both apps, demo clock. *Exit: Nick demo + 2–3 salon-operator reactions.*
- **Phase 2 — Pilot foundation:** real auth, tenant isolation, data hardening, core POS/membership completeness, permissions, concierge import strategy, first messaging integration (real SMS), consent legal-review. *Exit: 2–3 real salons (new openings preferred) running daily.*
- **Phase 3 — Tanning depth:** T-Max/timer integration, EFT/payments (processor chosen for token portability), maintenance/lamp-hours, robust reporting, customer portal + online booking, multi-location. *Exit: a salon switches FROM an incumbent successfully.*
- **Phase 4 — Network effects:** real Peers cohorts at n>30 salons, coaching program instrumentation, product forecasting for UVALUX purchasing, commerce integration with real catalogue/ordering. *Exit: measurable reorder-frequency lift on UVALUX side.*
- **Phase 5 — Wellness expansion:** richer resource/service scheduling, contouring/recovery/spa service types, wellness membership models, distribution beyond traditional tanning.

## 25. Top discovery questions to carry into the Nick meeting

(Full lists in brief §46–47 stand; these ten are the ones the demo should surface naturally.) Active salon count & tanning share · annual new-salon openings UVALUX touches · most-seen incumbent software & top complaints · what a rep wants before a call · struggling-salon signals · expansion-ready signals · branding preference (white-label / co-brand / resell) · commercial preference (invest / license / rev-share) · privacy boundaries Nick considers essential · 3–5 trusted owners for discovery interviews.

## 26. Risks and the assumptions this spec bets on

| Risk | This spec's bet | Test |
|---|---|---|
| Category too small | Depth-of-monetization + UVALUX channel efficiency beats logo-count; wellness adjacency is real (SunLync precedent) | Nick's customer counts (§25) |
| Incumbent domain depth | First build honestly simulates hardware/EFT; Phase 2–3 sequence targets new salons first, migration later | Operator interviews: "what would make you switch / stop you" |
| Dealer-data trust | Consent tiers as visible product feature; Compass shows derivations only | Watch salon-operator reaction to "What UVALUX sees" screen |
| AI slop | Every generation grounded in salon data with editable output; usefulness measured (accept/edit/discard) | Studio outputs rated by real operators |
| Overbuild | Five loops, demo clock, hard "represented vs. real" line in §19 | Build stays inside §19 or the deviation is logged |
| Nick prefers heavy UVALUX branding | Naming architecture co-brands without redesign | Ask directly |

---

# Part IX — Handoff to Opus

Opus: this section converts the spec into implementation priorities. It is intent + constraints; engineering decisions (stack, schema, services) are yours. Where the spec is ambiguous, resolve with the Product Principles (Part III), in order.

## Build priorities

- **P0 — the spine:** demo dataset + regenerable fixtures + demo clock; insight rules engine; Daybreak; The Floor (room-board state machine, check-in, POS-lite writing real data); role switcher. Nothing else matters if these aren't excellent.
- **P1 — the loops:** Studio with real AI generation and campaign lifecycle + measured outcomes; Inventory forecast → UVALUX draft order; Customers/segments/recovery flow; Insights + Peers with gap→$→action; Compass (Network, Call List + call briefs, Accounts, coaching-request loop); consent screen driving Compass visibility.
- **P2 — polish that sells:** Weekly Story; Idea Shelf; phone-frame previews; Compass dark theme; celebratory moment; represented-future screens (booking mock, portal teaser, integration settings); demo reset command.

## Hard constraints

1. **One dataset, two apps.** Bask and Compass read the same seeded data through a consent filter. No parallel fake data for Compass.
2. **No static fakery.** Simulated integrations must still change real state (Principle 7). Selling a lotion moves attachment; advancing the clock changes Daybreak.
3. **Insights are objects, not strings.** Typed, stateful (new/seen/actioned/dismissed), evidence-carrying, action-linked. The rules can be simple thresholds/trend-breaks — but they must run against the data.
4. **Real AI where specified** (Daybreak narrative, Studio generation, call briefs) with guardrails: no medical claims, editable everything, nothing auto-sends.
5. **Floor speed budget:** customer search and check-in interactions feel instant on mid hardware. If intelligence features threaten Floor latency, intelligence loses.
6. **Demo clock is P0**, resettable to day-zero in one command.
7. **Design system per Part VI** — build tokens first; both density modes; Compass inverted theme. Screenshot against adjacent screens before calling any surface done.

## Reuse (inspect before building — accelerators, not constraints)

- **`~/projects/CompPortal`** — social-media helper, AI-helper interfaces, content-generation workflows, prompt orchestration, dashboard patterns → Studio, Daybreak generation, insight cards.
- **`~/projects/carly-hair-co`** — booking/scheduling/calendar workflows, inventory, supply ordering, customer management → The Floor schedule, Inventory, UVALUX draft order, Customers.

Run the anti-duplication gate per feature: search both repos (live, dormant, embedded layers) before writing any new surface. Adapt what exists where it genuinely fits the UX specified here; do not contort this product to fit old code, and do not rebuild what already works.

## Explicitly deferred to your judgment

Stack and hosting · data layer and whether the "rules engine" is code or config · AI provider/model routing · how the demo clock manipulates time (real timestamps offset vs. virtual clock — pick what keeps the fixtures sane) · chart library · exact component breakdown. Log deviations from this spec in the plan file, not silently.

---

*End of specification. The bar, restated from the brief: a salon owner says "this would genuinely help me run my business," a UVALUX rep says "this tells me exactly how to help my customers," and Nick says "this could become a meaningful new layer of the UVALUX business" — all three within one 12-minute demo.*
