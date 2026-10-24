/* JET//Escudos · modo Pelotas
   Fotos reales de los balones oficiales por edición (Mundiales, Champions, Libertadores, Eurocopa, Copa América).
   Dos juegos por competición: Torneo (elige tu pelota favorita duelo a duelo) y Trivia (adivina el año o la temporada).
   Datos: pelotas/pelotas.json (generado por tools/bajar_pelotas.py, fotos con licencia libre de Wikimedia Commons). */
(function(){
/* Nombre y descripción de cada competición salen de i18n.js (ESC.t('pbComp')); aquí solo el color. */
const COLORS={mundial:'#2e7d32',ucl:'#0d47a1',libertadores:'#43a047',euro:'#1565c0',copaamerica:'#e53935'};
const COMPS=new Proxy({}, {get:(_,c)=>COLORS[c]?[ESC.t('pbComp')[c][0],ESC.t('pbComp')[c][1],COLORS[c]]:undefined,has:(_,c)=>c in COLORS,ownKeys:()=>Object.keys(COLORS),getOwnPropertyDescriptor:(_,c)=>c in COLORS?{enumerable:true,configurable:true}:undefined});
const t=ESC.t,dx=ESC.d;
const $=id=>document.getElementById(id);
let ALL=null;
async function data(){if(ALL)return ALL;try{const r=await fetch('pelotas/pelotas.json',{cache:'no-cache'});ALL=r.ok?await r.json():[];}catch(e){ALL=[];}return ALL;}
const byComp=(list,c)=>list.filter(b=>b.comp===c).slice().sort((a,b)=>String(a.temporada).localeCompare(String(b.temporada)));
const key=c=>'pelotas_'+c+'_v1';
const load=c=>{try{const r=JSON.parse(localStorage.getItem(key(c)));if(r)return r;}catch(e){}return {picks:{},trivia:{best:0,played:0}};};
const save=(c,db)=>{try{localStorage.setItem(key(c),JSON.stringify(db));}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

/* ---------- estilos propios (misma paleta que Escudos) ---------- */
const CSS=`
.pb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.pb{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;text-align:center}
.pb img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#fff}
.pb .pb-t{padding:8px 8px 10px}.pb .pb-y{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--accent);font-weight:700}.pb .pb-n{font-size:12px;font-weight:600;line-height:1.2;margin-top:2px}.pb .pb-m{font-size:11px;color:var(--muted)}
.duels{display:flex;flex-direction:column;gap:10px}
.duel{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center;background:var(--bg2);border-radius:14px;padding:8px}
.duel.pending{outline:1px dashed var(--line)}
.dside{cursor:pointer;border-radius:12px;padding:6px;border:2px solid transparent;background:var(--card);transition:border-color .12s,opacity .12s;min-width:0}
.dside img{width:100%;max-width:220px;margin:0 auto;aspect-ratio:1;object-fit:cover;border-radius:10px;display:block;background:#fff}
.dside .pb-y{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--accent);font-weight:700;margin-top:6px}.dside .pb-n{font-size:12.5px;font-weight:600;line-height:1.2}
.dside.sel{border-color:var(--green);background:rgba(61,220,132,.12)}.dside.un{opacity:.4}
.dside.bye{cursor:default;opacity:.55;display:flex;align-items:center;justify-content:center;min-height:120px;color:var(--muted);font-size:12px;text-align:center}.dside.free{cursor:default}
.dvs{font-family:'JetBrains Mono',monospace;color:var(--muted);font-weight:700;font-size:12px}
.pchamp{background:linear-gradient(160deg,#1c2634,#111a24);border:1px solid var(--gold);border-radius:16px;padding:20px;text-align:center;box-shadow:0 0 40px rgba(232,193,90,.18);max-width:420px;margin:0 auto}
.pchamp img{width:min(260px,70vw);aspect-ratio:1;object-fit:cover;border-radius:16px;margin:0 auto 10px;display:block;background:#fff}
.pchamp .cap{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}.pchamp .nm{font-size:20px;font-weight:800}
.tq{max-width:560px;margin:0 auto;text-align:center}
.tq img{width:min(300px,78vw);aspect-ratio:1;object-fit:cover;border-radius:16px;margin:0 auto 12px;display:block;background:#fff;border:1px solid var(--line)}
.tq .q{font-size:15px;font-weight:700;margin-bottom:10px}.tq .opts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tq .opt{padding:12px 10px;border-radius:12px;background:var(--card);border:1px solid var(--line);font-weight:700;font-family:'JetBrains Mono',monospace;font-size:14px}
.tq .opt.ok{background:rgba(61,220,132,.18);border-color:var(--green)}.tq .opt.bad{background:rgba(255,92,92,.18);border-color:var(--red)}.tq .opt[disabled]{cursor:default}
.tq .fb{min-height:22px;margin:10px 0;color:var(--muted);font-size:13px}.tq .fb b{color:var(--ink)}
.tq .prog{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);margin-bottom:8px}
.tq .score{font-size:44px;font-weight:800;line-height:1;margin:6px 0}.tq .score small{font-size:16px;color:var(--muted);font-weight:600}
.credits{margin-top:22px;font-size:11px;color:var(--muted)}.credits summary{cursor:pointer;font-weight:600}.credits ul{padding-left:18px;margin:8px 0 0;line-height:1.5}
@media(max-width:600px){.pb-grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr))}.duel{gap:4px;padding:6px}.dside{padding:4px}.tq .opts{gap:6px}}
`;
function ensureCSS(){if(!$('pelotas-css')){const s=document.createElement('style');s.id='pelotas-css';s.textContent=CSS;document.head.appendChild(s);}}

/* ---------- portada: sección Pelotas ---------- */
async function landing(app){
  ensureCSS();const list=await data();if(!list.length)return;
  const comps=Object.keys(COMPS).filter(c=>byComp(list,c).length>=4);if(!comps.length)return;
  let h=`<div class="sport">${t('sportBalls')}</div><div class="cgrid">`;
  comps.forEach(c=>{const balls=byComp(list,c);const [n,m,col]=COMPS[c];let p='';const db=load(c);const np=Object.keys(db.picks).length;if(np)p=t('pbPicked',np);
    h+=`<a class="ccard" href="#/pelotas/${c}" style="--cc:${col}"><div class="cn">${n}</div><div class="cm">${t('pbCard',balls.length,balls[0].temporada,balls[balls.length-1].temporada)}</div>${p?`<div class="prog">${p}</div>`:''}<div class="crests">${balls.slice(-5).map(b=>`<span><img src="${b.archivo}" alt=""></span>`).join('')}</div><div class="cf">${t('play')}</div></a>`;});
  h+=`</div>`;const old=app.querySelector('.pb-landing');if(old)old.remove();const sec=document.createElement('div');sec.className='pb-landing';sec.innerHTML=h;app.appendChild(sec);
}

/* ---------- página de una competición ---------- */
let C='',BALLS=[],DB=null,TAB='torneo',TQ=null;
async function open(comp){
  ensureCSS();const list=await data();if(!COMPS[comp]||!byComp(list,comp).length){$('app').innerHTML='<p>'+t('notFound')+'</p>';return;}
  C=comp;BALLS=byComp(list,comp);DB=load(comp);TAB=TAB||'torneo';
  const col=COMPS[comp][2];subtitle();$('backLink').style.display='';document.documentElement.style.setProperty('--accent',col);
  render();window.scrollTo(0,0);
}
function subtitle(){if(C)$('subtitle').textContent=t('pbSub',COMPS[C][0],BALLS.length);}
/* Cambio de idioma en vivo: mismo estado (pestaña, elecciones, trivia en curso), sin mover el scroll. */
function relabel(){if(!C)return;subtitle();const y=window.scrollY;render();window.scrollTo(0,y);
}
function render(){
  let h=`<div class="toolbar"><div class="tabs"><button class="tab ${TAB==='torneo'?'active':''}" data-tab="torneo">${t('pbTorneo')}</button><button class="tab ${TAB==='trivia'?'active':''}" data-tab="trivia">${t('pbTrivia')}</button><button class="tab ${TAB==='galeria'?'active':''}" data-tab="galeria">${t('pbGallery')}</button></div>${TAB==='torneo'?`<button class="btn" id="pbClear">${t('pbClear')}</button>`:''}<span class="hint" id="status"></span></div>`;
  if(TAB==='torneo')h+=torneoHTML();else if(TAB==='trivia')h+=triviaHTML();else h+=galeriaHTML();
  h+=creditsHTML();$('app').innerHTML=h;
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{TAB=b.dataset.tab;if(TAB==='trivia'&&!TQ)TQ=null;render();});
  const cl=$('pbClear');if(cl&&window.ESC_armClear)window.ESC_armClear(cl,()=>{DB.picks={};save(C,DB);render();});
  if(TAB==='torneo')bindTorneo();else if(TAB==='trivia')bindTrivia();
}

/* ---------- torneo: llave de favoritas ---------- */
function bracket(){
  // Llave por orden cronológico; si no es potencia de 2, las últimas ediciones pasan directo en la primera ronda.
  const n=BALLS.length;let size=1;while(size<n)size*=2;
  const byes=size-n;let slots=[];for(let i=0;i<n;i++)slots.push(BALLS[i]);
  // Emparejar en la primera ronda: los que tienen bye van al final
  const r0=[];const paired=n-byes;
  for(let i=0;i<paired;i+=2)r0.push({a:slots[i],b:slots[i+1]});
  for(let i=paired;i<n;i++)r0.push({a:slots[i],b:null});
  const rounds=[r0];let ri=0;
  while(rounds[ri].length>1){const prev=rounds[ri];const next=[];
    for(let i=0;i<prev.length;i+=2){next.push({a:winner(ri,i,prev[i]),b:prev[i+1]?winner(ri,i+1,prev[i+1]):null,from:[i,i+1]});}
    rounds.push(next);ri++;}
  const fin=rounds[rounds.length-1][0];const champ=fin?winner(rounds.length-1,0,fin):null;
  return {rounds,champ,size};
}
// Solo en la primera ronda un rival ausente significa pase directo; en las demás significa cruce pendiente.
function winner(ri,mi,m){if(!m)return null;if(ri===0&&m.a&&!m.b)return m.a;if(!m.a||!m.b)return null;const p=DB.picks[ri+'-'+mi];return p==='A'?m.a:p==='B'?m.b:null;}
const roundName=(i,total)=>{const left=total-i;return left===1?t('pbFinal'):left===2?t('pbSF'):left===3?t('pbQF'):left===4?t('pbR16'):t('pbRound',i+1);};
function torneoHTML(){
  const B=bracket();const total=B.rounds.length;
  // ronda activa: la primera con duelos pendientes
  let active=B.rounds.findIndex(r=>r.some(m=>m.a&&m.b&&!winner(B.rounds.indexOf(r),r.indexOf(m),m)));if(active<0)active=total-1;
  let h=`<p class="hint" style="margin:0 0 10px">${t('pbIntro',COMPS[C][0])}</p>`;
  if(B.champ)h+=`<div class="pchamp"><div class="cap">${t('pbFav')}</div><img src="${B.champ.archivo}" alt=""><div class="nm">${esc(B.champ.nombre)}</div><div class="pb-y">${esc(B.champ.temporada)}${B.champ.marca?' · '+esc(dx(B.champ.marca)):''}</div></div>`;
  h+=`<div class="round-nav">${B.rounds.map((r,i)=>`<button data-rk="${i}" class="${i===active?'active':''}">${roundName(i,total)}</button>`).join('')}</div>`;
  B.rounds.forEach((r,i)=>{h+=`<div class="duels" data-round="${i}" style="${i===active?'':'display:none'}">`;
    r.forEach((m,mi)=>{const w=winner(i,mi,m);const p=DB.picks[i+'-'+mi];
      const side=(x,res)=>{if(!x)return `<div class="dside bye"><div class="pb-n">${(m.a||m.b)&&i===0?t('pbBye'):t('tbd')}</div></div>`;const bye=!m.a||!m.b;const cls=bye?'free':(p===res?'sel':(p?'un':''));return `<div class="dside ${cls}" ${bye?'':`data-pick="${i}-${mi}" data-res="${res}"`}><img src="${x.archivo}" alt=""><div class="pb-y">${esc(x.temporada)}</div><div class="pb-n">${esc(x.nombre)}</div></div>`;};
      h+=`<div class="duel ${w?'':'pending'}">${side(m.a,'A')}<div class="dvs">VS</div>${side(m.b,'B')}</div>`;});
    h+=`</div>`;});
  return h;
}
function bindTorneo(){
  document.querySelectorAll('[data-rk]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-rk]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.duels').forEach(d=>d.style.display=d.dataset.round===b.dataset.rk?'':'none');});
  document.querySelectorAll('[data-pick]').forEach(el=>el.onclick=()=>{const k=el.dataset.pick,res=el.dataset.res;
    if(DB.picks[k]===res)delete DB.picks[k];else DB.picks[k]=res;
    // al cambiar un duelo se invalidan las rondas posteriores que dependían de él
    const ri=+k.split('-')[0];Object.keys(DB.picks).forEach(x=>{if(+x.split('-')[0]>ri)delete DB.picks[x];});
    save(C,DB);render();});
}

/* ---------- trivia: adivina el año ---------- */
const tr=ESC.t; // dentro de la trivia «t» es el estado de la partida
function newTrivia(){
  const pool=BALLS.slice().sort(()=>Math.random()-.5).slice(0,Math.min(10,BALLS.length));
  const qs=pool.map(b=>{const others=BALLS.filter(x=>x!==b).sort(()=>Math.random()-.5).slice(0,3).map(x=>x.temporada);const opts=[b.temporada,...others].sort(()=>Math.random()-.5);return {b,opts,ans:null};});
  return {qs,i:0,score:0,done:false};
}
function triviaHTML(){
  if(!TQ)TQ=newTrivia();
  const t=TQ;
  if(t.done){const best=DB.trivia.best||0;return `<div class="tq"><div class="prog">${tr('pbDone')}</div><div class="score">${t.score}<small> / ${t.qs.length}</small></div><p class="hint" style="margin:6px 0 14px">${t.score===t.qs.length?tr('pbPerfect'):t.score>=t.qs.length*.7?tr('pbGood'):tr('pbTry')} ${tr('pbBest',best,t.qs.length)}</p><div class="acts" style="justify-content:center"><button class="btn gold" id="tqAgain">${tr('pbAgain')}</button><button class="btn" id="tqShare">${tr('pbShare')}</button></div></div>`;}
  const q=t.qs[t.i];
  return `<div class="tq"><div class="prog">${tr('pbQ',t.i+1,t.qs.length,t.score)}</div><img src="${q.b.archivo}" alt=""><div class="q">${tr('pbAsk',C==='ucl')}</div><div class="opts">${q.opts.map(o=>`<button class="opt ${q.ans!==null?(o===q.b.temporada?'ok':(o===q.ans?'bad':'')):''}" data-opt="${esc(o)}" ${q.ans!==null?'disabled':''}>${esc(o)}</button>`).join('')}</div><div class="fb">${q.ans===null?'':(q.ans===q.b.temporada?'<b>'+tr('pbRight')+'</b> ':'<b>'+tr('pbWrong')+'</b> ')+esc(q.b.nombre)+(q.b.marca?' · '+esc(dx(q.b.marca)):'')+' · '+esc(q.b.temporada)}</div>${q.ans!==null?`<button class="btn gold" id="tqNext">${t.i+1<t.qs.length?tr('pbNext'):tr('pbSee')}</button>`:''}</div>`;
}
function bindTrivia(){
  const t=TQ;
  document.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{const q=t.qs[t.i];if(q.ans!==null)return;q.ans=b.dataset.opt;if(q.ans===String(q.b.temporada))t.score++;render();});
  const nx=$('tqNext');if(nx)nx.onclick=()=>{if(t.i+1<t.qs.length)t.i++;else{t.done=true;DB.trivia.played=(DB.trivia.played||0)+1;DB.trivia.best=Math.max(DB.trivia.best||0,t.score);save(C,DB);}render();};
  const ag=$('tqAgain');if(ag)ag.onclick=()=>{TQ=newTrivia();render();};
  const sh=$('tqShare');if(sh)sh.onclick=async()=>{const txt=tr('pbShareTxt',t.score,t.qs.length,COMPS[C][0])+` · https://jetgames.fun/escudos/#/pelotas/${C}`;try{if(navigator.share)await navigator.share({text:txt});else{await navigator.clipboard.writeText(txt);$('status').textContent=tr('pbCopied');}}catch(e){}};
}

/* ---------- galería ---------- */
function galeriaHTML(){return `<div class="pb-grid">${BALLS.map(b=>`<div class="pb"><img src="${b.archivo}" alt="${esc(b.nombre)}" loading="lazy"><div class="pb-t"><div class="pb-y">${esc(b.temporada)}</div><div class="pb-n">${esc(b.nombre)}</div>${b.marca?`<div class="pb-m">${esc(dx(b.marca))}</div>`:''}</div></div>`).join('')}</div>`;}
function creditsHTML(){return `<details class="credits"><summary>${t('pbCredits')}</summary><ul>${BALLS.map(b=>`<li>${esc(b.temporada)} ${esc(b.nombre)} — <a href="${esc(b.fuente||'#')}" target="_blank" rel="noopener">${esc(b.autor||t('pbNoAuthor'))}</a>, ${esc(b.licencia||'')}${b.nota?' · '+esc(dx(b.nota)):''}</li>`).join('')}</ul></details>`;}

window.Pelotas={landing,open,relabel,reset:()=>{TAB='torneo';TQ=null;}};
})();
