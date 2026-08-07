'use client';

/**
 * Presenter Panel (M0 step 10) — the hidden demo control surface.
 *
 * ⌘⇧D (⌃⇧D off macOS) toggles it; Esc closes. Invisible to normal use and never
 * rendered for an audience unless the presenter asks for it (IMPLEMENTATION_SPEC
 * §0.1). It is mounted in the root layout so every route has it, including routes
 * other lanes add.
 *
 * Skeleton scope for M0: demo clock (advance / reset) · role switch · scenario
 * bookmarks · theme switch · labelled disabled stubs. The guided demo path overlay
 * and `demo:verify` are later.
 */

import { DEMO_ROLES, DEMO_ROLE_LABELS, type DemoRole } from '@bask/api/roles';
import { THEMES, type ThemeName } from '@bask/tokens';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  applyTheme,
  buildScopedHref,
  parseTheme,
  ROLE_PARAM,
  THEME_LABELS,
  THEME_PARAM,
} from '@/lib/demo-scope';
import { SCENARIO_BOOKMARKS, type ScenarioBookmark } from '@/lib/scenario-bookmarks';
import { trpc } from '@/lib/trpc';

const EASTERN_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'UTC', // `virtual_today` is a date column — already calendar-local, no shift.
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function formatClock(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : EASTERN_DATE.format(date);
}

/** ⌘⇧D on macOS, ⌃⇧D elsewhere. Both accepted so a borrowed laptop still works. */
function isToggleChord(event: KeyboardEvent): boolean {
  return (event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'd';
}

export function PresenterPanel() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const role = (searchParams.get(ROLE_PARAM) ?? 'owner') as DemoRole;
  const theme = parseTheme(searchParams.get(THEME_PARAM));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isToggleChord(event)) {
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
        return;
      }
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Keep the document in sync with the URL's theme (STUB until step 8's provider).
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const utils = trpc.useUtils();
  const state = trpc.demo.state.useQuery(undefined, { enabled: open });
  const pending = trpc.demo.pendingControls.useQuery(undefined, { enabled: open });

  const advance = trpc.demo.advance.useMutation({ onSuccess: () => utils.invalidate() });
  const reset = trpc.demo.reset.useMutation({ onSuccess: () => utils.invalidate() });

  const navigate = useCallback(
    (path: string, scope: { role?: DemoRole; theme?: ThemeName }) => {
      router.push(buildScopedHref(path, scope, searchParams as unknown as URLSearchParams));
    },
    [router, searchParams],
  );

  /**
   * The role rides an HTTP header read from `window.location` at request time, not
   * a query key — so nothing refetches on its own when it changes. Invalidating
   * here rather than inside `navigate` is load-bearing: `router.push` is an async
   * transition, so an invalidate fired alongside it refetches under the OLD URL and
   * the panel reports the previous role. This effect runs after the URL is live.
   */
  const firstRoleRender = useRef(true);
  useEffect(() => {
    if (firstRoleRender.current) {
      firstRoleRender.current = false;
      return;
    }
    void utils.invalidate();
  }, [role, utils]);

  const applyBookmark = useCallback(
    async (bookmark: ScenarioBookmark) => {
      await reset.mutateAsync();
      if (bookmark.clockDays > 0) await advance.mutateAsync({ days: bookmark.clockDays });
      navigate(bookmark.path, { role: bookmark.role, theme });
    },
    [advance, navigate, reset, theme],
  );

  if (!open) return null;

  const busy = advance.isPending || reset.isPending;
  const clock = state.data?.clock;
  const dataset = state.data?.dataset;

  return (
    <aside
      role="dialog"
      aria-label="Presenter Panel"
      style={{ colorScheme: 'dark' }}
      className="fixed bottom-4 right-4 z-[9999] w-[22rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-white/15 bg-neutral-950/95 p-4 text-sm text-white shadow-2xl backdrop-blur max-h-[calc(100vh-2rem)]"
    >
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60">
          Presenter Panel
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-white/50 hover:text-white"
        >
          Esc
        </button>
      </header>

      <Section title="Demo clock">
        <p className="font-mono text-base">{formatClock(clock?.virtualToday)}</p>
        <p className="text-xs text-white/50">
          {state.isLoading
            ? 'reading demo_state…'
            : dataset?.seeded
              ? `seed ${clock?.seed ?? '—'}`
              : 'no fixtures yet — clock only (step 4 seeds the dataset)'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <PanelButton disabled={busy} onClick={() => advance.mutate({ days: 1 })}>
            +1 day
          </PanelButton>
          <PanelButton disabled={busy} onClick={() => advance.mutate({ days: 7 })}>
            +7 days
          </PanelButton>
          <PanelButton disabled={busy} onClick={() => reset.mutate()}>
            Reset to day zero
          </PanelButton>
        </div>
      </Section>

      <Section title="Role">
        <div className="flex flex-wrap gap-2">
          {DEMO_ROLES.map((option) => (
            <PanelButton
              key={option}
              active={option === role}
              onClick={() => navigate(pathname, { role: option, theme })}
            >
              {DEMO_ROLE_LABELS[option]}
            </PanelButton>
          ))}
        </div>
        <p className="mt-1 text-xs text-white/50">
          Server sees: <span className="font-mono">{state.data?.scope.role ?? '—'}</span>
        </p>
      </Section>

      <Section title="Scenario bookmarks">
        <div className="flex flex-col gap-2">
          {SCENARIO_BOOKMARKS.map((bookmark) => (
            <button
              key={bookmark.id}
              type="button"
              disabled={busy}
              onClick={() => void applyBookmark(bookmark)}
              className="rounded-lg border border-white/15 px-3 py-2 text-left hover:border-white/40 disabled:opacity-40"
            >
              <span className="block font-medium">{bookmark.label}</span>
              <span className="block text-xs text-white/50">{bookmark.description}</span>
              <span className="block font-mono text-[0.65rem] text-white/35">
                {bookmark.path} · day {bookmark.clockDays} · {DEMO_ROLE_LABELS[bookmark.role]}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Theme">
        <select
          value={theme}
          onChange={(event) => navigate(pathname, { role, theme: event.target.value as ThemeName })}
          className="w-full rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-white"
        >
          {THEMES.map((option) => (
            <option key={option} value={option} className="bg-neutral-900 text-white">
              {THEME_LABELS[option]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-white/50">
          STUB — sets <span className="font-mono">data-theme</span> only until step 8&apos;s
          ThemeProvider lands.
        </p>
      </Section>

      <Section title="Wired later">
        <div className="flex flex-wrap gap-2">
          {(pending.data ?? []).map((control) => (
            <PanelButton key={control.id} disabled>
              {control.label} ({control.availableIn})
            </PanelButton>
          ))}
        </div>
      </Section>

      {(advance.error || reset.error || state.error) && (
        <p className="mt-3 rounded-lg bg-red-500/15 p-2 text-xs text-red-200">
          {advance.error?.message ?? reset.error?.message ?? state.error?.message}
        </p>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 border-t border-white/10 pt-3 first-of-type:border-t-0 first-of-type:pt-0">
      <h3 className="mb-2 text-[0.65rem] font-semibold uppercase tracking-widest text-white/40">
        {title}
      </h3>
      {children}
    </section>
  );
}

function PanelButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-white/70 bg-white/20 font-medium'
          : 'border-white/15 hover:border-white/40'
      }`}
    >
      {children}
    </button>
  );
}
