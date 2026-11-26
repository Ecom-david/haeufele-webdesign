/* Scroll-Film „Feierabend 3“ (Chat W11-S, 10.11.2026) – neue Abspiel-Technik.
   Scrollen = Zeitachse (vor, zurück, steht sofort). JEDES Filmbild liegt im Netz (1228 Bilder, 24 fps, 4K-Master verkleinert).
   Sauber statt sprunghaft:
   1) Bilder werden um die aktuelle Stelle herum VORAB dekodiert (ImageBitmap-Fenster), gezeichnet wird nur Fertiges.
   2) Fehlt ein Bild noch, bleibt der Film auf dem letzten gezeigten Bild stehen (kein Vorspringen zu weit entfernten Bildern).
   3) Die Bildposition folgt dem Scroll mit physikalischer Dämpfung (zeitbasiert, gleich schnell bei 60/120 Hz);
      zwischen zwei echten Nachbarbildern wird anteilig überblendet → auch langsames Scrollen läuft weich.
   Ohne Module, läuft auch per Doppelklick. */
(function () {
  var sek = document.getElementById('film'); if (!sek) return;
  var buehne = sek.querySelector('.fs-buehne'), cv = sek.querySelector('.fs-canvas'), poster = sek.querySelector('.fs-poster');
  var leiste = sek.querySelector('.fs-leiste i'), weiter = document.getElementById('filmWeiter');
  var texte = [].slice.call(sek.querySelectorAll('[data-von]'));
  var uhr = sek.querySelector('.fs-uhr b');
  var root = document.documentElement;
  var N = 1228;                     // Filmbilder im Netz (0–1227). Der Film endet im Monitor-Glühen; darunter liegt deckungsgleich die echte Startseite und „schaltet ein“
  var PFAD = 'assets/film/';
  /* Einzeldatei „zum Ansehen“: Filmbilder liegen eingebettet in window.FILM_DATEN (20N-FIX4: alle 1228 Original-Bilder 1920×1080, unverändert) – kein Pfad nach außen */
  /* 20N-FIX2: Laden/Dekodieren/Zeichnen arbeitet NUR mit „Plätzen“ = tatsächlich vorhandenen Bildern (0 … M-1).
     Platz k zeigt Filmbild k·S. Damit ist jede Bildfolge-Dichte möglich (1228 Bilder im Netz, 614 in der Ansehen-Datei …)
     und es wird nie auf ein Bild gewartet, das es nicht gibt. Texte/Uhr/Zeitachse bleiben in Filmbild-Nummern. */
  var FD = window.FILM_DATEN || null;
  var S = FD ? (+FD.schritt || 1) : 1;              // Filmbilder je Platz
  var M = FD ? (FD.anzahl || FD.bilder.length) : N;                // Anzahl vorhandener Bilder
  function platz(f) { return f <= 0 ? 0 : Math.min(M - 1, f / S); } // Filmbild (Kommazahl) → Platz (Kommazahl)
  var RASTER = Math.max(1, Math.round(60 / S)), FENSTER_LADEN = Math.max(8, Math.ceil(60 / S)); // gehalten: Raster + Fenster um die Stelle (≈ ±60 Filmbilder)
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqHoch = window.matchMedia && matchMedia('(max-aspect-ratio: 4/5)');
  var hoch = !!(mqHoch && mqHoch.matches);
  var SATZ, IW, IH;
  function satz() { SATZ = hoch ? 'm' : 'd'; IW = hoch ? 1280 : 1920; IH = hoch ? 720 : 1080; FENSTER_LADEN = Math.max(8, Math.ceil((hoch ? 36 : 60) / S)); /* 26B2: am Handy kleineres Lade-Fenster (gemessen bis 116 Bilder gleichzeitig = Speicherdruck) */ }
  satz();

  /* Zeitachse (Bildnummern 0-basiert) mit Anteil am Scrollweg in % */
  var SEG = [
    [0, 120, 9],       // S0  Anflug ins Büro (Nacht)
    [120, 240, 8],     // S2a Aufstieg über den Tisch
    [240, 360, 9.7],   // S2b Sturzflug aufs Handy
    [360, 527, 17],    // Handy: 3 Anfragen (22:34 · 23:21 · 00:12)
    [527, 599, 7],     // Licht: Nacht → Morgen (Uhr 00:12 → 07:04)
    [599, 719, 8.5],   // S3a Steigflug, Meister steht da
    [719, 839, 8.5],   // S3b Kranschwung in die Totale
    [839, 1031, 12],   // S4  nimmt Handy, liest, lächelt
    [1031, 1223, 13],  // S5  Fahrt in den Bildschirm
    [1223, 1227, 1.5]  // Glühen des Bildschirms – danach blendet die echte Startseite auf (kein Doppelbild)
  ];
  var U = [0], T = 0, i;
  for (i = 0; i < SEG.length; i++) { T += SEG[i][2]; U.push(T); }
  function klemm(x, a, b) { return x < a ? a : x > b ? b : x; }
  function bildAus(p) {
    var u = p * T;
    for (var k = 0; k < SEG.length; k++) if (u <= U[k + 1] || k === SEG.length - 1) {
      var s = SEG[k], t = klemm((u - U[k]) / s[2], 0, 1);
      return Math.min(N - 1, s[0] + t * (s[1] - s[0]));
    }
    return N - 1;
  }
  function zz(n) { return ('000' + n).slice(-4); }
  function name(k) { return FD ? (FD.bild ? FD.bild(k) : FD.bilder[k]) : PFAD + SATZ + '3/' + SATZ + '-' + zz(k) + '.webp'; }

  function texteSetzen(f) {
    for (var k = 0; k < texte.length; k++) {
      var el = texte[k], an = f >= +el.getAttribute('data-von') && f < +el.getAttribute('data-bis');
      if (el._an !== an) { el._an = an; el.classList.toggle('an', an); }
    }
    if (uhr) { // 00:12 → 07:04 während des Licht-Teils
      var m = 12 + klemm((f - 527) / (599 - 527), 0, 1) * 412, h = Math.floor(m / 60), mm = Math.floor(m % 60);
      var s = (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
      if (uhr.textContent !== s) uhr.textContent = s;
    }
  }
  function lage(W, H, iw, ih) {
    var s = Math.min(Math.max(W / iw, H / ih), W / (iw * (hoch ? 0.92 : 0.8)), H / (ih * 0.9));
    var w = iw * s, h = ih * s, x = (W - w) / 2, y = (H - h) / 2;
    if (hoch) y = Math.max(H * 0.1, (H - h) / 2 - H * 0.12);
    return { x: x, y: y, w: w, h: h, voll: w >= W - 1 && h >= H - 1 };
  }
  var oben = function () { return sek.getBoundingClientRect().top + scrollY; };
  var uebersprungen = false, skipZeit = 0;
  function knopf() {
    uebersprungen = true; skipZeit = Date.now();
    var ziel = oben() + sek.offsetHeight - innerHeight;
    if (window.__lenis && window.__lenis.scrollTo) window.__lenis.scrollTo(ziel, { duration: 1.2 });
    else scrollTo({ top: ziel, behavior: 'smooth' });
  }

  /* ---------- reduzierte Bewegung: Standbild (alle drei Anfragen) + Film mit Bedienleiste ---------- */
  if (still) {
    sek.classList.add('fs-still');
    var ov = document.getElementById('filmUeber'), v = ov && ov.querySelector('video');
    weiter.textContent = 'Film ansehen';
    if (poster) {
      var pi = poster.querySelector('img') || poster;
      poster.querySelectorAll('source').forEach(function (q) { q.remove(); });
      var setzPoster = function () { var q = name(Math.round(platz(500))); if (q) pi.src = q; };
      if (FD && FD.warte) FD.warte(setzPoster); else setzPoster(); // 20N-FIX5
      if (hoch) {
        pi.style.objectFit = 'contain'; pi.style.objectPosition = '50% 10%';
        var setz = function () { var h = Math.min(innerHeight, innerWidth * IH / IW); sek.style.setProperty('--fs-ut', Math.round((innerHeight - h) * 0.1 + h + 18) + 'px'); };
        setz(); addEventListener('resize', setz);
      }
    }
    texteSetzen(500);
    weiter.addEventListener('click', function () { if (!ov) return; ov.hidden = false; v.controls = true; try { v.currentTime = 0; v.play(); } catch (e) {} });
    var zu = document.getElementById('filmZu');
    if (zu) zu.addEventListener('click', function () { try { v.pause(); } catch (e) {} ov.hidden = true; weiter.focus(); });
    return;
  }

  /* ---------- Laden: Bild-Elemente (geht auch per Doppelklick), Reihenfolge: Anfang, grobes Raster, dann rund um die aktuelle Stelle ---------- */
  var bilder, ok, bmp, bmpLaeuft, reihe, drin, aktuell = 0, richt = 1, MAXPAR = 8;
  var rbmp = {}, rLaeuft = {}; // 21H1F: Raster-Bilder (alle ~60 Bilder) dauerhaft als kleine Bitmaps – bei schnellen Sprüngen sofort ein ruhiges Nachbarbild, nie ein Sync-Decode im Zeichnen
  var FENSTER_VOR = 16, FENSTER_ZURUECK = 6, MAXDEC = 4, dec = 0; // max. 17 fertige Bitmaps (je 1080p ca. 8 MB) – Speicher-Budget
  var hatBitmap = typeof createImageBitmap === 'function';
  var START = Math.ceil(48 / S), ZURUECK_LADEN = Math.ceil(24 / S);
  function neuLaden() {
    if (bmp) for (var j = 0; j < M; j++) if (bmp[j] && bmp[j].close) bmp[j].close();
    for (var rk in rbmp) if (rbmp[rk] && rbmp[rk].close) rbmp[rk].close();
    rbmp = {}; rLaeuft = {};
    if (bilder) for (j = 0; j < M; j++) if (bilder[j]) bilder[j].onload = bilder[j].onerror = null;
    bilder = new Array(M); ok = new Uint8Array(M); bmp = new Array(M); bmpLaeuft = new Uint8Array(M); drin = 0;
    reihe = []; var drin2 = {};
    function add(j) { if (j >= 0 && j < M && !drin2[j]) { drin2[j] = 1; reihe.push(j); } }
    for (j = 0; j < START; j++) add(j);
    for (j = 0; j < M; j += RASTER) add(j); // grobes Raster: bei Sprüngen ist sofort ein passendes Bild da
  }
  var entl = false, entlT = 0;
  function entladen() { /* 26B2: Film weit weg (Seite unten) → alle Bilder/Bitmaps abgeben, damit der Speicher unten frei ist (Safari lädt die Seite sonst gelegentlich neu) */
    if (!bilder) return;
    for (var j = 0; j < M; j++) {
      if (bmp[j]) { if (bmp[j].close) bmp[j].close(); bmp[j] = null; }
      if (bilder[j]) { bilder[j].onload = bilder[j].onerror = null; bilder[j].removeAttribute('src'); bilder[j] = null; }
      ok[j] = 0; bmpLaeuft[j] = 0;
    }
    for (var rk in rbmp) if (rbmp[rk] && rbmp[rk].close) rbmp[rk].close();
    rbmp = {}; rLaeuft = {}; drin = 0; dec = 0; entl = true; gezeigtA = -1;
  }
  function imLadeFenster(j) { return j % RASTER === 0 || Math.abs(j - aktuell) <= FENSTER_LADEN; }
  function freigeben() { // geladene Bilder außerhalb des Fensters wieder abgeben (Speicher)
    for (var j = 0; j < M; j++) if (bilder[j] && ok[j] && !imLadeFenster(j)) {
      bilder[j].onload = bilder[j].onerror = null; bilder[j].removeAttribute('src'); bilder[j] = null; ok[j] = 0;
      if (bmp[j]) { if (bmp[j].close) bmp[j].close(); bmp[j] = null; }
    }
  }
  function holeNaechstes() {
    // zuerst Lücken direkt vor der aktuellen Stelle (in Scrollrichtung), dann die Grundreihenfolge
    var j;
    while (reihe.length && reihe[0] < START) { j = reihe.shift(); if (!bilder[j]) return j; }
    for (var d = 0; d <= FENSTER_LADEN; d++) {
      j = aktuell + richt * d; if (j >= 0 && j < M && !bilder[j]) return j;
      if (d <= ZURUECK_LADEN) { j = aktuell - richt * d; if (j >= 0 && j < M && !bilder[j]) return j; }
    }
    while (reihe.length) { j = reihe.shift(); if (!bilder[j]) return j; }
    return -1;
  }
  var pumpT = 0, schnell = 0;
  function pumpe() {
    if (!sichtbar) return; /* 26B2: Film nicht im Bild = nichts laden */
    if (performance.now() - schnell < 150) { clearTimeout(pumpT); pumpT = setTimeout(pumpe, 160); return; } // während schneller Sprünge nichts nachladen
    if (FD && FD.warte && !FD.bereit) { if (!pumpe.w) { pumpe.w = 1; FD.warte(function () { pumpe.w = 0; pumpe(); }); } return; } // 20N-FIX5: Ansehen-Datei – Bildblock am Dateiende noch nicht gelesen
    freigeben();
    while (drin < MAXPAR) {
      var j = holeNaechstes(); if (j < 0) break;
      drin++; (function (j) {
        var im = new Image(); bilder[j] = im; im.decoding = 'async';
        im.onload = function () { ok[j] = 1; drin--; if (hatBitmap && j % RASTER === 0 && !rbmp[j] && !rLaeuft[j]) { rLaeuft[j] = 1; createImageBitmap(im, { resizeWidth: IW, resizeHeight: IH, resizeQuality: 'high' }).then(function (b) { rLaeuft[j] = 0; rbmp[j] = b; neu = true; weck(); }, function () { rLaeuft[j] = 0; }); } dekodiere(); pumpe(); };
        im.onerror = function () { drin--; bilder[j] = null; setTimeout(pumpe, 400); };
        im.src = name(j);
      })(j);
    }
  }
  /* ---------- Dekodier-Fenster: nur Bilder nahe der Stelle als fertige Bitmaps im Speicher ---------- */
  function imFenster(j) { var d = (j - aktuell) * richt; return d >= -FENSTER_ZURUECK && d <= FENSTER_VOR; }
  function dekodiere() {
    // alte Bitmaps freigeben
    for (var j = 0; j < M; j++) if (bmp[j] && !imFenster(j)) { if (bmp[j].close) bmp[j].close(); bmp[j] = null; }
    if (!hatBitmap) return;
    for (var d = 0; d <= FENSTER_VOR && dec < MAXDEC; d++) {
      var c = [aktuell + richt * d]; if (d && d <= FENSTER_ZURUECK) c.push(aktuell - richt * d);
      for (var q = 0; q < c.length && dec < MAXDEC; q++) {
        j = c[q]; // Kandidaten liegen per Definition im Fenster → keine Schließen-/Neu-Dekodieren-Schleife möglich
        if (j < 0 || j >= M || !ok[j] || bmp[j] || bmpLaeuft[j]) continue;
        bmpLaeuft[j] = 1; dec++;
        (function (j) {
          createImageBitmap(bilder[j], (W > 0 && W < IW) ? { resizeWidth: Math.max(640, W), resizeHeight: Math.max(360, Math.round(W * IH / IW)), resizeQuality: 'medium' } : undefined).then(function (b) {
            dec--; bmpLaeuft[j] = 0;
            if (imFenster(j)) { bmp[j] = b; if (Math.abs(j - platz(gezeigt)) < 2) neu = true; weck(); } else if (b.close) b.close();
            dekodiere();
          }, function () { dec--; bmpLaeuft[j] = 0; hatBitmap = false; });
        })(j);
      }
    }
  }
  // fertige Bitmap bevorzugt; ist das Bild geladen, aber noch nicht vorab dekodiert, wird es direkt gezeichnet (kein Stehenbleiben/Nachspringen)
  function quelle(k) { if (k < 0 || k >= M) return null; if (hatBitmap) return bmp[k] || rbmp[k] || null; return ok[k] ? bilder[k] : null; } // 21H1F: nie ein nicht dekodiertes <img> zeichnen (Sync-Decode 1080p = Hauptthread blockiert)

  /* ---------- Zeichnen ---------- */
  var cx = cv.getContext('2d', { alpha: false }), W = 0, H = 0, dpr = 1, L = null;
  var hg = sek.querySelector('.fs-hg'), hcx = hg.getContext('2d');
  function groesse() {
    var r = buehne.getBoundingClientRect();
    /* Pixel-Budget: die Filmbilder sind nur 1080p – ein 4K-Canvas (9,6 Mio Pixel) kostet auf Retina viel GPU-Zeit ohne mehr Schärfe */
    /* 20N-FIX4: wieder wie im alten, guten Film (vor Nacht-Bau): bis Retina 2× – die Bremse 1,5/1,25 machte den Film am Handy weich */
    dpr = Math.max(0.5, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.6e6 / Math.max(1, r.width * r.height))));
    W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var hgW = W > H ? 96 : 54; hg.width = hgW; hg.height = Math.round(hgW * H / W);
    L = lage(W, H, IW, IH);
    if (window.FILM_TELEFON && FILM_TELEFON.vor) FILM_TELEFON.vor(L);
    sek.classList.toggle('fs-band', !L.voll);
    if (hoch) sek.style.setProperty('--fs-ut', Math.round((L.y + L.h) / dpr + 18) + 'px');
    neu = true;
  }
  var gezeigt = -1, gezeigtA = -1, neu = true;
  function malen(A, B, t) {
    cx.globalAlpha = 1; cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
    if (!L.voll) {
      var hw = hg.width, hh = hg.height, sc2 = Math.max(hw / IW, hh / IH);
      hcx.drawImage(A, (hw - IW * sc2) / 2, (hh - IH * sc2) / 2, IW * sc2, IH * sc2);
      cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
    }
    cx.drawImage(A, L.x, L.y, L.w, L.h);
    if (B && t > 0.04) { cx.globalAlpha = t; cx.drawImage(B, L.x, L.y, L.w, L.h); cx.globalAlpha = 1; }
    if (!L.voll) {
      var g = cx.createLinearGradient(0, L.y, 0, L.y + H * 0.04);
      g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = g; cx.fillRect(L.x, L.y, L.w, H * 0.04);
      g = cx.createLinearGradient(0, L.y + L.h, 0, L.y + L.h - H * 0.04);
      g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = g; cx.fillRect(L.x, L.y + L.h - H * 0.04, L.w, H * 0.04);
    }
    if (poster && !poster.hidden) poster.hidden = true;
  }
  // zeichnet Bildposition f (Kommazahl). Gibt die tatsächlich gezeigte Position zurück (bei fehlendem Bild: Stand halten).
  function zeichne(f) {
    var s = platz(f), a = Math.floor(s), t = s - a, b = Math.min(M - 1, a + 1);
    var A = quelle(a);
    if (!A) {
      // fehlt: in Richtung des zuletzt Gezeigten das nächste fertige Bild (max. 6 Plätze), sonst das nächste Rasterbild – nie schwarz
      var zur = gezeigtA >= 0 ? (gezeigtA < a ? -1 : 1) : -1;
      for (var d = 1; d <= 6 && !A; d++) { A = quelle(a + zur * d); if (A) a = a + zur * d; }
      if (!A) { var r0 = Math.min(M - 1, Math.round(s / RASTER) * RASTER), r1 = Math.floor(s / RASTER) * RASTER, r2 = Math.min(M - 1, r1 + RASTER); A = quelle(r0); if (A) a = r0; else { A = quelle(r1); if (A) a = r1; else { A = quelle(r2); if (A) a = r2; } } }
      if (!A) return false;
      t = 0;
    }
    var B = (t > 0.04 && b !== a) ? quelle(b) : null;
    malen(A, B, B ? t : 0); gezeigtA = a;
    if (window.FILM_TELEFON && f > 373 && f < 522) window.FILM_TELEFON.zeichne(cx, L, f); // 24H1: scharfes Handy-Display in nativer Auflösung
    return true;
  }

  /* ---------- Scroll → Bild (zeitbasierte Dämpfung) ---------- */
  var ziel = 0, glatt = 0, laeuft = false, sichtbar = true, angefangen = false, filmAktiv = null, kopfWeg = null, blende = -1, letzteZeit = 0;
  var TAU = 0.085; // Sekunden – wie „schwer“ der Film dem Scroll folgt
  var sTop = 0, sH = 1;
  function messen() { sTop = sek.getBoundingClientRect().top + (window.scrollY || pageYOffset); sH = sek.offsetHeight; }
  addEventListener('load', function () { messen(); weck(); });
  function fortschritt() {
    var r = sek.getBoundingClientRect(), weg = sek.offsetHeight - innerHeight;
    return klemm(-r.top / Math.max(1, weg), 0, 1);
  }
  function bild(zeit) {
    laeuft = false; if (!sichtbar) return;
    if (window.__filmMess && window.__filmMess.an && letzteZeit) window.__filmMess.d.push(zeit - letzteZeit); // 24H1: Messhook (Bildabstände in ms), Auswertung: __filmMess.auswerten()
    var dt = letzteZeit ? Math.min(0.1, (zeit - letzteZeit) / 1000) : 0.016; letzteZeit = zeit;
    var sy = window.scrollY || pageYOffset, rTop = sTop - sy, r = { top: rTop, bottom: rTop + sH }; /* keine Layout-Lesung im Bild-Takt: Maße nur bei resize/load */
    var pp = klemm(-r.top / Math.max(1, sH - innerHeight), 0, 1);
    if (pp < 0.97 && Date.now() - skipZeit > 1800) uebersprungen = false;
    ziel = bildAus(pp);
    if (Math.abs(ziel - glatt) > 90) { glatt = ziel; schnell = performance.now(); neu = true; } // Sprung (Menü, Knopf): direkt Zielzustand, kein Durchspulen
    var k = 1 - Math.exp(-dt / TAU);
    glatt += (ziel - glatt) * k;
    if (Math.abs(ziel - glatt) < 0.01) glatt = ziel;
    var nj = Math.round(platz(glatt));
    if (nj !== aktuell) { var nr = nj > aktuell ? 1 : -1; if (nr !== richt) { richt = nr; } if (Math.abs(nj - aktuell) * S > 24) schnell = performance.now(); aktuell = nj; pumpe(); dekodiere(); }
    if (neu || Math.abs(glatt - gezeigt) > 0.004) { if (zeichne(glatt)) { gezeigt = glatt; neu = false; } else { neu = true; } }
    texteSetzen(glatt);
    if (leiste) leiste.style.transform = 'scaleX(' + (glatt / (N - 1)).toFixed(4) + ')';
    if (glatt > 3) { if (!angefangen) { angefangen = true; sek.classList.add('fs-laeuft'); } } else if (angefangen && glatt < 1) { angefangen = false; sek.classList.remove('fs-laeuft'); }
    sek.classList.toggle('fs-ende', pp > 0.965);
    var ueber = innerHeight - r.bottom;
    var b = uebersprungen && pp >= 0.97 ? 1 : klemm(ueber / (innerHeight * 0.22), 0, 1);
    if (b !== blende) { blende = b; buehne.style.opacity = (1 - b).toFixed(3); sek.classList.toggle('fs-weg', b >= 1); }
    var akt = r.bottom > innerHeight * 0.35 && b < 0.5;
    if (akt !== filmAktiv) { filmAktiv = akt; root.classList.toggle('film-aktiv', akt); if (!akt) dispatchEvent(new Event('film-frei')); }
    var kw = akt && glatt >= 1100;
    if (kw !== kopfWeg) { kopfWeg = kw; root.classList.toggle('fs-kopf-weg', kw); }
    if (glatt !== ziel || neu) weck(); else letzteZeit = 0;
  }
  function weck() { if (!laeuft && sichtbar && !document.hidden) { laeuft = true; requestAnimationFrame(bild); } }

  addEventListener('scroll', weck, { passive: true });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { letzteZeit = 0; neu = true; weck(); } });
  addEventListener('pagehide', function (e) { if (e.persisted) return; for (var j = 0; j < M; j++) if (bmp[j] && bmp[j].close) bmp[j].close(); });
  function satzPruefen() {
    var h = !!(mqHoch && mqHoch.matches); if (h === hoch) return;
    hoch = h; satz(); neuLaden(); pumpe();
  }
  addEventListener('resize', function () { satzPruefen(); messen(); groesse(); weck(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
    sichtbar = e[0].isIntersecting;
    if (sichtbar) { clearTimeout(entlT); if (entl) { entl = false; neuLaden(); } neu = true; letzteZeit = 0; pumpe(); dekodiere(); weck(); }
    else { clearTimeout(entlT); entlT = setTimeout(entladen, 2500); filmAktiv = false; kopfWeg = false; root.classList.remove('film-aktiv'); root.classList.remove('fs-kopf-weg'); dispatchEvent(new Event('film-frei')); }
  }).observe(sek);
  weiter.addEventListener('click', knopf);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && fortschritt() < 0.98 && sek.getBoundingClientRect().bottom > innerHeight * 0.5) knopf();
  });
  // Testzugriff (nur Diagnose): Ladestand
  window.__film = { stand: function () { var n = 0, m = 0; for (var j = 0; j < M; j++) { n += ok[j]; m += bmp[j] ? 1 : 0; } return { plaetze: M, schritt: S, geladen: n, dekodiert: m, gezeigt: gezeigt, ziel: ziel, glatt: glatt, aktuell: aktuell, richt: richt, dec: dec, hatBitmap: hatBitmap, neu: neu, laeuft: laeuft, sichtbar: sichtbar, bmpZiel: !!bmp[Math.round(platz(ziel))], okZiel: ok[Math.round(platz(ziel))] }; } };
  /* 24H1 Messhook für den Mess-Chat am Mac: __filmMess.start(); … scrollen … __filmMess.auswerten() → {bilder, mittel, p95, p99, ueber25ms, ueber50ms, max} */
  window.__filmMess = { an: false, d: [],
    start: function () { this.d = []; this.an = true; letzteZeit = 0; },
    auswerten: function () { this.an = false; var d = this.d.slice().sort(function (a, b) { return a - b; }), n = d.length; if (!n) return null;
      var sum = 0, o25 = 0, o50 = 0; for (var i = 0; i < n; i++) { sum += d[i]; if (d[i] > 25) o25++; if (d[i] > 50) o50++; }
      return { bilder: n, mittel: +(sum / n).toFixed(2), p95: +d[Math.floor(n * .95)].toFixed(1), p99: +d[Math.floor(n * .99)].toFixed(1), ueber25ms: o25, ueber50ms: o50, max: +d[n - 1].toFixed(1) }; } };
  neuLaden(); messen(); groesse(); pumpe(); weck();
})();
