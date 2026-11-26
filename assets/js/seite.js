(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Kopfzeile bekommt Fläche beim Scrollen */
  var kopf = document.getElementById('kopf');
  function k() { kopf.classList.toggle('voll', scrollY > 40); }
  addEventListener('scroll', k, { passive: true }); k();

  /* Einblenden */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.auf').forEach(function (el) { io ? io.observe(el) : el.classList.add('da'); });

  /* Template-Karten mit lebender Vorschau (Licht wandert über die Farbe des Templates) */
  var box = document.getElementById('karten');
  if (box && window.TEMPLATES) {
    TEMPLATES.forEach(function (t) {
      var a = document.createElement(t.fertig ? 'a' : 'div');
      a.className = 'karte auf' + (t.fertig ? ' fertig' : '');
      if (t.fertig) a.href = '#wunsch';
      a.style.setProperty('--t-grund', t.grund); a.style.setProperty('--t-akzent', t.akzent);
      a.innerHTML = '<div class="vorschau">' + (t.fertig ? '<img src="assets/img/vorschau-' + t.id + '.webp" width="960" height="1200" loading="lazy" alt="Vorschau des Templates ' + t.name + '">' : '<canvas width="480" height="300"></canvas>') + '</div>' +
        '<span class="beispiel">Beispiel-Template</span>' +
        '<span class="status">' + (t.fertig ? 'Wählen' : 'In Arbeit') + '</span>' +
        '<div class="inhalt"><span class="gewerk">' + t.gewerk + '</span><h3>' + t.name + '</h3><p>' + t.text + '</p></div>';
      box.appendChild(a);
      if (io) io.observe(a); else a.classList.add('da');
      if (!t.fertig) vorschau(a.querySelector('canvas'), t);
    });
  }
  function vorschau(c, t) {
    var x = c.getContext('2d'), sicht = false, ph = Math.random() * 6;
    function hex(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
    function mal(s) {
      x.fillStyle = t.grund; x.fillRect(0, 0, 480, 300);
      for (var i = 0; i < 3; i++) {
        var px = 240 + Math.sin(s * 0.35 + ph + i * 2.1) * 170, py = 150 + Math.cos(s * 0.27 + ph + i) * 90;
        var g = x.createRadialGradient(px, py, 0, px, py, 220 - i * 40);
        g.addColorStop(0, hex(i ? t.b[1] : t.b[0], i ? 0.55 : 0.32)); g.addColorStop(1, hex(t.grund, 0));
        x.fillStyle = g; x.fillRect(0, 0, 480, 300);
      }
      x.strokeStyle = hex(t.akzent, 0.18); x.lineWidth = 1;
      for (var j = 0; j < 9; j++) { x.beginPath(); var y = 40 + j * 28 + Math.sin(s * 0.5 + j) * 4; x.moveTo(0, y); x.bezierCurveTo(160, y - 30, 320, y + 30, 480, y - 10); x.stroke(); }
    }
    mal(0);
    if (reduce || !('IntersectionObserver' in window)) return;
    var lauft = false; new IntersectionObserver(function (e) { sicht = e[0].isIntersecting; if (sicht && !lauft) { lauft = true; requestAnimationFrame(lauf); } }).observe(c);
    var t0 = performance.now();
    function lauf(n) { if (!sicht || document.hidden) { lauft = false; return; } mal((n - t0) / 1000); requestAnimationFrame(lauf); }
  }

  /* Kontaktformular: lokal per E-Mail-Programm, später an den Server */
  var f = document.getElementById('kontaktform'), h = document.getElementById('formhinweis');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (f.website.value) return;
    var fehlt = [];
    if (!f.name.value.trim()) fehlt.push('Ihren Namen');
    if (!f.telefon.value.trim()) fehlt.push('eine Telefonnummer');
    if (!f.thema.value) fehlt.push('worum es geht');
    if (!f.datenschutz.checked) fehlt.push('das Häkchen zum Datenschutz');
    if (fehlt.length) { h.textContent = 'Bitte noch ergänzen: ' + fehlt.join(', ') + '.'; return; }
    var text = 'Name: ' + f.name.value + '\nBetrieb: ' + f.betrieb.value + '\nTelefon: ' + f.telefon.value +
      '\nE-Mail: ' + f.email.value + '\nThema: ' + f.thema.value + '\n\n' + f.nachricht.value;
    location.href = 'mailto:niklas@haeufele-webdesign.de?subject=' + encodeURIComponent('Rückruf: ' + f.thema.value) + '&body=' + encodeURIComponent(text);
    h.textContent = 'Ihr E-Mail-Programm öffnet sich mit der fertigen Nachricht. Einfach noch auf Senden tippen.';
  });

  /* Fragen-Assistent: kleines Fenster, feste Antworten, keine Daten an Dritte */
  var A = [
    ['Was kostet eine Website?', 'Das hängt davon ab, was Ihr Betrieb braucht. Ich zeige Ihnen im Gespräch eine fertige Demo mit Ihrem Namen und drei Pakete zur Auswahl – ohne Verpflichtung.'],
    ['Wie lange dauert das?', 'Meist steht die Seite zwei bis drei Wochen nach unserem Gespräch. Die Demo sehen Sie schon vorher.'],
    ['Muss ich viel selbst machen?', 'Nein. Sie wählen ein Template, kreuzen an, was rein soll, und schicken ein paar Fotos. Texte, Technik und Rechtliches übernehme ich.'],
    ['Was ist das KI-Telefon?', 'Wenn Sie nicht rangehen können, nimmt eine Stimme ab, fragt nach dem Anliegen und trägt einen Termin in Ihren Kalender ein. Sie bekommen eine Zusammenfassung aufs Handy.'],
    ['Kommen Sie zu mir?', 'Ja – in Ulm, Neu-Ulm, Senden, Illertissen und Umgebung komme ich persönlich vorbei.'],
    ['Rückruf anfordern', null]
  ];
  var v = document.getElementById('verlauf'), fr = document.getElementById('fragen'), assi = document.getElementById('assi');
  function sag(t, wer) { var d = document.createElement('div'); d.className = 'msg ' + wer; d.textContent = t; v.appendChild(d); v.scrollTop = v.scrollHeight; }
  if (v && !window.KICHAT) {
    sag('Hallo! Was möchten Sie wissen? Einfach antippen:', 'bot');
    A.forEach(function (q) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = q[0];
      b.onclick = function () {
        if (!q[1]) { location.hash = 'kontakt'; return; }
        sag(q[0], 'ich'); setTimeout(function () { sag(q[1], 'bot'); }, reduce ? 0 : 350);
      };
      fr.appendChild(b);
    });
    var zu = document.getElementById('assizu');
    function toggle() { var z = assi.classList.toggle('zu'); zu.textContent = z ? '+' : '–'; zu.setAttribute('aria-label', z ? 'Fragen-Assistent öffnen' : 'Fragen-Assistent einklappen'); }
    document.getElementById('assikopf').addEventListener('click', toggle);
    if (innerWidth < 700 || innerHeight < 600) toggle();
  }
})();

/* Aus einem Template „Dieses Template wählen“ geklickt: Formular vorausfüllen */
(function () {
  var m = /[?&]template=([a-z]+)/.exec(location.search), f = document.getElementById('kontaktform');
  if (!m || !f || !window.TEMPLATES) return;
  var t = TEMPLATES.filter(function (x) { return x.id === m[1]; })[0]; if (!t) return;
  f.thema.value = 'Neue Website';
  if (!f.nachricht.value) f.nachricht.value = 'Template gewählt: ' + t.name + ' (' + t.gewerk + '). Mein Gewerk / Ort: ';
})();
