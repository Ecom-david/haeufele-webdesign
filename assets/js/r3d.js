/* R3D – echte 3D-Hintergründe aus Blender (Cycles), live im Browser.
   Jede Szene ist einmal gerendert, aber getrennt nach Lichtgruppen (Hauptlicht, Gegenlicht, Fülllicht, Leuchtkern)
   + Tiefenbild. Der Browser mischt die Lichtgruppen in Echtzeit in jeder Farbe, lässt einen Lichtlauf über die
   Bänder wandern und verschiebt die Ebenen nach Tiefe mit der Maus (echte Parallaxe).
   Daten: window.R3D_DATA[name] = { d:{key,rim,fill,glow,tiefe}, m:{…} } als data-URIs (läuft per Doppelklick),
   werden bei Bedarf aus assets/js/r3d-<name>.js nachgeladen. Erweitert window.HG_START um die Namen in R3D_LISTE. */
(function () {
  'use strict';
  var LISTE = { glas3d: ['r3d-strom'], clair3d: ['r3d-strom', 'clair'], blitz3d: ['r3d-blitz'], blitzclair: ['r3d-blitz', 'clair'] };
  ['stecker', 'tropfen', 'flamme', 'sonne', 'pinsel', 'dach', 'fliese', 'schwalbe'].forEach(function (n) { LISTE['o-' + n] = ['r3d-o-' + n]; }); /* Glas-Objekte je Gewerk, Daten: r3d-o-<name>.js */
  window.R3D_LISTE = LISTE; window.R3D_DATA = window.R3D_DATA || {};
  var alt = window.HG_START;
  function ladeDaten(name, fertig) {
    if (window.R3D_DATA[name]) return fertig();
    var s = document.createElement('script'); s.src = 'assets/js/' + name + '.js'; s.onload = fertig; s.onerror = fertig; document.head.appendChild(s);
  }
  window.HG_START = function (cv, key, G, C, opt) {
    if (!LISTE[key]) return alt ? alt(cv, key, G, C) : null;
    var lebt = true, inner = null;
    var e = LISTE[key]; ladeDaten(e[0], function () { if (lebt) inner = start(cv, e[0], G, C, key, { palette: e[1] }); });
    return { stop: function () { lebt = false; if (inner) inner.stop(); } };
  };

  function start(cv, name, G, C, key, opt) {
    var D = window.R3D_DATA[name]; if (!D) return null;
    var gl = null; try { gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, premultipliedAlpha: false }); } catch (e) { }
    if (!gl) return null;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hp = false; try { var pf = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT); hp = !!(pf && pf.precision > 0); } catch (e) { }
    var FS = ['precision ' + (hp ? 'highp' : 'mediump') + ' float;',
      'uniform sampler2D tK,tR,tF,tG,tZ;uniform vec2 uR,uI,uM;uniform float uT,uS;uniform vec3 cK,cR,cF,cG,cB,uF;',
      'vec2 cover(vec2 uv){float ra=uR.x/uR.y,ia=uI.x/uI.y;vec2 s=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.);return (uv-.5)*s*uF.z+.5+uF.xy;}',
      'vec3 lin(vec3 c){return c*c*(c*.305306+.682171)+c*c*c*.012522;}',
      'float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 uv=cover(vec2(q.x,1.-q.y));',
      /* Parallaxe: Tiefe holen, vorn stärker verschieben (zwei Schritte für saubere Kanten) */
      ' vec2 off=uM*vec2(-.022,.016)+vec2(sin(uT*.11),cos(uT*.083))*.0035+vec2(0.,(uS-.5)*.02);',
      ' float z=texture2D(tZ,uv).r;vec2 u2=uv+off*(z-.35);z=texture2D(tZ,u2).r;u2=uv+off*(z-.35);',
      ' vec3 k=lin(texture2D(tK,u2).rgb),r=lin(texture2D(tR,u2).rgb),f=lin(texture2D(tF,u2).rgb),g=lin(texture2D(tG,u2).rgb);',
      /* Lichtlauf: ein breiter Lichtstreif wandert langsam die Bänder entlang (sieht aus wie fließendes Licht) */
      ' vec2 dir=normalize(vec2(.9,-.44));float s=dot(u2-.5,dir);float lauf=.72+.55*smoothstep(.34,0.,abs(fract(s*.55-uT*.035)-.5))+.12*sin(uT*.21+s*3.);',
      ' float puls=.80+.20*sin(uT*.6)+.08*sin(uT*1.7);',
      ' float mk=.85+.3*smoothstep(.9,.0,length(q-(vec2(.5)+uM*vec2(1.,-1.))));',
      ' vec3 col=k*cK*lauf*mk+r*cR*(.9+.15*sin(uT*.17+1.))+f*cF+g*cG*puls+cB*(.4+.6*q.y);',
      ' float rand=smoothstep(0.,.07,u2.x)*smoothstep(1.,.93,u2.x)*smoothstep(0.,.07,u2.y)*smoothstep(1.,.93,u2.y);col*=rand;col+=cB*.4*(1.-rand);',
      ' col=col/(1.+col*.32);col=pow(col,vec3(1./2.2));',
      ' vec2 v=q-.5;col*=1.-dot(v,v)*.55;col+=(h(gl_FragCoord.xy+fract(uT*7.)*91.)-.5)*.010;',
      ' gl_FragColor=vec4(col,1.);}'].join('\n');
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn('R3D', gl.getShaderInfoLog(o)); return null; } return o; }
    var v = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'), f = sh(gl.FRAGMENT_SHADER, FS); if (!v || !f) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null; gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['tK', 'tR', 'tF', 'tG', 'tZ', 'uR', 'uI', 'uM', 'uT', 'uS', 'cK', 'cR', 'cF', 'cG', 'cB', 'uF'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

    /* Farben: aus Akzent C + Grundton G. Für den Indigo-Clair-Look feste Farben. */
    function farben() {
      var a = C, w = [1, 1, 1], mixf = function (x, y, t) { return [x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]; }, mul = function (x, s) { return [x[0] * s, x[1] * s, x[2] * s]; };
      if (opt.palette === 'clair') return { cK: [.55, .42, 1.7], cR: [1.7, .82, .2], cF: [.14, .10, .42], cG: [2.0, .82, .16], cB: [.006, .005, .02] };
      var lin = function (c) { return c.map(function (x) { return Math.pow(x, 2.2); }); }, al = lin(a);
      return { cK: mul(mixf(w, al, .55), 1.55), cR: mul(al, 1.9), cF: mul(mixf(G.map(function (x) { return x * 4; }), al, .15), 1), cG: mul(al, 2.2), cB: mul(G, .35) };
    }
    var F = farben();
    function setF() { gl.uniform3fv(U.cK, F.cK); gl.uniform3fv(U.cR, F.cR); gl.uniform3fv(U.cF, F.cF); gl.uniform3fv(U.cG, F.cG); gl.uniform3fv(U.cB, F.cB); }
    var mob = function () { return (cv.clientHeight || innerHeight) > (cv.clientWidth || innerWidth) * 1.05; };
    var satz = null, tex = {}, bereit = false, alive = true;
    function lade(s) {
      var Q = D[s] || D.d, n = 0, teile = ['key', 'rim', 'fill', 'glow', 'tiefe'], ein = ['tK', 'tR', 'tF', 'tG', 'tZ'];
      bereit = false; satz = s;
      teile.forEach(function (t, i) {
        var im = new Image(); im.onload = function () {
          if (!alive || satz !== s) return;
          gl.activeTexture(gl.TEXTURE0 + i); var tx = tex[t] || gl.createTexture(); tex[t] = tx; gl.bindTexture(gl.TEXTURE_2D, tx);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.uniform1i(U[ein[i]], i); if (t === 'key') gl.uniform2f(U.uI, im.width, im.height);
          if (++n === teile.length) { var fx = (Q.fx || [0, 0, .94]); gl.uniform3f(U.uF, fx[0], fx[1], fx[2]); bereit = true; size(); }
        }; im.src = Q[t];
      });
    }
    var scale = 1, dpr = 1;
    function size() { dpr = Math.max(.5, Math.min(devicePixelRatio || 1, 2, Math.sqrt(1.6e6 / ((cv.clientWidth || innerWidth) * (cv.clientHeight || innerHeight)))) * scale); cv.width = Math.max(2, Math.round((cv.clientWidth || innerWidth) * dpr)); cv.height = Math.max(2, Math.round((cv.clientHeight || innerHeight) * dpr)); gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U.uR, cv.width, cv.height); var s = mob() && D.m ? 'm' : 'd'; if (s !== satz) lade(s); }
    var M = [0, 0], tM = [0, 0], S = 0, tS = 0, t0 = performance.now() - 8000 * Math.random(), last = 0, fc = 0, fs0 = 0;
    function pm(e) { if (e.pointerType === 'touch') return; tM = [e.clientX / innerWidth - .5, e.clientY / innerHeight - .5]; }
    function rs() { var m = document.documentElement.scrollHeight - innerHeight; tS = m > 0 ? scrollY / m : 0; }
    addEventListener('pointermove', pm, { passive: true }); addEventListener('scroll', rs, { passive: true }); addEventListener('resize', size); rs();
    setF(); size();
    var slow = 0;
    function frame(now) {
      if (!alive) return; requestAnimationFrame(frame); if (document.hidden || !bereit) return;
      var raw = now - (last || now); if (raw > 70 && scale > .5) { if (++slow >= 2) { scale = Math.max(.5, scale * .8); size(); slow = 0; } } else slow = 0; var dt = Math.min(.05, (now - (last || now)) / 1000) || .016; last = now;
      M[0] += (tM[0] - M[0]) * (1 - Math.pow(.08, dt)); M[1] += (tM[1] - M[1]) * (1 - Math.pow(.08, dt)); S += (tS - S) * (1 - Math.pow(.1, dt));
      gl.uniform1f(U.uT, reduce ? 20 : (now - t0) / 1000); gl.uniform2f(U.uM, M[0], M[1]); gl.uniform1f(U.uS, S);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      fc++; if (!fs0) fs0 = now; if (now - fs0 > 400) { var fps = fc * 1000 / (now - fs0); fc = 0; fs0 = now; if (fps < 55 && scale > .5) { scale = Math.max(.5, scale * .85); size(); } }
    }
    requestAnimationFrame(frame);
    return { stop: function () { alive = false; removeEventListener('pointermove', pm); removeEventListener('scroll', rs); removeEventListener('resize', size); var e = gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); } };
  }
})();
