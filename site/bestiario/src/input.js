// Entrada: teclado (WASD / flechas / Shift) y joystick flotante táctil o de ratón.
// El primer dedo que toca la pantalla maneja el joystick; los demás quedan libres
// para futuros botones (multitouch).

const KEY_X = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 };
const KEY_Y = { KeyW: -1, ArrowUp: -1, KeyS: 1, ArrowDown: 1 };
const DEAD = 0.12;

export class Input {
  constructor(stickEl) {
    this.keys = new Set();
    this.stick = { id: null, ox: 0, oy: 0, x: 0, y: 0, mag: 0 };
    this.override = null; // {x, y, run}: lo usan las pruebas automáticas
    this.lookMode = false; // en tercera y primera persona: arrastrar mira; en táctil, la mitad derecha de la pantalla
    this.look = { id: null, x: 0, y: 0, dx: 0, dy: 0 };
    this.stickEl = stickEl;
    this.knob = stickEl.querySelector('.knob');

    addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // con un menú o un combate abiertos, las teclas son de la interfaz: Espacio activa el botón enfocado y las flechas desplazan la lista
      if (document.body.classList.contains('modal-open') || document.body.classList.contains('in-battle')) return;
      if (e.code in KEY_X || e.code in KEY_Y || e.code === 'Space') e.preventDefault();
      this.keys.add(e.code);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.reset(); });

    addEventListener('pointerdown', (e) => this.down(e));
    addEventListener('pointermove', (e) => this.move(e));
    addEventListener('pointerup', (e) => this.up(e));
    addEventListener('pointercancel', (e) => this.up(e));
    addEventListener('contextmenu', (e) => e.preventDefault());
  }

  reset() {
    this.keys.clear(); this.look.id = null;
    this.stick.id = null; this.stick.x = this.stick.y = this.stick.mag = 0;
    this.stickEl.classList.remove('on');
  }

  radius() { return Math.max(46, Math.min(72, Math.min(innerWidth, innerHeight) * 0.1)); }

  down(e) {
    if (e.target.closest && e.target.closest('[data-ui]')) return;
    if (e.pointerType === 'mouse' && e.button === 2) { // clic derecho: arrastrar gira la cámara (en cualquier vista)
      if (this.look.id === null) { this.look.id = e.pointerId; this.look.x = e.clientX; this.look.y = e.clientY; }
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (this.lookMode && (e.pointerType === 'mouse' || e.clientX > innerWidth * 0.5)) {
      if (this.look.id !== null) return;
      this.look.id = e.pointerId; this.look.x = e.clientX; this.look.y = e.clientY; return;
    }
    if (this.stick.id !== null) { // con el joystick en uso, un segundo dedo gira la cámara
      if (this.look.id === null && e.pointerType !== 'mouse') { this.look.id = e.pointerId; this.look.x = e.clientX; this.look.y = e.clientY; }
      return;
    }
    const s = this.stick;
    s.id = e.pointerId; s.ox = e.clientX; s.oy = e.clientY; s.x = s.y = s.mag = 0;
    this.stickEl.style.transform = `translate(${s.ox}px, ${s.oy}px)`;
    this.knob.style.transform = 'translate(0px, 0px)';
    this.stickEl.classList.add('on');
  }

  move(e) {
    if (e.pointerId === this.look.id) {
      if (e.pointerType === 'mouse' && e.buttons === 0) { this.look.id = null; return; }
      this.look.dx += e.clientX - this.look.x; this.look.dy += e.clientY - this.look.y; this.look.x = e.clientX; this.look.y = e.clientY; return;
    }
    const s = this.stick;
    if (e.pointerId !== s.id) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { this.up(e); return; } // se soltó fuera de la ventana
    const R = this.radius();
    let dx = e.clientX - s.ox, dy = e.clientY - s.oy;
    const m = Math.hypot(dx, dy);
    if (m > R) { // el joystick "sigue" al dedo si se aleja del círculo
      const ex = m - R;
      s.ox += (dx / m) * ex; s.oy += (dy / m) * ex;
      dx = e.clientX - s.ox; dy = e.clientY - s.oy;
      this.stickEl.style.transform = `translate(${s.ox}px, ${s.oy}px)`;
    }
    const mm = Math.min(1, Math.hypot(dx, dy) / R);
    const ang = Math.atan2(dy, dx);
    this.knob.style.transform = `translate(${Math.cos(ang) * mm * R * 0.8}px, ${Math.sin(ang) * mm * R * 0.8}px)`;
    const mag = Math.max(0, (mm - DEAD) / (1 - DEAD));
    s.x = Math.cos(ang); s.y = Math.sin(ang); s.mag = mag;
  }

  up(e) {
    if (e.pointerId === this.look.id) { this.look.id = null; return; }
    if (e.pointerId !== this.stick.id) return;
    this.stick.id = null; this.stick.x = this.stick.y = this.stick.mag = 0;
    this.stickEl.classList.remove('on');
  }

  turn() { return (this.keys.has('KeyE') ? 1 : 0) - (this.keys.has('KeyQ') ? 1 : 0); }

  takeLook() { const r = { x: this.look.dx, y: this.look.dy }; this.look.dx = this.look.dy = 0; return r; }

  // Dirección deseada respecto de la pantalla: x (derecha +), y (abajo +), mag 0..1, run, turn (Q/E)
  read() {
    if (this.override) {
      const o = this.override;
      const m = Math.min(1, Math.hypot(o.x, o.y));
      return { x: m ? o.x / m : 0, y: m ? o.y / m : 0, mag: m, run: !!o.run, turn: 0 };
    }
    const s = this.stick;
    if (s.id !== null && s.mag > 0) {
      return { x: s.x, y: s.y, mag: s.mag, run: s.mag > 0.97, turn: this.turn() };
    }
    let x = 0, y = 0;
    for (const k of this.keys) { x += KEY_X[k] || 0; y += KEY_Y[k] || 0; }
    const m = Math.hypot(x, y);
    const run = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    return m ? { x: x / m, y: y / m, mag: 1, run, turn: this.turn() } : { x: 0, y: 0, mag: 0, run: false, turn: this.turn() };
  }
}
