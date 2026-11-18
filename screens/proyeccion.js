// SCREENS · cálculo de proyección (motor heredado de SCREENBOX v6.65, revisado).
// v8.0 · catálogo de Epson dentro de la app (funciona sin conexión): los proyectores de óptica fija y los cuerpos de óptica
// intercambiable, cada uno combinado con todas sus ópticas compatibles según la guía maestra de Epson «Alta luminosidad ·
// Opciones de lente» (08/2026). Columna «optica»: «fija» o la serie del cuerpo (PU1000, PU2000, PQ2000, XQ2030).
const CSV = `marca,modelo,optica,throwratio,lumens,aspectratio,resolucion,4K,screen,soos,image
EPSON,EB-815E,fija,0.16:1,5000,16:9,Full HD (1920 x 1080),4K Enhancement,160,248,https://charmex.net/images/epson-ust_2476_19_20250325104608.png
EPSON,EB-805F,fija,0.27 - 0.37:1,5000,16:9,Full HD (1920 x 1080),NO,130,250,https://charmex.net/images/epson-ust_2476_5_20210408172254.png
EPSON,EB-L695SE,fija,0.50 - 0.70:1,6000,16:10,WUXGA (1920 x 1200),4K Enhancement,500,600,https://charmex.net/images/epson-media-st_3156_16_20250513123910.png
EPSON,EB-L795SE,fija,0.79 - 1.36:1,6000,16:10,WUXGA (1920 x 1200),4K Enhancement,400,500,https://charmex.net/images/epson-media-st_3156_15_20250513123855.png
EPSON,EB-L695SU,fija,0.79 - 1.36:1,6200,16:10,WUXGA (1920 x 1200),NO,400,500,https://charmex.net/images/epson-media-st_3156_14_20250513123843.png
EPSON,EB-PU1006W,PU1000,,6000,16:10,WUXGA (1920 x 1200),4K Enhancement,1000,1100,
EPSON,EB-PU1007B,PU1000,,7000,16:10,WUXGA (1920 x 1200),4K Enhancement,1000,1100,
EPSON,EB-PU1008B,PU1000,,8500,16:10,WUXGA (1920 x 1200),4K Enhancement,1000,1100,https://charmex.net/images/epson-lente-int_2475_26_20210705103031.png
EPSON,EB-PU2010B,PU2000,,10000,16:10,WUXGA (1920 x 1200),4K Enhancement,1000,1100,
EPSON,EB-PU2213B,PU2000,,13000,16:10,WUXGA (1920 x 1200),4K Enhancement,1000,1100,
EPSON,EB-PU2216B,PU2000,,16000,16:10,WUXGA (1920 x 1200),4K Enhancement,1000,1100,https://charmex.net/images/epson-lente-int_2475_35_20220930121548.png
EPSON,EB-PU2220B,PU2000,,20000,16:10,WUXGA (1920 x 1200),4K Enhancement,1000,1100,https://charmex.net/images/epson-lente-int_2475_31_20220930124147.png
EPSON,EB-PQ2008B,PQ2000,,8000,16:9,4K (3840 x 2160),4K,1000,1100,
EPSON,EB-PQ2010B,PQ2000,,10000,16:9,4K (3840 x 2160),4K,1000,1100,
EPSON,EB-PQ2213B,PQ2000,,13000,16:9,4K (3840 x 2160),4K,1000,1100,
EPSON,EB-PQ2216B,PQ2000,,16000,16:9,4K (3840 x 2160),4K,1000,1100,
EPSON,EB-PQ2220B,PQ2000,,20000,16:9,4K (3840 x 2160),4K,1000,1100,
EPSON,EB-XQ2030B,XQ2030,,30000,16:9,4K (3840 x 2160),4K,1000,1100,`;
// Ópticas de Epson por serie de cuerpo: [relación de proyección mínima, máxima, desplazamiento vertical %, horizontal %, solo hacia arriba]
// (guía maestra de Epson 08/2026). max20kXQ: con el EB-XQ2030B la luminosidad queda en 20.000 lm; max12k: tope de 12.000 lm.
export const OPTICAS = [
  { ref: 'ELPLX01S', tipo: 'ust', s: { PU1000: [0.35, 0.35, 17, 10, 1] } },
  { ref: 'ELPLX02S', tipo: 'ust', max20kXQ: true, s: { PU2000: [0.35, 0.35, 25, 15, 1], PQ2000: [0.34, 0.34, 30, 13, 1], XQ2030: [0.34, 0.34, 30, 13, 1] } },
  { ref: 'ELPLX04H', tipo: 'ust', s: { PU2000: [0.40, 0.51, 60, 18], PQ2000: [0.39, 0.49, 64, 16], XQ2030: [0.39, 0.49, 64, 16] } },
  { ref: 'ELPLU06H', tipo: 'corta', s: { PU2000: [0.40, 0.51, 60, 18], PQ2000: [0.39, 0.49, 64, 16], XQ2030: [0.39, 0.49, 64, 16] } },
  { ref: 'ELPLU03S', tipo: 'corta', max20kXQ: true, s: { PU1000: [0.65, 0.78, 67, 30], PU2000: [0.48, 0.57, 24, 10], PQ2000: [0.46, 0.56, 25, 8], XQ2030: [0.46, 0.56, 25, 8] } },
  { ref: 'ELPLU07H', tipo: 'corta', s: { PU1000: [0.64, 0.87, 67, 30], PU2000: [0.47, 0.64, 60, 18], PQ2000: [0.46, 0.62, 64, 16], XQ2030: [0.46, 0.62, 64, 16] } },
  { ref: 'ELPLU04', tipo: 'corta', max20kXQ: true, s: { PU1000: [0.87, 1.05, 67, 30], PU2000: [0.64, 0.77, 60, 18], PQ2000: [0.62, 0.75, 64, 16], XQ2030: [0.62, 0.75, 64, 16] } },
  { ref: 'ELPLU04H', tipo: 'corta', s: { PU1000: [0.86, 1.22, 67, 30], PU2000: [0.64, 0.90, 60, 18], PQ2000: [0.62, 0.87, 64, 16], XQ2030: [0.62, 0.87, 64, 16] } },
  { ref: 'ELPLW05', tipo: 'angular', max12k: true, s: { PU1000: [1.04, 1.46, 67, 30], PU2000: [0.77, 1.07, 24, 10], PQ2000: [0.74, 1.04, 25, 8] } },
  { ref: 'ELPLW08H', tipo: 'angular', s: { PU1000: [1.18, 1.66, 67, 30], PU2000: [0.86, 1.21, 60, 18], PQ2000: [0.83, 1.17, 64, 16], XQ2030: [0.83, 1.17, 64, 16] } },
  { ref: 'ELPLW06H', tipo: 'angular', s: { PU1000: [1.62, 2.22, 67, 30], PU2000: [1.19, 1.62, 60, 18], PQ2000: [1.15, 1.57, 64, 16], XQ2030: [1.15, 1.57, 64, 16] } },
  { ref: 'ELPLM08', tipo: 'estandar', s: { PU1000: [1.44, 2.32, 67, 30] } },
  { ref: 'ELPLM15H', tipo: 'estandar', s: { PU1000: [2.16, 3.48, 67, 30], PU2000: [1.57, 2.56, 60, 18], PQ2000: [1.52, 2.47, 64, 16], XQ2030: [1.52, 2.47, 64, 16] } },
  { ref: 'ELPLM10H', tipo: 'media', s: { PU1000: [3.32, 5.06, 67, 30], PU2000: [2.42, 3.71, 60, 18], PQ2000: [2.34, 3.59, 64, 16], XQ2030: [2.34, 3.59, 64, 16] } },
  { ref: 'ELPLM11H', tipo: 'media', s: { PU1000: [4.85, 7.38, 67, 30], PU2000: [3.54, 5.41, 60, 18], PQ2000: [3.42, 5.23, 64, 16], XQ2030: [3.42, 5.23, 64, 16] } },
  { ref: 'ELPLL08', tipo: 'larga', s: { PU1000: [7.21, 10.11, 67, 30], PU2000: [5.27, 7.41, 60, 18], PQ2000: [5.09, 7.16, 64, 16], XQ2030: [5.09, 7.16, 64, 16] } },
  { ref: 'ELPLL11H', tipo: 'larga', s: { PU1000: [9.90, 15.52, 67, 30], PU2000: [7.23, 11.38, 60, 18], PQ2000: [6.99, 11.00, 64, 16], XQ2030: [6.99, 11.00, 64, 16] } }
];

export const SOLAPE_MIN = 0.15, SOLAPE_MAX = 0.65;   // límites de blending de SCREENBOX
export const RECORTE_MAX = 0.2;                       // lo que puede sobresalir la imagen de la superficie (se enmascara)
// Chasis (ancho × fondo × alto, m) según las fichas de Epson (guía 08/2026, con las patas); la serie L695SE/L795SE/L695SU comparte chasis
const CHASIS = { 'EB-815E': [0.695, 0.341, 0.156], 'EB-805F': [0.458, 0.375, 0.210], 'EB-L695SE': [0.440, 0.368, 0.151], 'EB-L795SE': [0.440, 0.368, 0.151], 'EB-L695SU': [0.440, 0.368, 0.151],
  'EB-PU1006W': [0.545, 0.436, 0.189], 'EB-PU1007B': [0.545, 0.436, 0.189], 'EB-PU1008B': [0.545, 0.436, 0.189], 'EB-PU2010B': [0.545, 0.436, 0.189],
  'EB-PU2213B': [0.586, 0.492, 0.218], 'EB-PU2216B': [0.586, 0.492, 0.218], 'EB-PU2220B': [0.586, 0.492, 0.218],
  'EB-PQ2008B': [0.545, 0.436, 0.189], 'EB-PQ2010B': [0.545, 0.436, 0.189], 'EB-PQ2213B': [0.586, 0.492, 0.218], 'EB-PQ2216B': [0.586, 0.492, 0.218], 'EB-PQ2220B': [0.586, 0.492, 0.218],
  'EB-XQ2030B': [0.620, 0.530, 0.238] };
// Separación mínima entre chasis por la ventilación (guía de instalación de Epson: 10–40 cm libres alrededor de las rejillas;
// lado a lado, 150 cm sin mampara o 20–40 cm con mampara). Se aplica 40 cm en horizontal y 20 cm en vertical.
export const HOLGURA = { h: 0.40, v: 0.20, sinMampara: 1.5 };

function leer() {
  const out = [];
  CSV.trim().split('\n').slice(1).forEach((l) => {
    const c = l.split(',');
    const [aw, ah] = c[5].split(':').map(Number);
    const px = (c[6].match(/(\d{3,5})\s*x\s*(\d{3,5})/) || []).slice(1).map(Number);
    const base = { marca: c[0], modelo: c[1], serie: c[2] === 'fija' ? '' : c[2], ar: aw / ah, arTxt: c[5], resX: px[0] || 1920, resY: px[1] || 1080, resTxt: c[6],
      k4: /4K/i.test(c[7]), k4nativo: c[7] === '4K', maxDiagPulg: Number(c[8]), maxDiagPulgOOS: Number(c[9]), imagen: c[10] || '', chasis: CHASIS[c[1]] || [0.55, 0.45, 0.2] };
    const combo = (optica, tr, lumens, sh) => ({ ...base, id: c[1] + (optica ? '|' + optica : ''), optica, nombre: c[1] + (optica ? ' + ' + optica : ''),
      trMin: Math.min(...tr), trMax: Math.max(...tr), lumens, ust: Math.min(...tr) < 0.4, shiftV: sh[0] || 0, shiftH: sh[1] || 0, shiftSube: !!sh[2] });
    if (c[2] === 'fija') { out.push(combo('', c[3].replace(':1', '').split('-').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)), Number(c[4]), [])); return; }
    OPTICAS.forEach((o) => {
      const d = o.s[c[2]]; if (!d) return;
      let lm = Number(c[4]); if (o.max12k) lm = Math.min(lm, 12000); if (o.max20kXQ && c[2] === 'XQ2030') lm = Math.min(lm, 20000);
      out.push(combo(o.ref, [d[0], d[1]], lm, [d[2], d[3], d[4]]));
    });
  });
  return out;
}
// v10.57 · VIVITEK láser de gran formato: cada cuerpo con sus ópticas compatibles.
// - Relación de proyección de cada óptica según el chip del cuerpo (0,67", 0,8" o 0,96"), imagen máxima de cada óptica y qué óptica va con
//   qué cuerpo: guía de ópticas de Vivitek («Projectors & Lenses · Large Venue projector lens range»). Las D86 dan la misma relación en todos.
// - Lúmenes, resolución, desplazamiento de la óptica (en % del alto y del ancho de la imagen) y chasis: ficha de cada modelo. Del DU7x99Z se
//   toma el desplazamiento más prudente de los publicados (tabla del manual MKII: 45 % / 12 %). En chip de 0,8", las ópticas D88 lo limitan
//   (±45 %; la D88-UWZ01, ±35 %). Las ultracortas van con desplazamiento en un solo sentido.
// - No hay dato de imagen «fuera de especificación»: la máxima es la de la óptica.
// - DU5051Z, DU5053Z y DK5153Z llevan su óptica de serie (1,15–1,9:1); sus ópticas cortas opcionales no tienen ficha publicada.
const VIVITEK = [
  { serie: 'DU7000Z', chip: 67, res: 'WUXGA (1920 x 1200)', ar: '16:10', sh: [45, 12], chasis: [0.470, 0.517, 0.202], m: [['DU7099Z', 8000], ['DU7199Z', 9000], ['DU7299Z', 10000]] },
  { serie: 'DU8000Z', chip: 80, res: 'WUXGA (1920 x 1200)', ar: '16:10', sh: [60, 20], chasis: [0.500, 0.591, 0.216], m: [['DU8053Z', 14000], ['DU8055Z', 16000], ['DU8057Z', 24000]] },
  { serie: 'DK8000Z', chip: 80, res: '4K UHD+ (3840 x 2400)', ar: '16:10', k4: true, sh: [60, 20], chasis: [0.500, 0.591, 0.216], m: [['DK8150Z', 12000], ['DK8155Z', 15000]] },
  { serie: 'DU9057Z', chip: 96, res: 'WUXGA (1920 x 1200)', ar: '16:10', sh: [50, 15], chasis: [0.677, 0.599, 0.270], m: [['DU9057Z', 27000]] },
  { serie: 'DU9059Z', chip: 96, res: 'WUXGA (1920 x 1200)', ar: '16:10', sh: [50, 15], chasis: [0.677, 0.599, 0.270], m: [['DU9059Z', 30000]] },
  { serie: 'DU5000Z', fija: [1.15, 1.9], img: 322, res: 'WUXGA (1920 x 1200)', ar: '16:10', sh: [15, 2], chasis: [0.496, 0.380, 0.160], m: [['DU5051Z', 6300], ['DU5053Z', 7700]] },
  { serie: 'DK5000Z', fija: [1.15, 1.9], img: 322, res: '4K UHD (3840 x 2160)', ar: '16:9', k4: true, sh: [15, 2], chasis: [0.496, 0.380, 0.160], m: [['DK5153Z', 6200]] }
];
const V78 = ['DU7000Z', 'DU8000Z', 'DK8000Z'];
// ref, imagen máxima en pulgadas, relación mínima y máxima por chip, series con las que va y, si lo hay, tope de desplazamiento en 0,8"
export const OPTICAS_VIVITEK = [
  { ref: 'D89-UST01', tipo: 'ust', img: 400, tr: { 67: [0.368, 0.39], 80: [0.31, 0.33] }, s: V78, sube: 1 },
  { ref: 'D88-UST01B', tipo: 'ust', img: 350, tr: { 67: [0.38, 0.38] }, s: ['DU7000Z'], sube: 1 },
  { ref: 'D86-04705', tipo: 'corta', img: 300, tr: { 67: [0.47, 0.50] }, s: ['DU7000Z'] },
  { ref: 'D89-UWZ01', tipo: 'corta', img: 400, tr: { 67: [0.65, 0.89], 80: [0.55, 0.75] }, s: V78 },
  { ref: 'D88-UWZ01', tipo: 'corta', img: 500, tr: { 67: [0.75, 0.93], 80: [0.63, 0.78] }, s: V78, lim80: 35 },
  { ref: 'D86-0711', tipo: 'corta', img: 500, tr: { 67: [0.77, 1.1], 80: [0.77, 1.1] }, s: ['DU7000Z', 'DU8000Z'] },
  { ref: 'D89-UWZ02', tipo: 'angular', img: 500, tr: { 67: [0.88, 1.28], 80: [0.74, 1.08] }, s: V78 },
  { ref: 'D86-1113', tipo: 'angular', img: 500, tr: { 67: [1.1, 1.3] }, s: ['DU7000Z'] },
  { ref: 'D89-WZ01', tipo: 'angular', img: 600, tr: { 67: [1.25, 1.68], 80: [1.05, 1.41] }, s: V78 },
  { ref: 'D88-WZ01', tipo: 'angular', img: 500, tr: { 67: [1.25, 1.79], 80: [1.05, 1.5] }, s: V78, lim80: 45 },
  { ref: 'D86-1216', tipo: 'angular', img: 500, tr: { 67: [1.25, 1.6], 80: [1.25, 1.6] }, s: V78 },
  { ref: 'D86-1519', tipo: 'estandar', img: 500, tr: { 67: [1.54, 1.93], 80: [1.54, 1.93] }, s: V78 },
  { ref: 'D89-ST01', tipo: 'estandar', img: 600, tr: { 67: [1.67, 2.51], 80: [1.4, 2.11] }, s: V78 },
  { ref: 'D86-1929', tipo: 'media', img: 500, tr: { 67: [1.93, 2.9] }, s: ['DU7000Z'] },
  { ref: 'D89-SMLZ01', tipo: 'media', img: 600, tr: { 67: [2.5, 4.7], 80: [2.1, 4.0] }, s: V78 },
  { ref: 'D88-LOZ101', tipo: 'larga', img: 500, tr: { 67: [3.58, 5.38], 80: [3.0, 4.52] }, s: V78, lim80: 45 },
  { ref: 'D88-LOZ201', tipo: 'larga', img: 500, tr: { 67: [5.31, 8.26], 80: [4.46, 6.94] }, s: V78, lim80: 45 },
  { ref: 'D98-UST01', tipo: 'ust', img: 600, tr: { 96: [0.38, 0.38] }, s: ['DU9057Z', 'DU9059Z'], sube: 1 },
  ...[['0912', 0.9, 1.2, 'corta'], ['1215', 1.25, 1.56, 'angular'], ['1520', 1.5, 2.0, 'estandar'], ['2040', 2.0, 4.0, 'media'], ['4070', 4.0, 7.0, 'larga']].flatMap(([n, a, b, tipo]) => [
    { ref: 'D99-' + n, tipo, img: 500, tr: { 96: [a, b] }, s: ['DU9057Z'] }, { ref: 'D99A-' + n, tipo, img: 500, tr: { 96: [a, b] }, s: ['DU9059Z'] }])
];
function leerVivitek() {
  const out = [];
  VIVITEK.forEach((g) => g.m.forEach(([modelo, lumens]) => {
    const [aw, ah] = g.ar.split(':').map(Number), px = g.res.match(/(\d{3,5})\s*x\s*(\d{3,5})/).slice(1).map(Number);
    const base = { marca: 'VIVITEK', modelo, serie: g.serie, ar: aw / ah, arTxt: g.ar, resX: px[0], resY: px[1], resTxt: g.res, k4: !!g.k4, k4nativo: !!g.k4, imagen: '', chasis: g.chasis, lumens };
    const combo = (optica, tr, img, shV, sube) => ({ ...base, id: modelo + (optica ? '|' + optica : ''), optica, nombre: modelo + (optica ? ' + ' + optica : ''), trMin: tr[0], trMax: tr[1], ust: tr[0] < 0.4,
      maxDiagPulg: img, maxDiagPulgOOS: img, shiftV: shV, shiftH: g.sh[1], shiftSube: !!sube });
    if (g.fija) { out.push(combo('', g.fija, g.img, g.sh[0], false)); return; }
    OPTICAS_VIVITEK.forEach((o) => { const tr = o.tr[g.chip]; if (!tr || !o.s.includes(g.serie)) return; out.push(combo(o.ref, tr, o.img, g.chip === 80 && o.lim80 ? Math.min(g.sh[0], o.lim80) : g.sh[0], o.sube)); });
  }));
  return out;
}
// v10.58 · CHRISTIE: cada cuerpo con sus ópticas compatibles, de los documentos técnicos del fabricante («lens throw ratios» de cada serie) y
// de las hojas de datos de cada modelo.
// - Christie da el desplazamiento («offset») sobre MEDIA imagen («defined at half image size»): aquí va ya en % del alto y del ancho enteros
//   (la mitad), como en Epson y Vivitek. La relación de proyección es la nominal de cada óptica.
// - Cada óptica trae su tamaño de imagen mínimo y máximo (en pulgadas de diagonal, o el ancho en centímetros en las ILS1). Las ILS4 de
//   Griffyn y Sapphire solo publican el mínimo. Ópticas que restan brillo: la 0,34–0,37:1 de Jazz y Korus (10 %) y la 0,38:1 ILS4 (30 %).
// - Las ópticas se nombran por su referencia de Christie. Lúmenes ISO.
const CHRISTIE = [
  { serie: 'CAPTIVA', res: 'WUXGA (1920 x 1200)', chasis: [0.383, 0.318, 0.088], fija: [0.25, 0.25], img: [130, 150], sh: [0, 0], m: [['Captiva DWU500S', 5000]] },
  { serie: 'INSPIRE', res: 'WUXGA (1920 x 1200)', chasis: [0.480, 0.406, 0.157], fija: [1.25, 2.0], img: [60, 200], sh: [55, 25], m: [['DWU760-iS', 7150], ['DWU860-iS', 8500], ['DWU960-iS', 9600]] },
  { serie: 'INSPIRE ST', res: 'WUXGA (1920 x 1200)', chasis: [0.480, 0.406, 0.157], fija: [0.65, 0.75], img: [60, 200], sh: [55, 25], m: [['DWU960ST-iS', 9600]] },
  { serie: 'INSPIRE 4K', res: '4K UHD (3840 x 2160)', k4: true, chasis: [0.480, 0.406, 0.157], fija: [1.25, 2.0], img: [60, 200], sh: [55, 25], m: [['4K860-iS', 8500]] },
  { serie: 'GS', res: 'WUXGA (1920 x 1200)', chasis: [0.480, 0.555, 0.190], m: [['DWU880-GS', 9500]] },
  { serie: 'JAZZ', res: 'WUXGA (1920 x 1200)', chasis: [0.520, 0.600, 0.193], m: [['DWU1800-JS', 17800], ['DWU2400-JS', 23750]] },
  { serie: 'JAZZ', res: '4K UHD+ (3840 x 2400)', k4: true, chasis: [0.520, 0.600, 0.193], m: [['4K1600-JS', 16600], ['4K2100-JS', 21350]] },
  { serie: 'KORUS', res: '4K UHD+ (3840 x 2400)', k4: true, chasis: [0.535, 0.416, 0.194], m: [['4K1000-KS', 10050], ['4K1400-KS', 14250]] },
  { serie: 'M RGB', res: '4K UHD (3840 x 2160)', k4: true, chasis: [0.525, 0.617, 0.270], m: [['M 4K15 RGB', 15750], ['M 4K25 RGB', 25300]] },
  { serie: 'M RGB', res: '4K UHD+ (3840 x 2400)', k4: true, chasis: [0.525, 0.617, 0.270], m: [['M 4K+15 RGB', 15750], ['M 4K+25 RGB', 25300]] },
  { serie: 'ILS4', res: '4K (4096 x 2160)', arTxt: '17:9', k4: true, chasis: [0.635, 0.922, 0.380], m: [['Griffyn 4K35-RGB', 36500], ['Griffyn 4K50-RGB', 50000], ['Sapphire 4K40-RGBH', 40950]] }
];
// ref, relación mínima y máxima, desplazamiento V y H (% de la imagen entera), imagen mínima y máxima (pulgadas; «cm» = ancho en cm),
// series con las que va, brillo que conserva y si el desplazamiento va en un solo sentido o es fijo
export const OPTICAS_CHRISTIE = [
  // GS (DWU880-GS)
  { ref: '140-133108', tr: [0.36, 0.36], sh: [0, 0], img: [120, 350], s: ['GS'], sube: 1 },
  { ref: '900-300383', tr: [0.37, 0.4], sh: [50, 10], img: [200, 600], s: ['GS'], sube: 1 },
  { ref: '140-143109', tr: [0.65, 0.75], sh: [50, 15], img: [50, 500], s: ['GS'] },
  { ref: '140-119102', tr: [0.75, 0.95], sh: [50, 15], img: [50, 500], s: ['GS'] },
  { ref: '140-101103', tr: [0.95, 1.22], sh: [50, 15], img: [50, 500], s: ['GS'] },
  { ref: '140-131106', tr: [1.22, 1.52], sh: [50, 15], img: [50, 500], s: ['GS'] },
  { ref: '140-102104', tr: [1.52, 2.89], sh: [50, 15], img: [50, 500], s: ['GS'] },
  { ref: '140-107109', tr: [2.9, 5.5], sh: [50, 15], img: [50, 500], s: ['GS'] },
  // Jazz y Korus (chip de 0,8")
  { ref: '140-164102', tr: [0.34, 0.37], sh: [51, 24], img: [80, 500], s: ['JAZZ', 'KORUS'], brillo: 0.9, sube: 1 },
  { ref: '140-166104', tr: [0.5, 0.65], sh: [51, 24], img: [50, 500], s: ['KORUS'] },
  { ref: '140-144100', tr: [0.78, 0.9], sh: [51, 24], img: [50, 500], s: ['JAZZ', 'KORUS'] },
  { ref: '140-159106', tr: [0.9, 1.3], sh: [51, 24], img: [50, 500], s: ['JAZZ', 'KORUS'] },
  { ref: '140-165103', tr: [1.25, 2.0], sh: [51, 24], img: [50, 500], s: ['KORUS'] },
  { ref: '140-110103', tr: [1.8, 2.4], sh: [60, 25], img: [50, 500], s: ['JAZZ', 'KORUS'] },
  { ref: '140-111104', tr: [2.4, 4.8], sh: [60, 25], img: [50, 500], s: ['JAZZ', 'KORUS'] },
  { ref: '140-116109', tr: [4.8, 8.64], sh: [60, 25], img: [50, 500], s: ['JAZZ', 'KORUS'] },
  // ILS1 (M RGB): tamaño de imagen por su ancho, en centímetros
  { ref: '118-131106', tr: [0.37, 0.37], sh: [64, 36], cm: [475, 1484], s: ['M RGB'], sube: 1 },
  { ref: '118-100110', tr: [0.67, 0.67], sh: [17.5, 6], cm: [138, 1405], s: ['M RGB'] },
  { ref: '118-130105', tr: [0.8, 1.16], sh: [64, 36], cm: [150, 1325], s: ['M RGB'] },
  { ref: '118-100117', tr: [1.1, 1.1], sh: [64, 36], cm: [254, 1346], s: ['M RGB'] },
  { ref: '118-100111', tr: [1.16, 1.49], sh: [64, 36], cm: [188, 1275], s: ['M RGB'] },
  { ref: '163-165103', tr: [1.28, 1.87], sh: [64, 29], cm: [500, 2500], s: ['M RGB'] },
  { ref: '118-100112', tr: [1.4, 1.8], sh: [64, 36], cm: [216, 1706], s: ['M RGB'] },
  { ref: '118-100113', tr: [1.8, 2.6], sh: [64, 36], cm: [150, 1325], s: ['M RGB'] },
  { ref: '118-100114', tr: [2.6, 4.1], sh: [64, 36], cm: [213, 1714], s: ['M RGB'] },
  { ref: '118-100115', tr: [4.1, 6.9], sh: [64, 36], cm: [168, 1940], s: ['M RGB'] },
  { ref: '118-100116', tr: [6.9, 10.4], sh: [64, 36], cm: [110, 1150], s: ['M RGB'] },
  // ILS4 (Griffyn y Sapphire), las de alto brillo (HB): solo se publica la diagonal mínima
  { ref: '144-136101', tr: [0.38, 0.38], sh: [30, 7.5], img: [55, 0], s: ['ILS4'], brillo: 0.7, sube: 1 },
  { ref: '144-110103', tr: [0.72, 0.72], sh: [0, 0], img: [55, 0], s: ['ILS4'] },
  { ref: '144-111014', tr: [0.9, 0.9], sh: [22.5, 7.5], img: [150, 0], s: ['ILS4'] },
  { ref: '163-118101', tr: [1.13, 1.66], sh: [22.5, 10], img: [110, 0], s: ['ILS4'] },
  { ref: '144-130105', tr: [1.45, 2.17], sh: [27.5, 10], img: [91, 0], s: ['ILS4'] },
  { ref: '144-131106', tr: [1.95, 3.26], sh: [22.5, 15], img: [63, 0], s: ['ILS4'] },
  { ref: '144-107109', tr: [2.71, 3.89], sh: [22.5, 7.5], img: [51, 0], s: ['ILS4'] },
  { ref: '144-108100', tr: [3.89, 5.43], sh: [42.5, 12.5], img: [75, 0], s: ['ILS4'] },
  { ref: '144-109101', tr: [4.98, 7.69], sh: [45, 20], img: [59, 0], s: ['ILS4'] }
];
function leerChristie() {
  const out = [];
  CHRISTIE.forEach((g) => g.m.forEach(([modelo, lumens]) => {
    const px = g.res.match(/(\d{3,5})\s*x\s*(\d{3,5})/).slice(1).map(Number), ar = px[0] / px[1], arTxt = g.arTxt || (Math.abs(ar - 1.6) < 0.01 ? '16:10' : '16:9'), diag = (cm) => cm / 2.54 * Math.sqrt(1 + ar * ar) / ar;
    const base = { marca: 'CHRISTIE', modelo, serie: g.serie, ar, arTxt, resX: px[0], resY: px[1], resTxt: g.res, k4: !!g.k4, k4nativo: !!g.k4, imagen: '', chasis: g.chasis };
    const combo = (optica, tr, img, sh, sube, brillo) => { const mx = img[1] > 0 ? Math.floor(img[1]) : Infinity; return { ...base, id: modelo + (optica ? '|' + optica : ''), optica, nombre: modelo + (optica ? ' + ' + optica : ''), trMin: tr[0], trMax: tr[1], ust: tr[0] < 0.4,
      lumens: Math.round(lumens * (brillo || 1)), minDiagPulg: Math.ceil(img[0]), maxDiagPulg: mx, maxDiagPulgOOS: mx, shiftV: sh[0], shiftH: sh[1], shiftSube: !!sube }; };
    if (g.fija) { out.push(combo('', g.fija, g.img, g.sh, g.fija[0] < 0.4, 1)); return; }
    OPTICAS_CHRISTIE.forEach((o) => { if (!o.s.includes(g.serie)) return; out.push(combo(o.ref, o.tr, o.cm ? [diag(o.cm[0]), diag(o.cm[1])] : o.img, o.sh, o.sube, o.brillo)); });
  }));
  return out;
}
// v10.64 · CHRISTIE desactivado hasta que Josep pase su hoja de datos (16-11-2026): sus datos se quedan aquí, pero no entran en el catálogo
export const CHRISTIE_ACTIVO = false;
export const PROYECTORES = [...leer(), ...leerVivitek(), ...(CHRISTIE_ACTIVO ? leerChristie() : [])];
// cuerpos (con su serie) en el orden del catálogo, para elegir primero el proyector y después la óptica
export const CUERPOS = [...new Map(PROYECTORES.map(q => [q.modelo, { modelo: q.modelo, marca: q.marca, serie: q.serie, lumens: Math.max(...PROYECTORES.filter(x => x.modelo === q.modelo).map(x => x.lumens)) }])).values()];

// ancho nativo máximo de la imagen (eje largo del proyector) a partir de la diagonal máxima y el formato
const anchoMax = (p, oos) => { const d = (oos ? p.maxDiagPulgOOS : p.maxDiagPulg) * 0.0254; return d * p.ar / Math.sqrt(1 + p.ar * p.ar); };
// v10.58 · y el mínimo que enfoca la óptica, cuando el fabricante lo da (0 = sin dato)
const anchoMin = (p) => (p.minDiagPulg > 0 ? p.minDiagPulg * 0.0254 * p.ar / Math.sqrt(1 + p.ar * p.ar) : 0);

// v8.0 · Pared o pantalla: rejilla de columnas × filas con blending en los dos sentidos, con el proyector en horizontal o en
// vertical (retrato). Se busca la que cubre la superficie con menos equipos, cabiendo delante (alcance) y dentro del zoom:
// - dist = distancia óptica–pared fijada (0 = AUTO: la mínima del zoom para la imagen necesaria). Con una distancia fija, la
//   imagen sale del zoom de la óptica a esa distancia: si es mayor que la necesaria, se solapa o sobresale más; si no llega,
//   hacen falta más equipos.
// - orient = 'auto' | 'horizontal' | 'vertical'. En vertical el ancho nativo del proyector da la altura de la imagen; las
//   ópticas ultracortas de desplazamiento fijo (y los de óptica fija ultracorta) no se montan en vertical.
// - Una sola columna o fila puede sobresalir de la superficie hasta un 20 % (se enmascara); varias se solapan del solape
//   mínimo al máximo de blending.
// v8.2 · sin distancia fijada: trObjetivo, la relación de proyección preferida (mapping: el proyector lejos, unas 2 veces el ancho);
// tiroObjetivo, la distancia preferida en metros (pared: el proyector a la altura del público). Si el zoom no llega, el extremo más cercano
// v10.66 · una: una pantalla = un proyector (regla de Josep, 18-11-2026). Con «una», la rejilla es siempre 1 × 1: si esa imagen no llega,
// no cubre o pasa del máximo, sale así, con su aviso, en vez de repartirla en varios equipos. El blending solo se calcula si se pide.
export function calcularPared(sup, p, { alcance, solapeMin = SOLAPE_MIN, oos = false, dist = 0, orient = 'auto', trObjetivo = 0, tiroObjetivo = 0, una = false } = {}) {
  const W = sup.ancho, H = sup.alto, nwMax = anchoMax(p, oos), nwMin = anchoMin(p), sMin = Math.max(0, solapeMin);
  const puedeV = !(p.ust && (p.shiftSube || !p.optica));
  const ors = orient === 'vertical' ? (puedeV ? ['v'] : ['h']) : orient === 'horizontal' ? ['h'] : (puedeV ? ['h', 'v'] : ['h']);
  let mejor = null;
  for (const o of ors) {
    const a = o === 'v' ? 1 / p.ar : p.ar;   // ancho / alto de la imagen sobre la superficie
    for (let rows = 1; rows <= (una ? 1 : 8); rows++) for (let cols = 1; cols <= (una ? 1 : 12); cols++) {
      if (cols * rows > 40) continue;
      const kc = 1 + (cols - 1) * (1 - sMin), kr = 1 + (rows - 1) * (1 - sMin);
      const ihNec = Math.max(H / kr, W / (a * kc));   // la imagen más pequeña que cubre con el solape mínimo
      let nw = o === 'v' ? ihNec : ihNec * a, tiro, fueraZoom = false, noCubre = false;
      if (dist > 0) {
        const nwLejos = dist / p.trMin, nwCerca = dist / p.trMax;   // a esa distancia, el zoom da imágenes entre nwCerca y nwLejos
        if (nw > nwLejos * 1.0001) { noCubre = true; nw = nwLejos; } else if (nw < nwCerca) nw = nwCerca;
        tiro = dist;
      } else tiro = (tiroObjetivo > 0 ? Math.min(Math.max(tiroObjetivo / nw, p.trMin), p.trMax) : trObjetivo > 0 ? Math.min(Math.max(trObjetivo, p.trMin), p.trMax) : p.trMin) * nw;
      const limite = nw > nwMax * 1.0001, chica = nwMin > 0 && nw < nwMin * 0.9999;   // v10.58 · imagen más pequeña que la mínima de la óptica
      const ih = o === 'v' ? nw : nw / a, iw = ih * a;
      const ox = cols > 1 ? (cols * iw - W) / (cols - 1) : 0, oy = rows > 1 ? (rows * ih - H) / (rows - 1) : 0;
      const oxR = cols > 1 ? ox / iw : 0, oyR = rows > 1 ? oy / ih : 0;
      const recX = cols === 1 ? Math.max(0, iw - W) / iw : 0, recY = rows === 1 ? Math.max(0, ih - H) / ih : 0;
      // v10.62 · un solape por encima del máximo de blending pesa más que una sola imagen que sobresale (lo que sobra se enmascara): así no salen
      // rejillas de proyectores casi uno encima de otro (2×2 al 92 %, 1×8 al 114 %) cuando uno solo, con algo de recorte, ya cubre
      const exS = Math.max(0, oxR - SOLAPE_MAX) + Math.max(0, oyR - SOLAPE_MAX), exR = Math.max(0, recX - RECORTE_MAX) + Math.max(0, recY - RECORTE_MAX);
      const fuera = alcance != null && tiro > alcance + 1e-9;
      const lux = p.lumens / (iw * ih);
      // v10.66 · un solape por encima del máximo de blending pesa ya más que no cubrir: con una óptica fija a una distancia fija salían cuatro
      // proyectores casi uno encima de otro (2×2 al 92 %) en vez de decir que desde ahí no se llega
      // primero lo que funciona (dentro de la sala, del tamaño máximo, del zoom y de los solapes), luego con menos equipos,
      // menos imagen desperdiciada y más brillo; a igualdad, en horizontal
      const coste = (fuera ? 1e7 : 0) + (noCubre ? 4e6 : 0) + (limite || chica ? 2e6 : 0) + (exS > 0 ? 5e6 + exS * 1e5 : 0) + (exR > 0 ? 1e6 + exR * 1e5 : 0)
        + cols * rows * 1000 + (recX + recY) * 300 + (oxR + oyR) * 60 - Math.min(lux / Math.PI, 300) * 0.2 + (o === 'v' ? 2 : 0);
      if (!mejor || coste < mejor.coste) mejor = { o, cols, rows, iw, ih, ox, oy, oxR, oyR, recX, recY, tiro, fuera, lux, limite, chica, noCubre, fueraZoom, coste };
    }
  }
  const { o, cols, rows, iw, ih, ox, oy, oxR, oyR, recX, recY, tiro, fuera, lux, limite, chica, noCubre } = mejor, vert = o === 'v';
  const nwF = vert ? ih : iw, tMin = p.trMin * nwF, tMaxZ = p.trMax * nwF;
  const pxW = vert ? p.resY : p.resX, pxH = vert ? p.resX : p.resY;
  const centros = cols === 1 ? [0] : Array.from({ length: cols }, (_, i) => -W / 2 + iw / 2 + i * (iw - ox));
  // base de cada fila desde el pie de la superficie (una sola fila: centrada, lo que sobresale va por igual arriba y abajo)
  const filas = rows === 1 ? [-(ih - H) / 2] : Array.from({ length: rows }, (_, r) => r * (ih - oy));
  const resW = cols === 1 ? Math.round(pxW * Math.min(1, W / iw)) : cols * pxW - (cols - 1) * Math.round(pxW * oxR);
  const resH = rows === 1 ? Math.round(pxH * Math.min(1, H / ih)) : rows * pxH - (rows - 1) * Math.round(pxH * oyR);
  const tiroMax = dist > 0 ? tiro : Math.max(tiro, Math.min(tMaxZ, alcance != null ? alcance : Infinity));
  return { n: cols * rows, cols, rows, vert, imgW: iw, imgH: ih, solape: ox, solapeY: oy, solapeRel: Math.max(oxR, oyR), solapeRelX: oxR, solapeRelY: oyR, solapePx: Math.round(pxW * oxR),
    tiro, tiroMax, tMin, tMaxZ, fueraZoom: dist > 0 && (noCubre || dist < tMin - 1e-6 || dist > tMaxZ + 1e-6), noCubre, ratio: tiro / nwF, fuera, limite, chica, recorte: recY, recorteX: recX,
    centros, filas, anchoTot: cols === 1 ? iw : cols * iw - (cols - 1) * ox, altoTot: rows === 1 ? ih : rows * ih - (rows - 1) * oy, resW, resH, lux, nits: lux / Math.PI };
}

// Suelo: rejilla de proyectores cenitales (desde el techo) con blending en los dos ejes
export function calcularSuelo(sup, p, { altoSala, solapeMin = SOLAPE_MIN, oos = false } = {}) {
  const tiro = Math.max(0.5, altoSala - 0.15);
  let imgW = Math.min(tiro / p.trMin, anchoMax(p, oos)), imgH = imgW / p.ar;
  const W = sup.ancho, D = sup.alto;
  const cols = imgW >= W ? 1 : 1 + Math.ceil((W - imgW) / (imgW * (1 - solapeMin)) - 1e-9);
  const rows = imgH >= D ? 1 : 1 + Math.ceil((D - imgH) / (imgH * (1 - solapeMin)) - 1e-9);
  const sx = cols > 1 ? (cols * imgW - W) / (cols - 1) : 0, sz = rows > 1 ? (rows * imgH - D) / (rows - 1) : 0;
  const pos = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) pos.push({ x: cols === 1 ? 0 : -W / 2 + imgW / 2 + c * (imgW - sx), z: rows === 1 ? 0 : -D / 2 + imgH / 2 + r * (imgH - sz) });
  const resW = cols * p.resX - (cols - 1) * Math.round(p.resX * (cols > 1 ? sx / imgW : 0));
  const resH = rows * p.resY - (rows - 1) * Math.round(p.resY * (rows > 1 ? sz / imgH : 0));
  const lux = p.lumens / (imgW * imgH);
  return { n: cols * rows, cols, rows, imgW, imgH, tiro, ratio: p.trMin, solapeX: sx, solapeZ: sz, solapeRel: Math.max(cols > 1 ? sx / imgW : 0, rows > 1 ? sz / imgH : 0), pos, resW, resH, lux, nits: lux / Math.PI, fuera: false, limite: false };
}

// Proyector sugerido: el que cubre cada pared con menos equipos, cabiendo en la sala y con más brillo
export function sugerir(sups, alcances, opc = {}) {
  let mejor = null;
  for (const p of PROYECTORES) {
    let total = 0, fuera = false, limite = false, nitsMin = Infinity;
    sups.filter(s => s.tipo !== 'suelo').forEach((s, i) => {
      const r = calcularPared(s, p, { alcance: alcances[i], ...opc });
      total += r.n; fuera = fuera || r.fuera; limite = limite || r.limite; nitsMin = Math.min(nitsMin, r.nits);
    });
    const punt = (fuera ? -1000 : 0) + (limite ? -200 : 0) - total * 10 + Math.min(nitsMin, 200) / 4;
    if (!mejor || punt > mejor.punt) mejor = { p, punt };
  }
  return mejor ? mejor.p : PROYECTORES[0];
}

// ---------- Colocación de los proyectores y sombras del público ----------
export const ALTO_PERSONA = 1.85;   // persona de 1,75 m con margen (cabeza y pelo)
// pasa un punto local de la superficie (x a lo ancho, y alto, z hacia la sala) a coordenadas de la escena
const aMundo = (s, x, y, z) => ({ x: s.x + x * Math.cos(s.rot) + z * Math.sin(s.rot), y, z: s.z - x * Math.sin(s.rot) + z * Math.cos(s.rot) });
// Proyectores de una pared: lente a la distancia de tiro, uno por imagen de la rejilla (columnas × filas).
// montaje: 'colgado' (del techo, de un truss o de la altura indicada; los de una misma columna, apilados hacia abajo),
// 'apoyado' (sobremesa, suelo o torre a la altura indicada; apilados hacia arriba) o 'auto':
// - con techo (sala, o techo por encima de la imagen): colgado como siempre (sobre la imagen; los UST, justo encima),
//   y si la óptica no da el desplazamiento necesario, más abajo hasta donde llega;
// - sin techo (fachada, exterior): en una base o torre a la altura más baja que permite el desplazamiento de la óptica.
// En vertical el chasis gira 90° y el desplazamiento vertical de la superficie es el horizontal de la óptica.
export function colocarPared(s, p, prod, { alto, sala, techo: techoS, montaje = 'auto', altura = 0 }) {
  const altoPared = sala ? alto : s.elev + s.alto + 0.2;
  const altoCh = p.vert ? prod.chasis[0] : prod.chasis[2], paso = altoCh + HOLGURA.v;
  const yTop = s.elev + p.filas[p.rows - 1] + p.imgH;   // borde superior de la imagen conjunta
  const hayTecho = sala || (techoS > 0 && techoS >= yTop);
  const techo = sala ? alto - 0.05 - altoCh / 2 : (hayTecho ? techoS - 0.05 - altoCh / 2 : Infinity);
  const lim = prod.ust ? 0 : (p.vert ? prod.shiftH : prod.shiftV) / 100 || 0;   // desplazamiento que da la óptica (fracción de la imagen)
  const suelo = 0.8 + altoCh / 2;                                                  // sobremesa
  const yHung = Math.min(techo, prod.ust ? yTop + 0.22 : Math.max(yTop + 0.15, (sala ? alto : altoPared + 0.6) - 0.45));
  const zL = Math.max(0.15, p.tiro), zMax = Math.max(zL, p.tiroMax || zL), out = [];
  for (let r = 0; r < p.rows; r++) {
    const y0 = s.elev + p.filas[r], y1 = y0 + p.imgH, yC = (y0 + y1) / 2;
    let yProy, apoyo = false;
    if (montaje === 'apoyado') {
      const yC0 = s.elev + p.filas[0] + p.imgH / 2, base = altura > 0 ? altura : (lim ? Math.max(0.8, yC0 - lim * p.imgH - altoCh / 2) : 0.8);
      yProy = base + altoCh / 2 + r * paso; apoyo = true;
    }
    else if (montaje === 'colgado') yProy = (altura > 0 ? altura - 0.05 - altoCh / 2 : (hayTecho ? techo : yTop + 0.15 + altoCh / 2)) - (p.rows - 1 - r) * paso;
    else if (prod.ust) yProy = Math.min(techo, y1 + 0.22);                         // UST: justo sobre su imagen
    else if (hayTecho) { yProy = yHung - (p.rows - 1 - r) * paso; if (lim) yProy = Math.min(techo, Math.max(yC - lim * p.imgH, Math.min(yC + lim * p.imgH, yProy))); }
    else if (lim) { yProy = Math.max(suelo, yC - lim * p.imgH); apoyo = true; }
    else yProy = yHung - (p.rows - 1 - r) * paso;
    p.centros.forEach(cx => out.push({
      lente: aMundo(s, cx, yProy, zL), rot: s.rot, prod, vert: !!p.vert, apoyo, ancho: p.imgW, zMax, nrm: { x: Math.sin(s.rot), z: Math.cos(s.rot) },
      esquinas: [[cx - p.imgW / 2, y1], [cx + p.imgW / 2, y1], [cx + p.imgW / 2, y0], [cx - p.imgW / 2, y0]].map(([a, b]) => aMundo(s, a, b, 0.01)),
      yProy, y0, y1, zL, filaR: r
    }));
  }
  return out;
}
export function colocarSuelo(p, alto) {
  return p.pos.map(q => ({ lente: { x: q.x, y: alto - 0.15, z: q.z }, rot: 0, prod: null, esquinas: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => ({ x: q.x + a * p.imgW / 2, y: 0.01, z: q.z + b * p.imgH / 2 })), suelo: true }));
}
const resta = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const cruz = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const punto = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
// ¿está el punto dentro de la pirámide del haz (vértice en la lente, base en la imagen)?
function dentroHaz(P, h, margen = 0) {
  const L = h.lente, Q = h.esquinas, C = Q.reduce((a, v) => ({ x: a.x + v.x / 4, y: a.y + v.y / 4, z: a.z + v.z / 4 }), { x: 0, y: 0, z: 0 });
  for (let k = 0; k < 4; k++) {
    const n = cruz(resta(Q[k], L), resta(Q[(k + 1) % 4], L)); const lado = punto(n, resta(C, L));
    if (punto(n, resta(P, L)) * Math.sign(lado) < -margen * Math.hypot(n.x, n.y, n.z)) return false;
  }
  const nb = cruz(resta(Q[1], Q[0]), resta(Q[3], Q[0])); // del lado de la lente respecto a la imagen
  return punto(nb, resta(P, Q[0])) * punto(nb, resta(L, Q[0])) > 0;
}
// Sombras, zona segura y cruces de haces de toda la instalación
// filas: [{ s, p, proyector, nombre }] · esp: espacio (sala o pantallas) · alto: alto de la sala o de la escena
// medio tamaño del chasis en la escena (los de pared miran a su pared; los cenitales, hacia el suelo)
function medio(h) {
  let [w, d, a] = (h.suelo ? (h.prod2 || h.prodS) : h.prod) ? (h.suelo ? (h.prod2 || h.prodS).chasis : h.prod.chasis) : [0.55, 0.45, 0.2];
  if (h.suelo) return { x: w / 2, y: d / 2, z: a / 2 };
  if (h.vert) [w, a] = [a, w];   // en vertical, el chasis va girado 90° sobre el eje de la óptica
  const lat = Math.abs(Math.sin(h.rot)) > 0.5;
  return { x: (lat ? d : w) / 2, y: a / 2, z: (lat ? w : d) / 2 };
}
const chocan = (a, b) => { const A = medio(a), B = medio(b);
  return Math.abs(a.lente.x - b.lente.x) < A.x + B.x + HOLGURA.h && Math.abs(a.lente.z - b.lente.z) < A.z + B.z + HOLGURA.h && Math.abs(a.lente.y - b.lente.y) < A.y + B.y + HOLGURA.v; };
// puntos del chasis (caja con su tamaño real alrededor de la lente)
const puntosCuerpo = (h) => { const M = medio(h), L = h.lente, out = [];
  for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) for (const c of [-1, 1]) out.push({ x: L.x + a * M.x, y: L.y + c * M.y, z: L.z + b * M.z });
  return out; };
// problemas de un proyector frente a los ya colocados: chasis que se tocan, su chasis dentro del haz de otra superficie
// o, al revés, el chasis de otra superficie dentro de su haz (sombra en una imagen)
// caja que envuelve un haz (lente + imagen) para descartar rápido los puntos que no pueden estar dentro
const cajaHaz = (h) => { const P = [h.lente, ...h.esquinas]; return { x0: Math.min(...P.map(p => p.x)), x1: Math.max(...P.map(p => p.x)), y0: Math.min(...P.map(p => p.y)), y1: Math.max(...P.map(p => p.y)), z0: Math.min(...P.map(p => p.z)), z1: Math.max(...P.map(p => p.z)) }; };
const enCaja = (P, B) => P.x >= B.x0 && P.x <= B.x1 && P.y >= B.y0 && P.y <= B.y1 && P.z >= B.z0 && P.z <= B.z1;
const enHaz = (pts, h) => { const B = cajaHaz(h); return pts.some(P => enCaja(P, B) && dentroHaz(P, h)); };
function problemas(h, puestos, rapido) {
  let choque = null, haz = null; const ph = puntosCuerpo(h);
  for (const o of puestos) {
    if (!choque && chocan(h, o)) { choque = o; if (rapido) break; }
    if (!haz && o.sup !== h.sup && (enHaz(ph, o) || enHaz(puntosCuerpo(o), h))) { haz = o; if (rapido) break; }
    if (choque && haz) break;
  }
  return { choque, haz, n: (choque ? 1 : 0) + (haz ? 1 : 0) };
}
// Colocación sin choques ni sombras: cada proyector se prueba en su sitio y, si toca a otro chasis o queda dentro de otro haz
// (o mete otro chasis en el suyo), se busca la variante más cercana: alejarlo de su pared con el zoom de la óptica,
// colgarlo más bajo o más alto (sin pasar del techo ni bajar de 2,3 m) o desplazarlo por su pared con el lens shift.
// Los cenitales del suelo van fijos junto al techo y se colocan primero.
export function resolverChoques(haces, alto) {
  const puestos = [], movs = [], choques = [];
  const orden = haces.slice().sort((a, b) => (b.suelo ? 1 : 0) - (a.suelo ? 1 : 0));
  orden.forEach(h => {
    const base = { ...h.lente }, zL0 = h.zL, M = medio(h);
    const inicial = problemas(h, puestos);
    if (!inicial.n) { puestos.push(h); return; }
    const paso = M.y * 2 + HOLGURA.v, techo = alto - 0.05 - M.y, suelo = Math.min(2.3 + M.y, base.y);   // apoyados (mesa, torre): nunca por debajo de su sitio
    const dzs = [0], dys = [0], dxs = [0];
    if (!h.suelo) {
      for (let z = 0.25; zL0 + z <= (h.zMax || zL0) + 1e-6 && dzs.length < 9; z += 0.25) dzs.push(z);
      for (let k = 1; k <= 4; k++) dys.push(-k * paso, k * paso);
      const lado = M.x * 2 + HOLGURA.h, lim = (h.ancho || 0) * 0.25;
      for (let k = 1; k * lado <= lim + 1e-6; k++) dxs.push(k * lado, -k * lado);
    }
    const cand = [];
    dzs.forEach(dz => dys.forEach(dy => dxs.forEach(dx => { if (dz || dy || dx) cand.push({ dz, dy, dx, c: dz + Math.abs(dy) * 1.5 + Math.abs(dx) * 1.2 }); })));
    cand.sort((a, b) => a.c - b.c);
    const poner = (c) => { const n = h.nrm || { x: 0, z: 0 };
      h.lente = { x: base.x + n.x * c.dz + c.dx * Math.cos(h.rot), y: base.y + c.dy, z: base.z + n.z * c.dz - c.dx * Math.sin(h.rot) }; h.zL = zL0 + c.dz; };
    let ok = null, sinChoque = null;
    for (const c of cand) {
      const y = base.y + c.dy; if (y > techo + 1e-6 || y < suelo - 1e-6) continue;
      poner(c); const pr = problemas(h, puestos, true);
      if (!pr.n) { ok = c; break; }
      if (!sinChoque && inicial.choque && !chocan(h, puestos.find(o => chocan(h, o)) || h)) sinChoque = c;
    }
    if (ok) movs.push({ h, ...ok, con: inicial.choque || inicial.haz, por: inicial.choque ? 'choque' : 'haz' });
    else {
      // sin ubicación limpia: al menos que los chasis no se toquen (la sombra queda avisada)
      if (sinChoque && !puestos.some(o => { poner(sinChoque); return chocan(h, o); })) { poner(sinChoque); movs.push({ h, ...sinChoque, con: inicial.choque, por: 'choque' }); }
      else { h.lente = base; h.zL = zL0; }
      const pr = problemas(h, puestos); if (pr.choque) choques.push({ h, con: pr.choque });
    }
    puestos.push(h);
  });
  return { movs, choques };
}
export function analizarSombras(filas, esp, alto, coloc = {}) {
  const sala = esp.tipo === 'sala', haces = [], franjas = [], avisos = [];
  filas.forEach(f => {
    if (f.s.tipo === 'suelo') { colocarSuelo(f.p, alto).forEach((h, i) => haces.push({ ...h, prodS: f.proyector, sup: f.s.id, nombre: f.nombre, i })); return; }
    colocarPared(f.s, f.p, f.proyector, { alto, sala, techo: esp.tipo === 'sala' ? 0 : (esp.sueltas && esp.sueltas.techo) || 0, montaje: coloc.montaje, altura: coloc.altura }).forEach((h, i) => haces.push({ ...h, sup: f.s.id, nombre: f.nombre, i, fila: f }));
  });
  const colocacion = resolverChoques(haces, alto);
  // franja de sombra de cada pared con la altura final de sus lentes:
  // el borde inferior del haz sube desde la base de la imagen (en la pared) hasta la lente
  filas.forEach(f => {
    if (f.s.tipo === 'suelo') return;
    let zS = 0;
    haces.filter(h => h.fila === f).forEach(h => { const yL = h.lente.y; if (h.y0 < ALTO_PERSONA) zS = Math.max(zS, yL > h.y0 ? Math.min(h.zL, h.zL * (ALTO_PERSONA - h.y0) / (yL - h.y0)) : h.zL); });
    const tiroReal = Math.max(f.p.tiro, ...haces.filter(h => h.fila === f).map(h => h.zL));
    franjas.push({ id: f.s.id, nombre: f.nombre, s: f.s, prof: zS, tiro: tiroReal, ust: f.proyector.ust, ancho: f.s.ancho });
  });
  // zona segura: en una sala, el rectángulo que queda libre de las franjas de sombra de cada pared
  let zona = null;
  if (sala) {
    const fr = (id) => (franjas.find(x => x.id === id) || { prof: 0 }).prof;
    const W = esp.ancho, D = esp.fondo;
    zona = { x0: -W / 2 + fr('izquierda'), x1: W / 2 - fr('derecha'), z0: -D / 2 + fr('frontal'), z1: D / 2 - fr('trasera') };
    zona.ancho = zona.x1 - zona.x0; zona.fondo = zona.z1 - zona.z0; zona.ok = zona.ancho >= 0.6 && zona.fondo >= 0.6;
  }
  // conflictos: un proyector (su cuerpo) dentro del haz de otro → sombra en la imagen de ese otro
  const conflictos = [], cruces = [];
  haces.forEach((a, ia) => haces.forEach((b, ib) => {
    if (ia === ib || a.sup === b.sup) return;
    if (puntosCuerpo(a).some(P => dentroHaz(P, b))) conflictos.push({ tapa: a, haz: b });
  }));
  // cruces de haces entre superficies distintas (muestreo de rayos de cada haz)
  for (let ia = 0; ia < haces.length; ia++) for (let ib = ia + 1; ib < haces.length; ib++) {
    const a = haces[ia], b = haces[ib]; if (a.sup === b.sup) continue;
    let cruza = false;
    for (let u = 0.1; u <= 0.9 && !cruza; u += 0.2) for (let v = 0.1; v <= 0.9 && !cruza; v += 0.2) {
      const Q = a.esquinas, base = { x: (1 - u) * (1 - v) * Q[0].x + u * (1 - v) * Q[1].x + u * v * Q[2].x + (1 - u) * v * Q[3].x, y: (1 - u) * (1 - v) * Q[0].y + u * (1 - v) * Q[1].y + u * v * Q[2].y + (1 - u) * v * Q[3].y, z: (1 - u) * (1 - v) * Q[0].z + u * (1 - v) * Q[1].z + u * v * Q[2].z + (1 - u) * v * Q[3].z };
      for (let t = 0.15; t <= 0.9 && !cruza; t += 0.15) { const P = { x: a.lente.x + (base.x - a.lente.x) * t, y: a.lente.y + (base.y - a.lente.y) * t, z: a.lente.z + (base.z - a.lente.z) * t }; if (dentroHaz(P, b)) cruza = true; }
    }
    if (cruza && !cruces.some(c => (c.a === a.sup && c.b === b.sup) || (c.a === b.sup && c.b === a.sup))) cruces.push({ a: a.sup, b: b.sup, na: a.nombre, nb: b.nombre });
  }
  return { haces, franjas, zona, conflictos, cruces, avisos, persona: ALTO_PERSONA, movs: colocacion.movs, choques: colocacion.choques };
}

// Obstáculos (columnas, cajas…) que cortan algún haz: harán sombra en esa imagen
export function obstaculosEnHaces(obs, haces) {
  const out = [];
  obs.forEach((o, k) => {
    const pts = [];
    for (const a of [-0.5, 0, 0.5]) for (const b of [-0.5, 0, 0.5]) for (const c of [0.02, 0.5, 1]) pts.push({ x: o.x + a * o.ancho, y: c * o.alto, z: o.z + b * o.fondo });
    const tocados = haces.filter(h => pts.some(P => dentroHaz(P, h)));
    const sups = [...new Set(tocados.map(h => h.nombre))];
    if (sups.length) out.push({ k, nombres: sups });
  });
  return out;
}
