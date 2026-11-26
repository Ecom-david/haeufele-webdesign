/* Riesenwort-Bänder: Position folgt dem Scroll (gegenläufig je Band), Schräglage aus Scroll-Geschwindigkeit, federt zurück. */
(function () {
  'use strict';
  var b = [].slice.call(document.querySelectorAll('.riesen')); if (!b.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var G = b.map(function () { return { top: 0, h: 1, sw: 0 }; });
  function messen() { var y0 = scrollY; b.forEach(function (el, i) { G[i].top = el.getBoundingClientRect().top + y0; G[i].h = el.offsetHeight; G[i].sw = el.firstElementChild.scrollWidth; }); }
  messen(); addEventListener('load', messen); addEventListener('resize', messen);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(messen);
  if (window.ResizeObserver) new ResizeObserver(messen).observe(document.body);
  var sicht = new Set(), lauft = false, lastY = scrollY, v = 0, skew = 0, rl = 0;
  function bild(t) {
    /* 20N-FIX2: zeitbasiert (bei 60 Hz wie vorher .2 / .15 pro Bild) – klingt bei jeder Bildrate gleich schnell aus */
    var dt = rl && t ? Math.min(100, Math.max(1, t - rl)) : 16.7; rl = t || 0;
    var y = scrollY; v += ((y - lastY) * 16.7 / dt - v) * (1 - Math.exp(-dt / 75)); lastY = y;
    skew += (Math.max(-14, Math.min(14, -v * .35)) - skew) * (1 - Math.exp(-dt / 103));
    var rs = b.map(function (el, i) { return sicht.has(el) ? [{ top: G[i].top - y, height: G[i].h }, G[i].sw] : null; }); /* 21H1F: gecachte Maße statt Layout-Lesung je Bild */
    b.forEach(function (el, i) {
      if (!rs[i]) return;
      var r = rs[i][0], z = el.firstElementChild;
      var pr = (innerHeight - r.top) / (innerHeight + r.height); // 0..1
      var weite = rs[i][1] - innerWidth;
      var x = i % 2 ? -weite * (1 - pr) * .6 : -weite * pr * .6;
      z.style.setProperty('--rx', x.toFixed(1) + 'px'); z.style.setProperty('--rs', skew.toFixed(2) + 'deg');
    });
    if (sicht.size && (Math.abs(v) > .05 || Math.abs(skew) > .05)) requestAnimationFrame(bild); else { lauft = false; rl = 0; v = 0; skew = 0; b.forEach(function (el) { if (sicht.has(el)) el.firstElementChild.style.setProperty('--rs', '0deg'); }); }
  }
  function an() { if (!lauft && sicht.size) { lauft = true; requestAnimationFrame(bild); } }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? sicht.add(e.target) : sicht.delete(e.target); }); an(); });
  b.forEach(function (el) { io.observe(el); });
  addEventListener('scroll', an, { passive: true });
})();
