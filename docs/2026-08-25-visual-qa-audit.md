# BASK Visual QA Audit

**Site:** `bask-psi.vercel.app`  
**Audit date:** August 25, 2026

## Highest-priority defects

### 1. Customers has two separate application headers
**Page:** `/customers`  
**Severity:** HIGH  
**Confidence:** Confirmed from source

The global Bask layout already renders the main sticky Bask header and navigation. 

The Customers surface then renders another `cu-topbar`, containing another Bask wordmark, page title, and action. 

This means the visual hierarchy becomes:

1. Global Bask header
2. Customer-specific Bask header
3. Customer page

Worse, both headers are sticky at `top: 0`. The customer header has `z-index: 20`, while the main shell has `z-index: 5`.  

**Likely visible result:** two navigation bars initially, then the Customers bar covers the application's actual navigation as the page scrolls.

**Fix:** remove `cu-topbar` and put the Recovery action into the page heading/action area.

---

### 2. Marketing also has two separate application headers
**Page:** `/marketing`  
**Severity:** HIGH  
**Confidence:** Confirmed from source

Marketing lives inside the same global `AppShell`, but `StudioHub` independently renders another `st-topbar` with another Bask wordmark. 

The campaign builder does exactly the same thing. 

Again, `st-topbar` is sticky at `top: 0` with `z-index: 20`, so it can sit over the actual global navigation. 

**Fix:** the global AppShell should own all product chrome. Marketing should begin with the page heading or campaign stepper, not another Bask header.

---

### 3. Community is missing the standard page container
**Page:** `/community`  
**Severity:** HIGH  
**Confidence:** Confirmed from source

Most Bask pages use a centered page shell with a maximum width and horizontal padding. The standard shell is `max-width: 1180px`. 

Community instead returns a bare:

`<div className="b-community">`

with no `b-shell`, `l4`, or other page-width wrapper. 

The `.b-community` CSS only defines a grid and gap, with no width, margin, or horizontal padding. 

**Likely visible result:**
- unusually wide content on desktop
- cards reaching much farther toward the browser edges than other pages
- effectively no page gutter on phones
- abrupt visual change when navigating from Monitor or Analytics to Community

**Fix:** wrap Community in the standard centered shell.

---

### 4. The mobile breakpoint strategy is internally inconsistent
**Pages:** especially `/`, also `/monitor`  
**Severity:** HIGH  
**Confidence:** Confirmed from CSS

The global shell switches to its mobile treatment at **999px**. At that breakpoint it removes the horizontal page padding completely:

`padding: 0 0 96px`

and changes navigation to the bottom tab bar. 

However, Today's mobile-specific internal padding does not begin until **720px**. 

So from **721px through 999px**, the app is in a hybrid state:

- mobile bottom navigation
- desktop/tablet content styling
- no standard page-side padding
- desktop card treatment in several places

That is a particularly dangerous tablet and small-laptop range.

**Fix:** establish one responsive breakpoint system. If the shell becomes mobile at 999px, page gutters and page-specific responsive rules need to respond at the same breakpoint.

---

### 5. Today's new opportunity feed has no mobile side gutters
**Page:** `/`  
**Severity:** HIGH  
**Confidence:** Confirmed from layout source

Today's original mobile elements explicitly receive `20px` side padding, including the Daybreak heading, queue, and rail. 

But the newer Opportunity Feed and Wins Feed sit directly in the page section. 

Their component styling adds internal card spacing, but does not restore the outer 20px mobile page gutter. The global shell has already removed its padding at widths below 999px. 

**Likely result:** the "6 ways to grow your business today" section and social-proof cards run edge-to-edge while the older portions of Today are inset by 20px.

This will make the same page appear to have two different layout grids.

---

### 6. Monitor loses its horizontal page gutter on mobile and tablet
**Page:** `/monitor`  
**Severity:** HIGH  
**Confidence:** Confirmed from source

Monitor uses:

`<main className="b-shell b-shell-wide">`



At widths under 999px, `b-shell` removes its left and right padding. 

Unlike the older Today sections, Monitor does not add another outer 20px gutter around the content.

**Likely result:** headline, insight cards, conversations, and supporting panels sit directly against the viewport edges.

The internal Monitor overflow work is actually quite good, but the outer page spacing is missing.

---

## Marketing-specific responsive defects

### 7. Campaign builder step navigation cannot reasonably fit on a phone
**Page:** `/marketing?new=1`, campaign editor routes  
**Severity:** HIGH  
**Confidence:** Confirmed from CSS structure

The custom Marketing topbar contains:

- Bask wordmark
- Marketing breadcrumb
- five campaign steps
- separators between steps

The step container is one non-wrapping flex row pushed to the right. 

The corresponding `.st-steps` CSS does not wrap or scroll. The topbar also retains substantial horizontal padding. 

**Result on phones:** horizontal overflow or clipping is effectively unavoidable.

This becomes even more obvious because the global mobile Bask header is also present above it.

---

### 8. Marketing phone preview is wider than the available content area on a 320px phone
**Page:** Marketing campaign builder  
**Severity:** HIGH  
**Confidence:** Confirmed mathematically from CSS

The Marketing shell permanently uses substantial horizontal padding. 

The preview phone is hard-coded to:

`width: 300px`



At a 320px viewport, the padded content area is considerably narrower than 300px.

**Result:** the phone mockup must either protrude outside its container or be clipped.

**Fix:** `width: min(300px, 100%)`.

---

### 9. Marketing campaign rows retain four columns on narrow screens
**Page:** `/marketing`, Campaigns tab  
**Severity:** MEDIUM-HIGH  
**Confidence:** High

Each campaign row uses:

`grid-template-columns: minmax(0, 1fr) auto auto auto`

and the two metadata columns explicitly use `white-space: nowrap`. 

I found no corresponding narrow-screen rule collapsing the campaign row.

**Likely result:** campaign name gets severely compressed, or the row extends outside the available width.

**Fix:** below roughly 600px, switch to a one-column or two-column card layout.

---

### 10. Marketing calendar has no meaningful mobile layout
**Page:** `/marketing`, Calendar tab  
**Severity:** MEDIUM  
**Confidence:** High

The calendar always uses seven equal columns. Individual days maintain a substantial minimum height, with campaign names rendered inside those cells.  

There is no alternate agenda/list treatment for small displays and no horizontal-scroll treatment around the calendar.

**Likely result on a 320-390px phone:** extremely narrow cells, tiny campaign cards, aggressive wrapping, and poor scanability.

A mobile calendar should probably become a chronological list.

---

### 11. Marketing context banner is vulnerable to narrow-screen squeezing
**Page:** campaign builder entered from an Insight  
**Severity:** MEDIUM  
**Confidence:** High

`.st-context` is a single flex row containing:

- decorative bar
- potentially long explanation
- fixed "Why this?" action pushed to the far right

The action is `flex: none` and there is no narrow-screen wrapping rule. 

On a phone, that creates a classic squeezed-text or overflow condition.

---

## Customers-specific responsive defects

### 12. The secondary Customers header is poorly suited to mobile
**Page:** `/customers`  
**Severity:** MEDIUM-HIGH  
**Confidence:** High

The Customers header contains the Bask wordmark, breadcrumb, and recovery button in a single flex row with large horizontal page padding. 

The CSS does not provide a phone-specific topbar arrangement. 

Even ignoring the fact that the header should not exist at all, its contents are likely to become cramped or overflow on narrow screens.

---

## Analytics / Insights responsive defect

### 13. Insights' three-way subnavigation is not scrollable or wrappable
**Pages:** `/insights`, `/insights/peers`, `/insights/activity`  
**Severity:** MEDIUM  
**Confidence:** High

The Analytics header contains:

- What changed
- Peers
- Who did what

The control uses `display: inline-flex`, but has no wrapping and no horizontal-scroll behavior. 

The Analytics page itself maintains 24px horizontal padding, leaving about 272px of usable width on a 320px device.

Those three labels plus six sets of horizontal tab padding are right at, or beyond, what can fit comfortably.

**Fix:** use horizontal scrolling or shorter mobile labels.

---

## Live-page presentation defects

### 14. Duplicate primary CTA on Opportunity 2
**Page:** `/`  
**Severity:** MEDIUM  
**Confidence:** Confirmed live

The "Convert 17 regulars to members" opportunity displays:

- Prepare script
- Approve & send to 17 customers
- Approve & send to 17 customers

The second and third controls are identical in the current live DOM.

There should not be two visually identical primary actions beside one another.

---

### 15. Duplicate primary CTA on Opportunity 4
**Page:** `/`  
**Severity:** MEDIUM  
**Confidence:** Confirmed live

"Fill Tuesday afternoon" similarly exposes the same "Approve & send to 24 customers" action twice.

This is visually confusing and makes the action row look broken.

---

## Inconsistencies worth cleaning up

### 16. Three different page-shell systems are currently coexisting
**Severity:** MEDIUM  
**Pages:** site-wide

The application currently has at least these page layouts:

- `b-shell`, used by Today and Monitor
- `l4`, used by Analytics and Inventory
- `cu-shell`, used by Customers
- `st-shell`, used by Marketing
- no outer shell at all on Community

This is why page gutters, maximum widths, responsive breakpoints, and header behavior vary from destination to destination.

This is not merely stylistic. It is directly producing several of the defects above.

**Recommendation:** define one `PageContainer` primitive with one responsive gutter system.

---

### 17. Customers and Marketing visually repeat the Bask brand unnecessarily
**Severity:** MEDIUM

Even before considering sticky positioning, navigating to either destination gives Bask branding in the global header and another "Bask" wordmark immediately below it.

That visually implies an app embedded inside itself.

Customers source:   
Marketing source: 

---

### 18. Mobile navigation changes at a different width than several page layouts
**Severity:** MEDIUM  
**Pages:** site-wide

The product navigation changes at 999px. 

Several actual content components still use 900px, 760px, 720px, 620px, and 420px breakpoints.

Using component-specific breakpoints is fine, but removing the entire outer page gutter at 999px makes those differing breakpoints interact badly.

The fix is not necessarily "make every breakpoint 999px." The important change is to **keep a consistent page gutter at every width**.

---

## Things I specifically checked that appear handled correctly

I would **not** currently file these as defects:

- The Monitor employee table already has dedicated horizontal scrolling and `min-width: 0` protections.
- Customer search has an explicit `min-width: 0` correction for narrow phones.
- Customer tabs already scroll horizontally.
- Customer health chips have a narrow-phone wrap treatment.
- The Analytics utilization heatmap deliberately scrolls horizontally.
- Inventory rows collapse from their desktop multi-column form at 900px.
- The global desktop navigation now switches to mobile before it reaches the width where it would be clipped. The source comments indicate this was a previously identified issue and has been corrected. 

## Route coverage

The source defines six primary Bask destinations:

1. `/`
2. `/customers`
3. `/marketing`
4. `/insights`
5. `/monitor`
6. `/community`



I also traced these deeper Bask routes:

- `/insights/peers`
- `/insights/activity`
- `/inventory`
- `/inventory/order`
- `/floor`
- `/settings/data-sharing`

Inventory and Analytics share the `l4` visual system. The live browser crawler could not reliably render several of these deep routes and returned its own internal cache error, so I have **not** labelled that as a website bug.

The repository also contains `/book` and `/compass`. Compass is explicitly defined in the source as a separate product with its own chrome rather than part of the Bask application, so I did not mix its visual language into the Bask findings. 

## Fix order I would use

1. **Remove Customers and Marketing duplicate headers.**
2. **Restore a universal mobile/tablet page gutter.**
3. **Put Community inside the standard page container.**
4. **Fix Marketing Builder mobile layout, especially steps and the 300px phone preview.**
5. **Collapse Marketing campaign rows on mobile.**
6. **Create a mobile Marketing calendar treatment.**
7. **Fix the two duplicated Opportunity CTAs.**
8. **Make Analytics sub-tabs horizontally scrollable below their natural width.**
9. **Consolidate page shells and responsive spacing so these problems do not recur.**

The first three changes alone should make the application feel considerably more coherent.