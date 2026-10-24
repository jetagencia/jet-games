# raid: 13 registros del catálogo, 17 copys

## [RSP-RAID-01] P1 · active · Responsive y controles
**Rotar el dispositivo no debe encerrar al usuario detrás de un overlay sin salida**
- Actual: P1 · alta · confirmado por fuente; manifestación durante la ejecución pendiente de comprobar. `current_1410/raid__style.css:367–372`: `.rotate` con z-index 60 aparece con `body.playing` en portrait+coarse. `current_1410/raid.html:237` sólo mensaje, sin acción. `current_1410/raid__raid.js:4283`, `bi()` pausa sin quitar `.playing`; `Wi()` añade playing y empieza simulación. El listener orientationchange sólo pausa al cambiar, no al iniciar ya en vertical.
- Instrucción: Comprobar orientación antes de iniciar misión: si coarse+portrait, no arrancar temporizador/física, mostrar un diálogo de orientación con acción ≥44 px «Volver a la misión» que regrese al briefing. Al girar horizontal continuar sólo por acción explícita o reanudar el estado preparado sin duplicar lanzamiento. Si se gira durante partida, pausar y permitir ver el menú Pausa: limitar la regla de `.rotate` a un estado específico `data-screen=orientation`, nunca al genérico `.playing`. El aviso necesita role dialog, nombre y foco; no tapar Pausa/Ajustes/resultados.
- Copy: 
- Aceptación: Iniciar a 320/360/390 vertical no consume tiempo; se puede volver sin girar. Iniciar horizontal→girar→pausa visible y accionable; regresar horizontal no reanuda inesperadamente ni duplica misión. Verificar también 768×1024 coarse.
- Referencias: Archivo: current_1410/raid__style.css
Líneas: 367–372
Archivo: current_1410/raid.html
Líneas: 237
Archivo: current_1410/raid__raid.js
Líneas: 4283
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-RAID-02] P1 · active · Responsive y controles
**No cancelar Tab durante juego**
- Actual: P1 · alta · confirmado por fuente. `current_1410/raid__raid.js:4216`, constructor de entrada: en `data-screen==='game'` hace preventDefault a array que incluye `Tab`, además de flechas/Space. El HUD contiene 4 botones reales (raid.html, línea 102), pero Tab no llega a ellos.
- Instrucción: Retirar Tab del conjunto; no registrar Tab como movimiento/acción. Ante target botón/enlace/input/range/select/textarea devolver antes de capturar Space/flechas. Si Tab pausa para seguridad, hacerlo una vez sin `preventDefault` y poner foco en Pausa; restaurar al reanudar. No destruir soporte de teclado de la navegación de menús.
- Copy: 
- Aceptación: Partida→Tab alcanza Orientación/Cámara/Pantalla completa/Pausa, cada Enter activa correcto; Shift+Tab vuelve; ningún movimiento queda pegado al cambiar foco.
- Referencias: Archivo: current_1410/raid__raid.js
Líneas: 4216
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [PLAY-RAID-01] P2 · active · Prueba interactiva y propuestas
**Ofrecer una salida útil ante el fallo de inicio gráfico**
- Actual: En /raid/ aparece No pudimos iniciar los gráficos, con REINTENTAR centrado y ayuda técnica. Reintentar volvió al mismo error WebGL Disabled. No hay un enlace visible para volver al catálogo ni identidad del juego en el estado fatal.
- Instrucción: Mantener el centrado correcto que ya existe en /raid/; no trasladarle el defecto posicional observado en Jump. Añadir la identidad JET//Raid y un regreso al catálogo junto a «Volver a cargar», sin atribuir a la red el fallo de contexto gráfico. Si el intento vuelve a fallar, conservar la explicación y las alternativas en vez de inducir un ciclo de reintentos sin información. No prometer que recargar resolverá la incompatibilidad ni modificar automáticamente la configuración del navegador. Diferenciar este botón de carga de «Reintentar misión», que pertenece a una partida iniciada.
- Copy: No pudimos iniciar los gráficos 3D.
Este navegador no pudo crear el contexto gráfico que necesita Raid.
Volver a cargar
Volver a JET//Games
Ver ayuda y detalles
- Aceptación: En una prueba controlada sin WebGL disponible, el fallo repetido conserva una explicación y una salida al catálogo. No se inventan porcentajes de carga ni se rompe el centrado existente. El reintento de carga no se presenta como misión jugada o reiniciada.
- Referencias: evidence/raid-pass1-blocked.jpg
evidence/raid-pass2-retry-blocked.jpg
- Notas: Ventana de observación: 2026-10-22T16:16:00Z/2026-10-22T16:18:10Z
Cobertura: Dos intentos de carga bloqueados; cero partidas.
El bloqueo se observó en el entorno cloud y en la ruta /raid/. No demuestra un fallo en todos los navegadores ni permite evaluar la jugabilidad. El retry estaba centrado y el error gráfico era explícito; no comparte el defecto de posición documentado para Jump.

## [PLAY-RAID-02] P2 · active · Prueba interactiva y propuestas
**Estado fatal accesible y detalles legibles**
- Actual: Aunque el error cubre la pantalla, el árbol de accesibilidad conserva Cargando el juego… y gl; después del fallo, el foco queda en el documento. Los detalles técnicos y las recomendaciones se ven bastante más pequeños y tenues que el título.
- Instrucción: Al entrar en el estado fatal, ocultar o volver inert el cargador y el canvas que ya no se pueden utilizar. Conservar la semántica de error existente y anunciar el fallo una sola vez; mover el foco al encabezado o a la región de error sin activar una recarga. Dar al detalle técnico un tamaño de lectura coherente con el texto de ayuda, contraste suficiente y ajuste de líneas largas. Separar las sugerencias generales del diagnóstico técnico concreto, sin presentar una recomendación como causa confirmada.
- Copy: No se pudo iniciar Raid
Ayuda para iniciar los gráficos
Detalles técnicos
- Aceptación: La lectura accesible no anuncia carga en curso junto a un fallo definitivo de ese intento. Desde el foco de error se pueden recorrer ayuda, recarga y regreso. Los detalles no desbordan a 360 px ni con zoom del 200 %.
- Referencias: evidence/raid-pass1-blocked.jpg
evidence/raid-pass2-retry-blocked.jpg
- Notas: Ventana de observación: 2026-10-22T16:16:00Z/2026-10-22T16:18:10Z
Cobertura: Dos intentos de carga bloqueados; cero partidas.

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

## [RSP-RAID-03] P2 · active · Responsive y controles
**La redefinición CSS final reduce los controles del HUD a 34 px en el dispositivo que más los necesita**
- Actual: P2 · confianza alta · confirmado por la cascada CSS. `current_1410/raid__style.css:374–375` declara 44 px para controles táctiles; la línea 519 fija después 36 px; la línea 521 usa el selector más específico `.touch-on .h-btns .btn.icon.sm` con 34×34 px cuando max-height es 520 px. La línea 536 sólo cambia fila/gap y no corrige el tamaño.
- Instrucción: Consolidar reglas finales de HUD en `.h-btns .btn.icon.sm{width:44px;min-width:44px;min-height:44px;padding:0;flex:none}` y eliminar las redefiniciones de 34/36 px para esas acciones. Separación de 8 px. Reservar ancho 200 px (4×44+3×8) más insets en la composición de HUD; mover contadores a segunda línea cuando no quepan, no superponer hitboxes ampliadas.
- Copy: 
- Aceptación: A 768×390 y 568×320, cuatro acciones de 44×44 px separadas 8 px sin cubrir objetivo/cronómetro; tap en margen y tap entre botones no activa vecino. Menús siguen sin desbordar.
- Referencias: Archivo: current_1410/raid__style.css
Líneas: 374–375
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [SRC-RA01] P2 · active_source_finding · Texto, estados y flujo
**#b-redeploy; #r-redeploy; #r-retry**
- Actual: Nuevo despliegue; Reintentar misión
- Instrucción: Aclarar la diferencia: reintentar conserva misión y despliegue; Nuevo despliegue genera una disposición distinta según el modo. Añadir subtexto acorde al comportamiento del bundle sin modificar la mecánica. Mostrar misión, dificultad y objetivo en la selección.
- Copy: Nuevo despliegue / Reintentar misión / Nuevo despliegue: cambia la distribución de esta misión.
- Aceptación: Comparar ambas acciones: la etiqueta explica qué se mantiene o aleatoriza. Volver a misiones no borra resultados.
- Referencias: https://raid.jetgames.fun/ — index.html:55–62,112–152
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [SRC-RA02] P2 · active_source_finding · Texto, estados y flujo
**#fatal-retry; #fatal-continue; fatal-title/msg**
- Actual: Reintentar; Jugar sin ellas; No pudimos iniciar los gráficos
- Instrucción: Sustituir el pronombre ellas por el recurso opcional concreto. No permitir continuar si falta algo indispensable. Dar mensaje específico de WebGL y salida a los juegos. El aviso de orientación debe mantener pausa y acceso al menú.
- Copy: Volver a cargar / Continuar sin {recursos opcionales concretos}
- Aceptación: Error opcional y fatal muestran acciones distintas: Continuar sólo para el opcional, identificado por nombre. Rotar conserva el intento pausado y no bloquea la salida.
- Referencias: https://raid.jetgames.fun/ — index.html:226–244
- Notas: Recomendación de texto y manejo de errores; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-RAID-01] P2 · active_proposal · Dirección visual interna
**Imagen de juego limpia: separar acabado óptico de efectos de estado**
- Actual: ui_audit/source_review/current_1410/raid__raid.js:3951, clase empaquetada kc, constructor de final/this.post: bloomStrength .22, vignette .35, saturation 1.05, contrast 1.04, grain .025, aberration 0; uniforms distintos flash, stun y damage. setGrade(e) aplica presets de escenario. Es código público empaquetado; localizar módulo original por estas firmas, no parchear Three/vendor.
- Instrucción: 1. Extraer los parámetros cosméticos a un preset con nombre «táctico limpio». Primer ajuste propuesto: grain=0 y vignette=0.18; mantener aberration=0. 2. Preservar exposición, saturación, contraste y tinte particulares de cada escenario: no aplicar una corrección universal que elimine noche, clima o identidad. Si un preset sobrescribe vignette, aplicar el mismo límite 0.18 sólo a su viñeta cosmética. 3. Mantener inicialmente bloomStrength=.22 y threshold=1.2; reducirlo únicamente si la prueba demuestra pérdida del contorno de una señal, no eliminar la señal emisiva. 4. No usar blur de pantalla, profundidad de campo ni nuevo grano como indicador de calidad. 5. Mantener el post a la resolución/calidad adaptativa existente y no añadir otro render target.
- Copy: 
- Aceptación: Prueba futura: capturas antes/después con la misma misión, cámara, semilla y tiempo, en los presets de clima disponibles y calidad low/high; vehículo, bordes y señales mantienen legibilidad sin grano añadido. Los mismos eventos disparan daño/stun y quedan diferenciados de la viñeta. Registrar tiempo de frame y memoria de render antes/después; no aprobar por una captura del menú.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No tocar uniforms de damage/stun/flash ni sus disparadores como parte del ajuste de grano. No cambiar niebla, alcance de visión, luces de objetivo, cámara, dinámica de agua, seed, colisiones o temporizadores. Efectos de estado deben seguir siendo inequívocos.

## [VIS-RAID-02] P2 · active_proposal · Dirección visual interna
**Jerarquía de materiales del hovercraft: carrocería, metal, goma y cristal**
- Actual: ui_audit/source_review/current_1410/raid__raid.js:4216, bloque de materiales del vehículo: armour=dd(..., {rough:.75, metal:.35}); accent rough .6/metal .2; glass roughness .04, metalness .25, clearcoat 1, clearcoatRoughness .03, envMapIntensity 1.8; steel roughness .32/metalness .9. El bloque también tiene rubber, glow, blur y numberDecal.
- Instrucción: 1. Preservar armour y accent y sus mapas; documentar estos valores como base industrial mate, en lugar de reemplazarlos por un material brillante común. 2. Proponer para glass roughness=.10, clearcoatRoughness=.08 y envMapIntensity=1.3, sin cambiar color, transparencia o forma del parabrisas; revisar reflejo contra lectura de la cabina antes de aprobar. 3. Mantener acero más reflectante que carrocería y goma: no igualar sus roughness. 4. Conservar número/decal y franjas de equipo nítidos, con texture colorSpace correcto; evitar sharpen global. 5. No añadir arañazos, logotipos, armas o geometría ajena al asset para hacerlo parecer más detallado.
- Copy: 
- Aceptación: Prueba futura con cada vehículo/skin y vista disponible: la carrocería conserva paleta de equipo; cristal, acero y goma se distinguen sin blancos quemados que oculten los decals. Superponer contornos del mesh antes/después: deben coincidir. La escena no obtiene llamadas/dibujos o texturas adicionales por este cambio.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Sólo propiedades de material del render. Conservar meshes, escala, orientación, hitboxes, bounding boxes, skeleton, velocidades de hélice, blur funcional y todas las identificaciones de equipo. Aplicar cambios en el módulo fuente del producto, no en la biblioteca empaquetada.

## [VIS-RAID-03] P2 · active_proposal · Dirección visual interna
**HUD como instrumentos estables, no placas luminosas competidoras**
- Actual: ui_audit/source_review/current_1410/raid__style.css:1–8 tokens --glass rgba(10, 24, 36, .62), --glass-2 rgba(16, 34, 50, .78), --brand-a #ff5a14, --body Inter, --display Chakra Petch. Líneas 125–198: .h-objective/.h-top/.h-item usan glass y blur 10–12 px; .h-timer small 10 px, .g-val span y .boost span 10 px con tracking .24em; .timer 26 px/tabular-nums.
- Instrucción: 1. Crear un token sólo del HUD --hud-surface: rgba(7, 19, 29, .88) y --hud-line: rgba(190, 220, 240, .24); aplicarlo a .h-objective, .h-top, .h-item sin alterar las pantallas de título. 2. Unificar sus radios a 12 px y sombras a 0 4 px 16 px rgba(0, 0, 0, .24); fondo debe funcionar también sin backdrop-filter, que puede quedar en 6 px. 3. Conservar Chakra para cifras; aplicar tabular-nums a tiempo, velocidad, puesto y contadores. Etiquetas .h-timer small, .g-val span, .boost span:12 px, tracking .06em y line-height 1.25, sin bajar tipografía para encajar. 4. Si el espacio no alcanza, integrar con el reflow de RSP-RAID, no superponer controles ni mover el canvas. 5. Naranja para acción/boost; azul/rojo/oro de equipos y objetivos conservan su significado.
- Copy: 
- Aceptación: Prueba futura a 320, 390, 768 y 1440 px más 568×320: todas las cifras y unidades completas, ningún texto mezclado con reflejos del agua; con fondos claros/oscuros y filtros CSS desactivados el HUD sigue legible. No ocultar contador para obtener espacio. Comparar estado idéntico de métricas antes/después.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No transformar cifras informativas en botones, ni acciones en texto no operable. No cambiar posiciones jugables, valor/unidad de métricas, controles, orden de foco, alcance de mapa o activación de items. Las correcciones RSP de hit target/insets prevalecen sobre un tamaño cosmético.

## [VIS-RAID-04] P2 · active_proposal · Dirección visual interna
**Señalética de objetivos: contorno preciso y texto, no halo permanente**
- Actual: ui_audit/source_review/current_1410/raid__style.css:204–211 .marker i es rombo 18×18, borde 2 px, fondo color-mix 30%, sombra 0 0 14 px var(--c); .marker b 12 px con dos text-shadow; .marker.off s es flecha fuera de campo; .marker.pulse i escala a 1.35 en .5s alternada.
- Instrucción: 1. Mantener rombo de 18 px/borde 2 px y anclaje de proyección; reducir sombra a 0 0 6 px color-mix(in srgb, var(--c) 40%, transparent). 2. Texto de distancia/nombre:13 px Inter 600, tracking .02em, sólo sombra 0 1 px 3 px rgba(0, 0, 0, .8), con pequeña placa local rgba(3, 9, 14, .8), padding 2 px 5 px/radio 4 px. 3. Conservar el triángulo de salida de pantalla. 4. Sustituir el pulso de escala 1.35 por una variación de opacidad entre .72 y 1 sobre el borde, máximo un ciclo por transición de estado; en reduced-motion, borde continuo. 5. No mostrar rótulos para entidades que el motor actualmente no expone; no dibujar líneas a través de paredes.
- Copy: 
- Aceptación: Prueba futura: objetivo delante/detrás/fuera de pantalla, varios objetivos simultáneos, captura/entrega y misión terminada; rótulo no oculta el rombo, el marcador sigue la misma entidad y desaparece cuando corresponde. Reduced-motion mantiene el mismo estado sin pulsación. Revisar que nunca aparece información no visible en baseline.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Mantener color, contenido, visibilidad/ocultación y coordenada de cada marcador, así como gates/flags/pods y su lógica. Ningún tamaño visual debe cambiar el área de recogida o objetivo. No reemplazar icono de equipo por un mismo símbolo genérico para todos.

## [VIS-RAID-05] P2 · active_proposal · Dirección visual interna
**Advertencias contenidas sin apagar números ni tapar la conducción**
- Actual: ui_audit/source_review/current_1410/raid__style.css:149–159 .timer.danger usa blink .5s steps(2) infinite (opacity .55 al 50%); .h-alert.on usa alarm 1s infinite; líneas 167–175 .count.num 160 px/.go-word 130 px y pop con escala 1.6, .count.big cambia tracking .4em→.08em.
- Instrucción: 1. Mantener el temporizador peligro en rojo sólido, opacity 1; sustituir parpadeo del número por borde de estado y etiqueta localizada ya asociada a la condición. 2. La alerta usa fondo fijo rgba(120, 10, 14, .88), icono+texto, sin loop de fondo alarm. 3. Conteo inicial: conservar números y cadencia del juego; limitar animación de escala a 1.04→1 y opacidad, sin tracking animado. 4. En reduced-motion conservar conteo textual y aviso estáticos durante el mismo intervalo, sin ocultarlos ni avanzar instantáneamente. 5. No añadir un overlay que bloquee la vista al recibir eventos repetidos.
- Copy: 
- Aceptación: Prueba futura: misma partida con preferencia normal/reduced-motion; misma hora de inicio y fin, mismos avisos, sin número transparente en ningún frame; alertas consecutivas no se apilan encima del vehículo o del HUD. La información se entiende en una captura estática.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Conservar umbrales, secuencia y duración de avisos y cuenta atrás; no alterar cuándo empieza el juego, cuándo se agota tiempo, efectos mecánicos ni prioridades de mensajes. La reducción cosmética de movimiento no puede eliminar señales de peligro.

# Copys ES/EN aplicables
- COPY-common-reload [SRC-G05, SRC-JU01, SRC-JU02, SRC-RA02, PLAY-JUMP-01, PLAY-JUMP-02, PLAY-JUMP-03, RSP-JUMP-01, PLAY-RAID-01, PLAY-BESTIARIO-02] es-AR: «Volver a cargar» | en: «Reload game» | contexto: Recuperación de carga con manejador listo antes de mostrar el botón. En Jump prevalece esta etiqueta, no Reintentar carga. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Reintentar carga']
- COPY-common-webgl [SRC-G05, SRC-JU02, SRC-RA02, PLAY-JUMP-03] es-AR: «Este navegador no pudo iniciar los gráficos 3D.» | en: «This browser couldn’t initialize 3D graphics.» | contexto: Sólo fallo de inicialización WebGL confirmado; no atribuirlo a conexión ni afirmar incompatibilidad universal. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-raid-redeploy [SRC-RA01, SRC-RA02, RSP-RAID-01] es-AR: «Nuevo despliegue» | en: «New deployment» | contexto: Nuevo despliegue cambia disposición sólo según modo/bundle; Reintentar conserva misión y despliegue. Continuar sin… sólo recursos identificados realmente opcionales. Volver a la misión del overlay retorna al briefing, no reanuda física por rotar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-raid-retry [SRC-RA01, SRC-RA02, RSP-RAID-01] es-AR: «Reintentar misión» | en: «Retry mission» | contexto: Nuevo despliegue cambia disposición sólo según modo/bundle; Reintentar conserva misión y despliegue. Continuar sin… sólo recursos identificados realmente opcionales. Volver a la misión del overlay retorna al briefing, no reanuda física por rotar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-raid-redeploy-help [SRC-RA01, SRC-RA02, RSP-RAID-01] es-AR: «Nuevo despliegue: cambia la distribución de esta misión.» | en: «New deployment: changes the layout of this mission.» | contexto: Nuevo despliegue cambia disposición sólo según modo/bundle; Reintentar conserva misión y despliegue. Continuar sin… sólo recursos identificados realmente opcionales. Volver a la misión del overlay retorna al briefing, no reanuda física por rotar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-raid-optional [SRC-RA01, SRC-RA02, RSP-RAID-01] es-AR: «Continuar sin {recursos opcionales concretos}» | en: «Continue without {recursos opcionales concretos}» | contexto: Nuevo despliegue cambia disposición sólo según modo/bundle; Reintentar conserva misión y despliegue. Continuar sin… sólo recursos identificados realmente opcionales. Volver a la misión del overlay retorna al briefing, no reanuda física por rotar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'recursos opcionales concretos', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-raid-back-briefing [SRC-RA01, SRC-RA02, RSP-RAID-01] es-AR: «Volver a la misión» | en: «Back to mission briefing» | contexto: Nuevo despliegue cambia disposición sólo según modo/bundle; Reintentar conserva misión y despliegue. Continuar sin… sólo recursos identificados realmente opcionales. Volver a la misión del overlay retorna al briefing, no reanuda física por rotar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-raid-orientation-title [SRC-RA01, SRC-RA02, RSP-RAID-01] es-AR: «Girá el dispositivo» | en: «Rotate your device» | contexto: Nuevo despliegue cambia disposición sólo según modo/bundle; Reintentar conserva misión y despliegue. Continuar sin… sólo recursos identificados realmente opcionales. Volver a la misión del overlay retorna al briefing, no reanuda física por rotar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-raid-orientation-help [SRC-RA01, SRC-RA02, RSP-RAID-01] es-AR: «Para jugar esta misión, usá la orientación horizontal.» | en: «Use landscape orientation to play this mission.» | contexto: Nuevo despliegue cambia disposición sólo según modo/bundle; Reintentar conserva misión y despliegue. Continuar sin… sólo recursos identificados realmente opcionales. Volver a la misión del overlay retorna al briefing, no reanuda física por rotar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-raid-graphics-failed [PLAY-RAID-01, PLAY-RAID-02] es-AR: «No pudimos iniciar los gráficos 3D.» | en: «We couldn’t initialize 3D graphics.» | contexto: Dos intentos bloqueados, cero partidas. /raid/ ya ofrece REINTENTAR centrado y error gráfico explícito: conservar ese acierto, no aplicar el diagnóstico de botón descentrado de Jump. Mejorar identidad, salida, foco/lectura de error y detalle; cargador/canvas inaccesibles durante fatal. Reintentar no borra progreso ni garantiza resolver WebGL. | condición: Contexto gráfico sólo con fallo de contexto confirmado. No atribuirlo a red ni ocultar diagnóstico tras repetición. Mantener consejo general separado del error técnico real, escapado como texto. Salida usa catálogo canónico existente, no una ruta inventada. | params: [] | citas actuales: ['No pudimos iniciar los gráficos', 'REINTENTAR']
- COPY-raid-context-failed [PLAY-RAID-01, PLAY-RAID-02] es-AR: «Este navegador no pudo crear el contexto gráfico que necesita Raid.» | en: «This browser couldn’t create the graphics context that Raid needs.» | contexto: Dos intentos bloqueados, cero partidas. /raid/ ya ofrece REINTENTAR centrado y error gráfico explícito: conservar ese acierto, no aplicar el diagnóstico de botón descentrado de Jump. Mejorar identidad, salida, foco/lectura de error y detalle; cargador/canvas inaccesibles durante fatal. Reintentar no borra progreso ni garantiza resolver WebGL. | condición: Contexto gráfico sólo con fallo de contexto confirmado. No atribuirlo a red ni ocultar diagnóstico tras repetición. Mantener consejo general separado del error técnico real, escapado como texto. Salida usa catálogo canónico existente, no una ruta inventada. | params: [] | citas actuales: []
- COPY-raid-start-failed [PLAY-RAID-01, PLAY-RAID-02] es-AR: «No se pudo iniciar Raid» | en: «Raid could not start» | contexto: Dos intentos bloqueados, cero partidas. /raid/ ya ofrece REINTENTAR centrado y error gráfico explícito: conservar ese acierto, no aplicar el diagnóstico de botón descentrado de Jump. Mejorar identidad, salida, foco/lectura de error y detalle; cargador/canvas inaccesibles durante fatal. Reintentar no borra progreso ni garantiza resolver WebGL. | condición: Contexto gráfico sólo con fallo de contexto confirmado. No atribuirlo a red ni ocultar diagnóstico tras repetición. Mantener consejo general separado del error técnico real, escapado como texto. Salida usa catálogo canónico existente, no una ruta inventada. | params: [] | citas actuales: []
- COPY-raid-graphics-help [PLAY-RAID-01, PLAY-RAID-02] es-AR: «Ayuda para iniciar los gráficos» | en: «Help with starting graphics» | contexto: Dos intentos bloqueados, cero partidas. /raid/ ya ofrece REINTENTAR centrado y error gráfico explícito: conservar ese acierto, no aplicar el diagnóstico de botón descentrado de Jump. Mejorar identidad, salida, foco/lectura de error y detalle; cargador/canvas inaccesibles durante fatal. Reintentar no borra progreso ni garantiza resolver WebGL. | condición: Contexto gráfico sólo con fallo de contexto confirmado. No atribuirlo a red ni ocultar diagnóstico tras repetición. Mantener consejo general separado del error técnico real, escapado como texto. Salida usa catálogo canónico existente, no una ruta inventada. | params: [] | citas actuales: []
- COPY-raid-technical-details [PLAY-RAID-01, PLAY-RAID-02] es-AR: «Detalles técnicos» | en: «Technical details» | contexto: Dos intentos bloqueados, cero partidas. /raid/ ya ofrece REINTENTAR centrado y error gráfico explícito: conservar ese acierto, no aplicar el diagnóstico de botón descentrado de Jump. Mejorar identidad, salida, foco/lectura de error y detalle; cargador/canvas inaccesibles durante fatal. Reintentar no borra progreso ni garantiza resolver WebGL. | condición: Contexto gráfico sólo con fallo de contexto confirmado. No atribuirlo a red ni ocultar diagnóstico tras repetición. Mantener consejo general separado del error técnico real, escapado como texto. Salida usa catálogo canónico existente, no una ruta inventada. | params: [] | citas actuales: []
- COPY-raid-help-details [PLAY-RAID-01, PLAY-RAID-02] es-AR: «Ver ayuda y detalles» | en: «View help and details» | contexto: Dos intentos bloqueados, cero partidas. /raid/ ya ofrece REINTENTAR centrado y error gráfico explícito: conservar ese acierto, no aplicar el diagnóstico de botón descentrado de Jump. Mejorar identidad, salida, foco/lectura de error y detalle; cargador/canvas inaccesibles durante fatal. Reintentar no borra progreso ni garantiza resolver WebGL. | condición: Contexto gráfico sólo con fallo de contexto confirmado. No atribuirlo a red ni ocultar diagnóstico tras repetición. Mantener consejo general separado del error técnico real, escapado como texto. Salida usa catálogo canónico existente, no una ruta inventada. | params: [] | citas actuales: []
- COPY-raid-back-games [PLAY-RAID-01, PLAY-RAID-02] es-AR: «Volver a JET//Games» | en: «Back to JET//Games» | contexto: Dos intentos bloqueados, cero partidas. /raid/ ya ofrece REINTENTAR centrado y error gráfico explícito: conservar ese acierto, no aplicar el diagnóstico de botón descentrado de Jump. Mejorar identidad, salida, foco/lectura de error y detalle; cargador/canvas inaccesibles durante fatal. Reintentar no borra progreso ni garantiza resolver WebGL. | condición: Contexto gráfico sólo con fallo de contexto confirmado. No atribuirlo a red ni ocultar diagnóstico tras repetición. Mantener consejo general separado del error técnico real, escapado como texto. Salida usa catálogo canónico existente, no una ruta inventada. | params: [] | citas actuales: []
- COPY-raid-brand [PLAY-RAID-01] es-AR: «JET//Raid» | en: «JET//Raid» | contexto: Identidad del juego en el estado fatal; conservar marca, sin confundirlo con Jump. No certifica que el gameplay haya iniciado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
