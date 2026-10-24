# Matriz Match

- implementado: 18
- no_aplicable: 3
- ya_corregido_verificado: 1

## Hecho
Overlays con #app inert, role dialog y foco restaurado; Enter/Espacio sobre Pausa y Pista activan el control; Salir por modo con confirmación; Contrarreloj con tiempo restante real; resultado con Puntos, bonificación, estrellas y umbrales; live region del tablero; switches y sliders de 44 px; selector ES/EN de 44 px; borrado con confirmación explícita; columna lateral de 270 px en apaisado con Pista bajo los datos; gemas, especiales, cristal, halo único del tablero y movimiento reducido según los VIS.
## Pendiente / decisiones
- PLAY-MATCH-01: el copy «las jugadas restantes se convierten en rayos» se completó con «(hasta 15; las demás suman puntos)» porque la regla real convierte como máximo 15 jugadas.
- Reiniciar nivel/partida desde la pausa no pide confirmación (la etiqueta ya indica la pérdida; el catálogo sólo exige confirmación al salir).
- El tablero sigue en canvas: no hay un nodo por gema, sólo anuncios del cursor/selección/intercambio.
## Riesgos
- El 404 de sw.js en el smoke es esperable en este entorno.
- Apaisado: la columna lateral usa grid; el tablero se recalcula desde #stage con ResizeObserver, verificado a 1180×757.
