// SCREENS · SIMULAR por pistas (v11.21, pedido por Josep, 25-11-2026): seis pistas de 12 s (v11.25; antes 10) que se suceden al azar y en bucle; desde la v11.36 se funden directamente una con otra (aditivo o quemado, al azar en cada corte).
// Cada pista es un «mundo» visto desde el centro de la sala: las paredes lo miran en 360° continuo (la vuelta casa en la esquina)
// y el suelo mira hacia abajo, de modo que pared y suelo casan en el zócalo. Todas pintan las 4 paredes y el suelo; la escena
// solo enseña las superficies que tenga el proyecto. Casi todo se genera en la tarjeta gráfica (sin vídeos que descargar).
import * as THREE from 'three';
import { crearDron } from './simula.js';

const DUR = 12, SOLAPE = 1.4, NMEZ = 3, W = 2048, H = 512, WS = 1024;
const RAIZ = new URL('../assets/', import.meta.url).href;
const azarDe = (s) => { let a = s; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; };

/* ---------- GLSL común: ruido, rayo de cada píxel y composición con la capa de rótulos e imágenes ---------- */
const COMUN = `precision highp float;
uniform float t, T, esSuelo, uF, fade, trans, semilla, hayCapa, zoomCapa, hayVid; uniform sampler2D capa, capa2, base, vid; uniform vec4 pu0, pu1, asp; varying vec2 vv; vec2 v;
#define TAU 6.28318530718
float h1(float n){ return fract(sin(n)*43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1,0)),f.x), mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x), f.y); }
float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x), f.y), f.z); }
float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n3(p); p=p*2.02+vec3(13.1,7.7,3.3); a*=.5; } return s; }
float fbm2(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n2(p); p=p*2.02+vec2(13.1,7.7); a*=.5; } return s; }
float cresta(vec3 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*(1.-abs(2.*n3(p)-1.)); p=p*2.05+vec3(3.1,17.7,9.3); a*=.5; } return s; }
float dAng(float a, float b){ return abs(mod(a-b+TAU*.5, TAU)-TAU*.5); }
mat2 giro(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
/* el rayo: en pared, panorama cilíndrico con el frente en uF; en suelo, el punto del suelo visto desde el centro (casa con el zócalo) */
vec3 rayo(){ if(esSuelo>.5){ vec2 p=(v-.5)*2.; return normalize(vec3(-p.x, -.965, -p.y)); }
  float a=(v.x-uF)*TAU, y=-.18+(v.y-.5)*1.5708; return normalize(vec3(-sin(a), y, cos(a))); }
/* vídeo de 360° en cinco caras (v11.27): rejilla de 3 × 2 → frente · derecha · detrás / izquierda · suelo. Cada cara lateral abarca 90° a lo ancho
   y de −1,38 a +0,88 a lo alto (en tangentes); la del suelo mira hacia abajo con el frente arriba. Devuelve el mundo grabado en la dirección d,
   de modo que las paredes dan la vuelta completa sin costuras y casan con el suelo, sea cual sea el reparto de la sala */
vec3 cubo(vec3 d){ vec2 q; float col=1., fila=1.;
  if(esSuelo>.5){ vec2 p=vec2(-d.x, d.z)/(-d.y)/1.04; q=vec2(.5+.5*p.x, 1.-(.5-.5*p.y)*.88235); q.x=clamp(q.x,.002,.998); q.y=clamp(q.y,.12,.998); }
  else { float an=atan(-d.x,d.z), k=floor(an/1.5707963+.5), b=an-k*1.5707963; k=mod(k+4.,4.); if(k<2.5){ col=k; fila=0.; } else { col=0.; fila=1.; }
    q=vec2(.5+.5*tan(b), (d.y/(length(d.xz)*cos(b))+1.38)/2.26); q=clamp(q, vec2(.002), vec2(.998)); }
  return texture2D(vid, vec2((col+q.x)/3., 1.-(fila+1.-q.y)*.5)).rgb; }
/* la capa vista con un acercamiento lento, pared a pared (cada pantallazo se corta exacto en su esquina) */
vec2 uvCapa(float z){ if(esSuelo>.5) return .5+(v-.5)/z; for(int i=0;i<4;i++){ float a = i==0?pu0.x: i==1?pu0.y: i==2?pu0.z: pu0.w, b = i==0?pu1.x: i==1?pu1.y: i==2?pu1.z: pu1.w; if(a>=0. && v.x>=a && v.x<=b){ float c=(a+b)*.5; return vec2(c+(v.x-c)/z, .5+(v.y-.5)/z); } } return v; }
/* 0 izquierda · 1 frontal · 2 derecha · 3 trasera (−1 si el píxel no cae en ninguna) y posición 0–1 dentro de esa pared */
vec2 pared(){ for(int i=0;i<4;i++){ float a = i==0?pu0.x: i==1?pu0.y: i==2?pu0.z: pu0.w, b = i==0?pu1.x: i==1?pu1.y: i==2?pu1.z: pu1.w; if(a>=0. && v.x>=a && v.x<=b) return vec2(float(i), (v.x-a)/max(b-a,1e-4)); } return vec2(-1.,0.); }
`;
const FIN = `
/* v11.36 · cada pista se pinta entera; el paso de una a otra lo hace la mezcla (ver MEZCLA) */
void main(){ v=vv; vec3 d=rayo(); vec3 c=mundo(d); if(hayCapa>.5){ vec4 k=texture2D(capa, zoomCapa>0. ? uvCapa(1.+zoomCapa*t/12.) : v); k.rgb=pow(k.rgb, vec3(1./2.2)); c=conCapa(c, k, d); }
  gl_FragColor=vec4(pow(max(c,0.), vec3(2.2)), 1.); }`;
/* v11.36 · transiciones (pedido de Josep, 26-11-2026: «aditivo o burn, que quede limpio pero con efecto chulo»): la pista que sale y la que entra
   se pintan a la vez y se mezclan directamente, sin pasar por negro. 0 · aditivo: las dos se suman, la luz sube y la nueva se queda ·
   1 · quemado: un frente de fuego con el borde al rojo sube por las paredes y abre la nueva · 2 · quemado por luz: la nueva prende primero por sus zonas más claras */
const MEZCLA = `precision highp float; uniform sampler2D A, B; uniform float m, modo, semilla, esSuelo; varying vec2 vv;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1,0)),f.x), mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x), f.y); }
float fbm2(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n2(p); p=p*2.02+vec2(13.1,7.7); a*=.5; } return s; }
void main(){ vec3 a=texture2D(A, vv).rgb, b=texture2D(B, vv).rgb, c; float e=clamp(m,0.,1.), sx=semilla*37.1; vec2 u=vec2(vv.x*(esSuelo>.5?1.:4.), vv.y);
  if(modo<.5){ float sa=1.-smoothstep(.42,1.,e), sb=smoothstep(0.,.58,e), pico=sin(3.14159*e);
    c=a*sa+b*sb; c+=(a+b)*pico*pico*.16+vec3(.9,.95,1.)*pow(pico,8.)*.05; }
  else if(modo<1.5){ float n=(esSuelo>.5 ? 1.-length(vv-.5)*1.25 : vv.y)*.55+fbm2(u*3.2+sx)*.37+n2(u*19.+sx)*.08, fr=e*1.3-.14, d=n-fr;   /* el fuego avanza de abajo arriba (empieza en el zócalo; en el suelo, de los bordes al centro) */
    float ab=1.-smoothstep(-.012,.012,d), borde=smoothstep(.035,.0,abs(d)), calor=smoothstep(.14,.0,d)*step(0.,d);
    c=mix(a*(1.-.72*calor)*mix(vec3(1.),vec3(1.,.55,.3),calor), b, ab);
    c+=mix(vec3(1.,.26,.02), vec3(1.,.92,.6), borde*borde)*borde*1.6*step(.002,e)*step(e,.998); }
  else { float l=dot(b, vec3(.3,.59,.11)), l2=l+.25*n2(u*30.+sx), fr=1.-e*1.35+.1, d=l2-fr;
    float ab=smoothstep(-.02,.02,d), borde=smoothstep(.05,.0,abs(d))*step(.002,e)*step(e,.998);
    c=mix(a*(1.-.5*e), b, ab)+(normalize(b+.02)*1.2+vec3(.5,.35,.1))*borde*1.1; c=mix(c, b, smoothstep(.85,1.,e)); }
  gl_FragColor=vec4(c, 1.); }`;
const CAPA_SIMPLE = `vec3 conCapa(vec3 c, vec4 k, vec3 d){ return mix(c, k.rgb, k.a); }`;

/* ---------- 1 · SAGRADA FAMÍLIA: el vuelo del dron en las paredes y un trencadís en el suelo ---------- */
const G_SAGRADA = `
vec3 teja(float k){ k=fract(k); return k<.16?vec3(.05,.32,.72): k<.32?vec3(.96,.74,.10): k<.48?vec3(.93,.93,.90): k<.62?vec3(.90,.36,.10): k<.78?vec3(.10,.56,.36): k<.9?vec3(.16,.62,.78): vec3(.62,.12,.16); }
vec3 mundo(vec3 d){
  if(esSuelo<.5) return pow(texture2D(base, v).rgb, vec3(1./2.2));
  vec2 p=d.xz/-d.y*.965; float r=length(p), an=atan(p.y,p.x);
  /* teselas rotas: Voronoi con junta de mortero blanco */
  vec2 q=p*13.; vec2 i=floor(q), f=fract(q); float d1=9., d2=9.; vec2 id=vec2(0.);
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 o=vec2(h2(i+g), h2(i+g+31.7)); float dd=length(g+o-f); if(dd<d1){ d2=d1; d1=dd; id=i+g; } else if(dd<d2) d2=dd; }
  float junta=smoothstep(.03,.09,d2-d1);
  /* el dibujo: un sol de Gaudí · disco central, corona de rayos y cenefas */
  float banda=floor(r*5.5), rayos=step(0., cos(an*12.+banda*1.3));
  float k = r<.2 ? .2+.05*h2(id) : r<.42 ? (rayos>.5 ? .20 : .52) + .04*h2(id) : r<.5 ? .40 : r<.8 ? (rayos>.5 ? .02 : .82)+.1*h2(id) : .70+.12*h2(id);
  if(h2(id+9.3)>.86) k=h2(id+2.1);
  vec3 c=teja(k)*(.72+.34*h2(id+4.4));
  /* brillo de cerámica vidriada: un reflejo que recorre el suelo */
  float inc=h2(id+1.7)*TAU; float br=pow(max(0., cos(an-T*.35+inc*.25)*.5+.5), 6.)*smoothstep(.3,.0,abs(r-.55-.25*sin(T*.3)));
  c+=vec3(1.,.97,.9)*br*.55*junta;
  return mix(vec3(.90,.89,.85)*(.8+.2*n2(q*6.)), c, junta);
}` + CAPA_SIMPLE;

/* ---------- 2 · AVHUB (v11.36, pedido de Josep, 26-11-2026): un ascensor de cristal que sube por una torre cyberpunk. Cada planta es una app del rack
   (SCREENS · SYSTEMS · ADPOSTER · VJSHOW · MSGAME) y arriba del todo, AVHUB: en la pared frontal, la pantalla con la captura real de la app;
   en las laterales, su logotipo oficial en neón; detrás, la ciudad de noche con lluvia; en el suelo, la cabina con el isotipo. 2 s por planta ---------- */
const G_AVHUB = `
uniform sampler2D capa3;
vec3 colApp(float k){ return k<.5?vec3(.85,1.,0.): k<1.5?vec3(0.,.71,1.): k<2.5?vec3(1.,.66,0.): k<3.5?vec3(0.,1.,.02): k<4.5?vec3(.9,0.,1.): vec3(.62,.25,1.); }
float suave(float x){ x=clamp(x,0.,1.); return x<.5 ? 4.*x*x*x : 1.-pow(-2.*x+2.,3.)/2.; }
#define PISO 1.45
/* altura de la cabina y velocidad (0–1): cada planta, 0,6 s de viaje y parada */
vec2 subida(){ float seg=t/2., k=floor(seg), f=fract(seg); if(k>5.) return vec2(5.*PISO, 0.);
  return vec2((k-1.+suave(f/.6))*PISO, f<.6 ? sin(3.14159*f/.6) : 0.); }
/* la pantalla de la planta k en el punto q (0–1) del atlas de capturas (2 columnas × 3 filas) */
vec3 captura(float k, vec2 q){ float c=mod(k,2.), r=floor(k/2.); q=clamp(q,.002,.998); return pow(texture2D(capa, vec2((c+q.x)*.5, 1.-(r+1.-q.y)/3.)).rgb, vec3(1./2.2)); }
vec4 rotulo(float k, vec2 q, float bias){ vec4 r=texture2D(capa3, vec2(clamp(q.x,0.,1.), 1.-(k+1.-clamp(q.y,0.,1.))/6.), bias); r.rgb=pow(r.rgb, vec3(1./2.2)); return r; }
/* chapa de la torre: paneles oscuros con juntas, rejillas y tiras de neón */
vec3 chapa(vec2 L, float k, float yy){ vec3 col=colApp(k); vec2 g=vec2(L.x/.42, yy/.36); vec2 f=fract(g), id=floor(g);
  float junta=smoothstep(.0,.012,min(min(f.x,1.-f.x),min(f.y,1.-f.y))); vec3 c=vec3(.032,.036,.05)*(.75+.5*h2(id))*mix(.35,1.,junta)+col*.025*smoothstep(.5,0.,abs(f.y-.5))*step(.6,h2(id+3.));
  float rej=step(.72,h2(id+7.))*step(.2,f.x)*step(f.x,.8)*step(.25,f.y)*step(f.y,.75)*step(.5,fract(f.y*14.)); c+=vec3(.03,.035,.05)*rej;
  float tira=smoothstep(.006,.0,abs(fract(L.x/.84+.25)-.5)*.84-.002)*step(.3,h1(floor(L.x/.84+.25)+k*7.));
  c+=mix(col, vec3(1.,.1,.6), step(.5,h1(floor(L.x/.84)+3.)))*tira*(.7+.3*sin(T*3.+L.x*9.))*.9; return c; }
/* forjado entre plantas: hormigón, franjas de aviso y neón en el canto */
vec3 forjado(vec2 L, float yy, float k){ float a=abs(yy); vec3 c=vec3(.05,.05,.06)*(.7+.3*n2(L*40.));
  float rayas=step(.5,fract((L.x+yy)*9.))*step(.66,a)*step(a,.69); c=mix(c, vec3(.9,.7,.05)*.6, rayas);
  c+=vec3(0.,.9,1.)*smoothstep(.01,.0,abs(a-.625))*1.3+vec3(0.,.9,1.)*exp(-pow((a-.625)*40.,2.))*.25; return c; }
/* la ciudad tras el cristal trasero: torres con ventanas, rótulos de neón, más lejos cuanto más arriba; sube despacio (paralaje) */
vec3 ciudad(vec2 L, float s){ float y=L.y+s*.035; vec3 c=mix(vec3(.08,.02,.14), vec3(.005,.008,.03), smoothstep(-.6,.9,y));
  for(int j=0;j<3;j++){ float fj=float(j), es=1.6+fj*1.3, x=L.x*es+fj*17.3, col=floor(x), fx=fract(x), alt=(.1+.9*h1(col+fj*31.))*(1.1-fj*.25)-.3;
    if(y*es*.6<alt && fx>.08 && fx<.92){ vec2 w=vec2(fx*7., y*es*9.); vec2 wi=floor(w); float luz=step(.55,h2(wi+col*3.1+fj))*step(.25,fract(w.x))*step(.3,fract(w.y));
      c=vec3(.01,.012,.025)*(1.-fj*.2)+mix(vec3(1.,.75,.35),vec3(.4,.8,1.),h2(wi+5.))*luz*(.35+.3*fj)/(1.+fj);
      float neon=step(.82,h1(col*7.+fj))*smoothstep(.02,.0,abs(fx-.5)-.25)*smoothstep(.03,.0,abs(y*es*.6-alt+.12)-.03);
      c+=mix(vec3(1.,0.,.6),vec3(0.,.9,1.),h1(col+2.))*neon*(1.2+.4*sin(T*5.+col)); break; } }
  return c; }
/* lluvia sobre el cristal: gotas que resbalan, más largas cuando la cabina sube */
float lluvia(vec2 L, float vel){ vec2 g=vec2(L.x*60., L.y*3.+T*(1.5+vel*9.)); float col=floor(g.x); float y=fract(g.y+h1(col)*7.);
  return step(.85,h1(col*3.7))*smoothstep(.15+vel*.5,.0,y)*smoothstep(.0,.02,y)*smoothstep(.45,.2,abs(fract(g.x)-.5)); }
vec3 mundo(vec3 d){ vec2 sv=subida(); float s=sv.x, vel=sv.y;
  if(esSuelo>.5){ vec2 p=d.xz/-d.y*.965; float k=clamp(floor(s/PISO+.5),0.,5.); vec3 col=colApp(k);
    vec2 g=p*7.; vec2 f=fract(g)-.5; float dia=abs(f.x+f.y)<.08||abs(f.x-f.y)<.08 ? 1. : 0.;   /* chapa lagrimada */
    vec3 c=vec3(.05,.055,.065)*(.8+.3*n2(p*30.))+vec3(.03)*dia;
    float r=max(abs(p.x),abs(p.y)); c+=col*smoothstep(.03,.0,abs(r-.92))*1.2+col*exp(-pow((r-.92)*9.,2.))*.25;
    c+=col*exp(-pow(length(p)*1.4,2.))*.12*(1.+vel); return c; }
  vec2 w=pared(); if(w.x<0.) return vec3(.01); int i=int(w.x+.5); float A = i==0?asp.x: i==1?asp.y: i==2?asp.z: asp.w;
  vec2 L=vec2((w.y-.5)*A, v.y-.5); float Y=s+L.y, k=floor(Y/PISO+.5), yy=Y-k*PISO; vec3 c;
  if(i==3){ c=ciudad(L, s); c+=vec3(.6,.8,1.)*lluvia(L, vel)*.35; c*=.55+.45*smoothstep(.0,.05,w.y)*smoothstep(1.,.95,w.y);   /* montantes del cristal */
    c+=vec3(0.,.9,1.)*smoothstep(.004,.0,abs(w.y-.5)-.004)*.8; return c; }
  if(k<0. || k>5.){ c=vec3(.012,.012,.02)+vec3(0.,.9,1.)*smoothstep(.01,.0,abs(fract(Y*2.)-.5)-.48)*.6; return c; }
  if(abs(yy)>.6) return forjado(L, yy, k);
  vec3 col=colApp(k); c=chapa(L, k, yy); float pulso=.75+.25*sin(T*4.+k);
  if(i==1){ float hs=min(.68, A*.86*9./16.), ws=hs*16./9., cy=.05; vec2 q=vec2(L.x/ws+.5, (yy-cy)/hs+.5);
    vec2 dq=abs(q-.5)-.5; float fuera=max(dq.x*ws, dq.y*hs);
    if(fuera<0.){ float ab=.006*vel+.0015; vec3 im=vec3(captura(k, q+vec2(ab,0.)).r, captura(k, q).g, captura(k, q-vec2(ab,0.)).b);
      im*=.88+.12*sin(v.y*1400.); im*=1.-.6*step(.985,h1(floor(q.y*80.)+floor(T*20.)))*vel; c=im*1.08; }
    c+=col*exp(-max(fuera,0.)*70.)*.9*pulso*step(0.,fuera)+col*smoothstep(.004,.0,abs(fuera))*1.4;
    float wq=hs*1.15, hq=wq*.25; vec2 qt=vec2(L.x/wq+.5, (yy-(cy-hs*.5-hq*.5-.01))/hq+.5); if(k<4.5 && qt.x>0.&&qt.x<1.&&qt.y>0.&&qt.y<1.){ vec4 r=rotulo(k, qt, 0.); c=mix(c, r.rgb*1.2, r.a); } }
  else { float wl=min(A*.86, 1.5), hl=wl*.25; vec2 q=vec2(L.x/wl+.5, yy/hl+.5); vec4 r=rotulo(k, q, 0.), gl=rotulo(k, q, 4.);
    vec3 fl=mix(r.rgb, vec3(1.), .15)*(1.+.25*sin(T*13.+k)*step(.93,h1(floor(T*9.)+k)));
    c+=col*gl.a*1.1*pulso; c=mix(c, fl*1.3, r.a); c+=col*smoothstep(.006,.0,abs(abs(yy)-hl*.95))*step(abs(L.x),wl*.55)*.9; }
  c+=vec3(.6,.8,1.)*lluvia(L, vel)*.18+vec3(.5,.7,1.)*vel*.06*smoothstep(.3,.0,abs(fract(Y*1.3)-.5));   /* reflejo del cristal al subir */
  return c; }
vec3 conCapa(vec3 c, vec4 k, vec3 d){ if(esSuelo<.5) return c; float fl=.85+.15*step(.6,h1(floor(T*12.)));   /* el isotipo y los iconos, como un holograma en el suelo de la cabina */
  return mix(c, k.rgb*fl*(.9+.1*sin(v.y*700.)), k.a*.92); }`;


/* ---------- 3 · EK CHUAH (v11.26): las escenas animadas del juego, una por pared y las cuatro a la vez (un solo vídeo de 2 × 2: alux · santuario / cacao · jade),
   con la cámara entrando en cada sala; el suelo de losas recoge la luz de cada pared. Mientras el vídeo no ha cargado, la imagen fija de cada escena.
   4 · WONDERWALK (v11.27): el camino del juego recorrido de verdad, de la pradera al castillo, grabado en 360° desde el propio juego (cinco caras; ver cubo()).
      Sin vídeo cargado, las imágenes fijas de antes ---------- */
const G_EK = `
/* la escena de la pared i en el punto q (0–1 a lo ancho y a lo alto de su fotograma) */
vec3 escena(int i, vec2 q){ q=clamp(q, vec2(.004,.008), vec2(.996,.992)); vec2 o = i==0?vec2(.5,.5): i==1?vec2(0.,.5): i==2?vec2(.5,0.): vec2(0.,0.); return texture2D(vid, o+q*.5).rgb; }   /* v11.33 · izquierda: altar dorado · frontal: el alux · derecha: la pantera de jade · trasera: el cacao */
/* a sangre en su pared: si la pared es más ancha que el fotograma se recorta poco de alto y los lados continúan en espejo (la sala se alarga) */
vec3 vidPared(){ vec2 w=pared(); if(w.x<0.) return vec3(.02,.015,.01); int i=int(w.x+.5);
  float A = i==0?asp.x: i==1?asp.y: i==2?asp.z: asp.w, R=A/1.7778; vec2 q=vec2(w.y, v.y); q=.5+(q-.5)/(1.+.06*smoothstep(1.9,0.,t));   /* mientras entra el título, las escenas respiran */
  float som=1.; if(R<1.) q.x=.5+(q.x-.5)*R; else { float k=min(R,1.4); q.y=.5+(q.y-.5)/k; q.x=.5+(q.x-.5)*R/k; som=exp(-pow(max(0., abs(q.x-.5)-.47)*3.4,2.)*3.); q.x=abs(mod(q.x+1.,2.)-1.); }   /* lo que continúa en espejo se va a la penumbra */
  return escena(i, q)*som*(.3+.7*smoothstep(0.,.012,w.y)*smoothstep(1.,.988,w.y)); }
/* la luz que cada pared echa sobre el suelo: el pie de su escena, desenfocado, más fuerte junto a ella */
vec3 luzPared(int i, float s, float lejos){ float a = i==0?pu0.x: i==1?pu0.y: i==2?pu0.z: pu0.w; if(a<0.) return vec3(0.);
  s=clamp(s,.04,.96); vec3 c=vec3(0.); for(int j=0;j<2;j++) for(int n=0;n<5;n++) c+=escena(i, vec2(.5+(s-.5)*.6+(float(n)-2.)*.1, .16+.2*float(j)));
  return c/10.*exp(-lejos*lejos*2.2); }
/* suelo de la pirámide, como el de las escenas del juego: losas rectangulares de tamaños desiguales en hiladas al tresbolillo,
   color plano con sombreado de dibujo, junta oscura gruesa, matas de musgo en las juntas y alguna muesca */
vec3 mundo(vec3 d){ if(esSuelo<.5) return hayVid>.5 ? vidPared() : vec3(.02,.015,.01);
  vec2 p=d.xz/-d.y*.965; vec2 w=p+.03*vec2(n2(p*4.)-.5, n2(p*4.+5.)-.5)+.008*vec2(n2(p*17.)-.5, n2(p*17.+3.)-.5);                         /* trazo a mano: las líneas no son rectas del todo */
  float gy=w.y*3.5; float sy=3.5*(1.+.8*cos(gy*2.1+1.3)); gy+=.38*sin(gy*2.1+1.3); float fila=floor(gy), fy=fract(gy);
  float kx=1.7+1.5*h1(fila*3.7); float gx=w.x*kx+h1(fila*7.3)*5.; float sx=kx*(1.+.83*cos(gx*2.3+fila*5.)); gx+=.36*sin(gx*2.3+fila*5.); float col=floor(gx), fx=fract(gx); vec2 id=vec2(col,fila);
  float ax=.011*sx, ay=.011*sy;                                                                       /* junta del mismo grosor en todo el suelo */
  float jx=smoothstep(ax*.5,ax*1.4,fx)*smoothstep(1.-ax*.5,1.-ax*1.4,fx), jy=smoothstep(ay*.5,ay*1.4,fy)*smoothstep(1.-ay*.5,1.-ay*1.4,fy), junta=jx*jy;
  vec3 piedra=mix(vec3(.30,.35,.34), vec3(.47,.52,.49), h2(id))*mix(vec3(1.), vec3(1.04,1.,.94), h2(id+11.));
  piedra*=.93+.07*smoothstep(.35,.65,fbm2(p*9.+id*2.3));                                           /* manchas suaves, sin grano */
  piedra*=1.+.10*smoothstep(.22,.06,fy)*step(.06,fy)+.07*smoothstep(.16,.05,fx)*step(.05,fx);      /* canto iluminado arriba y a la izquierda */
  piedra*=1.-.16*smoothstep(.72,.94,fy)-.10*smoothstep(.8,.95,fx);                                 /* y en sombra abajo y a la derecha */
  vec2 q=vec2(fx,fy)-vec2(.2+.6*h2(id+4.), .25+.5*h2(id+6.)); q=giro(h2(id+2.)*3.)*q;              /* muescas: trazos cortos y oscuros */
  float muesca=step(.5,h2(id+8.))*smoothstep(.012,.004,abs(q.y))*step(abs(q.x),.07+.06*h2(id+9.)); piedra=mix(piedra, vec3(.10,.12,.10), muesca*.8);
  vec3 c=mix(vec3(.035,.05,.05), piedra, junta);
  float cerca=1.-smoothstep(.0,.22,min(min(fx,1.-fx),min(fy,1.-fy)*.7));                            /* musgo en matas, pegado a las juntas */
  float mata=smoothstep(.61,.65, fbm2(p*vec2(3.2,6.5)+3.))*smoothstep(.35,.8,cerca+.45*fbm2(p*20.));
  c=mix(c, mix(vec3(.24,.33,.10), vec3(.40,.50,.16), smoothstep(.45,.6,fbm2(p*22.))), mata);
  float r=length(p), a2=atan(-p.x,p.y); float ll=0.; for(int i=0;i<4;i++){ float a0=TAU*.125+float(i)*TAU*.25; ll+=exp(-pow(dAng(a2,a0)*1.6,2.))*smoothstep(.2,1.3,r)*(.8+.2*n2(vec2(T*7.+float(i)*9.,float(i)))); }
  c*=vec3(1.,.95,.86)*(.8+.4*ll);
  if(hayVid>.5){ vec3 lz=luzPared(1, .5-p.x*.5, 1.-p.y)+luzPared(3, .5+p.x*.5, 1.+p.y)+luzPared(0, .5+p.y*.5, 1.-p.x)+luzPared(2, .5-p.y*.5, 1.+p.x);
    return c*(.4+lz*.85)+lz*.02; }
  c=mix(c, c*vec3(1.35,1.12,.62), exp(-pow((p.y-1.05)*1.2,2.))*.55); c=mix(c, c*vec3(.62,1.2,1.08), exp(-pow((p.y+1.05)*1.2,2.))*.5);   /* la luz dorada del santuario y la verde del jade */
  return c; }
vec3 conCapa(vec3 c, vec4 k, vec3 d){ float an=atan(-d.x,d.z);
  if(hayVid>.5){ vec2 w=pared(); if(esSuelo>.5 || abs(w.x-1.)>.5) return c;                 /* v11.33 · el título, bien grande, viene hacia ti en la pared frontal y deja paso al alux */
    float a=pu0.y, b=pu1.y, cx=(a+b)*.5, al=smoothstep(.1,.5,t)*smoothstep(2.9,2.3,t), z=mix(.28,1.4, pow(clamp((t-.1)/2.7,0.,1.),.75));
    vec2 q=vec2(cx+(v.x-cx)/z, .5+(v.y-.5)/z); c*=1.-.5*al; if(q.x<a || q.x>b || q.y<0. || q.y>1.) return c;
    vec4 kk=texture2D(capa, q); kk.rgb=pow(kk.rgb, vec3(1./2.2)); return mix(c, kk.rgb, kk.a*al); }
  float fl=.93+.07*n2(vec2(T*6.,3.));                                                        /* parpadeo de antorcha */
  float oro = esSuelo>.5 ? .5+.5*sin(t*TAU*.3) : exp(-pow(dAng(an, t*TAU/10.+.6)*2.,2.));   /* la luz dorada que da la vuelta a la sala */
  vec3 col=k.rgb*fl*(1.+.28*oro)+vec3(1.,.75,.2)*oro*.06;
  vec3 g=vec3(floor(v*vec2(esSuelo>.5?40.:160.,40.)), floor(T*2.)); float ch=step(.992,h3(g))*oro; col+=vec3(1.,.9,.5)*ch*.5;
  return mix(c, col, k.a); }`;
const G_WW = `
vec3 mundo(vec3 d){ return hayVid>.5 ? cubo(d) : vec3(.03,.01,.06); }
vec3 conCapa(vec3 c, vec4 k, vec3 d){ vec3 col=k.rgb;
  if(hayVid>.5){ vec2 w=pared(); if(esSuelo>.5 || abs(w.x-1.)>.5) return c;              /* v11.33 · el título, en grande, se escribe a pluma de izquierda a derecha en la pared frontal */
    float al=smoothstep(4.9,4.2,t), pl=mix(-.06,1.08, clamp((t-.3)/2.4,0.,1.))+.018*sin(v.y*11.+t*6.), vis=smoothstep(pl, pl-.035, w.y);
    float punta=exp(-pow((w.y-pl)*34.,2.))*step(.3,t)*step(t,2.75);
    c*=1.-.32*al*smoothstep(.2,.9,t); vec3 col=mix(c, k.rgb, k.a*vis*al); return col+vec3(1.,.93,.7)*punta*k.a*1.5*al; }
  vec2 gq=v*vec2(esSuelo>.5?46.:184.,46.)+vec2(0.,-T*.25); vec2 id=floor(gq); float ch=step(.988,h2(id))*smoothstep(.3,.04,length(fract(gq)-.5))*(.5+.5*sin(T*4.+h2(id+2.)*TAU));
  col+=mix(vec3(.6,1.,.5), vec3(.9,.5,1.), h2(id+5.))*ch*.9;                                 /* chispas de la varita */
  return mix(c, col, k.a); }`;

/* ---------- 5 · DE LA LUNA A LA PLAYA (v11.36, pedido de Josep, 26-11-2026: «de la luna a la tierra, más como Google Earth»; el identificador sigue siendo «volcan»).
   0–6 s: trazado de rayos en la tarjeta gráfica: despegamos de la Luna, la Tierra real (imágenes de la NASA, de día y con las luces de las ciudades de noche)
   crece delante, la sala gira hasta tenerla bajo los pies y bajamos en picado sobre el Pacífico, junto a la línea entre el día y la noche, como en Google Earth.
   6–12 s: el tramo final del recorrido grabado (mar de noche y playa tropical con palmeras y luna llena), en cinco caras (ver cubo()) ---------- */
const G_VOLCAN = `
uniform sampler2D tierra, noche; uniform vec3 uCam, uRg, uUp, uFw, uSol, uLuna, uN0;
float esfera(vec3 o, vec3 d, vec3 c, float r){ vec3 oc=o-c; float b=dot(oc,d), cc=dot(oc,oc)-r*r, h=b*b-cc; if(h<0.) return -1.; float s=-b-sqrt(h); return s>0. ? s : -1.; }
vec2 geo(vec3 n){ return vec2(atan(n.x,n.z)/TAU+.5, asin(clamp(n.y,-1.,1.))/3.14159265+.5); }
/* cráteres de la Luna: en el plano tangente del punto de partida (es el lado que se ve) */
float crat(vec2 p){ vec2 i=floor(p), f=fract(p); float s=0.; for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 o=vec2(h2(i+g),h2(i+g+17.3)); float r=.12+.34*h2(i+g+5.1);
  float dd=length(g+o-f)/r; s+=-.7*smoothstep(1.,.2,dd)+.55*exp(-pow((dd-1.)*5.,2.)); } return s; }
float lejosL=0.;
float relieve(vec3 n){ vec3 e1=normalize(cross(uN0, vec3(.31,.83,.46))), e2=cross(uN0,e1); vec2 q=vec2(dot(n,e1), dot(n,e2));
  return crat(q*22.)*.9+crat(q*90.+3.)*.5+(crat(q*420.+7.)*.3+crat(q*1500.+9.)*.15)*(1.-lejosL)+fbm2(q*60.)*.3; }
vec3 estrellas(vec3 d){ vec3 ge=d*190.; vec3 e=floor(ge); return vec3(.003,.005,.012)+vec3(1.,.97,.92)*step(.9935,h3(e))*smoothstep(.36,.04,length(fract(ge)-.5))*(.4+h3(e+2.)); }
vec3 viaje(vec3 dr){ vec3 d=normalize(uRg*(-dr.x)+uUp*dr.y+uFw*dr.z), o=uCam; vec3 c=estrellas(d);
  float te=esfera(o,d,vec3(0.),1.), tl=esfera(o,d,uLuna,.27);
  if(te>0. && (tl<0. || te<tl)){ vec3 n=normalize(o+d*te); vec2 uv=geo(n); float l=dot(n,uSol), dia=smoothstep(-.06,.22,l);
    float alt=length(o)-1., mip=clamp(log2(te*900.),0.,8.);
    vec3 suelo=texture2D(tierra, uv).rgb, luces=texture2D(noche, uv).rgb;
    float nub=smoothstep(.56,.82, fbm(n*6.+vec3(T*.004,0.,0.))*.72+fbm(n*23.)*.28)*smoothstep(.0008,.02,alt);   /* nubes que se abren al bajar */
    float mar=smoothstep(.02,.1, suelo.b-max(suelo.r,suelo.g)*.85);                                  /* el mar: grano de oleaje y reflejo del sol al bajar */
    suelo*=1.+mar*(fbm(n*2600.)-.5)*.5*smoothstep(.2,.005,alt);
    vec3 dd=suelo*(.1+1.25*max(l,0.))+vec3(1.,.93,.8)*mar*pow(max(dot(reflect(d,n),uSol),0.),40.)*.8*max(l,0.), nn=suelo*vec3(.13,.17,.28)+luces*luces*vec3(1.,.78,.45)*1.6;
    vec3 col=mix(nn, dd, dia); col=mix(col, vec3(.95,.97,1.)*(.05+1.1*max(l,0.))+vec3(.03,.04,.07), nub*.85);
    float mu=max(dot(n,-d),0.); col+=vec3(.25,.55,1.)*pow(1.-mu,2.5)*(.15+.9*smoothstep(-.25,.3,l))*smoothstep(.0,.05,alt+.01);
    col+=vec3(1.,.45,.15)*exp(-pow(l*9.,2.))*.12;                                                    /* el borde del atardecer */
    c=col; }
  else if(tl>0.){ vec3 n=normalize(o+d*tl-uLuna); vec3 sp=normalize(uSol-n*dot(uSol,n)); lejosL=smoothstep(.05,.6,tl);
    float e=max(.00004, tl*.004); float g=(relieve(normalize(n+sp*e))-relieve(normalize(n-sp*e)))/(2.*e); float l=dot(n,uSol);
    float alb=.62*(.72+.28*fbm(n*4.))*(.9+.12*relieve(n)); c=vec3(alb)*vec3(1.,.98,.95)*clamp(l*1.25+g*e*9.,0.,1.7)+vec3(.006); }
  else { float b0=dot(-o,d); if(b0>0.){ vec3 cp=o+d*b0; float b=length(cp); c+=vec3(.25,.55,1.)*exp(-(b-1.)*28.)*(.15+.85*smoothstep(-.3,.4,dot(normalize(cp),uSol))); } }
  return c; }
vec3 mundo(vec3 d){ vec3 c=viaje(d), bruma=mix(vec3(.10,.22,.42), vec3(.02,.07,.20), smoothstep(-.6,.6,d.y));
  c=mix(c, bruma, smoothstep(5.35,6.,t));                                                              /* entramos en la bruma marina de noche */
  if(hayVid>.5) c=mix(c, cubo(d), smoothstep(5.85,6.45,t)); else c=mix(c, bruma, smoothstep(6.,6.4,t));
  return c; }` + CAPA_SIMPLE;


/* ---------- 6 · BARCELONA (v11.32): las ocho fotografías antiguas a toda pared, dos por pared una tras otra, que se colorean; suelo fijo de mosaico hidráulico y panots ---------- */
const G_BCN = `
float flor(vec2 f){ vec2 q=abs(f-.5); float pet=min(length(q-vec2(.2,.0)), length(q-vec2(.0,.2)))-.13; float cen=length(f-.5)-.085; float ar=abs(length(f-.5)-.4)-.012;
  return min(min(abs(pet)-.018, abs(cen)-.016), max(ar, -1.)); }
vec3 hidra(vec2 p){ vec2 f=fract(p)-.5; vec2 a=abs(f); float est=max(a.x,a.y)*.72+min(a.x,a.y)*.72; float rombo=a.x+a.y; float r=length(f);
  vec3 crema=vec3(.90,.85,.72), teja=vec3(.66,.26,.16), azul=vec3(.16,.28,.46), verde=vec3(.26,.42,.30), ocre=vec3(.80,.58,.22);
  vec3 c=crema; c=mix(c, azul, step(rombo,.5)*step(.42,rombo)); c=mix(c, teja, step(est,.31)); c=mix(c, crema, step(r,.2)); c=mix(c, verde, step(r,.15)*step(.5,fract(atan(f.y,f.x)/TAU*8.))); c=mix(c, ocre, step(r,.07));
  vec2 e=abs(fract(p+.5)-.5); c=mix(c, ocre, step(length(e),.13)); c=mix(c, azul, step(length(e),.07));
  return c*(.9+.1*n2(p*40.)); }
vec3 mundo(vec3 d){ float L=length(d.xz), an=atan(-d.x,d.z);
  if(esSuelo>.5){ vec2 p=d.xz/-d.y*.965; float r=length(p), a2=atan(-p.x,p.y); vec3 c;
    float luz=.78+.22*smoothstep(-1.,1., p.x*.6+p.y*.8);
    /* v11.33 · todo el suelo es panot de flor (se retiran el mosaico hidráulico del centro y el panot hexagonal) */
    { vec2 g=p*8.; float s=flor(fract(g)); vec2 e=min(fract(g),1.-fract(g)); float junta=smoothstep(.0,.03,min(e.x,e.y));
      float rel=smoothstep(-.012,.012,s); c=vec3(.50,.51,.50)*(.62+.38*rel)*(.86+.14*n2(g*30.))*mix(.45,1.,junta)*luz; c+=vec3(.5)*smoothstep(.02,.0,abs(s-.014))*.12; }
    return c; }   /* v11.32 · el suelo queda fijo (antes lo barría una franja de sol) */
  float y=d.y/L; vec3 u=vec3(cos(an),sin(an),0.);
  vec3 c=mix(vec3(.93,.88,.76), vec3(.84,.76,.60), fbm(vec3(u.xy*6., y*6.)))*(.92+.08*n3(vec3(u.xy*120.,y*120.)));
  /* arrimadero de azulejo modernista abajo y cenefa arriba */
  if(y<-.55){ vec2 g=vec2(an/TAU*64., (y+.97)*10.2); c=hidra(g)*.9; c=mix(c, vec3(.16,.28,.46), step(-.575,y)); }
  float cen=step(.47,y)*step(y,.56); float lat=.5+.5*sin(an*40.)*sin(an*40.+y*30.); c=mix(c, mix(vec3(.26,.42,.30), vec3(.80,.58,.22), lat), cen*.85);
  return c; }
/* v11.32 · cada pared es una fotografía a toda pared (sin marcos ni paseo): entra en blanco y negro, se colorea como una postal iluminada a mano con una ola
   que recorre la sala y se acerca muy despacio; a media pista se funde con la segunda fotografía de esa pared */
vec3 fotoBcn(sampler2D s, float tt, float an){ vec3 g=pow(texture2D(s, uvCapa(1.03+.09*clamp(tt,0.,6.6)/6.6)).rgb, vec3(1./2.2)); float lum=dot(g, vec3(.3,.59,.11)), y=v.y;
  vec3 tinte=mix(mix(vec3(.50,.33,.20), vec3(.86,.70,.50), smoothstep(.1,.6,lum)), vec3(.60,.80,.98), smoothstep(.55,.95,lum)*smoothstep(.45,.8,y));
  tinte=mix(tinte, vec3(.36,.52,.30), smoothstep(.25,.5,lum)*smoothstep(.5,.2,y)*.35);
  vec3 col=mix(vec3(lum), tinte*(.35+lum*.95), .82); float ola=smoothstep(-.4,.4, tt*1.15-1.3-dAng(an,0.)*.5+(y-.5)*.6);
  return mix(vec3(lum)*vec3(1.,.97,.9), col, ola); }
vec3 conCapa(vec3 c, vec4 k, vec3 d){ float an=atan(-d.x,d.z); if(k.a<.5) return c;
  return mix(fotoBcn(capa, t, an), fotoBcn(capa2, t-5.7, an), smoothstep(5.7,6.5,t)); }`;

/* ---------- capas de rótulos e imágenes (lienzo 2D, se pintan una vez por pista y por reparto de paredes) ---------- */
const IMG = {}; let imgV = 0;
function img(n) { if (IMG[n]) return IMG[n].ok ? IMG[n].el : null; const el = new Image(); IMG[n] = { el, ok: false }; el.onload = () => { IMG[n].ok = true; imgV++; }; el.onerror = () => { IMG[n].mal = true; }; el.src = RAIZ + n; return null; }
/* dibuja en el centro de una pared con píxeles «cuadrados» en metros: fn(x, h, anchoÚtil) con el alto de la pared = 512 */
function enPared(x, P, fn) { const u0 = P.u0 * W, u1 = P.u1 * W, kx = (u1 - u0) / P.w, ky = H / P.h, e = kx / ky; x.save(); x.beginPath(); x.rect(u0, 0, u1 - u0, H); x.clip(); x.translate((u0 + u1) / 2, 0); x.scale(e, 1); fn(x, H, (u1 - u0) / e); x.restore(); }
function encaja(x, txt, ancho, px, peso = 800, fam = 'Inter, Arial, sans-serif') { let s = px; do { x.font = `${peso} ${s}px ${fam}`; s -= 2; } while (x.measureText(txt).width > ancho && s > 10); }
function placa(x, y, w, h, r = 14) { x.beginPath(); x.roundRect(-w / 2, y, w, h, r); x.fillStyle = 'rgba(4,4,10,.86)'; x.fill(); }
function cubre(x, im, dx, dy, dw, dh) { const a = im.width / im.height, b = dw / dh; let sw = im.width, sh = im.height; if (a > b) sw = sh * b; else sh = sw / b; x.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, dx, dy, dw, dh); }

/* AVHUB: logotipo e isotipos oficiales (assets/sim/pistas, copiados de la web de AVHUB) y una captura real de cada app */
const APPS = [['screens', '#d8ff00'], ['systems', '#00b4ff'], ['adposter', '#ffa800'], ['vjshow', '#00ff04'], ['msgame', '#e600ff']];
const ASP = { avhub: 2978 / 1817, iso: 1587 / 1251, screens: 427.6 / 120, systems: 448.6 / 120, adposter: 454.5 / 120, vjshow: 469.6 / 120, msgame: 444.2 / 120 };
function tarjeta(x, cx, y0, ww, app, col) { const cap = img('sim/pistas/app-' + app + '.webp'), lg = img('sim/pistas/logo-' + app + '.svg'), hh = ww * 9 / 16, lh = Math.min(74, ww / ASP[app] * .62), lw = lh * ASP[app];
  x.save(); x.translate(cx, 0); placa(x, y0 - 16, ww + 32, hh + lh + 52, 20); x.lineWidth = 3; x.strokeStyle = col; x.beginPath(); x.roundRect(-ww / 2 - 16, y0 - 16, ww + 32, hh + lh + 52, 20); x.stroke();
  if (cap) { x.save(); x.beginPath(); x.roundRect(-ww / 2, y0, ww, hh, 8); x.clip(); cubre(x, cap, -ww / 2, y0, ww, hh); x.restore(); }
  if (lg) x.drawImage(lg, -lw / 2, y0 + hh + 12, lw, lh); x.restore(); }
/* v11.36 · ascensor: atlas de las seis plantas (2 × 3 celdas de 1024 × 576): las cinco capturas reales y, arriba del todo, AVHUB con su lema */
const CV_AT = [2048, 1728], CV_ROT = [1024, 1536];
function capaAvhub(x) { APPS.forEach(([app], k) => { const im = img('sim/pistas/app-' + app + '.webp'), cx = (k % 2) * 1024, cy = Math.floor(k / 2) * 576;
    x.fillStyle = '#05060a'; x.fillRect(cx, cy, 1024, 576); if (im) cubre(x, im, cx, cy, 1024, 576); });
  const cx = 1024, cy = 1152, lg = img('sim/pistas/logo-avhub.svg'); const g0 = x.createRadialGradient(cx + 512, cy + 288, 20, cx + 512, cy + 288, 560); g0.addColorStop(0, '#1a0f33'); g0.addColorStop(1, '#030308'); x.fillStyle = g0; x.fillRect(cx, cy, 1024, 576);
  const lh = 300, lw = lh * ASP.avhub; if (lg) x.drawImage(lg, cx + 512 - lw / 2, cy + 70, lw, lh);
  const g = x.createLinearGradient(cx + 512 - lw / 2, 0, cx + 512 + lw / 2, 0); g.addColorStop(0, '#9900ff'); g.addColorStop(.55, '#00b4ff'); g.addColorStop(1, '#00ff04'); x.fillStyle = g; x.fillRect(cx + 512 - lw / 2, cy + 392, lw, 4);
  x.textAlign = 'center'; x.textBaseline = 'middle'; encaja(x, 'TOOLS FOR AV PEOPLE', lw, 44, 500, '"Share Tech Mono", monospace'); x.fillStyle = '#e9ecf2'; x.fillText('TOOLS FOR AV PEOPLE', cx + 512, cy + 440);
  x.font = '500 26px "Share Tech Mono", monospace'; x.fillStyle = '#8f96a8'; x.fillText('avhub.mediaservi.com', cx + 512, cy + 500); }
/* rótulos de las plantas (6 filas de 1024 × 256): el logotipo oficial de cada app y, en la última, el de AVHUB */
function capaRotulos(x) { [...APPS.map((a) => a[0]), 'avhub'].forEach((app, k) => { const lg = img('sim/pistas/logo-' + app + '.svg'); if (!lg) return; const a = ASP[app]; let w = 900, h = w / a; if (h > 190) { h = 190; w = h * a; } x.drawImage(lg, 512 - w / 2, k * 256 + 128 - h / 2, w, h); }); }
function capaAvhubSuelo(x) { const c = WS / 2, iso = img('sim/pistas/isotipo-avhub.svg'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.beginPath(); x.arc(c, c, 190, 0, 7); x.fillStyle = 'rgba(4,4,10,.92)'; x.fill();
  const g = x.createLinearGradient(c - 190, 0, c + 190, 0); g.addColorStop(0, '#9900ff'); g.addColorStop(.55, '#00b4ff'); g.addColorStop(1, '#00ff04'); x.lineWidth = 6; x.strokeStyle = g; x.stroke();
  if (iso) { const ih = 170, iw = ih * ASP.iso; x.drawImage(iso, c - iw / 2, c - ih / 2 - 22, iw, ih); } x.fillStyle = '#e9ecf2'; x.font = '500 22px "Share Tech Mono", monospace'; x.fillText('avhub.mediaservi.com', c, c + 104);
  APPS.forEach(([app, col], i) => { const an = -Math.PI / 2 + i * Math.PI * 2 / APPS.length, px = c + Math.cos(an) * 345, py = c + Math.sin(an) * 345, ic = img('sim/pistas/icono-' + app + '.svg');
    x.beginPath(); x.arc(px, py, 62, 0, 7); x.fillStyle = 'rgba(4,4,10,.92)'; x.fill(); x.lineWidth = 3; x.strokeStyle = col; x.stroke(); if (ic) x.drawImage(ic, px - 38, py - 38, 76, 76); }); }

/* una escena original por pared, a sangre; si falta una pared, su escena no sale (el resto no se mueve) */
function sangre(x, P, mapa) { P.forEach((p) => enPared(x, p, (x, h, a) => { const im = img('sim/pistas/' + (mapa[p.id] || mapa.frontal) + '.webp'); if (im) cubre(x, im, -a / 2, 0, a, h); else { x.fillStyle = '#0b0b10'; x.fillRect(-a / 2, 0, a, h); } })); }
function sueloImg(x, n) { const im = img('sim/pistas/' + n + '.webp'); if (im) cubre(x, im, 0, 0, WS, WS); }
function rotuloImg(x, P, n, alto, pie) { const p = P.find((q) => q.id === 'frontal') || P[0]; if (!p) return; enPared(x, p, (x, h, a) => { const ti = img('sim/pistas/' + n + '.webp'); if (!ti) return; let th = h * alto, tw = th * ti.width / ti.height; if (tw > a * .8) { tw = a * .8; th = tw * ti.height / ti.width; } x.drawImage(ti, -tw / 2, h * pie - th, tw, th); }); }
const EK_IMG = { frontal: 'ek-alux', izquierda: 'ek-santuario', derecha: 'ek-jade', trasera: 'ek-cacao' };
function capaEk(x, P, conVideo) { if (!conVideo) sangre(x, P, EK_IMG); rotuloImg(x, P, 'ek-titulo', conVideo ? .66 : .34, conVideo ? .83 : .99); }
const WW_IMG = { frontal: 'ww-castillo', izquierda: 'ww-camino', derecha: 'ww-puente', trasera: 'ww-bosque' };
function capaWw(x, P, conVideo) { if (!conVideo) sangre(x, P, WW_IMG); rotuloImg(x, P, 'ww-titulo', conVideo ? .52 : .3, conVideo ? .75 : .34); }

/* Barcelona: fotografías antiguas en dominio público (assets/sim/pistas/bcn-01 … 08 y CREDITOS.md).
   Dos por pared, una detrás de otra, a toda pared */
const BCN = { izquierda: [5, 4], frontal: [1, 2], derecha: [6, 3], trasera: [7, 8] };
const capaBcnN = (n) => (x, P) => P.forEach((p) => enPared(x, p, (x, h, a) => { const L = P.length === 1 ? [1, 2] : (BCN[p.id] || [1, 2]), im = img('sim/pistas/bcn-0' + L[n] + '.webp'); if (im) cubre(x, im, -a / 2, 0, a, h); else { x.fillStyle = '#d9c9a0'; x.fillRect(-a / 2, 0, a, h); } }));

/* ---------- las pistas ---------- */
const PISTAS = [
  { id: 'sagrada', glsl: G_SAGRADA, dron: true },
  { id: 'avhub', glsl: G_AVHUB, capa: capaAvhub, cv: CV_AT, capaR: capaRotulos, capaSuelo: capaAvhubSuelo },
  { id: 'ekchuah', glsl: G_EK, capa: capaEk, zoom: .07, video: 'sim/pistas/ek-360.mp4', vdur: 10, vini: 1.8 },
  { id: 'wonderwalk', glsl: G_WW, capa: capaWw, capaSuelo: (x) => sueloImg(x, 'ww-suelo'), zoom: .07, video: 'sim/pistas/ww-360.mp4', vdur: 12 },
  { id: 'volcan', glsl: G_VOLCAN, video: 'sim/pistas/volcan-360.mp4', vdur: 12, vini: 5.85, voff: 6, tierra: true },
  { id: 'barcelona', glsl: G_BCN, capa: capaBcnN(0), capaB: capaBcnN(1) },
];
export const PISTAS_ID = PISTAS.map((p) => p.id);

/* v11.36 · el viaje de la Luna a la Tierra: posición y orientación de la cámara en cada instante (la Tierra mide 1, centrada en el origen).
   Destino: la Gran Barrera de Coral, frente a Cairns (16,6° S · 146° E), de tarde; la noche del vídeo llega al atravesar la bruma */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const VJ = (() => { const la = -16.6 * Math.PI / 180, lo = 146.0 * Math.PI / 180, PT = V3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo));
  const T1 = V3(0, 1, 0).cross(PT).normalize(), N1 = PT.clone().cross(T1).normalize();          /* este y norte en el destino */
  const SOL = PT.clone().multiplyScalar(.4).add(T1.clone().multiplyScalar(-.92)).normalize();   /* el Sol, de tarde en el destino (la noche llega al entrar en la bruma) */
  const md = PT.clone().multiplyScalar(.6).add(N1.clone().multiplyScalar(.35)).add(T1.clone().multiplyScalar(-.72)).normalize(), LUNA = md.clone().multiplyScalar(5);
  const aT = md.clone().negate(), sp = SOL.clone().sub(md.clone().multiplyScalar(SOL.dot(md))).normalize();
  const n0 = aT.clone().multiplyScalar(Math.cos(1.33)).add(sp.multiplyScalar(Math.sin(1.33))).normalize();   /* de pie en la Luna, con la Tierra a unos 14° sobre el horizonte */
  return { PT, N1, SOL, LUNA, n0, aT }; })();
const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
function camino(t) { const { PT, N1, LUNA, n0, aT } = VJ;
  const sube = .0015 + .9 * Math.pow(ss(0, 2.6, t), 1.6), Pl = LUNA.clone().add(n0.clone().multiplyScalar(.27 + sube));
  const H1 = 1.35, Pa = PT.clone().multiplyScalar(1 + H1), k = ss(.9, 3.9, t); let P = Pl.lerp(Pa, k);
  if (t > 3.9) { const e = ss(3.9, 6.1, t), h = Math.exp(Math.log(H1) * (1 - e) + Math.log(.0012) * e); P = PT.clone().multiplyScalar(1 + h); }
  const kU = ss(1.1, 4.4, t), U = n0.clone().multiplyScalar(1 - kU).add(PT.clone().multiplyScalar(kU)).normalize();
  const kF = ss(2.6, 4.6, t), fRef = P.clone().negate().normalize().multiplyScalar(1 - kF).add(N1.clone().multiplyScalar(kF));   /* el frente mira a la Tierra hasta tenerla bajo los pies */ const F = fRef.sub(U.clone().multiplyScalar(fRef.dot(U))).normalize(), R = F.clone().cross(U).normalize();
  return { P, U, F, R: R.negate() }; }

export function crearPistas(renderer) {
  const dron = crearDron(renderer);
  const opc = { generateMipmaps: false }, rt = new THREE.WebGLRenderTarget(W, H, opc), rtS = new THREE.WebGLRenderTarget(WS, WS, opc);
  /* v11.36 · para la mezcla directa: la pista que sale y la que entra se pintan aparte y se funden en rt / rtS */
  const rtA = new THREE.WebGLRenderTarget(W, H, opc), rtAS = new THREE.WebGLRenderTarget(WS, WS, opc), rtB = new THREE.WebGLRenderTarget(W, H, opc), rtBS = new THREE.WebGLRenderTarget(WS, WS, opc);
  const geo = new THREE.PlaneGeometry(2, 2), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), esc = new THREE.Scene(), quad = new THREE.Mesh(geo); quad.frustumCulled = false; esc.add(quad);
  const negro = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); negro.needsUpdate = true;
  const matMez = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { A: { value: negro }, B: { value: negro }, m: { value: 0 }, modo: { value: 0 }, semilla: { value: 0 }, esSuelo: { value: 0 } },
    vertexShader: 'varying vec2 vv; void main(){ vv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: MEZCLA });
  let paredes = [{ id: 'izquierda', u0: 0, u1: .25, w: 5, h: 3 }, { id: 'frontal', u0: .25, u1: .5, w: 5, h: 3 }, { id: 'derecha', u0: .5, u1: .75, w: 5, h: 3 }, { id: 'trasera', u0: .75, u1: 1, w: 5, h: 3 }], firma = '', uF = .5;
  const ORD = ['izquierda', 'frontal', 'derecha', 'trasera'];
  const lienzo = (w, h, mip) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    tx.generateMipmaps = !!mip; tx.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; return { cv, tx }; };
  PISTAS.forEach((p) => {
    p.mat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false,
      uniforms: { t: { value: 0 }, T: { value: 0 }, esSuelo: { value: 0 }, uF: { value: .5 }, fade: { value: 1 }, trans: { value: 0 }, semilla: { value: 0 }, hayCapa: { value: 0 }, zoomCapa: { value: p.zoom || 0 }, hayVid: { value: 0 }, capa: { value: negro }, capa2: { value: negro }, capa3: { value: negro }, vid: { value: negro }, asp: { value: new THREE.Vector4(1.67, 1.67, 1.67, 1.67) }, base: { value: dron.rt.texture }, pu0: { value: new THREE.Vector4(-1, -1, -1, -1) }, pu1: { value: new THREE.Vector4(-1, -1, -1, -1) },
        tierra: { value: negro }, noche: { value: negro }, uCam: { value: V3(0, 0, 8) }, uRg: { value: V3(1, 0, 0) }, uUp: { value: V3(0, 1, 0) }, uFw: { value: V3(0, 0, -1) }, uSol: { value: VJ.SOL.clone() }, uLuna: { value: VJ.LUNA.clone() }, uN0: { value: VJ.n0.clone() } },
      vertexShader: 'varying vec2 vv; void main(){ vv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: COMUN + p.glsl + FIN });
    if (p.capa) { const c = p.cv || [W, H]; const l = lienzo(c[0], c[1], false); p.cv = l.cv; p.tx = l.tx; }
    if (p.capaB) { const l = lienzo(W, H, false); p.cvB = l.cv; p.txB = l.tx; }
    if (p.capaR) { const l = lienzo(CV_ROT[0], CV_ROT[1], true); p.cvR = l.cv; p.txR = l.tx; }
    if (p.capaSuelo) { const l = lienzo(WS, WS, false); p.cvS = l.cv; p.txS = l.tx; p.txS.generateMipmaps = true; p.txS.minFilter = THREE.LinearMipmapLinearFilter; }
    /* v11.26 · pista con vídeo: un solo elemento, sin sonido, que se lleva al compás de la pista · v11.31: cada vídeo se descarga cuando le toca o cuando va a ser el siguiente (no los cinco al abrir SIMULAR) */
    if (p.video) { const el = document.createElement('video'); el.muted = true; el.playsInline = true; el.setAttribute('playsinline', ''); el.setAttribute('muted', ''); el.preload = 'none'; el.crossOrigin = 'anonymous'; el.src = RAIZ + p.video;
      p.vid = el; p.txV = new THREE.VideoTexture(el); p.txV.generateMipmaps = false; p.txV.minFilter = p.txV.magFilter = THREE.LinearFilter; p.vOk = false; }
    p.hecha = '';
  });
  /* v11.36 · las imágenes de la Tierra (NASA, dominio público) se descargan cuando la pista va a salir */
  function texTierra(p) { if (!p.tierra || p.texT) return; p.texT = true; const ld = new THREE.TextureLoader();
    [['tierra', 'sim/pistas/tierra-dia.webp'], ['noche', 'sim/pistas/tierra-noche.webp']].forEach(([u, f]) => ld.load(RAIZ + f, (tx) => { tx.colorSpace = THREE.NoColorSpace; tx.wrapS = THREE.RepeatWrapping; tx.anisotropy = 4; p.mat.uniforms[u].value = tx; })); }
  /* el vídeo dura vdur y la pista DUR: va algo más lento para llenarla entera; si se descuadra (pestaña en segundo plano, equipo lento) se recoloca.
     vini: hasta ese instante de la pista el vídeo espera quieto · voff: el segundo del vídeo por el que empieza (v11.36) */
  function carga(p) { if (!p) return; texTierra(p); if (p.vid && !p.vCarga) { p.vCarga = true; p.vid.preload = 'auto'; try { p.vid.load(); } catch (e) {} } }
  function video(p, activa, tl, quieto) { const el = p.vid; if (!activa) { if (!el.paused) el.pause(); return; } carga(p);
    p.vOk = el.readyState >= 2 && !el.error; if (el.readyState < 1) return;
    const v0 = p.vini || 0, vo = p.voff || 0, k = (p.vdur - vo) / (DUR - v0), obj = Math.min(p.vdur - .06, Math.max(vo, vo + (tl - v0) * k));
    if (quieto || tl < v0) { if (!el.paused) el.pause(); if (Math.abs(el.currentTime - obj) > .03 && !el.seeking) el.currentTime = obj; return; }
    if (el.playbackRate !== k) el.playbackRate = k;
    if (Math.abs(el.currentTime - obj) > .3 && !el.seeking) el.currentTime = obj;
    if (el.paused && !p.vEsp) { p.vEsp = true; const pr = el.play(); if (pr && pr.then) pr.catch(() => {}).then(() => { p.vEsp = false; }); else p.vEsp = false; } }
  function capas(p) { const f = firma + '|' + imgV + '|' + (document.fonts ? document.fonts.status : '') + '|' + (p.vOk ? 'v' : ''); if (p.hecha === f) return; p.hecha = f;
    if (p.capa) { const x = p.cv.getContext('2d'); x.clearRect(0, 0, p.cv.width, p.cv.height); try { p.capa(x, paredes, !!p.vOk); } catch (e) {} p.tx.needsUpdate = true; }
    if (p.capaB) { const x = p.cvB.getContext('2d'); x.clearRect(0, 0, W, H); try { p.capaB(x, paredes); } catch (e) {} p.txB.needsUpdate = true; }
    if (p.capaR) { const x = p.cvR.getContext('2d'); x.clearRect(0, 0, p.cvR.width, p.cvR.height); try { p.capaR(x); } catch (e) {} p.txR.needsUpdate = true; }
    if (p.capaSuelo) { const x = p.cvS.getContext('2d'); x.clearRect(0, 0, WS, WS); try { p.capaSuelo(x); } catch (e) {} p.txS.needsUpdate = true; } }
  /* orden al azar sin repetir pista seguida: se barajan las seis y se vuelve a barajar al acabar la tanda */
  const az = azarDe(Math.floor(Math.random() * 2147483000) + 1), az2 = azarDe(Math.floor(Math.random() * 2147483000) + 1), cola = []; let fija = null;
  function pistaN(n) { while (cola.length <= n) { const b = PISTAS.map((_, i) => i); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(az() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } if (cola.length && b[0] === cola[cola.length - 1]) b.push(b.shift()); cola.push(...b); } return cola[n]; }
  /* una mezcla al azar por corte (el corte n separa la pista n de la n+1), sin repetir la anterior */
  const cortes = []; function corteN(n) { while (cortes.length <= n) { let e; do { e = Math.floor(az2() * NMEZ); } while (cortes.length && e === cortes[cortes.length - 1].e); cortes.push({ e, s: az2() }); } return cortes[n]; }
  /* pinta una pista en su instante local tl sobre los destinos dados */
  function una(p, tl, T, dP, dS) { const U = p.mat.uniforms; capas(p);
    if (p.tierra) { const c = camino(Math.max(0, tl)); U.uCam.value.copy(c.P); U.uRg.value.copy(c.R); U.uUp.value.copy(c.U); U.uFw.value.copy(c.F); }
    U.hayVid.value = p.vOk ? 1 : 0; U.vid.value = p.vOk ? p.txV : negro; U.zoomCapa.value = p.vOk ? 0 : (p.zoom || 0); U.t.value = Math.max(0, tl); U.T.value = T; U.uF.value = uF; U.fade.value = 1;
    const a = [-1, -1, -1, -1], b = [-1, -1, -1, -1]; paredes.forEach((q) => { const i = ORD.indexOf(q.id); if (i >= 0) { a[i] = q.u0; b[i] = q.u1; } }); U.pu0.value.fromArray(a); U.pu1.value.fromArray(b); const as = [1.67, 1.67, 1.67, 1.67]; paredes.forEach((q) => { const i = ORD.indexOf(q.id); if (i >= 0 && q.w > 0 && q.h > 0) as[i] = q.w / q.h; }); U.asp.value.fromArray(as);
    quad.material = p.mat; U.capa3.value = p.capaR ? p.txR : negro;
    U.esSuelo.value = 0; U.hayCapa.value = p.capa ? 1 : 0; U.capa.value = p.capa ? p.tx : negro; U.capa2.value = p.capaB ? p.txB : negro; renderer.setRenderTarget(dP); renderer.render(esc, cam);
    U.esSuelo.value = 1; U.hayCapa.value = p.capaSuelo ? 1 : 0; U.capa.value = p.capaSuelo ? p.txS : negro; renderer.setRenderTarget(dS); renderer.render(esc, cam); }
  function mezcla(m, modo, sem) { const M = matMez.uniforms; quad.material = matMez; M.m.value = m; M.modo.value = modo; M.semilla.value = sem;
    M.esSuelo.value = 0; M.A.value = rtA.texture; M.B.value = rtB.texture; renderer.setRenderTarget(rt); renderer.render(esc, cam);
    M.esSuelo.value = 1; M.A.value = rtAS.texture; M.B.value = rtBS.texture; renderer.setRenderTarget(rtS); renderer.render(esc, cam); }
  function pinta(T) { const prev = renderer.getRenderTarget();
    let pa, ta, pb = null, tb = 0, m = 0, ct = null;
    if (fija && fija.b != null) { pa = PISTAS[fija.i]; ta = fija.t != null ? fija.t : DUR; pb = PISTAS[fija.b]; tb = 0; m = fija.m; ct = { e: fija.modo || 0, s: .37 }; }
    else if (fija) { pa = PISTAS[fija.i]; ta = fija.t != null ? fija.t : T % DUR; }
    else { const n = Math.floor(T / DUR), tl = T - n * DUR; pa = PISTAS[pistaN(n)]; ta = tl;
      if (tl > DUR - SOLAPE / 2) { pb = PISTAS[pistaN(n + 1)]; tb = tl - DUR; m = (tl - (DUR - SOLAPE / 2)) / SOLAPE; ct = corteN(n); }
      else if (n > 0 && tl < SOLAPE / 2) { pb = pa; tb = tl; pa = PISTAS[pistaN(n - 1)]; ta = tl + DUR; m = (tl + SOLAPE / 2) / SOLAPE; ct = corteN(n - 1); } }
    if ((pa.dron || (pb && pb.dron))) { dron.frente(uF); dron.pinta(T); }
    const quieto = !!(fija && fija.t != null);
    PISTAS.forEach((q) => { if (q.vid) { if (q === pa) video(q, true, ta, quieto); else if (q === pb) video(q, true, Math.max(0, tb), quieto); else video(q, false); } });
    if (!fija) carga(PISTAS[pistaN(Math.floor(T / DUR) + 1)]); carga(pa); if (pb) carga(pb);
    if (!pb) una(pa, ta, T, rt, rtS);
    else { una(pa, ta, T, rtA, rtAS); una(pb, tb, T, rtB, rtBS); mezcla(m * m * (3 - 2 * m), ct.e, ct.s); }
    renderer.setRenderTarget(prev);
  }
  return { rt, rtSuelo: rtS, pinta, dur: DUR, frente: (u) => { uF = u; },
    paredes: (L) => { if (!L || !L.length) return; const f = JSON.stringify(L); if (f !== firma) { firma = f; paredes = L; } },
    fijar: (id, t) => { const i = PISTAS_ID.indexOf(id); fija = i < 0 ? null : { i, t }; },   /* para pruebas y capturas: una pista (y un instante) fijos */
    fijarMezcla: (a, b, m, modo, t) => { const i = PISTAS_ID.indexOf(a), j = PISTAS_ID.indexOf(b); fija = i < 0 || j < 0 ? null : { i, b: j, m, modo, t }; } };
}
