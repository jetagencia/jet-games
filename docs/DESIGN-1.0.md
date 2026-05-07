# JETDrift — Design Doc 1.0

**Estado**: consensuado con Julián, mayo 2026
**Inspiraciones declaradas**: Alto's Odyssey (mood, low-poly silhouettes, dynamic skies), Monument Valley (impossible geometry, pastel solids), Hover! (1995, drift CTF + maze).

---

## 1. Visión

JETDrift es **un juego con motor único + portfolio de skins/temas + portfolio de modos**. El jugador siempre maneja un hovercraft con drift physics, pero el aspecto visual y el modo de juego cambian. La idea es que se sienta como **un universo coherente** con muchas formas de jugar — calmas y tensas, narrativas y abstractas.

## 2. Identidad visual — dos themes "skinables" iniciales

### Dunes (default — Alto's Odyssey homage, naming propio)

- **Paleta**: warm pastel sunset → atardecer cálido (rosa coral, durazno, lavanda, amarillo arena, índigo profundo en el horizonte).
- **Mundo**: dunas low-poly con silhouettes en primer plano (cactus, ruinas, palmeras), cielo dinámico que evoluciona durante la sesión (amanecer → mediodía → atardecer → noche estrellada → vuelve).
- **Niebla**: leve, dorada, da depth.
- **Hovercraft**: silueta low-poly, color cálido (terracota o crema), trail de polvo dorado.
- **Música**: ambient + percusión suave + flute distante. Escala pentatónica.
- **Mood**: contemplativo, premium feel.

### Spire (alternative — Monument Valley homage, naming propio)

- **Paleta**: cool pastel (rosa polvo, crema, verde menta, lila claro, gris cálido).
- **Mundo**: torres geométricas imposibles M.C. Escher (escaleras que dan vuelta, arcos que se conectan en imposibles), pillars solid color sin texturas, sombras planas.
- **Niebla**: leve, azulada.
- **Hovercraft**: low-poly de color contraste (rojo coral o azul cobalto), trail minimal.
- **Música**: minimal piano + reverb largo, 7 notas en loop ambient.
- **Mood**: meditativo, puzzle-like.

### Otros themes a futuro (post v1.0)

- **Citadel** (rescate del v0.3 dark fantasy si conviene)
- **Reef** (submarino, corales, peces neón)
- **Holocene** (industrial wasteland post-apoc)

## 3. Render style

**Low-poly limpio** como base — escalable a mobile, sintético del look Alto's/Polywings, fácil de iterar visualmente.
- Geometría: cubos, cilindros, esferas, planos. Sin texturas pesadas — solid color + emissive.
- Iluminación: directional sun + ambient hemisphere + post-processing (bloom suave, tone mapping).
- Shadows: blob shadows o volumetric simples.

Pixelart hi-res y vector clean quedan reservados como **skins Premium futuras** opcionales.

## 4. POV / Cámaras

Soportamos múltiples POVs unlockables:

| POV | Descripción | Default | Unlock |
|---|---|---|---|
| **Tercera persona** (3P) | Cámara detrás-arriba siguiendo el hovercraft | ✅ default | unlocked desde inicio |
| **Primera persona** (1P) | Cámara dentro del hovercraft, no se ve la nave | ❌ | unlocked al completar 5 carreras |
| **Top-down isométrico tilt** | Cámara cenital con tilt 30° (estilo Hades) | ❌ | unlocked al completar 10 modos distintos |
| **Lateral 2.5D** | Side-scroll con perspectiva (estilo Mirror's Edge mobile) | ❌ | unlocked al completar 20 modos distintos |

Switch en pause menu. Cada POV recalibra controles.

## 5. Controles mobile

### Default (3P / 1P / top-down)

- **Joystick flotante izquierda** — tocás un punto cualquiera de la mitad izquierda y aparece, dirección + magnitud = vector de empuje. Hovercraft yawea hacia donde apuntás.
- **Doble tap izquierda** = boost.
- **Botones derecha**: 0-3 botones de acción según modo (cloak/spring/wall solo en modos que los habilitan).
- **Auto-pickup** de ítems y banderas al pasar cerca.

### 2.5D lateral (cuando se desbloquee)

- Tap derecha = jump/grind (estilo Alto's, single-tap minimal).

### Settings

- Toggle tilt acelerómetro como alternativa al joystick.
- Sensibilidad ajustable.
- Vibración on/off.

## 6. Modos de juego

### Default (los 2 que se desbloquean al instalar)

| Modo | Descripción | Sesión target | Mood |
|---|---|---|---|
| **Carrera** | A → B contra el reloj. Checkpoints. Best time. | 1-3 min | tenso arcade |
| **Paseo** | Modo zen. Sin enemigos, sin reloj. Explorás el mundo. | endless | relajado |

### Unlockables (con run progress)

| Modo | Descripción | Sesión target | Unlock |
|---|---|---|---|
| **Cacería** | CTF Hover-style: 3 banderas tuyas vs 3 enemigas + drones AI. | 3-10 min | 5 carreras completadas |
| **Sombra** | Persecución inversa: huís de un drone que escala velocidad. | 1-3 min | 10 carreras completadas |
| **Cosecha** | Recolección con escalation: cada item recogido spawnea más enemigos. | endless | 15 carreras completadas |
| **Tránsito** | Stealth puro: cero combate, evadir conos de visión hasta llegar a meta. | 3 min | 20 carreras completadas |
| **Onírico** | Daily challenge: mismo seed para todos los jugadores cada día. | 1-3 min | 25 carreras completadas |

> Los nombres son la propuesta inicial — son provisorios, validable.

## 7. Tono y mood — dual

- **Modo arcade puro** (default): entrás → 3-2-1 → corrés. Sin cinemáticas.
- **Modo cinematográfico** (toggle settings): cada sesión arranca con cámara aérea + título biome + tipografía elegante (fade-in lento Alto's-style). Outro al ganar/perder.

Los modos tensos (Carrera, Cacería, Sombra, Cosecha, Tránsito) usan el tono tenso. Los relajados (Paseo, Onírico) usan calma.

## 8. Lore — opt-in, abstracto por default

Por defecto **abstracto puro**: no hay protagonista, vos sos "el piloto". Sin diálogos.

Opt-in en settings: **flavor text minimal** que aparece al cargar cada biome ("Las dunas se mueven cuando nadie las mira. Solo vos las atravesás."). Una línea, no más.

Sin diálogos extensos, sin NPCs, sin cutscenes narrativas. Si el jugador quiere lore, lo unlockea con una opción "Lore Mode".

## 9. Progresión — doble layer

### Por sesión (per-run)

Cada partida es self-contained. Empezás, ganás o perdés, arrancás de cero al volver. Score se guarda como best time / best score por modo + biome.

### Persistente (meta)

Desbloqueás:
- **Themes / biomes**: Dunes default → Spire al completar 10 modos. Otros más adelante.
- **POVs**: 3P default → 1P → top-down → 2.5D según completaciones.
- **Modos**: 2 default → 5 más a desbloquear.
- **Hovercraft skins**: cosmetic, ~10-15 al inicio. Algunas free, otras Premium.
- **Daily Challenge** (Onírico mode): leaderboards globales (POSPONED — necesita backend).
- **Achievements / colectables**: POSPONED.

## 10. Audio

- **Música procedural por theme**: distinta para Dunes (warm ambient) vs Spire (minimal piano).
- **Música por modo**: Carrera tiene más beat (drum-n-bass leve), Paseo es solo pad ambient, Cacería es tenso (synth low + percusión sub-grave).
- **Engine hum dinámico** (escala con velocidad).
- **SFX procedurales**: pickup chirp, capture arpeggio, drone alert, whoosh boost, crash thud.
- **Web Audio API** para todo (sin archivos pesados).

## 11. Stack técnico

- **Three.js** (WebGL) — base 3D para 3P/1P/top-down/2.5D rendering.
- **Vanilla JS modular** — sin frameworks pesados. Estructura por carpetas:
  - `src/core/` — engine compartido (input, physics, audio, save).
  - `src/themes/` — Dunes, Spire (geometry + colors + audio).
  - `src/modes/` — Carrera, Paseo, Cacería, etc. (cada uno self-contained con su loop).
  - `src/ui/` — HUD, menus, overlays.
- **Capacitor wrap** → Android Play Store + iOS App Store.
- **AdMob + Google Play Billing** para monetización (post-MVP).
- **No backend**: todo client-side hasta que daily challenge + leaderboards lo requieran (post-v1.0).

## 12. Mobile-responsive UI

- Joystick flotante + action buttons en safe-area
- Pause menu accesible desde botón discreto top-right
- Settings con: theme switch, POV switch, tilt vs joystick, vibración, audio volumen
- Funciona en portrait Y landscape (autoswitch con orientation)
- DPR cap 2 (no 3x retina)

## 13. Performance budget

- 60fps en mid-range Android (Snapdragon 6 series ~2022)
- Bloom + tone mapping con presets low/medium/high (auto-detect device)
- InstancedMesh para geometría repetida
- LOD dinámico para distancia
- Audio context lazy-loaded (después de primera interacción de usuario)

## 14. Roadmap

| Fase | Foco | Tiempo estimado | Branch |
|---|---|---|---|
| **v0.4** | Engine refactor + theme Dunes + Modo Carrera + 3P POV | 4-6h dedicadas | `v0.4-dunes` |
| **v0.5** | Modo Paseo zen + theme Spire | 3-5h | `v0.5-spire-paseo` |
| **v0.6** | Modo Cacería + 1P POV + audio refinada | 4-6h | `v0.6-cacheria` |
| **v0.7** | Modos Sombra + Cosecha + top-down POV | 4-6h | `v0.7-progresion` |
| **v0.8** | Modo Tránsito + Daily Challenge + persistent unlocks | 3-5h | `v0.8-meta` |
| **v0.9** | Polish + accessibility + audio | 3-5h | `v0.9-polish` |
| **v1.0** | Capacitor wrap + Play Store closed testing | 6-10h | `v1.0-launch` |

**Total realista**: 30-40 horas distribuidas en sesiones.

## 15. Decisiones que no quedaron consensuadas (a confirmar al avanzar)

- [ ] Nombres de modos: "Carrera/Cacería/Sombra/Cosecha/Tránsito/Paseo/Onírico" son propuesta — Julián los retoca cuando los vea jugando.
- [ ] Dirección del hovercraft (auto-orient hacia movimiento vs control manual) — definir en v0.4 jugando.
- [ ] Friction / acceleration tuning — iteración en v0.4.
- [ ] Cantidad de checkpoints en Carrera (más checkpoints = más rewarding pero menos intenso).
- [ ] Unlock thresholds — los X carreras propuestos son guess, ajustar con playtest.

## 16. Referencias visuales canónicas

- **Alto's Odyssey** — paleta, mood, low-poly, dynamic skies
- **Monument Valley 1+2** — impossible geometry, pastel solids
- **Polywings / Sky: Children of the Light** — low-poly silhouettes
- **Mini Motorways** — minimalismo + tipografía + UX limpia
- **Hover! (1995)** — drift physics, CTF (mecánica madre)
- **Tron 2.0** — neon trails (para themes futuros tipo Citadel)

## 17. Naming legal

JETDrift es marca de JETCompany OÜ. "Hover!" es marca de Microsoft (no protegida activamente, pero no usar). "Alto's Odyssey" es marca de Snowman (no copiar nombre ni assets). "Monument Valley" es marca de ustwo games (no copiar). Inspirarse en estética + mecánica = legal. Copiar nombre/assets = no.
