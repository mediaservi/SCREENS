// SCREENS v10.84 · cuerpos 3D de proyector: uno por familia, copiados de la foto oficial de cada equipo y aprobados por Josep (24-11-2026).
// Paramétricos (sin modelos que descargar), a la medida real del chasis (ancho × fondo × alto, m) y todos en gris medio neutro,
// que representa igual a los modelos blancos y negros. Ejes del cuerpo: base en y = 0, centro en x = z = 0 y +z hacia la pantalla;
// g.userData.salida es el punto por donde sale la luz (en las ultracortas, el cristal de arriba; con la óptica ultracorta plegada, su cabezal).
// Familias: EB-815E · EB-805F (periscopio) · L695SE/L795SE/L695SU · PU1000/PQ2000 (545 mm) · PU2200/PQ2200 (586 mm) · XQ2030B ·
// PU/PQ con óptica ultracorta plegada · Vivitek DU7000Z · DU8000Z/DK8000Z · DU9057Z/DU9059Z · DU5000Z/DK5000Z · Christie (v11.45, por serie).
function construir(T, o) {
  // o: { chasis: [ancho, fondo, alto], tipo: 'ust' | 'compacto' | 'grande', color: 'blanco' | 'negro', marca: 'EPSON' | 'VIVITEK', lente: 'centro' | 'lado' }
  const PATA_XQ = .032;   // XQ2030B: patas de unos 64 mm (medido en la foto oficial); los huecos de apilado de la tapa tienen el mismo diámetro y posición
  const [w, d, h] = o.chasis, g = new T.Group(), blanco = false;   // todos los chasis en gris medio neutro: representa igual a los modelos blancos y negros (decisión de Josep, 24-11-2026)
  const mC = new T.MeshStandardMaterial({ color: 0x2a2c31, roughness: .55, metalness: .25 });
  const mC2 = new T.MeshStandardMaterial({ color: 0x1f2124, roughness: .6, metalness: .2 });
  const mRej = new T.MeshStandardMaterial({ color: 0x0c0c0e, roughness: .8 });
  const mVid = new T.MeshStandardMaterial({ color: 0x0a0d14, roughness: .08, metalness: .9 }), mAro = new T.MeshStandardMaterial({ color: 0x15161a, roughness: .35, metalness: .7 });
  const B = (bw, bh, bd, m, x, y, z) => { const b = new T.Mesh(new T.BoxGeometry(bw, bh, bd), m); b.position.set(x, y, z); g.add(b); return b; };
  // cuerpo con cantos redondeados (caja + biseles)
  const pie = h * (o.xq ? .07 : o.serie2 ? .13 : .06), hc = h - pie, rad = Math.min(w, d, hc) * .08;
  const forma = new T.Shape(); const bs = rad * .6, x0 = -w / 2 + bs, z0 = -d / 2 + bs; forma.moveTo(x0 + rad, z0); forma.lineTo(-x0 - rad, z0); forma.quadraticCurveTo(-x0, z0, -x0, z0 + rad); forma.lineTo(-x0, -z0 - rad); forma.quadraticCurveTo(-x0, -z0, -x0 - rad, -z0); forma.lineTo(x0 + rad, -z0); forma.quadraticCurveTo(x0, -z0, x0, -z0 - rad); forma.lineTo(x0, z0 + rad); forma.quadraticCurveTo(x0, z0, x0 + rad, z0);
  const cg = new T.ExtrudeGeometry(forma, { depth: hc - rad * 2, bevelEnabled: true, bevelThickness: rad, bevelSize: rad * .6, bevelSegments: 3, curveSegments: 6 }); cg.rotateX(-Math.PI / 2); cg.translate(0, pie + rad, 0);
  const caja = new T.Mesh(cg, mC); g.add(caja);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const pr = o.xq ? PATA_XQ : o.serie2 ? w * .045 : o.tipo === 'ust' || o.tipo === 'periscopio' ? .012 : w * .035; const p = new T.Mesh(new T.CylinderGeometry(pr, pr * (o.xq ? 1 : 1.05), pie, 24), o.serie2 ? mC : mC2); p.position.set(a * w * (o.tipo === 'ust' ? .44 : o.tipo === 'pro' ? .44 : .38), pie / 2, b * d * .38); g.add(p); if (o.tipo === 'pro' && !o.xq) { const pl = new T.Mesh(new T.CylinderGeometry(w * .05, w * .05, pie * .35, 20), mC2); pl.position.set(a * w * .44, pie * .17, b * d * .38); g.add(pl); } });   // patas regulables
  const fz = d / 2 + .002;   // cara frontal (+z mira a la pantalla)
  if (o.tipo === 'periscopio') {   // EB-805F: cuerpo bajo y plano; encima, un periscopio que asoma la lente esférica hacia la pared (+z)
    caja.scale.y = .58; caja.position.y = pie * (1 - .58);   // el alto de la ficha (210 mm) incluye el periscopio
    const top = pie + hc * .58, hp = h - top, wp = w * .38, xp = 0, z0p = -d * .12, z1p = d * .45;
    const pf = new T.Shape(); pf.moveTo(z0p, 0); pf.lineTo(z1p, 0); pf.lineTo(z1p, hp * .9); pf.quadraticCurveTo(z1p, hp, z1p - .02, hp); pf.lineTo(z0p + d * .2, hp); pf.quadraticCurveTo(z0p + d * .16, hp, z0p + d * .14, hp * .9); pf.lineTo(z0p, hp * .12); pf.lineTo(z0p, 0);
    const pg = new T.ExtrudeGeometry(pf, { depth: wp, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 3 }); pg.rotateY(-Math.PI / 2); pg.translate(xp + wp / 2 + 0, top - .002, 0);
    const per = new T.Mesh(pg, mC); g.add(per); B(wp * 1.02, .012, d * .03, mC2, xp, top + .004, z0p + d * .02);
    const lente = new T.Mesh(new T.SphereGeometry(hp * .3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mVid); lente.rotation.x = Math.PI / 2; lente.position.set(xp, top + hp * .45, z1p + .004); g.add(lente);
    const aro = new T.Mesh(new T.TorusGeometry(hp * .31, .006, 10, 32), mAro); aro.position.set(xp, top + hp * .45, z1p + .004); g.add(aro);
    g.userData.salida = lente.position.clone();
    for (let i = 0; i < 9; i++) B(w * .9, hc * .58 * .03, .004, mRej, 0, pie + hc * .58 * (.18 + i * .085), -fz - .001);
    [-1, 1].forEach(sg => { for (let i = 0; i < 10; i++) B(w * .1, hc * .58 * .025, .006, new T.MeshStandardMaterial({ color: 0x050506 }), sg * w * .38, pie + hc * .58 * (.2 + i * .065), -fz - .003); });
    for (let i = 0; i < 8; i++) B(.004, hc * .58 * .03, d * .5, new T.MeshStandardMaterial({ color: 0x050506 }), -w / 2 - .002, pie + hc * .58 * (.22 + i * .08), 0);
  } else if (o.tipo === 'ust') {   // ultracorta: la luz sale por el cristal de arriba, del lado de la pared (+z); el frontal (-z) mira a la sala
    const tapa = hc * .14, mT = new T.MeshStandardMaterial({ color: 0x24262a, roughness: .3, metalness: .3 });
    B(w * 1.01, tapa, d * 1.01, mT, 0, h - tapa / 2 + .002, 0);   // tapa superior, un poco más ancha que el cuerpo
    B(w * .62, .004, d * .3, mVid, 0, h + .003, d * .27); B(w * .66, .003, d * .36, mAro, 0, h + .002, d * .27);   // cristal de salida
    g.userData.salida = new T.Vector3(0, h + .004, d * .27);
    const dots = () => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#5d6066'; x.fillRect(0, 0, 64, 128); x.fillStyle = '#1a1b1e'; for (let yy = 4; yy < 128; yy += 6) for (let xx = 3 + (yy % 12 ? 3 : 0); xx < 64; xx += 6) { x.beginPath(); x.arc(xx, yy, 1.6, 0, 7); x.fill(); } const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; };
    const mDot = new T.MeshStandardMaterial({ map: dots(), roughness: .8 });
    [-1, 1].forEach(sg => { const pl = new T.Mesh(new T.PlaneGeometry(w * .085, hc * .72), mDot); pl.position.set(sg * w * .445, pie + hc * .44, -fz - .002); pl.rotation.y = Math.PI; g.add(pl); });   // altavoces a los lados del frontal
    for (let i = 0; i < 5; i++) B(w * .022, hc * .03, .006, new T.MeshStandardMaterial({ color: 0x9a9ca2, metalness: .6, roughness: .3 }), -w * .17 - i * w * .03, pie + hc * .8, -fz - .002);   // botones
    B(w * .03, hc * .1, .004, new T.MeshStandardMaterial({ color: 0x050506 }), w * .26, pie + hc * .74, -fz - .002);   // receptor
    for (let i = 0; i < 3; i++) B(w * .86, hc * .02, .004, mRej, 0, pie + hc * (.06 + i * .04), -fz - .002);   // rejilla inferior
  } else if (o.tipo === 'media' || o.tipo === 'pro') {   // pro = PU/PQ: óptica hundida en un hueco redondeado, motor de lente al lado. media = L695SE/L795SE/L695SU: óptica grande centrada en un hueco, rejilla de lamas a la izquierda, rótulo a la derecha
    const mNeg = new T.MeshStandardMaterial({ color: 0x050506, roughness: .8 }), mCl = new T.MeshStandardMaterial({ color: 0xb8bbc2, metalness: .5, roughness: .35 });
    const pro = o.tipo === 'pro';
    if (pro) { const hw = w * (o.lenteUST ? .2 : .17), hy0 = -pie * .6, hy1 = hc * .93, rr = hc * .12, fh = new T.Shape(); fh.moveTo(-hw + rr, hy0); fh.lineTo(hw - rr, hy0); fh.quadraticCurveTo(hw, hy0, hw, hy0 + rr); fh.lineTo(hw, hy1 - rr); fh.quadraticCurveTo(hw, hy1, hw - rr, hy1); fh.lineTo(-hw + rr, hy1); fh.quadraticCurveTo(-hw, hy1, -hw, hy1 - rr); fh.lineTo(-hw, hy0 + rr); fh.quadraticCurveTo(-hw, hy0, -hw + rr, hy0);
      const mk = (sh, m, z, e) => { const ge = new T.ExtrudeGeometry(sh, { depth: e, bevelEnabled: false }); const me = new T.Mesh(ge, m); me.position.set(0, pie, z); g.add(me); };
      mk(fh, new T.MeshStandardMaterial({ color: 0x1a1b1e, roughness: .55, metalness: .2 }), fz - .002, .006); const fi = new T.Shape(fh.getPoints(8).map(v => new T.Vector2(v.x * .9, hc * .43 + (v.y - hc * .43) * .9))); mk(fi, mNeg, fz + .002, .004);   // marco y hueco de la óptica
    } else B(w * .34, hc * .86, .012, mNeg, 0, pie + hc * .48, fz - .004);   // hueco de la óptica
    const R = hc * (o.xq ? .36 : pro ? .3 : .4), ly = pie + hc * (pro ? .45 : .42), sal = d * (pro ? .11 : .13);
    if (pro) { const mot = new T.Mesh(new T.CylinderGeometry(R * .62, R * .62, sal * .7, 28), new T.MeshStandardMaterial({ color: 0x08090a, roughness: .5 })); mot.rotation.x = Math.PI / 2; mot.position.set(R * .78, ly - R * .2, fz + sal * .35); g.add(mot); }   // motor de la lente
    const anillo = new T.Mesh(new T.CylinderGeometry(R * 1.22, R * 1.22, .014, 48), pro ? mAro : mC2); anillo.rotation.x = Math.PI / 2; anillo.position.set(0, ly, fz + .004); g.add(anillo);
    const barril = new T.Mesh(new T.CylinderGeometry(R * 1.12, R * 1.18, sal, 48), mAro); barril.rotation.x = Math.PI / 2; barril.position.set(0, ly, fz + sal / 2); g.add(barril);
    const estr = new T.Mesh(new T.TorusGeometry(R * 1.1, .007, 8, 48), mC2); estr.position.set(0, ly, fz + sal * .55); g.add(estr);
    const bisel = new T.Mesh(new T.TorusGeometry(R * .98, R * .1, 10, 48), mAro); bisel.position.set(0, ly, fz + sal); g.add(bisel);
    const cristal = new T.Mesh(new T.CircleGeometry(R * .9, 48), new T.MeshStandardMaterial({ color: 0x1a1220, emissive: 0x140818, roughness: .05, metalness: .9 })); cristal.position.set(0, ly, fz + sal - .004); g.add(cristal);
    const aroInt = new T.Mesh(new T.TorusGeometry(R * .62, R * .05, 8, 40), mAro); aroInt.position.set(0, ly, fz + sal - .003); g.add(aroInt);
    const elem = new T.Mesh(new T.SphereGeometry(R * .55, 32, 12, 0, Math.PI * 2, 0, Math.PI / 3.2), new T.MeshStandardMaterial({ color: 0x1a1020, emissive: 0x0e0510, roughness: .03, metalness: .85 })); elem.rotation.x = Math.PI / 2; elem.position.set(0, ly, fz + sal - .004 - R * .55 * Math.cos(Math.PI / 3.2)); g.add(elem);
    g.userData.salida = new T.Vector3(0, ly, fz + sal);
    if (o.xq) {   // XQ2030B: rejillas grandes en la tapa, pivotes de apilado en las esquinas y laterales de malla
      [-1, 1].forEach(sg => { B(w * .3, .003, d * .38, mNeg, sg * w * .26, h + .0005, -d * .06); for (let i = 0; i < 11; i++) B(w * .29, .004, d * .012, mC, sg * w * .26, h + .002, -d * .06 - d * .17 + i * d * .034);
        B(.004, hc * .62, d * .66, mNeg, sg * (w / 2 + .001), pie + hc * .5, -d * .04); for (let i = 0; i < 12; i++) B(.006, hc * .022, d * .66, mC, sg * (w / 2 + .002), pie + hc * (.22 + i * .05), -d * .04);
        [-1, 1].forEach(sz => { const hu = new T.Mesh(new T.CircleGeometry(PATA_XQ * 1.06, 32), new T.MeshStandardMaterial({ color: 0x1a1b1e, roughness: .5 })); hu.rotation.x = -Math.PI / 2; hu.position.set(sg * w * .44, h + .0008, sz * d * .38); g.add(hu); const fo = new T.Mesh(new T.CircleGeometry(PATA_XQ * .9, 32), mNeg); fo.rotation.x = -Math.PI / 2; fo.position.set(sg * w * .44, h + .0012, sz * d * .38); g.add(fo); }); });   // huecos de apilado: encajan las patas del proyector de encima
      B(w * .2, .005, d * .5, new T.MeshStandardMaterial({ color: 0x121316, roughness: .6 }), 0, h + .002, -d * .03);   // lomo central
    }
    if (o.lenteUST) {   // variante con óptica ultracorta plegada (ELPLX): columna que sube por delante, brazo hacia atrás por encima y cabezal que proyecta hacia la parte trasera (−z)
      const mL = new T.MeshStandardMaterial({ color: 0x2a2c31, roughness: .55, metalness: .25 }), mL2 = new T.MeshStandardMaterial({ color: 0x0c0c0e, roughness: .55 });
      const cw = w * .12, z0 = fz - .01, z1 = fz + d * .2, ch = cw * .55, y0 = pie + hc * .35, y1 = h + hc * .8;
      const col = new T.Shape([[-cw, -z0], [cw, -z0], [cw, -z1 + ch], [cw - ch, -z1], [-cw + ch, -z1], [-cw, -z1 + ch]].map(([x, y]) => new T.Vector2(x, y)));
      const cgeo = new T.ExtrudeGeometry(col, { depth: y1 - y0, bevelEnabled: true, bevelThickness: .008, bevelSize: .008, bevelSegments: 3 }); cgeo.rotateX(-Math.PI / 2); cgeo.translate(0, y0, 0); g.add(new T.Mesh(cgeo, mL));
      const zb = fz - d * .04, zh = zb - d * .03, brazo = new T.Shape([[-cw * .8, -(z1 - d * .05)], [cw * .8, -(z1 - d * .05)], [cw * .8, -zb], [-cw * .8, -zb]].map(([x, y]) => new T.Vector2(x, y)));
      const bgeo = new T.ExtrudeGeometry(brazo, { depth: hc * .5, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 3 }); bgeo.rotateX(-Math.PI / 2); bgeo.translate(0, h + hc * .35, 0); g.add(new T.Mesh(bgeo, mL));
      const hy = h + hc * .9, hd = d * .2, zc = zb - hd / 2 + .01, hb = zc - hd / 2;   // trompa final: bloque grueso con la esfera de la lente asomando hacia atrás
      const fC = new T.Shape(), hw2 = w * .17, hh2 = hc * .55, rc = hc * .12; fC.moveTo(-hw2 + rc, -hh2); fC.lineTo(hw2 - rc, -hh2); fC.quadraticCurveTo(hw2, -hh2, hw2, -hh2 + rc); fC.lineTo(hw2, hh2 - rc); fC.quadraticCurveTo(hw2, hh2, hw2 - rc, hh2); fC.lineTo(-hw2 + rc, hh2); fC.quadraticCurveTo(-hw2, hh2, -hw2, hh2 - rc); fC.lineTo(-hw2, -hh2 + rc); fC.quadraticCurveTo(-hw2, -hh2, -hw2 + rc, -hh2);
      const tg = new T.ExtrudeGeometry(fC, { depth: hd, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 3 }); tg.translate(0, hy, hb); g.add(new T.Mesh(tg, mL));
      const mMar = new T.MeshStandardMaterial({ color: 0x0b0b0d, roughness: .45, metalness: .3 }), Re = hh2 * .78;
      const marco = new T.Mesh(new T.ExtrudeGeometry(new T.Shape(fC.getPoints(8).map(v => new T.Vector2(v.x * .86, v.y * .86))), { depth: .012, bevelEnabled: false }), mMar); marco.position.set(0, hy, hb - .02); g.add(marco);   // marco negro de la ventana
      const aroE = new T.Mesh(new T.TorusGeometry(Re * 1.02, .008, 10, 40), mAro); aroE.position.set(0, hy, hb - .022); g.add(aroE);
      const esf = new T.Mesh(new T.SphereGeometry(Re, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2.6), new T.MeshStandardMaterial({ color: 0x141a16, emissive: 0x050806, roughness: .04, metalness: .85 })); esf.rotation.x = -Math.PI / 2; esf.position.set(0, hy, hb - .022 + Re * Math.cos(Math.PI / 2.6)); g.add(esf);   // esfera de la lente
      [-1, 1].forEach(sg => B(.012, hh2 * 1.1, hd * .55, mMar, sg * (hw2 + .012), hy - hh2 * .1, zc));   // soportes laterales
      g.userData.salida = new T.Vector3(0, hy, hb - .022 - Re * (1 - Math.cos(Math.PI / 2.6)));
    }
    B(w * .29, hc * (pro ? .62 : .74), .01, mNeg, -w * .32, pie + hc * (pro ? .55 : .48), fz - .003);   // rejilla izquierda
    for (let i = 0; i < (pro ? 12 : 13); i++) B(w * .29, hc * .028, .008, mC, -w * .32, pie + hc * ((pro ? .26 : .15) + i * .055), fz + .002);
    if (pro) { [-.43, -.32, -.21].forEach(vx => B(.003, hc * .6, .01, mC, w * vx, pie + hc * .55, fz + .002)); for (let i = 0; i < 3; i++) B(w * .26, hc * .02, .008, mRej, (o.serie2 ? 1 : -1) * w * .32, pie + hc * (.06 + i * .045), fz + .002); if (o.serie2) { B(w * .175, hc * .24, .003, new T.MeshStandardMaterial({ color: 0x1c1d21, roughness: .5 }), w * .32, pie + hc * .42, fz + .002); B(w * .165, hc * .22, .003, new T.MeshStandardMaterial({ color: 0x08090a, roughness: .3 }), w * .32, pie + hc * .42, fz + .003); } [-1, 1].forEach(sg => B(w * .02, w * .02, .006, mC2, sg * w * .2, pie + hc * .22, fz + .002)); }   // divisiones, rejilla baja y sensores
    if (!pro) [-1, 1].forEach(sg => { const k = new T.Mesh(new T.CylinderGeometry(w * .03, w * .03, .012, 24), mAro); k.position.set(sg * w * .1, h + .004, fz - d * .08); g.add(k); });   // ruedas de desplazamiento de lente
    for (let i = 0; i < (pro ? 5 : 6); i++) B(.005, .002, d * .05, mCl, (o.serie2 ? -1 : 1) * w * (.25 + i * .035), h + .001, fz - d * (pro ? .04 : .1));   // indicadores de estado arriba a la derecha
    for (let i = 0; i < 8; i++) B(w * .7, hc * .025, .004, mRej, 0, pie + hc * .22 + i * hc * .07, -fz);   // rejilla trasera
    B(w * .3, hc * .2, .006, mC2, w * .2, pie + hc * .3, -fz - .002);   // panel de conexiones
  } else if (o.tipo === 'vivi') {   // Vivitek DU7000Z: tapa que sobresale un poco, óptica a la izquierda con aro plateado, laterales de lamas
    const mNeg = new T.MeshStandardMaterial({ color: 0x050506, roughness: .8 }), mPl = new T.MeshStandardMaterial({ color: 0xb4b7bd, metalness: .6, roughness: .2 }), mLv = new T.MeshStandardMaterial({ color: 0x14141a, emissive: 0x06040a, roughness: .03, metalness: .85 });
    const tapa = new T.Mesh(cg.clone(), mC); tapa.scale.set(1.025, .16, 1.025); tapa.position.y = h - h * .16 + .004; g.add(tapa);
    const v9 = o.v9, lx = 0, R = hc * (v9 ? .36 : .34), ly = pie + hc * (v9 ? .45 : .42), sal = d * (v9 ? .24 : .09);
    const bisel = new T.Mesh(new T.CylinderGeometry(R * 1.32, R * 1.38, .022, 48), mPl); bisel.rotation.x = Math.PI / 2; bisel.position.set(lx, ly, fz + .011); g.add(bisel);
    const aroN = new T.Mesh(new T.TorusGeometry(R * 1.12, R * .1, 10, 48), mAro); aroN.position.set(lx, ly, fz + .024); g.add(aroN);
    if (v9) { const hueco = new T.Mesh(new T.CircleGeometry(R * 1.3, 48), mNeg); hueco.position.set(lx, ly, fz + .023); g.add(hueco); }
    const barril = new T.Mesh(new T.CylinderGeometry(R * (v9 ? .72 : 1.02), R * (v9 ? .8 : 1.06), sal, 48), mAro); barril.rotation.x = Math.PI / 2; barril.position.set(lx, ly - (v9 ? R * .15 : 0), fz + sal / 2); g.add(barril);
    if (v9) { const cab = new T.Mesh(new T.CylinderGeometry(R * .82, R * .76, sal * .3, 48), mAro); cab.rotation.x = Math.PI / 2; cab.position.set(lx, ly - R * .15, fz + sal * .85); g.add(cab); }
    const cristal = new T.Mesh(new T.CircleGeometry(R * (v9 ? .7 : .9), 48), v9 ? new T.MeshStandardMaterial({ color: 0x18223a, emissive: 0x060c1c, roughness: .03, metalness: .8 }) : mLv); cristal.position.set(lx, ly - (v9 ? R * .15 : 0), fz + sal + .001); g.add(cristal);
    const elem = new T.Mesh(new T.SphereGeometry(R * .5, 32, 12, 0, Math.PI * 2, 0, Math.PI / 3.2), mLv); elem.rotation.x = Math.PI / 2; elem.position.set(lx, ly - (v9 ? R * .15 : 0), fz + sal - R * .5 * Math.cos(Math.PI / 3.2)); g.add(elem); if (v9) elem.material = cristal.material;
    g.userData.salida = new T.Vector3(lx, ly - (v9 ? R * .15 : 0), fz + sal);
    if (v9) [-1, 1].forEach(sg => { for (let i = 0; i < 4; i++) { B(w * .3, hc * .17, .006, mC2, sg * w * .31, pie + hc * (.17 + i * .2), fz + .001); B(w * .28, hc * .13, .006, mNeg, sg * w * .31, pie + hc * (.17 + i * .2), fz + .003); } });
    else [-1, 1].forEach(sg => { B(w * .26, hc * .62, .006, mNeg, sg * w * .33, pie + hc * .46, fz - .001); for (let i = 0; i < 10; i++) B(w * .26, hc * .028, .008, mC, sg * w * .33, pie + hc * (.2 + i * .058), fz + .001); });   // rejillas frontales a los lados de la óptica
    B(w * .018, hc * .06, .006, mPl, lx - R * 1.45, ly + R * .2, fz + .002);   // sensor junto a la óptica
    [-1, 1].forEach(sg => { if (v9) { for (let i = 0; i < 40; i++) B(.006, hc * .72, d * .009, mNeg, sg * (w / 2 + .001), pie + hc * .48, -d * .4 + i * d * .02); [-1, 1].forEach(sz => { const pv = new T.Mesh(new T.CylinderGeometry(w * .012, w * .012, .008, 16), mC2); pv.position.set(sg * w * .45, h + .008, sz * d * .44); g.add(pv); }); } else for (let i = 0; i < 14; i++) B(.006, hc * .028, d * .78, mNeg, sg * (w / 2 + .001), pie + hc * (.12 + i * .052), 0); });   // laterales de lamas (DU9000: verticales) y pivotes
    if (!o.v9) for (let i = 0; i < 4; i++) B(w * .012, .004, d * .05, mC2, (o.ledIzq ? -1 : 1) * w * (.16 + i * .03) - (o.ledIzq ? w * .16 : 0), h + .006, fz - d * .06);   // indicadores en la tapa
    for (let i = 0; i < 8; i++) B(w * .7, hc * .025, .004, mRej, 0, pie + hc * .22 + i * hc * .07, -fz);   // rejilla trasera
  } else if (o.tipo === 'vivi5') {   // Vivitek DU5000Z: óptica en un hueco negro algo a la izquierda, rejilla vertical a la izquierda, dos ruedas de lente encima
    const mNeg = new T.MeshStandardMaterial({ color: 0x08090a, roughness: .5 }), mLv = new T.MeshStandardMaterial({ color: 0x14141a, emissive: 0x06040a, roughness: .03, metalness: .85 });
    const bx = 0, hw = w * .16, hy0 = hc * .04, hy1 = hc * .94, rr = hc * .14, fh = new T.Shape(); fh.moveTo(bx - hw + rr, hy0); fh.lineTo(bx + hw - rr, hy0); fh.quadraticCurveTo(bx + hw, hy0, bx + hw, hy0 + rr); fh.lineTo(bx + hw, hy1 - rr); fh.quadraticCurveTo(bx + hw, hy1, bx + hw - rr, hy1); fh.lineTo(bx - hw + rr, hy1); fh.quadraticCurveTo(bx - hw, hy1, bx - hw, hy1 - rr); fh.lineTo(bx - hw, hy0 + rr); fh.quadraticCurveTo(bx - hw, hy0, bx - hw + rr, hy0);
    const hg = new T.Mesh(new T.ExtrudeGeometry(fh, { depth: .006, bevelEnabled: false }), mNeg); hg.position.set(0, pie, fz - .002); g.add(hg);
    const R = hc * .3, ly = pie + hc * .46, sal = d * .07;
    const barril = new T.Mesh(new T.CylinderGeometry(R * 1.05, R * 1.12, sal, 48), mAro); barril.rotation.x = Math.PI / 2; barril.position.set(bx, ly, fz + sal / 2); g.add(barril);
    const bisel = new T.Mesh(new T.TorusGeometry(R * .95, R * .1, 10, 48), mAro); bisel.position.set(bx, ly, fz + sal); g.add(bisel);
    const cristal = new T.Mesh(new T.CircleGeometry(R * .85, 48), mLv); cristal.position.set(bx, ly, fz + sal - .003); g.add(cristal);
    const elem = new T.Mesh(new T.SphereGeometry(R * .5, 32, 12, 0, Math.PI * 2, 0, Math.PI / 3.2), mLv); elem.rotation.x = Math.PI / 2; elem.position.set(bx, ly, fz + sal - .003 - R * .5 * Math.cos(Math.PI / 3.2)); g.add(elem);
    g.userData.salida = new T.Vector3(bx, ly, fz + sal);
    const mRv = new T.MeshStandardMaterial({ color: 0x0a0a0c, roughness: .7 });
    B(w * .2, hc * .62, .004, mRv, -w * .36, pie + hc * .48, fz - .001); for (let i = 0; i < 12; i++) B(w * .008, hc * .6, .008, mC, -w * .45 + i * w * .0165, pie + hc * .48, fz + .001);   // rejilla vertical izquierda
    for (let i = 0; i < 6; i++) B(w * .27, .0015, .003, mC2, w * .31, pie + hc * (.25 + i * .1), fz + .001);   // ranuras finas del frontal derecho
    [-1, 1].forEach(sg => { const hx = bx + sg * w * .08, hz = fz - d * .1; const hu = new T.Mesh(new T.CircleGeometry(w * .036, 32), mNeg); hu.rotation.x = -Math.PI / 2; hu.position.set(hx, h + .0008, hz); g.add(hu); const kn = new T.Mesh(new T.CylinderGeometry(w * .022, w * .022, .004, 24), mC2); kn.position.set(hx, h - .001, hz); g.add(kn); for (let k = 0; k < 6; k++) { const m = B(w * .004, .0015, w * .012, mNeg, hx + Math.cos(k * Math.PI / 3) * w * .016, h + .0012, hz + Math.sin(k * Math.PI / 3) * w * .016); m.rotation.y = -k * Math.PI / 3; } });   // huecos hundidos con la rueda de ajuste de lente dentro
    for (let i = 0; i < 4; i++) B(w * .012, .004, d * .04, mC2, -w * (.42 - i * .03), h + .004, fz - d * .05);   // indicadores
    [-1, 1].forEach(sg => { for (let i = 0; i < 12; i++) B(.005, hc * .03, d * .8, mRv, sg * (w / 2 + .001), pie + hc * (.15 + i * .06), 0); });   // laterales de lamas
    for (let i = 0; i < 8; i++) B(w * .7, hc * .025, .004, mRej, 0, pie + hc * .22 + i * hc * .07, -fz);   // rejilla trasera
  } else {
    const lx = o.lente === 'lado' ? -w * .22 : 0, R = hc * (o.tipo === 'grande' ? .34 : .3), ly = pie + hc * .5;
    const anillo = new T.Mesh(new T.CylinderGeometry(R * 1.18, R * 1.18, .012, 40), mC2); anillo.rotation.x = Math.PI / 2; anillo.position.set(lx, ly, fz); g.add(anillo);
    const barril = new T.Mesh(new T.CylinderGeometry(R, R * 1.05, d * (o.tipo === 'grande' ? .16 : .08), 40), mAro); barril.rotation.x = Math.PI / 2; barril.position.set(lx, ly, fz + d * (o.tipo === 'grande' ? .08 : .04)); g.add(barril);
    const cristal = new T.Mesh(new T.CircleGeometry(R * .82, 40), mVid); cristal.position.set(lx, ly, fz + d * (o.tipo === 'grande' ? .16 : .08) + .001); g.add(cristal);
    // rejillas de ventilación frontales a los lados de la óptica
    const lado = o.lente === 'lado' ? [1] : [-1, 1];
    lado.forEach(s => { const cx = o.lente === 'lado' ? w * .2 : s * w * .33; for (let i = 0; i < 6; i++) B(w * .2, hc * .025, .004, mRej, cx, pie + hc * .3 + i * hc * .075, fz); });
    for (let i = 0; i < 8; i++) B(w * .7, hc * .025, .004, mRej, 0, pie + hc * .22 + i * hc * .07, -fz);   // rejilla trasera
    B(w * .3, hc * .2, .006, mC2, w * .2, pie + hc * .3, -fz - .002);   // panel de conexiones
    if (o.tipo === 'grande') [-1, 1].forEach(s => { const asa = new T.Mesh(new T.TorusGeometry(hc * .2, w * .012, 8, 20, Math.PI), mC2); asa.position.set(s * (w / 2 + .004), pie + hc * .5, d * .25); asa.rotation.y = Math.PI / 2; asa.rotation.z = -Math.PI / 2; g.add(asa); });
  }
  // rótulo de marca y led de estado
  const c = document.createElement('canvas'); c.width = 256; c.height = 48; const x = c.getContext('2d'); x.fillStyle = '#e6e8ec'; x.font = 'bold 34px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(o.marca, 128, 26);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; const rot = new T.Mesh(new T.PlaneGeometry(w * .22, w * .22 * 48 / 256), new T.MeshBasicMaterial({ map: t, transparent: true }));
  if (o.tipo === 'periscopio') { rot.scale.setScalar(.45); rot.position.set(w * .36, pie + hc * .5, -fz - .004); rot.rotation.y = Math.PI; } else if (o.tipo === 'ust') { rot.scale.setScalar(.5); rot.position.set(0, pie + hc * .8, -fz - .003); rot.rotation.y = Math.PI; } else if (o.tipo === 'vivi5') { rot.scale.setScalar(.6); rot.rotation.x = -Math.PI / 2; rot.rotation.z = Math.PI; rot.position.set(0, h + .002, -d * .15); } else if (o.tipo === 'vivi') { rot.scale.setScalar(.7); rot.rotation.x = -Math.PI / 2; rot.rotation.z = Math.PI; rot.position.set(w * .18, h + .007, -d * .3); } else if (o.tipo === 'media' || o.tipo === 'pro') { rot.scale.setScalar(.95); rot.position.set(w * .32, pie + hc * (o.serie2 ? .72 : .5), fz + .004); } else { rot.position.set(o.lente === 'lado' ? w * .22 : -w * .3, pie + hc * .84, fz + .001); } g.add(rot);
  if (!['ust', 'periscopio', 'media', 'pro', 'vivi', 'vivi5'].includes(o.tipo)) B(w * .03, hc * .02, .004, new T.MeshBasicMaterial({ color: 0x3cff7a }), w * .4, pie + hc * .85, fz + .001);
  if (o.espejo) { g.scale.x = -1; rot.scale.x *= -1; }   // misma caja con frontal invertido (rejilla a la derecha)
  return g; }

// familia de cada proyector del catálogo
function familia(prod) {
  const m = prod.modelo || '', s = prod.serie || '', ch = prod.chasis || [0.55, 0.45, 0.2];
  const o = { chasis: ch, color: 'gris', marca: prod.marca || '' }, plegada = /^ELPLX0[12]/.test(prod.optica || '');   // ópticas ultracortas plegadas de Epson (ELPLX01/02)
  if (m === 'EB-815E') return Object.assign(o, { tipo: 'ust' });
  if (m === 'EB-805F') return Object.assign(o, { tipo: 'periscopio' });
  if (/^EB-L[67]95S/.test(m)) return Object.assign(o, { tipo: 'media' });
  if (m === 'EB-XQ2030B') return Object.assign(o, { tipo: 'pro', espejo: true, serie2: true, xq: true, lenteUST: plegada });
  if (/^EB-P[UQ]22/.test(m)) return Object.assign(o, { tipo: 'pro', espejo: true, serie2: true, lenteUST: plegada });
  if (/^EB-P[UQ]/.test(m)) return Object.assign(o, plegada ? { tipo: 'pro', espejo: true, lenteUST: true } : { tipo: 'pro' });
  if (s === 'DU7000Z') return Object.assign(o, { tipo: 'vivi' });
  if (s === 'DU8000Z' || s === 'DK8000Z') return Object.assign(o, { tipo: 'vivi', ledIzq: true });
  if (s === 'DU9057Z' || s === 'DU9059Z') return Object.assign(o, { tipo: 'vivi', v9: true });
  if (s === 'DU5000Z' || s === 'DK5000Z') return Object.assign(o, { tipo: 'vivi5' });
  /* v11.45 · CHRISTIE (de vuelta en el cálculo): cada serie con la forma más parecida de las que ya hay, a la medida real de su chasis.
     Captiva = ultracorta de sobremesa; Inspire = compacto de instalación; GS, Jazz y Korus = cuerpo profesional de óptica intercambiable;
     M RGB, Griffyn y Sapphire = gran formato */
  if (o.marca === 'CHRISTIE') { if (s === 'CAPTIVA') return Object.assign(o, { tipo: 'ust' }); if (/^INSPIRE/.test(s)) return Object.assign(o, { tipo: 'media' }); if (s === 'GS' || s === 'JAZZ' || s === 'KORUS') return Object.assign(o, { tipo: 'pro' }); }
  return Object.assign(o, { tipo: 'grande' });
}
// los colores del cuerpo se ajustaron con la gestión de color de three r149 (sin conversión); aquí, con la de r160, se devuelven a ese mismo tono
function igualaColor(g) {
  const vistos = new Set();
  g.traverse((n) => { if (!n.isMesh) return; n.castShadow = true; const m = n.material; if (!m || vistos.has(m)) return; vistos.add(m);
    if (m.color && !m.map) m.color.convertLinearToSRGB(); if (m.emissive) m.emissive.convertLinearToSRGB(); });
}
const CACHE = new Map();
const ROJO = { color: 0xff3344, roughness: 0.4, metalness: 0.1, emissive: 0x550008 };
// cuerpo listo para colocar: el punto de salida de la luz queda en el origen del grupo y la luz sale hacia +z
export function cuerpoProyector(T, prod, rojo) {
  const o = familia(prod), k = JSON.stringify(o);
  if (!CACHE.has(k)) {
    const c = construir(T, o); igualaColor(c);
    const sal = (c.userData.salida || new T.Vector3(0, o.chasis[2] / 2, o.chasis[1] / 2)).clone();
    const g = new T.Group(), dentro = new T.Group(); dentro.add(c);
    if (o.lenteUST) { dentro.rotation.y = Math.PI; sal.applyAxisAngle(new T.Vector3(0, 1, 0), Math.PI); }   // óptica plegada: proyecta hacia atrás, el cuerpo mira al contrario
    dentro.position.copy(sal).multiplyScalar(-1); g.add(dentro); CACHE.set(k, g);
  }
  const g = CACHE.get(k).clone(true);
  if (rojo) { const mR = new T.MeshStandardMaterial(ROJO); g.traverse((n) => { if (n.isMesh) n.material = mR; }); }   // en rojo, el que queda dentro del haz de otra superficie
  return g;
}
