/* Taffeta Weddings phone alerts. Firebase Cloud Messaging delivers a data message; this shows it as a
   banner, and tapping it opens the app on the right tab (job offers or the schedule). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { const p = e.data ? e.data.json() : {}; d = p.data || p.notification || p; } catch (_) {}
  const title = d.title || 'Taffeta Weddings';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || 'Open the app to see what changed.',
    icon: 'icon-192.png', badge: 'icon-192.png',
    tag: (d.tab || 'team') + '-' + title, renotify: true,
    data: { tab: d.tab || 'team' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const tab = (e.notification.data && e.notification.data.tab) || 'team';
  const url = new URL('./?tab=' + encodeURIComponent(tab), self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = wins.find(w => w.url.startsWith(self.registration.scope));
    if (open) { await open.focus(); open.postMessage({ tw: 'tab', tab }); return; }
    await self.clients.openWindow(url);
  })());
});
