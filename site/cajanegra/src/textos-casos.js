// JET//Caja Negra · plantillas de redacción de los registros y del informe, ES neutro de tú y EN neutro en paralelo.
// Cada plantilla es una función (h, d) => texto. h trae ayudantes del idioma que envuelven las entidades
// (personas, indicativos, roles, módulos, sistemas, horas, parches) en marcas \u0001id\u0002texto\u0003
// para que la interfaz las subraye y se puedan marcar en todos los registros a la vez.
(function (G) {
  'use strict';
  const CNX = G.CNX || (G.CNX = {});
  const W = () => CNX.mundo;

  const E = (id, txt) => '\u0001' + id + '\u0002' + txt + '\u0003';
  const cap = (s) => {
    // Pone en mayúscula la primera letra visible (salta las marcas de entidad).
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '\u0001') { const j = s.indexOf('\u0002', i); i = j; continue; }
      if (ch === '\u0002' || ch === '\u0003' || ch === ' ') continue;
      return s.slice(0, i) + ch.toUpperCase() + s.slice(i + 1);
    }
    return s;
  };

  function ayudantes(lang) {
    const M = W().MODULOS, S = W().SISTEMAS, R = W().ROLES;
    if (lang === 'es') {
      return {
        lang,
        cap,
        p: (c) => E('p:' + c.nombre, c.nombre),
        cs: (c) => E('cs:' + c.cs, c.cs),
        csIleg: (nave) => nave + '-' + E('ileg', '[ilegible]'),
        rol: (c) => { const r = R[c.rol]; const art = c.g === 'f' ? 'la' : 'el'; return art + ' ' + E('r:' + c.rol, c.g === 'f' ? r.fN : r.mN); },
        rolN: (c) => { const r = R[c.rol]; return E('r:' + c.rol, c.g === 'f' ? r.fN : r.mN); },
        m: (k) => M[k].art + ' ' + E('m:' + k, M[k].es),
        mN: (k) => E('m:' + k, M[k].es),
        en: (k) => 'en ' + M[k].art + ' ' + E('m:' + k, M[k].es),
        a: (k) => (M[k].art === 'el' ? 'al ' : 'a la ') + E('m:' + k, M[k].es),
        de: (k) => (M[k].art === 'el' ? 'del ' : 'de la ') + E('m:' + k, M[k].es),
        fem: (k) => M[k].art === 'la',
        s: (k) => S[k].art + ' ' + E('s:' + k, S[k].es),
        sN: (k) => E('s:' + k, cap(S[k].es)),
        sFem: (k) => S[k].art === 'la',
        t: (x) => E('t:' + x, x),
        pa: (n) => E('pa:' + n, String(n))
      };
    }
    const strip = (s) => s.replace(/^the /, '');
    const art = (s) => (/^the /.test(s) ? 'the ' : '');
    return {
      lang,
      cap,
      p: (c) => E('p:' + c.nombre, c.nombre),
      cs: (c) => E('cs:' + c.cs, c.cs),
      csIleg: (nave) => nave + '-' + E('ileg', '[unreadable]'),
      rol: (c) => 'the ' + E('r:' + c.rol, R[c.rol].enN),
      rolN: (c) => E('r:' + c.rol, R[c.rol].enN),
      m: (k) => art(M[k].en) + E('m:' + k, strip(M[k].en)),
      mN: (k) => E('m:' + k, M[k].enN),
      en: (k) => (k === 'mastil' ? 'at ' : 'in ') + art(M[k].en) + E('m:' + k, strip(M[k].en)),
      a: (k) => 'to ' + art(M[k].en) + E('m:' + k, strip(M[k].en)),
      de: (k) => 'of ' + art(M[k].en) + E('m:' + k, strip(M[k].en)),
      fem: () => false,
      s: (k) => art(S[k].en) + E('s:' + k, strip(S[k].en)),
      sN: (k) => E('s:' + k, cap(strip(S[k].en))),
      sFem: () => false,
      t: (x) => E('t:' + x, x),
      pa: (n) => E('pa:' + n, String(n))
    };
  }

  // ───────────── Acciones en distintas personas y tiempos ─────────────
  // v1: primera persona (radio). v3: tercera persona (bitácora). fut: plan (infinitivo / base). ord: orden a la tripulación.
  const ACC = {
    abrir_esclusa: {
      es: { v1: ['abro {m} y entro', 'abro {m}; entro ya', 'paso por {m}: abierta, entro'], v3: ['abre {m} y entra', 'entra por {m}'], fut: 'abrir {m}', ord: 'Abran {m}' },
      en: { v1: ['opening {m}, going in', 'cycling {m}, I\'m going in', '{m} is open, entering now'], v3: ['opens {m} and goes in', 'goes in through {m}'], fut: 'open {m}', ord: 'Open {m}' },
      propia: true // la frase ya nombra el módulo: no se añade «en …»
    },
    cambiar_filtro: {
      es: { v1: ['cambio el filtro', 'empiezo el cambio de filtro', 'saco el filtro viejo y pongo el nuevo'], v3: ['cambia el filtro', 'empieza el cambio de filtro'], fut: 'cambiar el filtro', ord: 'Cambien el filtro' },
      en: { v1: ['swapping the filter', 'starting the filter change', 'pulling the old filter, fitting the new one'], v3: ['swaps the filter', 'starts the filter change'], fut: 'swap the filter', ord: 'Swap the filter' }
    },
    reiniciar_regulador: {
      es: { v1: ['reinicio el regulador', 'reinicio del regulador, ahora', 'mando el reinicio del regulador'], v3: ['reinicia el regulador', 'manda el reinicio del regulador'], fut: 'reiniciar el regulador', ord: 'Reinicien el regulador' },
      en: { v1: ['restarting the regulator', 'regulator restart, now', 'sending the regulator restart'], v3: ['restarts the regulator', 'sends the regulator restart'], fut: 'restart the regulator', ord: 'Restart the regulator' }
    },
    purgar_linea: {
      es: { v1: ['purgo la línea', 'empiezo la purga de la línea', 'abro la purga de la línea'], v3: ['purga la línea', 'empieza la purga de la línea'], fut: 'purgar la línea', ord: 'Purguen la línea' },
      en: { v1: ['purging the line', 'starting the line purge', 'opening the line purge'], v3: ['purges the line', 'starts the line purge'], fut: 'purge the line', ord: 'Purge the line' }
    },
    encender_propulsor: {
      es: { v1: ['enciendo el propulsor', 'encendido del propulsor, ya', 'doy el encendido al propulsor'], v3: ['enciende el propulsor', 'da el encendido al propulsor'], fut: 'encender el propulsor', ord: 'Enciendan el propulsor' },
      en: { v1: ['firing the thruster', 'thruster burn, now', 'giving the thruster the go'], v3: ['fires the thruster', 'starts the thruster burn'], fut: 'fire the thruster', ord: 'Fire the thruster' }
    },
    desplegar_brazo: {
      es: { v1: ['despliego el brazo', 'saco el brazo para la maniobra', 'empiezo a desplegar el brazo'], v3: ['despliega el brazo', 'empieza a desplegar el brazo'], fut: 'desplegar el brazo', ord: 'Desplieguen el brazo' },
      en: { v1: ['deploying the arm', 'bringing the arm out for the maneuver', 'starting the arm deployment'], v3: ['deploys the arm', 'starts the arm deployment'], fut: 'deploy the arm', ord: 'Deploy the arm' }
    },
    calibrar_antena: {
      es: { v1: ['calibro la antena', 'empiezo la calibración de la antena', 'ajusto y calibro la antena'], v3: ['calibra la antena', 'empieza la calibración de la antena'], fut: 'calibrar la antena', ord: 'Calibren la antena' },
      en: { v1: ['calibrating the antenna', 'starting the antenna calibration', 'trimming and calibrating the antenna'], v3: ['calibrates the antenna', 'starts the antenna calibration'], fut: 'calibrate the antenna', ord: 'Calibrate the antenna' }
    },
    conectar_celda: {
      es: { v1: ['conecto la celda', 'pongo la celda en línea', 'conexión de la celda, ahora'], v3: ['conecta la celda', 'pone la celda en línea'], fut: 'conectar la celda', ord: 'Conecten la celda' },
      en: { v1: ['connecting the cell', 'bringing the cell online', 'cell connection, now'], v3: ['connects the cell', 'brings the cell online'], fut: 'connect the cell', ord: 'Connect the cell' }
    },
    orientar_panel: {
      es: { v1: ['oriento el panel', 'giro el panel hacia el sol', 'empiezo a orientar el panel'], v3: ['orienta el panel', 'gira el panel hacia el sol'], fut: 'orientar el panel', ord: 'Orienten el panel' },
      en: { v1: ['angling the panel', 'turning the panel to the sun', 'starting to angle the panel'], v3: ['angles the panel', 'turns the panel to the sun'], fut: 'angle the panel', ord: 'Angle the panel' }
    },
    sellar_puerta: {
      es: { v1: ['sello la puerta estanca', 'cierro y sello la puerta estanca', 'empiezo el sellado de la puerta estanca'], v3: ['sella la puerta estanca', 'cierra y sella la puerta estanca'], fut: 'sellar la puerta estanca', ord: 'Sellen la puerta estanca' },
      en: { v1: ['sealing the pressure door', 'closing and sealing the pressure door', 'starting to seal the pressure door'], v3: ['seals the pressure door', 'closes and seals the pressure door'], fut: 'seal the pressure door', ord: 'Seal the pressure door' }
    },
    aislar_modulo: {
      es: { v1: ['aíslo el módulo'], v3: ['aísla el módulo'], fut: 'aislar el módulo', ord: 'Aíslen {m}' },
      en: { v1: ['isolating the module'], v3: ['isolates the module'], fut: 'isolate the module', ord: 'Isolate {m}' }
    },
    cortar_energia: {
      es: { v1: ['corto la energía'], v3: ['corta la energía'], fut: 'cortar la energía', ord: 'Corten la energía {de}' },
      en: { v1: ['cutting the power'], v3: ['cuts the power'], fut: 'cut the power', ord: 'Cut power to {m}' }
    },
    evacuar: {
      es: { v1: ['salgo del módulo'], v3: ['evacúa el módulo'], fut: 'evacuar el módulo', ord: 'Evacúen {m}' },
      en: { v1: ['leaving the module'], v3: ['evacuates the module'], fut: 'evacuate the module', ord: 'Evacuate {m}' }
    },
    reorientar: {
      es: { v1: ['reoriento la nave'], v3: ['reorienta la nave'], fut: 'reorientar la nave', ord: 'Vamos a reorientar la nave' },
      en: { v1: ['reorienting the ship'], v3: ['reorients the ship'], fut: 'reorient the ship', ord: 'We\'re reorienting the ship' }
    },
    pedir_apoyo: {
      es: { v1: ['pido apoyo a tierra'], v3: ['pide apoyo a tierra'], fut: 'pedir apoyo a tierra', ord: 'Control, pedimos apoyo' },
      en: { v1: ['calling ground for support'], v3: ['calls ground for support'], fut: 'call ground for support', ord: 'Control, we request support' }
    }
  };

  function rellenar(txt, h, mod) {
    return txt.replace('{m}', h.m(mod)).replace('{de}', h.de(mod));
  }

  // Frase de radio de quien hace una acción en un módulo (primera persona).
  function radioAccion(h, r, act, mod) {
    const A = ACC[act][h.lang];
    const v = rellenar(r.pick(A.v1), h, mod);
    if (ACC[act].propia) return cap(v) + '.';
    const marcos = h.lang === 'es'
      ? [(x) => cap(h.en(mod)) + ': ' + x + '.', (x) => 'Estoy ' + h.en(mod) + ', ' + x + '.', (x) => cap(x) + ' ' + h.en(mod) + '.']
      : [(x) => cap(h.en(mod)) + ': ' + x + '.', (x) => 'I\'m ' + h.en(mod) + ', ' + x + '.', (x) => cap(x) + ' ' + h.en(mod) + '.'];
    return r.pick(marcos)(v);
  }
  // Fragmento ilegible de la misma acción (variante RUI/ELI).
  function radioAccionIlegible(h, r, act, mod) {
    const A = ACC[act][h.lang];
    const v = rellenar(A.v1[0], h, mod);
    if (ACC[act].propia) return '…' + v + '…';
    return '…' + v + '… ' + h.en(mod) + '…';
  }
  // Entrada de bitácora en tercera persona.
  function bitacoraAccion(h, r, sujeto, act, mod) {
    const A = ACC[act][h.lang];
    const v = rellenar(r.pick(A.v3), h, mod);
    if (ACC[act].propia) return cap(sujeto) + ' ' + v + '.';
    return cap(sujeto) + ' ' + v + ' ' + h.en(mod) + '.';
  }
  function planAccion(h, r, act, mod, t) {
    const A = ACC[act][h.lang];
    const v = rellenar(A.fut, h, mod);
    const donde = ACC[act].propia ? '' : ' ' + h.en(mod);
    return h.lang === 'es'
      ? r.pick(['Plan del día: ' + v + donde + ' a las ' + h.t(t) + '.', 'Previsto para hoy: ' + v + donde + ' a las ' + h.t(t) + '.'])
      : r.pick(['Today\'s plan: ' + v + donde + ' at ' + h.t(t) + '.', 'Scheduled for today: ' + v + donde + ' at ' + h.t(t) + '.']);
  }
  function ordenAccion(h, r, act, mod) {
    const o = rellenar(ACC[act][h.lang].ord, h, mod);
    if (act === 'pedir_apoyo' || act === 'reorientar') return o + '.';
    const p = r.pick(h.lang === 'es' ? ['', 'Atención, tripulación: ', 'Orden: '] : ['', 'Attention, crew: ', 'Order: ']);
    return p ? p + o.charAt(0).toLowerCase() + o.slice(1) + '.' : o + '.';
  }
  function refugioLinea(h, r, mod) {
    return h.lang === 'es'
      ? r.pick(['Todos ' + h.a(mod) + '. Repito, todos ' + h.a(mod) + '.', 'Toda la tripulación ' + h.a(mod) + '.', 'Nos reunimos ' + h.en(mod) + ', ya.'])
      : r.pick(['Everyone ' + h.a(mod) + '. Repeat, everyone ' + h.a(mod) + '.', 'All crew ' + h.a(mod) + '.', 'We gather ' + h.en(mod) + ', now.']);
  }

  // Alarma por incidente.
  const ALARMA = {
    presion: { es: ['Perdemos presión', 'Cae la presión'], en: ['We\'re losing pressure', 'Pressure is dropping'] },
    humo: { es: ['Hay humo', 'Huele a quemado y hay humo'], en: ['There\'s smoke', 'Something is burning, there\'s smoke'] },
    calor: { es: ['La temperatura se dispara', 'Sube mucho la temperatura'], en: ['Temperature is spiking', 'It\'s heating up fast'] },
    orientacion: { es: ['La nave está girando', 'Perdemos la orientación'], en: ['The ship is spinning', 'We\'re losing attitude'] },
    comunicaciones: { es: ['Se cae el enlace con tierra', 'Perdemos la señal'], en: ['The ground link is dropping', 'We\'re losing signal'] },
    refrigerante: { es: ['Fuga de refrigerante', 'Hay refrigerante suelto'], en: ['Coolant leak', 'There\'s coolant loose'] },
    energia: { es: ['Nos quedamos sin energía', 'Cae la tensión'], en: ['We\'re losing power', 'Voltage is dropping'] },
    micrometeorito: { es: ['Algo nos golpeó y perdemos presión', 'Golpe en el casco, cae la presión'], en: ['Something hit us, we\'re losing pressure', 'Hull strike, pressure is dropping'] },
    acople: { es: ['El acople falla', 'La maniobra de acople se descontrola'], en: ['Docking is failing', 'The docking maneuver is out of control'] },
    aire: { es: ['El aire está viciado', 'Sube el CO₂'], en: ['The air is going bad', 'CO₂ is climbing'] }
  };
  function alarmaLinea(h, r, inc, opts) {
    // opts: { mod (si se nombra), ahora (bool), sis (si se nombra) }
    const base = r.pick(ALARMA[inc][h.lang]);
    let s = base;
    if (opts.mod) s += ' ' + h.en(opts.mod);
    if (h.lang === 'es') s += opts.ahora ? ', ¡ahora mismo!' : r.pick([', empezó hace un momento.', '. Empezó hace un momento.', ', desde hace un momento.']);
    else s += opts.ahora ? ', right now!' : r.pick([', it started a moment ago.', '. It started a moment ago.', ', since a moment ago.']);
    if (opts.sis) {
      const fr = W().SISTEMAS[opts.sis].frag[h.lang];
      const marcado = fr.replace(/\*(.+?)\*/, (all, n) => E('s:' + opts.sis, n));
      s += h.lang === 'es' ? ' Parece que ' + marcado + '.' : ' Looks like ' + marcado + '.';
    }
    return s;
  }

  function controlLinea(h, r, nave) {
    return h.lang === 'es'
      ? r.pick(['Recibido, ' + nave + '. Seguimos con ustedes.', 'Recibido, ' + nave + '. Estamos en línea.', 'Recibido, ' + nave + '. Preparamos el procedimiento.'])
      : r.pick(['Copy, ' + nave + '. We\'re with you.', 'Copy, ' + nave + '. We\'re on the line.', 'Roger, ' + nave + '. Preparing the procedure.']);
  }
  function recibidoLinea(h, r) {
    return h.lang === 'es' ? r.pick(['Recibido.', 'Recibido, voy.', 'Entendido.']) : r.pick(['Copy.', 'Copy, on my way.', 'Understood.']);
  }

  // Posición de un tripulante en la bitácora (presente, al abrir la entrada).
  function posicionLinea(h, r, c, mod) {
    const tareasEs = ['con el diagnóstico de energía', 'con el inventario', 'con los experimentos del día', 'revisando consolas', 'con la revisión médica semanal', 'preparando la carga'];
    const tareasEn = ['running the power diagnostic', 'doing the inventory', 'on today\'s experiments', 'checking consoles', 'on the weekly medical check', 'preparing the cargo'];
    if (h.lang === 'es') return cap(h.rol(c)) + ' ' + r.pick(['sigue', 'trabaja', 'está']) + ' ' + h.en(mod) + ' ' + r.pick(tareasEs) + '.';
    return cap(h.rol(c)) + ' ' + r.pick(['is still', 'is working', 'is']) + ' ' + h.en(mod) + ', ' + r.pick(tareasEn) + '.';
  }

  // Cierre de bitácora según consecuencia (paráfrasis, no repite la ficha).
  function cierreLinea(h, r, cons, mod, sis) {
    const es = {
      aislamiento: () => h.m(mod) + ' queda ' + (h.fem(mod) ? 'cerrada' : 'cerrado') + ' hasta nueva orden; el resto de la nave opera con normalidad.',
      aborto: () => 'se cancela la maniobra prevista. Habrá que esperar otra ventana.',
      perdidaCarga: () => 'la carga de la bahía se da por perdida; se informa al cliente.',
      regreso: () => 'control adelanta nuestra vuelta a tierra a la próxima ventana.',
      modoReducido: () => 'seguimos con ' + h.s(sis) + ' fuera de servicio y la mitad de los experimentos en pausa.',
      rescate: () => 'una nave de apoyo se acopla y nos traslada a todos.',
      reparacion: () => h.s(sis) + ' se sustituye en órbita al día siguiente; todo vuelve a la normalidad.',
      evacuacion: () => 'la tripulación deja la nave en la cápsula de emergencia.'
    };
    const en = {
      aislamiento: () => h.m(mod) + ' stays closed until further notice; the rest of the ship runs normally.',
      aborto: () => 'the planned maneuver is called off. We\'ll have to wait for another window.',
      perdidaCarga: () => 'the cargo in the bay is written off; the client has been told.',
      regreso: () => 'control moves our return home up to the next window.',
      modoReducido: () => 'we carry on with ' + h.s(sis) + ' out of service and half of the experiments on hold.',
      rescate: () => 'a support ship docks and takes all of us off.',
      reparacion: () => h.s(sis) + ' is replaced in orbit the next day; everything is back to normal.',
      evacuacion: () => 'the crew leaves the ship in the emergency capsule.'
    };
    const pre = h.lang === 'es' ? r.pick(['Cierre del día: ', 'Nota final: ', 'Última entrada: ']) : r.pick(['End of day: ', 'Final note: ', 'Last entry: ']);
    return pre + (h.lang === 'es' ? es : en)[cons]();
  }

  // ───────────── Mantenimiento: campos de la ficha ─────────────
  // anom = true → el campo delata esa causa. Devuelve texto del campo.
  function campoMant(h, r, causa, sis, anom, ctx) {
    const fem = h.sFem(sis);
    const es = h.lang === 'es';
    switch (causa) {
      case 'desgaste': {
        const L = r.pick([180, 240, 365, 400, 500, 730]);
        const d = anom ? L + r.i(18, 160) : Math.max(20, L - r.i(40, Math.min(170, L - 10)));
        return es ? (fem ? 'instalada' : 'instalado') + ' hace ' + d + ' días · vida útil ' + L + ' días' : 'installed ' + d + ' days ago · service life ' + L + ' days';
      }
      case 'malInstalada':
        return es ? 'verificación de montaje: ' + (anom ? 'pendiente' : 'firmada') : 'fitting check: ' + (anom ? 'pending' : 'signed off');
      case 'pasoOmitido': {
        const n = r.i(2, 7);
        return es ? 'lista de la última tarea: ' + (anom ? 'paso ' + n + ' sin firmar' : 'completa') : 'last task checklist: ' + (anom ? 'step ' + n + ' not signed' : 'complete');
      }
      case 'software': {
        const v = r.i(3, 9) + '.' + r.i(0, 9);
        const d = r.i(1, 6);
        return es ? (anom ? 'software v' + v + ' instalado hace ' + d + ' días, sin validar' : 'software v' + v + ', validado') : (anom ? 'software v' + v + ' installed ' + d + ' days ago, not validated' : 'software v' + v + ', validated');
      }
      case 'calibracion': {
        const d = r.i(12, 90);
        return es ? (anom ? 'calibración vencida hace ' + d + ' días' : 'calibración al día') : (anom ? 'calibration overdue by ' + d + ' days' : 'calibration up to date');
      }
      case 'impacto':
        return es ? 'sensor de impactos: ' + (anom ? '1 impacto registrado hoy' : 'sin registros') : 'impact sensor: ' + (anom ? '1 hit logged today' : 'no hits');
      case 'sobrecarga': {
        const p = anom ? r.i(128, 165) : r.i(55, 88);
        return es ? 'carga máxima de hoy: ' + p + ' % de la nominal' : 'today\'s peak load: ' + p + '% of rated';
      }
      case 'fatiga': {
        const lim = r.pick([4000, 5000, 6000, 8000]);
        const c = anom ? lim + r.i(120, 900) : lim - r.i(900, 2600);
        const f = (n) => (es ? n.toLocaleString('es-ES') : n.toLocaleString('en-US')).replace(/ /g, ' ');
        return es ? 'ciclos térmicos: ' + f(c) + ' de ' + f(lim) : 'thermal cycles: ' + f(c) + ' of ' + f(lim);
      }
      case 'aviso': {
        const d = r.i(4, 21);
        return es ? 'avisos abiertos: ' + (anom ? '1, sin atender desde hace ' + d + ' días' : 'ninguno') : 'open warnings: ' + (anom ? '1, unattended for ' + d + ' days' : 'none');
      }
      case 'lote':
        return es ? (anom ? 'lote K-19 · retirada pedida en el caso 18, aplazada' : 'lote ' + (ctx && ctx.lote ? ctx.lote : 'A-' + r.i(10, 99))) : (anom ? 'batch K-19 · recall requested in case 18, postponed' : 'batch ' + (ctx && ctx.lote ? ctx.lote : 'A-' + r.i(10, 99)));
    }
    return '';
  }

  // ───────────── Informe ─────────────
  // Cada frase recibe F(clave) → texto del hecho o marca de hueco (la pone el generador).
  const INFORME = {
    es: {
      S1: (F) => ['A las ', F('horaFallo'), ', ', F('sistema'), ' falló en ', F('lugarFallo'), '.'],
      S2: (F) => ['En ese momento, ', F('actor'), ' estaba allí tras ', F('accionInicial'), ' a las ', F('horaAccion'), '.'],
      S3: (F) => [F('avisador'), ' dio el aviso por radio.'],
      S4: (F) => ['La causa fue ', F('causa'), '.'],
      S5: (F) => [F('respondedor'), ' decidió ', F('respuesta'), '.'],
      S6f: (F) => ['A las ', F('horaFoto'), ', la tripulación estaba a salvo en ', F('refugio'), ', y ', F('reparador'), ' preparaba el kit de reparación.'],
      S6: (F) => ['La tripulación se reunió en ', F('refugio'), '.'],
      S7: (F) => ['El incidente terminó con ', F('consecuencia'), '.']
    },
    en: {
      S1: (F) => ['At ', F('horaFallo'), ', ', F('sistema'), ' failed in ', F('lugarFallo'), '.'],
      S2: (F) => ['At that moment, ', F('actor'), ' was there after ', F('accionInicial'), ' at ', F('horaAccion'), '.'],
      S3: (F) => [F('avisador'), ' raised the alarm over the radio.'],
      S4: (F) => ['The cause was ', F('causa'), '.'],
      S5: (F) => [F('respondedor'), ' responded by ', F('respuesta'), '.'],
      S6f: (F) => ['At ', F('horaFoto'), ', the crew was safe in ', F('refugio'), ', and ', F('reparador'), ' was preparing the repair kit.'],
      S6: (F) => ['The crew gathered in ', F('refugio'), '.'],
      S7: (F) => ['The incident ended with ', F('consecuencia'), '.']
    }
  };

  // ───────────── «Cómo se sabía» ─────────────
  const CADENA = {
    es: {
      horaLit: (d) => 'La radio da la hora del aviso: ' + d.t + ', «ahora mismo».',
      hora: (d) => 'En la telemetría, la única curva que se mueve es la de ' + d.canal + ' ' + d.modTxt + ', y empieza a cambiar a las ' + d.t + '.',
      lugarLit: (d) => 'El aviso por radio nombra el lugar: ' + d.modTxt + '.',
      lugar: (d) => 'De todas las curvas de ' + d.canal + ', solo cambia la ' + d.deMod + '.',
      sisLit: (d) => 'En la radio, el aviso dice qué falla: ' + d.sis + '.',
      sis: (d) => 'En mantenimiento, el único equipo ' + d.enMod + ' es ' + d.sis + '.',
      causa: (d) => 'Su ficha de mantenimiento tiene un único dato fuera de lo normal: «' + d.campo + '».',
      ind: (d) => 'La radio dice que ' + d.cs + ' ' + d.hizo + ' a las ' + d.t + ', y la ficha de tripulación dice que ' + d.cs + ' es ' + d.nombre + '.',
      rol: (d) => 'La bitácora dice que ' + d.rol + ' ' + d.hizo + ' a las ' + d.t + ', y en la ficha de tripulación ' + d.rol + ' es ' + d.nombre + '.',
      eli: (d) => 'La voz de las ' + d.t + ' es ilegible, pero a esa hora el resto estaba en otro sitio según la bitácora y la radio: solo queda ' + d.nombre + '.',
      con: (d) => 'La bitácora preveía las ' + d.tPlan + ', pero eso era un plan: lo real es lo que dice la radio, las ' + d.t + '.',
      aviso: (d) => 'El aviso de las ' + d.t + ' lo da ' + d.cs + ', que en la ficha es ' + d.nombre + '.',
      orden: (d) => 'La orden de las ' + d.t + ' la da ' + d.cs + ' (' + d.nombre + '): ' + d.orden + '.',
      refugio: (d) => 'La misma orden manda a todos ' + d.a + '.',
      fotoHora: (d) => 'En la foto, el reloj de pared marca ' + d.t + ' y la placa dice ' + d.placa + '.',
      parche: (d) => 'En la foto, quien está junto al kit abierto lleva el parche ' + d.n + ', y en la ficha el parche ' + d.n + ' es de ' + d.nombre + '.',
      cierre: (d) => 'La última entrada de la bitácora cuenta cómo terminó: «' + d.txt + '».'
    },
    en: {
      horaLit: (d) => 'The radio gives the time of the alarm: ' + d.t + ', "right now".',
      hora: (d) => 'In the telemetry, the only curve that moves is ' + d.canal + ' ' + d.modTxt + ', and it starts changing at ' + d.t + '.',
      lugarLit: (d) => 'The radio alarm names the place: ' + d.modTxt + '.',
      lugar: (d) => 'Of all the ' + d.canal + ' curves, only the one ' + d.deMod + ' changes.',
      sisLit: (d) => 'On the radio, the alarm says what is failing: ' + d.sis + '.',
      sis: (d) => 'In maintenance, the only equipment ' + d.enMod + ' is ' + d.sis + '.',
      causa: (d) => 'Its maintenance sheet has a single abnormal entry: "' + d.campo + '".',
      ind: (d) => 'The radio says ' + d.cs + ' was ' + d.hizo + ' at ' + d.t + ', and the crew sheet says ' + d.cs + ' is ' + d.nombre + '.',
      rol: (d) => 'The logbook says ' + d.rol + ' was ' + d.hizo + ' at ' + d.t + ', and on the crew sheet ' + d.rol + ' is ' + d.nombre + '.',
      eli: (d) => 'The voice at ' + d.t + ' is unreadable, but at that time everyone else was somewhere else according to the logbook and the radio: only ' + d.nombre + ' is left.',
      con: (d) => 'The logbook planned ' + d.tPlan + ', but that was a plan: what really happened is what the radio says, ' + d.t + '.',
      aviso: (d) => 'The alarm at ' + d.t + ' comes from ' + d.cs + ', who is ' + d.nombre + ' on the crew sheet.',
      orden: (d) => 'The order at ' + d.t + ' comes from ' + d.cs + ' (' + d.nombre + '): ' + d.orden + '.',
      refugio: (d) => 'The same order sends everyone ' + d.a + '.',
      fotoHora: (d) => 'In the photo, the wall clock reads ' + d.t + ' and the sign says ' + d.placa + '.',
      parche: (d) => 'In the photo, whoever is next to the open kit wears patch ' + d.n + ', and on the crew sheet patch ' + d.n + ' belongs to ' + d.nombre + '.',
      cierre: (d) => 'The last logbook entry tells how it ended: "' + d.txt + '".'
    }
  };

  // Gerundio EN para la cadena (la radio dice que X «was opening…»).
  const HIZO = {
    es: { abrir_esclusa: 'abrió la esclusa y entró', cambiar_filtro: 'cambiaba el filtro', reiniciar_regulador: 'reiniciaba el regulador', purgar_linea: 'purgaba la línea', encender_propulsor: 'encendía el propulsor', desplegar_brazo: 'desplegaba el brazo', calibrar_antena: 'calibraba la antena', conectar_celda: 'conectaba la celda', orientar_panel: 'orientaba el panel', sellar_puerta: 'sellaba la puerta estanca', aislar_modulo: 'aislaba el módulo', cortar_energia: 'cortaba la energía', evacuar: 'salía del módulo', reorientar: 'reorientaba la nave', pedir_apoyo: 'pedía apoyo a tierra' },
    en: { abrir_esclusa: 'opening the airlock and going in', cambiar_filtro: 'swapping the filter', reiniciar_regulador: 'restarting the regulator', purgar_linea: 'purging the line', encender_propulsor: 'firing the thruster', desplegar_brazo: 'deploying the arm', calibrar_antena: 'calibrating the antenna', conectar_celda: 'connecting the cell', orientar_panel: 'angling the panel', sellar_puerta: 'sealing the pressure door', aislar_modulo: 'isolating the module', cortar_energia: 'cutting the power', evacuar: 'leaving the module', reorientar: 'reorienting the ship', pedir_apoyo: 'calling ground for support' }
  };

  CNX.TX = { E, cap, ayudantes, ACC, radioAccion, radioAccionIlegible, bitacoraAccion, planAccion, ordenAccion, refugioLinea, alarmaLinea, controlLinea, recibidoLinea, posicionLinea, cierreLinea, campoMant, INFORME, CADENA, HIZO };
})(typeof window !== 'undefined' ? window : globalThis);
