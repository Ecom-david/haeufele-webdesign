/* Live-Hintergrund „Knitterfolie 3D“ – echtes 3D-Modell (WebGL, ohne Bibliotheken, läuft per Doppelklick).
   Tausende Facetten mit Knickfalten; Maus kippt die Folie stark in 3D, Glanzlicht folgt dem Cursor,
   unter dem Cursor wölbt sich die Folie. Handy: Bewegung über Scrollen + Finger.
   Ohne WebGL / „weniger Bewegung“: bisheriger Hintergrund (folie.js / Standbild) bleibt. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  /* 20N-FIX6: Aufbau/Abbau als Paar – im Design-Studio wird der Seiten-Kontext freigegeben (höchstens 2 WebGL-Kontexte), beim Schließen neu gebaut. */
  var abbau = null;
  function bauen() {
  var cv = document.createElement('canvas');
  cv.id = 'folie3d'; cv.setAttribute('aria-hidden', 'true');
  var gl = cv.getContext('webgl', { antialias: true, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return;
  var idx32 = gl.getExtension('OES_element_index_uint');
  window.FOLIE3D = true;

  /* ---------- Geometrie: zerknitterte Folie ---------- */
  var mob = Math.min(innerWidth, innerHeight) < 700;
  var NX = mob ? 26 : 50, NY = mob ? 40 : 32, SX = 3.4, SY = 2.4;          // Ausdehnung (Welt-Einheiten)
  if (mob) { SX = 2.2; SY = 3.4; }
  var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var falten = [];
  for (var k = 0; k < 26; k++) {                                          // Knickfalten = gerade Kanten wie bei echter Folie
    var a = rnd() * Math.PI, amp = 0.30 * Math.pow(0.88, k) + 0.02;
    falten.push([Math.cos(a), Math.sin(a), (rnd() - .5) * 2.6, amp, 0.35 + rnd() * 1.1]);
  }
  function hoehe(x, y) {
    var h = 0;
    for (var i = 0; i < falten.length; i++) {
      var f = falten[i], d = x * f[0] + y * f[1] - f[2];
      var w = d * f[4]; w = w - Math.floor(w); w = Math.abs(w - .5) * 2;  // Dreieckswelle = scharfer Knick
      h += f[3] * (w - .5) * 2;
    }
    return h;
  }
  var nv = (NX + 1) * (NY + 1), pos = new Float32Array(nv * 3), p = 0;
  for (var j = 0; j <= NY; j++) for (var i = 0; i <= NX; i++) {
    var rand = (i === 0 || j === 0 || i === NX || j === NY);
    var x = (i / NX - .5) * 2 * SX + (rand ? 0 : (rnd() - .5) * 0.95 * SX * 2 / NX);
    var y = (j / NY - .5) * 2 * SY + (rand ? 0 : (rnd() - .5) * 0.95 * SY * 2 / NY);
    pos[p++] = x; pos[p++] = y; pos[p++] = hoehe(x, y);
  }
  var ni = NX * NY * 6, ix = (idx32 || nv > 65535) ? new Uint32Array(ni) : new Uint16Array(ni); p = 0;
  for (j = 0; j < NY; j++) for (i = 0; i < NX; i++) {
    var A = j * (NX + 1) + i, B = A + 1, C = A + NX + 1, D = C + 1;
    if ((i + j) & 1) { ix[p++] = A; ix[p++] = B; ix[p++] = D; ix[p++] = A; ix[p++] = D; ix[p++] = C; }
    else { ix[p++] = A; ix[p++] = B; ix[p++] = C; ix[p++] = B; ix[p++] = D; ix[p++] = C; }
  }

  /* ---------- Shader ---------- */
  var VS = [
    'attribute vec3 a;uniform mat4 M,P;uniform vec2 mw;uniform float t,beul;varying vec3 w;',
    'void main(){vec3 q=a;',
    ' vec2 d=q.xy-mw; float b=exp(-dot(d,d)*2.6);',                       // Wölbung unter dem Cursor
    ' q.z+= b*beul + .035*sin(t*.35+q.x*1.7+q.y*1.1) + .02*sin(t*.23-q.y*2.3);',
    ' vec4 wp=M*vec4(q,1.); w=wp.xyz; gl_Position=P*wp;}'
  ].join('\n');
  var FS = [
    '#extension GL_OES_standard_derivatives : enable',
    'precision highp float;varying vec3 w;uniform vec3 L1,L2;uniform vec2 res;uniform float hell;',
    'void main(){',
    ' vec3 n=normalize(cross(dFdx(w),dFdy(w))); if(n.z<0.) n=-n;',
    ' vec3 v=normalize(-w);',                                             // Kamera im Ursprung
    ' vec3 l1=normalize(L1-w), l2=normalize(L2-w);',
    ' float d1=max(dot(n,l1),0.), d2=max(dot(n,l2),0.);',
    ' float s1=pow(max(dot(n,normalize(l1+v)),0.),60.), s1b=pow(max(dot(n,normalize(l1+v)),0.),9.);',
    ' float s2=pow(max(dot(n,normalize(l2+v)),0.),40.);',
    ' float fr=pow(1.-max(dot(n,v),0.),4.);',
    ' float fall=1./(1.+dot(L1-w,L1-w)*.22);',
    ' vec3 grund=vec3(GRUND);',
    ' vec3 c=grund*(.45+2.4*d1*fall+.9*d2) + vec3(LICHT)*(s1*1.6+s1b*.22)*fall*hell + vec3(.6,.62,.68)*s2*.22 + vec3(RAND)*fr*.6;',
    ' vec2 u=gl_FragCoord.xy/res-.5; c*=1.-dot(u,u)*.9;',               // Vignette
    ' c=c/(1.+c*.6); c=pow(c,vec3(1./1.15));',
    ' gl_FragColor=vec4(c,1.);}'
  ].join('\n');
  function cssF(n, d) { try { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); var a = v.split(',').map(parseFloat); return a.length === 3 && a.every(isFinite) ? a.map(function (x) { return x.toFixed(3); }).join(',') : d; } catch (e) { return d; } }
  function sh(t, s) { if (t === gl.FRAGMENT_SHADER) s = s.replace('GRUND', cssF('--gl-grund', '.050,.052,.057')).replace('LICHT', cssF('--gl-licht', '.92,.94,1.0')).replace('RAND', cssF('--gl-rand', '.3,.31,.34')); var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; }
  var pr = gl.createProgram();
  try { gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); } catch (e) { window.FOLIE3D = false; return; }
  gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { window.FOLIE3D = false; return; }
  gl.useProgram(pr);
  var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
  var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ix, gl.STATIC_DRAW);
  var la = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(la); gl.vertexAttribPointer(la, 3, gl.FLOAT, false, 0, 0);
  var U = {}; ['M', 'P', 'mw', 't', 'beul', 'L1', 'L2', 'res', 'hell'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
  var typ = ix instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
  gl.enable(gl.DEPTH_TEST); gl.clearColor(.012, .012, .014, 1);

  /* ---------- Matrizen ---------- */
  function persp(fov, asp, n, f) { var t = 1 / Math.tan(fov / 2), r = 1 / (n - f); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (n + f) * r, -1, 0, 0, 2 * n * f * r, 0]; }
  function modell(rx, ry, z) {
    var cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
    // M = T(0,0,z) * Ry * Rx  (Spalten-Major)
    return [cy, 0, -sy, 0, sy * sx, cx, cy * sx, 0, sy * cx, -sx, cy * cx, 0, 0, 0, z, 1];
  }

  /* ---------- Größe + Qualität ---------- */
  var dpr = Math.min(window.devicePixelRatio || 1, (innerWidth < 760 ? 1.25 : 1.5)), W = 0, H = 0, Z = -3.2, FOV = 0.78;
  function groesse() {
    var nW = Math.round(innerWidth * dpr), nH = Math.round(innerHeight * dpr);
    if (nW === W && nH === H && cv.width === W) return; /* 26B2: gleiche Größe = Zeichenfläche nicht neu anlegen (kein Flackern/Leeren) */
    W = nW; H = nH;
    cv.width = W; cv.height = H; gl.viewport(0, 0, W, H);
    var asp = innerWidth / innerHeight;
    gl.uniformMatrix4fv(U.P, false, new Float32Array(persp(FOV, asp, .1, 20)));
    gl.uniform2f(U.res, W, H);
    // Folie muss bei voller Neigung randlos bleiben
    var halbH = Math.tan(FOV / 2) * -Z, halbW = halbH * asp;
    sk = Math.max(halbW * 1.75 / SX, halbH * 1.75 / SY);
  }
  var sk = 1;

  /* ---------- Bewegung ---------- */
  var mx = 0, my = 0, zx = 0, zy = 0, maus = false, lastMove = 0, t0 = performance.now();
  var onPM = function (e) { zx = e.clientX / innerWidth * 2 - 1; zy = e.clientY / innerHeight * 2 - 1; maus = e.pointerType !== 'touch'; lastMove = performance.now(); };
  var onTM = function (e) { var t = e.touches[0]; if (t) { zx = t.clientX / innerWidth * 2 - 1; zy = t.clientY / innerHeight * 2 - 1; lastMove = performance.now(); } };
  addEventListener('pointermove', onPM, { passive: true });
  addEventListener('touchmove', onTM, { passive: true });

  var frames = 0, sum = 0, last = 0, stufe = 0;
  var grob = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches), scrollZ = 0, zeichZ = 0;
  if (grob) addEventListener('scroll', function () { scrollZ = performance.now(); }, { passive: true });
  var wurz = document.documentElement, gez3 = 0;
  function bild(n) {
    if (wurz.classList.contains('film-aktiv') && gez3 >= 3) { last = 0; return; } /* nach 3 Startbildern pausieren; last=0, damit die Auflösungs-Bremse nach dem Film nicht fälschlich runterschaltet */
    gez3++;
     
    if (grob && n - scrollZ < 140 && n - zeichZ < 30) return; /* 26B2: Handy, während des Scrollens nur ~30 Bilder/s zeichnen → Hauptthread/Speicher frei für das Scrollen (Hintergrund bewegt sich langsam, kein sichtbarer Unterschied) */
    zeichZ = n;
    var t = (n - t0) / 1000, ruhig = n - lastMove > 2500;
    // ohne Maus: langsames Schweben + Scroll gibt Tiefe
    var sc = (scrollY || 0) / Math.max(1, innerHeight);
    var ax = ruhig ? Math.sin(t * .13) * .35 + Math.sin(sc * .9) * .25 : zx;
    var ay = ruhig ? Math.cos(t * .11) * .3 + Math.cos(sc * .7) * .3 : zy;
    mx += (ax - mx) * (ruhig ? .02 : .075); my += (ay - my) * (ruhig ? .02 : .075);
    var M = modell(-.22 + my * .3, mx * .38, Z);
    // Skalierung in die Matrix einrechnen
    for (var i = 0; i < 12; i++) if (i % 4 !== 3) M[i] *= sk;
    gl.uniformMatrix4fv(U.M, false, new Float32Array(M));
    gl.uniform2f(U.mw, mx * SX * .62, -my * SY * .62);
    gl.uniform1f(U.beul, maus && !ruhig ? .32 : .12);
    gl.uniform1f(U.t, t);
    gl.uniform3f(U.L1, mx * 2.2, -my * 1.5, Z + 2.1);
    gl.uniform3f(U.L2, -2.6, 2.2, Z + 1.4);
    gl.uniform1f(U.hell, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, ni, typ, 0);
    // fps-Regelung: zu langsam → Auflösung runter
    if (last) { sum += n - last; frames++; if (frames === 40) { var avg = sum / frames; if (avg > 24 && stufe < 2) { stufe++; dpr = stufe === 1 ? 1 : .75; groesse(); } frames = 0; sum = 0; } }
    last = n;
  }
  var laeuft = false;
  /* läuft im gemeinsamen Seiten-Takt (takt.js) – keine eigene Schleife; Tab versteckt = Takt steht */
  function start() { if (!laeuft) { laeuft = true; last = 0; if (window.TAKT) TAKT.dauer('folie3d', bild); } }
  var onVis = function () { last = 0; };
  var onCtxLost = function (e) { e.preventDefault(); if (window.TAKT) TAKT.aus('folie3d'); laeuft = false; cv.remove(); document.documentElement.classList.remove('folie3d-an'); };
  var onShow = function (e) { if (e.persisted) start(); };
  var onHide = function (e) { if (window.TAKT) TAKT.aus('folie3d'); laeuft = false; if (e.persisted) return; try { gl.deleteBuffer(vb); gl.deleteBuffer(ib); gl.deleteProgram(pr); var lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); } catch (e) {} };
  document.addEventListener('visibilitychange', onVis);
  addEventListener('resize', groesse);
  gl.canvas.addEventListener('webglcontextlost', onCtxLost);
  addEventListener('pageshow', onShow);
  addEventListener('pagehide', onHide);
  abbau = function () {
    if (window.TAKT) TAKT.aus('folie3d'); laeuft = false;
    removeEventListener('pointermove', onPM); removeEventListener('touchmove', onTM); document.removeEventListener('visibilitychange', onVis);
    removeEventListener('resize', groesse); cv.removeEventListener('webglcontextlost', onCtxLost); removeEventListener('pageshow', onShow); removeEventListener('pagehide', onHide);
    try { gl.deleteBuffer(vb); gl.deleteBuffer(ib); gl.deleteProgram(pr); var lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); } catch (e) { }
    if (cv.parentNode) cv.parentNode.removeChild(cv);
    document.documentElement.classList.remove('folie3d-an');
  };

  function ein() {
    document.body.insertBefore(cv, document.body.firstChild);
    groesse(); start();
    requestAnimationFrame(function () { document.documentElement.classList.add('folie3d-an'); });
  }
  if (document.body) ein(); else addEventListener('DOMContentLoaded', ein);
  }
  addEventListener('haeufele-studio', function (e) {
    if (e.detail && e.detail.offen) { if (abbau) { abbau(); abbau = null; } }
    else if (!abbau) bauen();
  });
  if (!document.documentElement.classList.contains('st-an')) bauen();
})();
