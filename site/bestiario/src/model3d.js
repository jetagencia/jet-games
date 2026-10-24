// Carga de criaturas 3D (GLB hecho en Blender) con su esqueleto y animaciones.
// La piel se pinta aquí con los atributos de vértice que trae el modelo (_seam: R hendidura, G zona de brasas, B altura de placa;
// _grad: degradado de carbón a hueso), así las skins son solo parámetros de color.
import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from '../vendor/addons/utils/SkeletonUtils.js';
import { applyForm, tickForms } from './forms.js';

const loader = new GLTFLoader();
const cache = new Map();
// Un fallo de red no se queda guardado: se olvida la petición y se reintenta (3 veces, con espera) antes de rendirse.
export const loadModel = (url, tries = 3) => {
  let p = cache.get(url);
  if (!p) {
    const P = typeof window !== 'undefined' && window.__pre, pre = P && P[url];   // descarga adelantada por index.html (el fénix de la portada)
    if (pre) delete P[url];
    p = (pre ? pre.then((buf) => loader.parseAsync(buf, url.replace(/[^/]*$/, ''))) : loader.loadAsync(url)).catch(async (e) => {
      cache.delete(url);
      if (tries <= 1) throw e;
      await new Promise((r) => setTimeout(r, 1500));
      return loadModel(url, tries - 1);
    });
    cache.set(url, p);
  }
  return p;
};

// skins del dragón (la primera es la base; el resto es el catálogo de la tienda)
export const DRAGON_SKINS = {
  ceniza: { base: 0x2c2e34, light: 0x5c5a62, ochre: 0x4a3524, ember: 0xff4a0c, eye: 0xff5a0a, bone: 0xd2c6a8, bonedark: 0x15110e, membrane: 0x3a1a16 },
  sangre: { base: 0x4a1a1a, light: 0x7a3a30, ochre: 0x5a3220, ember: 0xffb02a, eye: 0xffc040, bone: 0xe0d4b8, bonedark: 0x2a0e0e, membrane: 0x4e1418 },
  abismo: { base: 0x1c2342, light: 0x405088, ochre: 0x2c3556, ember: 0x4af0ff, eye: 0x4af0ff, bone: 0xc9d2e0, bonedark: 0x0c1020, membrane: 0x1a2040 },
  podrido: { base: 0x4a5a3a, light: 0x7a8a56, ochre: 0x6a6a40, ember: 0xc8ff3a, eye: 0xc8ff3a, bone: 0xd0c8a8, bonedark: 0x1c2214, membrane: 0x344028 },
};

function skinMaterial(p, detail) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uBase = { value: new THREE.Color(p.base) }; sh.uniforms.uLight = { value: new THREE.Color(p.light) };
    sh.uniforms.uOchre = { value: new THREE.Color(p.ochre) }; sh.uniforms.uEmber = { value: new THREE.Color(p.ember) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 _seam;\nvarying vec4 vSeam;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSeam = _seam;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vSeam;\nuniform vec3 uBase; uniform vec3 uLight; uniform vec3 uOchre; uniform vec3 uEmber;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float sR = vSeam.r, sG = vSeam.g, sH = vSeam.b;
        vec3 sc = mix(uBase, uLight, smoothstep(0.15, 0.95, sH));
        sc *= (0.62 + 0.76 * sH);
        sc = mix(sc, sc * vec3(0.3, 0.26, 0.26), sR);
        sc = mix(sc, uOchre, sG * 0.85);
        diffuseColor.rgb = sc;`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = 0.52 + 0.24 * sR;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uEmber * (sR * sG) * 1.6;');
  };
  m.customProgramCacheKey = () => 'skin-dragon';
  return m;
}

function boneMaterial(p) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.48, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uBone = { value: new THREE.Color(p.bone) }; sh.uniforms.uDark = { value: new THREE.Color(p.bonedark) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 _grad;\nvarying float vGrad;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrad = _grad.r;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGrad;\nuniform vec3 uBone; uniform vec3 uDark;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(uDark, uBone, smoothstep(0.25, 0.8, pow(vGrad, 1.3)));');
  };
  m.customProgramCacheKey = () => 'bone-dragon';
  return m;
}

function materialsFor(skinId) {
  const p = DRAGON_SKINS[skinId] || DRAGON_SKINS.ceniza;
  return {
    Piel: skinMaterial(p),
    Hueso: boneMaterial(p),
    Membrana: new THREE.MeshStandardMaterial({ color: p.membrane, roughness: 0.6, metalness: 0, side: THREE.DoubleSide }),
    Ojo: new THREE.MeshStandardMaterial({ color: 0x1a0800, emissive: p.eye, emissiveIntensity: 2.2, roughness: 0.15 }),
    Negro: new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 0.25 }),
    Boca: new THREE.MeshStandardMaterial({ color: 0x4a0f0c, roughness: 0.25, emissive: 0x2a0402, emissiveIntensity: 0.8 }),
  };
}

/**
 * Crea una criatura animada en el mundo.
 * opts: url, scene, x, z, yaw, scale, skin, offsetZ (para centrar el modelo en su jaula)
 */
export async function spawnCreature(opts) {
  const gltf = await loadModel(opts.url);
  const root = cloneSkinned(gltf.scene);
  // SkeletonUtils.clone crea un esqueleto por cada malla aunque el GLB tenga una sola piel (217 para 15 criaturas): todas las mallas con los mismos huesos
  // y las mismas matrices inversas pasan a usar el de la primera. Misma imagen, y cada cuadro se recalcula y se sube a la GPU un esqueleto por criatura.
  const skels = [];
  const sameSkin = (a, b) => a.bones.length === b.bones.length && a.bones.every((bn, i) => bn === b.bones[i]) && a.boneInverses.every((m, i) => m.equals(b.boneInverses[i]));
  root.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    const twin = skels.find((s) => sameSkin(s, o.skeleton));
    if (twin) o.bind(twin, o.bindMatrix); else skels.push(o.skeleton);
  });
  const mats = opts.skin ? materialsFor(opts.skin) : {};   // sin skin: se respetan los materiales del GLB (color por vértice)
  const meshes = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const nm = o.material && o.material.name;
    o.userData.matName = nm;
    if (mats[nm]) o.material = mats[nm];
    else if (o.material) o.material = o.material.clone();   // cada criatura con sus propios materiales (para teñirlos)
    o.castShadow = true; o.receiveShadow = false;
    meshes.push(o);
  });
  // piezas de formas modeladas a propósito (nodos `var_<forma>`): ocultas hasta que se active esa forma
  const variantNodes = {}, baseNodes = {};   // var_<forma>_*: se muestran solo en esa forma · base_<forma>_*: se ocultan en esa forma (p. ej. el arma original)
  root.traverse((o) => {
    if (!o.name) return;
    if (o.name.startsWith('var_')) { const f = o.name.slice(4).split('_')[0]; (variantNodes[f] = variantNodes[f] || []).push(o); o.visible = false; }
    else if (o.name.startsWith('base_')) { const f = o.name.slice(5).split('_')[0]; (baseNodes[f] = baseNodes[f] || []).push(o); }
  });
  root.position.z = opts.offsetZ || 0;
  const holder = new THREE.Group();
  holder.add(root);
  holder.scale.setScalar(opts.scale || 1);
  holder.position.set(opts.x, 0, opts.z); holder.rotation.y = opts.yaw || 0;
  if (opts.scene) opts.scene.add(holder);
  // Esfera de contorno propia para cada malla con esqueleto (la de three se calcula en una sola pose y recortaría alas y colas en movimiento):
  // así las criaturas fuera de pantalla no se dibujan, ni en la pasada de sombras.
  holder.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(root), bc = bb.getCenter(new THREE.Vector3()), br = bb.getSize(new THREE.Vector3()).length() * 0.5 * 1.35 + 0.5;
  const inv = new THREE.Matrix4();
  for (const o of meshes) {
    if (!o.isSkinnedMesh) { o.frustumCulled = false; continue; }
    inv.copy(o.matrixWorld).invert();
    o.boundingSphere = new THREE.Sphere(bc.clone().applyMatrix4(inv), br / Math.max(1e-6, o.matrixWorld.getMaxScaleOnAxis()));
    o.frustumCulled = true;
  }
  const mixer = new THREE.AnimationMixer(root);
  const byName = Object.fromEntries(gltf.animations.map((a) => [a.name, a]));
  const idle = mixer.clipAction(byName.idle); idle.play(); idle.time = Math.random() * idle.getClip().duration;
  const roarClip = byName.accion || byName.rugido;
  const roar = roarClip ? mixer.clipAction(roarClip) : null;
  if (roar) { roar.setLoop(THREE.LoopOnce, 1); roar.clampWhenFinished = false; }
  const actor = {
    holder, root, mixer, x: opts.x, z: opts.z, cool: 3 + Math.random() * 4, baseScale: opts.scale || 1, variantNodes, baseNodes, form: 'base',
    hasVariant(f) { return !!variantNodes[f]; },
    roar() {
      if (!roar || roar.isRunning()) return;
      roar.reset().setEffectiveWeight(1).play(); roar.crossFadeFrom(idle, 0.35, false);
      setTimeout(() => { idle.reset().play(); idle.crossFadeFrom(roar, 0.5, false); }, roar.getClip().duration * 1000 - 400);
    },
    update(dt) { mixer.update(dt); this.cool -= dt; tickForms(performance.now() / 1000); },
    // skins de la tienda: las del dragón cambian los colores de su piel; las demás criaturas se tiñen
    setSkin(id) {
      if (!opts.skin) return;
      const m = materialsFor(id);
      for (const o of meshes) if (m[o.userData.matName]) { o.userData.baseMat = m[o.userData.matName]; if (this.form === 'base') o.material = o.userData.baseMat; }
      if (this.form !== 'base') applyForm(this, meshes, this.form);
    },
    setTint(hex) {
      for (const o of meshes) { const m = o.userData.baseMat || o.material; if (m && m.color) m.color.setHex(hex); }
    },
    // forma de la criatura (ver forms.js)
    setForm(f) { applyForm(this, meshes, f || 'base'); },
  };
  return actor;
}
