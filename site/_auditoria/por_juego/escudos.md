# escudos: 19 registros del catálogo, 58 copys

## [RSP-ESCUDOS-01] P1 · active · Responsive y controles
**Elecciones principales y llave deben ser operables sin ratón**
- Actual: P1 · alta · confirmado por fuente. `current_1410/escudos.html:430–434`: equipos `.team.pick` son DIV con click; 153/155 y 575 `.ko-side` igual; 547/562 `.slot[data-kside]` también. No hay role/tabindex/keydown que los haga botones; el empate sí es botón.
- Instrucción: Convertir `.team.pick` y `.ko-side` a `<button type=button>` conservando CSS y datos; usar aria-pressed para selección y nombre completo de equipo+partido. En llave separar botón de elegir ganador de botón de detalle para evitar interacciones anidadas; las slots sin equipo son texto, no botones. Restaurar foco al mismo partido/equipo por `data-pick,data-res` tras `render()` (414); de lo contrario cada click reconstruye app y pierde foco. Tablas de posiciones interactivas: nombre de equipo como botón real dentro de celda, no todo DIV sin semántica.
- Copy: 
- Aceptación: Elegir A/B/empate y ganador KO con Tab/Enter/Espacio; selector anuncia estado; al elegir no vuelve foco al principio de página; cambiar elección no dispara también abrir detalle.
- Referencias: Archivo: current_1410/escudos.html
Líneas: 430–434
Archivo: current_1410/escudos.html
Líneas: 153,155,430–434,547,562,575
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-ESCUDOS-02] P1 · active · Responsive y controles
**Modal KO: limitar alto, gestionar foco y exponer diálogo**
- Actual: P1 foco / P2 de disposición visual · alta · confirmado por fuente. `current_1410/escudos.html:105–112,149–158,575–577`: `.modal` no tiene max-height/overflow; contenedor no role; sólo click cierra, no Escape; fondo no inert. Zoom o pantalla baja puede dejar acciones fuera.
- Instrucción: Dar al modal `role=dialog aria-modal=true aria-labelledby=koTitle`; padding overlay=16+safearea por lado; `.modal{max-height:100%;overflow:auto}`; agregar transferencia/trap/restauración de foco y Escape→mismo cierre que Cerrar. En abrir, poner `.wrap.inert=true`; al cerrar deshacerlo. Mantener botones de acción dentro del flujo, no fixed sobre contenido.
- Copy: 
- Aceptación: A 320×568 y 768×390 con texto al 200%, ambas elecciones y Cerrar/Quitar elección son alcanzables con scroll; Escape funciona; tabulación no entra en competición detrás.
- Referencias: Archivo: current_1410/escudos.html
Líneas: 105–112,149–158,575–577
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [SRC-E01] P1 · active_source_finding · Texto, estados y flujo
**#simBtn / simulateAll**
- Actual: Simular todo
- Instrucción: Fútbol conserva partidos elegidos; F1 sobrescribe todos los podios. Unificar acción no destructiva: sólo rellenar pendientes. Si se ofrece resimular todo, separarla y confirmar; añadir Deshacer simulación mediante snapshot de resultados. Mostrar «Simular resultados pendientes» y prometer que las elecciones se conservan sólo después de implementar y comprobar ese comportamiento; no basta con renombrar el botón.
- Copy: Simular resultados pendientes
- Aceptación: Elegir resultados manuales en fútbol y F1 → Simular resultados pendientes: quedan intactos. Repetir no cambia los completados. Deshacer recupera el snapshot.
- Referencias: https://jetgames.fun/escudos/ — current_1410/escudos.html:419–424,595–600; current_1410/escudos__escudos__i18n.js:29
- Notas: Inconsistencia confirmada en fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [SRC-E02] P1 · active_source_finding · Texto, estados y flujo
**bindPicks / DB.ko={} al cambiar resultado previo**
- Actual: Sin aviso: cambia resultado y vacía todas las llaves
- Instrucción: Invalidar sólo cruces dependientes y sus descendientes. Si se perderán selecciones, previsualizar cuáles/contar; mantener snapshot para Deshacer. No borrar toda fase KO al cambiar grupo no relacionado.
- Copy: ¿Cambiar este resultado? / Se recalcularán los cruces que dependen de este partido. / Cancelar / Cambiar resultado
- Aceptación: Completar grupos y varias rondas de eliminatorias; editar un partido. Sólo cambian cruces dependientes. Cancelar no modifica nada. Deshacer recupera todas las elecciones.
- Referencias: https://jetgames.fun/escudos/ — current_1410/escudos.html:434
- Notas: Riesgo confirmado en fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [PLAY-ESCUDOS-01] P2 · active · Prueba interactiva y propuestas
**Nombres completos y tabla comprensible**
- Actual: En la vista de grupos, a 1180 px, aparecen nombres truncados como Sudáfri… y Corea d…; las columnas PJ/G/E/P/PT y los valores cero tienen contraste muy bajo.
- Instrucción: Reservar ancho suficiente para los nombres completos y permitir dos líneas antes de truncarlos. Añadir el nombre completo accesible. Incluir encabezados expandibles y mantener el contraste de los valores cero al mismo nivel que el resto de los datos.
- Copy: Equipo
Jugados
Ganados
Empatados
Perdidos
Puntos
- Aceptación: Con todos los grupos visibles a 1180 px, se identifican los equipos sin depender sólo del escudo. Los encabezados y los valores cero son legibles.
- Referencias: evidence/escudos-pass1-groups.jpg
- Notas: Ventana de observación: 2026-10-22T14:54:00Z/2026-10-22T14:58:00Z

## [PLAY-ESCUDOS-02] P2 · active · Prueba interactiva y propuestas
**Selección de resultados accesible**
- Actual: Los escudos de los cruces del Mundial aparecen como imágenes o textos sin rol de botón en el árbol de accesibilidad; EMP sí aparece como botón. En F1 sí se exponen botones.
- Instrucción: Convertir las opciones de resultado de cada partido en un grupo semántico: equipo local, empate y visitante, con estado seleccionado explícito, operación por teclado y foco visible. En eliminatorias, omitir el empate y anunciar la clasificación y la dependencia de las rondas siguientes. Generar los nombres de equipo desde el partido vigente.
- Copy: Gana {equipo}
Empate
{equipo} seleccionado como ganador
- Aceptación: Todos los resultados pueden elegirse, cambiarse y quitarse con teclado. El lector anuncia el partido, la opción y la selección.
- Referencias: evidence/escudos-pass1-groups.jpg
evidence/escudos-pass1-bracket.jpg
- Notas: Ventana de observación: 2026-10-22T14:54:00Z/2026-10-22T14:58:00Z

## [PLAY-ESCUDOS-03] P2 · active · Prueba interactiva y propuestas
**Dar alcance y control a la simulación**
- Actual: Simular todo resolvió los grupos y la llave completa inmediatamente y mostró Campeón: Suiza en un estado pequeño junto a las pestañas.
- Instrucción: Usar «Simular resultados pendientes» para la acción que completa sólo resultados faltantes y conserva las elecciones existentes. Implementar y comprobar esa preservación antes de mostrar la promesa «Tus elecciones se conservarán». Explicar qué fases se completarán. Si se ofrece reiniciar y simular todo, mantenerlo como una acción separada y con confirmación explícita del reemplazo. Mostrar un resumen de finalización con acceso a la final y a la tabla, sin interrumpir la navegación. El campeón se obtiene del resultado real de la simulación.
- Copy: Simular resultados pendientes
Se completarán los partidos sin resultado hasta definir un campeón. Tus elecciones se conservarán.
Ver la final
Campeón de tu simulación: {equipo}
- Aceptación: La acción de pendientes conserva todas las selecciones existentes; no basta con renombrar el botón. Una acción que las reemplace requiere un aviso y una confirmación distintos. El fin del torneo es visible y permite revisar la final.
- Referencias: evidence/escudos-pass1-bracket.jpg
- Notas: Ventana de observación: 2026-10-22T14:54:00Z/2026-10-22T14:58:00Z

## [PLAY-ESCUDOS-04] P2 · active · Prueba interactiva y propuestas
**Hacer legible la estructura de la llave**
- Actual: Las columnas de rondas apilan cruces arriba sin conectores visibles; a 1180 px el extremo final se corta horizontalmente. La navegación incluye un botón sólo con 🏆.
- Instrucción: Mantener el árbol real de cruces. Alinear cada ronda con sus cruces de origen y dibujar conectores sobrios. Ofrecer una vista por ronda en pantallas estrechas y una vista completa con desplazamiento explícito. Etiquetar todos los destinos, incluido el campeón.
- Copy: Vista por ronda
Llave completa
Ver campeón
Deslizá para ver las siguientes rondas.
- Aceptación: Desde cualquier cruce se puede seguir el camino hasta la final sin deducir relaciones entre columnas. El campeón y la final no quedan ocultos sin una indicación de cómo acceder.
- Referencias: evidence/escudos-pass1-bracket.jpg
- Notas: Ventana de observación: 2026-10-22T14:54:00Z/2026-10-22T14:58:00Z

## [PLAY-ESCUDOS-05] P2 · active · Prueba interactiva y propuestas
**Explicar cómo construir y editar el podio**
- Actual: F1 sólo dice Carreras · toca 1.º, 2.º y 3.º. Tocar una selección la quita y sube al siguiente de puesto; contador considera una carrera con resultado desde el primer puesto.
- Instrucción: Mostrar tres posiciones rotuladas para el podio, con estado vacío o completo y nombres junto a los logos. Explicar el orden de selección y qué sucede al quitar una opción. Distinguir una carrera con selección iniciada de un podio completo, y describir el sistema de puntos de la simulación sin alterarlo.
- Copy: Podios completos: {completos}/{total}
Primero: {puntos_1} puntos · Segundo: {puntos_2} · Tercero: {puntos_3}
- Aceptación: Elegir sólo el primer puesto no comunica que el podio esté completo. Al quitar el segundo, queda claro que el tercero pasa al segundo puesto. Cada opción tiene un nombre legible sin exigir reconocer su logo.
- Referencias: evidence/escudos-pass2-f1.jpg
- Notas: Ventana de observación: 2026-10-22T14:54:00Z/2026-10-22T14:58:00Z

## [PLAY-ESCUDOS-06] P2 · active · Prueba interactiva y propuestas
**Confirmación de borrado con contexto**
- Actual: Borrar resultados cambia en el mismo lugar a ¿Seguro? Toca otra vez; no detalla la competición ni el alcance y no muestra Cancelar. No se ejecutó el segundo clic.
- Instrucción: Sustituir la confirmación ambigua de doble clic por un diálogo explícito, con foco inicial en Cancelar y el nombre real de la competición. Comunicar que los datos se guardan en este navegador y que el borrado no afecta a otras competiciones sólo si ése es el alcance real.
- Copy: ¿Borrar tus resultados de {competición}?
Esta acción reinicia esta competición en este navegador.
Cancelar
Borrar resultados
- Aceptación: Cancelar y Escape no alteran datos. Confirmar borra sólo el alcance anunciado. Un doble clic accidental sobre el control inicial no confirma también el diálogo.
- Referencias: evidence/escudos-pass2-clear-confirm.jpg
- Notas: Ventana de observación: 2026-10-22T14:54:00Z/2026-10-22T14:58:00Z

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

## [RSP-ESCUDOS-03] P2 · active · Responsive y controles
**Targets de carreras y navegación no deben reducirse por ser móvil**
- Actual: P2 · confianza alta · confirmado por fuente. `current_1410/escudos.html:116`: podio de 38×38 px; línea 77: empate con min-height de 40 px; línea 33: pestañas con padding de 8 px y fuente de 13 px (aproximadamente 34 px de alto); línea 88: rondas con padding de 7 px y fuente de 12 px (aproximadamente 30 px); línea 136: audio de 32×31 px con ampliación mediante pseudoelemento hasta 40×41 px, todavía inferior a 44 px.
- Instrucción: `.race .podio button{width:44px;height:44px}` con gap de 8 px; `.drawbtn,.tab,.round-nav button,.back{min-height:44px}`; `.ja-b{width:44px;height:44px}` y retirar expansión pseudo si invade vecinos. Mantener wrap del toolbar/topnav; si no cabe, segunda fila, no reducir tamaño. Conservar escudos y jerarquía actual.
- Copy: 
- Aceptación: A 320/360/390 todos estos controles de al menos 44 px alto y separación de al menos 8 px; pulsar un piloto no elige al vecino. A 768 no aparece barra horizontal de página.
- Referencias: Archivo: current_1410/escudos.html
Líneas: 116
Archivo: current_1410/escudos.html
Líneas: 33,77,88,116,136
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-ESCUDOS-04] P2 · active · Responsive y controles
**Nombre de equipo comprimido en tablas de grupos**
- Actual: P2 · confianza alta sobre la geometría; legibilidad final pendiente. `current_1410/escudos.html:55–65,119`: a 320 px, la página deja 300 px; gcard, 274 px; y std-row, 262 px. Los anchos fijos y gaps suman 214 px y dejan 48 px para el nombre, que usa ellipsis. A 768 px, auto-fill permite 2 tarjetas de 364 px con columnas de escritorio y también deja aproximadamente 56 px para el nombre. El nombre identifica la selección, no es un adorno.
- Instrucción: Subir el mínimo de grupos a `minmax(min(100%,420px),1fr)` para impedir dos grupos estrechos en 768 px. A <=419 px, crear variante de fila compacta: fila 1: posición de 20 px, escudo de 38 px, nombre `minmax(0,1fr)`, puntos de 36 px; fila 2: un bloque `grid-column:3/-1` con «PJ n · G n · E n · P n» y fuente de 12 px. Conservar nombre completo (wrap, no ellipsis) y encabezado/accesibilidad de cada estadística. No esconder datos sin alternativa.
- Copy: 
- Aceptación: A 320 y 768 los nombres largos se leen completos en ≤3 líneas, todos PJ/G/E/P/PT disponibles y alineados; cambiar competición no rompe partidos de deportes sin empate.
- Referencias: Archivo: current_1410/escudos.html
Líneas: 55–65,119
- Notas: Regla identificada en fuente con riesgo inferido; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

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

## [SRC-E03] P2 · active_source_finding · Texto, estados y flujo
**.drawbtn; #status; openComp**
- Actual: EMP; No se encontró la competición.
- Instrucción: Expander EMP visible o accesible; diferenciar un error 404 de red; capturar fetch/JSON error, con estado cargando y botón de recuperación dentro del área de competición. Mostrar leyenda de abreviaturas PJ/G/E/P/PT.
- Copy: Empate / No pudimos abrir esta competición. / Volver a intentar / Ver competiciones
- Aceptación: Red fallida y un error 404 producen mensajes distintos sin pantalla vacía; reintento no pierde resultados guardados; Empate inequívoco.
- Referencias: https://jetgames.fun/escudos/ — current_1410/escudos.html:373–378,430–438; https://jetgames.fun/escudos/i18n.js?v=20261022:27–30
- Notas: Recomendación de texto y manejo de errores; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-ESCUDOS-01] P2 · active_proposal · Dirección visual interna
**Normalizar el soporte del escudo, no deformar la marca**
- Actual: .cb usa46×46 con fondo blanco y padding 2; .cb.lg84 px/padding 4; partidos58 px; catálogo28 px/padding 3. Las imágenes ya usan object-fit:contain.
- Instrucción: Conservar contain y los colores originales. Unificar el soporte con radio del 22% de su lado y borde 1 px rgba(10,15,20,.12); dar padding proporcional del 8% (mínimo 3 px en tamaño 28). No recortar transparentes agresivamente ni convertir todos los fondos a oscuros. Para .cb.none, usar placa neutra con abreviatura centrada de 11 px mínimo y pequeño símbolo de escudo vacío; diferenciar carga pendiente de ausencia definitiva con texto del contexto, no un logo inventado.
- Copy: 
- Aceptación: Comparar escudos redondos, verticales y apaisados en catálogo, tabla, partido y campeón; todos caben sin estiramiento y se reconocen en miniatura. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/escudos.html
lines: 48,51–53,75,94
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No alterar logos oficiales, nombres, abreviaturas ni afiliación. El soporte no debe comunicar ganador: ese estado va fuera del logo.

## [VIS-ESCUDOS-02] P2 · active_proposal · Dirección visual interna
**Resultados elegidos legibles sin apagar al rival**
- Actual: .team.sel tiene fondo verde .16 y borde interior 1 px; .team.un baja opacidad global a .42. En la llave .slot.win tiene verde .12 y .slot.lose opacity.5.
- Instrucción: Retirar la opacidad global de .team.un y .slot.lose: conservar escudo/nombre al 100% y bajar sólo los adornos no informativos. Ganador: borde verde 2 px y etiqueta compacta con✓ junto al nombre; no sobre el escudo. Empate: mantener oro, añadir= en el botón sin confundirlo con ganador. Perdedor: sin borde de ganador y rótulo discreto de resultado cuando el formato lo permita; no tachar la marca. Partidos pendientes conservan contorno discontinuo.
- Copy: 
- Aceptación: Con un partido resuelto siguen legibles ambos nombres. Deshacer o cambiar ganador quita la marca anterior y coloca una sola nueva. Empate es distinguible del resultado pendiente sin depender del color. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/escudos.html
lines: 70–78,93–97
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: El estado visual depende de DB.gs/DB.ko existentes; no predeterminar resultados ni cambiar puntuación. Mantener posibilidad de corregir una selección.

## [VIS-ESCUDOS-03] P2 · active_proposal · Dirección visual interna
**Jerarquizar números y clasificación en las tablas**
- Actual: .std-row separa posición, escudo, nombre y estadísticas; columnas numéricas usan JetBrains Mono. .st.dim usa var(--line), muy tenue; q1/q2/q3/qp/rel se marcan con línea lateral 3 px y leyenda de cuadrados10 px.
- Instrucción: Mantener tabular-nums y la misma alineación de cabecera/datos. Cambiar .st.dim a var(--muted) con opacity:.7 para que cero siga siendo un dato legible. Reservar máxima jerarquía a puntos: peso 800, fondo neutro sutil en su celda, no un color de equipo. Conservar bandas de clasificación de 3 px y añadir el mismo símbolo de la leyenda junto a la posición; obtener su significado de los datos de cada competición, sin etiquetas universales. Filas alternas con fondo blanco al 2%, no un gradiente diferente por equipo.
- Copy: 
- Aceptación: Una tabla llena puede leerse por columna y por fila; 0 y— tienen tratamiento distinto cuando ambos existan. Clasificación/descenso se entiende en escala de grises mediante símbolo+leyenda. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/escudos.html
lines: 61–66,79
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar columnas PJ/G/E/P/GD/puntos, criterios de desempate ni colores de clasificación asociados a cada torneo. El cero no debe convertirse visualmente en dato ausente.

## [VIS-ESCUDOS-04] P2 · active_proposal · Dirección visual interna
**Hacer visible la progresión de la llave con una jerarquía editorial**
- Actual: .bracket es flex con gap 18; .round min-width 250; .tie usa tarjetas borde 1 px, ready cambia a accent; .champion.crowned añade halo dorado40 px.
- Instrucción: Añadir separador vertical fino entre rondas y encabezado de ronda con número/etapa y contador de cruces decididos. Donde los datos expongan vínculos reales entre cruces, dibujar conectores SVG de 1.5 px detrás de las tarjetas: gris para pendiente y acento sólo para la ruta elegida; no construir conexiones por pura posición visual si el formato reordena equipos. Reducir halo del campeón a 20 px alpha .12 y añadir corona/etiqueta estable. Mantener scroll horizontal y no comprimir toda la llave a 320 px.
- Copy: 
- Aceptación: Cambiar una ronda inicial actualiza la ruta visual sin líneas que indiquen avances obsoletos. En móvil se identifica qué ronda se está viendo y el campeón sin tener que reducir todo a texto diminuto. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/escudos.html
lines: 88–100
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: Conectores reflejan exactamente findTie/koCurrent y el cuadro real, incluidas rondas con bye. No alterar orden, emparejamiento ni ganador.

# Copys ES/EN aplicables
- COPY-common-cancel [SRC-G04, SRC-R02, SRC-AN01, SRC-E02, SRC-BE01, SRC-BE02, RSP-MODALS-01, RSP-BALIZAS-02, PLAY-BALIZAS-05] es-AR: «Cancelar» | en: «Cancel» | contexto: Cancelación real: no cobrar, borrar, publicar, fusionar ni sustituir estado. Foco inicial en confirmaciones destructivas. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
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
- COPY-escudos-simulate-pending [SRC-E01, PLAY-ESCUDOS-03] es-AR: «Simular resultados pendientes» | en: «Simulate pending results» | contexto: Simular pendientes debe preservar resultados manuales tanto en fútbol como F1. No conectar promesa de preservación hasta corregir handler. Resimular es acción separada con confirmación, sólo si se ofrece. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Simular todo']
- COPY-escudos-simulate-football-help [SRC-E01, PLAY-ESCUDOS-03] es-AR: «Se completarán los partidos sin resultado hasta definir un campeón. Tus elecciones se conservarán.» | en: «Matches without results will be completed until a champion is determined. Your choices will be preserved.» | contexto: Simular pendientes debe preservar resultados manuales tanto en fútbol como F1. No conectar promesa de preservación hasta corregir handler. Resimular es acción separada con confirmación, sólo si se ofrece. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-simulate-f1-help [SRC-E01, PLAY-ESCUDOS-03] es-AR: «Se completarán los podios pendientes. Tus elecciones se conservarán.» | en: «Pending podiums will be completed. Your choices will be preserved.» | contexto: Simular pendientes debe preservar resultados manuales tanto en fútbol como F1. No conectar promesa de preservación hasta corregir handler. Resimular es acción separada con confirmación, sólo si se ofrece. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-undo-simulation [SRC-E01, PLAY-ESCUDOS-03] es-AR: «Deshacer simulación» | en: «Undo simulation» | contexto: Simular pendientes debe preservar resultados manuales tanto en fútbol como F1. No conectar promesa de preservación hasta corregir handler. Resimular es acción separada con confirmación, sólo si se ofrece. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-resimulate-all [SRC-E01, PLAY-ESCUDOS-03] es-AR: «Volver a simular todo» | en: «Simulate everything again» | contexto: Simular pendientes debe preservar resultados manuales tanto en fútbol como F1. No conectar promesa de preservación hasta corregir handler. Resimular es acción separada con confirmación, sólo si se ofrece. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-resimulate-title [SRC-E01, PLAY-ESCUDOS-03] es-AR: «¿Reemplazar todos los resultados de esta competición?» | en: «Replace all results in this competition?» | contexto: Simular pendientes debe preservar resultados manuales tanto en fútbol como F1. No conectar promesa de preservación hasta corregir handler. Resimular es acción separada con confirmación, sólo si se ofrece. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-resimulate-body [SRC-E01, PLAY-ESCUDOS-03] es-AR: «Tus elecciones de esta competición se reemplazarán por resultados simulados.» | en: «Your choices in this competition will be replaced with simulated results.» | contexto: Simular pendientes debe preservar resultados manuales tanto en fútbol como F1. No conectar promesa de preservación hasta corregir handler. Resimular es acción separada con confirmación, sólo si se ofrece. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-final [SRC-E01, PLAY-ESCUDOS-03] es-AR: «Ver la final» | en: «View final» | contexto: Simular pendientes debe preservar resultados manuales tanto en fútbol como F1. No conectar promesa de preservación hasta corregir handler. Resimular es acción separada con confirmación, sólo si se ofrece. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-champion [SRC-E01, PLAY-ESCUDOS-03, VIS-ESCUDOS-04] es-AR: «Campeón de tu simulación: {equipo}» | en: «Your simulated champion: {equipo}» | contexto: Simular pendientes debe preservar resultados manuales tanto en fútbol como F1. No conectar promesa de preservación hasta corregir handler. Resimular es acción separada con confirmación, sólo si se ofrece. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'equipo', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-escudos-change-title [SRC-E02] es-AR: «¿Cambiar este resultado?» | en: «Change this result?» | contexto: Previsualizar cruces/selecciones afectados desde dependencias reales. No borrar llaves no relacionadas ni mostrar n sin cálculo. Cancelar no cambia nada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-change-body [SRC-E02] es-AR: «Se recalcularán los cruces que dependen de este partido.» | en: «Matchups that depend on this match will be recalculated.» | contexto: Previsualizar cruces/selecciones afectados desde dependencias reales. No borrar llaves no relacionadas ni mostrar n sin cálculo. Cancelar no cambia nada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-change-lost [SRC-E02] es-AR: «Se perderán {n} selecciones dependientes.» | en: «{n} dependent selections will be lost.» | contexto: Previsualizar cruces/selecciones afectados desde dependencias reales. No borrar llaves no relacionadas ni mostrar n sin cálculo. Cancelar no cambia nada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-escudos-change [SRC-E02] es-AR: «Cambiar resultado» | en: «Change result» | contexto: Previsualizar cruces/selecciones afectados desde dependencias reales. No borrar llaves no relacionadas ni mostrar n sin cálculo. Cancelar no cambia nada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-undo [SRC-E02] es-AR: «Deshacer» | en: «Undo» | contexto: Previsualizar cruces/selecciones afectados desde dependencias reales. No borrar llaves no relacionadas ni mostrar n sin cálculo. Cancelar no cambia nada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-draw [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04, VIS-ESCUDOS-02] es-AR: «Empate» | en: «Draw» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['EMP']
- COPY-escudos-load-failed [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «No pudimos abrir esta competición.» | en: «We couldn’t open this competition.» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-not-found [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «No encontramos esta competición.» | en: «We couldn’t find this competition.» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-retry [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «Volver a intentar» | en: «Try again» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-competitions [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «Ver competiciones» | en: «View competitions» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-team [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «Equipo» | en: «Team» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-played [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «Jugados» | en: «Played» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-won [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «Ganados» | en: «Won» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-drawn [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «Empatados» | en: «Drawn» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-lost [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «Perdidos» | en: «Lost» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-points [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «Puntos» | en: «Points» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-winner-option [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «Gana {equipo}» | en: «{equipo} wins» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'equipo', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-escudos-winner-selected [SRC-E03, PLAY-ESCUDOS-01, PLAY-ESCUDOS-02, RSP-ESCUDOS-01, RSP-ESCUDOS-04] es-AR: «{equipo} seleccionado como ganador» | en: «{equipo} selected as winner» | contexto: 404→no encontrada, red/JSON→no pudimos abrir con causa conocida aparte; no adjudicar red a un 404. Nombres de equipo reales completos, no México/Sudáfrica de sesión. PJ/G/E/P/PT conservan leyenda localizada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'equipo', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-escudos-round-view [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Vista por ronda» | en: «Round view» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-full-bracket [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Llave completa» | en: «Full bracket» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-view-champion [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Ver campeón» | en: «View champion» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-scroll-rounds [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Deslizá para ver las siguientes rondas.» | en: «Swipe to see the next rounds.» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-podium-help [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Elegí las escuderías en orden: primero, segundo y tercero.» | en: «Choose the racing teams in order: first, second and third.» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-podium-remove [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Tocá una escudería seleccionada para quitarla; las siguientes subirán un puesto.» | en: «Select a chosen racing team to remove it; those below it will move up one place.» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-podium-count [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Podios completos: {n}/{total}» | en: «Completed podiums: {n}/{total}» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'total', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-escudos-podium-points [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Primero: 25 puntos · Segundo: 18 · Tercero: 15» | en: «First: 25 points · Second: 18 · Third: 15» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-first [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Primero» | en: «First» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-second [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Segundo» | en: «Second» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-third [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Tercero» | en: «Third» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-empty-slot [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Sin elegir» | en: «Not selected» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-delete-title [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «¿Borrar tus resultados de {competición}?» | en: «Delete your results for {competición}?» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'competición', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-escudos-delete-body [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Esta acción reinicia esta competición en este navegador.» | en: «This resets this competition in this browser.» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-delete-results [PLAY-ESCUDOS-04, PLAY-ESCUDOS-05, PLAY-ESCUDOS-06] es-AR: «Borrar resultados» | en: «Delete results» | contexto: 25/18/15 verificados en F1PTS. Total de carreras deriva de competición vigente; 24 observado no se fija en cadena reutilizable. Confirmar alcance local y competición antes de conectar borrado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-escudos-winner-status [VIS-ESCUDOS-02] es-AR: «Ganador» | en: «Winner» | contexto: Estado del resultado elegido/simulado en DB.gs/DB.ko, no resultado real externo ni decisión anticipada. Empate reutiliza escudos-draw; no asignar ganador/perdedor a empate o partido pendiente. | condición: Sólo después de que el modelo tenga ese resultado. Cuando se corrige/deshace, quitar la marca obsoleta y actualizar ambos lados sin tachar nombre/escudo. | params: [] | citas actuales: []
- COPY-escudos-loser-status [VIS-ESCUDOS-02] es-AR: «Perdedor» | en: «Loser» | contexto: Estado del resultado elegido/simulado en DB.gs/DB.ko, no resultado real externo ni decisión anticipada. Empate reutiliza escudos-draw; no asignar ganador/perdedor a empate o partido pendiente. | condición: Sólo después de que el modelo tenga ese resultado. Cuando se corrige/deshace, quitar la marca obsoleta y actualizar ambos lados sin tachar nombre/escudo. | params: [] | citas actuales: []
- COPY-escudos-decided-matchups [VIS-ESCUDOS-04] es-AR: «Cruces decididos: {decididos}/{total}» | en: «Decided matchups: {decididos}/{total}» | contexto: Contador junto al encabezado real de la ronda; conservar nombre/etapa existentes. No construir cruces ni avance a partir de posición visual; respetar byes y vínculos reales. | condición: Sólo si el formato expone estos conteos de cruces. No contar un bye como un partido jugado ni un cruce inexistente como pendiente; los dos términos usan la misma unidad y colección. | params: [{'name': 'decididos', 'binding': 'Cruces reales de esta ronda cuyo resultado ya está definido según el modelo vigente, manual o simulado.'}, {'name': 'total', 'binding': 'Total de cruces reales de la misma ronda/colección; no cantidad de equipos ni puestos ni casilleros vacíos. Documentar tratamiento de byes desde el formato real.'}] | citas actuales: []
- COPY-escudos-one-change-lost [SRC-E02] es-AR: «Se perderá 1 selección dependiente.» | en: «1 dependent selection will be lost.» | contexto: Variante n=1 calculada desde dependencias reales. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
