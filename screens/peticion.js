// SCREENS · petición en lenguaje natural (es / en / ca) para salas, varias pantallas y proyección.
// Devuelve los cambios a aplicar en el estado y la lista de lo que se ha entendido ({ k, n, v }: la consola lo rotula en su idioma).
// Reglas locales, sin servicios externos.
import { leeSitio, luxDe, pantallaDeSala } from './sitio.js';   /* v11.54 · el sitio (sala, luz, público) antes que la pantalla */
const NUM = { un: 1, una: 1, uno: 1, one: 1, dos: 2, two: 2, tres: 3, three: 3, cuatro: 4, four: 4, quatre: 4, cinco: 5, five: 5, cinc: 5, seis: 6, six: 6, sis: 6, siete: 7, seven: 7, set: 7, ocho: 8, eight: 8, vuit: 8 };
const n = (v) => (v == null ? NaN : NUM[v] != null ? NUM[v] : parseFloat(String(v).replace(',', '.')));

export function interpretar(texto, tecCtx, br) {
  let t = ' ' + String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/(\d),(\d)/g, '$1.$2') + ' ';
  /* v10.95 · «8 × 8 cabinets» y «3840 × 2160 píxeles» no son medidas en metros: se apartan antes de leer las medidas */
  t = t.replace(/\d{1,3}\s*(?:x|×|\*|por|by|per)\s*\d{1,3}\s*(?:cabinets?|cabs?|modulos?|moduls?|modules?|paneles|panels|plafons|tiles|losetas)(?![a-z])/g, ' ').replace(/\d{3,5}\s*(?:x|×|\*|por|by|per)\s*\d{3,5}\s*(?:px|pix|pixeles|pixels?|puntos|punts)(?![a-z])/g, ' ');
  /* v11.1 · una resolución de vídeo («WUXGA (1920 x 1200)», «resolución 3840 x 2160») no es la medida de la pantalla */
  t = t.replace(/((?:resolucion|resolution|resolucio|wuxga|wxga|sxga|\bxga|full ?hd|\bfhd|\b4k|\buhd|nativa|native)[^\d.]{0,30})\d{3,5}\s*(?:x|×|\*|por|by|per)\s*\d{3,5}(?!\s*(?:mm|cm|m\b)|\.\d)/g, '$1 ');
  /* v11.1 · «300 cm de ancho», «3000 mm de base»: a metros */
  t = t.replace(/(\d+(?:\.\d+)?)\s*(mm|cm)(?=\s*(?:de (?:ancho|alto|altura|base|amplada|ample|alcada|alt)\b|d'(?:ample|alt)|wide|high|tall))/g, (todo, a, u) => +(parseFloat(a) / (u === 'mm' ? 1000 : 100)).toFixed(4) + ' m');
  /* v10.95 · medidas en milímetros o centímetros («4800 × 2700 mm», «480 x 270 cm», o sin unidad a partir de 1000): se pasan a metros, que es en lo que se leen */
  t = t.replace(/(\d+(?:\.\d+)?)\s*(mm|cm)?\s*(x|×|\*|por|by|per)\s*(\d+(?:\.\d+)?)(?:\s*(mm|cm)?\s*(x|×|\*|por|by|per)\s*(\d+(?:\.\d+)?))?\s*(mm|cm)?(?![a-z0-9.])/g, (todo, a, u1, x1, b, u2, x2, c3, u3) => {
    const nums = [a, b, c3].filter((q) => q != null).map(parseFloat); let u = u3 || u2 || u1; if (!u && Math.max(...nums) >= 1000) u = 'mm'; if (!u) return todo;
    const f = u === 'mm' ? 1000 : 100; return nums.map((q) => +(q / f).toFixed(4)).join(' x ') + ' m '; });
  const c = { esp: {}, sueltas: {}, paredes: null, led: {}, proy: {}, elec: {} }, vistos = [];
  /* v11.54 · la medida de una sala de uso cotidiano («sala de reuniones de 6 x 4», «aula de 8 x 6») es la de la sala: se aparta antes de leer las medidas */
  const SIT = leeSitio(t); if (SIT.sala) t = SIT.tRest;
  let cantidad = null, tecnologia = null;
  // tecnología
  if (/proyecc|proyector|proyectar|projecc|projector|projection|videoproyec|mapping/.test(t)) { tecnologia = 'proy'; vistos.push({ k: 'proy' }); }
  else if (/\bled\b|cabinet|pantalla led|ecran led|video ?wall|escaparate|aparador|shop ?window/.test(t)) { tecnologia = 'led'; vistos.push({ k: 'led' }); }
  const tecP = tecnologia || (tecCtx === 'proy' ? 'proy' : null);   // v10.89 · la consola ya en proyección cuenta como proyección
  // sala inmersiva o pantallas
  let nPant = t.match(/\b(\d+|dos|tres|cuatro|cinco|seis|siete|ocho|two|three|four|five|six|seven|eight|quatre|cinc|sis|set|vuit)\s+(?:led\s+)?(pantallas|pantalles|screens|lienzos)\b/);   // «3 pantallas», «3 LED screens»
  // v10.48 · «sala» sola ya no es una sala inmersiva: «sala de reuniones», «meeting room», «salón de casa» solo dan la luz de ese sitio
  const salaComun = /sala de (?:reuniones|reunions|juntas|conferencias|conferencies|formacion|formacio|espera|estar)|sala d.estar|meeting room|conference room|board ?room|living room|\bsalon\b(?! de actos)|\bsalo\b(?! d.actes)/;
  if (/inmersiv|immersiv|\bcubo\b|\bcube\b|paredes|parets|walls/.test(t) || (/\bsala\b|\broom\b/.test(t) && !salaComun.test(t) && /\d+(?:\.\d+)?\s*(?:m|mts|metros|metres)?\s*(?:x|×|\*|por|per|by)\s*\d+(?:\.\d+)?\s*(?:m|mts|metros|metres)?\s*(?:x|×|\*|por|per|by)\s*\d/.test(t))) { cantidad = 'varias'; c.esp.tipo = 'sala'; vistos.push({ k: 'sala' }); }
  else if (!nPant && /\bcentral\b|\bprincipal\b/.test(t) && /\blaterales\b|\blaterals\b|\bsides?\b/.test(t) && /(\d+(?:[.,]\d+)?)\s*(?:m|mts|metros)?\s*(?:x|×|\*|por|by)[^]*?(\d+(?:[.,]\d+)?)\s*(?:m|mts|metros)?\s*(?:x|×|\*|por|by)/.test(t)) { nPant = [0, '3']; cantidad = 'varias'; c.esp.tipo = 'sueltas'; c.sueltas.n = 3; vistos.push({ k: 'pant', n: 3 }); }   // v10.89 · «una central y dos laterales» son 3 pantallas aunque no diga «pantallas»
  else if (nPant && n(nPant[1]) > 1) { cantidad = 'varias'; c.esp.tipo = 'sueltas'; c.sueltas.n = Math.min(8, n(nPant[1])); vistos.push({ k: 'pant', n: c.sueltas.n }); }
  else if (/\buna (sola )?pantalla|\bun(a)? solo|\b1 pantalla|\ba screen\b|\bone screen\b|una pantalla/.test(t)) { cantidad = 'una'; vistos.push({ k: 'una' }); }
  if (!cantidad && (SIT.sala || /video ?wall|pizarra|pissarra|whiteboard|escaparate|aparador|shop ?window|\btotem\b|\blona\b/.test(t))) { cantidad = 'una'; vistos.push({ k: 'una' }); }   // v11.54 · una superficie aunque no diga «pantalla»
  if (!cantidad && /\bpantalla\b|\bscreen\b|\bpantallla\b|\bpared\b|\bparet\b|\bwall\b/.test(t)) { cantidad = 'una'; vistos.push({ k: 'una' }); }   // v10.48 · «una pared de 4 x 2,5» es una sola superficie
  // una fachada (mapping) es una sola superficie
  if (!cantidad && /fachada|facade|facana|\bedificio\b|\bedifici\b|building/.test(t)) { cantidad = 'una'; vistos.push({ k: 'una' }); }
  // medidas: A × B (× C)
  // v10.89 · «A m de ancho por B (m) de alto» y «A metros de ancho» (como en la portada)
  const tA = t.replace(/(\d+(?:\.\d+)?)\s*(?:m|mts|metros|metres)?\s*de (?:ancho|amplada|ample|base)\s*(?:por|per|x|×|y|i)\s*(\d+(?:\.\d+)?)\s*(?:m|mts|metros|metres)?\s*(?:de (?:alto|altura|alcada|alt))?/g, '$1 x $2 ')
    .replace(/(\d+(?:\.\d+)?)\s*(?:m|mts|metros|metres)?\s*wide\s*(?:by|x|and)\s*(\d+(?:\.\d+)?)\s*(?:m|metres|meters)?\s*(?:high|tall)?/g, '$1 x $2 ');
  const MEDG = /(\d+(?:\.\d+)?)\s*(?:m|mts|metros|metres)?\s*(?:x|×|\*|por|per|by)\s*(\d+(?:\.\d+)?)\s*(?:m|mts|metros|metres)?(?:\s*(?:x|×|\*|por|per|by)\s*(\d+(?:\.\d+)?))?/g;
  const todas = []; { let q; while ((q = MEDG.exec(tA))) todas.push(Object.assign(q, { antes: tA.slice(Math.max(0, q.index - 28), q.index) })); }
  // v10.89 · en proyección, la medida de la «sala / salón / pabellón» es de la sala, no de la pantalla (sin tercera medida no es una sala inmersiva)
  const deSala = (x) => /\b(?:sala|room|salon|salo|espacio|espai|pabellon|pavello|nave|museo|museu)\b[^\d]*$/.test(x.antes) && !/pantalla|imagen|imatge|image|screen|pared|paret|wall|lienzo/.test(x.antes.replace(/^.*\b(?:sala|room|salon|salo|espacio|espai|pabellon|pavello|nave|museo|museu)\b/, ''));
  let m = todas[0] || null, salaMed = null;
  if (tecP === 'proy' && c.esp.tipo !== 'sala' && todas.length) {
    const p = todas.find(x => !deSala(x)); salaMed = p ? (todas.find(x => deSala(x)) || null) : null;   /* v11.10 · si la única medida va con «pabellón», «sala»… es la de la imagen (decidido por Josep, 24-11-2026) */
    if (!p && todas.length) { m = todas[0]; }
    if (p) m = p;
    if (salaMed) { const a = n(salaMed[1]), b = n(salaMed[2]), h = salaMed[3] != null ? n(salaMed[3]) : NaN; c.sueltas.salaAncho = a; c.sueltas.salaFondo = b; if (!isNaN(h)) c.sueltas.techo = h; vistos.push({ k: 'salaMed', v: isNaN(h) ? [a, b] : [a, b, h] }); }
  }
  if (!m && tecP === 'proy') {   // «A m de ancho» sola
    const w1 = t.match(/(\d+(?:\.\d+)?)\s*(?:m|mts|metros|metres)\s*de (?:ancho|amplada|ample|base)|(\d+(?:\.\d+)?)\s*(?:m|metres|meters)\s*wide|(?:pantalla|pantallla|screen|lienzo|imagen|imatge|image)\s*(?:de |of )?(\d+(?:\.\d+)?)\s*(?:m|mts|metros|metres|meters)\b(?!\s*(?:de alto|de altura|d'alt|d'alcada|high|tall))/);
    if (w1) { const a = n(w1[1] || w1[2] || w1[3]); c.sueltas.ancho = a; c.sueltas.alto = Math.round(a / (16 / 9) * 1000) / 1000; c.sueltas.formato = '16:9'; c.sueltas.medPor = 'ancho'; c.sueltas.medVal = a; vistos.push({ k: 'medida', v: [a, c.sueltas.alto] }); }
  }
  // v10.89 · pulgadas: la diagonal de la pantalla (16:9 si no se dice otra cosa)
  const pul = t.match(/(\d+(?:\.\d+)?)\s*(?:″|"|''|pulgadas|pulgada|inches|inch|polzades|polzada)/);
  if (pul && !m) { const d = n(pul[1]), r = 16 / 9, w = d * 0.0254 * r / Math.sqrt(1 + r * r); c.sueltas.ancho = Math.round(w * 1000) / 1000; c.sueltas.alto = Math.round(w / r * 1000) / 1000; c.sueltas.formato = '16:9'; c.sueltas.medPor = 'diag'; c.sueltas.medVal = d; if (!cantidad) cantidad = 'una'; vistos.push({ k: 'pulgadas', v: d }); }
  /* v11.54 · proyección cenital sobre el suelo: una sala sin paredes, solo suelo */
  const cenital = tecP === 'proy' && m && m[3] == null && /cenital|(?:proyeccion|proyectar|projection|projeccio|projectar) (?:sobre|en|al|on|onto) (?:el |the )?(?:suelo|floor|terra)|sobre el suelo|sobre el terra|floor projection/.test(t);
  if (cenital) { c.esp.tipo = 'sala'; cantidad = 'varias'; c.paredes = { frontal: false, izquierda: false, derecha: false, trasera: false, suelo: true }; }
  /* v11.54 · dos medidas sin tercera y sin sala: una sola superficie (antes se quedaba la sala por defecto) */
  if (!cantidad && m && m[3] == null && c.esp.tipo !== 'sala') { cantidad = 'una'; vistos.push({ k: 'una' }); }
  if (m) {
    const a = n(m[1]), b = n(m[2]), h = m[3] != null ? n(m[3]) : NaN;
    if (c.esp.tipo === 'sala' || (cantidad !== 'una' && !nPant && !isNaN(h))) { c.esp.tipo = 'sala'; cantidad = 'varias'; c.esp.ancho = a; c.esp.fondo = b; if (!isNaN(h)) c.esp.alto = h; vistos.push({ k: 'medida', v: isNaN(h) ? [a, b] : [a, b, h] }); }
    else { c.sueltas.ancho = a; c.sueltas.alto = b; c.sueltas.formato = Math.abs(a / b - 16 / 9) < 0.003 ? '16:9' : 'libre'; c.sueltas.medPor = 'ancho'; c.sueltas.medVal = a; vistos.push({ k: 'medida', v: [a, b] }); }   // v11.54 · la medida dicha no se fuerza a 16:9
  }
  // v7.9 · varias pantallas de medidas distintas (auditorio): «una central de 6,6 x 3,7 y dos laterales (verticales) de 4,2 x 2,36»
  if (c.esp.tipo === 'sueltas') {
    const MED = /(\d+(?:\.\d+)?)\s*(?:m|mts|metros|metres)?\s*(?:x|×|\*|por|per|by)\s*(\d+(?:\.\d+)?)/g, meds = []; let q, fin = 0;
    while ((q = MED.exec(t))) { meds.push({ a: n(q[1]), b: n(q[2]), antes: t.slice(fin, q.index), despues: t.slice(q.index + q[0].length, q.index + q[0].length + 30) }); fin = q.index + q[0].length; }
    if (meds.length >= 2) {
      const CEN = /central|principal|centro|centre|center|\bmain\b|mas grande|mayor|\bgran\b|grande/, LAT = /lateral|\bside|a los lados|als costats|costat|a cada lado/;
      const cuenta = (x) => { const k = x.antes.match(/^.*\b(una|un|uno|one|1|dos|two|2|tres|three|3|quatre|cuatro|four|4)\b[^\d]*$/); return k ? n(k[1]) : 0; };   // la última cantidad antes de la medida
      let cen = meds.find(x => CEN.test(x.antes)), lat = meds.find(x => x !== cen && LAT.test(x.antes));
      if (!cen && !lat) { cen = meds.find(x => cuenta(x) === 1); lat = meds.find(x => x !== cen && cuenta(x) > 1); }
      if (!cen && lat) cen = meds.find(x => x !== lat);
      if (cen && !lat) lat = meds.find(x => x !== cen);
      if (cen && lat) {
        // «vertical»: la pantalla va en vertical (más alta que ancha)
        // v10.89 · solo la cláusula de esa medida: lo que va delante desde la última coma o «y», y lo que sigue hasta la siguiente
        const med = (x) => { const ant = x.antes.split(/,|;|\by\b|\band\b|\bi\b/).pop(), des = x.despues.split(/,|;|\by\b|\band\b|\bi\b/)[0]; return /vertical|portrait/.test(ant + ' ' + des) && x.a > x.b ? [x.b, x.a] : [x.a, x.b]; };
        [c.sueltas.cAncho, c.sueltas.cAlto] = med(cen); [c.sueltas.ancho, c.sueltas.alto] = med(lat); c.sueltas.central = true;
        const i = vistos.findIndex(x => x.k === 'medida'); vistos.splice(i < 0 ? vistos.length : i, i < 0 ? 0 : 1, { k: 'central', v: [c.sueltas.cAncho, c.sueltas.cAlto] }, { k: 'laterales', v: [c.sueltas.ancho, c.sueltas.alto] });
      }
    } else if (meds.length === 1) c.sueltas.central = false;
  }
  const alto = t.match(/(\d+(?:\.\d+)?)\s*(?:m|metros|metres)?\s*de (?:alto|altura|alcada)|(?:alto|altura|height|alcada)\s*(?:de\s*)?(\d+(?:\.\d+)?)/);
  if (alto && c.esp.tipo === 'sala' && c.esp.alto == null) { c.esp.alto = n(alto[1] || alto[2]); vistos.push({ k: 'alto', v: c.esp.alto }); }
  // paredes
  const nPar = t.match(/\b(\d|dos|tres|cuatro|two|three|four|quatre)\s+(paredes|parets|walls)\b/);
  if (nPar) { const k = n(nPar[1]); c.paredes = { frontal: true, izquierda: k >= 3, derecha: k >= 2, trasera: k >= 4 }; vistos.push({ k: 'paredes', n: k }); }
  const nom = { frontal: /frontal|front\b|del fondo/, izquierda: /izquierda|esquerra|\bleft\b/, derecha: /derecha|dreta|\bright\b/, trasera: /trasera|posterior|\bback\b|darrera/ };
  const citadas = Object.keys(nom).filter(k => nom[k].test(t));
  if (!nPar && citadas.length >= 2) { c.paredes = { frontal: false, izquierda: false, derecha: false, trasera: false }; citadas.forEach(k => { c.paredes[k] = true; }); vistos.push({ k: 'paredes', n: citadas.length }); }
  if (/\bsuelo\b|\bterra\b|\bfloor\b/.test(t)) { c.paredes = c.paredes || {}; c.paredes.suelo = true; vistos.push({ k: 'suelo' }); }
  // disposición de pantallas sueltas
  if (/en arco|curva|curved|\barc\b|en arc/.test(t)) { c.sueltas.disp = 'arco'; vistos.push({ k: 'arco' }); }
  else if (/en linea|seguidas|in a row|en fila|en linia/.test(t)) { c.sueltas.disp = 'linea'; vistos.push({ k: 'linea' }); }
  // público, luz, ganancia, techo
  // v10.89 · la distancia del público va pegada a la palabra («público a 8 m», «a 8 m del público», «distancia de visión 6 m»), nunca el primer «a N m» de la frase
  const dist = t.match(/(?:publico|public|audiencia|audience|espectadores|espectadors|viewers?)\s*(?:esta |estara |sentado |situado )?(?:a|at|de|desde)?\s*(\d+(?:\.\d+)?)\s*(?:m|metros|metres)?\b/)
    || t.match(/(?:\ba|\bat)\s*(\d+(?:\.\d+)?)\s*(?:m|metros|metres)\b\s*(?:del publico|de distancia de vision|del public|from the audience|viewing distance)/)
    || t.match(/(?:distancia de vision|distancia de visio|viewing distance|vista a|ver a|veure a)\s*(?:de\s*)?(\d+(?:\.\d+)?)/);
  if (dist) { c.sueltas.dist = n(dist[1]); vistos.push({ k: 'publico', v: c.sueltas.dist }); }
  const lx = t.match(/(\d+(?:\.\d+)?)\s*(?:lx|lux)\b/); if (lx) { c.proy.lux = n(lx[1]); vistos.push({ k: 'lux', v: c.proy.lux }); }
  /* v11.2 · «con mucha luz», «sala muy luminosa», «bright room», «molta llum»: 300 lx */
  if (!lx && /mucha luz|muy luminos|muy iluminad|plena luz|luz ambiente alta|bright (?:room|space|light)|lots of light|high ambient|molta llum|molt lluminos/.test(t)) { c.proy.lux = 300; vistos.push({ k: 'lux', v: 300 }); }
  // v10.62 · los escalones de luz: Theatre room 14, Living 70, Meeting room 140, Class room 210
  if (!lx && /a oscuras|oscura|dark room|fosca|a les fosques|\bcine\b|cinema|theatre room|home theat/.test(t)) { c.proy.lux = 14; vistos.push({ k: 'lux', v: 14 }); }
  else if (!lx && /\baula\b|classroom|class room/.test(t)) { c.proy.lux = 210; vistos.push({ k: 'lux', v: 210 }); }
  else if (!lx && /sala de (?:reuniones|reunions|juntas|conferencias|conferencies|formacion|formacio)|meeting room|conference room|board ?room|oficina|office/.test(t)) { c.proy.lux = 140; vistos.push({ k: 'lux', v: 140 }); }   // v10.48 · la luz del sitio
  else if (!lx && /sala de estar|sala d.estar|living room|\bsalon\b(?! de actos)|\bsalo\b(?! d.actes)|de casa|home cinema|cine en casa/.test(t)) { c.proy.lux = 70; vistos.push({ k: 'lux', v: 70 }); }
  if (!lx && c.proy.lux == null && /salon de (?:bodas|banquetes|celebraciones|eventos)|banquet|boda|wedding|casament/.test(t)) { c.proy.lux = 140; vistos.push({ k: 'lux', v: 140 }); }
  /* v11.54 · la luz del sitio: «luz ambiente 0» u «oscuridad total» mandan; ventanas o sol suben la del uso (nunca la bajan) */
  if (!lx && SIT.lux != null) { const v = luxDe(SIT, br); if (SIT.luzMotivo === 'dicha' || SIT.luzMotivo === 'oscuridad' || v > (c.proy.lux != null ? c.proy.lux : 0)) { for (let i = vistos.length - 1; i >= 0; i--) if (vistos[i].k === 'lux') vistos.splice(i, 1); c.proy.lux = v; vistos.push({ k: 'lux', v, motivo: SIT.luzMotivo }); } }
  const g = t.match(/(?:ganancia|gain|guany)\s*(?:de\s*)?(\d+(?:\.\d+)?)/); if (g) { c.proy.ganancia = n(g[1]); vistos.push({ k: 'ganancia', v: c.proy.ganancia }); }
  const te = t.replace(/(?:colgad[oa]s?|penjats?|hung)\s*(?:del|from the|of the)?\s*(?:techo|sostre|ceiling)\s*(?:a|at)?\s*(?=\d)/g, 'colgado a ').match(/techo\s*(?:de|a)?\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:m|metros)?\s*de techo|ceiling\s*(?:of\s*)?(\d+(?:\.\d+)?)|sostre\s*(?:de\s*|a\s*)?(\d+(?:\.\d+)?)/);
  if (!te && /pabellon|pavello|exterior|outdoor|aire libre|aire lliure|fachada|facade|facana|\bedificio\b/.test(t.replace(/(?:\bno\b|\bnot\b|n't|\bsin\b|\bsense\b|\bwithout\b|\btampoco\b|\bni\b)[^.,;:!?\n]{0,45}?(?:exterior|outdoor|outside|intemperie|aire libre|aire lliure)/g, ' '))) c.sueltas.techo = 0;   // v10.89 · sin techo que limite
  if (te) { const v = n(te[1] || te[2] || te[3] || te[4]); c.sueltas.techo = v; if (c.esp.tipo === 'sala' && c.esp.alto == null) c.esp.alto = v; vistos.push({ k: 'techo', v }); }
  // v8.2 · tipo de proyección: mapping (fachada o edificio, «mapping») o pared (auditorio, pared); la sala inmersiva sale de «sala»
  if (/mapping|fachada|facade|facana|\bedificio\b|\bedifici\b|building/.test(t)) { c.proy.tipo = 'mapping'; vistos.push({ k: 'tipo', v: 'mapping' }); }
  else if (/auditorio|auditorium|auditori\b/.test(t)) { c.proy.tipo = 'pared'; vistos.push({ k: 'tipo', v: 'pared' }); }
  // v8.0 · proyección: orientación, distancia a la superficie y montaje («proyectores en torres a 25 m», «en vertical»,
  // «torre de 6 m», «colgados de un truss a 8 m», «sobremesa»)
  if (/(?:proyector|projector|proyectar|projectar)[^.]{0,40}\b(?:en )?vertical|\ben vertical\b|portrait|modo retrato|in portrait/.test(t)) { c.proy.orient = 'vertical'; vistos.push({ k: 'vertical' }); }
  else if (/(?:proyector|projector)[^.]{0,40}\ben horizontal|\bin landscape\b/.test(t)) { c.proy.orient = 'horizontal'; vistos.push({ k: 'horizontal' }); }
  // v10.66 · una pantalla = un proyector, salvo que se pida multiproyección (blending)
  if (/multiproyecc|multiprojecc|multi-?projection|blending|edge ?blend|varios proyectores|diversos projectors|several projectors/.test(t)) { c.proy.multi = true; if (!tecnologia) tecnologia = 'proy'; vistos.push({ k: 'multi' }); }
  const dP0 = t.match(/(?:proyector(?:es)?|projector(?:s)?|projectors|torres?|towers?)([^.\d]{0,40}?)(?:\ba|\bat|desde|des de|from)\s*(\d+(?:\.\d+)?)\s*(?:m|metros|metres)\b(?!\s*(?:de alto|de altura|high|d'alcada|wide|de ancho|de base|d'ample|d'amplada|x\b|×|por\b|by\b))/);
  const dP = (dP0 && !/colgad|truss|penjat|hung|hanging|altura|height|alcada|\btorre|\btower|\bde\s*$|techo|sostre|ceiling|publico|public|audiencia/.test(dP0[1]) ? [dP0[0], dP0[2]] : null) || t.match(/(?:\ba|\bat)\s*(\d+(?:\.\d+)?)\s*(?:m|metros|metres)\s*(?:de|from|of)\s*(?:la |el |the )?(?:fachada|pared|pantalla|superficie|edificio|facade|wall|screen|facana|paret|edifici)/);
  if (dP) { c.proy.dist = n(dP[1]); vistos.push({ k: 'distProy', v: c.proy.dist }); }
  // v8.4 · en un mapping, «a 40 m (de distancia)» sin hablar del público es la distancia de los proyectores a la fachada
  else if (c.proy.tipo === 'mapping' && c.sueltas.dist != null && !/publico|public|audiencia|audience|espectador|viewer/.test(t)) {
    c.proy.dist = c.sueltas.dist; delete c.sueltas.dist;
    const iv = vistos.findIndex(x => x.k === 'publico'); if (iv >= 0) vistos.splice(iv, 1); vistos.push({ k: 'distProy', v: c.proy.dist });
  }
  else if (c.proy.tipo === 'mapping' && c.sueltas.dist == null) {   // «fachada de 12 x 20 a 40 m»
    const am = t.match(/(?:\ba|\bat|desde|des de|from)\s*(\d+(?:\.\d+)?)\s*(?:m|metros|metres)\b(?!\s*(?:de alto|de ancho|high|wide|d'alt|d'ample))/);
    if (am) { c.proy.dist = n(am[1]); vistos.push({ k: 'distProy', v: c.proy.dist }); }
  }
  /* v11.2 · en proyección, «a 8 m» / «desde la cabina a 18 m» sin más es la distancia de proyección (no si habla del público, de la altura o de dónde cuelga) */
  { const dt = t.match(/(?:distancia de (?:proyeccion|tiro|projeccio|tir)|throw distance|projection distance)[^\d.]{0,14}(\d+(?:\.\d+)?)\s*(?:m|metros|metres|meters)\b/); if (dt && c.proy.dist == null) { c.proy.dist = n(dt[1]); vistos.push({ k: 'distProy', v: c.proy.dist }); } }
  if (c.proy.dist == null && tecP === 'proy' && c.esp.tipo !== 'sala') {
    const RD = /(?:\ba|\bat|desde|des de|from)\s*(\d+(?:\.\d+)?)\s*(?:m|metros|metres|meters)\b(?!\s*(?:de alto|de altura|de ancho|de base|high|wide|d'alt|d'ample|d'alcada|x\b|×|por\b|by\b))/g; let q;
    while ((q = RD.exec(t))) { const v = n(q[1]), antes = t.slice(Math.max(0, q.index - 16), q.index);
      if (v === c.sueltas.dist || /publico|public|audienc|espectador|viewer|truss|colgad|penjat|hung|hanging|altura|height|alcada|techo|sostre|ceiling/.test(antes)) continue;
      c.proy.dist = v; vistos.push({ k: 'distProy', v }); break; }
  }
  // v10.89 · lúmenes mínimos del proyector y tipo de óptica pedidos
  const lmP = t.match(/(\d+(?:\.\d{3})*|\d+(?:\.\d+)?\s*k)\s*(?:lm\b|lumen(?:es|s)?\b|ansi)/);
  if (lmP) { let v = lmP[1].trim(); v = /k$/.test(v) ? parseFloat(v) * 1000 : parseFloat(v.replace(/\./g, '')); if (v >= 500) { c.proy.lmMin = v; vistos.push({ k: 'lumenes', v }); } }
  if (/ultracort|ultra ?corta|ultra[- ]?short|\bust\b|periscop/.test(t)) { c.proy.tipoOpt = 'ust'; vistos.push({ k: 'optica', v: 'ust' }); }
  else if (/(?:optica|lente|lens|objectiu)[^.]{0,20}(?:corta|short|gran angular|wide)|gran angular|short throw|tiro corto/.test(t)) { c.proy.tipoOpt = 'corta'; vistos.push({ k: 'optica', v: 'corta' }); }
  else if (/(?:optica|lente|lens|objectiu)[^.]{0,20}(?:larga|long|tele)|long throw|tiro largo|teleobjetivo/.test(t)) { c.proy.tipoOpt = 'larga'; vistos.push({ k: 'optica', v: 'larga' }); }
  /* v11.10 · margen de instalación: «proyectores en torre de 4 m a 25 m», «entre 4 y 25 m», «between 4 and 25 m», «entre 4 i 25 m» */
  const rng = tecP === 'proy' && t.match(/(?:proyector(?:es)?|projectors?|projectors|torres?|towers?)[^.\d]{0,40}?(?:entre|de|between|from)\s*(\d+(?:\.\d+)?)\s*(?:m|metros|metres|meters)?\s*(?:a|y|i|and|to|hasta|fins a)\s*(\d+(?:\.\d+)?)\s*(?:m|metros|metres|meters)\b(?!\s*(?:de alto|de altura|high|d'alt|x\b|×))/);
  if (rng && n(rng[2]) > n(rng[1])) { c.proy.distMin = n(rng[1]); c.proy.distMax = n(rng[2]); delete c.proy.dist; const iv = vistos.findIndex(x => x.k === 'distProy'); if (iv >= 0) vistos.splice(iv, 1); vistos.push({ k: 'rango', v: [c.proy.distMin, c.proy.distMax] }); }
  const torre = !rng && t.match(/(?:torre|tower|torres|towers)\s*(?:de|of)?\s*(\d+(?:\.\d+)?)\s*(?:m|metros|metres)?/);
  const colg = t.match(/(?:colgad[oa]s?|truss|penjats?|hung|hanging)[^.,;\d]{0,25}?(?:a|at|de)?\s*(\d+(?:\.\d+)?)\s*(?:m|metros|metres)\b/);
  if (torre) { c.proy.montaje = 'apoyado'; c.proy.altura = n(torre[1]); vistos.push({ k: 'montaje', v: 'apoyado', h: c.proy.altura }); }
  else if (/sobremesa|sobre (?:una )?mesa|en el suelo|on a table|on the floor|sobretaula|a terra/.test(t) && /proyect|project/.test(t)) { c.proy.montaje = 'apoyado'; c.proy.altura = /suelo|floor|terra/.test(t) ? 0.3 : 0.8; vistos.push({ k: 'montaje', v: 'apoyado', h: c.proy.altura }); }
  else if (colg) { c.proy.montaje = 'colgado'; c.proy.altura = n(colg[1]); vistos.push({ k: 'montaje', v: 'colgado', h: c.proy.altura }); }
  else if (/colgad[oa]s? del techo|del techo|hung from the ceiling|penjats? del sostre/.test(t) && /proyect|project/.test(t)) { c.proy.montaje = 'colgado'; vistos.push({ k: 'montaje', v: 'colgado' }); }
  // LED: interior / exterior, instalación / alquiler; electrónica
  const tu = t.replace(/(?:\bno\b|\bnot\b|n't|\bsin\b|\bsense\b|\bwithout\b|\btampoco\b|\bni\b)[^.,;:!?\n]{0,45}?(?:exterior|outdoor|outside|intemperie|aire libre|aire lliure)/g, ' interior ');   // v11.27 · un exterior negado («no hace falta que sea de exterior») es interior
  if (/exterior|outdoor|intemperie/.test(tu)) { c.led.tipo = 'OUTDOOR'; vistos.push({ k: 'ledTipo', v: 'exterior' }); } else if (/interior|indoor|\bdentro\b|\bdins\b/.test(tu)) c.led.tipo = 'INDOOR';
  if (/alquiler|rental|lloguer|eventos|gira/.test(t)) { c.led.clase = 'RENTAL'; vistos.push({ k: 'ledTipo', v: 'alquiler' }); }
  if (/backup|redundan/.test(t)) { c.elec.backup = true; vistos.push({ k: 'ledTipo', v: 'backup' }); }
  if (/fibra|fiber|fibre/.test(t)) { c.elec.conexion = 'fibra'; vistos.push({ k: 'fibra' }); }
  // v7.9 · pitch pedido («P1.5», «pitch 1,5», «1,5 mm de pitch»): la consola elige el modelo de ese pitch; «COB», uno COB
  // v10.0 · también la cifra delante de la p («3.9p», «exterior3.9p»), salvo 24p, 25p, 30p, 50p y 60p, que son fotogramas
  const pi = t.match(/\bp\s?(\d{1,2}(?:\.\d{1,3})?)\b|pitch\s*(?:de\s*)?(\d{1,2}(?:\.\d{1,3})?)|(\d{1,2}(?:\.\d{1,3})?)\s*mm\s*de\s*pitch/) || (() => { const m = t.match(/(?:^|[^\d.,])(\d{1,2}(?:[.,]\d{1,3})?)\s?p(?![a-z0-9])/); return m && (/[.,]/.test(m[1]) || parseFloat(m[1]) <= 20) ? [0, m[1].replace(',', '.')] : null; })();
  const pitch = pi ? n(pi[1] || pi[2] || pi[3]) : null; if (pitch) vistos.push({ k: 'pitch', v: pitch });
  /* v11.54 · público dicho de otra forma («people sit 3 m away») y fondo de la sala suelto («room depth 6 m») */
  if (c.sueltas.dist == null && SIT.pub) { c.sueltas.dist = SIT.pub; vistos.push({ k: 'publico', v: SIT.pub }); }
  if (SIT.fondo && !SIT.sala) { c.sueltas.salaFondo = SIT.fondo; vistos.push({ k: 'fondoSala', v: SIT.fondo }); }
  /* v11.54 · sala de uso cotidiano: sus medidas acotan dónde va el proyector; si no se dice la pantalla, se deduce y se enseña como supuesto */
  if (SIT.sala && c.esp.tipo !== 'sala') {
    const ps = pantallaDeSala(SIT.sala, c.sueltas.techo, br, c.sueltas.dist);
    c.sueltas.salaAncho = ps.pared; c.sueltas.salaFondo = ps.fondo; if (SIT.sala[2] > 0 && c.sueltas.techo == null) c.sueltas.techo = SIT.sala[2];
    if (!(c.sueltas.ancho > 0)) { c.sueltas.ancho = ps.w; c.sueltas.alto = ps.h; c.sueltas.formato = '16:9'; c.sueltas.medPor = 'ancho'; c.sueltas.medVal = ps.w; if (c.sueltas.dist == null) c.sueltas.dist = ps.pub;
      vistos.push({ k: 'supSala', v: SIT.sala, uso: SIT.uso, w: ps.w, h: ps.h, pub: ps.lejos, lim: ps.limitado }); vistos.push({ k: 'medida', v: [ps.w, ps.h], oculto: true }); }
    else vistos.push({ k: 'salaMed', v: SIT.sala });
  }
  /* v11.54 · el suelo de una sala LED no se calcula: se dice */
  const sueloLedNo = (tecnologia === 'led') && /\bsuelo\b|\bterra\b|\bfloor\b/.test(t);
  // v10.89 · lo que no se ha usado: cifras con unidad de la petición que no salen en lo entendido (se avisa, nunca se calla)
  const noUsado0 = []; const usados = new Set(); vistos.forEach(x => [x.v, x.n, x.h].flat().forEach(v => { if (typeof v === 'number') usados.add(Math.round(v * 100)); }));
  if (pitch) usados.add(Math.round(pitch * 100));
  if (SIT.sala) SIT.sala.forEach(v => usados.add(Math.round(v * 100)));
  if (sueloLedNo) noUsado0.push('suelo (LED)');
  const noUsado = noUsado0; { const U = /(\d+(?:\.\d+)?)\s*(m\b|mts|metros|metres|lm\b|lumen(?:es|s)?|lx\b|lux\b|″|"|pulgadas|inches|polzades|%|personas|persones|people)/g; let q;
    while ((q = U.exec(t))) { const v = parseFloat(q[1]); if (/lumen|lm/.test(q[2]) && c.proy.lmMin) continue; if (!usados.has(Math.round(v * 100))) noUsado.push(q[0].trim().replace('.', ',')); } }
  /* v11.14 · lo que se pide y hoy no cambia el cálculo se dice, en vez de callarlo: «4K» y la retroproyección no tienen mando; un formato que no cuadra
     con la medida escrita tampoco se aplica. «Láser» sí se da por entendido: todos los proyectores del catálogo lo son. */
  if (tecP === 'proy') {
    if (/\b4k\b|\buhd\b|ultra ?hd/.test(t)) noUsado.push('4K');
    if (/retropro[yj]ec|rear[- ]projection|pro[yj]eccion? (?:trasera|posterior)|pro[yj]eccio (?:posterior|del darrere)|(?:desde|por) detras|des de darrere|from behind/.test(t)) noUsado.push('retroproyección');
    if (/\blaser\b/.test(t)) vistos.push({ k: 'texto', v: 'láser' });
    const fm = t.match(/\b(16:9|16:10|4:3|21:9|1:1)\b/);
    if (fm && !c.sueltas.formato) { const [fa, fb] = fm[1].split(':').map(Number), a = c.sueltas.ancho, b = c.sueltas.alto; if (!(a && b) || Math.abs(a / b - fa / fb) / (fa / fb) > 0.03) noUsado.push(fm[1]); }
  }
  return { cantidad, tecnologia, cambios: c, vistos, pitch, cob: /\bcob\b/.test(t), noUsado: [...new Set(noUsado)] };
}
