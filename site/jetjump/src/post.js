// Render cinematográfico: oclusión ambiental (GTAO), brillo suave, gradación de color de cine,
// viñeta, aberración cromática leve y grano de película. El mapeo tonal fílmico va al final.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: 0 }, uVig: { value: 0.16 }, uCA: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVig, uCA; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5; float r2 = dot(d, d);
      vec3 c;
      c.r = texture2D(tDiffuse, vUv + d * uCA * r2 * 4.0).r;
      c.g = texture2D(tDiffuse, vUv).g;
      c.b = texture2D(tDiffuse, vUv - d * uCA * r2 * 4.0).b;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      // saturación y tono partido: sombras frías, luces cálidas (como una cámara de cine con sol)
      c = mix(vec3(l), c, 1.0);   // VIS-JUMP-01: sin saturación añadida sobre texturas ya calibradas
      c *= mix(vec3(0.95, 0.99, 1.06), vec3(1.06, 1.0, 0.92), smoothstep(0.02, 1.0, l));
      // contraste suave en escala logarítmica
      c = pow(max(c, 0.0), vec3(1.04));
      // viñeta
      c *= 1.0 - uVig * smoothstep(0.18, 0.75, r2 * 2.0);
      // grano de película, más visible en medios tonos
      float g = hash(vUv * vec2(1931.0, 1777.0) + uTime) - 0.5;
      c += g * uGrain * (0.25 + l);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export class Post {
  constructor(renderer, scene, camera, quality) {
    this.r = renderer; this.q = quality;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: quality.hd ? 4 : 2 });
    this.composer = new EffectComposer(renderer, rt);
    this.render = new RenderPass(scene, camera);
    this.composer.addPass(this.render);
    // oclusión ambiental: las sombras de contacto son lo que más separa una imagen "dibujada" de una real
    // la oclusión se calcula con una cámara que no ve la capa 1 (recortes por alfa: árboles, público, polvo)
    this.aoCam = camera.clone(); this.aoCam.layers.set(0); this.cam = camera;
    this.ao = new GTAOPass(scene, this.aoCam, size.x, size.y);
    this.ao.updateGtaoMaterial({ radius: 0.7, distanceExponent: 1.4, thickness: 1.2, scale: 1.15, samples: quality.hd ? 16 : 8, distanceFallOff: 1.0 });
    this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: quality.hd ? 16 : 8 });
    this.ao.blendIntensity = 0.9;
    this.composer.addPass(this.ao);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.16, 0.6, 0.92);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
  }
  setCamera(cam) { this.render.camera = cam; this.cam = cam; }
  setSize(w, h) {
    this.composer.setPixelRatio(this.r.getPixelRatio());
    this.composer.setSize(w, h);
  }
  draw(dt) {
    const c = this.cam; this.aoCam.position.copy(c.position); this.aoCam.quaternion.copy(c.quaternion);
    this.aoCam.fov = c.fov; this.aoCam.aspect = c.aspect; this.aoCam.near = c.near; this.aoCam.far = c.far; this.aoCam.updateProjectionMatrix(); this.aoCam.updateMatrixWorld(); this.grade.uniforms.uTime.value = (this.grade.uniforms.uTime.value + dt * 0.37) % 10; this.composer.render(dt); }
}
