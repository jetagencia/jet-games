// JETDrift — Input layer (joystick flotante + double tap boost)

const JOY_RADIUS = 70;
const DOUBLE_TAP_MS = 300;

export class Input {
  constructor() {
    this.dx = 0; this.dy = 0;
    this.active = false;
    this.boostActive = false;
    this.boostTimer = 0;
    this.boostEnergy = 100;

    this._origin = { x: 0, y: 0 };
    this._cur = { x: 0, y: 0 };
    this._touchId = null;
    this._lastTap = 0;

    this._joystick = document.getElementById('joystick');
    this._thumb = document.getElementById('joystick-thumb');
    this._touchZone = document.getElementById('touch-left');

    this._bind();
  }

  _bind() {
    const z = this._touchZone;
    z.addEventListener('touchstart', e => this._down(e), { passive: false });
    z.addEventListener('touchmove', e => this._move(e), { passive: false });
    z.addEventListener('touchend', e => this._up(e), { passive: false });
    z.addEventListener('touchcancel', e => this._up(e), { passive: false });

    let mDown = false;
    z.addEventListener('mousedown', e => { mDown = true; this._mdown(e); });
    document.addEventListener('mousemove', e => { if (mDown) this._mmove(e); });
    document.addEventListener('mouseup', () => { if (mDown) { mDown = false; this._mup(); } });
  }

  _down(e) {
    e.preventDefault();
    const t = e.changedTouches[0]; if (!t) return;
    this._origin.x = t.clientX; this._origin.y = t.clientY;
    this._cur.x = t.clientX; this._cur.y = t.clientY;
    this._touchId = t.identifier;
    this.active = true;
    this._showJoy();
    this._checkDoubleTap();
  }
  _move(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === this._touchId) {
        this._cur.x = t.clientX; this._cur.y = t.clientY;
        this._updateThumb();
        return;
      }
    }
  }
  _up(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === this._touchId) {
        this._reset();
        return;
      }
    }
  }
  _mdown(e) {
    this._origin.x = e.clientX; this._origin.y = e.clientY;
    this._cur.x = e.clientX; this._cur.y = e.clientY;
    this.active = true;
    this._showJoy();
    this._checkDoubleTap();
  }
  _mmove(e) { this._cur.x = e.clientX; this._cur.y = e.clientY; this._updateThumb(); }
  _mup() { this._reset(); }

  _checkDoubleTap() {
    const now = performance.now();
    if (now - this._lastTap < DOUBLE_TAP_MS && this.boostEnergy > 25 && this.boostTimer <= 0) {
      this.boostActive = true;
      this.boostTimer = 0.7;
      if (navigator.vibrate) navigator.vibrate(20);
      this._joystick.classList.add('boost');
    }
    this._lastTap = now;
  }

  _showJoy() {
    this._joystick.style.left = this._origin.x + 'px';
    this._joystick.style.top = this._origin.y + 'px';
    this._joystick.classList.add('active');
    this._updateThumb();
  }

  _updateThumb() {
    let dx = this._cur.x - this._origin.x;
    let dy = this._cur.y - this._origin.y;
    const len = Math.hypot(dx, dy);
    if (len > JOY_RADIUS) { dx = dx / len * JOY_RADIUS; dy = dy / len * JOY_RADIUS; }
    this.dx = dx / JOY_RADIUS;
    this.dy = dy / JOY_RADIUS;
    this._thumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  _reset() {
    this.active = false;
    this._touchId = null;
    this.dx = 0; this.dy = 0;
    this._joystick.classList.remove('active');
    this._joystick.classList.remove('boost');
    this._thumb.style.transform = 'translate(-50%, -50%)';
  }

  update(dt) {
    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      this.boostEnergy = Math.max(0, this.boostEnergy - dt * 50);
      if (this.boostTimer <= 0 || this.boostEnergy <= 0) {
        this.boostTimer = 0;
        this.boostActive = false;
        this._joystick.classList.remove('boost');
      }
    } else {
      this.boostEnergy = Math.min(100, this.boostEnergy + dt * 18);
    }
  }
}
