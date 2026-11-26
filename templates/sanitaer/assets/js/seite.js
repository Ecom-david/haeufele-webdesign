/* Seegmaier Haustechnik – Seitenlogik (ohne Bibliotheken, läuft per Doppelklick). */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var de = function (n, d) { return n.toLocaleString('de-DE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var NS = 'http://www.w3.org/2000/svg';
  var hatIO = 'IntersectionObserver' in window;
  /* Weiches Scrollen (Lenis, MIT, lokal) */
  if (!reduce && window.Lenis) { try { window.__lenis = new Lenis({ lerp: .1, wheelMultiplier: .9, autoRaf: true, anchors: { offset: -10 } }); } catch (e) { } }
  function sichtbar(el, fn, opt) { if (!hatIO) { fn(true); return; } new IntersectionObserver(function (es) { fn(es[0].isIntersecting); }, opt || {}).observe(el); }

  /* Kopfzeile */
  var kopf = $('#kopf');
  function k() { kopf.classList.toggle('voll', scrollY > 30); }
  addEventListener('scroll', k, { passive: true }); k();

  /* Überschriften Wort für Wort */
  $$('h1,h2').forEach(function (h) {
    if (h.closest('.fk')) return;
    var i = 0;
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(w)); return; }
            var s = document.createElement('span'); s.className = 'wort'; s.textContent = w; s.style.transitionDelay = (i++ * 55) + 'ms'; f.appendChild(s);
          });
          n.replaceChild(f, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR' && c.tagName !== 'SUB') {
          if (c.tagName === 'EM') { c.classList.add('wort'); c.style.transitionDelay = (i++ * 55) + 'ms'; } else walk(c);
        }
      });
    })(h);
  });

  /* Einblenden */
  var io = hatIO ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; e.target.classList.add('da'); io.unobserve(e.target); });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  $$('.auf').forEach(function (el) { io ? io.observe(el) : el.classList.add('da'); });
  $$('h1,h2').forEach(function (h) { if (!h.closest('.auf') && !h.closest('.fk')) { io ? io.observe(h) : h.classList.add('da'); } });

  /* ===== Hero: Heizkurve + Beispiel-Betriebswerte ===== */
  var hk = $('#hkurve');
  if (hk) {
    // Heizkurve eines Beispielhauses: 45 °C Vorlauf bei −12 °C, 20 °C bei 20 °C außen (Heizkörper-Exponent ≈ 1,2)
    var VL = function (ta) { return 20 + 25 * Math.pow(Math.max(0, (20 - ta) / 32), 1 / 1.2); };
    var X = function (ta) { return 34 + (ta + 15) / 35 * 256; }, Y = function (v) { return 112 - (v - 20) / 30 * 90; };
    var r = '';
    [-10, 0, 10].forEach(function (t) { r += '<line x1="' + X(t) + '" y1="20" x2="' + X(t) + '" y2="112"/><text x="' + X(t) + '" y="126" text-anchor="middle">' + (t < 0 ? '−' + (-t) : t) + '</text>'; });
    [20, 35, 50].forEach(function (v) { r += '<line x1="34" y1="' + Y(v) + '" x2="290" y2="' + Y(v) + '"/><text x="28" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>'; });
    r += '<line x1="' + X(20) + '" y1="20" x2="' + X(20) + '" y2="112"/>'; $('.hk-raster', hk).innerHTML = r;
    var d = ''; for (var t = -15; t <= 20; t += 1) d += (t === -15 ? 'M' : 'L') + X(t).toFixed(1) + ' ' + Y(VL(t)).toFixed(1);
    $('.hk-linie', hk).setAttribute('d', d);
    var hp = $('#hkp'), ma = $('#mw-aussen'), mv = $('#mw-vl'), mr = $('#mw-rl'), mc = $('#mw-cop');
    function setze(ta, jitter) {
      var v = VL(ta) + jitter; hp.setAttribute('cx', X(ta).toFixed(1)); hp.setAttribute('cy', Y(v).toFixed(1));
      ma.textContent = de(ta, 1); mv.textContent = de(v, 1); mr.textContent = de(v - 4.9 + jitter * .5, 1); mc.textContent = de(3.8 + (ta - 2) * .08 - jitter * .1, 1);
    }
    setze(2, 0);
    var hsicht = false; sichtbar($('.hero'), function (v) { hsicht = v; });
    if (!reduce) setInterval(function () { if (!hsicht || document.hidden) return; setze(1.7 + Math.random() * .6, (Math.random() - .5) * .3); }, 1700);
  }

  /* ===== Heizkosten-Vergleich über 20 Jahre ===== */
  var S = { modus: 'haus', jaz: 3.4, foe: 30, zeige: { wp: true, gas: true, oel: true, pel: false } };
  var NAME = { wp: 'Wärmepumpe', gas: 'Gas-Brennwert', oel: 'Öl-Brennwert', pel: 'Pellets' };
  var KURZ = { wp: 'Wärmepumpe', gas: 'Gas', oel: 'Öl', pel: 'Pellets' };
  var FIX = { wp: 250, gas: 430, oel: 320, pel: 450 };          // Wartung, Schornsteinfeger, Grund-/Zählerpreis je Jahr (Annahme)
  var ETA = { gas: .90, oel: .92, pel: .88 };                   // Jahresnutzungsgrade (Annahme)
  var CO2F = { gas: .182, oel: .266 };                          // kg CO2 je kWh (Gas auf Brennwert, Heizöl auf Heizwert)
  var FOE_MAX = 28000;                                          // förderfähige Kosten, erste Wohneinheit (KfW 458, Stand 21.07.2026)
  function wahl(id, fn) { $$('#' + id + ' button').forEach(function (b) { b.addEventListener('click', function () { if (b.disabled) return; fn(b); vrechne(); }); }); }
  function einzeln(id, key, num) { wahl(id, function (b) { $$('#' + id + ' button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); S[key] = num ? +b.dataset.v : b.dataset.v; }); }
  einzeln('v-modus', 'modus'); einzeln('v-flaechen', 'jaz', true); einzeln('v-foe', 'foe', true);
  wahl('v-zeige', function (b) { var an = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', an); S.zeige[b.dataset.v] = an; });
  /* 20N-FIX5: Werte auf min/max des Feldes begrenzen – vorher machte z. B. „1e75“ (Tippfehler mit e) die Kurven kaputt (SVG-Fehler) */
  var num = function (id, def) { var e = $('#' + id), v = parseFloat((e.value || '').replace(',', '.')); if (!isFinite(v) || v <= 0) return def; var mi = parseFloat(e.min), ma = parseFloat(e.max); if (isFinite(mi)) v = Math.max(mi, v); if (isFinite(ma)) v = Math.min(ma, v); return v; };
  function co2(jahr, ziel) { if (jahr <= 2027) return 60; if (jahr >= 2030) return ziel; return 60 + (ziel - 60) * (jahr - 2027) / 3; }

  function modell() {
    var Q = S.modus === 'haus' ? +$('#v-flaeche').value * +$('#v-baujahr').value : +$('#v-kwh').value;
    Q = Math.round(Q / 50) * 50;
    var e = +$('#v-stg').value / 100, ziel = +$('#v-co2').value;
    var P = { gas: num('a-gas', 12.2), oel: num('a-oel', 175) / 10, wp: num('a-wp', 27), pel: num('a-pel', 9.3) };   // ct/kWh brutto
    var I = { wp: num('i-wp', 30000), gas: num('i-gas', 13000), oel: num('i-oel', 16000), pel: num('i-pel', 32000) };
    var foe = { wp: S.foe / 100, pel: Math.min(S.foe, 30) / 100, gas: 0, oel: 0 };
    var R = {};
    ['wp', 'gas', 'oel', 'pel'].forEach(function (h) {
      var inv = I[h] - foe[h] * Math.min(I[h], FOE_MAX), cum = [inv], jahr0 = 0;
      for (var y = 1; y <= 20; y++) {
        var g = Math.pow(1 + e, y), kosten;
        if (h === 'wp') kosten = Q / S.jaz * P.wp / 100 * g;
        else if (h === 'pel') kosten = Q / ETA.pel * P.pel / 100 * g;
        else { var co2heute = 60 * CO2F[h] / 10 * 1.19, basis = P[h] - co2heute; kosten = Q / ETA[h] * (basis * g + co2(2026 + y, ziel) * CO2F[h] / 10 * 1.19) / 100; }
        kosten += FIX[h] * g; if (y === 1) jahr0 = kosten;
        cum.push(cum[y - 1] + kosten);
      }
      R[h] = { cum: cum, inv: inv, foe: I[h] - inv, jahr1: jahr0 };
    });
    return { Q: Q, R: R };
  }
  function kreuzung(a, b) {   // erstes (gebrochenes) Jahr, ab dem a kumuliert günstiger ist als b
    if (a[0] <= b[0]) return 0;
    for (var y = 1; y <= 20; y++) { var d0 = a[y - 1] - b[y - 1], d1 = a[y] - b[y]; if (d1 <= 0) return y - 1 + d0 / (d0 - d1); }
    return null;
  }

  var chart = $('#chart'), gR = $('#ch-raster'), gL = $('#ch-linien'), gM = $('#ch-marke'), linien = {}, enden = {}, clip = null, gezeichnet = false;
  function el(tag, at) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); return n; }
  (function aufbauen() {
    var defs = el('defs', {}), cp = el('clipPath', { id: 'ch-clip' }); clip = el('rect', { x: 0, y: -20, width: reduce ? 2000 : 0, height: 2000 }); cp.appendChild(clip); defs.appendChild(cp); chart.insertBefore(defs, chart.firstChild);
    gL.setAttribute('clip-path', 'url(#ch-clip)');
    ['oel', 'pel', 'gas', 'wp'].forEach(function (h) { linien[h] = el('path', { 'class': 'lin ' + h, d: '' }); gL.appendChild(linien[h]); enden[h] = el('text', { 'class': 'lin-end ' + h, x: 0, y: 0 }); enden[h].textContent = KURZ[h]; chart.appendChild(enden[h]); });
  })();
  function zeichne(M) {
    var W = Math.max(280, Math.round(chart.parentNode.clientWidth || 600)), schmal = W < 480, H = schmal ? 250 : 330;
    chart.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var L = schmal ? 46 : 58, Rr = W - (schmal ? 64 : 76), T = 14, B = H - 30;
    var sh = Object.keys(S.zeige).filter(function (h) { return S.zeige[h]; });
    var max = 0; sh.forEach(function (h) { max = Math.max(max, M.R[h].cum[20]); });
    var stufe = [5000, 10000, 20000, 25000, 50000].filter(function (s) { return max / s <= 6; })[0] || 50000, top = Math.ceil(max / stufe) * stufe;
    var x = function (y) { return L + (Rr - L) * y / 20; }, yv = function (v) { return B - (B - T) * v / top; };
    var r = '';
    for (var v = 0; v <= top; v += stufe) r += '<line x1="' + L + '" x2="' + Rr + '" y1="' + yv(v).toFixed(1) + '" y2="' + yv(v).toFixed(1) + '"/><text x="' + (L - 8) + '" y="' + (yv(v) + 4).toFixed(1) + '" text-anchor="end">' + (v ? de(v / 1000) + ' T€' : '0') + '</text>';
    [0, 5, 10, 15, 20].forEach(function (y) { r += '<text x="' + x(y).toFixed(1) + '" y="' + (B + 20) + '" text-anchor="middle">' + (y === 0 ? 'Kauf' : (schmal ? y + ' J.' : 'Jahr ' + y)) + '</text>'; });
    r += '<line class="achse" x1="' + L + '" x2="' + Rr + '" y1="' + B + '" y2="' + B + '"/>';
    gR.innerHTML = r;
    var ends = [];
    ['wp', 'gas', 'oel', 'pel'].forEach(function (h) {
      var c = M.R[h].cum, d = 'M' + x(0).toFixed(1) + ' ' + yv(c[0]).toFixed(1);
      for (var y = 1; y <= 20; y++) d += 'L' + x(y).toFixed(1) + ' ' + yv(c[y]).toFixed(1);
      linien[h].setAttribute('d', d); linien[h].style.d = 'path("' + d + '")';
      linien[h].style.opacity = S.zeige[h] ? 1 : 0; enden[h].style.opacity = S.zeige[h] ? 1 : 0;
      if (S.zeige[h]) ends.push({ h: h, y: yv(c[20]) + 4 });
    });
    ends.sort(function (a, b) { return a.y - b.y; });
    for (var i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
    ends.forEach(function (e) { enden[e.h].setAttribute('x', Rr + 8); enden[e.h].setAttribute('y', e.y.toFixed(1)); });
    clip.setAttribute('height', H + 40);
    if (gezeichnet || reduce) clip.setAttribute('width', W + 20);
    // Kreuzungspunkt Wärmepumpe / Gas (sonst Öl)
    gM.innerHTML = '';
    var ref = S.zeige.gas ? 'gas' : (S.zeige.oel ? 'oel' : (S.zeige.pel ? 'pel' : null));
    if (ref) {
      var kx = kreuzung(M.R.wp.cum, M.R[ref].cum);
      if (kx !== null && kx > 0) {
        var a = Math.floor(kx), f = kx - a, c = M.R.wp.cum, vy = c[a] + (c[Math.min(20, a + 1)] - c[a]) * f, px = x(kx), py = yv(vy);
        gM.appendChild(el('line', { 'class': 'mk-linie', x1: px, x2: px, y1: T + 18, y2: B }));
        gM.appendChild(el('circle', { 'class': 'mk-ring', cx: px, cy: py, r: 7 }));
        gM.appendChild(el('circle', { 'class': 'mk-punkt', cx: px, cy: py, r: 5 }));
        var rechts = px > (L + Rr) / 2, tx = el('text', { 'class': 'mk-text', x: px + (rechts ? -8 : 8), y: T + 14, 'text-anchor': rechts ? 'end' : 'start' }); tx.textContent = schmal ? 'ab hier günstiger' : 'Wärmepumpe ab hier günstiger als ' + KURZ[ref]; gM.appendChild(tx);
      }
    }
  }
  function zeichnenStart() { if (gezeichnet || reduce) return; gezeichnet = true; var W = +chart.getAttribute('viewBox').split(' ')[2] + 20, t0 = 0; (function lauf(t) { if (!t0) t0 = t; var p = Math.max(0, Math.min(1, (t - t0) / 1500)); p = 1 - Math.pow(1 - p, 3); clip.setAttribute('width', (W * p).toFixed(1)); if (p < 1) requestAnimationFrame(lauf); })(performance.now()); }
  var letzte = null;
  function vrechne() {
    $('#m-haus').hidden = S.modus !== 'haus'; $('#m-kwh').hidden = S.modus !== 'kwh';
    $('#o-flaeche').textContent = $('#v-flaeche').value + ' m²'; $('#o-kwh').textContent = de(+$('#v-kwh').value) + ' kWh';
    $('#o-stg').textContent = de(+$('#v-stg').value, 1) + ' % / Jahr'; $('#o-co2').textContent = $('#v-co2').value + ' € / t';
    $('#o-jaz').textContent = de(S.jaz, 1); $('#ann-jaz').textContent = de(S.jaz, 1);
    var M = modell(); letzte = M;
    $('#e-bedarf').textContent = de(M.Q) + ' kWh / Jahr';
    zeichne(M);
    var ref = S.zeige.gas ? 'gas' : (S.zeige.oel ? 'oel' : (S.zeige.pel ? 'pel' : null)), kj = $('#e-jahr'), kt = $('#e-kreuztxt');
    if (!ref) { kj.textContent = '–'; kt.textContent = 'Wählen Sie eine Heizung zum Vergleich.'; }
    else {
      var kx = kreuzung(M.R.wp.cum, M.R[ref].cum), zus = '';
      if (ref === 'gas' && S.zeige.oel) { var ko = kreuzung(M.R.wp.cum, M.R.oel.cum); zus = ko === null ? '' : (ko === 0 ? ' · gegenüber Öl von Anfang an' : ' · gegenüber Öl ab Jahr ' + Math.max(1, Math.ceil(ko))); }
      if (kx === null) { kj.textContent = '> 20 J.'; kt.textContent = 'Mit diesen Annahmen holt die Wärmepumpe ' + (ref === 'gas' ? 'Gas' : NAME[ref]) + ' in 20 Jahren nicht ein' + zus + '.'; }
      else if (kx === 0) { kj.textContent = 'ab Tag 1'; kt.textContent = 'ist die Wärmepumpe günstiger als ' + (ref === 'gas' ? 'Gas' : NAME[ref]) + zus; }
      else { kj.textContent = 'Jahr ' + Math.max(1, Math.ceil(kx)); kt.textContent = 'ab hier ist die Wärmepumpe günstiger als ' + (ref === 'gas' ? 'Gas' : NAME[ref]) + zus; }
    }
    var ul = $('#e-summen'), h = '';
    ['wp', 'gas', 'oel', 'pel'].forEach(function (k) { if (!S.zeige[k]) return; h += '<li class="' + k + '"><span><i></i>' + NAME[k] + '</span><b>' + de(Math.round(M.R[k].cum[20] / 100) * 100) + ' €</b></li>'; });
    if (ref) { var sp = M.R[ref].cum[20] - M.R.wp.cum[20]; h += '<li class="spar"><span>' + (sp >= 0 ? 'Wärmepumpe spart gegenüber ' : 'Wärmepumpe kostet mehr als ') + (ref === 'gas' ? 'Gas' : NAME[ref]) + ' in 20 Jahren</span><b>' + de(Math.round(Math.abs(sp) / 100) * 100) + ' €</b></li>'; }
    if (M.R.wp.foe > 0) h += '<li class="spar"><span>davon Förderung Wärmepumpe (' + S.foe + ' % von max. 28.000 €)</span><b>− ' + de(Math.round(M.R.wp.foe)) + ' €</b></li>';
    ul.innerHTML = h;
    $('#v-knopf').dataset.text = de(M.Q) + ' kWh/Jahr' + (S.modus === 'haus' ? ' (' + $('#v-flaeche').value + ' m², ' + $('#v-baujahr').selectedOptions[0].textContent + ')' : '') + ', Heizflächen: ' + $('#v-flaechen [aria-pressed=true]').textContent;
  }
  ['#v-flaeche', '#v-baujahr', '#v-kwh', '#v-stg', '#v-co2', '#a-gas', '#a-oel', '#a-wp', '#a-pel', '#i-wp', '#i-gas', '#i-oel', '#i-pel'].forEach(function (s) { $(s).addEventListener('input', vrechne); $(s).addEventListener('change', vrechne); });
  vrechne();
  var rq = 0; addEventListener('resize', function () { cancelAnimationFrame(rq); rq = requestAnimationFrame(function () { if (letzte) zeichne(letzte); }); });
  sichtbar($('.diagramm'), function (v) { if (v) zeichnenStart(); }, { threshold: .35 });
  var vk = $('#v-knopf'); vk.addEventListener('click', function () { var t = $('#k-text'); if (t && !t.value) t.value = 'Heizkosten-Vergleich: ' + vk.dataset.text + '. '; var th = $('#k-thema'); if (th && !th.value) th.value = 'Wärmepumpe'; });

  /* ===== Wärmepumpe: Kältekreis Schritt für Schritt (scrollgesteuert) ===== */
  var INFO = [
    'Der Lüfter zieht Außenluft – hier 2 °C – durch die Lamellen. Das Kältemittel R290 ist darin noch kälter: Es verdampft bei rund −5 °C und nimmt dabei Wärme aus der Luft auf. Das funktioniert auch bei Frost.',
    'Der elektrisch angetriebene Verdichter presst das gasförmige Kältemittel von rund 4 auf rund 13 bar zusammen. Dabei steigt seine Temperatur auf etwa 65 °C – genau dafür braucht die Wärmepumpe Strom.',
    'Im Plattenwärmetauscher gibt das heiße Gas seine Wärme an das Heizwasser ab und wird bei rund 38 °C wieder flüssig. Das Heizwasser kommt mit 30 °C zurück und geht mit 35 °C in Fußbodenheizung oder Heizkörper.',
    'Das Expansionsventil baut den Druck wieder ab. Das flüssige Kältemittel kühlt dabei auf rund −5 °C ab und fließt zurück in den Verdampfer – der Kreis beginnt von vorn, ganz ohne Verbrennung.',
    'Bei A2/W35 macht eine gute Luft-Wasser-Wärmepumpe aus 1 kWh Strom rund 3,8 kWh Wärme – den Rest holt sie aus der Luft. Übers Jahr erreichen Luft-Wasser-Wärmepumpen im Bestand laut Fraunhofer ISE im Mittel eine Jahresarbeitszahl von 3,4. Je niedriger der Vorlauf, desto besser.'
  ];
  var WERTE = ['Außenluft 2 °C → verdampft bei ca. −5 °C → Sauggas ca. 0 °C', 'ca. 4 bar → ca. 13 bar · Heißgas ca. 65 °C', 'kondensiert bei ca. 38 °C · Heizwasser 30 → 35 °C', 'flüssig ca. 32 °C → nach dem Ventil ca. −5 °C', 'COP ca. 3,8 bei A2/W35 · JAZ im Bestand Ø 3,4'];
  var wpS = $('#waermepumpe'), buehne = $('.wp .buehne'), schnitt = $('#schnitt'), liste = $$('#schritte li'), wiNr = $('#wi-nr'), wiT = $('#wi-t'), znr = $('#znr'), aktiv = -1;
  function schritt(i) {
    if (i === aktiv) return; aktiv = i;
    liste.forEach(function (li, j) { li.classList.toggle('an', j === i); li.classList.toggle('fertig', j < i); });
    $$('#wpsvg .st, #wpsvg .tmp').forEach(function (g) { g.classList.toggle('an', i === 4 || +g.dataset.i === i); });
    schnitt.classList.toggle('bilanz', i === 4);
    wiNr.textContent = '0' + (i + 1) + ' / 05'; wiT.textContent = INFO[i]; $('#wi-w').textContent = WERTE[i]; znr.textContent = '0' + (i + 1);
  }
  var wAuf = $('.wtext .auf');
  function wpScroll() { wq = 0; var r = buehne.getBoundingClientRect(); if (r.top < innerHeight * .8 && r.bottom > 0) wAuf.classList.add('da'); var p = Math.max(0, Math.min(.9999, -r.top / Math.max(1, r.height - innerHeight))); schritt(Math.floor(p * 5)); }
  var wq = 0; addEventListener('scroll', function () { if (!wq) wq = requestAnimationFrame(wpScroll); }, { passive: true }); wpScroll();
  liste.forEach(function (li, j) { li.addEventListener('click', function () { var r = buehne.getBoundingClientRect(), top = r.top + scrollY, h = r.height - innerHeight; scrollTo({ top: top + h * (j + .5) / 5, behavior: reduce ? 'auto' : 'smooth' }); }); });
  sichtbar(wpS, function (v) { wpS.classList.toggle('laeuft', v && !reduce); });

  /* ===== Kontaktformular (Beispiel: verschickt nichts) ===== */
  var f = $('#kontaktform'), fh = $('#formhinweis');
  f.addEventListener('submit', function (e) {
    e.preventDefault(); if (f.website.value) return;
    var fehlt = [], felder = [];
    if (!f.name.value.trim()) { fehlt.push('Ihren Namen'); felder.push(f.name); }
    if (!f.telefon.value.trim()) { fehlt.push('eine Telefonnummer'); felder.push(f.telefon); }
    if (!f.thema.value) { fehlt.push('worum es geht'); felder.push(f.thema); }
    if (!f.datenschutz.checked) fehlt.push('das Häkchen zum Datenschutz');
    $$('.fehlt', f).forEach(function (x) { x.classList.remove('fehlt'); }); felder.forEach(function (x) { x.classList.add('fehlt'); });
    if (felder[0]) felder[0].focus();
    fh.textContent = fehlt.length ? 'Bitte noch ergänzen: ' + fehlt.join(', ') + '.' : 'Danke! Im Beispiel-Template wird nichts verschickt – auf Ihrer echten Seite landet die Anfrage sofort bei Ihnen.';
  });
  $$('input,select', f).forEach(function (x) { x.addEventListener('input', function () { x.classList.remove('fehlt'); }); });

  /* ===== Fragen-Assistent ===== */
  var KB = [
    { k: ['gasheizung', 'gas', 'ölheizung', 'öl', 'heizungsgesetz', 'erlaubt', 'verbot'], q: 'Darf ich noch eine Gasheizung einbauen?', a: 'Ja. Mit dem Gebäudemodernisierungsgesetz (vom Bundestag am 10. Juli 2026 beschlossen) entfällt die 65-%-Pflicht. Für neu eingebaute Gas- und Ölheizungen im Bestand gilt aber die „Biotreppe“: mindestens 10 % klimaneutrale Brennstoffe ab 2029, 15 % ab 2030, 30 % ab 2035 und 60 % ab 2040.' },
    { k: ['förder', 'foerder', 'zuschuss', 'kfw', 'bafa', '458'], q: 'Welche Förderung gibt es?', a: 'Über die KfW (Programm 458): 30 % Grundförderung, dazu für Selbstnutzer 16 % Klimageschwindigkeitsbonus beim Tausch einer funktionierenden Öl- oder mindestens 20 Jahre alten Gasheizung und je nach Einkommen bis zu 40 % Einkommensbonus. Förderfähig sind bis zu 28.000 € für die erste Wohneinheit (Stand Juli 2026). Ihre genaue Förderung prüfen wir beim Termin.' },
    { k: ['altbau', 'unsaniert', 'heizkörper', 'heizkoerper', 'alt'], q: 'Wärmepumpe im Altbau?', a: 'Oft ja. Laut Fraunhofer-ISE-Feldtest erreichen Luft-Wasser-Wärmepumpen in Bestandshäusern im Mittel eine Jahresarbeitszahl von 3,4. Entscheidend ist die Vorlauftemperatur: Wir berechnen die Heizlast raumweise nach DIN EN 12831 und prüfen, ob Ihre Heizkörper reichen – manchmal muss nur ein einzelner getauscht werden.' },
    { k: ['abgleich', 'hydraulisch'], q: 'Was ist der hydraulische Abgleich?', a: 'Jeder Heizkörper und jeder Heizkreis bekommt genau so viel Heizwasser, wie der Raum braucht. Ohne Abgleich werden nahe Räume zu warm und ferne zu kalt, und die Pumpe arbeitet mehr als nötig. Für die KfW-Heizungsförderung ist er Voraussetzung – wir machen ihn nach Verfahren B mit raumweiser Heizlast.' },
    { k: ['laut', 'lärm', 'laerm', 'nachbar', 'schall'], q: 'Wie laut ist eine Wärmepumpe?', a: 'Moderne Außengeräte sind leise, entscheidend ist der Aufstellort. Maßgeblich ist die TA Lärm: nachts 35 dB(A) im reinen und 40 dB(A) im allgemeinen Wohngebiet – gemessen am Fenster der Nachbarn. Wir prüfen den Abstand vorab.' },
    { k: ['co2', 'co₂', 'preis', 'ets'], q: 'Wie entwickelt sich der CO₂-Preis?', a: '2026 liegt er im gesetzlichen Korridor von 55 bis 65 € je Tonne; der Bundestag hat diesen Korridor am 15. Oktober 2026 auch für 2027 beschlossen. Ab 2028 soll der EU-Emissionshandel für Gebäude (ETS 2) starten, dann bildet sich der Preis am Markt. Das betrifft Gas und Heizöl, nicht Strom für die Wärmepumpe.' },
    { k: ['legionell', 'trinkwasser', 'probe', 'trinkwv'], q: 'Muss ich auf Legionellen prüfen lassen?', a: 'Die Trinkwasserverordnung verlangt die Untersuchung bei Großanlagen zur Trinkwassererwärmung (Speicher über 400 Liter oder mehr als 3 Liter Inhalt in einer Leitung zwischen Trinkwassererwärmer und Zapfstelle), wenn es Duschen gibt: bei gewerblicher Nutzung wie Vermietung mindestens alle drei Jahre, bei öffentlicher jährlich. Anlagen in Ein- und Zweifamilienhäusern sind keine Großanlagen.' },
    { k: ['bad', 'dusche', 'barriere', 'bodengleich', 'sanierung'], q: 'Bad barrierefrei umbauen?', a: 'Gern. Wir planen bodengleiche Duschen mit Abdichtung nach DIN 18534 und – wenn gewünscht – barrierefrei nach DIN 18040-2: 120 × 120 cm Bewegungsfläche vor WC, Waschtisch und in der Dusche. Ein Komplettbad dauert meist zwei bis drei Wochen.' },
    { k: ['termin', 'kontakt', 'rückruf', 'rueckruf', 'anfrage', 'störung', 'notdienst'], q: 'Termin anfragen', a: 'Gern! Unten im Formular eintragen – wir melden uns Montag bis Freitag am selben Werktag.', ziel: '#kontakt' }
  ];
  var vl = $('#verlauf'), ch = $('#chips'), assi = $('#assi');
  function sag(t, w) { var d = document.createElement('div'); d.className = 'msg ' + w; d.textContent = t; vl.appendChild(d); vl.scrollTop = vl.scrollHeight; }
  function antworte(text) {
    var t = text.toLowerCase(), best = null, bs = 0;
    KB.forEach(function (e) { var s = 0; e.k.forEach(function (k) { if (t.indexOf(k) > -1) s++; }); if (s > bs) { bs = s; best = e; } });
    setTimeout(function () { if (best) { sag(best.a, 'bot'); if (best.ziel) location.hash = best.ziel.slice(1); } else sag('Dazu habe ich keine sichere Antwort. Schreiben Sie uns kurz über das Formular – wir rufen Sie zurück.', 'bot'); }, reduce ? 0 : 320);
  }
  sag('Hallo! Fragen zu Wärmepumpe, Förderung oder Bad? Einfach antippen:', 'bot');
  KB.forEach(function (e) { var b = document.createElement('button'); b.type = 'button'; b.textContent = e.q; b.onclick = function () { sag(e.q, 'ich'); setTimeout(function () { sag(e.a, 'bot'); if (e.ziel) location.hash = e.ziel.slice(1); }, reduce ? 0 : 320); }; ch.appendChild(b); });
  $('#assiform').addEventListener('submit', function (e) { e.preventDefault(); var i = $('#assiein'); if (!i.value.trim()) return; sag(i.value, 'ich'); antworte(i.value); i.value = ''; });
  var zu = $('#assizu');
  function toggle() { assi.classList.remove('mini'); var z = assi.classList.toggle('zu'); zu.textContent = z ? '+' : '–'; zu.setAttribute('aria-label', z ? 'Fragen-Assistent öffnen' : 'Fragen-Assistent einklappen'); }
  $('#assikopf').addEventListener('click', toggle);
  if (innerWidth < 700 || innerHeight < 600) toggle(); else assi.classList.add('mini');
  assi.addEventListener('click', function (e) { if (assi.classList.contains('mini') && !e.target.closest('#assizu')) assi.classList.remove('mini'); });
})();
