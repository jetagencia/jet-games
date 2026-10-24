# match: 16 registros del catálogo, 26 copys

## [RSP-MATCH-01] P1 · active · Responsive y controles
**Aislar los overlays del HUD y respetar foco de controles durante partida**
- Actual: P1 · alta · confirmado por fuente. `current_1410/jetmatch_canonical.html:1892–1900` cambia `.show` y enfoca sólo CTA principal, sin inert para `#app`. En 2081–2113, Enter/Espacio en partida siempre pasa a selección de gema; no excluye `#b-pause` ni `#b-hint`. Los overlays están correctamente `display:none` cerrados (176–180): no confundir esto con el fallo de Box.
- Instrucción: `show(id)` debe poner `#app.inert=true` mientras exista un overlay; `hideAll()` lo revierte y enfoca tablero o disparador. Pausa/Ajustes/Ayuda/resultados deben tener role dialog, aria-modal y título. Guardar/restaurar foco y cerrar/trapar únicamente el overlay superior. Antes de atajos de juego, excluir controles nativos/editables para permitir click de Enter/Espacio; no introducir un doble click de pausa.
- Copy: 
- Aceptación: Tab desde Ajustes no alcanza Pausa/Pista detrás; cerrar vuelve a foco visible. En juego, Enter sobre Pausa pausa y sobre Pista solicita pista; no intercambia ninguna gema.
- Referencias: Archivo: current_1410/jetmatch_canonical.html
Líneas: 1892–1900
Archivo: current_1410/jetmatch_canonical.html
Líneas: 176–180,1892–1900,2081–2113
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [SRC-M01] P1 · active_source_finding · Texto, estados y flujo
**#b-quit por modo**
- Actual: Salir (campaña y tiempo); Terminar (zen)
- Instrucción: Mapear a comportamiento real: campaña openMap, tiempo menú, zen resultados. Señalar pérdida del intento si no se guarda. No volver al mapa bajo una etiqueta genérica Salir.
- Copy: Volver al mapa / Salir al menú / Finalizar partida
- Aceptación: Tres modos: cada etiqueta coincide con destino; el modo Zen muestra resumen y no derrota.
- Referencias: https://jetgames.fun/match/ — current_1410/jetmatch_canonical.html:385,527,1974,2144
- Notas: Inconsistencia confirmada en fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [PLAY-MATCH-01] P2 · active · Prueba interactiva y propuestas
**Nombrar jugadas sobrantes, no pistas**
- Actual: Manual: ¿Atascado? Toca Pista. Las que sobren se convierten en rayos. El antecedente puede interpretarse como pistas.
- Instrucción: Separar la explicación de la ayuda de la bonificación y nombrar explícitamente las jugadas. Verificar la regla de la bonificación antes de confirmar el texto.
- Copy: ¿Te trabaste? Tocá «Pista» para ver un intercambio posible.
Al completar el objetivo, las jugadas restantes se convierten en rayos.
- Aceptación: La ayuda no sugiere que se gasten pistas ni que sean las que se convierten en rayos.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:33:00Z/2026-10-22T14:37:00Z

## [PLAY-MATCH-02] P2 · active · Prueba interactiva y propuestas
**Mantener nombre y unidad del modo contrarreloj**
- Actual: El menú y la pausa muestran Contrarreloj; el HUD lo llama Reloj. TIEMPO90 no indica segundos.
- Instrucción: Usar «Contrarreloj» en todos los estados. Mostrar el tiempo restante real como m:ss o «{s} s», con la etiqueta «Tiempo restante» y una sola convención en el HUD y el resultado. El modo observado comienza en 90 s, equivalentes a 1:30; conservar esa duración si sigue siendo la regla, pero no fijar 90 s como tiempo restante durante toda la partida.
- Copy: Contrarreloj
Tiempo restante: {s} s
- Aceptación: El modo tiene el mismo nombre en selección, partida, pausa y resultado. El tiempo mostrado disminuye con la partida y respeta la pausa; no permanece fijado al valor inicial.
- Referencias: evidence/match-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T14:33:00Z/2026-10-22T14:37:00Z

## [PLAY-MATCH-03] P2 · active · Prueba interactiva y propuestas
**Anunciar la salida y evitar abandono accidental**
- Actual: Salir desde la pausa de Contrarreloj vuelve al menú sin confirmación ni resumen. En la prueba se abandonó con 540 puntos y 39 s restantes.
- Instrucción: Renombrar el destino según modo y confirmar si se pierde partida en curso; no aplicar un destino único a modos con retornos distintos.
- Copy: Salir al menú
¿Salir de esta partida?
Vas a perder el avance de esta partida.
Seguir jugando
Salir
- Aceptación: Cancelar conserva tablero, puntos y tiempo; confirmar llega al destino anunciado. Probar campaña, contrarreloj y zen por separado.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:33:00Z/2026-10-22T14:37:00Z

## [PLAY-MATCH-04] P2 · active · Prueba interactiva y propuestas
**Etiquetar la puntuación final y las estrellas**
- Actual: En la victoria, 43.060 aparece en gran tamaño sin unidad. Las tres estrellas no tienen umbrales textuales en el resultado.
- Instrucción: Añadir la etiqueta «Puntos» y el desglose de la bonificación por jugadas restantes. Informar los umbrales de estrellas y el estado alcanzado o pendiente. Mostrar las estrellas obtenidas desde el resultado real, no fijar el ejemplo observado de tres.
- Copy: Puntos
Bonificación por jugadas restantes
{estrellas} de 3 estrellas
- Aceptación: Se entienden el total, el número de estrellas y cómo mejorarlos sin deducir el significado de una cifra ni del color.
- Referencias: evidence/match-pass1-result.jpg
- Notas: Ventana de observación: 2026-10-22T14:33:00Z/2026-10-22T14:37:00Z

## [PLAY-MATCH-05] P2 · active · Prueba interactiva y propuestas
**Dar semántica al tablero y no exponer HUD de fondo en modales**
- Actual: El árbol de accesibilidad del tablero no contiene gemas ni celdas. Durante los menús siguen expuestos el HUD y el botón de pista del juego que queda detrás.
- Instrucción: Exponer cursor, fila, columna, tipo de gema y selección en una representación accesible. Ocultar o marcar inert el juego detrás de las superposiciones; gestionar el foco inicial y restaurarlo al cerrarlas.
- Copy: Fila {fila}, columna {columna}: {gema}
Gema seleccionada
Intercambio no válido
- Aceptación: Con lector y teclado se puede seleccionar/intercambiar sin ver colores; Tab en un modal no entra al tablero de fondo.
- Referencias: evidence/match-pass1-gameplay.jpg
evidence/match-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T14:33:00Z/2026-10-22T14:37:00Z

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

## [RSP-MATCH-02] P2 · active · Responsive y controles
**Ajustes táctiles: el switch tiene 30 px sin ampliación de área**
- Actual: P2 · alta · confirmado por fuente. `current_1410/jetmatch_canonical.html:260–268`: `.sw{width:52px;height:30px}`, slider height de 30 px; a diferencia de Flow/Words no existe pseudoelemento que amplíe switch. Cuatro switches en 470–476.
- Instrucción: Hacer el botón `.sw` de 52×44 px con fondo transparente y dibujar pista de 52×30 px mediante `::before{inset:7px 0}`; colocar indicador de 24 px en `top:10px` en `::after`. Mantener aria-pressed actual o convertir consistentemente a role switch+aria-checked, no ambos a la vez. Slider altura de 44 px y focus visible, pista sigue teniendo 6 px. Mantener gap de 12 px en `.set`.
- Copy: 
- Aceptación: Los cuatro switches y ambos sliders tienen caja de interacción de al menos 44 px de alto a 320/360/390/768; tocar bordes superior/inferior cambia el control correspondiente, sin invadir fila vecina.
- Referencias: Archivo: current_1410/jetmatch_canonical.html
Líneas: 260–268
Archivo: current_1410/jetmatch_canonical.html
Líneas: 260–268,470–475
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [SRC-M02] P2 · active_source_finding · Texto, estados y flujo
**Pausa y resultados**
- Actual: Continuar; Reiniciar; Repetir; Reintentar; Mapa; Otra vez
- Instrucción: En contrarreloj usar Reiniciar partida/Reintentar partida en vez de nivel; añadir duración al selector Contrarreloj y explicación breve a Zen, sin temporizador ni derrota inventados.
- Copy: Reanudar partida; Reiniciar nivel; Repetir nivel; Reintentar nivel; Volver al mapa; Nueva partida
- Aceptación: Ganar→Repetir conserva nivel; perder→Reintentar conserva reto; Nueva partida de modo libre reinicia puntuación claramente.
- Referencias: https://jetgames.fun/match/ — current_1410/jetmatch_canonical.html:380–434,527–530
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-MATCH-01] P2 · active_proposal · Dirección visual interna
**Gemas con forma y color preservados**
- Actual: Archivo: ui_audit/source_review/current_1410/jetmatch_canonical.html
Líneas: 926–933; 1528–1538
Funciones: paintGem
Selectores: 
Valores literales de la fuente: cian circle; magenta diamond; amarillo square; verde triangle; violeta hex; naranja star
r=R*.37
shadowBlur=R*.2
highlight alpha=.42
Capturas inspeccionadas: ui_audit/evidence/match-pass1-gameplay.jpg (1180×757; campaña 7×7, HUD izquierdo y Pista aislada abajo)
ui_audit/evidence/match-pass2-gameplay.jpg (1180×757; modo Reloj, tablero 8×8 y resplandor entre celdas)
- Instrucción: Conservar exactamente las seis parejas de color/forma. Uniformar la iluminación de las gemas desde arriba a la izquierda, reducir el halo a aproximadamente R*0,10–0,12 y dejar la silueta exterior nítida con un borde de 1–1,5 px. Bajar el brillo blanco especular para que el color base siga ocupando la mayor parte de la pieza; no convertirlas en gemas casi blancas. No añadir texturas distintas que se parezcan a los símbolos de especiales. Usar los mismos sprites en objetivos y tablero.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- gem_halo: R*0.11
- specular_alpha: 0.28
- outer_edge: rgba(255,255,255,.50),max(1px,R*.028)
- six_semantic_colors: sin cambios
- gem_radius: R*.37, conservar
- Copy: 
- Aceptación: La tabla de seis gemas mantiene las mismas parejas forma/color, distinguibles en escala de grises y a tamaño pequeño. Objetivos y piezas de tablero coinciden visualmente; emparejamientos y puntuación no cambian.
- Referencias: ui_audit/source_review/current_1410/jetmatch_canonical.html
- Notas: Propuesta de dirección visual apoyada en la fuente y en capturas inspeccionadas; no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No recolorear ni intercambiar forma de ninguna categoría; no cambiar tamaño lógico de celda ni reglas de combinación. La forma es información de accesibilidad ya existente y debe conservarse.

## [VIS-MATCH-02] P2 · active_proposal · Dirección visual interna
**Especiales, roca e hielo diferenciados**
- Actual: Archivo: ui_audit/source_review/current_1410/jetmatch_canonical.html
Líneas: 1539–1599
Funciones: paintLine
paintBomb
paintNova
paintCore
paintRock
paintIce
Selectores: 
Valores literales de la fuente: especial línea dos bandas + flechas
bomba aro central R*.17
nova6 sectores
roca hp>1 anillos naranjas
hielo lvl>1 alpha .5/.32; lvl1 .28/.14
Capturas inspeccionadas: ui_audit/evidence/match-pass1-gameplay.jpg (1180×757; campaña 7×7, HUD izquierdo y Pista aislada abajo)
ui_audit/evidence/match-pass2-gameplay.jpg (1180×757; modo Reloj, tablero 8×8 y resplandor entre celdas)
- Instrucción: Fijar una gramática visual de capas: gema base → símbolo de especial → marco de hielo, conservando los niveles actuales. Asegurar que flechas de línea y símbolo de bomba tengan contorno oscuro corto para no desaparecer sobre gema amarilla/cian; no reemplazarlos por glow. Mantener anillos de roca resistente y grietas de roca dañada, reforzando su diferencia por forma. En hielo doble, añadir una segunda línea interior tenue en lugar de aumentar tanto el blanco que oculte el tipo de gema. Mantener nova multicolor y núcleo con su silueta propia.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- special_symbol_understroke: #130D21 a 0.9,1.5 CSS px
- ice_double_inner_line: #E6FCFF a 0.55,1 px, inset 3 px
- rock_HP_rings: color #FF9533 existente, conservar
- symbol_glow_max: R*.08
- Copy: 
- Aceptación: Preparar una matriz de todas las gemas × especiales × uno/dos niveles de hielo; cada combinación conserva color, forma, dirección y resistencia visibles. Tras daño, la transición visual coincide con el nuevo estado lógico.
- Referencias: ui_audit/source_review/current_1410/jetmatch_canonical.html
- Notas: Propuesta de dirección visual apoyada en la fuente y en capturas inspeccionadas; no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No confundir especial horizontal con vertical, no eliminar información de HP/hielo ni revelar resultados futuros. Respetar estados y paletas; los marcos visuales no amplían áreas afectadas.

## [VIS-MATCH-03] P2 · active_proposal · Dirección visual interna
**Capas del tablero sin halos en cada junta**
- Actual: Archivo: ui_audit/source_review/current_1410/jetmatch_canonical.html
Líneas: 1665–1753;1643–1652
Funciones: drawBg
render
buildBoardLayer
Selectores: 
Valores literales de la fuente: fondo #050108; niebla violeta alpha .30
estrellas VW*VH/5200; alpha .15–.70
pista borde amarillo; selección borde cian3px
cursor teclado amarillo dashed[6,4]
buildBoardLayer shadowBlur=CS*.5 y fillRect por cada celda no-hole
Capturas inspeccionadas: ui_audit/evidence/match-pass1-gameplay.jpg (1180×757; campaña 7×7, HUD izquierdo y Pista aislada abajo)
ui_audit/evidence/match-pass2-gameplay.jpg (1180×757; modo Reloj, tablero 8×8 y resplandor entre celdas)
Observación visual en las capturas: En ambas capturas de juego, el resplandor cian se concentra también en juntas internas y compite con gemas. La fuente aplica sombra durante cada fillRect de celda; se propone un halo exterior único sin alterar el mapa de huecos.
- Instrucción: Mantener el fondo espacial como marco exterior y disminuir la presencia de estrellas detrás de celdas; no añadir una nebulosa más brillante bajo el tablero. Separar las tres señales de interacción ya existentes: selección con contorno cian sólido, cursor de teclado con borde discontinuo y pista con contorno amarillo que agrupe las dos piezas y flecha doble. Asegurar un pequeño margen entre esos contornos para que puedan coexistir sin borrar uno al otro. No transformar la pista en un brillo aplicado a todo el tablero. En buildBoardLayer, retirar la sombra durante el bucle individual de casillas y producir un solo halo del perímetro exterior del tablero con blur=0,14*CS y opacidad de partida 0,22. Mantener los huecos reales como huecos, no rellenarlos para simplificar la máscara. Dejar juntas internas neutras de 1 px, sin bloom.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- board_outer_halo: color sector actual, alpha 0.22, blur CS*.14, una sola silueta
- internal_joint: #31253F a 0.8,1 px, sin sombra
- selection: cian existente,3 px, inset 3 px
- keyboard: amarillo existente,2.5 px, dash[6,4], inset 1 px
- hint: amarillo existente,2 px, inset 5 px
- Copy: 
- Aceptación: Con cursor, selección y pista simultáneos, se identifica cada estado. Los contornos no ocultan símbolos especiales ni hielo. Fondo y estrellas no parecen gemas adicionales.
- Referencias: ui_audit/source_review/current_1410/jetmatch_canonical.html
- Notas: Propuesta de dirección visual apoyada en la fuente y en capturas inspeccionadas; no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Preservar la distinción selección/cursor/pista, sus coordenadas y la dirección del intercambio. No mostrar una pista antes de que el juego la conceda. No alterar casillas ni objetivos.

## [VIS-MATCH-04] P2 · active_proposal · Dirección visual interna
**Animaciones y reducción de movimiento**
- Actual: Archivo: ui_audit/source_review/current_1410/jetmatch_canonical.html
Líneas: 1680–1753
Funciones: render
Selectores: 
Valores literales de la fuente: shake condicionado !RM
pista y selección alpha sin(t*6/8)
nova rot=t*1.6
bomba escala1+sin(t*7+id)*.04
rebote born hasta1.3; pop hasta1.25
- Instrucción: Usar RM también para los bucles decorativos de nova, bomba, núcleo y pulsación de selección, además de la sacudida y desplazamiento de pista que ya contempla. Con movimiento reducido, mantener sprites estáticos y contornos constantes; resolver intercambio/caída con una transición corta que conserve orden de eventos, sin rebotes. En modo normal, limitar la jerarquía a una animación dominante por evento: primero intercambio, luego combinación y caída; no aumentar simultáneamente glow, escala y sacudida. Los efectos de puntuación deben quedar por encima del tablero pero fuera de los símbolos de objetivos mientras se actualizan.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- reduced_idle_rotation: 0
- reduced_idle_scale: 1
- reduced_selection_alpha: 0.9
- visual_swap_transition: 120 ms como punto inicial; no alterar cronología lógica
- normal_pop_scale_max: 1.15
- normal_camera_cap: 2 px
- Copy: 
- Aceptación: Repetir la misma cascada con RM activo/inactivo: resultado, piezas y puntuación idénticos. En reducido no giran especiales en reposo ni pulsa el cursor. La secuencia de cambios sigue siendo comprensible.
- Referencias: ui_audit/source_review/current_1410/jetmatch_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar duración lógica de turno, ventanas de entrada, cascadas, azar, combinaciones ni puntuación. No ocultar piezas durante estados activos ni declarar ausente el soporte RM existente.

## [VIS-MATCH-05] P2 · active_proposal · Dirección visual interna
**Columna de datos integrada y unidad de puntaje**
- Actual: Archivo: ui_audit/source_review/current_1410/jetmatch_canonical.html
Líneas: 117–174;391–400;1630–1641
Funciones: layout
Selectores: #app.land #hud
#app.land #dock
#app.land #stage
#wi-score
#o-win .stats
Valores literales de la fuente: dock landscape position:absolute; bottom:safe+10px
HUD landscape align-content:center
desktop HUD/dock width clamp(240px,24vw,320px)
stage margin-left12px
wi-score div.big sin rótulo de unidad en HTML
Capturas inspeccionadas: ui_audit/evidence/match-pass1-gameplay.jpg (1180×757; campaña 7×7, HUD izquierdo y Pista aislada abajo)
ui_audit/evidence/match-pass1-result.jpg (1180×757; victoria con 43.060 sin rótulo de unidad junto al total)
ui_audit/evidence/match-pass2-gameplay.jpg (1180×757; modo Reloj, tablero 8×8 y resplandor entre celdas)
Observación visual en las capturas: El tablero domina a la derecha y Pista queda visualmente aislada abajo a la izquierda. En victoria, 43.060 aparece como gran número sin «Puntos» junto al total. No hay evidencia de pérdida funcional de botones.
- Instrucción: En apaisado amplio, agrupar pausa, nivel/modo, jugadas/tiempo, puntos, objetivos y Pista en una única columna instrumental a la izquierda. Poner Pista 16 px debajo del último objetivo/estadística, no anclarla al borde inferior independiente de la columna. Usar un ancho inicial de 270 px y una separación de 24 px respecto del tablero para pantallas como 1180×757; por debajo del espacio necesario, conservar el reflujo responsivo existente en vez de comprimir las celdas. No reducir el tablero sólo para rellenar el vacío superior del HUD. En resultado, agregar sobre #wi-score el rótulo ES «Puntos» / EN «Points», 12 px, peso 600, color #B8AECF; mantener el total con cifras tabulares. Unificar el bloque de récord y combo a 12 px de separación del total y preservar el CTA principal debajo, sin añadir más halos.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- landscape_sidebar: 270 px a 1180×757; reflujo según espacio disponible
- sidebar_board_gap: 24 px
- hint_gap: 16 px tras último dato/objetivo
- result_score_label: Puntos/Points,12 px, peso 600,#B8AECF
- result_stats_gap: 12 px
- board_geometry: G.W/G.H/huecos intactos; recalcular hit-testing porlayout
- Copy: 
- Aceptación: En las dos escenas 7×7/8×8 a 1180×757, Pista pertenece visualmente al bloque de datos y es accesible sin desplazamiento; tablero íntegro y clics en las cuatro esquinas correctos. En retrato se conserva el orden responsivo. El resultado muestra «Puntos»/«Points» junto a 43.060, sin modificar la cifra ni estadísticas.
- Referencias: ui_audit/source_review/current_1410/jetmatch_canonical.html
- Notas: Composición visual inspeccionada en capturas; propuesta de diseño apoyada en la fuente. No equivale a un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar W/H, cantidad de gemas, CS lógico ni reglas de hit-testing; cualquier cambio de posición recalcula BX/BY a partir del stage. No confundir tiempo con jugadas entre modos. Mantener el valor exacto y formato local de puntuación, récord y combo.

# Copys ES/EN aplicables
- COPY-common-resume [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-FRENTES-01, PLAY-BALIZAS-04, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Reanudar partida» | en: «Resume game» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Continuar', 'Seguir']
- COPY-common-menu [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-TELEMETRIA-05, PLAY-PORTADA-06, PLAY-FRENTES-02] es-AR: «Volver al menú» | en: «Back to menu» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-language-es [SRC-G02, RSP-LANGUAGE-TARGETS-01] es-AR: «ES» | en: «ES» | contexto: Preservar selector existente y aria-pressed; no duplicarlo ni forzar renombre. No crear traducción íntegra de juegos monolingües por este companion. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-language-en [SRC-G02, RSP-LANGUAGE-TARGETS-01] es-AR: «EN» | en: «EN» | contexto: Preservar selector existente y aria-pressed; no duplicarlo ni forzar renombre. No crear traducción íntegra de juegos monolingües por este companion. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-map [SRC-M01, SRC-M02, PLAY-MATCH-03] es-AR: «Volver al mapa» | en: «Back to map» | contexto: Campaña→openMap: mapa. Tiempo→menú: Salir al menú. Zen→resultados: Finalizar partida, nunca derrota inventada. Confirmar con etiqueta de destino real sólo si se pierde intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-exit-menu [SRC-M01, SRC-M02, PLAY-MATCH-03] es-AR: «Salir al menú» | en: «Exit to menu» | contexto: Campaña→openMap: mapa. Tiempo→menú: Salir al menú. Zen→resultados: Finalizar partida, nunca derrota inventada. Confirmar con etiqueta de destino real sólo si se pierde intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-end [SRC-M01, SRC-M02, PLAY-MATCH-03] es-AR: «Finalizar partida» | en: «Finish game» | contexto: Campaña→openMap: mapa. Tiempo→menú: Salir al menú. Zen→resultados: Finalizar partida, nunca derrota inventada. Confirmar con etiqueta de destino real sólo si se pierde intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-restart-level [SRC-M01, SRC-M02, PLAY-MATCH-03] es-AR: «Reiniciar nivel» | en: «Restart level» | contexto: Campaña→openMap: mapa. Tiempo→menú: Salir al menú. Zen→resultados: Finalizar partida, nunca derrota inventada. Confirmar con etiqueta de destino real sólo si se pierde intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-replay-level [SRC-M01, SRC-M02, PLAY-MATCH-03] es-AR: «Repetir nivel» | en: «Replay level» | contexto: Campaña→openMap: mapa. Tiempo→menú: Salir al menú. Zen→resultados: Finalizar partida, nunca derrota inventada. Confirmar con etiqueta de destino real sólo si se pierde intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-retry-level [SRC-M01, SRC-M02, PLAY-MATCH-03] es-AR: «Reintentar nivel» | en: «Retry level» | contexto: Campaña→openMap: mapa. Tiempo→menú: Salir al menú. Zen→resultados: Finalizar partida, nunca derrota inventada. Confirmar con etiqueta de destino real sólo si se pierde intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-restart-game [SRC-M01, SRC-M02, PLAY-MATCH-03] es-AR: «Reiniciar partida» | en: «Restart game» | contexto: Campaña→openMap: mapa. Tiempo→menú: Salir al menú. Zen→resultados: Finalizar partida, nunca derrota inventada. Confirmar con etiqueta de destino real sólo si se pierde intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-retry-game [SRC-M01, SRC-M02, PLAY-MATCH-03] es-AR: «Reintentar partida» | en: «Retry game» | contexto: Campaña→openMap: mapa. Tiempo→menú: Salir al menú. Zen→resultados: Finalizar partida, nunca derrota inventada. Confirmar con etiqueta de destino real sólo si se pierde intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-exit-title [SRC-M01, SRC-M02, PLAY-MATCH-03] es-AR: «¿Salir de esta partida?» | en: «Leave this game?» | contexto: Campaña→openMap: mapa. Tiempo→menú: Salir al menú. Zen→resultados: Finalizar partida, nunca derrota inventada. Confirmar con etiqueta de destino real sólo si se pierde intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-exit-body [SRC-M01, SRC-M02, PLAY-MATCH-03] es-AR: «Vas a perder el avance de esta partida.» | en: «You’ll lose your progress in this game.» | contexto: Campaña→openMap: mapa. Tiempo→menú: Salir al menú. Zen→resultados: Finalizar partida, nunca derrota inventada. Confirmar con etiqueta de destino real sólo si se pierde intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-stay [SRC-M01, SRC-M02, PLAY-MATCH-03] es-AR: «Seguir jugando» | en: «Keep playing» | contexto: Campaña→openMap: mapa. Tiempo→menú: Salir al menú. Zen→resultados: Finalizar partida, nunca derrota inventada. Confirmar con etiqueta de destino real sólo si se pierde intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-hint [PLAY-MATCH-01, PLAY-MATCH-02, PLAY-MATCH-04] es-AR: «Pista» | en: «Hint» | contexto: Pista = hint, no bonus de jugadas. Conectar conversión a rayos sólo tras verificar regla; usar duración real, no 90 s de ejemplo. Tres es el máximo actual descrito, n es dinámico. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-hint-help [PLAY-MATCH-01, PLAY-MATCH-02, PLAY-MATCH-04] es-AR: «¿Te trabaste? Tocá «Pista» para ver un intercambio posible.» | en: «Stuck? Select “Hint” to see a possible swap.» | contexto: Pista = hint, no bonus de jugadas. Conectar conversión a rayos sólo tras verificar regla; usar duración real, no 90 s de ejemplo. Tres es el máximo actual descrito, n es dinámico. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-bonus-help [PLAY-MATCH-01, PLAY-MATCH-02, PLAY-MATCH-04] es-AR: «Al completar el objetivo, las jugadas restantes se convierten en rayos.» | en: «Once you complete the objective, remaining moves turn into lightning bolts.» | contexto: Pista = hint, no bonus de jugadas. Conectar conversión a rayos sólo tras verificar regla; usar duración real, no 90 s de ejemplo. Tres es el máximo actual descrito, n es dinámico. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-time-trial [PLAY-MATCH-01, PLAY-MATCH-02, PLAY-MATCH-04] es-AR: «Contrarreloj» | en: «Time Trial» | contexto: Pista = hint, no bonus de jugadas. Conectar conversión a rayos sólo tras verificar regla; usar duración real, no 90 s de ejemplo. Tres es el máximo actual descrito, n es dinámico. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-time-left [PLAY-MATCH-01, PLAY-MATCH-02, PLAY-MATCH-04] es-AR: «Tiempo restante: {s} s» | en: «Time remaining: {s} s» | contexto: Pista = hint, no bonus de jugadas. Conectar conversión a rayos sólo tras verificar regla; usar duración real, no 90 s de ejemplo. Tres es el máximo actual descrito, n es dinámico. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 's', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-match-points [PLAY-MATCH-01, PLAY-MATCH-02, PLAY-MATCH-04, VIS-MATCH-05] es-AR: «Puntos» | en: «Points» | contexto: Pista = hint, no bonus de jugadas. Conectar conversión a rayos sólo tras verificar regla; usar duración real, no 90 s de ejemplo. Tres es el máximo actual descrito, n es dinámico. También rótulo sobre #wi-score del resultado: mantener valor y formato local, sin fijar43.060 observado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-bonus [PLAY-MATCH-01, PLAY-MATCH-02, PLAY-MATCH-04] es-AR: «Bonificación por jugadas restantes» | en: «Bonus for remaining moves» | contexto: Pista = hint, no bonus de jugadas. Conectar conversión a rayos sólo tras verificar regla; usar duración real, no 90 s de ejemplo. Tres es el máximo actual descrito, n es dinámico. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-stars [PLAY-MATCH-01, PLAY-MATCH-02, PLAY-MATCH-04] es-AR: «{n} de 3 estrellas» | en: «{n} of 3 stars» | contexto: Pista = hint, no bonus de jugadas. Conectar conversión a rayos sólo tras verificar regla; usar duración real, no 90 s de ejemplo. Tres es el máximo actual descrito, n es dinámico. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-match-cell [PLAY-MATCH-05] es-AR: «Fila {fila}, columna {columna}: {gema}» | en: «Row {fila}, column {columna}: {gema}» | contexto: Representación accesible sincronizada. {gema} es valor localizado, no nombre de color sin equivalencia de regla. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'fila', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'columna', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'gema', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-match-selected [PLAY-MATCH-05] es-AR: «Gema seleccionada» | en: «Gem selected» | contexto: Representación accesible sincronizada. {gema} es valor localizado, no nombre de color sin equivalencia de regla. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-match-invalid-swap [PLAY-MATCH-05] es-AR: «Intercambio no válido» | en: «Invalid swap» | contexto: Representación accesible sincronizada. {gema} es valor localizado, no nombre de color sin equivalencia de regla. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
