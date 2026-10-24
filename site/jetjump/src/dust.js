// Arena que vuela: cada casco que apoya en la pista levanta una nube que crece, sube un poco y se apaga.
import * as THREE from 'three';

const MAX = 420;
export class Dust {
  constructor(scene) {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAX * 3); this.vel = new Float32Array(MAX * 3);
    this.life = new Float32Array(MAX); this.max = new Float32Array(MAX); this.size = new Float32Array(MAX);
    this.aSize = new Float32Array(MAX); this.aAlpha = new Float32Array(MAX);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.aSize, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.aAlpha, 1));
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, color: { value: new THREE.Color(0.86, 0.74, 0.58) }, scale: { value: 600 } },
      vertexShader: `attribute float aSize; attribute float aAlpha; varying float vA; uniform float scale;
        void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aAlpha > 0.0 ? clamp(aSize * scale / max(0.1, -mv.z), 0.0, 256.0) : 0.0; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 color; varying float vA;
        void main(){ float a = texture2D(map, gl_PointCoord).a * vA; if (!(a >= 0.01)) discard; gl_FragColor = vec4(color, a); }`,
      transparent: true, depthWrite: false,
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.layers.set(1);
    scene.add(this.points);
    this.i = 0; this.prev = [1, 1, 1, 1];
  }
  setScale(h) { this.mat.uniforms.scale.value = h * 0.8; }
  spawn(p, dir, n, strength) {
    for (let k = 0; k < n; k++) {
      const i = this.i = (this.i + 1) % MAX;
      this.pos[i * 3] = p.x + (Math.random() - 0.5) * 0.25; this.pos[i * 3 + 1] = 0.05; this.pos[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.25;
      const s = strength * (0.6 + Math.random() * 0.8);
      this.vel[i * 3] = -dir.x * s * 0.8 + (Math.random() - 0.5) * s; this.vel[i * 3 + 1] = 0.35 * s + Math.random() * 0.4 * s; this.vel[i * 3 + 2] = -dir.z * s * 0.8 + (Math.random() - 0.5) * s;
      this.max[i] = this.life[i] = 0.7 + Math.random() * 0.9 * strength; this.size[i] = 0.25 + Math.random() * 0.25;
    }
  }
  // ráfaga corta por apoyo (evento de contacto del caballo): cantidad según impacto y velocidad, con variación
  contact(c, speed) {
    const dir = { x: Math.sin(c.ang), z: Math.cos(c.ang) };
    if (c.landing) { this.spawn(c.pos, dir, 6 + (Math.random() * 4 | 0), 1.2 + Math.random() * 0.3); return; }
    if (speed < 2.5) { if (Math.random() < 0.35) this.spawn(c.pos, dir, 1, 0.35); return; }
    this.spawn(c.pos, dir, 1 + (Math.random() * (speed > 5 ? 3 : 2) | 0), Math.min(1, speed / 7) * (0.7 + Math.random() * 0.5));
  }
  update(dt) {
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) { this.aAlpha[i] = 0; continue; }
      this.life[i] -= dt;
      // al terminar su vida se apaga en este mismo cuadro: con k > 1, (1 − k) ** 1,4 daba NaN y la
      // partícula se dibujaba como un cuadrado negro enorme (los «bloques negros» de algunos cuadros)
      if (this.life[i] <= 0) { this.life[i] = 0; this.aAlpha[i] = 0; continue; }
      const k = Math.min(1, 1 - this.life[i] / this.max[i]);
      this.vel[i * 3 + 1] -= 0.6 * dt; const drag = Math.exp(-dt * 2.2);
      for (let a = 0; a < 3; a++) { this.vel[i * 3 + a] *= drag; this.pos[i * 3 + a] += this.vel[i * 3 + a] * dt; }
      if (this.pos[i * 3 + 1] < 0.03) this.pos[i * 3 + 1] = 0.03;
      this.aSize[i] = this.size[i] * (1 + k * 3.2);
      this.aAlpha[i] = 0.42 * Math.sin(Math.min(1, k * 4) * Math.PI / 2) * (1 - k) ** 1.4;
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true; g.attributes.aSize.needsUpdate = true; g.attributes.aAlpha.needsUpdate = true;
  }
}
