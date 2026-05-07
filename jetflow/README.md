# JETFlow — Prototipo v0.1

Tile-placement puzzle inspirado en Pipe Mania (1989), reimaginado para mobile touch.

## Cómo probar

1. Abrí `index.html` en el browser de Chrome móvil (o desktop con devtools en modo mobile).
2. Tocá "Empezar".
3. Tap en cualquier celda de la grilla para colocar la pieza marcada con "NEXT".
4. Construí un camino desde el origen (cuadradito naranja a la izquierda) antes de que el contador `Flow in` llegue a 0.
5. El flooz va a empezar a avanzar — sobreviví el target de tubos para pasar de nivel.
6. Pasar por una **cruz** en ambas direcciones da BONUS 5x (50 puntos extra).
7. Si el flooz se topa con un tubo desconectado o sale de la grilla → game over.

## Estado del prototipo

✅ Implementado:
- Grilla 7×9 responsive
- Queue de 5 piezas con preview
- Tap-to-place
- Origin tile fijo en columna 0
- Flow timer + countdown
- Flow physics (cruza tile a tile siguiendo conexiones)
- Crosses con bonus
- Score + target + level + best (localStorage)
- 8 niveles con dificultad progresiva
- Game over / Level up overlays
- Skip piece (-50 puntos)
- Touch + mouse fallback
- Estética neón consistente con JETBALL
- PWA manifest + Service Worker (instalable)
- Web fonts JetBrains Mono + Poppins

🔜 Siguientes iteraciones:
- Sound design (flooz borboteando, beeps, level up)
- Haptic feedback en placement + cross bonus
- Animación de flooz más fluida (interpolación entre segmentos)
- Modo Daily Puzzle (semilla por fecha)
- Modo Zen (sin timer)
- Skins de flooz (Premium)
- Biomes (laboratorio, jardín, espacio, volcán)
- AdMob + Play Billing (Capacitor wrap)

## Tech

- Single-file HTML5 con Canvas 2D
- Vanilla JS, sin frameworks
- ~600 líneas total
- Responsive: portrait mobile primary, fallback desktop OK
- DPR-aware rendering para pantallas retina
- Mismo stack que JETBALL → futuro wrap Capacitor reuse fácil

## Mecánica core

- **Pieces**: 4 codos (NE, ES, SW, WN), 2 rectas (NS, EW), 1 cross (4-way). Cross spawn rate ~7%.
- **Flow speed**: empieza a 1000ms/tile, baja a 450ms/tile en nivel 8.
- **Prep time**: 8s en nivel 1, 3s en nivel 8.
- **Target**: 7 tubos en nivel 1, 30 en nivel 8.
- **Score**: +10/tubo, +50/cross-bonus, +100×nivel al completar.
