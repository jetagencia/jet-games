/* JET//Cráter · dibujo de mapas, base, astronauta, polvo lunar, mapa de calor y partículas (Canvas 2D).
   Todo en coordenadas normalizadas 0..1 del mapa: el giro y la pantalla completa nunca mueven nada. */
(function(G){
'use strict';
/* =====================================================================
   Astronauta oficial de JET//Games (copiado tal cual de _shared/astronauta/astronauta-oficial.js)
   ===================================================================== */
let TS=40;
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}

function drawAstro(c,cx,cy,f,ph,moving,push,tm,hop){
 const S=TS,u=S/100;
 const bob=moving?-Math.abs(Math.sin(ph))*4:Math.sin(tm*2.2)*1.1;
 const jump=hop>0?-Math.abs(Math.sin(hop*9))*16*Math.max(0,1-hop/1.6):0;
 // shadow
 c.fillStyle='rgba(0,0,0,'+(0.38-(jump?.12:0))+')';c.beginPath();c.ellipse(cx,cy+38*u,(24+jump*.3)*u,7*u,0,0,7);c.fill();
 c.save();c.translate(cx,cy+(bob+jump)*u);c.scale(u,u);
 const side=f==='l'||f==='r';if(f==='l')c.scale(-1,1);
 const lean=push*7;if(side)c.translate(lean,0);else c.translate(0,f==='d'?lean*.5:-lean*.5);
 const OUT='rgba(10,5,18,.6)';c.lineWidth=2.2;c.strokeStyle=OUT;c.lineJoin='round';
 const suit=c.createLinearGradient(-20,-10,20,30);suit.addColorStop(0,'#ffffff');suit.addColorStop(1,'#c7cee3');
 const s1=Math.sin(ph),l1=moving?Math.max(0,s1)*5:0,l2=moving?Math.max(0,-s1)*5:0;
 // legs
 c.fillStyle=suit;
 if(side){const a=moving?s1*6:0;rr(c,-9+a,20,11,17,5);c.fill();c.stroke();rr(c,1-a,20,11,17,5);c.fill();c.stroke();c.fillStyle='#8f97b8';rr(c,-9+a,31,12,6,3);c.fill();rr(c,1-a,31,12,6,3);c.fill();}
 else{rr(c,-14,20-l1,11,17,5);c.fill();c.stroke();rr(c,3,20-l2,11,17,5);c.fill();c.stroke();c.fillStyle='#8f97b8';rr(c,-14,31-l1,11,6,3);c.fill();rr(c,3,31-l2,11,6,3);c.fill();}
 // backpack
 const pack=(x,y,w,h)=>{const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#d9deef');g.addColorStop(1,'#9aa2c4');c.fillStyle=g;rr(c,x,y,w,h,6);c.fill();c.stroke();};
 if(f==='u'){pack(-21,-6,42,30);c.fillStyle='#00f2cf';rr(c,-12,2,7,13,2);c.fill();c.fillStyle='#fdd835';rr(c,-2,2,7,13,2);c.fill();c.fillStyle=(Math.sin(tm*5)>0)?'#ff5a7a':'#5a2340';c.beginPath();c.arc(12,8,3,0,7);c.fill();}
 else if(side){pack(-29,-6,15,28);c.fillStyle='#00f2cf';rr(c,-26,0,4,12,2);c.fill();}
 else{c.fillStyle='#aab1cc';rr(c,-24,-2,6,20,3);c.fill();c.stroke();rr(c,18,-2,6,20,3);c.fill();c.stroke();}
 // body
 c.fillStyle=suit;rr(c,-17,-6,34,32,12);c.fill();c.stroke();
 if(f==='d'){c.fillStyle='#24164a';rr(c,-8,4,16,11,3);c.fill();c.fillStyle='#00f2cf';c.beginPath();c.arc(-3.5,9.5,2,0,7);c.fill();c.fillStyle='#fdd835';c.beginPath();c.arc(3.5,9.5,2,0,7);c.fill();c.fillStyle='#7700f4';rr(c,-17,18,34,4,2);c.fill();}
 else if(side){c.fillStyle='#7700f4';rr(c,-17,18,34,4,2);c.fill();c.fillStyle='#24164a';rr(c,4,5,9,8,2);c.fill();c.fillStyle='#00f2cf';c.beginPath();c.arc(8.5,9,1.8,0,7);c.fill();}
 else{c.fillStyle='#7700f4';rr(c,-17,18,34,4,2);c.fill();}
 // arms
 c.fillStyle=suit;
 if(side){
  if(push>.3){rr(c,4,4,26,10,5);c.fill();c.stroke();c.fillStyle='#8f97b8';c.beginPath();c.arc(31,9,6,0,7);c.fill();c.stroke();}
  else{const sw=moving?-s1*5:0;c.save();c.translate(1,2);c.rotate(sw*.06);rr(c,-5,0,10,20,5);c.fill();c.stroke();c.fillStyle='#8f97b8';c.beginPath();c.arc(0,21,5,0,7);c.fill();c.restore();}
 }else{
  const fw=push>.3;const ay=fw?(f==='d'?14:-2):2;const sw=moving&&!fw?s1*3:0;
  [-1,1].forEach(sg=>{c.fillStyle=suit;rr(c,sg*21-5,ay+sg*sw,10,fw?14:20,5);c.fill();c.stroke();c.fillStyle='#8f97b8';c.beginPath();c.arc(sg*21,ay+sg*sw+(fw?15:21),5,0,7);c.fill();});
 }
 // helmet
 const hg=c.createRadialGradient(-7,-28,3,0,-17,25);hg.addColorStop(0,'#ffffff');hg.addColorStop(1,'#cdd3e8');
 c.fillStyle='#8f97b8';rr(c,-13,-6,26,6,3);c.fill();
 c.fillStyle=hg;c.beginPath();c.arc(0,-18,22,0,7);c.fill();c.stroke();
 // antenna
 // two symmetric antennas (side view: near one in front, far one slightly behind)
 const ants=side?[[-12,-35,-16,-45],[-3,-39,-6,-49]]:[[-10,-36,-14,-46],[10,-36,14,-46]];
 const on=Math.sin(tm*4)>-.2;
 ants.forEach(([x1,y1,x2,y2])=>{c.strokeStyle='#8f97b8';c.lineWidth=2.4;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
  c.fillStyle=on?'#fdd835':'#7a6a20';c.beginPath();c.arc(x2,y2-1,3.2,0,7);c.fill();});
 c.strokeStyle=OUT;c.lineWidth=2.2;
 if(f!=='u'){
  const vx=side?7:0,vw=side?13:16,vh=12;const vg=c.createLinearGradient(vx-vw,-30,vx+vw,-6);vg.addColorStop(0,'#5ffff0');vg.addColorStop(.45,'#00b8c8');vg.addColorStop(1,'#3a1690');
  c.fillStyle=vg;c.beginPath();c.ellipse(vx,-17,vw,vh,0,0,7);c.fill();c.stroke();
  c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.ellipse(vx-vw*.42,-22,vw*.28,vh*.22,-.5,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(vx+vw*.45,-11,vw*.12,vh*.12,0,0,7);c.fill();
 }else{c.strokeStyle='rgba(120,128,165,.6)';c.lineWidth=2;for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(k*7,-26);c.lineTo(k*7,-14);c.stroke();}}
 c.restore();
}
/* Astronauta escalado + llama del jetpack (efecto añadido, la figura no se toca). */
function astro(c,x,y,alto,t,llama,alfa){
 TS=alto;c.save();if(alfa!=null)c.globalAlpha=alfa;
 if(llama>0){const u=alto/100;for(const sx of [-21,21]){const fl=(16+Math.sin(t*40+sx)*5)*llama*u,fx=x+sx*u,fy=y+20*u;
  const g=c.createLinearGradient(fx,fy,fx,fy+fl*2.4);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.25,'rgba(0,242,207,.9)');g.addColorStop(.7,'rgba(119,0,244,.55)');g.addColorStop(1,'rgba(119,0,244,0)');
  c.fillStyle=g;c.beginPath();c.moveTo(fx-4.5*u,fy);c.quadraticCurveTo(fx,fy+fl*2.8,fx+4.5*u,fy);c.closePath();c.fill();}}
 drawAstro(c,x,y,'d',0,false,0,t,0);c.restore();
}

/* ---------- utilidades ---------- */
const GEN=G.CR_GEN,BAN=G.CR_BANCOS;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=t=>1-Math.pow(1-t,3);
function lienzo(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;}
function ruidoValor(r,n){const g=new Float32Array(n*n);for(let i=0;i<g.length;i++)g[i]=r();return (x,y)=>{
 const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,s=t=>t*t*(3-2*t);const a=(i,j)=>g[((j%n+n)%n)*n+((i%n+n)%n)];
 const u=s(fx),v=s(fy);return (a(xi,yi)*(1-u)+a(xi+1,yi)*u)*(1-v)+(a(xi,yi+1)*(1-u)+a(xi+1,yi+1)*u)*v;};}
const PAL_LUNA={suelo:['#211b2e','#3a3150','#5e5577'],crater:'#1a1526',borde:'#8e84ad',cielo:'#0a0612'};
function paleta(ronda){return ronda.tipo==='planeta'?BAN.PLANETAS[ronda.planeta||0]:PAL_LUNA;}
function mezclar(a,b,t){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);const ch=s=>Math.round(((A>>s)&255)*(1-t)+((B>>s)&255)*t);return 'rgb('+ch(16)+','+ch(8)+','+ch(0)+')';}

/* ---------- terreno de un mapa (en caché por ronda y tamaño) ---------- */
const CACHE=new Map();
function terreno(ronda,lado){
 const key=ronda.semilla+':'+ronda.tipo+':'+lado;if(CACHE.has(key))return CACHE.get(key);
 if(CACHE.size>24)CACHE.delete(CACHE.keys().next().value);
 const s=lado,cv=lienzo(s,s),c=cv.getContext('2d'),P=paleta(ronda);
 const r=GEN.mulberry32((ronda.micro||ronda.semilla||7)>>>0);
 // base y relieve suave (ruido de valor, 3 octavas)
 const N=96,img=c.createImageData(N,N),n1=ruidoValor(r,16),n2=ruidoValor(r,32),n3=ruidoValor(r,64);
 const c0=parseInt(P.suelo[0].slice(1),16),c1=parseInt(P.suelo[1].slice(1),16),c2=parseInt(P.suelo[2].slice(1),16);
 const lerpc=(a,b,t,sh)=>((a>>sh)&255)*(1-t)+((b>>sh)&255)*t;
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  let v=n1(x/N*4,y/N*4)*.55+n2(x/N*8,y/N*8)*.3+n3(x/N*16,y/N*16)*.15;v=clamp((v-.25)*1.5,0,1);
  const sh=clamp(v+(n1(x/N*4+.15,y/N*4+.15)-n1(x/N*4,y/N*4))*-1.8,0,1);
  const i=(y*N+x)*4;
  for(let k=0;k<3;k++){const sft=16-8*k;img.data[i+k]=sh<.5?lerpc(c0,c1,sh*2,sft):lerpc(c1,c2,(sh-.5)*2,sft);}
  img.data[i+3]=255;}
 const tmp=lienzo(N,N);tmp.getContext('2d').putImageData(img,0,0);
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(tmp,0,0,s,s);
 // viñeta
 const vg=c.createRadialGradient(s*.45,s*.4,s*.2,s*.5,s*.5,s*.78);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(5,1,8,.55)');c.fillStyle=vg;c.fillRect(0,0,s,s);
 // relieve de planeta: cordillera tenue en un borde (decorativa, lejos de los cráteres)
 if(ronda.tipo==='planeta'){
  const lado2=Math.floor(r()*4);c.save();c.globalAlpha=.35;
  for(let i=0;i<26;i++){const t=i/25,b=.035+r()*.03;let x,y;
   if(lado2===0){x=t;y=b;}else if(lado2===1){x=1-b;y=t;}else if(lado2===2){x=t;y=1-b;}else{x=b;y=t;}
   const h=s*(.014+r()*.018);c.fillStyle=P.borde;c.beginPath();c.moveTo(x*s-h,y*s+h*.6);c.lineTo(x*s,y*s-h);c.lineTo(x*s+h,y*s+h*.6);c.closePath();c.fill();
   c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.moveTo(x*s,y*s-h);c.lineTo(x*s+h,y*s+h*.6);c.lineTo(x*s+h*.2,y*s+h*.6);c.closePath();c.fill();}
  c.restore();
 }
 // microcráteres decorativos (no seleccionables)
 const k=ronda.tipo==='gran'?380:ronda.tipo==='planeta'?240:180;
 for(let i=0;i<k;i++){const x=r(),y=r(),rad=(.002+Math.pow(r(),3)*.01)*s;
  if(ronda.op.some(o=>Math.hypot(o.x-x,o.y-y)<o.r*1.25))continue;
  c.globalAlpha=.18+r()*.25;c.fillStyle='rgba(0,0,0,.6)';c.beginPath();c.arc(x*s,y*s,rad,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.arc(x*s+rad*.25,y*s+rad*.25,rad*.75,0,7);c.fill();
  c.fillStyle=P.crater;c.beginPath();c.arc(x*s,y*s,rad*.72,0,7);c.fill();}
 c.globalAlpha=1;
 // cañón (pista «forma»)
 if(ronda.canon){const pts=ronda.canon;
  const trazo=(w,col,dx,dy)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>{const X=x*s+dx,Y=y*s+dy;i?c.lineTo(X,Y):c.moveTo(X,Y);});c.stroke();};
  trazo(s*.03,'rgba(255,255,255,.12)',s*.004,s*.004);trazo(s*.026,'rgba(0,0,0,.55)',0,0);trazo(s*.012,'rgba(0,0,0,.6)',-s*.002,-s*.002);
 }
 // cráteres jugables
 ronda.op.forEach(o=>dibCrater(c,o,s,P,r));
 CACHE.set(key,cv);return cv;
}
function dibCrater(c,o,s,P,r){
 const x=o.x*s,y=o.y*s,R=o.r*s;
 c.save();c.translate(x,y);
 if(o.rasgo==='oval'){c.rotate(.5);c.scale(1.28,.78);}
 // rayos de eyección
 if(o.rasgo==='rayos'){c.save();c.globalAlpha=.4;for(let i=0;i<14;i++){const a=i/14*Math.PI*2+(i%3)*.11,L=R*(2.2+((i*7)%5)*.35);
  const g=c.createLinearGradient(0,0,Math.cos(a)*L,Math.sin(a)*L);g.addColorStop(0,'rgba(240,236,255,.8)');g.addColorStop(1,'rgba(240,236,255,0)');
  c.strokeStyle=g;c.lineWidth=R*.18*(1-(i%2)*.4);c.beginPath();c.moveTo(Math.cos(a)*R*.9,Math.sin(a)*R*.9);c.lineTo(Math.cos(a)*L,Math.sin(a)*L);c.stroke();}c.restore();}
 // eyecta y borde exterior iluminado (luz desde arriba a la izquierda)
 const ej=c.createRadialGradient(0,0,R*.9,0,0,R*1.45);ej.addColorStop(0,'rgba(220,214,240,.22)');ej.addColorStop(1,'rgba(220,214,240,0)');c.fillStyle=ej;c.beginPath();c.arc(0,0,R*1.45,0,7);c.fill();
 c.lineWidth=R*.16;c.strokeStyle='rgba(255,255,255,.28)';c.beginPath();c.arc(0,0,R*1.02,Math.PI*.95,Math.PI*1.75);c.stroke();
 c.strokeStyle='rgba(0,0,0,.45)';c.beginPath();c.arc(0,0,R*1.02,-.25,Math.PI*.7);c.stroke();
 // suelo del cráter
 const oscuro=o.rasgo==='oscuro';
 const fl=c.createRadialGradient(-R*.25,-R*.3,R*.1,0,0,R);fl.addColorStop(0,oscuro?'#0b0812':mezclar(P.crater,'#ffffff',.08));fl.addColorStop(1,oscuro?'#020104':P.crater);
 c.fillStyle=fl;c.beginPath();c.arc(0,0,R,0,7);c.fill();
 // pared interior: sombra arriba-izquierda, luz abajo-derecha
 const pw=c.createLinearGradient(-R,-R,R,R);pw.addColorStop(0,'rgba(0,0,0,.55)');pw.addColorStop(.5,'rgba(0,0,0,0)');pw.addColorStop(1,'rgba(255,255,255,.18)');
 c.fillStyle=pw;c.beginPath();c.arc(0,0,R,0,7);c.fill();
 c.lineWidth=Math.max(1.2,R*.07);c.strokeStyle=o.rasgo==='hielo'?'#c9fbff':P.borde;c.globalAlpha=o.rasgo==='hielo'?1:.65;c.beginPath();c.arc(0,0,R,0,7);c.stroke();c.globalAlpha=1;
 if(o.rasgo==='hielo'){c.shadowColor='#7ff6ff';c.shadowBlur=R*.5;c.strokeStyle='rgba(180,250,255,.85)';c.lineWidth=Math.max(1.5,R*.12);c.beginPath();c.arc(0,0,R*.96,0,7);c.stroke();c.shadowBlur=0;
  for(let i=0;i<9;i++){const a=i/9*7;c.fillStyle='rgba(230,255,255,.8)';c.beginPath();c.arc(Math.cos(a)*R*.97,Math.sin(a)*R*.97,R*.06,0,7);c.fill();}}
 if(o.rasgo==='doble'){c.strokeStyle=P.borde;c.globalAlpha=.75;c.lineWidth=Math.max(1,R*.06);c.beginPath();c.arc(R*.04,R*.04,R*.56,0,7);c.stroke();c.globalAlpha=1;
  c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.arc(R*.04,R*.04,R*.53,0,7);c.fill();}
 if(o.rasgo==='pico'){const g=c.createRadialGradient(-R*.06,-R*.06,0,0,0,R*.22);g.addColorStop(0,'rgba(255,255,255,.75)');g.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.ellipse(R*.1,R*.08,R*.2,R*.13,0,0,7);c.fill();c.fillStyle=g;c.beginPath();c.arc(0,0,R*.22,0,7);c.fill();}
 c.restore();
}

/* ---------- plano de la base (ronda 6) ---------- */
function plano(ronda,lado,lang,dpr){dpr=dpr||1;
 const key='base:'+ronda.semilla+':'+lado+':'+lang+':'+dpr;if(CACHE.has(key))return CACHE.get(key);
 const s=lado,cv=lienzo(s,s),c=cv.getContext('2d');
 c.fillStyle='#0b0620';c.fillRect(0,0,s,s);
 // rejilla de plano
 c.strokeStyle='rgba(119,0,244,.13)';c.lineWidth=1;for(let i=0;i<=20;i++){const p=i/20*s;c.beginPath();c.moveTo(p,0);c.lineTo(p,s);c.stroke();c.beginPath();c.moveTo(0,p);c.lineTo(s,p);c.stroke();}
 c.strokeStyle='rgba(119,0,244,.26)';for(let i=0;i<=4;i++){const p=i/4*s;c.beginPath();c.moveTo(p,0);c.lineTo(p,s);c.stroke();c.beginPath();c.moveTo(0,p);c.lineTo(s,p);c.stroke();}
 // regolito fuera de la base
 const vg=c.createRadialGradient(s/2,s/2,s*.25,s/2,s/2,s*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.5)');c.fillStyle=vg;c.fillRect(0,0,s,s);
 // pasillos
 const P=ronda.op;
 ronda.pasillos.forEach(([a,b])=>{const A=P[a],B=P[b];
  c.lineCap='round';c.strokeStyle='#2a1f4a';c.lineWidth=s*.05;c.beginPath();c.moveTo(A.x*s,A.y*s);c.lineTo(B.x*s,B.y*s);c.stroke();
  c.strokeStyle='#3d2f6b';c.lineWidth=s*.03;c.stroke();
  c.setLineDash([s*.012,s*.014]);c.strokeStyle='rgba(0,242,207,.35)';c.lineWidth=Math.max(1,s*.004);c.stroke();c.setLineDash([]);});
 // módulos
 P.forEach((o,i)=>{const x=o.x*s,y=o.y*s,w=o.w*s,h=o.h*s;
  c.save();c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=s*.02;c.shadowOffsetY=s*.006;
  const g=c.createLinearGradient(x-w/2,y-h/2,x+w/2,y+h/2);g.addColorStop(0,'#2e2356');g.addColorStop(1,'#171030');c.fillStyle=g;
  if(o.forma==='domo'||o.forma==='torre'){c.beginPath();c.arc(x,y,w/2,0,7);c.fill();}else{rr(c,x-w/2,y-h/2,w,h,s*.016);c.fill();}
  c.restore();
  c.lineWidth=Math.max(1.2,s*.005);c.strokeStyle='#8a78c9';
  if(o.forma==='domo'){c.beginPath();c.arc(x,y,w/2,0,7);c.stroke();const dg=c.createRadialGradient(x-w*.18,y-w*.2,0,x,y,w/2);dg.addColorStop(0,'rgba(200,230,255,.45)');dg.addColorStop(1,'rgba(200,230,255,0)');c.fillStyle=dg;c.beginPath();c.arc(x,y,w/2,0,7);c.fill();
   c.strokeStyle='rgba(180,200,255,.35)';for(let k=1;k<3;k++){c.beginPath();c.arc(x,y,w/2*k/3,0,7);c.stroke();}c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x+w/2,y);c.moveTo(x,y-w/2);c.lineTo(x,y+w/2);c.stroke();}
  else if(o.forma==='torre'){c.beginPath();c.arc(x,y,w/2,0,7);c.stroke();c.strokeStyle='#c8bff0';c.lineWidth=Math.max(1.5,s*.006);c.beginPath();c.moveTo(x,y);c.lineTo(x+w*.42,y-w*.62);c.stroke();
   c.fillStyle='#ff4466';c.beginPath();c.arc(x+w*.42,y-w*.62,Math.max(2,s*.008),0,7);c.fill();}
  else{rr(c,x-w/2,y-h/2,w,h,s*.016);c.stroke();c.fillStyle='rgba(0,242,207,.5)';for(let k=0;k<3;k++){rr(c,x-w*.32+k*w*.24,y-h*.36,w*.14,h*.1,2);c.fill();}
   if(o.forma==='grande'){c.strokeStyle='rgba(138,120,201,.5)';c.beginPath();c.moveTo(x-w/2+4,y+h*.18);c.lineTo(x+w/2-4,y+h*.18);c.stroke();}}
  // puerta de la esclusa
  if(o.puerta){const d={n:[0,-1],s:[0,1],e:[1,0],o:[-1,0]}[o.puerta];const px=x+d[0]*(w/2+s*.035),py=y+d[1]*(h/2+s*.035);
   c.strokeStyle='#fdd835';c.fillStyle='#fdd835';c.lineWidth=Math.max(1.5,s*.006);c.beginPath();c.moveTo(px+d[0]*s*.04,py+d[1]*s*.04);c.lineTo(px,py);c.stroke();
   c.beginPath();const a=Math.atan2(-d[1],-d[0]);c.moveTo(px,py);c.lineTo(px+Math.cos(a+2.6)*s*.016,py+Math.sin(a+2.6)*s*.016);c.lineTo(px+Math.cos(a-2.6)*s*.016,py+Math.sin(a-2.6)*s*.016);c.closePath();c.fill();}
 });
 // nombres
 const fz=clamp(s/dpr*.038,11,15)*dpr;if(s/dpr<170){CACHE.set(key,cv);return cv;}c.font='600 '+fz+'px Poppins, system-ui, sans-serif';c.textAlign='center';c.textBaseline='top';
 P.forEach(o=>{const m=BAN.MOD.find(q=>q.id===o.mod),txt=m[lang]||m.es;const x=o.x*s,y=o.y*s+(o.forma==='domo'||o.forma==='torre'?o.w:o.h)*s/2+s*.012;
  const palabras=txt.split(' ');let lineas=[txt];if(c.measureText(txt).width>s*.27&&palabras.length>1){const mid=Math.ceil(palabras.length/2);lineas=[palabras.slice(0,mid).join(' '),palabras.slice(mid).join(' ')];}
  lineas.forEach((l,k)=>{const w=c.measureText(l).width;c.fillStyle='rgba(5,1,8,.78)';rr(c,x-w/2-5*dpr,y+k*(fz+3*dpr)-2*dpr,w+10*dpr,fz+4*dpr,4*dpr);c.fill();c.fillStyle='#e9e3ff';c.fillText(l,x,y+k*(fz+3*dpr));});});
 CACHE.set(key,cv);return cv;
}

/* ---------- selección, objetivo táctil ---------- */
function geom(ronda,i,box){const o=ronda.op[i],s=box.s;
 if(o.r!=null)return {x:box.x+o.x*s,y:box.y+o.y*s,r:o.r*s*(o.rasgo==='oval'?1.15:1)};
 const r=(o.forma==='domo'||o.forma==='torre')?o.w*s/2:Math.max(o.w,o.h)*s/2;return {x:box.x+o.x*s,y:box.y+o.y*s,r,w:o.w*s,h:o.h*s,forma:o.forma};}
/* Toque → opción: radio de captura = máx(radio×1,15; 24 px); gana el centro más cercano; lejos de todo (>2× radio) → nada. */
function elegirEn(ronda,box,px,py){
 let best=-1,bd=1e9,cerca=false;
 ronda.op.forEach((o,i)=>{const g=geom(ronda,i,box);let d=Math.hypot(px-g.x,py-g.y);
  if(g.w&&g.forma!=='domo'&&g.forma!=='torre'){const dx=Math.max(0,Math.abs(px-g.x)-g.w/2),dy=Math.max(0,Math.abs(py-g.y)-g.h/2);d=Math.hypot(dx,dy)+Math.min(g.w,g.h)*.3;}
  const cap=Math.max(g.r*1.15,24);if(d<=cap*2)cerca=true;
  if(d<=cap&&d<bd){bd=d;best=i;}});
 if(best<0&&cerca){ronda.op.forEach((o,i)=>{const g=geom(ronda,i,box);const d=Math.hypot(px-g.x,py-g.y);if(d<bd&&d<=Math.max(g.r*1.15,24)*2){bd=d;best=i;}});}
 return best;
}

/* ---------- mapa de calor ---------- */
function rampa(t,fuerte){ // transparente → violeta → cian → blanco
 const A=[[119,0,244],[0,242,207],[255,255,255]];let r,g,b,a;
 if(t<.45){const k=t/.45;[r,g,b]=A[0];a=k*(fuerte?.75:.5);}
 else if(t<.85){const k=(t-.45)/.4;r=A[0][0]+(A[1][0]-A[0][0])*k;g=A[0][1]+(A[1][1]-A[0][1])*k;b=A[0][2]+(A[1][2]-A[0][2])*k;a=fuerte?.78:.55;}
 else{const k=(t-.85)/.15;r=A[1][0]+(255-A[1][0])*k;g=A[1][1]+(255-A[1][1])*k;b=A[1][2]+(255-A[1][2])*k;a=fuerte?.88:.6;}
 return [r,g,b,a];}
function capaCalor(pts,fuerte,tinte){ // pts: [[x,y,w],...] normalizados
 const N=64,d=new Float32Array(N*N);
 pts.forEach(([x,y,w])=>{const i=Math.floor(clamp(x,0,.999)*N),j=Math.floor(clamp(y,0,.999)*N);d[j*N+i]+=w||1;});
 // desenfoque por cajas (3 pasadas ≈ gaussiano)
 const tmp=new Float32Array(N*N),R=2;
 for(let p=0;p<3;p++){
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){let s=0,n=0;for(let k=-R;k<=R;k++){const ii=i+k;if(ii>=0&&ii<N){s+=d[j*N+ii];n++;}}tmp[j*N+i]=s/n;}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){let s=0,n=0;for(let k=-R;k<=R;k++){const jj=j+k;if(jj>=0&&jj<N){s+=tmp[jj*N+i];n++;}}d[j*N+i]=s/n;}}
 let mx=0;for(let i=0;i<d.length;i++)mx=Math.max(mx,d[i]);
 const cv=lienzo(N,N),c=cv.getContext('2d'),img=c.createImageData(N,N);
 for(let i=0;i<d.length;i++){const t=mx?Math.pow(d[i]/mx,.7):0;let [r,g,b,a]=rampa(t,fuerte);
  if(tinte){r=119+(r-119)*.25;g=g*.25;b=244;a*=.55;}
  img.data[i*4]=r;img.data[i*4+1]=g;img.data[i*4+2]=b;img.data[i*4+3]=Math.round(a*255*clamp(t*3,0,1));}
 c.putImageData(img,0,0);return cv;
}

/* ---------- polvo lunar (cubre el mapa hasta la revelación) ---------- */
let POLVO=null;
function texturaPolvo(){if(POLVO)return POLVO;const N=128,cv=lienzo(N,N),c=cv.getContext('2d'),img=c.createImageData(N,N),r=GEN.mulberry32(99),n=ruidoValor(r,16),m=ruidoValor(r,32);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=n(x/N*6,y/N*6)*.65+m(x/N*14,y/N*14)*.35,i=(y*N+x)*4;
  img.data[i]=60+v*70;img.data[i+1]=30+v*40;img.data[i+2]=110+v*90;img.data[i+3]=200+v*55;}
 c.putImageData(img,0,0);return POLVO=cv;}
function polvo(c,box,cubre,t,hueco){ // cubre 0..1: fracción cubierta desde arriba (la revelación barre de abajo hacia arriba)
 if(cubre<=0)return;const P=texturaPolvo(),s=box.s;
 c.save();c.beginPath();rr(c,box.x,box.y,s,s,Math.min(18,s*.04));c.clip();
 c.beginPath();c.rect(box.x,box.y,s,s*cubre+2);c.clip();
 const o=(t*6)%s;c.globalAlpha=.94;c.imageSmoothingEnabled=true;
 c.drawImage(P,box.x-o,box.y,s,s);c.drawImage(P,box.x-o+s,box.y,s,s);
 c.globalAlpha=.35;c.drawImage(P,box.x+o*.5-s*.5,box.y-o*.3,s*2,s*2);
 if(hueco){c.globalCompositeOperation='destination-out';hueco.forEach(([x,y,r])=>{const g=c.createRadialGradient(box.x+x*s,box.y+y*s,0,box.x+x*s,box.y+y*s,r*s);g.addColorStop(0,'rgba(0,0,0,.85)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(box.x,box.y,s,s);});c.globalCompositeOperation='source-over';}
 // borde del frente de polvo
 if(cubre<1){const y=box.y+s*cubre;const g=c.createLinearGradient(0,y-s*.06,0,y+2);g.addColorStop(0,'rgba(200,170,255,0)');g.addColorStop(1,'rgba(220,200,255,.55)');c.globalAlpha=1;c.fillStyle=g;c.fillRect(box.x,y-s*.06,s,s*.06+2);}
 c.restore();
}

/* ---------- partículas (polvo del aterrizaje, confeti fino, lluvia de puntos) ---------- */
const PART=[];
function rafaga(x,y,n,col,vel,vida){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=(vel||90)*(.4+Math.random()*.8);
 PART.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.55-12,g:40,vida:(vida||.7)*(.6+Math.random()*.6),t:0,r:1.2+Math.random()*2.4,col:col||'rgba(214,204,240,'});}}
function confeti(x,y,n){for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*2.2,v=120+Math.random()*160;
 PART.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:180,vida:1.1+Math.random()*.6,t:0,r:1+Math.random()*1.8,col:Math.random()<.7?'rgba(0,242,207,':'rgba(245,240,255,'});}}
function particulas(c,dt){for(let i=PART.length-1;i>=0;i--){const p=PART[i];p.t+=dt;if(p.t>=p.vida){PART.splice(i,1);continue;}
 p.vx*=Math.pow(.2,dt);p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const a=1-p.t/p.vida;c.fillStyle=p.col+(a*.85).toFixed(3)+')';c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill();}}

/* ---------- dibujo de una ronda de mapa o base ---------- */
function dibujar(c,box,ronda,st){
 const s=box.s,t=st.t||0,lang=st.lang||'es',dpr=st.dpr||1;
 const lado=Math.round(s*dpr);
 c.save();
 // marco
 c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=24;c.fillStyle='#07040d';rr(c,box.x,box.y,s,s,Math.min(18,s*.04));c.fill();c.shadowBlur=0;
 c.save();rr(c,box.x,box.y,s,s,Math.min(18,s*.04));c.clip();
 const img=ronda.tipo==='base'?plano(ronda,lado,lang,dpr):terreno(ronda,lado);
 c.imageSmoothingEnabled=true;c.drawImage(img,box.x,box.y,s,s);
 // barrido de luz rasante al entrar
 if(st.entrada!=null&&st.entrada<1){const k=st.entrada,x=box.x-s*.4+k*s*1.8;const g=c.createLinearGradient(x-s*.25,box.y,x+s*.25,box.y+s*.2);
  g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(220,240,255,.16)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(box.x,box.y,s,s);}
 // calor (revelación)
 if(st.calor){c.imageSmoothingEnabled=true;c.globalAlpha=st.calorA==null?1:st.calorA;
  if(st.calor.practica)c.drawImage(st.calor.practica,box.x,box.y,s,s);
  if(st.calor.real)c.drawImage(st.calor.real,box.x,box.y,s,s);c.globalAlpha=1;}
 // anillos: elección, foco de teclado, hover, ganador
 ronda.op.forEach((o,i)=>{const g=geom(ronda,i,box);
  const anillo=(col,w,rad,dash)=>{c.save();c.strokeStyle=col;c.lineWidth=w;if(dash)c.setLineDash(dash);c.beginPath();
   if(g.w&&g.forma!=='domo'&&g.forma!=='torre')rr(c,g.x-g.w/2-rad,g.y-g.h/2-rad,g.w+rad*2,g.h+rad*2,8);else c.arc(g.x,g.y,g.r+rad,0,7);c.stroke();c.restore();};
  if(st.ganadores&&st.ganadores.includes(i)&&st.coronaA>0){c.save();c.globalAlpha=st.coronaA;c.shadowColor='#00f2cf';c.shadowBlur=18;anillo('rgba(160,255,240,.95)',3,6);c.restore();
   coronita(c,g.x,g.y-g.r-(g.h?0:0)-16,st.coronaA);}
  if(st.hover===i&&st.sel!==i)anillo('rgba(160,110,255,.75)',2,5);
  if(st.foco===i)anillo('rgba(0,242,207,.95)',2,9,[5,4]);
  if(st.sel===i){const k=.5+.5*Math.sin(t*3.9);c.save();c.shadowColor='#00f2cf';c.shadowBlur=10+k*10;anillo('rgba(0,242,207,'+(.75+k*.25)+')',2.5+k,4+k*2);c.restore();}
  if(st.mio===i&&st.marcarMio)anillo('rgba(253,216,53,.9)',2,12,[2,4]);
  if(st.pct&&st.pct[i]!=null){const txt=st.pct[i]+' %';c.font='700 '+clamp(s*.04,12,16)+'px "JetBrains Mono", monospace';c.textAlign='center';c.textBaseline='middle';
   const w=c.measureText(txt).width+12,yy=g.y+(g.h?g.h/2:g.r)+14;c.fillStyle=st.ganadores&&st.ganadores.includes(i)?'rgba(0,242,207,.92)':'rgba(10,5,18,.82)';rr(c,g.x-w/2,yy-10,w,20,10);c.fill();
   c.fillStyle=st.ganadores&&st.ganadores.includes(i)?'#062a24':'#f5f0ff';c.fillText(txt,g.x,yy+.5);}
 });
 // lluvia de puntos
 if(st.lluvia)st.lluvia.forEach(p=>{if(p.k<=0)return;const k=Math.min(1,p.k),x=box.x+p.x*s,y=box.y+(p.y*s)*(ease(k))-(1-ease(k))*s*.35;
  c.fillStyle=p.real?'rgba(0,242,207,'+(.9-.5*Math.max(0,p.k-1))+')':'rgba(170,120,255,'+(.7-.4*Math.max(0,p.k-1))+')';c.beginPath();c.arc(x,y,p.real?2.2:1.6,0,7);c.fill();});
 // polvo
 if(st.polvo!=null)polvo(c,box,st.polvo,t,st.hueco);
 c.restore();
 // borde del marco
 c.strokeStyle='rgba(245,240,255,.12)';c.lineWidth=1;rr(c,box.x+.5,box.y+.5,s-1,s-1,Math.min(18,s*.04));c.stroke();
 // astronauta: fantasma sobre la elección o aterrizaje
 const alto=k=>Math.max(30,Math.min(64,k));
 if(st.astro){const a=st.astro,g=geom(ronda,a.i,box),h=alto(g.r*1.5),u=h/100;
  const destY=g.y-6*u;let y=destY,llama=0,alfa=1,sombra=1;
  if(a.fase==='fantasma'){y=destY-h*.55+Math.sin(t*2.6)*3;alfa=.62;llama=.45;}
  else if(a.fase==='bajando'){const k=clamp(a.k,0,1);y=destY-(1-ease(k))*(box.y+s*.9);llama=1-k*.4;}
  else{llama=0;}
  // sombra que se achica al bajar
  if(a.fase!=='posado'){c.fillStyle='rgba(0,0,0,'+(.18+.2*sombra*(a.fase==='bajando'?ease(clamp(a.k,0,1)):.5))+')';c.beginPath();c.ellipse(g.x,destY+38*u,24*u*(a.fase==='bajando'?.6+.4*ease(clamp(a.k,0,1)):.8),7*u,0,0,7);c.fill();}
  astro(c,g.x,y,h,t,llama,alfa);
 }
 c.restore();
}
function coronita(c,x,y,a){c.save();c.globalAlpha=a;c.fillStyle='#00f2cf';c.shadowColor='#00f2cf';c.shadowBlur=10;c.beginPath();
 c.moveTo(x-11,y+5);c.lineTo(x-11,y-3);c.lineTo(x-5,y+1);c.lineTo(x,y-7);c.lineTo(x+5,y+1);c.lineTo(x+11,y-3);c.lineTo(x+11,y+5);c.closePath();c.fill();c.restore();}

/* ---------- fondo: estrellas, Luna gigante, estrellas fugaces ---------- */
let EST=null;
function estrellas(n){if(EST&&EST.length===n)return EST;const r=GEN.mulberry32(4242);EST=[];for(let i=0;i<n;i++)EST.push({x:r(),y:r(),z:.2+r()*.8,f:r()*6});return EST;}
let LUNA=null;
function texturaLuna(){if(LUNA)return LUNA;const N=512,cv=lienzo(N,N),c=cv.getContext('2d'),r=GEN.mulberry32(1969);
 const g=c.createRadialGradient(N*.38,N*.32,N*.05,N*.5,N*.5,N*.5);g.addColorStop(0,'#8a80a6');g.addColorStop(.6,'#4d4566');g.addColorStop(1,'#1d1730');
 c.fillStyle=g;c.beginPath();c.arc(N/2,N/2,N/2,0,7);c.fill();
 c.save();c.beginPath();c.arc(N/2,N/2,N/2,0,7);c.clip();
 for(let i=0;i<5;i++){c.fillStyle='rgba(20,14,36,.28)';c.beginPath();c.ellipse(r()*N,r()*N,N*(.08+r()*.12),N*(.06+r()*.1),r()*3,0,7);c.fill();}
 for(let i=0;i<160;i++){const x=r()*N,y=r()*N,rad=N*(.004+Math.pow(r(),3)*.05);c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.arc(x,y,rad,0,7);c.fill();c.fillStyle='rgba(255,255,255,.12)';c.beginPath();c.arc(x+rad*.2,y+rad*.2,rad*.8,0,7);c.fill();c.fillStyle='rgba(40,32,62,.5)';c.beginPath();c.arc(x,y,rad*.7,0,7);c.fill();}
 const sh=c.createRadialGradient(N*.3,N*.25,N*.2,N*.55,N*.55,N*.62);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(5,1,8,.85)');c.fillStyle=sh;c.fillRect(0,0,N,N);
 c.restore();return LUNA=cv;}
const FUGAZ=[];let proxFugaz=6;
function fondo(c,w,h,t,dt,o){
 o=o||{};
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#050108');g.addColorStop(.7,'#0a0418');g.addColorStop(1,'#120828');c.fillStyle=g;c.fillRect(0,0,w,h);
 const px=o.px||0,py=o.py||0;
 estrellas(Math.round(Math.min(420,w*h/2600))).forEach(s=>{const x=((s.x*w+px*s.z*14)%w+w)%w,y=((s.y*h+py*s.z*10)%h+h)%h;
  const a=.25+.55*s.z*(o.quieto?1:(.65+.35*Math.sin(t*1.3+s.f)));c.fillStyle='rgba(245,240,255,'+a.toFixed(3)+')';c.fillRect(x,y,s.z*1.6,s.z*1.6);});
 if(!o.quieto){proxFugaz-=dt;if(proxFugaz<=0){proxFugaz=12+Math.random()*8;FUGAZ.push({x:Math.random()*w*.8+w*.2,y:Math.random()*h*.35,t:0});}
  for(let i=FUGAZ.length-1;i>=0;i--){const f=FUGAZ[i];f.t+=dt;if(f.t>1.1){FUGAZ.splice(i,1);continue;}const k=f.t/1.1,x=f.x-k*w*.35,y=f.y+k*h*.16;
   const gr=c.createLinearGradient(x,y,x+90,y-40);gr.addColorStop(0,'rgba(255,255,255,'+(.8*(1-k))+')');gr.addColorStop(1,'rgba(255,255,255,0)');c.strokeStyle=gr;c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+90,y-40);c.stroke();}}
 if(o.luna){const R=Math.max(w,h)*(w>h?.62:.9),cx=w/2+px*3,cy=h+R*(w>h?.42:.5)-(o.lunaY||0);
  c.save();c.translate(cx,cy);c.rotate(o.quieto?0:t*.004);c.drawImage(texturaLuna(),-R,-R,R*2,R*2);
  // aterrizajes de ayer titilando
  if(o.puntos){o.puntos.forEach((p,i)=>{const a=p[0],d=p[1]*R*.92,x=Math.cos(a)*d,y=Math.sin(a)*d;const k=o.quieto?.7:.45+.55*Math.sin(t*2+i);
   c.fillStyle='rgba(0,242,207,'+(.35+.6*k).toFixed(3)+')';c.beginPath();c.arc(x,y,1.6+k,0,7);c.fill();});}
  c.restore();
  const hal=c.createRadialGradient(cx,cy,R*.98,cx,cy,R*1.12);hal.addColorStop(0,'rgba(119,0,244,.28)');hal.addColorStop(1,'rgba(119,0,244,0)');c.fillStyle=hal;c.beginPath();c.arc(cx,cy,R*1.12,0,7);c.fill();
 }
}

G.MAPA={dibujar,elegirEn,geom,capaCalor,rafaga,confeti,particulas,PART,fondo,astro,drawAstro,rr,terreno,plano,limpiarCache:()=>CACHE.clear(),hayParticulas:()=>PART.length>0};
})(window);
