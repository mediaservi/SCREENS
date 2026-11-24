// SCREENS · cálculo de proyección (motor heredado de SCREENBOX v6.65, revisado).
// v8.0 · catálogo de Epson dentro de la app (funciona sin conexión): los proyectores de óptica fija y los cuerpos de óptica
// intercambiable, cada uno combinado con todas sus ópticas compatibles según la guía maestra de Epson «Alta luminosidad ·
// Opciones de lente» (08/2026). Columna «optica»: «fija» o la serie del cuerpo (PU1000, PU2000, PQ2000, XQ2030).
const CSV = `marca,modelo,optica,throwratio,lumens,aspectratio,resolucion,4K,screen,soos,image
EPSON,EB-815E,fija,0.16:1,5000,16:9,Full HD (1920 x 1080),4K Enhancement,160,248,https://charmex.net/images/epson-ust_2476_19_20250325104608.png
EPSON,EB-805F,fija,0.27 - 0.37:1,5000,16:9,Full HD (1920 x 1080),NO,130,250,https://charmex.net/images/epson-ust_2476_5_20210408172254.png
EPSON,EB-L695SE,fija,0.515 - 0.725:1,6000,16:10,WUXGA (1920 x 1200),4K Enhancement,500,600,https://charmex.net/images/epson-media-st_3156_16_20250513123910.png
EPSON,EB-L795SE,fija,0.79 - 1.36:1,7000,16:10,WUXGA (1920 x 1200),4K Enhancement,400,500,https://charmex.net/images/epson-media-st_3156_15_20250513123855.png
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
// v10.89 · datos del fabricante (24-11-2026): cada combinación cuerpo + óptica tiene sus lúmenes (lm: fracción de los
// del cuerpo por serie; lmMax: tope; lmXQ: lúmenes del EB-XQ2030B con esa óptica), su imagen mínima (min, en pulgadas; por defecto 50″ en
// PU1000 y 60″ en el resto) y, las ultracortas plegadas, la separación fija entre la imagen y el proyector (sep, m) y lo que va de la lente
// a la cara del cuerpo más cercana a la pantalla (desfase, m). Las plegadas no desplazan la imagen: va pegada al proyector.
/* v11.6 · ELPLU03S, ELPLW05 y ELPLM08 en PQ2000: desplazamiento ±25 / ±8 % (antes ±18 / ±6); ELPLU03S en PU2000 ±24 / ±8 % y mínimo de 80″ también
   en PU1000; ELPLM08 en PQ2000 con tope de 9.600 lm. Leído en la herramienta de cálculo de Epson (24-11-2026) */
export const OPTICAS = [
  { ref: 'ELPLX01S', tipo: 'ust', plegada: 1, sep: { PU1000: 0.259 }, desfase: { PU1000: 0.332 }, lm: { PU1000: 0.855 }, min: 100, s: { PU1000: [0.35, 0.35, 17, 10, 1] } },
  { ref: 'ELPLX02S', tipo: 'ust', plegada: 1, sep: { PU2000: 0.2, PQ2000: 0.228, XQ2030: 0.228 }, desfase: { PU2000: 0.21, PQ2000: 0.225, XQ2030: 0.225 }, lm: { PU2000: 0.845, PQ2000: 0.845 }, lmXQ: 20000, min: 100, s: { PU2000: [0.35, 0.35, 25, 15, 1], PQ2000: [0.34, 0.34, 30, 13, 1], XQ2030: [0.34, 0.34, 30, 13, 1] } },
  { ref: 'ELPLX04H', tipo: 'corta', lmXQ: 24900, minS: { XQ2030: 80 }, s: { PU2000: [0.40, 0.51, 60, 18], PQ2000: [0.39, 0.49, 64, 16], XQ2030: [0.39, 0.49, 64, 16] } },
  { ref: 'ELPLU06H', tipo: 'corta', lmXQ: 25200, minS: { XQ2030: 80 }, s: { PU2000: [0.40, 0.51, 60, 18], PQ2000: [0.39, 0.49, 64, 16], XQ2030: [0.39, 0.49, 64, 16] } },
  { ref: 'ELPLU03S', tipo: 'corta', lm: { PU1000: 0.855, PU2000: 0.87, PQ2000: 0.855 }, lmXQ: 20000, minS: { PU1000: 80, PU2000: 80, PQ2000: 80 }, s: { PU1000: [0.65, 0.78, 67, 30], PU2000: [0.48, 0.57, 24, 8], PQ2000: [0.46, 0.56, 25, 8], XQ2030: [0.46, 0.56, 25, 8] } },
  { ref: 'ELPLU07H', tipo: 'corta', lmXQ: 26700, minS: { XQ2030: 80 }, s: { PU1000: [0.64, 0.87, 67, 30], PU2000: [0.47, 0.64, 60, 18], PQ2000: [0.46, 0.62, 64, 16], XQ2030: [0.46, 0.62, 64, 16] } },
  { ref: 'ELPLU04', tipo: 'corta', lm: { PU1000: 0.905, PU2000: 0.95, PQ2000: 0.945 }, lmXQ: 20000, s: { PU1000: [0.87, 1.05, 67, 30], PU2000: [0.64, 0.77, 60, 18], PQ2000: [0.62, 0.75, 64, 16], XQ2030: [0.62, 0.75, 64, 16] } },
  { ref: 'ELPLU04H', tipo: 'corta', lmXQ: 27800, minS: { XQ2030: 80 }, s: { PU1000: [0.86, 1.22, 67, 30], PU2000: [0.64, 0.90, 60, 18], PQ2000: [0.62, 0.87, 64, 16], XQ2030: [0.62, 0.87, 64, 16] } },
  { ref: 'ELPLW05', tipo: 'angular', lm: { PU1000: 0.87 }, lmMax: { PU2000: 11700, PQ2000: 12000 }, s: { PU1000: [1.04, 1.46, 67, 30], PU2000: [0.77, 1.07, 24, 10], PQ2000: [0.74, 1.04, 25, 8] } },
  { ref: 'ELPLW08H', tipo: 'angular', lm: { PU1000: 0.855, PU2000: 0.955, PQ2000: 0.95 }, lmXQ: 28500, s: { PU1000: [1.18, 1.66, 67, 30], PU2000: [0.86, 1.21, 60, 18], PQ2000: [0.83, 1.17, 64, 16], XQ2030: [0.83, 1.17, 64, 16] } },
  { ref: 'ELPLW06H', tipo: 'angular', lm: { PU1000: 0.945, PU2000: 0.955, PQ2000: 0.955 }, lmXQ: 28700, s: { PU1000: [1.62, 2.22, 67, 30], PU2000: [1.19, 1.62, 60, 18], PQ2000: [1.15, 1.57, 64, 16], XQ2030: [1.15, 1.57, 64, 16] } },
  { ref: 'ELPLM08', tipo: 'estandar', lmMax: { PU2000: 10000, PQ2000: 9600 }, minS: { PU2000: 80, PQ2000: 80 }, s: { PU1000: [1.44, 2.32, 67, 30], PU2000: [1.06, 1.69, 24, 10], PQ2000: [1.02, 1.64, 25, 8] } },
  { ref: 'ELPLM15H', tipo: 'estandar', lm: { PU1000: 0.985 }, lmXQ: 30000, s: { PU1000: [2.16, 3.48, 67, 30], PU2000: [1.57, 2.56, 60, 18], PQ2000: [1.52, 2.47, 64, 16], XQ2030: [1.52, 2.47, 64, 16] } },
  { ref: 'ELPLM10H', tipo: 'media', lm: { PU1000: 0.975, PU2000: 0.99, PQ2000: 0.985 }, lmXQ: 29700, s: { PU1000: [3.32, 5.06, 67, 30], PU2000: [2.42, 3.71, 60, 18], PQ2000: [2.34, 3.59, 64, 16], XQ2030: [2.34, 3.59, 64, 16] } },
  { ref: 'ELPLM11H', tipo: 'media', lm: { PU1000: 0.935, PU2000: 0.95, PQ2000: 0.95 }, lmXQ: 28500, s: { PU1000: [4.85, 7.38, 67, 30], PU2000: [3.54, 5.41, 60, 18], PQ2000: [3.42, 5.23, 64, 16], XQ2030: [3.42, 5.23, 64, 16] } },
  { ref: 'ELPLL08', tipo: 'larga', lm: { PU1000: 0.935, PU2000: 0.95, PQ2000: 0.95 }, lmXQ: 28500, s: { PU1000: [7.21, 10.11, 67, 30], PU2000: [5.27, 7.41, 60, 18], PQ2000: [5.09, 7.16, 64, 16], XQ2030: [5.09, 7.16, 64, 16] } },
  { ref: 'ELPLL11H', tipo: 'larga', lmXQ: 29900, minS: { XQ2030: 70 }, s: { PU1000: [9.90, 15.52, 67, 30], PU2000: [7.23, 11.38, 60, 18], PQ2000: [6.99, 11.00, 64, 16], XQ2030: [6.99, 11.00, 64, 16] } }
];
// ópticas fijas: desplazamiento (V, H en %), imagen mínima (″) y, las ultracortas, separación imagen–proyector y desfase lente–cuerpo
const FIJA_EPSON = { 'EB-815E': { min: 80, sep: () => 0.118, desfase: 0.255 }, 'EB-805F': { min: 65, sep: (d) => 0.0016214 * d + 0.161, desfase: 0.233 },
  'EB-L695SE': { sh: [50, 20], min: 80 }, 'EB-L795SE': { sh: [50, 20], min: 60 }, 'EB-L695SU': { sh: [50, 20], min: 60 } };

export const SOLAPE_MIN = 0.15, SOLAPE_MAX = 0.65;   // límites de blending de SCREENBOX
// v10.69 · dos tramos (decidido por Josep, 21-11-2026): hasta el 45 % el solape es «recomendable»; del 45 al 65 %, «posible, con aviso»
export const SOLAPE_RECO = 0.45;
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
    const combo = (optica, tr, lumens, sh, x) => ({ ...base, id: c[1] + (optica ? '|' + optica : ''), optica, nombre: c[1] + (optica ? ' + ' + optica : ''),
      trMin: Math.min(...tr), trMax: Math.max(...tr), lumens, ust: Math.min(...tr) < 0.4, shiftV: sh[0] || 0, shiftVcontra: sh[0] || 0, shiftH: sh[1] || 0, shiftSube: !!sh[2], ...(x || {}) });
    if (c[2] === 'fija') { const F = FIJA_EPSON[c[1]] || {}, tr = c[3].replace(':1', '').split('-').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
      out.push(combo('', tr, Number(c[4]), F.sh || [], { minDiagPulg: F.min || 0, ...(F.sep ? { ust: true, plegada: true, sepUST: F.sep, desfase: F.desfase } : { ust: false }) })); return; }
    OPTICAS.forEach((o) => {
      const d = o.s[c[2]]; if (!d) return;
      const sr = c[2], cuerpoLm = Number(c[4]);
      let lm = sr === 'XQ2030' && o.lmXQ ? Math.min(cuerpoLm, o.lmXQ) : Math.round(cuerpoLm * ((o.lm && o.lm[sr]) || 1));
      if (o.lmMax && o.lmMax[sr]) lm = Math.min(lm, o.lmMax[sr]);
      const min = (o.minS && o.minS[sr]) || o.min || (sr === 'PU1000' ? 50 : 60);
      out.push(combo(o.ref, [d[0], d[1]], lm, [d[2], d[3], d[4]], { minDiagPulg: min, ust: !!o.plegada, plegada: !!o.plegada, ...(o.plegada ? { sepUST: () => (o.sep[sr] || 0.22), desfase: o.desfase[sr] || 0.22 } : {}) }));
    });
  });
  return out;
}
// v10.89 · VIVITEK con los datos del fabricante (24-11-2026):
// - cada cuerpo con sus ópticas compatibles (fuera D88-UST01B, D88-UWZ01 y D88-WZ01; entran D89-LZ01, D98-69103 y las
//   K1U/K1K de las series 5000);
// - por óptica y chip: relación de proyección, distancia de foco en especificación y foco mecánico (m), imagen mínima y máxima (″),
//   desplazamiento vertical asimétrico (hacia el lado normal / al contrario, %) y horizontal (±%), rendimiento de brillo en gran angular y tele
//   (%) y «offset» (las series 5000 llevan la lente en el borde de la imagen: 100 %). Sin dato de la óptica, el del cuerpo.
// - Las ultracortas D89-UST01 y D98-UST01 son de ángulo recto: se colocan con su desplazamiento, como las demás.
const VIVITEK = [
  { serie: 'DU7000Z', g: '67', res: 'WUXGA (1920 x 1200)', ar: '16:10', V: [70, 50], H: 15, chasis: [0.470, 0.517, 0.202], m: [['DU7099Z', 8000], ['DU7199Z', 9000], ['DU7299Z', 10000]] },
  { serie: 'DU8000Z', g: '8', res: 'WUXGA (1920 x 1200)', ar: '16:10', V: [60, 60], H: 20, chasis: [0.500, 0.591, 0.216], m: [['DU8053Z', 14000], ['DU8055Z', 16000], ['DU8057Z', 24000]] },
  { serie: 'DK8000Z', g: '8', res: '4K UHD+ (3840 x 2400)', ar: '16:10', k4: true, V: [60, 60], H: 20, chasis: [0.500, 0.591, 0.216], m: [['DK8150Z', 12000], ['DK8155Z', 15000]] },
  { serie: 'DU9057Z', g: '9', res: 'WUXGA (1920 x 1200)', ar: '16:10', V: [50, 30], H: 15, chasis: [0.677, 0.599, 0.270], m: [['DU9057Z', 27000]] },
  { serie: 'DU9059Z', g: '9', res: 'WUXGA (1920 x 1200)', ar: '16:10', V: [50, 30], H: 15, chasis: [0.677, 0.599, 0.270], m: [['DU9059Z', 30000]], pref: 'D99A-' },
  { serie: 'DU5000Z', g: '5U', res: 'WUXGA (1920 x 1200)', ar: '16:10', V: [15, 5], H: 2, offset: 0.5, chasis: [0.496, 0.380, 0.160], m: [['DU5051Z', 6300], ['DU5053Z', 7700]] },
  { serie: 'DK5000Z', g: '5K', res: '4K UHD (3840 x 2160)', ar: '16:9', k4: true, V: [22, 2], H: 2, offset: 0.5, chasis: [0.496, 0.380, 0.160], m: [['DK5153Z', 6200]] }
];
// v11.8 · D89-UST01 en los DU7x99 (chip 0,67″): imagen mínima de 124″ (unos 2,66 m de ancho), la que deja el simulador de Vivitek (no acerca a menos de 1,036 m)
// [tipo, trMin, trMax, foco [min, max], foco mecánico [min, max] | 0, imagen [min, max] | 0, V [hacia, contra] | 0, H | 0, brillo [ancho, tele] | 0]
const LENTES_VIVITEK = {
  67: { 'D89-UST01': ['ust', 0.368, 0.39, [0.53, 2.25], [0.45, 3.58], [124, 400], [60, 45], 2.5, 0], 'D86-04705': ['corta', 0.47, 0.5, [0.81, 3.16], [0.81, 3.16], [0, 300], 0, 0, 0],
    'D89-UWZ01': ['corta', 0.65, 0.89, [0.81, 4.92], [0.82, 7.83], [60, 400], [60, 45], 12, 0], 'D86-0711': ['corta', 0.77, 1.1, [1, 4.98], [1, 12], [0, 500], 0, 0, 0],
    'D89-UWZ02': ['angular', 0.88, 1.28, [0.92, 9.74], [0.89, 14.51], [50, 500], [60, 45], 12, 0], 'D86-1113': ['angular', 1.1, 1.3, [1, 9], [1, 14.26], [0, 500], 0, 0, 0],
    'D89-WZ01': ['angular', 1.25, 1.68, [1.3, 15.77], [1.26, 22.54], [50, 600], [65, 45], 12, [97.2, 97.2]], 'D86-1216': ['angular', 1.26, 1.6, [1.35, 8.08], [1.35, 17.5], [0, 500], 0, 0, 0],
    'D86-1519': ['estandar', 1.54, 1.93, [2, 10], [2, 21.2], [0, 500], 0, 0, 0], 'D89-ST01': ['estandar', 1.67, 2.51, [1.78, 23.2], [1.75, 33.16], [50, 600], [65, 45], 12, 0],
    'D86-1929': ['media', 1.93, 2.9, [2, 20], [2, 31.8], [0, 500], 0, 0, 0], 'D89-SMLZ01': ['media', 2.5, 4.7, [2.7, 45.12], [2.66, 64.51], [50, 600], [65, 45], 12, [97.3, 97.3]],
    'D88-LOZ101': ['larga', 3.58, 5.38, [3.8, 35.35], [3.02, 59.01], [0, 500], 0, 0, 0], 'D88-LOZ201': ['larga', 5.31, 8.26, [5.59, 54.8], [4.42, 91.5], [0, 500], 0, 0, 0] },
  8: { 'D89-UST01': ['ust', 0.31, 0.33, [0.53, 2.25], [0.38, 3.01], [60, 400], [50, 50], 20, [78.7, 76]], 'D89-UWZ01': ['corta', 0.55, 0.75, [0.81, 4.92], [0.69, 6.58], [60, 400], [50, 50], 20, [94.2, 87.4]],
    'D89-UWZ02': ['angular', 0.74, 1.08, [0.92, 9.74], [0.75, 12.19], [50, 500], [50, 50], 20, [89.4, 83.2]], 'D89-WZ01': ['angular', 1.05, 1.41, [1.3, 15.77], [1.06, 18.94], [50, 600], [60, 60], 20, [98.6, 92.3]],
    'D89-ST01': ['estandar', 1.4, 2.11, [1.78, 23.2], [1.47, 27.86], [50, 600], [60, 60], 20, [100.6, 90.4]], 'D89-SMLZ01': ['media', 2.1, 4.0, [2.7, 45.12], [2.24, 54.19], [50, 600], [60, 60], 20, [99.3, 89.4]],
    'D88-LOZ101': ['larga', 3.0, 4.52, [2.53, 47.2], 0, [40, 500], [45, 45], 10, [88.5, 88.5]], 'D88-LOZ201': ['larga', 4.46, 6.94, [3.71, 76.7], 0, [40, 500], [45, 45], 10, [89.6, 89.6]],
    'D89-LZ01': ['larga', 3.91, 7.07, [5.11, 75.51], 0, [50, 600], [60, 60], 20, 0] },
  9: { 'D98-UST01': ['ust', 0.38, 0.38, [1.6, 5], 0, [200, 600], [50, 50], 2.5, 0], 'D99-0912': ['corta', 0.9, 1.2, [1.53, 8.04], [0.92, 13.46], [50, 500], [45, 45], 15, 0],
    'D99-1215': ['angular', 1.2, 1.56, [1.5, 10.43], [0.95, 14.47], [40, 500], [50, 50], 15, 0], 'D99-1520': ['estandar', 1.5, 2.0, [1.9, 13.1], [1.24, 21.8], [40, 500], 0, 0, 0],
    'D99-2040': ['media', 2.0, 4.0, [3.48, 25.1], [1.82, 41.8], [40, 500], 0, 0, 0], 'D99-4070': ['larga', 4.0, 7.0, [6.92, 44.8], [4.38, 74.5], [50, 500], 0, 0, 0],
    'D98-69103': ['larga', 6.9, 10.3, [12, 80], 0, [54, 360], [50, 50], 15, 0] },
  '5U': { '': ['estandar', 1.15, 1.9, [1.482, 6.292], [0.91, 20.46], [60, 250], [15, 5], 2, 0], 'K1U-0505': ['corta', 0.5, 0.5, [0.972, 1.757], [0.76, 3.26], [90, 160], [9, 5], 2, 0], 'K1U-0812': ['corta', 0.8, 1.2, [1.372, 5.5255], [1.04, 10.35], [80, 300], [15, 5], 2, 0] },
  '5K': { '': ['estandar', 1.15, 1.9, [1.515, 6.429], [1.02, 21.03], [60, 250], [22, 2], 2, 0], 'K1K-0505': ['corta', 0.5, 0.5, [0.9798, 1.803], [0.78, 3.34], [90, 160], [21, 2], 2, 0], 'K1K-0812': ['corta', 0.8, 1.2, [1.411, 5.402], [1.06, 10.64], [80, 300], [22, 2], 2, 0] }
};
// las ópticas de Vivitek por chip, para las pantallas de catálogo (la referencia de la DU9059Z lleva «D99A-»)
export const OPTICAS_VIVITEK = Object.entries(LENTES_VIVITEK).flatMap(([g, L]) => Object.entries(L).filter(([r]) => r).map(([ref, d]) => ({ ref, tipo: d[0], g, img: d[5] ? d[5][1] : 500 })));
function leerVivitek() {
  const out = [];
  VIVITEK.forEach((g) => g.m.forEach(([modelo, lumens]) => {
    const [aw, ah] = g.ar.split(':').map(Number), px = g.res.match(/(\d{3,5})\s*x\s*(\d{3,5})/).slice(1).map(Number);
    const base = { marca: 'VIVITEK', modelo, serie: g.serie, ar: aw / ah, arTxt: g.ar, resX: px[0], resY: px[1], resTxt: g.res, k4: !!g.k4, k4nativo: !!g.k4, imagen: '', chasis: g.chasis, lumens };
    Object.entries(LENTES_VIVITEK[g.g]).forEach(([ref, d]) => {
      const [tipo, a, b, foco, focoMec, img, V, H, bri] = d, v = V || g.V, optica = ref ? (g.pref ? ref.replace('D99-', g.pref) : ref) : '';
      out.push({ ...base, id: modelo + (optica ? '|' + optica : ''), optica, nombre: modelo + (optica ? ' + ' + optica : ''), trMin: a, trMax: b, ust: false, tipoOptica: tipo,
        minDiagPulg: img ? img[0] : 0, maxDiagPulg: img ? img[1] : 500, maxDiagPulgOOS: img ? img[1] : 500, foco, focoMec: focoMec || null,
        shiftV: v[0], shiftVcontra: v[1], shiftH: H || g.H, shiftSube: false, offset: g.offset || 0, bri: bri ? [bri[0] / 100, bri[1] / 100] : null });
    });
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
export function calcularPared(sup, p, { alcance, solapeMin = SOLAPE_MIN, oos = false, dist = 0, orient = 'auto', trObjetivo = 0, tiroObjetivo = 0, una = false, banda = 0, nitsMin = 0 } = {}) {
  const W = sup.ancho, H = sup.alto, nwMax = anchoMax(p, oos), nwMin = anchoMin(p), sMin = Math.max(0, solapeMin);
  const puedeV = !p.plegada && !(p.ust && (p.shiftSube || !p.optica)) && !p.offset;   // v10.89 · las plegadas y las de lente en el borde (offset), solo en horizontal
  const ors = orient === 'vertical' ? (puedeV ? ['v'] : ['h']) : orient === 'horizontal' ? ['h'] : (puedeV ? ['h', 'v'] : ['h']);
  let mejor = null, mejorF = null;
  for (const o of ors) {
    const a = o === 'v' ? 1 / p.ar : p.ar;   // ancho / alto de la imagen sobre la superficie
    for (let rows = 1; rows <= (una ? 1 : 8); rows++) for (let cols = 1; cols <= (una ? 1 : 12); cols++) {
      if (cols * rows > 40) continue;
      const kc = 1 + (cols - 1) * (1 - sMin), kr = 1 + (rows - 1) * (1 - sMin);
      /* v11.7 · sala inmersiva con proyectores de óptica fija (EB-815E, EB-805F…): además de cubrir la pared entera, se mira una sola fila que cubre todo
         el ancho y una franja de al menos «banda» metros de alto (así se montan las salas pequeñas; queda una franja sin imagen arriba y abajo) */
      for (const franja of (banda > 0 && !p.optica && rows === 1 && !(dist > 0) ? [0, 1] : [0])) {
      const ihW = W / (a * kc);
      if (franja && !(ihW >= Math.min(banda, H) - 1e-6)) continue;   // una fila que cubre el ancho (si pasa del alto, lo que sobra se enmascara)
      const ihNec = franja ? ihW : Math.max(H / kr, ihW);   // la imagen más pequeña que cubre con el solape mínimo
      let nw = o === 'v' ? ihNec : ihNec * a, tiro, fueraZoom = false, noCubre = false;
      if (dist > 0) {
        const nwLejos = dist / p.trMin, nwCerca = dist / p.trMax;   // a esa distancia, el zoom da imágenes entre nwCerca y nwLejos
        if (nw > nwLejos * 1.0001) { noCubre = true; nw = nwLejos; } else if (nw < nwCerca) nw = nwCerca;
        tiro = dist;
      } else tiro = (tiroObjetivo > 0 ? Math.min(Math.max(tiroObjetivo / nw, p.trMin), p.trMax) : trObjetivo > 0 ? Math.min(Math.max(trObjetivo, p.trMin), p.trMax) : p.trMin) * nw;
      const fSpec = !!franja && nw > nwMax * 1.0001, limite = nw > (franja ? anchoMax(p, true) : nwMax) * 1.0001, chica = nwMin > 0 && nw < nwMin * 0.9999;   // v10.58 · imagen más pequeña que la mínima de la óptica
      const ih = o === 'v' ? nw : nw / a, iw = ih * a;
      const ox = cols > 1 ? (cols * iw - W) / (cols - 1) : 0, oy = rows > 1 ? (rows * ih - H) / (rows - 1) : 0;
      const oxR = cols > 1 ? ox / iw : 0, oyR = rows > 1 ? oy / ih : 0;
      const recX = cols === 1 ? Math.max(0, iw - W) / iw : 0, recY = rows === 1 ? Math.max(0, ih - H) / ih : 0;
      // v10.62 · un solape por encima del máximo de blending pesa más que una sola imagen que sobresale (lo que sobra se enmascara): así no salen
      // rejillas de proyectores casi uno encima de otro (2×2 al 92 %, 1×8 al 114 %) cuando uno solo, con algo de recorte, ya cubre
      const exS = Math.max(0, oxR - SOLAPE_MAX) + Math.max(0, oyR - SOLAPE_MAX), exR = Math.max(0, recX - RECORTE_MAX) + Math.max(0, recY - RECORTE_MAX);
      const fuera = alcance != null && tiro > alcance + 1e-9;
      // v10.89 · rendimiento de brillo de la óptica según el zoom (Vivitek) y foco en especificación / mecánico
      const rz = tiro / nw, zw = p.trMax > p.trMin ? Math.min(1, Math.max(0, (p.trMax - rz) / (p.trMax - p.trMin))) : 1;
      const kb = p.bri ? p.bri[1] + zw * (p.bri[0] - p.bri[1]) : 1;
      const fueraFoco = !!p.foco && (tiro < p.foco[0] - 1e-6 || tiro > p.foco[1] + 1e-6), fueraMec = !!p.focoMec && (tiro < p.focoMec[0] - 1e-6 || tiro > p.focoMec[1] + 1e-6);
      const lux = p.lumens * kb / (iw * ih);
      // v10.66 · un solape por encima del máximo de blending pesa ya más que no cubrir: con una óptica fija a una distancia fija salían cuatro
      // proyectores casi uno encima de otro (2×2 al 92 %) en vez de decir que desde ahí no se llega
      // primero lo que funciona (dentro de la sala, del tamaño máximo, del zoom y de los solapes), luego con menos equipos,
      // menos imagen desperdiciada y más brillo; a igualdad, en horizontal
      const coste = (fuera ? 1e7 : 0) + (noCubre ? 4e6 : 0) + (limite || chica ? 2e6 : 0) + (fueraMec ? 4e6 : fueraFoco && !oos ? 1.5e6 : 0) + (exS > 0 ? 5e6 + exS * 1e5 : 0) + (exR > 0 ? 1e6 + exR * 1e5 : 0)
        + cols * rows * 1000 + (recX + recY) * 300 + (oxR + oyR) * 60 - Math.min(lux / Math.PI, 300) * 0.2 + (o === 'v' ? 2 : 0) + (franja ? 3000 : 0) + (fSpec ? 1500 : 0) + (nitsMin > 0 && lux / Math.PI < nitsMin ? (1 - lux / Math.PI / nitsMin) * 20000 : 0);   /* v11.11 · blending para llegar al brillo: cada proyector de más compensa si acerca al objetivo */
      const cand = { o, cols, rows, iw, ih, ox, oy, oxR, oyR, recX, recY, tiro, fuera, lux, limite, chica, noCubre, fueraZoom, coste, kb, fueraFoco, fueraMec, parcial: franja ? Math.max(0, H - ih) : 0, fSpec, fr: !!franja };
      if (franja) { if (!mejorF || coste < mejorF.coste) mejorF = cand; } else if (!mejor || coste < mejor.coste) mejor = cand;
      }
    }
  }
  /* la franja solo sustituye a una rejilla de varias filas (lo que en salas pequeñas hace chocar los cuerpos) y si monta con menos equipos */
  if (mejorF && mejor && mejor.rows > 1 && !mejorF.fuera && !mejorF.limite && !mejorF.chica && mejorF.cols * mejorF.rows < mejor.cols * mejor.rows) mejor = mejorF;
  const { o, cols, rows, iw, ih, ox, oy, oxR, oyR, recX, recY, tiro, fuera, lux, limite, chica, noCubre, kb, fueraFoco, fueraMec, parcial, fSpec, fr } = mejor, vert = o === 'v';
  const nwF = vert ? ih : iw, tMin = p.trMin * nwF, tMaxZ = p.trMax * nwF;
  const pxW = vert ? p.resY : p.resX, pxH = vert ? p.resX : p.resY;
  const centros = cols === 1 ? [0] : Array.from({ length: cols }, (_, i) => -W / 2 + iw / 2 + i * (iw - ox));
  // base de cada fila desde el pie de la superficie (una sola fila: centrada, lo que sobresale va por igual arriba y abajo)
  /* v11.7 · en la franja de una ultracorta (va en el suelo, por debajo de la imagen) la imagen arranca a 0,3 m del suelo: lo que pase del techo se enmascara */
  const base1 = fr && p.ust ? Math.max(-(ih - H) / 2, 0.3) : -(ih - H) / 2, recY1 = rows === 1 ? Math.max(recY, (base1 + ih - H) / ih) : recY;
  const filas = rows === 1 ? [base1] : Array.from({ length: rows }, (_, r) => r * (ih - oy));
  const resW = cols === 1 ? Math.round(pxW * Math.min(1, W / iw)) : cols * pxW - (cols - 1) * Math.round(pxW * oxR);
  const resH = rows === 1 ? Math.round(pxH * Math.min(1, H / ih)) : rows * pxH - (rows - 1) * Math.round(pxH * oyR);
  const tiroMax = dist > 0 ? tiro : Math.max(tiro, Math.min(tMaxZ, alcance != null ? alcance : Infinity));
  return { n: cols * rows, cols, rows, vert, imgW: iw, imgH: ih, solape: ox, solapeY: oy, solapeRel: Math.max(oxR, oyR), solapeRelX: oxR, solapeRelY: oyR, solapePx: Math.round(pxW * oxR),
    tiro, tiroMax, tMin, tMaxZ, fueraZoom: dist > 0 && (noCubre || dist < tMin - 1e-6 || dist > tMaxZ + 1e-6), noCubre, ratio: tiro / nwF, fuera, limite, chica, recorte: recY1, recorteX: recX,
    centros, filas, anchoTot: cols === 1 ? iw : cols * iw - (cols - 1) * ox, altoTot: rows === 1 ? ih : rows * ih - (rows - 1) * oy, resW, resH, lux, nits: lux / Math.PI, rendBrillo: kb, fueraFoco, fueraMec, parcial: parcial || 0, fueraSpec: !!fSpec };
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
// v10.89 · la lente se coloca dentro del desplazamiento real de la óptica, que puede ser asimétrico (Vivitek: más hacia el lado normal) y llevar
// «offset» (series 5000 de Vivitek: la lente en el borde de la imagen). Lado normal: colgado, la lente por encima del centro de la imagen; sobremesa,
// por debajo. Las ultracortas plegadas y las de óptica fija ultracorta no desplazan: la imagen va a una separación fija del proyector.
export const rangoLente = (prod, vert, apoyo) => {
  const hacia = ((vert ? prod.shiftH : prod.shiftV) || 0) / 100, contra = ((vert ? prod.shiftH : (prod.shiftVcontra != null ? prod.shiftVcontra : prod.shiftV)) || 0) / 100, off = vert ? 0 : (prod.offset || 0);
  return apoyo ? [-(off + hacia), -(off - contra)] : [off - contra, off + hacia];
};
export function colocarPared(s, p, prod, { alto, sala, techo: techoS, montaje = 'auto', altura = 0 }) {
  const altoPared = sala ? alto : s.elev + s.alto + 0.2;
  const altoCh = p.vert ? prod.chasis[0] : prod.chasis[2], paso = altoCh + HOLGURA.v;
  const yTop = s.elev + p.filas[p.rows - 1] + p.imgH;   // borde superior de la imagen conjunta
  const hayTecho = sala || (techoS > 0 && techoS >= yTop);
  const techo = sala ? alto - 0.05 - altoCh / 2 : (hayTecho ? techoS - 0.05 - altoCh / 2 : Infinity);
  const conShift = !prod.plegada && ((p.vert ? prod.shiftH : prod.shiftV) > 0);
  const rC = rangoLente(prod, p.vert, false), rA = rangoLente(prod, p.vert, true);
  const suelo = 0.8 + altoCh / 2;                                                  // sobremesa
  const sep = prod.plegada && prod.sepUST ? prod.sepUST(Math.hypot(p.imgW, p.imgH) / 0.0254) : 0;
  const yHung = Math.min(techo, Math.max(yTop + 0.15, (sala ? alto : altoPared + 0.6) - 0.45));
  const zL = Math.max(0.15, p.tiro), zMax = Math.max(zL, p.tiroMax || zL), out = [];
  /* v11.9 · una altura del proyector dicha a mano manda también en AUTO (antes solo se usaba eligiendo colgado o apoyado): por encima del centro de la imagen, colgado a esa altura; por debajo, apoyado en ella */
  if (montaje === 'auto' && altura > 0 && !prod.plegada) montaje = altura >= s.elev + p.filas[0] + p.imgH / 2 ? 'colgado' : 'apoyado';
  for (let r = 0; r < p.rows; r++) {
    const y0 = s.elev + p.filas[r], y1 = y0 + p.imgH, yC = (y0 + y1) / 2;
    let yProy, apoyo = false;
    if (prod.plegada) {   // la imagen manda: colgado, el anclaje queda «sep» por encima de la imagen; sobremesa, el pie «sep» por debajo
      const colg = montaje === 'colgado' || (montaje === 'auto' && hayTecho && y1 + sep + altoCh + 0.05 <= (sala ? alto : techoS) + 1e-6);
      if (colg) yProy = y1 + sep - 0.05 - altoCh / 2; else { yProy = y0 - sep + altoCh / 2; apoyo = true; }
    } else if (montaje === 'apoyado') {
      const yC0 = s.elev + p.filas[0] + p.imgH / 2, base = altura > 0 ? altura : (conShift ? Math.max(0.8, yC0 + rA[0] * p.imgH - altoCh / 2) : 0.8);
      yProy = base + altoCh / 2 + r * paso; apoyo = true;
    }
    else if (montaje === 'colgado') { yProy = (altura > 0 ? altura - 0.05 - altoCh / 2 : (hayTecho ? techo : yTop + 0.15 + altoCh / 2)) - (p.rows - 1 - r) * paso;
      /* v10.98 · colgado sin altura fijada: baja con su soporte hasta donde llega el desplazamiento de la lente, igual que hace AUTO (antes iba pegado al techo y salía rojo) */
      if (!(altura > 0) && conShift) yProy = Math.min(hayTecho ? techo : Infinity, Math.max(yC + rC[0] * p.imgH, Math.min(yC + rC[1] * p.imgH, yProy))); }
    else if (hayTecho) { yProy = yHung - (p.rows - 1 - r) * paso; if (conShift) yProy = Math.min(techo, Math.max(yC + rC[0] * p.imgH, Math.min(yC + rC[1] * p.imgH, yProy))); }
    else if (conShift) { yProy = Math.max(suelo, yC + rA[0] * p.imgH); apoyo = true; }
    else yProy = yHung - (p.rows - 1 - r) * paso;
    p.centros.forEach(cx => out.push({
      lente: aMundo(s, cx, yProy, zL), rot: s.rot, prod, vert: !!p.vert, apoyo, ancho: p.imgW, zMax, nrm: { x: Math.sin(s.rot), z: Math.cos(s.rot) },
      esquinas: [[cx - p.imgW / 2, y1], [cx + p.imgW / 2, y1], [cx + p.imgW / 2, y0], [cx - p.imgW / 2, y0]].map(([a, b]) => aMundo(s, a, b, 0.01)),
      yProy, y0, y1, zL, filaR: r, sep
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
    const yC = (h.y0 + h.y1) / 2, imgH = h.y1 - h.y0, rl = !h.suelo && h.prod && !h.prod.plegada && h.prod.shiftV && imgH > 0 ? rangoLente(h.prod, !!h.vert, !!h.apoyo) : null;
    const cand = [];
    dzs.forEach(dz => dys.forEach(dy => dxs.forEach(dx => { if (dz || dy || dx) cand.push({ dz, dy, dx, c: dz + Math.abs(dy) * 1.5 + Math.abs(dx) * 1.2 }); })));
    cand.sort((a, b) => a.c - b.c);
    const poner = (c) => { const n = h.nrm || { x: 0, z: 0 };
      h.lente = { x: base.x + n.x * c.dz + c.dx * Math.cos(h.rot), y: base.y + c.dy, z: base.z + n.z * c.dz - c.dx * Math.sin(h.rot) }; h.zL = zL0 + c.dz; };
    let ok = null, sinChoque = null;
    for (const c of cand) {
      const y = base.y + c.dy; if (y > techo + 1e-6 || y < suelo - 1e-6) continue;
      if (rl && c.dy && (y < yC + rl[0] * imgH - 1e-3 || y > yC + rl[1] * imgH + 1e-3)) continue;   /* v10.98 · al separar proyectores no se sale del desplazamiento que da la lente */
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
