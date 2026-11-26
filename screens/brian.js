/* SCREENS · v11.48 · BRIAN, el cerebro de AVHUB (panel AVHUB ADMIN): las reglas y los umbrales del cálculo de proyección se leen en vivo de
   ?accion=brian&app=SCREENS (solo los parámetros, sin fuentes) y se guarda una copia para funcionar sin conexión. Si BRIAN no tiene un parámetro,
   vale el de aquí. Se edita en el panel (?vista=brian, tema «SCREENS · parámetros del cálculo»). Licencia GPL-3.0 · mediaservi.com */
import { ADMIN_URL } from './catalogo.js';
export const BRIAN_DEF = {
  'proy.contraste.minimo': 7, 'proy.contraste.recomendado': 15, 'proy.contraste.analitico': 50, 'proy.contraste.video': 80,
  'proy.solape.minimo': 0.15, 'proy.solape.recomendado': 0.45, 'proy.solape.maximo': 0.65,
  'proy.recorte.maximo': 0.2, 'proy.recorte.multi': 0.5,
  'proy.holgura.lado': 0.40, 'proy.holgura.vertical': 0.20, 'proy.holgura.sinMampara': 1.5,
  'proy.mosaico.maximo': 15,
  'proy.luz.reunion': 140, 'proy.luz.aula': 210, 'proy.luz.evento': 140, 'proy.luz.salon': 70, 'proy.luz.teatro': 14, 'proy.luz.oscura': 15, 'proy.luz.calle': 5
};
const K = 'sc_brian_screens';
const vale = (k, v) => { const n = Number(v); if (!isFinite(n)) return false; const d = BRIAN_DEF[k]; return d == null ? false : (d < 1 ? n >= 0 && n < 1 : n >= 0); };
export const BR = Object.assign({}, BRIAN_DEF);
function aplica(p) { let cambia = false; Object.keys(BRIAN_DEF).forEach((k) => { const v = p && p[k] != null && vale(k, p[k]) ? Number(p[k]) : BRIAN_DEF[k]; if (BR[k] !== v) { BR[k] = v; cambia = true; } }); return cambia; }
try { const g = JSON.parse(localStorage.getItem(K) || 'null'); if (g && g.params) aplica(g.params); } catch (e) {}
export const brian = (k) => (BR[k] != null ? BR[k] : BRIAN_DEF[k]);
/* lee BRIAN en vivo; si cambia algo, alCambiar() para volver a calcular */
export async function cargarBrian(alCambiar) {
  try { const r = await fetch(ADMIN_URL + '?accion=brian&app=SCREENS', { cache: 'no-store' }); if (!r.ok) return; const j = await r.json(); if (!j || !j.params) return;
    try { localStorage.setItem(K, JSON.stringify({ t: Date.now(), params: j.params })); } catch (e) {}
    if (aplica(j.params) && alCambiar) alCambiar(); } catch (e) {}
}
