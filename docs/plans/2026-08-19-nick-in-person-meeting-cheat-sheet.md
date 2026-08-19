# Nick In-Person Meeting Cheat Sheet Plan

## Purpose

This exists so that Daniel has a full in-person meeting cheat sheet for Nick and the BASK Uvalux app.

## Source hierarchy

1. Live Google Calendar event: `Appointment with Nick`, August 19, 2026, 1:00 PM to 2:00 PM Eastern.
2. User statement: meeting is in person.
3. Live Bask production deployment and current repository artifacts.
4. `docs/pitch/PITCH.md`, `PRODUCT_SPEC.md`, and `docs/UVALUX_Master_Fable_Product_Discovery_Brief.md` for pitch flow, discovery, and commercial hypotheses.
5. FounderVision sales knowledge base for opening, question loop, and close mechanics.

## Files

- Create `docs/pitch/NICK-MEETING-CHEAT-SHEET.html` as mobile-first source and printable meeting surface.
- Render `docs/pitch/NICK-MEETING-CHEAT-SHEET.pdf` for offline use and Telegram delivery.
- Capture desktop and phone screenshots under `docs/pitch/screenshots/`.
- Update `CURRENT_WORK.md` with delivered state, verification, and blockers.

## Build steps and acceptance checks

1. Build one sourced meeting sheet using Bask Sunset and Compass visual tokens.
   - Shows correct date, time, in-person format, audience, and live URL.
   - Contains opening, agenda, demo route, discovery questions, commercial discussion, objections, close, fallback, and packing checklist.
   - Marks pricing and deal structures as hypotheses.
   - Does not claim a native mobile app, production readiness, finalized pricing, hardware certification, or official UVALUX branding approval.
2. Render actual HTML in browser.
   - Desktop and phone screenshots show no clipping or horizontal overflow.
   - Print output is legible and page breaks do not cut cards.
3. Run QA Agent against served page and obtain checklist verdicts.
   - If QA Agent model fails twice, record exact failure without substituting a custom browser test.
4. Review factual claims against current source files and live deployment.
   - Every meeting-specific and product-status claim agrees with its source.
5. Deliver PDF and HTML by Telegram DM.
   - Telegram command reports successful sends.
6. Update tracking, commit, and push master.
   - Working tree contains no uncommitted task files.

## Known constraints

- Native `apps/mobile` is a placeholder. Phone demo uses responsive live web.
- Stable live URL is `https://bask-psi.vercel.app`.
- Existing campaign detail can render blank after direct navigation. Use a fresh guided campaign path.
- Never run local demo reset during the meeting because it shares the production database.
- Current promo film is 1 minute 44.8 seconds.

## Execution result

- Created mobile-first and print-ready HTML at `docs/pitch/NICK-MEETING-CHEAT-SHEET.html`.
- Rendered a 14-page Letter PDF at `docs/pitch/NICK-MEETING-CHEAT-SHEET.pdf`.
- Captured desktop and 390-pixel phone screenshots under `docs/pitch/screenshots/`.
- Independent source and artifact review found 0 blockers after the final wording pass.
- QA Agent produced 0 of 11 verdicts. Its model returned HTTP 500 twice and timed out twice. Exact log: `tests/reports/qa-20260819-034719/agent-log.md`.
- Telegram delivery succeeded: HTML message 13353, PDF message 13354, final phone screenshot 13351, final desktop screenshot 13352.
