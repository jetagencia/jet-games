// Entorno de luz (reflejos y luz ambiente realistas), generado por código.
import * as THREE from '../vendor/three.module.js';

export function makeEnv(renderer, { top = 0xb9c6d6, horizon = 0x8b9096, ground = 0x3b3a36, key = 0xfff0dc, keyPower = 7 } = {}) {
  const scene = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(horizon) }, bot: { value: new THREE.Color(ground) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 hor; uniform vec3 bot; void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(hor, top, pow(y, 0.6)) : mix(hor, bot, pow(-y, 0.5)); gl_FragColor = vec4(c, 1.0); }',
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), mat));
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ color: new THREE.Color(key).multiplyScalar(keyPower), side: THREE.DoubleSide }));
  panel.position.set(-24, 30, 18); panel.lookAt(0, 0, 0); scene.add(panel);
  const rim = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9fb7ff).multiplyScalar(2.5), side: THREE.DoubleSide }));
  rim.position.set(26, 12, -26); rim.lookAt(0, 0, 0); scene.add(rim);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(scene, 0.02).texture;
  pm.dispose();
  return tex;
}
