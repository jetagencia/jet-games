// Mundo: cielo, luz, pista de arena, pasto, cerco perimetral, predio (Blender), árboles y público.
import * as THREE from 'three';
import { ARENA } from './course.js';

// sol medido sobre el panorama (sky.jpg): azimut sureste, 48° de elevación
export const SUN_DIR = new THREE.Vector3(0.57, 0.73, 0.36).normalize();

export class World {
  constructor(renderer, assets, quality) {
    this.q = quality;
    const S = this.scene = new THREE.Scene();
    const A = assets;
    // cielo: fondo LDR liviano y luz ambiente desde el HDR reducido
    A.skyJpg.mapping = THREE.EquirectangularReflectionMapping; A.skyJpg.colorSpace = THREE.SRGBColorSpace;
    S.background = A.skyJpg; S.backgroundIntensity = 1.0;
    const pm = new THREE.PMREMGenerator(renderer);
    A.skyHdr.mapping = THREE.EquirectangularReflectionMapping;
    S.environment = pm.fromEquirectangular(A.skyHdr).texture; pm.dispose();
    S.environmentIntensity = 0.55;
    S.fog = new THREE.Fog(0xc4d3e2, 140, 420);

    // sol con sombras que siguen al caballo
    const sun = this.sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
    sun.castShadow = true;
    const sm = quality.shadow;
    sun.shadow.mapSize.set(sm, sm);
    const r = quality.hd ? 22 : 16;
    Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 120 });
    sun.shadow.bias = -0.00015; sun.shadow.normalBias = 0.06;
    S.add(sun, sun.target);
    S.add(new THREE.HemisphereLight(0xcfe0f5, 0x9c8a6a, 0.35));

    this.buildGround(A);
    this.buildPerimeter();
    this.buildVenue(A);
    this.crowd = quality.hd && A.crowd3d ? buildCrowd3D(S, A.crowd3d, quality) : buildGrandstand(S, A.crowd, quality);
  }

  buildGround(A) {
    const S = this.scene, aw = ARENA.w, ah = ARENA.h;
    const rep = (t, x, y, srgb) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
    // arena: textura fotográfica de Poly Haven con variación a gran escala para que no se note la repetición
    const sand = new THREE.MeshStandardMaterial({
      map: rep(A.sand, aw / 5, ah / 5, true), normalMap: rep(A.sandN, aw / 5, ah / 5), roughnessMap: rep(A.sandR, aw / 5, ah / 5),
      roughness: 1, normalScale: new THREE.Vector2(0.7, 0.7), color: 0xe6d3b3,
    });
    sand.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        vec2 wp = vMapUv * 5.0;
        float n = sin(wp.x * 0.23 + sin(wp.y * 0.17) * 2.0) * 0.5 + sin(wp.y * 0.31 + wp.x * 0.07) * 0.5;
        diffuseColor.rgb *= 0.93 + 0.07 * n;`);
    };
    const arena = new THREE.Mesh(new THREE.PlaneGeometry(aw + 2, ah + 2), sand);
    arena.rotation.x = -Math.PI / 2; arena.position.y = 0.0; arena.receiveShadow = true; S.add(arena);
    this.sandMat = sand;
    // pasto alrededor
    const grass = new THREE.MeshStandardMaterial({ map: rep(A.grass, 90, 90, true), normalMap: rep(A.grassN, 90, 90), roughness: 1, color: 0xa9b88f });
    const g = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), grass);
    g.rotation.x = -Math.PI / 2; g.position.y = -0.02; g.receiveShadow = true; S.add(g);
    // borde de la pista: tabla baja que recibe la arena
    const kick = new THREE.MeshStandardMaterial({ color: 0xece9e0, roughness: 0.6 });
    for (const [w, d, x, z] of [[aw + 2.4, 0.12, 0, -(ah / 2 + 1.1)], [aw + 2.4, 0.12, 0, ah / 2 + 1.1], [0.12, ah + 2.2, -(aw / 2 + 1.1), 0], [0.12, ah + 2.2, aw / 2 + 1.1, 0]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), kick); b.position.set(x, 0.12, z); b.receiveShadow = true; S.add(b);
    }
  }

  // cerco blanco de dos tablas con postes, con una entrada al oeste
  buildPerimeter() {
    const S = this.scene, aw = ARENA.w / 2 + 1.1, ah = ARENA.h / 2 + 1.1;
    const mat = new THREE.MeshStandardMaterial({ color: 0xf6f5f0, roughness: 0.55 });
    const posts = [], rails = [];
    const seg = (x1, z1, x2, z2) => {
      const L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.round(L / 2.5));
      for (let i = 0; i <= n; i++) posts.push([x1 + (x2 - x1) * i / n, z1 + (z2 - z1) * i / n]);
      rails.push([x1, z1, x2, z2, L]);
    };
    seg(-aw, -ah, aw, -ah); seg(aw, -ah, aw, ah); seg(aw, ah, -aw, ah);
    seg(-aw, ah, -aw, 6); seg(-aw, -6, -aw, -ah);               // entrada en el lado oeste
    const pg = new THREE.BoxGeometry(0.12, 1.3, 0.12); pg.translate(0, 0.65, 0);
    const P = new THREE.InstancedMesh(pg, mat, posts.length);
    const m = new THREE.Matrix4();
    posts.forEach(([x, z], i) => { m.makeTranslation(x, 0, z); P.setMatrixAt(i, m); });
    P.castShadow = true; P.receiveShadow = true; S.add(P);
    for (const [x1, z1, x2, z2, L] of rails) for (const y of [0.62, 1.15]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(L, 0.14, 0.05), mat);
      r.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); r.rotation.y = -Math.atan2(z2 - z1, x2 - x1); r.castShadow = true; r.receiveShadow = true; S.add(r);
    }
  }

  buildVenue(A) {
    const S = this.scene;
    const venue = A.venue.scene;
    const trees = [];
    venue.traverse((o) => {
      if (/^TREE_(\d)_/.test(o.name)) { const v = new THREE.Vector3(); o.getWorldPosition(v); trees.push({ p: v, s: o.scale.x, k: +o.name[5] }); return; }
      if (!o.isMesh) return;
      o.castShadow = !/Glass|Flag|Lamp|Gravel|Path/.test(o.name); o.receiveShadow = true;
      const mt = o.material;
      if (mt.userData && mt.userData.tint) mt.color.setRGB(...mt.userData.tint);
      if (mt.aoMap) mt.aoMapIntensity = /Roof|Steel/.test(mt.name) ? 0.55 : 0.85;
      if (/Glass/.test(mt.name)) { o.layers.set(1); mt.transparent = true; mt.opacity = 0.35; mt.depthWrite = false; mt.roughness = 0.05; mt.metalness = 0.3; }
      if (/Flag|Canvas/.test(mt.name)) mt.side = THREE.DoubleSide;
    });
    // el predio no proyecta sombras dinámicas lejos del caballo: ahorro en teléfonos
    if (!this.q.hd) venue.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    S.add(venue);
    if (A.trees3d) { this.buildTrees3D(A.trees3d, trees); return; }
    // árboles: impostores fotográficos (Poly Haven, CC0) en cruz, instanciados
    const TW = 4.47, TH = 6.7, TS = 2.6;
    const atlas = A.trees; atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 4;
    const n = this.q.hd ? trees.length : Math.ceil(trees.length * 0.6);
    const plane = new THREE.PlaneGeometry(TW, TH); plane.translate(0, TH / 2, 0);
    const mat = new THREE.MeshBasicMaterial({ map: atlas, alphaTest: 0.45, side: THREE.DoubleSide, color: 0xdedede });
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aKind;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = vec2((aKind + uv.x) / 4.0, uv.y);');
    };
    for (let c = 0; c < 2; c++) {
      const geo = plane.clone(); if (c) geo.rotateY(Math.PI / 2);
      const kinds = new Float32Array(n), mesh = new THREE.InstancedMesh(geo, mat, n);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const t = trees[i]; kinds[i] = (t.k + c * 2) % 4;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (i * 2.399) % (Math.PI * 2));
        m4.compose(t.p, q, sc.setScalar(t.s * TS)); mesh.setMatrixAt(i, m4);
      }
      geo.setAttribute('aKind', new THREE.InstancedBufferAttribute(kinds, 1));
      mesh.frustumCulled = false; mesh.layers.set(1); S.add(mesh);
    }
  }

  // árboles 3D generados en Blender (_tools/jetjump-pro/build_trees.py): tres variantes, instanciadas;
  // las hojas se mecen con el viento en el shader
  buildTrees3D(gltf, trees) {
    const S = this.scene, variants = [];
    for (let k = 0; k < 3; k++) {
      const bark = gltf.scene.getObjectByName(`Tree${k}_bark`), leaves = gltf.scene.getObjectByName(`Tree${k}_leaves`);
      if (!bark || !leaves) continue;
      variants.push({ bark, leaves });
    }
    if (!variants.length) return;
    const wind = { value: 0 }; this.wind = wind;
    const leafMat = new THREE.MeshStandardMaterial({ map: variants[0].leaves.material.map, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75, color: 0xd9ddc8 });
    leafMat.map.anisotropy = 4; leafMat.map.colorSpace = THREE.SRGBColorSpace;
    leafMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = wind;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
uniform float uWind;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
        // mecido: más amplio cuanto más alto; fase distinta por instancia
        vec4 wpos = instanceMatrix * vec4(position, 1.0);
        float ph = uWind * 1.3 + wpos.x * 0.21 + wpos.z * 0.17 + position.y * 0.5;
        transformed.x += sin(ph) * 0.06 * position.y; transformed.z += cos(ph * 0.8) * 0.045 * position.y;`);
    };
    const barkMat = variants[0].bark.material; barkMat.roughness = 0.9;
    variants.forEach((v, k) => {
      const mine = trees.filter((t, i) => i % variants.length === k);
      if (!mine.length) return;
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      for (const [geo, mat, shadow] of [[v.bark.geometry, barkMat, true], [v.leaves.geometry, leafMat, true]]) {
        const mesh = new THREE.InstancedMesh(geo, mat, mine.length);
        mine.forEach((t, i) => {
          q.setFromAxisAngle(up, (i * 2.399 + k) % (Math.PI * 2));
          const s = t.s * 2.1 * (0.9 + ((i * 7919) % 100) / 500);
          m4.compose(t.p, q, sc.set(s, s, s)); mesh.setMatrixAt(i, m4);
        });
        mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = shadow; mesh.receiveShadow = true; mesh.frustumCulled = false;
        if (mat === leafMat) mesh.layers.set(1);
        S.add(mesh);
      }
    });
  }
  // sombra y luz siguen al caballo
  follow(x, z) {
    const s = this.sun;
    s.target.position.set(x, 0, z);
    s.position.set(x + SUN_DIR.x * 60, SUN_DIR.y * 60, z + SUN_DIR.z * 60);
    s.target.updateMatrixWorld();
  }
  // Huellas (contacto único, 14-10-2026). Dos capas instanciadas por variante:
  //  · impresión del casco (herradura, ranilla y talones), tamaño real (≈ 13 × 14 cm), mezcla MÍNIMO: una pasada
  //    sobre otra nunca oscurece más que una sola (no hay manchas negras tras varias vueltas);
  //  · arena desplazada (pequeño reborde y salpicado detrás del casco), mezcla MÁXIMO: más clara, tampoco acumula.
  // Al aterrizar crece la arena desplazada, no el casco.
  buildPrints() {
    const N = this.q.hd ? 1400 : 800, V = 3;
    const mk = (draw) => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); draw(c); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    const rnd = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
    const prints = [], kicks = [];
    for (let v = 0; v < V; v++) {
      const r = rnd(11 + v * 97);
      // impresión: blanco = sin cambio; adentro, arena húmeda compactada. El casco ocupa ~70 % del cuadro.
      prints.push(mk((c) => {
        c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 128); c.translate(64, 66);
        const w = 40 + r() * 5, h = 44 + r() * 5;                 // semiejes en píxeles (128 px = 0,2 m)
        let g = c.createRadialGradient(0, 0, 6, 0, 0, h);
        g.addColorStop(0, 'rgb(150,118,84)'); g.addColorStop(0.75, 'rgb(162,130,94)'); g.addColorStop(1, 'rgb(255,255,255)');
        c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, 7); c.fill();
        // herradura: U más marcada, abierta hacia los talones (+y)
        c.strokeStyle = 'rgb(120,92,64)'; c.lineWidth = 7 + r() * 2;
        c.beginPath(); c.ellipse(0, -2, w - 7, h - 7, 0, Math.PI * 0.86, Math.PI * 2.14, false); c.stroke();
        // ranilla (cuña central) y talones
        c.fillStyle = 'rgb(140,108,76)'; c.beginPath(); c.moveTo(0, -6); c.lineTo(-11, h - 10); c.lineTo(11, h - 10); c.closePath(); c.fill();
        for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.3})`; const a = r() * 6.28, d = r() * h * 0.8; c.beginPath(); c.arc(Math.cos(a) * d * 0.9, Math.sin(a) * d, 0.6 + r() * 1.6, 0, 7); c.fill(); }
      }));
      // arena desplazada: negro = sin cambio (MÁXIMO); granos y reborde claros, sobre todo detrás del casco
      kicks.push(mk((c) => {
        c.fillStyle = '#000'; c.fillRect(0, 0, 128, 128); c.translate(64, 50);
        c.strokeStyle = 'rgb(222,196,152)'; c.lineWidth = 4; c.globalAlpha = 0.8;
        c.beginPath(); c.ellipse(0, 0, 34, 38, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
        c.globalAlpha = 1;
        for (let k = 0; k < 70; k++) { const a = Math.PI * (0.15 + r() * 0.7), d = 30 + r() * 34; c.fillStyle = `rgb(${205 + r() * 30 | 0},${178 + r() * 26 | 0},${136 + r() * 22 | 0})`; c.beginPath(); c.arc(Math.cos(a) * d * 0.9, Math.sin(a) * d, 0.8 + r() * 2.2, 0, 7); c.fill(); }
      }));
    }
    const geo = new THREE.PlaneGeometry(0.2, 0.2); geo.rotateX(-Math.PI / 2);
    const geoK = new THREE.PlaneGeometry(0.36, 0.36); geoK.rotateX(-Math.PI / 2);
    const make = (tex, g, eq, y, order) => {
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: false, depthWrite: false, fog: true, polygonOffset: true, polygonOffsetFactor: -2,
        blending: THREE.CustomBlending, blendEquation: eq, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });
      const m = new THREE.InstancedMesh(g, mat, Math.ceil(N / V)); m.count = 0; m.frustumCulled = false; m.layers.set(1); m.position.y = y; m.renderOrder = order;
      this.scene.add(m); return m;
    };
    this.prints = {
      p: prints.map((t) => make(t, geo, THREE.MinEquation, 0.004, 2)),
      k: kicks.map((t) => make(t, geoK, THREE.MaxEquation, 0.003, 1)),
      i: [0, 0, 0], N: Math.ceil(N / V), m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), v: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0),
    };
  }
  // c: { pos, ang (0 = +Z del mundo), impact, landing } del evento de contacto
  hoofprint(c) {
    const x = c.pos.x, z = c.pos.z;
    if (Math.abs(x) > ARENA.w / 2 + 0.5 || Math.abs(z) > ARENA.h / 2 + 0.5) return;
    if (!this.prints) this.buildPrints();
    const P = this.prints, v = (Math.random() * 3) | 0, i = P.i[v];
    // la textura tiene la punta del casco hacia -y del lienzo = -Z del plano: girar para alinear con el casco
    P.q.setFromAxisAngle(P.up, c.ang + Math.PI);
    P.m.compose(P.v.set(x, 0, z), P.q, P.s.setScalar(0.95 + Math.random() * 0.1));
    P.p[v].setMatrixAt(i, P.m);
    const kick = c.landing ? 1.45 : 0.85 + Math.min(0.4, c.impact * 0.15);
    P.m.compose(P.v.set(x, 0, z), P.q, P.s.setScalar(kick));
    P.k[v].setMatrixAt(i, P.m);
    P.i[v] = (i + 1) % P.N;
    for (const L of [P.p[v], P.k[v]]) { L.count = Math.max(L.count, P.i[v] === 0 ? P.N : P.i[v]); L.instanceMatrix.needsUpdate = true; }
  }
  // guía de rumbo: línea discontinua sobre la arena delante del caballo (se apaga en el salto)
  // sombra de contacto bajo cada casco: oscurece la arena donde apoya (el mapa de sombras no la resuelve a
  // esta escala) y se desvanece al levantar el casco.
  hoofShadows(hv, rest = [0.10, 0.10, 0.09, 0.085]) {
    if (!this.hs) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
      const g = c.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(30,22,14,1)'); g.addColorStop(0.5, 'rgba(30,22,14,0.45)'); g.addColorStop(1, 'rgba(30,22,14,0)');
      c.fillStyle = g; c.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const geo = new THREE.PlaneGeometry(0.34, 0.34); geo.rotateX(-Math.PI / 2);
      this.hs = [0, 1, 2, 3].map(() => {
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.5 }));
        m.position.y = 0.006; m.renderOrder = 3; m.layers.set(1); this.scene.add(m); return m;
      });
    }
    this.hs.forEach((m, i) => {
      const p = hv[i]; if (!p) { m.visible = false; return; }
      const k = Math.max(0, 1 - (p.y - rest[i]) / 0.35);
      m.visible = k > 0.02; m.position.x = p.x; m.position.z = p.z;
      m.scale.setScalar(0.7 + 0.5 * (1 - k)); m.material.opacity = 0.5 * k;
    });
  }
  buildGuide() {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 16; const c = cv.getContext('2d');
    // trazos con borde oscuro para que se lean sobre la arena clara
    for (let x = 0; x < 512; x += 40) { const a = 1 - x / 512; c.fillStyle = `rgba(40,30,20,${0.55 * a})`; c.fillRect(x, 2, 26, 12); c.fillStyle = `rgba(255,250,235,${0.95 * a})`; c.fillRect(x + 2, 4, 22, 8); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(14, 0.26); geo.rotateX(-Math.PI / 2); geo.translate(8.4, 0, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.75, depthWrite: false }));
    m.position.y = 0.025; m.layers.set(1); m.renderOrder = 5; m.visible = false; this.scene.add(m);
    this.guideMesh = m;
  }
  guide(x, z, h, on) {
    if (!this.guideMesh) this.buildGuide();
    const g = this.guideMesh; g.visible = on; if (!on) return;
    g.position.x = x; g.position.z = z; g.rotation.y = -h;
  }
  update(dt, cheer) { this.crowd.update(dt, cheer); if (this.wind) this.wind.value += dt; }
  clearTracks() { if (this.prints) { for (const L of [...this.prints.p, ...this.prints.k]) L.count = 0; this.prints.i = [0, 0, 0]; } }
}

// Asientos de la tribuna (misma geometría que la tribuna modelada en Blender)
function seatList(q) {
  const rows = 11, rowD = 0.82, rise = 0.4, len = 60, z0 = -(ARENA.h / 2 + 4.2);
  const seatsPerRow = Math.floor(len / 0.62), fill = q.hd ? 0.82 : 0.6;
  let seed = 1234; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const P = [];
  for (let r = 0; r < rows; r++) for (let k = 0; k < seatsPerRow; k++) {
    if (rnd() > fill || (k % 24 >= 11 && k % 24 <= 12)) continue;
    P.push({ x: -len / 2 + (k + 0.5) * (len / seatsPerRow), y: 0.35 + r * rise + 0.5, z: z0 - r * rowD - rowD * 0.5, cell: Math.floor(rnd() * 64), ph: rnd(), fan: rnd(), s: 0.94 + rnd() * 0.12, row: r });
  }
  return { P, z0, depth: rows * rowD, roofD: rows * rowD * 0.8 };
}
// Público en 3D (dev/crowd-bake.html): 16 personas × 2 poses como mallas estáticas con la ropa por vértice,
// instanciadas por variante. Los que festejan se eligen entre los aplaudiendo.
function buildCrowd3D(S, gltf, q) {
  const { P, z0, depth, roofD } = seatList(q);
  const meshes = {}; gltf.scene.traverse((o) => { if (o.isMesh) meshes[o.name] = o; });
  const NV = 16, groups = Array.from({ length: NV * 2 }, () => []);
  P.forEach((p, i) => { const v = (i * 7 + p.row * 3) % NV, clap = p.fan < 0.18 ? 1 : 0; groups[v * 2 + clap].push(p); });
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 });
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let n = 0;
  groups.forEach((list, gi) => {
    if (!list.length) return;
    const src = meshes[`P${gi >> 1}_${gi & 1}`]; if (!src) return;
    const mesh = new THREE.InstancedMesh(src.geometry, mat, list.length);
    list.forEach((p, i) => {
      // el personaje mira +X en su espacio: girado 90° mira a la pista (+Z), con un poco de variación
      qq.setFromAxisAngle(up, -Math.PI / 2 + (p.ph - 0.5) * 0.5);
      m4.compose(pos.set(p.x, p.y - 0.02, p.z), qq, sc.setScalar(p.s)); mesh.setMatrixAt(i, m4);
      const shade = p.z < z0 - depth + roofD - 0.3 ? 0.78 : 1.0; mesh.setColorAt(i, new THREE.Color(shade, shade, shade));
    });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = false; mesh.receiveShadow = true; mesh.frustumCulled = false; S.add(mesh); n += list.length;
  });
  return { count: n, update() {} };
}
// Público horneado (personajes Quaternius CC0, 64 personas × 2 poses) sobre la tribuna de Blender.
function buildGrandstand(S, atlas, q) {
  const COLS = 16, ROWS = 8, PW = 0.78, PH = 1.56, PBOT = 0.54;
  const rows = 11, rowD = 0.82, rise = 0.4, len = 60, z0 = -(ARENA.h / 2 + 4.2);
  atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 4;
  const seatsPerRow = Math.floor(len / 0.62), fill = q.hd ? 0.82 : 0.6;
  let seed = 1234; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const P = [];
  for (let r = 0; r < rows; r++) for (let k = 0; k < seatsPerRow; k++) {
    if (rnd() > fill || (k % 24 >= 11 && k % 24 <= 12)) continue;
    P.push({ x: -len / 2 + (k + 0.5) * (len / seatsPerRow), y: 0.35 + r * rise + 0.5, z: z0 - r * rowD - rowD * 0.5, cell: Math.floor(rnd() * 64), ph: rnd(), fan: rnd(), s: 0.94 + rnd() * 0.12 });
  }
  const geo = new THREE.PlaneGeometry(PW, PH); geo.translate(0, PH / 2 - PBOT, 0);
  const n = P.length, aCell = new Float32Array(n * 2), aPh = new Float32Array(n * 2);
  const mesh = new THREE.InstancedMesh(geo, null, n);
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  const depth = rows * rowD, roofD = depth * 0.8;
  P.forEach((p, i) => {
    const c = p.cell * 2; aCell[i * 2] = c % COLS; aCell[i * 2 + 1] = ROWS - 1 - Math.floor(c / COLS);
    aPh[i * 2] = p.ph; aPh[i * 2 + 1] = p.fan;
    m4.compose(pos.set(p.x, p.y, p.z), qq, sc.setScalar(p.s)); mesh.setMatrixAt(i, m4);
    const shade = p.z < z0 - depth + roofD - 0.3 ? 0.75 : 1.0; mesh.setColorAt(i, new THREE.Color(shade, shade, shade));
  });
  geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(aCell, 2));
  geo.setAttribute('aPh', new THREE.InstancedBufferAttribute(aPh, 2));
  const U = { uTime: { value: 0 }, uCheer: { value: 0 } };
  const mat = new THREE.MeshLambertMaterial({ map: atlas, alphaTest: 0.5 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aCell; attribute vec2 aPh; uniform float uTime, uCheer;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        float clap = step(aPh.y, uCheer * 1.1) * step(0.5, fract(uTime * 3.2 + aPh.x * 7.0));
        vMapUv = (aCell + vec2(clap, 0.0) + uv) / vec2(${COLS}.0, ${ROWS}.0);`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed.y += step(aPh.y, uCheer) * max(0.0, sin(uTime * 7.0 + aPh.x * 6.28)) * 0.06 * uCheer;`);
  };
  mesh.material = mat; mesh.frustumCulled = false; mesh.layers.set(1); S.add(mesh);
  let t = 0;
  return { update(dt, cheer) { t += dt; U.uTime.value = t; U.uCheer.value = Math.max(0.1, cheer || 0); } };
}
