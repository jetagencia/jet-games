// JETDrift — Spire theme
// Cool pastel impossible geometry. Monument Valley-inspired (NOT a copy).

import * as THREE from 'three';

export class SpireTheme {
  constructor() {
    this.name = 'spire';
    this.bloomStrength = 0.35;
    this.bloomRadius = 0.5;
    this.bloomThreshold = 0.85;

    this.hovercraftColors = {
      body: 0xd4647a,         // dusty rose
      cockpit: 0xfaf0e8,      // cream
      fin: 0x7a5070,          // muted plum
      glow: 0xe8c5d8,         // pink mist
    };

    this.objects = [];
  }

  build(scene) {
    // === SKY (gradient) ===
    const skyGeom = new THREE.SphereGeometry(300, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0xb8c5e0) },     // soft blue
        midColor: { value: new THREE.Color(0xeec8d8) },     // pink mist
        botColor: { value: new THREE.Color(0xc8d5b8) },     // mint cream
      },
      vertexShader: `
        varying vec3 vWP;
        void main() {
          vWP = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor; uniform vec3 midColor; uniform vec3 botColor;
        varying vec3 vWP;
        void main() {
          float h = normalize(vWP).y;
          vec3 c;
          if (h > 0.0) c = mix(midColor, topColor, smoothstep(0.0, 0.6, h));
          else c = mix(midColor, botColor, smoothstep(0.0, -0.4, h));
          gl_FragColor = vec4(c, 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(skyGeom, skyMat);
    scene.add(sky);
    this.objects.push(sky);

    // === FOG ===
    scene.fog = new THREE.Fog(0xeec8d8, 35, 200);

    // === LIGHTING ===
    const ambient = new THREE.AmbientLight(0xeed8e8, 0.55);
    scene.add(ambient);
    this.objects.push(ambient);

    const hemi = new THREE.HemisphereLight(0xc8d5e8, 0xd4a8b8, 0.7);
    scene.add(hemi);
    this.objects.push(hemi);

    const sun = new THREE.DirectionalLight(0xfff4e8, 0.85);
    sun.position.set(40, 50, 30);
    scene.add(sun);
    this.objects.push(sun);

    // === GROUND PLANE — flat with subtle pattern ===
    const groundGeom = new THREE.PlaneGeometry(400, 400, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xc8d5b8, roughness: 0.95, metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    this.objects.push(ground);

    // === IMPOSSIBLE STRUCTURES (towers, arches, stairs) ===
    this._buildStructures(scene);
  }

  _buildStructures(scene) {
    const group = new THREE.Group();

    // Color palette per structure type
    const palette = [
      { color: 0xeec8d8, accent: 0xd4647a },   // pink/rose
      { color: 0xc8d5e8, accent: 0x6a85b0 },   // soft blue
      { color: 0xc8e0c8, accent: 0x6a9070 },   // mint
      { color: 0xf0e8c8, accent: 0xb09060 },   // cream/gold
    ];

    // Tower stacks (random heights)
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 15 + Math.random() * 55;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const p = palette[Math.floor(Math.random() * palette.length)];
      const tower = this._buildTower(p);
      tower.position.set(x, 0, z);
      tower.rotation.y = Math.random() * Math.PI * 2;
      group.add(tower);
    }

    // Floating arches (impossible geometry — arches that don't quite connect to ground)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const r = 25 + Math.random() * 30;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const p = palette[Math.floor(Math.random() * palette.length)];
      const arch = this._buildArch(p);
      arch.position.set(x, 0, z);
      arch.rotation.y = a + Math.PI / 2;
      group.add(arch);
    }

    // Stairs that lead to nowhere (decorative)
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 40;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const p = palette[Math.floor(Math.random() * palette.length)];
      const stairs = this._buildStairs(p);
      stairs.position.set(x, 0, z);
      stairs.rotation.y = Math.random() * Math.PI * 2;
      group.add(stairs);
    }

    // Distant tall spires
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = 110 + Math.random() * 40;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const h = 18 + Math.random() * 22;
      const p = palette[Math.floor(Math.random() * palette.length)];
      const mat = new THREE.MeshStandardMaterial({
        color: p.color, flatShading: true, roughness: 0.85, metalness: 0.05,
      });
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, h, 6), mat);
      spire.position.set(x, h / 2, z);
      group.add(spire);
    }

    scene.add(group);
    this.objects.push(group);
  }

  _buildTower(palette) {
    const t = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: palette.color, flatShading: true, roughness: 0.85, metalness: 0.1,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: palette.accent, flatShading: true, roughness: 0.7, metalness: 0.2,
    });
    // Stacked boxes with offsets (Monument Valley style)
    let yPos = 0;
    const stackHeight = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < stackHeight; i++) {
      const w = 3 + Math.random() * 1.5;
      const h = 1.2 + Math.random() * 0.8;
      const d = 3 + Math.random() * 1.5;
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), i === stackHeight - 1 ? accentMat : mat);
      box.position.set((Math.random() - 0.5) * 0.6, yPos + h / 2, (Math.random() - 0.5) * 0.6);
      t.add(box);
      yPos += h;
    }
    return t;
  }

  _buildArch(palette) {
    const a = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: palette.color, flatShading: true, roughness: 0.85, metalness: 0.1,
    });
    // Two columns + horizontal beam
    const colGeom = new THREE.BoxGeometry(1.2, 6, 1.2);
    const col1 = new THREE.Mesh(colGeom, mat);
    col1.position.set(-2.5, 3, 0);
    a.add(col1);
    const col2 = new THREE.Mesh(colGeom, mat);
    col2.position.set(2.5, 3, 0);
    a.add(col2);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.8, 1.2), mat);
    beam.position.set(0, 6.4, 0);
    a.add(beam);
    return a;
  }

  _buildStairs(palette) {
    const s = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: palette.color, flatShading: true, roughness: 0.85, metalness: 0.1,
    });
    const stepCount = 6;
    for (let i = 0; i < stepCount; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 1), mat);
      step.position.set(0, 0.2 + i * 0.4, i * 1.0);
      s.add(step);
    }
    return s;
  }

  update(dt, gameState) {
    // Spire is mostly static; subtle ambient breathing could be added here later
  }

  dispose(scene) {
    for (const o of this.objects) scene.remove(o);
    this.objects = [];
    scene.fog = null;
    scene.background = null;
  }
}
