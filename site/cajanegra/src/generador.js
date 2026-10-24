// JET//Caja Negra · generador de casos: modelo del mundo → registros → informe → banco.
// El solucionador (solucionador.js) vuelve a deducir cada hecho SOLO con lo que dicen los registros
// y el caso se rechaza si algún hueco no tiene una única respuesta.
(function (G) {
  'use strict';
  const CNX = G.CNX || (G.CNX = {});

  const pad = (n) => (n < 10 ? '0' : '') + n;
  const hm = (m) => pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);
  const CATS = ['persona', 'lugar', 'hora', 'sistema', 'accion', 'causa', 'consecuencia'];
  const CAT_DE = {
    horaFallo: 'hora', sistema: 'sistema', lugarFallo: 'lugar', actor: 'persona', accionInicial: 'accion', horaAccion: 'hora',
    avisador: 'persona', causa: 'causa', respondedor: 'persona', respuesta: 'accion', horaFoto: 'hora', refugio: 'lugar',
    reparador: 'persona', consecuencia: 'consecuencia'
  };
  const ORDEN_HECHOS = ['horaFallo', 'sistema', 'lugarFallo', 'actor', 'accionInicial', 'horaAccion', 'avisador', 'causa', 'respondedor', 'respuesta', 'horaFoto', 'refugio', 'reparador', 'consecuencia'];

  // Texto de una ficha (valor de un hecho) en un idioma.
  function textoValor(cat, valor, lang) {
    const W = CNX.mundo;
    switch (cat) {
      case 'hora': return valor;
      case 'persona': return valor;
      case 'lugar': { const m = W.MODULOS[valor]; return lang === 'es' ? m.art + ' ' + m.es : m.en; }
      case 'sistema': { const s = W.SISTEMAS[valor]; return lang === 'es' ? s.art + ' ' + s.es : s.en; }
      case 'accion': return W.ACCIONES[valor][lang];
      case 'causa': return W.CAUSAS[valor][lang];
      case 'consecuencia': return W.CONSECUENCIAS[valor][lang];
    }
    return String(valor);
  }

  // ───────────────────────── Modelo ─────────────────────────
  function construirModelo(r, o) {
    const W = CNX.mundo;
    const F = o.forzar || {};
    const dif = o.dif;
    const nave = F.nave ? W.NAVES.find((n) => n.id === F.nave) || W.NAVES[0] : r.pick(W.NAVES);

    // Registros presentes
    let regs;
    if (F.registros) regs = F.registros.slice();
    else if (dif === 1) regs = ['tripulacion', 'radio', 'telemetria', 'mantenimiento'];
    else if (dif === 2) regs = ['tripulacion', 'radio', 'telemetria', 'mantenimiento', r.chance(0.5) ? 'bitacora' : 'foto'];
    else regs = ['tripulacion', 'bitacora', 'radio', 'telemetria', 'foto', 'mantenimiento'];
    const tiene = (t) => regs.includes(t);

    // Indirecciones
    let via = 'IND';
    if (F.via) via = F.via;
    else if (dif === 2 && tiene('bitacora')) via = r.chance(0.5) ? 'ROL' : 'IND';
    else if (dif === 3) via = 'ELI';
    if ((via === 'ROL' || via === 'ELI') && !tiene('bitacora')) via = 'IND';
    const con = F.con != null ? (F.con && tiene('bitacora')) : (tiene('bitacora') && (dif === 3 || (dif === 2 && r.chance(0.5))));
    const lugarLit = F.lugarLit != null ? F.lugarLit : (dif === 1 ? r.chance(0.6) : dif === 2 ? r.chance(0.3) : false);
    const horaLit = F.horaLit != null ? F.horaLit : (dif === 1 ? (lugarLit || r.chance(0.5)) : false);
    const sisLit = F.sisLit != null ? F.sisLit : (dif === 1 ? r.chance(0.5) : dif === 2 ? r.chance(0.25) : false);

    // Tripulación
    const nCrew = F.nCrew || (dif === 1 ? 3 : dif === 2 ? r.i(3, 4) : r.i(4, 5));
    let personas;
    if (F.tripulacion) personas = F.tripulacion.slice(0, nCrew).map((nm) => W.PERSONAS.find((p) => p.nombre === nm));
    else personas = r.sample(W.PERSONAS, nCrew);
    const roles = F.roles ? F.roles.slice(0, nCrew) : ['comandante'].concat(r.sample(W.ROLES_ORDEN.slice(1), nCrew - 1));
    const numsCs = F.indicativos ? F.indicativos.slice(0, nCrew) : (dif === 1 ? Array.from({ length: nCrew }, (_, i) => i + 1) : r.shuffle(Array.from({ length: nCrew }, (_, i) => i + 1)));
    let parches;
    if (F.parches) parches = F.parches.slice(0, nCrew);
    else if (dif === 1) parches = numsCs.slice();
    else parches = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], nCrew);
    const crew = personas.map((p, i) => ({ id: 'c' + (i + 1), nombre: p.nombre, g: p.g, rol: roles[i], cs: nave.nombre + '-' + numsCs[i], parche: parches[i] }));
    crew.sort((a, b) => a.cs.localeCompare(b.cs));
    const comandante = crew.find((c) => c.rol === 'comandante');

    // Incidente, sistema, módulo, causa
    const incId = F.incidente || r.pick(W.INCIDENTES_ORDEN);
    const inc = W.INCIDENTES[incId];
    const sis = F.sistema && inc.sis.includes(F.sistema) ? F.sistema : r.pick(inc.sis);
    const S = W.SISTEMAS[sis];
    const M = F.lugar && S.mods.includes(F.lugar) ? F.lugar : r.pick(S.mods);
    let causasOk;
    if (inc.causas) causasOk = inc.causas.slice();
    else causasOk = W.CAUSAS_ORDEN.filter((c) => c !== 'impacto' && W.CAUSAS[c].ok(sis));
    const causa = F.causa || r.pick(causasOk);
    const refugio = F.refugio && F.refugio !== M ? F.refugio : r.pick(W.REFUGIOS.filter((x) => x !== M));
    const accionInicial = S.inicial;
    const respuestas = inc.resp.filter((a) => a !== accionInicial);
    const respuesta = F.respuesta && respuestas.includes(F.respuesta) ? F.respuesta : r.pick(respuestas);
    const consecuencia = F.consecuencia || r.pick(inc.cons);

    // Personas en el caso
    const noCom = crew.filter((c) => c !== comandante);
    const actor = F.actorCs ? crew.find((c) => c.cs === F.actorCs) || r.pick(noCom) : r.pick(noCom);
    const resto = crew.filter((c) => c !== actor);
    const avisador = r.pick(resto);
    const respondedor = comandante;
    const reparador = r.pick(crew);
    const otrosCand = resto.filter((c) => c !== comandante);
    const otro = otrosCand.length ? r.pick(otrosCand) : null;

    // Módulos del caso: M, refugio, cabina (puesto de mando) y 1-3 más
    const libres = Object.keys(W.MODULOS).filter((k) => k !== M && k !== refugio && k !== 'cabina');
    const extra = r.sample(libres, dif === 1 ? 2 : 3);
    const Mo = extra[0]; // donde trabaja el «otro» (distracción legítima)
    const posiciones = {}; // posición de cada tripulante al abrir la bitácora (si hay bitácora)
    posiciones[comandante.id] = 'cabina';
    for (const c of crew) {
      if (c === comandante || c === actor) continue;
      if (c === otro) posiciones[c.id] = Mo;
      else posiciones[c.id] = r.pick([refugio === 'cabina' ? extra[1] : refugio, extra[1], extra[2] || extra[1], 'cabina'].filter((x) => x && x !== M));
    }
    const accionesOtro = ['cambiar_filtro', 'reiniciar_regulador', 'purgar_linea', 'conectar_celda'].filter((a) => a !== accionInicial && a !== respuesta);
    const accionOtro = r.pick(accionesOtro);

    // Horas (minutos desde las 00:00)
    const t0 = r.i(6, 20) * 60 + r.i(0, 45);
    const tLog = t0;
    const tPlan = tLog + r.i(9, 16);
    const tAct = (con ? tPlan : tLog + r.i(10, 18)) + r.i(4, 9);
    const tOther = tLog + r.i(3, Math.max(4, tAct - tLog - 3));
    const tFail = tAct + r.i(1, 3);
    const tAlarm = horaLit ? tFail : tFail + r.i(1, 2);
    const tOrder = tAlarm + r.i(1, 2);
    const tControl = tOrder + 1;
    const tPhoto = tControl + r.i(2, 4);

    return {
      dif, nave, regs, via, con, lugarLit, horaLit, sisLit, crew, comandante, incId, sis, M, causa, refugio,
      accionInicial, respuesta, consecuencia, actor, avisador, respondedor, reparador, otro, Mo, extra, posiciones, accionOtro,
      t: { tLog, tPlan, tAct, tOther, tFail, tAlarm, tOrder, tControl, tPhoto },
      control: F.control || r.pick(CNX.mundo.CONTROL.filter((x) => !crew.some((c) => c.nombre === x))),
      lote: F.lote || null
    };
  }

  // ───────────────────────── Registros ─────────────────────────
  function construirRegistros(r, rt, md) {
    const W = CNX.mundo, TX = CNX.TX;
    const H = { es: TX.ayudantes('es'), en: TX.ayudantes('en') };
    const both = (fn) => ({ es: fn(H.es), en: fn(H.en) });
    // Los números de un dato (días, ciclos, carga, versión) tienen que ser los mismos en los dos idiomas:
    // el español sortea y el inglés repite exactamente esos sorteos. Después se consume lo mismo que antes
    // para que el resto del caso no cambie de redacción.
    const conF = (f) => ({
      f,
      i: (x, y) => x + Math.floor(f() * (y - x + 1)),
      pick: (arr) => arr[Math.floor(f() * arr.length)],
      chance: (p) => f() < p
    });
    const mismoDato = (fnEs, fnEn) => {
      const vistos = [];
      const es = fnEs(conF(() => { const x = rt.f(); vistos.push(x); return x; }));
      let k = 0, nEn = 0;
      const en = fnEn(conF(() => { nEn++; return k < vistos.length ? vistos[k++] : rt.f(); }));
      for (let j = Math.min(nEn, vistos.length); j > 0; j--) rt.f();
      return { es, en };
    };
    const T = md.t;
    const regs = [];
    const add = (reg) => { regs.push(reg); return reg; };

    // ── Ficha de tripulación
    if (md.regs.includes('tripulacion')) {
      add({
        tipo: 'tripulacion',
        meta: both((h) => (h.lang === 'es' ? 'Expediente de personal · ' + md.nave.id : 'Personnel file · ' + md.nave.id)),
        lineas: md.crew.map((c) => ({
          txt: both((h) => h.cs(c) + ' · ' + h.p(c) + ' · ' + (h.lang === 'es' ? h.cap(h.rolN(c)) : h.cap(h.rolN(c))) + ' · ' + (h.lang === 'es' ? 'parche ' : 'patch ') + h.pa(c.parche)),
          claims: [{ k: 'crew', nombre: c.nombre, rol: c.rol, cs: c.cs, parche: c.parche, g: c.g }]
        }))
      });
    }

    // ── Bitácora (entradas del comandante)
    if (md.regs.includes('bitacora')) {
      const lineas = [];
      const com = md.comandante;
      if (md.via === 'ELI') {
        // ronda de posiciones a la misma hora de la voz ilegible: todos menos una persona están en otro sitio
        const resto = md.crew.filter((c) => c !== md.actor);
        lineas.push({
          hora: hm(T.tAct),
          txt: both((h) => (h.lang === 'es' ? 'Ronda de posiciones: ' : 'Position check: ') + resto.map((c) => h.rol(c) + ' ' + h.en(md.posiciones[c.id])).join('; ') + '.'),
          claims: resto.map((c) => ({ k: 'esta', ref: { rol: c.rol }, mod: md.posiciones[c.id], t: T.tAct, ronda: true }))
        });
      } else {
        const conPos = md.crew.filter((c) => c !== com && c !== md.actor);
        for (const c of r.sample(conPos, Math.min(conPos.length, 1))) {
          const mod = md.posiciones[c.id];
          lineas.push({ hora: hm(T.tLog), txt: both((h) => TX.posicionLinea(h, rt, c, mod)), claims: [{ k: 'esta', ref: { rol: c.rol }, mod, t: T.tLog }] });
        }
      }
      if (md.con) {
        lineas.push({ hora: hm(T.tLog), txt: both((h) => TX.planAccion(h, rt, md.accionInicial, md.M, hm(T.tPlan))), claims: [{ k: 'plan', act: md.accionInicial, mod: md.M, t: T.tPlan }] });
      }
      if (md.via === 'ROL') {
        lineas.push({ hora: hm(T.tAct), txt: both((h) => TX.bitacoraAccion(h, rt, h.rol(md.actor), md.accionInicial, md.M)), claims: [{ k: 'hace', ref: { rol: md.actor.rol }, act: md.accionInicial, mod: md.M, t: T.tAct }] });
      }
      lineas.push({ hora: null, txt: both((h) => TX.cierreLinea(h, rt, md.consecuencia, md.M, md.sis)), claims: [{ k: 'cierre', cons: md.consecuencia }] });
      // cronológico (las de hora null al final)
      lineas.sort((a, b) => (a.hora == null) - (b.hora == null) || (a.hora || '').localeCompare(b.hora || ''));
      add({
        tipo: 'bitacora',
        meta: both((h) => (h.lang === 'es' ? 'Entrada ' + (com.g === 'f' ? 'de la ' : 'del ') + h.rolN(com) : 'Entry by the ' + h.rolN(com)) + ' · ' + h.t(hm(T.tLog))),
        lineas
      });
    }

    // ── Radio
    if (md.regs.includes('radio')) {
      const L = [];
      const quien = (c) => both((h) => h.cs(c));
      // el «otro» trabaja en otro módulo (distracción legítima, con su hora)
      if (md.otro) {
        L.push({ hora: hm(T.tOther), quien: quien(md.otro), txt: both((h) => TX.radioAccion(h, rt, md.accionOtro, md.Mo)), claims: [{ k: 'hace', ref: { cs: md.otro.cs }, act: md.accionOtro, mod: md.Mo, t: T.tOther }] });
      }
      if (md.via === 'IND') {
        L.push({ hora: hm(T.tAct), quien: quien(md.actor), txt: both((h) => TX.radioAccion(h, rt, md.accionInicial, md.M)), claims: [{ k: 'hace', ref: { cs: md.actor.cs }, act: md.accionInicial, mod: md.M, t: T.tAct }] });
      } else if (md.via === 'ELI') {
        L.push({ hora: hm(T.tAct), quien: both((h) => h.csIleg(md.nave.nombre)), ileg: true, txt: both((h) => TX.radioAccionIlegible(h, rt, md.accionInicial, md.M)), claims: [{ k: 'hace', ref: { ilegible: true }, act: md.accionInicial, mod: md.M, t: T.tAct }] });
      }
      L.push({
        hora: hm(T.tAlarm), quien: quien(md.avisador),
        txt: both((h) => TX.alarmaLinea(h, rt, md.incId, { mod: md.lugarLit ? md.M : null, ahora: md.horaLit, sis: md.sisLit ? md.sis : null })),
        claims: [{ k: 'aviso', ref: { cs: md.avisador.cs }, t: T.tAlarm, mod: md.lugarLit ? md.M : null, ahora: md.horaLit, sis: md.sisLit ? md.sis : null }]
      });
      L.push({
        hora: hm(T.tOrder), quien: quien(md.respondedor),
        txt: both((h) => TX.ordenAccion(h, rt, md.respuesta, md.M) + ' ' + TX.refugioLinea(h, rt, md.refugio)),
        claims: [{ k: 'orden', ref: { cs: md.respondedor.cs }, act: md.respuesta, refugio: md.refugio, t: T.tOrder }]
      });
      L.push({
        hora: hm(T.tControl), quien: both((h) => (h.lang === 'es' ? 'CONTROL · ' : 'CONTROL · ') + TX.E('p:' + md.control, md.control)), control: true,
        txt: both((h) => TX.controlLinea(h, rt, md.nave.id)),
        claims: [{ k: 'control', nombre: md.control, t: T.tControl }]
      });
      const eco = md.crew.filter((c) => c !== md.respondedor && c !== md.avisador);
      if (eco.length && L.length < 8) {
        const c = rt.pick(eco);
        L.push({ hora: hm(T.tControl), quien: quien(c), txt: both((h) => TX.recibidoLinea(h, rt)), claims: [] });
      }
      L.sort((a, b) => a.hora.localeCompare(b.hora));
      add({ tipo: 'radio', meta: both((h) => (h.lang === 'es' ? 'Canal de a bordo · transcripción' : 'Onboard channel · transcript')), lineas: L });
    }

    // ── Telemetría
    if (md.regs.includes('telemetria')) {
      const W2 = CNX.mundo;
      const inc = W2.INCIDENTES[md.incId];
      const canal = inc.canal;
      const otrosMods = r.sample(md.extra.concat([md.refugio]).filter((x) => x !== md.M), md.dif === 1 ? 1 : 2);
      const mods = r.shuffle([md.M].concat(otrosMods));
      const series = mods.map((mod) => ({ canal, mod, cambio: mod === md.M ? T.tFail : null }));
      if (md.dif >= 2) {
        const otrosCanales = Object.keys(W2.CANALES).filter((c) => c !== canal);
        const mod = r.pick(md.extra.filter((x) => x !== md.M));
        series.push({ canal: r.pick(otrosCanales), mod, cambio: null, ondula: true });
      }
      const t0 = Math.min(T.tLog, T.tPhoto - 30) - 2;
      const t1 = Math.max(T.tPhoto + 4, t0 + 32);
      add({
        tipo: 'telemetria',
        meta: both((h) => (h.lang === 'es' ? 'Sensores · 1 lectura por minuto' : 'Sensors · 1 reading per minute')),
        lineas: [],
        datos: { t0, t1, semilla: r.i(1, 1e9), series, rampa: r.i(1, 2) },
        claims: series.map((s) => ({ k: 'serie', canal: s.canal, mod: s.mod, cambio: s.cambio }))
      });
    }

    // ── Mantenimiento
    if (md.regs.includes('mantenimiento')) {
      const W2 = CNX.mundo, TXX = CNX.TX;
      const otrosSis = r.shuffle(Object.keys(W2.SISTEMAS).filter((s) => s !== md.sis));
      const lineasSis = [{ sis: md.sis, mod: md.M, anom: md.causa }];
      const nOtros = md.dif === 1 ? 2 : md.dif === 2 ? r.i(2, 3) : 3;
      for (const s of otrosSis) {
        if (lineasSis.length > nOtros) break;
        const mods = W2.SISTEMAS[s].mods.filter((x) => x !== md.M);
        if (!mods.length) continue;
        lineasSis.push({ sis: s, mod: r.pick(mods), anom: null });
      }
      // señuelo de causa: otro equipo con un dato fuera de lo normal (legítimo: no es el que falló)
      if (md.dif >= 2 && lineasSis.length > 1 && r.chance(0.75)) {
        const ls = r.pick(lineasSis.slice(1));
        const cands = W2.CAUSAS_ORDEN.filter((c) => c !== md.causa && c !== 'impacto' && W2.CAUSAS[c].ok(ls.sis));
        if (cands.length) ls.anom = r.pick(cands);
      }
      const normales = (sis, excl) => W2.CAUSAS_ORDEN.filter((c) => !excl.includes(c) && W2.CAUSAS[c].ok(sis));
      const lineas = r.shuffle(lineasSis).map((ls) => {
        const campos = [];
        if (ls.anom) campos.push({ causa: ls.anom, anom: true });
        const nNorm = ls.anom ? 2 : 3;
        // el equipo que falló nunca muestra el campo «normal» de su propia causa (sería contradictorio)
        for (const c of r.sample(normales(ls.sis, [ls.anom].filter(Boolean)), nNorm)) campos.push({ causa: c, anom: false });
        const camposF = r.shuffle(campos);
        const loteTxt = md.lote && md.lote.sistemas && md.lote.sistemas.includes(ls.sis) ? md.lote.txt : null;
        const fixed = camposF.map((c) => ({ causa: c.causa, anom: c.anom, v: mismoDato((rr) => TXX.campoMant(H.es, rr, c.causa, ls.sis, c.anom, md.lote), (rr) => TXX.campoMant(H.en, rr, c.causa, ls.sis, c.anom, md.lote)) }));
        return {
          txt: both((h) => h.sN(ls.sis) + ' · ' + h.mN(ls.mod) + (loteTxt ? ' · ' + loteTxt[h.lang] : '') + ' — ' + fixed.map((f) => f.v[h.lang]).join(' · ')),
          campos: fixed,
          claims: [{ k: 'mant', sis: ls.sis, mod: ls.mod, anom: ls.anom, campoAnom: ls.anom ? fixed.find((f) => f.anom).v : null }]
        };
      });
      add({ tipo: 'mantenimiento', meta: both((h) => (h.lang === 'es' ? 'Registro técnico · equipos revisados' : 'Technical log · equipment checked')), lineas });
    }

    // ── Foto
    if (md.regs.includes('foto')) {
      const W2 = CNX.mundo;
      const astronautas = r.shuffle(md.crew).map((c) => ({ parche: c.parche, kit: c === md.reparador }));
      const objetos = r.sample(['casco', 'alarma', 'tableta', 'botiquin', 'cable'], r.i(1, 3));
      add({
        tipo: 'foto',
        meta: both((h) => (h.lang === 'es' ? 'Cámara interior · ' : 'Interior camera · ') + W2.MODULOS[md.refugio].placa[h.lang]),
        lineas: [],
        datos: { placa: W2.MODULOS[md.refugio].placa, reloj: hm(T.tPhoto), astronautas, objetos, cuerpo: md.nave.tipo === 'lunar' ? 'luna' : 'tierra', semilla: r.i(1, 1e9) },
        claims: [{ k: 'foto', t: T.tPhoto, mod: md.refugio, parches: md.crew.map((c) => c.parche), kit: md.reparador.parche }]
      });
    }

    // orden de presentación: ficha, bitácora, radio, telemetría, foto, mantenimiento (el jugador puede ir en cualquier orden)
    const ord = ['tripulacion', 'bitacora', 'radio', 'telemetria', 'foto', 'mantenimiento'];
    regs.sort((a, b) => ord.indexOf(a.tipo) - ord.indexOf(b.tipo));
    return regs;
  }

  // Valor verdadero de cada hecho según el modelo
  function hechosModelo(md) {
    const T = md.t;
    return {
      horaFallo: hm(T.tFail), sistema: md.sis, lugarFallo: md.M, actor: md.actor.nombre, accionInicial: md.accionInicial,
      horaAccion: hm(T.tAct), avisador: md.avisador.nombre, causa: md.causa, respondedor: md.respondedor.nombre,
      respuesta: md.respuesta, horaFoto: hm(T.tPhoto), refugio: md.refugio, reparador: md.reparador.nombre, consecuencia: md.consecuencia
    };
  }

  function disponibles(md) {
    const t = (x) => md.regs.includes(x);
    const radio = t('radio');
    const hora = t('telemetria') || (radio && md.horaLit);
    const lugar = t('telemetria') || (radio && md.lugarLit);
    const sistema = (t('mantenimiento') && lugar) || (radio && md.sisLit);
    const actor = hora && lugar && ((radio && (md.via === 'IND' || md.via === 'ELI')) || (t('bitacora') && md.via === 'ROL')) && t('tripulacion');
    const ok = {
      horaFallo: hora, lugarFallo: lugar, sistema, causa: sistema && t('mantenimiento'),
      actor, accionInicial: actor, horaAccion: actor,
      avisador: radio && t('tripulacion'), respondedor: radio && t('tripulacion'), respuesta: radio, refugio: radio || t('foto'),
      horaFoto: t('foto'), reparador: t('foto') && t('tripulacion'), consecuencia: t('bitacora')
    };
    return ORDEN_HECHOS.filter((k) => ok[k]);
  }

  function elegirHuecos(r, md, n, forzados) {
    const disp = disponibles(md);
    const obligados = (forzados || (md.dif === 1 ? ['actor', 'lugarFallo', 'causa'] : md.dif === 2 ? ['actor', 'lugarFallo', 'horaFallo', 'causa', 'sistema'] : ['actor', 'lugarFallo', 'horaFallo', 'causa', 'sistema', 'horaAccion'])).filter((k) => disp.includes(k));
    const pool = disp.filter((k) => !obligados.includes(k));
    // en Fácil se prefieren hechos de lectura directa
    const pref = md.dif === 1 ? pool.filter((k) => ['sistema', 'respuesta', 'respondedor', 'avisador', 'accionInicial', 'horaFallo'].includes(k)) : pool;
    const elegidos = obligados.slice();
    for (const k of r.shuffle(pref)) { if (elegidos.length >= n) break; elegidos.push(k); }
    for (const k of r.shuffle(pool)) { if (elegidos.length >= n) break; if (!elegidos.includes(k)) elegidos.push(k); }
    return ORDEN_HECHOS.filter((k) => elegidos.includes(k));
  }

  // ───────────────────────── Informe ─────────────────────────
  function construirInforme(md, claves, valores) {
    const TX = CNX.TX;
    const huecos = {};
    let n = 0;
    const idDe = {};
    for (const k of ORDEN_HECHOS) if (claves.includes(k)) { n++; idDe[k] = 'H' + n; huecos['H' + n] = { clave: k, cat: CAT_DE[k], valor: valores[k] }; }
    const t = (x) => md.regs.includes(x);
    const frases = ['S1', 'S2'];
    if (t('radio')) frases.push('S3');
    if (t('mantenimiento')) frases.push('S4');
    if (t('radio')) frases.push('S5');
    if (t('foto')) frases.push('S6f'); else if (t('radio')) frases.push('S6');
    if (t('bitacora')) frases.push('S7');
    const parrafos = [['S1', 'S2'], ['S3', 'S4'], ['S5', 'S6f', 'S6'], ['S7']].map((p) => p.filter((x) => frases.includes(x))).filter((p) => p.length);
    const informe = parrafos.map((p) => {
      const seg = [];
      for (const s of p) {
        const partes = { es: TX.INFORME.es[s]((k) => (idDe[k] ? { h: idDe[k] } : textoValor(CAT_DE[k], valores[k], 'es'))), en: TX.INFORME.en[s]((k) => (idDe[k] ? { h: idDe[k] } : textoValor(CAT_DE[k], valores[k], 'en'))) };
        // las dos listas tienen la misma estructura de huecos; se guardan juntas
        seg.push(partes);
      }
      return seg;
    });
    return { huecos, informe };
  }

  // ───────────────────────── Banco ─────────────────────────
  function construirBanco(r, md, regs, huecos) {
    const W = CNX.mundo;
    const T = md.t;
    const porCat = {};
    for (const id in huecos) { const hu = huecos[id]; (porCat[hu.cat] = porCat[hu.cat] || []).push(hu.valor); }
    const banco = [];
    const mult = {};
    let senuelosPlausibles = 0;
    const mantReg = regs.find((g) => g.tipo === 'mantenimiento');
    const mantL = mantReg ? mantReg.lineas : [];
    const plausibles = {
      hora: [T.tLog, md.con ? T.tPlan : null, md.otro ? T.tOther : null, T.tAct, T.tFail, T.tAlarm, T.tOrder, T.tControl, md.regs.includes('foto') ? T.tPhoto : null].filter((x) => x != null).map(hm),
      lugar: [md.M, md.refugio, 'cabina', md.Mo].concat(md.extra).concat(mantL.map((l) => l.claims[0].mod)),
      persona: md.crew.map((c) => c.nombre).concat([md.control]),
      sistema: mantL.map((l) => l.claims[0].sis),
      accion: [md.accionOtro, md.accionInicial, md.respuesta].concat(W.INCIDENTES[md.incId].resp),
      causa: (() => {
        const out = [];
        for (const l of mantL) for (const c of l.campos) if (c.anom || l.claims[0].sis === md.sis) out.push(c.causa);
        return out;
      })(),
      consecuencia: W.INCIDENTES[md.incId].cons.filter((c) => !W.CONS_CONFUSAS.some((p) => p.includes(c) && p.includes(md.consecuencia) && c !== md.consecuencia))
    };
    const catalogo = {
      hora: [],
      lugar: Object.keys(W.MODULOS),
      persona: W.CONTROL.filter((x) => !md.crew.some((c) => c.nombre === x)),
      sistema: Object.keys(W.SISTEMAS),
      accion: Object.keys(W.ACCIONES),
      causa: W.CAUSAS_ORDEN.filter((c) => W.CAUSAS[c].ok(md.sis)),
      consecuencia: Object.keys(W.CONSECUENCIAS).filter((c) => !W.CONS_CONFUSAS.some((p) => p.includes(c) && p.includes(md.consecuencia) && c !== md.consecuencia))
    };
    let nId = 0;
    for (const cat of CATS) {
      const ans = porCat[cat];
      if (!ans) continue;
      const nHuecos = ans.length;
      const distintosAns = Array.from(new Set(ans));
      const objetivo = Math.max(3, Math.min(2 * nHuecos, cat === 'persona' ? 99 : 2 * nHuecos), distintosAns.length + 2);
      const vals = distintosAns.slice();
      const uniq = (arr) => Array.from(new Set(arr));
      const plaus = r.shuffle(uniq(plausibles[cat]).filter((v) => !vals.includes(v)));
      const textoUsado = new Set(vals.map((v) => textoValor(cat, v, 'es')));
      for (const v of plaus) {
        if (vals.length >= objetivo) break;
        const tx = textoValor(cat, v, 'es');
        if (textoUsado.has(tx)) continue;
        vals.push(v); textoUsado.add(tx); senuelosPlausibles++;
      }
      // en persona se ponen todos los tripulantes aunque sobren (todos son plausibles)
      if (cat === 'persona') for (const c of md.crew) if (!vals.includes(c.nombre)) { vals.push(c.nombre); senuelosPlausibles++; }
      if (cat === 'hora' && vals.length < objetivo) {
        // horas cercanas que no aparecen en ningún registro (relleno)
        const base = T.tFail;
        for (let d = 2; vals.length < objetivo && d < 40; d++) { const v = hm(base + (d % 2 ? d : -d)); if (!vals.includes(v)) vals.push(v); }
      }
      for (const v of r.shuffle(uniq(catalogo[cat]).filter((v) => !vals.includes(v)))) {
        if (vals.length >= objetivo) break;
        const tx = textoValor(cat, v, 'es');
        if (textoUsado.has(tx)) continue;
        vals.push(v); textoUsado.add(tx);
      }
      // multiplicidad uniforme por categoría: no delata qué valor se usa dos veces
      const maxAns = Math.max.apply(null, distintosAns.map((v) => ans.filter((x) => x === v).length));
      const m = Math.max(maxAns, Math.ceil((2 * nHuecos) / vals.length));
      mult[cat] = m;
      const ordenVals = cat === 'hora' ? vals.slice().sort() : r.shuffle(vals);
      for (const v of ordenVals) banco.push({ id: 'f' + (++nId), cat, valor: v, n: m, txt: { es: textoValor(cat, v, 'es'), en: textoValor(cat, v, 'en') } });
    }
    return { banco, mult, senuelosPlausibles };
  }

  // ───────────────────────── Caso completo ─────────────────────────
  function intentar(semilla, o) {
    const r = CNX.RNG(semilla);
    const rt = CNX.RNG(semilla ^ 0x5bd1e995);
    const md = construirModelo(r, o);
    const regs = construirRegistros(r, rt, md);
    const valores = hechosModelo(md);
    const nHuecos = Math.min(o.huecos || (md.dif === 1 ? 6 : md.dif === 2 ? r.i(8, 9) : r.i(10, 12)), disponibles(md).length);
    const claves = elegirHuecos(r, md, nHuecos, o.forzar && o.forzar.huecos);
    const { huecos, informe } = construirInforme(md, claves, valores);
    const { banco, mult, senuelosPlausibles } = construirBanco(r, md, regs, huecos);
    const W = CNX.mundo;
    const inc = W.INCIDENTES[md.incId];
    const caso = {
      v: 1,
      semilla: semilla >>> 0,
      dif: md.dif,
      nave: md.nave.id,
      tipoNave: W.TIPOS_NAVE[md.nave.tipo],
      incidente: { es: inc.es, en: inc.en },
      numIncidente: String(1000 + (semilla % 9000)).padStart(4, '0'),
      diaMision: 20 + (semilla % 700),
      horaIncidente: hm(md.t.tFail),
      resumen: resumenVago(md),
      tripulacion: md.crew.map((c) => ({ nombre: c.nombre, rol: c.rol, cs: c.cs, parche: c.parche, g: c.g })),
      registros: regs,
      informe,
      huecos,
      banco,
      mult,
      meta: { via: md.via, con: md.con, lugarLit: md.lugarLit, horaLit: md.horaLit, sisLit: md.sisLit, senuelosPlausibles, incId: md.incId, sis: md.sis, causa: md.causa, M: md.M, refugio: md.refugio }
    };
    return caso;
  }

  function resumenVago(md) {
    const W = CNX.mundo;
    const inc = W.INCIDENTES[md.incId];
    const tarea = { es: 'durante una tarea de rutina', en: 'during a routine task' };
    return { es: inc.es + ' ' + tarea.es + '.', en: inc.en + ' ' + tarea.en + '.' };
  }

  // Genera con reintentos hasta que el solucionador certifica el caso y la dificultad cae en el rango pedido.
  function generar(o) {
    const base = (o.semilla >>> 0);
    const ventana = o.ventanaD || null;
    let mejor = null;
    for (let n = 0; n < 50; n++) {
      const s = (base + Math.imul(n, 0x9E3779B9)) >>> 0;
      let caso;
      try { caso = intentar(s, o); } catch (e) { continue; }
      const v = CNX.validarCaso(caso);
      caso.D = v.D; caso.saltos = v.saltos; caso.cadena = v.cadena; caso.intentos = n + 1;
      if (!v.ok) continue;
      if (!mejor) mejor = caso;
      if (!ventana || (v.D >= ventana[0] && v.D <= ventana[1])) return caso;
    }
    if (mejor) { mejor.fueraDeRango = true; return mejor; }
    return null; // la app usa un caso de respaldo
  }

  CNX.gen = { generar, intentar, textoValor, hm, CATS, CAT_DE, ORDEN_HECHOS };
})(typeof window !== 'undefined' ? window : globalThis);
