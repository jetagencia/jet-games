// Formas de las criaturas (variantes visuales): se generan sobre el mismo modelo cambiando materiales, tamaño y piezas extra.
//   fuego: esqueleto · ígnea     aire: acorazada · tormenta     tierra: colosal · pétrea     agua: hielo · abismal
// Si el GLB trae nodos llamados `var_<forma>` (esqueleto, armadura, arma…) se muestran al activar esa forma; si no, se usa un aspecto
// aproximado hecho con sombreadores (para las formas esqueleto, acorazada y colosal es provisional hasta tener esas piezas modeladas).
import * as THREE from '../vendor/three.module.js';

export const FORM_TIME = { value: 0 };

const NOISE = /* glsl */ `
float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
`;

// categoría de cada malla: piel, rigido, flexible o brillo (los modelos nuevos la llevan en el nombre; el dragón, en el de su pieza)
export function categoryOf(o) {
  const n = o.name || '';
  let m = n.match(/_(piel|rigido|flexible|brillo)_/);
  if (m) return m[1];
  if (/hueso/i.test(n)) return 'rigido';
  if (/membrana/i.test(n)) return 'flexible';
  if (/ojos|pupilas|boca/i.test(n)) return 'brillo';
  return 'piel';
}

// cuerpo del sombreador de cada forma: define `vec3 fCol` (color), y suma `fEmi` (emisión); `lum` es el brillo del color original
const BODY = {
  ignea: `
    vec3 rock = mix(vec3(0.045,0.04,0.04), vec3(0.26,0.22,0.2), lum);
    float vein = smoothstep(0.455, 0.5, n1) * (1.0 - smoothstep(0.5, 0.56, n1));
    float glowv = vein * (0.75 + 0.25 * sin(uT * 2.2 + n2 * 7.0));
    fCol = rock; fEmi = vec3(1.0, 0.36, 0.05) * glowv * 2.6 + vec3(0.9, 0.18, 0.02) * pow(n2, 3.0) * 0.55;`,
  tormenta: `
    fCol = mix(vec3(0.14,0.18,0.32), vec3(0.62,0.7,0.92), lum);
    float bolt = 1.0 - smoothstep(0.0, 0.04, abs(fbm3(wp * 3.2 + vec3(0.0, uT * 0.7, 0.0)) - 0.5));
    float bolt2 = 1.0 - smoothstep(0.0, 0.025, abs(fbm3(wp * 7.0 - vec3(uT * 0.9, 0.0, 0.0)) - 0.5));
    fEmi = vec3(0.55, 0.78, 1.0) * (bolt + bolt2 * 0.6) * 3.2 * (0.55 + 0.45 * sin(uT * 9.0 + wp.x * 3.0)) + vec3(0.03, 0.06, 0.14);`,
  petrea: `
    vec3 stone = mix(vec3(0.15,0.145,0.14), vec3(0.5,0.48,0.44), clamp(lum * 1.2 + n2 * 0.35, 0.0, 1.0));
    float crk = smoothstep(0.47, 0.5, n1) * (1.0 - smoothstep(0.5, 0.53, n1));
    float moss = smoothstep(0.6, 0.78, fbm3(wp * 1.6 + 3.0));
    fCol = mix(stone, vec3(0.13,0.24,0.07), moss * 0.75) * (1.0 - crk * 0.6);`,
  abismal: `
    fCol = mix(vec3(0.015,0.04,0.11), vec3(0.07,0.17,0.32), lum);
    float spot = smoothstep(0.7, 0.76, fbm3(wp * 5.5));
    fEmi = vec3(0.2, 0.9, 1.0) * spot * 1.9 * (0.65 + 0.35 * sin(uT * 1.6 + wp.y * 4.0));`,
  hielo: `
    float frost = smoothstep(0.55, 0.72, n1);
    fCol = mix(vec3(0.42,0.7,0.95), vec3(0.9,0.97,1.0), clamp(lum * 1.3 + frost * 0.5, 0.0, 1.0));
    fEmi = vec3(0.05, 0.16, 0.28) * (0.6 + 0.4 * sin(uT + n2 * 5.0));`,
  esqueleto: `
    vec3 bone = mix(vec3(0.5,0.45,0.37), vec3(0.92,0.88,0.76), clamp(lum * 1.3 + n2 * 0.25, 0.0, 1.0));
    float crack = smoothstep(0.46, 0.5, n1) * (1.0 - smoothstep(0.5, 0.54, n1));
    fCol = mix(bone, vec3(0.12,0.1,0.08), crack * 0.7);
    fEmi = vec3(1.0, 0.34, 0.05) * crack * (0.9 + 0.3 * sin(uT * 2.5 + n2 * 6.0));`,
  colosal: `
    fCol = mix(vec3(0.34,0.28,0.24), vec3(0.78,0.66,0.55), lum) * vec3(1.05, 0.95, 0.9);
    fEmi = vec3(0.0);`,
};

const DEFLUM = { esqueleto: '0.55', hielo: '0.6', colosal: '0.45' };   // brillo de partida cuando la malla no trae colores (el dragón)
function skinShader(form, mat, hasColor) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = FORM_TIME;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWp;\nuniform float uT;\n${NOISE}\nvec3 fEmi;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 wp = vWp; float n1 = fbm3(wp * 2.2), n2 = fbm3(wp * 6.0 + uT * 0.15);
        float lum = ${hasColor ? 'dot(vColor.rgb, vec3(0.333))' : (DEFLUM[form] || '0.2')}; lum = clamp(lum * 1.6, 0.0, 1.0);
        vec3 fCol = vec3(0.5); fEmi = vec3(0.0);
        ${BODY[form]}
        diffuseColor.rgb = fCol;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += fEmi;');
  };
  mat.customProgramCacheKey = () => `form-${form}-${hasColor ? 'c' : 'n'}`;
}

const EYE = { ignea: 0xff7a2a, tormenta: 0xcfe8ff, petrea: 0xffc060, abismal: 0x4af0ff, hielo: 0x9fe8ff, esqueleto: 0xff6a1a, armadura: null, colosal: 0xff9a3a };

// material de una pieza en una forma; devuelve null si queda igual que en la forma base
function formMaterial(form, cat, base, hasColor, name = '') {
  if (form === 'base') return null;
  if ((form === 'hielo' || form === 'abismal') && name.startsWith('var_')) return null;   // piezas modeladas del aspecto (cristales, aletas, coral): conservan su material del GLB
  if (cat === 'brillo') {
    const c = EYE[form]; if (c == null || !base.emissive) return null;
    const m = base.clone(); m.emissive.setHex(c); if (m.color) m.color.setHex(c === 0x9fe8ff ? 0x153040 : 0x201008); m.emissiveIntensity = Math.max(1.6, base.emissiveIntensity || 1);
    return m;
  }
  if (form === 'armadura') { // acero en las piezas duras; el resto se queda igual
    if (cat !== 'rigido') return null;
    return new THREE.MeshStandardMaterial({ color: 0x9aa3b0, metalness: 0.9, roughness: 0.32, vertexColors: false });
  }
  if (form === 'colosal') { // más grande (ver SCALE) y con las piezas duras, que incluyen su arma, de acero con runas encendidas; la piel no cambia
    if (cat !== 'rigido') return null;
    return new THREE.MeshStandardMaterial({ color: 0x8e8a86, metalness: 0.85, roughness: 0.35, emissive: 0x4a1e08, emissiveIntensity: 0.7 });
  }
  if (form === 'esqueleto' && cat === 'flexible') return null; // se oculta aparte
  if (form === 'esqueleto' && cat === 'rigido' && /piedra|madera|hierro|roca|cadena|grillete|metal/i.test(name)) return null;   // pedestales, ramas y cadenas no son hueso: se quedan como son
  if (cat === 'rigido' && (form === 'ignea' || form === 'tormenta' || form === 'abismal')) return null; // garras y cuernos se conservan
  const phys = form === 'hielo';
  const m = phys ? new THREE.MeshPhysicalMaterial({ roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.8, vertexColors: hasColor })
    : new THREE.MeshStandardMaterial({ roughness: form === 'petrea' ? 1 : form === 'esqueleto' ? 0.75 : 0.5, metalness: 0.05, vertexColors: hasColor });
  if (form === 'colosal' && cat !== 'rigido') { m.vertexColors = hasColor; }
  if (base.side === THREE.DoubleSide) m.side = THREE.DoubleSide;
  skinShader(form === 'armadura' ? 'colosal' : form, m, hasColor);
  return m;
}

const SCALE = { colosal: 1.3 };

// Aplica una forma a una criatura creada con spawnCreature. `meshes` = mallas del actor; `base` = materiales actuales (con la skin puesta).
export function applyForm(actor, meshes, form) {
  actor.form = form;
  for (const o of meshes) {
    const ud = o.userData;
    if (!ud.baseMat) ud.baseMat = o.material;
    ud.cat = ud.cat || categoryOf(o);
    const hasColor = !!o.geometry.attributes.color;
    const own = actor.hasVariant(form) && (form === 'armadura' || form === 'colosal');   // con piezas modeladas a propósito no hace falta el aspecto aproximado
    const fm = own ? null : formMaterial(form, ud.cat, ud.baseMat, hasColor, o.name);
    if (ud.formMat && ud.formMat !== fm) { ud.formMat.dispose && ud.formMat.dispose(); }
    ud.formMat = fm;
    o.material = fm || ud.baseMat;
    o.visible = !(form === 'esqueleto' && ud.cat === 'flexible' && !actor.hasVariant('esqueleto'));
  }
  // piezas modeladas a propósito para la forma (nodos `var_<forma>` del GLB)
  for (const [name, nodes] of Object.entries(actor.variantNodes)) for (const n of nodes) n.visible = name === form;
  for (const [name, nodes] of Object.entries(actor.baseNodes || {})) for (const n of nodes) n.visible = name !== form;   // piezas de la forma base que esa forma reemplaza
  // con una forma con piezas propias (esqueleto), la piel y los pelos se ocultan si el modelo trae el esqueleto
  if (actor.hasVariant(form) && form === 'esqueleto') for (const o of meshes) if (o.userData.cat === 'piel' || o.userData.cat === 'flexible') o.visible = false;
  const k = SCALE[form] || 1;
  actor.holder.scale.setScalar(actor.baseScale * k);
}

export function tickForms(t) { FORM_TIME.value = t; }
