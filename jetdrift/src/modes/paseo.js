// JETDrift — Modo Paseo (zen, sin objetivos)
// Solo el mundo, el hovercraft, sin reloj, sin enemigos, sin checkpoints.
// El jugador desliza y mira el cielo cambiar (Dunes) o las torres pasar (Spire).

export class PaseoMode {
  constructor() {
    this.name = 'paseo';
    this.elapsed = 0;
    this.distance = 0;
    this._lastPos = null;
  }

  spawnPoint() { return { x: 0, z: 0, yaw: 0 }; }

  build(scene, theme) {
    this.elapsed = 0;
    this.distance = 0;
    this._lastPos = null;
  }

  update(dt, hovercraft, gameState) {
    this.elapsed += dt;
    if (this._lastPos) {
      const dx = hovercraft.position.x - this._lastPos.x;
      const dz = hovercraft.position.z - this._lastPos.z;
      this.distance += Math.hypot(dx, dz);
    }
    this._lastPos = { x: hovercraft.position.x, z: hovercraft.position.z };
    return null; // No win/lose conditions
  }

  getHUD() {
    return {
      left: { label: 'Distancia', value: Math.floor(this.distance) + 'm' },
      // No right pill for paseo (zen)
      right: null,
    };
  }

  dispose(scene) {
    // Nothing to clean up
  }
}
