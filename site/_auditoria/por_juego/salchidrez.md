# salchidrez: 16 registros del catálogo, 33 copys

## [RSP-SALCHIDREZ-01] P1 · active · Responsive y controles
**Gestionar el foco de la pila de overlays, no sólo ocultar los cerrados**
- Actual: Ya se hace `inert=true` a overlays cerrados (preservar). Pero Ajustes/Cómo jugar se abren encima de `overlay-intro` sin cerrarlo ni volverlo inerte; `showOverlay()` no mueve foco y `hideOverlay()` hace blur. `#bar` tampoco se aísla. No hay `role=dialog`, nombre, foco inicial/restaurado o bucle Tab del panel superior.
- Instrucción: Implementar pila de overlays: sólo el superior `inert=false`; los otros visibles permanecen visualmente debajo pero `inert=true`. Marcar `#bar`, `#lesson-panel` y la superficie interactiva del juego inertes cuando haya overlay. Para Ajustes/Ayuda/Galería/Coronación, usar diálogo con título asociado y foco inicial al título o primer control; guardar y devolver foco al disparador al cerrar. Tab/Shift+Tab no sale del panel superior. En Coronación no permitir Escape que eluda la elección; mantener Q/R/B/N existentes.
- Copy: 
- Aceptación: Abrir Ajustes desde el menú con teclado; Shift+Tab no alcanza ¡A jugar! detrás; cerrar vuelve a Ajustes. Abrir Galería y Cómo jugar conserva el mismo comportamiento. Durante Coronación sólo se puede elegir pieza; al terminar vuelve la navegación de tablero. Probar los cuatro anchos, también scroll.
- Referencias: Archivo: current_1410/salchidrez.html
Líneas: 562-632,5614-5617,5624-5642,5698-5705
- Notas: Problema identificado en fuente; showOverlay sólo libera inert del nuevo panel; no aísla overlay inferior/barra ni mueve/restaura foco.

## [RSP-SALCHIDREZ-02] P1 · active · Responsive y controles
**El tablero visual carece de equivalente semántico**
- Actual: El juego se dibuja en un canvas sin nombre/estructura alternativa. La navegación de flechas y Enter sí existe, pero posición de `kb.sq`, pieza, legalidad y turno no se publican en DOM accesible.
- Instrucción: Conservar el canvas visual y crear representación DOM sincronizada de 8×8 con `role=grid`, nombre «Tablero de ajedrez», una sola celda tabulable y etiquetas como «e2, peón crema». Flechas y Enter deben usar la misma `kb.sq`/`keyActivate`; comunicar casilla seleccionada y destinos legales mediante atributos/descripcion, no sólo por color. Publicar turno, jaque, captura y resultado en una región `aria-live=polite`, sin anunciar cada frame. Al rotar el tablero mantener la correspondencia entre coordenadas visuales y semánticas. Alternativamente una tabla accesible de estado y controles de origen/destino, pero no un simple aria-label genérico.
- Copy: 
- Aceptación: Con lector y teclado se puede identificar posición inicial, seleccionar e2, mover a e4 y oír turno/jugada sin leer pixeles. Deshacer, pista, aprendizaje, tablero girado y promoción sincronizan los estados. Sin impacto visual a 320/360/390/768.
- Referencias: Archivo: current_1410/salchidrez.html
Líneas: 531,5620-5695
- Notas: Problema identificado en fuente; Canvas sin representación de tablero semántico; teclado de tablero sí existe. No anunciar falta de teclado.

## [PLAY-SALCHI-01] P2 · active · Prueba interactiva y propuestas
**Distinguir turno de máquina y acción humana**
- Actual: Durante la animación posterior a e2-e4, la tarjeta La máquina mostró Toca o arrastra un perro; luego volvió a NivelCachorro.
- Instrucción: Derivar los mensajes del turno y del modo: la IA está pensando, está ejecutando su movimiento, el humano puede mover o la partida terminó. Nunca invitar al usuario a mover piezas de la IA.
- Copy: La máquina está pensando…
La máquina está moviendo.
Te toca: elegí un perro.
- Aceptación: Desde cada movimiento humano hasta que termina la respuesta de la IA, la tarjeta de la máquina no muestra una invitación a mover dirigida al humano.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:48:00Z/2026-10-22T14:52:00Z

## [PLAY-SALCHI-02] P2 · active · Prueba interactiva y propuestas
**Aclarar alcance de Deshacer**
- Actual: Deshacer quitó la segunda jugada del usuario y la respuesta de la IA; el menú confirmó la movida 1. La etiqueta no indica que retrocede dos medias jugadas.
- Instrucción: Añadir una descripción contextual visible al consultar el control y un nombre accesible. En el modo contra IA, anunciar la reversión de la jugada del usuario y de la respuesta; en local, describir la última jugada que realmente se deshace. Si el comportamiento difiere entre modos, describirlo sin modificar la regla.
- Copy: Deshacer tu jugada y la respuesta de la máquina
Deshacer última jugada
- Aceptación: Verificar ambos modos y comunicar exactamente cuántos turnos se revierten.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:48:00Z/2026-10-22T14:52:00Z

## [PLAY-SALCHI-03] P2 · active · Prueba interactiva y propuestas
**Ofrecer salida para revisar el mate**
- Actual: El resultado tapa todo el tablero y sólo ofrece Revancha/Menú; no explica la línea que amenaza al rey.
- Instrucción: Agregar «Ver tablero final». Mostrar el rey amenazado y la línea de ataque sin alterar las piezas. Desde esa vista, permitir volver al resultado o deshacer según las reglas existentes. La explicación debe nombrar el equipo del rey en mate, no fijar el equipo del ejemplo observado.
- Copy: Ver tablero final
El rey {equipo} está en jaque y no tiene una jugada legal para escapar.
Volver al resultado
- Aceptación: Tras el mate de la partida local observada, se puede revisar la línea h4-e1 sin reiniciar ni perder el resultado.
- Referencias: evidence/salchidrez-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T14:48:00Z/2026-10-22T14:52:00Z

## [PLAY-SALCHI-04] P2 · active · Prueba interactiva y propuestas
**Clarificar nombres de estadísticas finales**
- Actual: El resultado dice 2 Movidas, 0 Comió Crema y 0 Comió Chocolate después de 4 medias jugadas; el lenguaje puede confundirse con el número de piezas o de turnos.
- Instrucción: Usar «Jugadas completas» para el conteo correspondiente y «Piezas capturadas por Crema/Chocolate» para las capturas de cada equipo. Si se mantiene la notación de ajedrez, explicar el conteo en una descripción consultable. No cambiar la métrica para ajustarla a una etiqueta.
- Copy: Jugadas completas
Piezas capturadas por Crema
Piezas capturadas por Chocolate
- Aceptación: El mate en 2 se muestra como 2 jugadas completas o 4 turnos, según la métrica presentada, nunca como una cantidad sin unidad clara.
- Referencias: evidence/salchidrez-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T14:48:00Z/2026-10-22T14:52:00Z

## [PLAY-SALCHI-05] P2 · active · Prueba interactiva y propuestas
**Semántica de piezas, selección y sonido**
- Actual: Durante el juego, el árbol de accesibilidad sólo contiene la imagen game y la barra; no describe el tablero, el turno ni la selección. Los botones Música/Sonidos no informan activado/desactivado en sus nombres ni en su estado.
- Instrucción: Añadir una representación accesible del tablero por filas y casillas, con pieza, equipo y destinos legales; una región para el turno; y estado aria-pressed en los controles de audio. Conservar las siluetas clásicas visibles. Los nombres de casilla, pieza, equipo y turno deben proceder del estado real.
- Copy: {casilla}: {pieza} {equipo}
Turno de {equipo}
Música desactivada
Sonidos desactivados
- Aceptación: Con teclado y lector de pantalla se pueden seleccionar una pieza y su destino. Un control de audio apagado sigue siendo legible y accionable: no parece deshabilitado.
- Referencias: evidence/salchidrez-pass1-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T14:48:00Z/2026-10-22T14:52:00Z

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

## [RSP-SALCHIDREZ-03] P2 · active · Responsive y controles
**Publicar selección de rival, dificultad, color y tablero**
- Actual: Selección se expresa sólo con `.on`; los botones no tienen pressed/checked. `syncCards()` y los handlers cambian clases, no estado accesible. Los temas tienen nombre pero no indican elegido.
- Instrucción: Convertir cada grupo en radios nativos, o mantener botones con `role=group` y etiqueta de grupo + `aria-pressed`; sincronizar el mismo estado en `syncCards()`, restauración de partida y clicks. Para temas, añadir `aria-pressed` a todas las opciones cada vez que cambie. No usar disabled para la opción actualmente seleccionada. Dejar `ai-opts.hidden` como está para ocultar opciones inaplicables.
- Copy: 
- Aceptación: Árbol accesible anuncia exactamente una selección por grupo; cambiar rival a amigo retira dificultad/color de navegación y al volver conserva valores válidos. Restaurar una partida no deja pressed y clase divergentes. Probar teclado y anchos 320/360/390/768.
- Referencias: Archivo: current_1410/salchidrez.html
Líneas: 581-605,2162-2167,5381-5415,5546-5549
- Notas: Problema identificado en fuente; Rival/dificultad/color/tema sólo alternan .on; aria-pressed nuevo es exclusivamente del selector de idioma.

## [RSP-SALCHIDREZ-04] P2 · active · Responsive y controles
**Respetar los insets laterales en overlays y no reducir flechas de galería en horizontal**
- Actual: Overlays tienen padding vertical con safe-area pero laterales fijos de 16 px; la galería apaisada reduce las flechas de 44 a 40 px.
- Instrucción: `.overlay{padding-left:calc(16px + env(safe-area-inset-left,0px));padding-right:calc(16px + env(safe-area-inset-right,0px))}`. Eliminar la reducción de `.garrow` a 40 px y mantener `width:44px;height:44px;flex:0 0 44px` en horizontal. La galería puede seguir desplazándose y su panel sigue limitado a 720 px; no encoger controles para ganar altura.
- Copy: 
- Aceptación: En 768×390/844×390 con inset lateral, flechas y bordes de tarjetas quedan dentro del área segura; ambas flechas son de 44×44 px o mayores; se llega por scroll al cierre. A 320/360/390 vertical conserva una tarjeta por vista, sin cortar texto; a 768 vertical se respeta el ancho máximo.
- Referencias: Archivo: current_1410/salchidrez.html
Líneas: 189-197,486-508
- Notas: Regla identificada en fuente con riesgo inferido; Padding horizontal de overlay sigue fijo 16 px; flechas de galería bajan a 40 px en horizontal.

## [SRC-CH02] P2 · active_source_finding · Texto, estados y flujo
**#btn-resume y #btn-start**
- Actual: Continuar partida; ¡A jugar!
- Instrucción: Con partida guardada, #btn-start llama newGame sin confirmación, mientras #btn-resume restaura el guardado. Cambiar el primer botón a Nueva partida y pedir confirmación antes de reemplazar. Mantener el resumen existente del guardado (oponente y movida).
- Copy: Continuar partida / Nueva partida
- Aceptación: Guardar partida contra IA; cambiar selección en menú: Continuar restaura partida original, Nueva partida muestra efecto de reemplazo sin borrar hasta confirmar.
- Referencias: https://jetgames.fun/salchidrez/ — current_1410/salchidrez.html:576–607,2170–2183,5438–5453
- Notas: Riesgo confirmado en fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-SALCHIDREZ-01] P2 · active_proposal · Dirección visual interna
**Mejorar coordenadas sin quitar el tablero acolchado**
- Actual: THEMES define seis pares light/dark y marcos propios; drawBoard() dibuja costura [7,6], borde 3 px, viñeta alpha .12 y coordenadas dentro de las casillas con max(9,.16s), color BOARD.label.
- Instrucción: Mantener todas las paletas y la costura. Mover letras/números al margen interior del marco cuando fr permita al menos 12 px, dejando 2 px de separación del área de juego; en marcos menores conservar su posición actual pero dar a cada carácter un pequeño respaldo del color claro del tema al 90%. Fuente mínima 11 px cuando s>=32; a tamaños menores mantener 9 px, sin reducir más. Atenuar la viñeta final a alpha .08 para que no cambie tanto la luminosidad entre centro y esquinas.
- Copy: 
- Aceptación: En los seis temas, con tablero girado y sin girar, se leen a1/h8 y no hay coordenadas debajo de perros. Las casillas claras/oscuras conservan su alternancia. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/salchidrez.html
lines: 1934–1947,3175–3214
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: Las coordenadas deben seguir flipped: letras y números no se fijan al lado de la pantalla. No alterar sqXY, L.s ni el tablero 8×8.

## [VIS-SALCHIDREZ-02] P2 · active_proposal · Dirección visual interna
**Separar visualmente selección, última jugada, foco y captura**
- Actual: Última jugada usa rellenos amarillos alpha .35/.5; selección amarillo alpha .7; foco teclado marco cian con halo animado; captura borde rosa discontinuo con desplazamiento; movimientos legales usan huesitos que flotan.
- Instrucción: Conservar los huesitos y los colores funcionales. Última jugada: reducir relleno a .16 y añadir dos pequeñas esquinas interiores de 2 px, sin animación. Selección: relleno amarillo .22 más borde sólido de 3 px, para no teñir la pieza. Foco: mantener cian pero halo fijo máximo 6 px; captura: borde rosa discontinuo fijo, con pulso único al seleccionar, no marcha continua. El rey en jaque mantiene su indicador rojo y no se sustituye por el estado de selección.
- Copy: 
- Aceptación: En escala de grises se distingue selección del recuerdo de última jugada por contorno/relleno . Tab/flechas no borra destinos legales. Captura, jaque y foco simultáneos no se tapan entre sí. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/salchidrez.html
lines: 2771–2788,2840–2860
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No añadir destinos que no estén en selMoves ni modificar inCheck, en passant o promoción. Las marcas se derivan únicamente del estado existente.

## [VIS-SALCHIDREZ-03] P2 · active_proposal · Dirección visual interna
**Simplificar el retrato pequeño conservando los atributos de cada pieza**
- Actual: La familia de dibujo tiene drawDog/drawDogHead y accesorios específicos: corona, mitra, torre y caballero. drawPieceBadge() ya usa siluetas vectoriales clásicas y colores marfil/chocolate con contorno contrastante.
- Instrucción: Crear una variante de detalle reducido para casilla<40 px: conservar cabeza, hocico, cuerpo, orejas y el accesorio que identifica el tipo; omitir pestañas minúsculas, perlas individuales, reflejos secundarios y ornamentación interior. Reutilizar drawTypeIcon/drawPieceBadge para una insignia opcional de tipo en la pieza seleccionada y en la ficha explicativa; no cubrir permanentemente los 32 perros con iconos. Tamaño de insignia máximo .28s, separada 2 px del hocico, y contorno de 1.5 px.
- Copy: 
- Aceptación: En 320 px y modo aprendizaje se identifica cada tipo sin ampliar; el detalle ampliado sigue mostrando el perro original. Ninguna insignia oculta el borde de la casilla ni la marca de jaque. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/salchidrez.html
lines: 1181–1188,1280–1290,1442–1450,1561–1568,1684–1694,3264–3289
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No reemplazar perros por símbolos clásicos ni cambiar el aspecto marfil/chocolate de cada bando. Corona/mitra/torre/caballo deben seguir identificando las mismas piezas.

## [VIS-SALCHIDREZ-04] P2 · active_proposal · Dirección visual interna
**Dejar que el fondo acompañe, no que compita con la decisión**
- Actual: drawBackground() incluye 46 estrellas pulsantes de noche,60 copos en nieve, nubes en movimiento y lomas; la pieza seleccionada rebota .08s mediante sin(now*.012). La media query CSS reduce .btn.wiggle, no estas operaciones canvas.
- Instrucción: Conservar el ambiente de cada tema, pero dibujar partículas sólo fuera del rectángulo acolchado más 8 px de margen. En partida limitar noche a 24 estrellas visibles y nieve a 24 copos; en menú puede mantenerse la densidad actual. Con prefers-reduced-motion detener desplazamiento/titileo y quitar el rebote continuo de la pieza seleccionada; representar selección con el borde estable anterior. Las animaciones narrativas de captura/promoción pueden tener una versión de fundido 120 ms sin sacudir cámara.
- Copy: 
- Aceptación: Comparar tema Nieve y Noche con movimiento reducido activado/desactivado: estados idénticos, ambiente reconocible y ninguna partícula atraviesa el tablero. La selección permanece clara sin rebote. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/salchidrez.html
lines: 3096–3170,2889–2911,523–525
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No modificar duración del turno, IA o resolución de una jugada. Quitar animación ornamental no debe suprimir jaque, captura, promoción ni resultado.

## [SRC-CH01] P3 · active_source_finding · Texto, estados y flujo
**#ld-next; #ld-again; #btn-gameover-menu**
- Actual: Siguiente; Otra vez; Menú
- Instrucción: Conservar Revancha para otra partida de ajedrez, no reemplazar por genérico Reintentar. Separar opciones de aprender y jugar; no alterar niveles o personajes por homogenización.
- Copy: Siguiente lección; Repetir lección; Volver al menú
- Aceptación: Final de lección y fin de partida tienen acciones distintas y no confunden repetir lección con revancha.
- Referencias: https://jetgames.fun/salchidrez/ — current_1410/salchidrez.html:694–696,734,5206–5207,5318–5319
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

# Copys ES/EN aplicables
- COPY-common-continue-save [SRC-G03, SRC-B02, SRC-CH02, SRC-TE02] es-AR: «Continuar partida» | en: «Continue game» | contexto: Continuar recupera un guardado; Nueva partida inicia sesión desde el estado inicial. No exige tablero ni semilla diferentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Continuar partida']
- COPY-common-newgame [SRC-G03, SRC-B02, SRC-CH02, SRC-TE02] es-AR: «Nueva partida» | en: «New game» | contexto: Continuar recupera un guardado; Nueva partida inicia sesión desde el estado inicial. No exige tablero ni semilla diferentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-sound-on [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Sonido activado» | en: «Sound on» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-sound-off [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Sonido desactivado» | en: «Sound off» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-mute [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Silenciar todo» | en: «Mute all» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-music [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Música» | en: «Music» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-effects [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Efectos» | en: «Sound effects» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-music-volume [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-ANTES-06, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Volumen de música» | en: «Music volume» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-effects-volume [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-ANTES-06, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Volumen de efectos» | en: «Sound effects volume» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-music-off [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Música desactivada» | en: «Music off» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-effects-off [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Efectos desactivados» | en: «Sound effects off» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-next-lesson [SRC-CH01, SRC-CH02] es-AR: «Siguiente lección» | en: «Next lesson» | contexto: Nueva partida y Continuar partida usan cadenas comunes. Mostrar oponente/movida del guardado existente. Nueva partida no borra hasta confirmar; lección y revancha no son equivalentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-replay-lesson [SRC-CH01, SRC-CH02] es-AR: «Repetir lección» | en: «Replay lesson» | contexto: Nueva partida y Continuar partida usan cadenas comunes. Mostrar oponente/movida del guardado existente. Nueva partida no borra hasta confirmar; lección y revancha no son equivalentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-rematch [SRC-CH01, SRC-CH02] es-AR: «Revancha» | en: «Rematch» | contexto: Nueva partida y Continuar partida usan cadenas comunes. Mostrar oponente/movida del guardado existente. Nueva partida no borra hasta confirmar; lección y revancha no son equivalentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-replace-title [SRC-CH01, SRC-CH02] es-AR: «¿Reemplazar la partida guardada?» | en: «Replace the saved game?» | contexto: Nueva partida y Continuar partida usan cadenas comunes. Mostrar oponente/movida del guardado existente. Nueva partida no borra hasta confirmar; lección y revancha no son equivalentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-replace-body [SRC-CH01, SRC-CH02] es-AR: «La partida guardada se reemplazará por una nueva.» | en: «The saved game will be replaced with a new one.» | contexto: Nueva partida y Continuar partida usan cadenas comunes. Mostrar oponente/movida del guardado existente. Nueva partida no borra hasta confirmar; lección y revancha no son equivalentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-thinking [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «La máquina está pensando…» | en: «The computer is thinking…» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-moving [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «La máquina está moviendo.» | en: «The computer is making its move.» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-your-turn [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Te toca: elegí un perro.» | en: «Your turn: choose a dog.» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-undo-ai [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Deshacer tu jugada y la respuesta de la máquina» | en: «Undo your move and the computer’s reply» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-undo-local [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Deshacer última jugada» | en: «Undo last move» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-final-board [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Ver tablero final» | en: «View final board» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-mate [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «El rey de {equipo} está en jaque y no tiene una jugada legal para escapar.» | en: «The king for {equipo} is in check and has no legal move to escape.» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'equipo', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-salchi-back-result [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Volver al resultado» | en: «Back to results» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-full-moves [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Jugadas completas» | en: «Full moves» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-captures [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Piezas capturadas por {equipo}» | en: «Pieces captured by {equipo}» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'equipo', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-salchi-square [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «{casilla}: {pieza} de {equipo}» | en: «{casilla}: {pieza} for {equipo}» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'casilla', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'pieza', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'equipo', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-salchi-turn [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Turno de {equipo}» | en: «{equipo}’s turn» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'equipo', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-salchi-board [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Tablero de ajedrez» | en: «Chessboard» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-opponent [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Rival» | en: «Opponent» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-difficulty [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Dificultad» | en: «Difficulty» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-color [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Color» | en: «Color» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-salchi-board-style [PLAY-SALCHI-01, PLAY-SALCHI-02, PLAY-SALCHI-03, PLAY-SALCHI-04, PLAY-SALCHI-05, RSP-SALCHIDREZ-02, RSP-SALCHIDREZ-03] es-AR: «Tablero» | en: «Board» | contexto: Equipo/pieza/casilla desde estado real, no e4 ni Crema hardcodeados. Mantener nombres propios de bandos/personajes según localización existente. No mostrar turno humano mientras IA piensa/ejecuta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
