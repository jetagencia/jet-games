# Matriz Estación

- implementado: 23
- no_aplicable: 1
- ya_corregido_verificado: 1

## Hecho
Cuaderno operable con teclado y visor con cierre explícito; pila de pantallas como diálogos (nombre, inert, Tab contenido, retorno de foco); inspector con nombre estable, etiqueta «Tu respuesta», formato de respuesta y estado de comprobación anunciado; «Comprobar respuesta»; ayudas con etiquetas por acción y efecto real sobre las estrellas (gratis sólo en p3 elegible, sin coste en el diario); transcripción legible separada de reproducir y «Detener grabación»; interruptores y cristal con controles DOM equivalentes; tarjetas de sala con estado por icono y texto y controles para desplazar la vista; Ajustes con nombres por canal; semilla y copia de seguridad distinguidas con confirmaciones; borrado con confirmación explícita; viewport con zoom; estado de carga; compartir con fallback; dirección visual VIS-03..06 y VIS-01/02 conservando la codificación de cada puzle.
## Pendiente / decisiones
- VIS-ESTACION-06: el halo de las estrellas del mapa (star()) y plateGlyph se dejaron como estaban para no alterar el tamaño aparente de los puntos (pista).
- «Revelar método · −1 ★» usa una abreviatura de estrella en el botón (el texto completo del efecto va debajo); no había copy específico para el método.
- El engranaje del inicio estaba tapado por la capa .home (pointer-events): se liberó con .home{pointer-events:none}/.hcard{auto}, corrección fuera del catálogo pero necesaria para probar RSP-MODALS-01.
## Riesgos
- inert requiere navegadores modernos; en antiguos la pila sigue funcionando por z-index y el ciclo Tab del keydown.
- Los archivos ui.js/puzzles-*/draw.js/scenes.js son CRLF: se conservó el formato original tras la edición.
- Copys nuevos en voseo frente a textos previos del juego en tú.
