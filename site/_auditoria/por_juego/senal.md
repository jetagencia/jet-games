# senal: 13 registros del catálogo, 30 copys

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

## [PLAY-SENAL-01] P2 · active · Prueba interactiva y propuestas
**Acercar guía, bandeja y acción**
- Actual: En escritorio la guía queda abajo a la izquierda, paleta al extremo derecho y Enviar/Formular abajo al centro; la sonda decorativa ocupa el centro entre evidencia y piezas.
- Instrucción: Reorganizar la pantalla en tres zonas jerarquizadas: evidencias, área de experimento y paleta. Situar la guía contextual sobre la bandeja o junto al control indicado, no en la esquina opuesta. Reducir la sonda decorativa sin ocultar respuestas y reservar espacio para las tarjetas de muestras. Mostrar la frase sobre cambiar una sola característica sólo cuando describa el cambio real entre ambas muestras.
- Copy: Armá una muestra
Cambiaste una sola característica. Compará la respuesta con la muestra anterior.
- Aceptación: A 1180×757, la instrucción y el control al que se refiere se ven juntos, sin recorrer tres extremos de la pantalla. La evidencia previa permanece visible.
- Referencias: evidence/senal-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:04:00Z/2026-10-22T15:12:00Z

## [PLAY-SENAL-02] P2 · active · Prueba interactiva y propuestas
**Pestañas de reglas siempre ubicables**
- Actual: La fila de categorías desborda horizontalmente. Después de elegir Posición, la pestaña activa quedó fuera del área visible, mientras se veían Cantidad/Comparación/Vecindad/Orden/Igualdad/Simetría. Las categorías bloqueadas siguen apareciendo como pestañas seleccionables en el árbol de accesibilidad.
- Instrucción: Desplazar lo mínimo necesario para mostrar la pestaña activa, mediante una alineación nearest, no llevando la fila a un extremo. Añadir flechas o una indicación de desborde, o distribuir las categorías en dos filas. Distinguir las bloqueadas con aria-disabled y explicar cómo se desbloquean, sin volverlas ilegibles por baja opacidad.
- Copy: Categorías de reglas
{categoría} bloqueada · completá {requisito} para desbloquearla.
- Aceptación: La categoría activa se ve completa después de seleccionarla, navegar con teclado o cambiar el ancho. Las bloqueadas no parecen disponibles ni obligan a deducir la condición a partir del candado.
- Referencias: evidence/senal-pass2-tabs.jpg
- Notas: Ventana de observación: 2026-10-22T15:04:00Z/2026-10-22T15:12:00Z

## [PLAY-SENAL-03] P2 · active · Prueba interactiva y propuestas
**Distinguir ejemplos iniciales de muestras enviadas**
- Actual: El contador MUESTRAS muestra 2, mientras ACEPTADAS+RECHAZADAS suma 4. Las dos muestras de regalo sólo se identifican como Regalo en el árbol de accesibilidad; visualmente son #1 y #2, como el resto.
- Instrucción: Renombrar el contador como «Pruebas enviadas» y añadir la etiqueta «Ejemplo inicial» a las muestras de regalo. Mantener una numeración única que permita localizar las referencias de contradicción, con una leyenda clara de qué incluye cada contador y qué excluye.
- Copy: Pruebas enviadas: {n}
Ejemplo inicial
Muestras analizadas: {n}
- Aceptación: Los totales no parecen contradictorios. Una referencia como #2 puede localizarse aunque corresponda a un ejemplo inicial.
- Referencias: evidence/senal-pass1-rule-builder.jpg
evidence/senal-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:04:00Z/2026-10-22T15:12:00Z

## [PLAY-SENAL-04] P2 · active · Prueba interactiva y propuestas
**Diferenciar pista de selección y foco**
- Actual: En tutorial una pieza/frase sugerida tiene un halo turquesa fuerte antes de estar seleccionada; el mismo color se usa para estado seleccionado y foco. En el constructor, cian parecía destacado mientras Color cualquiera seguía seleccionado.
- Instrucción: Reservar el borde sólido y la marca de confirmación para la selección, un contorno separado para el foco y una flecha o etiqueta de guía para el siguiente objetivo. No depender del brillo para explicar estos estados.
- Copy: Elegí esta opción
Seleccionado
Siguiente paso
- Aceptación: Se distingue qué valor integra la regla actual y cuál es sólo una sugerencia. La navegación por teclado no pierde el foco entre los distintos resaltados.
- Referencias: evidence/senal-pass1-rule-builder.jpg
- Notas: Ventana de observación: 2026-10-22T15:04:00Z/2026-10-22T15:12:00Z

## [PLAY-SENAL-05] P2 · active · Prueba interactiva y propuestas
**Aclarar edición y atajos sin esconderlos en Ajustes**
- Actual: Atajos se describen sólo al final de Ajustes como Q-Y, A-H y Z-N; las teclas aparecen en botones al pasar por ellos. La bandeja no explica persistentemente que tocar una pieza la reemplaza.
- Instrucción: Añadir una ayuda compacta desplegable junto a la bandeja. Describir cómo agregar, reemplazar y quitar piezas; asignar nombres accesibles de acción a cada ranura. Ofrecer una guía de teclado opcional con la tecla sobre cada pieza, sin cambiar el orden ni los atributos de las piezas. Publicar los atajos propuestos de Enter, L y Esc sólo después de verificar sus manejadores reales o implementar y probar manejadores seguros que no intercepten campos ni controles.
- Copy: Tocá una casilla ocupada para reemplazar su pieza.
Mostrar atajos
Enviar muestra · Enter
Formular regla · L
Pausar · Esc
- Aceptación: Se puede construir, reemplazar y vaciar una muestra sin abrir Ajustes. Los atajos documentados coinciden con los manejadores reales, funcionan una sola vez por activación y respetan los controles enfocados.
- Referencias: evidence/senal-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:04:00Z/2026-10-22T15:12:00Z

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

## [SRC-SE01] P2 · active_source_finding · Texto, estados y flujo
**Muestra frente a hipótesis**
- Actual: Enviar; Formular regla; Transmitir; par {par}
- Instrucción: Diferenciar el envío de una muestra de la comprobación de la hipótesis completa. Mostrar el costo real antes de comprobar una regla y definir pulso junto al HUD o en ayuda. Mantener Sonda y muestra como términos consistentes.
- Copy: Enviar muestra; Formular regla; Comprobar regla; Objetivo: {par} pulsos
- Aceptación: Después del primer tutorial se distingue muestra de regla. Las acciones anuncian el costo exacto sin cambiar la puntuación. Abrir y cerrar el formulario de regla conserva la muestra.
- Referencias: https://jetgames.fun/senal/src/i18n.js?v=4 — es.enviar/transmitir/pulsos/parDe; index#btnEnviar/#btnFormular
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [SRC-SE02] P2 · active_source_finding · Texto, estados y flujo
**Rendirse y nueva práctica**
- Actual: ¿Ver la regla?; En la señal del día, esto corta tu racha.; Ver la regla; Otra vez
- Instrucción: En resultados distinguir Repetir esta señal de Nueva práctica según el handler real. Mantener el aviso antes de revelar la solución, nunca después. No atribuir a una práctica el efecto sobre racha que sólo corresponde al diario.
- Copy: ¿Ver la solución y terminar el intento? / Se revelará la regla y este intento quedará sin resolver. En el reto diario se cortará tu racha. / Ver solución / Seguir investigando
- Aceptación: Cancelar conserva señal y racha. Confirmar revela la regla una sola vez. El CTA de práctica declara si genera una regla nueva.
- Referencias: https://jetgames.fun/senal/src/i18n.js?v=4 — es.rendirseQ/rendirseD/verRegla/otraVez
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-SENAL-01] P2 · active_proposal · Dirección visual interna
**Diseñar una versión pequeña fiel de los 18 símbolos**
- Actual: Piezas.defs() usa lienzo100×100, piezas pequeñas scale(.58) con base y 92; cian tiene rayas 9 px de paso/3.4 px de ancho, ámbar puntos r2.1/paso10; brillos blancos alpha .55. El registro usa --mini24 px.
- Instrucción: Añadir una variante SVG de detalle para tamaños renderizados<=28 px: conservar idéntica silueta y escala .58; eliminar el brillo ovalado blanco y reducir a un solo contorno, pero mantener liso/rayado/punteado. En esa variante usar patrón proporcional que produzca al menos 3 rayas o 3 puntos visibles dentro de la pieza pequeña sin cambiar la relación de tamaños. No agrandar sólo los símbolos pequeños para llenar el contenedor. Reutilizar los mismos 18 IDs lógicos y nombres accesibles.
- Copy: 
- Aceptación: Mostrar las 18 piezas juntas en paleta y registro a 320 px: grande/pequeño conserva su proporción, cian/ámbar se distinguen sin color y el mismo ID se reconoce en ambos tamaños. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/senal__senal__src__piezas.js
lines: 6–35
file: ui_audit/source_review/current_1410/senal__senal__src__style.css
lines: 7,118
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No permutar color, forma, tamaño ni los patrones que redundan el color. Las letras opcionales V/C/A siguen siendo una ayuda, no una cuarta dimensión de la regla.

## [VIS-SENAL-02] P2 · active_proposal · Dirección visual interna
**Registro de pruebas como evidencia ordenada, no tarjetas equivalentes**
- Actual: Las columnas aceptadas/rechazadas usan bordes cian/rojo; títulos11 px, número de prueba10 px con min-width 22, fila de símbolos gap 2 y marca final18 px. Nuevo contraejemplo usa halo blanco hasta 3s.
- Instrucción: Alinear todas las tarjetas en tres columnas estables: índice de prueba, secuencia, veredicto. Índice en 11 px tabular; símbolos sobre una línea base común; ✓/✕ en una caja 20 px siempre al extremo. Mantener encabezados Aceptadas/Rechazadas y su color. Para prueba recién añadida, una línea lateral de 2 px y fondo blanco al 6% durante 700 ms; para contraejemplo, usar marco discontinuo más rótulo existente, sin un resplandor que afecte varias tarjetas vecinas.
- Copy: 
- Aceptación: Comparar dos secuencias de longitudes diferentes sin que el índice o veredicto salte de columna. La prueba nueva se localiza y después queda visualmente igual de legible que las anteriores. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/senal__senal__src__style.css
lines: 102–130
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No ordenar por resultado dentro de una columna ni ocultar pruebas previas; preservar orden temporal, secuencias y significado de regalo/contraejemplo.

## [VIS-SENAL-03] P2 · active_proposal · Dirección visual interna
**Distinguir ranura seleccionada, destino de arrastre y hueco vacío**
- Actual: .ranura vacía es dashed1.5 px; llena pasa a solid; .sel usa borde cian con dos halos y fondo .08; .destino también borde/fondo cian. .idx es9 px.
- Instrucción: Conservar dashed para vacío. Seleccionada: doble contorno cian de 2 px, sin halo exterior de 18 px, con pequeña pestaña inferior. Destino válido mientras arrastras: esquinas cian de 3 px y fondo .12, sin la pestaña de selección. Ranura llena no seleccionada: borde neutro. Número de posición 11 px en la esquina superior, en una cápsula de fondo oscuro que no invada la figura; ocultar el número sólo si ya se ofrece de forma equivalente fuera de la pieza, no por falta de espacio.
- Copy: 
- Aceptación: Arrastrar la misma pieza entre ranuras muestra un único origen y destino, incluso con pieza cian. Cancelar vuelve al estado previo; una ranura seleccionada nunca parece ya validada por la sonda. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/senal__senal__src__style.css
lines: 135–145,151–155
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No usar rojo o cian de una pieza para validar su hipótesis: estos estados indican interacción, no aceptación por la sonda. No revelar la regla oculta al arrastrar.

## [VIS-SENAL-04] P2 · active_proposal · Dirección visual interna
**Unificar el movimiento de confirmación y evitar destellos repetidos**
- Actual: Existen entra.32s, parpadea.9s con dos destellos, nuevoContra3s, ola.6s, encaja.16s y tiembla.12s repetida 2 veces. body.reducido ya limita las animaciones.
- Instrucción: Establecer tres tiempos: colocación 160 ms con escala máxima 1.03; inserción de evidencia 220 ms con desplazamiento máximo 6 px; confirmación/error 450 ms mediante cambio de borde. Sustituir parpadea y ola por una sola transición de fondo que regresa suavemente, sin alternar brillo varias veces. Mantener el contraejemplo resaltado de forma estática hasta la siguiente acción o cierre de su explicación, en lugar de depender de 3s de halo. Respetar body.reducido con estados instantáneos y sin desplazamiento.
- Copy: 
- Aceptación: Enviar dos hipótesis seguidas no acumula animaciones ni oculta la segunda respuesta. Con movimiento reducido se ve exactamente el mismo resultado y contraejemplo, sin destellos. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/senal__senal__src__style.css
lines: 123–130,141–144,415–417
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No retrasar el veredicto, consumo de intentos ni disponibilidad de Enviar. Los tiempos son de presentación, no del motor verificador.

# Copys ES/EN aplicables
- COPY-common-cancel [SRC-G04, SRC-R02, SRC-AN01, SRC-E02, SRC-BE01, SRC-BE02, RSP-MODALS-01, RSP-BALIZAS-02, PLAY-BALIZAS-05] es-AR: «Cancelar» | en: «Cancel» | contexto: Cancelación real: no cobrar, borrar, publicar, fusionar ni sustituir estado. Foco inicial en confirmaciones destructivas. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-send-sample [SRC-SE01] es-AR: «Enviar muestra» | en: «Send sample» | contexto: Enviar muestra ≠ comprobar hipótesis completa. {c} coste real vigente antes de actuar; no deducirlo de par ni inventarlo. Sonda/muestra deben conservar nombres de dominio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-form-rule [SRC-SE01] es-AR: «Formular regla» | en: «Formulate rule» | contexto: Enviar muestra ≠ comprobar hipótesis completa. {c} coste real vigente antes de actuar; no deducirlo de par ni inventarlo. Sonda/muestra deben conservar nombres de dominio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-check-rule [SRC-SE01] es-AR: «Comprobar regla» | en: «Check rule» | contexto: Enviar muestra ≠ comprobar hipótesis completa. {c} coste real vigente antes de actuar; no deducirlo de par ni inventarlo. Sonda/muestra deben conservar nombres de dominio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-goal [SRC-SE01] es-AR: «Objetivo: {par} pulsos» | en: «Target: {par} pulses» | contexto: Enviar muestra ≠ comprobar hipótesis completa. {c} coste real vigente antes de actuar; no deducirlo de par ni inventarlo. Sonda/muestra deben conservar nombres de dominio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'par', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-senal-check-cost [SRC-SE01] es-AR: «Comprobar regla · {c} pulsos» | en: «Check rule · {c} pulses» | contexto: Enviar muestra ≠ comprobar hipótesis completa. {c} coste real vigente antes de actuar; no deducirlo de par ni inventarlo. Sonda/muestra deben conservar nombres de dominio. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'c', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-senal-reveal-title [SRC-SE02] es-AR: «¿Ver la solución y terminar el intento?» | en: «View the solution and end this attempt?» | contexto: Aviso de racha sólo en diario y si aplica. Repetir conserva señal; Nueva práctica según comportamiento existente, no generar azar por etiqueta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-reveal-body [SRC-SE02] es-AR: «Se revelará la regla y este intento quedará sin resolver.» | en: «The rule will be revealed and this attempt will remain unsolved.» | contexto: Aviso de racha sólo en diario y si aplica. Repetir conserva señal; Nueva práctica según comportamiento existente, no generar azar por etiqueta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-daily-streak [SRC-SE02] es-AR: «En el reto diario se cortará tu racha.» | en: «In the daily challenge, your streak will end.» | contexto: Aviso de racha sólo en diario y si aplica. Repetir conserva señal; Nueva práctica según comportamiento existente, no generar azar por etiqueta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-reveal [SRC-SE02] es-AR: «Ver solución» | en: «View solution» | contexto: Aviso de racha sólo en diario y si aplica. Repetir conserva señal; Nueva práctica según comportamiento existente, no generar azar por etiqueta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-keep-investigating [SRC-SE02] es-AR: «Seguir investigando» | en: «Keep investigating» | contexto: Aviso de racha sólo en diario y si aplica. Repetir conserva señal; Nueva práctica según comportamiento existente, no generar azar por etiqueta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-replay [SRC-SE02] es-AR: «Repetir esta señal» | en: «Replay this signal» | contexto: Aviso de racha sólo en diario y si aplica. Repetir conserva señal; Nueva práctica según comportamiento existente, no generar azar por etiqueta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-new-practice [SRC-SE02] es-AR: «Nueva práctica» | en: «New practice» | contexto: Aviso de racha sólo en diario y si aplica. Repetir conserva señal; Nueva práctica según comportamiento existente, no generar azar por etiqueta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-build-sample [PLAY-SENAL-01, PLAY-SENAL-02] es-AR: «Armá una muestra» | en: «Build a sample» | contexto: Comparación sólo si cambia exactamente una característica. Categoría/requisito desde estado real; no inventar desbloqueos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-compare-sample [PLAY-SENAL-01, PLAY-SENAL-02] es-AR: «Cambiaste una sola característica. Compará la respuesta con la muestra anterior.» | en: «You changed just one feature. Compare the response with the previous sample.» | contexto: Comparación sólo si cambia exactamente una característica. Categoría/requisito desde estado real; no inventar desbloqueos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-rule-categories [PLAY-SENAL-01, PLAY-SENAL-02] es-AR: «Categorías de reglas» | en: «Rule categories» | contexto: Comparación sólo si cambia exactamente una característica. Categoría/requisito desde estado real; no inventar desbloqueos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-locked-category [PLAY-SENAL-01, PLAY-SENAL-02] es-AR: «{categoría} bloqueada · completá {requisito} para desbloquearla.» | en: «{categoría} locked · complete {requisito} to unlock it.» | contexto: Comparación sólo si cambia exactamente una característica. Categoría/requisito desde estado real; no inventar desbloqueos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'categoría', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'requisito', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-senal-tests-sent [PLAY-SENAL-03, PLAY-SENAL-04, PLAY-SENAL-05] es-AR: «Pruebas enviadas: {n}» | en: «Tests submitted: {n}» | contexto: No contar regalos como pruebas enviadas; numeración única se conserva. Guía≠selección≠foco. Atajos sólo si handlers vigentes comprobados y no capturan campos/controles. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-senal-initial-example [PLAY-SENAL-03, PLAY-SENAL-04, PLAY-SENAL-05] es-AR: «Ejemplo inicial» | en: «Initial example» | contexto: No contar regalos como pruebas enviadas; numeración única se conserva. Guía≠selección≠foco. Atajos sólo si handlers vigentes comprobados y no capturan campos/controles. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-samples-analyzed [PLAY-SENAL-03, PLAY-SENAL-04, PLAY-SENAL-05] es-AR: «Muestras analizadas: {n}» | en: «Samples analyzed: {n}» | contexto: No contar regalos como pruebas enviadas; numeración única se conserva. Guía≠selección≠foco. Atajos sólo si handlers vigentes comprobados y no capturan campos/controles. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-senal-choose-suggested [PLAY-SENAL-03, PLAY-SENAL-04, PLAY-SENAL-05] es-AR: «Elegí esta opción» | en: «Choose this option» | contexto: No contar regalos como pruebas enviadas; numeración única se conserva. Guía≠selección≠foco. Atajos sólo si handlers vigentes comprobados y no capturan campos/controles. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-selected [PLAY-SENAL-03, PLAY-SENAL-04, PLAY-SENAL-05] es-AR: «Seleccionado» | en: «Selected» | contexto: No contar regalos como pruebas enviadas; numeración única se conserva. Guía≠selección≠foco. Atajos sólo si handlers vigentes comprobados y no capturan campos/controles. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-next-step [PLAY-SENAL-03, PLAY-SENAL-04, PLAY-SENAL-05] es-AR: «Siguiente paso» | en: «Next step» | contexto: No contar regalos como pruebas enviadas; numeración única se conserva. Guía≠selección≠foco. Atajos sólo si handlers vigentes comprobados y no capturan campos/controles. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-replace-slot [PLAY-SENAL-03, PLAY-SENAL-04, PLAY-SENAL-05] es-AR: «Tocá una casilla ocupada para reemplazar su pieza.» | en: «Select an occupied slot to replace its piece.» | contexto: No contar regalos como pruebas enviadas; numeración única se conserva. Guía≠selección≠foco. Atajos sólo si handlers vigentes comprobados y no capturan campos/controles. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-show-shortcuts [PLAY-SENAL-03, PLAY-SENAL-04, PLAY-SENAL-05] es-AR: «Mostrar atajos» | en: «Show keyboard shortcuts» | contexto: No contar regalos como pruebas enviadas; numeración única se conserva. Guía≠selección≠foco. Atajos sólo si handlers vigentes comprobados y no capturan campos/controles. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-send-shortcut [PLAY-SENAL-03, PLAY-SENAL-04, PLAY-SENAL-05] es-AR: «Enviar muestra · Enter» | en: «Send sample · Enter» | contexto: No contar regalos como pruebas enviadas; numeración única se conserva. Guía≠selección≠foco. Atajos sólo si handlers vigentes comprobados y no capturan campos/controles. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-rule-shortcut [PLAY-SENAL-03, PLAY-SENAL-04, PLAY-SENAL-05] es-AR: «Formular regla · L» | en: «Formulate rule · L» | contexto: No contar regalos como pruebas enviadas; numeración única se conserva. Guía≠selección≠foco. Atajos sólo si handlers vigentes comprobados y no capturan campos/controles. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-pause-shortcut [PLAY-SENAL-03, PLAY-SENAL-04, PLAY-SENAL-05] es-AR: «Pausar · Esc» | en: «Pause · Esc» | contexto: No contar regalos como pruebas enviadas; numeración única se conserva. Guía≠selección≠foco. Atajos sólo si handlers vigentes comprobados y no capturan campos/controles. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-pulse-definition [SRC-SE01] es-AR: «Los pulsos indican el costo de tus acciones.» | en: «Pulses measure the cost of your actions.» | contexto: Definición junto al HUD; preservar fórmula vigente y coste de cada acción. No añadir coste fijo sin fuente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-senal-one-check-cost [SRC-SE01] es-AR: «Comprobar regla · 1 pulso» | en: «Check rule · 1 pulse» | contexto: Sólo si el coste real c=1; no imponer ese coste. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
