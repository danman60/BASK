'use client';

/**
 * Presenter Panel — the hidden demo control surface.
 *
 * ⌘⇧D (⌃⇧D off macOS) toggles it; Esc closes. Invisible to normal use and never
 * rendered for an audience unless the presenter asks for it (IMPLEMENTATION_SPEC
 * §0.1). It is mounted in the root layout so every route has it, including routes
 * other lanes add.
 *
 * Scope: demo clock · role switch · scenario bookmarks · theme · Beat 4's push.
 *
 * A RULE FOR THIS FILE: it may not advertise anything it cannot do. It is opened
 * on stage, in front of the people being pitched, and a greyed-out button labelled
 * with a milestone number is a live admission that the product is unfinished. If a
 * control is not real, it does not appear here. Two things this file used to get
 * wrong, both now fixed:
 *   - it wrote `data-theme` itself while <ThemeProvider> was also writing it, so
 *     the two fought over the Act 2 dark flip. The provider owns that attribute;
 *     this panel now only expresses a preference to it.
 *   - it called `demo.reset` before every bookmark jump and called the result a
 *     reset. It is not one — see the note on `applyBookmark`.
 */

import { DEMO_ROLES, DEMO_ROLE_LABELS, type DemoRole } from '@bask/api/roles';
import { SELECTABLE_THEMES, THEME_LABELS, type SelectableTheme } from '@bask/tokens';
import { useTheme } from '@bask/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { buildScopedHref, ROLE_PARAM } from '@/lib/demo-scope';
import { SCENARIO_BOOKMARKS, type ScenarioBookmark } from '@/lib/scenario-bookmarks';
import { trpc } from '@/lib/trpc';

import { PUSH_PERMISSION_COPY, usePresenterPush } from './usePresenterPush';

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

  /**
   * The ROOT <ThemeProvider> is the only writer of `data-theme` (see the header).
   * `preference` is the salon's own choice; `isForced` is true inside /compass,
   * which pins the Compass theme for as long as that subtree is mounted — that is
   * Act 2's dark flip, and the panel must not fight it.
   */
  const { preference, isForced, theme: paintedTheme, setPreference } = useTheme();

  const push = usePresenterPush();

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

  const utils = trpc.useUtils();
  const state = trpc.demo.state.useQuery(undefined, { enabled: open });

  const advance = trpc.demo.advance.useMutation({ onSuccess: () => utils.invalidate() });
  const rewind = trpc.demo.reset.useMutation({ onSuccess: () => utils.invalidate() });
  const jumpTo = trpc.demo.jumpTo.useMutation({ onSuccess: () => utils.invalidate() });
  const firePush = trpc.demo.firePush.useMutation();

  const navigate = useCallback(
    (path: string, scope: { role?: DemoRole }) => {
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

  const today = state.data?.clock.dayIndex ?? null;

  /**
   * Apply a bookmark. FORWARD ONLY — and this is the honest version.
   *
   * It used to call `demo.reset` first and rely on that to make a bookmark a
   * POSITION rather than a nudge. `demo.reset` moves the clock pointer and
   * nothing else; the rows `advance` wrote (visits, sales, settled campaigns,
   * insights, briefs) survive it. So "reset then advance" replayed the pipeline
   * over days the world had already lived — two clicks of one bookmark landed in
   * two different states, which is precisely the promise a bookmark exists to
   * make.
   *
   * The fix is to stop replaying: `demo.jumpTo` advances only the difference, and
   * refuses to rewind. Consequences, both surfaced in the UI below rather than
   * buried here:
   *   - pressing the same bookmark twice is idempotent (the second press moves
   *     the clock zero days and is a pure navigation);
   *   - jumping BACK to an earlier beat takes you to that screen at the clock's
   *     current day. It does not un-live the week. The only real way back to day
   *     zero is `pnpm demo:reset` at a terminal.
   */
  const applyBookmark = useCallback(
    async (bookmark: ScenarioBookmark) => {
      await jumpTo.mutateAsync({ day: bookmark.clockDays });
      navigate(bookmark.path, { role: bookmark.role });
    },
    [jumpTo, navigate],
  );

  const busy = advance.isPending || rewind.isPending || jumpTo.isPending;
  const clock = state.data?.clock;
  const dataset = state.data?.dataset;
  const lastJump = jumpTo.data;

  return (
    <>
      {push.banner && (
        <PushBanner
          title={push.banner.title}
          body={push.banner.body}
          onDismiss={push.dismissBanner}
        />
      )}

      {open && (
        <aside
          role="dialog"
          aria-label="Presenter Panel"
          style={{ colorScheme: 'dark' }}
          className="fixed inset-x-2 bottom-2 z-[9999] max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain rounded-xl border border-white/15 bg-neutral-950/95 p-3 text-sm text-white shadow-2xl backdrop-blur sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[22rem] sm:max-h-[calc(100dvh-2rem)] sm:p-4"
        >
          <header className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Presenter Panel
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 text-xs text-white/50 hover:text-white"
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
                  ? `day ${today ?? '—'} · seed ${clock?.seed ?? '—'}`
                  : 'no fixtures — run `pnpm demo:reset` at a terminal'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <PanelButton disabled={busy} onClick={() => advance.mutate({ days: 1 })}>
                +1 day
              </PanelButton>
              <PanelButton disabled={busy} onClick={() => advance.mutate({ days: 7 })}>
                +7 days
              </PanelButton>
              <PanelButton disabled={busy} onClick={() => rewind.mutate()}>
                Rewind pointer
              </PanelButton>
            </div>
            <p className="mt-2 text-xs leading-snug text-amber-200/70">
              Rewind moves the date only. The visits, sales and settled campaigns the
              pipeline already wrote stay where they are — advancing again re-runs those
              days on top. A true reset is <span className="font-mono">pnpm demo:reset</span>.
            </p>
          </Section>

          <Section title="Role">
            <div className="flex flex-wrap gap-2">
              {DEMO_ROLES.map((option) => (
                <PanelButton
                  key={option}
                  active={option === role}
                  onClick={() => navigate(pathname, { role: option })}
                >
                  {DEMO_ROLE_LABELS[option]}
                </PanelButton>
              ))}
            </div>
            <p className="mt-1 truncate text-xs text-white/50">
              Server sees: <span className="font-mono">{state.data?.scope.role ?? '—'}</span>
            </p>
          </Section>

          <Section title="Scenario bookmarks">
            <p className="mb-2 text-xs leading-snug text-white/50">
              Forward-only. A bookmark at or behind today’s day {today ?? '—'} just
              navigates — the clock does not rewind.
            </p>
            <div className="flex flex-col gap-2">
              {SCENARIO_BOOKMARKS.map((bookmark) => {
                const behind = today !== null && bookmark.clockDays <= today;
                return (
                  <button
                    key={bookmark.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void applyBookmark(bookmark)}
                    className="rounded-lg border border-white/15 px-3 py-2 text-left hover:border-white/40 disabled:opacity-40"
                  >
                    <span className="block font-medium">{bookmark.label}</span>
                    <span className="block text-xs text-white/50">{bookmark.description}</span>
                    <span className="block break-words font-mono text-[0.65rem] text-white/35">
                      {bookmark.path} · day {bookmark.clockDays} ·{' '}
                      {DEMO_ROLE_LABELS[bookmark.role]}
                      {behind ? ' · navigate only' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
            {lastJump && (
              <p className="mt-2 text-xs text-white/50">
                {lastJump.rewindRefused
                  ? `Clock held at day ${lastJump.clock.dayIndex} — that bookmark is behind us.`
                  : lastJump.movedDays === 0
                    ? `Already at day ${lastJump.clock.dayIndex} — navigated, clock untouched.`
                    : `Ran ${lastJump.movedDays} day${lastJump.movedDays === 1 ? '' : 's'} → day ${lastJump.clock.dayIndex}.`}
              </p>
            )}
          </Section>

          <Section title="Beat 4 — fire push">
            <div className="flex flex-wrap gap-2">
              <PanelButton
                disabled={firePush.isPending}
                onClick={() => firePush.mutate({ href: '/' })}
              >
                {firePush.isPending ? 'Sending…' : 'Fire push'}
              </PanelButton>
              {push.permission !== 'granted' && (
                <PanelButton
                  disabled={push.permission === 'insecure' || push.permission === 'unsupported'}
                  onClick={() => void push.enable()}
                >
                  Enable on this device
                </PanelButton>
              )}
            </div>
            <p className="mt-2 text-xs leading-snug text-white/50">
              {PUSH_PERMISSION_COPY[push.permission]}
            </p>
            <p className="mt-1 text-xs leading-snug text-white/35">
              Reads the campaign the pipeline actually settled. Every open Bask page picks
              it up within ~3s — the page must be open and in front; this is not a locked
              screen wakeup.
            </p>
            {firePush.data && (
              <p className="mt-2 rounded-lg bg-emerald-500/10 p-2 text-xs leading-snug text-emerald-200">
                Sent: {firePush.data.title} — {firePush.data.body}
              </p>
            )}
          </Section>

          <Section title="Theme">
            <select
              value={preference}
              disabled={isForced}
              onChange={(event) => setPreference(event.target.value as SelectableTheme)}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-white disabled:opacity-50"
            >
              {SELECTABLE_THEMES.map((option) => (
                <option key={option} value={option} className="bg-neutral-900 text-white">
                  {THEME_LABELS[option]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs leading-snug text-white/50">
              {isForced
                ? `This route pins ${THEME_LABELS[paintedTheme]} — Act 2’s flip. Your ${THEME_LABELS[preference]} preference returns when you leave.`
                : 'Set on the salon and remembered on this device.'}
            </p>
          </Section>

          {(advance.error || rewind.error || jumpTo.error || firePush.error || state.error) && (
            <p className="mt-3 break-words rounded-lg bg-red-500/15 p-2 text-xs text-red-200">
              {advance.error?.message ??
                rewind.error?.message ??
                jumpTo.error?.message ??
                firePush.error?.message ??
                state.error?.message}
            </p>
          )}
        </aside>
      )}
    </>
  );
}

/**
 * In-page fallback for the push, shown ONLY when the OS notification could not be
 * raised (permission refused, plain http, no Notification API). It carries the
 * same real server event — it is not a decorative stand-in — and it exists so the
 * beat never silently does nothing in front of a room.
 */
function PushBanner({
  title,
  body,
  onDismiss,
}: {
  title: string;
  body: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      style={{ colorScheme: 'dark' }}
      className="fixed inset-x-2 top-2 z-[10000] mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-white/15 bg-neutral-950/95 p-3 text-white shadow-2xl backdrop-blur sm:inset-x-auto sm:left-1/2 sm:top-4 sm:-translate-x-1/2"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-snug text-white/70">{body}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-xs text-white/50 hover:text-white"
      >
        ✕
      </button>
    </div>
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
