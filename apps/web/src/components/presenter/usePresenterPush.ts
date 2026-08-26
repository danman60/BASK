'use client';

/**
 * Beat 4's buzz (PITCH.md:47 — "The phone — still near Nick — buzzes").
 *
 * WHAT ACTUALLY HAPPENS
 *   1. The presenter hits "Fire push" in the Presenter Panel.
 *   2. `demo.firePush` reads the campaign the pipeline really settled and writes
 *      ONE row to `bask.app_log` with its real bookings/revenue.
 *   3. Every open Bask page — this hook is mounted by the root-level Presenter
 *      Panel, so that means every route on every device — polls `demo.latestPush`
 *      and notices a new row id.
 *   4. That page vibrates the handset and raises a real OS notification through
 *      the service worker.
 *
 * WHY A POLL AND NOT A SOCKET
 *   Supabase Realtime is already proven in this repo (`server/floor/realtime.ts`)
 *   and would have been the obvious transport — but it needs
 *   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and those are
 *   not set in this workspace: `/floor` currently server-renders
 *   `realtimeUrl: null` and falls back to its own poll for exactly this reason.
 *   Building the pitch's most theatrical beat on a transport that is dark in the
 *   place it gets rehearsed is how a demo dies on stage. A 3s poll over the tRPC
 *   link that every other query already uses works everywhere the app works. If
 *   the Supabase vars land later, swapping the trigger is a few lines here and
 *   nothing else changes.
 *
 * WHAT IT CANNOT DO — say this to the presenter, it matters
 *   - The receiving page must be OPEN and the browser in the foreground. This is
 *     not Web Push; there is no server-initiated wakeup. A locked phone or a
 *     backgrounded tab gets nothing (mobile browsers suspend timers).
 *   - It needs a SECURE CONTEXT. `https://` or `localhost`. A phone pointed at
 *     `http://192.168.x.x:3417` has no Notification API at all — for a device
 *     test, use the HTTPS deploy.
 *   - Permission must have been granted ON THAT DEVICE, once, from the panel.
 *   - Older rows never re-fire: the first poll after load only records where the
 *     log is, so opening a page an hour later does not replay Beat 4.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { trpc } from '@/lib/trpc';

/** How often an open page asks whether a push landed. */
const POLL_MS = 3000;

const VIBRATE_PATTERN = [180, 90, 180];

export type PushPermission = 'unsupported' | 'insecure' | 'default' | 'granted' | 'denied';

export interface PresenterPush {
  id: string;
  title: string;
  body: string;
  href: string;
}

function readPermission(): PushPermission {
  if (typeof window === 'undefined') return 'unsupported';
  // `isSecureContext` is the thing that actually gates the API, and it is the
  // failure a presenter will hit first (phone → laptop IP over plain http).
  if (!window.isSecureContext) return 'insecure';
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  return Notification.permission as 'default' | 'granted' | 'denied';
}

/**
 * Raise the notification. Returns false when nothing visible happened, so the
 * caller can fall back to an in-page banner instead of silently doing nothing.
 */
async function raise(push: PresenterPush): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Buzz first and unconditionally: `vibrate` needs neither permission nor a
  // service worker, so on an Android handset with the tab open the phone shakes
  // even if notifications were refused.
  try {
    navigator.vibrate?.(VIBRATE_PATTERN);
  } catch {
    // desktop / unsupported — the notification is the point, not the buzz
  }

  if (readPermission() !== 'granted') return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(push.title, {
      body: push.body,
      // One tag + renotify: a second push replaces the first in the shade rather
      // than stacking, and still buzzes.
      tag: 'bask-presenter-push',
      renotify: true,
      requireInteraction: false,
      icon: '/notification-icon.png',
      badge: '/notification-icon.png',
      data: { href: push.href },
    } as NotificationOptions);
    return true;
  } catch {
    // Android Chrome throws on `new Notification`, so there is no second attempt
    // worth making here — fall through to the banner.
    return false;
  }
}

export interface PresenterPushState {
  permission: PushPermission;
  /** Set only when the OS notification could NOT be shown — render it in-page. */
  banner: PresenterPush | null;
  dismissBanner: () => void;
  /** Prompts for permission and registers the worker. Must be user-gesture driven. */
  enable: () => Promise<void>;
  /** True once `/sw.js` is controlling this page. */
  workerReady: boolean;
}

export function usePresenterPush(): PresenterPushState {
  const [permission, setPermission] = useState<PushPermission>('unsupported');
  const [workerReady, setWorkerReady] = useState(false);
  const [banner, setBanner] = useState<PresenterPush | null>(null);

  // Register on mount. Registration alone never prompts — only `requestPermission`
  // does — so this is free, and it means the worker is warm before the presenter
  // reaches for the button mid-demo.
  useEffect(() => {
    setPermission(readPermission());
    if (typeof window === 'undefined' || !window.isSecureContext) return;
    if (!('serviceWorker' in navigator)) return;

    let alive = true;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        if (alive) setWorkerReady(true);
      })
      .catch(() => {
        if (alive) setWorkerReady(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const latest = trpc.demo.latestPush.useQuery(undefined, {
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  /**
   * The id this device has already dealt with. Primed from the FIRST successful
   * poll rather than from nothing, so loading a page long after a push does not
   * replay it — only a genuinely new row fires.
   */
  const seenId = useRef<string | null>(null);
  const primed = useRef(false);

  const data = latest.data;
  useEffect(() => {
    if (latest.isPending) return;

    // `null` is a valid answer (no push has ever been fired) and still primes.
    if (!primed.current) {
      primed.current = true;
      seenId.current = data?.id ?? null;
      return;
    }
    if (!data || data.id === seenId.current) return;
    seenId.current = data.id;

    const push: PresenterPush = {
      id: data.id,
      title: data.title,
      body: data.body,
      href: data.href,
    };
    void raise(push).then((shown) => {
      if (!shown) setBanner(push);
    });
  }, [data, latest.isPending]);

  const enable = useCallback(async () => {
    const current = readPermission();
    if (current === 'unsupported' || current === 'insecure') {
      setPermission(current);
      return;
    }
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);
      await navigator.serviceWorker.ready;
      setWorkerReady(true);
    } catch {
      setPermission(readPermission());
    }
  }, []);

  const dismissBanner = useCallback(() => setBanner(null), []);

  return { permission, banner, dismissBanner, enable, workerReady };
}

/** One plain-language line about what this device will actually do. */
export const PUSH_PERMISSION_COPY: Record<PushPermission, string> = {
  granted: 'This device will show a notification and buzz while a Bask page is open.',
  default: 'Not enabled on this device yet — tap Enable, then accept the prompt.',
  denied: 'Notifications are blocked for this site. It will show an on-screen banner instead.',
  insecure:
    'No notifications over plain http. Open the https deploy (or localhost) on this device.',
  unsupported: 'This browser has no Notification API. It will show an on-screen banner instead.',
};
