/* JET//Señal — piezas en SVG: 18 símbolos (forma × color × tamaño) con textura por color
   (violeta liso, cian rayado, ámbar punteado) para que el color nunca sea la única pista. */
(function (G) {
  'use strict';
  const R = G.Reglas;
  const COL = ['#9a4dff', '#00f2cf', '#ffb547'];
  const COL_CLARO = ['#c9a2ff', '#9bfff0', '#ffe0a6'];
  const COL_OSC = ['#5b1fb8', '#008f7e', '#b7701a'];
  const LETRA = ['V', 'C', 'A'];
  // formas en un lienzo de 100×100, apoyadas en la línea base y=92
  const FORMA = [
    'M50 12a40 40 0 1 1 0 80a40 40 0 1 1 0-80z',
    'M50 7.5L95 91.5Q96 93 94 93H6Q4 93 5 91.5Z',
    'M20 20H80Q86 20 86 26V86Q86 92 80 92H20Q14 92 14 86V26Q14 20 20 20Z'
  ];
  function defs(conLetras) {
    let s = '<svg id="pzDefs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>';
    s += '<pattern id="pzRayas" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)"><rect width="9" height="9" fill="none"/><rect width="3.4" height="9" fill="rgba(0,60,52,.42)"/></pattern>';
    s += '<pattern id="pzPuntos" patternUnits="userSpaceOnUse" width="10" height="10"><circle cx="5" cy="5" r="2.1" fill="rgba(110,52,0,.5)"/></pattern>';
    for (let c = 0; c < 3; c++) {
      s += '<linearGradient id="pzG' + c + '" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="' + COL_CLARO[c] + '"/><stop offset=".45" stop-color="' + COL[c] + '"/><stop offset="1" stop-color="' + COL_OSC[c] + '"/></linearGradient>';
    }
    for (let id = 0; id < 18; id++) {
      const f = R.PF[id], c = R.PC[id], t = R.PT[id];
      const tr = t ? ' transform="translate(50 92) scale(.58) translate(-50 -92)"' : '';
      s += '<symbol id="pz' + id + '" viewBox="0 0 100 100"><g' + tr + '>';
      s += '<ellipse cx="50" cy="95" rx="' + (f === 1 ? 40 : 34) + '" ry="4.5" fill="rgba(0,0,0,.35)"/>';
      s += '<path d="' + FORMA[f] + '" fill="url(#pzG' + c + ')"/>';
      if (c === 1) s += '<path d="' + FORMA[f] + '" fill="url(#pzRayas)"/>';
      if (c === 2) s += '<path d="' + FORMA[f] + '" fill="url(#pzPuntos)"/>';
      s += '<path d="' + FORMA[f] + '" fill="none" stroke="' + COL_CLARO[c] + '" stroke-opacity=".9" stroke-width="3" transform="translate(50 ' + (f === 1 ? 62 : 52) + ') scale(.93) translate(-50 -' + (f === 1 ? 62 : 52) + ')"/>';
      s += '<path d="' + FORMA[f] + '" fill="none" stroke="rgba(8,3,20,.55)" stroke-width="2"/>';
      const hx = f === 1 ? 40 : 34, hy = f === 1 ? 46 : 34;
      s += '<ellipse cx="' + hx + '" cy="' + hy + '" rx="' + (f === 1 ? 7 : 10) + '" ry="' + (f === 1 ? 4 : 6) + '" fill="rgba(255,255,255,.55)" transform="rotate(-30 ' + hx + ' ' + hy + ')"/>';
      if (conLetras) s += '<text class="pz-letra" x="50" y="' + (f === 1 ? 74 : 64) + '" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="800" font-size="' + (f === 1 ? 30 : 34) + '" fill="#fff" stroke="#0a0418" stroke-width="6" paint-order="stroke">' + LETRA[c] + '</text>';
      s += '</g></symbol>';
    }
    // íconos de los chips
    s += '<symbol id="icF0" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/></symbol>';
    s += '<symbol id="icF1" viewBox="0 0 24 24"><path d="M12 3.5L21 19.5H3Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></symbol>';
    s += '<symbol id="icF2" viewBox="0 0 24 24"><rect x="4.5" y="4.5" width="15" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.4"/></symbol>';
    for (let c = 0; c < 3; c++) s += '<symbol id="icC' + c + '" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="' + COL[c] + '"/>' + (c === 1 ? '<circle cx="12" cy="12" r="8" fill="url(#pzRayas)"/>' : c === 2 ? '<circle cx="12" cy="12" r="8" fill="url(#pzPuntos)"/>' : '') + '</symbol>';
    s += '<symbol id="icT0" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/></symbol>';
    s += '<symbol id="icT1" viewBox="0 0 24 24"><rect x="7" y="9" width="10" height="10" rx="2.5" fill="currentColor"/></symbol>';
    s += '</defs></svg>';
    return s;
  }
  const svg = (id, cls) => '<svg class="pz-svg' + (cls ? ' ' + cls : '') + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><use href="#pz' + id + '"/></svg>';
  const icono = (ref) => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#' + ref + '"/></svg>';
  function nombre(id, lang, T) {
    const f = R.PF[id], c = R.PC[id], t = R.PT[id];
    if (lang === 'en') return T.tamsN[t] + ' ' + T.coloresN[c] + ' ' + T.formasN[f];
    const tam = t ? 'pequeño' : 'grande';
    return T.formasN[f] + ' ' + T.coloresN[c] + ' ' + tam;
  }
  G.Piezas = { defs, svg, icono, nombre, COL, COL_CLARO };
})(typeof globalThis !== 'undefined' ? globalThis : this);
