/* JET//Señal — la Sonda (canvas), el cielo de estrellas y el astronauta oficial. */
(function (G) {
  'use strict';
  const TAU = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3);

  // ---------- estado animado de una Sonda ----------
  function crearSonda() {
    return {
      estado: 'reposo', t0: 0,       // reposo | escaneando | acepta | rechaza | transmite | contacto | falla
      abierto: 0.25, objAbierto: 0.25,
      giro: 0, vel: 1, objVel: 1,
      nucleo: [154, 77, 255], objNucleo: [154, 77, 255],
      onda: -1, ondaCol: '0,242,207', temblor: 0, progreso: -1, escaneo: -1, separa: 0, objSepara: 0,
      destello: 0
    };
  }
  const VIOLETA = [154, 77, 255], CIAN = [0, 242, 207], ROJO = [255, 68, 102], BLANCO = [245, 240, 255];
  function poner(s, estado, ahora) {
    s.estado = estado; s.t0 = ahora;
    switch (estado) {
      case 'reposo': s.objAbierto = 0.25; s.objVel = 1; s.objNucleo = VIOLETA; s.objSepara = 0; s.progreso = -1; s.escaneo = -1; break;
      case 'escaneando': s.objAbierto = 0.4; s.objVel = 3.2; s.objNucleo = BLANCO; s.escaneo = 0; break;
      case 'acepta': s.objAbierto = 0.95; s.objVel = 1.6; s.objNucleo = CIAN; s.onda = ahora; s.ondaCol = '0,242,207'; s.escaneo = -1; break;
      case 'rechaza': s.objAbierto = 0.04; s.objVel = 0.6; s.objNucleo = ROJO; s.temblor = ahora; s.escaneo = -1; break;
      case 'transmite': s.objAbierto = 0.55; s.objVel = 6; s.objNucleo = BLANCO; s.progreso = 0; break;
      case 'contacto': s.objAbierto = 1; s.objVel = 2.2; s.objNucleo = CIAN; s.onda = ahora; s.ondaCol = '0,242,207'; s.objSepara = 1; s.destello = ahora; s.progreso = -1; break;
      case 'falla': s.objAbierto = 0.02; s.objVel = 0.5; s.objNucleo = ROJO; s.temblor = ahora; s.progreso = -1; break;
    }
  }
  function actualizar(s, dt, ahora, reducido) {
    const k = reducido ? 1 : 1 - Math.pow(0.0008, dt);
    s.abierto = lerp(s.abierto, s.objAbierto, s.estado === 'rechaza' || s.estado === 'falla' ? Math.min(1, k * 2.4) : k);
    s.vel = lerp(s.vel, s.objVel, 1 - Math.pow(0.05, dt));
    s.separa = lerp(s.separa, s.objSepara, 1 - Math.pow(0.01, dt));
    for (let i = 0; i < 3; i++) s.nucleo[i] = lerp(s.nucleo[i], s.objNucleo[i], 1 - Math.pow(0.004, dt));
    s.giro += dt * 0.12 * s.vel * (reducido ? 0.3 : 1);
    if (s.escaneo >= 0) s.escaneo = Math.min(1, (ahora - s.t0) / 700);
  }
  // dibujo: ctx ya escalado a píxeles CSS; cx, cy centro; R radio exterior; pulso 0..1 (latido musical)
  function dibujar(c, s, cx, cy, R, ahora, pulso, reducido, simple) {
    const ab = s.abierto;
    let sx = 0;
    if (!reducido && s.temblor && ahora - s.temblor < 150) sx = Math.sin((ahora - s.temblor) * 0.25) * 2;
    c.save(); c.translate(cx + sx, cy);
    // halo
    const nc = s.nucleo.map(v => v | 0).join(',');
    const halo = c.createRadialGradient(0, 0, R * 0.1, 0, 0, R * 1.6);
    halo.addColorStop(0, 'rgba(' + nc + ',' + (0.16 + pulso * 0.08) + ')');
    halo.addColorStop(1, 'rgba(' + nc + ',0)');
    c.fillStyle = halo; c.beginPath(); c.arc(0, 0, R * 1.6, 0, TAU); c.fill();
    // onda expansiva
    if (s.onda > 0) {
      const tt = (ahora - s.onda) / (reducido ? 300 : 600);
      if (tt < 1) {
        c.strokeStyle = 'rgba(' + s.ondaCol + ',' + (1 - tt) * 0.8 + ')'; c.lineWidth = 2 + 4 * (1 - tt);
        c.beginPath(); c.arc(0, 0, R * (0.6 + tt * 0.9), 0, TAU); c.stroke();
      }
    }
    const sep = s.separa;
    // anillo exterior: dial con marcas
    c.save(); c.rotate(s.giro * 0.6);
    const r1 = R * (0.98 + sep * 0.14);
    c.strokeStyle = 'rgba(245,240,255,.55)'; c.lineWidth = Math.max(1, R * 0.012);
    c.beginPath(); c.arc(0, 0, r1, 0, TAU); c.stroke();
    if (!simple) {
      for (let i = 0; i < 60; i++) {
        const a = i / 60 * TAU, largo = i % 5 === 0 ? R * 0.07 : R * 0.035;
        c.strokeStyle = i % 15 === 0 ? 'rgba(0,242,207,.9)' : 'rgba(245,240,255,' + (i % 5 === 0 ? .5 : .22) + ')';
        c.lineWidth = i % 5 === 0 ? Math.max(1, R * 0.014) : Math.max(.6, R * 0.008);
        c.beginPath(); c.moveTo(Math.cos(a) * (r1 - largo), Math.sin(a) * (r1 - largo)); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke();
      }
    }
    c.restore();
    // anillo medio: segmentos
    c.save(); c.rotate(-s.giro * 1.1);
    const r2 = R * (0.8 + sep * 0.1);
    c.lineWidth = Math.max(1.2, R * 0.022);
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = i === 0 ? 'rgba(119,0,244,.95)' : 'rgba(181,168,216,.45)';
      c.beginPath(); c.arc(0, 0, r2, i * TAU / 3 + 0.12, (i + 1) * TAU / 3 - 0.12); c.stroke();
    }
    c.restore();
    // anillo interior fino con puntos
    c.save(); c.rotate(s.giro * 1.9);
    const r3 = R * (0.66 + sep * 0.06);
    c.strokeStyle = 'rgba(0,242,207,.35)'; c.lineWidth = Math.max(.8, R * 0.008);
    c.beginPath(); c.arc(0, 0, r3, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(0,242,207,.9)';
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.arc(Math.cos(a) * r3, Math.sin(a) * r3, Math.max(1.2, R * 0.018), 0, TAU); c.fill(); }
    c.restore();
    // progreso de verificación
    if (s.progreso >= 0) {
      c.strokeStyle = 'rgba(0,242,207,.95)'; c.lineWidth = Math.max(2, R * 0.03); c.lineCap = 'round';
      c.beginPath(); c.arc(0, 0, R * 1.08, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0.02, s.progreso)); c.stroke(); c.lineCap = 'butt';
    }
    // iris de seis láminas
    const ri = R * 0.56, hueco = ri * (0.12 + ab * 0.62);
    // núcleo detrás del iris
    const nr = hueco * (0.92 + pulso * 0.1) + ri * 0.08;
    const ng = c.createRadialGradient(0, 0, 0, 0, 0, nr * 1.4);
    ng.addColorStop(0, 'rgba(255,255,255,.95)'); ng.addColorStop(0.35, 'rgba(' + nc + ',.95)'); ng.addColorStop(1, 'rgba(' + nc + ',0)');
    c.fillStyle = ng; c.beginPath(); c.arc(0, 0, nr * 1.4, 0, TAU); c.fill();
    c.save(); c.rotate(-s.giro * 0.35 + ab * 0.9);
    for (let i = 0; i < 6; i++) {
      c.save(); c.rotate(i * TAU / 6);
      const g = c.createLinearGradient(0, -ri, 0, 0);
      g.addColorStop(0, '#2a1a52'); g.addColorStop(1, '#130a2c');
      c.fillStyle = g; c.strokeStyle = 'rgba(181,168,216,.5)'; c.lineWidth = Math.max(.6, R * 0.008);
      c.beginPath();
      const a0 = -TAU / 12 - 0.02, a1 = TAU / 12 + 0.32;
      c.moveTo(Math.cos(a0 - Math.PI / 2) * ri, Math.sin(a0 - Math.PI / 2) * ri);
      c.arc(0, 0, ri, a0 - Math.PI / 2, a1 - Math.PI / 2);
      c.lineTo(Math.cos(a1 - Math.PI / 2 - 0.9) * hueco, Math.sin(a1 - Math.PI / 2 - 0.9) * hueco);
      c.lineTo(Math.cos(a0 - Math.PI / 2 - 0.9) * hueco, Math.sin(a0 - Math.PI / 2 - 0.9) * hueco);
      c.closePath(); c.fill(); c.stroke();
      c.restore();
    }
    c.restore();
    c.strokeStyle = 'rgba(245,240,255,.7)'; c.lineWidth = Math.max(1, R * 0.016);
    c.beginPath(); c.arc(0, 0, ri, 0, TAU); c.stroke();
    // línea de escaneo
    if (s.escaneo >= 0 && s.escaneo < 1) {
      const y = lerp(-ri, ri, s.escaneo);
      const w = Math.sqrt(Math.max(0, ri * ri - y * y));
      c.strokeStyle = 'rgba(0,242,207,.9)'; c.lineWidth = Math.max(1.5, R * 0.02);
      c.beginPath(); c.moveTo(-w - R * 0.25, y); c.lineTo(w + R * 0.25, y); c.stroke();
    }
    // destello de contacto
    if (s.destello && ahora - s.destello < 700 && !reducido) {
      const tt = (ahora - s.destello) / 700;
      c.fillStyle = 'rgba(200,255,248,' + (1 - tt) * 0.55 + ')';
      c.beginPath(); c.arc(0, 0, R * (0.4 + tt * 1.4), 0, TAU); c.fill();
    }
    c.restore();
  }

  // ---------- cielo ----------
  function crearCielo(n, semilla) {
    const rnd = G.Verif.mulberry32(semilla || 9);
    const e = [];
    for (let i = 0; i < n; i++) e.push({ x: rnd(), y: rnd(), z: 0.2 + rnd() * 0.8, f: rnd() * TAU, r: rnd() });
    return e;
  }
  function dibujarCielo(c, est, w, h, t, px, py) {
    for (const s of est) {
      const x = ((s.x + px * s.z * 0.02) % 1 + 1) % 1 * w, y = ((s.y + py * s.z * 0.02) % 1 + 1) % 1 * h;
      const a = 0.18 + 0.5 * s.z * (0.6 + 0.4 * Math.sin(t * 0.0008 + s.f));
      c.fillStyle = s.r > 0.93 ? 'rgba(0,242,207,' + a + ')' : s.r > 0.86 ? 'rgba(181,140,255,' + a + ')' : 'rgba(245,240,255,' + a + ')';
      const r = s.z * 1.3;
      c.fillRect(x - r / 2, y - r / 2, r, r);
    }
  }

  // ---------- astronauta oficial (copiado tal cual de _shared/astronauta/astronauta-oficial.js) ----------
  let TS = 60;
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
  function astronauta(c, cx, cy, tamano, f, tm, hop) { TS = tamano; drawAstro(c, cx, cy, f, 0, 0, 0, tm, hop || 0); }

  // ---------- lienzo con devicePixelRatio ----------
  function ajustarLienzo(cv) {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c, w: r.width, h: r.height };
  }

  G.Sonda = { crearSonda, poner, actualizar, dibujar, crearCielo, dibujarCielo, astronauta, ajustarLienzo, ease };
})(typeof globalThis !== 'undefined' ? globalThis : this);
