/* takt.js – EIN gemeinsamer Bild-Takt für die ganze Seite (Häufele Webdesign, 17.11.2026).
   Statt mehrerer Dauer-Schleifen (Lenis, Hintergrund …) läuft genau eine requestAnimationFrame-Schleife.
   Dauer-Aufgaben melden sich mit TAKT.dauer(name, fn) an und mit TAKT.aus(name) ab.
   Tab versteckt = Takt steht komplett still. Ersetzt das frühere Inline-Skript (CSP ohne 'unsafe-inline'). */
/* 26B2 · Viewport-Stabilisator (Handy): Die Safari-Adressleiste klappt beim Scrollen ein/aus und ändert dabei innerHeight + feuert „resize“.
   Daraufhin bauten WebGL-Hintergrund, Film, Partikel u. a. bei jedem Richtungswechsel ihre Flächen neu auf (Flackern, leere Bilder, Springen).
   Jetzt: reine Höhenänderungen unter 260 px bei gleicher Breite (= Leiste) gelten NICHT als Größenänderung; innerHeight bleibt die kleinste gemessene Höhe (= 100svh, wie die Bühnen im CSS). Drehen des Geräts wirkt normal. */
(function () {
  try {
    if (!window.matchMedia || !matchMedia('(pointer:coarse)').matches) return;
    var d = Object.getOwnPropertyDescriptor(window, 'innerHeight'); if (!d || !d.get) return;
    var echt = function () { return d.get.call(window); };
    var bw = window.innerWidth, bh = echt(), stabil = bh;
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: function () { return stabil; } });
    window.addEventListener('resize', function (e) {
      var nw = window.innerWidth, nh = echt();
      if (nw === bw && Math.abs(nh - bh) < 260) { if (nh < stabil) stabil = nh; e.stopImmediatePropagation(); return; }
      bw = nw; bh = nh; stabil = nh;
    }, true);
  } catch (err) { }
})();
document.documentElement.classList.add('js');
window.TAKT = (function () {
  'use strict';
  var aufgaben = {}, liste = [], an = false, id = 0;
  function neu() { liste = Object.keys(aufgaben).map(function (k) { return aufgaben[k]; }); }
  function tick(t) {
    an = false;
    if (document.hidden || !liste.length) return;
    for (var i = 0; i < liste.length; i++) { try { liste[i](t); } catch (e) { if (window.console) console.warn('TAKT', e); } }
    an = true; id = requestAnimationFrame(tick);
  }
  function los() { if (!an && liste.length && !document.hidden) { an = true; id = requestAnimationFrame(tick); } }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (an) { cancelAnimationFrame(id); an = false; } } else los();
  });
  return {
    dauer: function (name, fn) { aufgaben[name] = fn; neu(); los(); },
    aus: function (name) { if (aufgaben[name]) { delete aufgaben[name]; neu(); } if (!liste.length && an) { cancelAnimationFrame(id); an = false; } },
    hat: function (name) { return !!aufgaben[name]; },
    namen: function () { return Object.keys(aufgaben); }
  };
})();
