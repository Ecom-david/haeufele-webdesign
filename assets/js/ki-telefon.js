/*! ki-telefon.js – Live-Demo „KI-Telefon mit Terminbuchung“ (Häufele Webdesign, 2026) · Version 2 (Chat W11-B)
    Besucher ruft beim erfundenen Muster-Betrieb an → wählt „Sprechen“ (freihändig, wie ein echtes Telefonat) oder
    „Schreiben“ → Chef geht nicht ran → KI-Stimme meldet sich (KI-Hinweis im ersten Satz) → Anliegen, Ort, Eile, Name
    → Termin wird KOMPLETT automatisch gefunden und eingetragen (eigener Kalender, ki-termine.js): „Keiner passt“
    führt zu einer Rückfrage und neuen freien Terminen, nie zu „der Chef meldet sich“. Stimme = vorab gerenderte
    Sätze je Stimme (assets/audio/telefon/<stimme>/*, Google Chirp 3 HD), Transkript Wort für Wort, Wellenform aus vorberechneter Pegelkurve
    (kein WebAudio, läuft per Doppelklick). Spracherkennung über die Web Speech API des Browsers (nur nach Wahl
    „Sprechen“). Nichts wird von dieser Seite gespeichert oder übertragen.                                        */
(function () {
  'use strict';
  var d = document, root = d.getElementById('ki-telefon'), KT = window.KiTermine;
  /* ---------- W12-B: mehrere Stimmen (je Stimme eigener Audio-Ordner + eigene Satz-Datei, nachgeladen per <script>) ---------- */
  var AV = window.KITEL_AUDIO_V = window.KITEL_AUDIO_V || {}, STIMMEN = window.KITEL_STIMMEN || [];
  var stimme = (function () {
    var g = ''; try { g = localStorage.getItem('kitel-stimme') || ''; } catch (e) {}
    if (STIMMEN.some(function (s) { return s.id === g; })) return g;
    var std = STIMMEN.filter(function (s) { return s.standard; })[0] || STIMMEN[0]; return std ? std.id : '';
  })();
  var A = window.KITEL_AUDIO || {}, aktiv = '', wartet = '';
  function nimm(id) { if (!AV[id]) return false; A = AV[id]; aktiv = id; return true; }
  function ladeStimme(id, fn) {
    if (!id || AV[id]) return fn && fn();
    var s = d.createElement('script'); s.src = 'assets/js/ki-telefon-audio-' + id + '.js';
    s.onload = s.onerror = function () { fn && fn(); }; (d.head || d.documentElement).appendChild(s);
  }
  if (STIMMEN.length && !nimm(stimme)) { STIMMEN.some(function (s) { return nimm(s.id); }); ladeStimme(stimme, function () { if (amSagen) wartet = stimme; else nimm(stimme); }); }
  var BASIS = (window.KITEL_BASIS || 'assets/audio/telefon/');
  var EXT = (function () { try { return new Audio().canPlayType('audio/ogg; codecs="opus"') ? '.ogg' : '.mp3'; } catch (e) { return '.mp3'; } })();
  function url(id, st) { st = st || aktiv; return BASIS + (st ? st + '/' : '') + id + EXT; }
  function fx(id) { return BASIS + id + EXT; }   // Klingeln, Weiter, Aufgelegt: für alle Stimmen gleich
  var REDUZ = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SCHNELL = !!window.KITEL_SCHNELL;   // nur für automatische Tests
  function warte(ms) { return SCHNELL ? 0 : ms; }

  /* ---------- Kapitel 03 im 3D-Handy: Gedrückt halten = echte Stimme hören ---------- */
  (function kapitel() {
    var halten = d.getElementById('halten'), tr = d.getElementById('transkript');
    if (tr) {
      var TR = [['KI-Telefon', 'Guten Tag, hier ist der digitale Assistent von Fliesen & Bad Muster. Ich bin eine KI.'], ['Anrufer', 'Ich bräuchte ein neues Bad, in Weißenhorn.'], ['KI-Telefon', 'Gern. Ich hätte am Donnerstag um halb fünf frei. Passt Ihnen das?'], ['Anrufer', 'Ja, das passt.']];
      var setz = function () { var ps = tr.querySelectorAll('p'); if (ps.length === TR.length && !/Ich bin eine KI/.test(tr.textContent)) ps.forEach(function (p, i) { p.innerHTML = '<b>' + TR[i][0] + '</b>'; p.appendChild(d.createTextNode(TR[i][1])); }); };
      setz(); if (window.MutationObserver) new MutationObserver(setz).observe(tr, { childList: true }); window.addEventListener('load', setz);
    }
    if (!halten || !A.gruss) return;
    var au = null;
    function an() { try { var u = url('gruss'); if (!au || au._u !== u) { au = new Audio(u); au._u = u; au.preload = 'auto'; } if (au.paused) { if (au.ended || au.currentTime > A.gruss.d - .3) au.currentTime = 0; au.play().catch(function () {}); } } catch (e) {} }
    function aus() { if (au && !au.paused) au.pause(); }
    halten.addEventListener('pointerdown', an); halten.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') an(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { halten.addEventListener(n, aus); });
    halten.addEventListener('keyup', aus);
    var lab = halten.querySelector('span'); if (lab && !/Ton/.test(lab.textContent)) lab.textContent = 'Gedrückt halten: Anruf annehmen · mit Ton';
  })();

  if (!root || !KT) return;
  var $ = function (s) { return root.querySelector(s); };
  var geraet = $('.kt-geraet'), log = $('.kt-log'), chipsEl = $('.kt-chips'), form = $('.kt-in'), inp = $('.kt-in input'),
      status = $('.kt-status'), uhr = $('.kt-zeit'), cv = $('.kt-welle'), cx = cv.getContext ? cv.getContext('2d') : null, kal = $('.kt-kal'), ende = $('.kt-ende'),
      chef = $('.kt-chef'), ton = $('.kt-ton'), start = $('.kt-start'), neu = $('.kt-neu'), sms = $('.kt-sms'), wahl = $('.kt-wahl'),
      hoerEl = $('.kt-hoer'), hoerT = $('.kt-hoer-t'), modBtn = $('.kt-mod'), tastBtn = $('.kt-tast');

  /* ---------- Hilfen ---------- */
  var TAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  function heute() { if (window.KITEL_HEUTE) return new Date(window.KITEL_HEUTE); return new Date(); }
  function n(s) { return KT.norm(s).replace(/\./g, ' ').replace(/\s+/g, ' ').trim(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function jetzt() { var x = heute(); return ('0' + x.getHours()).slice(-2) + ':' + ('0' + x.getMinutes()).slice(-2) + ' Uhr'; }
  function gross(s) { return s.replace(/(^|[\s-])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }); }

  /* ---------- Einzugsgebiet (Muster-Betrieb sitzt in Senden, ca. 30 km Umkreis) ---------- */
  var ORTE = ['Ulm', 'Neu-Ulm', 'Senden', 'Illertissen', 'Weißenhorn', 'Vöhringen', 'Pfaffenhofen', 'Elchingen', 'Nersingen', 'Bellenberg', 'Illerkirchberg', 'Erbach', 'Blaubeuren', 'Blaustein', 'Dornstadt', 'Langenau', 'Laupheim', 'Ehingen', 'Roggenburg', 'Holzheim', 'Oberkirchberg', 'Unterkirchberg', 'Wullenstetten', 'Burlafingen', 'Ludwigsfeld', 'Gerlenhofen', 'Babenhausen', 'Altenstadt', 'Günzburg', 'Leipheim', 'Dietenheim', 'Illerrieden', 'Beimerstetten', 'Offenhausen', 'Pfuhl', 'Söflingen', 'Wiblingen', 'Böfingen', 'Jungingen', 'Einsingen', 'Unterelchingen', 'Thalfingen', 'Straß', 'Witzighausen', 'Attenhofen'];
  var AUSSEN = ['München', 'Augsburg', 'Stuttgart', 'Memmingen', 'Kempten', 'Biberach', 'Heidenheim', 'Aalen', 'Göppingen', 'Kaufbeuren', 'Ravensburg', 'Friedrichshafen', 'Lindau', 'Landsberg', 'Nürnberg', 'Frankfurt', 'Berlin', 'Hamburg', 'Köln', 'Reutlingen', 'Tübingen', 'Esslingen', 'Donauwörth', 'Dillingen', 'Mindelheim', 'Kirchheim', 'Konstanz', 'Freiburg', 'Karlsruhe', 'Mannheim', 'Heilbronn', 'Ingolstadt', 'Regensburg', 'Würzburg', 'Düsseldorf', 'Dresden', 'Leipzig', 'Hannover', 'Bremen', 'Österreich', 'Schweiz'];
  function findeOrt(x) {
    function hit(liste) { return liste.filter(function (o) { return new RegExp('(^| )' + n(o).replace(/-/g, '[ -]?') + '( |$)').test(x); }).sort(function (a, b) { return b.length - a.length; })[0]; }
    var o = hit(ORTE); if (o) return { ort: o, st: 'in' };
    o = hit(AUSSEN); if (o) return { ort: o, st: 'aus' };
    return null;
  }
  function ortAusText(q) {   // freier Ort, z. B. „das ist in Hintertupfingen“
    var t = q.replace(/[.,!?]/g, ' ').replace(/^\s*(ja|also|aehm|ähm|äh)\s+/i, '').replace(/^\s*(das (bad )?ist |das liegt |wir wohnen |ich wohne |es ist |wohne )?(in |nach |bei |aus |im |am )?/i, '').trim();
    var w = t.split(/\s+/).filter(Boolean);
    if (!w.length || w.length > 3 || /\d/.test(t) || /^(ich|wir|was|wie|wo|wann|warum|kann|koennen|können|der|die|das|ein|eine|keine|nein|ja|weiss|weiß)$/i.test(w[0])) return '';
    return gross(w.join(' '));
  }

  /* ---------- Absichten ---------- */
  var R = {
    wiederholen: /^(wie bitte|bitte was|was|hae|he|nochmal|noch mal|noch einmal|bitte nochmal|bitte noch mal|bitte noch einmal|wiederholen|wiederholen sie( das)?( bitte)?|koennen sie das (bitte )?wiederholen|das hab ich nicht verstanden|das habe ich nicht verstanden|nicht verstanden|sorry was|entschuldigung was|was haben sie gesagt|ich hab sie nicht verstanden|ich habe sie nicht verstanden)$/,
    korrektur: /\b(ich meinte|ich meine|meinte ich|nicht (\S+ ){1,3}sondern|korrektur|das war falsch|falsch verstanden|stimmt nicht|ist falsch|nein (\S+ ){0,3}sondern|ich heisse nicht|der name ist falsch|der ort ist falsch|die nummer ist falsch)\b/,
    notfall: /rohrbruch|wasserrohr|wasser (laeuft|kommt|tritt|spritzt)|undicht|tropft|ueberschwemm|notfall|notdienst|\bleck\b|geplatzt|unter wasser|steht wasser|alles nass|ist nass|schimmel.*nass/,
    mensch: /\b(mit (einem |nem )?(menschen|mitarbeiter|chef|jemandem|person)|(einen|nen|einem) (menschen|mitarbeiter)|menschen sprechen|(echten|richtigen|realen) (menschen|person|mitarbeiter)|chef (sprechen|persoenlich|selbst)|den chef|ihren chef|rueckruf|zurueckrufen|ruft mich (\S+ )?zurueck|ruf(en sie)? mich (\S+ )?an|mensch sprechen|keine ki|kein roboter|mit dem chef)\b/,
    preis: /kost|preis|teuer|euro|wie viel|wieviel|budget|guenstig|was nimmt|stundensatz|angebot was/,
    region: /kommen sie|fahren sie|kommt ihr|einzugsgebiet|auch in |gebiet|bis nach|arbeiten sie (auch )?in|sind sie (auch )?in/,
    zeiten: /oeffnungszeit|geoeffnet|erreichbar|wann (sind|haben|kann ich)|arbeitszeit|feierabend|bis wann/,
    dusche: /dusche|bodengleich|duschwand|walk in/,
    fliesen: /fliese|kachel|fliesen|fugen|boden|wand/,
    bad: /\bbad\b|badezimmer|sanier|umbau|renovier|besichtigung|termin|modernis|barrierefrei|wc|gaeste ?wc/,
    ende: /^(danke|danke schoen|vielen dank|tschuess|ciao|nein danke|nee danke|das wars|das war s|das war es|das wars schon|nichts|nichts mehr|nein das wars|nein|ne|nee|noe|auf wiederhoeren|auf wiedersehen|bye|ich lege auf|alles klar danke|passt danke|super danke)( danke| tschuess| auf wiederhoeren)*$/,
    tschuess: /\b(tschuess|ciao|auf wiederhoeren|auf wiedersehen|ich lege (jetzt )?auf|bye)\b/,
    ja: /^(ja|jo|jap|jawohl|gern|gerne|ok|okay|klar|bitte|ja bitte|passt|gut|sehr gut|sehr gern|sehr gerne|unbedingt|genau|richtig|stimmt|machen wir|mach das|machen sie das|einverstanden|in ordnung|super|perfekt|prima|das passt|passt gut|ja gerne|ja gern|ja klar|ja genau|ja das passt|ja passt)\b/,
    nein: /^(nein|ne|nee|noe|nicht|kein|keine|lieber nicht|spaeter|eher nicht|nein danke|nee danke|danke nein)\b/,
    hallo: /^(hallo|guten tag|gruess gott|servus|moin|hi|hey|guten morgen|guten abend|hallo zusammen|hallo guten tag)$/,
    frage: /^(was|wie|wo|wann|warum|wieso|weshalb|welche|welcher|welches|wer|kann|koennen|koennt|haben|habt|machen|macht|gibt|ist|sind|muss|bieten)\b/
  };

  /* ---------- Zustand ---------- */
  var S, K, audio = null, spricht = null, amSagen = false, tStart = 0, timer = 0, raf = 0, verlaufBars = [], stumm = false, modus = null, busy = false;
  function reset() {
    stopHoeren(); modus = null; form.classList.remove('kt-sprechmodus');
    K = KT.kalender(heute());
    S = { phase: 'bereit', schritt: null, daten: { anliegen: '', ort: '', ortSt: '', eile: '', name: '', tel: '', termin: '', art: '', tun: '' },
          vorschlag: [], abgelehnt: {}, runden: 0, gebucht: null, letzte: null, gesagt: [], rf: null, vorAnliegen: '', chefVorrang: false, abbruch: false, stille: 0 };
    if (audio) { audio.pause(); audio = null; } spricht = null; busy = false; amSagen = false;
    log.innerHTML = ''; chipsEl.innerHTML = ''; kal.hidden = true; kal.innerHTML = ''; ende.hidden = true; sms.hidden = true; form.hidden = true; if (wahl) wahl.hidden = true;
    root.classList.remove('kt-laeuft', 'kt-fertig', 'kt-klingelt', 'kt-hoert', 'kt-kal-an', 'kt-waehlt-modus'); root.classList.add('kt-bereit');
    status.textContent = 'Muster-Betrieb · Firma erfunden'; uhr.textContent = '';
    clearInterval(timer); verlaufBars = []; chefUpd();
  }

  /* ---------- Chef-Karte (füllt sich live) ---------- */
  function chefUpd(gesendet) {
    var D = S.daten, F = [['Anrufer', D.name], ['Anliegen', D.anliegen], ['Ort', D.ort], ['Dringlichkeit', D.eile], ['Termin', D.termin], ['Telefon', D.tel], ['Für Sie zu tun', D.tun]];
    chef.querySelector('.kt-felder').innerHTML = F.map(function (f) { return '<div class="' + (f[1] ? 'an' : '') + (f[0] === 'Für Sie zu tun' ? ' kt-tun' : '') + '"><span>' + f[0] + '</span><b>' + (f[1] ? esc(f[1]) : '—') + '</b></div>'; }).join('');
    chef.querySelector('.kt-chef-st').textContent = gesendet ? (S.abbruch ? (S.verabschiedet ? 'Ohne Termin beendet · ' : 'Anruf abgebrochen · ') : 'Gesendet · ') + jetzt() : (S.phase === 'gespraech' ? 'Wird gerade ausgefüllt …' : 'Wartet auf Anruf');
    chef.classList.toggle('kt-gesendet', !!gesendet && !S.abbruch);
    chef.classList.toggle('kt-abgebrochen', !!gesendet && S.abbruch);
    chef.querySelector('.kt-foto').hidden = !(gesendet && S.gebucht);
  }

  /* ---------- Wellenform aus Pegelkurve ---------- */
  var DPR = Math.min((innerWidth < 760 ? 1.25 : 1.5), window.devicePixelRatio || 1);
  function groesse() { var r = cv.getBoundingClientRect(); cv.width = Math.max(10, r.width * DPR); cv.height = Math.max(10, r.height * DPR); }
  function pegel() {
    if (!spricht) return root.classList.contains('kt-hoert') && hoer.laut ? 0.18 + 0.5 * Math.random() * hoer.laut : 0;
    var a = A[spricht.id], t = spricht.audio && !spricht.audio.paused ? spricht.audio.currentTime : (performance.now() - spricht.t0) / 1000;
    var i = Math.floor(t * 25); if (!a || i >= a.p.length) return 0;
    return parseInt(a.p.charAt(i), 36) / 35;
  }
  function zeichne() {
    if (!cx) return;
    var W = cv.width, H = cv.height, nB = 46, bw = W / nB, hoert = root.classList.contains('kt-hoert');
    cx.clearRect(0, 0, W, H);
    var p = pegel(); if (hoer.laut) hoer.laut *= 0.9; verlaufBars.push(p); if (verlaufBars.length > nB) verlaufBars.shift();
    for (var i = 0; i < nB; i++) {
      var v = verlaufBars[verlaufBars.length - nB + i]; v = v == null ? 0 : v;
      var h = Math.max(2 * DPR, v * H * 0.92), x = i * bw + bw * 0.22, a = 0.25 + 0.75 * (i / nB);
      cx.fillStyle = hoert && !spricht ? 'rgba(127,216,143,' + (0.25 + 0.6 * (i / nB)) + ')' : 'rgba(243,242,239,' + (spricht ? a : 0.18) + ')';
      cx.fillRect(x, (H - h) / 2, bw * 0.56, h);
    }
    if (spricht) wortSync();
    /* 20N-FIX2: kein Gespräch, kein Zuhören, Wellen abgeklungen → Schleife schläft (los()/Zuhören wecken sie) */
    if (!spricht && !hoert && !root.classList.contains('kt-laeuft') && !verlaufBars.some(function (v) { return v > 0; })) { raf = 0; return; }
    raf = requestAnimationFrame(zeichne);
  }

  /* ---------- Transkript ---------- */
  function zeile(wer, text, klasse) {
    var p = d.createElement('div'); p.className = 'kt-z kt-' + wer + (klasse ? ' ' + klasse : '');
    p.innerHTML = '<small>' + (wer === 'ki' ? 'KI-Assistent' : wer === 'sys' ? 'Hinweis' : 'Sie') + '</small><p></p>';
    var q = p.querySelector('p'); if (text != null) q.textContent = text;
    log.appendChild(p); log.scrollTop = log.scrollHeight; return q;
  }
  function hinweis(text) { zeile('sys', text); }
  function wortSync() {
    var a = A[spricht.id], el = spricht.el; if (!a || !el._w) return;
    var t = spricht.audio && !spricht.audio.paused ? spricht.audio.currentTime : (performance.now() - spricht.t0) / 1000;
    var k = Math.min(el._w.length, Math.ceil(el._w.length * Math.min(1, (t - 0.12) / Math.max(0.5, a.d - 0.45))));
    if (k !== el._n) { el._n = k; el.textContent = el._w.slice(0, k).join(' ') + ' '; log.scrollTop = log.scrollHeight; }
  }

  /* ---------- Sprechen (KI): mehrere Sätze nacheinander in EINER Sprechblase ---------- */
  function sag(ids, danach, merken) {
    if (wartet && AV[wartet]) { nimm(wartet); wartet = ''; }
    ids = [].concat(ids).filter(function (i) { if (!A[i]) { if (window.console) console.warn('KI-Telefon: Satz fehlt', i); return false; } return true; });
    if (merken !== false) S.letzte = { ids: ids.slice(), danach: danach };
    stopHoeren(); chipsEl.innerHTML = ''; form.classList.add('kt-wartet'); busy = false;
    if (!ids.length) return danach && danach();
    amSagen = true; status.textContent = 'KI-Assistent spricht …'; root.classList.add('kt-spricht');
    var blase = zeile('ki', '');
    (function naechster() {
      var id = ids.shift(); S.gesagt.push(id);
      var el = d.createElement('span'); el._w = A[id].t.split(' '); el._n = 0; blase.appendChild(el);
      var fertig = false; spricht = { id: id, el: el, t0: performance.now(), audio: null };
      function weiter() {
        if (fertig || S.phase === 'fertig' && !S.endet) return; fertig = true; el.textContent = A[id].t + ' '; spricht = null;
        if (ids.length) return setTimeout(naechster, warte(170));
        amSagen = false; root.classList.remove('kt-spricht'); form.classList.remove('kt-wartet');
        status.textContent = modus === 'sprechen' ? 'Sie sind dran' : 'Sie sind dran – tippen oder antippen';
        danach && danach();
        if (S.phase === 'gespraech' && !spricht && !busy) setTimeout(hoerenWennNoetig, warte(120));
      }
      if (SCHNELL) return setTimeout(weiter, 0);
      if (!stumm) {
        try {
          var au = new Audio(url(id)); audio = au; spricht.audio = au;
          var notfallZeit = function () { spricht && (spricht.audio = null, spricht.t0 = performance.now()); setTimeout(weiter, A[id].d * 1000); };
          au.onended = weiter; au.onerror = notfallZeit;
          var pr = au.play(); if (pr && pr.catch) pr.catch(notfallZeit);
        } catch (e) { setTimeout(weiter, A[id].d * 1000); }
      } else setTimeout(weiter, (REDUZ ? 0.4 : 1) * A[id].d * 1000);
    })();
  }
  function chips(list) {
    chipsEl.innerHTML = '';
    (list || []).forEach(function (c, i) { var b = d.createElement('button'); b.type = 'button'; b.textContent = c; b.style.setProperty('--i', i); b.onclick = function () { eingabe(c); }; chipsEl.appendChild(b); });
    requestAnimationFrame(function () { log.scrollTop = log.scrollHeight; });
  }
  function ton1(id, ms, fn) { if (stumm || SCHNELL) return setTimeout(fn, warte(ms)); try { var a = new Audio(fx(id)); audio = a; a.play().catch(function () {}); } catch (e) {} setTimeout(fn, ms); }

  /* ---------- Spracherkennung (freihändig) ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var hoer = { rec: null, an: false, t8: 0, tEnde: 0, zw: '', live: null, erg: false, neustarts: 0, laut: 0 };
  function setModus(m, grund) {
    modus = m; form.classList.toggle('kt-sprechmodus', m === 'sprechen');
    if (modBtn) modBtn.hidden = !SR;
    if (m !== 'sprechen') { stopHoeren(); status.textContent = S && S.phase === 'gespraech' && !spricht ? 'Sie sind dran – tippen oder antippen' : status.textContent; }
    if (grund) hinweis(grund);
    if (m === 'sprechen') hoerenWennNoetig(); else if (S && S.phase === 'gespraech' && !spricht && inp && window.innerWidth > 980) inp.focus({ preventScroll: true });
  }
  function hoerenWennNoetig() {
    if (modus !== 'sprechen' || !SR || !S || S.phase !== 'gespraech' || spricht || busy || amSagen || hoer.an) return;
    hoeren();
  }
  function hoeren(neustart) {
    var rec;
    try { rec = new SR(); } catch (e) { return setModus('schreiben', 'Die Spracherkennung startet in diesem Browser nicht – kein Problem, schreiben Sie einfach.'); }
    hoer.rec = rec; hoer.an = true; hoer.zw = ''; hoer.erg = false; hoer.live = null;
    rec.lang = 'de-DE'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    root.classList.add('kt-hoert'); if (!raf) zeichne(); status.textContent = 'Ich höre zu …'; if (hoerT) hoerT.textContent = 'Ich höre zu …';
    if (!neustart) hoer.frist = Date.now() + (window.KITEL_STILLE_MS || 8000);
    clearTimeout(hoer.t8); hoer.t8 = setTimeout(stille, Math.max(0, hoer.frist - Date.now()));
    rec.onresult = function (e) {
      var fin = '', zw = '';
      for (var i = e.resultIndex; i < e.results.length; i++) { var r = e.results[i]; if (r.isFinal) fin += r[0].transcript; else zw += r[0].transcript; }
      hoer.laut = 1; clearTimeout(hoer.t8); S.stille = 0;
      var anzeige = (fin || zw).trim(); if (!anzeige) return;
      hoer.zw = anzeige;
      if (!hoer.live) { hoer.live = zeile('sie', '', 'kt-live'); }
      hoer.live.textContent = anzeige; log.scrollTop = log.scrollHeight;
      clearTimeout(hoer.tEnde);
      if (fin) return fertigGehoert(fin.trim());
      hoer.tEnde = setTimeout(function () { try { rec.stop(); } catch (x) {} }, 1400);   // Satzende per Stille
    };
    rec.onerror = function (e) {
      var g = e && e.error;
      if (g === 'not-allowed' || g === 'service-not-allowed') return aufSchreiben(location.protocol === 'file:' ? 'Ihr Browser gibt das Mikrofon hier nicht frei. Sprechen klappt auf der fertigen Website (https) – hier einfach schreiben.' : 'Kein Mikrofon freigegeben – kein Problem, schreiben Sie einfach.');
      if (g === 'audio-capture') return aufSchreiben('Kein Mikrofon gefunden – schreiben Sie einfach.');
      if (g === 'network') return aufSchreiben('Die Spracherkennung ist gerade nicht erreichbar – schreiben Sie einfach.');
      if (g === 'language-not-supported') return aufSchreiben('Deutsch wird von der Spracherkennung dieses Browsers nicht unterstützt – schreiben Sie einfach.');
      // no-speech / aborted: onend startet neu
    };
    rec.onend = function () {
      if (hoer.rec !== rec) return;
      clearTimeout(hoer.tEnde);
      if (hoer.erg) return;
      if (hoer.zw) return fertigGehoert(hoer.zw);
      if (hoer.an && modus === 'sprechen' && S.phase === 'gespraech') {   // Browser hört nach ein paar Sekunden Stille auf → leise neu starten
        hoer.an = false; if (++hoer.neustarts > 40) return aufSchreiben('Die Spracherkennung hat sich beendet – schreiben Sie einfach weiter.');
        clearTimeout(hoer.t8); setTimeout(function () { if (modus === 'sprechen' && !spricht && !busy && S.phase === 'gespraech' && !hoer.an) hoeren(true); }, 150);
      }
    };
    try { rec.start(); } catch (e) { hoer.an = false; aufSchreiben('Die Spracherkennung startet hier nicht – schreiben Sie einfach.'); }
  }
  function fertigGehoert(text) {
    if (hoer.erg) return; hoer.erg = true; var live = hoer.live;
    stopHoeren(); hoer.neustarts = 0;
    if (live) { var z = live.parentNode; z && z.parentNode && z.parentNode.removeChild(z); }
    eingabe(text);
  }
  function stille() {
    if (!hoer.an || hoer.zw) return;
    stopHoeren(); S.stille++;
    if (S.stille === 1) return sag('noch_dran', null, false);
    S.stille = 0; sag('nichts_gehoert', function () { setModus('schreiben'); wiederFrage(); }, false);
  }
  function stopHoeren() {
    clearTimeout(hoer.t8); clearTimeout(hoer.tEnde);
    var r = hoer.rec; hoer.rec = null; hoer.an = false; hoer.zw = '';
    if (r) { r.onresult = r.onend = r.onerror = null; try { r.abort(); } catch (e) {} }
    if (hoer.live && !hoer.erg) { var z = hoer.live.parentNode; z && z.parentNode && z.parentNode.removeChild(z); }
    hoer.live = null; root.classList.remove('kt-hoert');
  }
  function aufSchreiben(text) { stopHoeren(); if (modus === 'schreiben') return; setModus('schreiben', text); if (S.phase === 'gespraech' && !spricht) wiederFrage(true); }
  function mikroFreigabe(fertig) {   // fragt die Freigabe gleich beim Klick an (Nutzer-Geste), Tonspur wird sofort wieder geschlossen
    var md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) return fertig(true);
    var erledigt = false, t = setTimeout(function () { if (!erledigt) { erledigt = true; fertig(true); } }, 9000);
    md.getUserMedia({ audio: true }).then(function (st) { st.getTracks().forEach(function (x) { x.stop(); }); if (!erledigt) { erledigt = true; clearTimeout(t); fertig(true); } })
      .catch(function (e) { if (!erledigt) { erledigt = true; clearTimeout(t); fertig(false, e && e.name); } });
  }

  /* ---------- Schritte: Frage + Antwort-Chips ---------- */
  var STEP = {
    frei: { f: ['sonst_noch'], c: function () { chips(['Ich brauche ein neues Bad', 'Wasserrohrbruch!', 'Kommen Sie nach Weißenhorn?', 'Was kostet ein Bad?', 'Ich will einen Menschen sprechen', 'Wann sind Sie erreichbar?']); ph('Ihre Antwort …'); } },
    anliegen: { f: ['anliegen_frage'], c: function () { chips(['Ganzes Bad', 'Neue Fliesen', 'Neue Dusche', 'Etwas anderes']); ph('Ihre Antwort …'); } },
    ort: { f: ['ort_frage'], c: function () { var o = S.daten.ort; chips((o ? [o] : []).concat(['Weißenhorn', 'Senden', 'Neu-Ulm', 'Illertissen'].filter(function (x) { return x !== o; }))); ph('Ort …'); } },
    ort_umkreis: { f: ['ort_umkreis_frage'], c: function () { chips(['Ja, ganz in der Nähe', 'Nein, weiter weg']); ph('Ja oder nein …'); } },
    eile: { f: ['eile_frage'], c: function () { chips(['In den nächsten Monaten', 'Möglichst bald', 'Es ist etwas kaputt']); ph('Ihre Antwort …'); } },
    name: { f: ['name_frage'], c: function () { chips([]); ph('Ihr Name …'); fokus(); } },
    termin: { f: [], c: function () { zeigeKalender(); chips([]); ph('Termin antippen oder sagen …'); } },
    wann: { f: ['wann_frage'], c: function () { chips(['Vormittags', 'Nachmittags', 'Nächste Woche', 'Egal, Hauptsache bald']); ph('z. B. „Dienstag nachmittags“ …'); } },
    link_frage: { f: ['link_frage'], c: function () { chips(['Ja, schicken Sie den Link', 'Nein, weiter suchen']); ph('Ihre Antwort …'); } },
    nach_buchung: { f: ['sonst_noch'], c: function () { chips(['Nein danke, das war’s', 'Doch lieber ein anderer Termin']); ph('Ihre Antwort …'); } },
    notfall_frage: { f: ['notfall_chef_frage'], c: function () { chips(['Ja, bitte', 'Nein, danke']); ph('Ihre Antwort …'); } },
    notfall_daten: { f: ['notfall_daten_frage'], c: function () { chips([]); ph('Name und Ort …'); fokus(); } },
    rf: { f: [], c: function () { chips(S.rf ? S.rf.chips : []); ph('Ihre Antwort …'); } },
    anliegen_frei: { f: ['anliegen_frei_frage'], c: function () { chips([]); ph('Worum geht es?'); fokus(); } },
    m_name: { f: ['name_frage'], c: function () { chips([]); ph('Ihr Name …'); fokus(); } },
    m_tel: { f: ['mensch_nummer'], c: function () { chips(['Die Nummer, von der ich anrufe']); ph('Telefonnummer …'); fokus(); } },
    angebot: { f: ['termin_angebot'], c: function () { chips(['Ja, gern', 'Nein, danke']); ph('Ihre Antwort …'); } },
    rueckruf_angebot: { f: ['rueckruf_frage'], c: function () { chips(['Ja, bitte zurückrufen', 'Nein, danke']); ph('Ihre Antwort …'); } }
  };
  STEP.termin.f = function () { return [S.vorschlag.length > 1 ? 'frage2' : 'frage1']; };
  STEP.rf.f = function () { return [S.rf.id]; };
  function fragIds(st) { var f = STEP[st] && STEP[st].f; return typeof f === 'function' ? f() : (f || []); }
  function ph(t) { inp.placeholder = t; inp.type = /Telefon/.test(t) ? 'tel' : 'text'; }
  function fokus() { if (modus !== 'sprechen' && window.innerWidth > 980) inp.focus({ preventScroll: true }); }
  function geheZu(st, vorher) { S.schritt = st; sag([].concat(vorher || []).concat(fragIds(st)), function () { STEP[st].c(); }); }
  function wiederFrage(ohneTon) {   // aktuelle Frage nur als Chips/Eingabe zeigen (nach Moduswechsel)
    var st = S.schritt; if (st && STEP[st]) STEP[st].c(); if (!ohneTon) return;
  }

  /* ---------- Anruf ---------- */
  function anrufen() {
    if (S.phase !== 'bereit') return;
    if (wahl && !modus) return zeigeWahl();
    los();
  }
  function zeigeWahl() {
    S.phase = 'wahl'; root.classList.remove('kt-bereit'); root.classList.add('kt-waehlt-modus'); wahl.hidden = false; stimmenUI(); popZu();
    var bS = wahl.querySelector('[data-m="sprechen"]');
    if (!SR) { bS.disabled = true; bS.querySelector('small').textContent = 'In diesem Browser nicht verfügbar'; }
    status.textContent = 'Gleich geht’s los …';
    setTimeout(function () { (SR ? bS : wahl.querySelector('[data-m="schreiben"]')).focus({ preventScroll: true }); }, 50);
  }
  function gewaehlt(m) {
    if (S.phase !== 'wahl' && S.phase !== 'bereit') return;
    wahl.hidden = true; root.classList.remove('kt-waehlt-modus'); probeStop();
    if (m === 'sprechen' && SR) {
      status.textContent = 'Mikrofon wird freigegeben …';
      return mikroFreigabe(function (ok) {
        if (ok) { setModus('sprechen'); los(); }
        else { setModus('schreiben'); los(location.protocol === 'file:' ? 'Ihr Browser gibt das Mikrofon in dieser lokalen Datei nicht frei. Sprechen klappt auf der fertigen Website (https) – hier einfach schreiben.' : 'Kein Mikrofon freigegeben – kein Problem, Sie können schreiben.'); }
      });
    }
    setModus('schreiben'); los();
  }
  function los(hinweisText) {
    S.phase = 'waehlt'; root.classList.remove('kt-bereit', 'kt-waehlt-modus'); root.classList.add('kt-laeuft', 'kt-klingelt');
    status.textContent = 'Wählt 0000 000000 …'; uhr.textContent = '';
    if (hinweisText) hinweis(hinweisText);
    cancelAnimationFrame(raf); groesse(); zeichne();
    setTimeout(function () {
      if (S.phase !== 'waehlt') return;
      status.textContent = 'Es klingelt … der Chef ist auf der Baustelle';
      ton1('klingeln', REDUZ ? 600 : 5300, function () {
        if (S.phase !== 'waehlt') return;
        root.classList.remove('kt-klingelt');
        status.textContent = 'Nicht angenommen → Weiterleitung an KI-Assistent';
        ton1('weiter', 900, function () {
          if (S.phase !== 'waehlt') return;
          S.phase = 'gespraech'; tStart = Date.now(); form.hidden = false; chefUpd();
          timer = setInterval(function () { var s = Math.floor((Date.now() - tStart) / 1000); uhr.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2); }, 500);
          S.schritt = 'frei'; sag('gruss', STEP.frei.c);
        });
      });
    }, warte(500));
  }
  function auflegen(abbruch) {
    if (S.phase === 'fertig') return;
    var D = S.daten;
    S.abbruch = !!abbruch && !(D.art === 'notfall' && S.schritt !== 'notfall_frage' && S.schritt !== 'notfall_daten') && !(S.gebucht && S.schritt === 'nach_buchung');
    S.phase = 'fertig'; clearInterval(timer); chipsEl.innerHTML = ''; form.hidden = true; stopHoeren(); busy = false;
    if (audio) audio.pause(); spricht = null; amSagen = false; root.classList.remove('kt-spricht', 'kt-kal-an');
    ton1('aufgelegt', 700, function () {});
    status.textContent = (S.abbruch ? 'Aufgelegt · ' : 'Gespräch beendet · ') + (uhr.textContent || '00:00');
    root.classList.add('kt-fertig'); kal.hidden = true;
    var txt = '';
    if (S.abbruch) {
      D.tun = D.anliegen ? 'Anruf abgebrochen – Anliegen: ' + D.anliegen + (D.name ? ' · ggf. kurz zurückrufen' : '') : 'Nichts – Anruf ohne Anliegen beendet';
      if (!D.termin && S.vorschlag.length) D.termin = 'nicht gebucht (aufgelegt)';
    } else if (D.art === 'notfall') {
      txt = 'Fliesen & Bad Muster: Notdienst sofort erreichbar unter 0000 000000. Bitte den Hauptwasserhahn zudrehen!' + (S.chefVorrang ? ' Der Chef ist informiert und meldet sich.' : '');
      D.tun = S.chefVorrang ? 'Notdienst ist informiert · Kunde mit Vorrang zurückrufen' : 'Nichts – Notdienstnummer ist raus';
    } else if (S.gebucht) {
      txt = 'Fliesen & Bad Muster: Ihr Besichtigungstermin am ' + langDatum(S.gebucht) + ' ist bestätigt ✓ Fotos vorab hochladen: [Foto-Link]. Absagen oder verschieben: einfach auf diese SMS antworten.';
      D.tun = 'Nichts – Termin steht im Kalender ✓';
    } else if (D.art === 'link') {
      txt = 'Fliesen & Bad Muster: Hier wählen Sie selbst einen freien Besichtigungstermin: [Termin-Link]. Die Besichtigung ist kostenlos.';
      D.tun = 'Nichts – Kunde bucht selbst per Link';
    } else if (D.art === 'rueckruf' && D.tel) {
      txt = 'Fliesen & Bad Muster: Ihr Rückruf ist eingetragen – ' + S.rf.wahl + '. Der Chef ruft Sie ' + (/übermittelt/.test(D.tel) ? 'unter dieser Nummer' : 'unter ' + D.tel) + ' an.';
      D.tun = 'Rückruf ' + S.rf.wahl;
    } else {
      D.tun = D.ortSt === 'aus' ? 'Nichts – außerhalb des Einzugsgebiets, ehrlich abgesagt' : 'Nichts – Frage beantwortet';
    }
    if (txt) { sms.querySelector('p').textContent = txt; sms.hidden = false; }
    setTimeout(function () { chefUpd(true); ende.hidden = false; log.scrollTop = log.scrollHeight; }, warte(900));
  }
  function langDatum(s) { return KT.TAGL[s.dt.getDay()] + ', ' + s.dt.getDate() + '. ' + KT.MONL[s.dt.getMonth()] + ' ' + s.dt.getFullYear() + ', um ' + KT.zt(s.z) + ' Uhr'; }
  function endeSagen(ids, abbruch) { S.endet = true; sag([].concat(ids || 'ende'), function () { auflegen(!!abbruch); }); }

  /* ---------- Eingabe ---------- */
  function eingabe(roh) {
    var q = (roh || '').trim(); if (!q || S.phase !== 'gespraech' || spricht || busy || amSagen) return;
    stopHoeren(); busy = true;
    zeile('sie', q); inp.value = ''; chipsEl.innerHTML = '';
    var x = n(KT.sprache(q)), st = S.schritt;
    setTimeout(function () { busy = false; verarbeite(q, x, st); }, warte(REDUZ ? 120 : 420));
  }
  function verarbeite(q, x, st) {
    var D = S.daten;
    // 1) Wie bitte? → letzten Satz wiederholen
    var xw = x.replace(/\s*\bbitte\b\s*/g, ' ').trim();
    if ((R.wiederholen.test(x) || R.wiederholen.test(xw)) && S.letzte) return sag(['nochmal'].concat(S.letzte.ids), S.letzte.danach, false);
    // 2) Korrektur
    if (R.korrektur.test(x)) return korrektur(q, x, st);
    // 3) Notfall jederzeit
    if (R.notfall.test(x) && !/^notfall/.test(st)) { D.art = 'notfall'; D.anliegen = 'Wasserschaden / Rohrbruch'; D.eile = 'NOTFALL'; chefUpd(); kal.hidden = true; root.classList.remove('kt-kal-an'); return geheZu('notfall_frage', ['notfall']); }
    // 4) Verabschiedung jederzeit
    if (R.tschuess.test(x) && st !== 'm_tel' && st !== 'notfall_daten') { var offen = !S.gebucht && (D.art === 'termin' || D.art === 'rueckruf'); if (offen) S.verabschiedet = true; return endeSagen(offen ? 'ende_offen' : 'ende', offen); }
    // 5) ausdrücklich Rückruf / Mensch
    if (R.mensch.test(x) && st !== 'rf' && st !== 'm_name' && st !== 'm_tel') return mensch();
    // 6) Schritt-spezifisch
    var f = SCHRITT[st]; if (f) { var r = f(q, x); if (r !== false) return r; }
    // 7) Zwischenfragen mitten im Ablauf → kurz beantworten, dann zurück zur Frage
    if (st !== 'frei' && st !== 'angebot' && st !== 'rueckruf_angebot' && STEP[st]) {
      if (R.preis.test(x)) return sag(['preis_kurz'].concat(fragIds(st)), STEP[st].c);
      if (R.zeiten.test(x)) return sag(['zeiten_kurz'].concat(fragIds(st)), STEP[st].c);
      if (R.region.test(x) || findeOrt(x)) { var o = findeOrt(x); if (o) { D.ort = o.ort; D.ortSt = o.st; chefUpd(); } return sag([o && o.st === 'aus' ? 'region_nein' : 'region_ja'].concat(fragIds(st)), STEP[st].c); }
      if (R.frage.test(x) || /\?$/.test(q)) { D.notiz = q; return sag(['frage_notiert'].concat(fragIds(st)), STEP[st].c); }
      return sag(['nv_kurz'].concat(fragIds(st)), STEP[st].c);
    }
    return frei(q, x);
  }

  /* ---------- freie Fragen ---------- */
  function frei(q, x) {
    var D = S.daten;
    if (R.preis.test(x)) { S.vorAnliegen = /bad|sanier/.test(x) ? 'bad' : /dusche/.test(x) ? 'dusche' : /fliese/.test(x) ? 'fliesen' : ''; return geheZu('angebot', ['preis']); }
    var o = findeOrt(x);
    if (R.region.test(x) || o) {
      S.vorAnliegen = '';
      if (o) { D.ort = o.ort; D.ortSt = o.st; chefUpd(); }
      if (o && o.st === 'aus') { D.art = D.art || 'info'; S.schritt = 'frei'; return sag(['region_nein', 'sonst_noch'], STEP.frei.c); }
      if (o) return geheZu('angebot', ['region_ja']);
      var frei2 = ortAusText(q.replace(/^.*\b(nach|in|bis)\s+/i, ''));
      if (frei2 && /\b(nach|in|bis nach)\b/.test(x)) { D.ort = frei2; D.ortSt = '?'; chefUpd(); return geheZu('angebot', ['region_unbekannt']); }
      return geheZu('angebot', ['region_allg']);
    }
    if (R.zeiten.test(x)) { S.schritt = 'frei'; return sag(['zeiten_kurz', 'zeiten_rest', 'sonst_noch'], STEP.frei.c); }
    if (R.dusche.test(x)) return buchung('dusche');
    if (/\b(fliese|fliesen|kachel|kacheln|fugen)\b/.test(x)) return buchung('fliesen');
    if (R.bad.test(x)) return buchung(/\b(termin|besichtigung)\b/.test(x) && !/\bbad\b/.test(x) ? '' : 'bad');
    if (R.ende.test(x)) return endeSagen('ende');
    if (R.hallo.test(x)) { S.schritt = 'frei'; return sag(['hallo'], STEP.frei.c); }
    if (R.ja.test(x) && x.split(' ').length <= 3) { S.schritt = 'frei'; return sag(['gern_was'], STEP.frei.c); }
    if (x.split(' ').length <= 1 && !R.frage.test(x)) return sag(['nicht_verstanden'], STEP.frei.c);
    S.schritt = 'rueckruf_angebot'; D.anliegen = D.anliegen || 'Frage: ' + q.slice(0, 80); D.art = D.art || 'info'; chefUpd();
    return geheZu('rueckruf_angebot', ['unbekannt']);
  }

  /* ---------- Buchungs-Ablauf ---------- */
  var ANL = { bad: 'Badsanierung', fliesen: 'Neue Fliesen', dusche: 'Neue Dusche' };
  function buchung(anl) {
    var D = S.daten; D.art = 'termin';
    if (!anl) return geheZu('anliegen', []);
    D.anliegen = ANL[anl] || anl; chefUpd();
    var ack = ANL[anl] ? 'a_' + anl : 'a_sonst', ortOk = D.ort && D.ortSt === 'in', zahl = (ortOk ? 0 : 1) + (D.eile ? 0 : 1) + (D.name && D.name !== '(nicht genannt)' ? 0 : 1);
    var vor = [ack].concat(zahl === 3 ? ['fragen3'] : zahl === 2 ? ['fragen2'] : zahl === 1 ? ['fragen1'] : []);
    if (ortOk) return nachOrt(vor);
    return geheZu('ort', vor);
  }
  function nachOrt(prefix) {
    var D = S.daten;
    if (!D.eile) return geheZu('eile', prefix);
    if (!D.name) return geheZu('name', prefix);
    return planen({ leer: true, bald: true, tage: [], ohne: [] }, prefix.concat(['kal_intro']));
  }
  function nachName(prefix) { return planen({ leer: true, bald: true, tage: [], ohne: [] }, prefix.concat(['kal_intro'])); }

  var SCHRITT = {
    anliegen: function (q, x) {
      if (R.dusche.test(x)) return buchung('dusche');
      if (/\b(fliese|fliesen|kachel|boden|wand)\b/.test(x) && !/\bganz|komplett\b/.test(x)) return buchung('fliesen');
      if (/\b(bad|ganz|komplett|sanier|alles|badezimmer|renovier)\b/.test(x)) return buchung('bad');
      if (/\b(weiss nicht|weiss ich nicht|keine ahnung|beratung)\b/.test(x)) return buchung('Beratung vor Ort');
      if (/^etwas anderes$|^was anderes$|^anderes$/.test(x)) { S.daten.anliegen = 'Sonstiges'; chefUpd(); return geheZu('anliegen_frei', []); }
      if (R.frage.test(x) && /\?$/.test(q)) return false;
      return buchung(q.replace(/^(ich (brauche|möchte|moechte|haette gern|hätte gern|will)|es geht um|wir brauchen|eine?n?)\s+/i, '').replace(/[.!]$/, '').slice(0, 60));
    },
    anliegen_frei: function (q) { return buchung(q.replace(/[.!]$/, '').slice(0, 60)); },
    ort: function (q, x) {
      var D = S.daten, o = findeOrt(x);
      if (o) { D.ort = o.ort; D.ortSt = o.st; chefUpd(); if (o.st === 'aus') return ortAussen(); return nachOrt(['ort_ok']); }
      if (R.frage.test(x) && x.split(' ').length > 2) return false;
      var t = ortAusText(q); if (!t) return false;
      D.ort = t; D.ortSt = '?'; chefUpd(); return geheZu('ort_umkreis', ['ort_unbekannt']);
    },
    ort_umkreis: function (q, x) {
      var D = S.daten;
      if (R.ja.test(x) || /\b(nah|naehe|km|kilometer|um die ecke|nicht weit)\b/.test(x) && !/weit weg/.test(x)) { D.ortSt = 'in'; chefUpd(); return nachOrt(['ort_ja']); }
      if (R.nein.test(x) || /weit weg|weiter weg|weiter|ausserhalb/.test(x)) { D.ortSt = 'aus'; return ortAussen(); }
      return false;
    },
    eile: function (q, x) {
      var D = S.daten, kap = /kaputt|defekt|schaden|undicht|tropft|dringend|sofort|notfall|gebrochen|gerissen|loest sich|faellt ab/.test(x);
      if (R.frage.test(x) && /\?$/.test(q) && !kap) return false;
      D.eile = kap ? 'Schaden – bald ansehen' : /bald|schnell|zeitnah|eilig|wochen|sofort|asap|zuegig/.test(x) ? 'möglichst bald' : /monat|jahr|herbst|fruehjahr|sommer|winter|planung|plane|irgendwann|keine eile|nicht eilig|ruhe/.test(x) ? 'Planung, nächste Monate' : gross(q.slice(0, 40)); chefUpd();
      S.kaputt = kap;
      if (!D.name) return geheZu('name', [kap ? 'kaputt' : 'eile_ok']);
      return nachName([kap ? 'kaputt' : 'eile_ok']);
    },
    name: function (q, x) {
      var D = S.daten;
      if (/\b(warum|wieso|wofuer|muss ich|wozu)\b/.test(x)) return sag(['name_warum', 'name_frage'], STEP.name.c);
      if (/\b(moechte ich nicht|will ich nicht|lieber nicht|sag ich nicht|anonym|keine angabe)\b/.test(x)) { D.name = '(nicht genannt)'; chefUpd(); return nachName(['name_ohne']); }
      var nm = nameAus(q); if (!nm) return sag(['name_nochmal'], STEP.name.c);
      D.name = nm; chefUpd(); return nachName(['name_ok']);
    },
    termin: function (q, x) { return terminAntwort(q, x); },
    wann: function (q, x) {
      var p = KT.wunsch(q, heute(), null);
      if (p.leer && !p.bald) {
        if (/\b(weiss nicht|keine ahnung|schwer zu sagen|mal sehen|egal)\b/.test(x)) p.bald = true;
        else if (R.ja.test(x)) return sag(['wann_genauer'], STEP.wann.c);
        else if (R.nein.test(x) || p.ablehnen) return S.runden >= 2 ? linkAngebot() : sag(['wann_genauer'], STEP.wann.c);
        else return false;
      }
      return planen(p, []);
    },
    link_frage: function (q, x) {
      if (R.ja.test(x) || /\blink\b/.test(x) && !R.nein.test(x)) { S.daten.art = 'link'; S.daten.termin = 'Kunde wählt selbst (Link per SMS)'; if (!S.daten.tel) S.daten.tel = 'Anrufer-Nummer (übermittelt)'; chefUpd(); return endeSagen('link_ja'); }
      if (R.nein.test(x) || /weiter suchen|weitersuchen/.test(x)) { S.runden = 0; return geheZu('wann', ['link_nein']); }
      var p = KT.wunsch(q, heute(), null); if (!p.leer) return planen(p, []);
      return false;
    },
    nach_buchung: function (q, x) {
      var p = KT.wunsch(q, heute(), null);
      if (/\b(aender|anderer termin|anderen termin|andere zeit|doch lieber|doch nicht|lieber am|lieber doch|verschieben|umlegen|passt doch nicht|geht doch nicht)\b/.test(x) || (!p.leer && !R.ende.test(x))) {
        var alt = S.gebucht; S.gebucht = null; S.daten.termin = ''; chefUpd(); if (alt) { alt.frei = true; S.abgelehnt[alt.key] = true; markZelle(alt, 'f'); }
        if (p.leer || p.ablehnen && p.tage.length + (p.datum ? 1 : 0) + (p.von != null ? 1 : 0) + (p.bis != null ? 1 : 0) === 0) return geheZu('wann', ['aenderung']);
        return planen(p, ['aenderung']);
      }
      if (R.ende.test(x) || R.nein.test(x)) return endeSagen('ende');
      if (R.ja.test(x) && x.split(' ').length <= 3) { S.schritt = 'frei'; return sag(['gern_was'], STEP.frei.c); }
      return false;
    },
    notfall_frage: function (q, x) {
      if (R.nein.test(x)) return endeSagen('notfall_nein');
      if (R.ja.test(x) || /chef|informier|bescheid/.test(x)) { S.chefVorrang = true; return geheZu('notfall_daten', ['notfall_ja']); }
      return false;
    },
    notfall_daten: function (q, x) {
      var D = S.daten, o = findeOrt(x);
      if (o) { D.ort = o.ort; D.ortSt = o.st; }
      var rest = q.replace(o ? new RegExp('(,?\\s*(in|aus|wohne in|wohnhaft in|bei)?\\s*)' + o.ort.replace(/-/g, '[ -]?') + '.*$', 'i') : /$^/, '');
      if (!o) { var m = q.split(/,| aus | in | bei /); rest = m[0]; if (m[1]) D.ort = gross(m[1].trim()); }
      D.name = nameAus(rest) || D.name || '(nicht genannt)'; chefUpd();
      return endeSagen('notfall_ende');
    },
    rf: function (q, x) {
      var rf = S.rf, i = -1;
      if (/\b(erste|ersten|heute)\b/.test(x)) i = 0;
      if (/\b(zweite|zweiten|lieber morgen|nachmittag)\b/.test(x) && !/\bheute\b/.test(x)) i = rf.opts.length > 1 ? (rf.heute ? (/frueh|morgen frueh/.test(x) ? 1 : (/nachmittag/.test(x) && !/morgen|montag|dienstag|mittwoch|donnerstag|freitag/.test(x) ? 0 : 1)) : 1) : 0;
      if (/\b(frueh|vormittag|morgens|7|8)\b/.test(x)) i = rf.heute ? 1 : 0;
      if (i < 0 && /\b(16|17|18|abend|spaeter)\b/.test(x)) i = rf.heute ? 0 : 1;
      if (i < 0 && R.ja.test(x)) i = 0;
      if (i < 0) { if (/\b(egal|beides|passt beides)\b/.test(x)) i = 0; else return false; }
      rf.wahl = rf.opts[i]; S.daten.termin = 'Rückruf ' + rf.wahl; chefUpd();
      if (!S.daten.name || S.daten.name === '(nicht genannt)') return geheZu('m_name', ['rf_ok']);
      return geheZu('m_tel', ['rf_ok']);
    },
    m_name: function (q, x) {
      var nm = nameAus(q); if (!nm) return sag(['name_nochmal'], STEP.m_name.c);
      S.daten.name = nm; chefUpd(); return geheZu('m_tel', ['name_ok']);
    },
    m_tel: function (q, x) {
      var D = S.daten;
      if (/\b(von der ich anrufe|diese nummer|die gleiche|dieselbe|die selbe|angezeigt|uebermittelt|die hier|meine nummer|haben sie doch)\b/.test(x)) D.tel = 'Anrufer-Nummer (übermittelt)';
      else { var z = KT.ziffern(q); if (z.replace(/\D/g, '').length < 6) return sag(['nummer_nochmal'], STEP.m_tel.c); D.tel = telFormat(z); }
      inp.type = 'text'; chefUpd(); return endeSagen('mensch_ende');
    },
    angebot: function (q, x) {
      if (R.ja.test(x) || /\btermin\b/.test(x) && !R.nein.test(x)) return buchung(S.vorAnliegen || '');
      if (R.nein.test(x)) { S.daten.art = S.daten.art || 'info'; return geheZu('frei', []); }
      return false;
    },
    rueckruf_angebot: function (q, x) {
      if (R.ja.test(x)) return mensch();
      if (R.nein.test(x)) return geheZu('frei', []);
      return false;
    },
    frei: function () { return false; }
  };
  function ortAussen() { var D = S.daten; D.art = 'info'; chefUpd(); kal.hidden = true; return geheZu('frei', ['ort_aussen']); }
  function telFormat(z) { var d2 = z.replace(/[^\d+]/g, ''); if (/^0\d{9,}$/.test(d2)) return d2.slice(0, 4) + ' ' + d2.slice(4); if (/^0\d+$/.test(d2) && d2.length > 5) return d2.slice(0, 4) + ' ' + d2.slice(4); return d2; }
  function nameAus(q) {
    var t = q.replace(/[.!?]/g, '').trim().replace(/^(ja|also|aehm|ähm|äh|gut|okay|ok)[, ]+/i, '')
      .replace(/^(ich bin( der| die)?|ich heiße|ich heisse|mein name ist|mein name lautet|mein name|hier ist|hier spricht|das ist|am apparat( ist)?|name)\s+/i, '')
      .replace(/\s+(hier|am apparat|mein name|ist mein name|heiße ich|heisse ich)$/i, '').trim();
    if (/,/.test(t)) { var p = t.split(',').map(function (s) { return s.trim(); }).filter(Boolean); if (p.length === 2 && p[0].split(' ').length === 1 && p[1].split(' ').length === 1) t = p[1] + ' ' + p[0]; else t = p.join(' '); }
    var w = t.split(/\s+/).filter(Boolean);
    if (!w.length || w.length > 4 || /\d/.test(t) || t.length > 40) return '';
    if (w.length === 1 && findeOrt(n(t))) return '';
    if (/^(ich|wir|was|wie|wo|wann|warum|ja|nein|nee|keine|kein|okay|ok|danke|bitte|weiss|weiß|hallo)$/i.test(w[0]) && w.length === 1) return '';
    if (w.some(function (s) { return /^(ich|bin|wo|was|wie|warum|brauche|möchte|moechte|habe|haben|termin)$/i.test(s); })) return '';
    return w.map(function (s) { return /^(von|van|de|der|zu)$/i.test(s) ? s.toLowerCase() : s.charAt(0).toUpperCase() + s.slice(1); }).join(' ');
  }
  function korrektur(q, x, st) {
    var D = S.daten, o = findeOrt(x), teil = q.replace(/^.*\b(sondern|meinte|meine|korrektur|ist falsch|stimmt nicht)\b[:,]?\s*/i, '');
    var gefixt = false, ns = /\bnicht (.+?),? sondern (.+)$/i.exec(q);
    if (ns && D.name && n(D.name).indexOf(n(ns[1])) > -1 && nameAus(ns[2])) { D.name = nameAus(ns[2]); gefixt = true; o = null; }
    else if (ns && D.ort && n(D.ort).indexOf(n(ns[1])) > -1 && !findeOrt(n(ns[2]))) { D.ort = gross(ns[2].replace(/[.!?]/g, '').trim()); D.ortSt = '?'; gefixt = true; o = null; }
    if (gefixt) {}
    else if (o) { D.ort = o.ort; D.ortSt = o.st; gefixt = true; if (o.st === 'aus') { chefUpd(); return ortAussen(); } }
    else if (/\b(heisse|name|heiss)\b/.test(x)) { var nm = nameAus(teil.replace(/^(ich )?(heisse|heiße)\s+/i, '')); if (nm) { D.name = nm; gefixt = true; } }
    else if (KT.ziffern(teil).length >= 6) { D.tel = telFormat(KT.ziffern(teil)); gefixt = true; }
    else if (st === 'name' || st === 'm_name') { var nm2 = nameAus(teil); if (nm2) { D.name = nm2; gefixt = true; } }
    else if (st === 'termin' || st === 'nach_buchung' || st === 'wann') { var p = KT.wunsch(teil, heute(), S.vorschlag); if (!p.leer) { if (S.gebucht) return SCHRITT.nach_buchung(teil, n(KT.sprache('doch lieber ' + teil))); return terminAntwort(teil, n(KT.sprache(teil))); } }
    chefUpd();
    if (!gefixt) return sag(['korrektur_was'], STEP[st] ? STEP[st].c : null);
    // passende Fortsetzung: Frage des aktuellen Schritts wiederholen bzw. Ablauf fortsetzen
    if (st === 'ort' || st === 'ort_umkreis') return nachOrt(['korrigiert']);
    if (st === 'name' && D.name) return nachName(['korrigiert']);
    if (st === 'm_name' && D.name) return geheZu('m_tel', ['korrigiert']);
    if (st === 'm_tel' && D.tel) return endeSagen(['korrigiert', 'mensch_ende']);
    if (st === 'm_tel') return geheZu('m_tel', ['korrigiert']);
    if (st === 'nach_buchung' || !STEP[st]) { S.schritt = st; return sag(['korrigiert'].concat(fragIds(st)), STEP[st] ? STEP[st].c : null); }
    return sag(['korrigiert'].concat(fragIds(st)), STEP[st].c);
  }

  /* ---------- Termine ---------- */
  function planen(p, prefix) {
    var r = KT.suche(K, p, S.abgelehnt);
    if (!r.slots.length) { S.runden = 3; return linkAngebot(['kal_voll']); }
    if (p.spaeter || p.nach) { /* bereits berücksichtigt */ }
    S.vorschlag = r.slots;
    var ids = [].concat(prefix || []).concat(r.hinweis);
    if (!ids.length) ids.push('neu_suche');
    ids.push('v1_' + KT.sprechId(r.slots[0], K.heute));
    if (r.slots[1]) ids.push('v2_' + KT.sprechId(r.slots[1], K.heute));
    S.schritt = 'termin'; zeigeKalender(true);
    return sag(ids.concat(fragIds('termin')), STEP.termin.c);
  }
  function terminAntwort(q, x) {
    var vs = S.vorschlag, p = KT.wunsch(q, heute(), vs);
    function passtZu(s) { return KT.passt(s, p, K.heute); }
    if (p.beides) return waehle(vs[0], ['beides']);
    if (p.wahl != null && vs[p.wahl]) return waehle(vs[p.wahl]);
    if (p.frueher) {
      var frueher = alleFrei().filter(function (s) { return s.dt < vs[0].dt || (s.key < vs[0].key); }).filter(function (s) { return !S.abgelehnt[s.key] && vs.indexOf(s) < 0; });
      if (!frueher.length) return sag(['frueher_nicht'].concat(fragIds('termin')), STEP.termin.c);
      return planen({ tage: [], ohne: [], leer: false }, ['neu_suche']);
    }
    if (p.spaeter && !p.ablehnen && p.tage.length === 0 && !p.datum) { ablehnen(); p.nach = vs[vs.length - 1].dt; p.leer = false; return planen(p, ['neu_suche']); }
    var hatWunsch = p.tage.length || p.datum || p.von != null || p.bis != null || p.woche != null || p.ohne.length;
    if (hatWunsch) {
      var treffer = vs.filter(passtZu);
      if (treffer.length === 1 || (treffer.length > 1 && p.genau != null)) return waehle(treffer[0]);
      if (treffer.length === 2 && !p.ablehnen) return sag(['welcher'], function () { STEP.termin.c(); });
      // genau benannter freier Termin (z. B. Kalender-Zelle oder „Montag 15 Uhr“) direkt buchen
      if (p.genau != null && (p.datum || p.tage.length === 1)) {
        var genau = alleFrei().filter(function (s) { return !S.abgelehnt[s.key] && KT.min(s.z) === p.genau && (p.datum ? KT.key(s.dt) === KT.key(p.datum) : p.tage[0] === s.dt.getDay()) && (p.woche == null || KT.woche(s.dt, K.heute) === p.woche); })[0];
        if (genau) return waehle(genau);
      }
      ablehnen(true);
      if (S.runden >= 5) return linkAngebot();
      return planen(p, []);
    }
    if (p.ablehnen || R.nein.test(x)) {
      ablehnen(true);
      if (S.runden >= 3) return linkAngebot();
      return geheZu('wann', [S.runden === 1 ? 'kein_problem' : 'kein_problem2']);
    }
    if (p.bald) return waehle(vs[0], ['dann_frueher']);
    if (R.ja.test(x)) { if (vs.length === 1) return waehle(vs[0]); return sag(['welcher'], STEP.termin.c); }
    if (R.frage.test(x) || /\?$/.test(q)) return false;
    return sag(['nv_kurz'].concat(fragIds('termin')), STEP.termin.c);
  }
  function alleFrei() { var r = []; K.tage.forEach(function (t) { t.slots.forEach(function (s) { if (s.frei) r.push(s); }); }); return r; }
  function ablehnen(zaehlen) { S.vorschlag.forEach(function (s) { S.abgelehnt[s.key] = true; }); if (zaehlen) S.runden++; }
  function linkAngebot(vorher) { S.schritt = 'link_frage'; kal.hidden = true; root.classList.remove('kt-kal-an'); return geheZu('link_frage', [].concat(vorher || [])); }
  function waehle(slot, vorher) {
    var D = S.daten; S.gebucht = slot; slot.frei = false; if (!D.tel) D.tel = 'Anrufer-Nummer (übermittelt)'; D.termin = KT.anzeige(slot) + ' · Besichtigung'; chefUpd();
    S.vorschlag.forEach(function (v) { if (v !== slot) markZelle(v, 'f'); }); markZelle(slot, 'g'); var kb = kal.querySelector('.kt-vs'); if (kb) kb.innerHTML = '<div class="kt-ok"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Eingetragen · ' + esc(KT.anzeigeKurz(slot)) + '</span></div>';
    S.schritt = 'nach_buchung';
    return sag([].concat(vorher || []).concat(['ok_' + KT.sprechId(slot, K.heute), 'ok_rest', 'sonst_noch']), STEP.nach_buchung.c);
  }
  function mensch() {
    var D = S.daten; D.art = 'rueckruf'; D.anliegen = D.anliegen || 'Rückruf gewünscht'; chefUpd(); kal.hidden = true; root.classList.remove('kt-kal-an');
    S.rf = rueckrufFenster(); return geheZu('rf', ['mensch_a']);
  }
  function rueckrufFenster() {
    var h = heute(), heuteOffen = !KT.geschlossen(h) && (h.getHours() * 60 + h.getMinutes()) < 15 * 60 + 30;
    var nw = KT.plus(h, 1); while (KT.geschlossen(nw)) nw = KT.plus(nw, 1);
    var diff = Math.round((KT.tag0(nw) - KT.tag0(h)) / 864e5), nid = diff === 1 ? 'morgen' : KT.KURZ[nw.getDay()], nTxt = diff === 1 ? 'morgen' : KT.TAGL[nw.getDay()] + ', ' + nw.getDate() + '.';
    var nCh = diff === 1 ? 'Morgen' : KT.TAGL[nw.getDay()];
    if (heuteOffen) return { heute: true, id: 'rf_heute_' + nid, opts: ['heute zwischen 16 und 18 Uhr', nTxt + ' früh zwischen 7 und 8 Uhr'], chips: ['Heute 16–18 Uhr', nCh + ' früh 7–8 Uhr'] };
    return { heute: false, id: 'rf_' + nid, opts: [nTxt + ' früh zwischen 7 und 8 Uhr', nTxt + ' zwischen 16 und 18 Uhr'], chips: [nCh + ' früh 7–8 Uhr', nCh + ' 16–18 Uhr'] };
  }

  /* ---------- Kalender-Ansicht: Woche mit freien/belegten Zeiten ---------- */
  var ZEILEN = ['0730', '1000', '1300', '1500', '1630'];
  function kw(dt) { var x = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate())), w = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - w); var j = new Date(Date.UTC(x.getUTCFullYear(), 0, 1)); return Math.ceil(((x - j) / 864e5 + 1) / 7); }
  function zeigeKalender(neuAnimieren) {
    var vs = S.vorschlag; if (!vs.length) return;
    var mo = KT.plus(vs[0].dt, -((vs[0].dt.getDay() + 6) % 7)), tage = [0, 1, 2, 3, 4].map(function (i) { return KT.plus(mo, i); });
    var idx = {}; K.tage.forEach(function (t) { idx[t.key] = t; });
    var vk = {}; vs.forEach(function (s) { vk[s.key] = 1; });
    var h = '<div class="kt-kkopf"><small class="mono">Freie Termine · Besichtigung kostenlos</small></div>';
    h += '<div class="kt-grid" role="grid" aria-label="Kalender, Woche ' + kw(mo) + '"><span class="kt-gkw">KW ' + kw(mo) + '</span>' + tage.map(function (t) { var an = vs.some(function (s) { return KT.key(s.dt) === KT.key(t); }); return '<span class="kt-gt' + (an ? ' an' : '') + '">' + TAGE[t.getDay()] + '<b>' + t.getDate() + '</b></span>'; }).join('');
    ZEILEN.forEach(function (z) {
      h += '<span class="kt-gz mono">' + KT.zt(z).replace(/^0/, '') + '</span>';
      tage.forEach(function (t) {
        var tag = idx[KT.key(t)], s = tag && tag.slots.filter(function (x) { return x.z === z; })[0];
        if (!s) h += '<i class="x" title="geschlossen"></i>';
        else if (S.gebucht && S.gebucht.key === s.key) h += '<button type="button" class="g" data-k="' + s.key + '" aria-label="Gebucht"></button>';
        else if (vk[s.key]) h += '<button type="button" class="v" data-k="' + s.key + '" aria-label="' + esc(KT.anzeige(s)) + ' – vorgeschlagen"></button>';
        else if (s.frei && !S.abgelehnt[s.key]) h += '<button type="button" class="f" data-k="' + s.key + '" aria-label="' + esc(KT.anzeige(s)) + ' – frei"></button>';
        else h += '<i class="b" title="belegt"></i>';
      });
    });
    h += '</div><div class="kt-leg mono"><i class="v"></i>Vorschlag <i class="f"></i>frei <i class="b"></i>belegt</div><div class="kt-vs">' +
      vs.map(function (s, i) { return '<button type="button" data-i="' + i + '" aria-label="' + esc(KT.anzeige(s)) + '"><span>' + TAGE[s.dt.getDay()] + ', ' + s.dt.getDate() + '. ' + KT.MONL[s.dt.getMonth()].slice(0, 3).replace('Mär', 'März') + '</span><b>' + KT.zt(s.z) + '</b></button>'; }).join('') +
      '<button type="button" class="kt-keiner">Anderer Termin</button></div>';
    kal.innerHTML = h; kal.hidden = false; root.classList.add('kt-kal-an');
    if (neuAnimieren) { kal.classList.remove('kt-wechsel'); void kal.offsetWidth; kal.classList.add('kt-wechsel'); }
    kal.querySelectorAll('.kt-vs button').forEach(function (b) {
      b.onclick = function () { if (spricht || busy || amSagen || S.schritt !== 'termin') return; if (b.classList.contains('kt-keiner')) return eingabe('Ein anderer Termin, bitte'); var s = vs[+b.getAttribute('data-i')]; klickBuchen(s); };
    });
    kal.querySelectorAll('.kt-grid button').forEach(function (b) {
      b.onclick = function () { if (spricht || busy || amSagen || (S.schritt !== 'termin' && S.schritt !== 'wann')) return; var s = alleFrei().filter(function (x) { return x.key === b.getAttribute('data-k'); })[0]; if (s) klickBuchen(s); };
    });
    log.scrollTop = log.scrollHeight;
  }
  function klickBuchen(s) {
    stopHoeren(); busy = true; zeile('sie', KT.TAGL[s.dt.getDay()] + ', ' + s.dt.getDate() + '. ' + KT.MONL[s.dt.getMonth()] + ', ' + KT.zt(s.z) + ' Uhr'); chipsEl.innerHTML = '';
    setTimeout(function () { busy = false; waehle(s); }, warte(350));
  }
  function markZelle(s, kl) { var c = kal.querySelector('[data-k="' + s.key + '"]'); if (c) { c.className = kl; if (kl === 'g') { c.setAttribute('aria-label', 'Gebucht'); } } }

  /* ---------- Bedienung ---------- */
  start.addEventListener('click', anrufen);
  neu.addEventListener('click', function () { reset(); });
  if (wahl) wahl.querySelectorAll('[data-m]').forEach(function (b) { b.addEventListener('click', function () { gewaehlt(b.getAttribute('data-m')); }); });
  if (modBtn) modBtn.addEventListener('click', function () {
    if (!SR) return;
    mikroFreigabe(function (ok) { if (ok) { setModus('sprechen'); } else hinweis(location.protocol === 'file:' ? 'Ihr Browser gibt das Mikrofon in dieser lokalen Datei nicht frei. Sprechen klappt auf der fertigen Website (https).' : 'Kein Mikrofon freigegeben – Sie können weiter schreiben.'); });
  });
  if (tastBtn) tastBtn.addEventListener('click', function () { setModus('schreiben'); });
  $('.kt-auflegen').addEventListener('click', function () {
    if (S.phase === 'gespraech' || S.phase === 'waehlt') { var war = S.phase; if (audio) audio.pause(); spricht = null; root.classList.remove('kt-spricht'); if (war === 'waehlt') { reset(); return; } auflegen(true); }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); eingabe(inp.value); });
  ton.addEventListener('click', function () { stumm = !stumm; ton.setAttribute('aria-pressed', stumm ? 'true' : 'false'); ton.querySelector('span').textContent = stumm ? 'Ton aus' : 'Ton an'; if (audio) audio.muted = stumm; });
  /* ---------- W12-B: Stimme wählen (Auswahlfenster + Knopf oben) ---------- */
  var stBtn = $('.kt-stimme'), pop = $('.kt-stimmen-pop'), probeAu = null, probeT = 0;
  var WELLE = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="2" y="6" width="2" height="4" rx="1"/><rect x="7" y="3" width="2" height="10" rx="1"/><rect x="12" y="5" width="2" height="6" rx="1"/></svg>';
  function sname(id) { var s = STIMMEN.filter(function (x) { return x.id === id; })[0]; return s ? s.name : ''; }
  var gSeg = '';   // W12-B2: in der Auswahl gezeigtes Geschlecht (w|m)
  function stimmenUI() {
    var akt = STIMMEN.filter(function (x) { return x.id === stimme; })[0] || STIMMEN[0];
    var hatG = STIMMEN.some(function (s) { return s.g === 'w'; }) && STIMMEN.some(function (s) { return s.g === 'm'; });
    if (!gSeg) gSeg = akt.g;
    function knopf(s, lang) {
      return '<button type="button" class="kt-st' + (lang ? ' kt-st-z' : '') + '" role="radio" aria-checked="' + (s.id === stimme) + '" data-s="' + s.id + '" aria-label="' + s.name + ', ' + s.text + (s.standard ? ', empfohlen' : '') + '"><span>' + s.name + '</span>' + (lang ? '<small>' + s.text + '</small>' : '') + '</button>';
    }
    var wahl = (hatG ? '<div class="kt-gseg" role="group" aria-label="Frauen- oder Männerstimme"><button type="button" data-g="w" aria-pressed="' + (gSeg === 'w') + '">Frau</button><button type="button" data-g="m" aria-pressed="' + (gSeg === 'm') + '">Mann</button></div>' : '') +
      '<div class="kt-st-reihe" style="--n:' + STIMMEN.filter(function (s) { return !hatG || s.g === gSeg; }).length + '">' + STIMMEN.filter(function (s) { return !hatG || s.g === gSeg; }).map(function (s) { return knopf(s); }).join('') + '</div>' +
      '<p class="kt-st-info" aria-live="polite"><b>' + akt.name + '</b> · ' + akt.text + (akt.standard ? ' · <em>empfohlen</em>' : '') + '</p>';
    var popH = hatG ? ['w', 'm'].map(function (g) { return '<div class="kt-st-sp"><b>' + (g === 'w' ? 'Frauen' : 'Männer') + '</b>' + STIMMEN.filter(function (s) { return s.g === g; }).map(function (s) { return knopf(s, 1); }).join('') + '</div>'; }).join('')
      : STIMMEN.map(function (s) { return knopf(s, 1); }).join('');
    [].forEach.call(root.querySelectorAll('.kt-stimmen-l'), function (l) { l.innerHTML = pop && pop.contains(l) ? popH : wahl; });
    if (stBtn) stBtn.querySelector('span').textContent = sname(stimme);
  }
  function probeStop() {
    clearTimeout(probeT); if (probeAu) { try { probeAu.pause(); } catch (e) {} probeAu = null; }
    [].forEach.call(root.querySelectorAll('.kt-st-spielt'), function (b) { b.classList.remove('kt-st-spielt'); });
  }
  function probe(id) {   // spielt „Guten Tag … Ich bin eine KI.“ der Stimme an (Schnitt in der Atempause davor)
    probeStop(); var m = AV[id] && AV[id].gruss; if (!m || stumm || SCHNELL) return;
    var w = m.t.split(' '), k = w.indexOf('KI.'), ziel = k > 0 ? m.d * (k + 1) / w.length : 5, bis = ziel, p = m.p || '';
    for (var dlt = 0, i0 = Math.round(ziel * 25); dlt < 25; dlt++) {
      var a = i0 + dlt, b = i0 - dlt;
      if (p[a] <= '1' && p[a + 1] <= '1') { bis = (a + 1) / 25; break; }
      if (b > 0 && p[b] <= '1' && p[b + 1] <= '1') { bis = (b + 1) / 25; break; }
    }
    try { probeAu = new Audio(url('gruss', id)); probeAu.play().catch(function () {}); } catch (e) {}
    [].forEach.call(root.querySelectorAll('.kt-st[data-s="' + id + '"]'), function (b) { b.classList.add('kt-st-spielt'); });
    probeT = setTimeout(probeStop, Math.max(1500, bis * 1000));
  }
  function setzeStimme(id, vorhoeren) {
    if (!STIMMEN.some(function (s) { return s.id === id; })) return;
    stimme = id; try { localStorage.setItem('kitel-stimme', id); } catch (e) {}
    stimmenUI();
    ladeStimme(id, function () { if (stimme !== id) return; if (amSagen) wartet = id; else nimm(id); if (vorhoeren) probe(id); });
  }
  function popZu() { if (pop && !pop.hidden) { pop.hidden = true; stBtn.setAttribute('aria-expanded', 'false'); } }
  if (STIMMEN.length > 1) {
    stimmenUI();
    root.addEventListener('click', function (e) {
      var gs = e.target.closest && e.target.closest('.kt-gseg button'); if (gs) { gSeg = gs.getAttribute('data-g'); stimmenUI(); return; }
      var b = e.target.closest && e.target.closest('.kt-st'); if (!b) return;
      var imPop = pop && pop.contains(b), laeuft = /gespraech|waehlt/.test(S.phase);
      setzeStimme(b.getAttribute('data-s'), !(imPop && laeuft));
      if (imPop && laeuft) { hinweis('Ab dem nächsten Satz spricht ' + sname(stimme) + '.'); setTimeout(popZu, 250); }
    });
    stBtn.addEventListener('click', function (e) { e.stopPropagation(); stimmenUI(); var auf = pop.hidden; pop.hidden = !auf; stBtn.setAttribute('aria-expanded', String(auf)); if (!auf) probeStop(); });
    d.addEventListener('click', function (e) { if (pop && !pop.hidden && !pop.contains(e.target) && e.target !== stBtn) { popZu(); probeStop(); } });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { popZu(); probeStop(); } });
  } else {
    [].forEach.call(root.querySelectorAll('.kt-stimme,.kt-stimmen,.kt-stimmen-pop'), function (x) { x.hidden = true; });
  }
  log.setAttribute('data-lenis-prevent', ''); kal.setAttribute('data-lenis-prevent', '');
  addEventListener('resize', function () { groesse(); log.scrollTop = log.scrollHeight; });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { d.documentElement.classList.toggle('kt-im-blick', e[0].isIntersecting); }, { threshold: 0.35 }).observe(geraet);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting) { if (!raf) { groesse(); zeichne(); } } else { cancelAnimationFrame(raf); raf = 0; } }).observe(cv);
  if (modBtn) modBtn.hidden = !SR;
  reset();
  window.KiTelefon = {
    anrufen: anrufen, waehle: gewaehlt, eingabe: eingabe, zustand: function () { return S; }, stumm: function (v) { stumm = v; },
    modus: function () { return modus; }, setModus: setModus, bereit: function () { return S.phase === 'gespraech' && !spricht && !busy && !amSagen; },
    hoert: function () { return hoer.an; }, stimme: function (id) { if (id) setzeStimme(id, false); return stimme; }, aktiveStimme: function () { return aktiv; }, stimmen: function () { return STIMMEN; }, kalender: function () { return K; }, auflegen: function () { $('.kt-auflegen').click(); }
  };
})();
