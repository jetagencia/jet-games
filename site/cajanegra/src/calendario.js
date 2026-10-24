// JET//Caja Negra · caso del día. Misma semilla para todo el mundo según la fecha local (medianoche local).
// Variedad sin repeticiones visibles: incidente por permutación semanal, causa por bloques de 9 días,
// nave por un orden fijo de 24 (no se repite en 24 días). Dificultad según el día de la semana.
(function (G) {
  'use strict';
  const CNX = G.CNX || (G.CNX = {});

  // Día de lanzamiento: el caso #1 es el de esta fecha.
  const EPOCA = '2026-10-22';

  const pad = (n) => (n < 10 ? '0' : '') + n;
  function fechaLocal(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function aUTC(f) { const [y, m, d] = f.split('-').map(Number); return Date.UTC(y, m - 1, d); }
  function sumarDias(f, n) { const t = new Date(aUTC(f) + n * 86400000); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()); }
  function diasEntre(a, b) { return Math.round((aUTC(b) - aUTC(a)) / 86400000); }
  function numCaso(f) { return diasEntre(EPOCA, f) + 1; }
  function diaSemana(f) { return (new Date(aUTC(f)).getUTCDay() + 6) % 7; } // lunes = 0
  function lunesDe(f) { return sumarDias(f, -diaSemana(f)); }
  const mod = (a, n) => ((a % n) + n) % n;

  // Dificultad por día de la semana: [dificultad, huecos, ventana de puntuación D]
  // (ventanas calibradas con tools/validar.mjs sobre la puntuación real del generador; ver LEEME.md)
  const POR_DIA = [
    [2, 8, [17, 19.5]], // lunes
    [2, 8, [18, 20.5]], // martes
    [2, 8, [19, 21.5]], // miércoles
    [2, 9, [19.5, 22]], // jueves
    [2, 9, [20.5, 23.5]], // viernes
    [3, 10, [24, 27]], // sábado
    [3, 10, [26, 30]] // domingo
  ];

  function incidenteBase(f) {
    const W = CNX.mundo;
    const perm = CNX.RNG(CNX.hash('cajanegra|inc|' + lunesDe(f))).shuffle(W.INCIDENTES_ORDEN);
    return { perm, idx: diaSemana(f) };
  }
  function incidenteDe(f) {
    const b = incidenteBase(f);
    let inc = b.perm[b.idx];
    const ayer = incidenteBase(sumarDias(f, -1));
    const incAyer = ayer.perm[ayer.idx];
    if (inc === incAyer) inc = b.perm[7];
    return inc;
  }

  function opcionesDiario(f) {
    const W = CNX.mundo;
    const n = diasEntre(EPOCA, f);
    const inc = incidenteDe(f);
    const I = W.INCIDENTES[inc];
    // causa: rotación por bloques de 9 días, la primera compatible con algún sistema del incidente
    let causa, sistema;
    if (I.causas) causa = I.causas[0];
    else {
      const bloque = Math.floor(n / 9);
      const perm = CNX.RNG(CNX.hash('cajanegra|causa|' + bloque)).shuffle(W.CAUSAS_ORDEN.filter((c) => c !== 'impacto'));
      const ini = mod(n, 9);
      for (let k = 0; k < perm.length && !causa; k++) {
        const c = perm[(ini + k) % perm.length];
        if (I.sis.some((s) => W.CAUSAS[c].ok(s))) causa = c;
      }
    }
    const sisOk = I.sis.filter((s) => W.CAUSAS[causa].ok(s));
    sistema = CNX.RNG(CNX.hash('cajanegra|sis|' + f)).pick(sisOk);
    const orden = CNX.RNG(CNX.hash('cajanegra|naves')).shuffle(W.NAVES.map((x) => x.id));
    const nave = orden[mod(n, orden.length)];
    const [dif, huecos, ventanaD] = POR_DIA[diaSemana(f)];
    return { semilla: CNX.hash('cajanegra|' + f), dif, huecos, ventanaD, forzar: { incidente: inc, causa, sistema, nave } };
  }

  function casoDiario(f) {
    const o = opcionesDiario(f);
    let caso = CNX.gen.generar(o);
    let respaldo = false;
    if (!caso) {
      // respaldo incrustado: un caso Normal certificado de una lista fija de 40 semillas
      respaldo = true;
      const i = mod(Math.floor(aUTC(f) / 86400000), 40);
      caso = CNX.gen.generar({ semilla: CNX.hash('cajanegra|respaldo|' + i), dif: 2, huecos: 8 });
    }
    caso.id = 'd' + f;
    caso.fecha = f;
    caso.num = numCaso(f);
    caso.respaldo = respaldo;
    return caso;
  }

  function msHastaMedianoche(d) {
    d = d || new Date();
    const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
    return m - d;
  }

  CNX.cal = { EPOCA, POR_DIA, fechaLocal, sumarDias, diasEntre, numCaso, diaSemana, opcionesDiario, casoDiario, incidenteDe, msHastaMedianoche };
})(typeof window !== 'undefined' ? window : globalThis);
