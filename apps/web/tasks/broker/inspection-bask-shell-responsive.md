# inspection-bask-shell-responsive

## What to build

Write a complete replacement candidate for the existing shell.css, preserving every current rule and design token. Fix only the confirmed tablet/mobile defects: the home b-shell must keep coherent horizontal padding from 320 through 999 pixels instead of placing content on the viewport edge; six bottom-tab labels must remain fully readable at 320 pixels without changing their words or reducing touch targets below 44 pixels; the external feedback widget button with id fw-btn must sit fully above the fixed bottom tab bar including safe-area inset at widths where the tab bar is visible. Preserve desktop layout at 1000 pixels and above. Do not change navigation destinations, labels, business behavior, or any unrelated styling.

## Target file — write EXACTLY this path, and nothing else

`/home/danman60/projects/uvalux-platform/apps/web/src/components/shell/shell.visual.css`

## The API surface you may use

Everything below is REAL and already exists. Import from `./shell.css`.
Do NOT invent names, keys or props that are not in this list — inventing a key
on the shared style object is the single most common way this task fails.

```ts
CONTRACT API SURFACE — `@/lib/contract` exports EXACTLY these. Nothing else exists.
Do NOT reference any symbol or object key that is not on this list.
```
## Follow this exemplar exactly

This file is the approved reference for how this kind of component is written
and styled in this project. Match its structure, its class vocabulary and its
conventions. Deviating from its visual vocabulary is a failure even if the code
compiles.

```tsx
/* Bask app shell — topbar, nav, page grid.
 * Lifted from mockups/01-today-daybreak.html (.topbar/.nav/.shell) and
 * mockups/05-mobile-daybreak.html (.appbar/.tabbar). Tokens only. */

.b-skip {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 60;
  background: var(--card);
  color: var(--ink);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-pop);
  font: 600 var(--text-sm) / 1 var(--font-body);
}
.b-skip:focus {
  left: var(--space-4);
  top: var(--space-4);
}

.b-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* ------------------------------------------------------------------ topbar */

.b-topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: 14px var(--space-10);
  border-bottom: 1px solid var(--line-soft);
  background: oklch(98.2% 0.004 84 / 0.85);
  backdrop-filter: blur(12px);
}

.b-wordmark {
  font: italic 600 22px/1 var(--font-display);
  letter-spacing: -0.01em;
}

.b-nav {
  display: flex;
  gap: 4px;
  margin-left: var(--space-8);
}
.b-nav-pill {
  font: 500 var(--text-sm) / 1 var(--font-body);
  color: var(--ink-faint);
  text-decoration: none;
  padding: 8px 14px;
  border-radius: 999px;
  white-space: nowrap;
  transition: color var(--dur-fast) var(--ease-out);
}
.b-nav-pill:hover {
  color: var(--ink);
}
.b-nav-pill[data-active] {
  color: var(--ink);
  background: var(--paper-2);
  font-weight: 600;
}

.b-topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.b-salon-chip {
  font: 500 var(--text-sm) / 1 var(--font-body);
  color: var(--ink-soft);
  white-space: nowrap;
}
.b-avatar {
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 50%;
  background: var(--primary-wash);
  color: var(--primary-deep);
  display: grid;
  place-items: center;
  font: 700 12px/1 var(--font-body);
}

/* Bottom tab bar exists only at mobile widths. */
.b-tabbar {
  display: none;
}

/* -------------------------------------------------------------- page shell */

.b-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-10);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--space-10);
  align-items: start;
}

@media (max-width: 900px) {
  .b-shell {
    grid-template-columns: 1fr;
  }
}

/* Full-width surfaces (Monitor) own their own internal columns and must not
   inherit the Today rail grid, which would clip a nested two-column layout. */
.b-shell-wide {
  display: block;
}

/* ------------------------------------------------------------------ mobile */
/* mockup 05: appbar is wordmark + avatar only; the six destinations move to a
   fixed glass tab bar so everything stays thumb-reachable.
 *
 * BREAKPOINT IS 999px, NOT 720px. The desktop topbar is wordmark + six nav
 * pills + salon chip + avatar, which needs ~996px to lay out. Stopping the
 * mobile treatment at 720px left 721–999px with no rule that fits: the row
 * simply overflowed, and because html/body are overflow-x:clip the surplus was
 * cut off rather than scrollable. Measured at 768px: 126px lost with five nav
 * pills, 228px once Community made it six. Every tablet and small laptop was
 * losing the right end of the topbar. The mobile treatment now covers every
 * width below the one where the desktop row actually fits. */

@media (max-width: 999px) {
  .b-topbar {
    padding: 18px 20px;
    gap: var(--space-3);
  }
  .b-wordmark {
    font-size: 20px;
  }
  .b-nav,
  .b-salon-chip {
    display: none;
  }
  .b-avatar {
    width: 32px;
    height: 32px;
    font-size: 11px;
  }

  .b-shell {
    padding: 0 0 96px;
    gap: 0;
  }

  .b-tabbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    background: oklch(100% 0 0 / 0.92);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--line-soft);
    padding: 10px 4px calc(10px + env(safe-area-inset-bottom));
  }
  .b-tab {
    text-align: center;
    font: 600 10px/1.1 var(--font-body);
    color: var(--ink-faint);
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 2px;
  }
  .b-tab-ic {
    display: block;
    font-size: 17px;
    margin-bottom: 4px;
  }
  .b-tab[data-active] {
    color: var(--primary-deep);
  }
}

```

## Rules

- Write the target file. Do not create other files.
- Do not modify anything outside the target path.
- Do not leave TODOs, stubs, or placeholder values.
- Do not fix unrelated bugs you notice. Build only what is described above.

## Acceptance gate — you are DONE only when all of these are true

1. `/home/danman60/projects/uvalux-platform/apps/web/src/components/shell/shell.visual.css` exists and is complete.
2. `test -s /home/danman60/projects/uvalux-platform/apps/web/src/components/shell/shell.visual.css && PYTHONPATH=/home/danman60/projects/sysadmin python3 -m broker.vocab /home/danman60/projects/uvalux-platform/apps/web/src/components/shell/shell.css /home/danman60/projects/uvalux-platform/apps/web/src/components/shell/shell.visual.css --contract /home/danman60/projects/uvalux-platform/apps/web/src/components/shell/shell.css` passes with exit code 0.
3. It contains no stub markers, no TODOs, and no placeholder text.

Do not call `done` until the gate command above passes. A green claim with a red
gate is a failure, not a completion.
