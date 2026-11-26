/* Anfragen häufen sich – echte 2D-Physik (matter.js, MIT, lokal) im Kontakt-Bereich (11.11.2026)
   Karten fallen, stoßen, stapeln sich. Maus schubst/zieht (Desktop). Läuft nur sichtbar, schläft wenn alles liegt. */
(function () {
  'use strict';
  var box = document.getElementById('haufen'); if (!box || !window.Matter) return;
  var RUHE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var M = Matter, E = M.Engine, B = M.Bodies, C = M.Composite, Bo = M.Body;
  var cv = box.querySelector('canvas'), cx = cv.getContext('2d');
  var mobil = matchMedia('(max-width:700px)').matches;
  var DATEN = [
    ['Badsanierung', 'Ulm', '22:34'], ['PV + Speicher', 'Senden', '23:21'], ['Wallbox', 'Neu-Ulm', '06:12'],
    ['Küchenrückwand', 'Blaubeuren', '00:12'], ['Heizungstausch', 'Illertissen', '07:48'], ['Terrasse', 'Erbach', '12:05'],
    ['Zählerschrank', 'Laupheim', '18:40'], ['Einbauschrank', 'Blaustein', '20:17'], ['Dusche bodengleich', 'Weißenhorn', '21:03'],
    ['Fassade', 'Vöhringen', '09:55'], ['Dachfenster', 'Ehingen', '16:30'], ['Wärmepumpe', 'Dornstadt', '19:22'],
    ['Fliesen Flur', 'Illerkirchberg', '13:41'], ['Smart Home', 'Langenau', '22:58']
  ];
  var n = mobil ? 8 : 11, W, H, dpr, eng, karten = [], waende = [], lauft = false, gestartet = false, ruheZeit = 0, maus = null, gezogen = null, mausT = 0; /* 20N-FIX2: Maus zählt nur, solange sie sich bewegt (sonst schläft die Physik) */
  function setup() {
    var r = box.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, (innerWidth < 760 ? 1.25 : 1.5));
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  function kw() { return Math.min(250, W * (mobil ? .6 : .72)); }
  function start() {
    if (gestartet) return; gestartet = true; setup();
    eng = E.create({ enableSleeping: true }); eng.gravity.y = 1.05;
    var d = 200;
    waende = [B.rectangle(W / 2, H + d / 2, W * 3, d, { isStatic: true, friction: .9 }),
      B.rectangle(-d / 2, H / 2 - 400, d, H * 3, { isStatic: true }), B.rectangle(W + d / 2, H / 2 - 400, d, H * 3, { isStatic: true })];
    C.add(eng.world, waende);
    var w = kw(), h = w * .3;
    for (var i = 0; i < n; i++) (function (i) {
      setTimeout(function () {
        var k = B.rectangle(W * (.2 + Math.random() * .6), -h - 20, w, h, { chamfer: { radius: 10 }, restitution: .18, friction: .55, frictionAir: .012, density: .0016, angle: (Math.random() - .5) * .9 });
        Bo.setAngularVelocity(k, (Math.random() - .5) * .12);
        k.daten = DATEN[i]; k.w = w; k.h = h; k.neu = 1; karten.push(k); C.add(eng.world, k); weck();
      }, RUHE ? 0 : 260 + i * 330);
    })(i);
    if (RUHE) { for (var t = 0; t < 600; t++) E.update(eng, 1000 / 60); malen(); }
    else weck();
  }
  function karte(k) {
    var w = k.w, h = k.h, r = 10;
    cx.save(); cx.translate(k.position.x * dpr, k.position.y * dpr); cx.rotate(k.angle); cx.scale(dpr, dpr);
    cx.beginPath(); cx.roundRect(-w / 2, -h / 2, w, h, r);
    var g = cx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#1d1e21'); g.addColorStop(1, '#0c0d0f');
    cx.fillStyle = g; cx.fill();
    cx.lineWidth = 1; cx.strokeStyle = k === gezogen ? 'rgba(243,242,239,.7)' : 'rgba(243,242,239,.16)'; cx.stroke();
    cx.fillStyle = '#7CE38B'; cx.beginPath(); cx.arc(-w / 2 + 16, -h / 2 + 17, 4, 0, 6.3); cx.fill();
    cx.textBaseline = 'middle';
    var f1 = Math.round(h * .26); cx.font = 'italic 800 ' + f1 + 'px "Archivo Wide", sans-serif';
    while (cx.measureText(k.daten[0]).width > w - 44 && f1 > 9) { f1--; cx.font = 'italic 800 ' + f1 + 'px "Archivo Wide", sans-serif'; }
    cx.fillStyle = '#f3f2ef'; cx.fillText(k.daten[0], -w / 2 + 28, -h / 2 + 17);
    var z = k.daten[1] + ' · ' + k.daten[2], f2 = Math.round(h * .2); cx.font = '600 ' + f2 + 'px ui-monospace, Menlo, monospace';
    while (cx.measureText(z).width > w - 32 && f2 > 8) { f2--; cx.font = '600 ' + f2 + 'px ui-monospace, Menlo, monospace'; }
    cx.fillStyle = 'rgba(243,242,239,.6)'; cx.fillText(z, -w / 2 + 16, h / 2 - 14);
    cx.restore();
  }
  function malen() { cx.clearRect(0, 0, cv.width, cv.height); for (var i = 0; i < karten.length; i++) karte(karten[i]); }
  var t0 = 0;
  function schritt(t) {
    if (!sicht) { lauft = false; return; }
    var dt = t0 ? Math.min(32, t - t0) : 16.7; t0 = t;
    var mAkt = !!maus && (!!gezogen || performance.now() - mausT < 1200);
    if (mAkt && !gezogen) {
      for (var i = 0; i < karten.length; i++) {
        var k = karten[i], dx = k.position.x - maus.x, dy = k.position.y - maus.y, d2 = dx * dx + dy * dy;
        if (d2 < 9000) { M.Sleeping.set(k, false); Bo.applyForce(k, k.position, { x: dx / Math.sqrt(d2 + 1) * .012 * k.mass, y: -0.018 * k.mass }); }
      }
    }
    if (gezogen && maus) { Bo.setVelocity(gezogen, { x: (maus.x - gezogen.position.x) * .3, y: (maus.y - gezogen.position.y) * .3 }); Bo.setAngularVelocity(gezogen, gezogen.angularVelocity * .9); }
    E.update(eng, dt);
    malen();
    var alleRuhig = karten.length === n && karten.every(function (k) { return k.isSleeping || (k.speed < 0.12 && Math.abs(k.angularSpeed) < 0.006); }); /* 20N-FIX2: Ruhe nach Bewegung, nicht nach Bildanzahl */
    ruheZeit = alleRuhig && !mAkt ? ruheZeit + dt : 0;
    if (ruheZeit > 800) { lauft = false; t0 = 0; return; }
    requestAnimationFrame(schritt);
  }
  function weck() { if (!lauft && sicht && gestartet) { lauft = true; t0 = 0; requestAnimationFrame(schritt); } }
  var sicht = false;
  new IntersectionObserver(function (e) { sicht = e[0].isIntersecting; if (sicht) { start(); weck(); } }, { threshold: .35 }).observe(box);
  if (matchMedia('(pointer:fine)').matches) {
    function pos(ev) { var r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
    cv.addEventListener('pointermove', function (ev) { maus = pos(ev); mausT = performance.now(); weck(); });
    cv.addEventListener('pointerleave', function () { maus = null; gezogen = null; });
    cv.addEventListener('pointerdown', function (ev) {
      maus = pos(ev); mausT = performance.now(); var hit = M.Query.point(karten, maus)[0];
      if (hit) { gezogen = hit; M.Sleeping.set(hit, false); cv.setPointerCapture(ev.pointerId); weck(); }
    });
    addEventListener('pointerup', function () { gezogen = null; });
  }
  addEventListener('resize', function () { if (!gestartet) return; var w0 = W; setup(); if (Math.abs(W - w0) > 40) { C.clear(eng.world, false); karten = []; gestartet = false; start(); } else malen(); });
})();
