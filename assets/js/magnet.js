/* Magnetische Knöpfe: folgen dem Cursor federnd, schnappen zurück (nur Maus, nicht bei reduzierter Bewegung) – 11.11.2026 */
(function () {
  'use strict';
  if (!matchMedia('(pointer:fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = document.querySelectorAll('.knopf, .kopf .cta, .kopf a.knopf, .bau-link, #kontaktform button[type=submit], #wunschform button[type=submit]');
  els.forEach(function (el) {
    el.classList.add('magnet');
    var r = null, raf = 0, x = 0, y = 0;
    el.addEventListener('pointerenter', function () { r = el.getBoundingClientRect(); el.classList.add('zieht'); });
    el.addEventListener('pointermove', function (ev) {
      if (!r) r = el.getBoundingClientRect();
      x = (ev.clientX - (r.left + r.width / 2)) * .28; y = (ev.clientY - (r.top + r.height / 2)) * .38;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; });
    });
    el.addEventListener('pointerleave', function () { r = null; el.classList.remove('zieht'); el.style.transform = ''; });
  });
})();
