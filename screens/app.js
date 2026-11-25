// SCREENS · interfaz (consola fija con petición en lenguaje natural, panel de rack, simulación 3D y resultados)
import { cargarCatalogo, cargarEquipos, ordenar, enStock, nivelStock, cabeEnBatch, esInterno, urlAccesoInterno, salirInterno } from './catalogo.js';
document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('[data-salir-interno]'); if (a) { e.preventDefault(); e.stopPropagation(); salirInterno(); } }, true);   /* v10.88 · candado verde: cerrar el acceso interno */
import { superficies, distanciaPublico, elegirModelo, calcularLed, totales, aplicarPuertas, obstaculoMundo, puertaMundo, PX_PUERTO } from './led.js';
import { svgPlanoSenal, svgPlanoElec, planCosido } from '../vista/plano-led.js?v=11.13';   // v10.94 · planos técnicos de señal y alimentación en el PDF
import { tr as trPlano, fijaIdioma as idiomaPlano } from '../vista/idiomas.js?v=10.71';
import { PROYECTORES, CUERPOS, calcularPared, calcularSuelo, SOLAPE_MAX, SOLAPE_RECO, RECORTE_MAX, analizarSombras, obstaculosEnHaces, rangoLente } from './proyeccion.js';
// v10.54 · marcas de proyección que hay en el catálogo, en su orden de prioridad (a igualdad de resultado: EPSON > VIVITEK > CHRISTIE)
const ORDEN_MARCA = ['EPSON', 'VIVITEK', 'CHRISTIE'], prioMarca = (m) => { const i = ORDEN_MARCA.indexOf(m); return i < 0 ? ORDEN_MARCA.length : i; };
/* v11.7 · proyectores que se priorizan en salas inmersivas (decidido por Josep, 24-11-2026: el EB-L695SE vale para casi todo y es el más vendido) */
const PRIO_SALA = ['EB-L695SE'];
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

const VERSION = 'v11.16';
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
  proy: { tipo: 'pared', cuerpo: '', optica: '', idSuelo: '', solape: 15, multi: false, lux: 140, luzUso: 'reunion', ganancia: 1, dist: 0, distMin: 0, distMax: 0, pubNS: false, marcas: [], orient: 'auto', montaje: 'auto', altura: 0, oos: false, lmMin: 0, tipoOpt: '' },
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
  if (protegidoLed()) { const p = lista.filter(esProt); if (p.length) lista = p; else if (E.led.protegido) avisoLed.push(t('relProt')); }   // v10.89 · en una sala (protegido por defecto) no se avisa al entrar: solo si se ha pedido a mano
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
const USOS_LUZ = [['reunion', 140], ['aula', 210], ['evento', 140], ['salon', 70], ['teatro', 14], ['oscura', 15], ['calle', 5]];
// v10.89 · la luz por defecto va con el tipo: sala inmersiva a oscuras 15 lx, mapping de noche 5 lx, pared 140 lx (solo si no se ha tocado)
const LUZ_TIPO = { sala: ['oscura', 15], mapping: ['calle', 5], pared: ['reunion', 140] };
function luzDeTipo(v) { const p = E.proy, def = Object.values(LUZ_TIPO).some(u => u[0] === p.luzUso && u[1] === Number(p.lux)); if (def && LUZ_TIPO[v]) { p.luzUso = LUZ_TIPO[v][0]; p.lux = LUZ_TIPO[v][1]; } }
// v10.63 · el mapping arranca con una fachada de 6 m de alto y el proyector a 6 m (sin techo): se pone al pasar a mapping desde otro tipo
let ANTES_MAP = null;   /* v10.98 · lo que había antes de pasar a mapping, para devolverlo al salir */
function alMapping() { const s = E.esp.sueltas; ANTES_MAP = { ancho: s.ancho, alto: s.alto, dist: Number(E.proy.dist) || 0, distMin: E.proy.distMin, distMax: E.proy.distMax }; s.alto = 6; s.ancho = Math.round(6 * 16 / 9 * 100) / 100; Object.assign(E.proy, { dist: 6, distMin: 0, distMax: 0 }); }
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
  if (!E.proy.luzMano) luzDeTipo(tipoProy());   /* v10.99 · la luz por defecto es la del tipo (sala inmersiva 15 lx, mapping 5 lx, pared 140 lx) también al arrancar, al restablecer y al cambiar de modo; antes solo al pulsar el tipo, y la sala inmersiva arrancaba a 140 lx */
  const sups = superficies(esp, 0);
  const una = esp.tipo === 'sueltas' && !E.proy.multi && !forzarMulti;
  const opc = { solapeMin: E.proy.solape / 100, oos: !!E.proy.oos, una, nitsMin: forzarMulti === 'brillo' ? nitsObjetivo() / Math.max(0.1, Number(E.proy.ganancia) || 1) : 0 };
  // v8.0 · distancia fija (torres al otro lado de la calle, truss…), orientación (horizontal / vertical) y montaje con su altura
  /* v10.96 · en una sala, un candado que ya no cabe (una distancia fijada mayor que lo que da la sala hasta la pared de enfrente, o una altura por
     encima del techo, que venían de otra sala o de otro modo) se suelta solo: vuelve a AUTO y se avisa. Antes se respetaba y salía un tiro imposible */
  if (esp.tipo === 'sala') { const pw0 = sups.filter(s => s.tipo !== 'suelo'), cabe = pw0.length ? Math.min(...pw0.map(s => alcance(esp, s, 0))) : Infinity, d0 = Number(E.proy.dist) || 0, a0 = Number(E.proy.altura) || 0;
    if (d0 > cabe + 1e-6) { SUELTO.dist = d0; E.proy.dist = 0; } if (a0 > esp.alto + 1e-6) { SUELTO.altura = a0; E.proy.altura = 0; } }
  else { const th = Number(esp.sueltas.techo) || 0, a0 = Number(E.proy.altura) || 0; if (th > 0 && a0 > th + 1e-6) { SUELTO.altura = a0; E.proy.altura = 0; } }   /* v10.99 · también en pared y en una pantalla */
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
  const optPared = { ...opc, banda: esp.tipo === 'sala' ? 1.9 : 0, dist: fijaDist, orient: E.proy.orient || 'auto', trObjetivo: tipoP === 'mapping' && !fijaDist && !hayRango ? TR_MAPPING : 0, tiroObjetivo: tiroPared };
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
  const pref0 = (q) => (tipoP === 'mapping' ? (hayRango ? (trPared ? desvTR(q, trPared) * 0.3 : 0) : !fijaDist ? ((q.ust || q.trMax < 1) ? 80 : 0) + desvTR(q, TR_MAPPING) * 0.3 : 0)   /* v10.98 · en mapping ya no se prefiere el más luminoso porque sí: el brillo lo decide el objetivo, como en los demás tipos */
    : tipoP === 'pared' ? (q.ust ? 0.5 : 0) + (trPared ? desvTR(q, trPared) * 0.3 : 0) : 0);
  // v10.58 · la prioridad de marca manda en automático (EPSON > VIVITEK > CHRISTIE): 5.000 puntos por escalón, más que cualquier diferencia de
  // número de equipos o de brillo y menos que una instalación que no cabe o con sombras. Así, la siguiente marca solo sale si con la anterior
  // no hay una instalación limpia; para calcular con otra, se apagan las demás o se elige el proyector.
  const pref = (q) => pref0(q) + prioMarca(q.marca) * 50;
  const coloc = { montaje: E.proy.montaje || 'auto', altura: Math.max(0, Number(E.proy.altura) || 0) };
  const altoEsc = esp.tipo === 'sala' ? esp.alto : Number(esp.sueltas.techo) > 0 ? Math.max(Number(esp.sueltas.techo), ...sups.map(s => s.elev + s.alto)) : Math.max(3, ...sups.map(s => s.elev + s.alto)) + 0.8;   /* v10.98 · con techo dicho, los proyectores no pueden subir por encima de él al separarlos */
  const obs = obstaculosDe(esp), haySuelo = sups.some(s => s.tipo === 'suelo');
  // un mismo modelo para todas las paredes; el suelo puede llevar el mismo u otro
  const montar = (pP, pS, extra, pC) => {   /* v11.4 · pC: proyector de la pantalla central cuando es de otra medida que las laterales */
    const filas = sups.map(s => s.tipo === 'suelo'
      ? { s, p: calcularSuelo(s, pS, { altoSala: esp.alto, ...opc, ...(extra || {}) }), proyector: pS, nombre: nombreSup(s) }
      : ((q) => ({ s, p: calcularPared(s, q, { alcance: alcanceDe(s), ...optDe(q, extra) }), proyector: q, nombre: nombreSup(s) }))(s.central && pC ? pC : pP));
    let cerca = 0; filas.forEach(f => { if (f.s.tipo !== 'suelo' && corta(f.p)) { f.p.fuera = true; cerca++; } });   // más cerca de lo que se puede poner: no cabe
    const S = analizarSombras(filas, esp, altoEsc, coloc); S.obst = obstaculosEnHaces(obs, S.haces);
    /* v11.0 · proyectores de pared que quedarían bajo el suelo o por encima del techo (pasaba con las ultracortas plegadas y salía en verde): cuentan
       como instalación que no se puede montar, para que AUTO busque otra y, si no la hay, el veredicto lo diga en rojo */
    { const tope = esp.tipo === 'sala' ? esp.alto : (Number(esp.sueltas.techo) > 0 ? Number(esp.sueltas.techo) : Infinity); S.fueraSala = (S.haces || []).filter(h => !h.suelo && h.lente && (h.lente.y < 0.03 || h.lente.y > tope + 0.03)).length; }
    /* v11.7 · en sala inmersiva, el más vendido (EB-L695SE) va primero cuando da un contraste de 10:1 en todas las paredes: gana aunque lleve hasta dos equipos más */
    const lxS = Number(E.proy.lux), lxs = isFinite(lxS) && lxS >= 0 ? lxS : 15;
    const prio = esp.tipo === 'sala' && PRIO_SALA.includes(pP.modelo) && filas.every(f => f.s.tipo === 'suelo' || lxs <= 0 || (f.p.lux + lxs) / lxs >= 10) ? -400 : 0;
    const falta = opc.nitsMin ? filas.reduce((a, f) => a + (f.s.tipo !== 'suelo' && f.p.nits < opc.nitsMin ? (1 - f.p.nits / opc.nitsMin) * 2000 : 0), 0) : 0;   /* v11.11 · en el blending por brillo, lo que falta para llegar pesa más que los equipos de más */
    return { filas, S, coste: costeInstalacion(filas, S) + pref(pP) * 100 + cerca * 1e9 + prio + falta };
  };
  // AUTO: la instalación limpia (sin chasis que choquen ni proyectores dentro de otros haces) con menos equipos y más brillo.
  // Con el catálogo completo (cuerpos × ópticas), primero se puntúa cada combinación con el cálculo rápido de las paredes
  // y solo las mejores pasan por la colocación completa con sombras y choques
  const rapido = (q) => { let k = pref(q) * 1000, nm = Infinity; sups.forEach(s => { if (s.tipo === 'suelo') return; const r = calcularPared(s, q, { alcance: alcanceDe(s), ...optDe(q) });
    k += (r.fuera || corta(r) ? 1e7 : 0) + (r.noCubre ? 4e6 : 0) + (r.limite || r.chica ? 2e6 : 0) + (r.solapeRel > SOLAPE_MAX + 1e-6 ? 5e6 : 0) + r.n * 1000 + (r.recorte + r.recorteX) * 300 - valeBrillo(r.nits) * 0.5 + (opc.nitsMin && r.nits < opc.nitsMin ? (1 - r.nits / opc.nitsMin) * 20000 : 0); nm = Math.min(nm, r.nits); }); return k + q.lumens / 1000 * 1.5 * pesoLm(nm); };
  const supS = sups.find(s => s.tipo === 'suelo');
  const rapidoS = (q) => { const r = calcularSuelo(supS, q, { altoSala: esp.alto, ...opc }); return r.n * 1000 - valeBrillo(r.nits) * 0.5 + q.lumens / 1000 * 1.5 * pesoLm(r.nits); };
  const mejores = (lista, k = 10, fc = rapido) => lista.length <= k ? lista : lista.map(q => ({ q, c: fc(q) })).sort((a, b) => a.c - b.c).slice(0, k).map(x => x.q);
  const mejorDe = (lista, fn) => lista.map(q => ({ q, r: fn(q) })).sort((x, y) => x.r.coste - y.r.coste)[0];
  // v10.54 · solo las marcas activadas (todas, si no se ha quitado ninguna)
  const mAct = marcasActivas(), CAT = mAct.length === MARCAS_PROY.length ? PROYECTORES : PROYECTORES.filter(q => mAct.includes(q.marca));
  // v10.89 · lúmenes mínimos y tipo de óptica pedidos (petición o MATERIAL): solo si queda alguno que los cumpla
  const lmMin = Number(E.proy.lmMin) || 0, tOpt = E.proy.tipoOpt || '';
  const CATf = CAT.filter(q => (!lmMin || q.lumens >= lmMin * 0.97) && (!tOpt || tipoTiro(q) === tOpt));
  const cand = (CATf.length ? CATf : CAT).filter(q => (!E.proy.cuerpo || q.modelo === E.proy.cuerpo) && (!E.proy.optica || q.optica === E.proy.optica));
  let lista = cand.length ? cand : CAT;
  if (!cand.length && E.proy.cuerpo && E.proy.optica) { const soloC = CAT.filter(q => q.modelo === E.proy.cuerpo); if (soloC.length) { lista = soloC; E.proy.optica = ''; } }   // v10.89 · una óptica que no va con ese cuerpo: se queda el cuerpo, la óptica vuelve a AUTO
  const fijo = lista.length === 1 ? lista[0] : null, fijoS = E.proy.idSuelo && PROYECTORES.find(p => p.id === E.proy.idSuelo);
  let proyector, prSuelo, inst, auto = null;
  // v10.63 · una sola marca por proyecto: el proyector del suelo es de la misma marca que el de las paredes (uno elegido a mano de otra marca
  // no se usa). Sin paredes, el proyector del proyecto es el del suelo (antes se nombraba uno de pared que no estaba).
  const hayPared = sups.some(s => s.tipo !== 'suelo');
  if (!hayPared && haySuelo) { proyector = fijo || (fijoS && mAct.includes(fijoS.marca) ? fijoS : null) || mejorDe(mejores(lista, 8, rapidoS), q => montar(q, q)).q; prSuelo = proyector; }
  else {
    if (fijo) { proyector = fijo; }
    else { const fn = q => montar(q, fijoS && fijoS.marca === q.marca ? fijoS : q), orden = lista.length <= 10 ? lista : lista.map(q => ({ q, c: rapido(q) })).sort((x, y) => x.c - y.c).map(x => x.q);
      let m = mejorDe(orden.slice(0, 10), fn);
      /* v10.97 · si entre los diez primeros ninguno queda limpio (chasis que chocan o proyectores dentro de otro haz), se miran los treinta siguientes */
      let vistos = 10; if (orden.length > 10 && (m.r.S.conflictos.length || m.r.S.choques.length || m.r.filas.some(f => f.s.tipo !== 'suelo' && (f.p.parcial > 0.01 || f.p.fuera || f.p.noCubre || f.p.limite || f.p.chica || Math.max(f.p.recorte, f.p.recorteX) > RECORTE_MAX + 1e-6)))) {   /* v11.12 · también si lo mejor de los diez primeros no cubre bien */ vistos = 40; const m2 = mejorDe(orden.slice(10, 40), fn); if (m2 && m2.r.coste < m.r.coste) m = m2; }
      /* v11.7 · en sala inmersiva se prueban siempre los priorizados (EB-L695SE) y las ultracortas de óptica fija (EB-815E, EB-805F), que el cálculo rápido deja atrás por número de equipos */
      if (esp.tipo === 'sala') { const ex = lista.filter(q => (PRIO_SALA.includes(q.modelo) || (q.ust && !q.optica)) && !orden.slice(0, vistos).includes(q)); if (ex.length) { const m3 = mejorDe(ex, q => montar(q, fijoS && fijoS.marca === q.marca ? fijoS : haySuelo && m.q.marca === q.marca ? m.q : q));   // con suelo, de momento el del mejor (luego se elige el suyo)
         if (m3 && m3.r.coste < m.r.coste) m = m3; } }
      proyector = m.q; }
    if (fijoS && fijoS.marca === proyector.marca) prSuelo = fijoS;
    else if (haySuelo) { const LS = CAT.filter(q => q.marca === proyector.marca), fnS = q => montar(proyector, q), ordS = LS.length <= 8 ? LS : LS.map(q => ({ q, c: rapidoS(q) })).sort((x, y) => x.c - y.c).map(x => x.q);
      let m = mejorDe(ordS.slice(0, 8), fnS); if (ordS.length > 8 && (m.r.S.conflictos.length || m.r.S.choques.length)) { const m2 = mejorDe(ordS.slice(8, 36), fnS); if (m2 && m2.r.coste < m.r.coste) m = m2; }   // v10.97 · igual que en las paredes
      prSuelo = m.q; }
    else prSuelo = proyector;
  }
  /* v11.4 · pantallas de medidas distintas (una central y laterales): cada medida lleva el proyector justo para su tamaño, de la misma marca.
     Antes las tres llevaban el que pedía la central y las laterales salían con muchos más lúmenes de los necesarios. Con el modelo elegido a mano, ese en todas */
  let prCentral = null;
  if (!fijo && esp.tipo === 'sueltas' && sups.some(s => s.central) && sups.some(s => s.tipo !== 'suelo' && !s.central)) {
    const rapDe = (sub) => (q) => { let k = pref(q) * 1000, nm = Infinity; sub.forEach(s => { const r = calcularPared(s, q, { alcance: alcanceDe(s), ...optDe(q) });
      k += (r.fuera || corta(r) ? 1e7 : 0) + (r.noCubre ? 4e6 : 0) + (r.limite || r.chica ? 2e6 : 0) + (r.solapeRel > SOLAPE_MAX + 1e-6 ? 5e6 : 0) + r.n * 1000 + (r.recorte + r.recorteX) * 300 - valeBrillo(r.nits) * 0.5; nm = Math.min(nm, r.nits); }); return k + q.lumens / 1000 * 1.5 * pesoLm(nm); };
    const LM = lista.filter(q => q.marca === proyector.marca), top = (fc) => LM.map(q => ({ q, c: fc(q) })).sort((x, y) => x.c - y.c).slice(0, 10).map(x => x.q);
    const mal = (r) => [r.filas.filter(f => f.p.fuera).length + (r.S.fueraSala || 0), r.filas.filter(f => f.p.noCubre || f.p.limite || f.p.chica).length, r.S.conflictos.length + r.S.choques.length, r.filas.reduce((n, f) => n + f.p.n, 0)];
    const rA = montar(proyector, prSuelo), mA = mal(rA);
    /* se reparte si no empeora nada: ni lo que no cabe, ni lo que no cubre, ni choques, ni número de equipos, ni el brillo útil de ninguna pantalla.
       v11.5 · cada medida se queda con el primero de su lista (el que mejor le va a ella sola) que cumple eso */
    const vale = (r) => { const m = mal(r); return m.every((v, i) => v <= mA[i]) && r.filas.every((f, i) => valeBrillo(f.p.nits) >= valeBrillo(rA.filas[i].p.nits) - 1); };
    const pL = top(rapDe(sups.filter(s => s.tipo !== 'suelo' && !s.central))).find(q => vale(montar(q, prSuelo, null, proyector))) || proyector;
    const pCn = top(rapDe(sups.filter(s => s.central))).find(q => vale(montar(pL, prSuelo, null, q))) || proyector;
    const op = pL !== proyector || pCn !== proyector ? [pL, pCn] : null;
    if (op) { const cen0 = proyector; proyector = op[0]; prCentral = op[1] !== op[0] ? op[1] : null; if (prSuelo === cen0 && !haySuelo) prSuelo = proyector; }
  }
  inst = montar(proyector, prSuelo, null, prCentral);
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
  const c = { esp, dist, proyector, prSuelo, prCentral, filas, tot, autoPropone: auto, consejo, unaImagen, grupos, lx, gan, tipoP, zona, zonaN, zonaO, una, multi: esp.tipo === 'sueltas' && !una };
  c.sombras = inst.S;
  // v10.66 · con una imagen no se llega (no cubre, no cabe, pasa del máximo o sobra más del recorte admitido): se mira el blending
  if (una && hayPared && filas.some(f => f.s.tipo !== 'suelo' && (f.p.fuera || f.p.noCubre || f.p.limite || f.p.chica || Math.max(f.p.recorte, f.p.recorteX) > RECORTE_MULTI + 1e-6))) {
    const alt = calcular(true);
    if (blendLimpio(alt)) {
      if (!E.proy.cuerpo && !E.proy.optica) { alt.multiAuto = true; alt.veredicto = veredicto(alt); return alt; }
      c.multiPosible = { n: alt.tot.n, q: alt.proyector };
    }
  }
  /* v11.11 · con una sola imagen no se llega al brillo (contraste por debajo de 10:1 con la luz del sitio): AUTO propone blending con los proyectores
     que hagan falta para llegar (decidido por Josep, 24-11-2026), si monta limpio y mejora de verdad el contraste */
  else if (una && hayPared && !E.proy.cuerpo && !E.proy.optica && !fijaDist && tot.contrasteMin < 10) {
    const alt = calcular('brillo');
    const rk = (v) => ({ V: 0, A: 1, R: 2 })[v && v.nivel] ?? 2; c.elec = electronica(c); const v0 = veredicto(c);   // solo si el veredicto mejora (no cambia un rojo por otro)
    if (blendLimpio(alt) && alt.tot.contrasteMin > tot.contrasteMin * 1.25 && rk(alt.veredicto) < rk(v0)) { alt.multiAuto = true; alt.multiBrillo = true; alt.veredicto = veredicto(alt); return alt; }
  }
  c.elec = electronica(c); c.veredicto = veredicto(c); return c;
}
/* v10.97 · BRILLO JUSTO (aviso de Josep, 24-11-2026: AUTO proponía proyectores de 20.000 y 30.000 lm para una sala a oscuras). AUTO ya no busca el
   máximo brillo: busca el que hace falta para un contraste de 15:1 con la luz del sitio (como poco 45 nits, como mucho 250) y, entre los que llegan,
   el de menos lúmenes. Llegar al objetivo vale lo mismo que antes valía llegar a 250 nits; pasarse no suma y los lúmenes de más restan un poco */
/* v10.98 · en mapping (fachadas, que no son una pantalla blanca) el mínimo es de 80 nits. El objetivo del 15:1 tiene tope de 250 nits, pero AUTO ya no se queda en rojo
   si un equipo mayor lo evita: con mucha luz sube hasta un contraste de 10:1 (v11.5) */
const nitsObjetivo = () => { const n = Number(E.proy.lux), lx = isFinite(n) && n >= 0 ? n : 140; return Math.max(Math.min(250, Math.max(tipoProy() === 'mapping' ? 80 : 45, 14 * lx / Math.PI)), 9 * lx / Math.PI); };   /* v11.5 · con luz ambiente, AUTO sube hasta un contraste de 10:1 (decidido por Josep, 24-11-2026; antes 7:1) */
const valeBrillo = (nits) => { const o = nitsObjetivo(); return Math.min(nits, o) * 250 / o; };
/* v11.5 · los lúmenes de más solo penalizan cuando sobran: si el equipo no llega al brillo buscado, la penalización baja en proporción (con mucha luz,
   al subir el objetivo, ganaba el proyector más flojo por ahorrar lúmenes) */
const pesoLm = (nits) => Math.min(1, Math.max(0, nits) / nitsObjetivo());
const SUELTO = { dist: 0, altura: 0 };   // v10.96 · candados soltados por no caber en la sala (hasta que se vuelva a fijar uno)
// coste de una instalación de proyección: primero que quepa, luego que no haya sombras de equipos ni choques, luego menos proyectores y más brillo
function costeInstalacion(filas, S) {
  let n = 0, fuera = 0, limite = 0, nits = Infinity;
  filas.forEach(f => { n += f.p.n; if (f.p.fuera) fuera++; if (f.p.limite || f.p.chica) limite++; nits = Math.min(nits, f.p.nits); });
  const zona = S.zona && S.zona.ok ? S.zona.ancho * S.zona.fondo : 0;
  // v10.63 · también cuenta que no cubra (antes ganaba la que no cubría por llevar menos equipos) y el solape excesivo
  const noCubre = filas.filter(f => f.p.noCubre).length, solape = filas.filter(f => f.s.tipo !== 'suelo' && f.p.solapeRel > SOLAPE_MAX + 1e-6).length;
  return fuera * 1e7 + (S.fueraSala || 0) * 2e6 + noCubre * 1e6 + solape * 1.5e6 + (S.conflictos.length + S.choques.length) * 1e5 + (S.obst ? S.obst.length : 0) * 1e4 + limite * 2000 + filas.filter(f => f.p.parcial > 0.01).length * 6000 + n * 100 - valeBrillo(nits) + Math.max(0, ...filas.map(f => (f.proyector && f.proyector.lumens) || 0)) / 1000 * 1.5 * pesoLm(nits) - zona * 2;
}
// v10.63 · UN SOLO VEREDICTO: lo calcula el motor con todo lo que avisa PRO y lo pintan igual PRO (arriba de RESULTADOS y en el PDF) y SIMPLE
// (su semáforo y la lista de avisos). Rojo: no se puede montar así; ámbar: se puede, pero hay algo que corregir. De más a menos grave.
const nombreQ = (q) => (q ? (q.marca ? q.marca + ' ' : '') + q.nombre : '');
// desplazamiento de la lente que pide la colocación frente al que da la óptica (en vertical, el de la sala es el horizontal de la óptica)
// v10.89 · clase de óptica por su relación de tiro: ultracorta, corta, estándar o larga
export const tipoTiro = (q) => (q.ust || q.plegada || q.trMax < 0.42 ? 'ust' : q.trMax < 1 ? 'corta' : q.trMin >= 2.4 ? 'larga' : 'estandar');
const limShift = (f) => { const q = f.proyector; return !q || q.plegada || !q.shiftV ? 0 : f.p.vert ? q.shiftH : q.shiftV; };
// v10.89 · el desplazamiento se compara con el rango real de la óptica (asimétrico y con offset en Vivitek), según vaya colgado o sobremesa
const pasaShift = (f) => { if (!f.pos || !limShift(f)) return false; const r = rangoLente(f.proyector, f.p.vert, f.pos.apoyo).map(v => v * 100); return f.pos.shiftV < r[0] - 0.5 || f.pos.shiftV > r[1] + 0.5; };
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
    if (SUELTO.dist) A('candadoDist', t('vCandadoDist', { d: fmt(SUELTO.dist, 2) })); if (SUELTO.altura) A('candadoAlt', t('vCandadoAlt', { d: fmt(SUELTO.altura, 2) }));
    { const lm = Number(E.proy.lmMin) || 0, to = E.proy.tipoOpt || ''; if (lm || to) A('filtro', t('vFiltro', { s: [lm ? '≥ ' + fmtPx(lm) + ' lm' : '', to ? t('opt_' + to).toLowerCase() : ''].filter(Boolean).join(' · ') })); }   /* v10.99 · se ve lo que limita la elección */
    if (S.fueraSala) R('fueraSala', t('vFueraSala', { n: S.fueraSala }));
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
    pw.filter(f => f.p.parcial > 0.01).forEach(f => A('parcial', t('vParcial', { s: f.nombre, a: fmt(f.p.imgH, 2), h: fmt(f.s.alto, 2) })));   /* v11.7 */
    if (nlNoUsado.length) A('nl', t('vNoUsado', { s: nlNoUsado.map(x => '«' + x + '»').join(', ') }));
    { const L = pw.filter(pasaShift); if (L.length) R('shift', t('vShift', { s: nom(L) })); }   // v10.89 · la lente no llega: en rojo (la imagen no se puede poner ahí)
    { const L = pw.filter(f => f.p.fueraMec); if (L.length) R('foco', t('vFocoMec', { s: nom(L) })); else { const L2 = pw.filter(f => f.p.fueraFoco); if (L2.length) A('foco', t('vFoco', { s: nom(L2) })); } }
    pw.filter(f => f.pos && f.pos.techo > 0 && f.pos.y1 > f.pos.techo + 0.005).forEach(f => A('techo', t('vTecho', { n: f.nombre, d: fmt(f.pos.y1 - f.pos.techo, 2) })));
    pw.filter(f => f.pos && f.pos.y0 < -0.005).forEach(f => A('suelo', t('vSuelo', { n: f.nombre, d: fmt(-f.pos.y0, 2) })));
    if (c.tipoP === 'pared' && !E.proy.pubNS) (S.franjas || []).filter(f => f.prof > c.dist).forEach(f => A('publico', t('segPublico', { d: fmt(c.dist, 1), n: f.nombre })));
    if (c.multiAuto) A('multiAuto', t(c.multiBrillo ? 'vMultiBrillo' : 'vMultiAuto', { n: c.tot.n }));
    else if (c.multi && pw.some(f => f.p.n > 1)) A('multi', t('vMulti', { n: c.tot.n }));
    if (E.proy.oos || pw.some(f => f.p.fueraSpec)) A('oos', t('vOos'));   /* v11.7 · también cuando la franja de una sala pequeña obliga a pasar del tamaño garantizado */
    if (c.autoPropone) A('auto', t('mejorModelo', { a: c.proyector.nombre, b: c.autoPropone.nombre }));
    const x = c.elec || {}, eq = E.elec.proyEq || 'media';
    if (eq === 'media' && !x.media) A('sinMedia', t('sinMedia')); else if (eq === 'blend' && !x.blend) A('sinBlend', t('sinBlend', { n: x.need || 0 }));
    if (con >= 7 && con < 15) A('contraste', t('vConA'));
  }
  M.sort((a, b) => (a.n === 'R' ? 0 : 1) - (b.n === 'R' ? 0 : 1));
  return { nivel: M.some(m => m.n === 'R') ? 'R' : M.length ? 'A' : 'V', motivos: M };
}
// la lista del veredicto en PRO: arriba de RESULTADOS (y en el PDF), con los botones para corregir donde los hay
// v10.89 · RESULTADO con una sola estructura: veredicto en una línea · cifras · pestañas RESUMEN / TABLAS / EQUIPO / AVISOS
function veredictoCorto(c) {
  const V = c.veredicto, M = V ? V.motivos : [];
  if (!M.length) return `<p class="vered-c ok"><i></i>${t('vOk')}</p>`;
  const m = M[0], txt = String(m.txt).replace(/<[^>]+>/g, '');
  return `<button type="button" class="vered-c ${m.n === 'R' ? 'mal' : 'amb'}" data-accion="pest" data-v="av"><i></i><span>${txt}</span>${M.length > 1 ? `<b>+${M.length - 1}</b>` : ''}</button>`;
}
const PESTAS = ['res', 'tab', 'eq', 'av'];
function pestanas(c) {
  const n = c.veredicto ? c.veredicto.motivos.length : 0, v = PESTAS.includes(E.vista.pest) ? E.vista.pest : 'res';
  return `<div class="res-pest" role="tablist">${PESTAS.map(k => `<button type="button" class="tog${k === v ? ' on' : ''}" role="tab" aria-selected="${k === v}" data-accion="pest" data-v="${k}">${t('pest_' + k)}${k === 'av' && n ? ` <b class="pn-av">${n}</b>` : ''}</button>`).join('')}</div>`;
}
// cada parte del resultado, a su pestaña (las que no llevan ninguna se ven siempre)
/* v11.14 · tablas de resultados que no caben a lo ancho del bloque: cada fila pasa a ficha (rótulo encima de su dato), sin columnas escondidas a la derecha */
function encajaTablas() { document.querySelectorAll('#res .tabla-caja').forEach((c) => { const tb = c.querySelector('table.tabla'); if (!tb || tb.classList.contains('mat')) return; tb.classList.remove('apila'); if (!c.clientWidth) return;
  if (tb.scrollWidth <= c.clientWidth + 1 && c.scrollWidth <= c.clientWidth + 1) return; const th = [...tb.querySelectorAll('thead th')].map((x) => x.textContent.trim());
  tb.querySelectorAll('tbody tr').forEach((tr) => [...tr.children].forEach((td, i) => { if (th[i] && td.colSpan === 1) td.dataset.th = th[i]; })); tb.classList.add('apila'); }); }
function marcaPestanas(r) {
  if (!r) return;
  [...r.children].forEach(x => { if (x.dataset.pz) return; const cl = x.classList;
    if (cl.contains('res-tot') || cl.contains('vered-c') || cl.contains('res-pest')) return;
    x.dataset.pz = cl.contains('veredicto') ? 'av' : cl.contains('res-sim') || cl.contains('tabla-caja') ? 'res' : x.id === 'det-equipo' || cl.contains('mat') || x.querySelector('.fichas') ? 'eq' : 'tab'; });
  r.dataset.pest = PESTAS.includes(E.vista.pest) ? E.vista.pest : 'res';
}
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
/* v10.88 · STOCK INTERNO (solo admin, con la llave del candado): en el bloque MATERIAL, nunca en resultados, fichas ni PDF */
function stockAdmin(m, nCab) {
  if (!esInterno()) return '';
  const n = (v) => { const x = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : null; };
  const b = n(m.batchDisp), tot = n(m.stockUds), u = b != null ? Math.max(0, b) : tot, nec = nCab ? nCab + 1 : 0, cabe = cabeEnBatch(m, nCab), nv = nivelStock(m);
  const f = (k, v) => `<div class="f"><span>${k}</span><b>${v}</b></div>`;
  return `<div class="stk-adm"><h5>Stock interno · solo tú lo ves</h5>`
    + (u == null ? f('Stock', 'sin dato en el CRM') : f(b != null ? 'Mayor batch disponible' : 'Stock disponible', `<em class="n${nv || 1}">${u} uds</em>`) + (b != null && tot != null && tot > u ? f('Total almacén SPM', tot + ' uds') : ''))
    + (nec ? f('Proyecto + 1 de reserva', nec + ' uds' + (cabe == null ? '' : ` · <em class="${cabe ? 'v' : 'r'}">${cabe ? 'cabe en un batch' : 'faltan ' + (nec - (u || 0)) + ' en un mismo batch'}</em>`)) : '')
    + f('Próxima llegada', m.llegada ? String(m.llegada).replace(/[<>&]/g, '') : '—') + '</div>';
}
function fichaCab(m, nCab) {
  return fichaHTML({ cat: t('fCab'), icono: 'led', marca: m.family || '', modelo: m.crm, foto: m.urlFoto, fotoTrasera: m.urlFotoTrasera || m.urlTrasera || m.urlFoto2, vistas: m.fotos, acento: '#b566ff', stock: enStock(m), avisos: [],   /* v10.88 · la ficha es pública y sale en el PDF: nada de stock interno aquí */
    specs: [[t('kPitch'), m.pitch + ' mm'], [t('kCab'), `${m.cabAncho}×${m.cabAlto}${m.thick ? '×' + m.thick : ''} mm`], [t('kPx'), `${m.cabPixAncho}×${m.cabPixAlto}`], [t('kNits'), m.nits ? m.nits + ' nits' : ''], [t('kHz'), m.hz ? m.hz + ' Hz' : ''],
      [t('kKg'), m.cabKg ? fmt(m.cabKg, 1) + ' kg' : ''], [t('kW'), m.wMax ? fmt(m.wMax, 0) + ' W' : ''], [t('kCard'), m.card || ''], [t('kTech'), m.tech || '']],
    enlace: m.crm ? 'https://traulux.net/buscar/?q=' + encodeURIComponent(m.crm) : '', enlaceTxt: t('fichaFab') });
}
// Epson: manual y especificaciones en setupnavi y enlace de verificación del fabricante
const epsonManual = (q) => `https://support.epson.net/setupnavi/?MKN=${encodeURIComponent(q.modelo)}&PINF=support&LG2=${({ es: 'ES', en: 'EN', ca: 'CA' })[idioma()] || 'ES'}&OSC=MI`;
const EPSON_CALC = 'https://support.epson-europe.com/TDS/#/page/advanceMode';
const VIVITEK_SIM = 'https://www.vivitekcorp.com/simulator/';   // v10.57 · enlace de verificación del fabricante
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
    } else if (ledV) {   /* v10.88 · una fila por pantalla (P1 · ancho × alto) con las cabeceras una sola vez: más claro y cabe sin desplazarse */
      tam += `<div class="tam-led"><span></span><span class="tam-c">${t('ancho')}</span><span></span><span class="tam-c">${t('alto')}</span>` + s.tams.map(([w, h], i) => `<b class="tam-n" title="${t('pantalla')} ${i + 1}">P${i + 1}</b><label class="tam-in" aria-label="${t('pantalla')} ${i + 1} · ${t('ancho')}">${numIn('esp.sueltas.tams.' + i + '.0', w, 'm', 0.1, 0.3, 40)}</label><span class="tam-x">×</span><label class="tam-in" aria-label="${t('pantalla')} ${i + 1} · ${t('alto')}">${numIn('esp.sueltas.tams.' + i + '.1', h, 'm', 0.1, 0.3, 20)}</label>`).join('') + `</div><p class="ayuda">${t('ledMax4')}</p>`; }
    else tam += `<div class="fila c2">${campo(t('ancho'), numIn('esp.sueltas.ancho', s.ancho, 'm', 0.1, 0.3, 40))}${campo(t('alto'), numIn('esp.sueltas.alto', s.alto, 'm', 0.1, 0.3, 20))}</div>`;
    if (E.cantidad === 'varias') { const sepF = campo(t('sep'), numIn('esp.sueltas.sep', s.sep, 'm', 0.05, 0, 10));
      tam += s.disp === 'arco' ? `<div class="fila c2">${sepF}${campo(t('angulo'), numIn('esp.sueltas.angulo', s.angulo, '°', 1, 0, 90))}</div>` : `<div class="fila c1">${sepF}</div>`; }
    ent += `<div class="fila c2">${campo(t('elev'), numIn('esp.sueltas.elev', s.elev, 'm', 0.1, 0, 10))}${campo(t('dist'), numIn('esp.sueltas.dist', s.dist, 'm', 0.1, 0.5, 100))}</div>`;
    if (proy && tipoProy() !== 'mapping') ent += `<div class="fila c1" title="${t('techoAyuda')}">${campo(t('techoAlto'), numIn('esp.sueltas.techo', s.techo, 'm', 0.1, 0, 30))}</div><p class="ayuda">${t('techoAyuda')}</p>`;
  }
  ent += bloqueObst(sala);
  // resumen de una línea de cada bloque (lo que se lee cuando está plegado)
  const rTipo = proy ? t('tp_' + tipoProy()) : (E.cantidad === 'varias' ? t(sala ? 'sala' : 'pantallas') + ' · ' : '') + t({ INDOOR: 'euInt', OUTDOOR: 'euExt', ESCAPARATE: 'euEsc' }[l.tipo] || 'euInt') + ' · ' + t(l.clase === 'RENTAL' ? 'euAlq' : 'euFija') + (protegidoLed() ? ' · ' + t('euPub') : '') + (l.gold ? ' · ' + t('euMar') : '') + (l.transp ? ' · ' + t('euTransp') : '');
  const rTam = sala ? `${fmt(e.ancho)} × ${fmt(e.fondo)} × ${fmt(e.alto)} m` : E.cantidad === 'varias' && !proy ? s.tams.map(x => `${fmt(x[0])} × ${fmt(x[1])}`).join(' · ') + ' m' : `${E.cantidad === 'varias' ? s.n + ' × ' : ''}${fmt(s.ancho)} × ${fmt(s.alto)} m`;
  const rEnt = sala ? `${t('elev')} ${fmt(e.elev)} m` : `${t('elev')} ${fmt(s.elev)} m · ${fmt(s.dist, 1)} m`;
  return { tipo, tam, ent, rTipo, rTam, rEnt, sala };
}
// v10.88 · TAMAÑO DE IMAGEN: proporción (libre, la del proyector o una fija) y la medida por diagonal, ancho o alto,
// con su casilla y su deslizador; el ancho y el alto salen de ahí
const FORMATOS = [['libre', 0], ['nativo', 0], ['16:9', 16 / 9], ['16:10', 1.6], ['4:3', 4 / 3], ['21:9', 2.37], ['1:1', 1]];
const RANGO_MED = { diag: [30, 1000, 1, '″'], ancho: [0.5, 25, 0.01, 'm'], alto: [0.3, 15, 0.01, 'm'] };
function ratioFormato() {
  const f = E.esp.sueltas.formato, F = FORMATOS.find(x => x[0] === f); if (!F || f === 'libre') return 0;
  if (f === 'nativo') { const q = PROYECTORES.find(x => x.modelo === E.proy.cuerpo) || (calculo && calculo.proyector); return (q && q.ar) || 1.6; }
  return F[1];
}
const medDe = (mp, w, h) => mp === 'diag' ? Math.round(Math.hypot(w, h) / 0.0254 * 10) / 10 : Math.round((mp === 'ancho' ? w : h) * 1000) / 1000;
function normalizaTam() {
  if (E.tecnologia !== 'proy' || E.cantidad === 'varias') return;
  const s = E.esp.sueltas;
  if (s.formato == null) s.formato = Math.abs(s.ancho / s.alto - 16 / 9) < 0.02 ? '16:9' : 'libre';   // los cálculos guardados antes de la v10.88 no cambian de medida
  const r = ratioFormato(); if (!r) { s._wh = null; return; }
  const mp = s.medPor || (s.medPor = 'diag');
  let v = Number(s.medVal);
  if (!(v > 0) || (s._wh && (Math.abs(s._wh[0] - s.ancho) > 1e-6 || Math.abs(s._wh[1] - s.alto) > 1e-6))) v = medDe(mp, s.ancho, s.ancho / r);   // el ancho o el alto se cambiaron por otro lado (petición, SIMPLE…)
  const w = mp === 'diag' ? v * 0.0254 * r / Math.sqrt(1 + r * r) : mp === 'ancho' ? v : v * r;
  s.ancho = Math.round(w * 1000) / 1000; s.alto = Math.round(w / r * 1000) / 1000; s.medVal = v; s._wh = [s.ancho, s.alto];
}
function bloqueFormato() {
  const s = E.esp.sueltas, f = s.formato || 'libre', mp = s.medPor || 'diag';
  let h = campo(t('lbFormato'), `<select class="sel" data-sel="esp.sueltas.formato">${FORMATOS.map(([k]) => `<option value="${k}"${k === f ? ' selected' : ''}>${t('f_' + k)}</option>`).join('')}</select>`);
  if (f === 'libre') return h + `<div class="fila c2">${campo(t('lbMed_ancho'), numIn('esp.sueltas.ancho', s.ancho, 'm', 0.1, 0.3, 40))}${campo(t('lbMed_alto'), numIn('esp.sueltas.alto', s.alto, 'm', 0.1, 0.3, 20))}</div>`;
  const [a, b, paso, uni] = RANGO_MED[mp], v = Number(s.medVal) || medDe(mp, s.ancho, s.alto);
  h += `<div class="fila c3" role="group" aria-label="${t('lbMedPor')}" title="${t('lbMedPor')}">${['diag', 'ancho', 'alto'].map(k => tog(k === mp, `data-accion="med-por" data-v="${k}"`, t('med_' + k))).join('')}</div><div class="fila c1">${campo(t('lbMed_' + mp), numIn('esp.sueltas.medVal', v, uni, paso, a, b))}</div>`;   // medir por: tres botones (diagonal, ancho, alto)
  h += `<div class="rango"><input type="range" data-rango="esp.sueltas.medVal" min="${a}" max="${b}" step="${paso}" value="${Math.min(b, Math.max(a, v))}" aria-label="${t('med_' + mp)}"><div class="rango-et"><span>${fmt(a, mp === 'diag' ? 0 : 1)} ${uni}</span><span>${t('med_' + mp)}</span><span>${fmt(b, 0)} ${uni}</span></div></div>`;
  return h + `<p class="ayuda">${fmt(s.ancho, 2)} × ${fmt(s.alto, 2)} m · ${fmt(Math.hypot(s.ancho, s.alto) / 0.0254, 0)}″</p>`;
}
// v10.88 · columna A de PROYECCIÓN en orden: tipo · sala y proyector (sala, montaje, altura) · tamaño de imagen ·
// posición de la imagen · distancia de proyección · avanzado (luz ambiente y ganancia, público, obstáculos y fuera de especificación)
function partesProyA(c, q) {
  const e = E.esp, s = e.sueltas, sala = e.tipo === 'sala' && E.cantidad === 'varias', una = E.cantidad !== 'varias', tp = tipoProy(), base = partesEspacio(), p = E.proy;
  let salaP = '', tam = '', pos = '', avz = '';
  if (sala) salaP += `<div class="fila c3">${campo(t('lbSalaAncho'), numIn('esp.ancho', e.ancho, 'm', 0.1, 1, 60))}${campo(t('lbSalaFondo'), numIn('esp.fondo', e.fondo, 'm', 0.1, 1, 60))}${campo(t('lbSalaAlto'), numIn('esp.alto', e.alto, 'm', 0.1, 1.5, 20))}</div>` + base.tam.slice(base.tam.indexOf('<div class="etq">'));   // medidas de la sala con su nombre completo; después, las paredes
  else if (tp !== 'mapping') salaP += `<div class="fila c1" title="${t('techoAyuda')}">${campo(t('lbTecho'), numIn('esp.sueltas.techo', s.techo, 'm', 0.1, 0, 30))}</div>`;
  salaP += bloqueMontaje(c);
  if (!sala) tam += una ? bloqueFormato() : base.tam;
  if (sala) { pos += `<div class="fila c2">${campo(t('lbAltoImg'), numIn('esp.altoCubierto', e.altoCubierto, 'm', 0.1, 0, 20))}${campo(t('lbElev'), numIn('esp.elev', e.elev, 'm', 0.1, 0, 10))}</div><p class="ayuda">${t('altoAyuda')}</p>`; if (ajuste.esp) pos += `<p class="aviso">${ajuste.esp}</p>`; }
  else pos += `<div class="fila c1">${campo(t('lbElev'), numIn('esp.sueltas.elev', s.elev, 'm', 0.1, 0, 10))}</div>`;
  avz += `<div class="etq">${t('luzAmb')}</div>` + q.luz;
  if (!sala) avz += `<div class="fila c1">${campo(t('lbPublico'), numIn('esp.sueltas.dist', s.dist, 'm', 0.1, 0.5, 100))}</div>`;
  avz += bloqueObst(sala) + q.oos;
  const pw = c && c.filas ? c.filas.find(f => f.pos) : null, alt = Number(p.altura) > 0 ? p.altura : pw ? pw.pos.altura : 0;
  const rSala = [sala ? `${fmt(e.ancho)} × ${fmt(e.fondo)} × ${fmt(e.alto)} m` : tp !== 'mapping' && s.techo > 0 ? `${t('techoCorto')} ${fmt(s.techo)} m` : '', t('mo_' + (p.montaje || 'auto')), alt ? fmt(alt, 2) + ' m' : ''].filter(Boolean).join(' · ');
  const rTam = sala ? '' : una && s.formato && s.formato !== 'libre' ? `${t('f_' + s.formato)} · ${fmt(Math.hypot(s.ancho, s.alto) / 0.0254, 0)}″ · ${fmt(s.ancho)} × ${fmt(s.alto)} m` : base.rTam;
  const rPos = sala ? `${t('elev')} ${fmt(e.elev)} m` : `${t('elev')} ${fmt(s.elev)} m`;
  const rDist = (Number(p.dist) > 0 ? '' : 'AUTO · ') + (q.rDist || '');
  const rAvz = `${fmt(p.lux, 0)} lx · ×${fmt(p.ganancia, 1)}` + (p.oos ? ' · ⚠' : '');
  return { tipo: base.tipo, rTipo: base.rTipo, salaP, tam, pos, dist: bloqueDist(c), avz, rSala, rTam, rPos, rDist, rAvz, sala };
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
  if (c.modelo) mat += stockAdmin(c.modelo, totalCab(c));   /* v10.88 · stock interno solo con la llave del admin, en su bloque (nunca en la ficha ni en el PDF) */
  const aj = `<div class="fila c2">${tog(l.ajuste === 'dentro', 'data-set="led.ajuste" data-v="dentro"', t('dentro'))}${tog(l.ajuste === 'cercano', 'data-set="led.ajuste" data-v="cercano"', t('cercano'))}</div><p class="ayuda">${t('ajusteAyuda')}</p>`;
  const m = c.modelo;
  return { mat, aj, fichas: m ? fichaCab(m, totalCab(c)) : '', rMat: m ? (l.crm ? '' : 'AUTO · ') + m.crm : t('auto'), rAj: t(l.ajuste === 'cercano' ? 'cercano' : 'dentro'),
    eleg: m ? { nom: m.crm, dat: [m.pitch + ' mm', `${m.cabAncho}×${m.cabAlto} mm`, m.nits ? m.nits + ' nits' : ''].filter(Boolean).join(' · ') } : null };
}
function partesProy(c) {
  const p = E.proy, sel = c.proyector, haySuelo = c.filas.some(f => f.s.tipo === 'suelo'), paredes = c.filas.filter(f => f.s.tipo !== 'suelo');
  const mAct = marcasActivas();
  let mat = '', aj = '', luz = '', fic = '', oos = '';   // v10.88 · la distancia y el montaje pasan a la columna A
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
  luz += campo(t('lbUso'), `<select class="sel" data-uso="1"><option value=""${uso ? '' : ' selected'}>${t('uso_personal')}</option>${USOS_LUZ.map(u => `<option value="${u[0]}"${u[0] === uso ? ' selected' : ''}>${t('uso_' + u[0])} · ${u[1]} lx</option>`).join('')}</select>`);
  luz += `<div class="fila c2">${campo(t('lbLux'), numIn('proy.lux', p.lux, 'lx', 10, 0, 5000))}${campo(t('lbGan'), numIn('proy.ganancia', p.ganancia, '×', 0.1, 0.1, 5))}</div>`;
  // 6) avanzado: modo fuera de especificación (v10.39: en el bloque Material, junto al proyector; en «Ajuste del equipo» quedaba escondido) (imágenes más grandes que las garantizadas), con aviso, cálculo y recomendación
  // v8.4 · fuera de especificación: el botón activo se resalta en ámbar (no es un ajuste normal)
  oos += `<div class="etq">${t('oosEtq')}</div><div class="fila c1"><button type="button" class="tog ambar${p.oos ? ' on' : ''}" aria-pressed="${!!p.oos}" data-accion="proy-oos" title="${t('oosTit')}">⚠ ${t('oos')}</button></div>`;
  if (sel) {
    const med = (d) => { const w = d * 0.0254 * sel.ar / Math.sqrt(1 + sel.ar * sel.ar); return fmt(w, 1) + ' × ' + fmt(w / sel.ar, 1); };
    const usada = Math.max(0, ...paredes.map(f => Math.hypot(f.p.imgW, f.p.imgH) / 0.0254));
    if (p.oos) {
      oos += `<p class="aviso">${t('oosAviso')}</p>`;
      oos += `<p class="ayuda">${sel.maxDiagPulgOOS > sel.maxDiagPulg ? t('oosCalc', { p: sel.nombre, g: fmtPx(sel.maxDiagPulg), gm: med(sel.maxDiagPulg), o: fmtPx(sel.maxDiagPulgOOS), om: med(sel.maxDiagPulgOOS) }) : t(isFinite(sel.maxDiagPulg) ? 'oosNoGana' : 'oosSinMax', { p: sel.nombre, g: fmtPx(sel.maxDiagPulg) })}</p>`;
      if (usada > sel.maxDiagPulg + 0.5) oos += `<p class="aviso">${t('oosUsa', { d: fmtPx(Math.round(usada)), g: fmtPx(sel.maxDiagPulg) })}</p>`;
      oos += `<p class="ayuda">${t('oosReco')}</p>`;
    } else if (paredes.some(f => f.p.limite) && sel.maxDiagPulgOOS > sel.maxDiagPulg) oos += `<p class="ayuda">${t('oosSugerir', { g: fmtPx(sel.maxDiagPulg), o: fmtPx(sel.maxDiagPulgOOS) })}</p>`;
  }
  // 7) fichas de los equipos elegidos y ayudas
  if (sel) fic += fichaProy(sel, t('fProy'));
  if (haySuelo && c.prSuelo && c.prSuelo !== sel) fic += fichaProy(c.prSuelo, t('fProySuelo'));
  if (c.prCentral && c.prCentral !== sel) fic += fichaProy(c.prCentral, t('fProyCentral'));   /* v11.4 */
  fic += `<p class="ayuda">${t('autoAyudaProy')}</p><p class="ayuda">${t('datosProy')}</p>`;
  const dist = paredes.some(f => f.pos) ? fmt(Math.max(...paredes.filter(f => f.pos).map(f => f.pos.dist)), 2) + ' m' : '';
  return { mat, aj, luz, oos, fichas: fic, rMat: sel ? (p.cuerpo ? '' : 'AUTO · ') + sel.nombre : t('auto'), rAj: [t('or_' + (p.orient || 'auto')), conBlend ? p.solape + ' %' : t('unaImg')].filter(Boolean).join(' · '), rDist: dist, rLuz: `${fmt(p.lux, 0)} lx · ×${fmt(p.ganancia, 1)}`,
    eleg: sel ? { nom: sel.nombre, dat: [fmtPx(sel.lumens) + ' lm', 'TR ' + trTxt(sel), sel.resX + '×' + sel.resY].join(' · ') } : null };
}
// v8.4 · datos principales de proyección, en orden: el tipo arriba del todo y, tras la
// superficie, la posición del proyector (primero la distancia y después el montaje con su altura), cada una con su candado
function bloqueTipo() {
  const tp = tipoProy();
  let h = `<div class="campo"><label>${t('tipoProy')}</label><div class="fila c3">${['mapping', 'pared', 'sala'].map(v => tog(tp === v, `data-accion="tipo-proy" data-v="${v}" title="${t('tp_' + v)}"`, t(v === 'sala' ? 'tp_salaCorto' : 'tp_' + v))).join('')}</div></div><p class="ayuda">${t('tpAyuda_' + tp)}</p>`;
  return h;
}
function bloqueDist(c) {
  if (!c || !c.filas) return '';
  const p = E.proy, tp = tipoProy(), paredes = c.filas.filter(f => f.s.tipo !== 'suelo'), pared = paredes[0], pos = pared && pared.pos, r2 = (v) => Math.round(v * 100) / 100;
  let h = '';
  const distFija = Number(p.dist) > 0, distVal = distFija ? Number(p.dist) : (pos ? r2(pos.dist) : 0);
  h += campoLock(t(tp === 'mapping' ? 'distFachada' : 'lbDistOpt'), 'dist', distFija, numIn('proy.dist', distVal, 'm', 0.1, 0, 200), pos || distFija);
  if (!distFija && tp === 'pared' && p.pubNS) h += `<p class="ayuda">${t('pubNSpro')} <button type="button" class="av-bt" data-accion="pub-ns-no">${t('quitar')}</button></p>`;   // v10.54 · «no lo sé» de SIMPLE
  if (!distFija && (Number(p.distMin) > 0 || Number(p.distMax) > 0)) h += `<p class="ayuda">${t('margenInst', { a: Number(p.distMin) > 0 ? fmt(p.distMin, 2) : '0', b: Number(p.distMax) > 0 ? fmt(p.distMax, 2) : '∞' })} <button type="button" class="av-bt" data-accion="quita-margen">${t('quitar')}</button></p>`;   // v10.54 · el margen que se dio en SIMPLE
  if (pared) {
    const a = pared.p.tMin, b = pared.p.tMaxZ;
    if (b - a > 0.02) h += `<div class="rango"><input type="range" data-rango="proy.dist" min="${r2(a)}" max="${r2(b)}" step="0.01" value="${r2(Math.min(b, Math.max(a, distVal)))}" aria-label="${t('rangoZoom')}"><div class="rango-et"><span>${fmt(a, 2)} m</span><span>${t('rangoZoom')}</span><span>${fmt(b, 2)} m</span></div></div>`;
    h += `<p class="ayuda">${distFija ? t('distFija', { d: fmt(p.dist, 2), w: fmt(pared.p.imgW, 2), h: fmt(pared.p.imgH, 2) }) : b - a > 0.02 ? t('distAyuda', { a: fmt(a, 2), b: fmt(b, 2) }) : t('distOpticaFija', { a: fmt(a, 2) })}${paredes.length > 1 ? ' ' + t('distVarias') : ''}</p>`;
  }
  if (c.filas.some(f => f.p.fueraZoom)) h += `<p class="aviso">${t(c.filas.some(f => f.p.noCubre) ? 'noCubre' : 'fueraZoom')}</p>`;
  return h;
}
// v10.88 · el montaje (sobremesa o colgado) y la altura del proyector, en «Sala y proyector»
function bloqueMontaje(c) {
  if (!c || !c.filas) return '';
  const p = E.proy, paredes = c.filas.filter(f => f.s.tipo !== 'suelo'), pared = paredes[0], pos = pared && pared.pos, r2 = (v) => Math.round(v * 100) / 100;
  let h = `<div class="campo"><label>${t('lbMontaje')}</label><div class="fila c3">${['auto', 'colgado', 'apoyado'].map(v => tog((p.montaje || 'auto') === v, `data-set="proy.montaje" data-v="${v}"`, t('mo_' + v))).join('')}</div></div>`;
  const altFija = Number(p.altura) > 0, apoyo = p.montaje === 'auto' ? !!(pos && pos.apoyo) : p.montaje === 'apoyado';
  const altVal = altFija ? p.altura : (pos ? r2(pos.altura) : 0);
  h += campoLock(t(apoyo ? 'lbAltApoyo' : 'lbAltColg'), 'alt', altFija, numIn('proy.altura', altVal, 'm', 0.1, 0, 200), pos || altFija);
  h += `<p class="ayuda">${t(altFija ? 'alturaFijaAyuda' : apoyo ? 'alturaApoyoAyuda' : 'alturaColgadoAyuda')}</p>`;
  return h;
}
// v8.3 · el proyector arrastrado en las vistas técnicas (o el desplazamiento de la óptica) fija la distancia y la altura, con su candado
/* v10.88 · VISTAS TÉCNICAS EN GRANDE (consola): páginas Pantalla 1 · lateral / frontal / cenital, Pantalla 2 …, con restablecer, deshacer y rehacer.
   Lo que se toca en las vistas es la distancia y la altura del proyector (y su montaje): eso es lo que se guarda en el historial */
const HVT = { atras: [], adelante: [] };
const fotoVt = () => ({ dist: E.proy.dist, altura: E.proy.altura, montaje: E.proy.montaje });
const ponVt = (s) => { Object.assign(E.proy, s); actualizar(); };
function fijarVt(o, d) { HVT.atras.push(fotoVt()); if (HVT.atras.length > 60) HVT.atras.shift(); HVT.adelante = []; fijarDesdeVistas(o, d); }
window.SC_VT = {
  paginas() { const c = calculo; if (!c || !c.filas || E.tecnologia === 'led') return []; const fs = c.filas.filter(f => f.s.tipo !== 'suelo' && f.pos); const P = [];
    fs.forEach((f, i) => ['lateral', 'frontal', 'cenital'].forEach(v => P.push({ i, fila: c.filas.indexOf(f), nombre: f.nombre, v, tit: f.nombre + ' · ' + t('vt_' + v) }))); return P; },
  pinta(cont, i, v) { cont.innerHTML = vistasTecnicas(calculo, v, i); activarVistas(cont, calculo, fijarVt); },
  reset() { const a = fotoVt(), b = { dist: 0, altura: 0, montaje: 'auto' }; if (a.dist === b.dist && a.altura === b.altura && a.montaje === b.montaje) return false; HVT.atras.push(a); HVT.adelante = []; ponVt(b); return true; },
  deshacer() { if (!HVT.atras.length) return false; HVT.adelante.push(fotoVt()); ponVt(HVT.atras.pop()); return true; },
  rehacer() { if (!HVT.adelante.length) return false; HVT.atras.push(fotoVt()); ponVt(HVT.adelante.pop()); return true; },
  get puede() { return { atras: HVT.atras.length > 0, adelante: HVT.adelante.length > 0, reset: !(Number(E.proy.dist) === 0 && Number(E.proy.altura) === 0 && E.proy.montaje === 'auto') }; },
  txt: (k) => t(k)
};
function fijarDesdeVistas(o, d) {
  if (o.dist != null) { E.proy.dist = Math.round(o.dist * 100) / 100; SUELTO.dist = 0; }
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
/* v10.88 · consola de escritorio, PROYECCIÓN: la fila de abajo pasa a sumario técnico (azul) · vistas técnicas (verde) · observaciones y avisos (rosa).
   Solo se ven en la consola de escritorio (html.bk); en móvil siguen las seis cifras */
function bkSumario(c, T, p, tiros) {
  const fil = (k, v) => `<div class="f"><dt>${k}</dt><dd>${v}</dd></div>`, sup = c.filas.filter(f => f.s.tipo !== 'suelo');
  const trs = sup.map(f => f.p && f.p.ratio).filter(Boolean);
  return `<div class="bk-sum"><div class="t">${t('sumTit')}</div><dl>`
    + fil(t('sumProy'), `${fmtPx(T.n)} × ${c.grupos.length > 1 ? c.grupos.map(g => fmtPx(g.n) + '× ' + (g.q.modelo || nombreQ(g.q))).join(' + ') : (p.modelo || nombreQ(p))}${p.optica ? ` <small>${p.optica}</small>` : ''}${c.filas.some(f => f.p.vert) ? ' · ' + t('vert') : ''}`)
    + fil(t('sumLum'), `${fmtPx(T.lumenes)} lm`)
    + fil(t('sumLienzo'), `${fmtPx(T.lienzoW)} × ${fmtPx(T.lienzoH)} px`)
    + fil(t('sumSup'), `${sup.length} <small>(${sup.map(f => `${fmt(f.s.ancho)}×${fmt(f.s.alto)}`).join(' · ')} m)</small>`)
    + fil(t('sumBrillo'), `${fmt(T.nitsMin === Infinity ? 0 : T.nitsMin, 0)} nits`)
    + fil(t('sumContr'), `${fmt(T.contrasteMin, 1)}:1 <small>(${nivelContraste(T.contrasteMin)})</small>`)
    + fil(t('sumTiro'), `${tiros.length ? fmt(Math.max(...tiros), 2) + ' m' : '—'}${trs.length ? ` · TR ${fmt(Math.max(...trs), 2)}:1` : ''}`)
    + fil(t('sumLuz'), `${fmt(c.lx, 0)} lx · ×${fmt(c.gan, 1)}`)
    + '</dl></div>';
}
/* v10.88 · LED en la consola de escritorio: la misma fila que PROYECCIÓN — sumario técnico (azul) · esquema de las pantallas con sus cabinets y
   líneas de datos (verde) · observaciones y avisos (rosa) */
function bkSumarioLed(c, T, m) {
  const fil = (k, v) => `<div class="f"><dt>${k}</dt><dd>${v}</dd></div>`, x = c.elec || {};
  return `<div class="bk-sum"><div class="t">${t('sumTit')}</div><dl>`
    + fil(t('sumCab'), `${m.crm} <small>P${m.pitch}${m.nits ? ' · ' + m.nits + ' nits' : ''}</small>`)
    + fil(t('sumSup'), `${c.filas.length} <small>(${c.filas.map(f => `${fmt(f.r.ancho)}×${fmt(f.r.alto)}`).join(' · ')} m)</small>`)
    + fil(t('cabinets'), fmtPx(T.cab))
    + fil(t('sumLienzo'), `${fmtPx(T.lienzoW)} × ${fmtPx(T.lienzoH)} px`)
    + fil(t('peso'), T.peso > 0 ? `${fmt(T.peso, 0)} kg` : `<span class="tenue">${t('sinDatoPeso')}</span>`)
    + fil(t('consumo'), T.kw > 0 ? `${fmt(T.kw, 1)} kW <small>${fmt(T.amp, 0)} A</small>` : '—')
    + fil(t('lineas'), `${fmtPx(T.lineas)} <small>+ ${fmtPx(T.lineas)} backup</small>`)
    + fil(t('procesador'), x.proc ? x.proc.modelo : '—')
    + fil(t('mediaserver'), x.media ? `${x.media.modelo} <small>${fmtPx(T.salidas4k)}×4K</small>` : `${fmtPx(T.salidas4k)} × 4K`)
    + '</dl></div>';
}
/* cada pantalla a escala con su retícula de cabinets; las líneas de datos, por colores y en el orden habitual (en serpentina por filas: reparto orientativo) */
function bkEsquemaLed(c) {
  const fs = c.filas.filter(f => f.r && f.r.cols && f.r.rows); if (!fs.length) return '';
  const COL = ['#00b4ff', '#d4ff00', '#ff4d5e', '#b566ff', '#ffb000', '#00ff9c', '#ff7ad9', '#7ab8ff'];
  const pan = fs.map(f => { const r = f.r, W = 300, H = Math.max(60, Math.min(170, W * r.alto / r.ancho)), w0 = Math.min(W, H * r.ancho / r.alto), cw = w0 / r.cols, ch = H / r.rows;
    const n = r.cols * r.rows, porL = Math.max(1, Math.ceil(n / Math.max(1, r.lineas))); let g = '';
    for (let k = 0; k < n; k++) { const fila = Math.floor(k / r.cols), col0 = k % r.cols, col = fila % 2 ? r.cols - 1 - col0 : col0, li = Math.floor(k / porL), L = (f.lin ? f.lin[0] : 1) + li;
      g += `<rect x="${(col * cw).toFixed(2)}" y="${(fila * ch).toFixed(2)}" width="${(cw - .6).toFixed(2)}" height="${(ch - .6).toFixed(2)}" fill="${COL[li % COL.length]}" fill-opacity=".28" stroke="${COL[li % COL.length]}" stroke-opacity=".7" stroke-width=".5"/>`;
      if (k % porL === 0 && cw > 9 && ch > 7) g += `<text x="${(col * cw + cw / 2).toFixed(2)}" y="${(fila * ch + ch / 2 + 3).toFixed(2)}" text-anchor="middle" font-size="${Math.min(9, ch * .6, cw * .45).toFixed(1)}" fill="#fff">L${L}</text>`; }
    return `<figure class="esq-p"><figcaption><b>${f.nombre}</b> <span>${r.cols}×${r.rows} = ${r.cab}</span></figcaption><svg viewBox="-2 -2 ${(w0 + 4).toFixed(1)} ${(H + 4).toFixed(1)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${f.nombre}">${g}<rect x="0" y="0" width="${w0.toFixed(2)}" height="${H.toFixed(2)}" fill="none" stroke="#e8e8e8" stroke-width="1"/></svg>`
      + `<div class="esq-d">${fmt(r.ancho)}×${fmt(r.alto)} m · ${r.resW}×${r.resH}${f.lin ? ` · L${f.lin[0]}–${f.lin[1]}` : ''}</div></figure>`; }).join('');
  return `<div class="bk-esq"><div class="t">${t('esqTit')}<small>${t('esqNota')}</small></div><div class="esq-rej n${Math.min(4, fs.length)}">${pan}</div></div>`;
}
function bkAvisosLed(c, T) {
  const li = [];
  if (!(T.peso > 0)) li.push(`<li class="amb">${t('sinDatoPeso')}</li>`);
  c.filas.forEach(f => { if (f.r && f.r.quitados) li.push(`<li class="amb"><b>${f.nombre}</b> · −${f.r.quitados} ${t('cabinets').toLowerCase()}</li>`); });
  const ver = vistaVeredicto(c);
  return `<div class="bk-obs"><div class="t">${t('obsTit')}</div><div class="obs-cu">${ver}${li.length ? `<ul class="avisos">${li.join('')}</ul>` : ''}${!ver && !li.length ? `<p class="ok">${t('obsOk')}</p>` : ''}</div></div>`;
}
function bkAvisos(c, T) {
  const sem = semaforo(T.contrasteMin), li = [];
  if (sem !== 'semV') li.push(`<li class="${sem === 'semR' ? 'mal' : 'amb'}"><b>${t(sem)}</b> · ${t('contraste')} ${fmt(T.contrasteMin, 1)}:1 · ${fmt(c.lx, 0)} lx</li>`);
  c.filas.forEach(f => { const q = f.p; if (!q || f.s.tipo === 'suelo') return; const a = [q.fuera ? t('fuera') : '', q.limite ? t('limite') : '', q.chica ? t('chica') : ''].filter(Boolean);   /* el solape y el recorte ya los explica el veredicto */ if (a.length) li.push(`<li class="amb"><b>${f.nombre}</b> · ${a.join(' · ')}</li>`); });
  const ver = vistaVeredicto(c);
  return `<div class="bk-obs"><div class="t">${t('obsTit')}</div><div class="obs-cu">${ver}${li.length ? `<ul class="avisos">${li.join('')}</ul>` : ''}${!ver && !li.length ? `<p class="ok">${t('obsOk')}</p>` : ''}</div></div>`;
}
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
      ${bkSumarioLed(c, T, m)}
    </div>`;
    h += veredictoCorto(c) + pestanas(c) + vistaVeredicto(c) + bkEsquemaLed(c);
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
      ${bkSumario(c, T, p, tiros)}
    </div>`;
    /* v10.89 · arriba, el veredicto en una línea y las pestañas; el veredicto completo va en AVISOS (y entero en el PDF) */
    h += veredictoCorto(c) + pestanas(c) + vistaVeredicto(c);
    h += vistaSimulacion(c);   // v10.88 · resultado de la simulación numerado (una pantalla)
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
// v10.88 · RESULTADO DE LA SIMULACIÓN (una pantalla): posición del proyector numerada,
// ajuste del proyector (desplazamiento de lente) y brillo y contraste
function vistaSimulacion(c) {
  const fs = c.filas.filter(f => f.pos && f.s.tipo !== 'suelo'); if (fs.length !== 1) return '';
  const f = fs[0], o = f.pos, q = f.p, m = (v) => fmt(v, 3) + ' m', colg = !o.apoyo, li = (n, k, v) => `<li><b>(${n})</b> ${t(k)}: <span class="mono">${v}</span></li>`;
  // v10.89 · numeración seguida; la distancia de proyección y la de la pantalla al centro de la óptica, en una sola línea cuando coinciden
  const lc = (c.sombras && c.sombras.haces || []).find(h => h.sup === f.s.id), d4 = lc && lc.nrm ? Math.abs((lc.lente.x - f.s.x) * lc.nrm.x + (lc.lente.z - f.s.z) * lc.nrm.z) : o.dist;
  const q0 = f.proyector || c.proyector, it = [[colg ? 'rs1c' : 'rs1', m(o.altura)], ['rs2', m(Math.abs(o.altura - o.y0))]];
  if (Math.abs(d4 - o.dist) > 0.01) it.push(['rs3', m(o.dist)]);
  it.push(q0 && q0.plegada && q0.desfase ? ['rsFrente', m(Math.max(0, o.dist - q0.desfase))] : ['rs8', m(d4)]);   // ultracortas: hasta la cara del cuerpo
  if (q0 && q0.plegada && q0.desfase) it.push(['rs8', m(d4)]);
  it.push(['rs4', o.techo > 0 ? m(Math.max(0, o.techo - o.y1)) : '—'], ['rs5', m(o.y0)], ['rs6', `${fmt(q.imgW, 3)} × ${fmt(q.imgH, 3)} m`], ['rs7', fmt(o.diag, 0) + ' ″']);
  const l = it.map((x, i) => li(i + 1, x[0], x[1])).join('');
  const sem = semaforo(q.contraste);
  return `<section class="res-sec res-sim"><div class="res-tit">${ICO.proy}${t('resSim')}</div><div class="sim-col"><div><div class="etq">${t('resPos')}</div><ul class="sim-l">${l}</ul></div>
    <div><div class="etq">${t('resAj')}</div><ul class="sim-l"><li>${t('rsShV')}: <span class="mono">${fmt(o.shiftV, 0)} %</span></li><li>${t('rsShH')}: <span class="mono">0 %</span></li></ul>
    <div class="etq">${t('resBr')}</div><ul class="sim-l"><li>${t('rsNits')}: <span class="mono">${fmt(q.nits, 1)} nits</span></li><li>${t('rsLux')}: <span class="mono">${fmt(q.lux, 1)} lx</span></li><li>${t('rsCon')}: <span class="mono">${fmt(q.contraste, 1)}:1</span> <b class="sem ${sem}">${t(sem)}</b></li></ul></div></div></section>`;
}
// posición del proyector y brillo por superficie
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
    case 'rango': return t('margenK') + ' ' + x.v.map(v => fmt(v, 1)).join('–') + ' m'; case 'salaMed': return t('salaRec') + ' ' + x.v.map(v => fmt(v)).join(' × ') + ' m'; case 'pulgadas': return fmt(x.v, 0) + '″'; case 'lumenes': return '≥ ' + fmt(x.v, 0) + ' lm'; case 'optica': return t('opt_' + x.v); case 'ledTipo': return t('ped_' + x.v);
    case 'laterales': return t('laterales') + ' ' + x.v.map(v => fmt(v)).join(' × ') + ' m'; case 'pitch': return 'P' + fmt(x.v, 2) + (x.ok ? ' · ' + x.ok : ''); case 'texto': return x.v; default: return x.v;
  }
}
function calcularPeticion() {
  const i = $('#nl-texto'), txt = (i ? i.value : nlTexto).trim(); nlTexto = i ? i.value : nlTexto;
  if (!txt) { estadoNl(t('nlVacio')); if (i) i.focus(); return; }
  if (escuchando) { try { escuchando.stop(); } catch (e) {} escuchando = null; }
  if (i && matchMedia('(pointer: coarse)').matches) i.blur(); // en el móvil se cierra el teclado para ver el resultado
  const r = interpretar(txt, E.tecnologia), c = r.cambios;
  if (r.cantidad) E.cantidad = r.cantidad; if (r.tecnologia) E.tecnologia = r.tecnologia;
  // una pantalla LED: la petición la resuelve su propio cálculo, con el popup de datos del proyecto
  if (unaLed()) { actualizar(); aIframe({ tipo: 'screens-peticion', texto: txt }); estadoNl(t('nlLed')); return; }
  // v10.48 · una petición nueva (con medidas, tecnología o cantidad) parte de cero: lo que no dice vuelve a su valor por defecto (antes heredaba la anterior)
  if (r.vistos.some(x => x.k === 'medida' || x.k === 'central') || r.tecnologia || r.cantidad) { const d = DEF(); E.esp = d.esp; E.led = Object.assign(d.led, {}); E.proy = d.proy; if (r.cantidad) E.cantidad = r.cantidad; }
  Object.assign(E.esp, c.esp); Object.assign(E.esp.sueltas, c.sueltas); if (c.paredes) Object.assign(E.esp.paredes, c.paredes);
  if (E.cantidad === 'una' && !c.esp.tipo) E.esp.tipo = 'sueltas';   /* v11.1 · también cuando la petición no dice «pantalla»: en UNA no hay sala inmersiva (se quedaba con los 15 lx de la sala) */
  // v8.0 · una petición de proyección parte de la posición AUTO, salvo lo que diga (distancia, orientación, montaje)
  if (r.tecnologia === 'proy') Object.assign(E.proy, { dist: 0, orient: 'auto', montaje: 'auto', altura: 0, tipo: 'pared' });
  E.proy.lmMin = 0; E.proy.tipoOpt = '';   /* v10.99 · cada petición empieza sin los lúmenes mínimos ni el tipo de óptica de la anterior */
  Object.assign(E.led, c.led); Object.assign(E.proy, c.proy); Object.assign(E.elec, c.elec);
  if (c.proy.tipo === 'mapping' && !r.vistos.some(x => x.k === 'medida')) { const d = Number(E.proy.dist) || 0; alMapping(); if (r.vistos.some(x => x.k === 'distProy')) E.proy.dist = d; }   // v10.63
  if (c.sueltas.salaFondo && !c.proy.dist) E.proy.distMax = Math.max(1, c.sueltas.salaFondo - 0.3);   // v10.89 · el proyector tiene que caber en la sala
  delete E.esp.sueltas.salaAncho; delete E.esp.sueltas.salaFondo;
  if ((E.tecnologia === 'proy') && c.proy.lux == null) luzDeTipo(E.esp.tipo === 'sala' ? 'sala' : E.proy.tipo === 'mapping' ? 'mapping' : 'pared');
  // v10.89 · el techo no puede quedar por debajo del montaje pedido (evita avisos falsos de «pasa del techo»)
  if (c.sueltas.techo == null && Number(E.proy.altura) > 0 && Number(E.esp.sueltas.techo) > 0 && E.esp.sueltas.techo < E.proy.altura + 0.3) E.esp.sueltas.techo = Math.round((E.proy.altura + 0.5) * 10) / 10;
  if (c.proy.lux != null) { E.proy.luzUso = (USOS_LUZ.find(u => u[1] === Number(c.proy.lux)) || [''])[0]; E.proy.luzMano = true; }
  /* v11.2 · marca, proyector, óptica y número de proyectores nombrados en la petición (antes se ignoraban sin decirlo) */
  const sinLeer = [];
  if (E.tecnologia === 'proy') {
    const plano = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, ''), T = ' ' + txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') + ' ', TP = plano(T);
    const mar = MARCAS_PROY.filter(m => T.includes(m.toLowerCase()));
    if (mar.length && mar.length < MARCAS_PROY.length) { E.proy.marcas = mar; mar.forEach(m => r.vistos.push({ k: 'texto', v: m })); }
    const largo = (l) => l.sort((x, y) => plano(y).length - plano(x).length)[0];
    const cu = largo([...new Set(PROYECTORES.map(q => q.modelo))].filter(m => plano(m).length >= 5 && TP.includes(plano(m))));
    if (cu) { E.proy.cuerpo = cu; const q = PROYECTORES.find(x => x.modelo === cu); if (q && !marcasActivas().includes(q.marca)) E.proy.marcas = []; r.vistos.push({ k: 'texto', v: cu }); }
    const op = largo([...new Set(PROYECTORES.filter(q => q.optica && (!cu || q.modelo === cu)).map(q => q.optica))].filter(o => plano(o).length >= 5 && TP.includes(plano(o))));
    if (op) { E.proy.optica = op; r.vistos.push({ k: 'texto', v: op }); }
    /* referencias con pinta de modelo u óptica que el catálogo no tiene: se avisa */
    (T.match(/\b(?:eb|du|dk|dh|dw|dx|d\d\d|elpl[a-z])[- ]?[a-z]{0,3}\d{2,5}[a-z0-9-]*\b/g) || []).forEach(w => { const k = plano(w); if (k.length >= 5 && ![cu, op].some(z => z && (plano(z).includes(k) || k.includes(plano(z))))) sinLeer.push(w.trim().toUpperCase()); });
    const np = T.match(/\b(\d+|dos|tres|cuatro|cinco|seis|two|three|four|five|six|quatre|cinc|sis)\s+(?:(?:laser|video|4k|dlp|lcd|uhd)\s+){0,2}(?:video)?(?:proyectores|projectors|projectores)\b/);
    if (np) { const k = { dos: 2, two: 2, tres: 3, three: 3, cuatro: 4, four: 4, quatre: 4, cinco: 5, five: 5, cinc: 5, seis: 6, six: 6, sis: 6 }[np[1]] || parseInt(np[1], 10);
      if (k > 1 && E.cantidad === 'una' && E.esp.tipo === 'sueltas' && !E.proy.multi) { E.proy.multi = true; r.vistos.push({ k: 'multi' }); }
      nProyPedidos = k; } else nProyPedidos = 0;
  }
  if (c.led.tipo || c.led.clase) E.led.crm = '';
  if (c.elec.backup || c.elec.conexion) E.elec.sel = '';
  if (r.pitch) {   // v7.9 · «P1.5», «pitch 1,5»…: el modelo de ese pitch (si el catálogo lo tiene)
    const l = listaLed(), cob = r.cob ? l.filter(m => /cob/i.test(m.tech + ' ' + m.crm)) : [];
    const m = (cob.length ? cob : l).find(x => Math.abs(x.pitch - r.pitch) < 0.07);
    const v = r.vistos.find(x => x.k === 'pitch'); if (m) { E.led.crm = m.crm; if (v) v.ok = m.crm; }
  }
  actualizar();
  nlNoUsado = (r.noUsado || []).concat(sinLeer);
  { const hay = calculo && calculo.tot ? calculo.tot.n : 0; if (E.tecnologia === 'proy' && nProyPedidos > 1 && hay && hay !== nProyPedidos) nlNoUsado.push(nProyPedidos + ' ' + t('proyectores').toLowerCase()); }   /* v11.2 · si el cálculo no sale con los proyectores pedidos, se dice */
  estadoNl((r.vistos.length ? t('nlEntendido') + ' ' + r.vistos.map(rotulo).join(' · ') : t('nlNada')) + (nlNoUsado.length ? ' · ' + t('nlNoUsado', { s: nlNoUsado.map(x => '«' + x + '»').join(', ') }) : ''), nlNoUsado.length > 0);
  if (nlNoUsado.length) actualizar();
}
let nlNoUsado = [], nProyPedidos = 0;

// v8.5 · bloque de una zona: cabecera con testigo, nombre, resumen (se lee cuando está plegado) y su RESTABLECER; debajo, el cuerpo
const blq = (id, tit, res, cuerpo, reset) => `<section class="mod blq" data-blq="${id}"><div class="mod-tit"><button type="button" class="blq-cab" data-accion="blq" data-id="${id}" aria-expanded="true"><i class="blq-led"></i><span class="blq-nom">${tit}</span><span class="blq-res">${res || ''}</span></button>${reset ? `<button type="button" class="sec-btn reset" data-accion="${reset}">${t('restablecer')}</button>` : ''}</div><div class="blq-cuerpo">${cuerpo}</div></section>`;
function zonas(c) {
  const led = E.tecnologia === 'led', e = partesEspacio(), q = led ? partesLed(c) : partesProy(c), x = c.elec || {};
  const rElec = led ? (x.proc ? x.proc.marca + ' ' + x.proc.modelo : '') : x.blend ? x.blend.marca + ' ' + x.blend.modelo : x.media ? x.media.marca + ' ' + x.media.modelo : (E.elec.proyEq === 'ninguno' ? t('mNinguno') : '');
  const pa = led ? null : partesProyA(c, q);
  // v10.89 · una sola columna de datos con 4 pasos numerados, iguales en todas las modalidades (24-11-2026):
  // ① sala · ② pantalla · ③ equipo / distancia · ④ avanzado. Sin CALCULAR ni RESTABLECER al pie (están en la cabecera) ni el pie «Elegido»
  const pn = (n, k) => `<i class="pn">${n}</i>${t(k)}`, junta = (...a) => a.filter(Boolean).join(' · ');
  const A = led
    ? blq('a1', pn(1, 'bSalaUso'), e.rTipo, e.tipo, 'reset-a1') + blq('a2', pn(2, 'bTamDist'), junta(e.rTam, e.rEnt), e.tam + e.ent, 'reset-a2')
      + blq('b1', pn(3, 'bEquipo'), junta(q.rMat, q.rAj), q.mat + q.aj, 'reset-b1+b2') + blq('b3', pn(4, 'elecMod'), rElec, modElec(c), 'reset-elec')
    : blq('a2', pn(1, 'bSalaProy'), junta(pa.rTipo, pa.rSala, q.rMat), pa.tipo + pa.salaP + q.mat, 'reset-a2+b1') + blq('a5', pn(2, 'bImagen'), junta(pa.rTam, pa.rPos), pa.tam + pa.pos, 'reset-a5')
      + blq('a7', pn(3, 'bDistProy'), pa.rDist, pa.dist, 'reset-a7') + blq('a3', pn(4, 'bAvanz'), junta(q.rAj, pa.rAvz, rElec), q.aj + pa.avz + modElec(c), 'reset-a3+b2+elec');
  const B = '';
  const equipo = q.fichas ? `<div class="res-sec" id="det-equipo"><div class="res-tit">${led ? ICO.led : ICO.proy}${t('equipoSel')}</div>${q.fichas}</div>` : '';
  return { A, B, equipo };
}
// Las columnas no se desplazan nunca: si la altura no da para todos los bloques, quedan abiertos los últimos que se han tocado y el resto
// se pliega enseñando su resumen. Si ni uno solo cabe (muchos obstáculos en un portátil), ese bloque se desplaza por dentro de su marco.
const reciente = { a: ['a2', 'a5', 'a7', 'a1', 'b1', 'a3', 'b3'], b: [] };   // v10.89 · el paso ① siempre abierto al entrar; el ④ (avanzado) es el primero en plegarse
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
  // v10.88 · las seis vistas se ven siempre en la caja de la simulación (sin ventana); contenido: carta, simular o propio; INDICADORES enciende o apaga
  // todo lo que no es la pantalla, el proyector o su haz (rótulos, cotas, avisos, figuras y safety zone)
  if (!['carta', 'simular', 'propio'].includes(v.contenido)) v.contenido = v.contenido === 'apagado' ? 'carta' : 'simular';
  $('#esc-vistas').innerHTML = ['exterior', 'interior', 'planta', 'lateral', 'frontal', 'cenital'].map(k => tog(v.camara === k, `data-cam="${k}"`, t(['lateral', 'frontal', 'cenital'].includes(k) ? 'vt_' + k : k))).join('');
  $('#esc-cont').innerHTML = ['carta', 'simular', 'propio'].map(k => tog(v.contenido === k, `data-set="vista.contenido" data-v="${k}"`, t(k))).join('') + tog(v.etiquetas, 'data-accion="etiquetas"', t('indicadores') + (v.etiquetas ? ' · ON' : ' · OFF'));
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
  normalizaTam();   // v10.88 · ancho y alto desde la proporción y la diagonal / ancho / alto
  calculo = calcular();
  // v8.5 · tres zonas: «la pantalla» y «el equipo» fijas; las superficies y la ficha de lo elegido pasan al centro, con el resto del detalle
  const z = zonas(calculo), sc = {};
  ['A', 'B'].forEach(k => { const m = $('#panel' + k + ' .blq.act .blq-cuerpo'); if (m) sc[k] = [m.parentElement.dataset.blq, m.scrollTop]; });
  $('#panelA').innerHTML = z.A; $('#panelB').innerHTML = z.B;
  $('#res').innerHTML = vistaResultados(calculo) + z.equipo + modSuperficies(calculo);
  plegar();
  ['A', 'B'].forEach(k => { if (!sc[k]) return; const m = $(`#panel${k} .blq.act[data-blq="${sc[k][0]}"] .blq-cuerpo`); if (m) m.scrollTop = sc[k][1]; });
  marcaPestanas($('#res'));
  encajaTablas();
  activarVistas($('#res'), calculo, fijarVt);
  barraEscena(); bandaOos();
  try { dispatchEvent(new Event('sc-calculo')); } catch (e) {}   /* v10.88 · la ventana grande de las vistas técnicas se vuelve a pintar */
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
    sombras: E.tecnologia === 'proy' && E.vista.etiquetas ? c.sombras : null, haces: c.sombras ? c.sombras.haces : null,
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
  if (a) { SUELTO.dist = 0; SUELTO.altura = 0; }   /* v10.99 · el aviso de candado soltado se enseña una vez */
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
  if (a === 'pest') { E.vista.pest = b.dataset.v; guardar(); const r = $('#res'); if (r) { r.dataset.pest = E.vista.pest; r.querySelectorAll('.res-pest .tog').forEach(x => { const on = x.dataset.v === E.vista.pest; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); }); r.scrollTop = 0; encajaTablas(); } return; }
  if (a === 'ficha-ir') { irA('#det-equipo'); return; }
  if (/^reset-(a|a\d|b\d)(\+(a\d|b\d|elec))*$/.test(a)) { const d = DEF(), cp = (o, src, ks) => ks.forEach(x => { o[x] = src[x]; }), led = E.tecnologia === 'led';
    for (const k of a.slice(6).split('+')) {   // v10.89 · un paso puede juntar varios bloques: se restablecen todos
    if (k === 'elec') { E.elec = d.elec; continue; }
    if (k === 'a' || k === 'a1') { E.esp.tipo = d.esp.tipo; if (led) { cp(E.led, d.led, ['clase', 'tipo', 'transp', 'gold', 'protegido', 'sol', 'nitsMin']); E.led.crm = ''; } }
    if (!led && (k === 'a' || k === 'a2')) { cp(E.proy, d.proy, ['montaje', 'altura']); cp(E.esp.sueltas, d.esp.sueltas, ['techo']); }   // v10.88 · PROYECCIÓN: sala y proyector
    if (!led && (k === 'a' || k === 'a5')) { cp(E.esp.sueltas, d.esp.sueltas, ['n', 'disp', 'ancho', 'alto', 'sep', 'angulo', 'central', 'cAncho', 'cAlto']); ['formato', 'medPor', 'medVal', '_wh', 'tams'].forEach(x => delete E.esp.sueltas[x]); }
    if (!led && (k === 'a' || k === 'a5')) { cp(E.esp, d.esp, ['elev', 'altoCubierto']); cp(E.esp.sueltas, d.esp.sueltas, ['elev']); }
    if (!led && (k === 'a' || k === 'a7')) cp(E.proy, d.proy, ['dist', 'distMin', 'distMax']);
    if (!led && (k === 'a' || k === 'a3')) { cp(E.esp.sueltas, d.esp.sueltas, ['dist']); E.esp.obst = []; E.proy.oos = false; }
    if ((k === 'a' || k === 'a2') && (led || E.esp.tipo === 'sala')) { cp(E.esp, d.esp, ['ancho', 'fondo', 'alto']); E.esp.paredes = d.esp.paredes; cp(E.esp.sueltas, d.esp.sueltas, ['n', 'disp', 'ancho', 'alto', 'sep', 'angulo', 'central', 'cAncho', 'cAlto']); delete E.esp.sueltas.tams; }
    if ((k === 'a' || k === 'a3') && !led) { cp(E.proy, d.proy, ['lux', 'luzUso', 'ganancia']); E.proy.luzMano = false; }
    if (led && (k === 'a' || k === 'a2' || k === 'a4')) { cp(E.esp, d.esp, ['elev', 'altoCubierto']); cp(E.esp.sueltas, d.esp.sueltas, ['elev', 'dist', 'techo']); E.esp.obst = []; }
    if (k === 'b1') { if (led) E.led.crm = ''; else cp(E.proy, d.proy, ['cuerpo', 'optica', 'idSuelo', 'oos', 'lmMin', 'tipoOpt']); }
    if (k === 'b2') { if (led) E.led.ajuste = d.led.ajuste; else cp(E.proy, d.proy, ['solape', 'multi', 'orient']); }
    }
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
    /* v10.98 · al salir de mapping no se hereda su fachada de 10,67 × 6 m ni su proyector fijado a 6 m (de ahí salía el candado de 6 m en la sala
       inmersiva): vuelve la pantalla de antes y la distancia en automático, salvo que se hayan cambiado a mano en mapping */
    if (antes === 'mapping' && v !== 'mapping') { const s = E.esp.sueltas, d0 = DEF().esp.sueltas, intacta = Math.abs(s.alto - 6) < 0.02 && Math.abs(s.ancho - 6 * 16 / 9) < 0.02;
      if (intacta) { s.ancho = ANTES_MAP ? ANTES_MAP.ancho : d0.ancho; s.alto = ANTES_MAP ? ANTES_MAP.alto : d0.alto; }
      if (Number(E.proy.dist) === 6 || v === 'sala') Object.assign(E.proy, { dist: ANTES_MAP && v !== 'sala' ? ANTES_MAP.dist : 0, distMin: ANTES_MAP ? ANTES_MAP.distMin : 0, distMax: ANTES_MAP ? ANTES_MAP.distMax : 0 });
      ANTES_MAP = null; }
    luzDeTipo(v); actualizar(); return; }
  // candados: al cerrarlo se fija el valor que estaba calculando AUTO; al abrirlo vuelve a AUTO
  if (a === 'lock-dist' || a === 'lock-alt') {
    SUELTO.dist = 0; SUELTO.altura = 0;
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
  if (a === 'med-por') { const q = E.esp.sueltas; q.medPor = b.dataset.v; const r = ratioFormato(); if (r) { q.medVal = medDe(q.medPor, q.ancho, q.ancho / r); q._wh = null; } actualizar(); return; }   // v10.88
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
  if (s.dataset.sel) { fijar(s.dataset.sel, s.value); if (s.dataset.sel === 'proy.cuerpo') E.proy.optica = '';
    if (s.dataset.sel === 'esp.sueltas.formato' || s.dataset.sel === 'esp.sueltas.medPor') { const q = E.esp.sueltas, r = ratioFormato(); if (r) { q.medVal = medDe(q.medPor || 'diag', q.ancho, q.ancho / r); q._wh = null; } }   // v10.88 · se conserva el ancho
    actualizar(); }   // otro proyector: su óptica vuelve a AUTO
  if (s.dataset.rango) { fijar(s.dataset.rango, Math.round(Number(s.value) * 100) / 100); actualizar(); }   // v8.2 · deslizador del zoom: fija la distancia
  if (s.dataset.uso && s.value) { const u = USOS_LUZ.find(x => x[0] === s.value); if (u) { E.proy.lux = u[1]; E.proy.luzUso = u[0]; E.proy.luzMano = true; } actualizar(); }
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
  const fichas = E.tecnologia === 'led' ? (c.modelo ? [fichaCab(c.modelo, totalCab(c))] : []) : [fichaProy(c.proyector, t('fProy'))].concat(c.prSuelo && c.prSuelo !== c.proyector && c.filas.some(f => f.s.tipo === 'suelo') ? [fichaProy(c.prSuelo, t('fProySuelo'))] : []).concat(c.prCentral && c.prCentral !== c.proyector ? [fichaProy(c.prCentral, t('fProyCentral'))] : []);
  if (fichas.length) h += `<section class="res-sec im-equipos"><div class="res-tit">${t('equipos')}</div><div class="fichas">${fichas.join('')}</div></section>`;
  if (E.tecnologia === 'led' && c.modelo) h += planosPdf(c);   // v10.94 · planos técnicos de cada pantalla
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

/* v10.94 · planos técnicos de cada pantalla LED para el PDF, en el formato que el técnico pasa al cliente: el de señal (tarjeta-puerto-orden, X/Y/W/H en
   píxeles, E/S y redundancia, con la numeración de puertos de todo el proyecto) y el de alimentación (circuitos en cascada con su flecha de entrada).
   Los recorridos siguen el mismo criterio automático con el que se cuentan las líneas (columnas o filas enteras por puerto o por circuito). */
const COLS_PLANO = ['#19b5b0', '#c264c8', '#62b85a', '#4b4bc8', '#c2c040', '#e0803a', '#3a9be0', '#d0507a', '#8a8f9a', '#40c090'];
function planosPdf(c) {
  const m = c.modelo, x = c.elec || {}, bk = !!E.elec.backup, T = c.tot || {}, fs = c.filas.filter(f => f.r && f.r.cols && f.r.rows).slice(0, 8); if (!fs.length || !m) return '';
  idiomaPlano(idioma());
  const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; }, f2 = (v, d = 0) => Number(v).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pixCab = m.cabPixAncho * m.cabPixAlto, cabPuerto = Math.max(1, Math.floor(PX_PUERTO / pixCab)), amp = Number(m.cabAmp) || (m.wMax ? m.wMax / 230 : 0), casc = Math.floor(num(m.cascada)), wMed = num(m.wMed);
  const hoy = new Date(), l = idioma() === 'en' ? 'en-GB' : 'es-ES', fecha = hoy.toLocaleDateString(l, { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + hoy.toLocaleTimeString(l, { hour: '2-digit', minute: '2-digit' });
  const img = (svg) => `<img class="im-plano" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace('style="color:var(--txt)"', 'color="#17181c"').replace(/currentColor/g, '#17181c'))}" alt="">`;
  const out = fs.map(f => { const r = f.r, n = r.lineas, S = planCosido(r.cols, r.rows, cabPuerto), cabLin0 = amp > 0 ? Math.max(1, Math.floor(16 / amp)) : r.cab, cabLin = casc > 0 ? Math.min(cabLin0, casc) : cabLin0, P = planCosido(r.cols, r.rows, cabLin);
    const acum = (a) => a.reduce((o, v, i) => (o.push(i ? o[i - 1] + a[i - 1] : 0), o), []), colsPx = Array(r.cols).fill(+m.cabPixAncho), rowsPx = Array(r.rows).fill(+m.cabPixAlto);
    const geo = { colsMm: Array(r.cols).fill(+m.cabAncho), rowsMm: Array(r.rows).fill(+m.cabAlto), colsPx, rowsPx, colsX: acum(colsPx), rowsY: acum(rowsPx), H: 540, top: 8, bottom: 8, colores: COLS_PLANO, tr: trPlano };
    const nota = r.quitados ? ['Retícula completa: no descuenta los cabinets quitados por puertas u obstáculos.'] : [];
    const sen = svgPlanoSenal({ ...geo, rutas: S.rutas, cosido: S.modo, backup: bk, puerto0: f.lin ? f.lin[0] - 1 : 0, nTotal: T.lineas || n, info: [['Tamaño de la pantalla', r.resW + ' × ' + r.resH + ' px'], ['Nombre', f.nombre], ['Modelo', m.crm], ['Cabinets', r.cols + ' × ' + r.rows + ' = ' + r.cab], ['Píxeles por cabinet', m.cabPixAncho + ' × ' + m.cabPixAlto], ['Procesador', x.proc ? x.proc.modelo : '—'], ['Puertos de datos', (f.lin ? 'P' + f.lin[0] + (f.lin[1] > f.lin[0] ? '–' + f.lin[1] : '') : n) + (bk ? ' + R' : '')], ['Máx. por puerto', cabPuerto + ' cab · ' + f2(PX_PUERTO / 1000) + 'k px'], ['Cosido', trPlano(S.modo)], ['Fecha', fecha]],
      notas: ['Cada cabinet: tarjeta-puerto-orden, posición X, Y y tamaño W, H en píxeles.', 'E: entrada del puerto · S: salida, fin de la cadena.'].concat(bk ? ['R: redundancia (backup), otro puerto que entra por el último cabinet de cada cadena.'] : []).concat(nota) });
    const ele = svgPlanoElec({ ...geo, rutas: P.rutas, cosido: P.modo, porCab: +m.wMax > 0 ? f2(m.wMax) + ' W' : '', info: [['Circuitos', P.rutas.length + ' × 16 A · 230 V'], ['Máx. en cascada', cabLin + ' cabinets'], ['Por cabinet', [+m.wMax > 0 ? f2(m.wMax) + ' W' : '', amp > 0 ? f2(amp, 2) + ' A' : ''].filter(Boolean).join(' · ') || '—'], ['Consumo de pico', r.kw > 0 ? f2(r.kw, 2) + ' kW' : '—']].concat(wMed > 0 ? [['Consumo medio', f2(wMed * r.cab / 1000, 2) + ' kW']] : []).concat([['Corriente total', amp > 0 ? f2(r.cab * amp, 1) + ' A' : '—'], ['Cosido', trPlano(P.modo)]]),
      notas: ['Flecha roja: entrada de corriente de cada circuito; sus cabinets van en cascada.', P.modo === 'vertical' ? 'El paso del cable entre verticales (discontinua) puede requerir prolongarlo para que llegue.' : 'El paso del cable entre filas (discontinua) puede requerir prolongarlo para que llegue.', 'Protección recomendada: diferenciales superinmunizados de curva C, uno por circuito.'].concat(amp > 0 ? [] : ['Sin datos de consumo en el catálogo.']) });
    return `<div class="im-plano-par"><div class="im-plano-tit"><b>${f.nombre}</b> · ${trPlano('Plano de señal')}</div>${img(sen)}<div class="im-plano-tit"><b>${f.nombre}</b> · ${trPlano('Plano de alimentación')}</div>${img(ele)}</div>`; }).join('');
  return `<section class="res-sec im-planos"><div class="res-tit">${trPlano('Planos técnicos')}</div>${out}<p class="im-plano-nota">${trPlano('* Planos orientativos calculados por SCREENS: confirmar con el fabricante el cosido, la cascada y la protección antes de instalar.')}</p></section>`;
}

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
/* v10.88 · si un título cambia de ancho sin cambiar el DOM (p. ej. cuando la consola le añade botones), se vuelve a ajustar */
const roTextos = typeof ResizeObserver === 'function' ? new ResizeObserver(() => requestAnimationFrame(ajustarTextos)) : null;
new MutationObserver(() => { if (roTextos) document.querySelectorAll('.blq-nom:not([data-ro])').forEach((e) => { e.setAttribute('data-ro', ''); roTextos.observe(e); }); }).observe(document.body, { childList: true, subtree: true });
['app', 'consola'].forEach(id => obsTextos.observe(document.getElementById(id), { childList: true, subtree: true }));
window.addEventListener('resize', () => requestAnimationFrame(() => { plegar(); ajustarPh(); encajaTablas(); }));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { ajustarTextos(); ajustarPh(); });

// ---------- cabecera y arranque ----------
function pintarCabecera() {
  $('#btn-idioma').textContent = idioma().toUpperCase();
  $('#btn-idioma').title = t('idioma');
  [['#btn-inicio', 'nuevo'], ['#btn-pdf', 'pdf'], ['#btn-info', 'info']].forEach(([id, k]) => { const b = $(id); b.title = t(k); b.setAttribute('aria-label', t(k)); });
  $('.marca').title = t('nuevo');
  $('#pie').innerHTML = (window.AVCREDITO ? (() => { const h = window.AVCREDITO.html('SCREENS', VERSION, idioma()), k = h.indexOf(' · <a href="#aviso"'); return `<span class="cred-ver">SCREENS ${VERSION}</span>` + (k > 0 ? '<span class="cred-txt">' + h.slice(0, k) + ' · </span>' + h.slice(k + 3) : h); })() :   /* v10.88 · en móvil vertical solo «SCREENS vX · Aviso legal» */ `SCREENS ${VERSION} ${new Date().getFullYear()} ${t('pie')} <i class="ic ic-footer" aria-hidden="true"></i> by <a href="https://mediaservi.com" target="_blank" rel="noopener">mediaservi.com</a>`) + `<a class="admin-btn${esInterno() ? ' on' : ''}" href="${urlAccesoInterno()}"${esInterno() ? ' data-salir-interno' : ''} title="${esInterno() ? 'Acceso interno activo (ves el stock real) · toca para cerrarlo' : 'Acceso interno (solo con el Gmail del propietario)'}" aria-label="Acceso interno"><i class="ic ic-admin" aria-hidden="true"></i></a>`;   /* v10.88 · como en UNA: el candado da la llave del stock interno, se ve verde si está activa y al tocarlo se cierra */
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
