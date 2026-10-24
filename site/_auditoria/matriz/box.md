# Matriz Box

- implementado: 18
- no_aplicable: 4
- ya_corregido_verificado: 1

## Hecho
Modales con hidden/inert, foco y Tab atrapado, flechas y Enter respetan controles, HUD con Movimientos/Objetivo y ayuda con el objetivo real del nivel, acciones bajo el tablero en apaisado, grilla de niveles legible con aria-disabled, popover de audio corregido, selector de nivel como botón de 44 px, d-pad con click sintetizado, zoom permitido sin bloqueos globales, cabecera de dos filas y selector ES/EN de 44 px en móvil compacto, reinicio unificado y reversible, y los VIS (nivel de detalle por tamaño de casilla, meta/caja acoplada con marca, módulo con contorno, miniaturas con la paleta del juego).
## Pendiente / decisiones
- PLAY-BOX-03: la representación accesible del tablero es parcial (posición del jugador, empujes, bloqueos, acople y victoria); no se expone cada muro/meta.
- Par y umbrales de estrellas intactos (decisión 12): sólo cambió la presentación («Objetivo: {par} movimientos»).
## Riesgos
- Las ayudas de teclado del lateral derecho en apaisado (texto preexistente) muestran las teclas en dos líneas apretadas; no se tocó.
- inert requiere navegadores modernos; los modales cerrados quedan display:none igualmente.
