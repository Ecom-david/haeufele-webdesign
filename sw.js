/* Häufele Webdesign – Service Worker (26B3-2, 26.11.2026)
   NUR für die Filmbilder (assets/film/d3 + m3): beim Wiederbesuch kommen sie sofort aus dem Speicher des Browsers (GitHub Pages erlaubt keine eigenen Cache-Header, der normale Browser-Cache hält nur 10 Minuten).
   Alles andere (HTML, CSS, JS, Bilder) geht unverändert direkt ans Netz – Änderungen an der Seite sind sofort sichtbar.
   WICHTIG: Ändern sich die Filmbilder bei gleichem Dateinamen, VERSION erhöhen, sonst zeigen Wiederbesucher das alte Bild. */
var VERSION = 'film-26b3-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('film-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin || !/\/assets\/film\/(d3|m3)\/[dm]-\d{4}\.webp$/.test(u.pathname)) return;
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(u.pathname).then(function (hit) {
      if (hit) return hit;
      return fetch(r).then(function (res) { if (res && res.ok) { try { c.put(u.pathname, res.clone()); } catch (x) { } } return res; });
    });
  }));
});
