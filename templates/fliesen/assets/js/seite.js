/* Kachelwerk Brandl – Seitenlogik (ohne Bibliotheken, läuft per Doppelklick). */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var de = function (n, d) { return n.toLocaleString('de-DE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };

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

  /* Zahlen zählen hoch (Zahl steht schon im HTML, nur optisch) */
  function zaehle(el) {
    var z = parseFloat(el.dataset.zahl), nach = el.dataset.nach || '', t0 = null;
    if (reduce || !z) return;
    function f(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1300); p = 1 - Math.pow(1 - p, 3); el.textContent = de(Math.round(z * p)) + nach; if (p < 1) requestAnimationFrame(f); }
    requestAnimationFrame(f);
  }
  /* Einblenden */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('da'); io.unobserve(e.target);
      $$('[data-zahl]', e.target).forEach(zaehle);
    });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  $$('.auf').forEach(function (el) { io ? io.observe(el) : el.classList.add('da'); });
  $$('h1,h2').forEach(function (h) { if (!h.closest('.auf') && !h.closest('.fk')) { io ? io.observe(h) : h.classList.add('da'); } });

  /* Heldenbild neigt sich mit der Maus (gebündelt über rAF) */
  var held = $('#held');
  if (held && !reduce && matchMedia('(pointer:fine)').matches) {
    var hx = 0, hy = 0, hr = 0;
    held.addEventListener('pointermove', function (e) {
      var r = held.getBoundingClientRect(); hx = (e.clientX - r.left) / r.width - .5; hy = (e.clientY - r.top) / r.height - .5;
      if (!hr) hr = requestAnimationFrame(function () { hr = 0; held.style.transform = 'perspective(1100px) rotateY(' + (hx * 7) + 'deg) rotateX(' + (-hy * 7) + 'deg)'; });
    });
    held.addEventListener('pointerleave', function () { held.style.transition = 'transform .8s'; held.style.transform = ''; setTimeout(function () { held.style.transition = ''; }, 800); });
  }

  /* ===== Scroll-Film: Aufbau der Dusche (vorgerenderte Blender-Bildfolge, weich überblendet, mit Trägheit) ===== */
  var F = window.FILM, cv = $('#filmcv');
  if (F && cv) {
    var ctx = cv.getContext('2d'), buehne = $('.aufbau .buehne'), liste = $('#schritte'), znr = $('#znr'), ht = $('#handytext');
    var bilder = [], fpos = -1, fziel = 0, flauf = false, schritt = -1, geo = null;
    F.steps.forEach(function (s) { var li = document.createElement('li'); li.innerHTML = '<b>' + s.t + '</b><small>' + s.s + '</small>'; liste.appendChild(li); });
    var lis = $$('li', liste);
    var schilder = F.steps.map(function (s) { var d = document.createElement('div'); d.className = 'schild'; d.innerHTML = '<i></i><span>' + s.t + '</span>'; $('#film').appendChild(d); return d; });
    for (var i = 0; i < F.nf; i++) (function (i) { var im = new Image(); im.decoding = 'async'; im.src = F.daten ? F.daten[i] : F.pfad + ('00' + i).slice(-3) + '.webp'; im.onload = function () { if (Math.abs(i - fpos) <= 2) zeichne(); }; bilder[i] = im; })(i);
    var dpr = Math.min(devicePixelRatio || 1, 1.75);
    function groesse() { var r = cv.getBoundingClientRect(); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); geo = null; zeichne(); }
    function ok(k) { return bilder[k] && bilder[k].complete && bilder[k].naturalWidth; }
    function naechst(n) { n = Math.max(0, Math.min(F.nf - 1, n)); for (var k = n; k >= 0; k--) if (ok(k)) return k; return -1; }
    function fortschritt() { var r = buehne.getBoundingClientRect(); return Math.max(0, Math.min(1, -r.top / (r.height - innerHeight))); }
    function male(im, a) {
      if (!geo) { var s = Math.min(cv.width / im.naturalWidth, cv.height / im.naturalHeight); geo = { w: im.naturalWidth * s, h: im.naturalHeight * s }; geo.x = (cv.width - geo.w) / 2; geo.y = (cv.height - geo.h) / 2; }
      ctx.globalAlpha = a; ctx.drawImage(im, geo.x, geo.y, geo.w, geo.h);
    }
    function zeichne() {
      var f = fpos < 0 ? 0 : fpos, a = naechst(Math.floor(f)), b = naechst(Math.floor(f) + 1);
      if (a < 0) return;
      ctx.clearRect(0, 0, cv.width, cv.height); male(bilder[a], 1);
      if (b > a) { var t = f - a; if (t > .01) male(bilder[b], Math.min(1, t)); }
      ctx.globalAlpha = 1;
      var st = Math.min(F.steps.length - 1, Math.floor(f / F.seg));
      if (st !== schritt) {
        schritt = st;
        lis.forEach(function (li, j) { li.classList.toggle('an', j === st); li.classList.toggle('fertig', j < st); });
        znr.textContent = ('0' + (st + 1)).slice(-2);
        if (ht) ht.innerHTML = '<b>' + F.steps[st].t + '</b>' + F.steps[st].s;
      }
      var fr = Math.round(f);
      schilder.forEach(function (d, j) {
        var on = j === st && (f - st * F.seg) > F.seg * 0.55;
        d.classList.toggle('an', on);
        if (on && geo) { var L = F.labels[fr][j], x = (geo.x + L[0] * geo.w) / dpr, y = (geo.y + L[1] * geo.h) / dpr; d.style.left = x + 'px'; d.style.top = y + 'px'; d.classList.toggle('links', x > cv.width / dpr * 0.62); }
      });
    }
    function tick() { var d = fziel - fpos; if (fpos < 0 || reduce || Math.abs(d) < .02) { fpos = fziel; flauf = false; } else { fpos += d * .16; requestAnimationFrame(tick); } zeichne(); }
    function scroll() { fziel = fortschritt() * (F.nf - 1); if (!flauf) { flauf = true; requestAnimationFrame(tick); } }
    addEventListener('scroll', scroll, { passive: true });
    addEventListener('resize', groesse); groesse(); scroll();
  }

  /* ===== Vorher / Nachher ===== */
  var vn = $('#vn');
  if (vn) {
    var setz = function (p) { p = Math.max(2, Math.min(98, p)); vn.style.setProperty('--p', p + '%'); vn.setAttribute('aria-valuenow', Math.round(p)); };
    var zieh = false, gezeigt = false;
    function pos(e) { var r = vn.getBoundingClientRect(); setz((e.clientX - r.left) / r.width * 100); }
    vn.addEventListener('pointerdown', function (e) { zieh = true; pos(e); vn.setPointerCapture && vn.setPointerCapture(e.pointerId); });
    vn.addEventListener('pointermove', function (e) { if (zieh) pos(e); });
    addEventListener('pointerup', function () { zieh = false; });
    vn.addEventListener('keydown', function (e) { var v = parseFloat(vn.getAttribute('aria-valuenow')); if (e.key === 'ArrowLeft') setz(v - 5); if (e.key === 'ArrowRight') setz(v + 5); });
    // kurze Demo-Bewegung beim ersten Anblick
    if (!reduce && 'IntersectionObserver' in window) new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting || gezeigt) return; gezeigt = true; o.disconnect();
      var t0 = null; requestAnimationFrame(function a(t) { if (zieh) return; if (!t0) t0 = t; var q = (t - t0) / 2200; if (q > 1) { setz(50); return; } setz(50 + Math.sin(q * Math.PI * 2) * 28 * (1 - q)); requestAnimationFrame(a); });
    }, { threshold: .5 }).observe(vn);
  }

  /* ===== Fliesenrechner ===== */
  var R = { format: '60x120', art: 'gerade', fuge: 3 };
  var VER = { gerade: .10, halb: .12, drittel: .12, diagonal: .15 };
  function wahl(id, key, num) {
    $$('#' + id + ' button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#' + id + ' button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        R[key] = num ? parseFloat(b.dataset.v) : b.dataset.v; rechne();
      });
    });
  }
  wahl('w-format', 'format'); wahl('w-art', 'art'); wahl('w-fuge', 'fuge', true);
  var rl = $('#r-l'), rb = $('#r-b');
  if (rl) { rl.addEventListener('input', rechne); rb.addEventListener('input', rechne); rechne(); }
  function rechne() {
    var L = parseFloat(rl.value), B = parseFloat(rb.value), A = L * B;
    $('#o-l').textContent = de(L, 1) + ' m'; $('#o-b').textContent = de(B, 1) + ' m';
    var fm = R.format.split('x').map(Number), a = fm[0], b = fm[1];           // cm
    var v = VER[R.art], Ab = A * (1 + v), stk = Math.ceil(Ab / (a * b / 1e4));
    var dicke = a >= 120 || b >= 120 ? 9 : 10;                                  // mm (üblich: 60×120/120×120 ca. 9–10 mm)
    // Kleber C2: kombiniertes Verfahren bei Großformat. Richtwerte je m²: 6 mm ≈ 2,5 kg, 8 mm ≈ 3,2 kg, 10 mm ≈ 4,0 kg (+ Buttering ≈ 0,8 kg)
    var zahn = Math.max(a, b) <= 30 ? 6 : (Math.max(a, b) <= 60 ? 8 : 10);
    var kg = { 6: 2.5, 8: 3.2, 10: 4.0 }[zahn] + (Math.max(a, b) >= 60 ? 0.8 : 0);
    // Fugenmörtel kg/m² = (A + B) / (A · B) · Fugenbreite · Fugentiefe · 1,6   (A, B, Breite, Tiefe in mm)
    var fug = ((a * 10 + b * 10) / (a * 10 * b * 10)) * R.fuge * dicke * 1.6;
    $('#e-stk').textContent = de(stk);
    $('#e-text').textContent = 'für ' + de(A, 1) + ' m² inklusive ' + Math.round(v * 100) + ' % Verschnitt';
    $('#e-flaeche').textContent = de(Ab, 1) + ' m²';
    $('#e-kleber').textContent = '≈ ' + de(Math.ceil(A * kg)) + ' kg';
    $('#e-fuge').textContent = '≈ ' + de(Math.max(1, Math.ceil(A * fug * 1.05))) + ' kg';
    $('#e-zahn').textContent = zahn + ' mm' + (Math.max(a, b) >= 60 ? ' + Buttering' : '');
    // kleine Vorschau des Fugenbilds
    var fb = $('#fliesbild'), s = 1.1, wpx = a * s, hpx = b * s;
    if (a !== b) { wpx = b * s; hpx = a * s; }
    var fu = Math.max(1, R.fuge * .45);
    var g = 'linear-gradient(90deg,rgba(201,137,91,.55) ' + fu + 'px,transparent ' + fu + 'px),linear-gradient(0deg,rgba(201,137,91,.55) ' + fu + 'px,transparent ' + fu + 'px)';
    fb.style.backgroundImage = g;
    fb.style.backgroundSize = wpx + 'px ' + hpx + 'px';
    fb.style.backgroundPosition = '0 0';
    if (R.art === 'halb' || R.art === 'drittel') {
      fb.style.backgroundImage = 'repeating-linear-gradient(0deg,transparent 0 ' + (hpx - fu) + 'px,rgba(201,137,91,.55) ' + (hpx - fu) + 'px ' + hpx + 'px)';
      fb.style.backgroundSize = 'auto';
      fb.innerHTML = verband(wpx, hpx, fu, R.art === 'halb' ? .5 : 1 / 3);
    } else if (R.art === 'diagonal') {
      fb.style.backgroundImage = 'repeating-linear-gradient(45deg,transparent 0 ' + (wpx * .7 - fu) + 'px,rgba(201,137,91,.55) ' + (wpx * .7 - fu) + 'px ' + (wpx * .7) + 'px),repeating-linear-gradient(-45deg,transparent 0 ' + (wpx * .7 - fu) + 'px,rgba(201,137,91,.55) ' + (wpx * .7 - fu) + 'px ' + (wpx * .7) + 'px)';
      fb.style.backgroundSize = 'auto'; fb.innerHTML = '';
    } else fb.innerHTML = '';
    var kn = $('#r-knopf'); if (kn) kn.dataset.text = 'Fläche ca. ' + de(A, 1) + ' m², Format ' + R.format.replace('x', ' × ') + ' cm, ' + R.art + ', Fuge ' + R.fuge + ' mm';
  }
  function verband(w, h, fu, off) {   // senkrechte Stoßfugen je Reihe versetzt (Halb-/Drittelverband)
    var out = '';
    for (var r = 0; r < 6; r++) {
      var o = -((r * off) % 1) * w;
      out += '<div style="position:absolute;left:0;right:0;top:' + (r * h) + 'px;height:' + h + 'px;background:repeating-linear-gradient(90deg,transparent 0 ' + (w - fu) + 'px,rgba(201,137,91,.55) ' + (w - fu) + 'px ' + w + 'px);background-position:' + o + 'px 0"></div>';
    }
    return out;
  }
  var rk = $('#r-knopf');
  if (rk) rk.addEventListener('click', function () { var t = $('#k-text'); if (t && !t.value) t.value = 'Fliesenrechner: ' + rk.dataset.text + '. '; });

  /* ===== Referenzen: Neigung, Lichtfleck, Lightbox ===== */
  var lb = $('#lightbox');
  $$('#ref figure').forEach(function (fg) {
    var rq = 0, ex = 0, ey = 0;
    if (!reduce && matchMedia('(pointer:fine)').matches) {
      fg.addEventListener('pointermove', function (e) {
        var r = fg.getBoundingClientRect(); ex = (e.clientX - r.left) / r.width; ey = (e.clientY - r.top) / r.height;
        if (!rq) rq = requestAnimationFrame(function () { rq = 0; fg.style.setProperty('--ry', ((ex - .5) * 6) + 'deg'); fg.style.setProperty('--rx', (-(ey - .5) * 6) + 'deg'); fg.style.setProperty('--mx', ex * 100 + '%'); fg.style.setProperty('--my', ey * 100 + '%'); });
      });
      fg.addEventListener('pointerleave', function () { fg.style.setProperty('--rx', '0deg'); fg.style.setProperty('--ry', '0deg'); });
    }
    fg.addEventListener('click', function () { $('img', lb).src = fg.dataset.gross; $('img', lb).alt = $('img', fg).alt; lb.classList.add('auf'); });
  });
  if (lb) { lb.addEventListener('click', function () { lb.classList.remove('auf'); }); addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('auf'); }); }

  /* ===== Kontaktformular (Beispiel: verschickt nichts) ===== */
  var f = $('#kontaktform'), h = $('#formhinweis');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (f.website.value) return;
    var fehlt = [];
    if (!f.name.value.trim()) fehlt.push('Ihren Namen');
    if (!f.telefon.value.trim()) fehlt.push('eine Telefonnummer');
    if (!f.thema.value) fehlt.push('worum es geht');
    if (!f.datenschutz.checked) fehlt.push('das Häkchen zum Datenschutz');
    if (fehlt.length) { h.textContent = 'Bitte noch ergänzen: ' + fehlt.join(', ') + '.'; return; }
    h.textContent = 'Danke! Im Beispiel-Template wird nichts verschickt – auf Ihrer echten Seite landet die Anfrage sofort bei Ihnen.';
  });

  /* ===== Fragen-Assistent ===== */
  var KB = [
    { k: ['bodengleich', 'dusche', 'stufe', 'walk'], q: 'Geht bei mir eine bodengleiche Dusche?', a: 'Meist ja. Entscheidend sind Aufbauhöhe und Abwasseranschluss. Mit flachen Rinnen reichen oft schon ca. 9–10 cm Aufbau. Wir prüfen das beim kostenlosen Aufmaß.' },
    { k: ['abdicht', 'dicht', 'din', 'wasser', 'schimmel'], q: 'Wie wird abgedichtet?', a: 'Im Duschbereich mit Verbundabdichtung nach DIN 18534: Grundierung, Dichtband in Ecken und an der Rinne, dann mindestens zwei Lagen Flüssigabdichtung – erst darauf kommen Kleber und Fliese.' },
    { k: ['kost', 'preis', 'teuer', 'euro'], q: 'Was kostet ein neues Bad?', a: 'Das hängt von Größe, Rückbau und Ausstattung ab. Nach dem kostenlosen Aufmaß bekommen Sie ein festes Angebot mit allen Positionen.' },
    { k: ['dauer', 'lange', 'wochen', 'zeit'], q: 'Wie lange dauert die Sanierung?', a: 'Ein komplettes Bad dauert je nach Umfang meist zwei bis drei Wochen. Den genauen Zeitplan bekommen Sie mit dem Angebot.' },
    { k: ['groß', 'gross', 'format', '120'], q: 'Verlegen Sie Großformat?', a: 'Ja, bis 120 × 120 cm. Dafür prüfen wir die Ebenheit des Untergrunds und arbeiten mit Kleber im kombinierten Verfahren (Kammbett + Buttering).' },
    { k: ['fuge', 'silikon', 'reparatur', 'kaputt'], q: 'Machen Sie auch kleine Reparaturen?', a: 'Ja – einzelne Fliesen tauschen, Fugen erneuern und Silikonfugen neu ziehen. Silikon ist eine Wartungsfuge und sollte regelmäßig kontrolliert werden.' },
    { k: ['terrasse', 'balkon', 'außen', 'frost'], q: 'Auch Terrasse und Balkon?', a: 'Ja, mit 2 cm starkem Feinsteinzeug auf Stelzlagern oder im Splittbett – frostsicher und mit sauberem Wasserablauf.' },
    { k: ['heizung', 'fußboden', 'fussboden'], q: 'Geht das auf Fußbodenheizung?', a: 'Ja. Wichtig ist, dass der Estrich vorher nach Aufheizprotokoll belegreif ist. Das klären wir mit Ihnen vorab.' },
    { k: ['termin', 'aufmaß', 'aufmass', 'rückruf', 'kontakt'], q: 'Aufmaß anfragen', a: 'Gern! Unten im Formular eintragen – wir melden uns am selben Werktag.', ziel: '#kontakt' }
  ];
  var vl = $('#verlauf'), ch = $('#chips'), assi = $('#assi');
  function sag(t, w) { var d = document.createElement('div'); d.className = 'msg ' + w; d.textContent = t; vl.appendChild(d); vl.scrollTop = vl.scrollHeight; }
  function antworte(text) {
    var t = text.toLowerCase(), best = null, bs = 0;
    KB.forEach(function (e) { var s = 0; e.k.forEach(function (k) { if (t.indexOf(k) > -1) s++; }); if (s > bs) { bs = s; best = e; } });
    setTimeout(function () {
      if (best) { sag(best.a, 'bot'); if (best.ziel) location.hash = best.ziel.slice(1); }
      else sag('Dazu habe ich keine sichere Antwort. Schreiben Sie uns kurz über das Formular – wir rufen Sie zurück.', 'bot');
    }, reduce ? 0 : 320);
  }
  if (vl) {
    sag('Hallo! Fragen zu Dusche, Abdichtung oder Ablauf? Einfach antippen:', 'bot');
    KB.forEach(function (e) { var b = document.createElement('button'); b.type = 'button'; b.textContent = e.q; b.onclick = function () { sag(e.q, 'ich'); antworte(e.k[0] + ' ' + e.q); }; ch.appendChild(b); });
    $('#assiform').addEventListener('submit', function (e) { e.preventDefault(); var i = $('#assiein'); if (!i.value.trim()) return; sag(i.value, 'ich'); antworte(i.value); i.value = ''; });
    var zu = $('#assizu');
    function toggle() { assi.classList.remove('mini'); var z = assi.classList.toggle('zu'); zu.textContent = z ? '+' : '–'; zu.setAttribute('aria-label', z ? 'Fragen-Assistent öffnen' : 'Fragen-Assistent einklappen'); }
    $('#assikopf').addEventListener('click', toggle);
    if (innerWidth < 700 || innerHeight < 600) toggle(); else assi.classList.add('mini');
    assi.addEventListener('click', function (e) { if (assi.classList.contains('mini') && !e.target.closest('#assizu')) assi.classList.remove('mini'); });
  }
})();
