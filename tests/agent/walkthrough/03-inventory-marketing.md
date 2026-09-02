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