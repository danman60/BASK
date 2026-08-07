# Bask / Compass — Implementation Specification
## Fable → Opus. Engineering blueprint for the product defined in `PRODUCT_SPEC.md`.

**Version:** 1.0 — 2026-08-07
**Status:** Authoritative implementation spec. Where this document and PRODUCT_SPEC.md conflict on *what/why*, PRODUCT_SPEC wins. On *how*, this document wins. Ambiguity → resolve with PRODUCT_SPEC Part III principles, in order.

**New requirements folded in since PRODUCT_SPEC v1.0 (from Daniel):**
1. Native **iPhone + Android apps** in addition to web app and front-desk surface.
2. **Real tanning-hardware integration** path (no proprietary SDKs/APKs available — design for protocol-level integration behind an abstraction).
3. **Barcode scanning** for supply/product management and **per-customer product tracking** (no official SKUs yet — internal SKU system + real-world UPC capture).
4. Users are largely **non-technical** — the product needs a first-class guidance layer: tooltips, plain language, teaching empty states.
5. **Default theme = Carly Hair Co's Instagram-luxe aesthetic**, adapted; **multiple themes** available via a CompPortal-style theme system.

---

# 0. Demo-First Mandate (read before everything else)

**The first job of this application is to win over a stakeholder.** Nick's 12 minutes decide whether this becomes a business. Therefore the demonstration layer is not scaffolding to strip later — it is a first-class, engineered subsystem, built from the ground up, and every M0–M2 decision optimizes for demo excellence first, production-readiness second. Production passes (auth hardening, tenancy verification, real integrations) begin at M3, *after* official pickup. Do not spend M0–M2 effort gold-plating anything a demo can't show.

## 0.1 The Demo Harness (a named subsystem in `packages/core` + a presenter UI)

- **Demo dataset as a product asset:** the §20 story-arc fixtures live in `packages/db/fixtures/`, deterministic from a seed, versioned, reviewed like code. The dataset IS the pitch — its arcs must land the demo beats naturally.
- **Demo clock** (§1.4): advance day/week, synchronous pipeline rerun, one-command reset to day-zero.
- **Presenter Panel:** hidden control surface (hotkey, e.g. ⌘⇧D — invisible to normal use) exposing: clock advance/reset · role switch (Owner / Front desk / UVALUX rep / Leadership) · **scenario bookmarks** · theme switch · "seed a walk-in" (spawns a customer arriving now, for live Floor demos) · **"fire push"** (sends a real push notification to the demo phone — e.g. "Campaign results are in: 9 bookings" — the phone buzzing in Nick's hand mid-pitch is a scripted beat, see PITCH.md).
- **Scenario bookmarks:** one-click jumps to pre-staged demo states — *Morning brief fresh* · *Tuesday campaign ready to send* · *Campaign results in* · *Inventory low-stock moment* · *Compass call-list morning* · *Consent-tier flip*. Bookmarks = named demo-clock positions + UI deep link, so a fumbled live demo recovers in one keystroke, and any segment of the pitch can be rehearsed in isolation.
- **Guided demo path (optional overlay):** presenter-only breadcrumb hints ("next: open the Tuesday card") driven by the pitch script — Daniel never has to memorize click order under pressure. Toggleable; audiences never see it.
- **Demo-safe guarantees:** no live external calls that can fail on stage (AI generations for scripted beats pre-warmed on clock advance, live-generation reserved for the "edit one line" proof moment); airplane-mode-tolerant mobile demo (local cache of Daybreak/Call List); `demo:verify` command runs the full pitch path headlessly via QA agent and fails loudly before any meeting.
- **Every feature merged in M0–M2 answers:** *which pitch beat does this serve, and which bookmark exercises it?* If no answer — defer it.

## 0.2 Pitch materials ship with the product

`docs/pitch/PITCH.md` (script, timed, mapped to bookmarks) and the deck content live in-repo and version with the build. When the demo changes, the pitch changes in the same PR. Deck render (HTML/PDF) generated from that content on demand.

---

# 1. Platform Architecture

## 1.1 Shape: one monorepo, three clients, one brain

```
uvalux-platform/                    (pnpm + Turborepo)
├── apps/
│   ├── web/            Next.js 16 (App Router) — Bask owner surfaces, The Floor
│   │                   (front desk, installable PWA), Compass web. React 19,
│   │                   Tailwind v4, shadcn/Base UI, framer-motion.
│   └── mobile/         Expo (React Native, TypeScript) — ONE app binary,
│   │                   role-switched: Bask Mobile (owner) + Compass Mobile (rep).
│   │                   expo-camera (barcode), expo-notifications (push).
│   └── bridge/         "Bask Bridge" — small Node service for on-prem hardware.
│                       Created at M4, NOT scaffolded in M0 (an empty app is
│                       monorepo noise; the driver interface lives in core).
├── packages/
│   ├── core/           Domain types, insight rules engine, demo clock, consent
│   │                   filter, metric baselines. Pure TS, zero UI deps —
│   │                   runs on server, web, and mobile identically.
│   ├── api/            tRPC routers + zod schemas (single API for web + mobile).
│   ├── db/             Prisma schema, migrations, seed/fixture generators.
│   ├── tokens/         Design tokens + theme definitions (CSS vars + RN
│   │                   equivalents generated from one source).
│   └── ui/             Shared web components (cards, insight card, tooltip/
│                       guidance primitives, chart wrappers).
```

**Why:** Carly and CompPortal prove the Next.js + Supabase + tRPC + Prisma pattern in this environment; reuse is lift-and-adapt, not rewrite. tRPC gives the Expo app the same typed API as web for free. `packages/core` keeps the insight engine and demo clock isomorphic — the same rules that write Daybreak on the server power previews and tests.

## 1.2 Backend

- **Supabase**: the **shared CC&SS project** (`supabase-CCandSS` — per Daniel 2026-08-07; no dedicated project for now). All tables live in a dedicated Postgres schema **`bask`** (Prisma multi-schema), zero footprint in `public` or other apps' schemas. Postgres, Auth, Storage (salon assets/logos/photos), **Realtime** (room-board state, Floor updates). Migrating to a dedicated project later = pg_dump of one schema — cheap by design.
- **tRPC + Prisma** per CompPortal conventions (routers in `packages/api`, Prisma client in `packages/db`). Adopt CompPortal's RBAC-in-router middleware pattern (their suite-34/35 tests show the shape).
- **Multi-tenancy from day one, cheaply:** every table carries `salon_id` (and `org_id` for future multi-location); RLS policies written at schema time even though the demo runs one seeded tenant + role switcher. Retrofit tenancy is the classic trap — schema pays the cost now, auth hardening waits for M3.
- **AI layer:** one server-side `ai/` module wrapping the Anthropic API. One env var (`AI_MODEL`, sonnet-class default) + an in-code per-call override map (haiku-class for classification/short ops). Do not build a per-capability config surface until real cost data exists. Every generation call logs prompt-context hash + output for the usefulness metrics in PRODUCT_SPEC §22. Guardrails (no medical claims, discount caps) enforced as post-generation validators, not just prompt asks.
- **Jobs:** insight-engine sweep + Daybreak generation run as scheduled functions (Supabase cron / Vercel cron) against the demo clock's "current" day. Demo clock advance triggers the same pipeline synchronously.

## 1.3 Clients and what runs where

| Surface | Runtime | Notes |
|---|---|---|
| Bask owner web (Today, Customers, Marketing, Inventory, Insights, Settings) | `apps/web` | Responsive; phone-usable but native app is the flagship phone experience. |
| **The Floor** (front desk: room board, check-in, POS, schedule) | `apps/web` route group `/floor`, **installable PWA** | Fullscreen kiosk-ish mode, desktop/tablet. Reuse CompPortal `InstallPrompt` pattern. Global scan listener (§6). Optimistic UI + Realtime reconciliation. |
| Compass web (Network, Accounts, Signals, Coaching) | `apps/web` route group `/compass` | Fixed dark theme (§7). |
| **Bask Mobile** (owner): Daybreak, pulse, insight actions, campaign approve/edit, inventory alerts + **camera barcode receiving**, push | `apps/mobile` | The owner's morning lives here. |
| **Compass Mobile** (rep): Call List, call briefs, account cards, log contact | `apps/mobile` same binary | Role from auth determines shell. Rep-in-the-truck is phone-first by spec. |

**Mobile strategy:** Expo managed workflow, EAS builds → TestFlight + Play internal track. One app, two role shells — avoids double store-listing overhead now; can split binaries later if UVALUX wants a branded Compass app. NOT a WebView wrapper: Daybreak and Call List are native screens (this is the "phone in Nick's hand" demo). Secondary owner surfaces may embed web views pragmatically (deep screens like full Insights), but the tab-level experiences are native. Front desk is explicitly NOT mobile (PRODUCT_SPEC §18).

## 1.4 Demo clock (P0, restated as engineering)

Virtual clock, not timestamp rewriting: `demo_state` table holds `virtual_today`. All queries in `packages/core` take `today` from a clock provider (virtual in demo mode, real otherwise). `pnpm demo:reset` regenerates fixtures to day-zero; `pnpm demo:advance --days 1` (and an in-app demo-mode control) moves the clock and synchronously runs: campaign-outcome simulation → metric rollups → insight sweep → Daybreak regeneration. Fixtures generate deterministically from a seed so every reset reproduces the story arcs in PRODUCT_SPEC §20.

---

# 2. Data Model (Prisma-level intent — Opus owns final schema)

Core entities and the relationships that matter; naming indicative.

- `Org` → `Salon` → `Room` (type: uv_level1/2/3, stand_up, spray, red_light, hydromassage, …; extensible enum-as-table for wellness expansion) → `Session` (state machine: ready→in_session→cleaning→ready; maintenance flag; started_by, customer, service, duration, equipment_minutes).
- `Customer` (salon-scoped; consent flags; photo optional) → `Membership` (tier, status: active/frozen/cancelled, payment_state) / `Package` (credits, remaining) → `Visit` (check-in event, session link, staff) → `SaleLine` (product/service, qty, price, tender, staff) — **SaleLine is the per-customer product-tracking spine.**
- `Product` (internal SKU auto-generated `BSK-#####`; category; retail price; wholesale link) ↔ `Barcode` (many-to-one: UPC/EAN/Code128/custom label value + symbology) ↔ `UvaluxCatalogItem` (seeded plausible catalogue; real catalogue import later).
- `InventoryLevel` + `StockEvent` (received/sold/counted/adjusted/used_in_session — sell-through and days-remaining computed from events, never stored as truth).
- `Insight` (type, severity, $-impact, evidence, state: new/seen/actioned/dismissed+reason, linked_action, outcome) — first-class per PRODUCT_SPEC. **`evidence` uses ONE typed `Evidence` schema defined once in `packages/core`** — the same shape `InsightCard`, `EvidenceTile`, and Daybreak generation consume (DESIGN_SPEC §4). Do not let the data model and UI props diverge into two shapes.
- `Campaign` (goal, segment snapshot, channels, content versions, state: draft/scheduled/sent/measured, results JSON).
- `Segment` — **fixed coded predicates** (5–6 smart segments: new-this-month, expiring-packages, at-risk, big-spenders, lapsed-30d, midweek-regulars). NOT a stored query AST — that's a multi-session detour deferred until a real user needs a custom segment.
- `GiftCard` (code, balance, purchaser, recipient, state) — sold at POS as a product type, redeemable as a tender type.
- `ActivityEvent` (actor, action, target, timestamp) — feeds the owner-facing activity log; written by discounts, voids, refunds, insight dismissals, consent changes, campaign sends.
- `Staff` (role, permissions, shift patterns).
- `ConsentProfile` (tier: private/benchmarks/coaching; audit log of changes).
- `DraftOrder` + `DraftOrderLine` (reason per line) → surfaces in Compass `AccountTimeline`.
- Compass: `Account` (=Salon + dealer metadata), `SignalSnapshot`, `CoachingRequest`, `ContactLog`, `Playbook`.
- `EquipmentDevice` (room ↔ hardware address, driver type: simulated/tmax/…) — exists from M0 so hardware lands without migration pain (§5).

**Consent filter is code, not queries-remembering-to-behave:** Compass routers read through `packages/core/consent.ts`, which maps salon consent tier → derivable fields (banded trends, never raw transactions, never customer PII). One choke point, unit-tested hard.

---

# 3. UX Implementation: the Guidance Layer (non-technical users)

This is a named subsystem, not sprinkled tooltips. Users are salon owners and front-desk staff, not software people.

1. **Tooltip discipline:** every icon-only control gets a plain-language tooltip; every metric gets an "explain this" popover (what it is, how computed, why it matters — written at ~grade 7 reading level). Build one `<Guided>` primitive in `packages/ui` wrapping shadcn Tooltip/Popover; content keyed into a central `guidance.ts` dictionary so copy is reviewable in one file and reusable on mobile.
2. **First-run tours:** per-surface spotlight walkthroughs (Today, Floor, Studio, Inventory, Compass Call List) — 4–6 steps max, skippable, replayable from a persistent "?" in the header. Driver: lightweight in-house or `driver.js`-class lib; Opus picks.
3. **Teaching empty states:** every list/board empty state explains what will appear, why it's useful, and offers the first action ("No campaigns yet — Bask writes the first draft for you. Try one →").
4. **Plain-language everywhere:** no jargon in UI copy ("Money coming in monthly from memberships," with "MRR" only in the explain-popover). Confirmations state consequences concretely ("This sends a text to 43 people. They're all customers who agreed to texts.").
5. **Undo over confirm** where safe (dismiss insight, remove cart line → toast with Undo via sonner, per Carly), confirm only for outward/irreversible acts (send campaign).
6. **Error states are human:** what happened, what to do, never a stack trace or bare code.
7. **Copy source of truth:** all user-facing strings in the guidance/copy modules, not inline JSX — enables tone review pass before Nick demo and future i18n (Quebec/French is a real UVALUX region; do NOT build i18n now, just don't foreclose it).

Acceptance: a first-time, non-technical tester completes check-in + campaign creation with zero facilitation (PRODUCT_SPEC §22) — the guidance layer is what makes that testable.

---

# 4. Theming: default "Sunset" (Carly IG-luxe), multi-theme system (CompPortal pattern)

## 4.1 System

- **`mockups/tokens.css` IS `packages/tokens` v1** — the first commit is a file copy, not a re-derivation. CSS is the source of truth; add TS/RN theme-object generation only when Expo actually needs it (M2). Do not build source→CSS generation machinery up front.
- Runtime: `ThemeProvider` modeled on CompPortal's `TenantThemeProvider` — CSS vars written at the root, **WCAG-computed foreground pairs** (lift CompPortal's contrast-derivation logic; their day-mode/brand-var lessons are documented in that file — read it), per-salon persisted choice, `next-themes` for light/dark where a theme supports it. Skip CompPortal's feature-flag gating complexity — themes here are a simple per-salon setting.
- Every theme must pass an automated contrast check on the token set before it ships.

## 4.2 Themes at launch

| Theme | Source / character |
|---|---|
| **Sunset** (default) | Direct adaptation of Carly's IG-luxe: warm ivory paper `oklch(98.2% 0.004 84)`, deep ink, IG-sunset gradient accents, glass surfaces, `--radius: 1rem`, Fraunces display + Inter body, gold eyebrows. Swap Carly's IG-pink `#E1306C` primary → Bask amber/terracotta (PRODUCT_SPEC §17) BUT keep the sunset gradient utilities — a tanning brand wearing a sunset gradient is on-the-nose in the best way. **Signature move: Carly's `.in-chair-ring` story-ring shimmer becomes Bask's `.in-session-ring` — rooms currently in session on the Floor board wear the animated gradient rim.** |
| **Dusk** | Dark companion (owner evening use, some salons' vibe): deep warm charcoal, same ambers. |
| **Compass** | Fixed product theme for all Compass surfaces (not user-selectable): inverted deep charcoal + amber per PRODUCT_SPEC. The demo's "different product" costume change. |

Deferred to pilot (M3+): **Linen** (calm minimal, gradient-free) — zero demo value, adds contrast-validation upkeep now. Mine CompPortal's `docs/design/dashboard-themes/` comps when it lands.

Density modes (relaxed/compact) are orthogonal to theme, implemented as a spacing-scale token set (PRODUCT_SPEC §17).

Salon branding (logo, brand color for campaign graphics) is salon *content*, separate from app theme — lives in Settings → Branding, feeds Studio outputs.

---

# 5. Hardware Integration (tanning equipment)

## 5.1 Reality check

No vendor SDKs/APKs in hand. Dominant timer control in the category is **T-Max® (Applied Digital)** — T-Max Manager/Pro units address beds over a serial bus, exposed to PCs via RS-232/COM or TCP bridge hardware; incumbent software (Tan-Link etc.) integrates at this level. Protocol specifics MUST be verified against real hardware/documentation during pilot — **nothing in the first build may depend on unverified protocol details, and no sales promise of specific hardware support until a bench test passes** (PRODUCT_SPEC risk table).

## 5.2 Architecture: Bask Bridge + driver interface

- **`apps/bridge`** — a small Node/TS service installed on the salon's LAN (any always-on PC, or later a Pi-class device). Outbound-only WebSocket to cloud (no inbound ports at the salon), auth via salon-scoped device token, offline-tolerant (queues state, reconciles on reconnect).
- **Driver interface** (in `packages/core`, versioned):
  ```ts
  interface EquipmentDriver {
    listUnits(): Promise<UnitInfo[]>;
    startSession(unit: UnitAddress, minutes: number, delayMin?: number): Promise<Ack>;
    cancelSession(unit: UnitAddress): Promise<Ack>;
    getStatus(unit: UnitAddress): Promise<UnitStatus>;   // idle | delay | running(remaining) | cooldown | fault
    onEvent(cb: (e: UnitEvent) => void): void;           // session_end, fault, manual_start
  }
  ```
- **Drivers:** `SimulatedDriver` (M0 — full state machine incl. delay timers, cooldown, random-ish manual events for demo realism) · `TMaxDriver` (pilot phase, built against bench hardware) · future adapters per vendor. UI and session logic never know which driver runs — the Floor's room board is identical in demo and production.
- **Session authority lives server-side.** Bridge reports; cloud decides. Manual bed starts (staff using the physical timer) arrive as events and reconcile into Sessions — the board must never lie about the room state it can't see; unknown → shown as "manual session" not fabricated data.
- **Floor latency rule:** UI transitions are optimistic; hardware ack reconciles within seconds or surfaces a visible retry chip. Hardware slowness must never freeze check-in (Principle 5).
- Lamp-hour/usage accrual computes from Session records from day one → maintenance features in Phase 3 get history for free.

---

# 6. Barcode & Product Identity System

## 6.1 Identity model (no official SKUs exist yet)

- Internal SKU auto-assigned on product creation: `BSK-#####` — stable, salon-independent for catalogue items, salon-scoped for custom products.
- `Barcode` table maps **many external codes → one product**: manufacturer UPC/EAN scanned off real bottles, plus optional self-printed Code128 labels (Code128 payload = internal SKU) for unlabeled items (single sample lotions, services-adjacent retail). Label printing = later phase; schema supports it now.
- UVALUX catalogue linkage: when the real catalogue arrives (M3+), `UvaluxCatalogItem` gains official SKUs and the mapping is an update, not a migration.

## 6.2 Scan inputs

| Where | Tech | Behavior |
|---|---|---|
| Front desk (Floor/POS) | **USB HID "keyboard-wedge" scanner** (any $30–80 unit — recommend to salons, nothing proprietary) | Global scan listener on the Floor: capture rapid keystroke bursts terminated by Enter (classic wedge signature: inter-key <30ms), route by context — POS open → add to cart; receiving open → increment; otherwise → product lookup toast. No focus management burden on non-technical staff: scanning "just works" anywhere on the Floor. |
| Mobile app | `expo-camera` barcode scanning (UPC-A/E, EAN-13/8, Code128) | Receiving stock, counts, quick lookup, and "shelf audit" walk-around. |

(Webcam scanning on laptops — `BarcodeDetector`/ZXing — is CUT from M1/M2 scope: wedge + phone camera cover the demo and real use. Revisit only if a pilot salon asks.)

**Unknown barcode flow (critical for the no-official-SKUs reality):** scan → "New product?" sheet pre-filled with symbology/code → staff adds name/price/category (photo optional) → product + barcode created in <20s. The catalogue builds itself through use. Fuzzy-match hint if the code's prefix matches an existing product family.

## 6.3 Per-customer product tracking

- Every POS sale line already binds customer↔product (when a customer is attached to the sale — Floor flow attaches automatically from check-in context).
- `used_in_session` StockEvents: scan a lotion at check-in to log in-room use (sampling, included-with-service product) — distinct from purchase.
- Customer profile gains a **Products** tab: purchase history, favorites (frequency-derived), last-purchased dates, "likely due" (simple interval model: median repurchase gap per product, per customer).
- Feeds insights: repurchase-due prompts at check-in (the upsell hint in PRODUCT_SPEC §9), lapsed-product signal to Compass at coaching tier ("stopped buying accelerators they previously purchased" — the brief's explicit example).
- **Demo beat (build for it):** a real Australian Gold bottle on the table → scanned by phone camera → appears in cart / inventory count live. Physical-to-digital in one gesture is the cheapest "this is real" moment the demo has.

---

# 7. Application Surface Map (build inventory)

Web routes (indicative; Opus finalizes):

```
/                     Today: Daybreak, attention queue, pulse, weekly story
/floor                Room board | Check-in | POS | Schedule  (tabs; PWA scope)
/customers            List + segments;  /customers/[id] profile (incl. Products tab)
/marketing            Studio flow · campaigns list · calendar
/inventory            Stock + forecasts · receiving (scan) · /inventory/order (UVALUX draft)
/insights             What changed · metric areas · utilization heatmap · staff · Peers
                      (Peers gap card = interactive slider: drag the target %, $-impact
                      recomputes live) · activity log ("Who did what")
/book                 Public online booking page (customer-facing, simulated confirm —
                      pattern-lift from carly-hair-co /book + /s/[slug])
/settings             Business · staff/permissions · services & equipment · data sharing
                      ("What UVALUX sees") · branding · themes · billing (stub) ·
                      integrations (T-Max entry, marked pilot)
/compass              Network map+health (+ 3 seeded signal cards folded in — no
                      standalone Signals screen in M1; full screen lands M4)
/compass/call-list    Ranked outreach cards → call brief
/compass/accounts     Roster; /compass/accounts/[id] detail + timeline
/compass/coaching     Targets · playbooks · outcomes
```

Multi-location: Today gains one **location-comparison card** (two locations, key deltas) for orgs with >1 salon — fixtures already seed the account; full multi-location UX stays deferred.

Mobile (Expo) screens:

```
Bask shell:    Daybreak (home) · Pulse · Insights (top cards + approve actions)
               · Scan (receiving/lookup/count) · Campaign review/edit/approve
Compass shell: Call List (home) · Account card · Call brief · Log contact
Shared:        Auth/role switch · push notification handlers (Daybreak ready,
               insight ≥ high severity, campaign results in)
```

Every surface ships with: loading/empty/error states designed (not defaulted), guidance-layer coverage, both density modes where applicable, Sunset + Dusk verified.

---

# 8. Reuse Map (verified against both repos — adapt, don't fork blindly)

| From | Take | Into |
|---|---|---|
| **carly-hair-co** `src/app/globals.css` + design.md | IG-luxe token set, glass/eyebrow/gradient utilities, `.in-chair-ring` shimmer, Fraunces/Inter/Grand Hotel stack (drop Grand Hotel or keep as campaign-graphic display option) | `packages/tokens` Sunset theme |
| carly-hair-co `components/booking`, `calendar` | Booking/scheduling interaction patterns, calendar day/week views, "in the chair" live-state pattern | Floor Schedule |
| carly-hair-co `components/supplies`, `checkout`, `clients` | Supply/inventory CRUD shapes, checkout cart flow, client profile layout | Inventory, POS, Customers |
| carly-hair-co `/s/[slug]`, `(portal)` | Public booking page + customer portal patterns | Booking-page mock (represented-future screen) |
| **CompPortal** `TenantThemeProvider` + `resolveBrandingVars` + WCAG label-color logic | Theme provider architecture (minus flag gating) | ThemeProvider |
| CompPortal `social-media-helper.ts`, `useSocialMediaStore`, `SocialMediaHelperPage`, `socialMedia` router + migration | Template/carousel/reel content-generation architecture, branding-injected outputs, export | Studio |
| CompPortal tRPC/Prisma/RBAC router conventions, seed scripts, Playwright + route-walk test rig, `InstallPrompt` PWA pattern | Backend skeleton, test infrastructure, Floor PWA install | apps/web, packages/api/db, test suite |

Anti-dup gate applies per feature: search live + dormant + embedded layers in both repos before writing any new surface.

---

# 9. Milestones

Each milestone gets its own plan file (`docs/plans/`) before execution; acceptance criteria below are the exit gates. Builds/tests in subagents; QA agent for webapp verification; screenshots to DM per iteration.

### M0 — Foundation (spine)
Monorepo scaffold · Supabase project + Prisma schema (incl. tenancy columns, RLS, EquipmentDevice, Barcode tables) · fixture generator with PRODUCT_SPEC §20 story arcs · demo clock (`demo:reset` / `demo:advance`) · `packages/tokens` with Sunset + Compass themes + ThemeProvider · guidance primitives (`<Guided>`, tour driver, copy dictionary) · insight rules engine v1 (thresholds + trend-breaks) producing typed Insight objects · SimulatedDriver + session state machine.
**Exit:** `demo:reset && demo:advance` produces changing Daybreak JSON in tests; theme switch works; a seeded insight object carries evidence + action link; Presenter Panel skeleton (clock, role switch, ≥2 scenario bookmarks) functional.

### M1 — Web demo build (the five loops)
Today/Daybreak (real AI narrative) + **location-comparison card** · Floor complete (board w/ `.in-session-ring`, check-in w/ **real waiver signature capture**, POS with **wedge-scan listener + gift cards/packages as products & tenders**, schedule) · **Shift Handoff** end-of-shift summary · Customers + segments + recovery flow · Studio (real generation, lifecycle, measured outcomes via demo clock) · Inventory (forecasts, scan receiving, UVALUX draft order) · Insights + Peers (**interactive gap slider** → $→action) + **activity log** · **`/book` public booking page** (lands on Floor schedule) · Compass web (Network w/ folded signal cards, Call List + AI call briefs, Accounts, coaching loop, consent tiers driving visibility) · "What UVALUX sees" screen · role switcher (presenter panel/URL param — **explicit non-goal: no real auth machinery before M3**) · Floor PWA install.
**Exit:** PITCH.md script runs end-to-end on web with zero dead ends via `demo:verify`; all pitch bookmarks functional; QA-agent pass on all five loops; non-technical tester completes check-in + campaign unaided.

### M2 — Mobile apps + barcode completion
Expo app both shells (Daybreak home, Pulse, insight approvals, Scan; Call List, call brief, log contact) · push notifications + **presenter "fire push" beat wired end-to-end** · **camera barcode scanning against real product bottles** · EAS builds on TestFlight + Play internal.
**Exit:** Nick-demo hardware kit works: phone running native Daybreak; scan a physical lotion bottle → cart/inventory updates live on the web Floor via Realtime; presenter fires a push and the phone buzzes with campaign results.

### M3 — Pilot foundation
Real auth + tenant hardening (RLS verified adversarially) · onboarding flow for a real salon (guided setup: rooms, services, products-by-scanning, staff) · real SMS via one provider · **Floor offline/degraded mode** (queue check-ins/sales locally, reconcile on reconnect, visible "reconnecting" whisper — strip-mall wifi reality) · payments/EFT groundwork (processor chosen for token portability — decision doc, not code) · concierge import path (CSV mapping tool) · consent legal review checklist · Linen theme.
**Exit:** one real salon (new opening preferred) operating daily; PRODUCT_SPEC §41 pilot metrics instrumented.

### M4 — Hardware pilot
T-Max bench test → `TMaxDriver` → Bask Bridge installed at pilot salon · manual-start reconciliation proven · fault surfacing on the board.
**Exit:** a real bed session started from the Floor, state round-trip verified; documented go/no-go on each protocol assumption.

Beyond M4: PRODUCT_SPEC roadmap Phases 3–5 (payments depth, customer portal, full multi-location UX, network effects, wellness expansion).

---

# 10. Testing & Quality

- **QA agent** (`~/projects/qa-agent`) drives webapp verification per checklist derived from the five loops + demo script; per-project config added to `projects.json`. No unit-test theater on UI; real browser, real seeded data.
- CompPortal's Playwright conventions (suites per domain, route-walk crawl, RBAC matrix) are the pattern for `apps/web` e2e; adopt selectively — this project's suite starts small and honest: 5 loop specs + RBAC + consent-filter spec.
- `packages/core` (insight engine, consent filter, demo clock, forecast math) gets real unit tests — it's pure TS and it's the brain.
- Visual: screenshot-per-iteration to DM (mandatory); theme-contrast automated check; both density modes in loop specs.
- Demo readiness gate before any Nick meeting: `demo:reset`, run §21 script start-to-finish, zero facilitation, on fresh hardware + one phone.

# 11. Risks (implementation-new; product risks live in PRODUCT_SPEC §26)

| Risk | Mitigation |
|---|---|
| T-Max protocol assumptions wrong | Everything behind driver interface; bench test before any commitment; SimulatedDriver keeps product whole regardless. |
| Expo app scope creep | Mobile = Daybreak/approvals/scan + Call List ONLY until M3. Deep surfaces stay web. |
| Wedge-scanner capture conflicts with typing | Timing-signature detection + context routing; hardware prefix character configured on recommended scanners; escape hatch setting. |
| AI cost/latency in demo | Daybreak pre-generates on clock advance (never live-blocks the open); Studio streams; cheap-model routing for classification. |
| Theme system over-engineering | Four themes, one provider, no flag gating. CompPortal's complexity is a cautionary tale as much as a pattern — read its file comments. |
| RLS retrofit pain | Tenancy + RLS in M0 schema, verified in M3, even though demo is single-tenant. |

# 12. Opus execution notes

- Per-milestone plan file first (`docs/plans/YYYY-MM-DD-m<N>-<name>.md`), with per-step acceptance checks; deviations logged in the plan file.
- Read before building: Carly `globals.css` + `design.md`, `components/booking|calendar|supplies|checkout`, CompPortal `TenantThemeProvider.tsx` (including its long comments — hard-won lessons), `social-media-helper.ts` + store + page, one RBAC e2e suite.
- graphify both source repos if graphs are stale; `graphify affected` before modifying anything shared.
- Copy/guidance dictionary reviewed as a whole before M1 exit (tone pass).
- Nothing auto-sends, nothing makes medical claims, consent filter unit-tested before any Compass surface reads data. These three are non-negotiable.

*End. The bar from PRODUCT_SPEC stands: three people, one 12-minute demo, three different "I want this" reactions — now with the phone in Nick's hand running a native app, and a real lotion bottle on the table.*
