# estacion: 19 registros del catálogo, 62 copys

## [RSP-ESTACION-01] P1 · active · Responsive y controles
**Cuaderno: capturas no operables con teclado y visor sin cierre explícito**
- Actual: `current_1410/estacion__estacion__src__ui.js:502–504` construye `.clip` como DIV con `onclick`, sin tabindex/rol/keydown; imagen `alt=""`. Botón de eliminar tiene sólo `aria-label="×"`. El visor es una pantalla con imagen y `v.onclick=closeScreen`, sin botón de cerrar. `style.css:234–236` fija eliminar 32×32.
- Instrucción: Tarjeta como contenedor no interactivo con **dos botones hermanos**, no anidar botones: `button.clip-open` con imagen y nombre «Abrir captura de [sala/enigma]», y `button.clip-delete` con nombre «Eliminar captura de [sala/enigma]». Abrir con click nativo (Enter/Espacio incluidos); reemplazar el selector genérico `.clip button` por `.clip-delete{position:absolute;top:4px;right:4px;width:44px;height:44px}` y `.clip-open{display:block;width:100%;min-height:44px;padding:0;border:0;background:none;color:inherit}`; reservar la esquina del borrado en la composición para no tapar el contenido importante. Visor con `role=dialog aria-modal=true aria-labelledby`, título visible, botón cerrar de 44×44 px arriba a la derecha y protocolo RSP-MODALS-01. No usar toda la imagen como única salida. Mantener click en backdrop como salida opcional.
- Copy: 
- Aceptación: Abrir Cuaderno→Capturas, seleccionar/abrir/cerrar/eliminar usando sólo Tab/Enter/Espacio/Escape. Cierre retorna a captura de origen, eliminación retorna a la siguiente o encabezado si era la última. A 320, las dos acciones no se superponen y el visor cabe/permite scroll.
- Referencias: Archivo: current_1410/estacion__estacion__src__ui.js
Líneas: 502–504
Archivo: current_1410/estacion__estacion__src__style.css
Líneas: 234–236
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

## [VIS-ESTACION-03] P1 · active_proposal · Dirección visual interna
**Marco del inspector y aparatos: tipografía y grosores consistentes sin borrar pistas**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/estacion__estacion__src__draw.js :: bg, grid, plate, text, fit, seg9, font5, picto, fuseShape
ui_audit/source_review/current_1410/estacion__estacion__src__style.css :: #insp, .i-stage, .i-head, .iq, .tool, .hint, .stamp
Estado identificado en la revisión: DR.grid step 28 alpha .045; DR.bg #07030f con radial; DR.plate predetermina #1b1330→#0f0a1e, radio 10, borde blanco .09, remaches; glow 18. Inspector stage radio 16/borde .12, pregunta de 13 px, en monoespaciada, herramientas 13 px Poppins 44 px.
- Instrucción: No cambiar globalmente DR.RAINBOW/FRAG_COL/FONT5 ni COL de señales. Introducir DR.ART por función con opt-in decorativo: bg general #090F18, tinta #EDF4F8, dim #B3C1CF; mantener tint por familia. grid decorativa alpha .025 y 1 CSS px, nunca una grid que codifica celdas. plate exterior degradado #253240→#15202C, borde #52677A de 1 px, reflejo superior .10, radio 8–10 px; remaches solo en carcasa, no en cada tarjeta interior. Trazos decorativos 1 px, controles 1.5 px, selección 2 px; señales codificadas conservan dimensiones actuales. Inspector: header de 18 px y peso 600, pregunta 15 px/1.5 sans, etiquetas técnicas de 12 px, en monoespaciada, gap 8–12 px; botones 44 px radio 8 y estado activo borde 2 px. Pistas sobre fondo ámbar .08, texto 14 px, no encuadrar como error. Sello resuelto conserva texto pero sin stamp-scale 1.8: opacity + scale 1.04 en 160 ms, sin animación bajo reduce.
- Copy: 
- Aceptación: Crear storyshots para cada PZ antes de aplicar token; aprobar solo fondos/marcos con máscara que excluya contenido de pista.
Contraste de consigna/herramienta 4.5:1; controles 3:1 y foco visible.
DPR 1/2: trazos nítidos sin escalar hit areas; ningún clip nuevo.
- Referencias: ui_audit/source_review/current_1410/estacion__estacion__src__draw.js :: bg, grid, plate, text, fit, seg9, font5, picto, fuseShape
ui_audit/source_review/current_1410/estacion__estacion__src__style.css :: #insp, .i-stage, .i-head, .iq, .tool, .hint, .stamp
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No imponer text minimum global al bitmap font5/segmentos/Braille/Morse: la geometría es código. No reflujo automático en letras o coordenadas del rompecabezas. Las cantidades/colores/orientaciones reveladas deben ser idénticas.

## [VIS-ESTACION-04] P1 · active_proposal · Dirección visual interna
**Puzles físicos: conservar la codificación y mejorar únicamente el soporte**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/estacion__estacion__src__puzzles-a.js :: PZ.fog/switch/parts/canisters/grille/pots/bubbles/pipes/wheel/boards/braille/morse/segments
Estado identificado en la revisión: 13 tipos en puzzles-a. fog usa palabra espejada y vaho regenerado 6s; pipes5×5 con letras,4 flores/FRAG_COL, rutas/ABC D; seg9 y braille/morse codifican contenido.
- Instrucción: No hacer un reskin indiscriminado. Para fog: mantener espejo/vaho/cobertura/timing 6s, pulir solo borde de cápsula con degradado acero #B8C8D5→#708698 y sombra 8 px. Para switch/parts/canisters: carcasa carbón #18232E, borde 1.5 px #6D8194 y sombra interna 2 px; marcas/volúmenes/posiciones originales. grille/pots/bubbles/pipes: soporte verde oscuro #12372E→#0A241F, contorno #507D6C de 1 px; materiales tierra de macetas conservados, no agregar hojas/flores contables. pipes conserva 5×5, letras, conectores ABCD, rutas y orden de floración; rebajar highlight blanco de ruta de .7 a .45 sin alterar velocidad/orden; bajo reduce detener solamente dash decorativo, nunca floración de pista. wheel/boards: carcasa cálida #2E2B25 y detalle #A6997D para diferenciar mecánica, pero ruedas/letras/rotaciones intactas. braille/morse/segments: marco oscuro mate, sin glow alrededor de puntos apagados; puntos/segmentos activos originales, sin nuevos remaches junto al código. Bordes decorativos no pueden parecer puntos Braille o segmentos extra.
- Copy: 
- Aceptación: Fixture para cada uno de 13 tipos: solución/verificador y serialización estado iguales.
Mask diff de regiones de pista debe ser cero salvo cambio de soporte aprobado; contar letras/puntos/segmentos/objetos manualmente.
Detener animación decorativa no revela antes ni después la secuencia.
- Referencias: ui_audit/source_review/current_1410/estacion__estacion__src__puzzles-a.js :: PZ.fog/switch/parts/canisters/grille/pots/bubbles/pipes/wheel/boards/braille/morse/segments
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Inventario protegido: palabra/mirrored transform, orden/multiplicidad de switches y piezas, capacidad/altura de recipientes, barrotes, posición/tamaño/color de macetas/burbujas, rejilla y todas las letras, conexiones/orden temporal, rueda y ángulos, tableros, puntos Braille, duraciones Morse, segmentos encendidos/apagados.

## [VIS-ESTACION-05] P1 · active_proposal · Dirección visual interna
**Comunicaciones y navegación: aparatos especializados, no un único panel neón**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/estacion__estacion__src__puzzles-b.js :: PZ.spectro/keypad/dial/echoes/lyre/stars/catalog/chart/parallax/atlas
Estado identificado en la revisión: spectro construye palabraFONT5 dentro de ruido/banda; keypad3×4 relaciona alturas de tonos; dial analógico88–108 con fondo #d9cfae→#c2b58c y aguja #d81b4a; otras vistas codifican sonidos/estrellas/mapas.
- Instrucción: spectro: conservar matriz sig/noise, bandas y contraste interno exactos; cambiar SOLO bezel a #172B2B con borde 1 px #608B86 y labels de 12, en monoespaciada. No denoise ni sharpen la pista. keypad: mismo 3×4 y alturas U, marcos verde grafito #122B29, borde 1 px #527B73, estado pulsado relleno #16473E, halo≤6 px; no redibujar barras con escala distinta. dial: conservar identidad analógica marfil y aguja roja; pulir escala con borde 1 px #8E7F5C, radio 6 y sombra interior 2 px, mismos ticks 0.5/2/4MHz y lectura. echoes/lyre: instrumentos carbón sobre #0D2523, sombras discretas; no añadir ondas o cuerdas decorativas que confundan repetición/orden. stars/catalog/chart/parallax/atlas: mapas azul negro #0B172B, marco #3F5879, labels #D7E3F4; conservar coordenadas, tamaños relativos, orientación, conexiones y capas. No añadir estrellas de ambiente dentro del área de dato; ambiente se limita al margen fuera del chart. No sustituir texto codificado con iconos.
- Copy: 
- Aceptación: Los 10 tipos tienen fixture inicial/intermedio/resuelto en ES/EN; outputs de solución iguales.
Mover dial al mismo punto produce misma frecuencia y estación; keypad produce mismo tono.
Comparar matriz de espectro bit-a-bit y estrellas/rasgos de mapas objeto-a-objeto.
- Referencias: ui_audit/source_review/current_1410/estacion__estacion__src__puzzles-b.js :: PZ.spectro/keypad/dial/echoes/lyre/stars/catalog/chart/parallax/atlas
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Mantener noise funcional, d.band/d.w/pitch/seq, frecuencia+lock.12, tonos/alturas, tiempos de reproducción, constelaciones/posiciones/paralaje/catálogo/atlas. Los grosores del dibujo que representen magnitud no se cambian por token general.

## [VIS-ESTACION-06] P1 · active_proposal · Dirección visual interna
**Archivo, tripulación y final: lectura documental y estados completos**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/estacion__estacion__src__puzzles-c.js :: PZ.archive/shelves/scene/manifest/starchart
ui_audit/source_review/current_1410/estacion__estacion__src__style.css :: #iDom, .pc, .pc .led, .pc .tx, .pc .frs
ui_audit/source_review/current_1410/estacion__estacion__src__scenes.js :: plateGlyph
Estado identificado en la revisión: Cinco PZ en puzzles-c; listas de sala .pc con LEDrojo pulsante, .pc.ok usa --mod y .pc.lock opacity.45; textos truncados; plateGlyph conecta glifos de estrellas con letras.
- Instrucción: Archivo y manifiesto: conservar contenido exacto, usar superficie #171D29, texto 15 px/1.6, encabezados de 12, en monoespaciada, separadores #3C485C de 1 px y espaciado 12–16 px; anotaciones de pista no reciben resaltado nuevo. Estantería/escena: mejorar solo sombra de soporte y contraste de etiquetas, no ordenar por nombre ni separar objetos que deban solaparse. Starchart: mantener posiciones/orientaciones/conexiones/glifos y fondo sin estrellas extra, halo de puntos activos≤4 px cuando no cambie tamaño aparente; no hacer reconocible una letra antes de reveal. Lista .pc: fondo #172332, radio 10, borde #394B5E; .lock no opacity global .45 sobre el texto, usar fondo #121922 y texto #9EACBA con icono de bloqueo ya existente. Disponible/pendiente usa punto rojo fijo más texto de estado existente; ok check y color de módulo, no pulso. Mostrar nombre completo en lista mediante 2 líneas si necesario, metadatos de 12, en monoespaciada y cuerpo 14–15 px; no encoger todo a 9 px.
- Copy: 
- Aceptación: Cinco PZ y placa final: mismas respuestas, mismas regiones de reveal y misma disponibilidad.
Nombres completos en lista ES/EN sin colisión con 4 fragmentos; inspección de canvas puede seguir abreviada solo si existe texto completo equivalente.
Reducción de movimiento desactiva LED/polvo/halo pero no elimina datos temporales que sean pista.
- Referencias: ui_audit/source_review/current_1410/estacion__estacion__src__puzzles-c.js :: PZ.archive/shelves/scene/manifest/starchart
ui_audit/source_review/current_1410/estacion__estacion__src__style.css :: #iDom, .pc, .pc .led, .pc .tx, .pc .frs
ui_audit/source_review/current_1410/estacion__estacion__src__scenes.js :: plateGlyph
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Sin reordenar libros/personas/manifiesto, ni revelar nombres, glifos o finales bloqueados. Mantener fragmentos FRAG_COL y cuatro indicadores por meta. No borrar el rojo si representa fallo real.

## [PLAY-ESTACION-01] P2 · active · Prueba interactiva y propuestas
**Recomponer el inspector sin separar pregunta y respuesta**
- Actual: A 1180×757, el lienzo ocupa cerca del 60 % del ancho. El enunciado está arriba a la derecha y el campo de respuesta queda junto al pie, con un gran espacio vacío entre ambos. Palabra clave sólo aparece como texto de ejemplo dentro del campo; su nombre en el árbol de accesibilidad es ans.
- Instrucción: Organizar la columna de lectura para que enunciado, pistas utilizadas y respuesta formen una secuencia visual continua. Mantener la respuesta en una zona fija sólo cuando el contenido exceda la altura disponible, sin cubrir el tablero. Asociar el campo a una etiqueta visible y a un nombre accesible; vincular también la indicación de longitud y el estado de comprobación. Obtener la cantidad de letras de los datos del enigma vigente. Esa indicación es orientativa: no convertirla en una validación bloqueante nueva ni sustituir la normalización y los veredictos existentes.
- Copy: Tu respuesta
{cantidad} letras
Comprobar respuesta
- Aceptación: Con zoom del 200 % y teclado, se recorren pregunta, pistas y respuesta en ese orden. La etiqueta no desaparece al escribir y el campo no tapa el tablero. La indicación de letras coincide con el enigma y no rechaza por sí sola una entrada que la lógica vigente permitiría comprobar.
- Referencias: evidence/estacion-pass1-gameplay.jpg
evidence/estacion-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T16:06:00Z/2026-10-22T16:14:00Z
Cobertura: Dos enigmas del prólogo; no dos partidas completas de toda la estación.

## [PLAY-ESTACION-02] P2 · active · Prueba interactiva y propuestas
**Comunicar de forma explícita el resultado de comprobar una respuesta**
- Actual: ABIRRA fue rechazada, pero la indicación persistente visible es una ficha pequeña con la palabra tachada; el árbol de accesibilidad no anuncia Respuesta incorrecta. Después de la animación, la causa de que el juego no avance no queda explícita.
- Instrucción: Añadir junto al campo un mensaje breve, anunciado una sola vez mediante aria-live. Devolver el foco al campo sin borrar la respuesta antes de que pueda corregirse. Distinguir la orientación sobre longitud de los veredictos reales y de la resolución correcta; conservar el historial sin depender sólo del tachado. Mantener las ramas existentes de comprobación —ok, mid, trap, near, enie, other y repeat— y sus mensajes específicos; una etiqueta genérica de error no debe reemplazar pistas o matices ya permitidos por el juego. La longitud sugerida no bloquea el envío ni altera el algoritmo de verificación.
- Copy: Esa respuesta no es correcta. Probá otra.
Escribí una respuesta de {cantidad} letras.
Respuesta correcta. Sistema reparado.
- Aceptación: Comprobar una respuesta equivocada produce un mensaje legible y anunciado, y permite corregir sin cerrar el inspector ni perder pistas. Los veredictos específicos conservan su significado. No se cambia la puntuación, la normalización ni las reglas existentes de espera o control de intentos.
- Referencias: evidence/estacion-pass1-error.jpg
- Notas: Ventana de observación: 2026-10-22T16:06:00Z/2026-10-22T16:14:00Z
Cobertura: Dos enigmas del prólogo; no dos partidas completas de toda la estación.
La fuente guardada estacion/src/core.js, verify, conserva veredictos distintos y no rechaza por longitud antes de comprobar la respuesta. El texto de longitud se obtiene de cx.V.len como orientación, no como una regla nueva de validación.

## [PLAY-ESTACION-03] P2 · active · Prueba interactiva y propuestas
**Controles del lienzo accesibles sin revelar la solución**
- Actual: Los tres interruptores de Luces y la instrucción Orden de encendido son gráficos, no controles con nombre y estado en el árbol de accesibilidad. El cristal de Cápsula usa Arrastra el dedo por el cristal para limpiarlo incluso con ratón.
- Instrucción: Añadir controles DOM sincronizados para los interruptores de círculo, triángulo y cuadrado, con estado pulsado y foco visible. Exponer únicamente la letra que revele el estado actual del circuito, no las de combinaciones todavía ocultas. En el cristal, ofrecer una operación equivalente con teclado para quitar el vaho, sin invertir automáticamente la inscripción ni resolverla. Adaptar la guía a ratón y pantalla táctil. La alternativa accesible debe permitir manipular el mismo enigma, no entregar directamente su solución.
- Copy: Arrastrá para limpiar el cristal.
Limpiar cristal con teclado
Interruptor círculo
Interruptor triángulo
Interruptor cuadrado
Encendido
Apagado
- Aceptación: Ratón, pantalla táctil y teclado recorren los mismos estados. Se conservan los siete tubos, las combinaciones y las letras. La alternativa accesible no entrega letras ocultas ni corrige automáticamente la inversión de la inscripción.
- Referencias: evidence/estacion-pass1-gameplay.jpg
evidence/estacion-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T16:06:00Z/2026-10-22T16:14:00Z
Cobertura: Dos enigmas del prólogo; no dos partidas completas de toda la estación.

## [PLAY-ESTACION-04] P2 · active · Prueba interactiva y propuestas
**Dar una alternativa textual inmediata a la grabación**
- Actual: Después de ambos éxitos, se ofrecen Escuchar grabación y Volver a la sala, aunque se activaron las alternativas visuales de audio. La Bitácora tiene entradas de Cápsula/Luces, pero no se abrió su contenido para evitar reproducir audio; no se afirma que falte toda transcripción.
- Instrucción: Ofrecer «Leer transcripción» en el resultado como acción explícita, separada de reproducir. Debe abrir el texto completo sin iniciar audio ni exigir que avance la animación de reproducción; conservar la reproducción voluntaria y el acceso posterior desde la Bitácora. Reutilizar la información narrativa existente en lugar de inventar otra transcripción. Usar un icono propio, coherente con el sistema visual, en lugar del emoji naranja de reproducción. Con el comportamiento actual, rotular «Detener grabación»: detener y volver a reproducir reinicia desde el principio. «Pausar grabación» sólo sería correcto si se implementa y verifica una pausa que conserve la posición y permita continuar desde ella; no basta con cambiar el nombre del botón.
- Copy: Leer transcripción
Reproducir grabación
Detener grabación
Volver a la sala
- Aceptación: Con los audios desactivados, la misma información narrativa se puede leer desde el resultado y desde la Bitácora. Abrir el texto no reproduce audio ni obliga a esperar su avance. El nombre del control coincide con detener y reiniciar, o con pausar y reanudar sólo si esa función adicional se implementó y verificó.
- Referencias: evidence/estacion-pass1-result.jpg
evidence/estacion-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T16:06:00Z/2026-10-22T16:14:00Z
Cobertura: Dos enigmas del prólogo; no dos partidas completas de toda la estación.
La fuente guardada estacion/src/ui.js, player, ya construye la transcripción. start reinicia idx=0 y stop detiene el temporizador y el audio; no conserva una función de reanudación desde la posición detenida. Esto respalda un acceso textual explícito y la etiqueta Detener, no una afirmación de ausencia total de transcripción.

## [PLAY-ESTACION-05] P2 · active · Prueba interactiva y propuestas
**Explicar la reducción de estrellas por pistas**
- Actual: Ayudas muestra Cuesta 1 estrella para cada paso; Ver revela Empujón y cierra el modal. P1 obtuvo 3 estrellas pese a un error; P2 obtuvo 2 después de una ayuda. El resultado sólo muestra estrellas, sin explicar el cálculo ni el alcance del coste.
- Instrucción: Preservar el aviso de coste y la gratuidad condicionada que ya existen; mejorar su claridad y su relación con la acción, sin crear de cero esas funciones. Explicar antes de revelar una ayuda su efecto real sobre las estrellas de ese enigma, no sobre un saldo global. Conservar la fórmula de la rama ordinaria: paid = Math.max(0, st.hints - (st.freeHint ? 1 : 0)); st.stars = Math.max(0, 3 - paid). La primera pista gratuita sólo corresponde al enigma p3 cuando se cumple la condición existente de gratuidad no utilizada; no generalizarla a todos los enigmas. El diario tiene su propio registro de ayudas y resultado, no esta fórmula de estrellas: no mostrar allí un coste ficticio. Usar «Revelar pista · −1 estrella en este enigma» sólo cuando esa nueva ayuda reduzca realmente el máximo; en la rama gratuita, usar «Revelar pista gratis». Distinguir pista, método y solución, conservando la secuencia y la espera actuales. Después, mostrar las ayudas utilizadas y las estrellas obtenidas con valores accesibles. No deducir de los dos enigmas observados una penalización nueva por error o tiempo.
- Copy: Revelar pista · −1 estrella en este enigma
Revelar pista gratis
Pistas usadas: {cantidad}
Estrellas obtenidas: {obtenidas} de {máximo}
Esta ayuda reduce la puntuación máxima de este enigma.
- Aceptación: La ayuda altera sólo el resultado previsto por la fórmula y por el modo reales. Probar ayudas pagadas, la gratuidad condicionada de p3 y el diario sin introducir estrellas donde no existen. El lector distingue estrellas obtenidas y vacías. Volver a abrir una ayuda ya revelada no la cobra ni la contabiliza de nuevo. La etiqueta de reducción no aparece en una rama sin decremento.
- Referencias: evidence/estacion-pass2-hint.jpg
evidence/estacion-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T16:06:00Z/2026-10-22T16:14:00Z
Cobertura: Dos enigmas del prólogo; no dos partidas completas de toda la estación.
Verificación de fuentes guardadas: estacion/src/ui.js, onSolved y openHints, conserva la fórmula de estrellas, la condición !daily && cx.id === 'p3' && !CO.G.freeHintUsed y la rama diaria separada. Estas excepciones proceden de la fuente, no de partidas observadas en esos modos. {máximo} en el resumen de estrellas es el máximo base de la escala, no el saldo reducido tras ayudas; {obtenidas} es el resultado real.

## [PLAY-ESTACION-06] P2 · active · Prueba interactiva y propuestas
**Modales y ajustes con nombres y foco correctos**
- Actual: En Ajustes, los interruptores se anunciaron como 1/0 sin nombre. Al abrir Ayudas, el foco permaneció en el botón Ayudas del fondo y el árbol de accesibilidad conservó los controles del inspector. La Bitácora también dejó el foco en el campo del fondo. La pausa sí enfocó Continuar.
- Instrucción: Aplicar a Ajustes, Ayudas y Bitácora el patrón de diálogo modal: título asociado, foco inicial dentro del diálogo, fondo inert, recorrido de Tab contenido y retorno al control que lo abrió. Asociar cada interruptor a su etiqueta visible y cada volumen a su canal. No tratar los controles de una animación de cierre transitoria como acciones disponibles. Conservar el foco inicial correcto de la pausa y usar allí la etiqueta canónica «Reanudar partida».
- Copy: Música
Efectos
Ambiente
Volumen de voces
Alternativas visuales de audio
Cerrar ayudas
Cerrar bitácora
- Aceptación: En cada modal, el foco no alcanza respuestas ni botones del fondo. Cada interruptor anuncia su nombre y su estado; cerrar el diálogo restaura el foco al control de origen.
- Referencias: evidence/estacion-pass2-hint.jpg
evidence/estacion-pause.jpg
- Notas: Ventana de observación: 2026-10-22T16:06:00Z/2026-10-22T16:14:00Z
Cobertura: Dos enigmas del prólogo; no dos partidas completas de toda la estación.

## [PLAY-ESTACION-07] P2 · active · Prueba interactiva y propuestas
**Sala y paneles con jerarquía sin alterar pistas**
- Actual: La sala usa paneles rectangulares similares, rótulos pequeños P1/P2/P3 y tarjetas inferiores; algunos paneles quedan fuera de pantalla y requieren desplazar la vista. En Luces, la cuadrícula decorativa y siete cajas tenues compiten con las lámparas y la letra activa.
- Instrucción: Diferenciar los estados activo, resuelto y disponible mediante icono y etiqueta, además del color; obtenerlos del estado real y no asumir que rojo significa bloqueado. Indicar claramente que la vista de la sala se puede desplazar y mantener accesibles sus tarjetas. Atenuar la cuadrícula decorativa y reforzar el foco y el contorno de los interruptores. Conservar las siete posiciones de los tubos, el cartel de orden, las combinaciones binarias y las luces que revele el estado actual.
- Copy: Resuelto · {estrellas} estrellas
Disponible
Mover vista de la sala
Enigma {número}: {nombre}
- Aceptación: Todos los paneles son alcanzables mediante teclado y tarjetas. Sus estados no dependen únicamente del violeta o del rojo. El rediseño no cambia letras, posiciones, secuencia ni combinaciones necesarias para resolver.
- Referencias: evidence/estacion-room.jpg
evidence/estacion-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T16:06:00Z/2026-10-22T16:14:00Z
Cobertura: Dos enigmas del prólogo; no dos partidas completas de toda la estación.

## [RSP-ESTACION-02] P2 · active · Responsive y controles
**Nombre estable de respuesta y contexto del enigma**
- Actual: `current_1410/estacion.html:41–54`: inspector `role=dialog aria-modal=true` sin `aria-labelledby`; input `#ans` no tiene `<label>` ni `aria-label`, sólo placeholder asignado en `ui.js:27`. `aria-describedby="enum"` apunta a una fila visual `aria-hidden=true` de casillas, no a la pregunta. El placeholder desaparece al escribir.
- Instrucción: `#insp aria-labelledby="iTitle"`; etiqueta visible o `.sr` `<label for="ans">Respuesta</label>` traducida. `#ans aria-describedby="iQ answerFormat"`; crear `#answerFormat.sr` con instrucción textual de longitud/patrón, sincronizada por `renderEnum`, en lugar de depender de casillas decorativas. Conservar `#enum aria-hidden=true` para evitar leer cada símbolo visual. Error/respuesta válida en status no invasivo; no anunciar cada keypress de decoraciones.
- Copy: 
- Aceptación: Lector anuncia «Respuesta» + pregunta/formato antes y después de escribir; abrir enigma anuncia su título. Teclado móvil abierto a 320/360/390 mantiene input, Pistas y Enviar visibles (ya existe `--kb`; no duplicar compensación). Al cerrar se restaura botón del enigma.
- Referencias: Archivo: current_1410/estacion.html
Líneas: 41–54
Archivo: current_1410/estacion__estacion__src__ui.js
Líneas: 27,36–47
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

## [SRC-ES01] P2 · active_source_finding · Texto, estados y flujo
**Ayudas y responder**
- Actual: Empujón; Método; Solución; Ver; Gratis; Enviar; Anillo
- Instrucción: Preservar el coste de ayuda que ya se muestra antes de usarla y la primera pista gratuita cuando se cumple su condición actual. Mejorar su presentación y usar «Comprobar respuesta» para enviar la respuesta local, sin sugerir una transmisión externa. Usar «Revelar pista» para la pista y distinguir la explicación del método de la revelación de la solución; conservar la secuencia y la espera actuales. La variante «Revelar pista · −1 estrella en este enigma» sólo corresponde a una ayuda que produzca ese decremento real. «Revelar pista gratis» corresponde a la primera pista de p3 cuando se cumple la condición existente; no generalizar la gratuidad ni cambiar la economía. El diario no usa las estrellas de la rama ordinaria: no prometer allí un coste o una recompensa inexistentes. Explicar el anillo central como destino durante las primeras visitas.
- Copy: Pista leve
Cómo resolverlo
Ver solución
Revelar pista
Revelar pista · −1 estrella en este enigma
Revelar pista gratis
Comprobar respuesta
Volver al anillo central
- Aceptación: Cada ayuda muestra el efecto que realmente tiene en ese modo y en ese enigma. Una nueva activación no se contabiliza dos veces ni reduce más estrellas de las previstas por la lógica vigente; volver a abrir contenido ya revelado no cobra otra vez. Probar la primera pista gratuita de p3 sólo cuando corresponda, sin trasladarla a otros enigmas ni inventar estrellas en el diario. Cancelar no revela ni cobra. «Comprobar respuesta» no se describe como transmisión externa si la verificación es local.
- Referencias: https://jetgames.fun/estacion/ — final_revalidation/estacion__estacion__src__ui.js:337–349; i18n.js (ayudas)
- Notas: Recomendación de texto. Revalidación final HTTP de sólo lectura 2026-10-22 16:14–16:20 UTC. Precisión de alcance: funciones existentes que deben preservarse, no ausencia de implementación. Este revisor no jugó. La fuente ya muestra el coste antes de revelar una ayuda y la primera pista gratuita bajo su condición vigente. La mejora se refiere a claridad, etiquetas y alcance del coste, no a crear una función ausente.

## [SRC-ES02] P2 · active_source_finding · Texto, estados y flujo
**Códigos y partida nueva**
- Actual: Código de partida; Código de rescate; Partida nueva +; Cargar
- Instrucción: Distinguir semilla compartida de backup completo. Avisar antes de reemplazar progreso al restaurar o empezar. Explicar qué conserva y cambia Partida nueva + según la lógica real; no inventar una dificultad avanzada si no existe. Ofrecer copia de seguridad antes de borrar.
- Copy: Código de partida (semilla) / Copia de seguridad de la partida / Nueva partida + / Restaurar partida
- Aceptación: El código de semilla no se presenta como backup. Una copia de seguridad válida restaura progreso; una inválida no borra nada. Nueva partida + explica su efecto real.
- Referencias: https://jetgames.fun/estacion/src/i18n.js?v=5 — s.copyRescue/s.pasteRescue/cta.newplus/s.wipe
- Notas: Recomendación de texto y estado; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-ESTACION-01] P2 · active_proposal · Dirección visual interna
**Salas: materiales de estación, luz narrativa, paneles verdaderamente legibles**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/estacion__estacion__src__scenes.js :: room, props, camFor
ui_audit/source_review/current_1410/estacion__estacion__src__draw.js :: plate, glow, text
Estado identificado en la revisión: room compone paredes violetas #0c0720→#110a26 según progreso,6 luminarias, suelo #0a0616, paneles210*k×250*k, hover glow30, LED glow40/r9 y pulso; etiquetas fuerzan tamaño común mínimo 9 px y elipsis. Estado emergente deriva de energía.
- Instrucción: Mantener geometría de salas y props. Diferenciar material sin nuevos objetos: pared #101623→#151E2B, uniones #263343 alfa .45 y suelo #0B1019. Conservar luz propia CORE.MOD_COL y su relación con progreso/energía; reducir solamente cono ambiental máximo de .28 a .16 y dejar área activa iluminada, sin oscurecer textos. Carcasa de panel degradado #26313D→#141E29, borde 1 px #556879 y radio 12 unidades de sala; pantalla usa colores de estado existentes sobre negro #071016, no toda la tarjeta roja. Hover halo máximo 10 CSS px, no 30 unidades ambiguas: convertir por cam.s. LED conserva estado y punto, halo máximo 12 CSS px; pulso de error alpha .75–1, no.0–1; bajo reduced-motion estable. Usar la misma luz superior izquierda en todas las piezas y sombra suave debajo, sin relieves repetidos en cada borde.
- Copy: 
- Aceptación: Todas las salas en 0/50/100%: iluminación refleja mismo progreso.
Bounding boxes st.hot idénticas; canvas y lista DOM siguen abriendo mismo puzzle.
Panel activo se reconoce sin halo y no se confunde con resuelto.
- Referencias: ui_audit/source_review/current_1410/estacion__estacion__src__scenes.js :: room, props, camFor
ui_audit/source_review/current_1410/estacion__estacion__src__draw.js :: plate, glow, text
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: CORE.MOD_COL, progreso de luces, estados unlocked/solved/meta y posiciones PANELS/st.hot intactos. No añadir monitores, luces contables, números o props que parezcan pista. No rehacer astronauta oficial.

## [VIS-ESTACION-02] P2 · active_proposal · Dirección visual interna
**Hub anular: diagrama orbital claro, estados sin exceso de resplandor**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/estacion__estacion__src__scenes.js :: hub, hubHit, ICON
ui_audit/source_review/current_1410/estacion__estacion__src__style.css :: #hubBar, .rtitle, .stars-n
Estado identificado en la revisión: Hub seis sectores de radio .47–.97R, iconos propios, etiquetas mayúsculas,4 puntos+rombo de progreso; centro Observatorio.36R; sector disponible violeta pulsante y centro glow1.6cr. hubHit usa.36/.45/1.0R.
- Instrucción: Conservar anillo/sectores/íconos y todos los hit radii. Base del anillo #152333 con borde 1 px #52677E; sector bloqueado #101925 y trazo #344454, disponible #253249 y trazo #9DAFCA, completo conserva su CORE.MOD_COL a .20 de relleno y 1.5 px de borde. Hover solo sube alfa de relleno .06 y borde 2 px, sin pulso global. Centro conserva silueta y estrellas pero halo≤8 px y alpha .15, evitando tapar nombres. Iconos existentes 1.5–2 px con linecap/linejoin round. Etiquetas Poppins, peso 600, tamaño 12–14 px en caja reservada, mantener texto y posibilidad de dos líneas; códigos pueden seguir mono. Progreso 4 puntos+rombo exactos con borde 1 px y relleno según estado; no convertir a porcentaje con redondeo. Barra inferior material #121D2B y radio 10 px, espacio 8 px, cifra de estrellas de 16, en monoespaciada.
- Copy: 
- Aceptación: Mapa completo/sólo Oxígeno/energía activada: mismos módulos accesibles.
hubHit contra malla de puntos produce resultado idéntico antes/después.
ES/EN títulos sin colisión con icono/progreso; foco no depende del color.
- Referencias: ui_audit/source_review/current_1410/estacion__estacion__src__scenes.js :: hub, hubHit, ICON
ui_audit/source_review/current_1410/estacion__estacion__src__style.css :: #hubBar, .rtitle, .stars-n
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Conservar orden angular de módulos, nombres,6 sectores,4 puzzles+meta por sector y condiciones sealed.pressure/sealed.power. No permitir acceso a bloqueados ni cambiar labels por iconos ambiguos.

# Copys ES/EN aplicables
- COPY-common-resume [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-FRENTES-01, PLAY-BALIZAS-04, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Reanudar partida» | en: «Resume game» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Continuar', 'Seguir']
- COPY-common-cancel [SRC-G04, SRC-R02, SRC-AN01, SRC-E02, SRC-BE01, SRC-BE02, RSP-MODALS-01, RSP-BALIZAS-02, PLAY-BALIZAS-05] es-AR: «Cancelar» | en: «Cancel» | contexto: Cancelación real: no cobrar, borrar, publicar, fusionar ni sustituir estado. Foco inicial en confirmaciones destructivas. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-music [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Música» | en: «Music» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-effects [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Efectos» | en: «Sound effects» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-music-volume [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-ANTES-06, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Volumen de música» | en: «Music volume» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-effects-volume [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-ANTES-06, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Volumen de efectos» | en: «Sound effects volume» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-light-hint [SRC-ES01] es-AR: «Pista leve» | en: «Small hint» | contexto: Costo 1 estrella y primera pista gratis sólo cuando condiciones reales lo permitan. Pista = hint. No confundir método con palabra revelada ni comprobación local con envío externo. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-method [SRC-ES01] es-AR: «Cómo resolverlo» | en: «How to solve it» | contexto: Costo 1 estrella y primera pista gratis sólo cuando condiciones reales lo permitan. Pista = hint. No confundir método con palabra revelada ni comprobación local con envío externo. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-solution [SRC-ES01] es-AR: «Ver solución» | en: «View solution» | contexto: Costo 1 estrella y primera pista gratis sólo cuando condiciones reales lo permitan. Pista = hint. No confundir método con palabra revelada ni comprobación local con envío externo. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Título de ayuda de tercer nivel, o acción para ver una solución ya disponible. No rotular así una acción que sólo inicia la espera de60 segundos activos; no ofrecer tercer paso en diario. | params: [] | citas actuales: []
- COPY-estacion-paid-hint [SRC-ES01, PLAY-ESTACION-05] es-AR: «Revelar pista · −1 estrella en este enigma» | en: «Reveal hint · −1 star for this puzzle» | contexto: Costo 1 estrella y primera pista gratis sólo cuando condiciones reales lo permitan. Pista = hint. No confundir método con palabra revelada ni comprobación local con envío externo. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Sólo primera pista leve nueva de campaña cuyo efecto real es reducir en 1 el máximo del enigma; para el segundo paso usar Revelar método con coste asociado; nunca pista ya revelada, primera pista gratuita elegible ni diario. Para tercer paso que inicia espera, usar Preparar solución y explicar coste al revelarse, no prometer revelación inmediata. | params: [] | citas actuales: ['Cuesta 1 estrella', 'Ver']
- COPY-estacion-free-hint [SRC-ES01, PLAY-ESTACION-05] es-AR: «Revelar pista gratis» | en: «Reveal free hint» | contexto: Costo 1 estrella y primera pista gratis sólo cuando condiciones reales lo permitan. Pista = hint. No confundir método con palabra revelada ni comprobación local con envío externo. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Sólo !daily && cx.id===p3 && !G.freeHintUsed && st.hints===0. Al consumirla marcar freeHint sin restar estrella; no llamar gratis a cualquier primer paso. | params: [] | citas actuales: []
- COPY-estacion-check-word [SRC-ES01, PLAY-ESTACION-01, PLAY-ESTACION-02] es-AR: «Comprobar respuesta» | en: «Check answer» | contexto: Costo 1 estrella y primera pista gratis sólo cuando condiciones reales lo permitan. Pista = hint. No confundir método con palabra revelada ni comprobación local con envío externo. Revisión estática de red 15:31–15:35: esta evaluación es local; compartir es otra función. No implica ausencia total de GET/descargas/métricas. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-central-ring [SRC-ES01] es-AR: «Volver al anillo central» | en: «Back to the central ring» | contexto: Costo 1 estrella y primera pista gratis sólo cuando condiciones reales lo permitan. Pista = hint. No confundir método con palabra revelada ni comprobación local con envío externo. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-seed [SRC-ES02] es-AR: «Código de partida (semilla)» | en: «Game code (seed)» | contexto: Semilla ≠ backup. Efectos + desde lógica vigente; no inventar dificultad extra. Error de copia no debe borrar estado antes de validarla. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-backup [SRC-ES02] es-AR: «Copia de seguridad de la partida» | en: «Game backup» | contexto: Semilla ≠ backup. Efectos + desde lógica vigente; no inventar dificultad extra. Error de copia no debe borrar estado antes de validarla. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-new-plus [SRC-ES02] es-AR: «Nueva partida +» | en: «New game +» | contexto: Semilla ≠ backup. Efectos + desde lógica vigente; no inventar dificultad extra. Error de copia no debe borrar estado antes de validarla. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-restore [SRC-ES02] es-AR: «Restaurar partida» | en: «Restore game» | contexto: Semilla ≠ backup. Efectos + desde lógica vigente; no inventar dificultad extra. Error de copia no debe borrar estado antes de validarla. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-replace-title [SRC-ES02] es-AR: «¿Reemplazar el progreso actual?» | en: «Replace your current progress?» | contexto: Semilla ≠ backup. Efectos + desde lógica vigente; no inventar dificultad extra. Error de copia no debe borrar estado antes de validarla. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-backup-first [SRC-ES02] es-AR: «Antes de continuar, podés guardar una copia de seguridad de tu partida.» | en: «Before continuing, you can save a backup of your game.» | contexto: Semilla ≠ backup. Efectos + desde lógica vigente; no inventar dificultad extra. Error de copia no debe borrar estado antes de validarla. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-effect [SRC-ES02] es-AR: «Se conserva: {conservado}. Cambia: {cambiado}.» | en: «Kept: {conservado}. Changed: {cambiado}.» | contexto: Semilla ≠ backup. Efectos + desde lógica vigente; no inventar dificultad extra. Error de copia no debe borrar estado antes de validarla. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'conservado', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'cambiado', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-estacion-invalid-backup [SRC-ES02] es-AR: «No pudimos restaurar esta copia de seguridad. Tu partida actual no cambió.» | en: «We couldn’t restore this backup. Your current game has not changed.» | contexto: Semilla ≠ backup. Efectos + desde lógica vigente; no inventar dificultad extra. Error de copia no debe borrar estado antes de validarla. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-open-capture [RSP-ESTACION-01, RSP-ESTACION-02] es-AR: «Abrir captura de {contexto}» | en: «Open screenshot of {contexto}» | contexto: {contexto}: sala/enigma reales. Botones hermanos de abrir/borrar; visor dialog con título y common-close. {formato} textual desde renderEnum; no número/patrón inventados. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'contexto', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-estacion-delete-capture [RSP-ESTACION-01, RSP-ESTACION-02] es-AR: «Eliminar captura de {contexto}» | en: «Delete screenshot of {contexto}» | contexto: {contexto}: sala/enigma reales. Botones hermanos de abrir/borrar; visor dialog con título y common-close. {formato} textual desde renderEnum; no número/patrón inventados. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'contexto', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-estacion-capture-title [RSP-ESTACION-01, RSP-ESTACION-02] es-AR: «Captura de {contexto}» | en: «Screenshot of {contexto}» | contexto: {contexto}: sala/enigma reales. Botones hermanos de abrir/borrar; visor dialog con título y common-close. {formato} textual desde renderEnum; no número/patrón inventados. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'contexto', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-estacion-answer [RSP-ESTACION-01, RSP-ESTACION-02, PLAY-ESTACION-01] es-AR: «Tu respuesta» | en: «Your answer» | contexto: {contexto}: sala/enigma reales. Botones hermanos de abrir/borrar; visor dialog con título y common-close. {formato} textual desde renderEnum; no número/patrón inventados. Etiqueta visible permanente asociada al campo, no sólo placeholder. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Palabra clave', 'ans']
- COPY-estacion-answer-format [RSP-ESTACION-01, RSP-ESTACION-02] es-AR: «Formato de respuesta: {formato}» | en: «Answer format: {formato}» | contexto: {contexto}: sala/enigma reales. Botones hermanos de abrir/borrar; visor dialog con título y common-close. {formato} textual desde renderEnum; no número/patrón inventados. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'formato', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-estacion-answer-letters [PLAY-ESTACION-01, PLAY-ESTACION-02] es-AR: «{cantidad} letras» | en: «{cantidad} letters» | contexto: Respuesta e información de validación junto al campo, no sólo tachado. La longitud esperada deriva de cx.V.len por idioma; es orientación, no una nueva regla de rechazo. Conservar todos los veredictos de verify: ok/mid/trap/near/enie/other/repeat y sus pistas específicas. No sobrescribirlos con incorrecta genérica; no reemplazar una excepción técnica por una falsa certeza sobre la respuesta. | condición: Incorrecta sólo para veredicto real wrong; longitud no bloquea comprobar ni invalida respuestas que el motor acepta. Sistema reparado sólo tras solución y transición real del enigma de campaña; diario u otros contextos usan Respuesta correcta si no reparan un sistema. No borrar entrada/pistas al fallar. | params: [{'name': 'cantidad', 'binding': 'Longitud esperada cx.V.len[I18N.LANG] || cx.V.len.es del enigma vigente. Sin nueva validación dura: conservar verify y CO.norm. Rama singular cuando cantidad=1; no fijar longitud de las palabras de prueba.'}] | citas actuales: []
- COPY-estacion-answer-one-letter [PLAY-ESTACION-01, PLAY-ESTACION-02] es-AR: «1 letra» | en: «1 letter» | contexto: Respuesta e información de validación junto al campo, no sólo tachado. La longitud esperada deriva de cx.V.len por idioma; es orientación, no una nueva regla de rechazo. Conservar todos los veredictos de verify: ok/mid/trap/near/enie/other/repeat y sus pistas específicas. No sobrescribirlos con incorrecta genérica; no reemplazar una excepción técnica por una falsa certeza sobre la respuesta. | condición: Incorrecta sólo para veredicto real wrong; longitud no bloquea comprobar ni invalida respuestas que el motor acepta. Sistema reparado sólo tras solución y transición real del enigma de campaña; diario u otros contextos usan Respuesta correcta si no reparan un sistema. No borrar entrada/pistas al fallar. Sólo cuando la longitud esperada real es1; la orientación no bloquea verify. | params: [] | citas actuales: []
- COPY-estacion-wrong-answer [PLAY-ESTACION-01, PLAY-ESTACION-02] es-AR: «Esa respuesta no es correcta. Probá otra.» | en: «That answer is not correct. Try another.» | contexto: Respuesta e información de validación junto al campo, no sólo tachado. La longitud esperada deriva de cx.V.len por idioma; es orientación, no una nueva regla de rechazo. Conservar todos los veredictos de verify: ok/mid/trap/near/enie/other/repeat y sus pistas específicas. No sobrescribirlos con incorrecta genérica; no reemplazar una excepción técnica por una falsa certeza sobre la respuesta. | condición: Incorrecta sólo para veredicto real wrong; longitud no bloquea comprobar ni invalida respuestas que el motor acepta. Sistema reparado sólo tras solución y transición real del enigma de campaña; diario u otros contextos usan Respuesta correcta si no reparan un sistema. No borrar entrada/pistas al fallar. | params: [] | citas actuales: []
- COPY-estacion-answer-length-help [PLAY-ESTACION-01, PLAY-ESTACION-02] es-AR: «Escribí una respuesta de {cantidad} letras.» | en: «Enter a {cantidad}-letter answer.» | contexto: Respuesta e información de validación junto al campo, no sólo tachado. La longitud esperada deriva de cx.V.len por idioma; es orientación, no una nueva regla de rechazo. Conservar todos los veredictos de verify: ok/mid/trap/near/enie/other/repeat y sus pistas específicas. No sobrescribirlos con incorrecta genérica; no reemplazar una excepción técnica por una falsa certeza sobre la respuesta. | condición: Incorrecta sólo para veredicto real wrong; longitud no bloquea comprobar ni invalida respuestas que el motor acepta. Sistema reparado sólo tras solución y transición real del enigma de campaña; diario u otros contextos usan Respuesta correcta si no reparan un sistema. No borrar entrada/pistas al fallar. | params: [{'name': 'cantidad', 'binding': 'Longitud esperada cx.V.len[I18N.LANG] || cx.V.len.es del enigma vigente. Sin nueva validación dura: conservar verify y CO.norm. Rama singular cuando cantidad=1; no fijar longitud de las palabras de prueba.'}] | citas actuales: []
- COPY-estacion-answer-one-letter-help [PLAY-ESTACION-01, PLAY-ESTACION-02] es-AR: «Escribí una respuesta de 1 letra.» | en: «Enter a 1-letter answer.» | contexto: Respuesta e información de validación junto al campo, no sólo tachado. La longitud esperada deriva de cx.V.len por idioma; es orientación, no una nueva regla de rechazo. Conservar todos los veredictos de verify: ok/mid/trap/near/enie/other/repeat y sus pistas específicas. No sobrescribirlos con incorrecta genérica; no reemplazar una excepción técnica por una falsa certeza sobre la respuesta. | condición: Incorrecta sólo para veredicto real wrong; longitud no bloquea comprobar ni invalida respuestas que el motor acepta. Sistema reparado sólo tras solución y transición real del enigma de campaña; diario u otros contextos usan Respuesta correcta si no reparan un sistema. No borrar entrada/pistas al fallar. Sólo cuando la longitud esperada real es1; la orientación no bloquea verify. | params: [] | citas actuales: []
- COPY-estacion-correct-answer [PLAY-ESTACION-01, PLAY-ESTACION-02] es-AR: «Respuesta correcta.» | en: «Correct answer.» | contexto: Respuesta e información de validación junto al campo, no sólo tachado. La longitud esperada deriva de cx.V.len por idioma; es orientación, no una nueva regla de rechazo. Conservar todos los veredictos de verify: ok/mid/trap/near/enie/other/repeat y sus pistas específicas. No sobrescribirlos con incorrecta genérica; no reemplazar una excepción técnica por una falsa certeza sobre la respuesta. | condición: Incorrecta sólo para veredicto real wrong; longitud no bloquea comprobar ni invalida respuestas que el motor acepta. Sistema reparado sólo tras solución y transición real del enigma de campaña; diario u otros contextos usan Respuesta correcta si no reparan un sistema. No borrar entrada/pistas al fallar. | params: [] | citas actuales: []
- COPY-estacion-system-repaired [PLAY-ESTACION-01, PLAY-ESTACION-02] es-AR: «Respuesta correcta. Sistema reparado.» | en: «Correct answer. System repaired.» | contexto: Respuesta e información de validación junto al campo, no sólo tachado. La longitud esperada deriva de cx.V.len por idioma; es orientación, no una nueva regla de rechazo. Conservar todos los veredictos de verify: ok/mid/trap/near/enie/other/repeat y sus pistas específicas. No sobrescribirlos con incorrecta genérica; no reemplazar una excepción técnica por una falsa certeza sobre la respuesta. | condición: Incorrecta sólo para veredicto real wrong; longitud no bloquea comprobar ni invalida respuestas que el motor acepta. Sistema reparado sólo tras solución y transición real del enigma de campaña; diario u otros contextos usan Respuesta correcta si no reparan un sistema. No borrar entrada/pistas al fallar. | params: [] | citas actuales: []
- COPY-estacion-clean-glass [PLAY-ESTACION-03] es-AR: «Arrastrá para limpiar el cristal.» | en: «Drag to clear the glass.» | contexto: Alternativas DOM sincronizadas para los tres interruptores y limpieza equivalente por teclado. Conservar siete tubos, orden, combinaciones y orientación de la inscripción. El nombre accesible de cada interruptor se combina con aria-pressed real; no anunciar letras ocultas ni la respuesta final. | condición: La acción de teclado sólo se muestra después de implementar y documentar el control equivalente. Limpiar quita vaho, no invierte automáticamente la inscripción ni resuelve el enigma. No inventar una tecla concreta en el rótulo sin manejador. | params: [] | citas actuales: []
- COPY-estacion-clean-glass-keyboard [PLAY-ESTACION-03] es-AR: «Limpiar cristal con teclado» | en: «Clear glass with the keyboard» | contexto: Alternativas DOM sincronizadas para los tres interruptores y limpieza equivalente por teclado. Conservar siete tubos, orden, combinaciones y orientación de la inscripción. El nombre accesible de cada interruptor se combina con aria-pressed real; no anunciar letras ocultas ni la respuesta final. | condición: La acción de teclado sólo se muestra después de implementar y documentar el control equivalente. Limpiar quita vaho, no invierte automáticamente la inscripción ni resuelve el enigma. No inventar una tecla concreta en el rótulo sin manejador. | params: [] | citas actuales: []
- COPY-estacion-circle-switch [PLAY-ESTACION-03] es-AR: «Interruptor círculo» | en: «Circle switch» | contexto: Alternativas DOM sincronizadas para los tres interruptores y limpieza equivalente por teclado. Conservar siete tubos, orden, combinaciones y orientación de la inscripción. El nombre accesible de cada interruptor se combina con aria-pressed real; no anunciar letras ocultas ni la respuesta final. | condición: La acción de teclado sólo se muestra después de implementar y documentar el control equivalente. Limpiar quita vaho, no invierte automáticamente la inscripción ni resuelve el enigma. No inventar una tecla concreta en el rótulo sin manejador. | params: [] | citas actuales: []
- COPY-estacion-triangle-switch [PLAY-ESTACION-03] es-AR: «Interruptor triángulo» | en: «Triangle switch» | contexto: Alternativas DOM sincronizadas para los tres interruptores y limpieza equivalente por teclado. Conservar siete tubos, orden, combinaciones y orientación de la inscripción. El nombre accesible de cada interruptor se combina con aria-pressed real; no anunciar letras ocultas ni la respuesta final. | condición: La acción de teclado sólo se muestra después de implementar y documentar el control equivalente. Limpiar quita vaho, no invierte automáticamente la inscripción ni resuelve el enigma. No inventar una tecla concreta en el rótulo sin manejador. | params: [] | citas actuales: []
- COPY-estacion-square-switch [PLAY-ESTACION-03] es-AR: «Interruptor cuadrado» | en: «Square switch» | contexto: Alternativas DOM sincronizadas para los tres interruptores y limpieza equivalente por teclado. Conservar siete tubos, orden, combinaciones y orientación de la inscripción. El nombre accesible de cada interruptor se combina con aria-pressed real; no anunciar letras ocultas ni la respuesta final. | condición: La acción de teclado sólo se muestra después de implementar y documentar el control equivalente. Limpiar quita vaho, no invierte automáticamente la inscripción ni resuelve el enigma. No inventar una tecla concreta en el rótulo sin manejador. | params: [] | citas actuales: []
- COPY-estacion-switch-on [PLAY-ESTACION-03] es-AR: «Encendido» | en: «On» | contexto: Alternativas DOM sincronizadas para los tres interruptores y limpieza equivalente por teclado. Conservar siete tubos, orden, combinaciones y orientación de la inscripción. El nombre accesible de cada interruptor se combina con aria-pressed real; no anunciar letras ocultas ni la respuesta final. | condición: La acción de teclado sólo se muestra después de implementar y documentar el control equivalente. Limpiar quita vaho, no invierte automáticamente la inscripción ni resuelve el enigma. No inventar una tecla concreta en el rótulo sin manejador. | params: [] | citas actuales: []
- COPY-estacion-switch-off [PLAY-ESTACION-03] es-AR: «Apagado» | en: «Off» | contexto: Alternativas DOM sincronizadas para los tres interruptores y limpieza equivalente por teclado. Conservar siete tubos, orden, combinaciones y orientación de la inscripción. El nombre accesible de cada interruptor se combina con aria-pressed real; no anunciar letras ocultas ni la respuesta final. | condición: La acción de teclado sólo se muestra después de implementar y documentar el control equivalente. Limpiar quita vaho, no invierte automáticamente la inscripción ni resuelve el enigma. No inventar una tecla concreta en el rótulo sin manejador. | params: [] | citas actuales: []
- COPY-estacion-read-transcript [PLAY-ESTACION-04] es-AR: «Leer transcripción» | en: «Read transcript» | contexto: Resultado del enigma y acceso posterior en Bitácora. La fuente ya construye transcripción en player(); la observación no prueba ausencia total de texto. Leer debe abrir texto disponible sin auto=true/start ni reproducción audible. Detener describe el comportamiento vigente de stop: el siguiente start reinicia idx=0, no reanuda posición. Volver a la sala conserva sala/módulo actual, no anillo central. | condición: Texto sólo de la grabación desbloqueada pertinente, sin mostrar narrativa aún sellada. Reproducir exige acción deliberada. Volver a la sala sólo cuando ése es el destino real; p3 puede tener Abrir la compuerta y no debe renombrarse a sala si abre compuerta. | params: [] | citas actuales: []
- COPY-estacion-play-recording [PLAY-ESTACION-04] es-AR: «Reproducir grabación» | en: «Play recording» | contexto: Resultado del enigma y acceso posterior en Bitácora. La fuente ya construye transcripción en player(); la observación no prueba ausencia total de texto. Leer debe abrir texto disponible sin auto=true/start ni reproducción audible. Detener describe el comportamiento vigente de stop: el siguiente start reinicia idx=0, no reanuda posición. Volver a la sala conserva sala/módulo actual, no anillo central. | condición: Texto sólo de la grabación desbloqueada pertinente, sin mostrar narrativa aún sellada. Reproducir exige acción deliberada. Volver a la sala sólo cuando ése es el destino real; p3 puede tener Abrir la compuerta y no debe renombrarse a sala si abre compuerta. | params: [] | citas actuales: ['Escuchar grabación']
- COPY-estacion-stop-recording [PLAY-ESTACION-04] es-AR: «Detener grabación» | en: «Stop recording» | contexto: Resultado del enigma y acceso posterior en Bitácora. La fuente ya construye transcripción en player(); la observación no prueba ausencia total de texto. Leer debe abrir texto disponible sin auto=true/start ni reproducción audible. Detener describe el comportamiento vigente de stop: el siguiente start reinicia idx=0, no reanuda posición. Volver a la sala conserva sala/módulo actual, no anillo central. | condición: Acción real de detener la reproducción vigente; el siguiente Reproducir empieza desde el comienzo. No anunciar reanudación inexistente. | params: [] | citas actuales: []
- COPY-estacion-pause-recording [PLAY-ESTACION-04] es-AR: «Pausar grabación» | en: «Pause recording» | contexto: Resultado del enigma y acceso posterior en Bitácora. La fuente ya construye transcripción en player(); la observación no prueba ausencia total de texto. Leer debe abrir texto disponible sin auto=true/start ni reproducción audible. Detener describe el comportamiento vigente de stop: el siguiente start reinicia idx=0, no reanuda posición. Volver a la sala conserva sala/módulo actual, no anillo central. | condición: PROPUESTA CONDICIONAL: sólo si se implementa pausa y posterior reanudación desde la misma posición. El stop vigente reinicia al siguiente start; para él usar Detener grabación, no Pausar. | params: [] | citas actuales: []
- COPY-estacion-back-room [PLAY-ESTACION-04] es-AR: «Volver a la sala» | en: «Back to the room» | contexto: Resultado del enigma y acceso posterior en Bitácora. La fuente ya construye transcripción en player(); la observación no prueba ausencia total de texto. Leer debe abrir texto disponible sin auto=true/start ni reproducción audible. Detener describe el comportamiento vigente de stop: el siguiente start reinicia idx=0, no reanuda posición. Volver a la sala conserva sala/módulo actual, no anillo central. | condición: Texto sólo de la grabación desbloqueada pertinente, sin mostrar narrativa aún sellada. Reproducir exige acción deliberada. Volver a la sala sólo cuando ése es el destino real; p3 puede tener Abrir la compuerta y no debe renombrarse a sala si abre compuerta. | params: [] | citas actuales: []
- COPY-estacion-hints-used [SRC-ES01, PLAY-ESTACION-05] es-AR: «Pistas usadas: {cantidad}» | en: «Hints used: {cantidad}» | contexto: Regla de campaña ui.js292: paid=max(0,st.hints−(st.freeHint?1:0)); stars=max(0,3−paid). No restar estrellas por respuestas incorrectas ni tiempo. Una pista ya revelada no vuelve a costar. La gratuidad inicial sólo corresponde a p3 elegible; no prometerla en p1/p2. No extender estrellas al diario, que tiene otro resumen. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Mostrar reducción de1 sólo si el siguiente paso reduce realmente ese máximo. Preparar solución es el tercer paso no diario: inicia espera activa y todavía no revela solución; conservar cancelación y momento real de aplicar el tercer paso, sin cobrar de nuevo por reabrir ayudas. | params: [{'name': 'cantidad', 'binding': 'st.hints del enigma actual, incluidos pasos gratuitos revelados; no sustituir por G.hintsUsed global ni por paid. En diario leer su propio estado si esta etiqueta se reutiliza sin estrellas.'}] | citas actuales: []
- COPY-estacion-stars-earned [SRC-ES01, PLAY-ESTACION-05] es-AR: «Estrellas obtenidas: {obtenidas} de {máximo}» | en: «Stars earned: {obtenidas} out of {máximo}» | contexto: Regla de campaña ui.js292: paid=max(0,st.hints−(st.freeHint?1:0)); stars=max(0,3−paid). No restar estrellas por respuestas incorrectas ni tiempo. Una pista ya revelada no vuelve a costar. La gratuidad inicial sólo corresponde a p3 elegible; no prometerla en p1/p2. No extender estrellas al diario, que tiene otro resumen. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Mostrar reducción de1 sólo si el siguiente paso reduce realmente ese máximo. Preparar solución es el tercer paso no diario: inicia espera activa y todavía no revela solución; conservar cancelación y momento real de aplicar el tercer paso, sin cobrar de nuevo por reabrir ayudas. | params: [{'name': 'obtenidas', 'binding': 'st.stars del enigma resuelto: max(0,3−max(0,st.hints−(st.freeHint?1:0))). No usar3/2 observados como constantes de resultado.'}, {'name': 'máximo', 'binding': 'Escala total vigente del enigma de campaña, actualmente3; no rebajar denominador por una ayuda. Si se muestra máximo alcanzable, debe tener otra etiqueta.'}] | citas actuales: []
- COPY-estacion-hint-score-effect [SRC-ES01, PLAY-ESTACION-05] es-AR: «Esta ayuda reduce en 1 estrella la puntuación máxima de este enigma; no gasta un saldo global.» | en: «This hint reduces this puzzle’s maximum score by 1 star; it does not spend a shared balance.» | contexto: Regla de campaña ui.js292: paid=max(0,st.hints−(st.freeHint?1:0)); stars=max(0,3−paid). No restar estrellas por respuestas incorrectas ni tiempo. Una pista ya revelada no vuelve a costar. La gratuidad inicial sólo corresponde a p3 elegible; no prometerla en p1/p2. No extender estrellas al diario, que tiene otro resumen. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Sólo antes de un paso de campaña con decremento real de1, junto al botón y sus condiciones de revelación; excluir gratis, ya revelada y diario. | params: [] | citas actuales: []
- COPY-estacion-hint-already-revealed [SRC-ES01, PLAY-ESTACION-05] es-AR: «Pista ya revelada» | en: «Hint already revealed» | contexto: Regla de campaña ui.js292: paid=max(0,st.hints−(st.freeHint?1:0)); stars=max(0,3−paid). No restar estrellas por respuestas incorrectas ni tiempo. Una pista ya revelada no vuelve a costar. La gratuidad inicial sólo corresponde a p3 elegible; no prometerla en p1/p2. No extender estrellas al diario, que tiene otro resumen. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Sólo st.hints>índice del paso. Leer de nuevo no incrementa hints ni vuelve a reducir estrellas. | params: [] | citas actuales: []
- COPY-estacion-request-solution [SRC-ES01, PLAY-ESTACION-05] es-AR: «Preparar solución · {segundos} s de espera» | en: «Prepare solution · {segundos} s wait» | contexto: Regla de campaña ui.js292: paid=max(0,st.hints−(st.freeHint?1:0)); stars=max(0,3−paid). No restar estrellas por respuestas incorrectas ni tiempo. Una pista ya revelada no vuelve a costar. La gratuidad inicial sólo corresponde a p3 elegible; no prometerla en p1/p2. No extender estrellas al diario, que tiene otro resumen. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Mostrar reducción de1 sólo si el siguiente paso reduce realmente ese máximo. Preparar solución es el tercer paso no diario: inicia espera activa y todavía no revela solución; conservar cancelación y momento real de aplicar el tercer paso, sin cobrar de nuevo por reabrir ayudas. | params: [{'name': 'segundos', 'binding': 'Espera inicial real de ui.js349:60000 ms/1000=60 s activos. No prometer reloj de pared cuando pausa/modal detiene avance. No usar este valor como tiempo restante; para cuenta restante leer solT real.'}] | citas actuales: []
- COPY-estacion-ambient-audio [PLAY-ESTACION-06] es-AR: «Ambiente» | en: «Ambient sound» | contexto: Nombres de ajustes y cierres de diálogos; asociar estados reales, foco inicial dentro, fondo inert y devolución al disparador. No anunciar sólo0/1. Volumen de voces no sustituye el de música/efectos/ambiente. No certifica reproducción audible. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-voice-volume [PLAY-ESTACION-06] es-AR: «Volumen de voces» | en: «Voice volume» | contexto: Nombres de ajustes y cierres de diálogos; asociar estados reales, foco inicial dentro, fondo inert y devolución al disparador. No anunciar sólo0/1. Volumen de voces no sustituye el de música/efectos/ambiente. No certifica reproducción audible. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-audio-visual-alternatives [PLAY-ESTACION-06] es-AR: «Alternativas visuales de audio» | en: «Visual alternatives to audio» | contexto: Nombres de ajustes y cierres de diálogos; asociar estados reales, foco inicial dentro, fondo inert y devolución al disparador. No anunciar sólo0/1. Volumen de voces no sustituye el de música/efectos/ambiente. No certifica reproducción audible. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-close-hints [PLAY-ESTACION-06] es-AR: «Cerrar ayudas» | en: «Close hints» | contexto: Nombres de ajustes y cierres de diálogos; asociar estados reales, foco inicial dentro, fondo inert y devolución al disparador. No anunciar sólo0/1. Volumen de voces no sustituye el de música/efectos/ambiente. No certifica reproducción audible. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-close-log [PLAY-ESTACION-06] es-AR: «Cerrar bitácora» | en: «Close log» | contexto: Nombres de ajustes y cierres de diálogos; asociar estados reales, foco inicial dentro, fondo inert y devolución al disparador. No anunciar sólo0/1. Volumen de voces no sustituye el de música/efectos/ambiente. No certifica reproducción audible. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-estacion-solved-stars [PLAY-ESTACION-07] es-AR: «Resuelto · {estrellas} estrellas» | en: «Solved · {estrellas} stars» | contexto: Estados de panel y controles de desplazamiento de sala. Disponible no significa resuelto ni se deduce de rojo/violeta; ligar a desbloqueo real. No alterar siete posiciones de tubos, cartel de orden, combinaciones binarias ni letras. Desplazar debe conservar acceso por tarjetas y teclado. | condición: Rama singular cuando estrellas=1; plural para0 y demás valores reales. Disponible sólo si el panel está accesible. El nuevo control de vista sólo si está implementado, no como un rótulo decorativo sin acción. | params: [{'name': 'estrellas', 'binding': 'st.stars del panel resuelto; elegir rama singular si=1. No inferir estado desde color ni atribuir estrellas a enigmas todavía abiertos.'}] | citas actuales: []
- COPY-estacion-solved-one-star [PLAY-ESTACION-07] es-AR: «Resuelto · 1 estrella» | en: «Solved · 1 star» | contexto: Estados de panel y controles de desplazamiento de sala. Disponible no significa resuelto ni se deduce de rojo/violeta; ligar a desbloqueo real. No alterar siete posiciones de tubos, cartel de orden, combinaciones binarias ni letras. Desplazar debe conservar acceso por tarjetas y teclado. | condición: Sólo panel resuelto con st.stars===1; no fijar1 para otros resultados. | params: [] | citas actuales: []
- COPY-estacion-available [PLAY-ESTACION-07] es-AR: «Disponible» | en: «Available» | contexto: Estados de panel y controles de desplazamiento de sala. Disponible no significa resuelto ni se deduce de rojo/violeta; ligar a desbloqueo real. No alterar siete posiciones de tubos, cartel de orden, combinaciones binarias ni letras. Desplazar debe conservar acceso por tarjetas y teclado. | condición: Rama singular cuando estrellas=1; plural para0 y demás valores reales. Disponible sólo si el panel está accesible. El nuevo control de vista sólo si está implementado, no como un rótulo decorativo sin acción. | params: [] | citas actuales: []
- COPY-estacion-move-room-view [PLAY-ESTACION-07] es-AR: «Mover vista de la sala» | en: «Move the room view» | contexto: Estados de panel y controles de desplazamiento de sala. Disponible no significa resuelto ni se deduce de rojo/violeta; ligar a desbloqueo real. No alterar siete posiciones de tubos, cartel de orden, combinaciones binarias ni letras. Desplazar debe conservar acceso por tarjetas y teclado. | condición: Rama singular cuando estrellas=1; plural para0 y demás valores reales. Disponible sólo si el panel está accesible. El nuevo control de vista sólo si está implementado, no como un rótulo decorativo sin acción. | params: [] | citas actuales: []
- COPY-estacion-puzzle-name [PLAY-ESTACION-07] es-AR: «Enigma {número}: {nombre}» | en: «Puzzle {número}: {nombre}» | contexto: Estados de panel y controles de desplazamiento de sala. Disponible no significa resuelto ni se deduce de rojo/violeta; ligar a desbloqueo real. No alterar siete posiciones de tubos, cartel de orden, combinaciones binarias ni letras. Desplazar debe conservar acceso por tarjetas y teclado. | condición: Rama singular cuando estrellas=1; plural para0 y demás valores reales. Disponible sólo si el panel está accesible. El nuevo control de vista sólo si está implementado, no como un rótulo decorativo sin acción. | params: [{'name': 'número', 'binding': 'Número/identificador de presentación real del panel en su sala; conservar P1/P2/P3 si son el identificador vigente, sin inventar otra numeración.'}, {'name': 'nombre', 'binding': 'Nombre localizado existente del enigma, no su solución ni una letra oculta.'}] | citas actuales: []
- COPY-estacion-reveal-hint [SRC-ES01, PLAY-ESTACION-05] es-AR: «Revelar pista» | en: «Reveal hint» | contexto: Acciones distintas: primera pista leve versus explicación del método. Los títulos Pista leve/Cómo resolverlo/Ver solución no sustituyen el nombre de cada acción. Usar Revelar pista como etiqueta base si el coste real está visible y asociado junto al CTA; la variante inline estacion-paid-hint es alternativa de presentación, no un segundo botón. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Sólo siguiente paso permitido, aún no revelado. Mostrar coste cuando exista y gratuidad sólo en p3 elegible. Método no revela automáticamente la palabra; preparar solución conserva su espera real. No crear un segundo cobro ni una nueva economía. Acción del primer paso (índice0), no del método ni de solución. Si la pista es gratuita usar la variante gratis; si tiene coste, mostrarlo junto al CTA o usar la variante inline, nunca ambas como botones duplicados. | params: [] | citas actuales: []
- COPY-estacion-reveal-method [SRC-ES01, PLAY-ESTACION-05] es-AR: «Revelar método» | en: «Reveal method» | contexto: Acciones distintas: primera pista leve versus explicación del método. Los títulos Pista leve/Cómo resolverlo/Ver solución no sustituyen el nombre de cada acción. Usar Revelar pista como etiqueta base si el coste real está visible y asociado junto al CTA; la variante inline estacion-paid-hint es alternativa de presentación, no un segundo botón. Fuente actual ya muestra coste/gratuidad condicionada de ayuda: esto es revisión de copy y preservación de lógica, no creación de coste ni de gratuidad. | condición: Sólo siguiente paso permitido, aún no revelado. Mostrar coste cuando exista y gratuidad sólo en p3 elegible. Método no revela automáticamente la palabra; preparar solución conserva su espera real. No crear un segundo cobro ni una nueva economía. Acción del segundo paso (índice1), no de primera pista ni solución. Conservar requisito de paso previo y coste real adyacente; no aplicar gratuidad de p3 a este método. | params: [] | citas actuales: []
