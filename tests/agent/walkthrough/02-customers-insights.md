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