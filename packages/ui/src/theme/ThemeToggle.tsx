'use client';

import { SELECTABLE_THEMES, THEME_LABELS } from '@bask/tokens';
import { useTheme } from './ThemeProvider';

/**
 * Sunset ↔ Dusk switch. Only the salon-selectable themes appear — Compass is pinned
 * by route and is never a choice, so it is not offered here.
 *
 * Disabled while a route forces a theme, with the reason stated rather than the
 * control silently doing nothing.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference, isForced } = useTheme();

  return (
    <div
      className={className}
      role="radiogroup"
      aria-label="Appearance"
      style={{ display: 'inline-flex', gap: 'var(--space-2)' }}
    >
      {SELECTABLE_THEMES.map((name) => {
        const selected = preference === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={isForced}
            onClick={() => setPreference(name)}
            className={selected ? 'btn btn-primary' : 'btn btn-quiet'}
            title={isForced ? 'This screen always uses the Compass look' : undefined}
            style={isForced ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
          >
            {THEME_LABELS[name]}
          </button>
        );
      })}
    </div>
  );
}
