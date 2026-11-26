/* ICH – Chrom wird Mensch, jetzt als echte Verwandlung (11.11.2026, ersetzt die Scan-Linie):
   Die Chrom-Figur zerfällt von oben nach unten in ~90.000 Partikel, die in 3D aufwirbeln, sich unterwegs umfärben
   und als echter Niklas wieder zusammensetzen. Scroll-gesteuert vor/zurück, Maus kippt die Wolke.
   WebGL1, ein Draw-Call, rAF nur sichtbar; ohne WebGL oder bei reduzierter Bewegung bleibt das alte Verhalten. */
(function () {
  'use strict';
  var sec = document.getElementById('ich'); if (!sec || !window.ICH_TEX) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  /* WebGL-Kontext erst, wenn der Abschnitt zu mind. 30 % des Bildschirms sichtbar ist (Sprünge bauen nichts unnötig auf) */
  /* 21H1F: Aufbau schon VOR dem Sichtbarwerden (60 % Bildschirmhöhe Vorlauf), in Schritten im Leerlauf – vorher entstand der Kontext
     (Shader-Kompilierung, 90.000-Punkte-Puffer, erster Zeichenbefehl) erst mitten im Scrollen = Long Task 110–165 ms bei Seite 22–25 %. */
  var gestartet = false, vorIO = new IntersectionObserver(function (es) {
    var q = es[0]; if (gestartet || !q.isIntersecting) return;
    if (document.documentElement.classList.contains('st-an')) return; /* 20N-FIX6: im offenen Design-Studio kein Kontext */
    gestartet = true; vorIO.disconnect();
    if (window.requestIdleCallback) requestIdleCallback(init, { timeout: 400 }); else setTimeout(init, 60);
  }, { rootMargin: '60% 0px' });
  vorIO.observe(sec);
  /* 20N-FIX5: weit weg (mehr als 1,5 Bildschirme) → WebGL-Kontext ganz freigeben, beim Zurückkommen neu aufbauen.
     Vorher blieb der Kontext bis zum Seitenende bestehen → im Design-Studio liefen 3–4 WebGL-Kontexte gleichzeitig. */
  var weg = null, wegT = 0, letzterScroll = 0;
  addEventListener('scroll', function () { letzterScroll = performance.now(); }, { passive: true });
  /* 21H1F: Abbau (Kontext freigeben, Canvas entfernen = Long Task) erst nach 5 s Abwesenheit, nie während des Scrollens, im Leerlauf */
  function wegPlanen() {
    wegT = setTimeout(function () {
      wegT = 0; if (!weg) return;
      if (performance.now() - letzterScroll < 600) { wegPlanen(); return; }
      var f = function () { if (weg) { weg(); weg = null; gestartet = false; vorIO.observe(sec); } };
      if (window.requestIdleCallback) requestIdleCallback(f, { timeout: 1500 }); else f();
    }, 5000);
  }
  new IntersectionObserver(function (es) {
    if (es[0].isIntersecting) { clearTimeout(wegT); wegT = 0; return; }
    if (weg && !wegT) wegPlanen();
  }, { rootMargin: '150% 0px' }).observe(sec);
  /* 20N-FIX6: Design-Studio offen → Kontext freigeben; beim Schließen wieder anmelden (baut nur, wenn der Abschnitt sichtbar ist). */
  addEventListener('haeufele-studio', function (ev) {
    if (ev.detail && ev.detail.offen) { clearTimeout(wegT); wegT = 0; if (weg) { weg(); weg = null; } gestartet = false; vorIO.disconnect(); }
    else if (!weg) { gestartet = false; vorIO.disconnect(); vorIO.observe(sec); }
  });
  function init() {
  if (document.documentElement.classList.contains('st-an')) { gestartet = false; return; }
  var fig = sec.querySelector('.ich-figur');
  var cv = document.createElement('canvas'); cv.className = 'ich-pk'; cv.setAttribute('aria-hidden', 'true');
  var gl = cv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) return;
  var mobil = matchMedia('(max-width:860px)').matches;
  var GX = mobil ? 192 : 300, GY = Math.round(GX * 1.25), NP = GX * GY;
  var VS = [
    'precision highp float;',
    'attribute vec2 aUV; attribute float aR;',
    'uniform float uS, uT, uAsp, uPx; uniform vec2 uM; uniform sampler2D uA, uB;',
    'varying vec3 vC; varying float vA;',
    'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
    'void main(){',
    '  float del = aUV.y*0.42 + aR*0.16;',
    '  float k = clamp((uS*1.58 - del)/0.42, 0.0, 1.0);',
    '  k = k*k*(3.0-2.0*k);',
    '  float sp = sin(k*3.14159);',
    '  vec3 p = vec3((aUV.x-0.5)*1.6, (0.5-aUV.y)*2.0, 0.0);',
    '  float a1 = aR*43.0, a2 = aR*91.0;',
    '  vec3 wirbel = vec3(sin(a1 + uT*0.6 + p.y*3.0), cos(a2 + uT*0.5 + p.x*4.0)*0.8 + 0.35, sin(a1*1.7 + uT*0.4));',
    '  p += wirbel * sp * (0.35 + aR*0.55);',
    '  p.xz = rot(sp*(1.4 + aR) + uM.x*0.35) * p.xz;',
    '  p.yz = rot(uM.y*0.25) * p.yz;',
    '  float z = p.z*0.55 + 2.4;',
    '  gl_Position = vec4(p.x*2.4/z*0.78125, p.y*2.4/z*0.76923, 0.0, 1.0);',
    '  gl_PointSize = uPx * (1.0 + sp*(1.2 + aR*1.6)) * (2.4/z);',
    '  vec3 ca = texture2D(uA, aUV).rgb, cb = texture2D(uB, aUV).rgb;',
    '  float m = smoothstep(0.38, 0.62, k + (aR-0.5)*0.12);',
    '  vC = mix(ca, cb, m) * (1.0 + sp*0.6);',
    '  vA = 1.0 - sp*0.25;',
    '}'].join('\n');
  var FS = [
    'precision mediump float; varying vec3 vC; varying float vA;',
    'void main(){ vec2 d = gl_PointCoord-0.5; float r = dot(d,d); if(r>0.25) discard; float a = vA*smoothstep(0.25,0.12,r); gl_FragColor = vec4(vC*a, a); }'].join('\n');
  var pext = gl.getExtension('KHR_parallel_shader_compile'); /* 21H1F: Kompilieren läuft im Hintergrund, Hauptthread wartet nicht */
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!pext && !gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; }
  var pr;
  try { pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); if (!pext && !gl.getProgramParameter(pr, gl.LINK_STATUS)) throw 'link'; }
  catch (e) { return; }
  var versuche = 0;
  (function warteKompilieren() {
    if (pext && !gl.getProgramParameter(pr, pext.COMPLETION_STATUS_KHR) && versuche++ < 300) { setTimeout(warteKompilieren, 8); return; }
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    setTimeout(aufbau, 0);
  })();
  function aufbau() {
  if (gestartet === false) return; /* zwischenzeitlich abgebaut */
  gl.useProgram(pr);
  var uv = new Float32Array(NP * 2), rr = new Float32Array(NP), i = 0;
  for (var y = 0; y < GY; y++) for (var x = 0; x < GX; x++) { uv[i * 2] = (x + .5) / GX; uv[i * 2 + 1] = (y + .5) / GY; rr[i] = Math.random(); i++; }
  function buf(d, name, n) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); var l = gl.getAttribLocation(pr, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 0, 0); }
  buf(uv, 'aUV', 2); buf(rr, 'aR', 1);
  var U = {}; ['uS', 'uT', 'uAsp', 'uPx', 'uM', 'uA', 'uB'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
  var bereit = 0;
  function tex(src, unit) {
    var t = gl.createTexture(), im = new Image();
    im.onload = function () {
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (!cv.parentNode) return; bereit++; if (bereit === 2) { warm(); sec.classList.add('pk'); an(); }
    };
    im.src = src;
  }
  function warm() { /* 21H1F: erster Draw-Call im Leerlauf (Pipeline-State), Leinwand ist noch unsichtbar (opacity 0) */
    try { cv.width = 64; cv.height = 80; gl.viewport(0, 0, 64, 80); gl.uniform1f(U.uS, .5); gl.uniform1f(U.uT, 0); gl.uniform1f(U.uAsp, 1); gl.uniform1f(U.uPx, 2); gl.uniform2f(U.uM, 0, 0); gl.drawArrays(gl.POINTS, 0, NP); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } catch (e) {}
  }
  tex(ICH_TEX.chrom, 0); tex(ICH_TEX.echt, 1);
  gl.uniform1i(U.uA, 0); gl.uniform1i(U.uB, 1);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  fig.appendChild(cv);

  function c(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function e(x) { x = c(x); return x * x * (3 - 2 * x); }
  function r(a, b, x) { return c((x - a) / (b - a)); }
  var sicht = false, lauft = false, mx = 0, my = 0, tx = 0, ty = 0, sv = -1, t0 = performance.now();
  /* 21H1F: Maße nur bei Laden/Größenänderung (keine getBoundingClientRect im Bild-Takt) */
  var gTop = 0, gH = 1, fW = 1, fH = 1;
  function messen() { gTop = sec.getBoundingClientRect().top + scrollY; gH = sec.offsetHeight; fW = fig.offsetWidth; fH = fig.offsetHeight; }
  messen(); addEventListener('resize', messen); addEventListener('load', messen);
  var roM = window.ResizeObserver ? new ResizeObserver(messen) : null; if (roM) roM.observe(document.body);
  function groesse() {
    var b = { width: fW, height: fH }, dpr = Math.min(devicePixelRatio || 1, (innerWidth < 760 ? 1.25 : 1.5));
    // Leinwand größer als die Figur, damit Partikel herausfliegen können
    var w = Math.round(b.width * 1.6 * dpr), h = Math.round(b.height * 1.3 * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    return dpr;
  }
  function bild(now) {
    lauft = false;
    var b = { top: gTop - scrollY, height: gH }, vh = innerHeight, fb0 = { width: fW, height: fH };
    var p = c(-b.top / Math.max(1, b.height - vh));
    var s = e(r(.12, .72, p));
    mx += (tx - mx) * .1; my += (ty - my) * .1;
    var mitten = s > .004 && s < .996;
    sec.classList.toggle('pk-flug', mitten);
    sec.classList.toggle('pk-ende', s >= .996);
    if (mitten) {
      var dpr = groesse();
      var fb = fb0;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uS, s); gl.uniform1f(U.uT, (now - t0) / 1000);
      gl.uniform1f(U.uAsp, cv.width / cv.height / 0.8 * 1.0);
      // Punktgröße so, dass das Raster lückenlos wirkt
      gl.uniform1f(U.uPx, Math.max(1.5, fb.width * dpr / GX * 1.6));
      gl.uniform2f(U.uM, mx, my);
      gl.drawArrays(gl.POINTS, 0, NP);
    }
    if (sicht && !document.hidden && (Math.abs(tx - mx) > .002 || Math.abs(ty - my) > .002)) an(); /* im Leerlauf keine Dauer-Schleife */
  }
  function an() { if (!lauft && sicht && bereit === 2) { lauft = true; requestAnimationFrame(bild); } }
  function onScroll() { if (sicht) an(); }
  function onMove(ev) { if (!sicht || ev.pointerType === 'touch') return; tx = (ev.clientX / innerWidth - .5) * 2; ty = (ev.clientY / innerHeight - .5) * 2; an(); }
  function onHide(ev) { if (ev.persisted) return; try { var lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); } catch (x) {} }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', an);
  addEventListener('pointermove', onMove, { passive: true });
  var sichtIO = new IntersectionObserver(function (es) { sicht = es[0].isIntersecting; if (sicht) an(); }, { rootMargin: '10% 0px' });
  sichtIO.observe(sec);
  addEventListener('pagehide', onHide);
  weg = function () { /* 20N-FIX5: alles abbauen */
    sicht = false; sichtIO.disconnect();
    removeEventListener('scroll', onScroll); removeEventListener('resize', an); removeEventListener('resize', messen); removeEventListener('load', messen); if (roM) roM.disconnect(); removeEventListener('pointermove', onMove); removeEventListener('pagehide', onHide);
    try { var lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); } catch (x) {}
    if (cv.parentNode) cv.parentNode.removeChild(cv);
    sec.classList.remove('pk', 'pk-flug', 'pk-ende');
  };
  } /* aufbau */
  }
})();
