/* Employee Experience App phone alerts (Nov 13 2026). Firebase Cloud Messaging delivers a data message; this shows it
   as a banner. Tapping it opens the person's own app (her private link is kept in this phone's cache by the app). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { const p = e.data ? e.data.json() : {}; d = p.data || p.notification || p; } catch (_) {}
  const title = d.title || 'Taffeta';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || 'Open your app to see it.',
    icon: 'briefing/icons/employee-experience-180.png', badge: 'icon.png',
    tag: 'guest-' + Date.now(), renotify: true, data: { tab: d.tab || 'home' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = wins.find(w => /#s\./.test(w.url));
    if (open) { await open.focus(); return; }
    let url = self.registration.scope;
    try { const c = await caches.open('tp-app'), r = await c.match('me'); if (r) url = await r.text(); } catch (_) {}
    await self.clients.openWindow(url);
  })());
});
