# rocket: 16 registros del catálogo, 24 copys

## [RSP-ROCKET-01] P1 · active · Responsive y controles
**El pseudo-elemento de Pausa captura el panel lateral en horizontal**
- Actual: `#btn-pause::before` es absoluto con `inset:-7px`; en horizontal ≤600 px de alto el botón pasa a `position:static`. El pseudo-elemento queda referenciado al ancestro posicionado `#top`, no al botón, y extiende su zona activa sobre el sidebar.
- Instrucción: En la media query mantener `#btn-pause{position:relative;width:100%;height:44px;min-height:44px}` y usar `#btn-pause::before{inset:0}` en ese modo. El área de interacción debe ser exactamente el botón o su extensión acotada, nunca todo `#top`. Conservar `order:10` y el texto visible. En la media query horizontal, resetear también `top:auto;right:auto` junto a `position:relative`, para no conservar los offsets del estilo general.
- Copy: 
- Aceptación: A 568×320 y 768×390, hacer tap sobre cada métrica/badge y los huecos del sidebar no pausa; tap sólo dentro del botón Pausa sí. Rectángulo de pseudo-elemento contenido en el del botón. Verificar click y pointerup táctil no provocan dos cambios.
- Referencias: Archivo: current_1410/jetrocket_canonical.html
Líneas: 64,69,78-79,101-106
- Notas: Problema identificado en fuente; Pseudo-elemento absoluto inset-7 px y botón position:static en horizontal siguen presentes en destino canónico.

## [PLAY-ROCKET-01] P2 · active · Prueba interactiva y propuestas
**Explicar las reglas de cada modo Arcade antes de jugar**
- Actual: Aparecen `CLÁSICO`, `TIEMPO` y `SOBREVIVIR`, con récord 0 y sin una descripción visible de sus reglas al entrar; la campaña sí tiene un párrafo explicativo.
- Instrucción: Al seleccionar un modo, actualizar de inmediato su descripción encima de Jugar Arcade. Renombrar `TIEMPO` a «Contrarreloj» y `SOBREVIVIR` a «Supervivencia». La duración debe proceder de la regla real del modo: en la prueba comenzó en 90 s. Si la versión vigente conserva esa duración, usar «Contrarreloj: conseguí tantos puntos como puedas en 90 segundos. Chocar termina la partida.». No convertir el tiempo restante de una sesión en la duración fija del modo.
- Copy: Contrarreloj: conseguí tantos puntos como puedas en {duración} segundos. Chocar termina la partida.
- Aceptación: Antes de iniciar, se conocen las diferencias entre modos y la condición que termina la partida.
- Referencias: 
- Notas: En esta ejecución se observó un inicio de 90 segundos. Verificar las reglas del modo en la ruta canónica vigente antes de adoptar ese texto. No es un valor de tiempo restante para fijar en el HUD.
Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-ROCKET-02] P2 · active · Prueba interactiva y propuestas
**Tutorial de primera misión progresivo**
- Actual: El manual es denso, tiene 8 bloques y mezcla controles táctiles, teclado y ratón. El sector 1 dice `Aprende a girar y a encadenar cristales`, pero inicia el movimiento normal sin una práctica guiada.
- Instrucción: Separar «Controles» y «Reglas avanzadas». Ofrecer una práctica guiada del primer giro y de la recolección del primer cristal, opcional o separada de la primera misión. Evitar explicar portales y asteroides antes de que sean necesarios; conservar «Omitir». No modificar física, dificultad ni reglas del modo principal para simplificar la explicación.
- Copy: Controles
Reglas avanzadas
Omitir
- Aceptación: La práctica permite aprender giro y recolección; omitirla conserva las reglas del juego ordinario. No anunciar atajos no implementados.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-ROCKET-03] P2 · active · Prueba interactiva y propuestas
**Resultado con unidad**
- Actual: Se muestra un 0 de gran tamaño entre `Sector1fallido` y `0de8cristales`, o entre `Nave destruida` y la longitud/rango, sin etiqueta que identifique el valor.
- Instrucción: Mostrar «{puntos} puntos», con pluralización para 1 punto, o una etiqueta inequívoca «PUNTOS» junto al valor real. Conservar la causa concreta `Choque contra el borde`, que es un buen patrón.
- Copy: {puntos} puntos
1 punto
PUNTOS
- Aceptación: La cifra no se confunde con cristales ni vidas. Probar la pluralización con 0, 1 y varios puntos.
- Referencias: evidence/rocket-pass1.jpg
evidence/rocket-pass2.jpg
- Notas: Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-ROCKET-04] P2 · active · Prueba interactiva y propuestas
**Tiempo con unidad y resumen**
- Actual: El HUD muestra `TIEMPO83`; la derrota del modo Tiempo no indica segundos jugados ni restantes.
- Instrucción: En el HUD, mostrar «Tiempo restante: {s} s» o el tiempo real con formato m:ss y una etiqueta explícita. Al perder por choque, incluir «Duración de la partida: {s_jugados} s» y «Tiempo restante: {s} s», calculados desde el temporizador real y respetando la pausa. No fijar los 83 s observados ni los 7 s del ejemplo.
- Copy: Tiempo restante: {s} s
Duración de la partida: {s_jugados} s
- Aceptación: Se distingue la derrota por choque del fin del reloj. La duración y el tiempo restante coinciden con el temporizador, que no avanza durante la pausa.
- Referencias: evidence/rocket-pass2.jpg
- Notas: El HUD observado fue `TIEMPO83`. El valor 83 consta en una captura del árbol de accesibilidad; los 7 segundos del ejemplo se obtienen de 90 segundos iniciales menos 83 restantes. La implementación debe usar la duración real, no esos valores fijados.
Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-ROCKET-05] P2 · active · Prueba interactiva y propuestas
**Bloqueos legibles y desbloqueo explícito**
- Actual: Hay 11 tarjetas deshabilitadas con títulos extremadamente atenuados y candados, sin una condición de desbloqueo legible.
- Instrucción: Mantener el texto con contraste legible aunque la tarjeta esté deshabilitada. Mostrar la condición real calculada por tarjeta: por ejemplo, «Completá el sector {n} para desbloquear». No sustituir la condición por un icono ni usar disabled como excusa para volver ilegible la información.
- Copy: Completá el sector {n} para desbloquear
- Aceptación: La condición de cada tarjeta puede consultarse con teclado y tacto. Un sector bloqueado no puede iniciarse.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-ROCKET-06] P2 · active · Prueba interactiva y propuestas
**Navegación específica**
- Actual: Hay múltiples etiquetas `MENÚ`, `SECTORES` y `VOLVER`, además de un enlace global de regreso fuera del modal.
- Instrucción: Usar «Volver al menú», «Elegir otro sector» o «Volver a sectores» según el destino real. Desde pausa, pedir confirmación si volver al menú descarta el intento; después de una derrota no hace falta esa confirmación.
- Copy: Volver al menú
Elegir otro sector
Volver a sectores
- Aceptación: Cada botón lleva al destino que nombra. Cancelar la salida conserva la partida.
- Referencias: evidence/rocket-pass1.jpg
evidence/rocket-pass2.jpg
- Notas: Se observaron múltiples etiquetas `MENÚ`, `SECTORES` y `VOLVER`, además de un enlace global de regreso fuera del modal.
Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

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

## [RSP-ROCKET-02] P2 · active · Responsive y controles
**En cada cambio de pantalla se borra el foco sin destino**
- Actual: `showOv()` y `hideAll()` sólo hacen blur y cambian `.show`; no hay rol/nombre de diálogo, gestión del foco inicial o restauración ni aislamiento del HUD inferior. El botón Pausa de `#top` sigue en el DOM por debajo de `.ov`. El enlace global de vuelta está por encima (z150 frente a z100), así que debe tratarse explícitamente, no desaparecer por accidente.
- Instrucción: Distinguir pantallas principales y diálogos. Para pausa/ajustes/ayuda, añadir `role="dialog"`, `aria-modal="true"`, `aria-labelledby` al título; guardar disparador y enfocar primer control relevante o título con `tabindex=-1`. Marcar `#top` y `#stage` inertes mientras cualquier overlay cubra la partida; al cerrarlo restituir foco al disparador válido o superficie del juego. Encerrar Tab/Shift+Tab dentro del diálogo activo; si el enlace global sigue visible, incluirlo como salida documentada del mismo ámbito o moverlo dentro del diálogo. No convertir el menú principal en trampa de foco sin salida.
- Copy: 
- Aceptación: Teclado solo: entrar en Ajustes, modificar sliders, cerrar y volver al disparador; pausa no deja tabular al botón que está detrás; Escape conserva su flujo actual. El lector anuncia el título una sola vez y no recorre el HUD cubierto. Probar los cuatro anchos.
- Referencias: Archivo: current_1410/jetrocket_canonical.html
Líneas: 259-399,1142-1164,1860-1862
- Notas: Problema identificado en fuente; showOv/hideAll todavía borran foco sin destino; no inert ni roles de diálogo. jet-idioma.js externo revisado, sólo maneja idioma/cookie/evento.

## [RSP-ROCKET-03] P2 · active · Responsive y controles
**Exponer el modo arcade seleccionado**
- Actual: Clásico/Tiempo/Sobrevivir son botones; `renderMenu()` sólo alterna `.active`. El estado seleccionado depende del color/borde y no queda expuesto programáticamente.
- Instrucción: Añadir `role="group" aria-label="Modo arcade"` al conjunto y `aria-pressed="true|false"` en cada botón, sincronizado desde `arcadeMode` dentro de `renderMenu()` (o usar radios nativos con un único checked). Mantener foco al seleccionar; actualizar el récord sin reemplazar el nodo del botón.
- Copy: 
- Aceptación: Lector y árbol accesible muestran exactamente un modo activo al inicio y tras cada cambio; Tab/Enter/Espacio permiten elegir cualquiera; el juego iniciado usa ese modo. Nada se desplaza a 320/360/390/768 px.
- Referencias: Archivo: current_1410/jetrocket_canonical.html
Líneas: 272-276,1872,1919
- Notas: Problema identificado en fuente; Modo arcade sólo alterna .active. aria-pressed nuevo corresponde a idioma, no al modo arcade.

## [SRC-R01] P2 · active_source_finding · Texto, estados y flujo
**#btn-campaign; mode-btn[data-mode=timer/survive]; botones pausa/resultados**
- Actual: Campaña; Tiempo; Sobrevivir; Continuar; Reiniciar; Menú; Repetir; Sectores
- Instrucción: Distinguir modo de acción y destino; mantener Despegar como CTA del briefing. En reintento indicar mismo sector, dificultad/objetivo; confirmar pérdida del recorrido antes de reiniciar o salir si no se restaura.
- Copy: Jugar campaña; Contrarreloj; Supervivencia; Reanudar partida; Reiniciar recorrido; Volver al menú; Repetir sector; Ver sectores
- Aceptación: Cada modo enseña objetivo y fin de partida antes de comenzar; pausa→ajustes→volver regresa a pausa, no al menú; repetir mantiene sector.
- Referencias: https://jetgames.fun/rocket/ — current_1410/jetrocket_canonical.html:285–440,447–523
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [SRC-R02] P2 · active_source_finding · Texto, estados y flujo
**#btn-reset**
- Actual: Toca otra vez para borrar todo
- Instrucción: La confirmación queda armada mientras resetState === 1 (estado numérico, no un booleano resetConfirm), sin timeout; abrir Ajustes restablece resetState a 0. Un segundo clic mucho más tarde, sin salir de esa pantalla, borra el progreso. Usar un modal descriptivo con Cancelar, no dejar el botón armado indefinidamente.
- Copy: Aplicar la confirmación explícita de SRC-G04.
- Aceptación: Primer clic y esperar un minuto no dejan una acción destructiva armada invisible; Cancelar desarma.
- Referencias: https://jetgames.fun/rocket/ — final_revalidation/jetrocket.html:1912–1914,1949–1953
- Notas: Riesgo derivado de fuente; Revalidación final HTTP de sólo lectura 2026-10-22 16:14–16:20 UTC. Las capturas anteriores permanecen preservadas. Este revisor no jugó.

## [VIS-ROCKET-01] P2 · active_proposal · Dirección visual interna
**Cuadrícula, muros y marco diferenciados**
- Actual: Archivo: ui_audit/source_review/current_1410/jetrocket_canonical.html
Líneas: 577; 1597–1628
Funciones: buildBg
Selectores: 
Valores literales de la fuente: COLS=12, ROWS=18; paisaje transpone
fondo #0a0418
grid rgba(0,242,207,0.05), lineWidth=1
60 estrellas fijas de 1.2px
muros #1a0838; borde #9a3eff; shadowBlur=k*0.3
- Instrucción: Definir tres niveles claros de profundidad: cuadrícula tenue, muros sólidos, entidades por delante. Mantener la cuadrícula en un gris frío o cian de baja saturación, con opacidad objetivo 0,08–0,12 cuando sea necesaria para contar casillas; dejar las estrellas decorativas por debajo y evitar estrellas brillantes en el interior de muros. Reducir el halo de muros a un máximo de 0,15 de celda y reforzar su borde sólido. Conservar las esquinas del marco como acento, sin añadir un segundo borde luminoso alrededor de cada celda.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- grid: #5F8293 a 0.12,1 CSS px
- wall_border: #9A3EFF,1.5 CSS px mínimo; no cambiar color funcional
- wall_halo: 0.15*cell máximo
- star_alpha_max: 0.2
- board_fill: #0A0418, conservar
- Copy: 
- Aceptación: Se pueden contar casillas y distinguir muro de espacio libre en 12×18 y 18×12. Captura antes/después de la misma configuración muestra idénticos obstáculos y salidas; no aparecen falsas casillas por estrellas.
- Referencias: ui_audit/source_review/current_1410/jetrocket_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar filas, columnas, transposición, coordenadas ni grosor lógico de muros. El marco no debe sugerir una regla de colisión diferente. Preservar el efecto funcional del eclipse.

## [VIS-ROCKET-02] P2 · active_proposal · Dirección visual interna
**Nave, cuerpo e ítems reconocibles**
- Actual: Archivo: ui_audit/source_review/current_1410/jetrocket_canonical.html
Líneas: 1698–1741; 1762–1794
Funciones: drawSnake
drawFood
drawCrystal
drawPowerUp
drawPortal
Selectores: 
Valores literales de la fuente: bodyW=cell*0.78
halo widths bodyW+cell*0.55 y +cell*0.25
cuerpo normal #00f2cf; escudo #00ff9c
drawRocketShape orientado por dir
- Instrucción: Conservar la nave orientada como cabeza reconocible; el cuerpo debe leerse como un tubo continuo y no como una nube de luz. Reducir únicamente el halo exterior a bodyW+0,35*cell y dejar el cuerpo sólido actual. Distinguir escudo mediante el borde/anillo ya asociado a ese estado, no cambiando toda la escena a verde. Mantener cristales facetados, power-ups con su símbolo y portales anulares; reforzar esas siluetas en lugar de recolorear todo con el mismo cian. En las vistas de ayuda usar exactamente los mismos sprites que en partida.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- outer_halo_width: bodyW+0.35*cell
- outer_halo_alpha: normal 0.07; escudo 0.10
- bodyW: cell*0.78, conservar
- secondary_halo_width: bodyW+0.25*cell, conservar
- head: drawRocketShape y orientación intactos
- Copy: 
- Aceptación: En una imagen pequeña se distingue cabeza, cuerpo, cristal, power-up y portal por silueta. La cabeza conserva orientación en cada giro. Con y sin escudo se reconoce el estado sin consultar sólo el color.
- Referencias: ui_audit/source_review/current_1410/jetrocket_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar bodyW lógico, longitud, interpolación, dirección, alcance del escudo ni colores que identifiquen ítems/portales. Un halo no representa colisión. No revelar elementos ocultos por eclipse.

## [VIS-ROCKET-03] P2 · active_proposal · Dirección visual interna
**Placas y cuenta sin tapar el recorrido**
- Actual: Archivo: ui_audit/source_review/current_1410/jetrocket_canonical.html
Líneas: 1630–1680
Funciones: draw
drawBanner
Selectores: 
Valores literales de la fuente: waiting plate rgba(5,1,8,0.82)
fMain 11–14px
countdown tamaño cell*(2+(1-fr))
eventBanner y=gy+24; tierBanner y=gy+68 si coincide
- Instrucción: Unificar las placas informativas dentro del tablero: la instrucción de espera, el anuncio de evento y el ascenso de rango deben usar el mismo fondo oscuro, borde discreto y tipografía monoespaciada, con máximos de dos líneas. Mantener los banners en su franja superior, apilados con separación de 8 px cuando coinciden; no aumentar su área hasta tapar el camino. La cuenta de inicio debe ocupar una zona estable, con numerales sólidos y sin expansión que invada muros. Mantener ayudas sólo mientras el estado las requiera.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- plate_fill: #050108 a 0.9
- plate_border: #5F8293 a 0.5,1 px
- plate_radius: 10 px
- type: 12 px/1.35, peso 700
- banner_gap: 8 px
- count_type_max: 1.5*cell, posición estable
- Copy: 
- Aceptación: Forzar espera, cuenta, evento y rango coincidentes; no hay superposición entre placas ni con HUD exterior. Las dos traducciones caben. Al reanudarse el juego, las placas transitorias desaparecen según el estado correcto.
- Referencias: ui_audit/source_review/current_1410/jetrocket_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No retrasar el inicio real ni desplazar el tablero para acomodar texto. No alterar duración de eventos, eclipse o cuenta. Preservar la placa de espera ya existente y ES/EN; no duplicarla.

## [VIS-ROCKET-04] P2 · active_proposal · Dirección visual interna
**Efectos y pausa coherentes**
- Actual: Archivo: ui_audit/source_review/current_1410/jetrocket_canonical.html
Líneas: 1630–1653; 1698–1741
Funciones: draw
drawSnake
Selectores: 
Valores literales de la fuente: STATE.shake condicionado por motionOK()
fx globalCompositeOperation=lighter
chispas vida 0.4s
escudo pulse 0.55+0.45*sin(performance.now()/220)
- Instrucción: Conservar motionOK como única política de movimiento y hacer que todos los efectos decorativos la consulten. Mantener las chispas pequeñas y detrás de la nave; no añadir bloom global ni destello blanco al recoger cada cristal. En movimiento reducido, escudo y portal conservan un anillo estable y texto/ícono de estado, sin pulsación; las trayectorias siguen representándose. Durante pausa, congelar los efectos de partida para que el fondo del panel no continúe llamando la atención.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- decorative_spark_radius: 1.5 CSS px máximo
- decorative_spark_life: 0.4s máximo
- reduced_shield: anillo estático 2 px, alpha 0.75, color existente
- paused_fx: actualización decorativa 0; sin alterar temporizadores funcionales
- Copy: 
- Aceptación: Recoger cristal, activar escudo, atravesar portal y pausar en ambas opciones de movimiento. Mismo estado lógico; en reducido los estados se distinguen sin destellos y en pausa no corren efectos decorativos sobre el panel.
- Referencias: ui_audit/source_review/current_1410/jetrocket_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No reducir información de recogida, daño o portal; sustituir animación por estado estático. No cambiar la velocidad del snake ni duración de habilidades. La implementación ya contempla reducción de sacudida y estela: ampliar/verificar, no declarar ausencia.

# Copys ES/EN aplicables
- COPY-common-resume [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-FRENTES-01, PLAY-BALIZAS-04, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Reanudar partida» | en: «Resume game» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Continuar', 'Seguir']
- COPY-common-menu [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-TELEMETRIA-05, PLAY-PORTADA-06, PLAY-FRENTES-02] es-AR: «Volver al menú» | en: «Back to menu» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-cancel [SRC-G04, SRC-R02, SRC-AN01, SRC-E02, SRC-BE01, SRC-BE02, RSP-MODALS-01, RSP-BALIZAS-02, PLAY-BALIZAS-05] es-AR: «Cancelar» | en: «Cancel» | contexto: Cancelación real: no cobrar, borrar, publicar, fusionar ni sustituir estado. Foco inicial en confirmaciones destructivas. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-delete-title [SRC-G04, SRC-R02] es-AR: «¿Borrar todo el progreso de {juego}?» | en: «Delete all progress in {juego}?» | contexto: Confirmación explícita de borrado; {datos concretos} debe enumerar solamente datos realmente afectados. «Confirmación explícita G04» era una referencia de implementación, no una cadena. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'juego', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-common-delete-body [SRC-G04, SRC-R02] es-AR: «Se borrarán {datos concretos}. Esta acción no se puede deshacer.» | en: «{datos concretos} will be deleted. This cannot be undone.» | contexto: Confirmación explícita de borrado; {datos concretos} debe enumerar solamente datos realmente afectados. «Confirmación explícita G04» era una referencia de implementación, no una cadena. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'datos concretos', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-common-delete-progress [SRC-G04, SRC-R02] es-AR: «Borrar progreso» | en: «Delete progress» | contexto: Confirmación explícita de borrado; {datos concretos} debe enumerar solamente datos realmente afectados. «Confirmación explícita G04» era una referencia de implementación, no una cadena. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-campaign [SRC-R01, PLAY-ROCKET-01, PLAY-ROCKET-06, RSP-ROCKET-03] es-AR: «Jugar campaña» | en: «Play campaign» | contexto: Mantener modo separado de acción. Sectores vuelve a selección, menú al inicio del juego, Despegar inicia briefing elegido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-timer [SRC-R01, PLAY-ROCKET-01, PLAY-ROCKET-06, RSP-ROCKET-03] es-AR: «Contrarreloj» | en: «Time Trial» | contexto: Mantener modo separado de acción. Sectores vuelve a selección, menú al inicio del juego, Despegar inicia briefing elegido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-survival [SRC-R01, PLAY-ROCKET-01, PLAY-ROCKET-06, RSP-ROCKET-03] es-AR: «Supervivencia» | en: «Survival» | contexto: Mantener modo separado de acción. Sectores vuelve a selección, menú al inicio del juego, Despegar inicia briefing elegido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-start [SRC-R01, PLAY-ROCKET-01, PLAY-ROCKET-06, RSP-ROCKET-03] es-AR: «Despegar» | en: «Take off» | contexto: Mantener modo separado de acción. Sectores vuelve a selección, menú al inicio del juego, Despegar inicia briefing elegido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-restart [SRC-R01, PLAY-ROCKET-01, PLAY-ROCKET-06, RSP-ROCKET-03] es-AR: «Reiniciar recorrido» | en: «Restart run» | contexto: Mantener modo separado de acción. Sectores vuelve a selección, menú al inicio del juego, Despegar inicia briefing elegido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-replay-sector [SRC-R01, PLAY-ROCKET-01, PLAY-ROCKET-06, RSP-ROCKET-03] es-AR: «Repetir sector» | en: «Replay sector» | contexto: Mantener modo separado de acción. Sectores vuelve a selección, menú al inicio del juego, Despegar inicia briefing elegido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-sectors [SRC-R01, PLAY-ROCKET-01, PLAY-ROCKET-06, RSP-ROCKET-03] es-AR: «Ver sectores» | en: «View sectors» | contexto: Mantener modo separado de acción. Sectores vuelve a selección, menú al inicio del juego, Despegar inicia briefing elegido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-other-sector [SRC-R01, PLAY-ROCKET-01, PLAY-ROCKET-06, RSP-ROCKET-03] es-AR: «Elegir otro sector» | en: «Choose another sector» | contexto: Mantener modo separado de acción. Sectores vuelve a selección, menú al inicio del juego, Despegar inicia briefing elegido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-back-sectors [SRC-R01, PLAY-ROCKET-01, PLAY-ROCKET-06, RSP-ROCKET-03] es-AR: «Volver a sectores» | en: «Back to sectors» | contexto: Mantener modo separado de acción. Sectores vuelve a selección, menú al inicio del juego, Despegar inicia briefing elegido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-arcade-mode [SRC-R01, PLAY-ROCKET-01, PLAY-ROCKET-06, RSP-ROCKET-03] es-AR: «Modo arcade» | en: «Arcade mode» | contexto: Mantener modo separado de acción. Sectores vuelve a selección, menú al inicio del juego, Despegar inicia briefing elegido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-timer-description [PLAY-ROCKET-01] es-AR: «Contrarreloj: conseguí tantos puntos como puedas en {s} segundos. Chocar termina la partida.» | en: «Time Trial: score as many points as you can in {s} seconds. A collision ends the game.» | contexto: {s}: duración configurada del modo, no 90 s fijados por una sesión. | condición: Verificar duración y regla de choque en versión canónica vigente antes de conectar. | params: [{'name': 's', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-rocket-controls [PLAY-ROCKET-02] es-AR: «Controles» | en: «Controls» | contexto: Práctica guiada sólo opcional o separada. No cambiar física/dificultad del primer sector ordinario para enseñar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-advanced [PLAY-ROCKET-02] es-AR: «Reglas avanzadas» | en: «Advanced rules» | contexto: Práctica guiada sólo opcional o separada. No cambiar física/dificultad del primer sector ordinario para enseñar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-skip [PLAY-ROCKET-02] es-AR: «Omitir tutorial» | en: «Skip tutorial» | contexto: Práctica guiada sólo opcional o separada. No cambiar física/dificultad del primer sector ordinario para enseñar. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-rocket-points [PLAY-ROCKET-03, PLAY-ROCKET-04, PLAY-ROCKET-05] es-AR: «Puntos: {n}» | en: «Points: {n}» | contexto: No hardcodear 0 puntos, 83 s, 7 s o sector 1; condición calculada por tarjeta y tiempo transcurrido real, no mera resta si hubo pausas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-rocket-time-left [PLAY-ROCKET-03, PLAY-ROCKET-04, PLAY-ROCKET-05] es-AR: «Tiempo restante: {s} s» | en: «Time remaining: {s} s» | contexto: No hardcodear 0 puntos, 83 s, 7 s o sector 1; condición calculada por tarjeta y tiempo transcurrido real, no mera resta si hubo pausas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 's', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-rocket-duration [PLAY-ROCKET-03, PLAY-ROCKET-04, PLAY-ROCKET-05] es-AR: «Duración de la partida: {s} s» | en: «Game duration: {s} s» | contexto: No hardcodear 0 puntos, 83 s, 7 s o sector 1; condición calculada por tarjeta y tiempo transcurrido real, no mera resta si hubo pausas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 's', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-rocket-unlock [PLAY-ROCKET-03, PLAY-ROCKET-04, PLAY-ROCKET-05] es-AR: «Completá el sector {n} para desbloquear.» | en: «Complete sector {n} to unlock.» | contexto: No hardcodear 0 puntos, 83 s, 7 s o sector 1; condición calculada por tarjeta y tiempo transcurrido real, no mera resta si hubo pausas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
