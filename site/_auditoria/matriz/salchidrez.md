# Salchidrez · matriz de la auditoría (22 registros: 16 propios + 6 comunes)

Estados: 17 implementado · 1 ya_corregido_verificado · 4 no_aplicable · 0 pendiente_decision · 0 bloqueado.
Archivo tocado: `site/salchidrez/index.html` (un solo HTML). Motor, IA, lecciones, partituras y guardado sin cambios de regla.

Hecho
- Pila de overlays con inert, diálogos con nombre, foco inicial/devuelto y Tab encerrado; Coronación no se elude con Escape (RSP-SALCHIDREZ-01).
- Tablero semántico role=grid sincronizado con kb.sq/keyActivate y región viva con jugada, captura, jaque, turno y resultado (RSP-SALCHIDREZ-02, PLAY-SALCHI-05).
- Tarjeta de la máquina: «La máquina está pensando…» / «La máquina está moviendo.»; humano: «Te toca: elegí un perro.» (PLAY-SALCHI-01).
- Deshacer con nombre contextual (2 medias jugadas contra la IA, 1 en local) (PLAY-SALCHI-02).
- «Ver tablero final» con explicación del mate por equipo real y «Volver al resultado»; Deshacer sigue disponible (PLAY-SALCHI-03).
- Estadísticas finales: «Piezas capturadas por {equipo}»; movidas con unidad «{n} turnos» y explicación (PLAY-SALCHI-04).
- aria-pressed en rival/dificultad/color/tema y en Música/Sonidos con «… desactivada/os» (RSP-SALCHIDREZ-03, PLAY-SALCHI-05).
- «Nueva partida» con confirmación cuando hay guardado; «Siguiente/Repetir/Reintentar lección», «Volver al menú» (SRC-CH02, SRC-CH01, SRC-G03).
- Visual: coordenadas en el marco, viñeta .08, selección/última jugada/foco/captura separados y sin marcha continua, variante simple de perros en casillas <40 px e insignia en la pieza seleccionada, partículas fuera del tablero y movimiento reducido (VIS-SALCHIDREZ-01..04). Zoom permitido y touch-action sólo en el canvas (RSP-GLOBAL-01). Insets laterales y flechas de galería 44 px (RSP-SALCHIDREZ-04).

Verificación: `node --check` de los scripts inline; `smoke.mjs salchidrez` (único error: 404 de sw.js, esperado); `site/_auditoria/_smoke/salchidrez_test.mjs` 39/39, incluido un mate del loco en local operado con las celdas semánticas (capturas salchidrez-final-view-test.png, salchidrez-320-test.png).

Pendiente / riesgos
- PLAY-SALCHI-04: no se usó literalmente «Jugadas completas» porque el conteo vigente es Math.ceil(turnos/2) (número de jugada en notación) y la instrucción prohíbe cambiar la métrica; se rotuló «Jugadas» + «{n} turnos» con descripción. Decisión del coordinador si prefiere cambiar la métrica a floor().
- Los textos de las tarjetas viven en canvas: se verificaron por lectura de `playerStatus`, no por DOM.
- Comparación visual de temas Nieve/Noche con movimiento reducido y render de la variante simple a 320 px quedan para ojo humano.
- `inert` requiere navegadores modernos; el fallback CSS sólo bloquea el puntero.
