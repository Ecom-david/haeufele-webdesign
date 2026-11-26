/* Live-Hintergrund Knitterfolie: echtes 4K-Render + wanderndes Licht per WebGL.
   Läuft auch per Doppelklick (lokal): Bild kommt als data-URI aus bg-*.js.
   Ohne WebGL / bei "weniger Bewegung" bleibt das ruhige Standbild (CSS). */
(function () {
  var cv = document.getElementById('folie');
  if (!cv) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var portrait = innerHeight > innerWidth;
  var src = portrait ? window.BG_HANDY : window.BG_DESKTOP;
  if (!src || reduce || window.FOLIE3D) return;
  var gl = cv.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return;

  var vs = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var fs = [
    'precision highp float;varying vec2 v;uniform sampler2D t;uniform vec2 res,img,px;uniform vec2 L;uniform float tm;',
    'vec2 cover(vec2 uv){float ra=res.x/res.y,ia=img.x/img.y;vec2 s=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.);return (uv-.5)*s+.5;}',
    'float lum(vec2 u){return dot(texture2D(t,u).rgb,vec3(.299,.587,.114));}',
    'void main(){vec2 uv=cover(vec2(v.x,1.-v.y));',
    ' vec3 c=texture2D(t,uv).rgb;',
    ' float hx=lum(uv+vec2(px.x,0.))-lum(uv-vec2(px.x,0.));',
    ' float hy=lum(uv+vec2(0.,px.y))-lum(uv-vec2(0.,px.y));',
    ' vec3 n=normalize(vec3(-hx*3.5,-hy*3.5,1.));',
    ' vec2 d=uv-L; float fall=exp(-dot(d,d)*7.);',
    ' vec3 l=normalize(vec3(L-uv,.55));',
    ' float sp=pow(max(dot(n,normalize(l+vec3(0.,0.,1.))),0.),42.);',
    ' float sh=lum(uv);',
    ' vec3 col=c*(.72+.38*fall)+vec3(sp*fall*.35*smoothstep(.15,.6,sh));',
    ' gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  function sh(type, s) { var o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o); return o; }
  var pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['t', 'res', 'img', 'px', 'L', 'tm'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });

  var im = new Image();
  im.onload = function () {
    var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); } catch (e) { return; }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform2f(U.img, im.width, im.height);
    gl.uniform2f(U.px, 4.0 / im.width, 4.0 / im.height);
    document.documentElement.classList.add('folie-live');
    start();
  };
  im.src = src;

  var dpr = Math.min(window.devicePixelRatio || 1, (innerWidth < 760 ? 1.25 : 1.5)), scale = 1;
  function size() {
    var w = Math.round(innerWidth * dpr * scale), h = Math.round(innerHeight * dpr * scale);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(U.res, w, h); }
  }
  addEventListener('resize', size);

  var mx = 0.42, my = 0.38, lx = 0.42, ly = 0.38, visible = true, last = 0, slow = 0, t0 = performance.now();
  addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }, { passive: true });
  document.addEventListener('visibilitychange', function () { var war = visible; visible = !document.hidden; if (visible && !war) requestAnimationFrame(loop); });

  function start() { size(); requestAnimationFrame(loop); }
  function loop(now) {
    if (!visible) return;
    var dt = now - last; last = now;
    if (dt > 30 && dt < 200) { if (++slow > 40 && scale > 0.6) { scale -= 0.15; slow = 0; size(); } } else slow = Math.max(0, slow - 1);
    var s = (now - t0) / 1000;
    // Licht wandert langsam in einer Acht, die Maus zieht es sanft mit
    var ax = 0.5 + 0.30 * Math.sin(s * 0.11), ay = 0.45 + 0.22 * Math.sin(s * 0.22);
    lx += ((ax * 0.6 + mx * 0.4) - lx) * 0.025; ly += ((ay * 0.6 + my * 0.4) - ly) * 0.025;
    gl.uniform2f(U.L, lx, ly);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(loop);
  }
})();
