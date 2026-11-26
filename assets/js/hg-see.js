/* Hintergrund-Welt „See bei Nacht“ (Harzerhof, Gurrensee): Wasser-Shader vom Harzerhof, bei Nacht eingefärbt.
   Textur: assets/js/see-wasser-v2.js (window.LAKE_TEX / LAKE_TEX_P). Wellen: Zufallstropfen + Maus. Erweitert window.HG_START um 'see'. */
(function () {
  'use strict';
  window.HG_SEE = 1;
  var alt = window.HG_START;
  function ladeTex(fertig) {
    if (window.LAKE_TEX) return fertig();
    var s = document.createElement('script'); s.src = 'assets/js/see-wasser-v2.js'; s.onload = fertig; s.onerror = fertig; document.head.appendChild(s);
  }
  window.HG_START = function (cv, key, G, C, opt) {
    if (key !== 'see') return alt ? alt(cv, key, G, C, opt) : null;
    var lebt = true, inner = null;
    ladeTex(function () { if (lebt) inner = start(cv, G, C); });
    return { stop: function () { lebt = false; if (inner) inner.stop(); } };
  };
  function start(cv, G, C) {
    if (!window.LAKE_TEX) return null;
    var gl = null; try { gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, premultipliedAlpha: false }); } catch (e) { }
    if (!gl) return null;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = 'precision mediump float;uniform sampler2D tx;uniform vec2 r,ir;uniform float t;uniform vec3 ac,gr;uniform vec4 rp[6];' +
      'float hh(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}' +
      'void main(){vec2 fc=gl_FragCoord.xy/r;fc.y=1.-fc.y;float ca=r.x/r.y,ia=ir.x/ir.y;vec2 uv=fc;' +
      'if(ca>ia)uv.y=(fc.y-.5)*ia/ca+.5;else uv.x=(fc.x-.5)*ca/ia+.5;' +
      'float w=smoothstep(.52,.6,uv.y);vec2 d=vec2(0.);' +
      'd.x+=(sin(uv.y*150.+t*1.5)*.0024+sin(uv.y*55.-t*1.1+uv.x*7.)*.002)*w;d.y+=sin(uv.x*28.+t*.8)*.0014*w;' +
      'for(int i=0;i<6;i++){vec2 q=fc-rp[i].xy;q.x*=ca;float dist=length(q),age=t-rp[i].z;if(age<0.||age>4.)continue;float rad=age*.16;' +
      'float ring=exp(-pow((dist-rad)*34.,2.))*rp[i].w*exp(-age*1.1);d+=normalize(q+1e-5)*ring*.022*(.35+.65*w);}' +
      'vec3 c=texture2D(tx,clamp(uv+d,0.,1.)).rgb;float lu=dot(c,vec3(.3,.59,.11));' +
      /* Nacht: Foto nur als Form – Helligkeit stark abgesenkt, kühles Mondlicht, Akzentfarbe nur im Glanz */
      'float l2=pow(lu,1.9);vec3 n=vec3(.20,.27,.46)*l2*1.5+gr*.9;n+=ac*smoothstep(.45,.95,lu)*.30*(1.-uv.y*.6);' +
      'float sky=1.-smoothstep(.0,.56,uv.y);' +
      'vec2 cell=floor(uv*vec2(900.,420.));float sn=hh(cell);float st=step(.9972,sn)*sky*(.45+.55*sin(t*1.7+sn*90.));n+=vec3(.8,.85,1.)*st*.9;' +
      'vec2 c2=floor(uv*vec2(1100.,380.));float n2=hh(c2);float sp=smoothstep(.975,1.,n2)*pow(max(0.,sin(t*2.2+n2*60.)),6.)*smoothstep(.2,.7,lu)*w;n+=mix(vec3(.75,.8,1.),ac,.45)*sp*.55;' +
      'float ringl=0.;for(int i=0;i<6;i++){vec2 q=fc-rp[i].xy;q.x*=ca;float age=t-rp[i].z;if(age<0.||age>4.)continue;ringl+=exp(-pow((length(q)-age*.16)*40.,2.))*rp[i].w*exp(-age*1.3);}n+=ac*ringl*.35*w;' +
      'vec2 v=fc-.5;n*=1.-dot(v,v)*.9;n+=(hh(gl_FragCoord.xy+fract(t*7.)*91.)-.5)*.012;' +
      'n=n/(1.+n*.25);n=pow(n,vec3(.95));gl_FragColor=vec4(n,1.);}';
    function S(ty, src) { var o = gl.createShader(ty); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn('SEE', gl.getShaderInfoLog(o)); return null; } return o; }
    var v = S(gl.VERTEX_SHADER, vs), f = S(gl.FRAGMENT_SHADER, fs); if (!v || !f) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null; gl.useProgram(pr);
    var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = function (n) { return gl.getUniformLocation(pr, n); };
    var uR = U('r'), uIR = U('ir'), uT = U('t'), uAc = U('ac'), uGr = U('gr'), uRP = U('rp');
    var RP = new Float32Array(24), ri = 0, t0 = performance.now(), iw = 1, ih = 1, ok = false, run = true, raf = 0, lq = 1, lt0 = 0, lacc = 0, ln = 0;
    for (var i = 0; i < 6; i++) RP[i * 4 + 2] = -99;
    var al = C.map(function (x) { return Math.pow(x, 2.2) * 1.8; });
    gl.uniform3f(uAc, al[0], al[1], al[2]); gl.uniform3f(uGr, G[0] * .5, G[1] * .5, G[2] * .5);
    function size() { var d = Math.min(devicePixelRatio || 1, 1.5) * lq; cv.width = Math.max(2, cv.clientWidth * d); cv.height = Math.max(2, cv.clientHeight * d); gl.viewport(0, 0, cv.width, cv.height); }
    var tex = new Image();
    tex.onload = function () {
      try {
        var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, tex); iw = tex.width; ih = tex.height; ok = true;
        if (!raf) raf = requestAnimationFrame(fr);
      } catch (e) { }
    };
    tex.src = (cv.clientHeight > cv.clientWidth * 1.15 && window.LAKE_TEX_P) ? window.LAKE_TEX_P : window.LAKE_TEX;
    function drop(x, y, s) { var r = cv.getBoundingClientRect(); if (!r.width) return; RP[ri * 4] = (x - r.left) / r.width; RP[ri * 4 + 1] = (y - r.top) / r.height; RP[ri * 4 + 2] = (performance.now() - t0) / 1000; RP[ri * 4 + 3] = s; ri = (ri + 1) % 6; }
    function fr() {
      raf = 0; if (!run || !ok) return; var now = performance.now();
      if (lt0) { lacc += now - lt0; ln++; if (ln >= 40) { if (lacc / ln > 24 && lq > .5) { lq *= .72; size(); } lacc = 0; ln = 0; } } lt0 = now;
      gl.uniform2f(uR, cv.width, cv.height); gl.uniform2f(uIR, iw, ih); gl.uniform1f(uT, reduce ? 3 : (now - t0) / 1000); gl.uniform4fv(uRP, RP);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); raf = requestAnimationFrame(fr);
    }
    var last = 0;
    function mv(e) { var n = performance.now(); if (n - last > 110) { last = n; drop(e.clientX, e.clientY, .8); } }
    window.addEventListener('pointermove', mv, { passive: true });
    var iv = setInterval(function () { var r = cv.getBoundingClientRect(); drop(r.left + r.width * (.15 + Math.random() * .7), r.top + r.height * (.62 + Math.random() * .3), .5 + Math.random() * .4); }, 1300);
    size(); window.addEventListener('resize', size);
    return { stop: function () { run = false; cancelAnimationFrame(raf); clearInterval(iv); window.removeEventListener('pointermove', mv); window.removeEventListener('resize', size); try { var e = gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); } catch (x) { } } };
  }
})();
