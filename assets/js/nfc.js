/* NFC-Bewertungskarte (Chat W10-D) – scroll-gesteuertes Erlebnis „Handy dran. Fertig.“
   Kein Modul, keine Bibliothek, läuft per Doppelklick (lokal). Animationen nur, wenn sichtbar. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var strecke = $('nfcstrecke'), buehne = $('nfcbuehne');
  if (!strecke || !buehne) return;
  var RUHE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function klemm(v, a, b) { return v < a ? a : v > b ? b : v; }
  function glatt(t) { t = klemm(t, 0, 1); return t * t * (3 - 2 * t); }
  function seg(p, a, b) { return klemm((p - a) / (b - a), 0, 1); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function komma(v, n) { return v.toFixed(n).replace('.', ','); }

  /* ---------- QR-Code (echter Code mit Beispieltext, kein Link) ---------- */
  var QR = '1111111011001000011000110011111010111111110000010000010000101100000000101101000001101110100110000100010100010111010010111011011101011001011011011100011101000101110110111010101000100010001101111110001011101100000101010110010110100110010010010000011111111010101010101010101010101010111111100000000101100110101011100011110100000000100010111101011010011101000110011111110010101110010101101101011010111101010111111100000110100111101110011111110000001000101101100010001111011011101101011001001010100000001101111011110001101000110011000100010111001000111010011100001100010011110101100001101111000001101100001101001111010110100100101010100011001101001110001101101111010011111100101101111110000000010101010110111001011110000010101011101100011111110011001000110001110000011001100010101000100110101001110110110001110101110101101001100110111110101110110010111001111000000100100010111011011110000000101101000111010000100111110111111100011100110100101110001101010011111010001000111001011111010110001011101101111000010111101000110111000000100001100011110100010001100111000011110111010000111001000101101101011111101111010010011010111101001111111011000010010010100100101010111111000100111100100101110001010111010001110011110110010100011100011101110010101000011011101101011000110001000010100011100000101100111110100100110101001011110101111001000011001110100111001111110010000000010100100111010110001111110001110111111110101100100010011101111011101011101100000100111011010010100010111011000110011011101011111010000110001101101111111000010111010000111011110101110111011110100110101110100010010011000001001101110100010011000001000110100110101100001011101100101111111110100010010111111110000100100001010', QN = 41;
  function qrSvg() {
    var d = '';
    for (var y = 0; y < QN; y++) for (var x = 0; x < QN; x++) if (QR.charAt(y * QN + x) === '1') d += 'M' + x + ' ' + y + 'h1v1h-1z';
    return '<svg viewBox="0 0 41 41" shape-rendering="crispEdges" aria-hidden="true"><path fill="#0a0a0b" d="' + d + '"/></svg>';
  }
  

  /* ---------- Steinkorn der Theke (einmal erzeugt, als Kachel) ---------- */
  try {
    var c = document.createElement('canvas'); c.width = c.height = 220; var x = c.getContext('2d'), im = x.createImageData(220, 220);
    for (var i = 0; i < im.data.length; i += 4) { var v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = Math.random() < 0.5 ? 10 : 3; }
    x.putImageData(im, 0, 0); buehne.style.setProperty('--nfc-korn', 'url(' + c.toDataURL() + ')');
  } catch (e) {}

  var auf = $('nfcauf'), aNfc = $('nfcpunkt'), handy = $('nfchandy'), wellen = $('nfcwellen'), pschatten = $('nfcpschatten');
  var finger = $('nfcfinger'), feld = $('nfcfeld'), liste = $('nfcliste');
  var hs = { sperr: $('hssperr'), banner: $('hsbanner'), form: $('hsform'), danke: $('hsdanke') };
  var sterne = buehne.querySelectorAll('.h-sterne i'), texte = buehne.querySelectorAll('.nt'), schritte = buehne.querySelectorAll('.nfc-schritte li');
  var W = $('nfcwerte'), wAb = $('nw-ab'), wSig = $('nw-sig'), wSchritt = $('nw-schritt'), wZeit = $('nw-zeit');
  var TXT = 'Sehr sauber gearbeitet, pünktlich und alles gut erklärt. Gerne wieder.';

  /* Kartenliste: erfundene, neutrale Betriebe (Beispiel) */
  var reihen = liste.querySelectorAll('.nl-r'), wir = liste.querySelector('.nl-r.wir'), andere = [], plus = liste.querySelector('.nl-plus');
  Array.prototype.forEach.call(reihen, function (r) { if (r !== wir) andere.push(r); });
  var wirSchnitt = wir.querySelector('.wt b'), wirZahl = wir.querySelector('.wt small'), wirSt = wir.querySelector('.nl-st'), wirNr = wir.querySelector('.nr');
  var zeit = $('nlzeit');

  var M = {}; /* Maße */
  function messen() {
    var sr = strecke.getBoundingClientRect(); M.st = sr.top + (window.scrollY || pageYOffset); M.sh0 = strecke.offsetHeight - innerHeight;
    var b = buehne.getBoundingClientRect(), r = aNfc.getBoundingClientRect();
    M.W = b.width; M.H = b.height;
    M.nx = r.left - b.left + r.width / 2; M.ny = r.top - b.top + r.height * 0.42;
    M.pw = handy.offsetWidth; M.ph = handy.offsetHeight;
    M.hoch = M.W / M.H < 0.8; M.flach = M.H < 500 && !M.hoch;
    var s = handy.querySelector('.h-schirm').getBoundingClientRect(); M.sw = handy.querySelector('.h-schirm').offsetWidth; M.sh = handy.querySelector('.h-schirm').offsetHeight;
    function lage(el) { var o = el, x = 0, y = 0; while (o && !o.classList.contains('h-schirm')) { x += o.offsetLeft; y += o.offsetTop; o = o.offsetParent; } return [x + el.offsetWidth / 2, y + el.offsetHeight / 2]; }
    M.fBanner = lage(handy.querySelector('.h-banner')); M.fStern = lage(sterne[4]); M.fPosten = lage(handy.querySelector('.h-posten'));
    M.rh = reihen[0].offsetHeight + 6;
    /* Handy-Ziel, wenn es angehoben ist */
    var sL = M.hoch ? 1.0 : M.flach ? 0.92 : 1.12;
    M.lx = M.hoch ? M.W * 0.5 : M.W * 0.74; M.ls = sL;
    M.ly = (M.hoch ? M.H * 0.54 : M.flach ? M.H * 0.56 : M.H * 0.52) - M.ph * sL * 0.45;
  }

  /* Kamera-Punkte des Handys: Zielpunkt (Oberkante), Drehung, Tiefe, Größe */
  function pose(p) {
    var A = { x: M.nx + M.W * (M.hoch ? 0.28 : 0.3), y: -M.ph * 0.35, rx: -18, ry: 24, rz: -30, z: 80, s: 1 };
    var B = { x: M.nx, y: M.ny, rx: -54, ry: 8, rz: -7, z: 10, s: 1 };
    var C = { x: M.lx, y: M.ly, rx: -2, ry: M.hoch ? 0 : -12, rz: 0, z: 0, s: M.ls };
    var D = { x: M.lx, y: M.ly, rx: 0, ry: M.hoch ? 0 : -5, rz: 0, z: 0, s: M.ls };
    var E = { x: M.lx + (M.hoch ? 0 : M.W * 0.03), y: M.ly + M.H * 0.18, rx: 8, ry: -8, rz: 3, z: -120, s: M.ls * 0.8 };
    var a, b, t;
    if (p < 0.22) { a = A; b = B; t = glatt(seg(p, 0.03, 0.22)); }
    else if (p < 0.345) { a = B; b = B; t = 0; }
    else if (p < 0.44) { a = B; b = C; t = glatt(seg(p, 0.345, 0.44)); }
    else if (p < 0.7) { a = C; b = D; t = seg(p, 0.44, 0.7); }
    else { a = D; b = E; t = glatt(seg(p, 0.72, 0.82)); }
    var o = {}; for (var k in a) o[k] = mix(a[k], b[k], t);
    /* Vibration-Andeutung beim Kontakt */
    var vib = seg(p, 0.225, 0.235) * (1 - seg(p, 0.285, 0.3));
    if (vib > 0) { var w = Math.sin(p * 2600); o.rz += w * 1.3 * vib; o.x += w * 2.5 * vib; }
    return o;
  }

  var stufe = -1, wellenAn = false, letzterText = -1;
  function zeichne(p) {
    var o = pose(p);
    handy.style.transform = 'translate3d(' + (o.x - M.pw / 2).toFixed(1) + 'px,' + (o.y - M.ph * 0.05).toFixed(1) + 'px,' + o.z.toFixed(1) + 'px) rotateX(' + o.rx.toFixed(2) + 'deg) rotateY(' + o.ry.toFixed(2) + 'deg) rotateZ(' + o.rz.toFixed(2) + 'deg) scale(' + o.s.toFixed(4) + ')';
    handy.style.opacity = (1 - seg(p, 0.76, 0.82)).toFixed(3);
    handy.style.setProperty('--nfc-hg', (o.ry * 2 + o.rx).toFixed(1));
    auf.style.setProperty('--nfc-gl', ((p - 0.3) * 60).toFixed(1));
    auf.style.opacity = (M.hoch ? 1 - 0.7 * seg(p, 0.36, 0.44) * (1 - seg(p, 0.8, 0.86)) : 1 - 0.45 * seg(p, 0.74, 0.82)).toFixed(3);

    /* Abstand Handy ↔ Chip in mm (Darstellung) */
    var nah = seg(p, 0.03, 0.22), mm = Math.round((1 - glatt(nah)) * 180);
    var kontakt = p >= 0.2 && p < 0.36;
    wellen.style.left = M.nx + 'px'; wellen.style.top = M.ny + 'px';
    wellen.style.opacity = (seg(p, 0.19, 0.22) * (1 - seg(p, 0.33, 0.37))).toFixed(3);
    if (kontakt !== wellenAn) { wellenAn = kontakt; wellen.classList.toggle('an', kontakt); }
    pschatten.style.left = (M.nx + 10) + 'px'; pschatten.style.top = (M.ny + M.ph * 0.18) + 'px';
    pschatten.style.opacity = (glatt(seg(p, 0.12, 0.22)) * (1 - seg(p, 0.35, 0.42)) * 0.8).toFixed(3);

    /* Bildschirm-Zustände */
    var bannerT = seg(p, 0.255, 0.285);
    hs.sperr.classList.toggle('an', p < 0.36);
    hs.banner.classList.toggle('an', p >= 0.25 && p < 0.36);
    hs.banner.style.setProperty('--bn', (1 - glatt(bannerT)).toFixed(3));
    hs.form.classList.toggle('an', p >= 0.36 && p < 0.665);
    hs.danke.classList.toggle('an', p >= 0.665);
    var st = Math.floor(seg(p, 0.465, 0.495) * 5 + 0.0001);
    for (var i = 0; i < 5; i++) sterne[i].classList.toggle('an', i < st);
    var n = Math.round(seg(p, 0.5, 0.6) * TXT.length);
    if (feld.textContent.length !== n) feld.textContent = TXT.slice(0, n);
    feld.classList.toggle('tippt', p > 0.49 && p < 0.62);

    /* Finger: tippt Hinweis, 5. Stern, „Posten“ */
    var f = null, druck = 0;
    if (p > 0.29 && p < 0.36) { f = M.fBanner; druck = seg(p, 0.32, 0.335) * (1 - seg(p, 0.345, 0.36)); }
    else if (p > 0.43 && p < 0.5) { f = M.fStern; druck = seg(p, 0.455, 0.465) * (1 - seg(p, 0.475, 0.49)); }
    else if (p > 0.6 && p < 0.67) { f = M.fPosten; druck = seg(p, 0.645, 0.655) * (1 - seg(p, 0.66, 0.67)); }
    if (f) {
      var ein = p < 0.36 ? seg(p, 0.29, 0.31) * (1 - seg(p, 0.35, 0.36)) : p < 0.5 ? seg(p, 0.43, 0.45) * (1 - seg(p, 0.49, 0.5)) : seg(p, 0.6, 0.62) * (1 - seg(p, 0.665, 0.67));
      finger.style.opacity = ein.toFixed(3);
      finger.style.transform = 'translate(' + f[0].toFixed(1) + 'px,' + (f[1] + (1 - ein) * 30).toFixed(1) + 'px) scale(' + (1 - druck * 0.22).toFixed(3) + ')';
    } else if (finger.style.opacity !== '0') finger.style.opacity = '0';

    /* Kartenliste */
    var lEin = glatt(seg(p, 0.74, 0.82));
    liste.style.opacity = lEin.toFixed(3);
    liste.style.transform = 'translate(-50%,calc(-50% + ' + ((1 - lEin) * 40).toFixed(1) + 'px)) scale(' + (0.96 + 0.04 * lEin).toFixed(3) + ')';
    var plus1 = seg(p, 0.8, 0.83), wachs = glatt(seg(p, 0.86, 0.97));
    var zahl = Math.round(9 + plus1 + wachs * 21), schnitt = 4.3 + 0.04 * plus1 + wachs * 0.36;
    wirSchnitt.textContent = komma(schnitt, 1); wirZahl.textContent = '(' + zahl + ')';
    wirSt.style.setProperty('--w', (schnitt / 5).toFixed(3));
    plus.style.opacity = (plus1 * (1 - seg(p, 0.86, 0.88))).toFixed(3);
    zeit.innerHTML = p < 0.86 ? 'Heute · <em>Ihre neue Bewertung</em>' : 'Nach 6 Monaten mit Karte · <em>' + zahl + ' Bewertungen</em>';
    var pos = 3 - 3 * glatt(seg(p, 0.88, 0.97));
    wir.style.transform = 'translateY(' + (pos * M.rh).toFixed(1) + 'px)';
    wirNr.textContent = Math.round(pos) + 1;
    andere.forEach(function (r, j) {
      var sh = klemm(j + 1 - pos, 0, 1);
      r.style.transform = 'translateY(' + ((j + sh) * M.rh).toFixed(1) + 'px)';
      r.querySelector('.nr').textContent = j + Math.round(sh) + 1;
    });

    /* Schritte, Texte, Live-Werte */
    var s = p < 0.25 ? 0 : p < 0.38 ? 1 : p < 0.72 ? 2 : 3;
    if (s !== stufe) {
      stufe = s;
      for (i = 0; i < texte.length; i++) { texte[i].classList.toggle('an', i === s); texte[i].setAttribute('aria-hidden', i === s ? 'false' : 'true'); }
      for (i = 0; i < schritte.length; i++) schritte[i].classList.toggle('an', i === s);
      wSchritt.textContent = (s + 1) + ' / 4';
    }
    var GR = [0, 0.25, 0.38, 0.72, 1];
    for (i = 0; i < 4; i++) schritte[i].style.setProperty('--f', seg(p, GR[i], GR[i + 1]).toFixed(3));
    wAb.textContent = p < 0.22 ? mm + ' mm' : p < 0.36 ? '0 mm · Kontakt' : '—';
    wSig.textContent = mm > 40 ? 'kein Chip' : p < 0.36 ? 'Link erkannt' : p < 0.665 ? 'Seite offen' : 'gesendet';
    var sek = seg(p, 0.22, 0.665) * 8;
    wZeit.textContent = p < 0.22 ? '0,0 s' : komma(sek, 1) + ' s';
  }

  /* ---------- Steuerung: nur rechnen, wenn sichtbar ---------- */
  var ziel = 0, akt = 0, sichtbar = false, laeuft = false;
  function lesen() {
    var h = M.sh0 || 0;
    ziel = h > 0 ? klemm(((window.scrollY || pageYOffset) - M.st) / h, 0, 1) : 0;
  }
  var nLetzt = 0;
  function schleife(t) {
    if (!sichtbar || document.hidden) { laeuft = false; nLetzt = 0; return; }
    lesen();
    var dt = nLetzt && t ? Math.min(0.1, Math.max(0.001, (t - nLetzt) / 1000)) : 0.0167; nLetzt = t || 0;
    var d = ziel - akt; akt += d * (1 - Math.exp(-dt / 0.111)); if (window.__nfcSofort) akt = ziel; /* 20N-FIX2: zeitbasiert (bei 60 Hz wie vorher 0,14/Bild) */
    if (Math.abs(ziel - akt) < 0.0002) akt = ziel;
    if (akt === gemalt) { laeuft = false; nLetzt = 0; return; } /* Ruhe: Schleife schläft, Scroll weckt sie */
    zeichne(akt); gemalt = akt;
    requestAnimationFrame(schleife);
  }
  var gemalt = -1;
  addEventListener('scroll', function () { if (sichtbar && !laeuft) { laeuft = true; requestAnimationFrame(schleife); } }, { passive: true });
  addEventListener('resize', function () { gemalt = -1; });
  function start() { messen(); if (RUHE) { zeichne(0.55); return; } lesen(); akt = ziel; zeichne(akt); }
  var ro; addEventListener('resize', function () { clearTimeout(ro); ro = setTimeout(function () { messen(); zeichne(akt); }, 120); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      sichtbar = e[0].isIntersecting && !RUHE;
      if (sichtbar && !laeuft) { laeuft = true; messen(); requestAnimationFrame(schleife); }
    }, { rootMargin: '10% 0px' }).observe(strecke);
  } else { sichtbar = !RUHE; laeuft = true; requestAnimationFrame(schleife); }
  addEventListener("load", function () { messen(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { messen(); zeichne(akt); });
  start();

  /* Kleine Animationen in „So funktioniert es“ nur, wenn sichtbar */
  var info = document.querySelector('.nfc-info');
  if (info && 'IntersectionObserver' in window) new IntersectionObserver(function (e) { info.classList.toggle('sicht', e[0].isIntersecting); }).observe(info);

  /* „Aufsteller anfragen“: Kontaktformular vorausfüllen (Scrollen übernimmt der Anker) */
  Array.prototype.forEach.call(document.querySelectorAll('[data-nfc-anfrage]'), function (a) {
    a.addEventListener('click', function () {
      var f = $('kontaktform'); if (!f) return;
      f.thema.value = 'NFC-Bewertungskarten';
      if (!f.nachricht.value) f.nachricht.value = 'Ich interessiere mich für NFC-Bewertungskarten. Gewerk / Ort / wofür (Theke, Firmenwagen, Übergabe …): ';
    });
  });
})();
