# JETDrift v0.5.0

**Hover! (Microsoft, 1995) reimaginado para 2026 mobile**, mecánicamente fiel + AAA polish visual estilo Asphalt 9 / NFS Mobile.

Ver `../docs/DESIGN-2.0.md` para el design doc consensuado (supersede 1.0).

Refs visuales originales del Hover! 1995 en `refs/`:
- `hover1995-castle.png` — Level 1 medieval
- `hover1995-sewer.png` — Level 2 industrial
- `hover1995-city.png` — Level 3 futurista

## v0.5.0 — Visual Proof

Esta versión solo busca **validar el visual y el feel del control**, antes de agregar CTF + drones + items.

### Lo que hay

✅ **Cockpit dashboard SIEMPRE visible** (overlay HTML/CSS sobre canvas WebGL):
- Top: indicador de banderas tuyas (izq) + score + indicador enemigo (der)
- Bottom-left: 3 slots de items (Wall / Spring / Cloak — vacíos por ahora)
- Bottom-center: radar circular con sweep + paredes detectadas + rotación con yaw
- Bottom-right: speedometer digital con bar de progreso + botón Nitro

✅ **POV primera persona** dentro del hovercraft (sin ver la nave, igual que Hover original)

✅ **Castle theme** (medieval stone):
- Maze 18×18 generado con recursive backtracker + 8% knockdown extra
- Paredes de piedra con textura procedural (block lines + cracks + highlights)
- Floor de tile pattern stone
- Sky shader con stars que titilan
- Ambient + hemisphere + moonlight + ~10 torches con flicker
- Mountains distantes como silhouettes (silueteado violeta-índigo en horizonte)
- Dust particles atmosféricos

✅ **Controles mobile landscape**:
- **Tap zones izquierda/derecha** (22% pantalla cada uno, entre top bar y dashboard) — tap-and-hold para girar continuo
- **Auto-acceleration** (no hay botón de gas — la nave avanza sola, igual que Asphalt 9 TouchDrive)
- **Nitro button** esquina derecha del dashboard — se desbloquea al sostener velocidad alta
- **Keyboard fallback** desktop: A/D o ←/→ para steerear, espacio para nitro

✅ **Visual polish**:
- UnrealBloomPass para neon glow
- ACES Filmic tone mapping
- Fog exp2 para depth
- Camera bob por velocidad
- Camera tilt al curvar
- CRT scanline + vignette overlay

✅ **Landscape lock**: si girás a portrait, muestra warning "rotá tu pantalla"

### Lo que falta (siguientes versiones)

🔜 **v0.5.1** — Flags Hover-style (3 propias + 3 enemigas + lógica de captura)
🔜 **v0.5.2** — Drones AI con state machine (CAPTURE + PROTECT roles) + sonar ping
🔜 **v0.5.3** — Items: Wall/Spring/Cloak con orbs scattered + uso real
🔜 **v0.6.0** — Sewer + City themes
🔜 **v0.7.0** — Audio synth orchestral
🔜 **v0.8.0** — Modos extra (Carrera, Sombra, Survival)
🔜 **v1.0** — Capacitor wrap + Play Store

## Cómo probar

⚠ Necesita servidor local (ES modules no funcionan con `file://`).

```cmd
cd C:\Users\torra\Desktop\jet-games\jetdrift
python -m http.server 8080
```

Después abrí http://localhost:8080 en Chrome.

**Para celular**: en la misma red que tu PC, abrí `http://<IP-de-tu-PC>:8080` (la IP se obtiene con `ipconfig`).

Si estás en portrait, va a mostrar "rotá tu pantalla" hasta que pongas landscape.

## Limpiar archivos viejos del v0.4

La carpeta `src/` que quedó del v0.4 ya no se usa (todo el código del v0.5 está en index.html ahora — single-file por velocidad de iteración). Podés borrarla desde Windows Explorer. El archivo `.CLEAN-ME.txt` está como recordatorio.

## Tech

- Three.js 0.160 (ES modules via importmap CDN)
- EffectComposer + UnrealBloomPass + OutputPass
- Web Audio API (futuro — todavía sin audio en v0.5.0)
- Vanilla JS sin frameworks
- ~1100 líneas single-file
- Mobile-first landscape
- DPR cap 2

## Decisiones de UX (justificadas)

- **Auto-accel**: Asphalt 9 / NFS Mobile lo hacen. Pedirle al jugador que mantenga gas es fricción innecesaria.
- **Tap zones vs joystick virtual**: para racing high-speed, joystick virtual es **peor UX** (tapa visión + precisión angular mala). Tap zones es lo que usan Asphalt y NFS.
- **Auto-yaw del hovercraft (no implementado v0.5.0)**: solo gira con steering manual, dejo la decisión de "auto-yaw + drag joystick" para si volvés con feedback de que querés eso.
- **Cockpit overlay HTML/CSS**: en lugar de meter el dashboard en el canvas 3D, lo hago en DOM. Es MUCHO más fácil de iterar visualmente, no afecta perf, se ve crisper en pantallas retina.
