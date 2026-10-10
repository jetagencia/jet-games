// JETJump — mundo 3D: pista, vallas, público, cielo, cámaras y efectos.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const ASSET_BASE = new URL('../assets/', import.meta.url).href;

// Gradación final: viñeta suave, grano fino, leve contraste. Trabaja en sRGB tras el OutputPass.
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vignette: { value: 0.32 }, grain: { value: 0.035 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, vignette, grain; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5; float v = 1.0 - smoothstep(0.35, 0.95, length(d) * 1.25) * vignette;
      c.rgb *= v;
      c.rgb = (c.rgb - 0.5) * 1.04 + 0.5;
      c.rgb += (hash(vUv * 1000.0) - 0.5) * grain;
      gl_FragColor = c; }`,
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const SCHEME_COLORS = {
  red: [0xc62828, 0xffffff], blue: [0x1e4fa3, 0xffffff], green: [0x2e7d32, 0xffffff], gold: [0xd4a017, 0x1b1b1b],
  navy: [0x14204a, 0xf5e9c8], orange: [0xe07b1a, 0xffffff], teal: [0x138d8d, 0xffffff], black: [0x1a1a1a, 0xffffff],
};

function noiseCanvas(size, base, fn) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  const img = g.getImageData(0, 0, size, size), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const x = (i / 4) % size, y = Math.floor(i / 4 / size);
    const k = fn(x, y);
    d[i] = clamp(d[i] * k[0], 0, 255); d[i + 1] = clamp(d[i + 1] * k[1], 0, 255); d[i + 2] = clamp(d[i + 2] * k[2], 0, 255);
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
// Busca el píxel más brillante del HDR y lo convierte en dirección de luz.
function sunFromEquirect(t) {
  const img = t.image, w = img.width, h = img.height, d = img.data, ch = d.length / (w * h);
  const half = t.type === THREE.HalfFloatType;
  const toF = half ? (v) => { const s = (v & 0x8000) ? -1 : 1, e = (v >> 10) & 0x1f, f = v & 0x3ff; return e === 0 ? s * Math.pow(2, -14) * (f / 1024) : s * Math.pow(2, e - 15) * (1 + f / 1024); } : (v) => v;
  let best = -1, bx = 0, by = 0;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
    const i = (y * w + x) * ch; const l = toF(d[i]) + toF(d[i + 1]) + toF(d[i + 2]);
    if (l > best) { best = l; bx = x; by = y; }
  }
  const u = bx / w, v = t.flipY ? 1 - by / h : by / h;
  const phi = (u - 0.5) * Math.PI * 2, theta = (v - 0.5) * Math.PI;
  return new THREE.Vector3(Math.cos(phi) * Math.cos(theta), Math.sin(theta), Math.sin(phi) * Math.cos(theta));
}
function h2(x, y) { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); }

function textTexture(text, { w = 256, h = 128, bg = '#ffffff', fg = '#111', font = 'bold 90px Poppins, sans-serif' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export class World {
  constructor(canvas, opts = {}) {
    this.quality = opts.quality || 'high';
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.quality !== 'low', powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === 'high' ? 2 : 1.25));
    r.shadowMap.enabled = this.quality !== 'low'; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.08;
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 800);
    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    if (this.quality === 'high') {
      this.gtao = new GTAOPass(this.scene, this.camera, 1, 1);
      this.gtao.output = GTAOPass.OUTPUT.Default;
      this.gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.2, thickness: 1.0, scale: 1.0, samples: 12, distanceFallOff: 1.0, screenSpaceRadius: false });
      this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 12 });
      this.gtao.blendIntensity = 0.85;
      this.composer.addPass(this.gtao);
    }
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.16, 0.6, 0.9);
    if (this.quality !== 'low') this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader); this.composer.addPass(this.grade);
    if (this.quality !== 'low') { this.smaa = new SMAAPass(1, 1); this.composer.addPass(this.smaa); }
    this.assets = this.loadAssets();
    this.camPos = new THREE.Vector3(0, 3, 10); this.camLook = new THREE.Vector3(); this.shake = 0; this.camMode = opts.cam || 'chase';
    this.fenceGroups = []; this.rails = []; this.falling = []; this.env = null; this.courseGroup = null;
    this.crowd = null; this.t = 0; this.cheerLevel = 0;
    this.tmp = new THREE.Vector3(); this.tmp2 = new THREE.Vector3();
    this.initParticles();
    this.resize();
  }

  resize() {
    const c = this.renderer.domElement;
    const w = c.clientWidth || window.innerWidth, h = c.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w * this.renderer.getPixelRatio(), h * this.renderer.getPixelRatio());
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    const pr = this.renderer.getPixelRatio();
    if (this.gtao) this.gtao.setSize(w * pr, h * pr);
    if (this.smaa) this.smaa.setSize(w * pr, h * pr);
  }

  async loadAssets() {
    const tl = new THREE.TextureLoader();
    const tex = (name, srgb = true, rep = 1) => new Promise((res) => tl.load(ASSET_BASE + 'tex/' + name, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, () => res(null)));
    const hdr = (name) => new Promise((res) => new RGBELoader().load(ASSET_BASE + 'hdr/' + name, (t) => { t.mapping = THREE.EquirectangularReflectionMapping; res(t); }, undefined, () => res(null)));
    const [grass, grassN, wood, woodB, brick, brickB, waterN, hOut, hIn] = await Promise.all([
      tex('grass.jpg', true, 90), tex('grass_nm.jpg', false, 90), tex('wood.jpg', true, 1), tex('wood_bump.jpg', false, 1), tex('brick.jpg', true, 1), tex('brick_bump.jpg', false, 1), tex('water_nm.jpg', false, 4), hdr('outdoor.hdr'), hdr('indoor.hdr'),
    ]);
    const pm = new THREE.PMREMGenerator(this.renderer); pm.compileEquirectangularShader();
    const envOut = hOut ? pm.fromEquirectangular(hOut).texture : null;
    const envIn = hIn ? pm.fromEquirectangular(hIn).texture : null;
    pm.dispose();
    this.A = { grass, grassN, wood, woodB, brick, brickB, waterN, hOut, hIn, envOut, envIn, sunDir: hOut ? sunFromEquirect(hOut) : null };
    return this.A;
  }

  dispose(group) {
    group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); } });
  }

  // ---------------------------------------------------------------- entorno
  buildEnvironment(course) {
    if (this.env) { this.scene.remove(this.env); this.dispose(this.env); }
    const env = this.env = new THREE.Group();
    const A = course.arena, indoor = course.indoor;
    const T = this.A || {};
    this.scene.fog = indoor ? new THREE.Fog(0x1a1f2a, 60, 160) : new THREE.FogExp2(0xd8e3ea, 0.0038);
    this.scene.environment = indoor ? (T.envIn || null) : (T.envOut || null);

    // arena
    const sand = noiseCanvas(512, '#c9ad7a', (x, y) => { const n = 0.9 + 0.2 * h2(x, y) + 0.08 * Math.sin(x * 0.2) * Math.sin(y * 0.17); return [n, n * 0.99, n * 0.95]; });
    sand.repeat.set(A.w / 4, A.h / 4);
    const sandN = noiseCanvas(512, '#8080ff', (x, y) => { const dx = h2(x + 1, y) - h2(x - 1, y), dy = h2(x, y + 1) - h2(x, y - 1); return [1 + dx * 0.35, 1 + dy * 0.35, 1]; }); sandN.colorSpace = THREE.NoColorSpace; sandN.repeat.set(A.w / 3, A.h / 3);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(A.w, A.h, 1, 1), new THREE.MeshStandardMaterial({ map: sand, normalMap: sandN, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.96, color: indoor ? 0xd0b890 : 0xffffff, envMapIntensity: 0.5 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; env.add(ground);

    // borde de pista: tablas blancas
    const railMat = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.55, bumpMap: T.woodB || null, bumpScale: 0.01 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e2, roughness: 0.65, bumpMap: T.woodB || null, bumpScale: 0.01 });
    const edges = [[-A.w / 2, -A.h / 2, A.w / 2, -A.h / 2], [A.w / 2, -A.h / 2, A.w / 2, A.h / 2], [A.w / 2, A.h / 2, -A.w / 2, A.h / 2], [-A.w / 2, A.h / 2, -A.w / 2, -A.h / 2]];
    for (const [x0, z0, x1, z1] of edges) {
      const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0);
      for (const y of [0.45, 0.95]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.05), railMat);
        m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.rotation.y = -ang; m.castShadow = true; env.add(m);
      }
      const n = Math.round(len / 3);
      for (let i = 0; i <= n; i++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), postMat);
        p.position.set(x0 + (x1 - x0) * i / n, 0.55, z0 + (z1 - z0) * i / n); p.castShadow = true; env.add(p);
      }
    }

    if (!indoor) {
      // césped exterior y cielo
      const grass = T.grass || noiseCanvas(256, '#5f8f3a', (x, y) => { const n = 0.85 + 0.3 * h2(x, y); return [n, n, n]; });
      if (!T.grass) grass.repeat.set(120, 120);
      const field = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ map: grass, normalMap: T.grassN || null, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 1, color: 0xc8d8b0 }));
      field.rotation.x = -Math.PI / 2; field.position.y = -0.02; field.receiveShadow = true; env.add(field);
      this.scene.background = null;
      const sky = new THREE.Mesh(new THREE.SphereGeometry(380, 24, 12), new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false,
        uniforms: { top: { value: new THREE.Color(0x1f5fb8) }, hor: { value: new THREE.Color(0xe6eef5) }, sun: { value: (T.sunDir ? new THREE.Vector3(T.sunDir.x, Math.max(T.sunDir.y, 0.28), T.sunDir.z) : new THREE.Vector3(0.55, 0.5, 0.3)).normalize() } },
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 top, hor, sun; varying vec3 vP; void main(){ float t = clamp(vP.y*1.5, 0.0, 1.0); vec3 c = mix(hor, top, pow(t, 0.55)); float d = max(dot(vP, sun), 0.0); c += vec3(1.0, 0.93, 0.78) * pow(d, 260.0) * 2.2; c += vec3(1.0,0.86,0.62) * pow(d, 5.0) * 0.18; c = mix(c, vec3(0.98,0.94,0.9), (1.0 - t) * 0.25); gl_FragColor = vec4(c, 1.0); }',
      }));
      env.add(sky);
      // nubes: sprites planos
      const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false });
      for (let i = 0; i < 14; i++) {
        const c = new THREE.Group();
        const n = 3 + Math.floor(h2(i, 1) * 4);
        for (let k = 0; k < n; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(6 + h2(i, k) * 8, 10, 7), cloudMat); s.position.set(k * 7 - n * 3, h2(k, i) * 3, h2(i + 2, k) * 4); s.scale.y = 0.5; c.add(s); }
        const a = h2(i, 7) * Math.PI * 2;
        c.position.set(Math.cos(a) * (180 + h2(i, 9) * 120), 70 + h2(i, 3) * 40, Math.sin(a) * (180 + h2(i, 9) * 120));
        env.add(c);
      }
      // árboles alrededor
      const trunk = new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.9 });
      const leaf = new THREE.MeshStandardMaterial({ color: 0x2b5e26, roughness: 0.95, flatShading: true });
      const leaf2 = new THREE.MeshStandardMaterial({ color: 0x3f7a2c, roughness: 0.95, flatShading: true });
      const treeGeo = new THREE.IcosahedronGeometry(1, 2);
      { const pp = treeGeo.getAttribute('position'); for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i); const k = 0.82 + 0.36 * h2(Math.round(x * 7) + 3, Math.round(y * 5) + Math.round(z * 9)); pp.setXYZ(i, x * k, y * k * 0.9, z * k); } treeGeo.computeVertexNormals(); }
      for (let i = 0; i < 70; i++) {
        const a = h2(i, 11) * Math.PI * 2, rad = Math.max(A.w, A.h) * 0.75 + 18 + h2(i, 12) * 60;
        const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
        if (z < -A.h / 2 - 8 && Math.abs(x) < A.w / 2 + 10) continue; // dejar lugar a la tribuna
        const t = new THREE.Group(); t.position.set(x, 0, z);
        const hgt = 5 + h2(i, 13) * 7;
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, hgt, 7), trunk); tr.position.y = hgt / 2; t.add(tr);
        for (let k = 0; k < 4; k++) { const l = new THREE.Mesh(treeGeo, k % 2 ? leaf : leaf2); const s = 2.6 + h2(i, 20 + k) * 2.8; l.scale.set(s, s * 0.9, s); l.position.set((h2(i, 30 + k) - 0.5) * 3, hgt + (k - 1) * 1.5, (h2(i, 40 + k) - 0.5) * 3); l.castShadow = true; t.add(l); }
        env.add(t);
      }
    } else {
      // pabellón cubierto
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.9 });
      const W = A.w + 24, H = A.h + 24;
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: 0.95 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; floor.receiveShadow = true; env.add(floor);
      const walls = [[0, -H / 2, W, 0], [0, H / 2, W, 0], [-W / 2, 0, H, Math.PI / 2], [W / 2, 0, H, Math.PI / 2]];
      for (const [x, z, len, ry] of walls) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(len, 14, 0.5), wallMat); m.position.set(x, 7, z); m.rotation.y = ry; m.receiveShadow = true; env.add(m);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(W, 0.5, H), new THREE.MeshStandardMaterial({ color: 0x1b1e26, roughness: 1 })); roof.position.y = 14; env.add(roof);
      const truss = new THREE.MeshStandardMaterial({ color: 0x8a8f99, metalness: 0.7, roughness: 0.4 });
      for (let i = -3; i <= 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, H), truss); b.position.set(i * W / 7, 13.2, 0); env.add(b); }
      // banners
      for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(new THREE.PlaneGeometry(10, 3), new THREE.MeshBasicMaterial({ map: textTexture(['JET GAMES', 'JETJump', 'JETBALL', 'JETDrift', 'JETFlow', 'JETSlalom'][i], { w: 1024, h: 300, bg: i % 2 ? '#14204a' : '#d9b35b', fg: i % 2 ? '#f3ead6' : '#14204a', font: 'bold 150px Poppins, sans-serif' }) }));
        b.position.set(-W / 2 + 14 + i * (W - 28) / 5, 9, -H / 2 + 0.3); env.add(b);
      }
      // luces del pabellón (geometría emisiva, iluminación real con las direccionales)
      const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
      for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) { const l = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 1.2), lampMat); l.position.set(i * W / 5.5, 13.5, j * H / 3.2); env.add(l); }
    }

    // tribuna lado norte (z negativo)
    this.buildStands(env, A, indoor);

    // carteles sobre el borde sur
    const names = ['JET GAMES', 'JETJump', 'JETBALL', 'JETDrift'];
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.0), new THREE.MeshStandardMaterial({ map: textTexture(names[i], { w: 1024, h: 150, bg: i % 2 ? '#14204a' : '#d9b35b', fg: i % 2 ? '#f3ead6' : '#14204a', font: 'bold 110px Poppins, sans-serif' }), roughness: 0.7 }));
      b.position.set(-A.w / 2 + 12 + i * (A.w - 24) / 3, 0.55, A.h / 2 + 0.35); b.rotation.y = Math.PI; env.add(b);
    }

    // luces
    const sun = this.sun = new THREE.DirectionalLight(indoor ? 0xfff2e0 : 0xfff0d8, indoor ? 2.4 : 3.8);
    if (!indoor && T.sunDir) { const dir = T.sunDir.clone(); dir.y = Math.max(dir.y, 0.28); sun.position.copy(dir.normalize().multiplyScalar(120)); }
    else sun.position.set(indoor ? 20 : 60, indoor ? 30 : 80, indoor ? 10 : 35);
    sun.castShadow = this.quality !== 'low';
    const S = this.quality === 'high' ? 4096 : 2048;
    sun.shadow.mapSize.set(S, S);
    const ext = Math.max(A.w, A.h) * 0.62;
    sun.shadow.camera.left = -ext; sun.shadow.camera.right = ext; sun.shadow.camera.top = ext; sun.shadow.camera.bottom = -ext;
    sun.shadow.camera.near = 10; sun.shadow.camera.far = 260; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
    env.add(sun); env.add(sun.target);
    const hemi = new THREE.HemisphereLight(indoor ? 0xdfe6ff : 0xbfd8ff, indoor ? 0x3a3a3a : 0x8a7a55, indoor ? 1.0 : 1.15);
    env.add(hemi);
    if (indoor) { const fill = new THREE.DirectionalLight(0xe8f0ff, 1.0); fill.position.set(-30, 25, -20); env.add(fill); }
    if (indoor) this.scene.background = new THREE.Color(0x1a1f2a);
    this.scene.add(env);
  }

  buildStands(env, A, indoor) {
    const g = new THREE.Group();
    const z0 = -A.h / 2 - 3;
    const len = A.w * 0.9, rows = 7;
    const stepMat = new THREE.MeshStandardMaterial({ color: indoor ? 0x3b4252 : 0x9aa3ad, roughness: 0.9 });
    for (let r = 0; r < rows; r++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5 + r * 0.55, 1.1), stepMat);
      s.position.set(0, (0.5 + r * 0.55) / 2, z0 - r * 1.1); s.receiveShadow = true; s.castShadow = true; g.add(s);
    }
    // público instanciado
    const n = 46 * rows;
    const geo = new THREE.CapsuleGeometry(0.22, 0.5, 3, 6);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
    const crowd = this.crowd = new THREE.InstancedMesh(geo, mat, n);
    crowd.castShadow = true;
    const heads = this.heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshStandardMaterial({ roughness: 0.8 }), n);
    const skins = [0xf1d3b3, 0xd9a27e, 0xb87a56, 0x8a5a3c, 0x5c3a28, 0xf6e0c8];
    const col = new THREE.Color();
    const palette = [0xd9b35b, 0x14204a, 0xf3ead6, 0xc62828, 0x2e7d32, 0x5a2d0c, 0x8899cc, 0x222222, 0xe07b1a, 0x7a3a5a];
    this.crowdBase = [];
    const m = new THREE.Matrix4();
    let i = 0;
    for (let r = 0; r < rows; r++) for (let k = 0; k < 46; k++) {
      const x = -len / 2 + 1 + k * (len - 2) / 45 + (h2(k, r) - 0.5) * 0.4;
      const y = 0.5 + r * 0.55 + 0.45, z = z0 - r * 1.1 + 0.1;
      this.crowdBase.push({ x, y, z, ph: h2(r, k) * 6.28, s: 0.85 + h2(k + 3, r) * 0.3 });
      m.makeTranslation(x, y, z); crowd.setMatrixAt(i, m);
      col.setHex(palette[Math.floor(h2(k * 3, r * 7) * palette.length)]); crowd.setColorAt(i, col);
      m.makeTranslation(x, y + 0.5, z); heads.setMatrixAt(i, m);
      col.setHex(skins[Math.floor(h2(k * 5 + 1, r * 3) * skins.length)]); heads.setColorAt(i, col);
      i++;
    }
    crowd.instanceMatrix.needsUpdate = true; crowd.instanceColor.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true; heads.instanceColor.needsUpdate = true;
    g.add(crowd); g.add(heads);
    // techo de la tribuna
    const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 2, 0.12, rows * 1.1 + 2), new THREE.MeshStandardMaterial({ color: indoor ? 0x2a2f3a : 0x1f3b2a, roughness: 0.5, metalness: 0.2 }));
    roof.position.set(0, rows * 0.55 + 3.2, z0 - rows * 1.1 / 2 + 0.5); roof.castShadow = true; g.add(roof);
    for (const x of [-len / 2, 0, len / 2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, rows * 0.55 + 3.2, 8), stepMat); p.position.set(x, (rows * 0.55 + 3.2) / 2, z0 - rows * 1.1 + 0.2); g.add(p); }
    // palco de jueces
    const box = new THREE.Mesh(new THREE.BoxGeometry(4, 2.6, 2.5), new THREE.MeshStandardMaterial({ color: 0xf3ead6, roughness: 0.6 }));
    box.position.set(A.w / 2 + 3.5, 2.3, 0); box.castShadow = true; g.add(box);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.8), new THREE.MeshBasicMaterial({ map: textTexture('JURADO', { w: 512, h: 110, bg: '#14204a', fg: '#d9b35b', font: 'bold 80px Poppins, sans-serif' }) }));
    sign.position.set(A.w / 2 + 2.2, 3.2, 0); sign.rotation.y = -Math.PI / 2; g.add(sign);
    env.add(g);
  }

  // ---------------------------------------------------------------- vallas
  setCourse(course) {
    this.course = course;
    if (!this.env || this.envKey !== course.layout + course.indoor) { this.buildEnvironment(course); this.envKey = course.layout + course.indoor; }
    if (this.courseGroup) { this.scene.remove(this.courseGroup); this.dispose(this.courseGroup); }
    const G = this.courseGroup = new THREE.Group();
    this.fenceGroups = []; this.rails = []; this.falling = [];
    this.mats = {
      white: new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.55 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.8, map: (this.A && this.A.wood) || null, bumpMap: (this.A && this.A.woodB) || null, bumpScale: 0.01 }),
      water: new THREE.MeshPhysicalMaterial({ color: 0x2a7fc4, roughness: 0.05, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.92, normalMap: (this.A && this.A.waterN) || null, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 1.4 }),
      hedge: new THREE.MeshStandardMaterial({ color: 0x2d6a2e, roughness: 1 }),
      brick: new THREE.MeshStandardMaterial({ color: 0xb8705c, roughness: 0.85, map: (this.A && this.A.brick) || null, bumpMap: (this.A && this.A.brickB) || null, bumpScale: 0.02 }),
      brick2: new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.85, map: (this.A && this.A.brick) || null, bumpMap: (this.A && this.A.brickB) || null, bumpScale: 0.02 }),
      flowerPink: new THREE.MeshStandardMaterial({ color: 0xe84f8a, roughness: 0.9 }), flowerYellow: new THREE.MeshStandardMaterial({ color: 0xf2c94c, roughness: 0.9 }), flowerWhite: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.9 }),
      leaf: new THREE.MeshStandardMaterial({ color: 0x3f7a2e, roughness: 1 }),
    };
    for (const E of course.elements) G.add(this.buildFence(E));
    G.add(this.buildLine(course.start, 'start')); G.add(this.buildLine(course.finish, 'finish'));
    // marcador de próxima valla
    this.marker = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 10, 32), new THREE.MeshBasicMaterial({ color: 0xffd36b }));
    this.marker.rotation.x = Math.PI / 2; this.marker.visible = false; G.add(this.marker);
    this.markerLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture('1', { w: 128, h: 128, bg: '#14204a', fg: '#ffd36b', font: 'bold 84px Poppins' }), depthTest: false }));
    this.markerLabel.scale.set(1.2, 1.2, 1); this.markerLabel.visible = false; G.add(this.markerLabel);
    this.scene.add(G);
    if (this.sun) { this.sun.target.position.set(0, 0, 0); }
  }

  stripedRail(len, c1, c2, r = 0.05) {
    const g = new THREE.CylinderGeometry(r, r, len, 12, 1);
    g.rotateX(Math.PI / 2); // a lo largo de Z
    const pos = g.getAttribute('position'), n = pos.count, col = new Float32Array(n * 3);
    const A = new THREE.Color(c1), B = new THREE.Color(c2);
    for (let i = 0; i < n; i++) { const z = pos.getZ(i); const band = Math.floor((z + len / 2) / (len / 5)) % 2; const c = band ? B : A; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }));
    m.castShadow = true; return m;
  }

  buildFence(E) {
    const g = new THREE.Group();
    g.position.set(E.x, 0, E.z); g.rotation.y = -E.th;
    const [c1, c2] = SCHEME_COLORS[E.scheme] || SCHEME_COLORS.red;
    const colMat = new THREE.MeshStandardMaterial({ color: c1, roughness: 0.55 });
    const half = E.half, M = this.mats;
    const railsForEl = [];
    E.planes.forEach((p, pi) => {
      const planeRails = [];
      const ph = E.bigWall ? p.h : p.h;
      // postes con tazas
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, ph + 0.5, 0.12), pi % 2 ? colMat : M.white);
        post.position.set(p.o, (ph + 0.5) / 2, s * (half + 0.12)); post.castShadow = true; g.add(post);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.25), M.white); foot.position.set(p.o, 0.03, s * (half + 0.12)); g.add(foot);
      }
      if (E.type === 'w') {
        // muro de bloques
        const rows = Math.round(ph / 0.25);
        for (let r = 0; r < rows; r++) {
          const y = r * 0.25 + 0.125;
          const nb = 7, bw = (2 * half) / nb;
          for (let b = 0; b < nb; b++) {
            const off = r % 2 ? bw / 2 : 0;
            const z = -half + b * bw + bw / 2 + off;
            if (z + bw / 2 > half + 0.01) continue;
            const blk = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, bw - 0.02), r % 3 === 2 ? M.brick2 : M.brick);
            blk.position.set(p.o, y, z); blk.castShadow = true; blk.receiveShadow = true; g.add(blk);
            if (r === rows - 1) planeRails.push(blk);
          }
        }
      } else if (E.type === 'water') {
        const w = E.water.end - E.water.start;
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(w, 2 * half + 0.2), M.water);
        pool.rotation.x = -Math.PI / 2; pool.position.set(E.water.start + w / 2, 0.012, 0); g.add(pool);
        const hedge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 2 * half), M.hedge); hedge.position.set(0, 0.25, 0); hedge.castShadow = true; g.add(hedge);
        const tape = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 2 * half + 0.2), M.white); tape.position.set(E.water.end, 0.02, 0); g.add(tape);
        const lip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 2 * half + 0.2), M.wood); lip.position.set(E.water.end + 0.06, 0.05, 0); g.add(lip);
      } else {
        // barras
        let y = ph;
        let first = true;
        const bottom = E.type === 'l' ? ph - 0.45 : 0.3;
        while (y > bottom - 0.01) {
          const rail = this.stripedRail(2 * half + 0.16, c1, c2);
          rail.position.set(p.o, y, 0); g.add(rail);
          if (first) planeRails.push(rail);
          first = false;
          y -= (E.type === 'o' && pi === 1) ? 0.45 : 0.4;
          if (E.type === 't' && pi < 2) break;
          if (E.type === 'o' && pi === 1 && y < ph - 0.5) break;
        }
        if (E.type === 'g') {
          // tranquera: tablas horizontales blancas y listones
          for (let k = 0; k < 3; k++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 2 * half), M.white); pl.position.set(p.o, ph - 0.25 - k * 0.3, 0); pl.castShadow = true; g.add(pl); }
          for (let k = -2; k <= 2; k++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.05, ph - 0.2, 0.08), M.white); v.position.set(p.o, (ph - 0.2) / 2, k * half / 2.4); g.add(v); }
        }
        if (E.type === 'l') {
          const tray = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2 * half), M.water); tray.rotation.x = -Math.PI / 2; tray.position.set(0.9, 0.012, 0); g.add(tray);
          const rim = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 2 * half + 0.1), new THREE.MeshStandardMaterial({ color: 0x1f2a44, roughness: 0.7 })); rim.position.set(0.9, 0.0, 0); g.add(rim);
        }
      }
      railsForEl.push(planeRails);
    });
    // alas / rellenos en el primer plano y último
    const wingPlanes = E.planes.length > 1 ? [E.planes[0], E.planes[E.planes.length - 1]] : [E.planes[0]];
    for (const p of wingPlanes) for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.35, 0.7), colMat);
      wing.position.set(p.o, 0.675, s * (half + 0.55)); wing.castShadow = true; g.add(wing);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.72), new THREE.MeshStandardMaterial({ color: c2, roughness: 0.6 }));
      stripe.position.set(p.o, 0.9, s * (half + 0.55)); g.add(stripe);
    }
    // línea de tierra con flores
    if (E.type !== 'water') {
      const fl = [M.flowerPink, M.flowerYellow, M.flowerWhite];
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 2 * half), M.leaf); box.position.set(-0.45, 0.15, 0); box.castShadow = true; g.add(box);
      for (let k = 0; k < 16; k++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 7, 5), fl[k % 3]);
        f.position.set(-0.45 + (h2(k, E.idx) - 0.5) * 0.3, 0.34 + h2(k, 5) * 0.08, -half + 0.15 + k * (2 * half - 0.3) / 15); g.add(f);
      }
    }
    // número
    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.42), new THREE.MeshStandardMaterial({ map: textTexture(E.label, { w: 256, h: 215, bg: '#fffdf5', fg: '#14204a', font: 'bold 150px Poppins, sans-serif' }), roughness: 0.6, side: THREE.DoubleSide }));
    board.position.set(E.planes[0].o - 0.08, 1.15, half + 0.56); board.rotation.y = -Math.PI / 2; g.add(board);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.05), M.white); stand.position.set(E.planes[0].o - 0.08, 0.5, half + 0.56); g.add(stand);
    g.userData.E = E;
    this.fenceGroups[E.idx] = g;
    this.rails[E.idx] = railsForEl;
    return g;
  }

  buildLine(line, kind) {
    const g = new THREE.Group();
    g.position.set(line.x, 0, line.z); g.rotation.y = -line.th;
    const flag = (z, color) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), this.mats.white); pole.position.set(0, 1.1, z); g.add(pole);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.4), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.7 }));
      f.position.set(0, 1.95, z + (z > 0 ? -0.3 : 0.3)); f.rotation.y = Math.PI / 2; g.add(f);
      g.userData.flags = (g.userData.flags || []).concat(f);
    };
    flag(line.half, 0xd32f2f); flag(-line.half, 0xffffff);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: textTexture(kind === 'start' ? 'SALIDA' : 'LLEGADA', { w: 512, h: 128, bg: kind === 'start' ? '#2e7d32' : '#c62828', fg: '#ffffff', font: 'bold 90px Poppins, sans-serif' }), side: THREE.DoubleSide }));
    tag.position.set(0, 2.3, line.half); tag.rotation.y = Math.PI / 2; g.add(tag);
    // celda de cronometraje
    for (const z of [line.half - 0.5, -line.half + 0.5]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.15), new THREE.MeshStandardMaterial({ color: 0x222222 })); b.position.set(0, 0.3, z); g.add(b); }
    return g;
  }

  setNext(E) {
    if (!E) { this.marker.visible = false; this.markerLabel.visible = false; return; }
    const top = E.planes[0].h + 1.5;
    this.marker.position.set(E.x, top, E.z);
    this.markerLabel.position.set(E.x, top + 0.8, E.z);
    this.markerLabel.material.map.dispose();
    this.markerLabel.material.map = textTexture(E.label, { w: 128, h: 128, bg: '#14204a', fg: '#ffd36b', font: 'bold 84px Poppins' });
    this.marker.visible = true; this.markerLabel.visible = true;
  }

  knockRail(elIdx, planeIdx) {
    const list = (this.rails[elIdx] || [])[planeIdx];
    if (!list || !list.length) return;
    const E = this.course.elements[elIdx];
    const picks = E.type === 'w' ? list.filter(() => Math.random() < 0.5).slice(0, 4) : list;
    for (const m of picks) {
      if (m.userData.falling) continue;
      m.userData.falling = true;
      const s = Math.random() < 0.5 ? -1 : 1;
      this.falling.push({ m, vy: 0.6, vx: 1.2 + Math.random() * 1.0, vz: s * (0.4 + Math.random() * 0.6), rx: (Math.random() - 0.5) * 3, ry: (Math.random() - 0.5) * 0.8, rz: (Math.random() - 0.5) * 2, t: 0, rest: m.geometry.boundingSphere ? 0.06 : 0.06 });
    }
  }
  resetRails() {
    for (const f of this.falling) { f.m.position.copy(f.m.userData.p0 || f.m.position); }
    this.falling = [];
    // reconstruir es más simple que restaurar: setCourse lo hace
    if (this.course) this.setCourse(this.course);
  }

  // ---------------------------------------------------------------- partículas
  initParticles() {
    const N = this.N = 320;
    const g = new THREE.BufferGeometry();
    this.pPos = new Float32Array(N * 3); this.pVel = new Float32Array(N * 3); this.pLife = new Float32Array(N); this.pSize = new Float32Array(N); this.pCol = new Float32Array(N * 3);
    g.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3));
    g.setAttribute('size', new THREE.BufferAttribute(this.pSize, 1));
    g.setAttribute('color', new THREE.BufferAttribute(this.pCol, 3));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, vertexColors: true,
      uniforms: { scale: { value: 400 } },
      vertexShader: 'attribute float size; varying vec3 vC; varying float vA; uniform float scale; void main(){ vC = color; vA = size; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; float a = smoothstep(0.5, 0.1, d) * clamp(vA, 0.0, 1.0) * 0.55; gl_FragColor = vec4(vC, a); }',
    });
    this.points = new THREE.Points(g, mat); this.points.frustumCulled = false; this.pNext = 0;
    this.scene.add(this.points);
  }
  spawn(x, y, z, vx, vy, vz, size, life, color) {
    const i = this.pNext; this.pNext = (this.pNext + 1) % this.N;
    this.pPos[i * 3] = x; this.pPos[i * 3 + 1] = y; this.pPos[i * 3 + 2] = z;
    this.pVel[i * 3] = vx; this.pVel[i * 3 + 1] = vy; this.pVel[i * 3 + 2] = vz;
    this.pLife[i] = life; this.pSize[i] = size;
    this.pCol[i * 3] = color.r; this.pCol[i * 3 + 1] = color.g; this.pCol[i * 3 + 2] = color.b;
  }
  dust(p, k = 1) {
    const c = this.course && this.course.indoor ? new THREE.Color(0xb8a27a) : new THREE.Color(0xc9ad7a);
    const n = 2 + Math.round(3 * k);
    for (let i = 0; i < n; i++) this.spawn(p.x + (Math.random() - 0.5) * 0.3, 0.05, p.z + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 1.2, 0.6 + Math.random() * 1.2 * k, (Math.random() - 0.5) * 1.2, 0.5 + 0.6 * k, 0.6 + 0.4 * Math.random(), c);
  }
  splash(p) {
    const c = new THREE.Color(0xbfe3ff);
    for (let i = 0; i < 40; i++) this.spawn(p.x + (Math.random() - 0.5) * 1.5, 0.05, p.z + (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2.5, 2 + Math.random() * 3, (Math.random() - 0.5) * 2.5, 0.5 + Math.random() * 0.6, 0.8 + 0.5 * Math.random(), c);
  }

  // ---------------------------------------------------------------- cámara
  updateCamera(dt, S) {
    const cam = this.camera;
    const f = new THREE.Vector3(Math.cos(S.heading), 0, Math.sin(S.heading));
    const r = new THREE.Vector3(-Math.sin(S.heading), 0, Math.cos(S.heading));
    const P = new THREE.Vector3(S.x, S.y, S.z);
    let want, look, fov = 52, k = 4;
    if (this.camMode === 'chase') {
      const sp = clamp(S.v / 10, 0, 1);
      want = P.clone().addScaledVector(f, -7.2 - 1.5 * sp).addScaledVector(r, 1.1).add(new THREE.Vector3(0, 2.4 + 0.5 * S.jumpW, 0));
      look = P.clone().addScaledVector(f, 7).add(new THREE.Vector3(0, 0.9 + 0.3 * S.jumpW, 0));
      fov = 50 + 10 * sp;
    } else if (this.camMode === 'onboard') {
      want = S.eye ? S.eye.clone() : P.clone().add(new THREE.Vector3(0, 1.0, 0));
      look = want.clone().addScaledVector(f, 12).add(new THREE.Vector3(0, -0.8, 0));
      fov = 70; k = 30;
    } else { // tv: cámara fija en la tribuna que sigue al caballo
      const A = this.course.arena;
      want = new THREE.Vector3(S.x * 0.3, 7.5, -A.h / 2 - 6);
      look = P.clone().add(new THREE.Vector3(0, 0.8, 0));
      const d = want.distanceTo(look);
      fov = clamp(900 / d, 14, 40); k = 2.5;
    }
    const a = 1 - Math.exp(-dt * k), b = 1 - Math.exp(-dt * (k * 1.6));
    this.camPos.lerp(want, this.camMode === 'onboard' ? 1 : a);
    this.camLook.lerp(look, this.camMode === 'onboard' ? 1 : b);
    cam.position.copy(this.camPos);
    if (this.shake > 0) {
      cam.position.x += (Math.random() - 0.5) * this.shake; cam.position.y += (Math.random() - 0.5) * this.shake * 0.6;
      this.shake = Math.max(0, this.shake - dt * 1.4);
    }
    cam.lookAt(this.camLook);
    cam.fov += (fov - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix();
  }

  update(dt, S) {
    this.t += dt;
    this.updateCamera(dt, S);
    if (this.grade) this.grade.uniforms.time.value = this.t;
    if (this.mats && this.mats.water.normalMap) { this.mats.water.normalMap.offset.set(this.t * 0.02, this.t * 0.013); }
    // barras cayendo
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const f = this.falling[i];
      f.t += dt;
      f.vy -= 9.81 * dt;
      f.m.position.x += f.vx * dt; f.m.position.y += f.vy * dt; f.m.position.z += f.vz * dt;
      f.m.rotation.x += f.rx * dt; f.m.rotation.z += f.rz * dt;
      if (f.m.position.y <= f.rest) {
        f.m.position.y = f.rest;
        if (Math.abs(f.vy) < 1.2) { f.m.rotation.x = Math.round(f.m.rotation.x / Math.PI) * Math.PI; f.m.rotation.z = Math.round(f.m.rotation.z / Math.PI) * Math.PI; this.falling.splice(i, 1); continue; }
        f.vy = -f.vy * 0.35; f.vx *= 0.6; f.vz *= 0.6; f.rx *= 0.5; f.rz *= 0.5;
      }
    }
    // partículas
    const pos = this.pPos, vel = this.pVel;
    for (let i = 0; i < this.N; i++) {
      if (this.pLife[i] <= 0) { this.pSize[i] = 0; continue; }
      this.pLife[i] -= dt;
      vel[i * 3 + 1] -= 1.5 * dt;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (pos[i * 3 + 1] < 0.02) { pos[i * 3 + 1] = 0.02; vel[i * 3 + 1] = 0; }
      this.pSize[i] = Math.min(1, this.pLife[i] * 1.5) * 1.2;
    }
    this.points.geometry.attributes.position.needsUpdate = true; this.points.geometry.attributes.size.needsUpdate = true; this.points.geometry.attributes.color.needsUpdate = true;
    // público: vaivén y ola al festejar
    if (this.crowd && (this.frame = (this.frame || 0) + 1) % 2 === 0) {
      const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const s = new THREE.Vector3(); const p = new THREE.Vector3();
      this.cheerLevel = Math.max(0, this.cheerLevel - dt * 0.6);
      for (let i = 0; i < this.crowdBase.length; i++) {
        const b = this.crowdBase[i];
        const jump = this.cheerLevel * Math.max(0, Math.sin(this.t * 7 + b.ph)) * 0.35;
        p.set(b.x + Math.sin(this.t * 0.8 + b.ph) * 0.03, b.y + jump, b.z);
        s.set(b.s, b.s + jump * 0.4, b.s);
        m.compose(p, q, s); this.crowd.setMatrixAt(i, m);
        p.y += 0.5 * b.s + jump * 0.2; s.set(1, 1, 1); m.compose(p, q, s); this.heads.setMatrixAt(i, m);
      }
      this.crowd.instanceMatrix.needsUpdate = true; this.heads.instanceMatrix.needsUpdate = true;
    }
    if (this.marker && this.marker.visible) { this.marker.position.y += Math.sin(this.t * 3) * 0.004; this.marker.rotation.z += dt; }
    if (this.courseGroup) this.courseGroup.traverse(o => { if (o.userData.flags) o.userData.flags.forEach((f, i) => { f.rotation.y = Math.PI / 2 + Math.sin(this.t * 4 + i) * 0.25; }); });
  }

  cheer(level) { this.cheerLevel = Math.max(this.cheerLevel, level); }

  render() { this.composer.render(); }
}
