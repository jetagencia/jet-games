# JETDrift — Design Doc 2.0 (canonical, supersedes 1.0)

**Estado**: corregido tras ver video de gameplay de Hover! 1995, mayo 2026.
**Supersede**: `DESIGN-1.0.md` (que apuntaba a Alto's Odyssey-style — esa dirección fue descartada).

---

## La fórmula

**JETDrift 2026 = Hover! 1995 (mecánicamente) + Asphalt 9 / NFS Mobile (visualmente) + Mobile touch UX**

Esto es exactamente el mismo paradigma que JETBALL → JezzBall: tomar un clásico de los 90s y reimaginarlo para 2026 mobile con polish AAA actual.

## Referencias visuales canónicas

Guardadas en `jetdrift/refs/`:
- `hover1995-castle.png` — maze medieval, paredes de piedra, mountains afuera
- `hover1995-sewer.png` — maze industrial, piso checkered gris
- `hover1995-city.png` — maze cyber futurista, torres azules, piso púrpura

**Lo que sobrevive de Hover! 1995**:
- **1ra persona dentro del hovercraft** — POV fijo desde la cabina
- **Cockpit dashboard SIEMPRE visible** con: radar (center), speedometer (right), item counters (left), score (top-right), flag indicators (top-left)
- **3 mazes themed**: Castle medieval / Sewer industrial / City cyber
- **CTF gameplay**: 3 banderas tuyas + 3 enemigas; ganás capturando todas las del enemigo antes que ellos las tuyas
- **2-3 drones AI** con roles distintos: **CAPTURE team** (te roban banderas) y **PROTECT team** (defienden las suyas)
- **Sonar ping** cuando un enemigo te detecta visualmente
- **Items recolectables** (orbs scattered en el maze): **Wall** (placeás muro temporal), **Spring** (jump alto), **Cloak** (invisible temporalmente)
- **Score system** + level progression

**Lo que se moderniza (referencia Asphalt 9 / NFS Mobile)**:
- Motion blur en velocidad
- Lighting + shadows + bloom + tone mapping (ACES Filmic)
- Particle effects (dust, sparks, light streaks)
- High-poly cockpit frame con dashboard digital (no el frame rojo retro)
- Texturas modernas en paredes + piso (no flat colors)
- Smooth 60fps physics, no glitches
- Audio: synth-orchestral modernizado que respeta el feel del Stan LePard original

## POV y cámara

**1ra persona FIJA**:
- Cámara está dentro del hovercraft, mirando hacia adelante
- NO se ve la nave (excepto en los momentos en que el cockpit frame la enmarca)
- El cockpit frame (HTML/CSS overlay sobre el canvas) provee la sensación de "estar adentro"

## Mobile UX — landscape locked

**Layout**:
- Pantalla horizontal. Sensor de orientación obliga landscape si está vertical.
- Cockpit frame ocupa bordes superiores + dashboard inferior.
- Centro de pantalla: vista 3D del maze.

**Controles** (Asphalt-style mobile racing):
- **Auto-accelerate**: hovercraft avanza solo. Sin botón gas.
- **Steering tap-zones**: tap-and-hold mitad izquierda inferior = girar izquierda continuo; mitad derecha inferior = girar derecha. Soltar = continuar recto con inercia.
- **Brake / reverse**: long-press en zona central inferior (cuando hace falta retroceder de un dead-end).
- **Drift**: swipe-down en zona de steering = drift mode. Carga nitro al terminar.
- **Nitro button**: tap esquina derecha (sobre dashboard, no obstruye).
- **Items**: 3 botones en columna izquierda del dashboard (Wall / Spring / Cloak) con counter de cuántos tenés.

Settings (post-MVP): tilt sensor toggle, sensitivity slider, lefty mode (swap zones).

## Modos de juego (en este orden de implementación)

| # | Modo | Descripción | Status |
|---|---|---|---|
| 1 | **Exploración** | Vagar libre por el maze, sin objetivos. Visual proof + control feel. | **v0.5.0 — primero** |
| 2 | **Cacería** (CTF Hover-style) | El modo "Hover original". 3 banderas tuyas + 3 enemigas + drones AI. | v0.5.1 |
| 3 | **Carrera** | Race contra reloj, checkpoints por el maze. | v0.5.2 |
| 4 | **Sombra** | Persecución inversa: drones te cazan, escapás. | v0.6 |
| 5 | **Tránsito** | Stealth puro, evadir conos de visión, no destruir nada. | v0.6 |
| 6 | **Survival** | Oleadas crecientes que aparecen y te cazan. | v0.7 |
| 7 | **Onírico** | Daily challenge: mismo seed para todos. | v0.8 |

## Themes (en este orden)

| # | Theme | Inspirado en | Status |
|---|---|---|---|
| 1 | **Castle** (medieval stone) | Hover Level 1 + Skyrim mood | **v0.5.0 — primero** |
| 2 | **Sewer** (dark industrial) | Hover Level 2 + Blade Runner 2049 | v0.5.x |
| 3 | **City** (cyber futurista) | Hover Level 3 + Cyberpunk 2077 mobile | v0.5.x |

## Visual polish targets

- Motion blur en walls cuando hay velocidad alta
- Bloom suave en lights + items glowing
- Particle dust trail detrás del hovercraft
- Speed lines en boost
- Cockpit framing con sutil "vibration" en aceleración fuerte
- Screen flash + camera shake en collisions
- Heads-up animations (capture flag = celebración breve, sonar detected = alarm pulse)

## Plan de iteraciones

| Versión | Foco | Entregable |
|---|---|---|
| **v0.5.0** | Visual proof: cockpit + castle maze + 1st person + free movement | Que se vea bien y se sienta el feel de Hover! moderno |
| v0.5.1 | CTF mechanic: 3 flags + 1 enemy drone + score | Game playable end-to-end |
| v0.5.2 | Items (Wall/Spring/Cloak) + sonar detection | Hover! completo mecánicamente |
| v0.5.3 | Multi-drone AI (capture + protect roles) | Difficulty escala |
| v0.6.0 | Sewer + City themes | 3 mazes igual que Hover original |
| v0.7.0 | Audio orquestal modernizada | Identidad sonora |
| v0.8.0 | Modos extra (Carrera, Sombra, Survival) | Variedad |
| v0.9.0 | Polish + accessibility + Capacitor wrap | Pre-Play Store |
| v1.0 | Play Store closed testing | Lanzamiento |
