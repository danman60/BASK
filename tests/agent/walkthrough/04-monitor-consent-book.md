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
