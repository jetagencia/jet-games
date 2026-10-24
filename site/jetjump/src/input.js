// Controles. Un solo mapa de acciones para teclado, clic y toque (sin duplicar la lógica de saltar).
// Táctil: el control izquierdo gira; Saltar abajo a la derecha; aumentar / reducir ritmo encima.
// Teclado: A/D o flechas giran, W/S ritmo, Espacio o Enter saltan, C cámara, Esc o P pausa, R reinicia.
// El modo (teclado o táctil) sale de la preferencia del jugador o, en automático, del último uso real:
// un clic de ratón no convierte la pantalla en táctil, y el ancho de la ventana no decide el modo.
export class Input {
  constructor({ onGear, onJump, onPause, onCamera, onRestart, pref = 'auto' }) {
    this.steer = 0; this.touchSteer = 0; this.keys = {}; this.active = false; this.blocked = false;
    this.pref = pref;
    this.mode = pref !== 'auto' ? pref : matchMedia('(pointer: coarse)').matches ? 'touch' : 'keys';
    this.apply();
    const pad = document.getElementById('steer-pad'), ring = document.getElementById('steer-ring'), knob = document.getElementById('steer-knob');
    let id = null, x0 = 0, y0 = 0;
    // el anillo queda visible en reposo; al tocar, se centra bajo el pulgar
    const rest = () => { ring.classList.remove('on'); ring.style.left = ''; ring.style.top = ''; knob.style.transform = ''; };
    const show = (x) => { ring.classList.add('on'); ring.style.left = (x0 - 66) + 'px'; ring.style.top = (y0 - 32) + 'px'; knob.style.transform = `translateX(${Math.max(-56, Math.min(56, x - x0))}px)`; };
    pad.addEventListener('pointerdown', (e) => { if (!this.active || id !== null) return; id = e.pointerId; x0 = e.clientX; y0 = e.clientY; pad.setPointerCapture(id); show(x0); this.used(e); this.onLearn?.('turn'); });
    pad.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      // zona muerta de 4 px y curva suave: el centro es preciso y el borde gira a fondo
      const dx = e.clientX - x0, d = Math.max(0, Math.abs(dx) - 4) / 52;
      this.touchSteer = Math.sign(dx) * Math.min(1, d * (0.55 + 0.45 * d));
      show(e.clientX);
    });
    const up = (e) => { if (e.pointerId !== id) return; id = null; this.touchSteer = 0; rest(); };
    pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
    // botones de pulgar: pointerdown para respuesta inmediata con varios dedos; click para ratón y teclado.
    // Cada activación cuenta una sola vez.
    const btn = (el, fn) => {
      let last = -1e9;
      el.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        e.preventDefault(); if (!this.active) return;
        last = performance.now(); el.classList.add('on'); this.used(e); fn(); navigator.vibrate?.(8);
      });
      el.addEventListener('click', (e) => { if (performance.now() - last < 700) return; if (this.active) fn(); if (e.detail > 0) el.blur(); });
      const off = () => el.classList.remove('on');
      el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
    };
    btn(document.getElementById('gear-up'), () => onGear(1)); btn(document.getElementById('gear-down'), () => onGear(-1));
    btn(document.getElementById('btn-jump'), () => onJump());
    window.addEventListener('keydown', (e) => {
      const c = e.code;
      // con una ventana abierta o con foco en un control (botón, enlace, opción) las teclas son de la interfaz
      if (this.blocked) return;
      const t = e.target;
      if (t && t.closest && t.closest('button,a,input,select,textarea,label,[role=button]')) return;
      if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'ArrowUp', 'ArrowDown', 'Space', 'Enter'].includes(c)) { if (this.active) e.preventDefault(); this.used({ pointerType: 'keyboard' }); }
      if (e.repeat) return;
      this.keys[c] = true;
      if (!this.active) return;
      if (c === 'KeyW' || c === 'ArrowUp') onGear(1);
      if (c === 'KeyS' || c === 'ArrowDown') onGear(-1);
      if (c === 'Space' || c === 'Enter') onJump();
      if (c === 'Escape' || c === 'KeyP') onPause();
      if (c === 'KeyC') onCamera();
      if (c === 'KeyR') onRestart();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => this.clear());
  }
  clear() { this.keys = {}; this.touchSteer = 0; this.steer = 0; }
  // último uso real: teclado → modo teclado; dedo → modo táctil (solo en automático)
  used(e) {
    if (this.pref !== 'auto') return;
    const m = e.pointerType === 'keyboard' ? 'keys' : e.pointerType === 'touch' || e.pointerType === 'pen' ? 'touch' : null;
    if (m && m !== this.mode) { this.mode = m; this.apply(); this.onMode?.(m); }
  }
  setPref(p) {
    this.pref = p;
    this.mode = p !== 'auto' ? p : matchMedia('(pointer: coarse)').matches ? 'touch' : 'keys';
    this.apply(); this.onMode?.(this.mode);
  }
  apply() { document.body.classList.toggle('touch', this.mode === 'touch'); document.body.classList.toggle('keys', this.mode === 'keys'); }
  read(dt) {
    const k = this.keys;
    const kd = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    if (kd !== 0) this.onLearn?.('turn');
    // el teclado gira con rampa (como un pulgar) y suelta al instante; el táctil es directo
    const target = kd !== 0 ? kd : this.touchSteer;
    const rate = kd !== 0 ? (Math.abs(target) < Math.abs(this.steer) || Math.sign(target) !== Math.sign(this.steer) ? 30 : 8) : 30;
    this.steer += Math.max(-rate * dt, Math.min(rate * dt, target - this.steer));
    return { steer: this.steer };
  }
}
