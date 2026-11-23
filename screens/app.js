// SCREENS · interfaz (consola fija con petición en lenguaje natural, panel de rack, simulación 3D y resultados)
import { cargarCatalogo, cargarEquipos, ordenar, enStock, nivelStock, cabeEnBatch } from './catalogo.js';
import { superficies, distanciaPublico, elegirModelo, calcularLed, totales, aplicarPuertas, obstaculoMundo, puertaMundo } from './led.js';
import { PROYECTORES, CUERPOS, calcularPared, calcularSuelo, SOLAPE_MAX, SOLAPE_RECO, RECORTE_MAX, analizarSombras, obstaculosEnHaces } from './proyeccion.js';
// v10.54 · marcas de proyección que hay en el catálogo, en su orden de prioridad (a igualdad de resultado: EPSON > VIVITEK > CHRISTIE)
const ORDEN_MARCA = ['EPSON', 'VIVITEK', 'CHRISTIE'], prioMarca = (m) => { const i = ORDEN_MARCA.indexOf(m); return i < 0 ? ORDEN_MARCA.length : i; };
const MARCAS_PROY = [...new Set(PROYECTORES.map(q => q.marca))].sort((a, b) => prioMarca(a) - prioMarca(b));
const marcasActivas = () => { const a = (E.proy.marcas || []).filter(m => MARCAS_PROY.includes(m)); return a.length ? a : MARCAS_PROY; };
// enciende o apaga una marca (siempre queda una); si el proyector elegido a mano era de la que se apaga, vuelve a automático
function alternaMarca(v) {
  let act = marcasActivas().slice(); act = act.includes(v) ? act.filter(m => m !== v) : act.concat(v); if (!act.length || !MARCAS_PROY.includes(v)) return false;
  E.proy.marcas = act.length === MARCAS_PROY.length ? [] : MARCAS_PROY.filter(m => act.includes(m));
  const cu = E.proy.cuerpo && PROYECTORES.find(q => q.modelo === E.proy.cuerpo); if (cu && !marcasActivas().includes(cu.marca)) { E.proy.cuerpo = ''; E.proy.optica = ''; }
  const su = E.proy.idSuelo && PROYECTORES.find(q => q.id === E.proy.idSuelo); if (su && !marcasActivas().includes(su.marca)) E.proy.idSuelo = '';
  return true;
}
import '../comun/equipos.js';   // v10.45 · listas de equipos de fábrica: antes que el motor
import '../comun/motor-i18n.js';
import '../comun/electronica.js';
import '../comun/ficha.js?v=10.71';   // v10.50 · con versión: el icono de stock es nuevo
import '../comun/voz.js';
import { interpretar } from './peticion.js';
import { vistasTecnicas, activarVistas } from './vistas.js';
import { t, idiomaInicial, fijarIdioma, idioma, IDIOMAS } from './i18n.js';

const VERSION = 'v10.71';
// v8.9 · crédito común de AVHUB (credito.js) y seta de aviso de fallos (fallo.js), los mismos en toda la familia
if (window.AVCREDITO) window.AVCREDITO.alCambiar(() => { try { pintarCabecera(); } catch (e) {} });
if (window.AVFALLO) { const bi = document.querySelector('#btn-idioma'); if (bi) { const bf = window.AVFALLO.boton({ app: 'SCREENS', version: VERSION, idioma: () => idioma() }); bf.id = 'btn-fallo'; bi.before(bf);
  const talla = () => { const h = bi.offsetHeight; if (h) bf.style.setProperty('--avf', h + 'px'); }; talla(); addEventListener('resize', talla); setTimeout(talla, 800); } }
// v9.6 · botón «Instalar», común a toda la familia (instalar.js): instala SCREENS como una app; la copia sin conexión la lleva el service worker de siempre (sw.js)
if (window.AVINSTALA) { const bi = document.querySelector('#btn-idioma'); if (bi) { const bn = window.AVINSTALA.boton({ app: 'SCREENS', idioma: () => idioma(), sw: false }); bn.id = 'btn-instala'; (document.querySelector('#btn-fallo') || bi).before(bn);
  const talla = () => { const h = bi.offsetHeight; if (h) bn.style.setProperty('--avi', h + 'px'); }; talla(); addEventListener('resize', talla); setTimeout(talla, 800); } }
const ELEC = globalThis.SC_ELEC, { fichaHTML } = globalThis.SC_FICHA;
const DEF = () => ({
  cantidad: 'varias', tecnologia: 'led',
  esp: { tipo: 'sala', ancho: 8, fondo: 6, alto: 3.5, elev: 0, altoCubierto: 0,
    paredes: { frontal: true, izquierda: true, derecha: true, trasera: false, suelo: false },
    sueltas: { n: 3, disp: 'arco', ancho: 4, alto: 2.25, elev: 0.6, sep: 0.1, angulo: 25, dist: 5, techo: 3, central: false, cAncho: 6, cAlto: 3.4 },
    obst: [] },
  led: { clase: 'INSTALL', tipo: 'INDOOR', crm: '', ajuste: 'dentro', transp: false, gold: false, protegido: false, sol: '', nitsMin: 0 },
  proy: { tipo: 'pared', cuerpo: '', optica: '', idSuelo: '', solape: 15, multi: false, lux: 140, luzUso: 'reunion', ganancia: 1, dist: 0, distMin: 0, distMax: 0, pubNS: false, marcas: [], orient: 'auto', montaje: 'auto', altura: 0, oos: false },
  elec: { backup: false, escalador: 'con', conexion: 'directo', sel: '', marca: 'todos', dante: false, selMedia: '', proyEq: 'media', selBlend: '' },
  vista: { contenido: 'carta', etiquetas: true, camara: 'exterior', zona: true, modo: 'continuo', tec: 'todas', vtSup: 0 }
});
let E = DEF();
try { const g = JSON.parse(localStorage.getItem('screens_estado') || 'null'); if (g && g.esp) { const d = DEF(); E = Object.assign(d, g, { elec: Object.assign(d.elec, g.elec || {}), vista: Object.assign(d.vista, g.vista || {}), proy: Object.assign(d.proy, g.proy || {}), esp: Object.assign(d.esp, g.esp, { sueltas: Object.assign(d.esp.sueltas, (g.esp || {}).sueltas || {}) }) }); } } catch (e) {}
delete E.paso; // v7.0 · consola única: se entra directamente al cuadro de mandos (ya no hay página de selector)
// ?led (enlaces de siempre al cálculo de una pantalla LED): la consola se abre en «Una + LED»
try { if (new URLSearchParams(location.search).has('led')) { E.cantidad = 'una'; E.tecnologia = 'led'; } } catch (e) {}
const guardar = () => { try { localStorage.setItem('screens_estado', JSON.stringify(E)); } catch (e) {} };
let catalogo = [], estadoCat = 'cargando', escena = null, calculo = null;
let medio = null;   // vídeo o imagen propios (solo en este navegador, no se guarda)

const $ = (s, r = document) => r.querySelector(s);
const fmt = (v, d = 2) => Number(v || 0).toLocaleString(idioma() === 'en' ? 'en-GB' : 'es-ES', { minimumFractionDigits: 0, maximumFractionDigits: d });
const fmtPx = (v) => Number(v || 0).toLocaleString(idioma() === 'en' ? 'en-GB' : 'es-ES');
const SVI = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
const ICO_EU = { eInt: SVI('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>'), eExt: SVI('<path d="M2 20h20"/><path d="M5 20l5-9 3 5 2-3 4 7"/><circle cx="17.5" cy="6" r="2"/>'), eEsc: SVI('<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12.5V20h14v-7.5"/>'), eFija: SVI('<path d="M12 21v-7"/><path d="M8 3h8l-1 6 3 4H6l3-4z"/>'), eAlq: SVI('<rect x="2" y="7" width="11" height="9" rx="1"/><path d="M13 10h4l4 3v3h-8z"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>'), eSol: SVI('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'), eNube: SVI('<path d="M12 3v1.5M5.6 5.6l1 1M3 12h1.5M18.4 5.6l-1 1"/><path d="M8.5 11a4 4 0 0 1 7-2.6"/><path d="M8 20h9a3.5 3.5 0 0 0 .5-7 5 5 0 0 0-9.6 1.3A3 3 0 0 0 8 20z"/>'), eMar: SVI('<path d="M2 16c2 0 2-1.5 4-1.5S8 16 10 16s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><path d="M2 20.5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><path d="M12 3c2 2.5 3 4 3 5.5a3 3 0 0 1-6 0C9 7 10 5.5 12 3z"/>'), eTra: SVI('<rect x="3" y="4" width="18" height="13" rx="1.5" stroke-dasharray="3 2.2"/><path d="M8 21h8M12 17v4"/><path d="M7 13l4-5M11 14l5-6"/>'), ePub: SVI('<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>') };
const ICO = {
  espacio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>',
  led: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="12" rx="1"/><path d="M9 5v12M15 5v12M3 11h18M8 21h8"/></svg>',
  proy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="2" y="8" width="13" height="8" rx="1.5"/><circle cx="11" cy="12" r="2.2"/><path d="M15 10l7-4v12l-7-4"/></svg>',
  elec: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="2" y="8" width="20" height="8" rx="1"/><path d="M5 11h2v2H5zM9 11h2v2H9zM13 11h2v2h-2z"/><path d="M18 12h1.5"/></svg>',
  sup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>'
};

// ---------- cálculo ----------
// v10.34 · entorno y uso como en la portada: interior, exterior o escaparate, transparente, fija o alquiler, sol directo o indirecto,
// marino / tropical (contactos de oro) y al alcance del público (LED protegido: UfixAvant HOB y UfixCOB). En una sala inmersiva el público
// siempre está al alcance de las paredes: el LED protegido va siempre. Si no hay modelos que cumplan, se muestran los normales con un aviso.
const SOL_DIRECTO = 5000, SOL_INDIRECTO = 2500, MIN_NITS = { OUTDOOR: 5000, ESCAPARATE: 2500, INDOOR: 0 };
const famN = (m) => String(m.family || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, ''), tecN = (m) => String(m.tech || '').toUpperCase().trim();
const esTransp = (m) => famN(m).includes('holo') || famN(m) === 'tglass' || /GLASS/i.test(String(m.crm || '')),   // v10.67 · T·Rent Glass también, como en una pantalla LED
  esProt = (m) => (tecN(m) === 'HOB' && famN(m) === 'ufixavant') || (tecN(m) === 'COB' && famN(m) === 'ufixcob');
const salaLed = () => E.cantidad === 'varias' && E.esp.tipo === 'sala' && E.tecnologia === 'led';
const protegidoLed = () => E.led.tipo === 'INDOOR' && (salaLed() || !!E.led.protegido);
let avisoLed = [], nitsLed = 0;
function listaLed() {
  const L = E.led; avisoLed = [];
  let lista = catalogo.filter(m => m.class === L.clase && m.tipo === L.tipo);
  if (!lista.length) { lista = catalogo.filter(m => m.tipo === L.tipo); if (lista.length) avisoLed.push(t('relClase')); }
  // v10.67 · install que se puede resolver con rental (regla de Josep, 18-11-2026)
  if (L.clase === 'INSTALL' && (L.transp || L.gold)) { const pide = (m) => (!L.transp || esTransp(m)) && (!L.gold || /gold/i.test(String(m.tech || '')));
    if (!lista.some(pide)) { const rent = catalogo.filter(m => m.tipo === L.tipo && m.class === 'RENTAL' && pide(m)); if (rent.length) { lista = rent; avisoLed = [t('relRental')]; } } }
  { const tr = lista.filter(esTransp); if (L.transp) { if (tr.length) lista = tr; else avisoLed.push(t('relTransp')); } else if (tr.length < lista.length) lista = lista.filter(m => !esTransp(m)); }
  if (L.gold) { const g = lista.filter(m => /gold/i.test(String(m.tech || ''))); if (g.length) lista = g; else avisoLed.push(t('relGold')); }
  const conSol = L.tipo !== 'INDOOR' ? L.sol : '', base = conSol === 'directo' ? SOL_DIRECTO : conSol === 'indirecto' ? SOL_INDIRECTO : (MIN_NITS[L.tipo] || 0), nits = Math.max(base, +L.nitsMin || 0), tope = conSol === 'indirecto' && nits < SOL_DIRECTO ? SOL_DIRECTO : Infinity;
  { const enRango = lista.filter(m => m.nits >= nits && m.nits < tope), conNits = lista.filter(m => m.nits >= nits);
    if (enRango.length) lista = enRango; else if (conNits.length) lista = conNits; else if (nits) avisoLed.push(t('relNits', { n: nits })); nitsLed = nits; }
  if (protegidoLed()) { const p = lista.filter(esProt); if (p.length) lista = p; else avisoLed.push(t('relProt')); }
  return ordenar(lista);
}
// brillos mínimos que se pueden pedir con − y + (los de los cabinets de este entorno)
const nitsLista = () => [...new Set(catalogo.filter(m => m.tipo === E.led.tipo && m.nits > 0).map(m => +m.nits))].sort((a, b) => a - b);
// v8.2 · tipo de proyección y relación de proyección preferida en mapping sin distancia (unas 2 veces el ancho de la imagen)
const tipoProy = () => (E.cantidad === 'varias' && E.esp.tipo === 'sala' ? 'sala' : E.proy.tipo === 'mapping' ? 'mapping' : 'pared');
const TR_MAPPING = 2;
// v10.63 · la luz es la que se elige y nunca cambia sola (antes cada tipo ponía la suya al cargar y una pared a 10 lx volvía a 140 al recargar).
// Arranca con 140 lx y ganancia 1; escalones: Meeting room 140, Class room 210, Event hall 140,
// Living 70 y Theatre room 14, o a mano. 0 lx es 0 (oscuridad total), no «sin dato».
const USOS_LUZ = [['reunion', 140], ['aula', 210], ['evento', 140], ['salon', 70], ['teatro', 14]];
// v10.63 · el mapping arranca con una fachada de 6 m de alto y el proyector a 6 m (sin techo): se pone al pasar a mapping desde otro tipo
function alMapping() { const s = E.esp.sueltas; s.alto = 6; s.ancho = Math.round(6 * 16 / 9 * 100) / 100; Object.assign(E.proy, { dist: 6, distMin: 0, distMax: 0 }); }
// v10.63 · medidas de cada pantalla LED (ancho, alto): las guardadas y, para las que falten, la medida común
const LED_MAX = 4;
function tamsLed(q) { const n = Math.max(1, Math.min(LED_MAX, q.n | 0)), g = Array.isArray(q.tams) ? q.tams : []; return Array.from({ length: n }, (_, i) => { const x = g[i] || []; return [Number(x[0]) > 0 ? Number(x[0]) : q.ancho, Number(x[1]) > 0 ? Number(x[1]) : q.alto]; }); }
function nombreSup(s) { return s.tipo === 'pantalla' ? `${t('pantalla')} ${s.num}${s.central ? ' · ' + t('central') : ''}` : t(s.id); }
// v10.66 · UNA PANTALLA = UN PROYECTOR (regla de Josep, 18-11-2026). En pantallas y fachadas (no en la sala inmersiva), cada superficie se
// resuelve con una sola imagen. La multiproyección (blending) solo sale si se pide (E.proy.multi) o si, en automático, ningún proyector de
// las marcas activas llega con una imagen y el blending sí lo resuelve limpio: entonces se avisa (c.multiAuto). Con el proyector elegido a
// mano que no llega, se queda en una imagen con su «no se puede» y, si con blending saldría, se ofrece (c.multiPosible).
const blendLimpio = (c) => !!(c && c.filas && c.filas.length && c.tot && c.tot.n > 1 && c.filas.every(f => f.s.tipo === 'suelo' || !(f.p.fuera || f.p.noCubre || f.p.limite || f.p.chica || f.p.solapeRel > SOLAPE_MAX + 1e-6)) && !(c.sombras && ((c.sombras.choques || []).length || (c.sombras.conflictos || []).length)));
const RECORTE_MULTI = 0.5;   // con una imagen se tira más de media imagen fuera de la pantalla (formatos muy apaisados): mejor blending
function calcular(forzarMulti) {
  const esp = JSON.parse(JSON.stringify(E.esp));
  if (E.cantidad === 'una') { esp.tipo = 'sueltas'; esp.sueltas.n = 1; esp.sueltas.disp = 'linea'; }
  if (E.tecnologia === 'led') esp.paredes.suelo = false; // el suelo LED necesita cabinets de suelo específicos
  // v10.63 · varias pantallas LED: como mucho 4, cada una con su medida y todas del mismo cabinet (la central distinta es solo de proyección)
  if (E.tecnologia === 'led' && esp.tipo === 'sueltas') { const q = esp.sueltas; q.n = Math.max(1, Math.min(LED_MAX, q.n | 0)); q.central = false; q.tams = tamsLed(q); }
  else delete esp.sueltas.tams;
  if (E.tecnologia !== 'led' && tipoProy() === 'mapping') esp.sueltas.techo = 0;   // v10.63 · en mapping no hay techo
  const dist = distanciaPublico(esp);
  if (E.tecnologia === 'led') {
    const lista = listaLed();
    const modelo = (E.led.crm && lista.find(m => m.crm === E.led.crm)) || elegirModelo(lista, dist);
    if (!modelo) return { esp, dist, filas: [], modelo: null, lista, avisoLed: avisoLed.slice() };
    const grosor = (modelo.thick || 80) / 1000;
    const sups = superficies(esp, grosor);
    const puertas = puertasDe(esp);
    const filas = sups.map(s => ({ s, r: aplicarPuertas(calcularLed(s, modelo, E.led.ajuste), s, modelo, puertas.filter(p => p.pared === s.id)), nombre: nombreSup(s), grosor }));
    // v10.69 · rental como alternativa (regla de Josep, 21-11-2026): con un cabinet fijo que cumple, el fijo sigue siendo el principal; el de
    // alquiler solo se ofrece, con aviso, si está en stock y el fijo no. Tiene que dar lo mismo: entorno, transparente, GOLD, brillo, pitch y medida
    if (E.led.clase === 'INSTALL' && modelo.class === 'INSTALL' && !enStock(modelo) && !protegidoLed()) {
      const encaja = (x) => sups.every(s => { const q = calcularLed(s, x, E.led.ajuste); return Math.abs(q.ancho - s.ancho) <= s.ancho * 0.15 + 1e-9 && Math.abs(q.alto - s.alto) <= s.alto * 0.15 + 1e-9; });
      const alt = ordenar(catalogo.filter(x => x.tipo === modelo.tipo && x.class === 'RENTAL' && enStock(x) && esTransp(x) === esTransp(modelo) && (!E.led.gold || /gold/i.test(String(x.tech || ''))) && x.nits >= nitsLed && Math.abs(x.pitch - modelo.pitch) <= 0.2 + 1e-9 && encaja(x)))[0];
      if (alt) avisoLed.push(t('altRental', { m: alt.crm }));
    }
    const c = { esp, dist, modelo, lista, filas, tot: totales(filas), avisoLed: avisoLed.slice() };
    c.elec = electronica(c); c.veredicto = veredicto(c); return c;
  }
  const sups = superficies(esp, 0);
  const una = esp.tipo === 'sueltas' && !E.proy.multi && !forzarMulti;
  const opc = { solapeMin: E.proy.solape / 100, oos: !!E.proy.oos, una };
  // v8.0 · distancia fija (torres al otro lado de la calle, truss…), orientación (horizontal / vertical) y montaje con su altura
  const fijaDist = Math.max(0, Number(E.proy.dist) || 0);
  // v8.2 · tipo de proyección: mapping (fachada a distancia), pared (auditorio o pared normal) o sala inmersiva
  const tipoP = tipoProy();
  // sin distancia fijada, el proyector va donde suele ir: en mapping, lejos (unas 2 veces el ancho de la imagen); en pared, a la distancia del público
  // v10.53 · dónde se puede instalar el proyector (pared o mapping): entre distMin y distMax metros de la superficie (0 = sin límite). Con ese
  // margen se elige la óptica que da la imagen desde ahí; si ninguna llega, la instalación sale como que no cabe. Una distancia fijada manda.
  const conRango = !fijaDist && esp.tipo !== 'sala', dMin = conRango ? Math.max(0, Number(E.proy.distMin) || 0) : 0, dMax = conRango ? Math.max(0, Number(E.proy.distMax) || 0) : 0, hayRango = dMin > 0 || dMax > 0;
  const enRango = (v) => Math.min(dMax > 0 ? dMax : Infinity, Math.max(dMin, v)), corta = (r) => dMin > 0 && r.tiro < dMin - 0.005;
  const sup1 = sups.find(s => s.tipo !== 'suelo');
  const tiroPared = tipoP === 'pared' && !fijaDist ? enRango(Math.max(1, dist)) : tipoP === 'mapping' && hayRango && sup1 ? enRango(TR_MAPPING * sup1.ancho) : 0;
  const optPared = { ...opc, dist: fijaDist, orient: E.proy.orient || 'auto', trObjetivo: tipoP === 'mapping' && !fijaDist && !hayRango ? TR_MAPPING : 0, tiroObjetivo: tiroPared };
  // v10.54 · sin saber desde dónde mira la gente (o en mapping con un margen de instalación), el proyector va en el punto medio de lo que permite
  // su óptica, dentro del margen si lo hay; sabiendo la distancia del público, se sigue acercando a ella
  const pubNS = tipoP === 'pared' && !fijaDist && !!E.proy.pubNS, alMedio = pubNS || (tipoP === 'mapping' && hayRango && !fijaDist);
  const optDe = (q, extra) => { const o = { ...optPared, ...(extra || {}) }; if (alMedio && sup1) { const nw1 = Math.max(sup1.ancho, sup1.alto * q.ar), a = q.trMin * nw1, b = q.trMax * nw1, lo = Math.max(dMin, a), hi = Math.min(dMax > 0 ? dMax : Infinity, b); o.trObjetivo = 0; o.tiroObjetivo = lo <= hi ? (lo + hi) / 2 : enRango((a + b) / 2); } return o; };
  // alcance: en sala, la pared de enfrente; en pared, el público y un poco más; en mapping o con la distancia fijada, sin límite
  const alcanceDe = (s) => (dMax > 0 ? dMax : hayRango || pubNS || tipoP === 'mapping' || (fijaDist > 0 && esp.tipo !== 'sala') ? null : alcance(esp, s, dist));
  // preferencia según el tipo, en «proyectores» (a igual número de equipos): en mapping, los más luminosos y, sin distancia, nada de
  // ópticas cortas y la relación cerca de 2:1 (el proyector lejos, en torre); en pared, la óptica que llega a la distancia del público
  // y mejor no ultracorta; en sala, la que quepa
  const desvTR = (q, r) => (r < q.trMin ? Math.log(q.trMin / r) : r > q.trMax ? Math.log(r / q.trMax) : 0);
  const pared1 = sups.find(s => s.tipo !== 'suelo'), trPared = pared1 ? (alMedio && hayRango ? (dMax > 0 ? (dMin + dMax) / 2 : dMin) : tiroPared) / pared1.ancho : 0;
  const pref0 = (q) => (tipoP === 'mapping' ? (hayRango ? (trPared ? desvTR(q, trPared) * 0.3 : 0) : !fijaDist ? ((q.ust || q.trMax < 1) ? 80 : 0) + desvTR(q, TR_MAPPING) * 0.3 : 0) - q.lumens / 20000
    : tipoP === 'pared' ? (q.ust ? 0.5 : 0) + (trPared ? desvTR(q, trPared) * 0.3 : 0) : 0);
  // v10.58 · la prioridad de marca manda en automático (EPSON > VIVITEK > CHRISTIE): 5.000 puntos por escalón, más que cualquier diferencia de
  // número de equipos o de brillo y menos que una instalación que no cabe o con sombras. Así, la siguiente marca solo sale si con la anterior
  // no hay una instalación limpia; para calcular con otra, se apagan las demás o se elige el proyector.
  const pref = (q) => pref0(q) + prioMarca(q.marca) * 50;
  const coloc = { montaje: E.proy.montaje || 'auto', altura: Math.max(0, Number(E.proy.altura) || 0) };
  const altoEsc = esp.tipo === 'sala' ? esp.alto : Math.max(3, ...sups.map(s => s.elev + s.alto)) + 0.8;
  const obs = obstaculosDe(esp), haySuelo = sups.some(s => s.tipo === 'suelo');
  // un mismo modelo para todas las paredes; el suelo puede llevar el mismo u otro
  const montar = (pP, pS, extra) => {
    const filas = sups.map(s => s.tipo === 'suelo'
      ? { s, p: calcularSuelo(s, pS, { altoSala: esp.alto, ...opc, ...(extra || {}) }), proyector: pS, nombre: nombreSup(s) }
      : { s, p: calcularPared(s, pP, { alcance: alcanceDe(s), ...optDe(pP, extra) }), proyector: pP, nombre: nombreSup(s) });
    let cerca = 0; filas.forEach(f => { if (f.s.tipo !== 'suelo' && corta(f.p)) { f.p.fuera = true; cerca++; } });   // más cerca de lo que se puede poner: no cabe
    const S = analizarSombras(filas, esp, altoEsc, coloc); S.obst = obstaculosEnHaces(obs, S.haces);
    return { filas, S, coste: costeInstalacion(filas, S) + pref(pP) * 100 + cerca * 1e9 };
  };
  // AUTO: la instalación limpia (sin chasis que choquen ni proyectores dentro de otros haces) con menos equipos y más brillo.
  // Con el catálogo completo (cuerpos × ópticas), primero se puntúa cada combinación con el cálculo rápido de las paredes
  // y solo las mejores pasan por la colocación completa con sombras y choques
  const rapido = (q) => { let k = pref(q) * 1000; sups.forEach(s => { if (s.tipo === 'suelo') return; const r = calcularPared(s, q, { alcance: alcanceDe(s), ...optDe(q) });
    k += (r.fuera || corta(r) ? 1e7 : 0) + (r.noCubre ? 4e6 : 0) + (r.limite || r.chica ? 2e6 : 0) + (r.solapeRel > SOLAPE_MAX + 1e-6 ? 5e6 : 0) + r.n * 1000 + (r.recorte + r.recorteX) * 300 - Math.min(r.nits, 250) * 0.5; }); return k; };
  const supS = sups.find(s => s.tipo === 'suelo');
  const rapidoS = (q) => { const r = calcularSuelo(supS, q, { altoSala: esp.alto, ...opc }); return r.n * 1000 - Math.min(r.nits, 250) * 0.5; };
  const mejores = (lista, k = 10, fc = rapido) => lista.length <= k ? lista : lista.map(q => ({ q, c: fc(q) })).sort((a, b) => a.c - b.c).slice(0, k).map(x => x.q);
  const mejorDe = (lista, fn) => lista.map(q => ({ q, r: fn(q) })).sort((x, y) => x.r.coste - y.r.coste)[0];
  // v10.54 · solo las marcas activadas (todas, si no se ha quitado ninguna)
  const mAct = marcasActivas(), CAT = mAct.length === MARCAS_PROY.length ? PROYECTORES : PROYECTORES.filter(q => mAct.includes(q.marca));
  const cand = CAT.filter(q => (!E.proy.cuerpo || q.modelo === E.proy.cuerpo) && (!E.proy.optica || q.optica === E.proy.optica));
  const lista = cand.length ? cand : CAT;
  const fijo = lista.length === 1 ? lista[0] : null, fijoS = E.proy.idSuelo && PROYECTORES.find(p => p.id === E.proy.idSuelo);
  let proyector, prSuelo, inst, auto = null;
  // v10.63 · una sola marca por proyecto: el proyector del suelo es de la misma marca que el de las paredes (uno elegido a mano de otra marca
  // no se usa). Sin paredes, el proyector del proyecto es el del suelo (antes se nombraba uno de pared que no estaba).
  const hayPared = sups.some(s => s.tipo !== 'suelo');
  if (!hayPared && haySuelo) { proyector = fijo || (fijoS && mAct.includes(fijoS.marca) ? fijoS : null) || mejorDe(mejores(lista, 8, rapidoS), q => montar(q, q)).q; prSuelo = proyector; }
  else {
    if (fijo) { proyector = fijo; }
    else { const m = mejorDe(mejores(lista), q => montar(q, fijoS && fijoS.marca === q.marca ? fijoS : q)); proyector = m.q; }
    if (fijoS && fijoS.marca === proyector.marca) prSuelo = fijoS;
    else if (haySuelo) prSuelo = mejorDe(mejores(CAT.filter(q => q.marca === proyector.marca), 8, rapidoS), q => montar(proyector, q)).q;
    else prSuelo = proyector;
  }
  inst = montar(proyector, prSuelo);
  // con un modelo elegido a mano que no deja una instalación limpia, se propone el de AUTO
  if (fijo && hayPared && (inst.S.conflictos.length || inst.S.choques.length)) { const m = mejorDe(mejores(CAT), q => montar(q, q)); if (m.q !== fijo && !m.r.S.conflictos.length && !m.r.S.choques.length) auto = m.q; }
  // v10.54 · con el proyector o la óptica elegidos a mano y sin salida (no da esa imagen desde ahí, no cabe o la imagen pasa de su máximo): se avisa,
  // se mira si saldría fuera de especificación y se propone la combinación más parecida que sí lo hace (misma clase de resolución y brillo
  // más cercano; primero, el mismo cuerpo con otra óptica). No hay precios en la app: el parecido es por prestaciones.
  let consejo = null;
  if ((E.proy.cuerpo || E.proy.optica) && cand.length && inst.filas.some(f => f.s.tipo !== 'suelo' && (f.p.fuera || f.p.noCubre || f.p.limite || f.p.chica))) {
    const vale = (q, extra) => sups.every(s => { if (s.tipo === 'suelo') return true; const r = calcularPared(s, q, { alcance: alcanceDe(s), ...optDe(q, extra) }); return !(r.fuera || r.noCubre || r.limite || r.chica || corta(r)); });
    const ref = proyector, lejos = (q) => (q.modelo === ref.modelo ? -5 : 0) + (q.k4nativo !== ref.k4nativo ? 3 : 0) + (q.k4 !== ref.k4 ? 1 : 0) + Math.abs(Math.log(q.lumens / ref.lumens)) * 2 + (q.serie !== ref.serie ? 0.1 : 0);
    const alt = CAT.filter(q => !lista.includes(q) && q.marca === ref.marca && vale(q))   // v10.63 · solo de la misma marca
   .map(q => ({ q, k: lejos(q) + pref0(q) * 0.01 })).sort((x, y) => x.k - y.k)[0];
    consejo = { nombre: (ref.marca ? ref.marca + ' ' : '') + ref.nombre, oos: !E.proy.oos && lista.some(q => vale(q, { oos: true })), alt: alt ? alt.q : null };
  }
  // v10.63 · solape por encima del máximo de blending: no recomendable (se desperdician equipos y luz). Se busca un equipo que lo haga con una
  // sola imagen y su óptica (puede sobrar un poco de imagen, que se enmascara: hasta el recorte máximo), desde el mismo sitio
  let unaImagen = null;
  if (hayPared && inst.filas.some(f => f.s.tipo !== 'suelo' && f.p.solapeRel > SOLAPE_MAX + 1e-6)) {
    const lxN0 = Number(E.proy.lux), lxU = isFinite(lxN0) && lxN0 >= 0 ? lxN0 : 140;   // v10.63 · la propuesta también tiene que dar el contraste mínimo (7:1)
    const una = (q) => sups.every(s => { if (s.tipo === 'suelo') return true; const r = calcularPared(s, q, { alcance: alcanceDe(s), ...optDe(q) }); return r.n === 1 && (lxU <= 0 || (r.lux + lxU) / lxU >= 7) && !(r.fuera || r.noCubre || r.limite || r.chica || corta(r)) && r.recorte <= RECORTE_MAX + 1e-6 && r.recorteX <= RECORTE_MAX + 1e-6; });
    const ref = proyector, k = CAT.filter(q => q !== ref && q.marca === ref.marca && una(q))   // v10.63 · NUNCA de otra marca (decidido por Josep, 16-11-2026).map(q => ({ q, k: (q.lumens < ref.lumens ? 1e6 : 0) + pref(q) * 100 + q.lumens / 1000 })).sort((a, b) => a.k - b.k)[0];
    if (k) unaImagen = k.q;
  }
  const filas = inst.filas;
  const tot = { n: 0, lumenes: 0, nitsMin: Infinity, lienzoW: 0, lienzoH: 0 };
  filas.forEach(f => { tot.n += f.p.n; tot.lumenes += f.p.n * f.proyector.lumens; tot.nitsMin = Math.min(tot.nitsMin, f.p.nits); if (f.s.tipo !== 'suelo' || !hayPared) { tot.lienzoW += f.p.resW; tot.lienzoH = Math.max(tot.lienzoH, f.p.resH); } });
  // v10.63 · equipos por modelo (paredes y suelo pueden llevar modelos distintos de la misma marca)
  const grupos = []; filas.forEach(f => { const g = grupos.find(x => x.q === f.proyector); if (g) g.n += f.p.n; else grupos.push({ q: f.proyector, n: f.p.n }); });
  // brillo: iluminancia = lúmenes / superficie de la imagen; luminancia = iluminancia × ganancia / π;
  // contraste real = (iluminancia + luz de la sala) / luz de la sala. v10.63 · 0 lx es 0: contraste infinito
  const lxN = Number(E.proy.lux), lx = isFinite(lxN) && lxN >= 0 ? lxN : 140, gan = Math.max(0.1, Number(E.proy.ganancia) || 1);
  filas.forEach(f => { const q = f.p; q.nits = q.lux * gan / Math.PI; q.contraste = lx > 0 ? (q.lux + lx) / lx : Infinity; });
  tot.nitsMin = Math.min(...filas.map(f => f.p.nits)); tot.contrasteMin = Math.min(...filas.map(f => f.p.contraste));
  // posición final de cada proyector (tras resolver choques): distancia óptica–pared, alturas y lens shift
  filas.forEach(f => { if (f.s.tipo === 'suelo') return;
    const hs = inst.S.haces.filter(h => h.fila === f); if (!hs.length) return;
    const q = f.p, sh = (x) => (x.lente.y - (x.y0 + x.y1) / 2) / q.imgH * 100;
    // con varias filas: el desplazamiento mayor, la lente más baja y la imagen conjunta
    const h = hs.reduce((a, x) => (Math.abs(sh(x)) > Math.abs(sh(a)) ? x : a), hs[0]);
    const altoCh = (x) => (x.vert ? x.prod.chasis[0] : x.prod.chasis[2]);
    const bajo = hs.reduce((a, x) => (x.lente.y < a.lente.y ? x : a), hs[0]), alto = hs.reduce((a, x) => (x.lente.y > a.lente.y ? x : a), hs[0]);
    f.pos = { dist: Math.max(...hs.map(x => x.zL)), yLente: Math.min(...hs.map(x => x.lente.y)), y0: Math.min(...hs.map(x => x.y0)), y1: Math.max(...hs.map(x => x.y1)), techo: esp.tipo === 'sala' ? esp.alto : (esp.sueltas.techo || 0),
      shiftV: sh(h), diag: Math.hypot(q.imgW, q.imgH) / 0.0254,
      apoyo: !!bajo.apoyo, altura: bajo.apoyo ? bajo.lente.y - altoCh(bajo) / 2 : alto.lente.y + altoCh(alto) / 2 + 0.05 }; });
  // v10.56 · por dónde puede ir el proyector (para arrastrarlo en el dibujo de SIMPLE): lo que da el zoom de cada óptica posible con la imagen
  // pedida (la elegida a mano o, en automático, las del catálogo activo), dentro del margen de instalación que se haya dicho. Tramos en metros.
  // v10.64 · también el tramo que solo se alcanza fuera de especificación (imágenes más grandes que las garantizadas): al llegar al límite del
  // carril, el proyector puede seguir por él y el cálculo pasa solo a «fuera de especificación», con su aviso
  let zona = null, zonaN = null, zonaO = null;
  if (esp.tipo !== 'sala' && sup1) {
    const zA = Math.max(0, Number(E.proy.distMin) || 0), zB = Math.max(0, Number(E.proy.distMax) || 0);
    const tramos = (oos) => { const tr = [], z = [];
      lista.forEach(q => { const r = calcularPared(sup1, q, { ...opc, oos, orient: E.proy.orient || 'auto' }); if (r.limite || r.chica) return; const a = Math.max(r.tMin, zA), b = Math.min(r.tMaxZ, zB > 0 ? zB : Infinity); if (b >= a - 1e-9) tr.push([a, Math.max(a, b)]); });
      tr.sort((x, y) => x[0] - y[0]);
      tr.forEach(x => { const u = z[z.length - 1]; if (u && x[0] <= u[1] + 0.005) u[1] = Math.max(u[1], x[1]); else z.push([x[0], x[1]]); });
      return z; };
    zonaN = tramos(false); zonaO = tramos(true); zona = E.proy.oos ? zonaO : zonaN;
  }
  const c = { esp, dist, proyector, prSuelo, filas, tot, autoPropone: auto, consejo, unaImagen, grupos, lx, gan, tipoP, zona, zonaN, zonaO, una, multi: esp.tipo === 'sueltas' && !una };
  c.sombras = inst.S;
  // v10.66 · con una imagen no se llega (no cubre, no cabe, pasa del máximo o sobra más del recorte admitido): se mira el blending
  if (una && hayPared && filas.some(f => f.s.tipo !== 'suelo' && (f.p.fuera || f.p.noCubre || f.p.limite || f.p.chica || Math.max(f.p.recorte, f.p.recorteX) > RECORTE_MULTI + 1e-6))) {
    const alt = calcular(true);
    if (blendLimpio(alt)) {
      if (!E.proy.cuerpo && !E.proy.optica) { alt.multiAuto = true; alt.veredicto = veredicto(alt); return alt; }
      c.multiPosible = { n: alt.tot.n, q: alt.proyector };
    }
  }
  c.elec = electronica(c); c.veredicto = veredicto(c); return c;
}
// coste de una instalación de proyección: primero que quepa, luego que no haya sombras de equipos ni choques, luego menos proyectores y más brillo
function costeInstalacion(filas, S) {
  let n = 0, fuera = 0, limite = 0, nits = Infinity;
  filas.forEach(f => { n += f.p.n; if (f.p.fuera) fuera++; if (f.p.limite || f.p.chica) limite++; nits = Math.min(nits, f.p.nits); });
  const zona = S.zona && S.zona.ok ? S.zona.ancho * S.zona.fondo : 0;
  // v10.63 · también cuenta que no cubra (antes ganaba la que no cubría por llevar menos equipos) y el solape excesivo
  const noCubre = filas.filter(f => f.p.noCubre).length, solape = filas.filter(f => f.s.tipo !== 'suelo' && f.p.solapeRel > SOLAPE_MAX + 1e-6).length;
  return fuera * 1e7 + noCubre * 1e6 + solape * 1.5e6 + (S.conflictos.length + S.choques.length) * 1e5 + (S.obst ? S.obst.length : 0) * 1e4 + limite * 2000 + n * 100 - Math.min(nits, 250) - zona * 2;
}
// v10.63 · UN SOLO VEREDICTO: lo calcula el motor con todo lo que avisa PRO y lo pintan igual PRO (arriba de RESULTADOS y en el PDF) y SIMPLE
// (su semáforo y la lista de avisos). Rojo: no se puede montar así; ámbar: se puede, pero hay algo que corregir. De más a menos grave.
const nombreQ = (q) => (q ? (q.marca ? q.marca + ' ' : '') + q.nombre : '');
// desplazamiento de la lente que pide la colocación frente al que da la óptica (en vertical, el de la sala es el horizontal de la óptica)
const limShift = (f) => { const q = f.proyector; return !q || q.ust || !q.shiftV ? 0 : f.p.vert ? q.shiftH : q.shiftV; };
const pasaShift = (f) => !!f.pos && !!limShift(f) && Math.abs(f.pos.shiftV) > limShift(f) + 0.5;
function veredicto(c) {
  const M = [], R = (k, txt, x) => M.push({ n: 'R', k, txt, ...(x || {}) }), A = (k, txt, x) => M.push({ n: 'A', k, txt, ...(x || {}) });
  if (E.tecnologia === 'led') {
    (c.avisoLed || []).forEach(a => A('catalogo', a));
    if (c.tot && c.elec && !c.elec.proc) A('sinProc', t('sinProc'));
    if (c.tot && E.elec.marca !== 'ninguno' && c.elec && !c.elec.media) A('sinMedia', t('sinMedia'));
    c.filas.filter(f => f.r && f.r.quitados).forEach(f => A('puerta', t('puertaLed', { n: f.nombre, c: f.r.quitados, w: fmt(f.r.huecos.reduce((a, x) => a + x.w, 0), 2), h: fmt(Math.max(...f.r.huecos.map(x => x.h)), 2) })));
  } else if (c.tot && c.filas.length) {
    const pw = c.filas.filter(f => f.s.tipo !== 'suelo'), nom = (L) => L.map(f => f.nombre).join(' · '), S = c.sombras || {}, con = Math.round(c.tot.contrasteMin * 10) / 10;   // el color va con el número que se lee
    if (c.consejo) R('consejo', t('noValeProy', { a: c.consejo.nombre }));
    else if (c.multiPosible) A('multiPosible', t('vMultiPosible', { n: c.multiPosible.n }));
    if (pw.some(f => f.p.noCubre)) R('noCubre', t('noCubre'));
    { const L = pw.filter(f => f.p.fuera); if (L.length) R('fuera', t('fuera') + ': ' + nom(L) + '.'); }
    { const L = pw.filter(f => f.p.chica); if (L.length) R('chica', t('chica') + ': ' + nom(L) + '.'); }
    if ((S.choques || []).length) R('choques', t('vChoques', { k: S.choques.length }));
    if ((S.conflictos || []).length) R('conflictos', t('vConflictos'));
    if (c.esp.tipo === 'sala' && S.zona && !S.zona.ok) R('zona', t('segNo'));
    (S.obst || []).forEach(k => R('obst', t('obstSombra', { k: k.k + 1, n: k.nombres.join(' · ') })));
    if (con < 7) R('contraste', t('vConR'));
    { const L = pw.filter(f => f.p.limite); if (L.length) A('limite', t('limite') + ': ' + nom(L) + '.'); }
    pw.filter(f => f.p.solapeRel > SOLAPE_MAX + 1e-6).forEach(f => A('solape', t('vSolape', { p: fmt(f.p.solapeRel * 100, 0), n: f.nombre }) + (c.unaImagen ? ' ' + t('vSolapeUna', { b: nombreQ(c.unaImagen) }) : '')));
    // v10.69 · solape entre el recomendable (45 %) y el máximo (65 %): posible, con aviso
    pw.filter(f => f.p.solapeRel > SOLAPE_RECO + 1e-6 && f.p.solapeRel <= SOLAPE_MAX + 1e-6).forEach(f => A('solapeMedio', t('vSolapeMedio', { p: fmt(f.p.solapeRel * 100, 0), n: f.nombre, r: fmt(SOLAPE_RECO * 100, 0) })));
    pw.filter(f => Math.max(f.p.recorte, f.p.recorteX) > RECORTE_MAX + 1e-6).forEach(f => A('recorte', t('vRecorte', { p: fmt(Math.max(f.p.recorte, f.p.recorteX) * 100, 0), n: f.nombre })));
    if (pw.some(f => f.p.fueraZoom && !f.p.noCubre)) A('zoom', t('fueraZoom'));
    { const L = pw.filter(pasaShift); if (L.length) A('shift', t('vShift', { s: nom(L) })); }
    pw.filter(f => f.pos && f.pos.techo > 0 && f.pos.y1 > f.pos.techo + 0.005).forEach(f => A('techo', t('vTecho', { n: f.nombre, d: fmt(f.pos.y1 - f.pos.techo, 2) })));
    pw.filter(f => f.pos && f.pos.y0 < -0.005).forEach(f => A('suelo', t('vSuelo', { n: f.nombre, d: fmt(-f.pos.y0, 2) })));
    if (c.tipoP === 'pared' && !E.proy.pubNS) (S.franjas || []).filter(f => f.prof > c.dist).forEach(f => A('publico', t('segPublico', { d: fmt(c.dist, 1), n: f.nombre })));
    if (c.multiAuto) A('multiAuto', t('vMultiAuto', { n: c.tot.n }));
    else if (c.multi && pw.some(f => f.p.n > 1)) A('multi', t('vMulti', { n: c.tot.n }));
    if (E.proy.oos) A('oos', t('vOos'));
    if (c.autoPropone) A('auto', t('mejorModelo', { a: c.proyector.nombre, b: c.autoPropone.nombre }));
    const x = c.elec || {}, eq = E.elec.proyEq || 'media';
    if (eq === 'media' && !x.media) A('sinMedia', t('sinMedia')); else if (eq === 'blend' && !x.blend) A('sinBlend', t('sinBlend', { n: x.need || 0 }));
    if (con >= 7 && con < 15) A('contraste', t('vConA'));
  }
  M.sort((a, b) => (a.n === 'R' ? 0 : 1) - (b.n === 'R' ? 0 : 1));
  return { nivel: M.some(m => m.n === 'R') ? 'R' : M.length ? 'A' : 'V', motivos: M };
}
// la lista del veredicto en PRO: arriba de RESULTADOS (y en el PDF), con los botones para corregir donde los hay
function vistaVeredicto(c) {
  const V = c.veredicto; if (!V || !V.motivos.length) return '';
  const li = V.motivos.map(m => {
    let txt = m.txt, bt = '';
    if (m.k === 'consejo') { const k = c.consejo, nb = k.alt ? nombreQ(k.alt) : ''; txt += (k.oos ? ` ${t('noValeOos')} ${t('oosCorto')}` : '') + (k.alt ? ` ${t('noValeAlt', { b: nb })}` : '');
      bt = (k.oos ? `<button type="button" class="av-bt" data-accion="consejo-oos">${t('noValeOosBt')}</button>` : '') + (k.alt ? `<button type="button" class="av-bt" data-accion="consejo-alt">${t('noValeAltBt', { b: nb })}</button>` : '') + (c.multiPosible ? `<button type="button" class="av-bt" data-accion="proy-multi" data-v="1">${t('vMultiBtN', { n: c.multiPosible.n })}</button>` : ''); }
    else if (m.k === 'multiPosible') bt = `<button type="button" class="av-bt" data-accion="proy-multi" data-v="1">${t('vMultiBt')}</button>`;
    else if (m.k === 'multi' || m.k === 'multiAuto') bt = m.k === 'multi' ? `<button type="button" class="av-bt" data-accion="proy-multi" data-v="0">${t('vUnaSolaBt')}</button>` : '';
    else if (m.k === 'solape' && c.unaImagen) bt = `<button type="button" class="av-bt" data-accion="una-imagen">${t('vUnaBt', { b: nombreQ(c.unaImagen) })}</button>`;
    else if (m.k === 'oos') { const o = oosDatos(c); txt = `<b>⚠ ${t('oos')}.</b> ${t('oosAviso')} ${o ? oosUsaTxt(o) : ''} ${t('oosReco')}`; }
    return `<li class="${m.n === 'R' ? 'mal' : 'amb'}">${txt}${bt ? `<span class="av-fila">${bt}</span>` : ''}</li>`;
  });
  return `<ul class="avisos av-arriba veredicto">${li.join('')}</ul>`;
}
// puertas (solo en sala, en paredes) y obstáculos del espacio
const puertasDe = (esp) => (esp.tipo === 'sala' ? (esp.obst || []).filter(o => o.tipo === 'puerta') : []);
const obstaculosDe = (esp) => (esp.obst || []).filter(o => o.tipo === 'obstaculo').map(o => obstaculoMundo(o, esp));
// Electrónica de control (LED) y mediaserver (LED y proyección) con el motor común (comun/electronica.js)
function electronica(c) {
  const e = E.elec, out = { procesadores: [], proc: null, medias: [], media: null, need: 0 };
  if (E.tecnologia === 'led' && c.tot) {
    let L = 1; c.filas.forEach(f => { if (f.r) { f.lin = [L, L + f.r.lineas - 1]; L += f.r.lineas; } });
    const porSup = c.esp.tipo === 'sueltas' ? c.filas.map(f => (f.r ? f.r.lineas : 0)) : null;   // v7.9 · pantallas separadas: conversores por pantalla
    out.procesadores = ELEC.calcularElectronicas({ lines: c.tot.lineas, totalPix: c.tot.pix, porSup, resW: c.tot.resW, resH: c.tot.resH }, { backup: e.backup, escalador: e.escalador, conexion: e.conexion, entradas: 0 }, []);
    out.proc = out.procesadores.find(x => x.key === e.sel) || out.procesadores[0] || null;
    out.need = Math.max(1, c.tot.salidas4k);
  } else if (c.tot) out.need = Math.max(1, c.tot.n);
  // v10.39 · proyección: procesador con edge blending propio (PIXELHUE, sin mediaserver), mediaserver NovaStar (warping y blending) o nada
  if (E.tecnologia !== 'led') {
    const eq = e.proyEq || 'media';
    if (eq === 'blend' && out.need) {
      const px = Math.max(0, ...[c.proyector, c.prSuelo].filter(Boolean).map(q => (q.resX || 0) * (q.resY || 0)));
      out.clase = px > 2560 * 1600 ? 'k4' : px > 1920 * 1080 ? 'wuxga' : 'fhd';
      out.blends = ELEC.calcularBlending(out.need, out.clase); out.blend = out.blends.find(x => x.id === e.selBlend) || out.blends[0] || null;
    } else if (eq === 'media' && out.need) {
      out.medias = ELEC.calcularMediaservers({ totalPix: out.need * ELEC.ELEC_PX_4K }, { marca: 'todos', dante: e.dante, soloMedia: true });
      out.media = out.medias.find(x => x.id === e.selMedia) || out.medias[0] || null;
    }
    return out;
  }
  if (e.marca !== 'ninguno' && out.need) {
    out.medias = ELEC.calcularMediaservers({ totalPix: out.need * ELEC.ELEC_PX_4K }, { marca: e.marca, dante: e.dante });
    out.media = out.medias.find(x => x.id === e.selMedia) || out.medias[0] || null;
  }
  return out;
}
// distancia disponible delante de cada pared para el proyector (la pared opuesta, con 0,3 m de margen)
function alcance(esp, s, dist) {
  if (esp.tipo !== 'sala') return Math.max(1, dist + 3);
  return (s.id === 'frontal' || s.id === 'trasera' ? esp.fondo : esp.ancho) - 0.3;
}

// ---------- plantilla ----------
const tog = (on, attrs, txt, extra = '') => `<button type="button" class="tog${on ? ' on' : ''}" aria-pressed="${on}" ${attrs} ${extra}>${txt}</button>`;
// casilla numérica: se escribe directamente o se cambia con ▲▼ (como en el cálculo de una pantalla); mantener pulsado repite y acelera
const FLECHA = (d) => `<svg viewBox="0 0 10 6" aria-hidden="true"><path d="${d > 0 ? 'M5 .5 9.5 5.5H.5z' : 'M.5 .5h9L5 5.5z'}" fill="currentColor"/></svg>`;
const numIn = (k, val, uni, paso = 0.1, min = 0, max = 60) => `<div class="num"><input type="number" inputmode="decimal" data-num="${k}" value="${val}" step="${paso}" min="${min}" max="${max}"><span>${uni}</span><div class="flechas">` +
  `<button type="button" class="flecha" data-flecha="1" data-k="${k}" tabindex="-1" aria-label="${t('subirV')}">${FLECHA(1)}</button><button type="button" class="flecha" data-flecha="-1" data-k="${k}" tabindex="-1" aria-label="${t('bajarV')}">${FLECHA(-1)}</button></div></div>`;
let CID = 0;   // v10.48 · cada campo con su etiqueta asociada (lectores de pantalla y toque en la etiqueta)
const campo = (lab, html) => { const id = 'cp' + (++CID), h = /<(input|select|textarea)\b(?![^>]*\sid=)/.test(html) ? html.replace(/<(input|select|textarea)\b(?![^>]*\sid=)/, `<$1 id="${id}"`) : null; return `<div class="campo"><label${h ? ` for="${id}"` : ''}>${lab}</label>${h || html}</div>`; };

// ---------- fichas de equipo (componente común comun/ficha.js) ----------
// los textos del motor común de electrónica están en castellano: aquí se pasan a inglés o catalán (reglas en comun/motor-i18n.js, compartidas con la portada)
const MOTOR = globalThis.SC_MOTOR;
const trMotor = (txt) => { let r = String(txt || ''); (MOTOR[idioma()] || []).forEach(([a, b]) => { r = r.replace(a, b); }); return r; };
// v10.70 · cabinets de todo el proyecto (todas las superficies): van del mismo batch
const totalCab = (c) => ((c && c.filas) || []).reduce((s, f) => s + ((f.r && f.r.cab) || 0), 0);
function fichaCab(m, nCab) {
  const cabe = cabeEnBatch(m, nCab);
  return fichaHTML({ cat: t('fCab'), icono: 'led', marca: m.family || '', modelo: m.crm, foto: m.urlFoto, fotoTrasera: m.urlFotoTrasera || m.urlTrasera || m.urlFoto2, vistas: m.fotos, acento: '#b566ff', stock: enStock(m), nivel: nivelStock(m), avisos: cabe === false ? [t('avBatch')] : [],
    specs: [[t('kPitch'), m.pitch + ' mm'], [t('kCab'), `${m.cabAncho}×${m.cabAlto}${m.thick ? '×' + m.thick : ''} mm`], [t('kPx'), `${m.cabPixAncho}×${m.cabPixAlto}`], [t('kNits'), m.nits ? m.nits + ' nits' : ''], [t('kHz'), m.hz ? m.hz + ' Hz' : ''],
      [t('kKg'), m.cabKg ? fmt(m.cabKg, 1) + ' kg' : ''], [t('kW'), m.wMax ? fmt(m.wMax, 0) + ' W' : ''], [t('kCard'), m.card || ''], [t('kTech'), m.tech || '']],
    enlace: m.crm ? 'https://traulux.net/buscar/?q=' + encodeURIComponent(m.crm) : '', enlaceTxt: t('fichaFab') });
}
// Epson: manual y especificaciones en setupnavi (referencia absoluta) y enlace de verificación del fabricante
const epsonManual = (q) => `https://support.epson.net/setupnavi/?MKN=${encodeURIComponent(q.modelo)}&PINF=support&LG2=${({ es: 'ES', en: 'EN', ca: 'CA' })[idioma()] || 'ES'}&OSC=MI`;
const EPSON_CALC = 'https://support.epson-europe.com/TDS/#/page/advanceMode';
const VIVITEK_SIM = 'https://www.vivitekcorp.com/simulator/';   // v10.57 · herramienta oficial de Vivitek, para verificar
const ADMIN_URL = 'https://script.google.com/macros/s/AKfycbwkc12y4LODbFe-kQidnR2MbbA6cbW1WbhU3UiqmDmshx-ncAdGYrFRy8PNjm9Wg6Mx3w/exec';
// relación de proyección de una combinación cuerpo + óptica («0,35:1» o «1,57–2,56:1»)
const trTxt = (q) => (q.trMin === q.trMax ? fmt(q.trMin, 2) : fmt(q.trMin, 2) + '–' + fmt(q.trMax, 2)) + ':1';
function fichaProy(q, cat) {
  return fichaHTML({ cat, icono: 'proy', marca: q.marca, modelo: q.nombre, claveFoto: q.modelo, foto: q.imagen, fotoTrasera: q.trasera, acento: '#00b4ff',
    enlaces: q.marca === 'EPSON' ? [[epsonManual(q), t('epsonManual')], [EPSON_CALC, t('epsonCalc')]] : q.marca === 'VIVITEK' ? [[VIVITEK_SIM, t('vivitekSim')]] : [],
    specs: [[t('kTR'), trTxt(q)], [t('kLm'), fmtPx(q.lumens) + ' lm'], [t('kFmt'), q.arTxt], [t('kRes'), q.resX + '×' + q.resY], [t('kDiag'), isFinite(q.maxDiagPulg) ? (q.minDiagPulg ? q.minDiagPulg + '–' : '') + q.maxDiagPulg + '"' : q.minDiagPulg ? '≥ ' + q.minDiagPulg + '"' : ''], [t('k4k'), q.k4nativo ? '4K' : q.k4 ? 'Enhancement' : '—'],
      [t('kShift'), q.shiftV ? `${q.shiftSube ? '+' : '±'}${q.shiftV} % / ±${q.shiftH} %` : '']] });
}
function fichaProc(x) {
  return fichaHTML({ cat: x.reproductor ? t('reproCat') : t('procesador'), icono: 'elec', marca: x.marca, modelo: x.modelo, foto: x.front, fotoTrasera: x.back, acento: '#00ff04', stock: x.enStock ? true : null,
    specs: [[t('puertos'), trMotor(x.puertos)], [t('capacidad'), trMotor(x.capacidad)], [t('kEsc'), x.escalador ? t('si') : t('no')]], notas: [trMotor(x.resumen || ''), x.reproductor ? t('reproNota') : ''].filter(Boolean), enlaces: enlacesEq(x),
    piezas: (x.equipos || []).map(q => ({ cant: q.cant, ref: q.ref, desc: trMotor(q.desc) })), enlace: x.urlFab || x.url, enlaceTxt: t('fichaFab') });
}
// v10.40 · enlaces de cada equipo: página del fabricante, ficha técnica en PDF y, si la hay, la de Charmex
const enlacesEq = (m) => [[m.pdf, t('fichaPdf')], m.urlFab && m.url ? [m.url, 'Charmex'] : null].filter(x => x && x[0]);
function fichaBlend(m) {
  return fichaHTML({ cat: t('procBlend'), icono: 'elec', marca: m.marca, modelo: m.modelo, acento: '#ffb000',
    specs: [[t('salProyK'), m.cap], [t('necesita'), m.need], [t('entradasK'), m.inp], [t('dante'), m.dante ? t('si') : t('no')]], notas: [trMotor(m.resumen), t('blendNota')], enlace: m.urlFab || m.url, enlaceTxt: t('fichaFab'), enlaces: enlacesEq(m) });
}
function fichaMedia(m, need, led) {
  return fichaHTML({ cat: m.tipo === 'switcher' ? t('switcherCat') : t('mediaserver'), icono: 'media', marca: m.marca, modelo: m.modelo, foto: m.front, fotoTrasera: m.back, acento: '#ffb000',
    specs: [[t('salidas4kK'), m.out4k], [t('necesita'), need], [t('dante'), m.dante ? t('si') : t('no')]], notas: [trMotor(m.resumen), led ? t('mediaNotaLed') : t('mediaNotaProy')], enlace: m.urlFab || m.url, enlaceTxt: t('fichaFab'), enlaces: enlacesEq(m) });
}

// v8.5 · consola de 3 zonas: dos columnas de menú que no se mueven («la pantalla» y «el equipo») y el centro, que se desplaza.
// Cada columna tiene siempre los mismos bloques en el mismo orden, sea cual sea el modo: Tipo, Tamaño, Luz y Entorno con CALCULAR
// al pie; Material, Ajuste del equipo y Electrónica con lo elegido al pie. Aquí, lo que el espacio aporta a Tipo, Tamaño y Entorno.
function partesEspacio() {
  const e = E.esp, s = e.sueltas, l = E.led, sala = e.tipo === 'sala' && E.cantidad === 'varias', proy = E.tecnologia === 'proy';
  let tipo = '', tam = '', ent = '';
  if (proy) tipo += bloqueTipo();   // en proyección, el tipo (mapping, pared o sala inmersiva) sustituye a SALA / PANTALLAS
  else {
    if (E.cantidad === 'varias') tipo += `<div class="fila c2">${tog(e.tipo === 'sala', 'data-set="esp.tipo" data-v="sala"', t('sala'))}${tog(e.tipo === 'sueltas', 'data-set="esp.tipo" data-v="sueltas"', t('pantallas'))}</div>`;
    // v10.34 · entorno y uso, los mismos botones (e iconos) que la portada
    const ti = (on, attrs, ico, txt, extra) => tog(on, attrs, ICO_EU[ico] + `<span>${txt}</span>`, extra);
    tipo += `<div class="fila c2 eu">${ti(l.tipo === 'INDOOR', 'data-set="led.tipo" data-v="INDOOR"', 'eInt', t('euInt'))}${ti(l.tipo === 'OUTDOOR', 'data-set="led.tipo" data-v="OUTDOOR"', 'eExt', t('euExt'))}</div>`;
    tipo += `<div class="fila c2 eu">${ti(l.tipo === 'ESCAPARATE', 'data-set="led.tipo" data-v="ESCAPARATE"', 'eEsc', t('euEsc'))}${ti(!!l.transp, `data-set="led.transp" data-v="${l.transp ? 0 : 1}" data-bool="1" title="${t('euTranspT')}"`, 'eTra', t('euTransp'))}</div>`;
    tipo += `<div class="fila c2 eu">${ti(l.clase === 'INSTALL', 'data-set="led.clase" data-v="INSTALL"', 'eFija', t('euFija'))}${ti(l.clase === 'RENTAL', 'data-set="led.clase" data-v="RENTAL"', 'eAlq', t('euAlq'))}</div>`;
    if (l.tipo !== 'INDOOR') tipo += `<div class="fila c2 eu">${ti(l.sol === 'directo', `data-set="led.sol" data-v="${l.sol === 'directo' ? '' : 'directo'}" title="${t('euSolDT', { n: SOL_DIRECTO })}"`, 'eSol', t('euSolD'))}${ti(l.sol === 'indirecto', `data-set="led.sol" data-v="${l.sol === 'indirecto' ? '' : 'indirecto'}" title="${t('euSolIT', { a: SOL_INDIRECTO, b: SOL_DIRECTO })}"`, 'eNube', t('euSolI'))}</div>`;
    const forzado = salaLed() && l.tipo === 'INDOOR';
    tipo += `<div class="fila c2 eu">${ti(!!l.gold, `data-set="led.gold" data-v="${l.gold ? 0 : 1}" data-bool="1" title="${t('euMarT')}"`, 'eMar', t('euMar'))}${ti(protegidoLed(), forzado ? `data-nada="1" title="${t('euPubSala')}"` : `data-set="led.protegido" data-v="${l.protegido ? 0 : 1}" data-bool="1" title="${t('euPubT')}"`, 'ePub', t('euPub'), forzado ? 'aria-disabled="true"' : '')}</div>`;
    const nl = nitsLista(), nv = +l.nitsMin || 0;
    tipo += `<div class="fila nits"><span class="etq">${t('euNits')}</span><button type="button" class="sec-btn" data-accion="nits" data-d="-1" aria-label="${t('euNitsMenos')}"${nv ? '' : ' disabled'}>−</button><b class="mono">${nv ? nv : t('euNitsAuto')}</b><button type="button" class="sec-btn" data-accion="nits" data-d="1" aria-label="${t('euNitsMas')}"${nl.some(x => x > nv) ? '' : ' disabled'}>+</button></div>`;
    if (avisoLed.length) tipo += `<p class="aviso">${avisoLed.join(' ')}</p>`;
  }
  if (sala) {
    tam += `<div class="fila c3">${campo(t('ancho'), numIn('esp.ancho', e.ancho, 'm', 0.1, 1, 60))}${campo(t('fondo'), numIn('esp.fondo', e.fondo, 'm', 0.1, 1, 60))}${campo(t('alto'), numIn('esp.alto', e.alto, 'm', 0.1, 1.5, 20))}</div>`;
    const tp = (k) => tog(e.paredes[k], `data-pared="${k}"`, t(k), E.tecnologia === 'led' && k === 'suelo' ? `disabled title="${t('sueloLed')}"` : '');
    tam += `<div class="etq">${t('superficies')}</div><div class="fila c3">${['frontal', 'izquierda', 'derecha'].map(tp).join('')}</div><div class="fila c2">${['trasera', 'suelo'].map(tp).join('')}</div>`;
    if (E.tecnologia === 'led') tam += `<p class="ayuda">${t('sueloLed')}</p>`;
    ent += `<div class="fila c2">${campo(t('altoPant'), numIn('esp.altoCubierto', e.altoCubierto, 'm', 0.1, 0, 20))}${campo(t('elev'), numIn('esp.elev', e.elev, 'm', 0.1, 0, 10))}</div><p class="ayuda">${t('altoAyuda')}</p>`;
    if (ajuste.esp) ent += `<p class="aviso">${ajuste.esp}</p>`;
  } else {
    const ledV = E.cantidad === 'varias' && !proy;   // v10.63 · varias LED: hasta 4, cada una con su medida
    if (ledV) { if (s.n > LED_MAX) s.n = LED_MAX; s.tams = tamsLed(s); }
    if (E.cantidad === 'varias') tam += `<div class="fila c2">${campo(t('num'), numIn('esp.sueltas.n', s.n, 'u', 1, 2, ledV ? LED_MAX : 8))}<div class="campo"><label>${t('disp')}</label><div class="fila c2">${tog(s.disp === 'linea', 'data-set="esp.sueltas.disp" data-v="linea"', t('linea'))}${tog(s.disp === 'arco', 'data-set="esp.sueltas.disp" data-v="arco"', t('arco'))}</div></div></div>`;
    // auditorio: pantalla central de otra medida que las laterales (desde 3 pantallas)
    const cen = E.cantidad === 'varias' && s.n >= 3 && !ledV;
    if (cen) tam += `<div class="fila c2">${tog(!s.central, 'data-set="esp.sueltas.central" data-v="0" data-bool="1"', t('mismaMedida'))}${tog(!!s.central, 'data-set="esp.sueltas.central" data-v="1" data-bool="1"', t('centralDistinta'))}</div>`;
    if (cen && s.central) {
      tam += `<div class="fila c2">${campo(t('anchoCentral'), numIn('esp.sueltas.cAncho', s.cAncho, 'm', 0.1, 0.3, 40))}${campo(t('altoCentral'), numIn('esp.sueltas.cAlto', s.cAlto, 'm', 0.1, 0.3, 20))}</div>`;
      tam += `<div class="fila c2">${campo(t('anchoLat'), numIn('esp.sueltas.ancho', s.ancho, 'm', 0.1, 0.3, 40))}${campo(t('altoLat'), numIn('esp.sueltas.alto', s.alto, 'm', 0.1, 0.3, 20))}</div><p class="ayuda">${t('centralAyuda')}</p>`;
    } else if (ledV) { s.tams.forEach(([w, h], i) => { tam += `<div class="fila c2">${campo(t('pantalla') + ' ' + (i + 1) + ' · ' + t('ancho'), numIn('esp.sueltas.tams.' + i + '.0', w, 'm', 0.1, 0.3, 40))}${campo(t('pantalla') + ' ' + (i + 1) + ' · ' + t('alto'), numIn('esp.sueltas.tams.' + i + '.1', h, 'm', 0.1, 0.3, 20))}</div>`; }); tam += `<p class="ayuda">${t('ledMax4')}</p>`; }
    else tam += `<div class="fila c2">${campo(t('ancho'), numIn('esp.sueltas.ancho', s.ancho, 'm', 0.1, 0.3, 40))}${campo(t('alto'), numIn('esp.sueltas.alto', s.alto, 'm', 0.1, 0.3, 20))}</div>`;
    if (E.cantidad === 'varias') { const sepF = campo(t('sep'), numIn('esp.sueltas.sep', s.sep, 'm', 0.05, 0, 10));
      tam += s.disp === 'arco' ? `<div class="fila c2">${sepF}${campo(t('angulo'), numIn('esp.sueltas.angulo', s.angulo, '°', 1, 0, 90))}</div>` : `<div class="fila c1">${sepF}</div>`; }
    ent += `<div class="fila c2">${campo(t('elev'), numIn('esp.sueltas.elev', s.elev, 'm', 0.1, 0, 10))}${campo(t('dist'), numIn('esp.sueltas.dist', s.dist, 'm', 0.1, 0.5, 100))}</div>`;
    if (proy && tipoProy() !== 'mapping') ent += `<div class="fila c1">${campo(t('techoAlto'), numIn('esp.sueltas.techo', s.techo, 'm', 0.1, 0, 30))}</div><p class="ayuda">${t('techoAyuda')}</p>`;
  }
  ent += bloqueObst(sala);
  // resumen de una línea de cada bloque (lo que se lee cuando está plegado)
  const rTipo = proy ? t('tp_' + tipoProy()) : (E.cantidad === 'varias' ? t(sala ? 'sala' : 'pantallas') + ' · ' : '') + t({ INDOOR: 'euInt', OUTDOOR: 'euExt', ESCAPARATE: 'euEsc' }[l.tipo] || 'euInt') + ' · ' + t(l.clase === 'RENTAL' ? 'euAlq' : 'euFija') + (protegidoLed() ? ' · ' + t('euPub') : '') + (l.gold ? ' · ' + t('euMar') : '') + (l.transp ? ' · ' + t('euTransp') : '');
  const rTam = sala ? `${fmt(e.ancho)} × ${fmt(e.fondo)} × ${fmt(e.alto)} m` : E.cantidad === 'varias' && !proy ? s.tams.map(x => `${fmt(x[0])} × ${fmt(x[1])}`).join(' · ') + ' m' : `${E.cantidad === 'varias' ? s.n + ' × ' : ''}${fmt(s.ancho)} × ${fmt(s.alto)} m`;
  const rEnt = sala ? `${t('elev')} ${fmt(e.elev)} m` : `${t('elev')} ${fmt(s.elev)} m · ${fmt(s.dist, 1)} m`;
  return { tipo, tam, ent, rTipo, rTam, rEnt, sala };
}
// puertas y obstáculos: cada uno en una fila con sus medidas y un botón para quitarlo
function bloqueObst(sala) {
  const e = E.esp, L = e.obst || [];
  let h = `<div class="etq">${t('obstTit')}</div><div class="fila ${sala ? 'c2' : 'c1'}">${sala ? `<button type="button" class="sec-btn" data-accion="obst-add" data-tipo="puerta">＋ ${t('puerta')}</button>` : ''}<button type="button" class="sec-btn" data-accion="obst-add" data-tipo="obstaculo">＋ ${t('obst')}</button></div>`;
  if (ajuste.obst) h += `<p class="aviso">${ajuste.obst}</p>`;
  L.forEach((o, i) => {
    if (o.tipo === 'puerta' && !sala) return;
    const k = 'esp.obst.' + i;
    h += `<div class="obst"><div class="obst-cab"><b>${o.tipo === 'puerta' ? t('puerta') : t('obst')} ${L.slice(0, i + 1).filter(x => x.tipo === o.tipo).length}</b>${o.tipo === 'puerta' ? `<select class="sel" data-sel="${k}.pared">${['frontal', 'izquierda', 'derecha', 'trasera'].map(w => `<option value="${w}"${o.pared === w ? ' selected' : ''}>${t(w)}</option>`).join('')}</select>` : '<span></span>'}<button type="button" class="sec-btn quitar" data-accion="obst-del" data-i="${i}" aria-label="${t('quitar')}" title="${t('quitar')}">✕</button></div>`;
    h += o.tipo === 'puerta'
      ? `<div class="fila c3">${campo(t('desdeIzq'), numIn(k + '.x', o.x, 'm', 0.1, 0, 60))}${campo(t('ancho'), numIn(k + '.ancho', o.ancho, 'm', 0.1, 0.5, 20))}${campo(t('alto'), numIn(k + '.alto', o.alto, 'm', 0.1, 1, 10))}</div>`
      : `<div class="fila c2">${campo(sala ? t('aIzq') : t('desp'), numIn(k + '.x', o.x, 'm', 0.1, sala ? 0 : -60, 60))}${campo(sala ? t('aFrontal') : t('delante'), numIn(k + '.z', o.z, 'm', 0.1, 0, 60))}</div><div class="fila c3">${campo(t('ancho'), numIn(k + '.ancho', o.ancho, 'm', 0.1, 0.1, 20))}${campo(t('fondo'), numIn(k + '.fondo', o.fondo, 'm', 0.1, 0.1, 20))}${campo(t('alto'), numIn(k + '.alto', o.alto, 'm', 0.1, 0.1, 20))}</div>`;
    h += '</div>';
  });
  return h;
}
function partesLed(c) {
  const l = E.led, lista = c.lista || [];
  const opts = lista.map(m => `<option value="${m.crm}"${m.crm === l.crm ? ' selected' : ''}>[${m.pitch}p] ${m.crm}</option>`).join('');
  let mat = '';
  if (estadoCat === 'cargando' && !catalogo.length) mat += `<p class="ayuda">${t('cargando')}</p>`;
  else if (!catalogo.length) mat += `<p class="aviso">${t('sinCat')}</p>`;
  mat += campo(t('modelo'), `<select class="sel" data-sel="led.crm"><option value="">${t('auto')}${c.modelo && !l.crm ? ' · [' + c.modelo.pitch + 'p] ' + c.modelo.crm : ''}</option>${opts}</select>`);
  mat += `<p class="ayuda">${t('autoAyudaLed', { d: fmt(c.dist, 1) })}</p>`;
  const aj = `<div class="fila c2">${tog(l.ajuste === 'dentro', 'data-set="led.ajuste" data-v="dentro"', t('dentro'))}${tog(l.ajuste === 'cercano', 'data-set="led.ajuste" data-v="cercano"', t('cercano'))}</div><p class="ayuda">${t('ajusteAyuda')}</p>`;
  const m = c.modelo;
  return { mat, aj, fichas: m ? fichaCab(m, totalCab(c)) : '', rMat: m ? (l.crm ? '' : 'AUTO · ') + m.crm : t('auto'), rAj: t(l.ajuste === 'cercano' ? 'cercano' : 'dentro'),
    eleg: m ? { nom: m.crm, dat: [m.pitch + ' mm', `${m.cabAncho}×${m.cabAlto} mm`, m.nits ? m.nits + ' nits' : ''].filter(Boolean).join(' · ') } : null };
}
function partesProy(c) {
  const p = E.proy, sel = c.proyector, haySuelo = c.filas.some(f => f.s.tipo === 'suelo'), paredes = c.filas.filter(f => f.s.tipo !== 'suelo');
  const mAct = marcasActivas();
  let mat = '', aj = bloquePos(c), luz = '', fic = '';   // v8.5 · la posición del proyector abre el bloque «Ajuste del equipo»
  // 2) proyector (cuerpo) y después su óptica, solo entre las compatibles (guía de ópticas de Epson)
  // v10.54 · marcas con las que se calcula: botones que se encienden y se apagan (siempre queda una)
  // v10.57 · sin rótulo encima (los nombres de marca se explican solos): con el proyector y la óptica elegidos, el bloque no cabía en un portátil
  if (MARCAS_PROY.length > 1) mat += `<div class="fila c${Math.min(3, MARCAS_PROY.length)}" role="group" aria-label="${t('marcasProy')}">${MARCAS_PROY.map(m => tog(mAct.includes(m), `data-accion="marca-proy" data-v="${m}" title="${t('marcasProyTit')}"`, m)).join('')}</div>`;
  // v10.57 · con más de una marca, los proyectores van agrupados por marca
  const opCu = (l) => l.map(q => `<option value="${q.modelo}"${q.modelo === p.cuerpo ? ' selected' : ''}>${q.modelo} · ${fmtPx(q.lumens)} lm</option>`).join(''), cuAct = CUERPOS.filter(q => mAct.includes(q.marca));
  const opCuerpos = mAct.length > 1 ? mAct.map(m => `<optgroup label="${m}">${opCu(cuAct.filter(q => q.marca === m))}</optgroup>`).join('') : opCu(cuAct);
  mat += campo(t('proyector'), `<select class="sel" data-sel="proy.cuerpo"><option value="">${t('auto')}${!p.cuerpo && sel ? ' · ' + sel.nombre : ''}</option>${opCuerpos}</select>`);
  const lentes = p.cuerpo ? PROYECTORES.filter(q => q.modelo === p.cuerpo && q.optica) : [];
  if (lentes.length) mat += campo(t('optica'), `<select class="sel" data-sel="proy.optica"><option value="">${t('auto')}${!p.optica && sel && sel.optica ? ' · ' + sel.optica : ''}</option>${lentes.map(q => `<option value="${q.optica}"${q.optica === p.optica ? ' selected' : ''}>${q.optica} · ${trTxt(q)}${q.ust ? ' · UST' : ''}</option>`).join('')}</select>`);
  if (haySuelo && paredes.length) mat += campo(t('proySuelo'), `<select class="sel" data-sel="proy.idSuelo"><option value="">${t('auto')}${c.prSuelo ? ' · ' + c.prSuelo.nombre : ''}</option>${sel ? PROYECTORES.filter(q => q.marca === sel.marca).map(q => `<option value="${q.id}"${q.id === p.idSuelo ? ' selected' : ''}>${q.nombre} · ${fmtPx(q.lumens)} lm</option>`).join('') : ''}</select>`);   // v10.63 · de la misma marca
  // 3) orientación del proyector (la posición va arriba, en el espacio, como dato principal)
  aj += `<div class="campo"><label>${t('orientacion')}</label><div class="fila c3">${['auto', 'horizontal', 'vertical'].map(v => tog((p.orient || 'auto') === v, `data-set="proy.orient" data-v="${v}"`, t('or_' + v))).join('')}</div></div>`;
  if (paredes.some(f => f.p.vert)) aj += `<p class="ayuda">${t('enVertical')}</p>`;
  // 4) blending
  // v10.66 · en pantallas y fachadas: una imagen por pantalla (por defecto) o multiproyección; el solape solo se enseña cuando hay blending
  const esPant = c.esp.tipo === 'sueltas', conBlend = !esPant || !!p.multi || !!c.multiAuto;
  if (esPant) aj += `<div class="etq">${t('imgPant')}</div><div class="fila c2">${tog(!conBlend, 'data-accion="proy-multi" data-v="0"', t('unaImg'))}${tog(conBlend, 'data-accion="proy-multi" data-v="1"', t('multiImg'))}</div>`;
  if (conBlend) aj += `<div class="etq">${t('solape')}</div><div class="fila c3">${[15, 20, 25].map(v => tog(p.solape === v, `data-set="proy.solape" data-v="${v}" data-num-v="1"`, v + ' %')).join('')}</div>`;
  // 5) luz de la sala según el uso, y ganancia de la pantalla
  const uso = (USOS_LUZ.find(u => u[0] === p.luzUso && u[1] === Number(p.lux)) || [''])[0];
  luz += campo(t('luzUso'), `<select class="sel" data-uso="1"><option value=""${uso ? '' : ' selected'}>${t('uso_personal')}</option>${USOS_LUZ.map(u => `<option value="${u[0]}"${u[0] === uso ? ' selected' : ''}>${t('uso_' + u[0])} · ${u[1]} lx</option>`).join('')}</select>`);
  luz += `<div class="fila c2">${campo(t('luzSala'), numIn('proy.lux', p.lux, 'lx', 10, 0, 5000))}${campo(t('ganancia'), numIn('proy.ganancia', p.ganancia, '×', 0.1, 0.1, 5))}</div>`;
  // 6) avanzado: modo fuera de especificación (v10.39: en el bloque Material, junto al proyector; en «Ajuste del equipo» quedaba escondido) (imágenes más grandes que las garantizadas), con aviso, cálculo y recomendación
  // v8.4 · fuera de especificación: el botón activo se resalta en ámbar (no es un ajuste normal)
  mat += `<div class="etq">${t('avanzado')}</div><div class="fila c1"><button type="button" class="tog ambar${p.oos ? ' on' : ''}" aria-pressed="${!!p.oos}" data-accion="proy-oos" title="${t('oosTit')}">⚠ ${t('oos')}</button></div>`;
  if (sel) {
    const med = (d) => { const w = d * 0.0254 * sel.ar / Math.sqrt(1 + sel.ar * sel.ar); return fmt(w, 1) + ' × ' + fmt(w / sel.ar, 1); };
    const usada = Math.max(0, ...paredes.map(f => Math.hypot(f.p.imgW, f.p.imgH) / 0.0254));
    if (p.oos) {
      mat += `<p class="aviso">${t('oosAviso')}</p>`;
      mat += `<p class="ayuda">${sel.maxDiagPulgOOS > sel.maxDiagPulg ? t('oosCalc', { p: sel.nombre, g: fmtPx(sel.maxDiagPulg), gm: med(sel.maxDiagPulg), o: fmtPx(sel.maxDiagPulgOOS), om: med(sel.maxDiagPulgOOS) }) : t(isFinite(sel.maxDiagPulg) ? 'oosNoGana' : 'oosSinMax', { p: sel.nombre, g: fmtPx(sel.maxDiagPulg) })}</p>`;
      if (usada > sel.maxDiagPulg + 0.5) mat += `<p class="aviso">${t('oosUsa', { d: fmtPx(Math.round(usada)), g: fmtPx(sel.maxDiagPulg) })}</p>`;
      mat += `<p class="ayuda">${t('oosReco')}</p>`;
    } else if (paredes.some(f => f.p.limite) && sel.maxDiagPulgOOS > sel.maxDiagPulg) mat += `<p class="ayuda">${t('oosSugerir', { g: fmtPx(sel.maxDiagPulg), o: fmtPx(sel.maxDiagPulgOOS) })}</p>`;
  }
  // 7) fichas de los equipos elegidos y ayudas
  if (sel) fic += fichaProy(sel, t('fProy'));
  if (haySuelo && c.prSuelo && c.prSuelo !== sel) fic += fichaProy(c.prSuelo, t('fProySuelo'));
  fic += `<p class="ayuda">${t('autoAyudaProy')}</p><p class="ayuda">${t('datosProy')}</p>`;
  const dist = paredes.some(f => f.pos) ? fmt(Math.max(...paredes.filter(f => f.pos).map(f => f.pos.dist)), 2) + ' m' : '';
  return { mat, aj, luz, fichas: fic, rMat: sel ? (p.cuerpo ? '' : 'AUTO · ') + sel.nombre : t('auto'), rAj: [dist, t('mo_' + (p.montaje || 'auto')), conBlend ? p.solape + ' %' : t('unaImg')].filter(Boolean).join(' · '), rLuz: `${fmt(p.lux, 0)} lx · ×${fmt(p.ganancia, 1)}`,
    eleg: sel ? { nom: sel.nombre, dat: [fmtPx(sel.lumens) + ' lm', 'TR ' + trTxt(sel), sel.resX + '×' + sel.resY].join(' · ') } : null };
}
// v8.4 · datos principales de proyección, en el orden del datos del fabricante y del de Vivitek: el tipo arriba del todo y, tras la
// superficie, la posición del proyector (primero la distancia y después el montaje con su altura), cada una con su candado
function bloqueTipo() {
  const tp = tipoProy();
  let h = `<div class="campo"><label>${t('tipoProy')}</label><div class="fila c3">${['mapping', 'pared', 'sala'].map(v => tog(tp === v, `data-accion="tipo-proy" data-v="${v}" title="${t('tp_' + v)}"`, t(v === 'sala' ? 'tp_salaCorto' : 'tp_' + v))).join('')}</div></div><p class="ayuda">${t('tpAyuda_' + tp)}</p>`;
  return h;
}
function bloquePos(c) {
  if (!c || !c.filas) return '';
  const p = E.proy, tp = tipoProy(), paredes = c.filas.filter(f => f.s.tipo !== 'suelo'), pared = paredes[0], pos = pared && pared.pos, r2 = (v) => Math.round(v * 100) / 100;
  let h = `<div class="etq">${t('posProy')}</div>`;
  const distFija = Number(p.dist) > 0, distVal = distFija ? Number(p.dist) : (pos ? r2(pos.dist) : 0);
  h += campoLock(t(tp === 'mapping' ? 'distFachada' : 'distOptica'), 'dist', distFija, numIn('proy.dist', distVal, 'm', 0.1, 0, 200), pos || distFija);
  if (!distFija && tp === 'pared' && p.pubNS) h += `<p class="ayuda">${t('pubNSpro')} <button type="button" class="av-bt" data-accion="pub-ns-no">${t('quitar')}</button></p>`;   // v10.54 · «no lo sé» de SIMPLE
  if (!distFija && (Number(p.distMin) > 0 || Number(p.distMax) > 0)) h += `<p class="ayuda">${t('margenInst', { a: Number(p.distMin) > 0 ? fmt(p.distMin, 2) : '0', b: Number(p.distMax) > 0 ? fmt(p.distMax, 2) : '∞' })} <button type="button" class="av-bt" data-accion="quita-margen">${t('quitar')}</button></p>`;   // v10.54 · el margen que se dio en SIMPLE
  if (pared) {
    const a = pared.p.tMin, b = pared.p.tMaxZ;
    if (b - a > 0.02) h += `<div class="rango"><input type="range" data-rango="proy.dist" min="${r2(a)}" max="${r2(b)}" step="0.01" value="${r2(Math.min(b, Math.max(a, distVal)))}" aria-label="${t('rangoZoom')}"><div class="rango-et"><span>${fmt(a, 2)} m</span><span>${t('rangoZoom')}</span><span>${fmt(b, 2)} m</span></div></div>`;
    h += `<p class="ayuda">${distFija ? t('distFija', { d: fmt(p.dist, 2), w: fmt(pared.p.imgW, 2), h: fmt(pared.p.imgH, 2) }) : b - a > 0.02 ? t('distAyuda', { a: fmt(a, 2), b: fmt(b, 2) }) : t('distOpticaFija', { a: fmt(a, 2) })}${paredes.length > 1 ? ' ' + t('distVarias') : ''}</p>`;
  }
  if (c.filas.some(f => f.p.fueraZoom)) h += `<p class="aviso">${t(c.filas.some(f => f.p.noCubre) ? 'noCubre' : 'fueraZoom')}</p>`;
  h += `<div class="campo"><label>${t('montaje')}</label><div class="fila c3">${['auto', 'colgado', 'apoyado'].map(v => tog((p.montaje || 'auto') === v, `data-set="proy.montaje" data-v="${v}"`, t('mo_' + v))).join('')}</div></div>`;
  const altFija = Number(p.altura) > 0, apoyo = p.montaje === 'auto' ? !!(pos && pos.apoyo) : p.montaje === 'apoyado';
  const altVal = altFija ? p.altura : (pos ? r2(pos.altura) : 0);
  h += campoLock(t(apoyo ? 'alturaApoyo' : 'alturaColgado'), 'alt', altFija, numIn('proy.altura', altVal, 'm', 0.1, 0, 200), pos || altFija);
  h += `<p class="ayuda">${t(altFija ? 'alturaFijaAyuda' : apoyo ? 'alturaApoyoAyuda' : 'alturaColgadoAyuda')}</p>`;
  return h;
}
// v8.3 · el proyector arrastrado en las vistas técnicas (o el desplazamiento de la óptica) fija la distancia y la altura, con su candado
function fijarDesdeVistas(o, d) {
  if (o.dist != null) E.proy.dist = Math.round(o.dist * 100) / 100;
  if (o.yL != null) {
    const m = E.proy.montaje === 'auto' ? (d.apoyo ? 'apoyado' : 'colgado') : E.proy.montaje;
    const alt = m === 'apoyado' ? o.yL - d.altoCh / 2 : o.yL + (d.q.rows - 1) * d.paso + d.altoCh / 2 + 0.05;
    E.proy.montaje = m; E.proy.altura = Math.max(0.01, Math.round(alt * 100) / 100);
  }
  actualizar();
}
// v8.2 · casilla con candado: sin candado, enseña lo que calcula AUTO; con candado, el valor queda fijo y AUTO lo respeta
const CANDADO = (on) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/>${on ? '<path d="M8 11V7.5a4 4 0 018 0V11"/>' : '<path d="M8 11V7.5a4 4 0 017.6-1.7"/>'}</svg>`;
const campoLock = (lab, k, on, html, activo = true) => `<div class="campo"><div class="campo-cab"><span class="lab">${lab}<i class="${on ? 'fijo' : 'auto'}">${on ? t('fijo') : 'AUTO'}</i></span>` +
  `<button type="button" class="candado${on ? ' on' : ''}" data-accion="lock-${k}" aria-pressed="${on}" title="${t(on ? 'desbloquear' : 'bloquear')}" aria-label="${t(on ? 'desbloquear' : 'bloquear')}"${activo ? '' : ' disabled'}>${CANDADO(on)}</button></div>${html}</div>`;
function modElec(c) {
  const e = E.elec, led = E.tecnologia === 'led', x = c.elec || {};
  let h = '';
  if (led) {
    h += `<div class="fila c2">${tog(!e.backup, 'data-set="elec.backup" data-v="0" data-bool="1"', t('sinBackup'))}${tog(e.backup, 'data-set="elec.backup" data-v="1" data-bool="1"', t('conBackup'))}</div>`;
    h += `<div class="fila c2">${tog(e.escalador === 'con', 'data-set="elec.escalador" data-v="con"', t('escCon'))}${tog(e.escalador === 'sin', 'data-set="elec.escalador" data-v="sin"', t('escSin'))}</div>`;
    h += `<div class="fila c2">${tog(e.conexion === 'directo', 'data-set="elec.conexion" data-v="directo"', t('rj45'))}${tog(e.conexion === 'fibra', 'data-set="elec.conexion" data-v="fibra"', t('fibra'))}</div>`;
    if (c.tot) h += (x.procesadores || []).length ? campo(t('procesador'), `<select class="sel" data-sel="elec.sel">${x.procesadores.map(q => `<option value="${q.key}"${x.proc && q.key === x.proc.key ? ' selected' : ''}>${q.marca} ${q.modelo}</option>`).join('')}</select>`) : `<p class="aviso">${t('sinProc')}</p>`;
  }
  if (!led) {
    // v10.39 · proyección: qué equipo reparte la imagen entre los proyectores
    const eq = e.proyEq || 'media';
    const op = ([k, l, ti]) => tog(eq === k, `data-set="elec.proyEq" data-v="${k}" title="${ti}"`, l);
    h += `<div class="fila c2">${[['blend', t('eqBlend'), t('procBlend')], ['media', t('mediaserver'), t('mediaserver')]].map(op).join('')}</div><div class="fila c1">${op(['ninguno', t('mNinguno'), t('mNinguno')])}</div>`;
    if (eq === 'blend') {
      h += `<p class="ayuda">${t('blendAyuda')}</p>`;
      h += (x.blends || []).length ? campo(t('procBlend'), `<select class="sel" data-sel="elec.selBlend">${x.blends.map(m => `<option value="${m.id}"${x.blend && m.id === x.blend.id ? ' selected' : ''}>${m.marca} ${m.modelo} · ${m.cap} ${t('salProy')}</option>`).join('')}</select>`) : `<p class="aviso">${t('sinBlend', { n: x.need || 0 })}</p>`;
    } else if (eq === 'media') {
      h += `<p class="ayuda">${t('mediaAyudaProy')}</p><div class="fila c1">${tog(e.dante, 'data-accion="elec-dante"', t('dante'))}</div>`;
      h += (x.medias || []).length ? campo(t('mediaserver'), `<select class="sel" data-sel="elec.selMedia">${x.medias.map(m => `<option value="${m.id}"${x.media && m.id === x.media.id ? ' selected' : ''}>${m.marca} ${m.modelo} · ${m.out4k}× 4K</option>`).join('')}</select>`) : `<p class="aviso">${t('sinMedia')}</p>`;
    }
    return h;
  }
  h += `<div class="etq">${t('mediaserver')}</div><div class="fila c2">${['todos', 'novastar'].map(k => tog(e.marca === k, `data-set="elec.marca" data-v="${k}"`, k === 'todos' ? t('mTodos') : 'NOVASTAR')).join('')}</div><div class="fila c2">${['pixelhue', 'ninguno'].map(k => tog(e.marca === k, `data-set="elec.marca" data-v="${k}"`, k === 'ninguno' ? t('mNinguno') : 'PIXELHUE')).join('')}</div>`;
  if (e.marca !== 'ninguno') {
    h += `<div class="fila c1">${tog(e.dante, 'data-accion="elec-dante"', t('dante'))}</div>`;
    h += (x.medias || []).length ? campo(t('mediaserver'), `<select class="sel" data-sel="elec.selMedia">${x.medias.map(m => `<option value="${m.id}"${x.media && m.id === x.media.id ? ' selected' : ''}>${m.marca} ${m.modelo} · ${m.out4k}× 4K</option>`).join('')}</select>`) : `<p class="aviso">${t('sinMedia')}</p>`;
  }
  return h;
}
function modSuperficies(c) {
  let h = `<section class="mod"><div class="mod-tit">${ICO.sup}${t('superficies')}</div><div class="sup-lista">`;
  if (!c.filas.length) h += `<p class="ayuda">${sinFilas(c)}</p>`;
  c.filas.forEach(f => {
    const r = f.r, p = f.p;
    const linea = r ? `${fmt(r.ancho)} × ${fmt(r.alto)} m · ${r.cols}×${r.rows} · ${r.resW}×${r.resH}` : `${p.n} ${t('p')} · ${p.resW}×${p.resH} · ${fmt(p.nits, 0)} nits`;
    const av = p ? [p.fuera ? t('fuera') : '', p.limite ? t('limite') : '', p.chica ? t('chica') : '', p.solapeRel > SOLAPE_MAX ? t('solapeAlto') : p.solapeRel > SOLAPE_RECO + 1e-6 ? t('solapeMedio') : '', p.recorte > 0.005 ? t('recorte') + ' ' + fmt(p.recorte * 100, 0) + ' %' : ''].filter(Boolean).join(' · ') : '';
    h += `<div class="sup"><b class="mono" style="color:var(--verde)">●</b><div class="sup-dat"><b>${f.nombre}</b><span>${linea}</span>${av ? `<span style="color:#ffc94d">${av}</span>` : ''}</div><span></span></div>`;
  });
  return h + '</div></section>';
}
// sin filas: o falta el catálogo LED (cargando / sin conexión) o no hay ninguna superficie activa
function sinFilas(c) { if (E.tecnologia === 'led' && !c.modelo) return estadoCat === 'cargando' ? t('cargando') : t('sinCat') + ` <button type="button" class="sec-btn" data-accion="reintentar">${t('reintentar')}</button>`; return t('nada'); }
function tarjeta(t1, v, uni, sub, ac) { return `<div class="tar" style="--ac:${ac}"><div class="t">${t1}</div><div class="v">${v}<small>${uni || ''}</small></div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`; }
// v10.41 · fuera de especificación: el aviso también en la simulación 3D, en los resultados (y su ventana grande) y en el PDF
function oosDatos(c) {
  if (E.tecnologia === 'led' || !E.proy.oos || !c || !c.proyector || !c.filas) return null;
  const sel = c.proyector, usada = Math.max(0, ...c.filas.filter(f => f.s.tipo !== 'suelo' && f.p && f.p.imgW).map(f => Math.hypot(f.p.imgW, f.p.imgH) / 0.0254));
  return { sel, usada: Math.round(usada), sobre: usada > sel.maxDiagPulg + 0.5 };
}
const oosUsaTxt = (o) => (o.sobre ? t('oosUsa', { d: fmtPx(o.usada), g: fmtPx(o.sel.maxDiagPulg) }) : '');
// la banda de la simulación 3D (va con la escena también a la ventana grande)
function bandaOos() {
  const b = $('#esc-oos'); if (!b) return; const o = oosDatos(calculo);
  b.hidden = !o; b.innerHTML = o ? `<b>⚠ ${t('oos')}</b> ${oosUsaTxt(o)} ${t('oosCorto')}` : '';
}
function vistaResultados(c) {
  if (!c.filas.length) return `<p class="ayuda">${sinFilas(c)}</p>`;
  let h = '';
  if (E.tecnologia === 'led' && c.tot) {
    const T = c.tot, m = c.modelo;
    h += `<div class="res-tot">
      ${tarjeta(t('cabinets'), fmtPx(T.cab), '', `${m.crm} · ${m.pitch} mm`, '#b566ff')}
      ${tarjeta(t('lienzo'), `${fmtPx(T.lienzoW)}×${fmtPx(T.lienzoH)}`, 'px', t(c.filas.length > 1 ? 'lienzoAyuda' : 'lienzoUna'), '#00b4ff')}
      ${tarjeta(t('peso'), T.peso > 0 ? fmt(T.peso, 0) : '—', T.peso > 0 ? 'kg' : '', '', '#e100ff')}
      ${tarjeta(t('consumo'), T.kw > 0 ? fmt(T.kw, 1) : '—', T.kw > 0 ? 'kW' : '', T.amp > 0 ? `${fmt(T.amp, 1)} A · 230 V` : '', '#ff4d5e')}
      ${tarjeta(t('lineas'), fmtPx(T.lineas), '', `+ ${fmtPx(T.lineas)} backup · 8 bit 60 Hz`, '#00ff04')}
      ${tarjeta(t('salidas'), fmtPx(T.salidas4k), '', 'mediaserver', '#ffb000')}
    </div>`;
    h += vistaVeredicto(c);
    h += `<div class="tabla-caja"><table class="tabla"><thead><tr><th>${t('supCol')}</th><th>${t('medida')}</th><th>${t('cabCol')}</th><th>${t('resol')}</th><th>${t('pesoCol')}</th><th>${t('potCol')}</th><th>${t('linCol')}</th></tr></thead><tbody>
      ${c.filas.map(f => `<tr><td>${f.nombre}</td><td>${fmt(f.r.ancho)} × ${fmt(f.r.alto)} m</td><td>${f.r.cols}×${f.r.rows} = ${f.r.cab}${f.r.quitados ? ` <span class="tenue">(−${f.r.quitados})</span>` : ''}</td><td>${f.r.resW}×${f.r.resH}</td><td>${f.r.peso > 0 ? fmt(f.r.peso, 0) + ' kg' : ''}</td><td>${f.r.kw > 0 ? fmt(f.r.kw, 2) + ' kW' : ''}</td><td>${f.r.lineas}${f.lin ? ` <span class="tenue">L${f.lin[0]}${f.lin[1] > f.lin[0] ? '–' + f.lin[1] : ''}</span>` : ''}</td></tr>`).join('')}
    </tbody></table></div>`;
  } else if (c.tot) {
    const T = c.tot, p = c.proyector;
    const tiros = c.filas.filter(f => f.pos).map(f => f.pos.dist);
    h += `<div class="res-tot">
      ${tarjeta(t('proyectores'), fmtPx(T.n), '', (c.grupos.length > 1 ? c.grupos.map(g => fmtPx(g.n) + ' × ' + nombreQ(g.q)).join(' + ') : nombreQ(p)) + (c.filas.some(f => f.p.vert) ? ' · ' + t('vert') : ''), '#b566ff')}
      ${tarjeta(t('lienzo'), `${fmtPx(T.lienzoW)}×${fmtPx(T.lienzoH)}`, 'px', t(c.filas.length > 1 ? 'lienzoAyuda' : 'lienzoUna'), '#00b4ff')}
      ${tarjeta(t('brillo'), fmt(T.nitsMin === Infinity ? 0 : T.nitsMin, 0), 'nits', t('brilloAyudaG', { g: fmt(c.gan, 1) }), '#ffb000')}
      ${tarjeta(t('contraste'), fmt(T.contrasteMin, 1), ':1', `<b class="sem ${semaforo(T.contrasteMin)}">${t(semaforo(T.contrasteMin))}</b> ` + nivelContraste(T.contrasteMin) + ' · ' + fmt(c.lx, 0) + ' lx', semaforo(T.contrasteMin) === 'semV' ? '#00ff04' : semaforo(T.contrasteMin) === 'semA' ? '#ffb000' : '#ff4d5e')}
      ${tarjeta(t('distOpticaK'), tiros.length ? fmt(Math.max(...tiros), 2) : '—', 'm', `TR ${fmt(Math.max(...c.filas.filter(f => f.s.tipo !== 'suelo').map(f => f.p.ratio)), 2)}:1`, '#00ff04')}
      ${tarjeta(t('lumenes'), fmtPx(T.lumenes), 'lm', c.grupos.map(g => `${fmtPx(g.n)} × ${fmtPx(g.q.lumens)}`).join(' + ') + ' lm', '#ff4d5e')}
    </div>`;
    /* v10.63 · el veredicto único (el mismo que SIMPLE), arriba, antes de la tabla: también va al PDF */
    h += vistaVeredicto(c);
    h += `<div class="tabla-caja"><table class="tabla"><thead><tr><th>${t('supCol')}</th><th>${t('medida')}</th><th>${t('proyCol')}</th><th>${t('resol')}</th><th>${t('solCol')}</th><th>${t('tiroCol')}</th><th>${t('brCol')}</th></tr></thead><tbody>
      ${c.filas.map(f => { const q = f.p; return `<tr><td>${f.nombre}</td><td>${fmt(f.s.ancho)} × ${fmt(f.s.alto)} m</td><td>${q.cols ? q.cols + '×' + q.rows + ' = ' : ''}${q.n}${q.vert ? ' · ' + t('vert') : ''}</td><td>${q.resW}×${q.resH}</td><td>${fmt(q.solapeRel * 100, 0)} %</td><td>${fmt(f.pos ? f.pos.dist : q.tiro, 2)} m${q.fuera ? ' ⚠' : ''}</td><td>${fmt(q.nits, 0)} nits</td></tr>`; }).join('')}
    </tbody></table></div>`;
    h += vistasTecnicas(c, E.vista.tec || 'todas', Number(E.vista.vtSup) || 0);   // v8.3 · vistas técnicas (lateral, frontal y cenital)
    h += vistaPosicion(c);
    h += vistaSombras(c);
  }
  h += vistaElec(c);
  h += vistaMaterial(c);   // v10.36 · lista de material (varias LED), la misma que la de la portada
  return h;
}

// nivel de contraste alcanzado según ANSI/AVIXA (visión pasiva 7:1, decisiones básicas 15:1, analítica 50:1, vídeo 80:1)
// v10.48 · el semáforo de la imagen: los mismos umbrales (15:1 y 7:1) con una frase que se entiende y lo que hay que hacer
const semaforo = (v) => { v = Math.round(v * 10) / 10; return v >= 15 ? 'semV' : v >= 7 ? 'semA' : 'semR'; };   // v10.63 · con el valor que se lee (6,96 se lee 7)
function nivelContraste(v) { return v >= 80 ? t('cVideo') : v >= 50 ? t('cAnalitica') : v >= 15 ? t('cBasica') : v >= 7 ? t('cPasiva') : t('cInsuf'); }
// posición del proyector y brillo por superficie:
function vistaPosicion(c) {
  const fs = c.filas.filter(f => f.pos); if (!fs.length) return '';
  const ok = (v) => (v >= 15 ? 'ok' : v >= 7 ? '' : 'mal');
  // v8.0 · desplazamiento de la lente frente al de la óptica (en vertical, el de la sala es el horizontal de la óptica)
  const lim = limShift, pasa = pasaShift;
  return `<section class="res-sec"><div class="res-tit">${ICO.proy}${t('posTit')}</div><div class="tabla-caja"><table class="tabla"><thead><tr><th>${t('supCol')}</th><th>${t('distOpticaK')}</th><th>${t('zoomCol')}</th><th>${t('alturaOptica')}</th><th>${t('baseImagen')}</th><th>${t('techoImagen')}</th><th>${t('shiftV')}</th><th>${t('diagCol')}</th><th>${t('ilumCol')}</th><th>${t('brCol')}</th><th>${t('contraste')}</th></tr></thead><tbody>
    ${fs.map(f => { const q = f.p, o = f.pos; return `<tr><td>${f.nombre}</td><td><b>${fmt(o.dist, 2)} m</b></td><td>${fmt(q.tMin, 2)}–${fmt(q.tMaxZ, 2)} m</td><td>${fmt(o.yLente, 2)} m</td><td>${o.y0 >= 0 ? fmt(o.y0, 2) + ' m' : t('desborda', { d: fmt(-o.y0, 2) })}</td><td>${!o.techo ? '—' : o.techo - o.y1 >= 0 ? fmt(o.techo - o.y1, 2) + ' m' : t('desborda', { d: fmt(o.y1 - o.techo, 2) })}</td><td class="${pasa(f) ? 'mal' : ''}">${fmt(o.shiftV, 0)} %${lim(f) ? ` <small>(±${lim(f)} %)</small>` : ''}</td><td>${fmt(o.diag, 0)}″ · ${fmt(q.imgW, 2)} × ${fmt(q.imgH, 2)} m</td><td>${fmtPx(Math.round(q.lux))} lx</td><td>${fmt(q.nits, 0)} nits</td><td class="${ok(q.contraste)}">${fmt(q.contraste, 1)}:1</td></tr>`; }).join('')}
  </tbody></table></div>${fs.some(pasa) ? `<p class="aviso">${t('shiftFuera', { s: fs.filter(pasa).map(f => f.nombre).join(' · ') })}</p>` : ''}<p class="ayuda">${t('posAyuda', { lx: fmt(c.lx, 0), g: fmt(c.gan, 1) })}</p></section>`;
}
// electrónica y mediaserver elegidos, con el mismo componente de ficha
// v10.36 · lista de material de varias pantallas LED y salas inmersivas, fila a fila como en la portada: cabinets, fuentes y cable HDMI
// (1 fuente y cable de 3 m si no se dice otra cosa), mediaserver, electrónica (por piezas si es modular), fibra y Cat6, distribución
// eléctrica (líneas de 16 A por superficie), PC de control, sensor de luz en exterior y escaparate, y la variante tropicalizada
const COL_MAT = { pantalla: '#9aa3b2', video: '#2f7fe0', elec: '#14a38b', fibra: '#f07020', eth: '#3fae4f', power: '#e5404f', ctrl: '#8b55e8', extra: '#d08a00' };
function materialLed(c) {
  const x = c.elec || {}, p = x.proc, me = x.media, m = c.modelo, T = c.tot, e = E.elec, L = [], busca = ELEC.charmexBusca || (() => '');
  const backup = !!e.backup, mult = backup ? 2 : 1, rack = e.conexion === 'fibra';
  L.push({ c: T.cab, ref: m.crm, url: m.urlProd || busca(m.crm), desc: t('matCab', { p: m.pitch, w: m.cabAncho, h: m.cabAlto }), g: 'pantalla' });
  L.push({ c: 1, ref: 'HDMI', desc: t('matFuentes'), g: 'video' });
  L.push({ c: 1, ref: 'FI-H100-030', url: busca('FI-H100-030'), desc: t('matCable', { a: me ? 'mediaserver' : t('matAElec') }) + t('matEstandar'), g: 'video' });
  if (me) L.push({ c: backup && !me.backupNativo ? 2 : 1, ref: me.modelo, url: me.url || busca(me.modelo), desc: t(me.tipo === 'switcher' ? 'matSwitch' : 'matMedia', { m: me.marca }) + (me.backupNativo ? t('matBkNat') : ''), g: 'video' });
  if (p) { const eq = (p.equipos || []).filter(q => q.cant > 0), tit = p.reproductor ? t('matRepro', { m: p.marca, s: p.serie || '' }) : t('matElec', { m: p.marca, s: p.serie || '' }) + (p.escalador ? t('matEsc') : '');
    if (p.modular) { L.push({ c: '', ref: p.modelo, desc: tit + t('matPiezas'), g: 'elec', titulo: true }); eq.forEach(q => L.push({ c: q.cant, ref: q.ref, url: busca(q.ref), desc: trMotor(q.desc), g: 'elec', pieza: true })); }
    else { L.push({ c: 1, ref: p.modelo, url: p.url || busca(p.modelo), desc: tit, g: 'elec' }); eq.forEach(q => L.push({ c: q.cant, ref: q.ref, url: busca(q.ref), desc: trMotor(q.desc), g: 'elec' })); } }
  else L.push({ c: '', ref: t('matSinEq'), desc: t('matSinEqD'), g: 'elec' });
  const cvt = p ? (p.equipos || []).filter(q => q.ref === (ELEC.ELEC_CVT || {}).ref || q.ref === (ELEC.ELEC_MX_CVT || {}).ref).reduce((a, q) => a + q.cant, 0) : 0, bk = backup ? t('matMasBk') : '';
  if (rack) { L.push({ c: cvt * mult, ref: t('matFibra'), desc: t('matFibraD') + bk, g: 'fibra' }); L.push({ c: T.lineas * mult, ref: 'Cat6 (RJ45)', desc: t('matCat6Cvt') + bk, g: 'eth' }); }
  else L.push({ c: T.lineas * mult, ref: 'Cat6 (RJ45)', desc: t('matCat6') + bk, g: 'eth' });
  const ampCab = Number(m.cabAmp) || (m.wMax ? m.wMax / 230 : 0), cabLinea = ampCab > 0 ? Math.max(1, Math.floor(16 / ampCab)) : 0;
  const nLin = c.filas.reduce((a, f) => a + (f.r && f.r.cab ? (cabLinea ? Math.ceil(f.r.cab / cabLinea) : 1) : 0), 0);
  // v10.50 · sin consumo en la tabla maestra no salen ceros: solo el cableado (el final del mismo texto traducido)
  const dd = t('matDistD', { a: fmt(T.amp, 1), k: fmt(T.kw, 2), n: nLin }), soloCable = dd.slice(dd.lastIndexOf('+') + 1).trim();
  L.push({ c: 1, ref: t('matDist'), desc: T.amp > 0 && T.kw > 0 ? dd : soloCable.charAt(0).toUpperCase() + soloCable.slice(1), g: 'power' });
  L.push({ c: 1, ref: t('matPc'), desc: t('matPcD'), g: 'ctrl' });
  if (E.led.tipo === 'OUTDOOR' || E.led.tipo === 'ESCAPARATE') L.push({ c: 1, ref: 'NS060', url: busca('NS060'), desc: t('matSensor'), g: 'ctrl' });
  if (E.led.gold) L.push({ c: '', ref: t('matGold'), desc: t('matGoldD'), g: 'extra' });
  return L;
}
function vistaMaterial(c) {
  if (E.tecnologia !== 'led' || !c.modelo || !c.tot || !c.filas.length) return '';
  const esc2 = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  return `<section class="res-sec mat"><div class="res-tit">${ICO_MAT}${t('matTit')}</div><div class="tabla-caja"><table class="tabla mat"><thead><tr><th>${t('matCant')}</th><th>${t('matRef')}</th><th>${t('matDesc')}</th></tr></thead><tbody>${materialLed(c).map(x => `<tr class="${x.titulo ? 'tit' : x.pieza ? 'pz' : ''}"><td>${x.c === '' ? '' : fmtPx(x.c) + (x.pieza ? '×' : '')}</td><td><i class="mat-v${x.pieza ? ' pz' : ''}" style="background:${COL_MAT[x.g] || '#999'}"></i>${x.url ? `<a href="${esc2(x.url)}" target="_blank" rel="noopener">${esc2(x.ref)}</a>` : esc2(x.ref)}</td><td>${esc2(x.desc)}</td></tr>`).join('')}</tbody></table></div><p class="ayuda">${t('matNota')}</p></section>`;
}
const ICO_MAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6v3H9z"/><path d="M15 5h3v16H6V5h3"/><path d="M9 11h6M9 15h6"/></svg>';
function vistaElec(c) {
  const x = c.elec; if (!x) return '';
  const led = E.tecnologia === 'led', fichas = [];
  if (led && x.proc) fichas.push(fichaProc(x.proc));
  if (x.blend) fichas.push(fichaBlend(x.blend));
  if (x.media) fichas.push(fichaMedia(x.media, x.need, led));
  if (!fichas.length) return '';
  return `<section class="res-sec"><div class="res-tit">${ICO.elec}${t('elecTit')}</div><div class="fichas">${fichas.join('')}</div></section>`;
}
// sombras del público, safety zone y cruces de haces (proyección)
function vistaSombras(c) {
  const S = c.sombras; if (!S) return '';
  const li = [], sala = c.esp.tipo === 'sala';
  if (sala && S.zona) li.push(S.zona.ok ? `<li class="ok">${t('segZona', { a: fmt(S.zona.ancho, 1), f: fmt(S.zona.fondo, 1) })}</li>` : `<li class="mal">${t('segNo')}</li>`);
  // superficies con la misma franja, en una sola línea
  const grupos = []; S.franjas.filter(f => f.prof > 0.05).forEach(f => { const k = fmt(f.prof, 2) + '|' + fmt(f.tiro, 2), g = grupos.find(x => x.k === k); if (g) g.n.push(f.nombre); else grupos.push({ k, n: [f.nombre], d: fmt(f.prof, 2), t: fmt(f.tiro, 2) }); });
  grupos.forEach(g => li.push(`<li>${t(sala ? 'segFranja' : 'segPant', { n: g.n.join(' · '), d: g.d, t: g.t })}</li>`));
  if (!sala && c.tipoP !== 'mapping') S.franjas.filter(f => f.prof > c.dist).forEach(f => li.push(`<li class="mal">${t('segPublico', { d: fmt(c.dist, 1), n: f.nombre })}</li>`));
  if (c.filas.some(f => f.s.tipo === 'suelo')) li.push(`<li>${t('segSuelo')}</li>`);
  const pares = {}; S.conflictos.forEach(k => { const id = k.tapa.nombre + '|' + k.haz.nombre; pares[id] = (pares[id] || 0) + 1; });
  Object.entries(pares).forEach(([id, n]) => { const [a, b] = id.split('|'); li.push(`<li class="mal">${t('conflicto', { a, b, n: n + '×' })}</li>`); });
  if (S.conflictos.length) li.push(`<li>${t('conflictoSol')}</li>`);
  // chasis recolocados para no chocar (holgura de ventilación) y choques sin solución
  S.movs.forEach(k => { const partes = [];
    if (k.dz) partes.push(t('mvFondo', { d: fmt(k.dz, 2) })); if (k.dy) partes.push(t(k.dy > 0 ? 'mvAlto' : 'mvBajo', { d: fmt(Math.abs(k.dy), 2) })); if (k.dx) partes.push(t('mvLado', { d: fmt(Math.abs(k.dx), 2) }));
    li.push(`<li>${k.h.nombre} P${k.h.i + 1} ${partes.join(t('yy'))} ${t(k.por === 'choque' ? 'porChoque' : 'porHaz', { b: k.con ? k.con.nombre + ' P' + (k.con.i + 1) : '' })}.</li>`); });
  /* v10.63 · «AUTO propone» va en el veredicto, arriba */
  /* v10.60 · el «no se puede conseguir» se ha subido a antes de la tabla (vistaResultados) */
  S.choques.forEach(k => li.push(`<li class="mal">${t('choque', { a: k.h.nombre + ' P' + (k.h.i + 1), b: k.con ? k.con.nombre + ' P' + (k.con.i + 1) : '' })}</li>`));
  if (S.movs.length || S.choques.length) li.push(`<li>${t('holgura')}</li>`);
  S.cruces.forEach(k => li.push(`<li>${t('cruce', { a: k.na, b: k.nb })}</li>`));
  (S.obst || []).forEach(k => li.push(`<li class="mal">${t('obstSombra', { k: k.k + 1, n: k.nombres.join(' · ') })}</li>`));
  puertasDe(c.esp).forEach((p, i) => { const f = c.filas.find(x => x.s.id === p.pared); if (f) li.push(`<li>${t('puertaProy', { n: f.nombre })}</li>`); });
  if (!S.conflictos.length && !S.cruces.length && !S.choques.length && !(S.obst || []).length) li.push(`<li class="ok">${t('sinProblemas')}</li>`);
  return `<section class="res-sec"><div class="res-tit"><span class="cinta-ico" aria-hidden="true"></span>${t('segTit')}</div><ul class="avisos">${li.join('')}</ul></section>`;
}

// ---------- consola fija: modo (una / varias · LED / proyección) y petición en lenguaje natural ----------
// Se monta una vez por idioma; después solo cambian los estados, así no se pierde el texto, el foco ni el aviso en curso.
const ICO_MINI = {
  una: '<svg viewBox="0 0 48 32" fill="none" stroke="currentColor" stroke-width="3"><rect x="8" y="4" width="32" height="19" rx="1"/><path d="M18 28h12M24 23v5"/></svg>',
  varias: '<svg viewBox="0 0 48 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M4 8l10 3v15L4 23z"/><path d="M14 11h20v15H14z"/><path d="M34 11l10-3v15l-10 3"/></svg>',
  led: '<svg viewBox="0 0 48 32" fill="none" stroke="currentColor" stroke-width="3"><rect x="6" y="4" width="36" height="22" rx="1"/><path d="M18 4v22M30 4v22M6 15h36"/></svg>',
  proy: '<svg viewBox="0 0 48 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><rect x="3" y="12" width="16" height="10" rx="2"/><circle cx="14" cy="17" r="3"/><path d="M19 13l26-9v26l-26-9"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  audio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/></svg>',
  ir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>'
};
let nlTexto = '', escuchando = null, conIdioma = '';
const unaLed = () => E.cantidad === 'una' && E.tecnologia === 'led';
function pintarConsola() {
  const c = $('#consola'); if (!c) return;
  if (conIdioma !== idioma() || !c.firstElementChild) {
    conIdioma = idioma();
    const i0 = $('#nl-texto'), val = i0 ? i0.value : nlTexto, foco = document.activeElement === i0;
    const b = (set, v, ico, txt) => `<button type="button" class="tog" aria-pressed="false" data-set="${set}" data-v="${v}">${ico}<span>${txt}</span></button>`;
    c.innerHTML = `<div class="con-grupo" role="group" aria-label="${t('cuantas')}">${b('cantidad', 'una', ICO_MINI.una, t('unaCorto'))}${b('cantidad', 'varias', ICO_MINI.varias, t('variasCorto'))}</div>
      <div class="con-grupo" role="group" aria-label="${t('tecno')}">${b('tecnologia', 'led', ICO_MINI.led, 'LED')}${b('tecnologia', 'proy', ICO_MINI.proy, t('proy'))}</div>
      <div class="con-nl"><span class="nl-beta" id="nl-beta" title="${t('nlBetaT')}" hidden>${t('nlBeta')}</span><input id="nl-texto" type="text" enterkeyhint="go" autocomplete="off" aria-label="${t('nlPh2')}">
        <button type="button" class="sec-btn con-ico" data-accion="nl-mic" aria-pressed="false" title="${t('nlMic')}" aria-label="${t('nlMic')}">${ICO_MINI.mic}</button>
        <button type="button" class="sec-btn con-ico" data-accion="nl-audio" title="${t('nlAudio')}" aria-label="${t('nlAudio')}">${ICO_MINI.audio}</button><input type="file" id="nl-archivo" accept="audio/*,.opus,.ogg,.m4a,.mp3,.wav,.webm" hidden>
        <button type="button" class="pri con-calc" data-accion="nl-calcular" title="${t('nlCalc')}" aria-label="${t('nlCalc')}"><span>${t('nlCalc')}</span>${ICO_MINI.ir}</button>
        <div class="con-estado" id="con-estado" role="status" aria-live="polite"></div></div>`;
    const i = $('#nl-texto'); i.value = val; if (foco) { i.focus(); i.setSelectionRange(val.length, val.length); }
    ajustarPh();
  }
  c.querySelectorAll('[data-set]').forEach(b => { const on = E[b.dataset.set] === b.dataset.v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const m = c.querySelector('[data-accion="nl-mic"]'); m.classList.toggle('activo', !!escuchando); m.setAttribute('aria-pressed', !!escuchando);
  // v8.4 · secciones en pruebas: todo lo que no es una pantalla LED (varias pantallas, salas inmersivas, proyección) lleva el aviso
  // de beta en la caja de la petición, en ámbar tipo LCD. Para quitarlo cuando estén probadas: EN_PRUEBAS = () => false
  const i = $('#nl-texto'), beta = EN_PRUEBAS(); if (i && i.classList.contains('beta') !== beta) { i.classList.toggle('beta', beta); ajustarPh(); }
  const pb = $('#nl-beta'); if (pb) pb.hidden = !beta;
}
const EN_PRUEBAS = () => !unaLed();   // v10.30 · se mantiene: los cálculos de varias LED y de proyección aún no están verificados
// el texto guía más largo que quepa entero en la caja (nunca cortado)
let ctxPh = null;
function ajustarPh() {
  const i = $('#nl-texto'); if (!i || !i.clientWidth) return;
  const cs = getComputedStyle(i), libre = i.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2;
  const beta = i.classList.contains('beta'), fs = parseFloat(cs.fontSize) || 14;
  ctxPh = ctxPh || document.createElement('canvas').getContext('2d'); ctxPh.font = beta ? `400 ${cs.fontSize} 'Share Tech Mono', monospace` : `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const ls = parseFloat(cs.letterSpacing) || 0;   // v10.48 · siempre el ejemplo (BETA va en su pastilla) y medido con el espaciado de letras real
  const ph = ['nlPh1', 'nlPh2', 'nlPh3', 'nlPh4'].map(k => t(k)).find(x => ctxPh.measureText(x).width + x.length * (ls || (beta ? fs * 0.05 : 0)) <= libre) || '';
  if (i.placeholder !== ph) i.placeholder = ph;
}
let tEstado = 0;
function estadoNl(txt, fijo) { const e = $('#con-estado'); if (!e) return; e.textContent = txt || ''; e.classList.toggle('ver', !!txt); clearTimeout(tEstado); if (txt && !fijo) tEstado = setTimeout(() => e.classList.remove('ver'), 6000); }
// cálculo de una pantalla LED (la app de la raíz, dentro de la consola): los mensajes esperan a que avise de que está lista
let ledListo = false, colaLed = [];
function aIframe(msg) {
  const f = $('#sc-led'); if (!f) return;
  if (ledListo) { try { f.contentWindow.postMessage(msg, location.origin); } catch (e) {} } else colaLed.push(msg);
}
window.addEventListener('message', (ev) => {
  const f = $('#sc-led'); if (ev.origin !== location.origin || !f || ev.source !== f.contentWindow || !ev.data) return;
  if (ev.data.tipo === 'screens-listo') { ledListo = true; f.classList.add('listo'); colaLed.splice(0).forEach(aIframe); }
});
// lo entendido, rotulado en el idioma de la consola
function rotulo(x) {
  switch (x.k) {
    case 'proy': return t('proy'); case 'led': return 'LED'; case 'sala': return t('sala'); case 'una': return t('una');
    case 'pant': return t('pantN', { n: x.n }); case 'medida': return x.v.map(v => fmt(v)).join(' × ') + ' m';
    case 'alto': return t('alto') + ' ' + fmt(x.v) + ' m'; case 'paredes': return t('paredesN', { n: x.n }); case 'suelo': return t('suelo');
    case 'arco': return t('arco'); case 'linea': return t('linea'); case 'publico': return t('dist') + ' ' + fmt(x.v, 1) + ' m';
    case 'lux': return fmt(x.v, 0) + ' lx'; case 'ganancia': return t('ganancia') + ' ' + fmt(x.v, 1); case 'techo': return t('techoAlto') + ' ' + fmt(x.v) + ' m';
    case 'vertical': return t('or_vertical'); case 'horizontal': return t('or_horizontal'); case 'multi': return t('multiImg'); case 'tipo': return t('tp_' + x.v);
    case 'distProy': return t('distOpticaK') + ' ' + fmt(x.v, 1) + ' m'; case 'montaje': return t('mo_' + x.v) + (x.h ? ' ' + fmt(x.h, 1) + ' m' : '');
    case 'fibra': return t('fibra'); case 'central': return t('central') + ' ' + x.v.map(v => fmt(v)).join(' × ') + ' m';
    case 'laterales': return t('laterales') + ' ' + x.v.map(v => fmt(v)).join(' × ') + ' m'; case 'pitch': return 'P' + fmt(x.v, 2) + (x.ok ? ' · ' + x.ok : ''); default: return x.v;
  }
}
function calcularPeticion() {
  const i = $('#nl-texto'), txt = (i ? i.value : nlTexto).trim(); nlTexto = i ? i.value : nlTexto;
  if (!txt) { estadoNl(t('nlVacio')); if (i) i.focus(); return; }
  if (escuchando) { try { escuchando.stop(); } catch (e) {} escuchando = null; }
  if (i && matchMedia('(pointer: coarse)').matches) i.blur(); // en el móvil se cierra el teclado para ver el resultado
  const r = interpretar(txt), c = r.cambios;
  if (r.cantidad) E.cantidad = r.cantidad; if (r.tecnologia) E.tecnologia = r.tecnologia;
  // una pantalla LED: la petición la resuelve su propio cálculo, con el popup de datos del proyecto
  if (unaLed()) { actualizar(); aIframe({ tipo: 'screens-peticion', texto: txt }); estadoNl(t('nlLed')); return; }
  // v10.48 · una petición nueva (con medidas, tecnología o cantidad) parte de cero: lo que no dice vuelve a su valor por defecto (antes heredaba la anterior)
  if (r.vistos.some(x => x.k === 'medida' || x.k === 'central') || r.tecnologia || r.cantidad) { const d = DEF(); E.esp = d.esp; E.led = Object.assign(d.led, {}); E.proy = d.proy; if (r.cantidad) E.cantidad = r.cantidad; }
  Object.assign(E.esp, c.esp); Object.assign(E.esp.sueltas, c.sueltas); if (c.paredes) Object.assign(E.esp.paredes, c.paredes);
  if (r.cantidad === 'una' && !c.esp.tipo) E.esp.tipo = 'sueltas';
  // v8.0 · una petición de proyección parte de la posición AUTO, salvo lo que diga (distancia, orientación, montaje)
  if (r.tecnologia === 'proy') Object.assign(E.proy, { dist: 0, orient: 'auto', montaje: 'auto', altura: 0, tipo: 'pared' });
  Object.assign(E.led, c.led); Object.assign(E.proy, c.proy); Object.assign(E.elec, c.elec);
  if (c.proy.tipo === 'mapping' && !r.vistos.some(x => x.k === 'medida')) { const d = Number(E.proy.dist) || 0; alMapping(); if (r.vistos.some(x => x.k === 'distProy')) E.proy.dist = d; }   // v10.63
  if (c.proy.lux != null) E.proy.luzUso = (USOS_LUZ.find(u => u[1] === Number(c.proy.lux)) || [''])[0];
  if (c.led.tipo || c.led.clase) E.led.crm = '';
  if (c.elec.backup || c.elec.conexion) E.elec.sel = '';
  if (r.pitch) {   // v7.9 · «P1.5», «pitch 1,5»…: el modelo de ese pitch (si el catálogo lo tiene)
    const l = listaLed(), cob = r.cob ? l.filter(m => /cob/i.test(m.tech + ' ' + m.crm)) : [];
    const m = (cob.length ? cob : l).find(x => Math.abs(x.pitch - r.pitch) < 0.07);
    const v = r.vistos.find(x => x.k === 'pitch'); if (m) { E.led.crm = m.crm; if (v) v.ok = m.crm; }
  }
  actualizar();
  estadoNl(r.vistos.length ? t('nlEntendido') + ' ' + r.vistos.map(rotulo).join(' · ') : t('nlNada'));
}

// v8.5 · bloque de una zona: cabecera con testigo, nombre, resumen (se lee cuando está plegado) y su RESTABLECER; debajo, el cuerpo
const blq = (id, tit, res, cuerpo, reset) => `<section class="mod blq" data-blq="${id}"><div class="mod-tit"><button type="button" class="blq-cab" data-accion="blq" data-id="${id}" aria-expanded="true"><i class="blq-led"></i><span class="blq-nom">${tit}</span><span class="blq-res">${res || ''}</span></button>${reset ? `<button type="button" class="sec-btn reset" data-accion="${reset}">${t('restablecer')}</button>` : ''}</div><div class="blq-cuerpo">${cuerpo}</div></section>`;
function zonas(c) {
  const led = E.tecnologia === 'led', e = partesEspacio(), q = led ? partesLed(c) : partesProy(c), x = c.elec || {};
  const rElec = led ? (x.proc ? x.proc.marca + ' ' + x.proc.modelo : '') : x.blend ? x.blend.marca + ' ' + x.blend.modelo : x.media ? x.media.marca + ' ' + x.media.modelo : (E.elec.proyEq === 'ninguno' ? t('mNinguno') : '');
  const A = `<div class="zona-cab"><b>A</b>${t('zonaA')}</div>` + blq('a1', t('bTipo'), e.rTipo, e.tipo, led ? 'reset-a1' : '') + blq('a2', t('bTam'), e.rTam, e.tam, 'reset-a2') + (led ? '' : blq('a3', t('bLuz'), q.rLuz, q.luz, 'reset-a3')) + blq('a4', t('bEnt'), e.rEnt, e.ent, 'reset-a4') +
    `<div class="zona-pie"><button type="button" class="pri" data-accion="calc-ir">${t('nlCalc')}</button><button type="button" class="sec-btn reset" data-accion="reset-a">${t('restablecer')}</button></div>`;
  const B = `<div class="zona-cab"><b>B</b>${t('zonaB')}</div>` + blq('b1', t('bMat'), q.rMat, q.mat, 'reset-b1') + blq('b2', t('bAj'), q.rAj, q.aj, 'reset-b2') + blq('b3', led ? t('elecMod') : t('elecProy'), rElec, modElec(c), 'reset-elec') +
    `<div class="zona-pie eleg"><div class="eleg-txt"><small>${t('elegido')}</small><b>${q.eleg ? q.eleg.nom : '—'}</b><span>${q.eleg ? q.eleg.dat : ''}</span></div><button type="button" class="sec-btn" data-accion="ficha-ir"${q.eleg ? '' : ' disabled'}>${t('fichaB')}</button></div>`;
  const equipo = q.fichas ? `<div class="res-sec" id="det-equipo"><div class="res-tit">${led ? ICO.led : ICO.proy}${t('equipoSel')}</div>${q.fichas}</div>` : '';
  return { A, B, equipo };
}
// Las columnas no se desplazan nunca: si la altura no da para todos los bloques, quedan abiertos los últimos que se han tocado y el resto
// se pliega enseñando su resumen. Si ni uno solo cabe (muchos obstáculos en un portátil), ese bloque se desplaza por dentro de su marco.
const reciente = { a: ['a2', 'a1', 'a4', 'a3'], b: ['b1', 'b2', 'b3'] };
const tocar = (z, id) => { if (!reciente[z] || !id) return; reciente[z] = [id].concat(reciente[z].filter(k => k !== id)); };
const TRES = () => matchMedia('(min-width: 1024px)').matches;
function plegar() {
  ['a', 'b'].forEach(z => {
    const zona = $('#panel' + z.toUpperCase()); if (!zona) return;
    const bl = [...zona.querySelectorAll('.blq')], por = (id) => bl.find(b => b.dataset.blq === id);
    bl.forEach(b => b.classList.remove('pleg', 'act'));
    const cabe = () => zona.scrollHeight <= zona.clientHeight + 1;
    if (TRES() && !cabe()) {
      bl.forEach(b => b.classList.add('pleg'));
      const orden = reciente[z].map(por).filter(Boolean).concat(bl.filter(b => !reciente[z].includes(b.dataset.blq)));
      let lleno = false;   // si el más reciente no cabe ni solo, se queda él abierto (con su cuerpo desplazable) y los demás plegados
      orden.forEach((b, i) => { if (lleno) return; b.classList.remove('pleg'); if (!cabe()) { if (i === 0) { b.classList.add('act'); lleno = true; } else b.classList.add('pleg'); } });
    }
    bl.forEach(b => { const c = b.querySelector('.blq-cab'); if (c) c.setAttribute('aria-expanded', String(!b.classList.contains('pleg'))); });
  });
  ajustarTextos();
}
function irA(sel) { const el = $(sel); if (!el) return; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.remove('dest'); void el.offsetWidth; el.classList.add('dest'); }
function vistaTrabajo() {
  return `<div class="trabajo z3"><aside class="panel zona" id="panelA" data-zona="a"></aside><aside class="panel zona" id="panelB" data-zona="b"></aside><main class="vista">
    <div class="escena" id="escena"><canvas id="lienzo3d" aria-label="Simulación 3D"></canvas>
      <div class="esc-barra"><div id="esc-vistas"></div><div id="esc-cont"></div><div id="esc-medio" class="esc-medio"></div></div>
      <div class="esc-abajo"><div class="esc-oos" id="esc-oos" role="note" hidden></div><div class="esc-info">${t(matchMedia('(pointer: coarse)').matches ? 'vista3dTactil' : 'vista3d')}</div></div></div>
    <div class="res" id="res"></div></main></div>`;
}
function barraEscena() {
  const v = E.vista;
  $('#esc-vistas').innerHTML = ['exterior', 'interior', 'planta'].map(k => tog(v.camara === k, `data-cam="${k}"`, t(k))).join('');
  $('#esc-cont').innerHTML = ['carta', 'panorama', 'ascensor', 'propio', 'apagado'].map(k => tog(v.contenido === k, `data-set="vista.contenido" data-v="${k}"`, t(k))).join('') + tog(v.etiquetas, 'data-accion="etiquetas"', t('etiquetas')) + (E.tecnologia === 'proy' ? tog(v.zona, 'data-accion="zona"', t('zonaBtn')) : '');
  $('#esc-medio').innerHTML = (v.contenido === 'propio' ? `<button type="button" class="sec-btn" data-accion="subir">⬆ ${medio ? medio.nombre : t('subir')}</button><select class="sel" data-sel="vista.modo" aria-label="${t('modoMedio')}">${['continuo', 'estirar', 'rellenar', 'encajar', 'repetir', 'espejo'].map(k => `<option value="${k}"${v.modo === k ? ' selected' : ''}>${t('m_' + k)}</option>`).join('')}</select><input type="file" id="medio-archivo" accept="image/*,video/*" hidden>` : '');
}

// ---------- ciclo ----------
let tEsc = 0;
function soltarEscena() { if (escena) { try { escena.destruir(); } catch (e) {} } escena = null; }
function actualizar(sinEscena) {
  guardar();
  const app = $('#app'), led1 = unaLed();
  pintarConsola();
  document.body.classList.toggle('con-led', led1);
  $('#btn-info').hidden = !led1;
  // v10.29 · una pantalla LED es la portada (index.html, mismo formato): la consola lleva allí. La versión clásica (led.html) se ha retirado
  if (led1) { location.replace('./'); return; }
  if ($('#sc-led')) app.innerHTML = '';
  if (!$('#panelA')) { soltarEscena(); app.innerHTML = vistaTrabajo(); crearEscena(); }
  calculo = calcular();
  // v8.5 · tres zonas: «la pantalla» y «el equipo» fijas; las superficies y la ficha de lo elegido pasan al centro, con el resto del detalle
  const z = zonas(calculo), sc = {};
  ['A', 'B'].forEach(k => { const m = $('#panel' + k + ' .blq.act .blq-cuerpo'); if (m) sc[k] = [m.parentElement.dataset.blq, m.scrollTop]; });
  $('#panelA').innerHTML = z.A; $('#panelB').innerHTML = z.B;
  $('#res').innerHTML = vistaResultados(calculo) + z.equipo + modSuperficies(calculo);
  plegar();
  ['A', 'B'].forEach(k => { if (!sc[k]) return; const m = $(`#panel${k} .blq.act[data-blq="${sc[k][0]}"] .blq-cuerpo`); if (m) m.scrollTop = sc[k][1]; });
  activarVistas($('#res'), calculo, fijarDesdeVistas);
  barraEscena(); bandaOos();
  if (!sinEscena) { clearTimeout(tEsc); tEsc = setTimeout(construirEscena, 60); }
  if (window.SCSIMPLE) window.SCSIMPLE.aviso();   // v10.49 · el modo SIMPLE se repinta con el mismo cálculo
}
function construirEscena() {
  if (!escena || !calculo) return;
  const c = calculo, sala = c.esp.tipo === 'sala' ? { ancho: c.esp.ancho, fondo: c.esp.fondo, alto: c.esp.alto } : null;
  const xs = c.filas.map(f => Math.abs(f.s.x) + f.s.ancho / 2), zs = c.filas.map(f => Math.abs(f.s.z));
  // v8.0 · la escena abarca también los proyectores (a 25 m al otro lado de la calle, en torre…)
  (c.sombras && c.sombras.haces || []).forEach(h => { xs.push(Math.abs(h.lente.x) + 1); zs.push(Math.abs(h.lente.z) + 1); });
  escena.construir({
    sala, tecnologia: E.tecnologia, contenido: E.vista.contenido, etiquetas: E.vista.etiquetas, medio: medio ? { ...medio, modo: E.vista.modo } : null,
    sombras: E.tecnologia === 'proy' && E.vista.zona ? c.sombras : null, haces: c.sombras ? c.sombras.haces : null,
    puertas: puertasDe(c.esp).map(p => puertaMundo(p, c.esp)), obstaculos: obstaculosDe(c.esp), obstTapa: new Set(c.sombras && c.sombras.obst ? c.sombras.obst.map(x => x.k) : []),
    conflictos: new Set(E.tecnologia === 'proy' && c.sombras ? c.sombras.conflictos.map(k => k.tapa.sup + ':' + k.tapa.i).concat(c.sombras.choques.map(k => k.h.sup + ':' + k.h.i)) : []),
    superficies: c.filas, distPublico: c.dist, extX: Math.max(4, ...xs) * 2, extZ: Math.max(2, ...zs, c.dist), montaje: E.proy.montaje || 'auto',
    altoMax: Math.max(2, ...c.filas.map(f => f.s.elev + f.s.alto))
  });
}
async function crearEscena() {
  const lienzo = $('#lienzo3d');
  try {
    const { Escena } = await import('./escena.js');
    if (!lienzo.isConnected || escena) return; // se cambió de modo mientras se cargaba
    escena = new Escena(lienzo);
    escena.vistaActual = E.vista.camara === 'interior' ? 'dentro' : E.vista.camara;
    construirEscena();
  } catch (err) {
    console.error(err);
    $('#escena').insertAdjacentHTML('beforeend', `<div class="esc-aviso">${t('sinWebgl')}</div>`);
  }
}

// ---------- eventos ----------
// v7.3 · cada casilla actúa sola: si un valor choca con otro (la imagen más alta que la sala, una puerta fuera de su pared…),
// se ajusta el que depende de él y se avisa en el propio módulo, en vez de ignorar el valor en silencio
const ajuste = { esp: '', obst: '' };
function coherencia(k) {
  const e = E.esp, r2 = (v) => Math.round(v * 100) / 100, sala = e.tipo === 'sala' && E.cantidad === 'varias';
  ajuste.esp = ''; ajuste.obst = '';
  if (!sala) return;
  if ((k === 'esp.altoCubierto' || k === 'esp.elev') && e.altoCubierto > 0 && e.elev + e.altoCubierto > e.alto) { e.alto = r2(e.elev + e.altoCubierto); ajuste.esp = t('ajSala', { v: fmt(e.alto) }); }
  if (k === 'esp.elev' && !(e.altoCubierto > 0) && e.elev > e.alto - 0.5) { e.elev = r2(Math.max(0, e.alto - 0.5)); ajuste.esp = t('ajElev', { v: fmt(e.elev) }); }
  if (k === 'esp.alto') {
    if (e.elev > e.alto - 0.5) { e.elev = r2(Math.max(0, e.alto - 0.5)); ajuste.esp = t('ajElev', { v: fmt(e.elev) }); }
    if (e.altoCubierto > 0 && e.elev + e.altoCubierto > e.alto) { e.altoCubierto = r2(Math.max(0.1, e.alto - e.elev)); ajuste.esp = t('ajImagen', { v: fmt(e.altoCubierto) }); }
  }
  // puertas dentro de su pared y obstáculos dentro de la sala (su x y su z son el centro)
  const m = /^esp\.obst\.(\d+)\./.exec(k), todas = /^esp\.(ancho|fondo|alto)$/.test(k);
  if (!m && !todas) return;
  (e.obst || []).forEach((o, i) => {
    if (m && +m[1] !== i) return;
    const antes = JSON.stringify(o);
    if (o.tipo === 'puerta') { const L = o.pared === 'izquierda' || o.pared === 'derecha' ? e.fondo : e.ancho;
      o.ancho = r2(Math.min(o.ancho, L)); o.x = r2(Math.min(Math.max(0, o.x), L - o.ancho)); o.alto = r2(Math.min(o.alto, e.alto)); }
    else { o.ancho = r2(Math.min(o.ancho, e.ancho)); o.fondo = r2(Math.min(o.fondo, e.fondo)); o.alto = r2(Math.min(o.alto, e.alto));
      o.x = r2(Math.min(Math.max(o.ancho / 2, o.x), e.ancho - o.ancho / 2)); o.z = r2(Math.min(Math.max(o.fondo / 2, o.z), e.fondo - o.fondo / 2)); }
    if (JSON.stringify(o) !== antes) ajuste.obst = t(o.tipo === 'puerta' ? 'ajPuerta' : 'ajObst', { n: (o.tipo === 'puerta' ? t('puerta') : t('obst')) + ' ' + ((e.obst || []).slice(0, i + 1).filter(x => x.tipo === o.tipo).length) });
  });
}
function fijar(ruta, valor) { const p = ruta.split('.'); let o = E; for (let i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = valor;
  if (ruta === 'proy.altura' && E.proy.montaje === 'auto') { const pw = calculo && calculo.filas ? calculo.filas.find(f => f.s.tipo !== 'suelo' && f.pos) : null; E.proy.montaje = pw && !pw.pos.apoyo ? 'colgado' : 'apoyado'; } }
// v8.5 · el bloque que se toca pasa a ser el más reciente de su columna (es el último que se plegaría)
['pointerdown', 'focusin'].forEach(tipo => document.addEventListener(tipo, (ev) => { const q = ev.target.closest && ev.target.closest('.zona .blq'); if (q && !ev.target.closest('.blq-cab')) tocar(q.parentElement.dataset.zona, q.dataset.blq); }, true));
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('button, a[data-accion]'); if (!b || b.disabled) return;
  if (b.tagName === 'A') ev.preventDefault();
  if (b.dataset.set) { fijar(b.dataset.set, b.dataset.bool ? b.dataset.v === '1' : b.dataset.numV ? Number(b.dataset.v) : b.dataset.v);
    if (/^elec\.(backup|escalador|conexion)$/.test(b.dataset.set)) E.elec.sel = '';
    if (b.dataset.set === 'elec.marca' || b.dataset.set === 'elec.proyEq') { E.elec.selMedia = ''; E.elec.selBlend = ''; }
    if (/^led\.(clase|tipo|transp|gold|protegido|sol)$/.test(b.dataset.set)) { E.led.crm = ''; if (b.dataset.set === 'led.tipo') { E.led.nitsMin = 0; E.led.sol = ''; } }
    actualizar(b.dataset.set === 'esp.sueltas.disp' ? false : false); return; }
  if (b.dataset.pared) { E.esp.paredes[b.dataset.pared] = !E.esp.paredes[b.dataset.pared]; actualizar(); return; }
  if (b.dataset.cam) { E.vista.camara = b.dataset.cam; if (escena) escena.vista(b.dataset.cam === 'interior' ? 'dentro' : b.dataset.cam); barraEscena(); guardar(); return; }
  const a = b.dataset.accion;
  // nuevo cálculo: valores por defecto en el mismo modo de la consola
  if (a === 'inicio') { const cant = E.cantidad, tec = E.tecnologia; E = DEF(); E.cantidad = cant; E.tecnologia = tec; nlTexto = ''; const i = $('#nl-texto'); if (i) i.value = ''; estadoNl('');
    if (unaLed()) { guardar(); aIframe({ tipo: 'screens-reset' }); return; } actualizar(); return; }
  if (a === 'idioma') { fijarIdioma(IDIOMAS[(IDIOMAS.indexOf(idioma()) + 1) % IDIOMAS.length]); pintarCabecera();
    if (unaLed()) { pintarConsola(); aIframe({ tipo: 'screens-idioma', lang: idioma() }); return; }
    soltarEscena(); $('#app').innerHTML = ''; actualizar(); return; }
  if (a === 'info') { aIframe({ tipo: 'screens-info' }); return; }
  if (a === 'etiquetas') { E.vista.etiquetas = !E.vista.etiquetas; actualizar(); return; }
  if (a === 'zona') { E.vista.zona = !E.vista.zona; actualizar(); return; }
  if (a === 'subir') { const f = $('#medio-archivo'); if (f) f.click(); return; }
  if (a === 'pdf') { if (unaLed()) aIframe({ tipo: 'screens-pdf' }); else imprimir(); return; }
  if (a === 'nl-calcular') { calcularPeticion(); return; }
  if (a === 'nl-audio') { const f = $('#nl-archivo'); if (f) f.click(); return; }
  if (a === 'nl-mic') {
    if (escuchando) { try { escuchando.stop(); } catch (e) {} escuchando = null; pintarConsola(); return; }
    const i0 = $('#nl-texto'), base = (i0 ? i0.value : nlTexto).trim();   // lo dictado se añade a lo que ya estaba escrito
    // los últimos avisos de un dictado ya parado no pisan a uno nuevo que se haya empezado justo después
    let yo = null; const vivo = () => escuchando === yo || escuchando === null;
    yo = escuchando = globalThis.SC_VOZ.dictar(idioma(), (txt) => { if (!vivo()) return; nlTexto = (base ? base + ' ' : '') + txt; const i = $('#nl-texto'); if (i) i.value = nlTexto; },
      (e) => { if (!vivo()) return; if (e === 'micFin') { escuchando = null; pintarConsola(); if (nlTexto.trim()) estadoNl(t('est_listo')); } else estadoNl(t('est_' + e), e === 'escuchando'); });
    pintarConsola(); return;
  }
  if (a === 'elec-dante') { E.elec.dante = !E.elec.dante; E.elec.selMedia = ''; actualizar(); return; }
  // v8.5 · bloques de las zonas: abrir uno plegado, ir a las cifras o a la ficha y restablecer cada bloque por separado
  if (a === 'blq') { const zn = b.closest('.zona'); if (zn) { tocar(zn.dataset.zona, b.dataset.id); plegar(); } return; }
  if (a === 'calc-ir') { irA('.res-tot'); return; }
  if (a === 'ficha-ir') { irA('#det-equipo'); return; }
  if (/^reset-(a|a\d|b\d)$/.test(a)) { const d = DEF(), k = a.slice(6), cp = (o, src, ks) => ks.forEach(x => { o[x] = src[x]; }), led = E.tecnologia === 'led';
    if (k === 'a' || k === 'a1') { E.esp.tipo = d.esp.tipo; if (led) { cp(E.led, d.led, ['clase', 'tipo', 'transp', 'gold', 'protegido', 'sol', 'nitsMin']); E.led.crm = ''; } }
    if (k === 'a' || k === 'a2') { cp(E.esp, d.esp, ['ancho', 'fondo', 'alto']); E.esp.paredes = d.esp.paredes; cp(E.esp.sueltas, d.esp.sueltas, ['n', 'disp', 'ancho', 'alto', 'sep', 'angulo', 'central', 'cAncho', 'cAlto']); delete E.esp.sueltas.tams; }
    if ((k === 'a' || k === 'a3') && !led) cp(E.proy, d.proy, ['lux', 'luzUso', 'ganancia']);
    if (k === 'a' || k === 'a4') { cp(E.esp, d.esp, ['elev', 'altoCubierto']); cp(E.esp.sueltas, d.esp.sueltas, ['elev', 'dist', 'techo']); E.esp.obst = []; }
    if (k === 'b1') { if (led) E.led.crm = ''; else cp(E.proy, d.proy, ['cuerpo', 'optica', 'idSuelo', 'oos']); }
    if (k === 'b2') { if (led) E.led.ajuste = d.led.ajuste; else cp(E.proy, d.proy, ['solape', 'multi', 'dist', 'orient', 'montaje', 'altura']); }
    ajuste.esp = ''; ajuste.obst = ''; actualizar(); return; }
  if (a === 'nits') { const L = [0].concat(nitsLista()), v = +E.led.nitsMin || 0, i = L.indexOf(v) < 0 ? 0 : L.indexOf(v), j = Math.max(0, Math.min(L.length - 1, i + Number(b.dataset.d))); E.led.nitsMin = L[j]; E.led.crm = ''; actualizar(); return; }
  if (a === 'reset-elec') { E.elec = DEF().elec; actualizar(); return; }
  if (a === 'reset-esp') { E.esp = DEF().esp; actualizar(); return; }
  if (a === 'obst-add') { const e = E.esp; e.obst = e.obst || [];
    e.obst.push(b.dataset.tipo === 'puerta' ? { tipo: 'puerta', pared: e.paredes.trasera ? 'trasera' : 'frontal', x: 0.4, ancho: 0.9, alto: 2.1 }
      : { tipo: 'obstaculo', x: e.tipo === 'sala' ? Math.round(e.ancho * 0.3 * 10) / 10 : 1.5, z: e.tipo === 'sala' ? Math.round(e.fondo * 0.35 * 10) / 10 : 2, ancho: 0.4, fondo: 0.4, alto: e.tipo === 'sala' ? e.alto : 3 });
    actualizar(); return; }
  if (a === 'obst-del') { E.esp.obst.splice(Number(b.dataset.i), 1); actualizar(); return; }
  if (a === 'reintentar') { estadoCat = 'cargando'; actualizar(); cargarCatalogo((lista, estado) => { catalogo = lista; estadoCat = estado; if (!unaLed()) actualizar(); }); return; }   // v10.48
  if (a === 'reset-led') { E.led = DEF().led; actualizar(); return; }
  if (a === 'reset-proy') { E.proy = Object.assign(DEF().proy, { tipo: E.proy.tipo }); actualizar(); return; }   // el tipo de proyecto se mantiene
  // v8.2 · tipo de proyección: la sala inmersiva es «varias + sala»; mapping y pared, una o varias superficies sueltas
  if (a === 'tipo-proy') { const v = b.dataset.v;
    const antes = tipoProy();
    if (v === 'sala') { E.cantidad = 'varias'; E.esp.tipo = 'sala'; }
    else { E.proy.tipo = v; E.esp.tipo = 'sueltas'; }
    if (v === 'mapping' && antes !== 'mapping') alMapping();
    actualizar(); return; }
  // candados: al cerrarlo se fija el valor que estaba calculando AUTO; al abrirlo vuelve a AUTO
  if (a === 'lock-dist' || a === 'lock-alt') {
    const pw = calculo && calculo.filas ? calculo.filas.find(f => f.s.tipo !== 'suelo' && f.pos) : null, r2 = (v) => Math.round(v * 100) / 100;
    if (a === 'lock-dist') E.proy.dist = Number(E.proy.dist) > 0 ? 0 : (pw ? r2(pw.pos.dist) : 0);
    else if (Number(E.proy.altura) > 0) E.proy.altura = 0;
    else if (pw) { if (E.proy.montaje === 'auto') E.proy.montaje = pw.pos.apoyo ? 'apoyado' : 'colgado'; E.proy.altura = Math.max(0.01, r2(pw.pos.altura)); }
    actualizar(); return; }
  if (a === 'marca-proy') { if (alternaMarca(b.dataset.v)) actualizar(); return; }
  if (a === 'pub-ns-no') { E.proy.pubNS = false; actualizar(); return; }
  if (a === 'consejo-oos') { E.proy.oos = true; E.proy.oosArr = false; actualizar(); return; }
  if (a === 'una-imagen') { const q = calculo && calculo.unaImagen; if (q) { E.proy.cuerpo = q.modelo; E.proy.optica = q.optica || ''; actualizar(); } return; }   // v10.63
  if (a === 'consejo-alt') { const k = calculo && calculo.consejo; if (k && k.alt) { E.proy.cuerpo = k.alt.modelo; E.proy.optica = k.alt.optica || ''; actualizar(); } return; }
  if (a === 'quita-margen') { E.proy.distMin = 0; E.proy.distMax = 0; actualizar(); return; }
  if (a === 'proy-multi') { E.proy.multi = b.dataset.v === '1'; actualizar(); return; }   // v10.66
  if (a === 'proy-oos') { E.proy.oos = !E.proy.oos; E.proy.oosArr = false; actualizar(); return; }
  if (a === 'vt-modo') { E.vista.tec = b.dataset.v; actualizar(true); return; }   // v8.3 · distribución de las vistas técnicas
});
let tNum = 0, tRep = 0, nRep = 0, pasoPendiente = false;
// ▲▼: un toque = un paso; mantener pulsado repite (x5 y x10 al rato). Se recalcula al soltar (no a mitad de la pulsación).
function pasoNum(k, dir) {
  const i = document.querySelector(`input[data-num="${k}"]`); if (!i) return;
  const paso = parseFloat(i.step) || 1, min = parseFloat(i.min), max = parseFloat(i.max), dec = (String(i.step).split('.')[1] || '').length;
  let v = parseFloat(String(i.value).replace(',', '.')) || 0; const mult = nRep > 24 ? 10 : nRep > 10 ? 5 : 1;
  // distancia óptica en AUTO (0): ▲ fija la que AUTO estaba usando y sigue desde ahí
  if (k === 'proy.dist' && !v && dir > 0 && calculo) { const pw = calculo.filas.find(f => f.s.tipo !== 'suelo'); if (pw && pw.p.tMin) v = Math.round(pw.p.tMin / paso) * paso - paso; }
  let nv = Math.round((v + dir * paso * mult) / paso) * paso;
  if (!isNaN(min)) nv = Math.max(min, nv); if (!isNaN(max)) nv = Math.min(max, nv);
  nv = Number(nv.toFixed(dec)); i.value = nv; ajustarCasilla(i); fijar(k, nv); if (k === 'proy.lux') E.proy.luzUso = ''; coherencia(k); pasoPendiente = true; clearTimeout(tNum);
}
function pararRep() { clearTimeout(tRep); tRep = 0; nRep = 0; if (pasoPendiente) { pasoPendiente = false; clearTimeout(tNum); tNum = setTimeout(() => actualizar(), 30); } }
document.addEventListener('pointerdown', (ev) => {
  const b = ev.target.closest('.flecha'); if (!b || ev.button > 0) return;
  ev.preventDefault(); pararRep();
  const k = b.dataset.k, dir = Number(b.dataset.flecha); pasoNum(k, dir);
  const repetir = (espera) => { tRep = setTimeout(() => { nRep++; pasoNum(k, dir); repetir(70); }, espera); };
  repetir(420);
});
['pointerup', 'pointercancel', 'blur'].forEach(e => window.addEventListener(e, pararRep));
document.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.id === 'nl-texto') { ev.preventDefault(); calcularPeticion(); } });
document.addEventListener('input', (ev) => {
  const i = ev.target; if (i.id === 'nl-texto') { nlTexto = i.value; return; }
  if (i.dataset.rango) { const n = document.querySelector(`input[data-num="${i.dataset.rango}"]`); if (n) n.value = Number(i.value).toFixed(2); return; }
  if (!i.dataset.num) return; ajustarCasilla(i);
  const v = parseFloat(String(i.value).replace(',', '.'));
  if (isNaN(v)) return;
  const min = parseFloat(i.min), max = parseFloat(i.max);
  fijar(i.dataset.num, Math.min(isNaN(max) ? v : max, Math.max(isNaN(min) ? v : min, i.step === '1' ? Math.round(v) : v))); if (i.dataset.num === 'esp.sueltas.dist') E.proy.pubNS = false; if (i.dataset.num === 'proy.lux') E.proy.luzUso = ''; coherencia(i.dataset.num);
  // v8.4 · al recalcular se rehace el panel: la casilla recupera el foco con el cursor al final (las casillas numéricas no tienen
  // posición de cursor y el navegador lo dejaba al principio: al teclear despacio, «35» salía «53»)
  clearTimeout(tNum); tNum = setTimeout(() => { const foco = i.dataset.num; actualizar(); const n = document.querySelector(`[data-num="${foco}"]`); if (n) { n.focus(); const v = n.value; n.value = ''; n.value = v; } }, 600);
});
document.addEventListener('change', (ev) => {
  const s = ev.target;
  if (s.id === 'medio-archivo' && s.files && s.files[0]) { cargarMedio(s.files[0]); return; }
  if (s.id === 'nl-archivo' && s.files && s.files[0]) {
    globalThis.SC_VOZ.transcribir(s.files[0], idioma(), (e, p) => estadoNl(t('est_' + e, { p }), true))
      .then(txt => { if (!txt) { estadoNl(t('est_vacio')); return; } const i = $('#nl-texto'), base = (i ? i.value : nlTexto).trim(); nlTexto = (base ? base + ' ' : '') + txt; if (i) i.value = nlTexto; estadoNl(t('est_ok')); })
      .catch(err => estadoNl(t(err && err.message === 'formato' ? 'est_formato' : 'est_modelo')));
    s.value = ''; return;
  }
  if (s.dataset.sel) { fijar(s.dataset.sel, s.value); if (s.dataset.sel === 'proy.cuerpo') E.proy.optica = ''; actualizar(); }   // otro proyector: su óptica vuelve a AUTO
  if (s.dataset.rango) { fijar(s.dataset.rango, Math.round(Number(s.value) * 100) / 100); actualizar(); }   // v8.2 · deslizador del zoom: fija la distancia
  if (s.dataset.uso && s.value) { const u = USOS_LUZ.find(x => x[0] === s.value); if (u) { E.proy.lux = u[1]; E.proy.luzUso = u[0]; } actualizar(); }
  if (s.dataset.vtSel) { E.vista.vtSup = Number(s.value) || 0; actualizar(true); }   // v8.3 · superficie de las vistas técnicas
});

// PDF: hoja A4 en claro con cabecera, captura 3D, resultados, equipos, electrónica y avisos (se imprime con el navegador)
// v7.4 · cabecera en una fila de alto común (logo SCREENS a la izquierda, web y fecha al centro, logo AVHUB a la derecha),
// línea de cabecera suave con el tipo de proyecto y sus datos, y pie (aviso + eslogan) con número de hoja en todas las hojas
function imprimir() {
  const c = calculo; if (!c || !c.filas.length) return;
  const hoy = new Date(), fecha = hoy.toLocaleDateString(idioma() === 'en' ? 'en-GB' : 'es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' · ' + hoy.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  // v8.9 · la línea de crédito es la común de AVHUB (credito.js): el texto se edita en AVHUB ADMIN y es el mismo en todas las apps
  const cr = window.AVCREDITO ? window.AVCREDITO.plano('SCREENS', VERSION, idioma()) : null;
  // v10.38 · el pie del PDF es el mismo que el de la pantalla: aviso con su triángulo y, debajo, la línea de crédito tal cual
  const pie = cr ? cr[0].trim() : `SCREENS ${VERSION} ${hoy.getFullYear()} ${t('pie')}`, web = cr ? cr[1].trim() : 'by mediaservi.com';
  const cred = window.AVCREDITO ? window.AVCREDITO.html('SCREENS', VERSION, idioma(), { sinEnlaces: true }) : `${pie} <i class="ic ic-footer" aria-hidden="true"></i> ${web}`;
  /* v10.59 · la web y la fecha, en una sola línea con la letra pequeña de la fecha, centrada entre los dos logos y encogiendo si no cabe */
  let h = `<header class="im-cab"><img class="im-logo" src="assets/screens-logo-negro.svg" alt="SCREENS"><div class="im-url" style="--n:${('avhub.mediaservi.com · ' + fecha).length}"><span>avhub.mediaservi.com · ${fecha}</span></div><img class="im-avhub" src="assets/avhub-logo.svg" alt="AVHUB"></header>`;
  h += `<div class="im-titulo">${tituloPdf(c)}</div>`;
  { const o = oosDatos(c); if (escena) h += `<figure class="im-captura"><img src="${escena.captura(true, true)}" alt="">${o ? `<figcaption class="im-oos"><b>⚠ ${t('oos')}</b> ${oosUsaTxt(o)} ${t('oosCorto')}</figcaption>` : ''}</figure>`; }
  h += `<div class="im-res">${vistaResultados(c)}</div>`;
  const fichas = E.tecnologia === 'led' ? (c.modelo ? [fichaCab(c.modelo, totalCab(c))] : []) : [fichaProy(c.proyector, t('fProy'))].concat(c.prSuelo && c.prSuelo !== c.proyector && c.filas.some(f => f.s.tipo === 'suelo') ? [fichaProy(c.prSuelo, t('fProySuelo'))] : []);
  if (fichas.length) h += `<section class="res-sec im-equipos"><div class="res-tit">${t('equipos')}</div><div class="fichas">${fichas.join('')}</div></section>`;
  // pie en el margen inferior de cada hoja; si el navegador no dibuja esos márgenes (Safari, Firefox), va al final del documento.
  // Las cajas vacías de arriba y de abajo a la izquierda evitan que el navegador añada su fecha, título y dirección a la hoja
  if (cajasMargen()) h += `<style>@page { margin-bottom: 18mm; @top-left { content: "" } @top-center { content: "" } @top-right { content: "" } @bottom-left { content: "" } @bottom-center { content: url("data:image/svg+xml,${encodeURIComponent(AV_TRI_PDF.replace(/ style="[^"]*"/, ''))}") ${cssTxt(' ' + t('avisoPdf'))} "\\A" ${cssTxt(pie + (web ? ' ' : ''))} ${web ? icoPie() + ' ' + cssTxt(' ' + web) : ''}; } @bottom-right { content: counter(page) "/" counter(pages); } }</style>`;
  else h += `<p class="im-aviso">${AV_TRI_PDF}${t('avisoPdf')}</p><footer class="im-pie">${cred}</footer>`;
  const d = $('#impresion'); d.innerHTML = h;
  /* v10.61 · EQUIPOS va justo después del resumen, antes de las demás secciones: así llena el hueco de la primera hoja y el documento cabe en menos hojas */
  { const eq = d.querySelector('.im-equipos'), pri = d.querySelector('.im-res .res-sec'); if (eq && pri) pri.parentNode.insertBefore(eq, pri); }
  // fotos sin carga diferida (el bloque está oculto en pantalla) y, como mucho, 3 s de espera
  const imgs = [...d.querySelectorAll('img')]; imgs.forEach(i => { i.loading = 'eager'; });
  const espera = Promise.all(imgs.map(i => (i.complete ? 1 : new Promise(r => { i.addEventListener('load', r); i.addEventListener('error', r); }))));
  // v9.8 · el PDF se descarga directamente (pdf.js); el diálogo de impresión del navegador queda solo como recurso si falla
  Promise.race([espera, new Promise(r => setTimeout(r, 3000))]).then(() => setTimeout(() => {
    if (!window.AVPDF) return window.print();
    window.AVPDF.exporta({ raiz: d, pieHtml: `${AV_TRI_PDF}${t('avisoPdf')}\n${cred}`, ocultar: '#impresion .im-aviso, #impresion .im-pie', nombre: window.AVPDF.sello('SCREENS'), titulo: 'SCREENS · ' + fecha })
      .then(() => { d.innerHTML = ''; }).catch(e => { console.warn('PDF directo:', e); window.print(); });
  }, 60));
}
window.addEventListener('afterprint', () => { const d = $('#impresion'); if (d) d.innerHTML = ''; });

// línea de cabecera del PDF: tipo de proyecto y medidas, tecnología, superficies o disposición, equipos y cifras clave
function tituloPdf(c) {
  const esp = c.esp, T = c.tot || {}, led = E.tecnologia === 'led', sala = esp.tipo === 'sala', n = c.filas.length;
  // el nombre del tipo va en mayúsculas; las medidas no (la «m» de metro no pasa a «M»)
  const su = esp.sueltas, nCen = c.filas.filter(f => f.s.central).length;   // v7.9 · central de otra medida: «1 central de A × B m + 2 laterales de C × D m»
  const tm = !sala && Array.isArray(su.tams) && su.tams.length > 1 ? su.tams : null;   // v10.63 · varias LED, cada una con su medida
  const tipo = sala ? `<span>${t('sala')}</span> · ${fmt(esp.ancho)} × ${fmt(esp.fondo)} × ${fmt(esp.alto)} m`
    : tm ? `<span>${n} × ${t('pantalla')}</span> · ${tm.map(x => fmt(x[0]) + ' × ' + fmt(x[1])).join(' + ')} m`
    : nCen ? `<span>${n} × ${t('pantalla')}</span> · ${nCen} ${t('central')} ${fmt(su.cAncho)} × ${fmt(su.cAlto)} m + ${n - nCen} ${t('laterales')} ${fmt(su.ancho)} × ${fmt(su.alto)} m`
    : `<span>${n > 1 ? n + ' × ' : ''}${t('pantalla')}</span> · ${fmt(su.ancho)} × ${fmt(su.alto)} m`;
  const p = [led ? t('led') : t('proy') + (c.tipoP === 'mapping' ? ' · ' + t('tp_mapping') : '')];   // v8.2 · mapping
  if (sala) p.push(...c.filas.map(f => f.nombre)); else if (n > 1) p.push(t(esp.sueltas.disp));
  if (led && c.modelo) p.push(`${fmtPx(T.cab)} × ${c.modelo.crm} (${c.modelo.pitch} mm)`);
  if (!led) { const g = new Map(); c.filas.forEach(f => g.set(f.proyector, (g.get(f.proyector) || 0) + f.p.n)); p.push([...g].map(([q, k]) => `${fmtPx(k)} × ${q.marca ? q.marca + ' ' : ''}${q.nombre}`).join(' + '));
    // v8.0 · en vertical, a una distancia fija y con el montaje elegido
    if (c.filas.some(f => f.p.vert)) p.push(t('vert'));
    if (Number(E.proy.dist) > 0) p.push(`${t('aDist', { d: fmt(E.proy.dist, 2) })}`);
    else if (Number(E.proy.distMin) > 0 || Number(E.proy.distMax) > 0) p.push(`${Number(E.proy.distMin) > 0 ? fmt(E.proy.distMin, 1) : '0'}–${Number(E.proy.distMax) > 0 ? fmt(E.proy.distMax, 1) : '∞'} m`);   // v10.53 · margen de instalación
    if (E.proy.oos) p.push(t('oos').toLowerCase());
    if (E.proy.montaje === 'colgado' || E.proy.montaje === 'apoyado') p.push(t('mo_' + E.proy.montaje).toLowerCase() + (Number(E.proy.altura) > 0 ? ' ' + fmt(E.proy.altura, 1) + ' m' : '')); }
  if (T.lienzoW) p.push(`${fmtPx(T.lienzoW)}×${fmtPx(T.lienzoH)} px`);
  if (led && T.kw) p.push(`${fmt(T.kw, 1)} kW`);
  if (!led && isFinite(T.nitsMin)) p.push(`${fmt(T.nitsMin, 0)} nits`);
  /* v10.60 · el punto de separación va pegado a lo anterior: así ninguna línea del título empieza por «·» */
  return `<b>${tipo}</b> · ${p.join(' · ')}`.replace(/ · /g, '\u00a0· ');
}
// ¿dibuja el navegador las cajas de margen de @page (pie y número en cada hoja)? Chrome, Edge y Samsung Internet sí
function cajasMargen() { try { const s = new CSSStyleSheet(); s.replaceSync('@page { @bottom-center { content: "x" } }'); const r = s.cssRules[0]; return !!(r && r.cssRules && r.cssRules.length); } catch (e) { return false; } }
// triángulo de aviso del pie del PDF, el mismo de la pantalla (html2canvas solo lee atributos y estilos en línea del <svg>)
const AV_TRI_PDF = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;width:1.2em;height:1.2em;vertical-align:-.25em;margin-right:.35em"><path d="M12 3.6 2.4 20.2h19.2z"/><path d="M12 9.6v5"/><path d="M12 17.6h.01"/></svg>';
function cssTxt(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ') + '"'; }
// icono del pie (engranaje con corazón) en violeta para el margen de la hoja, a partir de la misma máscara de la interfaz
function icoPie() {
  const i = document.createElement('i'); i.className = 'ic ic-footer'; document.body.appendChild(i);
  const m = (getComputedStyle(i).getPropertyValue('--m').match(/data:image\/png;base64,[A-Za-z0-9+/=]+/) || [''])[0]; i.remove();
  if (!m) return '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="3 3 58 58"><filter id="f"><feFlood flood-color="#9900ff"/><feComposite in2="SourceGraphic" operator="in"/></filter><image width="64" height="64" href="${m}" filter="url(#f)"/></svg>`;
  return `url("data:image/svg+xml;base64,${btoa(svg)}")`;
}

// vídeo o imagen propios: se cargan en el navegador (no se suben a ningún servidor) y se aplican a todas las superficies
function cargarMedio(f) {
  const url = URL.createObjectURL(f), esVideo = /^video\//.test(f.type), nombre = f.name.length > 22 ? f.name.slice(0, 20) + '…' : f.name;
  const listo = (el, w, h) => { if (medio && medio.url) URL.revokeObjectURL(medio.url); medio = { el, tipo: esVideo ? 'video' : 'img', w, h, url, nombre }; E.vista.contenido = 'propio'; actualizar(); };
  if (esVideo) { const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.src = url;
    v.addEventListener('loadedmetadata', () => { listo(v, v.videoWidth, v.videoHeight); v.play().catch(() => {}); }, { once: true }); }
  else { const im = new Image(); im.onload = () => listo(im, im.naturalWidth, im.naturalHeight); im.src = url; }
}

// ---------- textos con margen de seguridad (si no caben, se reducen) ----------
function ajustarTextos() {
  document.querySelectorAll('.tog, .sec-btn, .pri, .tar .v, .tar .t, .sup-dat span, .campo label, .blq-nom, .blq-res, .zona-cab').forEach(el => {
    if (!el.offsetWidth) return;
    const clave = el.clientWidth + '|' + el.textContent; if (el.dataset.fit === clave) return;
    el.style.removeProperty('font-size'); el.dataset.fit = clave;
    const margen = el.matches('.tog, .sec-btn, .pri') ? 8 : 0;
    let fs = parseFloat(getComputedStyle(el).fontSize), k = 0;
    const cabe = () => el.scrollWidth <= el.clientWidth + 0.5 && (!margen || anchoTexto(el) <= el.clientWidth - margen);
    while (!cabe() && fs > 8 && k++ < 24) { fs -= 0.5; el.style.setProperty('font-size', fs + 'px'); }
  });
  document.querySelectorAll('input[data-num]').forEach(i => { if (i.offsetWidth) ajustarCasilla(i); });
}
// casillas numéricas: si el valor no cabe entero, se reduce la letra (nunca se corta)
function ajustarCasilla(i) { i.style.removeProperty('font-size'); let fs = parseFloat(getComputedStyle(i).fontSize), k = 0; while (i.scrollWidth > i.clientWidth + 0.5 && fs > 10 && k++ < 14) { fs -= 0.5; i.style.setProperty('font-size', fs + 'px'); } }
function anchoTexto(el) { const r = document.createRange(); r.selectNodeContents(el); const rs = [...r.getClientRects()]; if (!rs.length) return 0; return Math.max(...rs.map(q => q.right)) - Math.min(...rs.map(q => q.left)); }
const obsTextos = new MutationObserver(() => requestAnimationFrame(ajustarTextos));
['app', 'consola'].forEach(id => obsTextos.observe(document.getElementById(id), { childList: true, subtree: true }));
window.addEventListener('resize', () => requestAnimationFrame(() => { plegar(); ajustarPh(); }));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { ajustarTextos(); ajustarPh(); });

// ---------- cabecera y arranque ----------
function pintarCabecera() {
  $('#btn-idioma').textContent = idioma().toUpperCase();
  $('#btn-idioma').title = t('idioma');
  [['#btn-inicio', 'nuevo'], ['#btn-pdf', 'pdf'], ['#btn-info', 'info']].forEach(([id, k]) => { const b = $(id); b.title = t(k); b.setAttribute('aria-label', t(k)); });
  $('.marca').title = t('nuevo');
  $('#pie').innerHTML = (window.AVCREDITO ? window.AVCREDITO.html('SCREENS', VERSION, idioma()) : `SCREENS ${VERSION} ${new Date().getFullYear()} ${t('pie')} <i class="ic ic-footer" aria-hidden="true"></i> by <a href="https://mediaservi.com" target="_blank" rel="noopener">mediaservi.com</a>`) + `<a class="admin-btn" href="${ADMIN_URL}" target="_blank" rel="noopener" title="${t('admin')}" aria-label="${t('admin')}"><i class="ic ic-admin" aria-hidden="true"></i></a>`;
}
fijarIdioma(idiomaInicial(), false);
pintarCabecera();
// v10.48 · una petición de proyector escrita en la portada llega aquí y se calcula al abrir
try { const pp = localStorage.getItem('screens_peticion'); if (pp) { localStorage.removeItem('screens_peticion'); nlTexto = pp; setTimeout(() => { const i = $('#nl-texto'); if (i) i.value = pp; calcularPeticion(); }, 0); } } catch (e) {}
actualizar();
// uso sin conexión: el mismo service worker de la raíz (red primero, copia guardada si no hay red)
try { if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
cargarEquipos(() => { if (!unaLed()) actualizar(); });
cargarCatalogo((lista, estado) => { catalogo = lista; estadoCat = estado; if (!unaLed()) actualizar(); });
// v10.49 · lo que usa el modo SIMPLE (vista/simple.js): el mismo estado y el mismo cálculo que PRO
window.__consola = { get E() { return E; }, MARCAS: MARCAS_PROY, marcas: marcasActivas, marca: alternaMarca, DEF, actualizar: () => actualizar(), get c() { return calculo; }, get estadoCat() { return estadoCat; }, peticion: () => calcularPeticion(), mapping: () => alMapping(), USOS_LUZ, LED_MAX };
if (window.SCSIMPLE) window.SCSIMPLE.aviso();
