/* Quandel Elektrotechnik – Seitenlogik (ohne Bibliotheken, läuft per Doppelklick). */
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


  /* ===== Hero: Oszilloskop (Spannung + Strom, 50 Hz verlangsamt) und Live-Messwerte ===== */
  var oz = $('#oszi');
  if (oz) {
    var rg = $('.raster', oz), ra = '';
    for (var x = 100; x < 1600; x += 100) ra += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="600"/>';
    for (var y = 100; y < 600; y += 100) ra += '<line x1="0" y1="' + y + '" x2="1600" y2="' + y + '"/>';
    rg.innerHTML = ra;
    var pu = $('#ozU'), pi = $('#ozI'), ph = 0, sicht = true, lastT = 0;
    function welle(amp, phase, per) { var d = ''; for (var x = 0; x <= 1600; x += 8) { d += (x ? 'L' : 'M') + x + ' ' + (300 - amp * Math.sin(x / per * Math.PI * 2 + phase)).toFixed(1); } return d; }
    function oszi(t) {
      if (sicht && !reduce) requestAnimationFrame(oszi);
      if (t - lastT < 33) return; lastT = t; ph -= .03;
      pu.setAttribute('d', welle(170, ph, 640)); pi.setAttribute('d', welle(90, ph - .5, 640));
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v && !sicht) { sicht = true; requestAnimationFrame(oszi); } sicht = v; }).observe($('.hero'));
    requestAnimationFrame(oszi); if (reduce) oszi(100);
    var mf = $('#mw-f'), mu = $('#mw-u');
    if (!reduce) setInterval(function () { if (!sicht) return; mf.textContent = de(49.98 + Math.random() * .04, 2); mu.textContent = Math.round(229 + Math.random() * 2.4); }, 1100);
  }

  /* ===== Verteiler erklärt: Hotspots ===== */
  var HS = [
    { x: 42.8, y: 30.6, k: 'SPD', t: 'Überspannungsschutz', s: 'Schützt Geräte vor Blitz- und Schaltüberspannungen. Bei neuen und erweiterten Anlagen nach DIN VDE 0100-443 / -534 vorgesehen.' },
    { x: 27.5, y: 30.6, k: 'HS', t: 'Hauptschalter', s: 'Schaltet den ganzen Verteiler frei – wichtig für sicheres Arbeiten und im Notfall.' },
    { x: 31.5, y: 46.2, k: 'RCD', t: 'FI-Schutzschalter 30 mA', s: 'Schaltet in Millisekunden ab, wenn Strom über einen Menschen abfließt. Pflicht für Steckdosen bis 32 A, Außen-Stromkreise bis 32 A und Licht in Wohnungen (DIN VDE 0100-410).' },
    { x: 67.9, y: 46.2, k: 'LS', t: 'Leitungsschutzschalter', s: 'Je Stromkreis einer: B16 für Steckdosen, B10 für Licht. Schützt die Leitung vor Überlast und Kurzschluss.' },
    { x: 48.5, y: 46.2, k: 'RCD 2', t: 'Zweiter FI-Kreis', s: 'Die Stromkreise sind auf mehrere FI-Schalter verteilt. Löst einer aus, bleibt der Rest vom Haus am Netz.' },
    { x: 43.6, y: 76.2, k: 'KL', t: 'Reihenklemmen & Aderfarben', s: 'Jede Leitung auf einer eigenen Klemme: braun, schwarz, grau = Außenleiter, blau = Neutralleiter, grün-gelb = Schutzleiter.' }
  ];
  var vb = $('#vbild');
  if (vb) {
    var vnr = $('#vi-nr'), vt = $('#vi-t'), vs = $('#vi-s'), knoepfeHS = [];
    function zeigeHS(i) {
      var h = HS[i]; vnr.textContent = '0' + (i + 1) + ' / 0' + HS.length; vt.textContent = h.t; vs.textContent = h.s;
      knoepfeHS.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i); });
      vb.style.setProperty('--hx', h.x + '%'); vb.style.setProperty('--hy', h.y + '%');
    }
    HS.forEach(function (h, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'hs'; b.style.left = h.x + '%'; b.style.top = h.y + '%';
      b.setAttribute('aria-label', h.t); b.innerHTML = '<b>' + h.k + '</b>'; b.onclick = function () { zeigeHS(i); auto = false; };
      vb.appendChild(b); knoepfeHS.push(b);
    });
    var auto = true, ai = 0; zeigeHS(0);
    if (!reduce && 'IntersectionObserver' in window) { var vsicht = false; new IntersectionObserver(function (es) { vsicht = es[0].isIntersecting; }).observe(vb); setInterval(function () { if (auto && vsicht && !document.hidden) { ai = (ai + 1) % HS.length; zeigeHS(ai); } }, 4200); }
  }

  /* ===== Installationsplan: fünf Netze (SVG, Symbole vereinfacht nach DIN EN 60617) ===== */
  var svg = $('#plansvg');
  if (svg) {
    var NS = 'http://www.w3.org/2000/svg', out = '';
    var R = [['Wohnen / Essen', 0, 0, 600, 500, '6,00 × 5,00 m'], ['Küche', 600, 0, 400, 320, '4,00 × 3,20 m'], ['Flur', 600, 320, 160, 480, ''], ['Bad', 760, 320, 240, 240, '2,40 × 2,40 m'], ['Technik', 760, 560, 240, 240, ''], ['Arbeiten', 0, 500, 600, 300, '6,00 × 3,00 m']];
    out += '<defs><radialGradient id="lglow"><stop offset="0" stop-color="#FFD978" stop-opacity=".55"/><stop offset="1" stop-color="#FFD978" stop-opacity="0"/></radialGradient></defs>';
    out += '<rect class="boden" x="-6" y="-6" width="1012" height="812" rx="4"/>';
    R.forEach(function (r, i) { out += '<rect class="raum' + (i === 4 ? ' dunkel' : '') + '" x="' + r[1] + '" y="' + r[2] + '" width="' + r[3] + '" height="' + r[4] + '"/>'; });
    var W = [[0, 0, 100, 0], [260, 0, 340, 0], [500, 0, 700, 0], [900, 0, 1000, 0], [1000, 0, 1000, 400], [1000, 480, 1000, 800], [1000, 800, 720, 800], [640, 800, 400, 800], [150, 800, 0, 800], [0, 800, 0, 720], [0, 580, 0, 350], [0, 150, 0, 0]];
    W.forEach(function (w) { out += '<line class="wand" x1="' + w[0] + '" y1="' + w[1] + '" x2="' + w[2] + '" y2="' + w[3] + '"/>'; });
    [[100, 0, 260, 0], [340, 0, 500, 0], [700, 0, 900, 0], [1000, 400, 1000, 480], [400, 800, 150, 800], [0, 720, 0, 580], [0, 350, 0, 150]].forEach(function (w) {
      var hz = w[1] === w[3]; out += '<path class="fenster" d="M' + w[0] + ' ' + (w[1] - (hz ? 5 : 0)) + 'H' + w[2] + 'M' + w[0] + ' ' + (w[1] + (hz ? 5 : 0)) + 'H' + w[2] + '" ' + (hz ? '' : 'transform="translate(0 0)"') + '/>';
    });
    out = out.replace(/<path class="fenster" d="M1000 400H1000M1000 400H1000" \/>/, '');
    [[1000, 400, 480], [0, 720, 580], [0, 350, 150]].forEach(function (v) { out += '<path class="fenster" d="M' + (v[0] - 5) + ' ' + v[1] + 'V' + v[2] + 'M' + (v[0] + 5) + ' ' + v[1] + 'V' + v[2] + '"/>'; });
    var IW = [[600, 0, 600, 120], [600, 300, 600, 360], [600, 460, 600, 600], [600, 690, 600, 800], [0, 500, 600, 500], [600, 320, 640, 320], [720, 320, 1000, 320], [760, 320, 760, 380], [760, 460, 760, 640], [760, 720, 760, 800], [760, 560, 1000, 560]];
    IW.forEach(function (w) { out += '<line class="iwand" x1="' + w[0] + '" y1="' + w[1] + '" x2="' + w[2] + '" y2="' + w[3] + '"/>'; });
    R.forEach(function (r) { out += '<text class="rname" x="' + (r[1] + 18) + '" y="' + (r[2] + 32) + '">' + r[0] + '</text>'; if (r[5]) out += '<text class="rmass" x="' + (r[1] + 18) + '" y="' + (r[2] + 52) + '">' + r[5] + '</text>'; });
    var UV = [980, 690];
    function L(a, b, vfirst) { return vfirst ? 'M' + a[0] + ' ' + a[1] + 'V' + b[1] + 'H' + b[0] : 'M' + a[0] + ' ' + a[1] + 'H' + b[0] + 'V' + b[1]; }
    function ltg(d) { return '<path class="ltg" pathLength="1" d="' + d + '"/>'; }
    var G = {}, Z = {};
    // Licht: Schalter -> Leuchte, Zuleitung vom Verteiler
    var LI = [[[580, 470], [[170, 250], [440, 180]]], [[730, 300], [[800, 160]]], [[620, 345], [[680, 430], [680, 690]]], [[785, 365], [[880, 440]]], [[785, 745], [[860, 680]]], [[580, 710], [[300, 650]]], [[735, 780], [[680, 838]]]];
    var gl = '', sl = '', ll = '', nL = 0;
    LI.forEach(function (e) {
      ll += ltg(L(UV, e[0], false));
      e[1].forEach(function (p) { ll += ltg(L(e[0], p, true)); gl += '<circle class="glow" cx="' + p[0] + '" cy="' + p[1] + '" r="150"/>'; sl += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><circle class="sym" r="15"/><path class="sym" d="M-10.6 -10.6L10.6 10.6M10.6 -10.6L-10.6 10.6" fill="none"/></g>'; nL++; });
      sl += '<g transform="translate(' + e[0][0] + ' ' + e[0][1] + ')"><circle class="sym" r="7"/><path class="sym" d="M4 -4L14 -16" fill="none"/></g>';
    });
    G.licht = gl + ll + sl; Z.licht = nL;
    // Steckdosen (Doppelsteckdosen-Standorte)
    var ST = [[20, 110, 1], [20, 400, 1], [140, 480, 2], [450, 480, 2], [560, 20, 3], [280, 20, 3], [620, 40, 1], [980, 120, 4], [980, 260, 4], [860, 300, 2], [980, 360, 4], [780, 520, 1], [20, 760, 1], [250, 520, 3], [420, 780, 2], [980, 600, 4]];
    var sk = '', sl2 = '';
    var KR = [[0, 1, 5], [2, 3, 4], [6, 7, 8, 9], [10, 11], [12, 13, 14, 15]];
    KR.forEach(function (k) { var prev = UV; k.forEach(function (i, j) { var p = ST[i]; sk += ltg(L(prev, [p[0], p[1]], j % 2 === 1)); prev = [p[0], p[1]]; }); });
    ST.forEach(function (s) { var r = { 1: 90, 2: 180, 3: 0, 4: 270 }[s[2]]; sl2 += '<g transform="translate(' + s[0] + ' ' + s[1] + ') rotate(' + r + ')"><path class="sym" d="M-12 0A12 12 0 0 0 12 0Z"/><path class="sym" d="M-16 4H16" fill="none"/><path class="sym" d="M0 0V-12" fill="none"/><text class="sym-zahl" x="0" y="-22" text-anchor="middle" dominant-baseline="middle" transform="rotate(' + (-r) + ' 0 -22)">2</text></g>'; });
    G.steck = sk + sl2; Z.steck = ST.length;
    // Netzwerk: sternförmig vom Patchfeld
    var PF = [955, 600], LAN = [[20, 270], [20, 640], [300, 780], [560, 120]], AP = [680, 560], nk = '', ns = '';
    LAN.forEach(function (p) { nk += ltg(L(PF, p, false)); ns += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><rect class="sym" x="-12" y="-12" width="24" height="24"/><text class="syt">D</text></g>'; });
    nk += ltg(L(PF, AP, false)); ns += '<g transform="translate(' + AP[0] + ' ' + AP[1] + ')"><circle class="sym" r="15"/><text class="syt">W</text></g><g transform="translate(' + PF[0] + ' ' + PF[1] + ')"><rect class="sym" x="-14" y="-10" width="28" height="20"/><text class="syt">PF</text></g>';
    G.netz = nk + ns; Z.netz = LAN.length + 1;
    // Sicherheit: Rauchmelder, Sprechanlage, Außenlicht mit Bewegungsmelder
    var SI = [[[680, 500], 'RM'], [[300, 560], 'RM'], [[735, 700], 'SP'], [[770, 838], 'KL'], [[600, 838], 'BM']], sk2 = '', ss = '';
    SI.forEach(function (e) { var p = e[0]; sk2 += ltg(L(UV, p, false)); ss += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><rect class="sym" x="-15" y="-15" width="30" height="30" rx="' + (e[1] === 'RM' ? 15 : 3) + '"/><text class="syt">' + e[1] + '</text></g>'; });
    G.sicher = sk2 + ss; Z.sicher = SI.length;
    // KNX: eine Buslinie durch alle Räume
    var KX = [[[700, 600], 'P'], [[580, 430], 'T'], [[300, 420], 'θ'], [[560, 200], 'T'], [[720, 120], 'θ'], [[860, 360], 'θ'], [[580, 760], 'T'], [[300, 760], 'θ']], kd = 'M' + UV[0] + ' ' + UV[1], ks = '';
    var prev = UV; KX.forEach(function (e, i) { var p = e[0]; kd += (i % 2 ? 'V' + p[1] + 'H' + p[0] : 'H' + p[0] + 'V' + p[1]); prev = p; ks += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><rect class="sym" x="-13" y="-13" width="26" height="26" rx="6"/><text class="syt">' + e[1] + '</text></g>'; });
    G.knx = '<path class="ltg" pathLength="1" d="' + kd + '"/>' + ks; Z.knx = KX.length;
    ['licht', 'steck', 'netz', 'sicher', 'knx'].forEach(function (n) { out += '<g class="netz ' + n + '" data-n="' + n + '">' + G[n] + '</g>'; $('#z-' + n).textContent = Z[n]; });
    out += '<rect class="uv" x="966" y="650" width="26" height="80" rx="3"/><text class="uvt" x="944" y="694" text-anchor="end">UV</text>';
    svg.innerHTML = out;
    var INFO = {
      licht: Z.licht + ' Leuchten, Schalter neben jeder Tür auf 105 cm. Licht und Steckdosen auf getrennten Stromkreisen – fällt einer aus, bleibt es nicht dunkel.',
      steck: Z.steck + ' Steckdosen-Standorte auf 5 Stromkreisen (B16). Alle Stromkreise der Wohnung – auch Licht – liegen hinter FI 30 mA. Leitungen nur in den Installationszonen nach DIN 18015-3 – dort sucht man später auch beim Bohren.',
      netz: (Z.netz - 1) + ' Netzwerkdosen (D) und 1 WLAN-Zugangspunkt (W) an der Decke – sternförmig zum Patchfeld (PF) im Technikraum.',
      sicher: 'Rauchmelder (RM) im Flur als Rettungsweg – Pflicht nach Landesbauordnung, Schlafräume liegen im OG –, im Arbeitszimmer empfohlen. Dazu Sprechanlage (SP), Klingel (KL) und Außenlicht mit Bewegungsmelder (BM).',
      knx: 'Eine Busleitung für alles: Taster (T), Präsenzmelder (P) und Raumregler (θ) hängen an einer KNX-Linie, die Aktoren sitzen im Verteiler. Spätere Änderungen = umprogrammieren statt neu verlegen.'
    };
    var ni = $('#ninfo'), letzte = 'licht';
    function schalte(b, an) { b.setAttribute('aria-pressed', an); $('.netz.' + b.dataset.n, svg).classList.toggle('an', an); if (an) { letzte = b.dataset.n; ni.textContent = INFO[letzte]; } }
    $$('.netze button[data-n]').forEach(function (b) { b.onclick = function () { schalte(b, b.getAttribute('aria-pressed') !== 'true'); }; });
    // erst sichtbar, dann Licht-Netz zeichnen
    var pbox = $('.planbox'), gezeigt = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting && !gezeigt) { gezeigt = true; o.disconnect(); setTimeout(function () { schalte($('.netze button[data-n="licht"]'), true); }, 300); } }, { threshold: .3 }).observe($('#planbuehne'));
    else schalte($('.netze button[data-n="licht"]'), true);
    // Kippen: richtet sich beim Scrollen auf
    var kipp = $('#kipp'), kq = 0;
    function kippen() { kq = 0; var r = $('#planbuehne').getBoundingClientRect(), p = Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight + r.height * .4))); kipp.style.setProperty('--kx', (48 - 34 * p).toFixed(2) + 'deg'); kipp.style.setProperty('--kz', (-9 + 7 * p).toFixed(2) + 'deg'); kipp.style.setProperty('--ks', (.9 + .1 * p).toFixed(3)); }
    if (!reduce) { addEventListener('scroll', function () { if (!kq) kq = requestAnimationFrame(kippen); }, { passive: true }); kippen(); }
    // Gedrückt halten: Abendszene
    var ab = $('#abend'), hz = 0, hstart = 0, hraf = 0;
    function lauf(t) { if (!hstart) hstart = t; hz = Math.min(1, (t - hstart) / 900); ab.style.setProperty('--h', hz); if (hz >= 1) { pbox.classList.add('abend'); ni.textContent = 'Abendszene: ein Tastendruck dimmt Wohnen und Essen, schaltet Flur und Außenlicht ein und fährt die Jalousien herunter – mit KNX ohne extra Leitungen.'; var lb = $('.netze button[data-n="licht"]'); if (lb.getAttribute('aria-pressed') !== 'true') schalte(lb, true); return; } hraf = requestAnimationFrame(lauf); }
    function los() { cancelAnimationFrame(hraf); hstart = 0; hz = 0; ab.style.setProperty('--h', 0); pbox.classList.remove('abend'); ni.textContent = INFO[letzte]; }
    ab.addEventListener('pointerdown', function (e) { e.preventDefault(); hstart = 0; hraf = requestAnimationFrame(lauf); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { ab.addEventListener(ev, los); });
    ab.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); hstart = 0; hraf = requestAnimationFrame(lauf); } });
    ab.addEventListener('keyup', los);
    ab.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  /* ===== Wallbox-Rechner ===== */
  var WR = { lp: 11, ob: 11 };
  function wwahl(id, key) { $$('#' + id + ' button').forEach(function (b) { b.addEventListener('click', function () { $$('#' + id + ' button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); WR[key] = +b.dataset.v; wrechne(); }); }); }
  wwahl('w-lp', 'lp'); wwahl('w-ob', 'ob');
  function dauer(h) { var m = Math.round(h * 60 / 5) * 5; var hh = Math.floor(m / 60), mm = m % 60; return (hh ? hh + ' h ' : '') + (mm || !hh ? mm + ' min' : ''); }
  function wrechne() {
    var km = +$('#w-km').value, v = +$('#w-verb').value, ak = +$('#w-akku').value;
    $('#o-km').textContent = km + ' km'; $('#o-verb').textContent = de(v, v % 1 ? 1 : 0) + ' kWh/100 km'; $('#o-akku').textContent = ak + ' kWh';
    var P;
    if (WR.ob === 7.4) P = WR.lp === 22 ? 4.6 : Math.min(WR.lp, 3.7);   // 7,4-kW-Lader laden einphasig; Schieflastgrenze 4,6 kVA (VDE-AR-N 4100)
    else P = Math.min(WR.lp, WR.ob);
    var kwh = km * v / 100 * 1.1, t = kwh / P, voll = ak * .7 * 1.1 / P, kost = km * 365 * v / 100 * 1.1 * .37;
    $('#e-zeit').textContent = dauer(t); $('#e-kwh').textContent = '≈ ' + de(kwh, 1) + ' kWh'; $('#e-leist').textContent = de(P, P % 1 ? 1 : 0) + ' kW';
    $('#e-voll').textContent = '≈ ' + dauer(voll); $('#e-kost').textContent = '≈ ' + de(Math.round(kost / 10) * 10) + ' €';
    var nacht = Math.min(1, t / 10); $('#b-lade').style.width = (nacht * 100).toFixed(1) + '%'; $('#b-txt').textContent = t > 10 ? 'reicht nicht in einer Nacht' : Math.max(1, Math.round(nacht * 100)) + ' % einer Nacht (10 h)';
    var hi = '';
    if (WR.ob === 7.4 && WR.lp === 11) hi = 'Achtung: Ein 7,4-kW-Bordlader lädt einphasig – an einer 11-kW-Wallbox nur mit 3,7 kW. Genau so etwas prüfen wir vorher.';
    else if (WR.ob === 7.4 && WR.lp === 22) hi = 'Ihr Auto lädt einphasig. In Deutschland sind einphasig höchstens 4,6 kW erlaubt (Schieflastgrenze nach VDE-AR-N 4100) – mehr geht an keiner Wallbox.';
    else if (WR.lp === 22) hi = '22 kW braucht die Zustimmung des Netzbetreibers. Für die meisten Häuser reicht 11 kW über Nacht völlig.';
    else if (WR.lp === 2.3) hi = 'Haushaltssteckdosen sind nicht für tägliche, stundenlange Dauerlast gebaut – für regelmäßiges Laden empfehlen wir eine Wallbox.';
    else if (WR.ob === 22 && WR.lp === 11) hi = 'Ihr Auto könnte 22 kW – über Nacht reichen 11 kW aber fast immer.';
    $('#e-hinweis').textContent = hi;
    $('#w-knopf').dataset.text = km + ' km pro Tag, ' + de(v, 1) + ' kWh/100 km, Akku ' + ak + ' kWh, Ladepunkt ' + de(WR.lp, 1) + ' kW, Bordlader ' + de(WR.ob, 1) + ' kW';
  }
  ['#w-km', '#w-verb', '#w-akku'].forEach(function (s) { $(s).addEventListener('input', wrechne); }); wrechne();
  var wk = $('#w-knopf'); wk.addEventListener('click', function () { var t = $('#k-text'); if (t && !t.value) t.value = 'Wallbox-Rechner: ' + wk.dataset.text + '. '; var th = $('#k-thema'); if (th && !th.value) th.value = 'Wallbox'; });

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
    { k: ['zählerschrank', 'zaehlerschrank', 'verteiler', 'tauschen', 'erneuern'], q: 'Muss mein Zählerschrank neu?', a: 'Oft ja, wenn PV-Anlage, Wallbox oder Wärmepumpe dazukommen oder der Schrank keinen FI-Schutz hat. Dann gelten die aktuellen Anschlussbedingungen (VDE-AR-N 4100 und TAB Ihres Netzbetreibers). Wir prüfen das beim Termin.' },
    { k: ['fi', 'rcd', 'fehlerstrom'], q: 'Brauche ich einen FI-Schalter?', a: 'Ein FI (RCD) mit 30 mA ist nach DIN VDE 0100-410 vorgeschrieben für Steckdosen bis 32 A, Außen-Stromkreise bis 32 A und Beleuchtung in Wohnungen – bei Neuanlagen und wesentlichen Änderungen. Nachrüsten lohnt sich auch im Altbau.' },
    { k: ['wallbox', 'laden', 'e-auto', 'anmeld'], q: 'Wallbox anmelden?', a: 'Wallboxen bis 11 kW werden beim Netzbetreiber angemeldet, über 11 kW braucht es seine Zustimmung. Das übernehmen wir. Neue Wallboxen über 4,2 kW sind steuerbar nach § 14a EnWG – dafür sinkt das Netzentgelt.' },
    { k: ['14a', 'netzentgelt', 'steuerbar'], q: 'Was bedeutet § 14a?', a: 'Seit 2024 müssen neue Wallboxen und Wärmepumpen über 4,2 kW vom Netzbetreiber im Notfall gedrosselt werden können – nie ganz abgeschaltet. Im Gegenzug zahlen Sie ein reduziertes Netzentgelt.' },
    { k: ['rauchmelder', 'brand'], q: 'Wo müssen Rauchmelder hin?', a: 'Nach den Landesbauordnungen (z. B. Baden-Württemberg und Bayern) in Schlafräumen, Kinderzimmern und in Fluren, die als Rettungsweg dienen. Wir setzen sie bei der Installation gleich mit.' },
    { k: ['e-check', 'echeck', 'dguv', 'prüfung', 'pruefung'], q: 'E-Check oder DGUV V3?', a: 'Der E-Check prüft Ihre Anlage mit Messprotokoll. Für Betriebe gilt DGUV Vorschrift 3: ortsfeste Anlagen in der Regel alle 4 Jahre, Geräte je nach Einsatz – im Büro oft alle 24 Monate.' },
    { k: ['smart', 'knx', 'funk', 'app'], q: 'KNX oder Funk?', a: 'KNX ist im Neubau und bei Kernsanierung die stabilste Lösung – ein Bus für alles, später umprogrammierbar. Im bewohnten Bestand ist Funk oft der bessere Weg, weil kaum Wände geöffnet werden.' },
    { k: ['altbau', 'alte leitung', 'aluminium', 'zweiadrig'], q: 'Altbau – alles neu?', a: 'Nicht immer. Wir messen die Isolation und schauen Leitungen und Verteiler an. Zweiadrige Leitungen ohne Schutzleiter oder ein Schrank ohne FI sind Gründe für eine Sanierung.' },
    { k: ['termin', 'kontakt', 'rückruf', 'anfrage'], q: 'Termin anfragen', a: 'Gern! Unten im Formular eintragen – wir melden uns am selben Werktag.', ziel: '#kontakt' }
  ];
  var vl = $('#verlauf'), ch = $('#chips'), assi = $('#assi');
  function sag(t, w) { var d = document.createElement('div'); d.className = 'msg ' + w; d.textContent = t; vl.appendChild(d); vl.scrollTop = vl.scrollHeight; }
  function antworte(text) {
    var t = text.toLowerCase(), best = null, bs = 0;
    KB.forEach(function (e) { var s = 0; e.k.forEach(function (k) { if (t.indexOf(k) > -1) s++; }); if (s > bs) { bs = s; best = e; } });
    setTimeout(function () { if (best) { sag(best.a, 'bot'); if (best.ziel) location.hash = best.ziel.slice(1); } else sag('Dazu habe ich keine sichere Antwort. Schreiben Sie uns kurz über das Formular – wir rufen Sie zurück.', 'bot'); }, reduce ? 0 : 320);
  }
  sag('Hallo! Fragen zu Zählerschrank, Wallbox oder Smart Home? Einfach antippen:', 'bot');
  KB.forEach(function (e) { var b = document.createElement('button'); b.type = 'button'; b.textContent = e.q; b.onclick = function () { sag(e.q, 'ich'); antworte(e.k[0] + ' ' + e.q); }; ch.appendChild(b); });
  $('#assiform').addEventListener('submit', function (e) { e.preventDefault(); var i = $('#assiein'); if (!i.value.trim()) return; sag(i.value, 'ich'); antworte(i.value); i.value = ''; });
  var zu = $('#assizu');
  function toggle() { assi.classList.remove('mini'); var z = assi.classList.toggle('zu'); zu.textContent = z ? '+' : '–'; zu.setAttribute('aria-label', z ? 'Fragen-Assistent öffnen' : 'Fragen-Assistent einklappen'); }
  $('#assikopf').addEventListener('click', toggle);
  if (innerWidth < 700 || innerHeight < 600) toggle(); else assi.classList.add('mini');
  assi.addEventListener('click', function (e) { if (assi.classList.contains('mini') && !e.target.closest('#assizu')) assi.classList.remove('mini'); });

})();
