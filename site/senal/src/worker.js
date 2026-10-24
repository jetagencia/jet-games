/* JET//Señal — Worker del verificador: compara la regla del jugador con la secreta en todo el universo. */
importScripts('reglas.js', 'verificador.js');
self.onmessage = function (e) {
  const { id, jugador, secreta, registro } = e.data;
  try {
    const fa = Reglas.compilar(jugador), fb = Reglas.compilar(secreta);
    const bz = Verif.crearBarrido(fa, fb, 64);
    let ultimo = 0;
    while (!bz.paso(50000)) {
      const p = bz.progreso;
      if (p - ultimo > 0.02) { ultimo = p; self.postMessage({ id, progreso: p }); }
    }
    if (!bz.candidatas.length) { self.postMessage({ id, fin: true, equivalentes: true }); return; }
    const c = Verif.elegirContra(bz.candidatas, registro || []);
    self.postMessage({ id, fin: true, equivalentes: false, contra: c, acepta: fb(c, c.length) });
  } catch (err) {
    self.postMessage({ id, fin: true, error: String(err && err.message || err) });
  }
};
