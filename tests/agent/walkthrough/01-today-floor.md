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