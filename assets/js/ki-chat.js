/*! ki-chat.js – KI-Assistent für Betriebs-Websites (Häufele Webdesign, 2026) – wiederverwendbares Modul
    Konfiguration: window.KICHAT (siehe ki-daten.js). Zwei Modi, automatisch:
    · LOKAL (endpoint leer): Absichts-Erkennung im Browser – Wissensbasis, Tippfehler, mehrere Themen pro Frage,
      Folgefragen („und was kostet das?“), Rückfragen bei Mehrdeutigkeit, ehrliches „weiß ich nicht“, Anfrage-Aufnahme.
      Keine Daten verlassen den Browser.
    · KI (endpoint = URL des Cloudflare Workers, Skripte/worker/): Antworten von Claude, gestreamt (SSE), NUR aus der
      Wissensbasis im Worker. Bei Fehler/Zeitüberschreitung automatisch zurück auf lokal. Kontaktdaten der Anfrage-
      Aufnahme werden NIE an den Worker geschickt (bleiben lokal, gehen nur ins Formular bzw. die eigene E-Mail).
    API: KiChat.anbringen(element|null, cfg?) – baut das Fenster (null = eigenes schwebendes Fenster)
         KiChat.demo(element, fragen[], cfg?) – Vorführ-Verlauf mit echten Antworten der Engine (z. B. im 3D-Handy)
         KiChat.antwort(text) – reine Engine (für Tests): {a, l, chips, ids}                                        */
(function () {
  'use strict';
  var C = window.KICHAT; if (!C || !C.kb) return;
  var d = document, SIE = C.sie !== false;

  /* ---------------- Sprache ---------------- */
  function norm(s) {
    return (s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  var STOP = {}; (' der die das und oder ein eine einen einem einer eines ich ihr sie wir es ist sind bin bei mit von zu zum zur im in am an auf fuer was wie wo wer wann kann koennt koennen koennte habt haben hat gibt euch ihnen mir mich man auch noch schon bitte den dem des so mal denn doch eigentlich gerne gern ja nein mein meine meinen mein ihre ihren ihr dein deine dann wenn also aber ganz sehr da hier dort nur als ob mehr viel ' ).split(' ').forEach(function (w) { if (w) STOP[w] = 1; });
  function stem(w) { return w.length > 5 ? w.replace(/(ungen|ung|ern|en|er|es|em|e|n|s)$/, '') : w; }
  function toks(s) { return norm(s).split(' ').filter(function (w) { return w && !STOP[w]; }).map(stem); }
  function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; var m = [], i, j; for (i = 0; i <= a.length; i++) m[i] = [i]; for (j = 0; j <= b.length; j++) m[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; }

  function bauKB(c) { return c.kb.map(function (e) {
    return { e: e, keys: (e.k || []).map(function (k) { var n = norm(k); return { raw: n, st: stem(n), phrase: n.indexOf(' ') > 0 }; }) };
  }); }
  var KB = bauKB(C);
  function bewerte(q) {
    var nq = ' ' + norm(q) + ' ', tq = toks(q), out = [];
    KB.forEach(function (x) {
      var s = 0, hit = {};
      x.keys.forEach(function (k) {
        if (k.phrase) { if (nq.indexOf(' ' + k.raw + ' ') > -1) s += 3; return; }
        var kk = k.st;
        tq.forEach(function (t, ti) {
          var v = 0;
          if (t === kk) v = 2;
          else if (kk.length > 3 && t.length > 4 && (t.indexOf(kk) === 0 || kk.indexOf(t) === 0)) v = 1.6;
          else if (kk.length > 5 && t.length > 6 && t.indexOf(kk) > 0) v = 1.3;          // Wortteil: „handwerkerwebsite“
          else if (kk.length > 4 && lev(t, kk) <= (kk.length > 7 ? 2 : 1)) v = 1.3;     // Tippfehler
          if (v && (!hit[ti] || hit[ti] < v)) { s += v - (hit[ti] || 0); hit[ti] = v; }
        });
      });
      if (s > 0) out.push({ e: x.e, s: s * (x.e.w || 1) });
    });
    out.sort(function (a, b) { return b.s - a.s; });
    return out;
  }
  function teile(q) {
    return q.split(/[?!.;]+|\s(?:und|sowie|ausserdem|außerdem|plus|und wie|und was|und wann)\s/i).map(function (s) { return s.trim(); }).filter(function (s) { return toks(s).length; });
  }

  /* ---------------- Zustand ---------------- */
  var Z = { thema: null, angebot: null, lead: null, daten: {}, verlauf: [] };
  var JA = /^(ja|jo|jep|jap|gern|gerne|ok|okay|klar|bitte|ja bitte|ja gerne|na klar|sicher|passt|mach|machen sie|unbedingt|auf jeden fall)\b/;
  var NEIN = /^(nein|ne|nee|noe|nicht|kein|keine|spaeter|danke nein|nein danke)\b/;
  var FOLGE = /\b(das|es|dafuer|davon|dazu|dabei|damit|der|die|dies|diese|dieser|so was|sowas)\b/;
  function byId(id) { for (var i = 0; i < C.kb.length; i++) if (C.kb[i].id === id) return C.kb[i]; return null; }
  function text(e) {   // Antwort ggf. passend zum Gesprächsthema („Was kostet das?“ nach KI-Telefon)
    if (e.v && Z.thema && e.v[Z.thema]) return e.v[Z.thema];
    return typeof e.a === 'function' ? e.a(Z) : e.a;
  }
  function erg(a, l, chips, ids) { return { a: a, l: l || [], chips: chips || [], ids: ids || [] }; }

  function leadStart(thema) {
    Z.lead = 'name'; Z.daten = { thema: thema || '' }; Z.angebot = null;
    return erg((SIE ? 'Gern nehme ich Ihre Anfrage auf – das dauert 30 Sekunden. ' : 'Gern nehme ich deine Anfrage auf. ') + 'Wie ist Ihr Name?', [], ['Abbrechen']);
  }
  function leadSchritt(q) {
    var n = norm(q);
    if (/^(abbrechen|stopp?|egal|vergiss es|doch nicht)$/.test(n)) { Z.lead = null; return erg('Kein Problem, ich habe nichts gespeichert. Fragen Sie gern weiter.', [], (C.vorschlaege || []).slice(0, 3)); }
    if (Z.lead === 'name') {
      var nm = q.replace(/^(ich bin|ich heisse|ich heiße|mein name ist|hier ist|name:?)\s+/i, '').trim();
      if (nm.length < 2 || nm.length > 60 || /\d/.test(nm)) return erg('Damit Niklas weiß, wen er zurückruft: Wie ist Ihr Name?', [], ['Abbrechen']);
      Z.daten.name = nm.replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }); Z.lead = 'tel';
      return erg('Danke, ' + Z.daten.name + '. Unter welcher Telefonnummer erreicht Niklas Sie am besten?', [], ['Abbrechen']);
    }
    if (Z.lead === 'tel') {
      var m = q.match(/(\+?\d[\d\s\/().-]{5,}\d)/), mail = q.match(/[^\s@]+@[^\s@]+\.[a-z]{2,}/i);
      if (!m && !mail) return erg('Das sieht nicht nach einer Telefonnummer aus. Bitte z. B. so: 0731 123456 – oder eine E-Mail-Adresse.', [], ['Abbrechen']);
      if (m) Z.daten.tel = m[1].trim(); if (mail) Z.daten.mail = mail[0];
      if (Z.daten.thema) { Z.lead = 'notiz'; return erg('Notiert. Möchten Sie noch kurz etwas dazuschreiben – z. B. Gewerk, Ort oder Ihre bestehende Website?', [], ['Nein, passt so']); }
      Z.lead = 'thema'; return erg('Notiert. Worum geht es?', [], C.themen || []);
    }
    if (Z.lead === 'thema') {
      var t = (C.themen || []).filter(function (x) { return norm(x) === n; })[0];
      if (!t) { var b = bewerte(q)[0]; t = b && b.e.formThema || 'Etwas anderes'; if (!b) Z.daten.notiz = q; }
      Z.daten.thema = t; Z.lead = 'notiz';
      return erg('Möchten Sie noch kurz etwas dazuschreiben – z. B. Gewerk, Ort oder Ihre bestehende Website?', [], ['Nein, passt so']);
    }
    if (Z.lead === 'notiz') {
      if (!/^(nein|ne|nee|passt|passt so|nein passt so|nichts|kein)/.test(n)) Z.daten.notiz = (Z.daten.notiz ? Z.daten.notiz + ' · ' : '') + q;
      Z.lead = null;
      var r = erg('Fertig! Ihre Anfrage ist vorbereitet. Mit einem Tipp übernehmen Sie sie ins Kontaktformular oder schicken sie direkt per E-Mail – erst dann geht sie an Niklas.', [], []);
      r.karte = Z.daten; return r;
    }
  }

  function lokal(q) {
    var n = norm(q);
    if (Z.lead) { var ls = leadSchritt(q); if (ls) return ls; }
    if (!n) return erg('Schreiben Sie einfach Ihre Frage – z. B. „Was kostet eine Website?“');
    if (n.length > 600) return erg('Das ist mir zu lang – bitte stellen Sie Ihre Frage in ein, zwei Sätzen.');
    // Antwort auf ein Angebot („Soll ich …?“)
    if (Z.angebot && (JA.test(n) || NEIN.test(n)) && toks(q).length <= 4) {
      var ang = Z.angebot; Z.angebot = null;
      if (NEIN.test(n)) return erg('Alles klar. Fragen Sie gern weiter – ich bin hier.', [], (C.vorschlaege || []).slice(0, 3));
      if (ang.lead !== undefined) return leadStart(ang.lead);
      if (ang.id) return lokal(byId(ang.id).n);
    }
    // Kontaktdaten direkt in die Frage geschrieben → Anfrage-Aufnahme anbieten
    if (/(\+?\d[\d\s\/-]{7,}\d)/.test(q) && !Z.lead) { Z.lead = 'tel'; Z.daten = { thema: '', name: '' }; var tl = leadSchritt(q); Z.daten.name = Z.daten.name || '–'; return tl; }
    var alle = bewerte(q), best = alle[0];
    // mehrere Themen in einer Frage
    var stuecke = teile(q), ids = [], treffer = [];
    if (stuecke.length > 1) stuecke.forEach(function (s) { var b = bewerte(s)[0]; if (b && b.s >= 2 && ids.indexOf(b.e.id) < 0 && treffer.length < 3) { ids.push(b.e.id); treffer.push(b.e); } });
    if (treffer.length < 2) {
      treffer = []; ids = [];
      if (!best || best.s < 2) {
        // Folgefrage ohne eigenes Thema („und wie lange dauert das?“) – schon über v abgedeckt, sonst unbekannt
        Z.angebot = { lead: '' };
        return erg(C.unbekannt, [C.kontaktLink].filter(Boolean), ['Ja, Anfrage aufnehmen', 'Nein danke']);
      }
      // Rückfrage bei Mehrdeutigkeit (kurze Frage, zwei gleich starke Themen)
      var zweit = alle[1];
      if (zweit && zweit.e.n && best.e.n && toks(q).length <= 2 && best.s - zweit.s < 0.25 && !best.e.generisch && !zweit.e.generisch) {
        return erg('Meinen Sie ' + best.e.n + ' oder ' + zweit.e.n + '?', [], [best.e.n, zweit.e.n]);
      }
      treffer = [best.e]; ids = [best.e.id];
      if (best.e.zusatz) { var haupt = alle.filter(function (x) { return !x.e.zusatz && !x.e.generisch && x.s >= 1.6; })[0]; if (haupt) { treffer = [haupt.e]; ids = [haupt.e.id]; } }
      // „Was kostet das KI-Telefon?“: generische Frage + Thema in einem Satz → generische Antwort zum Thema
      var gen = alle.filter(function (x) { return x.e.generisch && x.s >= 2; })[0], them = alle.filter(function (x) { return x.e.thema && !x.e.generisch && x.s >= 2; })[0];
      if (gen && them) { Z.thema = them.e.thema; treffer = [gen.e]; ids = [gen.e.id]; }
    }
    // Zusatz-Themen (z. B. Ort) werden an die Hauptantwort angehängt: „Machen Sie Bäder in Weißenhorn?“
    alle.forEach(function (x) { if (x.e.zusatz && x.s >= 2 && ids.indexOf(x.e.id) < 0 && treffer.length < 3) { treffer.push(x.e); ids.push(x.e.id); } });
    // Generische Folgefrage ohne Thema, aber mit Bezug („was kostet das“) → Thema aus Verlauf
    var teil = treffer.map(function (e) { return text(e); });
    var links = [], chips = [];
    treffer.forEach(function (e) { (e.l || []).forEach(function (l) { if (links.length < 3 && !links.some(function (x) { return x.h === l.h; })) links.push(l); }); });
    var last = treffer[treffer.length - 1];
    chips = (last.chips || []).slice(0, 3);
    if (last.angebot) Z.angebot = last.angebot; else Z.angebot = null;
    treffer.forEach(function (e) { if (e.thema) Z.thema = e.thema; });
    if (last.lead !== undefined) return leadStart(last.lead);
    return erg(teil.join('\n\n'), links, chips, ids);
  }

  /* ---------------- KI-Modus (Worker, SSE) ---------------- */
  var kiAus = false;
  function ki(q, onDelta) {
    return new Promise(function (ok, fail) {
      var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ctl) ctl.abort(); fail('zeit'); }, 15000);
      var hist = Z.verlauf.slice(-10);
      fetch(C.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nachrichten: hist.concat([{ r: 'user', t: q }]) }), signal: ctl && ctl.signal })
        .then(function (r) {
          if (!r.ok || !r.body) throw r.status;
          var rd = r.body.getReader(), dec = new TextDecoder(), puf = '', ganz = '';
          function weiter() {
            return rd.read().then(function (x) {
              if (x.done) { clearTimeout(t); return ok(ganz); }
              puf += dec.decode(x.value, { stream: true });
              var zeilen = puf.split('\n'); puf = zeilen.pop();
              zeilen.forEach(function (z) {
                if (z.indexOf('data:') !== 0) return; var j; try { j = JSON.parse(z.slice(5)); } catch (e) { return; }
                if (j.t) { ganz += j.t; onDelta(ganz); }
                if (j.fehler) throw j.fehler;
              });
              return weiter();
            });
          }
          return weiter();
        }).catch(function (e) { clearTimeout(t); fail(e); });
    });
  }

  /* ---------------- Oberfläche ---------------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  var REDUZ = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function anbringen(root, cfg) {
    if (cfg) C = cfg;
    var eigen = !root;
    if (eigen) { root = d.createElement('aside'); root.className = 'assi'; root.id = 'assi'; d.body.appendChild(root); }
    root.classList.add('kc'); root.setAttribute('aria-label', C.titel || 'KI-Assistent'); root.setAttribute('data-lenis-prevent', '');
    var kopf = root.querySelector('header') || d.createElement('header');
    kopf.id = 'assikopf';
    kopf.innerHTML = '<span class="kc-ava" aria-hidden="true"><i></i><i></i><i></i></span><span class="kc-kt"><b>' + esc(C.titel) + '</b><small><i class="kc-live" aria-hidden="true"></i>' + esc(C.kennung || 'KI-Assistent · kein Mensch') + '</small></span><button type="button" id="assizu" aria-label="Assistent einklappen">–</button>';
    if (!kopf.parentNode) root.appendChild(kopf);
    [].slice.call(root.children).forEach(function (c) { if (c !== kopf) c.remove(); });
    var log = d.createElement('div'); log.className = 'kc-log'; log.id = 'verlauf'; log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite');
    var chipsEl = d.createElement('div'); chipsEl.className = 'kc-chips'; chipsEl.id = 'fragen';
    var form = d.createElement('form'); form.className = 'kc-in'; form.setAttribute('autocomplete', 'off');
    form.innerHTML = '<label class="kc-sr" for="kc-q">Ihre Frage</label><input id="kc-q" maxlength="400" enterkeyhint="send" placeholder="' + (SIE ? 'Ihre Frage …' : 'Deine Frage …') + '"><button type="submit" aria-label="Senden"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg></button>';
    // Spracheingabe per Antippen (Option C.sprechen) – Web Speech API des Browsers, nichts wird von uns gespeichert
    var SRK = window.SpeechRecognition || window.webkitSpeechRecognition, mic = null, recK = null;
    if (C.sprechen && SRK) {
      mic = d.createElement('button'); mic.type = 'button'; mic.className = 'kc-mic'; mic.setAttribute('aria-label', 'Frage sprechen'); mic.title = 'Frage sprechen';
      mic.innerHTML = '<i aria-hidden="true"></i><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      form.insertBefore(mic, form.querySelector('button[type=submit]'));
    }
    var note = d.createElement('p'); note.className = 'kc-note';
    function setNote() { note.innerHTML = (C.endpoint && !kiAus ? 'KI-Modus: Antworten von Claude (Anthropic), nur aus geprüften Infos. Keine Speicherung.' : 'Antwortet aus geprüften Infos. Ihre Eingaben bleiben in Ihrem Browser.') + (mic ? ' Mikrofon: Ihr Browser wandelt Sprache in Text um.' : '') + (C.datenschutz ? ' <a href="' + esc(C.datenschutz) + '">Datenschutz</a>' : ''); }
    setNote();
    root.appendChild(log); root.appendChild(chipsEl); root.appendChild(form); root.appendChild(note);
    var inp = form.querySelector('input'), zu = kopf.querySelector('#assizu'), busy = false;

    function toggle(e) { if (e && e.target.closest && e.target.closest('a')) return; var z = root.classList.toggle('zu'); zu.textContent = z ? '+' : '–'; zu.setAttribute('aria-label', z ? 'Assistent öffnen' : 'Assistent einklappen'); kopf.setAttribute('aria-expanded', z ? 'false' : 'true'); if (!z) setTimeout(function () { if (innerWidth > 820) inp.focus({ preventScroll: true }); log.scrollTop = log.scrollHeight; }, 60); }
    kopf.addEventListener('click', toggle);
    root.addEventListener('wheel', function (e) { e.stopPropagation(); }, { passive: true });
    root.classList.remove('zu'); toggle(); // startet immer eingeklappt – öffnet sich nur, wenn jemand draufklickt
    /* 20N-FIX2: Ausweichen statt Verdecken – allgemein, ohne Klassenliste.
       Nach Scroll-Ende / Größenänderung (nie im Bild-Takt) wird geprüft, ob unter dem eingeklappten Fenster ein
       Bedien- oder Textelement liegt (a, button, input, select, textarea, label, p, li, Überschriften …).
       Dann rückt das Fenster an die nächste freie Stelle (rechts unten → links unten → schrittweise höher).
       Es bleibt immer ein kleines, lesbares Fenster („KI-Assistent · kein Mensch“) und öffnet sich nie von selbst. */
    var HIND = 'a,button,input,select,textarea,label,summary,[role="button"],[role="slider"],p,li,h1,h2,h3,h4,h5,dt,dd,figcaption,blockquote';
    var BEDIEN = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY)$/;
    var vers = { x: 0, y: 0 }, pruefT = 0;
    function setzeVers(x, y) { if (x === vers.x && y === vers.y) return; vers = { x: x, y: y }; root.style.transform = (x || y) ? 'translate(' + x + 'px,' + y + 'px)' : ''; }
    function sichtbarEl(el, cache) {
      for (var e = el; e && e !== d.body && e !== d.documentElement; e = e.parentElement) {
        if (cache.has(e)) { if (!cache.get(e)) return false; continue; }
        var cs = getComputedStyle(e), ok = cs.visibility !== 'hidden' && +cs.opacity > 0.05 && cs.display !== 'none';
        cache.set(e, ok); if (!ok) return false;
      }
      return true;
    }
    function belegt(x, y, w, h, cache, grenze) { // Anzahl getroffener Bedien-/Textelemente im Rechteck (Stichprobe 7×4 Punkte, 4 px Rand)
      var n = 0, gesehen = new Set(); x -= 4; y -= 4; w += 8; h += 8;
      for (var iy = 0; iy < 4; iy++) for (var ix = 0; ix < 7; ix++) {
        var px = x + w * (0.02 + 0.96 * ix / 6), py = y + h * (0.04 + 0.92 * iy / 3);
        if (px < 0 || py < 0 || px >= innerWidth || py >= innerHeight) { n += 3; continue; }
        var st = d.elementsFromPoint(px, py);
        for (var k = 0; k < st.length; k++) {
          var el = st[k]; if (root.contains(el)) continue;
          var t = el.closest ? el.closest(HIND) : null;
          if (t && !root.contains(t) && !gesehen.has(t) && sichtbarEl(t, cache)) { gesehen.add(t); n += BEDIEN.test(t.tagName) || t.getAttribute('role') ? 5 : 1; } // Bedienelemente wiegen schwerer als Text
          break; // nur das oberste Element unter dem Fenster zählt
        }
        if (n > grenze) return n; // schlechter als die bisher beste Stelle → abbrechen
      }
      return n;
    }
    function ausweichen() {
      pruefT = 0;
      if (!root.classList.contains('zu') || !d.elementsFromPoint) return;
      /* erst in normaler Größe suchen; ist nirgends frei, die schmale Fassung (Kennung bleibt lesbar) */
      root.classList.remove('kc-eng'); var r1 = suche();
      if (r1 && r1.n > 0) { root.classList.add('kc-eng'); var r2 = suche(); if (r2 && r2.n < r1.n) { setzeVers(r2.x, r2.y); return; } root.classList.remove('kc-eng'); }
      if (r1) setzeVers(r1.x, r1.y);
    }
    function suche() {
      /* Lage ohne transform (offset*), damit eine laufende Ausweich-Bewegung die Messung nicht verfälscht */
      var bx = root.offsetLeft, by = root.offsetTop, w = root.offsetWidth, h = root.offsetHeight;
      if (!w || !h) return null;
      var m = innerWidth < 700 ? 10 : 18, links = m - bx, stufe = h + 12, cache = new Map(), best = null;
      var kand = [[0, 0], [links, 0]];
      for (var s2 = 1; s2 <= 12 && by - s2 * stufe > Math.max(70, innerHeight * 0.12); s2++) { kand.push([0, -s2 * stufe]); kand.push([links, -s2 * stufe]); }
      for (var q = 0; q < kand.length; q++) {
        var n = belegt(bx + kand[q][0], by + kand[q][1], w, h, cache, best ? best.n : 1e9);
        if (!best || n < best.n) best = { n: n, x: kand[q][0], y: kand[q][1] };
        if (n === 0) break;
      }
      return best;
    }
    var pruefT2 = 0; // zweite Prüfung, wenn einblendende Inhalte (Fade-ins) fertig sind
    function spaeter() { if (pruefT) clearTimeout(pruefT); if (pruefT2) clearTimeout(pruefT2); pruefT = setTimeout(ausweichen, 180); pruefT2 = setTimeout(ausweichen, 1100); }
    addEventListener('scroll', spaeter, { passive: true });
    addEventListener('resize', spaeter);
    addEventListener('load', spaeter);
    kopf.addEventListener('click', function () { if (!root.classList.contains('zu')) setzeVers(0, 0); else spaeter(); }); // geöffnet: feste Stelle unten rechts
    root.__ausweichen = ausweichen; root.__suche = suche; root.__belegt = belegt; // Testzugriff
    spaeter();

    function blase(wer, html) { var m = d.createElement('div'); m.className = 'kc-m kc-' + wer; m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; }
    function chips(list) {
      chipsEl.innerHTML = '';
      (list || []).forEach(function (t, i) { var b = d.createElement('button'); b.type = 'button'; b.textContent = t; b.style.setProperty('--i', i); b.onclick = function () { frag(t); }; chipsEl.appendChild(b); });
    }
    function linksHtml(l) { return l && l.length ? '<div class="kc-links">' + l.map(function (x) { var ext = /^https?:/.test(x.h); return '<a href="' + esc(x.h) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(x.t) + '<span aria-hidden="true">→</span></a>'; }).join('') + '</div>' : ''; }
    function karte(dt) {
      var zeilen = [['Name', dt.name], ['Telefon', dt.tel], ['E-Mail', dt.mail], ['Thema', dt.thema], ['Notiz', dt.notiz]].filter(function (z) { return z[1] && z[1] !== '–'; });
      var m = blase('bot kc-karte', '<small class="kc-mono">Anfrage · noch nicht gesendet</small>' + zeilen.map(function (z) { return '<div><span>' + z[0] + '</span><b>' + esc(z[1]) + '</b></div>'; }).join('') +
        '<div class="kc-akt"><button type="button" class="kc-k1">Ins Formular übernehmen</button><button type="button" class="kc-k2">Per E-Mail senden</button></div>');
      m.querySelector('.kc-k1').onclick = function () {
        var f = d.querySelector(C.formular || '#kontaktform'); if (!f) return;
        var E = function (n) { return f.elements.namedItem(n); }, th = E('thema');
        if (E('name') && dt.name && dt.name !== '–') E('name').value = dt.name;
        if (E('telefon') && dt.tel) E('telefon').value = dt.tel; if (E('email') && dt.mail) E('email').value = dt.mail;
        if (th && th.options) { var ok = [].some.call(th.options, function (o) { return o.value === dt.thema || o.text === dt.thema; }); th.value = ok ? dt.thema : 'Etwas anderes'; }
        if (E('nachricht') && dt.notiz) E('nachricht').value = dt.notiz;
        f.scrollIntoView({ behavior: 'smooth', block: 'center' }); f.classList.add('kc-blitz'); setTimeout(function () { f.classList.remove('kc-blitz'); }, 1600);
        if (!root.classList.contains('zu')) toggle();
      };
      m.querySelector('.kc-k2').onclick = function () {
        var body = zeilen.map(function (z) { return z[0] + ': ' + z[1]; }).join('\n') + '\n\n(über den Website-Assistenten vorbereitet)';
        location.href = 'mailto:' + C.mail + '?subject=' + encodeURIComponent('Anfrage: ' + (dt.thema || 'Rückruf')) + '&body=' + encodeURIComponent(body);
      };
    }
    function tippen(el, t, fertig) {     // Antwort erscheint fließend, Wort für Wort
      if (REDUZ) { el.innerHTML = '<p>' + fmt(t) + '</p>'; return fertig(); }
      var w = t.split(/(\s+)/), i = 0, p = d.createElement('p'); el.innerHTML = ''; el.appendChild(p);
      var step = Math.max(1, Math.round(w.length / 60));
      (function los() { i = Math.min(w.length, i + step * 2); p.innerHTML = fmt(w.slice(0, i).join('')) + (i < w.length ? '<i class="kc-cur"></i>' : ''); log.scrollTop = log.scrollHeight; if (i < w.length) setTimeout(los, 26); else fertig(); })();
    }
    function zeige(r, el) {
      tippen(el, r.a, function () {
        if (r.l && r.l.length) el.insertAdjacentHTML('beforeend', linksHtml(r.l));
        el.querySelectorAll('.kc-links a[href^="#"]').forEach(function (a) { a.addEventListener('click', function () { if (innerWidth < 820 && !root.classList.contains('zu')) toggle(); }); });
        if (r.karte) karte(r.karte);
        chips(r.chips && r.chips.length ? r.chips : []);
        busy = false; log.scrollTop = log.scrollHeight;
      });
    }
    function frag(q) {
      q = (q || '').trim(); if (!q || busy) return; busy = true;
      if (root.classList.contains('zu')) toggle();
      blase('ich', '<p>' + esc(q) + '</p>'); inp.value = ''; chips([]);
      var t = blase('bot kc-tippt', '<p><i></i><i></i><i></i></p>');
      var istLead = Z.lead || /^(ja, anfrage aufnehmen|anfrage aufnehmen|rueckruf|rückruf anfordern)$/i.test(q) || (Z.angebot && (JA.test(norm(q)) || NEIN.test(norm(q))));
      function lokalAntw() { var r = lokal(q); Z.verlauf.push({ r: 'user', t: q }, { r: 'assistant', t: r.a }); t.classList.remove('kc-tippt'); zeige(r, t); }
      if (C.endpoint && !kiAus && !istLead) {
        var gest = false;
        ki(q, function (ganz) { if (!gest) { gest = true; t.classList.remove('kc-tippt'); t.innerHTML = '<p></p>'; } t.firstChild.innerHTML = fmt(ganz.replace(/\[ANFRAGE\]/g, '')) + '<i class="kc-cur"></i>'; log.scrollTop = log.scrollHeight; })
          .then(function (ganz) {
            var lead = /\[ANFRAGE\]/.test(ganz); ganz = ganz.replace(/\[ANFRAGE\]/g, '').trim();
            Z.verlauf.push({ r: 'user', t: q }, { r: 'assistant', t: ganz });
            t.innerHTML = '<p>' + fmt(ganz) + '</p>';
            if (lead) { Z.angebot = { lead: '' }; chips(['Ja, Anfrage aufnehmen', 'Nein danke']); } else { var b = bewerte(q)[0]; chips(b && b.s >= 2 ? (b.e.chips || []).slice(0, 3) : []); }
            busy = false;
          })
          .catch(function () { kiAus = true; setNote(); if (gest) { t.innerHTML = ''; } lokalAntw(); });
      } else setTimeout(lokalAntw, REDUZ ? 0 : 380 + Math.min(520, q.length * 9));
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); if (recK) stopMic(); frag(inp.value); });
    function stopMic() { var r = recK; recK = null; if (r) { r.onresult = r.onend = r.onerror = null; try { r.abort(); } catch (x) {} } root.classList.remove('kc-hoert'); if (mic) { mic.setAttribute('aria-pressed', 'false'); mic.setAttribute('aria-label', 'Frage sprechen'); } inp.placeholder = SIE ? 'Ihre Frage …' : 'Deine Frage …'; }
    function hinweisK(t) { blase('bot kc-sys', '<p>' + esc(t) + '</p>'); }
    if (mic) mic.addEventListener('click', function () {
      if (recK) return stopMic();
      if (busy) return;
      var r; try { r = new SRK(); } catch (e) { return hinweisK('Die Spracherkennung startet in diesem Browser nicht – schreiben Sie einfach.'); }
      recK = r; r.lang = 'de-DE'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
      root.classList.add('kc-hoert'); mic.setAttribute('aria-pressed', 'true'); mic.setAttribute('aria-label', 'Zuhören beenden'); inp.value = ''; inp.placeholder = 'Ich höre zu …';
      var letzt = '', gesendet = false;
      function senden(t) { if (gesendet) return; gesendet = true; stopMic(); if (t.trim()) frag(t.trim()); }
      r.onresult = function (e) { var fin = '', zw = ''; for (var i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) fin += e.results[i][0].transcript; else zw += e.results[i][0].transcript; } letzt = (fin || zw); inp.value = letzt; if (fin) senden(fin); };
      r.onerror = function (e) { var g = e && e.error; stopMic(); if (g === 'not-allowed' || g === 'service-not-allowed') hinweisK(location.protocol === 'file:' ? 'Ihr Browser gibt das Mikrofon in dieser lokalen Datei nicht frei. Sprechen klappt auf der fertigen Website (https) – schreiben Sie hier einfach.' : 'Kein Mikrofon freigegeben – kein Problem, schreiben Sie einfach.'); else if (g === 'network') hinweisK('Die Spracherkennung ist gerade nicht erreichbar – schreiben Sie einfach.'); else if (g === 'audio-capture') hinweisK('Kein Mikrofon gefunden – schreiben Sie einfach.'); };
      r.onend = function () { if (recK === r) senden(letzt); };
      try { r.start(); } catch (e) { stopMic(); hinweisK('Die Spracherkennung startet hier nicht – schreiben Sie einfach.'); }
    });
    // Begrüßung
    blase('bot', '<p>' + fmt(C.gruss) + '</p>'); chips((C.vorschlaege || []).slice(0, 3));
    window.KiChat.frag = frag; window.KiChat.root = root;
    return root;
  }

  /* Vorführ-Verlauf: dieselbe Engine, dieselbe Optik (z. B. Leistungen-Kapitel im 3D-Handy). Kinder bekommen
     die Klassen k / b / karte-a, damit bestehende Scroll-Steuerungen (.an) weiter funktionieren. */
  function demo(el, fragen, cfg) {
    if (!el) return; el.innerHTML = ''; el.classList.add('kc-demo');
    var altZ = Z, altC = C, altKB = KB; Z = { thema: null, angebot: null, lead: null, daten: {}, verlauf: [] };
    if (cfg) { C = cfg; KB = bauKB(cfg); }
    try {
      fragen.forEach(function (q) {
        var a = d.createElement('div'); a.className = 'k'; a.textContent = q; el.appendChild(a);
        var r = lokal(q), b = d.createElement('div'); b.className = 'b'; b.textContent = r.a.replace(/\n\n/g, ' '); el.appendChild(b);
      });
    } finally { Z = altZ; C = altC; KB = altKB; }
    return el;
  }

  /* Automatisch starten: vorhandenes <aside id="assi"> übernehmen (sonst eigenes Fenster) + optionale Vorführung */
  function auto() {
    if (C.auto === false) return;
    anbringen(d.getElementById('assi'));
    var D = window.KICHAT_DEMO, el = D && d.querySelector(D.el);
    if (el) { demo(el, D.fragen, D.cfg); if (D.karte) { var k = d.createElement('div'); k.className = 'karte-a'; k.textContent = D.karte; el.appendChild(k); } }
  }
  window.KiChat = { anbringen: anbringen, demo: demo, antwort: function (q) { return lokal(q); }, zuruecksetzen: function () { Z = { thema: null, angebot: null, lead: null, daten: {}, verlauf: [] }; } };
  if (typeof d.addEventListener === 'function') { if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', auto); else auto(); }
})();
