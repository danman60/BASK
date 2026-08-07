'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_THEME,
  SELECTABLE_THEMES,
  isThemeName,
  readableForeground,
  shiftLightness,
  type SelectableTheme,
  type ThemeName,
} from '@bask/tokens';

/**
 * Bask ThemeProvider — architecture adapted from CompPortal's TenantThemeProvider.
 *
 * WHAT WAS CARRIED OVER
 *   - CSS vars written imperatively onto the document root, so a theme change is a
 *     repaint and never a React re-render of the tree.
 *   - WCAG-COMPUTED foreground pairs for user-configurable brand colour. CompPortal
 *     learned that a brand colour without a computed `--on-*` partner produces
 *     unreadable buttons the moment a tenant picks something light; the label colour
 *     is derived, never assumed (`readableForeground`, from @bask/tokens).
 *   - Their day-mode lesson, generalised. CompPortal shipped a bug where clearing
 *     inline vars for a light mode also cleared the BRAND button vars, so every
 *     primary button in the app fell back to the stock palette across 66 files. The
 *     root cause is that inline styles out-specify stylesheet rules, so they had to
 *     clear some vars and keep others — an error-prone split.
 *     Bask avoids the whole class of bug: THEMES ARE STYLESHEET-ONLY. Switching a
 *     theme sets one attribute (`data-theme`), and the [data-theme] blocks in
 *     @bask/tokens do the work. The ONLY inline vars ever written are the per-salon
 *     brand colour and its derived partners — values no stylesheet declares — so
 *     there is nothing for an inline value to out-specify and nothing to clear.
 *
 * WHAT WAS DELIBERATELY DROPPED
 *   - Feature-flag gating. Themes here are a plain per-salon setting (IMPLEMENTATION
 *     _SPEC §4.1 says so explicitly). No flag resolver, no gated var set.
 *   - Tenant fetching. M0 persists to localStorage; the salon setting moves to the DB
 *     when settings land.
 */

/** Brand colour a salon can set in Settings → Branding. Salon CONTENT, not app theme. */
export interface SalonBrand {
  /** any CSS colour @bask/tokens can parse — hex or oklch() */
  color: string;
}

interface ThemeContextValue {
  /** what is actually painted right now, including a route-forced Compass */
  theme: ThemeName;
  /** the salon's own choice — unchanged by a forced route */
  preference: SelectableTheme;
  /** true while a route is pinning the theme (i.e. inside /compass) */
  isForced: boolean;
  setPreference: (theme: SelectableTheme) => void;
  /** internal: used by <ForcedTheme> to pin/unpin */
  pushForced: (theme: ThemeName) => void;
  popForced: (theme: ThemeName) => void;
  brand: SalonBrand | null;
  setBrand: (brand: SalonBrand | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const THEME_STORAGE_KEY = 'bask.theme';

/**
 * Derive the brand var set from a single salon-chosen colour.
 *
 * `--brand-on` is measured against the brand itself rather than picked off a fixed
 * luminance threshold, and the candidate list includes the product's own ink so a
 * pale brand gets warm ink rather than pure black (DESIGN_SPEC §2.1 bans pure
 * white/black as surfaces).
 */
export function resolveBrandVars(brand: SalonBrand | null): Record<string, string> {
  if (!brand?.color) return {};
  const ink = 'oklch(21% 0.012 320)';
  const paper = 'oklch(98.2% 0.004 84)';
  const { color: on } = readableForeground(brand.color, [paper, ink]);
  return {
    '--brand': brand.color,
    '--brand-on': on,
    '--brand-deep': shiftLightness(brand.color, -0.08),
    '--brand-wash': shiftLightness(brand.color, 0.3),
  };
}

/** Names of every var this provider is allowed to write. Nothing else is touched. */
const BRAND_VARS = ['--brand', '--brand-on', '--brand-deep', '--brand-wash'] as const;

function applyBrandVars(brand: SalonBrand | null): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const vars = resolveBrandVars(brand);
  for (const name of BRAND_VARS) {
    const value = vars[name];
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  }
}

function readStoredPreference(storageKey: string): SelectableTheme | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw && isThemeName(raw) && (SELECTABLE_THEMES as readonly string[]).includes(raw)) {
      return raw as SelectableTheme;
    }
  } catch {
    // private mode / disabled storage — fall back to the default, never throw
  }
  return null;
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** Salon's persisted theme, when the server already knows it. */
  defaultTheme?: SelectableTheme;
  /** Pin a theme for this whole subtree regardless of preference. */
  forcedTheme?: ThemeName;
  storageKey?: string;
  initialBrand?: SalonBrand | null;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME as SelectableTheme,
  forcedTheme,
  storageKey = THEME_STORAGE_KEY,
  initialBrand = null,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<SelectableTheme>(defaultTheme);
  const [brand, setBrandState] = useState<SalonBrand | null>(initialBrand);
  // A stack, not a boolean: nested forced scopes unwind in order, so leaving an
  // inner scope restores the outer one instead of dropping straight to preference.
  const [forcedStack, setForcedStack] = useState<ThemeName[]>(forcedTheme ? [forcedTheme] : []);

  // Hydrate from storage after mount. Reading localStorage during render would
  // desync server and client HTML; the pre-paint script below covers the flash.
  useEffect(() => {
    const stored = readStoredPreference(storageKey);
    if (stored) setPreferenceState(stored);
  }, [storageKey]);

  const routeForced = forcedTheme ?? forcedStack[forcedStack.length - 1];
  const theme: ThemeName = routeForced ?? preference;

  // One attribute. The [data-theme] blocks in @bask/tokens do the rest — see the
  // header note on why this deliberately avoids CompPortal's inline-var approach.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    applyBrandVars(brand);
  }, [brand]);

  const setPreference = useCallback(
    (next: SelectableTheme) => {
      setPreferenceState(next);
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // non-persisting environments still get the live switch
      }
    },
    [storageKey]
  );

  const pushForced = useCallback((next: ThemeName) => {
    setForcedStack((prev) => [...prev, next]);
  }, []);

  const popForced = useCallback((next: ThemeName) => {
    setForcedStack((prev) => {
      const i = prev.lastIndexOf(next);
      if (i === -1) return prev;
      return [...prev.slice(0, i), ...prev.slice(i + 1)];
    });
  }, []);

  const setBrand = useCallback((next: SalonBrand | null) => setBrandState(next), []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      preference,
      isForced: routeForced !== undefined,
      setPreference,
      pushForced,
      popForced,
      brand,
      setBrand,
    }),
    [theme, preference, routeForced, setPreference, pushForced, popForced, brand, setBrand]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a <ThemeProvider>');
  return ctx;
}

/**
 * Pin a theme for as long as this component is mounted, then release it.
 *
 * Render it inside a route segment's layout — `<ForcedTheme theme="compass" />` in the
 * /compass tree — and every surface below renders Compass no matter what the salon
 * picked. Unmounting on navigation restores their choice automatically, which is why
 * this is a mounted component rather than a one-shot call.
 */
export function ForcedTheme({ theme }: { theme: ThemeName }) {
  const { pushForced, popForced } = useTheme();
  useEffect(() => {
    pushForced(theme);
    return () => popForced(theme);
  }, [theme, pushForced, popForced]);
  return null;
}

/**
 * Pre-paint theme script. Sets data-theme from localStorage before first paint so a
 * Dusk salon never sees a white flash. Render inside <head>; it must stay a bare
 * string so it runs synchronously and blocks paint.
 */
export function ThemeScript({
  storageKey = THEME_STORAGE_KEY,
  defaultTheme = DEFAULT_THEME,
  forcedTheme,
}: {
  storageKey?: string;
  defaultTheme?: ThemeName;
  forcedTheme?: ThemeName;
}) {
  const js = forcedTheme
    ? `document.documentElement.dataset.theme=${JSON.stringify(forcedTheme)}`
    : `try{var t=localStorage.getItem(${JSON.stringify(storageKey)});` +
      `document.documentElement.dataset.theme=(t==='sunset'||t==='dusk')?t:${JSON.stringify(defaultTheme)}}` +
      `catch(e){document.documentElement.dataset.theme=${JSON.stringify(defaultTheme)}}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
