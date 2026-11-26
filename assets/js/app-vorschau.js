/* Effekt: eigene Umsetzung */
(function () {
  'use strict';
  var D = document, IMG = 'assets/img/app/';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Helfer ---------- */
  function klemm(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(p, a, b) { return klemm((p - a) / (b - a), 0, 1); }
  function glatt(t) { t = klemm(t, 0, 1); return t * t * (3 - 2 * t); }
  function de(n, d) {
    d = d == null ? 2 : d;
    var s = (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return s.join(',');
  }
  function q(r, s) { return r.querySelector(s); }
  function qa(r, s) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
  function ic(n, c) { return '<svg class="ai' + (c ? ' ' + c : '') + '" aria-hidden="true" focusable="false"><use href="#ai-' + n + '"></use></svg>'; }

  /* ---------- Eigene Icons (SVG-Sprite) ---------- */
  var ICONS = {
    home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
    inbox: '<path d="M4.5 5h15l2 8v6a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-6z"/><path d="M2.5 13H8l1.5 3h5l1.5-3h5.5"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    auftrag: '<path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14.5 3v4.5H19M9 12h7M9 16h5"/>',
    team: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.7-3.4 3.1-5.4 6.2-5.4s5.5 2 6.2 5.4"/><circle cx="17.3" cy="9" r="2.6"/><path d="M16.6 14.4c2.5.2 4.2 1.9 4.8 4.7"/>',
    check: '<path d="M5 12.5 10 17l9-10"/>',
    chev: '<path d="M14.5 6 8.5 12l6 6"/>',
    pin: '<path d="M12 21s6.8-6.1 6.8-11.3a6.8 6.8 0 0 0-13.6 0C5.2 14.9 12 21 12 21z"/><circle cx="12" cy="9.7" r="2.4"/>',
    send: '<path d="M4 12 20.5 4 14 20.5l-2.6-6.8z"/><path d="m11.4 13.7 9.1-9.7"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.3V12l3.2 2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    cam: '<path d="M4.5 8H8l1.8-2.6h4.4L16 8h3.5a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.3" r="3.4"/>',
    ruler: '<path d="M3 16.5 16.5 3 21 7.5 7.5 21z"/><path d="m7 12.5 2 2M9.8 9.7l1.5 1.5M12.6 6.9l2 2"/>',
    ki: '<path d="M12 3.5l1.7 5L18.5 10l-4.8 1.6L12 16.5l-1.7-4.9L5.5 10l4.8-1.5z"/><path d="M18.5 15.5l.7 1.9 1.8.6-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.6z"/>',
    star: '<path d="m12 3.8 2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z"/>',
    sync: '<path d="M4.5 11a7.5 7.5 0 0 1 13-4.2L19.5 9M19.5 4.5V9H15M19.5 13a7.5 7.5 0 0 1-13 4.2L4.5 15M4.5 19.5V15H9"/>',
    box: '<path d="M3.5 7.6 12 3.5l8.5 4.1v8.8L12 20.5l-8.5-4.1z"/><path d="M3.5 7.6 12 11.8l8.5-4.2M12 11.8v8.7"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
    route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.8"/>',
    euro: '<path d="M17.5 6.5A6.5 6.5 0 1 0 17.5 17.5M4.5 10.5h9M4.5 13.5h9"/>',
    plus: '<path d="M12 5.5v13M5.5 12h13"/>',
    minus: '<path d="M5.5 12h13"/>',
    bell: '<path d="M6.5 16v-5a5.5 5.5 0 0 1 11 0v5l1.5 2h-14z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    such: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    pen: '<path d="M4.5 19.5 5.5 15 16 4.5l3.5 3.5L9 18.5z"/><path d="m14 6.5 3.5 3.5"/>',
    datei: '<path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14.5 3v4.5H19"/>'
  };
  function sprite() {
    if (D.getElementById('ai-sprite')) return;
    var s = '<svg id="ai-sprite" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">';
    for (var k in ICONS) s += '<symbol id="ai-' + k + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + ICONS[k] + '</symbol>';
    var d = D.createElement('div'); d.innerHTML = s + '</svg>'; D.body.insertBefore(d.firstChild, D.body.firstChild);
  }

  /* ---------- Fachlogik Fliesen (Formeln wie Fliesen-Template) ----------
     Verschnitt: gerade 10 %, Drittelverband 12 %, diagonal 15 %; Großformat (Kante ≥ 120 cm) +3 %.
     Kleber C2: Zahnung 6 mm ≈ 2,5 kg/m², 8 mm ≈ 3,2, 10 mm ≈ 4,0; ab 60 cm Kante + Buttering ≈ 0,8 kg/m².
     Fugenmörtel kg/m² = (A + B)/(A·B) · Fugenbreite · Fugentiefe · 1,6 (mm).
     Abzüge: Tür 0,80 × 2,00 m, Fenster 0,90 × 1,20 m. */
  var FORMATE = { '30x60': [30, 60], '60x120': [60, 120], '120x120': [120, 120] };
  var ART = { gerade: ['gerade', 0.10], drittel: ['Drittelverband', 0.12], diagonal: ['diagonal', 0.15] };
  var TUER = 0.80 * 2.00, FENSTER = 0.90 * 1.20, DUSCHE_WAND = (1.20 + 0.90) * 2.50;
  function rechne(m) {
    var f = FORMATE[m.format], a = f[0], b = f[1], max = Math.max(a, b), gross = max >= 120;
    var boden = m.L * m.B, wandB = 2 * (m.L + m.B) * m.H, wand = wandB - TUER - FENSTER;
    var v = ART[m.art][1] + (gross ? 0.03 : 0), pl = a * b / 1e4, ges = boden + wand;
    var zahn = max <= 30 ? 6 : (max <= 60 ? 8 : 10);
    var kgm = { 6: 2.5, 8: 3.2, 10: 4.0 }[zahn] + (max >= 60 ? 0.8 : 0);
    var fug = ((a * 10 + b * 10) / (a * 10 * b * 10)) * 2 * (gross ? 9 : 10) * 1.6;
    var kleber = Math.ceil(ges * kgm);
    return {
      boden: boden, wand: wand, abz: TUER + FENSTER, ges: ges, v: v, gross: gross,
      stB: Math.ceil(boden * (1 + v) / pl), stW: Math.ceil(wand * (1 + v) / pl),
      kleber: kleber, sack: Math.ceil(kleber / 25), fuge: Math.max(1, Math.ceil(ges * fug)),
      fmt: a + ' × ' + b, art: ART[m.art][0], dicht: boden + DUSCHE_WAND
    };
  }
  function positionen(r) {
    return [
      ['Alte Wand- und Bodenfliesen entfernen, entsorgen', r.ges, 'm²', 28],
      ['Abdichtung DIN 18534, W2-I, inkl. Dichtband', r.dicht, 'm²', 62],
      ['Bodengleiche Dusche, Rinne 80 cm, Gefälle 2 %', 1, 'Stk', 690],
      ['Bodenfliesen ' + r.fmt + ' verlegen', r.boden, 'm²', 89],
      ['Wandfliesen ' + r.fmt + ' verlegen', r.wand, 'm²', 94],
      ['Silikon-Wartungsfugen', 28, 'lfm', 9.5]
    ];
  }

  /* ---------- Grundriss-Skizze ---------- */
  function skizze(L, B) {
    var sc = Math.min(70 / L, 46 / B), w = L * sc, h = B * sc, x = (100 - w) / 2, y = (76 - h) / 2 + 2;
    var per = 2 * (w + h), fx = x + 0.45 * sc, fw = 0.9 * sc, dw = 1.2 * sc, dd = 0.9 * sc, tx = x + 0.35 * sc, tw = 0.8 * sc;
    var s = '';
    s += '<rect class="sk-dusche" x="' + (x + w - dw) + '" y="' + y + '" width="' + dw + '" height="' + dd + '"/>';
    s += '<line class="sk-rinne" x1="' + (x + w - dw + 1.5) + '" y1="' + (y + 1.6) + '" x2="' + (x + w - 1.5) + '" y2="' + (y + 1.6) + '"/>';
    s += '<text class="sk-klein sk-d" x="' + (x + w - dw / 2) + '" y="' + (y + dd / 2 + 3) + '">Dusche 2 %</text>';
    s += '<path class="sk-wand" pathLength="1" d="M' + x + ' ' + y + 'H' + (x + w) + 'V' + (y + h) + 'H' + x + 'Z"/>';
    s += '<g class="sk-detail"><line class="sk-fenster" x1="' + fx + '" y1="' + (y - 0.9) + '" x2="' + (fx + fw) + '" y2="' + (y - 0.9) + '"/><line class="sk-fenster" x1="' + fx + '" y1="' + (y + 0.9) + '" x2="' + (fx + fw) + '" y2="' + (y + 0.9) + '"/>';
    s += '<line class="sk-loch" x1="' + tx + '" y1="' + (y + h) + '" x2="' + (tx + tw) + '" y2="' + (y + h) + '"/>';
    s += '<path class="sk-tuer" d="M' + tx + ' ' + (y + h) + 'V' + (y + h - tw) + 'M' + tx + ' ' + (y + h - tw) + 'A' + tw + ' ' + tw + ' 0 0 1 ' + (tx + tw) + ' ' + (y + h) + '"/></g>';
    s += '<text class="sk-mass sk-m1" x="' + (x + w / 2) + '" y="' + (y - 3.4) + '">' + de(L) + ' m</text>';
    s += '<text class="sk-mass sk-m2" x="' + (x + w + 3.2) + '" y="' + (y + h / 2) + '" transform="rotate(90 ' + (x + w + 3.2) + ' ' + (y + h / 2) + ')">' + de(B) + ' m</text>';
    s += '<text class="sk-klein sk-m3" x="' + (x + w / 2) + '" y="' + (y + h - 3) + '">Fläche ' + de(L * B) + ' m²</text>';
    return { svg: s, x: x, y: y, w: w, h: h, per: per };
  }
  function punktAuf(g, t) {            /* Punkt auf dem Wandumriss bei Anteil t */
    var d = t * g.per;
    if (d <= g.w) return [g.x + d, g.y]; d -= g.w;
    if (d <= g.h) return [g.x + g.w, g.y + d]; d -= g.h;
    if (d <= g.w) return [g.x + g.w - d, g.y + g.h]; d -= g.w;
    return [g.x, g.y + g.h - Math.min(d, g.h)];
  }

  var SIG = 'M18 78C26 42 58 30 54 54 50 74 18 86 30 96 46 106 80 68 92 58 97 74 102 86 112 70 120 56 126 50 130 70 132 86 142 60 152 58 160 57 162 78 170 70 177 62 182 55 188 72 192 83 200 63 207 60 216 58 214 80 224 74 234 68 242 50 252 66 258 77 268 70 284 61';

  /* ---------- Bildschirme ---------- */
  var ORD = ['start', 'anfrage', 'kalender', 'aufmass', 'fotos', 'angebot', 'signatur', 'zeit', 'fertig'];
  var TAB = { start: 0, anfrage: 1, kalender: 2, aufmass: 3, fotos: 3, angebot: 3, fertig: 3, zeit: 4 };
  var REITER = { aufmass: 0, fotos: 1, angebot: 2, fertig: 3 };
  function reiter(akt) {
    var n = ['Aufmaß', 'Fotos', 'Angebot', 'Abschluss'], s = '<div class="as-reiter" role="tablist">';
    n.forEach(function (t, i) { s += '<button type="button" class="' + (i === akt ? 'an' : '') + '" data-geh="' + ['aufmass', 'fotos', 'angebot', 'fertig'][i] + '">' + t + '</button>'; });
    return s + '</div>';
  }
  function handyHTML(mini) {
    var h = '<div class="as-status"><span class="as-uhr" data-r="uhr">07:40</span><span class="as-insel"></span><span class="as-netz"><i></i><i></i><i></i><i></i><b></b></span></div>';
    h += '<div class="as-screens">';
    if (!mini) {
      /* START / Dashboard */
      h += '<section class="as-s" data-s="start"><div class="as-kopf"><small data-r="datum">Montag, 30. November</small><h4 data-r="gruss">Guten Morgen, Martin</h4><span class="as-ava">MM</span></div>' +
        '<div class="as-body"><div class="as-rolle">' +
        '<div class="as-kpis"><button type="button" class="as-kpi" data-geh="anfrage"><i>' + ic('inbox') + '</i><b data-z="anfr">0</b><span>Neue Anfragen</span><em class="as-neu">Neu</em></button>' +
        '<button type="button" class="as-kpi" data-geh="kalender"><i>' + ic('cal') + '</i><b data-z="term">2</b><span>Termine heute</span></button>' +
        '<button type="button" class="as-kpi" data-geh="angebot"><i>' + ic('auftrag') + '</i><b data-z="ang">3</b><span>Offene Angebote</span></button>' +
        '<button type="button" class="as-kpi" data-geh="zeit"><i>' + ic('clock') + '</i><b data-z="std">31,5</b><span>Stunden Woche</span></button></div>' +
        '<p class="as-ueber">Heute</p><div class="as-liste">' +
        '<div class="as-zeile"><time>08:00</time><div><b>Baustelle Berger</b><small>Bad 5 m² · Tag 3 von 4</small></div><em class="as-live"></em></div>' +
        '<div class="as-zeile"><time>13:30</time><div><b>Besichtigung Hoffmann</b><small>Küchenspiegel · 20 min</small></div></div>' +
        '<div class="as-zeile"><time>16:00</time><div><b>Material abholen</b><small>Fliesenkleber C2, Dichtband</small></div></div></div>' +
        '</div></div></section>';
      /* ANFRAGE */
      h += '<section class="as-s" data-s="anfrage"><div class="as-kopf"><small class="as-zurueck" data-geh="start">' + ic('chev') + 'Anfragen</small><h4>Beispielkundin</h4><span class="as-chip gruen">Neu</span></div>' +
        '<div class="as-body"><div class="as-rolle">' +
        '<p class="as-meta">' + ic('pin') + 'Weißenhorn · über Website · Mo 18:42</p>' +
        '<div class="as-karte"><small>Anliegen</small><p>Bad komplett neu, ca. 7 m². Wanne raus, bodengleiche Dusche rein. Die Fliesen sind von 1985.</p></div>' +
        '<div class="as-fotos3"><figure data-a="0"><img src="' + IMG + 'kunde-1.webp" alt="" width="720" height="540" decoding="async"></figure><figure data-a="1"><img src="' + IMG + 'kunde-2.webp" alt="" width="720" height="540" decoding="async"></figure><figure data-a="2"><img src="' + IMG + 'kunde-3.webp" alt="" width="720" height="540" decoding="async"></figure><span class="as-ki">✦ KI</span></div>' +
        '<div class="as-karte as-kibox"><small>' + ic('ki') + 'KI-Vorsortierung</small><div class="as-chips"><span data-a="3">Badsanierung komplett</span><span data-a="4">Dusche bodengleich</span><span data-a="5">ca. 7 m²</span><span data-a="6">Fliesen von 1985</span><span data-a="7">Wunsch: Frühjahr</span></div></div>' +
        '<div class="as-dring" data-a="8"><span>Dringlichkeit</span><b>normal · in 2–3 Monaten</b></div>' +
        '<button type="button" class="as-btn" data-akt="zum-termin">' + ic('cal') + 'Termin vorschlagen</button>' +
        '</div></div></section>';
      /* KALENDER */
      h += '<section class="as-s" data-s="kalender"><div class="as-kopf"><small class="as-zurueck" data-geh="anfrage">' + ic('chev') + 'Bad OG</small><h4>Termin vorschlagen</h4><small class="as-unter">Besichtigung · ca. 45 min</small></div>' +
        '<div class="as-body"><div class="as-rolle">' +
        '<div class="as-woche"><span><small>Mo</small>30</span><span><small>Di</small>1</span><span><small>Mi</small>2</span><span class="an"><small>Do</small>3</span><span><small>Fr</small>4</span></div>' +
        '<div class="as-slots"><div class="as-slot belegt"><time>08:00</time><span>Baustelle Berger</span></div>' +
        '<button type="button" class="as-slot" data-slot="13:30"><time>13:30</time><span>frei</span></button>' +
        '<button type="button" class="as-slot" data-slot="16:30"><time>16:30</time><span>frei · passt zur Route</span></button>' +
        '<button type="button" class="as-slot" data-slot="17:45"><time>17:45</time><span>frei</span></button></div>' +
        '<div class="as-route"><svg viewBox="0 0 200 80" aria-hidden="true"><path class="r-str" d="M-5 62 C30 60 40 40 70 42 S120 70 150 50 205 20 205 20"/><path class="r-str" d="M40 -5 C50 30 60 60 55 90"/><path class="r-str" d="M120 -5 C115 30 140 50 175 90"/><path class="r-weg" pathLength="1" d="M22 60 C40 52 52 41 72 43 S118 66 148 51 172 30 178 26"/><circle class="r-a" cx="22" cy="60" r="4"/><circle class="r-b" cx="178" cy="26" r="5"/></svg>' +
        '<div><b>' + ic('route') + '18 min · 14 km</b><small>vom Lager nach Weißenhorn</small></div></div>' +
        '<button type="button" class="as-btn" data-akt="bestaetigen">' + ic('check') + 'Termin bestätigen</button>' +
        '<div class="as-sms"><small>SMS an Kundin · automatisch</small><p>Guten Tag, Ihr Besichtigungstermin am Do, 3.12., um 16:30 Uhr ist bestätigt. – Muster Fliesen &amp; Bad</p><em>' + ic('check') + 'zugestellt</em></div>' +
        '<button type="button" class="as-btn zweit" data-geh="aufmass">Weiter zum Aufmaß</button>' +
        '</div></div></section>';
    }
    /* AUFMASS (auch im Mini-Ausschnitt) */
    h += '<section class="as-s" data-s="aufmass"><div class="as-kopf"><small>Bad OG · Do 3.12., 16:52</small><h4>Aufmaß · Bad OG</h4></div>' + (mini ? '' : reiter(0)) +
      '<div class="as-body"><div class="as-rolle">' +
      '<div class="as-skizze"><svg viewBox="0 0 100 76" aria-hidden="true"><defs><pattern id="skr' + (mini ? 'm' : '') + '" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M4 0H0V4" fill="none" stroke="currentColor" stroke-width=".18"/></pattern></defs><rect class="sk-raster" width="100" height="76" fill="url(#skr' + (mini ? 'm' : '') + ')"/><g data-r="sk"></g></svg><span class="as-stift"></span></div>' +
      '<div class="as-masse"><div><span>Länge</span><button type="button" class="as-st" data-m="L" data-d="-1" aria-label="Länge kleiner">' + ic('minus') + '</button><b data-r="mL">3,20</b><button type="button" class="as-st" data-m="L" data-d="1" aria-label="Länge größer">' + ic('plus') + '</button></div>' +
      '<div><span>Breite</span><button type="button" class="as-st" data-m="B" data-d="-1" aria-label="Breite kleiner">' + ic('minus') + '</button><b data-r="mB">2,45</b><button type="button" class="as-st" data-m="B" data-d="1" aria-label="Breite größer">' + ic('plus') + '</button></div>' +
      '<div><span>Höhe</span><button type="button" class="as-st" data-m="H" data-d="-1" aria-label="Raumhöhe kleiner">' + ic('minus') + '</button><b data-r="mH">2,50</b><button type="button" class="as-st" data-m="H" data-d="1" aria-label="Raumhöhe größer">' + ic('plus') + '</button></div></div>' +
      '<div class="as-erg"><div><span>Boden</span><b data-r="eBoden">0,00</b><small>m²</small></div><div><span>Wand netto</span><b data-r="eWand">0,00</b><small>m²</small></div><div><span>Abzug</span><b data-r="eAbz">0,00</b><small>Tür, Fenster</small></div></div>' +
      '<div class="as-seg" data-g="format"><button type="button" data-v="30x60">30 × 60</button><button type="button" data-v="60x120" class="an">60 × 120</button><button type="button" data-v="120x120">120 × 120</button></div>' +
      '<div class="as-seg" data-g="art"><button type="button" data-v="gerade">gerade</button><button type="button" data-v="drittel" class="an">Drittel</button><button type="button" data-v="diagonal">diagonal</button></div>' +
      '<div class="as-versch"><span>Verschnitt</span><b data-r="vers">15 %</b><small data-r="versText">Großformat · Drittelverband</small></div>' +
      '<div class="as-mat"><div><i>' + ic('box') + '</i><span>Platten Boden</span><b data-r="stB">13 Stk</b></div><div><i>' + ic('box') + '</i><span>Platten Wand</span><b data-r="stW">41 Stk</b></div>' +
      '<div><i>' + ic('box') + '</i><span>Kleber C2</span><b data-r="kl">161 kg · 7 Sack</b></div><div><i>' + ic('box') + '</i><span>Fugenmörtel</span><b data-r="fu">3 kg</b></div></div>' +
      (mini ? '' : '<button type="button" class="as-btn" data-akt="aufmass-ok">' + ic('check') + 'Speichern · weiter zu Fotos</button>') +
      '</div></div></section>';
    if (!mini) {
      /* FOTOS */
      h += '<section class="as-s" data-s="fotos"><div class="as-kopf"><small>Bad OG · Do 3.12.</small><h4>Fotos &amp; Notizen</h4></div>' + reiter(1) +
        '<div class="as-body"><div class="as-rolle">' +
        '<div class="as-sucher"><img src="' + IMG + 'kunde-1.webp" alt="" width="720" height="540" decoding="async"><i class="as-raster3"></i><span class="as-blitz"></span><span class="as-ki">✦ KI</span><button type="button" class="as-ausl" data-akt="foto" aria-label="Foto aufnehmen"><i></i></button></div>' +
        '<div class="as-galerie"><figure><img src="' + IMG + 'kunde-1.webp" alt="" width="720" height="540" decoding="async"><small>Kundin</small></figure><figure><img src="' + IMG + 'kunde-2.webp" alt="" width="720" height="540" decoding="async"><small>Kundin</small></figure><figure><img src="' + IMG + 'kunde-3.webp" alt="" width="720" height="540" decoding="async"><small>Kundin</small></figure>' +
        '<figure class="neu" data-f="0"><img src="' + IMG + 'kunde-1.webp" alt="" width="720" height="540" decoding="async" style="object-position:20% 50%"><small>Vorher</small></figure><figure class="neu" data-f="1"><img src="' + IMG + 'kunde-3.webp" alt="" width="720" height="540" decoding="async" style="object-position:80% 60%"><small>Vorher</small></figure></div>' +
        '<div class="as-karte notiz"><small>' + ic('pen') + 'Notiz</small><p data-r="notiz"></p></div>' +
        '<div class="as-sprache"><button type="button" class="as-play" data-akt="play" aria-label="Sprachnotiz abspielen">' + ic('play') + '</button><div class="as-welle" data-r="welle"></div><time>0:14</time>' +
        '<p><small>' + ic('mic') + 'Sprachnotiz · Text automatisch</small>Kundin wünscht eine beleuchtete Nische in der Dusche, 30 × 60.</p></div>' +
        '<button type="button" class="as-btn" data-akt="zum-angebot">' + ic('auftrag') + 'Angebot erstellen</button>' +
        '</div></div></section>';
      /* ANGEBOT */
      h += '<section class="as-s" data-s="angebot"><div class="as-kopf"><small>Bad OG · aus Aufmaß erstellt</small><h4>Angebot A-2026-214</h4></div>' + reiter(2) +
        '<div class="as-body"><div class="as-rolle">' +
        '<div class="as-papier"><div class="as-pkopf"><b>Muster Fliesen &amp; Bad</b><small>Angebot · 04.12.2026</small></div><div class="as-pos" data-r="pos"></div>' +
        '<div class="as-summe"><div><span>Netto</span><b data-r="netto"></b></div><div><span>MwSt. 19 %</span><b data-r="mwst"></b></div><div class="ges"><span>Gesamt</span><b data-r="brutto"></b></div></div>' +
        '<p class="as-bsp">Beispielpreise · Arbeitsleistung ohne Material</p></div>' +
        '<button type="button" class="as-btn" data-akt="senden">' + ic('send') + 'An Kundin senden</button>' +
        '<p class="as-gesendet">' + ic('check') + 'Gesendet 08:12 · als PDF + Link zum Unterschreiben</p>' +
        '</div></div></section>';
      /* SIGNATUR – Handy der Kundin */
      h += '<section class="as-s hell" data-s="signatur"><div class="as-kopf"><small class="as-chip">Handy der Kundin</small><h4>Angebot annehmen</h4></div>' +
        '<div class="as-body"><div class="as-rolle">' +
        '<div class="as-karte hell"><small>Muster Fliesen &amp; Bad</small><p><b>Angebot A-2026-214</b><br>Bad komplett, Dusche bodengleich<br>Gesamt <b data-r="brutto2"></b> <span class="as-grau">(Beispiel)</span></p><span class="as-pdf">' + ic('datei') + 'PDF</span></div>' +
        '<p class="as-text">Ich beauftrage die Arbeiten laut Angebot.</p>' +
        '<div class="as-pad"><svg viewBox="0 0 300 120" aria-hidden="true"><path class="as-sig" pathLength="1" d="' + SIG + '"/><g data-r="sigEigen"></g></svg><i class="as-linie"></i><small>Unterschrift</small><button type="button" class="as-leer" data-akt="sig-leer">Löschen</button></div>' +
        '<p class="as-grau as-klein">Beispielkundin · Weißenhorn, 04.12.2026</p>' +
        '<button type="button" class="as-btn dunkel" data-akt="beauftragen">Verbindlich beauftragen</button>' +
        '<p class="as-erfolg">' + ic('check') + 'Auftrag erteilt · Bestätigung per E-Mail</p>' +
        '</div></div></section>';
      /* ZEIT / Baustelle */
      h += '<section class="as-s" data-s="zeit"><div class="as-kopf"><small>Mo 14.12. · Tag 1 von 5</small><h4>Baustelle Bad OG</h4><span class="as-chip gruen"><i class="as-puls"></i>läuft</span></div>' +
        '<div class="as-body"><div class="as-rolle">' +
        '<div class="as-team"><div class="as-mann" data-p="0"><span class="as-ava">TR</span><div><b>Tobias R.</b><small>Geselle · seit 07:02</small></div><time data-r="t0">0:00</time><button type="button" class="as-ss" data-akt="ss" data-p="0">Stopp</button></div>' +
        '<div class="as-mann" data-p="1"><span class="as-ava">LK</span><div><b>Leon K.</b><small>Azubi · seit 07:05</small></div><time data-r="t1">0:00</time><button type="button" class="as-ss" data-akt="ss" data-p="1">Stopp</button></div>' +
        '<div class="as-mann aus" data-p="2"><span class="as-ava">MM</span><div><b>Martin M.</b><small>Chef · 08:30–10:00</small></div><time>1:30</time><button type="button" class="as-ss" data-akt="ss" data-p="2">Start</button></div></div>' +
        '<div class="as-tagfoto"><img src="' + IMG + 'vorher.webp" alt="" width="720" height="540" decoding="async"><span>Rückbau erledigt · 11:40</span><span class="as-ki">✦ KI</span></div>' +
        '<p class="as-ueber">Material</p><div class="as-check">' +
        '<button type="button" data-c="0">' + ic('check') + '<span>Fliesenkleber C2 · <em data-r="cSack">7</em> Sack</span></button><button type="button" data-c="1">' + ic('check') + '<span>Dichtband &amp; Manschetten</span></button>' +
        '<button type="button" data-c="2">' + ic('check') + '<span>Duschrinne 80 cm</span></button><button type="button" data-c="3">' + ic('check') + '<span>Fugenmörtel · <em data-r="cFuge">3</em> kg</span></button></div>' +
        '<div class="as-karte bericht"><small>' + ic('pen') + 'Tagesbericht</small><p>Alte Fliesen und Wanne raus, Untergrund geprüft, Boden 1. Lage Abdichtung.</p></div>' +
        '<p class="as-recht">Arbeitszeit wird aufgezeichnet – seit dem BAG-Beschluss vom 13.09.2022 (1 ABR 22/21) Pflicht. Allgemeiner Hinweis, keine Rechtsberatung.</p>' +
        '<button type="button" class="as-btn" data-akt="abschluss">' + ic('check') + 'Auftrag abschließen</button>' +
        '</div></div></section>';
      /* FERTIG */
      h += '<section class="as-s" data-s="fertig"><div class="as-kopf"><small>Fr 18.12. · 15:40</small><h4>Auftrag Bad OG</h4><span class="as-chip gruen">' + ic('check') + 'Fertig</span></div>' + reiter(3) +
        '<div class="as-body"><div class="as-rolle">' +
        '<div class="as-nachher"><img src="' + IMG + 'nachher.webp" alt="" width="720" height="540" decoding="async"><span>Nachher</span><span class="as-ki">✦ KI</span></div>' +
        '<div class="as-zeile2 rech"><i>' + ic('euro') + '</i><div><b>Rechnung R-2026-118</b><small data-r="rText">aus dem Angebot · bereit</small></div><button type="button" class="as-mini-btn" data-akt="rechnung">Senden</button></div>' +
        '<div class="as-zeile2 bew"><i>' + ic('star') + '</i><div><b>Bewertungsbitte</b><small data-r="bText">nach 24 h automatisch</small></div><button type="button" class="as-mini-btn" data-akt="bewertung">Planen</button></div>' +
        '<div class="as-zeile2"><i>' + ic('clock') + '</i><div><b>74,5 Stunden</b><small>5 Tage · 2 Personen</small></div></div>' +
        '<button type="button" class="as-btn zweit" data-akt="neu">Beispiel neu starten</button>' +
        '</div></div></section>';
    }
    h += '</div>';
    if (!mini) {
      h += '<nav class="as-tabs" aria-label="App-Navigation">' +
        [['start', 'home', 'Start'], ['anfrage', 'inbox', 'Anfragen'], ['kalender', 'cal', 'Kalender'], ['aufmass', 'auftrag', 'Aufträge'], ['zeit', 'team', 'Team']].map(function (t, i) {
          return '<button type="button" data-tab="' + i + '" data-geh="' + t[0] + '">' + ic(t[1]) + '<span>' + t[2] + '</span></button>';
        }).join('') + '</nav>';
      h += '<button type="button" class="as-push" data-geh="anfrage"><span class="as-push-ic">' + ic('inbox') + '</span><span class="as-push-t"><b>Neue Anfrage · Website</b><span>Beispielkundin: Bad ca. 7 m², bodengleiche Dusche · 3 Fotos</span></span><time>jetzt</time></button>';
    }
    h += '<span class="as-finger" aria-hidden="true"></span>';
    return h;
  }

  /* ---------- Tablet (Büro) ---------- */
  var SPALTEN = ['Anfrage', 'Termin', 'Angebot', 'Auftrag', 'Fertig'];
  var VERLAUF = [['Anfrage über Website', 'Mo 30.11. · 18:42'], ['Termin bestätigt · Do 16:30', 'Mo 30.11. · 18:51'], ['Aufmaß erfasst', 'Do 3.12. · 17:05'], ['2 Fotos · 1 Sprachnotiz', 'Do 3.12. · 17:12'], ['Angebot gesendet', 'Fr 4.12. · 08:12'], ['Digital unterschrieben', 'Fr 4.12. · 19:05'], ['Baustelle · 2 Personen', 'Mo 14.12. · 07:02'], ['Rechnung + Bewertungsbitte', 'Fr 18.12. · 15:40']];
  function tabletHTML() {
    var h = '<aside class="at-side"><span class="at-logo">M</span>' + ['home', 'inbox', 'cal', 'auftrag', 'team', 'euro'].map(function (n, i) { return '<i class="' + (i === 0 ? 'an' : '') + '">' + ic(n) + '</i>'; }).join('') + '</aside>';
    h += '<div class="at-haupt"><header class="at-top"><div><small>Büro · Muster Fliesen &amp; Bad</small><h4>Übersicht</h4></div><span class="at-such">' + ic('such') + 'Suchen</span><span class="at-sync" data-r="sync"><i></i>synchron</span><span class="as-ava">MM</span></header>';
    h += '<div class="at-kpis"><div><b data-z="anfr">0</b><span>Neue Anfragen</span></div><div><b data-z="term">2</b><span>Termine heute</span></div><div><b data-z="ang">3</b><span>Offene Angebote</span></div><div><b data-z="std">31,5</b><span>Stunden Woche</span></div></div>';
    var andere = [['Weber', 'Terrasse 24 m²'], ['Hoffmann', 'Küchenspiegel'], ['Schmid', 'Gäste-WC'], ['Berger', 'Bad 5 m² · Tag 3'], ['Lang', 'Flur 18 m²']];
    h += '<div class="at-board">' + SPALTEN.map(function (s, i) {
      return '<div class="at-col" data-col="' + i + '"><h5>' + s + '</h5><div class="at-karten"><div class="at-karte"><b>' + andere[i][0] + '</b><small>' + andere[i][1] + '</small></div></div></div>';
    }).join('') + '</div></div>';
    h += '<aside class="at-detail"><small>Auftrag</small><h5>Bad OG · 7 m²</h5><div class="at-vorschau" data-r="vorschau">' +
      '<div data-v="leer"><p>Noch keine Anfrage.</p></div>' +
      '<div data-v="fotos3" class="at-thumbs"><img src="' + IMG + 'kunde-1.webp" alt=""><img src="' + IMG + 'kunde-2.webp" alt=""><img src="' + IMG + 'kunde-3.webp" alt=""></div>' +
      '<div data-v="termin" class="at-term"><small>Do 3. Dez</small><b>16:30</b><span>Besichtigung · 18 min Fahrt</span></div>' +
      '<div data-v="skizze" class="at-sk"><svg viewBox="0 0 100 76" aria-hidden="true"><g data-r="tsk"></g></svg><span data-r="tsum">33,41 m² Fliesen</span></div>' +
      '<div data-v="fotos4" class="at-thumbs"><img src="' + IMG + 'kunde-1.webp" alt=""><img src="' + IMG + 'kunde-3.webp" alt="" style="object-position:80% 60%"><span>+ Sprachnotiz 0:14</span></div>' +
      '<div data-v="angebot" class="at-pdf"><b>A-2026-214</b><span data-r="tbrutto"></span><svg viewBox="0 0 300 120" aria-hidden="true"><path pathLength="1" class="at-sig" d="' + SIG + '"/></svg></div>' +
      '<div data-v="stunden" class="at-bal"><i style="--h:.8"></i><i style="--h:.92"></i><i style="--h:.55"></i><i style="--h:.88"></i><i style="--h:.3" data-r="heute"></i><span>Stunden pro Tag · Team</span></div>' +
      '<div data-v="nachher" class="at-nach"><img src="' + IMG + 'nachher.webp" alt=""></div>' +
      '</div><ol class="at-verlauf">' + VERLAUF.map(function (v) { return '<li><i>' + ic('check') + '</i><span>' + v[0] + '<small>' + v[1] + '</small></span></li>'; }).join('') + '</ol></aside>';
    return h;
  }

  /* =====================================================================
     Gerät: baut DOM + rendert Zustand S (gleiche Komponente für Tour, Probe, Mini)
     ===================================================================== */
  function Handy(root, opt) {
    opt = opt || {};
    this.mini = !!opt.mini; this.probe = !!opt.probe;
    root.classList.add('as-app'); if (this.mini) root.classList.add('as-mini'); if (this.probe) root.classList.add('probe');
    root.innerHTML = handyHTML(this.mini);
    this.root = root; this.akt = null; this.alt = {}; this.ty = 0;
    var self = this; this.scr = {};
    qa(root, '.as-s').forEach(function (s) { self.scr[s.getAttribute('data-s')] = s; });
    this.r = {}; qa(root, '[data-r]').forEach(function (e) { self.r[e.getAttribute('data-r')] = e; });
    this.finger = q(root, '.as-finger'); this.stift = q(root, '.as-stift');
    var w = this.r.welle; if (w) { var b = ''; for (var i = 0; i < 26; i++) b += '<i style="--h:' + (0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * .6)) * 0.75).toFixed(2) + '"></i>'; w.innerHTML = b; }
    this.geo = null; this.skKey = '';
  }
  Handy.prototype.zeige = function (neu) {
    if (neu === this.akt) return;
    var A = this.akt && this.scr[this.akt], B = this.scr[neu]; if (!B) return;
    var vor = ORD.indexOf(neu) > ORD.indexOf(this.akt);
    B.style.transition = 'none'; B.className = B.className.replace(/\b(an|links|rechts)\b/g, '').trim() + (this.akt ? (vor ? ' rechts' : ' links') : '');
    void B.offsetWidth; B.style.transition = ''; B.classList.remove('links', 'rechts'); B.classList.add('an');
    if (A) { A.classList.remove('an'); A.classList.add(vor ? 'links' : 'rechts'); }
    this.akt = neu; this.root.setAttribute('data-screen', neu);
    var t = TAB[neu]; qa(this.root, '.as-tabs button').forEach(function (b, i) { b.classList.toggle('an', i === t); });
    this.root.classList.toggle('kunde', neu === 'signatur');
    var b2 = q(B, '.as-body'); if (b2 && this.probe) b2.scrollTop = 0;
  };
  Handy.prototype.setz = function (k, v, fn) { if (this.alt[k] !== v) { this.alt[k] = v; fn(v); } };
  Handy.prototype.render = function (S) {
    var self = this, r = this.r, root = this.root;
    this.zeige(S.screen);
    this.setz('uhr', S.uhr, function (v) { if (r.uhr) r.uhr.textContent = v; });
    if (r.gruss) this.setz('gruss', S.gruss, function (v) { r.gruss.textContent = v; });
    /* Zahlen (auch Tablet nutzt dieselben data-z) */
    zahlen(root, S, this.alt);
    /* Push */
    this.setz('push', !!S.push, function (v) { root.classList.toggle('push-an', v); });
    root.classList.toggle('neu-anfrage', S.anfr > 0);
    /* Anfrage: Elemente nach und nach */
    if (S.screen === 'anfrage' || S.screen === 'start') {
      var n = Math.round(S.anfP * 9);
      this.setz('anfN', n, function (v) { qa(root, '[data-s="anfrage"] [data-a]').forEach(function (e) { e.classList.toggle('da', +e.getAttribute('data-a') < v); }); });
    }
    /* Kalender */
    this.setz('slot', S.slot, function (v) { qa(root, '.as-slot[data-slot]').forEach(function (e) { e.classList.toggle('an', e.getAttribute('data-slot') === v); }); root.classList.toggle('slot-an', !!v); });
    this.setz('route', !!S.route, function (v) { root.classList.toggle('route-an', v); });
    this.setz('sms', !!S.sms, function (v) { root.classList.toggle('sms-an', v); });
    /* Aufmaß */
    var key = S.L + '|' + S.B;
    if (key !== this.skKey) { this.skKey = key; this.geo = skizze(S.L, S.B); r.sk.innerHTML = this.geo.svg; this.wandP = q(r.sk, '.sk-wand'); this.alt.zeichnen = -1; }
    this.setz('zeichnen', Math.round(S.zeichnen * 1000) / 1000, function (z) {
      self.wandP.style.strokeDashoffset = (1 - z).toFixed(4);
      var g = self.geo, done = z >= 0.999, seite = z * g.per;
      r.sk.classList.toggle('m1', seite >= g.w); r.sk.classList.toggle('m2', seite >= g.w + g.h);
      r.sk.classList.toggle('fertig', done);
      if (self.stift) {
        var p = punktAuf(g, z);
        self.stift.style.left = p[0] + '%'; self.stift.style.top = (p[1] / 76 * 100) + '%';
        self.stift.classList.toggle('an', !!S.stift && z > 0.002 && !done);
      }
    });
    var R = rechne(S);
    var m = S.mengen;
    this.setz('mengen', Math.round(m * 200) / 200 + key + S.H + S.format + S.art, function () {
      var e = glatt(m);
      r.mL.textContent = de(S.L); r.mB.textContent = de(S.B); r.mH.textContent = de(S.H);
      r.eBoden.textContent = de(R.boden * e); r.eWand.textContent = de(R.wand * e); r.eAbz.textContent = de(R.abz * e);
      r.vers.textContent = Math.round(R.v * 100) + ' %';
      r.versText.textContent = (R.gross ? 'Großformat · ' : '') + R.art + (R.gross && S.art === 'drittel' ? ' (max. ⅓ Versatz)' : '');
      r.stB.textContent = R.stB + ' Stk'; r.stW.textContent = R.stW + ' Stk';
      r.kl.textContent = R.kleber + ' kg · ' + R.sack + ' Sack'; r.fu.textContent = R.fuge + ' kg';
      root.classList.toggle('mengen-an', m > 0.98);
      if (r.cSack) { r.cSack.textContent = R.sack; r.cFuge.textContent = R.fuge; }
    });
    this.setz('fmt', S.format + S.art, function () {
      qa(root, '.as-seg[data-g="format"] button').forEach(function (b) { b.classList.toggle('an', b.getAttribute('data-v') === S.format); });
      qa(root, '.as-seg[data-g="art"] button').forEach(function (b) { b.classList.toggle('an', b.getAttribute('data-v') === S.art); });
    });
    if (this.mini) { this.rolle(S); this.fingerSetz(S); return; }
    /* Fotos */
    this.setz('fotos', S.fotos, function (v) { qa(root, '.as-galerie .neu').forEach(function (f) { f.classList.toggle('da', +f.getAttribute('data-f') < v); }); });
    this.setz('blitz', !!S.blitz, function (v) { root.classList.toggle('blitz', v); });
    this.setz('notiz', Math.round(S.notiz * 80), function (v) {
      var t = 'Estrich trocken. Rinne an der Außenwand, Gefälle 2 % in eine Richtung. Heizkörper bleibt.';
      r.notiz.textContent = t.slice(0, Math.round(t.length * v / 80)); r.notiz.classList.toggle('tippt', v > 0 && v < 80);
    });
    this.setz('sprache', Math.round(S.sprache * 26), function (v) { qa(r.welle, 'i').forEach(function (b, i) { b.classList.toggle('an', i < v); }); root.classList.toggle('sprache-an', v > 0); });
    /* Angebot */
    this.setz('angKey', key + S.H + S.format + S.art, function () {
      var P = positionen(R), netto = 0;
      r.pos.innerHTML = P.map(function (p, i) {
        var bet = p[1] * p[3]; netto += bet;
        return '<div data-i="' + i + '"><span>' + (i + 1) + '</span><p>' + p[0] + '<small>' + de(p[1], p[2] === 'Stk' || p[2] === 'lfm' ? 0 : 2) + ' ' + p[2] + ' × ' + de(p[3]) + ' €</small></p><b>' + de(bet) + ' €</b></div>';
      }).join('');
      var mw = netto * 0.19;
      r.netto.textContent = de(netto) + ' €'; r.mwst.textContent = de(mw) + ' €'; r.brutto.textContent = de(netto + mw) + ' €';
      r.brutto2.textContent = de(netto + mw) + ' €';
      self.brutto = de(netto + mw) + ' €';
      self.alt.angN = -1;
    });
    this.setz('angN', Math.round(S.angP * 7), function (v) { qa(r.pos, '[data-i]').forEach(function (e, i) { e.classList.toggle('da', i < v); }); root.classList.toggle('summe-an', v >= 7); });
    this.setz('gesendet', !!S.gesendet, function (v) { root.classList.toggle('gesendet', v); });
    if (!S.eigenSig) this.setz('sig', Math.round(S.sig * 400) / 400, function (v) { var p = q(root, '.as-sig'); p.style.strokeDashoffset = (1 - v).toFixed(4); root.classList.toggle('sig-da', v > 0.98); });
    this.setz('erteilt', !!S.erteilt, function (v) { root.classList.toggle('erteilt', v); });
    /* Zeit */
    this.setz('zeit', S.zeitTxt ? S.zeitTxt.join('|') : '', function () { if (S.zeitTxt) { r.t0.textContent = S.zeitTxt[0]; r.t1.textContent = S.zeitTxt[1]; } });
    this.setz('laeuft', (S.laeuft || [1, 1, 0]).join(''), function () {
      qa(root, '.as-mann').forEach(function (e, i) { var l = (S.laeuft || [1, 1, 0])[i]; e.classList.toggle('aus', !l); q(e, '.as-ss').textContent = l ? 'Stopp' : 'Start'; });
    });
    this.setz('check', S.check, function (v) { qa(root, '.as-check button').forEach(function (b, i) { var an = typeof v === 'number' ? i < v : !!v[i]; b.classList.toggle('an', an); b.setAttribute('aria-pressed', an); }); });
    this.setz('bericht', !!S.bericht, function (v) { root.classList.toggle('bericht-an', v); });
    /* Fertig */
    this.setz('rechnung', !!S.rechnung, function (v) { root.classList.toggle('rechnung-an', v); r.rText.textContent = v ? 'per E-Mail gesendet · 15:41' : 'aus dem Angebot · bereit'; });
    this.setz('bewertung', !!S.bewertung, function (v) { root.classList.toggle('bewertung-an', v); r.bText.textContent = v ? 'geplant: Sa 19.12., 10:00 · automatisch' : 'nach 24 h automatisch'; });
    this.rolle(S); this.fingerSetz(S);
  };
  /* Inhalt scrollt (Tour) */
  Handy.prototype.rolle = function (S) {
    if (this.probe) return;
    var s = this.scr[S.screen], ro = s && q(s, '.as-rolle'), bo = s && q(s, '.as-body'); if (!ro) return;
    var max = Math.max(0, ro.scrollHeight - bo.clientHeight + 8), ty = Math.round((S.scroll || 0) * max);
    if (this.alt['ty' + S.screen] !== ty) { this.alt['ty' + S.screen] = ty; ro.style.transform = ty ? 'translate3d(0,' + (-ty) + 'px,0)' : ''; }
    this.ty = ty;
  };
  function offs(el, root) {
    var x = 0, y = 0, n = el;
    while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return [x, y];
  }
  Handy.prototype.fingerSetz = function (S) {
    var f = this.finger, F = S.finger; if (!f) return;
    if (!F) { if (this.alt.fk !== '') { this.alt.fk = ''; f.classList.remove('an', 'tap'); } return; }
    var el, x, y, scr = this.scr[S.screen];
    if (F.sig) {
      var p = q(this.root, '.as-sig'), pad = q(this.root, '.as-pad svg'); if (!p || !pad) return;
      var len = p.getTotalLength(), pt = p.getPointAtLength(len * klemm(S.sig, 0, 1)), o = offs(pad, this.root);
      x = o[0] + pt.x / 300 * pad.clientWidth; y = o[1] - this.ty + pt.y / 120 * pad.clientHeight;
    } else {
      el = q(scr || this.root, F.el) || q(this.root, F.el); if (!el) return;
      var oo = offs(el, this.root), inRolle = !!(el.closest && el.closest('.as-rolle'));
      x = oo[0] + el.offsetWidth * (F.fx == null ? 0.5 : F.fx); y = oo[1] + el.offsetHeight * (F.fy == null ? 0.5 : F.fy) - (inRolle ? this.ty : 0);
    }
    f.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    f.classList.add('an');
    var tk = F.tap ? 'tap' : 'zeigt'; if (this.alt.fk !== tk) { this.alt.fk = tk; f.classList.remove('tap'); if (F.tap) { void f.offsetWidth; f.classList.add('tap'); } }
  };

  function zahlen(root, S, alt) {
    var Z = { anfr: String(Math.round((S.anfr || 0) * (S.kpiP == null ? 1 : S.kpiP))), term: String(Math.round(2 * (S.kpiP == null ? 1 : S.kpiP))), ang: String(Math.round((S.ang || 3) * (S.kpiP == null ? 1 : S.kpiP))), std: de((S.std || 31.5) * (S.kpiP == null ? 1 : S.kpiP), 1) };
    for (var k in Z) if (alt['z' + k] !== Z[k]) { alt['z' + k] = Z[k]; qa(root, '[data-z="' + k + '"]').forEach(function (e) { e.textContent = Z[k]; }); }
  }

  /* ---------- Tablet ---------- */
  function Tablet(root) {
    root.classList.add('at-app'); root.innerHTML = tabletHTML();
    this.root = root; this.alt = {}; var self = this; this.r = {};
    qa(root, '[data-r]').forEach(function (e) { self.r[e.getAttribute('data-r')] = e; });
    this.cols = qa(root, '.at-col .at-karten');
    this.karte = D.createElement('div'); this.karte.className = 'at-karte kraemer';
    this.karte.innerHTML = '<b>Bad OG</b><small>Bad 7 m² · Dusche</small><i class="at-ping"></i>';
    this.vor = {}; qa(root, '[data-v]').forEach(function (e) { self.vor[e.getAttribute('data-v')] = e; });
    this.verl = qa(root, '.at-verlauf li');
  }
  Tablet.prototype.render = function (S, brutto) {
    var self = this, r = this.r;
    zahlen(this.root, S, this.alt);
    if (this.alt.stage !== S.stage) {
      var vorher = this.karte.parentNode ? this.karte.getBoundingClientRect() : null;
      if (S.stage > 0) { var c = this.cols[S.stage - 1]; c.insertBefore(this.karte, c.firstChild); } else if (this.karte.parentNode) this.karte.parentNode.removeChild(this.karte);
      if (vorher && this.karte.parentNode && !RM) {
        var nach = this.karte.getBoundingClientRect(), sx = vorher.width / (nach.width || 1);
        this.karte.animate([{ transform: 'translate(' + (vorher.left - nach.left) / (this.root.getBoundingClientRect().width / this.root.offsetWidth || 1) + 'px,' + (vorher.top - nach.top) / (this.root.getBoundingClientRect().width / this.root.offsetWidth || 1) + 'px)' }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
        void sx;
      }
      if (this.alt.stage != null && S.stage > this.alt.stage) this.puls();
      this.alt.stage = S.stage;
    }
    this.verl.forEach(function (li, i) { var an = i < S.verlauf; if (li._an !== an) { li._an = an; li.classList.toggle('an', an); } });
    if (this.alt.vorschau !== S.vorschau) {
      for (var k in this.vor) this.vor[k].classList.toggle('an', k === S.vorschau);
      if (S.vorschau === 'skizze' || S.vorschau === 'angebot') {
        var g = skizze(S.L, S.B); r.tsk.innerHTML = g.svg; var R = rechne(S); r.tsum.textContent = de(R.ges) + ' m² Fliesen · Verschnitt ' + Math.round(R.v * 100) + ' %';
      }
      this.alt.vorschau = S.vorschau;
    }
    if (brutto && this.alt.brutto !== brutto) { this.alt.brutto = brutto; r.tbrutto.textContent = brutto + ' (Beispiel)'; }
    this.root.classList.toggle('sig-da', !!S.erteilt);
    if (r.heute) r.heute.style.setProperty('--h', (0.2 + 0.75 * (S.tagP || 0)).toFixed(3));
  };
  Tablet.prototype.puls = function () {
    var s = this.r.sync; s.classList.remove('puls'); void s.offsetWidth; s.classList.add('puls');
    var k = this.karte.querySelector('.at-ping'); k.classList.remove('an'); void k.offsetWidth; k.classList.add('an');
  };

  /* ---------- Grundzustand ---------- */
  function basis() {
    return {
      screen: 'start', uhr: '07:40', gruss: 'Guten Morgen, Martin', push: 0, kpiP: 1, anfr: 0, ang: 3, std: 31.5,
      anfP: 0, slot: '', route: 0, sms: 0,
      L: 3.20, B: 2.45, H: 2.50, format: '60x120', art: 'drittel', zeichnen: 0, mengen: 0, stift: 1, scroll: 0,
      fotos: 0, blitz: 0, notiz: 0, sprache: 0,
      angP: 0, gesendet: 0, sig: 0, erteilt: 0,
      zeitTxt: ['0:00', '0:00'], laeuft: [1, 1, 0], check: 0, bericht: 0,
      rechnung: 0, bewertung: 0, stage: 0, verlauf: 0, vorschau: 'leer', finger: null, tagP: 0
    };
  }
  function hm(min) { var h = Math.floor(min / 60), m = Math.floor(min % 60); return h + ':' + (m < 10 ? '0' : '') + m; }
  function uhrzeit(min) { var h = Math.floor(min / 60), m = Math.floor(min % 60); return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }

  /* ---------- Tour: Zustand je Schritt (rein aus Scrollposition → vor/zurück) ---------- */
  function tourZustand(step, sub) {
    var S = basis();
    if (step >= 1) { S.anfr = 1; S.anfP = 1; S.stage = 1; S.verlauf = 1; S.vorschau = 'fotos3'; }
    if (step >= 2) { S.anfr = 0; S.slot = '16:30'; S.route = 1; S.sms = 1; S.stage = 2; S.verlauf = 2; S.vorschau = 'termin'; }
    if (step >= 3) { S.zeichnen = 1; S.mengen = 1; S.verlauf = 3; S.vorschau = 'skizze'; }
    if (step >= 4) { S.fotos = 2; S.notiz = 1; S.sprache = 1; S.verlauf = 4; S.vorschau = 'fotos4'; }
    if (step >= 5) { S.angP = 1; S.gesendet = 1; S.sig = 1; S.erteilt = 1; S.stage = 4; S.verlauf = 6; S.vorschau = 'angebot'; }
    if (step >= 6) { S.check = 4; S.bericht = 1; S.verlauf = 7; S.vorschau = 'stunden'; S.tagP = 1; }
    switch (step) {
      case 0:
        S.kpiP = glatt(seg(sub, 0.05, 0.55)); S.uhr = '07:40';
        break;
      case 1:
        S.uhr = '18:42'; S.gruss = 'Guten Abend, Martin';
        if (sub < 0.34) {
          S.screen = 'start'; S.anfP = 0; S.push = sub > 0.06 ? 1 : 0; S.stage = sub > 0.06 ? 1 : 0; S.verlauf = sub > 0.06 ? 1 : 0; S.vorschau = sub > 0.06 ? 'fotos3' : 'leer';
          if (sub > 0.2) S.finger = { el: '.as-push', tap: sub > 0.28 };
        } else {
          S.screen = 'anfrage'; S.anfP = seg(sub, 0.38, 0.78); S.scroll = glatt(seg(sub, 0.55, 0.82));
          if (sub > 0.84) S.finger = { el: '[data-akt="zum-termin"]', tap: sub > 0.92 };
        }
        break;
      case 2:
        S.screen = 'kalender'; S.uhr = '18:49'; S.anfr = 1;
        S.slot = sub > 0.28 ? '16:30' : ''; S.route = sub > 0.36 ? 1 : 0; S.sms = sub > 0.62 ? 1 : 0;
        S.stage = sub > 0.62 ? 2 : 1; S.verlauf = sub > 0.62 ? 2 : 1; S.vorschau = sub > 0.62 ? 'termin' : 'fotos3'; S.anfr = sub > 0.62 ? 0 : 1;
        S.scroll = glatt(seg(sub, 0.4, 0.6)) * 0.55 + glatt(seg(sub, 0.66, 0.85)) * 0.45;
        if (sub > 0.14 && sub < 0.36) S.finger = { el: '[data-slot="16:30"]', tap: sub > 0.24 };
        else if (sub > 0.48 && sub < 0.66) S.finger = { el: '[data-akt="bestaetigen"]', tap: sub > 0.56 };
        break;
      case 3:
        S.screen = 'aufmass'; S.uhr = uhrzeit(16 * 60 + 52 + sub * 13);
        S.zeichnen = glatt(seg(sub, 0.03, 0.48)); S.mengen = seg(sub, 0.5, 0.68);
        S.scroll = glatt(seg(sub, 0.62, 0.92)); S.verlauf = sub > 0.7 ? 3 : 2; S.vorschau = sub > 0.7 ? 'skizze' : 'termin';
        if (sub > 0.92) S.finger = { el: '[data-akt="aufmass-ok"]', tap: sub > 0.96 };
        break;
      case 4:
        S.screen = 'fotos'; S.uhr = uhrzeit(17 * 60 + 6 + sub * 8);
        S.fotos = sub > 0.2 ? (sub > 0.38 ? 2 : 1) : 0; S.blitz = (sub > 0.16 && sub < 0.21) || (sub > 0.34 && sub < 0.39);
        S.notiz = seg(sub, 0.44, 0.66); S.scroll = glatt(seg(sub, 0.42, 0.62)) * 0.6 + glatt(seg(sub, 0.7, 0.9)) * 0.4; S.sprache = seg(sub, 0.74, 0.92);
        S.verlauf = sub > 0.5 ? 4 : 3; S.vorschau = sub > 0.5 ? 'fotos4' : 'skizze';
        if (sub > 0.08 && sub < 0.4) S.finger = { el: '.as-ausl', tap: (sub > 0.14 && sub < 0.2) || (sub > 0.32) };
        else if (sub > 0.68 && sub < 0.76) S.finger = { el: '.as-play', tap: sub > 0.72 };
        break;
      case 5:
        S.uhr = sub < 0.5 ? '08:11' : '19:04';
        if (sub < 0.5) {
          S.screen = 'angebot'; S.angP = seg(sub, 0.02, 0.3); S.scroll = glatt(seg(sub, 0.16, 0.34)); S.gesendet = sub > 0.42 ? 1 : 0;
          S.sig = 0; S.erteilt = 0; S.stage = sub > 0.42 ? 3 : 2; S.verlauf = sub > 0.42 ? 5 : 4; S.vorschau = sub > 0.42 ? 'angebot' : 'fotos4';
          if (sub > 0.34) S.finger = { el: '[data-akt="senden"]', tap: sub > 0.4 };
        } else {
          S.screen = 'signatur'; S.sig = glatt(seg(sub, 0.56, 0.82)); S.erteilt = sub > 0.9 ? 1 : 0;
          S.stage = S.erteilt ? 4 : 3; S.verlauf = S.erteilt ? 6 : 5; S.scroll = glatt(seg(sub, 0.5, 0.56));
          if (sub > 0.55 && sub < 0.83) S.finger = { sig: 1, tap: false };
          else if (sub > 0.84) S.finger = { el: '[data-akt="beauftragen"]', tap: sub > 0.88 };
        }
        break;
      case 6:
        S.screen = 'zeit'; var min = 7 * 60 + 2 + sub * 508; S.uhr = uhrzeit(min);
        S.zeitTxt = [hm(min - (7 * 60 + 2)), hm(Math.max(0, min - (7 * 60 + 5)))];
        S.check = Math.floor(seg(sub, 0.28, 0.72) * 4.0001); S.bericht = sub > 0.78 ? 1 : 0;
        S.scroll = glatt(seg(sub, 0.22, 0.5)) * 0.5 + glatt(seg(sub, 0.6, 0.85)) * 0.5; S.tagP = sub;
        S.std = 8.5 + 2 * (min - 7 * 60) / 60;
        if (sub > 0.28 && sub < 0.74) { var ci = Math.min(3, Math.floor(seg(sub, 0.28, 0.72) * 4)); S.finger = { el: '.as-check [data-c="' + ci + '"]', fx: 0.08, tap: (seg(sub, 0.28, 0.72) * 4) % 1 > 0.55 }; }
        break;
      case 7:
        S.screen = 'fertig'; S.uhr = '15:40'; S.stage = 5; S.verlauf = 8; S.vorschau = 'nachher'; S.std = 148.5;
        S.zeitTxt = ['8:28', '8:25']; S.check = 4;
        S.rechnung = sub > 0.32 ? 1 : 0; S.bewertung = sub > 0.62 ? 1 : 0; S.scroll = glatt(seg(sub, 0.66, 0.85));
        if (sub > 0.16 && sub < 0.36) S.finger = { el: '[data-akt="rechnung"]', tap: sub > 0.26 };
        else if (sub > 0.44 && sub < 0.66) S.finger = { el: '[data-akt="bewertung"]', tap: sub > 0.56 };
        break;
    }
    return S;
  }

  /* Werte am Rand (Mono) */
  var BASIS_T = Date.UTC(2026, 10, 30, 18, 42);
  var ZEITEN = [null, [0, 0], [7, 9], [3 * 1440 - 18 * 60 - 42 + 16 * 60 + 52, 3 * 1440 - 18 * 60 - 42 + 17 * 60 + 12], [3 * 1440 - 18 * 60 - 42 + 17 * 60 + 6, 3 * 1440 - 18 * 60 - 42 + 17 * 60 + 14], [4 * 1440 - 18 * 60 - 42 + 8 * 60 + 11, 4 * 1440 - 18 * 60 - 42 + 19 * 60 + 5], [14 * 1440 - 18 * 60 - 42 + 7 * 60 + 2, 14 * 1440 - 18 * 60 - 42 + 15 * 60 + 30], [18 * 1440 - 18 * 60 - 42 + 15 * 60 + 40, 18 * 1440 - 18 * 60 - 42 + 15 * 60 + 40]];
  function seitAnfrage(step, sub) {
    var z = ZEITEN[step]; if (!z) return '—'; if (step === 1 && sub < 0.06) return '—';
    var m = Math.round(z[0] + (z[1] - z[0]) * sub), t = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mi = m % 60;
    return (t ? t + ' T ' : '') + (t || h ? h + ' h ' : '') + mi + ' min';
    void BASIS_T;
  }
  var WOERTER = ['ÜBERSICHT', 'ANFRAGE', 'TERMIN', 'AUFMASS', 'FOTOS', 'ANGEBOT', 'BAUSTELLE', 'FERTIG'];
  var GERAET = ['Handy · Büro', 'Website → Handy', 'Handy → Kundin', 'Handy → Büro', 'Handy → Büro', 'Büro → Kundin', 'Team → Büro', 'Büro → Kundin'];

  /* =====================================================================
     TOUR (scroll-geführt)
     ===================================================================== */
  function tour() {
    var sek = D.getElementById('app'), strecke = D.getElementById('appv-strecke'); if (!sek || !strecke) return;
    var handy = new Handy(q(strecke, '.appv-handy .as-schirm')), tablet = new Tablet(q(strecke, '.appv-tablet .at-schirm'));
    [handy.root, tablet.root].forEach(function (r) { if (r) r.addEventListener('click', function (e) { var b = e.target.closest('button,[data-geh]'); if (!b || !window.__appvProbe) return; e.preventDefault(); window.__appvProbe(b.getAttribute('data-geh'), b); }); });
    var kaps = qa(strecke, '.appv-kap'), woerter = q(strecke, '.appv-rw'), schiene = qa(strecke, '.appv-schiene li'), werte = q(strecke, '.appv-werte');
    var mini = q(strecke, '.appv-buero-mini'), geraete = q(strecke, '.appv-geraete'), funk = q(strecke, '.appv-funk');
    var N = 8, ziel = 0, akt = 0, sichtbar = false, laeuft = false, idx = -1, lastStep = -1, mx = 0, my = 0, tx = 0, ty = 0;
    woerter.innerHTML = WOERTER.map(function (w) { return '<span>' + w + '</span>'; }).join('');
    var ws = qa(woerter, 'span');
    var wv = {}; qa(werte, '[data-w]').forEach(function (e) { wv[e.getAttribute('data-w')] = e; });
    function messen() {
      var r = strecke.getBoundingClientRect(), h = strecke.offsetHeight - innerHeight;
      ziel = h > 0 ? klemm(-r.top / h, 0, 1) : 0;
    }
    var aLetzt = 0;
    function bild(t) {
      if (!sichtbar) { laeuft = false; aLetzt = 0; return; }
      messen();
      var dt = aLetzt && t ? Math.min(0.1, Math.max(0.001, (t - aLetzt) / 1000)) : 0.0167; aLetzt = t || 0;
      var ka = 1 - Math.exp(-dt / 0.096), km = 1 - Math.exp(-dt / 0.2); /* 20N-FIX2: zeitbasiert (bei 60 Hz wie vorher 0,16 / 0,08 pro Bild) */
      var d = ziel - akt; akt = Math.abs(d) < 0.0002 ? ziel : akt + d * (RM ? 1 : ka);
      tx += (mx - tx) * km; ty += (my - ty) * km; if (Math.abs(mx - tx) < 0.001) tx = mx; if (Math.abs(my - ty) < 0.001) ty = my;
      var c = klemm(akt * N, 0, N - 0.0001), step = Math.floor(c), sub = c - step;
      var S = tourZustand(step, sub);
      handy.render(S); tablet.render(S, handy.brutto);
      if (step !== idx) {
        idx = step;
        kaps.forEach(function (k, j) { k.classList.toggle('an', j === step); k.setAttribute('aria-hidden', j === step ? 'false' : 'true'); });
        ws.forEach(function (w, j) { w.classList.toggle('an', j === step); w.classList.toggle('weg', j < step); });
        wv.schritt.textContent = (step < 9 ? '0' : '') + (step + 1) + ' / 08';
        wv.geraet.textContent = GERAET[step];
        if (lastStep !== -1 && step > lastStep) { funk.classList.remove('puls'); void funk.offsetWidth; funk.classList.add('puls'); }
        lastStep = step;
        if (mini) qa(mini, 'li').forEach(function (l, j) { l.classList.toggle('an', j === S.stage - 1); });
      }
      if (mini && mini._st !== S.stage) { mini._st = S.stage; qa(mini, 'li').forEach(function (l, j) { l.classList.toggle('an', j === S.stage - 1); l.classList.toggle('war', j < S.stage - 1); }); }
      schiene.forEach(function (l, j) { var f = klemm(c - j, 0, 1).toFixed(3); if (l._f !== f) { l._f = f; l.style.setProperty('--f', f); l.classList.toggle('an', j === step); } });
      var sa = seitAnfrage(step, sub); if (wv.seit._v !== sa) { wv.seit._v = sa; wv.seit.textContent = sa; }
      /* sanfte Neigung der Geräte mit der Maus + Schritt */
      var rot = 'rotateY(' + (-10 + tx * 6).toFixed(2) + 'deg) rotateX(' + (4 - ty * 4).toFixed(2) + 'deg)';
      if (geraete._rot !== rot) { geraete._rot = rot; geraete.style.setProperty('--rot', rot); }
      if (akt !== ziel || tx !== mx || ty !== my) requestAnimationFrame(bild); else { laeuft = false; aLetzt = 0; }
    }
    function an() { if (sichtbar && !laeuft) { laeuft = true; requestAnimationFrame(bild); } }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { sichtbar = e[0].isIntersecting; sek.classList.toggle('appv-sicht', sichtbar); an(); }, { rootMargin: '100px 0px' }).observe(strecke);
    else { sichtbar = true; }
    addEventListener('scroll', an, { passive: true });
    addEventListener('resize', function () { handy.alt = {}; handy.skKey = ''; an(); });
    strecke.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; an(); }, { passive: true });
    schiene.forEach(function (l, j) {
      q(l, 'button').addEventListener('click', function () {
        var top = strecke.getBoundingClientRect().top + scrollY + (strecke.offsetHeight - innerHeight) * ((j + 0.5) / N);
        if (window.__lenis && window.__lenis.scrollTo) window.__lenis.scrollTo(top, { duration: 1.2 }); else scrollTo({ top: top, behavior: RM ? 'auto' : 'smooth' });
      });
    });
    var nfc = q(sek, '[data-appv-nfc]');
    if (nfc) nfc.addEventListener('click', function (e) {
      var z = D.getElementById('nfc') || D.querySelector('[id*="nfc"]') || D.getElementById('leistungen');
      if (!z) return; e.preventDefault();
      var top = z.getBoundingClientRect().top + scrollY;
      if (z.id === 'leistungen') top += (z.offsetHeight - innerHeight) * 0.9;
      if (window.__lenis && window.__lenis.scrollTo) window.__lenis.scrollTo(top, { duration: 1.4 }); else scrollTo({ top: top, behavior: 'smooth' });
    });
    messen(); akt = ziel; sichtbar = true; bild(); sichtbar = false;
    if (!('IntersectionObserver' in window)) sichtbar = true;
  }

  /* =====================================================================
     SELBST AUSPROBIEREN (Dialog, gleiche Komponente, frei klickbar)
     ===================================================================== */
  function probe() {
    var dlg = D.getElementById('appv-probe'); if (!dlg) return;
    D.body.appendChild(dlg);   /* außerhalb von Transformationen der Seite → echtes Vollbild */
    var auf = qa(D, '[data-appv-probe]'), zu = q(dlg, '.appv-zu'), handy, tablet, S, timer = 0, t0 = 0, basisSek = [7642, 7462, 0], laufSek = [0, 0, 0], zuletzt = null;
    function bau() {
      handy = new Handy(q(dlg, '.appv-handy .as-schirm'), { probe: true }); tablet = new Tablet(q(dlg, '.appv-tablet .at-schirm'));
      handy.root.addEventListener('click', klick); bindPad(); neu();
    }
    function neu() {
      S = basis(); S.uhr = '18:42'; S.gruss = 'Guten Abend, Martin'; S.zeichnen = 1; S.mengen = 1; S.angP = 1; S.stift = 0;
      S.zeitTxt = ['2:07:22', '2:04:22']; S.check = [0, 0, 0, 0]; S.anfr = 0; S.eigenSig = 0;
      laufSek = [basisSek[0], basisSek[1], 5400]; S.laeuft = [1, 1, 0];
      leereSig(); handy.alt = {}; handy.skKey = ''; tablet.alt = {}; zeig();
      clearTimeout(neu._p); neu._p = setTimeout(function () { if (S.screen === 'start' && S.stage === 0) { S.push = 1; S.anfr = 1; S.stage = 1; S.verlauf = 1; S.vorschau = 'fotos3'; zeig(); } }, 1400);
    }
    function zeig() { S.anfP = S.stage >= 1 ? 1 : 0; handy.render(S); tablet.render(S, handy.brutto); }
    function geh(s) { S.screen = s; S.push = 0; if (s === 'anfrage' && S.stage < 1) { S.stage = 1; S.verlauf = 1; S.anfr = 1; S.vorschau = 'fotos3'; } if (s === 'anfrage') S.anfr = S.stage <= 1 ? 1 : 0; zeig(); }
    function blitz() { S.blitz = 1; zeig(); setTimeout(function () { S.blitz = 0; zeig(); }, 160); }
    function klick(e) {
      var b = e.target.closest('button, [data-geh]'); if (!b || !handy.root.contains(b)) return;
      var a = b.getAttribute('data-akt'), g = b.getAttribute('data-geh');
      if (b.hasAttribute('data-slot')) { S.slot = b.getAttribute('data-slot'); S.route = 1; zeig(); return; }
      if (b.classList.contains('as-st')) { var m = b.getAttribute('data-m'), d = +b.getAttribute('data-d') * 0.05, lim = { L: [1.5, 5], B: [1.2, 4], H: [2.2, 3] }[m]; S[m] = Math.round(klemm(S[m] + d, lim[0], lim[1]) * 100) / 100; zeig(); return; }
      var sg = b.closest('.as-seg'); if (sg) { S[sg.getAttribute('data-g')] = b.getAttribute('data-v'); zeig(); return; }
      if (b.hasAttribute('data-c')) { var i = +b.getAttribute('data-c'); S.check = S.check.slice(); S.check[i] = !S.check[i]; S.bericht = 1; zeig(); return; }
      if (a === 'zum-termin') return geh('kalender');
      if (a === 'bestaetigen') { if (!S.slot) { S.slot = '16:30'; S.route = 1; } S.sms = 1; S.stage = Math.max(S.stage, 2); S.verlauf = Math.max(S.verlauf, 2); S.anfr = 0; S.vorschau = 'termin'; zeig(); return; }
      if (a === 'aufmass-ok') { S.verlauf = Math.max(S.verlauf, 3); S.vorschau = 'skizze'; S.stage = Math.max(S.stage, 2); tablet.alt.vorschau = ''; return geh('fotos'); }
      if (a === 'foto') { if (S.fotos < 2) S.fotos++; blitz(); if (S.fotos >= 1) { S.verlauf = Math.max(S.verlauf, 4); S.vorschau = 'fotos4'; } return; }
      if (a === 'play') { var v = 0; clearInterval(klick._w); klick._w = setInterval(function () { v += 0.07; S.sprache = klemm(v, 0, 1); zeig(); if (v >= 1) clearInterval(klick._w); }, 110); return; }
      if (a === 'zum-angebot') return geh('angebot');
      if (a === 'senden') { S.gesendet = 1; S.stage = Math.max(S.stage, 3); S.verlauf = Math.max(S.verlauf, 5); S.vorschau = 'angebot'; S.ang = 4; zeig(); setTimeout(function () { geh('signatur'); }, 900); return; }
      if (a === 'sig-leer') { leereSig(); return; }
      if (a === 'beauftragen') { if (!S.sigOk) { var p = q(handy.root, '.as-pad'); p.classList.remove('wackel'); void p.offsetWidth; p.classList.add('wackel'); return; } S.erteilt = 1; S.stage = 4; S.verlauf = Math.max(S.verlauf, 6); S.ang = 3; zeig(); setTimeout(function () { geh('zeit'); }, 1300); return; }
      if (a === 'ss') { var pi = +b.getAttribute('data-p'); S.laeuft = S.laeuft.slice(); S.laeuft[pi] = S.laeuft[pi] ? 0 : 1; S.verlauf = Math.max(S.verlauf, 7); S.vorschau = 'stunden'; zeig(); return; }
      if (a === 'abschluss') { S.stage = 5; S.verlauf = 8; S.vorschau = 'nachher'; return geh('fertig'); }
      if (a === 'rechnung') { S.rechnung = 1; zeig(); return; }
      if (a === 'bewertung') { S.bewertung = 1; zeig(); return; }
      if (a === 'neu') return neu();
      if (g) { if (g === 'zeit') { S.verlauf = Math.max(S.verlauf, S.stage >= 4 ? 7 : S.verlauf); } geh(g); }
    }
    /* echte Unterschrift mit Finger/Maus */
    var pad, gEigen, zug = null, punkte = 0;
    function leereSig() { if (!gEigen) return; gEigen.innerHTML = ''; punkte = 0; S.sigOk = 0; S.eigenSig = 1; S.sig = 0; var p = q(handy.root, '.as-sig'); p.style.strokeDashoffset = '1'; handy.root.classList.remove('sig-da'); }
    function bindPad() {
      pad = q(handy.root, '.as-pad svg'); gEigen = handy.r.sigEigen;
      function pt(e) { var r = pad.getBoundingClientRect(); return [((e.clientX - r.left) / r.width * 300).toFixed(1), ((e.clientY - r.top) / r.height * 120).toFixed(1)]; }
      pad.addEventListener('pointerdown', function (e) { e.preventDefault(); try { pad.setPointerCapture(e.pointerId); } catch (x) {} zug = D.createElementNS('http://www.w3.org/2000/svg', 'polyline'); zug.setAttribute('class', 'as-sig-eigen'); var p = pt(e); zug.setAttribute('points', p.join(',')); gEigen.appendChild(zug); });
      pad.addEventListener('pointermove', function (e) { if (!zug) return; var p = pt(e); zug.setAttribute('points', zug.getAttribute('points') + ' ' + p.join(',')); if (++punkte > 14 && !S.sigOk) { S.sigOk = 1; handy.root.classList.add('sig-da'); } });
      function ende() { zug = null; }
      pad.addEventListener('pointerup', ende); pad.addEventListener('pointercancel', ende);
    }
    function tick() {
      var dt = (performance.now() - t0) / 1000; t0 = performance.now();
      for (var i = 0; i < 3; i++) if (S.laeuft[i]) laufSek[i] += dt;
      function f(s) { s = Math.floor(s); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h + ':' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
      S.zeitTxt = [f(laufSek[0]), f(laufSek[1])];
      var m3 = q(handy.root, '.as-mann[data-p="2"] time'); if (m3) m3.textContent = f(laufSek[2]);
      S.std = 31.5 + (laufSek[0] + laufSek[1] - basisSek[0] - basisSek[1]) / 3600; S.tagP = klemm((laufSek[0] / 3600) / 8.5, 0, 1);
      var d = new Date(); S.uhr = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
      zeig();
    }
    function oeffne(e) {
      zuletzt = e && e.currentTarget; if (!handy) bau(); else neu();
      dlg.hidden = false; D.documentElement.classList.add('appv-offen');
      if (window.__lenis && window.__lenis.stop) window.__lenis.stop();
      requestAnimationFrame(function () { dlg.classList.add('an'); });
      t0 = performance.now(); clearInterval(timer); timer = setInterval(tick, 1000); zu.focus();
    }
    function schliess() {
      dlg.classList.remove('an'); clearInterval(timer); clearInterval(klick._w); clearTimeout(neu._p);
      D.documentElement.classList.remove('appv-offen'); if (window.__lenis && window.__lenis.start) window.__lenis.start();
      setTimeout(function () { dlg.hidden = true; }, RM ? 0 : 300); if (zuletzt) zuletzt.focus();
    }
    auf.forEach(function (b) { b.addEventListener('click', oeffne); });
    zu.addEventListener('click', schliess);
    /* 20N-FIX4: Knöpfe in den Vorführ-Handys (Scroll-Tour, Mini) waren ohne Wirkung → öffnen jetzt die App zum Ausprobieren, direkt auf dem passenden Bildschirm */
    window.__appvProbe = function (bild, von) { oeffne({ currentTarget: von || null }); if (bild) { var g = bild; setTimeout(function () { geh(g); }, 0); } };
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') schliess();
      if (e.key === 'Tab') { var f = qa(dlg, 'button:not([disabled])').filter(function (x) { return x.offsetParent; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && D.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && D.activeElement === z) { a.focus(); e.preventDefault(); } }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) schliess(); });
  }

  /* =====================================================================
     MINI-AUSSCHNITT für Leistungen-Kapitel 04 (krass.js ruft mini(sub) auf)
     ===================================================================== */
  var miniHandy = null;
  function mini(sub) {
    if (!miniHandy) { var el = D.getElementById('appv-mini'); if (!el) return; miniHandy = new Handy(el, { mini: true }); }
    var S = basis(); S.screen = 'aufmass'; S.zeichnen = glatt(seg(sub, 0.02, 0.5)); S.mengen = seg(sub, 0.5, 0.72);
    S.scroll = glatt(seg(sub, 0.7, 0.92)); miniHandy.render(S);
  }

  function start() {
    sprite();
    if (D.getElementById('appv-mini')) mini(0);
    tour(); probe();
  }
  window.AppVorschau = { mini: mini, rechne: rechne };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else start();
})();
