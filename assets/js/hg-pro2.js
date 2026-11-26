/* HG-PRO 2 – acht weitere Echtzeit-Welten (Häufele Webdesign, 10.11.2026).
   Prinzipien aus den Referenzen (MotionSites Halo Prism / Intelligence Layer, RELAY, OSCILLA, wearebrand) – eigene Umsetzung, kein Foto.
   Erweitert window.HG_START (Ladereihenfolge: nach hg-pro.js). Test: ?t=<Sekunde> friert die Zeit ein. */
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
    'float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}',
    'vec3 spek(float x){return clamp(vec3(abs(x*6.-3.)-1.,2.-abs(x*6.-2.),2.-abs(x*6.-4.)),0.,1.);}',
    'mat3 rot(float a,float b){float ca=cos(a),sa=sin(a),cb=cos(b),sb=sin(b);return mat3(ca,0.,sa,0.,1.,0.,-sa,0.,ca)*mat3(1.,0.,0.,0.,cb,-sb,0.,sb,cb);}'
  ].join('\n');

  /* ---------- 1 PRISMA: weißer Lichtstrahl trifft ein Glasprisma und fächert ins Spektrum auf ---------- */
  function prismaFS() {
    return [KOPF,
      'vec3 feld(vec2 p,float t,vec2 m,vec2 om){',
      ' vec3 col=uG*.3+vec3(.002,.002,.004);',
      ' col+=vec3(.5,.55,.7)*.02*exp(-length((p-om)*vec2(.6,1.))*2.2);',
      ' vec2 E=om+vec2(-.085,.035);vec2 A=vec2(-3.,.62+m.y*.04);',
      ' float d=seg(p,A,E);float vor=smoothstep(-2.2,E.x-.3,p.x);',
      ' float strahl=(exp(-d*d/2.2e-5)*1.5+exp(-d/.03)*.12+exp(-d/.16)*.03)*vor;',
      ' col+=vec3(1.,.98,.95)*strahl;',
      ' vec2 X=om+vec2(.075,-.02);vec2 v=p-X;float r=length(v);',
      ' float base=-.36+m.x*.05+sin(t*.11)*.025;float spr=.34+.02*sin(t*.07);',
      ' float a=atan(v.y,v.x);float u=(a-base)/spr+.5;',
      ' float im=smoothstep(-.02,.07,u)*smoothstep(1.02,.93,u)*smoothstep(-.03,.02,v.x);',
      ' float wachs=smoothstep(.0,.12,r);float fall=1./(1.+r*1.1);',
      ' float fein=.9+.1*sin(u*14.+r*2.-t*.3);',
      ' vec3 sp=spek(clamp(u*1.08-.04,0.,1.))*vec3(1.05,.9,1.2);',
      ' col+=sp*im*wachs*fall*1.25*fein;',
      ' col+=sp*smoothstep(-.25,.5,u)*smoothstep(1.25,.5,u)*smoothstep(-.05,.1,v.x)*fall*.06;',
      ' vec2 g=(p+vec2(t*.006,-t*.004))*150.;vec2 gi=floor(g);float staub=step(.93,h1(gi))*smoothstep(.32,.05,length(fract(g)-.5))*(.5+.5*sin(t*1.3+h1(gi+2.)*40.));',
      ' col+=(vec3(1.)*strahl*6.+sp*im*wachs*fall*2.)*staub*.6;',
      ' col+=vec3(1.)*.025*exp(-length((p-om-vec2(.0,-.33))*vec2(1.,5.))*2.5);',
      ' return col;}',
      'float sdf(vec3 p){p.y+=.06;vec3 q=abs(p);vec2 w=vec2(max(q.x*.866025+p.y*.5,-p.y)-.19,q.z-.045);return min(max(w.x,w.y),0.)+length(max(w,0.))-.014;}',
      'vec3 nrm(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(sdf(p+e.xyy)-sdf(p-e.xyy),sdf(p+e.yxy)-sdf(p-e.yxy),sdf(p+e.yyx)-sdf(p-e.yyx)));}',
      'vec3 umg(vec3 r){float a=smoothstep(.35,.45,r.y)*smoothstep(.95,.7,r.y)*smoothstep(.7,.15,abs(r.x+.3));',
      ' float b=smoothstep(.6,.7,r.x)*smoothstep(.25,0.,abs(r.y-.1));float c=smoothstep(-.6,-.7,r.x)*smoothstep(.3,0.,abs(r.y-.2));',
      ' return vec3(1.)*a*2.4+vec3(1.)*b*1.4+vec3(.8,.85,1.)*c*1.2+vec3(.01);}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;vec2 m=uM;',
      ' vec2 om=heldPos()+vec2(-.04,.04);float a_=uR.x/uR.y;float sk=a_>1.05?.72:.62;',
      ' vec3 ro=vec3(0.,0.,3.2);vec3 rd=normalize(vec3((p-om)/sk,-2.4));',
      ' mat3 R=rot(.42*sin(t*.09)+m.x*.28,.18+.06*sin(t*.13)-m.y*.18);',
      ' mat3 Ri=mat3(R[0][0],R[1][0],R[2][0],R[0][1],R[1][1],R[2][1],R[0][2],R[1][2],R[2][2]);',
      ' vec3 o=Ri*ro,d=Ri*rd;float tt=0.,hit=0.,dmin=9.,tmin=0.;',
      ' for(int i=0;i<72;i++){float h=sdf(o+d*tt);if(h<dmin&&tt>1.){dmin=h;tmin=tt;}if(h<.0005){hit=1.;break;}tt+=h;if(tt>6.)break;}',
      ' float px=1.5/(uR.y*.42*sk);float cov=hit>.5?1.:1.-smoothstep(0.,px*tmin,dmin);if(hit<.5&&cov>0.)tt=tmin;',
      ' vec3 col=feld(p,t,m,om);',
      ' if(cov>0.){vec3 x=o+d*tt;vec3 n=nrm(x);float fr=.04+.96*pow(1.-max(dot(-d,n),0.),5.);',
      '  vec3 sp=umg(R*reflect(d,n));vec3 dur=vec3(0.);',
      '  for(int c=0;c<3;c++){float ior=c==0?1.46:(c==1?1.52:1.59);vec3 rr=refract(d,n,1./ior);vec3 y=x-n*.006+rr*.01;float s=0.;',
      '   for(int j=0;j<40;j++){float h=-sdf(y+rr*s);if(h<.0008)break;s+=max(h,.002);}',
      '   vec3 n2_=-nrm(y+rr*s);vec3 aus=refract(rr,n2_,ior);if(dot(aus,aus)<.01)aus=reflect(rr,n2_);',
      '   vec3 wr=R*aus;vec3 f=min(feld(p+wr.xy*.22,t,m,om)*1.5+umg(wr)*.35,vec3(3.));',
      '   if(c==0)dur.r=f.r;else if(c==1)dur.g=f.g;else dur.b=f.b;}',
      '  vec3 glas=mix(dur*vec3(.92,.95,1.),sp,fr);',
      '  float kante=pow(1.-abs(dot(d,n)),4.);glas+=vec3(1.)*kante*.55;',
      '  glas+=vec3(1.)*smoothstep(.02,0.,abs(sdf(x)+.0))*0.;',
      '  col=mix(col,glas,cov);}',
      ' gl_FragColor=vec4(ausgabe(col,q),1.);}'].join('\n');
  }

  /* ---------- 2 NEON-LICHTSTROM: 40 Lichtfäden, gebündelt in einer S-Kurve, in Tiefe gestaffelt ---------- */
  function neonFS() {
    return [KOPF,
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;vec2 m=uM;',
      ' float a=uR.x/uR.y;vec2 pp=p;if(a<1.05){pp=vec2(p.y*.9,-p.x)*1.15;}',
      ' vec3 c=uG*.4;',
      ' for(int i=0;i<40;i++){float fi=float(i);float r1=h1(vec2(fi,1.3)),r2=h1(vec2(fi,7.1)),z=h1(vec2(fi,4.4));',
      '  float x=pp.x;float sp=.025+.30*pow(abs(x-.32),1.6);',
      '  float o=(fi/39.-.5)*sp*2.+(r1-.5)*sp*.7;',
      '  float ph=x*1.5+t*.09+.2;float y=.22*sin(ph)-.18*x-.04+o+.02*sin(x*5.+fi*1.7+t*(.25+r2*.3))+m.y*.1*exp(-pow(x-m.x*.8,2.)*3.);',
      '  float dy=.22*1.5*cos(ph)-.18;float d=abs(pp.y-y)/sqrt(1.+dy*dy);if(d>.22)continue;',
      '  float w=mix(.0011,.006,z*z)*(1.+sp);float br=mix(.75,.12,z)*(.35+.65*pow(.5+.5*sin(fi*3.1+t*.35-x*2.3),2.))*smoothstep(-1.2,.1,x);',
      '  float kern=exp(-d*d/(w*w));float glow=exp(-d/(w*8.))*.08;',
      '  c+=br*(kern*mix(uC,vec3(1.),.35)+uC*glow);}',
      ' float ym=.22*sin(pp.x*1.5+t*.09+.2)-.18*pp.x-.04;c+=uC*.03*exp(-abs(pp.y-ym)*6.)*exp(-abs(pp.x-.32)*1.2);',
      ' gl_FragColor=vec4(ausgabe(c,q),1.);}'].join('\n');
  }

  /* ---------- 3 FLÜSSIGES METALL: fünf Chromtropfen verschmelzen langsam, Studio-Spiegelung, Akzent im Gegenlicht ---------- */
  function metallFS() {
    return [KOPF,
      'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
      'float sdf(vec3 p){float t=uT*.55;',
      ' float d=length(p-vec3(sin(t*.31)*.22,cos(t*.27)*.18,sin(t*.23)*.12))-.26;',
      ' d=smin(d,length(p-vec3(cos(t*.21+1.)*.34,sin(t*.33+2.)*.26,cos(t*.19)*.18))-.19,.2);',
      ' d=smin(d,length(p-vec3(sin(t*.17+4.)*.36,cos(t*.23+1.)*.3,sin(t*.29+3.)*.15))-.15,.2);',
      ' d=smin(d,length(p-vec3(cos(t*.37+2.)*.25,sin(t*.19+5.)*.34,cos(t*.25+1.)*.2))-.12,.18);',
      ' d=smin(d,length(p-vec3(sin(t*.13+6.)*.3,-cos(t*.29)*.3,0.))-.10,.16);',
      ' return d;}',
      'vec3 nrm(vec3 p){vec2 e=vec2(.001,0.);return normalize(vec3(sdf(p+e.xyy)-sdf(p-e.xyy),sdf(p+e.yxy)-sdf(p-e.yxy),sdf(p+e.yyx)-sdf(p-e.yyx)));}',
      'vec3 umg(vec3 r,vec2 m){float a=smoothstep(.3,.42,r.y)*smoothstep(.98,.75,r.y)*smoothstep(.65,.1,abs(r.x+.25+m.x*.15));',
      ' float b=smoothstep(.55,.72,r.x)*smoothstep(.3,.0,abs(r.y+.05));',
      ' float h=smoothstep(.06,-.02,r.y)*smoothstep(-.5,-.05,r.y);',
      ' float s=smoothstep(.15,.0,abs(r.y-.18))*smoothstep(-.2,-.6,r.x)*.6;',
      ' return vec3(1.)*a*3.+uC*b*3.2+vec3(.05)*h+vec3(.9,.92,1.)*s+uG*1.5+vec3(.006);}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;vec2 m=uM;',
      ' vec2 om=heldPos()-vec2(uR.x/uR.y>1.05?.06:0.,0.);float sk=uR.x/uR.y>1.05?.72:.38;',
      ' vec3 col=uG*.3+vec3(.002,.002,.003);col+=vec3(.6,.62,.7)*.03*exp(-length((p-om)*vec2(.7,1.))*1.7);col+=uC*.03*exp(-length(p-om-vec2(.35,-.1))*2.);',
      ' vec3 ro=vec3(m.x*.12,m.y*.08,3.);vec3 rd=normalize(vec3((p-om)/sk,-2.4));float tt=0.,hit=0.,dmin=9.,tmin=0.;',
      ' for(int i=0;i<80;i++){float h=sdf(ro+rd*tt);if(h<dmin&&tt>1.){dmin=h;tmin=tt;}if(h<.0005){hit=1.;break;}tt+=h*.9;if(tt>6.)break;}',
      ' float px=1.5/(uR.y*.42*sk);float cov=hit>.5?1.:1.-smoothstep(0.,px*tmin,dmin);if(hit<.5&&cov>0.)tt=tmin;',
      ' float sch=exp(-length((p-om-vec2(.03,-.47))*vec2(1.,5.))*3.);col*=1.-.4*sch;',
      ' if(cov>0.){vec3 x=ro+rd*tt;vec3 n=nrm(x);float fr=pow(1.-max(dot(-rd,n),0.),5.);',
      '  vec3 r=reflect(rd,n);vec3 e=umg(r,m);vec3 f0=vec3(.92,.93,.96);',
      '  vec3 mc=e*(f0+(1.-f0)*fr);float ao=clamp(.5+sdf(x+n*.08)*8.,0.,1.);',
      '  col=mix(col,mc*(.55+.45*ao),cov);}',
      ' gl_FragColor=vec4(ausgabe(col,q),1.);}'].join('\n');
  }

  /* ---------- 4 RINGWELLEN: dunkle Fläche in Perspektive, konzentrische Wellen, Lichtpuls läuft nach außen ---------- */
  function wellenFS() {
    return [KOPF,
      'float H(float r,float t){return .045*sin(r*9.-t*.9)*exp(-r*.35);}',
      'float D(float r,float t){return .045*exp(-r*.35)*(9.*cos(r*9.-t*.9)-.35*sin(r*9.-t*.9));}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;vec2 m=uM;',
      ' float a=uR.x/uR.y;vec2 cs=a>1.05?vec2(.38,-.02):vec2(0.,.1);',
      ' vec3 ro=vec3(m.x*.1,1.05+m.y*.05,2.6);vec3 ta=vec3(0.,0.,0.);vec3 f=normalize(ta-ro);vec3 rr=normalize(cross(f,vec3(0.,1.,0.)));vec3 uu=cross(rr,f);',
      ' vec3 rd=normalize(f*1.9+(p.x-cs.x)*rr+(p.y-cs.y+.08)*uu);',
      ' vec3 col=uG*.5+uC*.012;',
      ' if(rd.y<0.){float s=-ro.y/rd.y;vec3 P=ro+rd*s;vec2 w=P.xz;float r=length(w);vec2 dir=w/max(r,1e-3);',
      '  float dh=D(r,t);float puls=mod(t*.45,7.);float pk=exp(-pow(r-puls,2.)*10.)*smoothstep(7.,3.,puls);dh+=pk*.6*(r-puls)*-2.;',
      '  vec3 n=normalize(vec3(-dh*dir.x,1.,-dh*dir.y));',
      '  vec3 rf=reflect(rd,n);',
      '  float soft=smoothstep(.15,.4,rf.y)*smoothstep(.6,.1,abs(rf.x+.1))*smoothstep(-.9,-.3,rf.z);',
      '  float gl=pow(max(dot(rf,normalize(vec3(-.2,.35,-1.))),0.),60.);',
      '  float fr=.03+.97*pow(1.-max(dot(-rd,n),0.),5.);',
      '  vec3 kc=mix(uC,vec3(.55,.7,1.),.3);',
      '  col=uG*.6+uC*.006;col+=kc*(soft*.9+gl*2.)*fr*2.2;',
      '  float kamm=smoothstep(.75,1.,sin(r*9.-t*.9))*exp(-r*.5);col+=uC*kamm*.05;',
      '  col+=mix(uC,vec3(1.),.4)*pk*.22*exp(-r*.2);',
      '  col*=exp(-s*.12);col+=uC*.02*exp(-r*1.2)+mix(uC,vec3(1.),.5)*exp(-r*r*60.)*.5;',
      '  col=mix(col,uG*.5+uC*.01,smoothstep(3.,9.,s));}',
      ' else{col+=uC*.015*exp(-abs(rd.y)*12.);}',
      
      ' vec2 g=p*60.;vec2 id=floor(g);float st=step(.985,h1(id))*smoothstep(.25,0.,length(fract(g)-.5))*(.4+.6*sin(t+h1(id+3.)*30.));col+=vec3(.6,.7,1.)*st*.25*smoothstep(-.2,.4,p.y);',
      ' gl_FragColor=vec4(ausgabe(col,q),1.);}'].join('\n');
  }

  /* ---------- 5 LICHTPORTAL: offene Tür voller Licht im Nebel, Lichtteppich auf dem Boden, Staub im Strahl ---------- */
  function portalFS() {
    return [KOPF,
      'float box(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;vec2 m=uM;',
      ' float a=uR.x/uR.y;vec2 c=a>1.05?vec2(min(.45,a*.5-.3),.04):vec2(0.,uHy-.04);vec2 B=a>1.05?vec2(.085,.23):vec2(.06,.16);float yb=c.y-B.y;',
      ' vec3 licht=mix(vec3(1.,.96,.9),uC,.18);',
      ' float db=box(p-c,B);',
      ' vec3 col=uG*.3+vec3(.002);',
      ' float halo=exp(-max(db,0.)/.01)*.45+exp(-max(db,0.)/.06)*.13+exp(-max(db,0.)/.28)*.035;',
      ' col+=licht*halo;',
      ' if(p.y<yb){float z=yb-p.y;float x=(p.x-c.x)/(B.x+z*1.6);',
      '  float tep=smoothstep(1.05,.8,abs(x))*exp(-z*3.)*1.3;col+=licht*tep*.35;',
      '  vec2 sp=vec2(p.x,yb+z*1.15);float dr=box(sp-c+vec2((n2(vec2(p.y*40.,t*.3))-.5)*.006,0.),B);col+=licht*.16*smoothstep(.02,-.01,dr)*exp(-z*2.5);',
      '  col+=licht*.05*exp(-z*6.)*exp(-abs(p.x-c.x)*3.);}',
      ' vec2 v=p-c;float r=length(v*vec2(1.,.7));',
      ' vec2 nm=p-vec2(m.x*a*.5,m.y*.5);float weg=smoothstep(.0,.35,length(nm));',
      ' float nb=fbm(p*2.2+vec2(t*.04,t*.015))*.7+fbm(p*5.-vec2(t*.06,0.))*.3;',
      ' col+=licht*nb*nb*.32*exp(-r*2.8)*weg;col+=licht*.012*nb*smoothstep(.5,-.6,p.y);',
      ' float ang=atan(v.y,v.x);float st=pow(n2(vec2(ang*14.,t*.08)),4.)*exp(-length(v)*2.5)*smoothstep(0.,.3,length(v));col+=licht*st*.10*smoothstep(c.y+B.y+.1,c.y,p.y);',
      ' vec2 g=(p+vec2(0.,t*.012))*70.;vec2 id=floor(g);float sp2=step(.97,h1(id))*smoothstep(.3,0.,length(fract(g)-.5-vec2(sin(t*.3+h1(id)*9.)*.2,0.)));',
      ' col+=licht*sp2*exp(-r*3.)*.6;',
      ' if(db<0.){float in_=-db;col=licht*2.6*(1.-.15*smoothstep(0.,.08,in_))+licht*.6;}',
      ' gl_FragColor=vec4(ausgabe(col,q),1.);}'].join('\n');
  }

  /* ---------- 6 GLAS-STUDIO: drei dünne Glasscheiben im Spotlicht auf spiegelndem Boden (Prinzip Draftwise) ---------- */
  function glasFS() {
    return [KOPF,
      'float box3(vec3 p,vec3 b){vec3 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,max(d.y,d.z)),0.);}',
      'float sdf(vec3 p){float t=uT*.08;float a=uM.x*.35;float d=9.;',
      ' for(int i=0;i<3;i++){float fi=float(i);vec3 c=vec3((fi-1.)*.3,0.,(1.-fi)*.16);',
      '  float an=(fi-1.)*.62+sin(t+fi*1.7)*.2+a*(.6+.2*fi);vec3 q=p-c;float ca=cos(an),sa=sin(an);q.xz=vec2(ca*q.x-sa*q.z,sa*q.x+ca*q.z);',
      '  d=min(d,box3(q,vec3(.15,.27,.011))-.005);}',
      ' return d;}',
      'vec3 nrm(vec3 p){vec2 e=vec2(.001,0.);return normalize(vec3(sdf(p+e.xyy)-sdf(p-e.xyy),sdf(p+e.yxy)-sdf(p-e.yxy),sdf(p+e.yyx)-sdf(p-e.yyx)));}',
      'vec3 umg(vec3 r){float a=smoothstep(.3,.45,r.y)*smoothstep(.98,.7,r.y)*smoothstep(.8,.1,abs(r.x+.15));',
      ' float b=smoothstep(.55,.72,r.x)*smoothstep(.35,0.,abs(r.y-.05));float c=smoothstep(-.5,-.7,r.x)*smoothstep(.3,0.,abs(r.y-.15));',
      ' return vec3(1.)*a*4.5+uC*b*3.4+vec3(.85,.9,1.)*c*1.1+uG*1.5+vec3(.008);}',
      'vec3 bg(vec3 d){return uG*.4+vec3(.004)+mix(uC,vec3(1.),.5)*.006*exp(-abs(d.y-.12)*4.);}',
      'vec4 panes(vec3 o,vec3 d,float tmax){vec3 acc=vec3(0.);float thr=1.;',
      ' for(int k=0;k<4;k++){float s=0.;float h=1.;float hit=0.;',
      '  for(int i=0;i<48;i++){h=sdf(o+d*s);if(h<.0007){hit=1.;break;}s+=h;if(s>tmax)break;}',
      '  if(hit<.5||s>tmax)break;',
      '  vec3 x=o+d*s;vec3 n=nrm(x);float c=abs(dot(d,n));float fr=.05+.95*pow(1.-c,5.);float ed=pow(1.-c,3.);',
      '  acc+=thr*(umg(reflect(d,n))*fr*1.5+mix(uC,vec3(1.),.4)*ed*.7);',
      '  thr*=(1.-fr)*.93;o=x+d*.05;tmax-=s+.05;if(tmax<0.)break;}',
      ' return vec4(acc,thr);}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;',
      ' float a_=uR.x/uR.y;vec2 om=heldPos();float sk=a_>1.5?.8:(a_>1.05?.6:.62);',
      ' vec3 ro=vec3(0.,.85,3.0);vec3 rd=vec3((p-om)/sk,-2.4);float cs=cos(.3),sn=sin(.3);rd=normalize(vec3(rd.x,rd.y*cs+rd.z*sn,-rd.y*sn+rd.z*cs));',
      ' float tf=rd.y<-.001?(-.275-ro.y)/rd.y:1e3;',
      ' vec4 pr=panes(ro,rd,min(tf,7.));vec3 beh;',
      ' if(rd.y<-.001){vec3 P=ro+rd*tf;vec3 rr=vec3(rd.x,-rd.y,rd.z);float fr=.04+.96*pow(1.+rd.y,3.);',
      '  vec4 p2=panes(P+vec3(0.,.002,0.),rr,6.);vec3 rf=p2.rgb+p2.a*bg(rr);',
      '  vec2 pz=P.xz*vec2(1.,1.1);float sp=exp(-dot(pz,pz)*3.2);float fall=exp(-length(P.xz)*.35);',
      '  beh=uG*.4+vec3(.004)+mix(uC,vec3(1.),.35)*sp*.2+rf*(.18+.7*fr)*fall;',
      '  beh=mix(beh,bg(rd),smoothstep(3.,8.,tf));}',
      ' else beh=bg(rd);',
      ' vec3 col=pr.rgb+pr.a*beh;',
      ' gl_FragColor=vec4(ausgabe(col,q),1.);}'].join('\n');
  }

  /* ---------- 7 SONNE: Plasma-Kugel mit Granulation, weichen Sonnenflecken, Korona und Protuberanzen (Prinzip Sun Timeline) ---------- */
  function sonneFS() {
    return [KOPF,
      'float n3(vec3 p){float z0=floor(p.z);float fz=fract(p.z);fz=fz*fz*(3.-2.*fz);return mix(n2(p.xy+z0*31.7),n2(p.xy+(z0+1.)*31.7),fz);}',
      'float fb3(vec3 p){return n3(p)*.5+n3(p*2.1+5.)*.27+n3(p*4.3+9.)*.14+n3(p*8.7+2.)*.07;}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;vec2 m=uM;',
      ' float a_=uR.x/uR.y;vec2 om=heldPos();float R=a_>1.5?.3:(a_>1.05?.235:.19);',
      ' vec2 v=(p-om)/R;float r=length(v);float ang=atan(v.y,v.x);',
      ' vec3 licht=mix(vec3(1.,.36,.07),uC,.18);vec3 heiss=mix(vec3(1.,.74,.4),uC,.12);',
      ' vec3 col=uG*.35+vec3(.003);',
      ' float ex=max(r-1.,0.);',
      ' vec2 ad=vec2(cos(ang),sin(ang));float st=pow(n2(ad*3.+t*.03)*.6+n2(ad*7.+3.+t*.02)*.4,2.5);',
      ' float kor=exp(-ex*6.)*.45+exp(-ex*2.2)*.09+st*exp(-ex*2.6)*.22+.012*exp(-ex*.6);',
      ' col+=mix(licht,heiss,exp(-ex*12.))*kor*smoothstep(.9,1.,r+.06);',
      ' float pro=pow(n2(ad*3.5+vec2(t*.04,2.)),7.)*smoothstep(1.18,1.,r)*smoothstep(.97,1.01,r)*1.6;col+=licht*pro;',
      ' float cov=1.-smoothstep(.985,1.,r);',
      ' if(cov>0.){float z=sqrt(max(1.-r*r,0.));vec3 n=vec3(v,z);n=rot(t*.03+m.x*.4,m.y*.3)*n;',
      '  float verz=fb3(n*2.6+4.);float g1=fb3(n*3.4+verz*.8+vec3(0.,t*.05,0.));',
      '  float g2=fb3(n*16.+verz*1.2+vec3(t*.07,0.,3.));float g3=fb3(n*34.+vec3(0.,t*.1,9.));',
      '  float heat=.5+.95*(g1-.5)+.85*(g2-.5)+.5*(g3-.5);',
      '  float sf=n3(n*1.9+7.);float pen=smoothstep(.55,.74,sf);float um=smoothstep(.7,.8,sf);',
      '  heat=heat-pen*.28-um*.3;',
      '  float ld=.1+.9*pow(z,.95);',
      '  vec3 lo=vec3(.16,.02,.003);vec3 sc=mix(lo,licht*.82,smoothstep(.1,.55,heat));sc=mix(sc,heiss,smoothstep(.7,1.0,heat)*.6);',
      '  sc*=ld*1.1;sc+=licht*pow(1.-z,4.)*.15;',
        '  col=mix(col,sc,cov);}',
      ' vec2 g=p*70.;vec2 id=floor(g);float s=step(.985,h1(id))*(1.-smoothstep(0.,.28,length(fract(g)-.5)))*(.4+.6*sin(t+h1(id+3.)*30.));col+=vec3(.8,.85,1.)*s*.3*step(1.4,r);',
      ' gl_FragColor=vec4(ausgabe(col,q),1.);}'].join('\n');
  }

  /* ---------- 8 GLAS-FACETTEN: zersprungener Glasblock – jeder Splitter bricht ein gemeinsames Lichtfeld mit eigenem Versatz und Farbaufspaltung (Prinzip Facet Glass) ---------- */
  function facettenFS() {
    return [KOPF,
      'vec2 h2(vec2 p){return vec2(h1(p),h1(p+17.3));}',
      'vec3 feld(vec2 x,float t){float orb=exp(-length((x-vec2(.04,-.02))*vec2(1.,1.3))*2.6);',
      ' float b1=exp(-pow((x.x*.85+x.y*.55+.12+sin(t*.07)*.05)*7.,2.));float b2=exp(-pow((x.x*.85+x.y*.55-.38)*10.,2.));',
      ' vec3 w=vec3(.95,.97,1.);return uG*.3+vec3(.003)+mix(uC,w,.3)*orb*orb*.85+w*b1*.55*(.12+orb)+uC*b2*.5*(.08+orb)+uC*.04*exp(-length(x)*1.4);}',
      'void main(){vec2 q=gl_FragCoord.xy/uR;vec2 p=(gl_FragCoord.xy-.5*uR)/uR.y;float t=uT;vec2 m=uM;',
      ' float a_=uR.x/uR.y;vec2 om=heldPos()+vec2(-.03,0.);float sc=a_>1.05?4.6:6.5;vec2 pc=p-om;',
      ' vec2 g=pc*sc;vec2 ig=floor(g),fg=fract(g);float d1=9.,d2=9.;vec2 id=vec2(0.);',
      ' for(int j=-1;j<=1;j++){for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 rr=h2(ig+o);rr=.5+.38*sin(t*.12+6.2831*rr);vec2 d=o+rr-fg;float dd=dot(d,d);',
      '  if(dd<d1){d2=d1;d1=dd;id=ig+o;}else if(dd<d2){d2=dd;}}}',
      ' float e=sqrt(d2)-sqrt(d1);',
      ' vec2 g2=pc*sc*3.1+7.;vec2 i2=floor(g2),f2=fract(g2);float a1=9.,a2=9.;for(int j=-1;j<=1;j++){for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 r2=h2(i2+o+40.);vec2 d=o+r2-f2;float dd=dot(d,d);if(dd<a1){a2=a1;a1=dd;}else if(dd<a2){a2=dd;}}}',
      ' float haar=sqrt(a2)-sqrt(a1);',
      ' float msk=smoothstep(.8,.2,length(pc*vec2(.85,1.)));float keep=step(h1(id+9.)*.85,msk);',
      ' vec2 hr=h2(id);vec2 kn=(hr-.5)*.9+vec2(sin(t*.1+hr.x*6.),cos(t*.09+hr.y*6.))*.1+m*vec2(.15,.12);',
      ' vec2 uv=pc+kn*.3;vec2 ch=kn*.05;',
      ' vec3 col=vec3(feld(uv+ch,t).r,feld(uv,t).g,feld(uv-ch,t).b);',
      ' vec3 n=normalize(vec3(kn,1.));float sp=pow(max(dot(n,normalize(vec3(-.4,.6,.7))),0.),80.);',
      ' col+=vec3(1.)*sp*.8;',
      ' col=mix(col,vec3(.003),smoothstep(.03,.0,e)*.8);col+=mix(uC,vec3(1.),.6)*smoothstep(.025,.06,e)*smoothstep(.14,.06,e)*.3*(.3+hr.y);',
      ' col*=1.-.55*smoothstep(.035,.0,haar)*step(.55,hr.x);',
      ' col*=mix(.22,1.,smoothstep(-.5,.12,pc.x));',
      ' vec3 dunkel=feld(pc,t)*.25*mix(.3,1.,smoothstep(-.5,.12,pc.x));',
      ' col=mix(dunkel,col,keep);',
      ' gl_FragColor=vec4(ausgabe(col,q),1.);}'].join('\n');
  }

  var PRO2 = { prismapro: prismaFS, neonpro: neonFS, metallpro: metallFS, wellenpro: wellenFS, portalpro: portalFS, glasstudio: glasFS, sonnepro: sonneFS, facettenpro: facettenFS };
  window.HG_PRO2 = PRO2;
  window.HG_START = function (cv, key, G, C, opt) {
    if (!PRO2[key]) return alt ? alt(cv, key, G, C, opt) : null;
    return start(cv, PRO2[key](), G, C, key);
  };

  function start(cv, fsrc, G, C, key) {
    var gl = null; try { gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, premultipliedAlpha: false, powerPreference: 'high-performance' }); } catch (e) { }
    if (!gl) return null;
    var hp = false; try { var pf = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT); hp = !!(pf && pf.precision > 0); } catch (e) { }
    function S(ty, src) { var o = gl.createShader(ty); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn('HG-PRO2 ' + key, gl.getShaderInfoLog(o)); return null; } return o; }
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
    var schwer = /^(prismapro|metallpro|glasstudio|portalpro|sonnepro|neonpro|facettenpro)$/.test(key);
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
