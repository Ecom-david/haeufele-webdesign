/* Ostrander Holzwerkstatt – Seitenlogik (ohne Bibliotheken außer Lenis, läuft per Doppelklick). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var de = function (n, d) { return n.toLocaleString('de-DE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, hatIO = 'IntersectionObserver' in window;

  /* Weiches Scrollen (Lenis, MIT, lokal) */
  if (!reduce && window.Lenis) { try { window.__lenis = new Lenis({ lerp: .1, wheelMultiplier: .9, autoRaf: true, anchors: { offset: -10 } }); } catch (e) { } }

  var kopf = $('#kopf'); function k() { kopf.classList.toggle('voll', scrollY > 30); } addEventListener('scroll', k, { passive: true }); k();

  /* Überschriften Wort für Wort */
  $$('h2').forEach(function (h) {
    if (h.closest('.kap') || h.closest('.fk')) return;
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) { var f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(function (w) { if (!w) return; if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(w)); return; } var s = document.createElement('span'); s.className = 'wort'; s.textContent = w; f.appendChild(s); }); c.parentNode.replaceChild(f, c); }
        else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
      });
    })(h);
    var i = 0; $$('.wort', h).forEach(function (w) { w.style.transitionDelay = (i++ * 60) + 'ms'; });
  });
  var io = hatIO ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; e.target.classList.add('da'); io.unobserve(e.target); }); }, { rootMargin: '0px 0px -8% 0px' }) : null;
  $$('.auf').forEach(function (el) { io ? io.observe(el) : el.classList.add('da'); });
  $$('h2').forEach(function (h) { if (!h.closest('.auf') && !h.closest('.kap') && !h.closest('.fk')) { io ? io.observe(h) : h.classList.add('da'); } });

  /* Zahlen zählen hoch (Zahl steht im HTML) */
  $$('[data-zahl]').forEach(function (el) {
    var ziel = parseFloat(el.dataset.zahl), d = el.dataset.komma ? 1 : 0;
    if (reduce || !hatIO) return;
    new IntersectionObserver(function (es, ob) {
      if (!es[0].isIntersecting) return; ob.disconnect(); var t0 = 0;
      (function lauf(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); p = 1 - Math.pow(1 - p, 4); el.textContent = de(ziel * p, d); if (p < 1) requestAnimationFrame(lauf); })(performance.now());
    }, { threshold: .6 }).observe(el);
  });

  /* ===== Einbauschrank-Planer ===== */
  var P = { b: $('#p-b'), h: $('#p-h'), t: $('#p-t') }, art = 'dreh', svg = $('#p-svg'), NS = 'http://www.w3.org/2000/svg';
  $$('#p-art button').forEach(function (b) { b.addEventListener('click', function () { art = b.dataset.v; $$('#p-art button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); plane(); }); });
  ['b', 'h', 't'].forEach(function (k) { P[k].addEventListener('input', plane); });
  function baender(hcm) { var mm = hcm * 10; return mm <= 900 ? 2 : mm <= 1600 ? 3 : mm <= 2000 ? 4 : mm <= 2400 ? 5 : 6; }
  function el(tag, at, txt) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); if (txt != null) n.textContent = txt; return n; }
  function plane() {
    var B = +P.b.value, H = +P.h.value, T = +P.t.value;
    $('#o-b').textContent = B + ' cm'; $('#o-h').textContent = H + ' cm'; $('#o-t').textContent = T + ' cm';
    var pass = B >= 100 ? 3 : 2, Bf = B - 2 * pass, sock = 8, blende = 4, Hf = H - sock - blende;
    var reihen = Hf > 240 ? [Math.max(30, Hf - 216), 216] : [Hf];   // über 2,40 m: Front teilen (Aufsatz + Unterteil)
    var n, tb, tiefe, band = 0, txt = [];
    if (art === 'dreh') {
      n = Math.max(1, Math.ceil(Bf / 60)); tb = Bf / n; if (tb < 30 && n > 1) { n--; tb = Bf / n; }
      reihen.forEach(function (h) { band += n * baender(h); });
      tiefe = T - 1.9 - .8 - 1;
    } else {
      n = Math.max(2, Math.round(Bf / 100)); tb = (Bf + 3 * (n - 1)) / n;
      tiefe = T - 10 - .8 - 1;
    }
    var stange = tiefe >= 55, vol = Bf * Hf * Math.max(0, tiefe) / 1e6;
    var w = $('#p-werte'); w.innerHTML = '';
    function zeile(a, b, c) { var li = document.createElement('li'); if (c) li.className = c; li.innerHTML = '<span>' + a + '</span><b>' + b + '</b>'; w.appendChild(li); }
    zeile(art === 'dreh' ? 'Türen' : 'Schiebetüren', (reihen.length > 1 ? reihen.length + ' × ' : '') + n + ' Stück');
    zeile('Breite je Tür', de(tb, 1) + ' cm');
    zeile('Frontenhöhe', reihen.map(function (h) { return de(h, 0); }).join(' + ') + ' cm');
    zeile(art === 'dreh' ? 'Topfbänder' : 'Laufschienen', art === 'dreh' ? band + ' Stück' : 'oben + unten');
    zeile('Innentiefe', de(Math.max(0, tiefe), 1) + ' cm');
    zeile('Stauraum', '≈ ' + de(vol, 2) + ' m³');
    zeile(stange ? 'Kleiderstange quer – Bügel passen.' : 'Für Bügel quer zu flach: Wir planen eine ausziehbare Kleiderstange (Bügel längs) oder Fächer und Auszüge.', '', 'tipp');
    if (reihen.length > 1) zeile('Über 2,40 m Frontenhöhe teilen wir die Front: Unterteil plus Aufsatz – sonst verziehen sich hohe Türen leichter.', '', 'tipp');
    if (art === 'schiebe' && T < 55) zeile('Schiebetüren brauchen rund 10 cm Tiefe für die Laufschienen – bei Ihrer Nische wird es eng.', '', 'tipp');
    // Zeichnung
    svg.innerHTML = '';
    var defs = el('defs'); var g = el('linearGradient', { id: 'pHolz', x1: 0, y1: 0, x2: 1, y2: 1 }); g.appendChild(el('stop', { offset: 0, 'stop-color': '#B98C58' })); g.appendChild(el('stop', { offset: .55, 'stop-color': '#9A6D3E' })); g.appendChild(el('stop', { offset: 1, 'stop-color': '#7A5129' })); defs.appendChild(g); svg.appendChild(defs);
    var maxW = 440, maxH = 300, s = Math.min(maxW / B, maxH / H), W = B * s, Hh = H * s, x0 = (520 - W) / 2 + 10, y0 = 20 + (maxH - Hh) / 2;
    svg.appendChild(el('rect', { 'class': 'wand', x: x0 - 6, y: y0 - 6, width: W + 12, height: Hh + 6 }));
    svg.appendChild(el('rect', { 'class': 'sockel', x: x0 + pass * s, y: y0 + Hh - sock * s, width: Bf * s, height: sock * s }));
    svg.appendChild(el('rect', { x: x0, y: y0, width: pass * s, height: Hh, fill: '#5a3d22' })); svg.appendChild(el('rect', { x: x0 + W - pass * s, y: y0, width: pass * s, height: Hh, fill: '#5a3d22' }));
    svg.appendChild(el('rect', { x: x0 + pass * s, y: y0, width: Bf * s, height: blende * s, fill: '#5a3d22' }));
    var yy = y0 + blende * s;
    reihen.forEach(function (h) {
      for (var i = 0; i < n; i++) {
        var x = art === 'dreh' ? x0 + pass * s + i * tb * s : x0 + pass * s + i * (tb - 3) * s, ww = tb * s - (art === 'dreh' ? 1.5 : 0);
        svg.appendChild(el('rect', { 'class': 'front', x: x.toFixed(1), y: (yy + .75).toFixed(1), width: ww.toFixed(1), height: (h * s - 1.5).toFixed(1), rx: 1.5, opacity: art === 'schiebe' && i % 2 ? .82 : 1 }));
        if (art === 'dreh') { var links = i % 2 === 0, nb = baender(h); for (var j = 0; j < nb; j++) { var by = yy + 10 * s + (h - 20) * s * (nb === 1 ? .5 : j / (nb - 1)); svg.appendChild(el('circle', { 'class': 'band', cx: (links ? x + 3.2 * s : x + ww - 3.2 * s).toFixed(1), cy: by.toFixed(1), r: Math.max(2.4, 1.75 * s) })); } }
      }
      yy += h * s;
    });
    if (art === 'schiebe') { svg.appendChild(el('line', { 'class': 'lauf', x1: x0 + pass * s, y1: y0 + blende * s + 2, x2: x0 + W - pass * s, y2: y0 + blende * s + 2 })); }
    svg.appendChild(el('line', { 'class': 'mass', x1: x0, y1: y0 + Hh + 18, x2: x0 + W, y2: y0 + Hh + 18 })); svg.appendChild(el('text', { 'class': 'gross', x: x0 + W / 2, y: y0 + Hh + 36, 'text-anchor': 'middle' }, de(B) + ' cm'));
    svg.appendChild(el('line', { 'class': 'mass', x1: x0 - 18, y1: y0, x2: x0 - 18, y2: y0 + Hh })); svg.appendChild(el('text', { 'class': 'gross', x: x0 - 24, y: y0 + Hh / 2, 'text-anchor': 'end' }, de(H)));
    svg.setAttribute('aria-label', 'Ansicht: ' + B + ' × ' + H + ' cm, ' + n + (art === 'dreh' ? ' Drehtüren' : ' Schiebetüren'));
    $('#p-knopf').dataset.text = 'Einbauschrank-Planer: Nische ' + B + ' × ' + H + ' × ' + T + ' cm, ' + (art === 'dreh' ? n + ' Drehtüren' : n + ' Schiebetüren');
  }
  plane();
  $('#p-knopf').addEventListener('click', function () { var t = $('#k-text'); if (t && !t.value) t.value = this.dataset.text + '. '; var th = $('#k-thema'); if (th && !th.value) th.value = 'Einbauschrank / Dachschräge'; });

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
    { k: ['kosten', 'preis', 'kostet', 'teuer'], q: 'Was kostet ein Einbauschrank?', a: 'Das hängt von Größe, Holz und Innenleben ab. Als Beispiel: Ein raumhoher Einbauschrank mit Fronten in Eiche beginnt bei uns um 7.900 €. Den Festpreis bekommen Sie nach dem kostenlosen Aufmaß.' },
    { k: ['lange', 'dauer', 'wann', 'wochen', 'lieferzeit'], q: 'Wie lange dauert es?', a: 'Nach dem Aufmaß bekommen Sie den 3D-Entwurf meist innerhalb von 10 Werktagen. Die Fertigung in der Werkstatt dauert meist 4 bis 8 Wochen, die Montage eines Einbauschranks meist einen Tag.' },
    { k: ['massiv', 'furnier', 'furniert', 'unterschied'], q: 'Massivholz oder furniert?', a: 'Beides ist echtes Holz. Massivholz lässt sich später abschleifen und reparieren, arbeitet aber mit der Luftfeuchte – das planen wir mit ein. Furnier auf einer stabilen Trägerplatte bleibt bei großen Fronten besonders formstabil. Wir beraten Sie ehrlich, was wo besser passt.' },
    { k: ['pflege', 'öl', 'oel', 'geölt', 'fleck', 'reinigen'], q: 'Wie pflege ich geölte Möbel?', a: 'Nebelfeucht abwischen, keine scharfen Reiniger. Je nach Beanspruchung ein- bis zweimal im Jahr mit Pflegeöl nachbehandeln. Kleine Flecken lassen sich bei geölten Oberflächen meist örtlich anschleifen und nachölen – das ist ihr großer Vorteil.' },
    { k: ['schräge', 'schraege', 'dach', 'kniestock', 'kamin'], q: 'Bauen Sie in Dachschrägen?', a: 'Ja, das ist eine unserer Spezialitäten. Wir messen Schräge, Kniestock und Hindernisse genau auf und bauen den Schrank so, dass kein Zentimeter verschenkt wird.' },
    { k: ['tür', 'tuer', 'schief', 'scharnier', 'topfband', 'einstellen'], q: 'Meine Schranktür hängt schief.', a: 'Moderne Topfbänder lassen sich in drei Richtungen nachstellen: Höhe, Seite und Tiefe. Oft ist das in wenigen Minuten erledigt. Bei unseren Möbeln kommen wir dafür auch nach Jahren noch vorbei.' },
    { k: ['küche', 'kueche', 'geräte', 'geraete', 'herd', 'elektro'], q: 'Bauen Sie auch Küchen mit Geräten?', a: 'Ja, mit Geräten aller Hersteller. Wasser- und Elektroanschluss übernehmen unsere Partnerbetriebe – Herd und Kochfeld darf nur eine Elektrofachkraft anschließen.' },
    { k: ['reißt', 'reisst', 'riss', 'feucht', 'holzfeuchte', 'verzieh'], q: 'Reißt Massivholz nicht?', a: 'Nicht, wenn es richtig getrocknet und gebaut ist. Wir verarbeiten Holz für beheizte Räume mit rund 8 bis 10 % Holzfeuchte, und Konstruktionen wie Nut und Feder oder Gratleisten lassen das Holz arbeiten, ohne dass es reißt.' },
    { k: ['termin', 'aufmaß', 'aufmass', 'kontakt', 'anfrage', 'rückruf'], q: 'Aufmaß-Termin anfragen', a: 'Gern! Unten im Formular eintragen – wir melden uns Montag bis Freitag am selben Werktag.', ziel: '#kontakt' }
  ];
  var vl = $('#verlauf'), ch = $('#chips'), assi = $('#assi');
  function sag(t, w) { var d = document.createElement('div'); d.className = 'msg ' + w; d.textContent = t; vl.appendChild(d); vl.scrollTop = vl.scrollHeight; }
  function antworte(text) {
    var t = text.toLowerCase(), best = null, bs = 0;
    KB.forEach(function (e) { var s = 0; e.k.forEach(function (k) { if (t.indexOf(k) > -1) s++; }); if (s > bs) { bs = s; best = e; } });
    setTimeout(function () { if (best) { sag(best.a, 'bot'); if (best.ziel) location.hash = best.ziel.slice(1); } else sag('Dazu habe ich keine sichere Antwort. Schreiben Sie uns kurz über das Formular – wir rufen Sie zurück.', 'bot'); }, reduce ? 0 : 320);
  }
  sag('Hallo! Fragen zu Einbauschrank, Küche oder Holz? Einfach antippen:', 'bot');
  KB.forEach(function (e) { var b = document.createElement('button'); b.type = 'button'; b.textContent = e.q; b.onclick = function () { sag(e.q, 'ich'); setTimeout(function () { sag(e.a, 'bot'); if (e.ziel) location.hash = e.ziel.slice(1); }, reduce ? 0 : 320); }; ch.appendChild(b); });
  $('#assiform').addEventListener('submit', function (e) { e.preventDefault(); var i = $('#assiein'); if (!i.value.trim()) return; sag(i.value, 'ich'); antworte(i.value); i.value = ''; });
  var zu = $('#assizu');
  function toggle() { assi.classList.remove('mini'); var z = assi.classList.toggle('zu'); zu.textContent = z ? '+' : '–'; zu.setAttribute('aria-label', z ? 'Fragen-Assistent öffnen' : 'Fragen-Assistent einklappen'); }
  $('#assikopf').addEventListener('click', toggle);
  if (innerWidth < 700 || innerHeight < 600) toggle(); else assi.classList.add('mini');
  assi.addEventListener('click', function (e) { if (assi.classList.contains('mini') && !e.target.closest('#assizu')) assi.classList.remove('mini'); });
  // Im Kino-Bereich klappt der Assistent ein, damit er das Möbel nicht verdeckt
  var kino = $('#kino'), einmal = false;
  addEventListener('scroll', function () { if (einmal) return; var r = kino.getBoundingClientRect(); if (r.top < -innerHeight * .6 && !assi.classList.contains('zu')) { einmal = true; toggle(); } }, { passive: true });
})();
