/* JET//Cráter · generador determinista del día (7 rondas), saliencia y rivales de práctica.
   Compartido por el navegador y por tests/validar.mjs. Misma fecha → mismo resultado en todo el mundo. */
(function(G){
'use strict';
const B=G.CR_BANCOS;
const VERSION=1;
const EPOCH='2026-10-22';                       // día #1 (lanzamiento)
const TIPOS=['luna','num','color','planeta','palabra','base','gran'];
const BANDAS={luna:[.5,.7],num:[.32,.5],color:[.32,.5],planeta:[.32,.5],palabra:[.25,.4],base:[.25,.4],gran:[.18,.32]};
const RANGO={luna:[5,6],num:[6,12],color:[6,9],planeta:[7,8],palabra:[5,8],base:[6,9],gran:[9,12]};
const RASGOS=['unico','centro','mayor','primero','tipico'];   // + «azar» (constante) para el arquetipo «Por su cuenta»
const ARQ=[['tipico',60],['unico',40],['mayor',30],['centro',30],['primero',20],['azar',20]]; // 200 rivales
const TEMP=.35;
const MAPA_MIN_PX=288;                           // lado del mapa en 320×640 (para el validador de toque)

/* ---------- azar con semilla ---------- */
function hash32(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
 h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;h^=h>>>13;h=Math.imul(h,0xc2b2ae35)>>>0;h^=h>>>16;return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rint=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const rf=(r,a,b)=>a+r()*(b-a);
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const r3=v=>Math.round(v*1000)/1000;

/* ---------- fechas (siempre como texto AAAA-MM-DD, aritmética en UTC) ---------- */
function dias(f){const [y,m,d]=f.split('-').map(Number);return Math.floor(Date.UTC(y,m-1,d)/864e5);}
function deDias(n){const d=new Date(n*864e5);return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');}
const sumar=(f,n)=>deDias(dias(f)+n);
const diaN=f=>dias(f)-dias(EPOCH)+1;
function fechaLocal(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
/* El día D se cierra el D+1 a las 12:00 UTC (fin del día en UTC−12). */
const cierreUTC=f=>(dias(f)+1)*864e5+12*36e5;

/* ---------- bancos: permutación fija → un ítem por día, se repite como pronto a los N días ---------- */
const PERM={};
function permBanco(nom,n){const k=nom+n;if(PERM[k])return PERM[k];const r=mulberry32(hash32('crater:v1:banco:'+nom));
 const p=[];for(let i=0;i<n;i++)p.push(i);return PERM[k]=shuffle(p,r);}
const itemDia=(nom,arr,f,salto)=>{const p=permBanco(nom,arr.length);const i=((dias(f)+(salto||0))%arr.length+arr.length)%arr.length;return arr[p[i]];};

/* ---------- color: Lab para ΔE y para rasgos ---------- */
function hexRgb(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
const LABM=new Map();
function lab(hex){let v=LABM.get(hex);if(!v){v=lab0(hex);LABM.set(hex,v);}return v;}
function lab0(hex){const c=hexRgb(hex).map(v=>{v/=255;return v>.04045?Math.pow((v+.055)/1.055,2.4):v/12.92;});
 let x=(c[0]*.4124+c[1]*.3576+c[2]*.1805)/.95047,y=c[0]*.2126+c[1]*.7152+c[2]*.0722,z=(c[0]*.0193+c[1]*.1192+c[2]*.9505)/1.08883;
 const f=t=>t>.008856?Math.cbrt(t):7.787*t+16/116;x=f(x);y=f(y);z=f(z);return [116*y-16,500*(x-y),200*(y-z)];}
const dE=(a,b)=>{const A=lab(a),C=lab(b);return Math.hypot(A[0]-C[0],A[1]-C[1],A[2]-C[2]);};
function hslDe(hex){const [r,g,b]=hexRgb(hex).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;
 if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return [h,s,l];}
/* Repara una paleta hasta que todo par tenga ΔE ≥ 22 (margen sobre el mínimo de 20): separa en luminosidad el par más parecido. */
function hexDeHsl(h,s,l){return B.hsl(h,s*100,l*100);}
function reparar(p){p=p.slice();
 for(let it=0;it<80;it++){let w=1e9,a=-1,b=-1;
  for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){const e=dE(p[i],p[j]);if(e<w){w=e;a=i;b=j;}}
  if(w>=22)return p;
  const A=hslDe(p[a]),C=hslDe(p[b]);const [o,u]=A[2]>=C[2]?[a,b]:[b,a];
  const O=hslDe(p[o]),U=hslDe(p[u]);
  const subir=O[2]<.93,bajar=U[2]>.07;
  if(subir)p[o]=hexDeHsl(O[0],O[1],Math.min(.96,O[2]+.035));
  if(bajar||!subir)p[u]=hexDeHsl(U[0],U[1],Math.max(.04,U[2]-.035));
 }return null;}
const H=G.CR_HORNO||null;   // bancos ya filtrados y reparados (src/horno.js, generado por tests/hornear.mjs)
const COLORES=H?[]:B.COL.map(reparar).filter(p=>p&&p.length>=6&&p.length<=9);
const PALABRAS=B.PAL.filter(l=>l.o.length>=5);

/* ---------- rasgos de saliencia ---------- */
const posCentro=(i,k)=>Math.exp(-Math.pow((i-(k-1)/2)/.55,2));          // el del medio de la fila
const posPrimero=(i,k)=>i===0?1:i===k-1?.42:0;                            // el primero (y algo el último)

function rasgosMapa(cr){
 const rs=cr.map(c=>c.r).slice().sort((a,b)=>a-b),med=rs[Math.floor(rs.length/2)];
 const ys=cr.map(c=>c.y).slice().sort((a,b)=>a-b);
 return cr.map(c=>{
  const d=Math.hypot(c.x-.5,c.y-.5);
  const dc=Math.min(Math.hypot(c.x,c.y),Math.hypot(1-c.x,c.y),Math.hypot(c.x,1-c.y),Math.hypot(1-c.x,1-c.y));
  const unico=c.rasgo?(cr.filter(o=>o.rasgo===c.rasgo).length===1?(c.fuerza||1):.3):0;
  const centro=Math.exp(-Math.pow(d/.09,2));
  const mayor=clamp((c.r/med-1)/.7,0,1);
  const top=(c.y===ys[0]&&ys[1]-ys[0]>=.16)?.62:0;
  const primero=Math.max(Math.exp(-Math.pow(dc/.2,2)),top);
  const tipico=.9*Math.max(mayor,centro,unico);
  return [unico,centro,mayor,primero,tipico].map(r3);
 });
}

/* ---------- simulación de los 200 rivales de práctica ---------- */
function simular(rasgos,seed){
 const r=mulberry32(seed),k=rasgos.length,cont=new Array(k).fill(0);
 ARQ.forEach(([a,m])=>{
  let v;
  if(a==='azar')v=new Array(k).fill(0);
  else{const j=RASGOS.indexOf(a);v=rasgos.map(x=>x[j]);if(Math.max.apply(null,v)<.5)v=rasgos.map(x=>x[4]);}
  const e=v.map(x=>Math.exp(x/TEMP)),s=e.reduce((p,q)=>p+q,0);
  for(let n=0;n<m;n++){let u=r()*s,i=0;while(i<k-1&&(u-=e[i])>0)i++;cont[i]++;}
 });
 return cont;
}
const modaCuota=c=>Math.max.apply(null,c)/c.reduce((p,q)=>p+q,0);

/* ---------- mapas: rondas 1, 4 y 7 ---------- */
const RASGO_FUERTE=['hielo','rayos','oscuro'],RASGO_DEBIL=['oval','doble','pico'];
function genMapa(r,tipo){
 const [kmin,kmax]=RANGO[tipo],k=rint(r,kmin,kmax);
 const dif=tipo==='luna'?0:tipo==='planeta'?1:2;
 const tiposP=['MAYOR','UNICO','CENTRO','EXTREMO','FORMA'];
 let pistas=[];
 if(dif===0)pistas=[[pick(r,['MAYOR','UNICO','CENTRO']),1]];
 else if(dif===1){const a=shuffle(tiposP.slice(),r);pistas=[[a[0],1],[a[1],0]];}
 else{const a=shuffle(tiposP.slice(),r),n=rint(r,2,3);for(let i=0;i<n;i++)pistas.push([a[i],1]);}
 const tiene=t=>pistas.find(p=>p[0]===t);
 const cr=[];
 const MIN_SEP=.155;                                                     // ≥44 px entre centros a 288 px
 const libre=(x,y,rad)=>cr.every(c=>Math.hypot(c.x-x,c.y-y)>=Math.max((c.r+rad)*1.6,MIN_SEP));
 const pM=tiene('MAYOR');
 const baseR=()=>pM?rf(r,.036,.056):rf(r,.042,.064);
 const colocar=(rad,cond,extra)=>{for(let t=0;t<600;t++){const m=.08+rad;const x=rf(r,m,1-m),y=rf(r,m,1-m);
  if(cond&&!cond(x,y))continue;if(!libre(x,y,rad))continue;const c=Object.assign({x,y,r:rad},extra||{});cr.push(c);return c;}return null;};
 // 1) cráteres con pista
 pistas.forEach(([t,fuerte])=>{
  if(t==='CENTRO'){const rad=baseR(),c=fuerte?{x:.5+rf(r,-.025,.025),y:.5+rf(r,-.025,.025)}:null;
   if(c&&libre(c.x,c.y,rad))cr.push({x:c.x,y:c.y,r:rad,p:'CENTRO'});
   else colocar(rad,(x,y)=>{const d=Math.hypot(x-.5,y-.5);return fuerte?d<.04:d>.07&&d<.11;},{p:'CENTRO'});}
  else if(t==='EXTREMO'){const rad=rf(r,.036,.046);const q=rint(r,0,3),m=.06+rad+rf(r,0,.01);
   const x=q&1?1-m:m,y=q&2?1-m:m;if(fuerte&&libre(x,y,rad))cr.push({x,y,r:rad,p:'EXTREMO'});
   else colocar(rad,(x,y)=>y<.16+rad,{p:'EXTREMO'});}
  else if(t==='MAYOR'){const rad=fuerte?rf(r,.098,.11):rf(r,.075,.082);colocar(rad,null,{p:'MAYOR'});}
  else if(t==='UNICO'){colocar(baseR(),null,{p:'UNICO',rasgo:pick(r,fuerte?RASGO_FUERTE:RASGO_DEBIL),fuerza:fuerte?1:.62});}
  else if(t==='FORMA'){colocar(baseR(),(x,y)=>Math.hypot(x-.5,y-.5)>.18,{p:'FORMA',rasgo:'canon',fuerza:fuerte?.9:.6});}
 });
 // 2) resto de cráteres, lejos del centro y de las esquinas para no crear pistas por accidente
 let guard=0;
 while(cr.length<k&&guard++<40){
  colocar(baseR(),(x,y)=>{const d=Math.hypot(x-.5,y-.5);
   const dc=Math.min(Math.hypot(x,y),Math.hypot(1-x,y),Math.hypot(x,1-y),Math.hypot(1-x,1-y));
   return d>(tiene('CENTRO')?.2:.13)&&dc>.27;});
 }
 if(cr.length<kmin)return null;
 // el cañón: nace en el borde más cercano y muere en el cráter señalado
 let canon=null;const cf=cr.find(c=>c.rasgo==='canon');
 if(cf){const lados=[[cf.x,0],[cf.x,1],[0,cf.y],[1,cf.y]];lados.sort((a,b)=>Math.hypot(a[0]-cf.x,a[1]-cf.y)-Math.hypot(b[0]-cf.x,b[1]-cf.y));
  const s=lados[0],ang=Math.atan2(cf.y-s[1],cf.x-s[0]),L=Math.hypot(cf.y-s[1],cf.x-s[0])-cf.r*1.05;
  const pts=[];for(let i=0;i<=8;i++){const t=i/8;const w=Math.sin(t*Math.PI*2+rf(r,0,6))*.018*(1-t);
   pts.push([r3(s[0]+Math.cos(ang)*L*t-Math.sin(ang)*w),r3(s[1]+Math.sin(ang)*L*t+Math.cos(ang)*w)]);}
  canon=pts;}
 // orden de lectura: arriba→abajo, izquierda→derecha (por franjas)
 cr.sort((a,b)=>(Math.floor(a.y*4)-Math.floor(b.y*4))||(a.x-b.x));
 const op=cr.map(c=>({x:r3(c.x),y:r3(c.y),r:r3(c.r),rasgo:c.rasgo||null,fuerza:c.fuerza||null,p:c.p||null}));
 return {op,canon,micro:Math.floor(r()*1e9),rasgos:rasgosMapa(op)};
}

/* ---------- base: ronda 6 ---------- */
function genBase(r){
 const k=rint(r,6,9);
 const celdas=[];for(let j=0;j<3;j++)for(let i=0;i<3;i++)celdas.push([i,j]);
 let usadas;
 for(let t=0;t<50;t++){ // un subconjunto conexo de la rejilla 3×3
  usadas=shuffle(celdas.slice(),r).slice(0,k);
  const S=new Set(usadas.map(c=>c+''));const vis=new Set([usadas[0]+'']),q=[usadas[0]];
  while(q.length){const [i,j]=q.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{const s=[i+a,j+b]+'';if(S.has(s)&&!vis.has(s)){vis.add(s);q.push([i+a,j+b]);}});}
  if(vis.size===k)break;
 }
 usadas.sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
 const idx=new Map(usadas.map((c,i)=>[c+'',i]));
 // pasillos: árbol de expansión + algún lazo
 const ar=[];usadas.forEach(([i,j],a)=>[[1,0],[0,1]].forEach(([x,y])=>{const b=idx.get([i+x,j+y]+'');if(b!=null)ar.push([a,b]);}));
 shuffle(ar,r);const pa=usadas.map((_,i)=>i),f=x=>pa[x]===x?x:(pa[x]=f(pa[x]));const pas=[];
 ar.forEach(([a,b])=>{if(f(a)!==f(b)){pa[f(a)]=f(b);pas.push([a,b]);}else if(r()<.3)pas.push([a,b]);});
 // nombres
 const mods=shuffle(B.MOD.slice(),r);let nombres=mods.slice(0,k);
 const conEsclusa=r()<.75;
 if(conEsclusa&&!nombres.find(m=>m.id==='esclusa'))nombres[k-1]=B.MOD[0];
 if(!conEsclusa)nombres=nombres.filter(m=>m.id!=='esclusa').concat(mods.filter(m=>m.id!=='esclusa'&&!nombres.includes(m))).slice(0,k);
 shuffle(nombres,r);
 // formas: una cúpula única, a veces una torre única, a veces un módulo grande
 const formas=new Array(k).fill('rect');
 const dom=rint(r,0,k-1);formas[dom]='domo';
 if(r()<.5){let t=rint(r,0,k-1);if(t!==dom)formas[t]='torre';}
 let grande=-1;if(r()<.55){const g=rint(r,0,k-1);if(formas[g]==='rect'){formas[g]='grande';grande=g;}}
 const grado=usadas.map((_,i)=>pas.filter(p=>p[0]===i||p[1]===i).length),gmax=Math.max.apply(null,grado);
 // esclusa: celda de borde (ya lo son casi todas); la puerta da al exterior más cercano
 const op=usadas.map(([i,j],n)=>{
  const f=formas[n],s=f==='grande'?.2:f==='domo'?.16:f==='torre'?.11:.15;
  const x=.2+i*.3+rf(r,-.02,.02),y=.2+j*.3+rf(r,-.02,.02);
  const m=nombres[n];let puerta=null;
  if(m.id==='esclusa'){puerta=i===0?'o':i===2?'e':j===0?'n':j===2?'s':'o';}
  return {x:r3(x),y:r3(y),w:r3(f==='grande'?s*1.25:s),h:r3(s*(f==='grande'?.9:1)),forma:f,mod:m.id,puerta};
 });
 const cuenta=f=>formas.filter(x=>x===f).length;
 const rasgos=op.map((o,n)=>{
  const d=Math.hypot(o.x-.5,o.y-.5);
  const centro=Math.max(Math.exp(-Math.pow(d/.12,2)),grado[n]===gmax&&gmax>=3?.7:0,grado[n]/Math.max(3,gmax)*.5);
  const unico=(o.forma==='domo'&&cuenta('domo')===1)?.9:(o.forma==='torre'&&cuenta('torre')===1)?.75:0;
  const mayor=o.forma==='grande'?1:0;
  const primero=o.puerta?.8:0;
  const tipico=B.MOD.find(m=>m.id===o.mod).tip;
  return [unico,centro,mayor,primero,tipico].map(r3);
 });
 return {op,pasillos:pas,rasgos};
}

/* ---------- listas: rondas 2, 3 y 5 ---------- */
function genNum(r,t){
 let v=t.v.slice();
 if(t.ord!=='asc')shuffle(v,r);
 const k=v.length,mx=Math.max.apply(null,v),mn=Math.min.apply(null,v);
 const tmx=Math.max.apply(null,v.map(B.tipNum));
 const props=[x=>x%2===0,x=>x%10===0,x=>String(x).length,x=>String(x).length>1&&/^(\d)\1+$/.test(String(x)),x=>x===7];
 const rasgos=v.map((x,i)=>{
  let unico=0;props.forEach((P,pi)=>{const val=P(x);if(v.filter(y=>P(y)===val).length===1&&k>=5)unico=Math.max(unico,pi===0||pi===3||pi===4?.8:.45);});
  const orden=v.slice().sort((a,b)=>b-a);
  const mayor=x===mx?.85:x===orden[1]?.22:.05;
  const primero=Math.max(posPrimero(i,k),x===mn?.5:0);
  return [unico,posCentro(i,k),mayor,primero,Math.pow(B.tipNum(x)/tmx,1.6)].map(r3);
 });
 return {op:v.map(x=>({v:x})),rasgos,plantilla:t.id};
}
function tipColor(hex){
 const [h,s,l]=hslDe(hex);
 if(s<.12)return (l<.12||l>.9)?.45:.12;
 const cerca=(a,w)=>{const d=Math.min(Math.abs(h-a),360-Math.abs(h-a));return Math.max(0,1-d/w);};
 const viv=clamp((s-.35)/.5,0,1)*clamp(1-Math.abs(l-.5)/.32,0,1);
 const base=Math.max(cerca(0,18)*1,cerca(220,25)*.78,cerca(120,30)*.62,cerca(55,15)*.55,cerca(172,10)*.55,cerca(275,14)*.55,cerca(30,12)*.4,cerca(300,15)*.35);
 return clamp(.12+viv*base*.88,0,1);
}
function genColor(r,pal){
 const v=pal.slice();shuffle(v,r);const k=v.length;
 const md=v.map((a,i)=>v.reduce((s,b,j)=>j===i?s:s+dE(a,b),0)/(k-1));
 const ord=md.slice().sort((a,b)=>b-a);
 const cr=v.map(h=>{const L=lab(h);return Math.hypot(L[1],L[2]);}),cmx=Math.max.apply(null,cr);
 const tc=v.map(tipColor),tcm=Math.max.apply(null,tc);
 const rasgos=v.map((h,i)=>{
  const unico=md[i]===ord[0]?clamp((ord[0]/ord[1]-1)/.3,0,1):0;
  const mayor=Math.pow(cr[i]/cmx,6)*.8;
  return [unico,posCentro(i,k),mayor,posPrimero(i,k),Math.pow(tc[i]/tcm,1.4)].map(r3);
 });
 return {op:v.map(h=>({hex:h})),rasgos,plantilla:pal.id};
}
function genPalabra(r,l){
 const v=l.o.map((o,i)=>Object.assign({c:i},o));
 shuffle(v,r);const k=v.length;
 const rasgos=v.map((o,i)=>[o.odd?.95:0,posCentro(i,k),o.big?.8:0,posPrimero(i,k),o.tip?.7:.2].map(r3));
 return {op:v.map(o=>({c:o.c,es:o.es,en:o.en})),rasgos,plantilla:l.id};
}

/* ---------- retiro de plantillas fuera de banda (DISENO §6.5) ----------
   Se prueba cada plantilla con 12 órdenes; queda si al menos 3 caen en la banda de su ronda. Determinista. */
function aptas(arr,tipo,gen){const [lo,hi]=BANDAS[tipo];return arr.filter((t,ti)=>{let ok=0;
 for(let i=0;i<12&&ok<3;i++){const g=gen(mulberry32(hash32('apta:'+tipo+':'+ti+':'+i)),t);const m=modaCuota(simular(g.rasgos,hash32('aptas:'+i)));if(m>=lo&&m<=hi)ok++;}
 return ok>=3;});}
const BANCO=H?{
 num:H.num.map(id=>B.NUM.find(t=>t.id===id)),
 color:H.color.map(([id,...p])=>Object.assign(p,{id})),
 palabra:H.palabra.map(id=>PALABRAS.find(l=>l.id===id))
}:{
 num:aptas(B.NUM,'num',genNum),
 color:aptas(COLORES.map((p,i)=>Object.assign(p.slice(),{id:'c'+i})),'color',(r,p)=>genColor(r,p)),
 palabra:aptas(PALABRAS,'palabra',genPalabra)
};
const hornear=()=>({num:BANCO.num.map(t=>t.id),color:BANCO.color.map(p=>[p.id].concat(p.slice())),palabra:BANCO.palabra.map(l=>l.id)});

/* ---------- ronda y día ---------- */
function generarRonda(f,n){
 const tipo=TIPOS[n-1],banda=BANDAS[tipo],seed=hash32('crater:v1:'+f+':'+n);
 let mejor=null,mejorD=1e9;
 for(let i=0;i<40;i++){
  const r=mulberry32((seed+i)>>>0);let g=null;
  if(tipo==='luna'||tipo==='planeta'||tipo==='gran')g=genMapa(r,tipo);
  else if(tipo==='base')g=genBase(r);
  else{const off=i<20?0:Math.floor(BANCO[tipo].length/2),t=itemDia(tipo,BANCO[tipo],f,off);
   g=tipo==='num'?genNum(r,t):tipo==='color'?genColor(r,t):genPalabra(r,t);}
  if(!g)continue;
  const pr=simular(g.rasgos,(seed^0x9e3779b9)+i>>>0),m=modaCuota(pr);
  const d=m<banda[0]?banda[0]-m:m>banda[1]?m-banda[1]:0;
  const cand={n,tipo,intento:i,op:g.op,rasgos:g.rasgos,practica:pr,moda:r3(m)};
  if(g.canon)cand.canon=g.canon;if(g.micro!=null)cand.micro=g.micro;if(g.pasillos)cand.pasillos=g.pasillos;if(g.plantilla)cand.plantilla=g.plantilla;
  if(d<mejorD){mejor=cand;mejorD=d;}
  if(d===0)break;
 }
 const rc=mulberry32(seed^0x51ed270b);
 const cx=B.CTX[tipo];mejor.ctx=Math.floor(rc()*cx.length);
 if(tipo==='planeta')mejor.planeta=Math.floor(rc()*B.PLANETAS.length);
 mejor.semilla=seed;mejor.enBanda=mejorD===0;
 return mejor;
}
const CACHE={};
function generarDia(f){
 if(CACHE[f])return CACHE[f];
 const d={v:VERSION,fecha:f,n:diaN(f),rondas:[]};
 for(let i=1;i<=7;i++)d.rondas.push(generarRonda(f,i));
 const ks=Object.keys(CACHE);if(ks.length>40)delete CACHE[ks[0]];
 return CACHE[f]=d;
}

/* Rasgo dominante de una opción (Brújula y Cuaderno): 0..4 o 5 = por tu cuenta. */
function dominante(rasgos){let b=-1,bv=.5;rasgos.forEach((v,i)=>{if(v>bv){bv=v;b=i;}});return b<0?5:b;}

/* Puntos de los rivales de práctica para el mapa de calor (deterministas). */
function puntosPractica(f,ronda){
 const r=mulberry32(hash32('crater:v1:pts:'+f+':'+ronda.n));const pts=[];
 ronda.practica.forEach((c,i)=>{const o=ronda.op[i];for(let j=0;j<c;j++){
  let x=.5,y=.5;
  if(o.r!=null){const a=r()*Math.PI*2,d=Math.sqrt(r())*o.r*.78;x=o.x+Math.cos(a)*d;y=o.y+Math.sin(a)*d;}
  else if(o.w!=null){x=o.x+(r()-.5)*o.w*.8;y=o.y+(r()-.5)*o.h*.8;}
  else{x=r();y=r();}
  pts.push([x,y,i]);}});
 return pts;
}

G.CR_GEN={VERSION,EPOCH,TIPOS,BANDAS,RANGO,RASGOS,ARQ,MAPA_MIN_PX,hash32,mulberry32,dias,deDias,sumar,diaN,fechaLocal,cierreUTC,
 generarDia,generarRonda,simular,modaCuota,dominante,puntosPractica,dE,lab,hslDe,PALABRAS,BANCO,hornear,shuffle};
})(typeof window!=='undefined'?window:globalThis);
