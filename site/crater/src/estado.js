/* JET//Cráter · guardado (localStorage con try/catch y respaldo en memoria), puntuación, racha, perfil. */
(function(G){
'use strict';
const GEN=G.CR_GEN;
const Q=new URLSearchParams(location.search);
const FECHA_PRUEBA=/^\d{4}-\d\d-\d\d$/.test(Q.get('fecha')||'')?Q.get('fecha'):null;
const PFX=FECHA_PRUEBA?'jet-crater-prueba:':'jet-crater:';
let okLS=true;const MEM={};
try{const k=PFX+'__t';localStorage.setItem(k,'1');localStorage.removeItem(k);}catch(e){okLS=false;}
function leer(k,def){try{if(okLS){const v=localStorage.getItem(PFX+k);if(v!=null)return JSON.parse(v);}else if(k in MEM)return JSON.parse(MEM[k]);}catch(e){}return def;}
function guardar(k,v){const s=JSON.stringify(v);MEM[k]=s;if(!okLS)return;try{localStorage.setItem(PFX+k,s);}catch(e){}}
function borrar(k){delete MEM[k];if(okLS)try{localStorage.removeItem(PFX+k);}catch(e){}}
function borrarTodo(){Object.keys(MEM).forEach(k=>delete MEM[k]);if(!okLS)return;try{const ks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf(PFX)===0)ks.push(k);}ks.forEach(k=>localStorage.removeItem(k));}catch(e){}}

function nuevoUid(){const b=new Uint8Array(16);(G.crypto||{}).getRandomValues?crypto.getRandomValues(b):b.forEach((_,i)=>b[i]=Math.random()*256|0);
 let s=btoa(String.fromCharCode.apply(null,b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');return s.slice(0,22);}
let uid=leer('uid',null);if(!uid||!/^[A-Za-z0-9_-]{22}$/.test(uid)){uid=nuevoUid();guardar('uid',uid);}

const PREFS_DEF={mOn:true,mVol:.6,sOn:true,sVol:.85,vib:true,auto:true,mov:null,lang:null,soloReales:false};
const prefs=Object.assign({},PREFS_DEF,leer('prefs',{}));
const guardarPrefs=()=>guardar('prefs',prefs);

/* ---------- fecha del juego ---------- */
let desfase=0;                 // días añadidos por el gancho de pruebas fijarFecha
let fijada=FECHA_PRUEBA;
function hoy(){return fijada||GEN.fechaLocal(new Date(Date.now()+desfase*864e5));}

/* ---------- días ---------- */
function dia(f){const d=leer('dia:'+f,null);if(d&&Array.isArray(d.rondas))return d;return {rondas:[null,null,null,null,null,null,null],visto:false};}
function guardarDia(f,d){guardar('dia:'+f,d);}
function jugadas(d){return d.rondas.filter(r=>r&&r.o!=null).length;}

/* ---------- puntuación (DISENO §3.2-3.4) ---------- */
function puntuar(ronda,mi,real,mioContado,soloReales){
 const k=ronda.op.length,cr=new Array(k).fill(0);
 if(real&&real.conteos)real.conteos.forEach((v,i)=>{if(i<k)cr[i]=v|0;});
 if(mioContado&&mi!=null&&cr[mi]>0)cr[mi]--;
 const N=cr.reduce((a,b)=>a+b,0);
 const pp=ronda.practica.map(v=>v/200);
 let p;
 if(N>=30)p=cr.map(v=>v/N);
 else p=pp.map((x,i)=>(cr[i]+(30-N)*x)/30);
 const pv=(soloReales&&N>0)?cr.map(v=>v/N):p;          // lo que se dibuja si piden «solo reales»
 const mx=Math.max.apply(null,p);
 const ganadores=p.map((v,i)=>v>=mx-1e-9?i:-1).filter(i=>i>=0);
 if(mi==null)return {p,pv,N,mezcla:N<30,real:cr,ganadores,pts:0,sync:false,cuota:0};
 return {p,pv,N,mezcla:N<30,real:cr,ganadores,pts:Math.round(100*p[mi]),sync:p[mi]>=mx-1e-9,cuota:p[mi]};
}
const luna=(r)=>!r?'🌑':r.sync?'🌕':r.cuota>=.2?'🌗':'🌑';

/* ---------- historial, racha, perfil ---------- */
const hist=()=>leer('hist',{});
function guardarHist(f,v){const h=hist();h[f]=Object.assign(h[f]||{},v);const ks=Object.keys(h).sort();while(ks.length>400)delete h[ks.shift()];guardar('hist',h);}
function racha(){const h=hist();let f=hoy();if(!(h[f]&&h[f].j))f=GEN.sumar(f,-1);let n=0;while(h[f]&&h[f].j){n++;f=GEN.sumar(f,-1);}return n;}
function mediaSync(dias){const h=hist(),f0=hoy();let s=0,n=0;for(let i=0;i<(dias||30);i++){const f=GEN.sumar(f0,-i),x=h[f];if(x&&x.j&&x.s!=null){s+=x.s;n++;}}return n?s/n:null;}
const PERFIL_DEF={mejorRacha:0,record:0,cuaderno:new Array(12).fill(0),brujula:[0,0,0,0,0,0]};
function perfil(){const p=Object.assign({},PERFIL_DEF,leer('perfil',{}));if(!Array.isArray(p.cuaderno)||p.cuaderno.length!==12)p.cuaderno=new Array(12).fill(0);if(!Array.isArray(p.brujula)||p.brujula.length!==6)p.brujula=[0,0,0,0,0,0];return p;}
const guardarPerfil=p=>guardar('perfil',p);

/* Tarjeta del Cuaderno que corresponde a una elección en sincronía. */
function tarjeta(ronda,i){
 const r=ronda.rasgos[i],dom=GEN.dominante(r),t=ronda.tipo;
 const mapa=t==='luna'||t==='planeta'||t==='gran';
 if(mapa){let d=dom;if(d===4){const sub=[r[2],r[1],r[0]];d=[2,1,0][sub.indexOf(Math.max.apply(null,sub))];}
  return {2:0,0:1,1:2,3:3}[d]!=null?{2:0,0:1,1:2,3:3}[d]:null;}
 if(t==='num')return dom===4?4:(dom===0||dom===2)?5:(dom===1||dom===3)?11:null;
 if(t==='color')return dom===4?6:(dom===0||dom===2)?7:(dom===1||dom===3)?11:null;
 if(t==='palabra')return (dom===4||dom===2)?8:dom===0?7:(dom===1||dom===3)?11:null;
 if(t==='base')return dom===1?9:(dom===0||dom===2||dom===3||dom===4)?10:null;
 return null;
}

G.EST={PFX,okLS,uid,prefs,guardarPrefs,leer,guardar,borrar,borrarTodo,hoy,dia,guardarDia,jugadas,puntuar,luna,hist,guardarHist,racha,mediaSync,perfil,guardarPerfil,tarjeta,
 FECHA_PRUEBA,fijar:f=>{fijada=f;},desplazar:n=>{desfase=n;}};
})(window);
