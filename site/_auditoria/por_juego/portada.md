# portada: 17 registros del catálogo, 50 copys

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

## [PLAY-PORTADA-01] P2 · active · Prueba interactiva y propuestas
**Legibilidad editorial sin cortar titulares torpemente**
- Actual: En el tablero y la mesa aparecen cortes como aste-/roide, alre-/dedor y pe-/lota. Las columnas estrechas tienen títulos muy pesados y texto pequeño; la trama de la foto domina el sujeto.
- Instrucción: Usar una tipografía editorial de títulos que conserve ancho y altura legibles. Definir tamaños según el tipo de pieza y saltos de línea lingüísticamente correctos, evitando partir palabras cortas. Atenuar la frecuencia o el contraste de la trama de impresión sin cambiar la información de la imagen ni la geometría de las piezas. No ampliar columnas de un modo que altere el rompecabezas.
- Copy: Vista ampliada de la noticia
Cerrar vista ampliada
- Aceptación: Los titulares probados se leen sin divisiones torpes de palabras cortas. Al ampliar una pieza, se ve todo su texto sin modificar su ubicación, tamaño lógico ni puntuación.
- Referencias: evidence/portada-pass1-gameplay.jpg
evidence/portada-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:28:00Z/2026-10-22T15:35:00Z
Cobertura: dos ediciones de práctica; no se completaron dos sesiones de tres ediciones.

## [PLAY-PORTADA-02] P2 · active · Prueba interactiva y propuestas
**Cuadrícula y dimensiones explícitas al colocar**
- Actual: El papel muestra puntos muy tenues, no celdas claras. Las piezas son botones accesibles con tipo, sección y texto, pero sin tamaño, coordenadas ni estado seleccionado.
- Instrucción: Durante la edición, mostrar guías discretas de filas y columnas y la huella de colocación; ocultarlas en la vista final. Añadir dimensiones, fila, columna y selección al nombre o estado accesible. Exponer destinos navegables y mensajes de colisión o salida de límites. No cambiar los tamaños de las piezas ni sus relaciones de vecindad.
- Copy: {tipo}, {sección}. {ancho} por {alto} celdas.
Fila {fila}, columna {columna}.
No entra en esta posición.
Devolver a la mesa
- Aceptación: Con teclado se puede consultar dónde está una pieza y cuánto ocupa. La vista de impresión queda limpia; el estado de selección se distingue del de bonificación.
- Referencias: evidence/portada-pass1-gameplay.jpg
evidence/portada-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:28:00Z/2026-10-22T15:35:00Z
Cobertura: dos ediciones de práctica; no se completaron dos sesiones de tres ediciones.

## [PLAY-PORTADA-03] P2 · active · Prueba interactiva y propuestas
**Tirada, barras y multiplicadores con unidades y causas**
- Actual: Durante la edición sólo aparecen TIRADA y una cifra, una barra sin objetivo y chips ×2 duplicados sin causa visible. La unidad mil ejemplares aparece recién en el resultado. La tabla usa POL/ECO/CIE/CLI/CUL/SOC/DEP/PUB sin nombres completos.
- Instrucción: Rotular la tirada estimada y su unidad desde el tablero. Mostrar la referencia del jefe con la misma unidad, sin presentarla como una garantía de victoria. Diferenciar el multiplicador de cabecera del de foto relacionada. Expandir las abreviaturas mediante texto o ayuda accesible, y mantener visible la tabla de pares pertinente al tutorial. Obtener cifras, referencia y bonificaciones del estado real; no fijar valores de la edición observada.
- Copy: Tirada estimada: {cantidad} mil ejemplares
Referencia del jefe: {referencia} mil ejemplares
×2 por cabecera
×2 por foto relacionada
Ciencia + Cultura: +{bonificación}
- Aceptación: Una barra completa no se confunde con victoria garantizada. Cada multiplicador tiene una causa consultable y cada código tiene su nombre completo. La tirada y la referencia se muestran con unidades coherentes.
- Referencias: evidence/portada-pass1-gameplay.jpg
evidence/portada-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:28:00Z/2026-10-22T15:35:00Z
Cobertura: dos ediciones de práctica; no se completaron dos sesiones de tres ediciones.

## [PLAY-PORTADA-04] P2 · active · Prueba interactiva y propuestas
**Guía y piezas sobrantes sincronizadas con el estado**
- Actual: Después de llenar la primera página, la guía todavía dice Llena el hueco y pulsa Imprimir. En la segunda, al retirar Sociedad, mantiene Sobra una pieza, aunque ahora hay dos piezas en la mesa y huecos en la página.
- Instrucción: Actualizar la guía al colocar o retirar piezas y al deshacer o rehacer. Distinguir las piezas disponibles de las obligatorias: una portada completa puede dejar noticias fuera. Mantener legible NO ENTRA y explicar que una pieza colocada puede devolverse a la mesa para probar otra combinación. Los mensajes de portada completa y las cantidades deben depender del estado actual, no del paso anterior del tutorial.
- Copy: La portada está completa. Imprimí para ver el resultado.
Tenés {cantidad} piezas en la mesa y {huecos} celdas vacías.
No hace falta publicar todas las noticias.
Podés devolver una pieza a la mesa para probar otra combinación.
- Aceptación: Después de retirar una columna, no se conserva un mensaje de portada completa ni una cantidad anterior. El tutorial se actualiza también al deshacer y rehacer.
- Referencias: evidence/portada-pass1-gameplay.jpg
evidence/portada-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:28:00Z/2026-10-22T15:35:00Z
Cobertura: dos ediciones de práctica; no se completaron dos sesiones de tres ediciones.

## [PLAY-PORTADA-05] P2 · active · Prueba interactiva y propuestas
**Distinguir el aporte por pieza de la diferencia neta y aclarar el resultado**
- Actual: Un resultado de 16 frente a 21 usa AGOTADO con un sello rojo y una estrella. La comparación destaca Mudarse al norte (+3), pero sustituir las columnas produjo 21 frente a 16 al cambiar los vecinos de −3 a +2.
- Instrucción: Mantener la metáfora editorial, pero explicar el nivel de rendimiento para que «Agotado» no se interprete indistintamente como fallo o como éxito máximo. Conservar el significado actual de bossDiff: compara el aporte de la misma pieza en la portada del jefe y en la del jugador; si falta en una portada, su aporte allí es 0. Para una pieza ausente en la portada del jugador, rotular el valor como aporte de esa pieza en la portada del jefe. Si la pieza está en ambas, rotularlo como diferencia de aporte, no como aporte absoluto. No presentar ese valor como ganancia neta de sustituir otra pieza ni corregirlo reemplazándolo por la diferencia global. Mostrar el mensaje de faltante sólo si la tirada queda por debajo de la referencia. Opcional, pendiente de decisión de producto: si se añade una propuesta de sustitución, recomputar la puntuación completa antes y después, incluyendo todos los factores vigentes —piezas, vecinos, extras, huecos, multiplicadores globales y redondeos—; no limitar el total a una suma inventada de dos componentes. Ese cálculo adicional no es requisito para corregir las etiquetas actuales.
- Copy: Edición publicada · {estrellas} de 3 estrellas
Te faltaron {diferencia} mil ejemplares para igualar la referencia.
Aporte de esta pieza en la portada del jefe: {aporte}
Diferencia de aporte de esta pieza entre ambas portadas: {diferencia_aporte}
Este valor no indica la ganancia neta de sustituir otra pieza.
- Aceptación: Una pieza ausente muestra su aporte en la portada del jefe; una pieza presente en ambas muestra la diferencia entre sus aportes. Ninguna de esas cifras se anuncia como mejora neta de sustituir otra pieza. bossDiff conserva su fórmula y su función actuales. Si se aprueba la opción de simular sustituciones, su diferencia neta debe coincidir con dos ejecuciones completas de la lógica de puntuación, con todos sus factores. El texto y el sello representan el mismo nivel de logro.
- Referencias: evidence/portada-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:28:00Z/2026-10-22T15:35:00Z
Cobertura: dos ediciones de práctica; no se completaron dos sesiones de tres ediciones.
Verificación de las fuentes guardadas: portada/src/ui.js, bossDiff, líneas 875–889, compara bo.pieces[p.ix].total − me.pieces[p.ix].total, con 0 si la pieza falta. El +3 observado corresponde a Sociedad presente en la portada del jefe y ausente en la del jugador; Deportes, retirada en la sustitución, también aportaba 3. En la comparación probada, las piezas permanecieron en 19→19, los vecinos cambiaron de −3→+2 y el total de 16→21. El +3 por pieza y el +5 global son magnitudes distintas; ninguno debe reemplazar al otro.

## [PLAY-PORTADA-06] P2 · active · Prueba interactiva y propuestas
**Resultado revisable sin ocultar el desglose**
- Actual: A 1180×757, las grandes vistas previas empujan el desglose bajo el borde visible y el CTA Siguiente edición queda encima. No hay una acción visible para volver a editar, repetir o ir al inicio.
- Instrucción: Reducir las vistas previas o usar una comparación ampliable. Mantener el resumen y el desglose completo accesibles antes del CTA. Ofrecer «Volver a editar» sólo si las reglas permiten hacerlo sin alterar el resultado guardado; de lo contrario, ofrecer «Repetir esta práctica» como un intento separado. Añadir «Volver al menú» y explicar qué se conserva. No exigir avanzar a otra edición para salir ni presentar una edición como una sesión completa.
- Copy: Ver desglose
Comparar portadas
Repetir esta práctica
Siguiente edición
Volver al menú
- Aceptación: En el tamaño de ventana de prueba, el desglose de piezas, vecinos y huecos puede leerse sin quedar debajo de un botón fijo. Las acciones aclaran si crean un intento nuevo o conservan el actual, y permiten salir sin avanzar de edición.
- Referencias: evidence/portada-pass1-result.jpg
evidence/portada-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:28:00Z/2026-10-22T15:35:00Z
Cobertura: dos ediciones de práctica; no se completaron dos sesiones de tres ediciones.

## [PLAY-PORTADA-07] P2 · active · Prueba interactiva y propuestas
**Foco y semántica de introducciones, ayuda y resultado**
- Actual: Toca para seguir es texto dentro de un contenedor, no un botón. La ayuda expone sus cuatro páginas a la vez en el árbol de accesibilidad; la pausa y el resultado conservan expuestos los controles del tablero que queda detrás.
- Instrucción: Convertir el avance de la introducción en un botón «Continuar», activable con Enter y Espacio. Esa etiqueta sólo avanza la introducción: la reanudación desde pausa sigue usando «Reanudar partida». Dar rol dialog a las superposiciones, con foco inicial, restauración al cierre y fondo inert. En el carrusel, exponer únicamente la lámina activa y dar nombres descriptivos a sus controles de navegación.
- Copy: Continuar
Paso {actual} de {total}
Paso anterior
Paso siguiente
Cerrar ayuda
- Aceptación: El flujo completo puede recorrerse con teclado sin activar piezas detrás de un modal. El lector no anuncia instrucciones de láminas ocultas al mismo tiempo que la activa.
- Referencias: evidence/portada-pass1-result.jpg
evidence/portada-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:28:00Z/2026-10-22T15:35:00Z
Cobertura: dos ediciones de práctica; no se completaron dos sesiones de tres ediciones.

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

## [RSP-PORTADA-01] P2 · active · Responsive y controles
**Los chips interactivos de reglas/tema son de 30 px y su contenedor sólo reserva 32–34 px**
- Actual: `current_1410/portada__portada__src__style.css:105–107` fija `.chip{height:30px}` sin ampliación del área de interacción. Son botones reales que abren detalles (`ui.js:410–417,1158–1159`). `ui.js:147–148,167,189,220` reserva sólo 32–34 px; en orientación vertical de poca altura el chip compacto se inserta en el hueco entre volver y los dos botones derechos.
- Instrucción: Dar `.chip{min-height:44px;height:auto}` y reservar 44 px más 8 px de separación. En orientación vertical de poca altura no meterlo en el hueco de cabecera: fila dedicada bajo `score` (`top=y1+48,height=44`), aumentar `py` a `y1+44+56` y recalcular espacio de papel mediante el `fitCell` existente; si el tablero resulta ilegible, hacer el resumen de reglas un botón de 44×44 px junto al score, con nombre «Reglas y tema», no encoger el área de interacción. En horizontal, `chips` mide 44 px y tray empieza en `top+146+TR` (12 px más que 134). En el diseño ancho, `chipsH()` debe reservar como mínimo 44+8 px; distribuir el panel lateral según su altura real. Conservar desplazamiento horizontal de chips.
- Copy: 
- Aceptación: 320×640, 360×800, 390×844, 768×1024 y 768×390: todo chip se puede tocar dentro de un rectángulo de 44×44 px sin tocar Volver/Ajustes; chip enfocado no queda recortado por el contenedor; ninguna fila tapa el papel. Validación de ajuste de tablero pendiente de render real.
- Referencias: Archivo: current_1410/portada__portada__src__style.css
Líneas: 105–107
Archivo: current_1410/portada__portada__src__ui.js
Líneas: 147–148,167,189,220,410–417,1158–1159
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-PORTADA-02] P2 · active · Responsive y controles
**No inmovilizar Tab durante colocación por teclado**
- Actual: `current_1410/portada__portada__src__ui.js:675–680` hace `if(k==='Tab'){e.preventDefault();return;}` cuando `S.kb` está activo. Escape cancela, pero no hay Tab normal a herramientas mientras se mueve una pieza.
- Instrucción: Al recibir Tab durante `S.kb`, cancelar sólo la previsualización no confirmada (`S.kb=null; clearPreview(); renderAll()`), mantener la posición original sin mutar historial y **no** cancelar Tab. Anunciar «Colocación cancelada» en el status existente. Enter/Espacio confirman y Escape cancela como ahora.
- Copy: 
- Aceptación: Levantar una pieza, moverla, pulsar Tab: la pieza vuelve a la posición previa y el foco avanza a la siguiente herramienta; no se altera puntuación ni historial. Shift+Tab equivalente. Probar con pieza en bandeja y pieza ya puesta, cuatro anchuras.
- Referencias: Archivo: current_1410/portada__portada__src__ui.js
Líneas: 675–680
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [SRC-PO01] P2 · active_source_finding · Texto, estados y flujo
**Imprimir portada que termina partida**
- Actual: Falta para la meta; Si la imprimes, la partida termina.; Imprimir igual
- Instrucción: El botón de confirmación debe declarar que termina la partida; no cambiar las reglas de tirada. Mostrar tirada actual, meta y faltante junto al aviso. No añadir confirmación destructiva si la meta está cumplida.
- Copy: La portada no alcanza la meta / Si imprimís ahora, termina esta partida. / Seguir editando / Imprimir y terminar
- Aceptación: Con meta insuficiente, el primer clic en Imprimir abre confirmación y no termina la partida. Seguir editando conserva ubicación y rotación de todas las piezas. Imprimir y terminar requiere una decisión nueva.
- Referencias: https://jetgames.fun/portada/src/i18n.js?v=4 — es.print/below_goal/print_anyway
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [SRC-PO02] P2 · active_source_finding · Texto, estados y flujo
**Mesa, reglas, resultados**
- Actual: Quedan {n}; Quedan {n} huecos: cada uno resta 2; Reglas ({n}); Otra partida
- Instrucción: Distinguir piezas disponibles y celdas vacías. Mostrar mil ejemplares junto a tirada y meta. Inspeccionar reglas acumuladas no debe perder la selección de la pieza. El reinicio debe explicar si afecta sólo la edición o toda la partida, según la lógica existente.
- Copy: {n} piezas en la mesa / {n} celdas vacías · −{penalización} / Reglas activas ({n}) / Nueva partida
- Aceptación: Los dos contadores no se confunden. Celdas vacías × 2 coincide con la penalización aplicable. Abrir reglas y volver no mueve piezas.
- Referencias: https://jetgames.fun/portada/src/i18n.js?v=4 — es.rules_n/left/holes/unit_s/restart_sure/again
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-PORTADA-01] P2 · active_proposal · Dirección visual interna
**Mantener textura de papel sin poner ruido encima del texto**
- Actual: #paper usa #f2ecdf, sombra 0 24px60 px y pseudo-elemento z-index3 con ruido fractal alpha .09 y viñeta.12 en multiply. El tablero suma puntos alpha .22 y borde dashed.14.
- Instrucción: Reducir el ruido de papel a alpha .035 y la viñeta a .06. Dibujar ambos como fondo del papel por debajo de recortes, titulares y sellos, no como capa encima de todo el contenido. Mantener el borde doble del masthead. En modo colocación, puntos de la cuadrícula alpha .18; tras cerrar una edición, bajar a .06 para que la tapa se lea como periódico terminado. No eliminar la retícula durante el juego ni usar una textura fotográfica pesada.
- Copy: 
- Aceptación: Una tapa terminada conserva materialidad de papel, pero titulares y semitono permanecen nítidos. A DPR 1/2/3 los puntos no crean falso contorno alrededor de piezas. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/portada__portada__src__style.css
lines: 114–124
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar tamaño del papel, número de celdas, origen de la grilla o límites de colocación. La textura nunca debe parecer un hueco ocupado.

## [VIS-PORTADA-02] P2 · active_proposal · Dirección visual interna
**Usar jerarquía tipográfica adaptativa en vez de texto microscópico**
- Actual: fitEl() reduce secciones/captions hasta 8.5 px, titulares tit hasta 9 px y columnas hasta 8 px; .h/.d recortan overflow. Ya existe showDetail(ix) con titular, descripción y desglose de puntuación completos.
- Instrucción: Definir variante compacta para recortes cuyo ancho visual sea<90 px o alto<64 px: mostrar sección con icono y código, titular en máximo 2 líneas a 11 px y ocultar solamente la bajada ornamental en la miniatura. No reescribir el titular ni descartar contenido; conservarlo íntegro en showDetail y aria-label. En recortes grandes, titular 16–24 px, bajada 12–14 px; en tipo titular permitir hasta 32 px. Evitar bajar letras bajo 10 px para simular que todo cabe. Mantener el gesto actual que abre detalle y hacerlo explícito en la ayuda, sin interferir con arrastre.
- Copy: 
- Aceptación: En 320/360 px se reconoce tipo, sección y titular abreviado por recorte; detalle muestra el texto completo sin pérdida. Rotar una pieza recalcula la variante sin cambiar su contenido o valor. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/portada__portada__src__style.css
lines: 133–144
file: ui_audit/source_review/current_1410/portada__portada__src__ui.js
lines: 249–272,688–705
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No modificar dimensiones K.dims, tipo de pieza, texto usado para identificar pareja foto/nota ni reglas de puntuación. El modo compacto no cambia la historia representada.

## [VIS-PORTADA-03] P2 · active_proposal · Dirección visual interna
**Semitono que conserve el sujeto en fotos pequeñas**
- Actual: halftone() calcula step=max(3,round(min(w,h)/30)) sobre píxeles de backing; radio=.62*step*sqrt(1−L), con caché por id/tamaño/tintas. fitEl multiplica tamaño por DPR antes de generar la foto.
- Instrucción: Calcular el paso de semitono en píxeles CSS y multiplicarlo después por DPR: pasoCSS=clamp(min(anchoCSS,altoCSS)/30,1.5,3). Mantener el muestreo de luminancia y tinta #16111f sobre #e9e2d2. Para foto con lado corto<48 px usar una versión de tres tonos planos de la misma escena, sin puntos más grandes que ojos, casco o pelota; no cambiar de ilustración. Añadir DPR/paso a la clave de caché. En showDetail de fotos, añadir una reproducción de la misma p.ill de ancho min(100%,360px), sin sustituir el texto de pareja existente. Evitar blur CSS o filtros de color globales.
- Copy: 
- Aceptación: La misma foto se reconoce a DPR 1/2/3 y al abrir detalle. En miniaturas se distingue el sujeto principal sin que un único punto cubra su cara; a tamaño grande vuelve el semitono editorial. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/portada__portada__src__art.js
lines: 23–27,154–179
file: ui_audit/source_review/current_1410/portada__portada__src__ui.js
lines: 262–266
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: Conservar p.ill y la relación foto/artículo. La imagen no puede revelar pistas adicionales ni perder el sujeto que permite reconocer la pareja.

## [VIS-PORTADA-04] P2 · active_proposal · Dirección visual interna
**Sellos y estados de arrastre sin cubrir el titular**
- Actual: Los sellos .st están top/right2 px, tipografía~10 px y rotación−4°; flat cambia a fila. .sel añade borde cian 3 px y sombra 18 px; src opacity.25, dim/nofit.38; nofit añade rótulo central.
- Instrucción: Reservar una franja superior para sellos dentro de cada recorte cuando existan, de altura max(16px,1.4em), y empezar el titular debajo. En compactos, mostrar un sello resumido con cantidad y dejar desglose íntegro en detalle; no superponer múltiples etiquetas sobre el titular. Selección: contorno cian 2 px sin halo; origen del arrastre: contorno discontinuo y contenido al 45%; destino inválido: marco rojo con rótulo en el borde inferior, no sobre el centro de la noticia. Mantener las esquinas y dimensiones del recorte.
- Copy: 
- Aceptación: Con tres multiplicadores, una pieza apaisada y otra vertical conservan titular reconocible. Arrastrar/cancelar no deja sellos duplicados ni rótulos de error sobre una pieza válida. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/portada__portada__src__style.css
lines: 156–168
file: ui_audit/source_review/current_1410/portada__portada__src__ui.js
lines: 251–252
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No modificar multiplicadores ni cuándo se conceden; .src/.sel/.nofit siguen siendo interacción, no puntuación. La propuesta no cambia reglas de rotación o colocación.

# Copys ES/EN aplicables
- COPY-common-menu [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-TELEMETRIA-05, PLAY-PORTADA-06, PLAY-FRENTES-02] es-AR: «Volver al menú» | en: «Back to menu» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-cancel [SRC-G04, SRC-R02, SRC-AN01, SRC-E02, SRC-BE01, SRC-BE02, RSP-MODALS-01, RSP-BALIZAS-02, PLAY-BALIZAS-05] es-AR: «Cancelar» | en: «Cancel» | contexto: Cancelación real: no cobrar, borrar, publicar, fusionar ni sustituir estado. Foco inicial en confirmaciones destructivas. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-below-goal [SRC-PO01] es-AR: «La portada no alcanza la meta» | en: «The front page falls short of the target» | contexto: Confirmación sólo si meta insuficiente; no alterar tirada/penalizaciones. Título de juego JET//Portada no se traduce; front page aquí es objeto editorial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-print-warning [SRC-PO01] es-AR: «Si imprimís ahora, termina esta partida.» | en: «Printing now will end this game.» | contexto: Confirmación sólo si meta insuficiente; no alterar tirada/penalizaciones. Título de juego JET//Portada no se traduce; front page aquí es objeto editorial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-keep-editing [SRC-PO01] es-AR: «Seguir editando» | en: «Keep editing» | contexto: Confirmación sólo si meta insuficiente; no alterar tirada/penalizaciones. Título de juego JET//Portada no se traduce; front page aquí es objeto editorial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-print-end [SRC-PO01] es-AR: «Imprimir y terminar» | en: «Print and finish» | contexto: Confirmación sólo si meta insuficiente; no alterar tirada/penalizaciones. Título de juego JET//Portada no se traduce; front page aquí es objeto editorial. Revisión estática de red 15:31–15:35: esta evaluación es local; compartir es otra función. No implica ausencia total de GET/descargas/métricas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Imprimir igual']
- COPY-portada-circulation [SRC-PO01] es-AR: «Tirada: {n} mil ejemplares» | en: «Circulation: {n} thousand copies» | contexto: Confirmación sólo si meta insuficiente; no alterar tirada/penalizaciones. Título de juego JET//Portada no se traduce; front page aquí es objeto editorial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-target [SRC-PO01] es-AR: «Meta: {n} mil ejemplares» | en: «Target: {n} thousand copies» | contexto: Confirmación sólo si meta insuficiente; no alterar tirada/penalizaciones. Título de juego JET//Portada no se traduce; front page aquí es objeto editorial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-shortfall [SRC-PO01] es-AR: «Faltan {n} mil ejemplares para la meta.» | en: «{n} thousand more copies are needed to reach the target.» | contexto: Confirmación sólo si meta insuficiente; no alterar tirada/penalizaciones. Título de juego JET//Portada no se traduce; front page aquí es objeto editorial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-pieces [SRC-PO02, RSP-PORTADA-01, RSP-PORTADA-02] es-AR: «{n} piezas en la mesa» | en: «{n} pieces on the table» | contexto: Penalización real = celdas vacías×2 en regla revisada, no n piezas restantes. Escape/Tab cancelan sólo previsualización, no pieza original/historial. Nueva partida común no implica contenido aleatorio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-one-piece [SRC-PO02, RSP-PORTADA-01, RSP-PORTADA-02] es-AR: «1 pieza en la mesa» | en: «1 piece on the table» | contexto: Penalización real = celdas vacías×2 en regla revisada, no n piezas restantes. Escape/Tab cancelan sólo previsualización, no pieza original/historial. Nueva partida común no implica contenido aleatorio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-empty [SRC-PO02, RSP-PORTADA-01, RSP-PORTADA-02] es-AR: «{n} celdas vacías · −{penalización}» | en: «{n} empty cells · −{penalización}» | contexto: Penalización real = celdas vacías×2 en regla revisada, no n piezas restantes. Escape/Tab cancelan sólo previsualización, no pieza original/historial. Nueva partida común no implica contenido aleatorio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'penalización', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-one-empty [SRC-PO02, RSP-PORTADA-01, RSP-PORTADA-02] es-AR: «1 celda vacía · −{penalización}» | en: «1 empty cell · −{penalización}» | contexto: Penalización real = celdas vacías×2 en regla revisada, no n piezas restantes. Escape/Tab cancelan sólo previsualización, no pieza original/historial. Nueva partida común no implica contenido aleatorio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'penalización', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-active-rules [SRC-PO02, RSP-PORTADA-01, RSP-PORTADA-02] es-AR: «Reglas activas ({n})» | en: «Active rules ({n})» | contexto: Penalización real = celdas vacías×2 en regla revisada, no n piezas restantes. Escape/Tab cancelan sólo previsualización, no pieza original/historial. Nueva partida común no implica contenido aleatorio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-rules-theme [SRC-PO02, RSP-PORTADA-01, RSP-PORTADA-02] es-AR: «Reglas y tema» | en: «Rules and theme» | contexto: Penalización real = celdas vacías×2 en regla revisada, no n piezas restantes. Escape/Tab cancelan sólo previsualización, no pieza original/historial. Nueva partida común no implica contenido aleatorio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-placement-cancelled [SRC-PO02, RSP-PORTADA-01, RSP-PORTADA-02] es-AR: «Colocación cancelada» | en: «Placement cancelled» | contexto: Penalización real = celdas vacías×2 en regla revisada, no n piezas restantes. Escape/Tab cancelan sólo previsualización, no pieza original/historial. Nueva partida común no implica contenido aleatorio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-expanded-news [PLAY-PORTADA-01] es-AR: «Vista ampliada de la noticia» | en: «Expanded news view» | contexto: Vista ampliada de lectura; no cambia tamaño/forma de pieza, geometría del rompecabezas ni estado de colocación. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-close-expanded [PLAY-PORTADA-01] es-AR: «Cerrar vista ampliada» | en: «Close expanded view» | contexto: Vista ampliada de lectura; no cambia tamaño/forma de pieza, geometría del rompecabezas ni estado de colocación. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-piece-size [PLAY-PORTADA-02] es-AR: «{tipo}, {sección}. {ancho} por {alto} celdas.» | en: «{tipo}, {sección}. {ancho} by {alto} cells.» | contexto: Dimensiones/coordenadas del estado real y orientación actual. Tipo/sección localizados sin alterar reglas. Selección/choque/límites se comunican por estado; devolver conserva la pieza, no la elimina. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'tipo', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'sección', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'ancho', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'alto', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-piece-position [PLAY-PORTADA-02] es-AR: «Fila {fila}, columna {columna}.» | en: «Row {fila}, column {columna}.» | contexto: Dimensiones/coordenadas del estado real y orientación actual. Tipo/sección localizados sin alterar reglas. Selección/choque/límites se comunican por estado; devolver conserva la pieza, no la elimina. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'fila', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'columna', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-does-not-fit [PLAY-PORTADA-02] es-AR: «No entra en esta posición.» | en: «It does not fit in this position.» | contexto: Dimensiones/coordenadas del estado real y orientación actual. Tipo/sección localizados sin alterar reglas. Selección/choque/límites se comunican por estado; devolver conserva la pieza, no la elimina. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-return-table [PLAY-PORTADA-02] es-AR: «Devolver a la mesa» | en: «Return to the table» | contexto: Dimensiones/coordenadas del estado real y orientación actual. Tipo/sección localizados sin alterar reglas. Selección/choque/límites se comunican por estado; devolver conserva la pieza, no la elimina. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-estimated-circulation [PLAY-PORTADA-03] es-AR: «Tirada estimada: {cantidad} mil ejemplares» | en: «Estimated circulation: {cantidad} thousand copies» | contexto: Tirada estimada, meta de partida y referencia del jefe son métricas distintas: no sustituir una por otra. Cada ×2 nombra su causa real; no aplicar multiplicador donde no corresponda. {bonificación} usa valor real no negativo del par Ciencia/Cultura; no confundir con delta total de reemplazo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'cantidad', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-boss-reference [PLAY-PORTADA-03] es-AR: «Referencia del jefe: {cantidad} mil ejemplares» | en: «Boss’s reference: {cantidad} thousand copies» | contexto: Tirada estimada, meta de partida y referencia del jefe son métricas distintas: no sustituir una por otra. Cada ×2 nombra su causa real; no aplicar multiplicador donde no corresponda. {bonificación} usa valor real no negativo del par Ciencia/Cultura; no confundir con delta total de reemplazo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'cantidad', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-masthead-multiplier [PLAY-PORTADA-03] es-AR: «×2 por cabecera» | en: «×2 for the masthead» | contexto: Tirada estimada, meta de partida y referencia del jefe son métricas distintas: no sustituir una por otra. Cada ×2 nombra su causa real; no aplicar multiplicador donde no corresponda. {bonificación} usa valor real no negativo del par Ciencia/Cultura; no confundir con delta total de reemplazo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-related-photo-multiplier [PLAY-PORTADA-03] es-AR: «×2 por foto relacionada» | en: «×2 for a related photo» | contexto: Tirada estimada, meta de partida y referencia del jefe son métricas distintas: no sustituir una por otra. Cada ×2 nombra su causa real; no aplicar multiplicador donde no corresponda. {bonificación} usa valor real no negativo del par Ciencia/Cultura; no confundir con delta total de reemplazo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-science-culture-bonus [PLAY-PORTADA-03] es-AR: «Ciencia + Cultura: +{bonificación}» | en: «Science + Culture: +{bonificación}» | contexto: Tirada estimada, meta de partida y referencia del jefe son métricas distintas: no sustituir una por otra. Cada ×2 nombra su causa real; no aplicar multiplicador donde no corresponda. {bonificación} usa valor real no negativo del par Ciencia/Cultura; no confundir con delta total de reemplazo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'bonificación', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-full-page [PLAY-PORTADA-04] es-AR: «La portada está completa. Imprimí para ver el resultado.» | en: «The front page is complete. Print it to see the result.» | contexto: Actualizar al colocar/retirar/deshacer/rehacer. Rama singular por cada cantidad; cero usa plural. Portada completa no exige usar todas las piezas. Publicar/imprimir es metáfora editorial de evaluación local, no envío externo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-table-and-empty [PLAY-PORTADA-04] es-AR: «Tenés {cantidad} piezas en la mesa y {huecos} celdas vacías.» | en: «You have {cantidad} pieces on the table and {huecos} empty cells.» | contexto: Actualizar al colocar/retirar/deshacer/rehacer. Rama singular por cada cantidad; cero usa plural. Portada completa no exige usar todas las piezas. Publicar/imprimir es metáfora editorial de evaluación local, no envío externo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'cantidad', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'huecos', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-not-all-news [PLAY-PORTADA-04] es-AR: «No hace falta publicar todas las noticias.» | en: «You don’t need to publish every story.» | contexto: Actualizar al colocar/retirar/deshacer/rehacer. Rama singular por cada cantidad; cero usa plural. Portada completa no exige usar todas las piezas. Publicar/imprimir es metáfora editorial de evaluación local, no envío externo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-try-combination [PLAY-PORTADA-04] es-AR: «Podés devolver una pieza a la mesa para probar otra combinación.» | en: «You can return a piece to the table to try another combination.» | contexto: Actualizar al colocar/retirar/deshacer/rehacer. Rama singular por cada cantidad; cero usa plural. Portada completa no exige usar todas las piezas. Publicar/imprimir es metáfora editorial de evaluación local, no envío externo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-one-piece-many-empty [PLAY-PORTADA-04] es-AR: «Tenés 1 pieza en la mesa y {huecos} celdas vacías.» | en: «You have 1 piece on the table and {huecos} empty cells.» | contexto: Actualizar al colocar/retirar/deshacer/rehacer. Rama singular por cada cantidad; cero usa plural. Portada completa no exige usar todas las piezas. Publicar/imprimir es metáfora editorial de evaluación local, no envío externo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'huecos', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-many-pieces-one-empty [PLAY-PORTADA-04] es-AR: «Tenés {cantidad} piezas en la mesa y 1 celda vacía.» | en: «You have {cantidad} pieces on the table and 1 empty cell.» | contexto: Actualizar al colocar/retirar/deshacer/rehacer. Rama singular por cada cantidad; cero usa plural. Portada completa no exige usar todas las piezas. Publicar/imprimir es metáfora editorial de evaluación local, no envío externo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'cantidad', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-one-piece-one-empty [PLAY-PORTADA-04] es-AR: «Tenés 1 pieza en la mesa y 1 celda vacía.» | en: «You have 1 piece on the table and 1 empty cell.» | contexto: Actualizar al colocar/retirar/deshacer/rehacer. Rama singular por cada cantidad; cero usa plural. Portada completa no exige usar todas las piezas. Publicar/imprimir es metáfora editorial de evaluación local, no envío externo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-edition-published [PLAY-PORTADA-05] es-AR: «Edición publicada · {estrellas} de 3 estrellas» | en: «Edition published · {estrellas} of 3 stars» | contexto: {diferencia} sólo si referencia supera resultado; no mostrar faltante negativo. Deltas con signo real. No afirmar que delta_total es sólo delta_base+delta_vecinos: hay que incluir extras, huecos, globales, multiplicadores y redondeos en evaluación completa. No atribuir cambio neto al valor aislado de una noticia; la función de comparación de sustitución es opcional y no existe en bossDiff. Nombres de noticias conservados/localizados según catálogo. Edición publicada describe resultado LOCAL, no acción de compartir. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'estrellas', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-reference-shortfall [PLAY-PORTADA-05] es-AR: «Te faltaron {diferencia} mil ejemplares para igualar la referencia.» | en: «You needed {diferencia} thousand more copies to match the reference.» | contexto: {diferencia} sólo si referencia supera resultado; no mostrar faltante negativo. Deltas con signo real. No afirmar que delta_total es sólo delta_base+delta_vecinos: hay que incluir extras, huecos, globales, multiplicadores y redondeos en evaluación completa. No atribuir cambio neto al valor aislado de una noticia; la función de comparación de sustitución es opcional y no existe en bossDiff. Nombres de noticias conservados/localizados según catálogo. Edición publicada describe resultado LOCAL, no acción de compartir. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'diferencia', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-swap-net [PLAY-PORTADA-05] es-AR: «Cambiar {pieza_actual} por {pieza_propuesta}: {delta_total} mil ejemplares en total. Cambio previo a efectos globales: piezas {delta_base}, vecinos {delta_vecinos}. El total también incluye huecos, reglas globales y redondeos.» | en: «Replace {pieza_actual} with {pieza_propuesta}: {delta_total} thousand copies in total. Change before global effects: pieces {delta_base}, neighbors {delta_vecinos}. The total also includes empty cells, global rules and rounding.» | contexto: {diferencia} sólo si referencia supera resultado; no mostrar faltante negativo. Deltas con signo real. No afirmar que delta_total es sólo delta_base+delta_vecinos: hay que incluir extras, huecos, globales, multiplicadores y redondeos en evaluación completa. No atribuir cambio neto al valor aislado de una noticia; la función de comparación de sustitución es opcional y no existe en bossDiff. Nombres de noticias conservados/localizados según catálogo. Edición publicada describe resultado LOCAL, no acción de compartir. Corrección de fuente: bossDiff compara la contribución de la misma pieza, no efecto neto de sustituir. En la prueba, +3 era contribución SOC ausente→presente; DEP retirada también aportaba 3. Piezas 19→19 y vecinos −3→+2 explicaron total 16→21. No cambiar el +3 existente a +5 ni prometer mejora neta a partir de best.v. Los números son evidencia, no UI fija. | condición: FUNCIÓN CONTRAFACTUAL OPCIONAL, PENDIENTE DE DECISIÓN E IMPLEMENTACIÓN. La UI actual bossDiff/best.v NO calcula esta sustitución. No conectar la cadena a ese valor. Sólo mostrar tras implementar evaluación completa antes/después de la sustitución propuesta, con mismas reglas y sin mutar la edición oficial. | params: [{'name': 'pieza_actual', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'pieza_propuesta', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'delta_total', 'binding': 'score completo después.total − score completo antes.total. Incluye huecos, globales, multiplicadores, clamp y redondeos. Función OPCIONAL no existente en bossDiff; prohibido usar best.v.'}, {'name': 'delta_base', 'binding': '(después.sumPieces + después.extras) − (antes.sumPieces + antes.extras): contribuciones por piezas, incluidos extras y multiplicadores/redondeos por pieza. No es base pura; aún no incluye efectos globales.'}, {'name': 'delta_vecinos', 'binding': 'después.sumPairs − antes.sumPairs: diferencia SIGNADA de vecindades antes de efectos globales. No basta sumarla a delta_base para obtener delta_total en todos los modos.'}] | citas actuales: []
- COPY-portada-breakdown [PLAY-PORTADA-06] es-AR: «Ver desglose» | en: «View breakdown» | contexto: Resultados con desglose accesible. Repetir esta práctica sólo si el MODO lo permite y existe/si se implementa un intento separado sin alterar resultado guardado. Volver a editar sólo si el MODO y sus reglas vigentes lo permiten; no volver retroactivamente editable un resultado definitivo, reabrir/reimprimir un diario cerrado ni modificar silenciosamente sus reglas. Ocultar ambas acciones si no están permitidas o implementadas. Siguiente edición no equivale a Nueva partida. Salida al menú usa common-menu. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-compare [PLAY-PORTADA-06] es-AR: «Comparar portadas» | en: «Compare front pages» | contexto: Resultados con desglose accesible. Repetir esta práctica sólo si el MODO lo permite y existe/si se implementa un intento separado sin alterar resultado guardado. Volver a editar sólo si el MODO y sus reglas vigentes lo permiten; no volver retroactivamente editable un resultado definitivo, reabrir/reimprimir un diario cerrado ni modificar silenciosamente sus reglas. Ocultar ambas acciones si no están permitidas o implementadas. Siguiente edición no equivale a Nueva partida. Salida al menú usa common-menu. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-replay-practice [PLAY-PORTADA-06] es-AR: «Repetir esta práctica» | en: «Replay this practice» | contexto: Resultados con desglose accesible. Repetir esta práctica sólo si el MODO lo permite y existe/si se implementa un intento separado sin alterar resultado guardado. Volver a editar sólo si el MODO y sus reglas vigentes lo permiten; no volver retroactivamente editable un resultado definitivo, reabrir/reimprimir un diario cerrado ni modificar silenciosamente sus reglas. Ocultar ambas acciones si no están permitidas o implementadas. Siguiente edición no equivale a Nueva partida. Salida al menú usa common-menu. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-next-edition [PLAY-PORTADA-06] es-AR: «Siguiente edición» | en: «Next edition» | contexto: Resultados con desglose accesible. Repetir esta práctica sólo si el MODO lo permite y existe/si se implementa un intento separado sin alterar resultado guardado. Volver a editar sólo si el MODO y sus reglas vigentes lo permiten; no volver retroactivamente editable un resultado definitivo, reabrir/reimprimir un diario cerrado ni modificar silenciosamente sus reglas. Ocultar ambas acciones si no están permitidas o implementadas. Siguiente edición no equivale a Nueva partida. Salida al menú usa common-menu. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-back-editing [PLAY-PORTADA-06] es-AR: «Volver a editar» | en: «Back to editing» | contexto: Resultados con desglose accesible. Repetir esta práctica sólo si el MODO lo permite y existe/si se implementa un intento separado sin alterar resultado guardado. Volver a editar sólo si el MODO y sus reglas vigentes lo permiten; no volver retroactivamente editable un resultado definitivo, reabrir/reimprimir un diario cerrado ni modificar silenciosamente sus reglas. Ocultar ambas acciones si no están permitidas o implementadas. Siguiente edición no equivale a Nueva partida. Salida al menú usa common-menu. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-intro-continue [PLAY-PORTADA-07] es-AR: «Continuar» | en: «Continue» | contexto: Continuar avanza introducción, NO reanuda pausa ni recupera guardado: no aplicar regla de Reanudar partida fuera de pausa. Sólo lámina activa expuesta; paso/total reales. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-help-step [PLAY-PORTADA-07] es-AR: «Paso {actual} de {total}» | en: «Step {actual} of {total}» | contexto: Continuar avanza introducción, NO reanuda pausa ni recupera guardado: no aplicar regla de Reanudar partida fuera de pausa. Sólo lámina activa expuesta; paso/total reales. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'actual', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'total', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-portada-help-prev [PLAY-PORTADA-07] es-AR: «Paso anterior» | en: «Previous step» | contexto: Continuar avanza introducción, NO reanuda pausa ni recupera guardado: no aplicar regla de Reanudar partida fuera de pausa. Sólo lámina activa expuesta; paso/total reales. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-help-next [PLAY-PORTADA-07] es-AR: «Paso siguiente» | en: «Next step» | contexto: Continuar avanza introducción, NO reanuda pausa ni recupera guardado: no aplicar regla de Reanudar partida fuera de pausa. Sólo lámina activa expuesta; paso/total reales. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-close-help [PLAY-PORTADA-07] es-AR: «Cerrar ayuda» | en: «Close help» | contexto: Continuar avanza introducción, NO reanuda pausa ni recupera guardado: no aplicar regla de Reanudar partida fuera de pausa. Sólo lámina activa expuesta; paso/total reales. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-portada-boss-piece-absolute [PLAY-PORTADA-05] es-AR: «Aporte de esta pieza en la portada del jefe: {aporte}» | en: «This piece’s contribution to the boss’s front page: {aporte}» | contexto: bossDiff compara la MISMA pieza en ambas portadas: bo.pieces[ix].total − me.pieces[ix].total, con 0 si falta. Aporte absoluto sólo si la pieza falta en mi portada y se lee el aporte real de jefe; diferencia si ambas contienen la pieza. Ni un aporte ni esa diferencia equivalen a mejora neta de reemplazar otra pieza. Conservar unidad de tirada y signos en la representación correspondiente. | condición: Sólo cuando la pieza está ausente de mi portada y aporte=bo.pieces[ix].total (absoluto real). No rotular como absoluto un delta de pieza presente en ambas. | params: [{'name': 'aporte', 'binding': 'aporte = bo.pieces[ix].total para la pieza identificada; condicionada a ausencia en mi portada. Mismo nombre {aporte} en ES/EN.'}] | citas actuales: []
- COPY-portada-same-piece-delta [PLAY-PORTADA-05] es-AR: «Diferencia de aporte de esta pieza: {delta}» | en: «Difference in this piece’s contribution: {delta}» | contexto: bossDiff compara la MISMA pieza en ambas portadas: bo.pieces[ix].total − me.pieces[ix].total, con 0 si falta. Aporte absoluto sólo si la pieza falta en mi portada y se lee el aporte real de jefe; diferencia si ambas contienen la pieza. Ni un aporte ni esa diferencia equivalen a mejora neta de reemplazar otra pieza. Conservar unidad de tirada y signos en la representación correspondiente. | condición: Comparación de contribución de la MISMA pieza entre portadas. Formatear signo real; no presentar como ganancia por sustituir otra noticia. | params: [{'name': 'delta', 'binding': 'delta = bo.pieces[ix].total − me.pieces[ix].total, usando 0 en lado ausente según bossDiff. No es delta del score completo.'}] | citas actuales: []
- COPY-portada-stamp-count [VIS-PORTADA-04] es-AR: «Sellos: {cantidad}» | en: «Stamps: {cantidad}» | contexto: Resumen compacto de sellos ya presentes en esa pieza; detalle conserva desglose íntegro. Cantidad de sellos no es factor multiplicador, puntaje ni número de piezas. | condición: Sólo cuando hay sellos reales y se usa el resumen compacto propuesto. No inventar un sello para llenar la franja. Mantener titular y detalle accesibles. | params: [{'name': 'cantidad', 'binding': 'Número de sellos efectivamente concedidos a esa pieza por el motor, misma colección que muestra el detalle; no producto de sus multiplicadores ni cantidad observada en una captura.'}] | citas actuales: []
