// El viajero: figura encapuchada con farol, provisional y de diseño propio, armada con
// formas simples. Se mueve con aceleración suave, desliza por las paredes y no atraviesa
// nada. Su farol es la luz que ilumina el pueblo a su alrededor.
import * as THREE from '../vendor/three.module.js';
import { resolveCircle } from './world.js';

const mat = (color, extra) => new THREE.MeshLambertMaterial({ color, ...extra });
const CLOAK = mat(0x8a3f30), MANTLE = mat(0x4f3d36), HOOD = mat(0x6a3026), FACE = mat(0x0e0c0b);
const PANTS = mat(0x3c424e), BOOT = mat(0x3a2b22), LEATHER = mat(0x6e503a), STRAP = mat(0x46321f), IRON = mat(0x3b4048);
const EYES = mat(0xdff0ff, { emissive: 0xbfe0ff, emissiveIntensity: 1.6 });
const FLAME = mat(0xffc070, { emissive: 0xff9a3a, emissiveIntensity: 2.2 });

const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class Player {
  constructor(scene, world) {
    this.world = world;
    this.pos = { x: world.spawn.x, z: world.spawn.z };
    this.vx = 0; this.vz = 0;
    this.yaw = Math.PI; // empieza mirando al norte
    this.speed = 0; this.phase = 0;
    this.radius = 0.42;

    const root = (this.root = new THREE.Group());
    const body = (this.body = new THREE.Group());
    root.add(body);
    const add = (parent, geo, m, x, y, z) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = false;
      parent.add(mesh); return mesh;
    };

    // piernas: pivote en la cadera (asoman bajo la capa)
    const leg = (x) => {
      const g = new THREE.Group(); g.position.set(x, 0.5, 0); body.add(g);
      add(g, new THREE.CylinderGeometry(0.075, 0.065, 0.46, 8), PANTS, 0, -0.23, 0);
      add(g, new THREE.BoxGeometry(0.17, 0.12, 0.3), BOOT, 0, -0.5, 0.045);
      return g;
    };
    this.legL = leg(-0.11); this.legR = leg(0.11);

    // capa larga, mantelete, capucha y rostro en sombra
    add(body, new THREE.ConeGeometry(0.42, 1.0, 10), CLOAK, 0, 0.72, 0);
    add(body, new THREE.CylinderGeometry(0.17, 0.2, 0.5, 10), CLOAK, 0, 1.1, 0);
    add(body, new THREE.SphereGeometry(0.27, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), MANTLE, 0, 1.24, 0).scale.set(1.1, 0.8, 1);
    add(body, new THREE.CylinderGeometry(0.205, 0.205, 0.07, 10), STRAP, 0, 0.88, 0); // cinto
    add(body, new THREE.BoxGeometry(0.08, 0.08, 0.04), IRON, 0, 0.88, 0.2);
    add(body, new THREE.SphereGeometry(0.17, 14, 10), FACE, 0, 1.5, 0.03);
    const hood = add(body, new THREE.SphereGeometry(0.245, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), HOOD, 0, 1.52, -0.03);
    hood.rotation.x = -0.35;
    add(body, new THREE.ConeGeometry(0.1, 0.42, 6), HOOD, 0, 1.62, -0.22).rotation.x = -1.15; // punta caída de la capucha
    for (const s of [-1, 1]) add(body, new THREE.SphereGeometry(0.028, 8, 6), EYES, s * 0.065, 1.5, 0.185);

    // mochila con petate
    add(body, new THREE.BoxGeometry(0.3, 0.38, 0.17), LEATHER, 0, 1.0, -0.3);
    add(body, new THREE.CylinderGeometry(0.075, 0.075, 0.34, 8), STRAP, 0, 1.24, -0.3).rotation.z = Math.PI / 2;

    // brazos: pivote en el hombro. El derecho sostiene el farol.
    const arm = (x) => {
      const g = new THREE.Group(); g.position.set(x, 1.24, 0); body.add(g);
      add(g, new THREE.CapsuleGeometry(0.055, 0.3, 3, 8), CLOAK, 0, -0.2, 0);
      add(g, new THREE.SphereGeometry(0.05, 8, 6), FACE, 0, -0.44, 0);
      return g;
    };
    this.armL = arm(-0.27); this.armR = arm(0.27);
    const lantern = (this.lantern = new THREE.Group()); lantern.position.set(0, -0.5, 0.04); this.armR.add(lantern);
    add(lantern, new THREE.BoxGeometry(0.17, 0.03, 0.17), IRON, 0, 0.12, 0);
    add(lantern, new THREE.BoxGeometry(0.17, 0.03, 0.17), IRON, 0, -0.12, 0);
    add(lantern, new THREE.BoxGeometry(0.1, 0.2, 0.1), FLAME, 0, 0, 0);
    for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(lantern, new THREE.CylinderGeometry(0.01, 0.01, 0.24, 4), IRON, px * 0.075, 0, pz * 0.075);
    add(lantern, new THREE.TorusGeometry(0.05, 0.008, 4, 10, Math.PI), IRON, 0, 0.14, 0);
    scene.add(root);
    this.sync();
  }

  // aspecto comprado en la tienda: cambia los colores de la capa, la capucha y el mantelete
  setSkin(s) { CLOAK.color.setHex(s.cloak); HOOD.color.setHex(s.hood); MANTLE.color.setHex(s.mantle); }

  sync() {
    this.root.position.set(this.pos.x, 0, this.pos.z);
    this.root.rotation.y = this.yaw;
  }

  update(dt, mv, t) {
    if (!(dt > 0)) return; // primer cuadro o pestaña recién activada: nada que avanzar
    const top = mv.run ? 9 : 6;
    const tx = mv.x * mv.mag * top, tz = mv.y * mv.mag * top;
    const k = 1 - Math.exp(-dt * (mv.mag > 0 ? 12 : 16));
    this.vx += (tx - this.vx) * k; this.vz += (tz - this.vz) * k;

    const ox = this.pos.x, oz = this.pos.z;
    this.pos.x += this.vx * dt; this.pos.z += this.vz * dt;
    const ix = this.pos.x, iz = this.pos.z;
    resolveCircle(this.pos, this.radius, this.world.colliders);
    if (Math.abs(this.pos.x - ix) + Math.abs(this.pos.z - iz) > 1e-5) { // chocó: la velocidad sigue lo que sí avanzó
      this.vx = (this.pos.x - ox) / dt; this.vz = (this.pos.z - oz) / dt;
    }
    const real = Math.hypot(this.pos.x - ox, this.pos.z - oz) / dt;
    this.speed += (real - this.speed) * (1 - Math.exp(-dt * 12));

    if (mv.mag > 0.1) {
      const target = Math.atan2(mv.x, mv.y);
      this.yaw += wrapAngle(target - this.yaw) * (1 - Math.exp(-dt * 16));
    }

    // animación de caminata provisional
    const sp = Math.min(1, this.speed / 5);
    this.phase += this.speed * dt * 1.5;
    const sw = Math.sin(this.phase) * 0.7 * sp;
    this.legL.rotation.x = sw; this.legR.rotation.x = -sw;
    this.armL.rotation.x = -sw * 0.9;
    this.armR.rotation.x = -0.55 + sw * 0.18; // el farol va al frente, casi quieto
    this.lantern.rotation.x = 0.55 - sw * 0.1;
    this.body.position.y = Math.abs(Math.sin(this.phase)) * 0.06 * sp;
    this.body.rotation.x = sp * 0.1 + (this.speed > 7 ? 0.08 : 0);
    this.body.scale.y = 1 + Math.sin(t * 2) * 0.01 * (1 - sp);
    this.sync();
  }
}
