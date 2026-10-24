// Razas con un solo modelo (Henry): la forma del cuerpo cambia con dos «morph targets» calculados sobre el
// esqueleto en reposo, no con poses. «pesado» (Percherón, Frisón, Criollo…) engrosa cuello, pecho, ancas y
// cañas; «fino» (Árabe, Pura Sangre) los afina y achica la cabeza. Cada vértice se mueve en dirección radial
// al eje de los huesos que lo mueven (con sus mismos pesos de piel), así montura, cabezada, crin y cascos
// acompañan al cuerpo sin atravesarse. La zona donde van las piernas del jinete (debajo de la montura) no se
// ensancha: el jinete no se hunde en el caballo.
// También arma, una vez por malla, el atributo de marcas (patas y cara) que usa el pelaje para medias y
// malacara; ver horse.js (bayCoat).
import * as THREE from 'three';

// factores por grupo de huesos: [pesado, fino]. lat = ancho, up = hacia el lomo, down = hacia la panza,
// r = radial parejo (patas y cuello), s = escala uniforme alrededor de la nuca (cabeza)
const G = {
  head: { s: [1.09, 0.9] },
  neck: { r: [1.26, 0.87] },
  chest: { lat: [1.16, 0.92], up: [1.0, 1.0], down: [1.1, 0.95] },
  barrel: { lat: [1.0, 1.0], up: [1.0, 1.0], down: [1.08, 0.95] },
  belly: { lat: [1.04, 0.98], up: [1.0, 1.0], down: [1.12, 0.93] },
  hind: { lat: [1.17, 0.92], up: [1.05, 0.98], down: [1.07, 0.95] },
  upper: { r: [1.2, 0.9] },
  lower: { r: [1.38, 0.85] },
  hoof: { h: [1.26, 0.92] },
  tail: null,
};
function groupOf(name) {
  if (/Tail/.test(name)) return 'tail';
  if (/Head|Nose|Lip|Jaw|Eye|Ear|Hair_0[6-9]|Hair_10/.test(name)) return 'head';
  if (/Neck|Hair_0[0-5]/.test(name)) return 'neck';
  if (/Spine_03|Clavicle/.test(name)) return 'chest';
  if (/Spine_01|Spine_02|Stirrup/.test(name)) return 'barrel';
  if (/Stomach/.test(name)) return 'belly';
  if (/Spine_00|Pelvis|Root/.test(name)) return 'hind';
  if (/Thing|UpperArm/.test(name)) return 'upper';
  if (/Calf|Forearm|HorseLink|Foot|Hand/.test(name)) return 'lower';
  if (/Toe/.test(name)) return 'hoof';
  return 'tail';
}

// hijos que no marcan el eje del hueso (ramas laterales): se prefiere seguir la cadena principal
const SIDE = /Hair|Stirrup|Stomach|Eye|Ear|Nose|Lip|Jaw|Clavicle|Thing|Tail|_end$|Neck_01_07_[01]/;
const LEG = [/BN_L_(Clavicle|UpperArm|Hand|Toe_042)|BN_l_Forearm/, /BN_R_(Clavicle|UpperArm|Forearm|Hand|Toe_047)/, /BN_L_(Thing|Calf|HorseLink|Foot|Toe_2)/, /BN_R_(Thing|Calf|HorseLink|Foot|Toe_2)/];
// marco del esqueleto en reposo (espacio de enlace): posiciones y ejes de cada hueso, arriba, adelante, lateral
function skeletonFrame(mesh) {
  if (mesh.userData.bframe) return mesh.userData.bframe;
  const sk = mesh.skeleton, n = sk.bones.length, pos = [], inv = new THREE.Matrix4();
  for (let i = 0; i < n; i++) pos.push(new THREE.Vector3().setFromMatrixPosition(inv.copy(sk.boneInverses[i]).invert()));
  const idx = new Map(sk.bones.map((b, i) => [b.name, i]));
  const P = (nm) => pos[idx.get(nm)];
  const axis = [];
  for (let i = 0; i < n; i++) {
    const b = sk.bones[i];
    const kids = b.children.filter((c) => c.isBone && idx.has(c.name));
    const kid = kids.find((c) => !SIDE.test(c.name)) || kids[0];
    const a = kid ? pos[idx.get(kid.name)].clone().sub(pos[i]) : null;
    axis.push(a && a.lengthSq() > 1e-10 ? a.normalize() : null);
  }
  // huesos sin hijo útil: el eje del padre
  for (let i = 0; i < n; i++) if (!axis[i]) { const p = sk.bones[i].parent; axis[i] = (p && idx.has(p.name) && axis[idx.get(p.name)]) || new THREE.Vector3(0, 1, 0); }
  const up = new THREE.Vector3(0, 1, 0);
  const fwd = P('BN_Neck_00_06').clone().sub(P('BN_Pelvis_060')); fwd.y = 0; fwd.normalize();
  const lat = new THREE.Vector3().crossVectors(up, fwd).normalize();
  const center = P('BN_Spine_01_03').clone();
  // cara: de la nuca al hocico; «arriba» de la cara, de la mandíbula hacia la frente
  const poll = P('BN_Head_00_016'), muz = P('BN_L_Nose_031').clone().add(P('BN_R_Nose_032')).multiplyScalar(0.5);
  const fA = muz.clone().sub(poll), fL = fA.length(); fA.normalize();
  const fU = P('BN_Head_01_029').clone().sub(P('BN_Jaw_027')); fU.addScaledVector(fA, -fU.dot(fA)).normalize();
  const fS = new THREE.Vector3().crossVectors(fA, fU).normalize();
  const F = { pos, axis, idx, up, fwd, lat, center, poll, fA, fU, fS, fL, groups: sk.bones.map((b) => groupOf(b.name)) };
  // pelos de la crin: se mueven con el hueso del cuello del que cuelgan
  for (let i = 0; i < n; i++) if (/Hair_0[0-5]/.test(sk.bones[i].name)) { let p = sk.bones[i].parent; while (p && /Hair/.test(p.name)) p = p.parent; if (p && idx.has(p.name)) { const j = idx.get(p.name); F.axis[i] = F.axis[j]; F.pos[i] = F.pos[j]; } }
  mesh.userData.bframe = F;
  return F;
}

const _v = new THREE.Vector3(), _r = new THREE.Vector3(), _d = new THREE.Vector3(), _t = new THREE.Vector3(), _o = new THREE.Vector3();
// desplazamiento de un vértice (espacio de enlace) por un hueso, para la variante k (0 pesado, 1 fino)
function boneDelta(F, bi, v, k, out) {
  const g = G[F.groups[bi]]; out.set(0, 0, 0); if (!g) return out;
  const p = F.pos[bi];
  if (g.s) return out.copy(v).sub(F.pos[F.idx.get('BN_Head_00_016')]).multiplyScalar(g.s[k] - 1);
  if (g.h) { out.copy(v).sub(p); out.y = 0; return out.multiplyScalar(g.h[k] - 1); }
  const a = F.axis[bi];
  _r.copy(v).sub(p); _r.addScaledVector(a, -_r.dot(a));       // componente perpendicular al hueso
  if (g.r) return out.copy(_r).multiplyScalar(g.r[k] - 1);
  const l = _r.dot(F.lat), u = _r.dot(F.up);
  out.copy(F.lat).multiplyScalar(l * (g.lat[k] - 1));
  _t.copy(_r).addScaledVector(F.lat, -l);                       // resto (vertical respecto del lomo)
  return out.addScaledVector(_t, (u > 0 ? g.up[k] : g.down[k]) - 1);
}

// arma los dos morph targets de una malla con piel (una sola vez por geometría; los clones la comparten)
export function buildBreedMorphs(mesh) {
  const geo = mesh.geometry;
  if (geo.userData.breed || !mesh.isSkinnedMesh) return;
  const F = skeletonFrame(mesh), P = geo.attributes.position, J = geo.attributes.skinIndex, W = geo.attributes.skinWeight;
  // los huesos en reposo (inversa de su matriz de enlace) ya están en el espacio de la geometría (metros)
  const n = P.count, outs = [new Float32Array(n * 3), new Float32Array(n * 3)];
  const MAX = 0.12;                                             // nunca más de 12 cm
  for (let i = 0; i < n; i++) {
    _v.fromBufferAttribute(P, i);
    for (let k = 0; k < 2; k++) {
      _d.set(0, 0, 0);
      for (let j = 0; j < 4; j++) { const w = W.getComponent(i, j); if (w > 0) { boneDelta(F, J.getComponent(i, j), _v, k, _o); _d.addScaledVector(_o, w); } }
      const L = _d.length(); if (L > MAX) _d.multiplyScalar(MAX / L);
      outs[k][i * 3] = _d.x; outs[k][i * 3 + 1] = _d.y; outs[k][i * 3 + 2] = _d.z;
    }
  }
  geo.morphAttributes.position = outs.map((a) => new THREE.BufferAttribute(a, 3));
  geo.morphTargetsRelative = true;
  // normales: diferencia entre las normales recalculadas con y sin la forma nueva (solo el cuerpo: es lo que se ve)
  if (/Horse/.test(mesh.material?.name || '') && geo.index) {
    const base = normalsOf(geo, null), outsN = outs.map((a) => { const m = normalsOf(geo, a); for (let i = 0; i < m.length; i++) m[i] -= base[i]; return new THREE.BufferAttribute(m, 3); });
    geo.morphAttributes.normal = outsN;
  }
  geo.userData.breed = true;
  mesh.updateMorphTargets();
}
function normalsOf(geo, delta) {
  const P = geo.attributes.position.array, I = geo.index.array, n = P.length, out = new Float32Array(n);
  const p = delta ? Float32Array.from(P, (x, i) => x + delta[i]) : P;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  for (let t = 0; t < I.length; t += 3) {
    const i = I[t] * 3, j = I[t + 1] * 3, k = I[t + 2] * 3;
    a.set(p[i], p[i + 1], p[i + 2]); b.set(p[j], p[j + 1], p[j + 2]); c.set(p[k], p[k + 1], p[k + 2]);
    e1.subVectors(b, a); e2.subVectors(c, a); e1.cross(e2);
    for (const q of [i, j, k]) { out[q] += e1.x; out[q + 1] += e1.y; out[q + 2] += e1.z; }
  }
  for (let i = 0; i < n; i += 3) { const L = Math.hypot(out[i], out[i + 1], out[i + 2]) || 1; out[i] /= L; out[i + 1] /= L; out[i + 2] /= L; }
  return out;
}
// forma de la raza: { heavy: 0–1, fine: 0–1 } sobre todas las mallas del modelo
export function setBreedShape(model, shape = {}) {
  const w0 = Math.max(0, Math.min(1, shape.heavy || 0)), w1 = Math.max(0, Math.min(1, shape.fine || 0));
  model.traverse((o) => { if (o.isSkinnedMesh && o.morphTargetInfluences && o.geometry.userData.breed) { o.morphTargetInfluences[0] = w0; o.morphTargetInfluences[1] = w1; } });
}
export function prepareBreeds(model) { model.traverse((o) => { if (o.isSkinnedMesh) buildBreedMorphs(o); }); }

// marcas del pelaje: por vértice, a qué pata pertenece (0–3; −1 cuerpo, −2 cabeza) y su lugar en la cara
// (lateral, a lo largo de nuca → hocico, arriba/abajo). Las medias y la malacara se dibujan en el shader.
export function buildMarkAttribute(mesh) {
  const geo = mesh.geometry;
  if (geo.attributes.aMark) return geo.userData.markInfo;
  const F = skeletonFrame(mesh), P = geo.attributes.position, J = geo.attributes.skinIndex, W = geo.attributes.skinWeight;
  const n = P.count, out = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    _v.fromBufferAttribute(P, i);
    let head = 0, leg = -1, legW = 0;
    for (let j = 0; j < 4; j++) {
      const w = W.getComponent(i, j); if (!w) continue;
      const bi = J.getComponent(i, j), g = F.groups[bi], nm = mesh.skeleton.bones[bi].name;
      if (g === 'head') head += w;
      if ((g === 'lower' || g === 'hoof' || g === 'upper') && w > legW) { const q = LEG.findIndex((re) => re.test(nm)); if (q >= 0) { legW = w; leg = q; } }
    }
    _r.copy(_v).sub(F.poll);
    out[i * 4] = head > 0.5 ? -2 : leg;
    out[i * 4 + 1] = _r.dot(F.fS);                            // metros del mundo
    out[i * 4 + 2] = _r.dot(F.fA) / F.fL;                     // 0 nuca → 1 hocico
    out[i * 4 + 3] = _r.dot(F.fU);                            // > 0: frente de la cara
  }
  geo.setAttribute('aMark', new THREE.BufferAttribute(out, 4));
  // ejes del cuerpo en el espacio de la geometría (para la raya de mula y la manta appaloosa)
  geo.userData.markInfo = { center: F.center.clone(), fwd: F.fwd.clone(), lat: F.lat.clone(), unit: 1 };   // la geometría ya está en metros
  return geo.userData.markInfo;
}
