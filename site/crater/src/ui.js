/* JET//Cráter · interfaz: pantallas, flujo del día, entrada táctil/teclado/mouse, revelación, perfil, ajustes,
   pantalla completa robusta y gancho de pruebas window.CRATER. */
(function(G){
'use strict';
const GEN=G.CR_GEN,BAN=G.CR_BANCOS,TX=G.CR_T,EST=G.EST,RED=G.RED,AU=G.AU,MAPA=G.MAPA;
const $=id=>document.getElementById(id);
const Q=new URLSearchParams(location.search);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,ease=t=>1-Math.pow(1-t,3);
const MAPAS=['luna','planeta','gran','base'];
const esMapa=r=>MAPAS.includes(r.tipo);

/* ---------- idioma ---------- */
/* Idioma único del sitio: _shared/jet-idioma.js (?lang > cookie jet_lang de .jetgames.fun > navegador). */
const JI=G.JETIdioma;
let L=JI.get();
(function migrarIdioma(){ // el idioma propio de antes (prefs.lang) se pasa una sola vez a JETIdioma y deja de usarse
 const v=EST.prefs.lang;if(v==null)return;
 let elegido=false;try{elegido=/(?:^|;\s*)jet_lang=(es|en)\b/.test(document.cookie)||!!localStorage.getItem('jet_lang');}catch(e){}
 if(!elegido&&(v==='es'||v==='en')){JI.set(v);L=JI.get();}
 EST.prefs.lang=null;EST.guardarPrefs();})();
function t(k,v){let s=TX[L][k];if(s==null)s=TX.es[k];if(typeof s==='string'&&v)s=s.replace(/\{([^}]+)\}/g,(m,x)=>v[x]!=null?v[x]:m);return s;}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* Fecha, hora y zona horaria locales de un instante (para revelación y cierre): nunca «medianoche» a secas. */
function fhz(ms){const d=new Date(ms);let zona='';try{zona=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
 if(!zona){const o=-d.getTimezoneOffset(),sg=o>=0?'+':'-';zona='UTC'+sg+String(Math.floor(Math.abs(o)/60)).padStart(2,'0')+':'+String(Math.abs(o)%60).padStart(2,'0');}
 return {fecha:fechaCorta(GEN.fechaLocal(d))+' '+d.getFullYear(),hora:horaLocal(ms),zona};}
function proximaMedianoche(){const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate()+1).getTime();}
const fmtN=n=>Math.round(n).toLocaleString(L==='es'?'es-ES':'en-US');
const fmt1=n=>n.toLocaleString(L==='es'?'es-ES':'en-US',{minimumFractionDigits:1,maximumFractionDigits:1});
const fechaCorta=f=>{const [y,m,d]=f.split('-').map(Number);return L==='es'?d+' '+t('months')[m-1]:t('months')[m-1]+' '+d;};
const horaLocal=ms=>{const d=new Date(ms);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
function hms(ms){ms=Math.max(0,ms);const s=Math.floor(ms/1000);return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(x=>String(x).padStart(2,'0')).join(':');}
function aMedianoche(){const n=new Date();const m=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1);return m-n;}
const quieto=()=>EST.prefs.mov!=null?EST.prefs.mov:matchMedia('(prefers-reduced-motion: reduce)').matches;
function vib(ms){if(EST.prefs.vib&&navigator.vibrate)try{navigator.vibrate(ms);}catch(e){}}

function pintarKickPausa(){$('zKick').textContent=J.dia&&J.modo!=='ensayo'?t('roundKick',{r:J.r+1,tipo:t('rTypes')[ronda().tipo]}):'';}
function aplicarTextos(){
 document.documentElement.lang=t('htmlLang');document.title=t('title');
 document.querySelectorAll('[data-t]').forEach(e=>{const v=t(e.dataset.t);if(typeof v==='string')e.textContent=v;});
 document.querySelectorAll('[data-ta]').forEach(e=>{const v=t(e.dataset.ta);e.setAttribute('aria-label',v);e.title=v;});
 document.querySelectorAll('.segLang button').forEach(b=>{b.classList.toggle('on',b.dataset.l===L);b.setAttribute('aria-pressed',b.dataset.l===L);});
 const p=[t('why1'),t('why2'),t('why3')].map((x,i)=>'<div class="paso"><i>'+(i+1)+'</i><span>'+x+'</span></div>').join('');
 $('lPasos').innerHTML=p;$('wPasos').innerHTML=p;
 pintarPantalla();if(modales.includes('pausa'))pintarKickPausa();
}

/* ---------- toasts y pastilla ---------- */
let toastT=0;
function toast(msg,ms){const e=$('toast');e.textContent=msg;e.classList.remove('accion');e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),ms||2200);}
function toastAccion(msg,lab,fn,ms){const e=$('toast');e.innerHTML='<span>'+esc(msg)+'</span><button type="button" class="tAcc" id="tAcc">'+esc(lab)+'</button>';e.classList.add('on','accion');clearTimeout(toastT);
 $('tAcc').onclick=()=>{limpiarToast();fn();};toastT=setTimeout(limpiarToast,ms||6000);}
function limpiarToast(){const e=$('toast');clearTimeout(toastT);e.classList.remove('on','accion');setTimeout(()=>{if(!e.classList.contains('on'))e.textContent='';},250);}
function pastilla(){
 const e=$('pill');let txt='',cls='';
 if(EST.FECHA_PRUEBA){txt=t('testMode',{f:EST.FECHA_PRUEBA});cls='test';}
 else if(RED.forzadaOff||RED.ok===false||navigator.onLine===false)txt=t('offline');
 else if(RED.relojMal)txt=t('badClock');
 else if(!EST.okLS)txt=t('noSave');
 e.hidden=!txt;e.textContent=txt;e.className=cls;document.body.classList.toggle('pill',!!txt);
}

/* ---------- pantallas ---------- */
const BASES=['inicio','ronda','lectura','revela','archivo','perfil'],MODALES=['como','porque','ajustes','pausa','compartir','borrar'];
const ID={inicio:'sInicio',ronda:'sRonda',lectura:'sLectura',revela:'sRevela',archivo:'sArchivo',perfil:'sPerfil',como:'sComo',porque:'sPorque',ajustes:'sAjustes',pausa:'sPausa',compartir:'sCompartir',borrar:'sBorrar'};
let base='inicio';const modales=[];const ACTIVADOR={};
function mostrar(b){
 base=b;BASES.forEach(x=>$(ID[x]).classList.toggle('on',x===b));
 document.body.classList.toggle('enRonda',b==='ronda');
 limpiarToast();
 $('bPausa').hidden=b!=='ronda';
 $('segLang2').hidden=b!=='inicio';
 if(b!=='ronda')cancelarAuto();
 if(AU.listo)AU.musica(b==='ronda'?'juego':b==='revela'?'revela':'menu');AU.velo(modales.includes('pausa'));
 guardarVista();medir();pintarPantalla();
 const sc=$(ID[b]);if(sc)sc.scrollTop=0;
}
/* Sólo la capa superior es operable: el fondo y las capas inferiores quedan inert (Tab no entra, el lector no las lee). */
function sincInerte(){const top=modales[modales.length-1]||null,hay=!!top;
 BASES.forEach(x=>{$(ID[x]).inert=hay;});['back','tr','pill','toast'].forEach(id=>{const e=$(id);if(e)e.inert=hay;});
 MODALES.forEach(m=>{$(ID[m]).inert=modales.includes(m)&&m!==top;});}
const visibleFoco=n=>!!(n&&n.isConnected&&n!==document.body&&n.offsetParent!==null&&!n.closest('[inert]')&&!n.closest('[hidden]'));
function enfocar(n){if(!n)return;if(!n.matches('button,a[href],input,select,textarea,[tabindex]'))n.tabIndex=-1;n.focus({preventScroll:true});}
function abrir(m,opts){opts=opts||{};if(modales[modales.length-1]===m)return;
 if(modales.includes(m)){modales.splice(modales.indexOf(m),1);}else ACTIVADOR[m]=opts.activador||document.activeElement;
 modales.push(m);const el=$(ID[m]);el.style.zIndex=50+modales.length;el.classList.add('on');cancelarAuto();AU.sfx('ui');
 if(m==='ajustes')pintarAjustes();if(m==='como')comoIr(0);if(m==='pausa')AU.velo(true);if(m==='pausa')pintarKickPausa();
 sincInerte();
 // foco inicial: título (o el control indicado), sin condicionar a si hay pantalla táctil
 const f=(opts.foco&&el.querySelector(opts.foco))||el.querySelector('h2')||el.querySelector('button');
 if(f)setTimeout(()=>{if(modales.includes(m))enfocar(f);},30);}
function cerrar(opts){opts=opts&&opts.sinFoco!=null?opts:{};const m=modales.pop();if(m){$(ID[m]).classList.remove('on');$(ID[m]).inert=false;}AU.sfx('ui');AU.velo(modales.includes('pausa'));if(m==='ajustes')pintarPantalla();
 sincInerte();if(opts.sinFoco)return;
 const a=m?ACTIVADOR[m]:null;if(m)delete ACTIVADOR[m];
 if(visibleFoco(a)){enfocar(a);return;}
 if(modales.length){const top=$(ID[modales[modales.length-1]]);enfocar(top.querySelector('h2')||top.querySelector('button'));return;}
 if(base==='ronda'){$('cv').focus({preventScroll:true});return;}
 const sc=$(ID[base]);enfocar(sc.querySelector('h1,h2')||sc.querySelector('button'));}
function cerrarTodo(){while(modales.length)cerrar({sinFoco:true});}
function volver(){if(modales.length)cerrar();else mostrar('inicio');}
function pintarPantalla(){if(base==='inicio')pintarInicio();else if(base==='ronda'&&J.dia)pintarRonda();else if(base==='lectura')pintarLectura();else if(base==='revela')pintarRevela(true);else if(base==='archivo')pintarArchivo();else if(base==='perfil')pintarPerfil();pastilla();}
function guardarVista(){EST.guardar('vista',{p:base,modo:J.modo,fecha:J.fecha||RV.fecha,r:J.r,rv:RV.modo,f2:RV.fecha});}

/* ---------- medidas, pantalla completa, giro ---------- */
let DPR=1,W=0,H=0;
/* Tamaño de MAQUETACIÓN (clientWidth/Height), nunca getBoundingClientRect: durante la animación de entrada de ronda el rect viene escalado y dejaba el mapa y la rejilla con medidas falsas (desbordes en 320×640). */
function dimensionar(cv){const w=Math.max(1,cv.clientWidth),h=Math.max(1,cv.clientHeight);const pw=Math.round(w*DPR),ph=Math.round(h*DPR);if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;}return {w,h};}
function medir(){
 DPR=Math.min(3,G.devicePixelRatio||1);
 const vv=G.visualViewport;W=vv?vv.width:innerWidth;H=vv?vv.height:innerHeight;
 dimensionar($('fondo'));
 if(base==='ronda'&&J.dia){const a=dimensionar($('cv'));J.W=a.w;J.H=a.h;const s=Math.floor(Math.min(a.w,a.h));J.box={x:Math.round((a.w-s)/2),y:Math.round((a.h-s)/2),s};if(!esMapa(ronda()))maquetarLista();}
 if(base==='revela'){const a=dimensionar($('cvR'));RV.W=a.w;RV.H=a.h;const s=Math.floor(Math.min(a.w,a.h));RV.box={x:Math.round((a.w-s)/2),y:Math.round((a.h-s)/2),s};if(RV.r!=null&&RV.r<7&&!esMapa(RV.dia.rondas[RV.r]))maquetarListaR();}
 fondoQuieto=true;
}
let medT=0;const medirPronto=()=>{clearTimeout(medT);medir();medT=setTimeout(medir,180);};
addEventListener('resize',medirPronto);addEventListener('orientationchange',()=>setTimeout(medirPronto,60));
if(G.visualViewport)visualViewport.addEventListener('resize',medirPronto);
if(G.ResizeObserver){const ro=new ResizeObserver(()=>{if(base==='ronda'||base==='revela')medir();});ro.observe($('area'));ro.observe(document.querySelector('#sRevela .lienzo'));}
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
const fsOk=()=>!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
function pantallaCompleta(){const d=document.documentElement;
 if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);}
 else{const f=d.requestFullscreen||d.webkitRequestFullscreen;if(f)try{const p=f.call(d,{navigationUI:'hide'});if(p&&p.catch)p.catch(()=>{});}catch(e){}}}
function alCambiarFs(){medirPronto();AU.resume();pintarFsBotones();if(!fsEl()&&base==='ronda'&&!modales.length&&J.fase!=='bajando')abrir('pausa');}
document.addEventListener('fullscreenchange',alCambiarFs);document.addEventListener('webkitfullscreenchange',alCambiarFs);
function pintarFsBotones(){const ok=fsOk(),txt=fsEl()?t('exitFullscreen'):t('fullscreen');$('bPantalla').hidden=!ok;$('bPantalla2').hidden=!ok;$('bPantallaT').textContent=txt;$('bPantalla2').textContent=txt;}

/* ---------- audio: primer gesto ---------- */
function prefsAudio(){AU.prefs({mOn:EST.prefs.mOn,mVol:EST.prefs.mVol,sOn:EST.prefs.sOn,sVol:EST.prefs.sVol});}
function gesto(){if(!AU.listo){AU.init();prefsAudio();if(AU.listo)AU.musica(base==='ronda'?'juego':base==='revela'?'revela':'menu');}else AU.resume();}
// pointerdown solo concede activación con ratón; en táctil la dan pointerup/touchend/click: se escuchan todos
['pointerdown','pointerup','touchend','click','keydown'].forEach(ev=>addEventListener(ev,gesto,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){AU.suspend();cancelarAuto();if(base==='ronda'&&!modales.length&&J.fase!=='bajando')abrir('pausa');}
 else{AU.resume();medirPronto();revisarDia();RED.procesar();}
});

/* =====================================================================
   RONDA
   ===================================================================== */
const TUT={n:1,tipo:'luna',semilla:31337,micro:2024,intento:0,ctx:0,
 op:[{x:.21,y:.22,r:.05,rasgo:null},{x:.8,y:.25,r:.046,rasgo:null},{x:.5,y:.5,r:.135,rasgo:null},{x:.22,y:.79,r:.048,rasgo:null},{x:.79,y:.77,r:.052,rasgo:null}],
 rasgos:[[0,0,0,.4,0],[0,0,0,.4,0],[0,1,1,0,.9],[0,0,0,.4,0],[0,0,0,.4,0]],practica:[17,19,130,16,18],moda:.65};
const J={modo:null,fecha:null,dia:null,d:null,r:0,sel:null,hover:null,fase:'elegir',t0:0,entrada:1,tSel:0,shake:0,box:null,W:0,H:0,auto:null,onda:null,mano:0,tut:null};
const ronda=()=>J.dia.rondas[J.r];
function claveDia(){return J.modo==='archivo'?'arch:'+J.fecha:null;}
function cargarD(){if(J.modo==='hoy')return EST.dia(J.fecha);if(J.modo==='archivo')return EST.leer('arch:'+J.fecha,{rondas:[null,null,null,null,null,null,null]});return {rondas:[null]};}
function guardarD(){if(J.modo==='hoy')EST.guardarDia(J.fecha,J.d);else if(J.modo==='archivo')EST.guardar('arch:'+J.fecha,J.d);}

function empezarDia(modo,fecha,rFijo){
 J.modo=modo;J.fecha=fecha;J.dia=modo==='ensayo'?{n:GEN.diaN(EST.hoy()),fecha,rondas:[TUT]}:GEN.generarDia(fecha);J.d=cargarD();
 let r=J.d.rondas.findIndex(x=>!x||x.o==null);
 if(rFijo!=null&&J.d.rondas[rFijo]&&J.d.rondas[rFijo].o!=null&&(r<0||rFijo<r))r=rFijo;   // volver a la ronda recién aterrizada
 if(r<0){finDia();return;}
 if(modo==='hoy'&&EST.jugadas(J.d)===0)RED.metrica('dia_inicio');
 J.r=r;J.sel=null;J.fase='elegir';mostrar('ronda');entrarRonda(r);
}
function entrarRonda(r){
 J.r=r;const R=ronda(),gr=J.d.rondas[r];
 J.sel=gr&&gr.o!=null?gr.o:(gr&&gr.sel!=null?gr.sel:null);J.hover=null;J.onda=null;J.fase=gr&&gr.o!=null?'posado':'elegir';J.t0=performance.now();J.entrada=quieto()?1:0;
 J.tPos=J.fase==='posado'?performance.now()-5000:0;
 $('rRes').hidden=true;
 AU.ponerCapa(r<2?1:r<4?2:r<6?3:4);AU.anticipar(J.sel!=null&&J.fase==='elegir');
 const area=$('area');if(!quieto()){area.style.transition='none';area.style.transform='scale(1.06)';area.style.opacity='.2';requestAnimationFrame(()=>{area.style.transition='transform .28s cubic-bezier(.2,.8,.3,1),opacity .28s';area.style.transform='';area.style.opacity='';});}
 medir();pintarRonda();guardarVista();
 if(J.fase==='posado')mostrarResultado(false);
 if(!('ontouchstart' in G))$('cv').focus({preventScroll:true});
}
function textoCtx(R){if(J.modo==='ensayo')return t('tutTitle');const c=BAN.CTX[R.tipo][R.ctx][L==='es'?0:1];
 if(R.tipo==='planeta'){const P=BAN.PLANETAS[R.planeta||0];return c.replace('{p}',L==='es'?P.ces:P.cen);}return c;}
function pintarRonda(){
 const R=ronda();
 $('rKick').textContent=J.modo==='ensayo'?t('tutKick'):t('roundKick',{r:J.r+1,tipo:t('rTypes')[R.tipo]})+(J.modo==='archivo'?' · '+t('dayLabel',{n:J.dia.n}):'');
 $('rCtx').textContent=textoCtx(R);$('rPrompt').textContent=t('prompt');
 $('sRonda').setAttribute('aria-label',t('roundKick',{r:J.r+1,tipo:t('rTypes')[R.tipo]}));$('cv').setAttribute('aria-label',t('rTypes')[R.tipo]);
 $('bSaltar').hidden=J.modo!=='ensayo'||J.fase!=='elegir';
 pintarLeyendaRonda();
 // lunas de progreso
 const lu=$('rLunas');if(J.modo==='ensayo'){lu.innerHTML='';}else{let h='';for(let i=0;i<7;i++){const g=J.d.rondas[i];let c='';
  if(g&&g.o!=null){const p=provRonda(i);c=p&&p.sync?'llena':p&&p.cuota>=.2?'media':'jugada';}
  if(i===J.r)c+=' act';h+='<i class="'+c+'"></i>';}lu.innerHTML=h;}
 // lista o mapa
 const lista=$('lista'),cv=$('cv');
 if(esMapa(R)){lista.innerHTML='';lista.hidden=true;cv.classList.remove('pasivo');pintarSr();}
 else{lista.hidden=false;cv.classList.add('pasivo');$('srOps').innerHTML='';pintarLista();}
 pintarBoton();
}
function etiquetaOp(R,i){const o=R.op[i];
 if(o.r!=null){const sz=o.r>.085?2:o.r>.05?1:0;let s=t('craterLabel',{i:i+1})+', '+t('craterSize')[sz];if(Math.hypot(o.x-.5,o.y-.5)<.12)s+=', '+t('nearCenter');return s;}
 if(o.mod){const m=BAN.MOD.find(q=>q.id===o.mod);return t('moduleLabel',{m:m[L],i:i+1})+(o.puerta?', '+t('entrance'):'');}
 if(o.hex){const [h,s,l]=GEN.hslDe(o.hex);let nom;if(s<.15)nom=t('grays')[Math.min(4,Math.floor(l*5))];else{nom=t('hues')[Math.round(h/30)%12];if(l>.72)nom+=' '+t('light');else if(l<.3)nom+=' '+t('dark');}return t('colorLabel',{i:i+1,h:nom});}
 if(o.v!=null)return String(o.v);return o[L];}
function pintarSr(){const R=ronda();$('srOps').innerHTML=R.op.map((o,i)=>'<button role="radio" aria-checked="'+(J.sel===i)+'" data-i="'+i+'">'+etiquetaOp(R,i)+'</button>').join('');}
$('srOps').addEventListener('click',e=>{const b=e.target.closest('button');if(b)elegir(+b.dataset.i,'tecla');});
function pintarLista(){
 const R=ronda(),l=$('lista');
 l.innerHTML=R.op.map((o,i)=>{const sel=J.sel===i?' sel':'',otra=J.fase!=='elegir'&&J.sel!==i?' otra':'';
  const inner=o.hex?'<span class="baliza" style="--c:'+o.hex+'"></span>':o.v!=null?'<span class="n">'+o.v+'</span>':'<span class="w">'+o[L]+'</span>';
  return '<button class="plat'+sel+otra+'" role="radio" aria-checked="'+(J.sel===i)+'" aria-label="'+etiquetaOp(R,i)+'" data-i="'+i+'">'+inner+'</button>';}).join('');
 maquetarLista();
}
/* Rejilla de plataformas: SIEMPRE cabe en el área medida en vivo (ancho y alto), celdas ≥46 px de alto; la fila incompleta queda centrada (flex). */
function rejillaPara(k,w,h,gap){let mejor=null;const cwMax=Math.max(210,Math.min(300,w*.3)),chMax=Math.max(150,Math.min(220,h*.24));
 for(let c=2;c<=Math.min(k,6);c++){const f=Math.ceil(k/c);let cw=Math.min((w-gap*(c-1))/c,cwMax),ch=Math.min((h-gap*(f-1))/f,chMax,cw*1.15);
  const pen=Math.abs(Math.log((cw/ch)/1.25));const cabe=ch>=46&&cw>=60;const area=cw*ch-pen*900-(k%c?((c-k%c)*90):0)-(cabe?0:1e6);if(!mejor||area>mejor.a)mejor={c,f,cw,ch,a:area};}return mejor;}
function aplicarRejilla(l,g,gap){l.style.setProperty('--cw',Math.floor(g.cw)+'px');l.style.setProperty('--ch',Math.floor(g.ch)+'px');l.style.gap=gap+'px';l.style.maxWidth=(Math.ceil(g.c*Math.floor(g.cw)+gap*(g.c-1))+2)+'px';}
function maquetarLista(){const l=$('lista');if(l.hidden)return;const a=$('area');if(!a.clientWidth)return;const R=ronda(),gap=W<420?8:10;
 aplicarRejilla(l,rejillaPara(R.op.length,a.clientWidth-2,a.clientHeight-2,gap),gap);}
$('lista').addEventListener('click',e=>{const b=e.target.closest('.plat');if(!b)return;const i=+b.dataset.i;
 if(J.fase==='elegir')elegir(i,'toque');else if(J.fase==='bajando')saltarAnim();});
$('lista').addEventListener('pointerover',e=>{const b=e.target.closest('.plat');if(b&&e.pointerType==='mouse'&&J.fase==='elegir'){const i=+b.dataset.i;if(J.hover!==i){J.hover=i;AU.sfx('tic',i);}}});
addEventListener('pointerdown',e=>{J.ultimoTipo=e.pointerType;document.body.classList.remove('teclado');},{capture:true});
addEventListener('keydown',e=>{if(e.key==='Tab'||e.key.startsWith('Arrow'))document.body.classList.add('teclado');},{capture:true});

function pintarBoton(){
 const b=$('bAterrizar'),R=ronda();cancelarAuto();
 const av=$('rAviso'),ex=$('rExtra');
 if(J.fase==='elegir'){b.disabled=J.sel==null;b.textContent=J.sel==null?(R.tipo==='base'?t('pickModule'):esMapa(R)?t('pickCrater'):R.tipo==='num'?t('pickNum'):R.tipo==='color'?t('pickColor'):R.tipo==='palabra'?t('pickWord'):t('pick')):t('land');
  av.hidden=J.sel==null;av.textContent=J.sel==null?'':t('choiceWarn',{'opción':etiquetaOp(R,J.sel)});ex.hidden=true;}
 else if(J.fase==='bajando'){b.disabled=true;b.textContent=t('land');av.hidden=true;ex.hidden=true;}
 else{b.disabled=false;b.innerHTML=(J.modo==='ensayo'?t('tutPlay',{n:GEN.diaN(EST.hoy())}):J.r>=6?t('finish'):t('next'))+'<i class="bar" id="barAuto"></i>';av.hidden=true;ex.hidden=J.modo!=='ensayo';}
 pintarLeyendaRonda();
}
function pintarLeyendaRonda(){const l=$('rLey');if(!l||!J.dia)return;const hay=J.fase==='elegir'&&J.sel!=null;l.hidden=!hay;
 l.innerHTML=hay?'<span><i style="background:transparent;border:2px solid var(--cyan)"></i>'+t('yourPick')+'</span>':'';}

/* ---------- elegir y aterrizar ---------- */
function elegir(i,via,px,py){
 if(J.fase!=='elegir'||i==null||i<0)return;const R=ronda();if(i>=R.op.length)return;
 const prev=J.sel;J.sel=i;J.tSel=performance.now();J.mano=-1;
 if(px!=null&&py!=null&&J.box){J.px=clamp(Math.round((px-J.box.x)/J.box.s*255),0,255);J.py=clamp(Math.round((py-J.box.y)/J.box.s*255),0,255);}
 else if(R.op[i].x!=null){J.px=Math.round(R.op[i].x*255);J.py=Math.round(R.op[i].y*255);}
 AU.sfx('elegir',i,prev);AU.anticipar(true);vib(6);
 J.d.rondas[J.r]=Object.assign({},J.d.rondas[J.r]||{},{sel:i});guardarD();
 if(esMapa(R)){pintarSr();}else{$('lista').querySelectorAll('.plat').forEach((b,k)=>{b.classList.toggle('sel',k===i);b.setAttribute('aria-checked',k===i);});}
 pintarBoton();
 if(J.modo==='ensayo'&&prev==null&&!quieto()){const b=$('bAterrizar');b.animate([{transform:'scale(1)'},{transform:'scale(1.05)'},{transform:'scale(1)'}],{duration:420,easing:'ease-out'});}
}
function aterrizar(){
 if(J.fase!=='elegir'||J.sel==null)return;
 const R=ronda(),o=J.sel;J.fase='bajando';J.t0=performance.now();
 AU.sfx('despegue');AU.respirar();AU.anticipar(false);
 const x=R.op[o].x!=null?(J.px!=null?J.px:Math.round(R.op[o].x*255)):-1,y=R.op[o].x!=null?(J.py!=null?J.py:Math.round(R.op[o].y*255)):-1;
 const antes=EST.racha();
 J.d.rondas[J.r]={o,x:esMapa(R)?x:-1,y:esMapa(R)?y:-1,ts:Date.now(),env:J.modo==='hoy'?0:3};guardarD();
 if(J.modo==='hoy'){
  EST.guardarHist(J.fecha,{j:1});
  const p=EST.perfil();p.brujula[GEN.dominante(R.rasgos[o])]++;const rc=EST.racha();if(rc>p.mejorRacha)p.mejorRacha=rc;EST.guardarPerfil(p);
  J.subioRacha=rc>antes;
  const fecha=J.fecha,n=J.r+1;
  RED.votar({fecha,ronda:n,opcion:o,x:esMapa(R)?x:-1,y:esMapa(R)?y:-1,lang:L});
 }
 $('bSaltar').hidden=true;pintarBoton();
 if(quieto())tocarSuelo();
}
function saltarAnim(){if(J.fase==='bajando'){J.t0=performance.now()-2000;}}
function puntoAstro(){const R=ronda();
 if(esMapa(R))return MAPA.geom(R,J.sel,J.box);
 const b=$('lista').querySelectorAll('.plat')[J.sel];if(!b)return {x:J.W/2,y:J.H/2,r:30};
 const a=$('area').getBoundingClientRect(),r=b.getBoundingClientRect(),rr=Math.min(r.width*.36,r.height)*.42,ha=Math.max(34,Math.min(70,rr*1.6));return {x:r.left-a.left+r.width*.77,y:r.top-a.top+Math.max(r.height*.5,r.height-12-ha*.42),r:rr};}
function tocarSuelo(){
 J.fase='posado';J.tPos=performance.now();
 const g=puntoAstro();if(!quieto()){MAPA.rafaga(g.x,g.y+g.r*.35,22,'rgba(214,204,240,',95,.8);J.shake=performance.now();}
 vib(20);AU.sfx('suelo');
 if(!esMapa(ronda()))$('lista').querySelectorAll('.plat').forEach((b,k)=>b.classList.toggle('otra',k!==J.sel));
 setTimeout(()=>{if(base!=='ronda')return;AU.sfx('registrado');mostrarResultado(true);if(J.subioRacha){J.subioRacha=false;setTimeout(()=>AU.sfx('racha'),350);}},260);
 pintarBoton();pintarRonda();
}
/* Coincidencia provisional de una ronda jugada (datos del voto o del estado; si no hay, práctica). */
function provRonda(i,datosEstado){
 const R=J.dia.rondas[i],g=J.d.rondas[i];if(!g||g.o==null)return null;
 let real=null,contado=false;
 const es=datosEstado&&datosEstado.rondas&&datosEstado.rondas[i];
 if(es&&es.conteos){real=es;contado=g.env===2;}else if(g.prov){real=g.prov;contado=true;}
 return EST.puntuar(R,g.o,real,contado,false);
}
function mostrarResultado(sonar){
 const g=J.d.rondas[J.r],R=ronda();if(!g||g.o==null)return;
 const el=$('rRes'),tx=$('rResT');el.hidden=false;
 if(J.modo==='ensayo'){
  const big=2,ok=g.o===big,p=Math.round(R.practica[big]/2),pm=Math.round(R.practica[g.o]/2);
  EST.guardar('tut',1);
  tx.innerHTML='<b>'+esc(t('rehearsalDone'))+'</b> · '+esc(t('rehearsalData'))+'<br>'+esc(t('ownChoice',{'opción':etiquetaOp(R,g.o),porcentaje:pm}))+'<br>'+esc(t('majority',{'mayoría':etiquetaOp(R,big),'porcentajeMayoría':p}))+'<br>'+esc(ok?t('tutOk'):t('tutNo'))+' · '+esc(t('practiceRivals',{n:R.practica.reduce((a,b)=>a+b,0)}));
  J.tut={t0:performance.now()};if(sonar){setTimeout(()=>AU.sfx(ok?'sincronia':'cuenta'),900);if(ok){const p2=EST.perfil();if(!p2.cuaderno[0]){p2.cuaderno[0]=1;EST.guardarPerfil(p2);setTimeout(()=>{if(base==='ronda')toastAccion(t('cardNew',{c:t('cards')[0][0]}),t('seeNotebook'),()=>mostrar('perfil'));},1700);}}}
  pintarBoton();return;
 }
 const pr=provRonda(J.r);const pc=Math.round(pr.cuota*100);
 let linea=esc(t('registered'))+' · '+esc(pr.mezcla?t('soFarPractice',{p:'\u0001'}):t('soFar',{p:'\u0001'})).replace('\u0001','<b class="cifra">'+pc+'</b>');
 if(J.modo==='archivo')linea=t('registered');
 if(g.env===0&&J.modo==='hoy'&&RED.ok===false)linea+='<br><span style="color:var(--dim)">'+t('queued')+'</span>';
 if(g.env===-1)linea+='<br><span style="color:var(--dim)">'+t('lateLanding')+'</span>';
 tx.innerHTML=linea;
 if(sonar&&J.modo!=='archivo')setTimeout(()=>AU.sfx('coincide',pr.cuota<.15?1:pr.cuota<.3?2:pr.cuota<.45?3:4),300);
 pintarBoton();if(sonar&&EST.prefs.auto)programarAuto();
}
function programarAuto(){cancelarAuto();const bar=$('barAuto');if(!bar)return;const t0=performance.now(),DUR=2500;
 J.auto=requestAnimationFrame(function paso(){const k=(performance.now()-t0)/DUR;if(base!=='ronda'||modales.length||J.fase!=='posado'){cancelarAuto();return;}
  bar.style.width=(Math.min(1,k)*100)+'%';if(k>=1){J.auto=null;siguiente();return;}J.auto=requestAnimationFrame(paso);});}
function cancelarAuto(){if(J.auto){cancelAnimationFrame(J.auto);J.auto=null;}const b=$('barAuto');if(b)b.style.width='0';}
function siguiente(){
 cancelarAuto();
 if(J.modo==='ensayo'){EST.guardar('tut',1);RED.metrica('ensayo_fin');empezarDia('hoy',EST.hoy());return;}
 AU.sfx('paso');$('rRes').hidden=true;
 if(J.r>=6){finDia();return;}
 entrarRonda(J.r+1);
}
$('bAterrizar').addEventListener('click',()=>{if(J.fase==='elegir')aterrizar();else if(J.fase==='posado')siguiente();});
$('bSaltar').addEventListener('click',()=>{EST.guardar('tut',1);mostrar('inicio');});
$('bRepetir').addEventListener('click',()=>{EST.guardar('tut',1);empezarDia('ensayo',EST.hoy());});
$('bMenu').addEventListener('click',()=>{EST.guardar('tut',1);mostrar('inicio');});

function finDia(){
 if(J.modo==='hoy'){RED.metrica('dia_fin');AU.sfx('dia');mostrarLectura(J.fecha);}
 else if(J.modo==='archivo'){mostrarRevela(J.fecha,'archivo');}
 else mostrar('inicio');
}

/* ---------- entrada sobre el mapa ---------- */
const cv=$('cv');let toqueIni=null;
function posEn(e,el){const r=el.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
cv.addEventListener('pointerdown',e=>{if(!J.dia||!esMapa(ronda()))return;toqueIni={x:e.clientX,y:e.clientY,t:performance.now(),tipo:e.pointerType};if(J.fase==='bajando')saltarAnim();});
cv.addEventListener('pointerup',e=>{
 if(!toqueIni||!J.box)return;const ti=toqueIni;toqueIni=null;if(Math.hypot(e.clientX-ti.x,e.clientY-ti.y)>14)return;
 if(J.fase!=='elegir')return;
 const [px,py]=posEn(e,cv);const i=MAPA.elegirEn(ronda(),J.box,px,py);
 if(i<0){J.onda={x:px,y:py,t:performance.now()};AU.sfx('tic',0);return;}
 elegir(i,'toque',px,py);
});
cv.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!J.box||J.fase!=='elegir'||!esMapa(ronda()))return;const [px,py]=posEn(e,cv);const i=MAPA.elegirEn(ronda(),J.box,px,py);
 if(i!==J.hover){J.hover=i<0?null:i;if(i>=0)AU.sfx('tic',i);}cv.style.cursor=i>=0?'pointer':'default';});
cv.addEventListener('pointerleave',()=>{J.hover=null;});
cv.addEventListener('contextmenu',e=>e.preventDefault());

/* ---------- teclado ---------- */
addEventListener('keydown',e=>{
 if(e.repeat&&(e.key==='Enter'||e.key===' '))return;
 const k=e.key,tg=e.target&&e.target.closest?e.target:null;
 // campos de texto, sliders y selects conservan sus teclas
 if(tg&&tg.closest('input,textarea,select,[contenteditable="true"]')&&k!=='Escape')return;
 if(k==='Escape'){if(modales.length){e.preventDefault();cerrar();return;}if(base==='ronda'){e.preventDefault();abrir('pausa');return;}if(base!=='inicio'){e.preventDefault();mostrar('inicio');}return;}
 if(modales.length)return;
 // RSP-NATIVE-KEYS-01: Enter/Espacio sobre un botón o control enfocado activan ese control, no una orden del juego.
 // Las .plat son radios: Enter las selecciona (su click nativo), nunca confirma el aterrizaje.
 const enBoton=tg&&tg.closest('button,a[href],summary,[role="button"],[role="radio"],[role="switch"],.tog');
 if((k==='Enter'||k===' ')&&enBoton)return;
 if(base==='ronda'&&J.dia){
  const R=ronda(),n=R.op.length;
  if(k==='p'||k==='P'){e.preventDefault();abrir('pausa');return;}
  if(J.fase==='elegir'){
   if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(k)){e.preventDefault();const d=(k==='ArrowRight'||k==='ArrowDown')?1:-1;elegir(J.sel==null?(d>0?0:n-1):(J.sel+d+n)%n,'tecla');return;}
   if(/^[1-9]$/.test(k)&&+k<=n){e.preventDefault();elegir(+k-1,'tecla');return;}
   // Enter confirma sólo con el mapa enfocado de verdad (no foco heredado) y no en el mismo gesto que la selección
   if((k==='Enter'||k===' ')&&J.sel!=null&&document.activeElement===cv&&performance.now()-J.tSel>300){e.preventDefault();aterrizar();return;}
  }else if(J.fase==='bajando'&&(k==='Enter'||k===' ')){e.preventDefault();saltarAnim();}
  else if(J.fase==='posado'&&(k==='Enter'||k===' ')){e.preventDefault();siguiente();}
 }
 if(base==='revela'&&!RV.final){if(k==='ArrowRight'||k==='Enter'){e.preventDefault();rvIr(RV.r+1);}else if(k==='ArrowLeft'){e.preventDefault();rvIr(RV.r-1);}}
});

/* =====================================================================
   LECTURA TEMPRANA
   ===================================================================== */
let LE={fecha:null,est:null};
function mostrarLectura(fecha){LE={fecha,est:null};J.fecha=fecha;mostrar('lectura');
 RED.estado(fecha,true).then(e=>{if(LE.fecha===fecha&&e){LE.est=e;if(base==='lectura')pintarLectura();}});}
function resultadosDia(fecha,dia,d,est){
 return dia.rondas.map((R,i)=>{const g=d.rondas[i];if(!g||g.o==null)return null;
  let real=null,contado=false;const es=est&&est.rondas&&est.rondas[i];
  if(es&&es.conteos){real=es;contado=g.env===2;}else if(g.prov){real=g.prov;contado=true;}
  return EST.puntuar(R,g.o,real,contado,false);});}
function pintarLectura(){
 const f=LE.fecha;if(!f)return;const dia=GEN.generarDia(f),d=EST.dia(f),res=resultadosDia(f,dia,d,LE.est);
 const s=res.filter(r=>r&&r.sync).length,p=res.reduce((a,r)=>a+(r?r.pts:0),0),mezcla=res.some(r=>r&&r.mezcla);
 $('lKick').textContent=t('dayKick',{n:dia.n,f:fechaCorta(f)});
 $('lTit').innerHTML=t('early',{s:'<b>'+s+'</b>'});$('lPts').textContent=t('earlyPts',{p});
 $('lMinis').innerHTML=dia.rondas.map((R,i)=>{const r=res[i];return '<div class="mini'+(r&&r.sync?' si':'')+'"><canvas data-i="'+i+'"></canvas><b>'+(r?Math.round(r.cuota*100)+' %':'–')+'</b><span>'+t('rTypes')[R.tipo]+'</span></div>';}).join('');
 const nota=$('lNota');nota.hidden=!mezcla;const nr=Math.max(0,...res.map(r=>r?r.N:0));nota.textContent=mezcla?(RED.ok===false?t('offlineLong'):nr>=30?t('fewSome'):nr>0?t('few',{n:fmtN(nr),m:30-nr}):t('onlyPractice')+' · '+t('practiceRivals',{n:30})):'';
 {const z=fhz(proximaMedianoche());$('lDust').textContent=t('dust')+' · '+t('revealEnabled',{fecha:z.fecha,hora:z.hora,zona:z.zona});}
 EST.guardarHist(f,{j:1,s,p,prov:1,m:mezcla?1:0});
 const per=EST.perfil();if(p>per.record){per.record=p;EST.guardarPerfil(per);}
 const det=$('lPorque');if(!EST.leer('porque',0)){det.open=true;EST.guardar('porque',1);}
 requestAnimationFrame(()=>miniaturas($('lMinis'),dia,d,true));
 tickLectura();
}
function tickLectura(){if(base!=='lectura'||!LE.fecha)return;const f=LE.fecha,lista=f<EST.hoy();
 $('lReloj').hidden=lista;$('bLRevela').hidden=!lista;$('bCompartir').classList.toggle('pri',!lista);
 if(!lista)$('lCuenta').textContent=hms(aMedianoche());}
function miniaturas(cont,dia,d,cubrir){
 cont.querySelectorAll('canvas').forEach(c=>{const i=+c.dataset.i,R=dia.rondas[i],r=c.getBoundingClientRect(),s=Math.max(20,Math.floor(r.width));
  c.width=s*DPR;c.height=s*DPR;const x=c.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);x.clearRect(0,0,s,s);
  if(esMapa(R)){const g=d.rondas[i];MAPA.dibujar(x,{x:0,y:0,s},R,{t:0,lang:L,dpr:DPR,polvo:cubrir?1:null,hueco:cubrir&&g&&g.o!=null?[[R.op[g.o].x,R.op[g.o].y,.18]]:null,mio:g?g.o:null,marcarMio:!cubrir});}
  else{x.fillStyle='#120b26';MAPA.rr(x,0,0,s,s,8);x.fill();const k=R.op.length,c2=k<=4?2:k<=9?3:4,f2=Math.ceil(k/c2),cw=(s-8)/c2,ch=(s-8)/f2;
   R.op.forEach((o,j)=>{const cx=4+(j%c2)*cw,cy=4+Math.floor(j/c2)*ch;x.fillStyle=o.hex||'#2a1f4a';MAPA.rr(x,cx+2,cy+2,cw-4,ch-4,4);x.fill();
    if(d.rondas[i]&&d.rondas[i].o===j){x.strokeStyle='#fdd835';x.lineWidth=2;x.stroke();}});
   if(cubrir){x.fillStyle='rgba(90,50,170,.55)';x.fillRect(0,0,s,s);}}
 });}
$('bCompartir').addEventListener('click',()=>compartir(LE.fecha,false));
$('bLInicio').addEventListener('click',()=>mostrar('inicio'));
$('bLRevela').addEventListener('click',()=>mostrarRevela(LE.fecha,'hoy'));
$('bLBrujula').addEventListener('click',()=>mostrar('perfil'));

/* ---------- compartir ---------- */
function textoCompartir(fecha,final,res){
 const dia=GEN.generarDia(fecha);res=res||resultadosDia(fecha,dia,EST.dia(fecha),final?RV.est:LE.est);
 const s=res.filter(r=>r&&r.sync).length,mezcla=res.some(r=>r&&r.mezcla);
 return t('shareTitle',{n:dia.n})+'\n'+t('shareSync',{s})+(final?'':t('shareProv'))+(mezcla?t('sharePractice'):'')+'\n'+res.map(EST.luna).join('')+'\njetgames.fun/crater';
}
async function compartir(fecha,final,res){
 const txt=textoCompartir(fecha,final,res);RED.metrica('compartir');
 if(navigator.share&&('ontouchstart' in G)){try{await navigator.share({text:txt});AU.sfx('copiado');return;}catch(e){if(e&&e.name==='AbortError')return;}}
 let ok=false;try{await navigator.clipboard.writeText(txt);ok=true;}catch(e){}
 if(ok){AU.sfx('copiado');toast(t('copied'),1800);return;}
 // Sin portapapeles: el texto completo queda visible y seleccionable hasta que el jugador cierre.
 $('shTxt').value=txt;abrir('compartir',{foco:'#shTxt'});setTimeout(()=>{try{$('shTxt').select();}catch(e){}},60);
}
$('bShCopiar').addEventListener('click',async()=>{const ta=$('shTxt');ta.focus();ta.select();let ok=false;
 try{ok=document.execCommand('copy');}catch(e){}
 if(!ok){try{await navigator.clipboard.writeText(ta.value);ok=true;}catch(e){}}
 if(ok){AU.sfx('copiado');toast(t('copied'),1800);}});

/* =====================================================================
   REVELACIÓN
   ===================================================================== */
const RV={fecha:null,modo:null,dia:null,d:null,est:null,res:null,r:0,final:false,t0:0,anim:null,box:null,W:0,H:0,solo:false,nuevas:[]};
function mostrarRevela(fecha,modo){
 Object.assign(RV,{fecha,modo,dia:GEN.generarDia(fecha),d:modo==='archivo'?EST.leer('arch:'+fecha,{rondas:[]}):EST.dia(fecha),est:null,r:0,final:false,nuevas:[],solo:EST.prefs.soloReales});
 if(!RV.d.rondas)RV.d.rondas=[];
 calcularRV();mostrar('revela');rvIr(0,true);
 RED.metrica('revelacion_vista');
 RED.estado(fecha,true).then(e=>{if(RV.fecha!==fecha||!e)return;RV.est=e;calcularRV();if(base==='revela')rvIr(RV.final?7:RV.r,true);});
 if(modo==='hoy'){const d=EST.dia(fecha);d.visto=true;EST.guardarDia(fecha,d);}
}
function calcularRV(){
 RV.res=RV.dia.rondas.map((R,i)=>{const g=RV.d.rondas[i],es=RV.est&&RV.est.rondas&&RV.est.rondas[i];
  const real=es&&es.conteos?es:null,mi=g&&g.o!=null?g.o:null;const contado=!!(g&&g.env===2&&real);
  const r=EST.puntuar(R,mi,real,contado,RV.solo);r.jugada=mi!=null;r.mi=mi;r.calor=es&&es.calor?es.calor:null;return r;});
}
function estadoRV(){const fin=Date.now()>=GEN.cierreUTC(RV.fecha);return fin?t('finalRes'):t('provisional2');}
function tiempoRV(){const fin=Date.now()>=GEN.cierreUTC(RV.fecha);if(fin)return '';const z=fhz(GEN.cierreUTC(RV.fecha));return t('closesAt',{fecha:z.fecha,hora:z.hora,zona:z.zona});}
function rvIr(i,forzar){
 i=clamp(i,0,7);if(i===RV.r&&!forzar&&!(i===7&&!RV.final))return;
 RV.r=i;RV.final=i===7;
 $('rvKick').textContent=t('revealKick',{n:RV.dia.n});$('rvEstado').textContent=estadoRV();
 $('rvFinal').hidden=!RV.final;$('rvEscena').hidden=RV.final;
 if(RV.final){pintarFinalRV();return;}
 RV.t0=performance.now();RV.sonado={};AU.revelaPaso(i+1);
 const R=RV.dia.rondas[i];
 if(!esMapa(R))pintarListaR();else $('rvLista').innerHTML='';
 medir();prepararCalor();pintarRevela(false);
 if(!quieto())AU.sfx('polvo');
 guardarVista();
}
function prepararCalor(){
 const R=RV.dia.rondas[RV.r],res=RV.res[RV.r];RV.calor=null;RV.lluvia=null;if(!esMapa(R))return;
 const real=[];if(res.calor)res.calor.forEach(([c,n])=>real.push([(c%48+.5)/48,(Math.floor(c/48)+.5)/48,n]));
 const verPract=res.N<30&&!(RV.solo&&res.N>0);
 const pts=GEN.puntosPractica(RV.fecha,R);
 RV.calor={real:real.length?MAPA.capaCalor(real,true):null,practica:verPract?MAPA.capaCalor(pts.map(p=>[p[0],p[1],1]),false,!!real.length):null};
 // lluvia: hasta 600 puntos, reales primero
 const ll=[];real.forEach(([x,y,n])=>{for(let k=0;k<Math.min(n,40);k++)ll.push({x:x+(Math.random()-.5)/48,y:y+(Math.random()-.5)/48,real:1});});
 if(verPract)pts.forEach(p=>ll.push({x:p[0],y:p[1],real:0}));
 while(ll.length>600)ll.splice(Math.floor(Math.random()*ll.length),1);
 ll.forEach(p=>{p.d=.35+Math.random()*1.05;p.k=0;});RV.lluvia=ll;
}
function pintarListaR(){
 const R=RV.dia.rondas[RV.r],res=RV.res[RV.r],l=$('rvLista');
 l.innerHTML=R.op.map((o,i)=>{const inner=o.hex?'<span class="baliza" style="--c:'+o.hex+'"></span>':o.v!=null?'<span class="n">'+o.v+'</span>':'<span class="w">'+o[L]+'</span>';
  return '<div class="plat'+(res.mi===i?' mia':'')+'" data-i="'+i+'" aria-label="'+etiquetaOp(R,i)+'"><i class="pct"></i>'+(res.mi===i?'<span class="mio">'+t('yourPick').toUpperCase()+'</span>':'')+'<span class="pctT">0 %</span>'+inner+'</div>';}).join('');
 maquetarListaR();
}
function maquetarListaR(){const l=$('rvLista');const a=document.querySelector('#sRevela .lienzo');if(!a.clientWidth)return;const R=RV.dia.rondas[RV.r];const gap=W<420?8:10;
 aplicarRejilla(l,rejillaPara(R.op.length,a.clientWidth-2,a.clientHeight-2,gap),gap);}
function lineaGanador(R,res){
 const w=res.ganadores[0],dom=GEN.dominante(R.rasgos[w]),clave=['unico','centro','mayor','primero','tipico','cuenta'][dom];
 const grupo=(R.tipo==='luna'||R.tipo==='planeta'||R.tipo==='gran')?'mapa':R.tipo;const o=R.op[w];
 const m=o.mod?BAN.MOD.find(q=>q.id===o.mod)[L]:'';
 return t('winLine')[grupo][clave].replace('{rasgo}',o.rasgo?t('rasgos')[o.rasgo]:'').replace('{v}',o.v!=null?o.v:'').replace('{w}',o[L]||'').replace('{m}',m);
}
function pintarRevela(soloTexto){
 if(!RV.dia||!RV.res)return;if(RV.final){pintarFinalRV();return;}
 const R=RV.dia.rondas[RV.r],res=RV.res[RV.r];
 $('rvKick').textContent=t('revealKick',{n:RV.dia.n});$('rvEstado').textContent=estadoRV();
 $('rvRonda').textContent=t('roundKick',{r:RV.r+1,tipo:t('rTypes')[R.tipo]});
 const v=$('rvVer');v.className='veredicto';v.textContent='';$('rvLinea').textContent='';
 // Respuestas registradas y rivales simulados son unidades distintas; cada una se muestra sólo si existe.
 $('rvPocos').textContent=res.N>=30?t('realResponses',{n:fmtN(res.N)}):res.N>0?t('few',{n:fmtN(res.N),m:30-res.N}):(RV.est?t('noReal')+' · '+t('practiceRivals',{n:30}):(RED.ok===false?t('offlineLong'):t('onlyPractice')+' · '+t('practiceRivals',{n:30})));
 $('rvTiempo').textContent=tiempoRV();
 const ley=$('rvLey');const gan=ganadoresVista(res);
 ley.innerHTML=(esMapa(R)?('<span><i style="background:#00f2cf"></i>'+t('realLegend')+'</span>'+(res.N<30?'<span><i style="background:#9a6bff;opacity:.7"></i>'+t('practiceLegend')+'</span>':'')):'')+
  (res.jugada?'<span><i style="background:transparent;border:2px dotted var(--yellow)"></i>'+esc(t('yourPick'))+'</span>':'')+
  (gan.length?'<span><i style="background:transparent;border:2px solid var(--cyan)"></i>'+esc(gan.length>1?t('mostChosenTie'):t('mostChosen'))+'</span>':'');
 $('rvSolo').hidden=!(res.N>0&&res.N<30);$('tSoloR').classList.toggle('on',RV.solo);
 $('bRvAnt').disabled=RV.r===0;$('bRvSig').textContent=RV.r>=6?t('rvFin'):t('nextR');
 if(soloTexto)rvTextos(true);
}
/* Más elegidos según los porcentajes que se muestran (filtro «solo reales» incluido); con el filtro vacío no hay mayoría. */
function ganadoresVista(res){if(RV.solo&&res.N===0)return [];const pv=RV.solo&&res.N>0?res.pv:res.p;const mx=Math.max.apply(null,pv);return pv.map((v,i)=>v>=mx-1e-9?i:-1).filter(i=>i>=0);}
function rvTextos(ya){
 const R=RV.dia.rondas[RV.r],res=RV.res[RV.r],v=$('rvVer'),pv=RV.solo&&res.N>0?res.pv:res.p;
 if(res.jugada){v.textContent=res.sync?t('inSync'):t('ownWay',{p:Math.round(pv[res.mi]*100)});v.classList.toggle('si',res.sync);}
 else v.textContent=RV.modo==='espectador'?t('spectator'):t('notPlayed');
 const lin=[];const gan=ganadoresVista(res);
 if(res.jugada)lin.push(t('ownChoice',{'opción':etiquetaOp(R,res.mi),porcentaje:Math.round(pv[res.mi]*100)}));
 if(gan.length===1)lin.push(t('majority',{'mayoría':etiquetaOp(R,gan[0]),'porcentajeMayoría':Math.round(pv[gan[0]]*100)}));
 else if(gan.length>1)lin.push(t('mostChosenTie')+': '+gan.map(i=>etiquetaOp(R,i)).join(' · ')+' · '+Math.round(pv[gan[0]]*100)+' %');
 lin.push(lineaGanador(R,res));
 $('rvLinea').innerHTML=lin.map(x=>'<div>'+esc(x)+'</div>').join('');
}
function pintarFinalRV(){
 const res=RV.res,s=res.filter(r=>r.jugada&&r.sync).length,p=res.reduce((a,r)=>a+(r.jugada?r.pts:0),0),jug=res.some(r=>r.jugada);
 const fin=Date.now()>=GEN.cierreUTC(RV.fecha);
 // historial (solo días reales) y Cuaderno
 if(RV.modo==='hoy'&&jug){EST.guardarHist(RV.fecha,{j:1,s,p,prov:fin?0:1});const per=EST.perfil();if(p>per.record)per.record=p;EST.guardarPerfil(per);}
 if(RV.modo==='archivo'&&jug){const a=EST.leer('archres',{});a[RV.fecha]={s,p};EST.guardar('archres',a);}
 const avg=EST.mediaSync(30);
 const fc=$('rvFinal');
 fc.innerHTML='<div class="kick">'+t('dayKick',{n:RV.dia.n,f:fechaCorta(RV.fecha)})+'</div>'+
  (jug?'<h2 class="titular">'+t('finalTitle',{s:'<b>'+s+'</b>'})+'</h2><div class="sub">'+t('finalPts',{p})+(RV.modo==='hoy'&&avg!=null?' · '+t('avgChange',{a:fmt1(avg)}):'')+(RV.modo==='archivo'?' · '+t('archiveNote'):'')+'</div>':'<h2 class="titular" style="font-size:24px">'+t('spectator')+'</h2>')+
  '<div class="minis" id="rvMinis">'+RV.dia.rondas.map((R,i)=>{const r=res[i];return '<div class="mini'+(r.jugada&&r.sync?' si':'')+'"><canvas data-i="'+i+'"></canvas><b>'+(r.jugada?Math.round(r.cuota*100)+' %':'–')+'</b><span>'+t('rTypes')[R.tipo]+'</span></div>';}).join('')+'</div>'+
  (RV.nuevas.length?'<div class="chips">'+RV.nuevas.map(c=>'<span class="chip amar">★ '+t('cards')[c][0]+'</span>').join('')+'</div>':'')+
  (jug?'<button class="btn pri" id="bRvShare">'+t('share')+'</button>':'')+
  '<div class="fila" style="width:100%"><button class="btn" id="bRvVolver">'+t('prevR')+'</button><button class="btn'+(jug?'':' pri')+'" id="bRvInicio">'+(RV.modo==='hoy'||RV.modo==='espectador'?t('playToday'):t('home'))+'</button></div>';
 const sh=$('bRvShare');if(sh)sh.onclick=()=>compartir(RV.fecha,fin,res.map(r=>r.jugada?r:null));
 $('bRvVolver').onclick=()=>rvIr(6);
 $('bRvInicio').onclick=()=>{if(RV.modo==='hoy'||RV.modo==='espectador')jugarHoy();else mostrar('inicio');};
 requestAnimationFrame(()=>miniaturas($('rvMinis'),RV.dia,RV.d,false));
 AU.revelaFin(jug&&s>=5);
 if(!RV.sonadoFinal&&jug){RV.sonadoFinal=true;AU.sfx(s>=5?'dia':'cuenta');}
}
$('bRvAnt').addEventListener('click',()=>rvIr(RV.r-1));
$('bRvSig').addEventListener('click',()=>rvIr(RV.r+1));
$('bRvTodo').addEventListener('click',()=>{RV.sonadoFinal=false;rvIr(7);});
$('tSoloR').addEventListener('click',()=>{RV.solo=!RV.solo;EST.prefs.soloReales=RV.solo;EST.guardarPrefs();AU.sfx(RV.solo?'on':'off');calcularRV();prepararCalor();pintarRevela(true);if(!esMapa(RV.dia.rondas[RV.r]))actualizarBarras(1);});
$('cvR').addEventListener('pointerdown',()=>{RV.t0-=3000;});
function actualizarBarras(k){const res=RV.res[RV.r],pv=RV.solo&&res.N>0?res.pv:res.p,mx=Math.max.apply(null,pv);
 $('rvLista').querySelectorAll('.plat').forEach((b,i)=>{b.querySelector('.pct').style.height=(k>0?pv[i]/Math.max(.01,mx)*100:0)+'%';b.querySelector('.pctT').textContent=Math.round(pv[i]*100*Math.min(1,k))+' %';});}
function desbloquear(){
 if(RV.modo==='espectador')return;const res=RV.res[RV.r];if(!res.jugada||!res.sync)return;
 const c=EST.tarjeta(RV.dia.rondas[RV.r],res.mi);if(c==null)return;const p=EST.perfil();if(p.cuaderno[c])return;
 p.cuaderno[c]=1;EST.guardarPerfil(p);RV.nuevas.push(c);setTimeout(()=>{if(base!=='revela')return;AU.sfx('tarjeta');toastAccion(t('cardNew',{c:t('cards')[c][0]}),t('seeNotebook'),()=>mostrar('perfil'));},500);
}
/* línea de tiempo de una lámina de revelación */
function animRV(c,now){
 const R=RV.dia.rondas[RV.r],res=RV.res[RV.r],e=(now-RV.t0)/1000,q=quieto(),box=RV.box;if(!box)return;
 const T=q?{polvo:.01,lluvia:.01,calor:.3,pct:.31,corona:.32,astro:.33}:{polvo:1.1,lluvia:1.8,calor:1.9,pct:2.3,corona:2.4,astro:2.7};
 const kp=clamp(e/T.polvo,0,1),cubre=q?(e<.3?1-e/.3:0):1-ease(kp);
 if(RV.lluvia)RV.lluvia.forEach(p=>{p.k=q?2:clamp((e-p.d)/.6,0,2);if(!q&&p.k>0&&p.k<1&&!p.son&&Math.random()<.01){p.son=1;AU.sfx('gota');}});
 const kc=clamp((e-.6)/(T.calor-.6),0,1);
 const kpct=clamp((e-T.pct+.8)/.8,0,1);
 const pv=RV.solo&&res.N>0?res.pv:res.p;
 if(esMapa(R)){
  const pct=kpct>0?pv.map(v=>Math.round(v*100*ease(kpct))):null;
  MAPA.dibujar(c,box,R,{t:now/1000,lang:L,dpr:DPR,calor:RV.calor,calorA:q?1:kc,lluvia:q?null:RV.lluvia,polvo:cubre>0?cubre:null,pct,ganadores:e>=T.corona?res.ganadores:null,coronaA:clamp((e-T.corona)/.4,0,1),
   astro:res.jugada&&e>=T.astro?{i:res.mi,fase:'posado'}:null,mio:res.mi,marcarMio:res.jugada&&e>=T.astro});
 }else{
  if(!RV.sonado.barras&&e>=T.polvo*.6){RV.sonado.barras=1;actualizarBarras(1);}
  if(kpct>0&&!RV.sonado.pctFin){if(kpct>=1)RV.sonado.pctFin=1;$('rvLista').querySelectorAll('.pctT').forEach((el,i)=>el.textContent=Math.round(pv[i]*100*ease(kpct))+' %');}
  if(e>=T.corona&&!RV.sonado.gana){$('rvLista').querySelectorAll('.plat').forEach((b,i)=>b.classList.toggle('gana',res.ganadores.includes(i)));}
  if(cubre>0){c.save();c.globalAlpha=cubre*.92;c.fillStyle='#3a2470';c.fillRect(0,0,RV.W,RV.H);c.restore();}
 }
 if(e>=T.corona&&!RV.sonado.corona){RV.sonado.corona=1;AU.sfx('corona');}
 if(e>=T.astro&&!RV.sonado.ver){RV.sonado.ver=1;rvTextos();
  if(res.jugada){AU.sfx(res.sync?'sincronia':'cuenta');if(res.sync){vib(25);if(!q){const g=esMapa(R)?MAPA.geom(R,res.mi,box):(()=>{const b=$('rvLista').querySelectorAll('.plat')[res.mi],a=$('cvR').getBoundingClientRect(),r=b.getBoundingClientRect();return {x:r.left-a.left+r.width/2,y:r.top-a.top+r.height/2};})();MAPA.confeti(g.x,g.y,36);}}desbloquear();}}
}

/* =====================================================================
   INICIO
   ===================================================================== */
let puntosLuna=null,jugadoresHoy=null;
function jugarHoy(){const f=EST.hoy();if(!EST.leer('tut',0)){empezarDia('ensayo',f);return;}const d=EST.dia(f);if(EST.jugadas(d)>=7)mostrarLectura(f);else empezarDia('hoy',f);}
function pintarInicio(){
 const f=EST.hoy(),n=GEN.diaN(f),d=EST.dia(f),k=EST.jugadas(d);
 $('iKick').textContent=t('dayKick',{n,f:fechaCorta(f)});
 const pr=d.rondas.findIndex(x=>!x||x.o==null);
 if(k>=7){$('bJugarT').textContent=t('seeToday');$('bJugarS').textContent=t('seeTodaySub',{t:hms(aMedianoche())});}
 else if(k>0){$('bJugarT').textContent=t('resume',{r:pr+1});$('bJugarS').textContent=t('resumeSub');}
 else{$('bJugarT').textContent=t('play',{n});$('bJugarS').textContent=t('playSub');}
 // tarjeta de revelación
 const ay=GEN.sumar(f,-1),h=EST.hist(),tR=$('tRevela'),ic=$('tRevelaIc');let tit,sub,accion=null,vivo=false;
 if(GEN.dias(ay)<GEN.dias(GEN.EPOCH)){if(k>0){const z=fhz(proximaMedianoche());tit=t('firstReveal');sub=t('revealEnabled',{fecha:z.fecha,hora:z.hora,zona:z.zona})+' · '+hms(aMedianoche());}else{tit=t('launchDay');sub=t('launchDaySub');}}
 else if(h[ay]&&h[ay].j){tit=t('revealReady');sub=t('revealReadySub');accion=()=>mostrarRevela(ay,'hoy');vivo=!EST.dia(ay).visto;}
 else{tit=t('revealSpect');sub=t('revealSpectSub');accion=()=>mostrarRevela(ay,'espectador');}
 $('tRevelaT').textContent=tit;$('tRevelaS').textContent=sub;ic.classList.toggle('vivo',vivo);tR.classList.toggle('quieta',!accion);tR.onclick=accion;tR.disabled=!accion;
 // fichas
 const rc=EST.racha(),avg=EST.mediaSync(30);let ch='<span class="chip">🔥 '+t('streak',{n:'<b>'+rc+'</b>'})+'</span>';
 if(avg!=null)ch+='<span class="chip">'+t('syncAvg',{s:'<b>'+fmt1(avg)+'</b>'})+'</span>';
 if(jugadoresHoy!=null)ch+='<span class="chip">'+(jugadoresHoy>=30?t('playersToday',{n:'<b>'+fmtN(jugadoresHoy)+'</b>'}):t('fewToday'))+'</span>';
 $('chips').innerHTML=ch;pintarFsBotones();
 if(!puntosLuna){const D=GEN.generarDia(ay);puntosLuna=GEN.puntosPractica(ay,D.rondas[0]).filter((_,i)=>i%2===0).map(p=>{const x=(p[0]-.5)*1.6,y=(p[1]-.5)*1.6;return [Math.atan2(y,x),Math.min(.95,Math.hypot(x,y))];});}
}
$('bJugar').addEventListener('click',jugarHoy);
$('bComo').addEventListener('click',()=>abrir('como'));
$('bArchivo').addEventListener('click',()=>mostrar('archivo'));
$('bPerfil').addEventListener('click',()=>mostrar('perfil'));
$('bAjustes2').addEventListener('click',()=>abrir('ajustes'));
$('bAjustes').addEventListener('click',()=>abrir('ajustes'));
$('bPausa').addEventListener('click',()=>abrir('pausa'));
$('bPantalla').addEventListener('click',pantallaCompleta);$('bPantalla2').addEventListener('click',pantallaCompleta);
document.querySelectorAll('[data-volver]').forEach(b=>b.addEventListener('click',volver));
$('bSeguir').addEventListener('click',()=>cerrar());
$('bPComo').addEventListener('click',()=>abrir('como'));
$('bPAjustes').addEventListener('click',()=>abrir('ajustes'));
$('bPInicio').addEventListener('click',()=>{cerrarTodo();mostrar('inicio');});

/* ---------- archivo ---------- */
function pintarArchivo(){
 const hoy=EST.hoy(),h=EST.hist(),ar=EST.leer('archres',{}),l=[];
 for(let f=GEN.sumar(hoy,-1);GEN.dias(f)>=GEN.dias(GEN.EPOCH)&&l.length<400;f=GEN.sumar(f,-1)){if(Date.now()>=GEN.cierreUTC(f))l.push(f);}
 const c=$('aDias');
 if(!l.length){c.innerHTML='<div class="vacio">'+t('archiveEmpty')+'</div>';return;}
 c.innerHTML=l.map(f=>{const n=GEN.diaN(f),hh=h[f],a=ar[f];const est=hh&&hh.j&&hh.s!=null?'<em>'+t('archiveSeen',{s:hh.s})+'</em>':a?'<em>'+t('archiveDone',{s:a.s})+'</em>':'<em>'+t('archivePlay')+' ›</em>';
  return '<button class="dia" data-f="'+f+'"><span>'+t('dayLabel',{n})+' <small>· '+fechaCorta(f)+'</small></span>'+est+'</button>';}).join('');
}
$('aDias').addEventListener('click',e=>{const b=e.target.closest('.dia');if(!b)return;const f=b.dataset.f,h=EST.hist();AU.sfx('ui');
 if(h[f]&&h[f].j)mostrarRevela(f,'hoy');else{const a=EST.leer('arch:'+f,null);if(a&&a.rondas.filter(x=>x&&x.o!=null).length>=7)mostrarRevela(f,'archivo');else empezarDia('archivo',f);}});

/* ---------- perfil ---------- */
let BRU={t0:0};
function pintarPerfil(){
 const p=EST.perfil(),h=EST.hist(),hoy=EST.hoy(),rc=EST.racha(),avg=EST.mediaSync(30),dj=Object.values(h).filter(x=>x.j).length;
 $('pStats').innerHTML=[[rc,t('streak',{n:''}).trim()],[Math.max(rc,p.mejorRacha),t('bestStreak')],[p.record,t('record')],[avg!=null?fmt1(avg):'–',t('avg30')],[dj,t('days')]].map(([v,k])=>'<div class="stat"><b>'+v+'</b><span>'+k+'</span></div>').join('');
 // sincronía por posición de ronda (últimos 30 días)
 const pos=[0,0,0,0,0,0,0];let dias=0;
 for(let i=0;i<30;i++){const f=GEN.sumar(hoy,-i);if(!(h[f]&&h[f].j))continue;const d=EST.dia(f),dia=GEN.generarDia(f);dias++;
  const est=EST.leer('est:'+f,null);resultadosDia(f,dia,d,est).forEach((r,k)=>{if(r&&r.sync)pos[k]++;});}
 $('pBarras').innerHTML=pos.map((v,i)=>'<div><i style="height:'+(dias?Math.max(3,v/dias*100):3)+'%"></i><span>R'+(i+1)+'</span></div>').join('');
 $('pCuaderno').innerHTML=t('cards').map((c,i)=>p.cuaderno[i]?'<div class="carta"><canvas data-c="'+i+'"></canvas><b>'+c[0]+'</b><span>'+c[1]+'</span></div>':'<div class="carta bloq"><canvas data-c="'+i+'" data-b="1"></canvas><b>'+t('locked')+'</b></div>').join('');
 requestAnimationFrame(()=>{$('pCuaderno').querySelectorAll('canvas').forEach(dibCarta);});
 const tot=p.brujula.reduce((a,b)=>a+b,0);$('pBrujulaTxt').textContent=t('axes').map((a,i)=>a+': '+(tot?Math.round(p.brujula[i]/tot*100):0)+' %').join(', ');
 BRU={t0:performance.now(),v:p.brujula};
}
function dibCarta(c){const i=+c.dataset.c,bl=c.dataset.b==='1',r=c.getBoundingClientRect(),w=r.width,h=r.height;c.width=w*DPR;c.height=h*DPR;const x=c.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);
 x.fillStyle='#0b0620';x.fillRect(0,0,w,h);x.globalAlpha=bl?.25:1;
 const cr=(cx,cy,rad,col,borde)=>{x.fillStyle=col||'#1a1526';x.beginPath();x.arc(cx,cy,rad,0,7);x.fill();x.strokeStyle=borde||'#8e84ad';x.lineWidth=1.5;x.stroke();};
 const tx=(s,col,fs)=>{x.fillStyle=col||'#f5f0ff';x.font='800 '+(fs||h*.42)+'px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(s,w/2,h/2);};
 if(bl){x.fillStyle='#3a2f5c';x.beginPath();x.arc(w/2,h/2,h*.3,0,7);x.fill();x.globalAlpha=1;return;}
 const A=[()=>{cr(w*.2,h*.3,h*.08);cr(w*.78,h*.7,h*.09);cr(w*.5,h*.5,h*.3,null,'#00f2cf');},
  ()=>{cr(w*.25,h*.5,h*.15);cr(w*.75,h*.5,h*.15);cr(w*.5,h*.5,h*.15,'#0b1a26','#c9fbff');},
  ()=>{cr(w*.18,h*.25,h*.1);cr(w*.82,h*.75,h*.1);cr(w*.5,h*.5,h*.13,null,'#00f2cf');x.strokeStyle='rgba(0,242,207,.4)';x.setLineDash([3,3]);x.beginPath();x.moveTo(w/2,0);x.lineTo(w/2,h);x.moveTo(0,h/2);x.lineTo(w,h/2);x.stroke();x.setLineDash([]);},
  ()=>{cr(w*.5,h*.55,h*.14);cr(w*.72,h*.45,h*.12);cr(w*.12,h*.2,h*.1,null,'#00f2cf');},
  ()=>tx('7','#00f2cf'),()=>tx('100','#00f2cf',h*.34),
  ()=>{['#2b6cff','#e8243c','#2fb35a'].forEach((col,k)=>{x.fillStyle=col;x.beginPath();x.arc(w*(.25+k*.25),h/2,h*.17,0,7);x.fill();});},
  ()=>{['#f4b8c2','#b9d7f2','#d42828','#c4ecc8'].forEach((col,k)=>{x.fillStyle=col;x.beginPath();x.arc(w*(.2+k*.2),h/2,h*.13,0,7);x.fill();});},
  ()=>tx('Aa','#00f2cf',h*.38),
  ()=>{x.strokeStyle='#3d2f6b';x.lineWidth=5;[[.2,.25],[.8,.25],[.2,.75],[.8,.75]].forEach(([a,b])=>{x.beginPath();x.moveTo(w/2,h/2);x.lineTo(w*a,h*b);x.stroke();});
   [[.2,.25],[.8,.25],[.2,.75],[.8,.75]].forEach(([a,b])=>{x.fillStyle='#2e2356';MAPA.rr(x,w*a-9,h*b-7,18,14,3);x.fill();});x.fillStyle='#00f2cf';MAPA.rr(x,w/2-12,h/2-9,24,18,4);x.fill();},
  ()=>{x.fillStyle='#2e2356';MAPA.rr(x,w*.15,h*.4,w*.2,h*.25,3);x.fill();MAPA.rr(x,w*.65,h*.4,w*.2,h*.25,3);x.fill();x.strokeStyle='#00f2cf';x.lineWidth=2;x.beginPath();x.arc(w/2,h*.55,h*.2,Math.PI,0);x.stroke();x.fillStyle='rgba(0,242,207,.25)';x.fill();},
  ()=>{for(let k=0;k<5;k++){x.fillStyle=k===0?'#00f2cf':'#2e2356';MAPA.rr(x,w*.08+k*w*.17,h*.38,w*.13,h*.24,3);x.fill();}}];
 (A[i]||(()=>{}))();x.globalAlpha=1;}
function dibBrujula(now){
 const c=$('cvBrujula');if(!c||base!=='perfil')return;const r=c.getBoundingClientRect(),s=r.width,hh=r.height;if(!s)return;if(c.width!==Math.round(s*DPR)){c.width=Math.round(s*DPR);c.height=Math.round(hh*DPR);}
 const x=c.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);x.clearRect(0,0,s,hh);
 const k=quieto()?1:ease(clamp((now-BRU.t0)/900,0,1)),cx=s/2,cy=hh/2,R=Math.min(s*.22,hh*.36),v=BRU.v||[0,0,0,0,0,0],mx=Math.max(1,Math.max.apply(null,v));
 x.strokeStyle='rgba(181,168,216,.22)';x.lineWidth=1;for(let a=1;a<=3;a++){x.beginPath();for(let i=0;i<=6;i++){const an=-Math.PI/2+i/6*Math.PI*2,rr2=R*a/3;x.lineTo(cx+Math.cos(an)*rr2,cy+Math.sin(an)*rr2);}x.stroke();}
 x.beginPath();for(let i=0;i<=6;i++){const an=-Math.PI/2+i/6*Math.PI*2,rr2=R*(.08+.92*(v[i%6]/mx))*k;x.lineTo(cx+Math.cos(an)*rr2,cy+Math.sin(an)*rr2);}
 const g=x.createLinearGradient(cx-R,cy-R,cx+R,cy+R);g.addColorStop(0,'rgba(119,0,244,.55)');g.addColorStop(1,'rgba(0,242,207,.55)');x.fillStyle=g;x.fill();x.strokeStyle='#00f2cf';x.lineWidth=2;x.stroke();
 x.font='600 '+clamp(s*.034,11,14)+'px Poppins, sans-serif';x.fillStyle='#e4dcff';x.textBaseline='middle';
 t('axes').forEach((a,i)=>{const an=-Math.PI/2+i/6*Math.PI*2,px=cx+Math.cos(an)*(R+16),py=cy+Math.sin(an)*(R+14);x.textAlign=Math.abs(Math.cos(an))<.2?'center':Math.cos(an)>0?'left':'right';x.fillText(a,px,py);});
}

/* ---------- cómo jugar (láminas animadas) ---------- */
let CJ={i:0,t0:0};
function comoIr(i){CJ.i=clamp(i,0,2);CJ.t0=performance.now();$('cLam').querySelectorAll('.lamina').forEach((l,k)=>l.classList.toggle('on',k===CJ.i));
 $('cPuntos').innerHTML=[0,1,2].map(k=>'<button class="'+(k===CJ.i?'on':'')+'" data-k="'+k+'" aria-label="'+(k+1)+'"><i></i></button>').join('');
 $('bComoSig').textContent=CJ.i<2?t('next2'):t('gotIt');}
$('cPuntos').addEventListener('click',e=>{const b=e.target.closest('button');if(b)comoIr(+b.dataset.k);});
$('bComoSig').addEventListener('click',()=>{if(CJ.i<2)comoIr(CJ.i+1);else cerrar();});
$('cLam').addEventListener('click',e=>{if(e.target.tagName==='CANVAS')CJ.t0=performance.now();});
$('bComoPorque').addEventListener('click',()=>abrir('porque'));
$('bComoEnsayo').addEventListener('click',()=>{cerrarTodo();empezarDia('ensayo',EST.hoy());});
let sx0=null;$('cLam').addEventListener('pointerdown',e=>{sx0=e.clientX;});$('cLam').addEventListener('pointerup',e=>{if(sx0!=null&&Math.abs(e.clientX-sx0)>50)comoIr(CJ.i+(e.clientX<sx0?1:-1));sx0=null;});
function dibComo(now){
 const c=$('cLam').querySelectorAll('canvas')[CJ.i];if(!c)return;const r=c.getBoundingClientRect(),w=r.width,h=r.height;if(!w)return;
 if(c.width!==Math.round(w*DPR)){c.width=Math.round(w*DPR);c.height=Math.round(h*DPR);}const x=c.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);x.clearRect(0,0,w,h);
 const e=((now-CJ.t0)/1000)%(CJ.i===2?5:4.2),s=Math.min(w,h)*.92,box={x:(w-s)/2,y:(h-s)/2,s};
 const st={t:now/1000,lang:L,dpr:DPR};
 if(CJ.i===0){if(e>1.3)st.sel=2;MAPA.dibujar(x,box,TUT,st);const g=MAPA.geom(TUT,2,box);const k=clamp((e-.3)/1,0,1),hx=g.x+40*(1-ease(k)),hy=g.y+50*(1-ease(k))+12;mano(x,hx,hy,e>1.2&&e<1.5);}
 else if(CJ.i===1){st.sel=2;const k=clamp((e-.4)/.8,0,1);st.astro=e<.4?{i:2,fase:'fantasma'}:{i:2,fase:k<1?'bajando':'posado',k};MAPA.dibujar(x,box,TUT,st);}
 else{st.polvo=clamp(1-(e-.6)/1.2,0,1);st.calor=CALTUT();st.calorA=clamp((e-1.2)/.8,0,1);st.pct=e>2?TUT.practica.map(v=>Math.round(v/2*Math.min(1,(e-2)/.6))):null;st.ganadores=e>2.6?[2]:null;st.coronaA=clamp((e-2.6)/.4,0,1);MAPA.dibujar(x,box,TUT,st);}
}
let CT=null;const CALTUT=()=>CT||(CT={practica:MAPA.capaCalor(GEN.puntosPractica('tut',TUT).map(p=>[p[0],p[1],1]),true),real:null});
function mano(x,hx,hy,toca){x.save();x.translate(hx,hy);x.scale(toca?.9:1,toca?.9:1);x.fillStyle='rgba(245,240,255,.95)';x.strokeStyle='rgba(10,5,18,.6)';x.lineWidth=1.5;
 x.beginPath();MAPA.rr(x,-6,-2,12,26,6);x.fill();x.stroke();MAPA.rr(x,-14,10,28,22,9);x.fill();x.stroke();
 if(toca){x.strokeStyle='rgba(0,242,207,.8)';x.lineWidth=2;x.beginPath();x.arc(0,-4,14,0,7);x.stroke();}x.restore();}

/* ---------- ajustes ---------- */
function pintarAjustes(){const P=EST.prefs;
 $('rMus').value=Math.round(P.mVol*100);$('rSfx').value=Math.round(P.sVol*100);
 $('tMus').classList.toggle('on',P.mOn);$('tSfx').classList.toggle('on',P.sOn);$('tVib').classList.toggle('on',P.vib);$('tAuto').classList.toggle('on',P.auto);
 $('tMov').classList.toggle('on',quieto());$('tSolo').classList.toggle('on',P.soloReales);
 ['tMus','tSfx','tVib','tAuto','tMov','tSolo'].forEach(id=>$(id).setAttribute('aria-pressed',$(id).classList.contains('on')));
 $('bBorrar').textContent=t('erase');$('bBorrar').classList.remove('armado');pintarFsBotones();}
function tog(id,campo,fn){$(id).addEventListener('click',()=>{const P=EST.prefs;P[campo]=campo==='mov'?!quieto():!P[campo];EST.guardarPrefs();AU.sfx(P[campo]?'on':'off');if(fn)fn();pintarAjustes();});}
tog('tMus','mOn',prefsAudio);tog('tSfx','sOn',prefsAudio);tog('tVib','vib',()=>vib(15));tog('tAuto','auto');tog('tMov','mov',()=>document.body.classList.toggle('quieto',quieto()));tog('tSolo','soloReales');
$('rMus').addEventListener('input',e=>{EST.prefs.mVol=e.target.value/100;EST.prefs.mOn=true;prefsAudio();$('tMus').classList.add('on');});
$('rSfx').addEventListener('input',e=>{EST.prefs.sVol=e.target.value/100;EST.prefs.sOn=true;prefsAudio();$('tSfx').classList.add('on');});
['rMus','rSfx'].forEach(id=>$(id).addEventListener('change',()=>{EST.guardarPrefs();AU.sfx('tic',4);}));
document.querySelectorAll('.segLang').forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;AU.sfx('ui');JI.set(b.dataset.l);}));
/* Cambio en vivo (desde este juego o desde otra pestaña del sitio que use JETIdioma): repinta sin recargar ni tocar la partida. */
addEventListener('jet-idioma',e=>{const l=e.detail;if((l!=='es'&&l!=='en')||l===L)return;L=l;MAPA.limpiarCache();aplicarTextos();pintarAjustes();
 if(base==='ronda'&&J.dia&&J.fase==='posado'&&!$('rRes').hidden){const tu=J.tut;mostrarResultado(false);if(tu)J.tut=tu;}});
$('bBorrar').addEventListener('click',()=>{
 $('bTit').textContent=t('eraseTitle',{juego:'JET//'+t('name')});$('bTxt').textContent=t('eraseBody',{'datos concretos':t('eraseData')});
 abrir('borrar',{foco:'#bBorrarNo'});});
$('bBorrarNo').addEventListener('click',()=>cerrar());
$('bBorrarSi').addEventListener('click',()=>{
 const prefs=Object.assign({},EST.prefs);EST.borrarTodo();Object.assign(EST.prefs,prefs);EST.guardarPrefs();EST.guardar('uid',EST.uid);
 AU.sfx('borrar');cerrarTodo();J.dia=null;mostrar('inicio');toast(t('erasedAll'));});

/* =====================================================================
   BUCLE DE DIBUJO
   ===================================================================== */
let ultimo=performance.now(),fondoQuieto=true,px=0,py=0;
addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!quieto()){px=(e.clientX/W-.5)*2;py=(e.clientY/H-.5)*2;}});
function cuadro(now){
 const dt=Math.min(.05,(now-ultimo)/1000);ultimo=now;
 // fondo
 const fc=$('fondo'),fx=fc.getContext('2d');
 const animarFondo=base==='inicio'||base==='lectura'||base==='archivo'||base==='perfil';
 if(animarFondo||fondoQuieto){fx.setTransform(DPR,0,0,DPR,0,0);MAPA.fondo(fx,W,H,now/1000,dt,{luna:base==='inicio',puntos:puntosLuna,quieto:quieto()||!animarFondo,px,py,lunaY:0,suave:base==='ronda'||base==='revela'});fondoQuieto=false;}
 // ronda
 if(base==='ronda'&&J.dia&&J.box){
  const c=$('cv').getContext('2d');c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,J.W,J.H);
  const R=ronda();let ox=0,oy=0;
  if(J.shake&&now-J.shake<250){const k=1-(now-J.shake)/250;ox=(Math.random()-.5)*6*k;oy=(Math.random()-.5)*6*k;}
  c.save();c.translate(ox,oy);
  if(J.entrada<1)J.entrada=Math.min(1,J.entrada+dt/.6);
  let astro=null;
  if(J.fase==='elegir'&&J.sel!=null)astro={i:J.sel,fase:'fantasma'};
  else if(J.fase==='bajando'){const k=Math.max(0,(now-J.t0)/700);if(k>=1)tocarSuelo();astro={i:J.sel,fase:k>=1?'posado':'bajando',k};}
  else if(J.fase==='posado')astro={i:J.sel,fase:'posado'};
  if(esMapa(R)){
   const st={t:now/1000,lang:L,dpr:DPR,sel:J.sel,hover:J.hover,entrada:J.entrada,astro,mio:null};
   if(J.modo==='ensayo'&&J.fase==='posado'&&J.tut){const e=Math.max(0,(now-J.tut.t0)/1000);st.polvo=e<.3?e/.3:clamp(1-(e-.5)/1,0,1);st.calor=CALTUT();st.calorA=clamp((e-.9)/.6,0,1);
    st.pct=e>1.4?R.practica.map(v=>Math.round(v/2*Math.min(1,(e-1.4)/.5))):null;st.ganadores=e>1.9?[2]:null;st.coronaA=clamp((e-1.9)/.4,0,1);if(e>.3&&!J.tut.s){J.tut.s=1;AU.sfx('polvo');}if(e>1.9&&!J.tut.c){J.tut.c=1;AU.sfx('corona');}
    if(e<1.5)st.astro=null;}
   MAPA.dibujar(c,J.box,R,st);
   if(J.modo==='ensayo'&&J.sel==null&&J.fase==='elegir'){const g=MAPA.geom(R,2,J.box),e=(now/1000)%2.2,k=clamp(e/.9,0,1);mano(c,g.x+g.r*.5+30*(1-ease(k)),g.y+g.r*.4+36*(1-ease(k)),e>.9&&e<1.2);}
  }else if(astro){const g=puntoAstro(),h=Math.max(34,Math.min(70,g.r*1.6)),u=h/100;
   let y=g.y-6*u,ll=0,al=1;if(astro.fase==='fantasma'){y-=h*.42-Math.sin(now/380)*3;ll=.45;al=.6;}else if(astro.fase==='bajando'){const k=clamp(astro.k,0,1);y-=(1-ease(k))*(g.y+h);ll=1-k*.4;}
   MAPA.astro(c,g.x,y,h,now/1000,ll,al);}
  if(J.onda){const e=Math.max(0,(now-J.onda.t)/700);if(e>=1)J.onda=null;else{c.strokeStyle='rgba(181,168,216,'+(.6*(1-e))+')';c.lineWidth=2;c.beginPath();c.arc(J.onda.x,J.onda.y,10+e*34,0,7);c.stroke();
   c.font='600 14px Poppins, sans-serif';c.textAlign='center';c.fillStyle='rgba(245,240,255,'+(1-e)+')';c.fillText(t('hint'),J.onda.x,J.onda.y-26-e*8);}}
  MAPA.particulas(c,dt);c.restore();
 }
 if(base==='revela'&&!RV.final&&RV.box){const c=$('cvR').getContext('2d');c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,RV.W,RV.H);animRV(c,now);MAPA.particulas(c,dt);}
 if(base==='perfil')dibBrujula(now);
 if(modales[modales.length-1]==='como')dibComo(now);
 if(base==='lectura'&&(now|0)%500<20)tickLectura();
 requestAnimationFrame(cuadro);
}

/* ---------- red: callbacks ---------- */
function diaDe(fecha){return (J.modo==='hoy'&&J.fecha===fecha&&J.d)?J.d:EST.dia(fecha);}
RED.alVoto=(it,j)=>{const d=diaDe(it.fecha),g=d.rondas[it.ronda-1];if(!g)return;g.env=2;g.prov={conteos:j.conteos,n:j.n};EST.guardarDia(it.fecha,d);
 if(base==='ronda'&&J.modo==='hoy'&&J.fecha===it.fecha&&J.r===it.ronda-1&&J.fase==='posado')mostrarResultado(false);
 if(base==='ronda')pintarRondaLunas();if(base==='lectura')pintarLectura();};
RED.alConflicto=(it,op)=>{const d=diaDe(it.fecha),g=d.rondas[it.ronda-1];if(!g)return;if(op!=null&&op>=0)g.o=op;g.env=2;EST.guardarDia(it.fecha,d);};
RED.alTarde=(it,why)=>{const d=diaDe(it.fecha),g=d.rondas[it.ronda-1];if(g){g.env=-1;EST.guardarDia(it.fecha,d);}if(why==='reloj')toast(t('badClock'),3500);pastilla();};
RED.alCambio=()=>pastilla();
function pintarRondaLunas(){if(J.dia&&base==='ronda'){const sel=J.sel;pintarRonda();J.sel=sel;}}
addEventListener('online',pastilla);addEventListener('offline',pastilla);

/* ---------- cambio de día con el juego abierto ---------- */
let diaVisto=EST.hoy();
function revisarDia(){const h=EST.hoy();if(h!==diaVisto){diaVisto=h;puntosLuna=null;AU.sfx('medianoche');toast(t('newDay'),3000);if(base==='inicio')pintarInicio();if(base==='lectura')pintarLectura();}}
setInterval(()=>{revisarDia();if(base==='inicio'){const d=EST.dia(EST.hoy());if(EST.jugadas(d)>=7||EST.jugadas(d)>0)pintarInicio();}},1000);
setInterval(()=>{if(document.hidden||!RED.activa)return;RED.estado(EST.hoy()).then(e=>{if(e){jugadoresHoy=Math.max.apply(null,e.rondas.map(r=>r.n));if(base==='inicio')pintarInicio();}});},45000);

/* =====================================================================
   ARRANQUE
   ===================================================================== */
function arrancar(){
 document.body.classList.toggle('quieto',quieto());
 aplicarTextos();medir();
 const v=EST.leer('vista',null),hoy=EST.hoy();
 let hecho=false;
 if(!EST.leer('tut',0)){empezarDia('ensayo',hoy);hecho=true;}
 else if(v){
  if(v.p==='ronda'&&v.modo==='hoy'&&v.fecha&&GEN.dias(v.fecha)>=GEN.dias(hoy)-1&&Date.now()<GEN.cierreUTC(v.fecha)){const d=EST.dia(v.fecha);if(EST.jugadas(d)<7||v.r!=null){empezarDia('hoy',v.fecha,v.r);hecho=true;}}
  else if(v.p==='ronda'&&v.modo==='archivo'&&v.fecha){empezarDia('archivo',v.fecha,v.r);hecho=true;}
  else if(v.p==='lectura'&&v.fecha===hoy){mostrarLectura(v.fecha);hecho=true;}
  else if(v.p==='revela'&&v.f2&&v.rv){mostrarRevela(v.f2,v.rv);hecho=true;}
  else if(v.p==='archivo'||v.p==='perfil'){mostrar(v.p);hecho=true;}
 }
 if(!hecho)mostrar('inicio');
 pastilla();
 if(G.__crCargaLista)G.__crCargaLista();
 setTimeout(()=>$('sCarga').classList.add('fuera'),120);setTimeout(()=>$('sCarga').remove(),600);
 RED.procesar();
 if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
 if(RED.activa)RED.estado(hoy).then(e=>{if(e){jugadoresHoy=Math.max.apply(null,e.rondas.map(r=>r.n));if(base==='inicio')pintarInicio();}});
 requestAnimationFrame(cuadro);
}

/* ---------- gancho de pruebas ---------- */
G.CRATER={
 get estado(){return {pantalla:base,modales:modales.slice(),modo:J.modo,fecha:J.fecha,ronda:J.r,fase:J.fase,sel:J.sel,box:J.box,hoy:EST.hoy(),lang:L,red:RED.ok,cola:RED.pendientes(),dia:J.d,rev:{fecha:RV.fecha,r:RV.r,final:RV.final},audio:AU.estado(),cancion:AU.cancion,fs:!!fsEl()};},
 generar:f=>GEN.generarDia(f),
 elegir:i=>elegir(i,'tecla'),
 aterrizar:()=>{aterrizar();},
 saltar:()=>saltarAnim(),
 siguiente:()=>{if(J.fase==='posado')siguiente();},
 irA:(p,a,b)=>{if(p==='ronda')empezarDia(a||'hoy',b||EST.hoy());else if(p==='lectura')mostrarLectura(a||EST.hoy());else if(p==='revela')mostrarRevela(a||GEN.sumar(EST.hoy(),-1),b||'hoy');else if(MODALES.includes(p))abrir(p);else mostrar(p);},
 simularRed:on=>{RED.simular(on!=='off'&&on!==false);pastilla();},
 fijarFecha:f=>{EST.fijar(f);diaVisto=EST.hoy();puntosLuna=null;pintarPantalla();},
 practica:(f,r)=>GEN.generarDia(f).rondas[r-1].practica,
 centro:i=>{const R=ronda();if(!J.box)return null;const g=esMapa(R)?MAPA.geom(R,i,J.box):(()=>{const b=$('lista').querySelectorAll('.plat')[i],r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})();
  if(esMapa(R)){const a=$('cv').getBoundingClientRect();return {x:a.left+g.x,y:a.top+g.y};}return g;},
 idioma:l=>{JI.set(l);},
 cerrar:()=>cerrar(),
 errores:[]
};
addEventListener('error',e=>G.CRATER.errores.push(String(e.message||e)));

if(document.fonts&&document.fonts.ready)Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,900))]).then(arrancar);else arrancar();
})(window);
