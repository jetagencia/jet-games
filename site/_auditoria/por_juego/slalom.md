# slalom: 16 registros del catálogo, 25 copys

## [RSP-SLALOM-04] P1 · active · Responsive y controles
**Espacio en el botón Pausa salta en lugar de pulsar Pausa**
- Actual: Durante `Game.scene==='playing'`, el keydown global trata Space como salto y hace `preventDefault()` aunque el foco esté en el botón nativo Pausa. En menús, el fallback de Enter también puede ejecutar el CTA aunque el foco esté en el enlace global fuera del overlay, porque sólo se excluye BUTTON dentro del overlay.
- Instrucción: En el handler general, después de resolver Escape como acción explícita, si el objetivo está en un control nativo/semántico (`button,a,input,select,textarea,summary,[contenteditable="true"],[role="button"],[role="switch"]`), dejar que el control gestione Enter/Espacio y no activar gameplay. En `menuKey`, mantener el soporte manual sólo para los div role=button/switch existentes; para botones/enlaces/inputs retornar sin fallback. Ejecutar CTA por Enter sólo si no hay control enfocado. Al abrir pausa por teclado, llevar el foco a Reanudar partida y al volver restaurarlo a la superficie de juego, no dejarlo en un botón oculto.
- Copy: 
- Aceptación: Durante una bajada, Tab a Pausa y Espacio pausa exactamente una vez sin salto; Enter hace lo mismo. Tab al enlace JET//Games en menú + Enter navega al sitio, nunca inicia partida. Flechas/Space siguen funcionando cuando la superficie de juego tiene foco. Probar los cuatro anchos.
- Referencias: Archivo: current_1410/jetslalom_canonical.html
Líneas: 804-805,3717-3736,4426-4448
- Notas: Problema identificado en fuente; Space en juego no excluye botón Pausa; menuKey Enter excluye sólo BUTTON dentro del overlay, no enlace global.

## [PLAY-SLALOM-01] P2 · active · Prueba interactiva y propuestas
**Hacer explícito el destino del primer Jugar**
- Actual: El primer JUGAR abre directamente pista 1 de Slalom; la selección de disciplina/estructura se descubre después.
- Instrucción: Antes de la primera partida, mostrar una presentación breve con disciplina, estructura, objetivo y controles esenciales. Si se trata realmente de un tutorial obligatorio, nombrarlo como tal; no esconder otras modalidades detrás de una derrota.
- Copy: Empezar tutorial
Slalom · Pista {n}
Pasá a la izquierda de las banderas rojas y a la derecha de las azules.
Elegir modalidad
- Aceptación: Perfil nuevo: CTA lleva al destino anunciado y permite identificar el objetivo antes de que corra el tiempo.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:22:00Z/2026-10-22T14:26:00Z

## [PLAY-SLALOM-02] P2 · active · Prueba interactiva y propuestas
**Separar controles y reglas por dispositivo**
- Actual: Cómo jugar es una lista extensa que mezcla teclado, ratón, controles táctiles, tres disciplinas, colisiones, banderines, acrobacias y 30 pistas.
- Instrucción: Priorizar tres acciones del modo elegido. Separar las secciones «Teclado» y «Táctil», dejar las reglas avanzadas en un bloque desplegable y mostrar un diagrama del lado correcto de cada bandera.
- Copy: Controles
Reglas de esta modalidad
Ver reglas avanzadas
- Aceptación: Se puede explicar giro, salto y el objetivo de la primera pista sin leer reglas de otros modos.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:22:00Z/2026-10-22T14:26:00Z

## [PLAY-SLALOM-03] P2 · active · Prueba interactiva y propuestas
**Dar nombres y unidades al HUD**
- Actual: DIST, PENAL y el icono de moneda no explican su significado; el resultado contiene estrellas sin el criterio textual visible.
- Instrucción: Usar etiquetas completas en escritorio y un nombre accesible para cada valor en la vista compacta. Añadir el criterio de cada estrella a la presentación previa y al resultado, con estado textual además del color.
- Copy: Distancia
Penalización
Monedas
Estrella conseguida
Estrella pendiente
- Aceptación: Cada valor tiene nombre/unidad y cada estrella tiene condición y estado legibles sin depender del color.
- Referencias: evidence/slalom-pass1-result.jpg
evidence/slalom-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T14:22:00Z/2026-10-22T14:26:00Z

## [PLAY-SLALOM-04] P2 · active · Prueba interactiva y propuestas
**Mantener el resumen de resultado visible**
- Actual: A 1180×757, el resultado largo requiere desplazamiento y deja parte de las estadísticas fuera de la primera vista.
- Instrucción: Organizar el resultado con un encabezado compacto, un resumen en grilla y estadísticas secundarias plegables. Mantener las acciones visibles sin tapar contenido.
- Copy: Ver estadísticas
Reintentar pista
Elegir pista
- Aceptación: A 1180×757 se ven causa, puntos, objetivo y CTA sin desplazarse. En móvil se conserva el desplazamiento natural y los botones no se superponen al contenido.
- Referencias: evidence/slalom-pass1-result.jpg
evidence/slalom-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T14:22:00Z/2026-10-22T14:26:00Z

## [PLAY-SLALOM-05] P2 · active · Prueba interactiva y propuestas
**Hacer comprensibles los bloqueos de pistas**
- Actual: La grilla de diez pistas usa botones muy tenues para las pistas bloqueadas; el árbol de accesibilidad los enumera como botones sin estado disabled.
- Instrucción: Mantener legibles el número y la condición de desbloqueo. Usar disabled o aria-disabled según el comportamiento implementado. No permitir iniciar una pista bloqueada ni dejar el foco en una opción sin explicación.
- Copy: Pista bloqueada
Completá la pista anterior para desbloquearla.
- Aceptación: Con teclado y lector de pantalla se distingue disponible/bloqueada; verificar condición real antes de usar el texto propuesto.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:22:00Z/2026-10-22T14:26:00Z

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

## [RSP-SLALOM-01] P2 · active · Responsive y controles
**El HUD estrecho recorta valores en vez de redistribuirlos**
- Actual: Distancia, puntos, penalización/extra y monedas comparten un único `.hud-pill` nowrap/overflow:hidden; Pausa (44 px) y vidas compiten en la misma fila. En ≤430 px sólo se ocultan etiquetas/separadores y se reduce la tipografía. No hay distribución para el crecimiento de números.
- Instrucción: En ≤430 px, `.hud-top` como grid `44px minmax(0,1fr) auto`, gap 6 px. El `.hud-pill` de métricas, no el de vidas, debe usar grid `repeat(2,minmax(0,1fr))`, gap `2px 8px`, `padding:4px 6px;font-size:11px;line-height:14px;min-height:44px;white-space:normal;overflow:visible`. Los cuatro `.stat` ocupan una celda cada uno; ocultar sólo los separadores. Eliminar el `.hud-spacer` de ese grid. Mantener Pausa y vidas completos; conservar nombres accesibles para cada cifra aunque la etiqueta visual sea icono. Reservar debajo al menos 6 px antes de `.hud-level`/boss.
- Copy: 
- Aceptación: A 320/360/390 px introducir estados de prueba con distancia 99999 m, puntuación 9999999, penalización 999.9 y monedas 99999: ninguna cifra se recorta/solapa. A 768 px conservar la fila amplia. Los botones no bajan de 44 px y nivel/boss no cubren la segunda fila.
- Referencias: Archivo: current_1410/jetslalom_canonical.html
Líneas: 168-218,804-816
- Notas: Regla identificada en fuente con riesgo inferido; HUD estrecho conserva flex único, nowrap y overflow:hidden. Riesgo con cifras largas persiste, sin comprobación en navegador.

## [RSP-SLALOM-02] P2 · active · Responsive y controles
**La tienda destruye el botón enfocado al equipar/comprar**
- Actual: `buildShop()` vacía `grid.innerHTML`; cada compra/equipamiento vuelve a ejecutarla. El nodo `.card` enfocado se elimina. Aunque Enter/Espacio sobre role=button se implementa, no se restaura el foco después del render.
- Instrucción: Dar `data-skin-id` estable a cada tarjeta; capturar el id activo antes de reconstruir y enfocar después el botón equivalente con `focus({preventScroll:true})`. Preferir botones nativos `<button type="button" class="card">`; retirar manejador manual Enter/Espacio cuando sean botones para no duplicar clicks. Conservar la posibilidad de consultar faltantes de monedas de las opciones no compradas; no marcarlas disabled sólo porque tengan `.locked`. En tarjetas poseídas, publicar `aria-pressed` según equipado.
- Copy: 
- Aceptación: Tab hasta una skin, Enter para comprar/equipar; foco sigue en la misma skin, el lector anuncia el nuevo estado y siguiente Tab llega a la skin siguiente, no al principio del documento. Sin compras dobles. Probar scroll de tienda a 320/360/390 y grid de 768.
- Referencias: Archivo: current_1410/jetslalom_canonical.html
Líneas: 4191-4226,4426-4448
- Notas: Problema identificado en fuente; Tienda vacía innerHTML y se reconstruye al equipar/comprar sin restaurar foco.

## [RSP-SLALOM-03] P2 · active · Responsive y controles
**Canvas y contenedor usan alturas distintas al cambiar visualViewport**
- Actual: `--app-height` cambia con `visualViewport.height`, pero `resizeCanvas()` usa `window.innerHeight` y no escucha `visualViewport.resize`; además pone esa altura explícita al canvas. Si sólo cambia el viewport visual, el padre recorta y el área de dibujo/input conserva la otra altura.
- Instrucción: Usar una sola fuente de medida: `#app.getBoundingClientRect()` en `resizeCanvas()`, y observar `#app` con `ResizeObserver`; publicar `W/H` CSS desde ese rectángulo, multiplicar sólo el backing store por DPR. Consolidar los listeners visualViewport/orientation/resize en una actualización por requestAnimationFrame. Las coordenadas de puntero deben convertirse usando el rectángulo real del canvas, no asumir que `innerHeight` coincide.
- Copy: 
- Aceptación: A 390 px, expandir/contraer barras del navegador y cambiar a pantalla completa/orientación; canvas CSS y rectángulo de #app coinciden ±1 px, sin franja recortada ni offset de controles. Repetir 320/360/768 y control táctil cerca del borde inferior.
- Referencias: Archivo: current_1410/jetslalom_canonical.html
Líneas: 78-91,148-156,1448-1463
- Notas: Regla identificada en fuente con riesgo inferido; App cambia --app-height con visualViewport.height, canvas sigue en innerHeight y sólo escucha resize/orientationchange.

## [SRC-S02] P2 · active_source_finding · Texto, estados y flujo
**#btn-quit; #btn-over-menu**
- Actual: Salir al menú; Volver al menú
- Instrucción: El handler va a showLevels en niveles, openStructure en modos y sólo al menú en mix. Etiqueta dinámica según destino real; no llamar menú a tres destinos distintos. #btn-resume Seguir→Reanudar partida; #btn-over-alt Repetir pista conservar.
- Copy: Volver a las pistas / Volver a modos / Volver al menú
- Aceptación: Probar niveles, infinito y mix: destino coincide con etiqueta, volver no inicia ni borra configuración.
- Referencias: https://jetgames.fun/slalom/ — current_1410/jetslalom_canonical.html:1102,1189,4345–4360
- Notas: Inconsistencia confirmada en fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-SLALOM-01] P2 · active_proposal · Dirección visual interna
**Nieve y relieve sin falsos carriles**
- Actual: Archivo: ui_audit/source_review/current_1410/jetslalom_canonical.html
Líneas: 2504–2581
Funciones: drawBackground
Selectores: 
Valores literales de la fuente: nieve #dbe7f3/#eaf2fc/#ffffff/#f0f5fc/#dbe5f0
14 bandas rgba(160,180,210,0.18)
28 elipses rgba(150,170,200,0.08)
huellas lineWidth=2; alpha máximo0.40
Captura inspeccionada: ui_audit/evidence/slalom-pass2-gameplay.jpg (1180×757; inspeccionada; nieve clara, pinos, esquiador violeta/cian, Yeti y HUD oscuro)
- Instrucción: Mantener la nieve clara; no añadir velo violeta ni cuadrícula neón. Suavizar las bandas de relieve de 0,18 a aproximadamente 0,10 de opacidad para que no parezcan carriles, y conservar las huellas del esquiador más visibles que las marcas ambientales. Mantener sombras de pinos coherentes en una misma dirección y con menor contraste que troncos/obstáculos. El límite lateral del bosque puede enmarcar la pista, pero no agregar árboles decorativos dentro de la zona navegable para llenar espacios.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- snow_relief_alpha: 0.1
- ambient_ellipse_alpha: 0.06
- ski_track_width: 2 px, conservar
- tree_shadow: #52617B a 0.20; dirección existente
- snow_colors: sin cambios a gradiente blanco/azulado
- Copy: 
- Aceptación: En la captura de referencia y en orientación retrato, esquiador y obstáculos destacan antes que las líneas de nieve. Los mismos objetos ocupan exactamente las mismas coordenadas y mantienen colisiones.
- Referencias: ui_audit/source_review/current_1410/jetslalom_canonical.html
- Notas: Propuesta de dirección visual apoyada en la fuente y en una captura inspeccionada; no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No mover árboles/rocas colisionables, ancho del recorrido, proyección ni geometría del suelo. Las huellas y relieve son decorativos y no deben sugerir carriles obligatorios.

## [VIS-SLALOM-02] P2 · active_proposal · Dirección visual interna
**Banderas y jugador sin exceso de halo**
- Actual: Archivo: ui_audit/source_review/current_1410/jetslalom_canonical.html
Líneas: 2880–2927; 3150–3167
Funciones: drawFlag
drawPlayer
Selectores: 
Valores literales de la fuente: bandera roja #e22042 sale a izquierda; azul #1c63d4 sale a derecha
asta #1a1530; width=2.4*s
flag shadowBlur=14*s
halo jugador radio=36*s; alpha normal0.40; caída0.30
Captura inspeccionada: ui_audit/evidence/slalom-pass2-gameplay.jpg (1180×757; inspeccionada; nieve clara, pinos, esquiador violeta/cian, Yeti y HUD oscuro)
- Instrucción: Conservar las banderas rojas y azules y su orientación opuesta: ya aportan una señal de forma además de color. Reducir el halo aditivo de banderas a 4–6*s y mantener el asta oscura nítida. En el jugador, bajar el halo normal de 0,40 a 0,18–0,22 y su radio de 36*s a 26*s; reforzar la sombra de contacto y el contorno del traje para que siga visible sobre nieve blanca. Conservar el halo rojo de caída como estado diferenciado, sin hacer que todos los objetos parezcan coleccionables luminosos.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- flag_glow: 5*s
- player_halo_radius: 26*s
- player_halo_alpha: 0.2
- flag_pole: #1A1530,2.4*s, conservar
- crash_red: mantener color/estado existente
- Copy: 
- Aceptación: La bandera sigue indicando el mismo lado aun en escala de grises; el personaje se reconoce junto a pinos y rampas sin una mancha cian dominante. Las skins existentes conservan sus colores.
- Referencias: ui_audit/source_review/current_1410/jetslalom_canonical.html
- Notas: Propuesta de dirección visual apoyada en la fuente y en una captura inspeccionada; no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No invertir rojo/azul, lado de paso ni posición de banderas. Conservar skins, tamaño principal del jugador, hitbox y significado de caída. Cambiar sólo luz decorativa, no ampliar el área de colisión.

## [VIS-SLALOM-03] P2 · active_proposal · Dirección visual interna
**Yeti visible sobre nieve blanca**
- Actual: Archivo: ui_audit/source_review/current_1410/jetslalom_canonical.html
Líneas: 3254–3287
Funciones: drawBoss
Selectores: 
Valores literales de la fuente: Yeti cuerpo #fff/#e8eef8/#aab8d0
shadowBlur=14*s blanco
cuerpo ellipse 26*s ×30*s
sombra rgba(0,0,0,0.5)
Captura inspeccionada: ui_audit/evidence/slalom-pass2-gameplay.jpg (1180×757; inspeccionada; nieve clara, pinos, esquiador violeta/cian, Yeti y HUD oscuro)
- Instrucción: Mantener al Yeti blanco y expresivo, pero sustituir el resplandor blanco ancho por una iluminación de borde fría y un contorno exterior azul grisáceo fino; el volumen principal debe seguir siendo nieve/pelaje, no una esfera de luz. Conservar ojos y boca de amenaza y reforzar sólo esos rasgos, sin recolorear el cuerpo de rojo. Reducir la sombra del suelo a una elipse coherente con las demás entidades, manteniendo separación suficiente del fondo blanco . No cambiar escala ni animación funcional de brazos/ataque.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- yeti_outline: #66758E a 0.8,1.25*s
- white_glow: 0
- rim_light: #DCE8F8,1*s dentro del borde
- ground_shadow: #52617B a 0.26
- body_size: ellipse 26*s×30*s, conservar
- Copy: 
- Aceptación: En la misma escena de nieve, el contorno del Yeti se distingue completo sin depender de ojos rojos; no parece un objeto coleccionable. Comparar antes/después confirma idéntico alcance de colisión.
- Referencias: ui_audit/source_review/current_1410/jetslalom_canonical.html
- Notas: Propuesta de dirección visual apoyada en la fuente y en una captura inspeccionada; no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No alterar tamaño, posición, velocidad, alcance ni cadencia del jefe; el contorno añadido queda dentro o pegado a la silueta existente. Preservar las señales de peligro y el rótulo de jefe.

## [VIS-SLALOM-04] P2 · active_proposal · Dirección visual interna
**HUD deportivo mate y alertas sobrias**
- Actual: Archivo: ui_audit/source_review/current_1410/jetslalom_canonical.html
Líneas: 181–233; 267–287; 315–318
Funciones: renderLives
Selectores: .hud-pill
.hud-lives
.hud-pill .val.danger
.toast
Valores literales de la fuente: HUD fondo var(--hud-bg); borde cian
dangerPulse .5s infinite
alerta box-shadow hasta80px
toast gold/danger/warn con halo22px
Captura inspeccionada: ui_audit/evidence/slalom-pass2-gameplay.jpg (1180×757; inspeccionada; nieve clara, pinos, esquiador violeta/cian, Yeti y HUD oscuro)
- Instrucción: Dar al HUD acabado de instrumento deportivo sobre nieve: panel oscuro mate, borde de 1 px y sombra corta de 0 3 px 10 px rgba(0,0,0,0.2), evitando halos cian amplios en los valores normales. Mantener distancia y puntos con números tabulares; separar visualmente etiquetas de números mediante peso y no con cuatro colores simultáneos. Reservar rojo para vidas/daño y amarillo para recompensa/aviso. Limitar la animación decorativa de alertas al primer aviso y mantener después un estado estático claramente visible; en reduced-motion usar directamente el estado estático.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- panel_fill: #111221 a 0.94
- panel_border: #66758E a 0.5,1 px
- panel_shadow: 0 3 px 10 px rgba(0,0,0,.2)
- normal_text_shadow: none
- alert_motion: primer 350 ms; después estado estático
- labels: 12 px/1.2, peso 600
- Copy: 
- Aceptación: En nieve muy clara y durante jefe, todas las métricas se leen sin resplandor. El aviso persiste el tiempo funcional necesario pero no pulsa indefinidamente. La reducción de movimiento no elimina el estado de peligro.
- Referencias: ui_audit/source_review/current_1410/jetslalom_canonical.html
- Notas: Propuesta de dirección visual apoyada en la fuente y en una captura inspeccionada; no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar qué métricas aparecen, ni el significado de combo, vidas, jefe o nivel. No esconder avisos urgentes ni eliminar colores funcionales. Conservar la jerarquía y traducciones existentes, sin duplicar controles.

## [SRC-S01] P3 · fixed_in_current_source_keep_regression_test · Texto, estados y flujo
**#btn-brief-go**
- Actual: Empezar (antes: Salir)
- Instrucción: El nuevo destino /slalom/ ya corrigió la etiqueta contradictoria: #btn-brief-go dice Empezar y llama startGame. No enviar a Claude la corrección antigua como pendiente. Conservar prueba de regresión; Comenzar pista sería sólo una mejora editorial opcional, con Start track en EN.
- Copy: Conservar Empezar; opcional editorial Comenzar pista
- Aceptación: Activar el botón existente «Empezar» (#btn-brief-go) inicia exactamente la pista anunciada; ninguna acción titulada «Salir» comienza el juego. «Comenzar pista» es una mejora editorial opcional y no un requisito para aprobar esta prueba de regresión.
- Referencias: https://jetgames.fun/slalom/ — current_1410/jetslalom_canonical.html:949,4314
- Notas: CORREGIDO durante auditoría; no implementar el cambio antiguo; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

# Copys ES/EN aplicables
- COPY-common-resume [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-FRENTES-01, PLAY-BALIZAS-04, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Reanudar partida» | en: «Resume game» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Continuar', 'Seguir']
- COPY-common-menu [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-TELEMETRIA-05, PLAY-PORTADA-06, PLAY-FRENTES-02] es-AR: «Volver al menú» | en: «Back to menu» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-preserve-start [SRC-S01] es-AR: «Empezar» | en: «Start» | contexto: Preservación/regresión: el briefing ya dice Empezar. ES no debe renombrarse por esta auditoría; EN propuesta equivalente sólo si la clave existente requiere revisión. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Empezar']
- COPY-slalom-back-courses [SRC-S02, PLAY-SLALOM-04] es-AR: «Volver a las pistas» | en: «Back to ski courses» | contexto: Pista significa recorrido de esquí, NO hint. showLevels→pistas; openStructure→modos; mix→common-menu. No imponer un destino único. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-back-modes [SRC-S02, PLAY-SLALOM-04] es-AR: «Volver a modos» | en: «Back to modes» | contexto: Pista significa recorrido de esquí, NO hint. showLevels→pistas; openStructure→modos; mix→common-menu. No imponer un destino único. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-replay [SRC-S02, PLAY-SLALOM-04] es-AR: «Repetir pista» | en: «Replay ski course» | contexto: Pista significa recorrido de esquí, NO hint. showLevels→pistas; openStructure→modos; mix→common-menu. No imponer un destino único. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-retry [SRC-S02, PLAY-SLALOM-04] es-AR: «Reintentar pista» | en: «Retry ski course» | contexto: Pista significa recorrido de esquí, NO hint. showLevels→pistas; openStructure→modos; mix→common-menu. No imponer un destino único. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-choose [SRC-S02, PLAY-SLALOM-04] es-AR: «Elegir pista» | en: «Choose a ski course» | contexto: Pista significa recorrido de esquí, NO hint. showLevels→pistas; openStructure→modos; mix→common-menu. No imponer un destino único. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-stats [SRC-S02, PLAY-SLALOM-04] es-AR: «Ver estadísticas» | en: «View statistics» | contexto: Pista significa recorrido de esquí, NO hint. showLevels→pistas; openStructure→modos; mix→common-menu. No imponer un destino único. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-tutorial [PLAY-SLALOM-01, PLAY-SLALOM-02] es-AR: «Empezar tutorial» | en: «Start tutorial» | contexto: Título usa disciplina/número reales. Empezar tutorial sólo si ese CTA abre un tutorial de verdad; conservar Empezar del briefing normal. Regla de banderas sólo en modalidad aplicable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-brief-title [PLAY-SLALOM-01, PLAY-SLALOM-02] es-AR: «{disciplina} · Pista {n}» | en: «{disciplina} · Ski course {n}» | contexto: Título usa disciplina/número reales. Empezar tutorial sólo si ese CTA abre un tutorial de verdad; conservar Empezar del briefing normal. Regla de banderas sólo en modalidad aplicable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'disciplina', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-slalom-flags [PLAY-SLALOM-01, PLAY-SLALOM-02] es-AR: «Pasá a la izquierda de las banderas rojas y a la derecha de las azules.» | en: «Pass to the left of red flags and to the right of blue flags.» | contexto: Título usa disciplina/número reales. Empezar tutorial sólo si ese CTA abre un tutorial de verdad; conservar Empezar del briefing normal. Regla de banderas sólo en modalidad aplicable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-modality [PLAY-SLALOM-01, PLAY-SLALOM-02] es-AR: «Elegir modalidad» | en: «Choose a discipline» | contexto: Título usa disciplina/número reales. Empezar tutorial sólo si ese CTA abre un tutorial de verdad; conservar Empezar del briefing normal. Regla de banderas sólo en modalidad aplicable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-controls [PLAY-SLALOM-01, PLAY-SLALOM-02] es-AR: «Controles» | en: «Controls» | contexto: Título usa disciplina/número reales. Empezar tutorial sólo si ese CTA abre un tutorial de verdad; conservar Empezar del briefing normal. Regla de banderas sólo en modalidad aplicable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-rules [PLAY-SLALOM-01, PLAY-SLALOM-02] es-AR: «Reglas de esta modalidad» | en: «Rules for this discipline» | contexto: Título usa disciplina/número reales. Empezar tutorial sólo si ese CTA abre un tutorial de verdad; conservar Empezar del briefing normal. Regla de banderas sólo en modalidad aplicable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-advanced [PLAY-SLALOM-01, PLAY-SLALOM-02] es-AR: «Ver reglas avanzadas» | en: «View advanced rules» | contexto: Título usa disciplina/número reales. Empezar tutorial sólo si ese CTA abre un tutorial de verdad; conservar Empezar del briefing normal. Regla de banderas sólo en modalidad aplicable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-keyboard [PLAY-SLALOM-01, PLAY-SLALOM-02] es-AR: «Teclado» | en: «Keyboard» | contexto: Título usa disciplina/número reales. Empezar tutorial sólo si ese CTA abre un tutorial de verdad; conservar Empezar del briefing normal. Regla de banderas sólo en modalidad aplicable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-touch [PLAY-SLALOM-01, PLAY-SLALOM-02] es-AR: «Táctil» | en: «Touch» | contexto: Título usa disciplina/número reales. Empezar tutorial sólo si ese CTA abre un tutorial de verdad; conservar Empezar del briefing normal. Regla de banderas sólo en modalidad aplicable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-distance [PLAY-SLALOM-03, PLAY-SLALOM-05, RSP-SLALOM-01] es-AR: «Distancia» | en: «Distance» | contexto: Nombres visibles/accesibles; no añadir unidad de distancia ni penalización sin confirmar la magnitud real. Bloqueo usa condición vigente, no sólo opacidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-penalty [PLAY-SLALOM-03, PLAY-SLALOM-05, RSP-SLALOM-01] es-AR: «Penalización» | en: «Penalty» | contexto: Nombres visibles/accesibles; no añadir unidad de distancia ni penalización sin confirmar la magnitud real. Bloqueo usa condición vigente, no sólo opacidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-coins [PLAY-SLALOM-03, PLAY-SLALOM-05, RSP-SLALOM-01] es-AR: «Monedas» | en: «Coins» | contexto: Nombres visibles/accesibles; no añadir unidad de distancia ni penalización sin confirmar la magnitud real. Bloqueo usa condición vigente, no sólo opacidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-star-earned [PLAY-SLALOM-03, PLAY-SLALOM-05, RSP-SLALOM-01] es-AR: «Estrella conseguida» | en: «Star earned» | contexto: Nombres visibles/accesibles; no añadir unidad de distancia ni penalización sin confirmar la magnitud real. Bloqueo usa condición vigente, no sólo opacidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-star-pending [PLAY-SLALOM-03, PLAY-SLALOM-05, RSP-SLALOM-01] es-AR: «Estrella pendiente» | en: «Star not yet earned» | contexto: Nombres visibles/accesibles; no añadir unidad de distancia ni penalización sin confirmar la magnitud real. Bloqueo usa condición vigente, no sólo opacidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-locked [PLAY-SLALOM-03, PLAY-SLALOM-05, RSP-SLALOM-01] es-AR: «Pista bloqueada» | en: «Ski course locked» | contexto: Nombres visibles/accesibles; no añadir unidad de distancia ni penalización sin confirmar la magnitud real. Bloqueo usa condición vigente, no sólo opacidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-slalom-unlock [PLAY-SLALOM-03, PLAY-SLALOM-05, RSP-SLALOM-01] es-AR: «Completá la pista anterior para desbloquearla.» | en: «Complete the previous ski course to unlock this one.» | contexto: Nombres visibles/accesibles; no añadir unidad de distancia ni penalización sin confirmar la magnitud real. Bloqueo usa condición vigente, no sólo opacidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
