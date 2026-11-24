/* SCREENS · planos técnicos de una pantalla LED · mediaservi.com · GPL-3.0
   v10.94 · los dos planos que el técnico pasa al cliente, dibujados con los mismos datos que calcula SCREENS:
   - plano de señal: cada cabinet con «tarjeta-puerto-orden» y su X, Y, W, H en píxeles; una línea de color por puerto de datos,
     E (entrada del puerto) y S (salida, fin de la cadena), el sentido del cosido y, con backup, la redundancia (R) que entra por el último cabinet;
   - plano de alimentación: circuitos de corriente en cascada (en U entre columnas o filas, como el cosido), con la flecha de entrada de corriente,
     el máximo de cabinets por cascada y los pasos de cable entre verticales, que pueden necesitar prolongar el cable.
   Las funciones son puras (no tocan la página): reciben la geometría y los recorridos ya calculados y devuelven el SVG.
   El texto va en currentColor, así se lee en la app (tema oscuro o claro) y en el PDF (tinta sobre fondo claro de plano). */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MONO = 'Share Tech Mono, monospace', SANS = 'Inter, sans-serif', ROJO = '#e5404f';
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
/* texto que se encoge a lo ancho si no cabe en «max» */
const tx = (x, y, s, o = {}) => { s = String(s); const sz = o.sz || 13, max = o.max || 0, lj = max && s.length * sz * (o.mono ? .6 : .56) > max ? ` textLength="${max.toFixed(1)}" lengthAdjust="spacingAndGlyphs"` : '';
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${sz.toFixed(1)}" font-weight="${o.w || 400}" fill="${o.c || 'currentColor'}"${o.op ? ` fill-opacity="${o.op}"` : ''} text-anchor="${o.a || 'middle'}" font-family="${o.mono ? MONO : SANS}"${o.crudo ? ' data-crudo=""' : ''}${lj}>${esc(s)}</text>`; };
/* parte un texto en líneas de como mucho «n» caracteres */
const parte = (s, n) => { const out = []; let l = ''; String(s).split(' ').forEach((p) => { if (l && (l + ' ' + p).length > n) { out.push(l); l = p; } else l = l ? l + ' ' + p : p; }); if (l) out.push(l); return out; };

/* geometría común: la retícula de cabinets a escala real a la izquierda y el cuadro de información a la derecha */
/* con «prop» (ancho / alto del hueco) por debajo de 1,15, como en el móvil en vertical, el cuadro va debajo de la retícula y el dibujo es más estrecho, para que se lea */
function base(o) {
  const ap = o.prop > 0 && o.prop < 1.15, W = ap ? 520 : o.W || 1000, H = ap ? Math.round(cl(520 / o.prop, 560, 1100)) : o.H || 620, top = o.top || 10, bottom = o.bottom || 10, PW = ap ? W - 32 : 262, cols = o.colsMm.length, rows = o.rowsMm.length;
  const nc = ap ? Math.floor(PW / 6.2) : 40, tr = o.tr || ((x) => x), altoC = 34 + o.info.length * 19 + ((o.notas || []).length ? 12 + (o.notas || []).reduce((a, n) => a + parte(tr(n), nc).length * 14.5 + 5, 0) : 6);
  const lado = o.cosido === 'vertical' ? 0 : 40;   /* con cosido horizontal las entradas van a los lados: margen para sus etiquetas y flechas */
  const gx0 = 16 + lado, gx1 = ap ? W - 16 - lado : W - PW - 34 - lado, gy0 = top + 34, gy1 = H - bottom - 34 - (ap ? altoC + 40 : 0), sC = o.colsMm.reduce((a, b) => a + b, 0), sR = o.rowsMm.reduce((a, b) => a + b, 0);
  const k = Math.min((gx1 - gx0) / sC, (gy1 - gy0) / sR), pw = sC * k, ph = sR * k, px = gx0 + (gx1 - gx0 - pw) / 2, py = gy0 + (gy1 - gy0 - ph) / 2;
  const xs = [px]; o.colsMm.forEach((v) => xs.push(xs[xs.length - 1] + v * k)); const ys = [py]; o.rowsMm.forEach((v) => ys.push(ys[ys.length - 1] + v * k));
  /* f = 0 es la fila de abajo, como en los recorridos de SCREENS */
  const celda = (c, f) => { const t = rows - 1 - f; return { x: xs[c], y: ys[t], w: xs[c + 1] - xs[c], h: ys[t + 1] - ys[t] }; };
  return { W, H, top, bottom, PW, cols, rows, px, py, pw, ph, celda, xs, ys, panelX: ap ? (W - PW) / 2 : W - PW - 12, ap, nc, altoC };
}
/* el punto por donde pasa el cable dentro de cada cabinet (a un lado, para que el rótulo quede libre) y dónde va el rótulo */
const punto = (q, vert) => (vert ? { x: q.x + q.w * .2, y: q.y + q.h / 2 } : { x: q.x + q.w / 2, y: q.y + q.h * .78 });
const zonaTxt = (q, vert) => (vert ? { x: q.x + q.w * .6, y: q.y + q.h / 2, w: q.w * .74, h: q.h * .6 } : { x: q.x + q.w / 2, y: q.y + q.h * .4, w: q.w * .8, h: q.h * .6 });
/* recorrido de una cadena en tramos: dentro de una columna (o fila) el cable va recto; el paso a la siguiente va pegado al borde del cabinet para no tapar el rótulo */
function tramos(ru, b, vert) { const out = []; let cur = [punto(b.celda(ru[0][0], ru[0][1]), vert)];
  for (let j = 1; j < ru.length; j++) { const [c0, f0] = ru[j - 1], [c1, f1] = ru[j], p0 = punto(b.celda(c0, f0), vert), p1 = punto(b.celda(c1, f1), vert);
    if (vert ? c1 !== c0 : f1 !== f0) { const q = b.celda(c0, f0), q1 = b.celda(c1, f1);
      const sal = vert ? (f0 === b.rows - 1 ? [[p0.x, q.y + q.h * .1], [p1.x, q1.y + q1.h * .1]] : f0 === 0 ? [[p0.x, q.y + q.h * .9], [p1.x, q1.y + q1.h * .9]] : [[p1.x, p0.y]]) : (c0 === 0 ? [[q.x + q.w * .05, p0.y], [q1.x + q1.w * .05, p1.y]] : c0 === b.cols - 1 ? [[q.x + q.w * .95, p0.y], [q1.x + q1.w * .95, p1.y]] : [[p0.x, p1.y]]);
      const ps = [p0].concat(sal.map(([x, y]) => ({ x, y }))).concat([p1]); cur.push(ps[1]); out.push({ pts: cur, salto: false }); out.push({ pts: ps.slice(1), salto: true }); cur = [p1]; }
    else cur.push(p1); }
  out.push({ pts: cur, salto: false }); return out.filter((t) => t.pts.length > 1); }
const linea = (ps, col, sw, extra) => `<polyline points="${ps.map((p) => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="${sw.toFixed(2)}" stroke-linejoin="round" stroke-linecap="round"${extra || ''}/>`;
/* rótulo de un cabinet: hasta tres líneas en monoespaciada; si no caben, solo la primera; si tampoco, nada */
function rotulo(q, vert, lineas, col) {
  const z = zonaTxt(q, vert), lar = Math.max(...lineas.map((s) => s.length)), f3 = Math.min(z.h / (lineas.length + .7), z.w / (lar * .6), 15);
  if (f3 >= 6.5) return lineas.map((s, i) => tx(z.x, z.y + (i - (lineas.length - 1) / 2) * f3 * 1.12 + f3 * .36, s, { sz: f3, mono: true, c: i ? 'currentColor' : col, w: i ? 400 : 700, op: i ? .85 : 0, crudo: true })).join('');
  const f1 = Math.min(z.h / 1.5, z.w / (lineas[0].length * .6), 15);
  return f1 >= 5.5 ? tx(z.x, z.y + f1 * .36, lineas[0], { sz: f1, mono: true, c: col, w: 700, crudo: true }) : '';
}
/* el cuadro de información: título, filas «dato · valor» y notas */
function cuadro(b, titulo, filas, notas, tr, col) {
  const x = b.panelX, an = b.PW, fh = 19, nl = notas.map((n) => parte(tr(n), b.nc)), alto = b.altoC;
  const y = b.ap ? Math.min(b.py + b.ph + 46, b.H - b.bottom - alto - 4) : Math.max(b.top + 6, Math.min(b.py, b.H - b.bottom - alto - 4));
  let g = `<rect x="${x}" y="${y}" width="${an}" height="${alto.toFixed(1)}" rx="6" fill="currentColor" fill-opacity=".04" stroke="currentColor" stroke-opacity=".55" stroke-width="1.2"/><path d="M${x} ${y + 26}H${x + an}" stroke="currentColor" stroke-opacity=".55" stroke-width="1"/><rect x="${x}" y="${y}" width="5" height="26" fill="${col}"/>`;
  g += tx(x + 14, y + 18, tr(titulo), { sz: 12.5, w: 800, a: 'start', max: an - 24 });
  filas.forEach(([k, v], i) => { const yy = y + 26 + (i + 1) * fh - 5; if (i) g += `<path d="M${x + 8} ${yy - fh + 5}H${x + an - 8}" stroke="currentColor" stroke-opacity=".14" stroke-width="1"/>`;
    const kk = tr(k); g += tx(x + 10, yy, kk, { sz: 11.5, a: 'start', op: .78, max: an * .5 }) + tx(x + an - 10, yy, v, { sz: 12, mono: true, a: 'end', w: 700, max: an - 24 - Math.min(an * .5, kk.length * 11.5 * .56), crudo: true }); });
  let yy = y + 26 + filas.length * fh + 18; nl.forEach((ls) => { ls.forEach((l) => { g += tx(x + 10, yy, l, { sz: 11, a: 'start', op: .82, crudo: true }); yy += 14.5; }); yy += 5; });
  return g;
}
const marcadores = (cols, id) => cols.map((c, i) => `<marker id="${id}${i}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M1 1 9 5 1 9z" fill="${c}"/></marker>`).join('');
/* borde de la retícula más cercano a un cabinet, siguiendo el cosido (por dónde entra o sale el cable) */
const bordeDe = (c, f, b, vert) => (vert ? (f <= (b.rows - 1) / 2 ? 'b' : 't') : (c <= (b.cols - 1) / 2 ? 'l' : 'r'));

/* ---------- plano de señal ---------- */
export function svgPlanoSenal(o) {
  const b = base(o), tr = o.tr || ((s) => s), COL = o.colores, vert = o.cosido === 'vertical', n = o.rutas.length, bk = !!o.backup, pT = o.porTarjeta || 0;
  const p0 = o.puerto0 || 0, nT = o.nTotal || n;   /* en la consola, los puertos siguen la numeración de todas las pantallas */
  const tp = (i) => { const k = i < n ? p0 + i : nT + p0 + (i - n); return pT ? [Math.floor(k / pT) + 1, (k % pT) + 1] : [1, k + 1]; };
  let g = `<svg viewBox="0 0 ${b.W} ${b.H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="color:var(--txt)" role="img" aria-label="${esc(tr('Plano de señal'))}"><defs>${marcadores(COL, 'ps')}</defs>`;
  const sw = cl(Math.min(b.pw / b.cols, b.ph / b.rows) * .045, 1.6, 3.4);
  /* cabinets con el color de su puerto y su rótulo */
  o.rutas.forEach((ru, i) => { const col = COL[i % COL.length], [t, p] = tp(i);
    ru.forEach(([c, f], j) => { const q = b.celda(c, f);
      g += `<rect x="${(q.x + .5).toFixed(1)}" y="${(q.y + .5).toFixed(1)}" width="${Math.max(.1, q.w - 1).toFixed(1)}" height="${Math.max(.1, q.h - 1).toFixed(1)}" fill="${col}" fill-opacity=".2" stroke="currentColor" stroke-opacity=".5" stroke-width="1"/>`;
      g += rotulo(q, vert, [`${t}-${p}-${j + 1}`, `X:${o.colsX[c]} Y:${o.rowsY[b.rows - 1 - f]}`, `W:${o.colsPx[c]} H:${o.rowsPx[b.rows - 1 - f]}`], col); }); });
  g += `<rect x="${b.px.toFixed(1)}" y="${b.py.toFixed(1)}" width="${b.pw.toFixed(1)}" height="${b.ph.toFixed(1)}" fill="none" stroke="currentColor" stroke-opacity=".8" stroke-width="1.6"/>`;
  /* cada cadena: su línea con el sentido del cosido, E al entrar y S al salir; con backup, R (redundancia) en el último cabinet */
  o.rutas.forEach((ru, i) => { if (!ru.length) return; const col = COL[i % COL.length], pts = ru.map(([c, f]) => punto(b.celda(c, f), vert)), q0 = b.celda(ru[0][0], ru[0][1]), rM = cl(Math.min(q0.w, q0.h) * .13, 5, 11);
    if (pts.length > 1) { const mk = Math.min(q0.w, q0.h) > 26 ? ` marker-mid="url(#ps${i % COL.length})"` : ''; tramos(ru, b, vert).forEach((t) => { g += linea(t.pts, col, sw, t.salto ? '' : mk); }); }
    const a = pts[0], z = pts[pts.length - 1], [t, p] = tp(i), [tb, pb] = tp(n + i);
    const marca = (pt, l, lleno) => `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${rM.toFixed(1)}" fill="${lleno ? col : '#fff'}" stroke="${lleno ? '#0b0b10' : col}" stroke-opacity="${lleno ? .55 : 1}" stroke-width="${lleno ? 1.2 : 2.2}"/>` + tx(pt.x, pt.y + rM * .38, l, { sz: rM * 1.15, w: 900, c: '#0b0b10' });
    const marcas = marca(a, 'E', true) + (pts.length > 1 ? marca(z, 'S', false) : '');
    /* etiquetas del puerto fuera de la pantalla, junto a su entrada (y a la de la redundancia) */
    const tag = (c, f, s, dash) => { const q = b.celda(c, f), e = bordeDe(c, f, b, vert), fz = cl(Math.min(q.w, q.h) * .26, 9, 13), pt = punto(q, vert);
      const x = e === 'l' ? b.px - 6 : e === 'r' ? b.px + b.pw + 6 : pt.x, y = e === 'b' ? b.py + b.ph + fz + 5 : e === 't' ? b.py - 7 : pt.y + fz * .36;
      return `<path d="M${pt.x.toFixed(1)} ${pt.y.toFixed(1)}${e === 'b' ? 'V' + (b.py + b.ph + 2) : e === 't' ? 'V' + (b.py - 2) : e === 'l' ? 'H' + (b.px - 2) : 'H' + (b.px + b.pw + 2)}" stroke="${col}" stroke-width="${(sw * .8).toFixed(2)}"${dash ? ' stroke-dasharray="4 3"' : ''} fill="none"/>` + tx(x, y, s, { sz: fz, mono: true, w: 700, c: col, a: e === 'l' ? 'end' : e === 'r' ? 'start' : 'middle', crudo: true }); };
    g += tag(ru[0][0], ru[0][1], (t > 1 || pT ? t + '·' : '') + 'P' + p);
    if (bk) { const u = ru[ru.length - 1]; g += tag(u[0], u[1], (tb > 1 || pT ? tb + '·' : '') + 'R' + pb, true); }
    g += marcas; });   /* las marcas E y S, encima de las líneas de las etiquetas */
  g += cuadro(b, 'INFORMACIÓN DE LA PANTALLA', o.info, o.notas || [], tr, COL[0]);
  return g + '</svg>';
}

/* ---------- plano de alimentación ---------- */
export function svgPlanoElec(o) {
  const b = base(o), tr = o.tr || ((s) => s), COL = o.colores, vert = o.cosido === 'vertical';
  let g = `<svg viewBox="0 0 ${b.W} ${b.H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="color:var(--txt)" role="img" aria-label="${esc(tr('Plano de alimentación'))}"><defs>${marcadores(COL, 'pe')}<marker id="pe-in" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10z" fill="${ROJO}"/></marker></defs>`;
  const sw = cl(Math.min(b.pw / b.cols, b.ph / b.rows) * .045, 1.6, 3.4);
  o.rutas.forEach((ru, i) => { const col = COL[i % COL.length];
    ru.forEach(([c, f], j) => { const q = b.celda(c, f);
      g += `<rect x="${(q.x + .5).toFixed(1)}" y="${(q.y + .5).toFixed(1)}" width="${Math.max(.1, q.w - 1).toFixed(1)}" height="${Math.max(.1, q.h - 1).toFixed(1)}" fill="${col}" fill-opacity=".2" stroke="currentColor" stroke-opacity=".5" stroke-width="1"/>`;
      g += rotulo(q, vert, [`${i + 1}-${j + 1}`].concat(o.porCab ? [o.porCab] : []), col); }); });
  g += `<rect x="${b.px.toFixed(1)}" y="${b.py.toFixed(1)}" width="${b.pw.toFixed(1)}" height="${b.ph.toFixed(1)}" fill="none" stroke="currentColor" stroke-opacity=".8" stroke-width="1.6"/>`;
  o.rutas.forEach((ru, i) => { if (!ru.length) return; const col = COL[i % COL.length], pts = ru.map(([c, f]) => punto(b.celda(c, f), vert)), q0 = b.celda(ru[0][0], ru[0][1]), mk = Math.min(q0.w, q0.h) > 26 ? ` marker-mid="url(#pe${i % COL.length})"` : '';
    /* tramos dentro de una misma columna (o fila) continuos; el paso entre columnas (o filas), en discontinua: ahí puede hacer falta prolongar el cable */
    tramos(ru, b, vert).forEach((t) => { g += linea(t.pts, col, sw, t.salto ? ` stroke-dasharray="${(sw * 2.4).toFixed(1)} ${(sw * 1.6).toFixed(1)}"` : mk); });
    /* flecha roja de entrada de corriente desde el borde más cercano, con el número de circuito */
    const a = pts[0], e = bordeDe(ru[0][0], ru[0][1], b, vert), L = cl(Math.min(q0.w, q0.h) * .45, 14, 24), fz = cl(Math.min(q0.w, q0.h) * .26, 9, 13);
    const x0 = e === 'l' ? b.px - L : e === 'r' ? b.px + b.pw + L : a.x, y0 = e === 'b' ? b.py + b.ph + L * .8 : e === 't' ? b.py - L * .8 : a.y, rr = cl(Math.min(q0.w, q0.h) * .1, 3.5, 7);
    g += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(e === 'l' ? a.x - rr * 1.6 : e === 'r' ? a.x + rr * 1.6 : a.x).toFixed(1)}" y2="${(e === 'b' ? a.y + rr * 1.6 : e === 't' ? a.y - rr * 1.6 : a.y).toFixed(1)}" stroke="${ROJO}" stroke-width="${(sw * 1.5).toFixed(2)}" marker-end="url(#pe-in)"/><circle cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${ROJO}"/>`;
    g += tx(e === 'l' ? x0 - 4 : e === 'r' ? x0 + 4 : x0 + (vert ? 0 : 0), e === 'b' ? y0 + fz + 2 : e === 't' ? y0 - 5 : y0 - 5, 'C' + (i + 1), { sz: fz, mono: true, w: 700, c: ROJO, a: e === 'l' ? 'end' : e === 'r' ? 'start' : 'middle', crudo: true }); });
  g += cuadro(b, 'ALIMENTACIÓN', o.info, o.notas || [], tr, ROJO);
  return g + '</svg>';
}

/* recorridos en modo automático, con el mismo criterio que el cálculo de líneas (screens/led.js → lineasCosido): columnas o filas ENTERAS por grupo
   (puerto de datos o circuito); gana lo que menos grupos pide y, a igualdad, vertical; si no cabe ni una columna ni una fila, en serpentina por filas.
   Sirve para la consola (varias pantallas), que no guarda los recorridos. f = 0 es la fila de abajo. */
export function planCosido(cols, rows, porGrupo) {
  const g = Math.max(1, porGrupo | 0), cPP = Math.floor(g / rows), fPP = Math.floor(g / cols), v = cPP >= 1 ? Math.ceil(cols / cPP) : 0, h = fPP >= 1 ? Math.ceil(rows / fPP) : 0;
  const modo = v && h ? (h < v ? 'horizontal' : 'vertical') : v ? 'vertical' : h ? 'horizontal' : 'serpentina';
  const n = modo === 'vertical' ? v : modo === 'horizontal' ? h : Math.ceil(cols * rows / g), rutas = Array.from({ length: n }, () => []);
  if (modo === 'vertical') for (let c = 0; c < cols; c++) { const j = c % cPP; for (let q = 0; q < rows; q++) rutas[Math.floor(c / cPP)].push([c, j % 2 ? rows - 1 - q : q]); }
  else if (modo === 'horizontal') for (let f = 0; f < rows; f++) { const j = f % fPP; for (let q = 0; q < cols; q++) rutas[Math.floor(f / fPP)].push([j % 2 ? cols - 1 - q : q, f]); }
  else for (let f = 0, k = 0; f < rows; f++) for (let q = 0; q < cols; q++, k++) rutas[Math.floor(k / g)].push([f % 2 ? cols - 1 - q : q, f]);
  return { modo, rutas };
}
