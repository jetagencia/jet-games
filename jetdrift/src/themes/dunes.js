// JETDrift — Dunes theme
// Warm pastel desert. Alto's Odyssey-inspired (NOT a copy).
// Low-poly hills, distant silhouettes, dynamic sky (sunrise → sunset).

import * as THREE from 'three';

export class DunesTheme {
  constructor() {
    this.name = 'dunes';
    this.bloomStrength = 0.5;
    this.bloomRadius = 0.7;
    this.bloomThreshold = 0.6;

    // Hovercraft skin (warm)
    this.hovercraftColors = {
      body: 0xc1502e,         // terracotta
      cockpit: 0xfff4d6,      // cream
      fin: 0x6b3624,          // dark wood
      glow: 0xffd0a8,         // peach
    };

    this.objects = [];
    this.skyTime = 0.5;       // 0 = dawn, 0.5 = noon, 1 = dusk, then night
    this._sky = null;
    this._sun = null;
    this._fog = null;
  }

  build(scene) {
    // Background = solid color (we paint sky via large sphere)
    scene.background = null;

    // === SKY (big inverted sphere with vertex-color gradient) ===
    const skyGeom = new THREE.SphereGeometry(300, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x6b4488) },
        midColor: { value: new THREE.Color(0xe08a76) },
        botColor: { value: new THREE.Color(0xf4c89a) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 botColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 color;
          if (h > 0.0) {
            color = mix(midColor, topColor, smoothstep(0.0, 0.7, h));
          } else {
            color = mix(midColor, botColor, smoothstep(0.0, -0.4, h));
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    this._sky = new THREE.Mesh(skyGeom, skyMat);
    scene.add(this._sky);
    this.objects.push(this._sky);

    // === FOG (warm gold haze) ===
    scene.fog = new THREE.Fog(0xe8a87c, 30, 180);
    this._fog = scene.fog;

    // === LIGHTING ===
    const ambient = new THREE.AmbientLight(0xfff0d6, 0.45);
    scene.add(ambient);
    this.objects.push(ambient);

    const hemi = new THREE.HemisphereLight(0xffe0b3, 0xc8794a, 0.6);
    scene.add(hemi);
    this.objects.push(hemi);

    this._sun = new THREE.DirectionalLight(0xffd6a8, 1.2);
    this._sun.position.set(-30, 40, 20);
    scene.add(this._sun);
    this.objects.push(this._sun);

    // === GROUND PLANE (sand color, low-poly displaced) ===
    const groundGeom = new THREE.PlaneGeometry(400, 400, 60, 60);
    // Apply low-frequency noise displacement
    const pos = groundGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);  // (Y in plane local before rotation)
      const r = Math.hypot(x, y);
      // Avoid messing with center where player spawns
      if (r > 4) {
        const h = (Math.sin(x * 0.05) * 1.4 + Math.cos(y * 0.06) * 1.6 + Math.sin((x + y) * 0.03) * 1.2);
        pos.setZ(i, h);
      }
    }
    groundGeom.computeVertexNormals();
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      flatShading: true,
      roughness: 0.95,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);
    this.objects.push(ground);

    // === DISTANT DUNES (silhouettes) ===
    this._buildSilhouettes(scene);

    // === SCATTERED LOW-POLY DETAILS (cacti, rocks, ruins) ===
    this._buildScatter(scene);
  }

  _buildSilhouettes(scene) {
    // Big distant hills as low-poly silhouettes (darker color, in fog distance)
    const hillsGroup = new THREE.Group();
    const ringRadius = 130;
    const numHills = 18;
    for (let i = 0; i < numHills; i++) {
      const a = (i / numHills) * Math.PI * 2;
      const r = ringRadius + (Math.random() - 0.5) * 30;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const w = 25 + Math.random() * 35;
      const h = 8 + Math.random() * 16;
      // Very simple: cone with low segments
      const geom = new THREE.ConeGeometry(w * 0.6, h, 6);
      const colorTone = 0x8b5a4a;
      const mat = new THREE.MeshStandardMaterial({
        color: colorTone, flatShading: true, roughness: 1, metalness: 0,
      });
      const m = new THREE.Mesh(geom, mat);
      m.position.set(x, h / 2 - 0.5, z);
      m.rotation.y = Math.random() * Math.PI;
      hillsGroup.add(m);
    }
    scene.add(hillsGroup);
    this.objects.push(hillsGroup);
  }

  _buildScatter(scene) {
    // Cacti, rocks, ruins — low-poly
    const scatterGroup = new THREE.Group();

    // Cacti — vertical cylinders with arms
    const cactusMat = new THREE.MeshStandardMaterial({
      color: 0x5a7a4a, flatShading: true, roughness: 1, metalness: 0,
    });
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 25 + Math.random() * 60;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const cactus = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 3.2, 6), cactusMat);
      trunk.position.y = 1.6;
      cactus.add(trunk);
      // Arms
      const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 1.4, 6), cactusMat);
      arm1.position.set(0.7, 2.0, 0); arm1.rotation.z = Math.PI / 2.2;
      cactus.add(arm1);
      const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 1.2, 6), cactusMat);
      arm2.position.set(-0.65, 2.4, 0); arm2.rotation.z = -Math.PI / 2.2;
      cactus.add(arm2);
      cactus.position.set(x, 0, z);
      cactus.rotation.y = Math.random() * Math.PI * 2;
      scatterGroup.add(cactus);
    }

    // Rocks — random rotated octahedrons
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0xa07555, flatShading: true, roughness: 0.95, metalness: 0,
    });
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 80;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const s = 0.6 + Math.random() * 1.6;
      const rock = new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), rockMat);
      rock.position.set(x, s * 0.55, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scatterGroup.add(rock);
    }

    // Ruined columns — broken pillars
    const ruinMat = new THREE.MeshStandardMaterial({
      color: 0xe8c8a8, flatShading: true, roughness: 0.9, metalness: 0.05,
    });
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 14 + Math.random() * 50;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const h = 1.8 + Math.random() * 2.2;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, h, 8), ruinMat);
      pillar.position.set(x, h / 2, z);
      pillar.rotation.z = (Math.random() - 0.5) * 0.18;
      scatterGroup.add(pillar);
    }

    scene.add(scatterGroup);
    this.objects.push(scatterGroup);
  }

  update(dt, gameState) {
    // Slow sky time progression — full cycle = 6 minutes
    this.skyTime = (this.skyTime + dt / 360) % 1;
    if (this._sky) {
      const u = this._sky.material.uniforms;
      // Sky color cycle: dawn (warm) → day (cooler) → dusk (warm again) → night (deep purple)
      const t = this.skyTime;
      let topColor, midColor, botColor;
      if (t < 0.25) {
        // Dawn → day
        const k = t / 0.25;
        topColor = lerpColor(0x6b4488, 0x6a8cb8, k);
        midColor = lerpColor(0xe08a76, 0xc7d8e8, k);
        botColor = lerpColor(0xf4c89a, 0xe8d6b8, k);
      } else if (t < 0.5) {
        // Day → dusk
        const k = (t - 0.25) / 0.25;
        topColor = lerpColor(0x6a8cb8, 0x9b5a85, k);
        midColor = lerpColor(0xc7d8e8, 0xe88a76, k);
        botColor = lerpColor(0xe8d6b8, 0xf4c89a, k);
      } else if (t < 0.75) {
        // Dusk → night
        const k = (t - 0.5) / 0.25;
        topColor = lerpColor(0x9b5a85, 0x251a3e, k);
        midColor = lerpColor(0xe88a76, 0x4a3266, k);
        botColor = lerpColor(0xf4c89a, 0x6e4a73, k);
      } else {
        // Night → dawn
        const k = (t - 0.75) / 0.25;
        topColor = lerpColor(0x251a3e, 0x6b4488, k);
        midColor = lerpColor(0x4a3266, 0xe08a76, k);
        botColor = lerpColor(0x6e4a73, 0xf4c89a, k);
      }
      u.topColor.value.copy(topColor);
      u.midColor.value.copy(midColor);
      u.botColor.value.copy(botColor);

      // Fog matches mid color
      gameState?.scene && (gameState.scene.fog.color.copy(midColor));
      // Sun light intensity by time
      if (this._sun) {
        const sunIntensity = Math.max(0.15, Math.cos((this.skyTime - 0.5) * Math.PI * 2) * 0.7 + 0.5);
        this._sun.intensity = sunIntensity * 1.2;
        // Move sun position
        const sunAngle = this.skyTime * Math.PI * 2;
        this._sun.position.set(Math.cos(sunAngle) * 50, Math.abs(Math.sin(sunAngle)) * 60 + 10, 20);
      }
    }
  }

  dispose(scene) {
    for (const o of this.objects) scene.remove(o);
    this.objects = [];
    this._sky = null; this._sun = null;
    scene.fog = null;
    scene.background = null;
  }
}

function lerpColor(a, b, t) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, t);
}
