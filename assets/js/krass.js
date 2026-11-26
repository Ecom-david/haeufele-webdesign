/* krass.js – Kino-Ebene von haeufele-webdesign.de (Chat Website 2, 04.11.2026)
   Alles läuft nur, wenn es im Bild ist; Pixeldichte max. 1,5; ohne Bewegung (reduced motion) statisch. */
(function () {
  'use strict';
  var RUHE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, (innerWidth < 760 ? 1.25 : 1.5));
  function klemm(v, a, b) { return v < a ? a : v > b ? b : v; }
  function glatt(t) { t = klemm(t, 0, 1); return t * t * (3 - 2 * t); }
  function sicht(el, cb, rand) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (e) { cb(e[0].isIntersecting); }, { rootMargin: rand || '0px' }).observe(el);
  }
  var $ = function (id) { return document.getElementById(id); };
  function oben(el) { return el.getBoundingClientRect().top + scrollY; }

  /* ---------- Weiches Scrollen (Lenis, MIT) ---------- */
  var lenis = null;
  if (!RUHE && window.Lenis) {
    try { lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, autoRaf: false, anchors: { offset: -10 } }); } catch (e) { lenis = null; }
    if (lenis && window.TAKT) window.TAKT.dauer('lenis', function (t) { lenis.raf(t); });
  }
  window.lenis = window.__lenis = lenis; // global für alle Sprünge (Film, Stempelkarte, App, Studio)

  /* =========================================================
     1 · STAUB: Logo entsteht aus Partikeln (Hero + Marke)
     ========================================================= */
  function Staub(canvas, ziel, opt) {
    opt = opt || {};
    var P = window.LOGO_PUNKTE; if (!P || !canvas || !ziel) return null;
    var cx = canvas.getContext('2d'); if (!cx) return null;
    var n = Math.min(P.p.length / 2, innerWidth < 700 ? 1400 : 2600);
    var T = [], i;
    for (i = 0; i < n; i++) T.push({ px: P.p[i * 2], py: P.p[i * 2 + 1], sx: 0, sy: 0, z: Math.random(), d: 0, ox: 0, oy: 0, vx: (Math.random() - 0.5), vy: Math.random() });
    var W = 0, H = 0, t0 = 0, laeuft = false, sichtbar = false, start = false, fertig = false;
    var pa = 1, stoer = 0, mx = -9999, my = -9999, letzteP = -1;
    function layout() {
      var r = canvas.getBoundingClientRect(), z = ziel.getBoundingClientRect();
      W = r.width; H = r.height; canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      var k = z.width / P.w, lx = z.left - r.left, ly = z.top - r.top;
      T.forEach(function (p) {
        p.tx = lx + p.px * k; p.ty = ly + p.py * k;
        if (!p.sx) { var a = Math.random() * Math.PI * 2, rad = (0.35 + Math.random() * 0.8) * Math.max(W, H); p.sx = W * 0.5 + Math.cos(a) * rad * 0.7; p.sy = H * 0.45 + Math.sin(a) * rad * 0.5; }
        p.d = (p.px / P.w) * 0.55 + Math.random() * 0.25;   /* von links nach rechts – wie der Speed-Schnitt */
      });
      weck();
    }
    function weck() { if (!laeuft && sichtbar && start) { laeuft = true; requestAnimationFrame(bild); } }
    var farben = [0.32, 0.5, 0.7, 0.92].map(function (a) { return 'rgba(243,242,239,' + a + ')'; });
    function bild(jetzt) {
      if (!sichtbar) { laeuft = false; return; }
      var bt = (jetzt - t0) / 1000;
      var p = opt.scrollP ? opt.scrollP() : 0;
      if (!fertig && bt > 1.75) { fertig = true; if (opt.fertig) opt.fertig(); }
      if (fertig) pa = Math.max(0, pa - 0.045);
      stoer *= 0.955;
      var sichtA = Math.max(pa, stoer, klemm(p * 3.2, 0, 1));
      if (opt.logoA) opt.logoA(1 - Math.max(stoer * 0.92, klemm(p * 3.2, 0, 1)));
      cx.setTransform(DPR, 0, 0, DPR, 0, 0); cx.clearRect(0, 0, W, H);
      if (sichtA > 0.003) {
        cx.globalAlpha = sichtA * (1 - klemm((p - 0.25) * 1.6, 0, 1));
        for (var b = 0; b < 4; b++) {
          cx.fillStyle = farben[b];
          for (var j = b; j < T.length; j += 4) {
            var q = T[j], k = klemm((bt - q.d) / 1.05, 0, 1); k = 1 - Math.pow(1 - k, 4);
            var x = q.sx + (q.tx - q.sx) * k, y = q.sy + (q.ty - q.sy) * k;
            if (stoer > 0.01) {
              var dx = x - mx, dy = y - my, dd = dx * dx + dy * dy;
              if (dd < 22000) { var f = (1 - dd / 22000) * 26 * stoer; q.ox += (dx / (Math.sqrt(dd) + 1) * f - q.ox) * 0.2; q.oy += (dy / (Math.sqrt(dd) + 1) * f - q.oy) * 0.2; }
              else { q.ox *= 0.9; q.oy *= 0.9; }
            } else { q.ox *= 0.85; q.oy *= 0.85; }
            if (p > 0) { x += q.vx * p * W * 0.55; y -= (0.25 + q.vy) * p * H * 0.9 * (0.5 + q.z); }
            var s = 0.9 + q.z * 1.3;
            cx.fillRect(x + q.ox, y + q.oy, s, s);
          }
        }
      }
      var ruhig = fertig && pa <= 0 && stoer < 0.004 && Math.abs(p - letzteP) < 0.0001;
      letzteP = p;
      if (ruhig) { laeuft = false; return; }
      requestAnimationFrame(bild);
    }
    // Start erst, wenn der Scroll-Film die Seite freigibt (sonst liefe der Aufbau unsichtbar unter dem letzten Filmbild)
    function los() { if (sichtbar && !start && opt.autostart !== false && !document.documentElement.classList.contains('film-aktiv')) { start = true; t0 = performance.now(); layout(); } weck(); }
    sicht(canvas, function (s) { sichtbar = s; los(); });
    addEventListener('film-frei', los);
    addEventListener('resize', function () { if (start) layout(); });
    var feld = opt.maus || ziel;
    feld.addEventListener('pointermove', function (e) {
      if (!fertig || e.pointerType === 'touch') return;
      var r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
      stoer = Math.min(1, stoer + 0.12); weck();
    });
    return { weck: weck };
  }

  var hero = document.querySelector('.hero');
  var heldlogo = $('heldlogo');
  /* 21H1F: Hero-Maße gecacht (vorher getBoundingClientRect + offsetHeight in jedem Bild der Partikel-Schleife = erzwungenes Layout nach jedem Style-Schreiben) */
  var hG = { top: 0, h: 1 };
  function hMess() { if (hero) { hG.top = hero.getBoundingClientRect().top + scrollY; hG.h = hero.offsetHeight; } }
  hMess(); addEventListener('load', hMess); addEventListener('resize', hMess);
  if (window.ResizeObserver) new ResizeObserver(hMess).observe(document.body);
  function heroP() { return hero ? klemm((scrollY - hG.top) / (hG.h * 0.85), 0, 1) : 0; }
  if (RUHE || !window.LOGO_PUNKTE || !document.createElement('canvas').getContext) {
    if (hero) hero.classList.add('ohne-staub', 'gebaut');
    var mf = $('markenfeld'); if (mf) mf.classList.add('gebaut');
  } else {
    Staub($('staub'), $('logofeld'), {
      scrollP: heroP, maus: hero,
      fertig: function () { hero.classList.add('gebaut'); },
      logoA: function (a) { heldlogo.style.setProperty('--logo-a', a.toFixed(3)); hero.style.setProperty('--logo-a', a.toFixed(3)); }
    });
    var markenfeld = $('markenfeld'), markenlogo = $('markenlogo');
    if (markenfeld && markenlogo) Staub($('staub2'), markenlogo, { maus: markenfeld, fertig: function () { markenfeld.classList.add('gebaut'); },
      logoA: function (a) { markenlogo.style.opacity = markenfeld.classList.contains('gebaut') ? a.toFixed(3) : ''; } });
  }

  /* ---------- Instrumente am Rand: nur echte Werte ---------- */
  (function () {
    var zeit = $('i-zeit'), fps = $('i-fps'), scr = $('i-scroll');
    if (!zeit) return;
    function uhr() { try { zeit.textContent = new Date().toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin' }); } catch (e) { zeit.textContent = new Date().toLocaleTimeString('de-DE'); } }
    uhr(); setInterval(uhr, 1000);
    var heroSicht = true, n = 0, ta = performance.now();
    var messAn = false, bewegt = 0; /* misst nur, solange sich etwas bewegt – im Leerlauf keine eigene Schleife */
    function messStart() { bewegt = performance.now(); if (heroSicht && !messAn && !document.hidden) { messAn = true; n = 0; ta = performance.now(); requestAnimationFrame(mess); } }
    if (hero) sicht(hero, function (s) { heroSicht = s; if (s) messStart(); });
    addEventListener('scroll', messStart, { passive: true }); addEventListener('pointermove', messStart, { passive: true });
    function mess(t) {
      if (!heroSicht || document.hidden || t - bewegt > 1500) { messAn = false; return; } n++;
      if (t - ta > 1000) { fps.textContent = Math.round(n * 1000 / (t - ta)) + ' FPS'; n = 0; ta = t; }
      requestAnimationFrame(mess);
    }
    /* 21H1F: scrollHeight nur bei Größenänderung lesen (stand in jedem Scroll-Ereignis = Layout-Lesung pro Bild), Text nur bei Änderung schreiben */
    var maxS = 1, spAlt = ''; function spM() { maxS = document.documentElement.scrollHeight - innerHeight; }
    spM(); addEventListener('load', spM); addEventListener('resize', spM); if (window.ResizeObserver) new ResizeObserver(spM).observe(document.body);
    function sp() { var t = ('00' + Math.round(maxS > 0 ? scrollY / maxS * 100 : 0)).slice(-3) + ' %'; if (t !== spAlt) { spAlt = t; scr.textContent = t; } }
    addEventListener('scroll', sp, { passive: true }); sp();
  })();

  /* =========================================================
     2 · KAPITEL-KAMERAFAHRT (Leistungen)
     ========================================================= */
  (function () {
    var sek = $('leistungen'); if (!sek || RUHE) return;
    var N = 5, geraet = $('geraet'), auf = $('aufsteller'), halten = $('halten');
    var kaps = sek.querySelectorAll('.kap'), rws = sek.querySelectorAll('.rw span'), scs = sek.querySelectorAll('.sc'), lis = sek.querySelectorAll('.kap-schiene li');
    var instr = $('kinstr'), schmal = innerWidth < 861;
    /* Kamera je Kapitel: Kippen X/Y/Z, Größe, Versatz (in % der Bildschirmbreite/-höhe) */
    var K = [
      { rx: 6, ry: -26, rz: 3, s: 1, x: 0, y: 0 },
      { rx: 2, ry: 22, rz: -2, s: 1.04, x: -1, y: 0 },
      { rx: 12, ry: -10, rz: -9, s: 1, x: 1, y: 1 },
      { rx: -4, ry: -34, rz: 0, s: 1.02, x: 2, y: 0 },
      { rx: 56, ry: -6, rz: 12, s: 0.88, x: 5, y: 12 }
    ];
    var INSTR = [
      [['Kapitel', '01 · Website'], ['Gebaut für', 'jedes Handy'], ['Geräte', 'Handy · Tablet · PC'], ['Bilder', 'echt + ✦ KI']],
      [['Kapitel', '02 · Assistent'], ['Erreichbar', '24 / 7'], ['Wissen', 'nur Ihr Betrieb'], ['Ergebnis', 'Anfrage sortiert']],
      [['Kapitel', '03 · KI-Telefon'], ['Annahme', 'nach Klingeln'], ['Ergebnis', 'Termin im Kalender'], ['Info an Sie', 'Zusammenfassung']],
      [['Kapitel', '04 · App'], ['Geräte', 'Handy · Tablet'], ['Daten', 'synchron'], ['Ablauf', 'Anfrage → Rechnung']],
      [['Kapitel', '05 · NFC'], ['Abstand', '< 4 cm'], ['App nötig', 'nein'], ['Öffnet', 'Bewertungsseite']]
    ];
    var ziel = 0, akt = 0, idx = -1, sichtbar = false, laeuft = false, hold = 0, haelt = false, letzt = 0;
    var chat = $('chat'), CH = [['k', 'Machen Sie auch Badsanierung in Weißenhorn?'], ['b', 'Ja – Badsanierung komplett aus einer Hand. Weißenhorn liegt in unserem Einzugsgebiet.'], ['k', 'Super. Am liebsten nachmittags.'], ['b', 'Notiert: Besichtigung, nachmittags. Wie ist Ihr Name und Ihre Nummer?'], ['karte-a', '✓ Anfrage sortiert an Muster Fliesen & Bad: Badsanierung · Weißenhorn · nachmittags']];
    CH.forEach(function (c) { var d = document.createElement('div'); d.className = c[0]; d.textContent = c[1]; chat.appendChild(d); });
    var TR = [['KI-Telefon', 'Muster Fliesen & Bad, guten Tag. Der Chef ist gerade auf der Baustelle – worum geht es?'], ['Anrufer', 'Ich bräuchte ein neues Bad, in Weißenhorn.'], ['KI-Telefon', 'Gern. Passt Ihnen eine Besichtigung am Donnerstag um 16:30 Uhr?'], ['Anrufer', 'Ja, das passt.']];
    var trEl = $('transkript'); TR.forEach(function (t) { var p = document.createElement('p'); p.innerHTML = '<b>' + t[0] + '</b>'; p.appendChild(document.createTextNode(t[1])); trEl.appendChild(p); });
    var TP = window.TEMPLATES || [], film = $('sc0'), filmImgs = [];
    TP.filter(function (t) { return t.fertig; }).forEach(function (t) {
      ['a', 'b'].forEach(function (s) { var im = new Image(); im.src = 'assets/img/handy-' + t.id + '-' + s + '.webp'; im.alt = ''; im.decoding = 'async'; im.width = 780; im.height = 1688; film.appendChild(im); filmImgs.push(im); });
    });
    var welle = $('welle'), wx = welle.getContext('2d');
    function malWelle(t, aktiv) {
      wx.clearRect(0, 0, 520, 140); wx.fillStyle = aktiv ? '#7fd88f' : '#3a3c40';
      for (var i = 0; i < 52; i++) { var h = aktiv ? (Math.abs(Math.sin(t * 0.006 + i * 0.55) * Math.sin(t * 0.0023 + i * 0.21)) * 100 + 8) : 6; wx.fillRect(i * 10 + 2, 70 - h / 2, 5, h); }
    }
    function zahl(v) { return v.toFixed(2).replace('.', ','); }
    function setzeKapitel(i) {
      kaps.forEach(function (k, j) { k.classList.toggle('an', j === i); k.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
      rws.forEach(function (r, j) { r.classList.toggle('an', j === i); r.classList.toggle('weg', j < i); });
      scs.forEach(function (s, j) { s.classList.toggle('an', j === i); });
      lis.forEach(function (l, j) { l.classList.toggle('an', j === i); });
      instr.innerHTML = INSTR[i].map(function (r) { return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('');
      halten.classList.toggle('sichtbar', i === 2);
    }
    var kTop = 0, kH = 1; /* Maße nur bei resize/load – keine Layout-Lesung im Bild-Takt */
    function kMess() { kTop = oben(sek); kH = sek.offsetHeight - innerHeight; }
    kMess(); addEventListener('resize', kMess); addEventListener('load', kMess);
    function messen() { ziel = kH > 0 ? klemm((scrollY - kTop) / kH, 0, 1) : 0; }
    function cam(a, b, t) { var o = {}; for (var k in a) o[k] = a[k] + (b[k] - a[k]) * t; return o; }
    function bild(t) {
      if (!sichtbar) { laeuft = false; return; }
      var dt = Math.min(0.05, (t - letzt) / 1000); letzt = t;
      messen(); akt += (ziel - akt) * (1 - Math.exp(-Math.max(0.001, dt) / 0.13)); /* 20N-FIX2: zeitbasiert (bei 60 Hz wie vorher 0,12/Bild) */
      if (Math.abs(ziel - akt) < 0.0004) akt = ziel;
      if (haelt) hold = Math.min(1, hold + dt / 7);
      var c = klemm(akt * N * 1.0001, 0, N - 0.0001), i = Math.floor(c), sub = c - i;
      if (i !== idx) { idx = i; setzeKapitel(i); }
      var von = K[Math.max(0, i - 1)], k = cam(von, K[i], glatt(sub / 0.32));
      var einflug = glatt(akt * N / 0.35);   /* Gerät steigt beim Eintreten aus der Tiefe */
      var ry = k.ry + (sub - 0.5) * 7, rx = k.rx + (1 - einflug) * 40, s = k.s * (0.72 + 0.28 * einflug) * (schmal ? 0.94 : 1);
      geraet.style.transform = 'translate3d(' + (k.x * innerWidth / 100) + 'px,' + (k.y * innerHeight / 100 + (1 - einflug) * innerHeight * 0.25) + 'px,0) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + k.rz.toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
      geraet.style.setProperty('--glanz', (ry * 1.6).toFixed(1));
      lis.forEach(function (l, j) { l.style.setProperty('--f', klemm(c - j, 0, 1).toFixed(3)); });
      /* Bildschirm-Inhalte */
      if (i === 0 && filmImgs.length) {
        var m = filmImgs.length, f = klemm(sub * m, 0, m - 0.001), fi = Math.floor(f);
        filmImgs.forEach(function (im, j) { im.classList.toggle('an', j === fi); });
        var gl = f - fi; filmImgs[fi].style.transform = 'translateY(' + (-(gl * 6)).toFixed(2) + '%) scale(' + (1.02 - gl * 0.02).toFixed(4) + ')';
      }
      if (i === 1) { var nc = Math.floor(sub * 6.2); Array.prototype.forEach.call(chat.children, function (d, j) { d.classList.toggle('an', j < nc); }); }
      if (i === 2) {
        var pr = Math.max(hold, klemm((sub - 0.08) * 1.15, 0, 1));
        var an = $('anruf'); an.classList.toggle('klingelt', pr < 0.12);
        $('anruf-status').textContent = pr < 0.12 ? 'Eingehender Anruf' : pr < 0.97 ? 'KI-Telefon spricht' : 'Gespräch beendet';
        var sek2 = Math.floor(pr * 52); $('anruf-zeit').textContent = '00:' + ('0' + sek2).slice(-2);
        Array.prototype.forEach.call(trEl.children, function (p, j) { p.classList.toggle('an', pr > 0.14 + j * 0.18); });
        $('termin').classList.toggle('an', pr > 0.86);
        malWelle(t, pr > 0.12 && pr < 0.97);
        halten.style.setProperty('--h', hold.toFixed(3));
      }
      if (i === 3 && window.AppVorschau) AppVorschau.mini(sub);   /* App-Vorschau (Chat W10-C): gleiche Komponente */
      if (i === 4) {
        var a = glatt((sub - 0.05) / 0.4);
        auf.style.opacity = a.toFixed(3);
        auf.style.transform = 'translate3d(' + ((schmal ? -38 : -62) * a).toFixed(1) + '%,' + (-30 + 50 * (1 - a)).toFixed(1) + '%,-240px) rotateY(16deg)';
        var st = Math.floor(klemm((sub - 0.35) / 0.45, 0, 1) * 5 + 0.0001);
        sek.querySelectorAll('.sterne i').forEach(function (s2, j) { s2.classList.toggle('an', j < st); });
      } else if (auf.style.opacity !== '0') { auf.style.opacity = '0'; }
      if (Math.abs(ziel - akt) < 0.0004 && !(haelt && hold < 1) && !document.hidden) { laeuft = false; return; } /* Ruhe: Schleife schläft */
      requestAnimationFrame(bild);
    }
    function kWeck() { if (sichtbar && !laeuft && !document.hidden) { laeuft = true; letzt = performance.now(); requestAnimationFrame(bild); } }
    sicht(sek, function (s) { sichtbar = s; kWeck(); });
    addEventListener('scroll', kWeck, { passive: true }); addEventListener('resize', kWeck);
    document.addEventListener('visibilitychange', kWeck);
    addEventListener('resize', function () { schmal = innerWidth < 861; });
    /* Interaktion mit Sinn: gedrückt halten = Anruf annehmen und anhören */
    function drueck(e) { haelt = true; kWeck(); if (e && e.pointerId != null) try { halten.setPointerCapture(e.pointerId); } catch (x) {} if (e) e.preventDefault(); }
    function los() { haelt = false; }
    halten.addEventListener('pointerdown', drueck);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { halten.addEventListener(n, los); });
    halten.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { drueck(); e.preventDefault(); } });
    halten.addEventListener('keyup', los);
    halten.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    /* Kapitel-Schiene anklickbar */
    lis.forEach(function (l, j) {
      l.querySelector('button').addEventListener('click', function () {
        var y = oben(sek) + (sek.offsetHeight - innerHeight) * ((j + 0.45) / N);
        if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  })();

  /* =========================================================
     3 · 3D-TEMPLATE-RING mit Flug-Übergang
     ========================================================= */
  (function () {
    var zone = $('ringzone'), ring = $('ring'), welt = ring && ring.parentNode; if (!zone || !window.TEMPLATES) return;
    var T = TEMPLATES, N = T.length, STEP = 360 / N, karten = [];
    var WORT = { fliesen: 'FUGE', pv: 'SONNE', elektro: 'STROM', sanitaer: 'WÄRME', schreiner: 'HOLZ', dach: 'DACH', naturstein: 'STEIN', fenster: 'LICHT' };
    function hex(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
    T.forEach(function (t, i) {
      var a = document.createElement(t.fertig ? 'a' : 'div');
      a.className = 'rk' + (t.fertig ? ' fertig' : '');
      if (t.fertig) { a.href = 'templates/' + t.id + '/index.html'; a.setAttribute('data-tpl', t.id); a.setAttribute('aria-label', 'Design ' + t.name + ' ansehen'); } /* 20N-FIX4: Klick öffnet das Beispiel-Template */
      a.style.setProperty('--t-grund', t.grund); a.style.setProperty('--t-akzent', t.akzent);
      a.innerHTML = (t.fertig ? '<img src="assets/img/vorschau-' + t.id + '.webp" width="960" height="1200" alt="" loading="lazy" draggable="false">' : '<canvas width="400" height="500"></canvas>') +
        '<span class="rk-bsp">Beispiel</span><span class="rk-status">' + (t.fertig ? 'Ansehen' : 'In Arbeit') + '</span>' +
        '<span class="rk-name"><small>' + t.gewerk + '</small>' + t.name + '</span>';
      ring.appendChild(a); karten.push(a);
      if (!t.fertig) lebend(a.querySelector('canvas'), t);
    });
    /* Liste darunter (auch für Screenreader und schnelle Leser) */
    var liste = $('tplliste');
    liste.innerHTML = T.map(function (t) { return '<li>' + (t.fertig ? '<a href="templates/' + t.id + '/index.html" data-tpl="' + t.id + '"><small>' + t.gewerk + '</small>' + t.name + ' – ansehen</a>' : '<span><small>' + t.gewerk + '</small>' + t.name + ' · in Arbeit</span>') + '</li>'; }).join('');
    function lebend(c, t) {
      var x = c.getContext('2d'), sch = false, ph = Math.random() * 6, t0 = performance.now();
      function mal(s) {
        x.fillStyle = t.grund; x.fillRect(0, 0, 400, 500);
        for (var i = 0; i < 3; i++) { var px = 200 + Math.sin(s * 0.35 + ph + i * 2.1) * 150, py = 220 + Math.cos(s * 0.27 + ph + i) * 140; var g = x.createRadialGradient(px, py, 0, px, py, 260 - i * 50); g.addColorStop(0, hex(i ? t.b[1] : t.b[0], i ? 0.55 : 0.34)); g.addColorStop(1, hex(t.grund, 0)); x.fillStyle = g; x.fillRect(0, 0, 400, 500); }
        x.strokeStyle = hex(t.akzent, 0.2); x.lineWidth = 1;
        for (var j = 0; j < 12; j++) { x.beginPath(); var y = 40 + j * 36 + Math.sin(s * 0.5 + j) * 5; x.moveTo(0, y); x.bezierCurveTo(130, y - 34, 270, y + 34, 400, y - 10); x.stroke(); }
      }
      mal(0); if (RUHE) return;
      /* 20N-FIX2: keine eigene Schleife mehr – läuft im gemeinsamen TAKT, nur solange die Karte sichtbar ist */
      var nm = 'lebend-' + t.id, zuletzt = 0;
      sicht(c, function (s) { sch = s; if (!window.TAKT) return; if (s) TAKT.dauer(nm, l); else TAKT.aus(nm); });
      function l(n) { if (!sch) { TAKT.aus(nm); return; } if (n - zuletzt > 40) { mal((n - t0) / 1000); zuletzt = n; } }
    }
    var R = 300, ziel = 0, akt = 0.5, zug = 0, zugZiel = 0, sichtbar = false, laeuft = false, vorn = -1;
    function layout() { var w = karten[0].offsetWidth; R = w / 2 / Math.tan(Math.PI / N) * 1.08; }
    layout(); addEventListener('resize', layout);
    var zTop = 0, zH = 1; function zMess() { zTop = oben(zone); zH = zone.offsetHeight - innerHeight; } zMess(); addEventListener('resize', zMess); addEventListener('load', zMess);
    function scrollWinkel() { var h = zH; var p = h > 0 ? klemm((scrollY - zTop) / h, 0, 1) : 0; return -p * (N - 1) * STEP; }
    var name = $('ri-name'), gew = $('ri-gewerk'), txt = $('ri-text'), los = $('ri-los'), nr = $('ri-nr'), rw = $('ring-rw'), gal = $('templates');
    function zeigeVorn(i) {
      vorn = i; var t = T[i];
      karten.forEach(function (k, j) { k.classList.toggle('vorn', j === i); k.tabIndex = j === i ? 0 : -1; });
      gew.textContent = t.gewerk; name.textContent = t.name; txt.textContent = t.text; nr.textContent = ('0' + (i + 1)).slice(-2);
      rw.textContent = WORT[t.id] || ''; gal.style.setProperty('--ra', t.akzent);
      if (t.fertig) { los.textContent = 'Dieses Design ansehen'; los.href = 'templates/' + t.id + '/index.html'; los.setAttribute('data-tpl', t.id); los.classList.remove('aus'); los.removeAttribute('aria-disabled'); }
      else { los.textContent = 'In Arbeit'; los.href = '#templates'; los.classList.add('aus'); los.setAttribute('aria-disabled', 'true'); }
    }
    var rLetzt = 0;
    function bild(t) {
      if (!sichtbar && Math.abs(zugZiel - zug) < 0.01) { laeuft = false; rLetzt = 0; return; }
      if (document.hidden) { laeuft = false; rLetzt = 0; return; }
      var dt = rLetzt ? Math.min(0.1, Math.max(0.001, (t - rLetzt) / 1000)) : 0.0167; rLetzt = t;
      var kf = 1 - Math.exp(-dt / 0.158); /* 20N-FIX2: zeitbasiert (bei 60 Hz wie vorher 0,1/Bild) */
      zug += (zugZiel - zug) * kf; if (Math.abs(zugZiel - zug) < 0.01) zug = zugZiel; ziel = scrollWinkel() + zug;
      if (Math.abs(ziel - akt) < 0.01 && Math.abs(zugZiel - zug) < 0.01 && vorn >= 0) { laeuft = false; rLetzt = 0; return; } /* Ruhe: keine Schreibzugriffe im Leerlauf */
      akt += (ziel - akt) * kf;
      ring.style.transform = 'translateZ(' + (-R).toFixed(1) + 'px) rotateX(-7deg)';
      karten.forEach(function (k, i) {
        var a = ((i * STEP + akt) % 360 + 540) % 360 - 180, c = Math.cos(a * Math.PI / 180);
        k.style.transform = 'rotateY(' + a.toFixed(2) + 'deg) translateZ(' + R.toFixed(1) + 'px)';
        k.style.opacity = (0.18 + 0.82 * Math.max(0, c) * Math.max(0, c)).toFixed(3);
        k.style.filter = 'brightness(' + (0.45 + 0.55 * Math.max(0, c)).toFixed(3) + ')';
      });
      var v = ((Math.round(-akt / STEP) % N) + N) % N; if (v !== vorn) zeigeVorn(v);
      requestAnimationFrame(bild);
    }
    function weck() { if (!laeuft) { laeuft = true; requestAnimationFrame(bild); } }
    sicht(zone, function (s) { sichtbar = s; if (s) { zMess(); weck(); } });
    addEventListener('scroll', function () { if (sichtbar) weck(); }, { passive: true });
    zeigeVorn(0);
    /* Design gewählt: Konfigurator schon vorbelegen (Template öffnet sich in eigener Seite) */
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-tpl]'); if (!el) return;
      if (el.classList.contains('rk') && welt.classList.contains('zieht')) return;
      var s = $('w-template'); if (s) { s.value = el.getAttribute('data-tpl'); s.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    /* Ziehen mit Schwung, danach einrasten */
    var zieht = false, gezogen = false, sx = 0, sz = 0, vx = 0, lx = 0, lt = 0;
    welt.addEventListener('pointerdown', function (e) { if (e.button) return; zieht = true; gezogen = false; sx = lx = e.clientX; sz = zugZiel; vx = 0; lt = performance.now(); });
    addEventListener('pointermove', function (e) {
      if (!zieht) return; var dx = e.clientX - sx;
      if (!gezogen && Math.abs(dx) > 6) { gezogen = true; welt.classList.add('zieht'); try { welt.setPointerCapture(e.pointerId); } catch (x) {} }
      if (gezogen) { var n = performance.now(); vx = (e.clientX - lx) / Math.max(1, n - lt); lx = e.clientX; lt = n; zugZiel = sz + dx * 0.22; weck(); }
    });
    function ende() {
      if (!zieht) return; zieht = false; welt.classList.remove('zieht');
      if (gezogen) { zugZiel += vx * 60; var ges = scrollWinkel() + zugZiel; zugZiel += Math.round(ges / STEP) * STEP - ges; weck(); }
    }
    addEventListener('pointerup', ende); addEventListener('pointercancel', ende);
    function dreh(d) { zugZiel -= d * STEP; weck(); }
    $('ring-vor').addEventListener('click', function () { dreh(1); });
    $('ring-zurueck').addEventListener('click', function () { dreh(-1); });
    /* Klick: hintere Karte dreht nach vorn, vordere fliegt ins Vollbild und öffnet das Template */
    function flieg(t, von, href) {
      var geh = window.__oeffne || function (u) { location.href = u; }; /* __oeffne: nur in der Einzeldatei „zum Ansehen“ (Beispiel als Ebene) */
      if (RUHE) { geh(href); return; }
      /* 20N-FIX4: kein Foto-Zoom mehr – die Fläche im Grundton des Designs öffnet sich aus der Karte, dann lädt das Beispiel */
      var r = von.getBoundingClientRect(), f = document.createElement('div');
      f.className = 'flug'; f.style.setProperty('--t-grund', t.grund); f.style.setProperty('--t-akzent', t.akzent);
      f.innerHTML = '<span class="flug-name"><small>Beispiel wird geöffnet</small>' + t.name + '</span>';
      f.style.clipPath = 'inset(' + Math.max(0, r.top) + 'px ' + Math.max(0, innerWidth - r.right) + 'px ' + Math.max(0, innerHeight - r.bottom) + 'px ' + Math.max(0, r.left) + 'px round 18px)';
      document.body.appendChild(f); f.getBoundingClientRect();
      f.classList.add('voll'); f.style.clipPath = 'inset(0px 0px 0px 0px round 0px)';
      setTimeout(function () { geh(href); }, 640);
      setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 4000); /* falls die Seite nicht wechselt: Ebene wieder weg */
    }
    karten.forEach(function (k, i) {
      k.addEventListener('click', function (e) {
        if (gezogen) { e.preventDefault(); return; }
        if (i !== vorn) { e.preventDefault(); var d = ((i - vorn) % N + N) % N; if (d > N / 2) d -= N; dreh(d); return; }
        if (T[i].fertig) { e.preventDefault(); flieg(T[i], k, k.href); }
      });
    });
    los.addEventListener('click', function (e) { var t = T[vorn]; e.preventDefault(); if (t.fertig) flieg(t, karten[vorn], los.href); });
    addEventListener('pageshow', function (e) { if (e.persisted) document.querySelectorAll('.flug').forEach(function (f) { f.remove(); }); });
  })();

  /* =========================================================
     4 · Wachsende Fläche, Ablauf-Punkt, Lichtschnitt-Porträt
     ========================================================= */
  (function () {
    var wa = [].slice.call(document.querySelectorAll('.waechst')), schritte = [].slice.call(document.querySelectorAll('.schritt')), por = $('portrait');
    var lauf = false;
    function rechne() {
      lauf = false; var H = innerHeight;
      var wr = wa.map(function (s) { return s.getBoundingClientRect(); }), sr = schritte.map(function (s) { return s.getBoundingClientRect().top; }), pr = por ? por.getBoundingClientRect() : null; /* erst alles lesen … */
      wa.forEach(function (s, k) { var r = wr[k]; if (r.top > H || r.bottom < 0) return; var e = glatt((H - r.top) / (H * 0.85)); s.style.setProperty('--i', ((1 - e) * 12).toFixed(2)); s.style.setProperty('--s', ((1 - e) * 4).toFixed(2)); s.style.setProperty('--v', ((1 - e) * 3).toFixed(2)); });
      schritte.forEach(function (s, k) { s.classList.toggle('aktiv', sr[k] < H * 0.72); }); /* … dann schreiben (kein Layout-Flattern) */
      if (pr && pr.top < H && pr.bottom > 0) por.style.setProperty('--scan', glatt((H - pr.top) / (H * 0.75)).toFixed(3));
    }
    if (RUHE) { wa.forEach(function (s) { s.style.setProperty('--i', 0); }); schritte.forEach(function (s) { s.classList.add('aktiv'); }); return; }
    addEventListener('scroll', function () { if (!lauf) { lauf = true; requestAnimationFrame(rechne); } }, { passive: true });
    addEventListener('resize', rechne); rechne();
  })();

  /* =========================================================
     5 · Konfigurator: Live-Vorschau + Mini-Leiste am Handy
     ========================================================= */
  (function () {
    var f = $('wunschform'), mini = $('mini'); if (!f || !mini || !window.TEMPLATES) return;
    var WORT = { fliesen: 'Fliese & Fuge', pv: 'Strom vom Dach', elektro: 'Sauber verdrahtet', sanitaer: 'Wärme & Wasser', schreiner: 'Holz nach Maß', dach: 'Dicht bis First', naturstein: 'Stein für immer', fenster: 'Licht & Ruhe' };
    var bl = $('mini-bloecke'), mm = $('minimobil'), da = {};
    function slug(s) { return s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/gmbh|e\.k\.|& co\.? kg|kg|ohg|gbr/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30); }
    function zeig() {
      var id = $('w-template').value, t = TEMPLATES.filter(function (x) { return x.id === id; })[0];
      var farbe = $('w-logo').checked ? '#c8ccd2' : $('w-farbe').value;
      mini.style.setProperty('--a', farbe); mini.style.setProperty('--g', t ? t.grund : '#141414');
      var vRel = t && t.fertig ? 'assets/img/vorschau-' + t.id + '.webp' : '', DM = window.__DATEI || {}; /* 20N-FIX5: in der Ansehen-Datei liegt das Bild eingebettet (vorher: Vorschau im Wunsch-Bereich leer) */
      var bildUrl = window.WUNSCH_BILD || (vRel ? (DM[vRel] || new URL(vRel, location.href).href) : '');
      $('mini-hero').style.setProperty('--bild', bildUrl ? 'url("' + bildUrl + '")' : 'none');
      mini.classList.toggle('eigenes-foto', !!window.WUNSCH_BILD);
      var mn = $('mini-name'); mn.classList.toggle('mit-logo', !!window.WUNSCH_LOGO); mn.style.backgroundImage = window.WUNSCH_LOGO ? 'url("' + window.WUNSCH_LOGO + '")' : '';
      var firma = $('w-firma').value.trim();
      $('mini-name').textContent = firma || 'Ihr Betrieb';
      $('mini-url').textContent = (slug(firma) || 'ihr-betrieb') + '.de';
      var o = [$('w-gewerk').value.trim(), $('w-ort').value.trim()].filter(Boolean).join(' · ');
      $('mini-gewerk').textContent = o || 'Ihr Gewerk · Ihr Ort';
      $('mini-wort').textContent = t ? WORT[t.id] : ($('w-gewerk').value.trim() || 'Ihr Handwerk');
      var an = [].slice.call(document.querySelectorAll('#w-bausteine button[aria-pressed="true"]')).map(function (b) { return b.textContent; });
      var neu = {};
      an.forEach(function (x) { neu[x] = 1; });
      [].slice.call(bl.children).forEach(function (d) { if (!neu[d.textContent]) bl.removeChild(d); });
      an.forEach(function (x) { if (!da[x]) { var d = document.createElement('div'); d.textContent = x; bl.appendChild(d); } });
      da = neu;
      /* Reihenfolge wie im Formular */
      an.forEach(function (x) { [].slice.call(bl.children).forEach(function (d) { if (d.textContent === x) bl.appendChild(d); }); });
      $('mm-farbe').style.background = farbe; $('mm-text').textContent = an.length + ' Bausteine · ' + (t ? t.name : 'Template offen');
    }
    ['input', 'change', 'click'].forEach(function (n) { f.addEventListener(n, function () { setTimeout(zeig, 0); }); });
    setTimeout(zeig, 0);
    /* Mini-Leiste: nur am Handy, solange das Formular im Bild ist und die Vorschau nicht */
    var formSicht = false, vorSicht = false;
    function leiste() { var z = innerWidth <= 900 && formSicht && !vorSicht; mm.hidden = false; mm.classList.toggle('zeigen', z); document.body.classList.toggle('mini-an', z); }
    sicht(f, function (s) { formSicht = s; leiste(); });
    sicht($('zusammen'), function (s) { vorSicht = s; leiste(); });
    addEventListener('resize', leiste);
  })();
})();
