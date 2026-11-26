/* Wissensbasis KI-Assistent „Häufele Webdesign“ – nur belegte Fakten (Website-Texte, Impressum, Leistungen, Ablauf).
   Stand 04.11.2026. KEINE Preise nennen (bespricht Niklas persönlich). Dieselben Fakten stehen im Worker-Systemprompt
   (Skripte/worker/wissen.js) – bei Änderungen beide anpassen.
   endpoint leer = lokaler Modus (alles im Browser). Nach Einrichtung des Workers hier die URL eintragen. */
(function () {
  var KONTAKT = { t: 'Rückruf anfordern', h: '#kontakt' };
  var TEL = { t: 'Anrufen: 0179 1069203', h: 'tel:+491791069203' };
  var TPL = { t: 'Templates ansehen', h: '#templates' };
  var TELDEMO = { t: 'KI-Telefon selbst ausprobieren', h: '#ki-telefon' };
  var ABLAUF = { t: 'Ablauf ansehen', h: '#ablauf' };
  var WUNSCH = { t: 'Seite zusammenstellen', h: '#wunsch' };
  var KB = [];
  window.KICHAT = {
    betrieb: 'Häufele Webdesign',
    titel: 'Fragen? Der KI-Assistent antwortet.',
    kennung: 'KI-Assistent · kein Mensch',
    gruss: 'Hallo! Ich bin der digitale Assistent von Häufele Webdesign – eine KI, kein Mensch. Fragen Sie mich zu Websites, KI-Telefon, Apps oder zum Ablauf. Oder ich nehme gleich Ihre Anfrage für Niklas auf.',
    vorschlaege: ['Was kostet eine Website?', 'Wie läuft das ab?', 'Was kann das KI-Telefon?'],
    unbekannt: 'Dazu habe ich keine gesicherte Info, und ich möchte Ihnen nichts Falsches sagen. Niklas beantwortet das gern persönlich. Soll ich eine Anfrage für Sie aufnehmen?',
    formular: '#kontaktform', mail: 'niklas@haeufele-webdesign.de', tel: '0179 1069203', datenschutz: 'datenschutz.html#assistent',
    themen: ['Neue Website', 'Bestehende Website verbessern', 'Fragen-Assistent', 'KI-Telefon mit Terminbuchung', 'App oder Werkzeug', 'NFC-Bewertungskarten', 'Digitale Stempelkarte', 'Paket aus mehreren Leistungen', 'Logo und Marken-Paket', 'Etwas anderes'],
    endpoint: '',
    sprechen: true,   // Mikro-Knopf im Assistenten (Spracheingabe per Antippen, Chat W11-B)
    kb: KB
  };
  KB.push(
      /* ---------- generisch (beziehen sich auf das Gesprächsthema) ---------- */
      { id: 'preis', n: 'die Kosten', generisch: true, w: 1.2, k: ['preis', 'preise', 'kosten', 'kostet', 'kostenpunkt', 'teuer', 'guenstig', 'billig', 'euro', 'budget', 'angebot', 'kostenvoranschlag', 'festpreis', 'monatlich', 'abo', 'gebuehr', 'bezahlen', 'zahlen', 'was kostet', 'wie viel', 'wieviel', 'preislich', 'kostn', 'preiss'],
        a: 'Feste Preise stehen bewusst nicht auf der Seite, weil jeder Betrieb etwas anderes braucht. Das bespricht Niklas persönlich mit Ihnen – kostenlos und unverbindlich. Vorher sehen Sie eine fertige Demo mit Ihrem Namen und drei Pakete zur Auswahl.',
        v: { telefon: 'Beim KI-Telefon gibt es eine einmalige Einrichtung und eine monatliche Gebühr, weil Telefonie und KI laufend kosten. Die genauen Zahlen bespricht Niklas persönlich mit Ihnen – kostenlos und unverbindlich.',
             assistent: 'Der Fragen-Assistent ist in den größeren Paketen dabei, die Live-KI kostet eine kleine monatliche Gebühr. Die genauen Zahlen bespricht Niklas persönlich – kostenlos und unverbindlich.',
             nfc: 'Die NFC-Bewertungskarten gibt es einzeln oder im Set, auf Wunsch mit Aufklebern fürs Auto oder den Werkzeugkoffer. Den genauen Preis nennt Niklas Ihnen gern persönlich – kostenlos und unverbindlich.' },
        chips: ['Anfrage aufnehmen', 'Wie läuft das ab?'], angebot: { lead: 'Neue Website' } },
      { id: 'dauer', n: 'die Dauer', generisch: true, k: ['dauer', 'dauert', 'lange', 'wie lange', 'wann fertig', 'zeit', 'wochen', 'schnell', 'bis wann', 'zeitraum', 'fertig'],
        a: 'Meist steht die Website zwei bis drei Wochen nach unserem Gespräch. Die Demo mit Ihrem Namen sehen Sie schon vorher.',
        v: { telefon: 'Das KI-Telefon ist meist in wenigen Tagen eingerichtet – inklusive Probeanrufen, bei denen Sie selbst testen, wie es klingt.',
             app: 'Das hängt vom Werkzeug ab. Ein Aufmaß-Rechner oder Anfrageformular mit Foto-Upload geht schnell, eine Zeiterfassung fürs Team dauert etwas länger. Niklas nennt Ihnen nach dem Gespräch einen festen Termin.' },
        chips: ['Wie läuft das ab?', 'Anfrage aufnehmen'] },
      /* ---------- Leistungen ---------- */
      { id: 'website', n: 'eine Website', thema: 'website', formThema: 'Neue Website', k: ['website', 'webseite', 'homepage', 'internetseite', 'seite', 'web seite', 'onepager', 'internetauftritt', 'online', 'websit', 'neue seite', 'erstellen', 'bauen'],
        a: 'Niklas baut Websites für Handwerksbetriebe in Ulm und Umgebung – mit echten Bildern Ihrer Arbeit, kurzem Film am Anfang, klaren Leistungen und Kontakt mit einem Fingertipp. Sie läuft auf Handy, Tablet und Rechner. Starten können Sie mit einem fertigen Template für Ihr Gewerk.',
        l: [TPL, WUNSCH], chips: ['Welche Templates gibt es?', 'Was kostet eine Website?', 'Wie lange dauert das?'] },
      { id: 'verbessern', n: 'die bestehende Website', thema: 'website', formThema: 'Bestehende Website verbessern', w: 1.1, k: ['bestehende', 'alte website', 'alte seite', 'ueberarbeiten', 'verbessern', 'modernisieren', 'relaunch', 'umbauen', 'veraltet', 'schon eine website', 'habe schon'],
        a: 'Gern. Sie schicken die Adresse Ihrer jetzigen Seite, Niklas schaut sie sich an und zeigt Ihnen im Gespräch, was besser geht – oder baut direkt eine neue Demo mit Ihren Inhalten.',
        chips: ['Anfrage aufnehmen', 'Wie läuft das ab?'], angebot: { lead: 'Bestehende Website verbessern' } },
      { id: 'templates', n: 'die Templates', thema: 'website', k: ['template', 'templates', 'vorlage', 'vorlagen', 'beispiel', 'beispiele', 'muster', 'demos', 'design', 'aussehen', 'referenz', 'referenzen', 'gewerk', 'gewerke', 'branche'],
        a: 'Es gibt fertige Designs für Fliesen & Bad, Photovoltaik & Wärmepumpe, Elektro, Heizung & Sanitär und Schreinerei – im Ring auf dieser Seite. Die Firmen darin sind erfunden. Sie wählen ein Design, Niklas baut daraus Ihre Seite mit Ihren Fotos und Leistungen.',
        l: [TPL], chips: ['Mein Gewerk fehlt', 'Wie läuft das ab?'] },
      { id: 'gewerk_fehlt', n: 'ein anderes Gewerk', thema: 'website', w: 1.2, k: ['gewerk fehlt', 'mein gewerk', 'anderes gewerk', 'nicht dabei', 'maler', 'dachdecker', 'zimmerer', 'gartenbau', 'galabau', 'metallbau', 'schlosser', 'friseur', 'kfz', 'werkstatt', 'bodenleger', 'stuckateur', 'trockenbau', 'raumausstatter', 'baeckerei', 'restaurant'],
        a: 'Kein Problem – Niklas baut die Seite passend zu Ihrem Gewerk, auch wenn es noch kein Template dafür gibt. Sie sehen die Demo mit Ihrem Namen, bevor Sie sich entscheiden.',
        chips: ['Anfrage aufnehmen', 'Was kostet eine Website?'], angebot: { lead: 'Neue Website' } }
  );
  KB.push(
      { id: 'assistent', n: 'den Fragen-Assistenten', thema: 'assistent', formThema: 'Fragen-Assistent', w: 1.15, k: ['assistent', 'chatbot', 'chat bot', 'chat', 'bot', 'fragen assistent', 'fragenassistent', 'kundenfragen', 'faq', 'automatisch antworten', 'ki chat', 'so einer wie du', 'wie dich'],
        a: 'Genau so einer wie ich: ein kleines Fenster auf Ihrer Website, das rund um die Uhr die Fragen beantwortet, die Sie sonst am Telefon hören – nur mit Ihren Leistungen und Ihrem Einzugsgebiet, auf Wunsch mit Live-KI. Die Anfrage kommt sortiert bei Ihnen an, mit Name, Telefon und Anliegen.',
        chips: ['Was kostet das?', 'Was kann das KI-Telefon?'] },
      { id: 'telefon', n: 'das KI-Telefon', thema: 'telefon', formThema: 'KI-Telefon mit Terminbuchung', w: 1.1, k: ['ki telefon', 'telefon', 'telefonassistent', 'telefon assistent', 'telfon assistent', 'anrufbeantworter', 'anruf', 'anrufe', 'rangehen', 'verpasste anrufe', 'terminbuchung', 'stimme', 'sprachassistent', 'voice', 'rezeption', 'telefonbot', 'telfon'],
        a: 'Wenn Sie nicht rangehen können, nimmt eine freundliche KI-Stimme ab – und sagt gleich im ersten Satz, dass sie eine KI ist. Sie fragt nach Anliegen, Ort und Dringlichkeit, trägt einen Besichtigungs- oder Rückruftermin in Ihren Kalender ein und schickt Ihnen eine Zusammenfassung aufs Handy. Ihre Nummer bleibt gleich: Ihr Telefon leitet nur bei Nichtannahme oder nach Feierabend weiter.',
        l: [TELDEMO], chips: ['Was kostet das?', 'Wird das aufgezeichnet?', 'Anfrage aufnehmen'] },
      { id: 'aufzeichnung', n: 'den Datenschutz am Telefon', thema: 'telefon', w: 1.3, k: ['aufgezeichnet', 'aufzeichnung', 'aufnahme', 'mitschnitt', 'abgehoert', 'datenschutz telefon'],
        a: 'Nein. Gespräche werden nicht aufgezeichnet – ohne Zustimmung wäre das nach § 201 StGB auch strafbar. Sie bekommen nur eine schriftliche Zusammenfassung. Mit dem Anbieter gibt es einen Auftragsverarbeitungsvertrag.',
        chips: ['Was kann das KI-Telefon?', 'Anfrage aufnehmen'] },
      { id: 'app', n: 'Apps & Werkzeuge', thema: 'app', formThema: 'App oder Werkzeug', k: ['app', 'apps', 'werkzeug', 'werkzeuge', 'programm', 'software', 'zeiterfassung', 'stundenzettel', 'aufmass', 'rechner', 'foto upload', 'fotos hochladen', 'online termin', 'digitalisieren', 'zettelwirtschaft'],
        a: 'Kleine Programme für Ihren Alltag: Zeiterfassung fürs Team, Aufmaß-Rechner, Anfrageformular mit Foto-Upload oder Online-Terminbuchung. Ihre Kunden schicken gleich die Fotos mit, die Sie fürs Angebot brauchen – weniger Rückfragen, weniger Zettel im Büro.',
        l: [{ t: 'Beispiel ansehen', h: '#leistungen' }], chips: ['Wie lange dauert das?', 'Anfrage aufnehmen'] },
      { id: 'nfc', n: 'die NFC-Bewertungskarte', thema: 'nfc', formThema: 'NFC-Bewertungskarten', k: ['nfc', 'aufsteller', 'bewertung', 'bewertungen', 'google bewertung', 'sterne', 'rezension', 'rezensionen', 'nfc karte', 'handy dranhalten'],
        a: 'Eine NFC-Karte im Look Ihres Betriebs – für Theke, Firmenwagen oder die Übergabe: Kunde hält das Handy dran, und Ihre Google-Bewertungsseite geht auf – ohne App. Bewerten tut der Kunde natürlich selbst, ehrlich und ohne Gegenleistung. So kommen mehr Bewertungen zusammen, ohne dass Sie lange bitten müssen.',
        chips: ['Was kostet das?', 'Anfrage aufnehmen'] },
      { id: 'stempel', n: 'die digitale Stempelkarte', thema: 'app', formThema: 'Digitale Stempelkarte', k: ['stempel', 'stempelkarte', 'stempelkarten', 'treuekarte', 'bonuskarte', 'stammkunden', 'gratis schnitt', 'wallet', 'kundenkarte', 'bonusheft'],
        a: 'Eine Stempelkarte fürs Handy: Ihr Kunde legt sie als Web-App auf den Startbildschirm, Apple- oder Google-Wallet gibt es auf Anfrage. Die ersten zwei Stempel schenken Sie – wer schon angefangen hat, macht lieber weiter. Die Belohnung legen Sie selbst fest. Stempel gibt es für Besuche, nie für Bewertungen.',
        l: [{ t: 'Stempelkarte ansehen', h: '#stempelkarte' }], chips: ['Was kostet das?', 'Anfrage aufnehmen'] },
      { id: 'branding', n: 'Logo & Marke', thema: 'branding', formThema: 'Logo und Marken-Paket', k: ['logo', 'marke', 'branding', 'visitenkarte', 'visitenkarten', 'firmenauto', 'beschriftung', 'arbeitsjacke', 'bauschild', 'corporate design', 'farben'],
        a: 'Ein Logo ist ein Zeichen – eine Marke entsteht, wenn es überall gleich auftaucht: Website, Visitenkarte, Firmenauto, Arbeitsjacke, Bauschild. Niklas gestaltet das passend zu Ihrer Website, damit alles aus einem Guss wirkt.',
        chips: ['Was kostet das?', 'Anfrage aufnehmen'] }
  );
  KB.push(
      { id: 'ablauf', n: 'den Ablauf', k: ['ablauf', 'wie laeuft', 'laeuft das ab', 'vorgehen', 'schritte', 'prozess', 'wie geht', 'was muss ich tun', 'anfangen', 'starten', 'loslegen', 'naechste schritt'],
        a: 'So geht’s:\n1. Sie wählen ein Template.\n2. Sie kreuzen an, was rein soll, und schicken Logo und Fotos per Mail – dauert zehn Minuten.\n3. Niklas kommt vorbei und zeigt Ihnen Ihre Seite schon fertig, mit Ihrem Namen und Ihren Bildern.\n4. Nach Ihrer Freigabe geht sie online. Änderungen später schicken Sie einfach per WhatsApp.',
        l: [ABLAUF, WUNSCH], chips: ['Muss ich viel selbst machen?', 'Wie lange dauert das?', 'Anfrage aufnehmen'] },
      { id: 'aufwand', n: 'Ihren Aufwand', k: ['selbst machen', 'viel arbeit', 'aufwand', 'keine zeit', 'texte schreiben', 'texte', 'technik', 'muss ich viel', 'kuemmern'],
        a: 'Kaum etwas. Sie wählen ein Template, kreuzen an, was rein soll, und schicken ein paar Fotos. Texte, Technik und Rechtliches übernimmt Niklas.',
        chips: ['Wie lange dauert das?', 'Anfrage aufnehmen'] },
      { id: 'aenderung', n: 'spätere Änderungen', k: ['aenderung', 'aenderungen', 'aendern', 'pflege', 'wartung', 'aktualisieren', 'hosting', 'domain', 'server', 'betreuung', 'support', 'updates'],
        a: 'Änderungen schicken Sie Niklas später einfach per WhatsApp – neue Fotos, Öffnungszeiten, Leistungen. Um Domain, Hosting und Pflege kümmert er sich auf Wunsch mit. Die Details klärt er im Gespräch.',
        chips: ['Was kostet eine Website?', 'Anfrage aufnehmen'] },
      { id: 'google', n: 'Google & Sichtbarkeit', k: ['google', 'seo', 'gefunden', 'finden', 'ranking', 'platz eins', 'suchmaschine', 'sichtbar', 'maps', 'unternehmensprofil'],
        a: 'Die Seite wird technisch sauber gebaut – schnell, fürs Handy, mit richtigen Seitentiteln –, damit Google sie gut lesen kann. Platz 1 kann Ihnen ehrlicherweise niemand versprechen. Mehr echte Bewertungen helfen zusätzlich, z. B. mit der NFC-Bewertungskarte.',
        chips: ['Was ist die NFC-Karte?', 'Anfrage aufnehmen'] },
      { id: 'recht', n: 'das Rechtliche', w: 1.05, k: ['impressum', 'datenschutzerklaerung', 'dsgvo', 'rechtssicher', 'abmahnung', 'cookie', 'cookies', 'bildrechte', 'urheberrecht', 'rechtlich'],
        a: 'Impressum und Datenschutzerklärung baut Niklas technisch sauber ein; die Texte selbst erstellen Sie mit einem Rechtstexte-Generator oder Ihrem Anwalt. Bei Bildern nutzt er nur eigene, lizenzierte oder gekennzeichnete KI-Bilder. Rechtsberatung gibt es hier nicht.',
        chips: ['Wie läuft das ab?', 'Anfrage aufnehmen'] },
      { id: 'region', n: 'das Einzugsgebiet', zusatz: true, w: 1.1, k: ['kommen sie', 'kommst du', 'vorbeikommen', 'vor ort', 'region', 'einzugsgebiet', 'umgebung', 'ulm', 'neu ulm', 'neuulm', 'senden', 'illertissen', 'weissenhorn', 'voehringen', 'illerkirchberg', 'blaubeuren', 'ehingen', 'laupheim', 'erbach', 'dornstadt', 'langenau', 'elchingen', 'nersingen', 'pfaffenhofen', 'bellenberg', 'wo sitzen', 'woher', 'standort', 'entfernung'],
        a: 'Persönlich vor Ort ist Niklas in Ulm, Neu-Ulm, Senden, Illertissen und Umgebung – kein Callcenter. Sitz ist Illerkirchberg bei Ulm. Für weiter entfernte Orte fragen Sie gern kurz nach, er sagt Ihnen ehrlich, ob es passt.',
        chips: ['Anfrage aufnehmen', 'Wie läuft das ab?'] },
      { id: 'ueber', n: 'Niklas', k: ['niklas', 'wer steckt', 'ueber sie', 'inhaber', 'erfahrung', 'wer macht', 'firma', 'haeufele', 'wer baut', 'ansprechpartner'],
        a: 'Hinter Häufele Webdesign steht Niklas Häufele aus Illerkirchberg bei Ulm. Er kommt aus einer Familie mit Hof, ist selbst in technischer Ausbildung als Industriemechaniker und weiß, wie wenig Zeit nach Feierabend fürs Büro bleibt. Er baut jede Seite selbst und kommt persönlich vorbei.',
        l: [{ t: 'Mehr über Niklas', h: '#ueber' }], chips: ['Wie läuft das ab?', 'Anfrage aufnehmen'] },
      { id: 'erreichbar', n: 'die Erreichbarkeit', w: 1.15, k: ['erreichbar', 'erreichen', 'telefonnummer', 'nummer', 'email', 'e mail', 'mail', 'kontakt', 'whatsapp', 'wann erreiche', 'oeffnungszeiten', 'uhrzeit'],
        a: 'Telefon 0179 1069203 oder E-Mail an niklas@haeufele-webdesign.de. Niklas meldet sich so schnell wie möglich – am liebsten nach 16 Uhr, wenn Sie Feierabend haben.',
        l: [TEL, KONTAKT], chips: ['Anfrage aufnehmen'] }
  );
  KB.push(
      { id: 'anfrage', n: 'eine Anfrage', w: 1.4, lead: '', k: ['anfrage aufnehmen', 'anfrage', 'rueckruf', 'zurueckrufen', 'beratung', 'gespraech', 'interesse', 'interessiert', 'will eine website', 'moechte eine website', 'auftrag', 'termin vereinbaren', 'ja anfrage aufnehmen'], a: '' },
      { id: 'demo', n: 'die Demo', k: ['vorher sehen', 'vorschau', 'unverbindlich', 'risiko', 'kostenlos', 'probe', 'vorher anschauen'],
        a: 'Sie sehen Ihre Seite fertig, bevor Sie etwas unterschreiben – mit Ihrem Namen und Ihren Bildern. Das Gespräch ist kostenlos und unverbindlich.',
        chips: ['Anfrage aufnehmen', 'Wie läuft das ab?'] },
      { id: 'bot', n: 'mich', w: 1.2, k: ['bist du ein mensch', 'mensch', 'echter mensch', 'kuenstliche intelligenz', 'roboter', 'wer antwortet', 'bist du', 'wer bist du', 'chatgpt', 'claude', 'ki'],
        a: 'Ich bin ein automatischer KI-Assistent, kein Mensch. Ich antworte nur mit geprüften Infos über Häufele Webdesign. Wenn Sie lieber mit Niklas persönlich sprechen: 0179 1069203 – oder ich nehme eine Rückruf-Anfrage auf.',
        l: [TEL], chips: ['Anfrage aufnehmen'] },
      { id: 'datenchat', n: 'Datenschutz im Chat', w: 1.3, k: ['speicherst du', 'gespeichert', 'meine daten', 'daten', 'was passiert mit', 'privat', 'tracking', 'datenschutz'],
        a: function () { return window.KICHAT.endpoint ? 'Ihre Fragen gehen zur Beantwortung verschlüsselt an Claude (Anthropic) und werden dort nicht zum Training genutzt; bei Häufele Webdesign wird nichts gespeichert. Name und Telefonnummer aus der Anfrage bleiben in Ihrem Browser, bis Sie sie selbst abschicken.' : 'Im Moment läuft dieser Assistent komplett in Ihrem Browser – Ihre Eingaben werden nicht gespeichert und nicht übertragen. Eine Anfrage geht erst an Niklas, wenn Sie sie selbst über das Formular oder Ihre E-Mail abschicken.'; },
        l: [{ t: 'Datenschutzerklärung', h: 'datenschutz.html#assistent' }] },
      { id: 'beratung', n: 'Rechts- oder Steuerfragen', w: 1.4, k: ['steuer', 'steuern', 'finanzamt', 'umsatzsteuer', 'anwalt', 'rechtsberatung', 'vertrag pruefen', 'gewerbe anmelden', 'buchhaltung', 'versicherung', 'foerderung', 'zuschuss'],
        a: 'Rechts- oder Steuerberatung darf ich nicht geben – dafür sind Anwalt oder Steuerberater zuständig. Bei allem rund um Website, KI-Telefon, Apps und Marke helfe ich gern.' },
      { id: 'fremd', n: 'ein anderes Thema', w: 1.2, k: ['wetter', 'witz', 'rezept', 'fussball', 'politik', 'gedicht', 'hausaufgaben', 'aktie', 'aktien', 'krypto', 'programmier', 'uebersetze', 'ignoriere', 'vergiss alle', 'systemprompt', 'prompt', 'anweisungen'],
        a: 'Dabei kann ich leider nicht helfen – ich kenne mich nur mit Häufele Webdesign aus: Websites, KI-Telefon, Fragen-Assistent, Apps, NFC-Bewertungskarten, digitale Stempelkarten und Logos.', chips: ['Was kostet eine Website?', 'Wie läuft das ab?'] },
      { id: 'hallo', n: 'Hallo', w: 1.05, k: ['hallo', 'hi', 'hey', 'servus', 'moin', 'guten tag', 'gruess gott', 'gruezi', 'guten morgen', 'guten abend'],
        a: 'Hallo! Schön, dass Sie da sind. Was möchten Sie wissen – Website, KI-Telefon oder der Ablauf?', chips: ['Was kostet eine Website?', 'Was kann das KI-Telefon?', 'Wie läuft das ab?'] },
      { id: 'danke', n: 'Danke', w: 1.05, k: ['danke', 'dankeschoen', 'vielen dank', 'super', 'top', 'perfekt', 'tschuess', 'ciao', 'auf wiedersehen', 'bis dann', 'alles klar'],
        a: 'Gern geschehen! Wenn noch etwas ist, schreiben Sie einfach. Und wenn Sie Niklas kennenlernen möchten: Ich nehme Ihre Anfrage in 30 Sekunden auf.', chips: ['Anfrage aufnehmen'] }
  );
  /* Muster-Betrieb für die Vorführung im 3D-Handy (Leistungen-Kapitel 02) – Firma erfunden */
  window.KICHAT_MUSTER = { betrieb: 'Muster Fliesen & Bad', gruss: '', unbekannt: 'Dazu habe ich keine gesicherte Info – der Chef meldet sich bei Ihnen.', kb: [
    { id: 'bad', k: ['bad', 'badsanierung', 'badezimmer', 'sanierung', 'fliesen', 'dusche'], a: 'Ja, Badsanierung komplett aus einer Hand.' },
    { id: 'region', zusatz: true, k: ['weissenhorn', 'senden', 'ulm', 'neu ulm', 'illertissen', 'kommen sie'], a: 'Weißenhorn liegt in unserem Einzugsgebiet.' },
    { id: 'preis', generisch: true, k: ['kostet', 'kosten', 'preis', 'teuer'], a: 'Pauschal leider nicht – nach der kostenlosen Besichtigung bekommen Sie ein schriftliches Angebot. Wann passt es Ihnen?' }
  ] };
  /* Leistungen-Kapitel 02: dieselbe Engine beantwortet die Fragen im 3D-Handy (Antworten werden live erzeugt) */
  window.KICHAT_DEMO = { el: '#chat', cfg: window.KICHAT_MUSTER, fragen: ['Machen Sie auch Badsanierung in Weißenhorn?', 'Was kostet das ungefähr?'],
    karte: '✓ Anfrage sortiert an Muster Fliesen & Bad: Badsanierung · Weißenhorn · Rückruf' };
})();
