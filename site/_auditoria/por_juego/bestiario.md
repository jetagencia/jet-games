# bestiario: 13 registros del catálogo, 19 copys

## [RSP-BESTIARIO-01] P1 · active · Responsive y controles
**La portada oculta controles de mundo sólo visualmente**
- Actual: P1 · alta · confirmado por fuente. `current_1410/bestiario.html:258` reduce a opacity:0 y pointer-events:none `#esc,#cam,#fs,#coins,#rot,#goal,...` en `.title-on`; la línea 176 hace lo mismo con `#menu`. `current_1410/bestiario__bestiario__src__main.js:560–570` cambia la clase/title.hidden pero no inert de controles. El gestor de paneles sí hace inert correctamente en `panels.js:523–524`: preservar eso.
- Instrucción: En `showTitle(on)`, aplicar estado inert/hidden a todos los controles del mundo mientras la portada esté visible. Mantener #back disponible en la portada sólo cuando no haya un modal abierto: preservar la regla `body.modal-open #back {display:none}` y no forzar el regreso por encima de un modal. Centralizar cálculo `worldDisabled = titleOn || panels.isOpen() || battle.active` para evitar que cerrar un panel quite inert indebidamente cuando el título sigue abierto. El foco de portada debe quedar en Jugar/Continuar y avanzar por acciones visibles; al salir, canvas o control de mundo visible.
- Copy: 
- Aceptación: En portada, Tab no llega a controles transparentes de escena/cámara/mochila; abrir y cerrar Ayuda/Ajustes desde portada mantiene ese aislamiento. En partida los controles recuperan acceso.
- Referencias: Archivo: current_1410/bestiario.html
Líneas: 258
Archivo: current_1410/bestiario__bestiario__src__main.js
Líneas: 560–570
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-BESTIARIO-02] P1 · active · Responsive y controles
**Enter/Espacio cerca de NPC no deben secuestrar Cámara/Menú**
- Actual: P1 · alta · confirmado por fuente. `current_1410/bestiario__bestiario__src__main.js:291`: ante `actTarget` y sin panel, cualquier Enter/Space hace `preventDefault();talk()` sin comprobar foco. El manejador de portada de la línea 578 sí distingue botones/enlaces, pero éste no.
- Instrucción: Aplicar guard para `button,a,input,select,textarea,[contenteditable=true],[role=button]` antes de `talk()`. Permitir Enter/Space como hablar sólo cuando foco está en canvas/cuerpo de mundo; botón `#act` usa click nativo. Añadir a la condición `!titleOn && !battle.active` para no abrir conversación en pantalla no pertinente.
- Copy: 
- Aceptación: Al lado de NPC, Tab→Cámara/Menú/Objetivo→Enter activa ese control, no conversación; sobre canvas Enter abre conversación una sola vez; cierre devuelve foco al disparador.
- Referencias: Archivo: current_1410/bestiario__bestiario__src__main.js
Líneas: 291
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [SRC-BE01] P1 · active_source_finding · Texto, estados y flujo
**Nueva partida desde título→startmode**
- Actual: Nueva partida; Al elegir un inicio se borra tu partida actual...; Empezar
- Instrucción: El título abre newGame→inicio directamente y el botón genérico Empezar ejecuta G.startGame. Hay advertencia de texto, pero no confirmación final separada. Centralizar la confirmación después de elegir modo, enumerando la pérdida. No borrar al abrir el selector. Igualar la protección del título con la del panel de ajustes.
- Copy: Elegir nueva partida / Reemplazar partida actual / Se perderán {criaturas, monedas, progreso}. / Cancelar / Borrar y empezar
- Aceptación: Con progreso, título → Nueva partida → elegir modo no reemplaza hasta confirmar. Cancelar devuelve la partida intacta. Una primera partida no pide confirmación destructiva innecesaria.
- Referencias: https://jetgames.fun/bestiario/src/panels.js —442–445,585,613
- Notas: Riesgo confirmado en fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [PLAY-BESTIARIO-01] P2 · active · Prueba interactiva y propuestas
**Eliminar carga y error contradictorios**
- Actual: Después de fallar WebGL, se muestran simultáneamente No se pudo iniciar y Cargando el pueblo…, sin explicar el motivo. Se reprodujo tanto en la carga inicial como en una recarga normal.
- Instrucción: Hacer mutuamente excluyentes los estados de preparación, carga de recursos, inicio gráfico, listo y fallo. Conservar las guardias de WebGL, importación y errores ya existentes; el problema no es la ausencia de catch. Para un fallo de contexto gráfico, mostrar un título y una explicación específicos y retirar toda actividad de carga ficticia. Diferenciar los fallos gráficos de los de recursos o red. El estado de arranque debe ser la única fuente del texto dinámico: i18n traduce el estado vigente, no lo reemplaza desde una cadena estática de carga. En particular, impedir que paint() reponga el data-en de #boot-msg después de fail(); cambiar de idioma o recibir DOMContentLoaded debe conservar y traducir el error actual, no volver a «Cargando el pueblo…».
- Copy: No pudimos iniciar los gráficos 3D.
Este navegador no pudo crear el contexto gráfico que necesita Bestiario.
Cargando el pueblo…
- Aceptación: En pruebas controladas de cada tipo de fallo, sólo queda visible la explicación que corresponde. El texto y la actividad de carga desaparecen al entrar en error. Cambiar de idioma o ejecutar el repintado de textos mantiene el estado de error y su diagnóstico; alcanzar listo elimina el error sin reintroducir textos de carga.
- Referencias: evidence/bestiario-pass1-blocked.jpg
evidence/bestiario-pass2-reload-blocked.jpg
- Notas: Ventana de observación: 2026-10-22T16:16:00Z/2026-10-22T16:18:10Z
Cobertura: Dos intentos de carga bloqueados; cero partidas.
La fuente final guardada conserva try/catch al crear THREE.WebGLRenderer y guardias de arranque. En bestiario.html, #boot-msg tiene data-en="Loading the village…"; paint(), líneas 295–315, repinta atributos estáticos, y fail(), líneas 321–324, escribe el error. Un repintado posterior puede reponer el texto de carga: es un mecanismo compatible con la contradicción observada, no una prueba del orden exacto de eventos del navegador en esos intentos.

## [PLAY-BESTIARIO-02] P2 · active · Prueba interactiva y propuestas
**Agregar recuperación y ayuda dentro del fallo**
- Actual: La pantalla de error sólo ofrece el regreso JET//Games arriba a la izquierda. No hay reintento, ayuda ni diagnóstico visibles, por lo que la segunda prueba requirió recargar desde el navegador.
- Instrucción: Centrar bajo la explicación un grupo con «Volver a cargar» y «Volver a JET//Games», seguido de ayuda técnica desplegable. Mantener también el regreso superior. Dar menor jerarquía a la acción secundaria sin ocultarla. Si vuelve a fallar, conservar el estado y ofrecer probar otro navegador o dispositivo compatible sin prometer éxito ni exigir instalar nada. La recuperación no debe borrar almacenamiento, progreso o preferencias, ni crear una partida como efecto secundario del reintento.
- Copy: Volver a cargar
Volver a JET//Games
Ver ayuda y detalles
Si el problema continúa, probá otro navegador o dispositivo compatible.
- Aceptación: Las acciones de recargar, volver y desplegar ayuda funcionan con ratón, pantalla táctil y teclado. Una recarga normal puede repetirse sin crear partidas ni borrar progreso local. El grupo de acciones no desborda a 360 px.
- Referencias: evidence/bestiario-pass1-blocked.jpg
- Notas: Ventana de observación: 2026-10-22T16:16:00Z/2026-10-22T16:18:10Z
Cobertura: Dos intentos de carga bloqueados; cero partidas.

## [PLAY-BESTIARIO-03] P2 · active · Prueba interactiva y propuestas
**No exponer HUD de un mundo que no inició**
- Actual: Detrás del fallo, el árbol de accesibilidad conserva Girar cámara, Mochila, Cambiar escenario, Cambiar vista y Menú, aunque el pueblo no llegó a renderizarse. El foco está en el documento, no en una región de error.
- Instrucción: Deshabilitar o retirar semánticamente el HUD hasta que la inicialización termine correctamente. En caso de fallo, volverlo inert y presentar una región de error con foco gestionado. Recuperar los controles sólo cuando el mundo y sus datos estén listos; no permitir acciones sobre una partida parcialmente cargada. Vincular la disponibilidad del HUD al mismo estado de arranque que controla los mensajes, no a la mera desaparición visual del cargador.
- Copy: Bestiario no pudo iniciar
Estado del juego: no disponible
- Aceptación: Durante el error, Tab y el lector sólo alcanzan las acciones de recuperación. Cámara, mochila y escenarios no se activan hasta que el juego esté listo. La recuperación accesible no implica afirmar que se verificó una partida en funcionamiento durante esta auditoría.
- Referencias: evidence/bestiario-pass2-reload-blocked.jpg
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

## [SRC-BE02] P2 · active_source_finding · Texto, estados y flujo
**Combinar criaturas**
- Actual: Combinar; Confirmar: {nombre} desaparece
- Instrucción: No depender exclusivamente de un segundo toque rápido para consumir una criatura. Mostrar conservada, consumida, nivel antes/después y costo juntos. La confirmación debe nombrar la criatura que desaparece. Separar precio de acción en compras; no confundir forma visual con fusión.
- Copy: Fusionar criaturas / {conservada} conservará... {consumida} desaparecerá. / Cancelar / Fusionar y consumir {nombre}
- Aceptación: Al seleccionar A/B queda claro quién permanece. Cancelar no consume criatura ni monedas. Doble clic no ejecuta dos fusiones.
- Referencias: https://jetgames.fun/bestiario/src/panels.js —311,543–546
- Notas: Recomendación de texto para una acción destructiva; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-BESTIARIO-01] P2 · active_proposal · Dirección visual interna
**Caminos integrados a cada bioma con la misma cartografía**
- Actual: ui_audit/source_review/current_1410/bestiario__bestiario__src__themes.js:19–66 define ceniza, fortaleza, pantano, volcanico, nevado, cada uno con ground/tint/fog/luces; no hay campo path en esos 5 objetos. world.js:297 usa PATH=theme.path[0] o 0x93805e y PATH_EDGE=theme.path[1] o 0x6c5b42; 298–308 pathRect define dimensiones y keepRect.
- Instrucción: 1. Usar la extensión theme.path ya prevista, con pares iniciales de propuesta: ceniza[0x93805e, 0x6c5b42]; fortaleza[0x7c8894, 0x525d69]; pantano[0x7c7053, 0x464a30]; volcanico[0x8b6554, 0x4b3933]; nevado[0x9da7ad, 0x626e78]. 2. Comprobar cómo tintColor/weathered transforma cada par: ajustar sólo colores de theme.path si el material final pierde separación del suelo. 3. Conservar el mismo borde de camino sin dibujar líneas nuevas ni flechas universales; cada bioma mantiene sus árboles, roca y luz. 4. No retirar nieve, lava o charcos por homogenización. La coherencia viene de jerarquía de valor/lectura de camino, no de una misma paleta para todo.
- Copy: 
- Aceptación: Prueba futura: misma cámara/mapa en los 5 biomas, caminando por los mismos puntos; ruta reconocible y no confundible con borde sólido. Superponer la malla y datos de colisión antes/después: deben coincidir exactamente. Validar también vista mapa, donde el código ya elimina niebla de forma propia.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar ninguna llamada pathRect, keepRect, keepCircle, colliders, ancho/altura/posición de vías, punto de entrada o zonas. No cambiar fog.near/far ni revelar caminos ocultos. No modificar seed ni distribución de edificios.

## [VIS-BESTIARIO-02] P2 · active_proposal · Dirección visual interna
**Criaturas: piel, hueso y membrana con acabado orgánico diferenciado**
- Actual: ui_audit/source_review/current_1410/bestiario__bestiario__src__model3d.js:29–34 DRAGON_SKINS ceniza/sangre/abismo/podrido; 37 piel roughness .5/metalness .05, shader 53 roughnessFactor=.42+.26*sR, 54 brasas*=1.6; 61 hueso roughness .36/metalness .04; 80 membrana roughness .6/metalness 0, 81 ojo emisivo 2.2. Atributos _seam y _grad pintan material del GLB.
- Instrucción: 1. Mantener los 4 esquemas de color y la separación por slots. Propuesta de primera pasada: piel shader roughnessFactor=.52+.24*sR y metalness 0; hueso roughness .48 y metalness 0; membrana conservar .6/0. 2. No borrar _seam ni _grad: las hendiduras y placas siguen dando estructura, no reemplazarlas por textura genérica. 3. Mantener emisiones de brasas/ojos hasta validar cada skin; no subirlas ni añadir bloom/outline para hacer destacar al personaje. 4. Evaluar piel y hueso en luz de cada bioma; si una especie usa otro pipeline, no aplicarle ciegamente valores de dragón. 5. No modificar mesh, silueta, proporciones ni armature para mejorar la vista.
- Copy: 
- Aceptación: Prueba futura de dragón en 4 skins y 5 biomas, reposo/movimiento, low/high LOD: piel más mate que ojos, hueso legible sin brillos metálicos; detalles no se borran en zonas oscuras. Silueta y estados son idénticos. Registrar que otras especies fueron revisadas o quedaron explícitamente pendientes.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Conservar skins adquiridas, identificación de especie/forma, materiales que indiquen estado, animación, joints, hitboxes y parámetros de combate. No tocar forms.js ni assets GLB en esta pasada cosmética. No presentar «parece plástico» como hecho visto: estos son valores de propuesta sobre fuente.

## [VIS-BESTIARIO-03] P2 · active_proposal · Dirección visual interna
**Señales de entrada a zonas: menos pulso, más relación con el lugar**
- Actual: ui_audit/source_review/current_1410/bestiario__bestiario__src__world.js:358–368 addZone usa RingGeometry(r-.24, r, 56), ring opacity .7 y fill opacity .14.1125–1131 actualiza escala 1+.035*sin(t*3+z.x), ring opacity=.55+.18*sin+.25*active, fill=.12+.2*active. Cada zona usa def.css.
- Instrucción: 1. Conservar exactamente geometría, escala y posición del anillo y su color de zona; no tocar el seno de escala en esta pasada de materiales. 2. Proponer opacidad de anillo .45 inactivo/.85 activo y relleno .06/.18, interpolados desde fx.active existente; retirar sólo la oscilación adicional de opacidad .18*sin. 3. Mantener la transición de entrada existente y el rótulo/acción correspondiente como confirmación de foco. 4. No agregar círculos brillantes a NPCs que no eran zonas. 5. No añadir loops de brillo. Coordinar cualquier cambio del movimiento reducido con la política de animación del producto en un cambio separado, sin alterar el área de interacción.
- Copy: 
- Aceptación: Prueba futura de entrada/salida de tienda, enfermería, gimnasio y otras zonas reales: mismo momento de activación, misma área y misma geometría. Capturas estáticas distinguen activo/inactivo por contraste y rótulo. Puertas siguen abriendo/cerrando y colisionando igual; comparar sus datos antes y después. El estilo no crea un radio nuevo ni modifica def.r.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar def.r, rg.r, centros, geometría de zona, comparación activeId, rango de interacción o colliders. No tocar la animación de puertas ni doorBox.off adyacentes en el mismo update: tienen efecto jugable.

## [VIS-BESTIARIO-04] P2 · active_proposal · Dirección visual interna
**Fichas de criaturas y tienda: una jerarquía cálida, no un inventario uniforme**
- Actual: ui_audit/source_review/current_1410/bestiario__bestiario__src__ui.css:51–78 #mcard, accent #e8c05a, fondo rgba(14, 17, 23, .96), h2 18 px uppercase/tracking .1em; 86–112 .row/.cc fondo blanco .04, borde blanco .07, icon 46 px, b 15 px, small 12 px; .pr color #f0d49a, .row.dim opacity .62; .rtbutton estados poor/on/sel/work. bestiario.html:38–41 --glass rgba(9, 11, 15, .74), --ink #e9e6df, Poppins.
- Instrucción: 1. Mantener Poppins y el acento cálido existente. Título de panel 20 px / 700, tracking .02em y caja normal; nombres de criatura 16 px / 700; secundario 13 px/1.4; precio 14 px / 700 tabular. 2. Fondo panel #0e1117, fichas #191e25 y borde rgba(233, 230, 223, .14); ficha seleccionada conserva color de especie/estado en un borde 2 px y texto, no tintar toda la fila. 3. No aplicar opacity .62 al contenedor completo de una opción no disponible: dim sólo ilustración decorativa; nombre/precio/motivo deben permanecer legibles. 4. Mantener oro para moneda/acción primaria; no representar «en curso» como «comprado» por usar mismo relleno . 5. Conservar reflow móvil; no aumentar tamaño de imagen a costa de ocultar costo o criatura consumida.
- Copy: 
- Aceptación: Prueba futura con fichas largas, falta de monedas, poseída, seleccionada, en trabajo; cada estado tiene palabra/icono además del color. ES/EN a 320/390/768 y 200 % texto: precio y acción completos, sin cortar nombre. Comparar datos y orden del inventario antes/después.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar orden, filtros, categorías, precio, disponibilidad, selección, confirmación de fusión o compras. La fila no se vuelve clickable si no lo era. Conservar color de especie y rótulos de consecuencias. No ejecutar transacciones durante QA cosmética.

## [VIS-BESTIARIO-05] P2 · active_proposal · Dirección visual interna
**Barras de vida/experiencia: cantidades claras y transición sin ambigüedad**
- Actual: ui_audit/source_review/current_1410/bestiario__bestiario__src__ui.css:117–129 .hp flex, bars 7 px, background blanco .1; .bar i verde #5fd6a4, transition width .35s; .bar.low rojo #ff6a4c, .bar.xp azul #6ab4f0, .bar.stat var(--accent); .hp span 12 px/min-width 78, .stats 12 px.
- Instrucción: 1. Mantener semántica verde vida/rojo baja/azul XP/oro stat; aumentar altura visual a 8 px con pista #323b46 y radio 4 px, sin brillo. 2. Números actuales/máximo en 13 px/tabular-nums junto a cada barra; nombres completos accesibles/visibles cuando la ficha tenga más de una métrica. 3. Mostrar el valor nuevo inmediatamente; animar sólo relleno 180 ms lineal para no dejar la cifra retrasada. En reduced-motion, sin transición. 4. Barra de cero debe verse como pista vacía con cifra 0, no desaparecer; máximo no debe sobresalir. 5. No inventar porcentajes o resultados futuros ni restar recursos como efecto de animación.
- Copy: 
- Aceptación: Prueba futura en 0, 1, casi lleno, máximo y actualización rápida: cifra coincide con dato antes/durante/después de transición; vida/XP no se confunden, ningún resultado se pierde al cambiar de ficha. Revisar tamaños compacto/normal y movimiento reducido.
- Referencias: Ver evidencia actual
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Usar los valores del modelo actual, no recalcular límites ni modificar thresholds low. No cambiar daño, curación, XP, progreso o timing de combate. Ancho visual se calcula desde la misma métrica y sólo se limita a 0..100 % para pintado; no mutar dato.

# Copys ES/EN aplicables
- COPY-common-cancel [SRC-G04, SRC-R02, SRC-AN01, SRC-E02, SRC-BE01, SRC-BE02, RSP-MODALS-01, RSP-BALIZAS-02, PLAY-BALIZAS-05] es-AR: «Cancelar» | en: «Cancel» | contexto: Cancelación real: no cobrar, borrar, publicar, fusionar ni sustituir estado. Foco inicial en confirmaciones destructivas. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-reload [SRC-G05, SRC-JU01, SRC-JU02, SRC-RA02, PLAY-JUMP-01, PLAY-JUMP-02, PLAY-JUMP-03, RSP-JUMP-01, PLAY-RAID-01, PLAY-BESTIARIO-02] es-AR: «Volver a cargar» | en: «Reload game» | contexto: Recuperación de carga con manejador listo antes de mostrar el botón. En Jump prevalece esta etiqueta, no Reintentar carga. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Reintentar carga']
- COPY-bestiario-choose-new [SRC-BE01] es-AR: «Elegir nueva partida» | en: «Choose a new game» | contexto: Enumerar criaturas/monedas/progreso reales afectados después de elegir modo. Abrir selector no borra. Primera partida sin progreso no necesita confirmación destructiva. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-bestiario-replace [SRC-BE01] es-AR: «Reemplazar partida actual» | en: «Replace current game» | contexto: Enumerar criaturas/monedas/progreso reales afectados después de elegir modo. Abrir selector no borra. Primera partida sin progreso no necesita confirmación destructiva. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-bestiario-losses [SRC-BE01] es-AR: «Se perderán {datos concretos}.» | en: «You’ll lose {datos concretos}.» | contexto: Enumerar criaturas/monedas/progreso reales afectados después de elegir modo. Abrir selector no borra. Primera partida sin progreso no necesita confirmación destructiva. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'datos concretos', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-bestiario-delete-start [SRC-BE01] es-AR: «Borrar y empezar» | en: «Delete and start» | contexto: Enumerar criaturas/monedas/progreso reales afectados después de elegir modo. Abrir selector no borra. Primera partida sin progreso no necesita confirmación destructiva. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-bestiario-merge [SRC-BE02] es-AR: «Fusionar criaturas» | en: «Fuse creatures» | contexto: Mostrar nombre conservado/consumido, nivel antes/después y coste de estado vigente. {costo} incluye unidad real ya localizada. No inventar regla de herencia ni costo. Confirmación no es doble toque temporal. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Combinar']
- COPY-bestiario-merge-effects [SRC-BE02] es-AR: «{conservada} se conserva. {consumida} desaparecerá.» | en: «{conservada} will be kept. {consumida} will disappear.» | contexto: Mostrar nombre conservado/consumido, nivel antes/después y coste de estado vigente. {costo} incluye unidad real ya localizada. No inventar regla de herencia ni costo. Confirmación no es doble toque temporal. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'conservada', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'consumida', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-bestiario-merge-level [SRC-BE02] es-AR: «Nivel: {antes} → {después}» | en: «Level: {antes} → {después}» | contexto: Mostrar nombre conservado/consumido, nivel antes/después y coste de estado vigente. {costo} incluye unidad real ya localizada. No inventar regla de herencia ni costo. Confirmación no es doble toque temporal. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'antes', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'después', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-bestiario-merge-cost [SRC-BE02] es-AR: «Costo: {costo}» | en: «Cost: {costo}» | contexto: Mostrar nombre conservado/consumido, nivel antes/después y coste de estado vigente. {costo} incluye unidad real ya localizada. No inventar regla de herencia ni costo. Confirmación no es doble toque temporal. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'costo', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-bestiario-confirm-merge [SRC-BE02] es-AR: «Fusionar y consumir {nombre}» | en: «Fuse and consume {nombre}» | contexto: Mostrar nombre conservado/consumido, nivel antes/después y coste de estado vigente. {costo} incluye unidad real ya localizada. No inventar regla de herencia ni costo. Confirmación no es doble toque temporal. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'nombre', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-bestiario-graphics-failed [PLAY-BESTIARIO-01, PLAY-BESTIARIO-02, PLAY-BESTIARIO-03] es-AR: «No pudimos iniciar los gráficos 3D.» | en: «We couldn’t initialize 3D graphics.» | contexto: Dos intentos bloqueados, cero partidas. La guardia de import/WebGL ya existe: conservarla y corregir estados visibles/semánticos, no afirmar que falta. Cargando y fallo son excluyentes. En fatal retirar HUD/cámara/mochila/escenarios de interacción y AX; restaurarlos sólo cuando mundo/controles están listos. Mantener retorno superior y grupo de recuperación propuesto. | condición: Mensaje de contexto sólo para ese error; red/recurso o desconocido usa su diagnóstico real. Consejo de compatibilidad es sugerencia, no promesa ni requisito de instalar software. No repetir Cargando el pueblo durante fallo ni ofrecer acciones del mundo sin inicializar. | params: [] | citas actuales: []
- COPY-bestiario-context-failed [PLAY-BESTIARIO-01, PLAY-BESTIARIO-02, PLAY-BESTIARIO-03] es-AR: «Este navegador no pudo crear el contexto gráfico que necesita Bestiario.» | en: «This browser couldn’t create the graphics context that Bestiario needs.» | contexto: Dos intentos bloqueados, cero partidas. La guardia de import/WebGL ya existe: conservarla y corregir estados visibles/semánticos, no afirmar que falta. Cargando y fallo son excluyentes. En fatal retirar HUD/cámara/mochila/escenarios de interacción y AX; restaurarlos sólo cuando mundo/controles están listos. Mantener retorno superior y grupo de recuperación propuesto. | condición: Mensaje de contexto sólo para ese error; red/recurso o desconocido usa su diagnóstico real. Consejo de compatibilidad es sugerencia, no promesa ni requisito de instalar software. No repetir Cargando el pueblo durante fallo ni ofrecer acciones del mundo sin inicializar. | params: [] | citas actuales: []
- COPY-bestiario-loading-town [PLAY-BESTIARIO-01, PLAY-BESTIARIO-02, PLAY-BESTIARIO-03] es-AR: «Cargando el pueblo…» | en: «Loading the village…» | contexto: Dos intentos bloqueados, cero partidas. La guardia de import/WebGL ya existe: conservarla y corregir estados visibles/semánticos, no afirmar que falta. Cargando y fallo son excluyentes. En fatal retirar HUD/cámara/mochila/escenarios de interacción y AX; restaurarlos sólo cuando mundo/controles están listos. Mantener retorno superior y grupo de recuperación propuesto. Revalidación final: paint() de i18n puede repintar #boot-msg desde data-en=Loading the village… si se ejecuta tras fail(); es compatible con el estado observado, pero no se verificó aquí el orden de eventos runtime; loading/error/ready deben ser dueños del texto y i18n traducir el estado vigente sin restaurar cargando. Guardias de import/WebGL existentes se conservan. | condición: Sólo durante carga real del pueblo y antes de ready/error. Ocultar/remover también de AX al entrar en fatal; no dejarlo detrás de mensaje visible de error. | params: [] | citas actuales: ['Cargando el pueblo…', 'Loading the village…']
- COPY-bestiario-start-failed [PLAY-BESTIARIO-01, PLAY-BESTIARIO-02, PLAY-BESTIARIO-03] es-AR: «Bestiario no pudo iniciar» | en: «Bestiario could not start» | contexto: Dos intentos bloqueados, cero partidas. La guardia de import/WebGL ya existe: conservarla y corregir estados visibles/semánticos, no afirmar que falta. Cargando y fallo son excluyentes. En fatal retirar HUD/cámara/mochila/escenarios de interacción y AX; restaurarlos sólo cuando mundo/controles están listos. Mantener retorno superior y grupo de recuperación propuesto. | condición: Mensaje de contexto sólo para ese error; red/recurso o desconocido usa su diagnóstico real. Consejo de compatibilidad es sugerencia, no promesa ni requisito de instalar software. No repetir Cargando el pueblo durante fallo ni ofrecer acciones del mundo sin inicializar. | params: [] | citas actuales: ['No se pudo iniciar']
- COPY-bestiario-unavailable [PLAY-BESTIARIO-01, PLAY-BESTIARIO-02, PLAY-BESTIARIO-03] es-AR: «Estado del juego: no disponible» | en: «Game status: unavailable» | contexto: Dos intentos bloqueados, cero partidas. La guardia de import/WebGL ya existe: conservarla y corregir estados visibles/semánticos, no afirmar que falta. Cargando y fallo son excluyentes. En fatal retirar HUD/cámara/mochila/escenarios de interacción y AX; restaurarlos sólo cuando mundo/controles están listos. Mantener retorno superior y grupo de recuperación propuesto. | condición: Mensaje de contexto sólo para ese error; red/recurso o desconocido usa su diagnóstico real. Consejo de compatibilidad es sugerencia, no promesa ni requisito de instalar software. No repetir Cargando el pueblo durante fallo ni ofrecer acciones del mundo sin inicializar. | params: [] | citas actuales: []
- COPY-bestiario-help-details [PLAY-BESTIARIO-01, PLAY-BESTIARIO-02, PLAY-BESTIARIO-03] es-AR: «Ver ayuda y detalles» | en: «View help and details» | contexto: Dos intentos bloqueados, cero partidas. La guardia de import/WebGL ya existe: conservarla y corregir estados visibles/semánticos, no afirmar que falta. Cargando y fallo son excluyentes. En fatal retirar HUD/cámara/mochila/escenarios de interacción y AX; restaurarlos sólo cuando mundo/controles están listos. Mantener retorno superior y grupo de recuperación propuesto. | condición: Mensaje de contexto sólo para ese error; red/recurso o desconocido usa su diagnóstico real. Consejo de compatibilidad es sugerencia, no promesa ni requisito de instalar software. No repetir Cargando el pueblo durante fallo ni ofrecer acciones del mundo sin inicializar. | params: [] | citas actuales: []
- COPY-bestiario-back-games [PLAY-BESTIARIO-01, PLAY-BESTIARIO-02, PLAY-BESTIARIO-03] es-AR: «Volver a JET//Games» | en: «Back to JET//Games» | contexto: Dos intentos bloqueados, cero partidas. La guardia de import/WebGL ya existe: conservarla y corregir estados visibles/semánticos, no afirmar que falta. Cargando y fallo son excluyentes. En fatal retirar HUD/cámara/mochila/escenarios de interacción y AX; restaurarlos sólo cuando mundo/controles están listos. Mantener retorno superior y grupo de recuperación propuesto. | condición: Mensaje de contexto sólo para ese error; red/recurso o desconocido usa su diagnóstico real. Consejo de compatibilidad es sugerencia, no promesa ni requisito de instalar software. No repetir Cargando el pueblo durante fallo ni ofrecer acciones del mundo sin inicializar. | params: [] | citas actuales: []
- COPY-bestiario-compatible-browser [PLAY-BESTIARIO-01, PLAY-BESTIARIO-02, PLAY-BESTIARIO-03] es-AR: «Si el problema continúa, probá otro navegador o dispositivo compatible.» | en: «If the problem continues, try another compatible browser or device.» | contexto: Dos intentos bloqueados, cero partidas. La guardia de import/WebGL ya existe: conservarla y corregir estados visibles/semánticos, no afirmar que falta. Cargando y fallo son excluyentes. En fatal retirar HUD/cámara/mochila/escenarios de interacción y AX; restaurarlos sólo cuando mundo/controles están listos. Mantener retorno superior y grupo de recuperación propuesto. | condición: Mensaje de contexto sólo para ese error; red/recurso o desconocido usa su diagnóstico real. Consejo de compatibilidad es sugerencia, no promesa ni requisito de instalar software. No repetir Cargando el pueblo durante fallo ni ofrecer acciones del mundo sin inicializar. | params: [] | citas actuales: []
