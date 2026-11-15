/* SCREENS · modo SIMPLE (v10.49 beta)
   Una vista sencilla encima de la de siempre (PRO), con el mismo estado y el mismo cálculo: la portada (una pantalla LED, vista/una-led.js → window.__blocks)
   y la consola de proyección (screens/app.js → window.__consola). SIMPLE solo cambia cómo se piden y se enseñan los datos:
   - un asistente la primera vez (una pregunta por pantalla, botones grandes y siempre «No lo sé»), que se puede saltar;
   - un resumen editable (cada línea abre solo su pregunta), la simulación a escala y el resultado con semáforo y cuatro cifras;
   - el interruptor SIMPLE · PRO en la cabecera de las dos páginas (screens_vista en el navegador, ?vista=simple|pro en los enlaces).
   Quien ya usaba SCREENS (ya vio la guía de PRO) entra en PRO; quien llega por primera vez, en SIMPLE con el asistente.
   Textos propios en español, inglés y catalán. Licencia GPL-3.0 · mediaservi.com */
import { HUMAN_PATH } from '../screens/figura.js';

const VERSION = 'v10.49';
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

/* ---------- textos ---------- */
const T = {
  es: {
    sw: 'Modo SIMPLE o PRO', asisB: 'Hacerme las preguntas', idi: 'Idioma', tema: 'Gris oscuro o gris claro',
    phL: 'Escríbela: «pantalla de 3 × 2 a 4 m»', phP: 'Escríbela: «proyector para una pared de 4 × 2,5 m»', phCorto: 'Escríbela aquí…', pideA: 'Describe lo que necesitas', calc: 'CALCULAR →',
    tuLed: 'TU PANTALLA LED', tuProy: 'TU PROYECCIÓN', sim: 'SIMULACIÓN A ESCALA', res: 'RESULTADO', cambiar: 'Cambiar', repetir: 'REPETIR LAS PREGUNTAS',
    pdf: 'VER PDF', compartir: 'COMPARTIR', enPro: 'VER TODO EN PRO', copiado: 'Resumen copiado: pégalo donde quieras.', noCopia: 'No se ha podido copiar.',
    calculando: 'Calculando…', sinCat: 'No se ha podido leer el catálogo. Revisa la conexión.', reintentar: 'REINTENTAR', vacio: 'No hay pantallas para estos datos: cambia dónde va o el tamaño.',
    ajPro: (n) => (n === 1 ? '1 ajuste de PRO activo' : n + ' ajustes de PRO activos'), ajProT: 'Hay ajustes hechos en PRO que esta vista no enseña: por eso el resultado no es el automático.', restablecer: 'RESTABLECER',
    aviso: 'Cálculo automático que puede contener errores: revísalo antes de presupuestar o instalar.',
    soloLed: 'Varias pantallas LED o una sala LED solo se calculan en PRO.', soloVarias: 'Varias pantallas de proyección por separado solo se calculan en PRO.', verPro: 'VER EN PRO', unaLed: 'UNA PANTALLA LED', unProy: 'UNA PROYECCIÓN', salaEntera: 'UNA SALA ENTERA',
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
    d1: ['Muy cerca', 'Menos de 2 m'], d2: ['Como en una tienda', 'De 2 a 5 m'], d3: ['Desde lejos', 'De 5 a 10 m'], d4: ['Muy lejos', 'Más de 10 m'], metros: 'o escribe los metros', dNoSe: (m) => ['No lo sé', 'Cuento ' + m + ' m, lo normal'],
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
    finT: '¡Listo!', finS: 'Ya tienes el resultado. Toca cualquier dato del resumen para cambiarlo, o pasa a PRO para verlo todo.',
    sDonde: 'Dónde', sUso: 'Uso', sTam: 'Tamaño del hueco', sDist: 'Se mira desde', sToca: 'Se puede tocar', sAlt: 'Altura del suelo',
    vIn: 'Dentro', vOut: 'En la calle', vEsc: 'Escaparate', vSolD: 'sol directo', vSolI: 'sombra', vMar: 'junto al mar', vFija: 'Fija', vRental: 'Eventos', vNormal: 'lo normal', vSuelo: 'En el suelo',
    vPared: 'Pared o pantalla', vMap: 'Fachada', vSala: 'Sala entera', sImg: 'Imagen', sSala: 'Sala', sLuz: 'Luz', sPub: 'La gente mira desde', sMont: 'Proyector', sTecho: 'Techo',
    vCol: 'Colgado', vApo: 'Apoyado', vAuto: 'Donde mejor vaya',
    rTitL: (w, h) => 'Tu pantalla LED: ' + w + ' × ' + h + ' m', ajMenosW: (n) => n + ' cm menos de ancho', ajMasW: (n) => n + ' cm más de ancho', ajMenosH: (n) => n + ' cm menos de alto', ajMasH: (n) => n + ' cm más de alto', ajY: ' y ', ajFin: 'para usar piezas enteras',
    rNit: (d) => 'Se ve nítida desde ' + d + ' m.', rImg: (w, h, n) => 'Imagen de ' + w + ' × ' + h + ' píxeles' + (n ? ' (' + n + ')' : '') + '.',
    rPie: (n, m, s) => 'Hecha de ' + n + (n === 1 ? ' pieza' : ' piezas') + ' (cabinets ' + m + ', ' + s + ').', stock: 'en stock', pedido: 'bajo pedido',
    rPeso: (kg, kw, n) => 'Pesa ' + kg + ' kg y gasta como mucho ' + kw + ' kW: ' + n + (n === 1 ? ' línea' : ' líneas') + ' de 16 A.', semLedV: 'Encaja con lo que has pedido.',
    cMed: 'Medida', cPie: 'Piezas', cPeso: 'Peso', cCons: 'Consumo máx.',
    pTit: (n, m) => (n === 1 ? 'Necesitas 1 proyector ' : 'Necesitas ' + n + ' proyectores ') + m, pLum: (l, o, n) => 'De ' + l + ' lúmenes' + (n > 1 ? ' cada uno' : '') + (o ? ', con la óptica ' + o : '') + '.',
    pVaCol: (d) => 'Va colgado del techo a ' + d + ' m de la pared.', pVaApo: (d) => 'Va apoyado a ' + d + ' m de la pared.', pImg: (w, h) => 'La imagen mide ' + w + ' × ' + h + ' m.', pSup: 'Superficies: ',
    semV: 'Se verá bien con esta luz.', semA: (a) => 'Se verá algo lavada: ' + a + '.', semR: (a) => 'Se verá muy lavada: ' + a + '.', accLuz: 'baja la luz', accMas: 'haz la imagen más pequeña o añade un proyector',
    pNoCabe: 'No hay un buen sitio para el proyector con estas medidas: cambia la distancia o míralo en PRO.',
    cProy: 'Proyectores', cLum: 'Lúmenes', cDist: 'A la pared', cCon: 'Contraste', cBri: 'Brillo',
    pers: 'Persona de 1,75 m', proy: 'Proyector'
  },
  en: {
    sw: 'SIMPLE or PRO mode', asisB: 'Ask me the questions', idi: 'Language', tema: 'Dark or light grey',
    phL: 'Type it: “3 × 2 screen at 4 m”', phP: 'Type it: “projector for a 4 × 2.5 m wall”', phCorto: 'Type it here…', pideA: 'Describe what you need', calc: 'CALCULATE →',
    tuLed: 'YOUR LED SCREEN', tuProy: 'YOUR PROJECTION', sim: 'SCALE SIMULATION', res: 'RESULT', cambiar: 'Change', repetir: 'ASK THE QUESTIONS AGAIN',
    pdf: 'SEE PDF', compartir: 'SHARE', enPro: 'SEE EVERYTHING IN PRO', copiado: 'Summary copied: paste it anywhere.', noCopia: 'Could not copy.',
    calculando: 'Calculating…', sinCat: 'The catalogue could not be read. Check your connection.', reintentar: 'RETRY', vacio: 'No screens for these details: change where it goes or the size.',
    ajPro: (n) => (n === 1 ? '1 PRO setting on' : n + ' PRO settings on'), ajProT: 'There are settings made in PRO that this view does not show: that is why the result is not the automatic one.', restablecer: 'RESET',
    aviso: 'Automatic calculation that may contain errors: check it before quoting or installing.',
    soloLed: 'Several LED screens or an LED room are only calculated in PRO.', soloVarias: 'Several separate projection screens are only calculated in PRO.', verPro: 'SEE IN PRO', unaLed: 'ONE LED SCREEN', unProy: 'ONE PROJECTION', salaEntera: 'A WHOLE ROOM',
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
    d1: ['Very close', 'Under 2 m'], d2: ['Like in a shop', '2 to 5 m'], d3: ['From afar', '5 to 10 m'], d4: ['Very far', 'Over 10 m'], metros: 'or type the metres', dNoSe: (m) => ['I don’t know', 'I’ll assume ' + m + ' m, the usual'],
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
    finT: 'Done!', finS: 'Your result is ready. Tap any detail in the summary to change it, or switch to PRO to see everything.',
    sDonde: 'Where', sUso: 'Use', sTam: 'Space size', sDist: 'Viewed from', sToca: 'Can be touched', sAlt: 'Height off the floor',
    vIn: 'Indoors', vOut: 'Outdoors', vEsc: 'Shop window', vSolD: 'direct sun', vSolI: 'shade', vMar: 'by the sea', vFija: 'Fixed', vRental: 'Events', vNormal: 'the usual', vSuelo: 'On the floor',
    vPared: 'Wall or screen', vMap: 'Façade', vSala: 'Whole room', sImg: 'Image', sSala: 'Room', sLuz: 'Light', sPub: 'Audience at', sMont: 'Projector', sTecho: 'Ceiling',
    vCol: 'Hanging', vApo: 'On a table', vAuto: 'Wherever works best',
    rTitL: (w, h) => 'Your LED screen: ' + w + ' × ' + h + ' m', ajMenosW: (n) => n + ' cm narrower', ajMasW: (n) => n + ' cm wider', ajMenosH: (n) => n + ' cm shorter', ajMasH: (n) => n + ' cm taller', ajY: ' and ', ajFin: 'to use whole panels',
    rNit: (d) => 'Looks sharp from ' + d + ' m away.', rImg: (w, h, n) => 'Image of ' + w + ' × ' + h + ' pixels' + (n ? ' (' + n + ')' : '') + '.',
    rPie: (n, m, s) => 'Made of ' + n + (n === 1 ? ' panel' : ' panels') + ' (' + m + ' cabinets, ' + s + ').', stock: 'in stock', pedido: 'made to order',
    rPeso: (kg, kw, n) => 'It weighs ' + kg + ' kg and uses up to ' + kw + ' kW: ' + n + ' 16 A ' + (n === 1 ? 'line' : 'lines') + '.', semLedV: 'It fits what you asked for.',
    cMed: 'Size', cPie: 'Panels', cPeso: 'Weight', cCons: 'Max. power',
    pTit: (n, m) => (n === 1 ? 'You need 1 projector ' : 'You need ' + n + ' projectors ') + m, pLum: (l, o, n) => l + ' lumens' + (n > 1 ? ' each' : '') + (o ? ', with the ' + o + ' lens' : '') + '.',
    pVaCol: (d) => 'It hangs from the ceiling ' + d + ' m from the wall.', pVaApo: (d) => 'It sits on a table ' + d + ' m from the wall.', pImg: (w, h) => 'The image is ' + w + ' × ' + h + ' m.', pSup: 'Surfaces: ',
    semV: 'It will look good with this light.', semA: (a) => 'It will look a bit washed out: ' + a + '.', semR: (a) => 'It will look very washed out: ' + a + '.', accLuz: 'dim the lights', accMas: 'make the image smaller or add a projector',
    pNoCabe: 'There is no good spot for the projector with these sizes: change the distance or check it in PRO.',
    cProy: 'Projectors', cLum: 'Lumens', cDist: 'To the wall', cCon: 'Contrast', cBri: 'Brightness',
    pers: '1.75 m person', proy: 'Projector'
  },
  ca: {
    sw: 'Mode SIMPLE o PRO', asisB: 'Fes-me les preguntes', idi: 'Idioma', tema: 'Gris fosc o gris clar',
    phL: 'Escriu-la: «pantalla de 3 × 2 a 4 m»', phP: 'Escriu-la: «projector per a una paret de 4 × 2,5 m»', phCorto: 'Escriu-la aquí…', pideA: 'Descriu el que necessites', calc: 'CALCULA →',
    tuLed: 'LA TEVA PANTALLA LED', tuProy: 'LA TEVA PROJECCIÓ', sim: 'SIMULACIÓ A ESCALA', res: 'RESULTAT', cambiar: 'Canvia', repetir: 'TORNA A FER LES PREGUNTES',
    pdf: 'VEURE PDF', compartir: 'COMPARTEIX', enPro: 'VEURE-HO TOT EN PRO', copiado: 'Resum copiat: enganxa’l on vulguis.', noCopia: 'No s’ha pogut copiar.',
    calculando: 'Calculant…', sinCat: 'No s’ha pogut llegir el catàleg. Revisa la connexió.', reintentar: 'TORNA-HO A PROVAR', vacio: 'No hi ha pantalles per a aquestes dades: canvia on va o la mida.',
    ajPro: (n) => (n === 1 ? '1 ajust de PRO actiu' : n + ' ajustos de PRO actius'), ajProT: 'Hi ha ajustos fets en PRO que aquesta vista no mostra: per això el resultat no és l’automàtic.', restablecer: 'RESTABLEIX',
    aviso: 'Càlcul automàtic que pot contenir errors: revisa’l abans de pressupostar o instal·lar.',
    soloLed: 'Diverses pantalles LED o una sala LED només es calculen en PRO.', soloVarias: 'Diverses pantalles de projecció per separat només es calculen en PRO.', verPro: 'VEURE EN PRO', unaLed: 'UNA PANTALLA LED', unProy: 'UNA PROJECCIÓ', salaEntera: 'UNA SALA SENCERA',
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
    d1: ['Molt a prop', 'Menys de 2 m'], d2: ['Com en una botiga', 'De 2 a 5 m'], d3: ['Des de lluny', 'De 5 a 10 m'], d4: ['Molt lluny', 'Més de 10 m'], metros: 'o escriu els metres', dNoSe: (m) => ['No ho sé', 'Compto ' + m + ' m, el normal'],
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
    finT: 'Fet!', finS: 'Ja tens el resultat. Toca qualsevol dada del resum per canviar-la, o passa a PRO per veure-ho tot.',
    sDonde: 'On', sUso: 'Ús', sTam: 'Mida del lloc', sDist: 'Es mira des de', sToca: 'Es pot tocar', sAlt: 'Alçada de terra',
    vIn: 'Dins', vOut: 'Al carrer', vEsc: 'Aparador', vSolD: 'sol directe', vSolI: 'ombra', vMar: 'a prop del mar', vFija: 'Fixa', vRental: 'Esdeveniments', vNormal: 'el normal', vSuelo: 'A terra',
    vPared: 'Paret o pantalla', vMap: 'Façana', vSala: 'Sala sencera', sImg: 'Imatge', sSala: 'Sala', sLuz: 'Llum', sPub: 'La gent mira des de', sMont: 'Projector', sTecho: 'Sostre',
    vCol: 'Penjat', vApo: 'Recolzat', vAuto: 'On vagi millor',
    rTitL: (w, h) => 'La teva pantalla LED: ' + w + ' × ' + h + ' m', ajMenosW: (n) => n + ' cm menys d’amplada', ajMasW: (n) => n + ' cm més d’amplada', ajMenosH: (n) => n + ' cm menys d’alçada', ajMasH: (n) => n + ' cm més d’alçada', ajY: ' i ', ajFin: 'per fer servir peces senceres',
    rNit: (d) => 'Es veu nítida des de ' + d + ' m.', rImg: (w, h, n) => 'Imatge de ' + w + ' × ' + h + ' píxels' + (n ? ' (' + n + ')' : '') + '.',
    rPie: (n, m, s) => 'Feta de ' + n + (n === 1 ? ' peça' : ' peces') + ' (cabinets ' + m + ', ' + s + ').', stock: 'en estoc', pedido: 'sota comanda',
    rPeso: (kg, kw, n) => 'Pesa ' + kg + ' kg i gasta com a màxim ' + kw + ' kW: ' + n + (n === 1 ? ' línia' : ' línies') + ' de 16 A.', semLedV: 'Encaixa amb el que has demanat.',
    cMed: 'Mida', cPie: 'Peces', cPeso: 'Pes', cCons: 'Consum màx.',
    pTit: (n, m) => (n === 1 ? 'Necessites 1 projector ' : 'Necessites ' + n + ' projectors ') + m, pLum: (l, o, n) => 'De ' + l + ' lúmens' + (n > 1 ? ' cadascun' : '') + (o ? ', amb l’òptica ' + o : '') + '.',
    pVaCol: (d) => 'Va penjat del sostre a ' + d + ' m de la paret.', pVaApo: (d) => 'Va recolzat a ' + d + ' m de la paret.', pImg: (w, h) => 'La imatge fa ' + w + ' × ' + h + ' m.', pSup: 'Superfícies: ',
    semV: 'Es veurà bé amb aquesta llum.', semA: (a) => 'Es veurà una mica rentada: ' + a + '.', semR: (a) => 'Es veurà molt rentada: ' + a + '.', accLuz: 'abaixa la llum', accMas: 'fes la imatge més petita o afegeix un projector',
    pNoCabe: 'No hi ha un bon lloc per al projector amb aquestes mides: canvia la distància o mira-ho en PRO.',
    cProy: 'Projectors', cLum: 'Lúmens', cDist: 'A la paret', cCon: 'Contrast', cBri: 'Brillantor',
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
  tema: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
  idioma: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  varita: '<path d="M4 20L15 9"/><path d="M15 3.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/><path d="M19.5 10.5l.6 1.3 1.4.7-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.7z"/>',
  regla: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  ojo: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  altura: '<path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/>',
  persona: '<circle cx="12" cy="6" r="3"/><path d="M6 21v-5a6 6 0 0 1 12 0v5"/>',
  sim: '<path d="M3 20h18"/><rect x="9" y="5" width="11" height="8" rx="1"/><circle cx="5.5" cy="11" r="1.6"/><path d="M5.5 13v4M4 20l1.5-3 1.5 3"/>',
  res: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
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
const modoCons = () => { const E = C().E; if (E.tecnologia === 'led') return 'led'; if (E.cantidad === 'varias') return E.esp.tipo === 'sala' ? 'sala' : 'varias'; return E.proy.tipo === 'mapping' ? 'mapping' : 'pared'; };
const LUCES = [[10, 'l10', 'luna'], [50, 'l50', 'media'], [140, 'l140', 'bombilla'], [300, 'l300', 'sol']];
const PAREDES = ['frontal', 'izquierda', 'derecha', 'trasera', 'suelo'];

/* ajustes que solo se tocan en PRO: si alguno no es el de fábrica, el resultado no es el automático */
const AJ_LED = ['backup', 'escalador', 'conexion', 'marca', 'cosido', 'transp', 'nitsMin', 'resMin', 'giro', 'crm', 'pitch', 'ajuste', 'procSel', 'mediaSel', 'dante', 'entradas', 'tipoEntrada', 'resEntrada'];
const AJ_PROY = ['cuerpo', 'optica', 'idSuelo', 'solape', 'ganancia', 'dist', 'orient', 'altura', 'oos'];
const AJ_ELEC = ['proyEq', 'sel', 'selMedia', 'selBlend', 'marca', 'dante'];
function ajustesPro() {
  if (!listo()) return 0;
  if (PAG === 'portada') { const E = B().E, D = B().DEF; return AJ_LED.filter((k) => JSON.stringify(E[k]) !== JSON.stringify(D[k])).length; }
  const E = C().E, D = C().DEF(); return AJ_PROY.filter((k) => JSON.stringify(E.proy[k]) !== JSON.stringify(D.proy[k])).length + AJ_ELEC.filter((k) => JSON.stringify(E.elec[k]) !== JSON.stringify(D.elec[k])).length + ((E.esp.obst || []).length ? 1 : 0);
}
function restablecePro() {
  if (PAG === 'portada') { const E = B().E, D = B().DEF; AJ_LED.forEach((k) => { E[k] = D[k]; }); B().todo(); return; }
  const E = C().E, D = C().DEF(); AJ_PROY.forEach((k) => { E.proy[k] = D.proy[k]; }); AJ_ELEC.forEach((k) => { E.elec[k] = D.elec[k]; }); E.esp.obst = []; C().actualizar();
}

/* ---------- la capa SIMPLE ---------- */
let capa = null, montado = '', W = null, tPinta = 0, primera = true;
function capaNueva() {
  if (capa) return capa;
  capa = document.createElement('div'); capa.id = 'simple'; capa.className = 'ss'; capa.hidden = vista !== 'simple';
  /* en la consola el cuerpo va escalado (zoom) a 1920 de ancho: la capa va fuera, como sus ventanas */
  (PAG === 'consola' ? document.documentElement : document.body).appendChild(capa);
  capa.addEventListener('click', clic); capa.addEventListener('keydown', tecla); capa.addEventListener('input', entrada);
  return capa;
}
const sw = () => { const pro = vista === 'pro'; return `<div class="ss-sw" role="group" aria-label="${esc(t('sw'))}" title="${esc(t('sw'))}" data-crudo><button type="button" class="ss-sw-e${pro ? '' : ' on'}" data-ss-sw="simple" aria-pressed="${!pro}">SIMPLE</button><label class="ss-sw-t"><input type="checkbox" data-ss-swc aria-label="PRO"${pro ? ' checked' : ''}><span class="ss-sw-p"><span class="ss-sw-b"></span></span></label><button type="button" class="ss-sw-e${pro ? ' on' : ''}" data-ss-sw="pro" aria-pressed="${pro}">PRO</button></div>`; };
function monta() {
  const L = LG(), ph = PAG === 'portada' ? t('phL') : t('phP');
  montado = L;
  capa.innerHTML = `<header class="ss-cab" data-crudo><div class="ss-cab-l"><img class="ss-logo ss-osc" src="${RAIZ}assets/screens-logo.svg" alt="SCREENS"><img class="ss-logo ss-cla" src="${RAIZ}assets/screens-logo-claro.svg" alt="SCREENS"></div>
      <div class="ss-cab-c">${sw()}</div>
      <div class="ss-cab-r"><button type="button" class="ss-bt" data-ss="asis" title="${esc(t('asisB'))}" aria-label="${esc(t('asisB'))}">${ic('varita')}</button><button type="button" class="ss-bt ss-cod" data-ss="idioma" title="${esc(t('idi'))}" aria-label="${esc(t('idi'))}">${ic('idioma')}<small>${L.toUpperCase()}</small></button><button type="button" class="ss-bt" data-ss="tema" title="${esc(t('tema'))}" aria-label="${esc(t('tema'))}">${ic('tema')}</button></div></header>
    <div class="ss-pide" data-crudo><input type="text" id="ss-pide" class="ss-in" autocomplete="off" spellcheck="false" enterkeyhint="go" placeholder="${esc(ph)}" aria-label="${esc(t('pideA'))}"><button type="button" class="ss-calc" data-ss="pide"><span class="ss-fit">${esc(t('calc'))}</span></button></div>
    <main class="ss-cuerpo"><section class="ss-blk ss-resumen" id="ss-resumen" aria-live="polite"></section><section class="ss-blk ss-sim" id="ss-sim"></section><section class="ss-blk ss-res" id="ss-res" aria-live="polite"></section></main>
    <footer class="ss-pie" data-crudo><p class="ss-aviso"><svg class="ss-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg><span>${esc(t('aviso'))}</span></p><p class="ss-cred" data-crudo>${window.AVCREDITO ? window.AVCREDITO.html('SCREENS', VERSION, L) : 'SCREENS ' + VERSION}</p></footer>
    <div id="ss-asis" data-crudo></div>`;
}
const cab = (k, txt, extra) => `<h2 class="ss-tit" data-crudo>${ic(k)}<span class="ss-fit">${esc(txt)}</span>${extra || ''}</h2>`;

/* resumen: una línea por dato, y cada una abre solo su pregunta */
function filas() {
  const E = ED();
  if (PAG === 'portada') {
    const donde = { INDOOR: t('vIn'), OUTDOOR: t('vOut'), ESCAPARATE: t('vEsc') }[E.tipo] + (E.tipo !== 'INDOOR' && E.sol ? ' · ' + (E.sol === 'directo' ? t('vSolD') : t('vSolI')) : '') + (E.gold ? ' · ' + t('vMar') : '');
    return [['donde', 'casa', t('sDonde'), donde], ['uso', 'pin', t('sUso'), E.clase === 'RENTAL' ? t('vRental') : t('vFija')], ['medida', 'regla', t('sTam'), fm(E.w) + ' × ' + fm(E.h) + ' m'],
      ['dist', 'ojo', t('sDist'), E.dist ? fm(E.dist) + ' m' : distDef() + ' m · ' + t('vNormal')], E.tipo === 'INDOOR' ? ['tocar', 'mano', t('sToca'), E.protegido ? t('si') : t('no')] : null,
      ['altura', 'altura', t('sAlt'), +E.elev ? fmt(E.elev, 0) + ' cm' : t('vSuelo')]].filter(Boolean);
  }
  const m = modoCons(), s = E.esp.sueltas, lux = Number(E.proy.lux), luz = LUCES.find((x) => x[0] === lux), mont = E.proy.montaje === 'colgado' ? t('vCol') : E.proy.montaje === 'apoyado' ? t('vApo') : t('vAuto');
  const out = [['ptipo', m === 'sala' ? 'cubo' : m === 'mapping' ? 'edificio' : 'pared', t('sDonde'), m === 'sala' ? t('vSala') : m === 'mapping' ? t('vMap') : t('vPared')]];
  if (m === 'sala') out.push(['ptam', 'regla', t('sSala'), fm(E.esp.ancho) + ' × ' + fm(E.esp.fondo) + ' × ' + fm(E.esp.alto) + ' m · ' + PAREDES.filter((p) => E.esp.paredes[p]).map((p) => t(p)).join(', ')]);
  else out.push(['ptam', 'regla', t('sImg'), fm(s.ancho) + ' × ' + fm(s.alto) + ' m']);
  if (m !== 'mapping') out.push(['luz', luz ? luz[2] : 'bombilla', t('sLuz'), (luz ? t(luz[1])[0] + ' · ' : '') + fmt(lux, 0) + ' lx']);
  if (m === 'pared') out.push(['pub', 'persona', t('sPub'), fm(s.dist) + ' m']);
  if (m !== 'mapping') out.push(['mont', E.proy.montaje === 'apoyado' ? 'mesa' : 'techo', t('sMont'), mont]);
  if (m === 'pared' && E.proy.montaje === 'colgado') out.push(['techo', 'altura', t('sTecho'), fm(s.techo || 3) + ' m']);
  return out;
}
function pintaResumen() {
  const el = document.getElementById('ss-resumen'); if (!el) return;
  const n = ajustesPro(), titulo = PAG === 'portada' ? t('tuLed') : t('tuProy');
  if (!listo()) { el.setAttribute('data-crudo', ''); el.innerHTML = cab(PAG === 'portada' ? 'led' : 'proy', titulo) + `<p class="ss-espera">${esc(t('calculando'))}</p>`; return; }
  if (PAG === 'consola' && (modoCons() === 'led' || modoCons() === 'varias')) { el.setAttribute('data-crudo', ''); el.innerHTML = cab(modoCons() === 'led' ? 'led' : 'proy', modoCons() === 'led' ? t('tuLed') : titulo) + `<p class="ss-msg">${esc(modoCons() === 'led' ? t('soloLed') : t('soloVarias'))}</p><button type="button" class="ss-ancho" data-ss="asis">${ic('varita')}<span class="ss-fit">${esc(t('repetir'))}</span></button>`; return; }
  el.setAttribute('data-crudo', ''); el.innerHTML = cab(PAG === 'portada' ? 'led' : 'proy', titulo) + `<div class="ss-filas">${filas().map((f) => `<button type="button" class="ss-fila" data-ss-q="${f[0]}" aria-label="${esc(t('cambiar') + ': ' + f[2])}">${ic(f[1])}<span class="ss-fk ss-fit">${esc(f[2])}</span><b class="ss-fv ss-fit">${esc(f[3])}</b>${ic('lapiz', 'ss-lapiz')}</button>`).join('')}</div>` +
    (n ? `<div class="ss-ajpro" title="${esc(t('ajProT'))}"><span class="ss-fit">${ic('pro')}${esc(t('ajPro')(n))}</span><button type="button" class="ss-mini" data-ss="restablece">${esc(t('restablecer'))}</button></div>` : '') +
    `<button type="button" class="ss-ancho" data-ss="asis">${ic('varita')}<span class="ss-fit">${esc(t('repetir'))}</span></button>`;
}

/* simulación: la de la portada (la misma de PRO) o un corte lateral propio para la proyección */
let FIG = null;
function figBox() { if (FIG) return FIG; FIG = { x: 0, y: 0, width: 6400, height: 12800 }; try { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden'); s.innerHTML = `<path d="${HUMAN_PATH}"/>`; document.body.appendChild(s); const q = s.firstChild.getBBox(); if (q.height > 0) FIG = q; s.remove(); } catch (e) {} return FIG; }
const figura = (cx, suelo, k, attr) => { const F = figBox(), e = 1.75 * k / F.height; return `<g transform="translate(${(cx - (F.x + F.width / 2) * e).toFixed(1)},${(suelo + F.y * e).toFixed(1)}) scale(${e.toFixed(5)},${(-e).toFixed(5)})" ${attr || ''}><path d="${HUMAN_PATH}"/></g>`; };
function simProy(prop) {
  const c = C().c, E = C().E; if (!c || !c.filas || !c.filas.length) return '';
  const m = modoCons();
  if (m === 'sala') {   /* sala entera: planta con las paredes iluminadas */
    const A = Math.max(1, +E.esp.ancho || 1), F = Math.max(1, +E.esp.fondo || 1), VW = 1000, VH = Math.round(VW / Math.max(.9, Math.min(2.2, prop || 1.6))), k = Math.min((VW - 300) / A, (VH - 160) / F), x0 = (VW - A * k) / 2, y0 = (VH - F * k) / 2 - 6, P2 = E.esp.paredes, on = 'var(--ss-acento)', off = 'var(--ss-linea)';
    const muro = (x1, y1, x2, y2, p) => { const v = x1 === x2, an = v ? (x1 < VW / 2 ? 'end' : 'start') : 'middle', tx = v ? x1 + (x1 < VW / 2 ? -20 : 20) : (x1 + x2) / 2, ty = v ? (y1 + y2) / 2 + 8 : y1 + (y1 < VH / 2 ? -18 : 36);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${P2[p] ? on : off}" stroke-width="${P2[p] ? 12 : 6}" stroke-linecap="round"/>` + (P2[p] ? `<text x="${tx}" y="${ty}" text-anchor="${an}" class="ss-sv-t">${esc(t(p))}</text>` : ''); };
    let g = `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(t('sim'))}">`;
    g += `<rect x="${x0}" y="${y0}" width="${A * k}" height="${F * k}" fill="${P2.suelo ? 'color-mix(in srgb, var(--ss-acento) 16%, transparent)' : 'var(--ss-campo)'}" rx="4"/>`;
    g += muro(x0, y0, x0 + A * k, y0, 'frontal') + muro(x0, y0, x0, y0 + F * k, 'izquierda') + muro(x0 + A * k, y0, x0 + A * k, y0 + F * k, 'derecha') + muro(x0, y0 + F * k, x0 + A * k, y0 + F * k, 'trasera');
    (c.sombras && c.sombras.haces || []).forEach((h) => { if (!h.lente) return; const px = x0 + (h.lente.x + A / 2) * k, pz = y0 + (h.lente.z + F / 2) * k; if (px < x0 - 40 || px > x0 + A * k + 40 || pz < y0 - 40 || pz > y0 + F * k + 40) return; g += `<circle cx="${px.toFixed(1)}" cy="${pz.toFixed(1)}" r="9" fill="var(--ss-violeta)" stroke="#fff" stroke-width="2"/>`; });
    g += `<text x="${VW / 2}" y="${(y0 + F * k - 22).toFixed(1)}" text-anchor="middle" class="ss-sv-c">${fm(A)} × ${fm(F)} m</text></svg>`;
    return g;
  }
  const f = c.filas.find((x) => x.s.tipo !== 'suelo') || c.filas[0], s = f.s, pos = f.pos || {};
  const dP = Math.max(.5, +pos.dist || 0), dPub = m === 'pared' ? Math.max(0, +c.dist || 0) : 0, y0 = isFinite(pos.y0) ? pos.y0 : s.elev, y1 = isFinite(pos.y1) ? pos.y1 : s.elev + s.alto;
  const techo = m === 'pared' && pos.techo > 0 ? +pos.techo : 0, yL = isFinite(pos.yLente) ? pos.yLente : (y0 + y1) / 2;
  const D = Math.max(dP, dPub) + Math.max(1.4, dP * .12), H = Math.max(techo || 0, y1, yL, 2.2) + .7;
  const VW = 1000, VH = Math.round(VW / Math.max(1.1, Math.min(2.6, prop || 1.8))), mL = 50, mR = 90, mT = 34, mB = 70;
  const k = Math.min((VW - mL - mR) / D, (VH - mT - mB) / H), suelo = VH - mB, muroX = mL + D * k, X = (d) => muroX - d * k, Y = (h) => suelo - h * k;
  let g = `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMax meet" role="img" aria-label="${esc(t('sim'))}">`;
  g += `<line x1="0" y1="${suelo}" x2="${VW}" y2="${suelo}" stroke="var(--ss-linea)" stroke-width="3"/>`;
  if (techo) g += `<line x1="0" y1="${Y(techo).toFixed(1)}" x2="${muroX}" y2="${Y(techo).toFixed(1)}" stroke="var(--ss-linea)" stroke-width="3" stroke-dasharray="10 8"/>`;
  g += `<rect x="${muroX}" y="${Y(techo || H).toFixed(1)}" width="16" height="${(suelo - Y(techo || H)).toFixed(1)}" fill="var(--ss-linea)"/>`;
  /* el haz y la imagen en la pared */
  const lx = X(dP), ly = Y(yL);
  g += `<polygon points="${lx.toFixed(1)},${ly.toFixed(1)} ${muroX},${Y(y1).toFixed(1)} ${muroX},${Y(y0).toFixed(1)}" fill="var(--ss-acento)" fill-opacity=".16" stroke="var(--ss-acento)" stroke-opacity=".55" stroke-width="2"/>`;
  g += `<rect x="${muroX - 5}" y="${Y(y1).toFixed(1)}" width="10" height="${((y1 - y0) * k).toFixed(1)}" fill="var(--ss-acento)" rx="3"/>`;
  /* el proyector: colgado (con su barra) o apoyado (en su mesa) */
  const pw = Math.max(26, .5 * k), ph = Math.max(14, .22 * k);
  if (pos.apoyo) { const top = ly + ph / 2; g += `<rect x="${(lx - pw * .9).toFixed(1)}" y="${top.toFixed(1)}" width="${(pw * 1.8).toFixed(1)}" height="6" fill="var(--ss-tenue)"/><line x1="${(lx - pw * .75).toFixed(1)}" y1="${top + 6}" x2="${(lx - pw * .75).toFixed(1)}" y2="${suelo}" stroke="var(--ss-tenue)" stroke-width="5"/><line x1="${(lx + pw * .75).toFixed(1)}" y1="${top + 6}" x2="${(lx + pw * .75).toFixed(1)}" y2="${suelo}" stroke="var(--ss-tenue)" stroke-width="5"/>`; }
  else if (techo) g += `<line x1="${lx.toFixed(1)}" y1="${Y(techo).toFixed(1)}" x2="${lx.toFixed(1)}" y2="${(ly - ph / 2).toFixed(1)}" stroke="var(--ss-tenue)" stroke-width="5"/>`;
  g += `<rect x="${(lx - pw / 2).toFixed(1)}" y="${(ly - ph / 2).toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" rx="5" fill="var(--ss-violeta)"/><circle cx="${(lx + pw / 2 - ph * .45).toFixed(1)}" cy="${ly.toFixed(1)}" r="${(ph * .28).toFixed(1)}" fill="#fff" fill-opacity=".85"/>`;
  /* la persona a la distancia del público, para la escala */
  if (dPub > 0 && dPub < D) g += figura(X(dPub), suelo, k, 'fill="var(--ss-tenue)" fill-opacity=".85"');
  /* cotas: distancia del proyector a la pared y alto de la imagen */
  const yc = suelo + 48;
  g += `<line x1="${lx.toFixed(1)}" y1="${yc}" x2="${muroX}" y2="${yc}" stroke="var(--ss-azul)" stroke-width="2.5"/><line x1="${lx.toFixed(1)}" y1="${yc - 9}" x2="${lx.toFixed(1)}" y2="${yc + 9}" stroke="var(--ss-azul)" stroke-width="2.5"/><line x1="${muroX}" y1="${yc - 9}" x2="${muroX}" y2="${yc + 9}" stroke="var(--ss-azul)" stroke-width="2.5"/><text x="${((lx + muroX) / 2).toFixed(1)}" y="${yc - 10}" text-anchor="middle" class="ss-sv-c">${fm(dP)} m</text>`;
  g += `<text x="${muroX + 26}" y="${((Y(y0) + Y(y1)) / 2 + 9).toFixed(1)}" class="ss-sv-c">${fm(y1 - y0)} m</text></svg>`;
  return g;
}
function pintaSim() {
  const el = document.getElementById('ss-sim'); if (!el) return;
  let cu = el.querySelector('.ss-lienzo');
  if (!cu) { el.innerHTML = cab('sim', t('sim')) + '<div class="ss-lienzo"></div>'; cu = el.querySelector('.ss-lienzo'); }
  const prop = cu.clientWidth > 40 && cu.clientHeight > 40 ? cu.clientWidth / cu.clientHeight : 1.6;
  let svg = '';
  if (!listo()) svg = '';
  else if (PAG === 'portada') { const R = B().R; if (R && R.r) { try { svg = B().sim(Math.max(.75, Math.min(1.5, prop)), 0); } catch (e) { svg = ''; } svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject>/g, ''); } }
  else if (modoCons() !== 'led' && modoCons() !== 'varias') svg = simProy(prop);
  else svg = `<p class="ss-espera" data-crudo>${ic(modoCons() === 'led' ? 'led' : 'proy', 'ss-ic-xl')}</p>`;
  cu.classList.toggle('ss-papel', PAG === 'consola');
  cu.innerHTML = svg || `<p class="ss-espera" data-crudo>${esc(t('calculando'))}</p>`;
}

/* resultado: semáforo con una frase clara, tres o cuatro frases y cuatro cifras */
let TXT = '';
const nb = (x) => String(x).replace(/(\d) × (\d)/g, '$1\u00a0×\u00a0$2').replace(/(\d) (m|cm|kg|kW|lx|nits|A)\b/g, '$1\u00a0$2');
const cifra = (k, v, u) => `<div class="ss-cifra" data-crudo><small class="ss-fit">${esc(k)}</small><b class="ss-fit">${esc(v)}${u ? `<i>${esc(u)}</i>` : ''}</b></div>`;
const botones = () => `<div class="ss-acc" data-crudo><button type="button" class="ss-bt2" data-ss="pdf">${ic('pdf')}<span class="ss-fit">${esc(t('pdf'))}</span></button><button type="button" class="ss-bt2" data-ss="compartir">${ic('compartir')}<span class="ss-fit">${esc(t('compartir'))}</span></button><button type="button" class="ss-bt2 ss-pro" data-ss="pro">${ic('pro')}<span class="ss-fit">${esc(t('enPro'))}</span></button></div>`;
function resLed() {
  const R = B().R, E = B().E;
  if (!R) return B().estado() === 'error' ? `<p class="ss-msg" data-crudo>${esc(t('sinCat'))}</p><button type="button" class="ss-mini ss-grande" data-ss="reintenta">${esc(t('reintentar'))}</button>` : `<p class="ss-espera">${esc(t('calculando'))}</p>`;
  if (R.vacio || !R.r) return `<p class="ss-msg" data-crudo>${esc(t('vacio'))}</p>`;
  const r = R.r, m = R.m, dw = Math.round((E.w - r.ancho) * 100), dh = Math.round((E.h - r.alto) * 100), aj = [];
  if (dw > 0) aj.push(t('ajMenosW')(dw)); else if (dw < 0) aj.push(t('ajMasW')(-dw));
  if (dh > 0) aj.push(t('ajMenosH')(dh)); else if (dh < 0) aj.push(t('ajMasH')(-dh));
  const tit = t('rTitL')(fm(r.ancho), fm(r.alto)), fam = String(m.family || '').trim() + ' P' + fm(R.pitch), stock = B().enStock(m) ? t('stock') : t('pedido');
  const lin = R.nLin || Math.max(1, Math.ceil((r.amp || 0) / 16));
  const frases = [t('rNit')(fm(R.pitch / 1)), t('rImg')(r.resW, r.resH, R.nivel && R.nivel[1]), t('rPie')(r.cab, fam, stock), t('rPeso')(fmt(r.peso, 0), fmt(r.kw, 1), lin)];
  const sem = R.relajado ? 'A' : 'V', semTxt = R.relajado ? R.relajado : t('semLedV');
  TXT = tit + (aj.length ? ' (' + aj.join(t('ajY')) + ', ' + t('ajFin') + ')' : '') + '\n' + frases.join('\n') + '\n' + semTxt;
  return `<div class="ss-res-cu"><div class="ss-res-txt"><h3 class="ss-res-tit" data-crudo>${ic('ok', 'ss-ok')}<span>${esc(nb(tit))}</span></h3>${aj.length ? `<p class="ss-res-aj" data-crudo>(${esc(nb(aj.join(t('ajY'))))}, ${esc(t('ajFin'))})</p>` : ''}<p class="ss-sem ss-sem-${sem}"${R.relajado ? '' : ' data-crudo'}><i></i><span>${esc(semTxt)}</span></p><ul class="ss-frases" data-crudo>${frases.map((f) => `<li>${esc(nb(f))}</li>`).join('')}</ul></div>
    <div class="ss-cifras">${cifra(t('cMed'), fm(r.ancho) + ' × ' + fm(r.alto), 'm')}${cifra(t('cPie'), fmt(r.cab, 0))}${cifra(t('cPeso'), fmt(r.peso, 0), 'kg')}${cifra(t('cCons'), fmt(r.kw, 1), 'kW')}</div></div>` + botones();
}
function resProy() {
  const m = modoCons();
  if (m === 'led' || m === 'varias') return `<p class="ss-msg" data-crudo>${esc(m === 'led' ? t('soloLed') : t('soloVarias'))}</p><div class="ss-acc">` + (m === 'led' ? `<button type="button" class="ss-bt2" data-ss="ir-led">${ic('led')}<span class="ss-fit">${esc(t('unaLed'))}</span></button><button type="button" class="ss-bt2" data-ss="ir-proy">${ic('proy')}<span class="ss-fit">${esc(t('unProy'))}</span></button>` : `<button type="button" class="ss-bt2" data-ss="ir-proy">${ic('pared')}<span class="ss-fit">${esc(t('unProy'))}</span></button><button type="button" class="ss-bt2" data-ss="ir-sala">${ic('cubo')}<span class="ss-fit">${esc(t('salaEntera'))}</span></button>`) + `<button type="button" class="ss-bt2 ss-pro" data-ss="pro">${ic('pro')}<span class="ss-fit">${esc(t('verPro'))}</span></button></div>`;
  const c = C().c, E = C().E;
  if (!c || !c.filas || !c.filas.length || !c.proyector) return `<p class="ss-espera" data-crudo>${esc(t('calculando'))}</p>`;
  const f = c.filas.find((x) => x.s.tipo !== 'suelo') || c.filas[0], pr = c.proyector, n = c.tot.n, con = c.tot.contrasteMin, pos = f.pos || {};
  const mal = c.filas.some((x) => x.p && (x.p.fuera || x.p.noCubre)), lux = Number(E.proy.lux) || 0;
  const sem = mal ? 'R' : con >= 15 ? 'V' : con >= 7 ? 'A' : 'R', acc = lux > 50 ? t('accLuz') : t('accMas');
  const semTxt = mal ? t('pNoCabe') : sem === 'V' ? t('semV') : sem === 'A' ? t('semA')(acc) : t('semR')(acc);
  const tit = t('pTit')(n, pr.modelo), frases = [t('pLum')(fmt(pr.lumens, 0), pr.optica, n)];
  if (m === 'sala') frases.push(t('pSup') + PAREDES.filter((p) => E.esp.paredes[p]).map((p) => t(p)).join(' · ') + '.');
  else { if (m === 'pared' && pos.dist > 0) frases.push((pos.apoyo ? t('pVaApo') : t('pVaCol'))(fm(pos.dist))); frases.push(t('pImg')(fm(f.s.ancho), fm(f.s.alto))); }
  TXT = tit + '\n' + frases.join('\n') + '\n' + semTxt;
  const c3 = m === 'sala' ? cifra(t('cBri'), fmt(c.tot.nitsMin, 0), 'nits') : cifra(t('cDist'), pos.dist > 0 ? fm(pos.dist) : '—', 'm');
  return `<div class="ss-res-cu" data-crudo><div class="ss-res-txt"><h3 class="ss-res-tit">${ic('ok', 'ss-ok')}<span>${esc(t('pTit')(n, ''))}<span class="ss-nw">${esc(pr.modelo)}</span></span></h3><p class="ss-sem ss-sem-${sem}"><i></i><span>${esc(semTxt)}</span></p><ul class="ss-frases">${frases.map((x) => `<li>${esc(nb(x))}</li>`).join('')}</ul></div>
    <div class="ss-cifras">${cifra(t('cProy'), fmt(n, 0))}${cifra(t('cLum'), fmt(pr.lumens, 0))}${c3}${cifra(t('cCon'), isFinite(con) ? fmt(con, 1) : '—', ':1')}</div></div>` + botones();
}
function pintaRes() { const el = document.getElementById('ss-res'); if (!el) return; TXT = ''; el.innerHTML = cab('res', t('res')) + (listo() ? (PAG === 'portada' ? resLed() : resProy()) : `<p class="ss-espera" data-crudo>${esc(t('calculando'))}</p>`); }

/* el texto nunca se parte ni se corta: si no cabe, la letra se reduce */
function encaja(raiz) { (raiz || capa).querySelectorAll('.ss-fit').forEach((el) => { el.style.removeProperty('font-size'); if (!el.clientWidth) return; let fs = parseFloat(getComputedStyle(el).fontSize), k = 0; while (el.scrollWidth > el.clientWidth + 1 && fs > 7 && k++ < 40) { fs -= .5; el.style.fontSize = fs + 'px'; } }); }

function pinta() {
  if (vista !== 'simple') return;
  capaNueva(); if (montado !== LG() || !capa.querySelector('.ss-cab')) monta();
  ponPh();
  pintaResumen(); pintaSim(); pintaRes(); encaja();
  if (W) pintaAsis();
  if (primera && listo()) { primera = false; arranque(); }
}
/* la casilla enseña el ejemplo entero si cabe; si no, el texto corto (nunca cortado) */
let CNV = null;
function ponPh() { const i = document.getElementById('ss-pide'); if (!i) return; const largo = PAG === 'portada' ? t('phL') : t('phP'); if (!i.clientWidth) { i.placeholder = largo; return; }
  const cs = getComputedStyle(i); CNV = CNV || document.createElement('canvas').getContext('2d'); CNV.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
  i.placeholder = CNV.measureText(largo).width <= i.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 6 ? largo : t('phCorto'); }
function aviso() { if (vista !== 'simple') return; cancelAnimationFrame(tPinta); tPinta = requestAnimationFrame(pinta); }
let tRes = 0; addEventListener('resize', () => { clearTimeout(tRes); tRes = setTimeout(() => { if (vista === 'simple') { ponPh(); pintaSim(); encaja(); } }, 120); });

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
    pon: (v) => { const E = ED(); E.dist = typeof v === 'object' ? (v.d || 0) : v === 'nose' ? 0 : v; E.pitch = 0; E.crm = ''; } },
  tocar: { rama: 'led', si: () => ED().tipo === 'INDOOR', t: 'qToca', op: () => [[true, 'oTocaSi', 'mano'], [false, 'oTocaNo', 'escudo']], val: () => !!ED().protegido, pon: (v) => { const E = ED(); E.protegido = !!v; E.crm = ''; } },
  altura: { rama: 'led', t: 'qAlt', op: () => [[0, 'a0', 'altura'], [80, 'a80', 'mesa'], [200, 'a200', 'altura']], val: () => +ED().elev,
    num: () => [['e', t('cms'), ED().elev, 0, 3000, 'cm', true]], pon: (v) => { const E = ED(); E.elev = typeof v === 'object' ? Math.round(v.e || 0) : v; } },
  /* rama PROYECTOR (consola) */
  ptipo: { rama: 'proy', t: 'qPtipo', op: () => [['pared', 'pPared', 'pared'], ['mapping', 'pMap', 'edificio'], ['sala', 'pSala', 'cubo']], val: () => (modoCons() === 'sala' ? 'sala' : modoCons() === 'mapping' ? 'mapping' : 'pared'),
    pon: (v) => { const E = ED(); E.tecnologia = 'proy'; if (v === 'sala') { E.cantidad = 'varias'; E.esp.tipo = 'sala'; } else { E.cantidad = 'una'; E.esp.tipo = 'sueltas'; E.proy.tipo = v; } C().luz(); } },
  ptam: { rama: 'proy', t: () => (modoCons() === 'sala' ? 'qSala' : 'qPtam'), ay: () => (modoCons() === 'sala' ? '' : 'ayPtam'), tele: () => modoCons() !== 'sala',
    num: () => (modoCons() === 'sala' ? [['a', t('ancho'), ED().esp.ancho, 1, 60, 'm'], ['f', t('fondo'), ED().esp.fondo, 1, 60, 'm'], ['h', t('alto'), ED().esp.alto, 1.5, 20, 'm']] : [['w', t('ancho'), ED().esp.sueltas.ancho, .5, 200, 'm'], ['h', t('alto'), ED().esp.sueltas.alto, .3, 120, 'm']]),
    paredes: () => modoCons() === 'sala',
    pon: (v) => { const E = ED(); if (modoCons() === 'sala') { if (v.a) E.esp.ancho = v.a; if (v.f) E.esp.fondo = v.f; if (v.h) E.esp.alto = v.h; } else { const s = E.esp.sueltas; if (v.w) s.ancho = v.w; if (v.h) s.alto = v.h; if (v.tele) s.alto = Math.round(s.ancho * 9 / 16 * 100) / 100; } } },
  luz: { rama: 'proy', si: () => modoCons() !== 'mapping', t: 'qLuz', ay: 'ayLuz', op: () => LUCES.map((l) => [l[0], l[1], l[2]]), val: () => Number(ED().proy.lux), pon: (v) => { ED().proy.lux = v; } },
  pub: { rama: 'proy', si: () => modoCons() === 'pared', t: 'qPub', ay: 'ayPub', num: () => [['d', t('metros'), ED().esp.sueltas.dist, 1, 100, 'm']], nose: () => t('noSe5'),
    pon: (v) => { ED().esp.sueltas.dist = typeof v === 'object' ? (v.d || 5) : 5; } },
  mont: { rama: 'proy', si: () => modoCons() !== 'mapping', t: 'qMont', op: () => [['colgado', 'mCol', 'techo'], ['apoyado', 'mApo', 'mesa'], ['auto', 'mAuto', 'chispa']], val: () => ED().proy.montaje || 'auto', pon: (v) => { ED().proy.montaje = v; } },
  techo: { rama: 'proy', si: () => modoCons() === 'pared' && ED().proy.montaje === 'colgado', t: 'qTecho', num: () => [['h', t('alto'), ED().esp.sueltas.techo || 3, 2, 30, 'm']], nose: () => t('noSe3'),
    pon: (v) => { ED().esp.sueltas.techo = typeof v === 'object' ? (v.h || 3) : 3; } }
};
const RAMA = { led: ['donde', 'sol', 'mar', 'uso', 'medida', 'dist', 'tocar', 'altura'], proy: ['ptipo', 'ptam', 'luz', 'pub', 'mont', 'techo'] };
const visibles = (r) => RAMA[r].filter((id) => !PREG[id].si || PREG[id].si());
const tx = (v) => (typeof v === 'function' ? v() : v);

function abre(paso, full, rama) { W = { paso, full: !!full, rama: rama || (PREG[paso] && PREG[paso].rama) || null, hist: [], ayuda: '' }; pintaAsis(); }
function cierra(hecho) { if (hecho !== false) pon(K_ASIS, '1'); W = null; const a = document.getElementById('ss-asis'); if (a) a.innerHTML = ''; capa && capa.classList.remove('ss-con-asis'); aviso(); const f = capa && (capa.querySelector('.ss-fila') || capa.querySelector('.ss-calc')); if (f) f.focus({ preventScroll: true }); }
function va(paso) { if (!W) return; W.hist.push(W.paso); W.paso = paso; pintaAsis(); }
function siguiente() {
  if (!W) return;
  if (!W.full) { cierra(); return; }
  const lista = visibles(W.rama), i = lista.indexOf(W.paso);
  if (i >= 0 && i < lista.length - 1) va(lista[i + 1]); else va('fin');
}
/* elegir rama: si la rama vive en la otra página, se va allí con el asistente abierto en su primera pregunta */
function rama(r) {
  if (r === 'led' && PAG !== 'portada') { location.href = RAIZ + 'index.html?vista=simple&asis=led'; return; }
  if (r === 'proy' && PAG !== 'consola') { location.href = RAIZ + 'vista/consola.html?modo=una-proy&vista=simple&asis=proy'; return; }
  if (r === 'proy') { const E = ED(); if (E.tecnologia !== 'proy' || modoCons() === 'varias') { E.tecnologia = 'proy'; E.cantidad = 'una'; E.esp.tipo = 'sueltas'; C().luz(); recalc(); } }
  W.rama = r; va(visibles(r)[0]);
}
function pintaAsis() {
  const el = document.getElementById('ss-asis'); if (!el || !W) return;
  capa.classList.add('ss-con-asis');
  const Lx = T[LG()], p = W.paso, q = PREG[p];
  let cuerpo = '', pie = '', cont = '';
  const opcion = (v, k, icono, sel, extra) => { const tx2 = Array.isArray(k) ? k : Lx[k]; return `<button type="button" class="ss-op${sel ? ' on' : ''}" data-ss-op='${esc(JSON.stringify(v))}' aria-pressed="${!!sel}">${ic(icono)}<span class="ss-op-t"><b class="ss-fit">${esc(tx2[0])}</b>${tx2[1] ? `<small>${esc(tx2[1])}</small>` : ''}</span>${extra || ''}</button>`; };
  if (p === 'que') {
    cuerpo = `<p class="ss-hola">${esc(Lx.hola)}</p><h2 class="ss-q" id="ss-q">${esc(Lx.q0)}</h2><div class="ss-ops ss-ops3">${opcion('led', 'o0led', 'led')}${opcion('proy', 'o0proy', 'proy')}${opcion('no', 'o0no', 'duda')}</div>`;
  } else if (p === 'calle') {
    cuerpo = `<h2 class="ss-q" id="ss-q">${esc(Lx.qCalle)}</h2><div class="ss-ops ss-ops2">${opcion(true, [Lx.si], 'sol')}${opcion(false, [Lx.no], 'casa')}</div>`;
  } else if (p === 'oscuro') {
    cuerpo = `<h2 class="ss-q" id="ss-q">${esc(Lx.qOscuro)}</h2><div class="ss-ops ss-ops2">${opcion(true, [Lx.si], 'luna')}${opcion(false, [Lx.no], 'bombilla')}</div>`;
  } else if (p === 'rec') {
    const led = W.rec !== 'proy';
    cuerpo = `<div class="ss-rec">${ic(led ? 'led' : 'proy')}<h2 class="ss-q" id="ss-q">${esc(led ? Lx.recLed : Lx.recProy)}</h2><p class="ss-ay">${esc(led ? (W.ayuda === 'calle' ? Lx.recLedCalle : Lx.recLedLuz) : Lx.recProyT)}</p></div>`;
    pie = `<button type="button" class="ss-sig" data-ss="rec-sigue"><span class="ss-fit">${esc(Lx.seguir)}</span></button>`;
  } else if (p === 'fin') {
    cuerpo = `<div class="ss-rec">${ic('ok')}<h2 class="ss-q" id="ss-q">${esc(Lx.finT)}</h2><p class="ss-ay">${esc(Lx.finS)}</p></div>`;
    pie = `<button type="button" class="ss-sig" data-ss="fin"><span class="ss-fit">${esc(Lx.ver)}</span></button>`;
  } else if (q) {
    const ay = tx(q.ay), vals = q.val ? q.val() : null, ops = q.op ? q.op() : [], nums = q.num ? q.num() : [], mucho = ops.length >= 4;
    cuerpo = `<h2 class="ss-q" id="ss-q">${esc(Lx[tx(q.t)])}</h2>${ay ? `<p class="ss-ay">${esc(Lx[ay])}</p>` : ''}`;
    if (ops.length) cuerpo += `<div class="ss-ops ${mucho ? 'ss-ops4' : ops.length === 2 ? 'ss-ops2' : 'ss-ops3'}">${ops.map((o) => opcion(o[0], o[1], o[2], vals !== null && JSON.stringify(vals) === JSON.stringify(o[0]))).join('')}</div>`;
    if (nums.length) {
      const solo = nums.length === 1 && nums[0][6];
      cuerpo += `<div class="ss-nums${solo ? ' ss-nums-o' : ''}">${nums.map((n) => `<label class="ss-num"><span class="ss-fit">${esc(n[1])}</span><span class="ss-num-c"><input type="text" inputmode="decimal" data-ss-n="${n[0]}" value="${n[2] === '' || n[2] == null ? '' : esc(fm(n[2]))}" data-min="${n[3]}" data-max="${n[4]}" aria-label="${esc(n[1])}"><i>${esc(n[5])}</i></span></label>`).join('')}${solo ? `<button type="button" class="ss-mini ss-grande" data-ss="num-ok">${esc(Lx.sig)}</button>` : ''}</div>`;
      if (tx(q.tele)) cuerpo += `<button type="button" class="ss-op ss-op-l" data-ss="tele">${ic('tele')}<span class="ss-op-t"><b class="ss-fit">${esc(Lx.tele)}</b></span></button>`;
      if (q.paredes && q.paredes()) { const E = ED(); cuerpo += `<p class="ss-ay">${esc(Lx.paredes)}</p><div class="ss-pars">${PAREDES.map((pp) => `<button type="button" class="ss-par${E.esp.paredes[pp] ? ' on' : ''}" data-ss-par="${pp}" aria-pressed="${!!E.esp.paredes[pp]}"><span class="ss-fit">${esc(Lx[pp])}</span></button>`).join('')}</div>`; }
      if (!solo) pie = `<button type="button" class="ss-sig" data-ss="num-ok"><span class="ss-fit">${esc(W.full ? Lx.sig : Lx.listo)}</span></button>`;
    }
    if (q.nose) { const k = q.nose(); cuerpo += `<button type="button" class="ss-op ss-op-l ss-op-nose" data-ss-op='"nose"'>${ic('duda')}<span class="ss-op-t"><b class="ss-fit">${esc(k[0])}</b>${k[1] ? `<small>${esc(k[1])}</small>` : ''}</span></button>`; }
    if (W.full && W.rama) { const lista = visibles(W.rama), i = lista.indexOf(p); if (i >= 0) cont = `<span class="ss-paso">${esc(Lx.paso(i + 1, lista.length))}</span><span class="ss-puntos">${lista.map((x, j) => `<i class="${j < i ? 'ya' : j === i ? 'on' : ''}"></i>`).join('')}</span>`; }
  }
  const atras = W.hist.length ? `<button type="button" class="ss-mini" data-ss="atras">${esc(Lx.atras)}</button>` : '';
  const salir = W.full ? `<button type="button" class="ss-mini ss-saltar" data-ss="saltar">${esc(Lx.saltar)}</button>` : `<button type="button" class="ss-x" data-ss="saltar" aria-label="${esc(Lx.cerrar)}">${ic('x')}</button>`;
  el.innerHTML = `<div class="ss-velo"></div><div class="ss-dlg" role="dialog" aria-modal="true" aria-labelledby="ss-q"><div class="ss-dlg-cab">${cont || '<span></span>'}${salir}</div><div class="ss-dlg-cu">${cuerpo}</div><div class="ss-dlg-pie">${atras}${pie}</div></div>`;
  encaja(el);
  const f = el.querySelector('.ss-op.on, input[data-ss-n], .ss-op, .ss-sig'); if (f) f.focus({ preventScroll: true });
}
function leeNums() { const v = {}; let ok = true; document.querySelectorAll('#ss-asis input[data-ss-n]').forEach((i) => { const s = String(i.value).trim().replace(',', '.'); if (!s) return; const n = parseFloat(s); if (!isFinite(n) || n < +i.dataset.min || n > +i.dataset.max) { ok = false; i.classList.add('mal'); i.setAttribute('aria-invalid', 'true'); return; } v[i.dataset.ssN] = n; }); return ok ? v : null; }
function responde(v) {
  if (!W) return; const p = W.paso;
  if (p === 'que') { if (v === 'no') { va('calle'); return; } rama(v); return; }
  if (p === 'calle') { if (v) { W.rec = 'led'; W.ayuda = 'calle'; va('rec'); } else va('oscuro'); return; }
  if (p === 'oscuro') { W.rec = v ? 'proy' : 'led'; W.ayuda = 'luz'; va('rec'); return; }
  const q = PREG[p]; if (!q) return;
  q.pon(v); recalc();
  if (W.full) setTimeout(siguiente, 140); else setTimeout(() => cierra(), 140);
}

/* ---------- arranque: el asistente la primera vez (o al llegar de la otra página a mitad) ---------- */
function arranque() {
  if (vista !== 'simple') return;
  /* una petición escrita en SIMPLE de la consola que resultó ser de una pantalla LED: se calcula aquí */
  if (PAG === 'portada') { const pp = lee(K_PIDE); if (pp) { pon(K_PIDE, null); const i = document.getElementById('pide'), b = document.getElementById('calcular'); if (i && b) { i.value = pp; b.click(); } } }
  if (ASIS_URL === 'led' && PAG === 'portada') { abre('donde', true, 'led'); return; }
  if (ASIS_URL === 'proy' && PAG === 'consola') { abre('ptipo', true, 'proy'); return; }
  if (!lee(K_ASIS)) abre('que', true);
}

/* ---------- acciones ---------- */
function ponVista(v) {
  if (v === vista) { sincroniza(); return; }
  vista = v; pon(K_VISTA, v); document.documentElement.classList.toggle('sc-simple', v === 'simple');
  try { const q = new URLSearchParams(location.search); if (q.has('vista')) { q.set('vista', v); history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash); } } catch (e) {}
  if (v === 'simple') { capaNueva(); capa.hidden = false; pinta(); }
  else {
    if (capa) capa.hidden = true; W = null;
    /* la guía de PRO, la primera vez que se entra en PRO */
    if (PAG === 'portada' && !lee('screens-blocks-guia') && B()) setTimeout(() => B().guia(), 300);
    if (PAG === 'consola' && !lee('screens-consola-guia') && window.__consolaGuia) setTimeout(() => window.__consolaGuia(), 300);
  }
  sincroniza();
}
function sincroniza() { document.querySelectorAll('[data-ss-swc]').forEach((c) => { c.checked = vista === 'pro'; }); document.querySelectorAll('[data-ss-sw]').forEach((b) => { const on = b.dataset.ssSw === vista; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); }
document.addEventListener('change', (e) => { const c = e.target.closest && e.target.closest('[data-ss-swc]'); if (c) ponVista(c.checked ? 'pro' : 'simple'); });
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-ss-sw]'); if (b) { e.preventDefault(); ponVista(b.dataset.ssSw); } });
function pide() {
  const i = document.getElementById('ss-pide'), txt = i ? i.value.trim() : ''; if (!txt) { if (i) i.focus(); return; }
  if (PAG === 'portada') { const p = document.getElementById('pide'), b = document.getElementById('calcular'); if (p && b) { p.value = txt; b.click(); } return; }
  const n = document.getElementById('nl-texto'); if (!n) return; n.value = txt; pon(K_PIDE, txt);
  C().peticion();
  const E = C().E; if (!(E.cantidad === 'una' && E.tecnologia === 'led')) pon(K_PIDE, null);   /* si era de una pantalla LED, la consola lleva a la portada y allí se calcula */
}
function compartir() {
  if (!TXT) return; const ok = () => tostada(t('copiado')), mal = () => tostada(t('noCopia'));
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(TXT).then(ok, mal); else mal();
}
let tTos = 0;
function tostada(s) { let d = capa.querySelector('.ss-tos'); if (!d) { d = document.createElement('div'); d.className = 'ss-tos'; d.setAttribute('role', 'status'); capa.appendChild(d); } d.textContent = s; d.classList.add('on'); clearTimeout(tTos); tTos = setTimeout(() => d.classList.remove('on'), 3200); }
function clic(e) {
  const b = e.target.closest('button'); if (!b || !capa.contains(b)) return;
  if (b.dataset.ssOp != null) { let v; try { v = JSON.parse(b.dataset.ssOp); } catch (x) { v = b.dataset.ssOp; } responde(v); return; }
  if (b.dataset.ssQ) { abre(b.dataset.ssQ, false); return; }
  if (b.dataset.ssPar) { const E = ED(), k = b.dataset.ssPar; E.esp.paredes[k] = !E.esp.paredes[k]; if (!PAREDES.some((p) => E.esp.paredes[p])) E.esp.paredes.frontal = true; recalc(); pintaAsis(); return; }
  const a = b.dataset.ss; if (!a) return;
  if (a === 'pide') pide();
  else if (a === 'asis') abre('que', true);
  else if (a === 'idioma') { const x = PAG === 'portada' ? document.querySelector('[data-blk="H1R"] [data-idioma]') : document.getElementById('btn-idioma'); if (x) x.click(); }
  else if (a === 'tema') { const x = PAG === 'portada' ? document.querySelector('[data-blk="H1R"] [data-cambiatema]') : document.getElementById('btn-tema'); if (x) x.click(); }
  else if (a === 'pdf') { const x = PAG === 'portada' ? document.querySelector('[data-blk="H1R"] [data-pdf]') : document.getElementById('btn-pdf'); if (x) x.click(); }
  else if (a === 'compartir') compartir();
  else if (a === 'pro') ponVista('pro');
  else if (a === 'restablece') restablecePro();
  else if (a === 'reintenta') { const x = document.querySelector('[data-reintenta]'); if (x) x.click(); }
  else if (a === 'ir-led') { location.href = RAIZ + 'index.html?vista=simple'; }
  else if (a === 'ir-proy') { const E = ED(); E.tecnologia = 'proy'; E.cantidad = 'una'; E.esp.tipo = 'sueltas'; C().luz(); C().actualizar(); }
  else if (a === 'ir-sala') { const E = ED(); E.tecnologia = 'proy'; E.cantidad = 'varias'; E.esp.tipo = 'sala'; C().luz(); C().actualizar(); }
  else if (a === 'saltar') cierra();
  else if (a === 'atras') { if (W && W.hist.length) { W.paso = W.hist.pop(); pintaAsis(); } }
  else if (a === 'rec-sigue') rama(W.rec === 'proy' ? 'proy' : 'led');
  else if (a === 'fin') cierra();
  else if (a === 'tele') { const v = leeNums() || {}; v.tele = true; responde(v); }
  else if (a === 'num-ok') { const v = leeNums(); if (v) responde(v); }
}
function tecla(e) {
  if (e.key === 'Escape' && W) { e.stopPropagation(); cierra(); return; }
  if (e.key === 'Enter' && e.target.id === 'ss-pide') { e.preventDefault(); pide(); return; }
  if (e.key === 'Enter' && e.target.matches && e.target.matches('input[data-ss-n]')) { e.preventDefault(); const v = leeNums(); if (v) responde(Object.keys(v).length ? v : 'nose'); }
}
function entrada(e) { if (e.target.matches && e.target.matches('input[data-ss-n]')) { e.target.classList.remove('mal'); e.target.removeAttribute('aria-invalid'); } }

/* ---------- interruptor en la cabecera de PRO ---------- */
window.SCSIMPLE = { activo: () => vista === 'simple', sw, aviso, vista: (v) => ponVista(v) };
if (PAG === 'consola') { const d = document.querySelector('.cab-der'); if (d && !d.querySelector('.ss-sw')) d.insertAdjacentHTML('afterbegin', sw()); }
/* en SIMPLE, la capa se pone ya (antes de que la vista PRO se pinte debajo) */
if (vista === 'simple') { capaNueva(); monta(); pintaResumen(); pintaSim(); pintaRes(); }
