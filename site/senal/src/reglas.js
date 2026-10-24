/* JET//Señal — motor de reglas: piezas, moldes, codificación, evaluador compilado y textos ES/EN.
   Script clásico que funciona en el navegador, en un Worker (importScripts) y en Node (import por efecto). */
(function (G) {
  'use strict';

  // ---------- Piezas ----------
  // id = forma*6 + color*2 + tamaño  (forma o,t,s · color v,c,a · tamaño G=0,P=1)
  const FORMAS = ['o', 't', 's'], COLORES = ['v', 'c', 'a'], TAMS = ['G', 'P'];
  const PF = new Uint8Array(18), PC = new Uint8Array(18), PT = new Uint8Array(18);
  for (let id = 0; id < 18; id++) { PF[id] = (id / 6) | 0; PC[id] = ((id % 6) / 2) | 0; PT[id] = id % 2; }
  const ATR = { forma: PF, color: PC, tam: PT };
  const ATRS = ['forma', 'color', 'tam'];
  const idDe = (f, c, t) => f * 6 + c * 2 + t;
  const codPieza = id => FORMAS[PF[id]] + COLORES[PC[id]] + TAMS[PT[id]];
  const piezaDe = s => idDe(FORMAS.indexOf(s[0]), COLORES.indexOf(s[1]), TAMS.indexOf(s[2]));
  // letra compacta a-r para bancos y guardado
  const L18 = 'abcdefghijklmnopqr';
  const filaATexto = ids => ids.map(i => L18[i]).join('');
  const textoAFila = s => Array.from(s, ch => L18.indexOf(ch));

  // ---------- Propiedades ----------
  // {f,c,t} con -1 = cualquiera
  const PROP_VACIA = { f: -1, c: -1, t: -1 };
  function mascara(p) {
    let m = 0;
    for (let id = 0; id < 18; id++)
      if ((p.f < 0 || PF[id] === p.f) && (p.c < 0 || PC[id] === p.c) && (p.t < 0 || PT[id] === p.t)) m |= 1 << id;
    return m;
  }
  function codProp(p) {
    let s = '';
    if (p.f >= 0) s += FORMAS[p.f];
    if (p.c >= 0) s += COLORES[p.c];
    if (p.t >= 0) s += TAMS[p.t];
    return s || '*';
  }
  function leerProp(s) {
    const p = { f: -1, c: -1, t: -1 };
    if (s === '*' || s === '') return p;
    for (const ch of s) {
      if (FORMAS.includes(ch)) p.f = FORMAS.indexOf(ch);
      else if (COLORES.includes(ch)) p.c = COLORES.indexOf(ch);
      else if (TAMS.includes(ch)) p.t = TAMS.indexOf(ch);
      else throw new Error('propiedad inválida: ' + s);
    }
    return p;
  }
  const nAtr = p => (p.f >= 0) + (p.c >= 0) + (p.t >= 0);
  function todasLasProps() {
    const r = [];
    for (let f = -1; f < 3; f++) for (let c = -1; c < 3; c++) for (let t = -1; t < 2; t++) r.push({ f, c, t });
    return r;
  }

  // ---------- Moldes ----------
  // tipo de argumentos: P = una propiedad, PQ = dos, N = cmp+n (TOT), NP = cmp+n+P, PP = P+paridad, A = atributo
  const MOLDES = {
    HAY:    { fam: 'existencia', base: 1, nivel: 1, args: 'P' },
    NING:   { fam: 'existencia', base: 1, nivel: 1, args: 'P' },
    TODAS:  { fam: 'existencia', base: 1, nivel: 1, args: 'P' },
    PRIM:   { fam: 'posicion',   base: 2, nivel: 2, args: 'P' },
    ULT:    { fam: 'posicion',   base: 2, nivel: 2, args: 'P' },
    TOT:    { fam: 'cantidad',   base: 2, nivel: 2, args: 'N' },
    CANT:   { fam: 'cantidad',   base: 3, nivel: 3, args: 'NP' },
    PAR:    { fam: 'cantidad',   base: 4, nivel: 4, args: 'PP' },
    MAS:    { fam: 'comparacion', base: 4, nivel: 4, args: 'PQ' },
    IGU:    { fam: 'comparacion', base: 4, nivel: 4, args: 'PQ', sim: true },
    JUNTO:  { fam: 'vecindad',   base: 3, nivel: 3, args: 'PQ', sim: true },
    NJUNTO: { fam: 'vecindad',   base: 4, nivel: 4, args: 'PQ', sim: true },
    ANTES:  { fam: 'orden',      base: 4, nivel: 4, args: 'PQ' },
    VIG:    { fam: 'igualdad',   base: 3, nivel: 3, args: 'A' },
    VDIS:   { fam: 'igualdad',   base: 4, nivel: 4, args: 'A' },
    MISMO:  { fam: 'igualdad',   base: 3, nivel: 3, args: 'A' },
    DIST:   { fam: 'igualdad',   base: 5, nivel: 5, args: 'A' },
    EXT:    { fam: 'igualdad',   base: 5, nivel: 5, args: 'A' },
    ESPEJO: { fam: 'simetria',   base: 6, nivel: 6, args: 'A' }
  };
  const ORDEN_MOLDES = Object.keys(MOLDES);
  const FAMILIAS = ['existencia', 'posicion', 'cantidad', 'comparacion', 'vecindad', 'orden', 'igualdad', 'simetria', 'combinadas'];
  const CMPS = ['=', '>=', '<='];

  // ---------- Codificación ----------
  // simple: {m, p?, q?, cmp?, n?, par?('even'|'odd'), a?, neg?}
  // combinada: {op:'&'|'|', a:simple, b:simple}
  function codSimple(r) {
    const M = MOLDES[r.m]; if (!M) throw new Error('molde ' + r.m);
    let s = r.m;
    switch (M.args) {
      case 'P': s += ':' + codProp(r.p); break;
      case 'PQ': {
        let a = codProp(r.p), b = codProp(r.q);
        if (M.sim && b < a) { const x = a; a = b; b = x; }
        s += ':' + a + ':' + b; break;
      }
      case 'N': s += ':' + r.cmp + r.n; break;
      case 'NP': s += ':' + r.cmp + r.n + ':' + codProp(r.p); break;
      case 'PP': s += ':' + codProp(r.p) + ':' + r.par; break;
      case 'A': s += ':' + r.a; break;
    }
    if (r.neg) s += '!';
    return s;
  }
  function codificar(r) {
    if (r.op) return codSimple(r.a) + r.op + codSimple(r.b);
    return codSimple(r);
  }
  function leerCmp(s) {
    const m = /^(>=|<=|=)([0-9])$/.exec(s);
    if (!m) throw new Error('cantidad inválida: ' + s);
    return { cmp: m[1], n: +m[2] };
  }
  function leerSimple(s) {
    let neg = false;
    if (s.endsWith('!')) { neg = true; s = s.slice(0, -1); }
    const parts = s.split(':');
    const m = parts[0], M = MOLDES[m];
    if (!M) throw new Error('molde desconocido: ' + m);
    const r = { m, neg };
    switch (M.args) {
      case 'P': r.p = leerProp(parts[1]); break;
      case 'PQ': r.p = leerProp(parts[1]); r.q = leerProp(parts[2]); break;
      case 'N': Object.assign(r, leerCmp(parts[1])); break;
      case 'NP': Object.assign(r, leerCmp(parts[1])); r.p = leerProp(parts[2]); break;
      case 'PP': r.p = leerProp(parts[1]); r.par = parts[2]; if (r.par !== 'even' && r.par !== 'odd') throw new Error('paridad'); break;
      case 'A': r.a = parts[1]; if (!ATR[r.a]) throw new Error('atributo'); break;
    }
    return r;
  }
  function leer(code) {
    const i = code.search(/[&|]/);
    if (i >= 0) return { op: code[i], a: leerSimple(code.slice(0, i)), b: leerSimple(code.slice(i + 1)) };
    return leerSimple(code);
  }
  const normal = code => codificar(leer(code));

  // ---------- Complejidad ----------
  function kSimple(r) {
    const M = MOLDES[r.m];
    let k = M.base;
    if (r.p) k += nAtr(r.p);
    if (r.q) k += nAtr(r.q);
    if (r.neg) k += 1;
    return k;
  }
  const complejidad = r => r.op ? kSimple(r.a) + kSimple(r.b) + 2 : kSimple(r);
  const familia = r => r.op ? 'combinadas' : MOLDES[r.m].fam;
  const baseDe = r => r.op ? 9 : MOLDES[r.m].base;
  const nivelMin = r => r.op ? 5 : MOLDES[r.m].nivel;

  // ---------- Evaluador compilado ----------
  // f(s, L): s = arreglo de ids (Uint8Array o Array), L = longitud (1..5)
  function compSimple(r) {
    const mp = r.p ? mascara(r.p) : 0, mq = r.q ? mascara(r.q) : 0;
    const A = r.a ? ATR[r.a] : null;
    let f;
    const cuenta = (s, L, m) => { let k = 0; for (let i = 0; i < L; i++) k += (m >> s[i]) & 1; return k; };
    switch (r.m) {
      case 'HAY': f = (s, L) => { for (let i = 0; i < L; i++) if ((mp >> s[i]) & 1) return true; return false; }; break;
      case 'NING': f = (s, L) => { for (let i = 0; i < L; i++) if ((mp >> s[i]) & 1) return false; return true; }; break;
      case 'TODAS': f = (s, L) => { for (let i = 0; i < L; i++) if (!((mp >> s[i]) & 1)) return false; return true; }; break;
      case 'PRIM': f = (s) => ((mp >> s[0]) & 1) === 1; break;
      case 'ULT': f = (s, L) => ((mp >> s[L - 1]) & 1) === 1; break;
      case 'TOT': { const n = r.n; f = r.cmp === '=' ? (s, L) => L === n : r.cmp === '>=' ? (s, L) => L >= n : (s, L) => L <= n; break; }
      case 'CANT': { const n = r.n; f = r.cmp === '=' ? (s, L) => cuenta(s, L, mp) === n : r.cmp === '>=' ? (s, L) => cuenta(s, L, mp) >= n : (s, L) => cuenta(s, L, mp) <= n; break; }
      case 'PAR': { const odd = r.par === 'odd' ? 1 : 0; f = (s, L) => (cuenta(s, L, mp) & 1) === odd; break; }
      case 'MAS': f = (s, L) => cuenta(s, L, mp) > cuenta(s, L, mq); break;
      case 'IGU': f = (s, L) => cuenta(s, L, mp) === cuenta(s, L, mq); break;
      case 'JUNTO': case 'NJUNTO': {
        const j = (s, L) => {
          for (let i = 0; i + 1 < L; i++) {
            const a = s[i], b = s[i + 1];
            if ((((mp >> a) & 1) && ((mq >> b) & 1)) || (((mq >> a) & 1) && ((mp >> b) & 1))) return true;
          }
          return false;
        };
        f = r.m === 'JUNTO' ? j : (s, L) => !j(s, L); break;
      }
      case 'ANTES': f = (s, L) => {
        let vistoP = false;
        for (let i = 0; i < L; i++) {
          if (vistoP && ((mq >> s[i]) & 1)) return true;
          if ((mp >> s[i]) & 1) vistoP = true;
        }
        return false;
      }; break;
      case 'VIG': case 'VDIS': {
        const v = (s, L) => { for (let i = 0; i + 1 < L; i++) if (A[s[i]] === A[s[i + 1]]) return true; return false; };
        f = r.m === 'VIG' ? v : (s, L) => !v(s, L); break;
      }
      case 'MISMO': f = (s, L) => { const x = A[s[0]]; for (let i = 1; i < L; i++) if (A[s[i]] !== x) return false; return true; }; break;
      case 'DIST': f = (s, L) => { let m = 0; for (let i = 0; i < L; i++) { const b = 1 << A[s[i]]; if (m & b) return false; m |= b; } return true; }; break;
      case 'EXT': f = (s, L) => A[s[0]] === A[s[L - 1]]; break;
      case 'ESPEJO': f = (s, L) => { for (let i = 0, j = L - 1; i < j; i++, j--) if (A[s[i]] !== A[s[j]]) return false; return true; }; break;
      default: throw new Error('molde ' + r.m);
    }
    if (r.neg) { const g = f; return (s, L) => !g(s, L); }
    return f;
  }
  function compilar(r) {
    if (typeof r === 'string') r = leer(r);
    if (r.op) {
      const a = compSimple(r.a), b = compSimple(r.b);
      return r.op === '&' ? (s, L) => a(s, L) && b(s, L) : (s, L) => a(s, L) || b(s, L);
    }
    return compSimple(r);
  }
  const evaluar = (code, ids) => compilar(code)(ids, ids.length);

  // ---------- Textos ----------
  const NOMBRES = {
    es: {
      formas: ['círculo', 'triángulo', 'cuadrado'], formasPl: ['círculos', 'triángulos', 'cuadrados'],
      colores: ['violeta', 'cian', 'ámbar'], atr: { forma: 'forma', color: 'color', tam: 'tamaño' },
      atrArt: { forma: 'la misma forma', color: 'el mismo color', tam: 'el mismo tamaño' },
      atrMira: { forma: 'la forma', color: 'el color', tam: 'el tamaño' },
      atrDist: { forma: 'distinta forma', color: 'distinto color', tam: 'distinto tamaño' },
      cmp: { '=': 'exactamente', '>=': 'al menos', '<=': 'como máximo' },
      par: { even: 'par', odd: 'impar' }
    },
    en: {
      formas: ['circle', 'triangle', 'square'], formasPl: ['circles', 'triangles', 'squares'],
      colores: ['violet', 'cyan', 'amber'], atr: { forma: 'shape', color: 'color', tam: 'size' },
      cmp: { '=': 'exactly', '>=': 'at least', '<=': 'at most' },
      par: { even: 'even', odd: 'odd' }
    }
  };
  // marcas para resaltar argumentos (la interfaz las convierte en <b>)
  const B0 = '\u0001', B1 = '\u0002';

  // --- español ---
  function esNucleo(p, pl) { // {txt, fem}
    const N = NOMBRES.es;
    let txt, fem;
    if (p.f >= 0) { txt = pl ? N.formasPl[p.f] : N.formas[p.f]; fem = false; }
    else { txt = pl ? 'piezas' : 'pieza'; fem = true; }
    if (p.c >= 0) txt += ' ' + N.colores[p.c];
    if (p.t >= 0) txt += ' ' + esTam(p.t, fem, pl);
    return { txt, fem };
  }
  function esTam(t, fem, pl) {
    if (t === 0) return pl ? 'grandes' : 'grande';
    return (fem ? 'pequeña' : 'pequeño') + (pl ? 's' : '');
  }
  function esAdjs(p, pl) { // predicado sin forma: «cian y grande»
    const N = NOMBRES.es, a = [];
    if (p.c >= 0) a.push(N.colores[p.c]);
    if (p.t >= 0) a.push(esTam(p.t, true, pl));
    return a.join(' y ');
  }
  function esPred(p, pl) { // lo que va después de «es/son»
    if (p.f >= 0) { const n = esNucleo(p, pl); return pl ? n.txt : 'un ' + n.txt; }
    if (p.c < 0 && p.t < 0) return pl ? 'piezas cualesquiera' : 'una pieza cualquiera';
    return esAdjs(p, pl);
  }
  // negado con dos adjetivos: «no es una pieza ámbar pequeña» (evita la ambigüedad de «no es ámbar y pequeña»)
  function esPredNeg(p) {
    if (p.f < 0 && p.c >= 0 && p.t >= 0) return 'una ' + esNucleo(p, false).txt;
    return esPred(p, false);
  }
  const esUn = n => (n.fem ? 'una ' : 'un ') + n.txt;
  const b = (s, m) => m ? B0 + s + B1 : s;

  function textoES(r, m) {
    const N = NOMBRES.es, neg = r.neg;
    const P = r.p ? esNucleo(r.p, false) : null, Q = r.q ? esNucleo(r.q, false) : null;
    const Ppl = r.p ? esNucleo(r.p, true) : null, Qpl = r.q ? esNucleo(r.q, true) : null;
    switch (r.m) {
      case 'HAY': return neg ? 'No hay ' + (P.fem ? 'ninguna ' : 'ningún ') + b(P.txt, m) + '.' : 'Hay al menos ' + b(esUn(P), m) + '.';
      case 'NING': return neg ? 'Hay al menos ' + b(esUn(P), m) + '.' : 'No hay ' + (P.fem ? 'ninguna ' : 'ningún ') + b(P.txt, m) + '.';
      case 'TODAS': return (neg ? 'No todas las piezas son ' : 'Todas las piezas son ') + b(esPred(r.p, true), m) + '.';
      case 'PRIM': return 'La primera pieza ' + (neg ? 'no es ' + b(esPredNeg(r.p), m) : 'es ' + b(esPred(r.p, false), m)) + '.';
      case 'ULT': return 'La última pieza ' + (neg ? 'no es ' + b(esPredNeg(r.p), m) : 'es ' + b(esPred(r.p, false), m)) + '.';
      case 'TOT': return 'La muestra ' + (neg ? 'no tiene ' : 'tiene ') + b(N.cmp[r.cmp] + ' ' + r.n + (r.n === 1 ? ' pieza' : ' piezas'), m) + '.';
      case 'CANT': {
        const nn = r.n === 1 ? P : Ppl;
        return (neg ? 'No hay ' : 'Hay ') + b(N.cmp[r.cmp] + ' ' + r.n, m) + ' ' + b(nn.txt, m) + '.';
      }
      case 'PAR': return 'El número de ' + b(Ppl.txt, m) + (neg ? ' no es ' : ' es ') + b(N.par[r.par], m) + '.';
      case 'MAS': return (neg ? 'No hay más ' : 'Hay más ') + b(Ppl.txt, m) + ' que ' + b(Qpl.txt, m) + '.';
      case 'IGU': return (neg ? 'No hay ' : 'Hay ') + (Ppl.fem ? 'tantas ' : 'tantos ') + b(Ppl.txt, m) + ' como ' + b(Qpl.txt, m) + '.';
      case 'JUNTO': case 'NJUNTO': {
        const ning = (r.m === 'NJUNTO') !== !!neg;
        return (ning ? (P.fem ? 'Ninguna ' : 'Ningún ') : (P.fem ? 'Alguna ' : 'Algún ')) + b(P.txt, m) + ' está junto a ' + b(esUn(Q), m) + '.';
      }
      case 'ANTES': return neg
        ? 'No hay ' + (P.fem ? 'ninguna ' : 'ningún ') + b(P.txt, m) + ' a la izquierda de ' + b(esUn(Q), m) + '.'
        : 'Hay ' + b(esUn(P), m) + ' en algún lugar a la izquierda de ' + b(esUn(Q), m) + '.';
      case 'VIG': case 'VDIS': {
        const hay = (r.m === 'VIG') !== !!neg;
        return hay ? 'Hay dos piezas vecinas con ' + b(N.atrArt[r.a], m) + '.' : 'Dos piezas vecinas nunca tienen ' + b(N.atrArt[r.a], m) + '.';
      }
      case 'MISMO': return (neg ? 'No todas las piezas tienen ' : 'Todas las piezas tienen ') + b(N.atrArt[r.a], m) + '.';
      case 'DIST': return neg ? 'Hay dos piezas con ' + b(N.atrArt[r.a], m) + '.' : 'No hay dos piezas con ' + b(N.atrArt[r.a], m) + '.';
      case 'EXT': return neg ? 'La primera y la última pieza tienen ' + b(N.atrDist[r.a], m) + '.' : 'La primera y la última pieza tienen ' + b(N.atrArt[r.a], m) + '.';
      case 'ESPEJO': return 'La fila ' + (neg ? 'no se lee' : 'se lee') + ' igual al revés si solo miras ' + b(N.atrMira[r.a], m) + '.';
    }
    return '';
  }

  // --- inglés ---
  function enNucleo(p, pl) {
    const N = NOMBRES.en, a = [];
    if (p.t >= 0) a.push(p.t === 0 ? 'big' : 'small');
    if (p.c >= 0) a.push(N.colores[p.c]);
    a.push(p.f >= 0 ? (pl ? N.formasPl[p.f] : N.formas[p.f]) : (pl ? 'pieces' : 'piece'));
    return a.join(' ');
  }
  const enUn = s => (/^[aeiou]/.test(s) ? 'an ' : 'a ') + s;
  function enPred(p) {
    const N = NOMBRES.en;
    if (p.f >= 0) return enUn(enNucleo(p, false));
    if (p.c < 0 && p.t < 0) return 'any piece';
    const a = [];
    if (p.t >= 0) a.push(p.t === 0 ? 'big' : 'small');
    if (p.c >= 0) a.push(N.colores[p.c]);
    return a.join(' and ');
  }
  function enPredNeg(p) {
    if (p.f < 0 && p.c >= 0 && p.t >= 0) return enUn(enNucleo(p, false));
    return enPred(p);
  }
  function enPredPl(p) {
    if (p.f >= 0) return enNucleo(p, true);
    if (p.c < 0 && p.t < 0) return 'pieces';
    return enPred(p);
  }
  function textoEN(r, m) {
    const N = NOMBRES.en, neg = r.neg;
    switch (r.m) {
      case 'HAY': return neg ? 'There is no ' + b(enNucleo(r.p), m) + '.' : 'There is at least one ' + b(enNucleo(r.p), m) + '.';
      case 'NING': return neg ? 'There is at least one ' + b(enNucleo(r.p), m) + '.' : 'There is no ' + b(enNucleo(r.p), m) + '.';
      case 'TODAS': return (neg ? 'Not every piece is ' : 'Every piece is ') + b(enPred(r.p), m) + '.';
      case 'PRIM': return 'The first piece ' + (neg ? 'is not ' + b(enPredNeg(r.p), m) : 'is ' + b(enPred(r.p), m)) + '.';
      case 'ULT': return 'The last piece ' + (neg ? 'is not ' + b(enPredNeg(r.p), m) : 'is ' + b(enPred(r.p), m)) + '.';
      case 'TOT': return 'The sample ' + (neg ? 'does not have ' : 'has ') + b(N.cmp[r.cmp] + ' ' + r.n + (r.n === 1 ? ' piece' : ' pieces'), m) + '.';
      case 'CANT': {
        const one = r.n === 1;
        const verb = neg ? (one ? 'There is not ' : 'There are not ') : (one ? 'There is ' : 'There are ');
        return verb + b(N.cmp[r.cmp] + ' ' + r.n, m) + ' ' + b(enNucleo(r.p, !one), m) + '.';
      }
      case 'PAR': return 'The number of ' + b(enNucleo(r.p, true), m) + (neg ? ' is not ' : ' is ') + b(N.par[r.par], m) + '.';
      case 'MAS': return (neg ? 'There are not more ' : 'There are more ') + b(enNucleo(r.p, true), m) + ' than ' + b(enNucleo(r.q, true), m) + '.';
      case 'IGU': return (neg ? 'There are not as many ' : 'There are as many ') + b(enNucleo(r.p, true), m) + ' as ' + b(enNucleo(r.q, true), m) + '.';
      case 'JUNTO': case 'NJUNTO': {
        const no = (r.m === 'NJUNTO') !== !!neg;
        return (no ? 'No ' : 'Some ') + b(enNucleo(r.p), m) + ' is next to ' + b(enUn(enNucleo(r.q)), m) + '.';
      }
      case 'ANTES': return neg
        ? 'No ' + b(enNucleo(r.p), m) + ' is anywhere to the left of ' + b(enUn(enNucleo(r.q)), m) + '.'
        : 'Somewhere, ' + b(enUn(enNucleo(r.p)), m) + ' is to the left of ' + b(enUn(enNucleo(r.q)), m) + '.';
      case 'VIG': case 'VDIS': {
        const hay = (r.m === 'VIG') !== !!neg;
        return hay ? 'Two neighboring pieces share the same ' + b(N.atr[r.a], m) + '.' : 'Neighboring pieces never share the same ' + b(N.atr[r.a], m) + '.';
      }
      case 'MISMO': return (neg ? 'Not all pieces share the same ' : 'All pieces share the same ') + b(N.atr[r.a], m) + '.';
      case 'DIST': return neg ? 'Two pieces share the same ' + b(N.atr[r.a], m) + '.' : 'No two pieces share the same ' + b(N.atr[r.a], m) + '.';
      case 'EXT': return neg ? 'The first and last pieces have a different ' + b(N.atr[r.a], m) + '.' : 'The first and last pieces share the same ' + b(N.atr[r.a], m) + '.';
      case 'ESPEJO': return 'The row ' + (neg ? 'does not read' : 'reads') + ' the same backwards if you only look at ' + b(N.atr[r.a], m) + '.';
    }
    return '';
  }
  const minus = s => s.charAt(0).toLowerCase() + s.slice(1);
  const sinPunto = s => s.replace(/\.$/, '');
  function texto(r, lang, marcar) {
    if (typeof r === 'string') r = leer(r);
    const f = lang === 'en' ? textoEN : textoES;
    if (r.op) {
      const con = lang === 'en' ? (r.op === '&' ? 'and' : 'or') : (r.op === '&' ? 'y' : 'o');
      return sinPunto(f(r.a, marcar)) + ' ' + (marcar ? B0 + con.toUpperCase() + B1 : con) + ' ' + minus(f(r.b, marcar));
    }
    return f(r, marcar);
  }
  // nombre de una propiedad suelta (para chips y huecos)
  function nombreProp(p, lang, pl) {
    if (lang === 'en') return pl ? enNucleo(p, true) : enNucleo(p, false);
    return esNucleo(p, !!pl).txt;
  }

  // ---------- Enumeración (herramientas y pruebas) ----------
  function enumerarSimples() {
    const out = [], props = todasLasProps();
    for (const m of ORDEN_MOLDES) {
      const M = MOLDES[m];
      switch (M.args) {
        case 'P': for (const p of props) out.push({ m, p }); break;
        case 'PQ':
          for (let i = 0; i < props.length; i++) for (let j = 0; j < props.length; j++) {
            if (M.sim && j < i) continue;
            if ((m === 'MAS' || m === 'IGU') && i === j) continue;
            out.push({ m, p: props[i], q: props[j] });
          }
          break;
        case 'N': for (const cmp of CMPS) for (let n = 1; n <= 5; n++) out.push({ m, cmp, n }); break;
        case 'NP': for (const cmp of CMPS) for (let n = 1; n <= 4; n++) for (const p of props) out.push({ m, cmp, n, p }); break;
        case 'PP': for (const p of props) for (const par of ['even', 'odd']) out.push({ m, p, par }); break;
        case 'A': for (const a of ATRS) out.push({ m, a }); break;
      }
    }
    return out;
  }

  const API = {
    FORMAS, COLORES, TAMS, PF, PC, PT, ATR, ATRS, idDe, codPieza, piezaDe, L18, filaATexto, textoAFila,
    PROP_VACIA, mascara, codProp, leerProp, nAtr, todasLasProps,
    MOLDES, ORDEN_MOLDES, FAMILIAS, CMPS,
    codificar, leer, normal, complejidad, familia, baseDe, nivelMin, kSimple,
    compilar, evaluar, texto, nombreProp, B0, B1, enumerarSimples
  };
  G.Reglas = API;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this));
