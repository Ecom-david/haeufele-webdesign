/* ICH – Chrom wird Mensch. Scroll-Szene direkt nach dem Hero.
   Referenz-Idee: Licht-Scan / Material-Wechsel (Effekt-Labor „linie“), Chrom-Look aus dem eigenen Branding. */
(function () {
  var sec = document.getElementById('ich'); if (!sec) return;
  var fig = sec.querySelector('.ich-figur'), st = sec.style;
  var vScan = document.getElementById('ich-scan'), vMat = document.getElementById('ich-mat'), vStat = document.getElementById('ich-stat'), mk = sec.querySelector('.ich-marke');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function c(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function e(x) { x = c(x); return x * x * (3 - 2 * x); }
  function r(a, b, x) { return c((x - a) / (b - a)); }
  if (reduce) { st.setProperty('--s', 1); st.setProperty('--auf', 1); st.setProperty('--ich-txt', 1); st.setProperty('--ich-wort', 1); return; }

  var mx = 0, my = 0, tx = 0, ty = 0, sicht = false, laeuft = false, alt = '';
  addEventListener('pointermove', function (ev) {
    if (!sicht || ev.pointerType === 'touch') return;
    tx = (ev.clientX / innerWidth - .5) * 2; ty = (ev.clientY / innerHeight - .5) * 2; an();
  }, { passive: true });

  /* 21H1F: Maße nur bei Laden/Größenänderung lesen – im Bild-Takt keine getBoundingClientRect (erzwang Layout nach jedem CSS-Variablen-Schreiben) */
  var sTop = 0, sH = 1;
  function messen() { sTop = sec.getBoundingClientRect().top + scrollY; sH = sec.offsetHeight; }
  messen(); addEventListener('load', function () { messen(); an(); }); addEventListener('resize', messen);
  if (window.ResizeObserver) new ResizeObserver(function () { messen(); }).observe(document.body);
  function bild() {
    laeuft = false;
    var b = { top: sTop - scrollY, height: sH }, vh = innerHeight;
    var ein = e(r(vh * .85, 0, b.top));                       // Einflug während der Hero wegscrollt
    var p = c(-b.top / Math.max(1, b.height - vh));           // Fortschritt im festen Teil
    var s = e(r(.12, .72, p));
    mx += (tx - mx) * .12; my += (ty - my) * .12;
    var ry = (1 - ein) * 16 + mx * 5, rx = -my * 3.5;
    var sweep = r(0, .2, p) + (1 - ein) * 0;
    var vals = [
      ['--auf', (.04 + ein * .96).toFixed(3)], ['--s', s.toFixed(4)], ['--sweep', sweep.toFixed(3)],
      ['--lin', (s > 0.001 && s < .999 ? 1 : 0)], ['--ich-wort', e(r(.6, .74, p)).toFixed(3)], ['--ich-txt', e(r(.68, .86, p)).toFixed(3)],
      ['--ry', ry.toFixed(2) + 'deg'], ['--rx', rx.toFixed(2) + 'deg'],
      ['--gx', (55 + mx * 30).toFixed(1) + '%'], ['--gy', (30 + my * 25).toFixed(1) + '%']
    ];
    var key = vals.map(function (v) { return v[1]; }).join('|');
    if (key !== alt) {
      alt = key;
      for (var i = 0; i < vals.length; i++) st.setProperty(vals[i][0], vals[i][1]);
      var pz = ('00' + Math.round(s * 100)).slice(-3) + ' %';
      vScan.textContent = pz; mk.textContent = 'SCAN ' + pz;
      vMat.textContent = s < .02 ? 'Chrom' : s > .98 ? 'Mensch' : 'Chrom → Mensch';
      vStat.textContent = s > .98 ? 'Ich bin’s' : s > .02 ? 'Scanne …' : 'Bereit';
    }
    if (sicht && (Math.abs(tx - mx) > .002 || Math.abs(ty - my) > .002)) an();
  }
  function an() { if (!laeuft) { laeuft = true; requestAnimationFrame(bild); } }
  addEventListener('scroll', function () { if (sicht) an(); }, { passive: true });
  addEventListener('resize', an);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { sicht = es[0].isIntersecting; if (sicht) an(); }, { rootMargin: '20% 0px' }).observe(sec);
  else { sicht = true; }
  an();
})();
