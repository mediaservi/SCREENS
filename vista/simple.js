/* SCREENS · modo SIMPLE (v10.50 beta)
   Una vista sencilla de la de siempre (PRO), con el mismo estado y el mismo cálculo: la portada (una pantalla LED, vista/una-led.js → window.__blocks)
   y la consola de proyección (screens/app.js → window.__consola). Las cabeceras y el pie son los de PRO en los dos modos (logo, familia AVHUB,
   iconos, modo, petición y CALCULAR); el interruptor SIMPLE · PRO, junto al logo, solo cambia el cuerpo de la página:
   - un asistente la primera vez (una pregunta por pantalla, botones grandes y siempre «No lo sé»), que se puede saltar;
   - LO QUE PIDES: un resumen editable (cada línea abre solo su pregunta);
   - la SIMULACIÓN A ESCALA en grande (dos tercios de alto y cuatro de las seis columnas), sin cuadros de datos encima;
   - el RESULTADO en la fila de abajo: la línea resumen, el semáforo y unas pocas cifras muy visuales que no repiten lo que ya dice la línea.
   El stock es un dato interno: solo su icono (caja verde = de stock; tarjeta con reloj naranja = a pedir). Un dato a cero (sin él en la tabla
   maestra, como el peso) no se enseña. La vista elegida se guarda en el navegador (screens_vista) y se puede pedir en los enlaces (?vista=simple|pro).
   Quien ya usaba SCREENS (ya vio la guía de PRO) entra en PRO; quien llega por primera vez, en SIMPLE con el asistente.
   Textos propios en español, inglés y catalán. Licencia GPL-3.0 · mediaservi.com */
import { HUMAN_PATH } from '../screens/figura.js';
import { PROYECTORES } from '../screens/proyeccion.js';

const VERSION = 'v10.96';
const PAG = document.getElementById('consola') ? 'consola' : 'portada';
const RAIZ = new URL('../', import.meta.url).href;
const K_VISTA = 'screens_vista', K_ASIS = 'screens_simple_asis', K_PIDE = 'screens_simple_pide';
const lee = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const pon = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- vista: SIMPLE o PRO ---------- */
const QS = new URLSearchParams(location.search);
let vista = QS.get('vista');
if (vista === 'simple' || vista === 'pro') pon(K_VISTA, vista);
else { vista = lee(K_VISTA); if (vista !== 'simple' && vista !== 'pro') { vista = lee('screens-blocks-guia') || lee('screens-consola-guia') ? 'pro' : 'simple'; pon(K_VISTA, vista); } }
const ASIS_URL = QS.get('asis');
if (ASIS_URL) { try { QS.delete('asis'); const q = QS.toString(); history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash); } catch (e) {} }
document.documentElement.classList.toggle('sc-simple', vista === 'simple');
/* apilado (móvil, vertical y poca altura; en la consola, también sin la plantilla escalada de escritorio): las piezas una debajo de otra */
const MQ_MOV = matchMedia('(orientation: portrait), (max-width: 900px), (max-height: 560px)'), MQ_BK = matchMedia('(min-width: 1024px) and (min-height: 521px)');
const apila = () => MQ_MOV.matches || (PAG === 'consola' && !MQ_BK.matches);
const ponApila = () => document.documentElement.classList.toggle('ss-apila', apila());
ponApila();

/* ---------- textos ---------- */
const T = {
  es: {
    sw: 'Modo SIMPLE o PRO',
    rCabs: 'cabinets', rVis: (a, b) => 'Visionado: mín. ' + a + ' · ópt. ' + b,     pides: 'LO QUE PIDES', necesitas: 'LO QUE NECESITAS', nCabs: 'Cabinets', nProc: 'Procesador LED', nMedia: 'Mediaserver', nRed: 'Cableado de datos', nRedV: (a) => a + ' líneas Ethernet + ' + a + ' de backup', nLuz: 'Electricidad', nLuzV: (k, n) => k + ' kW · ' + n + ' líneas de 16 A', sim: 'SIMULACIÓN A ESCALA', arrAmbos: 'ARRASTRA EL PROYECTOR O LA PERSONA', arrProy: 'ARRASTRA EL PROYECTOR', arrPub: 'ARRASTRA LA PERSONA', arrProyA: 'Distancia del proyector a la imagen', arrPubA: 'Distancia desde la que mira la gente', res: 'RESULTADO', cambiar: 'Cambiar', repetir: 'REPETIR LAS PREGUNTAS',
    pdf: 'VER PDF', compartir: 'COMPARTIR', enPro: 'VER TODO EN PRO', copiado: 'Resumen copiado: pégalo donde quieras.', noCopia: 'No se ha podido copiar.',
    calculando: 'Calculando…', cargando: 'Cargando el catálogo…', sinCat: 'No se ha podido leer el catálogo. Revisa la conexión.', reintentar: 'REINTENTAR', vacio: 'No hay pantallas para estos datos: cambia dónde va o el tamaño.',
    sinMotor: 'No se ha podido cargar el cálculo. Vuelve a cargar la página.', recargar: 'VOLVER A CARGAR',
    ajPro: (n) => (n === 1 ? '1 ajuste de PRO activo' : n + ' ajustes de PRO activos'), ajProT: 'Hay ajustes hechos en PRO que esta vista no enseña: por eso el resultado no es el automático.', restablecer: 'RESTABLECER',
    soloLed: 'Una sola pantalla LED se calcula en su propia página.', soloVarias: 'Varias pantallas de proyección por separado solo se calculan en PRO.', verPro: 'VER EN PRO', unaLed: 'UNA PANTALLA LED', unProy: 'UNA PROYECCIÓN', salaEntera: 'UNA SALA ENTERA',
    paso: (a, b) => 'Paso ' + a + ' de ' + b, atras: '← ATRÁS', saltar: 'SALTAR', sig: 'SIGUIENTE →', listo: 'LISTO', ver: 'VER MI RESULTADO', seguir: 'SEGUIR →', cerrar: 'Cerrar',
    hola: 'Hola. Te hago unas preguntas muy sencillas y te digo qué necesitas.', q0: '¿Qué quieres poner?',
    o0led: ['Una pantalla LED', 'Hecha de piezas de luz: se ve bien con luz y en la calle'], o0proy: ['Un proyector', 'Ilumina una pared, una pantalla o una sala entera'], o0no: ['No lo sé, ayúdame', 'Te hago dos preguntas y te digo'],
    qCalle: '¿Va en la calle o le da el sol?', qOscuro: '¿Puedes bajar las luces del sitio?', si: 'Sí', no: 'No',
    recLed: 'Te recomiendo una pantalla LED', recLedCalle: 'Con sol o en la calle, un proyector no se vería: el LED da mucha más luz.', recLedLuz: 'Si no puedes bajar la luz, el LED se sigue viendo bien.',
    recProy: 'Te recomiendo un proyector', recProyT: 'Con la luz baja, un proyector se ve bien y, en tamaños grandes, suele salir más barato.',
    qDonde: '¿Dónde va a estar la pantalla?', oIn: ['Dentro de un local', 'Una tienda, una sala, una oficina'], oOut: ['En la calle', 'Al aire libre'], oEsc: ['Detrás de un cristal', 'Un escaparate'],
    qSol: '¿Le da el sol de lleno?', oSolD: ['Sí, sol directo'], oSolI: ['Sombra o sol a ratos'], oSolN: ['No lo sé', 'Mejor contar con sol directo'],
    qMar: '¿Está cerca del mar?', oMarSi: ['Sí, a menos de 1 km'], oMarNo: ['No'],
    qUso: '¿Se queda puesta o es para un evento?', oFija: ['Se queda fija', 'Siempre en el mismo sitio'], oRental: ['La montamos y desmontamos', 'Eventos y alquiler'],
    qMed: '¿Cuánto mide el sitio donde va?', ayMed: 'Mide el hueco con un metro. Si no lo sabes exacto, pon una medida aproximada.', ancho: 'Ancho', alto: 'Alto', fondo: 'Fondo', tele: 'No sé el alto: como una tele',
    qDist: '¿Desde qué distancia la va a mirar la gente?', ayDist: 'Cuanto más cerca, más finos tienen que ser los puntos de luz.',
    d1: ['Muy cerca', 'Menos de 2 m'], d2: ['Como en una tienda', 'De 2 a 5 m'], d3: ['Desde lejos', 'De 5 a 10 m'], d4: ['Muy lejos', 'Más de 10 m'], metros: 'o escribe los metros', dNoSe: () => ['No lo sé', 'El pitch más grande que haya en stock'],
    qToca: '¿La gente podrá tocarla?', oTocaSi: ['Sí, a la altura de la mano'], oTocaNo: ['No, está alta o protegida'],
    qAlt: '¿A qué altura del suelo empieza?', a0: ['En el suelo'], a80: ['A la altura de una mesa', '80 cm'], a200: ['Alta', '2 m'], cms: 'o escribe los centímetros',
    qPtipo: '¿Dónde vas a proyectar?', pPared: ['En una pared o una pantalla', 'Una sala, un auditorio, una oficina'], pMap: ['En la fachada de un edificio', 'De noche'], pSala: ['En toda una sala', 'Para meterse dentro de la imagen'],
    qPtam: '¿De qué tamaño quieres la imagen?', ayPtam: 'Ancho y alto de lo que se ilumina.', qSala: '¿Cuánto mide la sala?', paredes: '¿En qué paredes?',
    frontal: 'Frontal', izquierda: 'Izquierda', derecha: 'Derecha', trasera: 'Trasera', suelo: 'Suelo',
    qLuz: '¿Cuánta luz hay en el sitio?', ayLuz: 'La luz del sitio hace que la imagen se vea más lavada.',
    l10: ['Casi a oscuras', 'Cine, sala inmersiva'], l50: ['Luz baja', 'Auditorio, salón'], l140: ['Luz normal', 'Oficina, sala de reuniones'], l300: ['Mucha luz', 'Aula, feria'],
    qPub: '¿A qué distancia mira la gente?', ayPub: 'De la gente a la imagen, más o menos.', noSe5: ['No lo sé', 'Cuento 5 m'],
    qMont: '¿Dónde puede ir el proyector?', mCol: ['Colgado del techo'], mApo: ['Encima de una mesa o en el suelo'], mAuto: ['Me da igual', 'Donde mejor vaya'],
    qTecho: '¿Qué altura tiene el techo?', noSe3: ['No lo sé', 'Cuento 3 m'],
    finT: '¡Listo!', finS: 'Ya tienes el resultado. Toca cualquier dato de LO QUE PIDES para cambiarlo, o pasa a PRO para verlo todo.',
    sDonde: 'Dónde', sUso: 'Uso', sTam: 'Tamaño del hueco', sDist: 'Se mira desde', sToca: 'Se puede tocar', sAlt: 'Altura del suelo',
    vIn: 'Dentro', vOut: 'En la calle', vEsc: 'Escaparate', vSolD: 'sol directo', vSolI: 'sombra', vMar: 'junto al mar', vFija: 'Fija', vRental: 'Eventos', vNormal: 'lo normal', vSuelo: 'En el suelo',
    vPared: 'Pared o pantalla', vMap: 'Fachada', vSala: 'Sala entera', sImg: 'Imagen', sSala: 'Sala', sLuz: 'Luz', sPub: 'La gente mira desde', sMont: 'Proyector', sTecho: 'Techo',
    vCol: 'Colgado', vApo: 'Apoyado', vAuto: 'Donde mejor vaya',
    /* resultado de la pantalla LED: la línea resumen (la del pie de la simulación de PRO), el semáforo y las cifras que no repite la línea */
    lLed: 'TU PANTALLA LED', ajMenosW: (n) => n + ' cm menos de ancho', ajMasW: (n) => n + ' cm más de ancho', ajMenosH: (n) => n + ' cm menos de alto', ajMasH: (n) => n + ' cm más de alto', ajY: ' y ', ajFin: 'para usar piezas enteras',
    semLedV: 'Encaja con lo que has pedido.',
    kCal: 'Calidad', kCalS: (p, f) => 'Pitch ' + p + ' mm · ' + f, kCalF: (f) => 'Formato ' + f, kNit: 'Nítida desde', kNitS: (o) => 'Lo ideal: a ' + o + ' m', kElec: 'Electricidad', kElecS: (n) => n + (n === 1 ? ' línea' : ' líneas') + ' de 16 A',
    kPeso: 'Peso', kPesoS: (k) => 'Cada pieza: ' + k + ' kg', kCtrl: 'Control',
    /* resultado de la proyección */
    lProy: 'TU PROYECCIÓN', lSala: 'TU SALA', proys: (n) => (n === 1 ? '1 proyector' : n + ' proyectores'),
    semV: 'Se verá bien con esta luz.', semA: (a) => 'Se verá algo lavada: ' + a + '.', semR: (a) => 'Se verá muy lavada: ' + a + '.', accLuz: 'hacen falta más lúmenes o controlar la luz ambiente', accMas: 'haz la imagen más pequeña o añade un proyector',
    pNoCabe: 'No hay un buen sitio para el proyector con estas medidas: cambia la distancia o míralo en PRO.',
    kLum: 'Lúmenes', kLumS1: 'Brillo del proyector', kLumSn: 'Cada uno', kOpt: (o) => 'Óptica ' + o, sCabe: 'El proyector cabe', vCabe: (a, b) => (a && b ? 'entre ' + a + ' y ' + b + ' m' : a ? 'a más de ' + a + ' m' : 'a menos de ' + b + ' m'), vCabeN: 'sin límite de distancia', sQue: 'Qué', vSalaLed: 'Sala LED entera', vVariasLed: 'Varias pantallas LED', sPants: 'Pantallas', vPants: (n, a, b) => n + ' de ' + a + ' × ' + b + ' m', qLtipo: '¿Qué vas a montar?',
    oLuna: ['Una pantalla LED', 'Una sola, del tamaño que quieras'], oLvarias: ['Varias pantallas LED', 'Hasta 4, una al lado de otra'], oLsala: ['Una sala LED entera', 'Las paredes de la sala, para meterse dentro de la imagen'],
    qPants: '¿Cuántas pantallas y de qué tamaño?', ayPants: 'Hasta 4, cada una con su medida. Todas llevan el mismo cabinet.', cuantas: 'Cuántas', qDondeV: '¿Dónde van a estar las pantallas?', qUsoV: '¿Se quedan puestas o son para un evento?',
    lSalaLed: 'TU SALA LED', lPantsLed: 'TUS PANTALLAS LED', cabs: (n) => n + ' cabinets', kLienzo: (w, h) => w + ' × ' + h + ' px', kCabs: 'Cabinets', kCabsS: (a, b) => 'De ' + a + ' × ' + b + ' mm', ajCab: (a, b) => 'pedías ' + a + ' × ' + b + ' m: se ajusta a cabinets enteros', vCabeE: (a) => 'a ' + a + ' m', vPubNS: 'no se sabe', noSePub: ['No lo sé', 'El proyector irá al centro de lo que permite su óptica'], sMarca: 'Marcas', qMarca: '¿Con qué marcas quieres calcular?', ayMarca: 'Se calcula con los proyectores de las marcas encendidas. Siempre queda una.',
    noVale: (n) => 'Con ' + n + ' no se puede conseguir lo que pides.', queHago: 'QUÉ PUEDO HACER', qConsejo: 'Con este proyector no se puede', ayConsejo: (n) => n + ' no da esa imagen desde esa distancia, o la imagen pasa de su tamaño máximo.',
    cAlt: (n) => 'Usar ' + n, cAltS: (d) => 'Lo más parecido que sí puede' + (d ? ' · ' + d : ''), cOos: 'Activar fuera de especificación', cOosS: 'Imagen más grande que la que garantiza el fabricante: el enfoque en los bordes, la uniformidad y el brillo pueden ser peores. Pruébalo con la imagen real antes de instalar.',
    cAuto: 'Que elija el cálculo', cAutoS: 'El proyector y la óptica que mejor encajan', semOos: 'Fuera de especificación: el enfoque en los bordes, la uniformidad y el brillo pueden ser peores.', semOosC: 'Y con esta luz se verá apagado.', quitar: 'QUITAR', qCabe: '¿A qué distancia puedes instalar el proyector?', ayCabe: 'De la imagen al sitio más cercano y al más lejano donde lo puedes poner (si solo hay un sitio, pon lo mismo en los dos). Con eso se sabe qué óptica vale.', minimo: 'Mínimo', maximo: 'Máximo', noSeCabe: ['No lo sé', 'Donde mejor vaya'], sOpt: 'Óptica', sPdist: 'Proyector a la pared', sPdistM: 'Proyector a la fachada', vAutoC: 'automática', qOpt: '¿Qué óptica lleva el proyector?', ayOpt: 'Este proyector lleva la óptica aparte. Cada una da esta imagen desde una distancia distinta.', oAuto: ['Automática', 'La que mejor encaja'], oOptD: (a, b) => (a === b ? 'a ' + a + ' m' : 'de ' + a + ' a ' + b + ' m'), qPdist: '¿A qué distancia va el proyector?', ayPdistL: (o, a, b) => 'Con la óptica ' + o + ', para esta imagen puede estar entre ' + a + ' y ' + b + ' m.', ayPdistA: 'Pon la distancia que tengas y se elige la óptica que da esta imagen desde ahí.', noSeAuto: ['No lo sé', 'Que la elija el cálculo'], lOpt: 'óptica', kCon: 'Contraste', kConS: (lx) => 'Con ' + lx + ' lx en el sitio',
    kDis: 'A la pared', kDisF: 'A la fachada', kDisC: 'Colgado del techo', kDisA: 'Apoyado en una mesa', kBri: 'Brillo', kBriS: 'En las superficies', kRes: 'Imagen', kResS: (w, h) => w + ' × ' + h + ' px nativos',
    vSinDist: 'Sin decir · te propongo el más habitual',
    sPitch: 'Pitch', qPitch: '¿Qué pitch quieres?', ayPitch: 'La distancia entre puntos de luz, en milímetros. Sin pitch, se elige el más grande que haya en stock y encaje.', noSePitch: ['No lo sé', 'El más grande que haya en stock'],
    lReunion: ['Sala de reuniones', 'Oficina, reuniones'], lAula: ['Aula', 'Clase, formación'], lEvento: ['Sala de eventos', 'Congresos, presentaciones'], lSalon: ['Salón de casa', 'Luz de casa'], lTeatro: ['Cine en casa', 'Casi a oscuras'], luxMano: 'o escribe los lux', vMano: 'A mano',
    qAvisos: 'Lo que hay que mirar', nAvisos: (n) => '+' + n + (n === 1 ? ' AVISO' : ' AVISOS'), cUnaS: 'Una sola imagen, sin solapes', cMulti: (n) => 'Usar multiproyección · ' + n + ' proyectores', cMultiS: 'Varias imágenes unidas con blending sobre la misma pantalla', cUnaSola: ['Volver a una imagen', 'Una pantalla, un proyector'], cOosNo: ['Quitar fuera de especificación', 'Volver a lo que garantiza el fabricante'], vVert: 'en vertical', pantK: (k) => 'Pantalla ' + k,
    lSinProc: 'Sin procesador que cubra este proyecto con estas opciones: cambia el backup, la conexión o el escalador en PRO.', lSinMedia: 'Ningún mediaserver cubre este proyecto con esta marca y estas opciones.', lCerca: (a, b) => 'No hay pitch ' + a + ': se usa el más cercano, ' + b + ' mm.', lSinRes: (r) => 'Ningún pitch llega a ' + r + ' con esta medida: se usa el más fino.',
    pers: 'Persona de 1,75 m', proy: 'Proyector'
  },
  en: {
    sw: 'SIMPLE or PRO mode',
    rCabs: 'cabinets', rVis: (a, b) => 'Viewing: min. ' + a + ' · best ' + b,     pides: 'WHAT YOU ASK FOR', necesitas: 'WHAT YOU NEED', nCabs: 'Cabinets', nProc: 'LED processor', nMedia: 'Media server', nRed: 'Data cabling', nRedV: (a) => a + ' Ethernet lines + ' + a + ' backup', nLuz: 'Power', nLuzV: (k, n) => k + ' kW · ' + n + ' 16 A circuits', sim: 'SCALE SIMULATION', arrAmbos: 'DRAG THE PROJECTOR OR THE PERSON', arrProy: 'DRAG THE PROJECTOR', arrPub: 'DRAG THE PERSON', arrProyA: 'Distance from the projector to the image', arrPubA: 'Distance people watch from', res: 'RESULT', cambiar: 'Change', repetir: 'ASK THE QUESTIONS AGAIN',
    pdf: 'SEE PDF', compartir: 'SHARE', enPro: 'SEE EVERYTHING IN PRO', copiado: 'Summary copied: paste it anywhere.', noCopia: 'Could not copy.',
    calculando: 'Calculating…', cargando: 'Loading the catalogue…', sinCat: 'The catalogue could not be read. Check your connection.', reintentar: 'RETRY', vacio: 'No screens for these details: change where it goes or the size.',
    sinMotor: 'The calculation could not be loaded. Reload the page.', recargar: 'RELOAD',
    ajPro: (n) => (n === 1 ? '1 PRO setting on' : n + ' PRO settings on'), ajProT: 'There are settings made in PRO that this view does not show: that is why the result is not the automatic one.', restablecer: 'RESET',
    soloLed: 'A single LED screen is calculated on its own page.', soloVarias: 'Several separate projection screens are only calculated in PRO.', verPro: 'SEE IN PRO', unaLed: 'ONE LED SCREEN', unProy: 'ONE PROJECTION', salaEntera: 'A WHOLE ROOM',
    paso: (a, b) => 'Step ' + a + ' of ' + b, atras: '← BACK', saltar: 'SKIP', sig: 'NEXT →', listo: 'DONE', ver: 'SEE MY RESULT', seguir: 'CONTINUE →', cerrar: 'Close',
    hola: 'Hi. I will ask you a few very simple questions and tell you what you need.', q0: 'What do you want to put up?',
    o0led: ['An LED screen', 'Made of light panels: looks good in bright places and outdoors'], o0proy: ['A projector', 'Lights up a wall, a screen or a whole room'], o0no: ['I don’t know, help me', 'Two questions and I’ll tell you'],
    qCalle: 'Is it outdoors or in the sun?', qOscuro: 'Can you dim the lights in the place?', si: 'Yes', no: 'No',
    recLed: 'I recommend an LED screen', recLedCalle: 'In the sun or outdoors a projector would not be visible: LED is far brighter.', recLedLuz: 'If you can’t dim the lights, LED still looks good.',
    recProy: 'I recommend a projector', recProyT: 'With the lights down a projector looks good and, at large sizes, it is usually cheaper.',
    qDonde: 'Where will the screen be?', oIn: ['Indoors', 'A shop, a room, an office'], oOut: ['Outdoors', 'In the open air'], oEsc: ['Behind glass', 'A shop window'],
    qSol: 'Does it get direct sunlight?', oSolD: ['Yes, direct sun'], oSolI: ['Shade or some sun'], oSolN: ['I don’t know', 'Better to plan for direct sun'],
    qMar: 'Is it near the sea?', oMarSi: ['Yes, less than 1 km away'], oMarNo: ['No'],
    qUso: 'Will it stay up or is it for an event?', oFija: ['It stays fixed', 'Always in the same place'], oRental: ['We set it up and take it down', 'Events and rental'],
    qMed: 'How big is the space where it goes?', ayMed: 'Measure the space with a tape. If you are not sure, an approximate size is fine.', ancho: 'Width', alto: 'Height', fondo: 'Depth', tele: 'I don’t know the height: like a TV',
    qDist: 'How far away will people watch it from?', ayDist: 'The closer they are, the finer the light dots must be.',
    d1: ['Very close', 'Under 2 m'], d2: ['Like in a shop', '2 to 5 m'], d3: ['From afar', '5 to 10 m'], d4: ['Very far', 'Over 10 m'], metros: 'or type the metres', dNoSe: () => ['I don’t know', 'The largest pitch in stock'],
    qToca: 'Will people be able to touch it?', oTocaSi: ['Yes, at hand height'], oTocaNo: ['No, it is high up or protected'],
    qAlt: 'How high off the floor does it start?', a0: ['On the floor'], a80: ['At table height', '80 cm'], a200: ['High', '2 m'], cms: 'or type the centimetres',
    qPtipo: 'Where will you project?', pPared: ['On a wall or a screen', 'A room, an auditorium, an office'], pMap: ['On a building façade', 'At night'], pSala: ['On a whole room', 'To step inside the image'],
    qPtam: 'How big do you want the image?', ayPtam: 'Width and height of the lit area.', qSala: 'How big is the room?', paredes: 'On which walls?',
    frontal: 'Front', izquierda: 'Left', derecha: 'Right', trasera: 'Back', suelo: 'Floor',
    qLuz: 'How much light is there?', ayLuz: 'Room light makes the image look washed out.',
    l10: ['Almost dark', 'Cinema, immersive room'], l50: ['Low light', 'Auditorium, living room'], l140: ['Normal light', 'Office, meeting room'], l300: ['Bright light', 'Classroom, trade fair'],
    qPub: 'How far away are people watching?', ayPub: 'From the audience to the image, roughly.', noSe5: ['I don’t know', 'I’ll assume 5 m'],
    qMont: 'Where can the projector go?', mCol: ['Hanging from the ceiling'], mApo: ['On a table or the floor'], mAuto: ['I don’t mind', 'Wherever works best'],
    qTecho: 'How high is the ceiling?', noSe3: ['I don’t know', 'I’ll assume 3 m'],
    finT: 'Done!', finS: 'Your result is ready. Tap any detail in WHAT YOU ASK FOR to change it, or switch to PRO to see everything.',
    sDonde: 'Where', sUso: 'Use', sTam: 'Space size', sDist: 'Viewed from', sToca: 'Can be touched', sAlt: 'Height off the floor',
    vIn: 'Indoors', vOut: 'Outdoors', vEsc: 'Shop window', vSolD: 'direct sun', vSolI: 'shade', vMar: 'by the sea', vFija: 'Fixed', vRental: 'Events', vNormal: 'the usual', vSuelo: 'On the floor',
    vPared: 'Wall or screen', vMap: 'Façade', vSala: 'Whole room', sImg: 'Image', sSala: 'Room', sLuz: 'Light', sPub: 'Audience at', sMont: 'Projector', sTecho: 'Ceiling',
    vCol: 'Hanging', vApo: 'On a table', vAuto: 'Wherever works best',
    lLed: 'YOUR LED SCREEN', ajMenosW: (n) => n + ' cm narrower', ajMasW: (n) => n + ' cm wider', ajMenosH: (n) => n + ' cm shorter', ajMasH: (n) => n + ' cm taller', ajY: ' and ', ajFin: 'to use whole panels',
    semLedV: 'It fits what you asked for.',
    kCal: 'Quality', kCalS: (p, f) => 'Pitch ' + p + ' mm · ' + f, kCalF: (f) => 'Format ' + f, kNit: 'Sharp from', kNitS: (o) => 'Best: at ' + o + ' m', kElec: 'Power', kElecS: (n) => n + ' 16 A ' + (n === 1 ? 'line' : 'lines'),
    kPeso: 'Weight', kPesoS: (k) => 'Each panel: ' + k + ' kg', kCtrl: 'Control',
    lProy: 'YOUR PROJECTION', lSala: 'YOUR ROOM', proys: (n) => (n === 1 ? '1 projector' : n + ' projectors'),
    semV: 'It will look good with this light.', semA: (a) => 'It will look a bit washed out: ' + a + '.', semR: (a) => 'It will look very washed out: ' + a + '.', accLuz: 'it needs more lumens or controlled ambient light', accMas: 'make the image smaller or add a projector',
    pNoCabe: 'There is no good spot for the projector with these sizes: change the distance or check it in PRO.',
    kLum: 'Lumens', kLumS1: 'Projector brightness', kLumSn: 'Each', kOpt: (o) => o + ' lens', sCabe: 'Projector fits', vCabe: (a, b) => (a && b ? 'between ' + a + ' and ' + b + ' m' : a ? 'more than ' + a + ' m away' : 'less than ' + b + ' m away'), vCabeN: 'no distance limit', sQue: 'What', vSalaLed: 'Whole LED room', vVariasLed: 'Several LED screens', sPants: 'Screens', vPants: (n, a, b) => n + ' of ' + a + ' × ' + b + ' m', qLtipo: 'What are you setting up?',
    oLuna: ['One LED screen', 'A single one, any size you like'], oLvarias: ['Several LED screens', 'Up to 4, side by side'], oLsala: ['A whole LED room', 'The walls of the room, to step inside the image'],
    qPants: 'How many screens and what size?', ayPants: 'Up to 4, each with its own size. All use the same cabinet.', cuantas: 'How many', qDondeV: 'Where will the screens be?', qUsoV: 'Are they staying up or are they for an event?',
    lSalaLed: 'YOUR LED ROOM', lPantsLed: 'YOUR LED SCREENS', cabs: (n) => n + ' cabinets', kLienzo: (w, h) => w + ' × ' + h + ' px', kCabs: 'Cabinets', kCabsS: (a, b) => a + ' × ' + b + ' mm each', ajCab: (a, b) => 'you asked for ' + a + ' × ' + b + ' m: it adjusts to whole cabinets', vCabeE: (a) => 'at ' + a + ' m', vPubNS: 'not known', noSePub: ['I don’t know', 'The projector will go at the middle of what its lens allows'], sMarca: 'Brands', qMarca: 'Which brands do you want to calculate with?', ayMarca: 'The calculation uses the projectors of the brands that are on. One always stays on.',
    noVale: (n) => 'With ' + n + ' you cannot get what you are asking for.', queHago: 'WHAT CAN I DO', qConsejo: 'This projector cannot do it', ayConsejo: (n) => n + ' cannot give that image from that distance, or the image exceeds its maximum size.',
    cAlt: (n) => 'Use ' + n, cAltS: (d) => 'The closest one that can' + (d ? ' · ' + d : ''), cOos: 'Turn on out of specification', cOosS: 'An image larger than the manufacturer guarantees: edge focus, uniformity and brightness may be worse. Test it with the real image before installing.',
    cAuto: 'Let the calculation choose', cAutoS: 'The projector and lens that fit best', semOos: 'Out of specification: edge focus, uniformity and brightness may be worse.', semOosC: 'And with this light it will look dull.', quitar: 'REMOVE', qCabe: 'How far away can you install the projector?', ayCabe: 'From the image to the nearest and the farthest place where you can put it (if there is only one place, enter the same in both). That tells which lens works.', minimo: 'Minimum', maximo: 'Maximum', noSeCabe: ['I don’t know', 'Wherever works best'], sOpt: 'Lens', sPdist: 'Projector to wall', sPdistM: 'Projector to façade', vAutoC: 'automatic', qOpt: 'Which lens does the projector use?', ayOpt: 'This projector takes a separate lens. Each one gives this image from a different distance.', oAuto: ['Automatic', 'The best fit'], oOptD: (a, b) => (a === b ? 'at ' + a + ' m' : 'from ' + a + ' to ' + b + ' m'), qPdist: 'How far away is the projector?', ayPdistL: (o, a, b) => 'With the ' + o + ' lens, for this image it can be between ' + a + ' and ' + b + ' m away.', ayPdistA: 'Enter the distance you have and the lens that gives this image from there is chosen.', noSeAuto: ['I don’t know', 'Let the calculation choose'], lOpt: 'lens', kCon: 'Contrast', kConS: (lx) => 'With ' + lx + ' lx in the place',
    kDis: 'To the wall', kDisF: 'To the façade', kDisC: 'Ceiling mounted', kDisA: 'On a table', kBri: 'Brightness', kBriS: 'On the surfaces', kRes: 'Image', kResS: (w, h) => w + ' × ' + h + ' px native',
    vSinDist: 'Not given · I suggest the usual one',
    sPitch: 'Pitch', qPitch: 'Which pitch do you want?', ayPitch: 'The distance between the light dots, in millimetres. Without a pitch, the largest one in stock that fits is chosen.', noSePitch: ['I don’t know', 'The largest one in stock'],
    lReunion: ['Meeting room', 'Office, meetings'], lAula: ['Classroom', 'Lessons, training'], lEvento: ['Event hall', 'Conferences, presentations'], lSalon: ['Living room', 'Home lighting'], lTeatro: ['Home theatre', 'Almost dark'], luxMano: 'or type the lux', vMano: 'Custom',
    qAvisos: 'What needs checking', nAvisos: (n) => '+' + n + (n === 1 ? ' WARNING' : ' WARNINGS'), cUnaS: 'A single image, no overlap', cMulti: (n) => 'Use multi-projection · ' + n + ' projectors', cMultiS: 'Several images joined with blending on the same screen', cUnaSola: ['Back to one image', 'One screen, one projector'], cOosNo: ['Turn off out of specification', 'Back to what the manufacturer guarantees'], vVert: 'portrait', pantK: (k) => 'Screen ' + k,
    lSinProc: 'No processor covers this project with these options: change the backup, the connection or the scaler in PRO.', lSinMedia: 'No media server covers this project with this brand and these options.', lCerca: (a, b) => 'There is no ' + a + ' pitch: the nearest one is used, ' + b + ' mm.', lSinRes: (r) => 'No pitch reaches ' + r + ' at this size: the finest one is used.',
    pers: '1.75 m person', proy: 'Projector'
  },
  ca: {
    sw: 'Mode SIMPLE o PRO',
    rCabs: 'cabinets', rVis: (a, b) => 'Visionat: mín. ' + a + ' · òpt. ' + b,     pides: 'EL QUE DEMANES', necesitas: 'EL QUE NECESSITES', nCabs: 'Cabinets', nProc: 'Processador LED', nMedia: 'Mediaserver', nRed: 'Cablejat de dades', nRedV: (a) => a + ' línies Ethernet + ' + a + ' de backup', nLuz: 'Electricitat', nLuzV: (k, n) => k + ' kW · ' + n + ' línies de 16 A', sim: 'SIMULACIÓ A ESCALA', arrAmbos: 'ARROSSEGA EL PROJECTOR O LA PERSONA', arrProy: 'ARROSSEGA EL PROJECTOR', arrPub: 'ARROSSEGA LA PERSONA', arrProyA: 'Distància del projector a la imatge', arrPubA: 'Distància des d’on mira la gent', res: 'RESULTAT', cambiar: 'Canvia', repetir: 'TORNA A FER LES PREGUNTES',
    pdf: 'VEURE PDF', compartir: 'COMPARTEIX', enPro: 'VEURE-HO TOT EN PRO', copiado: 'Resum copiat: enganxa’l on vulguis.', noCopia: 'No s’ha pogut copiar.',
    calculando: 'Calculant…', cargando: 'Carregant el catàleg…', sinCat: 'No s’ha pogut llegir el catàleg. Revisa la connexió.', reintentar: 'TORNA-HO A PROVAR', vacio: 'No hi ha pantalles per a aquestes dades: canvia on va o la mida.',
    sinMotor: 'No s’ha pogut carregar el càlcul. Torna a carregar la pàgina.', recargar: 'TORNA A CARREGAR',
    ajPro: (n) => (n === 1 ? '1 ajust de PRO actiu' : n + ' ajustos de PRO actius'), ajProT: 'Hi ha ajustos fets en PRO que aquesta vista no mostra: per això el resultat no és l’automàtic.', restablecer: 'RESTABLEIX',
    soloLed: 'Una sola pantalla LED es calcula a la seva pròpia pàgina.', soloVarias: 'Diverses pantalles de projecció per separat només es calculen en PRO.', verPro: 'VEURE EN PRO', unaLed: 'UNA PANTALLA LED', unProy: 'UNA PROJECCIÓ', salaEntera: 'UNA SALA SENCERA',
    paso: (a, b) => 'Pas ' + a + ' de ' + b, atras: '← ENRERE', saltar: 'SALTA', sig: 'SEGÜENT →', listo: 'FET', ver: 'VEURE EL MEU RESULTAT', seguir: 'CONTINUA →', cerrar: 'Tanca',
    hola: 'Hola. Et faig unes preguntes molt senzilles i et dic què necessites.', q0: 'Què vols posar?',
    o0led: ['Una pantalla LED', 'Feta de peces de llum: es veu bé amb llum i al carrer'], o0proy: ['Un projector', 'Il·lumina una paret, una pantalla o una sala sencera'], o0no: ['No ho sé, ajuda’m', 'Et faig dues preguntes i t’ho dic'],
    qCalle: 'Va al carrer o hi toca el sol?', qOscuro: 'Pots abaixar els llums del lloc?', si: 'Sí', no: 'No',
    recLed: 'Et recomano una pantalla LED', recLedCalle: 'Amb sol o al carrer, un projector no es veuria: el LED fa molta més llum.', recLedLuz: 'Si no pots abaixar la llum, el LED es continua veient bé.',
    recProy: 'Et recomano un projector', recProyT: 'Amb la llum baixa, un projector es veu bé i, en mides grans, sol sortir més barat.',
    qDonde: 'On serà la pantalla?', oIn: ['Dins d’un local', 'Una botiga, una sala, una oficina'], oOut: ['Al carrer', 'A l’aire lliure'], oEsc: ['Darrere d’un vidre', 'Un aparador'],
    qSol: 'Hi toca el sol de ple?', oSolD: ['Sí, sol directe'], oSolI: ['Ombra o sol a estones'], oSolN: ['No ho sé', 'Millor comptar amb sol directe'],
    qMar: 'És a prop del mar?', oMarSi: ['Sí, a menys d’1 km'], oMarNo: ['No'],
    qUso: 'Es queda posada o és per a un esdeveniment?', oFija: ['Es queda fixa', 'Sempre al mateix lloc'], oRental: ['La muntem i desmuntem', 'Esdeveniments i lloguer'],
    qMed: 'Quant fa el lloc on va?', ayMed: 'Mesura el lloc amb un metre. Si no ho saps exacte, posa una mida aproximada.', ancho: 'Amplada', alto: 'Alçada', fondo: 'Fondària', tele: 'No sé l’alçada: com una tele',
    qDist: 'Des de quina distància la mirarà la gent?', ayDist: 'Com més a prop, més fins han de ser els punts de llum.',
    d1: ['Molt a prop', 'Menys de 2 m'], d2: ['Com en una botiga', 'De 2 a 5 m'], d3: ['Des de lluny', 'De 5 a 10 m'], d4: ['Molt lluny', 'Més de 10 m'], metros: 'o escriu els metres', dNoSe: () => ['No ho sé', 'El pitch més gran que hi hagi en estoc'],
    qToca: 'La gent la podrà tocar?', oTocaSi: ['Sí, a l’alçada de la mà'], oTocaNo: ['No, és alta o protegida'],
    qAlt: 'A quina alçada de terra comença?', a0: ['A terra'], a80: ['A l’alçada d’una taula', '80 cm'], a200: ['Alta', '2 m'], cms: 'o escriu els centímetres',
    qPtipo: 'On projectaràs?', pPared: ['En una paret o una pantalla', 'Una sala, un auditori, una oficina'], pMap: ['A la façana d’un edifici', 'De nit'], pSala: ['En tota una sala', 'Per ficar-se dins de la imatge'],
    qPtam: 'De quina mida vols la imatge?', ayPtam: 'Amplada i alçada del que s’il·lumina.', qSala: 'Quant fa la sala?', paredes: 'A quines parets?',
    frontal: 'Frontal', izquierda: 'Esquerra', derecha: 'Dreta', trasera: 'Posterior', suelo: 'Terra',
    qLuz: 'Quanta llum hi ha al lloc?', ayLuz: 'La llum del lloc fa que la imatge es vegi més rentada.',
    l10: ['Gairebé a les fosques', 'Cinema, sala immersiva'], l50: ['Llum baixa', 'Auditori, saló'], l140: ['Llum normal', 'Oficina, sala de reunions'], l300: ['Molta llum', 'Aula, fira'],
    qPub: 'A quina distància mira la gent?', ayPub: 'De la gent a la imatge, més o menys.', noSe5: ['No ho sé', 'Compto 5 m'],
    qMont: 'On pot anar el projector?', mCol: ['Penjat del sostre'], mApo: ['Sobre una taula o a terra'], mAuto: ['M’és igual', 'On vagi millor'],
    qTecho: 'Quina alçada té el sostre?', noSe3: ['No ho sé', 'Compto 3 m'],
    finT: 'Fet!', finS: 'Ja tens el resultat. Toca qualsevol dada d’EL QUE DEMANES per canviar-la, o passa a PRO per veure-ho tot.',
    sDonde: 'On', sUso: 'Ús', sTam: 'Mida del lloc', sDist: 'Es mira des de', sToca: 'Es pot tocar', sAlt: 'Alçada de terra',
    vIn: 'Dins', vOut: 'Al carrer', vEsc: 'Aparador', vSolD: 'sol directe', vSolI: 'ombra', vMar: 'a prop del mar', vFija: 'Fixa', vRental: 'Esdeveniments', vNormal: 'el normal', vSuelo: 'A terra',
    vPared: 'Paret o pantalla', vMap: 'Façana', vSala: 'Sala sencera', sImg: 'Imatge', sSala: 'Sala', sLuz: 'Llum', sPub: 'La gent mira des de', sMont: 'Projector', sTecho: 'Sostre',
    vCol: 'Penjat', vApo: 'Recolzat', vAuto: 'On vagi millor',
    lLed: 'LA TEVA PANTALLA LED', ajMenosW: (n) => n + ' cm menys d’amplada', ajMasW: (n) => n + ' cm més d’amplada', ajMenosH: (n) => n + ' cm menys d’alçada', ajMasH: (n) => n + ' cm més d’alçada', ajY: ' i ', ajFin: 'per fer servir peces senceres',
    semLedV: 'Encaixa amb el que has demanat.',
    kCal: 'Qualitat', kCalS: (p, f) => 'Pitch ' + p + ' mm · ' + f, kCalF: (f) => 'Format ' + f, kNit: 'Nítida des de', kNitS: (o) => 'L’ideal: a ' + o + ' m', kElec: 'Electricitat', kElecS: (n) => n + (n === 1 ? ' línia' : ' línies') + ' de 16 A',
    kPeso: 'Pes', kPesoS: (k) => 'Cada peça: ' + k + ' kg', kCtrl: 'Control',
    lProy: 'LA TEVA PROJECCIÓ', lSala: 'LA TEVA SALA', proys: (n) => (n === 1 ? '1 projector' : n + ' projectors'),
    semV: 'Es veurà bé amb aquesta llum.', semA: (a) => 'Es veurà una mica rentada: ' + a + '.', semR: (a) => 'Es veurà molt rentada: ' + a + '.', accLuz: 'calen més lúmens o controlar la llum ambient', accMas: 'fes la imatge més petita o afegeix un projector',
    pNoCabe: 'No hi ha un bon lloc per al projector amb aquestes mides: canvia la distància o mira-ho en PRO.',
    kLum: 'Lúmens', kLumS1: 'Brillantor del projector', kLumSn: 'Cada un', kOpt: (o) => 'Òptica ' + o, sCabe: 'El projector hi cap', vCabe: (a, b) => (a && b ? 'entre ' + a + ' i ' + b + ' m' : a ? 'a més de ' + a + ' m' : 'a menys de ' + b + ' m'), vCabeN: 'sense límit de distància', sQue: 'Què', vSalaLed: 'Sala LED sencera', vVariasLed: 'Diverses pantalles LED', sPants: 'Pantalles', vPants: (n, a, b) => n + ' de ' + a + ' × ' + b + ' m', qLtipo: 'Què vols muntar?',
    oLuna: ['Una pantalla LED', 'Una de sola, de la mida que vulguis'], oLvarias: ['Diverses pantalles LED', 'Fins a 4, una al costat de l’altra'], oLsala: ['Una sala LED sencera', 'Les parets de la sala, per ficar-se dins de la imatge'],
    qPants: 'Quantes pantalles i de quina mida?', ayPants: 'Fins a 4, cadascuna amb la seva mida. Totes porten el mateix cabinet.', cuantas: 'Quantes', qDondeV: 'On estaran les pantalles?', qUsoV: 'Es queden posades o són per a un esdeveniment?',
    lSalaLed: 'LA TEVA SALA LED', lPantsLed: 'LES TEVES PANTALLES LED', cabs: (n) => n + ' cabinets', kLienzo: (w, h) => w + ' × ' + h + ' px', kCabs: 'Cabinets', kCabsS: (a, b) => 'De ' + a + ' × ' + b + ' mm', ajCab: (a, b) => 'demanaves ' + a + ' × ' + b + ' m: s’ajusta a cabinets sencers', vCabeE: (a) => 'a ' + a + ' m', vPubNS: 'no se sap', noSePub: ['No ho sé', 'El projector anirà al centre del que permet la seva òptica'], sMarca: 'Marques', qMarca: 'Amb quines marques vols calcular?', ayMarca: 'Es calcula amb els projectors de les marques enceses. Sempre en queda una.',
    noVale: (n) => 'Amb ' + n + ' no es pot aconseguir el que demanes.', queHago: 'QUÈ PUC FER', qConsejo: 'Amb aquest projector no es pot', ayConsejo: (n) => n + ' no dona aquesta imatge des d’aquesta distància, o la imatge passa de la seva mida màxima.',
    cAlt: (n) => 'Fer servir ' + n, cAltS: (d) => 'El més semblant que sí que pot' + (d ? ' · ' + d : ''), cOos: 'Activar fora d’especificació', cOosS: 'Imatge més gran que la que garanteix el fabricant: l’enfocament a les vores, la uniformitat i la brillantor poden ser pitjors. Prova-ho amb la imatge real abans d’instal·lar.',
    cAuto: 'Que triï el càlcul', cAutoS: 'El projector i l’òptica que encaixen millor', semOos: 'Fora d’especificació: l’enfocament a les vores, la uniformitat i la brillantor poden ser pitjors.', semOosC: 'I amb aquesta llum es veurà apagat.', quitar: 'TREURE', qCabe: 'A quina distància pots instal·lar el projector?', ayCabe: 'De la imatge al lloc més proper i al més llunyà on el pots posar (si només hi ha un lloc, posa el mateix als dos). Amb això se sap quina òptica val.', minimo: 'Mínim', maximo: 'Màxim', noSeCabe: ['No ho sé', 'On vagi millor'], sOpt: 'Òptica', sPdist: 'Projector a la paret', sPdistM: 'Projector a la façana', vAutoC: 'automàtica', qOpt: 'Quina òptica porta el projector?', ayOpt: 'Aquest projector porta l’òptica a part. Cadascuna dona aquesta imatge des d’una distància diferent.', oAuto: ['Automàtica', 'La que encaixa millor'], oOptD: (a, b) => (a === b ? 'a ' + a + ' m' : 'de ' + a + ' a ' + b + ' m'), qPdist: 'A quina distància va el projector?', ayPdistL: (o, a, b) => 'Amb l’òptica ' + o + ', per a aquesta imatge pot estar entre ' + a + ' i ' + b + ' m.', ayPdistA: 'Posa la distància que tinguis i es tria l’òptica que dona aquesta imatge des d’allà.', noSeAuto: ['No ho sé', 'Que la triï el càlcul'], lOpt: 'òptica', kCon: 'Contrast', kConS: (lx) => 'Amb ' + lx + ' lx al lloc',
    kDis: 'A la paret', kDisF: 'A la façana', kDisC: 'Penjat del sostre', kDisA: 'Recolzat en una taula', kBri: 'Brillantor', kBriS: 'A les superfícies', kRes: 'Imatge', kResS: (w, h) => w + ' × ' + h + ' px natius',
    vSinDist: 'Sense dir · et proposo el més habitual',
    sPitch: 'Pitch', qPitch: 'Quin pitch vols?', ayPitch: 'La distància entre punts de llum, en mil·límetres. Sense pitch, es tria el més gran que hi hagi en estoc i encaixi.', noSePitch: ['No ho sé', 'El més gran que hi hagi en estoc'],
    lReunion: ['Sala de reunions', 'Oficina, reunions'], lAula: ['Aula', 'Classe, formació'], lEvento: ['Sala d’esdeveniments', 'Congressos, presentacions'], lSalon: ['Saló de casa', 'Llum de casa'], lTeatro: ['Cinema a casa', 'Gairebé a les fosques'], luxMano: 'o escriu els lux', vMano: 'A mà',
    qAvisos: 'El que cal mirar', nAvisos: (n) => '+' + n + (n === 1 ? ' AVÍS' : ' AVISOS'), cUnaS: 'Una sola imatge, sense solapaments', cMulti: (n) => 'Fer servir multiprojecció · ' + n + ' projectors', cMultiS: 'Diverses imatges unides amb blending sobre la mateixa pantalla', cUnaSola: ['Tornar a una imatge', 'Una pantalla, un projector'], cOosNo: ['Treure fora d’especificació', 'Tornar al que garanteix el fabricant'], vVert: 'en vertical', pantK: (k) => 'Pantalla ' + k,
    lSinProc: 'Sense processador que cobreixi aquest projecte amb aquestes opcions: canvia el backup, la connexió o l’escalador en PRO.', lSinMedia: 'Cap mediaserver cobreix aquest projecte amb aquesta marca i aquestes opcions.', lCerca: (a, b) => 'No hi ha pitch ' + a + ': es fa servir el més proper, ' + b + ' mm.', lSinRes: (r) => 'Cap pitch arriba a ' + r + ' amb aquesta mida: es fa servir el més fi.',
    pers: 'Persona d’1,75 m', proy: 'Projector'
  }
};
const LG = () => { const l = String(document.documentElement.lang || 'es').slice(0, 2).toLowerCase(); return T[l] ? l : 'es'; };
const t = (k) => T[LG()][k];
const fmt = (n, d = 0, m) => { const v = Number(n); if (!isFinite(v)) return '—'; return v.toLocaleString(LG() === 'en' ? 'en-GB' : LG() === 'ca' ? 'ca-ES' : 'es-ES', { minimumFractionDigits: m == null ? d : m, maximumFractionDigits: d, useGrouping: Math.abs(v) >= 10000 }); };
const fm = (n) => fmt(n, 2, 0);   /* medidas: hasta dos decimales, sin ceros de sobra */

/* ---------- iconos (trazo, 24 × 24) ---------- */
const P = {
  led: '<rect x="3" y="4" width="18" height="13" rx="1"/><path d="M7.5 4v13M12 4v13M16.5 4v13M3 8.3h18M3 12.6h18M9 21h6M12 17v4"/>',
  proy: '<rect x="2" y="8" width="13" height="9" rx="2"/><circle cx="8.5" cy="12.5" r="2.5"/><path d="M15 10.5l7-3.5v11l-7-3.5"/>',
  duda: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.7.3-1 .9-1 1.6v.6M12 17h.01"/>',
  casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  calle: '<circle cx="17.5" cy="6" r="2.6"/><path d="M7 21v-6"/><path d="M7 15c-2.8 0-4-1.9-4-4 0-3 2-6 4-6s4 3 4 6c0 2.1-1.2 4-4 4z"/><path d="M2 21h20"/>',
  escaparate: '<path d="M3 21V9h18v12"/><path d="M2 9l2-5h16l2 5"/><rect x="6" y="12" width="12" height="6"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  sombra: '<path d="M7 19h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.5A3.3 3.3 0 0 0 7 19z"/><path d="M15 3.5v1.3M19.6 5.4l-.9.9"/>',
  mar: '<path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  nada: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  pin: '<path d="M12 21v-7"/><path d="M8 3h8l-1 5 3 3H6l3-3z"/>',
  camion: '<rect x="1.5" y="6" width="12.5" height="10.5" rx="1"/><path d="M14 9.5h4l3.5 3.5v3.5H14"/><circle cx="6" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
  tele: '<rect x="2" y="5" width="20" height="12" rx="1"/><path d="M8 21h8M12 17v4"/>',
  mano: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V6a1.5 1.5 0 0 1 3 0v7c0 4.2-2.6 8-6.4 8-2.5 0-4-1.4-5.4-3.8L3.7 13.6a1.5 1.5 0 0 1 2.6-1.5L8 14"/>',
  escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  pared: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M2 21h20M7 16v5M17 16v5"/>',
  edificio: '<path d="M4 21V6l8-3 8 3v15"/><path d="M9.5 21v-5h5v5M8 8.5h2M14 8.5h2M8 12.5h2M14 12.5h2"/><path d="M2 21h20"/>',
  cubo: '<path d="M3 7.5l9-4.5 9 4.5v9l-9 4.5-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
  luna: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  media: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  bombilla: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  techo: '<path d="M3 3h18M12 3v4"/><rect x="6.5" y="7" width="11" height="6.5" rx="1.5"/><circle cx="12" cy="10.2" r="1.6"/><path d="M8 20l4-4 4 4"/>',
  mesa: '<rect x="6.5" y="5" width="11" height="6.5" rx="1.5"/><circle cx="12" cy="8.2" r="1.6"/><path d="M3 14h18M5 14v7M19 14v7"/>',
  chispa: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  lapiz: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  pdf: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  compartir: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.9l7.6-3.8M8.2 13.1l7.6 3.8"/>',
  pro: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  varita: '<path d="M4 20L15 9"/><path d="M15 3.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/><path d="M19.5 10.5l.6 1.3 1.4.7-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.7z"/>',
  regla: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  fabrica: '<path fill="currentColor" stroke="none" d="M2,22V9.98L9,7V9l5-2v3h8V22H2Zm2-2H20V12H12V9.95l-5,2V10L4,11.33V20Zm7-2h2V14H11v4ZM7,18H9V14H7v4Zm8,0h2V14H15v4Zm7-8H17l1-8h3l1,8ZM4,20H7h5h8H4Z"/>',   /* v10.59 · las marcas llevan la fábrica, no el proyector */
  ojo: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  altura: '<path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/>',
  persona: '<circle cx="12" cy="6" r="3"/><path d="M6 21v-5a6 6 0 0 1 12 0v5"/>',
  sim: '<path fill="currentColor" stroke="none" d="M8,17V16.43q0-1.1 1.1-1.76T12,14t2.9,0.66T16,16.43V17H8Zm2.59-4.59Q10,11.83 10,11q0-0.83 0.59-1.41T12,9t1.41,0.59T14,11t-0.59,1.41T12,13t-1.41-0.59ZM3,9.2v7.65q0.35,0.32 0.85,0.56T5,17.77V9.85Q4.45,9.73 3.94,9.56T3,9.2ZM21,9.17q-0.42,0.2-0.92,0.36T19,9.82v7.95q0.65-0.13 1.15-0.36T21,16.85V9.17ZM7,20.15Q4.13,19.8 2.56,18.98T1,17V7Q1,5.57 3.84,4.8T12,4.02T20.16,4.8T23,7V17q0,1.15-1.56,1.98T17,20.15v-12q1.28-0.2 2.26-0.49q0.99-0.29 1.41-0.56Q19.6,6.68 17,6.34T12,6T7,6.34Q4.4,6.68 3.33,7.1Q3.75,7.4 4.74,7.68T7,8.15v12ZM3,9.2v8.57q0-0.13 0-0.36t0-0.56V9.2ZM21,9.17v7.68q0,0.32 0,0.56t0,0.36V9.17Z"/>',   /* v10.55 · el icono de simulación de Josep, relleno */
  res: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  lista: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.3"/><circle cx="4.5" cy="12" r="1.3"/><circle cx="4.5" cy="18" r="1.3"/>',
  calidad: '<rect x="2.5" y="4" width="19" height="13" rx="1.5"/><path d="M7 10.5h2.4M7 8v5M12 8v5h2a2.5 2.5 0 0 0 0-5z"/><path d="M9 21h6M12 17v4"/>',
  rayo: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  peso: '<path d="M6.5 8h11l2.5 13H4z"/><circle cx="12" cy="5.2" r="2.2"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><rect x="9.5" y="9.5" width="5" height="5"/>',
  contraste: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  dist: '<path d="M2 12h20M5 8l-3 4 3 4M19 8l3 4-3 4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  alerta: '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 10v4.5"/><path d="M12 17.4v.2"/>',
  ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  red: '<rect x="4" y="9" width="16" height="10" rx="1"/><path d="M8 9V6h8v3M9 13v2M12 13v2M15 13v2"/>'
};
const ic = (k, c) => `<svg class="ss-ic${c ? ' ' + c : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k] || ''}</svg>`;

/* ---------- motor: la portada (LED) o la consola (proyección) ---------- */
const B = () => window.__blocks, C = () => window.__consola;
const listo = () => (PAG === 'portada' ? !!B() : !!C());
const ED = () => (PAG === 'portada' ? B().E : C().E);
let tRe = 0;
const recalc = () => { if (PAG === 'portada') B().todo(); else { clearTimeout(tRe); tRe = setTimeout(() => C().actualizar(), 0); } };
const distDef = () => (ED().tipo === 'OUTDOOR' ? 8 : 3);
/* en la consola, qué se puede enseñar en SIMPLE: una proyección (pared o fachada) o una sala entera de proyección */
/* v10.55 · también varias pantallas LED iguales y la sala LED entera (una sola pantalla LED se calcula en la portada) */
const modoCons = () => { const E = C().E; if (E.tecnologia === 'led') return E.cantidad === 'varias' ? (E.esp.tipo === 'sala' ? 'salaLed' : 'variasLed') : 'led'; if (E.cantidad === 'varias') return E.esp.tipo === 'sala' ? 'sala' : 'varias'; return E.proy.tipo === 'mapping' ? 'mapping' : 'pared'; };
const esLedC = () => PAG === 'consola' && /Led$/.test(modoCons());
/* v10.63 · los escalones de luz (los mismos que PRO): [clave, lux, texto, icono] */
const LUCES = [['reunion', 140, 'lReunion', 'bombilla'], ['aula', 210, 'lAula', 'sol'], ['evento', 140, 'lEvento', 'media'], ['salon', 70, 'lSalon', 'casa'], ['teatro', 14, 'lTeatro', 'luna']];
const luzDe = (E) => LUCES.find((x) => x[0] === E.proy.luzUso && x[1] === Number(E.proy.lux));
/* v10.63 · medidas de cada pantalla LED (hasta 4) */
const tamsDe = (q) => { const n = Math.max(1, Math.min(4, q.n | 0)), g = Array.isArray(q.tams) ? q.tams : []; return Array.from({ length: n }, (_, i) => { const x = g[i] || []; return [+x[0] > 0 ? +x[0] : q.ancho, +x[1] > 0 ? +x[1] : q.alto]; }); };
const tamsTxt = (L) => (L.every((x) => Math.abs(x[0] - L[0][0]) < .005 && Math.abs(x[1] - L[0][1]) < .005) ? null : L.map((x) => fm(x[0]) + ' × ' + fm(x[1])).join(' + ') + ' m');
const PAREDES = ['frontal', 'izquierda', 'derecha', 'trasera', 'suelo'];

/* ajustes que solo se tocan en PRO: si alguno no es el de fábrica, el resultado no es el automático */
const AJ_LED = ['backup', 'escalador', 'conexion', 'marca', 'cosido', 'transp', 'nitsMin', 'resMin', 'giro', 'crm', 'ajuste', 'procSel', 'mediaSel', 'dante', 'entradas', 'tipoEntrada', 'resEntrada'];
const AJ_PROY_T = ['cuerpo', 'optica', 'idSuelo', 'solape', 'ganancia', 'orient', 'altura', 'oos'];
/* v10.53 · la óptica y la distancia del proyector se eligen también en SIMPLE: no cuentan como ajuste de PRO */
const AJ_PROY = ['idSuelo', 'solape', 'ganancia', 'orient', 'altura'];
const proyC = () => { const c = C().c; return c && c.proyector && c.filas && c.filas.length ? c : null; };
const paredF = () => { const c = proyC(); return c ? (c.filas.find((x) => x.s.tipo !== 'suelo') || c.filas[0]) : null; };
const lentes = () => { const c = proyC(); return c ? PROYECTORES.filter((q) => q.modelo === c.proyector.modelo && q.optica) : []; };
const trTxt = (q) => (q.trMax - q.trMin > .005 ? fmt(q.trMin, 2) + '–' + fmt(q.trMax, 2) : fmt(q.trMin, 2)) + ':1';
/* ancho nativo de la imagen de cada proyector con la óptica de ahora: con él, la distancia que da cada óptica es su relación × ese ancho */
const anchoNat = () => { const c = proyC(), f = paredF(); return c && f && f.p && f.p.tMin > 0 && c.proyector.trMin > 0 ? f.p.tMin / c.proyector.trMin : 0; };
const AJ_ELEC = ['proyEq', 'sel', 'selMedia', 'selBlend', 'marca', 'dante'];
const AJ_LEDC = ['crm', 'ajuste', 'transp', 'gold', 'protegido', 'sol', 'nitsMin'];   /* el LED de la consola: lo que solo se toca en PRO */
function ajustesPro() {
  if (!listo()) return 0;
  if (PAG === 'portada') { const E = B().E, D = B().DEF; return AJ_LED.filter((k) => JSON.stringify(E[k]) !== JSON.stringify(D[k])).length; }
  const E = C().E, D = C().DEF();
  if (esLedC()) return AJ_LEDC.filter((k) => JSON.stringify(E.led[k]) !== JSON.stringify(D.led[k])).length + AJ_ELEC.filter((k) => k !== 'proyEq' && k !== 'selBlend' && JSON.stringify(E.elec[k]) !== JSON.stringify(D.elec[k])).length + ((E.esp.obst || []).length ? 1 : 0);
  return AJ_PROY.filter((k) => JSON.stringify(E.proy[k]) !== JSON.stringify(D.proy[k])).length + AJ_ELEC.filter((k) => JSON.stringify(E.elec[k]) !== JSON.stringify(D.elec[k])).length + ((E.esp.obst || []).length ? 1 : 0);
}
function restablecePro() {
  if (PAG === 'portada') { const E = B().E, D = B().DEF; AJ_LED.forEach((k) => { E[k] = D[k]; }); B().todo(); return; }
  const E = C().E, D = C().DEF();
  if (esLedC()) { AJ_LEDC.forEach((k) => { E.led[k] = D.led[k]; }); AJ_ELEC.forEach((k) => { E.elec[k] = D.elec[k]; }); E.esp.obst = []; E.esp.sueltas.central = false; C().actualizar(); return; }
  AJ_PROY_T.forEach((k) => { E.proy[k] = D.proy[k]; }); AJ_ELEC.forEach((k) => { E.elec[k] = D.elec[k]; }); E.esp.obst = []; C().actualizar();
}

/* ---------- el cuerpo SIMPLE (en el sitio de la rejilla de PRO) y la raíz del asistente ----------
   La portada lo pone detrás de #rejilla, dentro de la plantilla de PRO (su fila del medio). La consola, detrás de #app (en el cuerpo escalado
   a 1920 de ancho en escritorio); el asistente y los avisos van fuera de esa escala, en <html>, como las ventanas de la consola. */
let cuerpo = null, raiz = null, montado = '', W = null, tPinta = 0, primera = true, FALLO = false;
function cuerpoNuevo() {
  if (cuerpo && cuerpo.isConnected) return cuerpo;
  const ref = document.getElementById(PAG === 'portada' ? 'rejilla' : 'app');
  /* sin la plantilla de PRO (el cálculo no ha llegado a cargar), el aviso va solo en la página, para poder volver a cargarla */
  if (!ref && !(FALLO && document.body)) return null;
  if (!cuerpo) { cuerpo = document.createElement('main'); cuerpo.id = 'simple'; cuerpo.className = 'ss ss-cuerpo'; cuerpo.setAttribute('aria-label', 'SCREENS SIMPLE'); cuerpo.addEventListener('click', clic); cuerpo.addEventListener('keydown', tecla);
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture'].forEach((k, i) => cuerpo.addEventListener(k, [arrIni, arrMueve, arrFin, arrFin, arrFin][i]));
    cuerpo.addEventListener('touchmove', (e) => { if (ARR && ARR.mov) e.preventDefault(); }, { passive: false }); }   /* v10.56 · arrastrar en el dibujo */
  cuerpo.hidden = vista !== 'simple'; if (ref) ref.insertAdjacentElement('afterend', cuerpo); else { cuerpo.classList.add('ss-solo'); document.body.appendChild(cuerpo); } montado = '';
  return cuerpo;
}
function raizNueva() {
  if (raiz) return raiz;
  raiz = document.createElement('div'); raiz.id = 'ss-raiz'; raiz.className = 'ss ss-raiz'; raiz.setAttribute('data-crudo', ''); raiz.innerHTML = '<div id="ss-asis"></div>';
  (PAG === 'consola' ? document.documentElement : document.body).appendChild(raiz);
  raiz.addEventListener('click', clic); raiz.addEventListener('keydown', tecla); raiz.addEventListener('input', entrada);
  return raiz;
}
const sw = () => { const pro = vista === 'pro'; return `<button type="button" class="ss-bur${pro ? ' pro' : ''}" data-ss-sw="${pro ? 'simple' : 'pro'}" aria-label="${esc(t('sw'))}" title="${esc(t('sw'))}"><i></i>${pro ? 'PRO' : 'SIMPLE'}</button><div class="ss-sw" role="group" aria-label="${esc(t('sw'))}" title="${esc(t('sw'))}" data-crudo><button type="button" class="ss-sw-e${pro ? '' : ' on'}" data-ss-sw="simple" aria-pressed="${!pro}">SIMPLE</button><label class="ss-sw-t"><input type="checkbox" data-ss-swc aria-label="PRO"${pro ? ' checked' : ''}><span class="ss-sw-p"><span class="ss-sw-b"></span></span></label><button type="button" class="ss-sw-e${pro ? ' on' : ''}" data-ss-sw="pro" aria-pressed="${pro}">PRO</button></div>`; };
function monta() {
  montado = LG();
  cuerpo.innerHTML = '<section class="ss-blk ss-resumen" id="ss-resumen" aria-live="polite"></section><section class="ss-blk ss-sim" id="ss-sim"></section><section class="ss-blk ss-res" id="ss-res" aria-live="polite"></section>';
}
const cab = (k, txt, extra) => `<h2 class="ss-tit" data-crudo>${ic(k)}<span class="ss-fit">${esc(txt)}</span>${extra || ''}</h2>`;
const espera = () => (FALLO ? `<p class="ss-msg" data-crudo>${esc(t('sinMotor'))}</p><button type="button" class="ss-mini ss-grande" data-ss="recarga">${esc(t('recargar'))}</button>` : `<p class="ss-espera" data-crudo>${esc(t('calculando'))}</p>`);

/* LO QUE PIDES: una línea por dato, y cada una abre solo su pregunta */
function filas() {
  const E = ED();
  if (PAG === 'portada') {
    const donde = { INDOOR: t('vIn'), OUTDOOR: t('vOut'), ESCAPARATE: t('vEsc') }[E.tipo] + (E.tipo !== 'INDOOR' && E.sol ? ' · ' + (E.sol === 'directo' ? t('vSolD') : t('vSolI')) : '') + (E.gold ? ' · ' + t('vMar') : '');
    return [['donde', 'casa', t('sDonde'), donde], ['uso', 'pin', t('sUso'), E.clase === 'RENTAL' ? t('vRental') : t('vFija')], ['medida', 'regla', t('sTam'), (() => { const u = { m: 1, cm: 100, mm: 1000 }[E.uni] ? E.uni : 'm', k = { m: 1, cm: 100, mm: 1000 }[u]; return (u === 'm' ? fm(E.w) + ' × ' + fm(E.h) : fmt(E.w * k, 0) + ' × ' + fmt(E.h * k, 0)) + ' ' + u; })()],   /* v10.63 · en la unidad en que se pidió */
      ['dist', 'ojo', t('sDist'), E.dist ? fm(E.dist) + ' m' : +E.pitch ? t('vSinDist').split(' · ')[0] : t('vSinDist')], E.tipo === 'INDOOR' ? ['tocar', 'mano', t('sToca'), E.protegido ? t('si') : t('no')] : null,
      ['altura', 'altura', t('sAlt'), +E.elev ? fmt(E.elev, 0) + ' cm' : t('vSuelo')],
      /* v10.63 · el pitch pedido (en la petición o en PRO) se ve aquí, no como «ajuste de PRO» */
      +E.pitch ? ['lpitch', 'calidad', t('sPitch'), [E.pitch].concat(E.pitchOtros || []).map((x) => 'P' + fm(x)).join(' · ')] : null].filter(Boolean);
  }
  if (esLedC()) {   /* v10.55 · varias pantallas LED o sala LED */
    const mL = modoCons(), L = E.led, sL = E.esp.sueltas, o = [['ltipo', mL === 'salaLed' ? 'cubo' : 'led', t('sQue'), mL === 'salaLed' ? t('vSalaLed') : t('vVariasLed')]];
    if (mL === 'salaLed') o.push(['ltam', 'regla', t('sSala'), fm(E.esp.ancho) + ' × ' + fm(E.esp.fondo) + ' × ' + fm(E.esp.alto) + ' m · ' + PAREDES.filter((p) => p !== 'suelo' && E.esp.paredes[p]).map((p) => t(p)).join(', ')]);
    else o.push(['ltam', 'regla', t('sPants'), (() => { const L = tamsDe(sL), x = tamsTxt(L); return x ? L.length + ' · ' + x : t('vPants')(L.length, fm(L[0][0]), fm(L[0][1])); })()], ['ldonde', 'casa', t('sDonde'), { INDOOR: t('vIn'), OUTDOOR: t('vOut'), ESCAPARATE: t('vEsc') }[L.tipo] || L.tipo]);
    o.push(['luso', 'pin', t('sUso'), L.clase === 'RENTAL' ? t('vRental') : t('vFija')]);
    if (mL === 'variasLed') o.push(['ldist', 'ojo', t('sDist'), fm(sL.dist) + ' m']);
    return o;
  }
  const m = modoCons(), s = E.esp.sueltas, lux = Number(E.proy.lux), luz = luzDe(E), mont = E.proy.montaje === 'colgado' ? t('vCol') : E.proy.montaje === 'apoyado' ? t('vApo') : t('vAuto');
  const out = [['ptipo', m === 'sala' ? 'cubo' : m === 'mapping' ? 'edificio' : 'pared', t('sDonde'), m === 'sala' ? t('vSala') : m === 'mapping' ? t('vMap') : t('vPared')]];
  if (m === 'sala') out.push(['ptam', 'regla', t('sSala'), fm(E.esp.ancho) + ' × ' + fm(E.esp.fondo) + ' × ' + fm(E.esp.alto) + ' m · ' + PAREDES.filter((p) => E.esp.paredes[p]).map((p) => t(p)).join(', ')]);
  else out.push(['ptam', 'regla', t('sImg'), fm(s.ancho) + ' × ' + fm(s.alto) + ' m']);
  out.push(['luz', luz ? luz[3] : 'bombilla', t('sLuz'), (luz ? t(luz[2])[0] : t('vMano')) + ' · ' + fmt(lux, 0) + ' lx']);   /* v10.63 · también en mapping: la luz arranca en 140 lx como en Epson y se puede cambiar */
  if (m === 'pared') out.push(['pub', 'persona', t('sPub'), E.proy.pubNS ? t('vPubNS') : fm(s.dist) + ' m']);
  if (m !== 'mapping') out.push(['mont', E.proy.montaje === 'apoyado' ? 'mesa' : 'techo', t('sMont'), mont]);
  if (m === 'pared' && E.proy.montaje === 'colgado') out.push(['techo', 'altura', t('sTecho'), +s.techo > 0 ? fm(s.techo) + ' m' : '—']);
  /* v10.53 · la óptica que lleva el proyector (con su relación de proyección) y la distancia a la que va: se ven siempre y se pueden cambiar */
  /* v10.54 · una sola pregunta para la distancia del proyector (un margen o un sitio fijo), la óptica que lleva y, si hay más de una, las marcas */
  if (m === 'pared' || m === 'mapping') { const a = Number(E.proy.distMin) || 0, b = Number(E.proy.distMax) || 0, d = Number(E.proy.dist) || 0; out.push(['pcabe', 'regla', t('sCabe'), d ? t('vCabeE')(fm(d)) : a || b ? t('vCabe')(a ? fm(a) : '', b ? fm(b) : '') : t('vCabeN')]); }
  const c0 = proyC();
  if (c0 && (m === 'pared' || m === 'mapping') && c0.proyector.optica && E.proy.optica) out.push(['popt', 'proy', t('sOpt'), c0.proyector.optica + ' · ' + trTxt(c0.proyector) + (E.proy.optica ? '' : ' · ' + t('vAutoC'))]);
  if ((C().MARCAS || []).length > 1 && C().marcas().length < C().MARCAS.length) out.push(['pmarca', 'fabrica', t('sMarca'), C().marcas().join(' · ')]);
  return out;
}
function pintaResumen() {
  const el = document.getElementById('ss-resumen'); if (!el) return; el.setAttribute('data-crudo', '');
  if (!listo()) { el.innerHTML = cab('lista', t('pides')) + espera(); return; }
  if (PAG === 'consola' && (modoCons() === 'led' || modoCons() === 'varias')) { el.innerHTML = cab('lista', t('pides')) + `<p class="ss-msg">${esc(modoCons() === 'led' ? t('soloLed') : t('soloVarias'))}</p><button type="button" class="ss-ancho" data-ss="asis">${ic('varita')}<span class="ss-fit">${esc(t('repetir'))}</span></button>`; return; }
  const n = ajustesPro();
  el.innerHTML = cab('lista', t('pides')) + `<div class="ss-filas">${filas().map((f) => `<button type="button" class="ss-fila" data-ss-q="${f[0]}" aria-label="${esc(t('cambiar') + ': ' + f[2])}">${ic(f[1])}<span class="ss-fk ss-fit">${esc(f[2])}</span><b class="ss-fv ss-fit">${esc(f[3])}</b>${ic('lapiz', 'ss-lapiz')}</button>`).join('')}</div>` +
    (n ? `<div class="ss-ajpro" title="${esc(t('ajProT'))}"><span class="ss-fit">${ic('pro')}${esc(t('ajPro')(n))}</span><button type="button" class="ss-mini" data-ss="restablece">${esc(t('restablecer'))}</button></div>` : '') +
    necesitasLed() + `<button type="button" class="ss-ancho" data-ss="asis">${ic('varita')}<span class="ss-fit">${esc(t('repetir'))}</span></button>`;
}
/* v10.88 · VARIAS LED en SIMPLE: debajo de lo que pides, lo que necesitas (el equipo principal), sin huecos vacíos y sin tecnicismos */
function necesitasLed() {
  if (!esLedC()) return ''; const c = C().c; if (!c || !c.modelo || !c.tot) return ''; const T2 = c.tot, x = c.elec || {}, lin = Math.max(1, Math.ceil((T2.amp || 0) / 16));
  const f = [['led', t('nCabs'), fmt(T2.cab, 0) + ' × ' + c.modelo.crm], x.proc ? ['chip', t('nProc'), x.proc.marca + ' ' + x.proc.modelo] : null, x.media ? ['media', t('nMedia'), x.media.marca + ' ' + x.media.modelo] : null, ['red', t('nRed'), t('nRedV')(fmt(T2.lineas, 0))], T2.kw > 0 ? ['rayo', t('nLuz'), t('nLuzV')(fmt(T2.kw, 1), lin)] : null].filter(Boolean);
  return `<div class="ss-nec"><div class="ss-nec-t">${esc(t('necesitas'))}</div>${f.map((r) => `<div class="ss-nec-f">${ic(r[0])}<span class="ss-fk">${esc(r[1])}</span><b class="ss-fv">${esc(r[2])}</b></div>`).join('')}</div>`;
}

/* simulación: la de PRO de la portada, limpia (sin los cuadros de datos ni el rótulo de abajo), o un corte lateral propio para la proyección */
let FIG = null;
function figBox() { if (FIG) return FIG; FIG = { x: 0, y: 0, width: 6400, height: 12800 }; try { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden'); s.innerHTML = `<path d="${HUMAN_PATH}"/>`; document.body.appendChild(s); const q = s.firstChild.getBBox(); if (q.height > 0) FIG = q; s.remove(); } catch (e) {} return FIG; }
const figura = (cx, suelo, k, attr) => { const F = figBox(), e = 1.75 * k / F.height; return `<g transform="translate(${(cx - (F.x + F.width / 2) * e).toFixed(1)},${(suelo + F.y * e).toFixed(1)}) scale(${e.toFixed(5)},${(-e).toFixed(5)})" ${attr || ''}><path d="${HUMAN_PATH}"/></g>`; };
function simProy(prop, ancho, anchoPx) {
  GEO = null;
  const c = C().c, E = C().E; if (!c || !c.filas || !c.filas.length) return '';
  /* rótulos que se lean también en el móvil: unos 14 px en pantalla como mínimo */
  const m = modoCons(), fz = Math.max(28, Math.round(14 * 1000 / Math.max(200, ancho || 1000))), ft = Math.round(fz * .86), sz = (f) => ` style="font-size:${f}px"`;
  if (m === 'variasLed') {   /* v10.55 · varias pantallas LED: alzado de frente, a escala, con la silueta de 1,75 m */
    const fs = c.filas.filter((x) => x.r); if (!fs.length) return '';
    const sep = Math.max(0, +E.esp.sueltas.sep || 0), el = Math.max(0, +E.esp.sueltas.elev || 0), anT = fs.reduce((a, x) => a + x.r.ancho, 0) + sep * (fs.length - 1), alT = Math.max(1.95, ...fs.map((x) => el + x.r.alto)) + .25, hueco = 1.1;
    const VW = 1000, VH = Math.round(VW / Math.max(1.1, Math.min(2.8, prop || 1.8))), mX = 40, mT = 30, mB = Math.max(70, Math.round(fz * 2.5)), k = Math.min((VW - mX * 2) / (anT + hueco), (VH - mT - mB) / alT), suelo = VH - mB, x0 = (VW - (anT + hueco) * k) / 2 + hueco * k;
    let g = `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMax meet" role="img" aria-label="${esc(t('sim'))}"><line x1="0" y1="${suelo}" x2="${VW}" y2="${suelo}" stroke="var(--ss-linea)" stroke-width="3"/>`, x = x0;
    g += figura(x0 - hueco * k * .5, suelo, k, 'fill="var(--ss-tenue)" fill-opacity=".85"');
    fs.forEach((f) => { const w = f.r.ancho * k, h = f.r.alto * k, y = suelo - (el + f.r.alto) * k; g += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="var(--ss-acento)" fill-opacity=".18" stroke="var(--ss-acento)" stroke-width="3"/>`; x += w + sep * k; });
    const f0 = fs[0], yc = suelo + Math.max(48, Math.round(fz * 1.6));
    g += `<line x1="${x0.toFixed(1)}" y1="${yc}" x2="${(x0 + anT * k).toFixed(1)}" y2="${yc}" stroke="var(--ss-azul)" stroke-width="2.5"/><line x1="${x0.toFixed(1)}" y1="${yc - 9}" x2="${x0.toFixed(1)}" y2="${yc + 9}" stroke="var(--ss-azul)" stroke-width="2.5"/><line x1="${(x0 + anT * k).toFixed(1)}" y1="${yc - 9}" x2="${(x0 + anT * k).toFixed(1)}" y2="${yc + 9}" stroke="var(--ss-azul)" stroke-width="2.5"/>`;
    const Lr = fs.map((x) => [x.r.ancho, x.r.alto]), xr = tamsTxt(Lr);
    g += `<text x="${(x0 + anT * k / 2).toFixed(1)}" y="${yc - 10}" text-anchor="middle" class="ss-sv-c"${sz(fz)}>${esc(xr || t('vPants')(fs.length, fm(f0.r.ancho), fm(f0.r.alto)))}</text></svg>`;
    return g;
  }
  if (m === 'sala' || m === 'salaLed') {   /* sala entera: planta con las paredes iluminadas (de proyección o de LED) */
    const A = Math.max(1, +E.esp.ancho || 1), F = Math.max(1, +E.esp.fondo || 1), VW = 1000, VH = Math.round(VW / Math.max(.9, Math.min(2.6, prop || 1.6))), k = Math.min((VW - 300) / A, (VH - 160) / F), x0 = (VW - A * k) / 2, y0 = (VH - F * k) / 2 - 6, P2 = m === 'salaLed' ? { ...E.esp.paredes, suelo: false } : E.esp.paredes, on = 'var(--ss-acento)', off = 'var(--ss-linea)';
    const muro = (x1, y1, x2, y2, p) => { const v = x1 === x2, an = v ? (x1 < VW / 2 ? 'end' : 'start') : 'middle', tx = v ? x1 + (x1 < VW / 2 ? -20 : 20) : (x1 + x2) / 2, ty = v ? (y1 + y2) / 2 + 8 : y1 + (y1 < VH / 2 ? -18 : 36);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${P2[p] ? on : off}" stroke-width="${P2[p] ? 12 : 6}" stroke-linecap="round"/>` + (P2[p] ? (v ? `<text x="${x1 + (x1 < VW / 2 ? -1 : 1) * (14 + ft * .4)}" y="${(y1 + y2) / 2}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${x1 < VW / 2 ? -90 : 90} ${x1 + (x1 < VW / 2 ? -1 : 1) * (14 + ft * .4)} ${(y1 + y2) / 2})" class="ss-sv-t"${sz(ft)}>${esc(t(p))}</text>` : `<text x="${tx}" y="${ty}" text-anchor="${an}" class="ss-sv-t"${sz(ft)}>${esc(t(p))}</text>`) : ''); };   /* v10.53 · izquierda y derecha, en vertical junto a su pared: caben siempre */
    let g = `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(t('sim'))}">`;
    g += `<rect x="${x0}" y="${y0}" width="${A * k}" height="${F * k}" fill="${P2.suelo ? 'color-mix(in srgb, var(--ss-acento) 16%, transparent)' : 'var(--ss-campo)'}" rx="4"/>`;
    g += muro(x0, y0, x0 + A * k, y0, 'frontal') + muro(x0, y0, x0, y0 + F * k, 'izquierda') + muro(x0 + A * k, y0, x0 + A * k, y0 + F * k, 'derecha') + muro(x0, y0 + F * k, x0 + A * k, y0 + F * k, 'trasera');
    (c.sombras && c.sombras.haces || []).forEach((h) => { if (!h.lente) return; const px = x0 + (h.lente.x + A / 2) * k, pz = y0 + (h.lente.z + F / 2) * k; if (px < x0 - 40 || px > x0 + A * k + 40 || pz < y0 - 40 || pz > y0 + F * k + 40) return; g += `<circle cx="${px.toFixed(1)}" cy="${pz.toFixed(1)}" r="9" fill="var(--ss-violeta)" stroke="#fff" stroke-width="2"/>`; });
    g += `<text x="${VW / 2}" y="${(y0 + F * k - 22).toFixed(1)}" text-anchor="middle" class="ss-sv-c"${sz(fz)}>${fm(A)} × ${fm(F)} m</text></svg>`;
    return g;
  }
  const f = c.filas.find((x) => x.s.tipo !== 'suelo') || c.filas[0], s = f.s, pos = f.pos || {};
  const dReal = +pos.dist || 0, dP = Math.max(.5, dReal), dPub = m === 'pared' && !E.proy.pubNS ? Math.max(0, +c.dist || 0) : 0, y0 = isFinite(pos.y0) ? pos.y0 : s.elev, y1 = isFinite(pos.y1) ? pos.y1 : s.elev + s.alto;
  const techo = m === 'pared' && pos.techo > 0 ? +pos.techo : 0, yL = isFinite(pos.yLente) ? pos.yLente : (y0 + y1) / 2;
  /* v10.56 · el proyector y la persona se arrastran. Mientras se arrastra, la escala del dibujo es la que había al cogerlo (o la que se va
     abriendo al llegar al borde): así lo que se lleva no se mueve solo bajo el dedo */
  const vf = ARR && ARR.v, D = vf ? vf.D : Math.max(dP, dPub) + Math.max(1.4, dP * .12), H = vf ? vf.H : Math.max(techo || 0, y1, yL, 2.2) + .7;
  const zona = arrLim('proy'), arrP = zona.length > 1 || (zona.length === 1 && zona[0][1] - zona[0][0] > .04), arrU = dPub > 0 && (dPub < D || !!vf);
  const pista = arrP && arrU ? t('arrAmbos') : arrP ? t('arrProy') : arrU ? t('arrPub') : '';
  const VW = 1000, VH = Math.round(VW / Math.max(1.1, Math.min(2.8, prop || 1.8))), mL = 50, mR = Math.max(90, Math.round(30 + fz * 3.9)), mB = Math.max(70, Math.round(fz * 2.5));
  /* u: lo que mide un píxel de pantalla en unidades del dibujo, contando la escala de la plantilla (las asas, las flechas y la pista se ven
     igual de grandes en la tele que en el móvil) */
  const aPx = anchoPx || ancho || VW, u = 1 / Math.max(.05, Math.min(aPx / VW, aPx / (prop || 1.8) / VH)), tac = 44 * u, on = (q) => (ARR && ARR.q === q ? ' on' : ''), fp = Math.round(12.5 * u), mT = 34 + (pista ? Math.round(fp * 1.7) : 0);
  const k = Math.min((VW - mL - mR) / D, (VH - mT - mB) / H), suelo = VH - mB, muroX = mL + D * k, X = (d) => muroX - d * k, Y = (h) => suelo - h * k;
  GEO = { k, muroX, VW, VH, D, H };
  const fle = (x, y, d, col) => `<path class="ss-arr-f" d="M${x.toFixed(1)},${(y - 6 * u).toFixed(1)} l${(d * 6 * u).toFixed(1)},${(6 * u).toFixed(1)} l${(-d * 6 * u).toFixed(1)},${(6 * u).toFixed(1)}" fill="none" stroke="${col}" stroke-width="${(2.4 * u).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const asa = (q, lim, v) => `class="ss-arr${on(q)}" data-ss-arr="${q}" tabindex="0" role="slider" aria-orientation="horizontal" aria-label="${esc(t(q === 'proy' ? 'arrProyA' : 'arrPubA'))}" aria-valuemin="${lim[0][0]}" aria-valuemax="${lim[lim.length - 1][1]}" aria-valuenow="${Math.round(v * 100) / 100}" aria-valuetext="${esc(fm(v))} m"`;
  let g = `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMax meet" role="img" aria-label="${esc(t('sim'))}">`;
  if (pista) { const py = 16 + fp * .62, pw2 = 20 * u, px = 22;
    g += `<path d="M${px},${py.toFixed(1)} h${pw2.toFixed(1)} M${(px + 5 * u).toFixed(1)},${(py - 5 * u).toFixed(1)} L${px},${py.toFixed(1)} l${(5 * u).toFixed(1)},${(5 * u).toFixed(1)} M${(px + pw2 - 5 * u).toFixed(1)},${(py - 5 * u).toFixed(1)} L${(px + pw2).toFixed(1)},${py.toFixed(1)} l${(-5 * u).toFixed(1)},${(5 * u).toFixed(1)}" fill="none" stroke="var(--ss-tenue)" stroke-width="${(2 * u).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/><text x="${(px + pw2 + 8 * u).toFixed(1)}" y="${(py + fp * .35).toFixed(1)}" class="ss-sv-p"${sz(fp)}>${esc(pista)}</text>`; }
  g += `<line x1="0" y1="${suelo}" x2="${VW}" y2="${suelo}" stroke="var(--ss-linea)" stroke-width="3"/>`;
  if (techo) g += `<line x1="0" y1="${Y(techo).toFixed(1)}" x2="${muroX}" y2="${Y(techo).toFixed(1)}" stroke="var(--ss-linea)" stroke-width="3" stroke-dasharray="10 8"/>`;
  g += `<rect x="${muroX}" y="${Y(techo || H).toFixed(1)}" width="16" height="${(suelo - Y(techo || H)).toFixed(1)}" fill="var(--ss-linea)"/>`;
  const lx = X(dP), ly = Y(yL);
  g += `<polygon points="${lx.toFixed(1)},${ly.toFixed(1)} ${muroX},${Y(y1).toFixed(1)} ${muroX},${Y(y0).toFixed(1)}" fill="var(--ss-acento)" fill-opacity=".16" stroke="var(--ss-acento)" stroke-opacity=".55" stroke-width="2"/>`;
  g += `<rect x="${muroX - 5}" y="${Y(y1).toFixed(1)}" width="10" height="${((y1 - y0) * k).toFixed(1)}" fill="var(--ss-acento)" rx="3"/>`;
  /* el carril: por dónde puede ir el proyector con lo que has dicho y con su óptica */
  /* v10.64 · en ámbar y a trazos, el tramo que solo vale fuera de especificación; encima, en violeta, el garantizado */
  const cZ = C().c || {}, rail = (l, col, op, das) => redZ(l).forEach((z) => { const a = Math.max(0, X(z[1])), b = Math.min(muroX - 8, X(z[0])); if (b >= a) g += `<line class="ss-arr-c" x1="${a.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${b.toFixed(1)}" y2="${ly.toFixed(1)}" stroke="${col}" stroke-opacity="${op}" stroke-width="${(5 * u).toFixed(1)}" stroke-linecap="round"${das ? ` stroke-dasharray="${(10 * u).toFixed(1)} ${(8 * u).toFixed(1)}"` : ''}/>`; });
  const resta = (A, B) => { let out = (A || []).map((z) => [z[0], z[1]]); (B || []).forEach((b) => { const n = []; out.forEach((a) => { if (b[1] <= a[0] || b[0] >= a[1]) { n.push(a); return; } if (b[0] > a[0]) n.push([a[0], b[0]]); if (b[1] < a[1]) n.push([b[1], a[1]]); }); out = n; }); return out.filter((z) => z[1] - z[0] > .02); };
  if (arrP) { if (cZ.zonaO) rail(resta(cZ.zonaO, cZ.zonaN), 'var(--ss-ambar)', '.75', true); rail(cZ.zonaN || zona, 'var(--ss-violeta)', '.45', false); }
  const pw = Math.max(26, .5 * k), ph = Math.max(14, .22 * k);
  let pr = '';
  if (pos.apoyo) { const top = ly + ph / 2; pr += `<rect x="${(lx - pw * .9).toFixed(1)}" y="${top.toFixed(1)}" width="${(pw * 1.8).toFixed(1)}" height="6" fill="var(--ss-tenue)"/><line x1="${(lx - pw * .75).toFixed(1)}" y1="${top + 6}" x2="${(lx - pw * .75).toFixed(1)}" y2="${suelo}" stroke="var(--ss-tenue)" stroke-width="5"/><line x1="${(lx + pw * .75).toFixed(1)}" y1="${top + 6}" x2="${(lx + pw * .75).toFixed(1)}" y2="${suelo}" stroke="var(--ss-tenue)" stroke-width="5"/>`; }
  else if (techo) pr += `<line x1="${lx.toFixed(1)}" y1="${Y(techo).toFixed(1)}" x2="${lx.toFixed(1)}" y2="${(ly - ph / 2).toFixed(1)}" stroke="var(--ss-tenue)" stroke-width="5"/>`;
  pr += `<rect class="ss-arr-m" x="${(lx - pw / 2).toFixed(1)}" y="${(ly - ph / 2).toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" rx="5" fill="var(--ss-violeta)"/><circle cx="${(lx + pw / 2 - ph * .45).toFixed(1)}" cy="${ly.toFixed(1)}" r="${(ph * .28).toFixed(1)}" fill="#fff" fill-opacity=".85"/>`;
  /* primero la persona y, encima, el proyector: cuando coinciden (el proyector en una mesa, a la altura del público) se pueden coger los dos */
  if (arrU) { const ux = X(dPub), fw = Math.max(.62 * k, tac), fh = Math.max(1.8 * k, tac), fy = suelo - .95 * k, limU = arrLim('pub');
    g += `<g ${asa('pub', limU, dPub)}><rect x="${(ux - fw / 2).toFixed(1)}" y="${(suelo - fh).toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" fill="transparent"/>${figura(ux, suelo, k, 'class="ss-arr-m" fill="var(--ss-tenue)" fill-opacity=".85"')}${fle(ux - .31 * k - 5 * u, fy, -1, 'var(--ss-tenue)')}${fle(ux + .31 * k + 5 * u, fy, 1, 'var(--ss-tenue)')}</g>`; }
  if (arrP) { const hw = Math.max(pw + 34 * u, tac), hh = Math.max(ph, tac);
    g += `<g ${asa('proy', zona, dP)}><rect x="${(lx - hw / 2).toFixed(1)}" y="${(ly - hh / 2).toFixed(1)}" width="${hw.toFixed(1)}" height="${hh.toFixed(1)}" fill="transparent"/>${pr}${fle(lx - pw / 2 - 5 * u, ly, -1, 'var(--ss-violeta-t)')}${fle(lx + pw / 2 + 5 * u, ly, 1, 'var(--ss-violeta-t)')}</g>`; }
  else g += pr;
  /* la cota de abajo: la distancia del proyector o, mientras se lleva a la persona, la suya */
  const dC = ARR && ARR.q === 'pub' && arrU ? dPub : dP, dTxt = ARR && ARR.q === 'pub' && arrU ? dPub : dReal, cx = X(dC), yc = suelo + Math.max(48, Math.round(fz * 1.6));
  g += `<line x1="${cx.toFixed(1)}" y1="${yc}" x2="${muroX}" y2="${yc}" stroke="var(--ss-azul)" stroke-width="2.5"/><line x1="${cx.toFixed(1)}" y1="${yc - 9}" x2="${cx.toFixed(1)}" y2="${yc + 9}" stroke="var(--ss-azul)" stroke-width="2.5"/><line x1="${muroX}" y1="${yc - 9}" x2="${muroX}" y2="${yc + 9}" stroke="var(--ss-azul)" stroke-width="2.5"/><text x="${((cx + muroX) / 2).toFixed(1)}" y="${yc - 10}" text-anchor="middle" class="ss-sv-c"${sz(fz)}>${fm(dTxt)} m</text>`;   /* v10.63 · la cota dice la distancia de verdad (el dibujo no baja de 0,5 m para no aplastarse) */
  g += `<text x="${muroX + 26}" y="${((Y(y0) + Y(y1)) / 2 + 9).toFixed(1)}" class="ss-sv-c"${sz(fz)}>${fm(s.alto)} m</text></svg>`;   /* v10.63 · el alto pedido (la imagen que sobra ya se ve en el dibujo) */
  return g;
}

/* ---------- v10.56 · arrastrar en el dibujo: el proyector (dentro de lo que da su óptica y del margen de instalación que hayas dicho) y la
   persona (desde dónde mira la gente). Al soltar el proyector, su distancia queda fijada (se libera en «El proyector cabe» → No lo sé). ---------- */
let GEO = null, ARR = null;
/* los tramos por los que se puede mover cada cosa, en metros (redondeados hacia dentro al centímetro) */
const redZ = (l) => (l || []).map((z) => [Math.ceil(z[0] * 100 - 1e-6) / 100, Math.floor(z[1] * 100 + 1e-6) / 100]).filter((z) => z[1] >= z[0]);
/* v10.64 · el proyector puede ir también por el tramo que solo vale fuera de especificación (en ámbar en el carril) */
function arrLim(q) { if (q === 'pub') return [[1, 100]]; const c = C().c; if (!c) return []; const u = [...(c.zonaN || c.zona || []), ...(c.zonaO || [])].sort((a, b) => a[0] - b[0]), z = [];
  u.forEach((x) => { const l = z[z.length - 1]; if (l && x[0] <= l[1] + .005) l[1] = Math.max(l[1], x[1]); else z.push([x[0], x[1]]); }); return redZ(z); }
const enZ = (l, d) => (l || []).some((z) => d >= z[0] - .005 && d <= z[1] + .005);
const arrVal = (q) => { if (q === 'pub') return +ED().esp.sueltas.dist || 0; const f = paredF(); return f && f.pos ? +f.pos.dist || 0 : 0; };
/* el punto permitido más cercano */
function arrCerca(lim, d) { let m = null; for (const z of lim) { if (d >= z[0] && d <= z[1]) return d; const p = d < z[0] ? z[0] : z[1]; if (m == null || Math.abs(p - d) < Math.abs(m - d)) m = p; } return m == null ? d : m; }
function arrPon(q, d) {
  const E = ED(); d = Math.round(d * 100) / 100;
  if (q === 'pub') { if (!E.proy.pubNS && Math.abs((+E.esp.sueltas.dist || 0) - d) < .001) return false; E.esp.sueltas.dist = d; E.proy.pubNS = false; }
  else { if (Math.abs((+E.proy.dist || 0) - d) < .001) return false; E.proy.dist = d;
    /* v10.64 · más allá de lo garantizado pasa solo a «fuera de especificación» (con su aviso); si vuelve al tramo garantizado, se quita */
    const c = C().c; if (c && c.zonaN) { if (!enZ(c.zonaN, d) && enZ(c.zonaO, d)) { E.proy.oos = true; E.proy.oosArr = true; } else if (E.proy.oosArr && enZ(c.zonaN, d)) { E.proy.oos = false; E.proy.oosArr = false; } } }
  C().actualizar(); return true;
}
/* de la posición del puntero a metros desde la pared */
function arrX(cx) { const s = cuerpo && cuerpo.querySelector('.ss-lienzo > svg'); if (!s || !GEO) return null; const r = s.getBoundingClientRect(), e = Math.min(r.width / GEO.VW, r.height / GEO.VH); if (!(e > 0)) return null; return (GEO.muroX - (cx - (r.left + (r.width - GEO.VW * e) / 2)) / e) / GEO.k; }
function arrIni(e) {
  const h = e.target.closest && e.target.closest('[data-ss-arr]'); if (!h || !GEO || ARR || W || (e.button || 0) > 0 || PAG !== 'consola') return;
  const q = h.dataset.ssArr, x = arrX(e.clientX), d0 = arrVal(q), cu = cuerpo.querySelector('.ss-lienzo'); if (x == null || !(d0 > 0) || !cu) return;
  ARR = { q, id: e.pointerId, v: { D: GEO.D, H: GEO.H }, off: d0 - x, cx0: e.clientX, cx: e.clientX, d: d0, mov: false, tz: 0, raf: 0 };
  try { cu.setPointerCapture(e.pointerId); } catch (x2) {} cu.classList.add('ss-arrastra'); e.preventDefault();
}
function arrMueve(e) {
  if (!ARR || e.pointerId !== ARR.id) return; ARR.cx = e.clientX;
  if (!ARR.mov) { if (Math.abs(e.clientX - ARR.cx0) < 4) return; ARR.mov = true; }   /* un toque sin mover no cambia nada */
  e.preventDefault(); arrPaso();
}
function arrPaso() {
  if (!ARR || !ARR.mov) return; const x = arrX(ARR.cx); if (x == null) return;
  const lim = arrLim(ARR.q); if (!lim.length) return;
  const quiere = arrCerca(lim, Math.round((x + ARR.off) * 20) / 20), vis = ARR.v.D - .25, tope = Math.min(lim[lim.length - 1][1], 300) + 1.5;
  /* lo que cabe en el dibujo; al llegar al borde con sitio aún por delante, el dibujo se va abriendo */
  const visR = Math.floor(vis * 20) / 20, dentro = lim.map((z) => [z[0], Math.min(z[1], Math.max(z[0], visR))]).filter((z) => z[0] <= vis), d = dentro.length ? arrCerca(dentro, quiere) : quiere, abre = quiere > vis + .001 && ARR.v.D < tope - .001;
  if (abre && !ARR.tz) ARR.tz = setInterval(() => { if (!ARR) return; ARR.v.D = Math.min(ARR.v.D * 1.04, tope); pintaSim(); arrPaso(); }, 60);
  if (!abre && ARR.tz) { clearInterval(ARR.tz); ARR.tz = 0; }
  if (Math.abs(d - ARR.d) < .001) return;
  ARR.d = d; if (!ARR.raf) ARR.raf = requestAnimationFrame(() => { if (!ARR) return; ARR.raf = 0; arrPon(ARR.q, ARR.d); });
}
function arrFin(e) {
  if (!ARR || (e && e.pointerId !== ARR.id)) return; const a = ARR; ARR = null;
  if (a.tz) clearInterval(a.tz); if (a.raf) cancelAnimationFrame(a.raf);
  const cu = cuerpo && cuerpo.querySelector('.ss-lienzo'); if (cu) { cu.classList.remove('ss-arrastra'); try { cu.releasePointerCapture(a.id); } catch (x) {} }
  if (a.mov && !arrPon(a.q, a.d)) aviso();   /* el dibujo vuelve a su escala */
}
/* con el teclado: flechas, de 10 en 10 cm (con mayúsculas, de 50 en 50) */
function arrTecla(e, h) {
  const izq = e.key === 'ArrowLeft' || e.key === 'ArrowUp', der = e.key === 'ArrowRight' || e.key === 'ArrowDown'; if (!izq && !der) return false;
  const q = h.dataset.ssArr, lim = arrLim(q), v = arrVal(q); if (!lim.length || !(v > 0)) return true;
  const sg = izq ? 1 : -1; let d = arrCerca(lim, Math.round((v + sg * (e.shiftKey ? .5 : .1)) * 20) / 20);
  if (Math.abs(d - v) < .001) { const o = sg > 0 ? lim.map((z) => z[0]).filter((a) => a > v + .001)[0] : lim.map((z) => z[1]).filter((b) => b < v - .001).pop(); if (o != null) d = o; }   /* salta al tramo siguiente */
  e.preventDefault(); arrPon(q, d); return true;
}
function pintaSim() {
  const el = document.getElementById('ss-sim'); if (!el) return;
  let cu = el.querySelector('.ss-lienzo');
  if (!cu) { el.innerHTML = cab('sim', t('sim')) + '<div class="ss-lienzo"></div>'; cu = el.querySelector('.ss-lienzo'); }
  const prop = cu.clientWidth > 40 && cu.clientHeight > 40 ? cu.clientWidth / cu.clientHeight : 1.6;
  let svg = '';
  let msg = listo() || !FALLO ? t('calculando') : '';
  if (!listo()) svg = '';
  else if (PAG === 'portada') {
    const R = B().R;
    if (R && R.r) {
      /* v10.63 · con el cuadro de resumen de PRO; en un hueco estrecho (móvil) el cuadro dentro del dibujo no se lee: va debajo, como una tira con la letra de la interfaz */
      const hT = (el.querySelector('.ss-resumen') || {}).offsetHeight || 0, estr = cu.clientWidth > 0 && (cu.clientWidth < 600 || cu.clientHeight + hT < 360);   /* con la altura que tendría sin la tira, para que no vaya y venga */
      try { svg = B().sim(Math.max(.75, Math.min(3, prop)), cu.clientWidth, { limpia: true, cajas: !estr }); } catch (e) { svg = ''; }
      let ti = el.querySelector('.ss-resumen');
      if (estr) { const { r, m } = R, cm = (v) => fmt(v * 100, 0) + ' cm';
        if (!ti) { ti = document.createElement('div'); ti.className = 'ss-resumen'; el.appendChild(ti); }
        ti.innerHTML = `<span><b>${r.resW} × ${r.resH}</b>${R.nivel && R.nivel[0] ? ' · ' + esc(R.nivel[0]) : ''}${R.formato ? ' · ' + esc(R.formato) : ''}</span><span><b>${r.cols} × ${r.rows}</b> = ${r.cab} ${t('rCabs')}</span><span><b>P${fm(m.pitch)}</b> · ${cm(r.ancho)} × ${cm(r.alto)}</span><span>${esc(t('rVis')(cm(m.pitch), cm(m.pitch * 3)))}</span>`; }
      else if (ti) ti.remove();
      /* la rejilla de PRO (oculta) tiene su propio dibujo con los mismos id: los de aquí llevan su prefijo para no recortar con los de allí */
      [...new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]))].forEach((id) => { svg = svg.split(`id="${id}"`).join(`id="ss-${id}"`).split(`url(#${id})`).join(`url(#ss-${id})`).split(`href="#${id}"`).join(`href="#ss-${id}"`); });
    } else if (R && R.vacio) msg = t('vacio');
    else if (B().estado() === 'cargando') msg = t('cargando');
    else if (B().estado() === 'error') msg = t('sinCat');
  }
  else if (modoCons() !== 'led' && modoCons() !== 'varias') { svg = simProy(prop, cu.clientWidth, cu.getBoundingClientRect().width); if (!svg && esLedC()) { const st = C().estadoCat; msg = st === 'cargando' ? t('cargando') : st === 'error' ? t('sinCat') : t('vacio'); } }   /* v10.55 · sin catálogo no se queda en «Calculando…» */
  else svg = `<p class="ss-espera" data-crudo>${ic(modoCons() === 'led' ? 'led' : 'proy', 'ss-ic-xl')}</p>`;
  cu.classList.toggle('ss-papel', PAG === 'consola');
  const act = document.activeElement, foco = act && act.getAttribute && cu.contains(act) ? act.getAttribute('data-ss-arr') : '';   /* v10.56 · el asa que tenía el foco lo conserva */
  cu.innerHTML = svg || (msg ? `<p class="ss-espera" data-crudo>${esc(msg)}</p>` : '');
  if (foco) { const h = cu.querySelector('[data-ss-arr="' + foco + '"]'); if (h && h.focus) h.focus({ preventScroll: true }); }
}

/* RESULTADO: la línea resumen bajo el título, el semáforo y unas pocas cifras que no repiten la línea (las que valen cero no salen) */
let TXT = '';
const nb = (x) => String(x).replace(/(\d) × (\d)/g, '$1 × $2').replace(/(\d) (m|cm|kg|kW|lx|nits|lm|A)\b/g, '$1 $2');
const cifra = (k, v, u, sub, icono, color, extra) => `<div class="ss-cifra" style="--c:${color}" data-crudo><span class="ss-ci">${ic(icono)}</span><div class="ss-cd"><small class="ss-fit">${esc(k)}</small><b class="ss-fit">${esc(v)}${u ? `<i>${esc(u)}</i>` : ''}${extra || ''}</b>${sub ? `<span class="ss-fit">${esc(sub)}</span>` : ''}</div></div>`;
const botones = () => `<div class="ss-acc" data-crudo><button type="button" class="ss-bt2" data-ss="pdf">${ic('pdf')}<span class="ss-fit">${esc(t('pdf'))}</span></button><button type="button" class="ss-bt2" data-ss="compartir">${ic('compartir')}<span class="ss-fit">${esc(t('compartir'))}</span></button><button type="button" class="ss-bt2 ss-pro" data-ss="pro">${ic('pro')}<span class="ss-fit">${esc(t('enPro'))}</span></button></div>`;
/* la línea resumen: en una sola línea en escritorio (se encoge entera si no cabe); apilada, en dos (cada una se encoge por su lado) */
const linea = (l1, l2) => `<p class="ss-linea ss-fit" data-crudo><span class="ss-l1 ss-fit">${l1}</span><span class="ss-l2 ss-fit"><i class="ss-lsep"> · </i>${l2}</span></p>`;
const cabRes = (conBot) => `<header class="ss-res-cab">${cab('res', t('res'))}${conBot ? botones() : ''}</header>`;
/* v10.63 · UN SOLO VEREDICTO: el semáforo enseña el aviso más grave del cálculo (el mismo que PRO pone arriba de RESULTADOS) y, si hay más,
   un botón que abre la lista entera con lo que se puede hacer para corregirlos */
let AV = [];
const semHtml = (nivel, txt, bt, small, crudo) => `<p class="ss-sem ss-sem-${nivel}"${crudo === false ? '' : ' data-crudo'}><i></i><span class="ss-fit">${esc(txt)}${small ? ` <small data-crudo>${esc(nb(small))}</small>` : ''}</span>${bt || ''}</p>`;
const btAvisos = (n, que) => (que ? `<button type="button" class="ss-mini" data-ss-q="pconsejo">${esc(t('queHago'))}</button>` : n > 1 ? `<button type="button" class="ss-mini" data-ss-q="pconsejo">${esc(t('nAvisos')(n - 1))}</button>` : '');
function resLed() {
  const R = B().R, E = B().E;
  if (!R) return cabRes(false) + (B().estado() === 'error' ? `<p class="ss-msg" data-crudo>${esc(t('sinCat'))}</p><button type="button" class="ss-mini ss-grande" data-ss="reintenta">${esc(t('reintentar'))}</button>` : `<p class="ss-espera" data-crudo>${esc(B().estado() === 'cargando' ? t('cargando') : t('calculando'))}</p>`);
  if (R.vacio || !R.r) return cabRes(false) + `<p class="ss-msg" data-crudo>${esc(t('vacio'))}</p>`;
  const r = R.r, m = R.m, dw = Math.round((E.w - r.ancho) * 100), dh = Math.round((E.h - r.alto) * 100), aj = [];
  if (dw > 0) aj.push(t('ajMenosW')(dw)); else if (dw < 0) aj.push(t('ajMasW')(-dw));
  if (dh > 0) aj.push(t('ajMenosH')(dh)); else if (dh < 0) aj.push(t('ajMasH')(-dh));
  const st = window.SC_FICHA && window.SC_FICHA.stockIc ? window.SC_FICHA.stockIc(B().enStock(m), null) : '';
  const l1 = esc(t('lLed')) + ' <b>' + esc(m.crm) + '</b>' + st, l2 = esc(nb(`${fmt(r.ancho * 100)} × ${fmt(r.alto * 100)} cm · ${fmt(R.diag / .0254)}″ · ${r.cols}×${r.rows} = ${r.cab} cabinets · ${r.resW}×${r.resH} px`));
  AV = [];
  if (R.relajado) AV.push({ n: 'A', txt: R.relajado, crudo: false });
  if (R.alt) AV.push({ n: 'A', txt: R.alt, crudo: false });   /* v10.69 · alternativa de alquiler en stock */
  /* v10.88 · el aviso de batch es stock interno: fuera de los avisos públicos (sale en pantalla y en el PDF); el admin lo ve en PRO, bloque CABINET */
  if (R.origen === 'cercano') AV.push({ n: 'A', txt: t('lCerca')(fm(E.pitch), fm(R.pitch)) });
  if (R.origen === 'sinres') AV.push({ n: 'A', txt: t('lSinRes')(E.resMin) });
  if (!R.proc) AV.push({ n: 'A', txt: t('lSinProc') });
  if (E.marca !== 'ninguno' && !R.media) AV.push({ n: 'A', txt: t('lSinMedia') });
  const sem = AV.length ? 'A' : 'V', semTxt = AV.length ? AV[0].txt : t('semLedV'), ajTxt = aj.length ? '(' + aj.join(t('ajY')) + ', ' + t('ajFin') + ')' : '';
  const lin = R.nLin || Math.max(1, Math.ceil((r.amp || 0) / 16)), nivel = R.nivel && R.nivel[0] ? (R.nivel[0] === 'FHD' ? 'FULL HD' : R.nivel[0]) : '', pt = fm(R.pitch);
  /* calidad: el nivel de imagen (HD, FULL HD, 4K, 8K) o, por debajo de HD, el pitch; sin repetir el formato */
  const C5 = [cifra(t('kCal'), nivel || 'P' + pt, '', nivel ? t('kCalS')(pt, R.formato || '') : t('kCalF')(R.formato || ''), 'calidad', 'var(--ss-azul)'),
    cifra(t('kNit'), fm(R.pitch / 1), 'm', t('kNitS')(fm(R.pitch * 3)), 'ojo', 'var(--ss-acento)')];
  if (r.kw > 0) C5.push(cifra(t('kElec'), fmt(r.kw, 2), 'kW', R.ampCab > 0 ? t('kElecS')(lin) : '', 'rayo', 'var(--ss-rojo)'));
  if (r.peso > 0) C5.push(cifra(t('kPeso'), fmt(r.peso, 0), 'kg', +m.cabKg > 0 ? t('kPesoS')(fmt(m.cabKg, 1)) : '', 'peso', 'var(--ss-magenta)'));
  /* el procesador, con su icono de stock solo si lo hay (el dato es interno: nunca en texto) */
  if (R.proc && R.proc.modelo) C5.push(cifra(t('kCtrl'), R.proc.modelo, '', R.proc.marca || '', 'chip', 'var(--ss-violeta-t)', R.proc.enStock && window.SC_FICHA && window.SC_FICHA.stockIc ? window.SC_FICHA.stockIc(true) : ''));
  TXT = t('lLed') + ' ' + m.crm + ' · ' + `${fmt(r.ancho * 100)} × ${fmt(r.alto * 100)} cm · ${fmt(R.diag / .0254)}″ · ${r.cols}×${r.rows} = ${r.cab} cabinets · ${r.resW}×${r.resH} px` + '\n' + semTxt + (ajTxt ? ' ' + ajTxt : '') + '\n' +
    [nivel ? t('kCal') + ': ' + nivel : '', t('kNit') + ' ' + fm(R.pitch) + ' m', r.kw > 0 ? t('kElec') + ': ' + fmt(r.kw, 2) + ' kW' : '', r.peso > 0 ? t('kPeso') + ': ' + fmt(r.peso, 0) + ' kg' : ''].filter(Boolean).join('\n');
  return cabRes(true) + linea(l1, l2) + semHtml(sem, semTxt, btAvisos(AV.length), ajTxt, AV.length && AV[0].crudo === false ? false : true) + `<div class="ss-cifras" style="--n:${C5.length}">${C5.join('')}</div>`;
}
/* v10.55 · varias pantallas LED o sala LED (consola): el cabinet elegido, cuántos hacen falta y las cifras del conjunto */
function resLedC(m) {
  const c = C().c, E = C().E, est = C().estadoCat;
  if (!c || !c.modelo || !c.filas.length || !c.tot) return cabRes(false) + (est === 'cargando' ? `<p class="ss-espera" data-crudo>${esc(t('cargando'))}</p>` : `<p class="ss-msg" data-crudo>${esc(c && c.lista && !c.lista.length && est !== 'error' ? t('vacio') : t('sinCat'))}</p><button type="button" class="ss-mini ss-grande" data-ss="reintenta">${esc(t('reintentar'))}</button>`);
  const T2 = c.tot, mo = c.modelo, sL = E.esp.sueltas, pt = fm(+mo.pitch), pr = c.elec && c.elec.proc;
  const l1 = esc(m === 'salaLed' ? t('lSalaLed') : t('lPantsLed')) + ' <b>' + esc(mo.crm) + '</b>';
  /* las pantallas salen con cabinets enteros: se da su medida real y, si no es la pedida, se dice */
  /* v10.63 · cada pantalla con su medida: la real (cabinets enteros) y, si no es la pedida, se dice */
  const fr = c.filas.filter((f) => f.r), pide = tamsDe(sL), real = m === 'variasLed' ? fr.map((f) => [f.r.ancho, f.r.alto]) : null;
  const ajTxt = real && real.some((x, i) => pide[i] && (Math.abs(x[0] - pide[i][0]) > .01 || Math.abs(x[1] - pide[i][1]) > .01)) ? '(' + (pide.length === 1 || !tamsTxt(pide) ? t('ajCab')(fm(pide[0][0]), fm(pide[0][1])) : t('ajCab')(pide.map((x) => fm(x[0])).join('/'), pide.map((x) => fm(x[1])).join('/'))) + ')' : '';
  const med = m === 'salaLed' ? `${fm(E.esp.ancho)} × ${fm(E.esp.fondo)} × ${fm(E.esp.alto)} m · ${PAREDES.filter((p) => p !== 'suelo' && E.esp.paredes[p]).map((p) => t(p)).join(', ')}` : (tamsTxt(real) ? real.length + ' · ' + tamsTxt(real) : t('vPants')(real.length, fm(real[0][0]), fm(real[0][1])));
  AV = ((c.veredicto && c.veredicto.motivos) || []).map((x) => ({ n: x.n, txt: x.txt, crudo: false }));
  const l2 = esc(nb(med + ' · ' + t('cabs')(fmt(T2.cab, 0)))), sem = AV.length ? 'A' : 'V', semTxt = AV.length ? AV[0].txt : t('semLedV');
  const C5 = [cifra(t('kCal'), 'P' + pt, '', t('kLienzo')(fmt(T2.lienzoW, 0), fmt(T2.lienzoH, 0)), 'calidad', 'var(--ss-azul)'),
    cifra(t('kNit'), pt, 'm', t('kNitS')(fm(+mo.pitch * 3)), 'ojo', 'var(--ss-acento)'),
    cifra(t('kCabs'), fmt(T2.cab, 0), '', +mo.cabAncho > 0 && +mo.cabAlto > 0 ? t('kCabsS')(String(+mo.cabAncho).replace('.', ','), String(+mo.cabAlto).replace('.', ',')) : '', 'led', 'var(--ss-violeta-t)')];
  if (T2.kw > 0) C5.push(cifra(t('kElec'), fmt(T2.kw, 2), 'kW', T2.amp > 0 ? fmt(T2.amp, 1) + ' A · 230 V' : '', 'rayo', 'var(--ss-rojo)'));
  if (T2.peso > 0) C5.push(cifra(t('kPeso'), fmt(T2.peso, 0), 'kg', +mo.cabKg > 0 ? t('kPesoS')(fmt(+mo.cabKg, 1)) : '', 'peso', 'var(--ss-magenta)'));
  TXT = (m === 'salaLed' ? t('lSalaLed') : t('lPantsLed')) + ' ' + mo.crm + ' · ' + med + ' · ' + t('cabs')(fmt(T2.cab, 0)) + '\n' + semTxt + (ajTxt ? ' ' + ajTxt : '') + '\n' + [t('kCal') + ': P' + pt + ' · ' + t('kLienzo')(fmt(T2.lienzoW, 0), fmt(T2.lienzoH, 0)), T2.kw > 0 ? t('kElec') + ': ' + fmt(T2.kw, 2) + ' kW' : '', T2.peso > 0 ? t('kPeso') + ': ' + fmt(T2.peso, 0) + ' kg' : '', pr && pr.modelo ? t('kCtrl') + ': ' + pr.modelo : ''].filter(Boolean).join('\n');
  return cabRes(true) + linea(l1, l2) + semHtml(sem, semTxt, btAvisos(AV.length), ajTxt) + `<div class="ss-cifras" style="--n:${C5.length}">${C5.join('')}</div>`;
}
function resProy() {
  const m = modoCons();
  if (m === 'salaLed' || m === 'variasLed') return resLedC(m);
  if (m === 'led' || m === 'varias') return cabRes(false) + `<div class="ss-acc ss-acc-solo">` + (m === 'led' ? `<button type="button" class="ss-bt2" data-ss="ir-led">${ic('led')}<span class="ss-fit">${esc(t('unaLed'))}</span></button><button type="button" class="ss-bt2" data-ss="ir-proy">${ic('proy')}<span class="ss-fit">${esc(t('unProy'))}</span></button>` : `<button type="button" class="ss-bt2" data-ss="ir-proy">${ic('pared')}<span class="ss-fit">${esc(t('unProy'))}</span></button><button type="button" class="ss-bt2" data-ss="ir-sala">${ic('cubo')}<span class="ss-fit">${esc(t('salaEntera'))}</span></button>`) + `<button type="button" class="ss-bt2 ss-pro" data-ss="pro">${ic('pro')}<span class="ss-fit">${esc(t('verPro'))}</span></button></div>`;
  const c = C().c, E = C().E;
  if (!c || !c.filas || !c.filas.length || !c.proyector) return cabRes(false) + `<p class="ss-espera" data-crudo>${esc(t('calculando'))}</p>`;
  const f = c.filas.find((x) => x.s.tipo !== 'suelo') || c.filas[0], pr = c.proyector, n = c.tot.n, con = c.tot.contrasteMin, pos = f.pos || {};
  /* v10.63 · el veredicto es el del cálculo (el mismo que PRO): el aviso más grave en el semáforo y los demás en su ventana */
  const V = c.veredicto || { nivel: 'V', motivos: [] }, M = V.motivos, m0 = M[0], kj = c.consejo, lx = c.lx;
  const nomQ = (q) => [q.marca, q.modelo].filter(Boolean).join(' ') + (q.optica ? ' + ' + q.optica : ''), G = c.grupos && c.grupos.length ? c.grupos : [{ q: pr, n }];
  const nomb = G.length > 1 ? G.map((g) => g.n + ' × ' + nomQ(g.q)).join(' + ') : nomQ(pr);
  AV = M.map((x) => ({ n: x.n, txt: x.k === 'consejo' ? t('noVale')(kj.nombre) : x.k === 'oos' ? t('semOos') : x.txt }));
  const conR = Math.round(con * 10) / 10, semC = conR >= 15 ? 'V' : conR >= 7 ? 'A' : 'R', sem = V.nivel, semTxt = m0 ? AV[0].txt : t('semV');
  const soloOos = M.length === 1 && m0.k === 'oos', semBt = soloOos ? `<button type="button" class="ss-mini" data-ss="oos-no">${esc(t('quitar'))}</button>` : btAvisos(M.length, !!(kj || c.unaImagen || c.multiPosible || (c.multi && E.proy.multi)));
  /* la línea: el proyector y, detrás, la imagen (o la sala) y cuántos hacen falta, sin repetir el número */
  const vert = c.filas.some((x) => x.p && x.p.vert) ? ' · ' + t('vVert') : '';
  const l1 = esc(m === 'sala' ? t('lSala') : t('lProy')) + ' <b>' + esc(nomb) + '</b>';
  const l2 = m === 'sala' ? esc(nb(`${fm(E.esp.ancho)} × ${fm(E.esp.fondo)} × ${fm(E.esp.alto)} m · ${PAREDES.filter((p) => E.esp.paredes[p]).map((p) => t(p)).join(', ')} · ${t('proys')(n)}${vert}`))
    : esc(nb(`${fm(f.s.ancho)} × ${fm(f.s.alto)} m · ${fmt(Math.hypot(f.s.ancho, f.s.alto) / .0254)}″ · ${t('proys')(n)}${vert}`));
  /* las mismas cifras que PRO: lúmenes TOTALES (debajo, cuántos de cada modelo), el lienzo completo y el contraste con el color de su valor */
  const lmTot = c.tot.lumenes > 0 ? c.tot.lumenes : pr.lumens, lz = n > 1 && c.tot.lienzoW > 0 && c.tot.lienzoH > 0, lmSub = n > 1 ? G.map((g) => fmt(g.n, 0) + ' × ' + fmt(g.q.lumens, 0)).join(' + ') + ' lm' : pr.optica ? t('kOpt')(pr.optica) : t('kLumS1');
  const conTxt = isFinite(con) ? fmt(con, 1, 0) : '∞';   /* v10.63 · como PRO: «7:1», no «7,0:1» */
  const C5 = [cifra(t('kLum'), fmt(lmTot, 0), 'lm', lmSub, 'bombilla', 'var(--ss-ambar)'),
    cifra(t('kCon'), conTxt, ':1', t('kConS')(fmt(lx, 0)), 'contraste', semC === 'V' ? 'var(--ss-acento)' : semC === 'A' ? 'var(--ss-ambar)' : 'var(--ss-rojo)')];
  if (m === 'sala') { if (c.tot.nitsMin > 0) C5.push(cifra(t('kBri'), fmt(c.tot.nitsMin, 0), 'nits', t('kBriS'), 'sol', 'var(--ss-acento)')); }
  else if (pos.dist > 0) C5.push(cifra(m === 'mapping' ? t('kDisF') : t('kDis'), fm(pos.dist), 'm', m === 'pared' ? (pos.apoyo ? t('kDisA') : t('kDisC')) : '', 'dist', 'var(--ss-azul)'));
  if (lz) C5.push(cifra(t('kRes'), fmt(c.tot.lienzoW, 0).replace(/\./g, '') + '×' + fmt(c.tot.lienzoH, 0).replace(/\./g, ''), 'px', fmt(n, 0) + ' × ' + (String(pr.resTxt || '').split('(')[0].trim() || pr.resX + '×' + pr.resY), 'calidad', 'var(--ss-violeta-t)'));
  else if (pr.resX > 0 && pr.resY > 0) C5.push(cifra(t('kRes'), String(pr.resTxt || '').split('(')[0].trim() || pr.resX + '×' + pr.resY, '', t('kResS')(pr.resX, pr.resY), 'calidad', 'var(--ss-violeta-t)'));
  TXT = (m === 'sala' ? t('lSala') : t('lProy')) + ' ' + nomb + ' · ' + t('proys')(n) + '\n' + semTxt + (AV.length > 1 ? '\n' + AV.slice(1).map((x) => '· ' + x.txt).join('\n') : '') + '\n' + t('kLum') + ': ' + fmt(lmTot, 0) + ' lm' + (n > 1 ? ' (' + lmSub + ')' : '') + '\n' + t('kCon') + ': ' + conTxt + ':1';
  return cabRes(true) + linea(l1, l2) + semHtml(sem, semTxt, semBt) + `<div class="ss-cifras" style="--n:${C5.length}">${C5.join('')}</div>`;
}
function pintaRes() { const el = document.getElementById('ss-res'); if (!el) return; TXT = ''; el.innerHTML = listo() ? (PAG === 'portada' ? resLed() : resProy()) : cabRes(false) + (FALLO ? '' : espera()); }   /* el aviso de fallo, una sola vez (en LO QUE PIDES) */

/* el texto nunca se parte ni se corta: si no cabe, la letra se reduce */
function encaja(r) { if (!r) return; r.querySelectorAll('.ss-fit').forEach((el) => { el.style.removeProperty('font-size'); if (!el.clientWidth) return; let fs = parseFloat(getComputedStyle(el).fontSize), k = 0; while (el.scrollWidth > el.clientWidth + 1 && fs > 7 && k++ < 40) { fs -= .5; el.style.fontSize = fs + 'px'; } }); }

function pinta() {
  if (vista !== 'simple') return;
  if (!cuerpoNuevo()) return;   /* la portada aún no ha montado su plantilla */
  raizNueva(); cuerpo.hidden = false;
  if (montado !== LG() || !cuerpo.querySelector('#ss-resumen')) monta();
  pintaResumen(); pintaSim(); pintaRes(); encaja(cuerpo);
  if (W) pintaAsis();
  if (primera && listo()) { primera = false; arranque(); }
}
function aviso() { if (vista !== 'simple') return; cancelAnimationFrame(tPinta); tPinta = requestAnimationFrame(pinta); }
let tRes = 0; addEventListener('resize', () => { ponApila(); clearTimeout(tRes); tRes = setTimeout(() => { if (vista === 'simple' && cuerpo) { pintaSim(); encaja(cuerpo); } }, 120); });
[MQ_MOV, MQ_BK].forEach((q) => { try { q.addEventListener('change', () => { ponApila(); aviso(); }); } catch (e) {} });

/* ---------- el asistente ---------- */
const PREG = {
  /* rama LED (portada) */
  donde: { rama: 'led', ic: 'casa', t: 'qDonde', op: () => [['INDOOR', 'oIn', 'casa'], ['OUTDOOR', 'oOut', 'calle'], ['ESCAPARATE', 'oEsc', 'escaparate']], val: () => ED().tipo,
    pon: (v) => { const E = ED(); if (E.tipo !== v) { E.tipo = v; E.nitsMin = 0; E.crm = ''; E.sol = ''; if (v !== 'OUTDOOR') E.gold = false; if (v !== 'INDOOR') E.protegido = false; } } },
  sol: { rama: 'led', si: () => ED().tipo !== 'INDOOR', t: 'qSol', op: () => [['directo', 'oSolD', 'sol'], ['indirecto', 'oSolI', 'sombra'], ['nose', 'oSolN', 'duda']], val: () => ED().sol || '',
    pon: (v) => { const E = ED(); E.sol = v === 'indirecto' ? 'indirecto' : 'directo'; E.nitsMin = 0; E.crm = ''; } },
  mar: { rama: 'led', si: () => ED().tipo === 'OUTDOOR', t: 'qMar', op: () => [[true, 'oMarSi', 'mar'], [false, 'oMarNo', 'nada']], val: () => !!ED().gold, pon: (v) => { const E = ED(); E.gold = !!v; E.crm = ''; } },
  uso: { rama: 'led', t: 'qUso', op: () => [['INSTALL', 'oFija', 'pin'], ['RENTAL', 'oRental', 'camion']], val: () => ED().clase, pon: (v) => { const E = ED(); if (E.clase !== v) { E.clase = v; E.crm = ''; } } },
  medida: { rama: 'led', t: 'qMed', ay: 'ayMed', num: () => [['w', t('ancho'), ED().w, .3, 100, 'm'], ['h', t('alto'), ED().h, .2, 60, 'm']], tele: true,
    pon: (v) => { const E = ED(); if (v.w) E.w = v.w; if (v.h) E.h = v.h; if (v.tele) E.h = Math.round(E.w * 9 / 16 * 100) / 100; } },
  dist: { rama: 'led', t: 'qDist', ay: 'ayDist', op: () => [[1.5, 'd1', 'ojo'], [3, 'd2', 'ojo'], [7, 'd3', 'ojo'], [15, 'd4', 'ojo']], val: () => +ED().dist || 0,
    num: () => [['d', t('metros'), ED().dist || '', .5, 200, 'm', true]], nose: () => t('dNoSe')(distDef()),
    pon: (v) => { const E = ED(); E.dist = typeof v === 'object' ? (v.d || 0) : v === 'nose' ? 0 : v; E.pitch = 0; E.pitchOtros = []; E.crm = ''; } },
  lpitch: { rama: 'led', si: () => false, t: 'qPitch', ay: 'ayPitch', num: () => [['p', t('sPitch'), +ED().pitch || '', .5, 20, 'mm', true]], nose: () => t('noSePitch'),
    pon: (v) => { const E = ED(), p = typeof v === 'object' ? +v.p || 0 : 0; E.pitch = p; E.pitchOtros = []; E.crm = ''; } },
  tocar: { rama: 'led', si: () => ED().tipo === 'INDOOR', t: 'qToca', op: () => [[true, 'oTocaSi', 'mano'], [false, 'oTocaNo', 'escudo']], val: () => !!ED().protegido, pon: (v) => { const E = ED(); E.protegido = !!v; E.crm = ''; } },
  altura: { rama: 'led', t: 'qAlt', op: () => [[0, 'a0', 'altura'], [80, 'a80', 'mesa'], [200, 'a200', 'altura']], val: () => +ED().elev,
    num: () => [['e', t('cms'), ED().elev, 0, 3000, 'cm', true]], pon: (v) => { const E = ED(); E.elev = typeof v === 'object' ? Math.round(v.e || 0) : v; } },
  /* v10.55 · rama LED de varias pantallas o sala entera (consola). «ltipo» es también el primer paso del LED en la portada */
  ltipo: { rama: 'ledc', t: 'qLtipo', op: () => [['una', 'oLuna', 'led'], ['varias', 'oLvarias', 'pared'], ['sala', 'oLsala', 'cubo']], val: () => (PAG === 'portada' ? 'una' : modoCons() === 'salaLed' ? 'sala' : modoCons() === 'variasLed' ? 'varias' : null), pon: () => {} },
  ltam: { rama: 'ledc', t: () => (modoCons() === 'salaLed' ? 'qSala' : 'qPants'), ay: () => (modoCons() === 'salaLed' ? '' : 'ayPants'), paredes: () => modoCons() === 'salaLed',
    /* v10.63 · varias LED: hasta 4, cada una con su medida (pants) */
    num: () => { const e = ED().esp; return modoCons() === 'salaLed' ? [['a', t('ancho'), e.ancho, 1, 60, 'm'], ['f', t('fondo'), e.fondo, 1, 60, 'm'], ['h', t('alto'), e.alto, 1.5, 20, 'm']] : []; }, pants: () => modoCons() === 'variasLed',
    pon: (v) => { const E = ED(), e = E.esp; if (typeof v !== 'object') return; if (modoCons() === 'salaLed') { if (v.a) e.ancho = v.a; if (v.f) e.fondo = v.f; if (v.h) e.alto = v.h; } else { const q = e.sueltas, L = tamsDe(q); L.forEach((x, i) => { if (v['w' + i]) x[0] = v['w' + i]; if (v['h' + i]) x[1] = v['h' + i]; }); q.tams = L; q.ancho = L[0][0]; q.alto = L[0][1]; } } },
  ldonde: { rama: 'ledc', si: () => modoCons() === 'variasLed', t: 'qDondeV', op: () => [['INDOOR', 'oIn', 'casa'], ['OUTDOOR', 'oOut', 'calle'], ['ESCAPARATE', 'oEsc', 'escaparate']], val: () => ED().led.tipo,
    pon: (v) => { const L = ED().led; if (L.tipo !== v) { L.tipo = v; L.crm = ''; L.nitsMin = 0; L.sol = ''; } } },
  luso: { rama: 'ledc', t: () => (modoCons() === 'salaLed' ? 'qUso' : 'qUsoV'), op: () => [['INSTALL', 'oFija', 'pin'], ['RENTAL', 'oRental', 'camion']], val: () => ED().led.clase, pon: (v) => { const L = ED().led; if (L.clase !== v) { L.clase = v; L.crm = ''; } } },
  ldist: { rama: 'ledc', si: () => modoCons() === 'variasLed', t: 'qDist', ay: 'ayDist', op: () => [[1.5, 'd1', 'ojo'], [3, 'd2', 'ojo'], [7, 'd3', 'ojo'], [15, 'd4', 'ojo']], val: () => +ED().esp.sueltas.dist || 0,
    num: () => [['d', t('metros'), ED().esp.sueltas.dist || '', .5, 200, 'm', true]], pon: (v) => { const E = ED(), d = typeof v === 'object' ? v.d : v; if (d > 0) { E.esp.sueltas.dist = d; E.led.crm = ''; } } },
  /* rama PROYECTOR (consola) */
  ptipo: { rama: 'proy', t: 'qPtipo', op: () => [['pared', 'pPared', 'pared'], ['mapping', 'pMap', 'edificio'], ['sala', 'pSala', 'cubo']], val: () => (modoCons() === 'sala' ? 'sala' : modoCons() === 'mapping' ? 'mapping' : 'pared'),
    pon: (v) => { const E = ED(), antes = modoCons(); E.tecnologia = 'proy'; if (v === 'sala') { E.cantidad = 'varias'; E.esp.tipo = 'sala'; } else { E.cantidad = 'una'; E.esp.tipo = 'sueltas'; E.proy.tipo = v; } if (v === 'mapping' && antes !== 'mapping' && C().mapping) C().mapping(); } },   /* v10.63 · la luz no cambia sola; el mapping arranca con 6 m de alto y a 6 m */
  ptam: { rama: 'proy', t: () => (modoCons() === 'sala' ? 'qSala' : 'qPtam'), ay: () => (modoCons() === 'sala' ? '' : 'ayPtam'), tele: () => modoCons() !== 'sala',
    num: () => (modoCons() === 'sala' ? [['a', t('ancho'), ED().esp.ancho, 1, 60, 'm'], ['f', t('fondo'), ED().esp.fondo, 1, 60, 'm'], ['h', t('alto'), ED().esp.alto, 1.5, 20, 'm']] : [['w', t('ancho'), ED().esp.sueltas.ancho, .5, 200, 'm'], ['h', t('alto'), ED().esp.sueltas.alto, .3, 120, 'm']]),
    paredes: () => modoCons() === 'sala',
    pon: (v) => { const E = ED(); if (modoCons() === 'sala') { if (v.a) E.esp.ancho = v.a; if (v.f) E.esp.fondo = v.f; if (v.h) E.esp.alto = v.h; } else { const s = E.esp.sueltas; if (v.w) s.ancho = v.w; if (v.h) s.alto = v.h; if (v.tele) s.alto = Math.round(s.ancho * 9 / 16 * 100) / 100; } } },
  /* v10.63 · los escalones de Epson, o a mano (0 lx es 0) */
  luz: { rama: 'proy', t: 'qLuz', ay: 'ayLuz', op: () => LUCES.map((l) => [l[0], l[2], l[3]]), val: () => { const l = luzDe(ED()); return l ? l[0] : null; },
    num: () => [['lx', t('luxMano'), luzDe(ED()) ? '' : Number(ED().proy.lux), 0, 5000, 'lx', true]],
    pon: (v) => { const P = ED().proy; if (typeof v === 'object') { if (v.lx != null) { P.lux = v.lx; P.luzUso = ''; } return; } const l = LUCES.find((x) => x[0] === v); if (l) { P.lux = l[1]; P.luzUso = l[0]; } } },
  pub: { rama: 'proy', si: () => modoCons() === 'pared', t: 'qPub', ay: 'ayPub', num: () => [['d', t('metros'), ED().proy.pubNS ? '' : ED().esp.sueltas.dist, 1, 100, 'm']], nose: () => t('noSePub'),
    /* v10.54 · «no lo sé»: el proyector va al centro de lo que permite su óptica (se cuenta 5 m para el resto) */
    pon: (v) => { const E = ED(), n = typeof v === 'object' && v.d > 0; E.esp.sueltas.dist = n ? v.d : 5; E.proy.pubNS = !n; } },
  mont: { rama: 'proy', si: () => modoCons() !== 'mapping', t: 'qMont', op: () => [['colgado', 'mCol', 'techo'], ['apoyado', 'mApo', 'mesa'], ['auto', 'mAuto', 'chispa']], val: () => ED().proy.montaje || 'auto', pon: (v) => { ED().proy.montaje = v; } },
  techo: { rama: 'proy', si: () => modoCons() === 'pared' && ED().proy.montaje === 'colgado', t: 'qTecho', num: () => [['h', t('alto'), ED().esp.sueltas.techo || 3, 2, 30, 'm']], nose: () => t('noSe3'),
    pon: (v) => { ED().esp.sueltas.techo = typeof v === 'object' ? (v.h || 3) : 3; } },
  /* v10.54 · dónde cabe el proyector: de qué distancia a qué distancia de la imagen se puede instalar (lo mismo en los dos = un sitio fijo).
     Decide la óptica; si el proyector o la óptica están elegidos a mano y no pueden, se dice en el resultado (no se cambian solos) */
  pcabe: { rama: 'proy', si: () => modoCons() === 'pared' || modoCons() === 'mapping', t: 'qCabe', ay: 'ayCabe',
    num: () => { const p = ED().proy, d = Number(p.dist) || 0; return [['a', t('minimo'), d || Number(p.distMin) || '', .2, 200, 'm'], ['b', t('maximo'), d || Number(p.distMax) || '', .2, 200, 'm']]; }, nose: () => t('noSeCabe'),
    pon: (v) => { const E = ED(); let a = typeof v === 'object' ? (v.a || 0) : 0, b = typeof v === 'object' ? (v.b || 0) : 0; if (a && b && a > b) { const x = a; a = b; b = x; } a = Math.round(a * 100) / 100; b = Math.round(b * 100) / 100;
      if (a && a === b) { E.proy.dist = a; E.proy.distMin = 0; E.proy.distMax = 0; } else { E.proy.dist = 0; E.proy.distMin = a; E.proy.distMax = b; } } },
  /* fuera del asistente (solo desde LO QUE PIDES): la óptica, las marcas y qué hacer cuando el proyector elegido no puede */
  popt: { rama: 'proy', si: () => lentes().length > 0, t: 'qOpt', ay: 'ayOpt',
    op: () => { const nw = anchoNat(); return [['', t('oAuto'), 'chispa']].concat(lentes().map((q) => [q.optica, [q.optica + ' · ' + trTxt(q), nw > 0 ? t('oOptD')(fm(q.trMin * nw), fm(q.trMax * nw)) : ''], 'proy'])); },
    val: () => ED().proy.optica || '',
    pon: (v) => { const E = ED(), c = proyC(); if (v) { if (c) E.proy.cuerpo = c.proyector.modelo; E.proy.optica = v; } else { E.proy.optica = ''; E.proy.cuerpo = C().DEF().proy.cuerpo; } } },
  pmarca: { rama: 'proy', t: 'qMarca', ay: 'ayMarca', marcas: () => true, pon: () => {} },
  /* v10.63 · los avisos del veredicto (los mismos que PRO) y, debajo, lo que se puede hacer para corregirlos */
  pconsejo: { t: () => (PAG === 'consola' && proyC() && proyC().consejo ? 'qConsejo' : 'qAvisos'), avisos: true,
    op: () => { const c = PAG === 'consola' && !esLedC() ? proyC() : null, k = c && c.consejo, o = []; if (!c) return o;
      if (k && k.alt) { const q = k.alt; o.push(['alt', [t('cAlt')([q.marca, q.nombre].filter(Boolean).join(' ')), t('cAltS')([q.lumens > 0 ? fmt(q.lumens, 0) + ' lm' : '', String(q.resTxt || '').split('(')[0].trim()].filter(Boolean).join(' · '))], 'proy']); }
      if (c.unaImagen) { const q = c.unaImagen; o.push(['una', [t('cAlt')([q.marca, q.nombre].filter(Boolean).join(' ')), t('cUnaS') + (q.lumens > 0 ? ' · ' + fmt(q.lumens, 0) + ' lm' : '')], 'proy']); }
      if (c.multiPosible) o.push(['multi', [t('cMulti')(c.multiPosible.n), t('cMultiS')], 'proy']);   /* v10.66 */
      if (c.multi && ED().proy.multi) o.push(['unasola', t('cUnaSola'), 'proy']);
      if (k && k.oos) o.push(['oos', [t('cOos'), t('cOosS')], 'alerta']);
      if (ED().proy.oos) o.push(['oosno', t('cOosNo'), 'alerta']);
      if (k || ED().proy.cuerpo || ED().proy.optica) o.push(['auto', [t('cAuto'), t('cAutoS')], 'chispa']); return o; },
    val: () => null,
    pon: (v) => { const E = ED(), c = proyC(), k = c && c.consejo; if (v === 'alt' && k && k.alt) { E.proy.cuerpo = k.alt.modelo; E.proy.optica = k.alt.optica || ''; } else if (v === 'una' && c && c.unaImagen) { E.proy.cuerpo = c.unaImagen.modelo; E.proy.optica = c.unaImagen.optica || ''; } else if (v === 'multi') E.proy.multi = true; else if (v === 'unasola') E.proy.multi = false; else if (v === 'oos') E.proy.oos = true; else if (v === 'oosno') E.proy.oos = false; else if (v === 'auto') { E.proy.cuerpo = C().DEF().proy.cuerpo; E.proy.optica = ''; } } }
};
const RAMA = { led: ['ltipo', 'donde', 'sol', 'mar', 'uso', 'medida', 'dist', 'tocar', 'altura'], ledc: ['ltipo', 'ltam', 'ldonde', 'luso', 'ldist'], proy: ['ptipo', 'ptam', 'luz', 'pub', 'pcabe', 'mont', 'techo'] };
const visibles = (r) => RAMA[r].filter((id) => !PREG[id].si || PREG[id].si());
const tx = (v) => (typeof v === 'function' ? v() : v);

function abre(paso, full, rama) { raizNueva(); W = { paso, full: !!full, rama: rama || (PREG[paso] && PREG[paso].rama) || null, hist: [], ayuda: '' }; pintaAsis(); }
function cierra(hecho) { if (hecho !== false) pon(K_ASIS, '1'); W = null; const a = document.getElementById('ss-asis'); if (a) a.innerHTML = ''; if (raiz) raiz.classList.remove('ss-con-asis'); aviso(); const f = cuerpo && cuerpo.querySelector('.ss-fila'); if (f) f.focus({ preventScroll: true }); }
function va(paso) { if (!W) return; W.hist.push(W.paso); W.paso = paso; pintaAsis(); }
function siguiente() {
  if (!W) return;
  if (!W.full) { cierra(); return; }
  const lista = visibles(W.rama), i = lista.indexOf(W.paso);
  if (i >= 0 && i < lista.length - 1) va(lista[i + 1]); else va('fin');
}
/* elegir rama: si la rama vive en la otra página, se va allí con el asistente abierto en su primera pregunta */
function rama(r) {
  if (r === 'led' && PAG !== 'portada') r = 'ledc';   /* v10.55 · en la consola, la rama LED es la de varias pantallas o sala (una sola lleva a la portada) */
  if (r === 'proy' && PAG !== 'consola') { location.href = RAIZ + 'vista/consola.html?modo=una-proy&vista=simple&asis=proy'; return; }
  if (r === 'proy') { const E = ED(); if (E.tecnologia !== 'proy' || modoCons() === 'varias') { E.tecnologia = 'proy'; E.cantidad = 'una'; E.esp.tipo = 'sueltas'; recalc(); } }
  W.rama = r; va(visibles(r)[0]);
}
function pintaAsis() {
  const el = document.getElementById('ss-asis'); if (!el || !W) return;
  raiz.classList.add('ss-con-asis');
  const Lx = T[LG()], p = W.paso, q = PREG[p];
  let cuerpoA = '', pie = '', cont = '';
  const opcion = (v, k, icono, sel, extra) => { const tx2 = Array.isArray(k) ? k : Lx[k]; return `<button type="button" class="ss-op${sel ? ' on' : ''}" data-ss-op='${esc(JSON.stringify(v))}' aria-pressed="${!!sel}">${ic(icono)}<span class="ss-op-t"><b class="ss-fit">${esc(tx2[0])}</b>${tx2[1] ? `<small>${esc(tx2[1])}</small>` : ''}</span>${extra || ''}</button>`; };
  if (p === 'que') {
    cuerpoA = `<p class="ss-hola">${esc(Lx.hola)}</p><h2 class="ss-q" id="ss-q">${esc(Lx.q0)}</h2><div class="ss-ops ss-ops3">${opcion('led', 'o0led', 'led')}${opcion('proy', 'o0proy', 'proy')}${opcion('no', 'o0no', 'duda')}</div>`;
  } else if (p === 'calle') {
    cuerpoA = `<h2 class="ss-q" id="ss-q">${esc(Lx.qCalle)}</h2><div class="ss-ops ss-ops2">${opcion(true, [Lx.si], 'sol')}${opcion(false, [Lx.no], 'casa')}</div>`;
  } else if (p === 'oscuro') {
    cuerpoA = `<h2 class="ss-q" id="ss-q">${esc(Lx.qOscuro)}</h2><div class="ss-ops ss-ops2">${opcion(true, [Lx.si], 'luna')}${opcion(false, [Lx.no], 'bombilla')}</div>`;
  } else if (p === 'rec') {
    const led = W.rec !== 'proy';
    cuerpoA = `<div class="ss-rec">${ic(led ? 'led' : 'proy')}<h2 class="ss-q" id="ss-q">${esc(led ? Lx.recLed : Lx.recProy)}</h2><p class="ss-ay">${esc(led ? (W.ayuda === 'calle' ? Lx.recLedCalle : Lx.recLedLuz) : Lx.recProyT)}</p></div>`;
    pie = `<button type="button" class="ss-sig" data-ss="rec-sigue"><span class="ss-fit">${esc(Lx.seguir)}</span></button>`;
  } else if (p === 'fin') {
    cuerpoA = `<div class="ss-rec">${ic('ok')}<h2 class="ss-q" id="ss-q">${esc(Lx.finT)}</h2><p class="ss-ay">${esc(Lx.finS)}</p></div>`;
    pie = `<button type="button" class="ss-sig" data-ss="fin"><span class="ss-fit">${esc(Lx.ver)}</span></button>`;
  } else if (q) {
    const ay = tx(q.ay), vals = q.val ? q.val() : null, ops = q.op ? q.op() : [], nums = q.num ? q.num() : [], mucho = ops.length >= 4;
    cuerpoA = `<h2 class="ss-q" id="ss-q">${esc(Lx[tx(q.t)])}</h2>${ay ? `<p class="ss-ay">${esc(typeof Lx[ay] === 'string' ? Lx[ay] : ay)}</p>` : ''}`;
    if (q.avisos) { cuerpoA += `<ul class="ss-avisos">${AV.map((x) => `<li class="ss-av-${x.n}"${x.crudo === false ? '' : ''}>${esc(x.txt)}</li>`).join('')}</ul>`;
      pie = `<button type="button" class="ss-sig" data-ss="pro"><span class="ss-fit">${esc(Lx.enPro)}</span></button>`; }
    if (q.pants && q.pants()) { const sL = ED().esp.sueltas, L = tamsDe(sL);
      cuerpoA += `<div class="ss-pars" role="group" aria-label="${esc(Lx.cuantas)}">${[2, 3, 4].map((k) => `<button type="button" class="ss-par${L.length === k ? ' on' : ''}" data-ss-pn="${k}" aria-pressed="${L.length === k}"><span class="ss-fit">${k}</span></button>`).join('')}</div>`;
      cuerpoA += `<div class="ss-pants">${L.map((x, i) => `<span class="ss-pant-k ss-fit">${esc(Lx.pantK(i + 1))}</span>` + [['w', Lx.ancho, x[0], .3, 100], ['h', Lx.alto, x[1], .2, 60]].map((n2) => `<label class="ss-num"><span class="ss-fit">${esc(n2[1])}</span><span class="ss-num-c"><input type="text" inputmode="decimal" data-ss-n="${n2[0] + i}" value="${esc(fm(n2[2]))}" data-min="${n2[3]}" data-max="${n2[4]}" aria-label="${esc(Lx.pantK(i + 1) + ' · ' + n2[1])}"><i>m</i></span></label>`).join('')).join('')}</div>`;
      pie = `<button type="button" class="ss-sig" data-ss="num-ok"><span class="ss-fit">${esc(W.full ? Lx.sig : Lx.listo)}</span></button>`; }
    /* v10.57 · con más de 12 opciones (un proyector con muchas ópticas), en lista de tres columnas: caben todas sin desplazar la ventana
       (con las fichas grandes, cuatro filas ya no cabían en pantallas de 720 de alto ni en la tableta) */
    if (ops.length) cuerpoA += `<div class="ss-ops ${ops.length > 12 ? 'ss-ops3 ss-ops-lista' : mucho ? 'ss-ops4' : ops.length === 2 ? 'ss-ops2' : 'ss-ops3'}">${ops.map((o) => opcion(o[0], o[1], o[2], vals !== null && JSON.stringify(vals) === JSON.stringify(o[0]))).join('')}</div>`;
    if (nums.length) {
      const solo = nums.length === 1 && nums[0][6];
      cuerpoA += `<div class="ss-nums${solo ? ' ss-nums-o' : ''}">${nums.map((n) => `<label class="ss-num"><span class="ss-fit">${esc(n[1])}</span><span class="ss-num-c"><input type="text" inputmode="decimal" data-ss-n="${n[0]}" value="${n[2] === '' || n[2] == null ? '' : esc(fm(n[2]))}" data-min="${n[3]}" data-max="${n[4]}" aria-label="${esc(n[1])}"><i>${esc(n[5])}</i></span></label>`).join('')}${solo ? `<button type="button" class="ss-mini ss-grande" data-ss="num-ok">${esc(Lx.sig)}</button>` : ''}</div>`;
      if (tx(q.tele)) cuerpoA += `<button type="button" class="ss-op ss-op-l" data-ss="tele">${ic('tele')}<span class="ss-op-t"><b class="ss-fit">${esc(Lx.tele)}</b></span></button>`;
      if (q.paredes && q.paredes()) { const E = ED(); cuerpoA += `<p class="ss-ay">${esc(Lx.paredes)}</p><div class="ss-pars">${PAREDES.filter((pp) => !(esLedC() && pp === 'suelo')).map((pp) => `<button type="button" class="ss-par${E.esp.paredes[pp] ? ' on' : ''}" data-ss-par="${pp}" aria-pressed="${!!E.esp.paredes[pp]}"><span class="ss-fit">${esc(Lx[pp])}</span></button>`).join('')}</div>`; }
      if (!solo) pie = `<button type="button" class="ss-sig" data-ss="num-ok"><span class="ss-fit">${esc(W.full ? Lx.sig : Lx.listo)}</span></button>`;
    }
    if (q.marcas && q.marcas()) { const act = C().marcas(); cuerpoA += `<div class="ss-pars">${C().MARCAS.map((mm) => `<button type="button" class="ss-par${act.includes(mm) ? ' on' : ''}" data-ss-marca="${esc(mm)}" aria-pressed="${act.includes(mm)}"><span class="ss-fit">${esc(mm)}</span></button>`).join('')}</div>`; pie = `<button type="button" class="ss-sig" data-ss="fin"><span class="ss-fit">${esc(Lx.listo)}</span></button>`; }
    if (q.nose) { const k = q.nose(); cuerpoA += `<button type="button" class="ss-op ss-op-l ss-op-nose" data-ss-op='"nose"'>${ic('duda')}<span class="ss-op-t"><b class="ss-fit">${esc(k[0])}</b>${k[1] ? `<small>${esc(k[1])}</small>` : ''}</span></button>`; }
    if (W.full && W.rama) { const lista = visibles(W.rama), i = lista.indexOf(p); if (i >= 0) cont = `<span class="ss-paso">${esc(Lx.paso(i + 1, lista.length))}</span><span class="ss-puntos">${lista.map((x, j) => `<i class="${j < i ? 'ya' : j === i ? 'on' : ''}"></i>`).join('')}</span>`; }
  }
  const atras = W.hist.length ? `<button type="button" class="ss-mini" data-ss="atras">${esc(Lx.atras)}</button>` : '';
  const salir = W.full ? `<button type="button" class="ss-mini ss-saltar" data-ss="saltar">${esc(Lx.saltar)}</button>` : `<button type="button" class="ss-x" data-ss="saltar" aria-label="${esc(Lx.cerrar)}">${ic('x')}</button>`;
  el.innerHTML = `<div class="ss-velo"></div><div class="ss-dlg" role="dialog" aria-modal="true" aria-labelledby="ss-q"><div class="ss-dlg-cab">${cont || '<span></span>'}${salir}</div><div class="ss-dlg-cu">${cuerpoA}</div><div class="ss-dlg-pie">${atras}${pie}</div></div>`;
  encaja(el);
  const f = el.querySelector('.ss-op.on, input[data-ss-n], .ss-op, .ss-sig'); if (f) f.focus({ preventScroll: true });
}
function leeNums() { const v = {}; let ok = true; document.querySelectorAll('#ss-asis input[data-ss-n]').forEach((i) => { const s = String(i.value).trim().replace(',', '.'); if (!s) return; const n = parseFloat(s); if (!isFinite(n) || n < +i.dataset.min || n > +i.dataset.max) { ok = false; i.classList.add('mal'); i.setAttribute('aria-invalid', 'true'); return; } v[i.dataset.ssN] = n; }); return ok ? v : null; }
/* la consola pasa a varias pantallas LED o a sala LED (la sala es siempre de interior) */
function ponLedC(sala) { const E = ED(); E.tecnologia = 'led'; E.cantidad = 'varias'; E.esp.tipo = sala ? 'sala' : 'sueltas'; if (sala && E.led.tipo !== 'INDOOR') { E.led.tipo = 'INDOOR'; E.led.crm = ''; E.led.nitsMin = 0; E.led.sol = ''; } }
function responde(v) {
  if (!W) return; const p = W.paso;
  if (p === 'que') { if (v === 'no') { va('calle'); return; } rama(v); return; }
  if (p === 'calle') { if (v) { W.rec = 'led'; W.ayuda = 'calle'; va('rec'); } else va('oscuro'); return; }
  if (p === 'oscuro') { W.rec = v ? 'proy' : 'led'; W.ayuda = 'luz'; va('rec'); return; }
  if (p === 'ltipo') {   /* v10.55 · una pantalla se calcula en la portada; varias o una sala, en la consola */
    if (v === 'una') { if (PAG === 'portada') { if (W.full) setTimeout(siguiente, 140); else cierra(); } else location.href = RAIZ + 'index.html?vista=simple' + (W.full ? '&asis=led' : ''); return; }
    if (PAG !== 'consola') { location.href = RAIZ + 'vista/consola.html?modo=varias-led&vista=simple&asis=' + (v === 'sala' ? 'leds' : 'ledv'); return; }
    ponLedC(v === 'sala'); recalc(); if (W.full) { W.rama = 'ledc'; setTimeout(siguiente, 140); } else setTimeout(() => cierra(), 140); return;
  }
  const q = PREG[p]; if (!q) return;
  q.pon(v); recalc();
  if (W.full) setTimeout(siguiente, 140); else setTimeout(() => cierra(), 140);
}

/* ---------- arranque: el asistente la primera vez (o al llegar de la otra página a mitad) ---------- */
function arranque() {
  if (vista !== 'simple') return;
  /* una petición escrita en la consola que resultó ser de una pantalla LED: se calcula aquí */
  if (PAG === 'portada') { const pp = lee(K_PIDE); if (pp) { pon(K_PIDE, null); const i = document.getElementById('pide'), b = document.getElementById('calcular'); if (i && b) { i.value = pp; b.click(); } } }
  if (ASIS_URL === 'led' && PAG === 'portada') { abre('donde', true, 'led'); return; }
  if (ASIS_URL === 'proy' && PAG === 'consola') { abre('ptipo', true, 'proy'); return; }
  if ((ASIS_URL === 'leds' || ASIS_URL === 'ledv') && PAG === 'consola') { ponLedC(ASIS_URL === 'leds'); C().actualizar(); abre('ltam', true, 'ledc'); return; }
  if (!lee(K_ASIS)) abre('que', true);
}

/* ---------- acciones ---------- */
function ponVista(v) {
  if (v === vista) { sincroniza(); return; }
  vista = v; pon(K_VISTA, v); document.documentElement.classList.toggle('sc-simple', v === 'simple');
  try { const q = new URLSearchParams(location.search); if (q.has('vista')) { q.set('vista', v); history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash); } } catch (e) {}
  if (v === 'simple') pinta();
  else {
    if (cuerpo) cuerpo.hidden = true; W = null; const a = document.getElementById('ss-asis'); if (a) a.innerHTML = '';
    /* PRO estaba oculto: se vuelve a pintar a su tamaño */
    if (PAG === 'portada' && B()) B().todo(); else if (PAG === 'consola' && C()) C().actualizar();
    requestAnimationFrame(() => dispatchEvent(new Event('resize')));
    /* la guía de PRO, la primera vez que se entra en PRO */
    if (PAG === 'portada' && !lee('screens-blocks-guia') && B()) setTimeout(() => B().guia(), 300);
    if (PAG === 'consola' && !lee('screens-consola-guia') && window.__consolaGuia) setTimeout(() => window.__consolaGuia(), 300);
  }
  sincroniza();
}
function sincroniza() {
  document.querySelectorAll('[data-ss-swc]').forEach((c) => { c.checked = vista === 'pro'; });
  document.querySelectorAll('.ss-bur').forEach((b) => { const pro = vista === 'pro'; b.dataset.ssSw = pro ? 'simple' : 'pro'; b.classList.toggle('pro', pro); b.innerHTML = '<i></i>' + (pro ? 'PRO' : 'SIMPLE'); });   /* v10.88 · burbuja del móvil */
  document.querySelectorAll('.ss-sw [data-ss-sw]').forEach((b) => { const on = b.dataset.ssSw === vista; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  document.querySelectorAll('.ss-sw').forEach((s) => { s.title = t('sw'); s.setAttribute('aria-label', t('sw')); });
}
document.addEventListener('change', (e) => { const c = e.target.closest && e.target.closest('[data-ss-swc]'); if (c) ponVista(c.checked ? 'pro' : 'simple'); });
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-ss-sw]'); if (b) { e.preventDefault(); ponVista(b.dataset.ssSw); } });
/* en la consola, una petición de una pantalla LED lleva a la portada: allí se calcula (también en SIMPLE) */
if (PAG === 'consola') {
  const guardaPide = () => { if (vista !== 'simple') return; const i = document.getElementById('nl-texto'), s = i ? i.value.trim() : ''; if (!s) return; pon(K_PIDE, s);
    setTimeout(() => { const E = C() && C().E; if (!E || !(E.cantidad === 'una' && E.tecnologia === 'led')) pon(K_PIDE, null); }, 0); };
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('[data-accion="nl-calcular"]')) guardaPide(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target && e.target.id === 'nl-texto') guardaPide(); }, true);
}
function compartir() {
  if (!TXT) return; const ok = () => tostada(t('copiado')), mal = () => tostada(t('noCopia'));
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(TXT).then(ok, mal); else mal();
}
let tTos = 0;
function tostada(s) { raizNueva(); let d = raiz.querySelector('.ss-tos'); if (!d) { d = document.createElement('div'); d.className = 'ss-tos'; d.setAttribute('role', 'status'); raiz.appendChild(d); } d.textContent = s; d.classList.add('on'); clearTimeout(tTos); tTos = setTimeout(() => d.classList.remove('on'), 3200); }
function clic(e) {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.ssOp != null) { let v; try { v = JSON.parse(b.dataset.ssOp); } catch (x) { v = b.dataset.ssOp; } responde(v); return; }
  if (b.dataset.ssQ) { abre(b.dataset.ssQ, false); return; }
  if (b.dataset.ssMarca) { if (C().marca(b.dataset.ssMarca)) { recalc(); pintaAsis(); } return; }
  if (b.dataset.ssPn) { const q = ED().esp.sueltas, v = leeNums() || {}, L = tamsDe(q); L.forEach((x, i) => { if (v['w' + i]) x[0] = v['w' + i]; if (v['h' + i]) x[1] = v['h' + i]; }); q.tams = L; q.n = +b.dataset.ssPn; q.tams = tamsDe(q); recalc(); pintaAsis(); return; }   /* v10.63 · cuántas pantallas LED (2 a 4) */
  if (b.dataset.ssPar) { const E = ED(), k = b.dataset.ssPar; E.esp.paredes[k] = !E.esp.paredes[k]; if (!PAREDES.some((p) => E.esp.paredes[p] && !(esLedC() && p === 'suelo'))) E.esp.paredes.frontal = true; recalc(); pintaAsis(); return; }
  const a = b.dataset.ss; if (!a) return;
  if (a === 'asis') abre('que', true);
  else if (a === 'pdf') { const x = PAG === 'portada' ? document.querySelector('[data-blk="H1R"] [data-pdf]') : document.getElementById('btn-pdf'); if (x) x.click(); }
  else if (a === 'compartir') compartir();
  else if (a === 'pro') ponVista('pro');
  else if (a === 'restablece') restablecePro();
  else if (a === 'oos-no') { ED().proy.oos = false; ED().proy.oosArr = false; recalc(); }
  else if (a === 'reintenta') { const x = document.querySelector('[data-reintenta], [data-accion="reintentar"]'); if (x) x.click(); }
  else if (a === 'recarga') location.reload();
  else if (a === 'ir-led') { location.href = RAIZ + 'index.html?vista=simple'; }
  else if (a === 'ir-proy') { const E = ED(); E.tecnologia = 'proy'; E.cantidad = 'una'; E.esp.tipo = 'sueltas'; C().actualizar(); }
  else if (a === 'ir-sala') { const E = ED(); E.tecnologia = 'proy'; E.cantidad = 'varias'; E.esp.tipo = 'sala'; C().actualizar(); }
  else if (a === 'saltar') cierra();
  else if (a === 'atras') { if (W && W.hist.length) { W.paso = W.hist.pop(); pintaAsis(); } }
  else if (a === 'rec-sigue') rama(W.rec === 'proy' ? 'proy' : 'led');
  else if (a === 'fin') cierra();
  else if (a === 'tele') { const v = leeNums() || {}; v.tele = true; responde(v); }
  else if (a === 'num-ok') { const v = leeNums(); if (v) responde(v); }
}
function tecla(e) {
  if (e.key === 'Escape' && W) { e.stopPropagation(); cierra(); return; }
  { const h = !W && e.target.closest && e.target.closest('[data-ss-arr]'); if (h && arrTecla(e, h)) return; }
  if (e.key === 'Enter' && e.target.matches && e.target.matches('input[data-ss-n]')) { e.preventDefault(); const v = leeNums(); if (v) responde(Object.keys(v).length ? v : 'nose'); }
}
function entrada(e) { if (e.target.matches && e.target.matches('input[data-ss-n]')) { e.target.classList.remove('mal'); e.target.removeAttribute('aria-invalid'); } }

/* ---------- el interruptor va junto al logo de PRO, en las dos páginas y en los dos modos ---------- */
window.SCSIMPLE = { activo: () => vista === 'simple', sw, aviso, vista: (v) => ponVista(v) };
if (PAG === 'consola') { const d = document.querySelector('.cab-izq'); if (d && !d.querySelector('.ss-sw')) d.insertAdjacentHTML('beforeend', sw()); }
/* en SIMPLE: la consola ya tiene su #app (el cuerpo va en su sitio); la portada lo pone al montar su plantilla (aviso desde una-led.js) */
if (vista === 'simple') { if (PAG === 'consola') pinta(); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aviso); else aviso(); }
/* si el cálculo no llega (sin conexión o una copia vieja de la página en caché), se dice y se puede volver a cargar */
setTimeout(() => { if (!listo()) { FALLO = true; aviso(); } }, 15000);
