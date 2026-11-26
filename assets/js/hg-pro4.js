/* HG-PRO 4 – fünf Welten (Häufele Webdesign, 10.11.2026), Ersatz für die Material-Gruppe.
   Alles live im Shader berechnet, kein Foto. Erweitert window.HG_START (Ladereihenfolge: nach hg-pro3.js).
   Test: ?t=<Sekunde> friert die Zeit ein.
   netz4  Raumzeit-Gitter: leuchtendes Gitter, Schwerkraft-Mulden folgen der Maus
   punkt4 Punktwelle: Reihen aus tausenden Lichtpunkten in Perspektive, Welle + Maus-Ring
   orbit4 Orbit-Nebel: Nebel, geneigte Lichtbahnen, Chrom-Kugeln mit Studio-Spiegelung
   kaustik4 Kaustik-Tiefe: Lichtnetz wie unter Wasser, Lichtschächte, Schwebeteilchen
   fluss4 Fließendes Licht: gewundene Lichtbänder mit Perlmutt-Verlauf */
(function () {
  'use strict';
  var alt = window.HG_START;
  var KOPF = [
    'uniform vec2 uR;uniform float uT;uniform vec2 uM;uniform vec3 uC,uG;uniform float uHy;',
    'float h1(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){return n2(p)*.5+n2(p*2.03+7.)*.27+n2(p*4.1+3.)*.14+n2(p*8.3)*.07;}',
    'vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}',
    'vec3 ausgabe(vec3 c,vec2 q){vec2 v=q-.5;c*=1.-dot(v,v)*.7;c=aces(c*1.05);c=pow(c,vec3(1./2.2));c+=(h1(gl_FragCoord.xy+fract(uT*3.)*97.)-.5)/255.*1.6;return c;}',
    'vec2 heldPos(){float a=uR.x/uR.y;return a>1.05?vec2(min(.47,a*.5-.32),.0):vec2(0.,uHy);}',
    'vec3 rotX(vec3 v,float a){float c=cos(a),s=sin(a);return vec3(v.x,c*v.y-s*v.z,s*v.y+c*v.z);}',
    'vec3 rotZ(vec3 v,float a){float c=cos(a),s=sin(a);return vec3(c*v.x-s*v.y,s*v.x+c*v.y,v.z);}',
    /* linke Seite etwas dunkler, damit die Überschrift lesbar bleibt */
    'float lesbar(vec2 p){float a=uR.x/uR.y;return a>1.05?mix(.55,1.,smoothstep(-.3,.1,p.x/a)):.85;}'
  ].join('\n');
  function haupt(code) {
    return 'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;vec2 m=uM;float asp=uR.x/uR.y;\n' + code + '\n col*=lesbar(p);gl_FragColor=vec4(ausgabe(col,q),1.);}';
  }

  /* ---------- 1 RAUMZEIT-GITTER ---------- */
  function netzFS() {
    return [KOPF,
      'float Hh(vec2 x){vec2 c1=vec2(sin(uT*.15)*2.4+uM.x*3.,-6.+cos(uT*.1)*1.4+uM.y*2.);vec2 c2=vec2(-sin(uT*.12)*3.2,-9.5+sin(uT*.09)*1.2);vec2 c3=vec2(3.5+cos(uT*.08)*1.5,-12.);',
      ' vec2 d1=x-c1,d2=x-c2,d3=x-c3;return -1.05/(1.+dot(d1,d1)*.15)-.65/(1.+dot(d2,d2)*.2)-.5/(1.+dot(d3,d3)*.25);}',
      haupt([
        ' vec3 ro=vec3(0.,1.25,0.);vec3 rd=normalize(vec3(p.x*1.05,p.y*1.05+.02,-1.2));rd=rotX(rd,-.3);',
        ' vec3 col=vec3(.002,.002,.004);',
        ' col+=uC*.045*exp(-abs(rd.y+.02)*9.);',
        ' if(rd.y<-.012){',
        '  float hh=0.;float tt=(ro.y-hh)/(-rd.y);',
        '  for(int i=0;i<7;i++){vec3 ps=ro+rd*tt;hh=mix(hh,Hh(ps.xz),.7);tt=(ro.y-hh)/(-rd.y);}',
        '  vec3 ps=ro+rd*tt;vec2 g=ps.xz*.9;',
        '  vec2 f=abs(fract(g+.5)-.5);float w=.016+tt*.0042;',
        '  float ln=1.-smoothstep(0.,w,f.x);ln=max(ln,1.-smoothstep(0.,w,f.y));',
        '  float fog=exp(-tt*.075);float tief=clamp(-hh*1.5,0.,1.6);',
        '  vec3 lc=mix(uC,vec3(1.),.22+.5*tief*.5);',
        '  col+=lc*ln*(.3+tief*1.7)*fog;',
        '  col+=uC*(1.-ln)*.012*fog*(1.+tief*3.);',
        '  vec2 fi=floor(g+.5);float kn=1.-smoothstep(0.,w*2.4,length(fract(g+.5)-.5));',
        '  col+=vec3(1.)*kn*(.1+tief*.9)*fog;',
        ' }'].join('\n'))].join('\n');
  }

  /* ---------- 2 PUNKTWELLE ---------- */
  function punktFS() {
    return [KOPF,
      haupt([
        ' vec3 col=vec3(.002,.002,.003);',
        ' col+=uC*.05*exp(-abs(p.y-.14)*5.)+uC*.02*exp(-length(p-vec2(.2,.14))*2.);',
        ' for(int k=0;k<56;k++){',
        '  float kf=float(k)/55.;float nz=pow(kf,1.55);',
        '  float s=mix(.16,1.7,nz);float yb=mix(.16,-.62,pow(kf,1.35));',
        '  float cw=.17;float u=p.x/s+uM.x*0.;float id=floor(u/cw+.5);float cx=id*cw;float fx=u-cx;',
        '  float zk=float(k)*.7;',
        '  float hgt=sin(cx*1.9+t*.55+zk*.33)*.5+sin(cx*.9-zk*.5+t*.38)*.38+sin(cx*3.3+zk*.9-t*.7)*.14;',
        '  vec2 rp=vec2(cx-uM.x*asp*1.6,zk*.18-.9-uM.y*2.);float rl=length(rp);hgt+=sin(rl*3.6-t*2.2)*exp(-rl*.75)*.9;',
        '  float yd=yb+hgt*.13*s;',
        '  vec2 dv=vec2(fx*s,p.y-yd);float d=length(dv);',
        '  float r=.0042*s+.0007;',
        '  float core=1.-smoothstep(r*.55,r,d);float halo=exp(-d*d/(r*r*7.));',
        '  float fade=mix(.2,1.,nz)*smoothstep(0.,.08,kf);',
        '  float hi=clamp(hgt*.5+.5,0.,1.);',
        '  vec3 dc=mix(uC*.55,mix(uC,vec3(1.),.7),pow(hi,2.2));',
        '  col+=dc*(core*1.5+halo*.32)*fade*(.55+.9*hi);',
        ' }'].join('\n'))].join('\n');
  }

  /* ---------- 3 ORBIT-NEBEL ---------- */
  function orbitFS() {
    return [KOPF,
      'vec3 W2L(vec3 v){return rotX(rotZ(v,-.38),-1.12);}',
      'vec3 L2W(vec3 v){return rotZ(rotX(v,1.12),.38);}',
      haupt([
        ' vec2 om=heldPos()-(asp>1.05?vec2(0.):vec2(0.,.09));float sk=asp>1.5?.78:(asp>1.05?.54:.46);',
        ' vec3 ro=vec3(0.,0.,4.6);vec3 rd=normalize(vec3((p-om)/sk,-2.2));',
        ' float nb=fbm(p*1.3+vec2(t*.012,-t*.008));float nb2=fbm(p*2.4+8.+vec2(-t*.01,t*.006));',
        ' vec3 col=uC*pow(nb,3.6)*.3+mix(uC,vec3(.35,.45,1.),.55)*pow(nb2,4.)*.16+vec3(.002,.002,.005);',
        ' col+=uC*.07*exp(-length(p-om)*2.8);',
        ' float stern=step(.9965,h1(floor(p*vec2(420.,420.))));col+=vec3(.8)*stern*.35*(.5+.5*sin(t+p.x*40.));',
        ' vec3 rol=W2L(ro),rdl=W2L(rd);',
        ' if(abs(rdl.y)>.0001){float tt=-rol.y/rdl.y;if(tt>0.){vec3 hp=rol+rdl*tt;float rr=length(hp.xz);',
        '  vec2 dir=hp.xz/max(rr,.0001);float br=.5+.5*dot(dir,vec2(cos(t*.18),sin(t*.18)));',
        '  for(int i=0;i<3;i++){float R=.9+float(i)*.55;float dd=(rr-R);',
        '   float ln=exp(-dd*dd/(.0009+tt*.00005));float ha=exp(-dd*dd/.05)*.12;',
        '   col+=mix(uC,vec3(1.),.45)*ln*(.25+br*1.1)+uC*ha*(.3+br);}}}',
        ' float best=1e9;',
        ' for(int i=0;i<5;i++){float fi=float(i);float md=mod(fi,3.);float R=.9+md*.55;',
        '  float sg=mod(fi,2.)>.5?1.:-1.;float a=t*(.24-md*.05)*sg+fi*1.9;',
        '  vec3 c=L2W(vec3(cos(a)*R,0.,sin(a)*R));float rs=.13+.045*mod(fi*1.7,3.);',
        '  vec3 oc=ro-c;float b=dot(oc,rd);float d2=dot(oc,oc)-b*b;float cc=dot(oc,oc)-rs*rs;float ds=b*b-cc;',
        '  col+=mix(uC,vec3(1.),.3)*.0085/(d2+.012);',
        '  if(ds>0.){float tt=-b-sqrt(ds);if(tt>0.&&tt<best){best=tt;vec3 x=ro+rd*tt;vec3 n=normalize(x-c);vec3 rf=reflect(rd,n);',
        '   float box=pow(max(dot(rf,normalize(vec3(.35,.85,.4))),0.),22.)*2.6;',
        '   float strip=smoothstep(.55,.62,rf.x)*smoothstep(.95,.7,rf.x)*smoothstep(-.2,.5,rf.y)*.9;',
        '   float fres=.06+.94*pow(1.-max(dot(n,-rd),0.),4.);',
        '   vec3 env=vec3(1.,.98,.95)*(box+strip)+uC*(.06+1.2*pow(max(-rf.y,0.),3.))+vec3(.004);',
        '   col=env*(.14+.95*fres)+vec3(.004);}}}'].join('\n'))].join('\n');
  }

  /* ---------- 4 KAUSTIK-TIEFE ---------- */
  function kaustikFS() {
    return [KOPF,
      'float vor(vec2 x,float tt){vec2 i=floor(x),f=fract(x);float d1=8.,d2=8.;',
      ' for(int a=-1;a<=1;a++){for(int b=-1;b<=1;b++){vec2 g=vec2(float(a),float(b));vec2 o=vec2(h1(i+g),h1(i+g+17.3));o=.5+.5*sin(tt+6.28318*o);vec2 r=g+o-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}}',
      ' return sqrt(d2)-sqrt(d1);}',
      haupt([
        ' vec2 pp=p+vec2(uM.x*.1,uM.y*.07);',
        ' vec2 wr=vec2(fbm(pp*1.6+t*.05),fbm(pp*1.6+4.1-t*.04))-.5;',
        ' vec2 w1=pp*3.1+wr*1.5;vec2 w2=vec2(pp.x*.8-pp.y*.6,pp.x*.6+pp.y*.8)*4.4+wr*1.9+7.;',
        ' float e1=vor(w1,t*.45),e2=vor(w2,-t*.38+2.);',
        ' float c1=exp(-e1*7.5),c2=exp(-e2*7.5);',
        ' float ca=pow(c1*.55+c2*.55,1.6)+c1*c2*.9;',
        ' vec3 tint=mix(uC,vec3(1.),.3);',
        ' float tief=smoothstep(-.6,.55,p.y);',
        ' vec3 col=vec3(.002,.004,.006)+uC*.02*tief;',
        ' col+=tint*ca*(.07+.5*tief)*mix(.55,1.,smoothstep(-.35,.15,p.x/asp));',
        ' float ang=p.x*.9+p.y*.6;float strahl=fbm(vec2(ang*7.,t*.04))*smoothstep(-.1,.6,p.y)*smoothstep(1.6,.1,length(p-vec2(.25,.7)));',
        ' col+=uC*pow(strahl,2.)*.22;',
        ' for(int l=0;l<3;l++){float fl=float(l);float sc=34.+fl*26.;vec2 g=p*sc+vec2(fl*7.3,-t*(.5+fl*.3)*.8);',
        '  vec2 id=floor(g);vec2 f=fract(g)-.5;vec2 o=vec2(h1(id+fl)-.5,h1(id+3.7+fl)-.5)*.6;float d=length(f-o);',
        '  float on=step(.82,h1(id+9.1+fl))*(.5+.5*sin(t*.8+h1(id)*30.));col+=tint*exp(-d*d*60.)*on*.5*(.5+tief);}'].join('\n'))].join('\n');
  }

  /* ---------- 5 FLIESSENDES LICHT ---------- */
  function flussFS() {
    return [KOPF,
      haupt([
        ' vec2 pp=p*1.05+vec2(uM.x*.25,uM.y*.2);float tt=t*.05;',
        ' vec2 qq=vec2(fbm(pp+tt),fbm(pp+vec2(5.2,1.3)-tt*.8));',
        ' vec2 rr=vec2(fbm(pp*1.1+3.2*qq+vec2(1.7,9.2)+tt*1.3),fbm(pp*1.1+3.2*qq+vec2(8.3,2.8)-tt));',
        ' float f=fbm(pp+3.5*rr);',
        ' float ridge=1.-abs(2.*f-1.);float core=pow(ridge,26.);float soft=pow(ridge,8.);',
        ' vec3 irid=.5+.5*cos(6.28318*(vec3(0.,.33,.67)*.22+f*1.4+length(qq)*.7));',
        ' vec3 tint=mix(uC,irid*irid*1.2,.38);',
        ' vec3 col=tint*soft*.5+mix(tint,vec3(1.),.6)*core*2.4;',
        ' col*=.25+1.2*smoothstep(.2,.95,length(rr));',
        ' col+=vec3(.003,.003,.005);'].join('\n'))].join('\n');
  }

  var PRO4 = { netz4: netzFS, punkt4: punktFS, orbit4: orbitFS, kaustik4: kaustikFS, fluss4: flussFS };
  window.HG_PRO4 = PRO4;
  window.HG_START = function (cv, key, G, C, opt) {
    if (!PRO4[key]) return alt ? alt(cv, key, G, C, opt) : null;
    return start(cv, PRO4[key](), G, C, key);
  };

  function start(cv, fsrc, G, C, key) {
    var gl = null; try { gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, premultipliedAlpha: false, powerPreference: 'high-performance' }); } catch (e) { }
    if (!gl) return null;
    var hp = false; try { var pf = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT); hp = !!(pf && pf.precision > 0); } catch (e) { }
    function S(ty, src) { var o = gl.createShader(ty); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn('HG-PRO4 ' + key, gl.getShaderInfoLog(o)); return null; } return o; }
    var v = S(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'), f = S(gl.FRAGMENT_SHADER, 'precision ' + (hp ? 'highp' : 'mediump') + ' float;\n' + fsrc);
    if (!v || !f) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null; gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uR', 'uT', 'uM', 'uC', 'uG', 'uHy'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    gl.uniform1f(U.uHy, (cv.closest && cv.closest('.sv, .st-frame')) ? -.2 : .22);
    gl.uniform3fv(U.uC, C.map(function (x) { return Math.pow(x, 2.2); })); gl.uniform3fv(U.uG, G);
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fest = null; try { var mt = /[?&]t=([\d.]+)/.exec(location.search); if (mt) fest = parseFloat(mt[1]); } catch (e) { }
    var schwer = /^(orbit4|punkt4|netz4|kaustik4)$/.test(key);
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
