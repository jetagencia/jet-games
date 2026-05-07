# JETSlalom — Prototipo v0.1

Endless ski-descent inspirado en SkiFree (Microsoft, 1991), reformulado para mobile touch con vista cenital + parallax.

## Cómo probar

1. Abrí `index.html` en Chrome móvil o devtools mobile.
2. Tocá "Empezar".
3. **Tap zona izquierda** = curvar izquierda. **Tap zona derecha** = curvar derecha.
4. Pasá entre los pares de banderas magenta para sumar score + combo.
5. Esquivá los árboles (te matan).
6. La velocidad escala con el tiempo. Llega el momento en que reaccionar es imposible — **eso es el chiste**.
7. Best score persistente.

## Estado del prototipo

✅ Implementado:
- Auto-descenso con scroll vertical infinito
- Touch zones izquierda/derecha (50/50 split de la pantalla)
- Steering con aceleración + fricción + max speed
- Tilt visual del player al curvar
- Spawn procedural de árboles + pares de banderas + grupos de árboles
- Collision detection (árboles = death, banderas = score)
- Combo system (banderas seguidas = puntos exponenciales)
- Speed multiplier escalando con tiempo
- Snow particles parallax (60 partículas, sinusoidal sway)
- Track edges (líneas neón laterales)
- Visual feedback: flash magenta al pasar par de banderas
- Vibración haptic en pickup + crash
- Best score persistente (localStorage)
- Overlays intro / game over con stats
- Estética neón consistente con JETBALL/JETFlow/JETDrift

🔜 Próximas iteraciones:
- **El "Chaser"** (sucesor del YETI) — aparece a partir de cierta distancia, te persigue
- Modos: Slalom puro / Tree Slalom / Trick Run (saltos)
- Power-ups: shield, slow-mo, magnet
- Biomes (snow → forest → desert → cyber)
- Sound design (whoosh, beep flag, crash)
- Daily Run con seed determinístico
- AdMob + Play Billing (Capacitor wrap)
- Skins de rider (cosmetic)

## Tech

- Single-file HTML5 con Canvas 2D
- Vanilla JS, ~500 líneas
- 60fps target
- DPR-aware

## Mecánica core

- **Player**: aceleración 800 px/s², máx velocidad lateral 380 px/s, fricción 0.88.
- **Track**: ancho dinámico ~max(W*0.42, 280px) cada lado.
- **Velocidad descenso**: 240 px/s base, *= (1 + elapsed * 0.025). En 30s va a 1.75×, en 60s a 2.5×.
- **Spawn rate**: 1 entidad cada 80-140 px de descenso.
- **Score**: 100 + combo*20 por par de banderas + bonus continuo por velocidad.
- **Combo**: aumenta con cada par de banderas pasado, **0** al perderse uno.
