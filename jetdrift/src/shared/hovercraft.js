// JETDrift — Hovercraft (low-poly mesh + drift physics)

import * as THREE from 'three';

const ACCEL = 26;
const BOOST_ACCEL = 60;
const FRICTION = 3.5;
const TURN_SPEED = 4.8;
const MAX_SPEED = 18;
const BOOST_MAX = 32;

export class Hovercraft {
  constructor(scene, theme) {
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.targetYaw = 0;
    this.bobPhase = 0;
    this.tilt = 0;             // visual tilt for turning

    this.mesh = this._buildMesh(theme);
    this.attach(scene, theme);
  }

  attach(scene, theme) {
    if (!this.mesh.parent) scene.add(this.mesh);
    // re-skin if theme changed
    this._reskin(theme);
  }

  _buildMesh(theme) {
    const group = new THREE.Group();

    // Body — low poly squashed octahedron
    const bodyColor = theme.hovercraftColors?.body ?? 0xc1502e;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor, flatShading: true,
      roughness: 0.55, metalness: 0.25,
    });
    const bodyGeom = new THREE.OctahedronGeometry(0.85, 0);
    bodyGeom.scale(1.6, 0.5, 1.0);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.5;
    group.add(body);
    this._body = body;
    this._bodyMat = bodyMat;

    // Cockpit dome — small low-poly sphere
    const cockColor = theme.hovercraftColors?.cockpit ?? 0xfff4d6;
    const cockMat = new THREE.MeshStandardMaterial({
      color: cockColor, flatShading: true,
      roughness: 0.2, metalness: 0.5,
      emissive: cockColor, emissiveIntensity: 0.18,
    });
    const cockGeom = new THREE.IcosahedronGeometry(0.34, 0);
    const cock = new THREE.Mesh(cockGeom, cockMat);
    cock.position.set(0.15, 0.85, 0);
    cock.scale.set(1, 0.8, 1.1);
    group.add(cock);
    this._cock = cock;
    this._cockMat = cockMat;

    // Side fins
    const finColor = theme.hovercraftColors?.fin ?? 0x6b3624;
    const finMat = new THREE.MeshStandardMaterial({
      color: finColor, flatShading: true,
      roughness: 0.7, metalness: 0.1,
    });
    const finGeom = new THREE.ConeGeometry(0.45, 0.7, 3);
    finGeom.rotateZ(Math.PI / 2);
    const finL = new THREE.Mesh(finGeom, finMat);
    finL.position.set(-0.35, 0.5, 0.85);
    finL.rotation.y = -Math.PI / 2;
    finL.scale.set(0.6, 0.7, 1);
    group.add(finL);
    const finR = finL.clone();
    finR.position.z = -0.85;
    group.add(finR);
    this._finMat = finMat;

    // Underglow (cushion of air visual)
    const glowColor = theme.hovercraftColors?.glow ?? 0xffd0a8;
    const glowMat = new THREE.MeshBasicMaterial({
      color: glowColor, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const glowGeom = new THREE.CircleGeometry(1.4, 24);
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.05;
    group.add(glow);
    this._glow = glow;
    this._glowMat = glowMat;

    // Trail dust (particle system simple)
    const trailGeom = new THREE.BufferGeometry();
    const TRAIL_N = 40;
    const trailPositions = new Float32Array(TRAIL_N * 3);
    const trailColors = new Float32Array(TRAIL_N * 3);
    trailGeom.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeom.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    const trailMat = new THREE.PointsMaterial({
      size: 0.5, vertexColors: true, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
      sizeAttenuation: true,
    });
    this._trailGeom = trailGeom;
    this._trailMat = trailMat;
    this._trailMesh = new THREE.Points(trailGeom, trailMat);
    this._trailHistory = [];
    // Trail no se hace child del group — vive en el mundo
    this._trailParent = null;

    return group;
  }

  _reskin(theme) {
    if (!theme || !theme.hovercraftColors) return;
    if (this._bodyMat && theme.hovercraftColors.body) this._bodyMat.color.setHex(theme.hovercraftColors.body);
    if (this._cockMat && theme.hovercraftColors.cockpit) {
      this._cockMat.color.setHex(theme.hovercraftColors.cockpit);
      this._cockMat.emissive.setHex(theme.hovercraftColors.cockpit);
    }
    if (this._finMat && theme.hovercraftColors.fin) this._finMat.color.setHex(theme.hovercraftColors.fin);
    if (this._glowMat && theme.hovercraftColors.glow) this._glowMat.color.setHex(theme.hovercraftColors.glow);
  }

  respawn(point) {
    this.position.set(point.x, 0, point.z);
    if (point.yaw !== undefined) this.yaw = point.yaw;
    this.targetYaw = this.yaw;
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 0.6;
    this.mesh.rotation.y = -this.yaw;

    // Trail clear
    this._trailHistory = [];
    if (this._trailMesh.parent) this._trailMesh.parent.remove(this._trailMesh);
  }

  update(dt, input, gameState) {
    const useBoost = input.boostTimer > 0;
    const accel = useBoost ? BOOST_ACCEL : ACCEL;
    const maxSp = useBoost ? BOOST_MAX : MAX_SPEED;

    // Joystick → target yaw + thrust
    if (input.active && (Math.abs(input.dx) + Math.abs(input.dy)) > 0.05) {
      // dx > 0 = right, dy > 0 = down (screen). Up on screen = forward.
      // Map: targetYaw such that hovercraft points where finger points
      this.targetYaw = Math.atan2(input.dx, -input.dy);
      const diff = angleDiff(this.targetYaw, this.yaw);
      this.yaw += diff * Math.min(1, dt * TURN_SPEED);

      // Forward in world: yaw 0 = +Z forward in our convention (camera looks -Z from behind)
      // Let's say yaw 0 = forward = -Z. So vectors: fx = sin(yaw), fz = -cos(yaw)
      const mag = Math.min(1, Math.hypot(input.dx, input.dy));
      const fx = Math.sin(this.yaw);
      const fz = -Math.cos(this.yaw);
      this.velocity.x += fx * accel * mag * dt;
      this.velocity.z += fz * accel * mag * dt;

      // Visual tilt — leans into turn
      const tiltTarget = -diff * 0.6;
      this.tilt += (tiltTarget - this.tilt) * Math.min(1, dt * 8);
    } else {
      this.tilt += (0 - this.tilt) * Math.min(1, dt * 6);
    }

    // Friction
    const friction = Math.exp(-FRICTION * dt);
    this.velocity.x *= friction;
    this.velocity.z *= friction;

    // Cap
    const sp = Math.hypot(this.velocity.x, this.velocity.z);
    if (sp > maxSp) {
      this.velocity.x = this.velocity.x / sp * maxSp;
      this.velocity.z = this.velocity.z / sp * maxSp;
    }

    // Move
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // Bob (engine vibration)
    this.bobPhase += dt * (4 + sp / MAX_SPEED * 7);
    const bobY = 0.6 + Math.sin(this.bobPhase) * 0.08 * (sp / MAX_SPEED + 0.4);
    const bobR = Math.sin(this.bobPhase * 0.5) * 0.03;

    // Apply to mesh
    this.mesh.position.set(this.position.x, bobY, this.position.z);
    this.mesh.rotation.set(bobR, -this.yaw, this.tilt);

    // Engine sound
    if (gameState?.audio) {
      gameState.audio.setEngineLevel(Math.min(1, sp / MAX_SPEED));
    }

    // Trail emission
    if (sp > 4) {
      this._trailHistory.push({ x: this.position.x, y: 0.4, z: this.position.z, life: 1, jitter: (Math.random() - 0.5) * 0.4 });
      if (this._trailHistory.length > 40) this._trailHistory.shift();
    }
    this._updateTrail(dt, gameState?.scene);
  }

  _updateTrail(dt, scene) {
    if (!scene) return;
    if (!this._trailMesh.parent) scene.add(this._trailMesh);

    for (const t of this._trailHistory) t.life -= dt * 1.4;
    this._trailHistory = this._trailHistory.filter(t => t.life > 0);

    const pos = this._trailGeom.attributes.position.array;
    const col = this._trailGeom.attributes.color.array;
    const N = 40;
    for (let i = 0; i < N; i++) {
      const t = this._trailHistory[i];
      if (t) {
        pos[i*3+0] = t.x + t.jitter;
        pos[i*3+1] = t.y * t.life + 0.1;
        pos[i*3+2] = t.z + t.jitter;
        col[i*3+0] = 1.0; col[i*3+1] = 0.85 * t.life; col[i*3+2] = 0.6 * t.life;
      } else {
        pos[i*3+0] = 9999; pos[i*3+1] = 9999; pos[i*3+2] = 9999;
      }
    }
    this._trailGeom.attributes.position.needsUpdate = true;
    this._trailGeom.attributes.color.needsUpdate = true;

    this._trailMat.opacity = 0.7;
  }
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
