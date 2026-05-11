// JETDrift — Modo Carrera (race A→B con checkpoints)
// El jugador atraviesa N checkpoints en orden contra el reloj.
// Win condition: pasar todos los checkpoints + cruzar la meta.

import * as THREE from 'three';

const NUM_CHECKPOINTS = 5;
const CHECKPOINT_RADIUS = 3.5;

export class CarreraMode {
  constructor() {
    this.name = 'carrera';
    this.checkpoints = [];
    this.currentIdx = 0;
    this.elapsed = 0;
    this.bestTime = parseFloat(localStorage.getItem('jetdrift-best-carrera') || '0');
    this.objects = [];
  }

  spawnPoint() {
    return { x: 0, z: 0, yaw: 0 };
  }

  build(scene, theme) {
    this.elapsed = 0;
    this.currentIdx = 0;
    this.checkpoints = [];

    // Generate a track: spawn at origin, then 5 checkpoints around the world,
    // ending with a goal back near origin (ish).
    // For variety, generate them in a wandering path with random angles.
    const points = [];
    let lastX = 0, lastZ = 0;
    let angle = -Math.PI / 2; // initially heading 'forward' (north)
    for (let i = 0; i < NUM_CHECKPOINTS; i++) {
      const dist = 18 + Math.random() * 10;
      // Allow turn but not too much
      angle += (Math.random() - 0.5) * Math.PI * 0.7;
      lastX += Math.cos(angle) * dist;
      lastZ += Math.sin(angle) * dist;
      points.push({ x: lastX, z: lastZ });
    }
    // Goal is the last checkpoint visually different
    this.checkpoints = points.map((p, i) => this._buildCheckpoint(scene, theme, p, i, i === points.length - 1));
  }

  _buildCheckpoint(scene, theme, point, index, isGoal) {
    const group = new THREE.Group();

    // Color based on theme
    const ringColor = isGoal
      ? (theme.name === 'spire' ? 0xd4647a : 0xff8844)   // goal: rose / orange
      : (theme.name === 'spire' ? 0x6a85b0 : 0xffd6a8);  // checkpoint: blue / peach

    // Two posts + ring
    const postMat = new THREE.MeshStandardMaterial({
      color: ringColor, emissive: ringColor, emissiveIntensity: 0.5,
      flatShading: true, roughness: 0.4, metalness: 0.4,
    });
    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4, 6), postMat);
    post1.position.set(-2.8, 2, 0);
    group.add(post1);
    const post2 = post1.clone();
    post2.position.x = 2.8;
    group.add(post2);

    // Top connector ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 16), postMat);
    ring.position.set(0, 4, 0);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Floating arrow above (only for current checkpoint)
    const arrowGeom = new THREE.ConeGeometry(0.6, 1.2, 4);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: ringColor, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const arrow = new THREE.Mesh(arrowGeom, arrowMat);
    arrow.position.set(0, 5.5, 0);
    arrow.rotation.x = Math.PI;
    group.add(arrow);

    // Light beam (vertical column)
    const beamGeom = new THREE.CylinderGeometry(0.6, 0.6, 8, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: ringColor, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeom, beamMat);
    beam.position.set(0, 4, 0);
    group.add(beam);

    // Light source
    const light = new THREE.PointLight(ringColor, 2.5, 14, 1.6);
    light.position.set(0, 3, 0);
    group.add(light);

    // Ground ring on floor (visual marker)
    const groundRingGeom = new THREE.RingGeometry(2.5, 3.2, 32);
    const groundRingMat = new THREE.MeshBasicMaterial({
      color: ringColor, transparent: true, opacity: 0.5,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const groundRing = new THREE.Mesh(groundRingGeom, groundRingMat);
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.y = 0.05;
    group.add(groundRing);

    group.position.set(point.x, 0, point.z);
    scene.add(group);
    this.objects.push(group);

    return {
      x: point.x, z: point.z,
      mesh: group,
      arrow,
      beam,
      light,
      groundRing,
      isGoal,
      reached: false,
      pulsePhase: Math.random() * Math.PI * 2,
    };
  }

  update(dt, hovercraft, gameState) {
    this.elapsed += dt;
    const events = {};

    // Check current checkpoint pickup
    const cur = this.checkpoints[this.currentIdx];
    if (cur && !cur.reached) {
      const dx = cur.x - hovercraft.position.x;
      const dz = cur.z - hovercraft.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < CHECKPOINT_RADIUS) {
        cur.reached = true;
        // Visual feedback: dim
        cur.beam.material.opacity = 0.05;
        cur.groundRing.material.opacity = 0.15;
        cur.light.intensity = 0.3;
        if (cur.arrow) cur.arrow.visible = false;

        events.checkpoint = true;

        if (cur.isGoal) {
          // WIN
          const isNewBest = !this.bestTime || this.elapsed < this.bestTime;
          if (isNewBest) {
            this.bestTime = this.elapsed;
            localStorage.setItem('jetdrift-best-carrera', this.bestTime.toString());
          }
          events.win = {
            time: formatTime(this.elapsed),
            best: this.bestTime ? formatTime(this.bestTime) : null,
            newBest: isNewBest,
          };
        } else {
          this.currentIdx++;
        }
      }
    }

    // Animate checkpoints (pulse)
    for (let i = 0; i < this.checkpoints.length; i++) {
      const c = this.checkpoints[i];
      if (c.reached) continue;
      c.pulsePhase += dt * 2;
      const pulse = (Math.sin(c.pulsePhase) + 1) / 2;
      const isCurrent = i === this.currentIdx;
      const targetIntensity = isCurrent ? (1.5 + pulse * 1.2) : 0.6;
      c.light.intensity = targetIntensity;
      // Arrow bobbing
      if (c.arrow && isCurrent) {
        c.arrow.position.y = 5.5 + Math.sin(c.pulsePhase * 1.5) * 0.3;
        c.arrow.rotation.y += dt * 2;
        c.arrow.visible = true;
        c.arrow.material.opacity = 0.7 + pulse * 0.3;
      } else if (c.arrow && !isCurrent) {
        c.arrow.visible = false;
      }
      // Beam wave
      c.beam.material.opacity = 0.12 + pulse * 0.08;
    }

    return events;
  }

  getHUD() {
    const cur = this.currentIdx;
    return {
      left: { label: 'Tiempo', value: formatTime(this.elapsed) },
      right: { label: 'Checkpoint', value: (cur + 1) + '/' + this.checkpoints.length },
    };
  }

  dispose(scene) {
    for (const o of this.objects) scene.remove(o);
    this.objects = [];
    this.checkpoints = [];
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return m + ':' + sec.toFixed(2).padStart(5, '0');
}
