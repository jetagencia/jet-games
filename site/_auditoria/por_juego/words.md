# words: 16 registros del catálogo, 27 copys

## [RSP-WORDS-01] P1 · active · Responsive y controles
**Activar el teclado virtual con click accesible y conservar teclas físicas**
- Actual: P1 · alta · confirmado por fuente. `current_1410/jetwords_canonical.html:208`: cada `.key` tiene `tabIndex=-1` y sólo pointerdown; 317 intercepta Enter incluso si foco está en botones/enlace del header. El recurso provisional mouseup→blur de la línea 322 no soluciona teclado.
- Instrucción: Usar click como única activación de letra (`press(k)`), con `pointerdown` sólo para feedback visual/desbloqueo de audio. Ofrecer un roving tabindex: primera tecla/última usada con valor 0, resto con valor −1; flechas navegan teclado, Enter/Espacio activa tecla, Tab sale al siguiente grupo; no exigir recorrer 27 letras. Antes del listener físico, devolver si foco está en `button,a,input,select,textarea,[contenteditable]`, salvo si se gestiona explícitamente el roving del teclado. Eliminar mouseup→blur forzado del header.
- Copy: 
- Aceptación: Activar una letra con VoiceOver/TalkBack/click sintetizado ingresa una letra; tap no duplica. Tab→Ayuda→Enter abre Ayuda, no envía palabra; Tab→Volver→Enter navega. Letras físicas siguen escribiendo cuando foco está en tablero.
- Referencias: Archivo: current_1410/jetwords_canonical.html
Líneas: 208
Archivo: current_1410/jetwords_canonical.html
Líneas: 208,317,322
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-WORDS-02] P1 · active · Responsive y controles
**El resultado de las letras no puede existir sólo como color**
- Actual: P1 para lector de pantalla · alta · confirmado por fuente. `current_1410/jetwords_canonical.html:203–204,226`: `absent/present/correct` sólo son clases; los DIVs contienen letra sin resultado. `renderKb()`208 replica estado sólo como clase.
- Instrucción: Añadir a cada celda un nombre tipo «Intento 2, posición 3, A: correcta» / «presente en otra posición» / «sin coincidencia para esta copia»; filas con rol group y nombre, sin volver todo aria-live. Al terminar la animación de evaluación, publicar una única frase en región `role=status` exclusiva del resultado, con las 5 letras y estados. En teclado incluir estado en aria-label. Añadir alternativa visual no cromática (marca✓ para correcta, punto/↔ para presente, raya para una copia sin coincidencia) sin tapar letra; mantener patrones/leyenda consistentes.
- Copy: 
- Aceptación: Sin ver colores, se puede reconstruir resultado completo de una palabra; lector recibe un anuncio final, no cinco anuncios simultáneos ni todos los intentos al repintar. Verificar español/inglés.
- Referencias: Archivo: current_1410/jetwords_canonical.html
Líneas: 203–204,226
Archivo: current_1410/jetwords_canonical.html
Líneas: 203–204,208,226
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-WORDS-03] P1 · active · Responsive y controles
**Modales: fondo inerte, foco devuelto y safe-area**
- Actual: P1 foco / P2 safe-area · alta · confirmado por fuente. `current_1410/jetwords_canonical.html:265–267` sólo muestra/oculta, condiciona foco a pointer:fine y al cerrar hace blur. `#app` nunca inert. `.modal-bg` (línea 66) tiene padding de 16 px e ignora safe-area; `.modal` (línea 67) resta 32 px de 100 dvh pero no contempla los insets.
- Instrucción: Guardar disparador antes de abrir, poner `#app.inert=true`, enfocar el control de cierre/acción sin condicionar al tipo de puntero, mantener Tab dentro de modal y restaurar foco al cerrar. Actualizar `.modal-bg` a padding por cada inset+16 y `.modal{max-height:100%}`; conservar overflow:auto. No quitar los role/aria-modal/aria-labelledby ya presentes.
- Copy: 
- Aceptación: Ayuda, Estadísticas y Ajustes dos aperturas/cierres; Tab nunca llega al header oculto; Escape devuelve foco al botón original; a 768×390 con notch se alcanza cierre y todos los sliders.
- Referencias: Archivo: current_1410/jetwords_canonical.html
Líneas: 265–267
Archivo: current_1410/jetwords_canonical.html
Líneas: 66–67,265–267
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [PLAY-WORDS-01] P2 · active · Prueba interactiva y propuestas
**Comunicar los estados de letras sin depender del color**
- Actual: El árbol de accesibilidad sólo anuncia las letras de filas y teclas, sin informar si están en la posición correcta, en otra posición o ausentes. El color es la única pista visual de estado.
- Instrucción: Añadir un nombre accesible a cada ficha y tecla, publicar el resumen del intento en una región aria-live y ofrecer alto contraste con iconos o patrones no cromáticos. Generar los anuncios únicamente a partir de la evaluación ya revelada. Distinguir el resultado de cada copia de una letra del estado agregado de esa letra en el teclado: una casilla gris puede coexistir con otra copia verde o amarilla y no demuestra ausencia global. Para esa casilla, usar «sin coincidencia para esta copia». Mantener la leyenda y la ayuda de letras repetidas de PLAY-WORDS-03 coherentes con esa distinción, sin consultar la solución oculta ni modificar el algoritmo.
- Copy: {letra}: está en otra posición
{letra}: posición correcta
{letra}: sin coincidencia para esta copia
Intento {n} de 6
- Aceptación: El lector comunica el estado revelado de cada casilla y, por separado, el estado agregado del teclado. En un intento con una copia gris y otra verde o amarilla, no anuncia que esa letra está ausente de toda la palabra. Una simulación de daltonismo conserva las diferencias sin cambiar las reglas ni exponer información todavía oculta.
- Referencias: evidence/words-pass1-gameplay.jpg
evidence/words-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T14:37:00Z/2026-10-22T14:43:00Z

## [PLAY-WORDS-02] P2 · active · Prueba interactiva y propuestas
**Conservar legibilidad de descartadas**
- Actual: Letras descartadas son gris apagado sobre violeta oscuro; teclas parecen deshabilitadas aunque siguen disponibles.
- Instrucción: Aumentar contraste del glifo descartado y añadir marca de estado distinta de disabled. No deshabilitar teclas: se necesitan para completar o editar palabras válidas.
- Copy: Letra descartada
- Aceptación: Texto de todas las teclas legible; se mantiene entrada de letras descartadas.
- Referencias: evidence/words-pass1-gameplay.jpg
evidence/words-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T14:37:00Z/2026-10-22T14:43:00Z

## [PLAY-WORDS-03] P2 · active · Prueba interactiva y propuestas
**Explicar letras repetidas en la ayuda**
- Actual: La ayuda sólo define verde, amarillo y gris. En CARTA, la primera A queda gris y la última A verde; ese caso no se explica.
- Instrucción: Agregar ejemplo corto de letra repetida con cantidad disponible y orden correcto de evaluación.
- Copy: Si repetís una letra, sólo se marcan las veces que aparece en la palabra. Una copia puede quedar gris aunque otra esté verde.
- Aceptación: La ayuda explica el ejemplo de CARTA con una sola A en la solución, sin cambiar la evaluación.
- Referencias: evidence/words-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T14:37:00Z/2026-10-22T14:43:00Z

## [PLAY-WORDS-04] P2 · active · Prueba interactiva y propuestas
**Hacer claros los contadores del resultado**
- Actual: El resultado de práctica muestra JUGADAS1 después de 5 intentos; la distribución de 1 a 6 no tiene encabezado y no se identifica la modalidad a la que corresponden las estadísticas.
- Instrucción: Cambiar «Jugadas» por «Partidas». Titular la distribución e indicar la modalidad, el idioma y el alcance de la racha según el conjunto real de estadísticas. No mezclar métricas diarias sin explicarlo. Generar los nombres de modalidad e idioma desde la selección correspondiente.
- Copy: Partidas
Estadísticas de {modalidad} · {idioma}
Intentos necesarios para ganar
Victorias consecutivas
- Aceptación: Una victoria en 5/6 muestra 1 partida y 5 intentos sin ambigüedad. Verificar la separación real de estadísticas antes de etiquetar su alcance.
- Referencias: evidence/words-pass1-result.jpg
evidence/words-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T14:37:00Z/2026-10-22T14:43:00Z

## [PLAY-WORDS-05] P2 · active · Prueba interactiva y propuestas
**Limpiar mensajes transitorios para accesibilidad**
- Actual: Faltan letras apareció al enviar A y siguió en el árbol de accesibilidad después de enviar ADIOS, NUBES y CARTA, aunque ya no era visible.
- Instrucción: Usar una región de estado con anuncio polite. Actualizarla a la validación vigente o vaciarla al resolver el problema. Incluir la cantidad real de letras faltantes, con singular y plural. No ocultar errores sólo por un temporizador.
- Copy: Faltan {faltantes} letras.
Falta 1 letra.
Escribí una palabra de 5 letras.
- Aceptación: Después de enviar una palabra válida, el árbol de accesibilidad no conserva el error anterior. La validación fallida no consume un intento.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:37:00Z/2026-10-22T14:43:00Z

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

## [RSP-WORDS-04] P2 · active · Responsive y controles
**La cabecera compacta se resuelve en dos filas, no encogiendo las áreas de interacción**
- Actual: P2 · media · riesgo sustentado; requiere medición renderizada. `current_1410/jetwords_canonical.html:30,35,39,98–102`: fila superior combina enlace largo + idioma + 3 iconos en columnas auto/1fr/auto; por debajo de 350 px, los iconos bajan a 38 px, los gaps a 3 px y el texto a 11 px. La suma de min-content de ambos extremos deja poco o ningún espacio a 320; también las áreas de interacción ampliadas por pseudoelementos se tocan con gaps de 3 px.
- Instrucción: A <=419 px, usar header `grid-template-columns:minmax(0,1fr) auto;grid-template-areas:'back tools' 'brand brand' 'modes modes';gap:6px 8px`; en `.tools` dejar sólo Ajustes y Ayuda visibles de 44×44 px con gap de 8 px; mover Idioma y Estadísticas a opciones de Ajustes sin eliminarlas. Mantener el enlace con min-height de 44 px. No resolver el posible overflow bajando tipografía/áreas de interacción a 38 px.
- Copy: 
- Aceptación: Medir los rectángulos reales a 320/360/390: cero intersección entre áreas de interacción; ningún texto cortado; idioma y estadísticas siguen a ≤2 acciones; tablero y teclado caben o existe estrategia de scroll deliberada. Esta reorganización es propuesta, no un desbordamiento visual afirmado como probado.
- Referencias: Archivo: current_1410/jetwords_canonical.html
Líneas: 30,35,39,98–102
- Notas: Riesgo identificado en fuente con reorganización propuesta; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [SRC-W02] P2 · active_source_finding · Texto, estados y flujo
**#eShare catch**
- Actual: Compartir; toast de primera línea del resultado
- Instrucción: Implementar fallback persistente de texto completo, incluida cuadrícula y URL; no toast truncado.
- Copy: Compartir resultado / No pudimos copiarlo automáticamente. Seleccioná y copiá este texto. / Copiar texto / Cerrar
- Aceptación: Denegar clipboard y native share: resultado íntegro seleccionable; cancelar share no genera error ni éxito falso.
- Referencias: https://jetgames.fun/words/ — current_1410/jetwords_canonical.html:262
- Notas: Riesgo confirmado en fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-WORDS-01] P2 · active_proposal · Dirección visual interna
**Tablero tipográfico y fila activa**
- Actual: Archivo: ui_audit/source_review/current_1410/jetwords_canonical.html
Líneas: 24–26; 45–56
Funciones: renderAll
Selectores: 
Valores literales de la fuente: grid6 filas; row5 columnas; gap6px
cell border2px; radius10px; JetBrainsMono700
font clamp(18px,6vw,32px)
absent #2a2140; present #fdd835; correct #3ddc84
- Instrucción: Conservar el tablero de 5×6 con tipografía monoespaciada. Hacer la fila activa identificable por un borde neutro más claro y no por un color de respuesta; mantener las filas futuras más discretas. Igualar alineación óptica de todas las letras, incluida Ñ, y evitar glow, gradientes o texturas dentro de las celdas. Mantener los estados correct/present/absent con sus colores actuales; si se añade un modo de mayor contraste, debe ser opcional y aplicarse también a ayuda/teclado/compartir.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- active_neutral_border: #A79ABE,2 px
- future_border: rgba(245,240,255,.12),2 px
- cell_fill: rgba(255,255,255,.02), conservar
- letter_weight: 700
- semantic_fills: #3DDC84/#FDD835/#2A2140, conservar
- Copy: 
- Aceptación: En una partida con Ñ y letras repetidas, todas las celdas mantienen tamaño y alineación; la fila activa se distingue sin parecer ya evaluada. Los mismos resultados producen los mismos colores/estados.
- Referencias: ui_audit/source_review/current_1410/jetwords_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No usar verde/amarillo antes de evaluar el intento ni cambiar el significado de ausencia/presencia/posición. No alterar cantidad de letras/intentos, diccionario o evaluación de letras repetidas.

## [VIS-WORDS-02] P2 · active_proposal · Dirección visual interna
**Teclado legible con estados inequívocos**
- Actual: Archivo: ui_audit/source_review/current_1410/jetwords_canonical.html
Líneas: 60–62
Funciones: markKeys
renderAll
Selectores: .key
.key.absent
.key.present
.key.correct
.key.wide
Valores literales de la fuente: key normal bg#2b2044,color#f5f2ff
key.absent bg#17102a,color#5a5275
key.present bg#fdd835,color#1a1200
key.correct bg#3ddc84,color#052d18
- Instrucción: Incrementar legibilidad de las letras descartadas del teclado sin hacerlas parecer disponibles: conservar su fondo más oscuro, llevar el texto de #5a5275 a #b2a7c8 y agregar una pequeña marca de estado o línea inferior discreta si hace falta distinguirlas de teclas normales. Mantener las teclas verdes/amarillas con texto oscuro y las letras siempre legibles. No reducir físicamente ni desactivar las teclas descartadas: todavía pueden formar parte de una palabra válida. Las teclas Enviar y Borrar deben diferenciarse por símbolo/etiqueta, no recibir colores de evaluación.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- absent_key_text: #B2A7C8
- absent_key_fill: #17102A, conservar
- normal_key_text: #F5F2FF, conservar
- optional_absent_marker: línea inferior #6C607F,1 px,50% ancho; no tachar letra
- response_key_fill: neutral #2B2044
- Copy: 
- Aceptación: Con muchas letras descartadas, se sigue leyendo cada tecla; se distingue de disponible, presente y correcta. Una tecla no retrocede de correcta a ausente por un intento posterior.
- Referencias: ui_audit/source_review/current_1410/jetwords_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: Preservar la prioridad de estados de markKeys: correct > present > absent, especialmente con letras repetidas. El teclado sigue aceptando letras descartadas y la evaluación no cambia.

## [VIS-WORDS-03] P2 · active_proposal · Dirección visual interna
**Resultado y distribución de intentos**
- Actual: Archivo: ui_audit/source_review/current_1410/jetwords_canonical.html
Líneas: 66–80
Funciones: showEnd
Selectores: .modal
.stats
.stat
.dist
.dist i.hi
.acts
.btn.primary
Valores literales de la fuente: modal background#120a22; radius20px
stats4 columnas; stat b22px; stat span11px
dist i altura18px; hi verde
btn.primary cian textooscuro
- Instrucción: Usar una ficha de resultado editorial y tranquila: encabezado de victoria/fin, palabra cuando corresponda, resumen y distribución de intentos. Alinear los números de estadísticas con tabular-nums y dar más presencia a la cifra que a la etiqueta; usar rótulos de al menos 12 px y permitir dos filas de estadísticas antes de comprimirlos. Mantener la distribución como barras horizontales neutras con un único acento en el intento relevante; añadir el número visible al final, sin depender de longitud/color. Reservar el cian para la acción principal, con acciones secundarias de superficie neutra.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- result_card_fill: #120A22
- stat_label: 12 px/1.3, peso 600,#B7ABCE
- stat_value: 24 px/1.1, peso 700, tabular-nums
- distribution_bar: 20 px alto, radio 4 px
- #layout_gap: 12 px secciones; 8 px entrestats
- main_action: #00F2CF con texto #052D18
- Copy: 
- Aceptación: Con estadísticas de varios dígitos, títulos largos y ambas traducciones, cifras y unidades no se mezclan. Una distribución con cero y máximos altos sigue mostrando valores legibles. La palabra sólo aparece cuando está permitido.
- Referencias: ui_audit/source_review/current_1410/jetwords_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No revelar la palabra del diario antes del fin, no confundir porcentaje con cantidad, no alterar estadísticas ni hacer parecer una práctica como reto del día. Conservar ES/EN y las acciones existentes.

## [VIS-WORDS-04] P2 · active_proposal · Dirección visual interna
**Revelación sobria y movimiento reducido**
- Actual: Archivo: ui_audit/source_review/current_1410/jetwords_canonical.html
Líneas: 50–57; 120; 233
Funciones: renderAll
Selectores: .cell.flip
.row.win .cell
.cell.pop
.row.shake
Valores literales de la fuente: flip .5s
hop .5s; desplazamiento-22%
shake .4s
@media(prefers-reduced-motion:reduce) ya desactiva flip/hop/pop/shake/modal
- Instrucción: Conservar la revelación por celdas en modo normal, pero no añadir chispas, brillo global ni fondos animados. Mantener la animación de error como señal breve de fila, acompañada del mensaje existente, sin desplazar el teclado. Preservar la regla reduced-motion ya implementada: la evaluación final debe aparecer de forma inmediata/estable y el mensaje no debe depender de la sacudida. Asegurar que toda lógica de desbloqueo termine aunque se elimine la animación; no basarla exclusivamente en animationend. La celebración no debe ocultar la fila resuelta.
Parámetros visuales propuestos para implementar y validar. No son mediciones de las capturas ni valores actuales, salvo donde se indica conservar. Si contradicen reglas o semántica, prevalecen las restricciones del campo «preserve».
Valores por parámetro:
- normal_flip: 500 ms actual, conservar
- normal_error_shake: 400 ms máximo actual; sin mover teclado
- reduced_animations: 0 ms; estado final inmediato
- feedback_text_min_duration: 1500 ms para mensaje de error; no bloquear teclado más tiempo
- Copy: 
- Aceptación: Con reduced-motion activo, enviar intento válido e inválido y ganar: no hay flip/salto/sacudida, pero se muestran todos los estados y se desbloquea la entrada cuando corresponde. En modo normal, el teclado permanece estable y la respuesta es legible.
- Referencias: ui_audit/source_review/current_1410/jetwords_canonical.html
- Notas: Propuesta de dirección visual, no un fallo observado. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar el momento lógico de evaluación, los estados de letras ni la aceptación de entradas. No afirmar que falta soporte reduced-motion. No reducir el tiempo disponible del usuario ni generar una nueva palabra por cerrar resultados.

## [SRC-W01] P3 · fixed_in_current_source_keep_regression_test · Texto, estados y flujo
**newGame/saveState/setMode**
- Actual: Práctica y Palabra del día; stateKey incluye modo/idioma; newGame restaura práctica no terminada y letras activas.
- Instrucción: El nuevo destino /words/ ya guarda y restaura práctica por modo/idioma. No implementar la antigua propuesta de advertencia o pérdida de práctica: quedó obsoleta. Conservar las pruebas de cambio de modo/idioma, recarga y retorno. Otra palabra sí debe iniciar una práctica nueva voluntariamente.
- Copy: Conservar el guardado actual y los nombres de modo.
- Aceptación: En una práctica sin terminar, introducir dos intentos y dejar letras escritas en el intento activo. Cambiar práctica → diario → práctica: deben restaurarse exactamente la misma palabra objetivo, los intentos enviados y sus resultados, las letras activas y el estado del teclado. Repetir con cambio de idioma y regreso al idioma original, y con recarga. El diario conserva su propio progreso. Una confirmación que permita perder esa práctica no sustituye la restauración ya implementada; sólo la acción voluntaria «Otra palabra» inicia una práctica nueva.
- Referencias: https://jetgames.fun/words/ — current_1410/jetwords_canonical.html:180–197,297
- Notas: CORREGIDO en fuente nueva; no agregar una advertencia innecesaria; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

# Copys ES/EN aplicables
- COPY-common-share [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Compartir resultado» | en: «Share result» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-copy-failed [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «No pudimos copiarlo automáticamente. Seleccioná y copiá este texto.» | en: «We couldn’t copy it automatically. Select and copy this text.» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-copy-text [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Copiar texto» | en: «Copy text» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-close [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Cerrar» | en: «Close» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-copied [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Texto copiado» | en: «Text copied» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-words-practice [SRC-W01] es-AR: «Práctica» | en: «Practice» | contexto: Preservar modos y guardado actual por modo/idioma, incluida entrada activa. No introducir aviso de pérdida al cambiar modo/idioma. Otra palabra inicia práctica voluntaria nueva. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-words-daily [SRC-W01] es-AR: «Palabra del día» | en: «Daily word» | contexto: Preservar modos y guardado actual por modo/idioma, incluida entrada activa. No introducir aviso de pérdida al cambiar modo/idioma. Otra palabra inicia práctica voluntaria nueva. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-words-another [SRC-W01] es-AR: «Otra palabra» | en: «Another word» | contexto: Preservar modos y guardado actual por modo/idioma, incluida entrada activa. No introducir aviso de pérdida al cambiar modo/idioma. Otra palabra inicia práctica voluntaria nueva. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-words-other-position [PLAY-WORDS-01, PLAY-WORDS-02, RSP-WORDS-02] es-AR: «{letra}: está en otra posición» | en: «{letra}: in another position» | contexto: 5 letras y 6 intentos confirmados en fuente canónica actual; no sustituir letras concretas observadas A/O/R por ejemplos fijos. Un anuncio completo por evaluación, no por frame. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'letra', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-words-correct [PLAY-WORDS-01, PLAY-WORDS-02, RSP-WORDS-02] es-AR: «{letra}: posición correcta» | en: «{letra}: correct position» | contexto: 5 letras y 6 intentos confirmados en fuente canónica actual; no sustituir letras concretas observadas A/O/R por ejemplos fijos. Un anuncio completo por evaluación, no por frame. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'letra', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-words-absent [PLAY-WORDS-01, PLAY-WORDS-02, RSP-WORDS-02] es-AR: «{letra}: sin coincidencia para esta copia» | en: «{letra}: no match for this copy» | contexto: 5 letras y 6 intentos confirmados en fuente canónica actual; no sustituir letras concretas observadas A/O/R por ejemplos fijos. Un anuncio completo por evaluación, no por frame. Estado por casilla/copia revelada, no afirmación global sobre la letra. CARTA mostró una A gris y otra verde; no consultar solución oculta para el anuncio. | condición: Sólo casilla ya revelada cuyo resultado real para esa copia sea gris/sin coincidencia; no usar como estado agregado del teclado ni para casilla pendiente. | params: [{'name': 'letra', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-words-attempt [PLAY-WORDS-01, PLAY-WORDS-02, RSP-WORDS-02] es-AR: «Intento {n} de 6» | en: «Attempt {n} of 6» | contexto: 5 letras y 6 intentos confirmados en fuente canónica actual; no sustituir letras concretas observadas A/O/R por ejemplos fijos. Un anuncio completo por evaluación, no por frame. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-words-tile [PLAY-WORDS-01, PLAY-WORDS-02, RSP-WORDS-02] es-AR: «Intento {n}, posición {posición}, {letra}: {estado}» | en: «Attempt {n}, position {posición}, {letra}: {estado}» | contexto: 5 letras y 6 intentos confirmados en fuente canónica actual; no sustituir letras concretas observadas A/O/R por ejemplos fijos. Un anuncio completo por evaluación, no por frame. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'posición', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'letra', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'estado', 'binding': 'Estado de esta casilla ya revelado, localizado desde words-state-correct/present/absent; si no se evaluó, words-state-pending. Gris significa sin coincidencia para esta copia, no ausencia global de la letra. No leer la solución oculta.'}] | citas actuales: []
- COPY-words-discarded [PLAY-WORDS-01, PLAY-WORDS-02, RSP-WORDS-02] es-AR: «Letra descartada» | en: «Ruled-out letter» | contexto: 5 letras y 6 intentos confirmados en fuente canónica actual; no sustituir letras concretas observadas A/O/R por ejemplos fijos. Un anuncio completo por evaluación, no por frame. | condición: Sólo leyenda/estado agregado del teclado realmente ausente según intentos revelados, sin otra copia amarilla/verde. No usar por cada casilla gris. | params: [] | citas actuales: []
- COPY-words-state-correct [PLAY-WORDS-01, PLAY-WORDS-02, RSP-WORDS-02] es-AR: «posición correcta» | en: «correct position» | contexto: 5 letras y 6 intentos confirmados en fuente canónica actual; no sustituir letras concretas observadas A/O/R por ejemplos fijos. Un anuncio completo por evaluación, no por frame. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-words-state-present [PLAY-WORDS-01, PLAY-WORDS-02, RSP-WORDS-02] es-AR: «está en otra posición» | en: «in another position» | contexto: 5 letras y 6 intentos confirmados en fuente canónica actual; no sustituir letras concretas observadas A/O/R por ejemplos fijos. Un anuncio completo por evaluación, no por frame. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-words-state-absent [PLAY-WORDS-01, PLAY-WORDS-02, RSP-WORDS-02] es-AR: «sin coincidencia para esta copia» | en: «no match for this copy» | contexto: 5 letras y 6 intentos confirmados en fuente canónica actual; no sustituir letras concretas observadas A/O/R por ejemplos fijos. Un anuncio completo por evaluación, no por frame. Sólo estado por casilla, no estado agregado del teclado. Preservar precedencia de coincidencias y multiplicidad de letras. | condición: Sólo valor de estado de una casilla ya revelada gris/sin coincidencia; una copia amarilla/verde conserva su propio resultado. | params: [] | citas actuales: []
- COPY-words-repeated [PLAY-WORDS-03, PLAY-WORDS-04, PLAY-WORDS-05] es-AR: «Si repetís una letra, sólo se marcan las veces que aparece en la palabra. Una copia puede quedar gris aunque otra esté verde.» | en: «If you repeat a letter, only as many copies as appear in the word are marked. One copy may be gray while another is green.» | contexto: Nombres de idioma localizados según selector y alcance correcto diario/práctica. No esconder error vigente por timeout ni deshabilitar letras descartadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-words-games [PLAY-WORDS-03, PLAY-WORDS-04, PLAY-WORDS-05] es-AR: «Partidas» | en: «Games» | contexto: Nombres de idioma localizados según selector y alcance correcto diario/práctica. No esconder error vigente por timeout ni deshabilitar letras descartadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Jugadas']
- COPY-words-practice-stats [PLAY-WORDS-03, PLAY-WORDS-04, PLAY-WORDS-05] es-AR: «Estadísticas de práctica · {idioma}» | en: «Practice statistics · {idioma}» | contexto: Nombres de idioma localizados según selector y alcance correcto diario/práctica. No esconder error vigente por timeout ni deshabilitar letras descartadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'idioma', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-words-distribution [PLAY-WORDS-03, PLAY-WORDS-04, PLAY-WORDS-05] es-AR: «Intentos necesarios para ganar» | en: «Attempts needed to win» | contexto: Nombres de idioma localizados según selector y alcance correcto diario/práctica. No esconder error vigente por timeout ni deshabilitar letras descartadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-words-streak [PLAY-WORDS-03, PLAY-WORDS-04, PLAY-WORDS-05] es-AR: «Victorias consecutivas» | en: «Consecutive wins» | contexto: Nombres de idioma localizados según selector y alcance correcto diario/práctica. No esconder error vigente por timeout ni deshabilitar letras descartadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-words-missing-one [PLAY-WORDS-03, PLAY-WORDS-04, PLAY-WORDS-05] es-AR: «Falta 1 letra.» | en: «1 letter is missing.» | contexto: Nombres de idioma localizados según selector y alcance correcto diario/práctica. No esconder error vigente por timeout ni deshabilitar letras descartadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-words-missing-many [PLAY-WORDS-03, PLAY-WORDS-04, PLAY-WORDS-05] es-AR: «Faltan {n} letras.» | en: «{n} letters are missing.» | contexto: Nombres de idioma localizados según selector y alcance correcto diario/práctica. No esconder error vigente por timeout ni deshabilitar letras descartadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-words-five-letters [PLAY-WORDS-03, PLAY-WORDS-04, PLAY-WORDS-05] es-AR: «Escribí una palabra de 5 letras.» | en: «Enter a 5-letter word.» | contexto: Nombres de idioma localizados según selector y alcance correcto diario/práctica. No esconder error vigente por timeout ni deshabilitar letras descartadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-words-key-absent [PLAY-WORDS-01, RSP-WORDS-02, VIS-WORDS-02] es-AR: «{letra}: descartada según los intentos revelados» | en: «{letra}: ruled out based on revealed guesses» | contexto: Estado agregado del teclado separado del estado de cada casilla. Una copia gris no descarta la letra si otra copia ya tiene coincidencia amarilla/verde. Usar únicamente evaluaciones reveladas y la precedencia existente del teclado; no consultar la palabra oculta ni cambiar el algoritmo. | condición: words-key-absent sólo si el agregado real es ausente y no hay evidencia revelada de coincidencia. words-state-pending sólo para casilla aún no evaluada, nunca como resultado de una evaluación real. | params: [{'name': 'letra', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-words-state-pending [PLAY-WORDS-01, RSP-WORDS-02, VIS-WORDS-02] es-AR: «sin evaluar» | en: «not evaluated» | contexto: Estado agregado del teclado separado del estado de cada casilla. Una copia gris no descarta la letra si otra copia ya tiene coincidencia amarilla/verde. Usar únicamente evaluaciones reveladas y la precedencia existente del teclado; no consultar la palabra oculta ni cambiar el algoritmo. | condición: words-key-absent sólo si el agregado real es ausente y no hay evidencia revelada de coincidencia. words-state-pending sólo para casilla aún no evaluada, nunca como resultado de una evaluación real. | params: [] | citas actuales: []
