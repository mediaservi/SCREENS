// SCREENS · SIMULAR por pistas (v11.21, pedido por Josep, 25-11-2026): seis pistas de 12 s (v11.25; antes 10) que se suceden al azar y en bucle, con una transición al azar entre doce en cada corte.
// Cada pista es un «mundo» visto desde el centro de la sala: las paredes lo miran en 360° continuo (la vuelta casa en la esquina)
// y el suelo mira hacia abajo, de modo que pared y suelo casan en el zócalo. Todas pintan las 4 paredes y el suelo; la escena
// solo enseña las superficies que tenga el proyecto. Casi todo se genera en la tarjeta gráfica (sin vídeos que descargar).
import * as THREE from 'three';
import { crearDron } from './simula.js';

const DUR = 12, FUND = 0.8, NTRANS = 12, W = 2048, H = 512, WS = 1024;
const RAIZ = new URL('../assets/', import.meta.url).href;
const azarDe = (s) => { let a = s; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; };

/* ---------- GLSL común: ruido, rayo de cada píxel y composición con la capa de rótulos e imágenes ---------- */
const COMUN = `precision highp float;
uniform float t, T, esSuelo, uF, fade, trans, semilla, hayCapa, zoomCapa; uniform sampler2D capa, base; uniform vec4 pu0, pu1; varying vec2 vv; vec2 v;
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
/* la capa vista con un acercamiento lento, pared a pared (cada pantallazo se corta exacto en su esquina) */
vec2 uvCapa(float z){ if(esSuelo>.5) return .5+(v-.5)/z; for(int i=0;i<4;i++){ float a = i==0?pu0.x: i==1?pu0.y: i==2?pu0.z: pu0.w, b = i==0?pu1.x: i==1?pu1.y: i==2?pu1.z: pu1.w; if(a>=0. && v.x>=a && v.x<=b){ float c=(a+b)*.5; return vec2(c+(v.x-c)/z, .5+(v.y-.5)/z); } } return v; }
/* 0 izquierda · 1 frontal · 2 derecha · 3 trasera (−1 si el píxel no cae en ninguna) y posición 0–1 dentro de esa pared */
vec2 pared(){ for(int i=0;i<4;i++){ float a = i==0?pu0.x: i==1?pu0.y: i==2?pu0.z: pu0.w, b = i==0?pu1.x: i==1?pu1.y: i==2?pu1.z: pu1.w; if(a>=0. && v.x>=a && v.x<=b) return vec2(float(i), (v.x-a)/max(b-a,1e-4)); } return vec2(-1.,0.); }
`;
const FIN = `
/* ---------- transiciones entre pistas: doce maneras de irse a negro y volver, una al azar en cada corte ----------
   f = 1 pista entera · f = 0 negro. Las que deforman la imagen (pixelado, fallo de señal, onda) mueven v antes de pintar */
void main(){ float f=clamp(fade,0.,1.), g=1.-f; int tr=int(trans+.5); vec2 q=vv; float sx=semilla*17.3;
  if(g>0.){
    if(tr==2){ float n=mix(1., 260., pow(f,2.2)); vec2 cel=vec2(n*(esSuelo>.5?1.:4.), n); q=(floor(vv*cel)+.5)/cel; }                       /* pixelado: bloques cada vez mayores */
    else if(tr==7){ float b=floor(vv.y*26.), k=h2(vec2(b, floor(T*14.)+sx)); q.x=fract(vv.x+(k-.5)*g*g*.5*step(.35,k)); }                 /* fallo de señal: franjas desplazadas */
    else if(tr==10){ q.y=clamp(vv.y+sin(vv.x*TAU*6.+T*9.)*g*g*.12, 0., 1.); q.x=fract(vv.x+sin(vv.y*TAU*3.+T*7.)*g*g*.03); } }             /* onda de calor */
  v=q; vec3 d=rayo(); vec3 c=mundo(d); if(hayCapa>.5){ vec4 k=texture2D(capa, zoomCapa>0. ? uvCapa(1.+zoomCapa*t/12.) : v); k.rgb=pow(k.rgb, vec3(1./2.2)); c=conCapa(c, k, d); }
  c=pow(max(c,0.), vec3(2.2));
  if(g>0.){ vec2 u=vec2(vv.x*(esSuelo>.5?1.:4.), vv.y); float m=f; vec3 lz=vec3(0.);
    if(tr==1){ float n=fbm2(u*5.+sx)*.75+n2(u*23.+sx)*.25, e=g*1.25-.12; m=smoothstep(e-.02, e+.02, n); float br=smoothstep(.03,.0,abs(n-e-.012));     /* quemado: el borde arde */
      lz=mix(vec3(1.,.28,.02), vec3(1.,.9,.5), br)*br*1.3*step(.01,g); c=mix(c, c*vec3(.35,.2,.12), smoothstep(.16,.02,n-e)); }
    else if(tr==2){ m=smoothstep(0.,.3,f); }
    else if(tr==3){ c=mix(c, vec3(1.), smoothstep(0.,.7,g)); m=smoothstep(0.,.3,f); }                                                               /* destello a blanco */
    else if(tr==4){ float a=esSuelo>.5 ? fract(atan(vv.y-.5,vv.x-.5)/TAU+.5) : fract(vv.x-uF+.5), e=f*1.2-.1; m=1.-smoothstep(e-.1,e+.1,a); }                    /* cortina que da la vuelta a la sala */
    else if(tr==5){ float l=fract(u.x*6.); m=step(l, f*1.05); }                                                                                    /* persianas verticales */
    else if(tr==6){ vec2 cl=fract(u*vec2(9.,9.))-.5; m=step(length(cl), f*.75); }                                                                  /* trama de puntos */
    else if(tr==7){ m=smoothstep(0.,.35,f); c=mix(c, c.gbr, g*.5); lz=vec3(.5,.9,1.)*step(.985,h2(vec2(floor(vv.y*180.), floor(T*30.))))*g*.6; }
    else if(tr==8){ float al=f*f; m=step(abs(vv.y-.5), al*.5+.004); lz=vec3(.9,.95,1.)*smoothstep(.012,.0,abs(vv.y-.5))*g*g*2.*step(.02,f); if(esSuelo>.5) m=step(length(vv-.5), al*.75+.004); }   /* apagado de tubo: la imagen se cierra en una raya */
    else if(tr==9){ vec2 id=floor(u*vec2(14.,14.)); m=step(h2(id+sx), f*1.08-.04); }                                                               /* mosaico: las teselas se apagan una a una */
    else if(tr==10){ m=smoothstep(0.,.45,f); }
    else if(tr==11){ float col=floor(u.x*40.), cae=h2(vec2(col,sx))*.6+.4; m=step(1.-vv.y, f*1.6*cae+f*.2); if(esSuelo>.5) m=step(h2(floor(vv*24.)+sx)*.7+.3, f*1.3); lz=vec3(.0,1.,.3)*smoothstep(.04,.0,abs((1.-vv.y)-(f*1.6*cae+f*.2)))*.5*(1.-esSuelo); }   /* lluvia: la imagen cae por columnas */
    c=c*m+lz; }
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

/* ---------- 2 · AVHUB: muro de píxeles LED con los colores de la marca, haz que da la vuelta a la sala y rótulos por pared ---------- */
const G_AVHUB = `
vec3 marca(float k){ vec3 A=vec3(0.,1.,.02), B=vec3(.6,0.,1.), C=vec3(0.,.70,1.); k=fract(k)*3.; return k<1.?mix(A,C,k): k<2.?mix(C,B,k-1.): mix(B,A,k-2.); }
vec3 mundo(vec3 d){ float L=length(d.xz), an=atan(-d.x,d.z);
  if(esSuelo>.5){ vec2 p=d.xz/-d.y*.965; float r=length(p), a2=atan(-p.x,p.y);
    float an1=fract(r*7.-t*.9), anillo=smoothstep(.06,.0,abs(an1-.5)-.0)*smoothstep(1.5,.2,r);
    float radio=smoothstep(.035,.0,abs(fract(a2/TAU*24.)-.5)*r*.6)*smoothstep(.12,.3,r);
    vec2 g=p*46.; float px=smoothstep(.44,.2,length(fract(g)-.5));
    float onda=.5+.5*sin(r*16.-t*5.+sin(a2*4.)*1.2);
    vec3 c=vec3(.012,.012,.022)+marca(a2/TAU+t*.05)*(anillo*.9+radio*.5)+marca(r*.6-t*.1)*px*onda*.34;
    float haz=exp(-pow(dAng(a2, t*TAU/5.)*2.2,2.)); c+=marca(t*.1)*haz*px*.6*smoothstep(.1,.4,r);
    c+=vec3(.5,.9,1.)*exp(-r*r*26.)*.9; return c; }
  float y=d.y/L; vec2 g=vec2(an/TAU*336., y*54.); vec2 id=floor(g); float px=smoothstep(.45,.2,length(fract(g)-.5));
  float o1=n3(vec3(cos(an)*2.2, sin(an)*2.2, y*2.4-t*.55)), o2=.5+.5*sin(an*3.-t*1.7+y*2.6);
  float lum=pow(o1,2.2)*1.5*(.35+.65*o2);
  /* ecualizador: columnas que suben desde el zócalo, a compás */
  float col=floor(an/TAU*84.), alt=-.96+(.25+.45*h1(col))*(.55+.45*sin(t*TAU*1.2+h1(col+3.)*TAU))*.9;
  float eq=step(y,alt)*step(-.96,y);
  vec3 c=vec3(.012,.012,.022)+marca(an/TAU*2.+y*.25+t*.06)*px*(lum*.75+eq*.85);
  /* el haz: una franja de luz que da algo más de dos vueltas a la sala en los 12 s */
  float haz=exp(-pow(dAng(an, t*TAU/5.)*2.2,2.)); c+=mix(marca(t*.1), vec3(1.), .35)*haz*px*.95;
  c+=vec3(.0,.7,1.)*exp(-pow((y+.965)*9.,2.))*.5;
  return c; }
vec3 conCapa(vec3 c, vec4 k, vec3 d){ float an = esSuelo>.5 ? 0. : atan(-d.x,d.z);
  float sale=smoothstep(0.,.7, t*1.5-dAng(an,0.)*.55)*smoothstep(10.,9.4,t);
  return mix(c, k.rgb, k.a*sale); }`;

/* ---------- 3 · EK CHUAH y 4 · WONDERWALK: imágenes originales del juego, una escena a sangre por pared (corte exacto en la esquina) ---------- */
const G_EK = `
/* suelo de la pirámide, como el de las escenas del juego: losas rectangulares de tamaños desiguales en hiladas al tresbolillo,
   color plano con sombreado de dibujo, junta oscura gruesa, matas de musgo en las juntas y alguna muesca */
vec3 mundo(vec3 d){ if(esSuelo<.5) return vec3(.02,.015,.01);
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
  c=mix(c, c*vec3(1.35,1.12,.62), exp(-pow((p.y-1.05)*1.2,2.))*.55); c=mix(c, c*vec3(.62,1.2,1.08), exp(-pow((p.y+1.05)*1.2,2.))*.5);   /* la luz dorada del santuario y la verde del jade */
  return c; }
vec3 conCapa(vec3 c, vec4 k, vec3 d){ float an=atan(-d.x,d.z);
  float fl=.93+.07*n2(vec2(T*6.,3.));                                                        /* parpadeo de antorcha */
  float oro = esSuelo>.5 ? .5+.5*sin(t*TAU*.3) : exp(-pow(dAng(an, t*TAU/10.+.6)*2.,2.));   /* la luz dorada que da la vuelta a la sala */
  vec3 col=k.rgb*fl*(1.+.28*oro)+vec3(1.,.75,.2)*oro*.06;
  vec3 g=vec3(floor(v*vec2(esSuelo>.5?40.:160.,40.)), floor(T*2.)); float ch=step(.992,h3(g))*oro; col+=vec3(1.,.9,.5)*ch*.5;
  return mix(c, col, k.a); }`;
const G_WW = `
vec3 mundo(vec3 d){ return vec3(.03,.01,.06); }
vec3 conCapa(vec3 c, vec4 k, vec3 d){ vec3 col=k.rgb;
  vec2 gq=v*vec2(esSuelo>.5?46.:184.,46.)+vec2(0.,-T*.25); vec2 id=floor(gq); float ch=step(.988,h2(id))*smoothstep(.3,.04,length(fract(gq)-.5))*(.5+.5*sin(T*4.+h2(id+2.)*TAU));
  col+=mix(vec3(.6,1.,.5), vec3(.9,.5,1.), h2(id+5.))*ch*.9;                                 /* chispas de la varita */
  return mix(c, col, k.a); }`;

/* ---------- 5 · VOLCÁN: de la Luna a la Tierra, reentrada, nubes de Hawái, cráter con tótems tiki y lago de lava ---------- */
const G_VOLCAN = `
vec3 lava(vec2 p, float e){ vec2 w=vec2(fbm2(p*1.3+vec2(0.,T*.11)), fbm2(p*1.3+vec2(5.2,-T*.09))); float f=fbm2(p*2.2+w*2.2+T*.05);
  float costra=smoothstep(.42,.60,f), gr=cresta(vec3(p*3.+w, T*.04));
  vec3 fuego=mix(vec3(1.,.22,.0), vec3(1.,.86,.32), smoothstep(.2,.5,f)*.4+pow(1.-f,3.)*.9);
  vec3 c=mix(fuego*(1.5+.5*sin(T*2.+f*9.)), vec3(.07,.03,.025)*(.5+gr), costra); c+=vec3(1.,.35,.05)*pow(1.-costra,2.)*.4; return c*e; }
/* el arranque: la Tierra vista desde la Luna; caemos hacia el Pacífico, entramos en la atmósfera y bajamos al volcán */
float crat(vec2 p){ vec2 i=floor(p), f=fract(p); float s=0.; for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 o=vec2(h2(i+g),h2(i+g+17.3)); float r=.12+.34*h2(i+g+5.1);
  float dd=length(g+o-f)/r; s+=-.7*smoothstep(1.,.2,dd)+.55*exp(-pow((dd-1.)*5.,2.)); } return s; }
float relieveLuna(vec2 p){ return crat(p)+.5*crat(p*2.7+3.)+.25*crat(p*6.3+9.)+.35*fbm2(p*2.); }
vec3 espacio(vec3 d){ vec3 ge=d*170.; vec3 e=floor(ge); vec3 c=vec3(.004,.006,.014)+vec3(1.,.97,.92)*step(.9935,h3(e))*smoothstep(.36,.04,length(fract(ge)-.5))*(.5+h3(e+2.));
  vec3 E=normalize(vec3(0.,.2,1.)), R=normalize(cross(vec3(0.,1.,0.),E)), U=cross(E,R); float rho=.29*exp(pow(t/2.7,2.)*2.7), S=sin(min(rho,1.4))*max(1.,rho/1.4);
  vec2 q=vec2(dot(d,R),dot(d,U))/S; float r2=dot(q,q), delante=step(0., dot(d,E)+step(1.4,rho));
  if(r2<1. && delante>.5){ vec3 n=vec3(q, sqrt(1.-r2)); vec3 m=n; m.xz=giro(-2.3+T*.008)*m.xz; m.xy=giro(.25)*m.xy;
    float f=fbm(m*2.1+vec3(1.7,4.2,.3)), tierra=smoothstep(.535,.57,f);
    vec3 mar=mix(vec3(.01,.05,.22), vec3(.03,.36,.52), smoothstep(.44,.535,f)); vec3 suelo=mix(vec3(.10,.30,.10), vec3(.52,.42,.26), fbm(m*6.+2.));
    vec3 col=mix(mar, suelo, tierra); col=mix(col, vec3(.95), smoothstep(.8,.92,abs(m.y)));
    float nub=smoothstep(.48,.74, fbm(m*4.6+vec3(T*.012,0.,3.))*.7+fbm(m*11.)*.3); col=mix(col, vec3(1.), nub*.92);
    float luz=pow(clamp(dot(n, normalize(vec3(-.45,.45,.78))),0.,1.), .8)*1.25+.03; col*=luz;
    col+=vec3(.25,.55,1.)*pow(1.-n.z,3.)*1.1*luz; c=col; }
  else if(delante>.5) c+=vec3(.2,.5,1.)*exp(-(sqrt(r2)-1.)*14.)*.7;
  /* la superficie lunar bajo los pies, que se queda atrás */
  float alt=1.+t*t*1.4; if(d.y<-.03){ vec2 p=d.xz/-d.y*alt*1.7; float e2=.05; vec2 sl=normalize(vec2(-.6,.5));
    float l=(relieveLuna(p+sl*e2)-relieveLuna(p-sl*e2))/(2.*e2); vec3 luna=vec3(.46,.49,.56)*(.6+.3*fbm2(p*.7))*clamp(.8+l*.17,.22,1.5);
    float lejos=smoothstep(.03,.2,-d.y); luna=mix(vec3(.30,.33,.40), luna, smoothstep(.03,.35,-d.y)); c=mix(c, luna, lejos*smoothstep(2.7,2.1,t)); }
  return c; }
vec3 mundo(vec3 d){ float L=length(d.xz), an=atan(-d.x,d.z); vec3 u=vec3(cos(an),sin(an),0.);
  float k=t/12., baja=smoothstep(.36,.94,k), prof=14.*baja*baja+2.*k;            /* cuánto hemos descendido */
  float hl=mix(7.5,.95,smoothstep(.42,1.,k));                                      /* a qué distancia queda el lago */
  /* el cielo del atardecer de Hawái y el mar de nubes que atravesamos */
  vec3 cielo=mix(vec3(1.,.55,.24), vec3(.12,.24,.52), smoothstep(-.3,.55,d.y)); cielo=mix(cielo, vec3(1.,.8,.5), exp(-pow(dAng(an,.8)*1.3,2.))*smoothstep(.5,-.2,d.y)*.6);
  float nb=fbm(d*2.6+vec3(0.,t*1.5,0.))*.6+fbm(d*6.+vec3(0.,t*3.4,0.))*.4; vec3 nubes=mix(vec3(.62,.50,.56), vec3(1.,.93,.86), smoothstep(.3,.75,nb));
  vec3 arriba=mix(cielo, nubes, smoothstep(.3,.62,nb+.42*smoothstep(.24,.36,k)));
  if(k<.33){ vec3 esp=espacio(d); float entra=smoothstep(.2,.31,k);
    esp+=vec3(1.,.55,.2)*pow(fbm(vec3(u.xy*3., d.y*2.-t*6.)),2.)*smoothstep(.2,.26,k)*(1.-entra)*.7*smoothstep(.0,-.8,d.y);   /* el roce de la reentrada */
    vec3 bruma=mix(vec3(.42,.66,1.), vec3(1.), smoothstep(.3,.75,nb)); arriba=mix(esp, mix(bruma, arriba, smoothstep(.285,.33,k)), entra); }
  /* chimenea del cráter: basalto en columnas con vetas de magma, más encendidas cuanto más abajo */
  float y=d.y/L+prof; float glow=smoothstep(1.5,14.,prof);
  #define RELIEVE(yy) (fbm(vec3(u.xy*5.5, (yy)*5.5))*.55+cresta(vec3(u.xy*8., (yy)*1.1))*.45)
  float h0=RELIEVE(y), dh=(RELIEVE(y+.06)-h0)*9., roca=fbm(vec3(u.xy*14., y*14.));
  vec3 basalto=mix(vec3(.10,.085,.09), vec3(.30,.24,.21), h0)*(.7+.5*roca);
  float deAbajo=clamp(.5+dh,0.,1.), deArriba=clamp(.5-dh,0.,1.);
  vec3 c=basalto*(vec3(.50,.62,.85)*deArriba*(1.-.75*glow)*1.1+vec3(1.,.42,.10)*deAbajo*(.2+1.15*glow)+.12);
  c*=.55+.45*smoothstep(.25,.6,h0);                                               /* grietas en sombra */
  float veta=smoothstep(.80,.95, cresta(vec3(u.xy*3.2, y*.8+7.)))*smoothstep(.3,.6,n3(vec3(u.xy*2.,y*.5)));
  c+=mix(vec3(1.,.25,.02), vec3(1.,.85,.35), veta)*veta*(.5+1.8*glow)*(.8+.2*sin(T*3.+y));
  c+=vec3(1.,.30,.05)*(.03+.26*glow)*smoothstep(.4,-1.,d.y/L);                      /* resplandor del fondo */
  /* repisa con tótems tiki y antorchas: aparece al final del descenso */
  float yr=d.y/L+(16.-prof)*.9; float ap=smoothstep(.66,.92,k);
  float cel=an/TAU*8.; float idt=floor(cel), fx=(fract(cel)-.5)*TAU/8.; float fl=.75+.25*n2(vec2(T*8.,idt));
  if(mod(idt,2.)<.5){ /* tótem: cuerpo de madera, ojos y boca de brasa */
    float an2=.105*(1.-.16*yr), cu=step(abs(fx),an2)*step(-.62,yr)*step(yr,.36);
    float pen=step(.36,yr)*step(yr,.36+.12*(.55+.45*cos(fx*38.)))*step(abs(fx),an2+.03);          /* penacho de plumas talladas */
    float veta2=.75+.25*sin(fx*150.+n2(vec2(fx*30.,yr*8.))*4.), vol=.45+.55*sqrt(max(0.,1.-pow(fx/an2,2.)));
    vec3 mad=vec3(.34,.18,.08)*veta2*vol*(.35+1.1*fl*ap)*mix(vec3(1.,.55,.3), vec3(1.), smoothstep(-.6,.3,yr));
    float ceja=step(abs(fx),an2)*step(abs(yr-.27-.05*abs(fx)/an2),.028);
    float ojo=smoothstep(.036,.024,length(vec2(abs(fx)-.05, (yr-.17)*.7))), pup=smoothstep(.014,.008,length(vec2(abs(fx)-.05, (yr-.17)*.7)));
    float nar=step(abs(fx),.016+.02*smoothstep(.12,-.02,yr))*step(-.02,yr)*step(yr,.12);
    float boca=step(abs(fx),.078)*step(abs(yr+.15),.06); float dient=boca*step(.45,fract(fx*40.+.25))*step(.012,abs(yr+.15))*step(abs(yr+.15),.05);
    float franja=step(abs(fx),an2)*(step(abs(yr+.37),.018)+step(abs(yr+.5),.018)); float zig=step(abs(fx),an2)*step(abs(yr+.435-.03*abs(fract(fx*30.)-.5)*2.),.012);
    mad=mix(mad, mad*.35, max(ceja,max(nar,franja))); mad=mix(mad, vec3(.9,.75,.5)*(.4+.6*fl), zig*.7);
    mad=mix(mad, vec3(1.,.5,.06)*(1.2+.5*fl), max(ojo, boca)); mad=mix(mad, vec3(.15,.04,.0), pup); mad=mix(mad, vec3(.96,.88,.66)*(.6+.4*fl), dient);
    c+=vec3(1.,.45,.08)*exp(-(pow((abs(fx)-.05)*22.,2.)+pow((yr-.17)*9.,2.)))*.35*ap;
    c=mix(c, vec3(.36,.2,.09)*vol*(.5+.6*fl)*(.7+.3*cos(fx*38.)), pen*ap);
    c=mix(c, mad, cu*ap);
  } else { /* antorcha: asta de bambú y llama */
    float asta=step(abs(fx),.012)*step(-.62,yr)*step(yr,.02); c=mix(c, vec3(.36,.26,.1)*(.5+.6*fl), asta*ap);
    vec2 q=vec2(fx*7., (yr-.02)*3.2); float ll=smoothstep(.34,.0, length(vec2(q.x*(1.+q.y*1.6)+.08*sin(T*9.+q.y*7.+idt), q.y-.3))-.12*n2(vec2(q.x*4., q.y*4.-T*5.)))*step(0.,q.y);
    c+=mix(vec3(1.,.3,.02), vec3(1.,.9,.5), ll)*ll*1.6*ap; c+=vec3(1.,.5,.15)*exp(-(fx*fx*60.+(yr-.1)*(yr-.1)*9.))*.5*fl*ap; }
  c=mix(c, vec3(.03,.02,.02), step(yr,-.62)*step(-.7,yr)*ap*.8);                    /* canto de la repisa */
  /* la boca del cráter arriba y el lago de lava abajo */
  if(d.y>0.){ float rr=L*(.6+prof*1.1)/d.y; c=mix(c, arriba*mix(1.,.5,glow), smoothstep(1.,.9,rr)); }
  if(d.y<0.){ vec2 p=d.xz*(hl/-d.y); float rr=length(p); float orilla=smoothstep(1.02,.9,rr);
    vec3 lv=lava(p*1.6, 1.)+vec3(1.,.5,.1)*smoothstep(.75,1.,rr)*.5; c=mix(c, lv, orilla*smoothstep(.44,.6,k)); }
  /* pavesas que suben y calima */
  vec3 gp=vec3(u.xy*30., (d.y/L-T*.55)*30.); vec3 ce=floor(gp); float pv=step(.985,h3(ce))*smoothstep(.45,.65,k)*smoothstep(.32,.04,length(fract(gp)-.5-.25*(vec3(h3(ce+3.),h3(ce+4.),h3(ce+5.))-.5)));
  c+=vec3(1.,.6,.15)*pv*(.8+.6*sin(T*9.+h3(ce+1.)*TAU))*1.6;
  c=mix(arriba, c, smoothstep(.36,.5,k)); c+=vec3(1.,.35,.05)*.03*glow;
  return c; }` + CAPA_SIMPLE;

/* ---------- 6 · BARCELONA: fotos antiguas que se colorean sobre papel, y panots y mosaico hidráulico en el suelo ---------- */
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
    if(r<.46){ c=hidra(p*giro(.7854)*7.)*luz; }
    else if(r<.52){ float gz=step(.5,fract(a2/TAU*48.)); c=mix(vec3(.16,.28,.46), vec3(.90,.85,.72), gz)*luz; c=mix(c, vec3(.8,.58,.22), step(abs(r-.49),.006)); }
    else if(r<1.02){ vec2 g=p*8.; float s=flor(fract(g)); vec2 e=min(fract(g),1.-fract(g)); float junta=smoothstep(.0,.03,min(e.x,e.y));
      float rel=smoothstep(-.012,.012,s); c=vec3(.50,.51,.50)*(.62+.38*rel)*(.86+.14*n2(g*30.))*mix(.45,1.,junta)*luz; c+=vec3(.5)*smoothstep(.02,.0,abs(s-.014))*.12; }
    else { /* panot hexagonal de relieve marino */
      vec2 g=p*8.; vec2 s2=vec2(1.,1.7320508); vec2 ha=mod(g,s2)-s2*.5, hb=mod(g-s2*.5,s2)-s2*.5; vec2 gh=dot(ha,ha)<dot(hb,hb)?ha:hb; vec2 idh=g-gh;
      float ed=max(abs(gh.x), dot(abs(gh), vec2(.5,.8660254))); float junta=smoothstep(.5,.47,ed);
      float ang3=atan(gh.y,gh.x)+h2(idh)*TAU; float rel=.5+.5*sin(length(gh)*46.+sin(ang3*3.)*2.5);
      c=vec3(.42,.47,.45)*(.6+.4*rel)*(.86+.14*n2(g*26.))*mix(.4,1.,junta)*luz; }
    /* una franja de sol que barre el pavimento */
    c*=.82+.3*exp(-pow((p.x*.7+p.y*.7-(t/12.*3.-1.5))*2.2,2.)); return c; }
  float y=d.y/L; vec3 u=vec3(cos(an),sin(an),0.);
  vec3 c=mix(vec3(.93,.88,.76), vec3(.84,.76,.60), fbm(vec3(u.xy*6., y*6.)))*(.92+.08*n3(vec3(u.xy*120.,y*120.)));
  /* arrimadero de azulejo modernista abajo y cenefa arriba */
  if(y<-.55){ vec2 g=vec2(an/TAU*64., (y+.97)*10.2); c=hidra(g)*.9; c=mix(c, vec3(.16,.28,.46), step(-.575,y)); }
  float cen=step(.47,y)*step(y,.56); float lat=.5+.5*sin(an*40.)*sin(an*40.+y*30.); c=mix(c, mix(vec3(.26,.42,.30), vec3(.80,.58,.22), lat), cen*.85);
  return c; }
/* la foto entra en blanco y negro y se colorea como una postal iluminada a mano, con una ola que recorre la sala */
vec3 conCapa(vec3 c, vec4 k, vec3 d){ float an=atan(-d.x,d.z); float lum=dot(k.rgb, vec3(.3,.59,.11));
  float y=v.y; vec3 tinte=mix(mix(vec3(.50,.33,.20), vec3(.86,.70,.50), smoothstep(.1,.6,lum)), vec3(.60,.80,.98), smoothstep(.55,.95,lum)*smoothstep(.45,.8,y));
  tinte=mix(tinte, vec3(.36,.52,.30), smoothstep(.25,.5,lum)*smoothstep(.5,.2,y)*.35);
  vec3 col=mix(vec3(lum), tinte*(.35+lum*.95), .82); float esFoto=step(abs(k.r-k.g)+abs(k.g-k.b), .06);
  float ola=smoothstep(-.4,.4, t*.9-1.6-dAng(an,0.)*.9+ (v.y-.5)*.6);
  vec3 foto=mix(vec3(lum)*vec3(1.,.97,.9), col, ola); return mix(c, mix(k.rgb, foto, esFoto), k.a*smoothstep(0.,.8,t)); }`;

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
function capaAvhub(x, P) { const otras = P.filter((p) => p.id !== 'frontal'), rep = {}; if (otras.length) APPS.forEach((a, i) => { const p = otras[Math.min(otras.length - 1, Math.floor(i * otras.length / APPS.length))]; (rep[p.id] = rep[p.id] || []).push(a); });
  P.forEach((p) => enPared(x, p, (x, h, a) => { x.textAlign = 'center'; x.textBaseline = 'middle';
    if (p.id === 'frontal' || P.length === 1) { const lg = img('sim/pistas/logo-avhub.svg'), lh = Math.min(h * .56, a * .62 / ASP.avhub), lw = lh * ASP.avhub, y0 = h * .08; placa(x, y0 - 22, lw + 90, lh + 96, 26);
      if (lg) x.drawImage(lg, -lw / 2, y0, lw, lh); const g = x.createLinearGradient(-lw / 2, 0, lw / 2, 0); g.addColorStop(0, '#9900ff'); g.addColorStop(.55, '#00b4ff'); g.addColorStop(1, '#00ff04'); x.fillStyle = g; x.fillRect(-lw / 2, y0 + lh + 12, lw, 3);
      encaja(x, 'TOOLS FOR AV PEOPLE', lw, 34, 500, '"Share Tech Mono", monospace'); x.fillStyle = '#e9ecf2'; x.fillText('TOOLS FOR AV PEOPLE', 0, y0 + lh + 42); return; }
    const L = rep[p.id] || [], n = L.length; if (!n) return; const hueco = Math.min(a * .94, 1900) / n, ww = Math.min(hueco * .82, h * .58 * 16 / 9);
    L.forEach(([app, col], i) => tarjeta(x, (i - (n - 1) / 2) * hueco, h * .5 - (ww * 9 / 16 + 96) / 2 + 8, ww, app, col)); })); }
function capaAvhubSuelo(x) { const c = WS / 2, iso = img('sim/pistas/isotipo-avhub.svg'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.beginPath(); x.arc(c, c, 190, 0, 7); x.fillStyle = 'rgba(4,4,10,.92)'; x.fill();
  const g = x.createLinearGradient(c - 190, 0, c + 190, 0); g.addColorStop(0, '#9900ff'); g.addColorStop(.55, '#00b4ff'); g.addColorStop(1, '#00ff04'); x.lineWidth = 6; x.strokeStyle = g; x.stroke();
  if (iso) { const ih = 170, iw = ih * ASP.iso; x.drawImage(iso, c - iw / 2, c - ih / 2 - 22, iw, ih); } x.fillStyle = '#e9ecf2'; x.font = '500 22px "Share Tech Mono", monospace'; x.fillText('avhub.mediaservi.com', c, c + 104);
  APPS.forEach(([app, col], i) => { const an = -Math.PI / 2 + i * Math.PI * 2 / APPS.length, px = c + Math.cos(an) * 345, py = c + Math.sin(an) * 345, ic = img('sim/pistas/icono-' + app + '.svg');
    x.beginPath(); x.arc(px, py, 62, 0, 7); x.fillStyle = 'rgba(4,4,10,.92)'; x.fill(); x.lineWidth = 3; x.strokeStyle = col; x.stroke(); if (ic) x.drawImage(ic, px - 38, py - 38, 76, 76); }); }

/* una escena original por pared, a sangre; si falta una pared, su escena no sale (el resto no se mueve) */
function sangre(x, P, mapa) { P.forEach((p) => enPared(x, p, (x, h, a) => { const im = img('sim/pistas/' + (mapa[p.id] || mapa.frontal) + '.webp'); if (im) cubre(x, im, -a / 2, 0, a, h); else { x.fillStyle = '#0b0b10'; x.fillRect(-a / 2, 0, a, h); } })); }
function sueloImg(x, n) { const im = img('sim/pistas/' + n + '.webp'); if (im) cubre(x, im, 0, 0, WS, WS); }
function rotuloImg(x, P, n, alto, pie) { const p = P.find((q) => q.id === 'frontal') || P[0]; if (!p) return; enPared(x, p, (x, h, a) => { const ti = img('sim/pistas/' + n + '.webp'); if (!ti) return; let th = h * alto, tw = th * ti.width / ti.height; if (tw > a * .8) { tw = a * .8; th = tw * ti.height / ti.width; } x.drawImage(ti, -tw / 2, h * pie - th, tw, th); }); }
const EK_IMG = { frontal: 'ek-santuario', izquierda: 'ek-alux', derecha: 'ek-cacao', trasera: 'ek-jade' };
function capaEk(x, P) { sangre(x, P, EK_IMG); rotuloImg(x, P, 'ek-titulo', .34, .99); }
const WW_IMG = { frontal: 'ww-castillo', izquierda: 'ww-camino', derecha: 'ww-puente', trasera: 'ww-bosque' };
function capaWw(x, P) { sangre(x, P, WW_IMG); rotuloImg(x, P, 'ww-titulo', .3, .34); }

/* Barcelona: fotografías antiguas en dominio público (assets/sim/pistas/bcn-01 … 08 y CREDITOS.md).
   Dos en cada pared, con paspartú y sombra, como postales sobre el papel pintado */
const BCN = { izquierda: [5, 4], frontal: [1, 2], derecha: [6, 3], trasera: [7, 8] };
function capaBcn(x, P) { const az = azarDe(71); P.forEach((p) => enPared(x, p, (x, h, a) => { const L = P.length === 1 ? [1, 2] : (BCN[p.id] || [1]), n = L.length, an = Math.min(a * .9, 1500), cw = an / n;
  L.forEach((k, i) => { const im = img('sim/pistas/bcn-0' + k + '.webp'), g = (az() - .5) * .07, dy = (az() - .5) * .05; if (!im) return; const asp = im.width / im.height; let hh = h * (asp < 1 ? .58 : .5), ww = hh * asp; if (ww > cw * .86) { ww = cw * .86; hh = ww / asp; }
    x.save(); x.translate(-an / 2 + cw * (i + .5), h * (.37 + dy)); x.rotate(g); x.shadowColor = 'rgba(40,25,10,.5)'; x.shadowBlur = 22; x.shadowOffsetY = 9; x.fillStyle = '#f7f1e0'; x.fillRect(-ww / 2 - 14, -hh / 2 - 14, ww + 28, hh + 46); x.shadowColor = 'transparent';
    x.drawImage(im, -ww / 2, -hh / 2, ww, hh); x.restore(); }); })); }

/* ---------- las pistas ---------- */
const PISTAS = [
  { id: 'sagrada', glsl: G_SAGRADA, dron: true },
  { id: 'avhub', glsl: G_AVHUB, capa: capaAvhub, capaSuelo: capaAvhubSuelo },
  { id: 'ekchuah', glsl: G_EK, capa: capaEk, zoom: .07 },
  { id: 'wonderwalk', glsl: G_WW, capa: capaWw, capaSuelo: (x) => sueloImg(x, 'ww-suelo'), zoom: .07 },
  { id: 'volcan', glsl: G_VOLCAN },
  { id: 'barcelona', glsl: G_BCN, capa: capaBcn },
];
export const PISTAS_ID = PISTAS.map((p) => p.id);

export function crearPistas(renderer) {
  const dron = crearDron(renderer);
  const rt = new THREE.WebGLRenderTarget(W, H, { generateMipmaps: false }), rtS = new THREE.WebGLRenderTarget(WS, WS, { generateMipmaps: false });
  const geo = new THREE.PlaneGeometry(2, 2), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), esc = new THREE.Scene(), quad = new THREE.Mesh(geo); quad.frustumCulled = false; esc.add(quad);
  const negro = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); negro.needsUpdate = true;
  let paredes = [{ id: 'izquierda', u0: 0, u1: .25, w: 5, h: 3 }, { id: 'frontal', u0: .25, u1: .5, w: 5, h: 3 }, { id: 'derecha', u0: .5, u1: .75, w: 5, h: 3 }, { id: 'trasera', u0: .75, u1: 1, w: 5, h: 3 }], firma = '', uF = .5;
  const ORD = ['izquierda', 'frontal', 'derecha', 'trasera'];
  PISTAS.forEach((p) => {
    p.mat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false,
      uniforms: { t: { value: 0 }, T: { value: 0 }, esSuelo: { value: 0 }, uF: { value: .5 }, fade: { value: 1 }, trans: { value: 0 }, semilla: { value: 0 }, hayCapa: { value: 0 }, zoomCapa: { value: p.zoom || 0 }, capa: { value: negro }, base: { value: dron.rt.texture }, pu0: { value: new THREE.Vector4(-1, -1, -1, -1) }, pu1: { value: new THREE.Vector4(-1, -1, -1, -1) } },
      vertexShader: 'varying vec2 vv; void main(){ vv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: COMUN + p.glsl + FIN });
    if (p.capa) { p.cv = document.createElement('canvas'); p.cv.width = W; p.cv.height = H; p.tx = new THREE.CanvasTexture(p.cv); p.tx.colorSpace = THREE.SRGBColorSpace; p.tx.generateMipmaps = false; p.tx.minFilter = THREE.LinearFilter; }
    if (p.capaSuelo) { p.cvS = document.createElement('canvas'); p.cvS.width = p.cvS.height = WS; p.txS = new THREE.CanvasTexture(p.cvS); p.txS.colorSpace = THREE.SRGBColorSpace; }
    p.hecha = '';
  });
  function capas(p) { const f = firma + '|' + imgV + '|' + (document.fonts ? document.fonts.status : ''); if (p.hecha === f) return; p.hecha = f;
    if (p.capa) { const x = p.cv.getContext('2d'); x.clearRect(0, 0, W, H); try { p.capa(x, paredes); } catch (e) {} p.tx.needsUpdate = true; }
    if (p.capaSuelo) { const x = p.cvS.getContext('2d'); x.clearRect(0, 0, WS, WS); try { p.capaSuelo(x); } catch (e) {} p.txS.needsUpdate = true; } }
  /* orden al azar sin repetir pista seguida: se barajan las seis y se vuelve a barajar al acabar la tanda */
  const az = azarDe(Math.floor(Math.random() * 2147483000) + 1), az2 = azarDe(Math.floor(Math.random() * 2147483000) + 1), cola = []; let fija = null;
  function pistaN(n) { while (cola.length <= n) { const b = PISTAS.map((_, i) => i); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(az() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } if (cola.length && b[0] === cola[cola.length - 1]) b.push(b.shift()); cola.push(...b); } return cola[n]; }
  /* una transición al azar por corte (el corte n separa la pista n de la n+1), sin repetir la anterior */
  const cortes = []; function corteN(n) { if (n < 0) return { e: 0, s: 0 }; while (cortes.length <= n) { let e; do { e = Math.floor(az2() * NTRANS); } while (cortes.length && e === cortes[cortes.length - 1].e); cortes.push({ e, s: az2() }); } return cortes[n]; }
  function pinta(T) {
    const n = Math.floor(T / DUR), tl = fija ? fija.t != null ? fija.t : T % DUR : T - n * DUR, p = fija ? PISTAS[fija.i] : PISTAS[pistaN(n)];
    const fade = fija ? (fija.f != null ? fija.f : 1) : Math.min(1, tl / FUND, (DUR - tl) / FUND), ct = fija ? { e: fija.e || 0, s: .37 } : corteN(tl < DUR / 2 ? n - 1 : n);
    if (p.dron) { dron.frente(uF); dron.pinta(T); }
    capas(p); const U = p.mat.uniforms; U.t.value = tl; U.T.value = T; U.uF.value = uF; U.fade.value = Math.max(0, fade); U.trans.value = ct.e; U.semilla.value = ct.s;
    const a = [-1, -1, -1, -1], b = [-1, -1, -1, -1]; paredes.forEach((q) => { const i = ORD.indexOf(q.id); if (i >= 0) { a[i] = q.u0; b[i] = q.u1; } }); U.pu0.value.fromArray(a); U.pu1.value.fromArray(b);
    quad.material = p.mat; const prev = renderer.getRenderTarget();
    U.esSuelo.value = 0; U.hayCapa.value = p.capa ? 1 : 0; U.capa.value = p.capa ? p.tx : negro; renderer.setRenderTarget(rt); renderer.render(esc, cam);
    U.esSuelo.value = 1; U.hayCapa.value = p.capaSuelo ? 1 : 0; U.capa.value = p.capaSuelo ? p.txS : negro; renderer.setRenderTarget(rtS); renderer.render(esc, cam);
    renderer.setRenderTarget(prev);
  }
  return { rt, rtSuelo: rtS, pinta, dur: DUR, frente: (u) => { uF = u; },
    paredes: (L) => { if (!L || !L.length) return; const f = JSON.stringify(L); if (f !== firma) { firma = f; paredes = L; } },
    fijar: (id, t, e, f) => { const i = PISTAS_ID.indexOf(id); fija = i < 0 ? null : { i, t, e, f }; } };   /* para pruebas y capturas: una pista (y un instante) fijos */
}
