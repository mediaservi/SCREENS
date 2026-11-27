// SCREENS v11.54 · el SITIO de la petición, antes que la pantalla.
// Lee en el texto ya normalizado (minúsculas, sin acentos, decimales con punto y medidas en metros) lo que describe el sitio y no la superficie:
//  · la sala de uso cotidiano y sus medidas («sala de reuniones de 6 x 4», «aula de 8 x 6 m», «7 x 4.5 m boardroom»),
//  · la luz que entra («con ventanas», «luz natural», «le da el sol», «luz ambiente 0», «persianas»),
//  · dónde se sienta la gente («people sit 3 m away», «la gente se sienta a 3 m»),
//  · el fondo de la sala dicho suelto («room depth 6 m», «fondo de la sala 6 m»).
// Lo usan los dos intérpretes (screens/peticion.js y vista/una-led.js). Las reglas salen de BRIAN (nl.*), con su valor por defecto aquí.
// GPL-3.0 · mediaservi.com
export const SITIO_DEF = {
  'nl.sala.distPorAlto': 6,        // público más lejano / alto de imagen (regla 4-6-8: 6 = visión general)
  'nl.sala.margenFondo': 0.6,      // de la pared del fondo al espectador más lejano (m)
  'nl.sala.anchoMaxPared': 0.8,    // la imagen ocupa como mucho esta parte de la pared
  'nl.sala.techo': 2.8,            // techo supuesto en una sala de uso cotidiano sin techo dicho (m)
  'nl.sala.bordeInferior': 0.9,    // borde inferior de la imagen sobre el suelo en una sala con mesas (m)
  'nl.sala.margenTecho': 0.15,     // del borde superior de la imagen al techo (m)
  'nl.sala.distMaxHolgura': 0.3,   // el proyector cabe en la sala: fondo − holgura (m)
  'nl.luz.ventanas': 300,          // sala con ventanas o luz natural sin controlar (lx sobre la pantalla)
  'nl.luz.sol': 500,               // con sol que entra en la sala (lx)
  'nl.medida.redondeo': 0.05       // las medidas deducidas se redondean a este paso (m)
};
const P = (br, k) => (br && br[k] != null && isFinite(+br[k]) ? +br[k] : SITIO_DEF[k]);

// salas de uso cotidiano: la medida pegada a ellas es la de la sala (no la de la imagen). Pabellón, nave, espacio o «sala» sola siguen la regla v11.10.
export const USOS = [
  ['reunion', /sala de (?:reuniones|reunions|juntas|juntes|conferencias|conferencies|videoconferencia)|sala de reunio\b|meeting ?room|conference ?room|board ?room|huddle room|\bdespacho\b|\bdespatx\b|\boficina\b|\boffice\b/],
  ['aula', /\baula\b|\bclase\b|\bclasse\b|class ?room|sala de (?:formacion|formacio)|training room|\bseminario\b|\bseminari\b/],
  ['salon', /sala de estar|sala d.estar|living ?room|salon de casa|\bsalo de casa\b/]
];
const NUM = '(\\d+(?:\\.\\d+)?)', X = '\\s*(?:x|×|\\*|por|per|by)\\s*', U = '\\s*(?:m|mts|metros|metres|meters)?';
const MED = NUM + U + X + NUM + U + '(?:' + X + NUM + U + ')?';

export function leeSitio(t) {
  const r = { uso: null, sala: null, tRest: t, lux: null, luzMotivo: null, sol: '', pub: null, fondo: null };
  for (const [k, re] of USOS) if (re.test(t)) { r.uso = k; break; }
  if (r.uso) {
    const w = USOS.find((u) => u[0] === r.uso)[1].source;
    // «sala de reuniones de 6 x 4 (x 3)», «aula de unos 8 x 6 m», «despacho 4x3»
    const a = new RegExp('(?:' + w + ')\\s*(?:de |d\'|of |)\\s*(?:unos |uns |about |aprox\\.? |)' + MED).exec(t);
    // «a 7 x 4.5 m boardroom», «8 x 6 m classroom»
    const b = !a && new RegExp(MED + '\\s*(?:' + w + ')').exec(t);
    const q = a || b;
    if (q) { const k = q.length, v = [q[k - 3], q[k - 2], q[k - 1]].map((x) => (x == null ? NaN : parseFloat(x)));
      r.sala = isNaN(v[2]) ? [v[0], v[1]] : v; r.tRest = t.slice(0, q.index) + ' ' + (a ? t.slice(q.index, q.index + q[0].length).replace(new RegExp(MED), ' ') : ' ') + ' ' + t.slice(q.index + q[0].length); }
  }
  // fondo de la sala dicho suelto
  const f = t.match(/(?:room depth|depth of the room|fondo de (?:la )?sala|profundidad de (?:la )?sala|fons de (?:la )?sala|room length)\s*(?:of |de |:)?\s*(\d+(?:\.\d+)?)/);
  if (f) r.fondo = parseFloat(f[1]);
  // dónde se sienta la gente
  const p = t.match(/(?:people|audience|viewers?)\s*(?:sit|sits|seated|are|is)?\s*(?:about |at |around )?(\d+(?:\.\d+)?)\s*(?:m|metres|meters)\s*(?:away|from)/)
    || t.match(/(?:la gente|el publico|los asistentes|la gent|el public)\s*(?:se sienta|se sientan|esta|estara|seu|seuen|es)\s*(?:a|at)\s*(\d+(?:\.\d+)?)\s*(?:m|metros|metres)/);
  if (p) r.pub = parseFloat(p[1]);
  // luz: lo explícito manda («luz ambiente 0», «oscuridad total»); luego el sol y las ventanas; con persianas o estores no se sube
  const lz = t.match(/(?:luz ambiente|luz ambiental|ambient light|llum ambient)\s*(?:de |of |:)?\s*(\d+(?:\.\d+)?)(?!\s*(?:m\b|x))/);
  const control = /persiana|estor|cortina|blackout|opac|black-?out|blinds|curtains|cortines/.test(t);
  if (lz) { r.lux = parseFloat(lz[1]); r.luzMotivo = 'dicha'; }
  else if (/oscuridad total|totalmente a oscuras|completamente a oscuras|sin luz ambiente|pitch black|completely dark|foscor total/.test(t)) { r.lux = 0; r.luzMotivo = 'oscuridad'; }
  else if (!control && /\bsol\b|\bsun\b|soleado|sunny|asolellat/.test(t) && !/sol indirecto|sol indirecte|indirect sun|sin sol|sense sol|no sun|sombra|ombra|\bshade/.test(t)) { r.lux = 'sol'; r.luzMotivo = 'sol'; }
  else if (!control && /ventana|ventanal|cristalera|acristalad|luz natural|luz de dia|luz del dia|llum natural|llum de dia|finestr|\bwindows?\b|daylight|natural light|vidriera/.test(t)) { r.lux = 'ventanas'; r.luzMotivo = 'ventanas'; }
  // sol para LED (escaparate, exterior)
  if (/sol indirecto|sol indirecte|indirect sun|sombra|ombra|\bshade/.test(t)) r.sol = 'indirecto';
  else if (/sol directo|sol directe|pleno sol|ple sol|direct sun|(?:le |li )?(?:da|toca|entra|pega) (?:el )?sol|sol (?:por|de|a) la (?:tarde|manana)|sol de tarda|sun hits|afternoon sun|morning sun|sunny/.test(t)) r.sol = 'directo';
  return r;
}
export const luxDe = (r, br) => (r.lux === 'sol' ? P(br, 'nl.luz.sol') : r.lux === 'ventanas' ? P(br, 'nl.luz.ventanas') : r.lux);

// La pantalla que cabe y se lee bien en una sala de uso cotidiano (supuesto que se enseña siempre al asesor):
// la imagen va en la pared corta y el público mira a lo largo; alto = público más lejano / distPorAlto; 16:9; sin pasar de la pared ni del techo.
export function pantallaDeSala(sala, techo, br, pubDicho) {
  const fondo = Math.max(sala[0], sala[1]), pared = Math.min(sala[0], sala[1]), tch = techo > 0 ? techo : sala[2] > 0 ? sala[2] : P(br, 'nl.sala.techo');
  const lejos = Math.max(1, fondo - P(br, 'nl.sala.margenFondo')), pub = pubDicho > 0 ? pubDicho : lejos;   // el tamaño lo manda el espectador más lejano
  let h = lejos / P(br, 'nl.sala.distPorAlto'), w = h * 16 / 9;
  const wMax = pared * P(br, 'nl.sala.anchoMaxPared'), hMax = Math.max(0.5, tch - P(br, 'nl.sala.bordeInferior') - P(br, 'nl.sala.margenTecho'));
  if (w > wMax) { w = wMax; h = w * 9 / 16; }
  if (h > hMax) { h = hMax; w = h * 16 / 9; }
  const paso = P(br, 'nl.medida.redondeo'); w = Math.max(paso, Math.round(w / paso) * paso); h = Math.round(w * 9 / 16 * 1000) / 1000;
  return { w: +w.toFixed(3), h, pub: +pub.toFixed(2), lejos: +lejos.toFixed(2), pared, fondo, techo: tch, distMax: +(fondo - P(br, 'nl.sala.distMaxHolgura')).toFixed(2), limitado: w >= wMax - 1e-6 ? 'pared' : h >= hMax - 1e-6 ? 'techo' : '' };
}
