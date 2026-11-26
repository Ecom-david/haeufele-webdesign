/* HG-PRO – Premium-Hintergründe in Echtzeit (Häufele Webdesign, 10.11.2026).
   Kein Foto, keine Textur: jede Welt wird pro Bildpunkt live berechnet (echtes 3D-Licht, Fresnel,
   Lichtspaltung an Glanzkanten, Tiefenunschärfe) – dadurch in jeder Auflösung gestochen scharf (auch 4K/Retina).
   Erweitert window.HG_START um die Schlüssel in PRO. Test: ?t=<Sekunde> friert die Zeit ein. */
(function () {
  'use strict';
  var alt = window.HG_START;

  /* ---------- gemeinsamer Shader-Kopf ---------- */
  var KOPF = [
    'uniform vec2 uR;uniform float uT;uniform vec2 uM;uniform vec3 uC,uG;uniform float uHy;',
    'float h1(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}',
    'vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}',
    'vec3 ausgabe(vec3 c,vec2 q){vec2 v=q-.5;c*=1.-dot(v,v)*.7;c=aces(c*1.05);c=pow(c,vec3(1./2.2));c+=(h1(gl_FragCoord.xy+fract(uT*3.)*97.)-.5)/255.*1.6;return c;}'
  ].join('\n');

  /* ---------- Bänder-Feld (Lack, Seide, Chrom, Clair) ----------
     Eine dicke, gefaltete Fläche strömt diagonal. Licht: Softbox oben links (Streifen), Gegenlicht unten rechts,
     Fresnel-Glanz. Lichtspaltung: Glanz wird je Farbkanal mit leicht anderer Normalen gerechnet -> Violett/Bernstein-Säume. */
  function baenderFS(o) {
    return [KOPF,
      'float H(vec2 p,float t){',
      ' vec2 d=normalize(vec2(1.,-' + o.neig + '));vec2 n=vec2(-d.y,d.x);',
      ' float a=dot(p,d),b=dot(p,n);',
      ' float w=n2(vec2(a*.8-t*.045,b*.7))*1.2+n2(vec2(a*1.9+t*.03,b*1.6+3.))*.45;',
      ' float s=b*' + o.dichte + '*(.8+.45*n2(vec2(a*.6+t*.02,1.)))+sin(a*1.3-t*.1+w*1.1)*1.1+w*1.5+a*.35;',
      ' float id=floor(s);float u=fract(s);float br=.5+.48*h1(vec2(id,3.));',
      ' float x=clamp((u-.5)/(.5*br),-1.,1.);',
      ' float tube=sqrt(max(1.-x*x,0.))*(.75+.25*sin(id*1.7+a*2.-t*.08));',  /* runder Querschnitt = dickes Band */
      ' float lage=h1(vec2(id,9.))*.5;',  /* Bänder liegen verschieden hoch -> Überlappung */
      ' return (tube+lage)*' + o.falte + ';}',
      'vec3 N(vec2 p,float t,float amp){float e=1.5/uR.y;float c=H(p,t);',
      ' return normalize(vec3(-(H(p+vec2(e,0.),t)-c)/e*amp,-(H(p+vec2(0.,e),t)-c)/e*amp,1.));}',
      'float box(vec3 r,vec3 l,float w,float sh){vec3 x=normalize(cross(l,vec3(0.,0.,1.)));float u=dot(r,x);float v=dot(r,l);',
      ' return smoothstep(1.-w,1.-w*.35,v)*smoothstep(.55,.15,abs(u))*sh;}',
      'vec3 licht(vec3 n,vec2 m){vec3 r=reflect(vec3(0.,0.,-1.),n);',
      ' vec3 l1=normalize(vec3(-.55+m.x*.25,.62+m.y*.2,.56));vec3 l2=normalize(vec3(.7,-.45,.55));vec3 l3=normalize(vec3(.1,.95,.3));',
      ' float k=box(r,l1,' + o.boxw + ',1.)+pow(max(dot(r,l1),0.),180.)*1.6;',
      ' float g=pow(max(dot(r,l2),0.),' + o.rimexp + ');float o3=pow(max(dot(r,l3),0.),40.)*.35;',
      ' return vec3(k,g,o3);}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;',
      ' float t=uT;vec2 m=uM;p+=m*vec2(.025,.018);',
      ' float tief=smoothstep(-.6,.7,p.y*.6-p.x*.25);', /* oben/links weiter weg -> weicher */
      ' float amp=mix(' + o.amp + ',' + o.amp + '*.55,tief);',
      ' vec3 n=N(p,t,amp);',
      ' vec3 nR=normalize(vec3(n.xy*' + (1 + o.spalt) + ',n.z));vec3 nB=normalize(vec3(n.xy*' + (1 - o.spalt) + ',n.z));',
      ' vec3 LG=licht(n,m),LR=licht(nR,m),LB=licht(nB,m);',
      ' float fr=.04+.96*pow(1.-n.z,5.);',
      ' float dif=max(dot(n,normalize(vec3(-.4,.5,.75))),0.);',
      ' float hh=H(p,t);float ao=.12+.88*smoothstep(0.,.09,hh);',
      ' vec3 koerper=' + o.koerper + ';vec3 glanz=' + o.glanz + ';vec3 rim=' + o.rim + ';vec3 spalt1=' + o.s1 + ';vec3 spalt2=' + o.s2 + ';',
      ' float pool=smoothstep(1.25,.1,length((p-vec2(-.15+m.x*.08,.12+m.y*.06))*vec2(.75,1.)));',  /* Lichtkegel: Mitte hell, Ränder fallen ins Dunkel */
      ' vec3 col=koerper*(.08+.55*dif)*ao*(.35+.65*pool);',
      ' float breit=pow(max(dot(reflect(vec3(0.,0.,-1.),n),normalize(vec3(-.45,.55,.7))),0.),9.);',  /* breiter Satin-Schimmer */
      ' col+=glanz*breit*.28*ao*pool;',
      ' vec3 kg=vec3(LR.x,LG.x,LB.x);',
      ' col+=glanz*kg*(.8+fr*3.4)*mix(1.,.5,tief)*(.4+.6*pool);',
      ' col+=spalt1*max(LR.x-LB.x,0.)*3.+spalt2*max(LB.x-LR.x,0.)*3.;',
      ' float kantenlicht=pow(clamp(dot(normalize(n.xy+1e-4),normalize(vec2(.85,-.55))),0.,1.),3.)*pow(1.-n.z,1.3);',
      ' col+=rim*(LG.y*(.7+fr*3.)+kantenlicht*' + o.rimk + ')*ao*(.45+.55*pool);',
      ' col+=glanz*LG.z*ao*.6;',
      ' col+=koerper*fr*.5;',
      ' col=mix(col,uG*1.2+koerper*.15,tief*.35);',
      ' gl_FragColor=vec4(ausgabe(col,q),1.);}'].join('\n');
  }

  /* ---------- Glas-Prisma-Objekt (Clair-Held) über dem Bänder-Feld ----------
     Raymarching eines facettierten Prismas (Blitz oder Kristall); Brechung je Farbkanal (echte Dispersion),
     innere Reflexion, Fresnel-Spiegelung der Softboxen. Hintergrund wird an der gebrochenen Stelle neu berechnet. */
  function objektFS(o, form) {
    var bg = baenderFS(o).replace('void main(){', 'vec3 feld(vec2 p,float t,vec2 m){').replace(' gl_FragColor=vec4(ausgabe(col,q),1.);}', ' return col;}')
      .replace('vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;', '').replace(' float t=uT;vec2 m=uM;p+=m*vec2(.025,.018);', ' p+=m*vec2(.025,.018);');
    var sdf = form === 'blitz' ? [
      'float sdPoly(vec2 p){', /* Blitz-Umriss, 8 Ecken */
      ' vec2 v[8];v[0]=vec2(.10,.62);v[1]=vec2(-.28,-.02);v[2]=vec2(-.02,-.02);v[3]=vec2(-.16,-.62);v[4]=vec2(.30,.10);v[5]=vec2(.04,.10);v[6]=vec2(.22,.62);v[7]=vec2(.10,.62);',
      ' float d=dot(p-v[0],p-v[0]);float s=1.;',
      ' for(int i=0;i<7;i++){vec2 a=v[i],b=v[i+1];vec2 e=b-a,w=p-a;vec2 bb=w-e*clamp(dot(w,e)/dot(e,e),0.,1.);d=min(d,dot(bb,bb));',
      '  bvec3 c=bvec3(p.y>=a.y,p.y<b.y,e.x*w.y>e.y*w.x);if(all(c)||all(not(c)))s*=-1.;}',
      ' return s*sqrt(d);}',
      'float sdf(vec3 p){float d2=sdPoly(p.xy);float dz=abs(p.z)-.085;vec2 w=vec2(d2,dz);',
      ' return min(max(w.x,w.y),0.)+length(max(w+.035,0.))-.035;}'
    ].join('\n') : [
      'float sdf(vec3 p){', /* geschliffener Kristall: Oktaeder-Spitzen + Facetten */
      ' p.y*=.72;vec3 a=abs(p);float d=(a.x+a.y+a.z-.42)*.577;',
      ' d=max(d,max(a.x,a.z)*1.05-.26);',
      ' d=max(d,(a.x*.85+a.z*.5+a.y*.35-.34));',
      ' return d*.9;}'
    ].join('\n');
    return [bg, sdf,
      'mat3 rot(float a,float b){float ca=cos(a),sa=sin(a),cb=cos(b),sb=sin(b);return mat3(ca,0.,sa,0.,1.,0.,-sa,0.,ca)*mat3(1.,0.,0.,0.,cb,-sb,0.,sb,cb);}',
      'vec3 nrm(vec3 p){vec2 e=vec2(.0012,0.);return normalize(vec3(sdf(p+e.xyy)-sdf(p-e.xyy),sdf(p+e.yxy)-sdf(p-e.yxy),sdf(p+e.yyx)-sdf(p-e.yyx)));}',
      'vec3 umg(vec3 r){', /* Studio-Umgebung für Glas-Spiegelungen: zwei lange Softboxen + warmes Gegenlicht */
      ' float a=smoothstep(.35,.42,r.y)*smoothstep(.95,.7,r.y)*smoothstep(.75,.2,abs(r.x+.35));',
      ' float b=smoothstep(.55,.62,r.x)*smoothstep(.2,-.1,abs(r.y-.05)-.25);',
      ' return ' + o.glanz + '*a*3.2+' + o.rim + '*b*2.6+' + o.koerper + '*.4;}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;vec2 m=uM;',
      ' float asp=uR.x/uR.y;vec2 om=asp>1.05?vec2(min(' + o.ox + ',asp*.5-.30),' + o.oy + '):vec2(.0,uHy);float sk=asp>1.05?.68:.60;', /* Objekt rechts, auf Handy oben mittig */
      ' vec3 ro=vec3(0.,0.,3.2);vec3 rd=normalize(vec3((p-om)/sk,-2.4));',
      ' mat3 R=rot(-.55+sin(t*.17)*.16+m.x*.35,.22+cos(t*.13)*.08-m.y*.25);',
      ' mat3 Ri=mat3(R[0][0],R[1][0],R[2][0],R[0][1],R[1][1],R[2][1],R[0][2],R[1][2],R[2][2]);',
      ' vec3 o=Ri*ro,d=Ri*rd;o.y-=sin(t*.4)*.02;float tt=0.;float hit=0.;float dmin=9.,tmin=0.;',
      ' for(int i=0;i<80;i++){float h=sdf(o+d*tt);if(h<dmin&&tt>1.){dmin=h;tmin=tt;}if(h<.0006){hit=1.;break;}tt+=h;if(tt>6.)break;}',
      ' float px=1.4/(uR.y*.42*sk);float cov=hit>.5?1.:1.-smoothstep(0.,px*tmin,dmin);if(hit<.5&&cov>0.){tt=tmin;}',
      ' vec3 col=feld(p,t,m);',
      ' float sch=smoothstep(.7,0.,length((p-om-vec2(.05,-.42))*vec2(1.,3.)));col*=1.-.35*sch;', /* weicher Schatten im Strom */
      ' if(cov>0.){vec3 x=o+d*tt;vec3 n=nrm(x);float fr=.04+.96*pow(1.-max(dot(-d,n),0.),5.);',
      '  vec3 sp=umg(R*reflect(d,n));vec3 dur=vec3(0.);',
      '  float ior[3];ior[0]=1.47;ior[1]=1.52;ior[2]=1.58;',
      '  for(int c=0;c<3;c++){vec3 rr=refract(d,n,1./ior[c]);vec3 y=x+rr*.02;float s=0.;',
      '   for(int j=0;j<28;j++){float h=-sdf(y+rr*s);if(h<.001)break;s+=max(h,.004);}',
      '   vec3 z=y+rr*s;vec3 n2=-nrm(z);vec3 aus=refract(rr,n2,ior[c]);if(dot(aus,aus)<.01)aus=reflect(rr,n2);',
      '   vec3 wr=R*aus;vec2 bp=p+wr.xy*.32;vec3 f=feld(bp,t,m)*1.6+umg(wr)*.9;', /* gebrochener Blick auf den Strom */
      '   float ab=exp(-s*' + o.absorb + ');',
      '   if(c==0)dur.r=f.r*ab;else if(c==1)dur.g=f.g*ab;else dur.b=f.b*ab;}',
      '  vec3 kern=' + o.kern + '*.55*pow(max(1.-length(x.xy)*2.2,0.),5.)*(.75+.25*sin(t*.6));',
      '  vec3 glas=mix(dur*' + o.toenung + ',sp,fr)+kern;',
      '  float kante=pow(1.-abs(dot(d,n)),3.);glas+=' + o.glanz + '*kante*.25;',
      '  col=mix(col,glas,cov);}',
      ' gl_FragColor=vec4(ausgabe(col,q),1.);}'].join('\n');
  }

  /* ---------- Goldene Funken in drei Tiefen (Harzerhof-Prinzip, neu) ----------
     Echte Tiefenunschärfe je Ebene (Bokeh-Scheiben vorn, scharfe Funken in der Mitte, Staub hinten),
     Funken steigen, flackern, werden von der Maus seitlich weggeweht. Darunter eine langsame Lichtwolke. */
  function funkenFS() {
    return [KOPF,
      'vec3 ebene(vec2 p,float z,float t,vec2 m){vec2 g=p*z;g.y-=t*.035*z;g.x+=sin(g.y*.7+t*.2)*.15+m.x*.06*z;',
      ' vec2 id=floor(g*3.);vec2 f=fract(g*3.)-.5;vec3 c=vec3(0.);',
      ' for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 k=id+o;float r=h1(k*1.31+z);',
      '  if(r>(z<1.2?.86:.6)){vec2 pos=o+vec2(h1(k+3.1),h1(k+7.7))-.5-f;pos.y*=z>1.2&&z<3.?.45:1.;float sz=.006+.014*h1(k+9.)*(z<1.2?2.2:1.);',
      '  float bl=z<1.2?.6:(z>3.?.25:.04);float d=length(pos);',
      '  float a=smoothstep(sz+bl*sz*6.,sz*(1.-bl*.5),d);float fl=.55+.45*sin(t*(1.+r*3.)+r*40.);',
      '  float ring=0.;',
      '  float halo=exp(-d*d/(sz*sz*7.))*.22;c+=uC*(a+halo)*fl*(z<1.2?.10:(z>3.?.35:1.6))*(1.+4.*smoothstep(sz*.6,0.,d)*(z>1.2&&z<3.?1.:0.));}}',
      ' return c;}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;vec2 m=uM;',
      ' vec2 w=p*1.3;float wo=n2(w*1.2+vec2(t*.02,-t*.03))*.6+n2(w*2.7-t*.04)*.3+n2(w*5.)*.1;',
      ' vec3 col=uG*.35+uC*.04*pow(wo,2.6)*smoothstep(.9,-.6,p.y);',
      ' col+=uC*.03*pow(smoothstep(1.2,0.,length(p-vec2(.55,-.6))),2.);',
      ' col+=ebene(p,4.2,t,m)+ebene(p+7.,2.1,t,m)+ebene(p+13.,.8,t,m);',
      ' gl_FragColor=vec4(ausgabe(col,q),1.);}'].join('\n');
  }

  /* Paletten. Platzhalter ACC wird durch die Akzentfarbe (linear) ersetzt. */
  var CLAIR = { koerper: 'vec3(.020,.015,.075)', glanz: 'vec3(.70,.60,1.35)', rim: 'vec3(1.35,.58,.12)', s1: 'vec3(1.,.42,.08)', s2: 'vec3(.45,.25,1.2)', kern: 'vec3(1.6,.75,.2)', toenung: 'vec3(.85,.8,1.15)', absorb: '1.2' };
  function akzent(k) { return { koerper: 'uG*1.4+uC*.010', glanz: 'mix(vec3(1.),uC,.6)*1.35', rim: 'uC*2.4', s1: 'uC*1.2', s2: 'vec3(.55,.62,1.)*.6', kern: 'uC*1.8', toenung: 'mix(vec3(1.),uC,.25)', absorb: '1.4' }; }
  function mix_(a, b) { var r = {}; for (var k in a) r[k] = a[k]; for (var j in b) r[j] = b[j]; return r; }
  var FORM_STROM = { rimk: '.55', neig: '.46', dichte: '7.5', kante: '7.', falte: '.11', amp: '1.', boxw: '.10', rimexp: '22.', spalt: .045, ox: '.47', oy: '.0' };
  var FORM_SEIDE = { rimk: '.25', neig: '.30', dichte: '4.5', kante: '3.', falte: '.10', amp: '1.', boxw: '.16', rimexp: '12.', spalt: .02, ox: '.42', oy: '.0' };
  var FORM_CHROM = { rimk: '.4', neig: '.62', dichte: '6.', kante: '10.', falte: '.12', amp: '1.', boxw: '.16', rimexp: '30.', spalt: .06, ox: '.42', oy: '.0' };

  var PRO = {
    kristall: function () { return objektFS(mix_(FORM_STROM, CLAIR), 'blitz'); },
    kristallfarbe: function () { return objektFS(mix_(FORM_STROM, akzent()), 'blitz'); },
    edelstein: function () { return objektFS(mix_(FORM_STROM, CLAIR), 'kristall'); },
    lack: function () { return baenderFS(mix_(FORM_STROM, CLAIR)); },
    lackfarbe: function () { return baenderFS(mix_(FORM_STROM, akzent())); },
    seidepro: function () { return baenderFS(mix_(FORM_SEIDE, akzent())); },
    chrompro: function () { return baenderFS(mix_(FORM_CHROM, { koerper: 'vec3(.006,.0065,.008)+uG*.5', glanz: 'vec3(1.5,1.53,1.6)', rim: 'uC*1.8', s1: 'vec3(1.,.5,.15)', s2: 'vec3(.35,.5,1.2)' })); },
    funkenpro: funkenFS
  };
  window.HG_PRO = PRO;

  window.HG_START = function (cv, key, G, C, opt) {
    if (!PRO[key]) return alt ? alt(cv, key, G, C, opt) : null;
    return start(cv, PRO[key](), G, C, key);
  };

  function start(cv, fsrc, G, C, key) {
    var gl = null; try { gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, premultipliedAlpha: false, powerPreference: 'high-performance' }); } catch (e) { }
    if (!gl) return null;
    var hp = false; try { var pf = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT); hp = !!(pf && pf.precision > 0); } catch (e) { }
    function S(ty, src) { var o = gl.createShader(ty); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn('HG-PRO ' + key, gl.getShaderInfoLog(o)); return null; } return o; }
    var v = S(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'), f = S(gl.FRAGMENT_SHADER, 'precision ' + (hp ? 'highp' : 'mediump') + ' float;\n' + fsrc);
    if (!v || !f) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null; gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uR', 'uT', 'uM', 'uC', 'uG', 'uHy'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    var lin = function (c) { return c.map(function (x) { return Math.pow(x, 2.2); }); };
    gl.uniform3fv(U.uC, lin(C)); gl.uniform3fv(U.uG, G); gl.uniform1f(U.uHy, (cv.closest && cv.closest('.sv, .st-frame')) ? -.28 : .22);
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fest = null; try { var mt = /[?&]t=([\d.]+)/.exec(location.search); if (mt) fest = parseFloat(mt[1]); } catch (e) { }
    var schwer = /^(kristall|kristallfarbe|edelstein)$/.test(key);
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
      if (fest === null) { /* Bildrate halten: unter 50 fps die Auflösung stufenweise senken (nie unter 55 %) */
        fc++; if (!fs0) fs0 = now; if (now - fs0 > 400) { var fps = fc * 1000 / (now - fs0); fc = 0; fs0 = now; if (fps < 55 && scale > .5) { scale = Math.max(.5, scale * (fps < 36 ? .78 : .9)); size(); } }
        raf = requestAnimationFrame(fr);
      }
    }
    addEventListener('pointermove', mv, { passive: true }); addEventListener('resize', size);
    size(); raf = requestAnimationFrame(fr);
    return { stop: function () { run = false; cancelAnimationFrame(raf); removeEventListener('pointermove', mv); removeEventListener('resize', size); try { var e = gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); } catch (x) { } } };
  }
})();
