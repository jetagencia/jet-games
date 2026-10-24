# flow: 15 registros del catálogo, 26 copys

## [RSP-FLOW-02] P1 · active · Responsive y controles
**Pausa y liberar/acelerar flujo necesitan botones DOM, no sólo hitboxes del canvas**
- Actual: P1 para acceso asistivo · alta · confirmado por fuente. `current_1410/jetflow_canonical.html:177` tiene un único canvas `tabindex=-1`; `layout()` 964/969/978/980 crea `L.pause/L.fast` como rectángulos; `1567–1572` sólo detecta coordenadas pointerdown. Atajos P/F existen pero no hay controles accionables en árbol accesible.
- Instrucción: Crear botones reales `#flow-pause` y `#flow-release` en capa HUD `pointer-events:none`, botones `pointer-events:auto`; actualizar `left/top/width/height` desde los mismos `LY.pause/LY.fast` en `layout()`. Mínimo de 44×44 px; estado/label del segundo debe reflejar liberar, acelerar o no disponible. Click invoca `pause()`/`release()` y detiene propagación. No dibujar un segundo rótulo encima; pasar visuales del botón al DOM o dejar canvas decorativo debajo. Ocultar/inert botones al abrir pantallas.
- Copy: 
- Aceptación: Se encuentran por Tab y lector de pantalla y funcionan con click sintetizado, Enter, Espacio y tap; un tap no coloca tubería debajo; posición coincide exactamente a 320/360/390/768 y tras girar. No afirmar con este cambio que el tablero entero ya es accesible.
- Referencias: Archivo: current_1410/jetflow_canonical.html
Líneas: 177
Archivo: current_1410/jetflow_canonical.html
Líneas: 177,964,969,978,980,1567–1572
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [PLAY-FLOW-01] P2 · active · Prueba interactiva y propuestas
**No enfocar Borrar progreso al abrir Ajustes**
- Actual: Al abrir Ajustes, el árbol de accesibilidad informó que el foco estaba en Borrar progreso, aunque los controles de audio aparecen antes. No se activó esa acción.
- Instrucción: Situar el foco inicial en el título del diálogo o en el primer control de sonido. Agrupar el borrado al final, en una zona separada, y exigir confirmación explícita.
- Copy: Borrar progreso
¿Borrar todo el progreso?
Se eliminarán tus circuitos completados y estrellas guardadas. Esta acción no se puede deshacer.
Cancelar
Borrar progreso
- Aceptación: Abrir Ajustes y pulsar Enter no borra datos ni abre la confirmación de borrado. Escape y Cancelar no modifican el progreso.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:26:00Z/2026-10-22T14:31:00Z

## [PLAY-FLOW-02] P2 · active · Prueba interactiva y propuestas
**Unificar Liberar y Acelerar con el tutorial**
- Actual: La presentación previa indica tocar Acelerar, pero el botón inicial muestra LIBERAR. Después cambia a ACELERAR y queda deshabilitado mientras acelera.
- Instrucción: Explicar ambos estados y sus consecuencias con textos sincronizados con el botón. No indicar que se pulse un control cuyo nombre todavía no aparece.
- Copy: Liberar plasma
Acelerar plasma
Cuando el recorrido esté listo, tocá «Liberar plasma». Después podés acelerar el flujo para duplicar los puntos por tramo.
- Aceptación: Cada instrucción coincide con etiqueta y estado actual; la bonificación descrita se verifica contra regla real.
- Referencias: evidence/flow-pass1-gameplay.jpg
evidence/flow-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T14:26:00Z/2026-10-22T14:31:00Z

## [PLAY-FLOW-03] P2 · active · Prueba interactiva y propuestas
**Separar orientación, vista previa y personaje durante la colocación**
- Actual: El personaje, la pieza fantasma, el cursor amarillo y la ayuda turquesa se superponen al área de colocación. El 1 de la cuenta atrás tapa el reactor o el recorrido.
- Instrucción: Dibujar una vista previa semitransparente sólo en la celda objetivo. Marcar entradas y salidas con flechas; desplazar al personaje y su globo fuera del tubo; situar la cuenta atrás junto al HUD sin cubrir conexiones. Conservar la orientación real de las piezas y la regla que impide rotarlas.
- Copy: Pieza actual
Próxima pieza
Conectá estas dos salidas.
- Aceptación: En cada paso se identifican los extremos del tubo, la pieza colocada y su vista previa. Ninguna ayuda tapa una conexión ni el reactor.
- Referencias: evidence/flow-pass1-gameplay.jpg
evidence/flow-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T14:26:00Z/2026-10-22T14:31:00Z

## [PLAY-FLOW-04] P2 · active · Prueba interactiva y propuestas
**Explicar y localizar la fuga sin borrar evidencia visual**
- Actual: Resultado informa Faltaron 4 tramos y desenfoca toda la ruta; no permite identificar claramente qué conexión falló.
- Instrucción: Antes de abrir el modal, congelar la ruta con la celda de fuga marcada. Añadir una acción para revisar el tablero y volver al resultado sin reanudar la partida. Mantener el desglose actual de puntuación. El número de tramos faltantes debe calcularse desde el objetivo y el recorrido reales, con singular y plural.
- Copy: Revisar la fuga
Faltaron {tramos} tramos para completar el objetivo.
Faltó 1 tramo para completar el objetivo.
Volver al resultado
- Aceptación: Tras perder, se puede localizar el extremo desconectado y consultar el total y sus descuentos sin iniciar otra partida. Verificar el mensaje con 1 tramo faltante y con varios.
- Referencias: evidence/flow-pass1-result.jpg
evidence/flow-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T14:26:00Z/2026-10-22T14:31:00Z

## [PLAY-FLOW-05] P2 · active · Prueba interactiva y propuestas
**Exponer los controles de juego fuera del canvas**
- Actual: Durante la partida, el árbol de accesibilidad sólo muestra la imagen Tablero de JET//Flow; los controles visibles de pausa y liberar/acelerar no aparecen como botones semánticos.
- Instrucción: Crear controles DOM sobre la interfaz, con nombre, foco visible y estado disabled real. Exponer la celda seleccionada y la pieza actual en una salida accesible. No convertir cada fotograma en un anuncio.
- Copy: Pausar
Liberar plasma
Acelerar plasma
- Aceptación: Tab alcanza Pausar y Liberar; Enter los activa. El lector anuncia la pieza seleccionada y el resultado sin emitir anuncios repetitivos por fotograma.
- Referencias: evidence/flow-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T14:26:00Z/2026-10-22T14:31:00Z

## [RSP-FLOW-01] P2 · active · Responsive y controles
**El selector de niveles cambia a 3 columnas, pero la navegación sigue contando 6**
- Actual: P2 · alta · confirmado por fuente. `current_1410/jetflow_canonical.html:113–114,169`: 6 columnas con gap de 8 px y cambio a 3 sólo por debajo de 359 px; `1596` desplaza ±6 en ArrowUp/Down siempre. A 320 la flecha vertical salta dos filas. A 360, con padding de pantalla de 28 px y de tarjeta de 42 px, la celda es `(360−28−42−40)/6=41,67px`, inferior al objetivo de 44 px; a 390 resulta 46,67 px. No es una medida renderizada.
- Instrucción: Cambiar breakpoint a `@media(max-width:419px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.lvl{aspect-ratio:1.2;min-height:48px}}`; mantener 6 columnas desde 420 px. En navegación derivar número de columnas del `.grid` del nivel enfocado (`getComputedStyle(grid).gridTemplateColumns.split(' ').length` o medir posiciones) en lugar del literal 6; no saltar al grid de otro sector inadvertidamente.
- Copy: 
- Aceptación: A 320/360/390 hay 3 columnas de áreas de interacción de al menos 48 px de alto; Up/Down mantiene columna y avanza una fila; a 768 hay 6 columnas y la misma regla. Último nivel de un sector no salta a un control arbitrario.
- Referencias: Archivo: current_1410/jetflow_canonical.html
Líneas: 113–114,169
Archivo: current_1410/jetflow_canonical.html
Líneas: 113–114,169,1596
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-GLOBAL-01] P2 · active · Responsive y controles
**Permitir ampliar la interfaz, sin romper los controles de juego**
- Actual: P2 · confianza alta · confirmado por fuente. `meta[name=viewport]`, línea 5 (Match: línea 83 en la versión canónica actual) de `current_1410/antes.html`, `current_1410/astro.html`, `current_1410/balizas.html`, `current_1410/bestiario.html`, `current_1410/cajanegra.html`, `current_1410/crater.html`, `current_1410/estacion.html`, `current_1410/frentes.html`, `current_1410/jetball.html`, `current_1410/jetbox.html`, `current_1410/jetflow_canonical.html`, `current_1410/jetmatch_canonical.html`, `current_1410/jetrocket_canonical.html`, `current_1410/jetslalom_canonical.html`, `current_1410/jetwords_canonical.html`, `current_1410/portada.html`, `current_1410/raid.html`, `current_1410/salchidrez.html`, `current_1410/senal.html`, `current_1410/telemetria.html`: contienen `maximum-scale=1` y `user-scalable=no`. **No aplicarlo a Jump/Escudos: ya permiten zoom en meta.**
- Instrucción: Eliminar solamente `maximum-scale` y `user-scalable`; conservar `width=device-width, initial-scale=1, viewport-fit=cover` y `interactive-widget=resizes-content` de Estación. No bloquear `gesturestart`/doble clic a nivel documento. En Box, eliminar los bloqueos globales de `gesturestart`/`dblclick` (`current_1410/jetbox.html:924–925`) y mover `touch-action:none` de `html,body` (66) a `#stage,#dpad`. En Astro, mover `touch-action:none` de `html,body` (72–76) a la superficie de juego. En Telemetría, retirar también el bloqueo global de `gesturestart` en `current_1410/telemetria__telemetria__src__ui.js:1182`, limitándolo, si fuera imprescindible, a un gesto activo del canvas. Los paneles desplazables deben usar `touch-action:pan-y pinch-zoom`; botones, `manipulation`. Mantener control de puntero sólo sobre el lienzo/pad.
- Copy: 
- Aceptación: Se puede ampliar Ayuda/Ajustes al 200 % y leer/activar todo mediante scroll; el desplazamiento por el panel no salta/dispara en el juego; arrastrar el juego sigue sin mover la página. No asumir que eliminar sólo meta resuelve los bloqueos CSS/JS.
- Referencias: Archivo: current_1410/antes.html
Líneas: 
Archivo: current_1410/astro.html
Líneas: 
Archivo: current_1410/balizas.html
Líneas: 
Archivo: current_1410/bestiario.html
Líneas: 
Archivo: current_1410/cajanegra.html
Líneas: 
Archivo: current_1410/crater.html
Líneas: 
Archivo: current_1410/estacion.html
Líneas: 
Archivo: current_1410/frentes.html
Líneas: 
Archivo: current_1410/jetball.html
Líneas: 
Archivo: current_1410/jetbox.html
Líneas: 
Archivo: current_1410/jetflow_canonical.html
Líneas: 
Archivo: current_1410/jetmatch_canonical.html
Líneas: 
Archivo: current_1410/jetrocket_canonical.html
Líneas: 
Archivo: current_1410/jetslalom_canonical.html
Líneas: 
Archivo: current_1410/jetwords_canonical.html
Líneas: 
Archivo: current_1410/portada.html
Líneas: 
Archivo: current_1410/raid.html
Líneas: 
Archivo: current_1410/salchidrez.html
Líneas: 
Archivo: current_1410/senal.html
Líneas: 
Archivo: current_1410/telemetria.html
Líneas: 
Archivo: current_1410/jetbox.html
Líneas: 924–925
Archivo: current_1410/telemetria__telemetria__src__ui.js
Líneas: 1182
Archivo: current_1410/jetbox.html
Líneas: 66,924–925
Archivo: current_1410/astro.html
Líneas: 72–76
Archivo: current_1410/jetball.html
Líneas: 5
Archivo: current_1410/astro.html
Líneas: 5
Archivo: current_1410/jetrocket_canonical.html
Líneas: 5
Archivo: current_1410/jetslalom_canonical.html
Líneas: 5
Archivo: current_1410/jetflow_canonical.html
Líneas: 5
Archivo: current_1410/jetmatch_canonical.html
Líneas: 83
Archivo: current_1410/jetwords_canonical.html
Líneas: 5
Archivo: current_1410/jetbox.html
Líneas: 5
Archivo: current_1410/salchidrez.html
Líneas: 5
Archivo: current_1410/senal.html
Líneas: 5
Archivo: current_1410/antes.html
Líneas: 5
Archivo: current_1410/telemetria.html
Líneas: 5
Archivo: current_1410/portada.html
Líneas: 5
Archivo: current_1410/cajanegra.html
Líneas: 5
Archivo: current_1410/crater.html
Líneas: 5
Archivo: current_1410/frentes.html
Líneas: 5
Archivo: current_1410/balizas.html
Líneas: 5
Archivo: current_1410/estacion.html
Líneas: 5
Archivo: current_1410/raid.html
Líneas: 5
Archivo: current_1410/bestiario.html
Líneas: 5
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [SRC-F01] P2 · active_source_finding · Texto, estados y flujo
**#bGo; #bRetry; #bResume; #bRestart; rT/rS**
- Actual: Empezar; Reintentar; Continuar; Reiniciar; ¡Llegó al motor antes de tiempo!
- Instrucción: En resultados usar Repetir circuito si ok=true, Reintentar circuito si ok=false. El título de derrota debe explicar causa sin jerga ambigua; mantener detalles de tramos construidos/requeridos y motor.
- Copy: Comenzar circuito; Reintentar circuito; Reanudar partida; Reiniciar circuito; Faltan tramos para llegar al objetivo
- Aceptación: Probar fuga antes del objetivo, falta de motor y motor demasiado temprano: tres causas diferenciadas. Reintentar mantiene el circuito y no avanza la puntuación.
- Referencias: https://jetgames.fun/flow/ — final_revalidation/jetflow.html:233–267,377–400,1473–1490
- Notas: Recomendación de texto. Revalidación final HTTP de sólo lectura 2026-10-22 16:14–16:20 UTC. Las capturas anteriores permanecen preservadas. Este revisor no jugó. El texto actual confirmado es «¡Llegó al motor antes de tiempo!». Las citas de versiones anteriores sólo se conservan como evidencia histórica fechada, no como la interfaz vigente.

## [SRC-F02] P2 · active_source_finding · Texto, estados y flujo
**#bRestart; #bPLevels; #bQuit**
- Actual: Reiniciar; Niveles; Menú principal
- Instrucción: Los handlers descartan el circuito sin confirmación explícita en estas rutas. Aclarar pérdida del intento o conservar/autoguardar. Confirmación Cancelar/Reiniciar circuito; no para una partida sin movimientos.
- Copy: Reiniciar circuito / Ver niveles / Volver al menú
- Aceptación: Tras colocar piezas, abrir pausa→reiniciar/salir requiere decisión o garantiza guardado; cancelar restaura exactamente piezas, tiempo y estado del flujo.
- Referencias: https://jetgames.fun/flow/ — current_1410/jetflow_canonical.html:233–239,1509–1519
- Notas: Riesgo derivado de fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-FLOW-01] P2 · active_proposal · Dirección visual interna
**Materiales, celdas y juntas legibles**
- Actual: Archivo: ui_audit/source_review/current_1410/jetflow_canonical.html
Líneas: 769–777; 896; 1213–1262;836–846
Funciones: flange
drawTube
buildBoardCache
drawBoard
cellBg
Selectores: 
Valores literales de la fuente: bridas gradient #5d6588/#b7bfdc/#4a5072
flange width=s*.54; depth=s*.09
PM y mapMask definen conexiones
m===15: horizontal, crossTop, vertical
cellBg base#0d0819; tile gradient#1e1535→#140d26
cellBg border rgba(255,255,255,.05),1px; rivets#2b2349
Capturas inspeccionadas: ui_audit/evidence/flow-pass1-gameplay.jpg (1180×757; inspeccionada: cuenta 1 grande sobre origen y tablero, guía y cursor de reemplazo)
ui_audit/evidence/flow-pass2-gameplay.jpg (1180×757; inspeccionada: juntas de celdas oscuras, cursor amarillo sobre pieza y astronauta adyacente, flujo acelerado)
Observación visual en las capturas: En ambas capturas, las juntas de las celdas quedan próximas en luminancia a la superficie morada; los tubos metálicos se distinguen más que la retícula. Esto respalda reforzar discretamente el tablero, no cambiar la geometría.
- Instrucción: Conservar el material metálico y dar a cada pieza una silueta limpia: borde exterior oscuro, superficie intermedia fría y brillo fino en la arista, evitando múltiples halos. Mantener el mismo tratamiento en tablero, cola y ayuda. En los cruces, hacer visible el puente superior con sombra corta y separación de borde, respetando el orden horizontal→crossTop→vertical que ya existe; nunca dibujarlo como unión de cuatro vías si no lo es. Reducir tornillos y detalle decorativo cuando la celda sea pequeña en vez de reducir el grosor de las conexiones. En la retícula observada, añadir un separador continuo de 1 px de pantalla en #473b61 al 65% de opacidad y un borde interior más oscuro, sin convertir cada casilla en una tarjeta brillante. Mantener los remaches decorativos por debajo de ese separador en contraste. Verificar el resultado tanto en la zona vacía como debajo de curvas y depósitos.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- panel_joints: #473B61 a 0.65,1 CSS px
- pipe_outer_edge: #090610,1.5 CSS px
- pipe_rim: #B7BFDC a 0.8,1 CSS px
- cross_bridge_shadow: 0 2 px 3 px rgba(0,0,0,.45)
- cell_fill: gradiente #1E1535/#140D26, conservar
- canvas_background: #0A0512; nebulosa decorativa alpha 0.14 máximo; estrellas alpha 0.15 máximo detrás del tablero
- tile_surface: #1E1535→#140D26, conservar material; separación #473B61 a 0.65,1 px
- Copy: 
- Aceptación: Cada pieza y cruce puede reconocerse al tamaño mínimo de celda; una misma pieza se ve idéntica en ayuda, cola y tablero. Una simulación idéntica conserva ruta, tiempos y resultado. En las escenas de las dos capturas, se pueden contar y seguir las casillas sin confundir juntas con tramos de tubería.
- Referencias: ui_audit/source_review/current_1410/jetflow_canonical.html
- Notas: Propuesta de dirección visual apoyada en la fuente y en capturas inspeccionadas; no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No modificar PM, mapMask, puertos de entrada/salida, rotación lógica, capacidad de depósitos ni conectividad de cruces. Los cambios son de material, no de trazado del tubo.

## [VIS-FLOW-02] P2 · active_proposal · Dirección visual interna
**Origen, motor y flujo diferenciados**
- Actual: Archivo: ui_audit/source_review/current_1410/jetflow_canonical.html
Líneas: 1213–1257
Funciones: drawBoard
drawFluid
drawTankFluid
Selectores: 
Valores literales de la fuente: origen pulse=.6+.4*sin(T*(cdFrac<.3?14:5))
arco cdFrac rojo #ff4d6d o cian #00f2cf
motor spd=exitWon?14:1.4
fluido col.core y col.rgb
- Instrucción: Distinguir entrada y motor mediante forma estable antes que animación: conservar el núcleo circular del origen y las aspas del motor, y añadir una pequeña flecha de dirección en el puerto correspondiente sólo si no tapa el conducto. Mantener el fluido dentro del tubo con un frente de avance claramente recortado; no aplicar resplandor que una visualmente tubos vecinos. En cuenta final, el arco de tiempo debe tener borde legible sobre el origen; no acelerar además múltiples brillos decorativos. Mantener el color de cada fluido y las condiciones de salida ganada.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- port_arrow: #D9E2F2, ancho 0.12*s, largo 0.18*s; sin tapar canal
- fluid_glow_max: 0.08*s; fluido col.core intacto
- count_ring: 0.05*s, borde oscuro 1 px
- reduced_source_pulse: alpha 0.8 constante
- Copy: 
- Aceptación: En imagen estática se identifican entrada, motor y dirección de sus puertos. Al pasar el fluido por un cruce se sigue el canal correcto. Cuenta y resultado corresponden exactamente al estado de simulación.
- Referencias: ui_audit/source_review/current_1410/jetflow_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No inventar flechas que revelen solución: sólo mostrar orientación de los puertos ya visibles. No alterar colores funcionales, caudal, cronómetro ni resultado. Las aspas no deben transmitir un estado de victoria antes de exitWon.

## [VIS-FLOW-03] P2 · active_proposal · Dirección visual interna
**Cola de piezas y estados del HUD**
- Actual: Archivo: ui_audit/source_review/current_1410/jetflow_canonical.html
Líneas: 1265–1312
Funciones: drawHud
drawPieceIcon
Selectores: 
Valores literales de la fuente: panel rgba(22,13,42,.88)
bar1/bar2 height6
slot actual rgba(40,18,80,.95), borde#00f2cf width2
slot futuro rgba(22,13,42,.85), borde white .08 width1
hNow font mínimo11px
- Instrucción: Ordenar el HUD en tres grupos visuales: objetivo/avance, tiempo o flujo y cola de piezas. Mantener la primera ranura de la cola claramente activa con un borde sólido cian de 2 px y rótulo legible, y las siguientes con superficie neutra; no oscurecer sus iconos tanto que se pierdan conexiones. Conservar proporciones de los iconos entre ranuras. Alinear contadores y unidades; usar números tabulares y texto mínimo de 12 px cuando el espacio lo permita, reubicando el grupo antes de achicarlo. El botón de acelerar debe tener un estado desactivado reconocible por borde/ícono y no sólo por texto gris.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- panels: #160D2A a 0.94, borde #514466 a 0.6,1 px
- current_slot_border: #00F2CF,2 px
- future_icon_alpha: 0.95
- labels: 12 px mínimo, tabular-nums para valores
- disabled_action: borde #665B7D a 0.65,1 px; icono #8D83A5
- Copy: 
- Aceptación: El jugador identifica cuál pieza se coloca ahora y cuáles vienen después sin interpretar color solamente. Los valores de tramos y flujo no se confunden. Una pieza cruzada conserva orientación en cola y tablero.
- Referencias: ui_audit/source_review/current_1410/jetflow_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No reordenar la cola ni aparentar que se puede elegir cualquier pieza. No transformar tiempo de espera en porcentaje de avance del objetivo. Preservar acciones y coste/efecto real de acelerar, así como ES/EN.

## [VIS-FLOW-04] P2 · active_proposal · Dirección visual interna
**Movimiento decorativo subordinado al flujo**
- Actual: Archivo: ui_audit/source_review/current_1410/jetflow_canonical.html
Líneas: 1217–1237; 1291–1292
Funciones: drawBoard
drawHud
Selectores: 
Valores literales de la fuente: LED on=sin(T*3+x*2+y)>0
pieza recién colocada escala hasta1.12 durante.22s
origen pulso5/14
barra flow animada sólo !reduceMotion
- Instrucción: Aplicar la reducción de movimiento ya usada en la barra de flujo a LEDs, pulso del origen, giro ornamental del motor y rebote de colocación. En modo reducido, usar LEDs estables, borde de origen constante y confirmación de pieza mediante un cambio de borde de 150 ms sin escala. En modo normal, conservar una sola respuesta breve al colocar, sin sumar parpadeo de toda la celda. El frente real del fluido debe seguir avanzando porque transmite la simulación; reducir sólo adornos, no congelar la información útil.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- reduced_LED: estado estático; sin sinusoide
- placement_border_feedback: 150 ms,2 px, cian; sin escala en reducido
- normal_scale_max: 1.08
- normal_scale_duration: 160 ms
- fluid_front: movimiento informativo intacto
- Copy: 
- Aceptación: Con reduceMotion, no titilan LEDs ni rebota la pieza; se sigue viendo el avance real del fluido y se reconoce victoria/derrame. Con movimiento normal, colocar repetidamente no produce flashes acumulados.
- Referencias: ui_audit/source_review/current_1410/jetflow_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: La simulación y los tiempos no cambian. No hacer que un motor detenido por preferencia de movimiento signifique fallo: acompañar siempre con el estado visual correcto. No declarar inexistente el soporte ya presente.

## [VIS-FLOW-05] P2 · active_proposal · Dirección visual interna
**Cuenta y astronauta sin ocultar la colocación**
- Actual: Archivo: ui_audit/source_review/current_1410/jetflow_canonical.html
Líneas: 1120–1135; 1313–1351; 930–933
Funciones: render
drawGuide
astroSpot
Selectores: 
Valores literales de la fuente: ghost alpha=.42
cursor replace #fdd835; ok #00f2cf; invalid #ff4d6d; lineWidth2.5
astroDraw(...,V.cs*.74,T) después del cursor
cuenta centrada V.ox+V.bw/2,V.oy+V.bh/2; font V.cs*2*(1+(1-fr)*.15)
astroSpot offset lateral V.cs*.62
Capturas inspeccionadas: ui_audit/evidence/flow-pass1-gameplay.jpg (1180×757; inspeccionada: cuenta 1 grande sobre origen y tablero, guía y cursor de reemplazo)
ui_audit/evidence/flow-pass2-gameplay.jpg (1180×757; inspeccionada: juntas de celdas oscuras, cursor amarillo sobre pieza y astronauta adyacente, flujo acelerado)
Observación visual en las capturas: En pass1, el numeral 1 blanco ocupa aproximadamente dos celdas de alto y se superpone al origen y a la ruta; la guía cian y el cursor amarillo ya comparten ese entorno. En pass2, el astronauta está pegado al lateral de la pieza previsualizada. No se afirma que bloquee clics o que oculte siempre un puerto.
- Instrucción: Eliminar la cuenta gigante centrada durante el período en que el tablero ya permite colocar piezas. Mantener el conteo en el HUD existente «Flujo en {n} s», con un realce breve de borde al cambiar de segundo; no duplicar el número sobre el reactor. Conservar claramente diferentes el fantasma de colocación, el marco de reemplazo y la guía del tutorial: el fantasma mantiene la geometría de la pieza a 0,42 de opacidad; el marco amarillo sigue significando reemplazo y el cian colocación válida. Dibujar el astronauta como acompañamiento secundario: si su dibujo se superpone a la casilla del cursor, puertos activos o etiqueta de guía, reducir sólo su escala de render hasta 0,55*V.cs o usar una traslación visual lateral/clipping que mantenga despejados esos elementos. No modificar astroGo/astroSpot ni tiempos de llegada como atajo: el ajuste debe ser exclusivamente de dibujo y no de simulación. Dibujar el contorno de cursor al final para que siga legible; la guía no debe quedar por debajo del astronauta.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- in_board_giant_count: no dibujar durante fase interactiva count
- hud_count: 20 px, peso 800, tabular-nums; realce borde 150 ms
- ghost_alpha: 0.42
- astro_draw_scale_when_overlap: 0.55*V.cs
- cursor_corner_stroke: 2.5 px; dibujar por encima de avatar; colores actuales
- Copy: 
- Aceptación: Recrear ambas capturas: en count=1 el origen y la ruta quedan completamente legibles y el HUD sigue mostrando 1 s; al llegar a cero el flujo comienza al mismo instante. Probar cursor en todas las esquinas y junto a origen, motor y una curva: astronauta, guía y preview no ocultan puertos ni el marco de estado. Colocar/reemplazar produce los mismos tiempos, coste, pieza y recorrido que antes.
- Referencias: ui_audit/source_review/current_1410/jetflow_canonical.html
- Notas: Saturación visual identificada en capturas inspeccionadas; propuesta de diseño apoyada en la fuente. No equivale a un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Mantener exactamente G.cd, G.cdMax, fase count/flow, tiempo disponible para colocar, orden de cola, penalización por reemplazo, orientación de curvas, rutas, puertos y llegada/colocación lógica. Amarillo no significa error; rojo sigue siendo inválido. No tratar al astronauta como un bloqueo táctil observado.

# Copys ES/EN aplicables
- COPY-common-resume [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-FRENTES-01, PLAY-BALIZAS-04, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Reanudar partida» | en: «Resume game» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Continuar', 'Seguir']
- COPY-common-menu [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-TELEMETRIA-05, PLAY-PORTADA-06, PLAY-FRENTES-02] es-AR: «Volver al menú» | en: «Back to menu» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-start [SRC-F01, SRC-F02] es-AR: «Comenzar circuito» | en: «Start circuit» | contexto: Repetir si ok=true; Reintentar si ok=false. Mensajes de causa separados: conectar sólo a la causa real. Confirmación sólo si se descarta intento con movimientos; common-cancel conserva estado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-retry [SRC-F01, SRC-F02] es-AR: «Reintentar circuito» | en: «Retry circuit» | contexto: Repetir si ok=true; Reintentar si ok=false. Mensajes de causa separados: conectar sólo a la causa real. Confirmación sólo si se descarta intento con movimientos; common-cancel conserva estado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-replay [SRC-F01, SRC-F02] es-AR: «Repetir circuito» | en: «Replay circuit» | contexto: Repetir si ok=true; Reintentar si ok=false. Mensajes de causa separados: conectar sólo a la causa real. Confirmación sólo si se descarta intento con movimientos; common-cancel conserva estado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-restart [SRC-F01, SRC-F02] es-AR: «Reiniciar circuito» | en: «Restart circuit» | contexto: Repetir si ok=true; Reintentar si ok=false. Mensajes de causa separados: conectar sólo a la causa real. Confirmación sólo si se descarta intento con movimientos; common-cancel conserva estado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-levels [SRC-F01, SRC-F02] es-AR: «Ver niveles» | en: «View levels» | contexto: Repetir si ok=true; Reintentar si ok=false. Mensajes de causa separados: conectar sólo a la causa real. Confirmación sólo si se descarta intento con movimientos; common-cancel conserva estado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-too-short [SRC-F01, SRC-F02] es-AR: «Faltan tramos para llegar al objetivo.» | en: «More sections are needed to reach the target.» | contexto: Repetir si ok=true; Reintentar si ok=false. Mensajes de causa separados: conectar sólo a la causa real. Confirmación sólo si se descarta intento con movimientos; common-cancel conserva estado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['¡Llegó al motor antes de tiempo!']
- COPY-flow-leak [SRC-F01, SRC-F02] es-AR: «El plasma se escapó del circuito.» | en: «Plasma leaked out of the circuit.» | contexto: Repetir si ok=true; Reintentar si ok=false. Mensajes de causa separados: conectar sólo a la causa real. Confirmación sólo si se descarta intento con movimientos; common-cancel conserva estado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-no-engine [SRC-F01, SRC-F02] es-AR: «El plasma no llegó al motor.» | en: «Plasma did not reach the engine.» | contexto: Repetir si ok=true; Reintentar si ok=false. Mensajes de causa separados: conectar sólo a la causa real. Confirmación sólo si se descarta intento con movimientos; common-cancel conserva estado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-early-engine [SRC-F01, SRC-F02] es-AR: «El plasma llegó al motor antes de completar los tramos requeridos.» | en: «Plasma reached the engine before the required sections were completed.» | contexto: Repetir si ok=true; Reintentar si ok=false. Mensajes de causa separados: conectar sólo a la causa real. Confirmación sólo si se descarta intento con movimientos; common-cancel conserva estado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-restart-title [SRC-F01, SRC-F02] es-AR: «¿Reiniciar el circuito?» | en: «Restart the circuit?» | contexto: Repetir si ok=true; Reintentar si ok=false. Mensajes de causa separados: conectar sólo a la causa real. Confirmación sólo si se descarta intento con movimientos; common-cancel conserva estado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-discard [SRC-F01, SRC-F02] es-AR: «Vas a perder los cambios de este intento.» | en: «You’ll lose the changes made in this attempt.» | contexto: Repetir si ok=true; Reintentar si ok=false. Mensajes de causa separados: conectar sólo a la causa real. Confirmación sólo si se descarta intento con movimientos; common-cancel conserva estado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-delete-title [PLAY-FLOW-01] es-AR: «¿Borrar todo el progreso de JET//Flow?» | en: «Delete all progress in JET//Flow?» | contexto: Confirmación de progreso, no reinicio de circuito. Si borrado afecta más datos, actualizar enumeración antes de implementar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-delete-body [PLAY-FLOW-01] es-AR: «Se eliminarán tus circuitos completados y estrellas guardadas. Esta acción no se puede deshacer.» | en: «Your completed circuits and saved stars will be deleted. This cannot be undone.» | contexto: Confirmación de progreso, no reinicio de circuito. Si borrado afecta más datos, actualizar enumeración antes de implementar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-release [PLAY-FLOW-02, PLAY-FLOW-05, RSP-FLOW-02] es-AR: «Liberar plasma» | en: «Release plasma» | contexto: Botón DOM comparte estado/acción con canvas. Ayuda de duplicación sólo si regla vigente corresponde; no cambiar multiplicador para ajustarlo al texto. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-speed-up [PLAY-FLOW-02, PLAY-FLOW-05, RSP-FLOW-02] es-AR: «Acelerar plasma» | en: «Speed up plasma» | contexto: Botón DOM comparte estado/acción con canvas. Ayuda de duplicación sólo si regla vigente corresponde; no cambiar multiplicador para ajustarlo al texto. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-plasma-help [PLAY-FLOW-02, PLAY-FLOW-05, RSP-FLOW-02] es-AR: «Cuando el recorrido esté listo, tocá «Liberar plasma». Después podés acelerar el flujo para duplicar los puntos por tramo.» | en: «When the route is ready, select “Release plasma”. You can then speed up the flow to double the points per section.» | contexto: Botón DOM comparte estado/acción con canvas. Ayuda de duplicación sólo si regla vigente corresponde; no cambiar multiplicador para ajustarlo al texto. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-pause [PLAY-FLOW-02, PLAY-FLOW-05, RSP-FLOW-02] es-AR: «Pausar» | en: «Pause» | contexto: Botón DOM comparte estado/acción con canvas. Ayuda de duplicación sólo si regla vigente corresponde; no cambiar multiplicador para ajustarlo al texto. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-current-piece [PLAY-FLOW-03, PLAY-FLOW-04] es-AR: «Pieza actual» | en: «Current piece» | contexto: No dar instrucción de rotar piezas inrotables. Revisar fuga conserva tablero congelado; no reanuda la partida. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-next-piece [PLAY-FLOW-03, PLAY-FLOW-04] es-AR: «Próxima pieza» | en: «Next piece» | contexto: No dar instrucción de rotar piezas inrotables. Revisar fuga conserva tablero congelado; no reanuda la partida. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-connect [PLAY-FLOW-03, PLAY-FLOW-04] es-AR: «Conectá estas dos salidas.» | en: «Connect these two exits.» | contexto: No dar instrucción de rotar piezas inrotables. Revisar fuga conserva tablero congelado; no reanuda la partida. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-inspect-leak [PLAY-FLOW-03, PLAY-FLOW-04] es-AR: «Revisar la fuga» | en: «Inspect the leak» | contexto: No dar instrucción de rotar piezas inrotables. Revisar fuga conserva tablero congelado; no reanuda la partida. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-missing-sections [PLAY-FLOW-03, PLAY-FLOW-04] es-AR: «Faltaron {n} tramos para completar el objetivo.» | en: «You needed {n} more sections to reach the target.» | contexto: No dar instrucción de rotar piezas inrotables. Revisar fuga conserva tablero congelado; no reanuda la partida. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-flow-back-result [PLAY-FLOW-03, PLAY-FLOW-04] es-AR: «Volver al resultado» | en: «Back to results» | contexto: No dar instrucción de rotar piezas inrotables. Revisar fuga conserva tablero congelado; no reanuda la partida. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-flow-one-missing-section [PLAY-FLOW-04] es-AR: «Faltó 1 tramo para completar el objetivo.» | en: «You needed 1 more section to reach the target.» | contexto: Variante n=1 de flow-missing-sections. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
