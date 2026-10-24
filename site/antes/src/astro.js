// Astronauta oficial de JET//Games: copia literal de _shared/astronauta/astronauta-oficial.js.
// Única adaptación: TS (tamaño de la figura) es una variable del módulo que se fija con setTS().
let TS = 40; export function setTS(v) { TS = v; }
// Astronauta oficial de JET//Games (elegido el 2026-10-22): el de JET//Box.
// Copiar tal cual en cada juego que muestre un astronauta. Coordenadas en unidades de 1/100 de casilla:
// TS = tamaño en píxeles de la figura (≈ alto del cuerpo sin antenas), f = 'u'|'d'|'l'|'r', ph = fase de paso,
// moving/push = 0..1, tm = segundos, hop = salto (0 = en el suelo).
export function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}

export function drawAstro(c,cx,cy,f,ph,moving,push,tm,hop){
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
