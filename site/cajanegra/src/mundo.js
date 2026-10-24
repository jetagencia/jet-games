// JET//Caja Negra · catálogos del mundo (ES neutro de tú / EN neutro, escritos en paralelo).
// Nada de nombres de agencias, naves ni empresas reales.
(function (G) {
  'use strict';
  const CNX = G.CNX || (G.CNX = {});

  // Naves: indicativo (los números de nave van de 7 a 9 para no chocar con los indicativos de tripulación 1-6).
  const NAVES = [
    ['ALBA', 7, 'estacion'], ['VEGA', 8, 'carguero'], ['KORU', 9, 'lunar'], ['NADIR', 7, 'laboratorio'],
    ['LUMEN', 8, 'remolcador'], ['ORCA', 9, 'estacion'], ['TALA', 7, 'carguero'], ['CIRRO', 8, 'laboratorio'],
    ['DUNA', 9, 'lunar'], ['FARO', 7, 'estacion'], ['HALO', 8, 'remolcador'], ['IRIS', 9, 'laboratorio'],
    ['JADE', 7, 'carguero'], ['LIRA', 8, 'estacion'], ['MIRA', 9, 'lunar'], ['RUMBO', 7, 'remolcador'],
    ['SIRIO', 8, 'estacion'], ['BOREAL', 9, 'carguero'], ['CENIT', 7, 'laboratorio'], ['ESTELA', 8, 'lunar'],
    ['OKAPI', 9, 'remolcador'], ['ZAFIRO', 7, 'estacion'], ['SELVA', 8, 'laboratorio'], ['ARCE', 9, 'carguero']
  ].map(([nombre, num, tipo]) => ({ nombre, num, tipo, id: nombre + '-' + num }));

  const TIPOS_NAVE = {
    estacion: { es: 'Estación orbital', en: 'Orbital station' },
    carguero: { es: 'Carguero', en: 'Cargo ship' },
    lunar: { es: 'Módulo lunar', en: 'Lunar lander' },
    remolcador: { es: 'Remolcador orbital', en: 'Orbital tug' },
    laboratorio: { es: 'Laboratorio orbital', en: 'Orbital lab' }
  };

  // Personas: nombre, género gramatical (solo para plantillas de registros), mezcla equilibrada de orígenes.
  const PERSONAS = [
    ['Irene Sato', 'f'], ['Tomás Okafor', 'm'], ['Lena Varga', 'f'], ['Amir Haddad', 'm'], ['Sofía Lind', 'f'],
    ['Kenji Moreau', 'm'], ['Nadia Petrov', 'f'], ['Rafael Duarte', 'm'], ['Aiko Brenner', 'f'], ['Samuel Adeyemi', 'm'],
    ['Marta Kowal', 'f'], ['Diego Ferreira', 'm'], ['Yara Nasser', 'f'], ['Lukas Engel', 'm'], ['Priya Raman', 'f'],
    ['Omar Bakri', 'm'], ['Elena Rossi', 'f'], ['Jonas Berg', 'm'], ['Mei Tanaka', 'f'], ['Hugo Lambert', 'm'],
    ['Zara Mensah', 'f'], ['Iván Soler', 'm'], ['Clara Novak', 'f'], ['Malik Osei', 'm'], ['Ana Ibarra', 'f'],
    ['Felix Wagner', 'm'], ['Leila Farah', 'f'], ['Mateo Rivas', 'm'], ['Hana Kim', 'f'], ['Nikolai Ivanov', 'm'],
    ['Julia Costa', 'f'], ['Arjun Mehta', 'm'], ['Ingrid Holm', 'f'], ['Kwame Asante', 'm'], ['Lucía Vidal', 'f'],
    ['Pavel Horák', 'm'], ['Noor Aziz', 'f'], ['Bruno Salas', 'm'], ['Emma Larsen', 'f'], ['Takeshi Mori', 'm'],
    ['Amara Diallo', 'f'], ['Victor Hale', 'm'], ['Rosa Quintero', 'f'], ['Daniel Cohen', 'm'], ['Saanvi Rao', 'f'],
    ['Andrés Molina', 'm'], ['Freya Nilsen', 'f'], ['Chen Wei', 'm'], ['Olga Sorokina', 'f'], ['Thiago Prado', 'm'],
    ['Maya Levi', 'f'], ['Erik Strand', 'm'], ['Fatima Zahra', 'f'], ['Liam Walsh', 'm'], ['Carmen Ortega', 'f'],
    ['Yusuf Kaya', 'm'], ['Alba Serrano', 'f'], ['Kofi Boateng', 'm'], ['Vera Lindqvist', 'f'], ['Rohan Das', 'm']
  ].map(([nombre, g], i) => ({ id: 'n' + i, nombre, g }));

  // Roles (6). ES con forma masculina y femenina; EN neutro.
  const ROLES = {
    comandante: { m: 'el comandante', f: 'la comandante', mN: 'comandante', fN: 'comandante', en: 'the commander', enN: 'commander' },
    piloto: { m: 'el piloto', f: 'la piloto', mN: 'piloto', fN: 'piloto', en: 'the pilot', enN: 'pilot' },
    ingeniero: { m: 'el ingeniero de sistemas', f: 'la ingeniera de sistemas', mN: 'ingeniero de sistemas', fN: 'ingeniera de sistemas', en: 'the systems engineer', enN: 'systems engineer' },
    carga: { m: 'el especialista de carga', f: 'la especialista de carga', mN: 'especialista de carga', fN: 'especialista de carga', en: 'the cargo specialist', enN: 'cargo specialist' },
    medico: { m: 'el médico', f: 'la médica', mN: 'médico', fN: 'médica', en: 'the medical officer', enN: 'medical officer' },
    cientifico: { m: 'el científico', f: 'la científica', mN: 'científico', fN: 'científica', en: 'the scientist', enN: 'scientist' }
  };
  const ROLES_ORDEN = ['comandante', 'piloto', 'ingeniero', 'carga', 'medico', 'cientifico'];

  // Módulos (12). art = artículo ES; en = forma EN con su artículo; placa = rótulo de la foto.
  const MODULOS = {
    cabina: { es: 'cabina', art: 'la', en: 'the cabin', enN: 'cabin', placa: { es: 'CABINA', en: 'CABIN' } },
    esclusaA: { es: 'esclusa A', art: 'la', en: 'airlock A', enN: 'airlock A', placa: { es: 'ESCLUSA A', en: 'AIRLOCK A' } },
    esclusaB: { es: 'esclusa B', art: 'la', en: 'airlock B', enN: 'airlock B', placa: { es: 'ESCLUSA B', en: 'AIRLOCK B' } },
    bahia: { es: 'bahía de carga', art: 'la', en: 'the cargo bay', enN: 'cargo bay', placa: { es: 'BAHÍA DE CARGA', en: 'CARGO BAY' } },
    lab: { es: 'laboratorio', art: 'el', en: 'the lab', enN: 'lab', placa: { es: 'LABORATORIO', en: 'LAB' } },
    habitat: { es: 'hábitat', art: 'el', en: 'the habitat', enN: 'habitat', placa: { es: 'HÁBITAT', en: 'HABITAT' } },
    motores: { es: 'sala de motores', art: 'la', en: 'the engine room', enN: 'engine room', placa: { es: 'SALA DE MOTORES', en: 'ENGINE ROOM' } },
    nodo: { es: 'nodo de acople', art: 'el', en: 'the docking node', enN: 'docking node', placa: { es: 'NODO DE ACOPLE', en: 'DOCKING NODE' } },
    invernadero: { es: 'invernadero', art: 'el', en: 'the greenhouse', enN: 'greenhouse', placa: { es: 'INVERNADERO', en: 'GREENHOUSE' } },
    enfermeria: { es: 'enfermería', art: 'la', en: 'the sick bay', enN: 'sick bay', placa: { es: 'ENFERMERÍA', en: 'SICK BAY' } },
    almacen: { es: 'almacén', art: 'el', en: 'the storeroom', enN: 'storeroom', placa: { es: 'ALMACÉN', en: 'STOREROOM' } },
    mastil: { es: 'mástil de antenas', art: 'el', en: 'the antenna mast', enN: 'antenna mast', placa: { es: 'MÁSTIL DE ANTENAS', en: 'ANTENNA MAST' } }
  };
  const REFUGIOS = ['cabina', 'habitat', 'nodo'];

  // Canales de telemetría: unidad, base, valor tras el fallo, decimales.
  const CANALES = {
    presion: { es: 'Presión', en: 'Pressure', u: 'kPa', base: 101, fallo: 38, dec: 0, ruido: 0.5 },
    temperatura: { es: 'Temperatura', en: 'Temperature', u: '°C', base: 21, fallo: 64, dec: 0, ruido: 0.35 },
    tension: { es: 'Tensión', en: 'Voltage', u: 'V', base: 28, fallo: 3, dec: 1, ruido: 0.18 },
    giro: { es: 'Giro', en: 'Spin', u: '°/s', base: 0.1, fallo: 4.8, dec: 1, ruido: 0.04 },
    co2: { es: 'CO₂', en: 'CO₂', u: '%', base: 0.4, fallo: 2.9, dec: 1, ruido: 0.03 },
    senal: { es: 'Señal', en: 'Signal', u: '%', base: 92, fallo: 4, dec: 0, ruido: 0.8 }
  };

  // Sistemas (14). mods = módulos donde puede estar; sw = tiene software; mat = pieza material (fatiga);
  // sensor = admite calibración; inicial = acción que la persona hacía justo antes del fallo.
  const SISTEMAS = {
    junta: { es: 'junta de la esclusa', art: 'la', en: 'the airlock seal', mods: ['esclusaA', 'esclusaB'], mat: 1, inicial: 'abrir_esclusa', frag: { es: 'la *junta* cede', en: 'the *seal* is giving' } },
    valvula: { es: 'válvula de oxígeno', art: 'la', en: 'the oxygen valve', mods: ['habitat', 'lab', 'enfermeria', 'invernadero'], sensor: 1, inicial: 'purgar_linea', frag: { es: 'la *válvula* silba', en: 'the *valve* is hissing' } },
    bomba: { es: 'bomba de refrigerante', art: 'la', en: 'the coolant pump', mods: ['motores', 'lab', 'bahia'], mat: 1, inicial: 'purgar_linea', frag: { es: 'la *bomba* vibra', en: 'the *pump* is shaking' } },
    giroscopio: { es: 'giroscopio 2', art: 'el', en: 'gyroscope 2', mods: ['motores', 'nodo'], sw: 1, sensor: 1, inicial: 'encender_propulsor', frag: { es: 'el *giroscopio* no responde', en: 'the *gyro* is not responding' } },
    antena: { es: 'antena de alta ganancia', art: 'la', en: 'the high-gain antenna', mods: ['mastil'], sw: 1, inicial: 'calibrar_antena', frag: { es: 'la *antena* pierde el enlace', en: 'the *antenna* is losing the link' } },
    celda: { es: 'celda de combustible', art: 'la', en: 'the fuel cell', mods: ['motores', 'almacen'], sw: 1, mat: 1, inicial: 'conectar_celda', frag: { es: 'la *celda* se calienta', en: 'the *cell* is heating up' } },
    filtro: { es: 'filtro de CO₂', art: 'el', en: 'the CO₂ filter', mods: ['habitat', 'invernadero', 'lab', 'enfermeria'], sensor: 1, inicial: 'cambiar_filtro', frag: { es: 'el *filtro* está saturado', en: 'the *filter* is saturated' } },
    propulsor: { es: 'propulsor de maniobra', art: 'el', en: 'the maneuvering thruster', mods: ['motores', 'nodo'], sw: 1, mat: 1, inicial: 'encender_propulsor', frag: { es: 'el *propulsor* no corta', en: 'the *thruster* won\'t shut off' } },
    panel: { es: 'panel solar 3', art: 'el', en: 'solar panel 3', mods: ['mastil', 'almacen'], mat: 1, inicial: 'orientar_panel', frag: { es: 'el *panel* no carga', en: 'the *panel* isn\'t charging' } },
    radiador: { es: 'radiador', art: 'el', en: 'the radiator', mods: ['bahia', 'motores'], mat: 1, inicial: 'purgar_linea', frag: { es: 'el *radiador* hierve', en: 'the *radiator* is boiling' } },
    regulador: { es: 'regulador de tensión', art: 'el', en: 'the voltage regulator', mods: ['almacen', 'lab', 'motores', 'bahia'], sw: 1, sensor: 1, inicial: 'reiniciar_regulador', frag: { es: 'el *regulador* salta', en: 'the *regulator* keeps tripping' } },
    humo: { es: 'sensor de humo', art: 'el', en: 'the smoke detector', mods: ['lab', 'almacen', 'enfermeria', 'habitat'], sw: 1, sensor: 1, inicial: 'reiniciar_regulador', frag: { es: 'el *sensor de humo* no avisó', en: 'the *smoke detector* never went off' } },
    brazo: { es: 'brazo robótico', art: 'el', en: 'the robotic arm', mods: ['bahia', 'nodo'], sw: 1, mat: 1, inicial: 'desplegar_brazo', frag: { es: 'el *brazo* se traba', en: 'the *arm* is jammed' } },
    puerta: { es: 'puerta estanca', art: 'la', en: 'the pressure door', mods: ['nodo', 'habitat', 'bahia'], mat: 1, inicial: 'sellar_puerta', frag: { es: 'la *puerta* no cierra', en: 'the *door* won\'t close' } }
  };

  // Acciones (en infinitivo en ES; en gerundio en EN, porque las plantillas del informe son «tras ___» / «after ___»).
  const ACCIONES = {
    abrir_esclusa: { es: 'abrir la esclusa', en: 'opening the airlock' },
    cambiar_filtro: { es: 'cambiar el filtro', en: 'replacing the filter' },
    reiniciar_regulador: { es: 'reiniciar el regulador', en: 'restarting the regulator' },
    purgar_linea: { es: 'purgar la línea', en: 'purging the line' },
    encender_propulsor: { es: 'encender el propulsor', en: 'firing the thruster' },
    desplegar_brazo: { es: 'desplegar el brazo', en: 'deploying the arm' },
    aislar_modulo: { es: 'aislar el módulo', en: 'isolating the module' },
    cortar_energia: { es: 'cortar la energía', en: 'cutting the power' },
    sellar_puerta: { es: 'sellar la puerta estanca', en: 'sealing the pressure door' },
    evacuar: { es: 'evacuar el módulo', en: 'evacuating the module' },
    reorientar: { es: 'reorientar la nave', en: 'reorienting the ship' },
    pedir_apoyo: { es: 'pedir apoyo a tierra', en: 'calling ground for support' },
    calibrar_antena: { es: 'calibrar la antena', en: 'calibrating the antenna' },
    conectar_celda: { es: 'conectar la celda', en: 'connecting the cell' },
    orientar_panel: { es: 'orientar el panel', en: 'angling the panel' }
  };

  // Incidentes (10): canal que lo delata, sistemas posibles, respuestas, consecuencias, causas admitidas.
  const INCIDENTES = {
    presion: { es: 'Pérdida de presión', en: 'Loss of pressure', canal: 'presion', sis: ['junta', 'puerta', 'valvula'], resp: ['aislar_modulo', 'sellar_puerta', 'evacuar'], cons: ['aislamiento', 'reparacion', 'regreso', 'modoReducido'] },
    humo: { es: 'Humo eléctrico', en: 'Electrical smoke', canal: 'temperatura', sis: ['regulador', 'humo', 'celda'], resp: ['cortar_energia', 'evacuar', 'aislar_modulo'], cons: ['aislamiento', 'reparacion', 'modoReducido', 'regreso'] },
    calor: { es: 'Sobrecalentamiento', en: 'Overheating', canal: 'temperatura', sis: ['bomba', 'radiador', 'celda'], resp: ['cortar_energia', 'purgar_linea', 'aislar_modulo'], cons: ['reparacion', 'modoReducido', 'aislamiento', 'perdidaCarga'] },
    orientacion: { es: 'Pérdida de orientación', en: 'Loss of attitude', canal: 'giro', sis: ['giroscopio', 'propulsor'], resp: ['reorientar', 'pedir_apoyo', 'cortar_energia'], cons: ['aborto', 'modoReducido', 'regreso', 'reparacion'] },
    comunicaciones: { es: 'Corte de comunicaciones', en: 'Communications blackout', canal: 'senal', sis: ['antena', 'regulador'], resp: ['reorientar', 'reiniciar_regulador', 'cortar_energia'], cons: ['modoReducido', 'reparacion', 'aborto'] },
    refrigerante: { es: 'Fuga de refrigerante', en: 'Coolant leak', canal: 'temperatura', sis: ['bomba', 'radiador'], resp: ['purgar_linea', 'aislar_modulo', 'cortar_energia'], cons: ['reparacion', 'perdidaCarga', 'modoReducido', 'aislamiento'] },
    energia: { es: 'Apagado de energía', en: 'Power outage', canal: 'tension', sis: ['regulador', 'celda', 'panel'], resp: ['reiniciar_regulador', 'cortar_energia', 'pedir_apoyo'], cons: ['modoReducido', 'reparacion', 'aborto', 'regreso'] },
    micrometeorito: { es: 'Impacto de micrometeorito', en: 'Micrometeoroid strike', canal: 'presion', sis: ['puerta', 'junta', 'valvula'], resp: ['sellar_puerta', 'aislar_modulo', 'evacuar'], cons: ['aislamiento', 'reparacion', 'rescate', 'regreso'], causas: ['impacto'] },
    acople: { es: 'Fallo de acople', en: 'Docking failure', canal: 'giro', sis: ['brazo', 'propulsor'], resp: ['reorientar', 'pedir_apoyo', 'cortar_energia'], cons: ['aborto', 'perdidaCarga', 'rescate', 'reparacion'] },
    aire: { es: 'Contaminación del aire', en: 'Air contamination', canal: 'co2', sis: ['filtro', 'valvula'], resp: ['evacuar', 'aislar_modulo', 'pedir_apoyo'], cons: ['aislamiento', 'regreso', 'reparacion', 'modoReducido'] }
  };
  const INCIDENTES_ORDEN = ['presion', 'humo', 'calor', 'orientacion', 'comunicaciones', 'refrigerante', 'energia', 'micrometeorito', 'acople', 'aire'];

  // Consecuencias (8). cierre(): frase de la bitácora que la cuenta sin repetir las palabras de la ficha.
  const CONSECUENCIAS = {
    aislamiento: { es: 'el aislamiento del módulo', en: 'the module being sealed off' },
    aborto: { es: 'la cancelación de la maniobra', en: 'the maneuver being aborted' },
    perdidaCarga: { es: 'la pérdida de la carga', en: 'the loss of the cargo' },
    regreso: { es: 'un regreso anticipado', en: 'an early return' },
    modoReducido: { es: 'la misión en modo reducido', en: 'the mission running in reduced mode' },
    rescate: { es: 'el rescate por otra nave', en: 'a rescue by another ship' },
    reparacion: { es: 'una reparación en órbita', en: 'a repair in orbit' },
    evacuacion: { es: 'la evacuación de la nave', en: 'the ship being evacuated' }
  };
  // Pares que se parecen demasiado: nunca van juntos en un mismo banco.
  const CONS_CONFUSAS = [['aislamiento', 'modoReducido'], ['evacuacion', 'rescate'], ['regreso', 'evacuacion'], ['regreso', 'rescate']];

  // Causas (9 + 1 de campaña). campo = qué dato de la ficha de mantenimiento la delata.
  const CAUSAS = {
    desgaste: { es: 'el desgaste más allá de la vida útil', en: 'wear beyond its service life', ok: () => true },
    malInstalada: { es: 'una pieza mal instalada', en: 'a badly installed part', ok: () => true },
    pasoOmitido: { es: 'un paso de procedimiento omitido', en: 'a skipped procedure step', ok: () => true },
    software: { es: 'una actualización de software defectuosa', en: 'a faulty software update', ok: (s) => !!SISTEMAS[s].sw },
    calibracion: { es: 'un sensor mal calibrado', en: 'a miscalibrated sensor', ok: (s) => !!SISTEMAS[s].sensor },
    impacto: { es: 'un impacto externo', en: 'an external impact', ok: () => true },
    sobrecarga: { es: 'una sobrecarga por uso simultáneo', en: 'an overload from simultaneous use', ok: (s) => ['regulador', 'celda', 'panel', 'bomba', 'brazo', 'humo'].includes(s) },
    fatiga: { es: 'la fatiga del material por ciclos térmicos', en: 'material fatigue from thermal cycling', ok: (s) => !!SISTEMAS[s].mat },
    aviso: { es: 'un aviso ignorado', en: 'an ignored warning', ok: () => true },
    lote: { es: 'una pieza del lote K-19', en: 'a part from batch K-19', ok: () => true, campana: true }
  };
  const CAUSAS_ORDEN = ['desgaste', 'malInstalada', 'pasoOmitido', 'software', 'calibracion', 'impacto', 'sobrecarga', 'fatiga', 'aviso'];

  // Controladores de tierra (personas que no son tripulación: señuelos legítimos que aparecen en la radio).
  const CONTROL = ['Rafael Duarte', 'Ingrid Holm', 'Malik Osei', 'Rosa Quintero', 'Erik Strand', 'Saanvi Rao', 'Hugo Lambert', 'Noor Aziz'];

  // Rangos de investigador (puntos mínimos).
  const RANGOS = [
    { min: 0, es: 'Aspirante', en: 'Trainee' },
    { min: 150, es: 'Analista', en: 'Analyst' },
    { min: 600, es: 'Investigador', en: 'Investigator' },
    { min: 1800, es: 'Investigador jefe', en: 'Lead investigator' },
    { min: 5000, es: 'Director de la Junta', en: 'Board director' }
  ];

  CNX.mundo = { NAVES, TIPOS_NAVE, PERSONAS, ROLES, ROLES_ORDEN, MODULOS, REFUGIOS, CANALES, SISTEMAS, ACCIONES, INCIDENTES, INCIDENTES_ORDEN, CONSECUENCIAS, CONS_CONFUSAS, CAUSAS, CAUSAS_ORDEN, CONTROL, RANGOS };
})(typeof window !== 'undefined' ? window : globalThis);
