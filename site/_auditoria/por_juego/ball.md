# ball: 22 registros del catálogo, 33 copys

## [RSP-BALL-01] P1 · active · Responsive y controles
**Restituir los insets del HUD y de los paneles intermedios**
- Actual: Existen `--st/--sb/--sl/--sr`, pero la última regla de `.hud-top,.hud-top.dim` usa `top:6px;left:6px;right:6px`, y `.active-fx` queda en `top:54px`. `#overlay.intermediate` impone `padding:28px 18px!important`, o `16px 12px!important` a poca altura, eliminando el margen inferior/lateral seguro. La excepción de `body.jb-menu` sólo corrige el superior del menú.
- Instrucción: Editar las reglas finales, no añadir otra capa de parches. HUD: `top:calc(6px + var(--st));left:calc(6px + var(--sl));right:calc(6px + var(--sr))`. Efectos: partir de `calc(58px + var(--st))` y aplicar la separación de RSP-BALL-03. Panel intermedio: `padding:calc(28px + var(--st)) calc(18px + var(--sr)) calc(28px + var(--sb)) calc(18px + var(--sl))!important`; en `max-height:600px`, sustituir únicamente las bases por `16px/12px`, conservando cada inset. Mantener el canvas a pantalla completa.
- Copy: 
- Aceptación: A 390×844 con recorte superior y a 844×390 con recorte lateral, Pausa y todos los CTA quedan fuera de los insets; se llega por scroll al último control de pausa/victoria/derrota. Sin insets, el HUD conserva sus 6 px de margen. Repetir a 320/360/390/768 de ancho.
- Referencias: Archivo: current_1410/jetball.html
Líneas: 80-83,2844,2852,2857,2915,2941,2969
- Notas: Regla identificada en fuente con riesgo inferido; Fuente idéntica byte por byte; la redefinición CSS final sigue usando top/left/right 6 px y padding intermedio sin insets.

## [RSP-BALL-04] P1 · active · Responsive y controles
**El juego no permite apuntar solamente con teclado**
- Actual: `_lastMousePos` empieza en `{x:0,y:0}` y sólo se actualiza con `mousemove`; Enter/Espacio coloca pared únicamente si `_lastMousePos.x>0`. Hay atajos de orientación/inventario, pero ninguna navegación de una celda objetivo por teclado.
- Instrucción: Añadir cursor de celda propio, inicializado en una celda válida del tablero. El canvas/una superficie DOM equivalente debe poder recibir foco (`tabindex="0"`, instrucciones asociadas). Flechas mueven el cursor una celda; H/V conservan selección de orientación; Enter/Espacio llaman al mismo `startWall(cursor.x,cursor.y,currentOrient)` que el puntero. Dibujar un contorno de cursor contrastado y publicar celda/orientación/estado en una región de estado moderada. No usar `_lastMousePos` como precondición para teclado. No capturar flechas/Enter cuando el foco está en menús, selectores, botones o inputs.
- Copy: 
- Aceptación: Abrir, elegir modo y completar una pared sin haber movido ni tocado el ratón; repetir después de pausa, reinicio, cambio de tamaño y orientación. H/V y 1/2/3 siguen funcionando; el foco de botones mantiene su activación nativa.
- Referencias: Archivo: current_1410/jetball.html
Líneas: 18200-18203,18237-18267
- Notas: Problema identificado en fuente; Fuente idéntica byte por byte; apuntado de teclado sigue dependiendo de _lastMousePos actualizado sólo por mousemove.

## [RSP-BALL-06] P1 · active · Responsive y controles
**Enter/Espacio en el desplegable de sonido arranca el juego**
- Actual: La guarda del atajo global excluye `button,a` e inputs, pero no `summary`. Con un overlay visible, Enter/Espacio sobre el resumen de sonido ejecuta `btnStart.click()` y previene el comportamiento nativo de apertura.
- Instrucción: Antes del atajo de CTA, devolver sin interceptar si `e.target.closest('button,a,input,select,textarea,summary,[contenteditable="true"],[role="button"],[role="switch"],[role="slider"]')`. Disparar el CTA global solamente cuando `document.activeElement` sea `document.body` o un fondo explícitamente designado, no cualquier nodo no contemplado. Mantener activación nativa de `summary` y el foco visible existente.
- Copy: 
- Aceptación: Con Tab llegar a Sonido en menú y pausa; Enter y Espacio abren/cierran el details y NO arrancan/reanudan una partida. Flechas ajustan el slider. Enter desde el fondo designado conserva el atajo de CTA. Repetir en los cuatro anchos.
- Referencias: Archivo: current_1410/jetball.html
Líneas: 2879-2882,3233-3234,18237-18247
- Notas: Problema identificado en fuente; Fuente idéntica byte por byte; atajo Enter/Espacio no excluye SUMMARY, ejecuta CTA con overlay visible.

## [PLAY-BALL-01] P2 · active · Prueba interactiva y propuestas
**Inicio que no exija desplazamiento excesivo para jugar**
- Actual: La columna mide aproximadamente 400 px en un viewport de 1180×757. El CTA JUGAR y el audio quedan bastante abajo; pulsar audio desplazó la página y dejó el título y la descripción fuera de la vista.
- Instrucción: En escritorio, usar un panel de ancho máximo de 960 px, con resumen/tutorial a la izquierda y configuración/CTA a la derecha. En móvil, conservar una columna y un CTA visible que no tape contenido. Mover los ajustes secundarios a una sección desplegable. Mantener título, modo, dificultad y Jugar en la primera vista de una pantalla estándar.
- Copy: 
- Aceptación: A 1180×757 se ven modo, dificultad y Jugar. A 390×844 se puede iniciar sin recorrer los ajustes secundarios.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-BALL-02] P2 · active · Prueba interactiva y propuestas
**Enseñar gesto de barrera**
- Actual: `Lanza barreras horizontales o verticales...` no explica arrastre ni cómo elegir orientación. Durante juego el aviso central explica sólo pausa.
- Instrucción: tutorial breve sobre tablero antes del primer intento, con ejemplo animado opcional y `Entendido`. Texto `Arrastrá horizontal o verticalmente para construir una barrera. Evitá que una bola la toque antes de terminar.` Añadir alternativa clic si corresponde al comportamiento real; no inventar atajo sin implementarlo.
- Copy: Arrastrá horizontal o verticalmente para construir una barrera. Evitá que una bola la toque antes de terminar.
Entendido
- Aceptación: Se puede completar el primer gesto sin tener que deducirlo. El tutorial puede descartarse y no se repite en cada reintento.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-BALL-03] P2 · active · Prueba interactiva y propuestas
**HUD con etiquetas**
- Actual: fila diminuta `CLÁSICO · N01 · ♥♥♥♥♥ ·58%/75% ·16,775` sin etiqueta de puntos/captura.
- Instrucción: Separar el HUD en grupos con plantillas dinámicas: «Nivel {n}», «Vidas: {n}», «Capturado: {pct}% · Meta: {target}%» y «Puntos: {puntos}». Usar una tipografía de al menos 14 px y contraste suficiente. Los valores proceden del estado real de la partida y el puntaje se formatea según el idioma. Mantener la etiqueta de vidas aunque cambie su cantidad; al llegar a 6 vidas, no sustituirla abruptamente por un número e icono sin explicación.
- Copy: Nivel {n}
Vidas: {n}
Capturado: {pct}% · Meta: {target}%
Puntos: {puntos}
- Aceptación: El significado de cada valor es visible y está disponible para el lector de pantalla. A 360 px, los grupos no se superponen. Cambiar los valores de prueba actualiza cada plantilla sin números fijados en el texto.
- Referencias: evidence/ball-pass1-play.jpg
- Notas: Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-BALL-04] P2 · active · Prueba interactiva y propuestas
**Unificar dificultad**
- Actual: Se eligió el botón `EXPERTO`; el aviso durante la partida dice `DIFICULTAD: DIFÍCIL`.
- Instrucción: Usar «Experto» en el botón, el aviso transitorio, la pausa y los resultados. Si el estado corresponde realmente a otra dificultad, corregir el mapeo antes de renombrar.
- Copy: Experto
- Aceptación: La misma dificultad se llama igual en cada estado de la interfaz.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-BALL-05] P2 · active · Prueba interactiva y propuestas
**Plurales, abreviaturas e idioma**
- Actual: `1 MODOS JUGADOS`, `MEJOR · CLA`, `MEJOR · SUP`, HUD `BEST L01` en español.
- Instrucción: Usar «1 modo jugado» en singular y «{n} modos jugados» para los demás valores; «Récord · Clásico» y «Récord · Supervivencia» en lugar de abreviaturas ambiguas; y «Mejor nivel: {n}» con el nivel real guardado.
- Copy: 1 modo jugado
{n} modos jugados
Récord · Clásico
Récord · Supervivencia
Mejor nivel: {n}
- Aceptación: Probar singular/plural con 0, 1 y 2. En español no aparece BEST ni una abreviatura críptica para nombrar el modo o el récord.
- Referencias: evidence/ball-pass2.jpg
- Notas: Textos actuales: `1 MODOS JUGADOS`, `MEJOR · CLA`, `MEJOR · SUP` y `BEST L01` en el HUD en español.
La captura de resultados guardada documenta `MEJOR · SUP`. El error de singular y `BEST L01` constan en las observaciones del árbol de accesibilidad, no en esa captura.
Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-BALL-06] P2 · active · Prueba interactiva y propuestas
**Avance de victoria bajo control del jugador**
- Actual: Al ganar el nivel 1 aparece `NIVEL2 EN6SEGUNDOS`; el juego pasa automáticamente al siguiente nivel sin un botón visible para cancelar o volver al menú.
- Instrucción: CTA principal Siguiente nivel; destino Nivel {n} como texto secundario; Volver al menú como acción secundaria. Avance automático desactivado por defecto, opt-in persistente y cancelable. Mantener estadísticas hasta una acción explícita.
- Copy: Siguiente nivel
Nivel {n}
Volver al menú
Avance automático
Detener avance
- Aceptación: Con el avance automático desactivado, no comienza actividad mientras el usuario lee el resumen o ajusta el audio. Si el usuario lo activa expresamente, se respeta la cuenta anunciada y «Detener avance» la cancela. Mover el foco o usar un lector de pantalla no dispara una partida por sí solo.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-BALL-07] P2 · active · Prueba interactiva y propuestas
**Primer registro no es récord competitivo**
- Actual: El primer intento en Supervivencia terminó con 0 puntos en el nivel 1 y celebra `¡NUEVO RÉCORD!` con `ESTA PARTIDA01`/`MEJOR·SUP01`.
- Instrucción: Distinguir el primer resultado de una superación real. Mostrar «Primer resultado guardado» si no había registro; usar «¡Nuevo récord!» sólo cuando se mejore la métrica explicada. Etiquetar el nivel con «Nivel alcanzado: {n}», calculado desde la partida, en vez de un número aislado.
- Copy: Primer resultado guardado
¡Nuevo récord!
Nivel alcanzado: {n}
- Aceptación: Perder al inicio con 0 puntos no produce una celebración ambigua. Explicar si el récord se calcula por nivel y no por puntos.
- Referencias: evidence/ball-pass2.jpg
- Notas: Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-BALL-08] P2 · active · Prueba interactiva y propuestas
**Explicar las condiciones de la continuación con vidas**
- Actual: El CTA dominante es `CONTINUAR (+3VIDAS)`, sin regla, coste o límite visibles.
- Instrucción: Antes de activar la continuación, explicitar su coste y su límite reales. Usar «Continuar con {vidas} vidas», con la cantidad que otorgue la regla vigente; la observación fue de 3 vidas. Si es gratuita y sólo se permite una por partida, añadir «Una continuación gratuita por partida» únicamente tras verificarlo. Si es ilimitada, indicarlo y aclarar su efecto sobre el récord. No modificar la cantidad de vidas ni la regla para adaptarlas al texto.
- Copy: Continuar con {vidas} vidas
Una continuación gratuita por partida
- Aceptación: El usuario conoce el efecto antes de pulsar el botón. La continuación no contradice sin explicación la regla de Supervivencia de 1 vida; verificar ambas reglas antes de cerrar el texto.
- Referencias: evidence/ball-pass2.jpg
- Notas: El texto de coste y límite es condicional: verificar las reglas reales del producto. No afirmar que existe una única continuación gratuita si no es cierto. Las 3 vidas son el valor observado; la plantilla debe mostrar la cantidad que realmente conceda la continuación.
Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-BALL-09] P2 · active · Prueba interactiva y propuestas
**Poderes vacíos explicados**
- Actual: En pausa hay 3 botones deshabilitados, CONGELAR/CÁMARA LENTA/ESCUDO, con cantidad 0, pero sólo se indica `Elegir un poder lo activa y reanuda la partida.`
- Instrucción: Cuando el modo permite poderes y el inventario está vacío: Todavía no tenés poderes. Juntalos durante la partida. En Zen no ofrecer recolección de poderes: ocultar el inventario vacío o explicar Este modo no usa poderes. Documentar efecto/duración por texto accesible y no anunciar acciones imposibles.
- Copy: Todavía no tenés poderes. Juntalos durante la partida.
Este modo no usa poderes.
- Aceptación: Los controles deshabilitados explican por qué no están disponibles y, cuando el modo admite poderes, cómo obtenerlos. Zen no anuncia una recolección que no existe.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [RSP-BALL-02] P2 · active · Responsive y controles
**Los poderes utilizables no deben ser chips de 32 px sin nombre visible**
- Actual: `.pw-btn` tiene `min-height:32px`, sin ancho mínimo ni ampliación del área; en ≤700 px se oculta todo `span` excepto el icono. Se conservan `aria-label`, un acierto que no hay que quitar. La reparación de `.inv-slot` no modifica estos botones: son componentes distintos.
- Instrucción: Dar a `.pw-btn` `min-width:44px;min-height:44px` como mínimo de producto, y no ocultar su nombre sólo por ancho. Para ≤700 px, convertir `#inventoryReadout` en un grid de tres columnas `repeat(3,minmax(0,1fr))`, ancho `min(360px,calc(100% - 16px - var(--sl) - var(--sr)))`, gap 6 px; botones de mínimo 56 px, icono+cantidad en primera línea y nombre de 11–12 px en segunda, `white-space:normal;line-height:1.2;min-width:0`. Conservar las teclas 1/2/3 en escritorio y los nombres accesibles actuales. Evitar que el tap de un poder llegue al canvas.
- Copy: 
- Aceptación: Con los tres poderes guardados, los tres nombres/cantidades son legibles y tocables a 320/360/390 px sin desbordamiento; a 768 px mantienen el layout amplio. Cada pulsación consume una sola unidad; ningún tap crea una pared.
- Referencias: Archivo: current_1410/jetball.html
Líneas: 2889-2896,12247-12258
- Notas: Problema identificado en fuente; Fuente idéntica byte por byte; .pw-btn mantiene min-height32 px y oculta nombres ≤700 px.

## [RSP-BALL-03] P2 · active · Responsive y controles
**Separar los efectos activos de los poderes guardados**
- Actual: Efectos activos se anclan a la izquierda en y=54; poderes guardados se centran en y=50+inset. En anchos estrechos, con tres poderes guardados y uno activo/combo, ambos ocupan la misma franja; `z-index:30` del inventario supera el 9 de efectos.
- Instrucción: Usar una sola distribución vertical de información secundaria. Mantener inventario en `top:calc(58px + var(--st))`; medir su altura con `ResizeObserver` y publicar `--powerbar-height` (0 cuando no tenga botones). Posicionar `.active-fx` en `top:calc(58px + var(--st) + var(--powerbar-height,0px) + 8px)`. Limitar ambos a los márgenes seguros horizontales. No elevar z-index para esconder uno bajo el otro.
- Copy: 
- Aceptación: A 320/360/390/768 px, combinar CONGELADO, LENTO, ESCUDO y combo con 1/2/3 poderes guardados: rectángulos de estado e inventario no se intersectan; al consumir el último poder no queda altura residual incorrecta.
- Referencias: Archivo: current_1410/jetball.html
Líneas: 579-604,2852,2889,12247-12258,12275-12290
- Notas: Regla identificada en fuente con riesgo inferido; Fuente idéntica byte por byte; efectos/poderes comparten la misma franja vertical. Colisión sigue siendo riesgo geométrico, no una reproducción interactiva.

## [RSP-BALL-05] P2 · active · Responsive y controles
**No reducir etiquetas de modos hasta 7,5 px**
- Actual: `fitModePills()` puede asignar un tamaño de 7,5 px; `.mode-pill span` fuerza una línea y la píldora recorta overflow. El grid cambia a cuatro columnas desde 560 px, aun con tarjeta de ancho máximo mucho menor que el viewport.
- Instrucción: Eliminar la reducción dinámica y sus estilos inline. Usar nombre a 12 px, `line-height:1.25;white-space:normal;overflow-wrap:anywhere`; botón `min-height:48px;padding:8px 6px`. Mantener dos columnas estrechas y cuatro sólo cuando el ancho real de la tarjeta permita cuatro columnas de al menos 110 px (container query, o grid `repeat(auto-fit,minmax(110px,1fr))`). No recortar el texto para mantener una altura fija.
- Copy: 
- Aceptación: A 320/360/390/768 px, todas las etiquetas del selector disponibles en ES/EN/PT/FR/DE y una traducción larga siguen completas, nunca inferiores a 12 px, máximo de dos líneas cuando alcance y sin scroll horizontal. No cambia el orden de modos al seleccionarlos.
- Referencias: Archivo: current_1410/jetball.html
Líneas: 1670-1679,2475-2492,11174-11195
- Notas: Problema identificado en fuente; Fuente idéntica byte por byte; fitModePills conserva suelo de 7.5 px.

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

## [SRC-B01] P2 · active_source_finding · Texto, estados y flujo
**startVictoryCountdown / #btnStart**
- Actual: El comentario documenta “▶ NIVEL 3 EN 5 SEGUNDOS”; la función concatena etiqueta base + “EN {N} SEGUNDOS”. La cuenta real empieza en 6.
- Instrucción: Separar el nombre de la acción del temporizador: botón principal «Siguiente nivel» y destino «Nivel {n}» como texto secundario. Mantener «Avance automático» desactivado por defecto; su activación debe ser explícita y persistente. Si se activa, mostrar «Avance automático en {s} s» y el control visible «Detener avance», accesible por teclado y toque. No hacer que el único modo de frenarlo sea tocar una zona sin etiqueta. No imponer el avance automático a quien prefiera movimiento reducido.
- Copy: Siguiente nivel / Nivel {n} / Avance automático / Avance automático en {s} s / Detener avance
- Aceptación: Tras victoria se puede leer resultados sin que desaparezcan; Detener avance por Tab+Enter cancela realmente; comenzar manualmente cancela temporizador, sin doble lanzamiento.
- Referencias: https://jetball.jetgames.fun/ — index.html:11197–11239
- Notas: Riesgo derivado de fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.
- Coordinación: Avance automático desactivado por defecto. Siguiente nivel como CTA; Nivel {n} secundario. Activación opt-in persistente, con Detener avance.

## [SRC-B02] P2 · active_source_finding · Texto, estados y flujo
**#coachSkip; #btnResume; #btnReset**
- Actual: Saltar; ▶ CONTINUAR PARTIDA; ↺ Reiniciar
- Instrucción: Aclarar que Reiniciar resetea la partida completa y no sólo el nivel (handler resetGame). Mantener información de nivel/modo del guardado como texto secundario. Usar mayúsculas vía CSS si se desean, no en cadenas de acciones; iconos separados aria-hidden.
- Copy: Omitir tutorial; Continuar partida; Reiniciar partida
- Aceptación: Cambiar modo y cargar guardado informa el modo y nivel restaurados. Reiniciar no se confunde con repetir nivel. El tutorial omitido puede abrirse nuevamente.
- Referencias: https://jetball.jetgames.fun/ — index.html:3055,3202–3205,18365–18390
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-BALL-01] P2 · active_proposal · Dirección visual interna
**Fondos temáticos subordinados al juego**
- Actual: Archivo: ui_audit/source_review/current_1410/jetball.html
Líneas: 7703–7734; 8596; 10248; 10496; 13415
Funciones: drawClassicBackdrop
drawFruitBackdrop
drawOceanBackdrop
drawEgyptBackdrop
drawArtisticOverlay
Selectores: 
Valores literales de la fuente: hexR=28
grid strokeStyle=rgba(34,232,255,0.07)
vignette center rgba(40,20,80,0.22)
- Instrucción: Jerarquizar el fondo por modo, no reemplazarlo. En clásico, mantener la trama hexagonal como textura secundaria, con opacidad máxima de 0,07 y sin animación adicional sobre la zona de juego. Reservar las variaciones de color de alto contraste para límites, trazados y entidades. En frutas, océano y Egipto conservar sus ilustraciones/materiales propios; bajar sólo la intensidad de adornos que se superpongan visualmente con las entidades, mediante un factor decorativo por modo, nunca con un filtro global aplicado al canvas. Mantener intactas las composiciones y paletas de los modos de arte.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- classic_grid: rgba(34,232,255,0.07),1 px; hexR 28 sin cambio
- decorative_layer_gain: 0.75 inicial sólo decoración no semántica; modos arte excluidos
- active_geometry: sin cambios de color/grosor/posición
- Copy: 
- Aceptación: Comparar mismo estado y misma semilla antes/después en clásico, un modo fruta, océano, Egipto y arte. El objetivo, límites y entidades se reconocen primero; las obras conservan sus colores; el estado lógico del tablero no cambia.
- Referencias: ui_audit/source_review/current_1410/jetball.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No alterar límites, áreas capturadas, trazado activo, visibilidad que forme parte de la dificultad, colisiones, ni colores de las obras/referencias. Las texturas decorativas no deben parecer entidades ni líneas jugables.

## [VIS-BALL-02] P2 · active_proposal · Dirección visual interna
**Bolas nítidas y halos controlados**
- Actual: Archivo: ui_audit/source_review/current_1410/jetball.html
Líneas: 15041–15090
Funciones: drawStandardBall
Selectores: 
Valores literales de la fuente: phantom #ff3355; bullet #ff8c00; boss #fbff3a; magnetic #cc66ff
shadowBlur boss=30, magnetic=25, resto=20
arte/arte_mimic/isArtMode shadowBlur=0
phantom alpha=0.55+0.2*sin(now/100)
- Instrucción: En los modos arcade que usan drawStandardBall, separar la silueta sólida del halo: conservar el disco de radio b.r y su color actual; limitar el halo decorativo normal a min(12 px, 1,2*b.r), con un halo algo mayor sólo para entidades especiales. No cambiar los colores por tipo. Mantener una zona central legible, sin convertir todas las bolas en puntos blancos. Para tipos visualmente similares, proponer un detalle interior pequeño y estable (anillo o marca propia) que no salga del disco ni reemplace su color; validar la tabla completa de tipos antes de asignarlo. No aplicar este tratamiento a arte ni a personajes temáticos.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- normal_halo: min(12 CSSpx,1.2*b.r)
- special_halo: min(16 CSSpx,1.5*b.r); arte 0
- disc: radio b.r y color por tipo intactos
- optional_inner_marker: trazo 1 px, radio 0.45*b.r, alpha 0.75; sólo tras validar todos los tipos
- Copy: 
- Aceptación: En bolas pequeñas y agrupadas, cada disco se distingue sin fusionarse con su halo. Una tabla de todos los tipos mantiene sus nombres, colores y comportamiento. Arte permanece plano, sin halo.
- Referencias: ui_audit/source_review/current_1410/jetball.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: El radio visible principal sigue representando b.r; el halo no representa área de impacto. Preservar transparencia funcional de phantom y rasgos que indiquen habilidades. No normalizar colores de pinturas ni modificar físicas.

## [VIS-BALL-03] P2 · active_proposal · Dirección visual interna
**HUD y resultados con jerarquía tipográfica**
- Actual: Archivo: ui_audit/source_review/current_1410/jetball.html
Líneas: 297–318; 11135–11158
Funciones: renderOvStats
renderOvStateFx
Selectores: .hud-pill .val.accent
.hud-pill .val.success
.hud-pill .val.best
.hud-pill .val.danger
Valores literales de la fuente: .val.accent text-shadow 0 0 6px
.val.success animation successPulse 1s infinite
.val.best font-size 0.55rem
.val.danger text-shadow 0 0 6px
- Instrucción: Dar al HUD una lectura instrumental: números principales con peso 700–800 y tabular-nums, rótulos sin resplandor, y récord como dato secundario pero no microscópico. Fijar un mínimo visual de 12 px para etiquetas/valores secundarios, permitir expansión o una segunda fila antes de reducirlos. Usar fondo opaco o casi opaco detrás de los valores en temas claros. Dejar un único acento por dato de estado y limitar el pulso de éxito a una respuesta breve de 300 ms; el estado alcanzado debe seguir indicado de forma estática. En resultados, separar puntuación, progreso y récord en grupos, sin aplicar gradiente a todos los números.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- primary_value: 20 px/1.1, peso 800, tabular-nums
- secondary_minimum: 12 px/1.3, peso 600
- normal_text_shadow: none
- success_feedback: 300 ms, una vez
- dark_panel: #0B0715 a 0.94; borde #524566 a 0.65,1 px
- Copy: 
- Aceptación: Con valores largos y récord alto, ningún número cambia de ancho al incrementarse ni queda recortado. En tema claro y oscuro los datos se leen sin depender del brillo. El éxito queda indicado después de terminar el pulso.
- Referencias: ui_audit/source_review/current_1410/jetball.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: Preservar qué dato es tiempo, vida, área, récord u objetivo, sus unidades y alertas. No cambiar los umbrales ni hacer desaparecer una advertencia persistente. Respetar tema claro/oscuro, tamaño de texto y ES/EN existentes.

## [VIS-BALL-04] P2 · active_proposal · Dirección visual interna
**Efectos breves y movimiento reducido**
- Actual: Archivo: ui_audit/source_review/current_1410/jetball.html
Líneas: 6405–6438; 11153–11158; 15092–15105; 18662
Funciones: draw
renderOvStateFx
Selectores: 
Valores literales de la fuente: settings.reducedMotion
body.reduced-motion
shake>0: translate((random-.5)*shake)
victory colors #00f2cf,#9a3eff,#7700f4,#ffe14a,#ffffff
- Instrucción: Centralizar una intensidad de efectos decorativos que respete la opción reducedMotion ya existente. En modo reducido, eliminar sacudida de cámara, lluvia ornamental y transiciones de panel; reemplazarlas por un cambio estático de borde/estado. En modo normal, mantener la cámara estable durante la lectura de resultados y limitar la celebración inicial a 600 ms, detrás de las estadísticas, nunca encima del botón principal. No sumar destellos blancos de pantalla completa a cada captura. Aplicar el mismo criterio a cambios de modo y menús sin borrar su identidad temática.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- victory_decorative_duration: 600 ms máximo
- normal_camera_shake_visual_cap: 3 CSS px,180 ms máximo por evento; validar información de daño
- reduced_motion: shake 0; partículas ornamentales 0; transición de panel 0 ms
- static_state_border: 2 px con color semántico existente
- Copy: 
- Aceptación: Activar reducedMotion y provocar captura, impacto, victoria y cambio de modo: estados y cifras son idénticos; no hay sacudida ni partículas decorativas superpuestas. Con movimiento normal, el botón de continuar queda visible y estable durante la celebración.
- Referencias: ui_audit/source_review/current_1410/jetball.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: La reducción afecta a efectos, no a velocidad de bolas, cronómetro, dificultad ni información funcional de impacto/congelación. No afirmar que el soporte reduced-motion no existe: ya hay infraestructura y hay que extender/verificar su cobertura.

# Copys ES/EN aplicables
- COPY-common-continue-save [SRC-G03, SRC-B02, SRC-CH02, SRC-TE02] es-AR: «Continuar partida» | en: «Continue game» | contexto: Continuar recupera un guardado; Nueva partida inicia sesión desde el estado inicial. No exige tablero ni semilla diferentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Continuar partida']
- COPY-common-newgame [SRC-G03, SRC-B02, SRC-CH02, SRC-TE02] es-AR: «Nueva partida» | en: «New game» | contexto: Continuar recupera un guardado; Nueva partida inicia sesión desde el estado inicial. No exige tablero ni semilla diferentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-next [SRC-B01, PLAY-BALL-06] es-AR: «Siguiente nivel» | en: «Next level» | contexto: Resultado de victoria: CTA estable y número separado. Avance automático OFF por defecto, sólo opt-in persistente; al iniciar manualmente cancelar temporizador. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-next-number [SRC-B01, PLAY-BALL-06] es-AR: «Nivel {n}» | en: «Level {n}» | contexto: Resultado de victoria: CTA estable y número separado. Avance automático OFF por defecto, sólo opt-in persistente; al iniciar manualmente cancelar temporizador. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-auto [SRC-B01, PLAY-BALL-06] es-AR: «Avance automático» | en: «Automatic progression» | contexto: Resultado de victoria: CTA estable y número separado. Avance automático OFF por defecto, sólo opt-in persistente; al iniciar manualmente cancelar temporizador. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-auto-countdown [SRC-B01, PLAY-BALL-06] es-AR: «Avance automático en {s} s» | en: «Automatic progression in {s} s» | contexto: Resultado de victoria: CTA estable y número separado. Avance automático OFF por defecto, sólo opt-in persistente; al iniciar manualmente cancelar temporizador. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 's', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-auto-stop [SRC-B01, PLAY-BALL-06] es-AR: «Detener avance» | en: «Stop automatic progression» | contexto: Resultado de victoria: CTA estable y número separado. Avance automático OFF por defecto, sólo opt-in persistente; al iniciar manualmente cancelar temporizador. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-skip-tutorial [SRC-B02] es-AR: «Omitir tutorial» | en: «Skip tutorial» | contexto: Reiniciar afecta partida completa; Continuar partida restaura modo/nivel guardados, no el selector recién cambiado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Saltar']
- COPY-ball-restart [SRC-B02] es-AR: «Reiniciar partida» | en: «Restart game» | contexto: Reiniciar afecta partida completa; Continuar partida restaura modo/nivel guardados, no el selector recién cambiado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-save-mode [SRC-B02] es-AR: «Modo guardado: {modo}» | en: «Saved mode: {modo}» | contexto: Reiniciar afecta partida completa; Continuar partida restaura modo/nivel guardados, no el selector recién cambiado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'modo', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-save-level [SRC-B02] es-AR: «Nivel guardado: {n}» | en: «Saved level: {n}» | contexto: Reiniciar afecta partida completa; Continuar partida restaura modo/nivel guardados, no el selector recién cambiado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-barrier-help [PLAY-BALL-02] es-AR: «Arrastrá horizontal o verticalmente para construir una barrera. Evitá que una bola la toque antes de terminar.» | en: «Drag horizontally or vertically to build a barrier. Don’t let a ball touch it before it is complete.» | contexto: Tutorial breve antes del primer intento. No inventar alternativa de clic sin la mecánica correspondiente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-understood [PLAY-BALL-02] es-AR: «Entendido» | en: «Got it» | contexto: Tutorial breve antes del primer intento. No inventar alternativa de clic sin la mecánica correspondiente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-level [PLAY-BALL-03, PLAY-BALL-05, PLAY-BALL-07] es-AR: «Nivel {n}» | en: «Level {n}» | contexto: Valores del intento, no 1/5/58/75/16.775 observados. Primer guardado no equivale a superar récord. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-lives [PLAY-BALL-03, PLAY-BALL-05, PLAY-BALL-07] es-AR: «Vidas: {n}» | en: «Lives: {n}» | contexto: Valores del intento, no 1/5/58/75/16.775 observados. Primer guardado no equivale a superar récord. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-captured [PLAY-BALL-03, PLAY-BALL-05, PLAY-BALL-07] es-AR: «Capturado: {pct}% · Meta: {target}%» | en: «Captured: {pct}% · Target: {target}%» | contexto: Valores del intento, no 1/5/58/75/16.775 observados. Primer guardado no equivale a superar récord. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'pct', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'target', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-points [PLAY-BALL-03, PLAY-BALL-05, PLAY-BALL-07] es-AR: «Puntos: {n}» | en: «Points: {n}» | contexto: Valores del intento, no 1/5/58/75/16.775 observados. Primer guardado no equivale a superar récord. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-best-level [PLAY-BALL-03, PLAY-BALL-05, PLAY-BALL-07] es-AR: «Mejor nivel: {n}» | en: «Best level: {n}» | contexto: Valores del intento, no 1/5/58/75/16.775 observados. Primer guardado no equivale a superar récord. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-level-reached [PLAY-BALL-03, PLAY-BALL-05, PLAY-BALL-07] es-AR: «Nivel alcanzado: {n}» | en: «Level reached: {n}» | contexto: Valores del intento, no 1/5/58/75/16.775 observados. Primer guardado no equivale a superar récord. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-first-result [PLAY-BALL-03, PLAY-BALL-05, PLAY-BALL-07] es-AR: «Primer resultado guardado» | en: «First result saved» | contexto: Valores del intento, no 1/5/58/75/16.775 observados. Primer guardado no equivale a superar récord. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-new-record [PLAY-BALL-03, PLAY-BALL-05, PLAY-BALL-07] es-AR: «¡Nuevo récord!» | en: «New record!» | contexto: Valores del intento, no 1/5/58/75/16.775 observados. Primer guardado no equivale a superar récord. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-expert [PLAY-BALL-04, PLAY-BALL-05] es-AR: «Experto» | en: «Expert» | contexto: Experto sólo si el mapeo de dificultad coincide. Rama singular n=1; plural para demás cantidades, con formato numérico local. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-one-mode [PLAY-BALL-04, PLAY-BALL-05] es-AR: «1 modo jugado» | en: «1 mode played» | contexto: Experto sólo si el mapeo de dificultad coincide. Rama singular n=1; plural para demás cantidades, con formato numérico local. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-many-modes [PLAY-BALL-04, PLAY-BALL-05] es-AR: «{n} modos jugados» | en: «{n} modes played» | contexto: Experto sólo si el mapeo de dificultad coincide. Rama singular n=1; plural para demás cantidades, con formato numérico local. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-record-classic [PLAY-BALL-04, PLAY-BALL-05] es-AR: «Récord · Clásico» | en: «Record · Classic» | contexto: Experto sólo si el mapeo de dificultad coincide. Rama singular n=1; plural para demás cantidades, con formato numérico local. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-record-survival [PLAY-BALL-04, PLAY-BALL-05] es-AR: «Récord · Supervivencia» | en: «Record · Survival» | contexto: Experto sólo si el mapeo de dificultad coincide. Rama singular n=1; plural para demás cantidades, con formato numérico local. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-continue-lives [PLAY-BALL-08] es-AR: «Continuar con {vidas} vidas» | en: «Continue with {vidas} lives» | contexto: Continuación tras derrota, no reanudación de pausa ni recuperación del guardado. {vidas} debe describir el efecto real: revisar si son vidas recibidas o total resultante. | condición: No instalar el texto de gratuidad/límite hasta verificar la regla vigente. El dato observado +3 vidas no prueba coste ni límite. No cambiar economía para ajustarla al copy. | params: [{'name': 'vidas', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-free-continuation [PLAY-BALL-08] es-AR: «Una continuación gratuita por partida» | en: «One free continuation per game» | contexto: Continuación tras derrota, no reanudación de pausa ni recuperación del guardado. {vidas} debe describir el efecto real: revisar si son vidas recibidas o total resultante. | condición: No instalar el texto de gratuidad/límite hasta verificar la regla vigente. El dato observado +3 vidas no prueba coste ni límite. No cambiar economía para ajustarla al copy. | params: [] | citas actuales: []
- COPY-ball-empty-powers [PLAY-BALL-09] es-AR: «Todavía no tenés poderes. Juntalos durante la partida.» | en: «You don’t have any power-ups yet. Collect them during the game.» | contexto: Inventario vacío: primera cadena sólo en modos que generan poderes; Zen usa segunda o no muestra inventario, sin prometer colección imposible. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-zen-no-powers [PLAY-BALL-09] es-AR: «En modo Zen no aparecen poderes.» | en: «Power-ups do not appear in Zen mode.» | contexto: Inventario vacío: primera cadena sólo en modos que generan poderes; Zen usa segunda o no muestra inventario, sin prometer colección imposible. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-keyboard [RSP-BALL-04] es-AR: «Flechas: mover el cursor. H: barrera horizontal. V: barrera vertical. Enter o Espacio: construir.» | en: «Arrow keys: move the cursor. H: horizontal barrier. V: vertical barrier. Enter or Space: build.» | contexto: Ayuda/status del NUEVO cursor de teclado. Publicar solamente después de implementar manejadores, foco, startWall compartido y traducción de valores de estado/orientación. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-ball-cell-status [RSP-BALL-04] es-AR: «Fila {fila}, columna {columna}. Orientación: {orientación}. {estado}» | en: «Row {fila}, column {columna}. Orientation: {orientación}. {estado}» | contexto: Ayuda/status del NUEVO cursor de teclado. Publicar solamente después de implementar manejadores, foco, startWall compartido y traducción de valores de estado/orientación. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'fila', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'columna', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'orientación', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'estado', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-ball-continue-one-life [PLAY-BALL-08] es-AR: «Continuar con 1 vida» | en: «Continue with 1 life» | contexto: Sólo si la regla real ofrece exactamente una vida; no cambia el valor actual ni el coste. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
