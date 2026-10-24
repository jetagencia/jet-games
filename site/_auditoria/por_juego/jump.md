# jump: 14 registros del catálogo, 14 copys

## [RSP-JUMP-01] P1 · active · Responsive y controles
**«Volver a cargar»: sólo en error y centrado dentro del bloque de carga**
- Actual: P1 · alta · confirmado por cascada de fuente. `current_1410/jetjump.html:39–49,482–487`: `#load{display:grid}`, `.load-in{text-align:center;width:min(340px,84vw)}`, `#load-retry{margin-top:16px}`, `.btn{display:flex;justify-content:space-between;text-align:left}`. El botón trae `[hidden]` pero ninguna regla general respeta `[hidden]`; el display de autor vence la regla nativa. `current_1410/jetjump__jetjump__src__main.js:56–57` muestra el botón en error; 688 vuelve a ocultar el loader con `.hidden=true`, también vencible por `#load{display:grid}`.
- Instrucción: Añadir al comienzo del CSS `[hidden]{display:none!important}`; conservar las reglas de clase `.hidden` por separado. Reemplazar `#load-retry` por `margin:16px auto 0; width:min(100%,260px); min-height:48px; justify-content:center; text-align:center`. No posicionarlo respecto del viewport ni del canvas. Hacer `.load-in{max-width:100%}` y mantener el logo/progreso/mensaje/botón en esa única columna.

Durante carga normal `load-retry.hidden=true`; sólo el manejador de error lo cambia a false, termina la animación de progreso y enfoca el botón. Al reintentar, deshabilitarlo hasta la nueva carga; al éxito `#load.hidden=true`, fuera del foco y del árbol accesible. La etiqueta final será «Volver a cargar». No mostrarla preventivamente durante la carga normal.
- Copy: 
- Aceptación: Carga normal sin botón; forzar fallo de un recurso produce botón centrado bajo el mensaje con 16 px de separación, nunca sobre logo/barra; éxito elimina loader y todos sus descendientes del orden Tab. Comprobar 320/360/390/768 y horizontal.
- Referencias: Archivo: current_1410/jetjump.html
Líneas: 39–49,482–487
Archivo: current_1410/jetjump__jetjump__src__main.js
Líneas: 56–57
Archivo: current_1410/jetjump__jetjump__src__main.js
Líneas: 56–57,688
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.
- Coordinación: Aplicar la decisión común Jump: Volver a cargar; bloque centrado .load-in; separación 16 CSS px; mínimo 48 px de alto, máximo 260 px de ancho; sin desbordes. Las medidas citadas en Actual no son la nueva especificación.

## [SRC-JU01] P1 · active_source_finding · Texto, estados y flujo
**#load-retry[hidden]; .load-in; .btn**
- Actual: Reintentar carga
- Instrucción: El atributo hidden de #load-retry puede ser sobrescrito por .btn{display:flex}; falta una regla específica que garantice su ocultación. Asegurar ocultamiento real y exclusión del foco. En error, colocar el botón «Volver a cargar» después del mensaje, en una columna centrada dentro de .load-in. Separar mensaje y bloque de acciones por 16 CSS px. El botón debe tener una altura mínima de 48 CSS px y un ancho máximo de 260 CSS px, sin desbordar el contenedor. No usar una posición absoluta independiente ni superponerlo al progreso.
- Copy: Volver a cargar
- Aceptación: Durante la carga normal el botón no se ve ni recibe foco con Tab. En error está centrado dentro de .load-in, separado 16 CSS px del mensaje, con al menos 48 CSS px de alto y no más de 260 CSS px de ancho, sin desbordes. Verificar a 320 px, con zoom al 200% y en orientación horizontal. En éxito desaparece toda la capa de carga.
- Referencias: https://jetgames.fun/jetjump/ — index.html:39–51,482–487
- Notas: Causa CSS confirmada en fuente; apariencia por validar; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.
- Coordinación: Aplicar la decisión común Jump: Volver a cargar; bloque centrado .load-in; separación 16 CSS px; mínimo 48 px de alto, máximo 260 px de ancho; sin desbordes. Las medidas citadas en Actual no son la nueva especificación.

## [SRC-JU02] P1 · active_source_finding · Texto, estados y flujo
**Bootstrap/WebGL/import/recursos**
- Actual: No pudimos cargar el juego. Inténtalo de nuevo.; Se interrumpieron los gráficos.
- Instrucción: Implementar estados loading/error/ready con bootstrap de recuperación antes del módulo. Capturar error de import, dependencia, módulo principal, constructor WebGLRenderer y carga de recursos. El constructor actual ocurre antes del try. Añadir recuperación de carga prolongada. No atribuir una falla desconocida a la conexión. El CTA debe tener handler antes de ser visible.
- Copy: No pudimos cargar JET//Jump / [WebGL] Este navegador no pudo iniciar los gráficos 3D. / [red conocida] No pudimos descargar todos los recursos. / [desconocido] La carga se interrumpió. Podés volver a intentarlo. / Volver a cargar / Volver a los juegos
- Aceptación: Bloquear módulo principal, dependencia y recurso; fallar WebGL por separado. Todos llevan a un error accionable y de causa correcta. Reintentar una vez no duplica efectos. Ready retira el loader del foco y no borra guardados.
- Referencias: https://jetgames.fun/jetjump/src/main.js?v=19 —39,48–76,688; index module script
- Notas: Riesgo confirmado en fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [PLAY-JUMP-01] P2 · active · Prueba interactiva y propuestas
**Centrar el botón de recuperación de carga**
- Actual: La barra ocupa x420..760 y está centrada en 590; el botón ocupa x420..586, y413..466, y queda pegado al borde izquierdo de la barra. El logo y el estado están centrados. El defecto se observó a 1180×757.
- Instrucción: Dentro de .load-in, disponer logo, progreso, estado y bloque de acciones en una única columna centrada. Centrar el botón «Volver a cargar» mediante `align-self:center` o un contenedor flex centrado. Mantener 16 CSS px entre el mensaje y el bloque de acciones. El botón debe tener una altura mínima de 48 CSS px y un ancho máximo de 260 CSS px, sin superar el ancho disponible del contenedor. No desplazarlo con offsets absolutos.
- Copy: Volver a cargar
- Aceptación: Verificar a 360/390/768/1180 px: en error, el centro horizontal del botón coincide con el centro del progreso y no hay desbordes. En carga normal, el botón permanece oculto y fuera del orden de foco.
- Referencias: evidence/jump-pass1-loader.jpg
evidence/jump-pass2-retry.jpg
- Notas: Texto propuesto: `Volver a cargar`. El texto actual observado fue `Reintentar carga`.
Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z
- Coordinación: Aplicar la decisión común Jump: Volver a cargar; bloque centrado .load-in; separación 16 CSS px; mínimo 48 px de alto, máximo 260 px de ancho; sin desbordes. Las medidas citadas en Actual no son la nueva especificación.

## [PLAY-JUMP-02] P2 · active · Prueba interactiva y propuestas
**No mezclar carga activa con CTA de error**
- Actual: Inmediatamente al 0%, aparecen simultáneamente `Cargando el juego…` y `Reintentar carga`; no hay un mensaje de error visible aunque WebGL falla.
- Instrucción: Modelar estados excluyentes de carga, error y listo. Durante la carga, mostrar progreso y estado, y ocultar la acción de recuperación. Tras el fallo, reemplazar el estado por una causa comprensible y mostrar «Volver a cargar» sólo si repetir puede recuperar la carga. Ocultar realmente los elementos inactivos y retirarlos del foco y del árbol de accesibilidad.
- Copy: No pudimos descargar todos los recursos.
La carga se interrumpió. Podés volver a intentarlo.
Volver a cargar
- Aceptación: Una carga normal no muestra ni permite enfocar la acción de recuperación. Simular un fallo produce el mensaje y la acción adecuados. La acción queda deshabilitada mientras se reintenta y no duplica cargas.
- Referencias: evidence/jump-pass1-loader.jpg
evidence/jump-pass2-retry.jpg
- Notas: Texto propuesto cuando está confirmado que falló la descarga de recursos: `No pudimos descargar todos los recursos.`
Texto propuesto cuando la causa es desconocida: `La carga se interrumpió. Podés volver a intentarlo.`
Acción de recuperación: `Volver a cargar`. No atribuir el fallo a la conexión sin evidencia.
Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [PLAY-JUMP-03] P2 · active · Prueba interactiva y propuestas
**Manejar incompatibilidad WebGL**
- Actual: La consola informa `THREE.WebGLRenderer: Error creating WebGL context`, `GL_VENDOR=Disabled` y `GL_RENDERER=Disabled`; la interfaz queda indefinidamente al 0%, sin diagnóstico ni salida. Reintentar no cambia el estado.
- Instrucción: Detectar la imposibilidad de crear el renderer antes de iniciar la carga de recursos 3D; mostrar una tarjeta de compatibilidad en vez de un indicador de carga perpetuo. No presentar un fallo WebGL como un fallo de red.
- Copy: Este navegador no pudo iniciar los gráficos 3D.
Probá con un navegador compatible con WebGL y la aceleración gráfica activada.
Volver a los juegos
Volver a cargar
- Aceptación: Con WebGL deshabilitado, aparece un error legible y una navegación de regreso; nunca un indicador de carga infinito. El bloqueo observado pertenece al entorno cloud y no demuestra que el juego falle para todos los usuarios.
- Referencias: evidence/jump-pass1-loader.jpg
evidence/jump-pass2-retry.jpg
- Notas: Texto propuesto: `Este navegador no pudo iniciar los gráficos 3D.` / `Probá con un navegador compatible con WebGL y la aceleración gráfica activada.` Acciones: `Volver a los juegos` y, como secundaria, `Volver a cargar` sólo si permite una recuperación útil; no prometer que recargar habilitará WebGL.
La causa WebGL está respaldada por los mensajes de consola `THREE.WebGLRenderer: Error creating WebGL context`, `GL_VENDOR=Disabled` y `GL_RENDERER=Disabled`. Esto no demuestra un fallo en todos los navegadores.
Ventana de observación: 2026-10-22T13:54:00Z/2026-10-22T14:03:00Z

## [RSP-JUMP-02] P2 · active · Responsive y controles
**Los diálogos anchos deben respetar safe-area lateral**
- Actual: P2 · alta sobre regla; riesgo de recorte dependiente del dispositivo. `current_1410/jetjump.html:185`: `.modal` añade safe-area sólo arriba/abajo y usa 16 px fijos a los lados; `.card.wide` llega a 820 px (220), por lo que en horizontal puede llegar casi al borde con notch.
- Instrucción: `.modal{padding:calc(16px + var(--t)) calc(16px + var(--r)) calc(16px + var(--b)) calc(16px + var(--l));}`. No compensar con zoom CSS ni reducir todos los textos; conservar `max-height:100%;overflow:auto` de `.card` y el gestor inert/foco existente (`main.js:270–282`).
- Copy: 
- Aceptación: Abrir Ayuda/Ajustes/resultados a 768×390 con inset lateral 44 px y verificar que ningún texto/CTA/foco entre en el recorte. El área útil excluye ambas safe-areas.
- Referencias: Archivo: current_1410/jetjump.html
Líneas: 185
Archivo: current_1410/jetjump.html
Líneas: 185,220
Archivo: current_1410/jetjump__jetjump__src__main.js
Líneas: 270–282
- Notas: Regla identificada en fuente con riesgo inferido; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [SRC-JU04] P2 · active_source_finding · Texto, estados y flujo
**#load-bar / #load-prog / #load-txt / loadFail**
- Actual: Cargando recursos: 79 de 83; barra visual aproximadamente 42%; Reintentar carga visible.
- Instrucción: No afirmar que el denominador está mal: width=round(done/total*100), aria-valuenow/max y texto se actualizan desde el mismo callback. CSS anima width durante 250 ms, por lo que una captura puede mostrar retraso transitorio; recursos anidados también cambian el total. Definir un único estado de progreso y comprobar que barra, texto y accesibilidad coincidan una vez asentada la animación. Si no se conoce un total estable, usar progreso por etapas o indeterminado. Tras loadFail, bloquear callbacks tardíos que hoy pueden sobrescribir el mensaje de error con Cargando recursos.
- Copy: Cargando recursos: {cargados} de {total} / {porcentaje}% (sólo si el total es estable).
- Aceptación: Grabar una carga lenta: no hay desacuerdo persistente tras la transición. En 79/83 la barra asentada refleja aproximadamente 95%. Forzar fallo de un recurso mientras otros siguen descargándose: el mensaje de error y sus acciones permanecen, sin regresar a Cargando recursos. No fingir porcentaje 100% antes de ready.
- Referencias: Screenshot del usuario image(20261022-135035).png; /jetjump/index.html:44; /jetjump/src/main.js?v=19:50–57
- Notas: Desajuste observado en una captura; causa exacta no establecida; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-JUMP-01] P2 · active_proposal · Dirección visual interna
**Quitar lente cinematográfica gratuita y conservar luz ecuestre natural**
- Actual: ui_audit/source_review/current_1410/jetjump__jetjump__src__post.js:11–33 GradeShader uGrain=.035, uVig=.32, uCA=.0022, saturación 1.1, contraste pow 1.04; 53 UnrealBloomPass strength .22, radius .6, threshold .92; 49–51 GTAO radius .7, blendIntensity .9. world.js:14–28 fondo skyJpg, environmentIntensity .55, Fog(0xc4d3e2, 140, 420), sol 0xfff1dc/2.6.
- Instrucción: 1. En GradeShader, propuesta inicial: uGrain=0, uCA=0, uVig=.16; conservar el mapeo tonal y orden de pases. 2. Saturación 1.1→1.0 para no añadir color a texturas ya calibradas; conservar el split tonal inicial mientras se comprueba arena/pelajes. 3. Bloom strength .22→.16; no modificar radio/threshold simultáneamente, para poder atribuir el cambio. 4. Preservar GTAO y sombras existentes con sus perfiles de calidad; no aumentar samples ni añadir DOF. 5. Si un perfil móvil no tiene ese pase, no incorporarlo para lograr paridad artificial. Estos números son un preset de propuesta que exige comparación en ejecución, no una corrección demostrada.
- Copy: 
- Aceptación: Prueba futura autorizada en renderer compatible: comparación de pista/rancho con idéntica cámara, calidad y hora; caballo y barras conservan bordes y colores sin fringe/grano. Verificar piel oscura y clara, contraluz y sombras; no perder banderas ni números. Sin incremento de pases, memoria o geometría.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No modificar cámara/FOV, distancia de niebla, iluminación que indique estados, recorrido, obstáculos, suelo físico, animaciones de salto, controles ni cronómetro. No afirmar que se vio una partida en ejecución: las cargas en el entorno cloud de Jump quedaron bloqueadas por WebGL.

## [VIS-JUMP-02] P2 · active_proposal · Dirección visual interna
**Arena legible y vegetación de apoyo, sin competir con caballo/vallas**
- Actual: ui_audit/source_review/current_1410/jetjump__jetjump__src__world.js:37–56 buildGround: textura arena repeticiones aw/5, ah/5, anisotropy 8, roughness 1, normalScale(.7, .7), color 0xe6d3b3; shader diffuseColor*=.93+.07*n. Grass roughness 1/color 0xa9b88f/repeat 90×90; geometría ARENA y plano 900×900.
- Instrucción: 1. Mantener color, mapas y escala del material arena; proponer normalScale(.50, .50) para lectura menos granular. 2. Reducir sólo la amplitud de variación de albedo macro a .96+.04*n, sin cambiar frecuencias, fase o función n. 3. Preservar contraste entre arena y césped y las sombras de contacto. 4. No añadir líneas decorativas que parezcan límites o trayectorias; no poner un grid encima de la pista. 5. Mantener la calidad de árboles y tribunas según perfil existente; lograr subordinación por material, no eliminar elementos interactivos ni alterar LOD sin medir.
- Copy: 
- Aceptación: Prueba futura de cámara a ras y elevada: textura no compite con cascos/barras pero aún distingue arena de césped; los mismos puntos de contacto y sombras coinciden. Comparar captura al 100 % y movimiento lento, HD/bajo, sin moiré o nuevos bordes que sugieran obstáculos.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No tocar ARENA.w/h, malla/altura de suelo, posiciones de vallas, cerco, entrada, colisiones o huellas que tengan función. No reseed de mundo. Conservar dirección de sol y lecturas de superficie que ayudan a juzgar distancias.

## [VIS-JUMP-03] P2 · active_proposal · Dirección visual interna
**Numeración de obstáculos nítida y materiales deportivos consistentes**
- Actual: ui_audit/source_review/current_1410/jetjump__jetjump__src__fences.js:16–23 labelTexture canvas 128×128, borde 6 en 5, 5, 118, 118, fuente Arial 900 a 64/84 px, texto 64, 70; 31–38 madera roughness .8, blanco .5, ladrillo .9, banderas roja0xc0272d/blanca0xf4f4f0 roughness .7. Números en mesh 0.42×0.42; RAIL_R=.05.
- Instrucción: 1. Llevar únicamente la textura de número a 256×256 y escalar todas sus coordenadas/grosor 2×; no ampliar el cartel 3D. 2. Usar Inter 800 si está disponible después de cargar fuentes; fallback Arial 900 con medición previa para centrar uno/dos dígitos. Mantener fondo blanco y texto azul oscuro0x14204a; no oro sobre crema de bajo contraste. 3. Conservar mips/colorSpaceSRGB; comprobar textura nítida sin exigir anisotropy mayor que el perfil actual. 4. Agrupar propiedades por material (madera, pintura, ladrillo, metal), conservando roughness existentes como base, sin aplicar brillo a todas. 5. No cambiar color de banderas para alinearlo con branding.
- Copy: 
- Aceptación: Prueba futura con número 1 y de dos dígitos, aproximación desde el sentido correcto y vista oblicua; no cortar número ni hacer shimmer excesivo. Overlay de mesh antes/después coincide y el mismo salto derriba/no derriba la misma barra. Rojo/blanco conservan su función exacta.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: La geometría y orientación de banderas/números, altura/ancho de barras, secuencia F.n, RAIL_R, física de derribo y comprobación de cascos son intocables. La numeración sigue siendo dato de recorrido, no texto promocional.

## [VIS-JUMP-04] P2 · active_proposal · Dirección visual interna
**HUD de competición: placas de datos sobrias y acción de salto inequívoca**
- Actual: ui_audit/source_review/current_1410/jetjump.html:18–23 tokens verde #0f2a1f, crema #f4ecdb, oro #d4b26a/#ecd598; 94–135 .data fondo #0d241a99, label 11 px/value 16 px, .hbtn 44×44, .gait placa; #jump-wrap.ready usa --ok y .req usa --gold2; #btn-jump[aria-disabled=true] opacity .55.
- Instrucción: 1. Definir superficie de datos rgba(13, 36, 26, .90), borde 1 px rgba(244, 236, 219, .18), radio 8 px; aplicarla a .data, .gait, .keyhelp sin volverlas botones. 2. .data .lbl 12 px/line-height 1.3; cifras 18 px / 800/tabular-nums, unidad 13 px / 600. 3. Acciones .hbtn conservan borde más fuerte rgba(244, 236, 219, .4) y foco dorado 3 px, sin sombra luminosa. 4. Mantener el texto de #jump-state siempre que haya condición; ready y req deben diferenciarse por palabra/indicador además del color. No dar el oro principal a todos los datos. 5. Integrar tamaños nuevos con reflow RSP; no ocultar penalización/tiempo ni invadir caballo o joystick.
- Copy: 
- Aceptación: Prueba futura en entrenamiento/competición, ready/no-disponible, normal/landscape y 320/390 px: datos completos sobre arena clara y césped oscuro; se reconoce qué se puede pulsar. Captura monocroma aún distingue el estado de salto por texto/forma. Los estados cambian en el mismo instante que baseline.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Preservar qué condiciones activan ready/req/disabled, función del botón salto, tamaños táctiles establecidos y semántica de puntuación/unidades. No tocar la ventana de salto ni usar la estética para cambiar dificultad.

## [VIS-JUMP-05] P2 · active_proposal · Dirección visual interna
**Rancho y resultados con la misma voz editorial, no interfaces ajenas**
- Actual: ui_audit/source_review/current_1410/jetjump.html:185–217 .card fondo --panel-solid #11301f, borde --line, radio 18, padding 22; h2 Playfair 28, p 15/1.55; .score b 26 px. Líneas 224–240 #hub/.pill/.spot/.hub-tabs usan verdes, pills y tabs; .spot small 11 px, .hub-tabs botones mínimo 84×46.
- Instrucción: 1. Mantener Playfair sólo para títulos de pantalla/resultado; Inter para navegación, fichas y explicaciones. 2. Jerarquía: título 28/700, encabezado de sección 16/800, cuerpo 15/1.55, metadato 12/1.4; .spot small subir a 12 px y permitir dos líneas sin separar el ancla del punto del mundo. 3. Unificar fondo de panel a #11301f y fondo interno a #183b2b, borde crema al 16 %; no gradientes metálicos ni tarjetas de todos los colores. 4. Resultado: mantener agrupación de penalizaciones y tiempo y números tabulares 26 px; oro sólo al logro que realmente lo merece, no a todo resultado. 5. Alinear radios 18/12/8 para panel/ficha/etiqueta, separaciones 8/12/20 y CTA principal único; preservar todos los enlaces/acciones.
- Copy: 
- Aceptación: Prueba futura: rancho, ficha de caballo, tarea, pausa y resultado consecutivos en ES/EN; mismas escalas tipográficas y contraste, textos largos completos; CTA y cancelación inequívocos. Datos de puntos/tiempo/premio y estado de guardado idénticos a baseline.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar economía, premios, estado de caballo, progress, confirmaciones o navegación; no inventar logro/medalla. No mover el anclaje 3D de spot ni su zona interactiva por un ajuste tipográfico. Mantener RSP de safe areas/foco por encima de cosmética.

## [SRC-JU03] P3 · active_source_finding · Texto, estados y flujo
**Ayuda/pausa/resultados**
- Actual: Controles y reglas; Reintentar recorrido; Volver al inicio
- Instrucción: Unificar el acceso a ayuda bajo Cómo jugar, conservando contenido de controles y reglas. Mantener recorrido como unidad. Preservar la confirmación de reinicio existente, no degradarla a doble toque. Mostrar puntos de penalización y tiempo con unidades.
- Copy: Cómo jugar / Reintentar recorrido / Volver al menú
- Aceptación: Ayuda desde menú o pausa vuelve al estado de origen. Reintentar mantiene el recorrido. Resultados distinguen menos penalizaciones de mejor tiempo.
- Referencias: https://jetgames.fun/jetjump/src/text.js — menu.help; pause; result
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

# Copys ES/EN aplicables
- COPY-common-catalog [SRC-G01, SRC-G03, SRC-G05, SRC-A01, SRC-JU02] es-AR: «Volver a los juegos» | en: «Back to games» | contexto: Destino: catálogo de JET//Games en la ruta canónica ya existente; conservar idioma. No history.back como único destino. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-loading [SRC-G05, SRC-JU02, PLAY-JUMP-02] es-AR: «Cargando {juego}…» | en: «Loading {juego}…» | contexto: Estados de carga excluyentes; mensaje de descarga sólo con fallo de descarga confirmado; desconocido no presupone red. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'juego', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-common-load-unknown [SRC-G05, SRC-JU02, PLAY-JUMP-02] es-AR: «La carga se interrumpió. Podés volver a intentarlo.» | en: «Loading was interrupted. You can try again.» | contexto: Estados de carga excluyentes; mensaje de descarga sólo con fallo de descarga confirmado; desconocido no presupone red. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-load-network [SRC-G05, SRC-JU02, PLAY-JUMP-02] es-AR: «No pudimos descargar todos los recursos.» | en: «We couldn’t download all resources.» | contexto: Estados de carga excluyentes; mensaje de descarga sólo con fallo de descarga confirmado; desconocido no presupone red. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-reload [SRC-G05, SRC-JU01, SRC-JU02, SRC-RA02, PLAY-JUMP-01, PLAY-JUMP-02, PLAY-JUMP-03, RSP-JUMP-01, PLAY-RAID-01, PLAY-BESTIARIO-02] es-AR: «Volver a cargar» | en: «Reload game» | contexto: Recuperación de carga con manejador listo antes de mostrar el botón. En Jump prevalece esta etiqueta, no Reintentar carga. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Reintentar carga']
- COPY-common-webgl [SRC-G05, SRC-JU02, SRC-RA02, PLAY-JUMP-03] es-AR: «Este navegador no pudo iniciar los gráficos 3D.» | en: «This browser couldn’t initialize 3D graphics.» | contexto: Sólo fallo de inicialización WebGL confirmado; no atribuirlo a conexión ni afirmar incompatibilidad universal. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-jump-load-title [SRC-JU02, PLAY-JUMP-03] es-AR: «No pudimos cargar JET//Jump» | en: «We couldn’t load JET//Jump» | contexto: Error WebGL: recomendación, no garantía de que recargar habilite gráficos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-jump-webgl-advice [SRC-JU02, PLAY-JUMP-03] es-AR: «Probá con un navegador compatible con WebGL y la aceleración gráfica activada.» | en: «Try a WebGL-compatible browser with hardware acceleration enabled.» | contexto: Error WebGL: recomendación, no garantía de que recargar habilite gráficos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-jump-progress [SRC-JU04] es-AR: «Cargando recursos: {cargados} de {total}» | en: «Loading resources: {cargados} of {total}» | contexto: Progreso desde estado único. Porcentaje sólo si total estable; no copiar 79/83 como producto ni corregir una fórmula ya correcta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'cargados', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'total', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-jump-progress-percent [SRC-JU04] es-AR: «{porcentaje}%» | en: «{porcentaje}%» | contexto: Progreso desde estado único. Porcentaje sólo si total estable; no copiar 79/83 como producto ni corregir una fórmula ya correcta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'porcentaje', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-jump-help [SRC-JU03] es-AR: «Cómo jugar» | en: «How to play» | contexto: Conservar recorrido y confirmar reinicio como ya sucede. Ayuda vuelve a origen; unidades derivadas del resultado real. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-jump-retry [SRC-JU03] es-AR: «Reintentar recorrido» | en: «Retry course» | contexto: Conservar recorrido y confirmar reinicio como ya sucede. Ayuda vuelve a origen; unidades derivadas del resultado real. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-jump-penalty [SRC-JU03] es-AR: «Penalización: {puntos} puntos» | en: «Penalty: {puntos} points» | contexto: Conservar recorrido y confirmar reinicio como ya sucede. Ayuda vuelve a origen; unidades derivadas del resultado real. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'puntos', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-jump-time [SRC-JU03] es-AR: «Tiempo: {s} s» | en: «Time: {s} s» | contexto: Conservar recorrido y confirmar reinicio como ya sucede. Ayuda vuelve a origen; unidades derivadas del resultado real. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 's', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
