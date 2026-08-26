/*
 * Bask service worker — notifications ONLY.
 *
 * It exists for one reason: Chrome on Android refuses `new Notification(...)`
 * ("Illegal constructor") and will only raise a notification through
 * `ServiceWorkerRegistration.showNotification()`. The phone in PITCH.md Beat 4 is
 * an Android handset, so without this file the beat cannot fire on the device it
 * is written for.
 *
 * THERE IS NO `fetch` HANDLER, ON PURPOSE. A caching worker in front of a live
 * pitch is a way to serve a stale screen to a room of stakeholders and have no
 * idea why. This worker never intercepts a request; it only owns the
 * notification surface. Do not add one without a very good reason.
 *
 * There is no `push` handler either, because there is no Web Push subscription:
 * that needs VAPID keys and somewhere to store subscriptions, i.e. a new table.
 * Notifications here are raised by the page itself (see usePresenterPush.ts).
 * The honest consequence is written on the panel: the page must be open.
 */

self.addEventListener('install', () => {
  // Take over immediately — a presenter who reloads should not be running the
  // previous worker while they test the notification.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/** Tapping the notification focuses an open Bask tab, or opens the deep link. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(href);
          return client.focus();
        }
      }
      return self.clients.openWindow(href);
    }),
  );
});
