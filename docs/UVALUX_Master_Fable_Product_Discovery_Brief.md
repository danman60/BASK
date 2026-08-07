# UVALUX Intelligence Platform
## Master Product Discovery and Semantic Build Brief for Fable

**Document purpose:** Give Fable the complete business, product, market, UX, and strategic context needed to create the product specification that will later be executed by Opus.

**Primary stakeholder and ultimate decision-maker:** Nick, President of UVALUX.

**Fable's role:** Product strategist, founder-level product thinker, UX architect, service designer, interaction designer, AI product designer, and creative systems thinker.

**Opus's role:** Later-stage technical planner and implementation agent. Fable should produce the product and UX specification that gives Opus enough clarity to build the product while preserving room for sound engineering decisions.

---

# 1. The Assignment to Fable

This is deliberately **not** a technical build specification.

Do not begin by choosing frameworks, database schemas, service boundaries, API shapes, queueing systems, infrastructure, or implementation details. Those decisions belong primarily to the later implementation stage.

Instead, use this brief to understand the opportunity deeply and design an unusually strong product.

Your job is to translate the context below into a coherent product specification that defines:

- what the product is,
- whom it serves,
- why it should exist,
- why UVALUX is unusually positioned to distribute it,
- what makes it materially better than existing tanning software,
- what the first experience should feel like,
- which workflows matter most,
- how the salon-facing and UVALUX-facing products relate to one another,
- where AI is genuinely useful,
- how data becomes a differentiated product feature,
- what should be testable and demoable in the first build,
- what should wait,
- and how this could evolve from tanning-software wedge into a broader wellness-business platform.

Be opinionated. Be imaginative. Propose interactions and product ideas we have not already described.

Do **not** merely reproduce this document as a feature list.

Do **not** assume that the existing category conventions are correct.

Do **not** design a generic POS with a new coat of paint.

The strongest outcome is a product vision that makes Nick immediately understand why UVALUX should want this to exist.

---

# 2. The One-Sentence Product Thesis

> **Build the operating system for modern tanning and wellness businesses, and the intelligence layer that helps UVALUX make those businesses more successful.**

The application has two simultaneous purposes.

For the salon, it should make the business easier to run and more profitable.

For UVALUX, it should create a new recurring software business while giving the company a consent-based, high-level view into the health, opportunities, and needs of the downstream businesses it already serves.

This second purpose is not an internal analytics afterthought. It is one of the core reasons the product is strategically interesting.

---

# 3. Why UVALUX Is the Strategic Opportunity

UVALUX is not simply a potential software customer.

It is a possible distribution channel, domain partner, product-development partner, and strategic owner/reseller of the relationship with salon customers.

UVALUX publicly describes itself as Canada's largest wholesale distributor in its category and presents itself as a long-term business partner to tanning and wellness businesses. It has operated for decades, supports salons with product and equipment selection, training, technical service, business planning, pricing, memberships, and marketing support, and has operations in Western Canada, Quebec, and Southwestern Ontario.

Most importantly for this concept, UVALUX explicitly includes **salon management software** as one of the steps in opening a salon, yet its current public guidance tells owners that several third-party POS options exist and that they should compare products to find the best fit.

That creates an obvious strategic gap:

UVALUX already helps the customer choose the business model, equipment, inventory, training, and support, but the operating software remains largely outside the UVALUX relationship.

The opportunity is to close that gap.

Rather than telling a new salon owner to go compare unrelated software vendors, UVALUX could eventually say:

> "Here is the platform we recommend because it was designed around the way successful UVALUX salons operate."

That is a much stronger starting position than a conventional SaaS startup attempting to cold-acquire salon owners one at a time.

---

# 4. The Founder's Relationship Context

The person initiating this product concept already knows Nick, the President of UVALUX, through an existing video-business client relationship.

This matters.

The initial product does not need to behave like a speculative startup attempting to impress an unknown corporation through a generic sales deck.

The early product can be developed collaboratively, shown directly to a knowledgeable stakeholder, critiqued, refined, and potentially tested with selected UVALUX salon customers.

The first version should therefore optimize heavily for:

- demonstrating the strategic idea,
- making the opportunity tangible,
- eliciting useful feedback,
- revealing workflow assumptions,
- creating excitement,
- and giving Nick something concrete enough to imagine UVALUX selling.

---

# 5. Immediate Build Objective

The first build is **not** intended to be production-complete software.

It is intended to be an exceptionally convincing, interactive, polished first product that Nick and selected salon operators can actually use, click through, test, and discuss.

This distinction is critical.

The first build should not disappear into months of invisible infrastructure work.

It should produce an artifact that demonstrates the product thesis.

Every major feature Fable includes in the initial specification should pass this test:

> **Can this be demonstrated convincingly in an early meeting?**

Whenever possible, initial capabilities should work end to end, even if some underlying integrations, external systems, automation, hardware connectivity, or data sources are represented by controlled demo data or simplified adapters.

The first build should feel like a real product, not a slide deck and not a wireframe.

It should be:

- beautiful,
- highly interactive,
- visually coherent,
- testable,
- demoable,
- understandable without a long explanation,
- realistic enough for a salon owner to imagine using,
- and broad enough to demonstrate the larger strategic vision.

Avoid an MVP dominated by administration panels, foundational infrastructure, empty settings pages, or half-completed workflows.

If a sophisticated future capability cannot be completed meaningfully in the first build, design the smallest complete experience that communicates its value.

---

# 6. Market Context

The tanning-management software category is real, specialized, and mature.

Verified current competitors include:

## Tan-Link

Tan-Link publicly positions itself as purpose-built tanning software and currently lists plans at approximately:

- **US$129/month** for Essential,
- **US$179/month** for Ultimate,
- **US$199/month** for Pro when paid monthly, with a lower effective rate when paid annually.

Its tanning-specific differentiation includes:

- POS,
- EFT recurring billing,
- text marketing,
- T-Max bed control,
- lamp-hour tracking,
- reporting,
- inventory,
- gift cards,
- online booking,
- online store,
- customer portal,
- kiosk functionality,
- 24-hour unattended access,
- equipment status,
- marketing tools,
- digital agreements,
- wallet-compatible IDs and gift cards.

This is useful evidence that tanning-specific equipment control and operational workflows are important enough to support pricing well above commodity appointment-booking software.

## SunLync Pro

SunLync currently states that pricing begins at approximately **US$150 for a single location**.

Its product emphasizes:

- POS,
- multi-location management,
- memberships and packages,
- EFT billing,
- appointments,
- inventory,
- remote access,
- employee permissions,
- UV and wellness-equipment controls,
- timer integrations,
- equipment and lamp maintenance,
- offline capability,
- real-time reporting,
- revenue analysis,
- customer insights,
- membership metrics,
- staff performance,
- marketing,
- notifications,
- promotions,
- loyalty,
- referral systems,
- and integration capabilities.

SunLync now explicitly positions itself beyond tanning and toward spa, wellness, and fitness.

That validates the broader wellness-platform direction contemplated here.

## TanTrack

TanTrack currently lists:

- **US$99.99/month** for its Starter plan,
- **US$129.99/month per location** for its Bundle,
- custom pricing for Pro and multi-location deployments.

TanTrack emphasizes:

- tanning appointments,
- online bookings,
- memberships,
- packages,
- gift cards,
- marketing,
- appointment reminders,
- employee management,
- inventory,
- equipment control,
- digital agreements,
- cloud hosting,
- reporting,
- kiosk/self-check-in,
- and multi-location management.

TanTrack publicly claims more than 5,000 active salons and states that it runs one in three salons. These are vendor claims and should be treated as directional rather than independently audited market-size statistics.

## Helios

Helios has operated in salon software since 1988 and offers a Windows-based salon POS platform, including an enterprise product supporting multiple locations through a hosted network.

It emphasizes:

- salon sales control,
- inventory,
- client data,
- reporting,
- multi-location support,
- integrated payments,
- marketing,
- and salon-specific operations.

Public pricing is not clearly posted and should therefore be treated as quote-based rather than assigned an invented monthly value.

---

# 7. Market Size: Use a Bottom-Up Model, Not Inflated Research Headlines

Do not anchor the business case on questionable third-party reports claiming an enormous global tanning-software market.

Instead, use a transparent bottom-up model.

The category's public pricing suggests roughly **US$100 to US$200 per location per month** for core specialized software before considering incremental revenue from:

- payments,
- SMS usage,
- marketing services,
- hardware,
- kiosks,
- access control,
- premium analytics,
- AI,
- financing,
- implementation,
- data products,
- and supplier commerce.

A useful working TAM model for strategic discussion is:

| Addressable locations | Software ARPU | Illustrative annual subscription pool |
|---:|---:|---:|
| 10,000 | US$125/mo | US$15.0M |
| 15,000 | US$150/mo | US$27.0M |
| 20,000 | US$175/mo | US$42.0M |
| 30,000 | US$175/mo | US$63.0M |
| 30,000 | US$250/mo | US$90.0M |

These are **scenario calculations, not claims that a particular number of salons currently exists**.

The critical question for this business may not be "Is tanning software a billion-dollar category?"

A better question is:

> "Can UVALUX distribute a high-retention vertical SaaS product into a network it already serves, create meaningful recurring revenue, strengthen its core distribution business, and then expand the platform into adjacent wellness categories?"

The answer could be attractive even if the pure tanning-software TAM is modest.

A vertical SaaS product with several thousand locations, healthy ARPU, payments, marketing, commerce, and supplier-network effects can be a very meaningful business.

---

# 8. Why This Is More Than SaaS Revenue

The direct software subscription is only one layer of value.

The product potentially improves UVALUX economics through:

- stronger salon retention,
- more informed sales representatives,
- better product recommendations,
- better inventory forecasting,
- more targeted training,
- identification of salons that need coaching,
- identification of salons ready for expansion,
- identification of product-category opportunities,
- easier supply reordering,
- tighter integration between UVALUX and day-to-day salon operations,
- and recurring software revenue.

If done correctly, software increases the lifetime value of the **existing UVALUX customer relationship**, not merely the value of a separate SaaS account.

This distinction should influence the product design.

---

# 9. The Product Should Serve Two Sides

There are two primary product surfaces.

## 9.1 The Salon Operating System

The salon-facing product is where owners, managers, and staff run the business.

It should ultimately cover the workflows expected of serious tanning software while presenting them through a more modern, intelligent experience.

Likely domains include:

- front desk,
- customer profiles,
- booking,
- equipment/session management,
- memberships,
- EFT billing,
- POS,
- retail,
- inventory,
- staff,
- waivers,
- reporting,
- marketing,
- customer engagement,
- supply ordering,
- maintenance,
- and AI assistance.

## 9.2 UVALUX Intelligence

UVALUX should have a fundamentally different view.

This should not simply be "super admin."

It should feel like a dealer-network intelligence product.

It should help UVALUX answer questions such as:

- Which salons are healthy?
- Which salons are declining?
- Which salons are growing?
- Who needs coaching?
- Who needs marketing help?
- Which salons have weak retail attachment?
- Which salons are underutilizing equipment?
- Which salons might benefit from a new service category?
- Which owners appear ready for another location?
- Which products are moving faster by region?
- Which equipment categories correlate with stronger revenue?
- Which customers have stopped ordering products they previously purchased?
- Which UVALUX rep has an actionable reason to contact a salon today?

This is a major product thesis.

Treat it with equal seriousness to the salon product.

---

# 10. Data Is a Selling Feature

A central strategic idea from the founder is:

> **Visibility into downstream salons through data is, by its nature, a selling feature of the platform.**

Do not bury this inside analytics.

The platform should actively convert data into value for salon owners and UVALUX.

With explicit consent, appropriate privacy controls, and clear governance, participating businesses could contribute operational metrics to anonymized benchmarking.

That enables intelligence no individual salon can produce alone.

Examples:

- average revenue per active member,
- membership conversion rate,
- cancellation rate,
- customer retention,
- visit frequency,
- revenue by equipment class,
- revenue by service,
- utilization by hour and weekday,
- retail attachment rate,
- average retail basket,
- product sell-through,
- inventory turnover,
- marketing conversion,
- campaign performance,
- average revenue per room,
- average revenue per square foot where available,
- staff sales performance,
- new-customer conversion,
- repeat-visit behavior,
- seasonal performance,
- regional trends.

The product should answer not only:

> "What happened?"

but:

> "Is this good?"

then:

> "Why?"

then:

> "What should I do next?"

---

# 11. Benchmarking as a Salon Feature

Salon owners should be able to answer:

> **How am I doing compared with businesses like mine?**

Benchmarking should be carefully designed to be useful rather than punitive.

Potential cohort dimensions include:

- province or region,
- single-location versus multi-location,
- similar equipment mix,
- similar number of rooms,
- tanning-only versus tanning-plus-wellness,
- revenue band,
- business age,
- membership penetration,
- comparable service mix.

Useful presentation patterns may include:

- percentile,
- trend against cohort,
- opportunity gap,
- "businesses like yours" benchmarks,
- best-performing category,
- largest improvement opportunity,
- anonymized best-practice observations.

Example:

> Your retail attachment rate is 14%. Similar high-performing salons average 23%. Improving this metric to 18% would represent approximately $X/month at your current traffic.

The interface should then offer an action.

> **Create a staff retail challenge**
>
> **Generate a lotion campaign**
>
> **Ask UVALUX for coaching**

Benchmarking should lead naturally into action.

---

# 12. UVALUX Sales Intelligence

The product could transform the role of a UVALUX sales representative.

Today a representative might call and ask whether a salon needs supplies.

In the future, the representative could open a prioritized portfolio view and see:

> **Maple Glow Tanning**
>
> Retail sales down 17% over eight weeks.
>
> Lotion attachment is below comparable salons.
>
> Customer traffic remains stable.
>
> Suggested conversation: retail merchandising and staff sales coaching.

Or:

> **Northern Sun Wellness**
>
> UV utilization is strong.
>
> Peak-hour capacity is consistently above 85%.
>
> Red-light demand in comparable salons is growing.
>
> Suggested opportunity: expansion conversation.

The software should help UVALUX become more consultative.

That improves customer success and creates legitimate commercial opportunities without reducing the product to an upsell engine.

---

# 13. AI Philosophy

AI should feel native.

Do not build "a chatbot tab" and declare the product AI-first.

The best AI experiences should emerge from actual context and reduce cognitive work.

The system should proactively notice things.

The owner should regularly experience:

> "I didn't even have to ask."

Potential AI capabilities include:

- morning business briefing,
- end-of-day summary,
- natural-language reporting,
- marketing recommendations,
- campaign creation,
- retention opportunities,
- inventory warnings,
- reorder suggestions,
- product recommendations,
- revenue anomaly detection,
- membership churn signals,
- staff coaching suggestions,
- slow-period promotions,
- equipment utilization insights,
- maintenance reminders,
- review-response drafting,
- social media creation,
- customer-segment suggestions,
- sales forecasting,
- and eventually AI receptionist/customer-service functions.

AI recommendations should explain **why** they are being made.

Avoid mysterious scores with no evidence.

Good:

> "Membership cancellations have risen for three consecutive weeks and are now 28% above your 90-day average."

Weak:

> "Your business health score is 71."

If the system uses a score, make the underlying factors legible.

---

# 14. The Morning Brief

One aspirational experience should be a strong daily briefing.

An owner opens the app and immediately sees something like:

> **Good morning. Yesterday finished 8% above your four-week Thursday average.**
>
> Membership revenue is healthy.
>
> Retail attachment slipped from 21% to 15%.
>
> Three customers with expiring packages have not rebooked.
>
> Tuesday afternoon next week is unusually open.
>
> Australian Gold inventory is approaching your reorder threshold.
>
> I have three actions you can take today.

Actions might be:

- Generate a Tuesday promotion.
- Message expiring customers.
- Prepare a suggested UVALUX supply order.

This is a much stronger home screen concept than a wall of charts.

Fable should explore how this briefing and a visual dashboard can coexist.

---

# 15. Marketing Is a Core Product, Not an Add-On

The application should include rudimentary but genuinely useful social-media creation in the **first build**.

This requirement is explicit.

Marketing should eventually support:

- Facebook posts,
- Instagram posts,
- Instagram captions,
- Stories,
- SMS campaigns,
- email campaigns,
- seasonal promotions,
- review requests,
- Google Business content,
- referral campaigns,
- reactivation campaigns,
- membership campaigns,
- new-service launches,
- before-and-after style promotional graphics where appropriate and based on user-provided/authorized media,
- basic campaign calendars,
- and content suggestions.

The early implementation does not need to become Canva, Hootsuite, Mailchimp, and an ad agency simultaneously.

The first version needs to demonstrate the product insight:

> **Operational data should be able to turn directly into marketing action.**

For example:

1. System identifies an underbooked Tuesday afternoon.
2. Owner clicks **Fix this**.
3. AI suggests an offer.
4. Owner chooses audience.
5. System generates an SMS plus social post.
6. Owner edits the copy.
7. Campaign can be previewed and represented as scheduled/sent in the demo environment.
8. Dashboard later shows the campaign result.

That is an ideal demo loop because it connects analytics, AI, marketing, and business outcome.

---

# 16. Social Content Experience

Explore a lightweight, delightful content studio rather than a blank prompt box.

Potential inputs:

- goal,
- offer,
- service,
- audience,
- tone,
- date,
- available products,
- seasonal context,
- salon photos/assets.

Potential outputs:

- post copy,
- headline,
- CTA,
- story text,
- SMS version,
- email version,
- simple branded graphic concept.

Where helpful, the system should pre-populate content ideas from business data.

Examples:

- "Your spray-tan appointments are up. Celebrate the trend."
- "Wednesday has extra capacity. Promote a midweek offer."
- "This product is overstocked. Create a retail spotlight."
- "You added red light therapy last month. Explain it to customers."

The marketing experience should feel like a business assistant that knows the salon.

---

# 17. Customer Experience

The software should improve the customer's experience quietly.

Potential long-term capabilities:

- online booking,
- easy rescheduling,
- membership management,
- package balances,
- self check-in,
- digital waiver completion,
- gift cards,
- rewards,
- referral incentives,
- personalized offers,
- reminders,
- birthday messages,
- membership anniversaries,
- reactivation,
- digital receipts,
- customer portal,
- digital account ID.

The customer-facing experience should feel contemporary and mobile-friendly.

---

# 18. Salon Operations: Category Table Stakes

While differentiation should come from AI, data, UX, UVALUX integration, and network intelligence, the product cannot ignore specialized tanning workflows.

Competitive products demonstrate that serious salon operators expect functions such as:

- POS,
- recurring memberships/EFT,
- packages and credits,
- appointments,
- walk-ins,
- equipment assignment,
- bed/timer integration,
- equipment status,
- session history,
- lamp-hour or equipment usage tracking,
- maintenance,
- client profiles,
- inventory,
- employee permissions,
- reporting,
- digital waivers,
- payments,
- marketing,
- multi-location support.

Fable should determine which of these are necessary to make the first build believable and which should be explicitly staged for later implementation.

Do not attempt to implement every deep hardware integration in the first demo merely because incumbents have them.

Instead, the UX should clearly understand these realities so the system does not need to be redesigned later.

---

# 19. Equipment and Session Experience

Tanning and wellness businesses differ from generic salons because rooms and equipment can be revenue-producing resources with session limits, availability, maintenance state, service types, customer eligibility, and hardware controls.

Explore an elegant visual operations view.

Possibilities include:

- live room board,
- room/equipment status,
- ready / occupied / cleaning / maintenance states,
- customer queue,
- countdown/session state,
- equipment category,
- availability,
- recent usage,
- utilization,
- service notes.

The initial build can use simulated equipment state.

Long-term integration requirements should anticipate industry timer systems such as T-Max and other supported control systems without allowing the first build to become a hardware-engineering project.

---

# 20. Memberships and Recurring Revenue

Recurring membership/EFT programs are central to tanning economics.

The product should make membership health exceptionally visible.

Explore:

- active members,
- new memberships,
- cancellations,
- freezes,
- failed payments,
- recovery opportunities,
- revenue,
- retention,
- package utilization,
- conversion from visitor to member,
- membership cohort trends.

Potential proactive insights:

> "Seven memberships failed payment this week. Recovering four would preserve $284 in monthly recurring revenue."

Or:

> "Customers who visit twice in their first 14 days convert to memberships at a higher rate. Twelve current customers fit that profile."

The product should turn membership data into actions.

---

# 21. Inventory and UVALUX Commerce

Inventory is an unusually important strategic bridge between salon operations and UVALUX.

The founder already has an existing application pattern for supply ordering that may be reusable.

Long term, imagine:

- inventory counts,
- reorder thresholds,
- sell-through,
- product profitability,
- retail attachment,
- order history,
- recommended order,
- UVALUX catalogue linkage,
- one-click draft order,
- rep-assisted order,
- seasonal stocking suggestions.

A salon seeing:

> "You are likely to run out of Product X in eight days"

could immediately see:

> **Add to UVALUX order**

That creates genuine operational utility while reducing friction in UVALUX's core business.

Keep customer interest first. Recommendations should be explainable and useful, not disguised advertising.

---

# 22. Coaching and Customer Success

UVALUX already invests in training.

Software can help identify where that training has the highest impact.

Potential signals:

- low membership conversion,
- declining retail attachment,
- unusual cancellation rate,
- low equipment utilization,
- poor repeat visitation,
- staff performance variance,
- weak adoption of a newly installed service.

Potential actions:

- recommend training module,
- schedule coaching,
- generate playbook,
- contact UVALUX rep,
- show best-practice benchmark.

The platform could eventually become a digital extension of UVALUX's existing training relationships.

---

# 23. Broader Wellness Strategy

Do not hard-code the product concept around UV tanning alone.

UVALUX already participates in adjacent categories including sunless tanning and wellness equipment, and its public catalogue includes red-light-oriented equipment and other spa/wellness technologies.

Competitors such as SunLync also explicitly position themselves across tanning, spa, wellness, and fitness.

Therefore the architecture and UX language should allow a business to operate combinations such as:

- UV tanning,
- spray tanning,
- red light,
- blue light,
- HydroMassage,
- body contouring,
- infrared/wellness equipment,
- beauty services,
- recovery services,
- membership wellness concepts.

Tanning is the beachhead, not necessarily the ceiling.

---

# 24. Product Positioning

Avoid positioning the concept as:

> "A cheaper TanTrack."

Avoid:

> "AI tanning POS."

Avoid:

> "UVALUX's appointment software."

Explore positioning closer to:

> **The operating system for modern tanning and wellness businesses.**

And, for UVALUX:

> **The intelligence layer for the dealer network.**

Potential working brand territories include concepts such as:

- UVALUX OS,
- UVALUX Intelligence,
- UVALUX One,
- UVALUX Business,
- UVALUX Studio,
- a standalone product "powered by UVALUX."

Do not lock the specification to any of these names. Fable may propose stronger naming architecture.

---

# 25. Personas

Fable should refine these into useful product personas rather than stereotypes.

## Persona A: Owner-Operator

Often works in the business and on the business.

Needs:
- a fast picture of today's operations,
- revenue visibility,
- staff accountability,
- memberships,
- marketing without agency overhead,
- inventory awareness,
- fewer manual tasks.

Emotional goal:
> "Tell me what needs my attention."

## Persona B: Multi-Location Owner

Needs:
- comparison across locations,
- centralized settings,
- portfolio KPIs,
- anomalies,
- membership performance,
- staff comparisons,
- regional inventory visibility.

Emotional goal:
> "Show me which location needs intervention."

## Persona C: Front-Desk Staff

Needs:
- speed,
- simple customer lookup,
- check-in,
- room/equipment assignment,
- POS,
- product lookup,
- membership status,
- permissions.

Emotional goal:
> "Help me serve the customer without making me think about the software."

## Persona D: Salon Manager

Needs:
- shift visibility,
- staff goals,
- equipment state,
- inventory,
- daily sales,
- customer issues,
- marketing execution.

Emotional goal:
> "Help me run a clean shift and hit our targets."

## Persona E: UVALUX Sales Representative / Consultant

Needs:
- customer portfolio,
- prioritized opportunities,
- account trends,
- product opportunities,
- coaching context,
- recent changes,
- next-best action.

Emotional goal:
> "Tell me who I should call and why."

## Persona F: UVALUX Leadership

Needs:
- network health,
- aggregate trends,
- regional performance,
- customer risk,
- category growth,
- product demand,
- adoption,
- software ARR,
- strategic insights.

Emotional goal:
> "Show me what is happening across the market we serve."

## Persona G: UVALUX Trainer / Customer Success

Needs:
- identify weak performance,
- segment coaching needs,
- measure improvement,
- provide relevant training.

Emotional goal:
> "Put help where it will matter."

## Persona H: End Customer

Needs:
- convenient booking/check-in,
- transparent membership,
- easy payments,
- reminders,
- rewards,
- low friction.

Emotional goal:
> "Make visiting my salon effortless."

---

# 26. Key User Journeys to Design

Fable should define the best version of these journeys.

## Salon-owner morning

Open app → understand yesterday/today → see three actionable items → execute one.

## Front-desk customer flow

Find customer → understand eligibility/membership → select service/equipment → process/check in → upsell appropriately → complete visit.

## New customer

Profile → waiver/intake → service selection → payment/package/membership → first visit → follow-up.

## Membership conversion

Identify opportunity → present plan → enroll → recurring billing → monitor health.

## Save an at-risk customer

Detect churn signal → explain why → suggest outreach → generate message → track response.

## Fill slow capacity

Detect weak period → propose audience/offer → generate campaign → preview → send/simulate → track bookings/revenue.

## Retail opportunity

Detect low attachment → compare benchmark → suggest staff/product strategy → generate promotion → monitor improvement.

## Inventory reorder

Forecast low inventory → suggest order → review → draft UVALUX order.

## UVALUX rep morning

Open portfolio → see prioritized salons → inspect reason → review recommended action → contact salon / log follow-up.

## UVALUX leadership

Open network view → understand overall health → identify regional/category trend → drill down without violating privacy commitments.

---

# 27. Information Architecture

Fable should invent the strongest structure rather than obey a fixed sitemap.

However, the product will likely need conceptual homes for:

- Today / Home
- Front Desk
- Customers
- Schedule
- Equipment
- Memberships
- Sales / POS
- Inventory
- Marketing
- Insights
- Staff
- Reports
- Settings

UVALUX Intelligence may include:

- Network Overview
- Accounts / Salons
- Opportunities
- Coaching
- Commerce / Product Signals
- Regions
- Benchmarks
- Trends
- Alerts
- Adoption

The final navigation should be simpler than the domain list suggests.

Use progressive disclosure.

A small operator should not feel like they purchased enterprise ERP software.

---

# 28. Dashboard Philosophy

Avoid the classic SaaS dashboard problem:

six KPI cards, four generic charts, and no obvious action.

The dashboard should prioritize:

1. What changed?
2. What matters?
3. Why?
4. What can I do?

Charts should support decisions.

Consider narrative analytics, cards with causality, action queues, "needs attention," comparisons, and opportunities.

The UI should be capable of presenting a sophisticated business without feeling analytical or intimidating.

---

# 29. Design and UX Direction

The product should feel:

- modern,
- warm,
- premium,
- calm,
- fast,
- intelligent,
- visual,
- optimistic,
- operationally serious.

Avoid:

- legacy desktop-software aesthetics,
- dense Windows-style forms,
- endless tables,
- generic Bootstrap admin templates,
- sterile fintech aesthetics,
- excessive gradients or "AI purple" simply to look futuristic,
- a chat interface as the main application shell.

The software should feel at home in a polished modern salon.

Mobile matters, particularly for owners and UVALUX reps.

Front-desk workflows may benefit from desktop/tablet optimization.

Fable should propose responsive priorities by persona rather than pretending every workflow belongs equally on every device.

---

# 30. Delight Opportunities

Look for moments where the product can feel unusually thoughtful.

Examples:

- celebratory milestone for membership growth,
- "you beat your best Tuesday" insight,
- one-click transformation from insight to campaign,
- visual equipment floor status,
- an owner-friendly morning narrative,
- surprisingly good auto-generated social content,
- intelligent default audiences,
- order forecasting that feels magical but explainable,
- benchmarking expressed as opportunity rather than shame,
- sales-rep briefing before a customer call,
- a weekly "what changed in your business" story.

Do not make the product gimmicky.

Delight should mostly come from reducing work and surfacing insight at the right moment.

---

# 31. Existing Reusable Development Patterns

The development environment already contains useful patterns from two applications.

These should be explicitly considered during later implementation.

They are **accelerators, not design constraints**.

## Comp Portal

There are reusable patterns related to:

- social media helper functionality,
- AI helper interfaces,
- content-generation workflows,
- prompt orchestration,
- dashboard/application patterns.

Fable should design the best product experience first.

When producing the handoff to Opus, call out where concepts may map to reusable Comp Portal patterns without assuming they must be copied verbatim.

## Carly Hair Co

There are reusable patterns related to:

- booking,
- scheduling,
- calendar workflows,
- inventory,
- supply ordering,
- customer-management concepts.

Again, use these to reduce unnecessary implementation work, not to constrain product thinking.

The later Opus implementation should inspect the existing applications before rebuilding equivalent patterns from scratch.

---

# 32. First-Build Product Slice

Fable should propose the exact first-build slice, but it should be broad enough to demonstrate the thesis.

At minimum, the first build should convincingly demonstrate several connected loops rather than a collection of disconnected mock screens.

A strong candidate demo dataset could represent:

- one salon,
- multiple equipment/service types,
- customers,
- members,
- bookings,
- visits,
- sales,
- retail products,
- inventory,
- staff,
- marketing history,
- benchmark data,
- and a UVALUX portfolio containing multiple salons.

Suggested first-build demo loops:

## Loop 1: Owner intelligence

Dashboard → morning brief → identify issue → investigate → act.

## Loop 2: Marketing

Insight → create campaign/social content → edit → preview → mark/simulate publish → see outcome.

## Loop 3: Front desk

Customer → booking/check-in → room/service → purchase/membership.

## Loop 4: Inventory/UVALUX

Inventory warning → recommendation → UVALUX reorder draft.

## Loop 5: Network intelligence

UVALUX overview → identify salon needing help → inspect performance → see suggested coaching/sales action.

These loops collectively communicate the entire business thesis.

---

# 33. Demoability Requirements

Every first-build feature should have:

- realistic seeded data,
- sensible empty/error states where relevant,
- clickable interactions,
- no obvious dead ends,
- polished copy,
- clear loading/success behavior where needed,
- coherent navigation,
- meaningful charts/metrics,
- enough state to demonstrate before/after effects.

Do not fake sophistication through static screenshots.

If the build uses simulated data or mocked integration state, make the interaction itself real.

Example:

Campaign publishing can be simulated, but the user should genuinely create, edit, preview, save, and transition the campaign through states.

Equipment can be simulated, but room status, session assignment, and utilization should genuinely change within the demo.

---

# 34. Demo Script for Nick

The product should support a crisp founder-led demonstration approximately along these lines.

## Opening

"This is what a salon owner sees when they open the system."

Show a morning brief with one positive result, one issue, one opportunity.

## Insight to action

Select an underbooked period.

Show why it matters.

Click to generate a targeted campaign.

Generate social/SMS copy.

Preview it.

## Operations

Jump to front desk.

Show active rooms/equipment.

Open a customer.

Check membership/package status.

Show booking/check-in or sale.

## Supply intelligence

Show low inventory.

Generate a proposed UVALUX reorder.

## Switch perspective

Switch to UVALUX Intelligence.

Show the same salon appearing in the dealer network.

Explain:

"You can see who needs coaching, who is thriving, and where there are legitimate opportunities to help."

Show another salon with a different opportunity.

## Close

"This isn't only software UVALUX can resell. It can make UVALUX better at supporting every salon that uses it."

Fable should improve this demo narrative and ensure the product's initial screens support it naturally.

---

# 35. Business Model Hypotheses

Do not treat these as final pricing decisions.

Explore models such as:

## Subscription

Potential positioning may reasonably sit near or above the existing category's roughly US$100 to US$200 monthly pricing because the intended value proposition includes AI, marketing, intelligence, and UVALUX integration.

Possible structures:

- per location,
- tiered by capabilities,
- base + AI/marketing,
- base + payment monetization,
- UVALUX-bundled pricing.

## Reseller / revenue share

UVALUX may:

- resell the software,
- white-label it,
- co-brand it,
- bundle it with equipment,
- include an introductory period with new salon installations,
- share recurring revenue with the development entity.

## Payments

Integrated processing could eventually provide an additional recurring economic layer.

## Messaging

SMS/email usage may become an add-on or bundled allowance.

## Premium intelligence

Multi-location analytics, advanced AI, or benchmarking might support higher tiers.

## Commerce

Software could improve UVALUX product ordering and retention without requiring explicit software margin on every transaction.

The business model should align UVALUX, the software business, and the salon rather than creating incentives to exploit the operator.

---

# 36. Go-to-Market Advantage

A normal startup would need to:

- identify salon owners,
- buy ads,
- cold call,
- attend trade events,
- build credibility,
- convince them to migrate critical business software.

UVALUX already has relationships.

Potential channels include:

- new-salon openings,
- equipment installations,
- sales representatives,
- training,
- existing wholesale relationships,
- events,
- product-order touchpoints,
- customer-success conversations.

A particularly strong wedge may be new salons, where software migration is not required.

Another wedge may be selected existing UVALUX customers who are unhappy with their current systems.

Fable should incorporate onboarding and migration thinking into the product spec even if full migration tooling is not first-build scope.

---

# 37. Migration Matters

Replacing a salon's POS and membership system is high-friction because it may contain:

- customer records,
- waivers,
- payment tokens,
- memberships,
- package balances,
- transaction history,
- appointment history,
- inventory,
- employee permissions,
- equipment setup.

Existing competitors explicitly market migration support.

Therefore:

- new salons are easier early customers,
- existing salons require a credible migration story,
- data import should be anticipated,
- payment-token portability may depend on processors and should not be casually promised.

Fable should identify the migration UX and trust requirements without designing unverified technical guarantees.

---

# 38. Trust, Consent, and Data Governance

The UVALUX intelligence opportunity only works if salons trust it.

Do not design the dealer view as covert surveillance.

The product should make data-sharing terms understandable.

Important principles:

- salon-level operational data belongs to the salon unless contractually agreed otherwise,
- UVALUX access should be explicit,
- benchmarking should be anonymized/aggregated where appropriate,
- salons should understand what is shared,
- sensitive customer-level information should not casually flow into UVALUX sales views,
- access should be role-based,
- actions should be auditable,
- aggregated insights should protect small cohorts from accidental identification,
- privacy choices should not be dark-patterned.

The strategic data moat must be created through value exchange and trust.

---

# 39. Regulatory and Safety Awareness

Tanning businesses can be subject to jurisdiction-specific regulations around age, exposure, waivers, equipment, and operations.

The product specification should acknowledge this category reality without pretending the first build has solved every jurisdiction.

Design for configurable rules rather than hard-coded assumptions.

Do not make medical claims.

Wellness-service marketing and AI-generated copy should avoid inventing unsupported health benefits.

Where safety or compliance workflows are required, the system should prefer clear structured controls and auditability.

---

# 40. Analytics and Metrics

Potential salon-level metrics:

- total sales,
- service revenue,
- retail revenue,
- membership recurring revenue,
- active members,
- joins,
- cancellations,
- failed payments,
- visits,
- new customers,
- repeat rate,
- average spend,
- revenue per visit,
- revenue per member,
- equipment utilization,
- room utilization,
- peak periods,
- retail attachment,
- product sell-through,
- inventory days remaining,
- campaign conversion,
- reactivation,
- staff sales.

Potential UVALUX metrics:

- participating salons,
- active software locations,
- network revenue trend where consent permits,
- customer health distribution,
- adoption,
- category performance,
- equipment utilization patterns,
- retail-category performance,
- inventory/product demand signals,
- churn-risk indicators,
- coaching opportunities,
- expansion opportunities,
- regional trends.

The product should not surface metrics simply because they are measurable.

Fable should identify which metrics drive action.

---

# 41. Success Metrics for the Product Itself

Early discovery:

- Nick understands the value quickly.
- Salon testers understand the product without extensive explanation.
- Owners identify insights they would actually use.
- UVALUX users see practical reasons to open the intelligence view.
- Marketing generation produces content users would edit rather than discard.
- Demo workflows can be completed without facilitation.

Pilot:

- weekly active owner usage,
- daily/weekly dashboard engagement,
- campaigns generated,
- recommended actions accepted,
- booking/check-in workflow completion,
- inventory recommendations acted upon,
- UVALUX rep engagement,
- pilot retention,
- willingness to pay,
- willingness to migrate.

Longer term:

- software ARR,
- revenue per location,
- gross retention,
- net revenue retention,
- payment volume if applicable,
- UVALUX reorder frequency,
- increased product retention,
- measurable salon improvement,
- network coverage,
- benchmark quality.

---

# 42. Risks and Assumptions

Fable should explicitly pressure-test these.

## Risk: Category size

Pure tanning software may be a relatively bounded vertical.

Mitigation:
- exploit UVALUX distribution efficiency,
- monetize deeply rather than requiring enormous logo count,
- design toward wellness adjacencies.

## Risk: Incumbent feature depth

Legacy competitors may look dated but contain decades of edge cases.

Mitigation:
- do not confuse modern UX with domain completeness,
- prioritize migration and category-specific workflows,
- work closely with real salon operators.

## Risk: Hardware integration

Bed/timer integration can be specialized.

Mitigation:
- model equipment correctly early,
- simulate in first build,
- validate integration paths before promises.

## Risk: Payment migration

Recurring membership tokens can make switching painful.

Mitigation:
- investigate processor portability,
- target new salons initially,
- build a migration playbook.

## Risk: Dealer-data trust

Salons may resist supplier visibility.

Mitigation:
- explicit consent,
- privacy-safe aggregation,
- tangible value returned to salons,
- clear separation between coaching insight and customer-level private data.

## Risk: AI novelty

AI-generated content can become generic and ignored.

Mitigation:
- ground suggestions in real salon context,
- connect insight to action,
- let users control tone/offer/audience,
- measure usefulness.

## Risk: Overbuilding

The opportunity invites an enormous feature list.

Mitigation:
- first build demonstrates a few complete loops,
- preserve a clear "not yet" roadmap.

---

# 43. What Not to Build First

Unless Fable identifies a compelling reason otherwise, avoid making first-build success depend on:

- every possible payment processor,
- production EFT migration,
- every timer/hardware integration,
- automated bookkeeping,
- full payroll,
- complete loyalty engine,
- advanced ad buying,
- native iOS and Android apps simultaneously,
- complex warehouse management,
- full enterprise franchise governance,
- medical/health recommendations,
- every Canadian/US regulatory permutation.

Represent the future honestly while shipping enough vertical specificity to make the concept credible.

---

# 44. Roadmap Shape

Fable should propose its own roadmap, but a useful strategic progression is:

## Phase 0: Product discovery and clickable/buildable vision

Validate:
- owner dashboard,
- intelligence model,
- key workflows,
- marketing concept,
- UVALUX network view.

## Phase 1: Demoable integrated product

Real interactive application using realistic demo data.

Core connected loops:
- owner intelligence,
- front desk,
- basic scheduling,
- customer/member,
- inventory,
- social marketing helper,
- UVALUX network intelligence.

## Phase 2: Pilot foundation

Prepare for selected real salons:
- authentication,
- tenant isolation,
- reliable data,
- core POS/membership requirements,
- operational permissions,
- import strategy,
- selected integrations.

## Phase 3: Tanning operational depth

- timer/hardware,
- maintenance,
- EFT/payments,
- migrations,
- robust reporting,
- customer portal,
- multi-location.

## Phase 4: UVALUX network effects

- benchmarking,
- coaching,
- product forecasting,
- commerce integration,
- portfolio intelligence,
- broader salon cohort data.

## Phase 5: Wellness expansion

- richer service/resource scheduling,
- additional equipment categories,
- broader wellness membership models,
- expansion beyond traditional tanning operators.

---

# 45. Competitive Product Opportunity

The product should not attempt to win solely because incumbent interfaces look old.

The deeper differentiators should be:

1. **UVALUX distribution**
2. **Dealer-network intelligence**
3. **Benchmarking**
4. **Insight-to-action workflows**
5. **AI grounded in operating data**
6. **Integrated marketing**
7. **UVALUX commerce/supply connection**
8. **Modern owner experience**
9. **Wellness expansion**
10. **A product designed around coaching and business improvement**

A competitor can redesign a dashboard.

It is harder to reproduce a trusted supplier relationship, network data, product catalogue integration, training infrastructure, and distribution channel.

---

# 46. Discovery Questions for Nick

The early conversation with Nick should be practical.

Questions worth validating:

- Approximately how many active business customers does UVALUX currently serve?
- How many are tanning salons specifically?
- How many are multi-location?
- How many new salon openings does UVALUX participate in annually?
- Which salon-management platforms appear most often among UVALUX customers?
- Which does UVALUX currently recommend, formally or informally?
- What software complaints does the sales/support team hear most frequently?
- Does software ever interfere with equipment installation or support?
- How often do salons ask UVALUX for business coaching?
- Which salon performance metrics would UVALUX leadership most want to understand?
- What would a rep want to know before calling a customer?
- What signals indicate that a salon may be struggling?
- What signals indicate a salon is ready for new equipment?
- How important is product reordering friction?
- What data would UVALUX consider valuable for forecasting?
- Would UVALUX want to brand the software, co-brand it, or simply resell it?
- Would Nick prefer UVALUX to invest, partner, license, or revenue-share?
- Would UVALUX be willing to introduce several trusted salon owners for discovery interviews?
- Could a new-software package be bundled into new salon openings?
- What privacy boundaries would Nick consider essential between UVALUX and salon operational data?

Do not ask all questions mechanically in one meeting. Use them to understand the shape of the opportunity.

---

# 47. Discovery Questions for Salon Owners

- What software do you use?
- What do you love?
- What do you tolerate?
- What do you hate?
- What still lives in spreadsheets?
- What do staff regularly get wrong?
- What does month-end reporting require?
- How are memberships managed?
- How are failed payments handled?
- How do you market today?
- How much time does content creation consume?
- How do you know whether marketing worked?
- How do you reorder retail products?
- How do you know what to stock?
- How do you measure bed/equipment utilization?
- How do you track maintenance/lamp hours?
- What do you wish UVALUX knew before calling?
- What data would you be comfortable sharing in exchange for benchmarking?
- What would make you switch systems?
- What would prevent you from switching?
- What would you pay for a system that materially improved the business?

---

# 48. Research Notes: Verified Public Facts

The following context has been checked against current public sources and may be treated as grounded starting information.

## UVALUX

UVALUX publicly states that it is Canada's largest wholesale distributor in its industry and has been operating for more than four decades.

It supports business owners through product/equipment distribution, technical service, training, salon planning, pricing, EFT membership guidance, and marketing-related support.

Its "Start Your Own Canadian Tanning Salon" materials explicitly include **Salon Management Software** as part of the process.

That page currently tells owners that several POS/salon software options are available and recommends comparing products.

UVALUX publicly presents equipment and services beyond conventional UV tanning, including sunless and wellness-oriented categories.

## Tan-Link

Current public pricing observed during research:
- Essential: US$129/month
- Ultimate: US$179/month
- Pro: US$199/month, or lower effective monthly cost on annual billing

Its public feature set includes tanning-specific timer/equipment integration and other category-specific workflows.

## SunLync

Current public positioning:
- starts at approximately US$150 for a single location,
- supports tanning, spa, wellness, and fitness,
- includes multi-location, memberships/EFT, equipment control, reporting, marketing, inventory, and related workflows.

## TanTrack

Current public pricing:
- Starter: US$99.99/month
- Bundle: US$129.99/month per location
- Pro/Multi-location: contact sales

TanTrack publicly claims over 5,000 salons and "1 in 3 salons." Treat those as vendor marketing claims unless independently verified.

## Helios

Helios publicly states that it was founded in 1988.

Its current Version 12 product remains a Windows-oriented salon POS with enterprise/multi-location functionality.

Public monthly pricing was not sufficiently clear in this research to include a number.

---

# 49. Research Sources for Fable / Future Verification

Current public pages used for grounding:

- UVALUX homepage: https://uvalux.com/
- UVALUX salon-starting guide: https://uvalux.com/start-your-own-canadian-tanning-salon/
- UVALUX red-light equipment category: https://uvalux.com/product-category/equipment/wellness/red-light/
- Tan-Link pricing: https://tan-link.com/pricing/
- SunLync: https://sunlync.com/
- SunLync features: https://sunlync.com/features/
- TanTrack pricing: https://www.tantrack.com/tantrack-pricing/
- TanTrack overview: https://www.tantrack.com/
- TanTrack equipment control: https://www.tantrack.com/run-your-business/equipment-control/
- Helios software: https://www.gohelios.com/software.html
- Helios company history: https://www.gohelios.com/about.html

Re-check current pricing, product capabilities, regulations, and integration support before making contractual or implementation commitments.

---

# 50. Required Fable Deliverable

Produce a **complete product specification and UX vision** for the first build and the product beyond it.

The deliverable should include at minimum:

## Product framing
- concise vision,
- category,
- value proposition,
- strategic moat,
- salon value,
- UVALUX value.

## Personas
Refine the personas in this brief and define their goals, context, frequency of use, anxieties, and jobs to be done.

## Product principles
Create clear design and product principles that Opus can use to resolve ambiguous implementation decisions later.

## Information architecture
Define the navigation and conceptual model for both:
- salon-facing application,
- UVALUX Intelligence.

## Screen inventory
List the key screens/states and their purpose.

## User journeys
Design the highest-value end-to-end workflows.

## First-build scope
Clearly separate:
- must be real and interactive,
- may be simulated but interactive,
- represented for future,
- explicitly out of scope.

## Dashboard and intelligence system
Define:
- morning brief,
- metrics,
- alerts,
- opportunity detection,
- action patterns,
- drill-down behavior.

## Marketing studio
Define a rudimentary but polished first-build social-media creation workflow.

## Dealer-network intelligence
Define the UVALUX view as a real product experience, not an admin console.

## Benchmarking
Describe how cohorts, comparisons, privacy, actions, and opportunity framing work.

## Inventory and supplier workflow
Design how operational inventory could lead naturally to UVALUX supply ordering.

## Front-desk experience
Define enough operational detail to make the first build believable in the tanning category.

## Booking and scheduling
Define the appropriate first-build flow and longer-term direction.

## Membership experience
Define core membership health, conversion, cancellation, and payment-state concepts.

## Equipment experience
Define the visual/interaction model, including how simulated equipment works in the first build.

## AI
For each important AI capability, specify:
- trigger,
- context,
- output,
- user control,
- explanation,
- resulting action.

Avoid generic "AI assistant" requirements.

## Mobile
Define which workflows deserve first-class mobile experiences.

## Design system direction
Describe:
- mood,
- visual hierarchy,
- density,
- typography approach,
- layout behavior,
- motion principles,
- states,
- interaction personality.

Do not over-specify arbitrary pixels unless needed.

## Demo design
Create the best possible demo path for Nick.

## Roadmap
Define what follows the first demoable build.

## Success criteria
Define how we know the product concept is working.

## Risks
Identify assumptions that should be tested with Nick, UVALUX staff, and salon operators.

## Handoff to Opus
End with a section written specifically for Opus that converts the product specification into clear implementation priorities while explicitly reminding Opus to inspect reusable patterns in:
- Comp Portal,
- Carly Hair Co.

---

# 51. Final Instruction to Fable

Do not optimize for the easiest software to build.

Do not optimize for the largest number of features.

Optimize for a product that makes the strategic opportunity obvious.

The first build should make three people immediately understand three different values:

**Salon owner:**
> "This would genuinely help me run my business."

**UVALUX representative:**
> "This tells me exactly how to help my customers."

**Nick:**
> "This could become a meaningful new layer of the UVALUX business."

Use this brief as context, not a cage.

Invent.

Simplify.

Challenge assumptions.

Create a product with enough category depth to be credible, enough design quality to be exciting, enough intelligence to be differentiated, and enough first-build completeness to be tested rather than merely admired.
