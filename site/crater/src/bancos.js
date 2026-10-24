/* JET//Cráter · bancos de contenido curado (números, colores, palabras, módulos, contextos).
   Archivo compartido por el navegador y por tests/validar.mjs (se ejecuta en un contexto vm).
   Nada de marcas, política, religión, personas reales ni regionalismos. */
(function(G){
'use strict';

/* ---------- NÚMEROS (≥120 plantillas) ----------
   r:[a,b,paso] = rango; s:[...] = conjunto curado. ord:'asc' fija el orden natural (los rangos se leen en orden). */
const NUM=[];
const R=(a,b,p)=>{const o=[];for(let v=a;v<=b;v+=(p||1))o.push(v);return o;};
[[1,6],[1,7],[1,8],[1,9],[1,10],[1,11],[1,12],[0,9],[0,10],[2,12],[3,12],[4,12],[5,12],[6,12],[10,20],[11,20],[12,20],[13,22],
 [20,30],[21,30],[30,40],[31,40],[40,50],[41,50],[45,55],[50,60],[60,70],[70,80],[80,90],[90,100],[91,100],[95,105],[99,108],[7,16],[14,24],[16,26]]
 .forEach(([a,b])=>NUM.push({id:'r'+a+'-'+b,v:R(a,b),ord:'asc'}));
[[2,20,2],[5,50,5],[10,100,10],[3,30,3],[4,40,4],[6,60,6],[7,70,7],[25,200,25],[100,1000,100],[50,500,50],[11,99,11],[9,90,9],[12,120,12],[15,150,15],[20,200,20],[1000,10000,1000],[250,2000,250]]
 .forEach(([a,b,p])=>NUM.push({id:'p'+a+'-'+b+'-'+p,v:R(a,b,p),ord:'asc'}));
[[1,2,4,8,16,32,64,128],[1,4,9,16,25,36,49,64,81,100],[1,3,9,27,81,243],[1,10,100,1000,10000,100000],[2,3,5,7,11,13,17,19],[1,1,2,3,5,8,13,21].slice(1),[1,8,27,64,125,216]]
 .forEach((v,i)=>NUM.push({id:'q'+i,v,ord:'asc'}));
[
[3,7,12,25,50,99,100],[1,13,21,42,64,77,88],[2,5,7,11,17,23],[4,8,15,16,23,42],[6,9,14,19,27,33,40],[10,12,17,30,45,60],
[1,2,3,50,98,99,100],[5,10,13,20,24,31],[7,14,21,28,35,77],[8,18,28,38,48,80],[12,19,23,37,40,56,61],[100,111,123,150,199,200],
[0,1,7,10,69,100],[3,33,333,3333,33333,333333],[9,19,29,39,49,99],[15,16,17,18,19,20,21],[1,5,10,20,50,100,200,500],[2,22,24,42,44,222],
[6,13,26,39,52,65],[31,32,33,34,35,36],[11,22,33,44,55,66,77,88,99],[365,366,360,300,400,500],[1,9,10,90,99,100],[7,8,9,70,80,90],
[4,13,22,31,40,49],[12,24,36,48,60,72],[16,32,48,64,80,96],[24,25,26,27,28,29,30,31],[5,15,25,35,45,55,65],[18,27,36,45,54,63],
[1,6,12,18,24,30,36],[17,34,51,68,85,102],[3,4,5,6,7,8,9],[60,61,62,63,64,65,66,67],[1,11,21,31,41,51,61],[2,7,19,30,47,61,88,100],
[10,25,40,55,70,85,100],[37,73,137,173,317,371],[0,5,10,15,20,25],[21,42,63,84,105,126],[8,16,24,32,40,48,56,64],[13,14,15,16,17,18],
[1,3,5,7,9,11,13],[2,4,6,8,10,12,14,16],[19,20,21,22,23,24],[33,34,35,36,37,38,39],[101,102,103,104,105,106],[1,7,77,777,7777,77777],
[6,7,8,9,10,11],[90,95,96,97,98,99],[12,13,14,15,16,17,18,19],[47,48,49,50,51,52,53],[3,6,7,11,15,21,28],[5,8,12,17,23,30,38],
[64,81,100,121,144,169],[25,26,27,28,29,30],[40,44,48,52,56,60],[200,250,300,350,400,450,500],[2,3,4,40,50,60],[9,18,27,36,45,54],
[1,2,3,4,5,6,7,8,9,10,11,12],[70,71,72,73,74,75,76,77],[11,12,13,14,15,16,17,18,19,20],[1,4,7,10,13,16,19,22],[30,35,40,45,50,55,60],
[22,23,24,25,26,27],[4,5,6,7,8,9],[80,81,82,83,84,85,86],[14,28,42,56,70,84],[3,8,13,18,23,28,33],[2,6,10,14,18,22,26,30],
[51,52,53,54,55,56,57,58,59],[123,234,345,456,567,678,789],[10,11,12,13,14,15],[44,45,46,47,48,49,50],[1,2,5,10,25,50,100],
[7,17,27,37,47,57,67],[18,19,20,21,22,23,24,25],
[2,7,10,15,31,64,100],[4,7,9,12,18,25,33],[1,3,7,12,20,50],[6,7,13,24,48,96],[3,8,10,14,22,57,100],[5,7,11,19,26,40,77],
[1,2,7,13,30,99],[9,10,11,42,50,51],[7,16,23,34,55,68,90],[12,21,37,48,73,100],[2,9,14,27,38,61,7],[1,4,6,7,15,28,33,100],
[10,13,17,21,42,69],[3,5,7,9,11,99],[8,7,6,5,100,4],[20,40,60,80,7,100],[15,25,35,45,7,55],[1,12,123,1234,7,10],
[33,44,7,55,66,77],[13,26,7,52,104,208],[1,7,10,15,20,25,30],[2,3,7,11,22,33,44],[16,17,18,19,1,100],[5,10,50,100,500,1000],
[12,7,19,24,3,30],[48,49,7,50,51,52],[0,7,14,21,28,35],[101,7,1,10,100,1000],[64,32,16,8,4,2,1],[14,7,21,3,42,1],
[11,7,13,17,19,23],[25,7,49,36,1,100],[3,13,23,33,43,53,63],[100,99,98,97,7,1],[6,60,7,70,8,80],[2,4,7,8,16,32],
[5,9,7,12,1,15,10],[1,22,333,4444,7,55555],[18,81,7,17,71,1],[40,4,400,7,70,700],[9,99,999,7,77,777],[3,6,9,7,12,15],
[365,24,7,60,12,100],[1,2,3,10,20,30,100],[50,25,75,100,0,7],[19,91,7,13,31,1],[8,16,7,32,64,128],[21,7,12,1,3,13],
[42,24,7,4,2,44],[15,51,7,5,1,55],[37,7,3,73,33,77],[11,12,13,1,2,3,7],[90,9,7,19,99,10],[2,20,200,7,1,10]
].forEach((v,i)=>NUM.push({id:'s'+i,v}));

/* Qué tan «típico» es un número para la gente (peso curado 0..1). */
function tipNum(n){
 const T={7:1,1:.62,3:.55,10:.6,100:.72,13:.42,42:.48,50:.5,12:.38,5:.4,2:.32,9:.3,8:.3,21:.3,99:.42,0:.35,1000:.5,777:.55,77:.42,88:.36,69:.25,365:.45,33:.3,23:.3,17:.3,4:.28,6:.26,11:.32,20:.38,25:.4,64:.3,144:.3,128:.28,1024:.3,10000:.45,200:.36,500:.4,111:.34,123:.4,333:.32,3333:.25};
 if(T[n]!=null)return T[n];
 if(n%1000===0)return .4;if(n%100===0)return .34;if(n%10===0)return .26;
 const s=String(n);if(s.length>1&&/^(\d)\1+$/.test(s))return .32;
 return .12;
}

/* ---------- COLORES (≥80 paletas) ----------
   Hechas a mano y ampliadas con familias de parámetros fijos. Se descartan al cargar las que no cumplan ΔE≥20. */
const COL_HAND=[
['#e8243c','#3a6fd8','#2fb35a','#f2c62c','#8e44d6','#f08a24'],
['#f4b8c2','#b9d7f2','#c4ecc8','#f6e7a8','#d9c5f2','#d42828'],
['#1d1d1f','#f7f7f2','#e02b2b','#2b5fe0','#ffd23f','#2bb673'],
['#00f2cf','#7700f4','#ff4466','#ffb000','#2d7dff','#7ad151'],
['#8a8a8a','#6e6e6e','#b4b4b4','#d23030','#4d4d4d','#9f9f9f'],
['#2f5d8a','#3c79b5','#5a9bd8','#86bcef','#e8732a','#1d3e5f'],
['#7a4b2a','#a8743f','#c99a5b','#5b3a1f','#2f8f6a','#e2c08a'],
['#ff6f61','#6b5b95','#88b04b','#f7cac9','#92a8d1','#955251'],
['#0b7a75','#19a596','#48c9b0','#a3e4d7','#e74c3c','#0e4d4a'],
['#f9e04b','#f5b82e','#ef8a17','#d7263d','#1b998b','#2e294e'],
['#ffffff','#e6e6e6','#cccccc','#000000','#999999','#2b6cff'],
['#c0392b','#e67e22','#f1c40f','#27ae60','#2980b9','#8e44ad','#2c3e50'],
['#fde2e4','#fad2e1','#e2ece9','#bee1e6','#dfe7fd','#cddafd','#ff1f5a'],
['#264653','#2a9d8f','#e9c46a','#f4a261','#e76f51','#ffffff'],
['#3d348b','#7678ed','#f7b801','#f18701','#f35b04','#0b0a1f'],
['#003049','#d62828','#f77f00','#fcbf49','#eae2b7','#2a9134'],
['#606c38','#283618','#fefae0','#dda15e','#bc6c25','#3a86ff'],
['#ff0000','#ff7f00','#ffff00','#00c000','#0000ff','#8b00ff'],
['#5f0f40','#9a031e','#fb8b24','#e36414','#0f4c5c','#7bdff2'],
['#0081a7','#00afb9','#fdfcdc','#fed9b7','#f07167','#2b2d42'],
['#e63946','#f1faee','#a8dadc','#457b9d','#1d3557','#ffb703'],
['#22223b','#4a4e69','#9a8c98','#c9ada7','#f2e9e4','#00d084'],
['#ef476f','#ffd166','#06d6a0','#118ab2','#073b4c','#ffffff'],
['#8ecae6','#219ebc','#023047','#ffb703','#fb8500','#d00000'],
['#d8f3dc','#95d5b2','#52b788','#2d6a4f','#081c15','#ff006e'],
['#ffbe0b','#fb5607','#ff006e','#8338ec','#3a86ff','#111111'],
['#b5838d','#e5989b','#ffb4a2','#ffcdb2','#6d6875','#00a6fb'],
['#2b2d42','#8d99ae','#edf2f4','#ef233c','#d90429','#06d6a0'].slice(0,5).concat(['#ffd60a']),
['#f72585','#7209b7','#3a0ca3','#4361ee','#4cc9f0','#f4f1de'],
['#10002b','#3c096c','#7b2cbf','#c77dff','#e0aaff','#ffea00'],
['#ccd5ae','#e9edc9','#fefae0','#faedcd','#d4a373','#d62828'],
['#9b2226','#ae2012','#bb3e03','#ca6702','#ee9b00','#94d2bd','#005f73'],
['#000000','#ffffff','#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff'],
['#355070','#6d597a','#b56576','#e56b6f','#eaac8b','#ffffff'],
['#0d1b2a','#1b263b','#415a77','#778da9','#e0e1dd','#ff9f1c'],
['#f6bd60','#f7ede2','#f5cac3','#84a59d','#f28482','#3d405b'],
['#a7c957','#6a994e','#386641','#f2e8cf','#bc4749','#1a1a1a'],
['#ffadad','#ffd6a5','#fdffb6','#caffbf','#9bf6ff','#a0c4ff','#bdb2ff','#3c1642'],
['#e0e0e0','#bdbdbd','#757575','#424242','#212121','#ffeb3b'],
['#4a1c40','#7b2d26','#b65d2b','#e3a587','#f5e6d3','#2e86ab']
];
const hsl=(h,s,l)=>{s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
 const t=x=>Math.round(x*255).toString(16).padStart(2,'0');return '#'+t(f(0))+t(f(8))+t(f(4));};
const COL_FAM=[];
// Familia A: pasteles + un único saturado (pista «único»).
[[0,210],[30,280],[200,10],[120,330],[260,50],[180,0],[300,140],[60,220],[90,350],[330,190]].forEach(([b,odd],i)=>{
 const o=[];for(let j=0;j<5;j++)o.push(hsl((b+j*62)%360,58,83-(j%2)*7));o.splice((i*3)%6,0,hsl(odd,92,46));COL_FAM.push(o);});
// Familia B: grises + uno de color.
[[0,0],[200,1],[40,2],[280,3],[120,4],[20,5],[340,0],[170,2]].forEach(([h,pos])=>{
 const o=[];[12,30,48,66,84].forEach(l=>o.push(hsl(h,4,l)));o.splice(pos,0,hsl(h,88,50));COL_FAM.push(o);});
// Familia C: degradado análogo de 6-7 pasos + complementario.
[[200,6],[20,6],[140,7],[260,6],[330,7],[50,6],[100,6],[0,7],[230,6],[170,7],[300,6],[80,7]].forEach(([h,n],i)=>{
 const o=[];for(let j=0;j<n-1;j++)o.push(hsl((h+j*14)%360,62,24+j*(56/(n-2))));o.splice(i%n,0,hsl((h+180)%360,85,55));COL_FAM.push(o);});
// Familia D: arcoíris con un tono repetido en dos luces (competencia entre «típico» y «único»).
[[0,25],[45,70],[90,40],[180,60],[230,35],[300,65],[15,50],[200,45],[270,55],[120,30],[330,40],[60,62]].forEach(([s,l])=>{
 const o=[];for(let j=0;j<6;j++)o.push(hsl((s+j*60)%360,78,l+(j%2?8:0)));o.push(hsl(s,30,90));COL_FAM.push(o);});
// Familia E: tierras + rojo, azul o verde.
['#e53935','#1e88e5','#43a047','#fdd835','#8e24aa','#00acc1'].forEach((acc,i)=>{
 const o=['#6d4c41','#a1887f','#d7ccc8','#4e342e','#bcaaa4'];o.splice((i*2)%6,0,acc);COL_FAM.push(o);});

// Familia F: rampa monocroma de un tono (lo único son los extremos y el más vivo).
[0,25,50,95,140,175,200,225,250,280,310,340].forEach((h,i)=>{const o=[];[16,30,44,58,72,88].forEach((l,j)=>o.push(hsl(h,j===2+(i%3)?85:55,l)));COL_FAM.push(o);});
// Familia G: complementarios alternados.
[10,40,70,100,130,160,190,220,250,280,310,340].forEach((h,i)=>{const o=[];for(let j=0;j<6;j++)o.push(hsl(j%2?(h+180)%360:h,70,[28,45,62,78,40,70][j]));COL_FAM.push(o);});
// Familia H: neones de la misma luz (compiten «típico» y «posición»).
[0,15,30,8,22,38,5,45].forEach((s0,i)=>{const o=[];for(let j=0;j<7;j++)o.push(hsl((s0+j*51)%360,90,52+(j%3)*6));if(i%2)o.push('#f5f0ff');COL_FAM.push(o);});
// Familia I: a mano, señales y uniformes.
[['#d50000','#ffffff','#000000','#ffd600','#2962ff','#00c853'],['#ff6d00','#263238','#eceff1','#00b0ff','#76ff03','#aa00ff'],
 ['#1b5e20','#f9a825','#b71c1c','#0d47a1','#fafafa','#4a148c'],['#ff4081','#536dfe','#64ffda','#ffd740','#212121','#ffffff'],
 ['#795548','#ff5722','#cddc39','#3f51b5','#009688','#e0e0e0'],['#00f2cf','#7700f4','#050108','#f5f0ff','#ff4466','#ffb000'],
 ['#c62828','#ad1457','#6a1b9a','#283593','#00838f','#2e7d32','#f9a825'],['#fff59d','#ffcc80','#ef9a9a','#ce93d8','#90caf9','#a5d6a7','#263238'],
 ['#3e2723','#bf360c','#ff8f00','#fdd835','#558b2f','#01579b'],
 ['#e91e63','#9c27b0','#3f51b5','#03a9f4','#009688','#8bc34a','#ffeb3b'],['#f8bbd0','#e1bee7','#c5cae9','#b2ebf2','#c8e6c9','#ff3d00'],
 ['#212121','#37474f','#78909c','#cfd8dc','#ffab00','#ffffff'],['#ffe082','#ffab91','#80cbc4','#9fa8da','#f48fb1','#1a237e'],['#000000','#424242','#9e9e9e','#ffffff','#ff1744','#2979ff']].forEach(p=>COL_FAM.push(p));

// Familia J: 80 paletas de parámetros fijos (tono base, separación, saturaciones), generadas siempre igual.
(function(){let a=0x2f6e2b1;const rnd=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 for(let n=0;n<80;n++){const k=6+Math.floor(rnd()*3),h0=Math.floor(rnd()*360),paso=30+Math.floor(rnd()*60),o=[];
  for(let j=0;j<k;j++){const s=j===0?90:20+Math.floor(rnd()*70),l=25+Math.floor(rnd()*55);o.push(hsl((h0+j*paso)%360,s,l));}
  COL_FAM.push(o);}})();

/* ---------- PALABRAS (≥150 listas) ----------
   Cada lista: 'es/en' separadas por espacios; '_' = espacio dentro de la palabra.
   Marcas: * = prototípica (lo típico), ! = la que no encaja (lo único), ^ = la mayor/más importante.
   El voto es el id del concepto (posición en la lista), nunca la palabra: ES y EN comparten orden. */
const PAL=`
*sol/sun luna/moon estrella/star cometa/comet nube/cloud
gato/cat *perro/dog pez/fish caballo/horse pájaro/bird
cara/heads cruz/tails
*norte/north sur/south este/east oeste/west
lunes/Monday martes/Tuesday viernes/Friday *domingo/Sunday sábado/Saturday
*rojo/red azul/blue verde/green amarillo/yellow negro/black blanco/white
manzana/apple pera/pear plátano/banana !zanahoria/carrot uva/grape naranja/orange
*mar/sea montaña/mountain bosque/forest desierto/desert ciudad/city campo/countryside
invierno/winter primavera/spring *verano/summer otoño/autumn
piedra/rock papel/paper tijera/scissors
*corazón/heart estrella/star círculo/circle cuadrado/square triángulo/triangle rombo/diamond
uno/one dos/two *tres/three cuatro/four cinco/five
*café/coffee té/tea agua/water leche/milk refresco/soda chocolate/hot_chocolate
mesa/table *silla/chair cama/bed sofá/sofa lámpara/lamp armario/wardrobe
piano/piano *guitarra/guitar violín/violin tambor/drum flauta/flute trompeta/trumpet
fútbol/soccer tenis/tennis natación/swimming baloncesto/basketball ciclismo/cycling ajedrez/chess
*rosa/rose girasol/sunflower tulipán/tulip margarita/daisy lirio/lily orquídea/orchid
lápiz/pencil *bolígrafo/pen pincel/brush tiza/chalk marcador/marker
^ballena/whale delfín/dolphin tiburón/shark pulpo/octopus tortuga/turtle medusa/jellyfish
*león/lion tigre/tiger oso/bear lobo/wolf zorro/fox águila/eagle
pan/bread arroz/rice pasta/pasta huevo/egg maíz/corn
*rey/king reina/queen torre/rook alfil/bishop caballo/knight peón/pawn
*avión/plane tren/train barco/ship moto/motorbike bicicleta/bicycle cohete/rocket
*azul/blue celeste/sky_blue marino/navy turquesa/turquoise índigo/indigo
cuchara/spoon *tenedor/fork cuchillo/knife plato/plate vaso/glass taza/cup
*libro/book revista/magazine periódico/newspaper carta/letter mapa/map diario/diary
reloj/clock brújula/compass *llave/key linterna/flashlight cuerda/rope
mañana/morning mediodía/noon tarde/afternoon *noche/night madrugada/dawn
*fuego/fire agua/water tierra/earth aire/air
hielo/ice nieve/snow *lluvia/rain niebla/fog granizo/hail viento/wind
Mercurio/Mercury Venus/Venus *Tierra/Earth Marte/Mars ^Júpiter/Jupiter Saturno/Saturn
*sí/yes no/no quizás/maybe
izquierda/left *derecha/right
arriba/up *abajo/down
grande/big mediano/medium *pequeño/small
frío/cold *caliente/hot templado/warm
*hola/hello adiós/goodbye gracias/thanks perdón/sorry
camisa/shirt pantalón/trousers zapato/shoe *sombrero/hat bufanda/scarf guante/glove
oro/gold plata/silver bronce/bronze hierro/iron cobre/copper
diamante/diamond *rubí/ruby esmeralda/emerald zafiro/sapphire perla/pearl
abeja/bee hormiga/ant *mariposa/butterfly mosca/fly araña/spider grillo/cricket
*playa/beach isla/island río/river lago/lake cascada/waterfall cueva/cave
puerta/door *ventana/window techo/roof pared/wall escalera/stairs
*fresa/strawberry cereza/cherry sandía/watermelon limón/lemon piña/pineapple mango/mango
nariz/nose boca/mouth *ojo/eye oreja/ear mano/hand pie/foot
martillo/hammer clavo/nail destornillador/screwdriver sierra/saw *llave_inglesa/wrench
*luna/moon Marte/Mars Venus/Venus Saturno/Saturn Plutón/Pluto
*cohete/rocket satélite/satellite estación/station sonda/probe telescopio/telescope
casco/helmet traje/suit botas/boots *guantes/gloves mochila/backpack radio/radio
*pizza/pizza sopa/soup ensalada/salad sándwich/sandwich guiso/stew
hoja/leaf *árbol/tree raíz/root rama/branch flor/flower semilla/seed
*rojo/red naranja/orange amarillo/yellow
blanco/white *negro/black
círculo/circle *cuadrado/square triángulo/triangle
A/A *B/B C/C D/D E/E
alfa/alpha beta/beta gamma/gamma delta/delta
*primero/first segundo/second tercero/third último/last
*gato/cat ratón/mouse queso/cheese
*vaca/cow cerdo/pig oveja/sheep gallina/hen cabra/goat pato/duck
trueno/thunder *rayo/lightning arcoíris/rainbow tormenta/storm
*piano/piano batería/drums bajo/bass voz/voice
*azúcar/sugar sal/salt pimienta/pepper miel/honey
dólar/dollar *moneda/coin billete/banknote tarjeta/card
*rojo/red verde/green
*norte/north sur/south
hoy/today *mañana/tomorrow ayer/yesterday
*abril/April mayo/May junio/June julio/July agosto/August
enero/January febrero/February marzo/March *diciembre/December noviembre/November
*paraguas/umbrella abrigo/coat reloj/watch sombrero/hat bolso/bag
*mesa/table mantel/tablecloth servilleta/napkin vela/candle
*elefante/elephant jirafa/giraffe cebra/zebra hipopótamo/hippo rinoceronte/rhino
*búho/owl murciélago/bat lechuza/barn_owl luciérnaga/firefly
camello/camel *cactus/cactus duna/dune oasis/oasis escorpión/scorpion
*pingüino/penguin foca/seal oso_polar/polar_bear morsa/walrus
canguro/kangaroo koala/koala *panda/panda perezoso/sloth
*chocolate/chocolate vainilla/vanilla fresa/strawberry limón/lemon menta/mint
*pirata/pirate caballero/knight mago/wizard dragón/dragon princesa/princess
*sol/sun nube/cloud lluvia/rain nieve/snow
*uno/one diez/ten cien/hundred mil/thousand
*cero/zero infinito/infinity
*pelota/ball cometa/kite yoyó/yo-yo dado/dice muñeca/doll
hospital/hospital escuela/school *parque/park museo/museum biblioteca/library mercado/market
*martes/Tuesday miércoles/Wednesday jueves/Thursday
*café/coffee pan/bread huevo/egg fruta/fruit cereal/cereal
lunes/Monday *viernes/Friday
!trompeta/trumpet violín/violin chelo/cello viola/viola arpa/harp
*mosquito/mosquito abeja/bee avispa/wasp !mariposa/butterfly
*cuchara/spoon tenedor/fork !piedra/stone cuchillo/knife
*rojo/red azul/blue !gato/cat verde/green amarillo/yellow
Marte/Mars Venus/Venus *Tierra/Earth !Sol/Sun Júpiter/Jupiter
*perro/dog lobo/wolf zorro/fox !pez/fish coyote/coyote
*nieve/snow hielo/ice !fuego/fire escarcha/frost glaciar/glacier
*tenis/tennis pádel/paddle squash/squash bádminton/badminton !ajedrez/chess
silla/chair *sofá/sofa banco/bench taburete/stool !nube/cloud
*águila/eagle halcón/falcon búho/owl !pingüino/penguin gorrión/sparrow
manzana/apple *pera/pear cereza/cherry !brócoli/broccoli ciruela/plum
*guitarra/guitar arpa/harp violín/violin !tambor/drum banjo/banjo
oro/gold *plata/silver !madera/wood cobre/copper platino/platinum
*tren/train tranvía/tram metro/subway !avión/plane autobús/bus
*rosa/pink lila/lilac malva/mauve !negro/black salmón/salmon
*luna/moon estrella/star cometa/comet !farola/streetlight planeta/planet
*seis/six siete/seven ocho/eight nueve/nine
*alto/tall bajo/short
*rápido/fast lento/slow
*viejo/old nuevo/new
*claro/light oscuro/dark
*dulce/sweet salado/salty ácido/sour amargo/bitter
*círculo/circle óvalo/oval espiral/spiral estrella/star flecha/arrow
cuadro/painting *foto/photo escultura/sculpture dibujo/drawing mural/mural
*canción/song poema/poem cuento/story novela/novel carta/letter
*bosque/forest selva/jungle sabana/savanna tundra/tundra pradera/prairie
*volcán/volcano montaña/mountain colina/hill valle/valley cañón/canyon
*océano/ocean mar/sea golfo/gulf bahía/bay laguna/lagoon
*faro/lighthouse puerto/harbor muelle/pier barco/boat ancla/anchor
*castillo/castle torre/tower puente/bridge muralla/wall palacio/palace
*rojo/red rosa/pink morado/purple
*gris/gray beige/beige marrón/brown
*martillo/hammer pincel/brush aguja/needle tijeras/scissors
*tren/train vía/track estación/station billete/ticket andén/platform
*nube/cloud niebla/mist humo/smoke vapor/steam
*cielo/sky espacio/space órbita/orbit galaxia/galaxy
*pan/bread queso/cheese jamón/ham tomate/tomato aceite/oil
*manzana/apple naranja/orange
*izquierda/left centro/center derecha/right
*arriba/top medio/middle abajo/bottom
*principio/beginning medio/middle final/end
*ida/outbound vuelta/return
*rey/king reina/queen príncipe/prince bufón/jester
*tortuga/turtle liebre/hare
*hormiga/ant cigarra/cicada
*ratón/mouse teclado/keyboard pantalla/screen cable/cable
*azul/blue verde/green turquesa/turquoise
*limón/lemon lima/lime naranja/orange mandarina/tangerine
*nuez/walnut almendra/almond avellana/hazelnut castaña/chestnut pistacho/pistachio
*violeta/violet cian/cyan magenta/magenta
*ola/wave arena/sand concha/shell gaviota/seagull
*brújula/compass mapa/map estrella/star faro/lighthouse
*despegue/liftoff órbita/orbit alunizaje/landing regreso/return
*cráter/crater valle/valley cima/peak llanura/plain
*astronauta/astronaut piloto/pilot ingeniera/engineer médica/doctor científica/scientist
*semana/week mes/month año/year día/day hora/hour
*segundo/second minuto/minute hora/hour
*1/1 2/2 3/3
*uno/one ninguno/none todos/all
*rojo/red gris/gray
*paz/peace calma/calm silencio/silence
*risa/laughter sonrisa/smile abrazo/hug beso/kiss
*sueño/dream idea/idea plan/plan meta/goal
*juego/game regla/rule turno/turn premio/prize
*mapa/map tesoro/treasure isla/island cofre/chest llave/key
*globo/balloon pastel/cake vela/candle regalo/gift
*sombra/shadow luz/light reflejo/reflection
*eco/echo susurro/whisper grito/shout canto/song
*hielo/ice agua/water vapor/vapor
*semilla/seed brote/sprout flor/flower fruto/fruit
*huevo/egg pollito/chick gallina/hen
*nido/nest rama/branch pluma/feather ala/wing
*barco/boat vela/sail remo/oar timón/rudder
*piedra/stone arena/sand roca/boulder grava/gravel
*lunes/Monday martes/Tuesday miércoles/Wednesday jueves/Thursday viernes/Friday
*perro/dog gato/cat conejo/rabbit hámster/hamster loro/parrot tortuga/turtle
*pino/pine roble/oak palmera/palm sauce/willow abeto/fir olivo/olive_tree
*tomate/tomato lechuga/lettuce cebolla/onion pepino/cucumber zanahoria/carrot pimiento/pepper
*fresa/strawberry frambuesa/raspberry mora/blackberry arándano/blueberry grosella/currant
*sol/sun luna/moon Tierra/Earth Marte/Mars Júpiter/Jupiter Saturno/Saturn
*lápiz/pencil goma/eraser regla/ruler compás/compass cuaderno/notebook
*verde/green azul/blue rojo/red amarillo/yellow naranja/orange morado/purple
*avión/plane helicóptero/helicopter globo/balloon cohete/rocket dron/drone planeador/glider
*gato/cat león/lion tigre/tiger leopardo/leopard puma/puma lince/lynx
*caballo/horse burro/donkey cebra/zebra mula/mule poni/pony
*luz/light sombra/shadow fuego/fire chispa/spark brillo/glow
*rojo/red rubí/ruby granate/garnet carmín/crimson coral/coral
*mar/sea río/river lago/lake charco/puddle fuente/fountain
*mesa/table silla/chair puerta/door ventana/window lámpara/lamp
*violín/violin piano/piano flauta/flute arpa/harp clarinete/clarinet tambor/drum
*nieve/snow lluvia/rain sol/sun viento/wind niebla/fog
*cuadrado/square círculo/circle triángulo/triangle hexágono/hexagon pentágono/pentagon
*norte/north noreste/northeast este/east sureste/southeast sur/south
*león/lion elefante/elephant jirafa/giraffe hipopótamo/hippo cocodrilo/crocodile gorila/gorilla
*águila/eagle cóndor/condor halcón/falcon buitre/vulture gaviota/seagull
*rosa/rose clavel/carnation jazmín/jasmine lavanda/lavender amapola/poppy
*cereza/cherry fresa/strawberry tomate/tomato !plátano/banana sandía/watermelon
*libro/book película/movie canción/song cuadro/painting obra/play
*avena/oats trigo/wheat maíz/corn arroz/rice cebada/barley
*hora/hour día/day semana/week mes/month año/year siglo/century
*pulpo/octopus calamar/squid cangrejo/crab langosta/lobster estrella_de_mar/starfish
*búho/owl cuervo/crow paloma/pigeon gorrión/sparrow golondrina/swallow
*gigante/giant enano/dwarf hada/fairy duende/elf ogro/ogre
*diamante/diamond corazón/heart trébol/club pica/spade
*copa/cup taza/mug vaso/glass jarra/jug botella/bottle
*sopa/soup puré/purée guiso/stew caldo/broth crema/cream_soup
*dado/die carta/card ficha/token tablero/board reloj/timer
*astronauta/astronaut cohete/rocket luna/moon estrella/star planeta/planet cometa/comet
*hielo/ice nieve/snow escarcha/frost granizo/hail glaciar/glacier
*arena/sand concha/shell ola/wave toalla/towel sombrilla/beach_umbrella
*tren/train metro/subway tranvía/tram autobús/bus taxi/taxi
*rana/frog sapo/toad salamandra/salamander lagartija/lizard serpiente/snake
*espada/sword escudo/shield arco/bow lanza/spear casco/helmet
*cuchara/spoon cucharón/ladle espátula/spatula batidor/whisk colador/strainer
*rojo/red blanco/white azul/blue verde/green negro/black
*uno/one tres/three cinco/five siete/seven nueve/nine
*dos/two cuatro/four seis/six ocho/eight diez/ten
*A/A E/E I/I O/O U/U
*Do/Do Re/Re Mi/Mi Fa/Fa Sol/Sol La/La Si/Ti
*corazón/heart cerebro/brain pulmón/lung hígado/liver riñón/kidney
*brazo/arm pierna/leg cabeza/head mano/hand pie/foot espalda/back
*abuelo/grandfather abuela/grandmother padre/father madre/mother hijo/son hija/daughter
*cocina/kitchen comedor/dining_room baño/bathroom dormitorio/bedroom jardín/garden garaje/garage
*cartero/mail_carrier bombero/firefighter policía/police_officer médico/doctor maestra/teacher
*martillo/hammer llave/wrench tornillo/screw tuerca/nut taladro/drill
*leche/milk queso/cheese yogur/yogurt mantequilla/butter helado/ice_cream
*globo/globe mapa/map atlas/atlas brújula/compass telescopio/telescope
*café/coffee cacao/cocoa vainilla/vanilla canela/cinnamon jengibre/ginger
*limón/lemon naranja/orange lima/lime mandarina/tangerine kiwi/kiwi
*rayo/lightning trueno/thunder tormenta/storm tornado/tornado huracán/hurricane
*ancla/anchor timón/helm vela/sail mástil/mast faro/lighthouse
*pirámide/pyramid cubo/cube esfera/sphere cilindro/cylinder cono/cone
*pájaro/bird avión/plane nube/cloud cometa/kite globo/balloon
*oro/gold plata/silver bronce/bronze
*alfa/alpha beta/beta gamma/gamma delta/delta épsilon/epsilon omega/omega
*norte/north sur/south este/east oeste/west centro/center
*primavera/spring verano/summer otoño/autumn invierno/winter !lunes/Monday
*mañana/morning tarde/afternoon noche/night !martes/Tuesday mediodía/noon
*manzana/apple pera/pear naranja/orange !martillo/hammer uva/grape
*rojo/red verde/green azul/blue !mesa/table amarillo/yellow
*vaca/cow oveja/sheep cerdo/pig !tractor/tractor caballo/horse
*nube/cloud lluvia/rain nieve/snow !tostada/toast granizo/hail
*silla/chair mesa/table cama/bed sofá/sofa !jirafa/giraffe
*avión/plane barco/ship tren/train !zapato/shoe bicicleta/bicycle
*guitarra/guitar piano/piano batería/drums !cuchara/spoon violín/violin
*luna/moon sol/sun estrella/star !queso/cheese cometa/comet
*azul/blue cian/cyan turquesa/turquoise marino/navy celeste/sky_blue
*gris/gray plateado/silver ceniza/ash humo/smoke perla/pearl
*fresa/strawberry vainilla/vanilla chocolate/chocolate pistacho/pistachio coco/coconut
*rueda/wheel motor/engine volante/steering_wheel freno/brake faro/headlight
*cohete/rocket nave/spaceship cápsula/capsule satélite/satellite estación/station
*mar/sea cielo/sky tierra/land espacio/space fondo/depths
*pez/fish ballena/whale delfín/dolphin tiburón/shark foca/seal
*tienda/tent saco/sleeping_bag linterna/flashlight fogata/campfire mapa/map
*camino/path puente/bridge túnel/tunnel cruce/crossing plaza/square
*pan/bread pastel/cake galleta/cookie helado/ice_cream caramelo/candy
*rojo/red amarillo/yellow verde/green
*arriba/up abajo/down izquierda/left derecha/right
*grande/big pequeño/small enorme/huge diminuto/tiny mediano/medium
*rápido/fast lento/slow quieto/still veloz/swift tranquilo/calm
*feliz/happy triste/sad tranquilo/calm sorprendido/surprised curioso/curious
`.trim().split('\n').map((l,i)=>{const o=l.trim().split(/\s+/).map(t=>{
 let m='';while('*!^'.includes(t[0])){m+=t[0];t=t.slice(1);}
 const [es,en]=t.split('/');return {es:es.replace(/_/g,' '),en:en.replace(/_/g,' '),tip:m.includes('*')?1:0,odd:m.includes('!')?1:0,big:m.includes('^')?1:0};});
 return {id:'w'+i,o};}).filter(l=>l.o.length>=2&&l.o.length<=8);

/* ---------- MÓDULOS DE LA BASE (ronda 6) ---------- */
const MOD=[
 {id:'esclusa',es:'Esclusa',en:'Airlock',tip:.5},
 {id:'comedor',es:'Comedor',en:'Mess hall',tip:.8},
 {id:'invernadero',es:'Invernadero',en:'Greenhouse',tip:.45},
 {id:'radio',es:'Torre de radio',en:'Radio tower',tip:.45},
 {id:'hangar',es:'Hangar',en:'Hangar',tip:.5},
 {id:'enfermeria',es:'Enfermería',en:'Infirmary',tip:.3},
 {id:'observatorio',es:'Observatorio',en:'Observatory',tip:.6},
 {id:'laboratorio',es:'Laboratorio',en:'Lab',tip:.4},
 {id:'dormitorios',es:'Dormitorios',en:'Quarters',tip:.4},
 {id:'gimnasio',es:'Gimnasio',en:'Gym',tip:.3},
 {id:'puente',es:'Puente de mando',en:'Command deck',tip:.7},
 {id:'almacen',es:'Almacén',en:'Storage',tip:.25}
];

/* ---------- PLANETAS (ronda 4) ---------- */
const PLANETAS=[
 {id:'rojo',es:'Planeta rojo',en:'Red planet',ces:'el planeta rojo',cen:'the red planet',suelo:['#3a1f1c','#6e3a2e','#9a5a44'],crater:'#2a1513',borde:'#c78a6e',cielo:'#1a0b0b'},
 {id:'hielo',es:'Mundo helado',en:'Ice world',ces:'el mundo helado',cen:'the ice world',suelo:['#1c2a3a','#36546e','#6f93ad'],crater:'#142030',borde:'#b8d6ea',cielo:'#0a1220'},
 {id:'acido',es:'Mundo ácido',en:'Acid world',ces:'el mundo ácido',cen:'the acid world',suelo:['#1e2a12','#3f5420','#6b7f33'],crater:'#141c0b',borde:'#b9c977',cielo:'#0c1206'},
 {id:'metano',es:'Océano de metano',en:'Methane sea',ces:'el océano de metano',cen:'the methane sea',suelo:['#1a1530','#33285a','#5a4a8a'],crater:'#120d22',borde:'#a99be0',cielo:'#0b0818'},
 {id:'azufre',es:'Luna de azufre',en:'Sulfur moon',ces:'la luna de azufre',cen:'the sulfur moon',suelo:['#2e2810','#5c5020','#8f7f3a'],crater:'#1f1b08',borde:'#d8c56c',cielo:'#141006'},
 {id:'ceniza',es:'Mundo de ceniza',en:'Ash world',ces:'el mundo de ceniza',cen:'the ash world',suelo:['#1f1d22','#3b3840','#625e6a'],crater:'#141317',borde:'#a8a2b4',cielo:'#0b0a0d'},
 {id:'cobre',es:'Desierto de cobre',en:'Copper desert',ces:'el desierto de cobre',cen:'the copper desert',suelo:['#2c1a10','#5a3420','#8c5634'],crater:'#1d1009',borde:'#d79a6c',cielo:'#130a05'},
 {id:'jade',es:'Luna de jade',en:'Jade moon',ces:'la luna de jade',cen:'the jade moon',suelo:['#0f2620','#1f4a3e','#3a7564'],crater:'#0a1a16',borde:'#8fd1bc',cielo:'#06120f'}
];

/* ---------- CONTEXTOS (una línea, nunca da pistas) ---------- */
const CTX={
 luna:[
  ['Te separaste de tu tripulación. No hay radio. ¿Dónde los esperas?','You got separated from your crew. No radio. Where do you wait for them?'],
  ['Tu módulo baja sin contacto con la base. Elige un cráter.','Your module is coming down with no contact with base. Pick a crater.'],
  ['Mil astronautas descienden a la vez. ¿Dónde se reunirán?','A thousand astronauts are descending at once. Where will they meet?'],
  ['La radio falló durante el descenso. Busca a los demás.','The radio failed during descent. Find the others.'],
  ['Nadie acordó un punto de encuentro. ¿Cuál sería?','Nobody agreed on a meeting point. Which one would it be?']],
 num:[
  ['Elige el número que elegirá la mayoría.','Pick the number most people will pick.'],
  ['Cada plataforma tiene un número. ¿En cuál aterrizan todos?','Each platform has a number. Which one does everyone land on?'],
  ['La tripulación tiene que coincidir en un número sin hablar.','The crew has to agree on a number without talking.'],
  ['Un código de reencuentro, sin acordarlo antes.','A reunion code, agreed on without talking first.']],
 color:[
  ['Elige la baliza que elegirá la mayoría.','Pick the beacon most people will pick.'],
  ['Cada baliza brilla de un color. ¿Hacia cuál van todos?','Each beacon glows in a color. Which one does everyone head for?'],
  ['Una señal de color para reencontrarse. ¿Cuál?','One color signal to find each other. Which one?'],
  ['Las balizas se encienden a la vez. Elige una.','The beacons light up at once. Pick one.']],
 planeta:[
  ['Nuevo mundo, mismo problema: nadie te escucha. ¿Dónde aterrizas?','New world, same problem: nobody can hear you. Where do you land?'],
  ['Tu nave orbita {p}. Elige dónde se reunirá la tripulación.','Your ship orbits {p}. Pick where the crew will gather.'],
  ['Primer descenso sobre {p}. Sin mapa común. Elige.','First descent onto {p}. No shared map. Choose.'],
  ['La tripulación se dispersó al entrar en la atmósfera. ¿Dónde se reencuentran?','The crew scattered on atmospheric entry. Where do they regroup?']],
 palabra:[
  ['Elige la palabra que elegirá la mayoría.','Pick the word most people will pick.'],
  ['Una contraseña común, sin poder acordarla.','A shared password, with no way to agree on it.'],
  ['Cada plataforma lleva una palabra. ¿En cuál coinciden todos?','Each platform has a word. Which one does everyone land on?'],
  ['La palabra clave del reencuentro. ¿Cuál dirías?','The reunion keyword. Which one would you say?']],
 base:[
  ['Llegas a la base y no hay nadie. ¿Dónde esperas a los demás?','You reach the base and nobody is there. Where do you wait for the others?'],
  ['Se cortó la luz de la base. ¿En qué módulo se juntan todos?','The base lost power. Which module does everyone gather in?'],
  ['Tu tripulación está repartida por la base. Elige el punto de reunión.','Your crew is spread across the base. Pick the meeting point.'],
  ['Alarma silenciosa en la base. ¿Adónde va todo el mundo?','Silent alarm at the base. Where does everyone go?']],
 gran:[
  ['El gran alunizaje: miles de naves, un solo mapa. ¿Dónde te reúnes?','The great landing: thousands of ships, one map. Where do you meet?'],
  ['Último descenso del día. Más cráteres, más dudas. Elige.','Last descent of the day. More craters, more doubt. Choose.'],
  ['Toda la flota baja a la vez sin radio. ¿Qué cráter eliges?','The whole fleet comes down at once with no radio. Which crater?']]
};

G.CR_BANCOS={NUM,tipNum,COL:COL_HAND.concat(COL_FAM),PAL,MOD,PLANETAS,CTX,hsl};
})(typeof window!=='undefined'?window:globalThis);
