# Bask / Compass — Design & UX Specification
## Fable design pass. Companion to PRODUCT_SPEC.md (what/why) and IMPLEMENTATION_SPEC.md (how).

**Version:** 1.0 — 2026-08-07
**Acceptance bar:** the five mockups in `/mockups` are the visual standard for M1. Built screens must hang together with them — same warmth, same hierarchy, same restraint. `mockups/tokens.css` is the seed of `packages/tokens`; lift it, don't re-derive it.

Mockups (screenshot before/after any visual change; PNGs alongside):

| # | File | Surface | Viewport |
|---|---|---|---|
| 01 | `01-today-daybreak.html` | Today / Daybreak (owner web) | 1440 |
| 02 | `02-floor.html` | The Floor — room board + check-in panel | 1440 |
| 03 | `03-studio.html` | Studio — campaign review step | 1440 |
| 04 | `04-compass-call-list.html` | Compass — Call List (dark) | 1440 |
| 05 | `05-mobile-daybreak.html` | Bask Mobile — Daybreak | 390 |

---

# 1. The design idea in one line

**Bask reads like a morning letter and operates like a cockpit.** Owner surfaces are editorial — serif narrative first, evidence second, actions always visible. Operational surfaces (Floor, POS) are compact, instant, and unadorned. Compass is the same system in evening light. The tension between "warm letter" and "serious instrument" IS the brand; never let one leak into the other.

# 2. Design system rules (binding)

## 2.1 Tokens
`mockups/tokens.css` is authoritative. Key decisions locked there:
- **Paper** warm ivory `oklch(98.2% .004 84)`, **ink** `oklch(21% .012 320)` — never pure white/black.
- **Primary** terracotta `oklch(58% .14 42)`; hover state = `--primary-deep`. One accent. Gold `oklch(72% .084 85)` is for eyebrows/membership only — never buttons.
  *(Amended 2026-08-07 during M0: primary was `60% L` in the original mockups and measured 4.18:1 against white button labels — short of WCAG AA's 4.5 at 13px/600. Dropped to `58% L` → 4.54:1. `--ink-faint` 56%→55% and Compass `--c-ink-faint` 58%→64% for the same reason. Visually indistinguishable; mockups re-rendered. The automated contrast gate in `packages/tokens` now passes these pairs without waiver — four waivers remain, all for mockup-literal `--<semantic>` on `--<semantic>-wash` pairings that components supersede with `--*-on-wash` label tokens.)*
- **Sunset gradient** (`--grad-sunset`) is sacred and scarce: session rings, Studio graphic canvas, one brand moment per screen max. It is the brand's signature, not a decoration.
- **Semantic washes** (`--warn-wash`, `--success-wash`, `--risk-wash`) for chips/flags — never saturated fills on large areas.
- Radius 1rem base; cards `--radius-lg` (1.4rem). Shadows are the Carly two-layer soft pair — no hard drop shadows anywhere.
- **Compass tokens** (`--c-*`): warm charcoal `oklch(19.5% .012 50)`, amber `oklch(79% .125 78)`. Amber primary buttons carry dark text (WCAG). Compass never uses terracotta; Bask never uses Compass amber. The palettes are how you know which product you're in.

## 2.2 Typography
- **Fraunces** (display): screen titles, Daybreak narrative, Studio "Here's your campaign," Compass greeting. Weight 500, tight letter-spacing (−0.012 to −0.015em). *Italic Fraunces in terracotta/amber* is the "emphasis word" move (`8% above`, `Three calls`) — exactly one per headline, never more.
- **Inter** (body/UI): everything else. Semibold 600 for names/values/buttons, 400 for prose. Numbers always `font-variant-numeric: tabular-nums` (class `.num`).
- The Bask wordmark is italic Fraunces 600. Compass wordmark same, with an UPPERCASE gold-amber "UVALUX" sub-lockup.
- No third typeface. (Carly's Grand Hotel script may appear inside generated campaign graphics only — it is content, not UI.)

## 2.3 Density modes
- **Relaxed** (Today, Studio, Insights, Customers detail, Compass): base 14.5px, card padding 20–24px, generous section gaps.
- **Compact** (Floor, POS, lists, Call List evidence tiles): base 13px, padding 16px, tighter line-height. Compact ≠ cramped — whitespace shrinks, hierarchy doesn't.

## 2.4 Motion (restraint is the style)
- Daybreak attention cards stagger in 40ms apart, 220ms `--ease-out`, translate-y 8px + fade. Once, on load — never on tab return.
- Session countdowns tick via opacity crossfade on the seconds digit only. Room state changes crossfade 220ms.
- `.in-session-ring` shimmer (3.5s loop) is the ONLY perpetual animation in the product. Everything else settles and stops.
- Buttons: background 150ms; `:active` translate-y 1px. Focus rings appear instantly, never animated.
- One celebration allowed (membership milestone) — subtle, ≤1.5s, never confetti-cannon.
- `prefers-reduced-motion`: ring static, staggers collapse to ≤150ms fades.

# 3. Screen anatomies (build to these)

## 3.1 Today / Daybreak — mockup 01
Grid: `minmax(0,1fr) 320px`, max-width 1180, single scroll.
1. **Topbar** (sticky, glass): italic wordmark · pill nav (active = paper-2 pill) · salon name · avatar. Nav is the whole app's chrome — no sidebar in Bask.
2. **The letter**: gold eyebrow `DAYBREAK · <date>` → Fraunces display headline (≤3 lines, one italic terracotta emphasis) → 1–2 sentence sub-prose, 58ch max. This block owns the top-left; nothing competes with it.
3. **Attention queue** (≤5): white cards, 4px severity rail (amber/green) fused to left edge, title 16px semibold, evidence sentence with **bold facts**, impact chip (`≈ $640/mo if it holds` — terracotta wash; opportunities green), optional sparkline (amber stroke, no axes). Right column of actions, fixed order: **Fix this** (primary) / **Show me why** (quiet) / **Dismiss** (ghost). Buttons never move between cards.
4. **Right rail**: "Today so far" pulse card (label/value rows, hairline dividers, green "on pace" whisper) · "Next up" bookings (time · name · service · confirm dot) · Weekly Story teaser (dashed border + small gradient tile — the one brand moment).
Choreography: *Fix this* navigates to Studio with a context banner (3.3); *Show me why* expands evidence inline (chart + contributing factors) pushing content down, never a modal; *Dismiss* = card collapses 220ms, toast with Undo.

## 3.2 The Floor — mockup 02
Layout: `1fr 372px`. Compact density.
1. **Topbar**: wordmark · segmented tab pill (Room Board / Check-in / POS / Schedule) · scanner-ready whisper (`Scanner ready — scan any product`) · live clock. The scanner whisper doubles as the wedge-listener status light.
2. **Room board**: 4-col grid of room cards, min-height 132px. Anatomy: uppercase equipment type (11px, letterspaced) → room name 16px semibold → state zone. States: **Ready** = green wash chip · **In session** = `.in-session-ring` gradient rim + 31px tabular countdown + customer first name · **Cleaning** = amber chip with minutes · **Maintenance** = clay chip. The ring is the only color-loud element — the board reads at a glance from across a counter.
3. **Check-in panel** (elevated, `--shadow-pop`): customer header (initials avatar in terracotta wash, name 19px, gold membership badge with dot) → 2×2 meta grid (last visit / visits / package n-of-m / session-timing verdict, verdict colored) → flags (amber wash, plain language, tells staff the 30-second fix) → upsell hint (paper-2 wash, ✦, product bolded — dismissible, never blocks) → SERVICE pill row (selected = terracotta wash+border) → READY ROOMS row → full-width **Start session — KBL 6800 Alpha Pearl · 12 minutes** (button states the outcome, not "Submit").
Choreography: customer search replaces panel content instantly (<100ms perceived); scan anywhere → context-routed toast; on Start, panel clears and the room card flips to ring+countdown in one 220ms crossfade — that flip IS the product moment, rehearse it in the demo.

## 3.3 Studio (campaign review) — mockup 03
1. **Topbar**: breadcrumb `Marketing · New campaign` + step tracker (✓ done green / current terracotta pill / future faint).
2. **Context banner**: card with 10px gradient bar — `**Fixing: quiet Tuesday afternoon.** <evidence sentence>` + "Why this offer" quiet button. Insight→action provenance stays visible the whole flow.
3. **Working headline**: Fraunces "Here's your campaign. Change anything." + tone pills (Warm/Fun/Straight-talk; switching regenerates all pieces, selection persists per salon).
4. **Output columns** `1.15fr 1fr 300px`: **Instagram card** (square canvas: sunset gradient bg + dark scrim from bottom + Fraunces white headline ≤12ch + white offer badge; caption below with handle bolded; ↻ Regenerate per card) · **Text message** (paper-2 chat bubble ≤40ch, char count + credit count, consent note under a dashed rule: "Goes to 43 people who agreed to texts. Nothing sends until you press Schedule." — trust copy is part of the design) · **Email subject** as a labeled line.
5. **Right rail**: Audience card (count huge 31px, plain-English segment description, criteria chips) · Schedule card (send / valid / tracked rows) · **Schedule campaign** full-width primary · whisper: "You'll see bookings and revenue from this campaign on Today."
Choreography: every text region is inline-editable (click → edit-in-place, no modals); Regenerate replaces only its card with 300ms crossfade; guardrail violations (discount cap) surface as amber inline note with a one-tap fix, never a blocking dialog.

## 3.4 Compass Call List — mockup 04
Layout: 216px sidenav + main (max 980). ALL Compass tokens.
1. **Sidenav**: Compass/UVALUX lockup · 5 items (active = card-bg pill) · rep identity bottom.
2. **Greeting**: Fraunces "Thursday. *Three calls* worth making." (italic amber emphasis) + rationale line + portfolio pulse strip (dot · count · label; total right-aligned).
3. **Call cards**: salon name 19px + region whisper + status chip right (amber "Needs attention" / green "Ready to grow" / green "Order in"). **Evidence tile row** (3-up bordered tiles: big tabular number colored by direction + caption — the "reps get evidence, not adjectives" pattern). **Suggested conversation** block: paper-2, 3px amber left border, `**Suggested conversation:**` lead. Actions: amber **Open call brief** (dark text) + outline secondaries + ghost Snooze. Optional footer thread ("Asked for coaching via Bask on Tuesday — *their request, not just our signal*") — the consent/trust story surfacing inside the rep's own tool.
Choreography: call brief opens as right-side sheet (60%), never navigates away from the list; Log contact = inline form in the card footer; Snooze asks for a duration and remembers.

## 3.5 Bask Mobile Daybreak — mockup 05 (390px, native)
Appbar (wordmark + avatar) → the letter (27px Fraunces, same emphasis rule) → horizontally scrollable pulse chips → stacked attention cards (4px left border severity, two-button row: primary + "Why") → bottom tab bar (Daybreak ☀ / Pulse / Scan / Campaigns; active = terracotta). Everything thumb-reachable; actions are the same verbs as web, shortened, never new ones. Compass Mobile reuses this skeleton with Compass tokens: greeting → portfolio pulse → call cards.

# 4. Component vocabulary (names Opus should use)

`InsightCard` (rail, title, evidence, impact chip, sparkline, action column) · `PulseCard` / `PulseChip` · `RoomCard` (+ `SessionRing` wrapper) · `CheckinPanel` · `ServicePill` / `SelectablePill` · `StatusChip` (semantic wash + text) · `ImpactChip` · `EvidenceTile` (Compass) · `SuggestBlock` (Compass) · `ContextBanner` (Studio) · `TonePills` · `OutputCard` (channel header + regenerate) · `GuidedTooltip` (`<Guided>`) · `StatRow` (label/value/hairline) · `WhisperNote` (the small trust/consequence lines — a first-class component, they appear everywhere) · `GapSlider` (Peers: draggable target %, live $-impact recompute — terracotta track, tabular output) · `SignaturePad` (waiver canvas: hairline border card, "Sign with your finger" prompt, Undo, never a modal-in-modal) · `HandoffCard` (Shift Handoff: `StatRow` stack + annotation line) · `ComparisonCard` (two locations, delta chips using semantic washes).

All of these consume the ONE typed `Evidence` schema from `packages/core` wherever they show evidence — data model and UI props never diverge (IMPLEMENTATION_SPEC §2).

# 5. Copy voice on-screen (extends IMPLEMENTATION_SPEC §3)

- Headlines talk to you by name and state the finding, not the feature ("Yesterday finished 8% above your usual Thursday" — never "Dashboard").
- Buttons state outcomes: "Start session — KBL 6800 Alpha Pearl · 12 minutes", "Send recovery messages", "Create a Tuesday promo". Banned: Submit, OK, Confirm, Execute.
- Consequences appear as whispers at the point of action ("Goes to 43 people who agreed to texts").
- Evidence sentences bold the numbers, keep the prose plain: "**21% to 15%** over three weeks — mostly on Tuesday and Thursday evening shifts."
- Compass speaks about salons in third person with respect; "their request, not just our signal" is the register.

# 6. What the mockups deliberately don't show (don't invent it during build)

Empty states, loading skeletons, error states — designed per IMPLEMENTATION_SPEC Guidance Layer rules (teaching empty states, human errors), same tokens, before M1 exit. Dusk/Linen themes — token swaps validated by the automated contrast check, mocked only if a demo needs them. POS, Insights/Peers, Network map — follow the vocabulary here (Peers gap card = `InsightCard` with a percentile band; POS = compact density + `ServicePill` grid + cart list of `StatRow`s).

*Slop-test note (Hallmark): 5/5 screens pass — no invented marketing metrics (all figures are the seeded demo fixtures from PRODUCT_SPEC §20), no fake browser/phone chrome, no purple-AI wash (sunset gradient is brand-sourced from Carly), one accent per product, tags stacked vertical, buttons single-line at 320–1440px.*

## The two-audience rule (owner directive, 2026-08-26) — READ BEFORE DESIGNING ANY SURFACE

Bask and Compass serve different people and must not look or read the same.

**Bask — the salon owner. Non-technical, always.**
- Every insight reads as a sentence a salon owner would say out loud. Never a statistician's sentence.
  "Most first-timers never come back" — not "second-visit conversion is 60.0% (n=6,184, de-censored)".
- **No p-values, no sample sizes, no confidence intervals, no method names on screen.** Ever.
- Every number is **actionable** — it comes with the thing to do about it, not just the fact.
- **Click-through provenance is mandatory.** Any figure can be opened to see what it came from —
  which visits, which customers, which sales. The owner never has to trust us; they can look.
  Provenance is a drill-down into their own records, NOT a methodology note.
- The statistics still have to be right. They just never surface. Rigour underneath, plain speech on top.

**Compass — the UVALUX rep. More technical is allowed; the subject is still the relationship.**
- A rep may see precision an owner should not. But Compass is about **customer relationships,
  marketing and sales** — not about data.
- Every screen answers "what do I say to this account, and why now?" — never "here is the analysis".
- Do not put the weeds in front of a rep. A signal is a reason to call someone.

When a surface could serve either, ask which person is holding the screen and design for that one.
