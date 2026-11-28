/* SCREENS · v11.49 · BRIAN, el cerebro de AVHUB (panel AVHUB ADMIN): TODAS las reglas, umbrales y medidas del cálculo (proyección, cuerpos de los
   proyectores y LED) se leen en vivo de ?accion=brian&app=SCREENS y se guarda una copia para funcionar sin conexión. Si BRIAN no tiene un parámetro,
   vale el de aquí (los de siempre). Se edita en el panel (?vista=brian, temas «SCREENS · …»). Licencia GPL-3.0 · mediaservi.com */
import { ADMIN_URL } from './catalogo.js';
/* números (con su valor de siempre) */
export const BRIAN_DEF = {
  /* proyección · reglas */
  'proy.contraste.minimo': 7, 'proy.contraste.recomendado': 15, 'proy.contraste.analitico': 50, 'proy.contraste.video': 80,
  'proy.solape.minimo': 0.15, 'proy.solape.recomendado': 0.45, 'proy.solape.maximo': 0.65,
  'proy.recorte.maximo': 0.2, 'proy.recorte.multi': 0.5,
  'proy.holgura.lado': 0.40, 'proy.holgura.vertical': 0.20, 'proy.holgura.sinMampara': 1.5,
  'proy.mosaico.maximo': 15, 'proy.mapping.relacionTiro': 2, 'proy.persona.alto': 1.85,
  'proy.contraste.auto': 10, 'proy.brillo.minimo': 45, 'proy.brillo.minimoMapping': 80, 'proy.brillo.maximo': 250, 'proy.blending.mejoraContraste': 1.25,
  'proy.sala.bandaMinima': 1.9, 'proy.lumenes.tolerancia': 0.97, 'proy.puntos.marca': 50, 'proy.puntos.salaPrioridad': 400,
  'proy.luz.reunion': 140, 'proy.luz.aula': 210, 'proy.luz.evento': 140, 'proy.luz.salon': 70, 'proy.luz.teatro': 14, 'proy.luz.oscura': 15, 'proy.luz.calle': 5,
  /* v11.52 · salas inmersivas: brillo justo, suelo cenital y altura de lentes */
  'proy.sala.nitsTopeFactor': 2.5, 'proy.sala.puntosSobrebrillo': 3000, 'proy.sala.notaSobrebrillo': 30000, 'proy.sala.busquedaMs': 1500,
  'proy.sala.alturaLenteMin': 2.1, 'proy.sala.margenTecho': 0.35, 'proy.brillo.luzOscura': 15, 'proy.brillo.excesivoNits': 250, 'proy.suelo.sinUltracorta': 1, 'proy.suelo.solapeMax': 0.45,
  /* v11.54 · intérprete de la petición: el sitio (sala de uso diario, luz, público) antes que la pantalla (mismos valores que SITIO_DEF de sitio.js) */
  'nl.sala.distPorAlto': 6, 'nl.sala.margenFondo': 0.6, 'nl.sala.anchoMaxPared': 0.8, 'nl.sala.techo': 2.8, 'nl.sala.bordeInferior': 0.9, 'nl.sala.margenTecho': 0.15,
  'nl.sala.distMaxHolgura': 0.3, 'nl.luz.ventanas': 300, 'nl.luz.sol': 500, 'nl.medida.redondeo': 0.05,
  /* v11.58 · entradas validadas y blending por brillo solo en pantallas grandes */
  'proy.sala.maxLado': 60, 'proy.sala.maxAlto': 20, 'proy.pantalla.maxLado': 100, 'proy.luz.maxima': 100000, 'proy.ganancia.min': 0.3, 'proy.ganancia.max': 3,
  'proy.blending.brilloAnchoMin': 6, 'proy.publico.margen': 1, 'proy.pantallaReal.tolFormato': 0.04, 'proy.blending.brilloMaxEquipos': 6,
  /* LED */
  'led.distancia.interior': 3, 'led.distancia.exterior': 8, 'led.distancia.metrosPorMmPitch': 1,
  'led.nits.solDirecto': 5000, 'led.nits.solIndirecto': 2500, 'led.nits.exterior': 5000, 'led.nits.escaparate': 2500,
  'led.encaje': 0.15, 'led.pitch.tolerancia': 0.2, 'led.pitch.aviso': 0.06, 'led.formato169.cerca': 0.12, 'led.formato169.exacto': 0.02,
  'led.medida.toleranciaMm': 5, 'led.pixelesPorPuerto': 650000, 'led.linea.amperios': 16, 'led.linea.tension': 230,
  'led.holo.cajaDriversMm': 75, 'led.holo.margenAncho': 0.15,
  /* v11.53 · avisos de medida, redondeo, alimentación, HOLO y límites de entrada */
  'led.encaje.aviso': 0.10, 'led.encaje.pasarseMax': 0.05, 'led.linea.factorPotencia': 0.8, 'led.linea.usoMaximo': 0.8, 'led.holo.filasMax': 2, 'led.medida.maxM': 200, 'led.cabinets.max': 20000, 'led.calor.btuPorW': 3.412, 'led.trifasica.desdeLineas': 3, 'led.fuente.pxSalida': 8847360, 'led.fuente.anchoMax': 4096, 'led.formato.tolerancia': 0.03, 'led.trifasica.tension': 400,
  /* electrónica LED (motor común con SYSTEMS: tema de app TODAS) */
  'elec.pixelesPorPuerto': 650000, 'elec.conversor.puertos': 10, 'elec.mx2000.ranurasEntrada': 2, 'elec.mx2000.ranurasSalida': 2, 'elec.mx6000.ranurasEntrada': 8, 'elec.mx6000.ranurasSalida': 8,
  'elec.mx.tarjetaSalida.fibras': 4, 'elec.h.tarjetaRJ45.puertos': 20, 'elec.h.tarjetaFibra.fibras': 2, 'elec.h.tarjetaFibra.puertosPorFibra': 8, 'elec.reparto.maxEquipos': 4
};
/* textos (listas y medidas): marcas por orden, cuerpos preferidos en salas y chasis por defecto */
export const BRIAN_TXT = { 'proy.marcas.orden': 'EPSON, VIVITEK, CHRISTIE', 'proy.sala.prioridad': 'EB-L695SE', 'proy.chasis.defecto': '0,55 × 0,45 × 0,2' };
/* por modelo (los añade el panel): proy.chasis.<modelo> = «ancho × fondo × alto» (m) · proy.separacion.<modelo> = «con mampara / sin mampara» (m) */
const POR_MODELO = /^proy\.(chasis|separacion|optica)\./;
const K = 'sc_brian_screens';
export const num = (v) => { const n = Number(String(v == null ? '' : v).replace(',', '.').trim()); return isFinite(n) ? n : NaN; };
export const medidas = (v) => String(v == null ? '' : v).split(/[x×*\/]/i).map(num).filter((n) => isFinite(n) && n >= 0);
export const lista = (v) => String(v == null ? '' : v).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
export const slug = (m) => String(m || '').replace(/\+/g, 'plus').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');
const vale = (k, v) => { const n = num(v), d = BRIAN_DEF[k]; if (!isFinite(n) || n < 0) return false; return d < 1 && /solape|recorte|encaje|formato169|margen/.test(k) ? n < 1 : k === 'proy.lumenes.tolerancia' ? n > 0 && n <= 1 : true; };
export const BR = {};
let firma = '';
function aplica(p) {
  const nuevo = Object.assign({}, BRIAN_DEF, BRIAN_TXT);
  Object.keys(p || {}).forEach((k) => { const v = p[k];
    if (k in BRIAN_DEF) { if (vale(k, v)) nuevo[k] = num(v); }
    else if (k in BRIAN_TXT || POR_MODELO.test(k)) { if (String(v).trim()) nuevo[k] = String(v).trim(); } });
  const f = JSON.stringify(nuevo); if (f === firma) return false;
  Object.keys(BR).forEach((k) => delete BR[k]); Object.assign(BR, nuevo); firma = f; return true;
}
aplica({});
try { const g = JSON.parse(localStorage.getItem(K) || 'null'); if (g && g.params) aplica(g.params); } catch (e) {}
export const brian = (k) => BR[k];
/* lee BRIAN en vivo; si cambia algo, alCambiar() para volver a calcular */
export async function cargarBrian(alCambiar) {
  try { const r = await fetch(ADMIN_URL + '?accion=brian&app=SCREENS', { cache: 'no-store' }); if (!r.ok) return; const j = await r.json(); if (!j || !j.params) return;
    try { localStorage.setItem(K, JSON.stringify({ t: Date.now(), params: j.params })); } catch (e) {}
    if (aplica(j.params) && alCambiar) alCambiar(); } catch (e) {}
}
