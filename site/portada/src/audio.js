/* JET//Portada · música y efectos. Composición original («Jazz de cierre en órbita»), todo sintetizado con Web Audio:
   ni muestras ni archivos. Los golpes de batería y la máquina de escribir se calculan una vez, muestra por muestra,
   al abrir el contexto; los instrumentos con altura (piano eléctrico FM, vibráfono, contrabajo, cuerdas, trompeta con
   sordina) se generan nota a nota.

   Temas
   · «Cabecera» (menú y final) · Fa mayor con color lidio (Si natural), bossa 84 BPM, 36 compases = 103 s.
       Intro 4 · A 8 · A′ 8 · B 8 · Puente 4 (Re♭maj7♯11) · A″ 4. Melodía del vibráfono escrita a mano.
   · «Cierre» (partida) · Mi♭ mayor, swing medio 104 BPM (corcheas al 60 %), 40 compases = 92 s.
       Intro 4 · A 8 · A′ 8 · B 8 (vuelta por Re♭9 y sustitutos tritonales) · Corte 4 (la máquina de escribir hace de
       batería y suena la campanilla del carro) · A″ 8. Cuatro capas que siguen la tapa:
         1 siempre: contrabajo caminante, ride, charles y cuerdas.
         2 tapa ≥ 40 %: piano eléctrico con acompañamiento a contratiempo, escobillas, rellenos y teclas.
         3 meta alcanzada: vibráfono con el tema «Tecleo» (Si♭–Re–Fa–Sol). En las vueltas impares improvisa
           (frases bebop generadas con semilla sobre la armonía) y el tema vuelve en B y en A″.
         4 tapa de oro a la vista: trompeta con sordina en notas guía (terceras y séptimas) y bombo de pluma.
       Las capas entran y salen al compás siguiente con un fundido de ~1,5 s.
   · «Reglas» · Si♭ lidio, 72 BPM, 16 compases = 53 s, rubato: cuerdas, arpegios del piano y una pregunta del
       vibráfono que termina en la cuarta aumentada.
   · Rotativa: la música baja 9 dB y entra un ostinato mecánico a tempo (bombo, chasquido de rodillo y zumbido del
       motor afinado en Mi♭); el sello resuelve en Mi♭ mayor (AGOTADO, TAPA DE ORO) o en Mi♭ menor (RECICLADO).
   · Pausa: pasa bajos a 600 Hz y −6 dB.
   Cada vuelta cambia algo: inversiones, ornamentos y octavas de la melodía, patrones del piano y del bajo.
   Los efectos con altura se afinan con la tonalidad del tema que está sonando (menú en Fa, reglas en Si♭, partida en Mi♭).
   Mezcla: música ~8 dB por debajo de los efectos → limitador → recorte suave. Distinta de los demás juegos del sitio
   (Caja Negra es Re menor lento; esta es mayor, luminosa y con swing). */
(function (G) {
'use strict';
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function rngOf(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ───────────────────────── armonía ─────────────────────────
const PCN = { C: 0, 'C#': 1, Db: 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
// v: voicing sin fundamental (piano), ct: notas del acorde, sc: escala para improvisar (sin notas a evitar)
const Q = {
  maj9: { v: [4, 7, 11, 14], ct: [0, 4, 7, 11], sc: [0, 2, 4, 7, 9, 11] },
  six9: { v: [4, 9, 14, 19], ct: [0, 4, 7, 9], sc: [0, 2, 4, 7, 9] },
  maj7s11: { v: [4, 6, 11, 14], ct: [0, 4, 7, 11], sc: [0, 2, 4, 6, 7, 9, 11] },
  lyd: { v: [6, 9, 14, 16], ct: [0, 4, 7, 11], sc: [0, 2, 4, 6, 7, 9, 11] },
  m9: { v: [3, 7, 10, 14], ct: [0, 3, 7, 10], sc: [0, 2, 3, 5, 7, 9, 10] },
  m7: { v: [3, 7, 10, 14], ct: [0, 3, 7, 10], sc: [0, 2, 3, 5, 7, 9, 10] },
  m7b5: { v: [3, 6, 10, 14], ct: [0, 3, 6, 10], sc: [0, 2, 3, 5, 6, 8, 10] },
  d13: { v: [4, 10, 14, 21], ct: [0, 4, 7, 10], sc: [0, 2, 4, 7, 9, 10] },
  d9: { v: [4, 10, 14, 19], ct: [0, 4, 7, 10], sc: [0, 2, 4, 7, 9, 10] },
  d7b9: { v: [4, 10, 13, 19], ct: [0, 4, 7, 10], sc: [0, 1, 4, 7, 8, 10] },
  d7b13: { v: [4, 8, 10, 13], ct: [0, 4, 8, 10], sc: [0, 1, 3, 4, 8, 10] },
  d7sus: { v: [5, 10, 14, 19], ct: [0, 5, 7, 10], sc: [0, 2, 5, 7, 9, 10] },
  d13s11: { v: [4, 10, 18, 21], ct: [0, 4, 7, 10], sc: [0, 2, 4, 6, 7, 9, 10] }
};
const CC = {};
function C(sym) {
  if (CC[sym]) return CC[sym];
  const p = sym.split('.'), pc = PCN[p[0]], q = Q[p[1]];
  if (pc == null || !q) throw new Error('acorde ' + sym);
  return (CC[sym] = { sym, pc, q, bass: 31 + ((pc - 7 + 12) % 12) });
}
function parts(spec) { const p = spec.split('|'); return p.length === 1 ? [{ c: C(p[0]), b0: 0, len: 4 }] : [{ c: C(p[0]), b0: 0, len: 2 }, { c: C(p[1]), b0: 2, len: 2 }]; }
/** Voicing con conducción de voces: la inversión más cercana al acorde anterior dentro de [lo, hi]. */
function voicing(ch, prev, lo, hi) {
  const iv = ch.q.v, n = iv.length; let best = null, bc = 1e9;
  for (let inv = 0; inv < n; inv++) {
    const notes = iv.map((x, i) => ch.pc + x + (i < inv ? 12 : 0)).sort((a, b) => a - b);
    const s = Math.ceil((lo - notes[0]) / 12) * 12, v = notes.map(x => x + s);
    let cost = v[n - 1] > hi ? (v[n - 1] - hi) * 4 : 0;
    if (prev && prev.length === n) for (let i = 0; i < n; i++) cost += Math.abs(v[i] - prev[i]);
    else cost += Math.abs(v.reduce((a, b) => a + b, 0) / n - (lo + hi) / 2) * n;
    if (cost < bc) { bc = cost; best = v; }
  }
  return best;
}
function nearPc(pc, ref) { let m = ref - (((ref - pc) % 12) + 12) % 12; if (ref - m > 6) m += 12; return m; }
function chordTonesNear(ch, lo, hi) { const out = []; for (let m = lo; m <= hi; m++) if (ch.q.ct.indexOf(((m - ch.pc) % 12 + 12) % 12) >= 0) out.push(m); return out; }
function scaleNear(ch, lo, hi) { const out = []; for (let m = lo; m <= hi; m++) if (ch.q.sc.indexOf(((m - ch.pc) % 12 + 12) % 12) >= 0) out.push(m); return out; }

// ───────────────────────── partituras ─────────────────────────
// Melodías: por compás, [tiempo en negras, nota MIDI, duración en negras].
const SONGS = {
  menu: {
    bpm: 84, swing: 0.5, key: 2, seed: 11, loopTo: 0, gain: 1.05,
    form: [
      ['intro', ['F.maj9', 'F.lyd', 'F.maj9', 'F.lyd']],
      ['A', ['F.maj9', 'F.lyd', 'F.maj9', 'F.lyd', 'A.m7', 'D.d9', 'G.m9', 'C.d13']],
      ['A2', ['F.maj9', 'F.lyd', 'E.m7b5', 'A.d7b13', 'D.m9', 'G.d13', 'G.m9', 'C.d7sus']],
      ['B', ['Bb.maj9', 'Eb.d9', 'A.m7', 'D.d7b9', 'G.m9', 'C.d13', 'F.maj9', 'C.d7sus']],
      ['bridge', ['Db.maj7s11', 'Db.maj7s11', 'G.m9', 'C.d7sus']],
      ['A3', ['F.maj9', 'F.lyd', 'F.maj9', 'F.lyd']]
    ],
    mel: {
      A: [[[0, 76, 1.5], [1.5, 74, 0.5], [2, 72, 1], [3, 69, 1]], [[0, 71, 2.5], [2.5, 74, 0.5], [3, 79, 1]],
        [[0, 76, 1.5], [1.5, 74, 0.5], [2, 72, 0.5], [2.5, 69, 0.5], [3, 67, 1]], [[0, 71, 3], [3.5, 69, 0.5]],
        [[0, 72, 1], [1, 76, 1], [2, 79, 1.5], [3.5, 77, 0.5]], [[0, 78, 2], [2, 76, 1], [3, 74, 1]],
        [[0, 77, 1.5], [1.5, 74, 0.5], [2, 70, 1], [3, 69, 1]], [[0, 69, 2], [2, 67, 1], [3, 70, 0.5], [3.5, 72, 0.5]]],
      A2: [[[0, 76, 1.5], [1.5, 74, 0.5], [2, 72, 1], [3, 69, 0.5], [3.5, 72, 0.5]], [[0, 71, 2], [2, 72, 0.5], [2.5, 74, 0.5], [3, 79, 1]],
        [[0, 79, 1.5], [1.5, 76, 0.5], [2, 74, 1], [3, 70, 1]], [[0, 73, 2], [2, 77, 1], [3, 76, 1]],
        [[0, 77, 1], [1, 76, 0.5], [1.5, 74, 1.5], [3, 69, 1]], [[0, 71, 1.5], [1.5, 76, 2.5]],
        [[0, 74, 1], [1, 70, 1], [2, 69, 1], [3, 67, 1]], [[0, 65, 3], [3.5, 64, 0.5]]],
      B: [[[0, 81, 1.5], [1.5, 79, 0.5], [2, 77, 1], [3, 74, 1]], [[0, 79, 2], [2, 77, 1], [3, 73, 1]],
        [[0, 72, 1.5], [1.5, 76, 0.5], [2, 79, 2]], [[0, 78, 1], [1, 75, 1], [2, 74, 1], [3, 72, 1]],
        [[0, 70, 1.5], [1.5, 74, 0.5], [2, 77, 1.5], [3.5, 81, 0.5]], [[0, 81, 2], [2, 79, 0.5], [2.5, 76, 1.5]],
        [[0, 76, 1], [1, 72, 1], [2, 69, 2]], [[0, 70, 2], [2, 67, 2]]],
      bridge: [[[0, 77, 2], [2, 79, 2]], [[0, 84, 3.5]], [[0, 81, 2], [2, 77, 2]], [[0, 79, 2], [2, 77, 2]]],
      A3: [[[0, 76, 1.5], [1.5, 74, 0.5], [2, 72, 1], [3, 69, 1]], [[0, 71, 2.5], [2.5, 74, 0.5], [3, 79, 1]],
        [[0, 76, 1.5], [1.5, 74, 0.5], [2, 72, 2]], [[0, 71, 4]]]
    }
  },
  game: {
    bpm: 104, swing: 0.6, key: 0, seed: 23, loopTo: 0, gain: 1,
    form: [
      ['intro', ['Eb.maj9', 'C.d7b9', 'F.m9', 'Bb.d13']],
      ['A', ['Eb.maj9', 'Ab.d13', 'G.m7', 'C.d7b9', 'F.m9', 'Bb.d13', 'Eb.maj9', 'C.d7b9']],
      ['A2', ['Eb.maj9', 'Ab.d13', 'G.m7', 'C.d7b9', 'F.m9', 'Bb.d13', 'G.m7|C.d7b9', 'F.m9|Bb.d13']],
      ['B', ['Ab.maj9', 'Db.d9', 'G.m9', 'Gb.d13', 'F.m9', 'E.d13s11', 'Eb.maj9', 'Bb.d7sus']],
      ['stop', ['Eb.maj9', 'Eb.maj9', 'C.d7b9', 'Bb.d7sus']],
      ['A3', ['Eb.maj9', 'Ab.d13', 'G.m7', 'C.d7b9', 'F.m9', 'Bb.d13', 'Eb.six9', 'Eb.six9']]
    ],
    mel: {
      A: [[[0, 70, 0.5], [0.5, 74, 0.5], [1, 77, 0.5], [1.5, 79, 1.5], [3, 77, 0.5], [3.5, 74, 0.5]], [[0, 75, 1], [1, 78, 0.5], [1.5, 77, 2.5]],
        [[0, 74, 0.5], [0.5, 77, 0.5], [1, 79, 0.5], [1.5, 82, 1.5], [3, 81, 0.5], [3.5, 79, 0.5]], [[0, 76, 1], [1, 73, 1], [2, 70, 0.5], [2.5, 72, 1.5]],
        [[0, 68, 0.5], [0.5, 72, 0.5], [1, 75, 0.5], [1.5, 79, 1.5], [3, 77, 1]], [[0, 74, 1.5], [1.5, 79, 0.5], [2, 80, 1], [3, 79, 0.5], [3.5, 77, 0.5]],
        [[0, 79, 2], [2, 74, 1], [3, 70, 1]], [[0, 73, 1], [1, 76, 1], [2, 79, 1], [3, 82, 1]]],
      A2: [[[0, 70, 0.5], [0.5, 74, 0.5], [1, 77, 0.5], [1.5, 79, 1.5], [3, 77, 0.5], [3.5, 74, 0.5]], [[0, 75, 1], [1, 78, 0.5], [1.5, 77, 2.5]],
        [[0, 74, 0.5], [0.5, 77, 0.5], [1, 79, 0.5], [1.5, 82, 1.5], [3, 81, 0.5], [3.5, 79, 0.5]], [[0, 76, 0.5], [0.5, 79, 0.5], [1, 82, 0.5], [1.5, 85, 1.5], [3, 84, 1]],
        [[0, 80, 1], [1, 79, 0.5], [1.5, 77, 0.5], [2, 75, 1], [3, 72, 1]], [[0, 74, 1.5], [1.5, 77, 0.5], [2, 79, 2]],
        [[0, 77, 1], [1, 74, 1], [2, 76, 1], [3, 79, 1]], [[0, 80, 1.5], [1.5, 79, 0.5], [2, 77, 1], [3, 79, 0.5], [3.5, 82, 0.5]]],
      B: [[[0, 84, 2], [2, 82, 1], [3, 79, 1]], [[0, 80, 2], [2, 77, 1.5], [3.5, 75, 0.5]],
        [[0, 77, 1.5], [1.5, 74, 0.5], [2, 70, 2]], [[0, 70, 1], [1, 73, 1], [2, 75, 1], [3, 76, 1]],
        [[0, 79, 3], [3, 77, 1]], [[0, 80, 1], [1, 82, 1], [2, 85, 2]],
        [[0, 86, 2], [2, 82, 1], [3, 79, 1]], [[0, 77, 2], [2, 75, 1], [3, 72, 1]]],
      stop: [[], [], [[2, 79, 0.5], [2.5, 82, 0.5], [3, 85, 0.5], [3.5, 84, 0.5]], [[0, 82, 1], [1, 80, 0.5], [1.5, 77, 0.5], [2, 75, 1]]],
      A3: [[[0, 70, 0.5], [0.5, 74, 0.5], [1, 77, 0.5], [1.5, 79, 1.5], [3, 77, 0.5], [3.5, 74, 0.5]], [[0, 75, 1], [1, 78, 0.5], [1.5, 77, 2.5]],
        [[0, 74, 0.5], [0.5, 77, 0.5], [1, 79, 0.5], [1.5, 82, 1.5], [3, 81, 0.5], [3.5, 79, 0.5]], [[0, 76, 1], [1, 73, 1], [2, 70, 0.5], [2.5, 72, 1.5]],
        [[0, 68, 0.5], [0.5, 72, 0.5], [1, 75, 0.5], [1.5, 79, 1.5], [3, 77, 1]], [[0, 74, 1.5], [1.5, 79, 0.5], [2, 80, 1], [3, 79, 0.5], [3.5, 77, 0.5]],
        [[0, 79, 1], [1, 77, 0.5], [1.5, 75, 2.5]], [[2, 70, 0.5], [2.5, 72, 0.5], [3, 75, 1]]]
    }
  },
  rules: {
    bpm: 72, swing: 0.5, key: 7, seed: 37, loopTo: 0, gain: 1.6,
    form: [
      ['A', ['Bb.maj7s11', 'Bb.lyd', 'Bb.maj7s11', 'Bb.lyd', 'G.m9', 'A.m7', 'Bb.maj7s11', 'C.d7sus']],
      ['B', ['G.m9', 'Eb.maj7s11', 'C.m9', 'F.d7sus', 'D.m7', 'G.m9', 'Eb.maj7s11', 'F.d7sus']]
    ],
    mel: {
      A: [[[1, 77, 1], [2, 81, 1], [3, 76, 1]], [[0, 76, 3]], [], [], [[1, 74, 1], [2, 77, 1], [3, 81, 1]], [[0, 79, 3]], [[1, 77, 1], [2, 81, 1], [3, 88, 1]], [[0, 86, 3]]],
      B: [[], [], [[1, 79, 1], [2, 74, 1], [3, 75, 1]], [[0, 77, 3]], [], [], [[1, 79, 1], [2, 81, 1], [3, 82, 1]], [[0, 84, 3]]]
    }
  }
};
Object.keys(SONGS).forEach(k => { const s = SONGS[k]; s.name = k; s.bars = s.form.reduce((a, f) => a + f[1].length, 0); s.form.forEach(f => f[1].forEach(C2 => parts(C2))); });
const KEY_OF = { menu: 2, game: 0, rules: 7, none: 0 };
function locate(song, bar) { let n = bar; for (let i = 0; i < song.form.length; i++) { const f = song.form[i]; if (n < f[1].length) return { name: f[0], bars: f[1], n, i }; n -= f[1].length; } return { name: song.form[0][0], bars: song.form[0][1], n: 0, i: 0 }; }
function nextSpec(song, loc) { if (loc.n + 1 < loc.bars.length) return loc.bars[loc.n + 1]; const f = song.form[(loc.i + 1) % song.form.length]; return f[1][0]; }

// ───────────────────────── golpes calculados (una vez por contexto) ─────────────────────────
function makeBuffers(ctx) {
  const sr = ctx.sampleRate, B = {}, R = rngOf(4242);
  const mk = (sec, fn, ch) => { const n = Math.max(1, Math.floor(sr * sec)), b = ctx.createBuffer(ch || 1, n, sr); for (let c = 0; c < (ch || 1); c++) { const d = b.getChannelData(c); fn(d, n, c); let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i])); if (pk > 0) for (let i = 0; i < n; i++) d[i] /= pk; } return b; };
  const W = () => R() * 2 - 1;
  // filtro biquad (RBJ) aplicado a la muestra ya calculada: así cada golpe es una sola fuente, sin filtro en vivo
  const bq = (d, type, f, q) => { const w = 2 * Math.PI * f / sr, al = Math.sin(w) / (2 * q), cs = Math.cos(w); let b0, b1, b2; const a0 = 1 + al, a1 = -2 * cs, a2 = 1 - al;
    if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; } else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; } else { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; }
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < d.length; i++) { const x = d[i], y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; d[i] = y; } };
  // ride: parciales inarmónicos + chispa de ruido
  B.ride = mk(1.6, (d, n) => {
    const fr = [3089, 4211, 5367, 6743, 7921, 9377, 11210], ph = fr.map(() => R() * 6.28), dc = fr.map((f, i) => 0.55 - i * 0.05);
    let hp = 0, prev = 0;
    for (let i = 0; i < n; i++) { const t = i / sr; let s = 0; for (let k = 0; k < fr.length; k++) s += Math.sin(6.2832 * fr[k] * t + ph[k] + 0.6 * Math.sin(6.2832 * fr[k] * 0.517 * t)) * Math.exp(-t / dc[k]) * (k < 2 ? 0.7 : 0.45); const w = W(); hp = w - prev; prev = w; s += hp * 0.5 * Math.exp(-t / 0.18) + hp * 1.4 * Math.exp(-t / 0.004); d[i] = s; }
  });
  // charles con el pie («chick»)
  B.chick = mk(0.09, (d, n) => { let p = 0, y1 = 0; for (let i = 0; i < n; i++) { const t = i / sr, w = W(), h = w - p; p = w; y1 = y1 * 0.35 + h; d[i] = y1 * Math.exp(-t / 0.018) * Math.min(1, t / 0.0015); } });
  // escobilla: golpe y barrido
  B.tap = mk(0.22, (d, n) => { let l = 0; for (let i = 0; i < n; i++) { const t = i / sr; l = l * 0.6 + W() * 0.4; d[i] = l * Math.min(1, t / 0.004) * Math.exp(-t / 0.055); } });
  B.swish = mk(0.9, (d, n) => { let l = 0; for (let i = 0; i < n; i++) { const t = i / n; l = l * 0.5 + W() * 0.5; d[i] = l * Math.pow(Math.sin(Math.PI * t), 1.6) * (0.75 + 0.25 * Math.sin(t * 21)); } });
  B.sweep = mk(0.9, (d, n) => { for (let i = 0; i < n; i++) { const t = i / n; d[i] = W() * Math.pow(Math.sin(Math.PI * t), 1.6) * (0.75 + 0.25 * Math.sin(t * 21)); } bq(d, 'bp', 3600, 0.5); });
  B.btap = mk(0.2, (d, n) => { for (let i = 0; i < n; i++) { const t = i / sr; d[i] = W() * Math.min(1, t / 0.003) * Math.exp(-t / 0.05); } bq(d, 'bp', 2400, 0.6); });
  B.shk = mk(0.12, (d, n) => { for (let i = 0; i < n; i++) { const t = i / sr; d[i] = W() * Math.min(1, t / 0.004) * Math.exp(-t / 0.03); } bq(d, 'hp', 4200, 0.7); });
  B.thump = mk(0.08, (d, n) => { for (let i = 0; i < n; i++) { const t = i / sr; d[i] = W() * Math.exp(-t / 0.012); } bq(d, 'lp', 380, 0.7); bq(d, 'lp', 380, 0.7); });
  // aro (bossa) y bombo suave
  B.rim = mk(0.08, (d, n) => { for (let i = 0; i < n; i++) { const t = i / sr; d[i] = (Math.sin(6.2832 * 1720 * t) * 0.6 + Math.sin(6.2832 * 830 * t) * 0.8) * Math.exp(-t / 0.014) + W() * Math.exp(-t / 0.003) * 0.6; } });
  B.kick = mk(0.42, (d, n) => { let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr, f = 46 + 64 * Math.exp(-t / 0.035); ph += 6.2832 * f / sr; d[i] = Math.sin(ph) * Math.exp(-t / 0.16) * Math.min(1, t / 0.002) + W() * Math.exp(-t / 0.004) * 0.15; } });
  // máquina de escribir: tres teclas distintas, campanilla del carro (Si♭6) y el carro que vuelve
  B.keys = [0, 1, 2].map(k => mk(0.09, (d, n) => { const f0 = [190, 230, 170][k], f1 = [2900, 3400, 2500][k]; for (let i = 0; i < n; i++) { const t = i / sr, t2 = t - 0.022 - k * 0.004; let s = W() * Math.exp(-t / 0.0025) + Math.sin(6.2832 * f0 * t) * Math.exp(-t / 0.012) * 0.8 + Math.sin(6.2832 * f1 * t) * Math.exp(-t / 0.004) * 0.4; if (t2 > 0) s += (W() * Math.exp(-t2 / 0.002) + Math.sin(6.2832 * f0 * 1.3 * t2) * Math.exp(-t2 / 0.008)) * 0.35; d[i] = s; } }));
  B.bell = mk(2.2, (d, n) => { const f = mtof(94); for (let i = 0; i < n; i++) { const t = i / sr; d[i] = (Math.sin(6.2832 * f * t) + 0.5 * Math.sin(6.2832 * f * 2.756 * t) * Math.exp(-t / 0.25) + 0.25 * Math.sin(6.2832 * f * 5.404 * t) * Math.exp(-t / 0.08)) * Math.exp(-t / 0.7) * Math.min(1, t / 0.0008); } });
  B.carriage = mk(0.5, (d, n) => { let l = 0; for (let i = 0; i < n; i++) { const t = i / sr, k = t / 0.5; l = l * 0.8 + W() * 0.2; const ratchet = (Math.sin(6.2832 * (38 + 30 * k) * t) > 0.92 ? 1 : 0.2); d[i] = l * ratchet * Math.sin(Math.PI * Math.min(1, k * 1.15)) + (t > 0.42 ? W() * Math.exp(-(t - 0.42) / 0.01) * 1.5 : 0); } });
  // papel: roce, «puf» y bollo
  B.paper = mk(0.16, (d, n) => { let l = 0; for (let i = 0; i < n; i++) { const t = i / n; l = l * 0.3 + W() * 0.7; d[i] = l * Math.sin(Math.PI * Math.pow(t, 0.6)) * (0.6 + 0.4 * (R() < 0.04 ? 1 : 0)); } });
  B.crumple = mk(0.55, (d, n) => { let env = 0; for (let i = 0; i < n; i++) { if (R() < 0.0016) env = 0.4 + R() * 0.6; env *= 0.9965; d[i] = W() * env * (1 - i / n); } });
  // vacío (desbloqueo de iOS)
  B.silent = ctx.createBuffer(1, 1, sr);
  return B;
}
function irBuf(ctx, sec) {
  const sr = ctx.sampleRate, pre = Math.floor(sr * 0.018), n = Math.floor(sr * sec) + pre, b = ctx.createBuffer(2, n, sr), R = rngOf(77);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let lp = 0;
    for (let i = pre; i < n; i++) { const t = (i - pre) / sr, k = t / sec, a = 0.25 + 0.7 * k; lp = lp * a + (R() * 2 - 1) * (1 - a); d[i] = lp * Math.pow(1 - k, 2.4) * 2.2; }
  }
  return b;
}

// ───────────────────────── mezcla ─────────────────────────
const INST = {
  // g: nivel del canal (mezcla medida por instrumento con la exportación: vibráfono adelante, contrabajo y piano detrás)
  ep: { g: 1.25, pan: -0.22, rev: 0.22, trem: 4.6, depth: 0.16 }, vib: { g: 2.0, pan: 0.28, rev: 0.32, trem: 5.4, depth: 0.2 }, bass: { g: 0.4, pan: 0, rev: 0.05 },
  ride: { g: 1.25, pan: 0.38, rev: 0.12 }, hat: { g: 1.25, pan: 0.22, rev: 0.08 }, brush: { g: 1.25, pan: -0.12, rev: 0.16 }, kick: { g: 1.25, pan: 0, rev: 0.03 },
  rim: { g: 1.25, pan: -0.3, rev: 0.18 }, pad: { g: 1.6, pan: 0, rev: 0.45 }, tpt: { g: 2.5, pan: -0.4, rev: 0.28 }, type: { g: 1.25, pan: 0.45, rev: 0.14 }, bell: { g: 1, pan: 0.5, rev: 0.4 }
};
function panner(ctx, v) { if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = v; return p; } return ctx.createGain(); }
function softClipCurve() { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1, a = Math.abs(x); c[i] = a < 0.75 ? x : Math.sign(x) * (0.75 + 0.25 * Math.tanh((a - 0.75) / 0.25)); } return c; }
/** Grafo común al contexto en vivo y al de exportación. */
function mixer(ctx) {
  const m = { ctx, B: makeBuffers(ctx) };
  m.out = ctx.createGain(); m.out.gain.value = 0.92;
  m.clip = ctx.createWaveShaper(); m.clip.curve = softClipCurve(); m.clip.oversample = '2x';
  m.lim = ctx.createDynamicsCompressor(); m.lim.threshold.value = -3; m.lim.knee.value = 0; m.lim.ratio.value = 20; m.lim.attack.value = 0.002; m.lim.release.value = 0.09;
  m.lim.connect(m.clip); m.clip.connect(m.out); m.out.connect(ctx.destination);
  m.rev = ctx.createConvolver(); m.rev.buffer = irBuf(ctx, 2.0); m.revOut = ctx.createGain(); m.revOut.gain.value = 0.5; m.rev.connect(m.revOut); m.revOut.connect(m.lim);
  // música: bus → atenuación de pausa (filtro + ganancia) → limitador
  m.music = ctx.createGain(); m.duckF = ctx.createBiquadFilter(); m.duckF.type = 'lowpass'; m.duckF.frequency.value = 20000; m.duckF.Q.value = 0.5;
  m.duckG = ctx.createGain(); m.music.connect(m.duckF); m.duckF.connect(m.duckG); m.duckG.connect(m.lim);
  m.press = ctx.createGain(); m.press.gain.value = 0.9; m.press.connect(m.duckG);
  m.sfx = ctx.createGain(); m.sfx.connect(m.lim); m.sfxRev = ctx.createGain(); m.sfxRev.gain.value = 0.2; m.sfx.connect(m.sfxRev); m.sfxRev.connect(m.rev);
  m.sfxL = panner(ctx, -0.18); m.sfxL.connect(m.sfx); m.sfxR = panner(ctx, 0.18); m.sfxR.connect(m.sfx);
  return m;
}
/** Bus de un tema: 4 capas, un canal por instrumento (paneo, trémolo, envío a reverb). */
function sceneBus(mx, name) {
  const ctx = mx.ctx, s = { name, song: SONGS[name], bar: 0, loop: 0, ch: {}, osc: [], vprev: null, pprev: null, bprev: null, tprev: 64, solo: { m: 77, len: 0, rest: 0, dir: 1, force: 0 }, on: [1, 0, 0, 0], was: [1, 0, 0, 0] };
  s.lvl = s.song.gain || 1; s.g = ctx.createGain(); s.g.gain.value = s.lvl; s.g.connect(mx.music);
  s.L = [0, 1, 2, 3].map(i => { const g = ctx.createGain(); g.gain.value = i === 0 ? 1 : 0; g.connect(s.g); return g; });
  s.lfo = {};
  s.bus = (li, inst) => {
    const k = li + inst; if (s.ch[k]) return s.ch[k];
    const d = INST[inst], p = ctx.createGain(); p.gain.value = d.g; const pn = panner(ctx, d.pan); p.connect(pn); let head = pn;
    if (d.trem) {
      const tg = ctx.createGain(); tg.gain.value = 1 - d.depth; pn.connect(tg); head = tg;
      if (!s.lfo[inst]) { const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = d.trem; og.gain.value = d.depth; o.connect(og); o.start(); s.osc.push(o); s.lfo[inst] = og; }
      s.lfo[inst].connect(tg.gain);
    }
    head.connect(s.L[li]);
    const sg = ctx.createGain(); sg.gain.value = d.rev; head.connect(sg); sg.connect(mx.rev);
    return (s.ch[k] = p);
  };
  return s;
}
function dropBus(s, t) { try { s.osc.forEach(o => o.stop(t)); } catch (e) { } }

// ───────────────────────── instrumentos ─────────────────────────
function hit(mx, buf, dest, t, vel, rate, filt) {
  const ctx = mx.ctx, src = ctx.createBufferSource(); src.buffer = buf; if (rate) src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = vel; let head = src;
  if (filt) { const f = ctx.createBiquadFilter(); f.type = filt[0]; f.frequency.value = filt[1]; f.Q.value = filt[2] || 0.7; head.connect(f); head = f; }
  head.connect(g); g.connect(dest); src.start(Math.max(0, t)); return src;
}
/** Piano eléctrico FM: portadora seno, moduladora 1:1 con índice que cae, «púa» metálica breve. */
function ep(mx, dest, m, t, dur, vel) {
  const ctx = mx.ctx, f = mtof(m), car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), out = ctx.createGain();
  car.frequency.value = f; mod.frequency.value = f; const bright = 0.6 + vel * 0.9;
  mg.gain.setValueAtTime(f * 1.9 * bright, t); mg.gain.setTargetAtTime(f * 0.22, t, 0.18 + 0.1 * (1 - vel));
  mod.connect(mg); mg.connect(car.frequency); car.connect(out);
  const tine = ctx.createOscillator(), tg = ctx.createGain(); tine.frequency.value = f * 7.03; tg.gain.setValueAtTime(0.0001, t); tg.gain.linearRampToValueAtTime(0.06 * vel, t + 0.002); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); tine.connect(tg); tg.connect(out);
  const pk = 0.085 * vel * (m > 72 ? 0.8 : 1), p = out.gain;
  p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(pk, t + 0.005); p.setTargetAtTime(pk * 0.4, t + 0.005, 0.45); p.setTargetAtTime(0.0001, t + dur, 0.12);
  out.connect(dest); const e = t + dur + 0.5; car.start(t); mod.start(t); tine.start(t); car.stop(e); mod.stop(e); tine.stop(t + 0.1);
}
/** Vibráfono: parciales 1 · 4 · 10 de una lámina, golpe de maza. */
function vib(mx, dest, m, t, dur, vel) {
  const ctx = mx.ctx, f = mtof(m), out = ctx.createGain(), len = Math.min(2.6, 0.5 + dur * 0.9);
  const end = Math.min(len, dur + 1.0) + 0.05;
  [[1, 1, len], [3.99, 0.16, 0.28], [10.1, 0.045, 0.07]].forEach(([h, a, d], i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f * h; g.gain.setValueAtTime(a, t); g.gain.setTargetAtTime(0.0001, t, d / 3); o.connect(g); g.connect(out); o.start(t); o.stop(t + Math.min(end, d + 0.15 + (i ? 0 : 0.2)));
  });
  const p = out.gain, pk = 0.13 * vel; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(pk, t + 0.003); p.setTargetAtTime(pk * 0.55, t + 0.003, 0.25); p.setTargetAtTime(0.0001, t + dur + 0.05, 0.22);
  out.connect(dest);
}
/** Contrabajo: triángulo + seno, filtro que se cierra (pizzicato), golpe de dedo y leve caída de afinación. */
function bass(mx, dest, m, t, dur, vel) {
  const ctx = mx.ctx, f = mtof(m), o = ctx.createOscillator(), s = ctx.createOscillator(), lp = ctx.createBiquadFilter(), out = ctx.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(f * 1.006, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05); s.frequency.value = f;
  lp.type = 'lowpass'; lp.Q.value = 1.4; lp.frequency.setValueAtTime(380 + 900 * vel, t); lp.frequency.setTargetAtTime(260, t, 0.07);
  o.connect(lp); s.connect(lp); lp.connect(out); out.connect(dest);
  const pk = 0.32 * vel, p = out.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(pk, t + 0.006); p.setTargetAtTime(pk * 0.5, t + 0.006, 0.2); p.setTargetAtTime(0.0001, t + dur, 0.05);
  const e = t + dur + 0.35; o.start(t); s.start(t); o.stop(e); s.stop(e);
  hit(mx, mx.B.thump, dest, t, 0.07 * vel);
}
/** Cuerdas: dos sierras desafinadas por nota, pasa bajos, ataque lento. */
function pad(mx, dest, notes, t, dur, vol, cut) {
  const ctx = mx.ctx, out = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut || 1100; lp.Q.value = 0.3;
  out.connect(lp); lp.connect(dest);
  notes.forEach((m, i) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = i % 2 ? 7 : -7; o.connect(out); o.start(t); o.stop(t + dur + 1.1); });
  const v = vol / Math.sqrt(notes.length), p = out.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(v, t + Math.min(0.9, dur * 0.4)); p.setValueAtTime(v, t + Math.max(0.91, dur - 0.15)); p.setTargetAtTime(0.0001, t + dur, 0.35);
}
/** Trompeta con sordina: dos sierras, formante nasal, ataque con «scoop» y vibrato tardío. */
function tpt(mx, dest, m, t, dur, vel) {
  const ctx = mx.ctx, f = mtof(m), o = ctx.createOscillator(), o2 = ctx.createOscillator(), bp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), out = ctx.createGain();
  o.type = 'sawtooth'; o2.type = 'square'; o2.detune.value = 5;
  [o, o2].forEach(x => { x.frequency.setValueAtTime(f * 0.982, t); x.frequency.exponentialRampToValueAtTime(f, t + 0.07); });
  const vb = ctx.createOscillator(), vg = ctx.createGain(); vb.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.6, dur * 0.6)); vb.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
  bp.type = 'bandpass'; bp.frequency.value = 1450; bp.Q.value = 1.6; lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(3200, t + 0.08); lp.frequency.setTargetAtTime(2100, t + 0.1, 0.3);
  const og2 = ctx.createGain(); og2.gain.value = 0.4; o.connect(bp); o2.connect(og2); og2.connect(bp); bp.connect(lp); lp.connect(out); out.connect(dest);
  const pk = 0.1 * vel, p = out.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(pk, t + 0.045); p.setTargetAtTime(pk * 0.8, t + 0.05, 0.3); p.setTargetAtTime(0.0001, t + dur, 0.07);
  const e = t + dur + 0.4; [o, o2, vb].forEach(x => { x.start(t); x.stop(e); });
}
function brass(mx, dest, m, t, dur, vel) {
  const ctx = mx.ctx, f = mtof(m), o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), out = ctx.createGain();
  o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f; o2.detune.value = 8;
  lp.type = 'lowpass'; lp.Q.value = 1.1; lp.frequency.setValueAtTime(400, t); lp.frequency.linearRampToValueAtTime(2600, t + 0.07); lp.frequency.setTargetAtTime(1300, t + 0.08, 0.25);
  o.connect(lp); o2.connect(lp); lp.connect(out); out.connect(dest);
  const pk = 0.07 * vel, p = out.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(pk, t + 0.03); p.setTargetAtTime(pk * 0.7, t + 0.04, 0.3); p.setTargetAtTime(0.0001, t + dur, 0.1);
  [o, o2].forEach(x => { x.start(t); x.stop(t + dur + 0.6); });
}
function blip(mx, dest, f0, f1, t, len, vol, type) {
  const ctx = mx.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + len);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.02); o.connect(g); g.connect(dest); o.start(t); o.stop(t + len + 0.05);
}

// En vivo, el compás se escribe como lista de notas (datos) y los nodos se crean recién ~0,2 s antes de sonar,
// de a poco en cada vuelta del reloj: así el hilo principal nunca se traba armando un compás entero (arrastre fluido).
function deferrable(fn, ti) { return function (mx) { if (mx.dq) { const a = Array.prototype.slice.call(arguments); a[0] = mx.real; mx.dq.push({ t: a[ti], f: fn, a }); return; } return fn.apply(null, arguments); }; }
ep = deferrable(ep, 3); vib = deferrable(vib, 3); bass = deferrable(bass, 3); pad = deferrable(pad, 3); tpt = deferrable(tpt, 3); hit = deferrable(hit, 3);

// ───────────────────────── compás por tema ─────────────────────────
function timer(t, spb, swing, r, hum) { return b => { const w = Math.floor(b + 1e-6), fr = b - w; const off = Math.abs(fr - 0.5) < 1e-6 ? swing : fr; return t + (w + off) * spb + (hum ? (r() - 0.5) * hum : 0); }; }
function playMel(mx, dest, list, T, spb, opts) {
  const r = opts.r;
  list.forEach(([b, m, d], i) => {
    let mm = m + (opts.oct || 0), bb = b;
    if (opts.antic && b === 0 && i === 0) bb = -0.5;
    const tt = T(bb), vel = (opts.vel || 0.9) * (0.88 + r() * 0.2) * (b % 1 ? 0.92 : 1);
    if (opts.grace && d >= 1.5 && r() < 0.6) vib(mx, dest, mm - 1, tt - 0.055, 0.05, vel * 0.5);
    vib(mx, dest, mm, tt, d * spb * 0.96, vel);
  });
}
function walk(c, nextC, beats, prev, r) {
  let root = nearPc(c.pc, prev || c.bass); if (root < 30) root += 12; if (root > 44) root -= 12;
  let tgt = nearPc(nextC.pc, root); if (tgt < 29) tgt += 12; if (tgt > 46) tgt -= 12;
  const appr = tgt + (r() < 0.55 ? -1 : 1);
  if (beats === 2) return [root, r() < 0.7 ? appr : nearPc(c.pc + c.q.ct[2], root)];
  const third = root + c.q.ct[1], fifth = root + c.q.ct[2], sev = root + c.q.ct[3] - 12, up = tgt >= root;
  const k = r();
  let line;
  if (k < 0.34) line = [root, third, fifth, appr];
  else if (k < 0.62) line = up ? [root, root + c.q.sc[1], third, appr] : [root, sev, fifth - 12 > 28 ? fifth - 12 : root - 2, appr];
  else if (k < 0.82) line = [root, fifth, root + 12 > 48 ? third : root + 12, appr];
  else line = [root, root, fifth, tgt + (up ? -2 : 2)];
  return line.map(x => (x < 28 ? x + 12 : x > 50 ? x - 12 : x));
}
const COMP = [[[0, 0.9], [1.5, 0.45]], [[0.5, 0.45], [2.5, 0.9]], [[1.5, 0.4], [3.5, 1.2]], [[0, 0.35], [2, 0.35], [3.5, 0.9]], [[1, 0.4], [2.5, 1.1]], [[0.5, 0.4], [1.5, 0.4], [3, 0.9]]];
const BOSSA = [[[[0, 1.3], [1.5, 0.4], [3, 0.9]], [[0.5, 0.4], [2, 1.3], [3.5, 0.45]]], [[[0, 0.45], [1.5, 1.3], [3, 0.45]], [[0.5, 1.0], [2.5, 0.45], [3.5, 0.45]]], [[[0, 0.9], [1, 0.45], [2.5, 1.2]], [[1, 0.45], [2, 0.45], [3.5, 0.45]]]];
const SCALE_EB = [63, 65, 67, 68, 70, 72, 74, 75, 77, 79, 80, 82, 84, 86, 87, 89, 91];

function barGame(mx, s, t, loc, layersNow) {
  const song = s.song, spb = 60 / song.bpm, r = rngOf(song.seed * 7919 + s.loop * 104729 + s.bar * 31), T = timer(t, spb, song.swing, r, 0.012), T0 = timer(t, spb, song.swing, r, 0);
  const P = parts(loc.bars[loc.n]), nxt = C(nextSpec(song, loc).split('|')[0]), last = loc.n === loc.bars.length - 1, on = layersNow;
  const B1 = i => s.bus(0, i), B2 = i => s.bus(1, i), B3 = i => s.bus(2, i), B4 = i => s.bus(3, i);
  const name = loc.name;
  if (name === 'stop') {
    // corte: un acorde por compás en el 1; la máquina de escribir marca el contratiempo; campanilla y carro al final
    const c = P[0].c, v = voicing(c, s.vprev, 51, 72); s.vprev = v;
    v.forEach((m, i) => ep(mx, B1('ep'), m, t + i * 0.006, spb * 0.7, 0.8));
    bass(mx, B1('bass'), nearPc(c.pc, s.bprev || c.bass) < 30 ? nearPc(c.pc, s.bprev || c.bass) + 12 : nearPc(c.pc, s.bprev || c.bass), t, spb * 0.8, 1);
    hit(mx, mx.B.ride, B1('ride'), t, 0.22, 0.94); hit(mx, mx.B.kick, B1('kick'), t, 0.35);
    [0.5, 1.5, 2.5].concat(loc.n < 3 ? [3.5] : []).forEach(b => hit(mx, mx.B.keys[Math.floor(r() * 3)], B1('type'), T(b), 0.16 + r() * 0.05));
    if (r() < 0.6) hit(mx, mx.B.keys[Math.floor(r() * 3)], B1('type'), T(1 + Math.floor(r() * 2) + 0.5) + spb * 0.17, 0.1);
    if (loc.n === 3) { hit(mx, mx.B.bell, B1('bell'), T(3), 0.16); hit(mx, mx.B.carriage, B1('type'), T(3.25), 0.13); }
    if (on[1]) { if (loc.n === 3) [2, 2 + 1 / 3, 2 + 2 / 3].forEach((b, i) => hit(mx, mx.B.btap, B2('brush'), T0(b), 0.12 + i * 0.05, 1)); }
    if (on[2]) playMel(mx, B3('vib'), song.mel.stop[loc.n], T, spb, { r, vel: 0.95 });
    return;
  }
  const intro = name === 'intro';
  // ── capa 1: contrabajo, ride, charles, cuerdas
  P.forEach((p, pi) => {
    const nc = pi + 1 < P.length ? P[pi + 1].c : nxt;
    if (intro) {
      let root = nearPc(p.c.pc, s.bprev || p.c.bass); if (root < 30) root += 12; if (root > 44) root -= 12;
      bass(mx, B1('bass'), root, T0(p.b0), spb * 1.8, 1); const fifth = root + 7 > 47 ? root - 5 : root + 7;
      bass(mx, B1('bass'), r() < 0.5 ? fifth : nearPc(nc.pc, root) - 1, T(p.b0 + 2), spb * 1.8, 0.85); s.bprev = root;
    } else {
      const line = walk(p.c, nc, p.len, s.bprev, r);
      line.forEach((m, i) => bass(mx, B1('bass'), m, i === 0 ? T0(p.b0 + i) : T(p.b0 + i), spb * 0.9, i === 0 ? 1 : 0.82 + r() * 0.12));
      s.bprev = line[line.length - 1];
      if (p.len === 4 && r() < 0.14) bass(mx, B1('bass'), line[2], T(2.5) + spb * 0.17, spb * 0.2, 0.35);
    }
    const pv = voicing(p.c, s.pprev, 58, 79); s.pprev = pv; pad(mx, B1('pad'), pv, T0(p.b0), p.len * spb, 0.022, 950);
  });
  [[0, 0.75], [1, 1], [1.5, 0.55], [2, 0.75], [3, 1], [3.5, 0.55]].forEach(([b, v]) => hit(mx, mx.B.ride, B1('ride'), T(b), 0.075 * v * (0.85 + r() * 0.3), 0.97 + r() * 0.06));
  [1, 3].forEach(b => hit(mx, mx.B.chick, B1('hat'), T(b), 0.09, 1));
  if (intro && s.loop === 0 && loc.n < 2) { [0.5, 1, 1.5, 2.5, 3].forEach(b => { if (r() < 0.7) hit(mx, mx.B.keys[Math.floor(r() * 3)], B1('type'), T(b), 0.12); }); if (loc.n === 1) hit(mx, mx.B.bell, B1('bell'), T(3.5), 0.1); }
  // ── capa 2: piano a contratiempo, escobillas, rellenos, teclas sueltas
  if (on[1]) {
    const pat = COMP[Math.floor(r() * COMP.length)];
    pat.forEach(([b, d]) => {
      let c = (P.length > 1 && b >= 2) ? P[1].c : P[0].c; if (b >= 3.5 && !last) c = nxt; if (b >= 3.5 && last && P.length === 1) c = nxt;
      const v = voicing(c, s.vprev, 51, 72); s.vprev = v; const tt = T(b), vel = 0.62 + r() * 0.2;
      v.forEach((m, i) => ep(mx, B2('ep'), m, tt + i * 0.007, spb * d, vel));
    });
    hit(mx, mx.B.sweep, B2('brush'), T0(0), 0.07, 1.05); hit(mx, mx.B.sweep, B2('brush'), T0(2), 0.07, 0.95);
    [1, 3].forEach(b => hit(mx, mx.B.btap, B2('brush'), T(b), 0.15, 1));
    [0.5, 1.5, 2.5, 3.5].forEach(b => { if (r() < 0.22) hit(mx, mx.B.btap, B2('brush'), T(b), 0.06, 1.1); });
    if (last) { [2, 2 + 1 / 3, 2 + 2 / 3, 3, 3 + 1 / 3, 3 + 2 / 3].forEach((b, i) => { if (i > 1 || r() < 0.5) hit(mx, mx.B.btap, B2('brush'), T0(b), 0.08 + i * 0.022, 1); }); if (name === 'A' || name === 'A2') hit(mx, mx.B.bell, B2('bell'), T(3.5), 0.08); }
    if (r() < 0.25) for (let k = 0; k < 2 + Math.floor(r() * 3); k++) hit(mx, mx.B.keys[Math.floor(r() * 3)], B2('type'), T(0.5 + Math.floor(r() * 7) / 2), 0.07);
  }
  // ── capa 3: vibráfono (tema o improvisación)
  if (on[2] && !intro) {
    const solo = (name === 'A' || name === 'A2') ? s.loop % 2 === 1 : (name === 'A3' && s.loop % 4 === 3);
    if (solo) soloBar(mx, s, B3('vib'), P, nxt, T, spb, r);
    else {
      const mel = song.mel[name] && song.mel[name][loc.n]; s.solo.len = 0;
      if (mel) playMel(mx, B3('vib'), mel, T, spb, { r, vel: 0.95, grace: s.loop % 3 === 1, oct: (name === 'A2' && s.loop % 3 === 2 && loc.n < 6) ? 12 : 0, antic: s.loop % 4 === 2 && loc.n > 0 && name !== 'B' });
    }
  }
  // ── capa 4: trompeta con sordina en notas guía, bombo de pluma
  if (on[3]) {
    P.forEach(p => {
      const g1 = nearPc(p.c.pc + p.c.q.ct[1], s.tprev), g2 = nearPc(p.c.pc + p.c.q.ct[3], s.tprev);
      let m = Math.abs(g1 - s.tprev) <= Math.abs(g2 - s.tprev) ? g1 : g2; if (m < 58) m += 12; if (m > 72) m -= 12; s.tprev = m;
      if (name === 'A3' && loc.n % 2 === 0) { [[0.5, 0.4], [1.5, 0.4], [3, 0.9]].forEach(([b, d]) => tpt(mx, B4('tpt'), m + (b === 3 ? 0 : 0), T(b), d * spb, 0.9)); }
      else tpt(mx, B4('tpt'), m, T(p.b0 + (p.b0 === 0 && r() < 0.3 ? 0.5 : 0)), (p.len - 0.6) * spb, 0.8);
    });
    [0, 1, 2, 3].forEach(b => hit(mx, mx.B.kick, B4('kick'), T0(b), 0.12));
  }
}
function soloBar(mx, s, dest, P, nxt, T, spb, r) {
  const st = s.solo;
  for (let e = 0; e < 8; e++) {
    const beat = e / 2, c = (P.length > 1 && beat >= 2) ? P[1].c : P[0].c;
    if (st.rest > 0) { st.rest--; continue; }
    if (st.len <= 0) { st.len = 5 + Math.floor(r() * 9); st.rest = (e === 0 && r() < 0.5) ? 0 : 1 + Math.floor(r() * 3); if (st.rest) { st.rest--; continue; } }
    const sc = scaleNear(c, 65, 89);
    let m;
    if (st.force) { m = st.force; st.force = 0; }
    else {
      let idx = sc.indexOf(st.m); if (idx < 0) { idx = 0; while (idx < sc.length - 1 && sc[idx] < st.m) idx++; }
      if (sc[idx] >= 86) st.dir = -1; if (sc[idx] <= 67) st.dir = 1; if (r() < 0.22) st.dir = -st.dir;
      idx = Math.max(0, Math.min(sc.length - 1, idx + st.dir * (r() < 0.72 ? 1 : 2))); m = sc[idx];
      if (e % 2 === 0 && c.q.ct.indexOf(((m - c.pc) % 12 + 12) % 12) < 0 && r() < 0.7) { const ct = chordTonesNear(c, m - 2, m + 2); if (ct.length) m = ct[st.dir > 0 ? ct.length - 1 : 0]; }
    }
    if (e === 7 && r() < 0.4) { const ct = chordTonesNear(nxt, m - 3, m + 3); if (ct.length) { const tg = ct[Math.floor(r() * ct.length)]; m = tg - 1; st.force = tg; } }
    st.len--;
    let d = 0.5; if (st.len === 0 && e < 7) { d = r() < 0.5 ? 1 : 1.5; const ct = chordTonesNear(c, m - 2, m + 2); if (ct.length) m = ct[0]; }
    vib(mx, dest, m, T(beat), d * spb * 0.92, (e % 2 ? 0.95 : 0.78) * (0.9 + r() * 0.15));
    st.m = m; e += Math.round(d * 2) - 1;
  }
}
function barMenu(mx, s, t, loc) {
  const song = s.song, spb = 60 / song.bpm, r = rngOf(song.seed * 7919 + s.loop * 104729 + s.bar * 31), T = timer(t, spb, 0.5, r, 0.01), T0 = timer(t, spb, 0.5, r, 0);
  const p = parts(loc.bars[loc.n])[0], c = p.c, nxt = C(nextSpec(song, loc)), name = loc.name, B = i => s.bus(0, i);
  const vc = voicing(c, s.vprev, 53, 74); s.vprev = vc;
  if (name === 'intro' || name === 'B' || name === 'bridge') { const pv = voicing(c, s.pprev, 60, 81); s.pprev = pv; pad(mx, B('pad'), pv, T0(0), 4 * spb, name === 'B' ? 0.018 : 0.026, 1200); }
  const playBass = name !== 'intro' || s.loop > 0;
  if (playBass) {
    let root = nearPc(c.pc, s.bprev || c.bass); if (root < 31) root += 12; if (root > 43) root -= 12; s.bprev = root;
    const fifth = root + 7 > 47 ? root - 5 : root + 7, nr = nearPc(nxt.pc, root);
    const v2 = s.loop % 2 === 1 && r() < 0.5;
    bass(mx, B('bass'), root, T0(0), spb * 1.35, 1); bass(mx, B('bass'), fifth, T(1.5), spb * 0.42, 0.75);
    bass(mx, B('bass'), v2 ? root + 12 > 48 ? fifth : root + 12 : fifth, T(2), spb * 1.35, 0.9);
    bass(mx, B('bass'), (r() < 0.45 && nxt !== c) ? nr : root, T(3.5), spb * 0.42, 0.7);
  }
  // piano: bossa en dos compases, empuje al acorde siguiente en el 4y
  const pset = BOSSA[(s.loop + (name === 'A2' ? 1 : name === 'B' ? 2 : 0)) % BOSSA.length][s.bar % 2];
  if (name === 'intro') { vc.forEach((m, i) => ep(mx, B('ep'), m, T0(0) + i * 0.03, spb * 3.6, 0.6)); if (loc.n % 2 === 1) vc.slice(-2).forEach((m, i) => ep(mx, B('ep'), m + 12, T(2.5) + i * 0.05, spb * 1.4, 0.4)); }
  else pset.forEach(([b, d]) => { let v = vc; if (b >= 3.5 && nxt !== c) { v = voicing(nxt, vc, 53, 74); } const tt = T(b), vel = 0.5 + r() * 0.18; v.forEach((m, i) => ep(mx, B('ep'), m, tt + i * 0.006, spb * d, vel)); });
  // percusión: aro con la clave de bossa, escobilla en corcheas, bombo como surdo
  if (name !== 'intro' && name !== 'bridge') {
    (s.bar % 2 === 0 ? [0, 1.5, 3] : [1, 2.5]).forEach(b => hit(mx, mx.B.rim, B('rim'), T(b), 0.075, 1));
    for (let e = 0; e < 8; e++) hit(mx, mx.B.shk, B('brush'), T(e / 2), (e % 2 ? 0.05 : 0.08) * (0.8 + r() * 0.4), 1.1);
    hit(mx, mx.B.kick, B('kick'), T0(0), 0.18); hit(mx, mx.B.kick, B('kick'), T(1.5), 0.08); hit(mx, mx.B.kick, B('kick'), T0(2), 0.22);
  } else if (name === 'bridge') { hit(mx, mx.B.sweep, B('brush'), T0(0), 0.06, 0.8); hit(mx, mx.B.sweep, B('brush'), T0(2), 0.06, 0.88); }
  // melodía
  const mel = song.mel[name] && song.mel[name][loc.n];
  if (mel && name !== 'bridge') playMel(mx, B('vib'), mel, T, spb, { r, vel: name === 'A' && s.loop === 0 ? 0.85 : 0.95, grace: s.loop % 2 === 1, oct: name === 'A2' && s.loop % 3 === 2 ? 12 : 0, antic: s.loop % 3 === 1 && name === 'A' && loc.n > 0 });
  if (mel && name === 'bridge') mel.forEach(([b, m, d]) => ep(mx, B('ep'), m, T(b), d * spb, 0.5));
  if (r() < 0.12 && name !== 'intro') hit(mx, mx.B.keys[Math.floor(r() * 3)], B('type'), T(3.5), 0.08);
  if (name === 'A2' && loc.n === 7) hit(mx, mx.B.bell, B('bell'), T(3.5), 0.07, mtof(72) / mtof(94) * 4);
}
function barRules(mx, s, t, loc) {
  const song = s.song, spb = 60 / song.bpm, r = rngOf(song.seed * 7919 + s.loop * 104729 + s.bar * 31), B = i => s.bus(0, i);
  const c = parts(loc.bars[loc.n])[0].c, pv = voicing(c, s.pprev, 58, 79); s.pprev = pv;
  pad(mx, B('pad'), pv, t, 4 * spb, 0.03, 1000);
  const vc = voicing(c, s.vprev, 55, 76); s.vprev = vc;
  const up = (s.loop + loc.i) % 2 === 0, arp = up ? vc.concat([vc[1] + 12]) : [vc[3] + 12].concat(vc.slice().reverse());
  arp.forEach((m, i) => ep(mx, B('ep'), m, t + i * spb * 0.75 + (r() - 0.5) * 0.06 + (i ? 0.02 : 0), spb * 2.6, 0.38 + (i === 0 ? 0.1 : 0)));
  if (loc.n % 2 === 0) { let root = nearPc(c.pc, s.bprev || c.bass); if (root < 31) root += 12; if (root > 43) root -= 12; s.bprev = root; bass(mx, B('bass'), root, t, spb * 3.6, 0.6); }
  const mel = song.mel[loc.name][loc.n]; if (mel && mel.length) playMel(mx, B('vib'), mel, timer(t, spb, 0.5, r, 0.03), spb, { r, vel: 0.7, oct: s.loop % 2 === 1 ? -12 : 0 });
  if (loc.n % 4 === 3) hit(mx, mx.B.sweep, B('brush'), t + spb * 2, 0.05, 0.7);
}
/** Programa un compás del tema `s` empezando en `t`. Devuelve su duración. */
function scheduleBar(mx, s, t, layers, silent) {
  const song = s.song, loc = locate(song, s.bar), barLen = 240 / song.bpm;
  const want = [1, layers.l2 ? 1 : 0, layers.l3 ? 1 : 0, layers.l4 ? 1 : 0];
  if (song.name !== 'game') want[1] = want[2] = want[3] = 0;
  for (let i = 1; i < 4; i++) if (want[i] !== s.on[i]) s.L[i].gain.setTargetAtTime(want[i], t, 0.5);
  const now = [1, want[1] || s.on[1], want[2] || s.on[2], want[3] || s.on[3]]; s.on = want;
  if (!silent) {
    if (song.name === 'game') barGame(mx, s, t, loc, now);
    else if (song.name === 'menu') barMenu(mx, s, t, loc);
    else barRules(mx, s, t, loc);
  }
  s.bar++; if (s.bar >= song.bars) { s.bar = song.loopTo; s.loop++; }
  return barLen;
}

// ───────────────────────── efectos ─────────────────────────
function sfxAt(mx, name, arg, t, key) {
  const k = key || 0, d = mx.sfx, L = mx.sfxL, R = mx.sfxR, B = mx.B, S = i => SCALE_EB[Math.max(0, Math.min(SCALE_EB.length - 1, i))] + k;
  switch (name) {
    case 'pick': hit(mx, B.paper, L, t, 0.32, 1.2, ['bandpass', 2600, 0.8]); ep(mx, R, S(7), t + 0.012, 0.18, 0.35); break;
    case 'tick': hit(mx, B.rim, R, t, 0.07, 0.62, ['bandpass', 1500, 2]); break;
    case 'drop': {
      hit(mx, B.kick, d, t, 0.5, 1.35); hit(mx, B.tap, d, t, 0.32, 0.6, ['lowpass', 1100]);
      const v = arg || 0;
      if (v > 0) { vib(mx, R, S(4), t + 0.03, 0.14, 0.75); vib(mx, R, S(7), t + 0.1, 0.35, 0.8); }
      else if (v === 0) vib(mx, R, S(0), t + 0.03, 0.3, 0.6);
      else { ep(mx, L, S(2) + 1, t + 0.03, 0.12, 0.5); ep(mx, L, S(2), t + 0.13, 0.3, 0.45); }
      break;
    }
    case 'invalid': hit(mx, B.paper, d, t, 0.4, 0.55, ['lowpass', 900]); blip(mx, d, mtof(S(4)), mtof(S(-7 + 7) - 12), t + 0.01, 0.2, 0.09, 'triangle'); break;
    case 'pairPos': vib(mx, R, S(4 + Math.max(0, Math.min(8, arg || 2))), t, 0.35, 0.8); break;
    case 'pairNeg': bass(mx, L, S(0) - 24, t, 0.12, 0.9); hit(mx, B.tap, L, t, 0.1, 0.5, ['lowpass', 500]); break;
    case 'mult': hit(mx, B.kick, d, t, 0.4, 1.6); hit(mx, B.crumple, d, t, 0.18, 2.2, ['bandpass', 1400, 0.8]); vib(mx, R, S(7), t + 0.02, 0.4, 0.8); vib(mx, R, S(11), t + 0.06, 0.5, 0.7); break;
    case 'rotate': hit(mx, B.rim, d, t, 0.12, 1.9, ['highpass', 2500]); hit(mx, B.rim, d, t + 0.06, 0.1, 1.2, ['bandpass', 1800, 3]); blip(mx, d, 2100, 2500, t + 0.02, 0.05, 0.012); break;
    case 'undo': case 'redo': { const up = name === 'redo'; blip(mx, d, mtof(up ? S(4) : S(7)), mtof(up ? S(7) : S(4)), t, 0.09, 0.07); hit(mx, B.swish, d, t, 0.1, up ? 2.6 : 2.2, ['bandpass', up ? 3000 : 1800, 1]); break; }
    case 'goal': [S(7), S(9), S(11), S(13)].forEach((m, i) => vib(mx, R, m, t + i * 0.075, 0.6, 0.85)); break;
    case 'gold': [S(14), S(16), S(11) + 12, S(13) + 12].forEach((m, i) => vib(mx, R, m, t + i * 0.05, 0.7, 0.7)); for (let i = 0; i < 6; i++) hit(mx, B.chick, R, t + 0.05 + i * 0.045, 0.06, 1.6, ['highpass', 7000]); break;
    case 'full': voicing(C(k === 2 ? 'F.maj9' : k === 7 ? 'Bb.maj9' : 'Eb.maj9'), null, 58, 79).forEach((m, i) => ep(mx, L, m, t + i * 0.025, 1.3, 0.75)); break;
    case 'print': hit(mx, B.kick, d, t, 0.6, 0.8); hit(mx, B.rim, d, t, 0.25, 0.5, ['lowpass', 900]); blip(mx, d, 40, 120, t + 0.08, 0.6, 0.12, 'sawtooth'); hit(mx, B.swish, d, t + 0.1, 0.16, 0.7, ['bandpass', 900, 0.8]); break;
    case 'count': vib(mx, R, S(Math.min(14, arg || 0)), t, 0.18, 0.55); hit(mx, B.keys[(arg || 0) % 3], L, t, 0.12); break;
    case 'stampSold': hit(mx, B.kick, d, t, 0.8, 0.9); hit(mx, B.tap, d, t, 0.4, 0.5, ['lowpass', 800]);
      [S(0) - 12, S(4) - 12, S(7) - 12, S(9) - 12, S(1)].forEach((m, i) => ep(mx, L, m, t + 0.05 + i * 0.03, 1.3, 0.9));
      [S(4), S(7), S(9)].forEach((m, i) => vib(mx, R, m + 12, t + 0.22 + i * 0.09, 0.7, 0.8)); break;
    case 'stampGold': hit(mx, B.kick, d, t, 0.85, 0.85); hit(mx, B.tap, d, t, 0.4, 0.5, ['lowpass', 800]);
      [[0, 0, 0.18], [0.16, 2, 0.12], [0.26, 4, 0.5], [0.8, 7, 0.9]].forEach(([dt, ix, len]) => { brass(mx, L, S(ix) - 12, t + 0.05 + dt, len, 1.2); brass(mx, R, ix >= 2 ? S(ix - 2) - 12 : S(ix + 4) - 24, t + 0.05 + dt, len, 0.8); });
      [S(7) + 12, S(9) + 12, S(11) + 12, S(14) + 12].forEach((m, i) => vib(mx, R, m, t + 0.9 + i * 0.06, 0.6, 0.65));
      for (let i = 0; i < 10; i++) hit(mx, B.chick, i % 2 ? R : L, t + 0.85 + i * 0.05 + (i % 3) * 0.008, 0.07 - i * 0.004, 1.8 + (i % 3) * 0.2, ['highpass', 7500]); break;
    case 'stampRec': hit(mx, B.kick, d, t, 0.6, 0.7); bass(mx, L, S(0) - 24, t + 0.04, 0.6, 1); [S(0) - 12, S(2) - 13, S(4) - 12, S(7) - 12].forEach(m => ep(mx, L, m, t + 0.06, 0.45, 0.42)); hit(mx, B.crumple, d, t + 0.25, 0.35, 1, ['bandpass', 2200, 0.6]); break;
    case 'card': hit(mx, B.swish, d, t, 0.18, 3, ['bandpass', 2800, 0.8]); [S(0), S(3), S(4)].forEach((m, i) => vib(mx, R, m + 12, t + 0.02 + i * 0.025, 0.55, 0.45)); break;
    case 'cardOk': [S(0), S(2), S(4), S(6)].forEach((m, i) => vib(mx, R, m + 12, t + i * 0.05, 0.65, 0.7)); voicing(C(k === 2 ? 'F.maj9' : k === 7 ? 'Bb.maj9' : 'Eb.maj9'), null, 55, 76).forEach((m, i) => ep(mx, L, m, t + i * 0.01, 0.8, 0.5)); break;
    case 'record': [[0, S(4)], [0.12, S(6)], [0.24, S(8)], [0.36, S(9)], [0.6, S(11)]].forEach(([dt, m], i) => vib(mx, R, m, t + dt, i === 4 ? 0.9 : 0.25, 0.9)); break;
    case 'ui': hit(mx, B.rim, d, t, 0.06, 1.35, ['bandpass', 2600, 1.5]); break;
    case 'uiPri': hit(mx, B.rim, d, t, 0.06, 1.2, ['bandpass', 2300, 1.5]); ep(mx, R, S(7) + 12, t, 0.25, 0.4); break;
    case 'copied': vib(mx, R, S(11), t, 0.2, 0.6); vib(mx, R, S(14), t + 0.09, 0.3, 0.6); break;
    case 'type': hit(mx, B.keys[Math.floor(Math.random() * 3)], R, t, 0.16 + Math.random() * 0.05, 0.95 + Math.random() * 0.1); break;
  }
}

// ───────────────────────── motor en vivo ─────────────────────────
const AU = {
  ctx: null, ready: false, scene: 'none', prefs: { music: true, sfx: true, mv: 0.7, sv: 0.85, vibration: true },
  layers: { l2: 0, l3: 0, l4: 0 }, ducked: false, pressing: false, mx: null, sb: null, nextT: 0, timer: null, old: [], stats: { bars: 0, maxMs: 0 }
};
const LOOKAHEAD = 0.45;
function musicGain() { return AU.prefs.music ? 1.3 * Math.pow(AU.prefs.mv, 1.6) : 0; }
function sfxGain() { return AU.prefs.sfx ? 1.0 * Math.pow(AU.prefs.sv, 1.6) : 0; }
function applyPrefs() { if (!AU.mx) return; const t = AU.ctx.currentTime; AU.mx.music.gain.setTargetAtTime(musicGain(), t, 0.08); AU.mx.sfx.gain.setTargetAtTime(sfxGain(), t, 0.03); }
function tick() {
  const ctx = AU.ctx; if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (AU.nextT < now - 0.02) AU.nextT = now + 0.06; // volvimos de una suspensión: no recuperar compases viejos
  if (AU.pressing) pressTick(now);
  const s = AU.sb; if (!s) { AU.nextT = now + 0.1; return; }
  const t0 = performance.now();
  let guard = 0;
  while (AU.nextT < now + LOOKAHEAD && guard++ < 4) {
    const n0 = AU.dq.length;
    AU.nextT += scheduleBar(AU.dmx, s, AU.nextT, AU.layers, !AU.prefs.music); AU.stats.bars++;
    if (AU.dq.length > n0) AU.dq.sort((a, b) => a.t - b.t);
  }
  const tg = performance.now() - t0; AU.stats.genMax = Math.max(AU.stats.genMax || 0, tg); if (tg > 0.5) { const g = (AU.stats.gens = AU.stats.gens || []); g.push(+tg.toFixed(1)); if (g.length > 20) g.shift(); }
  // crear los nodos de lo que suena pronto (lo vencido por una suspensión se descarta)
  let i = 0; const q = AU.dq, lim = now + 0.22;
  while (i < q.length && q[i].t < lim) { const e = q[i++]; if (e.t >= now - 0.03) e.f.apply(null, e.a); }
  if (i) q.splice(0, i);
  const ms = performance.now() - t0; AU.stats.maxMs = Math.max(AU.stats.maxMs, ms); AU.stats.lastMs = ms;
}
// rotativa: ostinato a negras sobre el pulso del tema
function pressTick(now) {
  const mx = AU.mx, spb = 60 / (AU.sb ? AU.sb.song.bpm : 104), dst = mx.press, key = KEY_OF[AU.scene] || 0;
  while (AU.pressT < now + 0.3) {
    const t = AU.pressT;
    hit(mx, mx.B.kick, dst, t, 0.42, 0.95);
    hit(mx, mx.B.rim, dst, t + spb * 0.5, 0.12, 0.55, ['bandpass', 1700, 1.2]);
    hit(mx, mx.B.tap, dst, t, 0.12, 0.8, ['bandpass', 1800, 1.5]);
    if (AU.pressN % 2 === 1) hit(mx, mx.B.keys[AU.pressN % 3], dst, t + spb * 0.25, 0.1, 0.8);
    bass(mx, dst, 39 + key, t, spb * 0.4, 0.55);
    AU.pressT += spb; AU.pressN++;
  }
}
AU.init = function () {
  if (AU.ctx) { AU.resume(); return; }
  const AC = G.AudioContext || G.webkitAudioContext; if (!AC) return;
  try { AU.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { AU.ctx = new AC(); } catch (e2) { return; } }
  AU.mx = mixer(AU.ctx); AU.dq = []; AU.dmx = { dq: AU.dq, real: AU.mx, B: AU.mx.B, ctx: AU.ctx };
  try { const an = AU.ctx.createAnalyser(); an.fftSize = 2048; AU.mx.out.connect(an); AU.an = an; } catch (e) { }
  try { const s = AU.ctx.createBufferSource(); s.buffer = AU.mx.B.silent; s.connect(AU.ctx.destination); s.start(0); } catch (e) { } // desbloqueo de iOS
  applyPrefs(); AU.duck(AU.ducked);
  AU.nextT = AU.ctx.currentTime + 0.1;
  AU.timer = setInterval(tick, 25);
  // En pantallas táctiles el navegador solo habilita el audio al levantar el dedo (pointerup/touchend/click),
  // no en pointerdown: se reintenta en esos eventos hasta que el contexto corre.
  const kick = () => { if (AU.ctx && AU.ctx.state !== 'running' && !document.hidden) AU.ctx.resume().catch(() => { }); };
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => G.addEventListener(ev, kick, true));
  if (AU.ctx.state !== 'running' && !document.hidden) AU.ctx.resume().catch(() => { });
  AU.ready = true;
};
AU.setPrefs = function (p) { Object.assign(AU.prefs, p); applyPrefs(); };
AU.setScene = function (name) {
  if (name === AU.scene && AU.sb) return;
  if (AU.pressing) AU.press(false);
  AU.scene = name;
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime;
  if (AU.sb) { const old = AU.sb; old.g.gain.setTargetAtTime(0.0001, t, 0.22); dropBus(old, t + 2.5); setTimeout(() => { try { old.g.disconnect(); } catch (e) { } }, 3000); }
  AU.dq.length = 0; // lo pendiente del tema anterior ya no se crea (se está desvaneciendo)
  AU.sb = SONGS[name] ? sceneBus(AU.mx, name) : null;
  if (AU.sb) { AU.sb.g.gain.setValueAtTime(0.0001, t); AU.sb.g.gain.setTargetAtTime(AU.sb.lvl, t + 0.05, 0.08); }
  AU.nextT = t + 0.12;
};
AU.setLayers = function (o) { Object.assign(AU.layers, o); };
AU.duck = function (on) {
  AU.ducked = !!on; if (!AU.mx) return; const t = AU.ctx.currentTime;
  AU.mx.duckF.frequency.setTargetAtTime(on ? 600 : 20000, t, on ? 0.12 : 0.25);
  AU.mx.duckG.gain.setTargetAtTime(on ? 0.5 : 1, t, 0.12);
};
AU.press = function (on) {
  on = !!on; if (on === AU.pressing && AU.mx) return; AU.pressing = on;
  if (!AU.mx) return; const t = AU.ctx.currentTime, mx = AU.mx, key = KEY_OF[AU.scene] || 0;
  if (AU.sb) AU.sb.g.gain.setTargetAtTime(AU.sb.lvl * (on ? 0.355 : 1), t, on ? 0.08 : 0.35);
  if (on) {
    // alinear el ostinato con el próximo pulso del tema
    const spb = 60 / (AU.sb ? AU.sb.song.bpm : 104); let pt = AU.nextT; while (pt - spb > t + 0.04) pt -= spb; AU.pressT = Math.max(t + 0.04, pt); AU.pressN = 0;
    const n = mx.ctx.createBufferSource(); n.buffer = mx.B.swish; n.loop = true; n.playbackRate.value = 0.5;
    const bp = mx.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.setValueAtTime(380, t); bp.frequency.linearRampToValueAtTime(1500, t + 2.6);
    const o = mx.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(mtof(27 + key) * 0.8, t); o.frequency.linearRampToValueAtTime(mtof(27 + key), t + 0.6);
    const lp = mx.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
    const g = mx.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + 0.4);
    n.connect(bp); bp.connect(g); o.connect(lp); lp.connect(g); g.connect(mx.press); n.start(t); o.start(t);
    AU.whirr = { n, o, g };
  } else if (AU.whirr) { const w = AU.whirr; w.g.gain.setTargetAtTime(0.0001, t, 0.06); try { w.n.stop(t + 0.5); w.o.stop(t + 0.5); } catch (e) { } AU.whirr = null; }
};
AU.suspend = function () { if (AU.ctx && AU.ctx.state === 'running') AU.ctx.suspend().catch(() => { }); };
AU.resume = function () { if (AU.ctx && AU.ctx.state !== 'running' && !document.hidden) AU.ctx.resume().catch(() => { }); };
let lastTickT = 0;
AU.sfx = function (name, arg) {
  const ctx = AU.ctx; if (!ctx || !AU.prefs.sfx || ctx.state !== 'running') return;
  const t = ctx.currentTime + 0.004;
  if (name === 'tick') { if (t - lastTickT < 0.04) return; lastTickT = t; }
  sfxAt(AU.mx, name, arg, t, KEY_OF[AU.scene] || 0);
};
AU.vibe = function (pattern) { try { if (AU.prefs.vibration !== false && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { } };
/** Pico de salida (0-1) de los últimos ~46 ms. Para pruebas. */
AU.peak = function () { if (!AU.an) return 0; const a = new Float32Array(AU.an.fftSize); AU.an.getFloatTimeDomainData(a); let p = 0; for (let i = 0; i < a.length; i++) p = Math.max(p, Math.abs(a[i])); return p; };
AU.state = function () { return { ctx: AU.ctx ? AU.ctx.state : 'none', scene: AU.scene, bar: AU.sb ? AU.sb.bar : -1, loop: AU.sb ? AU.sb.loop : -1, layers: Object.assign({}, AU.layers), ducked: AU.ducked, pressing: AU.pressing, prefs: Object.assign({}, AU.prefs), stats: Object.assign({}, AU.stats) }; };

// ───────────────────────── exportación (muestra WAV) ─────────────────────────
function toWav(buf) {
  const n = buf.length, sr = buf.sampleRate, out = new DataView(new ArrayBuffer(44 + n * 4));
  const W = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  W(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); W(8, 'WAVE'); W(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, sr, true); out.setUint32(28, sr * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); W(36, 'data'); out.setUint32(40, n * 4, true);
  const a = buf.getChannelData(0), b = buf.getChannelData(1);
  for (let i = 0; i < n; i++) { out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, a[i])) * 32767, true); out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, b[i])) * 32767, true); }
  return out.buffer;
}
/** Renderiza una escena sin interfaz. `plan`: [{t, layers}|{t, sfx, arg}|{t, press:true|false}]. Devuelve {wav, buffer}. */
AU.render = async function (scene, seconds, opts) {
  opts = opts || {}; const sr = opts.sr || 44100, OAC = G.OfflineAudioContext || G.webkitOfflineAudioContext;
  const ctx = new OAC(2, Math.floor(sr * seconds), sr), mx = mixer(ctx);
  mx.music.gain.value = 1.3 * Math.pow(opts.mv != null ? opts.mv : 0.7, 1.6); mx.sfx.gain.value = Math.pow(opts.sv != null ? opts.sv : 0.85, 1.6);
  const s = sceneBus(mx, scene); s.bar = opts.bar || 0; s.loop = opts.loop || 0;
  const key = KEY_OF[scene] || 0, barLen = 240 / s.song.bpm, q = 128 / sr;
  let layers = Object.assign({ l2: 0, l3: 0, l4: 0 }, opts.layers || {});
  // Igual que en vivo: cada compás y cada efecto se programan poco antes de sonar (suspend/resume),
  // así la medición de carga es realista y no hay miles de nodos vivos desde el segundo cero.
  const ev = [];
  for (let t = 0.05; t < seconds; t += barLen) ev.push({ at: t - LOOKAHEAD, t, bar: true });
  (opts.plan || []).forEach(p => ev.push(Object.assign({ at: p.t - (p.layers ? LOOKAHEAD + 0.01 : 0.1) }, p)));
  ev.sort((a, b) => a.at - b.at);
  const run = e => {
    if (e.layers) layers = Object.assign({}, layers, e.layers);
    if (e.bar) scheduleBar(mx, s, e.t, layers);
    if (e.sfx) sfxAt(mx, e.sfx, e.arg, e.t, key);
    if (e.press === true) { s.g.gain.setTargetAtTime(s.lvl * 0.355, e.t, 0.08); const spb = 60 / s.song.bpm; for (let k = e.t; k < e.until; k += spb) { hit(mx, mx.B.kick, mx.press, k, 0.42, 0.95); hit(mx, mx.B.rim, mx.press, k + spb / 2, 0.12, 0.55); bass(mx, mx.press, 39 + key, k, spb * 0.4, 0.55); } }
    if (e.press === false) s.g.gain.setTargetAtTime(s.lvl, e.t, 0.35);
  };
  const groups = new Map();
  ev.forEach(e => { const at = Math.max(0, Math.ceil(e.at / q) * q); const k = at <= 0 ? 0 : at.toFixed(6); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); });
  groups.forEach((list, k) => { if (k === 0) list.forEach(run); else ctx.suspend(+k).then(() => { list.forEach(run); ctx.resume(); }); });
  const buffer = await ctx.startRendering();
  return { wav: toWav(buffer), buffer };
};
AU.renderWav = async function (scene, seconds, layers) { return (await AU.render(scene, seconds, { layers: layers || { l2: 1, l3: 1, l4: 0 } })).wav; };
AU.totalSeconds = function (scene) { const s = SONGS[scene]; return s ? s.bars * 240 / s.bpm : 0; };
AU._songs = SONGS;
G.PortadaAudio = AU;
})(typeof window !== 'undefined' ? window : globalThis);
