# box: 17 registros del catálogo, 32 copys

## [RSP-BOX-01] P1 · active · Responsive y controles
**Los tres modales cerrados deben estar realmente cerrados**
- Actual: P1 · alta · confirmado por fuente. `current_1410/jetbox.html:160–163` deja `.modal-bg{display:flex;opacity:0;pointer-events:none}`; 260–274 contienen botones activos; `openM/closeM` (800–801) sólo cambian `.show`. No hay inert, ocultación accesible ni transferencia de foco.
- Instrucción: Usar `hidden` en `#mHelp,#mWin,#mLevels` cerrados, con `[hidden]{display:none!important}`; al abrir uno, cerrar los demás y poner `#app.inert=true`. La `.modal` debe llevar `role=dialog,aria-modal=true,aria-labelledby` del título. Guardar trigger, enfocar primer control relevante, gestionar Tab/Shift+Tab dentro y restaurar trigger al cerrar. Sustituir también cierres directos de clase en 871–880 por el mismo `closeM`. No dejar un segundo camino de cierre sin limpiar inert.
- Copy: 
- Aceptación: En partida, Tab no alcanza ningún botón de ayuda/victoria/niveles cerrado; en modal, no alcanza fondo; cerrar vuelve al disparador. Abrir y cerrar los tres dos veces, incluida victoria.
- Referencias: Archivo: current_1410/jetbox.html
Líneas: 160–163
Archivo: current_1410/jetbox.html
Líneas: 160–163,260–274,800–801,871–879
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-BOX-02] P1 · active · Responsive y controles
**No robar flechas a los sliders ni Enter a las opciones de victoria**
- Actual: P1 · alta · confirmado por fuente. `current_1410/jetbox.html:876–884` procesa flechas siempre fuera de modal (incluidos inputs del popover audio). 880 convierte cualquier Enter/Espacio en Siguiente mientras `mWin.show`, aunque foco esté en Repetir/Niveles.
- Instrucción: Excluir botones/enlaces/inputs/select/textarea/contenteditable del controlador de movimiento. En victoria, permitir atajo N sólo fuera de editable; Enter/Espacio sólo deben activar su botón enfocado. Si se conserva avance rápido desde body/canvas, comprobar explícitamente ese target antes de `preventDefault`.
- Copy: 
- Aceptación: Slider audio con flechas cambia volumen y no mueve astronauta. En victoria Tab→Repetir→Enter repite, Tab→Niveles→Espacio abre niveles, Tab→Siguiente→Enter avanza exactamente una vez.
- Referencias: Archivo: current_1410/jetbox.html
Líneas: 876–884
Archivo: current_1410/jetbox.html
Líneas: 876–884
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [PLAY-BOX-01] P2 · active · Prueba interactiva y propuestas
**Explicar Par y Mov. sin jerga**
- Actual: El HUD usa MOV. y PAR; la ayuda indica terminar en el par sin definirlo. El resultado muestra ¡Perfecto,en el par!.
- Instrucción: Usar «Movimientos» para el contador y «Objetivo» para el par. Mostrar «Objetivo: {par} movimientos», con el objetivo real del nivel, y explicar que cada paso y cada empuje cuentan como un movimiento. Incluir los criterios de estrellas. «Objetivo» designa aquí el número de movimientos, no una casilla del tablero; no cambiar el par ni los umbrales para adaptarlos al texto.
- Copy: Movimientos
Objetivo: {par} movimientos
Completá el nivel en {par} movimientos o menos para conseguir 3 estrellas.
¡Objetivo perfecto!
- Aceptación: Un jugador nuevo puede distinguir movimientos de empujes y entender el objetivo sin conocer el término par. La plantilla usa el objetivo del nivel vigente; el singular se aplica cuando corresponde, sin modificar el valor ni el criterio de estrellas.
- Referencias: evidence/box-pass2-gameplay.jpg
evidence/box-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T14:44:00Z/2026-10-22T14:48:00Z

## [PLAY-BOX-02] P2 · active · Prueba interactiva y propuestas
**Agrupar controles junto al tablero**
- Actual: A 1180×757, el HUD queda arriba a la izquierda, la ayuda a la derecha y Deshacer/Reiniciar abajo a la izquierda; grandes áreas vacías separan los controles del tablero.
- Instrucción: Crear una franja compacta con nivel, objetivo y contadores, y una barra de acciones alineada debajo del tablero. Mantener el mapa íntegro y adaptar la escala a cada nivel, sin ubicar controles mediante coordenadas fijas del viewport.
- Copy: Deshacer movimiento
Reiniciar nivel
Ver niveles
- Aceptación: En los niveles 1 y 2, se identifican las acciones sin recorrer tres extremos de la pantalla; ningún control se superpone a las celdas.
- Referencias: evidence/box-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T14:44:00Z/2026-10-22T14:48:00Z

## [PLAY-BOX-03] P2 · active · Prueba interactiva y propuestas
**Corregir la exposición de superposiciones y tablero a tecnologías de asistencia**
- Actual: El árbol de accesibilidad expone ayuda, victoria y niveles a la vez, aunque sólo una pantalla es visible. El tablero no tiene una representación de celdas y contenedores.
- Instrucción: Ocultar las superposiciones inactivas mediante hidden/inert efectivos y situar el foco en la activa. Representar jugador, cajas, metas y paredes con nombres de posición y estado de movimiento.
- Copy: Contenedor en la plataforma
Movimiento bloqueado
Nivel {n} completado
- Aceptación: El lector de pantalla no recorre controles de modales invisibles. Con teclado y lector se pueden entender la posición y el resultado sin depender de la imagen.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:44:00Z/2026-10-22T14:48:00Z

## [PLAY-BOX-04] P2 · active · Prueba interactiva y propuestas
**Hacer legible y explícita la grilla de niveles**
- Actual: Los 57 niveles bloqueados tienen el número, el mapa y el candado casi invisibles. En el árbol de accesibilidad, los botones dicen bloqueado pero no exponen el estado disabled.
- Instrucción: Distinguir los estados disponible, completado y bloqueado sin reducir toda la tarjeta a una opacidad mínima. Mantener legibles el número y la condición de desbloqueo. Usar disabled o aria-disabled según el comportamiento real, con una explicación consultable.
- Copy: Completá el nivel anterior para desbloquearlo.
Nivel {n} disponible
- Aceptación: En el estado de prueba, se identifica el nivel 3 como disponible y el nivel 4 como bloqueado. El teclado no inicia niveles bloqueados. Conservar miniaturas del mapa real de cada nivel.
- Referencias: evidence/box-levels.jpg
- Notas: Ventana de observación: 2026-10-22T14:44:00Z/2026-10-22T14:48:00Z

## [RSP-AUDIO-01] P2 · active · Responsive y controles
**El popover de audio no debe borrar foco ni mentir sobre apertura**
- Actual: P2 · alta · confirmado por fuente. `current_1410/astro.html:330–335`, `current_1410/jetbox.html:386–391`, `current_1410/escudos.html:268–273` usan `btn.blur()` al abrir, `input.blur()` al cambiar y Escape/outside-click sólo quitan `.open`, dejando `aria-expanded` sin sincronizar.
- Instrucción: Extraer `setAudioOpen(open,{restoreFocus})` que cambie clase+aria-expanded juntos; al abrir por teclado, enfocar primer checkbox; al cerrar con Escape restaurar foco al botón; al clic exterior no robar foco al destino. Eliminar blur forzado en checkbox/range. Mantener flechas nativas de sliders y eventos separados para cada input; mantener hitboxes no superpuestos. Si role=dialog se conserva, nombre accesible y foco deben corresponder al panel real.
- Copy: 
- Aceptación: Abrir por Enter, Tab a volumen, pulsar varias flechas modifica volumen sin perder foco; Escape cierra y botón anuncia contraído; click exterior también actualiza aria-expanded=false.
- Referencias: Archivo: current_1410/astro.html
Líneas: 330–335
Archivo: current_1410/jetbox.html
Líneas: 386–391
Archivo: current_1410/escudos.html
Líneas: 268–273
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-BOX-03] P2 · active · Responsive y controles
**Convertir selector de nivel en botón y ampliar flechas sin aplastar las estadísticas**
- Actual: P2 · alta · confirmado por fuente. `current_1410/jetbox.html:98,110,239,863`: `.lname` es DIV clicable; flechas 34 px, bajan a 28 px por debajo de 359 px. Sólo las flechas y el botón Niveles superior admiten activación nativa.
- Instrucción: Reemplazar `.lname` por `<button type=button class=lname aria-label='Elegir nivel; nivel N de 60'>`; `.lnav button{min-width:44px;min-height:44px}` y no reducirlos a 28 px. A <=419 px poner `.lnav{flex:1 1 100%}` y `#hud{flex-wrap:wrap}`; las tres `.stat` comparten fila siguiente con `flex:1 1 0`. Usar 8 px de separación vertical. Mantener botón superior Niveles si la jerarquía lo necesita, no convertirlo en único acceso.
- Copy: 
- Aceptación: A 320 las tres áreas de interacción del selector son ≥44 px, número legible, y estadísticas no se solapan; abrir selector con Enter/Espacio funciona; canvas se recalcula a partir de altura restante.
- Referencias: Archivo: current_1410/jetbox.html
Líneas: 98,110,239,863
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-BOX-04] P2 · active · Responsive y controles
**El d-pad debe admitir click sintetizado, además de mantener pulsado**
- Actual: P2 · alta · confirmado por fuente. `current_1410/jetbox.html:914–922` registra pointerdown/up/cancel para `.dp`, pero ningún click. Son botones nativos (248–251), por lo que activación asistiva/Enter genera click sin movimiento.
- Instrucción: Extraer `moveOnce(d)` y añadir click para activaciones sin pointerdown previo. Mantener auto-repeat sólo mientras puntero presionado y cancelar al perder captura. Evitar doble movimiento con flag de secuencia de puntero, no deshabilitar el click accesible. No ocultar el d-pad sólo por recibir un evento de accesibilidad.
- Copy: 
- Aceptación: Click sintetizado en cada `.dp` mueve una casilla; tap mueve una, nunca dos; mantener repite; soltar/cancelar detiene; teclado físico continúa funcionando.
- Referencias: Archivo: current_1410/jetbox.html
Líneas: 914–922
Archivo: current_1410/jetbox.html
Líneas: 248–251,914–922
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

## [RSP-LANGUAGE-TARGETS-01] P2 · active · Responsive y controles
**El selector ES/EN nuevo debe conservar dos blancos táctiles completos, incluso en móvil compacto**
- Actual: La actualización añade segmentos ES/EN pequeños: Astro usa 32 px de alto en #stage.compact más 8 px de extensión vertical, con un total de 40 px; Box usa min-width de 29 px (25 px por debajo de 359 px) más 2 px de extensión horizontal, y el panel de audio tiene min-width de 34 px; Escudos móvil usa 32×25 px más 4×12 px de extensión, con un total de 36×37 px; Match usa min-height de 38 px sin extensión. Son tamaños verificables por CSS; no es una medición táctil ni una afirmación automática de incumplimiento normativo.
- Instrucción: Usar cada opción ES y EN como botón nativo con `min-width:44px;min-height:44px;height:auto;flex:none`, separación horizontal de 8 px y quitar los pseudoelementos de ampliación que se solapen entre opciones. Cancelar la redefinición compacta de Astro. En Box, sustituir las alturas de 40/32 px de `.seg` por `min-height:52px;height:auto;gap:8px;padding:3px`; retirar el separador `i` si comprime los botones. A <=419px, poner header en grid de columnas `minmax(0,1fr) 44px 44px` y gap de 8 px: `.bblock` en fila 1, columnas 1/3; `.ja` de sonido en fila 1, columna 3; `#segLang` en fila 2, columna 1; `#btnHelp` en fila 2, columna 2; `#btnLevels` en fila 2, columna 3; ocultar `.spacer`. No encoger el selector para que entre en una sola fila. En Escudos a <=419px, permitir `.top{flex-wrap:wrap}`, `.topnav{flex-basis:100%;justify-content:flex-start}` y ocultar el spacer del encabezado; conservar el salto de línea de las acciones. En Astro y Match, mantener el lugar actual del grupo y comprobar su nuevo alto frente al CTA/overlay. Mantener aria-pressed sincronizado y el foco en la opción elegida después del cambio de idioma.
- Copy: 
- Aceptación: En 320/360/390/768 px, ambos botones tienen rectángulos de interacción independientes de al menos 44×44 px, sin solapar entre sí ni activar otro control al tocar su borde. Repetir dentro de Ajustes/sonido y Astro compacto, ambos idiomas, teclado y texto al 200%. En Box siguen visibles HUD y tablero tras el header de 2 filas; en Escudos el título no se recorta por el grupo. Verificar render real antes de fijar alturas disponibles del canvas.
- Referencias: Archivo: current_1410/astro.html
Líneas: 172–182
Archivo: current_1410/jetbox.html
Líneas: 82–90,231–237
Archivo: current_1410/escudos.html
Líneas: 129–136,140–145
Archivo: current_1410/jetmatch_canonical.html
Líneas: 214–220
- Notas: Regla identificada en fuente con mejora de diseño propuesta; hallazgo de la actualización observada durante la auditoría; no estaba en la copia original de la fuente.

## [SRC-BX01] P2 · active_source_finding · Texto, estados y flujo
**T.es y HUD**
- Actual: Mov.; Par; Siguiente; Repetir; ¡Vamos!
- Instrucción: Par puede permanecer en tooltip si se explica Objetivo de movimientos; usar textos completos cuando espacio suficiente. Mantener distinción movimientos y empujes.
- Copy: Movimientos; Objetivo; Siguiente nivel; Repetir nivel; Comenzar nivel
- Aceptación: Un jugador nuevo entiende 3 estrellas sin conocer par; resultado identifica nivel y próximo; no cambian métricas/umbrales.
- Referencias: https://jetgames.fun/jetbox/ — current_1410/jetbox.html:446–471
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [SRC-BX02] P2 · active_source_finding · Texto, estados y flujo
**#bRestart vs tecla R**
- Actual: Pulsa otra vez para reiniciar (botón); R reinicia directamente
- Instrucción: Unificar la protección para teclado y toque o hacer ambos reversibles con Deshacer claramente disponible. R no debe saltarse una confirmación que la UI promete. No eliminar la capacidad actual de deshacer reinicio.
- Copy: Reiniciar nivel / Reiniciado. Podés deshacer para recuperar el intento.
- Aceptación: Hacer varios movimientos; reiniciar vía botón y vía R: mismo aviso/protección; Deshacer recupera cajas, jugador, movimientos y empujes.
- Referencias: https://jetgames.fun/box/ — final_revalidation/jetbox.html:448,552–556,867,884
- Notas: Inconsistencia confirmada en fuente; Revalidación final HTTP de sólo lectura 2026-10-22 16:14–16:20 UTC. Las capturas anteriores permanecen preservadas. Este revisor no jugó.

## [VIS-BOX-01] P2 · active_proposal · Dirección visual interna
**Reducir detalle ornamental según el tamaño real de casilla**
- Actual: buildStatic() usa piso alternado #1a1230/#170f2b, borde blanco alpha .045 y cuatro remaches alpha .07 por casilla; las paredes añaden tramas diagonales, paneles y biseles. Todo se dibuja independientemente de TS.
- Instrucción: Introducir dos niveles de detalle en buildStatic, sin tocar dimensiones: TS<28 conserva el relleno alternado y una junta de 1 px alpha .08, pero omite remaches, rayas diagonales y paneles pequeños; TS>=28 conserva esos detalles con alpha máximo .06. Mantener los biseles exteriores que separan muro de suelo, con cara superior clara y frente oscuro. No sumar textura a las casillas objetivo. Dejar la capa estática cacheada, no generar ruido distinto en cada frame.
- Copy: 
- Aceptación: Comparar una sala pequeña y la más densa a 320/360/390/768 px; una casilla transitable se distingue del muro sin fijarse en los remaches. DPR 1/2/3 no cambia qué celdas parecen ocupadas. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/jetbox.html
lines: 612–620,630–648
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar L.dw/L.inside ni los límites de las casillas. Conservar la lectura de paredes contiguas y la geometría de pasillos.

## [VIS-BOX-02] P2 · active_proposal · Dirección visual interna
**Meta libre y meta ocupada: añadir una diferencia de forma, no más brillo**
- Actual: drawPad() dibuja anillos cian de radios.31S/.2S, guiones animados y cuatro flechas si !occ. drawCrate() cambia el núcleo de ámbar a cian mediante k; su caja ocupa.8S.
- Instrucción: Conservar las cuatro flechas de la meta libre y convertir el anillo interior en trazo estable de 1.5 px mínimo. En la caja correctamente acoplada, añadir una pequeña marca de verificación oscura dentro del núcleo cian, sólo cuando el estado lógico ya la considere en meta; retirar la marca al salir. No reemplazar el núcleo por un icono gigante. Limitar shadowBlur de meta a min(8,.16S) y el de caja acoplada a min(10,.22S), en lugar del halo exterior de .5S. La confirmación de acople debe ser un pulso único de 160 ms, no una pulsación permanente de todo el módulo.
- Copy: 
- Aceptación: Con animación detenida y en escala de grises se distinguen suelo, meta libre, caja libre y caja en meta. Deshacer un empuje retira exactamente la confirmación visual. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/jetbox.html
lines: 661–668,672–684
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: Ámbar sigue significando caja libre y cian caja acoplada; no anticipar la marca durante la interpolación si todavía no terminó el movimiento. No alterar k ni boxes.

## [VIS-BOX-03] P2 · active_proposal · Dirección visual interna
**Dar prioridad a la silueta del módulo por encima de sus tornillos**
- Actual: drawCrate() define w/h=.8S, radio=.2S, núcleo .17S, banda central .14S, cuatro abrazaderas .03S y reflejo superior .04S. El núcleo pulsa con sin(tm*5+i*1.3).
- Instrucción: Mantener la caja de .8S y su radio; usar contorno nítido de max(1.25,.03S), sombra de contacto sólo debajo y un único reflejo superior. A TS<28 omitir abrazaderas y reflejo secundario; conservar siempre banda central y núcleo. Reducir la variación de radio del núcleo de 8% a 3% y desactivarla cuando la interfaz use movimiento reducido. No escalar el módulo al empujar: desplazarlo con la interpolación existente para que el usuario pueda seguir la celda ocupada.
- Copy: 
- Aceptación: En una fila de cajas adyacentes cada módulo conserva borde completo y núcleo legible. Un empuje rápido y su deshacer no producen aparente cambio de tamaño o una segunda caja fantasma. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/jetbox.html
lines: 672–688
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: Conservar los colores de estado y la posición exacta del centro; no modificar caja de colisión, reglas de empuje ni orden de dibujo.

## [VIS-BOX-04] P2 · active_proposal · Dirección visual interna
**Hacer coherentes miniaturas, ayuda y partida**
- Actual: thumb() rasteriza a 6 px por celda; usa pared #5a3aa8, suelo #21183a, caja amarilla #fdd835 o verde #3ddc84, mientras la partida usa módulo blanco y núcleo ámbar/cian.
- Instrucción: Compartir un pequeño token de paleta entre thumb y el renderer, conservando una versión simplificada: muro violeta, suelo oscuro, caja marfil con punto ámbar o cian, meta libre como marco cian y jugador como disco blanco con borde oscuro. A 6 px por celda usar pixel snapping y formas planas, sin glow ni degradado. Mantener la geometría completa de cada miniatura; no recortar para llenar su contenedor. Usar la misma leyenda de cuatro estados en las ilustraciones de ayuda.
- Copy: 
- Aceptación: Antes de entrar en un nivel, se pueden emparejar sus cajas y metas con las del tablero. La caja en meta no se confunde con un objetivo vacío a escala de miniatura. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/jetbox.html
lines: 832–836,661–688
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar distribución, orden, estrellas ni desbloqueo de niveles. Las miniaturas siguen describiendo el estado inicial, no una solución.

# Copys ES/EN aplicables
- COPY-common-sound-on [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Sonido activado» | en: «Sound on» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-sound-off [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Sonido desactivado» | en: «Sound off» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-mute [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Silenciar todo» | en: «Mute all» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-music [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Música» | en: «Music» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-effects [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Efectos» | en: «Sound effects» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-music-volume [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-ANTES-06, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Volumen de música» | en: «Music volume» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-effects-volume [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-ANTES-06, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Volumen de efectos» | en: «Sound effects volume» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-music-off [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Música desactivada» | en: «Music off» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-effects-off [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Efectos desactivados» | en: «Sound effects off» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-language-es [SRC-G02, RSP-LANGUAGE-TARGETS-01] es-AR: «ES» | en: «ES» | contexto: Preservar selector existente y aria-pressed; no duplicarlo ni forzar renombre. No crear traducción íntegra de juegos monolingües por este companion. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-language-en [SRC-G02, RSP-LANGUAGE-TARGETS-01] es-AR: «EN» | en: «EN» | contexto: Preservar selector existente y aria-pressed; no duplicarlo ni forzar renombre. No crear traducción íntegra de juegos monolingües por este companion. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-moves [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Movimientos» | en: «Moves» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-pushes [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Empujes» | en: «Pushes» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-goal [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Objetivo» | en: «Target» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-goal-moves [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Objetivo: {par} movimientos» | en: «Target: {par} moves» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'par', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-box-goal-help [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Completá el nivel en {par} movimientos o menos para conseguir 3 estrellas. Cada paso y cada empuje cuentan como un movimiento.» | en: «Complete the level in {par} moves or fewer to earn 3 stars. Each step and each push count as one move.» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'par', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-box-perfect [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «¡Objetivo perfecto!» | en: «Perfect result!» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-next [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Siguiente nivel» | en: «Next level» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-replay [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Repetir nivel» | en: «Replay level» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-start [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Comenzar nivel» | en: «Start level» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-restart [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Reiniciar nivel» | en: «Restart level» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Pulsa otra vez para reiniciar']
- COPY-box-undo [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Deshacer movimiento» | en: «Undo move» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-reset-notice [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Reiniciado. Podés deshacer para recuperar el intento.» | en: «Restarted. You can undo to restore your attempt.» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-levels [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Ver niveles» | en: «View levels» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-on-target [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Contenedor en la plataforma» | en: «Container on the platform» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-blocked [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Movimiento bloqueado» | en: «Move blocked» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-completed [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Nivel {n} completado» | en: «Level {n} completed» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-box-available [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Nivel {n} disponible» | en: «Level {n} available» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-box-unlock [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Completá el nivel anterior para desbloquearlo.» | en: «Complete the previous level to unlock this one.» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-choose-level [SRC-BX01, SRC-BX02, PLAY-BOX-01, PLAY-BOX-02, PLAY-BOX-03, PLAY-BOX-04, RSP-BOX-03] es-AR: «Elegir nivel; nivel {n} de 60» | en: «Choose level; level {n} of 60» | contexto: Objetivo es movimientos, no empujes. 60 niveles procede de fuente RSP-BOX-03; si cambia catálogo, usar total real. Deshacer conserva reversibilidad actual del reinicio y protección igual por botón/R. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-box-one-goal-move [SRC-BX01, PLAY-BOX-01] es-AR: «Objetivo: 1 movimiento» | en: «Target: 1 move» | contexto: Sólo si objetivo real par=1; no modificar objetivo ni umbral. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-box-one-goal-help [SRC-BX01, PLAY-BOX-01] es-AR: «Completá el nivel en 1 movimiento para conseguir 3 estrellas. Cada paso y cada empuje cuentan como un movimiento.» | en: «Complete the level in 1 move to earn 3 stars. Each step and each push count as one move.» | contexto: Sólo si objetivo real par=1; no modificar objetivo ni umbral. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
