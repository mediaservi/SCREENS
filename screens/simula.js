// SCREENS · SIMULAR (v10.91, pedido por Josep, 24-11-2026): vuelo de dron en bucle cerrado alrededor de un templo modernista
// de torres agujas en medio de una cuadrícula de manzanas con chaflán, con plazas, estanque, árboles, montaña al fondo y mar.
// Se dibuja en 360°: una cámara cúbica en el dron y un paso que la convierte en un panorama cilíndrico, de
// modo que la vuelta completa casa en la esquina (salas inmersivas de 4 paredes y, más adelante, esféricas).
// Todo es geometría generada (sin archivos que descargar): poligonal, pero no «low poly».
import * as THREE from 'three';

const PI2 = Math.PI * 2;
const azarDe = (s) => { let a = s; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; };

// texturas pintadas en un lienzo (piedra perforada de las torres, fachadas con ventanas, ventanales del templo)
function lienzo(w, h, pinta) { const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
function texTorre(base, oscuro) {
  return lienzo(256, 1024, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const az = azarDe(11);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${az() < 0.5 ? '255,245,225' : '60,45,30'},${0.04 + az() * 0.06})`; g.fillRect(az() * w, az() * h, 2 + az() * 6, 2 + az() * 6); }   // grano de la piedra
    g.strokeStyle = 'rgba(40,30,20,.35)'; g.lineWidth = 3; for (let x = 0; x <= w; x += w / 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }   // nervios verticales
    g.fillStyle = oscuro; for (let y = 24; y < h; y += 44) for (let k = 0; k < 8; k++) { const x = (k + 0.5 + ((y / 44) % 2) * 0.5) * w / 8; g.beginPath(); g.ellipse(x % w, y, 7, 14, 0, 0, PI2); g.fill(); }   // ventanas en espiral (las «persianas» de piedra)
    g.fillStyle = 'rgba(255,240,210,.18)'; for (let y = 0; y < h; y += 88) g.fillRect(0, y, w, 4);
  });
}
const texFachada = () => lienzo(256, 256, (g, w, h) => {
  g.fillStyle = '#efe5d4'; g.fillRect(0, 0, w, h);
  const az = azarDe(5);
  for (let f = 0; f < 8; f++) for (let c = 0; c < 6; c++) { const x = c * w / 6 + 8, y = f * h / 8 + 7; g.fillStyle = az() < 0.25 ? '#5a6672' : '#45505c'; g.fillRect(x, y, w / 6 - 16, h / 8 - 15); g.fillStyle = '#efe6d6'; g.fillRect(x - 2, y + h / 8 - 15, w / 6 - 12, 3); }   // ventanas y balcones
  g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 0, w, 4);
});
const texVitral = () => lienzo(256, 256, (g, w, h) => {
  g.fillStyle = '#cbb595'; g.fillRect(0, 0, w, h);
  for (let c = 0; c < 4; c++) { const x = c * w / 4 + 10, ww = w / 4 - 20; g.fillStyle = '#2d3540'; g.beginPath(); g.moveTo(x, h - 10); g.lineTo(x, 60); g.quadraticCurveTo(x + ww / 2, 0, x + ww, 60); g.lineTo(x + ww, h - 10); g.fill();
    g.fillStyle = ['#7a3a2a', '#2f5e7a', '#7a6a2a', '#3b6a3a'][c]; g.globalAlpha = 0.45; g.fillRect(x + 6, 80, ww - 12, h - 100); g.globalAlpha = 1; }
});

// torre aguja: perfil de botella parabólica girado, con su remate de colores
function torre(T, h, r, mat, remate) {
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector2(r * (1 - 0.82 * Math.pow(t, 1.55)) * (1 + 0.04 * Math.sin(t * 30)), t * h * 0.86)); }
  pts.push(new THREE.Vector2(r * 0.1, h * 0.88));
  const g = new THREE.Group(), cu = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), mat); g.add(cu);
  const y0 = h * 0.86;
  if (remate === 'cruz') {   // torre de Jesús: cruz blanca de cuatro brazos
    const mc = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.35, metalness: 0.1, emissive: 0x332f28 });
    const a = new THREE.Mesh(new THREE.BoxGeometry(r * 0.3, h * 0.1, r * 0.3), mc); a.position.y = y0 + h * 0.07; g.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, r * 0.3, r * 0.3), mc); b.position.y = y0 + h * 0.09; g.add(b); const c = b.clone(); c.rotation.y = Math.PI / 2; g.add(c);
  } else if (remate === 'estrella') {   // torre de María: estrella de doce puntas
    const e = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.55, 0), new THREE.MeshStandardMaterial({ color: 0xfff8e0, emissive: 0x6a5a30, roughness: 0.3, metalness: 0.2 })); e.position.y = y0 + r * 0.8; g.add(e);
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(r * 0.75, 0), e.material); s.position.copy(e.position); s.rotation.set(0.6, 0.3, 0.2); g.add(s);
  } else {   // apóstoles: báculo de mosaico (rojo, amarillo, blanco) con esferas
    const cols = [0xc93c2c, 0xe7b62c, 0xf2efe6, 0xd96c2c];
    const m1 = new THREE.MeshStandardMaterial({ color: cols[remate % 4], roughness: 0.45, metalness: 0.15 }), m2 = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.4 });
    const fu = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.24, h * 0.07, 12), m1); fu.position.y = y0 + h * 0.03; g.add(fu);
    const cr = new THREE.Mesh(new THREE.TorusGeometry(r * 0.28, r * 0.07, 8, 20), m1); cr.position.y = y0 + h * 0.075; cr.rotation.x = Math.PI / 2; g.add(cr);
    for (let k = 0; k < 6; k++) { const bo = new THREE.Mesh(new THREE.SphereGeometry(r * 0.09, 10, 8), m2); const a = k / 6 * PI2; bo.position.set(Math.cos(a) * r * 0.28, y0 + h * 0.085, Math.sin(a) * r * 0.28); g.add(bo); }
    const pu = new THREE.Mesh(new THREE.ConeGeometry(r * 0.1, h * 0.05, 10), m2); pu.position.y = y0 + h * 0.11; g.add(pu);
  }
  return g;
}

export function crearSimula() {
  const sc = new THREE.Scene(), az = azarDe(23);
  sc.background = new THREE.Color(0x9cc3e6); sc.fog = new THREE.Fog(0xbcd3e6, 700, 2600);
  const hemi = new THREE.HemisphereLight(0xdfeeff, 0x6b5a45, 1.25); sc.add(hemi);
  const sol = new THREE.DirectionalLight(0xfff1d6, 2.6); sol.position.set(380, 520, 260); sc.add(sol);
  const amb = new THREE.AmbientLight(0xffffff, 0.18); sc.add(amb);
  // cielo con degradado (cúpula) y sol
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(2900, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: new THREE.Color(0x3f7fc6) }, b: { value: new THREE.Color(0xcfe2f1) }, sd: { value: new THREE.Vector3(.55, .62, .4) }, sc: { value: new THREE.Color(1, .9, .7) }, est: { value: 0 } },
    vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform vec3 a; uniform vec3 b; uniform vec3 sd; uniform vec3 sc; uniform float est; varying vec3 p; float h1(vec3 q){ return fract(sin(dot(q, vec3(12.99, 78.23, 45.16))) * 43758.55); } void main(){ float h = clamp(p.y*1.6, 0., 1.); vec3 c = mix(b, a, pow(h, .7)); vec3 s = normalize(sd); float d = max(0., dot(p, s)); c += sc * (pow(d, 400.) * 2. + pow(d, 8.) * .25 + pow(d, 2.) * .08 * (1. - h)); vec3 q = floor(p * 420.); float st = step(.9965, h1(q)) * smoothstep(.02, .3, p.y); c += vec3(st) * est * (.6 + .4 * h1(q + 3.)); gl_FragColor = vec4(c, 1.); }' }));
  sc.add(cielo);
  // suelo: asfalto de la ciudad · v11.36 · orientación real del Eixample: la montaña (Collserola, con el Tibidabo) detrás del ábside (−z, «muntanya»),
  // el mar delante de la fachada de la Gloria (+z, «mar»), Montjuïc hacia el Llobregat (−x, +z) y la avenida de Gaudí en diagonal hasta Sant Pau
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: 0x77736d })); suelo.rotation.x = -Math.PI / 2; sc.add(suelo);
  const mar = new THREE.Mesh(new THREE.PlaneGeometry(6000, 2600), new THREE.MeshStandardMaterial({ color: 0x2f6f9c, roughness: 0.25, metalness: 0.3 })); mar.rotation.x = -Math.PI / 2; mar.position.set(0, 0.4, 2350); sc.add(mar);
  // cordillera al noroeste, siempre fuera de la ciudad (las zonas llanas quedan bajo el asfalto)
  const mg = new THREE.PlaneGeometry(7000, 7000, 170, 170); mg.rotateX(-Math.PI / 2); const MP = mg.attributes.position;
  const relieve = (x, z) => { const d = -z - 1250, lat = x; const sierra = d > 0 ? Math.min(1, d / 600) * (210 + 70 * Math.sin(lat * 0.0035) + 40 * Math.sin(lat * 0.011 + 2) + 15 * Math.sin(lat * 0.03)) : -2;
    const mj = Math.hypot(x + 1900, z - 1500); return Math.max(sierra, mj < 650 ? 175 * Math.pow(Math.cos(mj / 650 * Math.PI / 2), 1.6) - 2 : -2); };   /* v11.36 · y Montjuïc junto al mar, hacia el Llobregat */
  for (let i = 0; i < MP.count; i++) MP.setY(i, relieve(MP.getX(i), MP.getZ(i)));
  mg.computeVertexNormals(); const monte = new THREE.Mesh(mg, new THREE.MeshLambertMaterial({ color: 0x6d8a55 })); sc.add(monte);
  // en la cumbre: el templo del monte (dorado de noche), la noria y el parque de atracciones, y a su izquierda la torre de comunicaciones
  const enMonte = (d, lat) => [lat, -d - 1250];
  const cumbre = new THREE.Group(); { const [cx, cz] = enMonte(620, 60); cumbre.position.set(cx, relieve(cx, cz) - 4, cz); cumbre.scale.setScalar(2.2); sc.add(cumbre); }   // algo mayor que en la realidad para que se lea a 2 km
  const mIg = new THREE.MeshStandardMaterial({ color: 0xcdbfa4, roughness: 0.8, emissive: 0xffb43c, emissiveIntensity: 0 });
  const ig = (g, w, h, d, x, y, z) => { const b = new THREE.Mesh(g || new THREE.BoxGeometry(w, h, d), mIg); b.position.set(x, y, z); cumbre.add(b); return b; };
  ig(null, 34, 26, 22, 0, 13, 0); ig(new THREE.CylinderGeometry(7, 8, 34, 16), 0, 0, 0, 0, 43, 0); ig(new THREE.ConeGeometry(7.5, 22, 16), 0, 0, 0, 0, 71, 0);
  [[-14, -9], [14, -9], [-14, 9], [14, 9]].forEach(([x, z]) => { ig(new THREE.CylinderGeometry(2.4, 2.6, 30, 10), 0, 0, 0, x, 15, z); ig(new THREE.ConeGeometry(2.6, 10, 10), 0, 0, 0, x, 35, z); });
  const estatua = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd9b36a, metalness: 0.6, roughness: 0.35, emissive: 0xffd27a, emissiveIntensity: 0 })); estatua.position.y = 88; cumbre.add(estatua);
  const noria = new THREE.Group(); noria.position.set(58, 26, 8); cumbre.add(noria);
  const mNor = new THREE.MeshBasicMaterial({ color: 0xd8dde3, toneMapped: false }); noria.add(new THREE.Mesh(new THREE.TorusGeometry(20, 0.8, 8, 48), mNor));
  for (let k = 0; k < 12; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.5, 40, 0.5), mNor); r.rotation.z = k * Math.PI / 12; noria.add(r); }
  [[-8, -1], [8, -1]].forEach(([x]) => { const pa = new THREE.Mesh(new THREE.BoxGeometry(1, 30, 1), new THREE.MeshLambertMaterial({ color: 0x8a8f96 })); pa.position.set(58 + x * 0.5, 12, 8); pa.rotation.z = x > 0 ? 0.25 : -0.25; cumbre.add(pa); });
  const atr = []; for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(3 + k % 3, 3 + k % 3, 4 + (k * 7) % 12, 12), new THREE.MeshLambertMaterial({ color: [0xd23a3a, 0x2f7ad8, 0xe8c23a, 0x39a85a, 0xd86a2a, 0x9a4ad0][k], emissive: 0xffffff, emissiveIntensity: 0 })); m.position.set(-40 + k * 13, 3, 22 + (k % 2) * 10); cumbre.add(m); atr.push(m); }
  const pt = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 46, 6), new THREE.MeshLambertMaterial({ color: 0xb0b0b0 })); pt.position.set(30, 23, -18); cumbre.add(pt);
  const torreCom = new THREE.Group(); { const [tx, tz] = enMonte(560, -520); torreCom.position.set(tx, relieve(tx, tz) - 3, tz); torreCom.scale.setScalar(1.6); sc.add(torreCom); }
  const mT2 = new THREE.MeshLambertMaterial({ color: 0xd9dde2 }); const fus = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 290, 10), mT2); fus.position.y = 145; torreCom.add(fus);
  for (let k = 0; k < 6; k++) { const di = new THREE.Mesh(new THREE.CylinderGeometry(14 - k * 0.6, 14 - k * 0.6, 2.2, 3), mT2); di.position.y = 140 + k * 5.5; torreCom.add(di); }
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 60, 6), mT2); ant.position.y = 320; torreCom.add(ant);
  for (let k = 0; k < 3; k++) { const a = k * PI2 / 3, ca = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 175, 4), new THREE.MeshBasicMaterial({ color: 0x9aa0a6 })); ca.position.set(Math.cos(a) * 45, 70, Math.sin(a) * 45); ca.lookAt(0, 165 + torreCom.position.y, 0); ca.rotateX(Math.PI / 2); ca.position.set(Math.cos(a) * 45, 70, Math.sin(a) * 45); torreCom.add(ca); }
  const mRoja = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false, fog: false }); const balizas = [150, 220, 290, 348].map(y => { const b = new THREE.Mesh(new THREE.SphereGeometry(3.2, 8, 6), mRoja); b.position.y = y; torreCom.add(b); return b; });
  // manzanas del ensanche: octógonos con chaflán y patio interior, con fachadas de ventanas y azoteas
  const L = 56.6, CH = 14, IN = 34, ICH = 9, PASO = 133.3;
  const oct = (h, c) => { const s = new THREE.Shape(); s.moveTo(-h + c, -h); s.lineTo(h - c, -h); s.lineTo(h, -h + c); s.lineTo(h, h - c); s.lineTo(h - c, h); s.lineTo(-h + c, h); s.lineTo(-h, h - c); s.lineTo(-h, -h + c); s.closePath(); return s; };
  const anillo = oct(L, CH); anillo.holes.push(oct(IN, ICH));
  const gM = new THREE.ExtrudeGeometry(anillo, { depth: 24, bevelEnabled: false }); gM.rotateX(-Math.PI / 2);
  const tF = texFachada(); tF.repeat.set(1 / 24, 1 / 24);
  const tE = lienzo(256, 256, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); const z = azarDe(5); for (let f = 0; f < 8; f++) for (let c = 0; c < 6; c++) { z(); if (z() < 0.13) { g.fillStyle = z() < 0.7 ? '#ffcf7a' : z() < 0.5 ? '#fff1c8' : '#9fd2ff'; g.fillRect(c * w / 6 + 8, f * h / 8 + 7, w / 6 - 16, h / 8 - 15); } } }); tE.repeat.set(1 / 24, 1 / 24);
  const matM = [new THREE.MeshLambertMaterial({ color: 0xe9dfd0 }), new THREE.MeshLambertMaterial({ map: tF, color: 0xffffff, emissiveMap: tE, emissive: 0xffffff, emissiveIntensity: 0 })];
  const celdas = []; const R = 6;
  for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) { if (Math.hypot(i, j) > R + 0.4) continue; celdas.push([i, j]); }
  const especial = (i, j) => (i === 0 && j === 0) || (i === 1 && j === 0) || (i === -1 && j === 0) || (i + j === 1 && i >= 2);   /* v11.36 · las manzanas que corta la avenida de Gaudí van aparte */
  const nor = celdas.filter(([i, j]) => !especial(i, j));
  const man = new THREE.InstancedMesh(gM, matM, nor.length), M4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), v1 = new THREE.Vector3(), c3 = new THREE.Color();
  const tonos = [0xfff6e8, 0xf6e8d2, 0xfffaf0, 0xeedfc8, 0xfbeee0, 0xece6dc, 0xf3dcc4];
  nor.forEach(([i, j], k) => { M4.compose(v1.set(i * PASO, 0, j * PASO), q0, new THREE.Vector3(1, 0.7 + az() * 0.55, 1)); man.setMatrixAt(k, M4); man.setColorAt(k, c3.set(tonos[Math.floor(az() * tonos.length)])); });
  sc.add(man);
  // patios con árboles y detalles de azotea (casetas, depósitos)
  const copa = new THREE.IcosahedronGeometry(1, 1), mCopa = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const arb = []; const pon = (x, z, r, h) => arb.push([x, z, r, h]);
  nor.forEach(([i, j]) => { for (let k = 0; k < 7; k++) pon(i * PASO + (az() - 0.5) * 50, j * PASO + (az() - 0.5) * 50, 3 + az() * 2.5, 6 + az() * 4); });
  const cas = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), nor.length * 6); let kc = 0;
  nor.forEach(([i, j]) => { for (let k = 0; k < 6; k++) { const lado = Math.floor(az() * 4), t = (az() - 0.5) * 70, d = 45; const x = i * PASO + (lado < 2 ? t : (lado === 2 ? d : -d)), z = j * PASO + (lado >= 2 ? t : (lado === 0 ? d : -d));
    M4.compose(v1.set(x, 26 + az() * 3, z), q0, new THREE.Vector3(4 + az() * 6, 2 + az() * 3, 4 + az() * 6)); cas.setMatrixAt(kc, M4); cas.setColorAt(kc++, c3.set(az() < 0.5 ? 0xc9c2b8 : 0xa8582f)); } });
  sc.add(cas);
  // árboles de las calles (plátanos de sombra a los dos lados)
  for (let i = -R; i <= R + 1; i++) { const c = (i - 0.5) * PASO; for (let s = -R * PASO; s <= R * PASO; s += 15) { const lim = Math.hypot(c, s) < R * PASO; if (!lim) continue; [-6.5, 6.5].forEach(o => { pon(c + o, s, 3.2 + az() * 1.4, 9 + az() * 3); pon(s, c + o, 3.2 + az() * 1.4, 9 + az() * 3); }); } }
  // v11.36 · AVINGUDA DE GAUDÍ: paseo en diagonal desde la esquina de la plaza de Gaudí hasta el Hospital de Sant Pau; corta las manzanas en dos
  { const A = 26, recorta = (pts, sg) => { const out = []; for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length], fa = sg * (a[0] + a[1]) / Math.SQRT2 - A, fb = sg * (b[0] + b[1]) / Math.SQRT2 - A;
        if (fa >= 0) out.push(a); if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } } return out; };
    const octP = (h, c) => [[-h + c, -h], [h - c, -h], [h, -h + c], [h, h - c], [h - c, h], [-h + c, h], [-h, h - c], [-h, -h + c]];
    celdas.filter(([i, j]) => i + j === 1 && i >= 2).forEach(([i, j]) => [1, -1].forEach((sg) => { const q = recorta(octP(L, CH), sg); if (q.length < 3) return; const sh = new THREE.Shape(); q.forEach(([x, y], k) => (k ? sh.lineTo(x, -y) : sh.moveTo(x, -y)));
      const g = new THREE.ExtrudeGeometry(sh, { depth: 24 * (0.75 + az() * 0.45), bevelEnabled: false }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, matM); m.position.set(i * PASO, 0, j * PASO); sc.add(m); }));
    /* el paseo: panot claro, dos hileras de árboles y farolas, de la plaza (x + z = PASO) hacia el noreste */
    const x0 = PASO * 1.5, z0 = -PASO * 0.5, lar = PASO * 4.6 * Math.SQRT2, dir = new THREE.Vector2(1, -1).normalize();
    const pas = new THREE.Mesh(new THREE.PlaneGeometry(A * 2, lar), new THREE.MeshLambertMaterial({ color: 0xc9b9a3 })); pas.rotation.x = -Math.PI / 2; pas.rotation.z = -Math.PI / 4;
    pas.position.set(x0 + dir.x * lar / 2, 0.35, z0 + dir.y * lar / 2); sc.add(pas);
    for (let s2 = 6; s2 < lar; s2 += 11) [-14, 14].forEach((o) => pon(x0 + dir.x * s2 + o / Math.SQRT2, z0 + dir.y * s2 + o / Math.SQRT2, 3.4 + az() * 1.2, 9 + az() * 3));
    /* HOSPITAL DE SANT PAU, al final del paseo: pabellones de ladrillo con cúpulas de cerámica y el pabellón de la Administración con su torre del reloj, girados 45° */
    const SP = new THREE.Group(); SP.position.set(x0 + dir.x * (lar + 120), 0, z0 + dir.y * (lar + 120)); SP.rotation.y = Math.PI / 4; sc.add(SP);
    const lad = new THREE.MeshLambertMaterial({ color: 0xa4553a }), pie = new THREE.MeshLambertMaterial({ color: 0xd8c9a8 }), cer = [0x2f8a6a, 0xd9a42a, 0x3c74b8, 0xc4483a].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.2 }));
    const pab = (w, h, d, x, z, k) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lad); b.position.set(x, h / 2, z); SP.add(b); const t = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 1.5, d + 1), pie); t.position.set(x, h, z); SP.add(t);
      const cu = new THREE.Mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.32, 18, 10, 0, PI2, 0, Math.PI / 2), cer[k % 4]); cu.position.set(x, h + 0.7, z); SP.add(cu);
      const pi = new THREE.Mesh(new THREE.ConeGeometry(1.6, 9, 10), cer[(k + 1) % 4]); pi.position.set(x, h + Math.min(w, d) * 0.32 + 4, z); SP.add(pi); };
    pab(150, 20, 22, 0, 90, 0); const to = new THREE.Mesh(new THREE.BoxGeometry(14, 62, 14), lad); to.position.set(0, 31, 90); SP.add(to); const ag = new THREE.Mesh(new THREE.ConeGeometry(9, 22, 4), cer[0]); ag.position.set(0, 73, 90); ag.rotation.y = Math.PI / 4; SP.add(ag);
    for (let f = 0; f < 3; f++) for (let c = 0; c < 4; c++) pab(22, 14, 40, -75 + c * 50, 30 - f * 70, f * 4 + c);
    for (let k = 0; k < 40; k++) pon(SP.position.x + (az() - 0.5) * 260, SP.position.z + (az() - 0.5) * 260, 3 + az() * 2, 7 + az() * 4); }
  // plaza de Gaudí (estanque y jardín, delante de la fachada del Nacimiento) y plaza de la Sagrada Família (fachada de la Pasión)
  const cesped = new THREE.MeshLambertMaterial({ color: 0x6f8f4c });
  [[PASO, 0], [-PASO, 0]].forEach(([x, z], n) => { const p = new THREE.Mesh(new THREE.ShapeGeometry(oct(L, CH)), cesped); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.3, z); sc.add(p);
    for (let k = 0; k < 60; k++) { const a = az() * PI2, r = 14 + az() * 38; pon(x + Math.cos(a) * r, z + Math.sin(a) * r, 3.5 + az() * 3, 8 + az() * 6); }
    if (!n) { const es = new THREE.Shape(); for (let k = 0; k <= 40; k++) { const a = k / 40 * PI2, r = 22 + 6 * Math.sin(a * 3) + 4 * Math.cos(a * 5); const P0 = [Math.cos(a) * r * 1.2, Math.sin(a) * r * 0.8]; if (!k) es.moveTo(...P0); else es.lineTo(...P0); }
      const ag = new THREE.Mesh(new THREE.ShapeGeometry(es), new THREE.MeshStandardMaterial({ color: 0x3e7f8e, roughness: 0.15, metalness: 0.35 })); ag.rotation.x = -Math.PI / 2; ag.position.set(x - 6, 0.5, z + 8); sc.add(ag); } });
  const AR = new THREE.InstancedMesh(copa, mCopa, arb.length);
  arb.forEach(([x, z, r, h], k) => { M4.compose(v1.set(x, h - r * 0.4, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(az(), az() * 6, az())), new THREE.Vector3(r, r * 0.9, r)); AR.setMatrixAt(k, M4); AR.setColorAt(k, c3.setHSL(0.22 + az() * 0.07, 0.38 + az() * 0.15, 0.24 + az() * 0.1)); });
  sc.add(AR);
  // EL TEMPLO: planta de cruz latina (nave a lo largo de z, crucero a lo largo de x), ábside al norte
  const T = new THREE.Group(); sc.add(T);
  const tV = texVitral(); tV.repeat.set(4, 1);
  const mPiedra = new THREE.MeshStandardMaterial({ map: tV, color: 0xffffff, roughness: 0.9 }), mPiedraV = new THREE.MeshStandardMaterial({ color: 0x9a7f5f, roughness: 0.95 });
  const mTecho = new THREE.MeshStandardMaterial({ color: 0xb8aa94, roughness: 0.8 });
  const caja = (w, h, d, x, y, z, m = mPiedra) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); T.add(b); return b; };
  const techo = (w, d, h, x, y, z, rotY = 0) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(0, h); s.lineTo(w / 2, 0); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); const m = new THREE.Mesh(g, mTecho); m.position.set(x, y, z); m.rotation.y = rotY; T.add(m); };
  caja(46, 34, 92, 0, 0, -6); techo(46, 92, 22, 0, 34, -6);                    // nave
  caja(96, 34, 32, 0, 0, 0); techo(32, 96, 22, 0, 34, 0, Math.PI / 2);         // crucero
  const abside = new THREE.Mesh(new THREE.CylinderGeometry(23, 23, 34, 32, 1, false, Math.PI / 2, Math.PI), mPiedra); abside.position.set(0, 17, -52); T.add(abside);
  for (let k = 0; k < 7; k++) { const a = (k + 0.5) / 7 * Math.PI, ca = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5, 26, 14), mPiedraV); ca.position.set(Math.cos(a) * 26, 13, -52 - Math.sin(a) * 26); T.add(ca);   // capillas del ábside
    const pi = new THREE.Mesh(new THREE.ConeGeometry(2.2, 12, 10), mTecho); pi.position.set(ca.position.x, 32, ca.position.z); T.add(pi); }
  // pináculos a lo largo de los tejados
  const pin = new THREE.InstancedMesh(new THREE.ConeGeometry(1.3, 9, 10), mTecho, 64); let kp = 0;
  for (let z = -46; z <= 36; z += 8) [-23, 23].forEach(x => { if (kp < 64) { M4.compose(v1.set(x, 38.5, z), q0, new THREE.Vector3(1, 1, 1)); pin.setMatrixAt(kp++, M4); } });
  for (let x = -44; x <= 44; x += 8) [-16, 16].forEach(z => { if (kp < 64 && Math.abs(x) > 24) { M4.compose(v1.set(x, 38.5, z), q0, new THREE.Vector3(1, 1, 1)); pin.setMatrixAt(kp++, M4); } });
  pin.count = kp; T.add(pin);
  // fachadas: Nacimiento (+x, piedra antigua y oscura, orgánica), Pasión (−x, columnas inclinadas como huesos) y Gloria (+z, la principal)
  caja(6, 58, 40, 50, 0, 0, mPiedraV);
  for (let k = 0; k < 140; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + az() * 2.6, 1), mPiedraV); b.position.set(53 + az() * 2, 6 + az() * 50, (az() - 0.5) * 38); b.scale.y = 1 + az() * 1.5; T.add(b); }   // escultura orgánica
  [-12, 0, 12].forEach(z => { const p = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 1, 20, 1, false, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1b1712 })); p.rotation.z = Math.PI / 2; p.rotation.x = Math.PI / 2; p.scale.set(1, 1, 3.6); p.position.set(56, 14, z); T.add(p); });
  const cipres = new THREE.Mesh(new THREE.ConeGeometry(4, 22, 16), new THREE.MeshStandardMaterial({ color: 0x3f6a46, roughness: 0.7 })); cipres.position.set(53, 58, 0); T.add(cipres);
  caja(6, 48, 40, -50, 0, 0, new THREE.MeshStandardMaterial({ color: 0xcfc4b0, roughness: 0.85 }));
  for (let k = 0; k < 6; k++) { const co = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 26, 12), new THREE.MeshStandardMaterial({ color: 0xd8cfbf, roughness: 0.8 })); co.position.set(-56, 12, -15 + k * 6); co.rotation.z = (k % 2 ? 1 : -1) * 0.18; co.rotation.x = (k - 2.5) * 0.05; T.add(co); }
  caja(52, 6, 8, -56, 26, 0, new THREE.MeshStandardMaterial({ color: 0xcfc4b0, roughness: 0.85 })).rotation.y = Math.PI / 2;
  caja(60, 50, 8, 0, 0, 44, new THREE.MeshStandardMaterial({ color: 0xd9cfbd, roughness: 0.85 }));
  // torres: 12 apóstoles (4 por fachada), 4 evangelistas, María (estrella) y Jesús (cruz), la más alta
  const tNueva = new THREE.MeshStandardMaterial({ map: texTorre('#d6c9b0', 'rgba(40,32,24,.85)'), roughness: 0.85, emissive: 0xffb45a, emissiveIntensity: 0 });
  const tVieja = new THREE.MeshStandardMaterial({ map: texTorre('#a88a68', 'rgba(30,22,14,.9)'), roughness: 0.9, emissive: 0xff9a40, emissiveIntensity: 0 });
  const pon4 = (eje, fijo, signo, mat) => [-18, -6, 6, 18].forEach((s, k) => { const h = (k === 0 || k === 3) ? 98 : 110, t = torre(T, h, 5.2, mat, k + (eje === 'x' ? 0 : 1)); if (eje === 'x') t.position.set(fijo, 0, s); else t.position.set(s, 0, fijo); T.add(t); void signo; });
  pon4('x', 50, 1, tVieja); pon4('x', -50, -1, tNueva);   /* v11.36 · las torres de la fachada de la Gloria aún no están construidas: no se pintan */
  [[-13, -13], [13, -13], [-13, 13], [13, 13]].forEach(([x, z], k) => { const t = torre(T, 135, 7, tNueva, k + 2); t.position.set(x, 0, z); T.add(t); });
  const maria = torre(T, 138, 7.4, tNueva, 'estrella'); maria.position.set(0, 0, -40); T.add(maria);
  const jesus = torre(T, 172, 10.5, tNueva, 'cruz'); jesus.position.set(0, 0, 0); T.add(jesus);
  // sin grúas de obra (Josep, 24-11-2026)
  T.scale.setScalar(1.45);
  // farolas de las calles (se encienden al anochecer)
  const far = []; for (let i = -R; i <= R + 1; i++) { const c = (i - 0.5) * PASO; for (let s2 = -R * PASO; s2 <= R * PASO; s2 += 30) { if (Math.hypot(c, s2) > R * PASO) continue; far.push([c + 9, s2], [s2, c + 9]); } }
  const mFar = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }), FA = new THREE.InstancedMesh(new THREE.SphereGeometry(1.4, 8, 6), mFar, far.length);
  far.forEach(([x, z], k) => { M4.compose(v1.set(x, 7, z), q0, new THREE.Vector3(1, 1, 1)); FA.setMatrixAt(k, M4); }); sc.add(FA);
  // haces de luz desde lo alto del templo (de noche barren el cielo) y el remate de Jesús que brilla
  const haces = new THREE.Group(); haces.position.y = 120; sc.add(haces);
  const mHaz = new THREE.MeshBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
  const gHaz = new THREE.ConeGeometry(18, 1400, 24, 1, true); gHaz.translate(0, -700, 0); gHaz.rotateX(Math.PI);
  for (let k = 0; k < 6; k++) { const h = new THREE.Mesh(gHaz, mHaz); h.userData.k = k; haces.add(h); }
  const luzT = new THREE.PointLight(0xffc27a, 0, 330, 2); luzT.position.set(0, 160, 0); sc.add(luzT);
  // ---- vida en la ciudad: coches, taxis (negros con puertas amarillas), personas, aviones, una patrulla y una ambulancia ----
  const DURV = 64, LC = 2 * R * PASO;   // cada coche da vueltas enteras a su calle en el bucle de 64 s (cierra sin saltos)
  const coches = []; const colsC = [0xf2f2f2, 0x1d1d1f, 0x8c9096, 0xb3262a, 0x24477a, 0xd8d8d0, 0x4a4f55, 0x2c5e3c];
  for (let i = -R; i <= R + 1; i++) { const c = (i - 0.5) * PASO; for (let k = 0; k < 44; k++) { const eje = az() < 0.5 ? 'x' : 'z', sen = az() < 0.5 ? 1 : -1, taxi = az() < 0.3;
    coches.push({ eje, sen, c: c + sen * (2.6 + (az() < 0.5 ? 0 : 3.6)), s0: az() * LC, v: (1 + Math.floor(az() * 2)) * LC / DURV, col: taxi ? 0x161616 : colsC[Math.floor(az() * colsC.length)], taxi }); } }
  const gC = new THREE.BoxGeometry(2.6, 1.9, 6); gC.translate(0, 0.95, 0);   // algo más grandes que en la realidad para que se vean desde el dron
  const CO = new THREE.InstancedMesh(gC, new THREE.MeshLambertMaterial({ color: 0xffffff }), coches.length); coches.forEach((q, k) => CO.setColorAt(k, c3.set(q.col))); sc.add(CO);
  const taxis = coches.filter(q => q.taxi), gP = new THREE.BoxGeometry(2.7, 0.75, 3.2); gP.translate(0, 0.9, 0);
  const TX = new THREE.InstancedMesh(gP, new THREE.MeshLambertMaterial({ color: 0xf5c400 }), taxis.length); sc.add(TX);   // puertas amarillas
  const mFaro = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }), mPil = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
  const gL = new THREE.SphereGeometry(1.1, 6, 4), FAR = new THREE.InstancedMesh(gL, mFaro, coches.length), PIL = new THREE.InstancedMesh(gL, mPil, coches.length); sc.add(FAR, PIL);
  const gente = []; for (let k = 0; k < 900; k++) { const i = Math.floor((az() - 0.5) * 2 * R), c = (i - 0.5) * PASO + (az() < 0.5 ? -8.5 : 8.5); gente.push({ eje: az() < 0.5 ? 'x' : 'z', c, s0: az() * LC, v: (az() < 0.5 ? 1 : -1) * LC / DURV / 16 * (1 + Math.floor(az() * 2)) }); }
  const gG = new THREE.CylinderGeometry(0.5, 0.5, 2.6, 6); gG.translate(0, 1.3, 0);
  const GE = new THREE.InstancedMesh(gG, new THREE.MeshLambertMaterial({ color: 0xffffff }), gente.length); gente.forEach((q, k) => GE.setColorAt(k, c3.setHSL(az(), 0.45, 0.35 + az() * 0.3))); sc.add(GE);
  const posEn = (q, t) => { let s = ((q.s0 + q.v * t * (q.sen || 1)) % LC + LC) % LC - LC / 2; return q.eje === 'x' ? [s, q.c, q.sen || 1] : [q.c, s, q.sen || 1]; };
  // patrulla de policía (aparcada con las luces en un cruce) y ambulancia circulando lejos
  const cocheEsp = (col, x, z, ry) => { const g = new THREE.Group(); const b = new THREE.Mesh(gC, new THREE.MeshLambertMaterial({ color: col })); g.add(b); g.position.set(x, 0, z); g.rotation.y = ry; sc.add(g); return g; };
  const poli = cocheEsp(0xf4f6f8, PASO * 2 - 1, PASO * 1.5 + 2.5, 0.3); const fr1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.5), new THREE.MeshBasicMaterial({ color: 0x1f4fff, toneMapped: false })); fr1.position.y = 1.6; poli.add(fr1);
  const lPol = new THREE.PointLight(0x2f5bff, 0, 60, 2); lPol.position.y = 3; poli.add(lPol); const raya = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 4.5), new THREE.MeshLambertMaterial({ color: 0x1b3fa0 })); raya.position.y = 0.6; poli.add(raya);
  const ambu = cocheEsp(0xfafafa, 0, 0, 0); ambu.scale.set(1.25, 1.6, 1.3); const fr2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0x2f6bff, toneMapped: false })); fr2.position.y = 1.5; ambu.add(fr2);
  const fr3 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 4.5), new THREE.MeshLambertMaterial({ color: 0xffd400 })); fr3.position.y = 0.5; ambu.add(fr3);
  const lAmb = new THREE.PointLight(0x3f6bff, 0, 50, 2); lAmb.position.y = 3; ambu.add(lAmb);
  const qAmb = { eje: 'z', c: -PASO * 4.5 - 2.5, s0: 300, v: LC / DURV, sen: 1 };
  // aviones a lo lejos con sus luces de navegación (roja a babor, verde a estribor, destello blanco)
  const aviones = [[1900, 520, 0], [2300, 640, 2.1], [2600, 760, 4.2]].map(([r, h, f0], k) => { const g = new THREE.Group();
    const cu = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 34, 8), new THREE.MeshLambertMaterial({ color: 0xe8ecf0 })); cu.rotation.x = Math.PI / 2; g.add(cu);
    const al = new THREE.Mesh(new THREE.BoxGeometry(34, 0.6, 5), cu.material); g.add(al); const co = new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 3), cu.material); co.position.z = -15; g.add(co);
    const lz = (c, x, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), new THREE.MeshBasicMaterial({ color: c, toneMapped: false, fog: false })); m.position.set(x, 0, z); g.add(m); return m; };
    const rojo = lz(0xff2020, -17, 0), verde = lz(0x20ff40, 17, 0), bl = lz(0xffffff, 0, -17);
    g.userData = { r, h, f0, k, bl }; sc.add(g); return g; });
  [CO, TX, FAR, PIL, GE].forEach(m => { m.frustumCulled = false; });   // se mueven: sin recorte por la esfera inicial
  function vida(t, n) {
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), ys = new THREE.Vector3(0, 1, 0); let kt = 0;
    coches.forEach((q, k) => { const [x, z, sn] = posEn(q, t), ry = q.eje === 'x' ? (sn > 0 ? Math.PI / 2 : -Math.PI / 2) : (sn > 0 ? 0 : Math.PI); Q.setFromAxisAngle(ys, ry);
      M.compose(V.set(x, 0, z), Q, S1); CO.setMatrixAt(k, M); if (q.taxi) TX.setMatrixAt(kt++, M);
      const dx = Math.sin(ry), dz = Math.cos(ry); M.compose(V.set(x + dx * 3.1, 1, z + dz * 3.1), Q, S1); FAR.setMatrixAt(k, M); M.compose(V.set(x - dx * 3.1, 1, z - dz * 3.1), Q, S1); PIL.setMatrixAt(k, M); });
    [CO, TX, FAR, PIL].forEach(m => { m.instanceMatrix.needsUpdate = true; });
    gente.forEach((q, k) => { const [x, z] = posEn(q, t); M.compose(V.set(x, 0, z), Q.identity(), S1); GE.setMatrixAt(k, M); }); GE.instanceMatrix.needsUpdate = true;
    mFaro.color.setRGB(1.3 * n + 0.05, 1.25 * n + 0.05, 1.1 * n + 0.05); mPil.color.setRGB(1.4 * n + 0.1, 0.05, 0.05);
    const dest = Math.floor(t * 6) % 2;   // destellos de policía y ambulancia
    fr1.material.color.set(dest ? 0x1f4fff : 0xff2030); lPol.color.set(dest ? 0x2f5bff : 0xff3040); lPol.intensity = 900 * (0.3 + n);
    const [ax, az2] = posEn(qAmb, t); ambu.position.set(ax, 0, az2); ambu.rotation.y = 0; fr2.material.color.set(Math.floor(t * 5) % 2 ? 0x2f6bff : 0xffffff); lAmb.intensity = 700 * (0.3 + n);
    aviones.forEach((g) => { const u = g.userData, a = u.f0 + t / DURV * PI2 * (u.k % 2 ? -1 : 1); g.position.set(Math.cos(a) * u.r, u.h, Math.sin(a) * u.r); g.rotation.y = -a + (u.k % 2 ? 0 : Math.PI); u.bl.visible = Math.floor(t * 1.2 + u.k) % 2 === 0; });
  }
  // la hora: 0 mediodía → hora dorada → anochecer → noche → amanecer → mediodía (el bucle cierra igual que empieza)
  const CL = (h) => new THREE.Color(h), mez = (a, b, t) => a.clone().lerp(b, t);
  const K = [   // [fase, cielo arriba, horizonte, sol, niebla, intensidad sol, hemisferio, noche]
    [0.00, 0x3f7fc6, 0xcfe2f1, 0xfff1d6, 0xbcd3e6, 2.6, 1.25, 0],
    [0.30, 0x4a86c8, 0xd9e6f0, 0xfff0d2, 0xc4d6e6, 2.5, 1.2, 0],
    [0.42, 0x5d77b8, 0xffb36b, 0xffa040, 0xe6b48a, 2.2, 0.85, 0],      // hora dorada
    [0.50, 0x3a3f7a, 0xff7a4a, 0xff6a2a, 0xb07a72, 1.1, 0.5, 0.35],     // puesta
    [0.57, 0x141a3d, 0x4a3a6a, 0x6a5aa0, 0x2a2a48, 0.25, 0.22, 0.85],   // hora azul
    [0.66, 0x05070f, 0x141a30, 0x3a4a80, 0x0d1020, 0.08, 0.12, 1],       // noche
    [0.84, 0x05070f, 0x141a30, 0x3a4a80, 0x0d1020, 0.08, 0.12, 1],
    [0.92, 0x2a3c78, 0xf0a07a, 0xffb070, 0x8a8aa0, 1.0, 0.6, 0.3],     // amanecer
    [1.00, 0x3f7fc6, 0xcfe2f1, 0xfff1d6, 0xbcd3e6, 2.6, 1.25, 0]];
  const U = cielo.material.uniforms;
  function hora(f, t) {
    let i = 0; while (i < K.length - 2 && f > K[i + 1][0]) i++;
    const A = K[i], B = K[i + 1], u = Math.min(1, Math.max(0, (f - A[0]) / (B[0] - A[0]))), e = u * u * (3 - 2 * u);
    U.a.value.copy(mez(CL(A[1]), CL(B[1]), e)); U.b.value.copy(mez(CL(A[2]), CL(B[2]), e)); U.sc.value.copy(mez(CL(A[3]), CL(B[3]), e));
    const fog = mez(CL(A[4]), CL(B[4]), e); sc.fog.color.copy(fog); sc.background.copy(fog);
    const n = A[7] + (B[7] - A[7]) * e; U.est.value = n;
    const ang = f * PI2 + 0.35, sd = new THREE.Vector3(Math.cos(ang) * 0.75, Math.sin(ang * 1) * 0.55 + 0.25, Math.sin(ang) * 0.6).normalize();   // el sol baja al oeste y vuelve por el este
    U.sd.value.copy(sd); sol.position.copy(sd.clone().multiplyScalar(800)); sol.color.copy(U.sc.value); sol.intensity = A[5] + (B[5] - A[5]) * e;
    hemi.intensity = A[6] + (B[6] - A[6]) * e; amb.intensity = 0.18 + 0.1 * n;
    matM[1].emissiveIntensity = 1.1 * n; tNueva.emissiveIntensity = 0.55 * n; tVieja.emissiveIntensity = 0.5 * n;
    mFar.color.setRGB(1.0 * n, 0.7 * n, 0.35 * n); luzT.intensity = 4.5e4 * n;
    mHaz.opacity = 0.2 * Math.max(0, n - 0.3) / 0.7; haces.visible = n > 0.3;
    haces.children.forEach((h) => { const k = h.userData.k, b = t * 0.35 + k * PI2 / 6; h.rotation.set(0.32 + 0.12 * Math.sin(t * 0.5 + k), b, 0, 'YXZ'); });
    mHaz.color.setHSL((0.55 + 0.08 * Math.sin(t * 0.2)) % 1, 0.6, 0.75);
    vida(t % DURV, n);
    mIg.emissiveIntensity = 1.4 * n; estatua.material.emissiveIntensity = 1.6 * n;   // el templo del monte, dorado de noche
    noria.rotation.z = (t % DURV) / DURV * PI2; mNor.color.setRGB(0.85 - 0.6 * n + 0.2 * n, 0.87 - 0.4 * n + 0.6 * n, 0.9 + 0.6 * n);
    atr.forEach((m, k) => { m.material.emissiveIntensity = n * (0.5 + 0.5 * Math.sin(t * 3 + k)); });
    const bz = Math.floor(t * 1.5) % 2 ? 1 : 0.25; mRoja.color.setRGB(1.3 * bz, 0.05, 0.05);
  }
  sc.userData.hora = hora;
  return sc;
}

// la cámara del dron (cúbica) y el paso a panorama cilíndrico de 360° (4:1) que casa en la esquina
export function crearDron(renderer, ancho = 2048, alto = 512) {
  const sc = crearSimula();
  const cubo = new THREE.WebGLCubeRenderTarget(512, { generateMipmaps: false });
  const cam = new THREE.CubeCamera(1, 4000, cubo); sc.add(cam);
  const rt = new THREE.WebGLRenderTarget(ancho, alto, { generateMipmaps: false });
  const mat = new THREE.ShaderMaterial({ uniforms: { cubo: { value: cubo.texture }, uF: { value: 0.5 }, asp: { value: ancho / alto }, y0: { value: -0.18 } }, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: 'uniform samplerCube cubo; uniform float uF; uniform float asp; uniform float y0; varying vec2 v; void main(){ float a = (v.x - uF) * 6.28318530718; float y = y0 + (v.y - .5) * 6.28318530718 / asp; vec3 d = normalize(vec3(-sin(a), y, cos(a)));   /* CubeCamera.lookAt apunta su +z al templo */ gl_FragColor = textureCube(cubo, d); }' });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat), escQ = new THREE.Scene(); escQ.add(quad); const camQ = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const DUR = 64, mira = new THREE.Vector3(0, 90, 0);
  function pinta(t) {
    const a = (t % DUR) / DUR * PI2;                       // un vuelo cerrado: todo vuelve a su sitio a los 64 s
    const r = 205 + 45 * Math.sin(2 * a + 0.6), h = 125 + 40 * Math.sin(a + 1.2);
    cam.position.set(Math.cos(a) * r, h, Math.sin(a) * r);
    cam.lookAt(mira.x, h, mira.z);                          // mira al templo sin inclinar el horizonte (el panorama baja con y0)
    sc.userData.hora((t % DUR) / DUR, t);   // día → hora dorada → noche → amanecer, en el mismo bucle
    cam.update(renderer, sc);
    const prev = renderer.getRenderTarget(); renderer.setRenderTarget(rt); renderer.render(escQ, camQ); renderer.setRenderTarget(prev);
  }
  return { rt, pinta, frente: (u) => { mat.uniforms.uF.value = u; }, dur: DUR };
}
