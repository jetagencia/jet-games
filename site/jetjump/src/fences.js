// Vallas: parantes y alas modelados en Blender (assets/venue/fence_parts.glb), barras con franjas,
// relleno (maceta, portón o muro) y física de derribo: cada extremo de la barra cae por separado.
import * as THREE from 'three';

const G = 9.81, RAIL_R = 0.05;
const stripeCache = new Map();
function stripeTexture(c1, c2, bands = 6) {
  const key = c1 + c2 + bands;
  if (stripeCache.has(key)) return stripeCache.get(key);
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 8;
  const x = cv.getContext('2d');
  for (let i = 0; i < bands; i++) { x.fillStyle = i % 2 ? c2 : c1; x.fillRect(i * 256 / bands, 0, 256 / bands + 1, 8); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  stripeCache.set(key, t); return t;
}
function labelTexture(text, bg = '#ffffff', fg = '#14204a') {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
  const x = cv.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = fg; x.lineWidth = 12; x.strokeRect(10, 10, 236, 236);
  // Inter 800 si la fuente ya está disponible; si no, Arial 900. Se mide el texto para centrar uno o dos dígitos sin recortes.
  let inter = false; try { inter = !!(document.fonts && document.fonts.check('800 20px Inter')); } catch { inter = false; }
  let size = text.length > 1 ? 128 : 168;
  const font = (s) => (inter ? `800 ${s}px Inter, Arial, sans-serif` : `900 ${s}px Arial, sans-serif`);
  x.font = font(size);
  while (size > 60 && x.measureText(text).width > 200) { size -= 8; x.font = font(size); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 140);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class FenceKit {
  constructor(parts, tex) {
    this.parts = parts; this.tex = tex;
    const T = tex;
    this.mat = {
      wood: new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.8 }),
      white: new THREE.MeshStandardMaterial({ color: 0xf2f1ec, roughness: 0.5 }),
      brick: new THREE.MeshStandardMaterial({ map: T.brick, normalMap: T.brickN, roughness: 0.9, color: 0xc9b2a4 }),
      coping: new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.75 }),
      flowers: new THREE.MeshLambertMaterial({ map: T.planter, alphaTest: 0.5, side: THREE.DoubleSide }),
      flagR: new THREE.MeshStandardMaterial({ color: 0xc0272d, roughness: 0.7, side: THREE.DoubleSide }),
      flagW: new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.7, side: THREE.DoubleSide }),
      pole: new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.4, metalness: 0.3 }),
    };
    this.railGeo = new THREE.CylinderGeometry(RAIL_R, RAIL_R, 1, 14, 1); this.railGeo.rotateZ(Math.PI / 2);
    // UV de la franja a lo largo de la barra
    const uv = this.railGeo.attributes.uv, pos = this.railGeo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) + 0.5, uv.getY(i));
  }
  part(name, paint) {
    const src = this.parts.scene.getObjectByName(name);
    const o = src.clone(true);
    o.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = true; m.receiveShadow = true;
      const sw = (mt) => mt.name === 'Paint' && paint ? (this._paint(paint)) : mt;
      m.material = Array.isArray(m.material) ? m.material.map(sw) : sw(m.material);
    });
    o.position.set(0, 0, 0); o.rotation.set(0, 0, 0);
    return o;
  }
  _paint(c) {
    this._pc = this._pc || {};
    return this._pc[c] || (this._pc[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.42 }));
  }
}

export class Fence {
  constructor(F, kit, scene) {
    this.F = F; this.kit = kit;
    const g = this.group = new THREE.Group();
    g.position.set(F.x, 0, F.z);
    // grupo local: +Z = sentido de salto (f); +X = izquierda del jinete (−l)
    g.rotation.y = Math.PI / 2 - F.ang;
    scene.add(g);
    this.rails = []; this.blocks = []; this.knocked = false; this.faulted = false;
    const pal = F.pal || ['#ffffff', '#1f4f9c'];
    const M = kit.mat;
    const half = F.half;
    const standards = F.type === 'oxer' ? [-F.spread / 2, F.spread / 2] : [0];
    if (F.type !== 'wall') {
      for (const s of [-1, 1]) {
        for (const a of standards) {
          const st = kit.part('Standard', pal[1]);
          st.position.set(s * (half + 0.06), 0, a); st.scale.y = Math.max(0.8, (F.h + 0.35) / 2);
          g.add(st);
        }
        const w = kit.part('Wing', pal[1]);
        w.position.set(s * (half + 0.6), 0, 0); w.rotation.y = Math.PI / 2; if (s < 0) w.rotation.y += Math.PI;
        if (F.type === 'oxer') w.scale.set(1, 1, 1);
        g.add(w);
      }
      // barras
      const mat = new THREE.MeshStandardMaterial({ map: stripeTexture(pal[0], pal[1]), roughness: 0.38 });
      for (const R of F.rails) {
        const m = new THREE.Mesh(kit.railGeo, mat); m.scale.x = F.width + 0.05;
        m.position.set(0, R.y, R.a); m.castShadow = true; m.receiveShadow = true; g.add(m);
        for (const s of [-1, 1]) { const cup = kit.part('Cup'); cup.position.set(s * (half + 0.02), R.y - 0.06, R.a); g.add(cup); }
        this.rails.push({ ...R, mesh: m, state: 'set', home: m.position.clone() });
      }
      // relleno
      if (F.filler === 'planter') {
        const box = new THREE.Mesh(new THREE.BoxGeometry(F.width - 0.3, 0.32, 0.45), M.wood);
        box.position.set(0, 0.16, standards.length > 1 ? -F.spread / 2 : 0.25); box.castShadow = true; box.receiveShadow = true; g.add(box);
        for (let k = 0; k < 2; k++) {
          const p = new THREE.Mesh(new THREE.PlaneGeometry(F.width - 0.35, 0.55), M.flowers);
          p.position.set(0, 0.55, box.position.z); p.rotation.y = k * Math.PI / 2 * 0.0 + (k ? 0.18 : -0.18); g.add(p);
        }
      } else if (F.filler === 'gate') {
        const gm = new THREE.MeshStandardMaterial({ map: stripeTexture(pal[0], pal[1], 10), roughness: 0.5 });
        const gate = new THREE.Mesh(new THREE.BoxGeometry(F.width - 0.2, 0.55, 0.06), gm);
        gate.position.set(0, 0.32, 0.12); gate.castShadow = true; g.add(gate);
      }
    } else {
      // muro: cuerpo de ladrillo fijo y bloques de remate que se caen
      const body = new THREE.Mesh(new THREE.BoxGeometry(F.width, F.h - 0.16, 0.5), M.brick);
      body.position.set(0, (F.h - 0.16) / 2, 0); body.castShadow = true; body.receiveShadow = true; g.add(body);
      for (const s of [-1, 1]) {
        const pil = new THREE.Mesh(new THREE.BoxGeometry(0.55, F.h + 0.35, 0.65), M.coping);
        pil.position.set(s * (half + 0.3), (F.h + 0.35) / 2, 0); pil.castShadow = true; pil.receiveShadow = true; g.add(pil);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.76), M.white); cap.position.set(s * (half + 0.3), F.h + 0.39, 0); g.add(cap);
      }
      const n = 6, bw = F.width / n;
      for (let k = 0; k < n; k++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.02, 0.16, 0.48), M.coping);
        b.position.set(-half + bw * (k + 0.5), F.h - 0.08, 0); b.castShadow = true; g.add(b);
        this.blocks.push({ mesh: b, state: 'set', x: b.position.x, home: b.position.clone() });
      }
    }
    // banderas: roja a la derecha, blanca a la izquierda (en el sentido de salto)
    for (const s of [-1, 1]) {
      const x = s * (half + (F.type === 'wall' ? 0.3 : 0.6));
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), M.pole);
      const top = F.type === 'wall' ? F.h + 0.43 : 1.62;
      pole.position.set(x, top + 0.25, 0); g.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.22), s < 0 ? M.flagR : M.flagW);
      flag.position.set(x + s * 0.17, top + 0.38, 0); g.add(flag);
    }
    // número
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: labelTexture(F.n), side: THREE.DoubleSide }));
    num.position.set(-(half + (F.type === 'wall' ? 0.3 : 0.6)), F.type === 'wall' ? F.h + 0.75 : 1.2, -0.08); num.rotation.y = Math.PI; g.add(num);
    this.number = num;
  }

  // mundo → local (a: a lo largo del salto, b: lateral)
  toLocal(x, z) { const dx = x - this.F.x, dz = z - this.F.z; return { a: dx * this.F.f.x + dz * this.F.f.z, b: dx * this.F.l.x + dz * this.F.l.z }; }

  // ¿algún casco toca una barra? devuelve la barra derribada o null
  checkHooves(hooves, dir) {
    let hit = null;
    for (const p of hooves) {
      const q = this.toLocal(p.x, p.z);
      if (Math.abs(q.b) > this.F.half) continue;
      if (this.F.type === 'wall') {
        if (Math.abs(q.a) < 0.3 && p.y < this.F.h + 0.02) {
          const k = Math.min(this.blocks.length - 1, Math.max(0, Math.floor((q.b + this.F.half) / (this.F.width / this.blocks.length))));
          const order = [k, k + 1, k - 1];
          for (const j of order) { const B = this.blocks[j]; if (B && B.state === 'set') { this.knockBlock(B, dir); hit = hit || B; } }
        }
        continue;
      }
      for (const R of this.rails) {
        if (R.state !== 'set') continue;
        if (Math.abs(q.a - R.a) < RAIL_R + 0.09 && p.y < R.y + RAIL_R + 0.03 && p.y > R.y - 0.5) { this.knockRail(R, dir, q.b); hit = hit || R; }
      }
    }
    return hit;
  }
  knockRail(R, dir, b = 0) {
    // solo cae la barra de arriba de cada plano si la tocada es más baja
    const top = this.rails.filter((o) => o.state === 'set' && Math.abs(o.a - R.a) < 0.01).sort((a, c) => c.y - a.y)[0];
    const T = top || R;
    T.state = 'falling'; this.knocked = true;
    const first = b > 0 ? 1 : -1;
    T.ends = [-1, 1].map((s) => ({ s, y: T.y, vy: 0, delay: s === first ? 0 : 0.06 + Math.random() * 0.12, a: T.a, va: 0.9 + Math.random() * 0.6 }));
    T.spin = 0;
  }
  knockBlock(B, dir) {
    B.state = 'falling'; this.knocked = true;
    B.v = new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.6, 1.4 + Math.random()); B.w = new THREE.Vector3(2 + Math.random() * 3, (Math.random() - 0.5) * 2, 0);
  }
  update(dt) {
    for (const R of this.rails) {
      if (R.state !== 'falling') continue;
      let rest = true;
      for (const E of R.ends) {
        if (E.delay > 0) { E.delay -= dt; rest = false; continue; }
        E.vy -= G * dt; E.y += E.vy * dt; E.a += E.va * dt; E.va *= Math.exp(-dt * 2.2);
        if (E.y < RAIL_R) { E.y = RAIL_R; E.vy = Math.abs(E.vy) > 0.6 ? -E.vy * 0.28 : 0; E.va *= 0.6; }
        if (E.vy !== 0 || E.y > RAIL_R + 0.001 || E.va > 0.05) rest = false;
      }
      const [L, Rr] = R.ends, hw = (this.F.width + 0.05) / 2;
      const p1 = new THREE.Vector3(-hw, L.y, L.a), p2 = new THREE.Vector3(hw, Rr.y, Rr.a);
      const m = R.mesh; m.position.copy(p1).add(p2).multiplyScalar(0.5);
      const d = p2.clone().sub(p1); m.scale.x = d.length();
      m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.normalize());
      R.spin += dt * 4 * (rest ? 0 : 1); m.rotateX(R.spin);
      if (rest) R.state = 'down';
    }
    for (const B of this.blocks) {
      if (B.state !== 'falling') continue;
      B.v.y -= G * dt; B.mesh.position.addScaledVector(B.v, dt);
      B.mesh.rotation.x += B.w.x * dt; B.mesh.rotation.y += B.w.y * dt;
      if (B.mesh.position.y < 0.12) { B.mesh.position.y = 0.12; B.v.multiplyScalar(0.3); B.v.y = Math.abs(B.v.y) * 0.3; B.w.multiplyScalar(0.4); if (B.v.length() < 0.15) { B.state = 'down'; B.mesh.rotation.x = Math.round(B.mesh.rotation.x / (Math.PI / 2)) * Math.PI / 2; } }
    }
  }
  reset() {
    this.knocked = false; this.faulted = false;
    for (const R of this.rails) { R.state = 'set'; R.mesh.position.copy(R.home); R.mesh.quaternion.identity(); R.mesh.scale.x = this.F.width + 0.05; }
    for (const B of this.blocks) { B.state = 'set'; B.mesh.position.copy(B.home); B.mesh.rotation.set(0, 0, 0); }
  }
}
