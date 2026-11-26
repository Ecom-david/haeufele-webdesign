/* Sonnfeld Energie – Seitenlogik (ohne Bibliotheken, läuft per Doppelklick). */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var de = function (n, d) { return n.toLocaleString('de-DE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };

  /* Weiches Scrollen (Lenis, MIT, lokal) */
  if (!reduce && window.Lenis) { try { window.__lenis = new Lenis({ lerp: .1, wheelMultiplier: .9, autoRaf: true, anchors: { offset: -10 } }); } catch (e) { } }

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
        } else if (c.nodeType === 1 && c.tagName !== 'BR') {
          if (c.tagName === 'EM') { c.classList.add('wort'); c.style.transitionDelay = (i++ * 55) + 'ms'; } else walk(c);
        }
      });
    })(h);
  });

  /* Einblenden */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; e.target.classList.add('da'); io.unobserve(e.target); });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  $$('.auf').forEach(function (el) { io ? io.observe(el) : el.classList.add('da'); });
  $$('h1,h2').forEach(function (h) { if (!h.closest('.auf') && !h.closest('.kapitel') && !h.closest('.fk')) { io ? io.observe(h) : h.classList.add('da'); } });

  /* ===== Energiemodell: typischer Sonnentag im Mai, 9,8 kWp, 10 kWh Speicher (Beispielwerte) ===== */
  var KWP = 9.8, KAP = 10, N = 96, E = [];
  (function () {
    var soc = 3.2; // kWh um Mitternacht
    for (var i = 0; i < N; i++) {
      var h = i / 4, pv = 0;
      if (h > 5.6 && h < 20.6) pv = KWP * 0.74 * Math.pow(Math.sin(Math.PI * (h - 5.6) / 15), 1.35);
      var haus = 0.32 + 0.9 * Math.exp(-Math.pow((h - 7.2) / 0.8, 2)) + 0.6 * Math.exp(-Math.pow((h - 12.5) / 0.9, 2)) + 1.6 * Math.exp(-Math.pow((h - 18.8) / 1.3, 2));
      var wp = 0.25 + 0.9 * Math.exp(-Math.pow((h - 13.5) / 1.6, 2)) + 0.35 * Math.exp(-Math.pow((h - 6.5) / 0.9, 2));
      var auto = (h >= 11 && h < 14.5) ? Math.max(0, Math.min(7.4, pv - haus - wp - 0.6)) : 0;
      if (auto < 1.4) auto = 0; // Wallbox lädt erst ab ca. 1,4 kW (einphasig 6 A)
      var bed = haus + wp + auto, ueb = pv - bed, spei = 0, netz = 0;
      if (ueb > 0) { spei = Math.min(ueb, 5, (KAP - soc) * 4); netz = -(ueb - spei); }      // + = Netzbezug, - = Einspeisung
      else { spei = -Math.min(-ueb, 5, Math.max(0, soc - 0.5) * 4); netz = -ueb + spei; }
      soc = Math.max(0, Math.min(KAP, soc + spei / 4));
      E.push({ h: h, pv: pv, haus: haus, wp: wp, auto: auto, spei: spei, netz: netz, soc: soc });
    }
  })();
  function at(h) { var i = Math.max(0, Math.min(N - 1, Math.round(h * 4))); return E[i]; }
  function kw(x) { return de(Math.abs(x), 1) + ' kW'; }
  function uhr(h) { var m = Math.round(h * 60) % 1440; return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }

  var maxPv = Math.max.apply(null, E.map(function (e) { return e.pv; }));
  /* (Hero-Monitor ersetzt durch Foto-Kino mit Sonnenstand-Regler, siehe pv-kino.js) */
  /* ===== Ein Tag: Energiefluss, scrollgesteuert ===== */
  var buehne = $('#tagbuehne'), stroeme = $('#stroeme'), arts = $$('#kapitel article'), uhrEl = $('#uhr'), ton = $('#hgton');
  var LEIT = { 'dach-haus': 'pv', 'dach-spei': 'pv', 'spei-haus': 's', 'haus-auto': 'auto', 'haus-wp': 'wp', 'dach-netz': 'pv', 'netz-haus': 'n' };
  var flusspfade = {};
  Object.keys(LEIT).forEach(function (id) {
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', $('#l-' + id).getAttribute('d')); stroeme.appendChild(p); flusspfade[id] = p;
  });
  var KAP_STD = [7, 12.5, 19, 23.5], tagH = 7, tagSoll = 7, kapAkt = 0;
  function tagFort() { var r = buehne.getBoundingClientRect(); return Math.max(0, Math.min(1, -r.top / (r.height - innerHeight))); }
  function fluss(h) {
    var e = at(h), dir = {};
    var pvHaus = Math.min(e.pv, e.haus + e.wp + e.auto), pvSpei = Math.max(0, e.spei), pvNetz = Math.max(0, -e.netz);
    var speiHaus = Math.max(0, -e.spei), netzHaus = Math.max(0, e.netz);
    var w = { 'dach-haus': pvHaus, 'dach-spei': pvSpei, 'dach-netz': pvNetz, 'spei-haus': speiHaus, 'netz-haus': netzHaus, 'haus-auto': e.auto, 'haus-wp': e.wp };
    Object.keys(w).forEach(function (id) {
      var v = w[id], p = flusspfade[id];
      p.style.opacity = v > 0.05 ? Math.min(1, .35 + v / 4) : 0; p.style.strokeWidth = (1.5 + Math.min(4, v * .7)).toFixed(2);
      p.dataset.v = v;
    });
    $('#k-dach').textContent = kw(e.pv); $('#k-haus').textContent = kw(e.haus); $('#k-wp').textContent = kw(e.wp); $('#k-auto').textContent = kw(e.auto);
    $('#k-netz').textContent = (e.netz < -0.05 ? '→ ' : e.netz > 0.05 ? '← ' : '') + kw(e.netz);
    $('#k-spei').textContent = de(Math.round(e.soc / KAP * 100)) + ' %'; $('#k-batfuell').style.setProperty('--f', (e.soc / KAP).toFixed(3));
    $$('.knoten').forEach(function (n) { var k = n.dataset.k, a = { dach: e.pv > .1, spei: Math.abs(e.spei) > .1, haus: true, netz: Math.abs(e.netz) > .1, auto: e.auto > .1, wp: e.wp > .3 }[k]; n.classList.toggle('aktiv', !!a); });
    uhrEl.textContent = uhr(h);
    // Tageszeit-Ton des Hintergrunds
    var sonnig = Math.max(0, Math.min(1, e.pv / maxPv));
    ton.style.setProperty('--ta', (.04 + sonnig * .14).toFixed(3)); ton.style.setProperty('--tx', (20 + (h - 6) / 14 * 60).toFixed(0) + '%'); ton.style.setProperty('--ty', (40 - sonnig * 30).toFixed(0) + '%');
  }
  var off = 0;
  function tagTick(t) {
    requestAnimationFrame(tagTick);
    var r = buehne.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || document.hidden) return;
    var p = tagFort(); tagSoll = 6 + p * 18; // 06:00 → 24:00
    tagH += (tagSoll - tagH) * (reduce ? 1 : .12);
    var kp = Math.min(3, Math.floor(p * 4)); if (kp !== kapAkt) { arts[kapAkt].classList.remove('an'); arts[kp].classList.add('an'); kapAkt = kp; }
    fluss(Math.min(23.9, tagH));
    if (!reduce) { off = (off + 0.6) % 1000; Object.keys(flusspfade).forEach(function (id) { var v = +flusspfade[id].dataset.v || 0; flusspfade[id].style.strokeDashoffset = -(off * (0.6 + Math.min(2.5, v * .5))).toFixed(1); }); }
  }
  arts.forEach(function (a) { $$('.wort', a).forEach(function (w) { w.style.transitionDelay = '0ms'; }); });
  fluss(7); requestAnimationFrame(tagTick);

  /* ===== Ertragsrechner (Richtwerte Raum Ulm) ===== */
  // spezifischer Ertrag in kWh/kWp je Ausrichtung und Neigung (0–60°), Größenordnung PVGIS Ulm
  var TAB = {
    S: [915, 1000, 1040, 1050, 1045, 1020, 965],
    SO: [915, 975, 1000, 1000, 990, 960, 905],
    OW: [915, 905, 880, 860, 825, 785, 740],
    N: [915, 815, 705, 620, 545, 470, 410]
  };
  var R = { ausr: 'S', spei: 1 };
  function wahl(id, key) {
    $$('#' + id + ' button').forEach(function (b) {
      b.addEventListener('click', function () { $$('#' + id + ' button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); R[key] = key === 'spei' ? +b.dataset.v : b.dataset.v; rechne(); });
    });
  }
  wahl('w-ausr', 'ausr'); wahl('w-spei', 'spei');
  ['r-kwp', 'r-neig', 'r-verb'].forEach(function (id) { $('#' + id).addEventListener('input', rechne); });
  function spez(a, n) { var t = TAB[a], i = Math.min(5, Math.floor(n / 10)), f = n / 10 - i; return t[i] + (t[i + 1] - t[i]) * f; }
  function rechne() {
    var p = +$('#r-kwp').value, n = +$('#r-neig').value, v = +$('#r-verb').value;
    $('#o-kwp').textContent = de(p, 1) + ' kWp'; $('#o-neig').textContent = n + '°'; $('#o-verb').textContent = de(v) + ' kWh';
    var mod = Math.ceil(p * 1000 / 440); $('#o-modul').textContent = '≈ ' + mod + ' Module à 440 Wp · ≈ ' + de(Math.round(mod * 1.95)) + ' m² Dachfläche';
    var y = spez(R.ausr, n), ert = p * y;
    // Eigenverbrauch (Richtwert nach typischen Lastprofilen, HTW-Größenordnung)
    var r = ert / v, aut0 = Math.min(.35, .27 * Math.pow(Math.min(r, 3), .3)), aut = R.spei ? Math.min(.80, aut0 + .36 * Math.min(1, r / 1.3)) : aut0;
    var ev = Math.min(ert * .95, aut * v), ein = ert - ev, aantNorm = Math.min(1, 10 / p);
    var spar = ev * .37, verg = ein * (aantNorm * .077 + (1 - aantNorm) * .0666);
    $('#e-ertrag').textContent = de(Math.round(ert / 50) * 50);
    $('#e-text').textContent = 'entspricht ca. ' + de(Math.round(y / 5) * 5) + ' kWh je kWp';
    $('#e-ev').textContent = '≈ ' + de(Math.round(ev / 50) * 50) + ' kWh';
    $('#e-aut').textContent = '≈ ' + Math.round(ev / v * 100) + ' %';
    $('#e-spar').textContent = '≈ ' + de(Math.round(spar / 10) * 10) + ' €/Jahr';
    $('#e-einsp').textContent = '≈ ' + de(Math.round(verg / 10) * 10) + ' €/Jahr';
    $('#b-ev').style.width = (ev / ert * 100) + '%'; $('#b-ein').style.width = (ein / ert * 100) + '%';
    dach(n, mod, R.ausr);
    $('#r-knopf').dataset.text = 'Anlage ca. ' + de(p, 1) + ' kWp, ' + { S: 'Süd', SO: 'Südost/Südwest', OW: 'Ost-West', N: 'Nord' }[R.ausr] + ', ' + n + '° Neigung, Verbrauch ' + de(v) + ' kWh, ' + (R.spei ? 'mit' : 'ohne') + ' Speicher';
  }
  function dach(n, mod, a) {   // kleine Dachskizze: Neigung + Modulreihen
    var rad = n * Math.PI / 180, L = 150, x0 = 30, y0 = 112, x1 = x0 + L * Math.cos(rad) * 1.6, y1 = y0 - L * Math.sin(rad) * .55;
    if (n === 0) { y1 = y0 - 4; }
    var d = 'M' + x0 + ' ' + y0 + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + Math.min(310, x1 + 40) + ' ' + y0;
    $('#dachfl').setAttribute('d', d);
    var g = $('#dachmod'), html = '', reihen = Math.min(4, Math.ceil(mod / 8)), cnt = Math.min(10, Math.ceil(mod / reihen));
    var ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI, len = Math.hypot(x1 - x0, y1 - y0);
    for (var i = 0; i < Math.min(cnt, 9); i++) { var t = (i + .5) / Math.min(cnt, 9) * .86 + .07, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; html += '<rect x="' + (x - len / 22).toFixed(1) + '" y="' + (y - 7).toFixed(1) + '" width="' + (len / 11.5).toFixed(1) + '" height="6" transform="rotate(' + ang.toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" rx="1"/>'; }
    g.innerHTML = html;
  }
  rechne();
  var rk = $('#r-knopf'); rk.addEventListener('click', function () { var t = $('#k-text'); if (t && !t.value) t.value = 'Ertragsrechner: ' + rk.dataset.text + '. '; var th = $('#k-thema'); if (th && !th.value) th.value = R.spei ? 'PV + Speicher' : 'Photovoltaik'; });

  /* ===== Kontaktformular (Beispiel: verschickt nichts) ===== */
  var f = $('#kontaktform'), h = $('#formhinweis');
  f.addEventListener('submit', function (e) {
    e.preventDefault(); if (f.website.value) return;
    var fehlt = [];
    if (!f.name.value.trim()) fehlt.push('Ihren Namen'); if (!f.telefon.value.trim()) fehlt.push('eine Telefonnummer');
    if (!f.thema.value) fehlt.push('worum es geht'); if (!f.datenschutz.checked) fehlt.push('das Häkchen zum Datenschutz');
    h.textContent = fehlt.length ? 'Bitte noch ergänzen: ' + fehlt.join(', ') + '.' : 'Danke! Im Beispiel-Template wird nichts verschickt – auf Ihrer echten Seite landet die Anfrage sofort bei Ihnen.';
  });

  /* ===== Fragen-Assistent ===== */
  var KB = [
    { k: ['lohnt', 'rentab', 'rechnet', 'amorti'], q: 'Lohnt sich PV noch?', a: 'In den meisten Fällen ja – vor allem über den Eigenverbrauch: Jede selbst genutzte kWh spart den Strompreis (oft über 30 ct), die Einspeisung bringt deutlich weniger. Darum planen wir nach Ihrem Verbrauch.' },
    { k: ['kostet ein speicher', 'speicher kost', 'preis speicher', 'speicherpreis'], q: 'Was kostet ein Speicher?', a: 'Richtwert 2026 inkl. Einbau: etwa 300–700 € je kWh Speicherkapazität (Verbraucherzentrale, Stand 07/2026) – ein 10-kWh-Speicher liegt meist bei rund 3.500–6.000 €. Nachrüsten ist fast immer möglich; den genauen Preis für Ihr Haus nennen wir nach dem Dach-Check.' },
    { k: ['speicher', 'batterie', 'akku'], q: 'Brauche ich einen Speicher?', a: 'Ein Speicher hebt den Autarkiegrad – den Anteil Ihres Bedarfs aus eigenem Solarstrom – meist von etwa 30 % auf 60–70 %. Als Faustwert passt ca. 1 kWh Speicher je 1.000 kWh Jahresverbrauch.' },
    { k: ['ost', 'west', 'nord', 'ausricht'], q: 'Geht auch Ost-West?', a: 'Ja. Ost-West bringt im Jahr etwas weniger als Süd, verteilt den Strom aber besser über den Tag – das passt oft gut zum Verbrauch.' },
    { k: ['einspeis', 'vergütung', 'eeg', 'netz'], q: 'Was bringt die Einspeisung?', a: 'Bei Inbetriebnahme bis 31.12.2026 gibt es bei Teileinspeisung 7,70 ct/kWh für den Anteil bis 10 kWp und 6,66 ct/kWh darüber (Bundesnetzagentur), 20 Jahre lang. Für Anlagen ab 2027 berät der Bundestag eine EEG-Reform – die feste Vergütung für Neuanlagen soll entfallen. Deshalb rechnen wir vor allem mit Eigenverbrauch.' },
    { k: ['wärmepumpe', 'waermepumpe', 'heizung', 'heiz'], q: 'PV und Wärmepumpe zusammen?', a: 'Das passt gut: Die Wärmepumpe nutzt mittags Sonnenstrom, z. B. fürs Warmwasser. Vorher rechnen wir die Heizlast Ihres Hauses.' },
    { k: ['wallbox', 'auto', 'laden', 'e-auto'], q: 'Auto mit Sonne laden?', a: 'Mit einer PV-fähigen Wallbox lädt das Auto bevorzugt mit Überschuss. Wallboxen bis 11 kW werden beim Netzbetreiber angemeldet – das übernehmen wir.' },
    { k: ['dauer', 'lange', 'montage', 'wochen'], q: 'Wie lange dauert es?', a: 'Die Montage selbst dauert meist nur wenige Tage. Die Zeit bis zum Termin hängt von Material und Netzbetreiber ab – den Plan bekommen Sie mit dem Angebot.' },
    { k: ['steuer', 'mehrwert', 'mwst', 'ust'], q: 'Muss ich Mehrwertsteuer zahlen?', a: 'Für PV-Anlagen und Speicher auf oder an Wohngebäuden gilt seit 2023 der Nullsteuersatz – bis 30 kWp ohne weiteren Nachweis. Zur Einkommensteuer fragen Sie bitte Ihren Steuerberater.' },
    { k: ['termin', 'check', 'kontakt', 'rückruf', 'anfrage'], q: 'Dach-Check anfragen', a: 'Gern! Unten im Formular eintragen – wir melden uns am selben Werktag.', ziel: '#kontakt' }
  ];
  var vl = $('#verlauf'), ch = $('#chips'), assi = $('#assi');
  function sag(t, w) { var d = document.createElement('div'); d.className = 'msg ' + w; d.textContent = t; vl.appendChild(d); vl.scrollTop = vl.scrollHeight; }
  function antworte(text) {
    var t = text.toLowerCase(), best = null, bs = 0;
    KB.forEach(function (e) { var s = 0; e.k.forEach(function (k) { if (t.indexOf(k) > -1) s++; }); if (s > bs) { bs = s; best = e; } });
    setTimeout(function () { if (best) { sag(best.a, 'bot'); if (best.ziel) location.hash = best.ziel.slice(1); } else sag('Dazu habe ich keine sichere Antwort. Schreiben Sie uns kurz über das Formular – wir rufen Sie zurück.', 'bot'); }, reduce ? 0 : 320);
  }
  sag('Hallo! Fragen zu Photovoltaik, Speicher oder Wärmepumpe? Einfach antippen:', 'bot');
  KB.forEach(function (e) { var b = document.createElement('button'); b.type = 'button'; b.textContent = e.q; b.onclick = function () { sag(e.q, 'ich'); antworte(e.k[0] + ' ' + e.q); }; ch.appendChild(b); });
  $('#assiform').addEventListener('submit', function (e) { e.preventDefault(); var i = $('#assiein'); if (!i.value.trim()) return; sag(i.value, 'ich'); antworte(i.value); i.value = ''; });
  var zu = $('#assizu');
  function toggle() { assi.classList.remove('mini'); var z = assi.classList.toggle('zu'); zu.textContent = z ? '+' : '–'; zu.setAttribute('aria-label', z ? 'Fragen-Assistent öffnen' : 'Fragen-Assistent einklappen'); }
  $('#assikopf').addEventListener('click', toggle);
  if (innerWidth < 700 || innerHeight < 600) toggle(); else assi.classList.add('mini');
  assi.addEventListener('click', function (e) { if (assi.classList.contains('mini') && !e.target.closest('#assizu')) assi.classList.remove('mini'); });

  /* ===== Modul-Explosion: Blender-Bildfolge, Bild = Scrollposition, weich überblendet ===== */
  var F = window.FILM, cv = $('#filmcv');
  if (F && cv) {
    var ctx = cv.getContext('2d'), mbuehne = $('.modul .buehne'), liste = $('#schritte'), znr = $('#znr'), ht = $('#handytext');  // 20N-FIX5: eigener Name (vorher „buehne“ → überschrieb die Bühne von „Ein Tag auf Ihrem Dach“, Uhr blieb bei 07:00)
    var handy = innerWidth < 900, step = handy ? 2 : 1, bilder = [], pos = -1, ziel = 0, laeuft = false, schritt = -2;
    var A1 = F.a1, SEG = (F.nf - 1 - A1) / F.steps.length;
    F.steps.forEach(function (s) { var li = document.createElement('li'); li.innerHTML = '<b>' + s.t + '</b><small>' + s.s + '</small>'; liste.appendChild(li); });
    var lis = $$('li', liste);
    var schilder = F.steps.map(function (s) { var d = document.createElement('div'); d.className = 'schild'; d.innerHTML = '<i></i><span>' + s.t + '</span>'; $('#film').appendChild(d); return d; });
    for (var i = 0; i < F.nf; i += step) (function (i) { var im = new Image(); im.decoding = 'async'; im.src = F.daten ? F.daten[i] : F.pfad + ('00' + i).slice(-3) + '.webp'; im.onload = function () { if (Math.abs(i - pos) <= step * 2) zeichne(true); }; bilder[i] = im; })(i);
    var dpr = Math.min(devicePixelRatio || 1, 1.75), geo = null;
    function groesse() { var r = cv.getBoundingClientRect(); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); geo = null; zeichne(true); }
    function ok(k) { return bilder[k] && bilder[k].complete && bilder[k].naturalWidth; }
    function naechst(n) { n = Math.max(0, Math.min(F.nf - 1, n)); n -= n % step; for (var k = n; k >= 0; k -= step) if (ok(k)) return k; return -1; }
    function fortschritt() { var r = mbuehne.getBoundingClientRect(); return Math.max(0, Math.min(1, -r.top / (r.height - innerHeight))); }
    function male(im, a) {
      if (!geo) { var s = Math.min(cv.width / im.naturalWidth, cv.height / im.naturalHeight); geo = { s: s, w: im.naturalWidth * s, h: im.naturalHeight * s }; geo.x = (cv.width - geo.w) / 2; geo.y = (cv.height - geo.h) / 2; }
      ctx.globalAlpha = a; ctx.drawImage(im, geo.x, geo.y, geo.w, geo.h);
    }
    function zeichne(force) {
      var f = pos < 0 ? 0 : pos, a = naechst(Math.floor(f)), b = naechst(Math.floor(f) + step);
      if (a < 0) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      male(bilder[a], 1);
      if (b > a) { var t = (f - a) / (b - a); if (t > .01) male(bilder[b], Math.min(1, t)); }
      ctx.globalAlpha = 1;
      var st = f < A1 - 2 ? -1 : Math.min(F.steps.length - 1, Math.floor((f - A1 + 2) / SEG));
      if (st !== schritt) {
        schritt = st;
        lis.forEach(function (li, j) { li.classList.toggle('an', j === st); li.classList.toggle('fertig', j < st); });
        znr.textContent = st < 0 ? '–' : '0' + (st + 1);
        if (ht) ht.innerHTML = st < 0 ? '<b>Das Modul öffnet sich</b>Scrollen Sie weiter – jede Lage einzeln.' : '<b>' + F.steps[st].t + '</b>' + F.steps[st].s;
      }
      var fr = Math.round(f);
      schilder.forEach(function (d, j) {
        var on = j === st;
        d.classList.toggle('an', on);
        if (on && geo) { var L = F.labels[fr][j], x = (geo.x + L[0] * geo.w) / dpr, y = (geo.y + L[1] * geo.h) / dpr; d.style.left = x + 'px'; d.style.top = y + 'px'; d.classList.toggle('links', x > cv.width / dpr * .6); }
      });
    }
    function tick() {
      var d = ziel - pos;
      if (pos < 0 || reduce || Math.abs(d) < .02) { pos = ziel; laeuft = false; } else { pos += d * .16; requestAnimationFrame(tick); }
      zeichne();
    }
    function scroll() { ziel = fortschritt() * (F.nf - 1); if (!laeuft) { laeuft = true; requestAnimationFrame(tick); } }
    addEventListener('scroll', scroll, { passive: true });
    addEventListener('resize', groesse); groesse(); scroll();
  }

  /* ===== Vom Dach bis in den Keller: Leitung füllt sich, Fenster öffnen sich ===== */
  var wl = $('#wegliste');
  if (wl) {
    var stationen = $$('.station', wl), wq = 0;
    if ('IntersectionObserver' in window) { var so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); so.unobserve(e.target); } }); }, { threshold: .35 }); stationen.forEach(function (s) { so.observe(s); }); }
    else stationen.forEach(function (s) { s.classList.add('da'); });
    function wegp() { wq = 0; var r = wl.getBoundingClientRect(); wl.style.setProperty('--p', Math.max(0, Math.min(1, (innerHeight * .6 - r.top) / r.height)).toFixed(3)); }
    addEventListener('scroll', function () { if (!wq) wq = requestAnimationFrame(wegp); }, { passive: true }); wegp();
    var lb = $('#lightbox');
    $$('.fenster', wl).forEach(function (fg) {
      var rq = 0, ex = 0, ey = 0;
      if (!reduce && matchMedia('(pointer:fine)').matches) {
        fg.addEventListener('pointermove', function (e) { var r = fg.getBoundingClientRect(); ex = (e.clientX - r.left) / r.width; ey = (e.clientY - r.top) / r.height;
          if (!rq) rq = requestAnimationFrame(function () { rq = 0; fg.style.setProperty('--ry', ((ex - .5) * 6) + 'deg'); fg.style.setProperty('--rx', (-(ey - .5) * 6) + 'deg'); fg.style.setProperty('--mx', ex * 100 + '%'); fg.style.setProperty('--my', ey * 100 + '%'); }); });
        fg.addEventListener('pointerleave', function () { fg.style.setProperty('--rx', '0deg'); fg.style.setProperty('--ry', '0deg'); });
      }
      fg.addEventListener('click', function () { $('img', lb).src = fg.dataset.gross; $('img', lb).alt = $('img', fg).alt; lb.classList.add('auf'); });
    });
    lb.addEventListener('click', function () { lb.classList.remove('auf'); }); addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('auf'); });
  }
})();
