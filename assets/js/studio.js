/* Design-Studio – Häufele Webdesign
   Knopf mit [data-studio] oder Link auf #studio öffnet den Bereich. Links Live-Vorschau einer Beispiel-Seite,
   rechts Auswahl: Gewerk, Hintergrund (Live-3D aus hg-auswahl.js), Design-Stil, Farbe + Grundton, Schrift,
   Text-Effekt, 3D-Effekte. „Übernehmen“ trägt alles ins Wunsch-Formular (#wunsch) ein.
   Keine Daten an Server; Auswahl bleibt nur im Browser (localStorage). Läuft per Doppelklick (lokal). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Daten ---------- */
  /* Passender Start-Hintergrund pro Gewerk – gilt, solange der Nutzer selbst keinen gewählt hat */
  var HG_STD = { elektro: 'netz4', sanitaer: 'kaustik4', fliesen: 'metallpro', schreiner: 'portalpro', pv: 'punkt4', dach: 'prismapro', maler: 'orbit4' };
  var GEWERKE = {
    elektro: { name: 'Elektro', ort: 'Senden', tpl: 'elektro', h: ['Strom, der passt.', 'Sauber verlegt.'], lead: 'Elektroinstallation, Zählerschrank und Wallbox – geplant, verlegt und sauber dokumentiert.', k: [['Zählerschrank', 'Erneuerung nach aktueller Norm.'], ['Wallbox', 'Laden in der eigenen Garage.'], ['Smart Home', 'Licht und Rollläden per App.']] },
    sanitaer: { name: 'Sanitär & Heizung', ort: 'Ulm', tpl: 'sanitaer', h: ['Ihr neues Bad.', 'Aus einer Hand.'], lead: 'Planung, Abdichtung, Fliesen und Montage – ein Ansprechpartner von der ersten Idee bis zur Übergabe.', k: [['Badsanierung', 'Komplettbad mit festem Ablauf.'], ['Bodengleiche Dusche', 'Abdichtung nach DIN 18534.'], ['Heizung', 'Wartung und Austausch.']] },
    fliesen: { name: 'Fliesen', ort: 'Neu-Ulm', tpl: 'fliesen', h: ['Jede Fuge sitzt.', 'Auf den Millimeter.'], lead: 'Großformat, Mosaik und Naturstein – verlegt mit Plan, sauber abgedichtet und pünktlich übergeben.', k: [['Großformat', 'Platten bis 120 × 240 cm.'], ['Bad & Dusche', 'Abdichtung im Verbund.'], ['Terrasse', 'Mit Gefälle und Drainage.']] },
    schreiner: { name: 'Schreinerei', ort: 'Blaubeuren', tpl: 'schreiner', h: ['Nach Maß gebaut.', 'Für Jahrzehnte.'], lead: 'Einbauschränke, Küchen und Möbel aus Massivholz – geplant für Ihren Raum, gefertigt mit Sorgfalt.', k: [['Einbauschrank', 'Bis unter die Dachschräge.'], ['Küche', 'Fronten aus einem Stück.'], ['Treppen', 'Eiche, Esche, Nussbaum.']] },
    pv: { name: 'Photovoltaik', ort: 'Illertissen', tpl: 'pv', h: ['Strom vom eigenen Dach.', 'Ohne Umwege.'], lead: 'Planung, Montage und Inbetriebnahme Ihrer PV-Anlage – auf Wunsch mit Speicher und Wallbox.', k: [['PV-Anlage', 'Ausgelegt auf Ihren Verbrauch.'], ['Speicher', 'Abends den eigenen Strom nutzen.'], ['Wallbox', 'Das Auto mit Sonne laden.']] },
    dach: { name: 'Dachdeckerei', ort: 'Senden', tpl: '', h: ['Dicht bei jedem Wetter.', 'Sauber gedeckt.'], lead: 'Neueindeckung, Dachfenster und Reparaturen – mit Gerüst, Plan und ordentlicher Baustelle.', k: [['Neueindeckung', 'Ziegel, Lattung, Unterspannbahn.'], ['Dachfenster', 'Mehr Licht unterm Dach.'], ['Reparatur', 'Sturmschaden schnell behoben.']] },
    maler: { name: 'Malerbetrieb', ort: 'Ulm', tpl: '', h: ['Farbe, die bleibt.', 'Kanten, die stimmen.'], lead: 'Innenräume, Fassaden und Spachteltechnik – abgeklebt, sauber gestrichen und besenrein übergeben.', k: [['Innenräume', 'Wände, Decken, Lackierungen.'], ['Fassade', 'Reinigen, ausbessern, streichen.'], ['Spachteltechnik', 'Fugenlose Oberflächen.']] }
  };
  /* [Schlüssel, Name, Beschreibung, Gruppe] – Gruppe: 3d = echte Blender-Szene, kunde = von Niklas' Kunden-Seiten, live = programmiert */
  var HG = [
    ['funken', 'Goldene Funken', 'Wie Harzerhof: tiefes Schwarz, Funken in drei Tiefen', 'kunde'],
    ['wasser', 'Tiefes Wasser', 'Demirel Haustechnik: Kaustik, Lichtstrahlen, Bläschen', 'kunde'],
    ['tiefe', 'Polierte Tiefe', 'Germanos Natursteine: glänzende Fläche, funkelnde Kristalle', 'kunde'],
    ['ringe', 'Jahresringe aus Licht', 'Service Schreiner: feine Lichtlinien', 'kunde'],
    ['dampf', 'Dampf im Abendlicht', 'Yildiz Sanierungen: Nebelschichten, Lichtpunkte', 'kunde'],
    ['prisma', 'Prisma-Linien', 'Feine Glasbänder, Licht in Orange und Blau', 'kunde'],
    ['keiner', 'Nur Grundton', 'Ruhige Fläche ohne Bewegung', 'kunde'],
    ['netz4', 'Raumzeit-Gitter', 'Ein leuchtendes Gitter im Dunkeln, Schwerkraft-Mulden wandern darüber und folgen der Maus', 'krass'],
    ['punkt4', 'Punktwelle', 'Tausende Lichtpunkte in Reihen, eine Welle läuft durch – die Maus wirft Ringe', 'krass'],
    ['orbit4', 'Orbit-Nebel', 'Dunkler Nebel, leuchtende Bahnen, Chrom-Kugeln kreisen mit echter Spiegelung', 'krass'],
    ['kaustik4', 'Kaustik-Tiefe', 'Lichtnetz wie unter Wasser, Lichtschächte von oben, Schwebeteilchen', 'krass'],
    ['karbonpro', 'Carbon-Gewebe', 'Echtes Köper-Gewebe, jedes Faserbündel fängt das Licht anders – das Streiflicht wandert mit der Maus', 'archiv'],
    ['basaltpro', 'Basalt-Säulen', 'Große schwarze Säulen, jede leicht gekippt und atmend, mattes Licht an den Kanten', 'archiv'],
    ['lamellenpro', 'Lamellenwand', 'Runde schwarze Lamellen drehen sich, dazwischen bricht Licht in Ihrer Farbe durch', 'archiv'],
    ['punktepro', 'Punkt-Relief', 'Ein Raster aus Lichtpunkten wächst und schrumpft entlang eines Reliefs, Parallaxe zur Maus', 'archiv'],
    ['satinpro', 'Samt-Vorhang', 'Schwerer schwarzer Samt in tiefen Falten, Licht streift die Faltenkanten', 'archiv'],
    ['duenenpro', 'Schwarzleder', 'Dunkles Narbenleder im Streiflicht, einzelne Körner glitzern', 'archiv'],
    ['foliepro', 'Kristall-Gitter', 'Gekreuzte Glasbänder brechen das Licht in Facetten, Ihre Farbe im Kern', 'archiv'],
    ['prismapro', 'Lichtprisma', 'Ein weißer Lichtstrahl trifft ein Glasprisma und fächert ins Spektrum auf – echte Brechung, dreht sich zur Maus', 'pro'],
    ['neonpro', 'Lichtstrom in Ihrer Farbe', '40 Lichtfäden bündeln sich zu einem Strom aus der Tiefe – die Maus biegt ihn', 'pro'],
    ['wellenpro', 'Ringwellen in der Tiefe', 'Dunkle Fläche, ruhige Wellen, ein Lichtpuls läuft nach außen', 'pro'],
    ['metallpro', 'Flüssiges Metall', 'Chromtropfen verschmelzen langsam, Studiolicht, Gegenlicht in Ihrer Farbe', 'pro'],
    ['portalpro', 'Lichttür im Nebel', 'Offene Tür voller Licht, Lichtteppich am Boden, Staub schwebt im Strahl', 'pro'],
    ['glasstudio', 'Glas-Studio', 'Drei dünne Glasscheiben im Spotlicht auf spiegelndem Boden – echte Spiegelung, drehen sich zur Maus', 'pro'],
    ['sonnepro', 'Sonne', 'Glühende Plasma-Kugel mit Granulation, Sonnenflecken und Korona – ruhig in der Tiefe', 'pro'],
    ['facettenpro', 'Glas-Facetten', 'Zersprungener Glasblock: jeder Splitter bricht das Licht anders, feine Haarrisse', 'pro'],
    ['seidepro', 'Seide im Abendlicht', 'Weiche, breite Falten mit warmem Schimmer', 'pro'],
    ['funkenpro', 'Funken in drei Tiefen', 'Glut steigt auf: vorn unscharf, Mitte gestochen scharf, hinten Staub', 'pro'],
    ['chrompro', 'Flüssiges Chrom', 'Dunkles Metall mit Studiolicht, Gegenlicht in Ihrer Farbe', 'pro'],
    ['lack', 'Indigo-Lack', 'Dicke Lackbänder strömen diagonal, Glanzkanten spalten das Licht', 'pro'],
    ['lackfarbe', 'Schwarzlack in Ihrer Farbe', 'Tiefschwarze Bänder, Glanz in Ihrer Farbe – ruhig hinter Text', 'pro'],
    ['kristall', 'Glas-Blitz im Indigo-Strom', 'Echtes Glas in Echtzeit: Licht bricht sich in Violett und Bernstein, dreht sich zur Maus', 'blitz'],
    ['kristallfarbe', 'Glas-Blitz in Ihrer Farbe', 'Dieselbe Szene in Schwarzlack, Glanz und Kern in Ihrer Akzentfarbe', 'blitz'],
    ['edelstein', 'Glas-Kristall im Indigo-Strom', 'Geschliffener Kristall statt Blitz – passt zu jedem Gewerk', 'blitz']
  ];
  var HG_GRUPPEN = [['kunde', 'Aus meinen Kunden-Seiten', 'Ruhige Live-Hintergründe aus den Seiten, die ich schon gebaut habe – in Ihrer Farbe.'], ['krass', 'Neu: Welten aus Licht', 'Jeder Bildpunkt wird live berechnet – Gitter, Punktwelle, Orbit, Kaustik. Reagiert auf die Maus, bis 4K.'], ['pro', 'Echtes 3D in Echtzeit', 'Jeder Bildpunkt wird live berechnet: echtes Licht, echte Spiegelung – gestochen scharf bis 4K, bewegt sich mit der Maus.'], ['blitz', 'Glas & Blitz', 'Geschliffenes Glas und Lichtblitze – ein starker Auftritt, wenn es auffallen darf.']];
  var AUFBAU = [
    ['hero', 'Startbereich', [['stil', 'Wie der Design-Stil', ''], ['links', 'Links', 'Text links, Hintergrund rechts frei'], ['mitte', 'Mittig', 'Alles zentriert'], ['geteilt', 'Geteilt', 'Text schmal links, rechts viel Raum'], ['unten', 'Unten groß', 'Riesige Überschrift unten im Bild']]],
    ['nav', 'Menü', [['klassisch', 'Klassisch', 'Logo links, Menü rechts'], ['mitte', 'Menü mittig', 'Menü in der Mitte'], ['pille', 'Schwebende Leiste', 'Glas-Leiste mit runden Ecken']]],
    ['karten', 'Leistungen', [['raster', 'Drei Karten', 'Nebeneinander'], ['liste', 'Liste mit Linien', 'Untereinander, ruhig'], ['versetzt', 'Versetzt', 'Mittlere Karte tiefer, mehr Bewegung']]],
    ['ecken', 'Ecken', [['stil', 'Wie der Design-Stil', ''], ['eckig', 'Eckig', '0 px'], ['sanft', 'Sanft', '10 px'], ['rund', 'Rund', '22 px']]],
    ['knopf', 'Knöpfe', [['stil', 'Wie der Design-Stil', ''], ['flaeche', 'Farbfläche', ''], ['umriss', 'Umriss', ''], ['schraeg', 'Schräg geschnitten', ''], ['link', 'Text mit Linie', '']]],
    ['kopf', 'Kopfzeile beim Scrollen', [['transparent', 'Transparent', 'Liegt frei über dem Hintergrund'], ['fest', 'Fest mit Hintergrund', 'Bleibt oben, dunkle Fläche'], ['versteckt', 'Verschwindet beim Runterscrollen', 'Kommt beim Hochscrollen zurück']], 1],
    ['bild', 'Bildstil', [['normal', 'Wie aufgenommen', ''], ['sw', 'Schwarz-Weiß', 'Zeitlos, ruhig'], ['warm', 'Warm', 'Leicht goldener Ton'], ['kuehl', 'Kühl', 'Leicht blauer Ton'], ['korn', 'Mit Filmkorn', 'Feines Korn über allem']], 1],
    ['cursor', 'Mauszeiger', [['normal', 'Normal', ''], ['ring', 'Leuchtender Ring', 'Ein Ring folgt weich der Maus und wächst über Knöpfen']], 1],
    ['scroll', 'Scroll-Effekt der Abschnitte', [['normal', 'Ruhig, normal', ''], ['stapel', 'Abschnitte schieben sich übereinander', 'Jeder Abschnitt deckt den vorigen zu'], ['bahn', 'Horizontale Bahn', 'Projekte laufen beim Scrollen seitlich durch'], ['reveal', 'Bilder öffnen sich', 'Bilder werden per Maske aufgezogen']], 1],
    ['uebergang', 'Seitenübergang', [['normal', 'Normal', ''], ['blende', 'Weiche Überblendung', ''], ['vorhang', 'Vorhang', 'Eine Fläche in Ihrer Farbe fährt durchs Bild'], ['kreis', 'Kreis öffnet sich', '']], 1],
    ['lade', 'Lade-Animation', [['ohne', 'Ohne', ''], ['logo', 'Logo erscheint', 'Kurz Ihr Logo, dann öffnet sich die Seite'], ['zaehler', 'Zähler 0 → 100', 'Große Zahl zählt hoch']], 1]
  ];
  /* Bausteine: kleine Live-Vorschau in der Beispiel-Seite; „Übernehmen“ schaltet die passenden Chips im Wunsch-Formular */
  var BAU = [
    ['rechner', 'Rechner', 'Besucher rechnen selbst eine Größenordnung aus.'], ['vorher', 'Vorher / Nachher-Regler', 'Ein Regler zieht zwischen alt und neu.'],
    ['telefon', 'KI-Telefon', 'Nimmt Anrufe an und bucht Termine – rund um die Uhr.'], ['assistent', 'Fragen-Assistent', 'Kleines Chat-Fenster beantwortet Fragen zum Betrieb.'],
    ['nfc', 'NFC-Bewertungskarte', 'Karte antippen, Google-Bewertung in 10 Sekunden.'], ['bewertungen', 'Google-Bewertungen', 'Sterne und Anzahl, mit Link zu Google.'], ['jobs', 'Stellenanzeigen', 'Offene Stellen direkt auf der Seite.']
  ];
  var STILE = [
    ['editorial', 'Editorial', 'Wie ein Magazin: links, große Überschrift, zweite Zeile kursiv.', '<i style="left:10%;top:20%;width:58%;height:14%"></i><i style="left:10%;top:42%;width:42%;height:14%;opacity:.55"></i><i style="left:10%;top:72%;width:22%;height:6%;opacity:.35"></i>'],
    ['luxus', 'Luxus', 'Zentriert, viel Luft, feine Linien, ruhige Knöpfe.', '<i style="left:30%;top:16%;width:40%;height:3%;opacity:.5"></i><i style="left:20%;top:32%;width:60%;height:12%"></i><i style="left:28%;top:52%;width:44%;height:12%;opacity:.55"></i><i style="left:40%;top:78%;width:20%;height:8%;opacity:.35"></i>'],
    ['technik', 'Technisch', 'Raster, Mono-Schrift, Eckmarken, Messwerte.', '<i style="left:0;top:0;right:0;bottom:0;width:auto;height:auto;background:repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 1px,transparent 1px 14px),repeating-linear-gradient(0deg,rgba(255,255,255,.08) 0 1px,transparent 1px 14px)"></i><i style="left:10%;top:24%;width:50%;height:12%"></i><i style="left:10%;top:62%;width:14%;height:14%;opacity:.5"></i><i style="left:28%;top:62%;width:14%;height:14%;opacity:.5"></i>'],
    ['mutig', 'Mutig', 'Riesige Versalien, Schräg-Knöpfe, große Nummern.', '<i style="left:6%;top:14%;width:86%;height:26%"></i><i style="left:6%;top:46%;width:66%;height:26%;opacity:.55"></i><i style="left:6%;top:80%;width:24%;height:9%;transform:skewX(-14deg)"></i>'],
    ['glas', 'Glas', 'Alles auf Milchglas-Flächen, der Hintergrund scheint durch.', '<i style="left:8%;top:14%;width:62%;height:56%;border-radius:8px;opacity:.18"></i><i style="left:14%;top:24%;width:44%;height:12%"></i><i style="left:14%;top:44%;width:30%;height:9%;opacity:.5"></i><i style="left:74%;top:30%;width:18%;height:40%;border-radius:8px;opacity:.18"></i>'],
    ['brutal', 'Kantig & roh', 'Dicke Rahmen, harte Schatten, Mono-Beschriftung.', '<i style="left:8%;top:16%;width:60%;height:18%;box-shadow:5px 5px 0 rgba(255,255,255,.35)"></i><i style="left:8%;top:48%;width:26%;height:26%;background:transparent;border:2px solid #e9e7e2"></i><i style="left:40%;top:48%;width:26%;height:26%;background:transparent;border:2px solid #e9e7e2"></i>'],
    ['ruhig', 'Ruhig & klar', 'Mittelgroß, runde Karten, weiche Formen.', '<i style="left:10%;top:22%;width:46%;height:11%;border-radius:8px"></i><i style="left:10%;top:42%;width:32%;height:11%;border-radius:8px;opacity:.55"></i><i style="left:10%;top:70%;width:22%;height:12%;border-radius:20px;opacity:.35"></i>']
  ];
  var SCHRIFTEN = [
    { k: 'editorial', n: 'Editorial', d: 'Space Grotesk + Newsreader kursiv', fd: "'St Grotesk'", w: 600, ls: '-.035em', lh: '.95', akzF: "'St Newsreader'", akzSt: 'italic', fb: "'St Grotesk'", fm: "'St Mono'" },
    { k: 'antiqua', n: 'Luxus-Antiqua', d: 'Cormorant + Sora', fd: "'St Cormorant'", st: 'italic', w: 500, ls: '-.01em', lh: '.98', akzF: "'St Cormorant'", akzSt: 'italic', fb: "'St Sora'", fm: "'St Mono'" },
    { k: 'klassisch', n: 'Klassisch kräftig', d: 'DM Serif Display + Hanken Grotesk', fd: "'St DM Serif'", w: 400, ls: '-.02em', lh: '.98', akzF: "'St DM Serif'", akzSt: 'italic', fb: "'St Hanken'", fm: "'St Mono'" },
    { k: 'elegant', n: 'Elegant fein', d: 'Instrument Serif + Manrope', fd: "'St Instrument'", st: 'italic', w: 400, ls: '-.015em', lh: '.94', akzF: "'St Instrument'", akzSt: 'italic', fb: "'St Manrope'", fm: "'St JetBrains'" },
    { k: 'charakter', n: 'Mit Charakter', d: 'Bricolage Grotesque + Fraunces', fd: "'St Bricolage'", w: 800, str: '75%', ls: '-.03em', lh: '.92', akzF: "'St Fraunces'", akzSt: 'italic', fb: "'St Bricolage'", fm: "'St Mono'" },
    { k: 'warm', n: 'Warm & weich', d: 'Fraunces + Manrope', fd: "'St Fraunces'", st: 'italic', w: 560, ls: '-.02em', lh: '.98', akzF: "'St Fraunces'", akzSt: 'italic', fb: "'St Manrope'", fm: "'St Mono'" },
    { k: 'geometrisch', n: 'Geometrisch', d: 'Sora', fd: "'St Sora'", w: 700, ls: '-.04em', lh: '.98', akzF: "'St Sora'", akzSt: 'normal', fb: "'St Sora'", fm: "'St Mono'", akzW: 300 },
    { k: 'breit', n: 'Breit & schnell', d: 'Archivo Wide + Montserrat', fd: '"Archivo Wide"', st: 'italic', w: 900, str: '125%', tt: 'uppercase', ls: '-.01em', lh: '.9', akzF: '"Archivo Wide"', akzSt: 'italic', fb: 'Montserrat', fm: '"GeistMono"' },
    { k: 'mono', n: 'Technik-Mono', d: 'JetBrains Mono + Space Grotesk', fd: "'St JetBrains'", w: 700, ls: '-.04em', lh: '1', akzF: "'St JetBrains'", akzSt: 'normal', fb: "'St Grotesk'", fm: "'St JetBrains'", akzW: 300 }
  ];
  var FARBEN = [['Gold', '#E8B931'], ['Kupfer', '#C98A5C'], ['Holz', '#D9A15A'], ['Signalrot', '#E2453A'], ['Smaragd', '#3FB27F'], ['Türkis', '#4FB8AC'], ['Eisblau', '#9FD4F2'], ['Royal', '#4F7BF0'], ['Violett', '#8E6CF0'], ['Chrom', '#CFD3D8']];
  var GRUND = [['schwarz', 'Schwarz', [.016, .016, .018], '#050506'], ['nacht', 'Nachtblau', [.012, .022, .044], '#03070f'], ['anthrazit', 'Anthrazit warm', [.030, .026, .022], '#0b0907'], ['wald', 'Waldgrün', [.012, .030, .022], '#030a07'], ['bordeaux', 'Bordeaux', [.036, .012, .016], '#0b0304']];
  var TEXT = [['wort', 'Wort für Wort', 'Jedes Wort taucht aus der Unschärfe auf.'], ['zeilen', 'Zeilen steigen auf', 'Die Zeilen schieben sich aus einer Kante nach oben.'], ['licht', 'Lichtkante', 'Ein Lichtstreif fährt einmal über die Schrift.'], ['scramble', 'Anzeigetafel', 'Buchstaben rattern kurz, dann steht der Text.'], ['fallen', 'Buchstaben klappen in 3D', 'Jeder Buchstabe kippt einzeln aus der Tiefe nach vorn.'], ['tippen', 'Schreibmaschine', 'Der Text wird Zeichen für Zeichen geschrieben, mit Cursor.'], ['maske', 'Farbbalken', 'Ein Balken in Ihrer Farbe fährt über die Zeile und legt den Text frei.'], ['schaerfe', 'Aus dem Nebel', 'Die Schrift zieht sich aus breitem Nebel zusammen.'], ['keiner', 'Ohne Effekt', 'Text steht sofort da.']];
  var DREI = [['seite', 'Ganze Seite kippt in 3D', 'Die komplette Seite neigt sich räumlich zur Maus.'], ['schrift3d', 'Überschrift mit Tiefe', 'Die Überschrift bekommt echte Tiefe und dreht sich zur Maus.'], ['flip', 'Karten drehen sich um', 'Beim Darüberfahren dreht sich jede Karte und zeigt die Rückseite.'], ['explosion', 'Startbereich fliegt ein', 'Text, Knöpfe und Karten fliegen beim Laden aus der Tiefe auf ihren Platz.'], ['rahmen', 'Leuchtender Rahmen', 'Ein Lichtband läuft ständig um jede Karte.'], ['glanzkante', 'Glanz läuft über Knöpfe', 'Alle paar Sekunden zieht ein Lichtstreif über Knöpfe und Karten.'], ['heben', 'Karten heben ab', 'Karten heben sich beim Darüberfahren mit Schatten an.'], ['funken', 'Funken folgen der Maus', 'Feine Funken in Ihrer Farbe ziehen hinter dem Mauszeiger her.'], ['spiegel', 'Spiegelung', 'Die Überschrift spiegelt sich weich wie auf poliertem Stein.'],['neigung', 'Karten neigen sich zur Maus', 'Echte 3D-Neigung mit wanderndem Glanz.'], ['tiefe', 'Tiefen-Ebenen', 'Text, Knöpfe und Karten liegen auf verschiedenen Ebenen und verschieben sich räumlich.'], ['glas', 'Glas-Karten', 'Milchglas mit Lichtkante – der Hintergrund schimmert durch.'], ['spot', 'Licht folgt der Maus', 'Ein weicher Lichtkegel in Ihrer Farbe.'], ['magnet', 'Magnet-Knöpfe', 'Knöpfe ziehen sich leicht zur Maus.'], ['schweben', 'Schwebende Karten', 'Karten klappen in 3D herein und schweben leicht.']];
  var START = { hero: 'stil', nav: 'klassisch', karten: 'raster', ecken: 'stil', knopf: 'stil', gewerk: 'elektro', firma: '', hg: 'netz4', hgHand: false, stil: 'editorial', farbe: '#E8B931', grund: 'schwarz', schrift: 'editorial', text: 'wort', d3: ['neigung', 'tiefe', 'spot'], bau: [], kopf: 'transparent', bild: 'normal', cursor: 'normal', scroll: 'normal', uebergang: 'normal', lade: 'ohne' };

  var S = JSON.parse(JSON.stringify(START));
  try { var gesp = JSON.parse(localStorage.getItem('hw-studio') || 'null'); if (gesp && gesp.gewerk) S = Object.assign(S, gesp); } catch (e) { }
  if (!HG.some(function (h) { return h[0] === S.hg; })) S.hg = START.hg; /* alte, gestrichene Hintergründe -> Standard */
  function merk() { try { localStorage.setItem('hw-studio', JSON.stringify(S)); } catch (e) { } }
  function finde(liste, k) { for (var i = 0; i < liste.length; i++) if ((liste[i].k || liste[i][0]) === k) return liste[i]; return liste[0]; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }

  /* ---------- Bauen (erst beim ersten Öffnen) ---------- */
  var root = null, sv, frame, cvBox, hgH = null, gebaut = false, ladeHG = null, schriftLink = null, schriftenDa = false;
  function lade(tag, attr) { return new Promise(function (ok) { var e = document.createElement(tag); for (var k in attr) e[k] = attr[k]; e.onload = ok; e.onerror = ok; document.head.appendChild(e); }); }
  function bau() {
    if (gebaut) return; gebaut = true;
    schriftLink = lade('link', { rel: 'stylesheet', href: 'assets/css/studio-schriften.css' });
    ladeHG = (window.HG_START ? Promise.resolve() : lade('script', { src: 'assets/js/hg-auswahl.js' })).then(function () { return window.R3D_LISTE ? null : lade('script', { src: 'assets/js/r3d.js' }); }).then(function () { return window.HG_SEE ? null : lade('script', { src: 'assets/js/hg-see.js' }); }).then(function () { return window.HG_PRO ? null : lade('script', { src: 'assets/js/hg-pro.js' }); }).then(function () { return window.HG_PRO2 ? null : lade('script', { src: 'assets/js/hg-pro2.js' }); }).then(function () { return window.HG_PRO3 ? null : lade('script', { src: 'assets/js/hg-pro3.js' }); }).then(function () { return window.HG_PRO4 ? null : lade('script', { src: 'assets/js/hg-pro4.js' }); });
    root = document.createElement('div'); root.className = 'st'; root.id = 'studio'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Design-Studio'); root.setAttribute('data-lenis-prevent', '');
    var gOpt = Object.keys(GEWERKE).map(function (k) { return '<option value="' + k + '">' + GEWERKE[k].name + '</option>'; }).join('');
    root.innerHTML =
      '<div class="st-links">' +
      ' <div class="st-oben"><div class="st-titel">Design-Studio<small>Klicken Sie rechts durch – die Vorschau ändert sich sofort.</small></div>' +
      '  <div class="st-geraete" role="group" aria-label="Vorschau-Gerät"><button type="button" data-geraet="desktop" aria-pressed="true">Computer</button><button type="button" data-geraet="handy" aria-pressed="false">Handy</button></div>' +
      '  <button type="button" class="st-mini" data-tun="zufall">🎲 Überrasch mich</button><button type="button" class="st-zu" data-tun="zu" aria-label="Design-Studio schließen">×</button></div>' +
      ' <div class="st-buehne"><div class="st-frame" data-geraet="desktop"><div class="st-leiste" aria-hidden="true"><i></i><i></i><i></i><span id="st-url">ihr-betrieb.de</span></div>' +
      '  <div class="sv" id="st-sv" aria-label="Vorschau der Beispiel-Seite"><div class="sv-hg-box"></div><div class="sv-schleier"></div><div class="sv-raster"></div><div class="sv-spot"></div>' +
      '   <div class="sv-innen"><div class="sv-kopf"><div class="sv-logo"><i></i><span id="sv-firma"></span></div><div class="sv-nav"><span>Leistungen</span><span>Projekte</span><span>Über uns</span></div><span class="sv-k" data-magnet>Termin anfragen</span></div>' +
      '    <div class="sv-hero"><div class="sv-eye" data-t="6" id="sv-eye"></div><h2 class="sv-h1" data-t="16" id="sv-h1"></h2><p class="sv-lead" data-t="9" id="sv-lead"></p>' +
      '     <div class="sv-akt" data-t="12"><span class="sv-k" data-magnet>Anfrage stellen →</span><span class="sv-k hohl" data-magnet>Projekte ansehen</span></div></div>' +
      '    <div class="sv-karten" data-t="24" id="sv-karten"></div>' +
      '    <div class="sv-zahlen" data-t="5"><div><strong>24 h</strong>Rückmeldung</div><div><strong>30 km</strong>Einsatzgebiet</div><div><strong>1</strong>Ansprechpartner</div></div>' +
      '    <div class="sv-bau" id="sv-bau"></div></div><div class="sv-ring" aria-hidden="true"></div></div>' +
      '  <span class="st-beispiel">Beispielinhalt</span></div></div>' +
      '</div>' +
      '<div class="st-rechts">' +
      ' <div class="st-inhalt-wahl"><label>Gewerk<select id="st-gewerk">' + gOpt + '</select></label><label>Firmenname<input id="st-firma" maxlength="40" placeholder="Ihr Betrieb" autocomplete="organization"></label></div>' +
      ' <div class="st-tabs" role="tablist">' + [['hg', 'Hintergrund'], ['stil', 'Design'], ['aufbau', 'Aufbau'], ['farbe', 'Farbe'], ['schrift', 'Schrift'], ['effekte', 'Effekte'], ['drei', '3D'], ['bau', 'Bausteine']].map(function (t, i) {
        return '<button type="button" role="tab" id="st-tab-' + t[0] + '" aria-controls="st-p-' + t[0] + '" aria-selected="' + (i === 0) + '"><b>0' + (i + 1) + '</b>' + t[1] + '</button>'; }).join('') + '</div>' +
      ' <div class="st-panel" id="st-p-hg" role="tabpanel"><div id="st-hg"></div></div>' +
      ' <div class="st-panel" id="st-p-aufbau" role="tabpanel" hidden><div id="st-aufbau"></div></div>' +
      ' <div class="st-panel" id="st-p-stil" role="tabpanel" hidden><h4>Design-Stil</h4><p class="st-info">Bestimmt Aufbau, Knöpfe, Karten und Abstände.</p><div class="st-raster" id="st-stil"></div></div>' +
      ' <div class="st-panel" id="st-p-farbe" role="tabpanel" hidden><h4>Akzentfarbe</h4><div class="st-farben" id="st-farben"></div><label class="st-eigene"><input type="color" id="st-eigen"> Eigene Farbe (z. B. aus Ihrem Logo)</label><h4>Grundton</h4><div class="st-grund" id="st-grund"></div></div>' +
      ' <div class="st-panel" id="st-p-schrift" role="tabpanel" hidden><h4>Schrift</h4><p class="st-info">Alle Schriften liegen direkt auf Ihrer Website – nichts wird von Google geladen.</p><div class="st-raster" id="st-schrift"></div></div>' +
      ' <div class="st-panel" id="st-p-effekte" role="tabpanel" hidden><h4>Text-Effekt der Überschrift</h4><div class="st-liste" id="st-text"></div><button type="button" class="st-abspielen" data-tun="abspielen">↻ Effekt nochmal abspielen</button></div>' +
      ' <div class="st-panel" id="st-p-drei" role="tabpanel" hidden><h4>3D-Effekte</h4><p class="st-info">Mehrere gleichzeitig möglich. Mit der Maus über die Vorschau fahren.</p><div class="st-liste" id="st-drei"></div></div>' +
      ' <div class="st-panel" id="st-p-bau" role="tabpanel" hidden><h4>Bausteine</h4><p class="st-info">Schalten Sie ein, was auf Ihre Seite soll – unten in der Vorschau sehen Sie sofort, wie es aussieht. Die Texte dort sind Beispiele.</p><div class="st-liste" id="st-bau"></div></div>' +
      ' <div class="st-fuss"><div class="st-wahl" id="st-wahl"></div><div class="st-fuss-reihe"><button type="button" class="knopf st-los" data-tun="uebernehmen">Übernehmen &amp; anfragen →</button></div>' +
      '  <p class="st-hinweis">Ihre Seite wird komplett nach dieser Auswahl gebaut – nichts von der Stange. · <a href="#" data-tun="reset">Zurücksetzen</a></p></div>' +
      '</div>';
    document.body.appendChild(root);
    sv = $('#st-sv', root); frame = $('.st-frame', root); cvBox = $('.sv-hg-box', root);

    /* Kacheln */
    $('#st-hg', root).innerHTML = HG_GRUPPEN.map(function (gr) {
      return '<h4>' + gr[1] + '</h4>' + (gr[2] ? '<p class="st-info">' + gr[2] + '</p>' : '') + '<div class="st-raster st-hgr">' + HG.filter(function (h) { return h[3] === gr[0]; }).map(function (h) {
        var bild = h[0] === 'keiner' ? '<img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAUFBgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==">' : '<img alt="" loading="lazy" src="assets/img/studio/hg-' + h[0] + '.webp">';
        return '<button type="button" class="st-kachel" data-k="' + h[0] + '" aria-pressed="false">' + (h[3] === '3d' ? '<em class="neu">3D</em>' : '') + bild + '<span>' + h[1] + '<small>' + h[2] + '</small></span></button>'; }).join('') + '</div>';
    }).join('');
    $('#st-aufbau', root).innerHTML = AUFBAU.map(function (g) {
      return '<h4>' + g[1] + '</h4><div class="st-chips" data-feld="' + g[0] + '">' + g[2].map(function (o) { return '<button type="button" class="st-chip" data-k="' + o[0] + '" aria-pressed="false">' + o[1] + (o[2] ? '<small>' + o[2] + '</small>' : '') + '</button>'; }).join('') + '</div>';
    }).join('');
    $('#st-stil', root).innerHTML = STILE.map(function (s) { return '<button type="button" class="st-kachel st-stil" data-k="' + s[0] + '" aria-pressed="false"><div class="muster" aria-hidden="true">' + s[3] + '</div><span>' + s[1] + '<small>' + s[2] + '</small></span></button>'; }).join('');
    $('#st-farben', root).innerHTML = FARBEN.map(function (f) { return '<button type="button" class="st-farbe" style="--f:' + f[1] + '" data-k="' + f[1] + '" aria-pressed="false" aria-label="' + f[0] + '"><span>' + f[0] + '</span></button>'; }).join('');
    $('#st-grund', root).innerHTML = GRUND.map(function (g) { return '<button type="button" style="--f:' + g[3] + '" data-k="' + g[0] + '" aria-pressed="false">' + g[1] + '</button>'; }).join('');
    $('#st-schrift', root).innerHTML = SCHRIFTEN.map(function (f) {
      var st1 = 'font-family:' + f.fd + ';font-style:' + (f.st || 'normal') + ';font-weight:' + f.w + ';font-stretch:' + (f.str || '100%') + ';text-transform:' + (f.tt || 'none') + ';letter-spacing:' + f.ls;
      var st2 = 'font-family:' + f.akzF + ';font-style:' + f.akzSt + ';font-weight:' + (f.akzW || f.w);
      return '<button type="button" class="st-kachel st-schrift" data-k="' + f.k + '" aria-pressed="false"><span class="probe" style="' + st1 + '">Sauber <em style="' + st2 + '">gemacht.</em></span><span>' + f.n + '<small>' + f.d + '</small></span></button>'; }).join('');
    $('#st-text', root).innerHTML = TEXT.map(function (t) { return '<button type="button" class="st-zeile" data-art="radio" data-k="' + t[0] + '" aria-pressed="false"><span class="box"></span><span><b>' + t[1] + '</b><small>' + t[2] + '</small></span></button>'; }).join('');
    $('#st-drei', root).innerHTML = DREI.map(function (t) { return '<button type="button" class="st-zeile" data-k="' + t[0] + '" aria-pressed="false"><span class="box"></span><span><b>' + t[1] + '</b><small>' + t[2] + '</small></span></button>'; }).join('');

    $('#st-bau', root).innerHTML = BAU.map(function (t) { return '<button type="button" class="st-zeile" data-k="' + t[0] + '" aria-pressed="false"><span class="box"></span><span><b>' + t[1] + '</b><small>' + t[2] + '</small></span></button>'; }).join('');

    /* Bedienung */
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button,a'); if (!b || !root.contains(b)) return;
      var tun = b.getAttribute('data-tun');
      if (b.dataset.geraet || b.dataset.k || b.getAttribute('data-tun') === 'abspielen') { b.classList.remove('st-tick'); void b.offsetWidth; b.classList.add('st-tick'); } /* 20N-FIX4: jede Wahl bestätigt sich sichtbar – auch die schon aktive */
      if (tun) { e.preventDefault(); if (tun === 'zu') zu(); else if (tun === 'zufall') zufall(); else if (tun === 'abspielen') spiel(); else if (tun === 'uebernehmen') uebernehmen(); else if (tun === 'reset') { S = JSON.parse(JSON.stringify(START)); alles(true); } return; }
      if (b.getAttribute('role') === 'tab') { tab(b.id.replace('st-tab-', '')); return; }
      if (b.dataset.geraet) { geraet(b.dataset.geraet); return; }
      var feld = b.parentNode && b.parentNode.id, k = b.dataset.k; if (!k) return;
      var af = b.parentNode && b.parentNode.dataset && b.parentNode.dataset.feld;
      if (af) { S[af] = k; spiel(); }
      else if (b.closest('#st-hg')) { if (S.hg !== k || (!hgC && k !== 'keiner')) { S.hg = k; S.hgHand = true; hgNeu(); } } /* dieselbe Welt nicht neu bauen */
      else if (feld === 'st-stil') { S.stil = k; spiel(); }
      else if (feld === 'st-farben') { S.farbe = k; hgNeu(); }
      else if (feld === 'st-grund') { S.grund = k; hgNeu(); }
      else if (feld === 'st-schrift') { S.schrift = k; spiel(); }
      else if (feld === 'st-text') { S.text = k; spiel(); }
      else if (feld === 'st-bau') { var j = S.bau.indexOf(k); if (j < 0) S.bau.push(k); else S.bau.splice(j, 1); baustein(); }
      else if (feld === 'st-drei') { var i = S.d3.indexOf(k); if (i < 0) S.d3.push(k); else S.d3.splice(i, 1); if (k === 'schweben') spiel(); }
      else return;
      zeig(); merk();
    });
    $('#st-gewerk', root).addEventListener('change', function () { S.gewerk = this.value; if (!S.hgHand && HG_STD[S.gewerk]) { S.hg = HG_STD[S.gewerk]; hgNeu(); } inhalt(); spiel(); zeig(); merk(); });
    $('#st-firma', root).addEventListener('input', function () { S.firma = this.value; inhalt(); zeig(); merk(); });
    $('#st-eigen', root).addEventListener('input', function () { S.farbe = this.value.toUpperCase(); zeig(); hgNeu(); merk(); });
    $('.st-tabs', root).addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; var t = $$('[role=tab]', root), i = t.indexOf(document.activeElement); if (i < 0) return;
      var n = t[(i + (e.key === 'ArrowRight' ? 1 : t.length - 1)) % t.length]; n.focus(); tab(n.id.replace('st-tab-', ''));
    });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
    raum();
  }

  function tab(id) {
    $$('[role=tab]', root).forEach(function (t) { t.setAttribute('aria-selected', t.id === 'st-tab-' + id); });
    $$('.st-panel', root).forEach(function (p) { p.hidden = p.id !== 'st-p-' + id; });
  }
  function geraet(g) {
    frame.setAttribute('data-geraet', g); $$('[data-geraet]', $('.st-geraete', root)).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.geraet === g); });
    setTimeout(hgNeu, 650);
  }

  /* ---------- Vorschau füllen ---------- */
  function inhalt() {
    var g = GEWERKE[S.gewerk] || GEWERKE.elektro, firma = S.firma.trim() || 'Ihr Betrieb';
    $('#sv-firma', root).textContent = firma;
    $('#st-url', root).textContent = (S.firma.trim() ? S.firma.trim().toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'ihr-betrieb') + '.de';
    $('#sv-eye', root).textContent = g.name + ' · ' + g.ort;
    $('#sv-lead', root).textContent = g.lead;
    $('#sv-karten', root).innerHTML = g.k.map(function (k, i) { return '<div class="sv-karte"><span class="rahmen"></span><span class="glanz"></span><span class="glanz2"></span><div class="vs"><b>0' + (i + 1) + '</b><h3>' + esc(k[0]) + '</h3><p>' + esc(k[1]) + '</p></div><div class="rs"><b>' + esc(k[0]) + '</b><p>Kostenlose Beratung vor Ort · Festpreis-Angebot in 48 Stunden</p><span>Anfragen →</span></div></div>'; }).join('');
    var h = $('#sv-h1', root), n = 0;
    h.innerHTML = g.h.map(function (z, zi) {
      return '<span class="z z' + (zi + 1) + '"><span class="zi" style="--z:' + zi + '">' + z.split(' ').map(function (w) { return '<span class="w" style="--i:' + (n++) + '" data-w="' + esc(w) + '">' + esc(w) + '</span>'; }).join(' ') + '</span></span>';
    }).join('');
  }
  function zeig() {
    var f = finde(SCHRIFTEN, S.schrift), gr = finde(GRUND, S.grund);
    sv.className = 'sv s-' + S.stil + ' h-' + S.hero + ' n-' + S.nav + ' c-' + S.karten + ' r-' + S.ecken + ' b-' + S.knopf + ' k-' + S.kopf + ' bi-' + S.bild + ' cu-' + S.cursor + ' sc-' + S.scroll + S.d3.map(function (d) { return ' e-' + d; }).join('') + (sv.classList.contains('zeig-karten') ? ' zeig-karten' : '');
    var st = sv.style; st.setProperty('--a', S.farbe); st.setProperty('--g', gr[3]);
    st.setProperty('--fd', f.fd); st.setProperty('--fd-st', f.st || 'normal'); st.setProperty('--fd-w', f.w); st.setProperty('--fd-str', f.str || '100%'); st.setProperty('--fd-tt', f.tt || 'none');
    st.setProperty('--fd-ls', f.ls); st.setProperty('--fd-lh', f.lh); st.setProperty('--akz-f', f.akzF); st.setProperty('--akz-st', f.akzSt); st.setProperty('--fb', f.fb); st.setProperty('--fm', f.fm);
    var z2 = $('.sv-h1 .z2', root); if (z2) z2.style.fontWeight = f.akzW || '';
    var setz = function (id, k) { $$('#' + id + ' [data-k]', root).forEach(function (b) { b.setAttribute('aria-pressed', k.indexOf ? (Array.isArray(k) ? k.indexOf(b.dataset.k) >= 0 : b.dataset.k === k) : false); }); };
    $$('#st-hg [data-k]', root).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === S.hg); }); AUFBAU.forEach(function (g) { $$('[data-feld=' + g[0] + '] [data-k]', root).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === S[g[0]]); }); }); setz('st-stil', S.stil); setz('st-farben', S.farbe); setz('st-grund', S.grund); setz('st-schrift', S.schrift); setz('st-text', S.text); setz('st-drei', S.d3); setz('st-bau', S.bau);
    $('#st-eigen', root).value = S.farbe.length === 7 ? S.farbe.toLowerCase() : '#e8b931';
    $('#st-gewerk', root).value = S.gewerk; if ($('#st-firma', root).value !== S.firma) $('#st-firma', root).value = S.firma;
    var farbName = (FARBEN.filter(function (x) { return x[1] === S.farbe; })[0] || ['Eigene Farbe'])[0];
    $('#st-wahl', root).innerHTML = [finde(HG, S.hg)[1], finde(STILE, S.stil)[1], farbName + ' auf ' + gr[1], f.n, finde(TEXT, S.text)[1]].concat(aufbauText()).concat(S.d3.map(function (d) { return finde(DREI, d)[1]; })).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
  }

  /* ---------- Live-Hintergrund ---------- */
  /* 20N-FIX4: Hintergrund-Wechsel ohne Neustart-Kette. Vorher löste stop() → loseContext() auf der ALTEN Fläche
     „webglcontextlost“ aus, der Handler startete dann hgNeu() neu → jede Auswahl baute den Hintergrund bis zu 6× hintereinander neu
     (Flackern, Shader-Kompilierung im Halbsekundentakt). Jetzt: nur die aktuelle Fläche darf neu starten; neue Welt liegt
     unsichtbar über der alten und wird erst nach ihrem ersten Bild weich eingeblendet, dann wird die alte vollständig abgebaut. */
  var hgT = 0, verlust = [], hgC = null, hgNeuH = null, hgNeuC = null, hgAltH = null, hgAltC = null, hgAltT = 0, hgKlick = 0;
  function hgWeg(h, c) { if (c) c.__weg = true; try { if (h && h.stop) h.stop(); } catch (e) { } if (c && c.parentNode) c.parentNode.removeChild(c); }
  function hgAltWeg() { clearTimeout(hgAltT); hgWeg(hgAltH, hgAltC); hgAltH = hgAltC = null; }
  function hgAlleWeg() { clearTimeout(hgT); hgAltWeg(); hgWeg(hgNeuH, hgNeuC); hgNeuH = hgNeuC = null; hgWeg(hgH, hgC); hgH = hgC = null; if (cvBox) cvBox.innerHTML = ''; }
  function hgFest(c) { if (c) { c.classList.remove('sv-hg-neu'); c.style.transition = 'none'; c.style.opacity = '1'; } } /* 20N-FIX6: Fläche sofort voll sichtbar (kein Halbtransparent, wenn die Fläche darunter abgebaut wird) */
  function hgAbloesen(h, c) { /* aktuelle Welt wird „alt“, blendet aus und wird danach abgebaut */
    hgAltWeg(); hgAltH = hgH; hgAltC = hgC; hgH = h; hgC = c;
    if (hgAltC) { hgAltC.style.transition = ''; hgAltC.style.opacity = ''; if (!c) hgAltC.classList.add('sv-hg-weg'); hgAltT = setTimeout(hgAltWeg, 480); } /* neue Welt liegt oben und blendet ein; alte bleibt darunter stehen, bis sie verdeckt ist */
  }
  function hgNeu() {
    var jetzt = performance.now(), schnell = jetzt - hgKlick < 320; hgKlick = jetzt;
    clearTimeout(hgT); hgT = setTimeout(function () {
      if (!root || !root.classList.contains('offen')) return;
      ladeHG.then(function () {
        if (!root.classList.contains('offen')) return;
        hgWeg(hgNeuH, hgNeuC); hgNeuH = hgNeuC = null;           // noch nicht sichtbarer Wechsel wird verworfen
        /* 20N-FIX6: höchstens 2 WebGL-Flächen (aktuelle + neue): eine noch ausblendende alte Fläche wird VOR dem Bau der neuen freigegeben */
        if (hgAltH || hgAltC) { if (hgC) hgFest(hgC); hgAltWeg(); }
        if (S.hg === 'keiner' || !window.HG_START) { hgAbloesen(null, null); return; }
        var c = document.createElement('canvas'); c.className = 'sv-hg sv-hg-neu'; c.setAttribute('aria-hidden', 'true'); cvBox.appendChild(c);
        /* Echter Kontextverlust (Grafiktreiber) nur bei der Fläche, die gerade gezeigt wird → einmal neu starten */
        c.addEventListener('webglcontextlost', function (e) { e.preventDefault(); if (c.__weg || c !== hgC) return; var t = performance.now(); verlust = verlust.filter(function (x) { return t - x < 15000; }); verlust.push(t); if (verlust.length <= 3) setTimeout(hgNeu, 350); }, false);
        var gr = finde(GRUND, S.grund)[2], h = window.HG_START(c, S.hg, gr, hexRgb(S.farbe));
        if (!h) { hgWeg(null, c); return; }
        hgNeuH = h; hgNeuC = c;
        requestAnimationFrame(function () { setTimeout(function () { /* erstes Bild der neuen Welt ist gezeichnet */
          if (hgNeuC !== c) return; hgNeuH = hgNeuC = null; c.classList.remove('sv-hg-neu'); hgAbloesen(h, c);
        }, 60); });
      });
    }, schnell ? 260 : 90); /* schnelles Durchklicken: nur die letzte Wahl wird gebaut */
  }

  /* ---------- Text-Effekte ---------- */
  var scrT = [];
  function spiel() {
    if (!root) return; zeig();
    var h = $('#sv-h1', root); scrT.forEach(clearInterval); scrT = [];
    $$('.w', h).forEach(function (w) { w.textContent = w.dataset.w; });
    h.className = 'sv-h1'; sv.classList.remove('zeig-karten'); void h.offsetWidth;
    if (!reduce) {
      if (S.text === 'fallen') { var bi = 0; $$('.w', h).forEach(function (w) { w.innerHTML = w.dataset.w.split('').map(function (c) { return '<span class="bu" style="--b:' + (bi++) + '">' + esc(c) + '</span>'; }).join(''); }); }
      if (S.text !== 'keiner' && S.text !== 'scramble' && S.text !== 'tippen') h.classList.add('t-' + S.text);
      if (S.text === 'scramble') scramble(h);
      if (S.text === 'tippen') tippen(h);
      sv.classList.add('zeig-karten');
    }
  }
  function tippen(h) {
    var w = $$('.w', h), ziele = w.map(function (x) { return x.dataset.w; }); w.forEach(function (x) { x.textContent = ''; });
    h.classList.add('t-tippen'); var i = 0, j = 0;
    var id = setInterval(function () {
      if (i >= w.length) { clearInterval(id); setTimeout(function () { h.classList.remove('t-tippen'); }, 1400); return; }
      w.forEach(function (x) { x.classList.remove('cur'); }); w[i].classList.add('cur');
      j++; w[i].textContent = ziele[i].slice(0, j); if (j >= ziele[i].length) { i++; j = 0; }
    }, 55); scrT.push(id);
  }
  function scramble(h) {
    var GR = 'ABCDEFGHKLMNPRSTUVWXZ', KL = 'abcdefghkmnprstuvwxz';
    function zf(c) { if (/[A-ZÄÖÜ]/.test(c)) return GR[Math.random() * GR.length | 0]; if (/[a-zäöüß]/.test(c)) return KL[Math.random() * KL.length | 0]; return c; }
    $$('.w', h).forEach(function (w, i) {
      var ziel = w.dataset.w, t0 = performance.now() + i * 90, dauer = 650, fertig = false;
      w.style.position = 'relative'; w.textContent = '';
      var basis = document.createElement('span'), ov = document.createElement('span');
      basis.textContent = ziel; basis.style.visibility = 'hidden';
      ov.style.cssText = 'position:absolute;left:0;top:0;white-space:pre;pointer-events:none'; ov.setAttribute('aria-hidden', 'true');
      w.appendChild(basis); w.appendChild(ov);
      var id = setInterval(function () {
        if (fertig) return;
        var p = (performance.now() - t0) / dauer;
        if (p < 0) { ov.textContent = ''; return; }
        if (p >= 1) { fertig = true; clearInterval(id); w.textContent = ziel; return; }
        var n = Math.floor(ziel.length * p);
        ov.textContent = ziel.slice(0, n) + ziel.slice(n).replace(/[^\s]/g, zf);
      }, 45); scrT.push(id);
    });
  }

  /* ---------- 3D-Effekte (Maus über der Vorschau) ---------- */
  function raum() {
    var ziel = { x: 0, y: 0 }, ist = { x: 0, y: 0 }, laeuft = false, ebenen = $$('[data-t]', sv), knoepfe = $$('[data-magnet]', sv), innen = $('.sv-innen', sv), h1 = $('#sv-h1', sv);
    var fc = document.createElement('canvas'); fc.className = 'sv-funken'; fc.setAttribute('aria-hidden', 'true'); sv.appendChild(fc); var fx = fc.getContext('2d'), teile = [], fLauf = false, fa = '', faT = 0;
    function funkenTick() { var W = sv.clientWidth, H = sv.clientHeight; if (fc.width !== W || fc.height !== H) { fc.width = W; fc.height = H; } fx.clearRect(0, 0, W, H); var nw = performance.now(); if (!fa || nw - faT > 500) { fa = getComputedStyle(sv).getPropertyValue('--a').trim() || '#E8B931'; faT = nw; } var a = fa; fx.globalCompositeOperation = 'lighter'; teile = teile.filter(function (p) { p.x += p.vx; p.y += p.vy; p.vy += .03; p.l -= .02; if (p.l <= 0) return false; fx.globalAlpha = p.l; fx.fillStyle = a; fx.beginPath(); fx.arc(p.x, p.y, p.r * p.l + .3, 0, 6.283); fx.fill(); return true; }); if (teile.length) requestAnimationFrame(funkenTick); else { fLauf = false; fx.clearRect(0, 0, W, H); } }
    function an(d) { return S.d3.indexOf(d) >= 0; }
    function tick() {
      ist.x += (ziel.x - ist.x) * .08; ist.y += (ziel.y - ist.y) * .08;
      var tiefe = an('tiefe');
      ebenen.forEach(function (e) { var t = tiefe ? +e.dataset.t : 0; e.style.transform = t ? 'translate3d(' + (-ist.x * t).toFixed(2) + 'px,' + (-ist.y * t * .6).toFixed(2) + 'px,0)' : ''; });
      innen.style.transform = an('seite') ? 'perspective(1600px) rotateY(' + (ist.x * 6).toFixed(2) + 'deg) rotateX(' + (-ist.y * 5).toFixed(2) + 'deg)' : '';
      h1.style.transform = an('schrift3d') ? 'perspective(900px) rotateY(' + (ist.x * 14).toFixed(2) + 'deg) rotateX(' + (-ist.y * 10).toFixed(2) + 'deg)' : '';
      if (Math.abs(ziel.x - ist.x) + Math.abs(ziel.y - ist.y) > .002) requestAnimationFrame(tick); else laeuft = false;
    }
    var spot = $('.sv-spot', sv), pm = null, pmLauf = false, cache = null, ring = null;
    function mess() {
      cache = { t: performance.now(), r: sv.getBoundingClientRect(), k: $$('.sv-karte', sv).map(function (k) { return [k, k.getBoundingClientRect()]; }), b: knoepfe.map(function (b) { return [b, b.getBoundingClientRect()]; }) };
    }
    sv.addEventListener('scroll', function () { cache = null; }, { passive: true }); addEventListener('resize', function () { cache = null; }); sv.addEventListener('pointerenter', function () { cache = null; });
    /* Mausbewegungen werden pro Bild EINMAL verarbeitet (kein Layout-Zwang, keine Style-Neuberechnung der ganzen Vorschau) */
    function pmFrame() {
      pmLauf = false; var e = pm; if (!e) return;
      if (!cache || performance.now() - cache.t > 700) mess();
      var r = cache.r, x = e.clientX - r.left, y = e.clientY - r.top;
      if (spot) { spot.style.setProperty('--mx', x + 'px'); spot.style.setProperty('--my', (y + sv.scrollTop) + 'px'); }
      ziel.x = x / r.width - .5; ziel.y = y / r.height - .5; if (!laeuft && !reduce) { laeuft = true; requestAnimationFrame(tick); }
      if (an('funken') && !reduce) { for (var n = 0; n < 3; n++) teile.push({ x: x, y: y, vx: (Math.random() - .5) * 1.6, vy: (Math.random() - .8) * 1.4, r: 1 + Math.random() * 1.8, l: 1 }); if (teile.length > 220) teile.splice(0, teile.length - 220); if (!fLauf) { fLauf = true; requestAnimationFrame(funkenTick); } }
      if (an('neigung') && !an('flip') && !reduce) cache.k.forEach(function (a) {
        var k = a[0], q = a[1], kx = (e.clientX - q.left) / q.width, ky = (e.clientY - q.top) / q.height, drin = kx >= -.1 && kx <= 1.1 && ky >= -.1 && ky <= 1.1;
        k.style.transform = drin ? 'perspective(900px) rotateY(' + ((kx - .5) * 16).toFixed(2) + 'deg) rotateX(' + ((.5 - ky) * 14).toFixed(2) + 'deg) translateZ(14px)' : '';
        k.style.setProperty('--gx', (kx * 100) + '%'); k.style.setProperty('--gy', (ky * 100) + '%');
      });
      cache.b.forEach(function (a) {
        var b = a[0], q = a[1];
        if (!an('magnet') || reduce) { if (b.style.transform) b.style.transform = ''; return; }
        var dx = e.clientX - (q.left + q.width / 2), dy = e.clientY - (q.top + q.height / 2), d = Math.hypot(dx, dy);
        b.style.transform = d < 110 ? 'translate(' + (dx * .28).toFixed(1) + 'px,' + (dy * .34).toFixed(1) + 'px)' : '';
      });
      if (S.cursor === 'ring' && ring) { ring.style.transform = 'translate(' + x + 'px,' + (y + sv.scrollTop) + 'px)'; ring.classList.toggle('gross', !!(e.target && e.target.closest && e.target.closest('.sv-k,.sv-karte,button,input'))); }
    }
    sv.addEventListener('pointermove', function (e) { pm = e; if (!pmLauf) { pmLauf = true; requestAnimationFrame(pmFrame); } }, { passive: true });
    ring = $('.sv-ring', sv);
    sv.addEventListener('input', function (e) {
      var t = e.target; if (t.type !== 'range') return; var bb = t.closest('.bb');
      if (bb.classList.contains('bb-rechner')) { $('output', bb).textContent = t.value; $('.bb-erg strong', bb).textContent = 'ca. ' + (+t.value * 62).toLocaleString('de-DE') + ' €'.replace('ca. ', ''); $('.bb-erg strong', bb).textContent = (+t.value * 62).toLocaleString('de-DE') + ' €'; }
      else if (bb.classList.contains('bb-vn')) $('.vn', bb).style.setProperty('--p', t.value + '%');
    });
    sv.addEventListener('pointerleave', function () {
      ziel.x = 0; ziel.y = 0; if (!laeuft) { laeuft = true; requestAnimationFrame(tick); }
      $$('.sv-karte', sv).forEach(function (k) { k.style.transform = ''; }); knoepfe.forEach(function (b) { b.style.transform = ''; });
    });
  }

  function aufbauText() { return AUFBAU.map(function (g) { var o = g[2].filter(function (x) { return x[0] === S[g[0]]; })[0]; return o && o[0] !== 'stil' && !(g[3] && o[0] === START[g[0]]) ? g[1] + ': ' + o[1] : null; }).filter(Boolean); }
  var ladeT = 0;
  /* ---------- Bausteine in der Vorschau ---------- */
  function baustein() {
    var h = '';
    S.bau.forEach(function (k) {
      if (k === 'rechner') h += '<div class="bb bb-rechner"><b>Rechner</b><label>Fläche: <output>40</output> m²<input type="range" min="10" max="150" value="40" aria-label="Fläche in Quadratmetern"></label><div class="bb-erg">ca. <strong>2.480 €</strong><small>Beispielrechnung, unverbindlich</small></div></div>';
      else if (k === 'vorher') h += '<div class="bb bb-vn"><b>Vorher / Nachher</b><div class="vn" style="--p:50%"><div class="vn-v">Vorher</div><div class="vn-n">Nachher</div><i></i><input type="range" min="0" max="100" value="50" aria-label="Vorher-Nachher-Regler"></div></div>';
      else if (k === 'telefon') h += '<div class="bb bb-tel"><b>KI-Telefon</b><div class="tel"><span class="ruf"></span><div><strong>Anruf wird angenommen …</strong><small>„Guten Tag, ich buche Ihnen gern einen Termin.“</small></div><span class="wellen"><i></i><i></i><i></i><i></i><i></i></span></div><small class="bb-ki">KI-Assistent – wird im Gespräch als KI genannt</small></div>';
      else if (k === 'assistent') h += '<div class="bb bb-chat"><b>Fragen-Assistent</b><div class="chat"><p class="u">Kommen Sie auch am Samstag?</p><p class="a">Ja, nach Absprache. Soll ich Ihnen einen Termin vorschlagen?<span class="punkte"><i></i><i></i><i></i></span></p></div><small class="bb-ki">KI-Assistent</small></div>';
      else if (k === 'nfc') h += '<div class="bb bb-nfc"><b>NFC-Bewertungskarte</b><div class="karte"><span class="nfc">)))</span><div><strong>Handy antippen</strong><small>Direkt zur Google-Bewertung</small><span class="sterne">★★★★★</span></div></div></div>';
      else if (k === 'bewertungen') h += '<div class="bb bb-bew"><b>Google-Bewertungen</b><div class="bew"><strong>4,9</strong><span class="sterne">★★★★★</span><small>aus 82 Bewertungen · Beispiel · <u>Bewertungen lesen</u></small></div></div>';
      else if (k === 'jobs') h += '<div class="bb bb-job"><b>Stellenanzeigen</b><ul class="job"><li><span>Monteur (m/w/d)</span><small>Vollzeit · ab sofort</small></li><li><span>Auszubildende (m/w/d)</span><small>Start September</small></li></ul></div>';
    });
    var el = $('#sv-bau', root); el.innerHTML = h; el.classList.toggle('an', !!h);
    if (h) setTimeout(function () { el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }, 60);
  }

  /* ---------- Zufall / Übernehmen ---------- */
  function zz(a) { return a[Math.random() * a.length | 0]; }
  function zufall() {
    S.hgHand = true; S.hg = zz(HG.filter(function (e) { return e[3] !== 'archiv'; }).slice(0, -1))[0]; AUFBAU.forEach(function (g) { S[g[0]] = zz(g[2])[0]; }); S.stil = zz(STILE)[0]; S.farbe = zz(FARBEN)[1]; S.grund = zz(GRUND.slice(0, 3))[0]; S.schrift = zz(SCHRIFTEN).k; S.text = zz(TEXT.slice(0, TEXT.length - 1))[0];
    S.d3 = DREI.map(function (d) { return d[0]; }).filter(function () { return Math.random() < .3; }); if (!S.d3.length) S.d3 = ['neigung'];
    alles(); merk();
  }
  function alles(neuSpeichern) { inhalt(); baustein(); spiel(); hgNeu(); if (neuSpeichern) merk(); }
  function uebernehmen() {
    var g = GEWERKE[S.gewerk], f = finde(SCHRIFTEN, S.schrift), gr = finde(GRUND, S.grund), farbName = (FARBEN.filter(function (x) { return x[1] === S.farbe; })[0] || ['eigene Farbe'])[0];
    var text = 'Design-Studio: Hintergrund ' + finde(HG, S.hg)[1] + ' · Stil ' + finde(STILE, S.stil)[1] + ' · Aufbau ' + (aufbauText().join(', ') || 'wie Stil') + ' · Schrift ' + f.n + ' (' + f.d + ') · Farbe ' + farbName + ' ' + S.farbe + ' auf ' + gr[1] +
      ' · Text-Effekt ' + finde(TEXT, S.text)[1] + ' · 3D: ' + (S.d3.map(function (d) { return finde(DREI, d)[1]; }).join(', ') || 'keine') + (S.bau.length ? ' · Bausteine: ' + S.bau.map(function (b) { return finde(BAU, b)[1]; }).join(', ') : '');
    var set = function (id, v, ev) { var e = document.getElementById(id); if (!e) return; e.value = v; e.dispatchEvent(new Event(ev || 'input', { bubbles: true })); };
    var hgSel = document.getElementById('w-hg'); if (hgSel) set('w-hg', hgSel.querySelector('option[value="' + S.hg + '"]') ? S.hg : '', 'change');
    var bb = document.getElementById('w-bausteine'); if (bb && S.bau.length) Array.prototype.forEach.call(bb.children, function (k) { if (BAU.some(function (x) { return x[0] === k.dataset.k; })) k.setAttribute('aria-pressed', S.bau.indexOf(k.dataset.k) >= 0); });
    if (S.firma.trim()) set('w-firma', S.firma.trim()); set('w-gewerk', g.name);
    set('w-farbe', S.farbe.toLowerCase());
    var w = document.getElementById('w-wuensche');
    if (w) { w.value = (w.value.replace(/^Design-Studio:.*$/m, '').trim() + '\n\n' + text).trim(); w.dispatchEvent(new Event('input', { bubbles: true })); }
    zu();
    var ziel = document.getElementById('wunsch'); if (ziel) setTimeout(function () { ziel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); var h = document.getElementById('w-hinweis'); if (h) h.textContent = 'Ihre Auswahl aus dem Design-Studio ist eingetragen. Jetzt nur noch Name und Telefon.'; }, 80);
  }

  /* ---------- Öffnen / Schließen ---------- */
  var vorher = null, aus = [], st0 = 0;
  function auf(ohneVerlauf) {
    bau(); if (root.classList.contains('offen')) return;
    vorher = document.activeElement;
    aus = ['inhalt', 'kopf', 'assi'].map(function (id) { return document.getElementById(id); }).filter(Boolean).concat($$('footer')); aus.forEach(function (e) { e.inert = true; });
    st0 = scrollY; document.documentElement.classList.add('st-an'); root.classList.add('offen');
    /* 20N-FIX6: Seiten-Hintergründe (Folie, Partikel) geben ihren WebGL-Kontext frei, solange das Studio offen ist → im Studio höchstens 2 Kontexte */
    try { window.dispatchEvent(new CustomEvent('haeufele-studio', { detail: { offen: true } })); } catch (e) { }
    if (window.lenis && window.lenis.stop) window.lenis.stop();
    if (!ohneVerlauf && location.hash !== '#studio') try { history.pushState({ st: 1 }, '', '#studio'); } catch (e) { }
    alles(); setTimeout(function () { var z = $('[data-tun=zu]', root); if (z) z.focus(); }, 60);
    /* Schriften erst zeigen, wenn geladen (max. 1,2 s warten) */
    if (document.fonts && !schriftenDa) { sv.style.opacity = '0'; var fertig = function () { schriftenDa = true; sv.style.transition = 'opacity .4s'; sv.style.opacity = ''; spiel(); };
      Promise.race([schriftLink.then(function () { return document.fonts.load('600 40px "St Grotesk"').then(function () { return document.fonts.load('italic 400 40px "St Newsreader"'); }); }), new Promise(function (ok) { setTimeout(ok, 1200); })]).then(fertig, fertig); }
  }
  function zu() {
    if (!root || !root.classList.contains('offen')) return;
    root.classList.remove('offen'); document.documentElement.classList.remove('st-an'); aus.forEach(function (e) { e.inert = false; }); requestAnimationFrame(function () { scrollTo(0, st0); });
    hgAlleWeg(); scrT.forEach(clearInterval);
    try { window.dispatchEvent(new CustomEvent('haeufele-studio', { detail: { offen: false } })); } catch (e) { }   /* Seite baut ihre Hintergründe sauber neu */
    if (window.lenis && window.lenis.start) window.lenis.start();
    if (location.hash === '#studio') try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
    if (vorher && vorher.focus) vorher.focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-studio],a[href="#studio"]'); if (!a || (root && root.contains(a))) return;
    e.preventDefault(); e.stopPropagation(); auf();
  }, true);
  addEventListener('popstate', function () { if (location.hash === '#studio') auf(true); else zu(); });
  if (location.hash === '#studio') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { auf(true); }); else auf(true); }
  window.DesignStudio = { auf: auf, zu: zu };
})();
