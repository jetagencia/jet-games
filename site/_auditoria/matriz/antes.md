# Matriz Antes

- implementado: 21
- no_aplicable: 1
- ya_corregido_verificado: 1

## Hecho
Tab liberado (vista temporal con [ ] y botones), capas como diálogos con inert/foco/retorno, Enter/Espacio nativos sobre controles, reinicio y borrado con confirmación explícita, metas y reloj visibles antes del resultado, Deshacer/Rebobinar/Reiniciar diferenciados, repetición sincronizada con controles, capítulos legibles, Ajustes con nombres por canal, estado del tablero para lector, viewport con zoom, estado de carga SRC-G05, compartir con fallback persistente, y la dirección visual (suelo, ecos, cables, rótulo «Vista») sin tocar reglas ni semillas.
## Pendiente / decisiones
- PLAY-ANTES-01: no se cambió encuadre ni tamaño de celda (el nivel sigue completo en pantalla); sólo jerarquía visual.
- Mantener R (600 ms) sigue siendo una vía de reinicio: el gesto mantenido actúa como confirmación; la pulsación corta avisa y no reinicia.
## Riesgos
- inert requiere navegadores modernos; en antiguos las capas siguen ocultas por display:none.
- Los nuevos copys siguen el voseo de los copys oficiales mientras los textos previos del juego usan tú; mezcla visible en algunas pantallas.
