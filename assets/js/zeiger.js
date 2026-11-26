/* 24H1 (25.11.2026): KEIN Nachläufer-Zeiger mehr. Der Systemzeiger bleibt unangetastet (kein Punkt, kein Ring, kein „Ziehen“-Label hinter der Maus).
   Einziger Rest: ein ruhiger Hinweis „Ziehen“ – genau EINMAL pro Besuch, fest am Eintrittspunkt im Templates-Ring (folgt der Maus nicht),
   weg nach 2,4 s oder sobald gezogen/geklickt/gescrollt wird. Nur Maus, kein Touch, keine Layout-Lesung außer beim Eintreten, keine Dauerschleife. */
(function () {
  'use strict';
  if (!matchMedia('(pointer:fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var welt = document.querySelector('.ring-welt');
  if (!welt) return;
  var gezeigt = false, el = null, uhr = 0;
  function weg() {
    if (uhr) { clearTimeout(uhr); uhr = 0; }
    if (!el) return;
    var e = el; el = null;
    e.classList.remove('an');
    setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 300);
    removeEventListener('wheel', weg); removeEventListener('keydown', weg);
  }
  welt.addEventListener('pointerenter', function (ev) {
    if (gezeigt || ev.pointerType === 'touch') return;
    gezeigt = true;
    var b = welt.getBoundingClientRect();
    el = document.createElement('div');
    el.className = 'zg-hinweis'; el.setAttribute('aria-hidden', 'true'); el.textContent = 'Ziehen';
    var x = Math.min(Math.max(ev.clientX, b.left + 50), b.right - 50), y = Math.min(Math.max(ev.clientY, b.top + 40), b.bottom - 40);
    el.style.left = x + 'px'; el.style.top = (y - 34) + 'px';
    document.body.appendChild(el);
    requestAnimationFrame(function () { if (el) el.classList.add('an'); });
    uhr = setTimeout(weg, 2400);
    addEventListener('wheel', weg, { passive: true, once: true }); addEventListener('keydown', weg, { once: true });
  }, { passive: true });
  welt.addEventListener('pointerdown', weg, { passive: true });
})();
