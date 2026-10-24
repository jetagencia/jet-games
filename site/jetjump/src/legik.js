// Apoyos del caballo: cada casco queda fijo en la arena mientras apoya y la pierna se ajusta con IK de
// cadena (CCD) con límites, sobre la animación original (no la reemplaza). Cuando la animación levanta el
// casco, el bloqueo se suelta suave y el casco vuelve a seguir el clip: así los pasos sostienen el giro y
// los cascos no patinan. También es la única fuente de los eventos de contacto (huella, polvo y sonido).
import * as THREE from 'three';

// el hueso del casco queda unos 8–10 cm sobre la suela: el apoyo se mide respecto de su altura en reposo
const ON = 0.03, OFF = 0.055;            // sobre la altura de reposo de cada casco (m), con histéresis
const MAX_REACH = 0.28;                 // si el clip se aleja más que esto del ancla, se suelta (paso forzado)
const MAX_ERR = 0.06;                   // si la pierna, con sus límites, no llega al ancla, se suelta
const LOW = 0.03;                       // un casco que baja más que esto bajo su reposo ya está en la arena
// un casco bajo pero que se mueve rápido en el mundo está pasando (vuelo rasante del clip), no apoyando
const V_ON = 1.3, V_OFF = 2.2;           // m/s horizontales del casco animado
const LIM_TOP = THREE.MathUtils.degToRad(22), LIM_JOINT = THREE.MathUtils.degToRad(26);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _wq = new THREE.Quaternion();

export class LegIK {
  // legs: [{ toe, chain: [huesoInferior, ..., huesoSuperior], name }]
  constructor(legs, opts = {}) {
    // off: desplazamiento del casco dibujado respecto del clip. Es continuo siempre: al apoyar, el ancla es el
    // lugar donde el casco se ve en ese momento; al soltar, el desplazamiento se desvanece. Nunca hay saltos.
    this.legs = legs.map((L) => ({ rest: 0.09, ...L, prev: new THREE.Vector3(), hv: 0, on: false, w: 0, off: new THREE.Vector3(), anchor: new THREE.Vector3(), anim: new THREE.Vector3(), lastY: 0, vy: 0, fresh: true, base: L.chain.map(() => new THREE.Quaternion()) }));
    this.enabled = true;
    this.onContact = opts.onContact || null;
  }
  reset() { for (const L of this.legs) { L.on = false; L.w = 0; L.off.set(0, 0, 0); L.fresh = true; } }
  // llamar después de mixer.update y de la compensación vertical del cuerpo
  update(dt, { allow = true, fwd } = {}) {
    for (const L of this.legs) {
      L.toe.getWorldPosition(L.anim);
      // salto de posición (caballo recolocado): sin apoyos heredados
      if (L.fresh || _a.copy(L.anim).sub(L.prev).length() > 1.0) { L.prev.copy(L.anim); L.lastY = L.anim.y; L.hv = 0; L.on = false; L.off.set(0, 0, 0); L.fresh = false; }
      const vy = dt > 0 ? (L.anim.y - L.lastY) / dt : 0; L.lastY = L.anim.y;
      const hv = dt > 0 ? Math.hypot(L.anim.x - L.prev.x, L.anim.z - L.prev.z) / dt : 0; L.prev.copy(L.anim);
      L.hv += (hv - L.hv) * 0.5;
      // contacto con el casco tal como se ve: lento y a ras, o ya hundido en la arena y sin subir
      const low = L.anim.y < L.rest - LOW && vy < 0.3 && L.hv < 6;
      if (!L.on && allow && this.enabled && ((L.anim.y < L.rest + ON && L.hv < V_ON) || low)) {
        L.on = true;
        L.anchor.copy(L.anim).add(L.off); L.anchor.y = Math.max(0, Math.min(L.anchor.y, L.anim.y));
        if (this.onContact) this.onContact(L, _c.copy(L.anchor), Math.max(0, -vy), fwd);
      } else if (L.on && (!allow || !this.enabled || L.anim.y > L.rest + OFF || (L.hv > V_OFF && L.anim.y > L.rest - LOW) || _a.copy(L.anim).setY(0).distanceTo(_b.copy(L.anchor).setY(0)) > MAX_REACH)) {
        L.on = false;
      }
      if (L.on) L.off.copy(L.anchor).sub(L.anim);
      // al soltar, el casco vuelve al clip en ~0,1 s
      else L.off.multiplyScalar(Math.exp(-dt * 22));
      L.w = L.on ? 1 : Math.min(1, L.off.length() / 0.01);
      if (L.off.lengthSq() < 1e-6) { L.off.set(0, 0, 0); continue; }
      const err = this.solve(L, _c.copy(L.anim).add(L.off));
      // la pierna no llega (límites): mejor soltar que dejar el casco colgando
      if (L.on && err > MAX_ERR) { L.on = false; L.toe.getWorldPosition(_d); L.off.copy(_d).sub(L.anim); }
    }
  }
  // CCD: de la articulación más baja a la más alta. Cada hueso gira lo justo hacia el objetivo, con un
  // límite respecto de la pose del clip (sin inversiones ni piernas bloqueadas)
  solve(L, target) {
    L.chain.forEach((b, i) => L.base[i].copy(b.quaternion));
    for (let it = 0; it < 6; it++) {
      for (let i = 0; i < L.chain.length; i++) {
        const b = L.chain[i];
        b.getWorldPosition(_a); L.toe.getWorldPosition(_b);
        const ve = _b.sub(_a), vt = _d.copy(target).sub(_a);
        if (ve.lengthSq() < 1e-8 || vt.lengthSq() < 1e-8) continue;
        ve.normalize(); vt.normalize();
        _q.setFromUnitVectors(ve, vt);                         // rotación en el mundo
        b.parent.getWorldQuaternion(_wq);
        // pasar la rotación del mundo al espacio local del hueso: q_local' = inv(P)·q·P·q_local
        _q2.copy(_wq).invert().multiply(_q).multiply(_wq);
        b.quaternion.premultiply(_q2);
        // límite respecto del clip
        const lim = i === L.chain.length - 1 ? LIM_TOP : LIM_JOINT;
        const ang = L.base[i].angleTo(b.quaternion);
        if (ang > lim) b.quaternion.copy(L.base[i]).slerp(b.quaternion, lim / ang);
        b.updateMatrixWorld(true);
      }
      L.toe.getWorldPosition(_b);
      if (_b.distanceTo(target) < 0.004) break;
    }
    return L.toe.getWorldPosition(_b).distanceTo(target);
  }
}
