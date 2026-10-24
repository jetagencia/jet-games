// Envejecimiento por sombreado: ensucia, moteá y cubre (nieve, musgo, ceniza) las superficies según su
// posición en el mundo, sin necesidad de UV ni de texturas. Funciona con cualquier malla fusionada.
import * as THREE from '../vendor/three.module.js';
import { LOW } from './quality.js';

const NOISE = /* glsl */ `
float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
float wn1, wn2, wCover;
vec3 wPerturb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection){
  vec3 vSigmaX = normalize(dFdx(surf_pos.xyz)); vec3 vSigmaY = normalize(dFdy(surf_pos.xyz)); vec3 vN = surf_norm;
  vec3 R1 = cross(vSigmaY, vN); vec3 R2 = cross(vN, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDirection;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
`;

// lite (calidad baja, teléfonos): un fbm3 más un ruido simple para el moteado fino, y sin la perturbación de normales (la parte más cara: derivadas y otro fbm3).
export function weathered(mat, theme, { lite = LOW } = {}) {
  const cover = new THREE.Color(theme.cover ? theme.cover.color : 0xffffff);
  const dirt = new THREE.Color(theme.dirt ? theme.dirt.color : 0x000000);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uCover = { value: new THREE.Vector4(cover.r, cover.g, cover.b, theme.cover ? theme.cover.amount : 0) };
    sh.uniforms.uDirt = { value: new THREE.Vector4(dirt.r, dirt.g, dirt.b, theme.dirt ? theme.dirt.amount : 0) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNor;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWNor = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNor;\nuniform vec4 uCover;\nuniform vec4 uDirt;\n' + NOISE)
      .replace('#include <color_fragment>', `#include <color_fragment>
        wn1 = fbm3(vWPos * 0.9); wn2 = ${lite ? 'vnoise(vWPos * 5.0)' : 'fbm3(vWPos * 5.0)'};
        float wUp = clamp(vWNor.y, 0.0, 1.0);
        diffuseColor.rgb *= mix(0.78, 1.16, wn1) * mix(0.95, 1.05, wn2);
        float wDirt = smoothstep(1.5, 0.0, vWPos.y) * uDirt.a * (0.6 + 0.8 * wn1);
        diffuseColor.rgb = mix(diffuseColor.rgb, uDirt.rgb, clamp(wDirt, 0.0, 0.7));
        wCover = smoothstep(0.5, 0.85, wUp) * uCover.a * smoothstep(0.22, 0.58, wn1 + 0.25 * wn2);
        diffuseColor.rgb = mix(diffuseColor.rgb, uCover.rgb, clamp(wCover, 0.0, 1.0));`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + (wn2 - 0.5) * 0.35 - wCover * 0.25, 0.15, 1.0);');
    if (!lite) sh.fragmentShader = sh.fragmentShader
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{ float hh = fbm3(vWPos * 7.0); normal = wPerturb(-vViewPosition, normal, vec2(dFdx(hh), dFdy(hh)) * 2.4, faceDirection); }');
  };
  mat.customProgramCacheKey = () => 'weather-' + theme.id + (lite ? '-lite' : '');
}
