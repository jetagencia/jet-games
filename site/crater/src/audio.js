/* JET//Cráter · música y efectos originales, sintetizados con Web Audio (sin samples).
   Compositor: agente 3 de 5 (2026-10-22). Todo en Re lidio (D E F# G# A B C#): la cuarta
   aumentada (G#) da el aire ingrávido que no usa ningún otro juego del sitio.

   Temas
   · «Mar de la Tranquilidad» (menú, 76 BPM): Intro 8 · A 16 · A' 16 · B 16 · Puente 8 · Vuelta 16
     = 80 compases ≈ 253 s antes de repetirse, y cada vuelta cambia voicings, octavas y adornos.
   · «Siete descensos» (rondas, 84 BPM): 32 compases A/A'/B/Vuelta ≈ 91 s, cuatro capas que se
     suman con la ronda (1-2, 3-4, 5-6, 7) con fundidos; variación por vuelta (≥ 183 s distintos).
   · «El polvo se asienta» (revelación, 66 BPM): 16 compases ≈ 58 s; cada ronda revelada suma una
     nota al acorde Dmaj13#11 y el final florece brillante (sincronía ≥ 5/7) o suspendido y cálido.
   Instrumentos: pad de sierras desafinadas en estéreo, campanas FM 1:3,5, vidrio soplado (B),
   bajo senoidal con armónico para altavoces de teléfono, arpegio pulsado, pulso y hi-hat suaves,
   textura de radio (ruido rosa filtrado, chasquidos y señal en morse), reverb por convolución
   generada (4,5 s música / 1,8 s efectos) y eco ping-pong.
   Mezcla: bus de música ≈ 7 dB por debajo del de efectos, ducking breve en los efectos grandes,
   compresor-limitador (−6 dB, 12:1) + saturación suave de seguridad.
   API estable usada por ui.js: AU.init/musica/ponerCapa/anticipar/respirar/sfx/prefs/suspend/resume/estado,
   y nuevas: AU.velo(on) (música apagada bajo la pausa), AU.revelaPaso(k), AU.revelaFin(brillo),
   AU.medir() (nivel en vivo, para pruebas), AU.render(nombre, segundos, opciones) (WAV offline). */
(function(G){
'use strict';
const AU={listo:false,cancion:null,capa:1,version:'crater-audio-3'};
let ac=null,N=null,seq=null,timer=null;
let P={mOn:true,sOn:true,mVol:.6,sVol:.85};
const STATS={saltos:0,margenMin:9,pasos:0};AU.stats=STATS;
const ESC=[0,2,4,6,7,9,11];                                   // Re lidio, semitonos desde D
const fq=m=>440*Math.pow(2,(m-69)/12);
const grado=(g,oct)=>{const o=Math.floor(g/7),i=((g%7)+7)%7;return 62+12*((oct||0)+o)+ESC[i];}; // g=0 → D4
function mulberry(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let R=mulberry(20261022);
let OFF={};
// modo ligero para teléfonos modestos (≤4 núcleos o ≤2 GB): pad de una capa, arpegio en corcheas, sin octava doble
const LIGERO=/[?&]audio=ligero/.test(location.search)||(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=2;AU.ligero=LIGERO;                                                    // solo para perfilar en el render: instrumentos apagados                                    // variación determinista (reproducible en el render)

/* =====================================================================
   GRAFO
   ===================================================================== */
function impulso(ctx,seg,brillo,semilla){
 const sr=ctx.sampleRate,L=Math.floor(sr*seg),b=ctx.createBuffer(2,L,sr),r=mulberry(semilla);
 for(let c=0;c<2;c++){const d=b.getChannelData(c);let lp=0;
  for(let i=0;i<L;i++){const k=i/L,co=brillo*Math.pow(1-k,1.4)+.015;lp+=((r()*2-1)-lp)*co;
   let v=lp*Math.pow(1-k,2.2);if(i<sr*.015)v*=i/(sr*.015);d[i]=v;}
  for(let j=0;j<9;j++){const p=Math.floor(sr*(.007+r()*.075));if(p<L)d[p]+=(r()<.5?-1:1)*(.45-j*.04);}  // primeras reflexiones
 }
 return b;}
function grafo(ctx){
 const n={},g=v=>{const x=ctx.createGain();x.gain.value=v;return x;};
 n.lim=ctx.createDynamicsCompressor();n.lim.threshold.value=-6;n.lim.ratio.value=12;n.lim.knee.value=5;n.lim.attack.value=.003;n.lim.release.value=.2;
 n.clip=ctx.createWaveShaper();{const K=2048,cu=new Float32Array(K);for(let i=0;i<K;i++){const x=i/(K-1)*2-1,a=Math.abs(x);cu[i]=a<.8?x:Math.sign(x)*(.8+.2*Math.tanh((a-.8)/.2));}n.clip.curve=cu;}
 n.out=g(.95);n.master=g(1);n.master.connect(n.lim);n.lim.connect(n.clip);n.clip.connect(n.out);n.out.connect(ctx.destination);
 if(ctx.createAnalyser){n.ana=ctx.createAnalyser();n.ana.fftSize=2048;n.out.connect(n.ana);}
 // música: suma → filtro de pausa → ducking → fader
 n.mSum=g(1);n.mF=ctx.createBiquadFilter();n.mF.type='lowpass';n.mF.frequency.value=19000;n.mF.Q.value=.5;n.duck=g(1);n.mFad=g(0);
 n.mSum.connect(n.mF);n.mF.connect(n.duck);n.duck.connect(n.mFad);n.mFad.connect(n.master);
 n.mWet=g(1);n.mRev=ctx.createConvolver();n.mRev.buffer=impulso(ctx,4.5,.5,7);const mrv=g(.62);n.mWet.connect(n.mRev);n.mRev.connect(mrv);mrv.connect(n.mSum);
 // eco ping-pong con realimentación oscurecida
 n.mEco=g(1);n.dl=ctx.createDelay(3);n.dr=ctx.createDelay(3);const fb=g(.34),lp=ctx.createBiquadFilter(),hp=ctx.createBiquadFilter();
 lp.type='lowpass';lp.frequency.value=3200;hp.type='highpass';hp.frequency.value=260;n.dl.delayTime.value=1.18;n.dr.delayTime.value=1.18;
 const pl=pan(ctx,-.75),pr=pan(ctx,.75),eo=g(.5);n.mEco.connect(hp);hp.connect(n.dl);n.dl.connect(pl);pl.connect(eo);n.dl.connect(n.dr);n.dr.connect(pr);pr.connect(eo);
 n.dr.connect(lp);lp.connect(fb);fb.connect(n.dl);eo.connect(n.mSum);const es=g(.25);eo.connect(es);es.connect(n.mWet);
 // efectos
 n.sSum=g(1);n.sFad=g(0);n.sSum.connect(n.sFad);n.sFad.connect(n.master);
 n.sWet=g(1);n.sRev=ctx.createConvolver();n.sRev.buffer=impulso(ctx,1.8,.65,11);const srv=g(.5);n.sWet.connect(n.sRev);n.sRev.connect(srv);srv.connect(n.sSum);
 n.S={dry:n.sSum,wet:n.sWet,eco:null};
 // ruido rosado (Paul Kellet) compartido
 const L=ctx.sampleRate*2,nb=ctx.createBuffer(1,L,ctx.sampleRate),d=nb.getChannelData(0),r=mulberry(99);let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
 for(let i=0;i<L;i++){const w=r()*2-1;b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;d[i]=(b0+b1+b2+b3+b4+b5+w*.5362)*.11;}
 n.rosa=nb;
 const wb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),wd=wb.getChannelData(0);for(let i=0;i<wd.length;i++)wd[i]=r()*2-1;n.blanco=wb;
 return n;}
function pan(ctx,v){if(!ctx.createStereoPanner){const x=ctx.createGain();return x;}const p=ctx.createStereoPanner();p.pan.value=v;return p;}
function aplicar(t0){if(!ac||!N)return;const t=t0!=null?t0:ac.currentTime;
 N.mFad.gain.setTargetAtTime(P.mOn?P.mVol*P.mVol*1.5:0,t,.08);   // curva cuadrática del deslizador; ≈ −7 dB bajo los efectos
 N.sFad.gain.setTargetAtTime(P.sOn?P.sVol*P.sVol*1.25:0,t,.05);}
const musicaAudible=()=>P.mOn&&P.mVol>.01;

/* =====================================================================
   INSTRUMENTOS (todos reciben el destino {dry, wet, eco} y el instante t)
   ===================================================================== */
// entradas premezcladas por destino (panorama y envíos cuantizados): cada voz solo crea su oscilador y su
// envolvente; los paneos y envíos se comparten. Así el teléfono procesa pocas decenas de nodos, no cientos.
function entrada(D,wet,eco,pn){
 const q=x=>Math.round((x||0)*20)/20;wet=D.wet?q(wet):0;eco=D.eco?q(eco):0;pn=Math.max(-.6,Math.min(.6,Math.round((pn||0)/.3)*.3));
 const k=wet+'|'+eco+'|'+pn;if(!D.cache)D.cache=new Map();let e=D.cache.get(k);if(e)return e;
 e=ac.createGain();let o=e;if(pn){const p=pan(ac,pn);e.connect(p);o=p;}
 o.connect(D.dry);
 if(wet){const s=ac.createGain();s.gain.value=wet;o.connect(s);s.connect(D.wet);}
 if(eco){const s=ac.createGain();s.gain.value=eco;o.connect(s);s.connect(D.eco);}
 D.cache.set(k,e);return e;}
function salida(src,D,wet,eco,pn){src.connect(entrada(D,wet,eco,pn));}
function osc(tipo,f,t,fin,det){const o=ac.createOscillator();o.type=tipo;o.frequency.value=f;if(det)o.detune.value=det;o.start(t);o.stop(fin);return o;}
// pad de dos capas de sierras desafinadas (±7 cents), una a cada lado, con filtro que respira
function pad(D,notas,t,dur,corte,vol,wet){if(OFF.pad)return;
 const g=ac.createGain(),at=Math.min(1.6,dur*.35),fin=t+dur+2.2;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+at);g.gain.setTargetAtTime(vol*.82,t+at,1.2);g.gain.setTargetAtTime(0,t+dur,.55);
 const lfo=osc('sine',.07+R()*.06,t,fin),lg=ac.createGain();lg.gain.value=corte*.28;lfo.connect(lg);
 (LIGERO?[0]:[-1,1]).forEach(lado=>{
  const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=corte*(lado<0?1:1.08);f.Q.value=.7;lg.connect(f.frequency);
  notas.forEach(m=>osc('sawtooth',fq(m),t,fin,lado*7+(R()-.5)*3).connect(f));
  const p=pan(ac,lado*.55);f.connect(p);p.connect(g);
 });
 salida(g,D,wet==null?.55:wet,0);
}
// campana FM: portadora:moduladora 1:3,5, índice que cae (ataque metálico → cuerpo de vidrio)
function campana(D,m,t,vol,dec,o){if(OFF.campana)return;o=o||{};
 const f=fq(m),fin=t+dec+.05,c=osc('sine',f,t,fin,(R()-.5)*4),mo=osc('sine',f*(o.ratio||3.5),t,fin),mg=ac.createGain(),g=ac.createGain();
 const idx=o.idx==null?2:o.idx;mg.gain.setValueAtTime(f*idx,t);mg.gain.exponentialRampToValueAtTime(Math.max(.01,f*idx*.04),t+dec*.55);
 mo.connect(mg);mg.connect(c.frequency);c.connect(g);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+dec);
 salida(g,D,o.wet==null?.5:o.wet,o.eco||0,o.pan==null?Math.max(-.6,Math.min(.6,(m-72)/30)):o.pan);
}
// vidrio soplado: dos triángulos que baten + seno en la octava, ataque lento (voz de la sección B)
function vidrio(D,m,t,dur,vol,o){if(OFF.vidrio)return;o=o||{};const f=fq(m),fin=t+dur+1.4;
 const flt=ac.createBiquadFilter();flt.type='lowpass';flt.frequency.value=2600;flt.Q.value=.4;
 osc('triangle',f,t,fin,-5).connect(flt);osc('triangle',f,t,fin,5).connect(flt);
 const s=osc('sine',f*2,t,fin,3),sg=ac.createGain();sg.gain.value=.28;s.connect(sg);sg.connect(flt);
 const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.22);g.gain.setTargetAtTime(vol*.75,t+.22,.6);g.gain.setTargetAtTime(0,t+dur,.32);
 flt.connect(g);salida(g,D,o.wet==null?.6:o.wet,o.eco==null?.18:o.eco,o.pan||0);
}
// bajo: seno + armónico (triángulo una octava arriba) para que se oiga en altavoces chicos
function bajo(D,m,t,dur,vol){if(OFF.bajo)return;const f=fq(m),fin=t+dur+.7;
 const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.035);g.gain.setTargetAtTime(vol*.7,t+.04,.5);g.gain.setTargetAtTime(0,t+dur,.18);
 osc('sine',f,t,fin).connect(g);
 const h=osc('triangle',f*2,t,fin),hg=ac.createGain(),hf=ac.createBiquadFilter();hf.type='lowpass';hf.frequency.value=900;hg.gain.value=.3;h.connect(hf);hf.connect(hg);hg.connect(g);
 salida(g,D,.06,0);
}
// arpegio pulsado: triángulo con filtro que se cierra
function pulsado(D,m,t,vol,pn){if(OFF.pulsado)return;const f=fq(m),fin=t+.4,o=osc('triangle',f,t,fin),fl=ac.createBiquadFilter(),g=ac.createGain();
 fl.type='lowpass';fl.Q.value=2;fl.frequency.setValueAtTime(3200,t);fl.frequency.exponentialRampToValueAtTime(650,t+.22);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+.34);
 o.connect(fl);fl.connect(g);salida(g,D,.3,.35,pn);}
// pulso grave suave (corazón, no bombo)
function latido(D,t,vol){if(OFF.latido)return;const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(128,t);o.frequency.exponentialRampToValueAtTime(46,t+.14);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g);o.start(t);o.stop(t+.32);salida(g,D,.05,0);}
// ruido filtrado genérico
function soplo(D,t,dur,f0,f1,q,vol,tipo,o){o=o||{};const s=ac.createBufferSource();s.buffer=o.blanco?N.blanco:N.rosa;s.loop=true;
 const f=ac.createBiquadFilter();f.type=tipo||'bandpass';f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
 const g=ac.createGain(),at=o.at||Math.min(.04,dur*.2);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+at);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 s.connect(f);f.connect(g);s.start(t,R()*1.5);s.stop(t+dur+.05);salida(g,D,o.wet==null?.25:o.wet,o.eco||0,o.pan||0);return g;}
function hat(D,t,vol,pn){soplo(D,t,.045,9000,7600,.8,vol,'highpass',{blanco:1,wet:.12,pan:pn});}
// textura de radio: siseo de banda angosta con aleteo, chasquidos aislados
function radio(D,t,dur,vol){if(OFF.radio)return;const s=ac.createBufferSource();s.buffer=N.rosa;s.loop=true;
 const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=2500;f.Q.value=2.2;
 const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+2);g.gain.setValueAtTime(vol,t+dur-2.5);g.gain.linearRampToValueAtTime(0,t+dur);
 const am=ac.createGain();am.gain.value=.6;const lfo=osc('sine',.23,t,t+dur+.1),lg=ac.createGain();lg.gain.value=.4;lfo.connect(lg);lg.connect(am.gain);
 s.connect(f);f.connect(am);am.connect(g);s.start(t,R());s.stop(t+dur+.1);salida(g,D,.4,0,-.2);
 const k=Math.floor(dur*1.3);for(let i=0;i<k;i++){const tc=t+1+R()*(dur-2);soplo(D,tc,.012+R()*.02,1400+R()*2600,1200,1.5,vol*(2+R()*3),'bandpass',{blanco:1,wet:.3,pan:R()*1.2-.6});}
}
// señal perdida: morse suave en Re agudo
function senal(D,t,vol){if(OFF.senal)return;const pat=[1,1,3,1,3],u=.085;let x=t;const m=grado(14,0);
 pat.forEach(l=>{const o=osc('sine',fq(m),x,x+l*u+.03),g=ac.createGain();g.gain.setValueAtTime(0,x);g.gain.linearRampToValueAtTime(vol,x+.006);g.gain.setValueAtTime(vol,x+l*u);g.gain.linearRampToValueAtTime(0,x+l*u+.02);o.connect(g);salida(g,D,.5,.6,.35);x+=l*u+u;});}

/* =====================================================================
   ARMONÍA Y MELODÍAS
   ===================================================================== */
// voicings como grados (0 = D); b = raíz del bajo
const CH={
 I:{v:[0,4,6,9],b:0},          // Dmaj7 (D A C# F#)
 I2:{v:[0,4,6,8,10],b:0},      // Dmaj9#11 (D A C# E G#)
 II:{v:[1,5,8,10],b:1},        // E (E B E G#): el acorde del lidio
 'II/D':{v:[1,5,8,10],b:0},    // E sobre pedal de D
 vi:{v:[-2,2,4,7],b:-2},       // Bm7 (B F# A D)
 iii:{v:[2,6,8,11],b:2},       // F#m7
 V:{v:[4,8,10,13],b:4},        // Amaj7
 g:{v:[3,7,9,12],b:3},         // G#ø7 (G# D F# B)
 vii:{v:[-1,3,5,8],b:-1}       // C#m7
};
const rep=(a,k)=>a.reduce((x,c)=>x.concat(Array(k).fill(c)),[]);
// melodía por compás: "grado.duración" en semicorcheas, "r.n" silencio
const M=s=>s.map(b=>{let p=0;return b.split(' ').map(tk=>{const [a,d]=tk.split('.'),o=a==='r'?null:[p,+a,+d];p+=+d;return o;}).filter(Boolean);});
const MEL={
 MA:M(['0.6 2.2 3.4 4.4','5.8 4.4 2.4','1.6 3.2 5.4 6.4','4.12 r.4','2.6 0.2 -1.4 0.4','-2.8 r.8','1.4 3.4 5.4 7.4','6.12 r.4',
       '0.6 2.2 3.4 4.4','7.8 6.4 4.4','8.6 7.2 5.4 3.4','1.12 r.4','2.4 4.4 6.4 9.4','8.8 6.8','4.6 6.2 8.4 11.4','10.12 r.4']),
 MA2:M(['11.6 9.2 8.4 7.4','6.8 7.4 9.4','8.6 5.2 3.4 1.4','3.12 r.4','4.6 2.2 0.4 -2.4','0.8 2.8','1.4 3.4 5.4 8.4','7.12 r.4',
       '11.6 9.2 8.4 7.4','10.8 9.4 7.4','8.6 10.2 12.4 11.4','8.12 r.4','9.6 8.2 6.4 4.4','6.16','4.4 6.4 8.4 10.4','11.12 r.4']),
 MB:M(['2.8 1.4 0.4','-2.12 r.4','-1.4 1.4 3.8','1.12 r.4','4.8 2.4 0.4','2.12 r.4','3.6 2.2 1.4 0.4','-1.12 r.4',
       '5.8 4.4 2.4','4.12 r.4','3.4 5.4 8.8','7.12 r.4','6.8 5.4 3.4','1.12 r.4','2.4 4.4 6.8','4.16']),
 GA:M(['4.4 7.4 8.8','10.6 8.2 5.8','4.4 7.4 8.4 9.4','8.12 r.4','9.6 7.2 4.8','5.4 8.4 10.8','9.6 8.2 6.8','4.12 r.4']),
 GA2:M(['11.4 10.4 8.8','10.4 12.4 8.8','7.6 5.2 4.8','5.4 8.4 10.8','11.6 10.2 9.8','10.4 9.4 7.8','6.4 8.4 9.8','11.12 r.4']),
 GB:M(['r.2 5.2 4.2 2.6 0.4','1.6 3.6 5.4','r.2 5.2 4.2 2.6 4.4','3.8 2.8','r.2 7.2 6.2 4.6 2.4','3.6 5.6 8.4','6.8 8.4 6.4','4.16']),
 GV:M(['4.4 7.4 8.4 11.4','10.8 8.8','9.4 7.4 4.8','8.8 10.8','11.6 12.2 11.4 9.4','10.12 r.4','9.4 8.4 6.8','8.16'])
};
const DEF={
 menu:{bpm:76,eco:1.5,sec:[
  {id:'intro',ch:rep(['I','I2','II/D','I'],2),radio:.010,chispas:1},
  {id:'A',ch:['I','I','II','II','vi','vi','II','II','I','I','II','II','iii','iii','V','V'],mel:'MA'},
  {id:'A2',ch:['I','I','II','II','vi','vi','II','II','I2','I2','II','II','iii','iii','V','V'],mel:'MA2',contra:1},
  {id:'B',ch:['vi','vi','II','II','vi','vi','g','g','vi','vi','II','II','vii','vii','V','V'],mel:'MB',lead:'vidrio',movBajo:1},
  {id:'P',ch:rep(['I','II/D','I2','II/D'],2),radio:.016,filtro:.42,senal:1},
  {id:'V',ch:['I2','I2','II/D','II/D','vi','vi','g','g','I2','I2','II/D','II/D','iii','iii','V','II'],mel:'MA',contra:1,rica:1}]},
 juego:{bpm:84,eco:.75,sec:[
  {id:'A',ch:['I','II','I','II','vi','II','iii','V'],mel:'GA'},
  {id:'A2',ch:['I2','II','vi','II','I2','g','iii','V'],mel:'GA2'},
  {id:'B',ch:['vi','II','vi','g','vi','II','vii','V'],mel:'GB'},
  {id:'V',ch:['I2','II/D','vi','II/D','I2','II/D','iii','II'],mel:'GV'}]},
 revela:{bpm:66,eco:1.5,sec:[
  {id:'R',ch:['I','I','vi','vi','II','II','I2','I2','vi','vi','g','g','II','II','I','I']},
  {id:'coda',ch:['I2','I2','II/D','II/D']}]}
};
DEF.menu.sec.forEach(s=>s.n=s.ch.length);DEF.juego.sec.forEach(s=>s.n=s.ch.length);DEF.revela.sec.forEach(s=>s.n=s.ch.length);
const PILA=[0,4,6,8,9,10,12];      // Dmaj13#11 que se arma ronda a ronda en la revelación
function voicing(C,vuelta,rica){let v=C.v.slice();if(rica&&v.length<5)v.push(v[0]+8);if(vuelta%2===1){const top=v.pop();v.unshift(top-7);}if(vuelta%3===2)v=v.map((x,i)=>i===v.length-1?x+7:x);return v.map(x=>grado(x,-1));}
function corrida(sec,bar){const c=sec.ch[bar];let k=1;while(bar+k<sec.n&&sec.ch[bar+k]===c)k++;return k;}
const cambia=(sec,bar)=>bar===0||sec.ch[bar-1]!==sec.ch[bar];

/* =====================================================================
   CANCIONES
   ===================================================================== */
function bus(dest){const g=v=>{const x=ac.createGain();x.gain.value=v;return x;};const b={dry:g(1),wet:g(1),eco:g(1)};b.dry.connect(dest.dry);b.wet.connect(dest.wet);b.eco.connect(dest.eco);return b;}
function nuevaCancion(nom,t0,secIni){
 const d=DEF[nom],out=bus({dry:N.mSum,wet:N.mWet,eco:N.mEco});
 [out.dry,out.wet,out.eco].forEach(x=>{x.gain.setValueAtTime(0,t0);x.gain.linearRampToValueAtTime(1,t0+1.8);});
 const lay=[1,2,3,4].map(k=>{const b=bus(out);if(k>1)[b.dry,b.wet,b.eco].forEach(x=>x.gain.value=0);return b;});
 // los pads pasan por un estante agudo (anticipación al elegir, apertura en el Gran alunizaje)
 const shelf=ac.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=1100;shelf.gain.value=0;
 const padIn=ac.createGain(),padWet=ac.createGain();padWet.gain.value=.55;padIn.connect(shelf);shelf.connect(lay[0].dry);shelf.connect(padWet);padWet.connect(lay[0].wet);
 const s={nom,d,t:t0,st:0,bar:0,sec:secIni||0,vuelta:0,out,lay,shelf,pad:{dry:padIn,wet:null,eco:null},capa:1,apag:[0,0,0,0],antic:false,k:1,fin:null,finT:0};
 N.dl.delayTime.setTargetAtTime(60/d.bpm*d.eco,t0,.25);N.dr.delayTime.setTargetAtTime(60/d.bpm*d.eco,t0,.25);
 fijarCapa(s,AU.capa,t0);
 return s;}
function fijarCapa(s,n,t){if(s.nom!=='juego')n=1;const prev=s.capa;s.capa=n;
 for(let k=2;k<=4;k++){const on=n>=k;[s.lay[k-1].dry,s.lay[k-1].wet,s.lay[k-1].eco].forEach(x=>x.gain.setTargetAtTime(on?1:0,t,on?.9:.6));if(prev>=k&&!on)s.apag[k-1]=t+4;}
 tonoPad(s,t);}
function tonoPad(s,t){const g=(s.capa>=4?4.5:0)+(s.antic?3:0);s.shelf.gain.setTargetAtTime(g,t,.35);}
const capaViva=(s,k,t)=>s.capa>=k||t<s.apag[k-1];

function paso(s){
 const sec=s.d.sec[s.sec],t=s.t,st=s.st,bar=s.bar,spb=60/s.d.bpm,ss=spb/4,bd=spb*4;
 const C=CH[sec.ch[bar]],L1=s.lay[0];
 if(s.nom==='menu')pasoMenu(s,sec,C,t,st,bar,spb,ss,bd,L1);
 else if(s.nom==='juego')pasoJuego(s,sec,C,t,st,bar,spb,ss,bd,L1);
 else pasoRevela(s,sec,C,t,st,bar,spb,ss,bd,L1);
}
function lead(D,sec,m,t,dur,vol){if(sec.lead==='vidrio')vidrio(D,m,t,dur*.95,vol*1.25);else campana(D,m,t,vol,Math.max(1.4,Math.min(3.4,dur*1.7)),{eco:.32});}

function pasoMenu(s,sec,C,t,st,bar,spb,ss,bd,L1){
 if(st===0&&cambia(sec,bar)){const k=corrida(sec,bar);pad(s.pad,voicing(C,s.vuelta,sec.rica),t,k*bd-.05,900*(sec.filtro||1),.05);}
 // bajo
 if(sec.movBajo){if(st===0)bajo(L1,grado(C.b,-2),t,spb*2-.08,.115);else if(st===8)bajo(L1,grado(C.b+4,-2),t,spb*2-.08,.085);}
 else if(st===0&&(cambia(sec,bar)||sec.id!=='intro'))bajo(L1,grado(C.b,-2),t,(sec.id==='intro'?corrida(sec,bar)*bd:bd)-.08,.1);
 // melodía con variación por vuelta: octava arriba en la segunda mitad, adornos en las notas largas
 const mel=sec.mel&&MEL[sec.mel][bar];
 if(mel)mel.forEach(([p,gr,d])=>{if(p!==st)return;
  const oct=(s.vuelta%3===1&&bar>=8&&sec.lead!=='vidrio')?1:0;
  if(s.vuelta%3===2&&d>=8&&sec.lead!=='vidrio')campana(L1,grado(gr+1,oct),t-ss*.5,.03,.6,{eco:.2});
  lead(L1,sec,grado(gr,oct),t,d*ss,.075);
  if(sec.contra&&d>=6)campana(L1,grado(gr+2,oct+1),t+ss*2,.022,2.2,{eco:.4,idx:1.2});});
 // contracanto sostenido (vidrio) en las secciones de vuelta y A'
 if(sec.contra&&st===0&&bar%2===0)vidrio(L1,grado(C.v[2]+(s.vuelta%2?2:0),0),t,bd*2-.1,.02,{pan:-.4});
 // intro: chispas de campana aleatorias de las notas del acorde
 if(sec.chispas&&(st===4||st===12)&&R()<.4)campana(L1,grado(C.v[Math.floor(R()*C.v.length)],1),t,.026,2.6,{eco:.5,idx:1.4});
 // radio y señal perdida
 if(sec.radio&&bar===0&&st===0)radio(L1,t,sec.n*bd,sec.radio);
 if(sec.senal&&st===4&&bar%2===1)senal(L1,t,.014);
}
function pasoJuego(s,sec,C,t,st,bar,spb,ss,bd,L1){
 const [,L2,L3,L4]=s.lay,v=s.vuelta;
 if(st===0)pad(s.pad,voicing(C,v,0).slice(0,4),t,bd-.05,s.capa>=4?1500:950,.045);
 // capa 1: pulso de bajo en negras + campana cada 2 compases
 if(st%4===0)bajo(L1,grado(C.b,-2),t,ss*3,st===0?.1:.075);
 if(st===14&&bar%4===3)bajo(L1,grado(C.b+4,-2),t,ss*2,.065);
 const mel=MEL[sec.mel][bar];
 if(st===0&&bar%2===0&&mel.length)campana(L1,grado(mel[0][1],0),t,.05,3.2,{eco:.4,idx:1.6});
 // capa 2: arpegio en semicorcheas sobre las notas del acorde
 if(capaViva(s,2,t)&&!(LIGERO&&st%2)){const pats=[[0,1,2,3,2,1,2,3,0,1,2,3,4,3,2,1],[0,2,1,3,2,4,3,1,0,2,1,3,2,4,3,2],[3,2,1,0,1,2,3,4,3,2,1,0,1,2,3,2]];
  const pt=pats[v%3],tones=C.v.concat(C.v[0]+7),gr=tones[pt[st]%tones.length];
  pulsado(L2,grado(gr,0),t,st%4===0?.05:.034,st%2?.35:-.35);}
 // capa 3: hi-hat apagado, latido suave y la melodía
 if(capaViva(s,3,t)){
  if(st%4===2)hat(L3,t,.03,(st%8===2)?.3:-.3);
  if(st===15&&bar%2===1)hat(L3,t,.018,0);
  if(st===0||st===8)latido(L3,t,st===0?.12:.075);
  mel.forEach(([p,gr,d])=>{if(p===st)campana(L3,grado(gr,v%2),t,.07,Math.max(1.2,Math.min(3,d*ss*1.6)),{eco:.3});});
 }
 // capa 4 (Gran alunizaje): sub grave en el 1, melodía en octava alta, contracanto
 if(capaViva(s,4,t)){
  if(st===0)bajo(L4,grado(C.b,-3),t,bd*.9,.11);
  if(!LIGERO)mel.forEach(([p,gr,d])=>{if(p===st)campana(L4,grado(gr,1-(v%2)),t,.035,Math.max(1,Math.min(2.6,d*ss*1.4)),{eco:.45,idx:1.4});});
  if(st===8)campana(L4,grado(C.v[C.v.length-1]+2,0),t,.025,2.4,{eco:.5,idx:1.2,pan:.5});
 }
}
function pasoRevela(s,sec,C,t,st,bar,spb,ss,bd,L1){
 if(sec.id==='coda'&&s.fin==null){s.sec=0;s.bar=0;return;}     // sin final todavía: vuelve al ciclo R
 if(st===0&&cambia(sec,bar)){const k=corrida(sec,bar),dur=k*bd-.05;
  let v=C.v;if(sec.id==='coda')v=s.fin==='brillo'?[0,4,6,8,10,12]:[0,4,8,12];
  pad(s.pad,v.map(x=>grado(x,-1)),t,dur,sec.id==='coda'&&s.fin==='brillo'?1400:650,.04);
  // cuerda grave: sierra filtrada lenta (raíz + quinta)
  [C.b,C.b+4].forEach((gr,i)=>{const o=osc('sawtooth',fq(grado(gr,-2)),t,t+dur+3,i?4:-4),f=ac.createBiquadFilter(),g=ac.createGain();f.type='lowpass';f.frequency.value=360;f.Q.value=.8;
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(i?.045:.065,t+2.2);g.gain.setTargetAtTime(0,t+dur,.8);o.connect(f);f.connect(g);salida(g,L1,.5,0,i?.3:-.3);});
  bajo(L1,grado(C.b,-2),t,dur,.06);
 }
 if(sec.id==='R'){
  const k=Math.max(1,Math.min(7,s.k)),paso16=Math.max(2,Math.floor(16/k));
  for(let i=0;i<k;i++)if(st===i*paso16&&(bar%2===0||i<k-1||k===7))campana(L1,grado(PILA[i],0),t,.045+.004*i,3.4,{eco:.35,idx:1.5,pan:-.5+i/6});
 }else{ // coda: el acorde final florece y se queda respirando
  if(st===0&&bar===0&&!s.flor&&(s.flor=1))(s.fin==='brillo'?[0,4,6,8,10,12,14]:[0,4,8,12]).forEach((gr,i)=>campana(L1,grado(gr,0),t+i*.09,.05,4.5,{eco:.45,idx:1.3}));
  if(st===8&&bar%2===1&&R()<.7)campana(L1,grado((s.fin==='brillo'?[7,9,10,12]:[4,8,11])[Math.floor(R()*3)],1),t,.022,3,{eco:.6,idx:1.1});
 }
}
function avanzar(s){s.t+=60/s.d.bpm/4;s.st++;
 if(s.st>=16){s.st=0;s.bar++;const sec=s.d.sec[s.sec];
  if(s.bar>=sec.n){s.bar=0;s.sec++;
   if(s.nom==='revela'){if(s.sec>=s.d.sec.length)s.sec=s.d.sec.length-1;else if(s.d.sec[s.sec].id==='coda'&&s.fin==null)s.sec=0;}
   else if(s.sec>=s.d.sec.length){s.sec=0;s.vuelta++;}}}}

/* ---------- planificador ---------- */
function programar(){
 if(!ac||!seq||ac.state!=='running')return;
 const ahora=ac.currentTime,hasta=ahora+.45;STATS.margenMin=Math.min(STATS.margenMin,seq.t-ahora);
 if(seq.t<ahora-.04){while(seq.t<ahora+.03){avanzar(seq);STATS.saltos++;}}   // atraso: se salta en silencio, nunca en ráfaga
 while(seq.t<hasta){if(musicaAudible())paso(seq);avanzar(seq);STATS.pasos++;}
}
const POS={};
AU.musica=nom=>{
 if(!ac||!AU.listo)return;if(seq&&seq.nom===nom)return;
 const t=ac.currentTime;
 if(seq){const v=seq;POS[v.nom]={sec:v.sec};[v.out.dry,v.out.wet,v.out.eco].forEach(x=>{x.gain.cancelScheduledValues(t);x.gain.setTargetAtTime(0,t,.55);});
  setTimeout(()=>{try{v.out.dry.disconnect();v.out.wet.disconnect();v.out.eco.disconnect();}catch(e){}},6000);}
 if(!nom){seq=null;AU.cancion=null;return;}
 // al volver a un tema, sigue por la sección siguiente (la música avanza, no se reinicia)
 const d=DEF[nom],p=POS[nom];let si=0;if(p&&nom!=='revela')si=(p.sec+1)%d.sec.length;
 seq=nuevaCancion(nom,t+.06,si);AU.cancion=nom;
 if(!timer)timer=setInterval(programar,40);
 programar();
};
AU.ponerCapa=n=>{AU.capa=Math.max(1,Math.min(4,n|0));if(seq&&ac)fijarCapa(seq,AU.capa,ac.currentTime);};
AU.anticipar=on=>{if(!seq||!ac)return;on=!!on;if(seq.antic===on)return;seq.antic=on;tonoPad(seq,ac.currentTime);};
AU.respirar=()=>{if(!seq||!ac)return;const t=ac.currentTime,bd=60/seq.d.bpm*4,o=seq.out.dry.gain;
 o.cancelScheduledValues(t);o.setValueAtTime(o.value,t);o.setTargetAtTime(.5,t,.08);o.setTargetAtTime(1,t+bd,.45);};
AU.velo=on=>{if(!N||!ac)return;on=!!on;if(N.mF._velo===on)return;N.mF._velo=on;const t=ac.currentTime;N.duck.gain.cancelScheduledValues(t);N.mF.frequency.cancelScheduledValues(t);N.mF.frequency.setTargetAtTime(on?520:19000,t,on?.25:.4);
 N.duck.gain.setTargetAtTime(on?.6:1,t,.3);};
AU.revelaPaso=k=>{if(seq&&seq.nom==='revela'){seq.k=Math.max(1,Math.min(7,k|0));if(seq.fin!=null){seq.fin=null;seq.flor=0;}}};
AU.revelaFin=brillo=>{if(!seq||seq.nom!=='revela'||seq.fin!=null)return;seq.fin=brillo?'brillo':'calido';
 // salta a la coda en el próximo compás
 seq.sec=seq.d.sec.length-1;seq.bar=0;const ss=60/seq.d.bpm/4;while(seq.st!==0){seq.t+=ss;seq.st=(seq.st+1)%16;}};

/* =====================================================================
   EFECTOS (afinados a Re lidio). FX[n](t, a, b)
   ===================================================================== */
const S=()=>N.S;
function tono(t,f0,f1,dur,vol,tipo,D,wet){const o=ac.createOscillator(),g=ac.createGain();o.type=tipo||'sine';o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+dur*.8);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);o.start(t);o.stop(t+dur+.02);salida(g,D||S(),wet==null?.15:wet,0);}
let ultTic=0;
const FX={
 tic:(t,i)=>{if(t-ultTic<.05)return;ultTic=t;campana(S(),grado((i||0)%7,2),t,.03,.18,{ratio:5.1,idx:1,wet:.2});},
 elegir:(t,i,prev)=>{const m=grado(i||0,0);
  if(prev!=null&&prev!==i){tono(t,fq(grado(prev,0)),fq(m),.12,.04,'sine');t+=.05;}
  campana(S(),m,t,.12,1.2,{wet:.3});campana(S(),m+12,t,.03,.5,{ratio:5,idx:1,wet:.2});tono(t,180,90,.06,.06,'sine',S(),0);},
 despegue:(t)=>{soplo(S(),t,.8,1900,170,.9,.2,'lowpass',{at:.06});soplo(S(),t,.7,3600,800,2.2,.05,'bandpass',{wet:.3});tono(t,62,44,.8,.12,'sine');},
 suelo:(t)=>{tono(t,112,42,.42,.5,'sine',S(),.05);tono(t,230,95,.18,.16,'triangle',S(),.05);
  soplo(S(),t,.6,950,220,.6,.17,'lowpass',{wet:.3});soplo(S(),t,.09,3200,1800,1.2,.08,'bandpass',{blanco:1,wet:.1});},
 registrado:(t)=>{campana(S(),grado(0,0),t,.08,1.3,{wet:.45});campana(S(),grado(4,0),t+.13,.08,1.6,{wet:.45});},
 coincide:(t,k)=>{const ns=[0,4,6,9].slice(0,Math.max(1,Math.min(4,k|0)));ns.forEach((g,i)=>campana(S(),grado(g,0),t+i*.075,.06,1.8,{wet:.5}));},
 paso:(t)=>{soplo(S(),t,.34,560,2700,1.6,.08,'bandpass',{wet:.3,pan:-.3});},
 polvo:(t)=>{const s=ac.createBufferSource();s.buffer=N.blanco;s.loop=true;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(5200,t);f.frequency.exponentialRampToValueAtTime(2400,t+1.4);f.Q.value=1.3;
  const g=ac.createGain();g.gain.setValueAtTime(0,t);for(let i=0;i<46;i++){const x=t+Math.pow(R(),1.3)*1.35;g.gain.setValueAtTime(.05+R()*.07,x);g.gain.setTargetAtTime(0,x+.002,.006);}
  s.connect(f);f.connect(g);s.start(t);s.stop(t+1.5);salida(g,S(),.4,0,0);
  soplo(S(),t,1.4,4200,1300,2.5,.035,'bandpass',{wet:.4});
  for(let i=0;i<5;i++)campana(S(),grado(7+Math.floor(R()*7),1),t+.15+R()*1.1,.012,.5,{ratio:7.1,idx:1,wet:.5});},
 gota:(t)=>{campana(S(),grado(7+Math.floor(R()*7),1),t,.009,.2,{ratio:6.3,idx:1,wet:.4});},
 corona:(t)=>{[0,2,4,6,8].forEach((g,i)=>campana(S(),grado(g,0),t+i*.055,.065,1.4,{wet:.5}));},
 sincronia:(t)=>{[0,2,4,6,8].forEach((g,i)=>campana(S(),grado(g,0),t+i*.055,.065,1.4,{wet:.5}));
  campana(S(),grado(7,1),t+.32,.085,2.6,{wet:.6});campana(S(),grado(11,1),t+.36,.045,2.6,{wet:.6});soplo(S(),t+.3,1.2,7000,11000,3,.025,'bandpass',{wet:.5});},
 cuenta:(t)=>{campana(S(),grado(-3,0),t,.1,2.8,{ratio:2,idx:1.1,wet:.55});campana(S(),grado(0,-1),t+.02,.05,2.4,{ratio:2,idx:.8,wet:.55});},
 dia:(t)=>{[0,4,6,8,10,13].forEach((g,i)=>campana(S(),grado(g,0),t+i*.09,.065,2.4,{wet:.6}));campana(S(),grado(14,0),t+.6,.04,2.4,{wet:.7});},
 tarjeta:(t)=>{campana(S(),grado(4,1),t,.08,1.6,{wet:.5});campana(S(),grado(4,1),t+.16,.07,1.6,{wet:.5});soplo(S(),t+.1,.6,6000,9500,4,.03,'bandpass',{wet:.5});},
 racha:(t)=>{[0,2,4].forEach((g,i)=>campana(S(),grado(g,1),t+i*.11,.065,.7,{wet:.4}));},
 medianoche:(t)=>{[0,.55,1.1].forEach((d,i)=>campana(S(),grado(0,-1),t+d,.09*Math.pow(.45,i),3.5,{ratio:1.4,idx:1.2,wet:.8}));campana(S(),grado(4,0),t+.5,.035,3,{wet:.8});},
 ui:(t)=>{tono(t,fq(grado(4,1)),fq(grado(4,1)),.06,.045,'sine',S(),.1);soplo(S(),t,.02,4000,3500,1,.02,'bandpass',{blanco:1,wet:0});},
 on:(t)=>{campana(S(),grado(0,1),t,.05,.32,{ratio:4,idx:1,wet:.2});campana(S(),grado(4,1),t+.06,.05,.32,{ratio:4,idx:1,wet:.2});},
 off:(t)=>{campana(S(),grado(4,1),t,.05,.32,{ratio:4,idx:1,wet:.2});campana(S(),grado(0,1),t+.06,.05,.32,{ratio:4,idx:1,wet:.2});},
 copiado:(t)=>{campana(S(),grado(9,1),t,.05,.35,{ratio:5,idx:1,wet:.3});campana(S(),grado(11,1),t+.07,.05,.35,{ratio:5,idx:1,wet:.3});},
 borrar:(t)=>{tono(t,fq(grado(4,0)),fq(grado(0,-1)),.7,.08,'triangle',S(),.4);}
};
const DUCK={suelo:.55,sincronia:.6,dia:.55,corona:.75,cuenta:.75,tarjeta:.75,medianoche:.7,despegue:.7};
function duck(t,k){if(!N)return;const g=N.duck.gain;g.cancelScheduledValues(t);g.setTargetAtTime(k,t,.03);g.setTargetAtTime(1,t+.45,.35);}
AU.sfx=(nom,a,b)=>{if(!ac||!AU.listo||ac.state!=='running'||!P.sOn)return;const f=FX[nom];if(!f)return;
 const t=ac.currentTime+.005;try{f(t,a,b);if(DUCK[nom]&&!N.mF._velo)duck(t,DUCK[nom]);}catch(e){}};

/* =====================================================================
   CICLO DE VIDA
   ===================================================================== */
function crear(){
 const C=G.AudioContext||G.webkitAudioContext;if(!C)return false;
 try{ac=new C({latencyHint:'interactive'});}catch(e){try{ac=new C();}catch(e2){return false;}}
 N=grafo(ac);aplicar();return true;}
AU.prefs=p=>{Object.assign(P,p);aplicar();
 if(ac&&AU.listo){if(!P.mOn&&!P.sOn)AU.suspend();else AU.resume();}};
AU.init=()=>{if(!ac&&!crear())return;AU.resume();AU.listo=true;};
AU.suspend=()=>{if(ac&&ac.state==='running')ac.suspend().catch(()=>{});};
AU.resume=()=>{if(!ac||ac.state==='closed'||ac.state==='running'||document.hidden)return;if(!P.mOn&&!P.sOn&&AU.listo)return;ac.resume().catch(()=>{});};
AU.estado=()=>ac?ac.state:'sin';
G.addEventListener('pageshow',()=>{if(AU.listo)AU.resume();});
// medidor en vivo (para pruebas automáticas): pico y RMS de la salida final
AU.medir=()=>{if(!N||!N.ana)return null;const a=new Float32Array(N.ana.fftSize);N.ana.getFloatTimeDomainData(a);let pk=0,s=0;for(const v of a){const x=Math.abs(v);if(x>pk)pk=x;s+=v*v;}
 return {pico:pk,rms:Math.sqrt(s/a.length),estado:ac.state,margen:seq?seq.t-ac.currentTime:null,cancion:AU.cancion,capa:AU.capa,seccion:seq?seq.d.sec[seq.sec].id:null,velo:!!N.mF._velo,ligero:LIGERO};};

/* ---------- render offline (muestras WAV para escuchar fuera del juego) ----------
   o = {mVol, sVol, sec (sección inicial), capas:[[t,n]], sfx:[[t,nombre,a,b]], revela:[[t,k]], fin:[t,brillo], velo:[[t,on]]} */
AU.render=async(nom,seg,o)=>{o=o||{};
 const OC=G.OfflineAudioContext||G.webkitOfflineAudioContext,sr=44100,oc=new OC(2,Math.ceil(sr*seg),sr);
 // estado propio del render; se intercambia con el del juego solo durante cada bloque síncrono
 const X={ac:oc,N:null,seq:null,P:{mOn:!!nom,sOn:true,mVol:o.mVol==null?.6:o.mVol,sVol:o.sVol==null?.85:o.sVol},capa:1,R:mulberry(o.semilla||20261022),ultTic:-1,OFF:o.off||{}};
 const dentro=fn=>{const sv={ac,N,seq,P,capa:AU.capa,R,ultTic,OFF};ac=X.ac;N=X.N;seq=X.seq;P=X.P;AU.capa=X.capa;R=X.R;ultTic=X.ultTic;OFF=X.OFF;
  try{fn();}finally{X.N=N;X.seq=seq;X.capa=AU.capa;X.R=R;X.ultTic=ultTic;ac=sv.ac;N=sv.N;seq=sv.seq;P=sv.P;AU.capa=sv.capa;R=sv.R;ultTic=sv.ultTic;OFF=sv.OFF;}};
 const ev=[];
 (o.capas||[]).forEach(([t,n])=>ev.push({t,f:()=>{AU.capa=n;if(seq)fijarCapa(seq,n,Math.max(t,ac.currentTime));}}));
 (o.revela||[]).forEach(([t,k])=>ev.push({t,f:()=>{if(seq)seq.k=k;}}));
 if(o.fin)ev.push({t:o.fin[0],f:()=>{if(seq&&seq.fin==null){seq.fin=o.fin[1]?'brillo':'calido';seq.sec=seq.d.sec.length-1;seq.bar=0;const ss=60/seq.d.bpm/4;while(seq.st!==0){seq.t+=ss;seq.st=(seq.st+1)%16;}}}});
 (o.sfx||[]).forEach(([t,n,a,b])=>ev.push({t,f:()=>{FX[n](t,a,b);if(DUCK[n])duck(t,DUCK[n]);}}));
 (o.velo||[]).forEach(([t,on])=>ev.push({t,f:()=>{const g=N.mF.frequency;g.setTargetAtTime(on?520:19000,t,on?.25:.4);N.duck.gain.setTargetAtTime(on?.6:1,t,.3);}}));
 ev.sort((a,b)=>a.t-b.t);
 dentro(()=>{N=grafo(oc);aplicar(0);seq=nom?nuevaCancion(nom,.05,o.sec||0):null;if(seq&&o.capas&&o.capas[0])fijarCapa(seq,AU.capa=o.capas[0][1],0);});
 // igual que en vivo: se programa solo ~0,35 s por delante (suspensiones cada 0,25 s)
 const tick=tt=>dentro(()=>{const hasta=tt+.35;while(ev.length&&ev[0].t<=hasta)ev.shift().f();if(seq)while(seq.t<hasta){paso(seq);avanzar(seq);}});
 tick(0);
 for(let k=1;k*.25<seg;k++){const T=k*.25;oc.suspend(T).then(()=>{tick(T);oc.resume();});}
 return await oc.startRendering();
};
// WAV PCM 16 bits a partir de un AudioBuffer (para pruebas y para la muestra de Julián)
AU.wav=buf=>{const ch=buf.numberOfChannels,len=buf.length,sr=buf.sampleRate,b=new ArrayBuffer(44+len*ch*2),v=new DataView(b);
 const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
 w(0,'RIFF');v.setUint32(4,36+len*ch*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,len*ch*2,true);
 const d=[];for(let c=0;c<ch;c++)d.push(buf.getChannelData(c));let o=44;for(let i=0;i<len;i++)for(let c=0;c<ch;c++){const x=Math.max(-1,Math.min(1,d[c][i]));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2;}
 return b;};
G.AU=AU;
})(window);
