# Visual inspection brief — Bask + Compass

**Target:** https://bask-psi.vercel.app · public demo, no auth.
**Repo:** `~/projects/uvalux-platform` (public). Deploys on push to `master`, ~25s.
**Job:** production-grade visual inspection of every corner of every element of both products, then fix.

This exists so that a stakeholder can open any screen at any width and see nothing broken.
Check every deliverable against THAT sentence.

---

## Read this first: how the previous eight rounds failed

Do not repeat these. Every one of them produced a confident "clean" report over a live defect.

1. **A metric was substituted for looking.** The check measured `body.scrollWidth - clientWidth`
   and reported "all 17 routes clean" while text was visibly cut off. **When an element overruns
   its card, the CARD clips it — page-level overflow stays exactly 0.** Never report a page as
   clean on the basis of a number. Look at the pixels.
2. **One viewport was tested.** 390px only. The topbar was losing 236px at 768px and the insight
   action row 77px at 320px the whole time. Both invisible at 390.
3. **Only the right edge was tested.** Left-edge and vertical overflow were never checked.
4. **A fix created a worse defect and was reported as fixed** because the number went to zero:
   `.card:has(> .b-dtable) { overflow-x: auto }` stopped `/customers` clipping the page, but the
   table slab now breaks past the card's rounded corners and slices text mid-word with no scroll
   affordance. **THIS IS STILL BROKEN AND IS THE MAIN OPEN DEFECT.** See "Known broken" below.
5. **A CSS fix silently did nothing** because a media query adds no specificity and was placed
   above the base rule it was meant to override. The measurement was identical before and after —
   that identical number was the only reason it was caught. If a fix changes nothing, suspect
   source order before you suspect the measurement.
6. **A checker reported 24 orphans when there were 12**, because it searched only `apps/` and
   missed components composed inside `packages/ui`. Verify your instrument before trusting it.

---

## What to inspect

Every route, at minimum **320, 360, 390, 768, 900, 1024, 1280, 1440**. Screenshot each. **Open the
images and look at them.** The bar is "would a stakeholder notice anything wrong", not "does a
selector report zero".

**Bask (operator app)** — all need no role param:
`/` · `/customers` · `/insights` · `/insights/peers` · `/insights/activity` · `/monitor` ·
`/marketing` · `/inventory` · `/inventory/order` · `/community` · `/settings/data-sharing` · `/book`

**Compass (UVALUX dealer app)** — **every `/compass` route REQUIRES `?role=uvalux_rep`** or tRPC
returns FORBIDDEN and the page renders broken. This is not a bug to fix; it is how roles work
until M3:
`/compass` · `/compass/accounts` · `/compass/coaching` · `/compass/knowledge` · `/compass/network`

Off-nav but still routable, lower priority: `/floor`, `/dev/*`.

### What counts as a defect
- text clipped, sliced mid-word, or running under/past any edge
- content escaping a card's rounded corners or border
- horizontal scrollbars on the page (the page must never scroll sideways; a table may scroll
  inside its own box, but it must look deliberate — clipped to the card radius, with an
  affordance)
- overlapping elements, collisions with the fixed bottom tab bar (mobile) or sticky topbar
- inconsistent padding between siblings, orphaned single words, unreadable contrast
- anything that looks different in kind from the surrounding design language

---

## Known broken — start here

1. **`/customers` table (PRIMARY).** At mobile widths the customer table escapes its card: the
   white slab overruns the rounded corners and text is cut mid-word at the right with no scroll
   cue. Root cause of the ugliness is the previous "fix" — `.card:has(> .b-dtable){overflow-x:auto}`
   in `packages/ui/src/components/health.css`. **Correct fix is almost certainly to make the table
   reflow — stack rows or drop columns below ~700px — not to scroll a slab sideways.** Six
   components share `.b-dtable`, so changing it touches `/customers` and `/insights/peers`.
2. **`/compass/network` map** reports 1–2px sub-pixel overflow. Probably rounding on the SVG
   viewBox, but confirm visually rather than assuming.
3. **`/customers` at 390** had an 8px page overflow on `main.cu-shell` earlier; may or may not
   survive. Cosmetic, but verify.

---

## Root cause that explains nearly every clip found so far

**`min-width: auto` on flex and grid children.** A flex/grid item will not shrink below its own
content, so any row containing a long label, a `white-space: nowrap` chip, an `<input>`, or a
`<table>` will push its container wider than the viewport. Because `html`/`body` are
`overflow-x: clip`, the surplus is **cut off rather than scrollable** — silent data loss, not
off-screen content.

The remedies already applied, for consistency — match them:
- `min-width: 0` on the grid/flex child (and `minmax(0, …)` on the track)
- `minmax(min(320px, 100%), 1fr)` instead of `minmax(320px, 1fr)` — a minmax floor cannot collapse
- `flex-wrap: wrap` where an action can drop to its own line
- `overflow-x: auto` on a strip that should scroll (tab bars), **clipped to the card radius**
- chips: `max-width: 100%` plus letting the label wrap at narrow widths

---

## Tooling

- `node scripts/qa/mobile-clip-check.mjs` — existing checker. **Incomplete on purpose-of-record:**
  right-edge only, and it cannot judge whether anything looks right. Use it as a tripwire, never
  as the verdict. `BASE=http://localhost:3417` to run against local.
- `bash scripts/qa/orphan-check.sh` — fails when a component is exported from `@bask/ui` but
  rendered nowhere. **11 components currently render for nobody** (`CoachAnswer`,
  `CustomerHealthSection`, `EmailPreviewCard`, `FrontDeskScriptCard`, `HandleItPlanCard`,
  `NetworkOutcomeCard`, `ScoreboardSection`, `SmsPreviewCard`, `SocialPostCard`,
  `StaffChallengeCard`, `StaffTaskCard`). Not your job unless asked, but do not add to the pile.
- Playwright is installed at the repo root — run scripts from there or the import fails.
- Local dev server already runs on **:3417** (another session owns it) and **:3418**. Read-only use
  is fine; do not kill them.
- Screenshots must reach Daniel's Telegram: `~/tg-dm.sh --file <png> "<context>"`.
  **Telegram rejects images taller than ~10000px** (`PHOTO_INVALID_DIMENSIONS`) — crop to the
  element or use a viewport-height capture, not `fullPage` on a long route.

## Gotchas that cost real time

- **`vercel ls` prints its table to STDERR.** `vercel ls … 2>/dev/null | sed -n '4p'` waits forever
  on empty stdout — two 10-minute hangs. Use `2>&1` and match on the status word, never a line
  number (line 4 is the header on a TTY and a bare URL when piped).
- **A green local `tsc` proves nothing about master.** Production sat broken for two hours because
  a broker-delivered file was never committed: master's `core/index.ts` aliased
  `generateCurationAlerts` against a module that lacked it, while the working tree had the fix.
  Verify against the deployed URL, not the working tree.
- Shared Supabase (`supabase-CCandSS`, `bask` schema, 574 other tables). **Never `demo:reset`** —
  it truncates the whole schema.
- Public repo: no client name, no creds, no exact financials in tracked files.
- Commit format: `fix(scope): title`, bullets, `Build pass.` Push to master deploys.

## Report to Telegram AS YOU GO — not at the end

Daniel is watching from his phone. He must not have to ask what you are doing.

```bash
~/tg-dm.sh --file <png> "<what this is, what is wrong or fixed>"
~/tg-dm.sh "<text-only status>"
```

Send:
- **one message when you start**, naming the routes and widths you are about to sweep
- **every defect the moment you find it** — the screenshot plus one line saying what is wrong.
  Do not batch findings up for a summary later.
- **every fix the moment it is verified** — the before and after screenshots together, with the
  measurement that changed. A fix with no after-screenshot does not count.
- **a short progress line after each route finishes**, so the sweep is visibly moving
- **one message at the end**: what was inspected, what was fixed, what was deliberately left

Screenshot rules that matter for this: Telegram rejects images over ~10000px tall
(`PHOTO_INVALID_DIMENSIONS`), so crop to the element or capture at viewport height rather than
`fullPage` on long routes. If a send fails, crop and resend — do not silently drop the finding.

**Never report something as fixed in Telegram unless you have looked at the after-screenshot.**
That single rule is what the previous eight rounds violated.

## Definition of done

Every route × every listed width screenshotted, **each image actually viewed**, every defect either
fixed or listed with a reason it was left. Re-screenshot after fixing and view again — a fix is not
done until its own screenshot has been looked at. Report what you looked at, what you changed, and
what you deliberately left.
