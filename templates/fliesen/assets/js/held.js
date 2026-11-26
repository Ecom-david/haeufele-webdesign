/* Kachelwerk Brandl – Held-Objekt: bodengleiche Duschecke in Echtzeit-3D (KINO-Engine).
   Kapitel: fertige Dusche · Rohbau · Abdichtung (2 Lagen + Dichtband) · Fliese für Fliese ·
   Makro Silikon-/Zementfuge · Format + Fugenfarbe live, „Gedrückt halten: Wasser an“ · Fahrt in die Wand. */
(function () {
  'use strict';
  var buehne = document.getElementById('buehne'), strecke = document.getElementById('kino');
  if (!buehne || !window.KINO) return;
  var KINO = window.KINO, sstep = KINO.sstep, clamp = KINO.clamp, ease = KINO.ease;
  var hoch = innerHeight > innerWidth * 1.05;
  if (!window.__lenis && window.Lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches) { try { window.__lenis = new Lenis({ lerp: .1, wheelMultiplier: .9, autoRaf: true, anchors: { offset: -10 } }); } catch (e) { } }
  var BX = 1.4, BZ = 1.4, HW = 2.2, FUGE = .003, ZF = .0105;   // Wandfläche, Raumhöhe Fliesen, Fuge, Fliesenmitte vor Rohwand
  var FORMATE = { f3060: { w: .6, h: .3, n: '30 × 60' }, f6060: { w: .6, h: .6, n: '60 × 60' }, f60120: { w: .6, h: 1.2, n: '60 × 120' }, f120: { w: 1.2, h: 1.2, n: '120 × 120' } };
  var STEINE = { hell: { dunkel: '#E9E2D7', hell: '#8A8076', pore: 0, rau: .8, relief: .04, lack: .14, lackRau: .28 }, nero: { hell: '#B5AFA6', dunkel: '#232120', pore: 0, rau: .8, relief: .04, lack: .14, lackRau: .28 } };
  var FUGEN = { hell: '#B9B3AA', grau: '#6E6A64', anthrazit: '#2E2C2A' };
  var S = { fmt: 'f60120', fuge: 'grau', wasser: 0, halt: false, neu: 0 };

  // Kamera als Blick auf die Duschecke: Winkel um die Ecke (az), Höhe (el), Abstand, seitlicher Versatz (Objekt rechts vom Text)
  function blick(p, az, el, dist, shift, fov, c) {
    c = c || [.6, 1.08, .6]; az *= Math.PI / 180; el *= Math.PI / 180;
    var d = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)], r = [d[2], 0, -d[0]], L = Math.hypot(r[0], r[2]);
    r = [r[0] / L, 0, r[2] / L]; if (hoch) { shift = 0; dist *= 1.18; }
    var z = [c[0] - r[0] * shift, c[1], c[2] - r[2] * shift];
    return { p: p, pos: [z[0] + d[0] * dist, z[1] + d[1] * dist, z[2] + d[2] * dist], ziel: z, fov: fov || 30 };
  }
  var mak = hoch ? { pos: [.40, 1.30, .40], ziel: [.02, 1.2, .02] } : { pos: [.40, 1.28, .36], ziel: [-.03, 1.19, .09] };
  var cam = [
    blick(0, 42, 11, 5.8, .8), blick(.08, 42, 11, 5.8, .8),
    blick(.16, 50, 22, 5.6, .75), blick(.24, 52, 22, 5.5, .75),
    blick(.30, 40, 12, 3.9, .5, 30, [.5, .95, .5]), blick(.38, 38, 12, 3.8, .5, 30, [.5, .95, .5]),
    blick(.46, 42, 13, 5.8, .8), blick(.62, 46, 13, 5.9, .8),
    { p: .69, pos: mak.pos, ziel: mak.ziel, fov: 30 }, { p: .77, pos: [mak.pos[0] - .03, mak.pos[1] - .01, mak.pos[2] - .04], ziel: mak.ziel, fov: 30 },
    blick(.84, 36, 10, 5.6, .8), blick(.93, 36, 10, 5.6, .8),
    { p: 1, pos: [.75, 1.25, .62], ziel: [.75, 1.25, 0], fov: 26 }
  ];

  var fliesen = [], fugen = [], tex, fMat, fugeMat, membran = [], band = [], wasserPts, labs = {}, geladen = false, boden, K0;

  var K = KINO.start({
    buehne: buehne, strecke: strecke, akzent: '#E3A374', licht: '#fff3e8', lichtStaerke: 2.8, kanteStaerke: 1.0, umgebung: .6, belichtung: 1.0, schattenGroesse: 2.2, lichtPos: [3.0, 4.2, 3.4], lichtZiel: [.6, .8, .6],
    labelEbene: document.getElementById('labels'), kamera: cam,
    bau: function (K) {
      var THREE = K.THREE, w = K.welt; K0 = K;
      tex = K.textur(window.STEIN_TEX, {}, function () { geladen = true; S.e0 = performance.now(); K.wach(5000); });
      fMat = K.holz(tex, STEINE.hell);
      var mauerMat = K.holz(tex, { hell: '#837D75', dunkel: '#6A655F', pore: .2, rau: 1.8, relief: .3 });
      var estrichMat = K.holz(tex, { hell: '#7C766F', dunkel: '#615C56', pore: .2, rau: 1.8, relief: .3 });
      fugeMat = K.mat({ color: FUGEN.grau, roughness: .9, metalness: 0, key: 'fuge' });
      var silMat = K.mat({ color: '#5E5A55', roughness: .35, metalness: 0, key: 'sil' });
      var membMat = K.mat({ color: '#3D6075', roughness: .55, metalness: 0, key: 'memb' }), bandMat = K.mat({ color: '#D2CDC4', roughness: .95, metalness: 0, key: 'band' });
      var edel = K.mat({ color: '#cfcfcc', metalness: 1, roughness: .28, key: 'edel' }), kupfer = K.mat({ color: '#C08154', metalness: 1, roughness: .3, key: 'kupfer' }), dunkel = K.mat({ color: '#0d0c0b', roughness: .6, key: 'dk' });
      var glas = new THREE.MeshPhysicalMaterial({ color: '#e6efed', metalness: 0, roughness: .02, transparent: true, opacity: .07, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: .5 });
      // Rohbau als Schnittmodell: Wände + Decke darunter
      var m1 = K.brett(BX + .17, HW + .15, .17, mauerMat, { faser: 'x', vs: 1, meter: 1.2 }); m1.position.set((BX + .17) / 2 - .17, (HW + .15) / 2, -.085); w.add(m1);
      var m2 = K.brett(.17, HW + .15, BZ, mauerMat, { faser: 'z', vs: 1, meter: 1.2 }); m2.position.set(-.085, (HW + .15) / 2, BZ / 2); w.add(m2);
      boden = new THREE.Group(); boden.rotation.x = -.02; w.add(boden);   // 2 % Gefälle zur Rinne an der Rückwand
      var es = K.brett(BX + .17, .08, BZ + .17, estrichMat, { faser: 'x', vs: 1, meter: 1.2 }); es.position.set((BX + .17) / 2 - .17, -.04, (BZ + .17) / 2 - .17); boden.add(es);
      // Abdichtung (wird von unten nach oben aufgetragen: Schnittebene wandert)
      var cpW = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), cpB = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
      var mw = membMat.clone(); mw.clippingPlanes = [cpW]; var mb = membMat.clone(); mb.clippingPlanes = [cpB];
      [mw, mb].forEach(function (m) { m.onBeforeCompile = membMat.onBeforeCompile; m.customProgramCacheKey = membMat.customProgramCacheKey; });
      var a1 = new THREE.Mesh(new THREE.BoxGeometry(BX, HW, .002), mw); a1.position.set(BX / 2, HW / 2, .001); w.add(a1);
      var a2 = new THREE.Mesh(new THREE.BoxGeometry(.002, HW, BZ), mw); a2.position.set(.001, HW / 2, BZ / 2); w.add(a2);
      var a3 = new THREE.Mesh(new THREE.BoxGeometry(BX, .002, BZ), mb); a3.position.set(BX / 2, .001, BZ / 2); boden.add(a3);
      membran = [cpW, cpB];
      // Dichtband: Innenecke senkrecht + Übergänge Wand/Boden
      [[.06, HW, .0025, .03, HW / 2, .0035, w], [.0025, HW, .06, .0035, HW / 2, .03, w], [BX, .12, .0025, BX / 2, .06, .0035, w], [.0025, .12, BZ, .0035, .06, BZ / 2, w]].forEach(function (q) {
        var m = new THREE.Mesh(new THREE.BoxGeometry(q[0], q[1], q[2]), bandMat); m.position.set(q[3], q[4], q[5]); m.castShadow = true; q[6].add(m); band.push(m);
      });
      // Rinne mit Rost (Edelstahl), an der Rückwand
      var rinne = new THREE.Group(); var rk = K.brett(BX - .2, .006, .07, edel, { r: .002 }); rk.position.set(BX / 2, .013, .05); rinne.add(rk);
      for (var i = 0; i < 36; i++) { var sl = new THREE.Mesh(new THREE.BoxGeometry(.018, .002, .004), dunkel); sl.position.set(.16 + i * ((BX - .32) / 35), .0165, .05); rinne.add(sl); }
      boden.add(rinne);
      // Fugen-Ebenen (Fugenfarbe) hinter der Fliesenoberfläche
      var g1 = new THREE.Mesh(new THREE.PlaneGeometry(BX, HW), fugeMat); g1.position.set(BX / 2, HW / 2, ZF + .0025); w.add(g1);
      var g2 = new THREE.Mesh(new THREE.PlaneGeometry(BZ, HW), fugeMat); g2.position.set(ZF + .0025, HW / 2, BZ / 2); g2.rotation.y = Math.PI / 2; w.add(g2);
      var g3 = new THREE.Mesh(new THREE.PlaneGeometry(BX, BZ - .1), fugeMat); g3.position.set(BX / 2, ZF + .0025, .1 + (BZ - .1) / 2); g3.rotation.x = -Math.PI / 2; boden.add(g3);
      fugen = [g1, g2, g3];
      // Silikonfugen (Wartungsfugen) in Ecken und am Boden
      function sil(len, ax, x, y, z, par) { var g = new THREE.CylinderGeometry(.0035, .0035, len, 10); var m = new THREE.Mesh(g, silMat); if (ax === 'x') m.rotation.z = Math.PI / 2; if (ax === 'z') m.rotation.x = Math.PI / 2; m.position.set(x, y, z); (par || w).add(m); return m; }
      var sils = [sil(HW, 'y', ZF + .005, HW / 2, ZF + .005), sil(BX, 'x', BX / 2, ZF + .02, ZF + .005, w), sil(BZ - .1, 'z', ZF + .005, ZF + .02, .1 + (BZ - .1) / 2, boden)];
      S.sils = sils;
      // Armaturen: Unterputz-Thermostat links, Kopfbrause an der Rückwand
      var th = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .012, 64), kupfer); th.rotation.z = Math.PI / 2; th.position.set(.022, 1.05, .62); w.add(th);
      var gr = new THREE.Mesh(new THREE.CylinderGeometry(.022, .024, .05, 40), kupfer); gr.rotation.z = Math.PI / 2; gr.position.set(.05, 1.05, .62); w.add(gr);
      var arm = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .42, 24), kupfer); arm.rotation.x = Math.PI / 2; arm.position.set(.62, 2.05, .23); w.add(arm);
      var kb = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .01, 72), kupfer); kb.position.set(.62, 2.03, .45); w.add(kb);
      var kbd = new THREE.Mesh(new THREE.CircleGeometry(.135, 72), dunkel); kbd.rotation.x = Math.PI / 2; kbd.position.set(.62, 2.024, .45); w.add(kbd);
      [th, gr, arm, kb].forEach(function (m) { m.castShadow = true; });
      // Glas (Walk-in) + Stabilisator
      var gl = new THREE.Mesh(new THREE.BoxGeometry(.008, 2.0, 1.0), glas); gl.position.set(1.12, 1.0 + .03, .5 + .015); w.add(gl);
      var stab = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .5, 20), kupfer); stab.rotation.x = Math.PI / 2; stab.position.set(1.12, 2.0, .25); w.add(stab);
      var pr = K.brett(.03, .03, 1.02, kupfer, { r: .003 }); pr.position.set(1.12, .045, .5); boden.add(pr);
      S.glas = [gl, stab, pr];
      // Wasser (Punkte fallen aus der Kopfbrause)
      var N = K.mob ? 700 : 1600, pa = new Float32Array(N * 3), pr2 = new Float32Array(N);
      for (var j = 0; j < N; j++) { var r = Math.sqrt(Math.random()) * .13, a = Math.random() * 6.283; pa.set([.62 + Math.cos(a) * r, 2.02, .45 + Math.sin(a) * r], j * 3); pr2[j] = Math.random(); }
      var wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(pa, 3)); wg.setAttribute('aR', new THREE.BufferAttribute(pr2, 1));
      var wm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: K.U.uT, uW: { value: 0 }, uPx: K.U.uPx },
        vertexShader: 'attribute float aR;uniform float uT,uW,uPx;varying float vA;void main(){float f=fract(uT*1.15+aR*7.31);vec3 p=position;p.y-=f*f*2.0+f*.2;p.x+=(p.x-.62)*f*.35;p.z+=(p.z-.45)*f*.35;p.y=max(p.y,.02);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uPx*(1.2+aR)*(2.0/-mv.z);vA=uW*(.35+.65*aR)*smoothstep(0.,.08,f)*step(p.y,2.);}',
        fragmentShader: 'varying float vA;void main(){vec2 d=gl_PointCoord-.5;d.y*=.45;float r=length(d)*2.;if(r>1.)discard;gl_FragColor=vec4(vec3(.75,.85,.88)*exp(-r*r*3.)*vA,1.);}' });
      wasserPts = new THREE.Points(wg, wm); wasserPts.frustumCulled = false; w.add(wasserPts);

      fliesenLegen(S.fmt, true);
      // Beschriftungen
      labs.memb = K.label(w, [.45, .95, .002], 'Verbundabdichtung · 2 Lagen, DIN 18534');
      labs.band = K.label(w, [.003, 1.75, .03], 'Dichtband · in jeder Ecke', 'nm');
      labs.rinne = K.label(boden, [1.1, .02, .05], 'Rinne · mit Dichtmanschette', 'r');
      labs.gef = K.label(boden, [.95, .02, 1.1], 'Gefälle 2 % zur Rinne', 'r nm');
      labs.sil = K.label(w, [ZF + .006, 1.12, ZF + .006], 'Silikon · Wartungsfuge');
      labs.zf = K.label(w, [.3, 1.2, ZF + .004], 'Zementfuge · 3 mm', 'r');
      labs.fl = K.label(w, [.9, 1.6, ZF + .005], 'Feinsteinzeug · Natursteinoptik', 'r');
      // Entstehen
      var ms = []; w.traverse(function (o) { if (o.isMesh && o.material !== glas && o.geometry.attributes.position.count > 20) ms.push(o); });
      S.pts = K.partikel(ms, K.mob ? 1300 : 2600, '#E7B48A', { zentrum: new THREE.Vector3(.6, 1, .6), radius: 2 });
      K.U.uDissY.value.set(-.1, 2.3);
      var sofort = K.reduce || K.still; K.U.uDiss.value = sofort ? 1 : 0;
      S.pts.setze(sofort ? 1 : 0, sofort ? 0 : 1);

      var live = { n: document.getElementById('lv-n'), f: document.getElementById('lv-f'), ab: document.getElementById('lv-ab'), wa: document.getElementById('lv-wa') }, lt = 0;
      var kaps = Array.prototype.slice.call(document.querySelectorAll('.kap')), rail = Array.prototype.slice.call(document.querySelectorAll('.schiene button'));
      var riese = document.getElementById('riese'), wahl = document.getElementById('formwahl'), vorhang = document.getElementById('vorhang'), nTxt = document.getElementById('k-anzahl');
      return {
        lebt: function () { return S.halt || S.wasser > .002 || performance.now() - S.neu < 1600 || (geladen && performance.now() - S.e0 < 4200); },
        update: function (p, K) {
          var now = performance.now();
          if (geladen && !K.reduce && !K.still) { var e = (now - S.e0) / 1000; S.pts.setze(sstep(0, 2.3, e), 1 - sstep(2.5, 3.7, e)); K.U.uDiss.value = sstep(1.1, 3.5, e); }
          // Abdichtung + Band
          var ab = p < .1 ? 1 : sstep(.27, .37, p), bd = p < .1 ? 1 : sstep(.31, .38, p);
          cpW.constant = -.001 + ab * (HW + .01); cpW.normal.set(0, -1, 0); cpW.constant = ab * (HW + .02) - .01;
          cpB.constant = -.01 + ab * (BX + .02);
          band.forEach(function (m) { m.scale.set(1, Math.max(.001, bd), 1); m.visible = bd > .002; });
          // Fliesen: fliegen bei .08–.14 weg, ab .42 Fliese für Fliese zurück
          var neuT = clamp((now - S.neu) / 1300, 0, 1);
          for (var i = 0; i < fliesen.length; i++) {
            var f = fliesen[i], st;
            if (p < .3) st = 1 - sstep(.08 + f.k * .04, .12 + f.k * .04, p); else st = sstep(.42 + f.k * .17, .45 + f.k * .17, p);
            if (S.neu && p > .3) st = Math.min(st, clamp(neuT * 1.6 - f.k * .6, 0, 1));
            var se = ease(st);
            f.m.visible = st > .001;
            f.m.position.copy(f.b).addScaledVector(f.n, (1 - se) * .55);
            f.m.rotation.set(f.r.x + (1 - se) * f.dr.x, f.r.y + (1 - se) * f.dr.y, f.r.z + (1 - se) * f.dr.z);
          }
          var fsicht = p < .3 ? 1 - sstep(.08, .16, p) : sstep(.42, .6, p);
          fugen.forEach(function (g) { g.visible = fsicht > .02; }); S.sils.forEach(function (m) { m.visible = fsicht > .98; });
          S.glas.forEach(function (m) { m.visible = p < .09 || p > .62; });
          // Wasser per Gedrückthalten
          S.wasser += ((S.halt ? 1 : 0) - S.wasser) * (1 - Math.pow(S.halt ? .02 : .003, K.dt));
          wasserPts.material.uniforms.uW.value = S.wasser; wasserPts.visible = S.wasser > .002;
          // Beschriftungen
          var abk = p > .29 && p < .4, flk = p > .58 && p < .64, mk = p > .67 && p < .79;
          labs.memb.ziel = labs.band.ziel = labs.rinne.ziel = abk ? 1 : 0; labs.gef.ziel = (abk || flk) ? 1 : 0;
          labs.sil.ziel = labs.zf.ziel = mk ? 1 : 0; labs.fl.ziel = flk ? 1 : 0;
          var aktiv = -1;
          kaps.forEach(function (k, i) { var a = +k.dataset.a, b = +k.dataset.b, v = sstep(a - .035, a, p) * (1 - sstep(b, b + .035, p)); if (i === 0) v = 1 - sstep(b, b + .035, p); k.style.opacity = v.toFixed(3); k.style.transform = 'translate3d(0,' + ((1 - v) * 24).toFixed(1) + 'px,0)'; k.classList.toggle('an', v > .5); if (v > .5) aktiv = i; });
          rail.forEach(function (r, i) { r.classList.toggle('an', i === aktiv); });
          if (riese) { riese.style.opacity = (.9 * (1 - sstep(.08, .15, p)) + .5 * sstep(.8, .85, p) * (1 - sstep(.93, .97, p))).toFixed(3); riese.style.transform = 'translate3d(0,' + (-p * 60).toFixed(1) + 'px,0)'; }
          if (wahl) wahl.classList.toggle('an', p > .81 && p < .95);
          if (vorhang) vorhang.style.opacity = sstep(.955, 1, p).toFixed(3);
          if (now - lt > 90) {
            lt = now; var gelegt = 0; fliesen.forEach(function (f) { if (f.m.visible && f.m.position.distanceToSquared(f.b) < 1e-6) gelegt++; });
            if (live.n) live.n.textContent = String(gelegt).padStart(3, '0');
            if (live.ab) live.ab.textContent = String(Math.round(ab * 100)).padStart(3, '0');
            if (live.wa) live.wa.textContent = (S.wasser * 9.0).toFixed(1).replace('.', ',');
            if (nTxt) nTxt.textContent = fliesen.length;
          }
        }
      };
    }
  });
  if (!K) { document.documentElement.classList.add('kino-aus'); return; }
  window.__kino = K;

  /* Fliesen nach Format verlegen: Wände ab Boden + Innenecke, Boden vor der Rinne; Reste werden geschnitten */
  function fliesenLegen(fk, erst) {
    var THREE = K0.THREE, w = K0.welt, F = FORMATE[fk];
    fliesen.forEach(function (f) { f.m.parent.remove(f.m); f.m.geometry.dispose(); }); fliesen = [];
    function reihe(len, gr) { var r = [], x = 0; while (x < len - .01) { var l = Math.min(gr, len - x); r.push([x, l]); x += gr; } return r; }
    var dick = .009, liste = [];
    // Rückwand (z = 0), Fliese w breit, h hoch
    reihe(HW, F.h).forEach(function (y, iy) { reihe(BX, F.w).forEach(function (x, ix) { liste.push({ fl: 'r', x: x, y: y, iy: iy, ix: ix }); }); });
    reihe(HW, F.h).forEach(function (y, iy) { reihe(BZ, F.w).forEach(function (z, iz) { liste.push({ fl: 'l', x: z, y: y, iy: iy, ix: iz }); }); });
    reihe(BZ - .1, Math.min(F.h, 1.2)).forEach(function (z, iz) { reihe(BX, F.w).forEach(function (x, ix) { liste.push({ fl: 'b', x: x, y: z, iy: iz, ix: ix }); }); });
    // Reihenfolge: Boden, dann Wände von unten nach oben
    liste.sort(function (a, b) { var o = { b: 0, r: 1, l: 1 }; return (o[a.fl] - o[b.fl]) || (a.iy - b.iy) || (a.ix - b.ix); });
    liste.forEach(function (q, i) {
      var lw = q.x[1] - FUGE, lh = q.y[1] - FUGE, m, n = new THREE.Vector3(), par = w;
      if (q.fl === 'r') { m = K0.brett(lw, lh, dick, fMat, { faser: 'x', vs: 1, meter: 1.2, r: .0012 }); m.position.set(q.x[0] + q.x[1] / 2, q.y[0] + q.y[1] / 2, ZF); n.set(0, 0, 1); }
      else if (q.fl === 'l') { m = K0.brett(dick, lh, lw, fMat, { faser: 'z', vs: 1, meter: 1.2, r: .0012 }); m.position.set(ZF, q.y[0] + q.y[1] / 2, q.x[0] + q.x[1] / 2); n.set(1, 0, 0); }
      else { m = K0.brett(lw, dick, lh, fMat, { faser: 'x', vs: 1, meter: 1.2, r: .0012 }); m.position.set(q.x[0] + q.x[1] / 2, ZF, .1 + q.y[0] + q.y[1] / 2); n.set(0, 1, 0); par = boden; }
      par.add(m);
      var t = { m: m, b: m.position.clone(), n: n, k: i / Math.max(1, liste.length - 1), r: m.rotation.clone(), dr: new THREE.Vector3((Math.random() - .5) * .9, (Math.random() - .5) * .9, (Math.random() - .5) * .5) };
      fliesen.push(t);
    });
    if (!erst) { S.neu = performance.now(); K.wach(1800); }
    var lf = document.getElementById('lv-f'); if (lf) lf.textContent = F.n;
  }
  Array.prototype.forEach.call(document.querySelectorAll('#formwahl [data-fmt]'), function (b) {
    b.addEventListener('click', function () { if (S.fmt === b.dataset.fmt) return; S.fmt = b.dataset.fmt; fliesenLegen(S.fmt); Array.prototype.forEach.call(document.querySelectorAll('#formwahl [data-fmt]'), function (x) { x.setAttribute('aria-pressed', x === b); }); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#formwahl [data-stein]'), function (b) {
    b.addEventListener('click', function () { fMat.setArt(STEINE[b.dataset.stein]); K.wach(300); Array.prototype.forEach.call(document.querySelectorAll('#formwahl [data-stein]'), function (x) { x.setAttribute('aria-pressed', x === b); }); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#formwahl [data-fuge]'), function (b) {
    b.addEventListener('click', function () { S.fuge = b.dataset.fuge; fugeMat.color.set(FUGEN[S.fuge]); K.wach(300); Array.prototype.forEach.call(document.querySelectorAll('#formwahl [data-fuge]'), function (x) { x.setAttribute('aria-pressed', x === b); }); });
  });
  var halt = document.getElementById('halten');
  if (halt) {
    var an = function (e) { e.preventDefault(); S.halt = true; halt.classList.add('aktiv'); K.wach(100); };
    var aus = function () { if (!S.halt) return; S.halt = false; halt.classList.remove('aktiv'); K.wach(2500); };
    halt.addEventListener('pointerdown', an); addEventListener('pointerup', aus); addEventListener('pointercancel', aus); halt.addEventListener('pointerleave', aus);
    halt.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !S.halt) an(e); });
    halt.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') aus(); });
    halt.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.schiene button'), function (b) {
    b.addEventListener('click', function () { var p = +b.dataset.p, r = strecke.getBoundingClientRect(), y = r.top + scrollY + p * (r.height - innerHeight); if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.6 }); else scrollTo({ top: y, behavior: 'smooth' }); });
  });
})();
