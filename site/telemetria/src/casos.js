/* JET//Telemetría — plantillas de casos (datos puros). DISENO.md §7.
   Las semillas y el aire calibrados de cada caso viven en src/campana.js (lo genera tools/generar-campana.mjs). */
(function (root, factory) {
  var m = factory();
  if (typeof module === 'object' && module.exports) module.exports = m; else root.CASOS = m;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var BANDA = { facil: [0.95, 1.0], medio: [0.85, 0.95], dificil: [0.70, 0.85] };
  function banda(n) { return n <= 2 ? BANDA.facil : n <= 4 ? BANDA.medio : BANDA.dificil; }
  function T(cap, n, o) {
    var t = { id: cap + '-' + n, cap: cap, n: n, nF: 1, band: banda(n) };
    for (var k in o) t[k] = o[k];
    return t;
  }
  var S1 = ['SONDA'], S2 = ['SONDA', 'RAPIDO'], S3 = ['SONDA', 'RAPIDO', 'ZONA'];
  var CAMPANA = [
    // Capítulo 1 · Primer turno: leer, repetir, reparar
    T(1, 1, { N: 4, sens: S1, aire: 40, R: 8, Rx: 12, tut: 1, forzarF: ['radar'], band: [0, 1] }),
    T(1, 2, { N: 4, sens: S1, aire: 40, R: 8, Rx: 12, tut: 2, forzarF: ['nav'], band: [0, 1] }),
    T(1, 3, { N: 5, sens: S1, aire: 36, R: 8, Rx: 12, tut: 3 }),
    T(1, 4, { N: 5, sens: S1, aire: 38, R: 8, Rx: 12 }),
    T(1, 5, { N: 5, sens: S1, aire: 36, R: 8, Rx: 12 }),
    T(1, 6, { N: 5, sens: S1, aire: 36, R: 8, Rx: 12 }),
    // Capítulo 2 · Barato y ruidoso: coste contra fiabilidad
    T(2, 1, { N: 5, sens: S2, aire: 40, R: 10, Rx: 15, nuevo: 'RAPIDO' }),
    T(2, 2, { N: 5, sens: S2, aire: 38, R: 10, Rx: 15 }),
    T(2, 3, { N: 6, sens: S2, aire: 38, R: 10, Rx: 15 }),
    T(2, 4, { N: 6, sens: S2, aire: 36, R: 10, Rx: 15 }),
    T(2, 5, { N: 6, sens: S2, aire: 34, R: 10, Rx: 15 }),
    T(2, 6, { N: 6, sens: S2, aire: 34, R: 10, Rx: 15 }),
    // Capítulo 3 · Por zonas
    T(3, 1, { N: 6, sens: S3, aire: 44, R: 10, Rx: 15, nuevo: 'ZONA' }),
    T(3, 2, { N: 6, sens: S3, aire: 42, R: 10, Rx: 15 }),
    T(3, 3, { N: 7, sens: S3, aire: 42, R: 10, Rx: 15 }),
    T(3, 4, { N: 7, sens: S3, aire: 40, R: 10, Rx: 15 }),
    T(3, 5, { N: 8, sens: S3, aire: 40, R: 10, Rx: 15 }),
    T(3, 6, { N: 8, sens: S3, aire: 38, R: 10, Rx: 15 }),
    // Capítulo 4 · Bitácora: previas no uniformes
    T(4, 1, { N: 7, sens: S3, aire: 42, R: 12, Rx: 18, bit: 2, nuevo: 'BITACORA' }),
    T(4, 2, { N: 7, sens: S3, aire: 42, R: 12, Rx: 18, bit: 2 }),
    T(4, 3, { N: 8, sens: S3, aire: 40, R: 12, Rx: 18, bit: 3 }),
    T(4, 4, { N: 8, sens: S3, aire: 40, R: 12, Rx: 18, bit: 2 }),
    T(4, 5, { N: 8, sens: S3, aire: 38, R: 12, Rx: 18, bit: 3 }),
    T(4, 6, { N: 8, sens: S3, aire: 36, R: 12, Rx: 18, bit: 3 }),
    // Capítulo 5 · Sesgos: alarmista y prudente
    T(5, 1, { N: 8, sens: ['SONDA', 'ALARMISTA', 'PRUDENTE'], aire: 44, R: 12, Rx: 18, nuevo: 'SESGOS' }),
    T(5, 2, { N: 8, sens: ['RAPIDO', 'ALARMISTA', 'PRUDENTE'], aire: 42, R: 12, Rx: 18 }),
    T(5, 3, { N: 8, sens: ['SONDA', 'RAPIDO', 'ALARMISTA'], aire: 40, R: 12, Rx: 18 }),
    T(5, 4, { N: 8, sens: ['ZONA', 'ALARMISTA', 'PRUDENTE'], aire: 40, R: 12, Rx: 18 }),
    T(5, 5, { N: 8, sens: ['SONDA', 'RAPIDO', 'ALARMISTA', 'PRUDENTE'], aire: 38, R: 12, Rx: 18, bit: 2 }),
    T(5, 6, { N: 8, sens: ['RAPIDO', 'ZONA', 'ALARMISTA', 'PRUDENTE'], aire: 36, R: 12, Rx: 18 }),
    // Capítulo 6 · Doble avería
    T(6, 1, { N: 6, sens: S3, aire: 60, R: 12, Rx: 18, nF: 2, nuevo: 'DOBLE' }),
    T(6, 2, { N: 6, sens: S3, aire: 58, R: 12, Rx: 18, nF: 2 }),
    T(6, 3, { N: 7, sens: S3, aire: 56, R: 12, Rx: 18, nF: 2 }),
    T(6, 4, { N: 7, sens: ['SONDA', 'RAPIDO', 'ZONA', 'ALARMISTA'], aire: 54, R: 12, Rx: 18, nF: 2 }),
    T(6, 5, { N: 8, sens: ['SONDA', 'RAPIDO', 'ZONA', 'PRUDENTE'], aire: 52, R: 12, Rx: 18, nF: 2 }),
    T(6, 6, { N: 8, sens: S3, aire: 50, R: 12, Rx: 18, nF: 2, bit: 2 }),
    // Capítulo 7 · Instrumentos heridos: sensor dañado, sensor dudoso, calibración
    T(7, 1, { N: 8, sens: S3, aire: 50, R: 12, Rx: 20, danio: 'SONDA', nuevo: 'DANIO' }),
    T(7, 2, { N: 8, sens: S3, aire: 48, R: 12, Rx: 20, danio: 'ZONA' }),
    T(7, 3, { N: 8, sens: ['SONDA', 'RAPIDO', 'ZONA', 'ALARMISTA'], aire: 55, R: 12, Rx: 20, danio: 'SONDA', nF: 2 }),
    T(7, 4, { N: 8, sens: S3, aire: 48, R: 12, Rx: 20, dudoso: 'RAPIDO', pRoto: 0.5, nuevo: 'DUDOSO' }),
    T(7, 5, { N: 8, sens: ['SONDA', 'RAPIDO', 'ALARMISTA'], aire: 46, R: 12, Rx: 20, dudoso: 'RAPIDO', pRoto: 0.5 }),
    T(7, 6, { N: 8, sens: S3, aire: 52, R: 12, Rx: 20, dudoso: 'SONDA', pRoto: 0.5, nF: 2 }),
    // Capítulo 8 · Tormenta: todo junto
    T(8, 1, { N: 9, sens: ['SONDA', 'RAPIDO', 'ZONA', 'ALARMISTA'], aire: 52, R: 14, Rx: 20, nuevo: 'TORMENTA' }),
    T(8, 2, { N: 9, sens: ['SONDA', 'RAPIDO', 'ZONA', 'PRUDENTE'], aire: 50, R: 14, Rx: 20, bit: 2 }),
    T(8, 3, { N: 10, sens: ['SONDA', 'RAPIDO', 'ZONA', 'ALARMISTA', 'PRUDENTE'], aire: 60, R: 14, Rx: 20, nF: 2 }),
    T(8, 4, { N: 10, sens: ['SONDA', 'RAPIDO', 'ZONA', 'ALARMISTA'], aire: 50, R: 14, Rx: 20, danio: 'ZONA', bit: 2 }),
    T(8, 5, { N: 10, sens: ['SONDA', 'RAPIDO', 'ZONA', 'PRUDENTE'], aire: 58, R: 14, Rx: 20, nF: 2, dudoso: 'RAPIDO', pRoto: 0.5 }),
    T(8, 6, { N: 10, sens: ['SONDA', 'RAPIDO', 'ZONA', 'ALARMISTA', 'PRUDENTE'], aire: 58, R: 14, Rx: 20, nF: 2, danio: 'SONDA' }),
    // Final · Reentrada
    { id: 'F', cap: 9, n: 1, N: 10, sens: ['SONDA', 'RAPIDO', 'ZONA', 'ALARMISTA', 'PRUDENTE'], aire: 62, R: 14, Rx: 20, nF: 2, bit: 3, enganio: 1, band: BANDA.dificil, nuevo: 'FINAL' }
  ];
  // Caso diario: plantilla por día de la semana (0 = domingo)
  var DIARIO = [
    { id: 'D0', cap: 8, N: 10, sens: ['SONDA', 'RAPIDO', 'ZONA', 'ALARMISTA', 'PRUDENTE'], aire: 54, R: 14, Rx: 20, nF: 1, bit: 2, band: BANDA.dificil },
    { id: 'D1', cap: 3, N: 6, sens: S3, aire: 40, R: 10, Rx: 15, nF: 1, band: BANDA.medio },
    { id: 'D2', cap: 3, N: 8, sens: S3, aire: 40, R: 10, Rx: 15, nF: 1, band: BANDA.medio },
    { id: 'D3', cap: 4, N: 8, sens: S3, aire: 40, R: 12, Rx: 18, nF: 1, bit: 2, band: BANDA.medio },
    { id: 'D4', cap: 5, N: 8, sens: ['SONDA', 'RAPIDO', 'ALARMISTA', 'PRUDENTE'], aire: 40, R: 12, Rx: 18, nF: 1, band: BANDA.medio },
    { id: 'D5', cap: 6, N: 7, sens: S3, aire: 56, R: 12, Rx: 18, nF: 2, band: BANDA.medio },
    { id: 'D6', cap: 7, N: 8, sens: S3, aire: 50, R: 12, Rx: 20, nF: 1, dudoso: 'RAPIDO', pRoto: 0.5, band: BANDA.medio }
  ];
  var porId = {};
  CAMPANA.concat(DIARIO).forEach(function (t) { porId[t.id] = t; });
  function capitulo(c) { return CAMPANA.filter(function (t) { return t.cap === c; }); }
  return { CAMPANA: CAMPANA, DIARIO: DIARIO, porId: porId, capitulo: capitulo, NCAP: 8 };
});
