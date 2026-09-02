# Bask + Compass — full walk-through

**Target:** `https://bask-psi.vercel.app`

GENERATED FILE — assembled by `scripts/qa/walkthrough.sh` from
`tests/agent/walkthrough/*.md`. Edit those sections, not this.

## How to read a result

- A surface that is not built reports **SKIP**, never PASS. A green run
  that quietly skipped half the app is worse than a red one.
- Any number shown on screen is checked against the database, not
  believed from the page. The page describing itself is not evidence.
- **Every `/compass` route needs `?role=uvalux_rep`.** Without it the
  router returns FORBIDDEN, which looks like a broken page but is not.
- There is no login. Auth lands in M3; roles come from the URL.


# QA checklist — `/` and `/floor`

Spec: `docs/superpowers/specs/2026-08-24-bask-today-floor-design.md`
Run with the QA agent against a real browser. No unit tests, no jsdom.

The Bask operator screens hold **real-time opportunity feeds** and **live floor status**.
Numbers below are checked against the database, not against what the page claims about itself.

## 1. The Today screen renders

- [ ] `/` (Today) loads inside the Bask shell (sidenav visible, wordmark, nav row).
- [ ] A **Today** entry appears in the Bask nav and is marked current on this route.
- [ ] The page does NOT show a spinner forever and does NOT show a blank body.
- [ ] The opportunity feed appears with ranked money-first items.
- [ ] Each opportunity shows an action button.
- [ ] Outcome or proof cards render for opportunities that have them.
- [ ] No metric appears as a bare number without the sentence explaining it.

## 2. The Floor screen renders

- [ ] `/floor` loads inside the Bask shell (sidenav visible, wordmark, nav row).
- [ ] A **Floor** entry appears in the Bask nav and is marked current on this route.
- [ ] The page does NOT show a spinner forever and does NOT show a blank body.
- [ ] Rooms render with their status (e.g., occupied, vacant, maintenance).
- [ ] Bed or room state is visible for each room.
- [ ] Any figure shown must be checked against the database rather than believed from the page.

## 3. Nothing else broke

- [ ] `/`, `/floor`, `/floor`, `/customers` still render.
- [ ] `pnpm demo:verify` still walks the PITCH.md path.

## Known-not-built (must report as SKIP, never as PASS)

- **Room details modal** — clicking a room does not open a detailed view in this pass.
- **Live audio alerts** — the floor screen does not currently show real-time audio notifications.

# QA checklist — `/customers` + `/insights`

Spec: `docs/superpowers/specs/2026-08-22-bask-customers-and-insights-design.md`
Run with the QA agent against a real browser. No unit tests, no jsdom.

The data set holds **153 real customers** loaded from the Bask database. Numbers below are
checked against the database, not against what the page claims about itself.

## 1. The pages exist and render

- [ ] `/customers` loads inside the Bask shell (sidenav visible, wordmark, nav row).
- [ ] A **Customers** entry appears in the Compass nav and is marked current on this route.
- [ ] The page does NOT show a spinner forever and does NOT show a blank body.
- [ ] Screenshot the whole composited page. This is the visual coherence gate — it must look like
      the rest of Bask, not like a different product.

- [ ] `/insights` loads inside the Bask shell (sidenav visible, wordmark, nav row).
- [ ] An **Insights** entry appears in the Compass nav and is marked current on this route.
- [ ] The page does NOT show a spinner forever and does NOT show a blank body.
- [ ] Screenshot the whole composited page. This is the visual coherence gate — it must look like
      the rest of Bask, not like a different product.

- [ ] `/insights/activity` loads inside the Bask shell (sidenav visible, wordmark, nav row).
- [ ] The page does NOT show a spinner forever and does NOT show a blank body.
- [ ] Screenshot the whole composited page. This is the visual coherence gate — it must look like
      the rest of Bask, not like a different product.

- [ ] `/insights/peers` loads inside the Bask shell (sidenav visible, wordmark, nav row).
- [ ] The page does NOT show a spinner forever and does NOT show a blank body.
- [ ] Screenshot the whole composited page. This is the visual coherence gate — it must look like
      the rest of Bask, not like a different product.

## 2. Customer rows render with health bands

- [ ] The `/customers` table renders rows with real customer data, not placeholders.
- [ ] The row count in the pager matches `SELECT count(*) FROM bask.customer` filtered to
      the default cohort. **Compare to the database, not to the header.**
- [ ] Each customer row shows: name, health band, score (if available), and key metrics.
- [ ] Customer rows are color-coded by health band (red/yellow/green) in a consistent way.

## 3. Health bands show factors, not just scores

- [ ] Every health band or score is accompanied by the factors behind it rather than shown as a naked number.
- [ ] Each factor is clearly labeled with its source and impact.
- [ ] The explanation of factors is visible when hovering over or clicking on the score.

## 4. Peers view respects cohort minimum

- [ ] The `/insights/peers` view suppresses any comparison drawn from fewer salons than the cohort minimum.
- [ ] When comparisons are suppressed, the view says so in words instead of showing a thin number.
- [ ] The peer count and cohort size are cross-checked against the database.

## 5. Empty states explain what to do

- [ ] Empty states in `/customers` explain what to do rather than spinning.
- [ ] Empty states in `/insights` explain what to do rather than spinning.
- [ ] Empty states in `/insights/activity` explain what to do rather than spinning.
- [ ] Empty states in `/insights/peers` explain what to do rather than spinning.

## 6. Honesty and failure modes

- [ ] Stop the database (or point at a bad URL) and reload: an error state appears showing the
      REAL message in a monospace block. Not a blank page, not a fake-friendly "something went
      wrong" that hides the cause.
- [ ] Filter to something with no matches: an empty state explains what to do, no infinite spinner.
- [ ] With `prefers-reduced-motion: reduce` set, the graphs and transitions do not idle-drift and do not
      fly-to-animate on selection.

## 7. Nothing else broke

- [ ] `/customers`, `/insights`, `/insights/activity`, `/insights/peers` all render.
- [ ] `/compass/network`, `/compass/accounts`, `/compass/coaching` still render.
- [ ] `pnpm demo:verify` still walks the PITCH.md path.

## Known-not-built (must report as SKIP, never as PASS)

- **Cohort minimum configuration** — The system does not yet allow configuration of the minimum cohort size for peer comparisons.
- **Advanced filtering in Insights** — More granular filters for analytics are not yet implemented.
- **Export functionality** — Exporting customer data or insights is not yet available.

# QA checklist — `/inventory`, `/inventory/order`, and `/marketing`

Spec: `docs/superpowers/specs/2026-08-24-bask-inventory-and-marketing-design.md`
Run with the QA agent against a real browser. No unit tests, no jsdom.

The corpus holds **1,007 real claims** loaded from four extraction lenses. Numbers below are
checked against the database, not against what the page claims about itself.

## 1. The page exists and renders

- [ ] `/inventory` loads inside the Bask shell (sidenav visible, wordmark, nav row).
- [ ] A **Inventory** entry appears in the Bask nav and is marked current on this route.
- [ ] The page does NOT show a spinner forever and does NOT show a blank body.
- [ ] Screenshot the whole composited page. This is the visual coherence gate — it must look like
      the rest of Bask, not like a different product.

## 2. Inventory screen — stock levels

- [ ] The inventory table renders rows with real product data, not placeholders.
- [ ] Each row shows: product name, current stock level, reorder point, suggested order quantity.
- [ ] Low stock or reorder signals are visible in the relevant cells (e.g., color coding or icons).
- [ ] The suggested order quantity shows the reasoning (e.g., "Reorder point 100, current 25 → order 75").

## 3. Order screen — draft order handling

- [ ] `/inventory/order` loads inside the Bask shell.
- [ ] A **New Order** button or similar appears to initiate a draft order.
- [ ] Opening a draft order works without error and shows the expected form fields.
- [ ] The system never submits anything real during a test run — this is a hard rule.
- [ ] Any attempt to submit or save a draft order during testing must be intercepted and cancelled.

## 4. Marketing screen — campaign builder

- [ ] `/marketing` loads inside the Bask shell.
- [ ] The marketing dashboard renders and shows campaign list or builder UI.
- [ ] The campaign builder renders with expected fields and controls.
- [ ] Opening an existing campaign from a list actually rehydrates its content rather than showing an empty body.

## 5. Honesty and failure modes

- [ ] Stop the database (or point at a bad URL) and reload: an error state appears showing the
      REAL message in a monospace block. Not a blank page, not a fake-friendly "something went
      wrong" that hides the cause.
- [ ] Filter to something with no matches: an empty state explains what to do, no infinite spinner.
- [ ] With `prefers-reduced-motion: reduce` set, the UI does not idle-drift and does not
      fly-to-animate on selection.

## 6. Nothing else broke

- [ ] `/compass/accounts?role=uvalux_rep`, `/compass/network?role=uvalux_rep` and `/compass/coaching?role=uvalux_rep` still render.
- [ ] `pnpm demo:verify` still walks the PITCH.md path.

## Known-not-built (must report as SKIP, never as PASS)

- **Campaign analytics** — detailed metrics and reporting are not yet implemented.
- **Multi-user order collaboration** — draft orders cannot be shared or edited by others in this pass.
- **Inventory history tracking** — a full audit trail for stock changes is not wired in.

# QA checklist — `/monitor`, `/settings/data-sharing`, `/book`

Spec: `docs/superpowers/specs/2026-08-25-frontend-monitor-consent-book-design.md`
Run with the QA agent against a real browser. No unit tests, no jsdom.

The corpus holds **1,007 real claims** loaded from four extraction lenses. Numbers below are
checked against the database, not against what the page claims about itself.

## 1. The pages exist and render

- [ ] `/monitor` loads inside the Compass shell (sidenav visible, wordmark, nav row).
- [ ] `/settings/data-sharing` loads inside the Compass shell (sidenav visible, wordmark, nav row).
- [ ] `/book` loads inside the Compass shell (sidenav visible, wordmark, nav row).
- [ ] A **Monitor** entry appears in the Compass nav and is marked current on this route.
- [ ] A **Data sharing** entry appears in the Compass nav and is marked current on this route.
- [ ] A **Book** entry appears in the Compass nav and is marked current on this route.
- [ ] The pages do NOT show a spinner forever and do NOT show a blank body.
- [ ] Screenshot the whole composited page. This is the visual coherence gate — it must look like
      the rest of Compass, not like a different product.

## 2. Monitor renders correctly

- [ ] The **Listener tile** shows the correct listener name and status.
- [ ] The **Scored conversations** table renders with at least one row.
- [ ] The **Coaching patterns** table renders with at least one row.
- [ ] The **Team table** renders with at least one row.
- [ ] The **Consent pledge** is visible on the Monitor page.
- [ ] Monitor renders from fixtures and captures no real audio, so the tester must confirm
      nothing implies live recording.

## 3. Data-sharing renders correctly

- [ ] The consent tiers are explained in plain language.
- [ ] The page states what UVALUX can and cannot see.
- [ ] Consent tiers are clearly differentiated and easy to understand.

## 4. Book renders correctly

- [ ] The booking page renders for a customer with no login.
- [ ] The page displays the correct booking information and options.
- [ ] All interactive elements (buttons, forms) render and are functional.

## 5. Honesty and failure modes

- [ ] Stop the database (or point at a bad URL) and reload: an error state appears showing the
      REAL message in a monospace block. Not a blank page, not a fake-friendly "something went
      wrong" that hides the cause.
- [ ] With `prefers-reduced-motion: reduce` set, the animations do not idle-drift and do not
      fly-to-animate on selection.

## 6. Nothing else broke

- [ ] `/monitor`, `/settings/data-sharing`, `/book` still render correctly.
- [ ] `pnpm demo:verify` still walks the PITCH.md path.

## Known-not-built (must report as SKIP, never as PASS)

- **Audio playback** in Monitor — source media lives on FIRMAMENT `J:`/`M:` and is not
  reachable from the web host. The UI must say the audio is not reachable rather than render a
  dead control.
- **Coaching pattern alerts** — deliberately not implemented; detecting coaching patterns needs
  more sophisticated analysis and the alerts module is pure.


# QA checklist — `/compass/network?role=uvalux_rep` and `/compass/accounts?role=uvalux_rep`

Spec: `docs/superpowers/specs/2026-08-22-compass-network-accounts-design.md`
Run with the QA agent against a real browser. No unit tests, no jsdom.

The Compass network map shows **1,007 real salons** loaded from the database.
Numbers below are checked against the database, not against what the page claims about itself.

## 1. The page exists and renders

- [ ] `/compass/network?role=uvalux_rep` loads inside the Compass shell (sidenav visible, wordmark, nav row).
- [ ] A **Network** entry appears in the Compass nav and is marked current on this route.
- [ ] `/compass/accounts?role=uvalux_rep` loads inside the Compass shell (sidenav visible, wordmark, nav row).
- [ ] An **Accounts** entry appears in the Compass nav and is marked current on this route.
- [ ] The page does NOT show a spinner forever and does NOT show a blank body.
- [ ] Screenshot the whole composited page. This is the visual coherence gate — it must look like
      the rest of Compass, not like a different product.

## 2. The network map renders

- [ ] The map shows salons as nodes in a 3D force graph on a dark canvas.
- [ ] The canvas is dark but the surrounding page chrome stays light Compass. It must NOT look
      like Bask — the palettes are how you know which product you are in.
- [ ] Nodes differ visibly in size (corroboration) and colour (review state).
- [ ] The legend explains colour, size, brightness and halo.
- [ ] Clicking a node selects it.
- [ ] If the view is capped, the page SAYS how many of how many it is plotting. A silent cap reads
      as "this is everything".
- [ ] Screenshot the map.

## 3. The account detail page

- [ ] `/compass/accounts/<slug>?role=uvalux_rep` loads inside the Compass shell.
- [ ] The account detail page shows a summary card with name, location, and health score.
- [ ] The health score is shown in a color-coded band (red/yellow/green), not as a raw number.
- [ ] The health bands expand to show the factors behind them.
- [ ] No raw health score is ever displayed — the consent filter deliberately keeps it out of
      the payload, so seeing one is a failure.
- [ ] If two salons share only a name, the name is shown and nothing else.

## 4. Filters

- [ ] Filter chips toggle and the row count changes.
- [ ] The **marketing** lens is OFF by default. Turning it on increases the count — those 266
      voice-of-customer quotes are a different queue and must not pollute curation by default.
- [ ] Clearing all filters restores the full default set.

## 5. Query parameter enforcement

- [ ] Every Compass route requires the query parameter `role=uvalux_rep` or it returns a forbidden error.
- [ ] Append `?role=uvalux_rep` to every URL tested.

## 6. Honesty and failure modes

- [ ] Stop the database (or point at a bad URL) and reload: an error state appears showing the
      REAL message in a monospace block. Not a blank page, not a fake-friendly "something went
      wrong" that hides the cause.
- [ ] Filter to something with no matches: an empty state explains what to do, no infinite spinner.
- [ ] With `prefers-reduced-motion: reduce` set, the graph does not idle-drift and does not
      fly-to-animate on selection.

## 7. Nothing else broke

- [ ] `/compass/knowledge?role=uvalux_rep`, `/compass/coaching?role=uvalux_rep` still render.
- [ ] `pnpm demo:verify` still walks the PITCH.md path.

## Known-not-built (must report as SKIP, never as PASS)

- **Command palette (`⌘K`)** — `palette.ts` and the palette UI are not wired in this pass.
- **Audio playback** in the inspector — source media lives on FIRMAMENT `J:`/`M:` and is not
  reachable from the web host. The UI must say the audio is not reachable rather than render a
  dead control.
- **`contradiction` alerts** — deliberately not implemented; detecting opposing sentiment needs a
  model, and the alerts module is pure.
- **Speaker attribution** — no diarization, and the corpus is not joined to `knowledge_doc`.

## Compass — Coaching

`/compass/coaching?role=uvalux_rep`. UVALUX-internal. Every Compass route needs the
role parameter or the router returns FORBIDDEN, which looks like a broken page.

- [ ] `/compass/coaching?role=uvalux_rep` renders inside the Compass shell.
- [ ] A **Coaching** entry appears in the nav and is marked current.
- [ ] No infinite spinner and no blank body.
- [ ] If an answer is shown, it carries its source. An answer that cannot cite where it
      came from is the failure this surface exists to prevent — report it.
- [ ] Where a speaker or session is unknown, the page says so rather than showing a name.

### Report as SKIP, not PASS

- Retrieval over the knowledge base is **built but unwired** (`core/knowledge/retrieve.ts`
  has no caller). If coaching renders fixtures rather than real retrieval, that is SKIP.
- `bask.knowledge_doc` holds **0 rows**; the 22 expo documents exist only as a JSONL
  fixture on disk. Any answer implying a populated corpus is wrong.

> The Knowledge surface is covered separately and in depth by
> `tests/agent/compass-knowledge.md`, which the assembler appends. Do not duplicate it here.


# QA checklist — `/compass/knowledge`

Spec: `docs/superpowers/specs/2026-08-22-compass-knowledge-curation-design.md`
Run with the QA agent against a real browser. No unit tests, no jsdom.

The corpus holds **1,007 real claims** loaded from four extraction lenses. Numbers below are
checked against the database, not against what the page claims about itself.

## 1. The page exists and renders

- [ ] `/compass/knowledge` loads inside the Compass shell (sidenav visible, wordmark, nav row).
- [ ] A **Knowledge** entry appears in the Compass nav and is marked current on this route.
- [ ] The page does NOT show a spinner forever and does NOT show a blank body.
- [ ] Screenshot the whole composited page. This is the visual coherence gate — it must look like
      the rest of Compass, not like a different product.

## 2. Claims actually load

- [ ] The table renders rows with real text, not placeholders.
- [ ] The row count in the pager matches `SELECT count(*) FROM bask.knowledge_claim` filtered to
      the default lenses (`advice`, `recall`). **Compare to the database, not to the header.**
- [ ] Each row shows: review state, claim text, category, moment, source count, timecode.
- [ ] Claim text that overflows is clipped with an ellipsis, and the full text is still selectable.

## 3. The inspector is the trust anchor

- [ ] Selecting a row fills the right-hand inspector.
- [ ] The **verbatim quote** is visually dominant and is shown IN FULL — never shortened.
- [ ] Beneath it: source file basename, audio stream index, timecode range.
- [ ] The `knowledgeRef` reads in the documented shape, e.g. `Room B 2026 · P1060686 · 12:34`.
- [ ] Where a speaker is unknown it says so. **It must never print a speaker name that is not in
      the data.** Every claim currently has `sessionTitle: null` and `speaker: null` because the
      corpus is not yet joined to `knowledge_doc` — the UI must show that honestly, not blank.

## 4. Verification works and persists

- [ ] `J` and `K` move the focused row; the inspector follows.
- [ ] `V` verifies the focused claim. The row's state changes.
- [ ] `X` rejects. The row's state changes.
- [ ] Reload the page — **the verdict survived**. (If it did not, the mutation is not reaching the
      database and everything else on this page is theatre.)
- [ ] `SELECT review_state FROM bask.knowledge_claim WHERE id = <that id>` matches the UI.
- [ ] `SELECT count(*) FROM bask.knowledge_claim_event WHERE claim_id = <that id>` is ≥ 1. A
      verdict without its audit row is the failure that makes undo impossible.
- [ ] `⌘Z` / `Ctrl+Z` undoes the last decision and the row returns to its prior state.

## 5. Filters

- [ ] Filter chips toggle and the row count changes.
- [ ] The **marketing** lens is OFF by default. Turning it on increases the count — those 266
      voice-of-customer quotes are a different queue and must not pollute curation by default.
- [ ] Clearing all filters restores the full default set.

## 6. The map

- [ ] Switching to **Map** renders a 3D force graph on a dark canvas.
- [ ] The canvas is dark but the surrounding page chrome stays light Compass. It must NOT look
      like Bask — the palettes are how you know which product you are in.
- [ ] Nodes differ visibly in size (corroboration) and colour (review state).
- [ ] The legend explains colour, size, brightness and halo.
- [ ] Clicking a node selects it.
- [ ] If the view is capped, the page SAYS how many of how many it is plotting. A silent cap reads
      as "this is everything".
- [ ] Screenshot the map.

## 7. Honesty and failure modes

- [ ] Stop the database (or point at a bad URL) and reload: an error state appears showing the
      REAL message in a monospace block. Not a blank page, not a fake-friendly "something went
      wrong" that hides the cause.
- [ ] Filter to something with no matches: an empty state explains what to do, no infinite spinner.
- [ ] With `prefers-reduced-motion: reduce` set, the graph does not idle-drift and does not
      fly-to-animate on selection.

## 8. Nothing else broke

- [ ] `/compass/network`, `/compass/accounts`, `/compass/coaching` still render.
- [ ] `pnpm demo:verify` still walks the PITCH.md path.

## Known-not-built (must report as SKIP, never as PASS)

- **Command palette (`⌘K`)** — `palette.ts` and the palette UI are not wired in this pass.
- **Audio playback** in the inspector — source media lives on FIRMAMENT `J:`/`M:` and is not
  reachable from the web host. The UI must say the audio is not reachable rather than render a
  dead control.
- **`contradiction` alerts** — deliberately not implemented; detecting opposing sentiment needs a
  model, and the alerts module is pure.
- **Speaker attribution** — no diarization, and the corpus is not joined to `knowledge_doc`.

