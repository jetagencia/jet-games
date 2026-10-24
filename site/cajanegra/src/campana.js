// JET//Caja Negra · campaña «Archivo ALBA» (24 casos en 4 carpetas) y los 3 casos del tutorial.
// Cada caso de campaña fija nave, tripulación, incidente, sistema y causa (escritos a mano para contar el hilo
// del lote K-19); la redacción de los registros sale de las mismas plantillas y pasa por el mismo solucionador.
(function (G) {
  'use strict';
  const CNX = G.CNX || (G.CNX = {});

  // Tripulación fija de ALBA-7 (indicativo y parche no coinciden a propósito: el parche obliga a cruzar con la ficha).
  const ROSTER = [
    { nombre: 'Irene Sato', rol: 'comandante', cs: 1, parche: 3 },
    { nombre: 'Lena Varga', rol: 'carga', cs: 2, parche: 8 },
    { nombre: 'Tomás Okafor', rol: 'ingeniero', cs: 3, parche: 5 },
    { nombre: 'Amir Haddad', rol: 'piloto', cs: 4, parche: 1 },
    { nombre: 'Nadia Petrov', rol: 'medico', cs: 5, parche: 6 },
    { nombre: 'Kenji Moreau', rol: 'cientifico', cs: 6, parche: 2 }
  ];

  const CARPETAS = [
    {
      id: 1, titulo: { es: 'Primeros meses', en: 'First months' },
      intro: { es: 'Seis incidentes de la estación ALBA-7. Empieza por el primero.', en: 'Six incidents aboard station ALBA-7. Start with the first one.' },
      cierre: { es: 'Seis informes firmados. Dos de las piezas que fallaron venían del mismo lote: K-19. Puede ser casualidad.', en: 'Six reports signed. Two of the parts that failed came from the same batch: K-19. It could be a coincidence.' }
    },
    {
      id: 2, titulo: { es: 'Turno de noche', en: 'Night shift' },
      intro: { es: 'La tripulación crece y los turnos se alargan. Ahora hay que mirar las fotos con lupa.', en: 'The crew grows and the shifts get longer. Now the photos need a close look.' },
      cierre: { es: 'El lote K-19 aparece en cuatro de los doce informes. Alguien en tierra ya lo anotó en un margen.', en: 'Batch K-19 shows up in four of the twelve reports. Someone on the ground has already noted it in a margin.' }
    },
    {
      id: 3, titulo: { es: 'Ruido', en: 'Noise' },
      intro: { es: 'Radios con interferencias, planes que cambian sobre la marcha. Cuenta lo que pasó, no lo que se planeó.', en: 'Radios full of static, plans that change on the fly. What happened counts, not what was planned.' },
      cierre: { es: 'Tras el caso 18, ALBA-7 pide retirar todas las piezas del lote K-19. La respuesta de tierra se hace esperar.', en: 'After case 18, ALBA-7 asks to pull every part from batch K-19. The answer from the ground takes its time.' }
    },
    {
      id: 4, titulo: { es: 'Lote K-19', en: 'Batch K-19' },
      intro: { es: 'Seis registros por caso y la misma pregunta de fondo: ¿por qué siguen fallando las mismas piezas?', en: 'Six records per case and the same question underneath: why do the same parts keep failing?' },
      cierre: { es: 'Archivo ALBA cerrado. Las piezas del lote K-19 fallaban antes de tiempo y su retirada se aplazó una y otra vez. Nadie lo ocultó; nadie lo había unido. Hasta tu informe.', en: 'ALBA file closed. The parts from batch K-19 failed early and their recall was postponed again and again. Nobody hid it; nobody had put it together. Until your report.' }
    }
  ];

  // [incidente, sistema, causa, dificultad, huecos, registros(null = por dificultad), lote K-19 en el equipo que falla, vía, tripulantes]
  const T6 = ['tripulacion', 'bitacora', 'radio', 'telemetria', 'foto', 'mantenimiento'];
  const T4 = ['tripulacion', 'radio', 'telemetria', 'mantenimiento'];
  const CASOS = [
    // Carpeta 1
    { inc: 'presion', sis: 'junta', causa: 'desgaste', dif: 1, huecos: 6, regs: T4, n: 3, titulo: { es: 'Silbido en la esclusa', en: 'Hiss in the airlock' }, intro: { es: 'Primer mes de ALBA-7. Una esclusa pierde aire durante una salida de rutina.', en: 'ALBA-7\'s first month. An airlock leaks air during a routine exit.' } },
    { inc: 'comunicaciones', sis: 'antena', causa: 'calibracion', dif: 1, huecos: 6, regs: T4.concat(['bitacora']), n: 3, titulo: { es: 'Noche sin señal', en: 'A night without signal' }, intro: { es: 'La estación se queda sin enlace con tierra a mitad de un turno. Aparece la bitácora.', en: 'The station loses its ground link mid-shift. The logbook joins the file.' } },
    { inc: 'aire', sis: 'filtro', causa: 'aviso', dif: 1, huecos: 7, regs: T4.concat(['foto']), n: 3, lote: true, titulo: { es: 'Aire cansado', en: 'Tired air' }, intro: { es: 'El CO₂ sube en un módulo. Por primera vez, la cámara interior entra en el expediente.', en: 'CO₂ climbs in one module. For the first time, the interior camera is part of the file.' } },
    { inc: 'calor', sis: 'radiador', causa: 'fatiga', dif: 2, huecos: 8, regs: T4.concat(['bitacora']), n: 3, titulo: { es: 'Calor en la bahía', en: 'Heat in the bay' }, intro: { es: 'Un radiador deja de enfriar. La bitácora y la radio no cuentan lo mismo de la misma manera.', en: 'A radiator stops cooling. The logbook and the radio don\'t tell it the same way.' } },
    { inc: 'orientacion', sis: 'giroscopio', causa: 'software', dif: 2, huecos: 8, regs: T4.concat(['foto']), n: 3, lote: true, titulo: { es: 'Giro inesperado', en: 'Unexpected spin' }, intro: { es: 'ALBA-7 empieza a girar sin que nadie lo ordene. Mira bien los parches en la foto.', en: 'ALBA-7 starts spinning with no one giving the order. Look closely at the patches in the photo.' } },
    { inc: 'energia', sis: 'regulador', causa: 'sobrecarga', dif: 2, huecos: 9, regs: T6, n: 4, via: 'ROL', titulo: { es: 'Apagón', en: 'Blackout' }, intro: { es: 'Los seis registros juntos por primera vez. La bitácora nombra roles, no personas.', en: 'All six records together for the first time. The logbook names roles, not people.' } },
    // Carpeta 2
    { inc: 'humo', sis: 'humo', causa: 'calibracion', dif: 2, huecos: 9, regs: T4.concat(['foto']), n: 4, titulo: { es: 'Humo en el turno de noche', en: 'Smoke on the night shift' }, intro: { es: 'Huele a quemado y el sensor no dijo nada. ¿Por qué?', en: 'Something smells burnt and the detector said nothing. Why?' } },
    { inc: 'refrigerante', sis: 'bomba', causa: 'desgaste', dif: 2, huecos: 9, regs: T4.concat(['foto']), n: 4, lote: true, titulo: { es: 'Refrigerante en el suelo', en: 'Coolant on the floor' }, intro: { es: 'Una bomba suelta su refrigerante. La pieza ya no era nueva, ¿o sí?', en: 'A pump spills its coolant. The part wasn\'t new anymore, or was it?' } },
    { inc: 'presion', sis: 'puerta', causa: 'malInstalada', dif: 2, huecos: 10, regs: T6, n: 4, via: 'ROL', titulo: { es: 'La puerta que no cerró', en: 'The door that didn\'t close' }, intro: { es: 'Una puerta estanca falla justo después de un cambio de turno.', en: 'A pressure door fails right after a shift change.' } },
    { inc: 'acople', sis: 'brazo', causa: 'pasoOmitido', dif: 2, huecos: 10, regs: T6, n: 4, via: 'IND', titulo: { es: 'Brazo trabado', en: 'Jammed arm' }, intro: { es: 'Un carguero se acerca y el brazo no termina la maniobra.', en: 'A cargo ship approaches and the arm never finishes the maneuver.' } },
    { inc: 'presion', sis: 'junta', causa: 'fatiga', dif: 3, huecos: 10, regs: T6, n: 4, via: 'ELI', lote: true, titulo: { es: 'Una voz en la esclusa', en: 'A voice in the airlock' }, intro: { es: 'La radio no deja oír quién habló. Pero todos los demás estaban en otro sitio.', en: 'The radio won\'t let you hear who spoke. But everyone else was somewhere else.' } },
    { inc: 'calor', sis: 'celda', causa: 'aviso', dif: 3, huecos: 11, regs: T6, n: 5, titulo: { es: 'Celda caliente', en: 'Hot cell' }, intro: { es: 'Alguien vio venir este fallo días antes. ¿Quedó escrito?', en: 'Someone saw this failure coming days before. Was it written down?' } },
    // Carpeta 3
    { inc: 'comunicaciones', sis: 'regulador', causa: 'software', dif: 3, huecos: 10, regs: T6, n: 4, titulo: { es: 'Estática', en: 'Static' }, intro: { es: 'Media transcripción está rota. Lo que falta está en otro registro.', en: 'Half the transcript is broken. What\'s missing is in another record.' } },
    { inc: 'orientacion', sis: 'propulsor', causa: 'desgaste', dif: 3, huecos: 11, regs: T6, n: 5, lote: true, titulo: { es: 'Propulsor sin freno', en: 'Thruster with no brake' }, intro: { es: 'El plan decía una hora; la maniobra ocurrió a otra.', en: 'The plan said one time; the maneuver happened at another.' } },
    { inc: 'aire', sis: 'valvula', causa: 'calibracion', dif: 3, huecos: 11, regs: T6, n: 5, titulo: { es: 'Aire pesado', en: 'Heavy air' }, intro: { es: 'Una válvula marca bien y funciona mal.', en: 'A valve reads fine and works badly.' } },
    { inc: 'micrometeorito', sis: 'puerta', causa: 'impacto', dif: 3, huecos: 11, regs: T6, n: 5, titulo: { es: 'Golpe en el casco', en: 'Hull strike' }, intro: { es: 'Esta vez la pieza no tuvo la culpa. ¿O sí?', en: 'This time the part wasn\'t to blame. Or was it?' } },
    { inc: 'refrigerante', sis: 'bomba', causa: 'fatiga', dif: 3, huecos: 12, regs: T6, n: 5, lote: true, titulo: { es: 'Bomba al límite', en: 'Pump at its limit' }, intro: { es: 'Otra bomba, otro lote… ¿o el mismo?', en: 'Another pump, another batch… or the same one?' } },
    { inc: 'energia', sis: 'panel', causa: 'malInstalada', dif: 3, huecos: 12, regs: T6, n: 5, titulo: { es: 'Sin energía en el mástil', en: 'No power on the mast' }, intro: { es: 'Tras este caso, la estación pedirá algo por escrito.', en: 'After this case, the station will ask for something in writing.' } },
    // Carpeta 4
    { inc: 'presion', sis: 'junta', causa: 'desgaste', dif: 3, huecos: 12, regs: T6, n: 5, titulo: { es: 'La otra esclusa', en: 'The other airlock' }, intro: { es: 'La esclusa que no había fallado nunca.', en: 'The airlock that had never failed.' } },
    { inc: 'calor', sis: 'radiador', causa: 'fatiga', dif: 3, huecos: 12, regs: T6, n: 6, lote: true, titulo: { es: 'Radiador, otra vez', en: 'Radiator, again' }, intro: { es: 'Mismo equipo que en el caso 4. Distinta pieza. ¿Mismo lote?', en: 'Same equipment as case 4. Different part. Same batch?' } },
    { inc: 'acople', sis: 'propulsor', causa: 'aviso', dif: 3, huecos: 13, regs: T6, n: 6, titulo: { es: 'Maniobra cancelada', en: 'Maneuver called off' }, intro: { es: 'Un aviso abierto, una maniobra que no se aplazó.', en: 'An open warning, a maneuver that wasn\'t postponed.' } },
    { inc: 'humo', sis: 'regulador', causa: 'sobrecarga', dif: 3, huecos: 13, regs: T6, n: 6, lote: true, titulo: { es: 'Humo y silencio', en: 'Smoke and silence' }, intro: { es: 'Todo encendido a la vez, y una pieza que ya había avisado.', en: 'Everything on at once, and a part that had already warned.' } },
    { inc: 'aire', sis: 'valvula', causa: 'pasoOmitido', dif: 3, huecos: 14, regs: T6, n: 6, titulo: { es: 'La válvula', en: 'The valve' }, intro: { es: 'Una lista de pasos con un hueco. Como tu informe.', en: 'A checklist with a gap. Like your report.' } },
    { inc: 'presion', sis: 'junta', causa: 'lote', dif: 3, huecos: 14, regs: T6, n: 6, titulo: { es: 'El informe final', en: 'The final report' }, intro: { es: 'Casos 3, 5, 8, 11, 14, 17, 20 y 22: la misma pieza de origen. Firma el informe que lo une todo.', en: 'Cases 3, 5, 8, 11, 14, 17, 20 and 22: the same source part. Sign the report that ties it all together.' } }
  ];

  function opcionesCampana(i) {
    const c = CASOS[i];
    const otros = ROSTER.slice(1);
    const elegidos = [ROSTER[0]];
    for (let k = 0; elegidos.length < c.n; k++) elegidos.push(otros[(i + k) % otros.length]);
    const forzar = {
      nave: 'ALBA-7',
      registros: c.regs,
      nCrew: c.n,
      tripulacion: elegidos.map((p) => p.nombre),
      roles: elegidos.map((p) => p.rol),
      indicativos: elegidos.map((p) => p.cs),
      parches: elegidos.map((p) => p.parche),
      incidente: c.inc,
      sistema: c.sis,
      causa: c.causa
    };
    if (c.via) forzar.via = c.via;
    if (c.lote) forzar.lote = { sistemas: [c.sis], txt: { es: 'lote K-19', en: 'batch K-19' } };
    return { semilla: CNX.hash('cajanegra|campana|' + (i + 1)), dif: c.dif, huecos: c.huecos, forzar };
  }

  function casoCampana(i) {
    const caso = CNX.gen.generar(opcionesCampana(i));
    if (!caso) return null;
    const c = CASOS[i];
    caso.id = 'c' + String(i + 1).padStart(2, '0');
    caso.titulo = c.titulo;
    caso.intro = c.intro;
    caso.carpeta = Math.floor(i / 6) + 1;
    return caso;
  }

  // ───────────── Tutorial ─────────────
  // T1 está escrito a mano (2 registros, 3 huecos, respuestas casi literales en la bitácora).
  function tutorial1() {
    const TX = CNX.TX;
    const H = { es: TX.ayudantes('es'), en: TX.ayudantes('en') };
    const both = (fn) => ({ es: fn(H.es), en: fn(H.en) });
    const irene = { nombre: 'Irene Sato', g: 'f', rol: 'comandante', cs: 'ALBA-1', parche: 1 };
    const lena = { nombre: 'Lena Varga', g: 'f', rol: 'piloto', cs: 'ALBA-2', parche: 2 };
    const tomas = { nombre: 'Tomás Okafor', g: 'm', rol: 'ingeniero', cs: 'ALBA-3', parche: 3 };
    const crew = [irene, lena, tomas];
    const registros = [
      {
        tipo: 'tripulacion',
        meta: both((h) => (h.lang === 'es' ? 'Expediente de personal · ALBA-7' : 'Personnel file · ALBA-7')),
        lineas: crew.map((c) => ({ txt: both((h) => h.cs(c) + ' · ' + h.p(c) + ' · ' + h.cap(h.rolN(c)) + ' · ' + (h.lang === 'es' ? 'parche ' : 'patch ') + h.pa(c.parche)), claims: [{ k: 'crew', nombre: c.nombre, rol: c.rol, cs: c.cs, parche: c.parche, g: c.g }] }))
      },
      {
        tipo: 'bitacora',
        meta: both((h) => (h.lang === 'es' ? 'Entrada de la comandante · ' : 'Entry by the commander · ') + h.t('09:40')),
        lineas: [
          { hora: '09:40', txt: both((h) => (h.lang === 'es' ? 'Prueba de vuelo del propulsor. ' + h.p(tomas) + ' sigue ' + h.en('cabina') + '.' : 'Thruster flight test. ' + h.p(tomas) + ' stays ' + h.en('cabina') + '.')), claims: [] },
          { hora: '09:52', txt: both((h) => (h.lang === 'es' ? h.p(lena) + ' enciende el propulsor ' + h.en('motores') + '.' : h.p(lena) + ' fires the thruster ' + h.en('motores') + '.')), claims: [] },
          { hora: '09:53', txt: both((h) => (h.lang === 'es' ? 'El propulsor no corta. ' + h.p(irene) + ' ordena cortar la energía.' : 'The thruster won\'t shut off. ' + h.p(irene) + ' orders the power cut.')), claims: [] },
          { hora: null, txt: both((h) => (h.lang === 'es' ? 'Cierre del día: la prueba se repite mañana.' : 'End of day: the test will be repeated tomorrow.')), claims: [] }
        ]
      }
    ];
    const informe = [[{
      es: [{ h: 'H1' }, ' encendió el propulsor a las 09:52 en ', { h: 'H2' }, '. A las 09:53 el propulsor no cortó, e Irene Sato decidió ', { h: 'H3' }, '.'],
      en: [{ h: 'H1' }, ' fired the thruster at 09:52 in ', { h: 'H2' }, '. At 09:53 it would not shut off, and Irene Sato responded by ', { h: 'H3' }, '.']
    }]];
    const huecos = { H1: { clave: 'actor', cat: 'persona', valor: 'Lena Varga' }, H2: { clave: 'lugarFallo', cat: 'lugar', valor: 'motores' }, H3: { clave: 'respuesta', cat: 'accion', valor: 'cortar_energia' } };
    const tv = CNX.gen.textoValor;
    const ficha = (id, cat, valor) => ({ id, cat, valor, n: 1, txt: { es: tv(cat, valor, 'es'), en: tv(cat, valor, 'en') } });
    const banco = [ficha('f1', 'persona', 'Lena Varga'), ficha('f2', 'persona', 'Irene Sato'), ficha('f3', 'persona', 'Tomás Okafor'), ficha('f4', 'lugar', 'cabina'), ficha('f5', 'lugar', 'motores'), ficha('f6', 'lugar', 'lab'), ficha('f7', 'accion', 'encender_propulsor'), ficha('f8', 'accion', 'cortar_energia'), ficha('f9', 'accion', 'pedir_apoyo')];
    return {
      v: 1, id: 't1', tutorial: 1, semilla: 1, dif: 1, nave: 'ALBA-7', tipoNave: CNX.mundo.TIPOS_NAVE.estacion,
      incidente: { es: 'Prueba de vuelo', en: 'Flight test' }, numIncidente: '0001', diaMision: 3, horaIncidente: '09:53',
      resumen: { es: 'El propulsor no se apaga durante una prueba.', en: 'The thruster won\'t shut off during a test.' },
      titulo: { es: 'Prueba de vuelo', en: 'Flight test' },
      tripulacion: crew, registros, informe, huecos, banco, mult: { persona: 1, lugar: 1, accion: 1 }, meta: { via: 'LIT' },
      cadena: [
        { claves: ['actor', 'lugarFallo'], txt: { es: 'La bitácora de las 09:52 lo dice: Lena Varga enciende el propulsor en la sala de motores.', en: 'The 09:52 logbook entry says it: Lena Varga fires the thruster in the engine room.' }, srcs: [[1, 1]] },
        { claves: ['respuesta'], txt: { es: 'A las 09:53, Irene Sato ordena cortar la energía.', en: 'At 09:53, Irene Sato orders the power cut.' }, srcs: [[1, 2]] }
      ],
      D: 3
    };
  }

  function tutorial(n) {
    if (n === 1) return tutorial1();
    const comun = { nave: 'ALBA-7', tripulacion: ['Irene Sato', 'Lena Varga', 'Tomás Okafor'], roles: ['comandante', 'carga', 'ingeniero'], indicativos: [1, 2, 3] };
    let o;
    if (n === 2) {
      o = { semilla: CNX.hash('cajanegra|tutorial|2'), dif: 1, huecos: 5, forzar: Object.assign({}, comun, { registros: ['tripulacion', 'bitacora', 'radio'], nCrew: 2, parches: [1, 2], via: 'IND', con: true, lugarLit: true, horaLit: true, sisLit: true, incidente: 'presion', sistema: 'junta', lugar: 'esclusaB', refugio: 'cabina', huecos: ['lugarFallo', 'actor', 'horaAccion', 'avisador', 'respuesta'] }) };
    } else {
      o = { semilla: CNX.hash('cajanegra|tutorial|3'), dif: 1, huecos: 6, forzar: Object.assign({}, comun, { registros: ['tripulacion', 'radio', 'telemetria', 'foto'], nCrew: 3, parches: [4, 7, 2], via: 'IND', lugarLit: false, horaLit: false, sisLit: true, incidente: 'calor', sistema: 'radiador', refugio: 'cabina', huecos: ['horaFallo', 'lugarFallo', 'actor', 'respuesta', 'horaFoto', 'reparador'] }) };
    }
    const caso = CNX.gen.generar(o);
    caso.id = 't' + n;
    caso.tutorial = n;
    caso.titulo = n === 2 ? { es: 'Comprobación de radio', en: 'Radio check' } : { es: 'Lectura de instrumentos', en: 'Reading the instruments' };
    return caso;
  }

  CNX.campana = { ROSTER, CARPETAS, CASOS, opcionesCampana, casoCampana, tutorial };
})(typeof window !== 'undefined' ? window : globalThis);
