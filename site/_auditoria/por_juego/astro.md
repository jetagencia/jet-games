# astro: 15 registros del catálogo, 25 copys

## [RSP-ASTRO-01] P1 · active · Responsive y controles
**No dejar «Despegar/Reanudar» invisible en el orden Tab**
- Actual: P1 · alta · confirmado por fuente. `current_1410/astro.html:114` oculta `#overlay.hidden` sólo con `opacity:0;pointer-events:none`; 582/595 agregan clase y hacen `playBtn.blur()`. El botón sigue en el DOM enfocable; `start()` puede ser invocado desde su click aunque una partida ya esté corriendo.
- Instrucción: Centralizar `setOverlayVisible(on)`: `overlay.hidden=!on; overlay.inert=!on; overlay.setAttribute('aria-hidden',String(!on))`, más `#overlay[hidden]{display:none}`. Si se desea transición, hacer inert inmediatamente y hidden al final; no usar opacity como estado único. Al abrir pausa/final, enfocar `#play`; al cerrar, mover foco a `#c` con `tabindex=0` y nombre/descripción de controles, no a body. Guardar/restaurar foco cuando corresponda.
- Copy: 
- Aceptación: Iniciar, pulsar Tab repetidamente: no aparece foco en Despegar/Reanudar oculto y no se puede reiniciar una partida desde un control invisible. Pausa por teclado devuelve un foco visible.
- Referencias: Archivo: current_1410/astro.html
Líneas: 114
Archivo: current_1410/astro.html
Líneas: 114,582,595
- Notas: Problema identificado en fuente; El overlay invisible ahora contiene también el selector ES/EN; sigue sin hidden/inert. Mantener todos sus descendientes fuera de Tab durante partida.

## [RSP-ASTRO-02] P1 · active · Responsive y controles
**Enter/Espacio deben activar el botón/enlace enfocado, no saltar**
- Actual: P1 · alta · confirmado por fuente. `current_1410/astro.html:1015–1026`: el listener global sólo excluye `.ja`, `.lang-seg` y `#play`. Enter sobre `#back` o `#pause` cae en `preventDefault();primary()`.
- Instrucción: Antes de procesar movimiento/salto, devolver si `e.defaultPrevented`, modificadores Ctrl/Meta/Alt o `e.target.closest('button,a,input,select,textarea,[contenteditable=true],[role=button]')`; dejar que click nativo active esos controles. Procesar P/Escape como atajos sólo fuera de inputs y sin duplicarlos con un botón. Conservar Space/Up/W en el canvas/cuerpo de partida.
- Copy: 
- Aceptación: Tab→Volver→Enter navega; Tab→Pausa→Enter/Espacio pausa una vez, nunca salta; los sliders de sonido responden a flechas sin afectar partida; Space sobre superficie sigue saltando.
- Referencias: Archivo: current_1410/astro.html
Líneas: 1015–1026
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [PLAY-ASTRO-01] P2 · active · Prueba interactiva y propuestas
**Completar instrucciones antes de jugar**
- Actual: `Espacio o ↑ para saltar · mantén para llegar más alto`. Sólo en partida se explica `↓ baja rápido · P pausa`.
- Instrucción: Mostrar junto a «Despegar» un bloque breve de controles adaptado al dispositivo, sin esperar a que comience el movimiento.
- Copy: Espacio o ↑: saltar · Mantené para subir más · ↓: bajar rápido · P: pausar
- Aceptación: Un jugador nuevo puede conocer todos los controles sin perder ni iniciar una partida. Ocultar las instrucciones táctiles cuando no correspondan al dispositivo.
- Referencias: 
- Notas: Actual inicio: `Espacio o ↑ para saltar · mantén para llegar más alto`. Sólo en partida se explica `↓ baja rápido · P pausa`.
Texto desktop: `Espacio o ↑: saltar · Mantené para subir más · ↓: bajar rápido · P: pausar`. No agregar Esc al texto antes de verificar o implementar un handler seguro. En esta pasada se probó P; el texto de pausa menciona Esc para seguir, pero no se comprobó Esc para pausar.
Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-ASTRO-02] P2 · active · Prueba interactiva y propuestas
**Pausa con acciones completas**
- Actual: Se muestran `EN PAUSA`, `Continuar` y `Esc o P para seguir`; la única salida adicional es el enlace global `JET//GAMES`, fuera de la superposición.
- Instrucción: Usar «Reanudar partida» como acción principal. Agregar una fila secundaria con «Reiniciar partida» y «Salir al menú». Si salir hace perder el intento, pedir confirmación: «¿Salir de la partida? Perderás este intento.», con «Seguir jugando» y «Salir».
- Copy: Reanudar partida
Reiniciar partida
Salir al menú
¿Salir de la partida? Perderás este intento.
Seguir jugando
Salir
- Aceptación: No confundir el regreso al catálogo con el menú del juego. P reanuda la partida. Verificar por separado el comportamiento de Esc anunciado actualmente antes de conservar ese texto. El foco permanece dentro de la superposición; cancelar mantiene la partida.
- Referencias: evidence/astro-pass1.jpg
- Notas: Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-ASTRO-03] P2 · active · Prueba interactiva y propuestas
**Resultado con explicación útil**
- Actual: `IMPACTO`, `0 puntos`, `Récord:0`, `Reintentar`; no consejo.
- Instrucción: Mantener la puntuación y la acción de reintento. Añadir debajo del título una explicación del resultado que no dependa del sonido ni del color.
- Copy: Chocaste con un asteroide.
Mantené Espacio o ↑ para saltar más alto.
- Aceptación: La causa es visible y el consejo corresponde al resultado real. A 360 px, no se tapan la puntuación ni el botón de reintento.
- Referencias: evidence/astro-pass2-result.jpg
- Notas: Texto: `Chocaste con un asteroide.` / `Mantené Espacio o ↑ para saltar más alto.`
Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-ASTRO-04] P2 · active · Prueba interactiva y propuestas
**Sonido explícito, no inferir por icono**
- Actual: El botón accesible sólo se llama `Sonido`. Abre Música al 70% y Efectos al 80%, ambos activos por defecto en la interfaz. El navegador estaba silenciado: no se midió reproducción automática audible.
- Instrucción: Como decisión de producto propuesta, adoptar una preferencia global inicial de silencio o solicitar activación explícita. El botón debe comunicar el estado con «Sonido desactivado» o «Sonido activado». Mostrar porcentajes legibles y ofrecer «Silenciar todo» en un clic. Persistir la decisión y no reactivar sonido al reintentar.
- Copy: Sonido desactivado
Sonido activado
Silenciar todo
- Aceptación: La navegación y el reintento respetan el silencio. Los controles exponen su estado semántico. No presentar esta prueba como confirmación de que se reprodujo audio.
- Referencias: 
- Notas: El navegador o el sitio estaban silenciados para impedir la reproducción audible. Se observaron controles de audio activados en la interfaz; no se probó ni se oyó reproducción automática.
Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

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

## [SRC-A01] P2 · active_source_finding · Texto, estados y flujo
**#play en over/pause; #ov-hint**
- Actual: ↻ Reintentar; ▶ Continuar; Toca la pantalla para reintentar; Toca para seguir
- Instrucción: Mantener CTA explícito para reintentar/reanudar; no usar toda pantalla como zona que puede dispararse accidentalmente al cerrar resultados. Preservar nombre temático Despegar al inicio. Añadir enlace secundario Volver a los juegos en resultados/pausa si el existente está oculto u ocupado, sin otra pestaña.
- Copy: Reintentar vuelo; Reanudar partida; Activá Reintentar vuelo para empezar de nuevo.
- Aceptación: Morir manteniendo dedo/tecla no inicia partida nueva; soltar y activación nueva requerida; pausa se conserva al cambiar pestaña y sólo se reanuda voluntariamente.
- Referencias: https://jetgames.fun/astro/ — current_1410/astro.html:382–409,444–451,573–600
- Notas: Recomendación de estado y texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-ASTRO-01] P2 · active_proposal · Dirección visual interna
**Cielo y suelo con profundidad clara**
- Actual: Archivo: ui_audit/source_review/current_1410/astro.html
Líneas: 757–816
Funciones: draw
Selectores: 
Valores literales de la fuente: background #020208 → #080b1a → #0a0d20
nebula alpha TALL?0.11:0.08
starsBack alpha 0.25+tw*0.5
Júpiter #fdba74 → #fb923c → #7c2d12
ground line rgba(119,0,244,0.6), 1px
- Instrucción: Conservar Júpiter naranja y el suelo mineral como firma del juego. Reducir la luminancia de estrellas decorativas próximas al corredor del astronauta: máximo 0,45 de opacidad allí, manteniendo las estrellas más brillantes en el cielo superior. Conservar las nebulosas al nivel tenue actual, sin añadir otra capa neón. Hacer el borde del suelo continuo y nítido con un trazo de 1–2 píxeles de pantalla, ajustado al DPR, y sin halo ancho. No llevar Júpiter hacia el recorrido para llenar espacio vacío.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- star_corridor_alpha_max: 0.45
- nebula_alpha: 0.08 paisaje/0.11 retrato, conservar
- ground_edge: #71608F,1.5 CSS px ajustado al DPR, sin glow
- Jupiter_palette: #FDBA74/#FB923C/#7C2D12, conservar
- Copy: 
- Aceptación: En retrato y paisaje se distingue el suelo real de las montañas y el cielo. Asteroides pequeños siguen visibles cuando pasan delante de las zonas claras de fondo . Coordenadas y tiempos de salto permanecen idénticos.
- Referencias: ui_audit/source_review/current_1410/astro.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No desplazar GROUND ni el corredor de salto; no alterar tamaños de obstáculos. El borde representa el suelo real. Júpiter y montañas siguen siendo decoración, no nuevos obstáculos.

## [VIS-ASTRO-02] P2 · active_proposal · Dirección visual interna
**Siluetas de astronauta y peligros**
- Actual: Archivo: ui_audit/source_review/current_1410/astro.html
Líneas: 818–846; 937–959
Funciones: draw
drawAstronaut
Selectores: 
Valores literales de la fuente: obstáculo normal #64748b/#334155/#0f172a
meteorito #fdba74/#9a3412/#2a0f0a
contorno normal rgba(119,0,244,0.5) width=1
OFICIAL(ctx,...)
jetpack #22d3ee → #7c3aed
- Instrucción: Mantener el astronauta oficial, no reemplazarlo por un icono genérico. Mejorar la separación de asteroides comunes con un borde mineral gris claro de 1–1,5 px, en vez de depender únicamente del filo violeta; conservar meteoritos cálidos y su estela. Dibujar brillos dentro de la silueta, sin agrandar visualmente la zona sólida. Mantener la llama del jetpack detrás del cuerpo y recortar partículas decorativas que invadan el contorno del casco. El aviso triangular del meteorito entrante debe conservar su altura exacta y no confundirse con decoración.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- common_asteroid_edge: #94A3B8 a 0.75,1.25 CSS px
- meteor_edge: color cálido existente,1.25 CSS px
- avatar_body: sprite OFICIAL sin reemplazo
- particle_margin: no dibujar adornos a menos de 2 CSS px del casco sólido
- Copy: 
- Aceptación: En estados a escala pequeña, astronauta, asteroide normal y meteorito son distinguibles en imagen estática y en escala de grises. La estela no se interpreta como cuerpo colisionable; los límites principales coinciden con los anteriores.
- Referencias: ui_audit/source_review/current_1410/astro.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: La geometría a.shape, dimensiones a.w/a.h/a.r, hitboxes del astronauta y posición del aviso no cambian. No aumentar transparencia de peligros ni ocultarlos por estilo.

## [VIS-ASTRO-03] P2 · active_proposal · Dirección visual interna
**Paneles de estado legibles**
- Actual: Archivo: ui_audit/source_review/current_1410/astro.html
Líneas: 111–144; 444–451
Funciones: paintOverlay
Selectores: #overlay
#play
#ov-kicker
#ov-score
#ov-best
#ov-hint
Valores literales de la fuente: #overlay background rgba(2,2,8,0.7), blur(3px)
#play gradient violet→cyan; color #fff
#hud font JetBrains Mono; text-shadow 0 1px 6px
- Instrucción: Convertir las pantallas de inicio, pausa e impacto en una misma tarjeta visual compacta sobre el escenario oscurecido: título/estado, resultado si existe, acción principal y ayuda en ese orden. Conservar la escena de fondo como contexto, pero elevar la opacidad del plano detrás del texto a 0,88 en vez de aumentar el desenfoque. Mantener el gradiente sólo en el acento de marca o borde; para el botón de acción usar un relleno sólido cian con texto oscuro, de modo que toda la etiqueta tenga contraste uniforme. Alinear puntuación y récord por línea base y mostrar el número como elemento principal.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- overlay_plate: rgba(2,2,8,0.88)
- action_fill: #00F2CF
- action_text: #06251F
- card_radius: 16 px
- section_gaps: 12 px datos; 20 px antes del CTA
- score: 32 px, peso 800, tabular-nums
- Copy: 
- Aceptación: Inicio, pausa e impacto comparten alineación y espaciado, pero sus títulos y acciones siguen siendo diferentes. Ningún texto queda sobre una zona brillante de Júpiter sin fondo propio. Validar ambas traducciones y puntuaciones largas.
- Referencias: ui_audit/source_review/current_1410/astro.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No convertir una pausa en derrota ni disparar reinicio al cerrar el panel. Conservar acciones, ES/EN y las diferencias entre ayuda táctil y teclado. No añadir resultados inexistentes.

## [VIS-ASTRO-04] P2 · active_proposal · Dirección visual interna
**Jerarquía de movimiento y efectos**
- Actual: Archivo: ui_audit/source_review/current_1410/astro.html
Líneas: 757–779; 848–860; 937–958
Funciones: draw
drawAstronaut
Selectores: 
Valores literales de la fuente: RM.matches fija parpadeo de starsBack
hito cada 50 puntos; 44px retrato/30px paisaje
s.shake transforma el canvas
llama len=(17 o 10)+random()*6
- Instrucción: Ordenar la animación por importancia: salto y caída siguen visibles; estrellas, llama y celebración son secundarios. En movimiento reducido, conservar el soporte RM existente y extenderlo a sacudida y variación aleatoria decorativa de la llama; usar una llama estable que siga indicando ascenso. En modo normal, limitar el anuncio de hito a una aparición breve fuera de la trayectoria inmediata y sin cubrir obstáculos; evitar que el tamaño del número compita con el personaje. En impacto, usar una señal breve del personaje y del panel, no destellos repetidos de toda la pantalla.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- milestone_visual_duration: 500 ms de énfasis, fuera del corredor; sin prolongar lógica de hito
- milestone_type: 24 px máximo en juego
- reduced_flame: longitud de base 10/17 sin ruido aleatorio, según estado
- reduced_camera: 0 px de desplazamiento
- Copy: 
- Aceptación: Comparar una misma secuencia con movimiento normal/reducido: mismo resultado y mismas posiciones lógicas. El hito no oculta un meteorito entrante; en reducido no hay sacudida ni titilación decorativa.
- Referencias: ui_audit/source_review/current_1410/astro.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No modificar velocidad, gravedad, altura del salto, duración del impulso ni aparición de peligros. La llama sigue apareciendo sólo cuando corresponde al estado de ascenso. No afirmar que RM está ausente.

## [SRC-A02] P3 · active_source_finding · Texto, estados y flujo
**TX.impact / ayudas**
- Actual: Impacto; Espacio · ↑ · clic — mantén para saltar alto · ↓ baja rápido · P pausa
- Instrucción: Separar resultado, motivo y controles; texto de teclado en dos líneas o bloques cortos; versión táctil sin atajos de teclado. No culpar al jugador si motivo real difiere.
- Copy: Fin del vuelo / Chocaste con un asteroide. / Saltar: Espacio, ↑ o clic. Mantené para subir más. Bajada rápida: ↓. Pausa: P.
- Aceptación: Resultado muestra puntaje y récord antes de CTA; controles completos a 320 px sin recortes, se adaptan al dispositivo.
- Referencias: https://jetgames.fun/astro/ — current_1410/astro.html:382–409
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

# Copys ES/EN aplicables
- COPY-common-resume [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-FRENTES-01, PLAY-BALIZAS-04, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Reanudar partida» | en: «Resume game» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Continuar', 'Seguir']
- COPY-common-menu [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-TELEMETRIA-05, PLAY-PORTADA-06, PLAY-FRENTES-02] es-AR: «Volver al menú» | en: «Back to menu» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-catalog [SRC-G01, SRC-G03, SRC-G05, SRC-A01, SRC-JU02] es-AR: «Volver a los juegos» | en: «Back to games» | contexto: Destino: catálogo de JET//Games en la ruta canónica ya existente; conservar idioma. No history.back como único destino. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
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
- COPY-astro-start [SRC-A01, SRC-A02, PLAY-ASTRO-01, PLAY-ASTRO-03] es-AR: «Despegar» | en: «Take off» | contexto: Controles de escritorio ya descritos en fuente. No añadir Escape ni W a la ayuda sin verificar. Causa de choque sólo si corresponde; táctil usa el gesto realmente implementado, no esta cadena. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-astro-retry [SRC-A01, SRC-A02, PLAY-ASTRO-01, PLAY-ASTRO-03] es-AR: «Reintentar vuelo» | en: «Retry flight» | contexto: Controles de escritorio ya descritos en fuente. No añadir Escape ni W a la ayuda sin verificar. Causa de choque sólo si corresponde; táctil usa el gesto realmente implementado, no esta cadena. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-astro-retry-help [SRC-A01, SRC-A02, PLAY-ASTRO-01, PLAY-ASTRO-03] es-AR: «Activá «Reintentar vuelo» para empezar de nuevo.» | en: «Select “Retry flight” to start again.» | contexto: Controles de escritorio ya descritos en fuente. No añadir Escape ni W a la ayuda sin verificar. Causa de choque sólo si corresponde; táctil usa el gesto realmente implementado, no esta cadena. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-astro-end [SRC-A01, SRC-A02, PLAY-ASTRO-01, PLAY-ASTRO-03] es-AR: «Fin del vuelo» | en: «Flight over» | contexto: Controles de escritorio ya descritos en fuente. No añadir Escape ni W a la ayuda sin verificar. Causa de choque sólo si corresponde; táctil usa el gesto realmente implementado, no esta cadena. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-astro-asteroid [SRC-A01, SRC-A02, PLAY-ASTRO-01, PLAY-ASTRO-03] es-AR: «Chocaste con un asteroide.» | en: «You hit an asteroid.» | contexto: Controles de escritorio ya descritos en fuente. No añadir Escape ni W a la ayuda sin verificar. Causa de choque sólo si corresponde; táctil usa el gesto realmente implementado, no esta cadena. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-astro-controls [SRC-A01, SRC-A02, PLAY-ASTRO-01, PLAY-ASTRO-03] es-AR: «Saltar: Espacio, ↑ o clic. Mantené para subir más. Bajada rápida: ↓. Pausa: P.» | en: «Jump: Space, ↑ or click. Hold to go higher. Drop quickly: ↓. Pause: P.» | contexto: Controles de escritorio ya descritos en fuente. No añadir Escape ni W a la ayuda sin verificar. Causa de choque sólo si corresponde; táctil usa el gesto realmente implementado, no esta cadena. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-astro-jump-tip [SRC-A01, SRC-A02, PLAY-ASTRO-01, PLAY-ASTRO-03] es-AR: «Mantené Espacio o ↑ para saltar más alto.» | en: «Hold Space or ↑ to jump higher.» | contexto: Controles de escritorio ya descritos en fuente. No añadir Escape ni W a la ayuda sin verificar. Causa de choque sólo si corresponde; táctil usa el gesto realmente implementado, no esta cadena. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-astro-restart [PLAY-ASTRO-02] es-AR: «Reiniciar partida» | en: «Restart game» | contexto: Pausa→menú del juego; usar common-menu para confirmar, no Salir ambiguo. Advertencia sólo si efectivamente se descarta el intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-astro-exit-title [PLAY-ASTRO-02] es-AR: «¿Volver al menú?» | en: «Return to the menu?» | contexto: Pausa→menú del juego; usar common-menu para confirmar, no Salir ambiguo. Advertencia sólo si efectivamente se descarta el intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-astro-exit-body [PLAY-ASTRO-02] es-AR: «Vas a perder este intento.» | en: «You’ll lose this attempt.» | contexto: Pausa→menú del juego; usar common-menu para confirmar, no Salir ambiguo. Advertencia sólo si efectivamente se descarta el intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-astro-stay [PLAY-ASTRO-02] es-AR: «Seguir jugando» | en: «Keep playing» | contexto: Pausa→menú del juego; usar common-menu para confirmar, no Salir ambiguo. Advertencia sólo si efectivamente se descarta el intento. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
