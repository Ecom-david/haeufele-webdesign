/* Wunsch-Konfigurator: Template, Hintergrund, Bausteine, Farbe -> Live-Zusammenfassung -> E-Mail (mailto).
   Keine Daten an Server; ?template=<id>&hg=<name> füllt vor (Links „Dieses Template wählen“). */
(function () {
  var f = document.getElementById('wunschform'); if (!f || !window.TEMPLATES) return;
  var $ = function (id) { return document.getElementById(id); };
  var HG = { '': 'wie im Template', polarlicht: 'Polarlicht', lichtfall: 'Lichtfall', tiefe: 'Polierte Tiefe', ringe: 'Lichtringe', dampf: 'Dampf', rauch: 'Rauchfäden', funken: 'Funken', leiterbahn: 'Leiterbahnen', strom: 'Glasstrom', indigo: 'Indigo-Strom', chrom: 'Flüssiges Chrom', seide: 'Seidenfalten', prisma: 'Prisma', material: 'Material (4K)' };
  var B = [
    ['film', '3D-Film / Scroll-Effekt', true], ['rechner', 'Rechner fürs Gewerk', true], ['vorher', 'Vorher / Nachher', false],
    ['referenzen', 'Referenzen & Bilder', true], ['ablauf', 'Ablauf in Schritten', true], ['pakete', 'Pakete mit Beispielpreisen', false],
    ['bewertungen', 'Google-Bewertungen', true], ['assistent', 'Fragen-Assistent', true], ['telefon', 'KI-Telefon mit Terminbuchung', false],
    ['nfc', 'NFC-Bewertungskarten', false], ['stempel', 'Digitale Stempelkarte', false], ['jobs', 'Stellenanzeigen', false], ['marke', 'Logo & Marken-Paket', false]
  ];
  var sel = $('w-template');
  sel.innerHTML = '<option value="">Noch offen – Sie beraten mich</option>' + TEMPLATES.map(function (t) { return '<option value="' + t.id + '">' + t.gewerk + ' – ' + t.name + (t.fertig ? '' : ' (in Arbeit)') + '</option>'; }).join('');
  var box = $('w-bausteine');
  B.forEach(function (b) { var k = document.createElement('button'); k.type = 'button'; k.dataset.k = b[0]; k.textContent = b[1]; k.setAttribute('aria-pressed', b[2]); k.onclick = function () { k.setAttribute('aria-pressed', k.getAttribute('aria-pressed') !== 'true'); zeig(); }; box.appendChild(k); });
  var q = location.search, mt = /[?&]template=([a-z]+)/.exec(q), mh = /[?&]hg=([a-z]+)/.exec(q);
  if (mt && TEMPLATES.some(function (t) { return t.id === mt[1]; })) sel.value = mt[1];
  if (mh && HG[mh[1]]) $('w-hg').value = mh[1];
  function hgName() { var o = $('w-hg'); return o.value ? o.options[o.selectedIndex].text : 'wie im Template'; }
  function tpl() { var id = sel.value; return TEMPLATES.filter(function (t) { return t.id === id; })[0]; }
  function an() { return Array.prototype.filter.call(box.children, function (k) { return k.getAttribute('aria-pressed') === 'true'; }).map(function (k) { return k.textContent; }); }
  var farbeGesetzt = false;
  function zeig() {
    var t = tpl(), hg = $('w-hg').value;
    if (t && !farbeGesetzt) $('w-farbe').value = t.akzent.toLowerCase();
    $('w-farbwert').textContent = $('w-farbe').value.toUpperCase();
    $('z-farbe').style.background = $('w-logo').checked ? 'conic-gradient(#888,#eee,#555,#888)' : $('w-farbe').value;
    $('z-name').textContent = $('w-firma').value.trim() || 'Ihr Betrieb';
    $('z-template').textContent = t ? t.name + ' (' + t.gewerk + ')' : 'noch offen';
    $('z-hg').textContent = hgName();
    var o = [$('w-gewerk').value.trim(), $('w-ort').value.trim()].filter(Boolean).join(' · '); $('z-ort').textContent = o || '–';
    var l = an(); $('z-zahl').textContent = l.length; $('z-liste').innerHTML = l.map(function (x) { return '<li>' + x + '</li>'; }).join('');
  }
  $('w-farbe').addEventListener('input', function () { farbeGesetzt = true; zeig(); });
  sel.addEventListener('change', function () { farbeGesetzt = false; zeig(); });
  ['w-hg', 'w-firma', 'w-gewerk', 'w-ort', 'w-logo'].forEach(function (id) { $(id).addEventListener('input', zeig); $(id).addEventListener('change', zeig); });
  zeig();
  /* Logo & Fotos: nur lokale Vorschau (Object-URL), nichts wird übertragen */
  var DATEIEN = [], inp = $('w-dateien'), box2 = $('w-bilder');
  function bilderZeigen() {
    box2.innerHTML = '';
    DATEIEN.forEach(function (d, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ub' + (d.titel ? ' titel' : '') + (d.logo ? ' logo' : '');
      b.setAttribute('aria-label', d.name + (d.logo ? ' (Logo)' : d.titel ? ' (Titelbild)' : ' – als Titelbild nehmen'));
      b.style.backgroundImage = 'url("' + d.url + '")';
      var x = document.createElement('span'); x.className = 'ub-weg'; x.textContent = '×'; x.setAttribute('aria-hidden', 'true');
      b.appendChild(x);
      b.addEventListener('click', function (ev) {
        if (ev.target === x) { URL.revokeObjectURL(d.url); DATEIEN.splice(i, 1); if (d.titel) { var n = DATEIEN.filter(function (z) { return !z.logo; })[0]; if (n) n.titel = true; } }
        else if (!d.logo) DATEIEN.forEach(function (z) { z.titel = z === d; });
        bilderZeigen();
      });
      box2.appendChild(b);
    });
    window.WUNSCH_BILD = (DATEIEN.filter(function (d) { return d.titel; })[0] || {}).url || '';
    window.WUNSCH_LOGO = (DATEIEN.filter(function (d) { return d.logo; })[0] || {}).url || '';
    f.dispatchEvent(new Event('change'));
  }
  if (inp) inp.addEventListener('change', function () {
    [].slice.call(inp.files || []).slice(0, 12 - DATEIEN.length).forEach(function (fi) {
      if (!/^image\//.test(fi.type)) return;
      var logo = /logo/i.test(fi.name) && !DATEIEN.some(function (z) { return z.logo; });
      DATEIEN.push({ name: fi.name, url: URL.createObjectURL(fi), logo: logo, titel: false });
    });
    if (!DATEIEN.some(function (z) { return z.titel; })) { var n = DATEIEN.filter(function (z) { return !z.logo; })[0]; if (n) n.titel = true; }
    inp.value = ''; bilderZeigen();
  });
  f.addEventListener('submit', function (e) {
    e.preventDefault(); var h = $('w-hinweis');
    if (f.website.value) return;
    var fehlt = [];
    if (!f.name.value.trim()) fehlt.push('Ihren Namen'); if (!f.telefon.value.trim()) fehlt.push('eine Telefonnummer'); if (!f.datenschutz.checked) fehlt.push('das Häkchen zum Datenschutz');
    if (fehlt.length) { h.textContent = 'Bitte noch ergänzen: ' + fehlt.join(', ') + '.'; return; }
    var t = tpl();
    var text = 'Wunsch-Website\n\nName: ' + f.name.value + '\nTelefon: ' + f.telefon.value + '\nFirma: ' + f.firma.value + '\nGewerk: ' + f.gewerk.value + '\nOrt: ' + f.ort.value + '\nBestehende Website: ' + f.alt.value +
      '\n\nTemplate: ' + (t ? t.name + ' (' + t.gewerk + ')' : 'noch offen') + '\nHintergrund: ' + hgName() + '\nAkzentfarbe: ' + ($('w-logo').checked ? 'aus dem Logo übernehmen' : $('w-farbe').value.toUpperCase()) +
      '\nBausteine: ' + (an().join(', ') || '–') + '\n\nWünsche:\n' + f.wuensche.value + '\n\n' + (DATEIEN.length ? 'Bilder (bitte als Anhang anfügen): ' + DATEIEN.map(function (d) { return d.name; }).join(', ') : '(Logo und Fotos schicke ich als Antwort auf Ihre Mail.)');
    location.href = 'mailto:niklas@haeufele-webdesign.de?subject=' + encodeURIComponent('Wunsch-Website: ' + (f.firma.value || f.name.value)) + '&body=' + encodeURIComponent(text);
    h.textContent = 'Ihr E-Mail-Programm öffnet sich mit der fertigen Zusammenfassung. Einfach noch auf Senden tippen.';
  });
})();
