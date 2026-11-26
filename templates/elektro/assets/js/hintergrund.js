/* Hintergrund-Steuerung: Standard ist eine Live-Welt aus der Häufele-Bibliothek (hg-auswahl.js),
   in der Farbe des Templates. Umschalter unten links („Hintergrund“). Zusätzlich „Material“ =
   echtes 4K-Blender-Render des jeweiligen Templates mit wanderndem Licht.
   Wahl bleibt im Browser gespeichert und lässt sich per ?hg=<name> setzen (für den Konfigurator). */
(function () {
  var cv = document.getElementById('hg'); if (!cv) return;
  var T = window.TEMPLATE_HG || { standard: 'polarlicht', G: [.020, .034, .046], C: [.62, .83, .95] };
  var NAMEN = { polarlicht: 'Polarlicht', lichtfall: 'Lichtfall', tiefe: 'Polierte Tiefe', ringe: 'Lichtringe', dampf: 'Dampf', rauch: 'Rauchfäden', funken: 'Funken', leiterbahn: 'Leiterbahnen', kohle: 'Glut & Kohle', strom: 'Glasstrom', indigo: 'Indigo-Strom', chrom: 'Flüssiges Chrom', seide: 'Seidenfalten', prisma: 'Prisma', material: 'Material (4K)' };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var aktiv = null, wahl = T.standard;
  try { var q = (location.search.match(/[?&]hg=([a-z]+)/) || [])[1]; var s = localStorage.getItem('hg-' + (T.id || 'x')); wahl = (q && NAMEN[q]) ? q : (s && NAMEN[s] ? s : T.standard); } catch (e) { }

  function neuCanvas() { var n = cv.cloneNode(false); cv.parentNode.replaceChild(n, cv); cv = n; return n; }
  function setze(k, merken) {
    if (aktiv && aktiv.stop) aktiv.stop(); aktiv = null;
    var c = neuCanvas(); document.documentElement.classList.remove('hg-live');
    document.documentElement.dataset.hg = k;
    if (k === 'material') aktiv = material(c);
    else if (window.HG_START) aktiv = window.HG_START(c, k, T.G, T.C);
    if (aktiv) requestAnimationFrame(function () { document.documentElement.classList.add('hg-live'); });
    wahl = k; if (merken) try { localStorage.setItem('hg-' + (T.id || 'x'), k); } catch (e) { }
    if (menue) Array.prototype.forEach.call(menue.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.dataset.k === k); });
  }

  /* Material: 4K-Render + Normalen aus dem Bild, Licht in Akzentfarbe wandert und folgt der Maus */
  function material(c) {
    var portrait = innerHeight > innerWidth, src = portrait ? window.BG_HANDY : window.BG_DESKTOP;
    if (!src) return null;
    var gl = c.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false }); if (!gl) return null;
    var fs = ['precision highp float;varying vec2 v;uniform sampler2D t;uniform vec2 res,img,px,L;uniform vec3 lc;',
      'vec2 cover(vec2 uv){float ra=res.x/res.y,ia=img.x/img.y;vec2 s=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.);return (uv-.5)*s+.5;}',
      'float lum(vec2 u){return dot(texture2D(t,u).rgb,vec3(.299,.587,.114));}',
      'void main(){vec2 uv=cover(vec2(v.x,1.-v.y));vec3 c=texture2D(t,uv).rgb;',
      ' float hx=lum(uv+vec2(px.x,0.))-lum(uv-vec2(px.x,0.)),hy=lum(uv+vec2(0.,px.y))-lum(uv-vec2(0.,px.y));',
      ' vec3 n=normalize(vec3(-hx*3.2,-hy*3.2,1.));vec2 d=uv-L;float fall=exp(-dot(d,d)*6.);',
      ' vec3 l=normalize(vec3(L-uv,.5));float sp=pow(max(dot(n,normalize(l+vec3(0.,0.,1.))),0.),48.);',
      ' gl_FragColor=vec4(c*(.74+.30*fall)+lc*fall*.05+lc*sp*fall*.55*smoothstep(.06,.35,lum(uv)),1.);}'].join('\n');
    function sh(ty, s) { var o = gl.createShader(ty); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}')); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null; gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['t', 'res', 'img', 'px', 'L', 'lc'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    gl.uniform3f(U.lc, T.C[0], T.C[1], T.C[2]);
    var alive = true, dpr = Math.min(devicePixelRatio || 1, 1.5), scale = 1, mx = .4, my = .35, lx = .4, ly = .35, last = 0, slow = 0, t0 = performance.now(), ready = false;
    function size() { var w = Math.round(innerWidth * dpr * scale), h = Math.round(innerHeight * dpr * scale); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(U.res, w, h); } }
    function pm(e) { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }
    addEventListener('resize', size); addEventListener('pointermove', pm, { passive: true });
    var im = new Image();
    im.onload = function () {
      if (!alive) return; var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); } catch (e) { return; }
      [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(function (p) { gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR); });
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform2f(U.img, im.width, im.height); gl.uniform2f(U.px, 4 / im.width, 4 / im.height); ready = true; size(); requestAnimationFrame(loop);
    };
    im.src = src;
    function loop(now) {
      if (!alive) return; requestAnimationFrame(loop); if (document.hidden || !ready) return;
      var dt = now - last; last = now;
      if (dt > 30 && dt < 200) { if (++slow > 40 && scale > .6) { scale -= .15; slow = 0; size(); } } else slow = Math.max(0, slow - 1);
      var s = reduce ? 3 : (now - t0) / 1000, ax = .5 + .32 * Math.sin(s * .1), ay = .45 + .24 * Math.sin(s * .2);
      lx += ((ax * .6 + mx * .4) - lx) * .025; ly += ((ay * .6 + my * .4) - ly) * .025;
      gl.uniform2f(U.L, lx, ly); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    return { stop: function () { alive = false; removeEventListener('resize', size); removeEventListener('pointermove', pm); var e = gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); } };
  }

  /* Umschalter */
  var menue = null;
  if (!reduce) {
    var box = document.createElement('div'); box.className = 'hgwahl zu'; box.innerHTML = '<button type="button" class="hgknopf" aria-expanded="false"><i></i>Hintergrund</button><div class="hgliste" role="group" aria-label="Hintergrund wählen"></div>';
    menue = box.querySelector('.hgliste');
    (T.liste || Object.keys(NAMEN)).forEach(function (k) { var b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = NAMEN[k]; b.setAttribute('aria-pressed', 'false'); b.onclick = function () { setze(k, true); }; menue.appendChild(b); });
    var kn = box.querySelector('.hgknopf'); kn.onclick = function () { var z = box.classList.toggle('zu'); kn.setAttribute('aria-expanded', !z); };
    var demo = document.querySelector('.demo'); if (demo) { box.classList.add('imdemo'); demo.appendChild(box); } else document.body.appendChild(box);
    document.addEventListener('click', function (e) { if (!box.contains(e.target) && !box.classList.contains('zu')) { box.classList.add('zu'); kn.setAttribute('aria-expanded', 'false'); } });
  }
  setze(wahl, false);
})();
