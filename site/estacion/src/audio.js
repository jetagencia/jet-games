// JET//Estación Silencio · audio (v2, banda sonora definitiva). Todo sintetizado con Web Audio: sin samples ni melodías ajenas.
// Composición original por temas (partituras escritas abajo, en THEMES), 5 capas por tema que se suman al reparar,
// lecho continuo por tema, ambiente de sala por módulo con eventos, efectos afinados a la tonalidad del módulo,
// murmullo de grabaciones y el leitmotiv «el tarareo» (Re4–La4–Do5–Si4).
// Mezcla: música −7 dB, ambiente −10 dB respecto de efectos → compresor (−12 dB, 4:1) → limitador (−1,5 dBFS) → recorte suave.
'use strict';
const AU = (() => {
  const CO = window.CORE, P = CO.P;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const acc = (s) => (s === '#' ? 1 : s === 'b' ? -1 : 0);
  function nm(s) { const m = /^([A-G])([#b]?)(\d)$/.exec(s); if (!m) throw new Error('nota ' + s); return 12 * (+m[3] + 1) + PC[m[1]] + acc(m[2]); }
  const pcOf = (s) => ((PC[s[0]] + acc(s[1] || '')) % 12 + 12) % 12;

  // ======================= partituras =======================
  // Melodía: «Nota:tiempos» separadas por espacios; «r» es silencio; «|» solo ayuda a leer los compases.
  // Acordes: un símbolo por compás (o varios separados por espacio, que se reparten el compás) separados por «|».
  const QUAL = { '': [0, 4, 7], m: [0, 3, 7], '5': [0, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], m9: [0, 3, 7, 10, 14], maj9: [0, 4, 7, 11, 14], add9: [0, 4, 7, 14], sus2: [0, 2, 7], sus4: [0, 5, 7], '7sus4': [0, 5, 7, 10], m7b5: [0, 3, 6, 10], '6': [0, 4, 7, 9], m6: [0, 3, 7, 9], '9': [0, 4, 7, 10, 14], 'maj7#11': [0, 4, 7, 11, 18], '7b9': [0, 4, 7, 10, 13] };
  function parseChord(s) {
    const [c, b] = s.split('/'); const m = /^([A-G][#b]?)(.*)$/.exec(c); if (!m || !QUAL[m[2]]) throw new Error('acorde ' + s);
    const root = pcOf(m[1]); return { name: s, root, iv: QUAL[m[2]], bass: b ? pcOf(b) : root, minor: QUAL[m[2]].includes(3) && !QUAL[m[2]].includes(4) };
  }
  function parseMel(str) { let t = 0; const out = []; for (const tok of str.split(/[\s|]+/).filter(Boolean)) { const [n, d] = tok.split(':'); const dur = +d; if (!(dur > 0)) throw new Error('duración ' + tok); if (n !== 'r') out.push({ t, d: dur, m: nm(n) }); t += dur; } out.beats = t; return out; }

  const MIN = [0, 2, 3, 5, 7, 8, 10], DOR = [0, 2, 3, 5, 7, 9, 10], PHR = [0, 1, 3, 5, 7, 8, 10], LYD = [0, 2, 4, 6, 7, 9, 11], MAJ = [0, 2, 4, 5, 7, 9, 11];
  // Material del menú (Re menor eólico), compartido por Menú, Prólogo y Anillo con arreglos distintos.
  const MENU_S = {
    in: { bars: 8, ch: 'Dm9 | Dm9 | Bbmaj7 | Bbmaj7 | Gm9 | Gm9 | Asus4 | Am7', mel: 'r:4 | r:2 A5:2 | F5:4 | r:4 | r:2 D5:1 E5:1 | F5:4 | E5:4 | r:4' },
    A: { bars: 16, ch: 'Dm | Dm/C | Bbmaj7 | Bbmaj7 | F | F/E | C | Csus4 C | Dm | Dm/C | Gm7 | Gm7 | Bbmaj7 | Bb6 | Asus4 | Am', mel: 'D5:3 E5:1 | F5:4 | D5:2 C5:2 | Bb4:4 | A4:3 C5:1 | F5:3 E5:1 | E5:4 | r:4 | D5:3 E5:1 | F5:2 G5:2 | A5:3 G5:1 | F5:2 D5:2 | F5:2 D5:1 C5:1 | D5:4 | E5:4 | r:4' },
    A2: { like: 'A', oct: 12, lead: 'glass' },
    B: { bars: 16, ch: 'Dm | G | Bbmaj7 | C | Dm | G | Fmaj7 | C | Bbmaj7 | C | Dm | Am7 | Gm9 | Bbmaj7 | Asus4 | A', mel: 'D5:1 A5:1 C6:3 B5:3 | r:2 A5:1 G5:1 | E5:4 | D5:1 A5:1 C6:3 B5:3 | r:2 C6:1 A5:1 | G5:4 | D5:2 F5:2 | E5:4 | D5:2 A4:2 | C5:4 | Bb4:2 D5:2 | F5:2 D5:2 | E5:4 | r:4' },
    br: { bars: 8, ch: 'Bbmaj7 | Bbmaj7 | Gm9 | Gm9 | Fmaj7 | Fmaj7 | Asus4 | Asus4', mel: 'r:4 | A5:4 | r:4 | G5:2 F5:2 | r:4 | E5:4 | r:4 | r:4', only: [0, 1, 4] },
    sil: { bars: 4, ch: 'Dm | Dm | Dm | Dm', sil: true },
    V: { like: 'A', var: 'orn' },
  };
  const THEMES = {
    menu: { bpm: 60, meter: 4, root: 62, scale: MIN, space: 'room', bed: 'breath', S: MENU_S, form: ['in', 'A', 'A2', 'B', 'br', 'sil', 'V'], loop: 1,
      arr: { pad: 'saw', bass: 'sub', lead: 'bell', perc: 'heart', l3: 'guide', l4: 'shimmer' }, send: [.35, .55, .2, .4, .6], trim: 1 },
    prologo: { bpm: 60, meter: 4, root: 62, scale: MIN, space: 'room', bed: 'breath', S: MENU_S, form: ['in', 'sil', 'A', 'br', 'sil', 'B', 'sil', 'V'], loop: 1, dark: 1,
      arr: { pad: 'saw', bass: 'sub', lead: 'glass', perc: 'heart', l3: 'guide', l4: 'shimmer' }, send: [.35, .6, .2, .4, .6], trim: 1 },
    hub: { bpm: 56, meter: 4, root: 62, scale: MIN, space: 'hall', bed: 'void', S: MENU_S, form: ['A', 'B', 'br', 'sil', 'V', 'A2', 'sil'], loop: 0, ring: 1,
      arr: { pad: 'saw', bass: 'sub', lead: 'bell', perc: 'shimmer', l3: 'guide', l4: 'aurora' }, send: [.4, .55, .5, .4, .5], trim: 1.05 },
    oxigeno: { bpm: 72, meter: 4, root: 65, scale: LYD, space: 'room', bed: 'air', form: ['A', 'A2', 'B', 'A3', 'sil'], loop: 0,
      S: {
        A: { bars: 8, ch: 'Fmaj7 | G/F | Fmaj7 | G/F | Am7 | G | Em7 | Fmaj7#11', mel: 'C5:1 F5:1 G5:1 A5:1 | B5:2 A5:1 G5:1 | E5:2 C5:1 E5:1 | D5:3 r:1 | E5:1 G5:1 C6:2 | B5:1 A5:1 G5:2 | E5:1 G5:1 B5:2 | A5:3 r:1' },
        A2: { like: 'A', mel: 'C5:1 F5:1 G5:1 A5:1 | B5:2 C6:1 D6:1 | E6:2 C6:1 A5:1 | B5:3 r:1 | E5:1 G5:1 C6:2 | D6:1 C6:1 B5:2 | G5:1 B5:1 E6:2 | C6:2 A5:1 F5:1', arp: 1 },
        B: { bars: 8, ch: 'F | Bbmaj7 | Am7 | Dm7 | F | Bbmaj7 | Em7 | G', mel: 'F5:1 C6:1 Eb6:3 D6:3 | r:2 C6:1 A5:1 | F5:4 | A5:1 C6:1 F6:2 | D6:2 F6:2 | r:1 B5:1 G5:1 E5:1 | D5:4', arp: 2 },
        A3: { like: 'A', var: 'orn', arp: 3 },
        sil: { bars: 4, ch: 'Fmaj7 | Fmaj7 | G/F | G/F', sil: true },
      }, arr: { pad: 'air', bass: 'marim', lead: 'marimba', perc: 'shaker', l3: 'arpMar', l4: 'bubbles' }, send: [.3, .3, .15, .3, .5], trim: 1.3 },
    energia: { bpm: 96, meter: 4, root: 64, scale: PHR, space: 'room', bed: 'hum', form: ['in', 'A', 'B', 'A', 'br', 'B2', 'sil'], loop: 1,
      S: {
        in: { bars: 4, ch: 'E5 | E5 | F/E | E5', mel: 'r:16', only: [0, 2] },
        A: { bars: 8, ch: 'Em | F | Em | Dm | Em | F | G | F', mel: 'E5:0.5 r:0.5 E5:0.5 F5:0.5 G5:1 B5:1 | A5:1.5 G5:0.5 F5:2 | E5:0.5 r:0.5 E5:0.5 F5:0.5 G5:1 B5:1 | C6:1.5 B5:0.5 A5:2 | B5:1 G5:1 E5:1 G5:1 | A5:1 F5:1 C5:2 | D5:1 G5:1 B5:1 D6:1 | C6:3 r:1' },
        B: { bars: 8, ch: 'Em | A | C | D | Em | A | F | E', mel: 'E5:1 B5:1 D6:3 C#6:3 | r:1 G5:1 C6:1 E6:1 | D6:2 A5:2 | E5:1 B5:1 D6:3 C#6:3 | r:2 A5:1 C6:1 | B5:1 G#5:1 E5:2', arp: 1 },
        br: { bars: 4, ch: 'Em | Em | F | F', mel: 'r:16', only: [0, 2] },
        B2: { like: 'B', mel: 'E6:1 B5:1 G5:1 E5:1 | C#6:2 E6:2 | C6:1 G5:1 E5:1 G5:1 | F#5:2 A5:2 | E5:1 B5:1 D6:3 C#6:3 | r:2 A5:1 C6:1 | B5:2 G#5:1 B5:1', arp: 2 },
        sil: { bars: 4, ch: 'E5 | E5 | E5 | E5', sil: true },
      }, arr: { pad: 'power', bass: 'pulse8', lead: 'square', perc: 'relay', l3: 'arpSq', l4: 'bellHi' }, send: [.15, .25, .12, .2, .5], dly: [0, .12, 0, .15, .2], trim: 1.65 },
    comunicaciones: { bpm: 84, meter: 4, root: 57, scale: DOR, space: 'room', bed: 'static', form: ['A', 'B', 'A2', 'C', 'B2', 'sil'], loop: 0,
      S: {
        A: { bars: 8, ch: 'Am7 | D9 | Am7 | D9 | Fmaj7 | G | Em7 | Am7', mel: 'E5:1.5 A5:0.5 G5:1 E5:1 | F#5:2 D5:1 E5:1 | C5:1.5 E5:0.5 A5:1 B5:1 | C6:2 B5:1 A5:1 | A5:1 G5:1 F5:1 E5:1 | D5:2 B4:2 | E5:1 G5:1 B5:1 D6:1 | C6:3 r:1' },
        B: { bars: 8, ch: 'Am | D | Fmaj7 | G | Am | D | Fmaj7 | Esus4 E', mel: 'A4:1 E5:1 G5:3 F#5:3 | r:2 E5:1 C5:1 | D5:2 B4:2 | A5:1 G5:1 E5:2 | F#5:2 A5:2 | C6:2 A5:1 F5:1 | E5:4', arp: 1 },
        A2: { like: 'A', var: 'orn', arp: 2 },
        C: { bars: 4, ch: 'Am7 | D9 | Fmaj7 | Esus4', mel: 'A4:0.5 C5:0.5 E5:0.5 G5:0.5 A5:2 | F#5:0.5 A5:0.5 C6:0.5 E6:0.5 D6:2 | C6:0.5 A5:0.5 F5:0.5 E5:0.5 C5:2 | B4:1 E5:1 A5:2', only: [1] },
        B2: { like: 'B', var: 'orn', arp: 2 },
        sil: { bars: 4, ch: 'Am | Am | Am | Am', sil: true },
      }, arr: { pad: 'warm', bass: 'round', lead: 'lyre', perc: 'radar', l3: 'arpKS', l4: 'aurora' }, send: [.25, .35, .3, .3, .5], dly: [0, .22, .5, .15, .1], trim: 1.4 },
    navegacion: { bpm: 66, meter: 4, root: 60, scale: LYD, space: 'hall', bed: 'void', form: ['A', 'A2', 'B', 'br', 'sil', 'A3'], loop: 0,
      S: {
        A: { bars: 8, ch: 'Cmaj7 | D/C | Cmaj7 | D/C | Em7 | D | Am7 | Bm7', mel: 'G5:2 B5:2 | A5:3 F#5:1 | E5:2 G5:2 | F#5:4 | G5:1 B5:1 D6:2 | D6:2 A5:2 | C6:3 B5:1 | A5:4' },
        A2: { like: 'A', oct: 12, lead: 'bell', arp: 1 },
        B: { bars: 8, ch: 'C | Fmaj7 | Em7 | Am7 | C | Fmaj7 | G6 | D/F#', mel: 'C5:1 G5:1 Bb5:3 A5:3 | r:2 B5:1 G5:1 | E5:4 | r:1 C5:1 E5:1 G5:1 | A5:2 E6:2 | D6:2 B5:2 | A5:4' },
        br: { bars: 4, ch: 'Am7 | Bm7 | Cmaj7 | D/C', mel: 'r:16', only: [0, 3] },
        sil: { bars: 4, ch: 'Cmaj7 | Cmaj7 | Cmaj7 | Cmaj7', sil: true },
        A3: { like: 'A', var: 'orn', arp: 2 },
      }, arr: { pad: 'organ', bass: 'sub', lead: 'glass', perc: 'ascend', l3: 'bellsLong', l4: 'stars' }, send: [.45, .6, .5, .7, .7], dly: [0, .15, .2, .1, .4], trim: 1.1 },
    archivo: { bpm: 76, meter: 4, root: 55, scale: MIN, space: 'room', bed: 'tape', form: ['A', 'B', 'A2', 'B2', 'coda', 'sil'], loop: 0, swing: 1,
      S: {
        A: { bars: 8, ch: 'Gm9 | Cm9 | F9 | Bbmaj7 | Ebmaj7 | Am7b5 | D7b9 | Gm9', mel: 'D5:1.5 F5:0.5 A5:1 Bb5:1 | G5:2 Eb5:1 D5:1 | C5:1.5 Eb5:0.5 G5:1 A5:1 | F5:3 r:1 | G5:1 Bb5:1 D6:1 F5:1 | Eb5:2 C5:1 A4:1 | F#5:1.5 A5:0.5 C6:1 Eb6:1 | D6:3 r:1' },
        B: { bars: 8, ch: 'Gm | C | Ebmaj7 | D7 | Gm | C | Ebmaj7 | D7sus4 D7', mel: 'G4:1 D5:1 F5:3 E5:3 | r:2 D5:1 Bb4:1 | A4:4 | G5:1 Bb5:1 D6:2 | E6:2 C6:2 | r:1 G5:1 F5:1 D5:1 | C5:2 A4:2' },
        A2: { like: 'A', var: 'orn' },
        B2: { like: 'B', mel: 'Bb5:1 A5:1 G5:1 D5:1 | E5:2 G5:2 | Bb5:2 G5:1 Eb5:1 | F#5:2 A5:2 | G4:1 D5:1 F5:3 E5:3 | r:2 Bb5:1 G5:1 | A5:4' },
        coda: { bars: 4, ch: 'Ebmaj7 | Am7b5 | D7b9 | Gm9', mel: 'G5:2 F5:1 Eb5:1 | C5:2 A4:2 | F#4:2 A4:1 C5:1 | D5:4' },
        sil: { bars: 4, ch: 'Gm9 | Gm9 | Gm9 | Gm9', sil: true },
      }, arr: { pad: 'warm', bass: 'pizz', lead: 'epiano', perc: 'brush', l3: 'comp', l4: 'vibes' }, send: [.25, .3, .2, .25, .4], trim: 1.35 },
    tripulacion: { bpm: 58, meter: 3, root: 59, scale: MIN, space: 'room', bed: 'void', form: ['in', 'A', 'B', 'A2', 'B2', 'coda', 'sil'], loop: 1,
      S: {
        in: { bars: 4, ch: 'Bm | Bm | G | G', mel: 'r:12', only: [0, 3] },
        A: { bars: 8, ch: 'Bm | G | D | A | Bm | Em | G | F#', mel: 'F#5:2 E5:1 | D5:3 | F#5:2 A5:1 | E5:3 | D5:1 F#5:1 B5:1 | B5:2 G5:1 | F#5:2 D5:1 | C#5:3' },
        B: { bars: 8, ch: 'Bm | E | E | G | D | A | Em | F#', mel: 'B4:1 F#5:1 A5:3 G#5:4 | B5:2 G5:1 | F#5:2 D5:1 | E5:2 C#5:1 | B4:2 G5:1 | F#5:3' },
        A2: { like: 'A', var: 'orn' },
        B2: { like: 'B', climax: 1 },
        coda: { bars: 4, ch: 'G | Em | F# | Bm', mel: 'D5:3 | B4:3 | A#4:3 | B4:3' },
        sil: { bars: 4, ch: 'Bm | Bm | Bm | Bm', sil: true },
      }, arr: { pad: 'super', bass: 'sub', lead: 'cello', perc: 'waltz', l3: 'choir', l4: 'strHi' }, send: [.35, .4, .25, .5, .5], trim: 1 },
    observatorio: { bpm: 70, meter: 4, root: 62, scale: MIN, space: 'hall', bed: 'stars', form: ['A', 'B', 'A2', 'sil', 'B2'], loop: 0, minLayers: 4,
      S: {
        A: { bars: 8, ch: 'Dm | Bbmaj7 | Fmaj7 | C | Dm | Gm9 | Bbmaj7 | Asus4 A', mel: 'A5:2 D6:2 | C6:1 A5:1 F5:2 | A5:3 G5:1 | E5:4 | F5:1 A5:1 D6:2 | Bb5:2 A5:1 G5:1 | F5:2 D5:2 | E5:2 C#5:2', lead: 'bell' },
        B: { bars: 8, ch: 'Dm | G | Bbmaj7 | C | Dm | G | Bbmaj7 | Asus4 A', mel: 'D5:1 A5:1 C6:3 B5:3 | r:2 A5:1 F5:1 | E5:2 G5:2 | D5:1 A5:1 C6:3 B5:3 | r:2 D6:1 F6:1 | E6:2 C#6:2', lead: 'lyre' },
        A2: { like: 'A', var: 'orn', lead: 'glass', arp: 1 },
        sil: { bars: 4, ch: 'Dm | Dm | Dm | Dm', sil: true },
        B2: { like: 'B', lead: 'epiano', arp: 2 },
      }, arr: { pad: 'saw', bass: 'sub', lead: 'bell', perc: 'arpMar', l3: 'choir', l4: 'stars' }, send: [.4, .5, .3, .5, .6], dly: [0, .12, .1, 0, .35], trim: .95 },
    final: { bpm: 70, meter: 4, root: 62, scale: MAJ, space: 'hall', bed: 'stars', form: ['in', 'A', 'B', 'A2', 'coda', 'sil'], loop: 1,
      S: {
        in: { bars: 4, ch: 'D | D | Gmaj7 | Gmaj7', mel: 'r:16', only: [0] },
        A: { bars: 8, ch: 'D | A/C# | Bm7 | Gmaj7 | D/F# | Em7 | Gmaj7 | Asus4 A', mel: 'F#5:2 A5:2 | E5:3 C#5:1 | D5:2 F#5:2 | B5:4 | A5:1 F#5:1 D5:2 | G5:2 E5:2 | F#5:3 E5:1 | E5:4', lead: 'glass' },
        B: { bars: 8, ch: 'D | G | Bm | A | D | G | Em7 | A', mel: 'D5:1 A5:1 C#6:3 B5:3 | r:2 F#5:1 D5:1 | E5:2 C#5:2 | D5:1 A5:1 C#6:3 B5:3 | r:1 B5:1 A5:1 G5:1 | E5:4', lead: 'lyre' },
        A2: { like: 'A', oct: 12, lead: 'bell', climax: 1, arp: 1 },
        coda: { bars: 8, ch: 'G | D/F# | Em7 | A | Bm | G | Asus4 | D', mel: 'B5:4 | A5:4 | G5:2 F#5:2 | E5:4 | F#5:2 D5:2 | B4:4 | E5:4 | D5:4', lead: 'cello' },
        sil: { bars: 4, ch: 'D | D | D | D', sil: true },
      }, arr: { pad: 'super', bass: 'sub', lead: 'glass', perc: 'arpMar', l3: 'choir', l4: 'shimmer' }, send: [.4, .5, .3, .5, .6], dly: [0, .1, .1, 0, .3], trim: .95 },
  };
  function compile(th) {
    if (th._c) return th._c;
    const secs = {};
    for (const [k, s0] of Object.entries(th.S)) {
      const src = s0.like ? th.S[s0.like] : {}; const s = Object.assign({}, src, s0); delete s.like;
      const bars = s.bars, chBars = s.ch.split('|').map(x => x.trim()).filter(Boolean);
      if (chBars.length !== bars) throw new Error(`${k}: ${chBars.length} compases de acordes, se esperaban ${bars}`);
      const chords = []; chBars.forEach((bar, i) => { const cs = bar.split(/\s+/).map(parseChord); const d = th.meter / cs.length; cs.forEach((c, j) => chords.push({ c, t: i * th.meter + j * d, d })); });
      const runs = []; for (const x of chords) { const L = runs[runs.length - 1]; if (L && L.c.name === x.c.name) L.d += x.d; else runs.push(Object.assign({}, x)); }
      const mel = s.mel ? parseMel(s.mel) : []; if (s.mel && mel.beats !== bars * th.meter) throw new Error(`${k}: la melodía suma ${mel.beats} tiempos, se esperaban ${bars * th.meter}`);
      secs[k] = Object.assign(s, { chords, runs, mel });
    }
    th.form.forEach(f => { if (!secs[f]) throw new Error('sección ' + f); });
    const bars = th.form.reduce((a, f) => a + secs[f].bars, 0);
    return (th._c = { secs, bars, seconds: bars * th.meter * 60 / th.bpm, loopSeconds: th.form.slice(th.loop).reduce((a, f) => a + secs[f].bars, 0) * th.meter * 60 / th.bpm });
  }

  // ======================= motor (vale para tiempo real y para render sin conexión) =======================
  // Calidad liviana para equipos modestos (teléfonos de gama media/baja): reverbs más cortas y menos voces por nota.
  const LITE = (() => { try { const q = new URLSearchParams(location.search).get('audio'); if (q === 'lite') return true; if (q === 'full') return false; const mob = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)); return mob && (navigator.hardwareConcurrency || 4) <= 6 || (navigator.hardwareConcurrency || 4) <= 2; } catch (e) { return false; } })();
  function makeEngine(c) {
    const E = { c, vt: null }; const sr = c.sampleRate;
    E.now = () => (E.vt != null ? E.vt : c.currentTime);
    const rnd = Math.random;
    // ---- buffers de ruido ----
    const white = c.createBuffer(1, sr * 2, sr); { const d = white.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; }
    const pink = c.createBuffer(1, sr * 4, sr); { const d = pink.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; for (let i = 0; i < d.length; i++) { const w = rnd() * 2 - 1; b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; } }
    const brown = c.createBuffer(1, sr * 4, sr); { const d = brown.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + .02 * (rnd() * 2 - 1)) / 1.02; d[i] = l * 3.5; } }
    const crackle = c.createBuffer(1, sr * 3, sr); { const d = crackle.getChannelData(0); for (let i = 0; i < d.length; i++) { d[i] = (rnd() * 2 - 1) * .015; if (rnd() < 18 / sr) { const a = (rnd() * .7 + .3) * (rnd() < .5 ? -1 : 1); for (let k = 0; k < 40 && i + k < d.length; k++) d[i + k] += a * Math.exp(-k / 6) * (k % 2 ? -1 : 1); } } }
    E.buf = { white, pink, brown, crackle };
    function impulse(sec, pre, bright) {
      const n = Math.floor(sr * sec), b = c.createBuffer(2, n, sr), p0 = Math.floor(sr * pre);
      for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let y = 0; for (let i = p0; i < n; i++) { const x = (i - p0) / (n - p0); const a = bright * (1 - x) + .04; y += a * ((rnd() * 2 - 1) - y); d[i] = y * Math.pow(1 - x, 2.2) * (i - p0 < sr * .004 ? (i - p0) / (sr * .004) : 1); } }
      let e = 0; for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) e += d[i] * d[i]; } const k = 1 / Math.sqrt(e / 2 + 1e-9) * .9; for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] *= k; }
      return b;
    }
    // ---- grafo de mezcla ----
    const G = (v = 1) => { const g = c.createGain(); g.gain.value = v; return g; };
    E.G = G;
    E.mix = G(1);
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4; comp.knee.value = 6; comp.attack.value = .008; comp.release.value = .25;
    const lim = c.createDynamicsCompressor(); lim.threshold.value = -1.5; lim.ratio.value = 20; lim.knee.value = 0; lim.attack.value = .001; lim.release.value = .12;
    const clip = c.createWaveShaper(); { const n = 2049, cv = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1, ax = Math.abs(x); cv[i] = Math.sign(x) * (ax < .8 ? ax : .8 + .18 * Math.tanh((ax - .8) / .18)); } clip.curve = cv; }
    E.out = G(1); const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 25; hp.Q.value = .6; E.mix.connect(hp); hp.connect(comp); comp.connect(lim); lim.connect(clip); clip.connect(E.out); E.out.connect(c.destination);
    E.meter = c.createAnalyser(); E.meter.fftSize = 2048; E.out.connect(E.meter);
    E.music = G(.45); E.mFilt = c.createBiquadFilter(); E.mFilt.type = 'lowpass'; E.mFilt.frequency.value = 20000; E.mFilt.Q.value = .5; E.mDuck = G(1);
    E.music.connect(E.mFilt); E.mFilt.connect(E.mDuck); E.mDuck.connect(E.mix);
    E.sfx = G(1); E.sfx.connect(E.mix); E.amb = G(.32); E.amb.connect(E.mix);
    E.rv = { room: c.createConvolver(), hall: c.createConvolver(), fx: c.createConvolver() };
    const irk = window.AU_IR != null ? window.AU_IR : (LITE ? .6 : 1);
    E.rv.room.buffer = impulse(2.6 * irk, .018, .55); E.rv.hall.buffer = impulse(6 * irk, .03, .4); E.rv.fx.buffer = impulse(1.7 * irk, .01, .6);
    E.rv.room.connect(E.music); E.rv.hall.connect(E.music);
    const fxSend = G(.2), ambSend = G(.45); E.sfx.connect(fxSend); E.amb.connect(ambSend); fxSend.connect(E.rv.fx); ambSend.connect(E.rv.fx); E.rv.fx.connect(E.mix);
    // eco ping-pong (música)
    E.pp = G(1); { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800; const dL = c.createDelay(2), dR = c.createDelay(2), fL = G(.45), fR = G(.45); E.pp.connect(lp); lp.connect(dL); dL.connect(fL); fL.connect(dR); dR.connect(fR); fR.connect(dL); const pL = pan(-.75), pR = pan(.75); dL.connect(pL); dR.connect(pR); pL.connect(E.music); pR.connect(E.music); E.ppL = dL; E.ppR = dR; }
    E.setDelay = (sec, t) => { E.ppL.delayTime.setValueAtTime(sec, t); E.ppR.delayTime.setValueAtTime(sec, t); };
    function pan(v) { if (!c.createStereoPanner) return G(1); const p = c.createStereoPanner(); p.pan.value = v; return p; }
    E.pan = pan;
    const dest = (out, p) => { if (!p || LITE) return out; const n = pan(p); n.connect(out); return n; };
    // ---- envolventes ----
    function adsr(g, t, a, peak, d, sus, dur, rel) { const p = g.gain; p.setValueAtTime(0, t); p.linearRampToValueAtTime(peak, t + a); if (d > 0) p.setTargetAtTime(peak * sus, t + a, d / 3); const te = Math.max(t + a + .005, t + dur); p.setTargetAtTime(0, te, rel / 4.5); return te + rel; }
    function perc(g, t, peak, dur, a = .003) { const p = g.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + a); p.exponentialRampToValueAtTime(0.0001, t + a + dur); return t + a + dur; }
    function osc(type, f, t) { const o = c.createOscillator(); if (typeof type === 'string') o.type = type; else o.setPeriodicWave(type); o.frequency.setValueAtTime(f, t); return o; }
    const ORGAN = c.createPeriodicWave(new Float32Array([0, 1, .55, .32, .22, 0, .12, 0, .07]), new Float32Array(9));
    const HOLLOW = c.createPeriodicWave(new Float32Array([0, 1, 0, .3, 0, .14, 0, .07, 0, .04]), new Float32Array(10));
    // ---- instrumentos ----
    const I = E.I = {};
    I.sub = (m, t, dur, vol, out) => { const f = mtof(m), g = G(0); g.connect(out); const o = osc('sine', f, t), o2 = osc('triangle', f * 2, t), g2 = G(.18); o.connect(g); o2.connect(g2); g2.connect(g); const e = adsr(g, t, .08, vol, 0, 1, dur, .9); o.start(t); o2.start(t); o.stop(e + .05); o2.stop(e + .05); };
    I.pad = (ms, t, dur, vol, out, o = {}) => { // sierras desafinadas con filtro que respira
      const f = c.createBiquadFilter(); f.type = 'lowpass'; const cut = o.cut || 900; f.Q.value = o.q || .7;
      f.frequency.value = cut * .8;
      const g = G(0); f.connect(g); g.connect(dest(out, o.pan)); const e = adsr(g, t, Math.min(o.att || 1.4, dur * .4), vol, 0, 1, dur, o.rel || 1.4);
      let dets = o.dets || [-9, 7]; if (LITE && dets.length > 2) dets = [dets[0], dets[dets.length - 1]]; const type = o.type || 'sawtooth';
      for (const m of ms) for (const dt of dets) { const x = osc(type, mtof(m), t); x.detune.value = dt + (rnd() - .5) * 3; x.connect(f); x.start(t); x.stop(e + .05); }
    };
    I.air = (ms, t, dur, vol, out, o = {}) => { // ruido por resonadores afinados: pad de aire
      const n = c.createBufferSource(); n.buffer = pink; n.loop = true; const g = G(0); g.connect(dest(out, o.pan)); const e = adsr(g, t, Math.min(1.6, dur * .4), vol, 0, 1, dur, 1.6);
      for (const m of ms) { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = mtof(m); b.Q.value = o.q || 40; n.connect(b); const k = G(o.gain || 9); b.connect(k); k.connect(g); }
      n.start(t, rnd() * 3); n.stop(e + .05);
    };
    I.organ = (ms, t, dur, vol, out, o = {}) => { const g = G(0); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.cut || 2400; lp.connect(g); g.connect(dest(out, o.pan)); const e = adsr(g, t, o.att || 1.2, vol, 0, 1, dur, o.rel || 2); for (const m of ms) { const x = osc(ORGAN, mtof(m), t); x.detune.value = (rnd() - .5) * 6; x.connect(lp); x.start(t); x.stop(e + .05); } };
    I.bell = (m, t, vol, out, o = {}) => { const f = mtof(m), dur = o.dur || 2.6, ratio = o.ratio || 3.5; const ca = osc('sine', f, t), mo = osc('sine', f * ratio, t), mg = G(0), g = G(0); mg.gain.setValueAtTime(f * (o.idx || 2), t); mg.gain.exponentialRampToValueAtTime(f * .02 + .01, t + dur * .7); mo.connect(mg); mg.connect(ca.frequency); ca.connect(g); g.connect(dest(out, o.pan)); const e = perc(g, t, vol, dur, .004); ca.start(t); mo.start(t); ca.stop(e + .05); mo.stop(e + .05); };
    I.glass = (m, t, dur, vol, out, o = {}) => { const f = mtof(m); const g = G(0); g.connect(dest(out, o.pan)); const e = adsr(g, t, o.att || .04, vol, Math.max(.3, dur * .8), .35, dur, o.rel || 1.8); const x = osc(ORGAN, f, t); x.connect(g); x.start(t); x.stop(e + .05); const p = osc('sine', f * 4, t), pg = G(0); p.connect(pg); pg.connect(g); perc(pg, t, .25, .9); p.start(t); p.stop(t + 1); };
    I.marimba = (m, t, vol, out, o = {}) => { const f = mtof(m); const g = G(1); g.connect(dest(out, o.pan)); [[1, 1, o.dec || .55], [3.93, .28, .1], [9.3, .1, .03]].forEach(([h, a, d]) => { if (f * h > 15000) return; const x = osc('sine', f * h, t), xg = G(0); x.connect(xg); xg.connect(g); const e = perc(xg, t, vol * a, d, .002); x.start(t); x.stop(e + .03); }); };
    I.square = (m, t, dur, vol, out, o = {}) => { const f = mtof(m); const x = osc('square', f, t), s = osc('sine', f, t), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.value = Math.min(9000, f * (o.bright || 3.5)); const g = G(0), sg = G(.6); x.connect(lp); lp.connect(g); s.connect(sg); sg.connect(g); g.connect(dest(out, o.pan)); const e = adsr(g, t, .006, vol, .25, .45, dur * .85, .12); x.start(t); s.start(t); x.stop(e + .05); s.stop(e + .05); };
    I.epiano = (m, t, dur, vol, out, o = {}) => { const f = mtof(m); const g = G(0); g.connect(dest(out, o.pan)); const e = adsr(g, t, .004, vol, Math.min(2.4, dur + 1), .0, dur + 1.2, .35);
      const c1 = osc('sine', f, t), m1 = osc('sine', f, t), mg1 = G(0); mg1.gain.setValueAtTime(f * 1.2, t); mg1.gain.exponentialRampToValueAtTime(f * .15, t + 1.2); m1.connect(mg1); mg1.connect(c1.frequency); c1.connect(g);
      const c2 = osc('sine', f, t), m2 = osc('sine', f * 14, t), mg2 = G(0), g2 = G(0); mg2.gain.setValueAtTime(f * 2.5, t); mg2.gain.exponentialRampToValueAtTime(1, t + .12); m2.connect(mg2); mg2.connect(c2.frequency); c2.connect(g2); g2.connect(g); perc(g2, t, .55, .22);
      [c1, m1, c2, m2].forEach(x => { x.start(t); x.stop(e + .05); }); };
    I.vibes = (m, t, vol, out, o = {}) => { const f = mtof(m); const g = G(0), tr = G(1), lfo = osc('sine', 5.2, t), lg = G(.32); lfo.connect(lg); lg.connect(tr.gain); g.connect(tr); tr.connect(dest(out, o.pan)); const e = perc(g, t, vol, o.dur || 2.8, .003); const a = osc('sine', f, t), b = osc('sine', f * 4, t), bg = G(.12); a.connect(g); b.connect(bg); bg.connect(g); [a, b, lfo].forEach(x => { x.start(t); x.stop(e + .05); }); };
    const FORM = { a: [[730, 1], [1090, .5], [2440, .25]], o: [[450, 1], [800, .45], [2830, .15]], m: [[260, 1], [1000, .25], [2400, .08]], e: [[400, 1], [2000, .5], [2600, .2]] };
    I.voice = (m, t, dur, vol, out, o = {}) => { const f = mtof(m); const g = G(0); g.connect(dest(out, o.pan)); const e = adsr(g, t, o.att || .35, vol, 0, 1, dur, o.rel || .9); const src = G(1);
      const v = osc('sine', 4.6 + rnd() * .8, t), vg = G(0); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * .011, t + Math.min(1.2, dur * .6)); v.connect(vg); v.start(t); v.stop(e + .05);
      for (const dt of (LITE ? [0] : [-7, 6])) { const x = osc('sawtooth', f, t); x.detune.value = dt; vg.connect(x.frequency); x.connect(src); x.start(t); x.stop(e + .05); }
      for (const [fq, a] of FORM[o.vowel || 'a']) { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fq; b.Q.value = 9; const k = G(a * 2.2); src.connect(b); b.connect(k); k.connect(g); } };
    I.cello = (m, t, dur, vol, out, o = {}) => { const f = mtof(m); const x = osc('sawtooth', f, t), lp = c.createBiquadFilter(), body = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.6; lp.frequency.value = f * 5; body.type = 'peaking'; body.frequency.value = 420; body.gain.value = 5; body.Q.value = 1.2;
      const v = osc('sine', 5.3, t), vg = G(0); vg.gain.setValueAtTime(0, t); vg.gain.setValueAtTime(0, t + Math.min(.6, dur * .4)); vg.gain.linearRampToValueAtTime(f * .009, t + Math.min(1.4, dur * .8)); v.connect(vg); vg.connect(x.frequency);
      const g = G(0); x.connect(lp); lp.connect(body); body.connect(g); g.connect(dest(out, o.pan)); const e = adsr(g, t, .16, vol, .5, .8, dur, .5); x.start(t); v.start(t); x.stop(e + .05); v.stop(e + .05); };
    // Karplus-Strong de verdad (calculado en un buffer: el retardo realimentado de Web Audio no baja de 128 muestras).
    const KSR = 32000, ksCache = new Map();
    function ksBuf(f, t60, bright) {
      const key = f.toFixed(1) + '|' + t60 + '|' + bright; let b = ksCache.get(key); if (b) { ksCache.delete(key); ksCache.set(key, b); return b; }
      const N = Math.max(2.5, KSR / f - .5), Ni = Math.floor(N), fr = N - Ni, n = Math.ceil(KSR * Math.min(t60, 2.4)); const y = new Float32Array(n); let lp = 0; const a = .15 + .8 * bright;
      for (let i = 0; i < Math.min(n, Ni + 2); i++) { lp += a * ((rnd() * 2 - 1) - lp); y[i] = lp; }
      const gk = Math.pow(.001, 1 / (f * t60));
      for (let i = Ni + 2; i < n; i++) { const d0 = (1 - fr) * y[i - Ni] + fr * y[i - Ni - 1], d1 = (1 - fr) * y[i - Ni - 1] + fr * y[i - Ni - 2]; y[i] = gk * .5 * (d0 + d1); }
      let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(y[i])); const k = 1 / (pk || 1); for (let i = 0; i < n; i++) y[i] *= k; for (let i = 0; i < 64 && i < n; i++) y[n - 1 - i] *= i / 64;
      b = c.createBuffer(1, n, KSR); b.copyToChannel ? b.copyToChannel(y, 0) : b.getChannelData(0).set(y); ksCache.set(key, b); if (ksCache.size > 40) ksCache.delete(ksCache.keys().next().value); return b;
    }
    I.pluck = (fOrM, t, vol, out, o = {}) => { const f = o.hz ? fOrM : mtof(fOrM); const s = c.createBufferSource(); s.buffer = ksBuf(f, o.t60 || 2.2, o.bright == null ? .55 : o.bright); const g = G(vol); s.connect(g); g.connect(dest(out, o.pan)); s.start(t); };
    I.noise = (t, dur, vol, out, o = {}) => { const s = c.createBufferSource(); s.buffer = o.buf || white; const f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 3000, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur); f.Q.value = o.q || 1; const g = G(0); s.connect(f); f.connect(g); g.connect(dest(out, o.pan)); const e = o.swell ? adsr(g, t, o.swell, vol, 0, 1, dur - o.swell, dur * .5) : perc(g, t, vol, dur, o.a || .002); s.start(t, rnd() * 1.5); s.stop(e + .05); return f; };
    I.thump = (t, f0, f1, dur, vol, out, o = {}) => { const x = osc('sine', f0, t); x.frequency.exponentialRampToValueAtTime(f1, t + dur * .6); const g = G(0); x.connect(g); g.connect(dest(out, o.pan)); const e = perc(g, t, vol, dur, .002); x.start(t); x.stop(e + .05); };
    I.tone = (type, f, t, dur, vol, out, o = {}) => { const x = osc(type, f, t); if (o.to) x.frequency.exponentialRampToValueAtTime(o.to, t + (o.tt || dur)); if (o.detune) { x.detune.setValueAtTime(o.detune, t); x.detune.linearRampToValueAtTime(0, t + dur * .8); } const g = G(0); x.connect(g); g.connect(dest(out, o.pan)); const e = perc(g, t, vol, dur, o.a || .004); x.start(t); x.stop(e + .05); return x; };
    I.metal = (t, dur, vol, out, o = {}) => { const g = G(0), hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = o.hp || 5000; hp.connect(g); g.connect(dest(out, o.pan)); const e = perc(g, t, vol, dur); const b = o.base || 317; [1, 1.342, 1.2312, 1.6532, 1.9523, 2.1523].forEach(r => { const x = osc('square', b * r, t); x.connect(hp); x.start(t); x.stop(e + .05); }); };

    // ---- lechos continuos por tema ----
    E.bed = (kind, root, out, t) => {
      const nodes = [], g = G(0); g.connect(out); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 3);
      const src = (buf) => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.start(t, rnd() * 2); nodes.push(s); return s; };
      const lfo = (hz, amt, param) => { const l = osc('sine', hz, t), lg = G(amt); l.connect(lg); lg.connect(param); l.start(t); nodes.push(l); };
      if (kind === 'breath') { // aire del traje: ruido rosa que inhala y exhala, más el sub en la tónica
        const s = src(pink), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = .8; const bg = G(0); bg.gain.value = .045; s.connect(f); f.connect(bg); bg.connect(g); lfo(.17, .04, bg.gain); lfo(.17, 250, f.frequency);
        const d = osc('sine', mtof(root - 24), t), dg = G(.06); d.connect(dg); dg.connect(g); d.start(t); nodes.push(d);
      } else if (kind === 'air') { const s = src(pink), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.2; const bg = G(.035); s.connect(f); f.connect(bg); bg.connect(g); lfo(.06, 700, f.frequency); }
      else if (kind === 'hum') { const x = osc('sawtooth', mtof(root - 24), t), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 4; const hg = G(.05); x.connect(lp); lp.connect(hg); hg.connect(g); x.start(t); nodes.push(x); lfo(.11, 70, lp.frequency); const y = osc('sine', mtof(root - 12), t), yg = G(.025); y.connect(yg); yg.connect(g); y.start(t); nodes.push(y); }
      else if (kind === 'static') { const s = src(crackle), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = .7; const sg = G(.5); s.connect(f); f.connect(sg); sg.connect(g); const w = src(white), wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = mtof(root + 24); wf.Q.value = 25; const wg = G(.06); w.connect(wf); wf.connect(wg); wg.connect(g); lfo(.08, .05, wg.gain); }
      else if (kind === 'void') { const s = src(brown), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; const vg = G(.08); s.connect(f); f.connect(vg); vg.connect(g); lfo(.05, 90, f.frequency); }
      else if (kind === 'tape') { const s = src(crackle), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 900; const sg = G(.9); s.connect(f); f.connect(sg); sg.connect(g); const h = src(pink), hf = c.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 5000; const hg = G(.012); h.connect(hf); hf.connect(hg); hg.connect(g); }
      else if (kind === 'stars') { const s = src(pink), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = mtof(root + 36); f.Q.value = 30; const sg = G(.25); s.connect(f); f.connect(sg); sg.connect(g); lfo(.07, 300, f.frequency); const d = osc('sine', mtof(root - 24), t), dg = G(.05); d.connect(dg); dg.connect(g); d.start(t); nodes.push(d); }
      return { g, stop(tt) { g.gain.setTargetAtTime(0, tt, .5); nodes.forEach(n => { try { n.stop(tt + 3); } catch (e) { } }); } };
    };
    return E;
  }

  // ======================= arreglos (qué toca cada capa) =======================
  // B: contexto del compás. Funciones (E, B, out). Capas: 0 base (pad + bajo), 1 melodía, 2 pulso, 3 contracanto, 4 armonía alta.
  function voicing(c, lo, n = 4) { const pcs = [...new Set(c.iv.map(i => (c.root + i) % 12))]; const v = pcs.map(pc => { let m = lo + ((pc - lo) % 12 + 12) % 12; return m; }).sort((a, b) => a - b); return v.slice(0, n); }
  const bassM = (c, lo = 36) => lo + ((c.bass - lo) % 12 + 12) % 12;
  const tonesIn = (c, lo, hi) => { const out = []; for (let m = lo; m <= hi; m++) if (c.iv.some(i => (c.root + i) % 12 === ((m % 12) + 12) % 12)) out.push(m); return out; };
  const chordAt = (B, t) => { let x = B.ch[0]; for (const y of B.ch) if (y.t <= t + 1e-4) x = y; return x ? x.c : B.prev; };
  const PAD = {
    saw: (E, B, o) => B.runs.forEach(r => E.I.pad(voicing(r.c, B.th.dark ? 50 : 52, 4).map(m => m), r.t, r.d, B.th.dark ? .028 : .032, o, { cut: B.th.dark ? 650 : B.th.ring ? 1100 : 950 })),
    power: (E, B, o) => B.runs.forEach(r => E.I.pad([bassM(r.c, 40), bassM(r.c, 40) + 7, bassM(r.c, 40) + 12], r.t, r.d, .03, o, { cut: 700, q: 2 })),
    super: (E, B, o) => B.runs.forEach(r => E.I.pad(voicing(r.c, 54, 4), r.t, r.d, .022, o, { cut: B.sec.climax ? 2200 : 1500, dets: [-14, -5, 5, 14], att: 2 })),
    warm: (E, B, o) => B.runs.forEach(r => E.I.pad(voicing(r.c, 52, 4), r.t, r.d, .05, o, { type: 'triangle', cut: 1600, dets: [-6, 6], att: .9 })),
    organ: (E, B, o) => B.runs.forEach(r => E.I.organ(voicing(r.c, 52, 4), r.t, r.d, .03, o, { att: 1.8, cut: 2000 })),
    air: (E, B, o) => B.runs.forEach(r => { E.I.air(voicing(r.c, 60, 4), r.t, r.d, .5, o); E.I.pad(voicing(r.c, 53, 3), r.t, r.d, .016, o, { type: 'triangle', cut: 1200, dets: [-5, 5] }); }),
  };
  const BASS = {
    sub: (E, B, o) => B.runs.forEach(r => E.I.sub(bassM(r.c, 38), r.t, r.d, .2, o)),
    marim: (E, B, o) => { for (let k = 0; k < B.meter; k += 2) { const c = chordAt(B, B.t0 + k * B.spb); const m = bassM(c, 41) + (k === 2 && B.si % 2 ? 7 : 0); E.I.marimba(m, B.t0 + k * B.spb, .3, o, { dec: .9 }); } },
    pulse8: (E, B, o) => { for (let k = 0; k < B.meter * 2; k++) { const t = B.t0 + k * B.spb / 2, c = chordAt(B, t), m = bassM(c, 40) + (k % 8 === 7 ? 12 : 0); E.I.tone('sawtooth', mtof(m - 12), t, B.spb * .4, k % 2 ? .035 : .055, o); E.I.tone('sine', mtof(m - 12), t, B.spb * .42, k % 2 ? .12 : .19, o); } },
    round: (E, B, o) => { [[0, 0, 1], [1.5, 0, .7], [2, 7, .85], [3.5, 12, .5]].forEach(([b, iv, v]) => { const t = B.t0 + b * B.spb, c = chordAt(B, t), m = bassM(c, 40) + iv; E.I.tone('sine', mtof(m), t, B.spb * .9, .26 * v, o); E.I.tone('triangle', mtof(m + 12), t, B.spb * .3, .05 * v, o); }); },
    pizz: (E, B, o) => { for (let k = 0; k < B.meter; k++) { const t = B.t0 + k * B.spb, c = chordAt(B, t), nx = chordAt(B, t + B.spb * 1.01) || c; let m = bassM(c, 36); if (k === 1) m += c.iv.includes(3) ? 3 : 4; if (k === 2) m += 7; if (k === 3) { const tgt = bassM(nx, 36); m = (B.r() < .5 ? tgt - 1 : tgt + 2); } if (k === 1 && B.r() < .4) continue; E.I.pluck(m, t, .55, o, { t60: .9, bright: .25 }); } },
  };
  const DRONE = (E, B, o) => { if (B.si === 0) { const c = B.ch[0].c; E.I.sub(bassM(c, 38), B.t0, B.sec.bars * B.dur, .12, o); E.I.pad([bassM(c, 50), bassM(c, 50) + 7], B.t0, B.sec.bars * B.dur, .012, o, { cut: 500, att: 3, rel: 3 }); } };
  const LEAD = {
    bell: (E, B, n, o) => E.I.bell(n.m, n.t, .085 * n.v, o, { dur: Math.max(2.2, n.d + 1.2), pan: .15 }),
    glass: (E, B, n, o) => E.I.glass(n.m, n.t, n.d, .07 * n.v, o, { pan: .1 }),
    marimba: (E, B, n, o) => { E.I.marimba(n.m, n.t, .2 * n.v, o, { pan: -.1 }); if (n.d >= 2) E.I.marimba(n.m, n.t + B.spb * .5, .06 * n.v, o, { pan: .2 }); },
    square: (E, B, n, o) => E.I.square(n.m, n.t, n.d, .07 * n.v, o, { pan: .05 }),
    lyre: (E, B, n, o) => E.I.pluck(n.m, n.t, .32 * n.v, o, { t60: 2.4, bright: .6, pan: -.15 }),
    epiano: (E, B, n, o) => E.I.epiano(n.m, n.t, n.d, .11 * n.v, o, { pan: -.05 }),
    cello: (E, B, n, o) => E.I.cello(n.m - 12, n.t, n.d * .97, .085 * n.v, o, { pan: -.1 }),
    voice: (E, B, n, o) => E.I.voice(n.m - 12, n.t, n.d, .045 * n.v, o, { vowel: 'o' }),
  };
  const PERC = {
    heart: (E, B, o) => { if (B.si % 2) return; E.I.thump(B.t0, 70, 42, .28, .3, o); E.I.thump(B.t0 + .32, 64, 40, .24, .18, o); },
    shimmer: (E, B, o) => { for (let k = 0; k < B.meter; k += 2) { const t = B.t0 + k * B.spb, c = chordAt(B, t), ts = tonesIn(c, 79, 93); E.I.bell(ts[Math.floor(B.r() * ts.length)], t + B.spb * .5, .022, o, { dur: 3, ratio: 3.5, idx: .7, pan: k % 4 ? .6 : -.6 }); } },
    shaker: (E, B, o) => { for (let k = 0; k < B.meter * 4; k++) { if (k % 2 && B.r() < .6) continue; const t = B.t0 + k * B.spb / 4; const acc = k % 4 === 2 ? 1 : k % 2 ? .35 : .6; E.I.noise(t, .05, .045 * acc, o, { type: 'highpass', f: 7000, pan: .35 }); } for (const k of [1, 3]) E.I.noise(B.t0 + k * B.spb, .04, .12, o, { f: 1700, q: 7, pan: -.3 }); },
    relay: (E, B, o) => { for (let k = 0; k < B.meter; k++) { const t = B.t0 + k * B.spb; if (k % 2 === 0) E.I.thump(t, 140, 45, .22, .5, o); else E.I.noise(t, .09, .12, o, { f: 1800, q: 1.4, buf: E.buf.white }); E.I.noise(t + B.spb / 2, .03, .06, o, { type: 'highpass', f: 8000, pan: .3 }); } for (let k = 0; k < 16; k++) if (B.r() < .22) E.I.noise(B.t0 + k * B.spb / 4, .012, .1, o, { f: 2400 + B.r() * 2400, q: 9, pan: (B.r() - .5) * 1.2 }); if (B.si % 2 === 1) E.I.metal(B.t0 + 3.5 * B.spb, .35, .02, o, { pan: .4 }); },
    radar: (E, B, o) => { const c = chordAt(B, B.t0), m = tonesIn(c, 84, 96)[0]; E.I.tone('sine', mtof(m), B.t0, .5, .06, o); E.I.tone('sine', mtof(m) * 2, B.t0, .08, .015, o); for (const k of [1, 3]) E.I.noise(B.t0 + k * B.spb, .035, .07, o, { f: 2200, q: 5, pan: .25 }); },
    brush: (E, B, o) => { for (const k of [1, 3]) E.I.noise(B.t0 + k * B.spb - .05, .2, .04, o, { f: 4500, q: .8, swell: .06, pan: .2 }); for (let k = 0; k < B.meter; k++) { E.I.noise(B.t0 + k * B.spb, .04, .025, o, { f: 6000, q: 1, pan: -.2 }); E.I.noise(B.t0 + (k + 2 / 3) * B.spb, .03, .018, o, { f: 6500, q: 1, pan: -.2 }); } },
    waltz: (E, B, o) => { E.I.thump(B.t0, 95, 58, .5, .26, o); E.I.noise(B.t0, .12, .02, o, { type: 'lowpass', f: 400 }); const c = chordAt(B, B.t0); for (const k of [1, 2]) E.I.marimba(bassM(c, 50) + (k === 1 ? 7 : 12), B.t0 + k * B.spb, .05, o, { dec: .8, pan: k === 1 ? -.3 : .3 }); },
    ascend: (E, B, o) => { const c = chordAt(B, B.t0), ts = tonesIn(c, 64, 88); for (let k = 0; k < B.meter * 2 && k < ts.length; k++) E.I.bell(ts[k], B.t0 + k * B.spb / 2, .03, o, { dur: 2.2, ratio: 2, idx: .6, pan: -.6 + k * .17 }); },
    arpMar: (E, B, o) => { const pat = [0, 2, 1, 3, 2, 4, 3, 1]; for (let k = 0; k < B.meter * 2; k++) { const t = B.t0 + k * B.spb / 2, c = chordAt(B, t), ts = tonesIn(c, 62, 84); const p = B.sec.arp === 1 ? k : B.sec.arp === 2 ? (B.meter * 2 - 1 - k) : pat[k % 8]; E.I.marimba(ts[p % ts.length], t, k % 2 ? .05 : .075, o, { pan: k % 2 ? .35 : -.35, dec: .5 }); } },
  };
  const L3 = {
    guide: (E, B, o) => B.runs.forEach(r => { const third = (r.c.root + r.c.iv[1]) % 12; E.I.voice(57 + ((third - 57) % 12 + 12) % 12, r.t, r.d * .96, .03, o, { vowel: 'm', pan: -.2 }); }),
    arpMar: (E, B, o) => PERC.arpMar(E, B, o),
    arpSq: (E, B, o) => { for (let k = 0; k < B.meter * 4; k++) { const t = B.t0 + k * B.spb / 4, c = chordAt(B, t), ts = tonesIn(c, 64, 83); const seq = B.sec.arp === 1 ? [0, 1, 2, 3, 2, 1] : B.sec.arp === 2 ? [0, 2, 1, 3, 4, 2] : [0, 1, 2, 3]; E.I.tone('square', mtof(ts[seq[k % seq.length] % ts.length]), t, B.spb * .2, .012 + .008 * Math.sin(k / 16 * Math.PI), o, { pan: Math.sin(k * .7) * .5 }); } },
    arpKS: (E, B, o) => { for (let k = 0; k < B.meter * 2; k++) { const t = B.t0 + k * B.spb / 2 + (k % 2 ? .012 : 0), c = chordAt(B, t), ts = tonesIn(c, 55, 79); const seq = B.sec.arp === 2 ? [0, 3, 1, 4, 2, 5, 3, 1] : [0, 2, 4, 2, 1, 3, 5, 3]; E.I.pluck(ts[seq[k % 8] % ts.length], t, k % 2 ? .1 : .14, o, { t60: 1.4, bright: .4, pan: .45 }); } },
    bellsLong: (E, B, o) => { for (let k = 0; k < B.meter; k += 2) { const t = B.t0 + k * B.spb, c = chordAt(B, t), ts = tonesIn(c, 72, 88); E.I.bell(ts[Math.floor(B.r() * ts.length)], t, .035, o, { dur: 5.5, ratio: 3.5, idx: 1.1, pan: k ? .5 : -.5 }); } },
    comp: (E, B, o) => { const hits = [[0, .7], [1.5 + 1 / 6, 1], [3.5 + 1 / 6, .6]]; hits.forEach(([b, v], i) => { if (i === 2 && B.r() < .5) return; const t = B.t0 + b * B.spb, c = chordAt(B, t); const v4 = voicing(c, 58, 5).filter(m => (m - c.root + 120) % 12 !== 0).slice(0, 3); v4.forEach((m, j) => E.I.epiano(m, t + j * .008, B.spb * .8, .035 * v, o, { pan: .3 })); }); },
    choir: (E, B, o) => B.runs.forEach(r => { const vs = voicing(r.c, B.sec.climax ? 62 : 57, 3); vs.forEach((m, j) => E.I.voice(m, r.t, r.d * .97, .022, o, { vowel: B.sec.name === 'B' || B.sec.name === 'B2' ? 'a' : 'o', pan: (j - 1) * .5, att: .8, rel: 1.5 })); }),
  };
  const L4 = {
    shimmer: (E, B, o) => PERC.shimmer(E, B, o),
    aurora: (E, B, o) => B.runs.forEach(r => E.I.air(voicing(r.c, 76, 3), r.t, r.d, .35, o, { q: 60, gain: 12, pan: .3 })),
    bubbles: (E, B, o) => { const sc = B.th.scale; for (let k = 0; k < B.meter * 4; k++) if (B.r() < .2) { const t = B.t0 + k * B.spb / 4, m = B.th.root + 12 + sc[Math.floor(B.r() * sc.length)] + (B.r() < .5 ? 12 : 0); E.I.tone('sine', mtof(m), t, .14, .045, o, { to: mtof(m) * 1.5, tt: .08, pan: (B.r() - .5) * 1.4 }); } },
    stars: (E, B, o) => { const sc = B.th.scale; for (let k = 0; k < B.meter * 2; k++) if (B.r() < .3) { const t = B.t0 + k * B.spb / 2, m = B.th.root + 24 + sc[Math.floor(B.r() * sc.length)]; E.I.tone('sine', mtof(m), t, 1.4, .025, o, { pan: (B.r() - .5) * 1.6 }); } },
    vibes: (E, B, o) => { const c = chordAt(B, B.t0), ts = tonesIn(c, 67, 81); E.I.vibes(ts[(B.si * 2 + 1) % ts.length], B.t0 + B.spb * (B.si % 2 ? 2 : 0), .05, o, { pan: .4 }); },
    strHi: (E, B, o) => B.runs.forEach(r => E.I.pad(voicing(r.c, 69, 3), r.t, r.d, .012, o, { cut: 3200, dets: [-10, 10], att: 2.5 })),
    bellHi: (E, B, o) => { if (B.si % 2) return; const c = chordAt(B, B.t0), ts = tonesIn(c, 76, 90); E.I.bell(ts[0], B.t0, .04, o, { dur: 3.5, ratio: 3.5, idx: 1.5, pan: -.4 }); E.I.bell(ts[1] || ts[0], B.t0 + B.spb * 1.5, .03, o, { dur: 3, ratio: 3.5, idx: 1.5, pan: .4 }); },
  };

  // ======================= reproductor de temas =======================
  function Player(E, name, n, t0, from) {
    const th = THEMES[name], C = compile(th), c = E.c; const spb = 60 / th.bpm;
    const p = { name, th, want: n == null ? 1 : n, cur: 0, peek: 0, fi: 0, si: 0, pass: 0, next: t0, dead: false, stops: [] };
    if (from && th.form.includes(from)) p.fi = th.form.indexOf(from);
    p.g = E.G(0); p.g.connect(E.music); p.g.gain.setValueAtTime(0, t0); p.g.gain.linearRampToValueAtTime(th.trim || 1, t0 + 1.4);
    p.wet = E.G(0); p.wet.connect(E.rv[th.space]); p.wet.gain.setValueAtTime(0, t0); p.wet.gain.linearRampToValueAtTime(1, t0 + 1.4);
    p.wd = E.G(0); p.wd.connect(E.pp); p.wd.gain.setValueAtTime(0, t0); p.wd.gain.linearRampToValueAtTime(1, t0 + 1.4);
    if (th.dly) E.setDelay(spb * .75, t0);
    p.L = [0, 1, 2, 3, 4].map(i => { const lg = E.G(0); lg.connect(p.g); const s = E.G(th.send[i]); lg.connect(s); s.connect(p.wet); if (th.dly && th.dly[i]) { const d = E.G(th.dly[i]); lg.connect(d); d.connect(p.wd); } return { g: lg, on: false, was: false }; });
    p.bed = th.bed ? E.bed(th.bed, th.root, p.g, t0) : null;
    p.layersAt = (T) => { const want = Math.max(0, Math.min(5, Math.max(p.want, th.minLayers && p.want > 0 ? th.minLayers : 0))); const pk = p.peek > 0 ? want : -1; if (p.peek > 0) p.peek--;
      p.L.forEach((l, i) => { const on = i < want || i === pk; l.was = l.on; if (on !== l.on) { l.g.gain.cancelScheduledValues(T); l.g.gain.setValueAtTime(l.on ? 1 : 0, T); l.g.gain.linearRampToValueAtTime(on ? 1 : 0, T + (on ? 2 : 2.5)); l.on = on; } }); };
    p.bar = (T) => {
      const sname = th.form[p.fi], sec = C.secs[sname]; sec.name = sname; const meter = th.meter, b0 = p.si * meter, b1 = b0 + meter, dur = meter * spb;
      const r = CO.mulberry32(((p.pass * 7919 + p.fi * 104729 + p.si * 1299709) ^ (name.length * 2654435761)) >>> 0);
      const toS = (b) => T + (b - b0) * spb;
      const B = { th, sec, si: p.si, pass: p.pass, meter, spb, dur, t0: T, r, prev: p.prevChord,
        ch: sec.chords.filter(x => x.t >= b0 - 1e-6 && x.t < b1 - 1e-6).map(x => ({ c: x.c, t: toS(x.t), d: x.d * spb })),
        runs: sec.runs.filter(x => x.t >= b0 - 1e-6 && x.t < b1 - 1e-6).map(x => ({ c: x.c, t: toS(x.t), d: x.d * spb })) };
      if (B.ch.length) p.prevChord = B.ch[B.ch.length - 1].c;
      p.layersAt(T);
      const allow = (i) => (sec.sil ? i === 0 : (!sec.only || sec.only.includes(i))) && (p.L[i].on || p.L[i].was);
      const A = th.arr;
      if (P.music || E.offline) {
        if (allow(0)) { if (sec.sil) DRONE(E, B, p.L[0].g); else { PAD[A.pad](E, B, p.L[0].g); BASS[A.bass](E, B, p.L[0].g); if (th.ring && B.runs.length && E.color != null) B.runs.forEach(rr => E.I.glass(74 + ((E.color - 74) % 12 + 12) % 12, rr.t + spb, rr.d, .018, p.L[0].g, { att: 1.5, rel: 2.5, pan: -.4 })); } }
        if (allow(1) && sec.mel.length) {
          const leadName = sec.lead || (th.arr.leadAlt && p.pass % 2 ? th.arr.leadAlt : A.lead); const lead = LEAD[leadName] || LEAD.bell;
          let notes = sec.mel.filter(x => x.t >= b0 - 1e-6 && x.t < b1 - 1e-6).map(x => ({ m: x.m + (sec.oct || 0), t: toS(x.t) + (r() - .5) * .012, d: x.d * spb, v: .82 + r() * .18, beat: x.t - b0 }));
          if ((sec.var === 'orn' || p.pass % 2 === 1) && leadName !== 'cello') { const extra = []; notes.forEach(nn => { if (nn.d >= 2 * spb && r() < .5) { const up = scaleStep(th, nn.m, 1); extra.push({ m: up, t: nn.t - Math.min(.16, spb * .22), d: .14, v: nn.v * .55 }); } }); notes = notes.concat(extra); }
          if (p.pass >= 1 && r() < .25 && notes.length) { const nn = notes[notes.length - 1]; notes.push({ m: nn.m + 12, t: nn.t + Math.min(nn.d, spb), d: spb, v: nn.v * .35 }); }
          notes.forEach(nn => lead(E, B, nn, p.L[1].g));
        }
        if (allow(2)) PERC[A.perc](E, B, p.L[2].g);
        if (allow(3)) L3[A.l3](E, B, p.L[3].g);
        if (allow(4)) L4[A.l4](E, B, p.L[4].g);
      }
      p.si++; if (p.si >= sec.bars) { p.si = 0; p.fi++; if (p.fi >= th.form.length) { p.fi = th.loop; p.pass++; } }
      return dur;
    };
    p.schedule = (horizon) => { const now = E.now(); if (p.next < now - .05) { p.next = now + .05; p.late = (p.late || 0) + 1; } while (!p.dead && p.next < horizon) p.next += p.bar(p.next); };
    p.stop = (T, fade = 1.8) => { p.dead = true; [p.g, p.wet, p.wd].forEach(g => { g.gain.cancelScheduledValues(T); g.gain.setValueAtTime(g.gain.value, T); g.gain.linearRampToValueAtTime(0, T + fade); }); if (p.bed) p.bed.stop(T); p.disposeAt = T + fade + 8; };
    return p;
  }
  function scaleStep(th, m, dir) { const sc = th.scale; for (let k = 1; k < 4; k++) { const x = m + dir * k; if (sc.includes(((x - th.root) % 12 + 12) % 12)) return x; } return m + dir * 2; }

  // ======================= ambiente de sala (bus aparte) =======================
  const KEYROOT = { prologo: 62, hub: 62, oxigeno: 65, energia: 64, comunicaciones: 69, navegacion: 60, archivo: 67, tripulacion: 71, observatorio: 62 };
  const MINOR = { prologo: 1, hub: 1, energia: 1, comunicaciones: 1, archivo: 1, tripulacion: 1, observatorio: 1 };
  function Ambience(E, mod, life, t) {
    const c = E.c, I = E.I, root = KEYROOT[mod] || 62; const a = { mod, life: life || 0, nextEv: t + 2 + Math.random() * 3, nodes: [] };
    a.g = E.G(0); a.g.connect(E.amb); a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(1, t + 2.5);
    const vent = c.createBufferSource(); vent.buffer = E.buf.brown; vent.loop = true; a.lp = c.createBiquadFilter(); a.lp.type = 'lowpass'; a.lp.frequency.value = 240; const bp = c.createBiquadFilter(); bp.type = 'peaking'; bp.frequency.value = mtof(root - 12); bp.Q.value = 6; bp.gain.value = 9;
    a.vg = E.G(.32); vent.connect(a.lp); a.lp.connect(bp); bp.connect(a.vg); a.vg.connect(a.g); vent.start(t, Math.random() * 3); a.nodes.push(vent);
    const lfo = c.createOscillator(), lg = E.G(90); lfo.frequency.value = .05 + Math.random() * .04; lfo.connect(lg); lg.connect(a.lp.frequency); lfo.start(t); a.nodes.push(lfo);
    const hum = c.createOscillator(); hum.frequency.value = mtof(root - 24); a.hg = E.G(.0); const h3 = c.createOscillator(); h3.frequency.value = mtof(root - 24) * 3; const h3g = E.G(.12); h3.connect(h3g); h3g.connect(a.hg); hum.connect(a.hg); a.hg.connect(a.g); hum.start(t); h3.start(t); a.nodes.push(hum, h3);
    a.setLife = (lv, tt) => { a.life = lv; a.lp.frequency.setTargetAtTime(240 + lv * 70, tt, 1.5); a.hg.gain.setTargetAtTime(.035 + lv * .012, tt, 1.5); a.vg.gain.setTargetAtTime(.32 + lv * .03, tt, 1.5); };
    a.setLife(a.life, t);
    const sc = MINOR[mod] ? MIN : (mod === 'oxigeno' || mod === 'navegacion') ? LYD : MAJ;
    const note = (o) => root + o + sc[Math.floor(Math.random() * sc.length)];
    const EV = {
      drip: (tt) => { const m = note(24); I.tone('sine', mtof(m), tt, .12, .09, a.g, { to: mtof(m) * 1.9, tt: .05, pan: (Math.random() - .5) * 1.4 }); },
      bubbles: (tt) => { for (let k = 0; k < 3 + Math.random() * 4; k++) { const m = note(12); I.tone('sine', mtof(m), tt + k * (.05 + Math.random() * .06), .08, .03, a.g, { to: mtof(m) * 1.6, tt: .06, pan: .5 }); } },
      valve: (tt) => I.noise(tt, 1.1, .05, a.g, { type: 'highpass', f: 3000, swell: .3, pan: -.6 }),
      relay: (tt) => { for (let k = 0; k < 2 + Math.random() * 5; k++) I.noise(tt + k * (.04 + Math.random() * .09), .012, .14, a.g, { f: 1500 + Math.random() * 2500, q: 10, pan: (Math.random() - .5) }); },
      crackle: (tt) => I.noise(tt, .35, .05, a.g, { buf: E.buf.crackle, type: 'highpass', f: 2000, pan: (Math.random() - .5) }),
      morse: (tt) => { const f = mtof(note(24)); let x = tt; for (let k = 0; k < 3 + Math.random() * 4; k++) { const d = Math.random() < .5 ? .06 : .18; I.tone('sine', f, x, d, .025, a.g, { pan: .7 }); x += d + .07; } },
      static: (tt) => I.noise(tt, .6 + Math.random(), .035, a.g, { f: 1500 + Math.random() * 2000, q: .8, swell: .15, pan: (Math.random() - .5) }),
      groan: (tt) => { const f = mtof(root - 24); I.tone('sawtooth', f, tt, 2.6, .025, a.g, { to: f * .82, tt: 2.4 }); I.noise(tt, 2.2, .03, a.g, { buf: E.buf.brown, type: 'lowpass', f: 180, swell: .8 }); },
      ting: (tt) => I.bell(note(36), tt, .025, a.g, { dur: 3, ratio: 2.76, idx: .5, pan: (Math.random() - .5) * 1.6 }),
      servo: (tt) => { const f = 180 + Math.random() * 120; I.tone('sawtooth', f, tt, .45, .012, a.g, { to: f * 1.5, tt: .4, pan: .4 }); I.noise(tt + .45, .02, .08, a.g, { f: 2500, q: 6, pan: .4 }); },
      tick: (tt) => I.noise(tt, .01, .1, a.g, { f: 3500 + Math.random() * 3000, q: 12, pan: (Math.random() - .5) * 1.4 }),
      sigh: (tt) => I.noise(tt, 2.4, .05, a.g, { buf: E.buf.pink, f: 600, q: 1.5, to: 300, swell: .9, pan: (Math.random() - .5) }),
      creak: (tt) => { const f = I.noise(tt, 1, .06, a.g, { f: 380 + Math.random() * 300, q: 24, swell: .3 }); f.frequency.linearRampToValueAtTime(260 + Math.random() * 300, tt + 1); },
      clank: (tt) => { I.thump(tt, 120, 60, .3, .12, a.g); I.metal(tt, .4, .012, a.g, { base: 211, hp: 1800, pan: (Math.random() - .5) }); },
    };
    const SET = { prologo: ['creak', 'clank', 'sigh'], hub: ['groan', 'clank', 'creak'], oxigeno: ['drip', 'bubbles', 'valve', 'drip'], energia: ['relay', 'crackle', 'relay', 'clank'], comunicaciones: ['static', 'morse', 'static', 'tick'], navegacion: ['ting', 'groan', 'ting'], archivo: ['servo', 'tick', 'crackle'], tripulacion: ['sigh', 'tick', 'creak'], observatorio: ['ting', 'ting', 'sigh'] }[mod] || ['creak'];
    a.tick = (now) => { if (now < a.nextEv) return; const k = SET[Math.floor(Math.random() * SET.length)]; try { EV[k](now + .05); } catch (e) { } const base = 9 / (1 + a.life * .45); a.nextEv = now + base * (.5 + Math.random()); };
    a.stop = (tt) => { a.g.gain.cancelScheduledValues(tt); a.g.gain.setValueAtTime(a.g.gain.value, tt); a.g.gain.linearRampToValueAtTime(0, tt + 1.6); a.nodes.forEach(n => { try { n.stop(tt + 2); } catch (e) { } }); };
    return a;
  }

  // ======================= estado en tiempo real =======================
  let ac = null, E = null, started = false, timer = 0;
  let player = null, dying = [], amb = null, want = { theme: null, n: 1 }, wantAmb = null, duck = { insp: 0, pause: 0, rec: 0 };
  let modKey = 62, modMinor = 1, lastMod = null;
  function init() {
    if (ac) return true;
    try { ac = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' }); } catch (e) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e2) { return false; } }
    E = makeEngine(ac); applyPrefs(); setColor();
    timer = setInterval(tick, 50);
    return true;
  }
  function tick() {
    if (!ac || ac.state !== 'running') return; const now = ac.currentTime;
    if (want.theme && (!player || player.name !== want.theme)) startTheme(now + .12);
    if (player) { player.want = want.n; player.schedule(now + .35); }
    dying = dying.filter(d => { if (now > d.disposeAt) { try { d.g.disconnect(); d.wet.disconnect(); d.wd.disconnect(); } catch (e) { } return false; } return true; });
    if (wantAmb !== undefined) { const w = wantAmb; wantAmb = undefined; setAmb(w, now); }
    if (amb && P.amb) amb.tick(now);
  }
  function startTheme(t) { if (player) { player.stop(t); dying.push(player); } player = Player(E, want.theme, want.n, t); }
  function setAmb(w, t) {
    if (!w) { if (amb) { amb.stop(t); amb = null; } return; }
    if (amb && amb.mod === w.mod) { if (w.life !== amb.life) amb.setLife(w.life, t); return; }
    if (amb) amb.stop(t); amb = Ambience(E, w.mod, w.life, t);
  }
  function applyPrefs() {
    if (!E) return; const t = ac.currentTime;
    E.music.gain.setTargetAtTime(P.music ? P.mv * .45 : 0, t, .15);
    E.sfx.gain.setTargetAtTime(P.sfx ? P.sv : 0, t, .05);
    E.amb.gain.setTargetAtTime(P.amb ? .32 * Math.max(P.sv, .35) : 0, t, .3);
    applyDuck();
  }
  function applyDuck() {
    if (!E) return; const t = ac.currentTime;
    const g = duck.pause ? .2 : (duck.insp ? .63 : 1) * (duck.rec ? .5 : 1); const f = duck.pause ? 900 : duck.insp ? 1800 : duck.rec ? 3500 : 20000;
    E.mDuck.gain.setTargetAtTime(g, t, .25); E.mFilt.frequency.setTargetAtTime(f, t, .25);
  }
  function unlock() {
    if (!init()) return;
    if (ac.state !== 'running' && !document.hidden) { try { const pr = ac.resume(); if (pr && pr.catch) pr.catch(() => { }); } catch (e) { } }
    if (!started) { started = true; setTimeout(tick, 0); }
  }
  function suspend() { if (ac && ac.state === 'running') { try { ac.suspend(); } catch (e) { } } }
  function resume() { if (ac && ac.state !== 'running' && started && !document.hidden) { try { const pr = ac.resume(); if (pr && pr.catch) pr.catch(() => { }); } catch (e) { } } }
  const now = () => (ac ? ac.currentTime : 0);
  function music(name, nLayers) { if (name && THEMES[name]) want.theme = name; if (nLayers != null) want.n = nLayers; if (player && player.name === want.theme) player.want = want.n; }
  function setLayers(n) { want.n = n; if (player) player.want = n; }
  function peekLayer() { if (player) player.peek = 2; }
  function inspector(on) { duck.insp = on ? 1 : 0; applyDuck(); }
  function pauseMix(on) { duck.pause = on ? 1 : 0; applyDuck(); }
  function ambience(mod, life) { wantAmb = mod ? { mod, life: life || 0 } : null; if (!ac) return; }
  function setColor() { if (E) E.color = lastMod ? KEYROOT[lastMod] : null; }
  function key(mod) { modKey = KEYROOT[mod] || 62; modMinor = MINOR[mod] ? 1 : 0; if (mod && mod !== 'prologo' && mod !== 'hub' && KEYROOT[mod]) { lastMod = mod; setColor(); } }

  // ======================= efectos =======================
  function sfx(name, arg) { if (!started || !E || ac.state !== 'running') return; fx(E, name, arg, ac.currentTime + .006, modKey, modMinor); }
  function fx(Eg, name, arg, t, k, minor) {
    const I = Eg.I, o = Eg.sfx, third = minor ? 3 : 4, c = Eg.c;
    switch (name) {
      case 'tap': I.noise(t, .015, .12, o, { type: 'highpass', f: 4500 }); I.tone('sine', mtof(k + 19), t, .09, .05, o); break;
      case 'open': { I.noise(t, .24, .07, o, { f: 380, to: 3200, q: 1.6 }); I.tone('sine', mtof(k + 7), t + .05, .3, .025, o); break; }
      case 'close': { I.noise(t, .22, .06, o, { f: 3000, to: 320, q: 1.6 }); I.tone('sine', mtof(k), t + .04, .25, .02, o); break; }
      case 'key': { I.noise(t, .008, .1, o, { type: 'highpass', f: 3200 }); I.tone('sine', mtof(k + 12) * Math.pow(2, (Math.random() - .5) * .05), t, .05, .03, o); I.tone('triangle', mtof(k), t, .03, .02, o); break; }
      case 'scan': { const x = I.tone('sine', mtof(k + 12), t, .38, .06, o, { to: mtof(k + 24), tt: .35 }); const tr = c.createOscillator(), tg = Eg.G(.5); tr.frequency.value = 22; tr.connect(tg); tg.connect(x.frequency); tr.start(t); tr.stop(t + .4); I.noise(t, .3, .015, o, { f: 2000, to: 6000, q: 3 }); break; }
      case 'ok': { [0, third, 7, 14].forEach((d, i) => { I.bell(k + 12 + d, t + i * .075, .085, o, { dur: 2, ratio: 2, idx: 1.2, pan: -.3 + i * .2 }); I.glass(k + 24 + d, t + i * .075, .2, .02, o); }); I.noise(t + .3, .25, .05, o, { type: 'highpass', f: 7500, buf: Eg.buf.crackle }); I.thump(t + .33, 160, 55, .22, .35, o); I.noise(t + .33, .06, .12, o, { type: 'lowpass', f: 900 }); I.noise(t + .36, .012, .1, o, { f: 3200, q: 8 }); break; }
      case 'mid': I.bell(k + 12, t, .065, o, { dur: .9, ratio: 2, idx: .8 }); I.bell(k + 19, t + .12, .065, o, { dur: 1.1, ratio: 2, idx: .8 }); break;
      case 'near': { I.tone('triangle', mtof(k + 12), t, .55, .08, o, { detune: -50 }); I.tone('sine', mtof(k + 24), t, .4, .02, o, { detune: -50 }); break; }
      case 'wrong': I.tone('sine', mtof(k - 24), t, .4, .26, o, { to: mtof(k - 25), tt: .3 }); I.tone('triangle', mtof(k - 12), t, .2, .06, o); I.noise(t, .09, .06, o, { type: 'lowpass', f: 600 }); break;
      case 'trap': I.tone('sine', mtof(k - 24), t, .35, .24, o); I.tone('triangle', mtof(k - 12), t, .18, .05, o); I.tone('square', mtof(k + 30), t + .14, .07, .022, o); I.tone('square', mtof(k + 30), t + .26, .07, .022, o); break;
      case 'hint': I.bell(k + 24, t, .07, o, { dur: 2.4, ratio: 3.5, idx: 1 }); I.bell(k + 31, t + .09, .03, o, { dur: 2, ratio: 3.5, idx: .8 }); break;
      case 'frag': [0, 7, 12, 19].forEach((d, i) => I.bell(k + 24 + d, t + i * .06, .045, o, { dur: 1.8, ratio: 5.1, idx: 1.4, pan: -.4 + i * .27 })); I.noise(t, .4, .02, o, { type: 'highpass', f: 9000 }); break;
      case 'rec': I.noise(t, .05, .1, o, { f: 1500, q: 2 }); I.noise(t + .06, .03, .06, o, { f: 800, q: 3 }); [0, third, 7].forEach((d, i) => I.tone('sine', mtof(k + 24 + d), t + .14 + i * .1, .09, .045, o)); break;
      case 'restored': { [0, 7, 12, 12 + third, 19, 26].forEach((d, i) => I.bell(k - 12 + d, t + i * .12, .07, o, { dur: 3.5, ratio: 2, idx: 1, pan: -.5 + i * .2 })); I.pad([k - 12, k - 5, k + third, k + 7], t, 3.2, .04, o, { cut: 1800, att: .6, rel: 2 }); I.sub(k - 24, t, 2.6, .25, o); break; }
      case 'door': { I.noise(t, .5, .13, o, { f: 2600, to: 280, q: 1 }); I.noise(t, .3, .03, o, { type: 'highpass', f: 5000 }); I.thump(t + .42, 110, 42, .3, .45, o); I.noise(t + .42, .05, .1, o, { type: 'lowpass', f: 700 }); break; }
      case 'step': I.thump(t, 95, 55, .1, .16, o); I.noise(t + .012, .018, .05, o, { f: 3600, q: 5 }); break;
      case 'rivet': I.noise(t, .008, .16, o, { type: 'highpass', f: 6000 }); I.tone('sine', mtof(k + 36), t, .03, .02, o); break;
      case 'morse': { const d = arg || .12; const x = Eg.G(0); const s = c.createOscillator(); s.frequency.value = 660; s.connect(x); x.connect(o); x.gain.setValueAtTime(0, t); x.gain.linearRampToValueAtTime(.12, t + .006); x.gain.setValueAtTime(.12, t + d - .01); x.gain.linearRampToValueAtTime(0, t + d); s.start(t); s.stop(t + d + .02); break; }
      case 'ratchet': I.noise(t, .02, .12, o, { f: 1700 + (arg || 0) * 55, q: 7 }); I.noise(t + .012, .01, .05, o, { type: 'highpass', f: 5000 }); break;
      case 'toggle': I.tone('square', mtof(k + (arg ? 19 : 12)), t, .06, .025, o); I.noise(t, .01, .07, o, { type: 'highpass', f: 4000 }); break;
      case 'fluid': I.noise(t, .14, .035, o, { f: 280 + (arg || 0) * 1800, q: 3.5 }); break;
      case 'bubble': { const m = k + 12 + [0, third, 7, 12][Math.floor(Math.random() * 4)]; I.tone('sine', mtof(m), t, .13, .06, o, { to: mtof(m) * 1.8, tt: .09 }); break; }
      case 'lyre': I.pluck(arg.f, t, arg.muted ? .14 : .24, o, { hz: 1, t60: arg.muted ? .25 : 2.6, bright: arg.muted ? .15 : .6 }); break;
      case 'tone': I.tone('triangle', arg, t, .3, .1, o); I.tone('sine', arg * 2, t, .22, .03, o); break;
      case 'static': I.noise(t, arg || .2, .035, o, { f: 1800 + Math.random() * 2400, q: .8, buf: Math.random() < .5 ? Eg.buf.crackle : Eg.buf.white }); break;
      case 'cooldown': { I.tone('sawtooth', 220, t, 10, .018, o, { to: 70, tt: 10 }); for (let i = 0; i < 10; i++) I.tone('sine', mtof(k + 24), t + i, .05, .03, o); break; }
      case 'echo': echoSound(Eg, arg, t, o); break;
      case 'shutter': I.noise(t, .03, .14, o, { type: 'highpass', f: 3000 }); I.noise(t + .06, .04, .09, o, { type: 'highpass', f: 2000 }); I.tone('sine', mtof(k + 31), t + .02, .1, .02, o); break;
      case 'glyph': I.bell(k + 24, t, .08, o, { dur: 2.8, ratio: 7, idx: 1 }); I.bell(k + 31, t + .15, .04, o, { dur: 2.4, ratio: 3.5, idx: .8 }); break;
      case 'letter': I.bell(k + 12 + (arg || 0), t, .06, o, { dur: 1.2, ratio: 2, idx: 1 }); break;
      case 'star': I.tone('sine', mtof(k + 24 + (arg || 0)), t, .3, .05, o); I.tone('sine', mtof(k + 36 + (arg || 0)), t, .12, .012, o); break;
    }
  }
  function echoSound(Eg, i, t, o) {
    const I = Eg.I;
    switch (i) {
      case 0: I.noise(t, .6, .13, o, { f: 1800, to: 250, q: 1 }); I.thump(t + .55, 90, 45, .25, .35, o); break; // puerta
      case 1: I.tone('sine', 900, t, .16, .16, o, { to: 1900, tt: .08 }); break; // gota
      case 2: I.tone('square', 1320, t, .16, .05, o); I.tone('square', 1320, t + .22, .16, .05, o); break; // pitido
      case 3: { const f = I.noise(t, 1.1, .08, o, { f: 500, q: 3, swell: .3 }); f.frequency.linearRampToValueAtTime(1100, t + .6); f.frequency.linearRampToValueAtTime(400, t + 1.1); break; } // viento
      case 4: [0, .35].forEach(d => { I.thump(t + d, 90, 50, .12, .3, o); I.noise(t + d, .03, .09, o, { type: 'highpass', f: 3000 }); }); break; // pasos
      case 5: I.bell(81, t, .12, o, { dur: 2.6, ratio: 2.76, idx: 1.2 }); break; // campana
      case 6: I.noise(t, .02, .22, o, { f: 1200, q: 8 }); I.noise(t + .09, .02, .17, o, { f: 900, q: 8 }); break; // relé
      case 7: I.noise(t, .85, .09, o, { type: 'highpass', f: 3000, swell: .05 }); break; // vapor
      case 8: I.thump(t, 70, 40, .16, .4, o); I.thump(t + .22, 62, 38, .18, .3, o); break; // latido
      case 9: [1, 2.7, 5.2].forEach((h, j) => I.tone('sine', 1400 * h, t + j * .01, .8, .04, o)); break; // cristal
    }
  }
  // ======================= leitmotiv y voces de las grabaciones =======================
  const HUM_NOTES = [62, 69, 72, 71], HUM_T = [0, .7, 1.4, 3.2];
  function hum(timbre = 0, major = false, out) {
    if (!started || !E || ac.state !== 'running') return 0; const I = E.I, t = ac.currentTime + .1, o = out || E.sfx, sl = major ? 1.3 : 1;
    const CH = [[50, 57, 62, 66], [54, 57, 61, 64], [45, 57, 61, 64], [43, 55, 59, 62]]; // D · F#m · A · G (versión mayor)
    HUM_NOTES.forEach((m0, i) => {
      const m = major && i === 2 ? m0 + 1 : m0, tt = t + HUM_T[i] * sl, len = (i < 3 ? HUM_T[i + 1] - HUM_T[i] : 1.8) * sl;
      if (timbre % 4 === 0) I.bell(m, tt, .085, o, { dur: 2.6, ratio: 3.5, idx: 1.4 });
      else if (timbre % 4 === 1) I.voice(m - 12, tt, len * .95, .06, o, { vowel: 'm', att: .12, rel: .5 });
      else if (timbre % 4 === 2) I.pluck(m, tt, .17, o, { t60: 2.4, bright: .55 });
      else I.glass(m, tt, len, .07, o);
      if (major) { I.pad(CH[i], tt, len, .028, o, { cut: 1700, att: .4, rel: 1.6, dets: [-6, 6] }); I.sub(CH[i][0] - 12, tt, len, .09, o); }
    });
    duck.rec = 1; applyDuck(); const d = HUM_T[3] * sl + 1.8; clearTimeout(hum._t); hum._t = setTimeout(() => { if (!murmur) { duck.rec = 0; applyDuck(); } }, d * 1000);
    return d;
  }
  let murmur = null;
  function murmurStart() {
    if (!started || !E) return; murmurStop(); const t = ac.currentTime;
    const n = ac.createBufferSource(); n.buffer = E.buf.pink; n.loop = true; const ng = E.G(.5);
    const bz = ac.createOscillator(); bz.type = 'sawtooth'; bz.frequency.value = 130; const bg = E.G(.35);
    const src = E.G(1); n.connect(ng); ng.connect(src); bz.connect(bg); bg.connect(src);
    const env = E.G(0); const fs = [600, 1500, 2500].map((fq, i) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fq; b.Q.value = 8; const k = E.G([1.6, .9, .4][i]); src.connect(b); b.connect(k); k.connect(env); return b; });
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3300; const out = E.G(P.murmur * .9);
    env.connect(hp); hp.connect(lp); lp.connect(out); out.connect(E.sfx); n.start(t, Math.random() * 2); bz.start(t);
    murmur = { n, bz, env, fs, out }; duck.rec = 1; applyDuck();
  }
  function syllable() {
    if (!murmur || !ac) return; const t = ac.currentTime, d = .12 + Math.random() * .08; const F = [[730, 1090], [270, 2290], [300, 870], [570, 840], [440, 1020], [400, 1900]][Math.floor(Math.random() * 6)];
    murmur.fs[0].frequency.setTargetAtTime(F[0], t, .03); murmur.fs[1].frequency.setTargetAtTime(F[1], t, .03);
    murmur.bz.frequency.setTargetAtTime(110 + Math.random() * 45, t, .05); murmur.env.gain.setTargetAtTime(.5, t, .02); murmur.env.gain.setTargetAtTime(0, t + d * .7, .04);
  }
  function murmurStop() { if (murmur) { const m = murmur; murmur = null; try { m.env.gain.setTargetAtTime(0, ac.currentTime, .03); m.n.stop(ac.currentTime + .2); m.bz.stop(ac.currentTime + .2); } catch (e) { } duck.rec = 0; applyDuck(); } }
  function vibrate(p) { if (P.vib && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { } }

  // Desbloqueo propio (además del de ui.js): cualquier gesto arranca o reanuda el audio.
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => addEventListener(ev, unlock, { capture: true, passive: true }));
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });

  // ======================= pruebas y render sin conexión =======================
  async function render(script, seconds, sampleRate = 44100) {
    const off = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate); const e = makeEngine(off); e.offline = 1; e.music.gain.value = .7 * .45; e.sfx.gain.value = .9; e.amb.gain.value = .32 * .9;
    let pl = null; const dead = []; let am = null; const t0 = performance.now(); const ev = script.slice().sort((a, b) => a.at - b.at);
    for (let vt = 0; vt < seconds; vt += .05) {
      e.vt = vt;
      while (ev.length && ev[0].at <= vt) { const x = ev.shift();
        if (x.theme) { if (pl) { pl.stop(vt); dead.push(pl); } pl = Player(e, x.theme, x.layers == null ? 5 : x.layers, vt + .05, x.from); }
        if (x.layers != null && !x.theme && pl) pl.want = x.layers;
        if (x.peek && pl) pl.peek = 2;
        if (x.amb !== undefined) { if (am) am.stop(vt); am = x.amb ? Ambience(e, x.amb, x.life || 0, vt) : null; }
        if (x.life != null && !x.amb && am) am.setLife(x.life, vt);
        if (x.sfx) fx(e, x.sfx, x.arg, vt + .01, KEYROOT[x.key] || 62, MINOR[x.key] ? 1 : 0);
      }
      if (pl) pl.schedule(vt + .35); if (am) am.tick(vt);
    }
    e.vt = null;
    const buf = await off.startRendering(); const ms = performance.now() - t0;
    let pk = 0, ss = 0, clipN = 0; const L = buf.getChannelData(0), R = buf.getChannelData(1); for (let i = 0; i < L.length; i++) { const a = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (a > pk) pk = a; if (a > .985) clipN++; ss += L[i] * L[i] + R[i] * R[i]; }
    return { buf, ms, peak: pk, peakDb: 20 * Math.log10(pk || 1e-9), rmsDb: 10 * Math.log10(ss / (2 * L.length) || 1e-12), clip: clipN };
  }
  function wav(buf) { const n = buf.length, ch = 2, sr = buf.sampleRate, b = new ArrayBuffer(44 + n * ch * 2), v = new DataView(b); const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }; w(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * ch * 2, true); const L = buf.getChannelData(0), R = buf.getChannelData(1); let o = 44; for (let i = 0; i < n; i++) { for (const d of [L, R]) { const s = Math.max(-1, Math.min(1, d[i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; } } return new Uint8Array(b); }
  function level() { if (!E) return null; const a = new Float32Array(E.meter.fftSize); E.meter.getFloatTimeDomainData(a); let pk = 0, ss = 0; for (const x of a) { pk = Math.max(pk, Math.abs(x)); ss += x * x; } return { peak: pk, rms: Math.sqrt(ss / a.length) }; }
  const debug = { LITE, THEMES, compile, render, wav, level, get late() { return player ? player.late || 0 : 0; }, get player() { return player && { name: player.name, fi: player.fi, si: player.si, pass: player.pass, want: player.want, layersOn: player.L.map(l => l.on) }; }, get amb() { return amb && { mod: amb.mod, life: amb.life }; }, get duck() { return Object.assign({}, duck); } };

  return { init, unlock, suspend, resume, applyPrefs, music, setLayers, peekLayer, inspector, pauseMix, ambience, key, sfx, hum, murmurStart, syllable, murmurStop, vibrate, debug,
    get ctx() { return ac; }, get started() { return started; }, get theme() { return player ? player.name : want.theme || ''; }, get layers() { return want.n; }, mtof };
})();
window.AU = AU;
