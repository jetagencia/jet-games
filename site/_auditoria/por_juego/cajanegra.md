# cajanegra: 15 registros del catálogo, 38 copys

## [RSP-CAJA-01] P1 · active · Responsive y controles
**Tab no puede quedar encerrado entre huecos del informe**
- Actual: `current_1410/cajanegra__cajanegra__src__app.js:1389–1395` intercepta todo Tab/Shift+Tab durante partida viva y recorre `idsHuecos(caso)` circularmente.
- Instrucción: Devolver Tab al navegador. Hacer los huecos botones nativos tabulables; si se quiere una sola parada de Tab por grupo, usar roving tabindex y ArrowLeft/ArrowRight **sólo con foco dentro del informe**, no desde evidencia/fichas/acciones. No reciclar las flechas actualmente usadas para elegir ficha sin definir un modo claro: recomendación mínima es dejar cada hueco en el orden DOM, sin añadir otro atajo global. Si se conserva navegación rápida, añadir dos botones nativos «Hueco anterior/siguiente» de 44 px al encabezado del informe, sin interceptar Tab ni los corchetes ya usados para registros.
- Copy: 
- Aceptación: Tab alcanza registros, huecos, banco de palabras, Verificar, Historial y Pausa y puede salir de cada grupo. Shift+Tab invierte exactamente el orden. Abrir banco portátil a 320/360/390 y usar teclado no pierde el foco bajo la hoja.
- Referencias: Archivo: current_1410/cajanegra__cajanegra__src__app.js
Líneas: 1389–1395
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-MODALS-01] P1 · active · Responsive y controles
**Contención, nombre y retorno de foco de superposiciones**
- Actual: **P1/P2 según acción de fondo; confianza alta en la ausencia de contención.** No confundir con un simple cambio visual de `z-index`: el fondo sigue siendo navegable si sólo se dibuja una capa encima.

| Juego | Evidencia concreta | Estado actual |
|---|---|---|
| Señal | `current_1410/senal__senal__src__app.js:975–995`, `1526–1540`; `current_1410/senal.html:85` | `abrirModal()` muestra `#velo` y enfoca un control; `cerrarModal()` vacía HTML. No guarda/restaura el activador ni aplica `inert`; no hay ciclo Tab. `role=dialog aria-modal=true` sin nombre conectado al título. |
| Telemetría | `current_1410/telemetria__telemetria__src__ui.js:186–191`, `1186–1194`; `current_1410/telemetria.html:65–68` | `abrirOv/cerrarOv` cambian `.on` y autofocus. No contención Tab ni retorno al activador; los diálogos tienen `aria-modal` pero no nombre. |
| Portada | `current_1410/portada__portada__src__ui.js:91–120`, `657–664`; `current_1410/portada__portada__src__style.css:29`; `current_1410/portada.html:179` | Las pantallas de pila se ocultan entre sí, pero `#game` no se vuelve `inert` al abrir Ajustes/Pausa/Detalle; la capa puede cubrir controles todavía tabulables. `back()` no restaura foco. |
| Caja Negra | `current_1410/cajanegra__cajanegra__src__app.js:339–346`, `903–914`, `1143`, `1372–1384`; `current_1410/cajanegra.html:38–42` | Autofocus parcial y retornos especiales para Ajustes, pero ninguna contención/inert general para las cinco `.capa`. Los diálogos declarados no tienen nombre. |
| Cráter | `current_1410/crater__crater__src__ui.js:58–61`, `294–298`; `current_1410/crater.html:135–174` | Pila y z-index correctos visualmente, pero no `inert` ni ciclo Tab. `cerrar()` retorna siempre al canvas si está en ronda, no al botón que abrió la capa. `.scr.modal` no declara rol modal. |
| Frentes | `current_1410/frentes__frentes__src__game.js:88–114`, `1184–1194` | Las capas y hojas sólo reciben `.on`. No desactivación de controles de fondo, captura de Tab ni retorno al activador. |
| Estación | `current_1410/estacion__estacion__src__ui.js:64–67`, `139–168`, `637–646`; `current_1410/estacion.html:41–42` | `screen()` apila DIVs; el inspector declara `aria-modal=true` pero no nombre. La apertura no vuelve inerte al fondo, el cierre hace `.blur()` y pierde el punto de retorno. |


- Instrucción: **Implementación precisa para cada juego:**
1. Al abrir, guardar `document.activeElement` por entrada de pila; marcar `inert=true` en la pantalla base y cualquier capa inferior. No marcar inerte un ancestro que contenga el diálogo activo.
2. Diálogo activo con `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando a su `h2/h3` de ID estable; conservar `alertdialog` sólo para una confirmación urgente. Asignar `tabindex=-1` al contenedor si no tiene controles.
3. Enfocar título o primer control útil sin condicionar a `hover:hover`/`pointer:fine`: un dispositivo táctil puede tener teclado conectado. En confirmaciones destructivas, foco inicial en Cancelar.
4. Tab y Shift+Tab recorren únicamente controles visibles/habilitados de la capa superior. Escape cierra sólo esa capa cuando sea cancelable. `aria-modal` no reemplaza `inert` ni el control de foco.
5. Al cerrar, restaurar el estado `inert` de la pila y foco al activador si sigue visible; si desapareció, enfocar el título/primer control lógico de la pantalla revelada. No usar `.blur()` como gestión de foco.


- Copy: 
- Aceptación: **Aceptación común:** en las cuatro anchuras indicadas, abrir Ajustes, Ayuda, Pausa y una confirmación/resultado con teclado. Recorrer al menos dos ciclos Tab y uno inverso: nunca aparece foco detrás ni se activa el juego. Cerrar devuelve el foco al disparador correcto. Con lector de pantalla se anuncia tipo y título del diálogo. Hacer prueba anidada (Pausa → Ajustes → cerrar → Reanudar partida).

**Excepción importante:** Antes ya tiene ciclo Tab en `current_1410/antes__antes__src__main.js:677–686`; no reemplazarlo por otro duplicado. Completar allí semántica `role/aria-modal/aria-labelledby` e `inert` del fondo, y quitar condicionamiento `!tactil` de la gestión de foco de `674–676`. Sus `.ov` HTML son DIVs sin rol.
- Referencias: Archivo: current_1410/senal__senal__src__app.js
Líneas: 975–995
Archivo: current_1410/senal.html
Líneas: 85
Archivo: current_1410/telemetria__telemetria__src__ui.js
Líneas: 186–191
Archivo: current_1410/telemetria.html
Líneas: 65–68
Archivo: current_1410/portada__portada__src__ui.js
Líneas: 91–120
Archivo: current_1410/portada__portada__src__style.css
Líneas: 29
Archivo: current_1410/portada.html
Líneas: 179
Archivo: current_1410/cajanegra__cajanegra__src__app.js
Líneas: 339–346
Archivo: current_1410/cajanegra.html
Líneas: 38–42
Archivo: current_1410/crater__crater__src__ui.js
Líneas: 58–61
Archivo: current_1410/crater.html
Líneas: 135–174
Archivo: current_1410/frentes__frentes__src__game.js
Líneas: 88–114
Archivo: current_1410/estacion__estacion__src__ui.js
Líneas: 64–67
Archivo: current_1410/estacion.html
Líneas: 41–42
Archivo: current_1410/antes__antes__src__main.js
Líneas: 677–686
- Notas: Problema identificado en fuente; HTML y JS de estos 8 juegos revalidados. Los únicos cambios de CSS de Telemetría/Caja agregan colocación del selector de idioma; no añaden gestión de foco, inert ni semántica de diálogo. Telemetría conserva visibility:hidden en su sheet cerrado; no atribuirle el defecto de Frentes.

## [VIS-CAJA-02] P1 · active_proposal · Dirección visual interna
**Fotografía de evidencia: óptica limpia sin alterar lo fotografiado**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/cajanegra__cajanegra__src__dibujo.js :: D.escenaFoto
ui_audit/source_review/current_1410/cajanegra__cajanegra__src__estilo.css :: .fotoCv, .zoomCtl, .zoomNiv, .desc
Estado identificado en la revisión: Fotografía sintética usa hora datos.reloj, astronautas/parches COLOR_PARCHE, objetos y escena; post viñeta .6, ruido RGB (R()-.5)*22 y aberración screen alfa .07 a±3 px. Varios datos visuales son prueba; .fotoCv.flash aplica brightness2.4/contrast.6.
- Instrucción: Separar renderEvidence(datos) de renderCameraFinish(image). Mantener evidencia al 100%: composición, número de personas, parches/números/colores, reloj, kit, casco/tableta/botiquín/cable, señales y ventana. En post, viñeta máxima .28, grano (rngVisual()-.5)*8, aberración desactivada; no consumir RNG que gobierne evidencia. No reilustrar con IA. Mantener cámara documental con marca CAM02/REC existente, reducir solo peso decorativo del marco. Cambiar flash CSS a overlay blanco alfa .12→0 en 140 ms, sin filtro de contraste sobre pruebas. Zoom: controles 44 px, material #141D28 alfa .94, borde 1 px #415166, iconos 20 px; indicador mono 12 px. Descripción 15 px/1.55 y sin glow. Añadir comparación interna con post apagado para comprobar que el acabado no borra un parche.
- Copy: 
- Aceptación: Para todos los datos del banco, render base antes/después debe ser píxel-identical si post apagado.
OCR/manual: hora, placa y números de parche iguales a 1×/2×; cualquier dificultad intencional sigue presente.
Semilla produce idéntico layout; nuevo rngVisual separado de rndSemilla de evidencia.
No ejecutar flash si reduced-motion; foto sigue mostrada.
- Referencias: ui_audit/source_review/current_1410/cajanegra__cajanegra__src__dibujo.js :: D.escenaFoto
ui_audit/source_review/current_1410/cajanegra__cajanegra__src__estilo.css :: .fotoCv, .zoomCtl, .zoomNiv, .desc
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No alterar datos ni generar evidencia nueva. No cambiar posición de personas/objetos ni hacer legibles ocultaciones intencionales. Mantener parche color+número: nunca cambiar colores para adaptarlos al nuevo tema.

## [VIS-CAJA-03] P1 · active_proposal · Dirección visual interna
**Gráficas de telemetría del expediente: trazos técnicos, no degradado decorativo**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/cajanegra__cajanegra__src__dibujo.js :: D.telemetria, D.valorSerie, D.fmtValor
ui_audit/source_review/current_1410/cajanegra__cajanegra__src__estilo.css :: .telCv, .telLeyenda, .tabla
Estado identificado en la revisión: D.telemetria (dentro de Caja Negra, no el juego Telemetría) dibuja malla5min/10min, curvas2 px con degradado cian→#8f6bff, fill.12, labels11/11.5 px y cursor ámbar1.5 px con badges.
- Instrucción: Mantener escalas/rangos/muestras/rendimiento y mapping x/xinv. Curva base sólida #83E1D1 de 2 CSS px sin glow; el color ya no cambia con el eje temporal (no implica categoría falsa). Rejilla mayor #60758A alfa .22, menor alfa .10 a 1 px; cada carril relleno alterno blanco .018 o transparente. Label y unidades 12 px mono, texto #CBD7E1; reservar 28 px de encabezado existente o aumentar solo alto de carril si hace falta, nunca cubrir datos. Cursor conserva ámbar #ffd166 a 1.5 px; punto 4 px con centro oscuro 1.5 px. Tooltip fondo #16202C alfa .98, borde #ffd166 alfa .7, padding 6/8 px, radio 4; clamp bidireccional X/Y dentro del carril. Eje temporal muestra las mismas horas. Tabla espejo:13 px mono, filas 32 px mínimo, zebra blanco .02, cabecera opaca. Mantener etiquetas de series y marcas del usuario como fuente de identidad, no inventar leyenda de estados de fallo.
- Copy: 
- Aceptación: Comparar arrays (t, valor) exactos antes/después para cada serie y cursor.
Mismas xinv(x(t)) al epsilon anterior; drag de cursor no cambia dominio.
Tooltip en extremos t0/t1 y valores min/max permanece visible y no oculta nombre de otra serie.
Etiquetas numéricas y unidades completas en todos los idiomas.
- Referencias: ui_audit/source_review/current_1410/cajanegra__cajanegra__src__dibujo.js :: D.telemetria, D.valorSerie, D.fmtValor
ui_audit/source_review/current_1410/cajanegra__cajanegra__src__estilo.css :: .telCv, .telLeyenda, .tabla
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No suavizar/interpolar curvas, no normalizar cada muestra, no desplazar tiempos ni thresholds; D.valorSerie y D.fmtValor intactos. El acabado no señala cuál sistema falla ni resuelve una hipótesis.

## [PLAY-CAJA-01] P2 · active · Prueba interactiva y propuestas
**Equilibrar lectura, informe y banco de fichas**
- Actual: En el tutorial 2, el informe ocupa casi toda la columna derecha y el banco de 13 fichas queda en un panel de unos 190 px, con desplazamiento interno. A la izquierda hay abundante espacio vacío. Las categorías no pertinentes siguen ocupando el banco, aunque se atenúen.
- Instrucción: Mantener legibles los registros, el informe y el banco de fichas mediante una jerarquía de tres regiones. Al activar un hueco, mostrar primero las fichas de su categoría y ofrecer un control para verlas todas. No obligar a buscar entre categorías ajenas mediante un desplazamiento estrecho. Permitir ampliar el registro o el informe sin perder la selección del hueco ni la respuesta elegida.
- Copy: Fichas para: {categoría}
Ver todas las categorías
Ampliar registro
Volver al caso
- Aceptación: A 1180×757, todas las respuestas de la categoría activa caben y no quedan ocultas detrás de «Verificar informe». El texto conserva un tamaño de lectura adecuado y las pistas no cambian.
- Referencias: evidence/caja-pass1-gameplay.jpg
evidence/caja-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:37:00Z/2026-10-22T15:45:00Z

## [PLAY-CAJA-02] P2 · active · Prueba interactiva y propuestas
**Separar marcar evidencia de llenar un hueco**
- Actual: Los nombres, las horas y los módulos subrayados son casillas de verificación para marcar evidencia; las fichas del banco son botones para responder. Hacer clic en una respuesta ya colocada la vacía inmediatamente, y el banco cambia de orden según la categoría seleccionada.
- Instrucción: Explicar ambas acciones junto a la primera interacción. Distinguir visualmente la selección del hueco que se va a editar del resaltado de evidencia. Permitir sustituir una respuesta sin borrarla por accidente; si se mantiene el clic para vaciar, comunicarlo y ofrecer deshacer. Conservar el marcado transversal de términos entre registros sin inferir ni completar automáticamente la respuesta.
- Copy: Marcar en todos los registros
Elegí un hueco y después una ficha del banco.
Cambiar respuesta
Vaciar hueco
Deshacer cambio
- Aceptación: Marcar un término de un registro no se confunde con responder el informe. El jugador identifica el hueco que editará y puede recuperar una respuesta retirada.
- Referencias: evidence/caja-pass1-gameplay.jpg
evidence/caja-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:37:00Z/2026-10-22T15:45:00Z

## [PLAY-CAJA-03] P2 · active · Prueba interactiva y propuestas
**Historial de hipótesis sin revelar la solución**
- Actual: Envíos anteriores muestra Envío 1 / 1 error · 2:32, pero no la combinación enviada. La respuesta del sistema informa sólo cuántos datos fallan, por diseño.
- Instrucción: Guardar y mostrar una instantánea completa de la hipótesis que el jugador envió en cada intento, con su fecha o tiempo y la cantidad total de errores que devolvió la verificación. La instantánea debe conservar los valores de ese momento, no referencias mutables al informe actual. Permitir comparar qué respuestas cambió el jugador entre intentos con un resaltado neutro. No marcar cuáles respuestas son correctas o incorrectas, ni contrastar cada campo con la solución oculta para enriquecer la vista. Reutilizar los datos históricos existentes si permiten reconstruir fielmente la hipótesis; si un registro antiguo sólo conserva el total de errores, indicarlo sin inventar sus respuestas a partir del informe actual o de la solución.
- Copy: Intentos anteriores
Intento {n} · {errores} datos no coinciden
Ver informe de este intento
Comparar con el informe actual
- Aceptación: Después de cambiar una ubicación, el historial conserva la ubicación que se envió antes y su resultado agregado. La comparación muestra diferencias entre hipótesis del jugador, no aciertos o errores por casilla. Editar el informe actual no modifica los intentos anteriores; un historial antiguo sin hipótesis no se presenta como si la tuviera.
- Referencias: evidence/caja-pass2-history.jpg
evidence/caja-pass2-error.jpg
- Notas: Ventana de observación: 2026-10-22T15:37:00Z/2026-10-22T15:45:00Z

## [PLAY-CAJA-04] P2 · active · Prueba interactiva y propuestas
**Plural y etiquetas coherentes de personal e intentos**
- Actual: Tripulación muestra 1 parche y 2 parche, además de 3 parche en el primer caso. Los resultados y el historial usan Envíos, aunque la evaluación es local y el CTA dice Verificar informe.
- Instrucción: Aplicar pluralización según la cantidad. Usar «Intentos de verificación» para el recuento, «Intentos anteriores» para el historial y «Verificar informe» para la acción local. Separar el lenguaje ficcional de firmar un informe de la acción real de comprobarlo; ningún texto debe sugerir publicación en un servidor cuando no ocurre. Aplicar también concordancia singular y plural al recuento de datos que no coinciden en cada intento.
- Copy: 1 parche
{cantidad} parches
Intentos de verificación
Intentos anteriores
Verificar informe
- Aceptación: Los casos singulares y plurales muestran concordancia correcta, tanto en parches como en datos que no coinciden. Ningún texto implica un envío público cuando sólo se verifica localmente.
- Referencias: evidence/caja-pass1-gameplay.jpg
evidence/caja-pass2-history.jpg
evidence/caja-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:37:00Z/2026-10-22T15:45:00Z

## [PLAY-CAJA-05] P2 · active · Prueba interactiva y propuestas
**Entrada al caso sin segundo inicio oculto ni tiempo previo**
- Actual: Después de Empezar/Siguiente aparece una caja animada con Haz clic para empezar, pero el árbol de accesibilidad sigue exponiendo la pantalla anterior. Al abrir los materiales, el reloj ya marcaba 0:08 o 0:10.
- Instrucción: Eliminar el segundo clic redundante o convertirlo en un botón visible «Abrir expediente» con foco. En un caso nuevo, iniciar el cronómetro cuando los materiales estén visibles y puedan utilizarse, no durante la carga o la transición. Respetar la preferencia de movimiento reducido y ofrecer «Omitir animación». Si se retoma un caso guardado, conservar su tiempo acumulado; no reiniciarlo como efecto secundario de esta corrección.
- Copy: Abrir expediente
Omitir animación
Tiempo de investigación
- Aceptación: El caso puede abrirse con teclado. En un caso nuevo, el contador parte de cero al presentar el primer registro utilizable, sin sumar carga ni animación. Al retomar un caso, se conserva el tiempo acumulado que corresponde.
- Referencias: evidence/caja-pass1-gameplay.jpg
evidence/caja-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:37:00Z/2026-10-22T15:45:00Z

## [PLAY-CAJA-06] P2 · active · Prueba interactiva y propuestas
**Guías sin tapar pistas y diálogos accesibles**
- Actual: En el tutorial 2, el globo que explica cómo cruzar registros tapa parte de las filas de Tripulación. El modal Cómo se sabía mantiene el foco en Ver registro, en el fondo; el árbol de accesibilidad de la pausa conserva las acciones del caso.
- Instrucción: Situar el globo en un espacio que no cubra la evidencia relacionada, con anclaje claro y controles para cerrarlo o volver a leerlo. Implementar los diálogos con foco inicial, fondo inert, cierre mediante Escape y restauración del foco. Dar un nombre contextual a cada «Ver registro» y a los cierres. Mantener disponible la transcripción de radio para resolver sin depender del audio.
- Copy: Ver registro: {nombre}, {hora}
Cerrar explicación
Volver a mostrar consejo
Radio · transcripción disponible
- Aceptación: Ninguna guía oculta la pista que está explicando. No se navega a respuestas detrás de la pausa o de una explicación modal, y el caso puede resolverse usando sólo texto.
- Referencias: evidence/caja-pass2-gameplay.jpg
evidence/caja-pass2-error.jpg
- Notas: Ventana de observación: 2026-10-22T15:37:00Z/2026-10-22T15:45:00Z

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

## [SRC-CN01] P2 · active_source_finding · Texto, estados y flujo
**Editor del informe**
- Actual: Banco · {n} fichas; Faltan {n} huecos; Envíos anteriores; Verificar informe
- Instrucción: Evitar «banco», «hueco» y «envío» sin explicación. Mantener visible la categoría del campo y separar el estado de duda del valor elegido. Usar «Verificar informe» para la validación local y «Intentos anteriores» para el historial, sin sugerir envío a terceros. Cada intento debe conservar la hipótesis enviada y su resultado agregado para comparar deducciones del jugador, nunca para revelar qué campos ocultos son correctos o incorrectos.
- Copy: Palabras disponibles · {n}
Faltan {n} campos por completar
Intentos anteriores
Verificar informe
- Aceptación: Antes de verificar se identifican los campos faltantes. Cambiar de registro no pierde las palabras elegidas. La respuesta conserva la regla de informar cuántos errores hay sin revelar cuáles. El historial mantiene cada hipótesis enviada y su total de errores, sin reconstruir respuestas antiguas a partir de la solución.
- Referencias: https://jetgames.fun/cajanegra/src/i18n.js?v=3 — juego.banco/faltan/historial/verificar
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [SRC-CN02] P2 · active_source_finding · Texto, estados y flujo
**Solución, pausa, resultados**
- Actual: Sí, verla; Inicio; Continuar; Archivado sin resolver
- Instrucción: Advertir el impacto en racha antes de revelar si corresponde al modo. Mantener Seguir investigando como cancelación. Distinguir caso resuelto de archivado sin resolver en título, estrellas y acciones.
- Copy: Ver solución y cerrar el caso / Volver al menú / Reanudar partida / Caso archivado sin resolver
- Aceptación: Revelar la solución no presenta éxito ni estrellas de un caso resuelto. Cancelar conserva el informe y las marcas. Reanudar partida restaura el caso pausado.
- Referencias: https://jetgames.fun/cajanegra/src/i18n.js?v=3 — juego.rendirse/res.inicio/pausa.continuar
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-CAJA-01] P2 · active_proposal · Dirección visual interna
**Mesa de investigación: separar documento, controles y anotaciones**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/cajanegra__cajanegra__src__estilo.css :: :root, .visor, .informe, .regCab, .regBody, .tab
Estado identificado en la revisión: Variables --panel #0a0418, --panel2 #0f0822, --linea violeta .35. .visor y .informe comparten radio 16/borde violeta; .tab seleccionado violeta .2 y underline degradado. --fs-reg14.5 px; cuerpo interlínea 1.6.
- Instrucción: Introducir tokens CN_ART de superficie, no reemplazar tokens semánticos --c-* ni --m*. Fondo del área de trabajo #0C1018; visor #151B25, informe #1B222D, controles #101620. Borde estructural #344251 de 1 px y radio de 10 px, sombra 0 6 px 18 px negro .20; eliminar doble halo violeta en reposo. Espaciado (no tamaño de letra): cabeceras .regCab con padding de 12 px vertical y 16 px horizontal; cuerpo .regBody con padding de 12 px en el layout compacto y 16 px en los cuatro lados dentro de #sJuego.wide. Tipografía, independiente del padding: texto de registros .regBody a 15 px, line-height: 1.65, tanto en compacto como en escritorio; texto del informe a 16 px, line-height: 1.6. Fijar sólo los valores base --fs-reg: 15px y --fs-inf: 16px; conservar las anulaciones existentes de html.grande (--fs-reg: 16.2px y --fs-inf: 18px), sin sobrescribirlas con tamaños fijos en los selectores. Los 12/16 px de espaciado nunca deben usarse como font-size del cuerpo. Títulos de 18 px y peso 600; metadatos de 12 px en tipografía monoespaciada, color #AEBCCB. Pestañas con radio de 8 px: la seleccionada usa relleno #253447 y subrayado cian sólido de 2 px (no degradado); la inactiva es transparente. Mantener las anotaciones como elemento de mayor color y preservar patrones existentes.
- Copy: 
- Aceptación: Mismos registros y mismo orden en ES/EN; el informe no se reescribe.
Con todas las seis marcas activas, categorías y selección de tab se distinguen por patrón/posición además del color.
Medir 4.5:1 para texto; modo contraste y grande continúan diferenciados.
- Referencias: ui_audit/source_review/current_1410/cajanegra__cajanegra__src__estilo.css :: :root, .visor, .informe, .regCab, .regBody, .tab
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No reformatear horas, nombres, transcripciones, partes ilegibles ni orden de pruebas. No quitar categorías, marcadores o indicador de pruebas nuevas. No sustituir pantalla por papel blanco que altere colores de fotografía.

## [VIS-CAJA-04] P2 · active_proposal · Dirección visual interna
**Marcado de pistas y estados: legibles sin destellos agresivos**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/cajanegra__cajanegra__src__estilo.css :: .ent, .mk.mk0–mk5, .linea.resalta, .ileg, .ent.destello, .tab .punto, .casoF
Estado identificado en la revisión: .mk usa6 colores con patrones distintos (diagonal45/135, vertical/horizontal/plano); .ileg oculta texto con ruido animado; .destello brightness2.2; casos disponibles respiran2.8s.
- Instrucción: Preservar los 6 patrones y tonos m0…m5; bajar únicamente opacidad del relleno de marcado a .18–.25 manteniendo subrayado 3 px original y texto #F6FAFC. Línea activa resalta fondo ámbar .08 y barra lateral 3 px; foco teclado blanco 2 px offset 2 además del subrayado. Sustituir brightness2.2 por transición de fondo 120 ms y breve anillo de 120 ms, sin mover texto. .tab .punto fijo 8 px con borde 1 px del fondo; no pulsar permanentemente. Caso disponible borde #7D92AF y pequeño estado textual existente; no respiración infinita. .ileg no debe hacerse legible: mantiene máscara estática bajo reduced-motion, no color transparente eliminado. Usar icono/check existente para resuelto, no depender solo del borde cian.
- Copy: 
- Aceptación: Prueba todas las 6 marcas, hover/foco y selección; no desactivar patrones por nuevo CSS.
Comparar texto accesible y visible de .ileg antes/después; ninguna filtración nueva.
Reduced-motion desactiva destellos/pulsos pero no eventos ni estado.
- Referencias: ui_audit/source_review/current_1410/cajanegra__cajanegra__src__estilo.css :: .ent, .mk.mk0–mk5, .linea.resalta, .ileg, .ent.destello, .tab .punto, .casoF
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Marcado es del usuario: ningún algoritmo marca pistas correctas automáticamente. Conservar diferencias entre seleccionado, disponible, cerrado, completado y borrado. Mantener fragmentos ilegibles y sus condiciones de revelado.

# Copys ES/EN aplicables
- COPY-common-resume [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-FRENTES-01, PLAY-BALIZAS-04, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Reanudar partida» | en: «Resume game» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Continuar', 'Seguir']
- COPY-common-menu [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-TELEMETRIA-05, PLAY-PORTADA-06, PLAY-FRENTES-02] es-AR: «Volver al menú» | en: «Back to menu» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-cancel [SRC-G04, SRC-R02, SRC-AN01, SRC-E02, SRC-BE01, SRC-BE02, RSP-MODALS-01, RSP-BALIZAS-02, PLAY-BALIZAS-05] es-AR: «Cancelar» | en: «Cancel» | contexto: Cancelación real: no cobrar, borrar, publicar, fusionar ni sustituir estado. Foco inicial en confirmaciones destructivas. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-word-bank [SRC-CN01, RSP-CAJA-01] es-AR: «Palabras disponibles · {n}» | en: «Available words · {n}» | contexto: Comprobación local, no envío a terceros. Campo reemplaza hueco en UI. Botones anterior/siguiente sólo si se conserva navegación rápida; Tab sigue nativo. No revelar cuáles campos están mal si juego sólo informa cantidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-caja-missing-fields [SRC-CN01, RSP-CAJA-01] es-AR: «Faltan {n} campos por completar» | en: «{n} fields left to complete» | contexto: Comprobación local, no envío a terceros. Campo reemplaza hueco en UI. Botones anterior/siguiente sólo si se conserva navegación rápida; Tab sigue nativo. No revelar cuáles campos están mal si juego sólo informa cantidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-caja-one-missing-field [SRC-CN01, RSP-CAJA-01] es-AR: «Falta 1 campo por completar» | en: «1 field left to complete» | contexto: Comprobación local, no envío a terceros. Campo reemplaza hueco en UI. Botones anterior/siguiente sólo si se conserva navegación rápida; Tab sigue nativo. No revelar cuáles campos están mal si juego sólo informa cantidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-previous-checks [SRC-CN01, RSP-CAJA-01, PLAY-CAJA-03, PLAY-CAJA-04] es-AR: «Intentos anteriores» | en: «Previous attempts» | contexto: Comprobación local, no envío a terceros. Campo reemplaza hueco en UI. Botones anterior/siguiente sólo si se conserva navegación rápida; Tab sigue nativo. No revelar cuáles campos están mal si juego sólo informa cantidad. Canon de historial: intentos de verificación locales con hipótesis enviadas y resultado agregado, sin revelar qué componentes ocultos fallaron. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-check-report [SRC-CN01, RSP-CAJA-01, PLAY-CAJA-04] es-AR: «Verificar informe» | en: «Verify report» | contexto: Comprobación local, no envío a terceros. Campo reemplaza hueco en UI. Botones anterior/siguiente sólo si se conserva navegación rápida; Tab sigue nativo. No revelar cuáles campos están mal si juego sólo informa cantidad. Revisión estática de red 15:31–15:35: esta evaluación es local; compartir es otra función. No implica ausencia total de GET/descargas/métricas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-prev-field [SRC-CN01, RSP-CAJA-01] es-AR: «Campo anterior» | en: «Previous field» | contexto: Comprobación local, no envío a terceros. Campo reemplaza hueco en UI. Botones anterior/siguiente sólo si se conserva navegación rápida; Tab sigue nativo. No revelar cuáles campos están mal si juego sólo informa cantidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-next-field [SRC-CN01, RSP-CAJA-01] es-AR: «Campo siguiente» | en: «Next field» | contexto: Comprobación local, no envío a terceros. Campo reemplaza hueco en UI. Botones anterior/siguiente sólo si se conserva navegación rápida; Tab sigue nativo. No revelar cuáles campos están mal si juego sólo informa cantidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-reveal-and-close [SRC-CN02] es-AR: «Ver solución y cerrar el caso» | en: «View solution and close case» | contexto: Mostrar impacto en racha sólo si corresponde al modo. No presentar archivado sin resolver como éxito. En pausa usar Reanudar partida por decisión maestra; en menú guardado Continuar partida. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-unsolved [SRC-CN02] es-AR: «Caso archivado sin resolver» | en: «Case filed as unsolved» | contexto: Mostrar impacto en racha sólo si corresponde al modo. No presentar archivado sin resolver como éxito. En pausa usar Reanudar partida por decisión maestra; en menú guardado Continuar partida. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-keep-investigating [SRC-CN02] es-AR: «Seguir investigando» | en: «Keep investigating» | contexto: Mostrar impacto en racha sólo si corresponde al modo. No presentar archivado sin resolver como éxito. En pausa usar Reanudar partida por decisión maestra; en menú guardado Continuar partida. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-streak-warning [SRC-CN02] es-AR: «Se cortará tu racha.» | en: «Your streak will end.» | contexto: Mostrar impacto en racha sólo si corresponde al modo. No presentar archivado sin resolver como éxito. En pausa usar Reanudar partida por decisión maestra; en menú guardado Continuar partida. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-category-tokens [PLAY-CAJA-01] es-AR: «Fichas para: {categoría}» | en: «Tokens for: {categoría}» | contexto: Categoría del campo activo desde esquema real; ampliar registro/informe conserva selección, marcas y respuestas. No filtrar categorías de modo que revele qué respuesta oculta es correcta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'categoría', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-caja-all-categories [PLAY-CAJA-01] es-AR: «Ver todas las categorías» | en: «View all categories» | contexto: Categoría del campo activo desde esquema real; ampliar registro/informe conserva selección, marcas y respuestas. No filtrar categorías de modo que revele qué respuesta oculta es correcta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-expand-record [PLAY-CAJA-01] es-AR: «Ampliar registro» | en: «Expand record» | contexto: Categoría del campo activo desde esquema real; ampliar registro/informe conserva selección, marcas y respuestas. No filtrar categorías de modo que revele qué respuesta oculta es correcta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-back-case [PLAY-CAJA-01] es-AR: «Volver al caso» | en: «Back to case» | contexto: Categoría del campo activo desde esquema real; ampliar registro/informe conserva selección, marcas y respuestas. No filtrar categorías de modo que revele qué respuesta oculta es correcta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-mark-all-records [PLAY-CAJA-02] es-AR: «Marcar en todos los registros» | en: «Mark across all records» | contexto: Campo es el hueco del informe, distinto de marca de evidencia. Marcar no infiere ni completa respuesta. Vaciar/sustituir/deshacer sólo cambia el informe del usuario; no indica corrección de la respuesta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-fill-instruction [PLAY-CAJA-02] es-AR: «Elegí un campo y después una ficha para completarlo.» | en: «Choose a field, then a token to fill it in.» | contexto: Campo es el hueco del informe, distinto de marca de evidencia. Marcar no infiere ni completa respuesta. Vaciar/sustituir/deshacer sólo cambia el informe del usuario; no indica corrección de la respuesta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-change-answer [PLAY-CAJA-02] es-AR: «Cambiar respuesta» | en: «Change answer» | contexto: Campo es el hueco del informe, distinto de marca de evidencia. Marcar no infiere ni completa respuesta. Vaciar/sustituir/deshacer sólo cambia el informe del usuario; no indica corrección de la respuesta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-clear-field [PLAY-CAJA-02] es-AR: «Vaciar campo» | en: «Clear field» | contexto: Campo es el hueco del informe, distinto de marca de evidencia. Marcar no infiere ni completa respuesta. Vaciar/sustituir/deshacer sólo cambia el informe del usuario; no indica corrección de la respuesta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-undo-change [PLAY-CAJA-02] es-AR: «Deshacer cambio» | en: «Undo change» | contexto: Campo es el hueco del informe, distinto de marca de evidencia. Marcar no infiere ni completa respuesta. Vaciar/sustituir/deshacer sólo cambia el informe del usuario; no indica corrección de la respuesta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-attempt-errors [PLAY-CAJA-03] es-AR: «Intento {n} · {errores} datos no coinciden» | en: «Attempt {n} · {errores} details do not match» | contexto: Historial conserva snapshot de cada hipótesis verificada, tiempo y TOTAL de errores. Se pueden mostrar cambios entre hipótesis del jugador, nunca marcar cuáles campos ocultos eran correctos/incorrectos ni introducir pistas. Rama errores0/1/plural según resultado agregado real. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'errores', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-caja-attempt-one-error [PLAY-CAJA-03] es-AR: «Intento {n} · 1 dato no coincide» | en: «Attempt {n} · 1 detail does not match» | contexto: Historial conserva snapshot de cada hipótesis verificada, tiempo y TOTAL de errores. Se pueden mostrar cambios entre hipótesis del jugador, nunca marcar cuáles campos ocultos eran correctos/incorrectos ni introducir pistas. Rama errores0/1/plural según resultado agregado real. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-caja-attempt-no-errors [PLAY-CAJA-03] es-AR: «Intento {n} · todos los datos coinciden» | en: «Attempt {n} · all details match» | contexto: Historial conserva snapshot de cada hipótesis verificada, tiempo y TOTAL de errores. Se pueden mostrar cambios entre hipótesis del jugador, nunca marcar cuáles campos ocultos eran correctos/incorrectos ni introducir pistas. Rama errores0/1/plural según resultado agregado real. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-caja-view-attempt [PLAY-CAJA-03] es-AR: «Ver informe de este intento» | en: «View this attempt’s report» | contexto: Historial conserva snapshot de cada hipótesis verificada, tiempo y TOTAL de errores. Se pueden mostrar cambios entre hipótesis del jugador, nunca marcar cuáles campos ocultos eran correctos/incorrectos ni introducir pistas. Rama errores0/1/plural según resultado agregado real. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-compare-current [PLAY-CAJA-03] es-AR: «Comparar con el informe actual» | en: «Compare with the current report» | contexto: Historial conserva snapshot de cada hipótesis verificada, tiempo y TOTAL de errores. Se pueden mostrar cambios entre hipótesis del jugador, nunca marcar cuáles campos ocultos eran correctos/incorrectos ni introducir pistas. Rama errores0/1/plural según resultado agregado real. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-one-patch [PLAY-CAJA-04] es-AR: «1 parche» | en: «1 patch» | contexto: Plural por cantidad real. Verificar informe es comprobación LOCAL; historial Intentos anteriores no sugiere transmisión a un servidor. Lenguaje ficcional de firmar no convierte evaluación en envío externo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-many-patches [PLAY-CAJA-04] es-AR: «{cantidad} parches» | en: «{cantidad} patches» | contexto: Plural por cantidad real. Verificar informe es comprobación LOCAL; historial Intentos anteriores no sugiere transmisión a un servidor. Lenguaje ficcional de firmar no convierte evaluación en envío externo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'cantidad', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-caja-verification-attempts [PLAY-CAJA-04] es-AR: «Intentos de verificación» | en: «Verification attempts» | contexto: Plural por cantidad real. Verificar informe es comprobación LOCAL; historial Intentos anteriores no sugiere transmisión a un servidor. Lenguaje ficcional de firmar no convierte evaluación en envío externo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-open-file [PLAY-CAJA-05, PLAY-CAJA-06] es-AR: «Abrir expediente» | en: «Open case file» | contexto: Abrir expediente sólo si se conserva el paso de entrada; si se elimina el clic redundante, no crear otro. Omitir requiere handler real y movimiento reducido. Cronómetro empieza con materiales visibles/usables, no durante transición. Transcripción accesible sin depender de sonido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-skip-animation [PLAY-CAJA-05, PLAY-CAJA-06] es-AR: «Omitir animación» | en: «Skip animation» | contexto: Abrir expediente sólo si se conserva el paso de entrada; si se elimina el clic redundante, no crear otro. Omitir requiere handler real y movimiento reducido. Cronómetro empieza con materiales visibles/usables, no durante transición. Transcripción accesible sin depender de sonido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-investigation-time [PLAY-CAJA-05, PLAY-CAJA-06] es-AR: «Tiempo de investigación» | en: «Investigation time» | contexto: Abrir expediente sólo si se conserva el paso de entrada; si se elimina el clic redundante, no crear otro. Omitir requiere handler real y movimiento reducido. Cronómetro empieza con materiales visibles/usables, no durante transición. Transcripción accesible sin depender de sonido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-view-named-record [PLAY-CAJA-05, PLAY-CAJA-06] es-AR: «Ver registro: {nombre}, {hora}» | en: «View record: {nombre}, {hora}» | contexto: Abrir expediente sólo si se conserva el paso de entrada; si se elimina el clic redundante, no crear otro. Omitir requiere handler real y movimiento reducido. Cronómetro empieza con materiales visibles/usables, no durante transición. Transcripción accesible sin depender de sonido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'nombre', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'hora', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-caja-close-explanation [PLAY-CAJA-05, PLAY-CAJA-06] es-AR: «Cerrar explicación» | en: «Close explanation» | contexto: Abrir expediente sólo si se conserva el paso de entrada; si se elimina el clic redundante, no crear otro. Omitir requiere handler real y movimiento reducido. Cronómetro empieza con materiales visibles/usables, no durante transición. Transcripción accesible sin depender de sonido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-show-advice-again [PLAY-CAJA-05, PLAY-CAJA-06] es-AR: «Volver a mostrar consejo» | en: «Show advice again» | contexto: Abrir expediente sólo si se conserva el paso de entrada; si se elimina el clic redundante, no crear otro. Omitir requiere handler real y movimiento reducido. Cronómetro empieza con materiales visibles/usables, no durante transición. Transcripción accesible sin depender de sonido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-caja-radio-transcript [PLAY-CAJA-05, PLAY-CAJA-06] es-AR: «Radio · transcripción disponible» | en: «Radio · transcript available» | contexto: Abrir expediente sólo si se conserva el paso de entrada; si se elimina el clic redundante, no crear otro. Omitir requiere handler real y movimiento reducido. Cronómetro empieza con materiales visibles/usables, no durante transición. Transcripción accesible sin depender de sonido. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
