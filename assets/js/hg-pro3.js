/* HG-PRO 3 – sieben Oberflächen-Welten im Stil der Seite haeufele-webdesign.de (Häufele Webdesign, 10.11.2026).
   Prinzip der eigenen Seite (Knitterfolie 3D): mattschwarze, echte Oberfläche + wanderndes Streiflicht + Maus-Wölbung. Kein Foto, alles live berechnet.
   Erweitert window.HG_START (Ladereihenfolge: nach hg-pro2.js). Test: ?t=<Sekunde> friert die Zeit ein. */
(function () {
  'use strict';
  var alt = window.HG_START;
  var KOPF = [
    'uniform vec2 uR;uniform float uT;uniform vec2 uM;uniform vec3 uC,uG;',
    'float h1(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){return n2(p)*.5+n2(p*2.03+7.)*.27+n2(p*4.1+3.)*.14+n2(p*8.3)*.07;}',
    'vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}',
    'vec3 ausgabe(vec3 c,vec2 q){vec2 v=q-.5;c*=1.-dot(v,v)*.7;c=aces(c*1.05);c=pow(c,vec3(1./2.2));c+=(h1(gl_FragCoord.xy+fract(uT*3.)*97.)-.5)/255.*1.6;return c;}',
    /* Licht: wanderndes Hauptlicht (folgt der Maus) + Akzentlicht in Ihrer Farbe */
    'vec3 shade(vec3 n,vec2 p,float hg,vec3 alb,float rau,float spk,float lz,float t,vec2 m){',
    ' vec3 P=vec3(p,hg*.1);vec3 L1=vec3(.5*sin(t*.12)+m.x*.6,.22*cos(t*.1)+m.y*.45,lz);',
    ' vec3 l=L1-P;float d=length(l);l/=d;float att=1./(1.+d*d*2.4);',
    ' float df=max(dot(n,l),0.);float sp=pow(max(dot(n,normalize(l+vec3(0.,0.,1.))),0.),rau);',
    ' vec3 l2=normalize(vec3(-.9,.5,.3)-P);float d2=max(dot(n,l2),0.);',
    ' vec3 l3=normalize(vec3(.9,-.5,.3)-P);float d3=pow(max(dot(n,normalize(l3+vec3(0.,0.,1.))),0.),rau*.6);',
    ' return alb*(.035+df*att*1.5+d2*.07)+vec3(.95,.96,1.)*sp*att*spk*.8+uC*(d3*.2+pow(1.-n.z,2.)*.07);}',
    /* linke Seite dunkler (Headline lesbar), Handy gleichmäßig etwas dunkler */
    'float lesbar(vec2 p){float a=uR.x/uR.y;return a>1.05?mix(.5,1.,smoothstep(-.3,.1,p.x/a)):.85;}'
  ].join('\n');
  function nrm(e, k, bend) {
    return 'vec3 nrm(vec2 p){float e=' + e + ';float a=H(p+vec2(e,0.))-H(p-vec2(e,0.));float b=H(p+vec2(0.,e))-H(p-vec2(0.,e));' +
      'return normalize(vec3(-a/(2.*e)*' + k + '-p.x*' + (bend || '0.') + ',-b/(2.*e)*' + k + '-p.y*' + (bend || '0.') + ',1.));}';
  }
  function haupt(code) {
    return 'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;vec2 m=uM;float asp=uR.x/uR.y;\n' + code + '\n col*=lesbar(p);gl_FragColor=vec4(ausgabe(col,q),1.);}';
  }

  /* ---------- 1 KNITTERFOLIE: wenige große Knickfalten, flache Facetten, Glanz wandert von Facette zu Facette (Prinzip der Seite) ---------- */
  function folieFS() {
    return [KOPF, haupt([
      ' vec2 pp=p*2.7;vec2 g=vec2(0.);',
      ' for(int i=0;i<16;i++){float fi=float(i);float a=h1(vec2(fi,1.3))*3.14159+sin(t*.03+fi)*.04;vec2 dv=vec2(cos(a),sin(a));',
      '  float amp=(.30*pow(.87,fi)+.02);float fq=(.5+h1(vec2(fi,7.7))*1.3);float off=(h1(vec2(fi,3.1))-.5)*2.6+sin(t*.04+fi*1.7)*.1;',
      '  float w=(dot(pp,dv)-off)*fq;float fr=fract(w);g+=dv*amp*sign(fr-.5)*fq*1.5;}',
      ' vec2 dm=p-vec2(m.x*asp*.4,m.y*.4);float bump=exp(-dot(dm,dm)*6.);',
      ' vec2 gg=g*.5-dm*bump*.9;',
      ' vec3 n=normalize(vec3(-gg,1.));',
      ' vec3 col=shade(n,p,0.,vec3(.05,.052,.058),50.,1.1,.4,t,m);'].join('\n'))].join('\n');
  }

  /* ---------- 2 DÜNEN: Nachtsand, weiche lange Kämme im Streiflicht, einzelne Körner glitzern ---------- */
  function duenenFS() {
    return [KOPF,
      'float H(vec2 p){float s=fbm(p*.7+vec2(uT*.003,0.))*1.6;float c=1.-abs(sin(p.y*2.2+s*2.6+p.x*.5+uT*.008));return pow(c,1.5)*.6+fbm(p*9.)*.015;}',
      nrm('.004', '.5'),
      haupt([
        ' vec3 n=nrm(p);float hh=H(p);',
        ' vec3 alb=vec3(.040,.037,.036)+uC*.012;',
        ' vec3 col=shade(n,p,hh,alb,24.,.9,.2,t,m);',
        ' vec2 gk=floor(p*620.);float sk=step(.9965,h1(gk));col+=vec3(.9,.95,1.)*sk*.4*smoothstep(.15,.6,hh)*(.4+.6*sin(t*.9+h1(gk)*40.));'].join('\n'))].join('\n');
  }

  /* ---------- 3 CARBON ---------- */
  function karbonFS() {
    return [KOPF,
      'vec2 rt(vec2 p){float a=.35,c=cos(a),s=sin(a);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}',
      'float H(vec2 p){vec2 u=rt(p)*22.;vec2 id=floor(u),f=fract(u);float over=mod(id.x+id.y,2.);',
      ' float a=sin(f.y*3.14159)*(.35+.65*cos((f.x-.5)*3.14159));float b=sin(f.x*3.14159)*(.35+.65*cos((f.y-.5)*3.14159));',
      ' float fa=sin(f.y*60.)*.015,fb=sin(f.x*60.)*.015;return mix(b+fb,a+fa,over)*.6+.3*sin(p.x*1.6+uT*.05)*cos(p.y*1.3);}',
      nrm('.0016', '.05', '.35'),
      haupt([
        ' vec3 n=nrm(p);vec2 u=rt(p)*22.;float over=mod(floor(u).x+floor(u).y,2.);',
        ' vec3 col=shade(n,p,H(p),vec3(.016,.017,.020),34.,2.0,.34,t,m);',
        ' col*=.8+.4*over;'].join('\n'))].join('\n');
  }

  /* ---------- 4 BASALT: große Säulen, jede leicht gekippt und atmend, mattes Streiflicht ---------- */
  function basaltFS() {
    return [KOPF,
      'vec4 hexc(vec2 p){vec2 r=vec2(1.,1.7320508);vec2 h=r*.5;vec2 a=mod(p,r)-h;vec2 b=mod(p-h,r)-h;vec2 g=dot(a,a)<dot(b,b)?a:b;return vec4(g,p-g);}',
      haupt([
        ' vec4 hc=hexc(p*4.2+vec2(1.3,.4));vec2 g=hc.xy;vec2 id=hc.zw;float r=h1(id);',
        ' float edge=.5-max(dot(abs(g),normalize(vec2(1.,1.73))),abs(g.x));',
        ' float gap=smoothstep(.0,.035,edge);float bev=1.-smoothstep(.0,.1,edge);',
        ' vec2 tilt=(vec2(h1(id+3.),h1(id+8.))-.5)*.3+vec2(sin(t*.14+r*6.),cos(t*.12+r*5.))*.05;',
        ' vec2 mik=(vec2(n2(p*40.),n2(p*40.+9.))-.5)*.05;',
        ' vec3 n=normalize(vec3(tilt+normalize(g+vec2(1e-4))*bev*.55+mik,1.));',
        ' vec3 alb=vec3(.034,.035,.039)*(.7+.6*r);',
        ' vec3 col=shade(n,p,r,alb,18.,.5,.4,t,m);',
        ' col*=mix(.05,1.,gap);'].join('\n'))].join('\n');
  }

  /* ---------- 5 LAMELLEN: runde schwarze Lamellen drehen sich, dazwischen bricht Licht in Ihrer Farbe durch ---------- */
  function lamellenFS() {
    return [KOPF, haupt([
      ' float u=p.x*8.5;float id=floor(u);float f=fract(u)-.5;',
      ' float th=sin(t*.2+id*.35)*.8+m.x*.4*sin(id*.5+1.);',
      ' float wd=.44*abs(cos(th))+.05;float inS=1.-smoothstep(wd-.02,wd,abs(f));',
      ' vec3 nn=normalize(vec3(sin(th)+f*1.6/max(wd,.1)*.5,.0,cos(th)));',
      ' vec3 sl=shade(nn,p,0.,vec3(.022),30.,1.6,.5,t,m)*(.55+.8*smoothstep(-.5,.4,p.y));',
      ' sl+=mix(uC,vec3(1.),.3)*smoothstep(wd-.09,wd-.01,abs(f))*.22*(.3+.7*abs(sin(th*1.2+id)));',
      ' vec3 gapc=mix(uC,vec3(1.,.95,.9),.25)*(.05+.55*exp(-pow(p.y*1.6+.1,2.)*2.2))*(.5+.7*fbm(vec2(p.x*2.,p.y*2.+t*.05)));',
      ' vec3 col=mix(gapc,sl,inS);'].join('\n'))].join('\n');
  }

  /* ---------- 6 PUNKT-RELIEF ---------- */
  function punkteFS() {
    return [KOPF,
      'float H(vec2 p){vec2 d=p-vec2(uM.x*uR.x/uR.y*.4,uM.y*.4);return fbm(p*1.5+vec2(uT*.03,-uT*.02))*1.4+.6*exp(-dot(d,d)*5.)+.12*sin(length(p-vec2(.3,0.))*6.-uT*.5)*exp(-length(p)*1.1);}',
      nrm('.02', '.5'),
      haupt([
        ' float N=44.;vec2 g=p*N;vec2 id=floor(g);vec2 c=(id+.5)/N;float hc=H(c);',
        ' vec2 f=fract(g)-.5-(hc-.8)*.3*(m+vec2(.05,.12));',
        ' float r=.1+.32*smoothstep(.2,1.5,hc);float dt=1.-smoothstep(r-.07,r,length(f));',
        ' vec3 n=nrm(c);',
        ' vec3 col=shade(n,c,hc,vec3(.07),30.,1.4,.4,t,m)*dt;',
        ' col+=uC*dt*smoothstep(1.1,1.7,hc)*.2+vec3(.003);'].join('\n'))].join('\n');
  }

  /* ---------- 7 SAMT-VORHANG: schwerer schwarzer Samt hängt in tiefen Falten, Licht streift die Faltenkanten ---------- */
  function satinFS() {
    return [KOPF,
      'float H(vec2 p){float w=fbm(vec2(p.x*.8,p.y*.5+uT*.01))*1.1+sin(p.y*.9+uT*.06)*.25;',
      ' float f=sin(p.x*7.+w*2.4)*.5+sin(p.x*13.-w*1.8+1.3)*.22+sin(p.x*3.1+w)*.35;return f*.45;}',
      nrm('.003', '1.7'),
      haupt([
        ' vec3 n=nrm(p);float hh=H(p);',
        ' float rim=pow(1.-clamp(n.z,0.,1.),2.);',
        ' vec3 col=shade(n,p,hh,vec3(.012,.012,.018)+uC*.01,22.,.8,.34,t,m);',
        ' col+=mix(uC,vec3(1.),.35)*rim*.1*smoothstep(-.6,.3,p.y);',
        ' col*=.75+.35*smoothstep(-.6,.5,p.y);'].join('\n'))].join('\n');
  }

  var PRO3 = { foliepro: folieFS, duenenpro: duenenFS, karbonpro: karbonFS, basaltpro: basaltFS, lamellenpro: lamellenFS, punktepro: punkteFS, satinpro: satinFS };
  window.HG_PRO3 = PRO3;
  window.HG_START = function (cv, key, G, C, opt) {
    if (!PRO3[key]) return alt ? alt(cv, key, G, C, opt) : null;
    return start(cv, PRO3[key](), G, C, key);
  };

  function start(cv, fsrc, G, C, key) {
    var gl = null; try { gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, premultipliedAlpha: false, powerPreference: 'high-performance' }); } catch (e) { }
    if (!gl) return null;
    var hp = false; try { var pf = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT); hp = !!(pf && pf.precision > 0); } catch (e) { }
    function S(ty, src) { var o = gl.createShader(ty); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn('HG-PRO3 ' + key, gl.getShaderInfoLog(o)); return null; } return o; }
    var v = S(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'), f = S(gl.FRAGMENT_SHADER, 'precision ' + (hp ? 'highp' : 'mediump') + ' float;\n' + fsrc);
    if (!v || !f) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null; gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uR', 'uT', 'uM', 'uC', 'uG'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    gl.uniform3fv(U.uC, C.map(function (x) { return Math.pow(x, 2.2); })); gl.uniform3fv(U.uG, G);
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fest = null; try { var mt = /[?&]t=([\d.]+)/.exec(location.search); if (mt) fest = parseFloat(mt[1]); } catch (e) { }
    var schwer = /^(karbonpro|foliepro|basaltpro)$/.test(key);
    var scale = 1, run = true, raf = 0, t0 = performance.now(), mx = 0, my = 0, tx = 0, ty = 0, fc = 0, fs0 = 0;
    function size() {
      var wC = cv.clientWidth || innerWidth, hC = cv.clientHeight || innerHeight;
      var d = Math.max(.5, Math.min(devicePixelRatio || 1, 2, Math.sqrt((schwer ? 1.1e6 : 1.7e6) / (wC * hC))) * scale);
      cv.width = Math.max(2, Math.round(wC * d)); cv.height = Math.max(2, Math.round(hC * d));
      gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U.uR, cv.width, cv.height);
    }
    function mv(e) { tx = (e.clientX / innerWidth) * 2 - 1; ty = -((e.clientY / innerHeight) * 2 - 1); }
    var lastT = 0, slow = 0;
    function fr(now) {
      raf = 0; if (!run) return; if (fest === null) { if (lastT && now - lastT > 70 && scale > .5) { if (++slow >= 2) { scale = Math.max(.5, scale * .8); size(); slow = 0; } } else slow = 0; lastT = now; }
      mx += (tx - mx) * .035; my += (ty - my) * .035;
      gl.uniform1f(U.uT, fest !== null ? fest : (reduce ? 8 : (now - t0) / 1000 + 8)); gl.uniform2f(U.uM, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (fest === null) {
        fc++; if (!fs0) fs0 = now; if (now - fs0 > 400) { var fps = fc * 1000 / (now - fs0); fc = 0; fs0 = now; if (fps < 55 && scale > .5) { scale = Math.max(.5, scale * (fps < 36 ? .78 : .9)); size(); } }
        raf = requestAnimationFrame(fr);
      }
    }
    addEventListener('pointermove', mv, { passive: true }); addEventListener('resize', size);
    size(); raf = requestAnimationFrame(fr);
    return { stop: function () { run = false; cancelAnimationFrame(raf); removeEventListener('pointermove', mv); removeEventListener('resize', size); try { var e = gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); } catch (x) { } } };
  }
})();
