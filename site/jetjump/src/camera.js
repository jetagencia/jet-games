// Cámaras: persecución (Detrás, Cerca), realización de transmisión con varias cámaras fijas y lente
// largo (Televisión), y la vista del jinete (Jinete). Todas se adaptan a vertical u horizontal.
import * as THREE from 'three';
import { ARENA } from './course.js';

export const CAM_NAMES = { chase: 'Detrás', near: 'Cerca', tv: 'Televisión', pov: 'Jinete' };
export const CAM_MODES = ['chase', 'near', 'tv', 'pov'];

// puestos de cámara de la transmisión: tribuna norte (centro y esquinas), cabeceras y lado sur
const STATIONS = [
  { p: new THREE.Vector3(0, 5.2, -34.6), name: 'tribuna' },      // delante del alero (antes quedaba dentro del techo: pantalla gris)
  { p: new THREE.Vector3(-40, 6, -36), name: 'esquina NO' },
  { p: new THREE.Vector3(40, 6, -36), name: 'esquina NE' },
  { p: new THREE.Vector3(-52, 4.5, 0), name: 'cabecera O' },
  { p: new THREE.Vector3(52, 4.5, 0), name: 'cabecera E' },
  { p: new THREE.Vector3(0, 5.5, 37), name: 'lado sur' },
];

export class ChaseCam {
  constructor(aspect) {
    this.cam = new THREE.PerspectiveCamera(50, aspect, 0.1, 900);
    this.cam.layers.enable(1);
    this.mode = 'chase';
    this.pos = new THREE.Vector3(-50, 4, 30); this.look = new THREE.Vector3();
    this.lift = 0; this.yaw = 0; this.first = true;
    this.station = 0; this.cutT = 99; this.tvFov = 30; this.povYaw = 0;
  }
  resize(w, h) {
    this.portrait = h > w && w < 700;              // ventana alta en escritorio: cámara de horizontal
    this.cam.aspect = w / h;
    this.applyFov();
  }
  baseFov() {
    const P = this.portrait;
    if (this.mode === 'pov') return P ? 72 : 62;
    if (this.mode === 'tv') return this.tvFov;
    return P ? 56 : 38;
  }
  applyFov() {
    const f = this.baseFov();
    if (Math.abs(this.cam.fov - f) > 0.05) { this.cam.fov = f; this.cam.updateProjectionMatrix(); }
  }
  // target: la valla siguiente o la llegada, para que la realización encuadre caballo y obstáculo
  update(dt, ride, horse, target) {
    const fx = Math.cos(ride.h), fz = Math.sin(ride.h);
    const J = ride.jump, air = J && J.phase === 'air' ? Math.sin(Math.PI * Math.min(1, J.t / J.airT)) : 0;
    this.lift += ((this.reduced ? 0 : air) - this.lift) * (1 - Math.exp(-dt * 4));   // movimiento reducido: sin subir con el salto
    if (this.first) this.yaw = ride.h;
    this.yaw += angDiff(this.yaw, ride.h) * (1 - Math.exp(-dt * 4.5));
    const cx = Math.cos(this.yaw), cz = Math.sin(this.yaw);
    const P = this.portrait;
    let want, look, k = 1 - Math.exp(-dt * 6), kl = 1 - Math.exp(-dt * 8);
    if (this.mode === 'pov') {
      // ojos del jinete: el hueso de la cabeza trae el bamboleo real del galope y del salto
      const head = horse.headWorld ? horse.headWorld() : new THREE.Vector3(ride.x, 2.0, ride.z);
      this.povYaw += angDiff(this.povYaw, ride.h) * (1 - Math.exp(-dt * 5));
      const px = Math.cos(this.povYaw), pz = Math.sin(this.povYaw);
      want = new THREE.Vector3(head.x + px * 0.17, head.y + 0.03, head.z + pz * 0.17);
      const ahead = target ? new THREE.Vector3(target.x, 1.0, target.z) : new THREE.Vector3(ride.x + px * 30, 1.2, ride.z + pz * 30);
      // mirada: al frente, girando un poco hacia la valla siguiente
      const dir = new THREE.Vector3(px, 0, pz).lerp(ahead.sub(want).normalize(), 0.35).normalize();
      look = want.clone().addScaledVector(dir, 12); look.y = want.y - 0.9 + this.lift * 0.8;
      k = 1; kl = 1 - Math.exp(-dt * 10);
    } else if (this.mode === 'tv') {
      // realización: se elige el puesto más cercano al punto medio caballo-valla, con corte seco y sin
      // cambiar de cámara a cada rato; el zoom encuadra al caballo con la valla cuando están cerca
      // puesto: cerca del caballo y, a igual distancia, alineado con su rumbo (así caballo y valla quedan en línea)
      this.cutT += dt;
      const score = (s) => { const dx = ride.x - s.p.x, dz = ride.z - s.p.z, d = Math.hypot(dx, dz); const c = Math.abs((dx * fx + dz * fz) / Math.max(1, d)); return d / (0.55 + 0.45 * c); };
      let best = this.station, bs = score(STATIONS[this.station]);
      STATIONS.forEach((s, i) => { const sc = score(s); if (sc < bs * 0.7) { best = i; bs = sc; } });
      if (best !== this.station && this.cutT > 4) { this.station = best; this.cutT = 0; this.first = true; }
      const S = STATIONS[this.station].p;
      want = S.clone();
      const hp = new THREE.Vector3(ride.x, 1.3, ride.z);
      look = hp.clone();
      let fov = 2 * Math.atan(3.2 / S.distanceTo(hp)) * 180 / Math.PI;   // ~6 m de alto en cuadro
      if (target) {
        const tp = new THREE.Vector3(target.x, 1.0, target.z);
        const dH = hp.clone().sub(S), dT = tp.clone().sub(S);
        const ang = dH.angleTo(dT) * 180 / Math.PI;
        // en los últimos metros la cámara abre para mostrar la valla; antes sigue al caballo de cerca
        const dh = hp.distanceTo(tp);
        if (dh < 16) { const w = 1 - dh / 16; look.lerp(tp, 0.35 * w); fov = Math.max(fov, (ang * 1.3 + 6) * w + fov * (1 - w)); }
      }
      this.tvFov += (clamp(fov * (P ? 1.5 : 1), 10, P ? 60 : 42) - this.tvFov) * (this.first ? 1 : 1 - Math.exp(-dt * 3));
      k = 1; kl = this.first ? 1 : 1 - Math.exp(-dt * 5);
    } else {
      let dist, hgt, ahead, lookY;
      if (this.mode === 'near') { dist = P ? 6.2 : 5.0; hgt = 2.4; ahead = 4; lookY = 1.6; }
      else { dist = P ? 9.2 : 7.4; hgt = P ? 3.3 : 2.7; ahead = P ? 9 : 7.5; lookY = 1.35; }
      dist += this.lift * 1.2; hgt += this.lift * 0.4;
      want = new THREE.Vector3(ride.x - cx * dist, hgt, ride.z - cz * dist);
      look = new THREE.Vector3(ride.x + fx * ahead, lookY + this.lift * 0.6, ride.z + fz * ahead);
      // la cámara no sale de la pista: el cerco no se interpone
      const d0 = Math.hypot(want.x - ride.x, want.z - ride.z);
      // en vertical la cámara va más lejos y más alta (3,3 m): puede pasar hasta 1,9 m por fuera del
      // cerco (1,3 m de alto, queda fuera de cuadro) en vez de acercarse y subir encima del caballo al largar
      const mg = -3;
      want.x = clamp(want.x, -ARENA.w / 2 + mg, ARENA.w / 2 - mg); want.z = clamp(want.z, -ARENA.h / 2 + mg, ARENA.h / 2 - mg);
      // contra el cerco la cámara no se pega al caballo: lo que pierde de distancia lo gana en altura
      const lost = d0 - Math.hypot(want.x - ride.x, want.z - ride.z);
      if (lost > 0.05) want.y += Math.min(4, lost * 0.8);
    }
    if (this.first) { k = 1; kl = 1; }
    this.pos.lerp(want, k); this.look.lerp(look, kl);
    this.first = false;
    this.applyFov();
    this.cam.position.copy(this.pos);
    // encuadre: en las cámaras de persecución los cascos nunca bajan del borde útil de la pantalla
    // (contra el cerco, sobre todo al largar, la cámara sube y se acerca: sin esto, en vertical el
    // caballo quedaba cortado abajo, detrás de los controles). Solo inclina la mirada hacia abajo lo
    // justo; con el encuadre normal no cambia nada.
    let lk = this.look;
    if (this.guard !== false && (this.mode === 'chase' || this.mode === 'near')) {
      const half = this.cam.fov * Math.PI / 360, edge = Math.atan(Math.tan(half) * (P ? 0.6 : 0.82));
      const dx = this.look.x - this.pos.x, dz = this.look.z - this.pos.z, dl = Math.hypot(dx, dz);
      const fd = Math.hypot(ride.x - this.pos.x, ride.z - this.pos.z);
      const pLook = Math.atan2(this.look.y - this.pos.y, dl), pFeet = Math.atan2(-this.pos.y, Math.max(0.5, fd - 1.1));   // grupa: los cascos traseros quedan más cerca
      if (pLook - pFeet > edge && dl > 0.01) {
        const want = pFeet + edge;
        lk = _lk.set(this.look.x, this.pos.y + Math.tan(want) * dl, this.look.z);
      }
    }
    this.cam.lookAt(lk);
  }
}
const _lk = new THREE.Vector3();
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
