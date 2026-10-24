// JETJump — caballo y jinete.
// Regla de oro: el caballo solo usa sus animaciones originales (Henry S, CC BY 4.0). Nada de poses
// inventadas por código. El juego decide dónde está el cuerpo y en qué momento del salto va; la
// animación pone el resto. Así no se deforma.
import * as THREE from 'three';
import { LegIK } from './legik.js';
import { prepareBreeds, setBreedShape, buildMarkAttribute } from './breed.js';

// Datos medidos en Blender (_tools/jetjump-pro/clips_henry.py), a 24 cuadros por segundo.
const FPS = 24;
const JUMP_TAKEOFF = 12 / FPS;      // cuadro 13 del clip «jump»: los posteriores dejan el suelo
const JUMP_OVER = 24.5 / FPS;       // cuadro ~25: manos recogidas, momento de pasar sobre la valla
const JUMP_END = 56 / FPS;          // cuadro 57: manos estiradas buscando la arena
const LAND_WIN = 0.15;              // últimos segundos del vuelo: «jump_run» hasta el contacto
const LAND_FRONT = 5.5 / FPS;       // cuadro ~6 de «jump_run»: las manos tocan la arena
const LAND_FADE = 0.3;              // últimos segundos de «jump_run»: fundido al galope ya en fase
const GALLOP_STRIDE = 3.7;          // metros por ciclo del clip de galope a velocidad 1
const WALK_STRIDE = 1.0;            // m/s del clip de paso a velocidad 1 (medido en el apoyo de las traseras)

const _v = new THREE.Vector3(), _m = new THREE.Matrix4();
const IDLES = ['idle', 'idle2', 'idle3', 'eat'];      // reposos del autor (y pastar): se funden entre sí

export class Horse {
  constructor(horseGltf, riderGltf, extraClips = []) {
    this.root = new THREE.Group();               // posición y rumbo del juego
    this.body = new THREE.Group();               // compensación vertical del salto
    this.root.add(this.body);
    const model = horseGltf.scene;
    this.model = model;
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        const m = o.material;
        if (/^Braid/.test(m.name)) { o.material = physical(m, { color: new THREE.Color(0.05, 0.035, 0.025), roughness: 0.5, sheen: 0.6, sheenRoughness: 0.4, sheenColor: new THREE.Color(0.45, 0.32, 0.22) }); }
        else if (/^Iron/.test(m.name)) { o.material = physical(m, { color: new THREE.Color(0.82, 0.83, 0.85), metalness: 1.0, roughness: 0.3, envMapIntensity: 1.2 }); }
        else if (/HairStrand/.test(m.name)) { o.material = physical(m, { color: new THREE.Color(0.07, 0.05, 0.038), roughness: 0.42, sheen: 0.8, sheenRoughness: 0.3, sheenColor: new THREE.Color(0.5, 0.35, 0.22), side: THREE.DoubleSide }); }
        else if (/Hair/.test(m.name)) { m.transparent = false; m.alphaTest = 0.45; m.alphaToCoverage = true; m.side = THREE.DoubleSide; m.depthWrite = true; m.color.setRGB(0.09, 0.07, 0.06); m.roughness = 0.6; }
        if (/Horse/.test(m.name) && o.isSkinnedMesh) { bayCoat(o, this.coatU = this.coatU || coatUniforms()); this.coatMesh = o; }
        if (/Saddle/.test(m.name)) o.material = physical(m, { roughness: 0.58, clearcoat: 0.12, clearcoatRoughness: 0.5 });   // cuero engrasado, no barnizado
        if (/Cornea/.test(m.name)) { m.roughness = 0.05; m.color.set(0x111111); }
      }
    });
    // con mechones modelados, la tarjeta plana de crin y cola se apaga: solo aporta una cuña oscura
    let strands = null, cards = null;
    model.traverse((o) => { if (o.isMesh && /Strands/.test(o.name)) strands = o; if (o.isMesh && /Stallion_Hair/.test(o.name)) cards = o; });
    if (strands && cards) cards.visible = false;
    this.tackMeshes = { saddle: [], bridle: [] }; this.maneMats = [];
    model.traverse((o) => {
      if (!o.isMesh) return;
      if (/Saddle1/.test(o.name)) this.tackMeshes.saddle.push(o);
      if (/Bridle/.test(o.name)) this.tackMeshes.bridle.push(o);
      if (/HairStrand|Braid|^Hair/.test(o.material.name)) this.maneMats.push(o.material);
    });
    this.body.add(model);
    this.bones = {};
    model.traverse((o) => { if (o.isBone) this.bones[o.name] = o; });
    this.spine = this.bones.BN_Spine_01_03;
    this.toes = ['BN_L_Toe_042', 'BN_R_Toe_047', 'BN_L_Toe_2_055', 'BN_R_Toe_2_059'].map((n) => this.bones[n]);
    const B = this.bones;
    this.ik = new LegIK([
      { name: 'manoIzq', rest: 0.10, toe: B.BN_L_Toe_042, chain: [B.BN_L_Hand_041, B.BN_l_Forearm_040, B.BN_L_UpperArm_039] },
      { name: 'manoDer', rest: 0.10, toe: B.BN_R_Toe_047, chain: [B.BN_R_Hand_046, B.BN_R_Forearm_045, B.BN_R_UpperArm_044] },
      { name: 'pieIzq', rest: 0.09, toe: B.BN_L_Toe_2_055, chain: [B.BN_L_Foot_054, B.BN_L_HorseLink_053, B.BN_L_Calf_052, B.BN_L_Thing_051] },
      { name: 'pieDer', rest: 0.085, toe: B.BN_R_Toe_2_059, chain: [B.BN_R_Foot_00, B.BN_R_HorseLink_058, B.BN_R_Calf_057, B.BN_R_Thing_056] },
    ], { onContact: (L, pos, impact) => this.contact(L, pos, impact) });
    this.onContact = null;   // el juego conecta aquí huella, polvo y sonido

    // orientar por el eje de la columna (pelvis → cuello), no por la cabeza: en la pose de reposo la
    // cabeza está girada. Se redondea al múltiplo de 90° más cercano: el modelo es simétrico.
    model.updateMatrixWorld(true);
    const pel = this.bones.BN_Pelvis_060.getWorldPosition(new THREE.Vector3());
    const neck = this.bones.BN_Neck_00_06.getWorldPosition(new THREE.Vector3());
    const yaw = Math.round(Math.atan2(neck.x - pel.x, neck.z - pel.z) / (Math.PI / 2)) * (Math.PI / 2);
    model.rotation.y = -yaw;
    model.updateMatrixWorld(true);

    // animaciones
    this.mixer = new THREE.AnimationMixer(model);
    this.clips = {};
    for (const c of horseGltf.animations) this.clips[c.name] = c;
    // clips originales que vienen aparte (henry-clips1.glb: pastar y un tercer reposo), mismos huesos
    for (const c of extraClips) if (!this.clips[c.name]) this.clips[c.name] = c;
    // Los clips cíclicos vienen con la primera clave en 1/24 s (cuadro 1 de Blender): en cada vuelta el caballo
    // se quedaba quieto 1/24 s y después saltaba de pose. Se corren al cero y, si el ciclo no repite al final su
    // primera pose, se agrega esa clave para que el último cuadro empalme suave con el primero.
    for (const n of ['idle', 'idle2', 'idle3', 'eat', 'walk', 'walk_l', 'walk_r', 'gallop', 'gallop_l', 'gallop_r']) seamlessLoop(this.clips[n], 1 / FPS);
    this.act = {};
    for (const n of ['idle', 'idle2', 'idle3', 'eat', 'walk', 'walk_l', 'walk_r', 'gallop', 'gallop_l', 'gallop_r', 'jump', 'jump_run', 'run_stop', 'jump_land']) {
      if (!this.clips[n]) continue;
      const a = this.mixer.clipAction(this.clips[n]);
      a.enabled = true; a.setEffectiveWeight(0); a.play();
      if (['jump', 'jump_run', 'run_stop', 'jump_land'].includes(n)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.stop(); }
      this.act[n] = a;
    }
    this.act.idle.setEffectiveWeight(1);
    this.loco = { idle: 1, walk: 0, gallop: 0 };
    this.mode = 'loco';            // loco | jump | land | stop
    this.modeT = 0;
    this.special = null;
    this.blendSpecial = 0;
    this.lean = 0;

    // altura de referencia del lomo en el cuadro de batida y en el de recepción (para la compensación)
    this.spineAt = (clip, t) => {
      const a = this.act[clip];
      const was = { w: a.getEffectiveWeight(), t: a.time, en: a.enabled, run: a.isRunning() };
      this.mixer.stopAllAction();
      a.reset(); a.play(); a.setEffectiveWeight(1); a.time = t; a.paused = true;
      this.mixer.update(0); model.updateMatrixWorld(true);
      const y = this.bodySpineY();
      a.paused = false;
      return y;
    };
    this.refTakeoff = this.spineAt('jump', JUMP_TAKEOFF);
    this.refLand = this.spineAt('jump_run', LAND_FRONT);
    this.refGallop = this.spineAt('gallop', 0);
    // volver al estado inicial
    this.mixer.stopAllAction();
    for (const n of ['idle', 'walk', 'walk_l', 'walk_r', 'gallop', 'gallop_l', 'gallop_r', 'idle3', 'eat']) { const a = this.act[n]; if (!a) continue; a.reset(); a.play(); a.setEffectiveWeight(n === 'idle' ? 1 : 0); }

    prepareBreeds(model);
    this.buildJumpTable(0.84);
    this.matchLandGallop();
    if (this.act.idle2) { const a = this.act.idle2; a.reset(); a.play(); a.setEffectiveWeight(0); }
    // jinete
    this.rider = null;
    if (riderGltf) (riderGltf.animations.length ? this.attachRiderRig(riderGltf) : this.attachRider(riderGltf.scene));
    this.flight = 0;
  }

  // altura del hueso del lomo en el espacio del cuerpo (sin la compensación)
  bodySpineY() {
    this.spine.getWorldPosition(_v);
    this.body.worldToLocal(_v);
    return _v.y + this.body.position.y * 0;   // en espacio local de body
  }

  attachRider(scene) {
    const rider = scene;
    rider.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        const m = o.material; m.roughness = /Boots|Helmet/.test(m.name) ? 0.35 : 0.75;
        if (/Jacket/.test(m.name)) m.color.setRGB(0.02, 0.04, 0.16);
        if (/Skin/.test(m.name)) m.roughness = 0.6;
        this.riderMesh = this.riderMesh || (o.morphTargetInfluences ? o : null);
      }
    });
    // el jinete viaja sobre el hueso del lomo, en la montura
    this.seat = new THREE.Group();
    this.spine.add(this.seat);
    this.riderLean = new THREE.Group();        // inclinación del torso según el aire (erguido al paso)
    this.seat.add(this.riderLean);
    this.riderLean.add(rider);
    this.rider = rider;
    this.placeRider();
    this.buildReins();
  }

  // Jinete armado en Blender sobre este mismo caballo (_tools/jetjump-pro/build_rider.py): comparte el
  // espacio del modelo y tiene un clip por cada clip del caballo, con el mismo nombre y duración.
  attachRiderRig(gltf) {
    const sc = gltf.scene;
    sc.rotation.y = this.model.rotation.y;
    // telas y cueros con su brillo real
    const LOOK = {
      Jacket: { roughness: 0.82, sheen: 0.9, sheenRoughness: 0.55, sheenColor: new THREE.Color(0.25, 0.32, 0.55) },
      Breeches: { roughness: 0.6, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color(1, 1, 1) },
      Boots: { roughness: 0.42, clearcoat: 0.14, clearcoatRoughness: 0.45 },   // cuero liso, no charol
      Gloves: { roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color(0.3, 0.3, 0.3) },
      Helmet: { roughness: 0.6, sheen: 1.0, sheenRoughness: 0.35, sheenColor: new THREE.Color(0.25, 0.28, 0.4) },
      Peak: { roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 },
      Shirt: { roughness: 0.5, sheen: 0.5, sheenColor: new THREE.Color(1, 1, 1) },
      Skin: { roughness: 0.58, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new THREE.Color(0.9, 0.55, 0.45) },
      Sole: { roughness: 0.65 },
      Collar: { roughness: 0.82, sheen: 0.9, sheenRoughness: 0.55, sheenColor: new THREE.Color(0.25, 0.32, 0.55) },
    };
    LOOK.Gold = { roughness: 0.25, metalness: 1.0 };
    const weave = fabricNormal();
    sc.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      const n = o.material.name;
      if (LOOK[n]) o.material = physical(o.material, LOOK[n]);
      // cejas: la textura del modelo base no trae color (se veían blancas al quedar la cara a la vista)
      if (o.name === 'Eyebrows') o.material = physical(o.material, { map: null, color: new THREE.Color(0.045, 0.03, 0.02), roughness: 0.85, transparent: false });
      // tela: trama de sarga en lugar del relieve muscular del modelo base
      if (/Jacket|Breeches/.test(n)) { o.material.normalMap = weave; o.material.normalScale = new THREE.Vector2(0.3, 0.3); }
    });
    this.body.add(sc);
    this.riderRig = sc;
    this.rmixer = new THREE.AnimationMixer(sc);
    this.ract = {};
    for (const c of gltf.animations) { if (['idle', 'walk', 'gallop', 'gallop_l', 'gallop_r'].includes(c.name)) seamlessLoop(c, 1 / FPS); const a = this.rmixer.clipAction(c); a.play(); a.setEffectiveWeight(0); this.ract[c.name] = a; }
    const bones = {}; sc.traverse((o) => { if (o.isBone) bones[o.name] = o; });
    this.rhands = [bones.hand_l, bones.hand_r];
    this.rhead = bones.Head;
    // estribos: en cada cuadro la base del estribo de metal se apoya exactamente bajo la planta del pie
    this.stirrups = ['BN_L_Stirrup_048', 'BN_R_Stirrup_049'].map((n) => this.bones[n]).filter(Boolean);
    this.stirBase = this.stirrups.map((b) => b.position.clone());
    this.rfeet = [bones.ball_l, bones.ball_r];
    let sad = null; this.model.traverse((o) => { if (o.isSkinnedMesh && /Saddle1/.test(o.name)) sad = o; });
    this.saddleMesh = sad;
    this.irons = this.stirrups.map((b) => {
      const bi = sad.skeleton.bones.indexOf(b), g = sad.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, P = g.attributes.position;
      let best = -1, low = 1e9; const v = new THREE.Vector3();
      for (let i = 0; i < P.count; i++) {
        let w = 0; for (let k = 0; k < 4; k++) if (si.getComponent(i, k) === bi) w += sw.getComponent(i, k);
        if (w < 0.5) continue; sad.getVertexPosition(i, v); sad.localToWorld(v);
        if (v.y < low) { low = v.y; best = i; }
      }
      return best;
    });
    this.buildReins();
  }
  // casco de salto modelado a medida (_tools/jetjump-pro/build_helmet.py): su geometría está en el espacio del
  // casquete viejo, así que va en el mismo nodo (hijo del hueso Head) con su misma transformación
  fitHelmet(gltf) {
    if (!this.riderRig || !gltf) return;
    let old = null; const hide = [];
    this.riderRig.traverse((o) => { if (o.name === 'Helmet') old = o; if (/^(Helmet|HelmetPeak|ChinStrap)$/.test(o.name)) hide.push(o); });
    if (!old) return;
    const g = new THREE.Group(); g.name = 'Casco';
    g.position.copy(old.position); g.quaternion.copy(old.quaternion); g.scale.copy(old.scale);
    const LOOK = {
      HelmetShell: { roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color(0.3, 0.36, 0.6) },
      HelmetTrim: { roughness: 0.7 }, HelmetLiner: { roughness: 0.95 },
      HelmetChrome: { metalness: 1.0, roughness: 0.18, envMapIntensity: 1.3 },
      HelmetVent: { roughness: 0.6 }, HelmetPeak2: { roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 },
      HelmetStrap: { roughness: 0.5, sheen: 0.3, sheenColor: new THREE.Color(0.3, 0.3, 0.3), side: THREE.DoubleSide },
    };
    const meshes = []; gltf.scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const m of meshes) {
      m.updateMatrix(); m.geometry.applyMatrix4(m.matrix); m.position.set(0, 0, 0); m.quaternion.identity(); m.scale.set(1, 1, 1);
      const L = LOOK[m.material.name]; if (L) m.material = physical(m.material, L);
      m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
      g.add(m);
    }
    old.parent.add(g);
    for (const o of hide) o.visible = false;
    this.helmet = g;
  }
  // ---------------------------------------------------------------- carrera: pelaje, cuidado y equipo
  // pelaje: colores del cuerpo, cabos y crin; overo (manchas blancas) y tordillo (moteado) por ruido en el
  // espacio del modelo en reposo (las manchas no se mueven al animar)
  setCoat(C, marks) {
    const U = this.coatU; if (!U || !C) return;
    applyCoat(U, C, marks);
    for (const m of this.maneMats) m.color.setRGB(...C.mane);
  }
  // forma de la raza ({ heavy, fine }, ver breed.js): cuerpo, montura, crin y cascos juntos
  setBreed(shape) { setBreedShape(this.model, shape || {}); }
  // barro (R), sudor (G) y mojado (B) en una textura 3D sobre el espacio en reposo del caballo
  initCare() {
    if (this.care) return this.care;
    const g = this.coatMesh.geometry; g.computeBoundingBox();
    const b = g.boundingBox, size = b.getSize(new THREE.Vector3()), mx = Math.max(size.x, size.y, size.z);
    const res = [size.x, size.y, size.z].map((s) => Math.max(16, Math.min(64, Math.round(s / mx * 64))));
    const data = new Uint8Array(res[0] * res[1] * res[2] * 4);
    const tex = new THREE.Data3DTexture(data, res[0], res[1], res[2]);
    tex.format = THREE.RGBAFormat; tex.type = THREE.UnsignedByteType; tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.unpackAlignment = 1; tex.needsUpdate = true;
    this.coatU.uCare.value = tex; this.coatU.uCareMin.value.copy(b.min); this.coatU.uCareSize.value.copy(size);
    this.care = { tex, data, res, min: b.min.clone(), size, dirty: 0 };
    return this.care;
  }
  // carga el estado de cuidado del perfil: barro (más en patas y panza), sudor (cuello, zona de la montura)
  // stamp: si es el mismo (mismo caballo y mismo día, sin esfuerzo nuevo) se conserva lo ya limpiado
  setCare({ dirt = 0, sweat = 0, wet = 0 } = {}, stamp = null) {
    const C = this.initCare(), [X, Y, Z] = C.res, d = C.data;
    if (stamp && C.stamp === stamp) return;
    C.stamp = stamp;
    // ejes del modelo en reposo: Y arriba; el lateral es el horizontal más corto; adelante, donde está la cabeza
    if (!C.axes) {
      const P = this.coatMesh.geometry.attributes.position; let top = -1e9, hx = 0, hz = 0;
      for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y > top) { top = y; hx = P.getX(i); hz = P.getZ(i); } }
      const latX = C.size.x < C.size.z;
      const fu = latX ? (hz - C.min.z) / C.size.z : (hx - C.min.x) / C.size.x;
      C.axes = { latX, front: fu > 0.5 ? 1 : -1 };
    }
    const A = C.axes;
    let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const blobs = Array.from({ length: 34 }, () => [rnd(), 0.1 + rnd() * 0.65, rnd(), 0.07 + rnd() * 0.12]);
    for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
      const u = x / (X - 1), v = y / (Y - 1), w = z / (Z - 1), i = ((z * Y + y) * X + x) * 4;
      let m = Math.max(0, 1.15 - v * 1.6);                    // más barro abajo
      for (const [bx, by, bz, br] of blobs) { const q = Math.hypot(u - bx, (v - by) * 1.4, w - bz); if (q < br) m += (1 - q / br) * 0.9; }
      d[i] = Math.min(255, m * dirt * 255);
      let lng = A.latX ? w : u, lat = A.latX ? u : w; if (A.front < 0) lng = 1 - lng;   // lng: 0 cola → 1 cabeza
      const bump = (x, c, r) => Math.max(0, 1 - Math.abs(x - c) / r);
      const sw = 1.8 * (bump(lng, 0.74, 0.16) * bump(v, 0.68, 0.2)                 // cuello
        + bump(lng, 0.5, 0.18) * bump(v, 0.62, 0.16)                             // debajo de la montura
        + bump(lng, 0.3, 0.12) * bump(lat, 0.5, 0.2) * bump(v, 0.42, 0.15) * 1.3);   // entre las patas traseras
      d[i + 1] = Math.min(255, sw * sweat * 255);
      d[i + 2] = Math.min(255, wet * 255);
      d[i + 3] = 255;
    }
    C.tex.needsUpdate = true;
    this.coatU.uCareOn.value = dirt > 0.01 || sweat > 0.01 || wet > 0.01 ? 1 : 0;
  }
  // limpieza o mojado puntual: punto del mundo → espacio en reposo (por la cara tocada) → esfera en la textura.
  // chs: canales (0 barro, 1 sudor, 2 mojado); amount < 0 quita, > 0 agrega. Devuelve cuánto cambió.
  paintCare(hit, radius, amount, chs = [0]) {
    const C = this.initCare(), mesh = this.coatMesh, P = mesh.geometry.attributes.position, f = hit.face;
    if (!f) return 0;
    const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
    mesh.getVertexPosition(f.a, va); mesh.getVertexPosition(f.b, vb); mesh.getVertexPosition(f.c, vc);
    va.applyMatrix4(mesh.matrixWorld); vb.applyMatrix4(mesh.matrixWorld); vc.applyMatrix4(mesh.matrixWorld);
    const bc = new THREE.Vector3(); THREE.Triangle.getBarycoord(hit.point, va, vb, vc, bc);
    const bind = new THREE.Vector3().fromBufferAttribute(P, f.a).multiplyScalar(bc.x)
      .add(new THREE.Vector3().fromBufferAttribute(P, f.b).multiplyScalar(bc.y)).add(new THREE.Vector3().fromBufferAttribute(P, f.c).multiplyScalar(bc.z));
    const [X, Y, Z] = C.res, d = C.data;
    const cx = (bind.x - C.min.x) / C.size.x * (X - 1), cy = (bind.y - C.min.y) / C.size.y * (Y - 1), cz = (bind.z - C.min.z) / C.size.z * (Z - 1);
    // radio en metros del mundo → vóxeles (la escala del modelo se mide una vez)
    if (!C.wpu) { const ws = new THREE.Vector3(); mesh.getWorldScale(ws); C.wpu = ws.x; }
    const rv = [radius / C.wpu / C.size.x * (X - 1), radius / C.wpu / C.size.y * (Y - 1), radius / C.wpu / C.size.z * (Z - 1)];
    let changed = 0;
    for (let z = Math.max(0, Math.floor(cz - rv[2])); z <= Math.min(Z - 1, Math.ceil(cz + rv[2])); z++)
      for (let y = Math.max(0, Math.floor(cy - rv[1])); y <= Math.min(Y - 1, Math.ceil(cy + rv[1])); y++)
        for (let x = Math.max(0, Math.floor(cx - rv[0])); x <= Math.min(X - 1, Math.ceil(cx + rv[0])); x++) {
          const q = Math.hypot((x - cx) / rv[0], (y - cy) / rv[1], (z - cz) / rv[2]); if (q > 1) continue;
          const k = 1 - q * q, i = ((z * Y + y) * X + x) * 4;
          for (const ch of chs) { const o = d[i + ch], n = Math.max(0, Math.min(255, o + amount * 255 * k)); d[i + ch] = n; changed += Math.abs(n - o); }
        }
    if (changed) { C.dirty = 1; if (amount > 0) this.coatU.uCareOn.value = 1; }
    return changed / 255;
  }
  // cuánto queda de un canal (0–1), muestreado
  careLevel(ch = 0) {
    const C = this.initCare(), d = C.data; let s = 0, n = 0;
    for (let i = ch; i < d.length; i += 4 * 7) { s += d[i]; n++; }
    return s / n / 255;
  }
  flushCare() { if (this.care && this.care.dirty) { this.care.tex.needsUpdate = true; this.care.dirty = 0; } }
  // secado: el mojado baja solo con el tiempo
  dryCare(dt, rate = 0.02) {
    const C = this.care; if (!C) return;
    C.dryAcc = (C.dryAcc || 0) + rate * dt * 255; const k = Math.floor(C.dryAcc); if (k < 1) return; C.dryAcc -= k;
    const d = C.data; let any = false;
    for (let i = 2; i < d.length; i += 4) if (d[i]) { d[i] = Math.max(0, d[i] - k); any = true; }
    if (any) C.dirty = 1;
  }
  // montura y cabezada (ensillar en el box); el cuero puede teñirse
  setTack({ saddle = true, bridle = true, leather } = {}) {
    for (const m of this.tackMeshes.saddle) m.visible = saddle;
    for (const m of this.tackMeshes.bridle) m.visible = bridle;
    if (leather) for (const m of [...this.tackMeshes.saddle, ...this.tackMeshes.bridle]) { const mt = Array.isArray(m.material) ? m.material : [m.material]; for (const x of mt) if (/Saddle/.test(x.name)) x.color.setRGB(...leather); }
  }
  // el jinete y las riendas solo van montados
  showRider(on) {
    if (this.riderRig) this.riderRig.visible = on;
    if (this.reinGroup) this.reinGroup.visible = on;
  }
  // cambiar de escena (pista, rancho, box): el caballo y sus riendas van juntos
  moveTo(scene) {
    scene.add(this.root);
    if (this.reinGroup) scene.add(this.reinGroup);
  }
  headWorld() { const v = new THREE.Vector3(); (this.rhead || this.bones.BN_Head_00_016).getWorldPosition(v); return v; }
  syncRider() {
    if (!this.rmixer) return;
    for (const n in this.ract) {
      const h = this.act[n] || (n === 'jump_land' ? null : null), r = this.ract[n];
      if (!h) { r.setEffectiveWeight(0); continue; }
      r.time = h.time; r.setEffectiveWeight(h.getEffectiveWeight());
    }
    this.rmixer.update(0);
  }
  lengthenStirrups() {
    // se mueve el hueso del estribo lo justo para que su base quede 2 cm bajo la planta del pie
    if (!this.rfeet || !this.saddleMesh) return;
    this.riderRig.updateMatrixWorld(true);
    const iron = new THREE.Vector3(), ball = new THREE.Vector3(), bw = new THREE.Vector3();
    for (let i = 0; i < this.stirrups.length; i++) {
      const b = this.stirrups[i]; if (this.irons[i] < 0) continue;
      this.saddleMesh.getVertexPosition(this.irons[i], iron); this.saddleMesh.localToWorld(iron);
      this.rfeet[i].getWorldPosition(ball); ball.y -= 0.02;
      const d = ball.sub(iron); if (d.length() > 0.45) continue;
      b.getWorldPosition(bw); bw.add(d); b.parent.worldToLocal(bw); b.position.copy(bw);
      b.updateMatrixWorld(true);
    }
  }

  // riendas: de las manos del jinete (medidas en su malla, con y sin la forma de vuelo) al bocado
  buildReins() {
    const mesh = this.riderMesh;
    if (!mesh && !this.rhands) return;
    if (mesh) {
    const g = mesh.geometry, P = g.attributes.position, D = g.morphAttributes.position?.[0];
    const hand = (side, withD) => {
      let best = [], v = new THREE.Vector3();
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i); if (withD && D) v.add(new THREE.Vector3().fromBufferAttribute(D, i));
        if (Math.sign(v.z) !== side) continue;
        best.push(v.clone()); if (best.length > 40) { best.sort((a, b) => b.x - a.x); best.length = 20; }
      }
      best.sort((a, b) => b.x - a.x); best.length = Math.min(best.length, 20);
      return best.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / best.length);
    };
    this.hands = [-1, 1].map((s) => ({ base: hand(s, false), flight: hand(s, true) }));
    }
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.5 });
    const geo = new THREE.BoxGeometry(0.016, 0.003, 1); geo.translate(0, 0, 0.5);
    // cada rienda: dos tramos con una leve caída en el medio
    this.reins = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; return m; });
    this.reinGroup = new THREE.Group(); this.reins.forEach((r) => this.reinGroup.add(r));
    this.bit = this.bones.BN_BT_Lip_028 || this.bones.BN_Head_00_016;
  }
  updateReins() {
    if (!this.reins) return;
    if (!this.reinGroup.parent && this.root.parent) this.root.parent.add(this.reinGroup);
    const mesh = this.riderMesh, a = new THREE.Vector3(), b = new THREE.Vector3(), m = new THREE.Vector3();
    this.bit.getWorldPosition(b);
    const lat = new THREE.Vector3(1, 0, 0).applyQuaternion(this.root.quaternion);
    for (let i = 0; i < 2; i++) {
      if (this.rhands) { this.rhands[i].getWorldPosition(a); }
      else { const H = this.hands[i]; a.copy(H.base).lerp(H.flight, this.flight); mesh.localToWorld(a); }
      const bb = b.clone().addScaledVector(lat, i ? 0.065 : -0.065);
      // holgura: la rienda mide lo que medía en reposo más 4 cm; sobra cuando la mano se acerca a la boca
      const dist = a.distanceTo(bb); if (!this.reinL) this.reinL = dist + 0.04;
      const slack = Math.max(0.01, this.reinL - dist);
      m.copy(a).lerp(bb, 0.5); m.y -= slack * 0.6 + 0.01;
      const seg = (r, p, q) => { r.position.copy(p); r.lookAt(q); r.scale.set(1, 1, p.distanceTo(q)); };
      seg(this.reins[i * 2], a, m); seg(this.reins[i * 2 + 1], m, bb);
    }
  }

  // ubica el asiento del jinete sobre la montura, medido en la pose de galope
  placeRider() {
    const r = this.rider;
    // orientación: el jinete mira hacia adelante del caballo (+Z del cuerpo) y está de pie (+Y del cuerpo)
    this.seat.position.set(0, 0, 0); this.seat.quaternion.identity();
    this.body.updateMatrixWorld(true);
    const inv = new THREE.Quaternion(); this.spine.getWorldQuaternion(inv).invert();
    const bodyQ = new THREE.Quaternion(); this.body.getWorldQuaternion(bodyQ);
    this.seat.quaternion.copy(inv.multiply(bodyQ));
    // el hueso viene en centímetros (escala 0,01): el asiento la anula para trabajar en metros
    const ws = new THREE.Vector3(); this.spine.getWorldScale(ws); const bs = new THREE.Vector3(); this.body.getWorldScale(bs);
    this.seat.scale.setScalar(bs.x / ws.x);
    // posición: encima del lomo, a la altura de la montura (ajuste fino en SEAT)
    this.seatOffset = new THREE.Vector3(...SEAT.offset);
    r.rotation.set(0, SEAT.yaw, 0);
    r.scale.setScalar(SEAT.scale);
    this.riderLean.position.copy(this.seatOffset);
    r.position.set(0, 0, 0);
  }

  // ---------------------------------------------------------------- actualización por cuadro
  // s: estado del juego { v, turn, jump: {phase:'approach'|'air'|'land', ...}, stop }
  update(dt, s) {
    const A = this.act;
    // locomoción: pesos por velocidad
    const v = Math.abs(s.v);
    let wIdle = 0, wWalk = 0, wGal = 0;
    // reposo alternativo (box y potrero): el caballo cambia de postura cada tanto, siempre con su clip original
    // idleClip elige uno (p. ej. 'eat' en el potrero); si no, idleAlt alterna entre los dos primeros
    const tgt = this.idleClip && A[this.idleClip] ? this.idleClip : this.idleAlt && A.idle2 ? 'idle2' : 'idle';
    const IW = this.idleW = this.idleW || { idle: 1 }, kI = 1 - Math.exp(-dt * 1.5);
    if (tgt !== this.idleTgt) { if (A[tgt] && (IW[tgt] || 0) < 0.05) A[tgt].time = 0; this.idleTgt = tgt; }   // el clip nuevo empieza desde su primer cuadro
    let iSum = 0; for (const n of IDLES) if (A[n]) { IW[n] = (IW[n] || 0) + ((n === tgt ? 1 : 0) - (IW[n] || 0)) * kI; iSum += IW[n]; }
    if (v < 0.25) wIdle = 1;
    else if (v < 2.2) { const k = smooth((v - 0.25) / 0.6); wIdle = 1 - k; wWalk = k; }
    else { const k = smooth((v - 2.2) / 1.6); wWalk = 1 - k; wGal = k; }
    // girando parado o casi parado: pasos de giro (el caballo cruza las manos y pivota sobre los posteriores)
    const turnIn = v < 0.9 ? clamp(Math.abs(s.turn || 0) * 1.6 - 0.15, 0, 1) * (1 - v / 0.9) : 0;
    if (turnIn > wWalk) { wIdle = Math.max(0, 1 - turnIn); wWalk = turnIn; wGal = 0; }
    const lerpW = 1 - Math.exp(-dt * 8);
    this.loco.idle += (wIdle - this.loco.idle) * lerpW;
    this.loco.walk += (wWalk - this.loco.walk) * lerpW;
    this.loco.gallop += (wGal - this.loco.gallop) * lerpW;
    A.walk.timeScale = turnIn > 0.05 ? Math.max(clamp(v / WALK_STRIDE, 0.5, 2.0), 0.7 + 0.5 * Math.abs(s.turn || 0)) : clamp(v / WALK_STRIDE, 0.5, 2.0) * Math.sign(s.v || 1);
    for (const n of ['walk_l', 'walk_r']) if (A[n]) A[n].timeScale = A.walk.timeScale;
    const gts = clamp(v / GALLOP_STRIDE, 0.85, 2.3) * (this.strideAdjust || 1);
    for (const n of ['gallop', 'gallop_l', 'gallop_r']) A[n].timeScale = gts;
    this.lean += (clamp(s.turn * 1.4, -1, 1) - this.lean) * (1 - Math.exp(-dt * 5));

    // salto: cada clip con su peso suavizado (sin saltos de pose)
    const J = s.jump;
    const want = { jump: 0, jump_run: 0, run_stop: 0 };
    if (J) {
      if (J.phase === 'approach') {
        if (this.mode !== 'jump') { this.mode = 'jump'; A.jump.reset(); A.jump.play(); A.jump.time = 0; }
        // velocidad del clip para que el cuadro de batida coincida con el despegue del juego
        A.jump.timeScale = clamp((JUMP_TAKEOFF - A.jump.time) / Math.max(0.04, J.toTakeoff), 0.5, 2.2);
        want.jump = 1;
      } else if (J.phase === 'air') {
        const P = airPose(J.t / J.airT, J.airT);
        A.jump.timeScale = 0; A.jump.time = P.jump;
        if (P.land != null) {
          if (this.mode !== 'land') { this.mode = 'land'; A.jump_run.reset(); A.jump_run.play(); this.landT = null; }
          A.jump_run.timeScale = 0; A.jump_run.time = P.land;
          want.jump_run = 1;
        } else want.jump = 1;
      } else if (J.phase === 'land') {
        if (this.mode !== 'land') { this.mode = 'land'; A.jump_run.reset(); A.jump_run.play(); A.jump_run.time = LAND_FRONT; this.landT = LAND_FRONT; }
        A.jump_run.timeScale = clamp(v / GALLOP_STRIDE, 0.85, 1.8);
        const end = this.clips.jump_run.duration;
        want.jump_run = 1 - smooth(clamp((A.jump_run.time - (end - LAND_FADE)) / LAND_FADE, 0, 1));
        // el galope entra en la fase que continúa la pose de salida de la recepción, a la misma velocidad
        // reloj propio (no se detiene cuando «jump_run» llega a su último cuadro: sin congelamiento)
        this.landT = (this.landT ?? A.jump_run.time) + dt * A.jump_run.timeScale;
        const dG = this.clips.gallop.duration, tg = ((this.landGallopT + (this.landT - this.landFadeStart)) % dG + dG) % dG;
        for (const n of ['gallop', 'gallop_l', 'gallop_r']) { A[n].time = tg; A[n].timeScale = A.jump_run.timeScale; }
      }
    } else if (s.stopping) {
      if (this.mode !== 'stop') { this.mode = 'stop'; A.run_stop.reset(); A.run_stop.play(); A.run_stop.timeScale = 1.15; }
      want.run_stop = 1 - smooth(clamp((A.run_stop.time - 1.55) / 0.4, 0, 1));
    } else if (this.mode !== 'loco') {
      // al terminar la recepción el galope ya viene en fase (ver matchLandGallop): no se reinicia
      if (this.mode !== 'land') for (const n of ['gallop', 'gallop_l', 'gallop_r']) A[n].time = 0;
      this.mode = 'loco';
    }
    this.w = this.w || { jump: 0, jump_run: 0, run_stop: 0 };
    const fast = 1 - Math.exp(-dt * 16);
    for (const n in want) {
      // dentro del salto los cambios son rápidos; al volver al galope, suaves
      const r = (J && want[n] > this.w[n]) ? fast : (1 - Math.exp(-dt * 9));
      this.w[n] += (want[n] - this.w[n]) * r;
      if (J && J.phase !== 'land' && want[n] === 1 && this.w[n] > 0.97) this.w[n] = 1;
    }
    if (J && J.phase === 'air') {
      const k = clamp(J.t / J.airT, 0, 1), kL = Math.max(0.55, 1 - LAND_WIN / J.airT);
      if (k > kL) { const u = smooth((k - kL) / (1 - kL)); this.w.jump_run = u; this.w.jump = 1 - u; }
    }
    if (J && J.phase === 'land' && this.mode === 'land' && A.jump_run.time < LAND_FRONT + 0.25) { this.w.jump = 0; this.w.jump_run = 1; }   // el fundido ya terminó en el contacto
    const sp = Math.min(1, this.w.jump + this.w.jump_run + this.w.run_stop);
    const rest = 1 - sp;
    A.jump.setEffectiveWeight(this.w.jump);
    A.jump_run.setEffectiveWeight(this.w.jump_run);
    A.run_stop.setEffectiveWeight(this.w.run_stop);
    for (const n of IDLES) if (A[n]) A[n].setEffectiveWeight(this.loco.idle * rest * (IW[n] || 0) / Math.max(1e-4, iSum));
    // al paso, los giros usan los clips de paso girando del autor (cuello y cuerpo curvados hacia el giro)
    const l = this.lean, wk = this.loco.walk * rest, hasWT = A.walk_l && A.walk_r;
    A.walk.setEffectiveWeight(hasWT ? wk * (1 - Math.abs(l)) : wk);
    if (hasWT) { A.walk_l.setEffectiveWeight(wk * Math.max(0, -l)); A.walk_r.setEffectiveWeight(wk * Math.max(0, l)); }
    const g = this.loco.gallop * rest;
    A.gallop.setEffectiveWeight(g * (1 - Math.abs(l)));
    A.gallop_l.setEffectiveWeight(g * Math.max(0, -l));
    A.gallop_r.setEffectiveWeight(g * Math.max(0, l));

    // los clips no siempre fijan la posición del estribo: se repone antes de animar (si no, se acumula)
    if (this.stirBase) this.stirrups.forEach((b, i) => b.position.copy(this.stirBase[i]));
    this.mixer.update(dt);
    this.body.position.y = 0;
    this.model.updateMatrixWorld(true);
    if (this.rmixer) { this.syncRider(); this.lengthenStirrups(); }

    // compensación vertical: en el aire manda la parábola del juego, no la del clip
    let off = 0;
    if (J && J.phase === 'air') {
      const k = clamp(J.t / J.airT, 0, 1);
      const base = this.refTakeoff + (this.refLand - this.refTakeoff) * k;
      const target = base + J.apex * 4 * k * (1 - k);
      off = target - this.bodySpineY();
    }
    if (!J && this.mode === 'loco') {
      // suspensión del galope: si el casco más bajo queda bajo la arena, el cuerpo sube lo justo
      let minY = 9; for (const p of this.hooves(this._hv = this._hv || [])) minY = Math.min(minY, p.y - this.root.position.y);
      const lift = minY < 0.015 ? 0.015 - minY : 0;
      this.liftS = (this.liftS || 0) + (lift - (this.liftS || 0)) * (1 - Math.exp(-dt * 18));
      off = this.liftS;
    }
    this.body.position.y = off;
    this.body.updateMatrixWorld(true);
    // apoyos: en el aire no hay bloqueo; en la batida y la recepción, sí
    this.ik.update(dt, { allow: !(J && J.phase === 'air') });

    // jinete: postura de vuelo al saltar
    const fl = J ? (J.phase === 'air' ? 1 : J.phase === 'approach' ? clamp(1 - J.toTakeoff / 0.3, 0, 1) : clamp(1 - (A.jump_run.time - LAND_FRONT) / 0.45, 0, 1)) : 0;
    this.flight += (fl - this.flight) * (1 - Math.exp(-dt * 9));
    if (this.riderMesh) this.riderMesh.morphTargetInfluences[0] = this.flight;
    if (this.riderLean) {
      // al paso o parado el jinete se sienta erguido; al galope adelanta el torso (asiento de dos puntos)
      const up = 1 - smooth(clamp((v - 1.8) / 3.2, 0, 1));
      const target = -0.17 * up * (1 - this.flight);
      this.riderLean.rotation.x += (target - this.riderLean.rotation.x) * (1 - Math.exp(-dt * 4));
    }
    this.model.updateMatrixWorld(true);
    this.updateReins();
  }

  // Fase del galope que continúa el final de «jump_run»: compara la pose de los cuatro cascos (adelante y
  // altura respecto del lomo) al empezar el fundido de salida con 96 muestras del ciclo de galope.
  matchLandGallop() {
    const A = this.act, v = new THREE.Vector3(), sp = new THREE.Vector3();
    const pose = (name, time) => {
      this.mixer.stopAllAction(); const a = A[name];
      a.reset(); a.play(); a.setEffectiveWeight(1); a.time = time; a.paused = true;
      this.mixer.update(0); this.model.updateMatrixWorld(true);
      this.spine.getWorldPosition(sp); this.body.worldToLocal(sp);
      const r = this.toes.map((b) => { b.getWorldPosition(v); this.body.worldToLocal(v); return [v.z - sp.z, v.y - sp.y]; });
      a.paused = false; return r;
    };
    const dJ = this.clips.jump_run.duration, dG = this.clips.gallop.duration;
    this.landFadeStart = dJ - LAND_FADE;
    const ref = pose('jump_run', this.landFadeStart);
    let best = 0, bd = 1e9;
    for (let i = 0; i < 96; i++) {
      const tg = dG * i / 96, g = pose('gallop', tg);
      let d = 0; for (let h = 0; h < 4; h++) d += (g[h][0] - ref[h][0]) ** 2 + 2 * (g[h][1] - ref[h][1]) ** 2;
      if (d < bd) { bd = d; best = tg; }
    }
    this.landGallopT = best; this.landGallopErr = Math.sqrt(bd / 4);
    this.mixer.stopAllAction();
    for (const n of ['idle', 'walk', 'gallop', 'gallop_l', 'gallop_r']) { const a = A[n]; a.reset(); a.play(); a.setEffectiveWeight(n === 'idle' ? 1 : 0); }
  }

  // Mide la animación de vuelo: para cada fracción k, posición de los 4 cascos respecto del lomo
  // (adelante y altura, en metros del cuerpo). Con esto el juego calcula batida y altura reales.
  buildJumpTable(airT) {
    const A = this.act, rows = [], N = 48;
    const v = new THREE.Vector3(), sp = new THREE.Vector3();
    for (let i = 0; i <= N; i++) {
      const k = i / N, P = airPose(k, airT);
      this.mixer.stopAllAction();
      const use = P.land != null ? A.jump_run : A.jump;
      use.reset(); use.play(); use.setEffectiveWeight(1); use.time = P.land != null ? P.land : P.jump; use.paused = true;
      this.mixer.update(0); this.model.updateMatrixWorld(true);
      this.spine.getWorldPosition(sp); this.body.worldToLocal(sp);
      // f: adelante desde el centro del caballo (posición del juego); y: altura respecto del lomo
      const toes = this.toes.map((b) => { b.getWorldPosition(v); this.body.worldToLocal(v); return { f: v.z, y: v.y - sp.y }; });
      use.paused = false;
      rows.push({ k, toes });
    }
    this.mixer.stopAllAction();
    for (const n of ['idle', 'walk', 'gallop', 'gallop_l', 'gallop_r']) { const a = A[n]; a.reset(); a.play(); a.setEffectiveWeight(n === 'idle' ? 1 : 0); }
    this.jt = rows;
  }

  // Plan de salto: con largo de vuelo L y los planos de la valla [{a, top}] (a relativo al centro),
  // busca la distancia de batida (desde el primer plano) que pide menos altura, y la altura necesaria.
  planJump(L, planes, clear = 0.12) {
    const front = Math.min(...planes.map((p) => p.a));
    // misma franja de contacto que el detector de derribos (barra + casco)
    const BAND = 0.16;
    const need = (d) => {
      const at = front - d;                         // posición de la batida (a lo largo de la valla)
      let worst = -1e9;
      for (const P of planes) for (let h = 0; h < 4; h++) for (const r of this.jt) {
        const s = at + L * r.k + r.toes[h].f;
        if (Math.abs(s - P.a) > BAND) continue;
        const base = this.refTakeoff + (this.refLand - this.refTakeoff) * r.k, bump = 4 * r.k * (1 - r.k);
        const req = P.top + clear - base - r.toes[h].y;
        worst = Math.max(worst, req <= 0 ? -1 : bump < 0.04 ? 9 : req / bump);
      }
      return worst;
    };
    let best = { d: L / 2, apex: 9 };
    for (let d = 0.8; d <= L - 0.6; d += 0.1) { const n = need(d); if (n < best.apex) best = { d, apex: n }; }
    best.need = need;
    return best;
  }

  // fase del galope (0–1), duración de un tranco y de la recepción, para que el juego decida la batida
  gallopPhase() { const a = this.act.gallop; return (a.time % this.clips.gallop.duration) / this.clips.gallop.duration; }
  gallopCycle() { return this.clips.gallop.duration / Math.max(0.5, this.act.gallop.timeScale); }
  landDuration() { return (this.clips.jump_run.duration - LAND_FRONT) / Math.max(0.85, this.act.jump_run.timeScale || 1) - 0.1; }

  // evento de contacto único: casco, posición, orientación del casco en la arena e intensidad del impacto
  contact(L, pos, impact) {
    if (!this.onContact) return;
    const i = this.ik.legs.indexOf(L);
    // orientación del casco: eje de la caña proyectado en el piso (no el rumbo del cuerpo)
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    L.chain[0].getWorldPosition(a); L.toe.getWorldPosition(b);
    const fq = new THREE.Quaternion(); this.root.getWorldQuaternion(fq);
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(fq);       // adelante del caballo
    const dx = b.x - a.x, dz = b.z - a.z, lat = Math.hypot(dx, dz);
    let ang = Math.atan2(fwd.x, fwd.z);
    if (lat > 0.02) { const h = Math.atan2(dx, dz); const d = Math.atan2(Math.sin(h - ang), Math.cos(h - ang)); ang += Math.max(-0.5, Math.min(0.5, d)); }
    this.onContact({ hoof: i, front: i < 2, pos: pos.clone(), ang, impact, landing: this.mode === 'land' });
  }

  // altura del casco más bajo y posiciones de los cuatro cascos en el mundo
  hooves(out = []) {
    this.root.updateMatrixWorld(true);
    for (let i = 0; i < 4; i++) { out[i] = out[i] || new THREE.Vector3(); this.toes[i].getWorldPosition(out[i]); }
    return out;
  }
}

// asiento del jinete sobre el hueso del lomo (metros, en el espacio del cuerpo del caballo)
// medido de perfil: pierna a la cincha, pie en el estribo, asiento en el centro de la montura
export const SEAT = { offset: [0, 0.04, 0.22], yaw: -Math.PI / 2, scale: 1.0 };

// pose del vuelo para la fracción k del tiempo en el aire: primera mitad, batida → manos recogidas
// (pasa sobre la valla); segunda, descenso con las manos estiradas; al final, contacto con «jump_run».
function seamlessLoop(clip, dtFrame) {
  if (!clip || clip.userData?.seamless) return;
  let t0 = Infinity, tEnd = 0;
  for (const tr of clip.tracks) { t0 = Math.min(t0, tr.times[0]); tEnd = Math.max(tEnd, tr.times[tr.times.length - 1]); }
  if (!(t0 > 1e-4)) return;
  // ¿el último cuadro ya repite al primero? (ciclo cerrado) → basta con correr los tiempos
  let eq = 0, tot = 0;
  for (const tr of clip.tracks) {
    const k = tr.getValueSize(), N = tr.times.length; if (N < 3) continue; tot++;
    let same = true; for (let i = 0; i < k; i++) if (Math.abs(tr.values[(N - 1) * k + i] - tr.values[i]) > 1e-3) { same = false; break; }
    if (same) eq++;
  }
  const closed = tot > 0 && eq / tot > 0.8;
  const dur = closed ? tEnd - t0 : tEnd - t0 + dtFrame;
  for (const tr of clip.tracks) {
    const k = tr.getValueSize(), N = tr.times.length;
    const times = new Float32Array(N + (closed ? 0 : 1)), values = new tr.values.constructor((N + (closed ? 0 : 1)) * k);
    for (let i = 0; i < N; i++) times[i] = Math.max(0, tr.times[i] - t0);
    values.set(tr.values);
    if (!closed) { times[N] = dur; for (let i = 0; i < k; i++) values[N * k + i] = tr.values[i]; }
    else if (times[N - 1] < dur) times[N - 1] = dur;
    tr.times = times; tr.values = values;
  }
  clip.duration = dur; clip.userData = { ...(clip.userData || {}), seamless: true };
}

export function airPose(k, airT) {
  k = clamp(k, 0, 1);
  const kL = Math.max(0.55, 1 - LAND_WIN / airT);
  const jump = k < 0.5 ? lerp(JUMP_TAKEOFF, JUMP_OVER, k / 0.5) : lerp(JUMP_OVER, JUMP_END, clamp((k - 0.5) / (kL - 0.5), 0, 1));
  const land = k > kL ? LAND_FRONT * clamp((k - kL) / (1 - kL), 0, 1) : null;
  return { jump, land };
}
export function coatUniforms() {
  return {
    uBody: { value: new THREE.Color(0.235, 0.105, 0.045) }, uPoints: { value: new THREE.Color(0.07, 0.05, 0.04) },
    uPinto: { value: 0 }, uDapple: { value: 0 }, uRoan: { value: 0 }, uDorsal: { value: 0 }, uAppy: { value: 0 },
    uSocks: { value: new THREE.Vector4() }, uBlaze: { value: 0 }, uHoofPale: { value: 0 },
    uMC: { value: new THREE.Vector3() }, uMF: { value: new THREE.Vector3(0, 0, 1) }, uML: { value: new THREE.Vector3(1, 0, 0) }, uUnit: { value: 0.01 },
    uCare: { value: null }, uCareOn: { value: 0 }, uCareMin: { value: new THREE.Vector3() }, uCareSize: { value: new THREE.Vector3(1, 1, 1) },
  };
}
// pelaje y marcas en los uniforms: C = pelaje (career.js COATS), marks = { socks: [mi, md, pi, pd], blaze: 0–3 }
// medias: altura en fracción del alto del modelo (0,05 corona · 0,1 media · 0,18 media larga); cara: 1 estrella,
// 2 lucero con raya, 3 malacara
export function applyCoat(U, C, marks = {}) {
  U.uBody.value.setRGB(...C.body); U.uPoints.value.setRGB(...C.points);
  U.uPinto.value = C.pinto || 0; U.uDapple.value = C.dapple || 0; U.uRoan.value = C.roan || 0; U.uDorsal.value = C.dorsal || 0; U.uAppy.value = C.appy || 0;
  const s = (marks && marks.socks) || [0, 0, 0, 0]; U.uSocks.value.set(s[0] || 0, s[1] || 0, s[2] || 0, s[3] || 0);
  U.uBlaze.value = (marks && marks.blaze) || 0; U.uHoofPale.value = C.paleHooves ? 1 : 0;
}
// Pelaje: color del cuerpo y de los cabos (patas) por uniforms; del original overo se usa solo el detalle fino
// del pelo (cociente contra un mip lejano). Encima, el cuidado: barro (mate, marrón), sudor (espuma clara) y
// mojado (más oscuro y brillante), leídos de una textura 3D en el espacio en reposo.
export function bayCoat(mesh, U) {
  // pelo corto: satinado, sin el brillo plástico de una superficie lisa (validado con luz neutra)
  const m = mesh.material = physical(mesh.material, { roughness: 0.56, sheen: 0.38, sheenRoughness: 0.5, sheenColor: new THREE.Color(0.9, 0.68, 0.5), envMapIntensity: 0.85 });
  const g = mesh.geometry;
  g.computeBoundingBox(); const b = g.boundingBox;
  const h0 = b.min.y, h = b.max.y - b.min.y;
  m.color.setRGB(1, 1, 1);
  // sin datos de cuidado, una textura 3D limpia de un vóxel
  if (!U.uCare.value) { const t = new THREE.Data3DTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, 1); t.needsUpdate = true; U.uCare.value = t; }
  const MI = buildMarkAttribute(mesh);
  U.uMC.value.copy(MI.center); U.uMF.value.copy(MI.fwd); U.uML.value.copy(MI.lat); U.uUnit.value = MI.unit;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.uniforms.uLeg = { value: new THREE.Vector2(h0 + h * 0.20, h0 + h * 0.30) };
    sh.uniforms.uScale = { value: 1 / h };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
varying vec3 vBind; attribute vec4 aMark; varying vec4 vMark;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vBind = position; vMark = aMark;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vBind; varying vec4 vMark; uniform vec2 uLeg; uniform float uScale;
uniform vec3 uBody, uPoints; uniform float uPinto, uDapple, uRoan, uDorsal, uAppy, uBlaze, uHoofPale, uUnit;
uniform vec4 uSocks; uniform vec3 uMC, uMF, uML;
uniform highp sampler3D uCare; uniform vec3 uCareMin, uCareSize; uniform float uCareOn;
float hsh(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hsh(i), hsh(i + vec3(1,0,0)), f.x), mix(hsh(i + vec3(0,1,0)), hsh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hsh(i + vec3(0,0,1)), hsh(i + vec3(1,0,1)), f.x), mix(hsh(i + vec3(0,1,1)), hsh(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p) { return vnoise(p) * 0.55 + vnoise(p * 2.1) * 0.3 + vnoise(p * 4.3) * 0.15; }`)
      .replace('#include <map_fragment>', `
        vec3 tc = texture2D(map, vMapUv).rgb;
        float L = dot(tc, vec3(0.299, 0.587, 0.114));
        float Av = dot(textureLod(map, vMapUv, 4.5).rgb, vec3(0.299, 0.587, 0.114));
        float d = clamp(L / max(Av, 0.04), 0.9, 1.1);
        float legs = 1.0 - smoothstep(uLeg.x, uLeg.y, vBind.y);
        legs = clamp(legs + (d - 1.0) * 1.5, 0.0, 1.0);
        vec3 coat = mix(uBody, uPoints, legs);
        vec3 bp = vBind * uScale;
        // tordillo: moteado de anillos claros sobre gris
        if (uDapple > 0.0) { float n = fbm(bp * 7.0); coat *= mix(1.0, 0.68 + 0.45 * smoothstep(0.4, 0.6, n), uDapple); }
        float headM = smoothstep(-1.2, -1.8, vMark.x);
        float hy = (vBind.y - (uLeg.x - 0.2 / uScale)) * uScale;            // 0 suelo → 1 lo más alto del modelo
        vec3 rel = (vBind - uMC) * uUnit; float latM = dot(rel, uML), alM = dot(rel, uMF);   // metros: lateral y adelante
        // rosillo / moro: pelos blancos entreverados en el cuerpo; cabeza y cabos quedan de su color
        if (uRoan > 0.0) { float hair = vnoise(bp * 900.0) * 0.5 + vnoise(bp * 23.0) * 0.5;
          coat = mix(coat, vec3(0.78, 0.76, 0.74), uRoan * (1.0 - headM) * (1.0 - legs) * (0.3 + 0.28 * hair)); }
        // gateado y bayo: raya de mula oscura sobre el lomo
        if (uDorsal > 0.0) { float st = (1.0 - smoothstep(0.012, 0.03, abs(latM))) * smoothstep(0.5, 0.56, hy) * smoothstep(0.55, 0.4, alM) * smoothstep(-1.0, -0.85, alM) * (1.0 - headM);
          coat = mix(coat, uPoints, st * uDorsal * 0.85); }
        // appaloosa: manta blanca sobre las ancas con lunares oscuros
        if (uAppy > 0.0) { float edge = (fbm(bp * 2.6 + vec3(1.7)) - 0.5) * 0.9 + (vnoise(bp * 30.0) - 0.5) * 0.12;
          float bl = smoothstep(0.12, -0.22, alM + edge) * smoothstep(0.4, 0.5, hy + edge * 0.15) * (1.0 - legs);
          float sp = smoothstep(0.6, 0.64, fbm(bp * 13.0 + vec3(7.3, 2.1, 5.0)));
          coat = mix(coat, vec3(0.86, 0.84, 0.80), bl * uAppy); coat = mix(coat, uPoints * 1.3 + vec3(0.03), bl * sp * uAppy); }
        // overo: manchas blancas grandes de borde nítido, más en la panza y las patas
        if (uPinto > 0.0) { float n = fbm(bp * 1.7 + vec3(3.1, 1.7, 0.4)) + (1.0 - smoothstep(0.0, 0.45, bp.y - uLeg.y * uScale)) * 0.12;
          coat = mix(coat, vec3(0.82, 0.80, 0.76), smoothstep(0.46, 0.49, n) * uPinto); }
        vec3 white = vec3(0.86, 0.84, 0.80);
        // medias blancas: por pata, hasta su altura, con borde algo irregular
        float sock = 0.0;
        if (vMark.x > -0.5) { int li = int(clamp(floor(vMark.x + 0.5), 0.0, 3.0)); float shh = uSocks[li];
          if (shh > 0.0) sock = smoothstep(shh + 0.006, shh - 0.006, hy + (fbm(bp * 40.0) - 0.5) * 0.012); }
        coat = mix(coat, white, sock);
        // cara: estrella, lucero con raya o malacara (sobre la frente y la caña nasal)
        if (uBlaze > 0.5 && headM > 0.5 && vMark.w > -0.005) {
          float a = vMark.z, la = abs(vMark.y), fz = 0.0;
          if (uBlaze < 1.5) fz = 1.0 - smoothstep(0.022, 0.03, length(vec2(la, (a - 0.25) * 0.16)));
          else if (uBlaze < 2.5) fz = max(1.0 - smoothstep(0.024, 0.032, length(vec2(la, (a - 0.24) * 0.16))), (1.0 - smoothstep(0.008, 0.013, la)) * smoothstep(0.24, 0.3, a) * smoothstep(1.02, 0.95, a));
          else fz = (1.0 - smoothstep(0.03 + 0.03 * a, 0.04 + 0.03 * a, la)) * smoothstep(0.1, 0.16, a) * smoothstep(1.12, 1.05, a);
          coat = mix(coat, white, fz * headM); }
        // cascos: córnea oscura (o clara debajo de una media blanca)
        float hoof = smoothstep(0.034, 0.028, hy) * step(-0.5, vMark.x);
        coat = mix(coat, mix(vec3(0.075, 0.065, 0.06), vec3(0.42, 0.37, 0.30), max(sock, uHoofPale)), hoof);
        diffuseColor.rgb *= coat * d;
        // cuidado (solo si hay barro, sudor o agua: el caballo limpio no paga el ruido)
        vec4 cm = uCareOn > 0.5 ? texture(uCare, clamp((vBind - uCareMin) / uCareSize, 0.0, 1.0)) : vec4(0.0);
        float careRough = 0.0;
        if (uCareOn > 0.5) {
        float grain = fbm(bp * 38.0);
        // polvo: el pelo se ve apagado y grisáceo; barro seco en costras claras
        // polvo: el pelo pierde el brillo y el color se vuelve opaco y grisáceo (no más claro)
        float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lum) * vec3(1.02, 0.98, 0.92) + vec3(0.025, 0.02, 0.015), cm.r * 0.55);
        float mud = clamp(cm.r * 1.3 - (1.0 - grain) * 0.55, 0.0, 1.0);
        vec3 mudC = mix(vec3(0.13, 0.095, 0.065), vec3(0.3, 0.24, 0.17), smoothstep(0.35, 0.75, fbm(bp * 90.0)));
        diffuseColor.rgb = mix(diffuseColor.rgb, mudC, mud * 0.9);
        // sudor: pelo oscurecido y algo de espuma blanca donde roza el equipo
        float foam = smoothstep(0.68, 0.88, fbm(bp * 24.0 + vec3(0.0, bp.y * 5.0, 0.0))) * smoothstep(0.35, 0.8, cm.g);
        diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - 0.3 * cm.g), vec3(0.86, 0.83, 0.76), foam * 0.6);
        diffuseColor.rgb *= 1.0 - 0.35 * cm.b;
        careRough = mud * 0.35 - cm.b * 0.22 - cm.g * 0.1;
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + 0.15 * (1.0 - smoothstep(uLeg.x, uLeg.y, vBind.y)) + careRough, 0.28, 1.0);`);
  };
  m.needsUpdate = true;
}
// trama de sarga (tela de chaqueta y breeches) como mapa de normales, generada en un lienzo
function fabricNormal() {
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const c = cv.getContext('2d'), img = c.createImageData(N, N), h = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = (x + y) % 8, w = (x - y + 1024) % 16 < 8 ? 1 : 0;      // diagonal de sarga y entramado
    h[y * N + x] = (d < 4 ? 1 : 0) * 0.7 + w * 0.3 + Math.random() * 0.25;
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = h[y * N + (x + 1) % N] - h[y * N + (x + N - 1) % N], dy = h[((y + 1) % N) * N + x] - h[((y + N - 1) % N) * N + x];
    const i = (y * N + x) * 4; img.data[i] = 128 - dx * 60; img.data[i + 1] = 128 - dy * 60; img.data[i + 2] = 255; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(28, 28); t.colorSpace = THREE.NoColorSpace;
  return t;
}
function physical(src, props) {
  const m = new THREE.MeshPhysicalMaterial({ name: src.name, color: src.color, map: src.map, normalMap: src.normalMap, normalScale: src.normalScale,
    roughnessMap: src.roughnessMap, aoMap: src.aoMap, alphaTest: src.alphaTest, side: src.side, ...props });
  return m;
}
function lerp(a, b, k) { return a + (b - a) * k; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
