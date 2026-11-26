/* Ostrander Holzwerkstatt – Held-Objekt: Sideboard Eiche massiv in Echtzeit-3D (KINO-Engine).
   Kapitel = Kamera-Einstellungen am selben Möbel: Entstehen · Makro Fuge · Explosion 31 Teile ·
   Vollauszug · Ihr Holz (Holzart wählen, „Gedrückt halten: Tür öffnen“) · Fahrt in die Front. */
(function () {
  'use strict';
  var buehne = document.getElementById('buehne'), strecke = document.getElementById('kino');
  if (!buehne || !window.KINO) return;
  var KINO = window.KINO, sstep = KINO.sstep, clamp = KINO.clamp;
  var hoch = innerHeight > innerWidth * 1.05;

  var ARTEN = {
    eiche: { name: 'Eiche natur, geölt', hell: '#C99E66', dunkel: '#6E4B28', pore: .5, rau: .9, relief: .12, lack: .25, lackRau: .55 },
    raeucher: { name: 'Räuchereiche, geölt', hell: '#7A5233', dunkel: '#2A180C', pore: .55, rau: .9, relief: .12, lack: .25, lackRau: .55 },
    nuss: { name: 'Amerik. Nussbaum, geölt', hell: '#83593A', dunkel: '#2E1A0E', pore: .25, rau: .85, relief: .1, lack: .3, lackRau: .5 },
    esche: { name: 'Esche schwarz gebeizt', hell: '#3E3934', dunkel: '#0F0D0B', pore: .4, rau: .85, relief: .15, lack: .3, lackRau: .5 }
  };
  var D = .019, B = 1.60, HK = .62, T = .45, Y0 = .10, ZF = T / 2;

  var cam = hoch ? [
    { p: 0, pos: [1.1, 1.5, 4.6], ziel: [0, .5, 0], fov: 30 },
    { p: .10, pos: [1.1, 1.5, 4.6], ziel: [0, .5, 0], fov: 30 },
    { p: .19, pos: [.10, .80, .55], ziel: [0, .70, .235], fov: 30 },
    { p: .29, pos: [.10, .80, .55], ziel: [0, .70, .235], fov: 30 },
    { p: .38, pos: [2.4, 1.9, 5.8], ziel: [0, .55, .2], fov: 32 },
    { p: .55, pos: [.9, 1.6, 6.4], ziel: [0, .5, .2], fov: 32 },
    { p: .64, pos: [1.5, 1.9, 3.4], ziel: [.4, .45, .3], fov: 30 },
    { p: .76, pos: [1.5, 1.9, 3.4], ziel: [.4, .45, .3], fov: 30 },
    { p: .84, pos: [0, .75, 4.6], ziel: [0, .44, 0], fov: 30 },
    { p: .93, pos: [0, .75, 4.6], ziel: [0, .44, 0], fov: 30 },
    { p: 1, pos: [.40, .43, .33], ziel: [.40, .43, .2], fov: 24 }
  ] : [
    { p: 0, pos: [2.5, 1.25, 3.6], ziel: [-.62, .42, 0], fov: 30 },
    { p: .10, pos: [2.5, 1.25, 3.6], ziel: [-.62, .42, 0], fov: 30 },
    { p: .19, pos: [.42, .95, 1.02], ziel: [-.10, .64, .22], fov: 24 },
    { p: .29, pos: [.34, .92, .94], ziel: [-.10, .64, .22], fov: 24 },
    { p: .38, pos: [3.0, 1.9, 4.4], ziel: [-.6, .5, .2], fov: 32 },
    { p: .55, pos: [1.0, 1.6, 5.0], ziel: [-.7, .5, .2], fov: 32 },
    { p: .64, pos: [2.0, 1.7, 2.2], ziel: [.25, .45, .35], fov: 30 },
    { p: .76, pos: [2.0, 1.7, 2.2], ziel: [.25, .45, .35], fov: 30 },
    { p: .84, pos: [.9, .9, 3.7], ziel: [-.5, .44, 0], fov: 30 },
    { p: .93, pos: [.9, .9, 3.7], ziel: [-.5, .44, 0], fov: 30 },
    { p: 1, pos: [.40, .43, .33], ziel: [.40, .43, .2], fov: 24 }
  ];

  var S = { art: 'eiche', tuer: 0, halt: false, tv: 0, e0: 0 };
  var teile = [], schub = [], tuerG = null, labs = {}, holz, birke, pts, geladen = false;

  var K = KINO.start({
    buehne: buehne, strecke: strecke, akzent: '#E0A458', licht: '#fff6ec', lichtStaerke: 2.4, kanteStaerke: 1.1, umgebung: .38, belichtung: .95,
    labelEbene: document.getElementById('labels'), kamera: cam,
    bau: function (K) {
      var THREE = K.THREE, w = K.welt;
      var tex = K.textur(window.HOLZ_TEX, {}, function () { geladen = true; S.e0 = performance.now(); K.wach(5000); });
      holz = K.holz(tex, ARTEN.eiche);
      birke = K.holz(tex, { hell: '#D9BE93', dunkel: '#A9875C', pore: .08, rau: .9, relief: .1 });
      var stahl = K.mat({ color: '#d8d8d6', metalness: 1, roughness: .26, key: 'stahl' });
      var schwarz = K.mat({ color: '#121212', metalness: 0, roughness: .42, clearcoat: .35, clearcoatRoughness: .5, key: 'pulver' });
      var dunkelStahl = K.mat({ color: '#8d8f92', metalness: 1, roughness: .38, key: 'zink' });

      function teil(m, x, y, z, ex, del, par) { m.position.set(x, y, z); (par || w).add(m); var t = { m: m, b: m.position.clone(), ex: new THREE.Vector3().fromArray(ex), d: del || 0 }; teiles(t); return t; }
      function teiles(t) { teile.push(t); }
      var YM = Y0 + HK / 2, IN = B / 2 - D;
      // Korpus
      teil(K.brett(D, HK, T, holz, { faser: 'y' }), -B / 2 + D / 2, YM, 0, [-.55, 0, 0], .05);
      teil(K.brett(D, HK, T, holz, { faser: 'y' }), B / 2 - D / 2, YM, 0, [.55, 0, 0], .05);
      teil(K.brett(B - 2 * D, D, T, holz, { faser: 'x' }), 0, Y0 + HK - D / 2, 0, [0, .42, 0], 0);
      teil(K.brett(B - 2 * D, D, T, holz, { faser: 'x' }), 0, Y0 + D / 2, 0, [0, -.06, .1], .1);
      teil(K.brett(D, HK - 2 * D, T - .012, holz, { faser: 'y' }), 0, YM, -.006, [0, .12, -.18], .12);
      teil(K.brett(B - 2 * D + .016, HK - 2 * D + .016, .008, holz, { faser: 'x', r: .0008 }), 0, YM, -T / 2 + .016, [0, .05, -.55], .08);
      var fbY = Y0 + D + (HK - 2 * D) * .5;
      teil(K.brett(B / 2 - D * 1.5 - .002, D, T - .04, holz, { faser: 'x' }), -B / 4 - D / 4, fbY, -.005, [-.05, .26, .12], .18);
      // Bodenträger (5 mm, System 32)
      [[-IN + .0045, -.15], [-IN + .0045, .15], [-D / 2 - .0045, -.15], [-D / 2 - .0045, .15]].forEach(function (q, i) {
        var g = new THREE.Mesh(new THREE.CylinderGeometry(.0025, .0025, .016, 16), stahl); g.rotation.z = Math.PI / 2; g.castShadow = true;
        teil(g, q[0] + (q[0] < -.5 ? .004 : -.004), fbY - D / 2 - .0026, q[1], [q[0] < -.5 ? -.12 : .12, .14, 0], .2);
      });
      // Kufen (Stahl, pulverbeschichtet)
      [-B / 2 + .14, B / 2 - .14].forEach(function (x, i) {
        var g = new THREE.Group(); var h = Y0;
        [[.03, h, T - .06, 0, h / 2, 0]].forEach(function () { });
        var a = K.brett(.03, .012, T - .05, schwarz, { r: .002 }); a.position.set(0, .006, 0); g.add(a);
        var bb = K.brett(.03, .012, T - .05, schwarz, { r: .002 }); bb.position.set(0, h - .006, 0); g.add(bb);
        var c1 = K.brett(.03, h, .012, schwarz, { r: .002 }); c1.position.set(0, h / 2, (T - .05) / 2 - .006); g.add(c1);
        var c2 = K.brett(.03, h, .012, schwarz, { r: .002 }); c2.position.set(0, h / 2, -(T - .05) / 2 + .006); g.add(c2);
        teil(g, x, 0, 0, [0, -.02, 0], 0);
        if (i === 0) labs.kufe = K.label(g, [0, .012, .12], 'Kufe · Stahl, pulverbeschichtet', 'r nm');
      });
      // Türen (aus einer Platte, Maserung läuft durch) + Topfbänder 35 mm
      var tb = (B / 2 - .003 - .003) / 2, th = HK - .003, zf = ZF + D / 2 + .001;
      tuerG = [];
      [[-B / 2 + .0015 + tb / 2, -1], [-.0015 - tb / 2, 1]].forEach(function (q, i) {
        var piv = new THREE.Group(); var kante = q[1] < 0 ? q[0] - tb / 2 : q[0] + tb / 2; piv.position.set(kante, YM, ZF + .001); w.add(piv);
        var t = K.brett(tb, th, D, holz, { faser: 'y', ox: .3, oy: q[0] });
        t.position.set(q[0] - kante, 0, D / 2); piv.add(t);
        var hx = (q[1] < 0 ? .0225 : -.0225);
        [th / 2 - .095, -th / 2 + .095].forEach(function (y, j) {
          var ring = new THREE.Mesh(new THREE.RingGeometry(.0172, .0208, 56), stahl); ring.position.set(hx, y, -.0003); ring.rotation.y = Math.PI; piv.add(ring);
          var topf = new THREE.Mesh(new THREE.CircleGeometry(.0173, 48), dunkelStahl); topf.position.set(hx, y, -.0002); topf.rotation.y = Math.PI; piv.add(topf);
          if (i === 0 && j === 0) labs.topf = K.label(piv, [hx, y, -.01], 'Topfband · Ø 35 mm, 3-fach justierbar');
          // Arm + Montageplatte am Korpus (System 32: 37 mm hinter der Vorderkante)
          var px = kante + (q[1] < 0 ? D : -D / 2 - D);
          var platte = K.brett(.004, .048, .012, stahl, { r: .001 });
          var arm = K.brett(.012, .011, .052, stahl, { r: .002 });
          var g = new THREE.Group(); platte.position.set(0, 0, -.037 + .006); arm.position.set(q[1] < 0 ? .01 : -.01, 0, -.012); g.add(platte); g.add(arm);
          teil(g, (q[1] < 0 ? -B / 2 + D + .002 : -D / 2 - .002), YM + y, ZF, [q[1] < 0 ? -.2 : .05, 0, .12], .3);
        });
        var tt = teil(piv, kante, YM, ZF + .001, [q[1] < 0 ? -.18 : .1, .02, .62], .22);
        tt.tuer = q[1]; tuerG.push(tt);
        if (i === 1) labs.fuge = K.label(t, [tb / 2, th / 2 - .02, D / 2], '3 mm Fuge · rundum gleich', 'r');
      });
      var fugeMat = K.mat({ color: '#070504', roughness: 1, metalness: 0, key: 'fuge' });
      var fuge = new THREE.Mesh(new THREE.PlaneGeometry(B - .002, HK - .002), fugeMat); fuge.position.set(0, YM, ZF + .0006); w.add(fuge); S.fuge = fuge;
      labs.massiv = K.label(w, [-.06, Y0 + HK, ZF], 'Eiche massiv · 19 mm', 'nm');
      // Schubkästen: Front aus einer Platte, Kasten Birke-Multiplex, Unterflur-Vollauszug mit Dämpfung
      var fh = (HK - .003 - 2 * .003) / 3, fw = B / 2 - .003, lw = B / 2 - D - D / 2;
      for (var k = 0; k < 3; k++) {
        var y = Y0 + .0015 + fh / 2 + (2 - k) * (fh + .003), g = new THREE.Group();
        var fr = K.brett(fw, fh, D, holz, { faser: 'x', ox: .55, oy: y }); fr.position.set(0, 0, D / 2); g.add(fr);
        var bh = fh - .05, bw = lw - .042, bt = .40, s = .015, zb = -bt / 2 - .002;
        var yb = -fh / 2 + .035 + bh / 2 - .012;
        [[-bw / 2 + s / 2], [bw / 2 - s / 2]].forEach(function (q) { var z = K.brett(s, bh, bt, birke, { faser: 'z', r: .0012 }); z.position.set(q[0], yb, zb); g.add(z); });
        var hw = K.brett(bw - 2 * s, bh, s, birke, { faser: 'x', r: .0012 }); hw.position.set(0, yb, zb - bt / 2 + s / 2); g.add(hw);
        var vw = K.brett(bw - 2 * s, bh, s, birke, { faser: 'x', r: .0012 }); vw.position.set(0, yb, -s / 2 - .004); g.add(vw);
        var bo = K.brett(bw - .004, .010, bt - .004, birke, { faser: 'z', r: .001 }); bo.position.set(0, yb - bh / 2 + .006, zb); g.add(bo);
        [-1, 1].forEach(function (sg) {
          var inn = K.brett(.012, .010, bt - .03, stahl, { r: .0015 }); inn.position.set(sg * (bw / 2 - .02), yb - bh / 2 - .004, zb); g.add(inn);
        });
        var tt2 = teil(g, B / 4 + D / 4 - .0005, y, ZF + .001, [.16, (1 - k) * .05, .75 + k * .12], .26 + k * .04);
        tt2.schub = k; schub.push(tt2);
        [-1, 1].forEach(function (sg) {
          var aus = K.brett(.014, .012, bt - .02, dunkelStahl, { r: .0015 });
          teil(aus, B / 4 + D / 4 + sg * (bw / 2 - .02), y + yb - bh / 2 - .015, ZF - bt / 2 - .006, [.10 + sg * .04, (1 - k) * .05, .36 + k * .07], .3);
        });
        if (k === 0) { labs.auszug = K.label(g, [bw / 2, yb + bh / 2, -.05], 'Vollauszug · gedämpft, bis 40 kg', 'r'); labs.platte = K.label(fr, [fw / 2 - .02, -fh / 2 + .02, D / 2], 'Fronten aus einer Platte · Maserung läuft durch', 'r nm'); labs.birke = K.label(g, [0, yb + bh / 2, zb], 'Kasten · Birke-Multiplex 15 mm', 'nm'); }
      }
      labs.rueck = K.label(w, [-.5, Y0 + HK - .05, -T / 2 + .016], 'Rückwand 8 mm · in Nut');
      labs.fach = K.label(w, [-.62, fbY + D / 2, .18], 'Fachboden · auf Bodenträgern, 32-mm-Raster', 'nm');
      // Partikel fürs Entstehen
      var ms = []; w.traverse(function (o) { if (o.isMesh && o.geometry && o.geometry.attributes.position.count > 20) ms.push(o); });
      pts = K.partikel(ms, K.mob ? 1300 : 2600, '#F0B565', { zentrum: new THREE.Vector3(0, .5, 0), radius: 1.6 });
      K.U.uDissY.value.set(0, .8);
      var sofort = K.reduce || K.still; K.U.uDiss.value = sofort ? 1 : 0; pts.setze(sofort ? 1 : 0, sofort ? 0 : 1);

      var live = { ex: document.getElementById('lv-ex'), az: document.getElementById('lv-az'), bw: document.getElementById('lv-bw'), tu: document.getElementById('lv-tu') }, lt = 0;
      var kaps = Array.prototype.slice.call(document.querySelectorAll('.kap')), rail = Array.prototype.slice.call(document.querySelectorAll('.schiene button'));
      var riese = document.getElementById('riese'), wahl = document.getElementById('holzwahl'), vorhang = document.getElementById('vorhang');
      return {
        lebt: function () { return S.halt || Math.abs(S.tv) > .0005 || S.tuer > .0005 || (geladen && performance.now() - S.e0 < 4200); },
        update: function (p, K) {
          var now = performance.now();
          // Entstehen (einmal nach dem Laden, ~3,6 s)
          if (geladen && !K.reduce && !K.still) {
            var e = (now - S.e0) / 1000;
            pts.setze(sstep(0, 2.3, e), 1 - sstep(2.5, 3.7, e));
            K.U.uDiss.value = sstep(1.1, 3.5, e);
          }
          var ex = sstep(.33, .45, p) * (1 - sstep(.55, .61, p));
          if (S.fuge) S.fuge.visible = ex < .004 && S.tuer < .02 && !(p > .6 && p < .82);
          var tz = 0; // Tür öffnen per Gedrückthalten (Dämpfung beim Schließen)
          var zielT = S.halt ? 1 : 0; S.tv += ((zielT - S.tuer) * 9 - S.tv * 5.5) * K.dt; S.tuer = clamp(S.tuer + S.tv * K.dt, 0, 1); if (S.tuer <= 0 && S.tv < 0) S.tv = 0;
          for (var i = 0; i < teile.length; i++) {
            var t = teile[i], f = KINO.ease(clamp((ex - t.d * .9) / (1 - t.d * .9), 0, 1));
            t.m.position.copy(t.b).addScaledVector(t.ex, f);
            if (t.tuer) t.m.rotation.y = t.tuer * 1.9 * f + (t.tuer < 0 ? -1.75 * KINO.ease(S.tuer) * (1 - f) : 0);
            if (t.schub != null) { var o = sstep(.62 + t.schub * .028, .69 + t.schub * .028, p) * (1 - sstep(.77, .81, p)); t.m.position.z += o * .40 * (1 - f); if (t.schub === 0) tz = o; }
          }
          // Beschriftungen je Kapitel
          var mk = p > .17 && p < .31, xk = ex > .82, ak = tz > .6;
          labs.fuge.ziel = mk ? 1 : 0; labs.massiv.ziel = mk ? 1 : 0;
          ['topf', 'kufe', 'rueck', 'fach', 'platte'].forEach(function (k) { labs[k].ziel = xk ? 1 : 0; });
          labs.auszug.ziel = ak ? 1 : 0; labs.birke.ziel = ak ? 1 : 0;
          // Kapiteltexte, Riesenwort, Schiene, Holzwahl
          var aktiv = -1;
          kaps.forEach(function (k, i) { var a = +k.dataset.a, b = +k.dataset.b, v = sstep(a - .035, a, p) * (1 - sstep(b, b + .035, p)); if (i === 0) v = 1 - sstep(b, b + .035, p); k.style.opacity = v.toFixed(3); k.style.transform = 'translate3d(0,' + ((1 - v) * 24).toFixed(1) + 'px,0)'; k.classList.toggle('an', v > .5); if (v > .5) aktiv = i; });
          rail.forEach(function (r, i) { r.classList.toggle('an', i === aktiv); });
          if (riese) { riese.style.opacity = (.9 * (1 - sstep(.1, .17, p)) + .5 * sstep(.8, .85, p) * (1 - sstep(.93, .97, p))).toFixed(3); riese.style.transform = 'translate3d(0,' + (-p * 60).toFixed(1) + 'px,0)'; }
          if (wahl) wahl.classList.toggle('an', p > .81 && p < .95);
          if (vorhang) vorhang.style.opacity = sstep(.955, 1, p).toFixed(3);
          if (now - lt > 90) { lt = now;
            if (live.ex) live.ex.textContent = String(Math.round(ex * 620)).padStart(3, '0');
            if (live.az) live.az.textContent = String(Math.round(tz * 400)).padStart(3, '0');
            if (live.bw) live.bw.textContent = Math.round(12 / Math.tan(K.cam.fov * Math.PI / 360) * 1.0);
            if (live.tu) live.tu.textContent = String(Math.round(S.tuer * 100)).padStart(3, '0');
          }
        }
      };
    }
  });
  if (!K) { document.documentElement.classList.add('kino-aus'); return; }
  window.__kino = K;
  // Holzart wählen
  Array.prototype.forEach.call(document.querySelectorAll('#holzwahl [data-art]'), function (b) {
    b.addEventListener('click', function () { var a = ARTEN[b.dataset.art]; if (!a) return; holz.setArt(a); S.art = b.dataset.art; Array.prototype.forEach.call(document.querySelectorAll('#holzwahl [data-art]'), function (x) { x.setAttribute('aria-pressed', x === b); }); var n = document.getElementById('lv-holz'); if (n) n.textContent = a.name; K.wach(400); });
  });
  // Gedrückt halten: Tür öffnen
  var halt = document.getElementById('halten');
  if (halt) {
    var an = function (e) { e.preventDefault(); S.halt = true; halt.classList.add('aktiv'); K.wach(100); };
    var aus = function () { if (!S.halt) return; S.halt = false; halt.classList.remove('aktiv'); K.wach(1500); };
    halt.addEventListener('pointerdown', an); addEventListener('pointerup', aus); addEventListener('pointercancel', aus); halt.addEventListener('pointerleave', aus);
    halt.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { if (!S.halt) an(e); } });
    halt.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') aus(); });
    halt.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  // Kapitel-Schiene: Klick springt zum Kapitel
  Array.prototype.forEach.call(document.querySelectorAll('.schiene button'), function (b) {
    b.addEventListener('click', function () { var p = +b.dataset.p, r = strecke.getBoundingClientRect(), y = r.top + scrollY + p * (r.height - innerHeight); if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.6 }); else scrollTo({ top: y, behavior: 'smooth' }); });
  });
})();
