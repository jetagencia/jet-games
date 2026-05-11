// JETDrift — Stub mode for unimplemented modes (Cacería/Sombra/Cosecha/Tránsito)
// Just lets you wander. Shows "coming soon" hint.

export class StubMode {
  constructor(name) {
    this.name = name;
    this.elapsed = 0;
  }

  spawnPoint() { return { x: 0, z: 0, yaw: 0 }; }

  build(scene, theme) {
    this.elapsed = 0;
    // Show a "coming soon" toast briefly
    const hint = document.getElementById('hint');
    if (hint) {
      hint.textContent = `Modo "${this.name}" en construcción · paseo libre`;
      hint.style.opacity = '1';
      setTimeout(() => { hint.style.opacity = '0'; }, 4500);
    }
  }

  update(dt, hovercraft, gameState) {
    this.elapsed += dt;
    return null;
  }

  getHUD() {
    return {
      left: { label: 'Próximamente', value: this.name },
      right: null,
    };
  }

  dispose(scene) {}
}
