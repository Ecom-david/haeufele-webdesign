/* Hintergrund-Bibliothek von Häufele Webdesign – die Live-Hintergründe der fertigen Kunden-Seiten,
   umgefärbt auf die Farbe des jeweiligen Templates (uG = Grundton, uC = Akzentfarbe).
   Jeder Hintergrund: Vollbild-Shader (dunkel, ruhig) + echte 3D-Partikel mit Tiefenschärfe.
   Maus/Neigung = Parallaxe, Bildrate wird gemessen und die Auflösung bei Bedarf gesenkt,
   unsichtbarer Tab = Pause, „weniger Bewegung“ = Standbild. Läuft per Doppelklick (file://). */
(function () {
  'use strict';
  var HEAD = [
    'uniform vec2 uR;uniform float uT,uS;uniform vec2 uM;uniform vec3 uG,uC;',
    'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'vec2 h22(vec2 p){float n=h21(p);return vec2(n,h21(p+n*19.1+7.3));}',
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(.8,-.6,.6,.8);for(int i=0;i<5;i++){v+=a*vn(p);p=m*p*2.02+vec2(1.7,9.2);a*=.5;}return v;}',
    'float fbm3(vec2 p){float v=0.,a=.5;mat2 m=mat2(.8,-.6,.6,.8);for(int i=0;i<3;i++){v+=a*vn(p);p=m*p*2.02+vec2(1.7,9.2);a*=.5;}return v;}',
    'float motes(vec2 p,float den,float rad,float fill,float tw,float t){vec2 g=p*den,c=floor(g),f=fract(g);float s=0.;',
    ' for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y)),id=c+o;float r=h21(id);if(r>fill)continue;',
    '  vec2 q=o+.2+.6*h22(id)+.12*vec2(sin(t*.21+r*41.),cos(t*.17+r*29.));float d=length(f-q)/rad;',
    '  float a=.55+.45*sin(t*(.5+r*1.3)*tw+r*63.);s+=exp(-d*d*2.2)*a*(.35+.65*h21(id+5.1));}',
    ' return s;}',
    'float glint(vec2 p,float den,float fill,float t){vec2 g=p*den,c=floor(g),f=fract(g);float r=h21(c);if(r>fill)return 0.;',
    ' vec2 q=.2+.6*h22(c);float d=length(f-q);float a=pow(max(0.,sin(t*(.35+r*.8)+r*80.)),18.);',
    ' return (exp(-d*d*900.)*1.4+exp(-d*d*90.)*.25)*a;}',
    'vec3 fin(vec3 c,vec2 q){vec2 v=q-.5;c*=1.-.55*dot(v,v)*1.5;c+=(h21(gl_FragCoord.xy+fract(uT*7.)*91.)-.5)*.012;return c;}'
  ].join('\n');

  /* Generator für die Reihe „Ströme“: o.k = Bänder pro Bildhöhe, o.dir = Strömungsrichtung,
     o.warp = Verwirbelung, o.tube 1 = runde Glasbänder (Clair) / 0 = breite Falten (Chrom, Seide),
     o.band = Breite des Bänderbündels (2 = ganzes Bild), o.disp = Lichtspaltung, o.ex = Glanzschärfe,
     Farben als GLSL-Ausdrücke (uG = Grundton, uC = Akzent des Templates). */
  function STROM(o) {
    var f = function (v) { return (Math.round(v * 1000) / 1000).toFixed(3); };
    var D = 'vec2(' + f(o.dir[0]) + ',' + f(o.dir[1]) + ')';
    var nrm = o.tube
      ? 'vec2 sN(float x){x=clamp(x,-.985,.985);return normalize(vec2(x*.97,sqrt(1.-x*x)+.04));}'
      : 'vec2 sN(float x){return normalize(vec2(x*.75,1.));}';
    return [
      'float sA(vec2 p,float sp){vec2 w=p+' + f(o.warp) + '*(vec2(fbm3(p*.55+vec2(uT*.016*sp,1.3)),fbm3(p*.55+vec2(3.1,-uT*.013*sp)))-.5);',
      ' vec2 d=' + D + ';return dot(w,d)*' + f(o.k) + '+1.25*sin(dot(w,vec2(-d.y,d.x))*1.1+uT*.04*sp);}',
      nrm,
      'float sS(vec2 n,vec2 l,float e){vec2 R=2.*n.y*n-vec2(0.,1.);return pow(max(dot(R,l),0.),e);}',
      'vec3 sL(vec2 p,float sp,float px,vec3 L1,vec3 L2,vec2 PL,out float ao){',
      ' float a=sA(p,sp);vec2 g=vec2(sA(p+vec2(px,0.),sp)-a,sA(p+vec2(0.,px),sp)-a);vec2 gd=normalize(g+1e-6);',
      ' float fr=fract(a),id=floor(a),v=h21(vec2(id,7.31));vec2 d=' + D + ';float al=dot(p,vec2(-d.y,d.x));',
      o.tube
        ? ' float x0=2.*fr-1.;ao=pow(max(1.-x0*x0,0.),.42);float x=x0+.24*sin(al*2.3+v*6.283+uT*.06*sp);'
        : ' float x=cos(a*6.2832);ao=.62+.38*sin(a*6.2832);x+=.18*sin(al*1.7+uT*.05*sp);',
      ' vec2 l1=normalize(vec2(dot(L1.xy,gd),L1.z)),l2=normalize(vec2(dot(L2.xy,gd),L2.z));',
      ' vec2 n=sN(x),nr=sN(x+' + f(o.disp) + '),nb=sN(x-' + f(o.disp) + ');',
      ' float pool=.30+.70*exp(-dot(p-PL,p-PL)*.9);float sM=sS(n,l1,' + f(o.ex) + ')*pool,sR=sS(nr,l1,' + f(o.ex) + ')*pool,sB=sS(nb,l1,' + f(o.ex) + ')*pool;',
      ' float br=sS(n,l1,2.)*(.35+.65*pool),s2=sS(n,l2,' + f(o.ex * .4) + '),rim=pow(1.-n.y,3.);',
      ' vec3 B=(' + o.body + ')*(.75+.5*v),SH=' + o.sheen + ',HI=' + o.hi + ',A1=' + o.a1 + ',A2=' + o.a2 + ';',
      ' vec3 c=B*(.20+.80*ao)+SH*br*' + f(o.vol || .55) + '*ao+SH*rim*.18*ao;',
      ' c+=HI*min(sR,sB)*1.25+A1*max(sR-sB,0.)*1.2+A2*max(sB-sR,0.)*1.05+HI*sM*.3;',
      ' c+=A2*s2*.30*ao;return c;}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;float A=uR.x/uR.y;vec2 u=vec2(q.x*A,q.y);vec2 ctr=vec2(A*.5,.5);',
      ' float ra=(uS-.5)*.22+uM.x*.05;mat2 rm=mat2(cos(ra),-sin(ra),sin(ra),cos(ra));',
      ' vec2 L=vec2(-.42,.55)+uM*vec2(.55,.45)+.08*vec2(sin(uT*.07),cos(uT*.053));',
      ' vec3 L1=normalize(vec3(L,.75)),L2=normalize(vec3(.62,-.42,.7));float px=1.5/uR.y;',
      ' vec3 bg=(' + o.body + ')*.30*(.6+.6*q.y);vec3 col=bg;float ao;',
      /* hintere Ebene: größer, langsamer, dunkler – gibt Tiefe */
      ' vec2 pb=rm*(u-ctr)*.62+ctr+vec2(4.7,2.3)+uM*.018;',
      ' vec3 cb=sL(pb,.55,px*.62,L1,L2,pb+vec2(.3),ao);col=mix(col,cb*.13,.9);',
      /* vordere Ebene: das Bänderbündel */
      ' vec2 pf=rm*(u-ctr)+ctr+uM*.055;vec2 d=' + D + ';',
      ' float bd=abs(dot(pf-ctr,d)+.30*(fbm3(pf*.45+vec2(0.,uT*.01))-.5));float m=smoothstep(' + f(o.band) + ',' + f(o.band * .42) + ',bd);',
      ' if(m>.002){vec3 cf=sL(pf,1.,px,L1,L2,ctr+L*.55,ao);col=mix(col,cf,m);}',
      ' col+=(' + o.a1 + ')*exp(-dot(u-ctr-L*.35,u-ctr-L*.35)*2.6)*.025;',
      ' col*=' + f(o.gain || .5) + ';col=col/(1.+col*.6);gl_FragColor=vec4(fin(col,q),1.);}'
    ].join('\n');
  }

  var W = {
    /* Lichtfall: weiche Lichtbahnen fallen schräg herein (wie Abendsonne durch Glas), Staub nur im Licht */
    lichtfall: ['void main(){vec2 q=gl_FragCoord.xy/uR;float A=uR.x/uR.y;vec2 u=vec2(q.x*A,q.y);',
      ' vec3 col=mix(uG*.9,uG*1.6,q.y);',
      ' vec2 L=vec2(A*1.05,1.12)+uM*vec2(.25,.12);vec2 d=u-L;float dist=length(d);',
      ' vec2 dir=normalize(vec2(-.62,-.78));float along=dot(d,dir);float across=dot(d,vec2(-dir.y,dir.x));',
      ' float ang=across/(.35+along*.55);',
      ' float bands=smoothstep(.30,.70,fbm3(vec2(ang*2.4+uT*.018,uT*.03)));',
      ' float stripes=.55+.45*smoothstep(.15,.85,sin(ang*26.+uT*.12+fbm3(vec2(ang*2.,uT*.05))*3.));',
      ' float fall=smoothstep(2.6,.0,dist)*smoothstep(-.05,.35,along);',
      ' float haze=fbm(u*1.6+vec2(uT*.012,-uT*.008));',
      ' float ray=bands*stripes*fall*(.55+.6*haze)*(.85+.15*vn(u*220.+uT*.3));',
      ' col+=uC*ray*.62+uC*exp(-dist*dist*1.6)*.07;',
      ' gl_FragColor=vec4(fin(col,q),1.);}'].join('\n'),
    /* Jahresringe aus Licht: feine Lichtlinien, Lichtinsel folgt der Maus */
    ringe: ['void main(){vec2 q=gl_FragCoord.xy/uR;float A=uR.x/uR.y;vec2 u=vec2(q.x*A,q.y);',
      ' vec3 col=mix(uG*1.0,uG*1.5,q.y*.8+.1);',
      ' vec2 c=vec2(A*.78,.30)+uM*vec2(.06,.04);vec2 p=u-c;',
      ' vec2 w=vec2(fbm(p*1.3+vec2(0.,uT*.006)),fbm(p*1.3+vec2(5.2,1.3-uT*.005)));',
      ' float r=length(p*vec2(1.,1.35)+(w-.5)*.55)+.06*fbm(p*5.+3.);',
      ' float rings=r*11.-uT*.035;float fr=abs(fract(rings)-.5);',
      ' float line=smoothstep(.06,.0,fr)*.9+smoothstep(.20,.0,fr)*.18;',
      ' line*=mix(.45,1.,smoothstep(.25,.75,fract(rings*.5+fbm(p*2.)*.4)));',
      ' vec2 lp=vec2(A*(.5+uM.x*1.1),.5+uM.y*.9);float pool=exp(-dot(u-lp,u-lp)*2.4);',
      ' float env=smoothstep(1.9,.2,r)*.55+pool*.9;',
      ' col+=uC*line*env*.22+uC*.5*pool*.07;',
      ' gl_FragColor=vec4(fin(col,q),1.);}'].join('\n'),
    /* Polierte Tiefe: flüssig gewellte, fast schwarze Fläche mit Glanz + funkelnden Kristallen */
    tiefe: ['void main(){vec2 q=gl_FragCoord.xy/uR;float A=uR.x/uR.y;vec2 u=vec2(q.x*A,q.y);float t=uT*.02;',
      ' vec2 p=u+uM*.04;vec2 dir=normalize(vec2(.9,.45));',
      ' float h=sin(dot(p,dir)*5.5+fbm3(p*.9+vec2(t,-t*.7))*5.+fbm3(p*1.7+vec2(-t*.8,t*.5)+4.)*1.6+t*2.)*.5+.5;',
      ' float e=.002;vec2 px=p+vec2(e,0.),py=p+vec2(0.,e);',
      ' float hx=sin(dot(px,dir)*5.5+fbm3(px*.9+vec2(t,-t*.7))*5.+fbm3(px*1.7+vec2(-t*.8,t*.5)+4.)*1.6+t*2.)*.5+.5-h;',
      ' float hy=sin(dot(py,dir)*5.5+fbm3(py*.9+vec2(t,-t*.7))*5.+fbm3(py*1.7+vec2(-t*.8,t*.5)+4.)*1.6+t*2.)*.5+.5-h;',
      ' vec3 n=normalize(vec3(-hx/e*.38,-hy/e*.38,1.));',
      ' vec3 L=normalize(vec3(uM.x*1.4+.45,uM.y*1.2+.55,.6));vec3 H=normalize(L+vec3(0.,0.,1.));',
      ' float nh=max(dot(n,H),0.);float sp=pow(nh,60.);float sp2=pow(nh,8.);',
      ' float fade=smoothstep(1.4,.2,length(u-vec2(A*.75,.65)));',
      ' vec3 col=uG*1.2+uG*.4*h;col+=uC*(sp*.55+sp2*.07)*(.35+.65*fade);',
      ' float g=0.;for(int i=0;i<3;i++){float z=float(i);vec2 pp=u*(1.+z*.5)+uM*(.02+z*.05)+vec2(z*11.,0.);g+=glint(pp,26.-z*7.,.32,uT*.9+z*3.)*(.5+z*.35);}',
      ' col+=mix(uC,vec3(1.),.5)*g*(.35+sp2*1.2);',
      ' gl_FragColor=vec4(fin(col,q),1.);}'].join('\n'),
    /* Dampf: weiche Nebelschichten, dahinter unscharfe Lichtpunkte */
    dampf: ['void main(){vec2 q=gl_FragCoord.xy/uR;float A=uR.x/uR.y;vec2 u=vec2(q.x*A,q.y);',
      ' vec3 col=mix(uG*.9,uG*1.5,q.y);',
      ' float b=0.;for(int i=0;i<2;i++){float z=float(i);vec2 pp=u*(1.+z*.3)+uM*(.015+z*.02)+vec2(z*5.,uT*(.004+z*.003));b+=motes(pp,3.2-z*.9,.16+z*.08,.30,.4,uT*.6)*(.6+z*.2);}',
      ' col+=uC*b*.30;',
      ' float s=0.;for(int i=0;i<3;i++){float z=float(i);vec2 pp=u*(.9+z*.45)+uM*(.05+z*.07)*vec2(1.,.6)+vec2(-uT*(.010+z*.006),uT*(.005+z*.004));',
      '  vec2 w=vec2(fbm(pp*.9+z),fbm(pp*.9+4.+z));float f=fbm(pp*1.1+w*1.3);s+=smoothstep(.44,.66,f)*(.6-z*.12);}',
      ' col+=mix(uG*3.,uC*.14,.5)*s+uC*s*b*.3;',
      ' gl_FragColor=vec4(fin(col,q),1.);}'].join('\n'),
    /* Rauchfäden: hauchdünne Fäden steigen im Licht einer Lampe auf, Maus bläst sie zur Seite */
    rauch: ['void main(){vec2 q=gl_FragCoord.xy/uR;float A=uR.x/uR.y;vec2 u=vec2(q.x*A,q.y);',
      ' vec3 col=uG*1.05+uG*.4*(1.-q.y);',
      ' vec2 lp=vec2(A*.72,.12);float light=exp(-dot(u-lp,u-lp)*.9);',
      ' float sm=0.;for(int i=0;i<4;i++){float z=float(i);float x0=A*(.50+.11*z+.03*sin(z*5.))+uM.x*(.04+z*.02);',
      '  float y=u.y+uT*.03*(1.+z*.15);float hgt=clamp(q.y,0.,1.);',
      '  float sway=(fbm3(vec2(y*1.6+z*7.,uT*.05+z))-.5)*(.25+hgt*1.1)+(fbm3(vec2(y*4.2+z*3.,uT*.09))-.5)*hgt*.35-uM.x*hgt*.35;',
      '  float tur=(fbm(vec2(u.x*6.+z,y*5.-uT*.1))-.5)*smoothstep(.25,.8,hgt)*.22;float dx=u.x-x0-sway-tur;float wdt=.003+hgt*hgt*.06;',
      '  float core=exp(-dx*dx/(wdt*wdt));float edge=exp(-dx*dx/(wdt*wdt*9.))*.22;',
      '  float br=smoothstep(.35,.75,fbm3(vec2(y*2.4+z*11.,uT*.05)));',
      '  sm+=(core*(.5+.5*(1.-hgt))+edge)*smoothstep(.0,.15,q.y)*smoothstep(.9,.2,q.y)*br*(1.-z*.2);}',
      ' vec2 w=vec2(fbm3(u*2.+vec2(0.,-uT*.04)),fbm3(u*2.+vec2(3.,-uT*.03)));float veil=pow(fbm(u*1.5+w*1.4+vec2(0.,-uT*.03)),3.)*smoothstep(.2,.9,q.y)*smoothstep(.0,.5,q.x)*.6;',
      ' col+=uC*(sm*.75+veil*.45)*(.45+light*1.2)+uC*.6*light*.06;',
      ' gl_FragColor=vec4(fin(col,q),1.);}'].join('\n'),
    /* Polarlicht: Lichtschleier ziehen schräg durchs Bild, Lichtteilchen fließen wie Strom */
    polarlicht: ['void main(){vec2 q=gl_FragCoord.xy/uR;float A=uR.x/uR.y;vec2 u=vec2(q.x*A,q.y);',
      ' vec3 col=mix(uG*1.0,uG*1.6,q.y);',
      ' vec2 sp=vec2(A*.95,1.05)+uM*.08;float sd=length(u-sp);col+=uC*(.15+uS*.35)*exp(-sd*sd*1.6)*.35;',
      ' float a=0.;for(int i=0;i<3;i++){float z=float(i);vec2 p=u*vec2(.9,1.)+uM*(.03+z*.04)+vec2(z*2.7,0.);',
      '  float y=p.y-.30*p.x-.15-z*.22+.18*fbm(vec2(p.x*.9+uT*.02*(1.+z*.4),z*3.));',
      '  float band=exp(-y*y*22.)*(.5+.5*fbm(vec2(p.x*3.-uT*.04,p.y*9.+z)));',
      '  float curtain=smoothstep(.0,.25,-y)*exp(y*5.)*.6*fbm(vec2(p.x*6.+uT*.03,z));',
      '  float str=.7+.3*vn(vec2(p.x*90.+z*13.,uT*.15))*vn(vec2(p.x*23.-uT*.05,z));a+=(band+curtain)*str*(.7-z*.18);}',
      ' col+=mix(uC*.8,mix(uC,vec3(1.),.3),q.y)*a*.95;',
      ' gl_FragColor=vec4(fin(col,q),1.);}'].join('\n'),
    /* Leiterbahnen: Graphit, feine Leiterbahnen, seltene Lichtimpulse laufen entlang (Elektro) */
    leiterbahn: ['void main(){vec2 q=gl_FragCoord.xy/uR;float A=uR.x/uR.y;vec2 u=vec2(q.x*A,q.y);',
      ' vec3 col=uG*.85+uG*.55*q.y;',
      ' vec2 p=(u+uM*.035)*6.5;float px=6.5/uR.y*1.4;',
      ' float ry=floor(p.y),rx=floor(p.x),hy=h21(vec2(3.1,ry)),hx=h21(vec2(rx,7.7));',
      ' float segH=step(.48,vn(vec2(p.x*.45,ry*3.1)))*step(.42,hy),segV=step(.55,vn(vec2(rx*2.7,p.y*.45)))*step(.58,hx);',
      ' float dy=abs(fract(p.y)-.5),dx=abs(fract(p.x)-.5);',
      ' float line=max(segH*smoothstep(px,px*.2,dy),segV*smoothstep(px,px*.2,dx));',
      ' float sH=fract(p.x*.05-uT*(.02+hy*.025)+hy*5.),sV=fract(p.y*.05+uT*(.016+hx*.02)+hx*5.);',
      ' float pul=segH*step(.72,hy)*smoothstep(px*3.,0.,dy)*pow(sH,16.)+segV*step(.8,hx)*smoothstep(px*3.,0.,dx)*pow(sV,16.);',
      ' float via=segH*segV*smoothstep(.055,.04,length(fract(p)-.5))*smoothstep(.018,.03,length(fract(p)-.5));',
      ' float haze=fbm(u*1.3+vec2(uT*.01,0.));vec2 g=u-vec2(A*.72+uM.x*.2,.78);',
      ' col+=uC*line*.045*(.5+.7*haze)+uC*via*.09+uC*pul*.6+uC*exp(-dot(g,g)*1.3)*.045;',
      ' gl_FragColor=vec4(fin(col,q),1.);}'].join('\n'),
    /* Kohle: gebranntes Holz (Shou-Sugi-Ban) – Krakelee-Zellen, seidiger Kohleglanz im wandernden Licht, Glut atmet in den Rissen */
    kohle: ['void main(){vec2 q=gl_FragCoord.xy/uR;float A=uR.x/uR.y;vec2 u=vec2(q.x*A,q.y);',
      ' vec3 col=uG*.75+uG*.35*q.y;vec2 p=(u+uM*.02)*vec2(11.,19.);float px=19./uR.y;',
      ' vec2 ip=floor(p),fp=fract(p);float f1=9.,f2=9.;vec2 id=vec2(0.);',
      ' for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 r=o+.1+.8*h22(ip+o)-fp;float d=dot(r,r);if(d<f1){f2=f1;f1=d;id=ip+o;}else if(d<f2){f2=d;}}',
      ' float e=sqrt(f2)-sqrt(f1);float crack=1.-smoothstep(px*.6,px*2.6+.012,e);float dome=smoothstep(0.,.42,e);',
      ' float tex=fbm(p*2.3+h21(id)*9.);',
      ' vec2 L=vec2(A*(.55+.3*sin(uT*.045))+uM.x*.35,.68+.18*cos(uT*.037)+uM.y*.2);float lg=exp(-dot(u-L,u-L)*1.5);',
      ' float sheen=pow(dome,1.6)*(.45+.55*tex)*(.6+.4*h21(id+3.));',
      ' col+=vec3(.045,.043,.041)*sheen*(.12+lg*1.0)*(.6+.7*fbm(u*2.5));col*=1.-crack*.45;',
      ' float glut=crack*smoothstep(.62,.86,fbm(u*1.4+vec2(uT*.018,-uT*.012)))*(.5+.5*sin(uT*.55+h21(id)*30.));',
      ' col+=uC*glut*.35+uC*exp(-dot(u-L,u-L)*2.)*.02;',
      ' gl_FragColor=vec4(fin(col,q),1.);}'].join('\n'),
    /* Funken: tiefes Schwarz, nur Licht-Funken in drei Tiefen (Partikel tragen das Bild) */
    funken: ['void main(){vec2 q=gl_FragCoord.xy/uR;float A=uR.x/uR.y;vec2 u=vec2(q.x*A,q.y);',
      ' vec3 col=uG*.8+uG*.6*q.y;float glow=exp(-dot(u-vec2(A*.5+uM.x*.3,.35),u-vec2(A*.5+uM.x*.3,.35))*1.4);col+=uC*glow*.05;',
      ' float b=motes(u+uM*.03+vec2(0.,uT*.006),2.4,.22,.35,.5,uT*.5);col+=uC*b*.06;',
      ' gl_FragColor=vec4(fin(col,q),1.);}'].join('\n')
,
    /* ── Reihe „Ströme“ (09.11.2026, Clair-Prinzip): glänzende 3D-Bänder in langsamer Strömung,
       echte Oberflächen-Normalen, Spiegelung einer Studio-Lichtbox, Licht spaltet sich an den Kanten
       in zwei Farben (Dispersion). Zwei Tiefenebenen, Maus = Parallaxe + Lichtrichtung. ── */
    strom: STROM({ k: 6.2, dir: [.55, .83], warp: .55, tube: 1, band: .42, disp: .10, ex: 70, vol: .95, gain: .52,
      body: 'uG*2.4+uC*.035', sheen: 'mix(uG*6.,uC,.28)', hi: 'mix(vec3(1.),uC,.30)', a1: 'uC', a2: 'mix(vec3(.62,.66,.78),uC,.25)' }),
    indigo: STROM({ k: 5.8, dir: [.62, .78], warp: .62, tube: 1, band: .44, disp: .12, ex: 64, vol: .80, gain: .62,
      body: 'vec3(.030,.026,.095)', sheen: 'vec3(.30,.24,.95)', hi: 'vec3(.86,.83,1.)', a1: 'vec3(1.,.60,.16)', a2: 'vec3(.58,.34,1.)' }),
    chrom: STROM({ k: 3.2, dir: [.42, .91], warp: .80, tube: 0, band: 2.0, disp: .035, ex: 90, gain: .55,
      body: 'vec3(.018)+uG*.6', sheen: 'vec3(.30)', hi: 'vec3(1.)', a1: 'mix(vec3(.85),uC,.35)', a2: 'vec3(.70,.74,.82)' }),
    seide: STROM({ k: 2.3, dir: [.30, .95], warp: .95, tube: 0, band: 2.0, disp: .02, ex: 30, gain: .48,
      body: 'uG*1.6+uC*.012', sheen: 'uC*.22', hi: 'mix(vec3(1.),uC,.35)', a1: 'uC', a2: 'mix(uC,vec3(1.),.45)' }),
    prisma: STROM({ k: 7.6, dir: [.70, .71], warp: .45, tube: 1, band: .40, disp: .26, ex: 80, vol: .9, gain: .6,
      body: 'vec3(.012,.014,.02)+uG', sheen: 'vec3(.14,.16,.22)', hi: 'vec3(.95)', a1: 'vec3(1.,.42,.10)', a2: 'vec3(.12,.55,1.)' })
  };
  /* Partikel je Welt (Stärke, Drift, Schärfeebene, Funkeln) */
  var P = {
    lichtfall: { n: 1300, v: [-.035, -.02, 0], sw: .07, sz: 2.6, foc: 2.7, tw: .5, a: .95, L: [.85, .9, 1.6, .22] },
    ringe: { n: 1000, v: [.006, -.03, 0], sw: .06, sz: 2.4, foc: 2.5, tw: .4, a: .8, L: [0, 0, 1.1, .22], Lm: 1 },
    tiefe: { n: 1500, v: [.004, .008, 0], sw: .03, sz: 2.0, foc: 2.3, tw: 2, a: 1.3 },
    dampf: { n: 1000, v: [0, .022, 0], sw: .09, sz: 2.6, foc: 2.8, tw: .6, a: .8 },
    rauch: { n: 1100, v: [.004, .04, 0], sw: .12, sz: 2.4, foc: 2.6, tw: .7, a: .95, L: [.45, -.7, 1.7, .25] },
    polarlicht: { n: 1500, v: [.09, .018, 0], sw: .16, sz: 2.2, foc: 2.6, tw: .8, a: .9 },
    leiterbahn: { n: 700, v: [.012, .004, 0], sw: .04, sz: 1.9, foc: 2.4, tw: .5, a: .55 },
    kohle: { n: 520, v: [.004, .045, 0], sw: .05, sz: 2.0, foc: 2.5, tw: .9, a: .9 },
    funken: { n: 2200, v: [.01, .05, 0], sw: .1, sz: 2.4, foc: 2.4, tw: .9, a: 1.15 },
    strom: { n: 420, v: [.01, .012, 0], sw: .05, sz: 1.8, foc: 2.4, tw: .6, a: .35 },
    indigo: { n: 420, v: [.01, .012, 0], sw: .05, sz: 1.8, foc: 2.4, tw: .6, a: .35 },
    chrom: { n: 260, v: [.006, .01, 0], sw: .04, sz: 1.7, foc: 2.4, tw: 2, a: .5 },
    seide: { n: 320, v: [.004, .014, 0], sw: .06, sz: 1.9, foc: 2.5, tw: .5, a: .3 },
    prisma: { n: 380, v: [.012, .01, 0], sw: .05, sz: 1.8, foc: 2.4, tw: 2, a: .55 }
  };

  window.HG_WELTEN = W;
  window.HG_START = function (cv, key, G, Cc) {
    var gl = null; try { gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' }); } catch (e) { }
    if (!gl) return null;
    var mob = matchMedia('(max-width: 820px)').matches || matchMedia('(pointer: coarse)').matches, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hp = false; try { var pf = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT); hp = !!(pf && pf.precision > 0); } catch (e) { }
    var PR = 'precision ' + (hp ? 'highp' : 'mediump') + ' float;\n';
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn('HG', gl.getShaderInfoLog(o)); return null; } return o; }
    function prog(vs, fs) { var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs); if (!v || !f) return null; var p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p); return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null; }
    var pB = prog('attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}', PR + HEAD + '\n' + W[key]); if (!pB) return null;
    var quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var UB = {}; ['uR', 'uT', 'uS', 'uM', 'uG', 'uC'].forEach(function (n) { UB[n] = gl.getUniformLocation(pB, n); });
    var C = P[key], N = reduce ? 0 : Math.round(C.n * (mob ? .45 : 1));
    var PVS = PR +
      'attribute vec4 a;uniform float uT,uAsp,uDpr,uSz,uFoc,uSw,uTw,uA;uniform vec2 uM;uniform vec3 uV;uniform vec4 uL;uniform float uLm;\n' +
      'varying float vB,vI,vMix;const vec3 BMIN=vec3(-5.,-3.2,.55),BSZ=vec3(10.,6.4,6.6);\n' +
      'void main(){float s=a.w;vec3 p=a.xyz+uV*uT;\n' +
      ' p+=uSw*vec3(sin(uT*.23+s*31.)+.5*sin(uT*.61+s*7.),cos(uT*.19+s*17.)+.5*sin(uT*.47+s*13.),.6*sin(uT*.13+s*23.));\n' +
      ' p=BMIN+mod(p-BMIN,BSZ);\n' +
      ' float edge=smoothstep(0.,.5,p.z-BMIN.z)*smoothstep(0.,.9,BMIN.z+BSZ.z-p.z)*smoothstep(0.,.5,p.y-BMIN.y)*smoothstep(0.,.5,BMIN.y+BSZ.y-p.y)*smoothstep(0.,.5,p.x-BMIN.x)*smoothstep(0.,.5,BMIN.x+BSZ.x-p.x);\n' +
      ' vec3 c=vec3(0.,0.,3.2);vec3 q=p-c;float yw=uM.x*.42+sin(uT*.045)*.05,pt=-uM.y*.26+cos(uT*.037)*.03;\n' +
      ' float cy=cos(yw),sy=sin(yw);q=vec3(cy*q.x+sy*q.z,q.y,-sy*q.x+cy*q.z);float cp=cos(pt),sp=sin(pt);q=vec3(q.x,cp*q.y-sp*q.z,sp*q.y+cp*q.z);\n' +
      ' p=q+c;float z=max(p.z,.2);vec2 sc=vec2(p.x/(z*uAsp),p.y/z)*1.35;gl_Position=vec4(sc,0.,1.);\n' +
      ' float blur=clamp(abs(1./z-1./uFoc)*2.6,0.,1.);vB=blur;\n' +
      ' float base=uSz*uDpr*(1.6/z+.35);float size=base+blur*uDpr*26./z;gl_PointSize=clamp(size,1.,96.);\n' +
      ' float tw=.65+.35*sin(uT*(.5+fract(s*7.3))*1.7+s*80.);\n' +
      ' if(uTw>1.5){tw=.12+pow(max(0.,sin(uT*(.25+fract(s*3.7)*.6)+s*90.)),24.)*3.;}else{tw=mix(1.,tw,uTw);}\n' +
      ' float lm=1.;if(uL.z>0.){vec2 lp=uLm>.5?vec2(uM.x*2.,uM.y*2.):uL.xy;float d=length((sc-lp)*vec2(uAsp,1.));lm=uL.w+(1.-uL.w)*exp(-d*d/(uL.z*uL.z));}\n' +
      ' float energy=(base*base)/(size*size);\n' +
      ' vI=2.4*uA*tw*lm*edge*mix(1.,.9,blur)*clamp(energy*2.2,.11,1.)*(.55+.45*fract(s*13.1))*smoothstep(.2,.9,z);\n' +
      ' vMix=step(fract(s*5.17),.32);}';
    var PFS = PR + 'uniform vec3 uC1,uC2;varying float vB,vI,vMix;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;if(r>1.)discard;\n' +
      ' float sharp=exp(-r*r*7.)+exp(-r*r*40.)*.8;float bok=smoothstep(1.,.86,r)*(.6+.4*smoothstep(.55,.95,r));\n' +
      ' float g=mix(sharp,bok,smoothstep(.0,.55,vB));gl_FragColor=vec4(mix(uC1,uC2,vMix)*g*vI,1.);}';
    var pP = N ? prog(PVS, PFS) : null, pbuf = null, UP = {};
    if (pP) {
      var arr = new Float32Array(N * 4); for (var i = 0; i < N; i++) { arr[i * 4] = -5 + Math.random() * 10; arr[i * 4 + 1] = -3.2 + Math.random() * 6.4; arr[i * 4 + 2] = .55 + Math.pow(Math.random(), .8) * 6.6; arr[i * 4 + 3] = Math.random(); }
      pbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      ['uT', 'uAsp', 'uDpr', 'uSz', 'uFoc', 'uSw', 'uTw', 'uA', 'uM', 'uV', 'uL', 'uLm', 'uC1', 'uC2'].forEach(function (n) { UP[n] = gl.getUniformLocation(pP, n); });
    }
    var mm = (Cc[0] + Cc[1] + Cc[2]) / 3; Cc = Cc.map(function (c) { return Math.max(0, Math.min(1, mm + (c - mm) * 1.8)); });  // Akzent satter fürs Licht
    var C2 = [Cc[0] * .5 + .5, Cc[1] * .5 + .5, Cc[2] * .5 + .5];
    var scale = 1, dpr = 1, alive = true;
    function size() { dpr = Math.min(Math.max(devicePixelRatio || 1, mob ? 1 : 1.25), 1.75) * scale; cv.width = Math.max(2, Math.round(innerWidth * dpr)); cv.height = Math.max(2, Math.round(innerHeight * dpr)); gl.viewport(0, 0, cv.width, cv.height); }
    addEventListener('resize', size); size();
    var S = 0, tS = 0, M = [0, 0], tM = [0, 0], t0 = performance.now() - 12000 * Math.random(), last = 0, minDt = mob ? 1000 / 31 : 1000 / 61, fc = 0, fs0 = 0;
    function rs() { var m = document.documentElement.scrollHeight - innerHeight; tS = m > 0 ? scrollY / m : 0; }
    function pm(e) { if (e.pointerType === 'touch') return; tM = [e.clientX / innerWidth - .5, .5 - e.clientY / innerHeight]; }
    addEventListener('scroll', rs, { passive: true }); rs(); addEventListener('pointermove', pm, { passive: true });
    function frame(now) {
      if (!alive) return; requestAnimationFrame(frame);
      if (document.hidden || now - last < minDt - 1) return;
      var dt = Math.min(.05, (now - (last || now)) / 1000) || .016; last = now;
      S += (tS - S) * (1 - Math.pow(.05, dt)); M[0] += (tM[0] - M[0]) * (1 - Math.pow(.12, dt)); M[1] += (tM[1] - M[1]) * (1 - Math.pow(.12, dt));
      var T = reduce ? 30 : (now - t0) / 1000;
      gl.disable(gl.BLEND); gl.useProgram(pB); gl.bindBuffer(gl.ARRAY_BUFFER, quad); var lp = gl.getAttribLocation(pB, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(UB.uR, cv.width, cv.height); gl.uniform1f(UB.uT, T); gl.uniform1f(UB.uS, S); gl.uniform2f(UB.uM, M[0], M[1]);
      gl.uniform3f(UB.uG, G[0], G[1], G[2]); gl.uniform3f(UB.uC, Cc[0], Cc[1], Cc[2]); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(lp);
      if (pP) {
        gl.useProgram(pP); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); var la = gl.getAttribLocation(pP, 'a'); gl.enableVertexAttribArray(la); gl.vertexAttribPointer(la, 4, gl.FLOAT, false, 0, 0);
        gl.uniform1f(UP.uT, T); gl.uniform1f(UP.uAsp, cv.width / cv.height); gl.uniform1f(UP.uDpr, dpr); gl.uniform1f(UP.uSz, C.sz); gl.uniform1f(UP.uFoc, C.foc); gl.uniform1f(UP.uSw, C.sw); gl.uniform1f(UP.uTw, C.tw); gl.uniform1f(UP.uA, C.a);
        gl.uniform2f(UP.uM, M[0], M[1] + (S - .5) * .35); gl.uniform3f(UP.uV, C.v[0], C.v[1], C.v[2]); var L = C.L || [0, 0, 0, 1]; gl.uniform4f(UP.uL, L[0], L[1], L[2], L[3]); gl.uniform1f(UP.uLm, C.Lm ? 1 : 0);
        gl.uniform3f(UP.uC1, Cc[0], Cc[1], Cc[2]); gl.uniform3f(UP.uC2, C2[0], C2[1], C2[2]); gl.drawArrays(gl.POINTS, 0, N); gl.disableVertexAttribArray(la);
      }
      fc++; if (!fs0) fs0 = now; if (now - fs0 > 3000) { var fps = fc * 1000 / (now - fs0); fc = 0; fs0 = now; if (fps < (mob ? 22 : 34) && scale > .6) { scale = Math.max(.6, scale * .88); size(); } }
    }
    requestAnimationFrame(frame);
    return { stop: function () { alive = false; removeEventListener('resize', size); removeEventListener('scroll', rs); removeEventListener('pointermove', pm); var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } };
  };
})();
