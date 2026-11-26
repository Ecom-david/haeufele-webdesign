/* 24H1 (25.11.2026): Handy-Sperrbildschirm des Films als scharfe Canvas-Zeichnung in nativer Auflösung (statt ins Filmbild eingebackener 1080p-Text).
   Deckt den Bildschirm des Handys im Film (Filmbilder 375–519, Kamera steht still) exakt ab. Geometrie aus dem 4K-Master gemessen (Pixel in 3840×2160):
   Bildschirm x 1769–2489, y 263–1846. Inhalt/Texte identisch zu den eingebackenen (und zur HTML-Liste auf dem Handy). Kein Netz, keine Bilder. */
(function () {
  var SW = 720, SH = 1583, X0 = 1769, Y0 = 263, R = 66, FW = 3840, FH = 2160;
  var FEN = [
    { a: [[374, 0], [375, .68], [376, 1], [407, 1], [408, .12], [409, 0]], uhr: '22:34', tag: 'Mittwoch, 4. November', akku: 41, k: [0] },
    { a: [[428, 0], [429, .68], [430, 1], [461, 1], [462, .12], [463, 0]], uhr: '23:21', tag: 'Mittwoch, 4. November', akku: 38, k: [1, 0] },
    { a: [[482, 0], [483, .66], [484, 1], [519, 1], [520, .12], [521, 0]], uhr: '00:12', tag: 'Donnerstag, 5. November', akku: 35, k: [2, 1, 0] }
  ];
  var KARTEN = [
    { t: 'Neue Anfrage: Badsanierung', z: ['Kundin aus Neu-Ulm · Bad 8 m²,', 'bodengleiche Dusche · 3 Fotos angehängt'] },
    { t: 'Neue Anfrage: Terrasse', z: ['Kunde aus Senden · 42 m² Feinsteinzeug auf', 'Stelzlager · Wann passt ein Aufmaß?'] },
    { t: 'Neue Anfrage: Küchenrückwand', z: ['Kundin aus Blaubeuren · Großformat', '120 × 60 cm · Start ab Januar möglich'] }
  ];
  var ZEIT = [['jetzt'], ['jetzt', 'vor 47 Min.'], ['jetzt', 'vor 51 Min.', 'vor 1 Std.']];
  var FONT = '"Archivo Wide","Archivo",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif';
  var cache = [null, null, null], cacheK = 0;
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function alpha(pts, f) {
    if (f <= pts[0][0] || f >= pts[pts.length - 1][0]) return 0;
    for (var i = 1; i < pts.length; i++) if (f <= pts[i][0]) { var p = pts[i - 1], q = pts[i]; return p[1] + (q[1] - p[1]) * (f - p[0]) / (q[0] - p[0]); }
    return 0;
  }
  function bauen(n, k) {
    var F = FEN[n], cv = document.createElement('canvas'); cv.width = Math.max(2, Math.round(SW * k)); cv.height = Math.max(2, Math.round(SH * k));
    var c = cv.getContext('2d'); c.scale(cv.width / SW, cv.height / SH);
    c.save(); rr(c, 0, 0, SW, SH, R); c.clip();
    // Hintergrund: Marine-Verlauf wie im Film (oben hell, unten fast schwarz) + Randabdunklung rechts
    var g = c.createLinearGradient(0, 0, 0, SH);
    g.addColorStop(0, 'rgb(8,33,79)'); g.addColorStop(.18, 'rgb(4,37,84)'); g.addColorStop(.36, 'rgb(2,27,68)'); g.addColorStop(.52, 'rgb(0,21,54)'); g.addColorStop(.72, 'rgb(0,10,34)'); g.addColorStop(.88, 'rgb(0,4,20)'); g.addColorStop(1, 'rgb(0,2,13)');
    c.fillStyle = g; c.fillRect(0, 0, SW, SH);
    var h = c.createLinearGradient(0, 0, SW, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(.55, 'rgba(0,0,0,.05)'); h.addColorStop(1, 'rgba(0,0,0,.30)');
    c.fillStyle = h; c.fillRect(0, 0, SW, SH);
    var w = c.createRadialGradient(SW * .5, -SH * .02, 0, SW * .5, -SH * .02, SW * .9); w.addColorStop(0, 'rgba(30,70,150,.22)'); w.addColorStop(1, 'rgba(30,70,150,0)');
    c.fillStyle = w; c.fillRect(0, 0, SW, SH * .5);
    c.textBaseline = 'alphabetic'; c.textAlign = 'center';
    // Statusleiste
    c.textAlign = 'right'; c.fillStyle = '#fff'; c.font = '600 25px ' + FONT; c.fillText(F.akku + ' %', SW * .868, SH * .0290);
    var bx = SW * .887, by = SH * .0165;
    c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,.9)'; rr(c, bx, by, 42, 20, 5); c.stroke(); c.fillStyle = 'rgba(255,255,255,.9)'; rr(c, bx + 4, by + 4, 34 * F.akku / 100, 12, 2); c.fill();
    for (var s = 0; s < 4; s++) { c.fillStyle = 'rgba(255,255,255,' + (s < 3 ? .95 : .85) + ')'; c.fillRect(SW * .712 + s * 11, by + 20 - (6 + s * 5), 7, 6 + s * 5); }
    // Kamera-Loch
    c.fillStyle = '#04070d'; c.beginPath(); c.arc(SW * .504, SH * .031, 15, 0, 7); c.fill(); c.strokeStyle = 'rgba(40,52,76,.9)'; c.lineWidth = 3; c.stroke();
    // Uhr + Datum
    c.textAlign = 'center'; c.fillStyle = 'rgba(243,244,247,.96)'; c.font = '400 172px ' + FONT; c.fillText(F.uhr, SW * .504, SH * .2195);
    c.fillStyle = 'rgba(243,244,247,.94)'; c.font = '600 35px ' + FONT; c.fillText(F.tag, SW * .504, SH * .2665);
    // Karten (neueste oben)
    for (var i = 0; i < F.k.length; i++) {
      var K = KARTEN[F.k[i]], top = SH * (.324 + i * .1529), cx = SW * .046, cw = SW * .911, ch = SH * .140;
      c.fillStyle = 'rgba(255,255,255,.075)'; rr(c, cx, top, cw, ch, 36); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 2; c.stroke();
      var ix = SW * .088, iy = top + ch * .085 + 4, is = 34;
      c.strokeStyle = '#e9b866'; c.lineWidth = 2.5; rr(c, ix, iy, is, is, 9); c.stroke();
      c.lineWidth = 2.5; c.beginPath(); c.moveTo(ix + 7, iy + 11); c.lineTo(ix + is / 2, iy + 21); c.lineTo(ix + is - 7, iy + 11); c.stroke();
      c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = '700 26px ' + FONT; c.fillText('Anfragen', SW * .1625 + 6, iy + 26);
      var ax = SW * .1625 + 6 + c.measureText('Anfragen').width + 14;
      c.fillStyle = 'rgba(255,255,255,.62)'; c.font = '500 25px ' + FONT; c.fillText('· ' + ZEIT[F.k.length - 1][i], ax, iy + 26);
      c.fillStyle = '#fff'; c.font = '700 31px ' + FONT; c.fillText(K.t, SW * .0875 + 4, top + ch * .5);
      c.fillStyle = 'rgba(255,255,255,.86)'; c.font = '500 27.5px ' + FONT; c.fillText(K.z[0], SW * .0875 + 4, top + ch * .66); c.fillText(K.z[1], SW * .0875 + 4, top + ch * .835);
    }
    // Unten: Telefon + Kamera
    var bys = SH * .935;
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(SW * .154, bys, 42, 0, 7); c.fill(); c.beginPath(); c.arc(SW * .84, bys, 42, 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 3.5; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(SW * .154 - 12, bys - 14); c.quadraticCurveTo(SW * .154 - 16, bys + 4, SW * .154 + 4, bys + 16); c.quadraticCurveTo(SW * .154 + 12, bys + 18, SW * .154 + 14, bys + 11); c.lineTo(SW * .154 + 8, bys + 4); c.lineTo(SW * .154 + 3, bys + 8); c.quadraticCurveTo(SW * .154 - 5, bys + 2, SW * .154 - 7, bys - 6); c.lineTo(SW * .154 - 3, bys - 9); c.lineTo(SW * .154 - 8, bys - 17); c.closePath(); c.fillStyle = '#fff'; c.fill();
    rr(c, SW * .84 - 17, bys - 11, 34, 25, 5); c.stroke(); c.beginPath(); c.arc(SW * .84, bys + 2, 7, 0, 7); c.stroke(); c.fillStyle = '#fff'; c.fillRect(SW * .84 - 8, bys - 15, 10, 4);
    c.restore();
    // feine Glasreflexion (warmer Schimmer rechts oben wie im Film)
    c.save(); rr(c, 0, 0, SW, SH, R); c.clip();
    var rf = c.createLinearGradient(SW, 0, SW * .55, SH * .22); rf.addColorStop(0, 'rgba(150,95,40,.22)'); rf.addColorStop(1, 'rgba(150,95,40,0)'); c.fillStyle = rf; c.fillRect(0, 0, SW, SH * .3);
    c.restore();
    return cv;
  }
  window.FILM_TELEFON = {
    /* c = Canvas-Kontext, L = Lage des Filmbilds im Canvas (x,y,w,h), f = Filmbild-Position (Kommazahl) */
    zeichne: function (c, L, f) {
      if (f < 374 || f > 521) return;
      var k = L.w / FW, n = -1, a = 0;
      for (var i = 0; i < 3; i++) { var v = alpha(FEN[i].a, f); if (v > 0) { n = i; a = v; break; } }
      if (n < 0) return;
      if (!cache[n] || Math.abs(cacheK - k) / k > .02) { if (Math.abs(cacheK - k) / k > .02) { cache = [null, null, null]; cacheK = k; } cache[n] = bauen(n, k); }
      var x = L.x + X0 * k, y = L.y + Y0 * k;
      c.globalAlpha = a; c.drawImage(cache[n], x, y, SW * k, SH * k); c.globalAlpha = 1;
    },
    neuBauen: function () { cache = [null, null, null]; cacheK = 0; },
    /* im Leerlauf vorab zeichnen (kein Hänger beim ersten Einschalten des Handys) */
    vor: function (L) {
      var k = L.w / FW; if (!(k > 0)) return;
      if (cacheK && Math.abs(cacheK - k) / k > .02) cache = [null, null, null];
      cacheK = k;
      var ric = window.requestIdleCallback || function (fn) { return setTimeout(fn, 60); };
      [0, 1, 2].forEach(function (n, i) { ric(function () { if (!cache[n] && cacheK === k) cache[n] = bauen(n, k); }, { timeout: 1500 + i * 400 }); });
    }
  };
  if (document.fonts && document.fonts.load) { try { document.fonts.load('300 40px "Archivo Wide"'); document.fonts.load('700 40px "Archivo Wide"'); document.fonts.load('500 40px "Archivo Wide"'); document.fonts.ready.then(function () { window.FILM_TELEFON.neuBauen(); }); } catch (e) {} }
})();
