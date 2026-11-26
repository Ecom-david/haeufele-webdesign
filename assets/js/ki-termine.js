/*! ki-termine.js – Kalender + Terminlogik für die KI-Telefon-Demo (Häufele Webdesign, 2026)
    Erfundener Muster-Betrieb: die nächsten 15 Werktage ab morgen, Besichtigungen 07:30 / 10:00 / 13:00 / 15:00 / 16:30
    (freitags bis 13:00), Wochenenden + Feiertage (bundesweit + Baden-Württemberg/Bayern) frei, einige Zeiten fest
    belegt (deterministisch per Datum). Versteht gesprochene/getippte Wünsche („nächste Woche nachmittags“,
    „am Fünfzehnten“, „halb fünf“, „Samstag“ …) und schlägt immer die frühesten passenden freien Termine vor.
    Reine Logik, kein DOM – auch in Node testbar. Nichts wird gespeichert oder übertragen.                       */
(function (G) {
  'use strict';
  var TAGL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var KURZ = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'];
  var MONL = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var ZEITEN = ['0730', '1000', '1300', '1500', '1630'], ZEITEN_FR = ['0730', '1000', '1300'];
  var TAG_MS = 864e5;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tag0(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function plus(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; }
  function key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function min(z) { return +z.slice(0, 2) * 60 + +z.slice(2); }
  function zt(z) { return z.slice(0, 2) + ':' + z.slice(2); }

  /* ---------- Feiertage (bundesweit + BW/BY) + Betriebsruhe 24./31.12. ---------- */
  function ostern(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mo - 1, da);
  }
  var FT = {};
  function feiertage(y) {
    if (FT[y]) return FT[y];
    var o = ostern(y), r = {};
    function f(d, n) { r[key(d)] = n; }
    f(new Date(y, 0, 1), 'Neujahr'); f(new Date(y, 0, 6), 'Heilige Drei Könige'); f(plus(o, -2), 'Karfreitag'); f(plus(o, 1), 'Ostermontag');
    f(new Date(y, 4, 1), 'Tag der Arbeit'); f(plus(o, 39), 'Christi Himmelfahrt'); f(plus(o, 50), 'Pfingstmontag'); f(plus(o, 60), 'Fronleichnam');
    f(new Date(y, 7, 15), 'Mariä Himmelfahrt'); f(new Date(y, 9, 3), 'Tag der Deutschen Einheit'); f(new Date(y, 10, 1), 'Allerheiligen');
    f(new Date(y, 11, 24), 'Betriebsruhe'); f(new Date(y, 11, 25), '1. Weihnachtstag'); f(new Date(y, 11, 26), '2. Weihnachtstag'); f(new Date(y, 11, 31), 'Betriebsruhe');
    return (FT[y] = r);
  }
  function geschlossen(d) { var w = d.getDay(); return w === 0 || w === 6 || !!feiertage(d.getFullYear())[key(d)]; }

  /* ---------- Kalender: 15 Werktage ab morgen ---------- */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
  function kalender(heute) {
    heute = tag0(heute || new Date());
    var tage = [], d = heute;
    while (tage.length < 15) {
      d = plus(d, 1);
      if (geschlossen(d)) continue;
      var zs = d.getDay() === 5 ? ZEITEN_FR : ZEITEN, k = key(d);
      tage.push({ dt: d, key: k, wt: d.getDay(), slots: zs.map(function (z) { return { dt: d, key: k + '_' + z, z: z, frei: hash(k + z) % 100 >= 42 }; }) });
    }
    // mindestens zwei freie Zeiten pro Tag, damit „Dienstag“ fast immer etwas hat (realistisch: Chef blockt nicht alles)
    tage.forEach(function (t) { var f = t.slots.filter(function (s) { return s.frei; }); if (f.length < 2) t.slots[(hash(t.key) % t.slots.length)].frei = true; });
    return { heute: heute, tage: tage, ende: tage[tage.length - 1].dt };
  }

  /* ---------- Sprechweise: „morgen“, „am Donnerstag“, „am Donnerstag nächste Woche“ … ---------- */
  function montag(d) { var x = tag0(d), w = (x.getDay() + 6) % 7; return plus(x, -w); }
  function woche(dt, heute) {
    var b = tag0(heute); if (b.getDay() === 6) b = plus(b, 2); else if (b.getDay() === 0) b = plus(b, 1);
    return Math.round((montag(dt) - montag(b)) / (7 * TAG_MS));
  }
  var QUAL = ['', 'nw', 'uw', 'dw'];
  function sprechId(slot, heute) {     // Teil der Satz-ID, z. B. morgen_1630, do_1630, do_nw_1630
    var diff = Math.round((tag0(slot.dt) - tag0(heute)) / TAG_MS);
    if (diff === 1) return 'morgen_' + slot.z;
    var w = Math.max(0, Math.min(3, woche(slot.dt, heute)));
    return KURZ[slot.dt.getDay()] + (QUAL[w] ? '_' + QUAL[w] : '') + '_' + slot.z;
  }
  function anzeige(slot) { return TAGL[slot.dt.getDay()] + ', ' + slot.dt.getDate() + '. ' + MONL[slot.dt.getMonth()] + ' ' + slot.dt.getFullYear() + ', ' + zt(slot.z) + ' Uhr'; }
  function anzeigeKurz(slot) { return TAGL[slot.dt.getDay()].slice(0, 2) + ', ' + slot.dt.getDate() + '. ' + MONL[slot.dt.getMonth()].slice(0, 3).replace('Mär', 'März') + ' · ' + zt(slot.z) + ' Uhr'; }

  /* ---------- Gesprochene Sprache normalisieren ---------- */
  var EINER = { null: 0, eins: 1, ein: 1, eine: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9 };
  var ZAHL = { null: 0, eins: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwoelf: 12,
    dreizehn: 13, vierzehn: 14, fuenfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19, zwanzig: 20, dreissig: 30, vierzig: 40, fuenfzig: 50 };
  var ORD = { erste: 1, zweite: 2, dritte: 3, vierte: 4, fuenfte: 5, sechste: 6, siebte: 7, siebente: 7, achte: 8, neunte: 9, zehnte: 10, elfte: 11, zwoelfte: 12,
    dreizehnte: 13, vierzehnte: 14, fuenfzehnte: 15, sechzehnte: 16, siebzehnte: 17, achtzehnte: 18, neunzehnte: 19, zwanzigste: 20, dreissigste: 30 };
  function norm(s) {
    return (s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/(\d)\.(?=\s|$)/g, '$1. ').replace(/(\d):(\d\d)/g, '$1 uhr $2').replace(/[^a-z0-9. -]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function zahlwort(w) {
    if (ZAHL.hasOwnProperty(w)) return ZAHL[w];
    var m = /^(ein|zwei|drei|vier|fuenf|sechs|sieben|acht|neun)und(zwanzig|dreissig|vierzig|fuenfzig)$/.exec(w);
    if (m) return EINER[m[1]] + ZAHL[m[2]];
    return null;
  }
  function ordwort(w) {
    var s = w.replace(/(n|r|m|s)$/, '');
    if (ORD.hasOwnProperty(s)) return ORD[s];
    var m = /^(ein|zwei|drei|vier|fuenf|sechs|sieben|acht|neun)und(zwanzig|dreissig)ste$/.exec(s);
    if (m) return EINER[m[1]] + ZAHL[m[2]];
    return null;
  }
  var FUELL = /\b(aehm+|aeh+|oehm|hm+|hmm+|naja|na ja|aehem|halt|quasi|sozusagen|irgendwie)\b/g;
  function sprache(s) {   // gesprochene Zahlen → Ziffern, Füllwörter raus
    var x = norm(s).replace(FUELL, ' ').replace(/^(also|ja also|so|ok also|okay also)\s+/, '').replace(/\s+/g, ' ').trim();
    var t = x.split(' '), o = [];
    for (var i = 0; i < t.length; i++) {
      var w = t[i], z = zahlwort(w), od = z == null ? ordwort(w) : null;
      if (w === 'ein' || w === 'eine') { o.push(w); continue; }   // „ein Bad“ bleibt
      if (z != null) o.push(String(z));
      else if (od != null && !/^(erste|zweite)n?$/.test(w)) o.push(od + '.');
      else o.push(w);
    }
    // „zwanzig drei“ (selten) nicht zusammenziehen; „16 uhr 30“ bleibt
    return o.join(' ').replace(/\s+/g, ' ').trim();
  }
  function ziffern(s) {   // Telefonnummer aus Text (auch „null sieben drei eins …“, „doppel null“)
    var x = sprache(s).replace(/\bdoppel ?(\d)/g, '$1 $1'), d = x.replace(/[^0-9+]/g, '');
    return d;
  }

  /* ---------- Wünsche verstehen ---------- */
  var WT = { montag: 1, montags: 1, dienstag: 2, dienstags: 2, mittwoch: 3, mittwochs: 3, donnerstag: 4, donnerstags: 4, freitag: 5, freitags: 5, samstag: 6, samstags: 6, sonnabend: 6, sonntag: 0, sonntags: 0 };
  var MON = { januar: 0, jaenner: 0, februar: 1, maerz: 2, april: 3, mai: 4, juni: 5, juli: 6, august: 7, september: 8, oktober: 9, november: 10, dezember: 11 };
  function stunde(h, frueh) { h = +h; return h < 7 && !frueh ? h + 12 : h; }
  function wunsch(text, heute, vorschlaege) {
    heute = tag0(heute || new Date());
    var x = ' ' + sprache(text) + ' ', p = { tage: [], ohne: [], woche: null, datum: null, von: null, bis: null, leer: true };
    function set(k, v) { p[k] = v; p.leer = false; }
    // Wochentage (+ „nicht am Montag“)
    Object.keys(WT).forEach(function (w) {
      var re = new RegExp('(nicht|kein|keinen)( am| an)? ' + w + '\\b');
      if (re.test(x)) { if (p.ohne.indexOf(WT[w]) < 0) p.ohne.push(WT[w]); p.leer = false; }
      else if (new RegExp('\\b' + w + '\\b').test(x) && p.tage.indexOf(WT[w]) < 0) { p.tage.push(WT[w]); p.leer = false; }
    });
    if (/\bwochenende\b/.test(x)) { p.tage.push(6, 0); p.leer = false; }
    if (/\b(werktags|unter der woche)\b/.test(x)) p.leer = false;
    // Wochen
    if (/\bueber ?naechste woche\b|\bin 2 wochen\b|\bin zwei wochen\b/.test(x)) set('woche', 2);
    else if (/\bin 3 wochen\b|\bin drei wochen\b/.test(x)) set('woche', 3);
    else if (/\bin [4-9] wochen\b|\bin einem monat\b|\bnaechsten monat\b|\bnaechstes jahr\b|\bim (januar|februar|maerz|april|mai|juni|juli|august|september|oktober|dezember)\b/.test(x)) set('woche', 9);
    else if (/\bnaechste woche\b|\bkommende woche\b|\bnaechsten woche\b/.test(x)) set('woche', 1);
    else if (/\b(diese|dieser|diesen) woche\b|\bnoch diese woche\b/.test(x)) set('woche', 0);
    // morgen / übermorgen / heute
    if (/\buebermorgen\b/.test(x)) set('datum', plus(heute, 2));
    else if (/\bmorgen\b/.test(x)) set('datum', plus(heute, 1));
    else if (/\bheute\b/.test(x)) set('datum', heute);
    // Datum: „15. november“, „am 15.“, „15.11.“, „am 15“
    var m = /\b(\d{1,2})\.? ?(januar|jaenner|februar|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)\b/.exec(x) ||
            /\b(\d{1,2})\. ?(\d{1,2})\.?/.exec(x) || /\bam (\d{1,2})\.(?! uhr)/.exec(x) || /\bden (\d{1,2})\.(?! uhr)/.exec(x) || /\bam (\d{1,2})(?! uhr)\b(?! ?\d)/.exec(x);
    if (m) {
      var tg = +m[1], mo = m[2] == null ? null : (MON.hasOwnProperty(m[2]) ? MON[m[2]] : +m[2] - 1);
      if (tg >= 1 && tg <= 31 && (mo == null || (mo >= 0 && mo <= 11))) {
        var dt;
        if (mo == null) { dt = new Date(heute.getFullYear(), heute.getMonth(), tg); if (dt <= heute) dt = new Date(heute.getFullYear(), heute.getMonth() + 1, tg); }
        else { dt = new Date(heute.getFullYear(), mo, tg); if (dt < heute) dt = new Date(heute.getFullYear() + 1, mo, tg); }
        set('datum', dt);
      }
    }
    // Tageszeit
    if (/\b(vormittag|vormittags|morgens|frueh|frueh morgens|in der frueh|am morgen)\b/.test(x)) { set('bis', 12 * 60); if (/\b(frueh|morgens|in der frueh)\b/.test(x)) p.frueh = true; }
    if (/\b(nachmittag|nachmittags|mittags|nach dem mittag)\b/.test(x)) set('von', 12 * 60);
    if (/\b(mittag|mittags)\b/.test(x) && !/nachmittag/.test(x)) { set('von', 12 * 60); set('bis', 14 * 60); }
    if (/\b(abend|abends|feierabend|nach der arbeit|spaetnachmittag)\b/.test(x)) { set('von', 16 * 60 + 30); p.abends = true; }
    // Uhrzeiten
    var u, re2 = /\b(um|ab|nach|vor|bis|gegen)? ?(halb|viertel nach|viertel vor|dreiviertel)? ?(\d{1,2})( uhr)?( (\d{1,2}))?\b/g;
    while ((u = re2.exec(x))) {
      var hatUhr = !!u[4] || !!u[2] || /^(um|ab|nach|vor|bis|gegen)$/.test(u[1] || '');
      if (!hatUhr) continue;
      if (u[1] === 'am' || (+u[3] > 24)) continue;
      var h = +u[3], mi = u[6] ? +u[6] : 0;
      // „am 15.“ wurde schon als Datum gelesen
      if (!u[4] && !u[2] && x.slice(u.index + u[0].length, u.index + u[0].length + 1) === '.') continue;
      if (u[2] === 'halb') { h = h - 1; mi = 30; } else if (u[2] === 'viertel nach') mi = 15; else if (u[2] === 'viertel vor' || u[2] === 'dreiviertel') { h = h - 1; mi = 45; }
      if (u[6] && +u[6] > 59) mi = 0;
      var t = stunde(h, p.frueh) * 60 + mi;
      if (u[1] === 'ab' || u[1] === 'nach') { set('von', t + (u[1] === 'nach' && mi === 0 ? 1 : 0)); if (t > 16 * 60 + 30) p.abends = true; }
      else if (u[1] === 'vor' || u[1] === 'bis') { set('bis', t - (u[1] === 'vor' ? 1 : 0)); if (t <= 7 * 60 + 30) p.zuFrueh = true; }
      else { set('von', t - 45); set('bis', t + 45); p.genau = t; if (t > 16 * 60 + 30) p.abends = true; if (t < 7 * 60 + 30) p.zuFrueh = true; }
    }
    if (/\b(egal|hauptsache bald|so bald wie moeglich|so schnell wie moeglich|moeglichst bald|naechstmoeglich|fruehest|frueheste|fruehesten|schnellstmoeglich|wann immer|ist mir gleich)\b/.test(x)) { p.bald = true; p.leer = false; }
    if (/\b(spaeter|spaeteren|spaeteres|spaeterer)\b/.test(x) && !/\bspaetnachmittag\b/.test(x)) { p.spaeter = true; p.leer = false; }
    if (/\b(frueher|frueheren|frueheres|eher)\b/.test(x) && !/\beher (vormittags|nachmittags|morgens|abends)\b/.test(x)) { p.frueher = true; p.leer = false; }
    // Auswahl unter den Vorschlägen
    if (/\b(keiner|keine|beides nicht|beide nicht|anderen termin|andere termine|anderer termin|was anderes|etwas anderes|nicht so gut)\b/.test(x) || /\b(passt|passen|geht|gehen|klappt|klappen|kann ich|koennen wir|schaffe ich)\b(.*)\bnicht\b/.test(x) || /^(nein|ne|nee|noe)\b/.test(x.trim())) p.ablehnen = true;
    if (vorschlaege && vorschlaege.length && !p.ablehnen) {
      if (/\b(beide|beides|beide passen|geht beides|passt beides|ist beides)\b/.test(x)) p.beides = true;
      if (/\b(erste|ersten|erstere|ersteren|erster|1. termin|der fruehere|den frueheren|den ersten)\b/.test(x)) p.wahl = 0;
      if (/\b(zweite|zweiten|zweiter|letzte|letzteren|letztere|2. termin|den spaeteren|der spaetere)\b/.test(x) && vorschlaege.length > 1) p.wahl = 1;
    }
    return p;
  }

  /* ---------- Passende freie Termine suchen ---------- */
  function passt(s, p, heute) {
    var m = min(s.z);
    if (p.tage.length && p.tage.indexOf(s.dt.getDay()) < 0) return false;
    if (p.ohne.indexOf(s.dt.getDay()) > -1) return false;
    if (p.woche != null && woche(s.dt, heute) !== p.woche) return false;
    if (p.datum && key(s.dt) !== key(p.datum)) return false;
    if (p.von != null && m < p.von) return false;
    if (p.bis != null && m > p.bis) return false;
    if (p.nach && s.dt <= p.nach) return false;
    return true;
  }
  function alle(kal) { var r = []; kal.tage.forEach(function (t) { t.slots.forEach(function (s) { if (s.frei) r.push(s); }); }); return r; }
  function nimmZwei(liste, zweiAndererTag) {
    if (!liste.length) return [];
    var a = liste[0], b = null;
    if (zweiAndererTag) b = liste.filter(function (s) { return key(s.dt) !== key(a.dt); })[0] || null;
    if (!b) b = liste[1] || null;
    return b ? [a, b] : [a];
  }
  /* liefert {slots:[..], hinweis:[satz-ids], gelockert:bool} – hinweis erklärt ehrlich, warum etwas nicht geht */
  function suche(kal, p, ausgeschlossen) {
    var heute = kal.heute, frei = alle(kal).filter(function (s) { return !(ausgeschlossen && ausgeschlossen[s.key]); }), h = [];
    var tagWunsch = p.datum || (p.tage.length === 1 ? p.tage[0] : null);
    // ehrliche Hinweise vorab
    if (p.tage.length && p.tage.every(function (w) { return w === 0 || w === 6; })) { h.push('wochenende'); p = kopie(p, { tage: [] }); }
    else if (p.tage.length) p = kopie(p, { tage: p.tage.filter(function (w) { return w !== 0 && w !== 6; }) });
    if (p.datum) {
      var dk = key(p.datum);
      if (p.datum > kal.ende) { h.push('zu_weit'); p = kopie(p, { datum: null, spaetest: true }); }
      else if (tag0(p.datum) <= heute) { h.push(key(p.datum) === key(heute) ? 'heute_nicht' : 'vergangen'); p = kopie(p, { datum: null }); }
      else if (p.datum.getDay() === 0 || p.datum.getDay() === 6) { h.push('wochenende'); p = kopie(p, { nach: plus(p.datum, -1), datum: null }); }
      else if (feiertage(p.datum.getFullYear())[dk]) { h.push('tag_zu'); p = kopie(p, { nach: p.datum, datum: null }); }
    }
    if (p.abends) { h.push('spaet'); p = kopie(p, { von: 16 * 60 + 30, bis: null }); }
    if (p.zuFrueh) { h.push('zu_frueh'); p = kopie(p, { bis: 7 * 60 + 30, von: null }); }
    if (p.woche != null && p.woche > 3) { h.push('zu_weit'); p = kopie(p, { woche: null, spaetest: true }); }
    if (p.von != null && p.von >= 13 * 60 && p.tage.length && p.tage.every(function (w) { return w === 5; })) { h.push('fr_nachm'); p = kopie(p, { tage: [] }); }
    var treffer = frei.filter(function (s) { return passt(s, p, heute); });
    var gelockert = false;
    if (!treffer.length) {
      // Schritt für Schritt lockern: erst Uhrzeit, dann Tag/Woche – und ehrlich sagen
      var p2 = kopie(p, { von: null, bis: null });
      treffer = frei.filter(function (s) { return passt(s, p2, heute); });
      if (!h.length) h.push(treffer.length && (p.von != null || p.bis != null) ? 'zeit_belegt' : (tagWunsch != null && tagVoll(kal, p) ? 'tag_voll' : 'nichts_frei'));
      if (!treffer.length) { var p3 = kopie(p, { tage: [], datum: null, woche: null, nach: p.datum || p.nach || null }); treffer = frei.filter(function (s) { return passt(s, p3, heute); }); }
      if (!treffer.length) { var p4 = kopie(p, { tage: [], datum: null, woche: null }); treffer = frei.filter(function (s) { return passt(s, p4, heute); }); }
      if (!treffer.length) treffer = frei;
      gelockert = true;
    }
    if (p.spaetest) { treffer = treffer.slice().reverse(); var z2 = nimmZwei(treffer, true); return { slots: z2.reverse(), hinweis: h, gelockert: gelockert }; }
    var einTag = !!p.datum || (p.tage.length === 1 && p.woche != null);
    return { slots: nimmZwei(treffer, !einTag), hinweis: h, gelockert: gelockert };
  }
  function tagVoll(kal, p) { return kal.tage.some(function (t) { return (p.datum ? key(t.dt) === key(p.datum) : p.tage.indexOf(t.wt) > -1); }); }
  function kopie(o, z) { var r = {}; for (var k in o) r[k] = o[k]; for (k in z) r[k] = z[k]; return r; }

  G.KiTermine = { passt: passt, kalender: kalender, suche: suche, wunsch: wunsch, sprache: sprache, ziffern: ziffern, norm: norm, sprechId: sprechId, woche: woche,
    anzeige: anzeige, anzeigeKurz: anzeigeKurz, feiertage: feiertage, geschlossen: geschlossen, key: key, zt: zt, min: min, plus: plus, tag0: tag0,
    TAGL: TAGL, KURZ: KURZ, MONL: MONL };
})(typeof window !== 'undefined' ? window : globalThis);
