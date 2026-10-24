// JET//Caja Negra · solucionador. Lee SOLO las afirmaciones de los registros (lo que dice cada línea),
// nunca el modelo del generador. Deduce cada hecho del informe, cuenta los saltos (registros necesarios),
// comprueba que cada hueco tenga una única respuesta y arma la cadena «Cómo se sabía».
(function (G) {
  'use strict';
  const CNX = G.CNX || (G.CNX = {});
  const plano = (s) => String(s).replace(/\u0001[^\u0002]*\u0002/g, '').replace(/\u0003/g, '');
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const hm = (m) => pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);

  function resolver(caso) {
    const problemas = [];
    const avisos = []; // hechos que no se pueden deducir: solo son error si el informe los pregunta
    const claims = [];
    caso.registros.forEach((reg, ri) => {
      (reg.claims || []).forEach((c) => claims.push(Object.assign({ src: [ri, -1], tipo: reg.tipo }, c)));
      (reg.lineas || []).forEach((l, li) => (l.claims || []).forEach((c) => claims.push(Object.assign({ src: [ri, li], tipo: reg.tipo }, c))));
    });
    const de = (k) => claims.filter((c) => c.k === k);
    const crew = de('crew');
    const porCs = {}, porRol = {}, porParche = {};
    for (const c of crew) { porCs[c.cs] = c; porRol[c.rol] = c; porParche[c.parche] = c; }

    function identificar(ref) {
      if (!ref) return null;
      if (ref.cs && porCs[ref.cs]) return { c: porCs[ref.cs], via: 'IND', src: [porCs[ref.cs].src] };
      if (ref.rol && porRol[ref.rol]) return { c: porRol[ref.rol], via: 'ROL', src: [porRol[ref.rol].src] };
      if (ref.parche != null && porParche[ref.parche]) return { c: porParche[ref.parche], via: 'PAR', src: [porParche[ref.parche].src] };
      return null;
    }

    const R = {}; // clave → { valor, srcs: [[ri,li]], regla, extra }
    const unir = (...listas) => { const out = []; const vistos = new Set(); for (const l of listas) for (const s of l || []) { const k = s.join(','); if (!vistos.has(k)) { vistos.add(k); out.push(s); } } return out; };

    // ── Cuándo y dónde falló
    const series = de('serie');
    const cambian = series.filter((s) => s.cambio != null);
    const aviso = de('aviso')[0];
    if (cambian.length === 1) {
      R.horaFallo = { valor: hm(cambian[0].cambio), srcs: [cambian[0].src], regla: 'HOR', extra: cambian[0] };
      R.lugarFallo = { valor: cambian[0].mod, srcs: [cambian[0].src], regla: 'LUG', extra: cambian[0] };
    } else if (cambian.length > 1) problemas.push('varias curvas cambian');
    if (aviso && aviso.ahora) {
      if (R.horaFallo && R.horaFallo.valor !== hm(aviso.t)) problemas.push('hora del aviso y de la curva no coinciden');
      R.horaFallo = { valor: hm(aviso.t), srcs: [aviso.src], regla: 'horaLit', extra: aviso };
    }
    if (aviso && aviso.mod) {
      if (R.lugarFallo && R.lugarFallo.valor !== aviso.mod) problemas.push('lugar del aviso y de la curva no coinciden');
      R.lugarFallo = { valor: aviso.mod, srcs: [aviso.src], regla: 'lugarLit', extra: aviso };
    }
    if (!R.horaFallo) avisos.push('la hora del fallo no se puede deducir');
    if (!R.lugarFallo) avisos.push('el lugar del fallo no se puede deducir');

    // ── Qué sistema y por qué
    const mant = de('mant');
    if (R.lugarFallo) {
      const enLugar = mant.filter((m) => m.mod === R.lugarFallo.valor);
      if (aviso && aviso.sis) {
        R.sistema = { valor: aviso.sis, srcs: [aviso.src], regla: 'sisLit' };
        if (enLugar.length && !enLugar.some((m) => m.sis === aviso.sis)) problemas.push('el sistema del aviso no está en el lugar');
      } else if (enLugar.length === 1) {
        R.sistema = { valor: enLugar[0].sis, srcs: unir(R.lugarFallo.srcs, [enLugar[0].src]), regla: 'MANlug', extra: enLugar[0] };
      } else avisos.push('el sistema no se puede deducir (' + enLugar.length + ' equipos en el lugar)');
    }
    if (R.sistema) {
      const fichas = mant.filter((m) => m.sis === R.sistema.valor);
      if (fichas.length === 1 && fichas[0].anom) R.causa = { valor: fichas[0].anom, srcs: unir(R.sistema.srcs, [fichas[0].src]), regla: 'MAN', extra: fichas[0] };
      else avisos.push('la causa no se puede deducir');
    }

    // ── Quién estaba allí y qué hizo
    if (R.lugarFallo && R.horaFallo) {
      const [hh, mm] = R.horaFallo.valor.split(':').map(Number);
      const tF = hh * 60 + mm;
      const hechos = de('hace').filter((h) => h.mod === R.lugarFallo.valor && h.t <= tF);
      const tMax = Math.max.apply(null, hechos.map((h) => h.t).concat([-1]));
      const ult = hechos.filter((h) => h.t === tMax);
      if (ult.length !== 1) avisos.push('la acción previa al fallo no es única (' + ult.length + ')');
      else {
        const h = ult[0];
        const base = unir(R.lugarFallo.srcs, R.horaFallo.srcs, [h.src]);
        let id = identificar(h.ref);
        if (id) {
          R.actor = { valor: id.c.nombre, srcs: unir(base, id.src), regla: id.via, extra: { h, c: id.c } };
        } else if (h.ref && h.ref.ilegible) {
          // eliminación: quien no estaba en otro sitio a esa misma hora
          const fuera = de('esta').filter((e) => e.t === h.t && e.mod !== h.mod).concat(de('hace').filter((x) => x.t === h.t && x.mod !== h.mod && x.ref && !x.ref.ilegible));
          const excluidos = new Set();
          const srcFuera = [];
          for (const e of fuera) { const i2 = identificar(e.ref); if (i2) { excluidos.add(i2.c.nombre); srcFuera.push(e.src, i2.src[0]); } }
          const cand = crew.filter((c) => !excluidos.has(c.nombre));
          if (cand.length === 1) R.actor = { valor: cand[0].nombre, srcs: unir(base, srcFuera, [cand[0].src]), regla: 'ELI', extra: { h, c: cand[0] } };
          else avisos.push('la eliminación deja ' + cand.length + ' candidatos');
        } else avisos.push('no se identifica a quien actuó');
        R.accionInicial = { valor: h.act, srcs: unir(R.lugarFallo.srcs, [h.src]), regla: 'lit', extra: h };
        const plan = de('plan').find((p) => p.act === h.act && p.mod === h.mod);
        R.horaAccion = { valor: hm(h.t), srcs: plan ? unir([h.src], [plan.src]) : [h.src], regla: plan ? 'CON' : 'lit', extra: { h, plan } };
      }
    }

    // ── Aviso, orden y refugio
    if (aviso) {
      const id = identificar(aviso.ref);
      if (id) R.avisador = { valor: id.c.nombre, srcs: unir([aviso.src], id.src), regla: 'IND', extra: { aviso, c: id.c } };
      else avisos.push('no se identifica a quien dio el aviso');
    }
    const orden = de('orden')[0];
    if (orden) {
      const id = identificar(orden.ref);
      if (id) R.respondedor = { valor: id.c.nombre, srcs: unir([orden.src], id.src), regla: 'IND', extra: { orden, c: id.c } };
      else avisos.push('no se identifica a quien dio la orden');
      R.respuesta = { valor: orden.act, srcs: [orden.src], regla: 'lit', extra: orden };
      R.refugio = { valor: orden.refugio, srcs: [orden.src], regla: 'lit', extra: orden };
    }

    // ── Foto
    const foto = de('foto')[0];
    if (foto) {
      R.horaFoto = { valor: hm(foto.t), srcs: [foto.src], regla: 'REL', extra: foto };
      if (R.refugio && R.refugio.valor !== foto.mod) problemas.push('la foto no es del refugio');
      const id = identificar({ parche: foto.kit });
      if (id) R.reparador = { valor: id.c.nombre, srcs: unir([foto.src], id.src), regla: 'PAR', extra: { foto, c: id.c } };
      else avisos.push('el parche del kit no está en la ficha');
    }
    const cierre = de('cierre')[0];
    if (cierre) R.consecuencia = { valor: cierre.cons, srcs: [cierre.src], regla: 'lit', extra: cierre };

    return { R, problemas, avisos, claims };
  }

  // ───────────────────────── Cadena «Cómo se sabía» ─────────────────────────
  function cadena(caso, R) {
    const W = CNX.mundo, TX = CNX.TX;
    const preguntados = new Set(Object.values(caso.huecos).map((h) => h.clave));
    const grupos = [
      ['horaFallo', 'lugarFallo'],
      ['actor', 'accionInicial', 'horaAccion'],
      ['sistema', 'causa'],
      ['avisador', 'respondedor', 'respuesta', 'refugio'],
      ['horaFoto', 'reparador', 'consecuencia']
    ];
    const pasos = [];
    for (const g of grupos) {
      if (!g.some((k) => preguntados.has(k))) continue;
      const txt = { es: [], en: [] };
      let srcs = [];
      const regla = new Set();
      for (const lang of ['es', 'en']) {
        const h = TX.ayudantes(lang);
        const C = TX.CADENA[lang];
        const P = (s) => plano(s);
        const frases = [];
        const add = (s) => { if (s && !frases.includes(s)) frases.push(s); };
        for (const k of g) {
          if (!preguntados.has(k) || !R[k]) continue;
          const x = R[k];
          if (lang === 'es') srcs = srcs.concat(x.srcs);
          regla.add(x.regla);
          switch (k) {
            case 'horaFallo': case 'lugarFallo': {
              if (x.regla === 'HOR' || x.regla === 'LUG') {
                const s = R.horaFallo && R.horaFallo.regla === 'HOR' ? R.horaFallo.extra : x.extra;
                add(C.hora({ canal: W.CANALES[s.canal][lang].toLowerCase(), modTxt: P(h.en(s.mod)), t: hm(s.cambio) }));
                if (k === 'lugarFallo') add(C.lugar({ canal: W.CANALES[s.canal][lang].toLowerCase(), deMod: P(lang === 'es' ? h.de(s.mod) : h.en(s.mod)) }));
              } else if (x.regla === 'horaLit') add(C.horaLit({ t: x.valor }));
              else if (x.regla === 'lugarLit') add(C.lugarLit({ modTxt: P(h.m(x.valor)) }));
              break;
            }
            case 'actor': {
              const { h: hh, c } = x.extra;
              const d = { cs: c.cs, nombre: c.nombre, hizo: TX.HIZO[lang][hh.act], t: hm(hh.t), rol: P(h.rol(c)) };
              add(x.regla === 'IND' ? C.ind(d) : x.regla === 'ROL' ? C.rol(d) : C.eli(d));
              break;
            }
            case 'accionInicial': {
              const a = R.actor && R.actor.extra;
              if (a) add(a.h.ref && a.h.ref.cs ? C.ind({ cs: a.c.cs, nombre: a.c.nombre, hizo: TX.HIZO[lang][a.h.act], t: hm(a.h.t) }) : a.h.ref && a.h.ref.rol ? C.rol({ rol: P(h.rol(a.c)), nombre: a.c.nombre, hizo: TX.HIZO[lang][a.h.act], t: hm(a.h.t) }) : C.eli({ t: hm(a.h.t), nombre: a.c.nombre }));
              break;
            }
            case 'horaAccion': {
              if (x.regla === 'CON') add(C.con({ tPlan: hm(x.extra.plan.t), t: x.valor }));
              else if (R.actor) { const a = R.actor.extra; add(a.h.ref && a.h.ref.rol ? C.rol({ rol: P(h.rol(a.c)), nombre: a.c.nombre, hizo: TX.HIZO[lang][a.h.act], t: hm(a.h.t) }) : a.h.ref && a.h.ref.cs ? C.ind({ cs: a.c.cs, nombre: a.c.nombre, hizo: TX.HIZO[lang][a.h.act], t: hm(a.h.t) }) : C.eli({ t: hm(a.h.t), nombre: a.c.nombre })); }
              break;
            }
            case 'sistema': {
              if (x.regla === 'sisLit') add(C.sisLit({ sis: P(h.s(x.valor)) }));
              else { if (R.lugarFallo && R.lugarFallo.regla !== 'lugarLit' && !preguntados.has('lugarFallo')) add(C.lugar({ canal: W.CANALES[R.lugarFallo.extra.canal][lang].toLowerCase(), deMod: P(lang === 'es' ? h.de(R.lugarFallo.valor) : h.en(R.lugarFallo.valor)) })); add(C.sis({ enMod: P(h.en(x.extra.mod)), sis: P(h.s(x.valor)) })); }
              break;
            }
            case 'causa': add(C.causa({ campo: x.extra.campoAnom ? x.extra.campoAnom[lang] : '' })); break;
            case 'avisador': add(C.aviso({ t: hm(x.extra.aviso.t), cs: x.extra.c.cs, nombre: x.extra.c.nombre })); break;
            case 'respondedor': case 'respuesta': {
              const o = R.respuesta && R.respuesta.extra;
              const c = R.respondedor && R.respondedor.extra && R.respondedor.extra.c;
              if (o && c) add(C.orden({ t: hm(o.t), cs: c.cs, nombre: c.nombre, orden: W.ACCIONES[o.act][lang] }));
              break;
            }
            case 'refugio': add(C.refugio({ a: P(h.a(x.valor)) })); break;
            case 'horaFoto': add(C.fotoHora({ t: x.valor, placa: x.extra.mod ? W.MODULOS[x.extra.mod].placa[lang] : '' })); break;
            case 'reparador': add(C.parche({ n: x.extra.c.parche, nombre: x.extra.c.nombre })); break;
            case 'consecuencia': {
              const reg = caso.registros[x.srcs[0][0]];
              add(C.cierre({ txt: P(reg.lineas[x.srcs[0][1]].txt[lang]).replace(/^[^:]+:\s*/, '').replace(/\.$/, '').replace(/^./, (c) => c.toUpperCase()) }));
              break;
            }
          }
        }
        txt[lang] = frases.join(' ');
      }
      const vistos = new Set();
      srcs = srcs.filter((s) => { const k = s.join(','); if (vistos.has(k)) return false; vistos.add(k); return true; });
      pasos.push({ claves: g.filter((k) => preguntados.has(k)), txt, srcs, reglas: Array.from(regla) });
    }
    return pasos;
  }

  // ───────────────────────── Validación completa ─────────────────────────
  function validarCaso(caso) {
    const { R, problemas } = resolver(caso);
    const saltos = {};
    let D = 0;
    let eli = 0;
    // 1) cada hueco: deducible y con el valor del informe
    for (const id in caso.huecos) {
      const hu = caso.huecos[id];
      const x = R[hu.clave];
      if (!x) { problemas.push(id + ' (' + hu.clave + ') no es deducible'); continue; }
      if (x.valor !== hu.valor) problemas.push(id + ' (' + hu.clave + ') deduce ' + x.valor + ' y el informe espera ' + hu.valor);
      const regs = new Set(x.srcs.map((s) => s[0]));
      saltos[hu.clave] = regs.size;
      D += regs.size;
      if (x.regla === 'ELI') eli++;
    }
    // 2) unicidad: en el banco, de cada categoría solo la ficha correcta es compatible con lo deducido
    const porCat = {};
    for (const f of caso.banco) (porCat[f.cat] = porCat[f.cat] || []).push(f);
    for (const id in caso.huecos) {
      const hu = caso.huecos[id];
      const fichas = porCat[hu.cat] || [];
      const x = R[hu.clave];
      if (!x) continue;
      const compatibles = fichas.filter((f) => f.valor === x.valor);
      if (compatibles.length !== 1) problemas.push(id + ': ' + compatibles.length + ' fichas compatibles');
    }
    // 3) reglas del banco: ≥3 fichas por categoría, ≥2 por hueco, textos distintos
    for (const cat in porCat) {
      const n = Object.values(caso.huecos).filter((h) => h.cat === cat).length;
      const fichas = porCat[cat];
      const total = fichas.reduce((a, f) => a + (f.n || 1), 0);
      if (fichas.length < 3) problemas.push(cat + ': menos de 3 fichas');
      if (total < 2 * n) problemas.push(cat + ': menos de 2 fichas por hueco');
      for (const lang of ['es', 'en']) {
        const t = fichas.map((f) => f.txt[lang]);
        if (new Set(t).size !== t.length) problemas.push(cat + ': fichas con el mismo texto (' + lang + ')');
      }
    }
    // 4) al menos un hecho cruza dos tipos de registro distintos
    let cruce = false;
    for (const id in caso.huecos) { const x = R[caso.huecos[id].clave]; if (x && new Set(x.srcs.map((s) => caso.registros[s[0]].tipo)).size >= 2) cruce = true; }
    if (!cruce) problemas.push('ningún hecho cruza dos registros');
    // 5) longitudes máximas por registro
    for (const reg of caso.registros) {
      const lim = { bitacora: 6, radio: 8, mantenimiento: 4, tripulacion: 6 }[reg.tipo];
      if (lim && reg.lineas.length > lim) problemas.push(reg.tipo + ': ' + reg.lineas.length + ' líneas');
    }
    D += 0.5 * ((caso.meta && caso.meta.senuelosPlausibles) || 0) + eli;
    const ok = problemas.length === 0;
    return { ok, D: Math.round(D * 10) / 10, saltos, problemas, cadena: ok ? cadena(caso, R) : [], respuestas: Object.fromEntries(Object.entries(R).map(([k, v]) => [k, v.valor])) };
  }

  CNX.resolver = resolver;
  CNX.validarCaso = validarCaso;
  CNX.plano = plano;
})(typeof window !== 'undefined' ? window : globalThis);
