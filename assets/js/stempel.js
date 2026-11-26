/* Digitale Stempelkarte – DER Moment (20N-FIX, 17.11.2026).
   Ablauf beim Scrollen (vor UND zurück): Karte löst sich vom Handy und wird bildschirmfüllend → 2 Stempel sind schon da
   (geschenkt) → jeder weitere Stempel schlägt mit Schatten, Einschlag, Tinte mit Körnung und Kamera-Ruck ein →
   beim letzten Stempel dreht sich die Karte zum Gutschein und „GRATIS“ schlägt ein.
   Stabilität: kein WebGL, keine Dauer-Schleife (höchstens 1 rAF pro Scroll-Bild), Maße nur bei resize/load,
   Sprünge (Menü, Knopf) setzen direkt den Zielzustand ohne Animations-Kaskade. Speichert nichts. */
(function () {
  'use strict';
  var sek = document.getElementById('stempelkarte'); if (!sek) return;
  var $ = function (id) { return document.getElementById(id); };
  var strecke = $('stkstrecke'), buehne = $('stkbuehne'), szene = $('stkszene'), flug = $('stkflug'), telefon = $('stktelefon');
  var felder = $('stkfelder'), karte = $('stkkarte'), ruck = $('stkruck'), zahl = $('stkzahl'), max = $('stkmax'), zstat = $('stkstatus');
  var rest = $('stkrest'), knopf = $('stkweiter'), tabs = [].slice.call(sek.querySelectorAll('.stk-gewerk button'));
  var RUHE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GESCHENKT = 2;
  /* Beispiele – Betriebe erfunden. Belohnung legt der Betrieb selbst fest. */
  var G = {
    barber: { name: 'Muster Barbershop', kurz: 'MB', n: 10, ziel: 'Gratis', rest: 'bis zum <em>Gratis-Schnitt</em>', besuch: 'Pro Haarschnitt 1 Stempel', gut: 'Gratis-Schnitt', gutText: 'Einlösbar beim nächsten Termin. Einfach an der Theke zeigen.', icon: 'schere' },
    cafe: { name: 'Muster Backstube', kurz: 'BS', n: 10, ziel: 'Gratis', rest: 'bis zum <em>Gratis-Kaffee</em>', besuch: 'Pro Kaffee 1 Stempel', gut: 'Kaffee aufs Haus', gutText: 'Beim nächsten Besuch an der Theke zeigen.', icon: 'tasse' },
    kfz: { name: 'Muster Autoservice', kurz: 'AS', n: 6, ziel: 'Gratis', rest: 'bis zur <em>Gratis-Innenreinigung</em>', besuch: 'Pro Werkstatt-Termin 1 Stempel', gut: 'Innen­reinigung gratis', gutText: 'Beim nächsten Werkstatt-Termin einlösbar.', icon: 'schluessel' }
  };
  var akt = 'barber', stand = -1, voll = false, top = 0, hoehe = 1, sichtbar = false, s0 = .3, intro = -1;

  /* ---------- Stempel-Abdruck: jedes Mal ein bisschen anders (Druck, Winkel, Körnung) ---------- */
  function icon(x, s, art) {
    x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = s * .055;
    x.beginPath();
    if (art === 'schere') {
      x.arc(-s * .13, s * .15, s * .075, 0, 6.283); x.moveTo(s * .205, s * .15); x.arc(s * .13, s * .15, s * .075, 0, 6.283);
      x.moveTo(-s * .085, s * .085); x.lineTo(s * .12, -s * .22); x.moveTo(s * .085, s * .085); x.lineTo(-s * .12, -s * .22);
    } else if (art === 'tasse') {
      x.moveTo(-s * .17, -s * .05); x.lineTo(-s * .14, s * .17); x.quadraticCurveTo(-s * .13, s * .21, -s * .09, s * .21); x.lineTo(s * .07, s * .21); x.quadraticCurveTo(s * .11, s * .21, s * .12, s * .17); x.lineTo(s * .15, -s * .05); x.closePath();
      x.moveTo(s * .14, 0); x.bezierCurveTo(s * .26, -s * .01, s * .26, s * .12, s * .13, s * .12);
      x.moveTo(-s * .06, -s * .12); x.bezierCurveTo(-s * .1, -s * .17, -s * .02, -s * .2, -s * .06, -s * .26);
      x.moveTo(s * .04, -s * .12); x.bezierCurveTo(0, -s * .17, s * .08, -s * .2, s * .04, -s * .26);
    } else {
      x.moveTo(-s * .16, s * .16); x.lineTo(s * .06, -s * .06);
      x.moveTo(s * .2, -s * .1); x.arc(s * .11, -s * .11, s * .095, -.2, 4.4);
      x.moveTo(-s * .16, s * .16); x.arc(-s * .16, s * .16, s * .01, 0, 6.283);
    }
    x.stroke();
  }
  function abdruck(cv, art, sanft) {
    var w = cv.width, s = w, x = cv.getContext('2d');
    x.clearRect(0, 0, w, w);
    x.save(); x.translate(w / 2 + (Math.random() - .5) * s * .05, w / 2 + (Math.random() - .5) * s * .05); x.rotate((Math.random() - .5) * .62);
    x.strokeStyle = x.fillStyle = 'rgba(16,16,18,.93)';
    x.lineWidth = s * .045; x.beginPath(); x.arc(0, 0, s * .4, 0, 6.283); x.stroke();
    x.lineWidth = s * .016; x.beginPath(); x.arc(0, 0, s * .325, 0, 6.283); x.stroke();
    for (var i = 0; i < 10; i++) { var a = i / 10 * 6.283; x.beginPath(); x.arc(Math.cos(a) * s * .362, Math.sin(a) * s * .362, s * .011, 0, 6.283); x.fill(); }
    icon(x, s, art);
    x.restore();
    /* Körnung + ungleichmäßiger Druck */
    x.globalCompositeOperation = 'destination-out';
    var ang = Math.random() * 6.283, g = x.createLinearGradient(w / 2 + Math.cos(ang) * w * .5, w / 2 + Math.sin(ang) * w * .5, w / 2 - Math.cos(ang) * w * .5, w / 2 - Math.sin(ang) * w * .5);
    g.addColorStop(0, 'rgba(0,0,0,' + (sanft ? .55 : .42) + ')'); g.addColorStop(.55, 'rgba(0,0,0,.06)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, w);
    for (var k = 0; k < w * 2.4; k++) { x.fillStyle = 'rgba(0,0,0,' + (.35 + Math.random() * .65) + ')'; var r = Math.random() * w * .012 + .4; x.fillRect(Math.random() * w, Math.random() * w, r, r); }
    for (var m = 0; m < 4; m++) { x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = Math.random() * 1.2 + .4; x.beginPath(); var y0 = Math.random() * w; x.moveTo(0, y0); x.lineTo(w, y0 + (Math.random() - .5) * w * .4); x.stroke(); }
    x.globalCompositeOperation = 'source-over';
    /* ein paar Tintenspritzer am Rand */
    x.fillStyle = 'rgba(16,16,18,.8)';
    for (var p = 0; p < 7; p++) { var b = Math.random() * 6.283, d = w * (.44 + Math.random() * .07); x.beginPath(); x.arc(w / 2 + Math.cos(b) * d, w / 2 + Math.sin(b) * d, Math.random() * w * .009 + .5, 0, 6.283); x.fill(); }
  }

  /* ---------- Karte aufbauen ---------- */
  var feldEls = [], klammer = null;
  function bauen() {
    var g = G[akt];
    felder.innerHTML = ''; feldEls = [];
    felder.className = 'stk-felder' + (g.n === 6 ? ' f6' : '');
    for (var i = 0; i < g.n; i++) {
      var f = document.createElement('div'); f.className = 'stk-f' + (i === g.n - 1 ? ' ziel' + (g.n === 10 ? ' zehn' : '') : '');
      f.innerHTML = i === g.n - 1 ? '<span>' + g.ziel + '</span>' : String(i + 1);
      ['sch', 'dell'].forEach(function (k) { var e = document.createElement('i'); e.className = k; f.appendChild(e); });
      f.appendChild(document.createElement('canvas'));
      felder.appendChild(f); feldEls.push(f);
    }
    klammer = document.createElement('span'); klammer.className = 'stk-klammer'; klammer.setAttribute('aria-hidden', 'true');
    klammer.innerHTML = '<i></i><b>geschenkt</b>'; felder.appendChild(klammer);
    $('stkname').textContent = g.name; $('stklogo').textContent = g.kurz; $('stkbesuch').textContent = g.besuch;
    $('stkgut').textContent = g.gut; $('stkguttext').textContent = g.gutText;
    max.textContent = g.n; stand = -1; voll = false; karte.classList.remove('voll'); buehne.classList.remove('voll');
    leinwand(); setze(ziel(), true);
  }
  function leinwand() { // Canvas-Größe + Klammer-Lage: nur beim Aufbau/resize messen
    var st = feldEls[0] ? feldEls[0].offsetWidth : 120, px = Math.round(st * 1.12 * Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.25 : 1.5));
    feldEls.forEach(function (f) { var cv = f.querySelector('canvas'); if (cv.width !== px) { cv.width = cv.height = px; if (f.classList.contains('an')) abdruck(cv, G[akt].icon, feldEls.indexOf(f) < GESCHENKT); } });
    if (klammer && feldEls[1]) {
      var a = feldEls[0], b = feldEls[1];
      klammer.style.left = (a.offsetLeft + st * .12) + 'px'; klammer.style.width = (b.offsetLeft + b.offsetWidth - a.offsetLeft - st * .24) + 'px';
      klammer.style.top = (a.offsetTop + a.offsetHeight + st * .06) + 'px';
    }
  }

  /* ---------- Stand anwenden ---------- */
  var vollT = 0;
  function setze(n, still) {
    var g = G[akt]; n = Math.max(GESCHENKT, Math.min(g.n, n));
    if (n === stand) return;
    var vorher = stand; stand = n;
    if (vorher < 0 || Math.abs(n - vorher) > 2) still = true; // Sprung: Zielzustand direkt, keine Kaskade
    feldEls.forEach(function (f, i) {
      var soll = i < n, ist = f.classList.contains('an');
      if (soll && !ist) {
        abdruck(f.querySelector('canvas'), g.icon, i < GESCHENKT);
        f.classList.remove('weg'); f.classList.add('an');
        if (!still && !RUHE && i === n - 1) { f.classList.remove('neu'); void f.offsetWidth; f.classList.add('neu'); }
      } else if (!soll && ist) {
        f.classList.remove('an', 'neu');
        if (!still && !RUHE) { f.classList.remove('weg'); void f.offsetWidth; f.classList.add('weg'); }
      } else if (!soll) f.classList.remove('weg');
    });
    if (!still && !RUHE && n > vorher) {
      ruck.classList.remove('ruck'); szene.classList.remove('ruck'); void ruck.offsetWidth; ruck.classList.add('ruck');
      setTimeout(function () { szene.classList.add('ruck'); }, 210); // Kamera-Ruck genau im Einschlag
    }
    zahl.textContent = n; if (!still && !RUHE) { zahl.classList.remove('tick'); void zahl.offsetWidth; zahl.classList.add('tick'); }
    var offen = g.n - n;
    rest.innerHTML = offen > 0 ? 'Noch ' + offen + ' ' + g.rest : 'Voll – <em>Gutschein frei</em>';
    zstat.textContent = offen > 0 ? 'noch ' + offen + ' bis zur Belohnung' : 'Karte voll – Gutschein frei';
    knopf.textContent = offen > 0 ? 'Nächsten Stempel setzen' : 'Nochmal von vorn';
    karte.setAttribute('aria-label', 'Stempelkarte ' + g.name + ' (Beispiel): ' + n + ' von ' + g.n + ' Stempeln' + (offen ? '' : ' – Gutschein ' + g.gut.replace('­', '') + ' frei'));
    clearTimeout(vollT);
    if (offen === 0 && !voll) { vollT = setTimeout(function () { voll = true; karte.classList.add('voll'); buehne.classList.add('voll'); }, still || RUHE ? 0 : 420); }
    else if (offen > 0 && voll) { voll = false; karte.classList.remove('voll'); buehne.classList.remove('voll'); }
  }

  /* ---------- Scroll -> Stand + Karte löst sich vom Handy (Layout nur bei resize messen) ---------- */
  var I = .1, A = .14, B = .8; // 0–10 %: Karte löst sich · 14–80 %: Stempel · danach: Gutschein
  function messen() {
    var r = strecke.getBoundingClientRect(); top = r.top + (window.scrollY || pageYOffset); hoehe = Math.max(1, strecke.offsetHeight - innerHeight);
    var kw = karte.offsetWidth || 1, th = Math.min(innerHeight * .68, 620); s0 = Math.min(.5, (th * .49 * .84) / kw);
    leinwand(); intro = -1;
  }
  function fortschritt() { return Math.max(0, Math.min(1, ((window.scrollY || pageYOffset) - top) / hoehe)); }
  function ziel() { var g = G[akt], schritte = g.n - GESCHENKT, p = fortschritt(); if (p < A) return GESCHENKT; return GESCHENKT + Math.min(schritte, Math.floor((p - A) / (B - A) * schritte + 1e-6) + 1); }
  function weich(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  var bildAn = false;
  function bild() {
    bildAn = false; if (!sichtbar) return;
    var p = fortschritt();
    setze(ziel(), false);
    var e = RUHE ? 1 : weich(p / I);
    if (Math.abs(e - intro) > .001) {
      intro = e;
      var s = s0 + (1 - s0) * e;
      flug.style.transform = 'translate3d(0,' + ((1 - e) * 2).toFixed(2) + 'vh,0) rotateX(' + ((1 - e) * 14).toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
      buehne.style.setProperty('--stk-i', e.toFixed(3));
      telefon.style.visibility = e > .75 ? 'hidden' : '';
    }
  }
  function plan() { if (!bildAn && sichtbar) { bildAn = true; requestAnimationFrame(bild); } }
  addEventListener('scroll', plan, { passive: true });
  var rzT = 0; addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(function () { messen(); plan(); }, 140); });
  addEventListener('load', function () { messen(); plan(); });

  /* Knopf: scrollt genau bis zum nächsten Stempel – Scrollen und Klicken bleiben dieselbe Bewegung */
  knopf.addEventListener('click', function () {
    var g = G[akt], schritte = g.n - GESCHENKT, n = stand < g.n ? stand + 1 : GESCHENKT;
    var p = n === GESCHENKT ? I + .01 : A + (n - GESCHENKT - 1 + .4) / schritte * (B - A);
    var y = top + p * hoehe;
    if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(y, { duration: .7 }); else scrollTo({ top: y, behavior: RUHE ? 'auto' : 'smooth' });
  });
  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.g === akt) { b.classList.remove('stk-tick'); void b.offsetWidth; b.classList.add('stk-tick'); return; } akt = b.dataset.g; /* 20N-FIX4: schon gewählt → sichtbar bestätigen */
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t === b ? 'true' : 'false'); t.tabIndex = t === b ? 0 : -1; });
      bauen(); messen(); plan();
    });
    b.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(b), j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -9; if (j === -9) return;
      j = (j + tabs.length) % tabs.length; tabs[j].focus(); tabs[j].click(); e.preventDefault();
    });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { sichtbar = e[0].isIntersecting; if (sichtbar) plan(); }, { rootMargin: '200px 0px' }).observe(strecke);
  } else sichtbar = true;
  bauen(); messen(); bild();
})();

/* Alles aus einer Hand: Zeilen gleiten gegenläufig mit dem Scroll; die Zeile in der Bildmitte füllt sich.
   Ein rAF pro Scroll-Bild (Flag), Positionen nur bei resize gemessen. */
(function () {
  'use strict';
  var liste = document.getElementById('adhliste'); if (!liste) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var zeilen = [].slice.call(liste.children), links = zeilen.map(function (z) { return z.firstElementChild; });
  var oben = [], hoch = [], sicht = false, an = false, aktiv = -1;
  function messen() { var y = window.scrollY || pageYOffset; zeilen.forEach(function (z, i) { var r = z.getBoundingClientRect(); oben[i] = r.top + y; hoch[i] = r.height; }); }
  function bild() {
    an = false; if (!sicht) return;
    var y = window.scrollY || pageYOffset, mitte = y + innerHeight * .5, best = -1, bestD = 1e9, breit = innerWidth;
    zeilen.forEach(function (z, i) {
      var c = oben[i] + hoch[i] / 2, d = (c - mitte) / innerHeight; // -1..1
      var x = Math.max(-1.2, Math.min(1.2, d)) * breit * (breit < 900 ? .035 : .09) * (i % 2 ? -1 : 1);
      links[i].style.setProperty('--x', x.toFixed(1) + 'px');
      var ad = Math.abs(c - mitte); if (ad < bestD) { bestD = ad; best = i; }
    });
    if (bestD > innerHeight * .22) best = -1;
    if (best !== aktiv) { if (aktiv >= 0) zeilen[aktiv].classList.remove('an'); if (best >= 0) zeilen[best].classList.add('an'); aktiv = best; }
  }
  function plan() { if (!an && sicht) { an = true; requestAnimationFrame(bild); } }
  addEventListener('scroll', plan, { passive: true });
  var t = 0; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { messen(); plan(); }, 120); });
  addEventListener('load', function () { messen(); plan(); });
  new IntersectionObserver(function (e) { sicht = e[0].isIntersecting; if (sicht) { messen(); plan(); } }, { rootMargin: '100px 0px' }).observe(liste);
  messen();
})();

/* Kontaktformular vorausfüllen (Stempelkarte / Paket) – nur im Formular, nichts gespeichert */
(function () {
  function fuell(thema, text) { var f = document.getElementById('kontaktform'); if (!f || !f.thema) return; f.thema.value = thema; if (f.nachricht && !f.nachricht.value) f.nachricht.value = text; }
  var s = document.getElementById('stempelkarte');
  [].forEach.call(document.querySelectorAll('[data-paket]'), function (a) { a.addEventListener('click', function () { fuell('Paket aus mehreren Leistungen', 'Mich interessiert ein Paket aus: '); }); });
  [].forEach.call(document.querySelectorAll('[data-stempel-anfrage]'), function (a) { a.addEventListener('click', function () { fuell('Digitale Stempelkarte', 'Ich interessiere mich für eine digitale Stempelkarte. Gewerk / Belohnung: '); }); });
})();
