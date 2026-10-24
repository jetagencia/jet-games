/* JET//Cráter · red: cola de votos con reintentos y retroceso, lectura de estado con caché.
   El jugador nunca espera a la red: todo funciona en modo práctica si el servidor no responde. */
(function(G){
'use strict';
const EST=G.EST;
const API='api.php';
const Q=new URLSearchParams(location.search);
const RED={activa:!EST.FECHA_PRUEBA||Q.get('red')==='1',forzadaOff:false,ok:null,relojMal:false,
 alVoto:null,alConflicto:null,alTarde:null,alCambio:null};
let fallos=0,timer=null,procesando=false,otraVez=false;

function marcar(ok){const antes=RED.ok;RED.ok=ok;fallos=ok?0:fallos+1;if(antes!==ok&&RED.alCambio)RED.alCambio(ok);}
function disponible(){return RED.activa&&!RED.forzadaOff&&navigator.onLine!==false;}

async function pedir(url,opts){
 const ctl=typeof AbortController!=='undefined'?new AbortController():null;const to=setTimeout(()=>ctl&&ctl.abort(),4000);
 try{const r=await fetch(url,Object.assign({cache:'no-store',signal:ctl?ctl.signal:undefined},opts||{}));let j=null;try{j=await r.json();}catch(e){}
  return {st:r.status,j};}
 catch(e){return {st:0,j:null};}
 finally{clearTimeout(to);}
}

/* ---------- cola de votos ---------- */
const cola=()=>EST.leer('cola',[]);
const guardarCola=c=>EST.guardar('cola',c);
RED.votar=(v)=>{ // v: {fecha,ronda,opcion,x,y,lang}
 const c=cola().filter(x=>!(x.fecha===v.fecha&&x.ronda===v.ronda));c.push(Object.assign({intentos:0,prox:0},v));guardarCola(c);
 return RED.procesar();
};
RED.pendientes=()=>cola().length;
RED.procesar=async()=>{
 if(!disponible())return null;if(procesando){otraVez=true;return null;}procesando=true;otraVez=false;let ultimo=null;
 try{
  let c=cola();
  for(const it of c.slice()){
   if(it.prox>Date.now())continue;
   const body=JSON.stringify({v:1,uid:EST.uid,fecha:it.fecha,ronda:it.ronda,opcion:it.opcion,x:it.x,y:it.y,lang:it.lang});
   const r=await pedir(API+'?a=votar',{method:'POST',headers:{'Content-Type':'application/json'},body});
   const quitar=()=>{c=cola().filter(x=>!(x.fecha===it.fecha&&x.ronda===it.ronda));guardarCola(c);};
   if(r.st===200&&r.j&&r.j.ok){marcar(true);quitar();ultimo=r.j;RED.alVoto&&RED.alVoto(it,r.j);}
   else if(r.st===409){marcar(true);quitar();RED.alConflicto&&RED.alConflicto(it,r.j&&r.j.opcion);}
   else if(r.st===410){marcar(true);quitar();RED.alTarde&&RED.alTarde(it);}
   else if(r.st===422){marcar(true);quitar();RED.relojMal=true;RED.alTarde&&RED.alTarde(it,'reloj');}
   else if(r.st===400||r.st===413){marcar(true);quitar();}
   else if(r.st===429){marcar(true);it.prox=Date.now()+60000;guardarCola(cola().map(x=>x.fecha===it.fecha&&x.ronda===it.ronda?it:x));break;}
   else{marcar(false);it.intentos++;it.prox=Date.now()+Math.min(300000,5000*Math.pow(2,it.intentos));guardarCola(cola().map(x=>x.fecha===it.fecha&&x.ronda===it.ronda?it:x));break;}
  }
 }finally{procesando=false;}
 // un voto que llegó mientras se enviaba otro sale enseguida, no a los 30 s del ciclo
 if(otraVez&&fallos===0&&cola().some(x=>x.prox<=Date.now())){otraVez=false;const r2=await RED.procesar();return r2||ultimo;}
 return ultimo;
};

/* ---------- estado de una fecha ---------- */
const MEMO={};
RED.estado=async(fecha,forzar)=>{
 const cerr=EST.leer('est:'+fecha,null);if(cerr&&cerr.cerrado)return cerr;
 const m=MEMO[fecha];if(m&&!forzar&&Date.now()-m.t<20000)return m.d;
 if(!disponible())return m?m.d:null;
 const r=await pedir(API+'?a=estado&fecha='+fecha+'&hoy='+EST.hoy()+'&uid='+EST.uid);
 if(r.st===200&&r.j&&Array.isArray(r.j.rondas)){marcar(true);MEMO[fecha]={t:Date.now(),d:r.j};if(r.j.cerrado)EST.guardar('est:'+fecha,r.j);return r.j;}
 if(r.st===422){marcar(true);RED.relojMal=true;}
 else if(r.st!==400)marcar(false);
 return m?m.d:null;
};
RED.metrica=ev=>{if(!disponible())return;try{fetch(API+'?a=metrica',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({evento:ev}),keepalive:true}).catch(()=>{});}catch(e){}};
RED.simular=on=>{RED.forzadaOff=!on;if(on)RED.procesar();else marcar(false);};

function ciclo(){clearTimeout(timer);timer=setTimeout(async()=>{if(cola().length)await RED.procesar();ciclo();},cola().length?Math.min(60000,30000*Math.max(1,fallos)):30000);}
addEventListener('online',()=>{RED.procesar();});
addEventListener('offline',()=>marcar(false));
ciclo();
G.RED=RED;
})(window);
