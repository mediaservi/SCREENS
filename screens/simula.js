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
  sc.add(new THREE.HemisphereLight(0xdfeeff, 0x6b5a45, 1.25));
  const sol = new THREE.DirectionalLight(0xfff1d6, 2.6); sol.position.set(380, 520, 260); sc.add(sol);
  sc.add(new THREE.AmbientLight(0xffffff, 0.18));
  // cielo con degradado (cúpula) y sol
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(2900, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: new THREE.Color(0x3f7fc6) }, b: { value: new THREE.Color(0xcfe2f1) } },
    vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform vec3 a; uniform vec3 b; varying vec3 p; void main(){ float h = clamp(p.y*1.6, 0., 1.); vec3 c = mix(b, a, pow(h, .7)); float s = max(0., dot(p, normalize(vec3(.55,.62,.4)))); c += vec3(1.,.9,.7) * pow(s, 400.) * 2. + vec3(1.,.85,.6) * pow(s, 8.) * .18; gl_FragColor = vec4(c, 1.); }' }));
  sc.add(cielo);
  // suelo: asfalto de la ciudad, montaña al fondo (noroeste) y mar (sureste)
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: 0x77736d })); suelo.rotation.x = -Math.PI / 2; sc.add(suelo);
  const mar = new THREE.Mesh(new THREE.PlaneGeometry(6000, 2600), new THREE.MeshStandardMaterial({ color: 0x2f6f9c, roughness: 0.25, metalness: 0.3 })); mar.rotation.x = -Math.PI / 2; mar.position.set(1800, 0.4, 1800); mar.rotation.z = Math.PI / 4; sc.add(mar);
  // cordillera al noroeste, siempre fuera de la ciudad (las zonas llanas quedan bajo el asfalto)
  const mg = new THREE.PlaneGeometry(7000, 7000, 170, 170); mg.rotateX(-Math.PI / 2); const MP = mg.attributes.position;
  for (let i = 0; i < MP.count; i++) { const x = MP.getX(i), z = MP.getZ(i), d = -(x + z) / Math.SQRT2 - 1250, lat = (x - z) / Math.SQRT2;
    const y = d > 0 ? Math.min(1, d / 600) * (210 + 70 * Math.sin(lat * 0.0035) + 40 * Math.sin(lat * 0.011 + 2) + 15 * Math.sin(lat * 0.03)) : -2; MP.setY(i, y); }
  mg.computeVertexNormals(); const monte = new THREE.Mesh(mg, new THREE.MeshLambertMaterial({ color: 0x6d8a55 })); sc.add(monte);
  // manzanas del ensanche: octógonos con chaflán y patio interior, con fachadas de ventanas y azoteas
  const L = 56.6, CH = 14, IN = 34, ICH = 9, PASO = 133.3;
  const oct = (h, c) => { const s = new THREE.Shape(); s.moveTo(-h + c, -h); s.lineTo(h - c, -h); s.lineTo(h, -h + c); s.lineTo(h, h - c); s.lineTo(h - c, h); s.lineTo(-h + c, h); s.lineTo(-h, h - c); s.lineTo(-h, -h + c); s.closePath(); return s; };
  const anillo = oct(L, CH); anillo.holes.push(oct(IN, ICH));
  const gM = new THREE.ExtrudeGeometry(anillo, { depth: 24, bevelEnabled: false }); gM.rotateX(-Math.PI / 2);
  const tF = texFachada(); tF.repeat.set(1 / 24, 1 / 24);
  const matM = [new THREE.MeshLambertMaterial({ color: 0xe9dfd0 }), new THREE.MeshLambertMaterial({ map: tF, color: 0xffffff })];
  const celdas = []; const R = 6;
  for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) { if (Math.hypot(i, j) > R + 0.4) continue; celdas.push([i, j]); }
  const especial = (i, j) => (i === 0 && j === 0) || (i === 1 && j === 0) || (i === -1 && j === 0);
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
  const tNueva = new THREE.MeshStandardMaterial({ map: texTorre('#d6c9b0', 'rgba(40,32,24,.85)'), roughness: 0.85 });
  const tVieja = new THREE.MeshStandardMaterial({ map: texTorre('#a88a68', 'rgba(30,22,14,.9)'), roughness: 0.9 });
  const pon4 = (eje, fijo, signo, mat) => [-18, -6, 6, 18].forEach((s, k) => { const h = (k === 0 || k === 3) ? 98 : 110, t = torre(T, h, 5.2, mat, k + (eje === 'x' ? 0 : 1)); if (eje === 'x') t.position.set(fijo, 0, s); else t.position.set(s, 0, fijo); T.add(t); void signo; });
  pon4('x', 50, 1, tVieja); pon4('x', -50, -1, tNueva); pon4('z', 46, 1, tNueva);
  [[-13, -13], [13, -13], [-13, 13], [13, 13]].forEach(([x, z], k) => { const t = torre(T, 135, 7, tNueva, k + 2); t.position.set(x, 0, z); T.add(t); });
  const maria = torre(T, 138, 7.4, tNueva, 'estrella'); maria.position.set(0, 0, -40); T.add(maria);
  const jesus = torre(T, 172, 10.5, tNueva, 'cruz'); jesus.position.set(0, 0, 0); T.add(jesus);
  // sin grúas de obra (Josep, 24-11-2026)
  T.scale.setScalar(1.45);
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
  const DUR = 48, mira = new THREE.Vector3(0, 90, 0);
  function pinta(t) {
    const a = (t % DUR) / DUR * PI2;                       // un vuelo cerrado: todo vuelve a su sitio a los 48 s
    const r = 205 + 45 * Math.sin(2 * a + 0.6), h = 125 + 40 * Math.sin(a + 1.2);
    cam.position.set(Math.cos(a) * r, h, Math.sin(a) * r);
    cam.lookAt(mira.x, h, mira.z);                          // mira al templo sin inclinar el horizonte (el panorama baja con y0)
    cam.update(renderer, sc);
    const prev = renderer.getRenderTarget(); renderer.setRenderTarget(rt); renderer.render(escQ, camQ); renderer.setRenderTarget(prev);
  }
  return { rt, pinta, frente: (u) => { mat.uniforms.uF.value = u; }, dur: DUR };
}
